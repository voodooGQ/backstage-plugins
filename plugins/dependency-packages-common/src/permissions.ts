import { createPermission } from "@backstage/plugin-permission-common";

export const dependencyPackagesReadPermission = createPermission({
  name: 'dependency-packages.read',
  attributes: {
    action: 'read',
  },
});

export const dependencyPackagesUpdatePermission = createPermission({
  name: 'dependency-packages.run',
  attributes: {
    action: 'update',
  },
});

export const dependencyPackagesDependencyTypeRetrieverReadPermission = createPermission({
  name: 'dependency-packages.dependency-type-retriever.read',
  attributes: {
    action: 'read',
  },
});

export const dependencyPackagesPermissions = [
  dependencyPackagesReadPermission,
  dependencyPackagesUpdatePermission,
  dependencyPackagesDependencyTypeRetrieverReadPermission,
];
