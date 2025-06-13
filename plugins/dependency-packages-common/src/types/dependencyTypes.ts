export type DependencyTypeSchema = {
  [name: string]: {
    type:
      | 'integer'
      | 'float'
      | 'string'
      | 'boolean'
      | 'datetime'
      | 'set'
      | 'object';
    description: string;
    since?: string;
    metadata?: Record<string, any>;
  };
};
