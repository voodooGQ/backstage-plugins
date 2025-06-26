import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { dependencyPackagesDependencyTypeExtensionPoint } from '@voodoogq/plugin-dependency-packages-node';
import { createRouter as router } from "./router";
import { PACKAGE_DEPS_GEM_ANNOTATION } from './constants';

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
          'gem': {
            id: 'gem',
            version: '1.0.0',
            // TODO: Not sure we need this annotation constant anymore, just use the id
            annotation: PACKAGE_DEPS_GEM_ANNOTATION,
            router: await router({ logger }),
          }
        });
      },
    });
  },
});
