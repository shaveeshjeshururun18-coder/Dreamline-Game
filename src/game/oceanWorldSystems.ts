import { HERO_CHARACTERS, type HeroCharacterId } from './heroCharacters';

export interface OceanCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

/**
 * Pure game logic for the Kadalkarai Ocean Services & Islands expansion:
 * 1. Kadalkarai Submarine Service (surface cruising + underwater diving depth physics)
 * 2. Ocean Superhero Suits Building (offshore Marine Hero Tower housing all 7 hero suits)
 * 3. Snowman Island & 30-second Ocean Water Snowman Jet Ski Rescue sequence
 */

// ─── 1. KADALKARAI SUBMARINE SERVICE ──────────────────────────────────────────

export const SUBMARINE_PIER_BOUNDS = {
  minX: 105.0,
  maxX: 123.5,
  minZ: 31.5,
  maxZ: 36.5,
  deckY: 0.34,
} as const;

export const SUBMARINE_DOCK_POS = {
  x: 129.2,
  z: 34.0,
  heading: Math.PI * 0.5, // Facing east into open Kadalkarai Ocean
} as const;

export const SUBMARINE_EXIT_POS = {
  x: 120.5,
  z: 34.0,
} as const;

export const SUBMARINE_SURFACE_Y = -0.15;
export const SUBMARINE_MAX_DEPTH = 13.5;

export interface SubmarineState {
  x: number;
  y: number;
  z: number;
  depth: number; // 0 = surfaced, up to SUBMARINE_MAX_DEPTH (13.5m underwater)
  targetDepth: number;
  heading: number;
  speed: number; // m/s
  speedKmh: number;
  pitch: number; // radians, tilts nose down when diving, up when ascending
  propellerSpin: number;
  searchlightOn: boolean;
  submerged: boolean;
  sonarPhase: number;
}

export interface SubmarineControlInput {
  throttle: number; // -1..1
  steer: number; // -1 (left) .. +1 (right)
  diveDelta: number; // +1 = dive deeper, -1 = rise toward surface
  boost: boolean;
}

export function createInitialSubmarineState(): SubmarineState {
  return {
    x: SUBMARINE_DOCK_POS.x,
    y: SUBMARINE_SURFACE_Y,
    z: SUBMARINE_DOCK_POS.z,
    depth: 0,
    targetDepth: 0,
    heading: SUBMARINE_DOCK_POS.heading,
    speed: 0,
    speedKmh: 0,
    pitch: 0,
    propellerSpin: 0,
    searchlightOn: true,
    submerged: false,
    sonarPhase: 0,
  };
}

export function isOnSubmarinePier(x: number, z: number): boolean {
  return (
    x >= SUBMARINE_PIER_BOUNDS.minX &&
    x <= SUBMARINE_PIER_BOUNDS.maxX &&
    z >= SUBMARINE_PIER_BOUNDS.minZ &&
    z <= SUBMARINE_PIER_BOUNDS.maxZ
  );
}

/**
 * Pure physics step for the drivable Kadalkarai Submarine.
 * `isOpenOceanFn` verifies navigable ocean water so the submarine never beaches onto islands or mainland.
 */
