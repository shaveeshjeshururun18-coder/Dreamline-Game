import { groundHeightAt, isWaterAt, WORLD_PLAYABLE_RADIUS } from './terrain';
import {
  clampVaultPosition,
  isInsideVaultDriveExitTunnel,
  VAULT_BATMOBILE_BAY,
  VAULT_FLOOR_Y,
  VAULT_SURFACE_DRIVE_EXIT,
} from './homeUndergroundVault';

export interface BatmobileState {
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number; // m/s signed
  speedKmh: number;
  steerAngle: number;
  wheelSpin: number;
  suspensionBounce: number;
  boostActive: boolean;
  canopyOpen: boolean;
  canopyProgress: number; // 0 = closed, 1 = open
  headlightsOn: boolean;
  detectiveScanActive: boolean;
  integrity: number; // 0..100 visual damage & repair state
  cameraMode: 'chase' | 'cinematic' | 'cockpit';
  inVault?: boolean;
}

export const BATMOBILE_MAX_SPEED = 46.5; // ~167 km/h with jet boost
export const BATMOBILE_CRUISE_SPEED = 32.0; // ~115 km/h standard drive
export const BATMOBILE_REVERSE_SPEED = 12.5;

export function createInitialBatmobileState(): BatmobileState {
  return {
    x: VAULT_BATMOBILE_BAY.x,
    y: VAULT_BATMOBILE_BAY.y,
    z: VAULT_BATMOBILE_BAY.z,
    heading: VAULT_BATMOBILE_BAY.heading,
    speed: 0,
    speedKmh: 0,
    steerAngle: 0,
    wheelSpin: 0,
    suspensionBounce: 0,
    boostActive: false,
    canopyOpen: false,
    canopyProgress: 0,
    headlightsOn: true,
    detectiveScanActive: false,
    integrity: 100,
    cameraMode: 'chase',
    inVault: true,
  };
}

export function stepBatmobileState(
  prev: BatmobileState,
  throttle: number,
  steerInput: number,
  boostPressed: boolean,
  brakePressed: boolean,
  dt: number
): { state: BatmobileState; ramImpulse: number; exitedToSurface?: boolean } {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const boosting = boostPressed && throttle > 0.1 && !brakePressed;
  const inVaultNow = Boolean(prev.inVault);
  const maxFwd = inVaultNow
    ? boosting
      ? 26.0
      : 19.0
    : boosting
      ? BATMOBILE_MAX_SPEED
      : BATMOBILE_CRUISE_SPEED;

  let speed = prev.speed;
  if (brakePressed) {
    const brakeDecel = 38.0 * safeDt;
    if (Math.abs(speed) <= brakeDecel) speed = 0;
    else speed -= Math.sign(speed) * brakeDecel;
  } else if (throttle > 0.05) {
    const accel = boosting ? 32.0 : 20.5;
    speed = Math.min(maxFwd, speed + throttle * accel * safeDt);
  } else if (throttle < -0.05) {
    if (speed > 0.5) {
      speed = Math.max(0, speed - 30.0 * safeDt);
    } else {
      speed = Math.max(-BATMOBILE_REVERSE_SPEED, speed + throttle * 15.0 * safeDt);
    }
  } else {
    // Aerodynamic drag + rolling resistance
    const drag = (6.5 + Math.abs(speed) * 0.25) * safeDt;
    if (Math.abs(speed) <= drag) speed = 0;
    else speed -= Math.sign(speed) * drag;
  }

  const targetSteer = Math.max(-0.56, Math.min(0.56, -steerInput * 0.56));
  const steerAngle = prev.steerAngle + (targetSteer - prev.steerAngle) * Math.min(1, safeDt * 9.5);

  const speedSign = speed >= -0.05 ? 1 : -1;
  const turnFactor = Math.min(1, Math.abs(speed) / 5.5) * (1 - Math.min(0.42, Math.abs(speed) / 90));
  let heading = prev.heading + steerAngle * turnFactor * 2.45 * speedSign * safeDt;

  let nextX = prev.x + Math.sin(heading) * speed * safeDt;
  let nextZ = prev.z + Math.cos(heading) * speed * safeDt;
  let nextY = prev.y;
  let inVault = inVaultNow;
  let exitedToSurface = false;

  if (inVault) {
    if (isInsideVaultDriveExitTunnel(nextX, nextZ) && speed > 1.5) {
      inVault = false;
      exitedToSurface = true;
      nextX = VAULT_SURFACE_DRIVE_EXIT.x;
      nextZ = VAULT_SURFACE_DRIVE_EXIT.z;
      heading = VAULT_SURFACE_DRIVE_EXIT.heading;
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    } else {
      const clamped = clampVaultPosition(nextX, nextZ, 2.5);
      const safeZ = Math.max(-14.2, clamped.z);
      if (clamped.hitWall || safeZ !== clamped.z) {
        speed *= -0.2;
      }
      nextX = clamped.x;
      nextZ = safeZ;
      nextY = VAULT_FLOOR_Y;
    }
  } else {
    // Keep cleanly within world boundary and out of deep water
    const worldR = Math.hypot(nextX, nextZ);
    if (worldR > WORLD_PLAYABLE_RADIUS - 12 || isWaterAt(nextX, nextZ)) {
      nextX = prev.x;
      nextZ = prev.z;
      speed *= -0.25;
    }
    nextY = Math.max(0, groundHeightAt(nextX, nextZ));
  }
  const wheelSpin = prev.wheelSpin + (speed / 0.56) * safeDt;
  const targetCanopy = prev.canopyOpen ? 1 : 0;
  const canopyProgress =
    prev.canopyProgress + (targetCanopy - prev.canopyProgress) * Math.min(1, safeDt * 4.5);

  const speedDelta = Math.abs(speed - prev.speed);
  const suspensionBounce =
    prev.suspensionBounce * Math.max(0, 1 - safeDt * 8.5) +
    Math.min(0.14, speedDelta * 0.012 + (boosting ? 0.03 : 0));

  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const ramImpulse = Math.abs(speed) > 10 ? Math.abs(speed) * (boosting ? 1.55 : 1.0) : 0;

  return {
    state: {
      ...prev,
      x: nextX,
      y: nextY,
      z: nextZ,
      heading,
      speed,
      speedKmh,
      steerAngle,
      wheelSpin,
      suspensionBounce,
      boostActive: boosting,
      canopyProgress,
      inVault,
    },
    ramImpulse,
    exitedToSurface,
  };
}

export function getBatmobileExitPosition(state: BatmobileState): { x: number; z: number } {
  // Exit cleanly to the left side of the armoured Batmobile
  const leftX = Math.cos(state.heading);
  const leftZ = -Math.sin(state.heading);
  return {
    x: state.x + leftX * 3.1,
    z: state.z + leftZ * 3.1,
  };
}

export function repairBatmobile(state: BatmobileState): BatmobileState {
  return {
    ...state,
    integrity: 100,
    suspensionBounce: 0.08,
  };
}
