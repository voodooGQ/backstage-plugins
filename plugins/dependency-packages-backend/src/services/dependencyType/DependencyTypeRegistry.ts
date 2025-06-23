
import {
  DependencyType,
  DependencyTypeRegistration,
  DependencyTypeRegistry,
} from '@voodoogq/plugin-dependency-packages-node';
import { ConflictError, NotFoundError } from '@backstage/errors';

export class DefaultDependencyTypeRegistry implements DependencyTypeRegistry {
  private readonly registrations = new Map<string, DependencyTypeRegistration>();

  constructor(dependencyTypes: DependencyTypeRegistration[]) {
    dependencyTypes.forEach(r => {
      this.registerSync(r);
    });
  }

  registerSync(registration: DependencyTypeRegistration) {
    if (this.registrations.has(registration.dependencyType.id)) {
      throw new ConflictError(
        `Dependency type with identifier '${registration.dependencyType.id}' has already been registered`,
      );
    }
    this.registrations.set(registration.dependencyType.id, registration);
  }

  async register(registration: DependencyTypeRegistration) {
    this.registerSync(registration);
  }

  async get(reference: string): Promise<DependencyTypeRegistration> {
    const registration = this.registrations.get(reference);
    if (!registration) {
      throw new NotFoundError(
        `Dependency type with identifier '${reference}' is not registered.`,
      );
    }
    return registration;
  }

  async listDependencyTypes(): Promise<DependencyType[]> {
    return [...this.registrations.values()].map(r => r.dependencyType);
  }

  async listRegistrations(): Promise<DependencyTypeRegistration[]> {
    return [...this.registrations.values()];
  }
}
