import type { WeatherType } from './types';
import {
  DINOSAUR_ARENA_CENTER,
  DINOSAUR_ARENA_HALF_SIZE,
  DINOSAUR_ISLAND_CENTER,
} from './dinosaurIsland';
import {
  distanceToRail,
  ENCHANTED_FOREST_CENTER,
  groundHeightAt,
  HOME_CENTER,
  isWaterAt,
  MAIN_STATION_CENTER,
  VILLAGE_CENTER,
  WATERFALL_CENTER,
} from './terrain';
import { normalizeHours } from './timeWeather';

export interface ForestedZone {
  id: string;
  name: string;
  cx: number;
  cz: number;
  radius: number;
  innerRadius?: number;
  weight: number;
}

export interface FireflySeed {
  zoneId: string;
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  wanderRadiusX: number;
  wanderRadiusY: number;
  size: number;
  blinkRate: number;
  warmth: number; // 0 = chartreuse-lime, 1 = honey-amber gold
}

/**
 * All forested / wooded regions in DREAMLINE where fireflies naturally gather
 * during twilight and night hours when the sky is clear.
 */
export const FORESTED_ZONES: readonly ForestedZone[] = [
  {
    id: 'mayavanam_enchanted_forest',
    name: 'Mayavanam Enchanted Forest',
    cx: ENCHANTED_FOREST_CENTER.x,
    cz: ENCHANTED_FOREST_CENTER.z,
    radius: 34,
    weight: 0.3,
  },
  {
    id: 'poongavanam_blossom_woods',
    name: 'Poongavanam Blossom Woods',
    cx: -24,
    cz: 58,
    radius: 35,
    weight: 0.18,
  },
  {
    id: 'pachai_vayal_waterfall_grove',
    name: 'Pachai Vayal Waterfall Grove',
    cx: WATERFALL_CENTER.x + 8,
    cz: WATERFALL_CENTER.z - 14,
    radius: 36,
    weight: 0.18,
  },
  {
    id: 'neelam_lakeside_woods',
    name: 'Neelam Lakeside & Thendral Woods',
    cx: 12,
    cz: -46,
    radius: 34,
    weight: 0.16,
  },
  {
    id: 'malaiyur_foothill_woods',
    name: 'Malaiyur Foothill Woods',
    cx: -48,
    cz: -24,
    radius: 26,
    weight: 0.1,
  },
  {
    id: 'dinosaur_island_jungle',
    name: 'Jurassic Park · SSJ Dinosaur Island Jungle & Wildlife Valley',
    cx: DINOSAUR_ISLAND_CENTER.x,
    cz: DINOSAUR_ISLAND_CENTER.z,
    innerRadius: 34.0,
    radius: 108.0,
    weight: 0.08,
  },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fireflies only emerge when the weather is clear ('clear').
 * Rain, storms, fog, clouds, snow, breeze, floods, and tsunamis keep them sheltered.
 */
export function isClearWeatherForFireflies(weather: WeatherType): boolean {
  return weather === 'clear';
}

/**
 * Smooth twilight & night activity envelope in [0, 1].
 * - Daytime (05:30 – 17:15): 0 (morning, afternoon, golden hour)
 * - Dusk / Twilight ramp (17:15 – 19:15): smoothly blooms from 0 → 1
 * - Night (19:15 – 04:20): full 1.0 bioluminescent glow
 * - Pre-dawn twilight fade (04:20 – 05:30): smoothly fades 1 → 0
 */
export function computeFireflyTimeFactor(hours: number): number {
  const h = normalizeHours(hours);
  if (h >= 19.15 || h < 4.2) {
    return 1.0;
  }
  if (h >= 17.15 && h < 19.15) {
    return smoothstep(17.15, 19.15, h);
  }
  if (h >= 4.2 && h < 5.5) {
    return 1.0 - smoothstep(4.2, 5.5, h);
  }
  return 0.0;
}

/**
 * Combined firefly visibility multiplier in [0, 1] accounting for both
 * twilight/night hours AND clear weather.
 */
export function computeFireflyVisibility(hours: number, weather: WeatherType): number {
  if (!isClearWeatherForFireflies(weather)) {
    return 0.0;
  }
  return computeFireflyTimeFactor(hours);
}

/**
 * Checks whether a world coordinate (x, z) lies within any of DREAMLINE's forested zones.
 */
export function isInForestedRegion(x: number, z: number): boolean {
  for (let i = 0; i < FORESTED_ZONES.length; i++) {
    const zone = FORESTED_ZONES[i];
    const d = Math.hypot(x - zone.cx, z - zone.cz);
    if (d <= zone.radius && (zone.innerRadius === undefined || d >= zone.innerRadius)) {
      return true;
    }
  }
  return false;
}

function isValidFireflyAnchor(x: number, z: number, zone: ForestedZone): boolean {
  if (isWaterAt(x, z)) return false;
  if (distanceToRail(x, z) < 3.4) return false;
  // Keep out of En Illam house interior footprint
  if (Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z) < 10.5) return false;
  // Keep out of main station concrete platform
  if (Math.hypot(x - MAIN_STATION_CENTER.x, z - MAIN_STATION_CENTER.z) < 12.5) return false;
  // Keep out of dense Nila Gramam village building footprints
  if (Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z) < 10.0) return false;
  // Keep out of Panimalai high-altitude glacier snowfield
  if (x < -56 && z < -36) return false;
  // Keep Jurassic Park fireflies outside the Grand Rotunda Visitor Center footprint
  if (zone.id === 'dinosaur_island_jungle') {
    if (
      Math.hypot(x - (DINOSAUR_ARENA_CENTER.x - 4), z - (DINOSAUR_ARENA_CENTER.z - 12)) <
      Math.min(26, DINOSAUR_ARENA_HALF_SIZE)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Deterministically generates anchored firefly seeds across all forested regions.
 */
export function generateFireflySeeds(count = 720, seed = 20261120): FireflySeed[] {
  const rand = mulberry32(seed);
  const seeds: FireflySeed[] = [];

  // Allocate counts proportionally to zone weights, ensuring exact total
  const counts = FORESTED_ZONES.map((z) => Math.max(16, Math.round(z.weight * count)));
  const sum = counts.reduce((a, b) => a + b, 0);
  counts[0] += count - sum;

  for (let zi = 0; zi < FORESTED_ZONES.length; zi++) {
    const zone = FORESTED_ZONES[zi];
    const target = counts[zi];
    const minR = zone.innerRadius ?? 1.5;
    const maxR = zone.radius;
    let placed = 0;
    let attempts = 0;
    const maxAttempts = target * 18;

    while (placed < target && attempts < maxAttempts) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      // Gentle grove-focused distribution so woodland clearings shimmer with fireflies while carpeting the full radius
      const radialT = Math.pow(rand(), 0.72);
      const r = minR + radialT * (maxR - minR);
      const x = zone.cx + Math.cos(angle) * r;
      const z = zone.cz + Math.sin(angle) * r;

      if (!isValidFireflyAnchor(x, z, zone)) continue;

      const groundY = groundHeightAt(x, z);
      const altitude = 0.65 + Math.pow(rand(), 0.85) * 3.85;

      seeds.push({
        zoneId: zone.id,
        x,
        y: groundY + altitude,
        z,
        phase: rand() * Math.PI * 2,
        speed: 0.34 + rand() * 0.56,
        wanderRadiusX: 0.75 + rand() * 1.85,
        wanderRadiusY: 0.28 + rand() * 0.82,
        size: 0.9 + rand() * 0.95,
        blinkRate: 0.55 + rand() * 0.85,
        warmth: rand(),
      });
      placed++;
    }
  }

  return seeds;
}

export interface FireflyKinematics {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Authentic Photinus flash intensity in [0, 1] (short warm pulse + dark resting interval) */
  flash: number;
  /** Rapid insect wingbeat angle in radians */
  wingAngle: number;
}

/**
 * Evaluates a real 3D firefly's organic flight position, velocity tangent (for orienting the
 * beetle body), wingbeat oscillation, and authentic Photinus bioluminescent flash envelope.
 */
export function evaluateFireflyKinematics(
  seed: FireflySeed,
  elapsed: number
): FireflyKinematics {
  const w = seed.speed;
  const p = seed.phase;
  const t = elapsed * w + p;

  const rx = seed.wanderRadiusX;
  const ry = seed.wanderRadiusY;

  const x =
    seed.x +
    Math.sin(t * 1.07 + p * 1.3) * rx +
    Math.cos(t * 0.43 + p * 0.5) * rx * 0.35;
  const z =
    seed.z +
    Math.cos(t * 0.89 + p * 0.7) * rx +
    Math.sin(t * 0.51 + p * 1.1) * rx * 0.35;
  const y =
    seed.y +
    Math.sin(t * 1.31 + p * 2.1) * ry +
    Math.cos(t * 0.62 + p * 0.4) * ry * 0.28;

  // Analytical time derivatives for smooth 3D insect heading & banking
  const vx =
    (Math.cos(t * 1.07 + p * 1.3) * 1.07 * rx -
      Math.sin(t * 0.43 + p * 0.5) * 0.43 * rx * 0.35) *
    w;
  const vz =
    (-Math.sin(t * 0.89 + p * 0.7) * 0.89 * rx +
      Math.cos(t * 0.51 + p * 1.1) * 0.51 * rx * 0.35) *
    w;
  const vy =
    (Math.cos(t * 1.31 + p * 2.1) * 1.31 * ry -
      Math.sin(t * 0.62 + p * 0.4) * 0.62 * ry * 0.28) *
    w;

  // Real Photinus firefly flash: quick organic brighten (~0.65s), brief hold, then quiet dark pause (~2.2s)
  const cyclePeriod = 2.6 + (1.4 - Math.min(1.3, seed.blinkRate)) * 1.4;
  const phaseNorm = (((elapsed + p * 3.17) % cyclePeriod) + cyclePeriod) % cyclePeriod / cyclePeriod;
  let flash = 0.04;
  if (phaseNorm < 0.09) {
    const u = phaseNorm / 0.09;
    flash = 0.04 + 0.96 * (u * u * (3 - 2 * u));
  } else if (phaseNorm < 0.22) {
    flash = 0.92 + 0.08 * Math.sin((phaseNorm - 0.09) * 48.0);
  } else if (phaseNorm < 0.38) {
    const u = (phaseNorm - 0.22) / 0.16;
    flash = 0.04 + 0.96 * Math.pow(1 - u, 2.2);
  }

  // Rapid delicate wingbeat (~16-22 Hz visual flutter)
  const wingAngle = Math.sin(elapsed * (34.0 + (seed.size - 0.9) * 14.0) + p * 19.0) * 0.72;

  return { x, y, z, vx, vy, vz, flash, wingAngle };
}

