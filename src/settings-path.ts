export function isSafeSettingPath(path: string): boolean {
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(path)) return false;
  const parts = path.split('.');
  return !parts.some(
    (part) => part === '__proto__' || part === 'prototype' || part === 'constructor',
  );
}
