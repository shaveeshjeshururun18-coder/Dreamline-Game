import { HOME_CENTER, WATER_LEVEL, WORLD_PLAYABLE_RADIUS, isOceanAt, walkableHeightAt } from './terrain';
import { AVS_HELIPAD_WORLD_POS, AVS_SNOW_HOUSE_ROT_Y } from './frozenKingdom';
import { computeLookToFlyVerticalRate } from './hoverGlider';

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
  inVault?: boolean;
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
  dt: number,
  floorYAt?: (x: number, z: number) => number,
  ceilingY?: number,
  cameraPitch?: number
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
  const lookFly = computeLookToFlyVerticalRate(cameraPitch, forwardInput, {
    neutralPitch: 0.22,
    deadzone: 0.09,
    maxClimbRate: boost ? 22.0 : 15.0,
    maxDiveRate: boost ? 20.0 : 14.0,
  });
  const targetVert = vertDir !== 0 ? vertDir * (boost ? 22.0 : 14.0) : lookFly.verticalRate;
  const verticalSpeed = state.verticalSpeed + (targetVert - state.verticalSpeed) * (1 - Math.exp(-4.5 * cdt));

  let x = state.x + Math.sin(heading) * forwardSpeed * cdt;
  let z = state.z + Math.cos(heading) * forwardSpeed * cdt;
  let y = state.y + verticalSpeed * cdt;

  // Keep cleanly within the vast playable sky dome (bypassed underground where vault bounds govern)
  if (!state.inVault) {
    const maxR = WORLD_PLAYABLE_RADIUS - 12;
    const r = Math.hypot(x, z);
    if (r > maxR) {
      const s = maxR / r;
      x *= s;
      z *= s;
    }
  }

  const surfaceY = floorYAt ? floorYAt(x, z) : Math.max(walkableHeightAt(x, z), WATER_LEVEL);
  const minHoverY = surfaceY + (state.inVault ? 0.65 : 1.55);
  const maxFlightY = ceilingY ?? 145;
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
  const distHome = Math.hypot(state.x - HOME_CENTER.x, state.z - HOME_CENTER.z);
  if (distHome <= 17.5 && state.y >= 8.8) {
    return { x: HOME_CENTER.x + 2.6, y: 10.4, z: HOME_CENTER.z - 2.2 };
  }
  if (isOceanAt(ex, ez)) {
    // Keep player right beside the hovering raft even over open water (player can swim!)
    return { x: ex, y: WATER_LEVEL + 0.25, z: ez };
  }
  const ey = walkableHeightAt(ex, ez);
  return { x: ex, y: ey, z: ez };
}

// =========================================================================
// EXTRACTED SSJ ORANGE RESCUE HELICOPTER (Parked at En Illam · My House!)
// =========================================================================

export type OrangeHeliPadId = 'home' | 'dinosaur_island';

export interface OrangeHeliState {
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
  rotorAngle: number;
  rotorSpeed: number;
  speedKmh: number;
  altitudeM: number;
  boostActive: boolean;
  onGround: boolean;
  inVault?: boolean;
}

/**
 * External East-Wing Rooftop Sky Terrace Pad C (y = 10.4m) on En Illam (My House)!
 * Keeps all 3 aircraft (Pad B VTOL, Pad A Sky Explorer, Pad C Orange Rescue Helicopter)
 * cleanly organized on the elevated external rooftop terrace — zero clutter in the yard below!
 */
export const ORANGE_HELI_HOME_POS = {
  x: HOME_CENTER.x + 11.4, // -10.6 (External East Rooftop Terrace Pad C!)
  y: 10.4,
  z: HOME_CENTER.z, // -16.0
  heading: 0.25,
} as const;

/**
 * Matching SSJ Rescue Helipad on Enormous Jurassic Park Island's South Promenade.
 */
export const ORANGE_HELI_ISLAND_POS = {
  x: 417.0,
  y: 0.55,
  z: 257.0,
  heading: -2.35,
} as const;

/**
 * Dedicated, well-spaced Airport Apron Aircraft Stands at Dreamline International Airport
 * so ALL 3 aircraft (Orange Rescue Helicopter, Gold/Wood VTOL, SSJ Sky Explorer) are parked cleanly!
 */
