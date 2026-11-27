import {
  groundHeightAt,
  HOME_CENTER,
  isOceanAt,
  isWaterAt,
  walkableHeightWithFloor,
  WATER_LEVEL,
  WORLD_PLAYABLE_RADIUS,
} from './terrain';
import { getWeatherProfile } from './extremeWeather';
import { computeOceanWeatherParams, evaluateGerstnerOceanCPU } from './gerstnerOcean';
import { computeLookToFlyVerticalRate } from './hoverGlider';
import type { WeatherType } from './types';

export type TerrainSurfaceType = 'asphalt' | 'gravel' | 'sand' | 'mud' | 'grass';

export type JetSkiModelId = 'sport_yellow' | 'perf_green';

export type CameraPerspectiveMode =
  | 'chase'
  | 'first_person'
  | 'cockpit'
  | 'free_roam'
  | 'cinematic'
  | 'wildlife_obs'
  | 'drone';

export interface CameraPerspectiveOption {
  id: CameraPerspectiveMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const CAMERA_PERSPECTIVES: CameraPerspectiveOption[] = [
  {
    id: 'chase',
    label: 'Rear Chase',
    shortLabel: 'Chase',
    description: 'Dynamic third-person chase camera with speed FOV',
  },
  {
    id: 'first_person',
    label: 'First-Person',
    shortLabel: '1st Person',
    description: 'Hood, bow, or forward rider perspective',
  },
  {
    id: 'cockpit',
    label: 'Cockpit Interior',
    shortLabel: 'Cockpit',
    description: 'Inside the cabin with live gauges and steering',
  },
  {
    id: 'free_roam',
    label: 'Free-Roam Orbit',
    shortLabel: 'Free-Roam',
    description: 'Drag to orbit freely around vehicle or explorer',
  },
  {
    id: 'cinematic',
    label: 'Cinematic Tracking',
    shortLabel: 'Cinematic',
    description: 'Sweeping documentary tracking angles',
  },
  {
    id: 'wildlife_obs',
    label: 'Wildlife Observation',
    shortLabel: 'Wildlife',
    description: 'Telephoto wildlife lens with species auto-focus',
  },
  {
    id: 'drone',
    label: 'Drone Aerial',
    shortLabel: 'Drone',
    description: 'High-altitude stabilized aerial survey drone',
  },
];

// Flagship staging positions — Safari Jeep in sunlit valley meadow, VTOL Aircraft on En Illam Twin Helipad Pad B (y = 10.4m), Jet Skis on open water
export const SAFARI_JEEP_SPAWN = { x: 6.0, z: 44.0, heading: Math.PI * 0.22 };
export const VTOL_AIRCRAFT_SPAWN = { x: HOME_CENTER.x - 11.4, y: 10.4, z: HOME_CENTER.z, heading: 0.25 };
export const JETSKI_SPORT_SPAWN = { x: 46.0, z: -26.0, heading: -Math.PI * 0.35 };
export const JETSKI_PERF_SPAWN = { x: 138.0, z: 54.0, heading: Math.PI * 0.42 };

export interface SafariJeepState {
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number; // m/s
  speedKmh: number;
  steerAngle: number; // radians
  wheelSpin: number;
  suspensionPitch: number;
  suspensionRoll: number;
  wheelCompression: [number, number, number, number]; // FL, FR, RL, RR
  surface: TerrainSurfaceType;
  gear: 'R' | 'N' | '1' | '2' | '3' | '4' | '5';
  rpm: number; // 800..5800
  headlightsOn: boolean;
  fogLampsOn: boolean;
  leftIndicator: boolean;
  rightIndicator: boolean;
  wipersActive: boolean;
  mudSplashIntensity: number; // 0..1
  dustIntensity: number; // 0..1
  fourWheelDrive: boolean;
  inVault?: boolean;
}

export interface VtolAircraftState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number;
  pitch: number;
  roll: number;
  speedKmh: number;
  altitudeM: number;
  aglM: number; // above ground level
  nacelleTilt: number; // 0 = vertical VTOL hover, 1 = forward horizontal cruise
  rotorSpeed: number; // rad/s
  rotorAngle: number;
  throttle: number; // 0..1
  hoverMode: boolean;
  landingGearDown: boolean;
  landingGearProgress: number; // 1 = extended, 0 = retracted
  batteryPct: number; // 0..100
  turbulenceOffset: number;
  onGround: boolean;
  inVault?: boolean;
}

