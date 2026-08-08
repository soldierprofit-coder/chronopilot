import { ChronoPilotController } from './controller.js';
import { mountChronoPilotPanel } from './panel.js';
import { loadSettings } from './settings-store.js';
import type { WocWorldLike } from './woc-adapter.js';

const MOVEMENT_KEYS = new Set([
  'w', 'a', 's', 'd', 'q', 'e', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
]);

export interface MountedChronoPilot {
  controller: ChronoPilotController;
  destroy(): void;
}

export interface MountChronoPilotOptions {
  showPanel?: boolean;
}

export function mountChronoPilot(
  world: WocWorldLike,
  options: MountChronoPilotOptions = {},
): MountedChronoPilot {
  let panel: ReturnType<typeof mountChronoPilotPanel> | null = null;
  const controller = new ChronoPilotController(world, {
    settings: loadSettings(),
    onStatus: (status) => panel?.update(status),
  });
  if (options.showPanel !== false) panel = mountChronoPilotPanel(controller);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!controller.status.active || event.repeat) return;
    if (MOVEMENT_KEYS.has(event.key.toLowerCase())) return;
    if ((event.target as HTMLElement | null)?.closest('#chronopilot-panel')) return;
    controller.notifyManualAbilityInput();
  };
  const onPointerDown = (event: PointerEvent): void => {
    if (!controller.status.active) return;
    const target = event.target as HTMLElement | null;
    if (!target || target.closest('#chronopilot-panel')) return;
    if (target.closest('#actionbar, #actionbar2, #spellbook, .action-slot')) {
      controller.notifyManualAbilityInput();
    }
  };
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('pointerdown', onPointerDown, true);

  let raf = 0;
  const frame = (now: number): void => {
    controller.tick(now);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    controller,
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      panel?.destroy();
    },
  };
}

export { ChronoPilotController } from './controller.js';
export { copyDefaultSettings, DEFAULT_SETTINGS } from './defaults.js';
export { decideChronomancy } from './policy.js';
export { decideFrost, resolveAssistProfile } from './frost-policy.js';
export type * from './types.js';
export type { WocWorldLike } from './woc-adapter.js';
