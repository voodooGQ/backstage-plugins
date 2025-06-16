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

  router.get('/dependency-types', async (_req, res) => {
    const data = dependencyTypes.map(type => ({
      id: type.dependencyType.id,
      annotation: type.dependencyType.annotation
    }));
    res.status(201).json({ message: 'success', data });
  });

  // Extend the modules router
  dependencyTypes.forEach(type => {
    router.use(`/${type.dependencyType.id}`, type.dependencyType.router);
  });

  return router;
}
