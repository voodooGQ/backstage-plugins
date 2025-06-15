import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { catalogServiceRef } from "@backstage/plugin-catalog-node";
import { DependencyPackagesProvider } from './provider/DependencyPackagesProvider';

export const catalogModuleDependencyPackages = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'dependency-packages',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        builder: catalogProcessingExtensionPoint,
        catalog: catalogServiceRef,
        reader: coreServices.urlReader,
        scheduler: coreServices.scheduler,
        auth: coreServices.auth,
      },
      async init({ builder, catalog, logger, auth, reader, scheduler }) {
        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: { seconds: 10 },
          timeout: { minutes: 1 },
        });
        const provider = new DependencyPackagesProvider(
          'local',
          catalog,
          reader,
          auth,
          logger,
          taskRunner,
        );
        builder.addEntityProvider(provider);
      },
    });
  },
});
