import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';
import { z } from 'zod';
import { InputError } from '@backstage/errors';
import { PackageJsonRetriever } from './retriever/PackageJsonRetriever';
import { ComponentEntity } from '@backstage/catalog-model';
import { PACKAGE_DEPS_NPM_ANNOTATION } from './constants';
import { DependencyReferenceParser } from './parser/DependencyReferenceParser';
import { NpmComponentEntityBuilder } from './builder/NpmComponentEntityBuilder';

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
              [PACKAGE_DEPS_NPM_ANNOTATION]: z.string()
            }).passthrough(),
          }).passthrough()
        }).passthrough()
      )
    })

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    logger.info('Retrieving NPM Entities');
    const retriever = new PackageJsonRetriever({ logger });
    const deps = await retriever.retrieve(parsed.data.entities as unknown as ComponentEntity[]);
    const parser = new DependencyReferenceParser();
    const parsedDeps = await parser.parse(deps);
    const builder = new NpmComponentEntityBuilder();
    const entities = builder.build(parsedDeps);

    res.status(201).json({ message: 'success', data: entities });
  });

  return router;
}
