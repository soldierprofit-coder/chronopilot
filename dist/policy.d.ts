import type { AssistDecision, AssistSettings, CombatContextMode, CombatObservation } from './types.js';
export declare function resolveContextMode(observation: CombatObservation, settings: AssistSettings): CombatContextMode;
export declare function decideChronomancy(observation: CombatObservation, settings: AssistSettings): AssistDecision;
