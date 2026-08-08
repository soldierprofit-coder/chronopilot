import { ChronoPilotController } from './controller.js';
import type { WocWorldLike } from './woc-adapter.js';
export interface MountedChronoPilot {
    controller: ChronoPilotController;
    destroy(): void;
}
export interface MountChronoPilotOptions {
    showPanel?: boolean;
}
export declare function mountChronoPilot(world: WocWorldLike, options?: MountChronoPilotOptions): MountedChronoPilot;
export { ChronoPilotController } from './controller.js';
export { copyDefaultSettings, DEFAULT_SETTINGS } from './defaults.js';
export { decideChronomancy } from './policy.js';
export { decideFrost, resolveAssistProfile } from './frost-policy.js';
export type * from './types.js';
export type { WocWorldLike } from './woc-adapter.js';
