import { ConfigDuration } from "@voodoogq/plugin-dependency-packages-common";

export interface Config {
  dependencyPackages: {
    defaultOwner?: string;
    defaultLifecycle?: string;
    createOwner?: {
      enabled: boolean;
      name?: string;
      description?: string;
    };
    providers: {
      [key: string]: {
        frequency: ConfigDuration;
        timeout: ConfigDuration;
        initialDelay: ConfigDuration;
      };
    };
  };
}
