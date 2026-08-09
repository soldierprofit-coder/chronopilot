const { access, readdir } = require('node:fs/promises');
const path = require('node:path');

const OFFICIAL_EXE_NAME = 'World of ClaudeCraft.exe';

async function isOfficialClientExe(candidate) {
  if (
    typeof candidate !== 'string'
    || path.basename(candidate).toLowerCase() !== OFFICIAL_EXE_NAME.toLowerCase()
  ) {
    return false;
  }
  try {
    await access(path.resolve(candidate));
    return true;
  } catch {
    return false;
  }
}

function officialClientCandidates(env = process.env) {
  const roots = [
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs'),
    env.PROGRAMFILES,
    env['PROGRAMFILES(X86)'],
  ].filter(Boolean);
  const folders = [
    'World of ClaudeCraft',
    'world-of-claudecraft',
    'world_of_claudecraft',
  ];
  return roots.flatMap((root) => folders.map((folder) => (
    path.join(root, folder, OFFICIAL_EXE_NAME)
  )));
}

async function scanInstallRoot(root, maxDepth = 2) {
  if (!root || maxDepth < 0) return null;
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }
  const direct = entries.find((entry) => (
    entry.isFile() && entry.name.toLowerCase() === OFFICIAL_EXE_NAME.toLowerCase()
  ));
  if (direct) return path.join(root, direct.name);
  if (maxDepth === 0) return null;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name.toLowerCase();
    if (!name.includes('claude') && !name.includes('woc') && !name.startsWith('app-')) continue;
    const found = await scanInstallRoot(path.join(root, entry.name), maxDepth - 1);
    if (found) return found;
  }
  return null;
}

async function findOfficialClient({ savedPath, env = process.env } = {}) {
  const candidates = [savedPath, ...officialClientCandidates(env)].filter(Boolean);
  for (const candidate of candidates) {
    if (await isOfficialClientExe(candidate)) return path.resolve(candidate);
  }
  const scanRoots = [
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs'),
    env.LOCALAPPDATA,
  ].filter(Boolean);
  for (const root of scanRoots) {
    const found = await scanInstallRoot(root);
    if (found && await isOfficialClientExe(found)) return path.resolve(found);
  }
  return null;
}

module.exports = {
  OFFICIAL_EXE_NAME,
  findOfficialClient,
  isOfficialClientExe,
  officialClientCandidates,
  scanInstallRoot,
};
