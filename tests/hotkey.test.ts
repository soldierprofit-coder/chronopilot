import { describe, expect, it } from 'vitest';
import { isToggleHotkey } from '../src/index.js';

describe('assist toggle hotkey', () => {
  it('matches the configured key without case sensitivity', () => {
    expect(isToggleHotkey('[', '[')).toBe(true);
    expect(isToggleHotkey('K', 'k')).toBe(true);
    expect(isToggleHotkey(']', '[')).toBe(false);
  });
});
