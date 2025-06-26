import { Defineable } from "./utility";
import { HumanDuration } from '@backstage/types';
import { Duration } from 'luxon';

export type ConfigDuration = Duration<boolean> | HumanDuration | { cron: string } | { trigger: "manual" }

export interface BaseConfig {
  ownerConfig: Defineable<string>;
  lifecycleConfig: Defineable<string>;
  createOwnerConfig: Defineable<{
    enabled: boolean;
    name?: string;
    description?: string;
  }>;
};
