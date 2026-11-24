import type { AabbCollider } from './terrain';

/**
 * New York-Inspired Open-World Destructible Metropolis (Pure Physics & Layout Module)
 *
 * Located on the spacious flat northern plateau at (32, -225), spanning 176m x 176m:
 * - 18 multi-tier destructible skyscrapers (24m..72m tall) with staged fracture & partial/full collapse
 * - 52 destructible urban props (cars, buses, street lamps, traffic lights, benches, water towers, crates, barriers)
 * - Real-time rigid-body falling debris chunks (gravity, ground bounce, tumble rotation, dust puffs)
 * - Real pendulum momentum Web-Swinging physics anchored to nearby skyscrapers
 * - Rooftop Grapple Gun targeting & 3D Superhero Flight / Cape Glide physics
 */

export const METRO_CITY_CENTER = { x: 32, z: -225 } as const;
export const METRO_CITY_HALF_SIZE = 86;
export const METRO_CITY_SPAWN = { x: 32, z: -180 } as const;

export type BuildingDamageStage = 'intact' | 'cracked' | 'heavy_damage' | 'collapsed';

export type DestructiblePropKind =
  | 'city_car'
  | 'city_bus'
  | 'street_lamp'
  | 'traffic_light'
  | 'bench'
  | 'water_tower'
  | 'construction_crate'
  | 'street_barrier'
  | 'newsstand'
  | 'billboard_frame';

export interface DestructibleBuilding {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  baseColorHex: number;
  glassColorHex: number;
  accentColorHex: number;
  hasSpire: boolean;
  hasWaterTower: boolean;
  hasBillboard: boolean;
  hp: number;
  maxHp: number;
  stage: BuildingDamageStage;
  collapseProgress: number; // 0..1 visual tilt & drop
  shakenTimer: number;
  tierDestroyed: [boolean, boolean, boolean]; // lower, mid, upper/roof
}

export interface DestructibleProp {
  id: string;
  kind: DestructiblePropKind;
  x: number;
  y: number;
  z: number;
  rotY: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  rz: number;
  colorHex: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  radius: number;
}

export interface DebrisChunk {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  vrz: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  colorHex: number;
  age: number;
  maxAge: number;
  isGlass: boolean;
}

export interface ImpactDustCloud {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  maxRadius: number;
  age: number;
  maxAge: number;
  colorHex: number;
}

export interface TrafficVehicle {
  id: string;
  axis: 'x' | 'z';
  lanePos: number;
  coord: number;
  dir: 1 | -1;
  speed: number;
  colorHex: number;
  isTaxi: boolean;
}

export interface WebSwingState {
  active: boolean;
  anchorX: number;
  anchorY: number;
  anchorZ: number;
  ropeLength: number;
  vx: number;
  vy: number;
  vz: number;
  swingTime: number;
  handSide: 1 | -1;
}

export interface MetroDestructionState {
  buildings: DestructibleBuilding[];
  props: DestructibleProp[];
  debris: DebrisChunk[];
  dustClouds: ImpactDustCloud[];
  traffic: TrafficVehicle[];
  nextDebrisId: number;
  totalDestructionScore: number;
  destroyedBuildingsCount: number;
  destroyedPropsCount: number;
  rngState: number;
}

export const MAX_DEBRIS_CHUNKS = 140;
export const MAX_DUST_CLOUDS = 28;