export interface JetSkiState {
  model: JetSkiModelId;
  name: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number; // m/s
  speedKmh: number;
  throttle: number; // 0..1
  steerAngle: number;
  leanRoll: number;
  bowPitch: number;
  buoyancyHeave: number;
  sprayIntensity: number; // 0..1
  waterRoughness: number; // 0 = calm, 1 = rough
  inWater: boolean;
  inVault?: boolean;
}

export interface ExpeditionVehicleInput {
  forward: number; // -1..1
  turn: number; // -1..1 (+1 = right)
  ascend: boolean;
  descend: boolean;
  brake: boolean;
  boost: boolean;
  cameraPitch?: number;
}

/**
 * Classifies ground surface at any world coordinate for authentic 4WD Safari Jeep handling.
 */
export function getTerrainSurfaceAt(x: number, z: number, weather: WeatherType): TerrainSurfaceType {
  const profile = getWeatherProfile(weather);
  const isWet = profile.isRainy || profile.isExtremeStorm;

  // Paved station plaza, airport tarmac, and main coastal bus road
  if (Math.abs(x) < 16 && z > 8 && z < 23) return 'asphalt';
  if (z > 26 && z < 32 && x > -44 && x < 92) return 'asphalt';
  if (x > 165 && z < -90) return 'asphalt';

  // Coastal beaches and western Thar desert dunes
  if ((x > 88 && z > 4 && !isOceanAt(x, z)) || (x < -130 && z > 10)) {
    return 'sand';
  }

  // Waterfall glade, riverbanks, lakeside shores, or rain-soaked off-road trails become mud!
  const h = groundHeightAt(x, z);
  const nearWaterfall = Math.hypot(x + 32, z - 104) < 28;
  const nearLakeShore = Math.hypot((x - 46) / 40, (z + 26) / 32) < 1.2;
  if (nearWaterfall || (nearLakeShore && h < 0.7) || (isWet && h < 1.2)) {
    return 'mud';
  }

  // Rocky mountain slopes & hills
  if (h > 3.2 || (x < -45 && z < -32)) {
    return 'gravel';
  }

  return 'grass';
}

export function getSurfacePhysicsParams(surface: TerrainSurfaceType): {
  traction: number;
  drag: number;
  maxSpeed: number;
  dustFactor: number;
  mudFactor: number;
} {
  switch (surface) {
    case 'asphalt':
      return { traction: 1.0, drag: 0.45, maxSpeed: 28, dustFactor: 0.05, mudFactor: 0.0 };
    case 'gravel':
      return { traction: 0.86, drag: 0.65, maxSpeed: 24, dustFactor: 0.78, mudFactor: 0.12 };
    case 'sand':
      return { traction: 0.76, drag: 0.92, maxSpeed: 21, dustFactor: 0.95, mudFactor: 0.05 };
    case 'mud':
      return { traction: 0.64, drag: 1.18, maxSpeed: 17.5, dustFactor: 0.12, mudFactor: 1.0 };
    case 'grass':
    default:
      return { traction: 0.88, drag: 0.62, maxSpeed: 23.5, dustFactor: 0.42, mudFactor: 0.28 };
  }
}

/**
 * Multi-octave Gerstner-inspired wave elevation at (x, z, elapsed) for realistic Jet Ski buoyancy.
 */
