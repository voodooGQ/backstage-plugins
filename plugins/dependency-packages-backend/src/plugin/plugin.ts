import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from '../router';
import {
  dependencyPackagesDependencyTypeRegistryExtensionPoint,
  dependencyPackagesDependencyTypeExtensionPoint,
  DependencyType,
  DependencyTypeRegistry,
  DependencyTypeRegistration
} from '@voodoogq/plugin-dependency-packages-node';
import { catalogServiceRef } from "@backstage/plugin-catalog-node";
import { dependencyPackagesPermissions } from '@voodoogq/plugin-dependency-packages-common';
import { createDependencyTypeRegistrationFromConfig, createBaseConfig } from './config';

export const dependencyPackagesPlugin = createBackendPlugin({
  pluginId: 'dependency-packages',
  register(env) {
    let dependencyTypeRegistry: DependencyTypeRegistry | undefined = undefined;
    env.registerExtensionPoint(
      dependencyPackagesDependencyTypeRegistryExtensionPoint,
      {
        setDependencyTypeRegistry(registry: DependencyTypeRegistry): void {
          dependencyTypeRegistry = registry;
        },
      },
    );

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

        const dependencyTypes: DependencyTypeRegistration[] = Object.entries(
          addedDependencyTypes,
        )
          .map(([name, dependencyType]) => {
            const registration = createDependencyTypeRegistrationFromConfig(
              config,
              name,
              dependencyType,
            )
            return registration
          })
          .filter(registration => registration) as DependencyTypeRegistration[];

        const context = { config };

        httpRouter.use(
          await createRouter({
            ...context,
            httpAuth,
            logger,
            permissions,
            dependencyTypes,
            baseConfig,
            auth,
            catalog,
          }),
        );
      },
    });
  },
});
