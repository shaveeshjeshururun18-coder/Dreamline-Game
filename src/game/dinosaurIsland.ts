import type { AabbCollider } from './terrain';
import type {
  DinosaurIslandHudState,
  DinosaurTriangleTrackHudState,
  SafariCarState,
} from './types';

// Grand Jurassic Park · SSJ Dinosaur Island nestled offshore in the unified OceanLab ocean
// Balanced ~470m diameter (radius 235m — grand & spacious, NOT an oversized 1 km sprawl!)
// Meets the Ocean Railway Bridge & Jurassic Park Station headland at (346, 130) seamlessly!
export const DINOSAUR_ISLAND_CENTER = { x: 560, z: 195 } as const;
export const DINOSAUR_ISLAND_LAND_RADIUS = 235.0; // ~470m diameter grand prehistoric island
export const DINOSAUR_ISLAND_RADIUS = 245.0;

// Colossal 360° Jurassic Boundary Gate Wall & Automated Horizontal Upper Roof Doors
export const DINOSAUR_PERIMETER_WALL_RADIUS = 212.0;
export const DINOSAUR_PERIMETER_WALL_HEIGHT = 38.0;
export const DINOSAUR_ROOF_DOOR_Y = 40.0;

// Open prehistoric sanctuary center (zero interior containment cages!)
export const DINOSAUR_ARENA_CENTER = { x: 560, z: 195 } as const;
export const DINOSAUR_ARENA_HALF_SIZE = 74.0;

// WNW headland linking the Ocean Railway Bridge & Jurassic Park Railway Station seamlessly onto the island shore
export const DINOSAUR_STATION_APPROX = { x: 344, z: 128 } as const;
export const DINOSAUR_HEADLAND_CENTER = { x: 346, z: 130 } as const;

// Explorer arrival on the lush South Promenade (16m south of the South Grand Main Gate, inside 235m land!)
export const DINOSAUR_EXPLORER_SPAWN = { x: 560.0, z: 424.0 } as const;
export const SAFARI_CAR_SPAWN = { x: 572.0, z: 418.0, heading: Math.PI } as const;

// Marina Pier & Offshore Boat Berth (southern cove just outside the south promenade)
export const DINOSAUR_MARINA_PIER_BOUNDS = {
  minX: 534.5,
  maxX: 539.5,
  minZ: 430.0,
  maxZ: 448.0,
  deckY: 0.48,
} as const;

export const DINOSAUR_MARINA_BOAT_BERTH = {
  x: 530.0,
  z: 452.0,
  heading: -2.4,
  exitX: 537.0,
  exitZ: 439.0,
} as const;

// Island Rescue Helipad tucked into a lush south clearing just inside the South Grand Gate
export const DINOSAUR_ISLAND_HELIPAD_POS = {
  x: 526.0,
  z: 377.0,
  heading: 0.45,
} as const;

// Scenic Jurassic Crystal Lake (76m × 56m turquoise freshwater lake inside the jungle!)
export const DINOSAUR_CRYSTAL_LAKE_CENTER = { lx: 34, lz: -20 } as const;
export const DINOSAUR_CRYSTAL_LAKE_RX = 38.0;
export const DINOSAUR_CRYSTAL_LAKE_RZ = 28.0;
export const DINOSAUR_LAKE_WATER_Y = 0.85;

// Continuous Flowing Forest River longitudinal span (from northern volcanic waterfall cliff to southern ocean outflow)
export const DINOSAUR_RIVER_START_LZ = -170.0;
export const DINOSAUR_RIVER_END_LZ = 228.0;

// 4 Walkable Timber Bridges spanning the flowing forest river (aligned with Triangle Track North & SE crossings!)
export const DINOSAUR_RIVER_BRIDGE_LZS = [-84, 56, 128, 184] as const;

// Local island landmarks across Grand Jurassic Park Island (offsets from DINOSAUR_ISLAND_CENTER)
export const SSJ_ISLAND_LANDMARKS = {
  entranceArch: { lx: 0, lz: 212 }, // Colossal Swinging South Grand Entrance Gate built into the 360° Boundary Wall!
  hostelPlaza: { lx: -72, lz: 84 },
  glassPavilion: { lx: -94, lz: -74 },
  skeletonMuseum: { lx: 0, lz: 112 }, // Jurassic Park Rotunda Visitor Center & T-Rex Fossil Atrium along Grand Avenue
  researchLab: { lx: -24, lz: -124 },
  waterfallCliff: { lx: 44, lz: -176 }, // Towering 28m Northern Volcanic Waterfall Gorge feeding the River!
  crystalLake: { lx: 34, lz: -20 }, // Gleaming 76m × 56m Jurassic Crystal Lake
  helipad: { lx: -34, lz: 182 },
  wildlifeValley: { lx: -96, lz: -14 }, // Living 21-species Wildlife Sanctuary valley inside the island!
  trexValley: { lx: 96, lz: 64 },
} as const;

// =========================================================================
// 4 BIGGER MONUMENTAL SURROUNDING PERIMETER GATES (AUTO-OPEN WHEN ENTERING!)
// =========================================================================
export interface DinosaurPerimeterGateSpec {
  id: 'south_gate' | 'west_gate' | 'north_gate' | 'east_gate';
  name: string;
  signTitle: string;
  angle: number; // polar angle on the 360° perimeter wall (x = cos(a)*R, z = sin(a)*R)
  lx: number;
  lz: number;
  autoOpenRadius: number;
}

const RAIL_GATE_ANGLE = Math.atan2(
  DINOSAUR_HEADLAND_CENTER.z - DINOSAUR_ISLAND_CENTER.z,
  DINOSAUR_HEADLAND_CENTER.x - DINOSAUR_ISLAND_CENTER.x
);

