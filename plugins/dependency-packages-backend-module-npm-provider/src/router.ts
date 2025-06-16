import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter({ logger }: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/retrieve', async (_req, res) => {
    logger.info('Retrieving NPM Entities');
    res.status(201).json({ message: 'success', data: [] });
  });

  return router;
}
