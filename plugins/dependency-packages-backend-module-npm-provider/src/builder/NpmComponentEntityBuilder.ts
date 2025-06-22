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

  private npmRegistryUrl(name: string): string {
    return `https://www.npmjs.com/package/${name}`;
  }

  private sourceLocationParser(sourceLocation: NpmRegistryResponse['repository']): string {
    if (typeof sourceLocation === 'string') {
      return this.gitToHttpUrl(sourceLocation);
    }

    // TODO: Not sure if this will be right since it'll have `.git` at the end, verify
    if (sourceLocation.directory) {
      return this.gitToHttpUrl(`${sourceLocation.url}`, sourceLocation.directory);
    }

    return this.gitToHttpUrl(sourceLocation.url);
  }

  private gitToHttpUrl(gitUrl: string, path?: string): string {
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

    // 4. Build final URL
    if (url.includes('github.com')) {
      if (branch) {
        url = `${url}/tree/${branch}`;
      }
      if (path) {
        url = `${url}/${path.replace(/^\/+/, '')}`;
      }
    } else {
      // Other platforms can be added here if needed
      if (path) {
        url = `${url}/${path.replace(/^\/+/, '')}`;
      }
    }

    return url;
  }

  private compileLinks(meta: NpmRegistryResponse): { url: string, title: string }[] {
    const links: { url: string, title: string }[] = [
      { url: this.npmRegistryUrl(meta.name), title: 'NPM' }
    ];

    if (meta.repository) {
      links.push({ url: this.sourceLocationParser(meta.repository), title: 'Source' });
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
      links.push({ url: this.gitToHttpUrl(this.sourceLocationParser(meta.repository), meta.readmeFilename), title: 'Readme' });
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
            [ANNOTATION_LOCATION]: `url:${this.npmRegistryUrl(key)}`,
            [ANNOTATION_ORIGIN_LOCATION]: `url:${this.npmRegistryUrl(key)}`,
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
