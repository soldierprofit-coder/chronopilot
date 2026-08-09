import { describe, expect, it } from 'vitest';
import { ChronoPilotController } from '../src/controller.js';
import { copyDefaultSettings } from '../src/defaults.js';
import type { WocMovementLike, WocWorldLike } from '../src/woc-adapter.js';

function worldWithInterruptedCast(): WocWorldLike {
  const player = {
    id: 1,
    kind: 'player',
    name: 'Chronomancer',
    hp: 1000,
    maxHp: 1000,
    resource: 1000,
    maxResource: 1000,
    pos: { x: 0, z: 0 },
    dead: false,
    hostile: false,
    inCombat: true,
    targetId: 100,
    castingAbility: null,
    channeling: false,
    gcdRemaining: 0,
    cooldowns: new Map<string, number>(),
    auras: [],
  };
  const enemy = {
    ...player,
    id: 100,
    kind: 'mob',
    name: 'Target',
    hp: 500,
    maxHp: 500,
    hostile: true,
    targetId: 1,
  };
  return {
    playerId: 1,
    player,
    entities: new Map([[1, player], [100, enemy]]),
    known: [{ def: { id: 'temporal_echo' } }],
    inventory: [],
    partyInfo: null,
    castAbility: () => { throw new Error('movement interrupted the cast'); },
    castAbilityAt: () => { throw new Error('movement interrupted the cast'); },
    castAbilityOn: () => { throw new Error('movement interrupted the cast'); },
    targetEntity: () => undefined,
    useItem: () => undefined,
  };
}