export function sampleWaterWaveHeight(
  x: number,
  z: number,
  elapsed: number,
  weather: WeatherType
): { y: number; slopeX: number; slopeZ: number; roughness: number } {
  const ocean = isOceanAt(x, z);
  if (ocean) {
    const oceanParams = computeOceanWeatherParams(weather, 'bengal');
    const relBedH = groundHeightAt(x, z) - WATER_LEVEL;
    const sample = evaluateGerstnerOceanCPU(x, z, elapsed, oceanParams, relBedH);
    const invNy = 1 / Math.max(0.25, sample.ny);
    const slopeX = -sample.nx * invNy;
    const slopeZ = -sample.nz * invNy;
    const roughness = Math.min(1, Math.max(0.12, oceanParams.amplitude / 1.35));
    return { y: WATER_LEVEL + sample.y, slopeX, slopeZ, roughness };
  }

  const profile = getWeatherProfile(weather);
  const weatherAmp = profile.isExtremeStorm ? 1.85 : profile.isRainy ? 1.35 : weather === 'breeze' ? 1.15 : 0.78;
  const amp = 0.14 * weatherAmp;

  const w1 = x * 0.11 + z * 0.07 + elapsed * 1.85;
  const w2 = x * -0.08 + z * 0.14 + elapsed * 2.35;
  const w3 = x * 0.21 - z * 0.17 + elapsed * 3.1;

  const h =
    Math.sin(w1) * amp * 0.56 +
    Math.cos(w2) * amp * 0.30 +
    Math.sin(w3) * amp * 0.14;

  const slopeX =
    Math.cos(w1) * 0.11 * amp * 0.56 +
    Math.sin(w2) * 0.08 * amp * 0.30 +
    Math.cos(w3) * 0.21 * amp * 0.14;
  const slopeZ =
    Math.cos(w1) * 0.07 * amp * 0.56 -
    Math.sin(w2) * 0.14 * amp * 0.30 -
    Math.cos(w3) * 0.17 * amp * 0.14;

  const roughness = Math.min(1, Math.max(0.08, (amp - 0.1) / 0.55));
  return { y: WATER_LEVEL + h, slopeX, slopeZ, roughness };
}

export function createInitialSafariJeepState(): SafariJeepState {
  const y = groundHeightAt(SAFARI_JEEP_SPAWN.x, SAFARI_JEEP_SPAWN.z);
  return {
    x: SAFARI_JEEP_SPAWN.x,
    y,
    z: SAFARI_JEEP_SPAWN.z,
    heading: SAFARI_JEEP_SPAWN.heading,
    speed: 0,
    speedKmh: 0,
    steerAngle: 0,
    wheelSpin: 0,
    suspensionPitch: 0,
    suspensionRoll: 0,
    wheelCompression: [0, 0, 0, 0],
    surface: 'gravel',
    gear: 'N',
    rpm: 850,
    headlightsOn: true,
    fogLampsOn: true,
    leftIndicator: false,
    rightIndicator: false,
    wipersActive: false,
    mudSplashIntensity: 0,
    dustIntensity: 0,
    fourWheelDrive: true,
  };
}

export function createInitialVtolAircraftState(): VtolAircraftState {
  const groundY = Math.max(
    WATER_LEVEL + 0.4,
    walkableHeightWithFloor(VTOL_AIRCRAFT_SPAWN.x, VTOL_AIRCRAFT_SPAWN.z, VTOL_AIRCRAFT_SPAWN.y + 0.5)
  );
  return {
    x: VTOL_AIRCRAFT_SPAWN.x,
    y: groundY,
    z: VTOL_AIRCRAFT_SPAWN.z,
    vx: 0,
    vy: 0,
    vz: 0,
    heading: VTOL_AIRCRAFT_SPAWN.heading,
    pitch: 0,
    roll: 0,
    speedKmh: 0,
    altitudeM: groundY,
    aglM: 0,
    nacelleTilt: 0,
    rotorSpeed: 3.5,
    rotorAngle: 0,
    throttle: 0,
    hoverMode: true,
    landingGearDown: true,
    landingGearProgress: 1,
    batteryPct: 100,
    turbulenceOffset: 0,
    onGround: true,
  };
}

export function createInitialJetSkiState(model: JetSkiModelId): JetSkiState {
  const spawn = model === 'sport_yellow' ? JETSKI_SPORT_SPAWN : JETSKI_PERF_SPAWN;
  return {
    model,
    name: model === 'sport_yellow' ? 'Sport Jet Ski 310X' : 'Apex-K Pro Jet Ski',
    x: spawn.x,
    y: WATER_LEVEL,
    z: spawn.z,
    heading: spawn.heading,
    speed: 0,
    speedKmh: 0,
    throttle: 0,
    steerAngle: 0,
    leanRoll: 0,
    bowPitch: 0,
    buoyancyHeave: 0,
    sprayIntensity: 0,
    waterRoughness: 0.25,
    inWater: true,
  };
}

/**
 * Steps 4WD Off-Road Safari Jeep physics with real surface grip, 4-wheel suspension sampling,
 * gear shifting, and mud/dust particle intensity.
 */
