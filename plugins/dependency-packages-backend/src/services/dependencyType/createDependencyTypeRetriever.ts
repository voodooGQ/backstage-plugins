import { HumanDuration } from '@backstage/types';
import {
  DependencyType,
  DependencyTypeRegistration,
} from '@voodoogq/plugin-dependency-packages-node';
import { Duration } from 'luxon';
import { DependencyTypeSchema } from '@voodoogq/plugin-dependency-packages-common';

export type DependencyTypeRetrieverRegistrationOptions = {
  cadence: string;
  dependencyType: DependencyType;
  timeout?: Duration | HumanDuration;
  initialDelay?: Duration | HumanDuration;
  schema?: DependencyTypeSchema;
};

export function createDependencyTypeRetrieverRegistration(
  options: DependencyTypeRetrieverRegistrationOptions,
): DependencyTypeRegistration {
  const { cadence, dependencyType, timeout, initialDelay, schema } = options;
  return {
    cadence,
    dependencyType,
    timeout,
    initialDelay,
    schema,
  };
}
