import { resolveContextMode } from './policy.js';
const HEALTH_POTIONS = ['healing_potion', 'lesser_healing_potion', 'minor_healing_potion'];
const MANA_POTIONS = ['mana_potion', 'lesser_mana_potion', 'minor_mana_potion'];
const BREAKABLE_CONTROL = new Set(['incapacitate', 'polymorph', 'blind', 'hex', 'stasis']);
function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}
function hpPct(unit) {
    return unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
}
function manaPct(unit) {
    return unit.maxMana > 0 ? Math.max(0, Math.min(1, unit.mana / unit.maxMana)) : 0;
}
function wait(reason) {
    return { type: 'wait', priority: 999, reason };
}
function cast(abilityId, priority, reason, targetId, selectTargetId) {
    return { type: 'cast', abilityId, targetId, selectTargetId, priority, reason };
}
function castAt(abilityId, priority, reason, x, z, targetId) {
    return { type: 'cast-at', abilityId, x, z, targetId, priority, reason };
}
function abilityReady(observation, settings, abilityId) {
    const chargeBank = observation.player.abilityCharges?.[abilityId];
    return (settings.fireAbilities[abilityId] &&
        observation.knownAbilityIds.has(abilityId) &&
        ((chargeBank?.charges ?? 0) > 0 || (observation.player.cooldowns[abilityId] ?? 0) <= 0));
}
function hasAura(unit, idOrKind) {
    return unit.auras.some((aura) => aura.id === idOrKind || aura.kind === idOrKind);
}
function availableItem(inventory, preference) {
    return preference.find((itemId) => (inventory[itemId] ?? 0) > 0) ?? null;
}
function assignedTank(observation) {
    if (observation.assignedTankId !== null) {
        const assigned = observation.party.find((member) => member.id === observation.assignedTankId);
        if (assigned && !assigned.dead && assigned.connected)
            return assigned;
    }
    return observation.party.find((member) => member.role === 'tank' && !member.dead && member.connected) ?? null;
}
function protectedControl(enemy) {
    return enemy.crowdControlled || enemy.auras.some((aura) => BREAKABLE_CONTROL.has(aura.kind));
}
function selectedEnemy(observation, settings, contextMode) {
    const valid = (enemy) => enemy &&
        enemy.hostile &&
        !enemy.dead &&
        !protectedControl(enemy) &&
        distance(observation.player, enemy) <= Math.min(30, settings.targeting.maxTargetRange)
        ? enemy
        : null;
    const current = valid(observation.enemies.find((enemy) => enemy.id === observation.currentTargetId));
    const remembered = valid(observation.enemies.find((enemy) => enemy.id === observation.lastEnemyTargetId));
    // Manual focus always wins in active PvP. Outside PvP the configured rule
    // remains authoritative, matching the Chronomancy profile.
    if (contextMode === 'pvp' && current)
        return current;
    if (settings.targeting.enemyMode === 'current-target' && (current || remembered)) {
        return current ?? remembered;
    }
    const tank = assignedTank(observation);
    if (settings.targeting.enemyMode === 'tank-target' && tank) {
        const target = observation.enemies.find((enemy) => enemy.id === tank.targetId) ??
            observation.enemies.find((enemy) => enemy.targetId === tank.id);
        const resolved = valid(target);
        if (resolved)
            return resolved;
    }
    if (settings.targeting.enemyMode === 'assist-member-target') {
        const member = observation.party.find((candidate) => candidate.id === settings.targeting.assistMemberId) ?? tank;
        const resolved = valid(observation.enemies.find((enemy) => enemy.id === member?.targetId));
        if (resolved)
            return resolved;
    }
    const partyIds = new Set(observation.party.map((member) => member.id));
    const engaged = observation.enemies.filter((enemy) => (valid(enemy) &&
        enemy.inCombat &&
        (contextMode === 'solo' ||
            contextMode === 'pvp' ||
            !settings.targeting.partyOnly ||
            enemy.targetId === null ||
            partyIds.has(enemy.targetId))));
    const mayAcquire = contextMode === 'pvp' || (contextMode === 'solo' && settings.targeting.autoPull);
    const candidates = (mayAcquire ? observation.enemies.filter((enemy) => valid(enemy)) : engaged)
        .sort((a, b) => distance(observation.player, a) - distance(observation.player, b) || a.id - b.id);
    if (settings.targeting.enemyMode === 'lowest-hp') {
        return [...candidates].sort((a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp) || a.id - b.id)[0] ?? current ?? remembered;
    }
    if (settings.targeting.enemyMode === 'closest-engaged') {
        return [...engaged].sort((a, b) => distance(observation.player, a) - distance(observation.player, b) || a.id - b.id)[0] ?? current ?? remembered;
    }
    return candidates[0] ?? current ?? remembered;
}
function fireCluster(observation, primary) {
    const eligible = observation.enemies.filter((enemy) => (enemy.hostile &&
        !enemy.dead &&
        !protectedControl(enemy) &&
        (enemy.inCombat || enemy.id === primary.id) &&
        distance(observation.player, enemy) <= 30));
    let best = {
        center: primary,
        count: eligible.filter((enemy) => distance(primary, enemy) <= 7).length,
        aoeSafe: !observation.enemies.some((enemy) => !enemy.dead && protectedControl(enemy) && distance(primary, enemy) <= 8),
    };
    for (const center of eligible) {
        const count = eligible.filter((enemy) => distance(center, enemy) <= 7).length;
        const aoeSafe = !observation.enemies.some((enemy) => !enemy.dead && protectedControl(enemy) && distance(center, enemy) <= 8);
        if (!aoeSafe)
            continue;
        if (count > best.count || (count === best.count && center.id === primary.id)) {
            best = { center, count, aoeSafe };
        }
    }
    return best;
}
function durableTarget(observation, enemy, contextMode) {
    return (enemy.maxHp >= observation.player.maxHp * 1.5 ||
        ((contextMode === 'party' || contextMode === 'raid') && enemy.maxHp >= observation.player.maxHp));
}
export function resolveAssistProfile(observation, settings) {
    if (settings.assistProfile !== 'auto')
        return settings.assistProfile;
    if (observation.talentSpec === 'fire')
        return 'fire-dps';
    if (observation.talentSpec === 'arcane')
        return 'chronomancy-healer';
    const fireKit = observation.knownAbilityIds.has('pyroblast') ||
        observation.knownAbilityIds.has('fire_blast') ||
        observation.knownAbilityIds.has('combustion');
    return fireKit ? 'fire-dps' : 'chronomancy-healer';
}
export function decideFire(observation, settings) {
    const player = observation.player;
    if (observation.loading)
        return wait('Waiting for a complete world snapshot.');
    if (player.dead)
        return wait('Player is dead.');
    if (observation.cutscene)
        return wait('Raid transition or cutscene is active.');
    if (observation.mounted)
        return wait('Assist is paused while mounted.');
    const contextMode = resolveContextMode(observation, settings);
    const pvpMode = contextMode === 'pvp';
    if (observation.pvp && !settings.pvp.enabled)
        return wait('PvP / Arena assist is disabled.');
    const playerHealth = hpPct(player);
    const currentMana = manaPct(player);
    const gcdReady = player.gcdRemaining <= 0.05;
    const conservingMana = !pvpMode && currentMana < settings.fire.conserveManaPct;
    const playerInStasis = hasAura(player, 'stasis') || hasAura(player, 'ice_block');
    if (playerInStasis)
        return wait('Cold Coffin is active; hold until immunity ends or you cancel it.');
    if (abilityReady(observation, settings, 'ice_block') &&
        (playerHealth <= (pvpMode ? settings.pvp.iceBlockHpPct : settings.fire.iceBlockHpPct) ||
            (pvpMode && (observation.controlled || observation.silenced) &&
                playerHealth <= settings.profiles.pvp.emergencyHpPct))) {
        return cast('ice_block', 1, pvpMode
            ? 'Cleanse control and become immune during a Fire PvP emergency.'
            : 'Use Cold Coffin during a critical Fire emergency.');
    }
    if (pvpMode &&
        observation.rooted &&
        settings.pvp.blinkOnRoot &&
        abilityReady(observation, settings, 'blink')) {
        return cast('blink', 2, 'Break the root with Flickerstep.');
    }
    if (observation.controlled)
        return wait('Player is crowd controlled.');
    if (observation.silenced)
        return wait('Player is silenced.');
    if (observation.potionCooldownRemaining <= 0) {
        const healthPotion = availableItem(observation.inventory, HEALTH_POTIONS);
        if (settings.consumables.healthPotion &&
            healthPotion &&
            playerHealth <= settings.consumables.healthPotionHpPct) {
            return { type: 'use-item', itemId: healthPotion, priority: 3, reason: 'Use an emergency health potion.' };
        }
        const manaPotion = availableItem(observation.inventory, MANA_POTIONS);
        if (settings.consumables.manaPotion &&
            manaPotion &&
            currentMana <= settings.consumables.manaPotionManaPct) {
            return { type: 'use-item', itemId: manaPotion, priority: 4, reason: 'Use a mana potion before the reserve is exhausted.' };
        }
    }
    const enemy = selectedEnemy(observation, settings, contextMode);
    const durable = enemy ? durableTarget(observation, enemy, contextMode) : false;
    const cluster = enemy ? fireCluster(observation, enemy) : null;
    const hotStreak = hasAura(player, 'hot_streak');
    const combustionActive = hasAura(player, 'combustion');
    const burstWindow = Boolean(enemy &&
        settings.fire.smartBurst &&
        (pvpMode ? settings.pvp.fireBurst : (!settings.fire.phoenixTranceDurableOnly || durable || (cluster?.count ?? 0) >= 3)));
    if (settings.modules.interrupts &&
        !player.castingAbility &&
        gcdReady &&
        abilityReady(observation, settings, 'counterspell')) {
        const caster = observation.enemies
            .filter((candidate) => candidate.castingAbility && !candidate.dead && distance(player, candidate) <= 30)
            .sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id)[0];
        if (caster) {
            if (observation.currentTargetId !== caster.id) {
                return { type: 'target', targetId: caster.id, priority: 5, reason: `${caster.name} is casting.` };
            }
            return cast('counterspell', 6, `Interrupt ${caster.name}.`);
        }
    }
    const barrierActive = hasAura(player, 'blazing_barrier') || hasAura(player, 'personal_barrier');
    const shouldPreShield = !player.inCombat &&
        settings.safety.buffOutOfCombat &&
        settings.fire.smartPreShield &&
        (contextMode === 'solo' || enemy !== null);
    if (settings.modules.defensives &&
        !player.castingAbility &&
        gcdReady &&
        abilityReady(observation, settings, 'blazing_barrier') &&
        !barrierActive &&
        (shouldPreShield || playerHealth <= (pvpMode ? settings.profiles.pvp.barrierHpPct : settings.fire.barrierHpPct))) {
        return cast('blazing_barrier', 7, player.inCombat
            ? 'Restore Blazing Barrier under pressure.'
            : 'Prepare Blazing Barrier before combat.');
    }
    if (pvpMode &&
        !player.castingAbility &&
        gcdReady &&
        playerHealth <= 0.6 &&
        abilityReady(observation, settings, 'cold_snap') &&
        (player.cooldowns.blink ?? 0) > 0 &&
        (player.cooldowns.blazing_barrier ?? 0) > 0) {
        return cast('cold_snap', 8, 'Reset Flickerstep and Blazing Barrier during sustained PvP pressure.');
    }
    if (!player.inCombat &&
        !player.castingAbility &&
        gcdReady &&
        settings.safety.buffOutOfCombat &&
        observation.aetherInsightNeedsRefresh &&
        abilityReady(observation, settings, 'arcane_intellect')) {
        return cast('arcane_intellect', 9, 'Maintain Aether Insight for the current group.');
    }
    if (!player.inCombat &&
        !player.castingAbility &&
        gcdReady &&
        settings.safety.buffOutOfCombat &&
        !hasAura(player, 'frost_armor') &&
        !hasAura(player, 'buff_armor') &&
        abilityReady(observation, settings, 'frost_armor')) {
        return cast('frost_armor', 10, 'Maintain Hoarfrost Mantle before combat.');
    }
    if (!player.inCombat &&
        !enemy &&
        !player.castingAbility &&
        gcdReady &&
        currentMana <= settings.fire.aetherwellManaPct &&
        abilityReady(observation, settings, 'evocation')) {
        return cast('evocation', 11, 'Channel Aetherwell safely between pulls.');
    }
    if (!enemy)
        return wait(pvpMode
            ? 'No valid PvP opponent is selected or visible in range.'
            : 'No valid PvE enemy is selected or engaged in range.');
    if (observation.currentTargetId !== enemy.id) {
        return { type: 'target', targetId: enemy.id, priority: 12, reason: `Target ${enemy.name} for the Fire rotation.` };
    }
    if (pvpMode && settings.pvp.fireAutoAttack && !player.autoAttacking) {
        return {
            type: 'start-attack',
            targetId: enemy.id,
            priority: 13,
            reason: 'Arm the wand auto-attack so it fires while moving whenever line of sight is clear.',
        };
    }
    const nearbyAttackers = observation.enemies.filter((candidate) => candidate.hostile && !candidate.dead && !protectedControl(candidate) && distance(player, candidate) <= 10);
    if (pvpMode &&
        !player.castingAbility &&
        gcdReady &&
        abilityReady(observation, settings, 'frost_nova') &&
        (nearbyAttackers.length >= settings.pvp.frostNovaEnemyCount ||
            (nearbyAttackers.length > 0 && playerHealth < settings.pvp.frostNovaHpPct))) {
        return cast('frost_nova', 14, `Root ${nearbyAttackers.length} nearby attacker${nearbyAttackers.length === 1 ? '' : 's'}.`, undefined, enemy.id);
    }
    if (pvpMode &&
        !player.castingAbility &&
        gcdReady &&
        abilityReady(observation, settings, 'polymorph') &&
        Math.min(...observation.party.map(hpPct)) < settings.pvp.polymorphHpPct) {
        const secondary = observation.enemies
            .filter((candidate) => candidate.id !== enemy.id && !candidate.dead && !protectedControl(candidate) && distance(player, candidate) <= 30)
            .sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id)[0];
        if (secondary)
            return cast('polymorph', 15, `Control ${secondary.name} while the team is pressured.`, secondary.id);
    }
    if (pvpMode &&
        !player.castingAbility &&
        gcdReady &&
        nearbyAttackers.length >= 2 &&
        abilityReady(observation, settings, 'rings_of_frost')) {
        return castAt('rings_of_frost', 16, 'Place Ring of Frost around the melee pressure.', player.x, player.z, enemy.id);
    }
    // The official PvE harness places Rune before opening Phoenix Trance. Keep
    // it above the off-GCD weave so a ready Trance cannot jump the opener.
    if (!pvpMode &&
        !player.castingAbility &&
        gcdReady &&
        burstWindow &&
        !conservingMana &&
        abilityReady(observation, settings, 'rune_of_power')) {
        return cast('rune_of_power', 16, 'Place Rune of Power before the PvE Fire burst.', undefined, enemy.id);
    }
    // Phoenix Trance and Cinderfall are off the global cooldown and Cinderfall
    // remains usable during another cast. Keep this block before the cast/GCD
    // wait so the official burst loop can weave both without clipping Cinderbolt.
    if (burstWindow &&
        !conservingMana &&
        !combustionActive &&
        abilityReady(observation, settings, 'combustion')) {
        return cast('combustion', 17, pvpMode
            ? 'Open the Fire PvP burst with Phoenix Trance.'
            : 'Open the durable-target burst with Phoenix Trance.', undefined, enemy.id);
    }
    if (!hotStreak &&
        distance(player, enemy) <= 20 &&
        abilityReady(observation, settings, 'fire_blast')) {
        return cast('fire_blast', 18, combustionActive
            ? 'Dump Cinderfall inside Phoenix Trance to build Hot Streak.'
            : 'Use the guaranteed Cinderfall critical to build Hot Streak.', enemy.id);
    }
    if (player.castingAbility || player.channeling) {
        return wait(`Casting ${player.castingAbility ?? 'a channel'}; off-GCD Fire actions are already checked.`);
    }
    if (!gcdReady)
        return wait('Waiting for the global cooldown.');
    if (currentMana <= settings.fire.stopDamageManaPct && !hotStreak) {
        return wait('Fire damage is paused at the configured emergency mana floor.');
    }
    if (hotStreak) {
        if (settings.fire.smartBurst &&
            abilityReady(observation, settings, 'power_echo') &&
            !hasAura(player, 'power_echo')) {
            return cast('power_echo', 20, 'Arm Power Echo for the instant Hot Streak spender.', undefined, enemy.id);
        }
        if (settings.fire.smartBurst &&
            !conservingMana &&
            abilityReady(observation, settings, 'overload') &&
            !hasAura(player, 'overload')) {
            return cast('overload', 21, 'Amplify the free Hot Streak spender with Overload.', undefined, enemy.id);
        }
        if (cluster?.aoeSafe &&
            cluster.count >= settings.fire.flamestrikeEnemyCount &&
            abilityReady(observation, settings, 'flamestrike')) {
            return castAt('flamestrike', 22, `Spend Hot Streak on ${cluster.count} clustered enemies.`, cluster.center.x, cluster.center.z, enemy.id);
        }
        if (abilityReady(observation, settings, 'pyroblast')) {
            return cast('pyroblast', 23, 'Spend Hot Streak on an instant, free Pyrelance.', enemy.id);
        }
    }
    if (burstWindow &&
        !conservingMana &&
        abilityReady(observation, settings, 'presence_of_mind') &&
        !hasAura(player, 'next_cast_instant')) {
        return cast('presence_of_mind', 24, 'Prepare an instant Pyrelance with Racing Mind.', undefined, enemy.id);
    }
    if (hasAura(player, 'next_cast_instant') && abilityReady(observation, settings, 'pyroblast')) {
        return cast('pyroblast', 25, 'Spend Racing Mind on an instant Pyrelance.', enemy.id);
    }
    if (!conservingMana &&
        abilityReady(observation, settings, 'meteor') &&
        cluster?.aoeSafe &&
        (pvpMode ||
            cluster.count >= settings.fire.meteorEnemyCount ||
            (settings.fire.useMeteorSingleTarget && durable))) {
        return castAt('meteor', 26, pvpMode
            ? 'Drop Meteor into the active Fire PvP burst.'
            : cluster.count >= settings.fire.meteorEnemyCount
                ? `Drop Meteor on ${cluster.count} clustered enemies.`
                : 'Drop Meteor on the durable PvE target.', cluster.center.x, cluster.center.z, enemy.id);
    }
    const breathTargets = observation.enemies.filter((candidate) => candidate.hostile && !candidate.dead && !protectedControl(candidate) && distance(player, candidate) <= 12).length;
    if (!conservingMana &&
        abilityReady(observation, settings, 'dragons_breath') &&
        ((pvpMode && breathTargets >= 2) ||
            (!pvpMode && settings.fire.useDragonsBreathPve && breathTargets >= settings.fire.dragonsBreathEnemyCount))) {
        return cast('dragons_breath', 27, `Hold Dragon's Breath to its automatic stage-IV release for ${breathTargets} nearby enemies.`, undefined, enemy.id);
    }
    if (!conservingMana &&
        cluster?.aoeSafe &&
        cluster.count >= settings.fire.flamestrikeEnemyCount &&
        abilityReady(observation, settings, 'flamestrike')) {
        return castAt('flamestrike', 28, `Hard-cast Flamestrike on ${cluster.count} clustered enemies.`, cluster.center.x, cluster.center.z, enemy.id);
    }
    if (pvpMode &&
        burstWindow &&
        abilityReady(observation, settings, 'ice_floes') &&
        !hasAura(player, 'ice_floes')) {
        return cast('ice_floes', 29, 'Enable two moving Fire casts for the PvP pressure window.', undefined, enemy.id);
    }
    if (abilityReady(observation, settings, 'scorch') &&
        (pvpMode || conservingMana || enemy.hp <= enemy.maxHp * 0.3)) {
        return cast('scorch', 30, pvpMode
            ? 'Use mobile Scald pressure while the opponent moves.'
            : conservingMana
                ? 'Use mana-efficient Scald while conserving.'
                : 'Use guaranteed-critical Scald in execute range.', enemy.id);
    }
    if (abilityReady(observation, settings, 'fireball')) {
        return cast('fireball', 31, 'Build Fire criticals and Ignition with Cinderbolt.', enemy.id);
    }
    if (abilityReady(observation, settings, 'scorch')) {
        return cast('scorch', 32, 'Use Scald while the main Fire builder is unavailable.', enemy.id);
    }
    return wait('No enabled Fire ability is ready.');
}
