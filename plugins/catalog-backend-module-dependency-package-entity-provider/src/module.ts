import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from "@backstage/plugin-catalog-node/alpha";
import { ComponentProcessor } from './proccessor';

export const catalogModuleDependencyPackageEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'dependency-package-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        builder: catalogProcessingExtensionPoint,
        logger: coreServices.logger
      },
      async init({ builder, logger }) {
        logger.info('Dependency Package Entity Provider initialized');
        builder.addProcessor(new ComponentProcessor());
      },
    });
  },
});
