import { LoggerService } from '@backstage/backend-plugin-api';
import { ComponentEntity } from '@backstage/catalog-model';
import { DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-common';
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
    const annotation = entity.metadata.annotations?.['package-deps/npm']

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

  // TODO: Get DependencyPackageProvider configured to read this
  async retrieve(entity: ComponentEntity): Promise<any> {
    const packageLocation = this.getPackageLocation(
      this.transformEntityData(entity)
    );

    if (!packageLocation) {
      throw new Error('Missing location');
    }

    if(packageLocation.startsWith('file:')) {
      fs.readFile(packageLocation.replace('file:', ''), 'utf8', (err, data): { dependencies: [string, string][]; devDependencies: [string, string][] } => {
        if (err) {
          throw new Error(`Error Reading File: ${err}`);
        }
        const parsed = JSON.parse(data);
        return {
          dependencies: Object.entries(parsed.dependencies).map(([dep, ver]: [string, unknown]) => [dep, ver as string]),
          devDependencies: Object.entries(parsed.devDependencies).map(([dep, ver]: [string, unknown]) => [dep, ver as string]),
        }
      });
    }
  }
}
