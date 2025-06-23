import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { catalogServiceRef } from "@backstage/plugin-catalog-node";
import { DependencyPackagesProvider } from './provider/DependencyPackagesProvider';
import { OwnershipProvider } from './provider/OwnershipProvider';

export const catalogModuleDependencyPackages = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'dependency-packages',
  register(reg) {
    reg.registerInit({
      deps: {
        auth: coreServices.auth,
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
      }) {
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

        // Create dependency packages
        const dependencyPackageProvider = new DependencyPackagesProvider({
          env: 'local',
          catalog,
          auth,
          backendUrl,
          // TODO: This should be based on the individual provider
          // probably pass the scheduler in and then build off
          // it's config
          taskRunner: scheduler.createScheduledTaskRunner({
            frequency: { seconds: 10 },
            timeout: { minutes: 1 },
            initialDelay: { seconds: 15 }
          }),
        });
        builder.addEntityProvider(dependencyPackageProvider);
      },
    });
  },
});
