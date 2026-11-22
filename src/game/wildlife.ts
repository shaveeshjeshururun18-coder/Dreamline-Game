import {
  CAMPSITE_CENTER,
  distanceToRail,
  ENCHANTED_FOREST_CENTER,
  groundHeightAt,
  HILL_CENTER,
  HOME_CENTER,
  isWaterAt,
  LAKE_CENTER,
  MAIN_STATION_CENTER,
  VILLAGE_CENTER,
  WATER_LEVEL,
} from './terrain';
import { getWeatherProfile } from './extremeWeather';
import { EXHIBITION_ISLAND_CENTER, isInsideExhibitionCampusClearing } from './exhibitionComplex';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from './midnightFrontier';
import type { SeasonType, WeatherType } from './types';

export type BirdSpecies = 'swallow' | 'egret' | 'finch' | 'gull';
export type ButterflyPalette = 'monarch' | 'sakura' | 'swallowtail' | 'morpho' | 'lavender';
export type GrassAnimalSpecies = 'rabbit' | 'squirrel';
export type GrassAnimalBehavior = 'grazing' | 'alert' | 'hopping' | 'shy_hop';

export interface BirdSeed {
  id: number;
  species: BirdSpecies;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  baseAltitude: number;
  angularSpeed: number;
  phase: number;
  wingSpanScale: number;
  flapSpeed: number;
  glidePhase: number;
  colorHex: number;
  wingColorHex: number;
}

export interface BirdPose {
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  roll: number;
  wingAngle: number;
  scale: number;
}

export interface ButterflySeed {
  id: number;
  palette: ButterflyPalette;
  homeX: number;
  homeZ: number;
  flowerX: number;
  flowerZ: number;
  orbitRadius: number;
  speed: number;
  phase: number;
  perchCycleDuration: number;
  scale: number;
  colorHex: number;
  accentHex: number;
}

export interface ButterflyPose {
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  wingAngle: number;
  perched: boolean;
  scale: number;
}

export interface GrassAnimalSeed {
  id: number;
  species: GrassAnimalSpecies;
  homeX: number;
  homeZ: number;
  roamRadius: number;
  scale: number;
  bodyColorHex: number;
  accentColorHex: number;
  phase: number;
}

