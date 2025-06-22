import { NpmRegistryResponse } from "../types/NpmRegistry";

export class RegistryMetaRetriever {
  public async retrieve(packageName: string): Promise<NpmRegistryResponse> {
    const registryResponse = await fetch(
      `https://registry.npmjs.org/${packageName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    const registryData = await registryResponse.json();
    return registryData;
  }
}
