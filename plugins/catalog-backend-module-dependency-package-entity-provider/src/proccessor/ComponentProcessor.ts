// packages/backend/src/processors/myProcessor.ts
import { CatalogProcessorEmit, CatalogProcessorCache, CatalogProcessor } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';

export class ComponentProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'ComponentProcessor';
  }

  // Run first
  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
    _originLocation: LocationSpec,
    _cache: CatalogProcessorCache,
  ): Promise<Entity> {
    return entity;
  }

  // Run after preProcess
  async validateEntityKind(_entity: Entity): Promise<boolean> {
    // Return true if entity kind and it's fields are valid
    // and can be processed by this processor. Return false if the entity
    // cannot be processed with this processor. Throw error if the entity
    // is invalid.
    return true;
  }

  // Run after validateEntityKind
  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
    _cache: CatalogProcessorCache,
  ): Promise<Entity> {
    return entity;
  }
}
