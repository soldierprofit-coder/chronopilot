import type {
  AbilityId,
  AssistDecision,
  AssistSettings,
  CombatContextMode,
  CombatObservation,
  EnemySnapshot,
  UnitSnapshot,
} from './types.js';

const FRIENDLY_RANGE = 30;
const CASCADE_RADIUS = 15;
const MASS_BARRIER_RADIUS = 30;
const FRONTLINE_CLASSES = new Set(['warrior', 'paladin', 'druid', 'rogue', 'shaman']);
const HEALTH_POTIONS = ['healing_potion', 'lesser_healing_potion', 'minor_healing_potion'] as const;
const MANA_POTIONS = ['mana_potion', 'lesser_mana_potion', 'minor_mana_potion'] as const;

function distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function hpPct(unit: UnitSnapshot): number {
  if (unit.maxHp <= 0) return 0;
  return Math.max(0, Math.min(1, (unit.hp + unit.incomingHeal) / unit.maxHp));
}

function effectiveHpPct(unit: UnitSnapshot): number {
  if (unit.maxHp <= 0) return 0;
  return Math.max(0, Math.min(1, (unit.hp + unit.incomingHeal + unit.absorb) / unit.maxHp));
}

function manaPct(unit: UnitSnapshot): number {
  return unit.maxMana > 0 ? unit.mana / unit.maxMana : 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampSurgeCharges(value: number): number {
  return Math.max(1, Math.min(4, Math.round(value)));
}

function desiredSurgeCharges(
  group: readonly UnitSnapshot[],
  contextMode: CombatContextMode,
  profile: AssistSettings['profiles'][CombatContextMode],
  settings: AssistSettings,
  currentManaPct: number,
): { charges: number; smart: boolean; reason: string } {
  const maximum = clampSurgeCharges(
    contextMode === 'pvp'
      ? settings.pvp.maxSurgeCharges
      : settings.thresholds.maxSurgeCharges,
  );
  const minimum = Math.min(
    maximum,
    clampSurgeCharges(
      contextMode === 'pvp'
        ? settings.pvp.minSurgeCharges
        : settings.thresholds.lowManaMaxSurgeCharges,
    ),
  );
  const conservingMana = currentManaPct < profile.conserveManaPct;

  if (!settings.thresholds.smartSurgeCharges) {
    const charges = conservingMana ? minimum : maximum;
    return {
      charges,
      smart: false,
      reason: conservingMana ? 'the configured low-mana target' : 'the configured fixed target',
    };
  }

  const lowestEffectiveHpPct = group.length > 0
    ? Math.min(...group.map(effectiveHpPct))
    : 1;
  const manaHeadroom = contextMode === 'pvp'
    ? 1
    : profile.conserveManaPct >= 1
      ? 0
      : clamp01((currentManaPct - profile.conserveManaPct) / (1 - profile.conserveManaPct));
  const healthHeadroom = profile.mendHpPct >= 1
    ? 0
    : clamp01((lowestEffectiveHpPct - profile.mendHpPct) / (1 - profile.mendHpPct));
  const safetyHeadroom = Math.min(manaHeadroom, healthHeadroom);
  const charges = minimum + Math.round(safetyHeadroom * (maximum - minimum));
  return {
    charges,
    smart: true,
    reason: `${Math.round(currentManaPct * 100)}% mana and ${Math.round(lowestEffectiveHpPct * 100)}% lowest effective HP`,
  };
}

function wait(reason: string): AssistDecision {
  return { type: 'wait', priority: 999, reason };
}

function abilityReady(
  observation: CombatObservation,
  settings: AssistSettings,
  abilityId: AbilityId,
): boolean {
  const chargeBank = observation.player.abilityCharges?.[abilityId];
  return (
    settings.abilities[abilityId] &&
    observation.knownAbilityIds.has(abilityId) &&
    ((chargeBank?.charges ?? 0) > 0 || (observation.player.cooldowns[abilityId] ?? 0) <= 0)
  );
}

function canUseGcd(observation: CombatObservation): boolean {
  return observation.player.gcdRemaining <= 0.05;
}

function hasAura(unit: UnitSnapshot, idOrKind: string): boolean {
  return unit.auras.some((aura) => aura.id === idOrKind || aura.kind === idOrKind);
}

function ownEchoTargets(observation: CombatObservation): UnitSnapshot[] {
  return observation.party.filter((member) => (
    observation.individualEcho?.targetId === member.id ||
    member.auras.some((aura) =>
      aura.kind === 'temporal_echo' &&
      (aura.sourceId === undefined || aura.sourceId === observation.player.id),
    )
  ));
}

function smartGroupDamageHealingWindow(
  observation: CombatObservation,
  settings: AssistSettings,
  contextMode: CombatContextMode,
  profile: AssistSettings['profiles'][CombatContextMode],
  lowest: UnitSnapshot | null,
): { active: boolean; echoTargets: number; injuredEchoTargets: number } {
  const marked = ownEchoTargets(observation);
  const injured = marked.filter((member) => hpPct(member) < profile.cascadeHpPct);
  const safeFloor = Math.min(profile.mendHpPct, profile.emergencyHpPct + 0.1);
  const safeToChannel = !lowest || hpPct(lowest) >= safeFloor;
  const needed = contextMode === 'raid'
    ? Math.max(2, Math.min(3, profile.cascadeCount))
    : Math.max(2, Math.min(2, profile.cascadeCount));
  return {
    active:
      settings.thresholds.smartPerfectMoment &&
      contextMode !== 'solo' &&
      safeToChannel &&
      marked.length >= needed &&
      injured.length >= needed,
    echoTargets: marked.length,
    injuredEchoTargets: injured.length,
  };
}

function cast(
  abilityId: AbilityId,
  priority: number,
  reason: string,
  targetId?: number,
): AssistDecision {
  return { type: 'cast', abilityId, targetId, priority, reason };
}

function castAt(
  abilityId: AbilityId,
  priority: number,
  reason: string,
  x: number,
  z: number,
  targetId?: number,
): AssistDecision {
  return { type: 'cast-at', abilityId, x, z, targetId, priority, reason };
}

function livingParty(observation: CombatObservation): UnitSnapshot[] {
  return observation.party.filter((member) => !member.dead && member.connected);
}

function lowestUnit(units: readonly UnitSnapshot[]): UnitSnapshot | null {
  let best: UnitSnapshot | null = null;
  for (const unit of units) {
    if (!best || hpPct(unit) < hpPct(best) || (hpPct(unit) === hpPct(best) && unit.id < best.id)) {
      best = unit;
    }
  }
  return best;
}

function cascadeCluster(
  units: readonly UnitSnapshot[],
  threshold: number,
): { center: UnitSnapshot; count: number } | null {
  const injured = units.filter((unit) => hpPct(unit) < threshold);
  let best: { center: UnitSnapshot; count: number } | null = null;
  for (const center of injured) {
    const count = injured.filter((unit) => distance(center, unit) <= CASCADE_RADIUS).length;
    if (
      !best ||
      count > best.count ||
      (count === best.count && hpPct(center) < hpPct(best.center)) ||
      (count === best.count && hpPct(center) === hpPct(best.center) && center.id < best.center.id)
    ) {
      best = { center, count };
    }
  }
  return best;
}

function assignedTank(observation: CombatObservation): UnitSnapshot | null {
  if (observation.assignedTankId !== null) {
    const assigned = observation.party.find((member) => member.id === observation.assignedTankId);
    if (assigned && !assigned.dead && assigned.connected) return assigned;
  }
  const living = observation.party.filter((member) => !member.dead && member.connected);
  const roleTank = living.find((member) => member.role === 'tank');
  if (roleTank) return roleTank;

  const underPressure = living
    .map((member) => ({
      member,
      attackers: observation.enemies.filter(
        (enemy) => enemy.inCombat && !enemy.dead && enemy.targetId === member.id,
      ).length,
    }))
    .sort(
      (a, b) =>
        b.attackers - a.attackers ||
        Number(b.member.hasAggro) - Number(a.member.hasAggro) ||
        a.member.id - b.member.id,
    )[0];
  if (underPressure && (underPressure.attackers > 0 || underPressure.member.hasAggro)) {
    return underPressure.member;
  }

  const frontliner = living.find(
    (member) => member.id !== observation.player.id && FRONTLINE_CLASSES.has(member.playerClass ?? ''),
  );
  if (frontliner) return frontliner;
  return (
    living.find((member) => member.id === observation.partyLeaderId) ??
    living.find((member) => member.id === observation.player.id) ??
    living[0] ??
    null
  );
}

function adaptiveEchoTarget(
  observation: CombatObservation,
  group: readonly UnitSnapshot[],
  tank: UnitSnapshot | null,
  profile: AssistSettings['profiles'][CombatContextMode],
): UnitSnapshot | null {
  if (!tank) return null;
  const tankSafe = effectiveHpPct(tank) >= 0.85;
  if (!tankSafe) return tank;

  const isPressured = (member: UnitSnapshot): boolean =>
    member.hasAggro || observation.enemies.some(
      (enemy) => enemy.inCombat && !enemy.dead && enemy.targetId === member.id,
    );
  const isEndangered = (member: UnitSnapshot): boolean => {
    const health = effectiveHpPct(member);
    return health < profile.emergencyHpPct + 0.1 ||
      (health < profile.mendHpPct && isPressured(member));
  };
  const endangered = group
    .filter(
      (member) =>
        member.id !== tank.id &&
        distance(observation.player, member) <= FRIENDLY_RANGE &&
        isEndangered(member),
    )
    .sort((a, b) => effectiveHpPct(a) - effectiveHpPct(b) || a.id - b.id);
  if (endangered.length === 0) return tank;

  const current = endangered.find(
    (member) => member.id === observation.individualEcho?.targetId,
  );
  const critical = endangered.find(
    (member) => effectiveHpPct(member) < profile.emergencyHpPct,
  );
  // Keep a still-endangered rescue target stable, unless somebody else has
  // crossed the true emergency threshold. This prevents HP-order bouncing.
  if (current && (!critical || effectiveHpPct(current) < profile.emergencyHpPct)) return current;
  return critical ?? endangered[0] ?? tank;
}

export function resolveContextMode(
  observation: CombatObservation,
  settings: AssistSettings,
): CombatContextMode {
  if (settings.mode !== 'auto') return settings.mode;
  if (observation.pvp) return 'pvp';
  if (observation.raid || observation.party.length > 5) return 'raid';
  if (observation.party.length > 1) return 'party';
  return 'solo';
}

function availableItem(
  inventory: Readonly<Record<string, number>>,
  preference: readonly string[],
): string | null {
  return preference.find((itemId) => (inventory[itemId] ?? 0) > 0) ?? null;
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
    !enemy.crowdControlled &&
    distance(observation.player, enemy) <= settings.targeting.maxTargetRange
      ? enemy
      : null;
  const current = valid(
    observation.enemies.find((enemy) => enemy.id === observation.currentTargetId),
  );
  const remembered = valid(
    observation.enemies.find((enemy) => enemy.id === observation.lastEnemyTargetId),
  );
  // In an active duel, arena, Cup, or battleground, the player's visible
  // opponent selection wins before group-assist rules. This makes manual focus
  // changes immediate while still allowing automatic acquisition when needed.
  if (contextMode === 'pvp' && current) return current;
  if (settings.targeting.enemyMode === 'current-target' && (current || remembered)) {
    return current ?? remembered;
  }

  const tank = assignedTank(observation);
  if (settings.targeting.enemyMode === 'tank-target' && tank) {
    const tankTarget =
      observation.enemies.find((enemy) => enemy.id === tank.targetId) ??
      observation.enemies.find((enemy) => enemy.targetId === tank.id);
    if (tankTarget) return valid(tankTarget);
  }

  if (settings.targeting.enemyMode === 'assist-member-target') {
    const member =
      observation.party.find((candidate) => candidate.id === settings.targeting.assistMemberId) ??
      tank;
    const assisted = observation.enemies.find((enemy) => enemy.id === member?.targetId);
    if (assisted) return valid(assisted);
  }

  const partyIds = new Set(observation.party.map((member) => member.id));
  const engaged = observation.enemies
    .filter(
      (enemy) =>
        enemy.inCombat &&
        valid(enemy) &&
        (contextMode === 'solo' ||
          !settings.targeting.partyOnly ||
          enemy.targetId === null ||
          partyIds.has(enemy.targetId)),
    )
    .sort(
      (a, b) =>
        distance(observation.player, a) - distance(observation.player, b) || a.id - b.id,
    );
  if (settings.targeting.enemyMode === 'closest-engaged') return engaged[0] ?? current ?? remembered;

  // An active PvP roster already defines the legal fight, so visible confirmed
  // opponents may be acquired before they personally enter combat. Ordinary
  // PvE enemies still require Solo auto-pull or an existing engagement.
  const mayAcquire = contextMode === 'pvp' || (contextMode === 'solo' && settings.targeting.autoPull);
  const attackable = (mayAcquire ? observation.enemies.filter((enemy) => valid(enemy)) : engaged).sort(
    (a, b) =>
      distance(observation.player, a) - distance(observation.player, b) || a.id - b.id,
  );
  if (settings.targeting.enemyMode === 'lowest-hp') {
    return (
      [...attackable].sort(
        (a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp) || a.id - b.id,
      )[0] ?? current ?? remembered
    );
  }
  if (settings.targeting.enemyMode === 'closest-in-range') return attackable[0] ?? current ?? remembered;
  return engaged[0] ?? attackable[0] ?? current ?? remembered;
}

export function decideChronomancy(
  observation: CombatObservation,
  settings: AssistSettings,
): AssistDecision {
  const player = observation.player;
  if (observation.loading) return wait('Waiting for a complete world snapshot.');
  if (player.dead) return wait('Player is dead.');
  if (observation.cutscene) return wait('Raid transition or cutscene is active.');
  if (observation.mounted) return wait('Assist is paused while mounted.');
  const contextMode = resolveContextMode(observation, settings);
  const pvpMode = contextMode === 'pvp';
  if (observation.pvp && !settings.pvp.enabled) return wait('PvP / Arena assist is disabled.');
  const gcdReady = canUseGcd(observation);
  const playerHp = hpPct(player);
  const playerInStasis = hasAura(player, 'stasis') || hasAura(player, 'ice_block');
  if (playerInStasis) return wait('Ice Block is active; hold until the immunity ends or you cancel it.');
  if (
    pvpMode &&
    gcdReady &&
    !player.castingAbility &&
    abilityReady(observation, settings, 'ice_block') &&
    (playerHp <= settings.pvp.iceBlockHpPct ||
      ((observation.controlled || observation.silenced) &&
        playerHp <= settings.profiles.pvp.emergencyHpPct))
  ) {
    return cast(
      'ice_block',
      1,
      observation.controlled || observation.silenced
        ? 'Break control and become immune during a PvP emergency.'
        : 'Become immune because self health is below the PvP Ice Block threshold.',
    );
  }
  if (
    pvpMode &&
    observation.rooted &&
    settings.pvp.blinkOnRoot &&
    gcdReady &&
    !player.castingAbility &&
    abilityReady(observation, settings, 'blink')
  ) {
    return cast('blink', 2, 'Break the root with Blink.');
  }
  if (observation.controlled) return wait('Player is crowd controlled.');
  if (observation.silenced) return wait('Player is silenced.');
  if (player.castingAbility || player.channeling) return wait('A cast or channel is already active.');

  const profile = settings.profiles[contextMode];
  const group = livingParty(observation);
  const tank = assignedTank(observation);
  const lowest = lowestUnit(group);
  const lowestAlly = lowestUnit(group.filter((member) => member.id !== player.id));
  const currentManaPct = manaPct(player);
  const conservingMana = currentManaPct < profile.conserveManaPct;
  const emergencyActive = !!lowest && hpPct(lowest) < profile.emergencyHpPct;
  const offensiveTarget = selectedEnemy(observation, settings, contextMode);
  const perfectMomentActive = hasAura(player, 'perfect_moment');
  const smartDamageHealing = smartGroupDamageHealingWindow(
    observation,
    settings,
    contextMode,
    profile,
    lowest,
  );
  const continuePerfectMomentHealing =
    settings.thresholds.smartPerfectMoment &&
    contextMode !== 'solo' &&
    perfectMomentActive &&
    smartDamageHealing.echoTargets > 0 &&
    !emergencyActive;
  const preferDamageHealing = smartDamageHealing.active || continuePerfectMomentHealing;
  let directHealTarget = lowest;
  if (contextMode !== 'solo' && hpPct(player) >= profile.emergencyHpPct) {
    const currentFriendly = group.find(
      (member) => member.id === observation.currentTargetId && member.id !== player.id,
    );
    if (
      settings.targeting.friendlyMode === 'current-friendly' &&
      currentFriendly &&
      hpPct(currentFriendly) < profile.mendHpPct
    ) {
      directHealTarget = currentFriendly;
    } else if (
      settings.targeting.friendlyMode === 'tank-first' &&
      tank &&
      tank.id !== player.id &&
      hpPct(tank) < profile.mendHpPct
    ) {
      directHealTarget = tank;
    } else if (lowestAlly && hpPct(lowestAlly) < profile.mendHpPct) {
      directHealTarget = lowestAlly;
    }
  }

  if (observation.potionCooldownRemaining <= 0) {
    const healthPotion = availableItem(observation.inventory, HEALTH_POTIONS);
    if (
      settings.consumables.healthPotion &&
      healthPotion &&
      hpPct(player) < settings.consumables.healthPotionHpPct
    ) {
      return {
        type: 'use-item',
        itemId: healthPotion,
        priority: 5,
        reason: `Use ${healthPotion} because self health is critically low.`,
      };
    }
    const manaPotion = availableItem(observation.inventory, MANA_POTIONS);
    if (
      settings.consumables.manaPotion &&
      manaPotion &&
      currentManaPct < settings.consumables.manaPotionManaPct
    ) {
      return {
        type: 'use-item',
        itemId: manaPotion,
        priority: 6,
        reason: `Use ${manaPotion} because mana is below the potion threshold.`,
      };
    }
  }

  if (pvpMode && gcdReady && abilityReady(observation, settings, 'temporal_hourglass')) {
    const rescue = [...group]
      .filter(
        (member) =>
          hpPct(member) <= settings.pvp.hourglassHpPct &&
          !hasAura(member, 'stasis') &&
          !hasAura(member, 'temporal_hourglass') &&
          distance(player, member) <= 28,
      )
      .sort((a, b) => hpPct(a) - hpPct(b) || Number(a.id === player.id) - Number(b.id === player.id) || a.id - b.id)[0];
    if (rescue) {
      return castAt(
        'temporal_hourglass',
        6,
        `Suspend ${rescue.name} in a protective Hourglass during critical PvP pressure.`,
        rescue.x,
        rescue.z,
        rescue.id,
      );
    }
  }

  if (pvpMode && gcdReady && abilityReady(observation, settings, 'frost_nova')) {
    const nearbyAttackers = observation.enemies.filter(
      (enemy) =>
        enemy.hostile &&
        !enemy.dead &&
        !enemy.crowdControlled &&
        distance(player, enemy) <= 10,
    );
    if (
      nearbyAttackers.length >= settings.pvp.frostNovaEnemyCount ||
      (nearbyAttackers.length > 0 && playerHp < settings.pvp.frostNovaHpPct)
    ) {
      return cast(
        'frost_nova',
        7,
        `Root ${nearbyAttackers.length} nearby PvP attacker${nearbyAttackers.length === 1 ? '' : 's'} to relieve melee pressure.`,
      );
    }
  }

  if (settings.modules.healing && gcdReady && abilityReady(observation, settings, 'temporal_rewind')) {
    const rewindTargets = group.filter(
      (member) => member.maxHp > 0 && member.rewind / member.maxHp >= profile.rewindLossPct,
    );
    if (rewindTargets.length >= profile.rewindCount) {
      return cast(
        'temporal_rewind',
        10,
        `${rewindTargets.length} allies have enough recoverable recent damage.`,
      );
    }
  }

  if (settings.modules.healing && lowest && hpPct(lowest) < profile.emergencyHpPct) {
    if (
      settings.thresholds.smartPowerEcho &&
      abilityReady(observation, settings, 'power_echo') &&
      abilityReady(observation, settings, 'temporal_mend') &&
      distance(player, lowest) <= FRIENDLY_RANGE &&
      !hasAura(player, 'power_echo')
    ) {
      return cast(
        'power_echo',
        30,
        `${lowest.name} is below the emergency threshold. Arm the repeated heal.`,
      );
    }
    if (gcdReady && abilityReady(observation, settings, 'temporal_mend')) {
      return cast(
        'temporal_mend',
        31,
        `${lowest.name} is critically injured at ${Math.round(hpPct(lowest) * 100)}%.`,
        lowest.id,
      );
    }
  }

  if (
    settings.modules.defensives &&
    gcdReady &&
    abilityReady(observation, settings, 'mass_barrier') &&
    (!conservingMana || emergencyActive)
  ) {
    const endangered = group.filter(
      (member) =>
        distance(player, member) <= MASS_BARRIER_RADIUS &&
        effectiveHpPct(member) < profile.massBarrierHpPct,
    );
    if (endangered.length >= profile.massBarrierCount) {
      return cast(
        'mass_barrier',
        32,
        `${endangered.length} nearby allies are below the Mass Barrier threshold.`,
      );
    }
  }

  if (settings.modules.interrupts && gcdReady && abilityReady(observation, settings, 'counterspell')) {
    const caster = observation.enemies
      .filter((enemy) => enemy.castingAbility && !enemy.dead && distance(player, enemy) <= 30)
      .sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id)[0];
    if (caster) {
      if (observation.currentTargetId !== caster.id) {
        return { type: 'target', targetId: caster.id, priority: 35, reason: `${caster.name} is casting.` };
      }
      return cast('counterspell', 36, `${caster.name} is casting ${caster.castingAbility}.`);
    }
  }

  if (
    pvpMode &&
    gcdReady &&
    abilityReady(observation, settings, 'polymorph') &&
    lowest &&
    hpPct(lowest) < settings.pvp.polymorphHpPct
  ) {
    const primary = offensiveTarget?.id ?? observation.currentTargetId;
    const secondary = observation.enemies
      .filter(
        (enemy) =>
          enemy.hostile &&
          !enemy.dead &&
          !enemy.crowdControlled &&
          enemy.id !== primary &&
          distance(player, enemy) <= FRIENDLY_RANGE,
      )
      .sort(
        (a, b) =>
          Number(b.targetId === lowest.id) - Number(a.targetId === lowest.id) ||
          distance(player, a) - distance(player, b) ||
          a.id - b.id,
      )[0];
    if (secondary) {
      return cast(
        'polymorph',
        37,
        `Control ${secondary.name} while ${lowest.name} is under pressure.`,
        secondary.id,
      );
    }
  }

  if (
    settings.modules.healing &&
    contextMode !== 'solo' &&
    gcdReady &&
    abilityReady(observation, settings, 'temporal_cascade') &&
    (!conservingMana || emergencyActive)
  ) {
    const cluster = cascadeCluster(group, profile.cascadeHpPct);
    if (cluster && cluster.count >= profile.cascadeCount) {
      return cast(
        'temporal_cascade',
        38,
        `${cluster.count} injured allies are clustered around ${cluster.center.name}; establish the group damage-healing window.`,
        cluster.center.id,
      );
    }
  }

  if (
    settings.modules.healing &&
    !settings.targeting.keepEchoOnTank &&
    tank &&
    gcdReady &&
    abilityReady(observation, settings, 'temporal_echo') &&
    (player.inCombat ||
      group.some((member) => member.inCombat || member.hasAggro) ||
      offensiveTarget !== null)
  ) {
    const desiredEchoTarget = adaptiveEchoTarget(observation, group, tank, profile);
    if (desiredEchoTarget && distance(player, desiredEchoTarget) <= FRIENDLY_RANGE) {
      const currentTargetId = observation.individualEcho?.targetId ?? null;
      const remaining = currentTargetId === desiredEchoTarget.id
        ? observation.individualEcho?.remaining ?? 0
        : 0;
      const movingEcho = currentTargetId !== desiredEchoTarget.id;
      if (movingEcho || remaining < settings.thresholds.echoRefreshSeconds) {
        const rescuingAlly = desiredEchoTarget.id !== tank.id;
        return cast(
          'temporal_echo',
          39,
          movingEcho
            ? rescuingAlly
              ? `Move Echo from the safe tank to endangered ${desiredEchoTarget.name}.`
              : `Return Echo to ${tank.name} because the rescue target is safe or the tank needs it.`
            : `Refresh adaptive Echo on ${desiredEchoTarget.name} with ${remaining.toFixed(1)} sec left.`,
          desiredEchoTarget.id,
        );
      }
    }
  }

  if (
    pvpMode &&
    player.inCombat &&
    gcdReady &&
    offensiveTarget &&
    currentManaPct >= Math.max(0.4, profile.conserveManaPct) &&
    group.every((member) => hpPct(member) >= 0.85) &&
    !hasAura(player, 'sated') &&
    abilityReady(observation, settings, 'temporal_acceleration')
  ) {
    return cast(
      'temporal_acceleration',
      75,
      'Accelerate the group during a stable active PvP pressure window.',
    );
  }

  if (
    settings.modules.healing &&
    directHealTarget &&
    hpPct(directHealTarget) < profile.mendHpPct &&
    !preferDamageHealing &&
    gcdReady &&
    abilityReady(observation, settings, 'temporal_mend') &&
    distance(player, directHealTarget) <= FRIENDLY_RANGE
  ) {
    return cast(
      'temporal_mend',
      40,
      `${directHealTarget.name} is below the Temporal Mend threshold.`,
      directHealTarget.id,
    );
  }

  if (
    settings.modules.defensives &&
    gcdReady &&
    abilityReady(observation, settings, 'temporal_barrier') &&
    (!conservingMana || emergencyActive)
  ) {
    const barrierTarget = group
      .filter(
        (member) =>
          (member.hasAggro || observation.enemies.some((enemy) => enemy.targetId === member.id)) &&
          effectiveHpPct(member) < profile.barrierHpPct &&
          !hasAura(member, 'temporal_barrier') &&
          distance(player, member) <= FRIENDLY_RANGE,
      )
      .sort((a, b) => effectiveHpPct(a) - effectiveHpPct(b) || a.id - b.id)[0];
    if (barrierTarget) {
      return cast(
        'temporal_barrier',
        50,
        `${barrierTarget.name} is injured and still has aggro.`,
        barrierTarget.id,
      );
    }
  }

  if (
    settings.safety.buffOutOfCombat &&
    (
      (!player.inCombat && !group.some((member) => member.inCombat)) ||
      // A duel or arena often starts with Assist already enabled.  Insight is
      // a zero-cast-time, 30-minute group buff, so apply a missing one at the
      // first calm PvP GCD instead of waiting for an out-of-combat state that
      // may not occur until the match is over.  Direct heals and emergency
      // defensives have already been considered above this point.
      (pvpMode && !emergencyActive && (!lowest || hpPct(lowest) >= profile.mendHpPct))
    ) &&
    observation.aetherInsightNeedsRefresh &&
    gcdReady &&
    abilityReady(observation, settings, 'arcane_intellect')
  ) {
    return cast(
      'arcane_intellect',
      65,
      'Apply Aether Insight before combat because the party buff is missing, expiring, or the roster changed.',
    );
  }

  if (
    settings.modules.healing &&
    settings.targeting.keepEchoOnTank &&
    tank &&
    gcdReady &&
    abilityReady(observation, settings, 'temporal_echo') &&
    distance(player, tank) <= FRIENDLY_RANGE &&
    (player.inCombat ||
      group.some((member) => member.inCombat || member.hasAggro) ||
      offensiveTarget !== null)
  ) {
    const remaining =
      observation.individualEcho?.targetId === tank.id ? observation.individualEcho.remaining : 0;
    if (remaining < settings.thresholds.echoRefreshSeconds) {
      return cast(
        'temporal_echo',
        70,
        remaining > 0 ? `Refresh the tank Echo with ${remaining.toFixed(1)} sec left.` : 'Maintain the individual Echo on the assigned tank.',
        tank.id,
      );
    }
  }

  const safeForMana = group.every((member) => hpPct(member) >= profile.barrierHpPct);
  if (
    settings.modules.healing &&
    safeForMana &&
    currentManaPct < settings.thresholds.aetherwellManaPct &&
    gcdReady &&
    abilityReady(observation, settings, 'evocation')
  ) {
    return cast('evocation', 80, 'The group is safe and mana is below the Aetherwell threshold.');
  }

  if (!pvpMode && settings.modules.resurrection && gcdReady) {
    const dead = observation.party.find((member) => member.dead && member.connected);
    if (dead && player.inCombat && abilityReady(observation, settings, 'temporal_reversal')) {
      return cast('temporal_reversal', 85, `Combat-resurrect ${dead.name}.`, dead.id);
    }
    if (
      dead &&
      !player.inCombat &&
      abilityReady(observation, settings, 'collective_reversal')
    ) {
      return cast('collective_reversal', 86, 'Restore fallen party or raid members out of combat.');
    }
  }

  if (!settings.modules.damageToHeal) return wait('Damage-to-heal is disabled.');
  if (
    contextMode !== 'solo' &&
    !player.inCombat &&
    !settings.safety.buffOutOfCombat
  ) {
    return wait('Waiting for combat.');
  }
  if (currentManaPct < profile.stopDamageManaPct) {
    return wait('Mana is reserved for healing. Offensive casting is paused.');
  }
  if (lowest && hpPct(lowest) < profile.mendHpPct && !preferDamageHealing) {
    return wait('An ally needs direct healing.');
  }

  const enemy = offensiveTarget;
  if (!enemy) return wait('No valid enemy is available inside the configured range.');
  if (observation.currentTargetId !== enemy.id) {
    const source =
      settings.targeting.enemyMode === 'assist-member-target'
        ? 'the assisted party member'
        : settings.targeting.enemyMode === 'tank-target'
          ? 'the tank'
          : 'the selected targeting rule';
    return {
      type: 'target',
      targetId: enemy.id,
      priority: 90,
      reason: `Target ${enemy.name} from ${source}.`,
    };
  }

  const charges = player.auras.find((aura) => aura.id === 'arcane_surge')?.stacks ?? 0;
  const nearbyEngaged = observation.enemies.filter(
    (candidate) =>
      candidate.inCombat &&
      candidate.hostile &&
      !candidate.dead &&
      !candidate.crowdControlled &&
      distance(player, candidate) <= 10,
  ).length;
  if (
    gcdReady &&
    !conservingMana &&
    nearbyEngaged >= settings.thresholds.aoeEnemyCount &&
    abilityReady(observation, settings, 'arcane_explosion')
  ) {
    return cast(
      'arcane_explosion',
      91,
      `${nearbyEngaged} engaged enemies are inside Aetherburst range.`,
    );
  }
  if (
    player.inCombat &&
    settings.thresholds.smartPerfectMoment &&
    abilityReady(observation, settings, 'perfect_moment') &&
    abilityReady(observation, settings, 'arcane_missiles') &&
    ownEchoTargets(observation).length > 0 &&
    (contextMode === 'solo'
      ? !conservingMana &&
        (enemy.maxHp >= player.maxHp * 1.5 || nearbyEngaged >= settings.thresholds.aoeEnemyCount)
      : smartDamageHealing.active)
  ) {
    return cast(
      'perfect_moment',
      92,
      contextMode === 'solo'
        ? 'Open the full-charge Aether Darts window for a durable solo target.'
        : `Open the offensive-healing window for ${smartDamageHealing.injuredEchoTargets} injured Echo targets.`,
    );
  }
  const surgeTarget = desiredSurgeCharges(group, contextMode, profile, settings, currentManaPct);
  const desiredCharges = surgeTarget.charges;
  if (
    gcdReady &&
    abilityReady(observation, settings, 'arcane_missiles') &&
    (perfectMomentActive || charges >= desiredCharges)
  ) {
    return cast(
      'arcane_missiles',
      93,
      perfectMomentActive
        ? 'Spend the Perfect Moment window with Aether Darts.'
        : surgeTarget.smart
          ? `Spend ${charges} Arcane Charges at the smart ${desiredCharges}-stack target (${surgeTarget.reason}).`
          : conservingMana
            ? `Conserve mana by spending ${charges} Arcane Charge with Aether Darts.`
            : `Spend ${charges} Arcane Charges with Aether Darts.`,
    );
  }
  if (gcdReady && abilityReady(observation, settings, 'arcane_surge')) {
    const expectedCost = 16 * 2 ** charges;
    if (player.mana >= expectedCost) {
      return cast(
        'arcane_surge',
        94,
        surgeTarget.smart
          ? `Build Arcane Charge ${Math.min(4, charges + 1)} toward the smart ${desiredCharges}-stack target (${surgeTarget.reason}).`
          : `Build Arcane Charge ${Math.min(4, charges + 1)} on ${enemy.name}.`,
      );
    }
  }
  if (gcdReady && charges > 0 && abilityReady(observation, settings, 'arcane_missiles')) {
    return cast('arcane_missiles', 95, 'Mana is too low for the next Aether Surge. Spend the held charges.');
  }
  return wait('Waiting for the global cooldown or an enabled ability.');
}
