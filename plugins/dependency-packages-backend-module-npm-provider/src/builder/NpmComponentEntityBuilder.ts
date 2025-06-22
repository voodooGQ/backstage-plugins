import { ComponentEntity, ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, ANNOTATION_SOURCE_LOCATION } from "@backstage/catalog-model";
import { EntityTemplate, ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";
import { RegistryMetaRetriever } from "../retriever/RegistryMetaRetriever";

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

  private registryMetaRetriever: RegistryMetaRetriever;

  constructor() {
    this.builtEntities = [];
    this.registryMetaRetriever = new RegistryMetaRetriever();
  }

  // TODO: need to do some more name massaging, needs to be below 63 characters
  private nameMutation(name: string): string {
    const packageName = name.replace('@', 'at_').replace('/', '-');
    return `packageDep.npm.${packageName}`
  }

  public async build(parsedDependencies: ParsedDependencies): Promise<ComponentEntity[]> {
    const keys = Object.keys(parsedDependencies);

    await Promise.all(keys.map(async key => {
      const meta = await this.registryMetaRetriever.retrieve(key);
      if (key === '@mui/material') {
        console.log(meta);
      }

      const entityRefs = parsedDependencies[key].versionReferences.map(versionReference => versionReference.entityRef);
      const entity = {
        ...this.template,
        metadata: {
          ...this.template.metadata,
          name: this.nameMutation(key),
          description: meta.description,
          title: `dep:npm:${key}`,
          packageVersionReferences: parsedDependencies[key].versionReferences,
          annotations: {
            ...this.template.metadata?.annotations,
            // TODO: Massage this, current structure:
            // { url: 'git+https://github.com/facebook/react.git', type: 'git', directory: 'packages/react' }
            [ANNOTATION_SOURCE_LOCATION]: `${meta.repository.url}`,
          }
        },
        spec: {
          ...this.template.spec,
          dependencyOf: entityRefs
        }
      } as ComponentEntity;
      this.builtEntities.push(entity);
    }));

    return this.builtEntities;
  }
}
