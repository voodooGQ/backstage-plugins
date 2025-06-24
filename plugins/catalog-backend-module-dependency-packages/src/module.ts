import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { catalogServiceRef } from "@backstage/plugin-catalog-node";
import { DependencyPackagesProvider } from './provider/DependencyPackagesProvider';
import { OwnershipProvider } from './provider/OwnershipProvider';
import { readDependencyTypeConfig } from './config';

export const catalogModuleDependencyPackages = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'dependency-packages',
  register(reg) {
    reg.registerInit({
      deps: {
        auth: coreServices.auth,
        config: coreServices.rootConfig,
        builder: catalogProcessingExtensionPoint,
        catalog: catalogServiceRef,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({
        auth,
        builder,
        catalog,
        discovery,
        logger,
        scheduler,
        config,
      }) {
        const providerConfig = readDependencyTypeConfig(config);
        const backendUrl = await discovery.getBaseUrl('dependency-packages');
        // Create default owner if needed
        const ownershipProvider = new OwnershipProvider({
          auth,
          catalog,
          logger,
          backendUrl,
          taskRunner: scheduler.createScheduledTaskRunner({
            frequency: { seconds: 10 },
            timeout: { minutes: 1 },
            initialDelay: { seconds: 10 }
          }),
        });
        builder.addEntityProvider(ownershipProvider);

        if (providerConfig) {
          Object.keys(providerConfig).forEach((provider) => {
            // Create dependency packages
            const dependencyPackageProvider = new DependencyPackagesProvider({
              providerId: provider,
              catalog,
              auth,
              backendUrl,
              taskRunner: scheduler.createScheduledTaskRunner(providerConfig[provider]),
            });
            builder.addEntityProvider(dependencyPackageProvider);
          });
        };
      },
    });
  },
});
