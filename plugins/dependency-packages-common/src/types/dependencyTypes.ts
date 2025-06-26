import { ComponentEntity } from '@backstage/catalog-model';

export interface DependencyTypeRetriever {
  retrieve(entities: ComponentEntity[]): Promise<any>;
}

export interface DependencyReference {
  entityRef: string;
  dependencies: [string, string][];
  devDependencies: [string, string][];
}

export interface ParsedDependencies {
  [key: string]: {
    versionReferences: {
      entityRef: string;
      version: string;
      type: 'dependency' | 'devDependency';
    }[];
  }
}

// Deep Partial on a ComponentEntity
export type EntityTemplate<E> = {
  [P in keyof E]?: E[P] extends object ? EntityTemplate<E[P]> : E[P];
};
