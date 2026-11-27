import {
  AIRPORT_CENTER,
  AIRPORT_HALF_X,
  AIRPORT_HALF_Z,
  AIRPORT_RUNWAY_BOUNDS,
} from './airportMetro';
import {
  DESERT_BIOME_CENTER,
  DESERT_HELIPAD_POS,
  DESERT_OASIS_CENTER,
  DESERT_OASIS_RX,
  DESERT_OASIS_RZ,
  DESERT_OASIS_SPAWN,
  DESERT_PYRAMID_CENTER,
  isInsideDesertBiome,
} from './desertOasis';
import {
  DINOSAUR_CRYSTAL_LAKE_CENTER,
  DINOSAUR_CRYSTAL_LAKE_RX,
  DINOSAUR_CRYSTAL_LAKE_RZ,
  DINOSAUR_EXPLORER_SPAWN,
  DINOSAUR_ISLAND_CENTER,
  DINOSAUR_ISLAND_LAND_RADIUS,
  DINOSAUR_RIVER_END_LZ,
  DINOSAUR_RIVER_START_LZ,
  SSJ_ISLAND_LANDMARKS,
  isInsideDinosaurIslandLand,
  ssjRiverHalfWidth,
  ssjRiverLocalX,
} from './dinosaurIsland';
import {
  EXHIBITION_ISLAND_BOUNDS,
  EXHIBITION_ISLAND_CENTER,
  EXHIBITION_PLAZA_SPAWN,
} from './exhibitionComplex';
import {
  AVS_SNOW_HOUSE_CENTER,
  CAVE_ENTRANCES,
  FROZEN_MIRROR_LAKE_CENTER,
  FROZEN_MIRROR_LAKE_RX,
  FROZEN_MIRROR_LAKE_RZ,
} from './frozenKingdom';
import { GIANT_IGLOO_MAN_POS } from './iceland';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from './midnightFrontier';
import {
  OCEAN_HERO_TOWER_CENTER,
  OCEAN_HERO_TOWER_RADIUS,
  OCEAN_HERO_TOWER_SPAWN,
  SNOWMAN_ISLAND_CENTER,
  SNOWMAN_ISLAND_RADIUS,
  SNOWMAN_ISLAND_SPAWN,
  SUBMARINE_DOCK_POS,
} from './oceanWorldSystems';
import {
  ENCHANTED_FOREST_CENTER,
  FROZEN_LAKE_CENTER,
  HOME_CENTER,
  LAKE_CENTER,
  MAIN_STATION_CENTER,
  VEHICLE_GARAGE_PLOT_CENTER,
  WATERFALL_CENTER,
  WATER_LEVEL,
  WILDLIFE_FOREST_SANCTUARY_CENTER,
  frozenLakeNormDist,
  getRegionAt,
  groundHeightAt,
  isOceanAt,
  lakeNormDist,
} from './terrain';

export const ATLAS_BOUNDS = {
  minX: -340,
  maxX: 860,
  minZ: -310,
  maxZ: 490,
} as const;

export const ATLAS_WORLD_W = ATLAS_BOUNDS.maxX - ATLAS_BOUNDS.minX; // 1200m
export const ATLAS_WORLD_H = ATLAS_BOUNDS.maxZ - ATLAS_BOUNDS.minZ; // 800m

// Base isotropic 3:2 SVG coordinate space (fills desktop 8-col map frame edge-to-edge without letterboxing)
export const ATLAS_BASE_W = 1080;
export const ATLAS_BASE_H = 720;

export const ATLAS_MIN_ZOOM = 1.0;
export const ATLAS_MAX_ZOOM = 6.5;

export interface AtlasCamera {
  centerX: number; // world X
  centerZ: number; // world Z
  zoom: number;
}

export interface AtlasViewBox {
  vx: number;
  vy: number;
  vw: number;
  vh: number;
}

export type AtlasRegionPresetId =
  | 'full'
  | 'mainland'
  | 'dinosaur'
  | 'frozen'
  | 'desert'
  | 'ocean';

export interface AtlasRegionPreset {
  id: AtlasRegionPresetId;
  label: string;
  camera: AtlasCamera;
}