function nextRand(state: MetroDestructionState): number {
  state.rngState = (state.rngState * 1664525 + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

export function isInsideMetroCity(x: number, z: number, margin = 0): boolean {
  return (
    Math.abs(x - METRO_CITY_CENTER.x) <= METRO_CITY_HALF_SIZE + margin &&
    Math.abs(z - METRO_CITY_CENTER.z) <= METRO_CITY_HALF_SIZE + margin
  );
}

/**
 * Smoothly flattens the Metro City Manhattan grid plateau to y = 0.0m with a clean graded ramp border.
 */
export function applyMetroCityTerrainHeight(x: number, z: number, baseH: number): number {
  const dx = Math.abs(x - METRO_CITY_CENTER.x);
  const dz = Math.abs(z - METRO_CITY_CENTER.z);
  const maxD = Math.max(dx, dz);
  if (maxD > METRO_CITY_HALF_SIZE + 26) return baseH;
  if (maxD <= METRO_CITY_HALF_SIZE) return 0.0;
  const t = (maxD - METRO_CITY_HALF_SIZE) / 26;
  const smooth = t * t * (3 - 2 * t);
  return baseH * smooth;
}

export function createInitialWebSwingState(): WebSwingState {
  return {
    active: false,
    anchorX: 0,
    anchorY: 32,
    anchorZ: 0,
    ropeLength: 24,
    vx: 0,
    vy: 0,
    vz: 0,
    swingTime: 0,
    handSide: 1,
  };
}

interface TowerSeed {
  name: string;
  ox: number;
  oz: number;
  w: number;
  d: number;
  h: number;
  base: number;
  glass: number;
  accent: number;
  spire?: boolean;
  waterTower?: boolean;
  billboard?: boolean;
}

const TOWER_SEEDS: readonly TowerSeed[] = [
  // Central Midtown Skyline (tall iconic landmarks around Central Avenue & Fifth Plaza)
  { name: 'Empire Spire Tower', ox: -28, oz: -28, w: 18, d: 18, h: 72, base: 0x3b4454, glass: 0x67b8e3, accent: 0xf59e0b, spire: true, billboard: true },
  { name: 'Stark-Style Aero Plaza', ox: 28, oz: -30, w: 20, d: 18, h: 68, base: 0x2a3346, glass: 0x38bdf8, accent: 0x60a5fa, spire: true, billboard: true },
  { name: 'Oscorp Glass Citadels', ox: -28, oz: 26, w: 17, d: 17, h: 58, base: 0x2d4042, glass: 0x34d399, accent: 0x10b981, spire: true },
  { name: 'Daily Bugle Press HQ', ox: 28, oz: 26, w: 18, d: 16, h: 52, base: 0x5c4338, glass: 0x93c5fd, accent: 0xef4444, waterTower: true, billboard: true },
  // Western Financial & Brownstone Blocks
  { name: 'Liberty Exchange Tower', ox: -62, oz: -56, w: 17, d: 17, h: 60, base: 0x334155, glass: 0x7dd3fc, accent: 0xfbbf24, spire: true },
  { name: 'Hudson Residential Block', ox: -62, oz: -18, w: 16, d: 18, h: 36, base: 0x6e473b, glass: 0xbae6fd, accent: 0xfb923c, waterTower: true },
  { name: 'Midtown Brick Lofts', ox: -62, oz: 20, w: 16, d: 16, h: 32, base: 0x784c3d, glass: 0xcbd5e1, accent: 0xf59e0b, waterTower: true },
  { name: 'Chelsea Corner Suites', ox: -62, oz: 56, w: 16, d: 15, h: 28, base: 0x475569, glass: 0x93c5fd, accent: 0x38bdf8, waterTower: true },
  // Northern Uptown High-Rises
  { name: 'Grand Crown Spire', ox: -26, oz: -64, w: 18, d: 16, h: 64, base: 0x3f4c5e, glass: 0x60a5fa, accent: 0xfde047, spire: true },
  { name: 'Skyline Commerce Center', ox: 26, oz: -64, w: 18, d: 16, h: 56, base: 0x334155, glass: 0x7dd3fc, accent: 0xf43f5e, billboard: true },
  { name: 'East River Apex', ox: 62, oz: -58, w: 17, d: 17, h: 54, base: 0x293548, glass: 0x38bdf8, accent: 0x22d3ee, spire: true },
  // Eastern Avenue & Commercial District
  { name: 'Times Neon Arcade', ox: 62, oz: -20, w: 17, d: 18, h: 44, base: 0x3b3554, glass: 0xa5b4fc, accent: 0xe879f9, billboard: true },
  { name: 'Lexington Steel Tower', ox: 62, oz: 18, w: 16, d: 16, h: 48, base: 0x475569, glass: 0x7dd3fc, accent: 0xf59e0b, waterTower: true },
  { name: 'Harbour View Apartments', ox: 62, oz: 56, w: 16, d: 16, h: 30, base: 0x6b4b3e, glass: 0xbfdbfe, accent: 0xfbbf24, waterTower: true },
  // Southern Gateway Towers (framing entry from Dreamline Valley)
  { name: 'Metro South Gateway West', ox: -28, oz: 62, w: 16, d: 15, h: 42, base: 0x3c4859, glass: 0x7dd3fc, accent: 0x38bdf8, billboard: true },
  { name: 'Metro South Gateway East', ox: 28, oz: 62, w: 16, d: 15, h: 40, base: 0x4c4452, glass: 0x93c5fd, accent: 0xf97316, waterTower: true },
  // Inner Park-Side Construction & Boutique Towers
  { name: 'Broadway Glass Pavilion', ox: -28, oz: -2, w: 14, d: 14, h: 34, base: 0x334155, glass: 0x67e8f9, accent: 0x2dd4bf },
  { name: 'Fifth Avenue Observatory', ox: 28, oz: -2, w: 14, d: 14, h: 38, base: 0x44403c, glass: 0x93c5fd, accent: 0xfacc15, waterTower: true },
];

export function createInitialMetroDestructionState(): MetroDestructionState {
  const cx = METRO_CITY_CENTER.x;
  const cz = METRO_CITY_CENTER.z;

  const buildings: DestructibleBuilding[] = TOWER_SEEDS.map((t, idx) => {
    const maxHp = Math.round(110 + t.h * 1.6);
    return {
      id: `metro_bldg_${idx}`,
      name: t.name,
      x: cx + t.ox,
      z: cz + t.oz,
      width: t.w,
      depth: t.d,
      height: t.h,
      baseColorHex: t.base,
      glassColorHex: t.glass,
      accentColorHex: t.accent,
      hasSpire: Boolean(t.spire),
      hasWaterTower: Boolean(t.waterTower),
      hasBillboard: Boolean(t.billboard),
      hp: maxHp,
      maxHp,
      stage: 'intact',
      collapseProgress: 0,
      shakenTimer: 0,
      tierDestroyed: [false, false, false],
    };
  });

  const props: DestructibleProp[] = [];
  let propIdx = 0;
  const pushProp = (
    kind: DestructiblePropKind,
    ox: number,
    oz: number,
    rotY: number,
    colorHex: number,
    maxHp: number,
    radius: number,
    y = 0
  ) => {
    props.push({
      id: `metro_prop_${propIdx++}`,
      kind,
      x: cx + ox,
      y,
      z: cz + oz,
      rotY,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      rz: 0,
      colorHex,
      hp: maxHp,
      maxHp,
      destroyed: false,
      radius,
    });
  };

  // Street lamps along Central Avenue (x = cx +/- 9) and Cross Street (z = cz +/- 9)
  for (let zOff = -66; zOff <= 66; zOff += 22) {
    pushProp('street_lamp', -10.5, zOff, 0, 0x334155, 22, 0.7);
    pushProp('street_lamp', 10.5, zOff, Math.PI, 0x334155, 22, 0.7);
  }
  // Traffic lights at main Manhattan intersections
  for (const [ix, iz] of [
    [-11, -44],
    [11, -44],
    [-11, 12],
    [11, 12],
    [-11, 46],
    [11, 46],
  ]) {
    pushProp('traffic_light', ix, iz, 0, 0x1e293b, 28, 0.8);
  }
  // Parked NYC Yellow Taxis, Sedans, & City Buses
  const carSpots: Array<[number, number, number, number, boolean]> = [
    [-7.5, 36, 0, 0xfacc15, false],
    [7.5, 22, Math.PI, 0xef4444, false],
    [-7.5, -14, 0, 0xfacc15, false],
    [7.5, -38, Math.PI, 0x3b82f6, false],
    [-44, -8, Math.PI * 0.5, 0xfacc15, false],
    [44, 8, -Math.PI * 0.5, 0x10b981, false],
    [-7.5, -54, 0, 0x2563eb, true], // City bus
    [44, -44, -Math.PI * 0.5, 0x0284c7, true], // City bus
  ];
  for (const [ox, oz, rotY, col, isBus] of carSpots) {
    pushProp(
      isBus ? 'city_bus' : 'city_car',
      ox,
      oz,
      rotY,
      col,
      isBus ? 65 : 42,
      isBus ? 2.6 : 1.7
    );
  }
  // Central Plaza park benches, newsstands, street barriers & construction crates
  for (const [ox, oz, rot] of [
    [-6, -4, 0],
    [6, -4, Math.PI],
    [-6, 6, 0],
    [6, 6, Math.PI],
  ]) {
    pushProp('bench', ox, oz, rot, 0x92400e, 18, 1.0);
  }
  for (const [ox, oz] of [
    [-14, 42],
    [14, 42],
    [-42, 42],
    [42, 42],
    [-14, -42],
    [14, -42],
  ]) {
    pushProp('street_barrier', ox, oz, 0, 0xf97316, 20, 1.1);
  }
  for (const [ox, oz] of [
    [-15, 28],
    [15, -16],
    [-46, 6],
    [46, -24],
    [15, 52],
    [-15, -52],
  ]) {
    pushProp('construction_crate', ox, oz, 0.2, 0xd97706, 26, 1.2);
  }
  pushProp('newsstand', -14, 16, Math.PI * 0.5, 0x0f766e, 32, 1.4);
  pushProp('newsstand', 14, -26, -Math.PI * 0.5, 0x991b1b, 32, 1.4);

  // Rooftop water towers on key mid-rise buildings
  for (const b of buildings) {
    if (b.hasWaterTower) {
      pushProp(
        'water_tower',
        b.x - cx,
        b.z - cz,
        0,
        0x854d0e,
        34,
        2.0,
        b.height
      );
    }
  }

  // Moving avenue traffic
  const traffic: TrafficVehicle[] = [
    { id: 'traf_0', axis: 'z', lanePos: cx - 3.6, coord: cz - 60, dir: 1, speed: 12.5, colorHex: 0xfacc15, isTaxi: true },
    { id: 'traf_1', axis: 'z', lanePos: cx + 3.6, coord: cz + 55, dir: -1, speed: 14.0, colorHex: 0xe2e8f0, isTaxi: false },
    { id: 'traf_2', axis: 'z', lanePos: cx - 3.6, coord: cz + 15, dir: 1, speed: 11.2, colorHex: 0xef4444, isTaxi: false },
    { id: 'traf_3', axis: 'x', lanePos: cz - 44 + 3.0, coord: cx - 64, dir: 1, speed: 13.0, colorHex: 0xfacc15, isTaxi: true },
    { id: 'traf_4', axis: 'x', lanePos: cz + 44 - 3.0, coord: cx + 60, dir: -1, speed: 12.0, colorHex: 0x3b82f6, isTaxi: false },
    { id: 'traf_5', axis: 'x', lanePos: cz - 44 - 3.0, coord: cx + 22, dir: -1, speed: 13.5, colorHex: 0xfacc15, isTaxi: true },
  ];

  return {
    buildings,
    props,
    debris: [],
    dustClouds: [],
    traffic,
    nextDebrisId: 1,
    totalDestructionScore: 0,
    destroyedBuildingsCount: 0,
    destroyedPropsCount: 0,
    rngState: 20260719,
  };
}

export function getMetroBuildingColliders(state: MetroDestructionState): AabbCollider[] {
  const out: AabbCollider[] = [];
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.stage === 'collapsed') continue; // Collapsed rubble becomes traversable!
    out.push({
      id: b.id,
      minX: b.x - b.width * 0.5,
      maxX: b.x + b.width * 0.5,
      minZ: b.z - b.depth * 0.5,
      maxZ: b.z + b.depth * 0.5,
      minY: 0,
      maxY: b.height,
    });
  }
  return out;
}

