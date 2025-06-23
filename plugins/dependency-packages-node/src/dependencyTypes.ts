import { HumanDuration } from '@backstage/types';
import { DependencyTypeSchema } from '@voodoogq/plugin-dependency-packages-common';
import { Duration } from 'luxon';
import express from 'express';

export type DependencyType= {
  id: string;
  version: string;
  annotation: string;
  router: express.Router;
  title?: string;
  description?: string;
  schema?: DependencyTypeSchema;
};

export type DependencyTypeRegistration = {
  dependencyType: DependencyType;
  cadence?: string;
  timeout?: Duration | HumanDuration;
  initialDelay?: Duration | HumanDuration;
  schema?: DependencyTypeSchema;
};

export interface DependencyTypeRegistry {
  register(registration: DependencyTypeRegistration): Promise<void>;
  get(retrieverReference: string): Promise<DependencyTypeRegistration>;
  listDependencyTypes(): Promise<DependencyType[]>;
  listRegistrations(): Promise<DependencyTypeRegistration[]>;
  getSchemas(): Promise<DependencyTypeSchema[]>;
}
