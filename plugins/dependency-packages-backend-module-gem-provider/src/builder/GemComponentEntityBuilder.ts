import { ComponentEntity, ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, ANNOTATION_SOURCE_LOCATION, GroupEntity } from "@backstage/catalog-model";
import { RegistryMetaRetriever } from "../retriever/RegistryMetaRetriever";
import { DependencyEntityBuilder } from "@voodoogq/plugin-dependency-packages-node";
import { ParsedDependencies } from "../types";
import { RubyGem } from "../types/RubyGemsRegistry";

export class GemComponentEntityBuilder extends DependencyEntityBuilder {
  public readonly dependencyTypeId: string = 'gem';

  protected builtEntities: ComponentEntity[] = [];

  private registryMetaRetriever: RegistryMetaRetriever;

  constructor() {
    super();
    this.builtEntities = [];
    this.registryMetaRetriever = new RegistryMetaRetriever();
  }

  private compileLinks(meta: RubyGem): { url: string, title: string }[] {
    const links = [
      { uri: 'project_uri', title: "Project" },
      { uri: 'gem_uri', title: "Gem" },
      { uri: 'homepage_uri', title: "Homepage" },
      { uri: 'wiki_uri', title: "Wiki" },
      { uri: 'documentation_uri', title: "Documentation" },
      { uri: 'mailing_list_uri', title: "Mailing List" },
      { uri: 'source_code_uri', title: "Source" },
      { uri: 'bug_tracker_uri', title: "Bug Tracker" },
    ].map((val) => {
      if (!meta[val.uri]) { return }

      return {
        url: meta[val.uri] as string,
        title: val.title as string,
      }
    }).filter((v) => v !== undefined)
    return links;
  }

  public async build(options: {
    parsedDependencies: ParsedDependencies;
    owner: GroupEntity;
    lifecycle?: string;
  }): Promise<ComponentEntity[]> {
    const { parsedDependencies, owner, lifecycle } = options;

    await Promise.all(
      Object.keys(parsedDependencies).map(async key => {
        const meta = await this.registryMetaRetriever.retrieve(key);
        const entityReferences = Object.keys(parsedDependencies[key].entityReferences);
        const entity = {
          ...this.template,
          metadata: {
            ...this.template.metadata,
            name: this.nameMutation(key),
            description: meta.info,
            title: `dep:gem:${key}`,
            packageVersionReferences: parsedDependencies[key].entityReferences,
            links: this.compileLinks(meta),
            annotations: {
              ...this.template.metadata?.annotations,
              [ANNOTATION_LOCATION]: `url:${meta.gem_uri}`,
              [ANNOTATION_ORIGIN_LOCATION]: `url:${meta.gem_uri}`,
              [ANNOTATION_SOURCE_LOCATION]: `url:${meta.source_code_uri}`
            }
          },
          spec: {
            ...this.template.spec,
            owner: owner.metadata.name,
            lifecycle: lifecycle || "experimnetal",
            dependencyOf: entityReferences,
          }
        } as ComponentEntity;
        this.builtEntities.push(entity);
      })
    )

    return this.builtEntities;
  }
}
