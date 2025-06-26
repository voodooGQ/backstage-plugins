import { Config, readDurationFromConfig } from '@backstage/config';
import { HumanDuration } from '@backstage/types';
import { Duration } from 'luxon';

export type DependencyTypeConfig = {
  [key: string]: {
    frequency: Duration<boolean> | HumanDuration | { cron: string; } | { trigger: "manual"; }
    timeout: Duration<boolean> | HumanDuration;
    initialDelay: Duration<boolean> | HumanDuration;
  }
};

export function readDependencyTypeConfig(
  config: Config,
): DependencyTypeConfig | undefined {
  const providersConfig = config.getOptionalConfig(`dependencyPackages.providers`);

  if (!providersConfig) {
    return undefined;
  }

  const result: DependencyTypeConfig = {};

  const keys = providersConfig.keys();

  keys.forEach((provider: string) => {
    const providerConfig = providersConfig.getOptionalConfig(provider)

    if (!providerConfig) {
      return;
    }

    const frequency = providerConfig.has('frequency')
      ? readDurationFromConfig(providerConfig.getConfig('frequency'))
      : { hours: 1 };
    const initialDelay = providerConfig.has('initialDelay')
      ? readDurationFromConfig(providerConfig.getConfig('initialDelay'))
      : { seconds: 20 };
    const timeout = providerConfig.has('timeout')
      ? readDurationFromConfig(providerConfig.getConfig('timeout'))
      : { minutes: 1 };

    result[provider] = {
      frequency,
      initialDelay,
      timeout,
    }
  })

  return result;
}
