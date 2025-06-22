import { ComponentEntity } from "@backstage/catalog-model";
import { EntityTemplate, ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";

export class NpmComponentEntityBuilder {
  private builtEntities: ComponentEntity[] = [];

  private template: EntityTemplate<ComponentEntity> = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      packageVersionReferences: [],
    },
    spec: {
      type: 'packageDependency',
      // TODO: Need a way to set a default group
      owner: 'guests',
      // TODO: Need a way to set a default lifecycle
      lifecycle: 'experimental',
      dependencyOf: []
    },
  };

  constructor() {
    this.builtEntities = [];
  }

  private nameMutation(name: string) {
    return `packageDep:npm:${name}`
  }

  public build(parsedDependencies: ParsedDependencies): ComponentEntity[] {
    const keys = Object.keys(parsedDependencies);
    keys.forEach(key => {
      const entityRefs = parsedDependencies[key].versionReferences.map(versionReference => versionReference.entityRef);
      const entity = {
        ...this.template,
        metadata: {
          name: this.nameMutation(key)
        },
        spec: {
          ...this.template.spec,
          dependencyOf: entityRefs
        }
      } as ComponentEntity;
      this.builtEntities.push(entity);
    });
    return this.builtEntities;
  }
}