export const DINOSAUR_PERIMETER_GATES: readonly DinosaurPerimeterGateSpec[] = [
  {
    id: 'south_gate',
    name: 'South Grand Main Gate',
    signTitle: 'JURASSIC PARK · GRAND GATE',
    angle: Math.PI * 0.5,
    lx: 0,
    lz: DINOSAUR_PERIMETER_WALL_RADIUS,
    autoOpenRadius: 48.0,
  },
  {
    id: 'west_gate',
    name: 'West Railway Arrival Gate',
    signTitle: 'JURASSIC PARK · RAILWAY GATE',
    angle: RAIL_GATE_ANGLE,
    lx: Math.cos(RAIL_GATE_ANGLE) * DINOSAUR_PERIMETER_WALL_RADIUS,
    lz: Math.sin(RAIL_GATE_ANGLE) * DINOSAUR_PERIMETER_WALL_RADIUS,
    autoOpenRadius: 48.0,
  },
  {
    id: 'north_gate',
    name: 'North Volcanic Falls Gate',
    signTitle: 'JURASSIC PARK · NORTH GATE',
    angle: -Math.PI * 0.5,
    lx: 0,
    lz: -DINOSAUR_PERIMETER_WALL_RADIUS,
    autoOpenRadius: 48.0,
  },
  {
    id: 'east_gate',
    name: 'East Jungle Lagoon Gate',
    signTitle: 'JURASSIC PARK · EAST GATE',
    angle: 0,
    lx: DINOSAUR_PERIMETER_WALL_RADIUS,
    lz: 0,
    autoOpenRadius: 48.0,
  },
] as const;

// =========================================================================
// GRAND TRIANGLE EXPLORER TRACK (3 VERTICES & 6 DISTINCT PLACES ALONG ROUTE)
// =========================================================================
export const DINOSAUR_TRIANGLE_VERTICES: readonly [
  { lx: number; lz: number },
  { lx: number; lz: number },
  { lx: number; lz: number },
] = [
  { lx: 0, lz: 158 }, // Vertex A: South Grand Gate & Visitor Rotunda Plaza
  { lx: -126, lz: -84 }, // Vertex B: Northwest Glass Pavilion & Railway Ridge
  { lx: 126, lz: -84 }, // Vertex C: Northeast Crystal Lake & Volcanic Falls Overlook
] as const;

export interface DinosaurTrianglePlaceSpec {
  id: string;
  order: number; // 1..6
  trackT: number; // 0..1 around the triangular loop
  name: string;
  shortName: string;
  subtitle: string;
  lx: number;
  lz: number;
  accentHex: string;
}

export const DINOSAUR_TRIANGLE_PLACES: readonly DinosaurTrianglePlaceSpec[] = [
  {
    id: 'tri_grand_gate',
    order: 1,
    trackT: 0.0,
    name: 'Grand Gate & Visitor Rotunda Plaza',
    shortName: 'Grand Gate',
    subtitle: 'Colossal swinging Jurassic gate, Rotunda Museum & T-Rex Fossil Atrium',
    lx: 0,
    lz: 158,
    accentHex: '#FACC15',
  },
  {
    id: 'tri_wildlife_valley',
    order: 2,
    trackT: 1 / 6,
    name: 'Hostel Resort & Wildlife Valley',
    shortName: 'Wildlife Valley',
    subtitle: 'Jungle resort terrace & 21-species living wildlife sanctuary meadow',
    lx: -63,
    lz: 37,
    accentHex: '#4ADE80',
  },
  {
    id: 'tri_glass_pavilion',
    order: 3,
    trackT: 2 / 6,
    name: 'Glass Pavilion & Railway Gate Ridge',
    shortName: 'Glass Pavilion',
    subtitle: 'Pan-tropical glass dome & West Ocean Railway Arrival Gate',
    lx: -126,
    lz: -84,
    accentHex: '#38BDF8',
  },
  {
    id: 'tri_volcanic_falls',
    order: 4,
    trackT: 3 / 6,
    name: 'Volcanic Waterfall Gorge & Genomic Lab',
    shortName: 'Volcanic Falls',
    subtitle: '28m northern volcanic waterfall cliff, research lab & timber bridge',
    lx: 0,
    lz: -84,
    accentHex: '#FB923C',
  },
  {
    id: 'tri_crystal_lake',
    order: 5,
    trackT: 4 / 6,
    name: 'Crystal Lake & Flowing River Overlook',
    shortName: 'Crystal Lake',
    subtitle: 'Turquoise freshwater Crystal Lake, flowing river & Spinosaurus cove',
    lx: 126,
    lz: -84,
    accentHex: '#2DD4BF',
  },
  {
    id: 'tri_trex_canyon',
    order: 6,
    trackT: 5 / 6,
    name: 'T-Rex Canyon & Raptor Ridge',
    shortName: 'T-Rex Canyon',
    subtitle: 'Roaming T-Rex territory, river bridge crossing & Velociraptor trail',
    lx: 63,
    lz: 37,
    accentHex: '#F59E0B',
  },
] as const;

/**
 * Samples a point in world coordinates along the closed Grand Triangle Track (t in [0, 1)).
 * Segment 0: South -> NW, Segment 1: NW -> NE, Segment 2: NE -> South.
 */
export function sampleDinosaurTriangleTrack(t: number): {
  x: number;
  z: number;
  lx: number;
  lz: number;
  tangentX: number;
  tangentZ: number;
  edgeIndex: 0 | 1 | 2;
} {
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * 3;
  const edgeIndex = Math.min(2, Math.floor(scaled)) as 0 | 1 | 2;
  const localT = scaled - edgeIndex;
  const a = DINOSAUR_TRIANGLE_VERTICES[edgeIndex];
  const b = DINOSAUR_TRIANGLE_VERTICES[(edgeIndex + 1) % 3];
  const lx = a.lx + (b.lx - a.lx) * localT;
  const lz = a.lz + (b.lz - a.lz) * localT;
  const dx = b.lx - a.lx;
  const dz = b.lz - a.lz;
  const len = Math.hypot(dx, dz) || 1;
  return {
    x: DINOSAUR_ISLAND_CENTER.x + lx,
    z: DINOSAUR_ISLAND_CENTER.z + lz,
    lx,
    lz,
    tangentX: dx / len,
    tangentZ: dz / len,
    edgeIndex,
  };
}

/**
 * Computes shortest distance from world point (x, z) to the 3 edges of the Dinosaur Island Triangle Track.
 */
