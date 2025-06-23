import express from 'express';
import Router from 'express-promise-router';
import { DependencyTypeRegistration } from '@voodoogq/plugin-dependency-packages-node';
import { HttpAuthService, LoggerService, PermissionsService } from '@backstage/backend-plugin-api';
import { BaseConfig } from '@voodoogq/plugin-dependency-packages-common';

export interface RouterOptions {
  dependencyTypes: DependencyTypeRegistration[];
  logger: LoggerService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  baseConfig: BaseConfig;
}

export async function createRouter({ dependencyTypes, baseConfig }: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  /**
   * Return base config values
   */
  router.get('/config', async (_req, res) => {
    res.status(201).json({ message: 'success', data: baseConfig });
  })

  /**
   * Return all dependency types
   */
  router.get('/dependency-types', async (_req, res) => {
    const data = dependencyTypes.map(type => ({
      id: type.dependencyType.id,
      annotation: type.dependencyType.annotation
    }));
    res.status(201).json({ message: 'success', data });
  });

  /**
   * Extend the modules router
   */
  dependencyTypes.forEach(type => {
    router.use(`/${type.dependencyType.id}`, type.dependencyType.router);
  });

  return router;
}
