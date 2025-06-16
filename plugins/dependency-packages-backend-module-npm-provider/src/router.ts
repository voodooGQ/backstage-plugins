import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';
import { z } from 'zod';
import { InputError } from '@backstage/errors';
import { PackageJsonRetriever } from './retriever/PackageJsonRetriever';

export interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter({ logger }: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.post('/retrieve', async (req, res) => {
    // const retrieveSchema = z.object({
    //   entities: z.array(z.object({
    //     metadata: z.object({
    //       annotations: z.object({
    //         'package-deps/npm': z.string(),
    //       }),
    //     }),
    //   })),
    // });

    // const parsed = retrieveSchema.safeParse(req.body);

    // if (!parsed.success) {
    //   throw new InputError(parsed.error.toString());
    // }

    logger.info('Retrieving NPM Entities');
    const retriever = new PackageJsonRetriever({ logger });
    const entities = await retriever.retrieve(req.body.entities);
    res.status(201).json({ message: 'success', data: entities });
  });

  return router;
}
