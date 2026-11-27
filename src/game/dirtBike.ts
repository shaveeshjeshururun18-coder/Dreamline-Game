import {
  groundHeightAt,
  isWaterAt,
  walkableHeightWithFloor,
  WORLD_PLAYABLE_RADIUS,
} from './terrain';
import {
  getSurfacePhysicsParams,
  getTerrainSurfaceAt,
  type ExpeditionVehicleInput,
  type TerrainSurfaceType,
} from './expeditionVehicles';
import type { WeatherType } from './types';

// Ready-to-ride 49cc Petrol Dirt Bike (Orion Mini) parked on the sunlit village promenade beside the Safari Jeep & En Illam
export const DIRT_BIKE_49CC_SPAWN = { x: 11.4, z: 42.8, heading: Math.PI * 0.18 } as const;

export interface DirtBike49ccState {
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number; // m/s
  speedKmh: number;
  rpm: number; // 0..8900 (2-stroke idle ~1850 RPM)
  steerAngle: number; // radians (+left, -right, clamped to ±38 deg)
  steerDeg: number; // degrees for HUD telemetry
  leanAngle: number; // radians (-0.095 parked on left kickstand, leans dynamically into turns)
  forkCompression: number; // 0..1 USD front fork & rear mono-shock compression
  brakeDive: number; // 0..1 forward pitch under disc braking
  wheelSpin: number; // accumulated radians for front & rear knobby wheels
  kickstandDown: boolean;
  engineRunning: boolean;
  revving: boolean;
  braking: boolean;
  throttle: number; // 0..1
  surface: TerrainSurfaceType;
  dustIntensity: number; // 0..1
  exhaustIntensity: number; // 0..1
  inVault?: boolean;
}

export function createInitialDirtBikeState(): DirtBike49ccState {
  const y = groundHeightAt(DIRT_BIKE_49CC_SPAWN.x, DIRT_BIKE_49CC_SPAWN.z);
  return {
    x: DIRT_BIKE_49CC_SPAWN.x,
    y,
    z: DIRT_BIKE_49CC_SPAWN.z,
    heading: DIRT_BIKE_49CC_SPAWN.heading,
    speed: 0,
    speedKmh: 0,
    rpm: 1850,
    steerAngle: (14 * Math.PI) / 180, // Signature slight left turn when parked on kickstand
    steerDeg: 14,
    leanAngle: -0.095,
    forkCompression: 0,
    brakeDive: 0,
    wheelSpin: 0,
    kickstandDown: true,
    engineRunning: true,
    revving: false,
    braking: false,
    throttle: 0,
    surface: 'grass',
    dustIntensity: 0,
    exhaustIntensity: 0.25,
  };
}

/**
 * Steps the 49cc Petrol Powered Dirt Bike (Orion Mini) physics simulation:
 * - Authentic 2-stroke powerband acceleration, snappy RPM & neutral revving
 * - Automatic kickstand folding when riding & resting left lean when parked
 * - Responsive motocross handlebar steering with high-speed caster self-centering & cornering lean
 * - Inverted USD front fork dive under front/rear wave disc braking & off-road terrain bumps
 */
