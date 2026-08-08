import { describe, expect, it } from 'vitest';
import { loadSettings } from '../src/settings-store.js';

describe('settings persistence', () => {
  it('repairs legacy split resurrection settings into one linked feature', () => {
    const storage = {
      getItem: () => JSON.stringify({
        modules: { resurrection: true },
        abilities: {
          temporal_reversal: true,
          collective_reversal: false,
        },
      }),
    };
    const settings = loadSettings(storage);
    expect(settings.modules.resurrection).toBe(true);
    expect(settings.abilities.temporal_reversal).toBe(true);
    expect(settings.abilities.collective_reversal).toBe(true);
    expect(settings.abilities.perfect_moment).toBe(false);
    expect(settings.thresholds.smartPerfectMoment).toBe(false);
    expect(settings.settingsVersion).toBe(12);
    expect(settings.assistProfile).toBe('auto');
    expect(settings.frostAbilities.frostbolt).toBe(true);
    expect(settings.frost.smartProcs).toBe(true);
    expect('fire' in settings).toBe(false);
    expect(settings.safety.toggleHotkey).toBe('[');
    expect(settings.profiles.pvp.conserveManaPct).toBe(0);
    expect(settings.profiles.pvp.stopDamageManaPct).toBe(0);
    expect(settings.pvp.minSurgeCharges).toBe(1);
    expect(settings.pvp.maxSurgeCharges).toBe(4);
    expect(settings.pvp.iceBlockHpPct).toBe(0.45);
    expect(settings.pvp.hourglassHpPct).toBe(0.4);
  });

  it('lets the Resurrection module stay off even when old Reversal toggles are stale', () => {
    const storage = {
      getItem: () => JSON.stringify({
        settingsVersion: 10,
        modules: { resurrection: false },
        abilities: {
          temporal_reversal: true,
          collective_reversal: true,
        },
      }),
    };
    const settings = loadSettings(storage);
    expect(settings.modules.resurrection).toBe(false);
    expect(settings.abilities.temporal_reversal).toBe(false);
    expect(settings.abilities.collective_reversal).toBe(false);
  });

  it('still migrates legacy saves that predate the Resurrection module', () => {
    const storage = {
      getItem: () => JSON.stringify({
        abilities: {
          temporal_reversal: true,
          collective_reversal: false,
        },
      }),
    };
    const settings = loadSettings(storage);
    expect(settings.modules.resurrection).toBe(true);
    expect(settings.abilities.temporal_reversal).toBe(true);
    expect(settings.abilities.collective_reversal).toBe(true);
  });
});
