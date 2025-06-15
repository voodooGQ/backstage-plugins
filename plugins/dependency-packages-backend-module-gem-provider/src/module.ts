import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { dependencyPackagesDependencyTypeExtensionPoint } from '@voodoogq/plugin-dependency-packages-node';

export const dependencyPackagesModuleGemProvider = createBackendModule({
  pluginId: 'dependency-packages',
  moduleId: 'gem-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        registry: dependencyPackagesDependencyTypeExtensionPoint,
      },
      async init({ logger, registry }) {
        logger.info('DEPENDENCY-PACKAGES: GEM Provider initialized');
        registry.addDependencyType({
          'ruby': {
            id: 'ruby',
            version: '1.0.0',
          }
        });
      },
    });
  },
});
