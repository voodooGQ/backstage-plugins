import { Defineable } from "./utility";

export interface BaseConfig {
  ownerConfig: Defineable<string>;
  lifecycleConfig: Defineable<string>;
  createOwnerConfig: Defineable<{
    enabled: boolean;
    name?: string;
    description?: string;
  }>;
};
