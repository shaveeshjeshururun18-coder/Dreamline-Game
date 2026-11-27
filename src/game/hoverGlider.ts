import {
  groundHeightAt,
  walkableHeightWithFloor,
  WATER_LEVEL,
  WORLD_PLAYABLE_RADIUS,
} from './terrain';
import type { ExpeditionVehicleInput } from './expeditionVehicles';

import {
  computeLookToFlyVerticalRate,
  type LookToFlyOptions,
  type LookToFlyResult,
} from './lookToFly';

export { computeLookToFlyVerticalRate, type LookToFlyOptions, type LookToFlyResult };

// Parked cleanly on the sunlit front terrace promenade beside En Illam (My House)
export const HOVER_GLIDER_SPAWN = {
  x: -14.2,
  z: -13.5,
  heading: Math.PI * 0.15,
} as const;

export interface HoverGliderState {
  x: number;
  y: number;
  z: number;
  heading: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number; // horizontal m/s
  speedKmh: number;
  altitudeM: number; // world Y
  aglM: number; // height above surface/water/vault floor
  pitch: number; // radians (+nose down / forward surge, -nose up climb)
  roll: number; // radians (dynamic banking carve)
  turbineRpm: number; // 18000..96000 RPM miniature twin turbofans
  turbinePct: number; // 0..100%
  rotorAngle: number; // accumulated radians for twin compressor rotors
  boostActive: boolean;
  afterburnerGlow: number; // 0..1 cyan/white plume intensity
  skidProgress: number; // 1 = extended for landing/parked, 0 = smoothly retracted in flight
  hoverBobPhase: number;
  onGround: boolean;
  lookPitchDrive: number; // -1..1 for subtle HUD/visual feedback
  inVault?: boolean;
}

export function createInitialHoverGliderState(): HoverGliderState {
  const groundY = Math.max(WATER_LEVEL + 0.25, groundHeightAt(HOVER_GLIDER_SPAWN.x, HOVER_GLIDER_SPAWN.z));
  const hoverY = groundY + 0.36;
  return {
    x: HOVER_GLIDER_SPAWN.x,
    y: hoverY,
    z: HOVER_GLIDER_SPAWN.z,
    heading: HOVER_GLIDER_SPAWN.heading,
    vx: 0,
    vy: 0,
    vz: 0,
    speed: 0,
    speedKmh: 0,
    altitudeM: Math.round(hoverY),
    aglM: 0.36,
    pitch: 0,
    roll: 0,
    turbineRpm: 18500,
    turbinePct: 18,
    rotorAngle: 0,
    boostActive: false,
    afterburnerGlow: 0.18,
    skidProgress: 1,
    hoverBobPhase: 0,
    onGround: true,
    lookPitchDrive: 0,
  };
}

export interface HoverGliderInput extends ExpeditionVehicleInput {
  /** Current camera pitch in radians for effortless buttonless Look-to-Fly climb/dive. */
  cameraPitch?: number;
}

/**
 * Pure deterministic 3D hover & sky-flight physics for the Aero-Ti Brushed Titanium & Matte Carbon Hoverboard Glider:
 * - Ground-effect low hover (~0.85m AGL) over land, water, rooftops & underground Mega-Chamber floor
 * - Seamless camera-directed Look-to-Fly: look UP + W to climb skyward, look DOWN + W to dive (zero Up/Down buttons needed!)
 * - Optional Space / Ctrl / Q overrides for vertical hover ascent/descent in place
 * - Twin miniature rear jet turbines with Shift afterburner boost (~165 km/h) and auto-retracting brushed-titanium skids
 */