export const ATLAS_REGION_PRESETS: readonly AtlasRegionPreset[] = [
  {
    id: 'full',
    label: 'Full World',
    camera: { centerX: 260, centerZ: 90, zoom: 1.0 },
  },
  {
    id: 'mainland',
    label: 'Mainland',
    camera: { centerX: 38, centerZ: 16, zoom: 2.1 },
  },
  {
    id: 'dinosaur',
    label: 'Dinosaur Island',
    camera: { centerX: 560, centerZ: 195, zoom: 1.85 },
  },
  {
    id: 'frozen',
    label: 'Frozen Kingdom',
    camera: { centerX: -162, centerZ: -146, zoom: 2.4 },
  },
  {
    id: 'desert',
    label: 'Thar Desert',
    camera: { centerX: -214, centerZ: 122, zoom: 2.6 },
  },
  {
    id: 'ocean',
    label: 'Ocean & Islands',
    camera: { centerX: 214, centerZ: 176, zoom: 2.35 },
  },
] as const;

export type AtlasPinCategory = 'landmark' | 'island' | 'transit' | 'home' | 'realm';

export interface AtlasPin {
  id: string;
  name: string;
  subtitle?: string;
  regionLabel: string;
  description: string;
  category: AtlasPinCategory;
  x: number;
  z: number;
  teleportX?: number;
  teleportZ?: number;
  busReachable: boolean;
  /** Minimum zoom level at which the label shows by default (prevents label pile-up at overview). */
  minLabelZoom: number;
  /** Optional fine label placement offsets (in unscaled SVG px) to eliminate overlapping text. */
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: 'start' | 'middle' | 'end';
  accent: string;
  testId?: string;
}

