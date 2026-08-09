import { copyDefaultSettings } from './defaults.js';
import { decideFire, resolveAssistProfile } from './fire-policy.js';
import { planAoeDodge } from './aoe-dodge.js';
import { decideChronomancy, resolveContextMode } from './policy.js';
import { observeWocWorld, } from './woc-adapter.js';
const WAITING = { type: 'wait', priority: 999, reason: 'Assist is paused.' };
export class ChronoPilotController {
    world;
    options;
    settings;
    active = false;
    pausedUntil = 0;
    nextDecisionAt = 0;
    pendingUntil = 0;
    detectedMode = 'solo';
    detectedProfile = 'chronomancy-healer';
    decision = WAITING;
    aoeMovementActive = false;
    nextEmergencyBlinkAt = 0;
    memory = {
        individualEchoTargetId: null,
        individualEchoExpiresAt: 0,
        aetherInsightRosterKey: null,
        lastEnemyTargetId: null,
    };
    constructor(world, options = {}) {
        this.world = world;
        this.options = options;
        this.settings = options.settings ?? copyDefaultSettings();
    }
    get status() {
        return {
            active: this.active,
            pausedUntil: this.pausedUntil,
            detectedMode: this.detectedMode,
            detectedProfile: this.detectedProfile,
            decision: this.decision,
        };
    }
    partyMembers() {
        return (this.world.partyInfo?.members ?? []).map((member) => ({
            id: member.pid,
            name: member.name,
            role: member.role,
        }));
    }
    start() {
        this.active = true;
        this.nextDecisionAt = 0;
        this.emitStatus();
    }
    stop(reason = 'Assist is paused.') {
        this.active = false;
        this.releaseAoeMovement();
        this.decision = { type: 'wait', priority: 999, reason };
        this.emitStatus();
    }
    dispose() {
        this.releaseAoeMovement();
    }
    toggle() {
        if (this.active)
            this.stop();
        else
            this.start();
    }
    notifyManualAbilityInput(now = performance.now()) {
        this.pausedUntil = now + this.settings.safety.manualOverrideMs;
        // Manual input pauses decisions, but it does not prove that the existing
        // individual Echo disappeared. Keep the confirmed target/expiry so a Tab
        // press or manual spell cannot make the assist spend mana reapplying Echo.
        this.decision = { type: 'wait', priority: 999, reason: 'Manual input override is active.' };
        this.emitStatus();
    }
    tick(now = performance.now()) {
        if (!this.active)
            return this.decision;
        const aoeDecision = this.updateAoeDodge(now);
        if (aoeDecision) {
            this.decision = aoeDecision;
            this.emitStatus();
            return this.decision;
        }
        if (now < this.pausedUntil)
            return this.decision;
        if (now < this.nextDecisionAt || now < this.pendingUntil)
            return this.decision;
        this.nextDecisionAt = now + this.settings.safety.decisionIntervalMs;
        // A full observation walks nearby entities and copies their actionable
        // combat state. None of that work can produce a legal new action while the
        // player is already casting, channeling, or on the global cooldown, so keep
        // the renderer thread free for the game until it can act again.
        const fireCanWeaveOffGcd = this.settings.assistProfile === 'fire-dps' ||
            this.world.talentSpec === 'fire' ||
            this.detectedProfile === 'fire-dps';
        if (!fireCanWeaveOffGcd &&
            (this.world.player.castingAbility ||
                this.world.player.channeling ||
                this.world.player.gcdRemaining > 0.05)) {
            return this.decision;
        }
        const observation = observeWocWorld(this.world, this.settings, this.memory, now);
        this.detectedProfile = resolveAssistProfile(observation, this.settings);
        const next = this.detectedProfile === 'fire-dps'
            ? decideFire(observation, this.settings)
            : decideChronomancy(observation, this.settings);
        this.detectedMode = resolveContextMode(observation, this.settings);
        this.decision = next;
        try {
            if (next.type === 'cast') {
                const visibleTargetId = next.selectTargetId ?? next.targetId;
                const visibleTarget = visibleTargetId === undefined
                    ? null
                    : observation.party.find((member) => member.id === visibleTargetId) ??
                        observation.enemies.find((enemy) => enemy.id === visibleTargetId) ??
                        null;
                const showActionSelection = this.settings.targeting.streamTargetSelection &&
                    visibleTarget !== null &&
                    this.world.player.targetId !== visibleTarget.id;
                if (showActionSelection)
                    this.world.targetEntity(visibleTarget.id);
                if (next.targetId === undefined)
                    this.world.castAbility(next.abilityId);
                else
                    this.world.castAbilityOn(next.abilityId, next.targetId);
                if (next.abilityId === 'temporal_echo' && next.targetId !== undefined) {
                    this.memory.individualEchoTargetId = next.targetId;
                    this.memory.individualEchoExpiresAt = now + 15_000;
                }
                if (next.abilityId === 'arcane_intellect') {
                    this.memory.aetherInsightRosterKey = observation.partyRosterKey;
                }
                this.pendingUntil = now + 350;
            }
            else if (next.type === 'cast-at') {
                const visibleTarget = next.targetId === undefined
                    ? null
                    : observation.party.find((member) => member.id === next.targetId) ??
                        observation.enemies.find((enemy) => enemy.id === next.targetId) ??
                        null;
                if (this.settings.targeting.streamTargetSelection &&
                    visibleTarget &&
                    this.world.player.targetId !== visibleTarget.id) {
                    this.world.targetEntity(visibleTarget.id);
                }
                this.world.castAbilityAt(next.abilityId, { x: next.x, z: next.z });
                this.pendingUntil = now + 350;
            }
            else if (next.type === 'target') {
                this.world.targetEntity(next.targetId);
                this.pendingUntil = now + 200;
            }
            else if (next.type === 'start-attack') {
                this.world.startAutoAttack?.();
                this.pendingUntil = now + 150;
            }
            else if (next.type === 'use-item') {
                this.world.useItem(next.itemId);
                this.pendingUntil = now + 350;
            }
        }
        catch {
            this.decision = {
                type: 'wait',
                priority: 999,
                reason: 'The action was interrupted or refused. It will retry when ready.',
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
        }
        catch {
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
            surface: false,
        }, plan.facing);
        const fireProfile = this.world.talentSpec === 'fire' || this.detectedProfile === 'fire-dps';
        const blinkEnabled = fireProfile
            ? this.settings.fireAbilities.blink
            : this.settings.abilities.blink;
        const blinkKnown = this.world.known.some((ability) => ability.def.id === 'blink');
        const blinkReady = (this.world.player.cooldowns.get('blink') ?? 0) <= 0.05;
        const rooted = this.world.player.auras.some((aura) => aura.kind === 'root');
        const useEmergencyBlink = plan.blinkSafe &&
            blinkEnabled &&
            blinkKnown &&
            blinkReady &&
            now >= this.nextEmergencyBlinkAt &&
            (rooted || plan.needsEmergencyBlink);
        if (useEmergencyBlink) {
            try {
                movement.setControllerFacing?.(plan.facing);
                this.world.castAbility('blink');
                this.nextEmergencyBlinkAt = now + 1_000;
                return {
                    type: 'cast',
                    abilityId: 'blink',
                    priority: 0,
                    reason: 'Dodging AoE — emergency Flickerstep, then resume combat.',
                };
            }
            catch {
                // Walking is already active and remains the safe fallback.
            }
        }
        return {
            type: 'move',
            x: plan.x,
            z: plan.z,
            priority: 0,
            reason: 'Dodging AoE — moving to the nearest safe edge.',
        };
    }
    releaseAoeMovement() {
        if (!this.aoeMovementActive)
            return;
        this.aoeMovementActive = false;
        this.options.movement?.clearControllerMoveInput();
        this.nextDecisionAt = 0;
    }
    emitStatus() {
        this.options.onStatus?.(this.status);
    }
}
