import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';
import { InputError } from '@backstage/errors';
import { DependencyType } from '@voodoogq/plugin-dependency-packages-node';
import {
  HttpAuthService,
  LoggerService,
  PermissionsService
} from '@backstage/backend-plugin-api';
import { BaseConfig } from '@voodoogq/plugin-dependency-packages-common';
import { retrieveDefaultOwnerEntity } from './plugin/retrieveDefaultOwnerEntity';
import { AuthService } from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';

export interface RouterOptions {
  baseConfig: BaseConfig;
  dependencyTypes: DependencyType[];
  httpAuth: HttpAuthService;
  logger: LoggerService;
  // TODO: Need to integrate permissions
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
    res.status(201).json({ message: 'success', data: dependencyTypes });
  });

  router.get('/source-entities', async (req, res) => {
    const types = [...dependencyTypes.map((type) => type.id)] as const;
    const schema = z.object({
      type: z.enum([types[0], ...types]),
    })

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const credentials = await auth.getOwnServiceCredentials();
    // TODO: Probably just get the ref and send that
    const entities = catalog.getEntities({
      filter: [
        { kind: 'Component' }
      ]
    }, { credentials })

    const filtered = (await entities).items.filter(entity => {
      return entity.metadata.annotations?.[`package-deps/${parsed.data?.type}`]
    })

    res.status(201).json({ message: 'success', data: filtered })
  })

  router.get('/dependencies', async(req, res) => {
    const types = [...dependencyTypes.map((type) => type.id)] as const;
    const schema = z.object({
      entityRef: z.string(),
      type: z.enum([types[0], ...types]),
    })

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const dependencyType = parsed.data.type;
    const entityRef = parsed.data.entityRef;
    const credentials = await auth.getOwnServiceCredentials();
    const sourceEntity = await catalog.getEntityByRef(entityRef, { credentials })

    if (!sourceEntity) {
      res.status(400).json({ message: `Source Entity ${entityRef} not found`})
    }

    const relations = sourceEntity!.relations;
    const dependencyTypeRefs = relations?.filter(relation => relation.targetRef.startsWith(`component:default/dep.${dependencyType}`))

    res.status(201).json({ message: 'success', data: dependencyTypeRefs})
  })

  /**
   * Extend the module routers
   */
  dependencyTypes.forEach(type => {
    router.use(`/${type.id}`, type.router);
  });

  return router;
}
