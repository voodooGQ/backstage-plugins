import {
  CatalogService,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  SchedulerServiceTaskRunner,
  AuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { ComponentEntity, GroupEntity } from '@backstage/catalog-model';

export interface DependencyPackageProviderOptions {
  providerId: string;
  catalog: CatalogService;
  auth: AuthService;
  logger: LoggerService;
  taskRunner: SchedulerServiceTaskRunner;
  backendUrl: string;
}

export class DependencyPackagesProvider {
  private readonly providerId: string;
  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly backendUrl: string;
  private readonly logger: LoggerService;
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;

  constructor(options: DependencyPackageProviderOptions) {
    this.providerId = options.providerId;
    this.catalog = options.catalog;
    this.auth = options.auth;
    this.logger = options.logger;
    this.taskRunner = options.taskRunner;
    this.backendUrl = options.backendUrl;
  }

  getProviderName(): string {
    return `dependency-package-provider-${this.providerId}`;
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

  private async retrieveDependencyEntities(options: {
    body: {
      entities: ComponentEntity[],
      owner: GroupEntity,
      lifecycle?: string,
    }
  }): Promise<ComponentEntity[]> {
    const { body } = options;
    this.logger.info(`Retrieving '${this.providerId}' Dependency Entities`)
    const dependencyEntitiesResponse = await fetch(
      `${this.backendUrl}/${this.providerId}/retrieve`, {
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
    const sourceEntities = await this.getComponentEntities();

    const filteredEntities = sourceEntities.items.filter(entity => {
      return entity.metadata.annotations?.[`package-deps/${this.providerId}`];
    });

    const body = {
      entities: filteredEntities as ComponentEntity[],
      owner: defaultOwner,
      lifecycle: config.lifecycleConfig as string,
    };

    const dependencyEntities = await this.retrieveDependencyEntities({ body })

    const entities = dependencyEntities.map(
      (entity: ComponentEntity) => ({ entity, locationKey: `dependency-packages-provider:${this.providerId}`})
    )

    await this.connection!.applyMutation({
      // TODO: Maybe delta is better?
      type: 'full',
      entities
    })
  }
}
