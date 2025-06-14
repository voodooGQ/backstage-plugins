
import {
  DependencyType,
  DependencyTypeRegistration,
  DependencyTypeRegistry,
} from '@voodoogq/plugin-dependency-packages-node';
import { DependencyTypeSchema } from '@voodoogq/plugin-dependency-packages-common';
import { ConflictError, NotFoundError } from '@backstage/errors';

export class DefaultDependencyTypeRegistry implements DependencyTypeRegistry {
  private readonly retrievers = new Map<string, DependencyTypeRegistration>();

  constructor(dependencyTypes: DependencyTypeRegistration[]) {
    dependencyTypes.forEach(r => {
      this.registerSync(r);
    });
  }

  registerSync(registration: DependencyTypeRegistration) {
    if (this.retrievers.has(registration.dependencyType.id)) {
      throw new ConflictError(
        `Dependency type with identifier '${registration.dependencyType.id}' has already been registered`,
      );
    }
    this.retrievers.set(registration.dependencyType.id, registration);
  }

  async register(registration: DependencyTypeRegistration) {
    this.registerSync(registration);
  }

  async get(reference: string): Promise<DependencyTypeRegistration> {
    const registration = this.retrievers.get(reference);
    if (!registration) {
      throw new NotFoundError(
        `Dependency type retriever with identifier '${reference}' is not registered.`,
      );
    }
    return registration;
  }

  async listDependencyTypes(): Promise<DependencyType[]> {
    return [...this.retrievers.values()].map(r => r.dependencyType);
  }

  async listRegistrations(): Promise<DependencyTypeRegistration[]> {
    return [...this.retrievers.values()];
  }

  async getSchemas(): Promise<DependencyTypeSchema[]> {
    const retrievers = await this.listDependencyTypes();
    return retrievers.map(r => r.schema || {});
  }
}
