import { describe, expect, it } from 'vitest';
import { copyDefaultSettings } from '../src/defaults.js';
import { decideFrost, resolveAssistProfile } from '../src/frost-policy.js';
import type { CombatObservation, EnemySnapshot, UnitSnapshot } from '../src/types.js';

function playerUnit(): CombatObservation['player'] {
  return {
    id: 1,
    name: 'Frost Mage',
    playerClass: 'mage',
    hp: 1000,
    maxHp: 1000,
    mana: 1000,
    maxMana: 1000,
    x: 0,
    z: 0,
    dead: false,
    connected: true,
    inCombat: true,
    role: 'dps',
    absorb: 0,
    incomingHeal: 0,
    rewind: 0,
    hasAggro: false,
    targetId: 100,
    auras: [{ id: 'frost_armor', kind: 'buff_armor', remaining: 1200 }],
    gcdRemaining: 0,
    castingAbility: null,
    channeling: false,
    cooldowns: {},
  };
}

function enemy(id = 100, x = 8): EnemySnapshot {
  return {
    id,
    name: `Enemy ${id}`,
    hp: 1000,
    maxHp: 1000,
    x,
    z: 0,
    dead: false,
    hostile: true,
    inCombat: true,
    targetId: 1,
    castingAbility: null,
    crowdControlled: false,
    auras: [],
  };
}

function observation(known: string[] = ['frostbolt']): CombatObservation {
  const player = playerUnit();
  return {
    player,
    party: [player],
    enemies: [enemy()],
    knownAbilityIds: new Set(known),
    talentSpec: 'frost',
    assignedTankId: null,
    partyLeaderId: 1,
    currentTargetId: 100,
    lastEnemyTargetId: 100,
    individualEcho: null,
    frostPetActive: true,
    inventory: {},
    potionCooldownRemaining: 0,
    partyRosterKey: '1',
    aetherInsightNeedsRefresh: false,
    raid: false,
    cutscene: false,
    loading: false,
    mounted: false,
    controlled: false,
    rooted: false,
    silenced: false,
    pvp: false,
  };
}

function frostSettings() {
  const settings = copyDefaultSettings();
  settings.mode = 'solo';
  settings.targeting.enemyMode = 'current-target';
  settings.targeting.partyOnly = false;
  return settings;
}