export interface GrassAnimalState {
  id: number;
  species: GrassAnimalSpecies;
  homeX: number;
  homeZ: number;
  roamRadius: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  targetX: number;
  targetZ: number;
  behavior: GrassAnimalBehavior;
  stateTimer: number;
  hopPhase: number;
  hopHeight: number;
  earWiggle: number;
  tailWag: number;
  headBob: number;
  scale: number;
  bodyColorHex: number;
  accentColorHex: number;
  phase: number;
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
 * Birds soar calmly from dawn through golden evening (05:15–20:30) and shelter during severe storms.
 */
export function computeBirdActivity(timeHours: number, weather: WeatherType): number {
  const profile = getWeatherProfile(weather);
  if (profile.isExtremeStorm || weather === 'rain' || weather === 'heavy_rain') return 0;
  const h = ((timeHours % 24) + 24) % 24;
  if (h < 5.0 || h > 20.8) return 0;
  if (h < 6.0) return h - 5.0;
  if (h > 19.6) return Math.max(0, (20.8 - h) / 1.2);
  return weather === 'snow' ? 0.55 : 1.0;
}

/**
 * Butterflies flutter delicately around blossoms in Spring, Summer, and Autumn during calm daylight & sunset.
 */
export function computeButterflyActivity(
  timeHours: number,
  weather: WeatherType,
  season: SeasonType
): number {
  if (season === 'winter') return 0;
  const profile = getWeatherProfile(weather);
  if (profile.isRainy || weather === 'snow' || profile.isExtremeStorm) return 0;
  const h = ((timeHours % 24) + 24) % 24;
  if (h < 6.2 || h > 19.5) return 0;
  if (h < 7.2) return h - 6.2;
  if (h > 18.6) return Math.max(0, (19.5 - h) / 0.9);
  return 1.0;
}

/**
 * Small meadow animals graze peacefully during calm weather & gentle twilight; they shelter in severe storms/floods.
 */
export function computeGrassAnimalActivity(timeHours: number, weather: WeatherType): number {
  const profile = getWeatherProfile(weather);
  if (profile.isExtremeStorm || weather === 'heavy_rain') return 0;
  const h = ((timeHours % 24) + 24) % 24;
  // Rabbits & squirrels stay active from early morning through dusk/early evening, tucking into burrows late at night
  if (h >= 21.8 || h < 5.2) return 0;
  if (h < 6.0) return (h - 5.2) / 0.8;
  if (h > 20.8) return Math.max(0, (21.8 - h) / 1.0);
  return weather === 'rain' ? 0.4 : 1.0;
}

/**
 * Generates deterministic, biome-appropriate soaring bird flocks across the valley, lake, meadows, and sea.
 */
export function generateBirdSeeds(): BirdSeed[] {
  const rand = mulberry32(8842101);
  const seeds: BirdSeed[] = [];
  let id = 0;

  const flocks: Array<{
    species: BirdSpecies;
    count: number;
    cx: number;
    cz: number;
    rx: number;
    rz: number;
    altMin: number;
    altMax: number;
    speedMin: number;
    speedMax: number;
    scaleMin: number;
    scaleMax: number;
    bodyHex: number;
    wingHex: number;
  }> = [
    // Flock 1: Serene Valley Swallows soaring directly above Sakuragawa Station & Poongavanam Blossom Valley
    {
      species: 'swallow',
      count: 9,
      cx: -4,
      cz: 8,
      rx: 34,
      rz: 26,
      altMin: 11.5,
      altMax: 16.5,
      speedMin: 0.14,
      speedMax: 0.19,
      scaleMin: 0.85,
      scaleMax: 1.08,
      bodyHex: 0x3b4462,
      wingHex: 0x2a324d,
    },
    // Flock 2: Graceful White Egrets gliding over Neelam Lake & Lily Marsh
    {
      species: 'egret',
      count: 7,
      cx: LAKE_CENTER.x,
      cz: LAKE_CENTER.z,
      rx: 32,
      rz: 24,
      altMin: 9.5,
      altMax: 14.5,
      speedMin: 0.11,
      speedMax: 0.15,
      scaleMin: 1.12,
      scaleMax: 1.38,
      bodyHex: 0xf7f5f0,
      wingHex: 0xece8df,
    },
    // Flock 3: Warm Golden Meadow Finches circling gently over Pachai Vayal & Hilltop
    {
      species: 'finch',
      count: 7,
      cx: 12,
      cz: 66,
      rx: 38,
      rz: 26,
      altMin: 12.0,
      altMax: 18.0,
      speedMin: 0.15,
      speedMax: 0.21,
      scaleMin: 0.78,
      scaleMax: 0.98,
      bodyHex: 0xc98b55,
      wingHex: 0x8d5a34,
    },
    // Flock 4: Coastal Seagulls gliding over Kadalkarai Harbour & Lighthouse
    {
      species: 'gull',
      count: 6,
      cx: 116,
      cz: 52,
      rx: 30,
      rz: 26,
      altMin: 12.5,
      altMax: 18.5,
      speedMin: 0.12,
      speedMax: 0.16,
      scaleMin: 1.15,
      scaleMax: 1.36,
      bodyHex: 0xf4f6f9,
      wingHex: 0xcfd7e3,
    },
    // Flock 5: Ocean Terns circling peacefully above the Ocean Exhibition Complex & Marina
    {
      species: 'gull',
      count: 4,
      cx: EXHIBITION_ISLAND_CENTER.x + 12,
      cz: EXHIBITION_ISLAND_CENTER.z - 6,
      rx: 34,
      rz: 28,
      altMin: 15.5,
      altMax: 21.0,
      speedMin: 0.11,
      speedMax: 0.14,
      scaleMin: 1.1,
      scaleMax: 1.32,
      bodyHex: 0xf7f9fc,
      wingHex: 0xd5dfec,
    },
  ];

  for (const flock of flocks) {
    const baseDir = rand() > 0.5 ? 1 : -1;
    const flockPhaseOffset = rand() * Math.PI * 2;
    for (let i = 0; i < flock.count; i++) {
      // Gentle loose V / staggered flock spacing rather than chaotic scatter
      const phase = flockPhaseOffset + (i / flock.count) * Math.PI * 2 * 0.65 + (rand() - 0.5) * 0.28;
      seeds.push({
        id: id++,
        species: flock.species,
        centerX: flock.cx + (rand() - 0.5) * 8,
        centerZ: flock.cz + (rand() - 0.5) * 8,
        radiusX: flock.rx + (rand() - 0.5) * 9,
        radiusZ: flock.rz + (rand() - 0.5) * 8,
        baseAltitude: flock.altMin + rand() * (flock.altMax - flock.altMin),
        angularSpeed: (flock.speedMin + rand() * (flock.speedMax - flock.speedMin)) * baseDir,
        phase,
        wingSpanScale: flock.scaleMin + rand() * (flock.scaleMax - flock.scaleMin),
        flapSpeed: flock.species === 'egret' || flock.species === 'gull' ? 5.2 + rand() * 1.1 : 7.6 + rand() * 1.6,
        glidePhase: rand() * Math.PI * 2,
        colorHex: flock.bodyHex,
        wingColorHex: flock.wingHex,
      });
    }
  }

  return seeds;
}

/**
 * Evaluates a bird's smooth soaring trajectory, bank angle, pitch, and intermittent flap-and-glide wing angle.
 */
export function sampleBirdPose(seed: BirdSeed, elapsed: number): BirdPose {
  const theta = elapsed * seed.angularSpeed + seed.phase;
  const x = seed.centerX + Math.cos(theta) * seed.radiusX + Math.sin(theta * 2) * 3.2;
  const z = seed.centerZ + Math.sin(theta) * seed.radiusZ;

  // Analytical tangent for smooth forward heading
  const vx = (-Math.sin(theta) * seed.radiusX + Math.cos(theta * 2) * 6.4) * seed.angularSpeed;
  const vz = Math.cos(theta) * seed.radiusZ * seed.angularSpeed;
  const heading = Math.atan2(vx, vz);

  // Intermittent serene flap-and-glide cycle: 0 = soaring glide, 1 = active gentle wingbeats
  const glideWave = Math.sin(elapsed * 0.72 + seed.glidePhase);
  const flapEnvelope = glideWave > -0.1 ? Math.min(1, (glideWave + 0.1) / 0.45) : 0;

  const wingFlap = Math.sin(elapsed * seed.flapSpeed + seed.phase * 3.1);
  // Subtle dihedral angle (0.12 rad) when gliding, full graceful stroke when flapping
  const wingAngle = 0.12 * (1 - flapEnvelope) + wingFlap * 0.68 * flapEnvelope;

  const groundY = Math.max(WATER_LEVEL, groundHeightAt(x, z));
  const thermalLift = Math.sin(elapsed * 0.42 + seed.phase) * 1.8;
  const flapBob = wingFlap * -0.09 * flapEnvelope;
  const y = Math.max(groundY + 5.5, seed.baseAltitude + thermalLift + flapBob);

  const pitch = Math.cos(elapsed * 0.42 + seed.phase) * 0.08;
  // Gentle banking into the turn direction
  const roll = (seed.angularSpeed >= 0 ? -0.18 : 0.18) + Math.sin(theta * 2) * 0.06;

  return {
    x,
    y,
    z,
    heading,
    pitch,
    roll,
    wingAngle,
    scale: seed.wingSpanScale,
  };
}

const BUTTERFLY_PALETTES: Array<{ palette: ButterflyPalette; colorHex: number; accentHex: number }> = [
  { palette: 'monarch', colorHex: 0xf4a84b, accentHex: 0x3b2a1e },
  { palette: 'sakura', colorHex: 0xffc1d6, accentHex: 0xffeef4 },
  { palette: 'swallowtail', colorHex: 0xfae796, accentHex: 0x5c4f3b },
  { palette: 'morpho', colorHex: 0x89cff0, accentHex: 0x3b6796 },
  { palette: 'lavender', colorHex: 0xd5bdf8, accentHex: 0xf6eeff },
];

/**
 * Generates deterministic butterflies anchored around wildflower clusters near Sakuragawa Station,
 * En Illam garden, Neelam Lake shore, Nila Gramam, Pachai Vayal, and Mayavanam Forest.
 */
export function generateButterflySeeds(): ButterflySeed[] {
  const rand = mulberry32(4492713);
  const seeds: ButterflySeed[] = [];

  // Hand-curated scenic flower meadows where players naturally walk and enjoy peaceful scenery
  const flowerClusters: Array<{ x: number; z: number; count: number; spread: number }> = [
    // Right beside Sakuragawa Station sakura trees & wildflower verges (immediately visible!)
    { x: -12.5, z: 18.0, count: 6, spread: 4.5 },
    { x: 11.2, z: 20.5, count: 6, spread: 4.5 },
    { x: -7.5, z: 10.5, count: 4, spread: 3.8 },
    { x: 9.5, z: 10.8, count: 4, spread: 3.8 },
    // Sunny golden pampas meadow across the tracks in front of Sakuragawa Station
    { x: 5.5, z: 2.5, count: 4, spread: 3.5 },
    { x: -6.5, z: 3.0, count: 4, spread: 3.5 },
    // En Illam (My Home) blossom yard & garden path
    { x: HOME_CENTER.x + 8.5, z: HOME_CENTER.z + 6.5, count: 5, spread: 4.5 },
    { x: HOME_CENTER.x - 9.0, z: HOME_CENTER.z + 3.0, count: 4, spread: 4.0 },
    // Neelam Lake flower shore
    { x: LAKE_CENTER.x - 22, z: LAKE_CENTER.z + 18, count: 5, spread: 5.5 },
    // Nila Gramam village verge & sakura
    { x: VILLAGE_CENTER.x - 9, z: VILLAGE_CENTER.z + 3, count: 4, spread: 4.5 },
    // Pachai Vayal emerald wildflower meadow
    { x: 14, z: 68, count: 5, spread: 6.5 },
    // Mayavanam Enchanted Forest clearing
    { x: ENCHANTED_FOREST_CENTER.x + 6, z: ENCHANTED_FOREST_CENTER.z + 4, count: 5, spread: 5.5 },
  ];

  let id = 0;
  for (const cluster of flowerClusters) {
    for (let i = 0; i < cluster.count; i++) {
      let hx = cluster.x + (rand() - 0.5) * cluster.spread * 2;
      let hz = cluster.z + (rand() - 0.5) * cluster.spread * 2;
      if (isWaterAt(hx, hz) || distanceToRail(hx, hz) < 2.8) {
        hx = cluster.x;
        hz = cluster.z;
      }
      const pal = BUTTERFLY_PALETTES[id % BUTTERFLY_PALETTES.length];
      seeds.push({
        id: id++,
        palette: pal.palette,
        homeX: hx,
        homeZ: hz,
        flowerX: hx + (rand() - 0.5) * 1.4,
        flowerZ: hz + (rand() - 0.5) * 1.4,
        orbitRadius: 1.15 + rand() * 1.85,
        speed: 0.65 + rand() * 0.42,
        phase: rand() * Math.PI * 2,
        perchCycleDuration: 9.5 + rand() * 6.5,
        scale: 0.82 + rand() * 0.42,
        colorHex: pal.colorHex,
        accentHex: pal.accentHex,
      });
    }
  }

  return seeds;
}

/**
 * Evaluates a butterfly's delicate figure-8 flower flutter with periodic gentle perching on a bloom.
 */
export function sampleButterflyPose(seed: ButterflySeed, elapsed: number): ButterflyPose {
  const cyclePos = ((elapsed + seed.phase * 2.1) % seed.perchCycleDuration) / seed.perchCycleDuration;
  // 0..0.72: graceful fluttering around flowers; 0.72..0.82: descending; 0.82..0.94: perched; 0.94..1.0: lifting off
  let flightBlend = 1.0;
  if (cyclePos >= 0.72 && cyclePos < 0.82) {
    const t = (cyclePos - 0.72) / 0.1;
    flightBlend = 1 - t * t * (3 - 2 * t);
  } else if (cyclePos >= 0.82 && cyclePos < 0.94) {
    flightBlend = 0;
  } else if (cyclePos >= 0.94) {
    const t = (cyclePos - 0.94) / 0.06;
    flightBlend = t * t * (3 - 2 * t);
  }

  const t = elapsed * seed.speed + seed.phase;
  const fx = seed.homeX + Math.sin(t) * seed.orbitRadius;
  const fz = seed.homeZ + Math.sin(t * 2) * seed.orbitRadius * 0.58;

  const x = seed.flowerX + (fx - seed.flowerX) * flightBlend;
  const z = seed.flowerZ + (fz - seed.flowerZ) * flightBlend;

  const baseGroundY = groundHeightAt(x, z);
  const perchY = baseGroundY + 0.34;
  const hoverY = baseGroundY + 0.92 + Math.sin(elapsed * 2.9 + seed.phase) * 0.28 + Math.cos(t * 1.7) * 0.14;
  const y = perchY + (hoverY - perchY) * flightBlend;

  const vx = Math.cos(t) * seed.orbitRadius * seed.speed;
  const vz = Math.cos(t * 2) * seed.orbitRadius * 1.16 * seed.speed;
  const heading = Math.atan2(vx, vz);

  const perched = flightBlend < 0.08;
  // Expressive rapid flutter while airborne; soft serene wing-breathing while perched on a flower
  const flutterWing = Math.sin(elapsed * 14.5 + seed.phase * 7.0) * 0.95 + 0.18;
  const restWing = 0.24 + (Math.sin(elapsed * 2.2 + seed.phase) * 0.5 + 0.5) * 0.42;
  const wingAngle = restWing + (flutterWing - restWing) * flightBlend;

  return {
    x,
    y,
    z,
    heading,
    pitch: 0.14 * flightBlend,
    wingAngle,
    perched,
    scale: seed.scale,
  };
}

function isValidGrassAnimalSpot(x: number, z: number): boolean {
  const y = groundHeightAt(x, z);
  if (y < WATER_LEVEL + 0.28 || isWaterAt(x, z)) return false;
  if (distanceToRail(x, z) < 4.5) return false;
  if (Math.hypot(x - MAIN_STATION_CENTER.x, z - 16.0) < 11.5) return false;
  if (Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z) < 11.0) return false;
  if (Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z) < 13.0) return false;
  if (Math.hypot(x - CAMPSITE_CENTER.x, z - CAMPSITE_CENTER.z) < 8.5) return false;
  if (Math.hypot(x - MIDNIGHT_FRONTIER_PORTAL_POS.x, z - MIDNIGHT_FRONTIER_PORTAL_POS.z) < 42.0) return false;
  if (isInsideExhibitionCampusClearing(x, z)) return false;
  // Keep out of deep snow biome & open beach sand
  if (x < -56 && z < -38) return false;
  if (x > 82 && z > 18) return false;
  return true;
}

