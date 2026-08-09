import { describe, expect, it } from 'vitest';
import { copyDefaultSettings } from '../src/defaults.js';
import { decideFire, resolveAssistProfile } from '../src/fire-policy.js';
import type { CombatObservation, EnemySnapshot } from '../src/types.js';

function playerUnit(): CombatObservation['player'] {
  return {
    id: 1,
    name: 'Fire Mage',
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
    autoAttacking: false,
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

function observation(known: string[] = ['fireball']): CombatObservation {
  const player = playerUnit();
  return {
    player,
    party: [player],
    enemies: [enemy()],
    knownAbilityIds: new Set(known),
    talentSpec: 'fire',
    assignedTankId: null,
    partyLeaderId: 1,
    currentTargetId: 100,
    lastEnemyTargetId: 100,
    individualEcho: null,
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

function fireSettings() {
  const settings = copyDefaultSettings();
  settings.mode = 'solo';
  settings.targeting.enemyMode = 'current-target';
  settings.targeting.partyOnly = false;
  return settings;
}

describe('Fire PvE and PvP policy', () => {
  it('auto-detects Fire in either PvE or PvP and Chronomancy from Arcane talents', () => {
    const settings = fireSettings();
    const obs = observation(['fireball', 'pyroblast']);
    expect(resolveAssistProfile(obs, settings)).toBe('fire-dps');
    obs.pvp = true;
    expect(resolveAssistProfile(obs, settings)).toBe('fire-dps');
    obs.talentSpec = 'arcane';
    expect(resolveAssistProfile(obs, settings)).toBe('chronomancy-healer');
  });

  it('uses independent Fire toggles even when the healer toggle differs', () => {
    const settings = fireSettings();
    settings.abilities.fireball = false;
    settings.fireAbilities.fireball = true;
    expect(decideFire(observation(['fireball']), settings)).toMatchObject({
      type: 'cast', abilityId: 'fireball', targetId: 100,
    });
  });

  it('plays the official durable-target opener: Rune, Trance, Cinderfall, Hot Streak Pyrelance', () => {
    const settings = fireSettings();
    const obs = observation([
      'rune_of_power', 'combustion', 'fire_blast', 'power_echo', 'pyroblast',
    ]);
    obs.enemies[0]!.maxHp = 3000;
    obs.enemies[0]!.hp = 3000;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'rune_of_power' });

    obs.player.cooldowns.rune_of_power = 40;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'combustion' });

    obs.player.cooldowns.combustion = 100;
    obs.player.auras.push({ id: 'combustion', kind: 'combustion', remaining: 10 });
    obs.player.abilityCharges = {
      fire_blast: { charges: 3, maxCharges: 3, recharge: 0 },
    };
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'fire_blast' });

    obs.player.auras.push({ id: 'hot_streak', kind: 'hot_streak', remaining: 12 });
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'power_echo' });
    obs.player.auras.push({ id: 'power_echo', kind: 'power_echo', remaining: 10 });
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'pyroblast' });
  });

  it('spends Hot Streak on clustered Flamestrike instead of single-target Pyrelance', () => {
    const settings = fireSettings();
    settings.fire.smartBurst = false;
    const obs = observation(['flamestrike', 'pyroblast']);
    obs.player.auras.push({ id: 'hot_streak', kind: 'hot_streak', remaining: 12 });
    obs.enemies.push(enemy(101, 9), enemy(102, 10));
    expect(decideFire(obs, settings)).toMatchObject({
      type: 'cast-at', abilityId: 'flamestrike', targetId: 100,
    });
  });

  it('uses Meteor on a durable single target and full Dragon Breath on a nearby pack', () => {
    const settings = fireSettings();
    settings.fire.smartBurst = false;
    const meteorObs = observation(['meteor']);
    meteorObs.enemies[0]!.maxHp = 3000;
    meteorObs.enemies[0]!.hp = 3000;
    expect(decideFire(meteorObs, settings)).toMatchObject({ type: 'cast-at', abilityId: 'meteor' });

    const breathObs = observation(['dragons_breath']);
    breathObs.enemies.push(enemy(101, 9), enemy(102, 10));
    expect(decideFire(breathObs, settings)).toMatchObject({
      type: 'cast', abilityId: 'dragons_breath',
      reason: "Hold Dragon's Breath to its automatic stage-IV release for 3 nearby enemies.",
    });
  });

  it('weaves Cinderfall while Cinderbolt is already being cast', () => {
    const settings = fireSettings();
    settings.fire.smartBurst = false;
    const obs = observation(['fire_blast', 'fireball']);
    obs.player.castingAbility = 'fireball';
    obs.player.gcdRemaining = 1;
    obs.player.abilityCharges = {
      fire_blast: { charges: 1, maxCharges: 3, recharge: 20 },
    };
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'fire_blast' });
  });

  it('arms wand auto-attack in PvP, then uses mobile Scald pressure', () => {
    const settings = fireSettings();
    settings.mode = 'pvp';
    const obs = observation(['scorch']);
    obs.pvp = true;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'start-attack', targetId: 100 });
    obs.player.autoAttacking = true;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'scorch', targetId: 100 });
  });

  it('uses the visible PvP opponent and targets them before arming attack', () => {
    const settings = fireSettings();
    settings.mode = 'pvp';
    settings.targeting.enemyMode = 'closest-in-range';
    const obs = observation(['scorch']);
    obs.pvp = true;
    obs.currentTargetId = null;
    obs.lastEnemyTargetId = null;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'target', targetId: 100 });
  });

  it('does not break protected crowd control with Fire AoE', () => {
    const settings = fireSettings();
    settings.fire.smartBurst = false;
    const obs = observation(['flamestrike', 'fireball']);
    obs.enemies.push(enemy(101, 9), enemy(102, 10));
    const controlled = enemy(103, 9);
    controlled.crowdControlled = true;
    controlled.auras.push({ id: 'polymorph', kind: 'polymorph', remaining: 20, sourceId: 1 });
    obs.enemies.push(controlled);
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'fireball' });
  });

  it('keeps free Fire value while conserving and switches the filler to Scald', () => {
    const settings = fireSettings();
    settings.fire.smartBurst = false;
    const obs = observation(['scorch', 'fireball']);
    obs.player.mana = 200;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'scorch' });
  });

  it('uses Cold Coffin before damage at critical health', () => {
    const settings = fireSettings();
    const obs = observation(['ice_block', 'fireball']);
    obs.player.hp = 250;
    expect(decideFire(obs, settings)).toMatchObject({ type: 'cast', abilityId: 'ice_block' });
  });
});
