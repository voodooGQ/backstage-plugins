import { Nullable } from "@voodoogq/plugin-dependency-packages-common";

export type EntityRef = string;
export type BundleVersion = Nullable<string>;
export type Platform = string;
export type GemHandle = string;
export type VersionHandle = string;
export type Profile = string;
export type RubyVersion = Nullable<string>;

export interface GemfileLockInfo {
  specs: Record<GemHandle, VersionHandle>;
  dependencies: {
    name: GemHandle;
    requestedVersion: Nullable<VersionHandle>;
  }[];
  platforms: Platform[];
  bundledWith: BundleVersion;
  rubyVersion: RubyVersion;
}

export interface GemReference {
  gem: GemHandle;
  version: VersionHandle;
  requestedVersion: Nullable<VersionHandle>;
  profiles: Profile[];
  transient: boolean;
}

export interface GemDependencyReference {
  entityRef: EntityRef;
  gems: GemReference[];
  platforms: Platform[];
  bundledWith: BundleVersion;
  rubyVersion: RubyVersion;
}

export interface ParsedDependencies {
  [key: string]: {
    entityReferences: {
      [key: EntityRef]: {
        bundledWith: BundleVersion;
        platforms: Platform[];
        rubyVersion: RubyVersion;
        profiles: {
          version: VersionHandle;
          requestedVersion: Nullable<VersionHandle>;
          profile: Profile;
        }[];
      };
    };
  };
}