export function stepSubmarineState(
  prev: SubmarineState,
  input: SubmarineControlInput,
  dt: number,
  isOpenOceanFn: (x: number, z: number) => boolean,
  playableRadius = 420
): SubmarineState {
  const safeDt = Math.min(0.1, Math.max(0.001, dt));
  const maxFwd = input.boost ? 16.5 : 11.5;
  const maxRev = -5.5;

  let speed = prev.speed;
  if (input.throttle > 0.05) {
    speed = Math.min(maxFwd, speed + (input.boost ? 11.0 : 7.5) * input.throttle * safeDt);
  } else if (input.throttle < -0.05) {
    speed = Math.max(maxRev, speed + 8.0 * input.throttle * safeDt);
  } else {
    const drag = (3.4 + Math.abs(speed) * 0.25) * safeDt;
    speed = Math.abs(speed) <= drag ? 0 : speed - Math.sign(speed) * drag;
  }

  // Submarine turns smoothly even at low speed via stern thrusters
  const turnAuthority = 0.55 + Math.min(0.45, Math.abs(speed) / 10);
  const turnSign = speed >= -0.2 ? 1 : -1;
  const heading = prev.heading - input.steer * 1.35 * turnAuthority * turnSign * safeDt;

  // Depth & diving control (0m surface down to 13.5m deep sea)
  const targetDepth = Math.max(
    0,
    Math.min(SUBMARINE_MAX_DEPTH, prev.targetDepth + input.diveDelta * 4.8 * safeDt)
  );
  const depthDiff = targetDepth - prev.depth;
  const depth = prev.depth + depthDiff * (1 - Math.exp(-3.6 * safeDt));
  const targetPitch = Math.max(-0.28, Math.min(0.28, -depthDiff * 0.14));
  const pitch = prev.pitch + (targetPitch - prev.pitch) * (1 - Math.exp(-6.0 * safeDt));

  let nextX = prev.x + Math.sin(heading) * speed * safeDt;
  let nextZ = prev.z + Math.cos(heading) * speed * safeDt;

  const r = Math.hypot(nextX, nextZ);
  const validWater =
    r <= playableRadius - 14 &&
    isOpenOceanFn(nextX, nextZ) &&
    isOpenOceanFn(nextX + Math.sin(heading) * 3.0, nextZ + Math.cos(heading) * 3.0);

  if (!validWater) {
    // Allow sliding along one axis if possible
    if (r <= playableRadius - 14 && isOpenOceanFn(nextX, prev.z)) {
      nextZ = prev.z;
      speed *= 0.65;
    } else if (r <= playableRadius - 14 && isOpenOceanFn(prev.x, nextZ)) {
      nextX = prev.x;
      speed *= 0.65;
    } else {
      nextX = prev.x;
      nextZ = prev.z;
      speed *= -0.2;
    }
  }

  return {
    ...prev,
    x: nextX,
    y: SUBMARINE_SURFACE_Y - depth,
    z: nextZ,
    depth,
    targetDepth,
    heading,
    speed,
    speedKmh: Math.round(Math.abs(speed) * 3.6),
    pitch,
    propellerSpin: prev.propellerSpin + (1.8 + Math.abs(speed) * 1.45) * safeDt,
    submerged: depth > 1.1,
    sonarPhase: (prev.sonarPhase + safeDt * 1.6) % (Math.PI * 2),
  };
}

// ─── 2. OCEAN SUPERHERO SUITS BUILDING (OFFSHORE MARINE HERO TOWER) ───────────

export const OCEAN_HERO_TOWER_CENTER = { x: 184, z: 150 } as const;
export const OCEAN_HERO_TOWER_RADIUS = 17.5;
export const OCEAN_HERO_TOWER_DECK_Y = 0.85;
export const OCEAN_HERO_TOWER_SPAWN = { x: 171.2, z: 150.0 } as const;

export const OCEAN_HERO_TOWER_PIER_BOUNDS = {
  minX: 161.5,
  maxX: 170.5,
  minZ: 147.2,
  maxZ: 152.8,
  deckY: 0.45,
} as const;

export interface OceanHeroSuitPod {
  heroId: HeroCharacterId;
  name: string;
  alias: string;
  x: number;
  y: number;
  z: number;
  angle: number;
  accentHex: number;
}

const OCEAN_SUIT_ACCENTS: Record<HeroCharacterId, number> = {
  steve_harrington: 0xfacc15,
  iron_man_classic: 0xef4444,
  iron_man_advanced: 0x38bdf8,
  hulkbuster: 0xf59e0b,
  batman: 0x94a3b8,
  spider_man: 0xe11d48,
  superman: 0x3b82f6,
};

