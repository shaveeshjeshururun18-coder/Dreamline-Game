import { HOME_CENTER, WATER_LEVEL, WORLD_PLAYABLE_RADIUS, isOceanAt, walkableHeightAt } from './terrain';
import { AVS_HELIPAD_WORLD_POS, AVS_SNOW_HOUSE_ROT_Y } from './frozenKingdom';

export type SkyExplorerPadId = 'home' | 'avs';

export interface SkyExplorerState {
  name: string;
  tamilName: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  forwardSpeed: number;
  verticalSpeed: number;
  yawRate: number;
  roll: number;
  pitch: number;
  speedKmh: number;
  altitudeM: number;
  boostActive: boolean;
}

/**
 * Rooftop Helipad mounted cleanly above My Home (En Illam) at (-22, 10.4, -16).
 */
export const HOME_HELIPAD_POS = {
  x: HOME_CENTER.x,
  y: 10.4,
  z: HOME_CENTER.z,
  heading: 0.25,
} as const;

/**
 * Rooftop Helipad mounted cleanly atop the expanded AVS Snow Residence facing Frozen Mirror Lake.
 */
export const AVS_HELIPAD_POS = {
  x: AVS_HELIPAD_WORLD_POS.x,
  y: AVS_HELIPAD_WORLD_POS.y,
  z: AVS_HELIPAD_WORLD_POS.z,
  heading: AVS_SNOW_HOUSE_ROT_Y,
} as const;

/**
 * Primary Sky Explorer pad defaults to the Rooftop Helipad directly above My Home (En Illam).
 */
export const SKY_EXPLORER_PAD_POS = { x: HOME_HELIPAD_POS.x, z: HOME_HELIPAD_POS.z } as const;

export function createSkyExplorerAtHelipad(pad: SkyExplorerPadId = 'home'): SkyExplorerState {
  const target = pad === 'avs' ? AVS_HELIPAD_POS : HOME_HELIPAD_POS;
  return {
    name: 'SSJ Tropical Sky Explorer',
    tamilName: 'வான்வழி மூங்கில் படகு',
    x: target.x,
    y: target.y + 1.55,
    z: target.z,
    heading: target.heading,
    forwardSpeed: 0,
    verticalSpeed: 0,
    yawRate: 0,
    roll: 0,
    pitch: 0,
    speedKmh: 0,
    altitudeM: Math.round(target.y + 1.55),
    boostActive: false,
  };
}

export function createInitialSkyExplorerState(): SkyExplorerState {
  return createSkyExplorerAtHelipad('home');
}

/**
 * Pure 3D flight kinematics for the SSJ Tropical Sky Explorer flying bamboo raft hover-car.
 * Supports full open-world flight across mainland, ocean, SSJ Dinosaur Island, and Frozen Kingdom!
 */
export function stepSkyExplorerState(
  state: SkyExplorerState,
  forwardInput: number, // -1..1
  steerRight: number, // -1 (left) .. +1 (right)
  ascend: boolean,
  descend: boolean,
  boost: boolean,
  dt: number
): SkyExplorerState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  const maxSpd = boost ? 54.0 : 32.0;

  let targetFwd = 0;
  if (forwardInput > 0.04) targetFwd = forwardInput * maxSpd;
  else if (forwardInput < -0.04) targetFwd = forwardInput * 15.0;

  const fwdRate = Math.abs(forwardInput) > 0.04 ? (boost ? 3.2 : 2.4) : 2.0;
  const forwardSpeed = state.forwardSpeed + (targetFwd - state.forwardSpeed) * (1 - Math.exp(-fwdRate * cdt));

  const targetYawRate = -steerRight * 1.55;
  const yawRate = state.yawRate + (targetYawRate - state.yawRate) * (1 - Math.exp(-5.5 * cdt));
  const heading = state.heading + yawRate * cdt;

  const vertDir = (ascend ? 1 : 0) - (descend ? 1 : 0);
  const targetVert = vertDir * (boost ? 22.0 : 14.0);
  const verticalSpeed = state.verticalSpeed + (targetVert - state.verticalSpeed) * (1 - Math.exp(-4.5 * cdt));

  let x = state.x + Math.sin(heading) * forwardSpeed * cdt;
  let z = state.z + Math.cos(heading) * forwardSpeed * cdt;
  let y = state.y + verticalSpeed * cdt;

  // Keep cleanly within the vast playable sky dome
  const maxR = WORLD_PLAYABLE_RADIUS - 12;
  const r = Math.hypot(x, z);
  if (r > maxR) {
    const s = maxR / r;
    x *= s;
    z *= s;
  }

  const surfaceY = Math.max(walkableHeightAt(x, z), WATER_LEVEL);
  const minHoverY = surfaceY + 1.55;
  const maxFlightY = 145;
  let clampedVert = verticalSpeed;
  if (y < minHoverY) {
    y = minHoverY;
    if (clampedVert < 0) clampedVert = 0;
  } else if (y > maxFlightY) {
    y = maxFlightY;
    if (clampedVert > 0) clampedVert = 0;
  }

  // Smooth aerodynamic banking (roll on turn, pitch on speed/climb)
  const targetRoll = -yawRate * 0.26;
  const targetPitch = (forwardSpeed / maxSpd) * 0.14 - clampedVert * 0.009;
  const roll = state.roll + (targetRoll - state.roll) * (1 - Math.exp(-6.0 * cdt));
  const pitch = state.pitch + (targetPitch - state.pitch) * (1 - Math.exp(-5.2 * cdt));

  const speedKmh = Math.round(Math.abs(forwardSpeed) * 3.2 + (vertDir !== 0 ? 12 : 0));
  const altitudeM = Math.max(0, Math.round(y - surfaceY));

  return {
    ...state,
    x,
    y,
    z,
    heading,
    forwardSpeed,
    verticalSpeed: clampedVert,
    yawRate,
    roll,
    pitch,
    speedKmh,
    altitudeM,
    boostActive: boost && (Math.abs(forwardInput) > 0.05 || vertDir !== 0),
  };
}

/**
 * Computes a safe dismount position beside the SSJ Sky Explorer (auto-lands cleanly on nearby ground).
 */
export function getSkyExplorerExitPosition(state: SkyExplorerState): { x: number; y: number; z: number } {
  let ex = state.x - Math.cos(state.heading) * 4.2;
  let ez = state.z + Math.sin(state.heading) * 4.2;
  if (isOceanAt(ex, ez)) {
    // Keep player right beside the hovering raft even over open water (player can swim!)
    return { x: ex, y: WATER_LEVEL + 0.25, z: ez };
  }
  const ey = walkableHeightAt(ex, ez);
  return { x: ex, y: ey, z: ez };
}
