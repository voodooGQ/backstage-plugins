
import {
  DependencyTypeRetriever,
  DependencyTypeRegistration,
  DependencyTypeRegistry,
} from '@voodoogq/plugin-dependency-packages-node';
import { DependencyTypeSchema } from '@voodoogq/plugin-dependency-packages-common';
import { ConflictError, NotFoundError } from '@backstage/errors';

export class DefaultDependencyTypeRegistry implements DependencyTypeRegistry {
  private readonly retrievers = new Map<string, DependencyTypeRegistration>();

  constructor(retrievers: DependencyTypeRegistration[]) {
    retrievers.forEach(r => {
      this.registerSync(r);
    });
  }

  registerSync(registration: DependencyTypeRegistration) {
    if (this.retrievers.has(registration.dependencyTypeRetriever.id)) {
      throw new ConflictError(
        `Dependency type retriever with identifier '${registration.dependencyTypeRetriever.id}' has already been registered`,
      );
    }
    this.retrievers.set(registration.dependencyTypeRetriever.id, registration);
  }

  async register(registration: DependencyTypeRegistration) {
    this.registerSync(registration);
  }

  async get(retrieverReference: string): Promise<DependencyTypeRegistration> {
    const registration = this.retrievers.get(retrieverReference);
    if (!registration) {
      throw new NotFoundError(
        `Dependency type retriever with identifier '${retrieverReference}' is not registered.`,
      );
    }
    return registration;
  }

  async listRetrievers(): Promise<DependencyTypeRetriever[]> {
    return [...this.retrievers.values()].map(it => it.dependencyTypeRetriever);
  }

  async listRegistrations(): Promise<DependencyTypeRegistration[]> {
    return [...this.retrievers.values()];
  }

  async getSchemas(): Promise<DependencyTypeSchema[]> {
    const retrievers = await this.listRetrievers();
    return retrievers.map(it => it.schema);
  }
}