/** 7 Superhero Suit pods arranged in a dramatic circular oceanic gallery inside the Ocean Hero Building */
export const OCEAN_HERO_SUIT_PODS: readonly OceanHeroSuitPod[] = HERO_CHARACTERS.map((hero, idx) => {
  const count = HERO_CHARACTERS.length;
  // Arrange in a wide horseshoe facing the West ocean entrance (avoiding blocking angle = PI)
  const startAngle = -Math.PI * 0.72;
  const endAngle = Math.PI * 0.72;
  const angle = startAngle + (idx / Math.max(1, count - 1)) * (endAngle - startAngle);
  const ringR = 8.4;
  return {
    heroId: hero.id,
    name: hero.name,
    alias: hero.alias,
    x: OCEAN_HERO_TOWER_CENTER.x + Math.cos(angle) * ringR,
    y: OCEAN_HERO_TOWER_DECK_Y,
    z: OCEAN_HERO_TOWER_CENTER.z + Math.sin(angle) * ringR,
    angle,
    accentHex: OCEAN_SUIT_ACCENTS[hero.id] ?? 0x38bdf8,
  };
});

export const OCEAN_HERO_CONSOLE_POS = {
  x: OCEAN_HERO_TOWER_CENTER.x + 1.5,
  y: OCEAN_HERO_TOWER_DECK_Y,
  z: OCEAN_HERO_TOWER_CENTER.z,
} as const;

export function isOnOceanHeroTowerPier(x: number, z: number): boolean {
  return (
    x >= OCEAN_HERO_TOWER_PIER_BOUNDS.minX &&
    x <= OCEAN_HERO_TOWER_PIER_BOUNDS.maxX &&
    z >= OCEAN_HERO_TOWER_PIER_BOUNDS.minZ &&
    z <= OCEAN_HERO_TOWER_PIER_BOUNDS.maxZ
  );
}

export function isInsideOceanHeroTowerLand(x: number, z: number, pad = 0): boolean {
  return (
    Math.hypot(x - OCEAN_HERO_TOWER_CENTER.x, z - OCEAN_HERO_TOWER_CENTER.z) <=
    OCEAN_HERO_TOWER_RADIUS + pad
  );
}

export function getOceanHeroTowerFloorHeight(x: number, z: number): number | null {
  if (isInsideOceanHeroTowerLand(x, z, 0.3)) return OCEAN_HERO_TOWER_DECK_Y;
  if (isOnOceanHeroTowerPier(x, z)) return OCEAN_HERO_TOWER_PIER_BOUNDS.deckY;
  return null;
}

export function getOceanHeroTowerColliders(): OceanCollider[] {
  const cx = OCEAN_HERO_TOWER_CENTER.x;
  const cz = OCEAN_HERO_TOWER_CENTER.z;
  // Curved structural corner pylons (leaving wide open west entrance & panoramic walkways!)
  return [
    { id: 'ocean_hero_pillar_ne', minX: cx + 10.2, maxX: cx + 12.6, minZ: cz - 10.4, maxZ: cz - 8.0 },
    { id: 'ocean_hero_pillar_se', minX: cx + 10.2, maxX: cx + 12.6, minZ: cz + 8.0, maxZ: cz + 10.4 },
    { id: 'ocean_hero_pillar_nw', minX: cx - 10.4, maxX: cx - 8.0, minZ: cz - 11.4, maxZ: cz - 9.0 },
    { id: 'ocean_hero_pillar_sw', minX: cx - 10.4, maxX: cx - 8.0, minZ: cz + 9.0, maxZ: cz + 11.4 },
  ];
}

// ─── 3. NEW SNOWMAN ISLAND & 30s OCEAN SNOWMAN JET SKI RESCUE ────────────────

export const SNOWMAN_ISLAND_CENTER = { x: 258, z: 118 } as const;
export const SNOWMAN_ISLAND_RADIUS = 25.5;
export const SNOWMAN_ISLAND_SPAWN = { x: 243.5, z: 118.0 } as const;
export const SNOWMAN_ISLAND_DOCK_POS = { x: 232.0, z: 118.0 } as const;

