import type { BusState } from './types';
import {
  LAKE_CENTER,
  LAKE_RX,
  LAKE_RZ,
  WORLD_PLAYABLE_RADIUS,
  isOceanAt,
} from './terrain';
import { isInsideExhibitionIsland, isOnOceanBusCauseway } from './exhibitionComplex';

export type BusDispatchPhase =
  | 'idle'
  | 'en_route_pickup'
  | 'arrived_pickup'
  | 'driving_to_destination'
  | 'arrived_dropoff';

export interface BusRideDestination {
  id: string;
  label: string;
  tamilLabel?: string;
  x: number;
  z: number;
}

export interface BusDispatchState {
  phase: BusDispatchPhase;
  pickupX: number;
  pickupZ: number;
  destination: BusRideDestination | null;
  distanceMeters: number;
  etaSeconds: number;
  dropoffTimer: number;
  statusMessage: string;
}

export function createInitialBusDispatchState(): BusDispatchState {
  return {
    phase: 'idle',
    pickupX: 0,
    pickupZ: 0,
    destination: null,
    distanceMeters: 0,
    etaSeconds: 0,
    dropoffTimer: 0,
    statusMessage: '',
  };
}

/**
 * Clamps any requested world point onto safe mainland drivable ground (avoiding Neelam Lake & deep ocean).
 */
export function clampToBusDrivablePoint(x: number, z: number): { x: number; z: number } {
  let cx = x;
  let cz = z;

  // Permit driving & mobile hailing freely on the Ocean Exhibition Complex Island and its Ocean Bus Causeway!
  const onExhibitionOrCauseway =
    isInsideExhibitionIsland(cx, cz, -1.5) || isOnOceanBusCauseway(cx, cz);

  // Keep inside mainland west of Kadalkarai shoreline if someone requests a deep ocean point outside the Exhibition causeway
  if (!onExhibitionOrCauseway && (isOceanAt(cx, cz) || cx > 103)) {
    cx = Math.min(cx, 99.5);
    cz = Math.max(-24, Math.min(96, cz));
  }

  // Push smoothly outside Neelam Lake ellipse if inside water
  const lx = (cx - LAKE_CENTER.x) / (LAKE_RX + 4.5);
  const lz = (cz - LAKE_CENTER.z) / (LAKE_RZ + 4.5);
  const lakeD = Math.hypot(lx, lz);
  if (lakeD < 1.0) {
    const angle = lakeD > 1e-4 ? Math.atan2(lz, lx) : Math.PI * 0.75;
    cx = LAKE_CENTER.x + Math.cos(angle) * (LAKE_RX + 5.2);
    cz = LAKE_CENTER.z + Math.sin(angle) * (LAKE_RZ + 5.2);
  }

  const maxR = Math.min(WORLD_PLAYABLE_RADIUS - 20, 395);
  const r = Math.hypot(cx, cz);
  if (r > maxR) {
    const s = maxR / r;
    cx *= s;
    cz *= s;
  }

  return { x: cx, z: cz };
}

/**
 * Computes a clean roadside pickup stop right beside the player (4.2m offset so bus doesn't collide with player).
 */
export function computePickupPointNearPlayer(
  playerX: number,
  playerZ: number,
  playerHeading: number
): { x: number; z: number } {
  // Offset slightly ahead/right of the player for a welcoming curb pickup
  const rawX = playerX + Math.cos(playerHeading) * 3.8 + Math.sin(playerHeading) * 2.2;
  const rawZ = playerZ - Math.sin(playerHeading) * 3.8 + Math.cos(playerHeading) * 2.2;
  return clampToBusDrivablePoint(rawX, rawZ);
}

/**
 * Initiates a mobile-booked on-demand bus ride: bus immediately heads to pick up the player,
 * then drives them straight to their chosen destination and drops them off.
 */
export function requestMobileBusRide(
  playerX: number,
  playerZ: number,
  playerHeading: number,
  destination: BusRideDestination,
  bus: BusState
): { dispatch: BusDispatchState; bus: BusState } {
  const pickup = computePickupPointNearPlayer(playerX, playerZ, playerHeading);
  const safeDest = clampToBusDrivablePoint(destination.x, destination.z);
  const distToPickup = Math.hypot(pickup.x - bus.worldX, pickup.z - bus.worldZ);

  // If the bus is very far away (>75m), teleport it cleanly to ~42m out along the approach vector
  // so the player watches the bus genuinely drive up within ~3 seconds instead of waiting 25 seconds!
  let startX = bus.worldX;
  let startZ = bus.worldZ;
  if (distToPickup > 70) {
    const dx = bus.worldX - pickup.x;
    const dz = bus.worldZ - pickup.z;
    const len = Math.max(1e-4, Math.hypot(dx, dz));
    const spawnPt = clampToBusDrivablePoint(
      pickup.x + (dx / len) * 42,
      pickup.z + (dz / len) * 42
    );
    startX = spawnPt.x;
    startZ = spawnPt.z;
  }

  const effectiveDist = Math.hypot(pickup.x - startX, pickup.z - startZ);
  const heading = Math.atan2(pickup.x - startX, pickup.z - startZ);

  const nextBus: BusState = {
    ...bus,
    worldX: startX,
    worldZ: startZ,
    heading,
    phase: effectiveDist < 2.2 ? 'stopped' : 'cruising',
    doorOpen: effectiveDist < 2.2 ? 1 : 0,
    speedKmh: effectiveDist < 2.2 ? 0 : 32,
  };

  const arrivedImmediately = effectiveDist < 2.2;
  const dispatch: BusDispatchState = {
    phase: arrivedImmediately ? 'arrived_pickup' : 'en_route_pickup',
    pickupX: pickup.x,
    pickupZ: pickup.z,
    destination: {
      ...destination,
      x: safeDest.x,
      z: safeDest.z,
    },
    distanceMeters: arrivedImmediately ? 0 : effectiveDist,
    etaSeconds: arrivedImmediately ? 0 : effectiveDist / 14.0,
    dropoffTimer: 0,
    statusMessage: arrivedImmediately
      ? `Bus arrived! Press E to board for ${destination.label}`
      : `Dreamline Bus coming to pick you up (${Math.round(effectiveDist)}m away)`,
  };

  return { dispatch, bus: nextBus };
}

