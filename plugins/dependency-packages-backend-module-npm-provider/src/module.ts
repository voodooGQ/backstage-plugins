import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { dependencyPackagesDependencyTypeExtensionPoint } from '@voodoogq/plugin-dependency-packages-node';
import { createRouter as router } from './router';
import { PACKAGE_DEPS_NPM_ANNOTATION } from './constants';

export const dependencyPackagesModuleNpmProvider = createBackendModule({
  pluginId: 'dependency-packages',
  moduleId: 'npm-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        registry: dependencyPackagesDependencyTypeExtensionPoint,
      },
      async init({ logger, registry }) {
        logger.info('DEPENDENCY-PACKAGES: NPM Provider initialized');
        registry.addDependencyType({
          'npm': {
            id: 'npm',
            version: '1.0.0',
            annotation: PACKAGE_DEPS_NPM_ANNOTATION,
            router: await router({ logger }),
          }
        });
      },
    });
  },
});
