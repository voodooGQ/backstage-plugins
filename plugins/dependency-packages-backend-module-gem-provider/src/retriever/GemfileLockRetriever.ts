import { LoggerService } from '@backstage/backend-plugin-api';
import { ComponentEntity, stringifyEntityRef } from '@backstage/catalog-model';
import { DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-common';
import { PACKAGE_DEPS_GEM_ANNOTATION } from '../constants';
import { parseGemfile, parseGemfileLock } from '../parser';
import { GemDependencyReference } from '../types';

export interface GemfileLockRetrieverOptions {
  logger: LoggerService;
}

export class GemfileLockRetriever implements DependencyTypeRetriever {
  private readonly logger: LoggerService;

  constructor(options: GemfileLockRetrieverOptions) {
    this.logger = options.logger;
  }

  public async retrieve(entities: ComponentEntity[]): Promise<GemDependencyReference[]> {
    return await Promise.all(entities.map(async (entity: ComponentEntity) => {
      const gemfileLocation = entity.metadata.annotations?.[PACKAGE_DEPS_GEM_ANNOTATION];

      if (!gemfileLocation) {
        this.logger.error(`Missing Gemfile.lock location for entity: ${entity.metadata.name}`);
        throw new Error('Missing location');
      }

      const entityRef = stringifyEntityRef(entity);

      if (gemfileLocation.startsWith('file:')) {
        const gemfileLockLocation = gemfileLocation + '.lock';
        const [{ specs, dependencies, platforms, bundledWith }, gemGroups] = await Promise.all([
          parseGemfileLock(gemfileLockLocation),
          parseGemfile(gemfileLocation),
        ]);

        const gems = dependencies.map(d => {
          const [gem, requestedVersion = ''] = d.split('|');
          return {
            gem,
            version: specs[gem] ?? 'UNKNOWN',
            requestedVersion,
            profiles: gemGroups[gem] ?? []
          };
        });

        return {
          entityRef,
          gems,
          platforms,
          bundledWith
        };
      }

      // TODO: Add SCM support
      return {
        entityRef,
        gems: [],
        platforms: [],
        bundledWith: ''
      };
    }));
  }
}
