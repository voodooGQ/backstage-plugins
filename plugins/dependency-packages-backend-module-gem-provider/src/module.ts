import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';

export const dependencyPackagesModuleGemProvider = createBackendModule({
  pluginId: 'dependency-packages',
  moduleId: 'gem-provider',
  register(reg) {
    reg.registerInit({
      deps: { logger: coreServices.logger },
      async init({ logger }) {
        logger.info('Hello World!');
      },
    });
  },
});