function moveAngleToward(current: number, target: number, maxStep: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

/**
 * Steers the bus smoothly toward a target point while curving cleanly around Neelam Lake if in the way.
 */
function computeSteerPoint(
  busX: number,
  busZ: number,
  targetX: number,
  targetZ: number
): { sx: number; sz: number } {
  const dx = targetX - busX;
  const dz = targetZ - busZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 4) return { sx: targetX, sz: targetZ };

  // Probe midpoint & 14m ahead for Neelam Lake avoidance
  const lookAhead = Math.min(dist * 0.5, 16);
  const px = busX + (dx / dist) * lookAhead;
  const pz = busZ + (dz / dist) * lookAhead;
  const lx = (px - LAKE_CENTER.x) / (LAKE_RX + 5.5);
  const lz = (pz - LAKE_CENTER.z) / (LAKE_RZ + 5.5);
  if (lx * lx + lz * lz < 1.0) {
    // Steer gently around the nearer north or south rim of Neelam Lake
    const side = busZ >= LAKE_CENTER.z ? 1 : -1;
    return {
      sx: LAKE_CENTER.x + (dx > 0 ? 6 : -6),
      sz: LAKE_CENTER.z + side * (LAKE_RZ + 11.5),
    };
  }
  return { sx: targetX, sz: targetZ };
}

export interface StepDispatchedBusResult {
  bus: BusState;
  dispatch: BusDispatchState;
  justArrivedForPickup: boolean;
  justArrivedAtDropoff: boolean;
  completedAndReturnToLoop: boolean;
}

const DISPATCH_PICKUP_SPEED_MPS = 14.5;
const DISPATCH_TRIP_SPEED_MPS = 16.5;

/**
 * Advances the on-demand dispatched bus when a mobile ride is active.
 */
