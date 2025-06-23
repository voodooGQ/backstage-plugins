import { HumanDuration } from '@backstage/types';
import {
  DependencyType,
  DependencyTypeRegistration,
} from '@voodoogq/plugin-dependency-packages-node';
import { Duration } from 'luxon';

export type DependencyTypeRegistrationOptions = {
  cadence: string;
  dependencyType: DependencyType;
  timeout?: Duration | HumanDuration;
  initialDelay?: Duration | HumanDuration;
};

export function createDependencyTypeRegistration(
  options: DependencyTypeRegistrationOptions,
): DependencyTypeRegistration {
  const { cadence, dependencyType, timeout, initialDelay } = options;
  return {
    cadence,
    dependencyType,
    timeout,
    initialDelay,
  };
}
