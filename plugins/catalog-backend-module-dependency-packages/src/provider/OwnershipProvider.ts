import { CatalogService } from "@backstage/plugin-catalog-node";
import { LoggerService } from "@backstage/backend-plugin-api";
import { EntityProviderConnection } from "@backstage/plugin-catalog-node";
import { AuthService } from "@backstage/backend-plugin-api";
import { BaseConfig } from '@voodoogq/plugin-dependency-packages-common';
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

  private async getOwner(ownerConfig: BaseConfig['ownerConfig']): Promise<GroupEntity> {
    const owner = await this.catalog.getEntityByRef({
      kind: 'Group',
      name: ownerConfig!,
      // Set a way to override this
      namespace: 'default',
    }, { credentials: await this.auth.getOwnServiceCredentials() });

    if (!owner) {
      throw new Error(`Owner named ${ownerConfig} not found in catalog`)
    }

    return owner as GroupEntity;
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
    const defaultOwner = config.ownerConfig;

    let owner: GroupEntity;

    if (createOwner && createOwner.enabled) {
      owner = await this.createOwner(createOwner);
    // TODO: Actually this isn't necessary since we're providing.
    // Create only, and then have the backend return the right owner.
    } else if (defaultOwner) {
      owner = await this.getOwner(defaultOwner);
    }


  }

}