export function stepDispatchedBus(
  bus: BusState,
  dispatch: BusDispatchState,
  dt: number
): StepDispatchedBusResult {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let justArrivedForPickup = false;
  let justArrivedAtDropoff = false;
  let completedAndReturnToLoop = false;

  if (dispatch.phase === 'idle' || !dispatch.destination) {
    return {
      bus,
      dispatch,
      justArrivedForPickup,
      justArrivedAtDropoff,
      completedAndReturnToLoop,
    };
  }

  if (dispatch.phase === 'en_route_pickup') {
    const dx = dispatch.pickupX - bus.worldX;
    const dz = dispatch.pickupZ - bus.worldZ;
    const dist = Math.hypot(dx, dz);

    if (dist <= 1.8) {
      justArrivedForPickup = true;
      return {
        bus: {
          ...bus,
          worldX: dispatch.pickupX,
          worldZ: dispatch.pickupZ,
          speed: 0,
          speedKmh: 0,
          phase: 'stopped',
          doorOpen: Math.min(1, bus.doorOpen + cdt * 2.4),
          etaSeconds: 0,
        },
        dispatch: {
          ...dispatch,
          phase: 'arrived_pickup',
          distanceMeters: 0,
          etaSeconds: 0,
          statusMessage: `Bus arrived! Press E to board for ${dispatch.destination.label}`,
        },
        justArrivedForPickup,
        justArrivedAtDropoff,
        completedAndReturnToLoop,
      };
    }

    const steer = computeSteerPoint(bus.worldX, bus.worldZ, dispatch.pickupX, dispatch.pickupZ);
    const desiredHeading = Math.atan2(steer.sx - bus.worldX, steer.sz - bus.worldZ);
    const heading = moveAngleToward(bus.heading, desiredHeading, 2.8 * cdt);
    const targetSpeed = dist < 14 ? Math.max(3.2, (dist / 14) * DISPATCH_PICKUP_SPEED_MPS) : DISPATCH_PICKUP_SPEED_MPS;
    const stepM = Math.min(dist, targetSpeed * cdt);
    const nextX = bus.worldX + Math.sin(heading) * stepM;
    const nextZ = bus.worldZ + Math.cos(heading) * stepM;
    const remDist = Math.hypot(dispatch.pickupX - nextX, dispatch.pickupZ - nextZ);

    return {
      bus: {
        ...bus,
        worldX: nextX,
        worldZ: nextZ,
        heading,
        phase: dist < 12 ? 'approaching' : 'cruising',
        doorOpen: Math.max(0, bus.doorOpen - cdt * 2.5),
        speedKmh: Math.round(targetSpeed * 3.6),
        etaSeconds: remDist / Math.max(3.0, targetSpeed),
      },
      dispatch: {
        ...dispatch,
        distanceMeters: remDist,
        etaSeconds: remDist / Math.max(3.0, targetSpeed),
        statusMessage: `Bus coming to pick you up · ${Math.round(remDist)}m`,
      },
      justArrivedForPickup,
      justArrivedAtDropoff,
      completedAndReturnToLoop,
    };
  }

  if (dispatch.phase === 'arrived_pickup') {
    const doorOpen = Math.min(1, bus.doorOpen + cdt * 2.2);
    return {
      bus: {
        ...bus,
        speed: 0,
        speedKmh: 0,
        phase: 'stopped',
        doorOpen,
        etaSeconds: 0,
      },
      dispatch: {
        ...dispatch,
        distanceMeters: 0,
        etaSeconds: 0,
        statusMessage: `Bus waiting at pickup · Board for ${dispatch.destination.label}`,
      },
      justArrivedForPickup,
      justArrivedAtDropoff,
      completedAndReturnToLoop,
    };
  }

  if (dispatch.phase === 'driving_to_destination') {
    const dest = dispatch.destination;
    const dx = dest.x - bus.worldX;
    const dz = dest.z - bus.worldZ;
    const dist = Math.hypot(dx, dz);

    if (dist <= 2.2) {
      justArrivedAtDropoff = true;
      return {
        bus: {
          ...bus,
          worldX: dest.x,
          worldZ: dest.z,
          speed: 0,
          speedKmh: 0,
          phase: 'stopped',
          doorOpen: Math.min(1, bus.doorOpen + cdt * 2.5),
          etaSeconds: 0,
        },
        dispatch: {
          ...dispatch,
          phase: 'arrived_dropoff',
          distanceMeters: 0,
          etaSeconds: 0,
          dropoffTimer: 0,
          statusMessage: `Arrived at ${dest.label}! Dropping you off.`,
        },
        justArrivedForPickup,
        justArrivedAtDropoff,
        completedAndReturnToLoop,
      };
    }

    const steer = computeSteerPoint(bus.worldX, bus.worldZ, dest.x, dest.z);
    const desiredHeading = Math.atan2(steer.sx - bus.worldX, steer.sz - bus.worldZ);
    const heading = moveAngleToward(bus.heading, desiredHeading, 2.6 * cdt);
    const targetSpeed = dist < 16 ? Math.max(3.5, (dist / 16) * DISPATCH_TRIP_SPEED_MPS) : DISPATCH_TRIP_SPEED_MPS;
    const stepM = Math.min(dist, targetSpeed * cdt);
    const nextX = bus.worldX + Math.sin(heading) * stepM;
    const nextZ = bus.worldZ + Math.cos(heading) * stepM;
    const remDist = Math.hypot(dest.x - nextX, dest.z - nextZ);

    return {
      bus: {
        ...bus,
        worldX: nextX,
        worldZ: nextZ,
        heading,
        phase: dist < 14 ? 'approaching' : 'cruising',
        doorOpen: Math.max(0, bus.doorOpen - cdt * 2.5),
        speedKmh: Math.round(targetSpeed * 3.6),
        etaSeconds: remDist / Math.max(3.5, targetSpeed),
      },
      dispatch: {
        ...dispatch,
        distanceMeters: remDist,
        etaSeconds: remDist / Math.max(3.5, targetSpeed),
        statusMessage: `Driving you to ${dest.label} · ${Math.round(remDist)}m`,
      },
      justArrivedForPickup,
      justArrivedAtDropoff,
      completedAndReturnToLoop,
    };
  }

  // arrived_dropoff: dwell briefly with door open, then hand back to normal bus loop
  const nextTimer = dispatch.dropoffTimer + cdt;
  const doorOpen = nextTimer < 4.5 ? Math.min(1, bus.doorOpen + cdt * 2.0) : Math.max(0, bus.doorOpen - cdt * 2.0);
  if (nextTimer >= 5.5) {
    completedAndReturnToLoop = true;
    return {
      bus: {
        ...bus,
        doorOpen: 0,
        phase: 'departing',
      },
      dispatch: createInitialBusDispatchState(),
      justArrivedForPickup,
      justArrivedAtDropoff,
      completedAndReturnToLoop,
    };
  }

  return {
    bus: {
      ...bus,
      speed: 0,
      speedKmh: 0,
      phase: 'stopped',
      doorOpen,
    },
    dispatch: {
      ...dispatch,
      dropoffTimer: nextTimer,
    },
    justArrivedForPickup,
    justArrivedAtDropoff,
    completedAndReturnToLoop,
  };
}
