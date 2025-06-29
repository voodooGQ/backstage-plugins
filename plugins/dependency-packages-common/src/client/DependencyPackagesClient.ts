import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { AuthService } from '@backstage/backend-plugin-api';
import stableStringify from 'fast-json-stable-stringify';

/**
 * Client to fetch data from tech-insights backend
 *
 * @public */
export class DependencyPackagesClient {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi | AuthService;
  private readonly apiCache = new Map<string, Promise<any>>();

  constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi | AuthService;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }

  private getCacheKey(path: string, init?: RequestInit): string {
    return `${path} ${stableStringify(init ?? {})}`;
  }

  private async api<T>(path: string, init?: RequestInit): Promise<T> {
    const url = await this.discoveryApi.getBaseUrl('dependency-packages');

    const cacheKey = this.getCacheKey(`${url}${path}`, init);
    const cached = this.apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = (async () => {
      const token = await this.getToken();

      const headers: HeadersInit = new Headers(init?.headers);
      if (!headers.has('content-type'))
        headers.set('content-type', 'application/json');
      if (token && !headers.has('authorization')) {
        headers.set('authorization', `Bearer ${token}`);
      }

      const request = new Request(`${url}${path}`, {
        ...init,
        headers,
      });

      return fetch(request).then(async response => {
        if (!response.ok) {
          throw await ResponseError.fromResponse(response);
        }
        return response.json() as Promise<T>;
      });
    })();

    // Fill cache, and clear after 2 seconds
    this.apiCache.set(cacheKey, result);
    setTimeout(() => {
      this.apiCache.delete(cacheKey);
    }, 2000);

    return result;
  }

  private async getToken(): Promise<string | null> {
    let result: { token?: string | undefined };

    if ('getCredentials' in this.identityApi) {
      result = await this.identityApi.getCredentials();
    } else {
      result = await this.identityApi.getPluginRequestToken({
        onBehalfOf: await this.identityApi.getOwnServiceCredentials(),
        targetPluginId: 'tech-insights',
      });
    }

    return result.token ?? null;
  }
}
