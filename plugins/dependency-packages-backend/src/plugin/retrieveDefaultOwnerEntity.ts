import { GroupEntity } from "@backstage/catalog-model";
import { CatalogService } from "@backstage/plugin-catalog-node";
import { AuthService } from "@backstage/backend-plugin-api";
import { BaseConfig } from "@voodoogq/plugin-dependency-packages-common";

export type RetrieveDefaultOwnerOptions = {
  catalog: CatalogService;
  auth: AuthService;
  baseConfig: BaseConfig;
}

export async function retrieveDefaultOwnerEntity(
  options: RetrieveDefaultOwnerOptions,
): Promise<GroupEntity> {
  const { catalog, auth, baseConfig } = options;

  const credentials = await auth.getOwnServiceCredentials();

  let name: string;

  if (baseConfig.createOwnerConfig && baseConfig.createOwnerConfig.enabled) {
    name = baseConfig.createOwnerConfig.name!;
  } else {
    name = baseConfig.ownerConfig!;
  }

  const group = await catalog.getEntityByRef({
    kind: 'Group',
    name,
    namespace: 'default',
  }, { credentials });

  if (!group) {
    throw new Error(`Could not find owner for dependency packages with name ${name}`);
  }

  return group as GroupEntity;
}
