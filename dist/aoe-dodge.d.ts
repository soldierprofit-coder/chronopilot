export interface AoeDangerZone {
    x: number;
    z: number;
    radius: number;
    remaining: number;
}
export interface AoeDodgePlan {
    x: number;
    z: number;
    facing: number;
    distance: number;
    remaining: number;
    blinkSafe: boolean;
    needsEmergencyBlink: boolean;
}
export declare const AOE_SAFETY_MARGIN = 1;
export declare const AOE_REACTION_BUFFER_SECONDS = 0.25;
export declare const ASSUMED_RUN_SPEED = 7;
export declare const FLICKERSTEP_DISTANCE = 15;
/**
 * Finds the shortest straight-line exit from the union of active Rift danger
 * circles. The game intentionally leaves a walkable escape window; sampling
 * several headings also keeps stacked S-rank circles from steering the player
 * into a second telegraph.
 */
export declare function planAoeDodge(player: {
    x: number;
    z: number;
}, source: readonly AoeDangerZone[], continuing?: boolean): AoeDodgePlan | null;
