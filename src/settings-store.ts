import { copyDefaultSettings } from './defaults.js';
import type { AssistProfile, AssistSettings } from './types.js';

const STORAGE_KEY = 'chronopilot.settings.v1';

function mergeSettings(saved: Partial<AssistSettings>): AssistSettings {
  const defaults = copyDefaultSettings();
  const legacySettings = (saved.settingsVersion ?? 0) < defaults.settingsVersion;
  const predatesOneSecondEchoRefresh = (saved.settingsVersion ?? 0) < 8;
  const predatesAggressivePvpPreset = (saved.settingsVersion ?? 0) < 11;
  const predatesAetherInsight = saved.abilities?.arcane_intellect === undefined;
  const legacyMode = saved.mode as string | undefined;
  const mode = legacyMode === 'questing-hybrid'
    ? 'solo'
    : legacyMode === 'group-healer'
      ? 'auto'
      : saved.mode;
  const resurrectionEnabled = typeof saved.modules?.resurrection === 'boolean'
    ? saved.modules.resurrection
    : Boolean(
        saved.abilities?.temporal_reversal ||
        saved.abilities?.collective_reversal,
      );
  const pvpEnabled = saved.pvp?.enabled ?? (saved.safety?.disableInPvp === false ? true : defaults.pvp.enabled);
  const savedAssistProfile = saved.assistProfile as string | undefined;
  const assistProfile: AssistProfile =
    savedAssistProfile === 'chronomancy-healer' || savedAssistProfile === 'frost-pve'
      ? savedAssistProfile
      : 'auto';
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
      perfect_moment: legacySettings
        ? false
        : (saved.abilities?.perfect_moment ?? defaults.abilities.perfect_moment),
    },
    frostAbilities: { ...defaults.frostAbilities, ...saved.frostAbilities },
    profiles: {
      solo: { ...defaults.profiles.solo, ...saved.profiles?.solo },
      party: { ...defaults.profiles.party, ...saved.profiles?.party },
      raid: { ...defaults.profiles.raid, ...saved.profiles?.raid },
      pvp: {
        ...defaults.profiles.pvp,
        ...saved.profiles?.pvp,
        ...(predatesAggressivePvpPreset
          ? {
              mendHpPct: 0.72,
              barrierHpPct: 0.88,
              emergencyHpPct: 0.52,
              conserveManaPct: 0,
              stopDamageManaPct: 0,
            }
          : {}),
      },
    },
    frost: { ...defaults.frost, ...saved.frost },
    thresholds: {
      ...defaults.thresholds,
      ...saved.thresholds,
      ...(predatesOneSecondEchoRefresh ? { echoRefreshSeconds: 1 } : {}),
      smartPerfectMoment: legacySettings
        ? false
        : (saved.thresholds?.smartPerfectMoment ?? defaults.thresholds.smartPerfectMoment),
    },
    targeting: { ...defaults.targeting, ...saved.targeting },
    consumables: { ...defaults.consumables, ...saved.consumables },
    pvp: {
      ...defaults.pvp,
      ...saved.pvp,
      enabled: pvpEnabled,
      ...(predatesAggressivePvpPreset
        ? {
            minSurgeCharges: 1,
            maxSurgeCharges: 4,
            iceBlockHpPct: 0.45,
            hourglassHpPct: 0.4,
          }
        : {}),
    },
    safety: {
      ...defaults.safety,
      ...saved.safety,
      disableInPvp: !pvpEnabled,
      ...(predatesAetherInsight ? { buffOutOfCombat: true } : {}),
    },
  };
}

export function loadSettings(storage: Pick<Storage, 'getItem'> = localStorage): AssistSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return copyDefaultSettings();
    const parsed = JSON.parse(raw) as Partial<AssistSettings>;
    return mergeSettings(parsed);
  } catch {
    return copyDefaultSettings();
  }
}

export function saveSettings(
  settings: AssistSettings,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistence is optional in private or locked-down browser contexts.
  }
}