const RABBIT_PALETTES = [
  { body: 0xd8c8b4, accent: 0xfaf7f2 }, // Soft cream cottontail
  { body: 0xb99a7b, accent: 0xf5efe6 }, // Warm meadow fawn
  { body: 0xa49b95, accent: 0xf2f0ed }, // Misty silver-brown hare
  { body: 0xc9ae91, accent: 0xfbf8f3 }, // Honey beige bunny
];

const SQUIRREL_PALETTES = [
  { body: 0xa86438, accent: 0xd8a87c }, // Warm autumn russet
  { body: 0x8f5634, accent: 0xc99a72 }, // Chestnut woodland squirrel
  { body: 0x9b6b46, accent: 0xdfc19e }, // Cinnamon meadow squirrel
];

/**
 * Generates peaceful meadow rabbits and woodland squirrels nestled in grass clearings across DREAMLINE.
 */
export function generateGrassAnimalSeeds(): GrassAnimalSeed[] {
  const rand = mulberry32(6173925);
  const seeds: GrassAnimalSeed[] = [];

  // Curated scenic grassy meadows (starting right near Sakuragawa Station meadow & En Illam so players encounter them naturally)
  const anchors: Array<{ x: number; z: number; species: GrassAnimalSpecies; count: number; spread: number }> = [
    // Grassy meadows flanking Sakuragawa Station & sakura trees
    { x: -17.5, z: 13.5, species: 'rabbit', count: 3, spread: 4.5 },
    { x: 16.5, z: 14.5, species: 'rabbit', count: 3, spread: 4.5 },
    { x: -14.5, z: 24.5, species: 'squirrel', count: 2, spread: 4.0 },
    { x: 15.0, z: 25.0, species: 'squirrel', count: 2, spread: 4.0 },
    // En Illam grassy yard perimeter
    { x: HOME_CENTER.x - 13.5, z: HOME_CENTER.z + 6.0, species: 'rabbit', count: 2, spread: 4.5 },
    { x: HOME_CENTER.x + 14.0, z: HOME_CENTER.z - 4.0, species: 'squirrel', count: 2, spread: 4.0 },
    // Pachai Vayal clover fields (south meadow)
    { x: 8.0, z: 62.0, species: 'rabbit', count: 4, spread: 8.0 },
    { x: -16.0, z: 58.0, species: 'rabbit', count: 3, spread: 7.0 },
    // Hilltop Viewpoint grassy slope & Nila Gramam woodland edge
    { x: HILL_CENTER.x + 12.0, z: HILL_CENTER.z + 8.0, species: 'rabbit', count: 3, spread: 5.5 },
    { x: VILLAGE_CENTER.x + 18.0, z: VILLAGE_CENTER.z + 4.0, species: 'squirrel', count: 2, spread: 4.5 },
    // Mayavanam Enchanted Forest mossy meadow
    { x: ENCHANTED_FOREST_CENTER.x - 9.0, z: ENCHANTED_FOREST_CENTER.z + 8.0, species: 'squirrel', count: 2, spread: 5.0 },
  ];

  let id = 0;
  for (const anchor of anchors) {
    for (let i = 0; i < anchor.count; i++) {
      let px = anchor.x;
      let pz = anchor.z;
      for (let attempt = 0; attempt < 16; attempt++) {
        const cx = anchor.x + (rand() - 0.5) * anchor.spread * 2;
        const cz = anchor.z + (rand() - 0.5) * anchor.spread * 2;
        if (isValidGrassAnimalSpot(cx, cz)) {
          px = cx;
          pz = cz;
          break;
        }
      }
      if (!isValidGrassAnimalSpot(px, pz)) continue;

      const palette =
        anchor.species === 'rabbit'
          ? RABBIT_PALETTES[id % RABBIT_PALETTES.length]
          : SQUIRREL_PALETTES[id % SQUIRREL_PALETTES.length];

      seeds.push({
        id: id++,
        species: anchor.species,
        homeX: px,
        homeZ: pz,
        roamRadius: anchor.species === 'rabbit' ? 5.2 + rand() * 2.4 : 4.6 + rand() * 2.2,
        scale: anchor.species === 'rabbit' ? 0.88 + rand() * 0.28 : 0.84 + rand() * 0.24,
        bodyColorHex: palette.body,
        accentColorHex: palette.accent,
        phase: rand() * Math.PI * 2,
      });
    }
  }

  return seeds;
}

