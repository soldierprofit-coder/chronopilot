import { describe, expect, it } from 'vitest';
import { ChronoPilotController } from '../src/controller.js';
import { copyDefaultSettings } from '../src/defaults.js';
import type { WocWorldLike } from '../src/woc-adapter.js';

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
  it('auto-detects Frost talents and shows the enemy before a targetless Frost cast', () => {
    const world = worldWithInterruptedCast();
    const targets: Array<number | null> = [];
    const casts: string[] = [];
    world.talentSpec = 'frost';
    world.player.targetId = null;
    world.known = [{ def: { id: 'frozen_orb' } }];
    const target = world.entities.get(100)!;
    target.maxHp = 3_000;
    target.hp = 3_000;
    world.targetEntity = (targetId) => {
      targets.push(targetId);
      world.player.targetId = targetId;
    };
    world.castAbility = (abilityId) => { casts.push(abilityId); };
    const settings = copyDefaultSettings();
    settings.mode = 'solo';
    settings.targeting.enemyMode = 'closest-in-range';
    settings.targeting.partyOnly = false;
    settings.targeting.streamTargetSelection = true;
    const controller = new ChronoPilotController(world, { settings });

    controller.start();
    expect(controller.tick(1)).toMatchObject({
      type: 'cast', abilityId: 'frozen_orb', selectTargetId: 100,
    });
    expect(controller.status.detectedProfile).toBe('frost-pve');
    expect(targets).toEqual([100]);
    expect(casts).toEqual(['frozen_orb']);
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