/**
 * Returns rooftop standing elevation if player stands on an intact/damaged skyscraper roof.
 */
export function getMetroRooftopHeightAt(
  state: MetroDestructionState,
  x: number,
  z: number,
  currentY: number
): number | null {
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.stage === 'collapsed') continue;
    const halfW = b.width * 0.5 + 0.3;
    const halfD = b.depth * 0.5 + 0.3;
    if (Math.abs(x - b.x) <= halfW && Math.abs(z - b.z) <= halfD) {
      if (currentY >= b.height - 2.6) {
        return b.height;
      }
    }
  }
  return null;
}

function spawnDebrisBurst(
  state: MetroDestructionState,
  x: number,
  y: number,
  z: number,
  count: number,
  impulse: number,
  baseColorHex: number,
  glassColorHex: number
): void {
  for (let i = 0; i < count; i++) {
    if (state.debris.length >= MAX_DEBRIS_CHUNKS) {
      state.debris.shift();
    }
    const ang = nextRand(state) * Math.PI * 2;
    const spd = impulse * (0.35 + nextRand(state) * 0.85);
    const isGlass = nextRand(state) < 0.38;
    state.debris.push({
      id: state.nextDebrisId++,
      x: x + (nextRand(state) - 0.5) * 3.4,
      y: Math.max(0.6, y + (nextRand(state) - 0.3) * 3.2),
      z: z + (nextRand(state) - 0.5) * 3.4,
      vx: Math.cos(ang) * spd,
      vy: 4.5 + nextRand(state) * (impulse * 0.65),
      vz: Math.sin(ang) * spd,
      rx: nextRand(state) * Math.PI,
      ry: nextRand(state) * Math.PI,
      rz: nextRand(state) * Math.PI,
      vrx: (nextRand(state) - 0.5) * 11,
      vry: (nextRand(state) - 0.5) * 11,
      vrz: (nextRand(state) - 0.5) * 11,
      scaleX: isGlass ? 0.45 + nextRand(state) * 0.6 : 0.65 + nextRand(state) * 1.15,
      scaleY: isGlass ? 0.14 : 0.55 + nextRand(state) * 0.95,
      scaleZ: isGlass ? 0.45 + nextRand(state) * 0.6 : 0.65 + nextRand(state) * 1.15,
      colorHex: isGlass ? glassColorHex : baseColorHex,
      age: 0,
      maxAge: 6.0 + nextRand(state) * 4.5,
      isGlass,
    });
  }

  if (state.dustClouds.length >= MAX_DUST_CLOUDS) {
    state.dustClouds.shift();
  }
  state.dustClouds.push({
    id: state.nextDebrisId++,
    x,
    y: Math.max(0.8, y),
    z,
    radius: 1.4,
    maxRadius: 5.5 + Math.min(9.5, impulse * 0.25),
    age: 0,
    maxAge: 2.2,
    colorHex: 0xcbd5e1,
  });
}

