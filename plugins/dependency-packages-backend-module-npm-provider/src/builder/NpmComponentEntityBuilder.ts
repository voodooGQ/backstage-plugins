import { ComponentEntity, ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, ANNOTATION_SOURCE_LOCATION, GroupEntity } from "@backstage/catalog-model";
import { ParsedDependencies } from "@voodoogq/plugin-dependency-packages-common";
import { RegistryMetaRetriever } from "../retriever/RegistryMetaRetriever";
import { NpmRegistryResponse } from "../types/NpmRegistry";
import { DependencyEntityBuilder } from "@voodoogq/plugin-dependency-packages-node";

export class NpmComponentEntityBuilder extends DependencyEntityBuilder {
  public readonly dependencyTypeId: string = 'npm';

  protected builtEntities: ComponentEntity[] = [];

  private registryMetaRetriever: RegistryMetaRetriever;

  constructor() {
    super();
    this.builtEntities = [];
    this.registryMetaRetriever = new RegistryMetaRetriever();
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

  public async build(parsedDependencies: ParsedDependencies, defaultOwner: GroupEntity): Promise<ComponentEntity[]> {
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
          owner: defaultOwner.metadata.name,
          dependencyOf: entityRefs
        }
      } as ComponentEntity;
      this.builtEntities.push(entity);
    }));

    return this.builtEntities;
  }
}
