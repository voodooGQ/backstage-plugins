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


export class DependencyPackagesProvider {
  private readonly env: string;
  private readonly catalog: CatalogService;
  private readonly reader: UrlReaderService;
  private readonly logger: LoggerService;
  private readonly auth: AuthService;
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;

  constructor(
    env: string,
    catalog: CatalogService,
    reader: UrlReaderService,
    auth: AuthService,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
  ) {
    this.env = env;
    this.catalog = catalog;
    this.reader = reader;
    this.logger = logger;
    this.auth = auth;
    this.taskRunner = taskRunner;
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

    const entities = await this.catalog.getEntities({
      filter: {
        kind: 'Component',
      },
    }, { credentials });

    this.logger.info(`${JSON.stringify(entities)}`)

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
