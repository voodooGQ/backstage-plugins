// TODO: See if this is right
export interface RubyGemsRegistryResponse {
  name: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, RubyGem>;
  time?: Record<string, string>;
  modified?: string;
  [key: string]: unknown; // future changes
}

export interface RubyGemDependency {
  name: string;
  requirements: string;
}

export interface RubyGem {
  name: string;
  downloads: number;
  version: string;
  version_downloads: number;
  authors: string | string[];
  info: string;
  project_uri: string,
  gem_uri: string;
  homepage_uri: string;
  wiki_uri: string;
  documentation_uri: string;
  mailing_list_uri: string;
  source_code_uri: string;
  bug_tracker_uri: string;
  dependencies: {
    development: RubyGemDependency[];
    runtime: RubyGemDependency[];
  };
  [key: string]: unknown;
}
