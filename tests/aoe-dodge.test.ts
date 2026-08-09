import { describe, expect, it } from 'vitest';
import { AOE_SAFETY_MARGIN, planAoeDodge } from '../src/aoe-dodge.js';

describe('Rift AoE dodge planning', () => {
  it('does nothing when the player is outside every active zone', () => {
    expect(planAoeDodge({ x: 20, z: 0 }, [
      { x: 0, z: 0, radius: 9, remaining: 2 },
    ])).toBeNull();
  });

  it('finds the shortest safe edge and includes the safety margin', () => {
    const zone = { x: 0, z: 0, radius: 9, remaining: 3 };
    const plan = planAoeDodge({ x: 4, z: 0 }, [zone]);
    expect(plan).not.toBeNull();
    expect(Math.hypot(plan!.x - zone.x, plan!.z - zone.z)).toBeGreaterThan(
      zone.radius + AOE_SAFETY_MARGIN,
    );
    expect(plan!.distance).toBeLessThan(7);
    expect(plan!.needsEmergencyBlink).toBe(false);
  });

  it('does not choose an exit point inside another S-rank circle', () => {
    const zones = [
      { x: 0, z: 0, radius: 9, remaining: 2.5 },
      { x: 11, z: 0, radius: 9, remaining: 2.5 },
    ];
    const plan = planAoeDodge({ x: 0, z: 0 }, zones);
    expect(plan).not.toBeNull();
    for (const zone of zones) {
      expect(Math.hypot(plan!.x - zone.x, plan!.z - zone.z)).toBeGreaterThan(
        zone.radius + AOE_SAFETY_MARGIN,
      );
    }
  });

  it('requests emergency Flickerstep only when walking cannot beat the fuse', () => {
    const plan = planAoeDodge({ x: 0, z: 0 }, [
      { x: 0, z: 0, radius: 9, remaining: 0.7 },
    ]);
    expect(plan).toMatchObject({ needsEmergencyBlink: true, blinkSafe: true });
  });

  it('continues moving through the one-yard margin after leaving the damage radius', () => {
    const zone = { x: 0, z: 0, radius: 9, remaining: 2 };
    expect(planAoeDodge({ x: 9.5, z: 0 }, [zone], false)).toBeNull();
    expect(planAoeDodge({ x: 9.5, z: 0 }, [zone], true)).not.toBeNull();
    expect(planAoeDodge({ x: 10.1, z: 0 }, [zone], true)).toBeNull();
  });
});
