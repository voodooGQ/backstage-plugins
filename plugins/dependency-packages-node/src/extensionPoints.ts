import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { DependencyType } from './dependencyTypes';

export interface DependencyPackagesDependencyTypeExtensionPoint {
  addDependencyType(dependencyType: Record<string, DependencyType>): void;
}

export const dependencyPackagesDependencyTypeExtensionPoint =
  createExtensionPoint<DependencyPackagesDependencyTypeExtensionPoint>({
    id: 'dependency-packages.dependency-type',
  });
