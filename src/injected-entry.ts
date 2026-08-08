import { mountChronoPilot, type MountedChronoPilot } from './index.js';
import { saveSettings } from './settings-store.js';
import { isSafeSettingPath } from './settings-path.js';
import type { WocWorldLike } from './woc-adapter.js';

interface DesktopSettingUpdate {
  path?: string;
  value?: unknown;
}

interface DesktopCommand {
  type: 'start' | 'stop' | 'toggle' | 'update-setting' | 'update-settings';
  path?: string;
  value?: unknown;
  updates?: DesktopSettingUpdate[];
}

interface DesktopSnapshot {
  ready: boolean;
  status?: MountedChronoPilot['controller']['status'];
  settings?: MountedChronoPilot['controller']['settings'];
  partyMembers?: ReturnType<MountedChronoPilot['controller']['partyMembers']>;
}

interface ChronoPilotDesktopApi {
  command(command: DesktopCommand): boolean;
  snapshot(): DesktopSnapshot;
}

declare global {
  interface Window {
    __game?: { world?: WocWorldLike };
    __chronopilot?: MountedChronoPilot;
    __chronopilotBootstrapInstalled?: boolean;
    __chronopilotApi?: ChronoPilotDesktopApi;
  }
}

function resolveSetting(path: string | undefined, value: unknown): {
  cursor: Record<string, unknown>;
  key: string;
  value: unknown;
} | null {
  const controller = window.__chronopilot?.controller;
  if (!controller || !path || !isSafeSettingPath(path)) return null;
  const parts = path.split('.');
  let cursor: Record<string, unknown> = controller.settings as unknown as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) {
    if (!Object.prototype.hasOwnProperty.call(cursor, part)) return null;
    const next = cursor[part];
    if (!next || typeof next !== 'object') return null;
    cursor = next as Record<string, unknown>;
  }
  const key = parts.at(-1);
  if (!key || !Object.prototype.hasOwnProperty.call(cursor, key)) return null;
  const current = cursor[key];
  if (current !== null && typeof current !== typeof value) return null;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  return { cursor, key, value };
}

function updateSettings(updates: DesktopSettingUpdate[] | undefined): boolean {
  const controller = window.__chronopilot?.controller;
  if (!controller || !Array.isArray(updates) || updates.length < 1 || updates.length > 32) return false;
  const resolved = updates.map((update) => resolveSetting(update.path, update.value));
  if (resolved.some((entry) => entry === null)) return false;
  for (const entry of resolved) {
    if (!entry) return false;
    entry.cursor[entry.key] = entry.value;
  }
  saveSettings(controller.settings);
  return true;
}

window.__chronopilotApi = {
  command(command): boolean {
    const controller = window.__chronopilot?.controller;
    if (!controller) return false;
    if (command.type === 'start') controller.start();
    else if (command.type === 'stop') controller.stop();
    else if (command.type === 'toggle') controller.toggle();
    else if (command.type === 'update-setting') {
      return updateSettings([{ path: command.path, value: command.value }]);
    }
    else if (command.type === 'update-settings') return updateSettings(command.updates);
    else return false;
    return true;
  },
  snapshot(): DesktopSnapshot {
    const controller = window.__chronopilot?.controller;
    if (!controller) return { ready: false };
    return {
      ready: true,
      status: controller.status,
      settings: controller.settings,
      partyMembers: controller.partyMembers(),
    };
  },
};

if (!window.__chronopilotBootstrapInstalled) {
  window.__chronopilotBootstrapInstalled = true;
  const tryMount = (): void => {
    if (window.__chronopilot || !window.__game?.world) return;
    window.__chronopilot = mountChronoPilot(window.__game.world, { showPanel: false });
  };
  tryMount();
  window.setInterval(tryMount, 1_000);
}
