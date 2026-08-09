import type {
  AssistSettings,
  AuraSnapshot,
  CombatObservation,
  EnemySnapshot,
  RuntimeMemory,
  UnitSnapshot,
} from './types.js';

interface WocAuraLike {
  id?: unknown;
  kind?: unknown;
  remaining?: unknown;
  stacks?: unknown;
  charges?: unknown;
  sourceId?: unknown;
  echoGroup?: unknown;
}

interface WocEntityLike {
  id: number;
  kind: string;
  name: string;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  pos: { x: number; z: number };
  dead: boolean;
  hostile: boolean;
  inCombat: boolean;
  targetId: number | null;
  ownerId?: number | null;
  aggroTargetId?: number | null;
  castingAbility: string | null;
  channeling: boolean;
  gcdRemaining: number;
  autoAttack?: boolean;
  potionCdRemaining?: number;
  cooldowns: Map<string, number>;
  abilityCharges?: Record<string, {
    charges: number;
    maxCharges: number;
    recharge: number;
  }>;
  auras: WocAuraLike[];
}

interface WocDuelInfoLike {
  state?: string;
  otherPid?: number;
}

interface WocArenaMatchLike {
  state?: string;
  oppPid?: number;
  enemies?: Array<{ pid?: number }>;
}

interface WocArenaInfoLike {
  match?: WocArenaMatchLike | null;
}

interface WocBattlegroundPlayerLike {
  pid?: number;
  team?: number;
  dead?: boolean;
}

interface WocBattlegroundMatchLike {
  state?: string;
  myTeam?: number;
  players?: WocBattlegroundPlayerLike[];
}

interface WocBattlegroundInfoLike {
  match?: WocBattlegroundMatchLike | null;
}

interface WocPartyMemberLike {
  pid: number;
  name: string;
  cls?: string;
  hp: number;
  mhp: number;
  res: number;
  mres: number;
  x: number;
  z: number;
  dead: number;
  inCombat: number;
  connected?: number;
  role?: 'tank' | 'healer' | 'dps';
  absorb?: number;
  rewind?: number;
  hasAggro?: number;
  incomingHeal?: number;
  auras?: WocAuraLike[];
}

export interface WocRiftDeathZoneLike {
  x: number;
  z: number;
  radius: number;
  remaining: number;
}

export interface WocMovementLike {
  setControllerMoveInput(input: unknown, facing?: unknown): void;
  setControllerFacing?(facing: unknown): void;
  clearControllerMoveInput(): void;
}

export interface WocWorldLike {
  playerId: number;
  player: WocEntityLike;
  entities: Map<number, WocEntityLike>;
  known: Array<{ def: { id: string } }>;
  inventory: Array<{ itemId: string; count: number }>;
  partyInfo: { leader: number; raid?: boolean; members: WocPartyMemberLike[] } | null;
  talentSpec?: string | null;
  duelInfo?: WocDuelInfoLike | null;
  arenaInfo?: WocArenaInfoLike | null;
  cupInfo?: { match?: unknown } | null;
  bgInfo?: WocBattlegroundInfoLike | null;
  cfg?: { playerClass?: string };
  riftBossDeathZones?(): WocRiftDeathZoneLike[];
  castAbility(abilityId: string): void;
  castAbilityAt(abilityId: string, aim: { x: number; z: number }): void;
  castAbilityOn(abilityId: string, targetId: number): void;
  targetEntity(id: number | null): void;
  useItem(itemId: string): void;
  startAutoAttack?(): void;
}

const CROWD_CONTROL = new Set(['stun', 'stasis', 'incapacitate', 'polymorph', 'blind', 'hex']);
const MIN_OBSERVATION_RADIUS = 40;

function distanceSquared(
  a: { x: number; z: number },
  b: { x: number; z: number },
): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function observationRadius(settings: Pick<AssistSettings, 'targeting'>): number {
  return Math.max(MIN_OBSERVATION_RADIUS, settings.targeting.maxTargetRange + 10);
}

function auras(source: readonly WocAuraLike[] | undefined): AuraSnapshot[] {
  return (source ?? []).flatMap((aura) => {
    if (typeof aura.id !== 'string' || typeof aura.kind !== 'string') return [];
    return [{
      id: aura.id,
      kind: aura.kind,
      remaining: typeof aura.remaining === 'number' ? aura.remaining : 0,
      ...(typeof aura.stacks === 'number' ? { stacks: aura.stacks } : {}),
      ...(typeof aura.charges === 'number' ? { charges: aura.charges } : {}),
      ...(typeof aura.sourceId === 'number' ? { sourceId: aura.sourceId } : {}),
      ...(typeof aura.echoGroup === 'boolean' ? { echoGroup: aura.echoGroup } : {}),
    }];
  });
}

