import type { AssistDecision, AssistSettings, ControllerStatus } from './types.js';
import { type WocMovementLike, type WocWorldLike } from './woc-adapter.js';
export interface ChronoPilotControllerOptions {
    settings?: AssistSettings;
    onStatus?: (status: ControllerStatus) => void;
    movement?: WocMovementLike;
}
export declare class ChronoPilotController {
    private readonly world;
    private readonly options;
    readonly settings: AssistSettings;
    private active;
    private pausedUntil;
    private nextDecisionAt;
    private pendingUntil;
    private detectedMode;
    private detectedProfile;
    private decision;
    private aoeMovementActive;
    private nextEmergencyBlinkAt;
    private readonly memory;
    constructor(world: WocWorldLike, options?: ChronoPilotControllerOptions);
    get status(): ControllerStatus;
    partyMembers(): Array<{
        id: number;
        name: string;
        role?: 'tank' | 'healer' | 'dps';
    }>;
    start(): void;
    stop(reason?: string): void;
    dispose(): void;
    toggle(): void;
    notifyManualAbilityInput(now?: number): void;
    tick(now?: number): AssistDecision;
    private updateAoeDodge;
    private releaseAoeMovement;
    private emitStatus;
}
