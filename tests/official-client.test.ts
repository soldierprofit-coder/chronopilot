import { createRequire } from 'node:module';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { isOfficialClientExe, officialClientCandidates } = require('../desktop/official-client.cjs') as {
  isOfficialClientExe(candidate: string): Promise<boolean>;
  officialClientCandidates(env: Record<string, string>): string[];
};

describe('official client detection', () => {
  it('checks the usual per-user and Program Files install folders', () => {
    const candidates = officialClientCandidates({
      LOCALAPPDATA: 'C:\\Users\\Mage\\AppData\\Local',
      PROGRAMFILES: 'C:\\Program Files',
      'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
    });
    expect(candidates.some((candidate) => candidate.includes('Programs'))).toBe(true);
    expect(candidates.every((candidate) => candidate.endsWith('World of ClaudeCraft.exe'))).toBe(true);
  });

  it('accepts only a readable executable with the official filename', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'chronopilot-client-'));
    const official = path.join(root, 'World of ClaudeCraft.exe');
    const unrelated = path.join(root, 'Other Game.exe');
    await writeFile(official, 'test');
    await writeFile(unrelated, 'test');
    await expect(isOfficialClientExe(official)).resolves.toBe(true);
    await expect(isOfficialClientExe(unrelated)).resolves.toBe(false);
  });
});
