import { LoggerService } from '@backstage/backend-plugin-api';
import { ComponentEntity } from '@backstage/catalog-model';
import { DependencyTypeRetriever } from '@voodoogq/plugin-dependency-packages-common';

export interface PackageJsonRetrieverOptions {
  logger: LoggerService;
}

export class PackageJsonRetriever implements DependencyTypeRetriever {
  public readonly annotationKey: string = 'package-deps/npm';
  private readonly logger: LoggerService;

  constructor(options: PackageJsonRetrieverOptions) {
    this.logger = options.logger;
  }

  async retrieve(entity: ComponentEntity): Promise<any> {
    this.logger.info(`Entity: ${JSON.stringify(entity)}`)
    this.logger.info(`Annotation key: ${this.annotationKey}`)
  }
}
