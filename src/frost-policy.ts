import type {
  AssistDecision,
  AssistSettings,
  CombatContextMode,
  CombatObservation,
  EnemySnapshot,
  FrostAbilityId,
  ResolvedAssistProfile,
  UnitSnapshot,
} from './types.js';
import { resolveContextMode } from './policy.js';

const HEALTH_POTIONS = ['healing_potion', 'lesser_healing_potion', 'minor_healing_potion'] as const;
const MANA_POTIONS = ['mana_potion', 'lesser_mana_potion', 'minor_mana_potion'] as const;
const BREAKABLE_CONTROL = new Set(['incapacitate', 'polymorph', 'blind', 'hex', 'stasis']);
const FROZEN_CONTROL = new Set(['root', 'stun', 'stasis', 'incapacitate', 'polymorph']);

function distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function hpPct(unit: UnitSnapshot): number {
  return unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
}

function manaPct(unit: UnitSnapshot): number {
  return unit.maxMana > 0 ? Math.max(0, Math.min(1, unit.mana / unit.maxMana)) : 0;
}

function wait(reason: string): AssistDecision {
  return { type: 'wait', priority: 999, reason };
}

function cast(
  abilityId: FrostAbilityId,
  priority: number,
  reason: string,
  targetId?: number,
  selectTargetId?: number,
): AssistDecision {
  return { type: 'cast', abilityId, targetId, selectTargetId, priority, reason };
}

function castAt(
  abilityId: FrostAbilityId,
  priority: number,
  reason: string,
  enemy: EnemySnapshot,
): AssistDecision {
  return {
    type: 'cast-at',
    abilityId,
    x: enemy.x,
    z: enemy.z,
    targetId: enemy.id,
    priority,
    reason,
  };
}

function abilityReady(
  observation: CombatObservation,
  settings: AssistSettings,
  abilityId: FrostAbilityId,
): boolean {
  const chargeBank = observation.player.abilityCharges?.[abilityId];
  return (
    settings.frostAbilities[abilityId] &&
    observation.knownAbilityIds.has(abilityId) &&
    ((chargeBank?.charges ?? 0) > 0 || (observation.player.cooldowns[abilityId] ?? 0) <= 0)
  );
}

function hasAura(unit: Pick<UnitSnapshot, 'auras'>, idOrKind: string): boolean {
  return unit.auras.some((aura) => aura.id === idOrKind || aura.kind === idOrKind);
}

function auraStacks(unit: Pick<UnitSnapshot, 'auras'>, idOrKind: string): number {
  const aura = unit.auras.find((candidate) => candidate.id === idOrKind || candidate.kind === idOrKind);
  return aura ? Math.max(1, aura.stacks ?? 1) : 0;
}

function auraCharges(enemy: EnemySnapshot, idOrKind: string): number {
  const aura = enemy.auras.find((candidate) => candidate.id === idOrKind || candidate.kind === idOrKind);
  return aura ? Math.max(1, aura.charges ?? aura.stacks ?? 1) : 0;
}

function availableItem(
  inventory: Readonly<Record<string, number>>,
  preference: readonly string[],
): string | null {
  return preference.find((itemId) => (inventory[itemId] ?? 0) > 0) ?? null;
}

function assignedTank(observation: CombatObservation): UnitSnapshot | null {
  if (observation.assignedTankId !== null) {
    const assigned = observation.party.find((member) => member.id === observation.assignedTankId);
    if (assigned && !assigned.dead && assigned.connected) return assigned;
  }
  return observation.party.find((member) => member.role === 'tank' && !member.dead && member.connected) ?? null;
}

function protectedControl(enemy: EnemySnapshot): boolean {
  return enemy.auras.some((aura) => BREAKABLE_CONTROL.has(aura.kind));
}

