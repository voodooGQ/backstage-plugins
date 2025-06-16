import {
  CatalogService,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  SchedulerServiceTaskRunner,
  UrlReaderService,
  AuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import fs from 'fs';

export interface DependencyPackageProviderOptions {
  env: string;
  catalog: CatalogService;
  reader: UrlReaderService;
  auth: AuthService;
  logger: LoggerService;
  taskRunner: SchedulerServiceTaskRunner;
  backendUrl: string;
}


export class DependencyPackagesProvider {
  private readonly env: string;
  private readonly catalog: CatalogService;
  private readonly reader: UrlReaderService;
  private readonly logger: LoggerService;
  private readonly auth: AuthService;
  private readonly backendUrl: string;
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;

  constructor(options: DependencyPackageProviderOptions) {
    this.env = options.env;
    this.catalog = options.catalog;
    this.reader = options.reader;
    this.logger = options.logger;
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

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    const credentials = await this.auth.getOwnServiceCredentials();
    const { token } = await this.auth.getPluginRequestToken({
      targetPluginId: 'dependency-packages',
      onBehalfOf: credentials,
    })

    const entities = await this.catalog.getEntities({
      filter: [
        {
          kind: 'Component',
        },
      ],
    }, { credentials });

    const dependencyTypesResponse = await fetch(
      `${this.backendUrl}/dependency-types`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const dependencyTypesData = await dependencyTypesResponse.json();
    const dependencyTypes = dependencyTypesData.data;

    dependencyTypes.forEach(async (dependencyType: { id: string; annotation: string }) => {
      const filteredEntities = entities.items.filter(entity => {
        return entity.metadata.annotations?.[dependencyType.annotation];
      });
      const body = JSON.stringify({
        entities: filteredEntities
      });

      const dependencyEntitiesResponse = await fetch(
        `${this.backendUrl}/${dependencyType.id}/retrieve`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body,
        }
      );

      const dependencyEntitiesPayload = await dependencyEntitiesResponse.json();
      const dependencyEntities = dependencyEntitiesPayload.data;
      console.log(dependencyEntities)
    });
    // const response = await this.reader.readUrl(
    //   `https://frobs-${this.env}.example.com/data`,
    // );
    // const data = JSON.parse((await response.buffer()).toString());

    // /** [5] */
    // const entities: Entity[] = frobsToEntities(data);

    // /** [6] */
    // await this.connection.applyMutation({
    //   type: 'full',
    //   entities: entities.map(entity => ({
    //     entity,
    //     locationKey: `frobs-provider:${this.env}`,
    //   })),
    // });
  }
}