export function createInitialGrassAnimalStates(seeds: GrassAnimalSeed[]): GrassAnimalState[] {
  return seeds.map((s) => ({
    id: s.id,
    species: s.species,
    homeX: s.homeX,
    homeZ: s.homeZ,
    roamRadius: s.roamRadius,
    x: s.homeX,
    y: groundHeightAt(s.homeX, s.homeZ),
    z: s.homeZ,
    heading: s.phase,
    targetX: s.homeX,
    targetZ: s.homeZ,
    behavior: 'grazing',
    stateTimer: 1.5 + (s.id % 5) * 0.85,
    hopPhase: 0,
    hopHeight: 0,
    earWiggle: 0,
    tailWag: 0,
    headBob: 0,
    scale: s.scale,
    bodyColorHex: s.bodyColorHex,
    accentColorHex: s.accentColorHex,
    phase: s.phase,
  }));
}

/**
 * Advances a single small meadow animal in-place (zero allocations for smooth 60fps animation).
 * Cycles gently between grazing in the grass, looking around alertly, taking small unhurried hops,
 * and softly hopping a few meters deeper into the meadow if the player gets very close.
 */
export function stepGrassAnimal(
  animal: GrassAnimalState,
  dt: number,
  elapsed: number,
  playerX: number,
  playerZ: number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.12);
  const dxPlayer = animal.x - playerX;
  const dzPlayer = animal.z - playerZ;
  const distToPlayer = Math.hypot(dxPlayer, dzPlayer);

  // Subtle shy reaction only when player comes very close (< 4.2m) — calmly hops a few meters aside
  if (distToPlayer < 4.2 && animal.behavior !== 'shy_hop') {
    const awayAng =
      distToPlayer > 0.05 ? Math.atan2(dxPlayer, dzPlayer) : animal.phase;
    const fleeDist = 3.8;
    const candX = animal.x + Math.sin(awayAng) * fleeDist;
    const candZ = animal.z + Math.cos(awayAng) * fleeDist;
    // Clamp gently toward home meadow so critters never stray onto tracks or water
    const fromHomeX = candX - animal.homeX;
    const fromHomeZ = candZ - animal.homeZ;
    const fromHomeD = Math.hypot(fromHomeX, fromHomeZ);
    let tx = candX;
    let tz = candZ;
    if (fromHomeD > animal.roamRadius * 1.15 && fromHomeD > 0.01) {
      const k = (animal.roamRadius * 1.15) / fromHomeD;
      tx = animal.homeX + fromHomeX * k;
      tz = animal.homeZ + fromHomeZ * k;
    }
    if (isValidGrassAnimalSpot(tx, tz)) {
      animal.targetX = tx;
      animal.targetZ = tz;
      animal.behavior = 'shy_hop';
      animal.stateTimer = 2.4;
      animal.hopPhase = 0;
    }
  }

  animal.stateTimer -= safeDt;

  if (animal.behavior === 'grazing') {
    animal.hopHeight = 0;
    animal.headBob = Math.sin(elapsed * 3.8 + animal.phase) * 0.5 + 0.5;
    animal.earWiggle = Math.sin(elapsed * 2.1 + animal.phase * 1.7) * 0.14;
    animal.tailWag = Math.sin(elapsed * 4.2 + animal.phase) * 0.18;

    if (animal.stateTimer <= 0) {
      // Gently pause and perk ears, or pick a nearby patch of clover to hop toward
      const roll = Math.abs(Math.sin(elapsed * 1.37 + animal.id * 2.71));
      if (roll < 0.42) {
        animal.behavior = 'alert';
        animal.stateTimer = 1.6 + roll * 2.2;
      } else {
        const ang = elapsed * 0.9 + animal.id * 1.93;
        const r = animal.roamRadius * (0.35 + (roll - 0.42) * 1.1);
        const tx = animal.homeX + Math.cos(ang) * r;
        const tz = animal.homeZ + Math.sin(ang) * r;
        if (isValidGrassAnimalSpot(tx, tz)) {
          animal.targetX = tx;
          animal.targetZ = tz;
          animal.behavior = 'hopping';
          animal.stateTimer = 3.2;
          animal.hopPhase = 0;
        } else {
          animal.stateTimer = 2.2;
        }
      }
    }
  } else if (animal.behavior === 'alert') {
    animal.hopHeight = 0;
    animal.headBob = 0;
    animal.earWiggle = Math.sin(elapsed * 5.6 + animal.phase) * 0.24;
    animal.tailWag = Math.sin(elapsed * 6.0 + animal.phase) * 0.28;
    // Subtle curious glance
    animal.heading += Math.sin(elapsed * 1.9 + animal.phase) * safeDt * 0.45;

    if (animal.stateTimer <= 0) {
      animal.behavior = 'grazing';
      animal.stateTimer = 2.6 + (animal.id % 4) * 0.9;
    }
  } else {
    // 'hopping' or 'shy_hop'
    const dx = animal.targetX - animal.x;
    const dz = animal.targetZ - animal.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.22 || animal.stateTimer <= 0) {
      animal.behavior = 'grazing';
      animal.stateTimer = 2.8 + (animal.id % 5) * 0.8;
      animal.hopHeight = 0;
      animal.hopPhase = 0;
    } else {
      const speed =
        animal.behavior === 'shy_hop'
          ? animal.species === 'squirrel'
            ? 3.1
            : 2.5
          : animal.species === 'squirrel'
          ? 1.75
          : 1.35;

      const desiredHeading = Math.atan2(dx, dz);
      let diff = desiredHeading - animal.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      animal.heading += diff * Math.min(1, safeDt * 7.5);

      const hopFreq = animal.species === 'squirrel' ? 8.8 : 6.4;
      animal.hopPhase += safeDt * hopFreq;
      const hopArc = Math.abs(Math.sin(animal.hopPhase));
      const maxArc =
        animal.behavior === 'shy_hop'
          ? animal.species === 'squirrel'
            ? 0.24
            : 0.32
          : animal.species === 'squirrel'
          ? 0.16
          : 0.22;
      animal.hopHeight = hopArc * maxArc;

      // Forward surge happens strongest mid-hop
      const stepDist = Math.min(dist, speed * (0.55 + 0.65 * hopArc) * safeDt);
      const nextX = animal.x + (dx / dist) * stepDist;
      const nextZ = animal.z + (dz / dist) * stepDist;
      if (isValidGrassAnimalSpot(nextX, nextZ)) {
        animal.x = nextX;
        animal.z = nextZ;
      } else {
        animal.behavior = 'grazing';
        animal.stateTimer = 2.2;
        animal.hopHeight = 0;
      }
      animal.headBob = 0;
      animal.earWiggle = hopArc * 0.16;
      animal.tailWag = Math.sin(animal.hopPhase * 1.5) * 0.35;
    }
  }

  animal.y = groundHeightAt(animal.x, animal.z);
}