export const ATLAS_PINS: readonly AtlasPin[] = [
  {
    id: 'main_station',
    name: 'Central Station',
    subtitle: 'ஷவீஷ் ஜெஷுருன் சா ரயில் நிலையம்',
    regionLabel: 'Blossom Valley',
    description: 'Central railway hub with clocktower, bus depot, and lakeside avenues.',
    category: 'transit',
    x: MAIN_STATION_CENTER.x,
    z: MAIN_STATION_CENTER.z,
    teleportX: 0.6,
    teleportZ: 13.3,
    busReachable: true,
    minLabelZoom: 1.0,
    labelDx: 0,
    labelDy: 15,
    accent: '#F59E0B',
  },
  {
    id: 'my_home',
    name: 'En Illam',
    subtitle: 'என் இல்லம்',
    regionLabel: 'Blossom Valley',
    description: 'Three-story residence with Hero Hall, Rooftop Helipad, and secret underground tunnel.',
    category: 'home',
    x: HOME_CENTER.x,
    z: HOME_CENTER.z,
    teleportX: -18,
    teleportZ: -8,
    busReachable: true,
    minLabelZoom: 1.6,
    labelDx: -9,
    labelDy: 3,
    labelAnchor: 'end',
    accent: '#F4BE98',
  },
  {
    id: 'vehicle_garage',
    name: 'Vehicle Garage',
    subtitle: 'வாகன கேரேஜ்',
    regionLabel: 'Blossom Valley',
    description: 'Walk-in spawning bay for cars, 49cc dirt bike, safari jeep, aircraft, and boats.',
    category: 'landmark',
    x: VEHICLE_GARAGE_PLOT_CENTER.x,
    z: VEHICLE_GARAGE_PLOT_CENTER.z,
    teleportX: VEHICLE_GARAGE_PLOT_CENTER.x,
    teleportZ: VEHICLE_GARAGE_PLOT_CENTER.z + 11,
    busReachable: true,
    minLabelZoom: 1.9,
    labelDx: 0,
    labelDy: -11,
    accent: '#38BDF8',
  },
  {
    id: 'international_airport',
    name: 'International Airport',
    subtitle: 'சர்வதேச விமான நிலையம்',
    regionLabel: 'NE Tarmac Plateau',
    description: 'Runway 09, Terminal 1, DL-787 Dreamliner, 3 aircraft stands, and Underground Metro.',
    category: 'transit',
    x: AIRPORT_CENTER.x,
    z: AIRPORT_CENTER.z,
    teleportX: 185,
    teleportZ: -137,
    busReachable: true,
    minLabelZoom: 1.0,
    accent: '#38BDF8',
    testId: 'map-airport-marker',
  },
  {
    id: 'dinosaur_island',
    name: 'Dinosaur Island',
    subtitle: 'ஜுராசிக் பார்க் டைனோசர் தீவு',
    regionLabel: 'Offshore Jurassic Sanctuary',
    description: 'Grand prehistoric island with bigger auto-opening 360° perimeter gates, Triangle Explorer Track, night roof doors, Crystal Lake & flowing river.',
    category: 'island',
    x: DINOSAUR_ISLAND_CENTER.x,
    z: DINOSAUR_ISLAND_CENTER.z,
    teleportX: DINOSAUR_EXPLORER_SPAWN.x,
    teleportZ: DINOSAUR_EXPLORER_SPAWN.z,
    busReachable: false,
    minLabelZoom: 1.0,
    labelDx: -14,
    labelDy: 16,
    labelAnchor: 'end',
    accent: '#EAB308',
  },
  {
    id: 'dino_grand_gate',
    name: 'Jurassic Grand Gate',
    subtitle: 'பிரம்மாண்ட நுழைவு வாயில்',
    regionLabel: 'Dinosaur Island',
    description: 'Monumental auto-opening swinging gate built into the 360° perimeter boundary wall.',
    category: 'landmark',
    x: DINOSAUR_ISLAND_CENTER.x + SSJ_ISLAND_LANDMARKS.entranceArch.lx,
    z: DINOSAUR_ISLAND_CENTER.z + SSJ_ISLAND_LANDMARKS.entranceArch.lz,
    teleportX: DINOSAUR_EXPLORER_SPAWN.x,
    teleportZ: DINOSAUR_EXPLORER_SPAWN.z,
    busReachable: false,
    minLabelZoom: 1.35,
    labelDy: -11,
    accent: '#FACC15',
  },
  {
    id: 'dino_crystal_lake',
    name: 'Crystal Lake & River',
    subtitle: 'படிக ஏரி & ஆறு',
    regionLabel: 'Dinosaur Island',
    description: 'Freshwater Crystal Lake fed by the northern volcanic waterfall and flowing forest river.',
    category: 'landmark',
    x: DINOSAUR_ISLAND_CENTER.x + DINOSAUR_CRYSTAL_LAKE_CENTER.lx,
    z: DINOSAUR_ISLAND_CENTER.z + DINOSAUR_CRYSTAL_LAKE_CENTER.lz,
    teleportX: DINOSAUR_ISLAND_CENTER.x + DINOSAUR_CRYSTAL_LAKE_CENTER.lx - 46,
    teleportZ: DINOSAUR_ISLAND_CENTER.z + DINOSAUR_CRYSTAL_LAKE_CENTER.lz,
    busReachable: false,
    minLabelZoom: 1.35,
    labelDx: 12,
    labelDy: -8,
    labelAnchor: 'start',
    accent: '#2DD4BF',
  },
  {
    id: 'wildlife_sanctuary',
    name: 'Wildlife Sanctuary',
    subtitle: 'வனவிலங்கு சரணாலயம்',
    regionLabel: 'Dinosaur Island',
    description: 'Living 21-species forest valley along the western edge of the Triangle Track.',
    category: 'landmark',
    x: WILDLIFE_FOREST_SANCTUARY_CENTER.x,
    z: WILDLIFE_FOREST_SANCTUARY_CENTER.z,
    teleportX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 12,
    teleportZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 14,
    busReachable: false,
    minLabelZoom: 1.35,
    labelDy: -11,
    accent: '#4ADE80',
  },
  {
    id: 'frozen_kingdom',
    name: 'Frozen Kingdom',
    subtitle: 'பனிமலை ராஜ்ஜியம்',
    regionLabel: 'NW Alpine Peaks',
    description: 'Snowy peaks, Frozen Mirror Lake, AVS Snow Residence, Giant Igloo Man, and 6-area crystal caves.',
    category: 'home',
    x: AVS_SNOW_HOUSE_CENTER.x,
    z: AVS_SNOW_HOUSE_CENTER.z,
    teleportX: AVS_SNOW_HOUSE_CENTER.x + 12,
    teleportZ: AVS_SNOW_HOUSE_CENTER.z + 18,
    busReachable: true,
    minLabelZoom: 1.0,
    labelDx: 10,
    labelDy: -8,
    labelAnchor: 'start',
    accent: '#7DD3FC',
  },
  {
    id: 'thar_desert',
    name: 'Thar Desert',
    subtitle: 'தார் தங்க பாலைவனம்',
    regionLabel: 'SW Golden Dunes',
    description: 'Rolling sandstone dunes, Emerald Oasis Lagoon, Grand Pyramid secret chamber, and Desert Helipad.',
    category: 'landmark',
    x: DESERT_PYRAMID_CENTER.x,
    z: DESERT_PYRAMID_CENTER.z,
    teleportX: DESERT_OASIS_SPAWN.x,
    teleportZ: DESERT_OASIS_SPAWN.z,
    busReachable: true,
    minLabelZoom: 1.0,
    labelDx: 10,
    labelDy: 4,
    labelAnchor: 'start',
    accent: '#F59E0B',
  },
  {
    id: 'exhibition_complex',
    name: 'Exhibition Island',
    subtitle: 'கடல் வாகன கண்காட்சி',
    regionLabel: 'Kadalkarai Ocean',
    description: 'Offshore mobility island with dealership showroom, aviation hangar, runway, and marina.',
    category: 'island',
    x: EXHIBITION_ISLAND_CENTER.x,
    z: EXHIBITION_ISLAND_CENTER.z,
    teleportX: EXHIBITION_PLAZA_SPAWN.x,
    teleportZ: EXHIBITION_PLAZA_SPAWN.z,
    busReachable: true,
    minLabelZoom: 1.0,
    labelDy: 16,
    accent: '#FBBF24',
    testId: 'map-exhibition-island',
  },
  {
    id: 'snowman_island',
    name: 'Snowman Island',
    subtitle: 'பனிமனிதன் தீவு',
    regionLabel: 'Kadalkarai Ocean',
    description: 'Frosty offshore island oasis accessible by boat, jet ski, helicopter, or Snowman Taxi.',
    category: 'island',
    x: SNOWMAN_ISLAND_CENTER.x,
    z: SNOWMAN_ISLAND_CENTER.z,
    teleportX: SNOWMAN_ISLAND_SPAWN.x,
    teleportZ: SNOWMAN_ISLAND_SPAWN.z,
    busReachable: false,
    minLabelZoom: 1.75,
    labelDy: -11,
    accent: '#BAE6FD',
    testId: 'map-snowman-island',
  },
  {
    id: 'ocean_hero_tower',
    name: 'Ocean Hero Tower',
    subtitle: 'கடல் ஹீரோ கோபுரம்',
    regionLabel: 'Kadalkarai Ocean',
    description: 'Offshore glass tower housing all 7 wearable superhero suits above the turquoise sea.',
    category: 'island',
    x: OCEAN_HERO_TOWER_CENTER.x,
    z: OCEAN_HERO_TOWER_CENTER.z,
    teleportX: OCEAN_HERO_TOWER_SPAWN.x,
    teleportZ: OCEAN_HERO_TOWER_SPAWN.z,
    busReachable: false,
    minLabelZoom: 2.0,
    labelDy: -11,
    accent: '#38BDF8',
    testId: 'map-ocean-hero-tower',
  },
  {
    id: 'submarine_pier',
    name: 'Submarine Pier',
    subtitle: 'நீர்மூழ்கி கப்பல் தளம்',
    regionLabel: 'Kadalkarai Shore',
    description: 'Board the yellow exploration submarine to dive into the deep ocean reefs.',
    category: 'transit',
    x: SUBMARINE_DOCK_POS.x,
    z: SUBMARINE_DOCK_POS.z,
    teleportX: SUBMARINE_DOCK_POS.x - 10,
    teleportZ: SUBMARINE_DOCK_POS.z,
    busReachable: true,
    minLabelZoom: 2.0,
    labelDx: 9,
    labelDy: 13,
    labelAnchor: 'start',
    accent: '#FACC15',
    testId: 'map-submarine-pier',
  },
  {
    id: 'pachai_waterfall',
    name: 'Pachai Waterfall',
    subtitle: 'பச்சை வயல் அருவி',
    regionLabel: 'Emerald Countryside',
    description: 'Lush terraced green valley and cool rocky waterfall plunge pool.',
    category: 'landmark',
    x: WATERFALL_CENTER.x,
    z: WATERFALL_CENTER.z,
    teleportX: WATERFALL_CENTER.x,
    teleportZ: WATERFALL_CENTER.z - 14,
    busReachable: true,
    minLabelZoom: 1.7,
    accent: '#34D399',
  },
  {
    id: 'mayavanam',
    name: 'Mayavanam Forest',
    subtitle: 'மாயவனம் ஓல்கா முகாம்',
    regionLabel: 'Blossom Valley',
    description: 'Enchanted wisteria grove with glowing lotus pond and the Olga Pastel Camper Van.',
    category: 'landmark',
    x: ENCHANTED_FOREST_CENTER.x,
    z: ENCHANTED_FOREST_CENTER.z,
    busReachable: true,
    minLabelZoom: 2.1,
    accent: '#F472B6',
  },
  {
    id: 'midnight_portal',
    name: 'Midnight Portal',
    subtitle: 'நள்ளிரவு எல்லை',
    regionLabel: 'Southern Meadow',
    description: 'Night-only celestial sky-beacon gateway into the Midnight Frontier realm.',
    category: 'realm',
    x: MIDNIGHT_FRONTIER_PORTAL_POS.x,
    z: MIDNIGHT_FRONTIER_PORTAL_POS.z,
    busReachable: true,
    minLabelZoom: 1.9,
    accent: '#C084FC',
    testId: 'map-midnight-frontier-marker',
  },
  {
    id: 'neelam_lake',
    name: 'Neelam Lake',
    subtitle: 'நீலம் ஏரி',
    regionLabel: 'Lakeside Camp',
    description: 'Mirror-still alpine-fed lake with campfire glade and rowboat pier.',
    category: 'landmark',
    x: LAKE_CENTER.x,
    z: LAKE_CENTER.z,
    teleportX: 28,
    teleportZ: -5,
    busReachable: true,
    minLabelZoom: 1.8,
    labelDx: 10,
    labelDy: -6,
    labelAnchor: 'start',
    accent: '#60A5FA',
  },
] as const;