export interface DestructionImpactResult {
  buildingsHit: number;
  buildingsCollapsed: number;
  propsDestroyed: number;
  debrisSpawned: number;
}

/**
 * Applies a superhero or Batmobile physical impact wave to nearby buildings and street props,
 * advancing staged structural damage, triggering partial/full collapse, and spawning rigid-body debris.
 */
export function applyDestructionImpact(
  state: MetroDestructionState,
  impactX: number,
  impactY: number,
  impactZ: number,
  radius: number,
  damage: number,
  force: number
): DestructionImpactResult {
  let buildingsHit = 0;
  let buildingsCollapsed = 0;
  let propsDestroyed = 0;
  const debrisBefore = state.nextDebrisId;

  // 1. Check skyscrapers (edge distance to footprint AABB)
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.stage === 'collapsed') continue;
    const dx = Math.max(Math.abs(impactX - b.x) - b.width * 0.5, 0);
    const dz = Math.max(Math.abs(impactZ - b.z) - b.depth * 0.5, 0);
    const dist = Math.hypot(dx, dz);
    if (dist <= radius) {
      const falloff = Math.max(0.32, 1 - dist / (radius + 2));
      const applied = damage * falloff;
      b.hp = Math.max(0, b.hp - applied);
      b.shakenTimer = 0.55;
      buildingsHit++;

      const hpRatio = b.hp / b.maxHp;
      if (hpRatio <= 0) {
        b.stage = 'collapsed';
        b.tierDestroyed = [true, true, true];
        buildingsCollapsed++;
        state.destroyedBuildingsCount++;
        state.totalDestructionScore += 500;
        spawnDebrisBurst(
          state,
          b.x,
          Math.min(b.height * 0.55, Math.max(4, impactY + 6)),
          b.z,
          24,
          Math.max(14, force * 0.72),
          b.baseColorHex,
          b.glassColorHex
        );
      } else if (hpRatio <= 0.4) {
        b.stage = 'heavy_damage';
        b.tierDestroyed[2] = true;
        b.tierDestroyed[1] = true;
        state.totalDestructionScore += 120;
        spawnDebrisBurst(
          state,
          impactX * 0.55 + b.x * 0.45,
          Math.max(3, impactY + 4),
          impactZ * 0.55 + b.z * 0.45,
          14,
          Math.max(10, force * 0.55),
          b.baseColorHex,
          b.glassColorHex
        );
      } else if (hpRatio <= 0.78) {
        b.stage = 'cracked';
        b.tierDestroyed[0] = true;
        state.totalDestructionScore += 50;
        spawnDebrisBurst(
          state,
          impactX * 0.65 + b.x * 0.35,
          Math.max(2.2, impactY + 2),
          impactZ * 0.65 + b.z * 0.35,
          9,
          Math.max(8, force * 0.45),
          b.baseColorHex,
          b.glassColorHex
        );
      }
    }
  }

  // 2. Check destructible street props & vehicles
  for (let i = 0; i < state.props.length; i++) {
    const p = state.props[i];
    if (p.destroyed) continue;
    const dist = Math.hypot(impactX - p.x, impactZ - p.z);
    if (dist <= radius + p.radius) {
      const falloff = Math.max(0.4, 1 - dist / (radius + p.radius + 1.5));
      p.hp = Math.max(0, p.hp - damage * 1.25 * falloff);
      const pushDirX = dist > 0.05 ? (p.x - impactX) / dist : 1;
      const pushDirZ = dist > 0.05 ? (p.z - impactZ) / dist : 0;
      p.vx += pushDirX * force * 0.58 * falloff;
      p.vz += pushDirZ * force * 0.58 * falloff;
      p.vy += Math.min(14, force * 0.34 * falloff + 3.5);
      if (p.hp <= 0) {
        p.destroyed = true;
        propsDestroyed++;
        state.destroyedPropsCount++;
        state.totalDestructionScore += p.kind === 'city_bus' ? 180 : p.kind === 'city_car' ? 120 : 65;
        spawnDebrisBurst(
          state,
          p.x,
          Math.max(1.0, p.y + 1.1),
          p.z,
          8,
          Math.max(9, force * 0.48),
          p.colorHex,
          0xbae6fd
        );
      }
    }
  }

  return {
    buildingsHit,
    buildingsCollapsed,
    propsDestroyed,
    debrisSpawned: state.nextDebrisId - debrisBefore,
  };
}