function selectedEnemy(
  observation: CombatObservation,
  settings: AssistSettings,
  contextMode: CombatContextMode,
): EnemySnapshot | null {
  const valid = (enemy: EnemySnapshot | undefined): EnemySnapshot | null =>
    enemy &&
    enemy.hostile &&
    !enemy.dead &&
    !protectedControl(enemy) &&
    distance(observation.player, enemy) <= Math.min(30, settings.targeting.maxTargetRange)
      ? enemy
      : null;
  const current = valid(observation.enemies.find((enemy) => enemy.id === observation.currentTargetId));
  const remembered = valid(observation.enemies.find((enemy) => enemy.id === observation.lastEnemyTargetId));

  if (settings.targeting.enemyMode === 'current-target' && (current || remembered)) {
    return current ?? remembered;
  }

  const tank = assignedTank(observation);
  if (settings.targeting.enemyMode === 'tank-target' && tank) {
    const target = observation.enemies.find((enemy) => enemy.id === tank.targetId) ??
      observation.enemies.find((enemy) => enemy.targetId === tank.id);
    const resolved = valid(target);
    if (resolved) return resolved;
  }
  if (settings.targeting.enemyMode === 'assist-member-target') {
    const member = observation.party.find(
      (candidate) => candidate.id === settings.targeting.assistMemberId,
    ) ?? tank;
    const resolved = valid(observation.enemies.find((enemy) => enemy.id === member?.targetId));
    if (resolved) return resolved;
  }

  const partyIds = new Set(observation.party.map((member) => member.id));
  const engaged = observation.enemies.filter((enemy) => (
    valid(enemy) &&
    enemy.inCombat &&
    (contextMode === 'solo' ||
      !settings.targeting.partyOnly ||
      enemy.targetId === null ||
      partyIds.has(enemy.targetId))
  ));
  const mayAcquire = contextMode === 'solo' && settings.targeting.autoPull;
  const candidates = (mayAcquire ? observation.enemies.filter((enemy) => valid(enemy)) : engaged)
    .sort((a, b) => distance(observation.player, a) - distance(observation.player, b) || a.id - b.id);
  if (settings.targeting.enemyMode === 'lowest-hp') {
    return [...candidates].sort(
      (a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp) || a.id - b.id,
    )[0] ?? current ?? remembered;
  }
  if (settings.targeting.enemyMode === 'closest-engaged') {
    return [...engaged].sort(
      (a, b) => distance(observation.player, a) - distance(observation.player, b) || a.id - b.id,
    )[0] ?? current ?? remembered;
  }
  return candidates[0] ?? current ?? remembered;
}

function frostCluster(
  observation: CombatObservation,
  primary: EnemySnapshot,
): { center: EnemySnapshot; count: number; aoeSafe: boolean } {
  const eligible = observation.enemies.filter((enemy) => (
    enemy.hostile &&
    !enemy.dead &&
    !protectedControl(enemy) &&
    (enemy.inCombat || enemy.id === primary.id) &&
    distance(observation.player, enemy) <= 30
  ));
  const primarySafe = !observation.enemies.some(
    (enemy) => !enemy.dead && protectedControl(enemy) && distance(primary, enemy) <= 7,
  );
  let best = { center: primary, count: 1, aoeSafe: primarySafe };
  for (const center of eligible) {
    const count = eligible.filter((enemy) => distance(center, enemy) <= 7).length;
    const aoeSafe = !observation.enemies.some(
      (enemy) => !enemy.dead && protectedControl(enemy) && distance(center, enemy) <= 7,
    );
    if (!aoeSafe) continue;
    if (count > best.count || (count === best.count && center.id === primary.id)) {
      best = { center, count, aoeSafe };
    }
  }
  return best;
}

function durableTarget(
  observation: CombatObservation,
  enemy: EnemySnapshot,
  contextMode: CombatContextMode,
): boolean {
  return (
    enemy.maxHp >= observation.player.maxHp * 1.5 ||
    ((contextMode === 'party' || contextMode === 'raid') && enemy.maxHp >= observation.player.maxHp)
  );
}

