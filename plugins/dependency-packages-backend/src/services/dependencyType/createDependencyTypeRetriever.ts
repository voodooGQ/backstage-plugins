import { HumanDuration } from '@backstage/types';
import {
  DependencyTypeRetriever,
  DependencyTypeRegistration,
} from '@voodoogq/plugin-dependency-packages-node';
import { Duration } from 'luxon';

export type DependencyTypeRetrieverRegistrationOptions = {
  cadence: string;
  dependencyTypeRetriever: DependencyTypeRetriever;
  timeout?: Duration | HumanDuration;
  initialDelay?: Duration | HumanDuration;
};

export function createDependencyTypeRetrieverRegistration(
  options: DependencyTypeRetrieverRegistrationOptions,
): DependencyTypeRegistration {
  const { cadence, dependencyTypeRetriever, timeout, initialDelay } = options;
  return {
    cadence,
    dependencyTypeRetriever,
    timeout,
    initialDelay,
  };
}
