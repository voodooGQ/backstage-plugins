export type EntityRef = string;
export type BundleVersion = string | null;
export type Platform = string;
export type GemHandle = string;
export type VersionHandle = string;
export type Profile = string;
export type Dependency = string;

export interface GemfileLockInfo {
  specs: Record<GemHandle, VersionHandle>;
  dependencies: Dependency[];
  platforms: Platform[];
  bundledWith: BundleVersion;
}

export interface GemReference {
  gem: GemHandle;
  version: VersionHandle;
  requestedVersion: VersionHandle;
  profiles: Profile[];
}

export interface GemDependencyReference {
  entityRef: EntityRef;
  gems: GemReference[],
  platforms: Platform[],
  bundledWith: BundleVersion;
}