export function stepSafariJeep(
  state: SafariJeepState,
  input: ExpeditionVehicleInput,
  dt: number,
  weather: WeatherType,
  occupied: boolean,
  floorYAt?: (x: number, z: number) => number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
  state.surface = state.inVault ? 'asphalt' : getTerrainSurfaceAt(state.x, state.z, weather);
  const surf = getSurfacePhysicsParams(state.surface);
  const profile = getWeatherProfile(weather);
  state.wipersActive = profile.isRainy || profile.isExtremeStorm;

  if (!occupied) {
    // Smooth coasting stop when parked
    state.speed *= Math.exp(-3.8 * safeDt);
    if (Math.abs(state.speed) < 0.05) state.speed = 0;
    state.steerAngle *= Math.exp(-5.0 * safeDt);
    state.mudSplashIntensity *= Math.exp(-5.0 * safeDt);
    state.dustIntensity *= Math.exp(-5.0 * safeDt);
    state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);
    state.gear = 'N';
    state.rpm = 820;
    return;
  }

  const boostMul = input.boost ? 1.28 : 1.0;
  const maxFwd = surf.maxSpeed * boostMul;
  const maxRev = -9.5;
  const accelRate = 12.8 * surf.traction * boostMul;

  if (input.brake) {
    state.speed *= Math.exp(-6.5 * safeDt);
  } else if (input.forward > 0.04) {
    state.speed = Math.min(maxFwd, state.speed + input.forward * accelRate * safeDt);
  } else if (input.forward < -0.04) {
    if (state.speed > 1.2) {
      state.speed = Math.max(0, state.speed + input.forward * 18.0 * safeDt);
    } else {
      state.speed = Math.max(maxRev, state.speed + input.forward * 8.5 * safeDt);
    }
  } else {
    state.speed *= Math.exp(-surf.drag * 2.2 * safeDt);
    if (Math.abs(state.speed) < 0.08) state.speed = 0;
  }

  // Responsive steering that tightens realistically at higher speeds
  const targetSteer = -input.turn * 0.58;
  state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, safeDt * 8.5);
  const turnEffectiveness = Math.min(1, Math.abs(state.speed) / 4.0) * (1 - Math.min(0.45, Math.abs(state.speed) / 48));
  const dirSign = state.speed >= -0.05 ? 1 : -1;
  state.heading += state.steerAngle * 2.35 * turnEffectiveness * dirSign * safeDt;

  // Proposed horizontal step with water/world safety guard
  const nx = state.x + Math.sin(state.heading) * state.speed * safeDt;
  const nz = state.z + Math.cos(state.heading) * state.speed * safeDt;
  const distCenter = Math.hypot(nx, nz);

  if (state.inVault) {
    state.x = nx;
    state.z = nz;
  } else if (distCenter < WORLD_PLAYABLE_RADIUS - 8 && !isWaterAt(nx, nz)) {
    state.x = nx;
    state.z = nz;
  } else {
    // Gentle scrub on water shoreline or world perimeter
    state.speed *= 0.35;
  }

  // 4-wheel terrain contact & suspension compression
  const sinH = Math.sin(state.heading);
  const cosH = Math.cos(state.heading);
  const halfTrack = 0.92;
  const halfWheelbase = 1.48;

  const sampleCorner = (side: number, fore: number): number => {
    const cx = state.x + cosH * side * halfTrack + sinH * fore * halfWheelbase;
    const cz = state.z - sinH * side * halfTrack + cosH * fore * halfWheelbase;
    return floorYAt ? floorYAt(cx, cz) : groundHeightAt(cx, cz);
  };

  const hFL = sampleCorner(-1, 1);
  const hFR = sampleCorner(1, 1);
  const hRL = sampleCorner(-1, -1);
  const hRR = sampleCorner(1, -1);
  const avgY = (hFL + hFR + hRL + hRR) * 0.25;

  state.y += (avgY - state.y) * Math.min(1, safeDt * 14);
  state.wheelCompression = [
    Math.max(-0.22, Math.min(0.22, hFL - avgY)),
    Math.max(-0.22, Math.min(0.22, hFR - avgY)),
    Math.max(-0.22, Math.min(0.22, hRL - avgY)),
    Math.max(-0.22, Math.min(0.22, hRR - avgY)),
  ];

  // Terrain slope pitch/roll + inertial dive/squat/body-roll
  const slopePitch = Math.atan2((hRL + hRR) * 0.5 - (hFL + hFR) * 0.5, halfWheelbase * 2);
  const slopeRoll = Math.atan2((hFL + hRL) * 0.5 - (hFR + hRR) * 0.5, halfTrack * 2);
  const accelPitch = (input.brake ? 0.045 : -input.forward * 0.032);
  const turnRoll = -state.steerAngle * Math.min(1, Math.abs(state.speed) / 14) * 0.095;

  state.suspensionPitch += (slopePitch + accelPitch - state.suspensionPitch) * Math.min(1, safeDt * 8.5);
  state.suspensionRoll += (slopeRoll + turnRoll - state.suspensionRoll) * Math.min(1, safeDt * 8.5);

  state.wheelSpin += (state.speed / 0.52) * safeDt;
  state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);

  // Automatic 5-speed transmission + RPM gauge
  if (state.speed < -0.25) {
    state.gear = 'R';
  } else if (Math.abs(state.speed) < 0.2) {
    state.gear = 'N';
  } else if (state.speedKmh < 20) {
    state.gear = '1';
  } else if (state.speedKmh < 40) {
    state.gear = '2';
  } else if (state.speedKmh < 62) {
    state.gear = '3';
  } else if (state.speedKmh < 84) {
    state.gear = '4';
  } else {
    state.gear = '5';
  }
  const speedNorm = Math.min(1, Math.abs(state.speed) / maxFwd);
  state.rpm = Math.round(850 + speedNorm * 4300 + (Math.abs(input.forward) > 0.1 ? 450 : 0));

  // Turn indicators auto-assist on sharp turns
  state.leftIndicator = input.turn < -0.5;
  state.rightIndicator = input.turn > 0.5;

  // Mud & dust emission intensity
  const speedRatio = Math.min(1, Math.abs(state.speed) / 16);
  state.mudSplashIntensity = speedRatio * surf.mudFactor;
  state.dustIntensity = speedRatio * surf.dustFactor;
}

