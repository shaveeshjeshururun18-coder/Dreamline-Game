import { groundHeightAt, isWaterAt, WORLD_PLAYABLE_RADIUS } from './terrain';

/**
 * Pure Logic & State Machine for the Snowman Multi-Transport Exact-Location Taxi Service.
 *
 * - The Snowman (the same snowman who rescues players on his Jet Ski) is the universal driver
 *   for EVERY transport mode!
 * - Zero ships (no ship option — per player request).
 * - Supports selectable Land Transport and Water Transport independently, plus Combined All-in-One
 *   and instant Cycle ⇄ Jet Ski simultaneous conversion!
 * - Targets ANY exact (x, z) coordinate clicked on the world map (not just named presets).
 */

export type SnowmanTransportId =
  | 'cycle_jetski'
  | 'jetski'
  | 'combat_bus'
  | 'snowman_train'
  | 'snowman_submarine'
  | 'snowman_aircraft'
  | 'combined_omni';

export type SnowmanTaxiPhase =
  | 'idle'
  | 'approaching'
  | 'boarding'
  | 'transporting'
  | 'arrived';

export interface SnowmanTransportSpec {
  id: SnowmanTransportId;
  name: string;
  shortLabel: string;
  subtitle: string;
  domain: 'land' | 'water' | 'hybrid' | 'air';
  supportsLand: boolean;
  supportsWater: boolean;
  cruiseSpeed: number; // m/s
  accentHex: number;
  bodyHex: number;
  isMorphCycleJetSki?: boolean;
  isCombinedOmni?: boolean;
}

export const SNOWMAN_TRANSPORTS: readonly SnowmanTransportSpec[] = [
  {
    id: 'cycle_jetski',
    name: 'Cycle ⇄ Jet Ski Morph',
    shortLabel: 'Cycle ⇄ JetSki',
    subtitle: 'Snowman rides a Bicycle that converts into a Jet Ski simultaneously & instantly!',
    domain: 'hybrid',
    supportsLand: true,
    supportsWater: true,
    cruiseSpeed: 32.0,
    accentHex: 0x38bdf8,
    bodyHex: 0xef4444,
    isMorphCycleJetSki: true,
  },
  {
    id: 'jetski',
    name: 'Snowman Jet Ski',
    shortLabel: 'Jet Ski',
    subtitle: 'High-speed ocean & lake rescue Jet Ski piloted by the Snowman',
    domain: 'water',
    supportsLand: false,
    supportsWater: true,
    cruiseSpeed: 30.0,
    accentHex: 0x22d3ee,
    bodyHex: 0x0284c7,
  },
  {
    id: 'combat_bus',
    name: 'Snowman Combat Bus',
    shortLabel: 'Combat Bus',
    subtitle: 'Armoured all-terrain Snowman Combat Bus for fast overland pickup',
    domain: 'land',
    supportsLand: true,
    supportsWater: false,
    cruiseSpeed: 34.0,
    accentHex: 0xf59e0b,
    bodyHex: 0x1e3a8a,
  },
  {
    id: 'snowman_train',
    name: 'Snowman Express Train',
    shortLabel: 'Train',
    subtitle: 'Maglev-rail Snowman Express locomotive that goes anywhere on land',
    domain: 'land',
    supportsLand: true,
    supportsWater: false,
    cruiseSpeed: 38.0,
    accentHex: 0xfacc15,
    bodyHex: 0xdc2626,
  },
  {
    id: 'snowman_submarine',
    name: 'Snowman Submarine',
    shortLabel: 'Submarine',
    subtitle: 'Deep-sea Snowman Submarine cruiser for lakes and Kadalkarai Ocean',
    domain: 'water',
    supportsLand: false,
    supportsWater: true,
    cruiseSpeed: 28.0,
    accentHex: 0xfbbf24,
    bodyHex: 0x0f766e,
  },
  {
    id: 'snowman_aircraft',
    name: 'Snowman Aircraft',
    shortLabel: 'Aircraft',
    subtitle: 'Tilt-jet Snowman Aircraft that flies direct over both land and ocean',
    domain: 'air',
    supportsLand: true,
    supportsWater: true,
    cruiseSpeed: 48.0,
    accentHex: 0x67e8f9,
    bodyHex: 0xf8fafc,
  },
  {
    id: 'combined_omni',
    name: 'Combined Omni-Craft',
    shortLabel: 'Combined All',
    subtitle: 'Aircraft + Combat Bus + Train + Submarine + Jet Ski fused (No Ship!)',
    domain: 'hybrid',
    supportsLand: true,
    supportsWater: true,
    cruiseSpeed: 46.0,
    accentHex: 0xa855f7,
    bodyHex: 0x0ea5e9,
    isCombinedOmni: true,
  },
] as const;