export function distanceToDinosaurTriangleTrack(x: number, z: number): number {
  const lx = x - DINOSAUR_ISLAND_CENTER.x;
  const lz = z - DINOSAUR_ISLAND_CENTER.z;
  let minDist = Infinity;
  for (let i = 0; i < 3; i++) {
    const a = DINOSAUR_TRIANGLE_VERTICES[i];
    const b = DINOSAUR_TRIANGLE_VERTICES[(i + 1) % 3];
    const abx = b.lx - a.lx;
    const abz = b.lz - a.lz;
    const abLenSq = abx * abx + abz * abz || 1;
    const proj = Math.max(0, Math.min(1, ((lx - a.lx) * abx + (lz - a.lz) * abz) / abLenSq));
    const cx = a.lx + abx * proj;
    const cz = a.lz + abz * proj;
    const d = Math.hypot(lx - cx, lz - cz);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Evaluates explorer position along the Triangle Track, identifying the current showcase place,
 * updating discovered places, and computing the next place ahead along the loop.
 */
export function evaluateDinosaurTriangleTrack(
  playerX: number,
  playerZ: number,
  prevVisitedIds: readonly string[]
): {
  visitedIds: string[];
  newlyDiscoveredPlace: DinosaurTrianglePlaceSpec | null;
  hud: DinosaurTriangleTrackHudState;
} {
  const distToTrack = distanceToDinosaurTriangleTrack(playerX, playerZ);
  const onTrack = distToTrack <= 26.0;

  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < DINOSAUR_TRIANGLE_PLACES.length; i++) {
    const p = DINOSAUR_TRIANGLE_PLACES[i];
    const d = Math.hypot(
      playerX - (DINOSAUR_ISLAND_CENTER.x + p.lx),
      playerZ - (DINOSAUR_ISLAND_CENTER.z + p.lz)
    );
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }

  const visitedSet = new Set(prevVisitedIds);
  let newlyDiscoveredPlace: DinosaurTrianglePlaceSpec | null = null;
  const activeSpec = DINOSAUR_TRIANGLE_PLACES[nearestIdx];
  if (nearestDist <= 42.0 && !visitedSet.has(activeSpec.id)) {
    visitedSet.add(activeSpec.id);
    newlyDiscoveredPlace = activeSpec;
  }

  const nextSpec = DINOSAUR_TRIANGLE_PLACES[(nearestIdx + 1) % DINOSAUR_TRIANGLE_PLACES.length];
  const distanceToNextM = Math.round(
    Math.hypot(
      playerX - (DINOSAUR_ISLAND_CENTER.x + nextSpec.lx),
      playerZ - (DINOSAUR_ISLAND_CENTER.z + nextSpec.lz)
    )
  );

  const visitedIds = Array.from(visitedSet);
  const hud: DinosaurTriangleTrackHudState = {
    onTrack,
    activePlaceId: activeSpec.id,
    activePlaceName: activeSpec.name,
    activePlaceSubtitle: activeSpec.subtitle,
    activePlaceOrder: activeSpec.order,
    nextPlaceName: nextSpec.shortName,
    distanceToNextM,
    visitedCount: visitedIds.length,
    totalPlaces: DINOSAUR_TRIANGLE_PLACES.length,
    places: DINOSAUR_TRIANGLE_PLACES.map((p, idx) => ({
      id: p.id,
      order: p.order,
      name: p.name,
      shortName: p.shortName,
      subtitle: p.subtitle,
      x: DINOSAUR_ISLAND_CENTER.x + p.lx,
      z: DINOSAUR_ISLAND_CENTER.z + p.lz,
      visited: visitedSet.has(p.id),
      isCurrent: idx === nearestIdx,
    })),
  };

  return { visitedIds, newlyDiscoveredPlace, hud };
}

/**
 * Exact meandering centerline of the Jurassic Park Flowing Forest River
 * in local island coordinates (x offset from DINOSAUR_ISLAND_CENTER.x) as a function of lz.
 * Flows ~440m from the towering northern volcanic waterfall gorge (lz = -170),
 * straight through Crystal Lake (lz = -20), and out to the southern ocean (lz = +228).
 */
export function ssjRiverLocalX(lz: number): number {
  const southEastSweep = Math.max(0, (lz - 60) / 168) * 34.0;
  return 34.0 + southEastSweep + Math.sin((lz + 20) * 0.022) * 20.0 + Math.cos(lz * 0.042) * 7.0;
}

/**
 * Half-width of the flowing forest river at local Z coordinate lz.
 */
export function ssjRiverHalfWidth(lz: number): number {
  const mouthFlare = Math.max(0, Math.min(1, (lz - 175) / 53));
  return 6.5 + mouthFlare * 3.5;
}

/**
 * Water surface elevation along the flowing forest river (slopes gently downhill from waterfall gorge to ocean).
 */
export function ssjRiverWaterY(lz: number): number {
  const t = Math.max(
    0,
    Math.min(1, (lz - DINOSAUR_RIVER_START_LZ) / (DINOSAUR_RIVER_END_LZ - DINOSAUR_RIVER_START_LZ))
  );
  if (lz <= 20) {
    const upperT = Math.max(
      0,
      Math.min(1, (lz - DINOSAUR_RIVER_START_LZ) / (20 - DINOSAUR_RIVER_START_LZ))
    );
    return 1.15 * (1 - upperT) + DINOSAUR_LAKE_WATER_Y * upperT;
  }
  const lowerT = Math.max(0, Math.min(1, (lz - 20) / (DINOSAUR_RIVER_END_LZ - 20)));
  return DINOSAUR_LAKE_WATER_Y * (1 - lowerT) + -0.25 * lowerT + (1 - t) * 0.02;
}

/**
 * Computes the true 3D curvilinear arc length (in meters) of the Dinosaur Island flowing river.
 */
export function computeSsjRiverArcLength(samples = 180): number {
  let length = 0;
  let prevZ = DINOSAUR_RIVER_START_LZ;
  let prevX = ssjRiverLocalX(prevZ);
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const lz = DINOSAUR_RIVER_START_LZ + t * (DINOSAUR_RIVER_END_LZ - DINOSAUR_RIVER_START_LZ);
    const lx = ssjRiverLocalX(lz);
    length += Math.hypot(lx - prevX, lz - prevZ);
    prevX = lx;
    prevZ = lz;
  }
  return length;
}

/**
 * Normalized elliptical distance from the center of Dinosaur Island's Crystal Lake (< 1.0 = inside lake).
 */
export function dinoCrystalLakeNormDist(x: number, z: number): number {
  const lx = x - DINOSAUR_ISLAND_CENTER.x - DINOSAUR_CRYSTAL_LAKE_CENTER.lx;
  const lz = z - DINOSAUR_ISLAND_CENTER.z - DINOSAUR_CRYSTAL_LAKE_CENTER.lz;
  return Math.hypot(lx / DINOSAUR_CRYSTAL_LAKE_RX, lz / DINOSAUR_CRYSTAL_LAKE_RZ);
}

export function isInsideDinoCrystalLake(x: number, z: number, pad = 0): boolean {
  const lx = x - DINOSAUR_ISLAND_CENTER.x - DINOSAUR_CRYSTAL_LAKE_CENTER.lx;
  const lz = z - DINOSAUR_ISLAND_CENTER.z - DINOSAUR_CRYSTAL_LAKE_CENTER.lz;
  return (
    Math.hypot(
      lx / (DINOSAUR_CRYSTAL_LAKE_RX + pad),
      lz / (DINOSAUR_CRYSTAL_LAKE_RZ + pad)
    ) <= 1.0
  );
}