/**
 * Steps Advanced Gold/Wood Ducted-Fan VTOL Aircraft physics:
 * - Vertical take-off & landing (hover mode)
 * - Smooth nacelle tilt transition between vertical VTOL and horizontal aerodynamic flight
 * - Realistic wind & turbulence response
 */
export function stepVtolAircraft(
  state: VtolAircraftState,
  input: ExpeditionVehicleInput,
  dt: number,
  elapsed: number,
  weather: WeatherType,
  occupied: boolean,
  floorYAt?: (x: number, z: number) => number,
  ceilingY?: number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
  const groundY = floorYAt
    ? floorYAt(state.x, state.z)
    : Math.max(WATER_LEVEL + 0.35, walkableHeightWithFloor(state.x, state.z, state.y + 0.4));

  if (!occupied) {
    state.rotorSpeed += (2.8 - state.rotorSpeed) * Math.min(1, safeDt * 2.5);
    state.rotorAngle += state.rotorSpeed * safeDt;
    state.nacelleTilt += (0 - state.nacelleTilt) * Math.min(1, safeDt * 2.5);
    state.pitch *= Math.exp(-4.0 * safeDt);
    state.roll *= Math.exp(-4.0 * safeDt);
    if (state.y > groundY + 0.06) {
      state.vy = Math.max(-4.0, state.vy - 3.5 * safeDt);
      state.y = Math.max(groundY, state.y + state.vy * safeDt);
    } else {
      state.y = groundY;
      state.vy = 0;
      state.onGround = true;
    }
    state.vx *= Math.exp(-3.0 * safeDt);
    state.vz *= Math.exp(-3.0 * safeDt);
    state.aglM = Math.max(0, state.y - groundY);
    state.altitudeM = state.y;
    state.speedKmh = Math.round(Math.hypot(state.vx, state.vz) * 3.6);
    state.landingGearDown = true;
    state.landingGearProgress = Math.min(1, state.landingGearProgress + safeDt * 1.4);
    return;
  }

  const profile = getWeatherProfile(weather);
  const windStrength = profile.isExtremeStorm ? 2.4 : profile.isRainy ? 1.2 : weather === 'breeze' ? 0.8 : 0.35;

  // Yaw control
  const yawRate = (state.hoverMode ? 1.55 : 1.15);
  state.heading -= input.turn * yawRate * safeDt;

  // Vertical thrust / VTOL climb & descend (manual buttons OR buttonless camera Look-to-Fly!)
  const lookFly = computeLookToFlyVerticalRate(input.cameraPitch, input.forward, {
    neutralPitch: 0.22,
    deadzone: 0.09,
    maxClimbRate: input.boost ? 17.0 : 12.5,
    maxDiveRate: input.boost ? 15.5 : 11.5,
  });
  const climbTarget = input.ascend
    ? 11.5
    : input.descend
    ? -9.5
    : lookFly.active
    ? lookFly.verticalRate
    : 0;
  if ((input.ascend || lookFly.verticalRate > 1.2) && state.onGround) {
    state.onGround = false;
  }

  // Gradual nacelle transition between VTOL Hover (0) and Forward Cruise (1)
  const forwardIntent = Math.max(0, input.forward);
  const desiredTilt = state.onGround
    ? 0
    : state.hoverMode
    ? forwardIntent * 0.35
    : Math.min(1, 0.32 + forwardIntent * 0.68 + (input.boost ? 0.25 : 0));
  state.nacelleTilt += (desiredTilt - state.nacelleTilt) * Math.min(1, safeDt * 2.6);

  const sinH = Math.sin(state.heading);
  const cosH = Math.cos(state.heading);
  const maxHorizSpeed = (state.hoverMode ? 22 : 52) * (input.boost ? 1.35 : 1.0);
  const thrustAccel = (state.hoverMode ? 16 : 26) * (input.boost ? 1.3 : 1.0);

  if (Math.abs(input.forward) > 0.04 && !state.onGround) {
    state.vx += sinH * input.forward * thrustAccel * safeDt;
    state.vz += cosH * input.forward * thrustAccel * safeDt;
  } else {
    const airDrag = state.hoverMode ? 1.85 : 0.65;
    state.vx *= Math.exp(-airDrag * safeDt);
    state.vz *= Math.exp(-airDrag * safeDt);
  }

  // Gently align velocity vector toward nose during forward flight (aerodynamic weathervaning)
  const horizSpeed = Math.hypot(state.vx, state.vz);
  if (horizSpeed > maxHorizSpeed) {
    const k = maxHorizSpeed / horizSpeed;
    state.vx *= k;
    state.vz *= k;
  }
  if (!state.hoverMode && horizSpeed > 4.0) {
    const alignFactor = Math.min(1, safeDt * 2.2);
    const alignedVx = sinH * horizSpeed;
    const alignedVz = cosH * horizSpeed;
    state.vx += (alignedVx - state.vx) * alignFactor;
    state.vz += (alignedVz - state.vz) * alignFactor;
  }

  // Wind turbulence when airborne
  const turb = state.onGround
    ? 0
    : (Math.sin(elapsed * 2.1 + state.x * 0.04) * 0.6 + Math.cos(elapsed * 3.7 + state.z * 0.05) * 0.4) * windStrength;
  state.turbulenceOffset = turb;

  // Vertical dynamics with aerodynamic lift in cruise
  const targetVy = climbTarget + (!state.onGround ? turb * 0.35 : 0);
  state.vy += (targetVy - state.vy) * Math.min(1, safeDt * 4.5);

  state.x += state.vx * safeDt;
  state.z += state.vz * safeDt;
  state.y += state.vy * safeDt;

  // Clamp within playable world skybox (bypassed underground where vault clamping governs)
  if (!state.inVault) {
    const distFromOrigin = Math.hypot(state.x, state.z);
    if (distFromOrigin > WORLD_PLAYABLE_RADIUS - 12) {
      const scale = (WORLD_PLAYABLE_RADIUS - 12) / distFromOrigin;
      state.x *= scale;
      state.z *= scale;
    }
  }

  const nextGroundY = floorYAt
    ? floorYAt(state.x, state.z)
    : Math.max(WATER_LEVEL + 0.35, walkableHeightWithFloor(state.x, state.z, state.y + 0.4));
  const maxAltY = ceilingY ?? 125;
  if (state.y <= nextGroundY + 0.04 && climbTarget <= 0) {
    state.y = nextGroundY;
    state.vy = 0;
    state.vx *= 0.82;
    state.vz *= 0.82;
    state.onGround = true;
  } else {
    state.y = Math.min(maxAltY, Math.max(nextGroundY, state.y));
    state.onGround = state.y <= nextGroundY + 0.08 && Math.abs(state.vy) < 0.25 && horizSpeed < 1.2;
  }

  state.aglM = Math.max(0, state.y - nextGroundY);
  state.altitudeM = state.y;
  state.speedKmh = Math.round(Math.hypot(state.vx, state.vz) * 3.6);

  // Automatic landing gear retract above 6m AGL (unless manually kept down)
  const targetGear = state.aglM < 5.5 || state.onGround ? 1 : 0;
  state.landingGearDown = targetGear > 0.5;
  state.landingGearProgress += (targetGear - state.landingGearProgress) * Math.min(1, safeDt * 2.4);

  // Attitude pitch & bank roll
  const targetPitch = state.onGround ? 0 : Math.max(-0.32, Math.min(0.28, -input.forward * 0.16 + state.vy * 0.014));
  const targetRoll = state.onGround ? 0 : Math.max(-0.52, Math.min(0.52, -input.turn * (0.24 + state.nacelleTilt * 0.24) + turb * 0.03));
  state.pitch += (targetPitch - state.pitch) * Math.min(1, safeDt * 5.2);
  state.roll += (targetRoll - state.roll) * Math.min(1, safeDt * 5.2);

  // High-RPM ducted fan blades
  state.throttle = state.onGround ? 0.18 : Math.min(1, 0.42 + (horizSpeed / 55) * 0.45 + (input.ascend || input.boost ? 0.2 : 0));
  const targetRotorSpeed = 4.0 + state.throttle * 28.0;
  state.rotorSpeed += (targetRotorSpeed - state.rotorSpeed) * Math.min(1, safeDt * 4.5);
  state.rotorAngle += state.rotorSpeed * safeDt;

  // Battery slowly drains under load and recharges gently when landed
  if (state.onGround) {
    state.batteryPct = Math.min(100, state.batteryPct + safeDt * 2.2);
  } else {
    state.batteryPct = Math.max(12, state.batteryPct - safeDt * (0.04 + state.throttle * 0.08));
  }
}

