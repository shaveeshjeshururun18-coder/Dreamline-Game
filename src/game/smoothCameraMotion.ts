/**
 * Pure, frame-rate independent critically damped spring-damper motion & moving-screen camera controller.
 *
 * Implements industry-standard AAA 3rd-person character & camera smoothing:
 * - Analytical critically damped spring integration (Game Programming Gems 4 / Ryan Juckett Padé exp)
 *   with zero overshoot, C1 velocity continuity, and unconditional stability across 30–240Hz.
 * - Shortest-arc angular wrapping across the ±PI seam.
 * - Decoupled pointer/touch screen orbit targets with subtle release inertia.
 * - Asymmetric camera boom collision recovery (fast pull-in, silky smooth pull-out).
 * - Velocity-proportional camera look-ahead & speed/flight dynamic FOV.
 * - Smooth player & hero input ramping, banking/pitch lean, and stair/slope visual elevation filtering.
 */

export interface ScalarSpringResult {
  value: number;
  velocity: number;
}

export interface SmoothCameraState {
  // Smoothed rendered orbit angles & zoom distance
  yaw: number;
  pitch: number;
  distance: number;
  // Target orbit angles & zoom distance driven by mouse/touch/wheel/auto-follow
  targetYaw: number;
  targetPitch: number;
  targetDistance: number;
  // Critically damped spring velocities for orbit & zoom
  yawVel: number;
  pitchVel: number;
  distanceVel: number;
  // Subtle inertial glide velocity after pointer/touch drag release
  orbitInertiaYaw: number;
  orbitInertiaPitch: number;
  // Cooldown timer after manual drag before gentle auto-follow engages
  manualOrbitCooldown: number;
  // Asymmetric smoothed boom collision factor (0.32..1.0)
  boomScale: number;
  boomScaleVel: number;
  // Critically damped 3D camera world position & velocity
  posX: number;
  posY: number;
  posZ: number;
  posVx: number;
  posVy: number;
  posVz: number;
  // Critically damped 3D camera look-at anchor & velocity
  lookX: number;
  lookY: number;
  lookZ: number;
  lookVx: number;
  lookVy: number;
  lookVz: number;
  // Smoothed velocity look-ahead vector
  lookAheadX: number;
  lookAheadY: number;
  lookAheadZ: number;
  // Smoothed dynamic vertical FOV (degrees)
  fov: number;
  fovVel: number;
  // Track last known anchor to auto-detect teleports
  lastAnchorX: number;
  lastAnchorY: number;
  lastAnchorZ: number;
  initialized: boolean;
}

export interface SmoothLocomotionState {
  // Filtered movement input axes (eliminates abrupt digital WASD start/stop jerk)
  inputForward: number;
  inputRight: number;
  // Critically damped character heading & angular velocity
  heading: number;
  headingVel: number;
  // Smooth visual elevation (eliminates stair/curb/platform pop without altering collision Y)
  visualY: number;
  visualYVel: number;
  // Smoothed hero/player lateral turn bank & forward lean (radians)
  bankRad: number;
  bankVel: number;
  pitchLeanRad: number;
  pitchLeanVel: number;
  // Smooth 0..1 flight surge blend (hover -> high-speed superhero flight)
  flightSurgeBlend: number;
  // Last physics coordinates for teleport detection
  lastPhysX: number;
  lastPhysY: number;
  lastPhysZ: number;
  initialized: boolean;
}

const EPSILON = 1e-4;
const TWO_PI = Math.PI * 2;

export function clampDt(dt: number, maxDt = 0.08): number {
  if (!Number.isFinite(dt)) return 1 / 60;
  return Math.min(Math.max(dt, 0.0005), maxDt);
}

/**
 * Shortest signed angular difference (target - current) wrapped into [-PI, PI].
 */
