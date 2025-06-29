import { createDevApp } from '@backstage/dev-utils';
import { dependencyPackagesNpmPlugin, DependencyPackagesNpmPage } from '../src/plugin';

createDevApp()
  .registerPlugin(dependencyPackagesNpmPlugin)
  .addPage({
    element: <DependencyPackagesNpmPage />,
    title: 'Root Page',
    path: '/dependency-packages-npm',
  })
  .render();