export const LAND_TRANSPORT_OPTIONS: readonly SnowmanTransportId[] = [
  'cycle_jetski',
  'combat_bus',
  'snowman_train',
  'snowman_aircraft',
  'combined_omni',
];

export const WATER_TRANSPORT_OPTIONS: readonly SnowmanTransportId[] = [
  'jetski',
  'cycle_jetski',
  'snowman_submarine',
  'snowman_aircraft',
  'combined_omni',
];

export function getSnowmanTransportSpec(id: SnowmanTransportId): SnowmanTransportSpec {
  return SNOWMAN_TRANSPORTS.find((t) => t.id === id) ?? SNOWMAN_TRANSPORTS[0];
}

export interface SnowmanTaxiState {
  phase: SnowmanTaxiPhase;
  driverName: 'Snowman';
  landTransport: SnowmanTransportId;
  waterTransport: SnowmanTransportId;
  /** Currently active visual vehicle (updates instantaneously when crossing water <-> land!) */
  activeTransport: SnowmanTransportId;
  /** For Cycle <-> JetSki simultaneous instant conversion: true = Jet Ski form, false = Cycle form */
  cycleMorphedToJetSki: boolean;
  /** Visual 0..1 morph flash progress (decays quickly after instant conversion for crisp VFX burst) */
  morphFlashTimer: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  speedKmh: number;
  pickupX: number;
  pickupZ: number;
  targetX: number;
  targetZ: number;
  targetIsWater: boolean;
  instantExpress: boolean;
  playerOnboard: boolean;
  boardingTimer: number;
  arrivalTimer: number;
  statusMessage: string;
}

export function createInitialSnowmanTaxiState(): SnowmanTaxiState {
  return {
    phase: 'idle',
    driverName: 'Snowman',
    landTransport: 'cycle_jetski',
    waterTransport: 'jetski',
    activeTransport: 'cycle_jetski',
    cycleMorphedToJetSki: false,
    morphFlashTimer: 0,
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
    speed: 0,
    speedKmh: 0,
    pickupX: 0,
    pickupZ: 0,
    targetX: 0,
    targetZ: 0,
    targetIsWater: false,
    instantExpress: false,
    playerOnboard: false,
    boardingTimer: 0,
    arrivalTimer: 0,
    statusMessage: 'Snowman Taxi Ready · Tap any exact map coordinate',
  };
}

export function clampExactWorldCoord(x: number, z: number): { x: number; z: number } {
  const maxR = WORLD_PLAYABLE_RADIUS - 12;
  const r = Math.hypot(x, z);
  if (r <= maxR) {
    return { x: Number(x.toFixed(1)), z: Number(z.toFixed(1)) };
  }
  const s = maxR / r;
  return { x: Number((x * s).toFixed(1)), z: Number((z * s).toFixed(1)) };
}

/**
 * Resolves which Snowman transport form should be active at (x, z) given the player's
 * chosen land and water transports — including simultaneous Cycle ⇄ Jet Ski conversion!
 */
export function resolveSnowmanVehicleAt(
  x: number,
  z: number,
  landTransport: SnowmanTransportId,
  waterTransport: SnowmanTransportId,
  forceCycleJetSkiMorph = false
): { activeTransport: SnowmanTransportId; inWater: boolean; cycleMorphedToJetSki: boolean } {
  const inWater = isWaterAt(x, z);
  const chosen = inWater ? waterTransport : landTransport;
  const cycleMorphedToJetSki =
    chosen === 'cycle_jetski' ? inWater || forceCycleJetSkiMorph : chosen === 'jetski';
  return {
    activeTransport: chosen,
    inWater,
    cycleMorphedToJetSki,
  };
}

export function getSnowmanVehicleCruiseY(
  x: number,
  z: number,
  transport: SnowmanTransportId,
  inWater: boolean,
  airFraction = 0
): number {
  if (transport === 'snowman_aircraft') {
    const base = inWater ? 0.25 : Math.max(0.2, groundHeightAt(x, z));
    return base + airFraction * 16.5;
  }
  if (transport === 'combined_omni' && airFraction > 0.05) {
    const base = inWater ? 0.2 : Math.max(0.2, groundHeightAt(x, z));
    return base + airFraction * 12.5;
  }
  if (inWater) {
    return transport === 'snowman_submarine' ? -0.35 : 0.16;
  }
  return Math.max(0, groundHeightAt(x, z));
}

