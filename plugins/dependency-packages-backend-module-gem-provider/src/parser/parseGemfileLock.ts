import { GemfileLockInfo } from "../types";
import fs from 'fs/promises';

export const parseGemfileLock = async (filePath: string): Promise<GemfileLockInfo> => {
  const contents = await fs.readFile(filePath.replace('file:', ''), 'utf-8');
  const lines = contents.split('\n');

  const specs: Record<string, string> = {};
  const dependencies: string[] = [];
  const platforms: string[] = [];
  let bundledWith: string | null = null;

  let inSpecs = false;
  let inDependencies = false;
  let inPlatforms = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'specs:') {
      inSpecs = true;
      inDependencies = false;
      inPlatforms = false;
      continue;
    }
    if (trimmed === 'DEPENDENCIES') {
      inSpecs = false;
      inDependencies = true;
      inPlatforms = false;
      continue;
    }
    if (trimmed === 'PLATFORMS') {
      inSpecs = false;
      inDependencies = false;
      inPlatforms = true;
      continue;
    }
    if (trimmed === 'BUNDLED WITH') {
      inSpecs = false;
      inDependencies = false;
      inPlatforms = false;
      continue;
    }

    // Actual gem specs are 4 spaces indent, NOT 6 spaces
    if (inSpecs && line.startsWith('    ') && !line.startsWith('      ')) {
      const match = trimmed.match(/^([a-zA-Z0-9_\-]+) \((.+?)\)/);
      if (match) {
        specs[match[1]] = match[2];
      }
    }

    if (inDependencies && line.startsWith('  ')) {
      const match = trimmed.match(/^([a-zA-Z0-9_\-]+)(?: \((.+?)\))?/);
      if (match) {
        const gemName = match[1];
        const requestedVersion = match[2] ?? '';
        dependencies.push(`${gemName}|${requestedVersion}`);
      }
    }

    if (inPlatforms && line.startsWith('  ')) {
      platforms.push(trimmed);
    }

    if (!inSpecs && !inDependencies && !inPlatforms && /^[ ]{3,}/.test(line) && /^\d/.test(trimmed)) {
      // This captures the version line after "BUNDLED WITH"
      bundledWith = trimmed;
    }
  }

  return { specs, dependencies, platforms, bundledWith };
}
