import { ChronoPilotController } from './controller.js';
import type { WocMovementLike, WocWorldLike } from './woc-adapter.js';
export interface MountedChronoPilot {
    controller: ChronoPilotController;
    destroy(): void;
}
export interface MountChronoPilotOptions {
    showPanel?: boolean;
    movement?: WocMovementLike;
}
export declare function isToggleHotkey(eventKey: string, configuredKey: string): boolean;
export declare function mountChronoPilot(world: WocWorldLike, options?: MountChronoPilotOptions): MountedChronoPilot;
export { ChronoPilotController } from './controller.js';
export { copyDefaultSettings, DEFAULT_SETTINGS } from './defaults.js';
export { decideChronomancy } from './policy.js';
export { decideFire, resolveAssistProfile } from './fire-policy.js';
export type * from './types.js';
export type { WocMovementLike, WocWorldLike } from './woc-adapter.js';
