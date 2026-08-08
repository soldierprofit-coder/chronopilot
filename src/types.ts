export type AbilityId =
  | 'arcane_intellect'
  | 'frost_armor'
  | 'frostbolt'
  | 'ice_lance'
  | 'flurry'
  | 'frozen_orb'
  | 'blizzard'
  | 'glacial_spike'
  | 'glacial_front'
  | 'ice_barrier'
  | 'icy_veins'
  | 'summon_water_elemental'
  | 'cone_of_cold'
  | 'presence_of_mind'
  | 'rune_of_power'
  | 'ice_floes'
  | 'cold_snap'
  | 'greater_invisibility'
  | 'rings_of_frost'
  | 'temporal_echo'
  | 'temporal_mend'
  | 'temporal_barrier'
  | 'temporal_cascade'
  | 'temporal_rewind'
  | 'mass_barrier'
  | 'power_echo'
  | 'arcane_surge'
  | 'arcane_missiles'
  | 'arcane_explosion'
  | 'evocation'
  | 'perfect_moment'
  | 'counterspell'
  | 'ice_block'
  | 'blink'
  | 'frost_nova'
  | 'polymorph'
  | 'temporal_hourglass'
  | 'temporal_acceleration'
  | 'temporal_reversal'
  | 'collective_reversal';

export type FrostAbilityId =
  | 'arcane_intellect'
  | 'frost_armor'
  | 'frostbolt'
  | 'ice_lance'
  | 'flurry'
  | 'frozen_orb'
  | 'blizzard'
  | 'glacial_spike'
  | 'glacial_front'
  | 'ice_barrier'
  | 'icy_veins'
  | 'summon_water_elemental'
  | 'cone_of_cold'
  | 'power_echo'
  | 'presence_of_mind'
  | 'rune_of_power'
  | 'counterspell'
  | 'ice_block'
  | 'evocation'
  | 'frost_nova';

export type ModuleKey = 'healing' | 'damageToHeal' | 'defensives' | 'interrupts' | 'resurrection';
export type AssistProfile = 'auto' | 'chronomancy-healer' | 'frost-pve';
export type ResolvedAssistProfile = Exclude<AssistProfile, 'auto'>;
export type CombatContextMode = 'solo' | 'party' | 'raid' | 'pvp';
export type AssistMode = 'auto' | CombatContextMode;
export type EnemyTargetMode =
  | 'tank-target'
  | 'assist-member-target'
  | 'current-target'
  | 'lowest-hp'
  | 'closest-engaged'
  | 'closest-in-range';
export type FriendlyTargetMode = 'lowest-effective-hp' | 'tank-first' | 'current-friendly';

export interface AbilityToggles extends Record<AbilityId, boolean> {}
export interface FrostAbilityToggles extends Record<FrostAbilityId, boolean> {}

export interface HealingProfile {
  mendHpPct: number;
  barrierHpPct: number;
  emergencyHpPct: number;
  cascadeHpPct: number;
  cascadeCount: number;
  massBarrierHpPct: number;
  massBarrierCount: number;
  rewindLossPct: number;
  rewindCount: number;
  conserveManaPct: number;
  stopDamageManaPct: number;
}

export interface FrostProfile {
  autoSummonWaterElemental: boolean;
  smartFrostveilPreShield: boolean;
  blizzardEnemyCount: number;
  frozenOrbEnemyCount: number;
  glacialFrontEnemyCount: number;
  glacialFrontDurableTarget: boolean;
  conserveManaPct: number;
  stopDamageManaPct: number;
  aetherwellManaPct: number;
  barrierHpPct: number;
  iceBlockHpPct: number;
  icyVeinsDurableOnly: boolean;
  smartProcs: boolean;
  smartGlacialBurst: boolean;
  useIcebindPve: boolean;
}