export const SNOWMAN_ISLAND_PIER_BOUNDS = {
  minX: 230.0,
  maxX: 242.5,
  minZ: 115.2,
  maxZ: 120.8,
  deckY: 0.42,
} as const;

export const OCEAN_RESCUE_THRESHOLD_SECONDS = 30;

export function isOnSnowmanIslandPier(x: number, z: number): boolean {
  return (
    x >= SNOWMAN_ISLAND_PIER_BOUNDS.minX &&
    x <= SNOWMAN_ISLAND_PIER_BOUNDS.maxX &&
    z >= SNOWMAN_ISLAND_PIER_BOUNDS.minZ &&
    z <= SNOWMAN_ISLAND_PIER_BOUNDS.maxZ
  );
}

export function isInsideSnowmanIsland(x: number, z: number, pad = 0): boolean {
  return (
    Math.hypot(x - SNOWMAN_ISLAND_CENTER.x, z - SNOWMAN_ISLAND_CENTER.z) <=
    SNOWMAN_ISLAND_RADIUS + pad
  );
}

export function getSnowmanIslandColliders(): OceanCollider[] {
  const cx = SNOWMAN_ISLAND_CENTER.x;
  const cz = SNOWMAN_ISLAND_CENTER.z;
  return [
    // Snowman Lighthouse tower base
    { id: 'snowman_island_lighthouse', minX: cx + 6.5, maxX: cx + 12.5, minZ: cz - 12.0, maxZ: cz - 6.0 },
    // Cozy Main Snowman Igloo Lodge
    { id: 'snowman_island_igloo_main', minX: cx - 3.8, maxX: cx + 3.8, minZ: cz + 5.5, maxZ: cz + 13.0 },
    // Frosty Workshop Igloo
    { id: 'snowman_island_igloo_north', minX: cx - 10.5, maxX: cx - 4.5, minZ: cz - 12.0, maxZ: cz - 6.0 },
  ];
}

export type SnowmanRescuePhase = 'idle' | 'approaching' | 'boarding' | 'transporting' | 'arrived';

export interface SnowmanRescueState {
  phase: SnowmanRescuePhase;
  oceanSwimSeconds: number;
  thresholdSeconds: number;
  jetSkiX: number;
  jetSkiZ: number;
  jetSkiHeading: number;
  jetSkiSpeed: number;
  boardingTimer: number;
  arrivalBannerTimer: number;
  rescuesCompleted: number;
}

export function createInitialSnowmanRescueState(
  thresholdSeconds = OCEAN_RESCUE_THRESHOLD_SECONDS
): SnowmanRescueState {
  return {
    phase: 'idle',
    oceanSwimSeconds: 0,
    thresholdSeconds: Math.max(1, thresholdSeconds),
    jetSkiX: SNOWMAN_ISLAND_DOCK_POS.x,
    jetSkiZ: SNOWMAN_ISLAND_DOCK_POS.z,
    jetSkiHeading: -Math.PI * 0.5,
    jetSkiSpeed: 0,
    boardingTimer: 0,
    arrivalBannerTimer: 0,
    rescuesCompleted: 0,
  };
}

export interface SnowmanRescueStepOutput {
  state: SnowmanRescueState;
  overridePlayerPos: { x: number; y: number; z: number; heading: number } | null;
  justTriggeredRescue: boolean;
  justArrivedAtIsland: boolean;
}

/**
 * Pure deterministic state machine for the >1-minute Ocean Snowman Jet Ski Rescue:
 * - Tracks continuous time spent swimming in Kadalkarai Ocean.
 * - After `thresholdSeconds` (30 seconds), a Snowman on a Jet Ski speeds across the sea to the player,
 *   boards them onto the Jet Ski, and rides them directly to the new Snowman Island!
 */
