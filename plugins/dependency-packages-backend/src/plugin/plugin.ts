import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from '../router';
import {
  dependencyPackagesDependencyTypeRegistryExtensionPoint,
  DependencyType,
  DependencyTypeRegistry,
  DependencyTypeRegistration
} from '@voodoogq/plugin-dependency-packages-node';
import { dependencyPackagesPermissions } from '@voodoogq/plugin-dependency-packages-common';
import { createDependencyTypeRegistrationFromConfig } from './config';

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

    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
      },
      async init({ httpRouter, permissionsRegistry, config, logger, permissions, httpAuth }) {
        permissionsRegistry.addPermissions(dependencyPackagesPermissions);

        const dependencyTypes: DependencyTypeRegistration[] = Object.entries(
          addedDependencyTypes,
        )
          .map(([name, dependencyType]) =>
            createDependencyTypeRegistrationFromConfig(
              config,
              name,
              dependencyType,
            ),
          )
          .filter(registration => registration) as DependencyTypeRegistration[];

        const context = { config };


        httpRouter.use(
          await createRouter({
            ...context,
            httpAuth,
            logger,
            permissions,
            dependencyTypes
          }),
        );
      },
    });
  },
});