function selfUnit(world: WocWorldLike): UnitSnapshot {
  const player = world.player;
  const row = world.partyInfo?.members.find((member) => member.pid === world.playerId);
  return {
    id: player.id,
    name: player.name,
    playerClass: row?.cls ?? world.cfg?.playerClass,
    hp: player.hp,
    maxHp: player.maxHp,
    mana: player.resource,
    maxMana: player.maxResource,
    x: player.pos.x,
    z: player.pos.z,
    dead: player.dead,
    connected: true,
    inCombat: player.inCombat,
    role: row?.role,
    absorb: row?.absorb ?? 0,
    incomingHeal: row?.incomingHeal ?? 0,
    rewind: row?.rewind ?? 0,
    hasAggro: !!row?.hasAggro,
    targetId: player.targetId,
    auras: auras(player.auras),
  };
}

function party(world: WocWorldLike, self: UnitSnapshot): UnitSnapshot[] {
  const rows = world.partyInfo?.members ?? [];
  const members = rows.filter((member) => member.pid !== self.id).map((member): UnitSnapshot => ({
    id: member.pid,
    name: member.name,
    playerClass: member.cls,
    hp: member.hp,
    maxHp: member.mhp,
    mana: member.res,
    maxMana: member.mres,
    x: member.x,
    z: member.z,
    dead: !!member.dead,
    connected: member.connected !== 0,
    inCombat: !!member.inCombat,
    role: member.role,
    absorb: member.absorb ?? 0,
    incomingHeal: member.incomingHeal ?? 0,
    rewind: member.rewind ?? 0,
    hasAggro: !!member.hasAggro,
    targetId: world.entities.get(member.pid)?.targetId ?? null,
    auras: auras(member.auras),
  }));
  members.unshift(self);
  return members;
}

export function activePvpState(
  world: Pick<WocWorldLike, 'duelInfo' | 'arenaInfo' | 'cupInfo' | 'bgInfo'>,
): boolean {
  const cupMatch = world.cupInfo?.match;
  const activeCup = typeof cupMatch === 'object' && cupMatch !== null && (
    (cupMatch as { state?: unknown }).state === 'active' ||
    (cupMatch as { phase?: unknown }).phase === 'active'
  );
  return (
    world.duelInfo?.state === 'active' ||
    world.arenaInfo?.match?.state === 'active' ||
    activeCup ||
    world.bgInfo?.match?.state === 'active'
  );
}

/**
 * Players remain `hostile: false` on the game wire even when the server regards
 * them as legal PvP opponents. Mirror the client's own PvP roster rules so
 * the assist can see those player entities without treating ordinary players as
 * enemies in PvE.
 */
function activePvpOpponentIds(
  world: Pick<WocWorldLike, 'playerId' | 'duelInfo' | 'arenaInfo' | 'bgInfo'>,
): Set<number> {
  const ids = new Set<number>();
  const selfId = world.playerId;
  if (world.duelInfo?.state === 'active' && typeof world.duelInfo.otherPid === 'number') {
    if (world.duelInfo.otherPid !== selfId) ids.add(world.duelInfo.otherPid);
  }
  const match = world.arenaInfo?.match;
  if (match?.state === 'active') {
    if (typeof match.oppPid === 'number' && match.oppPid !== selfId) ids.add(match.oppPid);
    for (const enemy of match.enemies ?? []) {
      if (typeof enemy.pid === 'number' && enemy.pid !== selfId) ids.add(enemy.pid);
    }
  }
  const battleground = world.bgInfo?.match;
  if (battleground?.state === 'active') {
    const myTeam = typeof battleground.myTeam === 'number'
      ? battleground.myTeam
      : battleground.players?.find((player) => player.pid === selfId)?.team;
    if (typeof myTeam === 'number') {
      for (const player of battleground.players ?? []) {
        if (
          typeof player.pid === 'number' &&
          player.pid !== selfId &&
          typeof player.team === 'number' &&
          player.team !== myTeam
        ) {
          ids.add(player.pid);
        }
      }
    }
  }
  return ids;
}

