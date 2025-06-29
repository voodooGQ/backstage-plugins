import { dependencyPackagesNpmPlugin } from './plugin';

describe('dependency-packages-npm', () => {
  it('should export plugin', () => {
    expect(dependencyPackagesNpmPlugin).toBeDefined();
  });
});
