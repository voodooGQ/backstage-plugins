import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from '../router';
import {
  dependencyPackagesDependencyTypeExtensionPoint,
  DependencyType,
} from '@voodoogq/plugin-dependency-packages-node';
import { catalogServiceRef } from "@backstage/plugin-catalog-node";
import { dependencyPackagesPermissions } from '@voodoogq/plugin-dependency-packages-common';
import { createBaseConfig } from './config';

export const dependencyPackagesPlugin = createBackendPlugin({
  pluginId: 'dependency-packages',
  register(env) {
    const addedDependencyTypes: Record<string, DependencyType> = {};
    env.registerExtensionPoint(dependencyPackagesDependencyTypeExtensionPoint, {
      addDependencyType(dependencyTypes: Record<string, DependencyType>): void {
        Object.entries(dependencyTypes).forEach(([name, dependencyType]) => {
          addedDependencyTypes[name] = dependencyType;
        });
      },
    });

    env.registerInit({
      deps: {
        auth: coreServices.auth,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
      },
      async init({
        auth,
        catalog,
        config,
        httpAuth,
        httpRouter,
        logger,
        permissions,
        permissionsRegistry,
      }) {
        logger.info("DEPENDENCY-PACKAGES: Initialized")

        permissionsRegistry.addPermissions(dependencyPackagesPermissions);

        const baseConfig = createBaseConfig(config);

        httpRouter.use(
          await createRouter({
            httpAuth,
            logger,
            permissions,
            baseConfig,
            auth,
            catalog,
            dependencyTypes: Object.values(addedDependencyTypes),
          }),
        );
      },
    });
  },
});