export function stepHoverGlider(
  state: HoverGliderState,
  input: HoverGliderInput,
  dt: number,
  elapsed: number,
  occupied: boolean,
  floorYAt?: (x: number, z: number) => number,
  ceilingY?: number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
  state.hoverBobPhase = elapsed * 2.6;

  const surfaceY = floorYAt
    ? floorYAt(state.x, state.z)
    : Math.max(WATER_LEVEL + 0.2, walkableHeightWithFloor(state.x, state.z, state.y + 0.5));

  if (!occupied) {
    // Gently settle to parked low-hover / landing skids rest state
    state.vx *= Math.exp(-4.5 * safeDt);
    state.vz *= Math.exp(-4.5 * safeDt);
    const parkedY = surfaceY + 0.32;
    if (state.y > parkedY + 0.05) {
      state.vy = Math.max(-5.5, state.vy - 6.0 * safeDt);
      state.y = Math.max(parkedY, state.y + state.vy * safeDt);
    } else {
      state.y += (parkedY - state.y) * Math.min(1, safeDt * 6.0);
      state.vy = 0;
    }
    state.speed = Math.hypot(state.vx, state.vz);
    state.speedKmh = Math.round(state.speed * 3.6);
    state.aglM = Math.max(0, state.y - surfaceY);
    state.altitudeM = Math.round(state.y);
    state.onGround = state.aglM <= 0.55;
    state.pitch *= Math.exp(-6.5 * safeDt);
    state.roll *= Math.exp(-6.5 * safeDt);
    state.boostActive = false;
    state.lookPitchDrive = 0;
    state.skidProgress = Math.min(1, state.skidProgress + safeDt * 2.2);
    state.turbineRpm += (18500 - state.turbineRpm) * Math.min(1, safeDt * 4.0);
    state.turbinePct = Math.round((state.turbineRpm / 96000) * 100);
    state.rotorAngle += (10 + (state.turbineRpm / 96000) * 32) * safeDt;
    state.afterburnerGlow += (0.16 - state.afterburnerGlow) * Math.min(1, safeDt * 4.5);
    return;
  }

  // Nimble athletic surf/glider carving yaw turn
  const yawRate = 2.05;
  state.heading -= input.turn * yawRate * safeDt;

  const sinH = Math.sin(state.heading);
  const cosH = Math.cos(state.heading);
  const boostActive = Boolean(input.boost && (Math.abs(input.forward) > 0.05 || input.ascend));
  const maxHorizSpeed = boostActive ? 46.2 : 30.5; // ~166 km/h boost, ~110 km/h cruise
  const accelRate = boostActive ? 34.0 : 21.5;

  if (input.forward > 0.04) {
    state.vx += sinH * input.forward * accelRate * safeDt;
    state.vz += cosH * input.forward * accelRate * safeDt;
  } else if (input.forward < -0.04) {
    // Reverse airbrake / smooth hover back-step
    const currentFwd = state.vx * sinH + state.vz * cosH;
    if (currentFwd > 1.2) {
      state.vx *= Math.exp(-4.8 * safeDt);
      state.vz *= Math.exp(-4.8 * safeDt);
    } else {
      state.vx += sinH * input.forward * 13.0 * safeDt;
      state.vz += cosH * input.forward * 13.0 * safeDt;
    }
  } else {
    // Magnetic hover air-damping
    state.vx *= Math.exp(-2.1 * safeDt);
    state.vz *= Math.exp(-2.1 * safeDt);
  }

  // Clamp max horizontal speed & carve velocity cleanly along heading
  let horizSpeed = Math.hypot(state.vx, state.vz);
  if (horizSpeed > maxHorizSpeed) {
    const scale = maxHorizSpeed / horizSpeed;
    state.vx *= scale;
    state.vz *= scale;
    horizSpeed = maxHorizSpeed;
  }
  if (horizSpeed > 2.2 && input.forward >= -0.04) {
    const carveAlign = Math.min(1, safeDt * 4.4);
    state.vx += (sinH * horizSpeed - state.vx) * carveAlign;
    state.vz += (cosH * horizSpeed - state.vz) * carveAlign;
  }

  // Vertical flight: manual Space/Ctrl overrides OR natural buttonless Look-to-Fly camera pitch!
  const lookFly = computeLookToFlyVerticalRate(input.cameraPitch, input.forward, {
    neutralPitch: 0.16,
    deadzone: 0.08,
    maxClimbRate: boostActive ? 24.0 : 17.5,
    maxDiveRate: boostActive ? 22.0 : 16.5,
  });
  state.lookPitchDrive = lookFly.normalizedPitch;

  let targetVy = 0;
  if (input.ascend) {
    targetVy = boostActive ? 21.0 : 14.5;
  } else if (input.descend) {
    targetVy = -14.0;
  } else if (lookFly.active) {
    targetVy = lookFly.verticalRate;
  } else if (state.aglM < 0.85 && horizSpeed > 2.5) {
    // Subtle ground-effect cushion lift to ~0.90m AGL while skimming smoothly over terrain/water
    targetVy = (0.9 - state.aglM) * 3.8;
  }

  state.vy += (targetVy - state.vy) * Math.min(1, safeDt * 5.8);

  state.x += state.vx * safeDt;
  state.z += state.vz * safeDt;
  state.y += state.vy * safeDt;

  // World perimeter guard (bypassed when flying inside Secret Underground Tunnel / 1 KM Mega-Chamber)
  if (!state.inVault) {
    const r = Math.hypot(state.x, state.z);
    if (r > WORLD_PLAYABLE_RADIUS - 12) {
      const s = (WORLD_PLAYABLE_RADIUS - 12) / r;
      state.x *= s;
      state.z *= s;
    }
  }

  const nextSurfaceY = floorYAt
    ? floorYAt(state.x, state.z)
    : Math.max(WATER_LEVEL + 0.2, walkableHeightWithFloor(state.x, state.z, state.y + 0.5));
  const minHoverY = nextSurfaceY + (input.descend ? 0.24 : 0.62);
  const maxAltY = ceilingY ?? 180;

  if (state.y <= minHoverY && targetVy <= 0.1) {
    state.y = minHoverY;
    if (state.vy < 0) state.vy = 0;
  } else if (state.y > maxAltY) {
    state.y = maxAltY;
    if (state.vy > 0) state.vy = 0;
  }

  state.speed = Math.hypot(state.vx, state.vz);
  state.aglM = Math.max(0, state.y - nextSurfaceY);
  state.altitudeM = Math.round(state.aglM);
  state.onGround = state.aglM <= 0.85 && Math.abs(state.vy) < 0.8;
  state.speedKmh = Math.round(Math.hypot(state.speed, state.vy * 0.45) * 3.6);
  state.boostActive = boostActive;

  // Dynamic aerodynamic attitude: crisp surf banking roll + pitch-into-climb/dive
  const speedNorm = Math.min(1, state.speed / 30.0);
  const targetRoll = Math.max(-0.54, Math.min(0.54, -input.turn * (0.22 + speedNorm * 0.34)));
  // Visual pitch: nose tilts UP (-pitch in local +Z forward rig) on climb, tilts DOWN (+pitch) on dive/forward surge
  const targetPitch = Math.max(
    -0.42,
    Math.min(0.42, input.forward * 0.14 - (state.vy / 20.0) * 0.36)
  );
  state.roll += (targetRoll - state.roll) * Math.min(1, safeDt * 7.5);
  state.pitch += (targetPitch - state.pitch) * Math.min(1, safeDt * 6.8);

  // Auto-retract landing skids cleanly when airborne or cruising above low hover
  const targetSkids = state.aglM < 1.35 && state.speed < 4.5 ? 1 : 0;
  state.skidProgress += (targetSkids - state.skidProgress) * Math.min(1, safeDt * 4.2);

  // Twin miniature turbofan jet RPM, spinning intake rotors & cyan-white exhaust plume intensity
  const thrustLoad = Math.min(
    1,
    Math.max(
      Math.abs(input.forward) * 0.72,
      Math.abs(state.vy) / 20.0,
      speedNorm * 0.65
    ) + (boostActive ? 0.32 : 0)
  );
  const targetRpm = 22000 + thrustLoad * 74000;
  state.turbineRpm += (targetRpm - state.turbineRpm) * Math.min(1, safeDt * 6.5);
  state.turbinePct = Math.round(Math.min(100, Math.max(18, (state.turbineRpm / 96000) * 100)));
  state.rotorAngle += (14 + (state.turbineRpm / 96000) * 58) * safeDt;

  const targetGlow = Math.min(1, 0.24 + thrustLoad * 0.56 + (boostActive ? 0.3 : 0));
  state.afterburnerGlow += (targetGlow - state.afterburnerGlow) * Math.min(1, safeDt * 8.0);
}
