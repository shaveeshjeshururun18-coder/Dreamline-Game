import type { TransportMode } from './types';
import { getTimePeriod } from './timeWeather';

export interface TransportSpec {
  id: TransportMode;
  label: string;
  jpLabel: string;
  cruiseSpeed: number; // m/s
  sprintSpeed: number; // m/s
  accel: number;
  decel: number;
  turnRate: number;
  leanAngle: number; // max bank lean in radians
}

export const TRANSPORT_SPECS: Record<TransportMode, TransportSpec> = {
  walk: {
    id: 'walk',
    label: 'Walk',
    jpLabel: 'நடை',
    cruiseSpeed: 6.8,
    sprintSpeed: 12.2,
    accel: 16.0,
    decel: 16.5,
    turnRate: 13.0,
    leanAngle: 0.0,
  },
  bicycle: {
    id: 'bicycle',
    label: 'Bicycle',
    jpLabel: 'சைக்கிள்',
    cruiseSpeed: 14.5,
    sprintSpeed: 21.0,
    accel: 10.5,
    decel: 6.8,
    turnRate: 7.6,
    leanAngle: 0.24,
  },
  skateboard: {
    id: 'skateboard',
    label: 'Skateboard',
    jpLabel: 'ஸ்கேட்போர்டு',
    cruiseSpeed: 13.5,
    sprintSpeed: 19.5,
    accel: 11.5,
    decel: 5.4,
    turnRate: 9.4,
    leanAngle: 0.28,
  },
};

export interface JoystickSample {
  right: number; // -1..1
  forward: number; // -1..1
  magnitude: number; // 0..1
  knobX: number; // clamped px
  knobY: number; // clamped px
}

/**
 * Pure virtual thumbstick normalizer with circular clamping and smooth deadzone.
 * Screen +Y is downward, so forward = -dy.
 */
export function normalizeJoystickInput(
  dx: number,
  dy: number,
  maxRadius: number,
  deadzone = 0.12
): JoystickSample {
  const safeMax = Math.max(1, maxRadius);
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-5) {
    return { right: 0, forward: 0, magnitude: 0, knobX: 0, knobY: 0 };
  }

  const clampedDist = Math.min(dist, safeMax);
  const scale = clampedDist / dist;
  const knobX = dx * scale;
  const knobY = dy * scale;
  const rawMag = clampedDist / safeMax;

  if (rawMag <= deadzone) {
    return { right: 0, forward: 0, magnitude: 0, knobX, knobY };
  }

  const adjMag = (rawMag - deadzone) / (1 - deadzone);
  const dirX = dx / dist;
  const dirY = dy / dist;

  return {
    right: dirX * adjMag,
    forward: -dirY * adjMag,
    magnitude: adjMag,
    knobX,
    knobY,
  };
}

/**
 * Merges keyboard directional axes and virtual joystick axes cleanly into a unit-clamped movement vector.
 */
export function combineMovementInput(
  keyForward: number,
  keyRight: number,
  joyForward: number,
  joyRight: number
): { forward: number; right: number; magnitude: number } {
  const f = keyForward + joyForward;
  const r = keyRight + joyRight;
  const len = Math.hypot(f, r);
  if (len < 1e-4) {
    return { forward: 0, right: 0, magnitude: 0 };
  }
  const clamped = Math.min(1, len);
  return {
    forward: (f / len) * clamped,
    right: (r / len) * clamped,
    magnitude: clamped,
  };
}

export interface TouchMovePadVisual {
  active: boolean;
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
}

export interface ScreenTouchState {
  movePointerId: number | null;
  cameraPointerId: number | null;
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
  right: number;
  forward: number;
  active: boolean;
  lastCamX: number;
  lastCamY: number;
}

export function createInitialScreenTouchState(): ScreenTouchState {
  return {
    movePointerId: null,
    cameraPointerId: null,
    originX: 0,
    originY: 0,
    knobX: 0,
    knobY: 0,
    right: 0,
    forward: 0,
    active: false,
    lastCamX: 0,
    lastCamY: 0,
  };
}

/**
 * Routes pointer-down anywhere on the 3D canvas:
 * - On mobile touch/pen during gameplay (when the corner joystick is not held),
 *   touching ANYWHERE on the screen spawns a floating movement thumbpad immediately.
 * - A simultaneous 2nd finger (or a touch while holding the corner joystick, or desktop mouse)
 *   smoothly orbits the 360° camera without interrupting movement.
 */
export function beginScreenPointer(
  state: ScreenTouchState,
  input: {
    pointerId: number;
    pointerType: string;
    clientX: number;
    clientY: number;
    allowTouchMove: boolean;
    fixedJoystickActive: boolean;
  }
): { state: ScreenTouchState; role: 'move' | 'camera' | 'ignored' } {
  const isTouchLike = input.pointerType !== 'mouse';
  if (
    input.allowTouchMove &&
    isTouchLike &&
    !input.fixedJoystickActive &&
    state.movePointerId === null
  ) {
    return {
      role: 'move',
      state: {
        ...state,
        movePointerId: input.pointerId,
        originX: input.clientX,
        originY: input.clientY,
        knobX: 0,
        knobY: 0,
        right: 0,
        forward: 0,
        active: true,
      },
    };
  }

  if (state.cameraPointerId === null) {
    return {
      role: 'camera',
      state: {
        ...state,
        cameraPointerId: input.pointerId,
        lastCamX: input.clientX,
        lastCamY: input.clientY,
      },
    };
  }

  return { state, role: 'ignored' };
}

