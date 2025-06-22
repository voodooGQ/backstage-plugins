import { LoggerService } from '@backstage/backend-plugin-api';
import { ComponentEntity } from '@backstage/catalog-model';
import { DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-common';
import { PACKAGE_DEPS_NPM_ANNOTATION } from '../constants';
import fs from 'fs/promises';

export interface PackageJsonRetrieverOptions {
  logger: LoggerService;
}

export class PackageJsonRetriever implements DependencyTypeRetriever {
  private readonly logger: LoggerService;

  constructor(options: PackageJsonRetrieverOptions) {
    this.logger = options.logger;
  }

  public async retrieve(entities: ComponentEntity[]): Promise<any> {
    return Promise.all(entities.map(async (entity: ComponentEntity) => {
      const packageLocation = entity.metadata.annotations?.[PACKAGE_DEPS_NPM_ANNOTATION];

      if (!packageLocation) {
        throw new Error('Missing location');
      }

      if(packageLocation.startsWith('file:')) {
        const data = await fs.readFile(packageLocation.replace('file:', ''), 'utf8');
        const parsed = JSON.parse(data);
        const dependencies: [string, string][] = Object.entries(parsed.dependencies)
        const devDependencies: [string, string][] = Object.entries(parsed.devDependencies)
        return {
          dependencies,
          devDependencies,
        }
      }
    }));
  }
}
