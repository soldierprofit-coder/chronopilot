import { mountChronoPilot } from './index.js';
import { saveSettings } from './settings-store.js';
import { isSafeSettingPath } from './settings-path.js';
function resolveSetting(path, value) {
    const controller = window.__chronopilot?.controller;
    if (!controller || !path || !isSafeSettingPath(path))
        return null;
    const parts = path.split('.');
    let cursor = controller.settings;
    for (const part of parts.slice(0, -1)) {
        if (!Object.prototype.hasOwnProperty.call(cursor, part))
            return null;
        const next = cursor[part];
        if (!next || typeof next !== 'object')
            return null;
        cursor = next;
    }
    const key = parts.at(-1);
    if (!key || !Object.prototype.hasOwnProperty.call(cursor, key))
        return null;
    const current = cursor[key];
    if (current !== null && typeof current !== typeof value)
        return null;
    if (typeof value === 'number' && !Number.isFinite(value))
        return null;
    return { cursor, key, value };
}
function updateSettings(updates) {
    const controller = window.__chronopilot?.controller;
    if (!controller || !Array.isArray(updates) || updates.length < 1 || updates.length > 32)
        return false;
    const resolved = updates.map((update) => resolveSetting(update.path, update.value));
    if (resolved.some((entry) => entry === null))
        return false;
    for (const entry of resolved) {
        if (!entry)
            return false;
        entry.cursor[entry.key] = entry.value;
    }
    saveSettings(controller.settings);
    return true;
}
window.__chronopilotApi = {
    command(command) {
        const controller = window.__chronopilot?.controller;
        if (!controller)
            return false;
        if (command.type === 'start')
            controller.start();
        else if (command.type === 'stop')
            controller.stop();
        else if (command.type === 'toggle')
            controller.toggle();
        else if (command.type === 'update-setting') {
            return updateSettings([{ path: command.path, value: command.value }]);
        }
        else if (command.type === 'update-settings')
            return updateSettings(command.updates);
        else
            return false;
        return true;
    },
    snapshot() {
        const controller = window.__chronopilot?.controller;
        if (!controller)
            return { ready: false };
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
    const tryMount = () => {
        if (window.__chronopilot || !window.__game?.world)
            return;
        window.__chronopilot = mountChronoPilot(window.__game.world, { showPanel: false });
    };
    tryMount();
    window.setInterval(tryMount, 1_000);
}
