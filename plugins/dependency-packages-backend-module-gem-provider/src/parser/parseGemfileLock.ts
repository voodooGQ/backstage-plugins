import { GemfileLockInfo } from "../types";
import fs from 'fs/promises';

export const parseGemfileLock = async (filePath: string): Promise<GemfileLockInfo> => {
  const contents = await fs.readFile(filePath.replace('file:', ''), 'utf-8');
  const lines = contents.split('\n');

  const specs: Record<string, string> = {};
  const dependencies: { name: string; requestedVersion: string }[] = [];
  const platforms: string[] = [];
  let bundledWith: string | null = null;
  let rubyVersion: string | null = null;

  let inSpecs = false;
  let inDependencies = false;
  let inPlatforms = false;
  let inRubyVersion = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'specs:') {
      inSpecs = true;
      inDependencies = false;
      inPlatforms = false;
      inRubyVersion = false;
      continue;
    }
    if (trimmed === 'DEPENDENCIES') {
      inSpecs = false;
      inDependencies = true;
      inPlatforms = false;
      inRubyVersion = false;
      continue;
    }
    if (trimmed === 'PLATFORMS') {
      inSpecs = false;
      inDependencies = false;
      inPlatforms = true;
      inRubyVersion = false;
      continue;
    }
    if (trimmed === 'BUNDLED WITH') {
      inSpecs = false;
      inDependencies = false;
      inPlatforms = false;
      inRubyVersion = false;
      continue;
    }
    if (trimmed === 'RUBY VERSION') {
      inSpecs = false;
      inDependencies = false;
      inPlatforms = false;
      inRubyVersion = true;
      continue;
    }

    // Actual gem specs
    if (inSpecs && line.startsWith('    ') && !line.startsWith('      ')) {
      const match = trimmed.match(/^([a-zA-Z0-9_\-]+) \((.+?)\)/);
      if (match) {
        specs[match[1]] = match[2];
      }
    }

    // Dependency declaration
    if (inDependencies && line.startsWith('  ')) {
      const match = trimmed.match(/^([a-zA-Z0-9_\-]+)(?: \((.+?)\))?/);
      if (match) {
        dependencies.push({
          name: match[1],
          requestedVersion: match[2] ?? ''
        });
      }
    }

    // Platforms
    if (inPlatforms && line.startsWith('  ')) {
      platforms.push(trimmed);
    }

    // Bundled with
    if (!inSpecs && !inDependencies && !inPlatforms && !inRubyVersion && /^[ ]{3,}/.test(line) && /^\d/.test(trimmed)) {
      bundledWith = trimmed;
    }

    // Ruby version
    if (inRubyVersion && line.startsWith('  ')) {
      rubyVersion = trimmed;
    }
  }

  return { specs, dependencies, platforms, bundledWith, rubyVersion };
};