/**
 * Checks whether (x, z) lies on one of the 4 walkable timber bridges crossing the flowing forest river.
 */
export function isOnDinosaurRiverBridge(x: number, z: number): boolean {
  const lx = x - DINOSAUR_ISLAND_CENTER.x;
  const lz = z - DINOSAUR_ISLAND_CENTER.z;
  for (const bridgeLz of DINOSAUR_RIVER_BRIDGE_LZS) {
    if (Math.abs(lz - bridgeLz) <= 4.4) {
      const riverCx = ssjRiverLocalX(bridgeLz);
      const halfSpan = ssjRiverHalfWidth(bridgeLz) + 7.2;
      if (Math.abs(lx - riverCx) <= halfSpan) {
        return true;
      }
    }
  }
  return false;
}

export function getDinosaurRiverBridgeDeckY(x: number, z: number): number | null {
  const lx = x - DINOSAUR_ISLAND_CENTER.x;
  const lz = z - DINOSAUR_ISLAND_CENTER.z;
  for (const bridgeLz of DINOSAUR_RIVER_BRIDGE_LZS) {
    if (Math.abs(lz - bridgeLz) <= 4.4) {
      const riverCx = ssjRiverLocalX(bridgeLz);
      const halfSpan = ssjRiverHalfWidth(bridgeLz) + 7.2;
      const dist = Math.abs(lx - riverCx);
      if (dist <= halfSpan) {
        const arch = Math.cos((dist / halfSpan) * (Math.PI * 0.5)) * 0.95;
        return Math.max(ssjRiverWaterY(bridgeLz) + 1.35, 2.0) + arch;
      }
    }
  }
  return null;
}

/**
 * Checks whether (x, z) sits inside Dinosaur Island's flowing river channel (excluding walkable bridges).
 */
export function isInDinosaurFlowingRiver(x: number, z: number, pad = 0): boolean {
  if (isOnDinosaurRiverBridge(x, z)) return false;
  const lx = x - DINOSAUR_ISLAND_CENTER.x;
  const lz = z - DINOSAUR_ISLAND_CENTER.z;
  if (lz < DINOSAUR_RIVER_START_LZ - 6 || lz > DINOSAUR_RIVER_END_LZ) return false;
  if (Math.hypot(lx, lz) > DINOSAUR_ISLAND_LAND_RADIUS + 4) return false;
  const rCx = ssjRiverLocalX(lz);
  return Math.abs(lx - rCx) <= ssjRiverHalfWidth(lz) + pad;
}

/**
 * Pure automated schedule for the Gigantic Horizontal Upper Roof Doors covering Dinosaur Island:
 * - NIGHT / DUSK (18:30 – 05:30): target = 1.0 (CLOSED — horizontal sky doors seal shut over the entire island top!)
 * - MORNING / DAY (05:30 – 18:30): target = 0.0 (WIDE OPEN — horizontal sky doors retract completely open to the sky!)
 */
export function computeJurassicRoofDoorTarget(timeHours: number): number {
  const h = ((timeHours % 24) + 24) % 24;
  return h >= 18.5 || h < 5.5 ? 1 : 0;
}

export function isOnDinosaurMarinaPier(x: number, z: number): boolean {
  return (
    x >= DINOSAUR_MARINA_PIER_BOUNDS.minX &&
    x <= DINOSAUR_MARINA_PIER_BOUNDS.maxX &&
    z >= DINOSAUR_MARINA_PIER_BOUNDS.minZ &&
    z <= DINOSAUR_MARINA_PIER_BOUNDS.maxZ
  );
}

export function isInsideDinosaurIslandLand(x: number, z: number, pad = 0): boolean {
  return (
    Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z) <=
      DINOSAUR_ISLAND_LAND_RADIUS + pad ||
    Math.hypot(x - DINOSAUR_HEADLAND_CENTER.x, z - DINOSAUR_HEADLAND_CENTER.z) <= 22.0 + pad
  );
}

export type SsjDinosaurSpeciesId =
  | 'trex'
  | 'brachiosaurus'
  | 'triceratops'
  | 'stegosaurus'
  | 'spinosaurus'
  | 'velociraptor'
  | 'ankylosaurus'
  | 'parasaurolophus'
  | 'pteranodon'
  | 'mosasaurus'
  | 'diplodocus'
  | 'carnotaurus'
  | 'allosaurus'
  | 'dilophosaurus'
  | 'pachycephalosaurus'
  | 'therizinosaurus'
  | 'baryonyx'
  | 'quetzalcoatlus';

export type SsjDinoBodyArchetype =
  | 'theropod'
  | 'sauropod'
  | 'triceratops'
  | 'stegosaurus'
  | 'spinosaurus'
  | 'ankylosaurus'
  | 'parasaurolophus'
  | 'pterosaur'
  | 'marine';

export interface SsjDinosaurSpeciesSpec {
  id: SsjDinosaurSpeciesId;
  name: string;
  nickname: string;
  archetype: SsjDinoBodyArchetype;
  bodyColor: number;
  accentColor: number;
  eyeColor: number;
  scale: number;
  localX: number;
  localZ: number;
  orbitRadius: number;
  speed: number;
  altitude?: number;
}

export type SsjDinosaurSpec = SsjDinosaurSpeciesSpec;

/**
 * All 18 iconic dinosaur species roaming across Grand Jurassic Park Island (~470m diameter).
 */
