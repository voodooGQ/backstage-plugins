export type DependencyTypeSchema = {
  [name: string]: {
    description: string;
    metadata?: Record<string, any>;
  };
};