export interface DispatchSnowmanTaxiParams {
  playerX: number;
  playerZ: number;
  targetX: number;
  targetZ: number;
  landTransport: SnowmanTransportId;
  waterTransport: SnowmanTransportId;
  /** If true, instantly triggers Cycle -> JetSki morph VFX on arrival as well */
  instantCycleMorph?: boolean;
  /** If true, delivers immediately right after pickup */
  instantExpress?: boolean;
}

/**
 * Dispatches the Snowman Taxi to the player's exact current location anywhere on land or water,
 * ready to pick them up and deliver them directly to the exact pinned coordinate (targetX, targetZ).
 */
export function dispatchSnowmanTaxi(
  prev: SnowmanTaxiState,
  params: DispatchSnowmanTaxiParams
): SnowmanTaxiState {
  const clampedTarget = clampExactWorldCoord(params.targetX, params.targetZ);
  const clampedPickup = clampExactWorldCoord(params.playerX, params.playerZ);

  const playerInWater = isWaterAt(clampedPickup.x, clampedPickup.z);
  const targetIsWater = isWaterAt(clampedTarget.x, clampedTarget.z);

  // Spawn Snowman 24m away in the direction of the destination (or east if very close)
  const dx = clampedTarget.x - clampedPickup.x;
  const dz = clampedTarget.z - clampedPickup.z;
  const dist = Math.hypot(dx, dz);
  const dirX = dist > 1 ? dx / dist : 1;
  const dirZ = dist > 1 ? dz / dist : 0;

  const spawn = clampExactWorldCoord(clampedPickup.x - dirX * 22, clampedPickup.z - dirZ * 22);
  const resolved = resolveSnowmanVehicleAt(
    spawn.x,
    spawn.z,
    params.landTransport,
    params.waterTransport,
    Boolean(params.instantCycleMorph)
  );
  const spec = getSnowmanTransportSpec(resolved.activeTransport);
  const spawnY = getSnowmanVehicleCruiseY(
    spawn.x,
    spawn.z,
    resolved.activeTransport,
    resolved.inWater,
    resolved.activeTransport === 'snowman_aircraft' ? 0.5 : 0
  );
  const heading = Math.atan2(clampedPickup.x - spawn.x, clampedPickup.z - spawn.z);

  const pickupLabel = playerInWater ? 'Water' : 'Land';
  const destLabel = targetIsWater ? 'Water' : 'Land';

  return {
    ...prev,
    phase: 'approaching',
    driverName: 'Snowman',
    landTransport: params.landTransport,
    waterTransport: params.waterTransport,
    activeTransport: resolved.activeTransport,
    cycleMorphedToJetSki: resolved.cycleMorphedToJetSki,
    morphFlashTimer: resolved.activeTransport === 'cycle_jetski' ? 0.85 : 0.45,
    x: spawn.x,
    y: spawnY,
    z: spawn.z,
    heading,
    speed: spec.cruiseSpeed,
    speedKmh: Math.round(spec.cruiseSpeed * 3.6),
    pickupX: clampedPickup.x,
    pickupZ: clampedPickup.z,
    targetX: clampedTarget.x,
    targetZ: clampedTarget.z,
    targetIsWater,
    instantExpress: Boolean(params.instantExpress),
    playerOnboard: false,
    boardingTimer: 0,
    arrivalTimer: 0,
    statusMessage: `Snowman ${spec.shortLabel} racing to your ${pickupLabel} spot → (${clampedTarget.x.toFixed(0)}, ${clampedTarget.z.toFixed(0)}) ${destLabel}`,
  };
}

/**
 * Instantly toggles Cycle ⇄ Jet Ski simultaneous morph while Snowman Taxi is active.
 */
export function triggerInstantCycleJetSkiMorph(state: SnowmanTaxiState): SnowmanTaxiState {
  if (state.phase === 'idle') {
    return {
      ...state,
      landTransport: 'cycle_jetski',
      waterTransport: 'cycle_jetski',
      activeTransport: 'cycle_jetski',
      cycleMorphedToJetSki: !state.cycleMorphedToJetSki,
      morphFlashTimer: 0.9,
      statusMessage: !state.cycleMorphedToJetSki
        ? 'Cycle instantly converted into Jet Ski!'
        : 'Jet Ski instantly converted into Cycle!',
    };
  }
  const nextMorph = !state.cycleMorphedToJetSki;
  return {
    ...state,
    activeTransport: 'cycle_jetski',
    cycleMorphedToJetSki: nextMorph,
    morphFlashTimer: 0.9,
    statusMessage: nextMorph
      ? 'Snowman Cycle → Jet Ski instant morph!'
      : 'Snowman Jet Ski → Cycle instant morph!',
  };
}

