import { CatalogService } from "@backstage/plugin-catalog-node";
import { LoggerService } from "@backstage/backend-plugin-api";
import { EntityProviderConnection } from "@backstage/plugin-catalog-node";
import { AuthService } from "@backstage/backend-plugin-api";
import { BaseConfig, Defineable } from '@voodoogq/plugin-dependency-packages-common';
import { GroupEntity } from "@backstage/catalog-model";

export interface OwnershipProviderOptions {
  auth: AuthService;
  catalog: CatalogService;
  logger: LoggerService;
  backendUrl: string;
}

export class OwnershipProvider {
  private readonly auth: AuthService;
  private readonly catalog: CatalogService;
  private readonly logger: LoggerService;
  private readonly backendUrl: string;
  private connection?: EntityProviderConnection;
  private token?: string;

  constructor(options: OwnershipProviderOptions) {
    this.auth = options.auth;
    this.catalog = options.catalog;
    this.logger = options.logger;
    this.backendUrl = options.backendUrl;
  }

  private async getPluginToken() {
    if (this.token) {
      return this.token;
    }
    const credentials = await this.auth.getOwnServiceCredentials();
    const { token } = await this.auth.getPluginRequestToken({
      targetPluginId: 'dependency-packages',
      onBehalfOf: credentials,
    })
    this.token = token;
    return this.token;
  }

  getProviderName(): string {
    return `dependency-packages-ownership-provider`
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
  }

  private async createOwner(createOwnerConfig: BaseConfig['createOwnerConfig']): Promise<GroupEntity> {
     return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: createOwnerConfig!.name!,
        description: createOwnerConfig!.description!,
      },
      spec: {
        type: 'group',
        children: [],
      },
    }
  }

  private async verifyOwner(name: string): Promise<Defineable<GroupEntity>> {
    const owner = await this.catalog.getEntityByRef({
      kind: 'Group',
      name,
      // TODO: Provide way to override
      namespace: 'default',
    }, { credentials: await this.auth.getOwnServiceCredentials() });

    if (owner) {
      return owner as GroupEntity;
    }

    return undefined;
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    const token = await this.getPluginToken();

    const configResponse = await fetch(
      `${this.backendUrl}/config`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const configData = await configResponse.json();
    const config = configData.data;

    const createOwner = config.createOwnerConfig;
    if (createOwner && createOwner.enabled) {
      if (!this.verifyOwner(createOwner.name)) {
        this.logger.debug(`Creating owner '${createOwner.name}' for dependency package entities...`)
        const owner = await this.createOwner(createOwner);
        await this.connection!.applyMutation({
          // TODO: Maybe delta is better?
          type: 'full',
          entities: [{
            entity: owner,
            locationKey: `dependency-packages-ownership-provider`,
          }],
        });
      }
    }
  }
}
