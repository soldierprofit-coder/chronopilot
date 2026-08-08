import { describe, expect, it } from 'vitest';
import { copyDefaultSettings } from '../src/defaults.js';
import { activePvpState, observeWocWorld, type WocWorldLike } from '../src/woc-adapter.js';

function arenaWorld(): WocWorldLike {
  const self = {
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
    targetId: 2,
    castingAbility: null,
    channeling: false,
    gcdRemaining: 0,
    cooldowns: new Map<string, number>(),
    auras: [],
  };
  const opponent = {
    ...self,
    id: 2,
    name: 'Arena opponent',
    pos: { x: 8, z: 0 },
    targetId: 1,
  };
  return {
    playerId: 1,
    player: self,
    entities: new Map([[1, self], [2, opponent]]),
    known: [],
    inventory: [],
    partyInfo: null,
    duelInfo: null,
    arenaInfo: { match: { state: 'active', oppPid: 2, enemies: [{ pid: 2 }] } },
    castAbility: () => undefined,
    castAbilityAt: () => undefined,
    castAbilityOn: () => undefined,
    targetEntity: () => undefined,
    useItem: () => undefined,
  };
}

describe('World of ClaudeCraft state adapter', () => {
  it('mirrors the active talent specialization and living owned Frost pet', () => {
    const world = arenaWorld();
    world.arenaInfo = null;
    world.talentSpec = 'frost';
    const pet = {
      ...world.player,
      id: 3,
      kind: 'pet',
      name: 'Water Elemental',
      ownerId: 1,
      hostile: false,
      targetId: null,
    };
    world.entities.set(3, pet);
    const observation = observeWocWorld(
      world,
      copyDefaultSettings(),
      {
        individualEchoTargetId: null,
        individualEchoExpiresAt: 0,
        aetherInsightRosterKey: null,
        lastEnemyTargetId: null,
      },
      0,
    );
    expect(observation.talentSpec).toBe('frost');
    expect(observation.frostPetActive).toBe(true);
  });

  it('does not treat ordinary arena and Vale Cup status objects as active PvP', () => {
    expect(activePvpState({
      duelInfo: null,
      arenaInfo: { match: null },
      cupInfo: { match: null },
    })).toBe(false);
  });

  it('detects actual duel, arena, Vale Cup, and battleground matches', () => {
    expect(activePvpState({ duelInfo: { state: 'active' } })).toBe(true);
    expect(activePvpState({ arenaInfo: { match: { state: 'active' } } })).toBe(true);
    expect(activePvpState({ cupInfo: { match: { phase: 'active' } } })).toBe(true);
    expect(activePvpState({ bgInfo: { match: { state: 'active', myTeam: 0 } } })).toBe(true);
    expect(activePvpState({ bgInfo: { match: { state: 'countdown', myTeam: 0 } } })).toBe(false);
  });

  it('promotes false-hostile arena players to valid assist enemies only during an active match', () => {
    const world = arenaWorld();
    const observation = observeWocWorld(
      world,
      copyDefaultSettings(),
      {
        individualEchoTargetId: null,
        individualEchoExpiresAt: 0,
        aetherInsightRosterKey: null,
        lastEnemyTargetId: null,
      },
      0,
    );
    expect(observation.enemies).toMatchObject([{ id: 2, hostile: true }]);

    world.arenaInfo = null;
    const outsideArena = observeWocWorld(
      world,
      copyDefaultSettings(),
      {
        individualEchoTargetId: null,
        individualEchoExpiresAt: 0,
        aetherInsightRosterKey: null,
        lastEnemyTargetId: null,
      },
      0,
    );
    expect(outsideArena.enemies).toEqual([]);
  });

  it('promotes only the opposing Thornhollow team and its pets to valid enemies', () => {
    const world = arenaWorld();
    world.arenaInfo = null;
    world.player.targetId = null;
    const teammate = { ...world.player, id: 3, name: 'Battleground teammate', targetId: null };
    const opponent = { ...world.player, id: 4, name: 'Battleground opponent', targetId: 1 };
    const enemyPet = {
      ...world.player,
      id: 5,
      kind: 'pet',
      name: 'Opponent pet',
      ownerId: 4,
      targetId: 1,
    };
    world.entities.set(3, teammate);
    world.entities.set(4, opponent);
    world.entities.set(5, enemyPet);
    world.bgInfo = {
      match: {
        state: 'active',
        myTeam: 0,
        players: [
          { pid: 1, team: 0 },
          { pid: 3, team: 0 },
          { pid: 4, team: 1 },
        ],
      },
    };
    const observation = observeWocWorld(
      world,
      copyDefaultSettings(),
      {
        individualEchoTargetId: null,
        individualEchoExpiresAt: 0,
        aetherInsightRosterKey: null,
        lastEnemyTargetId: null,
      },
      0,
    );
    expect(observation.pvp).toBe(true);
    expect(observation.enemies.map((enemy) => enemy.id)).toEqual([4, 5]);
  });
});
