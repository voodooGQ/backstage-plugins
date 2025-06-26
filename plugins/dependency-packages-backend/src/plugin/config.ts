import { Config } from '@backstage/config';

export function readOwnerConfig(config: Config): string | undefined {
  return config.getOptionalString('dependencyPackages.owner');
}

export function readLifecycleConfig(config: Config): string | undefined {
  return config.getOptionalString('dependencyPackages.lifecycle');
}

export function readCreateOwnerConfig(config: Config): {
  enabled: boolean;
  name?: string;
  description?: string;
} | undefined {
  const createOwnerConfig = config.getOptionalConfig('dependencyPackages.createOwner');
  if (!createOwnerConfig) {
    return undefined;
  }

  const enabledConfig = createOwnerConfig.getOptionalBoolean('enabled');
  const enabled = enabledConfig ?? true;

  if (enabled) {
    if (!createOwnerConfig.has('name')) {
      throw new Error("Must have a name for createOwner config");
    }
    const name = createOwnerConfig.getString('name');
    const description = createOwnerConfig.getOptionalString('description');

    return {
      enabled,
      name,
      description: description || name,
    };
  }

  return { enabled };
}

export function createBaseConfig(config: Config): {
  ownerConfig: string | undefined;
  lifecycleConfig: string | undefined;
  createOwnerConfig: {
    enabled: boolean;
    name?: string;
    description?: string;
  } | undefined;
} {

  const ownerConfig = readOwnerConfig(config);
  const lifecycleConfig = readLifecycleConfig(config);
  const createOwnerConfig = readCreateOwnerConfig(config);

  if (!ownerConfig && !createOwnerConfig) {
    throw new Error("Must have an owner or createOwner config value enabled");
  }

  return {
    ownerConfig,
    lifecycleConfig,
    createOwnerConfig,
  };
}
