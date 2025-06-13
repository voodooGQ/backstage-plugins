import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { dependencyPackagesDependencyTypeRegistryExtensionPoint, dependencyPackagesDependencyTypeRetrieverExtensionPoint, DependencyTypeRegistry, DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-node';
import { dependencyPackagesPermissions } from '@voodoogq/plugin-dependency-packages-common';

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

    const addedDependencyTypes: Record<string, DependencyTypeRetriever> = {};

    env.registerExtensionPoint(
      dependencyPackagesDependencyTypeRetrieverExtensionPoint, {
        addDependencyTypeRetriever(dependencyTypeRetrievers: Record<string, DependencyTypeRetriever>): void {
          Object.entries(dependencyTypeRetrievers).forEach(([key, value]) => {
            addedDependencyTypes[key] = value;
          });
        }
      }
    )

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        permissionsRegistry: coreServices.permissionsRegistry,
      },
      async init({ httpRouter, permissionsRegistry }) {
        permissionsRegistry.addPermissions(dependencyPackagesPermissions);

        httpRouter.use(
          await createRouter(),
        );
      },
    });
  },
});
