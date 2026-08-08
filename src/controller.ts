import { copyDefaultSettings } from './defaults.js';
import { decideFrost, resolveAssistProfile } from './frost-policy.js';
import { decideChronomancy, resolveContextMode } from './policy.js';
import type {
  AssistDecision,
  AssistSettings,
  CombatContextMode,
  ControllerStatus,
  ResolvedAssistProfile,
  RuntimeMemory,
} from './types.js';
import { observeWocWorld, type WocWorldLike } from './woc-adapter.js';

const WAITING: AssistDecision = { type: 'wait', priority: 999, reason: 'Assist is paused.' };

export interface ChronoPilotControllerOptions {
  settings?: AssistSettings;
  onStatus?: (status: ControllerStatus) => void;
}

export class ChronoPilotController {
  readonly settings: AssistSettings;
  private active = false;
  private pausedUntil = 0;
  private nextDecisionAt = 0;
  private pendingUntil = 0;
  private detectedMode: CombatContextMode = 'solo';
  private detectedProfile: ResolvedAssistProfile = 'chronomancy-healer';
  private decision: AssistDecision = WAITING;
  private readonly memory: RuntimeMemory = {
    individualEchoTargetId: null,
    individualEchoExpiresAt: 0,
    aetherInsightRosterKey: null,
    lastEnemyTargetId: null,
  };

  constructor(
    private readonly world: WocWorldLike,
    private readonly options: ChronoPilotControllerOptions = {},
  ) {
    this.settings = options.settings ?? copyDefaultSettings();
  }

  get status(): ControllerStatus {
    return {
      active: this.active,
      pausedUntil: this.pausedUntil,
      detectedMode: this.detectedMode,
      detectedProfile: this.detectedProfile,
      decision: this.decision,
    };
  }

  partyMembers(): Array<{ id: number; name: string; role?: 'tank' | 'healer' | 'dps' }> {
    return (this.world.partyInfo?.members ?? []).map((member) => ({
      id: member.pid,
      name: member.name,
      role: member.role,
    }));
  }

  start(): void {
    this.active = true;
    this.nextDecisionAt = 0;
    this.emitStatus();
  }

  stop(reason = 'Assist is paused.'): void {
    this.active = false;
    this.decision = { type: 'wait', priority: 999, reason };
    this.emitStatus();
  }

  toggle(): void {
    if (this.active) this.stop();
    else this.start();
  }

  notifyManualAbilityInput(now = performance.now()): void {
    this.pausedUntil = now + this.settings.safety.manualOverrideMs;
    // Manual input pauses decisions, but it does not prove that the existing
    // individual Echo disappeared. Keep the confirmed target/expiry so a Tab
    // press or manual spell cannot make the assist spend mana reapplying Echo.
    this.decision = { type: 'wait', priority: 999, reason: 'Manual input override is active.' };
    this.emitStatus();
  }

  tick(now = performance.now()): AssistDecision {
    if (!this.active) return this.decision;
    if (now < this.pausedUntil) return this.decision;
    if (now < this.nextDecisionAt || now < this.pendingUntil) return this.decision;
    this.nextDecisionAt = now + this.settings.safety.decisionIntervalMs;

    const observation = observeWocWorld(this.world, this.settings, this.memory, now);
    this.detectedProfile = resolveAssistProfile(observation, this.settings);
    const next = this.detectedProfile === 'frost-pve'
      ? decideFrost(observation, this.settings)
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
        const showActionSelection =
          this.settings.targeting.streamTargetSelection &&
          visibleTarget !== null &&
          this.world.player.targetId !== visibleTarget.id;
        if (showActionSelection) this.world.targetEntity(visibleTarget.id);
        if (next.targetId === undefined) this.world.castAbility(next.abilityId);
        else this.world.castAbilityOn(next.abilityId, next.targetId);
        if (next.abilityId === 'temporal_echo' && next.targetId !== undefined) {
          this.memory.individualEchoTargetId = next.targetId;
          this.memory.individualEchoExpiresAt = now + 15_000;
        }
        if (next.abilityId === 'arcane_intellect') {
          this.memory.aetherInsightRosterKey = observation.partyRosterKey;
        }
        this.pendingUntil = now + 350;
      } else if (next.type === 'cast-at') {
        const visibleTarget = next.targetId === undefined
          ? null
          : observation.party.find((member) => member.id === next.targetId) ??
            observation.enemies.find((enemy) => enemy.id === next.targetId) ??
            null;
        if (
          this.settings.targeting.streamTargetSelection &&
          visibleTarget &&
          this.world.player.targetId !== visibleTarget.id
        ) {
          this.world.targetEntity(visibleTarget.id);
        }
        this.world.castAbilityAt(next.abilityId, { x: next.x, z: next.z });
        this.pendingUntil = now + 350;
      } else if (next.type === 'target') {
        this.world.targetEntity(next.targetId);
        this.pendingUntil = now + 200;
      } else if (next.type === 'use-item') {
        this.world.useItem(next.itemId);
        this.pendingUntil = now + 350;
      }
    } catch {
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

  private emitStatus(): void {
    this.options.onStatus?.(this.status);
  }

}