describe('ChronoPilotController', () => {
  it('gives Rift AoE movement priority over casts and manual override pauses', () => {
    const world = worldWithInterruptedCast();
    const inputs: unknown[] = [];
    const movement: WocMovementLike = {
      setControllerMoveInput: (input) => { inputs.push(input); },
      clearControllerMoveInput: () => undefined,
    };
    world.riftBossDeathZones = () => [
      { x: 0, z: 0, radius: 9, remaining: 3 },
    ];
    const controller = new ChronoPilotController(world, { movement });

    controller.start();
    controller.notifyManualAbilityInput(0);
    expect(controller.tick(100)).toMatchObject({
      type: 'move',
      reason: 'Dodging AoE — moving to the nearest safe edge.',
    });
    expect(inputs).toHaveLength(1);
  });

  it('uses Flickerstep when the Rift fuse is too short for walking', () => {
    const world = worldWithInterruptedCast();
    const casts: string[] = [];
    const facings: number[] = [];
    world.known = [{ def: { id: 'blink' } }];
    world.castAbility = (abilityId) => { casts.push(abilityId); };
    world.riftBossDeathZones = () => [
      { x: 0, z: 0, radius: 9, remaining: 0.6 },
    ];
    const movement: WocMovementLike = {
      setControllerMoveInput: () => undefined,
      setControllerFacing: (facing) => { facings.push(Number(facing)); },
      clearControllerMoveInput: () => undefined,
    };
    const controller = new ChronoPilotController(world, { movement });

    controller.start();
    expect(controller.tick(100)).toMatchObject({
      type: 'cast',
      abilityId: 'blink',
      reason: 'Dodging AoE — emergency Flickerstep, then resume combat.',
    });
    expect(casts).toEqual(['blink']);
    expect(facings).toHaveLength(1);
  });

  it('releases automatic movement and resumes decisions after reaching safety', () => {
    const world = worldWithInterruptedCast();
    let zones = [{ x: 0, z: 0, radius: 9, remaining: 3 }];
    let clears = 0;
    world.riftBossDeathZones = () => zones;
    const movement: WocMovementLike = {
      setControllerMoveInput: () => undefined,
      clearControllerMoveInput: () => { clears++; },
    };
    const controller = new ChronoPilotController(world, { movement });

    controller.start();
    expect(controller.tick(100).type).toBe('move');
    zones = [];
    expect(controller.tick(200).type).not.toBe('move');
    expect(clears).toBe(1);
  });

  it('leaves movement entirely manual when Dodge AoE is disabled', () => {
    const world = worldWithInterruptedCast();
    let inputs = 0;
    world.riftBossDeathZones = () => [
      { x: 0, z: 0, radius: 9, remaining: 3 },
    ];
    const movement: WocMovementLike = {
      setControllerMoveInput: () => { inputs++; },
      clearControllerMoveInput: () => undefined,
    };
    const settings = copyDefaultSettings();
    settings.safety.dodgeAoe = false;
    const controller = new ChronoPilotController(world, { settings, movement });

    controller.start();
    expect(controller.tick(100).type).not.toBe('move');
    expect(inputs).toBe(0);
  });

  it('clears an active AoE movement command when Assist stops', () => {
    const world = worldWithInterruptedCast();
    let clears = 0;
    world.riftBossDeathZones = () => [
      { x: 0, z: 0, radius: 9, remaining: 3 },
    ];
    const movement: WocMovementLike = {
      setControllerMoveInput: () => undefined,
      clearControllerMoveInput: () => { clears++; },
    };
    const controller = new ChronoPilotController(world, { movement });

    controller.start();
    controller.tick(100);
    controller.stop();
    expect(clears).toBe(1);
  });

  it('does not scan the world while a cast or global cooldown is active', () => {
    const world = worldWithInterruptedCast();
    world.player.castingAbility = 'frostbolt';
    world.entities = new Map();
    const values = world.entities.values.bind(world.entities);
    world.entities.values = () => {
      throw new Error('world scan should be skipped');
    };
    const controller = new ChronoPilotController(world);
    controller.start();
    expect(() => controller.tick(1)).not.toThrow();
    world.entities.values = values;
  });

  it('auto-detects Fire talents and shows the enemy before a targetless Meteor cast', () => {
    const world = worldWithInterruptedCast();
    const targets: Array<number | null> = [];
    const casts: string[] = [];
    world.talentSpec = 'fire';
    world.player.targetId = null;
    world.known = [{ def: { id: 'meteor' } }];
    const target = world.entities.get(100)!;
    target.maxHp = 3_000;
    target.hp = 3_000;
    world.targetEntity = (targetId) => {
      targets.push(targetId);
      world.player.targetId = targetId;
    };
    world.castAbility = (abilityId) => { casts.push(abilityId); };
    world.castAbilityAt = (abilityId) => { casts.push(abilityId); };
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.enemyMode = 'closest-in-range';
    settings.targeting.partyOnly = false;
    settings.targeting.streamTargetSelection = true;
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'target', targetId: 100,
    });
    expect(controller.status.detectedProfile).toBe('fire-dps');
    expect(targets).toEqual([100]);
    expect(controller.tick(300)).toMatchObject({
      type: 'cast-at', abilityId: 'meteor', targetId: 100,
    });
    expect(casts).toEqual(['meteor']);
  });

  it('arms the official wand auto-attack in Fire PvP', () => {
    const world = worldWithInterruptedCast();
    let attacks = 0;
    world.talentSpec = 'fire';
    world.arenaInfo = { match: { state: 'active', oppPid: 100, enemies: [{ pid: 100 }] } };
    world.known = [{ def: { id: 'scorch' } }];
    world.startAutoAttack = () => {
      attacks++;
      world.player.autoAttack = true;
    };
    world.castAbility = () => undefined;
    world.castAbilityOn = () => undefined;
    const settings = copyDefaultSettings();
    settings.mode = 'pvp';
    settings.targeting.enemyMode = 'current-target';
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({ type: 'start-attack', targetId: 100 });
    expect(attacks).toBe(1);
    expect(controller.tick(300)).toMatchObject({ type: 'cast', abilityId: 'scorch' });
  });

  it('scans during a Fire cast so off-GCD Cinderfall can be woven', () => {
    const world = worldWithInterruptedCast();
    const casts: string[] = [];
    world.talentSpec = 'fire';
    world.player.castingAbility = 'fireball';
    world.player.gcdRemaining = 1;
    world.player.abilityCharges = {
      fire_blast: { charges: 1, maxCharges: 3, recharge: 20 },
    };
    world.known = [{ def: { id: 'fire_blast' } }];
    world.castAbilityOn = (abilityId) => { casts.push(abilityId); };
    const settings = copyDefaultSettings();
    settings.fire.smartBurst = false;
    settings.targeting.enemyMode = 'current-target';
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({ type: 'cast', abilityId: 'fire_blast' });
    expect(casts).toEqual(['fire_blast']);
  });

  it('turns a refused or interrupted cast into a retryable wait instead of crashing', () => {
    const controller = new ChronoPilotController(worldWithInterruptedCast());
    controller.start();
    expect(() => controller.tick(1)).not.toThrow();
    expect(controller.status.decision).toMatchObject({
      type: 'wait',
      reason: 'The action was interrupted or refused. It will retry when ready.',
    });
    expect(controller.status.active).toBe(true);
  });

  it('does not forget a confirmed tank Echo after manual input', () => {
    const world = worldWithInterruptedCast();
    const casts: Array<{ abilityId: string; targetId: number }> = [];
    const tank = {
      pid: 2,
      name: 'Tank',
      cls: 'warrior',
      hp: 1000,
      mhp: 1000,
      res: 0,
      mres: 0,
      x: 2,
      z: 0,
      dead: 0,
      inCombat: 1,
      connected: 1,
      role: 'tank' as const,
    };
    world.partyInfo = { leader: 2, members: [tank] };
    world.castAbility = () => undefined;
    world.castAbilityOn = (abilityId, targetId) => { casts.push({ abilityId, targetId }); };
    const settings = copyDefaultSettings();
    settings.mode = 'party';
    settings.safety.manualOverrideMs = 250;
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'cast', abilityId: 'temporal_echo', targetId: 2,
    });
    controller.notifyManualAbilityInput(1_000);
    controller.tick(1_250);
    controller.tick(2_000);

    expect(casts).toEqual([{ abilityId: 'temporal_echo', targetId: 2 }]);
  });

  it('keeps the healed ally selected until a later assist action needs the enemy', () => {
    const world = worldWithInterruptedCast();
    const targetEvents: Array<number | null> = [];
    const casts: Array<{ abilityId: string; targetId: number }> = [];
    world.player.hp = 300;
    world.known = [{ def: { id: 'temporal_mend' } }];
    world.targetEntity = (targetId) => {
      targetEvents.push(targetId);
      world.player.targetId = targetId;
    };
    world.castAbility = () => undefined;
    world.castAbilityOn = (abilityId, targetId) => {
      casts.push({ abilityId, targetId });
    };
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.streamTargetSelection = true;
    settings.targeting.enemyMode = 'current-target';
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 1,
    });
    expect(targetEvents).toEqual([1]);
    expect(casts).toEqual([{ abilityId: 'temporal_mend', targetId: 1 }]);

    world.player.hp = 1000;
    world.player.castingAbility = null;
    world.player.gcdRemaining = 0;
    world.known = [{ def: { id: 'arcane_surge' } }];
    settings.modules.healing = false;
    expect(controller.tick(500)).toMatchObject({
      type: 'target', targetId: 100,
    });
    expect(targetEvents).toEqual([1, 100]);
    expect(world.player.targetId).toBe(100);

    expect(controller.tick(800)).toMatchObject({
      type: 'cast', abilityId: 'arcane_surge',
    });
    expect(targetEvents).toEqual([1, 100]);
  });

  it('moves directly from one healed ally to the next without selecting an enemy between them', () => {
    const world = worldWithInterruptedCast();
    const targetEvents: Array<number | null> = [];
    const allyEntity = {
      ...world.player,
      id: 2,
      name: 'Ally 2',
      hp: 300,
      hostile: false,
      targetId: 100,
    };
    world.player.hp = 1000;
    world.entities.set(2, allyEntity);
    world.partyInfo = {
      leader: 2,
      members: [{
        pid: 2,
        name: 'Ally 2',
        hp: 300,
        mhp: 1000,
        res: 1000,
        mres: 1000,
        x: 2,
        z: 0,
        dead: 0,
        inCombat: 1,
        connected: 1,
        role: 'dps',
      }],
    };
    world.known = [{ def: { id: 'temporal_mend' } }];
    world.targetEntity = (targetId) => {
      targetEvents.push(targetId);
      world.player.targetId = targetId;
    };
    world.castAbility = () => undefined;
    world.castAbilityOn = () => undefined;
    const settings = copyDefaultSettings();
    settings.mode = 'party';
    settings.targeting.streamTargetSelection = true;
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 2,
    });
    expect(targetEvents).toEqual([2]);

    world.partyInfo.members[0]!.hp = 1000;
    const allyThree = { ...allyEntity, id: 3, name: 'Ally 3', hp: 250 };
    world.entities.set(3, allyThree);
    world.partyInfo.members.push({
      pid: 3,
      name: 'Ally 3',
      hp: 250,
      mhp: 1000,
      res: 1000,
      mres: 1000,
      x: 3,
      z: 0,
      dead: 0,
      inCombat: 1,
      connected: 1,
      role: 'dps',
    });
    expect(controller.tick(500)).toMatchObject({
      type: 'cast', abilityId: 'temporal_mend', targetId: 3,
    });
    expect(targetEvents).toEqual([2, 3]);
    expect(world.player.targetId).toBe(3);
  });

  it('does not switch targets or cast during the Nythraxis transition', () => {
    const world = worldWithInterruptedCast();
    const targetEvents: Array<number | null> = [];
    const casts: string[] = [];
    world.player.hp = 300;
    world.player.auras = [{
      id: 'nythraxis_transition_stun',
      kind: 'stun',
      remaining: 20,
    }];
    world.known = [{ def: { id: 'temporal_mend' } }];
    world.targetEntity = (targetId) => { targetEvents.push(targetId); };
    world.castAbilityOn = (abilityId) => { casts.push(abilityId); };
    const settings = copyDefaultSettings();
    settings.targeting.streamTargetSelection = true;
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'wait', reason: 'Raid transition or cutscene is active.',
    });
    expect(targetEvents).toEqual([]);
    expect(casts).toEqual([]);
  });

  it('shows a PvP control target before casting Polymorph on it', () => {
    const world = worldWithInterruptedCast();
    const targetEvents: Array<number | null> = [];
    const casts: Array<{ abilityId: string; targetId: number }> = [];
    const secondary = {
      ...world.player,
      id: 101,
      kind: 'player',
      name: 'Secondary enemy',
      hp: 1000,
      maxHp: 1000,
      hostile: true,
      inCombat: true,
      targetId: 2,
      pos: { x: 20, z: 0 },
    };
    world.entities.set(101, secondary);
    world.partyInfo = {
      leader: 1,
      members: [{
        pid: 2,
        name: 'Pressured ally',
        hp: 550,
        mhp: 1000,
        res: 1000,
        mres: 1000,
        x: 2,
        z: 0,
        dead: 0,
        inCombat: 1,
        connected: 1,
        role: 'dps',
      }],
    };
    world.arenaInfo = { match: { state: 'active' } };
    world.known = [{ def: { id: 'polymorph' } }];
    world.targetEntity = (targetId) => {
      targetEvents.push(targetId);
      world.player.targetId = targetId;
    };
    world.castAbility = () => undefined;
    world.castAbilityOn = (abilityId, targetId) => {
      casts.push({ abilityId, targetId });
    };
    const settings = copyDefaultSettings();
    settings.targeting.streamTargetSelection = true;
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'cast', abilityId: 'polymorph', targetId: 101,
    });
    expect(targetEvents).toEqual([101]);
    expect(casts).toEqual([{ abilityId: 'polymorph', targetId: 101 }]);
  });

  it('targets and attacks a false-hostile opponent from an active Thornhollow roster', () => {
    const world = worldWithInterruptedCast();
    const targets: Array<number | null> = [];
    const casts: string[] = [];
    world.entities.delete(100);
    world.player.targetId = null;
    world.player.inCombat = false;
    const opponent = {
      ...world.player,
      id: 200,
      name: 'Thornhollow opponent',
      pos: { x: 12, z: 0 },
      targetId: null,
    };
    world.entities.set(200, opponent);
    world.bgInfo = {
      match: {
        state: 'active',
        myTeam: 0,
        players: [{ pid: 1, team: 0 }, { pid: 200, team: 1 }],
      },
    };
    world.known = [{ def: { id: 'arcane_surge' } }];
    world.targetEntity = (targetId) => {
      targets.push(targetId);
      world.player.targetId = targetId;
    };
    world.castAbility = (abilityId) => { casts.push(abilityId); };
    world.castAbilityOn = () => undefined;
    const controller = new ChronoPilotController(world);

    controller.start();
    expect(controller.tick(1)).toMatchObject({ type: 'target', targetId: 200 });
    expect(controller.status.detectedMode).toBe('pvp');
    expect(targets).toEqual([200]);
    expect(controller.tick(400)).toMatchObject({ type: 'cast', abilityId: 'arcane_surge' });
    expect(casts).toEqual(['arcane_surge']);
  });

});
