import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  SchedulerServiceTaskRunner,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface DependencyPackageProviderOptions {
  logger: LoggerService;
  env: string;
  reader: UrlReaderService;
  taskRunner: SchedulerServiceTaskRunner;
}

/**
 * Provide entities for dependency packages for various languages.
 */
export class DependencyPackageProvider implements EntityProvider {
  private readonly env: string;
  private readonly reader: UrlReaderService;
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;
  private logger: LoggerService;

  /** [1] */
  constructor(options: DependencyPackageProviderOptions) {
    this.env = options.env;
    this.reader = options.reader;
    this.taskRunner = options.taskRunner;
    this.logger = options.logger;
  }

  /** [2] */
  getProviderName(): string {
    return `dependency-package-provider-${this.env}`;
  }

  /** [3] */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  /** [4] */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    this.logger.info('process')

    // const response = await this.reader.readUrl(
    //   `https://frobs-${this.env}.example.com/data`,
    // );
    // const data = JSON.parse((await response.buffer()).toString());

    /** [5] */
    // const entities = []
    // /** [6] */
    // await this.connection.applyMutation({
    //   type: 'full',
    //   entities: entities.map(entity => ({
    //     entity,
    //     locationKey: `dependency-package-provider:${this.env}`,
    //   })),
    // });
  }
}