export interface AssistSettings {
  settingsVersion: number;
  assistProfile: AssistProfile;
  mode: AssistMode;
  modules: Record<ModuleKey, boolean>;
  abilities: AbilityToggles;
  frostAbilities: FrostAbilityToggles;
  profiles: Record<CombatContextMode, HealingProfile>;
  frost: FrostProfile;
  thresholds: {
    aetherwellManaPct: number;
    echoRefreshSeconds: number;
    smartPowerEcho: boolean;
    smartPerfectMoment: boolean;
    smartSurgeCharges: boolean;
    maxSurgeCharges: number;
    lowManaMaxSurgeCharges: number;
    aoeEnemyCount: number;
  };
  targeting: {
    assignedTankId: number | null;
    assistMemberId: number | null;
    enemyMode: EnemyTargetMode;
    friendlyMode: FriendlyTargetMode;
    keepEchoOnTank: boolean;
    partyOnly: boolean;
    autoPull: boolean;
    maxTargetRange: number;
    streamTargetSelection: boolean;
  };
  consumables: {
    healthPotion: boolean;
    healthPotionHpPct: number;
    manaPotion: boolean;
    manaPotionManaPct: number;
  };
  pvp: {
    enabled: boolean;
    minSurgeCharges: number;
    maxSurgeCharges: number;
    iceBlockHpPct: number;
    blinkOnRoot: boolean;
    frostNovaHpPct: number;
    frostNovaEnemyCount: number;
    polymorphHpPct: number;
    hourglassHpPct: number;
  };
  safety: {
    manualOverrideMs: number;
    disableInPvp: boolean;
    buffOutOfCombat: boolean;
    decisionIntervalMs: number;
    toggleHotkey: string;
  };
}

export interface AuraSnapshot {
  id: string;
  kind: string;
  remaining: number;
  stacks?: number;
  charges?: number;
  sourceId?: number;
  echoGroup?: boolean;
}

export interface UnitSnapshot {
  id: number;
  name: string;
  playerClass?: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  x: number;
  z: number;
  dead: boolean;
  connected: boolean;
  inCombat: boolean;
  role?: 'tank' | 'healer' | 'dps';
  absorb: number;
  incomingHeal: number;
  rewind: number;
  hasAggro: boolean;
  targetId: number | null;
  auras: AuraSnapshot[];
}

export interface EnemySnapshot {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  x: number;
  z: number;
  dead: boolean;
  hostile: boolean;
  inCombat: boolean;
  targetId: number | null;
  castingAbility: string | null;
  crowdControlled: boolean;
  auras: AuraSnapshot[];
}

export interface CombatObservation {
  player: UnitSnapshot & {
    gcdRemaining: number;
    castingAbility: string | null;
    channeling: boolean;
    cooldowns: Record<string, number>;
    abilityCharges?: Record<string, {
      charges: number;
      maxCharges: number;
      recharge: number;
    }>;
  };
  party: UnitSnapshot[];
  enemies: EnemySnapshot[];
  knownAbilityIds: ReadonlySet<string>;
  talentSpec: string | null;
  assignedTankId: number | null;
  partyLeaderId: number | null;
  currentTargetId: number | null;
  lastEnemyTargetId: number | null;
  individualEcho: { targetId: number; remaining: number } | null;
  frostPetActive: boolean;
  inventory: Readonly<Record<string, number>>;
  potionCooldownRemaining: number;
  partyRosterKey: string;
  aetherInsightNeedsRefresh: boolean;
  raid: boolean;
  cutscene: boolean;
  loading: boolean;
  mounted: boolean;
  controlled: boolean;
  rooted: boolean;
  silenced: boolean;
  pvp: boolean;
}

export type AssistDecision =
  | {
      type: 'cast';
      abilityId: AbilityId;
      targetId?: number;
      selectTargetId?: number;
      priority: number;
      reason: string;
    }
  | { type: 'target'; targetId: number; priority: number; reason: string }
  | {
      type: 'cast-at';
      abilityId: AbilityId;
      x: number;
      z: number;
      targetId?: number;
      priority: number;
      reason: string;
    }
  | { type: 'use-item'; itemId: string; priority: number; reason: string }
  | { type: 'wait'; priority: number; reason: string };

export interface RuntimeMemory {
  individualEchoTargetId: number | null;
  individualEchoExpiresAt: number;
  aetherInsightRosterKey: string | null;
  lastEnemyTargetId: number | null;
}

export interface ControllerStatus {
  active: boolean;
  pausedUntil: number;
  detectedMode: CombatContextMode;
  detectedProfile: ResolvedAssistProfile;
  decision: AssistDecision;
}
