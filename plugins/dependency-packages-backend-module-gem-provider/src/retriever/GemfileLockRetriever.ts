import { LoggerService } from '@backstage/backend-plugin-api';
import { ComponentEntity, stringifyEntityRef } from '@backstage/catalog-model';
import { DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-common';
import { PACKAGE_DEPS_GEM_ANNOTATION } from '../constants';
import { GemfileLockInfo, GemDependencyReference } from '../types';
import fs from 'fs/promises';

export interface GemfileLockRetrieverOptions {
  logger: LoggerService;
}

export class GemfileLockRetriever implements DependencyTypeRetriever {
  private readonly logger: LoggerService;

  constructor(options: GemfileLockRetrieverOptions) {
    this.logger = options.logger;
  }

  private async parseGemfileLock(filePath: string): Promise<GemfileLockInfo> {
    const contents = await fs.readFile(filePath.replace('file:', ''), 'utf-8');
    const lines = contents.split('\n');

    const specs: Record<string, string> = {};
    const dependencies: string[] = [];
    const platforms: string[] = [];
    let bundledWith: string | null = null;

    let inSpecs = false;
    let inDependencies = false;
    let inPlatforms = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'specs:') {
        inSpecs = true;
        inDependencies = false;
        inPlatforms = false;
        continue;
      }
      if (trimmed === 'DEPENDENCIES') {
        inSpecs = false;
        inDependencies = true;
        inPlatforms = false;
        continue;
      }
      if (trimmed === 'PLATFORMS') {
        inSpecs = false;
        inDependencies = false;
        inPlatforms = true;
        continue;
      }
      if (trimmed === 'BUNDLED WITH') {
        inSpecs = false;
        inDependencies = false;
        inPlatforms = false;
        continue;
      }

      // Actual gem specs are 4 spaces indent, NOT 6 spaces
      if (inSpecs && line.startsWith('    ') && !line.startsWith('      ')) {
        const match = trimmed.match(/^([a-zA-Z0-9_\-]+) \((.+?)\)/);
        if (match) {
          specs[match[1]] = match[2];
        }
      }

      if (inDependencies && line.startsWith('  ')) {
        const match = trimmed.match(/^([a-zA-Z0-9_\-]+)(?: \((.+?)\))?/);
        if (match) {
          const gemName = match[1];
          const requestedVersion = match[2] ?? '';
          dependencies.push(`${gemName}|${requestedVersion}`);
        }
      }

      if (inPlatforms && line.startsWith('  ')) {
        platforms.push(trimmed);
      }

      if (!inSpecs && !inDependencies && !inPlatforms && /^[ ]{3,}/.test(line) && /^\d/.test(trimmed)) {
        // This captures the version line after "BUNDLED WITH"
        bundledWith = trimmed;
      }
    }

    return { specs, dependencies, platforms, bundledWith };
  }

  private async parseGemfile(filePath: string): Promise<Record<string, string[]>> {
    const contents = await fs.readFile(filePath.replace('file:', ''), 'utf-8');
    const lines = contents.split('\n');

    const gemGroups: Record<string, string[]> = {};
    let currentGroups: string[] = [];

    for (const line of lines) {
      const groupMatch = line.trim().match(/^group\s+(.*)?\s+do/);
      if (groupMatch) {
        // Extract symbols like :development, :test
        currentGroups = groupMatch[1]
          .split(',')
          .map(g => g.trim().replace(/^:/, ''));
      } else if (line.trim().startsWith('end')) {
        currentGroups = [];
      } else {
        const gemMatch = line.trim().match(/^gem\s+['"]([^'"]+)['"]/);
        if (gemMatch) {
          const gemName = gemMatch[1];
          gemGroups[gemName] = [...new Set([...(gemGroups[gemName] || []), ...currentGroups])];
        }
      }
    }

    return gemGroups;
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
          this.parseGemfileLock(gemfileLockLocation),
          this.parseGemfile(gemfileLocation),
        ]);

        console.log(specs);

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