export function stepOceanSnowmanRescue(
  prev: SnowmanRescueState,
  params: {
    dt: number;
    inOceanWater: boolean;
    playerX: number;
    playerZ: number;
  }
): SnowmanRescueStepOutput {
  const safeDt = Math.min(0.1, Math.max(0.001, params.dt));
  let justTriggeredRescue = false;
  let justArrivedAtIsland = false;

  if (prev.phase === 'idle') {
    const nextTimer = params.inOceanWater ? prev.oceanSwimSeconds + safeDt : 0;
    if (params.inOceanWater && nextTimer >= prev.thresholdSeconds) {
      // Spawn the Snowman Jet Ski in the ocean toward Snowman Island, ~34m from player
      const toIslandX = SNOWMAN_ISLAND_DOCK_POS.x - params.playerX;
      const toIslandZ = SNOWMAN_ISLAND_DOCK_POS.z - params.playerZ;
      const distToIsland = Math.hypot(toIslandX, toIslandZ) || 1;
      const spawnDist = Math.min(36, Math.max(20, distToIsland * 0.6));
      const spawnX = params.playerX + (toIslandX / distToIsland) * spawnDist;
      const spawnZ = params.playerZ + (toIslandZ / distToIsland) * spawnDist;
      const headingToPlayer = Math.atan2(params.playerX - spawnX, params.playerZ - spawnZ);
      justTriggeredRescue = true;
      return {
        state: {
          ...prev,
          phase: 'approaching',
          oceanSwimSeconds: nextTimer,
          jetSkiX: spawnX,
          jetSkiZ: spawnZ,
          jetSkiHeading: headingToPlayer,
          jetSkiSpeed: 22.0,
          boardingTimer: 0,
        },
        overridePlayerPos: null,
        justTriggeredRescue,
        justArrivedAtIsland: false,
      };
    }

    return {
      state: {
        ...prev,
        oceanSwimSeconds: nextTimer,
        jetSkiSpeed: 0,
        arrivalBannerTimer: Math.max(0, prev.arrivalBannerTimer - safeDt),
      },
      overridePlayerPos: null,
      justTriggeredRescue: false,
      justArrivedAtIsland: false,
    };
  }

  if (prev.phase === 'approaching') {
    const dx = params.playerX - prev.jetSkiX;
    const dz = params.playerZ - prev.jetSkiZ;
    const dist = Math.hypot(dx, dz);
    const heading = dist > 0.05 ? Math.atan2(dx, dz) : prev.jetSkiHeading;
    const speed = Math.min(24.0, Math.max(10.0, dist * 1.4));
    const step = Math.min(dist, speed * safeDt);
    const nx = prev.jetSkiX + (dist > 0.05 ? (dx / dist) * step : 0);
    const nz = prev.jetSkiZ + (dist > 0.05 ? (dz / dist) * step : 0);

    if (dist <= 2.8) {
      return {
        state: {
          ...prev,
          phase: 'boarding',
          jetSkiX: params.playerX,
          jetSkiZ: params.playerZ,
          jetSkiHeading: Math.atan2(
            SNOWMAN_ISLAND_DOCK_POS.x - params.playerX,
            SNOWMAN_ISLAND_DOCK_POS.z - params.playerZ
          ),
          jetSkiSpeed: 2.0,
          boardingTimer: 0.9,
        },
        overridePlayerPos: {
          x: params.playerX,
          y: 0.32,
          z: params.playerZ,
          heading: Math.atan2(
            SNOWMAN_ISLAND_DOCK_POS.x - params.playerX,
            SNOWMAN_ISLAND_DOCK_POS.z - params.playerZ
          ),
        },
        justTriggeredRescue: false,
        justArrivedAtIsland: false,
      };
    }

    return {
      state: {
        ...prev,
        jetSkiX: nx,
        jetSkiZ: nz,
        jetSkiHeading: heading,
        jetSkiSpeed: speed,
      },
      overridePlayerPos: null,
      justTriggeredRescue: false,
      justArrivedAtIsland: false,
    };
  }

  if (prev.phase === 'boarding') {
    const remaining = prev.boardingTimer - safeDt;
    const heading = Math.atan2(
      SNOWMAN_ISLAND_DOCK_POS.x - prev.jetSkiX,
      SNOWMAN_ISLAND_DOCK_POS.z - prev.jetSkiZ
    );
    const riderX = prev.jetSkiX - Math.sin(heading) * 0.85;
    const riderZ = prev.jetSkiZ - Math.cos(heading) * 0.85;
    if (remaining <= 0) {
      return {
        state: {
          ...prev,
          phase: 'transporting',
          jetSkiHeading: heading,
          jetSkiSpeed: 24.0,
          boardingTimer: 0,
        },
        overridePlayerPos: {
          x: riderX,
          y: 0.36,
          z: riderZ,
          heading,
        },
        justTriggeredRescue: false,
        justArrivedAtIsland: false,
      };
    }
    return {
      state: {
        ...prev,
        jetSkiHeading: heading,
        boardingTimer: remaining,
      },
      overridePlayerPos: {
        x: riderX,
        y: 0.36,
        z: riderZ,
        heading,
      },
      justTriggeredRescue: false,
      justArrivedAtIsland: false,
    };
  }

  if (prev.phase === 'transporting') {
    const dx = SNOWMAN_ISLAND_DOCK_POS.x - prev.jetSkiX;
    const dz = SNOWMAN_ISLAND_DOCK_POS.z - prev.jetSkiZ;
    const dist = Math.hypot(dx, dz);
    const heading = dist > 0.05 ? Math.atan2(dx, dz) : Math.PI * 0.5;
    const speed = Math.min(28.0, Math.max(12.0, dist * 1.1));
    const step = Math.min(dist, speed * safeDt);
    const nx = prev.jetSkiX + (dist > 0.05 ? (dx / dist) * step : 0);
    const nz = prev.jetSkiZ + (dist > 0.05 ? (dz / dist) * step : 0);

    if (dist <= 3.2) {
      justArrivedAtIsland = true;
      return {
        state: {
          ...prev,
          phase: 'arrived',
          oceanSwimSeconds: 0,
          jetSkiX: SNOWMAN_ISLAND_DOCK_POS.x,
          jetSkiZ: SNOWMAN_ISLAND_DOCK_POS.z,
          jetSkiHeading: -Math.PI * 0.5,
          jetSkiSpeed: 0,
          arrivalBannerTimer: 7.0,
          rescuesCompleted: prev.rescuesCompleted + 1,
        },
        overridePlayerPos: {
          x: SNOWMAN_ISLAND_SPAWN.x,
          y: 0.9,
          z: SNOWMAN_ISLAND_SPAWN.z,
          heading: Math.PI * 0.5,
        },
        justTriggeredRescue: false,
        justArrivedAtIsland,
      };
    }

    const riderX = nx - Math.sin(heading) * 0.85;
    const riderZ = nz - Math.cos(heading) * 0.85;
    return {
      state: {
        ...prev,
        jetSkiX: nx,
        jetSkiZ: nz,
        jetSkiHeading: heading,
        jetSkiSpeed: speed,
      },
      overridePlayerPos: {
        x: riderX,
        y: 0.36,
        z: riderZ,
        heading,
      },
      justTriggeredRescue: false,
      justArrivedAtIsland: false,
    };
  }

  // phase === 'arrived'
  const nextBanner = Math.max(0, prev.arrivalBannerTimer - safeDt);
  return {
    state: {
      ...prev,
      phase: nextBanner <= 0 || params.inOceanWater ? 'idle' : 'arrived',
      oceanSwimSeconds: params.inOceanWater ? safeDt : 0,
      arrivalBannerTimer: nextBanner,
      jetSkiSpeed: 0,
    },
    overridePlayerPos: null,
    justTriggeredRescue: false,
    justArrivedAtIsland: false,
  };
}
