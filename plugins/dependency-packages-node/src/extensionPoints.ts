import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { DependencyTypeRetriever, DependencyTypeRegistry } from './dependencyTypes';

export interface DependencyPackagesDependencyTypeRetrieverExtensionPoint {
  addDependencyTypeRetriever(dependencyTypeRetriever: Record<string, DependencyTypeRetriever>): void;
}

export const dependencyPackagesDependencyTypeRetrieverExtensionPoint =
  createExtensionPoint<DependencyPackagesDependencyTypeRetrieverExtensionPoint>({
    id: 'dependency-packages.dependency-type-retriever',
  });

export interface DependencyPackagesDependencyTypeRegistryExtensionPoint {
  setDependencyTypeRegistry(registry: DependencyTypeRegistry): void;
}

export const dependencyPackagesDependencyTypeRegistryExtensionPoint =
  createExtensionPoint<DependencyPackagesDependencyTypeRegistryExtensionPoint>({
    id: 'dependency-packages.dependency-type-registry',
  });
