import type { AssistDecision, AssistSettings, CombatObservation, ResolvedAssistProfile } from './types.js';
export declare function resolveAssistProfile(observation: CombatObservation, settings: AssistSettings): ResolvedAssistProfile;
export declare function decideFrost(observation: CombatObservation, settings: AssistSettings): AssistDecision;
