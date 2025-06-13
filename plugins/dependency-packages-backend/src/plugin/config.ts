import { Config, readDurationFromConfig } from '@backstage/config';
import {
  DependencyTypeRetriever,
  DependencyTypeRegistration,
} from '@voodoogq/plugin-dependency-packages-node';
import {
  createDependencyTypeRetrieverRegistration,
  DependencyTypeRetrieverRegistrationOptions,
} from '../services';

type DependencyTypeConfig = Omit<
  DependencyTypeRetrieverRegistrationOptions,
  'dependencyTypeRetriever'
>;

function readDependencyTypeConfig(
  config: Config,
  name: string,
): DependencyTypeConfig | undefined {
  const dependencyTypeConfig = config.getOptionalConfig(
    `dependencyPackages.${name}`,
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

export function createDependencyTypeRegistrationFromConfig(
  config: Config,
  name: string,
  dependencyTypeRetriever: DependencyTypeRetriever,
): DependencyTypeRegistration | undefined {
  const dependencyTypeConfig = readDependencyTypeConfig(config, name);

  return dependencyTypeConfig
    ? createDependencyTypeRetrieverRegistration({
        ...dependencyTypeConfig,
        dependencyTypeRetriever,
      })
    : undefined;
}
