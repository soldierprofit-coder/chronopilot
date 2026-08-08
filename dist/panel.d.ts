import type { ChronoPilotController } from './controller.js';
import type { ControllerStatus } from './types.js';
export interface MountedChronoPilotPanel {
    element: HTMLElement;
    update(status: ControllerStatus): void;
    destroy(): void;
}
export declare function mountChronoPilotPanel(controller: ChronoPilotController): MountedChronoPilotPanel;
