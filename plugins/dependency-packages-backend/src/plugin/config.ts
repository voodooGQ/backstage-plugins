import { Config, readDurationFromConfig } from '@backstage/config';
import {
  DependencyType,
  DependencyTypeRegistration,
} from '@voodoogq/plugin-dependency-packages-node';
import {
  createDependencyTypeRetrieverRegistration,
  DependencyTypeRetrieverRegistrationOptions,
} from '../services';

type DependencyTypeConfig = Omit<
  DependencyTypeRetrieverRegistrationOptions,
  'dependencyType'
>;

function readDependencyTypeConfig(
  config: Config,
  name: string,
): DependencyTypeConfig | undefined {
  const dependencyTypeConfig = config.getOptionalConfig(
    `dependencyPackages.providers.${name}`,
  );
  if (!dependencyTypeConfig) {
    return undefined;
  }

  const cadence = dependencyTypeConfig.getString('cadence');
  const initialDelay = dependencyTypeConfig.has('initialDelay')
    ? readDurationFromConfig(dependencyTypeConfig.getConfig('initialDelay'))
    : undefined;
  const timeout = dependencyTypeConfig.has('timeout')
    ? readDurationFromConfig(dependencyTypeConfig.getConfig('timeout'))
    : undefined;

  return {
    cadence,
    initialDelay,
    timeout,
  };
}

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

  const enabled = createOwnerConfig.getBoolean('enabled');

  if (enabled) {
    if (!createOwnerConfig.has('name')) {
      throw new Error("Must have a name for createOwner config");
    }
    const name = createOwnerConfig.getString('name');
    const description = createOwnerConfig.getString('description');

    return {
      enabled,
      name,
      description: description ? description : name,
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
    throw new Error("Must have a defaultOwner or createOwner config value enabled");
  }

  return {
    ownerConfig,
    lifecycleConfig,
    createOwnerConfig,
  };
}

export function createDependencyTypeRegistrationFromConfig(
  config: Config,
  name: string,
  dependencyType: DependencyType,
): DependencyTypeRegistration | undefined {
  const dependencyTypeConfig = readDependencyTypeConfig(config, name);

  return dependencyTypeConfig
    ? createDependencyTypeRetrieverRegistration({
        ...dependencyTypeConfig,
        dependencyType,
      })
    : undefined;
}