/**
 * Steps rigid-body falling debris, impact dust clouds, building collapse tilt, knocked props, and city avenue traffic.
 */
export function stepMetroDestruction(state: MetroDestructionState, dt: number): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const gravity = 24.5;

  // 1. Animate collapsing/shaking buildings
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.shakenTimer > 0) {
      b.shakenTimer = Math.max(0, b.shakenTimer - safeDt);
    }
    if (b.stage === 'collapsed' && b.collapseProgress < 1) {
      b.collapseProgress = Math.min(1, b.collapseProgress + safeDt * 0.72);
    }
  }

  // 2. Physics for knocked props (cars, crates, lamps flying & tumbling)
  for (let i = 0; i < state.props.length; i++) {
    const p = state.props[i];
    if (Math.abs(p.vx) > 0.05 || Math.abs(p.vz) > 0.05 || p.vy !== 0 || p.y > 0.01) {
      p.vy -= gravity * safeDt;
      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
      p.z += p.vz * safeDt;
      p.rx += p.vz * safeDt * 0.15;
      p.rz -= p.vx * safeDt * 0.15;
      if (p.y <= 0) {
        p.y = 0;
        if (Math.abs(p.vy) > 2.8) {
          p.vy = -p.vy * 0.34;
        } else {
          p.vy = 0;
        }
        p.vx *= Math.max(0, 1 - safeDt * 5.2);
        p.vz *= Math.max(0, 1 - safeDt * 5.2);
      }
    }
  }

  // 3. Real-time rigid-body debris chunks with gravity & ground bounce
  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];
    d.age += safeDt;
    if (d.age >= d.maxAge) {
      state.debris.splice(i, 1);
      continue;
    }
    d.vy -= gravity * safeDt;
    d.x += d.vx * safeDt;
    d.y += d.vy * safeDt;
    d.z += d.vz * safeDt;
    d.rx += d.vrx * safeDt;
    d.ry += d.vry * safeDt;
    d.rz += d.vrz * safeDt;
    const minGroundY = d.scaleY * 0.5;
    if (d.y < minGroundY) {
      d.y = minGroundY;
      if (Math.abs(d.vy) > 2.4) {
        d.vy = -d.vy * 0.36;
        d.vx *= 0.72;
        d.vz *= 0.72;
        d.vrx *= 0.65;
        d.vry *= 0.65;
        d.vrz *= 0.65;
      } else {
        d.vy = 0;
        d.vx *= Math.max(0, 1 - safeDt * 6);
        d.vz *= Math.max(0, 1 - safeDt * 6);
        d.vrx *= 0.85;
        d.vry *= 0.85;
        d.vrz *= 0.85;
      }
    }
  }

  // 4. Expanding & dissipating dust/smoke puffs
  for (let i = state.dustClouds.length - 1; i >= 0; i--) {
    const c = state.dustClouds[i];
    c.age += safeDt;
    if (c.age >= c.maxAge) {
      state.dustClouds.splice(i, 1);
      continue;
    }
    const p = c.age / c.maxAge;
    c.radius = 1.4 + (c.maxRadius - 1.4) * (1 - (1 - p) * (1 - p));
    c.y += safeDt * 1.45;
  }

  // 5. Moving city traffic along Manhattan grid avenues
  const cx = METRO_CITY_CENTER.x;
  const cz = METRO_CITY_CENTER.z;
  for (let i = 0; i < state.traffic.length; i++) {
    const t = state.traffic[i];
    t.coord += t.dir * t.speed * safeDt;
    const center = t.axis === 'x' ? cx : cz;
    if (t.coord > center + 76) t.coord = center - 76;
    if (t.coord < center - 76) t.coord = center + 76;
  }
}

