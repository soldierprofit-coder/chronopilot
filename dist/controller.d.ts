import type { AssistDecision, AssistSettings, ControllerStatus } from './types.js';
import { type WocWorldLike } from './woc-adapter.js';
export interface ChronoPilotControllerOptions {
    settings?: AssistSettings;
    onStatus?: (status: ControllerStatus) => void;
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
    toggle(): void;
    notifyManualAbilityInput(now?: number): void;
    tick(now?: number): AssistDecision;
    private emitStatus;
}
