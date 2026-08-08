import { describe, expect, it } from 'vitest';
import { copyDefaultSettings } from '../src/defaults.js';
import { decideChronomancy, resolveContextMode } from '../src/policy.js';
import type { CombatObservation, UnitSnapshot } from '../src/types.js';

function unit(id: number, role: UnitSnapshot['role'], hp = 1000): UnitSnapshot {
  return {
    id,
    name: id === 1 ? 'Chronomancer' : id === 2 ? 'Tank' : `Ally ${id}`,
    hp,
    maxHp: 1000,
    mana: 1000,
    maxMana: 1000,
    x: id * 2,
    z: 0,
    dead: false,
    connected: true,
    inCombat: true,
    role,
    absorb: 0,
    incomingHeal: 0,
    rewind: 0,
    hasAggro: role === 'tank',
    targetId: null,
    auras: [],
  };
}

function observation(): CombatObservation {
  const player = unit(1, 'healer');
  const tank = unit(2, 'tank');
  tank.auras.push({ id: 'temporal_echo', kind: 'temporal_echo', remaining: 12 });
  return {
    player: {
      ...player,
      gcdRemaining: 0,
      castingAbility: null,
      channeling: false,
      cooldowns: {},
    },
    party: [player, tank, unit(3, 'dps'), unit(4, 'dps'), unit(5, 'dps')],
    enemies: [
      {
        id: 100,
        name: 'Boss',
        hp: 5000,
        maxHp: 5000,
        x: 5,
        z: 0,
        dead: false,
        hostile: true,
        inCombat: true,
        targetId: 2,
        castingAbility: null,
        crowdControlled: false,
      },
    ],
    knownAbilityIds: new Set([
      'temporal_echo', 'temporal_mend', 'temporal_barrier', 'temporal_cascade',
      'temporal_rewind', 'mass_barrier', 'power_echo', 'arcane_surge',
      'arcane_missiles', 'arcane_explosion', 'evocation', 'perfect_moment', 'counterspell',
    ]),
    assignedTankId: 2,
    partyLeaderId: 2,
    currentTargetId: 100,
    lastEnemyTargetId: 100,
    individualEcho: { targetId: 2, remaining: 12 },
    inventory: {},
    potionCooldownRemaining: 0,
    partyRosterKey: '1,2,3,4,5',
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

describe('Chronomancy policy', () => {
  it('uses Rewind first after heavy recent group damage', () => {
    const obs = observation();
    obs.party[1]!.rewind = 250;
    obs.party[2]!.rewind = 220;
    obs.party[3]!.rewind = 300;
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'cast', abilityId: 'temporal_rewind',
    });
  });

  it('uses Mass Barrier when three nearby allies are below its threshold', () => {
    const obs = observation();
    obs.party[1]!.hp = 700;
    obs.party[2]!.hp = 700;
    obs.party[3]!.hp = 700;
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'cast', abilityId: 'mass_barrier',
    });
  });

  it('arms Power Echo for a critical ally before Mend', () => {
    const obs = observation();
    obs.party[1]!.hp = 380;
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'cast', abilityId: 'power_echo',
    });
    obs.player.auras.push({ id: 'power_echo', kind: 'power_echo', remaining: 8 });
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 2,
    });
  });

  it('casts the emergency Mend directly when Smart Power Echo is disabled', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.thresholds.smartPowerEcho = false;
    obs.party[1]!.hp = 380;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 2,
    });
  });

  it('centers Temporal Cascade on the densest injured cluster', () => {
    const obs = observation();
    obs.player.hp = 800;
    obs.party[0]!.hp = 800;
    obs.party[2]!.hp = 800;
    obs.party[3]!.hp = 800;
    obs.player.cooldowns.mass_barrier = 30;
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'cast', abilityId: 'temporal_cascade',
    });
  });

  it('preserves mana and refreshes the individual tank Echo only under one second', () => {
    const obs = observation();
    obs.individualEcho = { targetId: 2, remaining: 1.5 };
    expect(decideChronomancy(obs, copyDefaultSettings())).not.toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 2,
    });

    obs.individualEcho = { targetId: 2, remaining: 0.5 };
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 2,
    });
  });

  it('moves adaptive Echo immediately from a safe tank to an endangered ally', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.targeting.keepEchoOnTank = false;
    obs.party[2]!.hp = 650;
    obs.enemies[0]!.targetId = 3;

    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 3,
    });
  });

  it('keeps adaptive Echo on the tank while the tank is not safe', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.targeting.keepEchoOnTank = false;
    obs.party[1]!.hp = 800;
    obs.party[2]!.hp = 650;
    obs.enemies[0]!.targetId = 3;

    expect(decideChronomancy(obs, settings)).not.toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 3,
    });
  });

  it('returns adaptive Echo to the tank when the rescued ally is safe', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.targeting.keepEchoOnTank = false;
    obs.individualEcho = { targetId: 3, remaining: 10 };

    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 2,
    });
  });

  it('stops offensive casting below the mana floor', () => {
    const obs = observation();
    obs.player.mana = 200;
    obs.player.maxMana = 1000;
    obs.player.cooldowns.evocation = 30;
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({ type: 'wait' });
  });

  it('never acts while casting or controlled, and pauses when PvP assist is disabled', () => {
    const settings = copyDefaultSettings();
    const casting = observation();
    casting.player.castingAbility = 'temporal_mend';
    expect(decideChronomancy(casting, settings)).toMatchObject({ type: 'wait' });
    const controlled = observation();
    controlled.controlled = true;
    expect(decideChronomancy(controlled, settings)).toMatchObject({ type: 'wait' });
    const pvp = observation();
    pvp.pvp = true;
    settings.pvp.enabled = false;
    expect(decideChronomancy(pvp, settings)).toMatchObject({ type: 'wait' });
    const cutscene = observation();
    cutscene.cutscene = true;
    expect(decideChronomancy(cutscene, settings)).toMatchObject({
      type: 'wait', reason: 'Raid transition or cutscene is active.',
    });
  });

  it('applies Aether Insight out of combat when the party buff is missing', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    obs.knownAbilityIds.add('arcane_intellect');
    obs.aetherInsightNeedsRefresh = true;
    obs.player.inCombat = false;
    obs.party = [obs.player];
    obs.party[0]!.inCombat = false;
    obs.partyRosterKey = '1';
    obs.assignedTankId = 1;
    obs.partyLeaderId = 1;
    obs.enemies = [];
    obs.currentTargetId = null;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_intellect',
    });
  });

  it('applies a missing Aether Insight at a safe PvP opening even after combat starts', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.player.inCombat = true;
    obs.player.gcdRemaining = 0;
    obs.party = [obs.player];
    obs.aetherInsightNeedsRefresh = true;
    obs.knownAbilityIds.add('arcane_intellect');
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_intellect',
    });
  });

  it('waits to place Temporal Echo until there is combat intent', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    obs.player.inCombat = false;
    obs.party = [obs.player];
    obs.party[0]!.inCombat = false;
    obs.assignedTankId = 1;
    obs.partyLeaderId = 1;
    obs.individualEcho = null;
    obs.enemies = [];
    obs.currentTargetId = null;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'wait', reason: 'No valid enemy is available inside the configured range.',
    });
  });

  it('places Temporal Echo once before attacking a selected solo target', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.enemyMode = 'current-target';
    obs.player.inCombat = false;
    obs.party = [obs.player];
    obs.party[0]!.inCombat = false;
    obs.assignedTankId = 1;
    obs.partyLeaderId = 1;
    obs.individualEcho = null;
    obs.enemies[0]!.inCombat = false;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 1,
    });
  });

  it('does not spend Perfect Moment immediately on ordinary solo quest mobs', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    obs.party = [obs.player];
    obs.assignedTankId = 1;
    obs.partyLeaderId = 1;
    obs.individualEcho = { targetId: 1, remaining: 12 };
    obs.player.auras.push({ id: 'temporal_echo', kind: 'temporal_echo', remaining: 12 });
    obs.enemies[0]!.maxHp = 500;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_surge',
    });
  });

  it('uses Perfect Moment in a safe raid-wide Echo healing window', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'raid';
    settings.abilities.perfect_moment = true;
    settings.thresholds.smartPerfectMoment = true;
    obs.player.cooldowns.mass_barrier = 30;
    obs.player.cooldowns.temporal_barrier = 30;
    obs.player.cooldowns.temporal_cascade = 30;
    obs.party[1]!.hp = 650;
    obs.party[2]!.hp = 670;
    obs.party[3]!.hp = 680;
    obs.party[2]!.auras.push({
      id: 'temporal_echo', kind: 'temporal_echo', remaining: 8, sourceId: 1, echoGroup: true,
    });
    obs.party[3]!.auras.push({
      id: 'temporal_echo', kind: 'temporal_echo', remaining: 8, sourceId: 1, echoGroup: true,
    });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'perfect_moment',
    });
  });

  it('uses Temporal Cascade before ordinary Mend for clustered raid damage', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'raid';
    obs.player.cooldowns.mass_barrier = 30;
    obs.party[1]!.hp = 650;
    obs.party[2]!.hp = 670;
    obs.party[3]!.hp = 680;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_cascade',
    });
  });

  it('abandons the Perfect Moment damage loop for an emergency heal', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'raid';
    settings.abilities.power_echo = false;
    obs.player.auras.push({ id: 'perfect_moment', kind: 'perfect_moment', remaining: 8 });
    obs.party[1]!.hp = 400;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 2,
    });
  });

  it('prefers an injured ally over a moderately injured healer in party mode', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'party';
    settings.abilities.mass_barrier = false;
    settings.abilities.temporal_cascade = false;
    obs.player.hp = 650;
    obs.party[0]!.hp = 650;
    obs.party[2]!.hp = 680;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 3,
    });
  });

  it('heals self first when the healer is the emergency', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'party';
    settings.abilities.power_echo = false;
    settings.abilities.mass_barrier = false;
    settings.abilities.temporal_cascade = false;
    obs.player.hp = 350;
    obs.party[0]!.hp = 350;
    obs.party[2]!.hp = 400;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 1,
    });
  });

  it('uses an aggro holder or melee frontliner when a party has no tank role', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'party';
    obs.assignedTankId = null;
    obs.party[1]!.role = 'dps';
    obs.party[1]!.playerClass = 'warrior';
    obs.party[1]!.hasAggro = true;
    obs.individualEcho = null;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 2,
    });
  });

  it('selects the closest in-range enemy while questing out of combat', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.enemyMode = 'closest-in-range';
    obs.player.inCombat = false;
    obs.currentTargetId = null;
    obs.enemies[0]!.inCombat = false;
    obs.enemies.push({
      ...obs.enemies[0]!, id: 101, name: 'Closer mob', x: 3, hp: 900, maxHp: 1000,
    });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'target', targetId: 101,
    });
  });

  it('chooses the lowest-HP enemy within range', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.enemyMode = 'lowest-hp';
    obs.currentTargetId = null;
    obs.enemies.push({
      ...obs.enemies[0]!, id: 101, name: 'Wounded mob', x: 8, hp: 100, maxHp: 1000,
    });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'target', targetId: 101,
    });
  });

  it("targets the selected party member's target", () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.targeting.enemyMode = 'assist-member-target';
    settings.targeting.assistMemberId = 3;
    obs.party[2]!.targetId = 101;
    obs.enemies.push({
      ...obs.enemies[0]!, id: 101, name: 'Assisted target', x: 8,
    });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'target', targetId: 101,
    });
  });

  it('switches from questing damage to healing immediately', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.enemyMode = 'closest-in-range';
    obs.party[2]!.hp = 600;
    obs.player.cooldowns.mass_barrier = 30;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 3,
    });
  });

  it('spends one charge with Aether Darts while conserving mana', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.player.mana = 450;
    obs.player.auras.push({ id: 'arcane_surge', kind: 'arcane_surge', remaining: 20, stacks: 1 });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_missiles',
    });
  });

  it('builds toward the smart maximum when mana and group health are full', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.thresholds.smartSurgeCharges = true;
    settings.thresholds.maxSurgeCharges = 4;
    settings.thresholds.lowManaMaxSurgeCharges = 1;
    obs.player.cooldowns.perfect_moment = 30;
    obs.player.auras.push({ id: 'arcane_surge', kind: 'arcane_surge', remaining: 20, stacks: 3 });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_surge',
    });
  });

  it('spends early when smart Surge detects healing pressure', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.thresholds.smartSurgeCharges = true;
    settings.thresholds.maxSurgeCharges = 4;
    settings.thresholds.lowManaMaxSurgeCharges = 1;
    obs.player.cooldowns.perfect_moment = 30;
    obs.party[2]!.hp = 720;
    obs.player.auras.push({ id: 'arcane_surge', kind: 'arcane_surge', remaining: 20, stacks: 1 });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_missiles',
    });
  });

  it('uses the fixed stack target when Smart Surge is disabled', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.thresholds.smartSurgeCharges = false;
    settings.thresholds.maxSurgeCharges = 4;
    settings.thresholds.lowManaMaxSurgeCharges = 1;
    obs.player.cooldowns.perfect_moment = 30;
    obs.party[2]!.hp = 720;
    obs.player.auras.push({ id: 'arcane_surge', kind: 'arcane_surge', remaining: 20, stacks: 1 });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_surge',
    });
  });

  it('builds to the separate four-stack PvP ceiling while the team is healthy', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.knownAbilityIds = new Set(['arcane_surge', 'arcane_missiles']);
    obs.player.auras.push({ id: 'arcane_surge', kind: 'arcane_surge', remaining: 20, stacks: 3 });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_surge',
    });
  });

  it('spends one PvP Surge stack early when an ally is under health pressure', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.party[2]!.hp = 730;
    obs.knownAbilityIds = new Set(['arcane_surge', 'arcane_missiles']);
    obs.player.auras.push({ id: 'arcane_surge', kind: 'arcane_surge', remaining: 20, stacks: 1 });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_missiles',
    });
  });

  it('uses Aetherburst for a nearby engaged pack when mana is healthy', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.enemies.push(
      { ...obs.enemies[0]!, id: 101, name: 'Add one', x: 6 },
      { ...obs.enemies[0]!, id: 102, name: 'Add two', x: 7 },
    );
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'arcane_explosion',
    });
  });

  it('allows each profile to use group healing for one or two allies', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    settings.profiles.party.massBarrierCount = 3;
    settings.profiles.party.cascadeCount = 2;
    obs.party[2]!.hp = 800;
    obs.party[3]!.hp = 800;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_cascade',
    });
  });

  it('auto-detects solo, party, raid, and PvP contexts', () => {
    const settings = copyDefaultSettings();
    const solo = observation();
    solo.party = [solo.player];
    expect(resolveContextMode(solo, settings)).toBe('solo');
    const party = observation();
    expect(resolveContextMode(party, settings)).toBe('party');
    const raid = observation();
    raid.raid = true;
    expect(resolveContextMode(raid, settings)).toBe('raid');
    const pvp = observation();
    pvp.pvp = true;
    pvp.raid = true;
    expect(resolveContextMode(pvp, settings)).toBe('pvp');
  });

  it('uses Ice Block during a controlled PvP emergency', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.controlled = true;
    obs.player.hp = 420;
    obs.knownAbilityIds.add('ice_block');
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'ice_block',
    });
  });

  it('uses Blink to break a root in PvP without wasting Ice Block', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.rooted = true;
    obs.knownAbilityIds.add('blink');
    obs.knownAbilityIds.add('ice_block');
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'blink',
    });
  });

  it('uses Icebind for nearby PvP melee pressure', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.player.hp = 650;
    obs.knownAbilityIds.add('frost_nova');
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'frost_nova',
    });
  });

  it('polymorphs a secondary PvP enemy while an ally is pressured', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.party[2]!.hp = 550;
    obs.knownAbilityIds.add('polymorph');
    obs.enemies.push({
      ...obs.enemies[0]!,
      id: 101,
      name: 'Secondary enemy',
      x: 20,
      targetId: 3,
    });
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'polymorph', targetId: 101,
    });
  });

  it('places a protective Hourglass on a critically injured PvP ally', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.party[2]!.hp = 200;
    obs.knownAbilityIds.add('temporal_hourglass');
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast-at',
      abilityId: 'temporal_hourglass',
      targetId: 3,
      x: obs.party[2]!.x,
      z: obs.party[2]!.z,
    });
  });

  it('uses Temporal Acceleration only in a stable active PvP fight', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.knownAbilityIds.add('temporal_acceleration');
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'cast', abilityId: 'temporal_acceleration',
    });
    obs.party[2]!.hp = 800;
    expect(decideChronomancy(obs, settings)).not.toMatchObject({
      type: 'cast', abilityId: 'temporal_acceleration',
    });
  });

  it('acquires a visible battleground opponent before that opponent attacks', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.currentTargetId = null;
    obs.lastEnemyTargetId = null;
    obs.enemies[0]!.inCombat = false;
    obs.enemies[0]!.targetId = null;
    obs.knownAbilityIds = new Set(['arcane_surge']);

    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'target',
      targetId: 100,
    });
  });

  it('honors the PvP assist master switch', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    settings.pvp.enabled = false;
    expect(decideChronomancy(obs, settings)).toMatchObject({
      type: 'wait', reason: 'PvP / Arena assist is disabled.',
    });
  });

  it('never resurrects during PvP even when legacy resurrection settings are on', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.pvp = true;
    obs.party[2]!.dead = true;
    settings.modules.resurrection = true;
    settings.abilities.temporal_reversal = true;
    settings.abilities.collective_reversal = true;
    obs.knownAbilityIds = new Set(['temporal_reversal', 'collective_reversal']);
    expect(decideChronomancy(obs, settings)).not.toMatchObject({
      type: 'cast', abilityId: 'temporal_reversal',
    });
  });

  it('honors the Resurrection module off switch over stale ability toggles in PvE', () => {
    const obs = observation();
    const settings = copyDefaultSettings();
    obs.party[2]!.dead = true;
    settings.modules.resurrection = false;
    settings.abilities.temporal_reversal = true;
    settings.abilities.collective_reversal = true;
    obs.knownAbilityIds = new Set(['temporal_reversal', 'collective_reversal']);
    expect(decideChronomancy(obs, settings)).not.toMatchObject({
      type: 'cast', abilityId: 'temporal_reversal',
    });
  });

  it('uses the highest available health potion at the configured self threshold', () => {
    const obs = observation();
    obs.player.hp = 250;
    obs.party[0]!.hp = 250;
    obs.inventory = { minor_healing_potion: 2, healing_potion: 1 };
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'use-item', itemId: 'healing_potion',
    });
  });

  it('uses a mana potion when enabled and does not drink automatically', () => {
    const obs = observation();
    obs.player.mana = 150;
    obs.inventory = { mana_potion: 1, moonwell_draught: 4 };
    expect(decideChronomancy(obs, copyDefaultSettings())).toMatchObject({
      type: 'use-item', itemId: 'mana_potion',
    });
  });
});
