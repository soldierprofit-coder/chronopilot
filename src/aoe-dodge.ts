export interface AoeDangerZone {
  x: number;
  z: number;
  radius: number;
  remaining: number;
}

export interface AoeDodgePlan {
  x: number;
  z: number;
  facing: number;
  distance: number;
  remaining: number;
  blinkSafe: boolean;
  needsEmergencyBlink: boolean;
}

export const AOE_SAFETY_MARGIN = 1;
export const AOE_REACTION_BUFFER_SECONDS = 0.25;
export const ASSUMED_RUN_SPEED = 7;
export const FLICKERSTEP_DISTANCE = 15;

const ANGLE_STEPS = 32;
const DISTANCE_STEP = 0.5;
const MAX_ESCAPE_DISTANCE = 28;
const EXIT_CLEARANCE = 0.25;

function finiteZone(zone: AoeDangerZone): boolean {
  return (
    Number.isFinite(zone.x) &&
    Number.isFinite(zone.z) &&
    Number.isFinite(zone.radius) &&
    Number.isFinite(zone.remaining) &&
    zone.radius > 0 &&
    zone.remaining > 0
  );
}

function distanceSquared(
  a: { x: number; z: number },
  b: { x: number; z: number },
): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function inside(
  point: { x: number; z: number },
  zone: AoeDangerZone,
  margin: number,
): boolean {
  return distanceSquared(point, zone) <= (zone.radius + margin) ** 2;
}

function pathEntersNewZone(
  start: { x: number; z: number },
  end: { x: number; z: number },
  zones: readonly AoeDangerZone[],
): boolean {
  const distance = Math.sqrt(distanceSquared(start, end));
  const samples = Math.max(2, Math.ceil(distance / DISTANCE_STEP));
  for (const zone of zones) {
    if (inside(start, zone, AOE_SAFETY_MARGIN)) continue;
    for (let step = 1; step < samples; step++) {
      const t = step / samples;
      const point = {
        x: start.x + (end.x - start.x) * t,
        z: start.z + (end.z - start.z) * t,
      };
      if (inside(point, zone, AOE_SAFETY_MARGIN)) return true;
    }
  }
  return false;
}

function preferredEscapeAngle(
  player: { x: number; z: number },
  danger: readonly AoeDangerZone[],
): number {
  let dx = 0;
  let dz = 0;
  for (const zone of danger) {
    const awayX = player.x - zone.x;
    const awayZ = player.z - zone.z;
    const length = Math.hypot(awayX, awayZ);
    const weight = 1 / Math.max(0.05, zone.remaining);
    if (length > 0.001) {
      dx += (awayX / length) * weight;
      dz += (awayZ / length) * weight;
    }
  }
  return Math.hypot(dx, dz) > 0.001 ? Math.atan2(dx, dz) : 0;
}

/**
 * Finds the shortest straight-line exit from the union of active Rift danger
 * circles. The game intentionally leaves a walkable escape window; sampling
 * several headings also keeps stacked S-rank circles from steering the player
 * into a second telegraph.
 */
export function planAoeDodge(
  player: { x: number; z: number },
  source: readonly AoeDangerZone[],
  continuing = false,
): AoeDodgePlan | null {
  const zones = source.filter(finiteZone);
  const triggerMargin = continuing ? AOE_SAFETY_MARGIN : 0;
  const danger = zones.filter((zone) => inside(player, zone, triggerMargin));
  if (danger.length === 0) return null;

  const preferred = preferredEscapeAngle(player, danger);
  let best: { x: number; z: number; angle: number; distance: number; score: number } | null = null;

  for (let index = 0; index < ANGLE_STEPS; index++) {
    const offsetIndex = index === 0 ? 0 : Math.ceil(index / 2) * (index % 2 === 1 ? 1 : -1);
    const angle = preferred + (offsetIndex * Math.PI * 2) / ANGLE_STEPS;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    for (let distance = DISTANCE_STEP; distance <= MAX_ESCAPE_DISTANCE; distance += DISTANCE_STEP) {
      const point = { x: player.x + sin * distance, z: player.z + cos * distance };
      if (zones.some((zone) => inside(point, zone, AOE_SAFETY_MARGIN + EXIT_CLEARANCE))) continue;
      if (pathEntersNewZone(player, point, zones)) break;
      const score = distance + Math.abs(offsetIndex) * 0.015;
      if (!best || score < best.score) best = { ...point, angle, distance, score };
      break;
    }
  }

  if (!best) return null;
  const blinkLanding = {
    x: player.x + Math.sin(best.angle) * FLICKERSTEP_DISTANCE,
    z: player.z + Math.cos(best.angle) * FLICKERSTEP_DISTANCE,
  };
  const blinkSafe = zones.every(
    (zone) => !inside(blinkLanding, zone, AOE_SAFETY_MARGIN + EXIT_CLEARANCE),
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
    needsEmergencyBlink: walkSeconds >= remaining,
  };
}
