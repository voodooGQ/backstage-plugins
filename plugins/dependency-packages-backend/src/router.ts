import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { DependencyTypeRegistration } from '@voodoogq/plugin-dependency-packages-node';
import { HttpAuthService, LoggerService, PermissionsService } from '@backstage/backend-plugin-api';

export interface RouterOptions {
  dependencyTypes: DependencyTypeRegistration[];
  logger: LoggerService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
}

export async function createRouter({ dependencyTypes }: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const dependencyTypeSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/dependency-types', async (req, res) => {
    const parsed = dependencyTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    res.status(201).json({ message: 'success', data: dependencyTypes });
  });

  return router;
}