/**
 * Steps Personal Watercraft (Jet Ski Model A Sport Yellow & Model B High-Perf Green) water physics:
 * buoyancy, Gerstner wave pitch/roll, deep-carving lean angle, wake & spray plumes.
 */
export function stepJetSki(
  state: JetSkiState,
  input: ExpeditionVehicleInput,
  dt: number,
  elapsed: number,
  weather: WeatherType,
  occupied: boolean,
  floorYAt?: (x: number, z: number) => number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
  const wave = sampleWaterWaveHeight(state.x, state.z, elapsed, weather);
  state.waterRoughness = state.inVault ? 0.05 : wave.roughness;

  // Model B (Perf Green) has higher top speed & sharper carving; Model A (Sport Yellow) has ultra-stable dual-seat cruising
  const isPerf = state.model === 'perf_green';
  const maxSpeed = (isPerf ? 31.0 : 26.5) * (input.boost ? 1.25 : 1.0) * (1 - state.waterRoughness * 0.14);
  const accel = (isPerf ? 17.5 : 14.5) * (input.boost ? 1.25 : 1.0);
  const turnAgility = isPerf ? 2.85 : 2.35;

  if (!occupied) {
    state.speed *= Math.exp(-2.8 * safeDt);
    if (Math.abs(state.speed) < 0.05) state.speed = 0;
    state.throttle = 0;
    state.steerAngle *= Math.exp(-5 * safeDt);
    state.leanRoll *= Math.exp(-4.5 * safeDt);
    state.bowPitch += ((state.inVault ? 0 : wave.slopeZ * 0.8) - state.bowPitch) * Math.min(1, safeDt * 6);
    const restY = state.inVault && floorYAt ? floorYAt(state.x, state.z) + 0.12 : wave.y + 0.08;
    state.y += (restY - state.y) * Math.min(1, safeDt * 8);
    state.sprayIntensity *= Math.exp(-6 * safeDt);
    state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);
    return;
  }

  // Jet ski propulsion & water resistance
  const waterDrag = 0.85 + state.waterRoughness * 0.55;
  if (input.brake) {
    state.speed *= Math.exp(-5.2 * safeDt);
    state.throttle = 0;
  } else if (input.forward > 0.04) {
    state.speed = Math.min(maxSpeed, state.speed + input.forward * accel * safeDt);
    state.throttle = Math.min(1, input.forward * (input.boost ? 1.0 : 0.85));
  } else if (input.forward < -0.04) {
    state.speed = Math.max(-7.5, state.speed + input.forward * 9.0 * safeDt);
    state.throttle = 0.25;
  } else {
    state.speed *= Math.exp(-waterDrag * 1.45 * safeDt);
    if (Math.abs(state.speed) < 0.06) state.speed = 0;
    state.throttle = 0.05;
  }

  // Carving turn & rider body lean-in
  const targetSteer = -input.turn * 0.65;
  state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, safeDt * 9.0);
  const steerAuthority = 0.35 + Math.min(0.65, Math.abs(state.speed) / 8.0);
  state.heading += state.steerAngle * turnAgility * steerAuthority * safeDt;

  const nx = state.x + Math.sin(state.heading) * state.speed * safeDt;
  const nz = state.z + Math.cos(state.heading) * state.speed * safeDt;
  const distCenter = Math.hypot(nx, nz);

  // Stay on water (Neelam Lake, Ocean, or Oasis Lagoon) — or hover-glide freely when spawned on land/inside Underground Tunnel!
  if (state.inVault) {
    state.x = nx;
    state.z = nz;
    state.inWater = false;
  } else if (distCenter < WORLD_PLAYABLE_RADIUS - 10 && isWaterAt(nx, nz)) {
    state.x = nx;
    state.z = nz;
    state.inWater = true;
  } else if (!isWaterAt(state.x, state.z) && distCenter < WORLD_PLAYABLE_RADIUS - 10) {
    // Spawned on dry land — allow hover-gliding smoothly across land or straight into the Secret Tunnel!
    state.x = nx;
    state.z = nz;
    state.inWater = false;
  } else if (distCenter < WORLD_PLAYABLE_RADIUS - 10 && isWaterAt(nx, state.z)) {
    state.x = nx;
    state.speed *= 0.84;
    state.inWater = true;
  } else if (distCenter < WORLD_PLAYABLE_RADIUS - 10 && isWaterAt(state.x, nz)) {
    state.z = nz;
    state.speed *= 0.84;
    state.inWater = true;
  } else {
    state.speed *= 0.45;
  }

  // Wave buoyancy, bow planing lift, and deep carving roll
  const planingLift = Math.min(0.24, (Math.abs(state.speed) / maxSpeed) * 0.22);
  const targetY =
    state.inVault && floorYAt
      ? floorYAt(state.x, state.z) + 0.14
      : !state.inWater
      ? Math.max(WATER_LEVEL, walkableHeightWithFloor(state.x, state.z, state.y + 0.4)) + 0.14
      : wave.y + 0.06 + planingLift;
  state.buoyancyHeave = state.inWater ? targetY - WATER_LEVEL : 0;
  state.y += (targetY - state.y) * Math.min(1, safeDt * 12);

  const sinH = Math.sin(state.heading);
  const cosH = Math.cos(state.heading);
  const waveForwardSlope = wave.slopeX * sinH + wave.slopeZ * cosH;
  const waveSideSlope = wave.slopeX * cosH - wave.slopeZ * sinH;

  const targetPitch = -Math.min(0.26, (state.speed / maxSpeed) * 0.16) - waveForwardSlope * 0.85;
  const targetRoll = -input.turn * Math.min(1, Math.abs(state.speed) / 14) * (isPerf ? 0.44 : 0.34) + waveSideSlope * 0.7;

  state.bowPitch += (targetPitch - state.bowPitch) * Math.min(1, safeDt * 7.5);
  state.leanRoll += (targetRoll - state.leanRoll) * Math.min(1, safeDt * 7.5);

  state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);
  state.sprayIntensity = Math.min(1, (Math.abs(state.speed) / 14) * (0.75 + Math.abs(input.turn) * 0.55 + wave.roughness * 0.35));
}

export function cycleCameraPerspective(current: CameraPerspectiveMode): CameraPerspectiveMode {
  const idx = CAMERA_PERSPECTIVES.findIndex((p) => p.id === current);
  const nextIdx = (idx + 1) % CAMERA_PERSPECTIVES.length;
  return CAMERA_PERSPECTIVES[nextIdx].id;
}