export function wrapAngleDelta(delta: number): number {
  let d = delta % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

/**
 * Normalizes any angle into [-PI, PI].
 */
export function normalizeAngle(rad: number): number {
  return wrapAngleDelta(rad);
}

/**
 * Smooth frame-delta EMA filter that suppresses single-frame GC spikes
 * without lagging behind real frame-rate changes.
 */
export function filterFrameDt(prevSmoothedDt: number, rawDt: number, isSoftwareGl: boolean): number {
  const maxDt = isSoftwareGl ? 0.1 : 0.05;
  const clamped = Math.min(Math.max(Number.isFinite(rawDt) ? rawDt : 1 / 60, 0.001), maxDt);
  if (isSoftwareGl || prevSmoothedDt <= 0) return clamped;
  // Blend gently toward new dt, capping sudden single-frame spikes to 1.6x previous
  const spikeCapped = Math.min(clamped, Math.max(prevSmoothedDt * 1.65, 1 / 45));
  return prevSmoothedDt * 0.35 + spikeCapped * 0.65;
}

/**
 * Analytical Critically Damped Spring-Damper (Padé exponential approximation).
 * Converges smoothly with ZERO overshoot and C1 continuous velocity at any frame rate.
 */
export function dampScalarSpring(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  dt: number
): ScalarSpringResult {
  const safeDt = clampDt(dt);
  const safeSmooth = Math.max(0.004, smoothTime);
  const change = current - target;

  if (Math.abs(change) < EPSILON && Math.abs(velocity) < EPSILON) {
    return { value: target, velocity: 0 };
  }

  const omega = 2.0 / safeSmooth;
  const x = omega * safeDt;
  const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
  const temp = (velocity + omega * change) * safeDt;
  const nextVel = (velocity - omega * temp) * exp;
  let nextVal = target + (change + temp) * exp;

  // Prevent numerical overshoot past target when starting from rest or very close
  if ((target - current > 0) === (nextVal > target) && Math.abs(nextVal - target) < 0.002) {
    nextVal = target;
    return { value: nextVal, velocity: 0 };
  }

  return { value: nextVal, velocity: nextVel };
}

/**
 * Critically damped spring for radian angles using shortest-arc wrapping across ±PI.
 */
export function dampAngleSpring(
  currentRad: number,
  targetRad: number,
  velocity: number,
  smoothTime: number,
  dt: number
): ScalarSpringResult {
  const shortestTarget = currentRad + wrapAngleDelta(targetRad - currentRad);
  const res = dampScalarSpring(currentRad, shortestTarget, velocity, smoothTime, dt);
  return {
    value: res.value,
    velocity: res.velocity,
  };
}

/**
 * Frame-rate independent exponential smoothing for simple scalar values.
 */
export function dampExp(current: number, target: number, lambda: number, dt: number): number {
  const safeDt = clampDt(dt);
  const t = 1 - Math.exp(-Math.max(0.01, lambda) * safeDt);
  const next = current + (target - current) * t;
  return Math.abs(target - next) < EPSILON ? target : next;
}

export function createInitialSmoothCameraState(
  yaw = 0.55,
  pitch = 0.14,
  distance = 4.6,
  fov = 52
): SmoothCameraState {
  return {
    yaw,
    pitch,
    distance,
    targetYaw: yaw,
    targetPitch: pitch,
    targetDistance: distance,
    yawVel: 0,
    pitchVel: 0,
    distanceVel: 0,
    orbitInertiaYaw: 0,
    orbitInertiaPitch: 0,
    manualOrbitCooldown: 0,
    boomScale: 1.0,
    boomScaleVel: 0,
    posX: 0,
    posY: 3.5,
    posZ: 18,
    posVx: 0,
    posVy: 0,
    posVz: 0,
    lookX: 0,
    lookY: 1.5,
    lookZ: 13,
    lookVx: 0,
    lookVy: 0,
    lookVz: 0,
    lookAheadX: 0,
    lookAheadY: 0,
    lookAheadZ: 0,
    fov,
    fovVel: 0,
    lastAnchorX: 0,
    lastAnchorY: 0,
    lastAnchorZ: 0,
    initialized: false,
  };
}

/**
 * Feeds mouse/touch drag deltas into the camera orbit targets and builds subtle release inertia.
 */
export function applyScreenOrbitInput(
  state: SmoothCameraState,
  dx: number,
  dy: number,
  sensitivity: number,
  minPitch = -0.18,
  maxPitch = 1.05
): void {
  // Clamp huge single-event pointer jumps (e.g. waking from tab switch)
  const clampedDx = Math.max(-180, Math.min(180, dx));
  const clampedDy = Math.max(-140, Math.min(140, dy));
  const deltaYaw = -clampedDx * sensitivity;
  const deltaPitch = clampedDy * sensitivity;

  state.targetYaw += deltaYaw;
  state.targetPitch = Math.max(minPitch, Math.min(maxPitch, state.targetPitch + deltaPitch));

  // Blend subtle release inertia (radians/sec equivalent, capped for velvet feel)
  const instYawVel = Math.max(-3.6, Math.min(3.6, deltaYaw * 24));
  const instPitchVel = Math.max(-2.2, Math.min(2.2, deltaPitch * 20));
  state.orbitInertiaYaw = state.orbitInertiaYaw * 0.55 + instYawVel * 0.45;
  state.orbitInertiaPitch = state.orbitInertiaPitch * 0.55 + instPitchVel * 0.45;
  state.manualOrbitCooldown = 1.8;
}

/**
 * Feeds mouse wheel zoom deltas into the smoothed camera distance target.
 */
export function applyScreenZoomInput(
  state: SmoothCameraState,
  deltaY: number,
  minDist = 3.2,
  maxDist = 12.5
): void {
  const clampedDelta = Math.max(-240, Math.min(240, deltaY));
  state.targetDistance = Math.max(
    minDist,
    Math.min(maxDist, state.targetDistance + clampedDelta * 0.004)
  );
}

/**
 * Synchronizes orbit targets immediately (used when external code explicitly sets camYaw/Pitch/Dist).
 */
export function syncSmoothCameraOrbitTargets(
  state: SmoothCameraState,
  yaw: number,
  pitch: number,
  distance: number
): void {
  state.yaw = yaw;
  state.targetYaw = yaw;
  state.yawVel = 0;
  state.pitch = pitch;
  state.targetPitch = pitch;
  state.pitchVel = 0;
  state.distance = distance;
  state.targetDistance = distance;
  state.distanceVel = 0;
  state.orbitInertiaYaw = 0;
  state.orbitInertiaPitch = 0;
}

/**
 * Immediately snaps camera world position, look-at anchor, and clears all spring velocities
 * so teleports and vehicle boarding transitions never swing across the map.
 */
export function syncSmoothCameraImmediate(
  state: SmoothCameraState,
  params: {
    yaw: number;
    pitch: number;
    distance: number;
    posX: number;
    posY: number;
    posZ: number;
    lookX: number;
    lookY: number;
    lookZ: number;
    anchorX?: number;
    anchorY?: number;
    anchorZ?: number;
    fov?: number;
  }
): void {
  syncSmoothCameraOrbitTargets(state, params.yaw, params.pitch, params.distance);
  state.posX = params.posX;
  state.posY = params.posY;
  state.posZ = params.posZ;
  state.posVx = 0;
  state.posVy = 0;
  state.posVz = 0;
  state.lookX = params.lookX;
  state.lookY = params.lookY;
  state.lookZ = params.lookZ;
  state.lookVx = 0;
  state.lookVy = 0;
  state.lookVz = 0;
  state.lookAheadX = 0;
  state.lookAheadY = 0;
  state.lookAheadZ = 0;
  state.boomScale = 1.0;
  state.boomScaleVel = 0;
  if (params.fov !== undefined) {
    state.fov = params.fov;
    state.fovVel = 0;
  }
  state.lastAnchorX = params.anchorX ?? params.lookX;
  state.lastAnchorY = params.anchorY ?? params.lookY;
  state.lastAnchorZ = params.anchorZ ?? params.lookZ;
  state.initialized = true;
}

export interface StepOrbitParams {
  dt: number;
  isDragging: boolean;
  /** Optional gentle auto-align yaw target (radians) when moving and not dragging */
  autoFollowYaw?: number | null;
  /** Strength of gentle auto-follow (0..1, 0 disables) */
  autoFollowStrength?: number;
  minPitch?: number;
  maxPitch?: number;
}

/**
 * Advances the smoothed screen orbit angles & zoom distance by one frame.
 */
export function stepSmoothCameraOrbit(state: SmoothCameraState, params: StepOrbitParams): void {
  const dt = clampDt(params.dt);
  const minPitch = params.minPitch ?? -0.18;
  const maxPitch = params.maxPitch ?? 1.05;

  if (params.isDragging) {
    state.manualOrbitCooldown = 1.8;
    // Decay stored release inertia gently while holding still during drag
    const dragDecay = Math.exp(-14 * dt);
    state.orbitInertiaYaw *= dragDecay;
    state.orbitInertiaPitch *= dragDecay;
  } else {
    // Apply subtle post-release inertial glide and decay rapidly to crisp stop
    if (Math.abs(state.orbitInertiaYaw) > 0.002 || Math.abs(state.orbitInertiaPitch) > 0.002) {
      state.targetYaw += state.orbitInertiaYaw * dt;
      state.targetPitch = Math.max(
        minPitch,
        Math.min(maxPitch, state.targetPitch + state.orbitInertiaPitch * dt)
      );
      const decay = Math.exp(-11.5 * dt);
      state.orbitInertiaYaw *= decay;
      state.orbitInertiaPitch *= decay;
    } else {
      state.orbitInertiaYaw = 0;
      state.orbitInertiaPitch = 0;
    }

    if (state.manualOrbitCooldown > 0) {
      state.manualOrbitCooldown = Math.max(0, state.manualOrbitCooldown - dt);
    }

    // Gentle auto-follow behind moving player/hero when user isn't orbiting manually
    if (
      params.autoFollowYaw !== undefined &&
      params.autoFollowYaw !== null &&
      (params.autoFollowStrength ?? 0) > 0.001 &&
      state.manualOrbitCooldown <= 0
    ) {
      const diff = wrapAngleDelta(params.autoFollowYaw - state.targetYaw);
      // Only nudge gently when moving roughly sideways/forward (don't fight walking straight toward camera)
      if (Math.abs(diff) < Math.PI * 0.78) {
        const alignRate = 1.45 * Math.min(1, params.autoFollowStrength ?? 0);
        state.targetYaw += diff * (1 - Math.exp(-alignRate * dt));
      }
    }
  }

  // Critically damped springs for silky-smooth yet instant-feeling screen orbiting & zooming
  const orbitSmooth = params.isDragging ? 0.042 : 0.058;
  const yawRes = dampScalarSpring(state.yaw, state.targetYaw, state.yawVel, orbitSmooth, dt);
  state.yaw = yawRes.value;
  state.yawVel = yawRes.velocity;

  const pitchRes = dampScalarSpring(state.pitch, state.targetPitch, state.pitchVel, orbitSmooth, dt);
  state.pitch = Math.max(minPitch, Math.min(maxPitch, pitchRes.value));
  state.pitchVel = pitchRes.velocity;

  const distRes = dampScalarSpring(state.distance, state.targetDistance, state.distanceVel, 0.095, dt);
  state.distance = distRes.value;
  state.distanceVel = distRes.velocity;
}

export interface StepFollowRigParams {
  dt: number;
  anchorX: number;
  anchorY: number;
  anchorZ: number;
  velX: number;
  velY: number;
  velZ: number;
  baseDistance: number;
  focusHeight: number;
  /** Desired boom collision factor from raycast (0.32..1.0) */
  desiredBoomScale: number;
  /** Vertical clearance floor at desired camera position */
  minCamY: number;
  /** Optional ceiling clamp (underground metro / cave) */
  maxCamY?: number;
  /** Base vertical FOV (degrees) before dynamic speed/flight kick */
  baseFov: number;
  /** Additional camera pitch vertical lift offset */
  verticalLift?: number;
  isFlying?: boolean;
  isWebSwinging?: boolean;
  isSprinting?: boolean;
  isHero?: boolean;
}

export interface SmoothCameraRigOutput {
  posX: number;
  posY: number;
  posZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
  boomScale: number;
}

/**
 * Steps the complete 3rd-person critically damped spring follow camera:
 * - Auto-detects large teleports (>14m in one frame) and snaps cleanly without flying across the map.
 * - Asymmetric boom collision smoothing (fast pull-in 0.032s, silky pull-out 0.24s).
 * - Smooth velocity look-ahead scaled gently for walk, sprint, hero flight, and web-swinging.
 * - Critically damped camera position & look-at springs (C1 continuous, zero overshoot).
 * - Dynamic speed-responsive FOV smoothing.
 */
export function stepSmoothCameraRig(
  state: SmoothCameraState,
  params: StepFollowRigParams
): SmoothCameraRigOutput {
  const dt = clampDt(params.dt);
  const horizSpeed = Math.hypot(params.velX, params.velZ);
  const totalSpeed = Math.hypot(horizSpeed, params.velY);

  // Asymmetric boom pull-in / recovery: fast in when wall hits, silky out when clear
  const clampedTargetBoom = Math.max(0.32, Math.min(1.0, params.desiredBoomScale));
  const boomSmoothTime = clampedTargetBoom < state.boomScale ? 0.032 : 0.24;
  const boomRes = dampScalarSpring(
    state.boomScale,
    clampedTargetBoom,
    state.boomScaleVel,
    boomSmoothTime,
    dt
  );
  state.boomScale = Math.max(0.32, Math.min(1.0, boomRes.value));
  state.boomScaleVel = boomRes.velocity;

  // Velocity look-ahead: gently leads the focus target along travel direction
  const maxLead = params.isFlying
    ? 3.2
    : params.isWebSwinging
      ? 2.8
      : params.isSprinting
        ? 1.45
        : 0.72;
  const leadTime = params.isFlying ? 0.095 : params.isWebSwinging ? 0.09 : 0.085;
  let targetLeadX = params.velX * leadTime;
  let targetLeadZ = params.velZ * leadTime;
  const leadHoriz = Math.hypot(targetLeadX, targetLeadZ);
  if (leadHoriz > maxLead && leadHoriz > 1e-4) {
    const s = maxLead / leadHoriz;
    targetLeadX *= s;
    targetLeadZ *= s;
  }
  const targetLeadY = params.isFlying
    ? Math.max(-1.4, Math.min(1.8, params.velY * 0.08))
    : 0;

  const leadLambda = params.isFlying ? 5.2 : 6.4;
  state.lookAheadX = dampExp(state.lookAheadX, targetLeadX, leadLambda, dt);
  state.lookAheadY = dampExp(state.lookAheadY, targetLeadY, leadLambda, dt);
  state.lookAheadZ = dampExp(state.lookAheadZ, targetLeadZ, leadLambda, dt);

  // Subtle dynamic pullback when flying/swinging fast so superhero silhouette stays epic in frame
  const speedDistBonus = params.isFlying
    ? Math.min(2.6, horizSpeed * 0.045)
    : params.isWebSwinging
      ? Math.min(2.0, horizSpeed * 0.05)
      : params.isSprinting
        ? Math.min(0.65, horizSpeed * 0.032)
        : 0;
  const effectiveDist = (params.baseDistance + speedDistBonus) * state.boomScale;

  const focusX = params.anchorX + state.lookAheadX;
  const focusY = params.anchorY + params.focusHeight + state.lookAheadY;
  const focusZ = params.anchorZ + state.lookAheadZ;

  const horizBoom = Math.cos(state.pitch) * effectiveDist;
  const desiredPosX = params.anchorX + Math.sin(state.yaw) * horizBoom + state.lookAheadX * 0.35;
  const desiredPosZ = params.anchorZ + Math.cos(state.yaw) * horizBoom + state.lookAheadZ * 0.35;
  const rawDesiredY =
    focusY + Math.sin(state.pitch) * effectiveDist + (params.verticalLift ?? 0.35);
  let desiredPosY = Math.max(rawDesiredY, params.minCamY);
  if (params.maxCamY !== undefined) {
    desiredPosY = Math.min(params.maxCamY, desiredPosY);
  }

  // Dynamic FOV ramp: calm on foot, exhilarated on sprint/flight/web-swing
  const speedFovBonus = params.isFlying
    ? Math.min(10.5, totalSpeed * 0.18)
    : params.isWebSwinging
      ? Math.min(9.0, totalSpeed * 0.24)
      : params.isSprinting
        ? Math.min(4.2, horizSpeed * 0.22)
        : Math.min(1.5, horizSpeed * 0.14);
  const targetFov = Math.min(72, params.baseFov + speedFovBonus);

  // Teleport detection: if anchor jumped >14m in one frame or camera isn't initialized yet, snap cleanly
  const anchorJump = Math.hypot(
    params.anchorX - state.lastAnchorX,
    params.anchorY - state.lastAnchorY,
    params.anchorZ - state.lastAnchorZ
  );
  if (!state.initialized || anchorJump > 14.0) {
    state.posX = desiredPosX;
    state.posY = desiredPosY;
    state.posZ = desiredPosZ;
    state.posVx = 0;
    state.posVy = 0;
    state.posVz = 0;
    state.lookX = focusX;
    state.lookY = focusY;
    state.lookZ = focusZ;
    state.lookVx = 0;
    state.lookVy = 0;
    state.lookVz = 0;
    state.fov = targetFov;
    state.fovVel = 0;
    state.lastAnchorX = params.anchorX;
    state.lastAnchorY = params.anchorY;
    state.lastAnchorZ = params.anchorZ;
    state.initialized = true;
    return {
      posX: state.posX,
      posY: state.posY,
      posZ: state.posZ,
      lookX: state.lookX,
      lookY: state.lookY,
      lookZ: state.lookZ,
      fov: state.fov,
      boomScale: state.boomScale,
    };
  }

  state.lastAnchorX = params.anchorX;
  state.lastAnchorY = params.anchorY;
  state.lastAnchorZ = params.anchorZ;

  // Critically damped follow springs: slightly tighter during high-speed superhero flight so hero stays centered
  const posSmoothTime = params.isFlying ? 0.088 : params.isWebSwinging ? 0.095 : 0.11;
  const posSmoothY = params.isFlying ? 0.1 : 0.13;
  const lookSmoothTime = params.isFlying ? 0.062 : 0.075;

  const px = dampScalarSpring(state.posX, desiredPosX, state.posVx, posSmoothTime, dt);
  const py = dampScalarSpring(state.posY, desiredPosY, state.posVy, posSmoothY, dt);
  const pz = dampScalarSpring(state.posZ, desiredPosZ, state.posVz, posSmoothTime, dt);
  state.posX = px.value;
  state.posVx = px.velocity;
  // Never let spring dip beneath safe ground floor
  state.posY = Math.max(params.minCamY, py.value);
  state.posVy = state.posY > py.value ? Math.max(0, py.velocity) : py.velocity;
  state.posZ = pz.value;
  state.posVz = pz.velocity;

  const lx = dampScalarSpring(state.lookX, focusX, state.lookVx, lookSmoothTime, dt);
  const ly = dampScalarSpring(state.lookY, focusY, state.lookVy, lookSmoothTime * 1.15, dt);
  const lz = dampScalarSpring(state.lookZ, focusZ, state.lookVz, lookSmoothTime, dt);
  state.lookX = lx.value;
  state.lookVx = lx.velocity;
  state.lookY = ly.value;
  state.lookVy = ly.velocity;
  state.lookZ = lz.value;
  state.lookVz = lz.velocity;

  const fovRes = dampScalarSpring(state.fov, targetFov, state.fovVel, 0.22, dt);
  state.fov = fovRes.value;
  state.fovVel = fovRes.velocity;

  return {
    posX: state.posX,
    posY: state.posY,
    posZ: state.posZ,
    lookX: state.lookX,
    lookY: state.lookY,
    lookZ: state.lookZ,
    fov: state.fov,
    boomScale: state.boomScale,
  };
}

export function createInitialSmoothLocomotionState(
  y = 0,
  heading = 0
): SmoothLocomotionState {
  return {
    inputForward: 0,
    inputRight: 0,
    heading,
    headingVel: 0,
    visualY: y,
    visualYVel: 0,
    bankRad: 0,
    bankVel: 0,
    pitchLeanRad: 0,
    pitchLeanVel: 0,
    flightSurgeBlend: 0,
    lastPhysX: 0,
    lastPhysY: y,
    lastPhysZ: 0,
    initialized: false,
  };
}

export function syncSmoothLocomotionImmediate(
  state: SmoothLocomotionState,
  x: number,
  y: number,
  z: number,
  heading: number
): void {
  state.inputForward = 0;
  state.inputRight = 0;
  state.heading = heading;
  state.headingVel = 0;
  state.visualY = y;
  state.visualYVel = 0;
  state.bankRad = 0;
  state.bankVel = 0;
  state.pitchLeanRad = 0;
  state.pitchLeanVel = 0;
  state.lastPhysX = x;
  state.lastPhysY = y;
  state.lastPhysZ = z;
  state.initialized = true;
}

/**
 * Smooths raw keyboard/joystick movement input to remove harsh digital acceleration jerks
 * while keeping direction changes snappy and responsive.
 */
export function filterMovementInput(
  state: SmoothLocomotionState,
  rawForward: number,
  rawRight: number,
  dt: number,
  isFlying = false
): { forward: number; right: number; magnitude: number } {
  const safeDt = clampDt(dt);
  const hasRaw = Math.hypot(rawForward, rawRight) > 0.01;
  // Snappy engagement, velvety release
  const lambda = isFlying ? (hasRaw ? 10.5 : 8.0) : hasRaw ? 18.0 : 14.5;
  state.inputForward = dampExp(state.inputForward, rawForward, lambda, safeDt);
  state.inputRight = dampExp(state.inputRight, rawRight, lambda, safeDt);
  if (Math.abs(state.inputForward) < 0.002) state.inputForward = 0;
  if (Math.abs(state.inputRight) < 0.002) state.inputRight = 0;
  const mag = Math.min(1, Math.hypot(state.inputForward, state.inputRight));
  return {
    forward: state.inputForward,
    right: state.inputRight,
    magnitude: mag,
  };
}

export interface StepLocomotionVisualParams {
  dt: number;
  physX: number;
  physY: number;
  physZ: number;
  targetHeading: number;
  hasHeadingTarget: boolean;
  speed: number;
  verticalVel: number;
  isAirborne: boolean;
  isFlying: boolean;
  isGliding: boolean;
  isWebSwinging: boolean;
  isHero: boolean;
  turnSmoothTime?: number;
}

export interface SmoothLocomotionVisualOutput {
  heading: number;
  turnRate: number;
  visualY: number;
  bankRad: number;
  pitchLeanRad: number;
  flightSurgeBlend: number;
}

/**
 * Updates critically damped character heading, stair/slope visual Y elevation,
 * dynamic lateral banking roll, forward lean pitch, and smooth hero flight-pose blend.
 */
export function stepSmoothLocomotionVisuals(
  state: SmoothLocomotionState,
  params: StepLocomotionVisualParams
): SmoothLocomotionVisualOutput {
  const dt = clampDt(params.dt);
  const jumpDist = Math.hypot(
    params.physX - state.lastPhysX,
    params.physY - state.lastPhysY,
    params.physZ - state.lastPhysZ
  );
  if (!state.initialized || jumpDist > 12.0) {
    syncSmoothLocomotionImmediate(state, params.physX, params.physY, params.physZ, params.targetHeading);
  }
  state.lastPhysX = params.physX;
  state.lastPhysY = params.physY;
  state.lastPhysZ = params.physZ;

  // 1. Critically damped shortest-arc heading spring
  let turnRate = 0;
  if (params.hasHeadingTarget) {
    const prevHeading = state.heading;
    const smoothTime = params.turnSmoothTime ?? (params.isFlying ? 0.12 : 0.085);
    const hRes = dampAngleSpring(state.heading, params.targetHeading, state.headingVel, smoothTime, dt);
    state.heading = hRes.value;
    state.headingVel = hRes.velocity;
    turnRate = wrapAngleDelta(state.heading - prevHeading) / Math.max(0.008, dt);
  } else {
    state.headingVel *= Math.exp(-14 * dt);
  }

  // 2. Smooth visual Y elevation (glides cleanly up stairs/curbs/slopes; tracks tightly during jumps/flight)
  const ySmoothTime = params.isFlying
    ? 0.055
    : params.isAirborne || params.isWebSwinging || params.isGliding
      ? 0.025
      : 0.062;
  const yRes = dampScalarSpring(state.visualY, params.physY, state.visualYVel, ySmoothTime, dt);
  state.visualY = yRes.value;
  state.visualYVel = yRes.velocity;

  // 3. Smooth lateral bank angle during turns (heroes lean dynamically into flight/sprint turns!)
  const speedNorm = Math.min(1, params.speed / (params.isFlying ? 24 : 11));
  const maxBank = params.isFlying ? 0.42 : params.isGliding ? 0.34 : params.isHero ? 0.2 : 0.16;
  const targetBank = Math.max(-maxBank, Math.min(maxBank, -turnRate * 0.075 * speedNorm));
  const bankRes = dampScalarSpring(state.bankRad, targetBank, state.bankVel, 0.11, dt);
  state.bankRad = bankRes.value;
  state.bankVel = bankRes.velocity;

  // 4. Smooth forward lean pitch (subtle acceleration lean on ground, heroic dive/climb pitch in flight)
  let targetPitchLean = 0;
  if (params.isFlying) {
    targetPitchLean = Math.min(1.14, 0.24 + params.speed * 0.036) - Math.max(-0.35, Math.min(0.42, params.verticalVel * 0.022));
  } else if (params.isGliding) {
    targetPitchLean = 0.72;
  } else if (params.isWebSwinging) {
    targetPitchLean = 0.42;
  } else {
    targetPitchLean = Math.min(0.22, params.speed * 0.024);
  }
  const pitchRes = dampScalarSpring(
    state.pitchLeanRad,
    targetPitchLean,
    state.pitchLeanVel,
    0.12,
    dt
  );
  state.pitchLeanRad = pitchRes.value;
  state.pitchLeanVel = pitchRes.velocity;

  // 5. Continuous 0..1 flight surge pose blend (eliminates hard speed > 6.0 arm-snap!)
  const targetSurge = params.isFlying ? Math.max(0, Math.min(1, (params.speed - 2.5) / 10.0)) : 0;
  state.flightSurgeBlend = dampExp(state.flightSurgeBlend, targetSurge, 7.5, dt);

  return {
    heading: state.heading,
    turnRate,
    visualY: state.visualY,
    bankRad: state.bankRad,
    pitchLeanRad: state.pitchLeanRad,
    flightSurgeBlend: state.flightSurgeBlend,
  };
}