/**
 * Finds the best elevated skyscraper web-swing or grapple anchor ahead of the hero.
 * Falls back cleanly to a high aerial anchor when swinging outside Metro City.
 */
export function findBestWebOrGrappleAnchor(
  state: MetroDestructionState,
  px: number,
  py: number,
  pz: number,
  heading: number
): { x: number; y: number; z: number; buildingId: string | null } {
  const fwdX = Math.sin(heading);
  const fwdZ = Math.cos(heading);
  let bestScore = -Infinity;
  let bestAnchor: { x: number; y: number; z: number; buildingId: string | null } | null = null;

  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.stage === 'collapsed') continue;
    const dx = b.x - px;
    const dz = b.z - pz;
    const dist = Math.hypot(dx, dz);
    if (dist < 6 || dist > 58) continue;
    const dot = (dx * fwdX + dz * fwdZ) / dist;
    if (dot < 0.05) continue;
    const anchorY = Math.min(b.height - 1.2, Math.max(py + 14, b.height * 0.78));
    const score = dot * 32 - Math.abs(dist - 24) * 0.75 + anchorY * 0.25;
    if (score > bestScore) {
      bestScore = score;
      bestAnchor = {
        x: b.x - (dx / dist) * (b.width * 0.45),
        y: anchorY,
        z: b.z - (dz / dist) * (b.depth * 0.45),
        buildingId: b.id,
      };
    }
  }

  if (bestAnchor) return bestAnchor;

  // Scenic countryside / open-sky web-line anchor ahead & high above
  return {
    x: px + fwdX * 22,
    y: Math.max(py + 22, 26),
    z: pz + fwdZ * 22,
    buildingId: null,
  };
}

