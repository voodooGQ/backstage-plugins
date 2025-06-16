import { LoggerService } from '@backstage/backend-plugin-api';
import { ComponentEntity } from '@backstage/catalog-model';
import { DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-common';
import { PACKAGE_DEPS_NPM_ANNOTATION } from '../constants';
import fs from 'fs';

export interface PackageJsonRetrieverOptions {
  logger: LoggerService;
}

export class PackageJsonRetriever implements DependencyTypeRetriever {
  public readonly annotationKey: string = 'package-deps/npm';
  private readonly logger: LoggerService;

  constructor(options: PackageJsonRetrieverOptions) {
    this.logger = options.logger;
  }

  private transformEntityData(entity: ComponentEntity): {
    location: string;
    annotation: string;
  } {
    const location = entity.metadata.annotations?.['backstage.io/managed-by-location'];
    const annotation = entity.metadata.annotations?.[PACKAGE_DEPS_NPM_ANNOTATION]

    if (!location || !annotation) {
      throw new Error('Missing annotations');
    }

    return {
      location,
      annotation,
    }
  }

  private getPackageLocation(transformedEntityData: { location: string; annotation: string }): string {
    const loc =  transformedEntityData.location.split('/')
    loc.pop();

    const newLoc = `${loc.join('/')}/${transformedEntityData.annotation.split('/').pop()}`;

    return newLoc;
  }

  async retrieve(entities: ComponentEntity[]): Promise<any> {
    console.log(entities)
    return entities.map((entity: ComponentEntity) => {
      const packageLocation = this.getPackageLocation(
        this.transformEntityData(entity)
      );

      if (!packageLocation) {
        throw new Error('Missing location');
      }

      let response: { dependencies: [string, string][]; devDependencies: [string, string][] } = { dependencies: [], devDependencies: [] };

      if(packageLocation.startsWith('file:')) {
        const data = fs.readFileSync(packageLocation.replace('file:', ''), 'utf8');
        const parsed = JSON.parse(data);
        const dependencies: [string, string][] = Object.entries(parsed.dependencies)
        const devDependencies: [string, string][] = Object.entries(parsed.devDependencies)
        response = {
          dependencies,
          devDependencies,
        }
      }

      return response;
    });
  }
}