export const SSJ_DINOSAUR_SPECIES: readonly SsjDinosaurSpeciesSpec[] = [
  {
    id: 'trex',
    name: 'Tyrannosaurus Rex',
    nickname: 'Rexy',
    archetype: 'theropod',
    bodyColor: 0x3f2e21,
    accentColor: 0x24170f,
    eyeColor: 0xf59e0b,
    scale: 2.05,
    localX: 96,
    localZ: 64,
    orbitRadius: 24,
    speed: 0.65,
  },
  {
    id: 'brachiosaurus',
    name: 'Brachiosaurus',
    nickname: 'Brachi',
    archetype: 'sauropod',
    bodyColor: 0x5c7c48,
    accentColor: 0x3b532c,
    eyeColor: 0xfef08a,
    scale: 2.35,
    localX: -66,
    localZ: 44,
    orbitRadius: 24,
    speed: 0.35,
  },
  {
    id: 'triceratops',
    name: 'Triceratops',
    nickname: 'Trixie',
    archetype: 'triceratops',
    bodyColor: 0x7a5233,
    accentColor: 0xd6c7a9,
    eyeColor: 0xfde047,
    scale: 1.6,
    localX: -58,
    localZ: 138,
    orbitRadius: 20,
    speed: 0.45,
  },
  {
    id: 'stegosaurus',
    name: 'Stegosaurus',
    nickname: 'Spike',
    archetype: 'stegosaurus',
    bodyColor: 0x4d7346,
    accentColor: 0xc26d27,
    eyeColor: 0xfef08a,
    scale: 1.55,
    localX: -76,
    localZ: -102,
    orbitRadius: 20,
    speed: 0.42,
  },
  {
    id: 'spinosaurus',
    name: 'Spinosaurus',
    nickname: 'Spino',
    archetype: 'spinosaurus',
    bodyColor: 0x2d4c54,
    accentColor: 0xc94a38,
    eyeColor: 0xf97316,
    scale: 2.0,
    localX: 112,
    localZ: -54,
    orbitRadius: 22,
    speed: 0.55,
  },
  {
    id: 'velociraptor',
    name: 'Velociraptor',
    nickname: 'Blue',
    archetype: 'theropod',
    bodyColor: 0x3b4d5e,
    accentColor: 0x38bdf8,
    eyeColor: 0xfacc15,
    scale: 0.95,
    localX: 54,
    localZ: 122,
    orbitRadius: 18,
    speed: 0.95,
  },
  {
    id: 'ankylosaurus',
    name: 'Ankylosaurus',
    nickname: 'Bumpy',
    archetype: 'ankylosaurus',
    bodyColor: 0x6b5c43,
    accentColor: 0xd9a05b,
    eyeColor: 0xfde68a,
    scale: 1.45,
    localX: -134,
    localZ: 54,
    orbitRadius: 18,
    speed: 0.38,
  },
  {
    id: 'parasaurolophus',
    name: 'Parasaurolophus',
    nickname: 'Para',
    archetype: 'parasaurolophus',
    bodyColor: 0x4b8068,
    accentColor: 0xeab308,
    eyeColor: 0xfef08a,
    scale: 1.5,
    localX: -28,
    localZ: 34,
    orbitRadius: 22,
    speed: 0.58,
  },
  {
    id: 'pteranodon',
    name: 'Pteranodon',
    nickname: 'Sky Wing',
    archetype: 'pterosaur',
    bodyColor: 0x6e473b,
    accentColor: 0xea580c,
    eyeColor: 0xfacc15,
    scale: 1.85,
    localX: 14,
    localZ: 18,
    orbitRadius: 112,
    speed: 0.42,
    altitude: 25,
  },
  {
    id: 'mosasaurus',
    name: 'Mosasaurus',
    nickname: 'Mosa',
    archetype: 'marine',
    bodyColor: 0x1e3a5f,
    accentColor: 0x38bdf8,
    eyeColor: 0x7dd3fc,
    scale: 2.55,
    localX: 235,
    localZ: 190,
    orbitRadius: 34,
    speed: 0.48,
  },
  {
    id: 'diplodocus',
    name: 'Diplodocus',
    nickname: 'Dippy',
    archetype: 'sauropod',
    bodyColor: 0x5c6f52,
    accentColor: 0x8ea378,
    eyeColor: 0xfef08a,
    scale: 2.15,
    localX: -124,
    localZ: -92,
    orbitRadius: 20,
    speed: 0.36,
  },
  {
    id: 'carnotaurus',
    name: 'Carnotaurus',
    nickname: 'Toro',
    archetype: 'theropod',
    bodyColor: 0x7c2d12,
    accentColor: 0x1c1917,
    eyeColor: 0xf97316,
    scale: 1.55,
    localX: 138,
    localZ: -8,
    orbitRadius: 20,
    speed: 0.72,
  },
  {
    id: 'allosaurus',
    name: 'Allosaurus',
    nickname: 'Big Al',
    archetype: 'theropod',
    bodyColor: 0x3f4f5c,
    accentColor: 0xd97706,
    eyeColor: 0xfacc15,
    scale: 1.62,
    localX: 122,
    localZ: 98,
    orbitRadius: 22,
    speed: 0.66,
  },
  {
    id: 'dilophosaurus',
    name: 'Dilophosaurus',
    nickname: 'Dilo',
    archetype: 'theropod',
    bodyColor: 0x36694a,
    accentColor: 0xfacc15,
    eyeColor: 0xfde047,
    scale: 1.05,
    localX: 20,
    localZ: 146,
    orbitRadius: 16,
    speed: 0.78,
  },
  {
    id: 'pachycephalosaurus',
    name: 'Pachycephalosaurus',
    nickname: 'Pachy',
    archetype: 'parasaurolophus',
    bodyColor: 0x78553a,
    accentColor: 0xfde68a,
    eyeColor: 0xfef08a,
    scale: 1.15,
    localX: -148,
    localZ: -20,
    orbitRadius: 18,
    speed: 0.6,
  },
  {
    id: 'therizinosaurus',
    name: 'Therizinosaurus',
    nickname: 'Zino',
    archetype: 'theropod',
    bodyColor: 0x4c4452,
    accentColor: 0xf59e0b,
    eyeColor: 0xfbbf24,
    scale: 1.68,
    localX: -18,
    localZ: -148,
    orbitRadius: 18,
    speed: 0.48,
  },
  {
    id: 'baryonyx',
    name: 'Baryonyx',
    nickname: 'Barry',
    archetype: 'spinosaurus',
    bodyColor: 0x335c5c,
    accentColor: 0x0d9488,
    eyeColor: 0x5eead4,
    scale: 1.48,
    localX: 84,
    localZ: 128,
    orbitRadius: 18,
    speed: 0.58,
  },
  {
    id: 'quetzalcoatlus',
    name: 'Quetzalcoatlus',
    nickname: 'Quetzal',
    archetype: 'pterosaur',
    bodyColor: 0x475569,
    accentColor: 0xf59e0b,
    eyeColor: 0xfde047,
    scale: 2.15,
    localX: -20,
    localZ: -26,
    orbitRadius: 132,
    speed: 0.36,
    altitude: 29,
  },
] as const;

