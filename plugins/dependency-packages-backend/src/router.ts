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

  // const dependencyTypeSchema = z.object({
  //   title: z.string(),
  //   entityRef: z.string().optional(),
  // });

  router.get('/dependency-types', async (_req, res) => {
    // const parsed = dependencyTypeSchema.safeParse(req.body);
    // if (!parsed.success) {
    //   throw new InputError(parsed.error.toString());
    // }

    const data = dependencyTypes.map(type => type.dependencyType.id);
    res.status(201).json({ message: 'success', data });
  });

  dependencyTypes.forEach(type => {
    console.log(type.dependencyType);
    router.use(`/${type.dependencyType.id}`, type.dependencyType.router);
  });

  return router;
}
