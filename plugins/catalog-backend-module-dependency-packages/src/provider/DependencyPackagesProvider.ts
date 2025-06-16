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

    const response = await fetch(
      `${this.backendUrl}/dependency-types`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const responseData = await response.json();
    this.logger.info(JSON.stringify(responseData));

    const testResponse = await fetch(
      `${this.backendUrl}/npm/retrieve`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const testResponseData = await testResponse.json();
    this.logger.info(JSON.stringify(testResponseData));


    const entities = await this.catalog.getEntities({
      filter: [
        {
          kind: 'Component',
        },
      ],
    }, { credentials });

    const filteredEntities = entities.items.filter(entity => {
      return entity.metadata.annotations?.['package-deps/npm'];
    });

    const values = filteredEntities.map(entity => {
      return {
        location: entity.metadata.annotations?.['backstage.io/managed-by-location'],
        annotation: entity.metadata.annotations?.['package-deps/npm'],
      }
    });

    const transformedValues = values.map(
      (value: { location: string | undefined; annotation: string | undefined }): string | undefined => {
        if (!value.location || !value.annotation) {
          return undefined;
        }
        const loc =  value.location.split('/')
        loc.pop();

        const newLoc = `${loc.join('/')}/${value.annotation.split('/').pop()}`;

        return newLoc;
      }
    );

    transformedValues.forEach(async (value) => {
      if (!value) {
        return;
      }
      if(value.startsWith('file:')) {
        fs.readFile(value.replace('file:', ''), 'utf8', (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            return;
          }
          const parsed = JSON.parse(data);
          Object.entries(parsed.dependencies).forEach(([dep, ver]: [string, unknown]) => {
            this.logger.info(`DEP: ${dep} | VER: ${ver}`);
          });
          Object.entries(parsed.devDependencies).forEach(([dep, ver]: [string, unknown]) => {
            this.logger.info(`DEV DEP: ${dep} | VER: ${ver}`);
          });
        });
      }
    })


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