export function worldToAtlasX(wx: number): number {
  return ((wx - ATLAS_BOUNDS.minX) / ATLAS_WORLD_W) * ATLAS_BASE_W;
}

export function worldToAtlasY(wz: number): number {
  return ((wz - ATLAS_BOUNDS.minZ) / ATLAS_WORLD_H) * ATLAS_BASE_H;
}

export function atlasToWorldX(ax: number): number {
  return ATLAS_BOUNDS.minX + (ax / ATLAS_BASE_W) * ATLAS_WORLD_W;
}

export function atlasToWorldZ(ay: number): number {
  return ATLAS_BOUNDS.minZ + (ay / ATLAS_BASE_H) * ATLAS_WORLD_H;
}

export function clampAtlasCamera(cam: AtlasCamera): AtlasCamera {
  const zoom = Math.max(ATLAS_MIN_ZOOM, Math.min(ATLAS_MAX_ZOOM, cam.zoom));
  const halfW = (ATLAS_WORLD_W / zoom) * 0.5;
  const halfH = (ATLAS_WORLD_H / zoom) * 0.5;
  const minCX = ATLAS_BOUNDS.minX + halfW;
  const maxCX = ATLAS_BOUNDS.maxX - halfW;
  const minCZ = ATLAS_BOUNDS.minZ + halfH;
  const maxCZ = ATLAS_BOUNDS.maxZ - halfH;
  return {
    centerX:
      minCX <= maxCX
        ? Math.max(minCX, Math.min(maxCX, cam.centerX))
        : (ATLAS_BOUNDS.minX + ATLAS_BOUNDS.maxX) * 0.5,
    centerZ:
      minCZ <= maxCZ
        ? Math.max(minCZ, Math.min(maxCZ, cam.centerZ))
        : (ATLAS_BOUNDS.minZ + ATLAS_BOUNDS.maxZ) * 0.5,
    zoom,
  };
}