export function stepDirtBike(
  state: DirtBike49ccState,
  input: ExpeditionVehicleInput & { rev?: boolean },
  dt: number,
  weather: WeatherType,
  occupied: boolean,
  elapsed = 0,
  floorYAt?: (x: number, z: number) => number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
  state.surface = state.inVault ? 'asphalt' : getTerrainSurfaceAt(state.x, state.z, weather);
  const surf = getSurfacePhysicsParams(state.surface);

  const maxSteerRad = (38 * Math.PI) / 180;

  if (!occupied) {
    // Coast cleanly to a stop and rest on the left-side folding kickstand
    state.speed *= Math.exp(-5.0 * safeDt);
    if (Math.abs(state.speed) < 0.05) state.speed = 0;
    state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);
    state.kickstandDown = state.speed < 0.15;
    state.revving = false;
    state.braking = false;
    state.throttle = 0;

    const parkedSteer = (14 * Math.PI) / 180;
    state.steerAngle += (parkedSteer - state.steerAngle) * Math.min(1, safeDt * 4.5);
    state.steerDeg = Math.round((state.steerAngle * 180) / Math.PI);

    const targetLean = state.kickstandDown ? -0.095 : 0;
    state.leanAngle += (targetLean - state.leanAngle) * Math.min(1, safeDt * 6.0);
    state.brakeDive *= Math.exp(-8.0 * safeDt);
    state.forkCompression *= Math.exp(-7.0 * safeDt);
    state.dustIntensity *= Math.exp(-5.5 * safeDt);

    const idleRpm = state.engineRunning ? 1850 + Math.sin(elapsed * 9.0) * 42 : 0;
    state.rpm += (idleRpm - state.rpm) * Math.min(1, safeDt * 7.5);
    state.exhaustIntensity = state.engineRunning ? 0.22 : 0;
    return;
  }

  // Active rider controls
  const isThrottling = input.forward > 0.05;
  const isReversing = input.forward < -0.05;
  const isBraking = input.brake || (isReversing && state.speed > 0.6);
  const isRevving = Boolean(input.rev) || isThrottling;

  state.braking = isBraking;
  state.revving = isRevving;
  state.throttle = isThrottling ? Math.min(1, input.forward * (input.boost ? 1.25 : 1.0)) : input.rev ? 0.82 : 0;

  if (isThrottling || isRevving) {
    state.engineRunning = true;
  }
  // Automatically fold kickstand up as soon as rider twists throttle or starts rolling
  if (isThrottling || Math.abs(state.speed) > 0.25) {
    state.kickstandDown = false;
  }

  // Handlebar steering (+steerAngle = turn left, -steerAngle = turn right)
  const turnInput = -input.turn; // input.turn: +1 = right -> negative steerAngle
  if (Math.abs(turnInput) > 0.02) {
    const targetSteer = turnInput * maxSteerRad;
    state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, safeDt * 9.5);
  } else if (Math.abs(state.speed) > 0.35) {
    // Realistic front fork caster self-centering while rolling
    state.steerAngle *= Math.exp(-5.2 * safeDt);
  } else {
    state.steerAngle *= Math.exp(-3.0 * safeDt);
  }
  state.steerAngle = Math.max(-maxSteerRad, Math.min(maxSteerRad, state.steerAngle));
  state.steerDeg = Math.round((state.steerAngle * 180) / Math.PI);

  // 49cc 2-stroke acceleration, powerband boost & wave disc braking
  const boostMul = input.boost ? 1.28 : 1.0;
  // Nimble off-road speeds: ~68 km/h normal (19 m/s), ~87 km/h with Shift 2-stroke powerband boost
  const maxFwdSpeed = Math.min(24.5, surf.maxSpeed * 0.84) * boostMul;
  const maxRevWalkSpeed = -4.2; // Gentle feet-down push-back
  const accelRate = 13.8 * (0.75 + surf.traction * 0.25) * boostMul;

  if (input.brake) {
    state.speed *= Math.exp(-8.2 * safeDt);
    if (Math.abs(state.speed) < 0.08) state.speed = 0;
  } else if (isThrottling) {
    state.speed = Math.min(maxFwdSpeed, state.speed + input.forward * accelRate * safeDt);
  } else if (isReversing) {
    if (state.speed > 0.6) {
      state.speed = Math.max(0, state.speed + input.forward * 19.5 * safeDt);
    } else {
      state.speed = Math.max(maxRevWalkSpeed, state.speed + input.forward * 6.5 * safeDt);
    }
  } else {
    state.speed *= Math.exp(-surf.drag * 1.9 * safeDt);
    if (Math.abs(state.speed) < 0.06) state.speed = 0;
  }

  // Heading update based on steering rake & rolling speed
  const turnEffectiveness =
    Math.min(1, Math.abs(state.speed) / 2.8) * (1 - Math.min(0.42, Math.abs(state.speed) / 36));
  const dirSign = state.speed >= -0.05 ? 1 : -1;
  state.heading += state.steerAngle * 2.85 * turnEffectiveness * dirSign * safeDt;

  // Horizontal world motion with water/world perimeter safety guard (bypassed when driving inside Underground Tunnel/Vault!)
  const nx = state.x + Math.sin(state.heading) * state.speed * safeDt;
  const nz = state.z + Math.cos(state.heading) * state.speed * safeDt;
  if (state.inVault) {
    state.x = nx;
    state.z = nz;
  } else if (Math.hypot(nx, nz) < WORLD_PLAYABLE_RADIUS - 8 && !isWaterAt(nx, nz)) {
    state.x = nx;
    state.z = nz;
  } else {
    state.speed *= 0.35;
  }

  // Terrain elevation & off-road suspension compression
  const groundY = floorYAt ? floorYAt(state.x, state.z) : walkableHeightWithFloor(state.x, state.z, state.y + 0.6);
  const prevY = state.y;
  state.y += (groundY - state.y) * Math.min(1, safeDt * 18);
  const verticalBump = Math.max(0, (groundY - prevY) * 2.4);

  // Front USD fork dive under front disc braking
  const targetBrakeDive = isBraking ? Math.min(0.92, Math.abs(state.speed) * 0.075 + 0.28) : 0;
  state.brakeDive += (targetBrakeDive - state.brakeDive) * Math.min(1, safeDt * 11.0);

  const roughRipple =
    Math.abs(state.speed) > 1.5 && state.surface !== 'asphalt'
      ? (Math.sin(elapsed * 18 + state.x * 1.4) * 0.5 + 0.5) * 0.16 * Math.min(1, Math.abs(state.speed) / 14)
      : 0;
  const targetCompression = Math.min(1, state.brakeDive * 0.85 + verticalBump + roughRipple);
  state.forkCompression += (targetCompression - state.forkCompression) * Math.min(1, safeDt * 12.0);

  // Dynamic motocross cornering lean angle (leans cleanly into turns when moving, kickstand tilt when stopped)
  let targetLean = 0;
  if (state.kickstandDown && Math.abs(state.speed) < 0.2) {
    targetLean = -0.095;
  } else {
    targetLean = -state.steerAngle * Math.min(0.72, Math.abs(state.speed) * 0.055);
  }
  state.leanAngle += (targetLean - state.leanAngle) * Math.min(1, safeDt * 8.5);

  // Spin knobby wheels accurately based on scaled rolling radius (~0.32m)
  state.wheelSpin += (state.speed * safeDt) / 0.32;
  state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);

  // 49cc 2-stroke RPM curve (1,850 idle -> 8,900 powerband scream)
  if (!state.engineRunning) {
    state.rpm += (0 - state.rpm) * Math.min(1, safeDt * 8);
  } else {
    const speedRatio = Math.min(1, Math.abs(state.speed) / 22);
    const targetRpm = isRevving
      ? Math.min(8900, 4800 + speedRatio * 3900 + (input.boost ? 550 : 0) + Math.sin(elapsed * 26) * 140)
      : 1850 + speedRatio * 3400 + Math.sin(elapsed * 11) * 55;
    state.rpm += (targetRpm - state.rpm) * Math.min(1, safeDt * 9.5);
  }
  state.rpm = Math.round(Math.max(0, Math.min(8900, state.rpm)));

  // Off-road dust & 2-stroke blue-white exhaust smoke intensity
  state.dustIntensity = Math.min(1, (Math.abs(state.speed) / 16) * surf.dustFactor);
  state.exhaustIntensity = state.engineRunning
    ? Math.min(1, 0.22 + (state.rpm / 8900) * 0.78)
    : 0;
}
