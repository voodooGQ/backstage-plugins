import { RubyGem } from "../types/RubyGemsRegistry";

export class RegistryMetaRetriever {
  public async retrieve(gemName: string): Promise<RubyGem> {
    const registryResponse = await fetch(
      `https://rubygems.org/api/v1/gems/${gemName}.json`, {
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
