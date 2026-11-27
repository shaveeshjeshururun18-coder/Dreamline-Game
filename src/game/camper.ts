import type { CamperState } from './types';
import {
  ENCHANTED_FOREST_CENTER,
  isWaterAt,
  WORLD_PLAYABLE_RADIUS,
  type AabbCollider,
} from './terrain';

export const CAMPER_HOME_POS = {
  x: ENCHANTED_FOREST_CENTER.x + 3.8,
  z: ENCHANTED_FOREST_CENTER.z + 1.8,
  heading: -0.58,
};

export const CAMPER_MAX_FORWARD_SPEED = 14.5;
export const CAMPER_MAX_REVERSE_SPEED = -5.8;
export const CAMPER_MAX_STEER_ANGLE = 0.52;
export const CAMPER_WHEELBASE = 2.92;
export const CAMPER_WHEEL_RADIUS = 0.42;

export function createInitialCamperState(): CamperState {
  return {
    name: 'Olga — Pastel Camper',
    x: CAMPER_HOME_POS.x,
    z: CAMPER_HOME_POS.z,
    heading: CAMPER_HOME_POS.heading,
    speed: 0,
    speedKmh: 0,
    steerAngle: 0,
    wheelSpin: 0,
    isBraking: false,
    doorsOpen: false,
    roofPopped: false,
    headlightsOn: true,
    hazardsOn: false,
    leftIndicator: false,
    rightIndicator: false,
  };
}

/**
 * Pure bicycle-model camper van kinematics with smooth steering, braking,
 * water-shore protection, world boundary, and AABB obstacle avoidance.
 */
export function stepCamperState(
  prev: CamperState,
  throttleForward: number,
  steerRight: number,
  isBrakingInput: boolean,
  colliders: AabbCollider[],
  dt: number
): CamperState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let { x, z, heading, speed, steerAngle, wheelSpin } = prev;

  // Smooth steering (steerRight > 0 turns right -> negative steerAngle)
  const targetSteer = Math.max(-1, Math.min(1, -steerRight)) * CAMPER_MAX_STEER_ANGLE;
  steerAngle += (targetSteer - steerAngle) * Math.min(1, cdt * 6.5);

  const accelRate = 8.4;
  const reverseRate = 5.6;
  const brakeRate = 15.0;
  const dragRate = 2.8;

  let isBraking = false;
  if (isBrakingInput) {
    isBraking = true;
    if (Math.abs(speed) < 0.15) speed = 0;
    else speed -= Math.sign(speed) * brakeRate * cdt;
  } else if (throttleForward > 0.06) {
    if (speed < -0.1) {
      isBraking = true;
      speed += brakeRate * cdt;
    } else {
      speed = Math.min(CAMPER_MAX_FORWARD_SPEED, speed + throttleForward * accelRate * cdt);
    }
  } else if (throttleForward < -0.06) {
    if (speed > 0.2) {
      isBraking = true;
      speed -= brakeRate * cdt;
    } else {
      speed = Math.max(CAMPER_MAX_REVERSE_SPEED, speed + throttleForward * reverseRate * cdt);
    }
  } else {
    if (Math.abs(speed) < 0.06) speed = 0;
    else speed -= Math.sign(speed) * dragRate * cdt;
  }

  const angularVel = (speed / CAMPER_WHEELBASE) * Math.tan(steerAngle);
  heading += angularVel * cdt;

  let nextX = x + Math.sin(heading) * speed * cdt;
  let nextZ = z + Math.cos(heading) * speed * cdt;

  if (!prev.inVault) {
    // Keep inside playable world radius
    const distOrigin = Math.hypot(nextX, nextZ);
    if (distOrigin > WORLD_PLAYABLE_RADIUS - 3.0) {
      const f = (WORLD_PLAYABLE_RADIUS - 3.0) / distOrigin;
      nextX *= f;
      nextZ *= f;
      speed *= -0.2;
    }

    // Keep camper van dry on land
    if (isWaterAt(nextX, nextZ)) {
      nextX = x;
      nextZ = z;
      speed *= -0.22;
    }

    // Soft AABB collision resolution (radius 1.45m)
    const vanR = 1.45;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.minY !== undefined && c.minY > 2.2) continue;
      const minX = c.minX - vanR;
      const maxX = c.maxX + vanR;
      const minZ = c.minZ - vanR;
      const maxZ = c.maxZ + vanR;
      if (nextX > minX && nextX < maxX && nextZ > minZ && nextZ < maxZ) {
        const pL = Math.abs(nextX - minX);
        const pR = Math.abs(maxX - nextX);
        const pT = Math.abs(nextZ - minZ);
        const pB = Math.abs(maxZ - nextZ);
        const m = Math.min(pL, pR, pT, pB);
        if (m === pL) nextX = minX;
        else if (m === pR) nextX = maxX;
        else if (m === pT) nextZ = minZ;
        else nextZ = maxZ;
        speed *= 0.35;
      }
    }
  }

  x = nextX;
  z = nextZ;
  wheelSpin += (speed / CAMPER_WHEEL_RADIUS) * cdt;

  return {
    ...prev,
    x,
    z,
    heading,
    speed,
    speedKmh: Math.round(Math.abs(speed) * 3.6),
    steerAngle,
    wheelSpin,
    isBraking,
  };
}

export function getCamperExitPosition(camper: CamperState): {
  x: number;
  z: number;
  heading: number;
} {
  // Step cleanly outside the sliding passenger door (-X side of van)
  const sideDist = 2.05;
  const cosH = Math.cos(camper.heading);
  const sinH = Math.sin(camper.heading);
  return {
    x: camper.x - cosH * sideDist,
    z: camper.z + sinH * sideDist,
    heading: camper.heading,
  };
}