/**
 * Initiates a momentum-based pendulum web swing anchored to a skyscraper or elevated point.
 */
export function startWebSwing(
  state: MetroDestructionState,
  px: number,
  py: number,
  pz: number,
  heading: number,
  currentVx: number,
  currentVz: number,
  prevHandSide: 1 | -1
): WebSwingState {
  const anchor = findBestWebOrGrappleAnchor(state, px, py, pz, heading);
  const dist = Math.hypot(anchor.x - px, anchor.y - (py + 1.5), anchor.z - pz);
  const ropeLength = Math.max(10, Math.min(34, dist * 0.92));
  const fwdX = Math.sin(heading);
  const fwdZ = Math.cos(heading);
  const initSpeed = Math.max(13.5, Math.hypot(currentVx, currentVz) + 6.5);
  return {
    active: true,
    anchorX: anchor.x,
    anchorY: anchor.y,
    anchorZ: anchor.z,
    ropeLength,
    vx: fwdX * initSpeed,
    vy: Math.max(2.2, (anchor.y - py) * 0.14),
    vz: fwdZ * initSpeed,
    swingTime: 0,
    handSide: prevHandSide === 1 ? -1 : 1,
  };
}

/**
 * Advances real pendulum web-swinging physics (gravity + taut rope radial constraint + swing pump + air resistance).
 */
