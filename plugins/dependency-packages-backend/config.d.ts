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
        cadence: string;
        timeout: {
          minutes: number;
        };
        initialDelay: {
          minutes: number;
        };
      };
    };
  };
}