export function observeWocWorld(
  world: WocWorldLike,
  settings: AssistSettings,
  memory: RuntimeMemory,
  now: number,
): CombatObservation {
  const self = selfUnit(world);
  const group = party(world, self);
  const assignedTankId =
    settings.targeting.assignedTankId ??
    group.find((member) => member.role === 'tank' && !member.dead)?.id ??
    null;
  const pvpOpponentIds = activePvpOpponentIds(world);
  const maxDistanceSquared = observationRadius(settings) ** 2;
  const enemies: EnemySnapshot[] = [];
  for (const entity of world.entities.values()) {
    const legalEnemy =
      entity.hostile ||
      pvpOpponentIds.has(entity.id) ||
      pvpOpponentIds.has(entity.ownerId ?? -1);
    if (
      entity.kind === 'object' ||
      !legalEnemy ||
      distanceSquared(self, entity.pos) > maxDistanceSquared
    ) {
      continue;
    }
    enemies.push({
      id: entity.id,
      name: entity.name,
      hp: entity.hp,
      maxHp: entity.maxHp,
      x: entity.pos.x,
      z: entity.pos.z,
      dead: entity.dead,
      hostile: legalEnemy,
      inCombat: entity.inCombat,
      targetId: entity.aggroTargetId ?? entity.targetId,
      castingAbility: entity.castingAbility,
      crowdControlled: entity.auras.some((aura) =>
        typeof aura.kind === 'string' ? CROWD_CONTROL.has(aura.kind) : false,
      ),
      auras: auras(entity.auras),
    });
  }
  const selectedEnemy = enemies.find(
    (enemy) => enemy.id === world.player.targetId && !enemy.dead && enemy.hostile,
  );
  if (selectedEnemy) memory.lastEnemyTargetId = selectedEnemy.id;
  const playerAuras = auras(world.player.auras);
  const partyRosterKey = group.map((member) => member.id).sort((a, b) => a - b).join(',');
  const insightAura = playerAuras.find(
    (aura) => aura.id === 'arcane_intellect' || aura.kind === 'buff_int_pct',
  );
  if (insightAura && memory.aetherInsightRosterKey === null) {
    memory.aetherInsightRosterKey = partyRosterKey;
  }
  const visibleIndividualEcho = group.flatMap((member) =>
    member.auras
      .filter(
        (aura) =>
          aura.kind === 'temporal_echo' &&
          aura.echoGroup !== true &&
          (aura.sourceId === self.id ||
            // Some party snapshots omit sourceId. Only accept that aura when
            // it confirms the target already remembered from our own cast;
            // this avoids stealing another Chronomancer's Echo identity.
            (aura.sourceId === undefined && member.id === memory.individualEchoTargetId)),
      )
      .map((aura) => ({ targetId: member.id, remaining: aura.remaining })),
  )[0];
  if (visibleIndividualEcho) {
    memory.individualEchoTargetId = visibleIndividualEcho.targetId;
    memory.individualEchoExpiresAt = now + Math.max(0, visibleIndividualEcho.remaining) * 1_000;
  }
  const rememberedIndividualEcho =
    memory.individualEchoTargetId !== null && memory.individualEchoExpiresAt > now
      ? {
          targetId: memory.individualEchoTargetId,
          remaining: (memory.individualEchoExpiresAt - now) / 1000,
        }
      : null;
  return {
    player: {
      ...self,
      auras: playerAuras,
      gcdRemaining: world.player.gcdRemaining,
      castingAbility: world.player.castingAbility,
      channeling: world.player.channeling,
      cooldowns: Object.fromEntries(world.player.cooldowns),
      abilityCharges: Object.fromEntries(
        Object.entries(world.player.abilityCharges ?? {}).map(([abilityId, bank]) => [
          abilityId,
          {
            charges: Math.max(0, Number(bank.charges) || 0),
            maxCharges: Number(bank.maxCharges) > 0 ? Number(bank.maxCharges) : 1,
            recharge: Math.max(0, Number(bank.recharge) || 0),
          },
        ]),
      ),
      autoAttacking: world.player.autoAttack === true,
    },
    party: group,
    enemies,
    knownAbilityIds: new Set(world.known.map((ability) => ability.def.id)),
    talentSpec: world.talentSpec ?? null,
    assignedTankId,
    partyLeaderId: world.partyInfo?.leader ?? null,
    currentTargetId: world.player.targetId,
    lastEnemyTargetId: memory.lastEnemyTargetId,
    individualEcho: visibleIndividualEcho ?? rememberedIndividualEcho,
    inventory: Object.fromEntries(world.inventory.map((slot) => [slot.itemId, slot.count])),
    potionCooldownRemaining: world.player.potionCdRemaining ?? 0,
    partyRosterKey,
    aetherInsightNeedsRefresh:
      !insightAura ||
      insightAura.remaining < 60 ||
      memory.aetherInsightRosterKey !== partyRosterKey,
    raid: world.partyInfo?.raid ?? false,
    // Nythraxis' phase transition is a real 21.5-second server stun, not merely
    // dialogue. Pause before selecting or submitting any cast so the controller
    // cannot flicker targets or queue retries during the scene.
    cutscene: playerAuras.some((aura) => aura.id === 'nythraxis_transition_stun'),
    loading: world.playerId < 0 || world.player.id < 0,
    mounted: playerAuras.some((aura) => aura.kind === 'form_travel'),
    controlled: playerAuras.some((aura) => CROWD_CONTROL.has(aura.kind)),
    rooted: playerAuras.some((aura) => aura.kind === 'root'),
    silenced: playerAuras.some((aura) => aura.kind === 'silence' || aura.kind === 'lockout'),
    pvp: activePvpState(world),
  };
}