export function stepWebSwingPhysics(
  swing: WebSwingState,
  px: number,
  py: number,
  pz: number,
  forwardInput: number,
  rightInput: number,
  camYaw: number,
  boost: boolean,
  dt: number
): { x: number; y: number; z: number; swing: WebSwingState; heading: number; speed: number } {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.06);
  const gravity = 20.5;
  let vx = swing.vx;
  let vy = swing.vy - gravity * safeDt;
  let vz = swing.vz;

  // Forward pump & lateral carve during swing
  const fwdX = -Math.sin(camYaw);
  const fwdZ = -Math.cos(camYaw);
  const rightX = Math.cos(camYaw);
  const rightZ = -Math.sin(camYaw);

  const pumpAccel = (boost ? 24.0 : 15.5) * Math.max(0.25, forwardInput);
  vx += (fwdX * pumpAccel + rightX * rightInput * 11.0) * safeDt;
  vz += (fwdZ * pumpAccel + rightZ * rightInput * 11.0) * safeDt;

  // Air drag
  const drag = Math.max(0.94, 1 - 0.18 * safeDt);
  vx *= drag;
  vy *= drag;
  vz *= drag;

  let nx = px + vx * safeDt;
  let ny = py + vy * safeDt;
  let nz = pz + vz * safeDt;

  // Pendulum rope constraint: project back onto sphere of radius ropeLength around anchor
  const rx = nx - swing.anchorX;
  const ry = ny - swing.anchorY;
  const rz = nz - swing.anchorZ;
  const rDist = Math.max(0.001, Math.hypot(rx, ry, rz));
  if (rDist > swing.ropeLength) {
    const ux = rx / rDist;
    const uy = ry / rDist;
    const uz = rz / rDist;
    nx = swing.anchorX + ux * swing.ropeLength;
    ny = swing.anchorY + uy * swing.ropeLength;
    nz = swing.anchorZ + uz * swing.ropeLength;

    // Remove outward radial velocity so energy converts cleanly into tangential swing arc!
    const radialVel = vx * ux + vy * uy + vz * uz;
    if (radialVel > 0) {
      vx -= radialVel * ux;
      vy -= radialVel * uy;
      vz -= radialVel * uz;
    }
  }

  // Keep cleanly above city streets during low swing swoops
  if (ny < 2.2) {
    ny = 2.2;
    if (vy < 0) vy = Math.abs(vy) * 0.35 + 2.5;
  }

  // Clamp top swing speed so movement stays exhilarating yet controllable
  const totalSpd = Math.hypot(vx, vy, vz);
  const maxSpd = boost ? 38.0 : 28.5;
  if (totalSpd > maxSpd) {
    const s = maxSpd / totalSpd;
    vx *= s;
    vy *= s;
    vz *= s;
  }

  const horizSpd = Math.hypot(vx, vz);
  const heading = horizSpd > 0.4 ? Math.atan2(vx, vz) : Math.atan2(fwdX, fwdZ);

  return {
    x: nx,
    y: ny,
    z: nz,
    heading,
    speed: horizSpd,
    swing: {
      ...swing,
      vx,
      vy,
      vz,
      swingTime: swing.swingTime + safeDt,
    },
  };
}
