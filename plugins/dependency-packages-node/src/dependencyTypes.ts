import {
  AuthService,
  DiscoveryService,
  LoggerService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { HumanDuration } from '@backstage/types';
import { DependencyTypeSchema } from '@voodoogq/plugin-dependency-packages-common';
import { Duration } from 'luxon';

export type DependencyType= {
  id: string;
  version: string;
  title?: string;
  description?: string;
};

export type DependencyTypeContext<TExtension = {}> = {
  config: Config;
  discovery: DiscoveryService;
  logger: LoggerService;
  auth: AuthService;
  urlReader: UrlReaderService;
} & TExtension;

export interface DependencyTypeRetriever<
  TContext extends DependencyTypeContext = DependencyTypeContext,
> {
  id: string;
  version: string;
  title?: string;
  description?: string;
  handler: (ctx: TContext) => Promise<DependencyType[]>;
  schema: DependencyTypeSchema;
}

export type DependencyTypeRegistration<
  TContext extends DependencyTypeContext = DependencyTypeContext,
> = {
  dependencyTypeRetriever: DependencyTypeRetriever<TContext>;
  cadence?: string;
  timeout?: Duration | HumanDuration;
  initialDelay?: Duration | HumanDuration;
};

export interface DependencyTypeRegistry {
  register<TContext extends DependencyTypeContext = DependencyTypeContext>(
    registration: DependencyTypeRegistration<TContext>,
  ): Promise<void>;
  get(retrieverReference: string): Promise<DependencyTypeRegistration>;
  listRetrievers(): Promise<DependencyType[]>;
  listRegistrations(): Promise<DependencyTypeRegistration[]>;
  getSchemas(): Promise<DependencyTypeSchema[]>;
}
