import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const dependencyPackagesNpmPlugin = createPlugin({
  id: 'dependency-packages-npm',
  routes: {
    root: rootRouteRef,
  },
});

export const DependencyPackagesNpmPage = dependencyPackagesNpmPlugin.provide(
  createRoutableExtension({
    name: 'DependencyPackagesNpmPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
