import { DependencyReference, ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";

export class DependencyReferenceParser {
  private parsedDependencies: ParsedDependencies = {};

  constructor() {
    this.parsedDependencies = {};
  }

  public parse(dependencyReferences: DependencyReference[]): Promise<ParsedDependencies> {
    dependencyReferences.forEach(dependencyReference => {
      dependencyReference.dependencies.forEach(dependency => {
        const [name, version] = dependency;

        const existingDep = this.parsedDependencies[name];
        const versionReference = {
          entityRef: dependencyReference.entityRef,
          version,
          type: 'dependency' as const,
        };

        if(existingDep) {
          existingDep.versionReferences.push(versionReference);
        } else {
          this.parsedDependencies[name] = {
            versionReferences: [ versionReference ],
          };
        }
      });
    });
    return Promise.resolve(this.parsedDependencies);
  }
}