function mageFrozen(enemy: EnemySnapshot, playerId: number): boolean {
  return enemy.auras.some(
    (aura) => aura.sourceId === playerId && FROZEN_CONTROL.has(aura.kind),
  );
}

export function resolveAssistProfile(
  observation: CombatObservation,
  settings: AssistSettings,
): ResolvedAssistProfile {
  if (settings.assistProfile !== 'auto') return settings.assistProfile;
  // Keep the proven Chronomancy PvP engine intact. This Frost module is
  // deliberately PvE-only and never changes duel/arena/battleground behavior.
  if (observation.pvp) return 'chronomancy-healer';
  if (observation.talentSpec === 'frost') return 'frost-pve';
  if (observation.talentSpec === 'arcane') return 'chronomancy-healer';
  const frostKit = observation.knownAbilityIds.has('ice_lance') ||
    observation.knownAbilityIds.has('flurry') ||
    observation.knownAbilityIds.has('frozen_orb');
  return frostKit ? 'frost-pve' : 'chronomancy-healer';
}

export function decideFrost(
  observation: CombatObservation,
  settings: AssistSettings,
): AssistDecision {
  const player = observation.player;
  if (observation.loading) return wait('Waiting for a complete world snapshot.');
  if (player.dead) return wait('Player is dead.');
  if (observation.cutscene) return wait('Raid transition or cutscene is active.');
  if (observation.mounted) return wait('Assist is paused while mounted.');
  if (observation.pvp) return wait('Frost PvE is paused during active PvP.');

  const playerHealth = hpPct(player);
  const currentMana = manaPct(player);
  const gcdReady = player.gcdRemaining <= 0.05;
  const contextMode = resolveContextMode(observation, settings);
  const enemy = selectedEnemy(observation, settings, contextMode);
  const durable = enemy ? durableTarget(observation, enemy, contextMode) : false;
  const conservingMana = currentMana < settings.frost.conserveManaPct;

  if (
    abilityReady(observation, settings, 'ice_block') &&
    playerHealth <= settings.frost.iceBlockHpPct
  ) {
    return cast('ice_block', 1, 'Use Cold Coffin during a critical Frost emergency.');
  }
  if (observation.controlled) return wait('Player is crowd controlled.');
  if (observation.silenced) return wait('Player is silenced.');

  if (observation.potionCooldownRemaining <= 0) {
    const healthPotion = availableItem(observation.inventory, HEALTH_POTIONS);
    if (
      settings.consumables.healthPotion &&
      healthPotion &&
      playerHealth <= settings.consumables.healthPotionHpPct
    ) {
      return { type: 'use-item', itemId: healthPotion, priority: 2, reason: 'Use an emergency health potion.' };
    }
    const manaPotion = availableItem(observation.inventory, MANA_POTIONS);
    if (
      settings.consumables.manaPotion &&
      manaPotion &&
      currentMana <= settings.consumables.manaPotionManaPct
    ) {
      return { type: 'use-item', itemId: manaPotion, priority: 3, reason: 'Use a mana potion before the reserve is exhausted.' };
    }
  }

  if (
    settings.modules.interrupts &&
    !player.castingAbility &&
    gcdReady &&
    abilityReady(observation, settings, 'counterspell')
  ) {
    const caster = observation.enemies
      .filter((candidate) => candidate.castingAbility && !candidate.dead && distance(player, candidate) <= 30)
      .sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id)[0];
    if (caster) return cast('counterspell', 4, `Interrupt ${caster.name}.`, caster.id);
  }

  const frostveilActive = hasAura(player, 'ice_barrier') || hasAura(player, 'personal_barrier');
  if (
    settings.modules.defensives &&
    abilityReady(observation, settings, 'ice_barrier') &&
    !frostveilActive &&
    ((!player.inCombat && settings.safety.buffOutOfCombat) || playerHealth <= settings.frost.barrierHpPct)
  ) {
    return cast('ice_barrier', 5, player.inCombat
      ? 'Restore Frostveil under pressure.'
      : 'Prepare Frostveil before combat.');
  }

  if (player.castingAbility || player.channeling || !gcdReady) {
    return wait(player.castingAbility ? `Casting ${player.castingAbility}.` : 'Waiting for the global cooldown.');
  }

  if (
    !player.inCombat &&
    settings.safety.buffOutOfCombat &&
    observation.aetherInsightNeedsRefresh &&
    abilityReady(observation, settings, 'arcane_intellect')
  ) {
    return cast('arcane_intellect', 6, 'Maintain Aether Insight for the current group.');
  }
  if (
    !player.inCombat &&
    settings.safety.buffOutOfCombat &&
    !hasAura(player, 'frost_armor') &&
    !hasAura(player, 'buff_armor') &&
    abilityReady(observation, settings, 'frost_armor')
  ) {
    return cast('frost_armor', 7, 'Maintain Hoarfrost Mantle before combat.');
  }
  if (
    settings.frost.autoSummonWaterElemental &&
    !player.inCombat &&
    !enemy &&
    !observation.frostPetActive &&
    currentMana > settings.frost.conserveManaPct &&
    abilityReady(observation, settings, 'summon_water_elemental')
  ) {
    return cast('summon_water_elemental', 8, 'Summon the Water Elemental between pulls.');
  }
  if (
    !player.inCombat &&
    !enemy &&
    currentMana <= settings.frost.aetherwellManaPct &&
    abilityReady(observation, settings, 'evocation')
  ) {
    return cast('evocation', 9, 'Channel Aetherwell safely between pulls.');
  }

  if (!enemy) return wait('No valid PvE enemy is selected or engaged in range.');
  const cluster = frostCluster(observation, enemy);
  const fingers = auraStacks(player, 'fingers_of_frost');
  const brainFreeze = hasAura(player, 'brain_freeze');
  const icicles = auraStacks(player, 'icicles');
  const wintersChill = auraCharges(enemy, 'winters_chill');
  const frozen = mageFrozen(enemy, player.id);
  const nearbyEnemies = observation.enemies.filter(
    (candidate) => !candidate.dead && !protectedControl(candidate) && distance(player, candidate) <= 10,
  );
  const frontalSafe = !observation.enemies.some(
    (candidate) => !candidate.dead && protectedControl(candidate) && distance(player, candidate) <= 16,
  );
  const fullFront = !conservingMana &&
    abilityReady(observation, settings, 'glacial_front') &&
    cluster.aoeSafe &&
    frontalSafe &&
    distance(player, enemy) <= 16 &&
    (durable || cluster.count >= settings.frost.glacialFrontEnemyCount);

  if (currentMana <= settings.frost.stopDamageManaPct) {
    return wait('Frost damage is paused at the configured emergency mana floor.');
  }

  if (
    durable &&
    !conservingMana &&
    abilityReady(observation, settings, 'rune_of_power') &&
    !hasAura(player, 'rune_of_power')
  ) {
    return cast('rune_of_power', 10, 'Place Rune of Power for the durable-target burst window.', undefined, enemy.id);
  }
  if (
    abilityReady(observation, settings, 'icy_veins') &&
    player.inCombat &&
    (!settings.frost.icyVeinsDurableOnly || durable)
  ) {
    return cast('icy_veins', 11, 'Open the durable Frost burst window with Icy Veins.', undefined, enemy.id);
  }

  // Protect the short-lived proc and resource banks before starting a ground
  // cast or empowered cone. A capped Icicle bank must be spent before Frozen
  // Orb can generate more Icicles, otherwise those pulses are wasted.
  if (settings.frost.smartProcs && fingers > 0 && abilityReady(observation, settings, 'ice_lance')) {
    return cast('ice_lance', 12, `Spend Fingers of Frost before it overcaps (${fingers} banked).`, enemy.id);
  }
  if (settings.frost.smartProcs && brainFreeze && abilityReady(observation, settings, 'flurry')) {
    return cast('flurry', 13, 'Spend Brain Freeze on instant Winterlash.', enemy.id);
  }
  if (settings.frost.smartProcs && wintersChill > 0 && abilityReady(observation, settings, 'ice_lance')) {
    return cast('ice_lance', 14, `Spend Winter's Chill with Ice Lance (${wintersChill} left).`, enemy.id);
  }
  if (settings.frost.smartProcs && frozen && abilityReady(observation, settings, 'ice_lance')) {
    return cast('ice_lance', 15, 'Shatter the mage-frozen target with Ice Lance.', enemy.id);
  }

  if (icicles >= 5 && abilityReady(observation, settings, 'glacial_spike')) {
    if (
      settings.frost.smartGlacialBurst &&
      abilityReady(observation, settings, 'power_echo') &&
      !hasAura(player, 'power_echo')
    ) {
      return cast('power_echo', 16, 'Prepare Power Echo for the five-Icicle Glacial Spike.', undefined, enemy.id);
    }
    if (
      settings.frost.smartGlacialBurst &&
      durable &&
      abilityReady(observation, settings, 'presence_of_mind') &&
      !hasAura(player, 'next_cast_instant') &&
      !hasAura(player, 'presence_of_mind')
    ) {
      return cast('presence_of_mind', 17, 'Make the five-Icicle Glacial Spike instant.', undefined, enemy.id);
    }
    return cast('glacial_spike', 18, 'Spend five Icicles before another generator can overcap them.', enemy.id);
  }

  if (
    abilityReady(observation, settings, 'frozen_orb') &&
    (durable || (!conservingMana && cluster.count >= settings.frost.frozenOrbEnemyCount)) &&
    cluster.aoeSafe
  ) {
    return cast('frozen_orb', 20, durable
      ? 'Release Frozen Orb into the durable target.'
      : `Release Frozen Orb into ${cluster.count} clustered enemies.`, undefined, enemy.id);
  }
  if (
    !conservingMana &&
    cluster.aoeSafe &&
    cluster.count >= settings.frost.blizzardEnemyCount &&
    abilityReady(observation, settings, 'blizzard')
  ) {
    return castAt('blizzard', 21, `Place Blizzard under ${cluster.count} clustered enemies.`, cluster.center);
  }

  if (
    fullFront &&
    settings.frost.useIcebindPve &&
    nearbyEnemies.length >= 2 &&
    !frozen &&
    abilityReady(observation, settings, 'frost_nova')
  ) {
    return cast('frost_nova', 22, 'Freeze the nearby pack before the full Glacial Front.', undefined, enemy.id);
  }
  if (fullFront) {
    return cast('glacial_front', 23, 'Hold Glacial Front through its automatic stage-IV release.', undefined, enemy.id);
  }

  if (
    nearbyEnemies.length >= settings.frost.blizzardEnemyCount &&
    frontalSafe &&
    abilityReady(observation, settings, 'cone_of_cold')
  ) {
    return cast('cone_of_cold', 24, `Hit ${nearbyEnemies.length} nearby enemies with Frostsweep.`, undefined, enemy.id);
  }
  if (settings.frost.smartProcs && abilityReady(observation, settings, 'flurry')) {
    return cast('flurry', 25, 'Plant Winter\'s Chill with Winterlash.', enemy.id);
  }
  if (abilityReady(observation, settings, 'frostbolt')) {
    return cast('frostbolt', 26, conservingMana
      ? 'Use Rimelance as the efficient proc and Icicle generator.'
      : 'Build Frost procs and Icicles with Rimelance.', enemy.id);
  }
  if (abilityReady(observation, settings, 'ice_lance')) {
    return cast('ice_lance', 27, 'Use Ice Lance while the main Frost builder is unavailable.', enemy.id);
  }
  return wait('No enabled Frost PvE ability is ready.');
}