export const AIRPORT_AIRCRAFT_STANDS = [
  {
    id: 'airport_stand_orange_heli',
    aircraft: 'orange_heli' as const,
    name: 'SSJ Orange Rescue Helicopter',
    tamilName: 'ஆரஞ்சு மீட்பு ஹெலிகாப்டர்',
    x: 246.0,
    y: 0.65,
    z: -146.0,
    heading: Math.PI * 0.5,
  },
  {
    id: 'airport_stand_vtol',
    aircraft: 'vtol_aircraft' as const,
    name: 'Gold/Wood Ducted-Fan VTOL',
    tamilName: 'தங்க வி.டி.ஓ.எல் விமானம்',
    x: 259.0,
    y: 0.65,
    z: -146.0,
    heading: Math.PI * 0.5,
  },
  {
    id: 'airport_stand_sky_explorer',
    aircraft: 'sky_explorer' as const,
    name: 'SSJ Tropical Sky Explorer',
    tamilName: 'ஆகாய உலா ஊர்தி',
    x: 272.0,
    y: 0.65,
    z: -146.0,
    heading: Math.PI * 0.5,
  },
] as const;

/**
 * Spacious 3-Bay Dreamline Vehicle Spawning Garage west of En Illam (open village plaza).
 */
export const VEHICLE_GARAGE_CENTER = { x: 4.0, z: -24.0 } as const;
export const VEHICLE_GARAGE_SPAWN_BAY = { x: 4.0, z: -19.5, heading: 0.0 } as const;

export function createOrangeHeliAtPad(pad: OrangeHeliPadId = 'home'): OrangeHeliState {
  const target = pad === 'dinosaur_island' ? ORANGE_HELI_ISLAND_POS : ORANGE_HELI_HOME_POS;
  const groundY =
    pad === 'home'
      ? ORANGE_HELI_HOME_POS.y
      : Math.max(WATER_LEVEL + 0.35, walkableHeightAt(target.x, target.z));
  return {
    name: 'SSJ Orange Rescue Helicopter',
    tamilName: 'ஆரஞ்சு மீட்பு ஹெலிகாப்டர்',
    x: target.x,
    y: groundY,
    z: target.z,
    heading: target.heading,
    forwardSpeed: 0,
    verticalSpeed: 0,
    yawRate: 0,
    roll: 0,
    pitch: 0,
    rotorAngle: 0,
    rotorSpeed: 3.2,
    speedKmh: 0,
    altitudeM: pad === 'home' ? 10 : 0,
    boostActive: false,
    onGround: true,
  };
}

export function createInitialOrangeHeliState(): OrangeHeliState {
  return createOrangeHeliAtPad('home');
}

function orangeHeliSurfaceY(x: number, z: number, currentY: number): number {
  let surfaceY = Math.max(walkableHeightAt(x, z), WATER_LEVEL + 0.25);
  const lx = x - HOME_CENTER.x;
  const lz = z - HOME_CENTER.z;
  const overHomeTerrace =
    Math.hypot(lx, lz) <= 6.0 ||
    Math.hypot(lx + 11.4, lz) <= 6.0 ||
    Math.hypot(lx - 11.4, lz) <= 6.0;
  if (overHomeTerrace && currentY >= 8.2) {
    surfaceY = Math.max(surfaceY, ORANGE_HELI_HOME_POS.y);
  }
  return surfaceY;
}