describe('Frost PvE policy', () => {
  it('auto-detects Frost talents in PvE while preserving the Chronomancy PvP engine', () => {
    const settings = frostSettings();
    const obs = observation(['frostbolt', 'ice_lance']);
    expect(resolveAssistProfile(obs, settings)).toBe('frost-pve');
    obs.pvp = true;
    expect(resolveAssistProfile(obs, settings)).toBe('chronomancy-healer');
    settings.assistProfile = 'frost-pve';
    expect(resolveAssistProfile(obs, settings)).toBe('frost-pve');
  });

  it('uses the independent Frost skill profile even if healer skill toggles differ', () => {
    const settings = frostSettings();
    settings.abilities.frostbolt = false;
    settings.frostAbilities.frostbolt = true;
    expect(decideFrost(observation(['frostbolt']), settings)).toMatchObject({
      type: 'cast', abilityId: 'frostbolt', targetId: 100,
    });
  });

  it('spends Fingers before Brain Freeze so proc stacks cannot overcap', () => {
    const settings = frostSettings();
    const obs = observation(['ice_lance', 'flurry']);
    obs.player.auras.push(
      { id: 'fingers_of_frost', kind: 'fingers_of_frost', remaining: 12, stacks: 2 },
      { id: 'brain_freeze', kind: 'brain_freeze', remaining: 12 },
    );
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'ice_lance', targetId: 100,
    });
  });

  it('turns Brain Freeze into Winterlash, then spends Winter’s Chill with Ice Lance', () => {
    const settings = frostSettings();
    const obs = observation(['ice_lance', 'flurry']);
    obs.player.auras.push({ id: 'brain_freeze', kind: 'brain_freeze', remaining: 12 });
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'flurry', targetId: 100,
    });

    obs.player.auras = obs.player.auras.filter((aura) => aura.kind !== 'brain_freeze');
    obs.enemies[0]!.auras.push({
      id: 'winters_chill', kind: 'winters_chill', remaining: 5, charges: 2, sourceId: 1,
    });
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'ice_lance', targetId: 100,
    });
  });

  it('prepares a five-Icicle Glacial Spike with Power Echo', () => {
    const settings = frostSettings();
    const obs = observation(['glacial_spike', 'power_echo']);
    obs.player.auras.push({ id: 'icicles', kind: 'icicles', remaining: 20, stacks: 5 });
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'power_echo', selectTargetId: 100,
    });
  });

  it('uses Frozen Orb before Blizzard on a safe three-target pack', () => {
    const settings = frostSettings();
    const obs = observation(['frozen_orb', 'blizzard']);
    obs.enemies.push(enemy(101, 10), enemy(102, 12));
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'frozen_orb', selectTargetId: 100,
    });

    obs.player.cooldowns.frozen_orb = 20;
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast-at', abilityId: 'blizzard', targetId: 100,
    });
  });

  it('freezes a pack before committing to a full automatic Glacial Front', () => {
    const settings = frostSettings();
    const obs = observation(['frost_nova', 'glacial_front']);
    obs.enemies.push(enemy(101, 9), enemy(102, 10));
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'frost_nova', selectTargetId: 100,
    });

    obs.player.cooldowns.frost_nova = 20;
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'glacial_front', selectTargetId: 100,
      reason: 'Hold Glacial Front through its automatic stage-IV release.',
    });
  });

  it('does not use pack AoE beside a protected crowd-controlled target', () => {
    const settings = frostSettings();
    const obs = observation(['frozen_orb', 'blizzard', 'glacial_front', 'frostbolt']);
    obs.enemies.push(enemy(101, 10), enemy(102, 12));
    const controlled = enemy(103, 9);
    controlled.auras.push({ id: 'polymorph', kind: 'polymorph', remaining: 20, sourceId: 1 });
    obs.enemies.push(controlled);
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'frostbolt', targetId: 100,
    });
  });

  it('maintains pre-combat buffs and the Water Elemental without using healer rules', () => {
    const settings = frostSettings();
    const obs = observation(['arcane_intellect', 'frost_armor', 'summon_water_elemental']);
    obs.player.inCombat = false;
    obs.enemies = [];
    obs.currentTargetId = null;
    obs.lastEnemyTargetId = null;
    obs.aetherInsightNeedsRefresh = true;
    obs.player.auras = [];
    obs.frostPetActive = false;
    expect(decideFrost(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'arcane_intellect' });

    obs.aetherInsightNeedsRefresh = false;
    expect(decideFrost(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'frost_armor' });

    obs.player.auras.push({ id: 'frost_armor', kind: 'buff_armor', remaining: 1200 });
    expect(decideFrost(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'summon_water_elemental' });
  });

  it('holds damage at the Frost-specific emergency mana floor', () => {
    const settings = frostSettings();
    const obs = observation(['frostbolt']);
    obs.player.mana = 40;
    expect(decideFrost(obs, settings)).toMatchObject({
      type: 'wait', reason: 'Frost damage is paused at the configured emergency mana floor.',
    });
  });

  it('uses Cold Coffin before attempting damage at critical health', () => {
    const settings = frostSettings();
    const obs = observation(['ice_block', 'frostbolt']);
    obs.player.hp = 250;
    expect(decideFrost(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'ice_block' });
  });

  it('uses a stored Frost charge even while that ability is recharging', () => {
    const settings = frostSettings();
    const obs = observation(['ice_block', 'frostbolt']);
    obs.player.hp = 250;
    obs.player.cooldowns.ice_block = 200;
    obs.player.abilityCharges = {
      ice_block: { charges: 1, maxCharges: 2, recharge: 200 },
    };
    expect(decideFrost(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'ice_block' });
  });
});