/**
 * Updates either full-screen floating touch movement (with soft dynamic origin follow
 * so reversing direction after a long slide responds instantly) or camera orbit deltas.
 */
export function moveScreenPointer(
  state: ScreenTouchState,
  input: {
    pointerId: number;
    clientX: number;
    clientY: number;
    maxRadius?: number;
    deadzone?: number;
  }
): { state: ScreenTouchState; role: 'move' | 'camera' | 'ignored'; camDx: number; camDy: number } {
  if (input.pointerId === state.movePointerId) {
    const maxRadius = Math.max(20, input.maxRadius ?? 46);
    const deadzone = input.deadzone ?? 0.08;
    let originX = state.originX;
    let originY = state.originY;
    let dx = input.clientX - originX;
    let dy = input.clientY - originY;
    const dist = Math.hypot(dx, dy);
    const followLimit = maxRadius * 1.15;
    if (dist > followLimit) {
      originX = input.clientX - (dx / dist) * followLimit;
      originY = input.clientY - (dy / dist) * followLimit;
      dx = input.clientX - originX;
      dy = input.clientY - originY;
    }
    const sample = normalizeJoystickInput(dx, dy, maxRadius, deadzone);
    return {
      role: 'move',
      camDx: 0,
      camDy: 0,
      state: {
        ...state,
        originX,
        originY,
        knobX: sample.knobX,
        knobY: sample.knobY,
        right: sample.right,
        forward: sample.forward,
        active: true,
      },
    };
  }

  if (input.pointerId === state.cameraPointerId) {
    const camDx = input.clientX - state.lastCamX;
    const camDy = input.clientY - state.lastCamY;
    return {
      role: 'camera',
      camDx,
      camDy,
      state: {
        ...state,
        lastCamX: input.clientX,
        lastCamY: input.clientY,
      },
    };
  }

  return { state, role: 'ignored', camDx: 0, camDy: 0 };
}

export function endScreenPointer(
  state: ScreenTouchState,
  pointerId: number
): ScreenTouchState {
  if (pointerId === state.movePointerId) {
    return {
      ...state,
      movePointerId: null,
      knobX: 0,
      knobY: 0,
      right: 0,
      forward: 0,
      active: false,
    };
  }
  if (pointerId === state.cameraPointerId) {
    return {
      ...state,
      cameraPointerId: null,
    };
  }
  return state;
}

export function getTouchMovePadVisual(state: ScreenTouchState): TouchMovePadVisual {
  return {
    active: state.active,
    originX: state.originX,
    originY: state.originY,
    knobX: state.knobX,
    knobY: state.knobY,
  };
}

/**
 * Quick Night Mode toggle: switches cleanly between starry peaceful night (22:15)
 * and the signature pink-lavender sunset (17:43).
 */
export function toggleNightModeHours(currentHours: number): { hours: number; isNight: boolean } {
  const period = getTimePeriod(currentHours);
  if (period === 'night') {
    return { hours: 17.72, isNight: false };
  }
  return { hours: 22.25, isNight: true };
}

export interface JumpState {
  offsetY: number;
  velocityY: number;
  isAirborne: boolean;
  coyoteTimer: number;
  bufferTimer: number;
}

export function createInitialJumpState(): JumpState {
  return {
    offsetY: 0,
    velocityY: 0,
    isAirborne: false,
    coyoteTimer: 0.12,
    bufferTimer: 0,
  };
}

/**
 * Buffers a jump request for 140ms so pressing Jump right before landing feels crisp and responsive.
 */
export function requestJump(state: JumpState): JumpState {
  return {
    ...state,
    bufferTimer: 0.14,
  };
}

/**
 * Pure vertical jump physics integrator supporting on-foot leaps, bicycle bunny-hops,
 * skateboard ollies, water hops, and colossal Giant Form jumps.
 */
export function stepJumpState(
  prev: JumpState,
  dt: number,
  params: {
    scale: number;
    transportMode: TransportMode;
    canJump: boolean;
  }
): { state: JumpState; jumped: boolean; landed: boolean } {
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.1);
  const scaleFactor = Math.sqrt(Math.max(1, params.scale));

  let offsetY = prev.offsetY;
  let velocityY = prev.velocityY;
  let isAirborne = prev.isAirborne;
  let coyoteTimer = !isAirborne && params.canJump ? 0.12 : Math.max(0, prev.coyoteTimer - clampedDt);
  let bufferTimer = Math.max(0, prev.bufferTimer - clampedDt);
  let jumped = false;
  let landed = false;

  // Execute buffered jump if grounded (or within forgiving coyote window)
  if (bufferTimer > 0 && coyoteTimer > 0 && params.canJump && !isAirborne) {
    const baseImpulse =
      params.transportMode === 'skateboard'
        ? 7.8
        : params.transportMode === 'bicycle'
        ? 6.4
        : 7.5;
    velocityY = baseImpulse * scaleFactor;
    isAirborne = true;
    coyoteTimer = 0;
    bufferTimer = 0;
    jumped = true;
  }

  if (isAirborne) {
    const gravity = 20.5 * (1 + (scaleFactor - 1) * 0.42);
    offsetY += velocityY * clampedDt;
    velocityY -= gravity * clampedDt;

    if (offsetY <= 0) {
      offsetY = 0;
      velocityY = 0;
      isAirborne = false;
      coyoteTimer = 0.12;
      landed = true;
    }
  } else {
    offsetY = 0;
    velocityY = 0;
  }

  return {
    state: {
      offsetY,
      velocityY,
      isAirborne,
      coyoteTimer,
      bufferTimer,
    },
    jumped,
    landed,
  };
}

