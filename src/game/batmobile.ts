import { groundHeightAt, isWaterAt, WORLD_PLAYABLE_RADIUS } from './terrain';
import {
  clampVaultPosition,
  isEnteringHouseSecretTunnelFromSurface,
  isInsideMegaChamber,
  VAULT_BATMOBILE_BAY,
  VAULT_CONNECTOR_MAX_X,
  VAULT_CONNECTOR_MIN_X,
  VAULT_HALF_X,
  VAULT_HALF_Z,
  VAULT_HOME_TUNNEL_MAX_X,
  VAULT_HOME_TUNNEL_MIN_X,
  VAULT_HOME_TUNNEL_MOUTH_Z,
  VAULT_MEGA_START_Z,
  VAULT_PASSAGE_HALF_Z,
  VAULT_SURFACE_DRIVE_EXIT,
  vaultFloorYAt,
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
  dt: number,
  exitGateProgress = 1,
  houseTunnelProgress = 1
): { state: BatmobileState; ramImpulse: number; exitedToSurface?: boolean; enteredVault?: boolean } {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const boosting = boostPressed && throttle > 0.1 && !brakePressed;
  const inVaultNow = Boolean(prev.inVault);
  const inMega = inVaultNow && isInsideMegaChamber(prev.x, prev.z);
  const inPassage =
    inVaultNow && (prev.x > 25.0 || (prev.z < -VAULT_HALF_Z + 2.0 && prev.z > VAULT_MEGA_START_Z));
  const maxFwd = inVaultNow
    ? inMega
      ? boosting
        ? 64.0 // ~230 km/h Bat-Jet proving run down the 1 KM Mega-Chamber!
        : 45.0
      : inPassage
        ? boosting
          ? 38.0
          : 28.0
        : boosting
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
    const accel = boosting ? 34.0 : 21.5;
    speed = Math.min(maxFwd, speed + throttle * accel * safeDt);
  } else if (throttle < -0.05) {
    if (speed > 0.5) {
      speed = Math.max(0, speed - 30.0 * safeDt);
    } else {
      speed = Math.max(-BATMOBILE_REVERSE_SPEED, speed + throttle * 15.0 * safeDt);
    }
  } else {
    // Aerodynamic drag + rolling resistance
    const drag = (6.5 + Math.abs(speed) * 0.23) * safeDt;
    if (Math.abs(speed) <= drag) speed = 0;
    else speed -= Math.sign(speed) * drag;
  }

  const targetSteer = Math.max(-0.56, Math.min(0.56, -steerInput * 0.56));
  const steerAngle = prev.steerAngle + (targetSteer - prev.steerAngle) * Math.min(1, safeDt * 9.5);

  const speedSign = speed >= -0.05 ? 1 : -1;
  const turnFactor = Math.min(1, Math.abs(speed) / 5.5) * (1 - Math.min(0.45, Math.abs(speed) / 98));
  const heading = prev.heading + steerAngle * turnFactor * 2.45 * speedSign * safeDt;

  let nextX = prev.x + Math.sin(heading) * speed * safeDt;
  let nextZ = prev.z + Math.cos(heading) * speed * safeDt;
  let nextY = prev.y;
  let inVault = inVaultNow;
  let exitedToSurface = false;
  let enteredVault = false;

  if (inVault) {
    const gateOpen = exitGateProgress > 0.6;
    const houseOpen = houseTunnelProgress > 0.45;

    // A. Real physical exit out the open Superhero House Secret Tunnel Portal (ZERO teleport!)
    if (
      houseOpen &&
      nextX >= VAULT_HOME_TUNNEL_MIN_X - 0.5 &&
      nextX <= VAULT_HOME_TUNNEL_MAX_X + 0.5 &&
      nextZ >= VAULT_HOME_TUNNEL_MOUTH_Z - 0.15 &&
      Math.cos(heading) * speed > 0.4
    ) {
      inVault = false;
      exitedToSurface = true;
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    }
    // B. Real physical exit out the open 94m East Driving Ramp Crest (ZERO teleport!)
    else if (
      gateOpen &&
      nextX >= VAULT_SURFACE_DRIVE_EXIT.x - 0.4 &&
      Math.abs(nextZ) <= VAULT_PASSAGE_HALF_Z &&
      speed > 0.5
    ) {
      inVault = false;
      exitedToSurface = true;
      nextX = Math.min(nextX, VAULT_SURFACE_DRIVE_EXIT.x + 0.35);
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    } else {
      const clamped = clampVaultPosition(nextX, nextZ, 2.0, gateOpen, houseOpen);
      const inConnectorMouth =
        clamped.x >= VAULT_CONNECTOR_MIN_X && clamped.x <= VAULT_CONNECTOR_MAX_X;
      const inMainHall =
        clamped.x > -VAULT_HALF_X &&
        clamped.x <= VAULT_HALF_X &&
        clamped.z >= -VAULT_HALF_Z &&
        clamped.z <= VAULT_HALF_Z;
      const safeZ =
        inMainHall && !inConnectorMouth ? Math.max(-14.2, clamped.z) : clamped.z;
      if (clamped.hitWall || safeZ !== clamped.z) {
        speed *= -0.2;
      }
      nextX = clamped.x;
      nextZ = safeZ;
      nextY = vaultFloorYAt(nextX, nextZ);
    }
  } else {
    // Check if driving straight North from front yard INTO the open Superhero House Secret Tunnel!
    if (
      isEnteringHouseSecretTunnelFromSurface(nextX, nextZ, houseTunnelProgress) &&
      Math.cos(heading) * speed < -0.35
    ) {
      inVault = true;
      enteredVault = true;
      nextY = vaultFloorYAt(nextX, nextZ);
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
    enteredVault,
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