export interface DinosaurIslandState {
  onIsland: boolean;
  explorerHp: number;
  explorerMaxHp: number;
  dinoAlive: boolean;
  dinoHp: number;
  dinoMaxHp: number;
  dinoX: number;
  dinoZ: number;
  dinoHeading: number;
  dinoRoarTimer: number;
  dinoCollapse: number;
  dinoRunPhase: number;
  kills: number;
  // Open-island sanctuary: zero interior containment cages, zero wall-breaking sequence
  brokenWalls: number;
  wallsIntact: [boolean, boolean, boolean, boolean];
  wallSequenceActive: boolean;
  wallBreakCooldown: number;
  // 4 Monumental Surrounding Jurassic Perimeter Gates (each opens automatically when approached!)
  perimeterGateProgress: [number, number, number, number];
  perimeterGateTargetOpen: [boolean, boolean, boolean, boolean];
  perimeterGateManualLock: [boolean, boolean, boolean, boolean];
  nearestGateIndex: 0 | 1 | 2 | 3;
  // Active/nearest gate progress (synced with nearest gate for HUD & backward compatibility)
  gateOpenProgress: number;
  gateTargetOpen: boolean;
  gateManualLock: boolean;
  // Automated Gigantic Horizontal Upper Roof Doors covering Dinosaur Island top (0 = OPEN at morning/day, 1 = CLOSED at night)
  roofDoorCloseProgress: number;
  roofDoorTargetClosed: boolean;
  // Grand Triangle Track exploration progress
  triangleTrackVisitedIds: string[];
  triangleTrackHud: DinosaurTriangleTrackHudState;
  fireCooldown: number;
  muzzleFlashTimer: number;
  tracerTimer: number;
  tracerFromX: number;
  tracerFromY: number;
  tracerFromZ: number;
  tracerToX: number;
  tracerToY: number;
  tracerToZ: number;
  hitFlashTimer: number;
  statusLine: string;
  safariCar: SafariCarState;
}

export interface DinosaurIslandStepEvents {
  wallJustBrokenStage: number | null;
  dinoRoared: boolean;
  trianglePlaceDiscovered: DinosaurTrianglePlaceSpec | null;
}

export function isOnDinosaurIsland(x: number, z: number): boolean {
  return (
    Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z) <=
      DINOSAUR_ISLAND_RADIUS ||
    Math.hypot(x - DINOSAUR_HEADLAND_CENTER.x, z - DINOSAUR_HEADLAND_CENTER.z) <= 26.0 ||
    isOnDinosaurMarinaPier(x, z)
  );
}

export function createInitialDinosaurIslandState(initialTimeHours = 12.0): DinosaurIslandState {
  const initialRoofClosed = computeJurassicRoofDoorTarget(initialTimeHours) > 0.5;
  const initialTriangle = evaluateDinosaurTriangleTrack(
    DINOSAUR_EXPLORER_SPAWN.x,
    DINOSAUR_EXPLORER_SPAWN.z,
    []
  );
  return {
    onIsland: false,
    explorerHp: 150,
    explorerMaxHp: 150,
    dinoAlive: true,
    dinoHp: 350,
    dinoMaxHp: 350,
    dinoX: DINOSAUR_ISLAND_CENTER.x + SSJ_ISLAND_LANDMARKS.trexValley.lx,
    dinoZ: DINOSAUR_ISLAND_CENTER.z + SSJ_ISLAND_LANDMARKS.trexValley.lz,
    dinoHeading: -0.9,
    dinoRoarTimer: 0,
    dinoCollapse: 0,
    dinoRunPhase: 0,
    kills: 0,
    brokenWalls: 4,
    wallsIntact: [false, false, false, false],
    wallSequenceActive: false,
    wallBreakCooldown: 0,
    perimeterGateProgress: [0, 0, 0, 0],
    perimeterGateTargetOpen: [false, false, false, false],
    perimeterGateManualLock: [false, false, false, false],
    nearestGateIndex: 0,
    gateOpenProgress: 0,
    gateTargetOpen: false,
    gateManualLock: false,
    roofDoorCloseProgress: initialRoofClosed ? 1 : 0,
    roofDoorTargetClosed: initialRoofClosed,
    triangleTrackVisitedIds: [],
    triangleTrackHud: initialTriangle.hud,
    fireCooldown: 0,
    muzzleFlashTimer: 0,
    tracerTimer: 0,
    tracerFromX: DINOSAUR_EXPLORER_SPAWN.x,
    tracerFromY: 2.0,
    tracerFromZ: DINOSAUR_EXPLORER_SPAWN.z,
    tracerToX: DINOSAUR_ISLAND_CENTER.x + SSJ_ISLAND_LANDMARKS.trexValley.lx,
    tracerToY: 3.2,
    tracerToZ: DINOSAUR_ISLAND_CENTER.z + SSJ_ISLAND_LANDMARKS.trexValley.lz,
    hitFlashTimer: 0,
    statusLine:
      'Jurassic Park Sanctuary — Bigger Auto-Opening Perimeter Gates, Triangle Explorer Track & Crystal Lake',
    safariCar: {
      x: SAFARI_CAR_SPAWN.x,
      z: SAFARI_CAR_SPAWN.z,
      heading: SAFARI_CAR_SPAWN.heading,
      speed: 0,
      speedKmh: 0,
      steerAngle: 0,
      wheelSpin: 0,
    },
  };
}

/**
 * Snaps the automated horizontal upper roof doors to match an instantaneous time-of-day jump.
 */
export function snapJurassicRoofDoorsForTime(
  state: DinosaurIslandState,
  timeHours: number
): DinosaurIslandState {
  const closed = computeJurassicRoofDoorTarget(timeHours) > 0.5;
  return {
    ...state,
    roofDoorCloseProgress: closed ? 1 : 0,
    roofDoorTargetClosed: closed,
  };
}

/**
 * Toggles the nearest colossal motorized Jurassic Park Perimeter Gate (0 <-> 1).
 */
export function toggleJurassicGate(
  state: DinosaurIslandState,
  gateIndex?: 0 | 1 | 2 | 3
): DinosaurIslandState {
  const idx = gateIndex ?? state.nearestGateIndex;
  const nextOpen = !state.perimeterGateTargetOpen[idx];
  const nextTargets: [boolean, boolean, boolean, boolean] = [...state.perimeterGateTargetOpen];
  const nextLocks: [boolean, boolean, boolean, boolean] = [...state.perimeterGateManualLock];
  nextTargets[idx] = nextOpen;
  nextLocks[idx] = true;
  const gateName = DINOSAUR_PERIMETER_GATES[idx].name;
  return {
    ...state,
    perimeterGateTargetOpen: nextTargets,
    perimeterGateManualLock: nextLocks,
    gateTargetOpen: nextOpen,
    gateManualLock: true,
    statusLine: nextOpen
      ? `${gateName} swinging WIDE OPEN!`
      : `${gateName} closing smoothly...`,
  };
}

