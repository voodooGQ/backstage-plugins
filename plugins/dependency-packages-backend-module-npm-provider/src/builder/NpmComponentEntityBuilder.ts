import { ComponentEntity, ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, ANNOTATION_SOURCE_LOCATION } from "@backstage/catalog-model";
import { EntityTemplate, ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";
import { RegistryMetaRetriever } from "../retriever/RegistryMetaRetriever";
import { NpmRegistryResponse } from "../types/NpmRegistry";

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
    return `dep.npm.${packageName}`
  }

  private sourceLocationParser(sourceLocation: NpmRegistryResponse['repository']): string {
    if (typeof sourceLocation === 'string') {
      return sourceLocation;
    }

    // TODO: Not sure if this will be right since it'll have `.git` at the end, verify
    if (sourceLocation.directory) {
      return `${sourceLocation.url}/${sourceLocation.directory}`;
    }

    return sourceLocation.url;
  }

  private gitToHttpUrl(gitUrl: string): string {
    // 1. Strip the git+ prefix
    let url = gitUrl.replace(/^git\+/, '');

    // 2. Extract branch if present
    const hashIndex = url.indexOf('#');
    let branch = '';
    if (hashIndex >= 0) {
      branch = url.slice(hashIndex + 1);
      url = url.slice(0, hashIndex);
    }

    // 3. Strip .git suffix
    url = url.replace(/\.git$/, '');

    // 4. Append branch for platforms like GitHub
    if (branch && url.includes('github.com')) {
      url = `${url}/tree/${branch}`;
    }

    return url;
  }

  private compileLinks(meta: NpmRegistryResponse): { url: string, title: string }[] {
    const links: { url: string, title: string }[] = [
      { url: `https://www.npmjs.com/package/${meta.name}`, title: 'NPM' }
    ];

    if (meta.repository) {
      links.push({ url: this.gitToHttpUrl(this.sourceLocationParser(meta.repository)), title: 'Source' });
    }

    if (meta.bugs) {
      if (typeof meta.bugs === 'string') {
        links.push({ url: meta.bugs, title: 'Bugs' });
      } else {
        if (meta.bugs.url) {
          links.push({ url: meta.bugs.url, title: 'Bugs' });
        }

        if (meta.bugs.email) {
          links.push({ url: `mailto:${meta.bugs.email}`, title: 'Bugs' });
        }
      }
    }

    if (meta.homepage) {
      links.push({ url: meta.homepage, title: 'Homepage' });
    }

    if (meta.readmeFilename) {
      links.push({ url: `${this.gitToHttpUrl(this.sourceLocationParser(meta.repository))}/${meta.readmeFilename}`, title: 'Readme' });
    }

    return links;
  }

  public async build(parsedDependencies: ParsedDependencies): Promise<ComponentEntity[]> {
    const keys = Object.keys(parsedDependencies);

    await Promise.all(keys.map(async key => {
      const meta = await this.registryMetaRetriever.retrieve(key);
      const entityRefs = parsedDependencies[key].versionReferences.map(versionReference => versionReference.entityRef);
      const entity = {
        ...this.template,
        metadata: {
          ...this.template.metadata,
          name: this.nameMutation(key),
          description: meta.description,
          title: `dep:npm:${key}`,
          packageVersionReferences: parsedDependencies[key].versionReferences,
          links: this.compileLinks(meta),
          annotations: {
            ...this.template.metadata?.annotations,
            [ANNOTATION_SOURCE_LOCATION]: this.sourceLocationParser(meta.repository),
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
