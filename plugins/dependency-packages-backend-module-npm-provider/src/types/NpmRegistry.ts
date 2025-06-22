export interface NpmRegistryResponse {
  name: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, NpmPackage>;
  time?: Record<string, string>;
  modified?: string;
  [key: string]: any; // future changes
}

export interface NpmPackage {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  bugs?: { url?: string; email?: string };
  license?: string;
  repository?:
    | string
    | {
        type?: string;
        url: string;
        directory?: string;
      };
  funding?: string | { url?: string };
  author?: string | { name?: string; email?: string };
  maintainers?: Array<{ name: string; email: string }>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bin?: Record<string, string> | string;
  main?: string;
  module?: string;
  types?: string;
  typings?: string;
  files?: string[];
  engines?: Record<string, string>;
  [key: string]: any; // future changes
}