/**
 * Zero interior containment cage colliders — Jurassic Park Island is open to explore!
 */
export function getActiveArenaWallColliders(_state: DinosaurIslandState): AabbCollider[] {
  return [];
}

/**
 * Legacy helper retained for backward test compatibility.
 */
export function fireDinosaurIslandAk47(
  state: DinosaurIslandState,
  shooterX: number,
  shooterY: number,
  shooterZ: number
): { state: DinosaurIslandState; fired: boolean; killedDino: boolean } {
  if (!state.dinoAlive || state.fireCooldown > 0) {
    return { state, fired: false, killedDino: false };
  }

  const damage = 175;
  const nextHp = Math.max(0, state.dinoHp - damage);
  const killedDino = nextHp === 0;

  const nextState: DinosaurIslandState = {
    ...state,
    dinoHp: nextHp,
    dinoAlive: !killedDino,
    kills: killedDino ? state.kills + 1 : state.kills,
    dinoRoarTimer: killedDino ? 1.5 : 0.45,
    fireCooldown: 0.24,
    muzzleFlashTimer: 0.11,
    tracerTimer: 0.14,
    tracerFromX: shooterX,
    tracerFromY: shooterY,
    tracerFromZ: shooterZ,
    tracerToX: state.dinoX,
    tracerToY: 3.1,
    tracerToZ: state.dinoZ,
    hitFlashTimer: 0.18,
    statusLine: killedDino
      ? 'Rexy rests peacefully in Jurassic Valley'
      : 'Exploring Jurassic Park Triangle Track, Crystal Lake & River Sanctuary',
  };

  return { state: nextState, fired: true, killedDino };
}

export function spawnNextDinoWave(
  state: DinosaurIslandState,
  refX: number,
  refZ: number
): DinosaurIslandState {
  const angle =
    Math.atan2(refZ - DINOSAUR_ISLAND_CENTER.z, refX - DINOSAUR_ISLAND_CENTER.x) + 1.85;
  const spawnR = 92;
  const sx = DINOSAUR_ISLAND_CENTER.x + Math.cos(angle) * spawnR;
  const sz = DINOSAUR_ISLAND_CENTER.z + Math.sin(angle) * spawnR;
  return {
    ...state,
    dinoAlive: true,
    dinoHp: state.dinoMaxHp,
    dinoX: sx,
    dinoZ: sz,
    dinoHeading: Math.atan2(refX - sx, refZ - sz),
    dinoRoarTimer: 1.0,
    statusLine: 'Rexy roams freely across T-Rex Canyon in Jurassic Park!',
  };
}

export function stepDinosaurIslandState(
  state: DinosaurIslandState,
  playerX: number,
  playerZ: number,
  onIslandNow: boolean,
  dt: number,
  timeHours = 12.0
): { state: DinosaurIslandState; events: DinosaurIslandStepEvents } {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  const dinoRoared = false;

  const fireCooldown = Math.max(0, state.fireCooldown - cdt);
  const muzzleFlashTimer = Math.max(0, state.muzzleFlashTimer - cdt);
  const tracerTimer = Math.max(0, state.tracerTimer - cdt);
  const hitFlashTimer = Math.max(0, state.hitFlashTimer - cdt);
  const dinoRoarTimer = Math.max(0, state.dinoRoarTimer - cdt);

  // 4 Monumental Surrounding Perimeter Gates: each gate automatically swings WIDE OPEN as you approach!
  const nextGateProgress: [number, number, number, number] = [...state.perimeterGateProgress];
  const nextGateTargets: [boolean, boolean, boolean, boolean] = [...state.perimeterGateTargetOpen];
  const nextGateLocks: [boolean, boolean, boolean, boolean] = [...state.perimeterGateManualLock];

  let nearestGateIndex: 0 | 1 | 2 | 3 = 0;
  let nearestGateDist = Infinity;
  const gateRate = 1.15; // Smooth motorized double-door swing (~0.87s full swing!)

  for (let i = 0; i < DINOSAUR_PERIMETER_GATES.length; i++) {
    const g = DINOSAUR_PERIMETER_GATES[i];
    const gx = DINOSAUR_ISLAND_CENTER.x + g.lx;
    const gz = DINOSAUR_ISLAND_CENTER.z + g.lz;
    const dist = Math.hypot(playerX - gx, playerZ - gz);
    if (dist < nearestGateDist) {
      nearestGateDist = dist;
      nearestGateIndex = i as 0 | 1 | 2 | 3;
    }

    if (dist > g.autoOpenRadius + 14.0) {
      nextGateLocks[i] = false;
    }
    if (!nextGateLocks[i]) {
      nextGateTargets[i] = dist < g.autoOpenRadius;
    }

    const targetVal = nextGateTargets[i] ? 1 : 0;
    const delta = targetVal - nextGateProgress[i];
    nextGateProgress[i] =
      Math.abs(delta) <= gateRate * cdt
        ? targetVal
        : nextGateProgress[i] + Math.sign(delta) * gateRate * cdt;
  }

  const gateOpenProgress = nextGateProgress[nearestGateIndex];
  const gateTargetOpen = nextGateTargets[nearestGateIndex];
  const gateManualLock = nextGateLocks[nearestGateIndex];

  // Automated Gigantic Horizontal Upper Roof Doors (CLOSE at night 18:30-05:30, OPEN at morning/day 05:30-18:30!)
  const roofTarget = computeJurassicRoofDoorTarget(timeHours);
  const roofDoorTargetClosed = roofTarget > 0.5;
  const roofRate = 0.34;
  const roofDelta = roofTarget - state.roofDoorCloseProgress;
  const roofDoorCloseProgress =
    Math.abs(roofDelta) <= roofRate * cdt
      ? roofTarget
      : state.roofDoorCloseProgress + Math.sign(roofDelta) * roofRate * cdt;

  // Evaluate Grand Triangle Track exploration & showcase all different places along the route!
  const triEval = onIslandNow
    ? evaluateDinosaurTriangleTrack(playerX, playerZ, state.triangleTrackVisitedIds)
    : {
        visitedIds: state.triangleTrackVisitedIds,
        newlyDiscoveredPlace: null,
        hud: state.triangleTrackHud,
      };

  // Peaceful roaming T-Rex "Rexy" patrolling T-Rex Canyon
  let dinoX = state.dinoX;
  let dinoZ = state.dinoZ;
  let dinoHeading = state.dinoHeading;
  let dinoRunPhase = state.dinoRunPhase;
  const collapseTarget = state.dinoAlive ? 0 : 1;
  const dinoCollapse =
    state.dinoCollapse + (collapseTarget - state.dinoCollapse) * Math.min(1, cdt * 3.5);

  if (state.dinoAlive && onIslandNow) {
    const valleyX = DINOSAUR_ISLAND_CENTER.x + SSJ_ISLAND_LANDMARKS.trexValley.lx;
    const valleyZ = DINOSAUR_ISLAND_CENTER.z + SSJ_ISLAND_LANDMARKS.trexValley.lz;
    const orbitAng = Math.atan2(dinoZ - valleyZ, dinoX - valleyX) + cdt * 0.14;
    const orbitR = 24.0;
    const targetX = valleyX + Math.cos(orbitAng) * orbitR;
    const targetZ = valleyZ + Math.sin(orbitAng) * orbitR;
    const dx = targetX - dinoX;
    const dz = targetZ - dinoZ;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.1) {
      dinoHeading = Math.atan2(dx, dz);
      const step = Math.min(dist, 3.0 * cdt);
      dinoX += (dx / dist) * step;
      dinoZ += (dz / dist) * step;
      dinoRunPhase += cdt * 4.8;
    }
  }

  const nextStatusLine = triEval.newlyDiscoveredPlace
    ? `Triangle Track ${triEval.newlyDiscoveredPlace.order}/6 · ${triEval.newlyDiscoveredPlace.name}`
    : state.statusLine;

  return {
    state: {
      ...state,
      onIsland: onIslandNow,
      dinoX,
      dinoZ,
      dinoHeading,
      dinoRoarTimer,
      dinoCollapse,
      dinoRunPhase,
      perimeterGateProgress: nextGateProgress,
      perimeterGateTargetOpen: nextGateTargets,
      perimeterGateManualLock: nextGateLocks,
      nearestGateIndex,
      gateOpenProgress,
      gateTargetOpen,
      gateManualLock,
      roofDoorCloseProgress,
      roofDoorTargetClosed,
      triangleTrackVisitedIds: triEval.visitedIds,
      triangleTrackHud: triEval.hud,
      fireCooldown,
      muzzleFlashTimer,
      tracerTimer,
      hitFlashTimer,
      statusLine: nextStatusLine,
    },
    events: {
      wallJustBrokenStage: null,
      dinoRoared,
      trianglePlaceDiscovered: triEval.newlyDiscoveredPlace,
    },
  };
}