export function computeAtlasViewBox(cam: AtlasCamera): AtlasViewBox {
  const clamped = clampAtlasCamera(cam);
  const vw = ATLAS_BASE_W / clamped.zoom;
  const vh = ATLAS_BASE_H / clamped.zoom;
  const cx = worldToAtlasX(clamped.centerX);
  const cy = worldToAtlasY(clamped.centerZ);
  return {
    vx: Math.max(0, Math.min(ATLAS_BASE_W - vw, cx - vw * 0.5)),
    vy: Math.max(0, Math.min(ATLAS_BASE_H - vh, cy - vh * 0.5)),
    vw,
    vh,
  };
}

export function computeAtlasScaleBar(
  zoom: number,
  viewportWidthPx: number
): { meters: number; label: string; widthPx: number } {
  const safeZoom = Math.max(ATLAS_MIN_ZOOM, zoom);
  const safeVp = Math.max(200, viewportWidthPx);
  const visibleWorldMeters = ATLAS_WORLD_W / safeZoom;
  const pxPerMeter = safeVp / visibleWorldMeters;
  const candidates = [25, 50, 100, 200, 250, 500];
  let chosen = 250;
  for (const c of candidates) {
    const w = c * pxPerMeter;
    if (w >= 62 && w <= 155) {
      chosen = c;
      break;
    }
    if (w < 62) chosen = c;
  }
  return {
    meters: chosen,
    label: chosen >= 1000 ? `${(chosen / 1000).toFixed(1)} km` : `${chosen} m`,
    widthPx: Math.round(Math.max(46, Math.min(168, chosen * pxPerMeter))),
  };
}

