import { DependencyReference, ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";

export class DependencyReferenceParser {
  private parsedDependencies: ParsedDependencies = {};

  constructor() {
    this.parsedDependencies = {};
  }

  public parse(dependencyReferences: DependencyReference[]): Promise<ParsedDependencies> {
    dependencyReferences.forEach(dependencyReference => {
      dependencyReference.dependencies.forEach(dependency => {
        const existingDep = this.parsedDependencies[dependency[0]];
        const versionReference = {
          entityRef: dependencyReference.entityRef,
          version: dependency[1],
          type: 'dependency' as const,
        };

        if(existingDep) {
          existingDep.versionReferences.push(versionReference);
        } else {
          this.parsedDependencies[dependency[0]] = {
            versionReferences: [ versionReference ],
          };
        }
      });
    });
    return Promise.resolve(this.parsedDependencies);
  }
}