export function cancelSnowmanTaxi(state: SnowmanTaxiState): SnowmanTaxiState {
  return {
    ...state,
    phase: 'idle',
    playerOnboard: false,
    speed: 0,
    speedKmh: 0,
    boardingTimer: 0,
    arrivalTimer: 0,
    statusMessage: 'Snowman Taxi cancelled',
  };
}

export interface SnowmanTaxiStepOutput {
  state: SnowmanTaxiState;
  overridePlayerPos: { x: number; y: number; z: number; heading: number } | null;
  justPickedUp: boolean;
  justMorphed: boolean;
  justArrived: boolean;
}

/**
 * Advances the Snowman Multi-Transport Taxi state machine deterministically:
 * 1. `approaching`: Snowman drives/rides/flies directly to player's live exact location.
 * 2. `boarding`: Brief instant hop-on; if Cycle ⇄ JetSki or shore transition, morphs simultaneously!
 * 3. `transporting`: Snowman drives/flies/morphs straight to exact pinned `(targetX, targetZ)`
 *    (or delivers instantaneously if `instantExpress` is toggled).
 * 4. `arrived`: Drops player cleanly at the exact pinned coordinate `(targetX, targetZ)`.
 */
export function stepSnowmanTaxi(
  prev: SnowmanTaxiState,
  params: {
    dt: number;
    playerX: number;
    playerZ: number;
  }
): SnowmanTaxiStepOutput {
  const safeDt = Math.min(0.1, Math.max(0.001, params.dt));
  const nextMorphFlash = Math.max(0, prev.morphFlashTimer - safeDt);

  if (prev.phase === 'idle') {
    if (nextMorphFlash === prev.morphFlashTimer) {
      return {
        state: prev,
        overridePlayerPos: null,
        justPickedUp: false,
        justMorphed: false,
        justArrived: false,
      };
    }
    return {
      state: { ...prev, morphFlashTimer: nextMorphFlash },
      overridePlayerPos: null,
      justPickedUp: false,
      justMorphed: false,
      justArrived: false,
    };
  }

  if (prev.phase === 'approaching') {
    const dx = params.playerX - prev.x;
    const dz = params.playerZ - prev.z;
    const dist = Math.hypot(dx, dz);
    const heading = dist > 0.05 ? Math.atan2(dx, dz) : prev.heading;
    const spec = getSnowmanTransportSpec(prev.activeTransport);
    const speed = Math.min(spec.cruiseSpeed * 1.15, Math.max(14.0, dist * 1.9));
    const stepDist = Math.min(dist, speed * safeDt);
    const nx = prev.x + (dist > 0.05 ? (dx / dist) * stepDist : 0);
    const nz = prev.z + (dist > 0.05 ? (dz / dist) * stepDist : 0);

    const resolved = resolveSnowmanVehicleAt(nx, nz, prev.landTransport, prev.waterTransport);
    const morphed =
      resolved.activeTransport !== prev.activeTransport ||
      resolved.cycleMorphedToJetSki !== prev.cycleMorphedToJetSki;
    const airFrac =
      resolved.activeTransport === 'snowman_aircraft'
        ? Math.min(0.6, dist / 24)
        : 0;
    const ny = getSnowmanVehicleCruiseY(nx, nz, resolved.activeTransport, resolved.inWater, airFrac);

    if (dist <= 3.0) {
      const destHeading = Math.atan2(prev.targetX - params.playerX, prev.targetZ - params.playerZ);
      const boardingResolved = resolveSnowmanVehicleAt(
        params.playerX,
        params.playerZ,
        prev.landTransport,
        prev.waterTransport,
        // If Cycle->JetSki was chosen and destination is water, convert simultaneously on boarding!
        prev.landTransport === 'cycle_jetski' && prev.targetIsWater
      );
      const bSpec = getSnowmanTransportSpec(boardingResolved.activeTransport);
      const by = getSnowmanVehicleCruiseY(
        params.playerX,
        params.playerZ,
        boardingResolved.activeTransport,
        boardingResolved.inWater,
        0
      );
      return {
        state: {
          ...prev,
          phase: 'boarding',
          activeTransport: boardingResolved.activeTransport,
          cycleMorphedToJetSki: boardingResolved.cycleMorphedToJetSki,
          morphFlashTimer:
            boardingResolved.activeTransport === 'cycle_jetski' || morphed ? 0.9 : nextMorphFlash,
          x: params.playerX,
          y: by,
          z: params.playerZ,
          heading: destHeading,
          speed: 0,
          speedKmh: 0,
          playerOnboard: true,
          boardingTimer: prev.instantExpress ? 0.15 : 0.45,
          statusMessage: `Boarded Snowman’s ${bSpec.shortLabel}! Heading to (${prev.targetX.toFixed(0)}, ${prev.targetZ.toFixed(0)})`,
        },
        overridePlayerPos: {
          x: params.playerX,
          y: by + 0.55,
          z: params.playerZ,
          heading: destHeading,
        },
        justPickedUp: true,
        justMorphed: morphed || boardingResolved.activeTransport === 'cycle_jetski',
        justArrived: false,
      };
    }

    return {
      state: {
        ...prev,
        activeTransport: resolved.activeTransport,
        cycleMorphedToJetSki: resolved.cycleMorphedToJetSki,
        morphFlashTimer: morphed ? 0.85 : nextMorphFlash,
        x: nx,
        y: ny,
        z: nz,
        heading,
        speed,
        speedKmh: Math.round(speed * 3.6),
        pickupX: params.playerX,
        pickupZ: params.playerZ,
      },
      overridePlayerPos: null,
      justPickedUp: false,
      justMorphed: morphed,
      justArrived: false,
    };
  }

  if (prev.phase === 'boarding') {
    const remaining = prev.boardingTimer - safeDt;
    const heading = Math.atan2(prev.targetX - prev.x, prev.targetZ - prev.z);
    if (remaining <= 0) {
      if (prev.instantExpress) {
        const destResolved = resolveSnowmanVehicleAt(
          prev.targetX,
          prev.targetZ,
          prev.landTransport,
          prev.waterTransport
        );
        const destY = getSnowmanVehicleCruiseY(
          prev.targetX,
          prev.targetZ,
          destResolved.activeTransport,
          destResolved.inWater,
          0
        );
        return {
          state: {
            ...prev,
            phase: 'arrived',
            activeTransport: destResolved.activeTransport,
            cycleMorphedToJetSki: destResolved.cycleMorphedToJetSki,
            morphFlashTimer: 0.9,
            x: prev.targetX,
            y: destY,
            z: prev.targetZ,
            heading,
            speed: 0,
            speedKmh: 0,
            playerOnboard: false,
            boardingTimer: 0,
            arrivalTimer: 6.0,
            statusMessage: `Arrived at exact pin (${prev.targetX.toFixed(0)}m, ${prev.targetZ.toFixed(0)}m)!`,
          },
          overridePlayerPos: {
            x: prev.targetX,
            y: destResolved.inWater ? 0.35 : Math.max(0.2, groundHeightAt(prev.targetX, prev.targetZ)),
            z: prev.targetZ,
            heading,
          },
          justPickedUp: false,
          justMorphed: true,
          justArrived: true,
        };
      }
      return {
        state: {
          ...prev,
          phase: 'transporting',
          heading,
          boardingTimer: 0,
          morphFlashTimer: nextMorphFlash,
        },
        overridePlayerPos: {
          x: prev.x,
          y: prev.y + 0.55,
          z: prev.z,
          heading,
        },
        justPickedUp: false,
        justMorphed: false,
        justArrived: false,
      };
    }
    return {
      state: {
        ...prev,
        heading,
        boardingTimer: remaining,
        morphFlashTimer: nextMorphFlash,
      },
      overridePlayerPos: {
        x: prev.x,
        y: prev.y + 0.55,
        z: prev.z,
        heading,
      },
      justPickedUp: false,
      justMorphed: false,
      justArrived: false,
    };
  }

  if (prev.phase === 'transporting') {
    const dx = prev.targetX - prev.x;
    const dz = prev.targetZ - prev.z;
    const dist = Math.hypot(dx, dz);
    const totalTripDist = Math.max(
      12,
      Math.hypot(prev.targetX - prev.pickupX, prev.targetZ - prev.pickupZ)
    );
    const heading = dist > 0.05 ? Math.atan2(dx, dz) : prev.heading;
    const spec = getSnowmanTransportSpec(prev.activeTransport);
    const speed = Math.min(spec.cruiseSpeed * 1.45, Math.max(16.0, dist * 1.4));
    const stepDist = Math.min(dist, speed * safeDt);
    const nx = prev.x + (dist > 0.05 ? (dx / dist) * stepDist : 0);
    const nz = prev.z + (dist > 0.05 ? (dz / dist) * stepDist : 0);

    const resolved = resolveSnowmanVehicleAt(nx, nz, prev.landTransport, prev.waterTransport);
    const morphed =
      resolved.activeTransport !== prev.activeTransport ||
      resolved.cycleMorphedToJetSki !== prev.cycleMorphedToJetSki;
    const progress = 1 - Math.min(1, dist / totalTripDist);
    const arcLift = Math.sin(progress * Math.PI);
    const airFrac =
      resolved.activeTransport === 'snowman_aircraft' ||
      resolved.activeTransport === 'combined_omni'
        ? arcLift
        : 0;
    const ny = getSnowmanVehicleCruiseY(nx, nz, resolved.activeTransport, resolved.inWater, airFrac);

    if (dist <= 2.4) {
      const dropY = resolved.inWater
        ? 0.35
        : Math.max(0.2, groundHeightAt(prev.targetX, prev.targetZ));
      return {
        state: {
          ...prev,
          phase: 'arrived',
          activeTransport: resolved.activeTransport,
          cycleMorphedToJetSki: resolved.cycleMorphedToJetSki,
          morphFlashTimer: morphed ? 0.9 : nextMorphFlash,
          x: prev.targetX,
          y: getSnowmanVehicleCruiseY(
            prev.targetX,
            prev.targetZ,
            resolved.activeTransport,
            resolved.inWater,
            0
          ),
          z: prev.targetZ,
          heading,
          speed: 0,
          speedKmh: 0,
          playerOnboard: false,
          arrivalTimer: 6.0,
          statusMessage: `Snowman Taxi delivered you to (${prev.targetX.toFixed(0)}m, ${prev.targetZ.toFixed(0)}m)!`,
        },
        overridePlayerPos: {
          x: prev.targetX,
          y: dropY,
          z: prev.targetZ,
          heading,
        },
        justPickedUp: false,
        justMorphed: morphed,
        justArrived: true,
      };
    }

    const rSpec = getSnowmanTransportSpec(resolved.activeTransport);
    const riderOffset = resolved.activeTransport === 'cycle_jetski' || resolved.activeTransport === 'jetski' ? 0.85 : 0.4;
    const riderYOffset =
      resolved.activeTransport === 'combat_bus' || resolved.activeTransport === 'snowman_train'
        ? 1.15
        : resolved.activeTransport === 'snowman_aircraft' || resolved.activeTransport === 'combined_omni'
          ? 0.95
          : 0.5;
    return {
      state: {
        ...prev,
        activeTransport: resolved.activeTransport,
        cycleMorphedToJetSki: resolved.cycleMorphedToJetSki,
        morphFlashTimer: morphed ? 0.9 : nextMorphFlash,
        x: nx,
        y: ny,
        z: nz,
        heading,
        speed,
        speedKmh: Math.round(speed * 3.6),
        playerOnboard: true,
        statusMessage: morphed
          ? `Snowman morphed into ${resolved.cycleMorphedToJetSki && resolved.activeTransport === 'cycle_jetski' ? 'Jet Ski' : rSpec.shortLabel}! ${Math.round(dist)}m left`
          : `Snowman ${rSpec.shortLabel} · ${Math.round(dist)}m to (${prev.targetX.toFixed(0)}, ${prev.targetZ.toFixed(0)})`,
      },
      overridePlayerPos: {
        x: nx - Math.sin(heading) * riderOffset,
        y: ny + riderYOffset,
        z: nz - Math.cos(heading) * riderOffset,
        heading,
      },
      justPickedUp: false,
      justMorphed: morphed,
      justArrived: false,
    };
  }

  // phase === 'arrived'
  const nextArrival = Math.max(0, prev.arrivalTimer - safeDt);
  return {
    state: {
      ...prev,
      phase: nextArrival <= 0 ? 'idle' : 'arrived',
      arrivalTimer: nextArrival,
      morphFlashTimer: nextMorphFlash,
      speed: 0,
      speedKmh: 0,
    },
    overridePlayerPos: null,
    justPickedUp: false,
    justMorphed: false,
    justArrived: false,
  };
}
