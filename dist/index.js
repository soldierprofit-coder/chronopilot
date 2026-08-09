import { ChronoPilotController } from './controller.js';
import { mountChronoPilotPanel } from './panel.js';
import { loadSettings } from './settings-store.js';
const MOVEMENT_KEYS = new Set([
    'w', 'a', 's', 'd', 'q', 'e', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
]);
export function isToggleHotkey(eventKey, configuredKey) {
    return configuredKey.length > 0 && eventKey.toLowerCase() === configuredKey.toLowerCase();
}
export function mountChronoPilot(world, options = {}) {
    let panel = null;
    const controller = new ChronoPilotController(world, {
        settings: loadSettings(),
        onStatus: (status) => panel?.update(status),
        movement: options.movement,
    });
    if (options.showPanel !== false)
        panel = mountChronoPilotPanel(controller);
    const onKeyDown = (event) => {
        if (event.repeat)
            return;
        if (isToggleHotkey(event.key, controller.settings.safety.toggleHotkey)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            controller.toggle();
            return;
        }
        if (!controller.status.active)
            return;
        if (MOVEMENT_KEYS.has(event.key.toLowerCase()))
            return;
        if (event.target?.closest('#chronopilot-panel'))
            return;
        controller.notifyManualAbilityInput();
    };
    const onPointerDown = (event) => {
        if (!controller.status.active)
            return;
        const target = event.target;
        if (!target || target.closest('#chronopilot-panel'))
            return;
        if (target.closest('#actionbar, #actionbar2, #spellbook, .action-slot')) {
            controller.notifyManualAbilityInput();
        }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    let timer = 0;
    let destroyed = false;
    const scheduleTick = () => {
        if (destroyed)
            return;
        const delay = controller.status.active
            ? Math.max(50, controller.settings.safety.decisionIntervalMs)
            : 250;
        timer = window.setTimeout(() => {
            controller.tick(performance.now());
            scheduleTick();
        }, delay);
    };
    scheduleTick();
    return {
        controller,
        destroy: () => {
            destroyed = true;
            window.clearTimeout(timer);
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('pointerdown', onPointerDown, true);
            controller.dispose();
            panel?.destroy();
        },
    };
}
export { ChronoPilotController } from './controller.js';
export { copyDefaultSettings, DEFAULT_SETTINGS } from './defaults.js';
export { decideChronomancy } from './policy.js';
export { decideFire, resolveAssistProfile } from './fire-policy.js';
