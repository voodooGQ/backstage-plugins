import { ComponentEntity, GroupEntity } from '@backstage/catalog-model';
import { EntityTemplate, ParsedDependencies } from '@voodoogq/plugin-dependency-packages-common';

// TOOD: Add an implements later
export class DependencyEntityBuilder {
  public readonly dependencyTypeId: string = 'unknown';

  protected builtEntities: ComponentEntity[] = [];

  protected template: EntityTemplate<ComponentEntity> = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      packageVersionReferences: [],
    },
    spec: {
      type: 'dependency-package',
      dependencyOf: []
    },
  };

  constructor() {
    this.builtEntities = [];
  }

  protected nameMutation(name: string): string {
    const packageName = name.replace('@', 'at_').replace('/', '-');
    return `dep.${this.dependencyTypeId}.${packageName}`
  }

  protected gitToHttpUrl(gitUrl: string, path?: string): string {
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

  public async build(_options: {
    parsedDependencies: ParsedDependencies,
    owner: GroupEntity,
    lifecycle?: string,
  }): Promise<ComponentEntity[]> {
    return this.builtEntities;
  }
}
