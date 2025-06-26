import { GemDependencyReference, ParsedDependencies } from "../types";

export class DependencyReferenceParser {
  private parsedDependencies: ParsedDependencies = {};

  constructor() {
    this.parsedDependencies = {};
  }

  public parse(dependencyReferences: GemDependencyReference[]): Promise<ParsedDependencies> {
    dependencyReferences.forEach(dependencyReference => {
      const { gems, entityRef, platforms, bundledWith, rubyVersion } = dependencyReference;

      gems.forEach(g => {
        const { gem, version, requestedVersion, profiles, transient } = g;
        const existingGem = this.parsedDependencies[gem];
        const profs = profiles.length === 0 ?  ['default'] : ['default', ...profiles];
        const profileMap = profs.map((p) => ({
          version,
          requestedVersion,
          transient,
          profile: p
        }))

        if (existingGem) {
          const entityReference = existingGem.entityReferences[entityRef];

          if (entityReference) {
            entityReference.profiles.push(...profileMap);
            existingGem.entityReferences[entityRef] = entityReference;
          } else {
            this.parsedDependencies[gem].entityReferences = {
              [entityRef]: {
                bundledWith,
                platforms,
                rubyVersion,
                profiles: profileMap
              }
            };
          }
        } else {
          this.parsedDependencies[gem] = {
            entityReferences: {
              [entityRef]: {
                bundledWith,
                platforms,
                rubyVersion,
                profiles: profileMap
              }
            }
          }
        }
      });
    });
    return Promise.resolve(this.parsedDependencies);
  }
}
