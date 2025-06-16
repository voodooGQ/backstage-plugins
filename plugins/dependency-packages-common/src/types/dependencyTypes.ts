import { ComponentEntity } from '@backstage/catalog-model';

export type DependencyTypeSchema = {
  [name: string]: {
    description: string;
    metadata?: Record<string, any>;
  };
};

export interface DependencyTypeRetriever {
  retrieve(entities: ComponentEntity[]): Promise<any>;
}
