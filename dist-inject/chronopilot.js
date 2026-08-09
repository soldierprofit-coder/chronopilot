"use strict";
(() => {
  // src/defaults.ts
  var DEFAULT_SETTINGS = {
    settingsVersion: 17,
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
      fireball: true,
      fire_blast: true,
      dragons_breath: true,
      scorch: true,
      pyroblast: true,
      flamestrike: true,
      combustion: true,
      meteor: true,
      blazing_barrier: true,
      overload: true,
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
    fireAbilities: {
      arcane_intellect: true,
      frost_armor: true,
      fireball: true,
      fire_blast: true,
      dragons_breath: true,
      scorch: true,
      pyroblast: true,
      flamestrike: true,
      combustion: true,
      meteor: true,
      blazing_barrier: true,
      power_echo: true,
      overload: true,
      presence_of_mind: true,
      rune_of_power: true,
      ice_floes: false,
      cold_snap: true,
      greater_invisibility: false,
      rings_of_frost: false,
      counterspell: true,
      ice_block: true,
      blink: true,
      polymorph: true,
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
    fire: {
      smartBurst: true,
      smartPreShield: true,
      phoenixTranceDurableOnly: true,
      useMeteorSingleTarget: true,
      useDragonsBreathPve: true,
      flamestrikeEnemyCount: 3,
      meteorEnemyCount: 3,
      dragonsBreathEnemyCount: 3,
      conserveManaPct: 0.25,
      stopDamageManaPct: 0.05,
      aetherwellManaPct: 0.3,
      barrierHpPct: 0.75,
      iceBlockHpPct: 0.28
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
      hourglassHpPct: 0.4,
      fireAutoAttack: true,
      fireBurst: true
    },
    safety: {
      manualOverrideMs: 250,
      disableInPvp: false,
      buffOutOfCombat: true,
      dodgeAoe: true,
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

  // src/fire-policy.ts
  var HEALTH_POTIONS2 = ["healing_potion", "lesser_healing_potion", "minor_healing_potion"];
  var MANA_POTIONS2 = ["mana_potion", "lesser_mana_potion", "minor_mana_potion"];
  var BREAKABLE_CONTROL = /* @__PURE__ */ new Set(["incapacitate", "polymorph", "blind", "hex", "stasis"]);
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
  function castAt2(abilityId, priority, reason, x, z, targetId) {
    return { type: "cast-at", abilityId, x, z, targetId, priority, reason };
  }
  function abilityReady2(observation, settings, abilityId) {
    const chargeBank = observation.player.abilityCharges?.[abilityId];
    return settings.fireAbilities[abilityId] && observation.knownAbilityIds.has(abilityId) && ((chargeBank?.charges ?? 0) > 0 || (observation.player.cooldowns[abilityId] ?? 0) <= 0);
  }
  function hasAura2(unit, idOrKind) {
    return unit.auras.some((aura) => aura.id === idOrKind || aura.kind === idOrKind);
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
    return enemy.crowdControlled || enemy.auras.some((aura) => BREAKABLE_CONTROL.has(aura.kind));
  }
  function selectedEnemy2(observation, settings, contextMode) {
    const valid = (enemy) => enemy && enemy.hostile && !enemy.dead && !protectedControl(enemy) && distance2(observation.player, enemy) <= Math.min(30, settings.targeting.maxTargetRange) ? enemy : null;
    const current = valid(observation.enemies.find((enemy) => enemy.id === observation.currentTargetId));
    const remembered = valid(observation.enemies.find((enemy) => enemy.id === observation.lastEnemyTargetId));
    if (contextMode === "pvp" && current) return current;
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
    const engaged = observation.enemies.filter((enemy) => valid(enemy) && enemy.inCombat && (contextMode === "solo" || contextMode === "pvp" || !settings.targeting.partyOnly || enemy.targetId === null || partyIds.has(enemy.targetId)));
    const mayAcquire = contextMode === "pvp" || contextMode === "solo" && settings.targeting.autoPull;
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
  function fireCluster(observation, primary) {
    const eligible = observation.enemies.filter((enemy) => enemy.hostile && !enemy.dead && !protectedControl(enemy) && (enemy.inCombat || enemy.id === primary.id) && distance2(observation.player, enemy) <= 30);
    let best = {
      center: primary,
      count: eligible.filter((enemy) => distance2(primary, enemy) <= 7).length,
      aoeSafe: !observation.enemies.some(
        (enemy) => !enemy.dead && protectedControl(enemy) && distance2(primary, enemy) <= 8
      )
    };
    for (const center of eligible) {
      const count = eligible.filter((enemy) => distance2(center, enemy) <= 7).length;
      const aoeSafe = !observation.enemies.some(
        (enemy) => !enemy.dead && protectedControl(enemy) && distance2(center, enemy) <= 8
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
  function resolveAssistProfile(observation, settings) {
    if (settings.assistProfile !== "auto") return settings.assistProfile;
    if (observation.talentSpec === "fire") return "fire-dps";
    if (observation.talentSpec === "arcane") return "chronomancy-healer";
    const fireKit = observation.knownAbilityIds.has("pyroblast") || observation.knownAbilityIds.has("fire_blast") || observation.knownAbilityIds.has("combustion");
    return fireKit ? "fire-dps" : "chronomancy-healer";
  }
  function decideFire(observation, settings) {
    const player = observation.player;
    if (observation.loading) return wait2("Waiting for a complete world snapshot.");
    if (player.dead) return wait2("Player is dead.");
    if (observation.cutscene) return wait2("Raid transition or cutscene is active.");
    if (observation.mounted) return wait2("Assist is paused while mounted.");
    const contextMode = resolveContextMode(observation, settings);
    const pvpMode = contextMode === "pvp";
    if (observation.pvp && !settings.pvp.enabled) return wait2("PvP / Arena assist is disabled.");
    const playerHealth = hpPct2(player);
    const currentMana = manaPct2(player);
    const gcdReady = player.gcdRemaining <= 0.05;
    const conservingMana = !pvpMode && currentMana < settings.fire.conserveManaPct;
    const playerInStasis = hasAura2(player, "stasis") || hasAura2(player, "ice_block");
    if (playerInStasis) return wait2("Cold Coffin is active; hold until immunity ends or you cancel it.");
    if (abilityReady2(observation, settings, "ice_block") && (playerHealth <= (pvpMode ? settings.pvp.iceBlockHpPct : settings.fire.iceBlockHpPct) || pvpMode && (observation.controlled || observation.silenced) && playerHealth <= settings.profiles.pvp.emergencyHpPct)) {
      return cast2("ice_block", 1, pvpMode ? "Cleanse control and become immune during a Fire PvP emergency." : "Use Cold Coffin during a critical Fire emergency.");
    }
    if (pvpMode && observation.rooted && settings.pvp.blinkOnRoot && abilityReady2(observation, settings, "blink")) {
      return cast2("blink", 2, "Break the root with Flickerstep.");
    }
    if (observation.controlled) return wait2("Player is crowd controlled.");
    if (observation.silenced) return wait2("Player is silenced.");
    if (observation.potionCooldownRemaining <= 0) {
      const healthPotion = availableItem2(observation.inventory, HEALTH_POTIONS2);
      if (settings.consumables.healthPotion && healthPotion && playerHealth <= settings.consumables.healthPotionHpPct) {
        return { type: "use-item", itemId: healthPotion, priority: 3, reason: "Use an emergency health potion." };
      }
      const manaPotion = availableItem2(observation.inventory, MANA_POTIONS2);
      if (settings.consumables.manaPotion && manaPotion && currentMana <= settings.consumables.manaPotionManaPct) {
        return { type: "use-item", itemId: manaPotion, priority: 4, reason: "Use a mana potion before the reserve is exhausted." };
      }
    }
    const enemy = selectedEnemy2(observation, settings, contextMode);
    const durable = enemy ? durableTarget(observation, enemy, contextMode) : false;
    const cluster = enemy ? fireCluster(observation, enemy) : null;
    const hotStreak = hasAura2(player, "hot_streak");
    const combustionActive = hasAura2(player, "combustion");
    const burstWindow = Boolean(
      enemy && settings.fire.smartBurst && (pvpMode ? settings.pvp.fireBurst : !settings.fire.phoenixTranceDurableOnly || durable || (cluster?.count ?? 0) >= 3)
    );
    if (settings.modules.interrupts && !player.castingAbility && gcdReady && abilityReady2(observation, settings, "counterspell")) {
      const caster = observation.enemies.filter((candidate) => candidate.castingAbility && !candidate.dead && distance2(player, candidate) <= 30).sort((a, b) => distance2(player, a) - distance2(player, b) || a.id - b.id)[0];
      if (caster) {
        if (observation.currentTargetId !== caster.id) {
          return { type: "target", targetId: caster.id, priority: 5, reason: `${caster.name} is casting.` };
        }
        return cast2("counterspell", 6, `Interrupt ${caster.name}.`);
      }
    }
    const barrierActive = hasAura2(player, "blazing_barrier") || hasAura2(player, "personal_barrier");
    const shouldPreShield = !player.inCombat && settings.safety.buffOutOfCombat && settings.fire.smartPreShield && (contextMode === "solo" || enemy !== null);
    if (settings.modules.defensives && !player.castingAbility && gcdReady && abilityReady2(observation, settings, "blazing_barrier") && !barrierActive && (shouldPreShield || playerHealth <= (pvpMode ? settings.profiles.pvp.barrierHpPct : settings.fire.barrierHpPct))) {
      return cast2("blazing_barrier", 7, player.inCombat ? "Restore Blazing Barrier under pressure." : "Prepare Blazing Barrier before combat.");
    }
    if (pvpMode && !player.castingAbility && gcdReady && playerHealth <= 0.6 && abilityReady2(observation, settings, "cold_snap") && (player.cooldowns.blink ?? 0) > 0 && (player.cooldowns.blazing_barrier ?? 0) > 0) {
      return cast2("cold_snap", 8, "Reset Flickerstep and Blazing Barrier during sustained PvP pressure.");
    }
    if (!player.inCombat && !player.castingAbility && gcdReady && settings.safety.buffOutOfCombat && observation.aetherInsightNeedsRefresh && abilityReady2(observation, settings, "arcane_intellect")) {
      return cast2("arcane_intellect", 9, "Maintain Aether Insight for the current group.");
    }
    if (!player.inCombat && !player.castingAbility && gcdReady && settings.safety.buffOutOfCombat && !hasAura2(player, "frost_armor") && !hasAura2(player, "buff_armor") && abilityReady2(observation, settings, "frost_armor")) {
      return cast2("frost_armor", 10, "Maintain Hoarfrost Mantle before combat.");
    }
    if (!player.inCombat && !enemy && !player.castingAbility && gcdReady && currentMana <= settings.fire.aetherwellManaPct && abilityReady2(observation, settings, "evocation")) {
      return cast2("evocation", 11, "Channel Aetherwell safely between pulls.");
    }
    if (!enemy) return wait2(pvpMode ? "No valid PvP opponent is selected or visible in range." : "No valid PvE enemy is selected or engaged in range.");
    if (observation.currentTargetId !== enemy.id) {
      return { type: "target", targetId: enemy.id, priority: 12, reason: `Target ${enemy.name} for the Fire rotation.` };
    }
    if (pvpMode && settings.pvp.fireAutoAttack && !player.autoAttacking) {
      return {
        type: "start-attack",
        targetId: enemy.id,
        priority: 13,
        reason: "Arm the wand auto-attack so it fires while moving whenever line of sight is clear."
      };
    }
    const nearbyAttackers = observation.enemies.filter(
      (candidate) => candidate.hostile && !candidate.dead && !protectedControl(candidate) && distance2(player, candidate) <= 10
    );
    if (pvpMode && !player.castingAbility && gcdReady && abilityReady2(observation, settings, "frost_nova") && (nearbyAttackers.length >= settings.pvp.frostNovaEnemyCount || nearbyAttackers.length > 0 && playerHealth < settings.pvp.frostNovaHpPct)) {
      return cast2("frost_nova", 14, `Root ${nearbyAttackers.length} nearby attacker${nearbyAttackers.length === 1 ? "" : "s"}.`, void 0, enemy.id);
    }
    if (pvpMode && !player.castingAbility && gcdReady && abilityReady2(observation, settings, "polymorph") && Math.min(...observation.party.map(hpPct2)) < settings.pvp.polymorphHpPct) {
      const secondary = observation.enemies.filter((candidate) => candidate.id !== enemy.id && !candidate.dead && !protectedControl(candidate) && distance2(player, candidate) <= 30).sort((a, b) => distance2(player, a) - distance2(player, b) || a.id - b.id)[0];
      if (secondary) return cast2("polymorph", 15, `Control ${secondary.name} while the team is pressured.`, secondary.id);
    }
    if (pvpMode && !player.castingAbility && gcdReady && nearbyAttackers.length >= 2 && abilityReady2(observation, settings, "rings_of_frost")) {
      return castAt2("rings_of_frost", 16, "Place Ring of Frost around the melee pressure.", player.x, player.z, enemy.id);
    }
    if (!pvpMode && !player.castingAbility && gcdReady && burstWindow && !conservingMana && abilityReady2(observation, settings, "rune_of_power")) {
      return cast2("rune_of_power", 16, "Place Rune of Power before the PvE Fire burst.", void 0, enemy.id);
    }
    if (burstWindow && !conservingMana && !combustionActive && abilityReady2(observation, settings, "combustion")) {
      return cast2("combustion", 17, pvpMode ? "Open the Fire PvP burst with Phoenix Trance." : "Open the durable-target burst with Phoenix Trance.", void 0, enemy.id);
    }
    if (!hotStreak && distance2(player, enemy) <= 20 && abilityReady2(observation, settings, "fire_blast")) {
      return cast2("fire_blast", 18, combustionActive ? "Dump Cinderfall inside Phoenix Trance to build Hot Streak." : "Use the guaranteed Cinderfall critical to build Hot Streak.", enemy.id);
    }
    if (player.castingAbility || player.channeling) {
      return wait2(`Casting ${player.castingAbility ?? "a channel"}; off-GCD Fire actions are already checked.`);
    }
    if (!gcdReady) return wait2("Waiting for the global cooldown.");
    if (currentMana <= settings.fire.stopDamageManaPct && !hotStreak) {
      return wait2("Fire damage is paused at the configured emergency mana floor.");
    }
    if (hotStreak) {
      if (settings.fire.smartBurst && abilityReady2(observation, settings, "power_echo") && !hasAura2(player, "power_echo")) {
        return cast2("power_echo", 20, "Arm Power Echo for the instant Hot Streak spender.", void 0, enemy.id);
      }
      if (settings.fire.smartBurst && !conservingMana && abilityReady2(observation, settings, "overload") && !hasAura2(player, "overload")) {
        return cast2("overload", 21, "Amplify the free Hot Streak spender with Overload.", void 0, enemy.id);
      }
      if (cluster?.aoeSafe && cluster.count >= settings.fire.flamestrikeEnemyCount && abilityReady2(observation, settings, "flamestrike")) {
        return castAt2("flamestrike", 22, `Spend Hot Streak on ${cluster.count} clustered enemies.`, cluster.center.x, cluster.center.z, enemy.id);
      }
      if (abilityReady2(observation, settings, "pyroblast")) {
        return cast2("pyroblast", 23, "Spend Hot Streak on an instant, free Pyrelance.", enemy.id);
      }
    }
    if (burstWindow && !conservingMana && abilityReady2(observation, settings, "presence_of_mind") && !hasAura2(player, "next_cast_instant")) {
      return cast2("presence_of_mind", 24, "Prepare an instant Pyrelance with Racing Mind.", void 0, enemy.id);
    }
    if (hasAura2(player, "next_cast_instant") && abilityReady2(observation, settings, "pyroblast")) {
      return cast2("pyroblast", 25, "Spend Racing Mind on an instant Pyrelance.", enemy.id);
    }
    if (!conservingMana && abilityReady2(observation, settings, "meteor") && cluster?.aoeSafe && (pvpMode || cluster.count >= settings.fire.meteorEnemyCount || settings.fire.useMeteorSingleTarget && durable)) {
      return castAt2("meteor", 26, pvpMode ? "Drop Meteor into the active Fire PvP burst." : cluster.count >= settings.fire.meteorEnemyCount ? `Drop Meteor on ${cluster.count} clustered enemies.` : "Drop Meteor on the durable PvE target.", cluster.center.x, cluster.center.z, enemy.id);
    }
    const breathTargets = observation.enemies.filter(
      (candidate) => candidate.hostile && !candidate.dead && !protectedControl(candidate) && distance2(player, candidate) <= 12
    ).length;
    if (!conservingMana && abilityReady2(observation, settings, "dragons_breath") && (pvpMode && breathTargets >= 2 || !pvpMode && settings.fire.useDragonsBreathPve && breathTargets >= settings.fire.dragonsBreathEnemyCount)) {
      return cast2("dragons_breath", 27, `Hold Dragon's Breath to its automatic stage-IV release for ${breathTargets} nearby enemies.`, void 0, enemy.id);
    }
    if (!conservingMana && cluster?.aoeSafe && cluster.count >= settings.fire.flamestrikeEnemyCount && abilityReady2(observation, settings, "flamestrike")) {
      return castAt2("flamestrike", 28, `Hard-cast Flamestrike on ${cluster.count} clustered enemies.`, cluster.center.x, cluster.center.z, enemy.id);
    }
    if (pvpMode && burstWindow && abilityReady2(observation, settings, "ice_floes") && !hasAura2(player, "ice_floes")) {
      return cast2("ice_floes", 29, "Enable two moving Fire casts for the PvP pressure window.", void 0, enemy.id);
    }
    if (abilityReady2(observation, settings, "scorch") && (pvpMode || conservingMana || enemy.hp <= enemy.maxHp * 0.3)) {
      return cast2("scorch", 30, pvpMode ? "Use mobile Scald pressure while the opponent moves." : conservingMana ? "Use mana-efficient Scald while conserving." : "Use guaranteed-critical Scald in execute range.", enemy.id);
    }
    if (abilityReady2(observation, settings, "fireball")) {
      return cast2("fireball", 31, "Build Fire criticals and Ignition with Cinderbolt.", enemy.id);
    }
    if (abilityReady2(observation, settings, "scorch")) {
      return cast2("scorch", 32, "Use Scald while the main Fire builder is unavailable.", enemy.id);
    }
    return wait2("No enabled Fire ability is ready.");
  }

  // src/aoe-dodge.ts
  var AOE_SAFETY_MARGIN = 1;
  var AOE_REACTION_BUFFER_SECONDS = 0.25;
  var ASSUMED_RUN_SPEED = 7;
  var FLICKERSTEP_DISTANCE = 15;
  var ANGLE_STEPS = 32;
  var DISTANCE_STEP = 0.5;
  var MAX_ESCAPE_DISTANCE = 28;
  var EXIT_CLEARANCE = 0.25;
  function finiteZone(zone) {
    return Number.isFinite(zone.x) && Number.isFinite(zone.z) && Number.isFinite(zone.radius) && Number.isFinite(zone.remaining) && zone.radius > 0 && zone.remaining > 0;
  }
  function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return dx * dx + dz * dz;
  }
  function inside(point, zone, margin) {
    return distanceSquared(point, zone) <= (zone.radius + margin) ** 2;
  }
  function pathEntersNewZone(start, end, zones) {
    const distance3 = Math.sqrt(distanceSquared(start, end));
    const samples = Math.max(2, Math.ceil(distance3 / DISTANCE_STEP));
    for (const zone of zones) {
      if (inside(start, zone, AOE_SAFETY_MARGIN)) continue;
      for (let step = 1; step < samples; step++) {
        const t = step / samples;
        const point = {
          x: start.x + (end.x - start.x) * t,
          z: start.z + (end.z - start.z) * t
        };
        if (inside(point, zone, AOE_SAFETY_MARGIN)) return true;
      }
    }
    return false;
  }
  function preferredEscapeAngle(player, danger) {
    let dx = 0;
    let dz = 0;
    for (const zone of danger) {
      const awayX = player.x - zone.x;
      const awayZ = player.z - zone.z;
      const length = Math.hypot(awayX, awayZ);
      const weight = 1 / Math.max(0.05, zone.remaining);
      if (length > 1e-3) {
        dx += awayX / length * weight;
        dz += awayZ / length * weight;
      }
    }
    return Math.hypot(dx, dz) > 1e-3 ? Math.atan2(dx, dz) : 0;
  }
  function planAoeDodge(player, source, continuing = false) {
    const zones = source.filter(finiteZone);
    const triggerMargin = continuing ? AOE_SAFETY_MARGIN : 0;
    const danger = zones.filter((zone) => inside(player, zone, triggerMargin));
    if (danger.length === 0) return null;
    const preferred = preferredEscapeAngle(player, danger);
    let best = null;
    for (let index = 0; index < ANGLE_STEPS; index++) {
      const offsetIndex = index === 0 ? 0 : Math.ceil(index / 2) * (index % 2 === 1 ? 1 : -1);
      const angle = preferred + offsetIndex * Math.PI * 2 / ANGLE_STEPS;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      for (let distance3 = DISTANCE_STEP; distance3 <= MAX_ESCAPE_DISTANCE; distance3 += DISTANCE_STEP) {
        const point = { x: player.x + sin * distance3, z: player.z + cos * distance3 };
        if (zones.some((zone) => inside(point, zone, AOE_SAFETY_MARGIN + EXIT_CLEARANCE))) continue;
        if (pathEntersNewZone(player, point, zones)) break;
        const score = distance3 + Math.abs(offsetIndex) * 0.015;
        if (!best || score < best.score) best = { ...point, angle, distance: distance3, score };
        break;
      }
    }
    if (!best) return null;
    const blinkLanding = {
      x: player.x + Math.sin(best.angle) * FLICKERSTEP_DISTANCE,
      z: player.z + Math.cos(best.angle) * FLICKERSTEP_DISTANCE
    };
    const blinkSafe = zones.every(
      (zone) => !inside(blinkLanding, zone, AOE_SAFETY_MARGIN + EXIT_CLEARANCE)
    );
    const remaining = Math.min(...danger.map((zone) => zone.remaining));
    const walkSeconds = best.distance / ASSUMED_RUN_SPEED + AOE_REACTION_BUFFER_SECONDS;
    return {
      x: best.x,
      z: best.z,
      facing: best.angle,
      distance: best.distance,
      remaining,
      blinkSafe,
      needsEmergencyBlink: walkSeconds >= remaining
    };
  }

  // src/woc-adapter.ts
  var CROWD_CONTROL = /* @__PURE__ */ new Set(["stun", "stasis", "incapacitate", "polymorph", "blind", "hex"]);
  var MIN_OBSERVATION_RADIUS = 40;
  function distanceSquared2(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return dx * dx + dz * dz;
  }
  function observationRadius(settings) {
    return Math.max(MIN_OBSERVATION_RADIUS, settings.targeting.maxTargetRange + 10);
  }
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
    const maxDistanceSquared = observationRadius(settings) ** 2;
    const enemies = [];
    for (const entity of world.entities.values()) {
      const legalEnemy = entity.hostile || pvpOpponentIds.has(entity.id) || pvpOpponentIds.has(entity.ownerId ?? -1);
      if (entity.kind === "object" || !legalEnemy || distanceSquared2(self, entity.pos) > maxDistanceSquared) {
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
        crowdControlled: entity.auras.some(
          (aura) => typeof aura.kind === "string" ? CROWD_CONTROL.has(aura.kind) : false
        ),
        auras: auras(entity.auras)
      });
    }
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
        ),
        autoAttacking: world.player.autoAttack === true
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
    aoeMovementActive = false;
    nextEmergencyBlinkAt = 0;
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
      this.releaseAoeMovement();
      this.decision = { type: "wait", priority: 999, reason };
      this.emitStatus();
    }
    dispose() {
      this.releaseAoeMovement();
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
      const aoeDecision = this.updateAoeDodge(now);
      if (aoeDecision) {
        this.decision = aoeDecision;
        this.emitStatus();
        return this.decision;
      }
      if (now < this.pausedUntil) return this.decision;
      if (now < this.nextDecisionAt || now < this.pendingUntil) return this.decision;
      this.nextDecisionAt = now + this.settings.safety.decisionIntervalMs;
      const fireCanWeaveOffGcd = this.settings.assistProfile === "fire-dps" || this.world.talentSpec === "fire" || this.detectedProfile === "fire-dps";
      if (!fireCanWeaveOffGcd && (this.world.player.castingAbility || this.world.player.channeling || this.world.player.gcdRemaining > 0.05)) {
        return this.decision;
      }
      const observation = observeWocWorld(this.world, this.settings, this.memory, now);
      this.detectedProfile = resolveAssistProfile(observation, this.settings);
      const next = this.detectedProfile === "fire-dps" ? decideFire(observation, this.settings) : decideChronomancy(observation, this.settings);
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
        } else if (next.type === "start-attack") {
          this.world.startAutoAttack?.();
          this.pendingUntil = now + 150;
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
    updateAoeDodge(now) {
      const movement = this.options.movement;
      if (!this.settings.safety.dodgeAoe || !movement || !this.world.riftBossDeathZones) {
        this.releaseAoeMovement();
        return null;
      }
      let zones;
      try {
        zones = this.world.riftBossDeathZones();
      } catch {
        this.releaseAoeMovement();
        return null;
      }
      const plan = planAoeDodge(this.world.player.pos, zones, this.aoeMovementActive);
      if (!plan) {
        this.releaseAoeMovement();
        return null;
      }
      this.aoeMovementActive = true;
      movement.setControllerMoveInput({
        forward: true,
        back: false,
        turnLeft: false,
        turnRight: false,
        strafeLeft: false,
        strafeRight: false,
        jump: false,
        dive: false,
        surface: false
      }, plan.facing);
      const fireProfile = this.world.talentSpec === "fire" || this.detectedProfile === "fire-dps";
      const blinkEnabled = fireProfile ? this.settings.fireAbilities.blink : this.settings.abilities.blink;
      const blinkKnown = this.world.known.some((ability) => ability.def.id === "blink");
      const blinkReady = (this.world.player.cooldowns.get("blink") ?? 0) <= 0.05;
      const rooted = this.world.player.auras.some((aura) => aura.kind === "root");
      const useEmergencyBlink = plan.blinkSafe && blinkEnabled && blinkKnown && blinkReady && now >= this.nextEmergencyBlinkAt && (rooted || plan.needsEmergencyBlink);
      if (useEmergencyBlink) {
        try {
          movement.setControllerFacing?.(plan.facing);
          this.world.castAbility("blink");
          this.nextEmergencyBlinkAt = now + 1e3;
          return {
            type: "cast",
            abilityId: "blink",
            priority: 0,
            reason: "Dodging AoE \u2014 emergency Flickerstep, then resume combat."
          };
        } catch {
        }
      }
      return {
        type: "move",
        x: plan.x,
        z: plan.z,
        priority: 0,
        reason: "Dodging AoE \u2014 moving to the nearest safe edge."
      };
    }
    releaseAoeMovement() {
      if (!this.aoeMovementActive) return;
      this.aoeMovementActive = false;
      this.options.movement?.clearControllerMoveInput();
      this.nextDecisionAt = 0;
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
    const assistProfile = savedAssistProfile === "chronomancy-healer" || savedAssistProfile === "fire-dps" ? savedAssistProfile : "auto";
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
      fireAbilities: { ...defaults.fireAbilities, ...saved.fireAbilities },
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
      fire: { ...defaults.fire, ...saved.fire },
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
  var FIRE_ABILITIES = [
    ["arcane_intellect", "Aether Insight"],
    ["frost_armor", "Hoarfrost Mantle"],
    ["fireball", "Cinderbolt"],
    ["fire_blast", "Cinderfall"],
    ["scorch", "Scald"],
    ["pyroblast", "Pyrelance"],
    ["flamestrike", "Flamestrike"],
    ["combustion", "Phoenix Trance"],
    ["meteor", "Meteor"],
    ["dragons_breath", "Dragon's Breath"],
    ["blazing_barrier", "Blazing Barrier"],
    ["power_echo", "Power Echo"],
    ["overload", "Overload"],
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
    ...FIRE_ABILITIES
  ]);
  var MODULES = [
    ["healing", "Chronomage"],
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
    rotationField.innerHTML = "<legend>Mage specialization</legend>";
    const rotationRow = document.createElement("label");
    rotationRow.innerHTML = "<span>Specialization</span>";
    const rotationSelect = document.createElement("select");
    for (const [value, label] of [
      ["auto", "Auto-detect (recommended)"],
      ["chronomancy-healer", "Chronomage"],
      ["fire-dps", "Fire Mage"]
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
    rotationNote.textContent = "Fire has independent PvE and PvP DPS rules and ignores the saved Chronomancy healing thresholds.";
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
    const mechanicField = document.createElement("fieldset");
    mechanicField.innerHTML = "<legend>Mechanics</legend>";
    mechanicField.append(
      checkbox("Dodge AoE (emergency Flickerstep)", controller.settings.safety.dodgeAoe, (value) => {
        controller.settings.safety.dodgeAoe = value;
        persist();
      })
    );
    const mechanicNote = document.createElement("p");
    mechanicNote.className = "cp-small";
    mechanicNote.textContent = "Supported danger zones override combat until you reach safety.";
    mechanicField.append(mechanicNote);
    overview.append(rotationField, profileField, moduleField, mechanicField);
    sections.push(["overview", "Overview", overview]);
    const fire = document.createElement("div");
    const fireField = document.createElement("fieldset");
    fireField.innerHTML = "<legend>Fire Mage</legend>";
    const percent = (value) => `${value}%`;
    fireField.append(
      checkbox("Smart Fire burst", controller.settings.fire.smartBurst, (value) => {
        controller.settings.fire.smartBurst = value;
        persist();
      }),
      checkbox("Smart Blazing Barrier pre-shield", controller.settings.fire.smartPreShield, (value) => {
        controller.settings.fire.smartPreShield = value;
        persist();
      }),
      checkbox("Phoenix Trance on durable targets", controller.settings.fire.phoenixTranceDurableOnly, (value) => {
        controller.settings.fire.phoenixTranceDurableOnly = value;
        persist();
      }),
      checkbox("Meteor on durable single targets", controller.settings.fire.useMeteorSingleTarget, (value) => {
        controller.settings.fire.useMeteorSingleTarget = value;
        persist();
      }),
      checkbox("Dragon's Breath in PvE packs", controller.settings.fire.useDragonsBreathPve, (value) => {
        controller.settings.fire.useDragonsBreathPve = value;
        persist();
      }),
      range("Flamestrike enemies", controller.settings.fire.flamestrikeEnemyCount, 2, 8, String, (value) => {
        controller.settings.fire.flamestrikeEnemyCount = value;
        persist();
      }),
      range("Meteor enemies", controller.settings.fire.meteorEnemyCount, 2, 8, String, (value) => {
        controller.settings.fire.meteorEnemyCount = value;
        persist();
      }),
      range("Dragon's Breath enemies", controller.settings.fire.dragonsBreathEnemyCount, 2, 8, String, (value) => {
        controller.settings.fire.dragonsBreathEnemyCount = value;
        persist();
      }),
      range("Conserve Fire mana", controller.settings.fire.conserveManaPct * 100, 0, 80, percent, (value) => {
        controller.settings.fire.conserveManaPct = value / 100;
        persist();
      }),
      range("Stop Fire damage", controller.settings.fire.stopDamageManaPct * 100, 0, 50, percent, (value) => {
        controller.settings.fire.stopDamageManaPct = value / 100;
        persist();
      }),
      range("Fire Aetherwell", controller.settings.fire.aetherwellManaPct * 100, 5, 80, percent, (value) => {
        controller.settings.fire.aetherwellManaPct = value / 100;
        persist();
      }),
      range("Blazing Barrier below", controller.settings.fire.barrierHpPct * 100, 20, 100, percent, (value) => {
        controller.settings.fire.barrierHpPct = value / 100;
        persist();
      }),
      range("Cold Coffin below", controller.settings.fire.iceBlockHpPct * 100, 10, 60, percent, (value) => {
        controller.settings.fire.iceBlockHpPct = value / 100;
        persist();
      })
    );
    const fireNote = document.createElement("p");
    fireNote.className = "cp-small";
    fireNote.textContent = "Hot Streak spends on Pyrelance or clustered Flamestrike. Dragon's Breath auto-releases at stage IV; ordinary movement and facing remain manual outside supported AoE escapes.";
    fireField.append(fireNote);
    fire.append(fireField);
    sections.push(["fire", "Fire Mage", fire]);
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
    sections.push(["healing", "Chronomage", healing]);
    const skills = document.createElement("div");
    const skillField = document.createElement("fieldset");
    skillField.innerHTML = "<legend>Chronomancy abilities</legend>";
    const skillGrid = document.createElement("div");
    skillGrid.className = "cp-grid";
    const fireSkillField = document.createElement("fieldset");
    fireSkillField.innerHTML = "<legend>Fire abilities</legend>";
    const fireSkillGrid = document.createElement("div");
    fireSkillGrid.className = "cp-grid";
    for (const [id, label] of FIRE_ABILITIES) {
      fireSkillGrid.append(checkbox(label, controller.settings.fireAbilities[id], (value) => {
        controller.settings.fireAbilities[id] = value;
        persist();
      }));
    }
    fireSkillField.append(fireSkillGrid);
    skills.append(fireSkillField);
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
      const profileLabel = status.detectedProfile === "fire-dps" ? "Fire Mage" : "Chronomage";
      root.querySelector(".cp-state").textContent = status.active ? `Active \xB7 ${profileLabel} \xB7 ${modeLabel}` : "Paused";
      const decision = status.decision;
      let actionText = "Waiting";
      if (decision.type === "cast") {
        actionText = ABILITY_LABELS.get(decision.abilityId) ?? decision.abilityId;
      } else if (decision.type === "cast-at") {
        actionText = `Place ${ABILITY_LABELS.get(decision.abilityId) ?? decision.abilityId}`;
      } else if (decision.type === "target") {
        actionText = `Target ${decision.targetId}`;
      } else if (decision.type === "start-attack") {
        actionText = `Auto-attack ${decision.targetId}`;
      } else if (decision.type === "use-item") {
        actionText = `Use ${decision.itemId.replaceAll("_", " ")}`;
      } else if (decision.type === "move") {
        actionText = "Dodge AoE";
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
  function isToggleHotkey(eventKey, configuredKey) {
    return configuredKey.length > 0 && eventKey.toLowerCase() === configuredKey.toLowerCase();
  }
  function mountChronoPilot(world, options = {}) {
    let panel = null;
    const controller = new ChronoPilotController(world, {
      settings: loadSettings(),
      onStatus: (status) => panel?.update(status),
      movement: options.movement
    });
    if (options.showPanel !== false) panel = mountChronoPilotPanel(controller);
    const onKeyDown = (event) => {
      if (event.repeat) return;
      if (isToggleHotkey(event.key, controller.settings.safety.toggleHotkey)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        controller.toggle();
        return;
      }
      if (!controller.status.active) return;
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
    let timer = 0;
    let destroyed = false;
    const scheduleTick = () => {
      if (destroyed) return;
      const delay = controller.status.active ? Math.max(50, controller.settings.safety.decisionIntervalMs) : 250;
      timer = window.setTimeout(() => {
        controller.tick(performance.now());
        scheduleTick();
      }, delay);
    };
    scheduleTick();
    return {
      controller,
      destroy: () => {
        destroyed = true;
        window.clearTimeout(timer);
        window.removeEventListener("keydown", onKeyDown, true);
        window.removeEventListener("pointerdown", onPointerDown, true);
        controller.dispose();
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
      window.__chronopilot = mountChronoPilot(window.__game.world, {
        showPanel: false,
        movement: window.__game.input
      });
    };
    tryMount();
    window.setInterval(tryMount, 1e3);
  }
})();
