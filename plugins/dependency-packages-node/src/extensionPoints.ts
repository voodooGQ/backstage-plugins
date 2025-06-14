import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { DependencyType, DependencyTypeRegistry } from './dependencyTypes';

export interface DependencyPackagesDependencyTypeExtensionPoint {
  addDependencyType(dependencyType: Record<string, DependencyType>): void;
}

export const dependencyPackagesDependencyTypeExtensionPoint =
  createExtensionPoint<DependencyPackagesDependencyTypeExtensionPoint>({
    id: 'dependency-packages.dependency-type',
  });

export interface DependencyPackagesDependencyTypeRegistryExtensionPoint {
  setDependencyTypeRegistry(registry: DependencyTypeRegistry): void;
}

export const dependencyPackagesDependencyTypeRegistryExtensionPoint =
  createExtensionPoint<DependencyPackagesDependencyTypeRegistryExtensionPoint>({
    id: 'dependency-packages.dependency-type-registry',
  });