export function stepOrangeHeliState(
  state: OrangeHeliState,
  forwardInput: number,
  steerRight: number,
  ascend: boolean,
  descend: boolean,
  boost: boolean,
  occupied: boolean,
  dt: number,
  floorYAt?: (x: number, z: number) => number,
  ceilingY?: number,
  cameraPitch?: number
): OrangeHeliState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  const surfaceY = floorYAt ? floorYAt(state.x, state.z) : orangeHeliSurfaceY(state.x, state.z, state.y);

  if (!occupied) {
    const idleRotorSpeed = state.rotorSpeed + (2.4 - state.rotorSpeed) * (1 - Math.exp(-3.0 * cdt));
    const settledY = state.y > surfaceY + 0.04 ? Math.max(surfaceY, state.y - 3.5 * cdt) : surfaceY;
    return {
      ...state,
      y: settledY,
      forwardSpeed: state.forwardSpeed * Math.exp(-4.0 * cdt),
      verticalSpeed: 0,
      yawRate: 0,
      roll: state.roll * Math.exp(-5.0 * cdt),
      pitch: state.pitch * Math.exp(-5.0 * cdt),
      rotorSpeed: idleRotorSpeed,
      rotorAngle: state.rotorAngle + idleRotorSpeed * cdt,
      speedKmh: 0,
      altitudeM: Math.max(0, Math.round(settledY - surfaceY)),
      boostActive: false,
      onGround: settledY <= surfaceY + 0.08,
    };
  }

  const maxSpd = boost ? 58.0 : 35.0;
  let targetFwd = 0;
  if (forwardInput > 0.04) targetFwd = forwardInput * maxSpd;
  else if (forwardInput < -0.04) targetFwd = forwardInput * 16.0;

  const fwdRate = Math.abs(forwardInput) > 0.04 ? (boost ? 3.4 : 2.5) : 2.2;
  const forwardSpeed = state.forwardSpeed + (targetFwd - state.forwardSpeed) * (1 - Math.exp(-fwdRate * cdt));

  const targetYawRate = -steerRight * 1.65;
  const yawRate = state.yawRate + (targetYawRate - state.yawRate) * (1 - Math.exp(-5.8 * cdt));
  const heading = state.heading + yawRate * cdt;

  const vertDir = (ascend ? 1 : 0) - (descend ? 1 : 0);
  const lookFly = computeLookToFlyVerticalRate(cameraPitch, forwardInput, {
    neutralPitch: 0.22,
    deadzone: 0.09,
    maxClimbRate: boost ? 24.0 : 16.0,
    maxDiveRate: boost ? 21.0 : 15.0,
  });
  // Auto-hover lift when pressing forward from ground so flying feels effortless!
  const autoTakeoff = state.onGround && Math.abs(forwardInput) > 0.15 && !descend && lookFly.verticalRate >= -0.5 ? 1 : 0;
  const targetVert =
    vertDir !== 0
      ? vertDir * (boost ? 24.0 : 15.0)
      : lookFly.active
      ? lookFly.verticalRate
      : autoTakeoff * 0.55 * (boost ? 24.0 : 15.0);
  const verticalSpeed = state.verticalSpeed + (targetVert - state.verticalSpeed) * (1 - Math.exp(-4.8 * cdt));

  let x = state.x + Math.sin(heading) * forwardSpeed * cdt;
  let z = state.z + Math.cos(heading) * forwardSpeed * cdt;
  let y = state.y + verticalSpeed * cdt;

  if (!state.inVault) {
    const maxR = WORLD_PLAYABLE_RADIUS - 12;
    const r = Math.hypot(x, z);
    if (r > maxR) {
      const s = maxR / r;
      x *= s;
      z *= s;
    }
  }

  const nextSurfaceY = floorYAt ? floorYAt(x, z) : orangeHeliSurfaceY(x, z, state.y);
  const maxFlightY = ceilingY ?? 155;
  let clampedVert = verticalSpeed;
  if (y <= nextSurfaceY) {
    y = nextSurfaceY;
    if (clampedVert < 0) clampedVert = 0;
  } else if (y > maxFlightY) {
    y = maxFlightY;
    if (clampedVert > 0) clampedVert = 0;
  }

  const onGround = y <= nextSurfaceY + 0.12 && clampedVert <= 0.05;
  const targetRoll = onGround ? 0 : -yawRate * 0.28;
  const targetPitch = onGround ? 0 : (forwardSpeed / maxSpd) * 0.19 - clampedVert * 0.008;
  const roll = state.roll + (targetRoll - state.roll) * (1 - Math.exp(-6.0 * cdt));
  const pitch = state.pitch + (targetPitch - state.pitch) * (1 - Math.exp(-5.4 * cdt));

  const targetRotor = 18.0 + (boost ? 10.0 : 0) + Math.min(8.0, Math.abs(forwardSpeed) * 0.2);
  const rotorSpeed = state.rotorSpeed + (targetRotor - state.rotorSpeed) * (1 - Math.exp(-4.5 * cdt));
  const rotorAngle = state.rotorAngle + rotorSpeed * cdt;

  const speedKmh = Math.round(Math.abs(forwardSpeed) * 3.6 + (vertDir !== 0 ? 10 : 0));
  const altitudeM = Math.max(0, Math.round(y - nextSurfaceY));

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
    rotorAngle,
    rotorSpeed,
    speedKmh,
    altitudeM,
    boostActive: boost && (Math.abs(forwardInput) > 0.05 || vertDir !== 0),
    onGround,
  };
}

export function getOrangeHeliExitPosition(state: OrangeHeliState): { x: number; y: number; z: number } {
  const lx = state.x - HOME_CENTER.x;
  const lz = state.z - HOME_CENTER.z;
  if (Math.hypot(lx - 11.4, lz) <= 6.2 && state.y >= 8.8) {
    return { x: HOME_CENTER.x + 7.6, y: 10.4, z: HOME_CENTER.z };
  }
  if (Math.hypot(lx, lz) <= 6.2 && state.y >= 8.8) {
    return { x: HOME_CENTER.x + 2.6, y: 10.4, z: HOME_CENTER.z - 2.2 };
  }
  const ex = state.x - Math.cos(state.heading) * 3.8;
  const ez = state.z + Math.sin(state.heading) * 3.8;
  if (isOceanAt(ex, ez)) {
    return { x: ex, y: WATER_LEVEL + 0.25, z: ez };
  }
  return { x: ex, y: walkableHeightAt(ex, ez), z: ez };
}

