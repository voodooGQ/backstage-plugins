import { ComponentEntity, ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION } from "@backstage/catalog-model";
import { EntityTemplate, ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";

export class NpmComponentEntityBuilder {
  private builtEntities: ComponentEntity[] = [];

  private template: EntityTemplate<ComponentEntity> = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      packageVersionReferences: [],
      annotations: {
        // TODO: This can probably be populated with the actual package address once we make network requests to their server
        [ANNOTATION_LOCATION]: 'url:https://www.npmjs.com/',
        [ANNOTATION_ORIGIN_LOCATION]: 'url:https://www.npmjs.com/',
      }
    },
    spec: {
      type: 'packageDependency',
      // TODO: Need a way to set a default group
      owner: 'guests',
      // TODO: Need a way to set a default lifecycle
      lifecycle: 'external',
      dependencyOf: []
    },
  };

  constructor() {
    this.builtEntities = [];
  }

  // TODO: need to do some more name massaging, needs to be below 63 characters
  private nameMutation(name: string): string {
    const packageName = name.replace('@', 'at_').replace('/', '-');
    return `packageDep.npm.${packageName}`
  }

  public build(parsedDependencies: ParsedDependencies): ComponentEntity[] {
    const keys = Object.keys(parsedDependencies);
    keys.forEach(key => {
      const entityRefs = parsedDependencies[key].versionReferences.map(versionReference => versionReference.entityRef);
      const entity = {
        ...this.template,
        metadata: {
          ...this.template.metadata,
          name: this.nameMutation(key),
          title: `dep:npm:${key}`,
          packageVersionReferences: parsedDependencies[key].versionReferences
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
