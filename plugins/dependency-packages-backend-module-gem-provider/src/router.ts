import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';
import { z } from 'zod';
import { InputError } from '@backstage/errors';
import { ComponentEntity, GroupEntity } from "@backstage/catalog-model";
import { PACKAGE_DEPS_GEM_ANNOTATION } from "./constants";
import { GemfileLockRetriever } from './retriever/GemfileLockRetriever';
import { DependencyReferenceParser } from './parser';
import { GemComponentEntityBuilder } from './builder/GemComponentEntityBuilder';

export interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter({ logger }: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.post('/retrieve', async (req, res) => {
    // Make sure we have a Component Entity with the write annotations
    const schema = z.object({
      entities: z.array(
        z.object({
          kind: z.literal('Component'),
          metadata: z.object({
            annotations: z.object({
              [PACKAGE_DEPS_GEM_ANNOTATION]: z.string()
            }).passthrough(),
          }).passthrough()
        }).passthrough()
      ),
      owner: z.object({
        kind: z.literal('Group'),
      }).passthrough(),
      lifecycle: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const retriever = new GemfileLockRetriever({ logger });
    const deps = await retriever.retrieve(parsed.data.entities as unknown as ComponentEntity[]);
    const paraser = new DependencyReferenceParser();
    const parsedDeps = await paraser.parse(deps);
    const builder = new GemComponentEntityBuilder();
    const entities = await builder.build({
      parsedDependencies: parsedDeps,
      owner: parsed.data.owner as unknown as GroupEntity,
      lifecycle: parsed.data.lifecycle,
    })
    res.status(201).json({ message: 'success', data: entities });
  });

  return router;
}
