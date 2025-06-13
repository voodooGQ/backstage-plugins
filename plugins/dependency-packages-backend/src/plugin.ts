import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

export const dependencyPackagesPlugin = createBackendPlugin({
  pluginId: 'dependency-packages',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ httpRouter }) {
        httpRouter.use(
          await createRouter(),
        );
      },
    });
  },
});
