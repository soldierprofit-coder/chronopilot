import type { AssistSettings, CombatObservation, RuntimeMemory } from './types.js';
interface WocAuraLike {
    id?: unknown;
    kind?: unknown;
    remaining?: unknown;
    stacks?: unknown;
    charges?: unknown;
    sourceId?: unknown;
    echoGroup?: unknown;
}
interface WocEntityLike {
    id: number;
    kind: string;
    name: string;
    hp: number;
    maxHp: number;
    resource: number;
    maxResource: number;
    pos: {
        x: number;
        z: number;
    };
    dead: boolean;
    hostile: boolean;
    inCombat: boolean;
    targetId: number | null;
    ownerId?: number | null;
    aggroTargetId?: number | null;
    castingAbility: string | null;
    channeling: boolean;
    gcdRemaining: number;
    autoAttack?: boolean;
    potionCdRemaining?: number;
    cooldowns: Map<string, number>;
    abilityCharges?: Record<string, {
        charges: number;
        maxCharges: number;
        recharge: number;
    }>;
    auras: WocAuraLike[];
}
interface WocDuelInfoLike {
    state?: string;
    otherPid?: number;
}
interface WocArenaMatchLike {
    state?: string;
    oppPid?: number;
    enemies?: Array<{
        pid?: number;
    }>;
}
interface WocArenaInfoLike {
    match?: WocArenaMatchLike | null;
}
interface WocBattlegroundPlayerLike {
    pid?: number;
    team?: number;
    dead?: boolean;
}
interface WocBattlegroundMatchLike {
    state?: string;
    myTeam?: number;
    players?: WocBattlegroundPlayerLike[];
}
interface WocBattlegroundInfoLike {
    match?: WocBattlegroundMatchLike | null;
}
interface WocPartyMemberLike {
    pid: number;
    name: string;
    cls?: string;
    hp: number;
    mhp: number;
    res: number;
    mres: number;
    x: number;
    z: number;
    dead: number;
    inCombat: number;
    connected?: number;
    role?: 'tank' | 'healer' | 'dps';
    absorb?: number;
    rewind?: number;
    hasAggro?: number;
    incomingHeal?: number;
    auras?: WocAuraLike[];
}
export interface WocRiftDeathZoneLike {
    x: number;
    z: number;
    radius: number;
    remaining: number;
}
export interface WocMovementLike {
    setControllerMoveInput(input: unknown, facing?: unknown): void;
    setControllerFacing?(facing: unknown): void;
    clearControllerMoveInput(): void;
}
export interface WocWorldLike {
    playerId: number;
    player: WocEntityLike;
    entities: Map<number, WocEntityLike>;
    known: Array<{
        def: {
            id: string;
        };
    }>;
    inventory: Array<{
        itemId: string;
        count: number;
    }>;
    partyInfo: {
        leader: number;
        raid?: boolean;
        members: WocPartyMemberLike[];
    } | null;
    talentSpec?: string | null;
    duelInfo?: WocDuelInfoLike | null;
    arenaInfo?: WocArenaInfoLike | null;
    cupInfo?: {
        match?: unknown;
    } | null;
    bgInfo?: WocBattlegroundInfoLike | null;
    cfg?: {
        playerClass?: string;
    };
    riftBossDeathZones?(): WocRiftDeathZoneLike[];
    castAbility(abilityId: string): void;
    castAbilityAt(abilityId: string, aim: {
        x: number;
        z: number;
    }): void;
    castAbilityOn(abilityId: string, targetId: number): void;
    targetEntity(id: number | null): void;
    useItem(itemId: string): void;
    startAutoAttack?(): void;
}
export declare function observationRadius(settings: Pick<AssistSettings, 'targeting'>): number;
export declare function activePvpState(world: Pick<WocWorldLike, 'duelInfo' | 'arenaInfo' | 'cupInfo' | 'bgInfo'>): boolean;
export declare function observeWocWorld(world: WocWorldLike, settings: AssistSettings, memory: RuntimeMemory, now: number): CombatObservation;
export {};
