import express from 'express';
import Router from 'express-promise-router';
import { DependencyTypeRegistration } from '@voodoogq/plugin-dependency-packages-node';
import {
  HttpAuthService,
  LoggerService,
  PermissionsService
} from '@backstage/backend-plugin-api';
import { BaseConfig } from '@voodoogq/plugin-dependency-packages-common';
import { retrieveDefaultOwnerEntity } from './services/retrieveDefaultOwnerEntity';
import { AuthService } from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';

export interface RouterOptions {
  baseConfig: BaseConfig;
  dependencyTypes: DependencyTypeRegistration[];
  httpAuth: HttpAuthService;
  logger: LoggerService;
  // TODO: Need to integration permissions

  permissions: PermissionsService;
  auth: AuthService;
  catalog: CatalogService;
}

export async function createRouter({
  baseConfig,
  dependencyTypes,
  catalog,
  auth,
}: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  /**
   * Return base config values
   */
  router.get('/config', async (_req, res) => {
    res.status(201).json({ message: 'success', data: baseConfig });
  })

  /**
   * Return the default owner group entity
   */
  router.get('/default-owner', async (_req, res) => {
    const defaultOwner = await retrieveDefaultOwnerEntity({
      catalog,
      auth,
      baseConfig,
    });
    res.status(201).json({ message: 'success', data: defaultOwner });
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
   * Extend the module routers
   */
  dependencyTypes.forEach(type => {
    router.use(`/${type.dependencyType.id}`, type.dependencyType.router);
  });

  return router;
}
