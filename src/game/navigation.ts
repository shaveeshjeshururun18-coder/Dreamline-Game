import { WATER_LEVEL, walkableHeightAt } from './terrain';

export interface NavigationTarget {
  id: string;
  label: string;
  tamilLabel?: string;
  x: number;
  z: number;
  kind?: 'location' | 'station' | 'custom' | 'midnight_frontier';
}

export interface NavigationHudState {
  target: NavigationTarget;
  distanceMeters: number;
  /** World bearing in radians (0 = +Z, +PI/2 = +X, matching atan2(dx, dz)) */
  worldBearingRad: number;
  /** Relative angle in radians compared to player/camera forward direction (0 = straight ahead, + = right, - = left) */
  relativeAngleRad: number;
  arrived: boolean;
}

export interface NavigationPathPoint {
  x: number;
  y: number;
  z: number;
}

export function normalizeAngleRad(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Computes live distance, world bearing, and relative arrow angle for on-screen & 3D navigation.
 * Note: In DREAMLINE, player heading follows (sin(h), cos(h)) where h = 0 faces +Z and h = +PI/2 faces +X.
 */
export function computeNavigationState(
  playerX: number,
  playerZ: number,
  forwardHeadingRad: number,
  target: NavigationTarget,
  arrivalRadius = 6.5
): NavigationHudState {
  const dx = target.x - playerX;
  const dz = target.z - playerZ;
  const distanceMeters = Math.hypot(dx, dz);
  const worldBearingRad = Math.atan2(dx, dz);
  // Screen compass convention: clockwise positive = target to the right of forward direction.
  // Because turning right decreases heading in Three.js (+Y up, sin(h), cos(h)), clockwise offset is (forward - bearing).
  const relativeAngleRad = normalizeAngleRad(forwardHeadingRad - worldBearingRad);
  return {
    target,
    distanceMeters,
    worldBearingRad,
    relativeAngleRad,
    arrived: distanceMeters <= arrivalRadius,
  };
}

/**
 * Samples a terrain-hugging 3D polyline from player to destination, hovering cleanly above ground & water.
 */
export function sampleNavigationPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  segments = 32
): NavigationPathPoint[] {
  const count = Math.max(2, segments);
  const pts: NavigationPathPoint[] = [];
  for (let i = 0; i <= count; i++) {
    const f = i / count;
    const x = fromX + (toX - fromX) * f;
    const z = fromZ + (toZ - fromZ) * f;
    const ground = walkableHeightAt(x, z);
    const y = Math.max(ground, WATER_LEVEL + 0.12) + 0.48;
    pts.push({ x, y, z });
  }
  return pts;
}
