import { describe, expect, it } from 'vitest';
import { isSafeSettingPath } from '../src/settings-path.js';

describe('desktop setting path validation', () => {
  it('accepts ability IDs containing underscores', () => {
    expect(isSafeSettingPath('abilities.temporal_reversal')).toBe(true);
    expect(isSafeSettingPath('abilities.collective_reversal')).toBe(true);
    expect(isSafeSettingPath('abilities.arcane_missiles')).toBe(true);
    expect(isSafeSettingPath('fireAbilities.pyroblast')).toBe(true);
    expect(isSafeSettingPath('frost.smartGlacialBurst')).toBe(true);
  });

  it('rejects prototype pollution and malformed paths', () => {
    expect(isSafeSettingPath('abilities.__proto__.enabled')).toBe(false);
    expect(isSafeSettingPath('abilities.constructor.enabled')).toBe(false);
    expect(isSafeSettingPath('abilities.temporal reversal')).toBe(false);
  });
});