export function isPointInDinoCrystalLake(wx: number, wz: number): boolean {
  const lx = wx - DINOSAUR_ISLAND_CENTER.x;
  const lz = wz - DINOSAUR_ISLAND_CENTER.z;
  const dx = (lx - DINOSAUR_CRYSTAL_LAKE_CENTER.lx) / DINOSAUR_CRYSTAL_LAKE_RX;
  const dz = (lz - DINOSAUR_CRYSTAL_LAKE_CENTER.lz) / DINOSAUR_CRYSTAL_LAKE_RZ;
  return dx * dx + dz * dz <= 1.0;
}

export function isPointInDinoRiver(wx: number, wz: number): boolean {
  const lx = wx - DINOSAUR_ISLAND_CENTER.x;
  const lz = wz - DINOSAUR_ISLAND_CENTER.z;
  if (lz < DINOSAUR_RIVER_START_LZ || lz > DINOSAUR_RIVER_END_LZ) return false;
  const rx = ssjRiverLocalX(lz);
  const hw = ssjRiverHalfWidth(lz);
  return Math.abs(lx - rx) <= hw * 1.15;
}

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * c,
    a[1] + (b[1] - a[1]) * c,
    a[2] + (b[2] - a[2]) * c,
  ];
}

function organicNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.017 + z * 0.011) * 14 +
    Math.cos(x * 0.031 - z * 0.023) * 8 +
    Math.sin(x * 0.008 - z * 0.019) * 18
  );
}

/**
 * Computes an authentic cartographic shaded-relief RGB color (0..255)
 * for any world coordinate (wx, wz) using the true 3D terrain heightfield,
 * organic biome transitions (zero harsh rectangular seams), NW directional hillshading,
 * elevation contours, freshwater basins, and ocean bathymetry.
 */
