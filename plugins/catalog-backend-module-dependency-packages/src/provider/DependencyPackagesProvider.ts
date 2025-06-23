import {
  CatalogService,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  SchedulerServiceTaskRunner,
  AuthService,
} from '@backstage/backend-plugin-api';
import { ComponentEntity, GroupEntity } from '@backstage/catalog-model';

export interface DependencyPackageProviderOptions {
  env: string;
  catalog: CatalogService;
  auth: AuthService;
  taskRunner: SchedulerServiceTaskRunner;
  backendUrl: string;
}

export class DependencyPackagesProvider {
  private readonly env: string;
  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly backendUrl: string;
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;

  constructor(options: DependencyPackageProviderOptions) {
    this.env = options.env;
    this.catalog = options.catalog;
    this.auth = options.auth;
    this.taskRunner = options.taskRunner;
    this.backendUrl = options.backendUrl;
  }

  getProviderName(): string {
    return `dependency-packages-${this.env}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  private async pluginHeaders(): Promise<{
    headers: {
      Authorization: string,
      'Content-Type': string
    }
  }> {
    const credentials = await this.auth.getOwnServiceCredentials();
    const { token } = await this.auth.getPluginRequestToken({
      targetPluginId: 'dependency-packages',
      onBehalfOf: credentials,
    })

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  private async getPluginConfig() {
    const configResponse = await fetch(
      `${this.backendUrl}/config`, {
        method: 'GET',
        ...(await this.pluginHeaders()),
      }
    )
    const configData = await configResponse.json();

    if (configData.error) {
      throw new Error(configData.error.message)
    }

    return configData.data;
  }

  private async getDefaultOwner(): Promise<GroupEntity> {
    const defaultOwnerResponse = await fetch(
      `${this.backendUrl}/default-owner`, {
        method: 'GET',
        ...(await this.pluginHeaders()),
      }
    )
    const defaultOwnerData = await defaultOwnerResponse.json();

    if (defaultOwnerData.error) {
      throw new Error(defaultOwnerData.error.message)
    }

    return defaultOwnerData.data;
  }

  private async getDependencyTypes() {
    const dependencyTypesResponse = await fetch(
      `${this.backendUrl}/dependency-types`, {
        method: 'GET',
        ...(await this.pluginHeaders()),
      }
    );
    const dependencyTypesData = await dependencyTypesResponse.json();

    if (dependencyTypesData.error) {
      throw new Error(dependencyTypesData.error.message)
    }

    return dependencyTypesData.data;
  }

  private async retrieveDependencyEntities(options: {
    dependencyType: { id: string },
    body: {
      entities: ComponentEntity[],
      owner: GroupEntity,
      lifecycle?: string,
    },
  }): Promise<ComponentEntity[]> {
    const { dependencyType, body } = options;
    const dependencyEntitiesResponse = await fetch(
      `${this.backendUrl}/${dependencyType.id}/retrieve`, {
        method: 'POST',
        ...(await this.pluginHeaders()),
        body: JSON.stringify(body),
      }
    );
    const dependencyEntitiesPayload = await dependencyEntitiesResponse.json();
    return dependencyEntitiesPayload.data;
  }

  private async getComponentEntities() {
    const credentials = await this.auth.getOwnServiceCredentials();
    return await this.catalog.getEntities({
      filter: [
        {
          kind: 'Component',
        },
      ],
    }, { credentials });
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    const config = await this.getPluginConfig();
    const defaultOwner = await this.getDefaultOwner();
    const entities = await this.getComponentEntities();
    const dependencyTypes = await this.getDependencyTypes();

    dependencyTypes.forEach(async (dependencyType: { id: string; annotation: string }) => {
      const filteredEntities = entities.items.filter(entity => {
        return entity.metadata.annotations?.[dependencyType.annotation];
      });
      const body = {
        entities: filteredEntities as ComponentEntity[],
        owner: defaultOwner,
        lifecycle: config.lifecycleConfig as string,
      };

      const dependencyEntities = await this.retrieveDependencyEntities({
        dependencyType,
        body,
      })

      await this.connection?.applyMutation({
        // TODO: Maybe delta is better?
        type: 'full',
        entities: dependencyEntities.map((entity: ComponentEntity) => ({
          entity,
          locationKey: `dependency-packages-provider:${this.env}`,
        })),
      });
    });
  }
}
