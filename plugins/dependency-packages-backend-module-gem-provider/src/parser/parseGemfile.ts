import fs from 'fs/promises';
import { GemHandle, VersionHandle } from '../types';

export const parseGemfile = async (filePath: string): Promise<Record<GemHandle, VersionHandle[]>> => {
  const contents = await fs.readFile(filePath.replace('file:', ''), 'utf-8');
  const lines = contents.split('\n');

  const gemGroups: Record<string, string[]> = {};
  let currentGroups: string[] = [];

  for (const line of lines) {
    const groupMatch = line.trim().match(/^group\s+(.*)?\s+do/);
    if (groupMatch) {
      // Extract symbols like :development, :test
      currentGroups = groupMatch[1]
        .split(',')
        .map(g => g.trim().replace(/^:/, ''));
    } else if (line.trim().startsWith('end')) {
      currentGroups = [];
    } else {
      const gemMatch = line.trim().match(/^gem\s+['"]([^'"]+)['"]/);
      if (gemMatch) {
        const gemName = gemMatch[1];
        gemGroups[gemName] = [...new Set([...(gemGroups[gemName] || []), ...currentGroups])];
      }
    }
  }

  return gemGroups;
}