export function sampleAtlasPixelRGB(wx: number, wz: number): [number, number, number] {
  const coastJitter = Math.sin(wx * 0.021) * 8 + Math.cos(wx * 0.047) * 4;
  // Natural north-eastern sea curve beyond Airport Plateau & Mainland (avoids rigid straight horizon line at z=2)
  const airportPad =
    Math.abs(wx - AIRPORT_CENTER.x) <= AIRPORT_HALF_X + 26 &&
    Math.abs(wz - AIRPORT_CENTER.z) <= AIRPORT_HALF_Z + 22;
  const inDino = isInsideDinosaurIslandLand(wx, wz);
  const inSnowIsland =
    Math.hypot(wx - SNOWMAN_ISLAND_CENTER.x, wz - SNOWMAN_ISLAND_CENTER.z) <=
    SNOWMAN_ISLAND_RADIUS + 1.5;
  const inTower =
    Math.hypot(wx - OCEAN_HERO_TOWER_CENTER.x, wz - OCEAN_HERO_TOWER_CENTER.z) <=
    OCEAN_HERO_TOWER_RADIUS + 1.5;
  const inExh =
    wx >= EXHIBITION_ISLAND_BOUNDS.minX - 2 &&
    wx <= EXHIBITION_ISLAND_BOUNDS.maxX + 2 &&
    wz >= EXHIBITION_ISLAND_BOUNDS.minZ - 2 &&
    wz <= EXHIBITION_ISLAND_BOUNDS.maxZ + 2;

  const farEastNorthOcean =
    !inDino &&
    !airportPad &&
    !inSnowIsland &&
    !inTower &&
    !inExh &&
    ((wx > 312 + coastJitter && wz > -360) ||
      (wx > 118 + coastJitter && wz > -4 + Math.sin(wx * 0.018) * 12));

  const ocean = isOceanAt(wx, wz) || farEastNorthOcean;

  if (ocean) {
    const dDino = Math.max(
      0,
      Math.hypot(wx - DINOSAUR_ISLAND_CENTER.x, wz - DINOSAUR_ISLAND_CENTER.z) -
        DINOSAUR_ISLAND_LAND_RADIUS
    );
    const dSnow = Math.max(
      0,
      Math.hypot(wx - SNOWMAN_ISLAND_CENTER.x, wz - SNOWMAN_ISLAND_CENTER.z) - SNOWMAN_ISLAND_RADIUS
    );
    const dTower = Math.max(
      0,
      Math.hypot(wx - OCEAN_HERO_TOWER_CENTER.x, wz - OCEAN_HERO_TOWER_CENTER.z) -
        OCEAN_HERO_TOWER_RADIUS
    );
    const dExhX = Math.max(
      EXHIBITION_ISLAND_BOUNDS.minX - wx,
      0,
      wx - EXHIBITION_ISLAND_BOUNDS.maxX
    );
    const dExhZ = Math.max(
      EXHIBITION_ISLAND_BOUNDS.minZ - wz,
      0,
      wz - EXHIBITION_ISLAND_BOUNDS.maxZ
    );
    const dExh = Math.hypot(dExhX, dExhZ);
    const dAirportX = Math.max(
      AIRPORT_CENTER.x - (AIRPORT_HALF_X + 26) - wx,
      0,
      wx - (AIRPORT_CENTER.x + AIRPORT_HALF_X + 26)
    );
    const dAirportZ = Math.max(
      AIRPORT_CENTER.z - (AIRPORT_HALF_Z + 22) - wz,
      0,
      wz - (AIRPORT_CENTER.z + AIRPORT_HALF_Z + 22)
    );
    const dAirport = Math.hypot(dAirportX, dAirportZ);
    const dMainShore =
      wz > 4
        ? Math.max(0, wx - (112 + coastJitter * 0.5))
        : Math.max(0, wx - (312 + coastJitter));
    const dCoast = Math.min(dDino, dSnow, dTower, dExh, dAirport, dMainShore);

    if (dCoast < 6.0) {
      return [118, 208, 224];
    }
    const shelf = Math.min(1, dCoast / 185);
    const swell = Math.sin(wx * 0.022 + wz * 0.017) * 3.5;
    const ringBand = Math.abs((dCoast % 48) - 24) < 1.6 && dCoast < 190 ? 7 : 0;
    const r = Math.round(40 * (1 - shelf) + 12 * shelf + ringBand * 0.4);
    const g = Math.round(138 * (1 - shelf) + 50 * shelf + swell + ringBand);
    const b = Math.round(168 * (1 - shelf) + 88 * shelf + swell + ringBand * 1.15);
    return [
      Math.max(8, Math.min(255, r)),
      Math.max(24, Math.min(255, g)),
      Math.max(48, Math.min(255, b)),
    ];
  }

  // Inland freshwater features
  const dNeelam = lakeNormDist(wx, wz);
  if (dNeelam < 1.02) {
    const rim = dNeelam > 0.86 ? 22 : 0;
    return [46 + rim, 130 + rim, 182 + rim];
  }

  const dFrozenLake = frozenLakeNormDist(wx, wz);
  const dMirrorLake = Math.hypot(
    (wx - FROZEN_MIRROR_LAKE_CENTER.x) / FROZEN_MIRROR_LAKE_RX,
    (wz - FROZEN_MIRROR_LAKE_CENTER.z) / FROZEN_MIRROR_LAKE_RZ
  );
  if (dFrozenLake < 1.0 || dMirrorLake < 1.0) {
    const edge = Math.min(dFrozenLake, dMirrorLake) > 0.86 ? 24 : 0;
    return [96 + edge, 184 + edge, 224 + edge];
  }

  const dOasis = Math.hypot(
    (wx - DESERT_OASIS_CENTER.x) / DESERT_OASIS_RX,
    (wz - DESERT_OASIS_CENTER.z) / DESERT_OASIS_RZ
  );
  if (dOasis < 1.04) {
    const rim = dOasis > 0.86 ? 24 : 0;
    return [30 + rim, 168 + rim, 152 + rim];
  }

  if (inDino && (isPointInDinoCrystalLake(wx, wz) || isPointInDinoRiver(wx, wz))) {
    return [34, 172, 182];
  }

  // True elevation + NW hillshade gradient
  const eps = 3.2;
  const h = groundHeightAt(wx, wz);
  const hx = groundHeightAt(wx + eps, wz) - groundHeightAt(wx - eps, wz);
  const hz = groundHeightAt(wx, wz + eps) - groundHeightAt(wx, wz - eps);
  const slopeX = hx / (2 * eps);
  const slopeZ = hz / (2 * eps);
  const len = Math.sqrt(slopeX * slopeX + 1 + slopeZ * slopeZ);
  const nx = -slopeX / len;
  const ny = 1 / len;
  const nz = -slopeZ / len;
  const sunDot = nx * -0.58 + ny * 0.68 + nz * -0.45;
  const shade = Math.max(0.64, Math.min(1.22, 0.74 + sunDot * 0.54));

  let rgb: [number, number, number] = [106, 150, 98];

  if (inDino) {
    const distFromCenter = Math.hypot(
      wx - DINOSAUR_ISLAND_CENTER.x,
      wz - DINOSAUR_ISLAND_CENTER.z
    );
    const beachT = smooth(DINOSAUR_ISLAND_LAND_RADIUS - 32, DINOSAUR_ISLAND_LAND_RADIUS - 14, distFromCenter);
    const canopy = Math.sin(wx * 0.042) * Math.cos(wz * 0.042) * 10;
    const jungleRgb: [number, number, number] = [
      54 + canopy * 0.6,
      124 + canopy,
      68 + canopy * 0.4,
    ];
    const highlandT = smooth(7.5, 13.5, h);
    const landRgb = mixRgb(jungleRgb, [104, 118, 92], highlandT);
    rgb = mixRgb(landRgb, [214, 188, 130], beachT);
  } else if (inSnowIsland) {
    rgb = [224, 240, 250];
  } else if (inExh) {
    rgb = [122, 134, 148];
  } else if (inTower) {
    rgb = [96, 136, 166];
  } else if (
    Math.abs(wx - AIRPORT_CENTER.x) <= AIRPORT_HALF_X &&
    Math.abs(wz - AIRPORT_CENTER.z) <= AIRPORT_HALF_Z
  ) {
    const onRunway =
      wx >= AIRPORT_RUNWAY_BOUNDS.minX &&
      wx <= AIRPORT_RUNWAY_BOUNDS.maxX &&
      wz >= AIRPORT_RUNWAY_BOUNDS.minZ &&
      wz <= AIRPORT_RUNWAY_BOUNDS.maxZ;
    rgb = onRunway ? [74, 84, 100] : [118, 130, 142];
  } else {
    // Organic smoothstep + noise blended mainland biomes (ZERO hard rectangular borders!)
    const n = organicNoise(wx, wz);

    // Base valley sage-green with soft countryside emerald transition toward the south
    const countrysideT = smooth(32, 92, wz + n * 0.7) * (1 - smooth(45, 105, wx + n * 0.5));
    const blossomT = 1 - smooth(24, 68, Math.hypot(wx - MAIN_STATION_CENTER.x, wz - MAIN_STATION_CENTER.z));
    rgb = mixRgb([108, 152, 100], [78, 140, 82], countrysideT);
    rgb = mixRgb(rgb, [130, 158, 112], blossomT * 0.65);

    // Organic Frozen Kingdom Alpine Snow blend (NW)
    const snowX = 1 - smooth(-102, -32, wx + n);
    const snowZ = 1 - smooth(-88, -16, wz + n * 0.85);
    const snowT = Math.max(snowX * snowZ, smooth(6.5, 11.5, h) * (wx < -20 && wz < -10 ? 0.85 : 0));
    const snowTint: [number, number, number] = h > 10.5 ? [184, 204, 222] : [224, 238, 248];
    rgb = mixRgb(rgb, snowTint, snowT);

    // Organic Thar Golden Desert Dunes blend (SW)
    const dDesert = Math.hypot((wx - DESERT_BIOME_CENTER.x) * 0.85, (wz - DESERT_BIOME_CENTER.z) * 0.92);
    const desertRadial = 1 - smooth(95, 165, dDesert + n * 1.1);
    const desertSW = (1 - smooth(-145, -75, wx + n * 0.9)) * smooth(35, 105, wz + n * 0.9);
    const desertT = Math.max(desertRadial, desertSW, isInsideDesertBiome(wx, wz) ? 0.92 : 0);
    const dune = Math.sin(wx * 0.052 + wz * 0.028) * 10;
    const desertTint: [number, number, number] = [218 + dune * 0.6, 174 + dune * 0.5, 106 + dune * 0.3];
    rgb = mixRgb(rgb, desertTint, desertT);

    // Warm golden Kadalkarai beach strip along the eastern shoreline
    const beachEast = smooth(84, 112, wx + coastJitter * 0.5) * smooth(-6, 22, wz) * (1 - smooth(0.4, 1.4, h));
    rgb = mixRgb(rgb, [216, 192, 140], beachEast);
  }

  // Subtle topographic elevation contour lines every 3.5m on dry land
  const contourFrac = Math.abs(((h - WATER_LEVEL) % 3.5) / 3.5);
  const contourDarken = h > 1.2 && (contourFrac < 0.06 || contourFrac > 0.94) ? 0.92 : 1.0;

  return [
    Math.max(12, Math.min(252, Math.round(rgb[0] * shade * contourDarken))),
    Math.max(14, Math.min(252, Math.round(rgb[1] * shade * contourDarken))),
    Math.max(18, Math.min(252, Math.round(rgb[2] * shade * contourDarken))),
  ];
}

// Re-export key coordinates so WorldMapModal stays clean
export {
  CAVE_ENTRANCES,
  DESERT_BIOME_CENTER,
  DESERT_HELIPAD_POS,
  GIANT_IGLOO_MAN_POS,
  MIDNIGHT_FRONTIER_PORTAL_POS,
  getRegionAt,
};