/**
 * Drives the SSJ Safari Tour Cruiser cleanly across Grand Jurassic Park Island
 * OR anywhere on mainland dry land when spawned at exact player coordinates!
 */
export function stepSafariCarState(
  car: SafariCarState,
  throttleInput: number,
  steerRight: number,
  boost: boolean,
  _wallsIntact: [boolean, boolean, boolean, boolean],
  dt: number,
  isBlockedWater?: (x: number, z: number) => boolean
): SafariCarState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  const maxFwd = boost ? 28.0 : 18.0;
  const maxRev = -7.5;

  let speed = car.speed;
  if (Math.abs(throttleInput) > 0.04) {
    const target = throttleInput > 0 ? throttleInput * maxFwd : throttleInput * Math.abs(maxRev);
    const accel = throttleInput > 0 ? 16.0 : 12.0;
    speed += Math.sign(target - speed) * Math.min(Math.abs(target - speed), accel * cdt);
  } else {
    speed *= Math.exp(-5.0 * cdt);
    if (Math.abs(speed) < 0.05) speed = 0;
  }

  let heading = car.heading;
  if (Math.abs(speed) > 0.2 && Math.abs(steerRight) > 0.04) {
    const dirSign = speed >= 0 ? 1 : -1;
    heading -= steerRight * 2.1 * cdt * dirSign;
  }

  let nextX = car.x + Math.sin(heading) * speed * cdt;
  let nextZ = car.z + Math.cos(heading) * speed * cdt;

  if (!car.inVault) {
    const startedOnDino =
      Math.hypot(car.x - DINOSAUR_ISLAND_CENTER.x, car.z - DINOSAUR_ISLAND_CENTER.z) <=
      DINOSAUR_ISLAND_LAND_RADIUS + 4;

    if (startedOnDino) {
      const dxCenter = nextX - DINOSAUR_ISLAND_CENTER.x;
      const dzCenter = nextZ - DINOSAUR_ISLAND_CENTER.z;
      const distCenter = Math.hypot(dxCenter, dzCenter);
      const maxLandR = DINOSAUR_ISLAND_LAND_RADIUS - 4.0;
      if (distCenter > maxLandR) {
        const scale = maxLandR / distCenter;
        nextX = DINOSAUR_ISLAND_CENTER.x + dxCenter * scale;
        nextZ = DINOSAUR_ISLAND_CENTER.z + dzCenter * scale;
        speed *= 0.45;
      }
    } else if (isBlockedWater && isBlockedWater(nextX, nextZ)) {
      nextX = car.x;
      nextZ = car.z;
      speed *= 0.25;
    }
  }

  return {
    x: nextX,
    z: nextZ,
    heading,
    speed,
    speedKmh: Math.round(Math.abs(speed) * 3.6),
    steerAngle: -steerRight * 0.46,
    wheelSpin: car.wheelSpin + speed * cdt * 1.9,
    inVault: car.inVault,
  };
}

export function extractDinosaurIslandHud(state: DinosaurIslandState): DinosaurIslandHudState {
  const nearestGate = DINOSAUR_PERIMETER_GATES[state.nearestGateIndex];
  return {
    onIsland: state.onIsland,
    explorerHp: state.explorerHp,
    explorerMaxHp: state.explorerMaxHp,
    dinoAlive: state.dinoAlive,
    dinoHp: state.dinoHp,
    dinoMaxHp: state.dinoMaxHp,
    kills: state.kills,
    brokenWalls: state.brokenWalls,
    wallsIntact: state.wallsIntact,
    statusLine: state.statusLine,
    bannerText: 'JURASSIC PARK · DINOSAUR & WILDLIFE SANCTUARY',
    roofDoorCloseProgress: state.roofDoorCloseProgress,
    roofDoorClosed: state.roofDoorCloseProgress > 0.5,
    nearestGateName: nearestGate.name,
    nearestGateOpenProgress: state.perimeterGateProgress[state.nearestGateIndex],
    triangleTrack: state.triangleTrackHud,
  };
}
