"use strict";
(() => {
  // src/defaults.ts
  var DEFAULT_SETTINGS = {
    settingsVersion: 12,
    assistProfile: "auto",
    mode: "auto",
    modules: {
      healing: true,
      damageToHeal: true,
      defensives: true,
      interrupts: true,
      resurrection: false
    },
    abilities: {
      arcane_intellect: true,
      frost_armor: true,
      frostbolt: true,
      ice_lance: true,
      flurry: true,
      frozen_orb: true,
      blizzard: true,
      glacial_spike: true,
      glacial_front: true,
      ice_barrier: true,
      icy_veins: true,
      summon_water_elemental: true,
      cone_of_cold: true,
      presence_of_mind: true,
      rune_of_power: true,
      ice_floes: false,
      cold_snap: true,
      greater_invisibility: false,
      rings_of_frost: false,
      temporal_echo: true,
      temporal_mend: true,
      temporal_barrier: true,
      temporal_cascade: true,
      temporal_rewind: true,
      mass_barrier: true,
      power_echo: true,
      arcane_surge: true,
      arcane_missiles: true,
      arcane_explosion: true,
      evocation: true,
      perfect_moment: false,
      counterspell: true,
      ice_block: true,
      blink: true,
      frost_nova: true,
      polymorph: true,
      temporal_hourglass: true,
      temporal_acceleration: true,
      temporal_reversal: false,
      collective_reversal: false
    },
    frostAbilities: {
      arcane_intellect: true,
      frost_armor: true,
      frostbolt: true,
      ice_lance: true,
      flurry: true,
      frozen_orb: true,
      blizzard: true,
      glacial_spike: true,
      glacial_front: true,
      ice_barrier: true,
      icy_veins: true,
      summon_water_elemental: true,
      cone_of_cold: true,
      power_echo: true,
      presence_of_mind: true,
      rune_of_power: true,
      counterspell: true,
      ice_block: true,
      evocation: true,
      frost_nova: true
    },
    profiles: {
      solo: {
        mendHpPct: 0.72,
        barrierHpPct: 0.82,
        emergencyHpPct: 0.48,
        cascadeHpPct: 0.85,
        cascadeCount: 1,
        massBarrierHpPct: 0.75,
        massBarrierCount: 1,
        rewindLossPct: 0.2,
        rewindCount: 1,
        conserveManaPct: 0.45,
        stopDamageManaPct: 0.2
      },
      party: {
        mendHpPct: 0.7,
        barrierHpPct: 0.8,
        emergencyHpPct: 0.45,
        cascadeHpPct: 0.85,
        cascadeCount: 2,
        massBarrierHpPct: 0.75,
        massBarrierCount: 2,
        rewindLossPct: 0.2,
        rewindCount: 2,
        conserveManaPct: 0.5,
        stopDamageManaPct: 0.25
      },
      raid: {
        mendHpPct: 0.75,
        barrierHpPct: 0.82,
        emergencyHpPct: 0.5,
        cascadeHpPct: 0.88,
        cascadeCount: 3,
        massBarrierHpPct: 0.78,
        massBarrierCount: 3,
        rewindLossPct: 0.18,
        rewindCount: 3,
        conserveManaPct: 0.55,
        stopDamageManaPct: 0.35
      },
      pvp: {
        mendHpPct: 0.72,
        barrierHpPct: 0.88,
        emergencyHpPct: 0.52,
        cascadeHpPct: 0.82,
        cascadeCount: 2,
        massBarrierHpPct: 0.76,
        massBarrierCount: 2,
        rewindLossPct: 0.15,
        rewindCount: 1,
        conserveManaPct: 0,
        stopDamageManaPct: 0
      }
    },
    frost: {
      blizzardEnemyCount: 3,
      frozenOrbEnemyCount: 3,
      glacialFrontEnemyCount: 3,
      conserveManaPct: 0.25,
      stopDamageManaPct: 0.05,
      aetherwellManaPct: 0.3,
      barrierHpPct: 0.72,
      iceBlockHpPct: 0.28,
      icyVeinsDurableOnly: true,
      smartProcs: true,
      smartGlacialBurst: true,
      useIcebindPve: true
    },
    thresholds: {
      aetherwellManaPct: 0.35,
      echoRefreshSeconds: 1,
      smartPowerEcho: true,
      smartPerfectMoment: false,
      smartSurgeCharges: true,
      maxSurgeCharges: 2,
      lowManaMaxSurgeCharges: 1,
      aoeEnemyCount: 3
    },
    targeting: {
      assignedTankId: null,
      assistMemberId: null,
      enemyMode: "tank-target",
      friendlyMode: "lowest-effective-hp",
      keepEchoOnTank: true,
      partyOnly: true,
      autoPull: true,
      maxTargetRange: 30,
      streamTargetSelection: true
    },
    consumables: {
      healthPotion: true,
      healthPotionHpPct: 0.3,
      manaPotion: true,
      manaPotionManaPct: 0.2
    },
    pvp: {
      enabled: true,
      minSurgeCharges: 1,
      maxSurgeCharges: 4,
      iceBlockHpPct: 0.45,
      blinkOnRoot: true,
      frostNovaHpPct: 0.7,
      frostNovaEnemyCount: 2,
      polymorphHpPct: 0.6,
      hourglassHpPct: 0.4
    },
    safety: {
      manualOverrideMs: 2e3,
      disableInPvp: false,
      buffOutOfCombat: true,
      decisionIntervalMs: 100,
      toggleHotkey: "["
    }
  };
  function copyDefaultSettings() {
    return structuredClone(DEFAULT_SETTINGS);
  }

  // src/policy.ts
  var FRIENDLY_RANGE = 30;
  var CASCADE_RADIUS = 15;
  var MASS_BARRIER_RADIUS = 30;
  var FRONTLINE_CLASSES = /* @__PURE__ */ new Set(["warrior", "paladin", "druid", "rogue", "shaman"]);
  var HEALTH_POTIONS = ["healing_potion", "lesser_healing_potion", "minor_healing_potion"];
  var MANA_POTIONS = ["mana_potion", "lesser_mana_potion", "minor_mana_potion"];
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function hpPct(unit) {
    if (unit.maxHp <= 0) return 0;
    return Math.max(0, Math.min(1, (unit.hp + unit.incomingHeal) / unit.maxHp));
  }
  function effectiveHpPct(unit) {
    if (unit.maxHp <= 0) return 0;
    return Math.max(0, Math.min(1, (unit.hp + unit.incomingHeal + unit.absorb) / unit.maxHp));
  }
  function manaPct(unit) {
    return unit.maxMana > 0 ? unit.mana / unit.maxMana : 0;
  }
  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }
  function clampSurgeCharges(value) {
    return Math.max(1, Math.min(4, Math.round(value)));
  }
  function desiredSurgeCharges(group, contextMode, profile, settings, currentManaPct) {
    const maximum = clampSurgeCharges(
      contextMode === "pvp" ? settings.pvp.maxSurgeCharges : settings.thresholds.maxSurgeCharges
    );
    const minimum = Math.min(
      maximum,
      clampSurgeCharges(
        contextMode === "pvp" ? settings.pvp.minSurgeCharges : settings.thresholds.lowManaMaxSurgeCharges
      )
    );
    const conservingMana = currentManaPct < profile.conserveManaPct;
    if (!settings.thresholds.smartSurgeCharges) {
      const charges2 = conservingMana ? minimum : maximum;
      return {
        charges: charges2,
        smart: false,
        reason: conservingMana ? "the configured low-mana target" : "the configured fixed target"
      };
    }
    const lowestEffectiveHpPct = group.length > 0 ? Math.min(...group.map(effectiveHpPct)) : 1;
    const manaHeadroom = contextMode === "pvp" ? 1 : profile.conserveManaPct >= 1 ? 0 : clamp01((currentManaPct - profile.conserveManaPct) / (1 - profile.conserveManaPct));
    const healthHeadroom = profile.mendHpPct >= 1 ? 0 : clamp01((lowestEffectiveHpPct - profile.mendHpPct) / (1 - profile.mendHpPct));
    const safetyHeadroom = Math.min(manaHeadroom, healthHeadroom);
    const charges = minimum + Math.round(safetyHeadroom * (maximum - minimum));
    return {
      charges,
      smart: true,
      reason: `${Math.round(currentManaPct * 100)}% mana and ${Math.round(lowestEffectiveHpPct * 100)}% lowest effective HP`
    };
  }
  function wait(reason) {
    return { type: "wait", priority: 999, reason };
  }
  function abilityReady(observation, settings, abilityId) {
    const chargeBank = observation.player.abilityCharges?.[abilityId];
    return settings.abilities[abilityId] && observation.knownAbilityIds.has(abilityId) && ((chargeBank?.charges ?? 0) > 0 || (observation.player.cooldowns[abilityId] ?? 0) <= 0);
  }
  function canUseGcd(observation) {
    return observation.player.gcdRemaining <= 0.05;
  }
  function hasAura(unit, idOrKind) {
    return unit.auras.some((aura) => aura.id === idOrKind || aura.kind === idOrKind);
  }
  function ownEchoTargets(observation) {
    return observation.party.filter((member) => observation.individualEcho?.targetId === member.id || member.auras.some(
      (aura) => aura.kind === "temporal_echo" && (aura.sourceId === void 0 || aura.sourceId === observation.player.id)
    ));
  }
  function smartGroupDamageHealingWindow(observation, settings, contextMode, profile, lowest) {
    const marked = ownEchoTargets(observation);
    const injured = marked.filter((member) => hpPct(member) < profile.cascadeHpPct);
    const safeFloor = Math.min(profile.mendHpPct, profile.emergencyHpPct + 0.1);
    const safeToChannel = !lowest || hpPct(lowest) >= safeFloor;
    const needed = contextMode === "raid" ? Math.max(2, Math.min(3, profile.cascadeCount)) : Math.max(2, Math.min(2, profile.cascadeCount));
    return {
      active: settings.thresholds.smartPerfectMoment && contextMode !== "solo" && safeToChannel && marked.length >= needed && injured.length >= needed,
      echoTargets: marked.length,
      injuredEchoTargets: injured.length
    };
  }
  function cast(abilityId, priority, reason, targetId) {
    return { type: "cast", abilityId, targetId, priority, reason };
  }
  function castAt(abilityId, priority, reason, x, z, targetId) {
    return { type: "cast-at", abilityId, x, z, targetId, priority, reason };
  }
  function livingParty(observation) {
    return observation.party.filter((member) => !member.dead && member.connected);
  }
  function lowestUnit(units) {
    let best = null;
    for (const unit of units) {
      if (!best || hpPct(unit) < hpPct(best) || hpPct(unit) === hpPct(best) && unit.id < best.id) {
        best = unit;
      }
    }
    return best;
  }
  function cascadeCluster(units, threshold) {
    const injured = units.filter((unit) => hpPct(unit) < threshold);
    let best = null;
    for (const center of injured) {
      const count = injured.filter((unit) => distance(center, unit) <= CASCADE_RADIUS).length;
      if (!best || count > best.count || count === best.count && hpPct(center) < hpPct(best.center) || count === best.count && hpPct(center) === hpPct(best.center) && center.id < best.center.id) {
        best = { center, count };
      }
    }
    return best;
  }
  function assignedTank(observation) {
    if (observation.assignedTankId !== null) {
      const assigned = observation.party.find((member) => member.id === observation.assignedTankId);
      if (assigned && !assigned.dead && assigned.connected) return assigned;
    }
    const living = observation.party.filter((member) => !member.dead && member.connected);
    const roleTank = living.find((member) => member.role === "tank");
    if (roleTank) return roleTank;
    const underPressure = living.map((member) => ({
      member,
      attackers: observation.enemies.filter(
        (enemy) => enemy.inCombat && !enemy.dead && enemy.targetId === member.id
      ).length
    })).sort(
      (a, b) => b.attackers - a.attackers || Number(b.member.hasAggro) - Number(a.member.hasAggro) || a.member.id - b.member.id
    )[0];
    if (underPressure && (underPressure.attackers > 0 || underPressure.member.hasAggro)) {
      return underPressure.member;
    }
    const frontliner = living.find(
      (member) => member.id !== observation.player.id && FRONTLINE_CLASSES.has(member.playerClass ?? "")
    );
    if (frontliner) return frontliner;
    return living.find((member) => member.id === observation.partyLeaderId) ?? living.find((member) => member.id === observation.player.id) ?? living[0] ?? null;
  }
  function adaptiveEchoTarget(observation, group, tank, profile) {
    if (!tank) return null;
    const tankSafe = effectiveHpPct(tank) >= 0.85;
    if (!tankSafe) return tank;
    const isPressured = (member) => member.hasAggro || observation.enemies.some(
      (enemy) => enemy.inCombat && !enemy.dead && enemy.targetId === member.id
    );
    const isEndangered = (member) => {
      const health = effectiveHpPct(member);
      return health < profile.emergencyHpPct + 0.1 || health < profile.mendHpPct && isPressured(member);
    };
    const endangered = group.filter(
      (member) => member.id !== tank.id && distance(observation.player, member) <= FRIENDLY_RANGE && isEndangered(member)
    ).sort((a, b) => effectiveHpPct(a) - effectiveHpPct(b) || a.id - b.id);
    if (endangered.length === 0) return tank;
    const current = endangered.find(
      (member) => member.id === observation.individualEcho?.targetId
    );
    const critical = endangered.find(
      (member) => effectiveHpPct(member) < profile.emergencyHpPct
    );
    if (current && (!critical || effectiveHpPct(current) < profile.emergencyHpPct)) return current;
    return critical ?? endangered[0] ?? tank;
  }
  function resolveContextMode(observation, settings) {
    if (settings.mode !== "auto") return settings.mode;
    if (observation.pvp) return "pvp";
    if (observation.raid || observation.party.length > 5) return "raid";
    if (observation.party.length > 1) return "party";
    return "solo";
  }
  function availableItem(inventory, preference) {
    return preference.find((itemId) => (inventory[itemId] ?? 0) > 0) ?? null;
  }
  function selectedEnemy(observation, settings, contextMode) {
    const valid = (enemy) => enemy && enemy.hostile && !enemy.dead && !enemy.crowdControlled && distance(observation.player, enemy) <= settings.targeting.maxTargetRange ? enemy : null;
    const current = valid(
      observation.enemies.find((enemy) => enemy.id === observation.currentTargetId)
    );
    const remembered = valid(
      observation.enemies.find((enemy) => enemy.id === observation.lastEnemyTargetId)
    );
    if (contextMode === "pvp" && current) return current;
    if (settings.targeting.enemyMode === "current-target" && (current || remembered)) {
      return current ?? remembered;
    }
    const tank = assignedTank(observation);
    if (settings.targeting.enemyMode === "tank-target" && tank) {
      const tankTarget = observation.enemies.find((enemy) => enemy.id === tank.targetId) ?? observation.enemies.find((enemy) => enemy.targetId === tank.id);
      if (tankTarget) return valid(tankTarget);
    }
    if (settings.targeting.enemyMode === "assist-member-target") {
      const member = observation.party.find((candidate) => candidate.id === settings.targeting.assistMemberId) ?? tank;
      const assisted = observation.enemies.find((enemy) => enemy.id === member?.targetId);
      if (assisted) return valid(assisted);
    }
    const partyIds = new Set(observation.party.map((member) => member.id));
    const engaged = observation.enemies.filter(
      (enemy) => enemy.inCombat && valid(enemy) && (contextMode === "solo" || !settings.targeting.partyOnly || enemy.targetId === null || partyIds.has(enemy.targetId))
    ).sort(
      (a, b) => distance(observation.player, a) - distance(observation.player, b) || a.id - b.id
    );
    if (settings.targeting.enemyMode === "closest-engaged") return engaged[0] ?? current ?? remembered;
    const mayAcquire = contextMode === "pvp" || contextMode === "solo" && settings.targeting.autoPull;
    const attackable = (mayAcquire ? observation.enemies.filter((enemy) => valid(enemy)) : engaged).sort(
      (a, b) => distance(observation.player, a) - distance(observation.player, b) || a.id - b.id
    );
    if (settings.targeting.enemyMode === "lowest-hp") {
      return [...attackable].sort(
        (a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp) || a.id - b.id
      )[0] ?? current ?? remembered;
    }
    if (settings.targeting.enemyMode === "closest-in-range") return attackable[0] ?? current ?? remembered;
    return engaged[0] ?? attackable[0] ?? current ?? remembered;
  }
  function decideChronomancy(observation, settings) {
    const player = observation.player;
    if (observation.loading) return wait("Waiting for a complete world snapshot.");
    if (player.dead) return wait("Player is dead.");
    if (observation.cutscene) return wait("Raid transition or cutscene is active.");
    if (observation.mounted) return wait("Assist is paused while mounted.");
    const contextMode = resolveContextMode(observation, settings);
    const pvpMode = contextMode === "pvp";
    if (observation.pvp && !settings.pvp.enabled) return wait("PvP / Arena assist is disabled.");
    const gcdReady = canUseGcd(observation);
    const playerHp = hpPct(player);
    const playerInStasis = hasAura(player, "stasis") || hasAura(player, "ice_block");
    if (playerInStasis) return wait("Ice Block is active; hold until the immunity ends or you cancel it.");
    if (pvpMode && gcdReady && !player.castingAbility && abilityReady(observation, settings, "ice_block") && (playerHp <= settings.pvp.iceBlockHpPct || (observation.controlled || observation.silenced) && playerHp <= settings.profiles.pvp.emergencyHpPct)) {
      return cast(
        "ice_block",
        1,
        observation.controlled || observation.silenced ? "Break control and become immune during a PvP emergency." : "Become immune because self health is below the PvP Ice Block threshold."
      );
    }
    if (pvpMode && observation.rooted && settings.pvp.blinkOnRoot && gcdReady && !player.castingAbility && abilityReady(observation, settings, "blink")) {
      return cast("blink", 2, "Break the root with Blink.");
    }
    if (observation.controlled) return wait("Player is crowd controlled.");
    if (observation.silenced) return wait("Player is silenced.");
    if (player.castingAbility || player.channeling) return wait("A cast or channel is already active.");
    const profile = settings.profiles[contextMode];
    const group = livingParty(observation);
    const tank = assignedTank(observation);
    const lowest = lowestUnit(group);
    const lowestAlly = lowestUnit(group.filter((member) => member.id !== player.id));
    const currentManaPct = manaPct(player);
    const conservingMana = currentManaPct < profile.conserveManaPct;
    const emergencyActive = !!lowest && hpPct(lowest) < profile.emergencyHpPct;
    const offensiveTarget = selectedEnemy(observation, settings, contextMode);
    const perfectMomentActive = hasAura(player, "perfect_moment");
    const smartDamageHealing = smartGroupDamageHealingWindow(
      observation,
      settings,
      contextMode,
      profile,
      lowest
    );
    const continuePerfectMomentHealing = settings.thresholds.smartPerfectMoment && contextMode !== "solo" && perfectMomentActive && smartDamageHealing.echoTargets > 0 && !emergencyActive;
    const preferDamageHealing = smartDamageHealing.active || continuePerfectMomentHealing;
    let directHealTarget = lowest;
    if (contextMode !== "solo" && hpPct(player) >= profile.emergencyHpPct) {
      const currentFriendly = group.find(
        (member) => member.id === observation.currentTargetId && member.id !== player.id
      );
      if (settings.targeting.friendlyMode === "current-friendly" && currentFriendly && hpPct(currentFriendly) < profile.mendHpPct) {
        directHealTarget = currentFriendly;
      } else if (settings.targeting.friendlyMode === "tank-first" && tank && tank.id !== player.id && hpPct(tank) < profile.mendHpPct) {
        directHealTarget = tank;
      } else if (lowestAlly && hpPct(lowestAlly) < profile.mendHpPct) {
        directHealTarget = lowestAlly;
      }
    }
    if (observation.potionCooldownRemaining <= 0) {
      const healthPotion = availableItem(observation.inventory, HEALTH_POTIONS);
      if (settings.consumables.healthPotion && healthPotion && hpPct(player) < settings.consumables.healthPotionHpPct) {
        return {
          type: "use-item",
          itemId: healthPotion,
          priority: 5,
          reason: `Use ${healthPotion} because self health is critically low.`
        };
      }
      const manaPotion = availableItem(observation.inventory, MANA_POTIONS);
      if (settings.consumables.manaPotion && manaPotion && currentManaPct < settings.consumables.manaPotionManaPct) {
        return {
          type: "use-item",
          itemId: manaPotion,
          priority: 6,
          reason: `Use ${manaPotion} because mana is below the potion threshold.`
        };
      }
    }
    if (pvpMode && gcdReady && abilityReady(observation, settings, "temporal_hourglass")) {
      const rescue = [...group].filter(
        (member) => hpPct(member) <= settings.pvp.hourglassHpPct && !hasAura(member, "stasis") && !hasAura(member, "temporal_hourglass") && distance(player, member) <= 28
      ).sort((a, b) => hpPct(a) - hpPct(b) || Number(a.id === player.id) - Number(b.id === player.id) || a.id - b.id)[0];
      if (rescue) {
        return castAt(
          "temporal_hourglass",
          6,
          `Suspend ${rescue.name} in a protective Hourglass during critical PvP pressure.`,
          rescue.x,
          rescue.z,
          rescue.id
        );
      }
    }
    if (pvpMode && gcdReady && abilityReady(observation, settings, "frost_nova")) {
      const nearbyAttackers = observation.enemies.filter(
        (enemy2) => enemy2.hostile && !enemy2.dead && !enemy2.crowdControlled && distance(player, enemy2) <= 10
      );
      if (nearbyAttackers.length >= settings.pvp.frostNovaEnemyCount || nearbyAttackers.length > 0 && playerHp < settings.pvp.frostNovaHpPct) {
        return cast(
          "frost_nova",
          7,
          `Root ${nearbyAttackers.length} nearby PvP attacker${nearbyAttackers.length === 1 ? "" : "s"} to relieve melee pressure.`
        );
      }
    }
    if (settings.modules.healing && gcdReady && abilityReady(observation, settings, "temporal_rewind")) {
      const rewindTargets = group.filter(
        (member) => member.maxHp > 0 && member.rewind / member.maxHp >= profile.rewindLossPct
      );
      if (rewindTargets.length >= profile.rewindCount) {
        return cast(
          "temporal_rewind",
          10,
          `${rewindTargets.length} allies have enough recoverable recent damage.`
        );
      }
    }
    if (settings.modules.healing && lowest && hpPct(lowest) < profile.emergencyHpPct) {
      if (settings.thresholds.smartPowerEcho && abilityReady(observation, settings, "power_echo") && abilityReady(observation, settings, "temporal_mend") && distance(player, lowest) <= FRIENDLY_RANGE && !hasAura(player, "power_echo")) {
        return cast(
          "power_echo",
          30,
          `${lowest.name} is below the emergency threshold. Arm the repeated heal.`
        );
      }
      if (gcdReady && abilityReady(observation, settings, "temporal_mend")) {
        return cast(
          "temporal_mend",
          31,
          `${lowest.name} is critically injured at ${Math.round(hpPct(lowest) * 100)}%.`,
          lowest.id
        );
      }
    }
    if (settings.modules.defensives && gcdReady && abilityReady(observation, settings, "mass_barrier") && (!conservingMana || emergencyActive)) {
      const endangered = group.filter(
        (member) => distance(player, member) <= MASS_BARRIER_RADIUS && effectiveHpPct(member) < profile.massBarrierHpPct
      );
      if (endangered.length >= profile.massBarrierCount) {
        return cast(
          "mass_barrier",
          32,
          `${endangered.length} nearby allies are below the Mass Barrier threshold.`
        );
      }
    }
    if (settings.modules.interrupts && gcdReady && abilityReady(observation, settings, "counterspell")) {
      const caster = observation.enemies.filter((enemy2) => enemy2.castingAbility && !enemy2.dead && distance(player, enemy2) <= 30).sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id)[0];
      if (caster) {
        if (observation.currentTargetId !== caster.id) {
          return { type: "target", targetId: caster.id, priority: 35, reason: `${caster.name} is casting.` };
        }
        return cast("counterspell", 36, `${caster.name} is casting ${caster.castingAbility}.`);
      }
    }
    if (pvpMode && gcdReady && abilityReady(observation, settings, "polymorph") && lowest && hpPct(lowest) < settings.pvp.polymorphHpPct) {
      const primary = offensiveTarget?.id ?? observation.currentTargetId;
      const secondary = observation.enemies.filter(
        (enemy2) => enemy2.hostile && !enemy2.dead && !enemy2.crowdControlled && enemy2.id !== primary && distance(player, enemy2) <= FRIENDLY_RANGE
      ).sort(
        (a, b) => Number(b.targetId === lowest.id) - Number(a.targetId === lowest.id) || distance(player, a) - distance(player, b) || a.id - b.id
      )[0];
      if (secondary) {
        return cast(
          "polymorph",
          37,
          `Control ${secondary.name} while ${lowest.name} is under pressure.`,
          secondary.id
        );
      }
    }
    if (settings.modules.healing && contextMode !== "solo" && gcdReady && abilityReady(observation, settings, "temporal_cascade") && (!conservingMana || emergencyActive)) {
      const cluster = cascadeCluster(group, profile.cascadeHpPct);
      if (cluster && cluster.count >= profile.cascadeCount) {
        return cast(
          "temporal_cascade",
          38,
          `${cluster.count} injured allies are clustered around ${cluster.center.name}; establish the group damage-healing window.`,
          cluster.center.id
        );
      }
    }
    if (settings.modules.healing && !settings.targeting.keepEchoOnTank && tank && gcdReady && abilityReady(observation, settings, "temporal_echo") && (player.inCombat || group.some((member) => member.inCombat || member.hasAggro) || offensiveTarget !== null)) {
      const desiredEchoTarget = adaptiveEchoTarget(observation, group, tank, profile);
      if (desiredEchoTarget && distance(player, desiredEchoTarget) <= FRIENDLY_RANGE) {
        const currentTargetId = observation.individualEcho?.targetId ?? null;
        const remaining = currentTargetId === desiredEchoTarget.id ? observation.individualEcho?.remaining ?? 0 : 0;
        const movingEcho = currentTargetId !== desiredEchoTarget.id;
        if (movingEcho || remaining < settings.thresholds.echoRefreshSeconds) {
          const rescuingAlly = desiredEchoTarget.id !== tank.id;
          return cast(
            "temporal_echo",
            39,
            movingEcho ? rescuingAlly ? `Move Echo from the safe tank to endangered ${desiredEchoTarget.name}.` : `Return Echo to ${tank.name} because the rescue target is safe or the tank needs it.` : `Refresh adaptive Echo on ${desiredEchoTarget.name} with ${remaining.toFixed(1)} sec left.`,
            desiredEchoTarget.id
          );
        }
      }
    }
    if (pvpMode && player.inCombat && gcdReady && offensiveTarget && currentManaPct >= Math.max(0.4, profile.conserveManaPct) && group.every((member) => hpPct(member) >= 0.85) && !hasAura(player, "sated") && abilityReady(observation, settings, "temporal_acceleration")) {
      return cast(
        "temporal_acceleration",
        75,
        "Accelerate the group during a stable active PvP pressure window."
      );
    }
    if (settings.modules.healing && directHealTarget && hpPct(directHealTarget) < profile.mendHpPct && !preferDamageHealing && gcdReady && abilityReady(observation, settings, "temporal_mend") && distance(player, directHealTarget) <= FRIENDLY_RANGE) {
      return cast(
        "temporal_mend",
        40,
        `${directHealTarget.name} is below the Temporal Mend threshold.`,
        directHealTarget.id
      );
    }
    if (settings.modules.defensives && gcdReady && abilityReady(observation, settings, "temporal_barrier") && (!conservingMana || emergencyActive)) {
      const barrierTarget = group.filter(
        (member) => (member.hasAggro || observation.enemies.some((enemy2) => enemy2.targetId === member.id)) && effectiveHpPct(member) < profile.barrierHpPct && !hasAura(member, "temporal_barrier") && distance(player, member) <= FRIENDLY_RANGE
      ).sort((a, b) => effectiveHpPct(a) - effectiveHpPct(b) || a.id - b.id)[0];
      if (barrierTarget) {
        return cast(
          "temporal_barrier",
          50,
          `${barrierTarget.name} is injured and still has aggro.`,
          barrierTarget.id
        );
      }
    }
    if (settings.safety.buffOutOfCombat && (!player.inCombat && !group.some((member) => member.inCombat) || // A duel or arena often starts with Assist already enabled.  Insight is
    // a zero-cast-time, 30-minute group buff, so apply a missing one at the
    // first calm PvP GCD instead of waiting for an out-of-combat state that
    // may not occur until the match is over.  Direct heals and emergency
    // defensives have already been considered above this point.
    pvpMode && !emergencyActive && (!lowest || hpPct(lowest) >= profile.mendHpPct)) && observation.aetherInsightNeedsRefresh && gcdReady && abilityReady(observation, settings, "arcane_intellect")) {
      return cast(
        "arcane_intellect",
        65,
        "Apply Aether Insight before combat because the party buff is missing, expiring, or the roster changed."
      );
    }
    if (settings.modules.healing && settings.targeting.keepEchoOnTank && tank && gcdReady && abilityReady(observation, settings, "temporal_echo") && distance(player, tank) <= FRIENDLY_RANGE && (player.inCombat || group.some((member) => member.inCombat || member.hasAggro) || offensiveTarget !== null)) {
      const remaining = observation.individualEcho?.targetId === tank.id ? observation.individualEcho.remaining : 0;
      if (remaining < settings.thresholds.echoRefreshSeconds) {
        return cast(
          "temporal_echo",
          70,
          remaining > 0 ? `Refresh the tank Echo with ${remaining.toFixed(1)} sec left.` : "Maintain the individual Echo on the assigned tank.",
          tank.id
        );
      }
    }
    const safeForMana = group.every((member) => hpPct(member) >= profile.barrierHpPct);
    if (settings.modules.healing && safeForMana && currentManaPct < settings.thresholds.aetherwellManaPct && gcdReady && abilityReady(observation, settings, "evocation")) {
      return cast("evocation", 80, "The group is safe and mana is below the Aetherwell threshold.");
    }
    if (!pvpMode && settings.modules.resurrection && gcdReady) {
      const dead = observation.party.find((member) => member.dead && member.connected);
      if (dead && player.inCombat && abilityReady(observation, settings, "temporal_reversal")) {
        return cast("temporal_reversal", 85, `Combat-resurrect ${dead.name}.`, dead.id);
      }
      if (dead && !player.inCombat && abilityReady(observation, settings, "collective_reversal")) {
        return cast("collective_reversal", 86, "Restore fallen party or raid members out of combat.");
      }
    }
    if (!settings.modules.damageToHeal) return wait("Damage-to-heal is disabled.");
    if (contextMode !== "solo" && !player.inCombat && !settings.safety.buffOutOfCombat) {
      return wait("Waiting for combat.");
    }
    if (currentManaPct < profile.stopDamageManaPct) {
      return wait("Mana is reserved for healing. Offensive casting is paused.");
    }
    if (lowest && hpPct(lowest) < profile.mendHpPct && !preferDamageHealing) {
      return wait("An ally needs direct healing.");
    }
    const enemy = offensiveTarget;
    if (!enemy) return wait("No valid enemy is available inside the configured range.");
    if (observation.currentTargetId !== enemy.id) {
      const source = settings.targeting.enemyMode === "assist-member-target" ? "the assisted party member" : settings.targeting.enemyMode === "tank-target" ? "the tank" : "the selected targeting rule";
      return {
        type: "target",
        targetId: enemy.id,
        priority: 90,
        reason: `Target ${enemy.name} from ${source}.`
      };
    }
    const charges = player.auras.find((aura) => aura.id === "arcane_surge")?.stacks ?? 0;
    const nearbyEngaged = observation.enemies.filter(
      (candidate) => candidate.inCombat && candidate.hostile && !candidate.dead && !candidate.crowdControlled && distance(player, candidate) <= 10
    ).length;
    if (gcdReady && !conservingMana && nearbyEngaged >= settings.thresholds.aoeEnemyCount && abilityReady(observation, settings, "arcane_explosion")) {
      return cast(
        "arcane_explosion",
        91,
        `${nearbyEngaged} engaged enemies are inside Aetherburst range.`
      );
    }
    if (player.inCombat && settings.thresholds.smartPerfectMoment && abilityReady(observation, settings, "perfect_moment") && abilityReady(observation, settings, "arcane_missiles") && ownEchoTargets(observation).length > 0 && (contextMode === "solo" ? !conservingMana && (enemy.maxHp >= player.maxHp * 1.5 || nearbyEngaged >= settings.thresholds.aoeEnemyCount) : smartDamageHealing.active)) {
      return cast(
        "perfect_moment",
        92,
        contextMode === "solo" ? "Open the full-charge Aether Darts window for a durable solo target." : `Open the offensive-healing window for ${smartDamageHealing.injuredEchoTargets} injured Echo targets.`
      );
    }
    const surgeTarget = desiredSurgeCharges(group, contextMode, profile, settings, currentManaPct);
    const desiredCharges = surgeTarget.charges;
    if (gcdReady && abilityReady(observation, settings, "arcane_missiles") && (perfectMomentActive || charges >= desiredCharges)) {
      return cast(
        "arcane_missiles",
        93,
        perfectMomentActive ? "Spend the Perfect Moment window with Aether Darts." : surgeTarget.smart ? `Spend ${charges} Arcane Charges at the smart ${desiredCharges}-stack target (${surgeTarget.reason}).` : conservingMana ? `Conserve mana by spending ${charges} Arcane Charge with Aether Darts.` : `Spend ${charges} Arcane Charges with Aether Darts.`
      );
    }
    if (gcdReady && abilityReady(observation, settings, "arcane_surge")) {
      const expectedCost = 16 * 2 ** charges;
      if (player.mana >= expectedCost) {
        return cast(
          "arcane_surge",
          94,
          surgeTarget.smart ? `Build Arcane Charge ${Math.min(4, charges + 1)} toward the smart ${desiredCharges}-stack target (${surgeTarget.reason}).` : `Build Arcane Charge ${Math.min(4, charges + 1)} on ${enemy.name}.`
        );
      }
    }
    if (gcdReady && charges > 0 && abilityReady(observation, settings, "arcane_missiles")) {
      return cast("arcane_missiles", 95, "Mana is too low for the next Aether Surge. Spend the held charges.");
    }
    return wait("Waiting for the global cooldown or an enabled ability.");
  }

  // src/frost-policy.ts
  var HEALTH_POTIONS2 = ["healing_potion", "lesser_healing_potion", "minor_healing_potion"];
  var MANA_POTIONS2 = ["mana_potion", "lesser_mana_potion", "minor_mana_potion"];
  var BREAKABLE_CONTROL = /* @__PURE__ */ new Set(["incapacitate", "polymorph", "blind", "hex", "stasis"]);
  var FROZEN_CONTROL = /* @__PURE__ */ new Set(["root", "stun", "stasis", "incapacitate", "polymorph"]);
  function distance2(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function hpPct2(unit) {
    return unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
  }
  function manaPct2(unit) {
    return unit.maxMana > 0 ? Math.max(0, Math.min(1, unit.mana / unit.maxMana)) : 0;
  }
  function wait2(reason) {
    return { type: "wait", priority: 999, reason };
  }
  function cast2(abilityId, priority, reason, targetId, selectTargetId) {
    return { type: "cast", abilityId, targetId, selectTargetId, priority, reason };
  }
  function castAt2(abilityId, priority, reason, enemy) {
    return {
      type: "cast-at",
      abilityId,
      x: enemy.x,
      z: enemy.z,
      targetId: enemy.id,
      priority,
      reason
    };
  }
  function abilityReady2(observation, settings, abilityId) {
    const chargeBank = observation.player.abilityCharges?.[abilityId];
    return settings.frostAbilities[abilityId] && observation.knownAbilityIds.has(abilityId) && ((chargeBank?.charges ?? 0) > 0 || (observation.player.cooldowns[abilityId] ?? 0) <= 0);
  }
  function hasAura2(unit, idOrKind) {
    return unit.auras.some((aura) => aura.id === idOrKind || aura.kind === idOrKind);
  }
  function auraStacks(unit, idOrKind) {
    const aura = unit.auras.find((candidate) => candidate.id === idOrKind || candidate.kind === idOrKind);
    return aura ? Math.max(1, aura.stacks ?? 1) : 0;
  }
  function auraCharges(enemy, idOrKind) {
    const aura = enemy.auras.find((candidate) => candidate.id === idOrKind || candidate.kind === idOrKind);
    return aura ? Math.max(1, aura.charges ?? aura.stacks ?? 1) : 0;
  }
  function availableItem2(inventory, preference) {
    return preference.find((itemId) => (inventory[itemId] ?? 0) > 0) ?? null;
  }
  function assignedTank2(observation) {
    if (observation.assignedTankId !== null) {
      const assigned = observation.party.find((member) => member.id === observation.assignedTankId);
      if (assigned && !assigned.dead && assigned.connected) return assigned;
    }
    return observation.party.find((member) => member.role === "tank" && !member.dead && member.connected) ?? null;
  }
  function protectedControl(enemy) {
    return enemy.auras.some((aura) => BREAKABLE_CONTROL.has(aura.kind));
  }
  function selectedEnemy2(observation, settings, contextMode) {
    const valid = (enemy) => enemy && enemy.hostile && !enemy.dead && !protectedControl(enemy) && distance2(observation.player, enemy) <= Math.min(30, settings.targeting.maxTargetRange) ? enemy : null;
    const current = valid(observation.enemies.find((enemy) => enemy.id === observation.currentTargetId));
    const remembered = valid(observation.enemies.find((enemy) => enemy.id === observation.lastEnemyTargetId));
    if (settings.targeting.enemyMode === "current-target" && (current || remembered)) {
      return current ?? remembered;
    }
    const tank = assignedTank2(observation);
    if (settings.targeting.enemyMode === "tank-target" && tank) {
      const target = observation.enemies.find((enemy) => enemy.id === tank.targetId) ?? observation.enemies.find((enemy) => enemy.targetId === tank.id);
      const resolved = valid(target);
      if (resolved) return resolved;
    }
    if (settings.targeting.enemyMode === "assist-member-target") {
      const member = observation.party.find(
        (candidate) => candidate.id === settings.targeting.assistMemberId
      ) ?? tank;
      const resolved = valid(observation.enemies.find((enemy) => enemy.id === member?.targetId));
      if (resolved) return resolved;
    }
    const partyIds = new Set(observation.party.map((member) => member.id));
    const engaged = observation.enemies.filter((enemy) => valid(enemy) && enemy.inCombat && (contextMode === "solo" || !settings.targeting.partyOnly || enemy.targetId === null || partyIds.has(enemy.targetId)));
    const mayAcquire = contextMode === "solo" && settings.targeting.autoPull;
    const candidates = (mayAcquire ? observation.enemies.filter((enemy) => valid(enemy)) : engaged).sort((a, b) => distance2(observation.player, a) - distance2(observation.player, b) || a.id - b.id);
    if (settings.targeting.enemyMode === "lowest-hp") {
      return [...candidates].sort(
        (a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp) || a.id - b.id
      )[0] ?? current ?? remembered;
    }
    if (settings.targeting.enemyMode === "closest-engaged") {
      return [...engaged].sort(
        (a, b) => distance2(observation.player, a) - distance2(observation.player, b) || a.id - b.id
      )[0] ?? current ?? remembered;
    }
    return candidates[0] ?? current ?? remembered;
  }
  function frostCluster(observation, primary) {
    const eligible = observation.enemies.filter((enemy) => enemy.hostile && !enemy.dead && !protectedControl(enemy) && (enemy.inCombat || enemy.id === primary.id) && distance2(observation.player, enemy) <= 30);
    const primarySafe = !observation.enemies.some(
      (enemy) => !enemy.dead && protectedControl(enemy) && distance2(primary, enemy) <= 7
    );
    let best = { center: primary, count: 1, aoeSafe: primarySafe };
    for (const center of eligible) {
      const count = eligible.filter((enemy) => distance2(center, enemy) <= 7).length;
      const aoeSafe = !observation.enemies.some(
        (enemy) => !enemy.dead && protectedControl(enemy) && distance2(center, enemy) <= 7
      );
      if (!aoeSafe) continue;
      if (count > best.count || count === best.count && center.id === primary.id) {
        best = { center, count, aoeSafe };
      }
    }
    return best;
  }
  function durableTarget(observation, enemy, contextMode) {
    return enemy.maxHp >= observation.player.maxHp * 1.5 || (contextMode === "party" || contextMode === "raid") && enemy.maxHp >= observation.player.maxHp;
  }
  function mageFrozen(enemy, playerId) {
    return enemy.auras.some(
      (aura) => aura.sourceId === playerId && FROZEN_CONTROL.has(aura.kind)
    );
  }
  function resolveAssistProfile(observation, settings) {
    if (settings.assistProfile !== "auto") return settings.assistProfile;
    if (observation.pvp) return "chronomancy-healer";
    if (observation.talentSpec === "frost") return "frost-pve";
    if (observation.talentSpec === "arcane") return "chronomancy-healer";
    const frostKit = observation.knownAbilityIds.has("ice_lance") || observation.knownAbilityIds.has("flurry") || observation.knownAbilityIds.has("frozen_orb");
    return frostKit ? "frost-pve" : "chronomancy-healer";
  }
  function decideFrost(observation, settings) {
    const player = observation.player;
    if (observation.loading) return wait2("Waiting for a complete world snapshot.");
    if (player.dead) return wait2("Player is dead.");
    if (observation.cutscene) return wait2("Raid transition or cutscene is active.");
    if (observation.mounted) return wait2("Assist is paused while mounted.");
    if (observation.pvp) return wait2("Frost PvE is paused during active PvP.");
    const playerHealth = hpPct2(player);
    const currentMana = manaPct2(player);
    const gcdReady = player.gcdRemaining <= 0.05;
    const contextMode = resolveContextMode(observation, settings);
    const enemy = selectedEnemy2(observation, settings, contextMode);
    const durable = enemy ? durableTarget(observation, enemy, contextMode) : false;
    const conservingMana = currentMana < settings.frost.conserveManaPct;
    if (abilityReady2(observation, settings, "ice_block") && playerHealth <= settings.frost.iceBlockHpPct) {
      return cast2("ice_block", 1, "Use Cold Coffin during a critical Frost emergency.");
    }
    if (observation.controlled) return wait2("Player is crowd controlled.");
    if (observation.silenced) return wait2("Player is silenced.");
    if (observation.potionCooldownRemaining <= 0) {
      const healthPotion = availableItem2(observation.inventory, HEALTH_POTIONS2);
      if (settings.consumables.healthPotion && healthPotion && playerHealth <= settings.consumables.healthPotionHpPct) {
        return { type: "use-item", itemId: healthPotion, priority: 2, reason: "Use an emergency health potion." };
      }
      const manaPotion = availableItem2(observation.inventory, MANA_POTIONS2);
      if (settings.consumables.manaPotion && manaPotion && currentMana <= settings.consumables.manaPotionManaPct) {
        return { type: "use-item", itemId: manaPotion, priority: 3, reason: "Use a mana potion before the reserve is exhausted." };
      }
    }
    if (settings.modules.interrupts && !player.castingAbility && gcdReady && abilityReady2(observation, settings, "counterspell")) {
      const caster = observation.enemies.filter((candidate) => candidate.castingAbility && !candidate.dead && distance2(player, candidate) <= 30).sort((a, b) => distance2(player, a) - distance2(player, b) || a.id - b.id)[0];
      if (caster) return cast2("counterspell", 4, `Interrupt ${caster.name}.`, caster.id);
    }
    const frostveilActive = hasAura2(player, "ice_barrier") || hasAura2(player, "personal_barrier");
    if (settings.modules.defensives && abilityReady2(observation, settings, "ice_barrier") && !frostveilActive && (!player.inCombat && settings.safety.buffOutOfCombat || playerHealth <= settings.frost.barrierHpPct)) {
      return cast2("ice_barrier", 5, player.inCombat ? "Restore Frostveil under pressure." : "Prepare Frostveil before combat.");
    }
    if (player.castingAbility || player.channeling || !gcdReady) {
      return wait2(player.castingAbility ? `Casting ${player.castingAbility}.` : "Waiting for the global cooldown.");
    }
    if (!player.inCombat && settings.safety.buffOutOfCombat && observation.aetherInsightNeedsRefresh && abilityReady2(observation, settings, "arcane_intellect")) {
      return cast2("arcane_intellect", 6, "Maintain Aether Insight for the current group.");
    }
    if (!player.inCombat && settings.safety.buffOutOfCombat && !hasAura2(player, "frost_armor") && !hasAura2(player, "buff_armor") && abilityReady2(observation, settings, "frost_armor")) {
      return cast2("frost_armor", 7, "Maintain Hoarfrost Mantle before combat.");
    }
    if (!player.inCombat && !enemy && !observation.frostPetActive && currentMana > settings.frost.conserveManaPct && abilityReady2(observation, settings, "summon_water_elemental")) {
      return cast2("summon_water_elemental", 8, "Summon the Water Elemental between pulls.");
    }
    if (!player.inCombat && !enemy && currentMana <= settings.frost.aetherwellManaPct && abilityReady2(observation, settings, "evocation")) {
      return cast2("evocation", 9, "Channel Aetherwell safely between pulls.");
    }
    if (!enemy) return wait2("No valid PvE enemy is selected or engaged in range.");
    const cluster = frostCluster(observation, enemy);
    const fingers = auraStacks(player, "fingers_of_frost");
    const brainFreeze = hasAura2(player, "brain_freeze");
    const icicles = auraStacks(player, "icicles");
    const wintersChill = auraCharges(enemy, "winters_chill");
    const frozen = mageFrozen(enemy, player.id);
    const nearbyEnemies = observation.enemies.filter(
      (candidate) => !candidate.dead && !protectedControl(candidate) && distance2(player, candidate) <= 10
    );
    const frontalSafe = !observation.enemies.some(
      (candidate) => !candidate.dead && protectedControl(candidate) && distance2(player, candidate) <= 16
    );
    const fullFront = !conservingMana && abilityReady2(observation, settings, "glacial_front") && cluster.aoeSafe && frontalSafe && distance2(player, enemy) <= 16 && (durable || cluster.count >= settings.frost.glacialFrontEnemyCount);
    if (currentMana <= settings.frost.stopDamageManaPct) {
      return wait2("Frost damage is paused at the configured emergency mana floor.");
    }
    if (durable && !conservingMana && abilityReady2(observation, settings, "rune_of_power") && !hasAura2(player, "rune_of_power")) {
      return cast2("rune_of_power", 10, "Place Rune of Power for the durable-target burst window.", void 0, enemy.id);
    }
    if (abilityReady2(observation, settings, "icy_veins") && player.inCombat && (!settings.frost.icyVeinsDurableOnly || durable)) {
      return cast2("icy_veins", 11, "Open the durable Frost burst window with Icy Veins.", void 0, enemy.id);
    }
    if (settings.frost.smartProcs && fingers > 0 && abilityReady2(observation, settings, "ice_lance")) {
      return cast2("ice_lance", 12, `Spend Fingers of Frost before it overcaps (${fingers} banked).`, enemy.id);
    }
    if (settings.frost.smartProcs && brainFreeze && abilityReady2(observation, settings, "flurry")) {
      return cast2("flurry", 13, "Spend Brain Freeze on instant Winterlash.", enemy.id);
    }
    if (settings.frost.smartProcs && wintersChill > 0 && abilityReady2(observation, settings, "ice_lance")) {
      return cast2("ice_lance", 14, `Spend Winter's Chill with Ice Lance (${wintersChill} left).`, enemy.id);
    }
    if (settings.frost.smartProcs && frozen && abilityReady2(observation, settings, "ice_lance")) {
      return cast2("ice_lance", 15, "Shatter the mage-frozen target with Ice Lance.", enemy.id);
    }
    if (icicles >= 5 && abilityReady2(observation, settings, "glacial_spike")) {
      if (settings.frost.smartGlacialBurst && abilityReady2(observation, settings, "power_echo") && !hasAura2(player, "power_echo")) {
        return cast2("power_echo", 16, "Prepare Power Echo for the five-Icicle Glacial Spike.", void 0, enemy.id);
      }
      if (settings.frost.smartGlacialBurst && durable && abilityReady2(observation, settings, "presence_of_mind") && !hasAura2(player, "next_cast_instant") && !hasAura2(player, "presence_of_mind")) {
        return cast2("presence_of_mind", 17, "Make the five-Icicle Glacial Spike instant.", void 0, enemy.id);
      }
      return cast2("glacial_spike", 18, "Spend five Icicles before another generator can overcap them.", enemy.id);
    }
    if (abilityReady2(observation, settings, "frozen_orb") && (durable || !conservingMana && cluster.count >= settings.frost.frozenOrbEnemyCount) && cluster.aoeSafe) {
      return cast2("frozen_orb", 20, durable ? "Release Frozen Orb into the durable target." : `Release Frozen Orb into ${cluster.count} clustered enemies.`, void 0, enemy.id);
    }
    if (!conservingMana && cluster.aoeSafe && cluster.count >= settings.frost.blizzardEnemyCount && abilityReady2(observation, settings, "blizzard")) {
      return castAt2("blizzard", 21, `Place Blizzard under ${cluster.count} clustered enemies.`, cluster.center);
    }
    if (fullFront && settings.frost.useIcebindPve && nearbyEnemies.length >= 2 && !frozen && abilityReady2(observation, settings, "frost_nova")) {
      return cast2("frost_nova", 22, "Freeze the nearby pack before the full Glacial Front.", void 0, enemy.id);
    }
    if (fullFront) {
      return cast2("glacial_front", 23, "Hold Glacial Front through its automatic stage-IV release.", void 0, enemy.id);
    }
    if (nearbyEnemies.length >= settings.frost.blizzardEnemyCount && frontalSafe && abilityReady2(observation, settings, "cone_of_cold")) {
      return cast2("cone_of_cold", 24, `Hit ${nearbyEnemies.length} nearby enemies with Frostsweep.`, void 0, enemy.id);
    }
    if (settings.frost.smartProcs && abilityReady2(observation, settings, "flurry")) {
      return cast2("flurry", 25, "Plant Winter's Chill with Winterlash.", enemy.id);
    }
    if (abilityReady2(observation, settings, "frostbolt")) {
      return cast2("frostbolt", 26, conservingMana ? "Use Rimelance as the efficient proc and Icicle generator." : "Build Frost procs and Icicles with Rimelance.", enemy.id);
    }
    if (abilityReady2(observation, settings, "ice_lance")) {
      return cast2("ice_lance", 27, "Use Ice Lance while the main Frost builder is unavailable.", enemy.id);
    }
    return wait2("No enabled Frost PvE ability is ready.");
  }

  // src/woc-adapter.ts
  var CROWD_CONTROL = /* @__PURE__ */ new Set(["stun", "stasis", "incapacitate", "polymorph", "blind", "hex"]);
  function auras(source) {
    return (source ?? []).flatMap((aura) => {
      if (typeof aura.id !== "string" || typeof aura.kind !== "string") return [];
      return [{
        id: aura.id,
        kind: aura.kind,
        remaining: typeof aura.remaining === "number" ? aura.remaining : 0,
        ...typeof aura.stacks === "number" ? { stacks: aura.stacks } : {},
        ...typeof aura.charges === "number" ? { charges: aura.charges } : {},
        ...typeof aura.sourceId === "number" ? { sourceId: aura.sourceId } : {},
        ...typeof aura.echoGroup === "boolean" ? { echoGroup: aura.echoGroup } : {}
      }];
    });
  }
  function selfUnit(world) {
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
      auras: auras(player.auras)
    };
  }
  function party(world, self) {
    const rows = world.partyInfo?.members ?? [];
    const members = rows.filter((member) => member.pid !== self.id).map((member) => ({
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
      auras: auras(member.auras)
    }));
    members.unshift(self);
    return members;
  }
  function activePvpState(world) {
    const cupMatch = world.cupInfo?.match;
    const activeCup = typeof cupMatch === "object" && cupMatch !== null && (cupMatch.state === "active" || cupMatch.phase === "active");
    return world.duelInfo?.state === "active" || world.arenaInfo?.match?.state === "active" || activeCup || world.bgInfo?.match?.state === "active";
  }
  function activePvpOpponentIds(world) {
    const ids = /* @__PURE__ */ new Set();
    const selfId = world.playerId;
    if (world.duelInfo?.state === "active" && typeof world.duelInfo.otherPid === "number") {
      if (world.duelInfo.otherPid !== selfId) ids.add(world.duelInfo.otherPid);
    }
    const match = world.arenaInfo?.match;
    if (match?.state === "active") {
      if (typeof match.oppPid === "number" && match.oppPid !== selfId) ids.add(match.oppPid);
      for (const enemy of match.enemies ?? []) {
        if (typeof enemy.pid === "number" && enemy.pid !== selfId) ids.add(enemy.pid);
      }
    }
    const battleground = world.bgInfo?.match;
    if (battleground?.state === "active") {
      const myTeam = typeof battleground.myTeam === "number" ? battleground.myTeam : battleground.players?.find((player) => player.pid === selfId)?.team;
      if (typeof myTeam === "number") {
        for (const player of battleground.players ?? []) {
          if (typeof player.pid === "number" && player.pid !== selfId && typeof player.team === "number" && player.team !== myTeam) {
            ids.add(player.pid);
          }
        }
      }
    }
    return ids;
  }
  function observeWocWorld(world, settings, memory, now) {
    const self = selfUnit(world);
    const group = party(world, self);
    const assignedTankId = settings.targeting.assignedTankId ?? group.find((member) => member.role === "tank" && !member.dead)?.id ?? null;
    const pvpOpponentIds = activePvpOpponentIds(world);
    const enemies = [...world.entities.values()].filter(
      (entity) => entity.kind !== "object" && (entity.hostile || pvpOpponentIds.has(entity.id) || pvpOpponentIds.has(entity.ownerId ?? -1))
    ).map((entity) => ({
      id: entity.id,
      name: entity.name,
      hp: entity.hp,
      maxHp: entity.maxHp,
      x: entity.pos.x,
      z: entity.pos.z,
      dead: entity.dead,
      hostile: entity.hostile || pvpOpponentIds.has(entity.id) || pvpOpponentIds.has(entity.ownerId ?? -1),
      inCombat: entity.inCombat,
      targetId: entity.aggroTargetId ?? entity.targetId,
      castingAbility: entity.castingAbility,
      crowdControlled: entity.auras.some(
        (aura) => typeof aura.kind === "string" ? CROWD_CONTROL.has(aura.kind) : false
      ),
      auras: auras(entity.auras)
    }));
    const selectedEnemy3 = enemies.find(
      (enemy) => enemy.id === world.player.targetId && !enemy.dead && enemy.hostile
    );
    if (selectedEnemy3) memory.lastEnemyTargetId = selectedEnemy3.id;
    const playerAuras = auras(world.player.auras);
    const partyRosterKey = group.map((member) => member.id).sort((a, b) => a - b).join(",");
    const insightAura = playerAuras.find(
      (aura) => aura.id === "arcane_intellect" || aura.kind === "buff_int_pct"
    );
    if (insightAura && memory.aetherInsightRosterKey === null) {
      memory.aetherInsightRosterKey = partyRosterKey;
    }
    const visibleIndividualEcho = group.flatMap(
      (member) => member.auras.filter(
        (aura) => aura.kind === "temporal_echo" && aura.echoGroup !== true && (aura.sourceId === self.id || // Some party snapshots omit sourceId. Only accept that aura when
        // it confirms the target already remembered from our own cast;
        // this avoids stealing another Chronomancer's Echo identity.
        aura.sourceId === void 0 && member.id === memory.individualEchoTargetId)
      ).map((aura) => ({ targetId: member.id, remaining: aura.remaining }))
    )[0];
    if (visibleIndividualEcho) {
      memory.individualEchoTargetId = visibleIndividualEcho.targetId;
      memory.individualEchoExpiresAt = now + Math.max(0, visibleIndividualEcho.remaining) * 1e3;
    }
    const rememberedIndividualEcho = memory.individualEchoTargetId !== null && memory.individualEchoExpiresAt > now ? {
      targetId: memory.individualEchoTargetId,
      remaining: (memory.individualEchoExpiresAt - now) / 1e3
    } : null;
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
              recharge: Math.max(0, Number(bank.recharge) || 0)
            }
          ])
        )
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
      frostPetActive: [...world.entities.values()].some(
        (entity) => entity.id !== self.id && entity.ownerId === self.id && !entity.dead && entity.kind !== "object"
      ),
      inventory: Object.fromEntries(world.inventory.map((slot) => [slot.itemId, slot.count])),
      potionCooldownRemaining: world.player.potionCdRemaining ?? 0,
      partyRosterKey,
      aetherInsightNeedsRefresh: !insightAura || insightAura.remaining < 60 || memory.aetherInsightRosterKey !== partyRosterKey,
      raid: world.partyInfo?.raid ?? false,
      // Nythraxis' phase transition is a real 21.5-second server stun, not merely
      // dialogue. Pause before selecting or submitting any cast so the controller
      // cannot flicker targets or queue retries during the scene.
      cutscene: playerAuras.some((aura) => aura.id === "nythraxis_transition_stun"),
      loading: world.playerId < 0 || world.player.id < 0,
      mounted: playerAuras.some((aura) => aura.kind === "form_travel"),
      controlled: playerAuras.some((aura) => CROWD_CONTROL.has(aura.kind)),
      rooted: playerAuras.some((aura) => aura.kind === "root"),
      silenced: playerAuras.some((aura) => aura.kind === "silence" || aura.kind === "lockout"),
      pvp: activePvpState(world)
    };
  }

  // src/controller.ts
  var WAITING = { type: "wait", priority: 999, reason: "Assist is paused." };
  var ChronoPilotController = class {
    constructor(world, options = {}) {
      this.world = world;
      this.options = options;
      this.settings = options.settings ?? copyDefaultSettings();
    }
    world;
    options;
    settings;
    active = false;
    pausedUntil = 0;
    nextDecisionAt = 0;
    pendingUntil = 0;
    detectedMode = "solo";
    detectedProfile = "chronomancy-healer";
    decision = WAITING;
    memory = {
      individualEchoTargetId: null,
      individualEchoExpiresAt: 0,
      aetherInsightRosterKey: null,
      lastEnemyTargetId: null
    };
    get status() {
      return {
        active: this.active,
        pausedUntil: this.pausedUntil,
        detectedMode: this.detectedMode,
        detectedProfile: this.detectedProfile,
        decision: this.decision
      };
    }
    partyMembers() {
      return (this.world.partyInfo?.members ?? []).map((member) => ({
        id: member.pid,
        name: member.name,
        role: member.role
      }));
    }
    start() {
      this.active = true;
      this.nextDecisionAt = 0;
      this.emitStatus();
    }
    stop(reason = "Assist is paused.") {
      this.active = false;
      this.decision = { type: "wait", priority: 999, reason };
      this.emitStatus();
    }
    toggle() {
      if (this.active) this.stop();
      else this.start();
    }
    notifyManualAbilityInput(now = performance.now()) {
      this.pausedUntil = now + this.settings.safety.manualOverrideMs;
      this.decision = { type: "wait", priority: 999, reason: "Manual input override is active." };
      this.emitStatus();
    }
    tick(now = performance.now()) {
      if (!this.active) return this.decision;
      if (now < this.pausedUntil) return this.decision;
      if (now < this.nextDecisionAt || now < this.pendingUntil) return this.decision;
      this.nextDecisionAt = now + this.settings.safety.decisionIntervalMs;
      const observation = observeWocWorld(this.world, this.settings, this.memory, now);
      this.detectedProfile = resolveAssistProfile(observation, this.settings);
      const next = this.detectedProfile === "frost-pve" ? decideFrost(observation, this.settings) : decideChronomancy(observation, this.settings);
      this.detectedMode = resolveContextMode(observation, this.settings);
      this.decision = next;
      try {
        if (next.type === "cast") {
          const visibleTargetId = next.selectTargetId ?? next.targetId;
          const visibleTarget = visibleTargetId === void 0 ? null : observation.party.find((member) => member.id === visibleTargetId) ?? observation.enemies.find((enemy) => enemy.id === visibleTargetId) ?? null;
          const showActionSelection = this.settings.targeting.streamTargetSelection && visibleTarget !== null && this.world.player.targetId !== visibleTarget.id;
          if (showActionSelection) this.world.targetEntity(visibleTarget.id);
          if (next.targetId === void 0) this.world.castAbility(next.abilityId);
          else this.world.castAbilityOn(next.abilityId, next.targetId);
          if (next.abilityId === "temporal_echo" && next.targetId !== void 0) {
            this.memory.individualEchoTargetId = next.targetId;
            this.memory.individualEchoExpiresAt = now + 15e3;
          }
          if (next.abilityId === "arcane_intellect") {
            this.memory.aetherInsightRosterKey = observation.partyRosterKey;
          }
          this.pendingUntil = now + 350;
        } else if (next.type === "cast-at") {
          const visibleTarget = next.targetId === void 0 ? null : observation.party.find((member) => member.id === next.targetId) ?? observation.enemies.find((enemy) => enemy.id === next.targetId) ?? null;
          if (this.settings.targeting.streamTargetSelection && visibleTarget && this.world.player.targetId !== visibleTarget.id) {
            this.world.targetEntity(visibleTarget.id);
          }
          this.world.castAbilityAt(next.abilityId, { x: next.x, z: next.z });
          this.pendingUntil = now + 350;
        } else if (next.type === "target") {
          this.world.targetEntity(next.targetId);
          this.pendingUntil = now + 200;
        } else if (next.type === "use-item") {
          this.world.useItem(next.itemId);
          this.pendingUntil = now + 350;
        }
      } catch {
        this.decision = {
          type: "wait",
          priority: 999,
          reason: "The action was interrupted or refused. It will retry when ready."
        };
        this.pendingUntil = now + 500;
      }
      this.emitStatus();
      return this.decision;
    }
    emitStatus() {
      this.options.onStatus?.(this.status);
    }
  };

  // src/settings-store.ts
  var STORAGE_KEY = "chronopilot.settings.v1";
  function mergeSettings(saved) {
    const defaults = copyDefaultSettings();
    const legacySettings = (saved.settingsVersion ?? 0) < defaults.settingsVersion;
    const predatesOneSecondEchoRefresh = (saved.settingsVersion ?? 0) < 8;
    const predatesAggressivePvpPreset = (saved.settingsVersion ?? 0) < 11;
    const predatesAetherInsight = saved.abilities?.arcane_intellect === void 0;
    const legacyMode = saved.mode;
    const mode = legacyMode === "questing-hybrid" ? "solo" : legacyMode === "group-healer" ? "auto" : saved.mode;
    const resurrectionEnabled = typeof saved.modules?.resurrection === "boolean" ? saved.modules.resurrection : Boolean(
      saved.abilities?.temporal_reversal || saved.abilities?.collective_reversal
    );
    const pvpEnabled = saved.pvp?.enabled ?? (saved.safety?.disableInPvp === false ? true : defaults.pvp.enabled);
    const savedAssistProfile = saved.assistProfile;
    const assistProfile = savedAssistProfile === "chronomancy-healer" || savedAssistProfile === "frost-pve" ? savedAssistProfile : "auto";
    return {
      ...defaults,
      settingsVersion: defaults.settingsVersion,
      assistProfile,
      mode: mode ?? defaults.mode,
      modules: { ...defaults.modules, ...saved.modules, resurrection: resurrectionEnabled },
      abilities: {
        ...defaults.abilities,
        ...saved.abilities,
        temporal_reversal: resurrectionEnabled,
        collective_reversal: resurrectionEnabled,
        perfect_moment: legacySettings ? false : saved.abilities?.perfect_moment ?? defaults.abilities.perfect_moment
      },
      frostAbilities: { ...defaults.frostAbilities, ...saved.frostAbilities },
      profiles: {
        solo: { ...defaults.profiles.solo, ...saved.profiles?.solo },
        party: { ...defaults.profiles.party, ...saved.profiles?.party },
        raid: { ...defaults.profiles.raid, ...saved.profiles?.raid },
        pvp: {
          ...defaults.profiles.pvp,
          ...saved.profiles?.pvp,
          ...predatesAggressivePvpPreset ? {
            mendHpPct: 0.72,
            barrierHpPct: 0.88,
            emergencyHpPct: 0.52,
            conserveManaPct: 0,
            stopDamageManaPct: 0
          } : {}
        }
      },
      frost: { ...defaults.frost, ...saved.frost },
      thresholds: {
        ...defaults.thresholds,
        ...saved.thresholds,
        ...predatesOneSecondEchoRefresh ? { echoRefreshSeconds: 1 } : {},
        smartPerfectMoment: legacySettings ? false : saved.thresholds?.smartPerfectMoment ?? defaults.thresholds.smartPerfectMoment
      },
      targeting: { ...defaults.targeting, ...saved.targeting },
      consumables: { ...defaults.consumables, ...saved.consumables },
      pvp: {
        ...defaults.pvp,
        ...saved.pvp,
        enabled: pvpEnabled,
        ...predatesAggressivePvpPreset ? {
          minSurgeCharges: 1,
          maxSurgeCharges: 4,
          iceBlockHpPct: 0.45,
          hourglassHpPct: 0.4
        } : {}
      },
      safety: {
        ...defaults.safety,
        ...saved.safety,
        disableInPvp: !pvpEnabled,
        ...predatesAetherInsight ? { buffOutOfCombat: true } : {}
      }
    };
  }
  function loadSettings(storage = localStorage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return copyDefaultSettings();
      const parsed = JSON.parse(raw);
      return mergeSettings(parsed);
    } catch {
      return copyDefaultSettings();
    }
  }
  function saveSettings(settings, storage = localStorage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
    }
  }

  // src/panel.ts
  var STYLE_ID = "chronopilot-style";
  var FROST_ABILITIES = [
    ["arcane_intellect", "Aether Insight"],
    ["frost_armor", "Hoarfrost Mantle"],
    ["frostbolt", "Rimelance"],
    ["ice_lance", "Ice Lance"],
    ["flurry", "Winterlash"],
    ["frozen_orb", "Frozen Orb"],
    ["blizzard", "Blizzard"],
    ["glacial_spike", "Glacial Spike"],
    ["glacial_front", "Glacial Front"],
    ["ice_barrier", "Frostveil"],
    ["icy_veins", "Icy Veins"],
    ["summon_water_elemental", "Water Elemental"],
    ["cone_of_cold", "Frostsweep"],
    ["presence_of_mind", "Racing Mind"],
    ["rune_of_power", "Rune of Power"],
    ["counterspell", "Spellbreak"],
    ["ice_block", "Cold Coffin"],
    ["evocation", "Aetherwell"],
    ["frost_nova", "Icebind"]
  ];
  var CHRONO_ABILITIES = [
    ["arcane_intellect", "Aether Insight"],
    ["ice_floes", "Ice Floes"],
    ["cold_snap", "Winter's Recall"],
    ["greater_invisibility", "Greater Invisibility"],
    ["rings_of_frost", "Ring of Frost"],
    ["temporal_echo", "Temporal Echo"],
    ["temporal_mend", "Temporal Mend"],
    ["temporal_barrier", "Temporal Barrier"],
    ["temporal_cascade", "Temporal Cascade"],
    ["temporal_rewind", "Rewind"],
    ["mass_barrier", "Mass Barrier"],
    ["power_echo", "Power Echo"],
    ["arcane_surge", "Aether Surge"],
    ["arcane_missiles", "Aether Darts"],
    ["arcane_explosion", "Aetherburst"],
    ["evocation", "Aetherwell"],
    ["perfect_moment", "Perfect Moment"],
    ["counterspell", "Spellbreak"],
    ["ice_block", "Cold Coffin"],
    ["blink", "Flickerstep"],
    ["frost_nova", "Icebind"],
    ["polymorph", "Bewitch"],
    ["temporal_hourglass", "Hourglass of Suspension"],
    ["temporal_acceleration", "Temporal Acceleration"],
    ["temporal_reversal", "Temporal Reversal"],
    ["collective_reversal", "Collective Reversal"]
  ];
  var ABILITY_LABELS = new Map([
    ...CHRONO_ABILITIES,
    ...FROST_ABILITIES
  ]);
  var MODULES = [
    ["healing", "Healing"],
    ["damageToHeal", "Damage to heal"],
    ["defensives", "Defensives"],
    ["interrupts", "Interrupts"],
    ["resurrection", "Resurrection"]
  ];
  var CONTEXTS = [
    ["solo", "Solo Questing", 1],
    ["party", "Party", 5],
    ["raid", "Raid", 10],
    ["pvp", "PvP / Arena", 5]
  ];
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    #chronopilot-panel{position:fixed;top:90px;right:24px;width:min(360px,calc(100vw - 24px));z-index:40000;color:#eee;background:rgba(16,18,28,.96);border:1px solid rgba(171,139,255,.45);border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,.42);font:13px/1.35 system-ui,sans-serif;user-select:none}
    #chronopilot-panel *{box-sizing:border-box}
    #chronopilot-panel button,#chronopilot-panel select,#chronopilot-panel input{font:inherit}
    #chronopilot-panel .cp-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;cursor:move;border-bottom:1px solid rgba(255,255,255,.1)}
    #chronopilot-panel .cp-brand{font-weight:700;color:#d8c8ff}
    #chronopilot-panel .cp-status{display:flex;align-items:center;gap:7px;color:#aaa}
    #chronopilot-panel .cp-dot{width:8px;height:8px;border-radius:50%;background:#777}
    #chronopilot-panel[data-active="true"] .cp-dot{background:#7fe3b0;box-shadow:0 0 10px rgba(127,227,176,.65)}
    #chronopilot-panel .cp-body{padding:10px 12px;max-height:min(72vh,680px);overflow:auto}
    #chronopilot-panel .cp-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    #chronopilot-panel button{border:1px solid rgba(255,255,255,.16);border-radius:6px;background:#262a3b;color:#eee;padding:6px 9px;cursor:pointer}
    #chronopilot-panel button:hover{background:#30364d}
    #chronopilot-panel button[data-selected="true"],#chronopilot-panel .cp-start{background:#7558c9;border-color:#9d80ef}
    #chronopilot-panel .cp-stop{background:#67343e;border-color:#9b5360}
    #chronopilot-panel .cp-view[hidden]{display:none}
    #chronopilot-panel fieldset{margin:0 0 10px;padding:9px;border:1px solid rgba(255,255,255,.12);border-radius:7px}
    #chronopilot-panel legend{padding:0 5px;color:#c9b8f2}
    #chronopilot-panel label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0}
    #chronopilot-panel input[type="range"]{width:150px;accent-color:#9d80ef}
    #chronopilot-panel input[type="checkbox"]{accent-color:#9d80ef}
    #chronopilot-panel select{max-width:180px;background:#202435;color:#eee;border:1px solid rgba(255,255,255,.18);border-radius:5px;padding:5px}
    #chronopilot-panel .cp-decision{padding:9px;border-radius:7px;background:rgba(117,88,201,.18);border:1px solid rgba(157,128,239,.28)}
    #chronopilot-panel .cp-action{font-weight:700;color:#e1d7ff}
    #chronopilot-panel .cp-reason{color:#b9bac5;margin-top:3px}
    #chronopilot-panel .cp-actions{display:flex;gap:8px;justify-content:space-between;margin-top:10px}
    #chronopilot-panel .cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px}
    #chronopilot-panel .cp-small{font-size:12px;color:#999}
  `;
    document.head.append(style);
  }
  function checkbox(label, checked, onChange) {
    const row = document.createElement("label");
    const text = document.createElement("span");
    text.textContent = label;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", () => onChange(input.checked));
    row.append(text, input);
    return row;
  }
  function range(label, value, min, max, format, onChange) {
    const row = document.createElement("label");
    const text = document.createElement("span");
    const output = document.createElement("span");
    output.textContent = `${label}: ${format(value)}`;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.addEventListener("input", () => {
      const next = Number(input.value);
      output.textContent = `${label}: ${format(next)}`;
      onChange(next);
    });
    text.append(output);
    row.append(text, input);
    return row;
  }
  function mountChronoPilotPanel(controller) {
    injectStyle();
    const root = document.createElement("section");
    root.id = "chronopilot-panel";
    root.dataset.active = "false";
    root.innerHTML = `
    <header class="cp-head"><div><div class="cp-brand">ChronoPilot</div><div class="cp-small">Mage assist</div></div><div class="cp-status"><span class="cp-dot"></span><span class="cp-state">Paused</span></div></header>
    <div class="cp-body"><nav class="cp-tabs"></nav><div class="cp-views"></div><div class="cp-decision"><div class="cp-small">Last decision</div><div class="cp-action">Waiting</div><div class="cp-reason">Start Assist when you are ready.</div></div><div class="cp-actions"><button class="cp-pause">Emergency pause</button><button class="cp-toggle cp-start">Start assist</button></div></div>
  `;
    document.body.append(root);
    const tabs = root.querySelector(".cp-tabs");
    const views = root.querySelector(".cp-views");
    const persist = () => saveSettings(controller.settings);
    const sections = [];
    const overview = document.createElement("div");
    const rotationField = document.createElement("fieldset");
    rotationField.innerHTML = "<legend>Rotation</legend>";
    const rotationRow = document.createElement("label");
    rotationRow.innerHTML = "<span>Combat profile</span>";
    const rotationSelect = document.createElement("select");
    for (const [value, label] of [
      ["auto", "Auto-detect talents"],
      ["chronomancy-healer", "Chronomancy healer"],
      ["frost-pve", "Frost PvE DPS"]
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = controller.settings.assistProfile === value;
      rotationSelect.append(option);
    }
    rotationSelect.addEventListener("change", () => {
      controller.settings.assistProfile = rotationSelect.value;
      persist();
    });
    rotationRow.append(rotationSelect);
    const rotationNote = document.createElement("p");
    rotationNote.className = "cp-small";
    rotationNote.textContent = "Frost has independent PvE DPS rules and ignores the saved Chronomancy healing thresholds.";
    rotationField.append(rotationRow, rotationNote);
    const profileField = document.createElement("fieldset");
    profileField.innerHTML = "<legend>Group context</legend>";
    const profileRow = document.createElement("label");
    profileRow.innerHTML = "<span>Context</span>";
    const profileSelect = document.createElement("select");
    for (const [value, label] of [
      ["auto", "Auto-detect"],
      ["solo", "Solo Questing"],
      ["party", "Party"],
      ["raid", "Raid"],
      ["pvp", "PvP / Arena"]
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = controller.settings.mode === value;
      profileSelect.append(option);
    }
    profileSelect.addEventListener("change", () => {
      controller.settings.mode = profileSelect.value;
      persist();
    });
    profileRow.append(profileSelect);
    const profileNote = document.createElement("p");
    profileNote.className = "cp-small";
    profileNote.textContent = "Auto-detect chooses Solo, Party, Raid, or active PvP context rules.";
    profileField.append(profileRow, profileNote);
    const moduleField = document.createElement("fieldset");
    moduleField.innerHTML = "<legend>Modules</legend>";
    for (const [key, label] of MODULES) {
      moduleField.append(checkbox(label, controller.settings.modules[key], (value) => {
        controller.settings.modules[key] = value;
        if (key === "resurrection") {
          controller.settings.abilities.temporal_reversal = value;
          controller.settings.abilities.collective_reversal = value;
        }
        persist();
      }));
    }
    overview.append(rotationField, profileField, moduleField);
    sections.push(["overview", "Overview", overview]);
    const frost = document.createElement("div");
    const frostField = document.createElement("fieldset");
    frostField.innerHTML = "<legend>Frost PvE</legend>";
    const percent = (value) => `${value}%`;
    frostField.append(
      checkbox("Smart Frost procs", controller.settings.frost.smartProcs, (value) => {
        controller.settings.frost.smartProcs = value;
        persist();
      }),
      checkbox("Smart Glacial burst", controller.settings.frost.smartGlacialBurst, (value) => {
        controller.settings.frost.smartGlacialBurst = value;
        persist();
      }),
      checkbox("Icy Veins on durable targets", controller.settings.frost.icyVeinsDurableOnly, (value) => {
        controller.settings.frost.icyVeinsDurableOnly = value;
        persist();
      }),
      checkbox("Icebind PvE packs", controller.settings.frost.useIcebindPve, (value) => {
        controller.settings.frost.useIcebindPve = value;
        persist();
      }),
      range("Frozen Orb enemies", controller.settings.frost.frozenOrbEnemyCount, 2, 8, String, (value) => {
        controller.settings.frost.frozenOrbEnemyCount = value;
        persist();
      }),
      range("Blizzard enemies", controller.settings.frost.blizzardEnemyCount, 2, 8, String, (value) => {
        controller.settings.frost.blizzardEnemyCount = value;
        persist();
      }),
      range("Glacial Front enemies", controller.settings.frost.glacialFrontEnemyCount, 2, 8, String, (value) => {
        controller.settings.frost.glacialFrontEnemyCount = value;
        persist();
      }),
      range("Conserve Frost mana", controller.settings.frost.conserveManaPct * 100, 0, 80, percent, (value) => {
        controller.settings.frost.conserveManaPct = value / 100;
        persist();
      }),
      range("Stop Frost damage", controller.settings.frost.stopDamageManaPct * 100, 0, 50, percent, (value) => {
        controller.settings.frost.stopDamageManaPct = value / 100;
        persist();
      }),
      range("Frost Aetherwell", controller.settings.frost.aetherwellManaPct * 100, 5, 80, percent, (value) => {
        controller.settings.frost.aetherwellManaPct = value / 100;
        persist();
      }),
      range("Frostveil below", controller.settings.frost.barrierHpPct * 100, 20, 100, percent, (value) => {
        controller.settings.frost.barrierHpPct = value / 100;
        persist();
      }),
      range("Cold Coffin below", controller.settings.frost.iceBlockHpPct * 100, 10, 60, percent, (value) => {
        controller.settings.frost.iceBlockHpPct = value / 100;
        persist();
      })
    );
    const frostNote = document.createElement("p");
    frostNote.className = "cp-small";
    frostNote.textContent = "Blizzard is placed at the densest safe cluster. Glacial Front is held to its automatic full release; movement and facing remain manual.";
    frostField.append(frostNote);
    frost.append(frostField);
    sections.push(["frost", "Frost PvE", frost]);
    const healing = document.createElement("div");
    const editorField = document.createElement("fieldset");
    editorField.innerHTML = "<legend>Preset editor</legend>";
    const editorRow = document.createElement("label");
    editorRow.innerHTML = "<span>Edit rules for</span>";
    const editorSelect = document.createElement("select");
    for (const [value, label] of CONTEXTS) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      editorSelect.append(option);
    }
    editorRow.append(editorSelect);
    editorField.append(editorRow);
    healing.append(editorField);
    const profileFields = /* @__PURE__ */ new Map();
    for (const [context, label, maxAllies] of CONTEXTS) {
      const profile = controller.settings.profiles[context];
      const field = document.createElement("fieldset");
      field.innerHTML = `<legend>${label} rules</legend>`;
      field.hidden = context !== "solo";
      field.append(
        range("Temporal Mend", profile.mendHpPct * 100, 30, 95, percent, (value) => {
          profile.mendHpPct = value / 100;
          persist();
        }),
        range("Temporal Barrier", profile.barrierHpPct * 100, 30, 100, percent, (value) => {
          profile.barrierHpPct = value / 100;
          persist();
        }),
        range("Emergency heal", profile.emergencyHpPct * 100, 15, 80, percent, (value) => {
          profile.emergencyHpPct = value / 100;
          persist();
        }),
        range("Cascade below", profile.cascadeHpPct * 100, 50, 100, percent, (value) => {
          profile.cascadeHpPct = value / 100;
          persist();
        }),
        range("Cascade ally count", profile.cascadeCount, 1, maxAllies, String, (value) => {
          profile.cascadeCount = value;
          persist();
        }),
        range("Mass Barrier below", profile.massBarrierHpPct * 100, 40, 95, percent, (value) => {
          profile.massBarrierHpPct = value / 100;
          persist();
        }),
        range("Mass Barrier ally count", profile.massBarrierCount, 1, maxAllies, String, (value) => {
          profile.massBarrierCount = value;
          persist();
        }),
        range("Rewind recent loss", profile.rewindLossPct * 100, 5, 60, percent, (value) => {
          profile.rewindLossPct = value / 100;
          persist();
        }),
        range("Rewind ally count", profile.rewindCount, 1, maxAllies, String, (value) => {
          profile.rewindCount = value;
          persist();
        }),
        range("Conserve mana below", profile.conserveManaPct * 100, 0, 80, percent, (value) => {
          profile.conserveManaPct = value / 100;
          persist();
        }),
        range("Stop damage below", profile.stopDamageManaPct * 100, 0, 60, percent, (value) => {
          profile.stopDamageManaPct = value / 100;
          persist();
        })
      );
      profileFields.set(context, field);
      healing.append(field);
    }
    editorSelect.addEventListener("change", () => {
      for (const [context, field] of profileFields) field.hidden = editorSelect.value !== context;
    });
    const manaField = document.createElement("fieldset");
    manaField.innerHTML = "<legend>Shared mana and damage rules</legend>";
    manaField.append(
      range("Aetherwell mana", controller.settings.thresholds.aetherwellManaPct * 100, 10, 70, percent, (value) => {
        controller.settings.thresholds.aetherwellManaPct = value / 100;
        persist();
      }),
      checkbox("Smart Power Echo rescue", controller.settings.thresholds.smartPowerEcho, (value) => {
        controller.settings.thresholds.smartPowerEcho = value;
        persist();
      }),
      checkbox("Smart Perfect Moment healing", controller.settings.thresholds.smartPerfectMoment, (value) => {
        controller.settings.thresholds.smartPerfectMoment = value;
        persist();
      }),
      checkbox("Smart Surge charges", controller.settings.thresholds.smartSurgeCharges, (value) => {
        controller.settings.thresholds.smartSurgeCharges = value;
        persist();
      }),
      range("Maximum Surge charges", controller.settings.thresholds.maxSurgeCharges, 1, 4, (value) => String(value), (value) => {
        controller.settings.thresholds.maxSurgeCharges = value;
        persist();
      }),
      range("Minimum Surge charges", controller.settings.thresholds.lowManaMaxSurgeCharges, 1, 4, (value) => String(value), (value) => {
        controller.settings.thresholds.lowManaMaxSurgeCharges = value;
        persist();
      }),
      range("Aetherburst enemies", controller.settings.thresholds.aoeEnemyCount, 2, 6, (value) => String(value), (value) => {
        controller.settings.thresholds.aoeEnemyCount = value;
        persist();
      })
    );
    const manaNote = document.createElement("p");
    manaNote.className = "cp-small";
    manaNote.textContent = "Power Echo repeats an emergency Mend. Perfect Moment opens repeated full-charge Darts only while safe Echo/Cascade targets need healing. Smart Surge dynamically chooses between Minimum and Maximum from mana and group health.";
    manaField.append(manaNote);
    healing.append(manaField);
    const potionField = document.createElement("fieldset");
    potionField.innerHTML = "<legend>Combat potions</legend>";
    potionField.append(
      checkbox("Use health potions", controller.settings.consumables.healthPotion, (value) => {
        controller.settings.consumables.healthPotion = value;
        persist();
      }),
      range("Health potion below", controller.settings.consumables.healthPotionHpPct * 100, 10, 70, percent, (value) => {
        controller.settings.consumables.healthPotionHpPct = value / 100;
        persist();
      }),
      checkbox("Use mana potions", controller.settings.consumables.manaPotion, (value) => {
        controller.settings.consumables.manaPotion = value;
        persist();
      }),
      range("Mana potion below", controller.settings.consumables.manaPotionManaPct * 100, 5, 60, percent, (value) => {
        controller.settings.consumables.manaPotionManaPct = value / 100;
        persist();
      })
    );
    const potionNote = document.createElement("p");
    potionNote.className = "cp-small";
    potionNote.textContent = "The highest available potion tier is used. Health and mana potions share one cooldown, so critical health wins. Food and drinking stay manual out of combat.";
    potionField.append(potionNote);
    healing.append(potionField);
    sections.push(["healing", "Healing", healing]);
    const skills = document.createElement("div");
    const skillField = document.createElement("fieldset");
    skillField.innerHTML = "<legend>Chronomancy abilities</legend>";
    const skillGrid = document.createElement("div");
    skillGrid.className = "cp-grid";
    const frostSkillField = document.createElement("fieldset");
    frostSkillField.innerHTML = "<legend>Frost PvE abilities</legend>";
    const frostSkillGrid = document.createElement("div");
    frostSkillGrid.className = "cp-grid";
    for (const [id, label] of FROST_ABILITIES) {
      frostSkillGrid.append(checkbox(label, controller.settings.frostAbilities[id], (value) => {
        controller.settings.frostAbilities[id] = value;
        persist();
      }));
    }
    frostSkillField.append(frostSkillGrid);
    skills.append(frostSkillField);
    for (const [id, label] of CHRONO_ABILITIES) {
      skillGrid.append(checkbox(label, controller.settings.abilities[id], (value) => {
        if (id === "temporal_reversal" || id === "collective_reversal") {
          controller.settings.modules.resurrection = value;
          controller.settings.abilities.temporal_reversal = value;
          controller.settings.abilities.collective_reversal = value;
        } else {
          controller.settings.abilities[id] = value;
        }
        persist();
      }));
    }
    skillField.append(skillGrid);
    skills.append(skillField);
    sections.push(["skills", "Skills", skills]);
    const targeting = document.createElement("div");
    const targetField = document.createElement("fieldset");
    targetField.innerHTML = "<legend>Targeting</legend>";
    const enemyRow = document.createElement("label");
    enemyRow.innerHTML = "<span>Enemy mode</span>";
    const enemySelect = document.createElement("select");
    for (const [value, label] of [
      ["tank-target", "Tank's target"],
      ["assist-member-target", "Assisted member's target"],
      ["current-target", "Current target"],
      ["lowest-hp", "Lowest-HP enemy"],
      ["closest-engaged", "Closest engaged enemy"],
      ["closest-in-range", "Closest enemy in range"]
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = controller.settings.targeting.enemyMode === value;
      enemySelect.append(option);
    }
    enemySelect.addEventListener("change", () => {
      controller.settings.targeting.enemyMode = enemySelect.value;
      persist();
    });
    enemyRow.append(enemySelect);
    const assistRow = document.createElement("label");
    assistRow.innerHTML = "<span>Assist member</span>";
    const assistSelect = document.createElement("select");
    const refreshAssistMembers = () => {
      const selected = controller.settings.targeting.assistMemberId;
      assistSelect.replaceChildren();
      const automatic = document.createElement("option");
      automatic.value = "";
      automatic.textContent = "Auto-detect tank";
      assistSelect.append(automatic);
      for (const member of controller.partyMembers()) {
        const option = document.createElement("option");
        option.value = String(member.id);
        option.textContent = `${member.name}${member.role ? ` (${member.role})` : ""}`;
        assistSelect.append(option);
      }
      assistSelect.value = selected === null ? "" : String(selected);
    };
    refreshAssistMembers();
    assistSelect.addEventListener("change", () => {
      controller.settings.targeting.assistMemberId = assistSelect.value === "" ? null : Number(assistSelect.value);
      persist();
    });
    assistRow.append(assistSelect);
    targetField.append(
      enemyRow,
      assistRow,
      range("Target range", controller.settings.targeting.maxTargetRange, 5, 30, (value) => `${value} yd`, (value) => {
        controller.settings.targeting.maxTargetRange = value;
        persist();
      }),
      checkbox("Attack new enemies in Solo Questing", controller.settings.targeting.autoPull, (value) => {
        controller.settings.targeting.autoPull = value;
        persist();
      }),
      checkbox("Keep Echo on tank (off = adaptive rescue)", controller.settings.targeting.keepEchoOnTank, (value) => {
        controller.settings.targeting.keepEchoOnTank = value;
        persist();
      }),
      checkbox("Party and raid targets only", controller.settings.targeting.partyOnly, (value) => {
        controller.settings.targeting.partyOnly = value;
        persist();
      }),
      checkbox("Natural stream targeting", controller.settings.targeting.streamTargetSelection, (value) => {
        controller.settings.targeting.streamTargetSelection = value;
        persist();
      })
    );
    const targetNote = document.createElement("p");
    targetNote.className = "cp-small";
    targetNote.textContent = "ChronoPilot leaves its latest ally selected while healing and switches to an enemy only when it attacks. Cutscenes never trigger target switching.";
    targetField.append(targetNote);
    targeting.append(targetField);
    sections.push(["targeting", "Targeting", targeting]);
    const safety = document.createElement("div");
    const safetyField = document.createElement("fieldset");
    safetyField.innerHTML = "<legend>Safety</legend>";
    safetyField.append(
      range("Manual pause", controller.settings.safety.manualOverrideMs / 100, 1, 50, (value) => `${(value / 10).toFixed(1)} sec`, (value) => {
        controller.settings.safety.manualOverrideMs = value * 100;
        persist();
      }),
      checkbox("Enable PvP / Arena assist", controller.settings.pvp.enabled, (value) => {
        controller.settings.pvp.enabled = value;
        controller.settings.safety.disableInPvp = !value;
        persist();
      }),
      range("PvP maximum Surge charges", controller.settings.pvp.maxSurgeCharges, 1, 4, String, (value) => {
        controller.settings.pvp.maxSurgeCharges = value;
        persist();
      }),
      range("PvP minimum Surge charges", controller.settings.pvp.minSurgeCharges, 1, 4, String, (value) => {
        controller.settings.pvp.minSurgeCharges = value;
        persist();
      }),
      range("PvP Ice Block below", controller.settings.pvp.iceBlockHpPct * 100, 10, 60, percent, (value) => {
        controller.settings.pvp.iceBlockHpPct = value / 100;
        persist();
      }),
      checkbox("Blink out of roots", controller.settings.pvp.blinkOnRoot, (value) => {
        controller.settings.pvp.blinkOnRoot = value;
        persist();
      }),
      range("PvP Hourglass rescue", controller.settings.pvp.hourglassHpPct * 100, 10, 50, percent, (value) => {
        controller.settings.pvp.hourglassHpPct = value / 100;
        persist();
      })
    );
    const limits = document.createElement("p");
    limits.className = "cp-small";
    limits.textContent = "PvP uses aggressive Smart Surge limits, skips resurrection entirely, and never automates camera, loot, chat, trades, mail, or economy actions.";
    safetyField.append(limits);
    safety.append(safetyField);
    sections.push(["safety", "Safety", safety]);
    for (const [id, label, view] of sections) {
      view.className = "cp-view";
      view.dataset.view = id;
      view.hidden = id !== "overview";
      views.append(view);
      const button = document.createElement("button");
      button.textContent = label;
      button.dataset.tab = id;
      button.dataset.selected = String(id === "overview");
      button.addEventListener("click", () => {
        if (id === "targeting") refreshAssistMembers();
        for (const candidate of root.querySelectorAll("[data-tab]")) {
          candidate.dataset.selected = String(candidate === button);
        }
        for (const candidate of root.querySelectorAll("[data-view]")) {
          candidate.hidden = candidate.dataset.view !== id;
        }
      });
      tabs.append(button);
    }
    const toggle = root.querySelector(".cp-toggle");
    const pause = root.querySelector(".cp-pause");
    toggle.addEventListener("click", () => controller.toggle());
    pause.addEventListener("click", () => controller.stop("Emergency pause pressed."));
    const head = root.querySelector(".cp-head");
    let drag = null;
    head.addEventListener("pointerdown", (event) => {
      const rect = root.getBoundingClientRect();
      drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
      head.setPointerCapture(event.pointerId);
    });
    head.addEventListener("pointermove", (event) => {
      if (!drag) return;
      root.style.left = `${Math.max(0, drag.left + event.clientX - drag.x)}px`;
      root.style.top = `${Math.max(0, drag.top + event.clientY - drag.y)}px`;
      root.style.right = "auto";
    });
    head.addEventListener("pointerup", () => {
      drag = null;
    });
    const update = (status) => {
      root.dataset.active = String(status.active);
      const modeLabel = CONTEXTS.find(([mode]) => mode === status.detectedMode)?.[1] ?? status.detectedMode;
      const profileLabel = status.detectedProfile === "frost-pve" ? "Frost DPS" : "Chrono Heal";
      root.querySelector(".cp-state").textContent = status.active ? `Active \xB7 ${profileLabel} \xB7 ${modeLabel}` : "Paused";
      const decision = status.decision;
      let actionText = "Waiting";
      if (decision.type === "cast") {
        actionText = ABILITY_LABELS.get(decision.abilityId) ?? decision.abilityId;
      } else if (decision.type === "cast-at") {
        actionText = `Place ${ABILITY_LABELS.get(decision.abilityId) ?? decision.abilityId}`;
      } else if (decision.type === "target") {
        actionText = `Target ${decision.targetId}`;
      } else if (decision.type === "use-item") {
        actionText = `Use ${decision.itemId.replaceAll("_", " ")}`;
      }
      root.querySelector(".cp-action").textContent = actionText;
      root.querySelector(".cp-reason").textContent = status.decision.reason;
      toggle.textContent = status.active ? "Stop assist" : "Start assist";
      toggle.className = `cp-toggle ${status.active ? "cp-stop" : "cp-start"}`;
    };
    update(controller.status);
    return { element: root, update, destroy: () => root.remove() };
  }

  // src/index.ts
  var MOVEMENT_KEYS = /* @__PURE__ */ new Set([
    "w",
    "a",
    "s",
    "d",
    "q",
    "e",
    " ",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright"
  ]);
  function mountChronoPilot(world, options = {}) {
    let panel = null;
    const controller = new ChronoPilotController(world, {
      settings: loadSettings(),
      onStatus: (status) => panel?.update(status)
    });
    if (options.showPanel !== false) panel = mountChronoPilotPanel(controller);
    const onKeyDown = (event) => {
      if (!controller.status.active || event.repeat) return;
      if (MOVEMENT_KEYS.has(event.key.toLowerCase())) return;
      if (event.target?.closest("#chronopilot-panel")) return;
      controller.notifyManualAbilityInput();
    };
    const onPointerDown = (event) => {
      if (!controller.status.active) return;
      const target = event.target;
      if (!target || target.closest("#chronopilot-panel")) return;
      if (target.closest("#actionbar, #actionbar2, #spellbook, .action-slot")) {
        controller.notifyManualAbilityInput();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    let raf = 0;
    const frame = (now) => {
      controller.tick(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return {
      controller,
      destroy: () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown, true);
        window.removeEventListener("pointerdown", onPointerDown, true);
        panel?.destroy();
      }
    };
  }

  // src/settings-path.ts
  function isSafeSettingPath(path) {
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(path)) return false;
    const parts = path.split(".");
    return !parts.some(
      (part) => part === "__proto__" || part === "prototype" || part === "constructor"
    );
  }

  // src/injected-entry.ts
  function resolveSetting(path, value) {
    const controller = window.__chronopilot?.controller;
    if (!controller || !path || !isSafeSettingPath(path)) return null;
    const parts = path.split(".");
    let cursor = controller.settings;
    for (const part of parts.slice(0, -1)) {
      if (!Object.prototype.hasOwnProperty.call(cursor, part)) return null;
      const next = cursor[part];
      if (!next || typeof next !== "object") return null;
      cursor = next;
    }
    const key = parts.at(-1);
    if (!key || !Object.prototype.hasOwnProperty.call(cursor, key)) return null;
    const current = cursor[key];
    if (current !== null && typeof current !== typeof value) return null;
    if (typeof value === "number" && !Number.isFinite(value)) return null;
    return { cursor, key, value };
  }
  function updateSettings(updates) {
    const controller = window.__chronopilot?.controller;
    if (!controller || !Array.isArray(updates) || updates.length < 1 || updates.length > 32) return false;
    const resolved = updates.map((update) => resolveSetting(update.path, update.value));
    if (resolved.some((entry) => entry === null)) return false;
    for (const entry of resolved) {
      if (!entry) return false;
      entry.cursor[entry.key] = entry.value;
    }
    saveSettings(controller.settings);
    return true;
  }
  window.__chronopilotApi = {
    command(command) {
      const controller = window.__chronopilot?.controller;
      if (!controller) return false;
      if (command.type === "start") controller.start();
      else if (command.type === "stop") controller.stop();
      else if (command.type === "toggle") controller.toggle();
      else if (command.type === "update-setting") {
        return updateSettings([{ path: command.path, value: command.value }]);
      } else if (command.type === "update-settings") return updateSettings(command.updates);
      else return false;
      return true;
    },
    snapshot() {
      const controller = window.__chronopilot?.controller;
      if (!controller) return { ready: false };
      return {
        ready: true,
        status: controller.status,
        settings: controller.settings,
        partyMembers: controller.partyMembers()
      };
    }
  };
  if (!window.__chronopilotBootstrapInstalled) {
    window.__chronopilotBootstrapInstalled = true;
    const tryMount = () => {
      if (window.__chronopilot || !window.__game?.world) return;
      window.__chronopilot = mountChronoPilot(window.__game.world, { showPanel: false });
    };
    tryMount();
    window.setInterval(tryMount, 1e3);
  }
})();
