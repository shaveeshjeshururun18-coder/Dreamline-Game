import type { LocationInfo, RegionId, ScenicSpot } from './types';
import {
  DINOSAUR_EXPLORER_SPAWN,
  DINOSAUR_HEADLAND_CENTER,
  DINOSAUR_ISLAND_CENTER,
  DINOSAUR_STATION_APPROX,
  isInsideDinosaurIslandLand,
} from './dinosaurIsland';
import {
  AVS_SNOW_HOUSE_BASE_Y,
  AVS_SNOW_HOUSE_CENTER,
  AVS_SNOW_HOUSE_FRONT_PLAZA,
  AVS_SNOW_HOUSE_ROT_Y,
  CAVE_ENTRANCES,
  FROZEN_MIRROR_LAKE_CENTER,
  FROZEN_MIRROR_LAKE_RX,
  FROZEN_MIRROR_LAKE_RZ,
  SNOW_VILLAGE_CENTER,
  WINTER_SUMMIT_STATION_POS,
  getAvsSnowHouseFloorHeight,
} from './frozenKingdom';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from './midnightFrontier';
import {
  EXHIBITION_DECK_Y,
  EXHIBITION_ISLAND_BOUNDS,
  EXHIBITION_ISLAND_CENTER,
  EXHIBITION_PLAZA_SPAWN,
  EXHIBITION_STATION_POS,
  getExhibitionComplexFloorHeight,
  isInsideExhibitionIsland,
  isOnExhibitionMarinaPier,
  isOnOceanBusCauseway,
} from './exhibitionComplex';
import {
  DESERT_OASIS_CENTER,
  DESERT_OASIS_JETTY_BOUNDS,
  DESERT_OASIS_SPAWN,
  DESERT_PYRAMID_CENTER,
  DESERT_PYRAMID_SOUTH_PORTAL,
  DESERT_TRAIN_STATION_APPROX,
  applyDesertTerrainHeight,
  getDesertStructureFloorHeight,
  isInsideDesertBiome,
  isOnDesertOasisJetty,
} from './desertOasis';
import {
  AIRPORT_CENTER,
  AIRPORT_SPAWN,
  METRO_SURFACE_ENTRANCES,
  applyAirportTerrainHeight,
  getAirportFloorHeight,
  isInsideAirport,
} from './airportMetro';

export interface Vec2 {
  x: number;
  z: number;
}

export interface AabbCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export const WORLD_PLAYABLE_RADIUS = 435;
export const WATER_LEVEL = -0.35;

export const LAKE_CENTER = { x: 46, z: -26 };
export const LAKE_RX = 34;
export const LAKE_RZ = 26;

export const FROZEN_LAKE_CENTER = { x: -102, z: -58 };
export const FROZEN_LAKE_RX = 22;
export const FROZEN_LAKE_RZ = 18;

export const HILL_CENTER = { x: -52, z: -48 };
export const HILL_RADIUS = 38;
export const HILL_HEIGHT = 11.2;

export const SNOW_PEAK_CENTER = { x: -115, z: -108 };
export const COAST_CENTER = { x: 102, z: 62 };
export const WATERFALL_CENTER = { x: -32, z: 112 };
export const HOME_CENTER = { x: -22, z: -16 };
export const VILLAGE_CENTER = { x: -42, z: 34 };
export const MAIN_STATION_CENTER = { x: 0, z: 10 };
export const CAMPSITE_CENTER = { x: 26, z: -4 };
export const ENCHANTED_FOREST_CENTER = { x: -102, z: 48 };
export const ENCHANTED_POND_CENTER = { x: -119, z: 33 };
export const ENCHANTED_POND_RADIUS = 9.8;

export const REGION_LABELS: Record<RegionId, { name: string; tamil: string }> = {
  coastal: { name: 'Kadalkarai Coast', tamil: 'கடற்கரை நகரம்' },
  snow: { name: 'Panimalai Iceland', tamil: 'பனிமலை ஐஸ்லாந்து' },
  sakura: { name: 'Poongavanam Blossom Valley', tamil: 'பூங்காவனம் பள்ளத்தாக்கு' },
  countryside: { name: 'Pachai Vayal Countryside', tamil: 'பச்சை வயல்' },
  lake_camp: { name: 'Neelam Lake & Camp', tamil: 'நீலம் ஏரி முகாம்' },
  desert: { name: 'Thar Golden Desert', tamil: 'தார் பாலைவன சோலை' },
  airport: { name: 'Dreamline International Airport', tamil: 'சர்வதேச விமான நிலையம்' },
};

export const LOCATIONS: LocationInfo[] = [
  {
    id: 'sakuragawa_station',
    regionId: 'sakura',
    name: 'ஷவீஷ் ஜெஷுருன் சா',
    jpName: 'ரயில் நிலையம்',
    subtitle: 'Wooden countryside railway station beneath the cherry blossom trees',
    x: 0,
    z: 10,
    teleportX: 0.6,
    teleportZ: 13.3,
  },
  {
    id: 'my_home',
    regionId: 'sakura',
    name: 'En Illam · My Home',
    jpName: 'என் இல்லம்',
    subtitle: 'Two-storey wooden countryside home with a sunset balcony',
    x: HOME_CENTER.x,
    z: HOME_CENTER.z,
    teleportX: HOME_CENTER.x,
    teleportZ: HOME_CENTER.z + 9.2,
  },
  {
    id: 'coastal_town',
    regionId: 'coastal',
    name: 'Kadalkarai Coast',
    jpName: 'கடற்கரை நகரம்',
    subtitle: 'Turquoise sea, lighthouse beacon, harbour boats, and sandy beach',
    x: COAST_CENTER.x,
    z: COAST_CENTER.z,
    teleportX: 100.0,
    teleportZ: 59.0,
  },
  {
    id: 'dinosaur_island',
    regionId: 'coastal',
    name: 'SSJ Dinosaur Island',
    jpName: 'டைனோசர் தீவு',
    subtitle: 'Offshore sea island linked by the Ocean Railway Bridge — T-Rex breakout arena, AK-47 & Safari Car',
    x: DINOSAUR_ISLAND_CENTER.x,
    z: DINOSAUR_ISLAND_CENTER.z,
    teleportX: DINOSAUR_EXPLORER_SPAWN.x,
    teleportZ: DINOSAUR_EXPLORER_SPAWN.z,
  },
  {
    id: 'exhibition_complex',
    regionId: 'coastal',
    name: 'Universal Mobility Exhibition',
    jpName: 'உலக போக்குவரத்து கண்காட்சி',
    subtitle: 'Oceanfront 3-storey luxury dealership, industrial aviation hangar, marina & test circuits linked by train & bus',
    x: EXHIBITION_ISLAND_CENTER.x,
    z: EXHIBITION_ISLAND_CENTER.z,
    teleportX: EXHIBITION_PLAZA_SPAWN.x,
    teleportZ: EXHIBITION_PLAZA_SPAWN.z,
  },
  {
    id: 'snow_mountains',
    regionId: 'snow',
    name: 'Panimalai Iceland',
    jpName: 'பனிமலை ஐஸ்லாந்து',
    subtitle: 'Glacial wonderland of Giant Igloo Man (18m), frozen lake, and 23.5m giant transformation',
    x: -84,
    z: -74,
    teleportX: -90.0,
    teleportZ: -68.0,
  },
  {
    id: 'avs_snow_house',
    regionId: 'snow',
    name: 'AVS Snow Residence',
    jpName: 'பனிமலை இல்லம்',
    subtitle: 'Expanded 2-storey AVS Residence facing Frozen Mirror Lake with rooftop helipad, red steps & clear pathways',
    x: AVS_SNOW_HOUSE_CENTER.x,
    z: AVS_SNOW_HOUSE_CENTER.z,
    teleportX: AVS_SNOW_HOUSE_FRONT_PLAZA.x,
    teleportZ: AVS_SNOW_HOUSE_FRONT_PLAZA.z,
  },
  {
    id: 'frozen_kingdom_caves',
    regionId: 'snow',
    name: 'Frozen Kingdom & Caves',
    jpName: 'பனிமலை குகைகள்',
    subtitle: 'Massive expanded snow forests, frozen mirror lake, winter station, and 6-area underground crystal cave world',
    x: CAVE_ENTRANCES[0].surfaceX,
    z: CAVE_ENTRANCES[0].surfaceZ,
    teleportX: CAVE_ENTRANCES[0].surfaceX,
    teleportZ: CAVE_ENTRANCES[0].surfaceZ + 7.5,
  },
  {
    id: 'iceland_gateway',
    regionId: 'sakura',
    name: 'Iceland Express Halt',
    jpName: 'ஐஸ்லாந்து நுழைவு',
    subtitle: 'Northwest railway gateway connecting Dreamline Express to Panimalai Iceland',
    x: -48,
    z: -24,
    teleportX: -50.8,
    teleportZ: -24.0,
  },
  {
    id: 'aomizu_lakeside',
    regionId: 'lake_camp',
    name: 'Neelam Lake & Camp',
    jpName: 'நீலம் ஏரி முகாம்',
    subtitle: 'Mirror lake, rowboat dock, tent, and starry campfire',
    x: 34,
    z: -5,
    teleportX: 29.0,
    teleportZ: -3.5,
  },
  {
    id: 'open_countryside',
    regionId: 'countryside',
    name: 'Pachai Vayal Waterfall',
    jpName: 'பச்சை வயல் அருவி',
    subtitle: 'Emerald rice paddies, rolling hills, and cascading waterfall',
    x: WATERFALL_CENTER.x,
    z: WATERFALL_CENTER.z - 16,
    teleportX: WATERFALL_CENTER.x + 2,
    teleportZ: WATERFALL_CENTER.z - 20,
  },
  {
    id: 'kaze_no_oka',
    regionId: 'lake_camp',
    name: 'Thendral Malai Halt',
    jpName: 'தென்றல் மலை',
    subtitle: 'Quiet breezy foothill stop beside the stone tunnel',
    x: -18,
    z: -62,
    teleportX: -18.0,
    teleportZ: -61.0,
  },
  {
    id: 'japanese_village',
    regionId: 'sakura',
    name: 'Nila Gramam',
    jpName: 'நிலா கிராமம்',
    subtitle: 'Narrow village lanes, warm windows, and tiled eaves',
    x: -42,
    z: 34,
    teleportX: -42.0,
    teleportZ: 34.0,
  },
  {
    id: 'enchanted_forest',
    regionId: 'sakura',
    name: 'Mayavanam · Enchanted Forest',
    jpName: 'மாயவனம் · ஓல்கா வேன்',
    subtitle: 'Wisteria twilight clearing, glowing lotus waterfall pond, camp cat & Olga Pastel Camper Van',
    x: ENCHANTED_FOREST_CENTER.x,
    z: ENCHANTED_FOREST_CENTER.z,
    teleportX: ENCHANTED_FOREST_CENTER.x + 1.4,
    teleportZ: ENCHANTED_FOREST_CENTER.z + 7.2,
  },
  {
    id: 'hilltop_viewpoint',
    regionId: 'snow',
    name: 'Malaiyur Overlook',
    jpName: 'மலையூர் காட்சிமுனை',
    subtitle: 'Panoramic hilltop bench overlooking the valley line',
    x: -52,
    z: -48,
    teleportX: -52.0,
    teleportZ: -48.0,
  },
  {
    id: 'thar_desert_oasis',
    regionId: 'desert',
    name: 'Thar Golden Desert Oasis',
    jpName: 'பாலைவன சோலை',
    subtitle: 'Sunlit golden sand dunes, palm-ringed emerald swimming lagoon, Bedouin campfire & desert sky pad',
    x: DESERT_OASIS_CENTER.x,
    z: DESERT_OASIS_CENTER.z,
    teleportX: DESERT_OASIS_SPAWN.x,
    teleportZ: DESERT_OASIS_SPAWN.z,
  },
  {
    id: 'thar_pyramid_ruins',
    regionId: 'desert',
    name: 'Thar Grand Pyramid Ruins',
    jpName: 'பழமையான பிரமிட் கோவில்',
    subtitle: 'Walkable 6-tier sandstone pyramid with golden sun summit & torch-lit secret solar relic chamber',
    x: DESERT_PYRAMID_CENTER.x,
    z: DESERT_PYRAMID_CENTER.z,
    teleportX: DESERT_PYRAMID_SOUTH_PORTAL.x,
    teleportZ: DESERT_PYRAMID_SOUTH_PORTAL.z + 5.5,
  },
  {
    id: 'dreamline_airport',
    regionId: 'airport',
    name: 'Dreamline International Airport',
    jpName: 'சர்வதேச விமான நிலையம்',
    subtitle: 'Terminal 1 departure hall, 26m ATC radar tower, Runway 09/27, underground Metro link & flyable DL-787 Jetliner',
    x: AIRPORT_CENTER.x,
    z: AIRPORT_CENTER.z,
    teleportX: AIRPORT_SPAWN.x,
    teleportZ: AIRPORT_SPAWN.z,
  },
  {
    id: 'underground_metro',
    regionId: 'sakura',
    name: 'Central Underground Metro',
    jpName: 'சுரங்க மெட்ரோ நிலையம்',
    subtitle: 'Illuminated subway pavilion descending underground — ride express M1 Metro to Midtown NYC & International Airport',
    x: METRO_SURFACE_ENTRANCES[0].surfaceX,
    z: METRO_SURFACE_ENTRANCES[0].surfaceZ,
    teleportX: METRO_SURFACE_ENTRANCES[0].surfaceX,
    teleportZ: METRO_SURFACE_ENTRANCES[0].surfaceZ + 4.5,
  },
];

export const SCENIC_SPOTS: ScenicSpot[] = [
  {
    id: 'spot_sakuragawa',
    regionId: 'sakura',
    name: 'ஷவீஷ் ஜெஷுருன் சா நடைமேடை',
    jpName: 'ஷவீஷ் ஜெஷுருன் சா',
    description: 'Stand under the warm canopy lamps as the local train glides into dusk.',
    x: 0,
    z: 10,
    radius: 14,
  },
  {
    id: 'spot_home_balcony',
    regionId: 'sakura',
    name: 'En Illam Balcony',
    jpName: 'என் இல்லம் மாடம்',
    description: 'Your personal two-storey home overlooking the valley and sunset sky.',
    x: HOME_CENTER.x,
    z: HOME_CENTER.z,
    radius: 13,
  },
  {
    id: 'spot_coastal_lighthouse',
    regionId: 'coastal',
    name: 'Kadalkarai Lighthouse',
    jpName: 'கடற்கரை கலங்கரை விளக்கம்',
    description: 'Watch the turquoise ocean waves and rotating golden beacon at dusk.',
    x: 112,
    z: 44,
    radius: 18,
  },
  {
    id: 'spot_dinosaur_island',
    regionId: 'coastal',
    name: 'SSJ Dinosaur Island Arena',
    jpName: 'டைனோசர் தீவு அரங்கம்',
    description: 'Cross the Ocean Railway Bridge to face the chasing T-Rex, shatter all 4 walls, and drive the Safari Car.',
    x: DINOSAUR_ISLAND_CENTER.x,
    z: DINOSAUR_ISLAND_CENTER.z,
    radius: 26,
  },
  {
    id: 'spot_exhibition_complex',
    regionId: 'coastal',
    name: 'Universal Mobility Ocean Complex',
    jpName: 'உலக போக்குவரத்து கண்காட்சி',
    description: 'Explore the oceanfront 3-storey Wayfort exhibition hall, giant aviation hangar, tall ship marina, and vehicle test circuits.',
    x: EXHIBITION_ISLAND_CENTER.x,
    z: EXHIBITION_ISLAND_CENTER.z,
    radius: 42,
  },
  {
    id: 'spot_snow_lake',
    regionId: 'snow',
    name: 'Panimalai Frozen Lake',
    jpName: 'பனிமலை உறைந்த ஏரி',
    description: 'Crystalline winter ice framed by snow-laden pines and warm cabin chimneys.',
    x: -94,
    z: -68,
    radius: 22,
  },
  {
    id: 'spot_avs_snow_house',
    regionId: 'snow',
    name: 'AVS Snow Residence',
    jpName: 'பனிமலை இல்லம்',
    description: 'Walk up the 6 red-tiled steps into the expanded snow-dusted AVS Residence and climb up to its yellow-trimmed balcony.',
    x: AVS_SNOW_HOUSE_CENTER.x,
    z: AVS_SNOW_HOUSE_CENTER.z,
    radius: 18,
  },
  {
    id: 'spot_frozen_caves',
    regionId: 'snow',
    name: 'Frozen Kingdom Crystal Caves',
    jpName: 'பனிமலை படிக குகைகள்',
    description: 'Step through the mountain cave opening into 6 luminous interconnected subterranean caverns.',
    x: CAVE_ENTRANCES[0].surfaceX,
    z: CAVE_ENTRANCES[0].surfaceZ,
    radius: 18,
  },
  {
    id: 'spot_lakeside',
    regionId: 'lake_camp',
    name: 'Neelam Campfire Shore',
    jpName: 'நீலம் முகாம் கரை',
    description: 'Pitch a tent, light the campfire, and row a boat across mirror water.',
    x: 28,
    z: -5,
    radius: 16,
  },
  {
    id: 'spot_waterfall',
    regionId: 'countryside',
    name: 'Pachai Vayal Waterfall',
    jpName: 'பச்சை வயல் அருவி',
    description: 'Emerald rice fields and a sparkling mountain waterfall pool.',
    x: WATERFALL_CENTER.x,
    z: WATERFALL_CENTER.z - 14,
    radius: 18,
  },
  {
    id: 'spot_village',
    regionId: 'sakura',
    name: 'Nila Lantern Lane',
    jpName: 'நிலா விளக்குத் தெரு',
    description: 'Quiet rural houses, a corner shop, and a softly humming refreshment kiosk.',
    x: -42,
    z: 34,
    radius: 18,
  },
  {
    id: 'spot_enchanted_forest',
    regionId: 'sakura',
    name: 'Mayavanam Enchanted Clearing',
    jpName: 'மாயவனம் ஓல்கா முகாம்',
    description: 'Glowing wisteria trees, lotus waterfall pond, camp cat, and Olga Pastel Camper Van waiting to drive.',
    x: ENCHANTED_FOREST_CENTER.x,
    z: ENCHANTED_FOREST_CENTER.z,
    radius: 22,
  },
  {
    id: 'spot_hilltop',
    regionId: 'snow',
    name: 'Malaiyur Hilltop Bench',
    jpName: 'மலையூர் மலை இருக்கை',
    description: 'Watch the glowing train ribbon wind through the valley far below.',
    x: -52,
    z: -48,
    radius: 13,
  },
  {
    id: 'spot_thar_oasis',
    regionId: 'desert',
    name: 'Thar Emerald Oasis Lagoon',
    jpName: 'தார் மரகத சோலை',
    description: 'Date palms, cool turquoise desert waters, and a starlit Bedouin campfire beneath golden dunes.',
    x: DESERT_OASIS_CENTER.x,
    z: DESERT_OASIS_CENTER.z,
    radius: 26,
  },
  {
    id: 'spot_thar_pyramid',
    regionId: 'desert',
    name: 'Grand Sandstone Pyramid & Secret Chamber',
    jpName: 'தங்க சூரிய பிரமிட்',
    description: 'Climb the east processional staircase to the golden summit or step inside the torch-lit solar relic chamber.',
    x: DESERT_PYRAMID_CENTER.x,
    z: DESERT_PYRAMID_CENTER.z,
    radius: 24,
  },
  {
    id: 'spot_international_airport',
    regionId: 'airport',
    name: 'Dreamline International Airport & Runway 09',
    jpName: 'சர்வதேச விமான நிலையம்',
    description: 'Watch jetliners depart Runway 09, step inside Terminal 1, take the Underground Metro, or pilot the DL-787 Dreamliner.',
    x: AIRPORT_CENTER.x,
    z: AIRPORT_CENTER.z,
    radius: 42,
  },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lakeNormDist(x: number, z: number): number {
  const dx = (x - LAKE_CENTER.x) / LAKE_RX;
  const dz = (z - LAKE_CENTER.z) / LAKE_RZ;
  return Math.sqrt(dx * dx + dz * dz);
}

export function frozenLakeNormDist(x: number, z: number): number {
  const dx = (x - FROZEN_LAKE_CENTER.x) / FROZEN_LAKE_RX;
  const dz = (z - FROZEN_LAKE_CENTER.z) / FROZEN_LAKE_RZ;
  return Math.sqrt(dx * dx + dz * dz);
}

export function oceanShoreX(z: number): number {
  return (
    110 +
    Math.sin(z * 0.038) * 5.5 -
    smoothstep(105, 165, z) * 14 +
    (1 - smoothstep(2, 24, z)) * 18
  );
}

export function isOceanAt(x: number, z: number): boolean {
  // Dinosaur Island, its NW railway headland, and the Ocean Exhibition Complex Island rise cleanly above the sea
  if (isInsideDinosaurIslandLand(x, z)) return false;
  if (Math.hypot(x - DINOSAUR_HEADLAND_CENTER.x, z - DINOSAUR_HEADLAND_CENTER.z) < 11.5) return false;
  if (isInsideExhibitionIsland(x, z, 1.5)) return false;
  return x > oceanShoreX(z) && z > 2;
}

export function getRegionAt(x: number, z: number): RegionId {
  if (isInsideAirport(x, z, 14)) return 'airport';
  if (isInsideDesertBiome(x, z)) return 'desert';
  if (x > 64 && z > 18) return 'coastal';
  if (x < -56 && z < -36) return 'snow';
  if (x > 16 && z < 16) return 'lake_camp';
  if (z > 54 && x <= 68) return 'countryside';
  return 'sakura';
}

// Registered railway centerline samples for flat track grading
let railSamplesCache: Vec2[] = [];

export function registerRailSamplesForTerrain(samples: Vec2[]): void {
  railSamplesCache = samples;
}

function minDistToRail(x: number, z: number): number {
  if (railSamplesCache.length === 0) return 999;
  let bestSq = 999999;
  for (let i = 0; i < railSamplesCache.length; i++) {
    const p = railSamplesCache[i];
    const dx = x - p.x;
    const dz = z - p.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestSq) bestSq = dSq;
  }
  return Math.sqrt(bestSq);
}

export function distanceToRail(x: number, z: number): number {
  return minDistToRail(x, z);
}

/**
 * Deterministic multi-region terrain heightfield:
 * - Central Poongavanam Valley, En Illam Home terrace, and railway loop stay smoothly graded.
 * - Neelam Lake carves smoothly below WATER_LEVEL (-0.35m).
 * - Kadalkarai Coast slopes gracefully down to sandy beach (0.0..0.4m) and ocean bed (-2.4m).
 * - Panimalai Snow Peaks rise into crisp alpine highlands (6m..18m) with a flat winter village & frozen lake terrace (~3.2m).
 * - Pachai Vayal features gently rolling green hills + a rocky waterfall ridge in the far south-west.
 */
export function groundHeightAt(x: number, z: number): number {
  let h =
    Math.sin(x * 0.028) * Math.cos(z * 0.025) * 0.9 +
    Math.sin(x * 0.06 + z * 0.045) * 0.32 +
    0.35;

  // Malaiyur Hilltop Viewpoint (-52, -48)
  const dHill = Math.hypot(x - HILL_CENTER.x, z - HILL_CENTER.z);
  const hillMask = 1 - smoothstep(5, HILL_RADIUS, dHill);
  h += hillMask * HILL_HEIGHT;

  // Panimalai Alpine Snow Mountains (northwest beyond Malaiyur)
  const snowZone = smoothstep(-52, -96, x) * smoothstep(-32, -76, z);
  const peak1 = (1 - smoothstep(10, 56, Math.hypot(x - SNOW_PEAK_CENTER.x, z - SNOW_PEAK_CENTER.z))) * 14.5;
  const peak2 = (1 - smoothstep(8, 42, Math.hypot(x + 132, z + 64))) * 11.5;
  const peak3 = (1 - smoothstep(8, 38, Math.hypot(x + 86, z + 122))) * 12.0;
  h += snowZone * 2.8 + peak1 + peak2 + peak3;

  // Flatten Panimalai Iceland Giant Plaza & Winter Village smoothly around y = 3.2m
  const dSnowVillage = Math.hypot(x + 80, z + 82);
  const snowVillageFlat = 1 - smoothstep(22, 42, dSnowVillage);
  h = h * (1 - snowVillageFlat) + 3.2 * snowVillageFlat;

  const dFrozen = frozenLakeNormDist(x, z);
  if (dFrozen < 1.25) {
    const fMask = 1 - smoothstep(0.75, 1.25, dFrozen);
    h = h * (1 - fMask) + 2.85 * fMask;
  }

  // Expanded Frozen Kingdom Snow Biome terraces (NW -110..-280)
  if (x < -90 && z < -90) {
    const alpineWave =
      Math.sin(x * 0.022) * Math.cos(z * 0.022) * 3.4 +
      Math.sin(x * 0.048 - z * 0.036) * 1.4;
    const expandedMask = smoothstep(-95, -135, x) * smoothstep(-95, -135, z);
    h += expandedMask * Math.max(0, alpineWave + 2.6);

    // Flatten AVS Snow Residence plateau & lakeside front courtyard cleanly to AVS_SNOW_HOUSE_BASE_Y (3.2m)
    const avsMidX = AVS_SNOW_HOUSE_CENTER.x - Math.sin(AVS_SNOW_HOUSE_ROT_Y) * 5.0;
    const avsMidZ = AVS_SNOW_HOUSE_CENTER.z - Math.cos(AVS_SNOW_HOUSE_ROT_Y) * 5.0;
    const dAvs = Math.hypot(x - avsMidX, z - avsMidZ);
    const avsFlat = 1 - smoothstep(24, 38, dAvs);
    h = h * (1 - avsFlat) + AVS_SNOW_HOUSE_BASE_Y * avsFlat;

    // Flatten Winter Summit Station & Snow Village clearing
    const dSummit = Math.hypot(x - WINTER_SUMMIT_STATION_POS.x, z - WINTER_SUMMIT_STATION_POS.z);
    const summitFlat = 1 - smoothstep(14, 28, dSummit);
    h = h * (1 - summitFlat) + 3.4 * summitFlat;

    const dSnowVil = Math.hypot(x - SNOW_VILLAGE_CENTER.x, z - SNOW_VILLAGE_CENTER.z);
    const snowVilFlat = 1 - smoothstep(18, 34, dSnowVil);
    h = h * (1 - snowVilFlat) + 3.5 * snowVilFlat;

    // Flatten Frozen Mirror Lake basin
    const dMirror = Math.hypot(
      (x - FROZEN_MIRROR_LAKE_CENTER.x) / FROZEN_MIRROR_LAKE_RX,
      (z - FROZEN_MIRROR_LAKE_CENTER.z) / FROZEN_MIRROR_LAKE_RZ
    );
    if (dMirror < 1.35) {
      const mFlat = 1 - smoothstep(0.78, 1.35, dMirror);
      h = h * (1 - mFlat) + 2.85 * mFlat;
    }
  }

  // Pachai Vayal Waterfall rocky cliff behind the pool (-32, 130) & flat viewing glade (-32, 106)
  const dCliff = Math.hypot(x - WATERFALL_CENTER.x, z - (WATERFALL_CENTER.z + 20));
  const cliffRise = (1 - smoothstep(5, 16, dCliff)) * 12.0;
  h += cliffRise;
  const dWaterfallGlade = Math.hypot(x - WATERFALL_CENTER.x, z - (WATERFALL_CENTER.z - 5));
  const wfGladeFlat = 1 - smoothstep(14, 24, dWaterfallGlade);
  h = h * (1 - wfGladeFlat) + 0.25 * wfGladeFlat;

  // Flatten En Illam (My Home) scenic garden terrace at (-22, -16) to clean y = 0.0
  const dHome = Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z);
  const homeFlat = 1 - smoothstep(13, 24, dHome);
  h = h * (1 - homeFlat) + 0.0 * homeFlat;

  // Flatten Poongavanam Main Station & Nila Gramam gently
  const dStation = Math.hypot(x - MAIN_STATION_CENTER.x, z - MAIN_STATION_CENTER.z);
  const stationFlat = 1 - smoothstep(14, 34, dStation);
  h *= 1 - stationFlat * 0.92;

  const dVillage = Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z);
  const villageFlat = 1 - smoothstep(16, 36, dVillage);
  h = h * (1 - villageFlat * 0.85) + 0.12 * (villageFlat * 0.85);

  // Flatten Neelam Campsite flat clearing around (26, -4)
  const dCamp = Math.hypot(x - CAMPSITE_CENTER.x, z - CAMPSITE_CENTER.z);
  const campFlat = 1 - smoothstep(9, 17, dCamp);
  h = h * (1 - campFlat) + 0.22 * campFlat;

  // Flatten Mayavanam Enchanted Forest clearing (-102, 48) so Olga Camper Van parks & drives smoothly
  const dEnchanted = Math.hypot(x - ENCHANTED_FOREST_CENTER.x, z - ENCHANTED_FOREST_CENTER.z);
  const enchantedFlat = 1 - smoothstep(18, 34, dEnchanted);
  h = h * (1 - enchantedFlat) + 0.24 * enchantedFlat;

  // Gentle open meadow valley for Night-Only Midnight Frontier at (-72, 86)
  const dMidnight = Math.hypot(x - MIDNIGHT_FRONTIER_PORTAL_POS.x, z - MIDNIGHT_FRONTIER_PORTAL_POS.z);
  const midnightFlat = 1 - smoothstep(38, 56, dMidnight);
  h = h * (1 - midnightFlat) + 0.42 * midnightFlat;

  // Gentle glowing lotus pond depression in Enchanted Forest (-119, 33)
  const dEnchPond = Math.hypot(x - ENCHANTED_POND_CENTER.x, z - ENCHANTED_POND_CENTER.z);
  if (dEnchPond < ENCHANTED_POND_RADIUS * 1.25) {
    const pondCarve = 1 - smoothstep(ENCHANTED_POND_RADIUS * 0.55, ENCHANTED_POND_RADIUS * 1.25, dEnchPond);
    h = h * (1 - pondCarve) + -1.25 * pondCarve;
  }

  // Carve Neelam Lake basin smoothly
  const dLake = lakeNormDist(x, z);
  if (dLake < 1.28) {
    const lakeCarve = 1 - smoothstep(0.55, 1.28, dLake);
    h = h * (1 - lakeCarve) + -2.5 * lakeCarve;
  }

  // Kadalkarai Coastal town terrace -> Sandy Beach -> Ocean floor (including sea surrounding Dinosaur Island)
  if (x > 60 && z > -4) {
    const coastBlend = smoothstep(60, 82, x) * smoothstep(-4, 18, z);
    const shoreX = oceanShoreX(z);
    let coastH = 0.35;
    if (x > shoreX - 18) {
      // Smooth sandy beach slope from 0.35m down to -2.2m ocean floor
      const tBeach = smoothstep(shoreX - 18, shoreX + 12, x);
      coastH = 0.35 * (1 - tBeach) + -2.2 * tBeach;
    }
    h = h * (1 - coastBlend) + coastH * coastBlend;
  }

  // Offshore SSJ Dinosaur Island rising out of the sea at (166, 78) + NW railway station headland at (150, 57)
  const dDino = Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z);
  if (dDino < 36) {
    const islandMask = 1 - smoothstep(23.5, 34.0, dDino);
    const rockyRim =
      smoothstep(18.0, 23.0, dDino) *
      (1 - smoothstep(23.5, 28.5, dDino)) *
      (0.55 + Math.max(0, Math.sin(x * 0.24 + z * 0.19)) * 0.72);
    const dDinoStation = Math.hypot(
      x - DINOSAUR_HEADLAND_CENTER.x,
      z - DINOSAUR_HEADLAND_CENTER.z
    );
    const stationEase = 1 - smoothstep(8, 16, dDinoStation);
    const targetIslandH = 0.42 * (1 - stationEase) + 0.22 * stationEase + rockyRim * (1 - stationEase);
    h = h * (1 - islandMask) + targetIslandH * islandMask;
  }
  const dDinoHeadland = Math.hypot(
    x - DINOSAUR_HEADLAND_CENTER.x,
    z - DINOSAUR_HEADLAND_CENTER.z
  );
  if (dDinoHeadland < 16.5) {
    const headlandMask = 1 - smoothstep(8.5, 16.5, dDinoHeadland);
    h = Math.max(h, -2.2 * (1 - headlandMask) + 0.22 * headlandMask);
  }

  // Engineered Ocean Exhibition Complex Island platform rising cleanly out of deep ocean at (204, 256)
  if (isInsideExhibitionIsland(x, z, 10)) {
    const dxEdge = Math.max(EXHIBITION_ISLAND_BOUNDS.minX - x, 0, x - EXHIBITION_ISLAND_BOUNDS.maxX);
    const dzEdge = Math.max(EXHIBITION_ISLAND_BOUNDS.minZ - z, 0, z - EXHIBITION_ISLAND_BOUNDS.maxZ);
    const dSeawall = Math.hypot(dxEdge, dzEdge);
    const islandFlat = 1 - smoothstep(0.0, 9.0, dSeawall);
    h = h * (1 - islandFlat) + EXHIBITION_DECK_Y * islandFlat;
  }

  // Thar Golden Desert Oasis & Pyramid Ruins rolling dunes & oasis basin (western expanse x < -132, z > 10)
  // Applied BEFORE railway grading so the desert railway track cuts a smooth, level corridor through the dunes!
  h = applyDesertTerrainHeight(x, z, h);

  // Dreamline International Airport flat tarmac & runway plateau at northeastern expanse (215, -135)
  h = applyAirportTerrainHeight(x, z, h);

  // Grade railway corridor cleanly near y = 0.02 (without filling in Neelam Lake or the Ocean beneath the Sea Railway Bridge)
  const railD = minDistToRail(x, z);
  const lakeDistNow = lakeNormDist(x, z);
  const overOpenSea = isOceanAt(x, z);
  if (railD < 11 && lakeDistNow > 0.65 && !overOpenSea) {
    const railFlat = (1 - smoothstep(3.6, 11.0, railD)) * smoothstep(0.65, 0.92, lakeDistNow);
    h = h * (1 - railFlat) + 0.02 * railFlat;
  }

  // Flatten Panimalai Snow Summit Station (-100, -128) & Thar Desert Oasis Station (-168, 112) plazas cleanly to y = 0.02
  const dSnowStation = Math.hypot(x + 100, z + 128);
  if (dSnowStation < 30) {
    const snowStFlat = 1 - smoothstep(14.5, 30.0, dSnowStation);
    h = h * (1 - snowStFlat) + 0.02 * snowStFlat;
  }
  const dDesertStation = Math.hypot(x + 168, z - 112);
  if (dDesertStation < 26) {
    const desertStFlat = 1 - smoothstep(12.5, 26.0, dDesertStation);
    h = h * (1 - desertStFlat) + 0.02 * desertStFlat;
  }

  // Keep coastal beach bus loop flat
  if (z > 24 && z < 86 && x > -46 && x < 92) {
    const dRoad = Math.min(Math.abs(z - 29), Math.abs(z - 78));
    if (dRoad < 5.5) {
      const rf = 1 - smoothstep(2.5, 5.5, dRoad);
      h = h * (1 - rf * 0.75) + 0.14 * (rf * 0.75);
    }
  }

  return h;
}

/**
 * Walkable elevation including elevated station platforms, wooden piers,
 * AND My Home (En Illam) 1st floor (y = 0.45), climbable staircase ramp, and 2nd floor + scenic balcony (y = 3.65)!
 */
export function walkableHeightAt(x: number, z: number): number {
  const base = groundHeightAt(x, z);

  // Poongavanam main station concrete platform (x: -13.5..13.5, z: 12.1..16.5)
  if (x >= -13.6 && x <= 13.6 && z >= 12.0 && z <= 16.6) {
    return Math.max(base, 0.85);
  }

  // Pachai Meadow Halt platform (near 35.5, 16.2)
  if (Math.hypot(x - 35.5, z - 16.0) < 8.0) {
    return Math.max(base, 0.72);
  }

  // Neelam Lakeside platform
  const dAomizu = Math.hypot(x - 52, z - -4);
  if (dAomizu < 8.5) {
    return Math.max(base, 0.72);
  }

  // Thendral Malai platform
  if (x >= -24 && x <= -12 && z >= -64.5 && z <= -58.5) {
    return Math.max(base, 0.72);
  }

  // Iceland Express Halt platform (near -50.5, -18.0)
  if (Math.hypot(x - -50.5, z - -19.0) < 9.5) {
    return Math.max(base, 0.74);
  }

  // Panimalai Snow Summit Station platform (Snow Area, near -100, -128)
  if (Math.hypot(x - -101.5, z - -132.0) < 9.5) {
    return Math.max(base, 0.78);
  }

  // Thar Desert Oasis Station platform (New Desert Area, near -172, 112)
  if (
    Math.hypot(
      x - (DESERT_TRAIN_STATION_APPROX.x - 4.2),
      z - DESERT_TRAIN_STATION_APPROX.z
    ) < 9.8
  ) {
    return Math.max(base, 0.78);
  }

  // SSJ Dinosaur Island Station platform (NW headland of Dinosaur Island)
  if (
    Math.hypot(
      x - (DINOSAUR_STATION_APPROX.x - 0.8),
      z - (DINOSAUR_STATION_APPROX.z + 4.2)
    ) < 9.5
  ) {
    return Math.max(base, 0.78);
  }

  // Ocean Exhibition Complex Railway Station platform (north edge of Ocean Island)
  if (Math.hypot(x - EXHIBITION_STATION_POS.x, z - (EXHIBITION_STATION_POS.z + 3.5)) < 10.5) {
    return Math.max(base, 0.82);
  }

  // Walkable Sea Railway Bridge deck spanning across the ocean to Dinosaur Island & Ocean Exhibition Complex
  if (isOceanAt(x, z) && minDistToRail(x, z) < 2.65) {
    return Math.max(base, 0.16);
  }

  // Walkable Ocean Bus Causeway Bridge deck spanning across the sea to the Exhibition Complex
  if (isOnOceanBusCauseway(x, z)) {
    return Math.max(base, 0.44);
  }

  // Ocean Exhibition Marina Wooden Pier extending into turquoise ocean
  if (isOnExhibitionMarinaPier(x, z)) {
    return Math.max(base, 0.44);
  }

  // Neelam Lake wooden pier (x: 27..35, z: -13.5..-9.5)
  if (x >= 26.5 && x <= 35.5 && z >= -14.0 && z <= -9.5) {
    return Math.max(base, 0.18);
  }

  // Kadalkarai Fishing Harbour wooden dock (x: 106..120, z: 59..65)
  if (x >= 105.5 && x <= 120.5 && z >= 58.5 && z <= 65.5) {
    return Math.max(base, 0.28);
  }

  // Sovereign of the Tides Timber Boarding Pier extending right from Kadalkarai Shore (x: 103.5..123.0, z: 46.2..51.0)
  if (x >= 103.5 && x <= 123.0 && z >= 46.2 && z <= 51.0) {
    return Math.max(base, 0.36);
  }

  // Thar Desert Emerald Oasis Wooden Jetty
  if (isOnDesertOasisJetty(x, z)) {
    return Math.max(base, DESERT_OASIS_JETTY_BOUNDS.deckY);
  }

  // En Illam (My Home) — Two-Storey Accessible House centered at (-22, -16)
  // House local coordinates: lx = x - HOME_CENTER.x, lz = z - HOME_CENTER.z
  // Footprint: lx in [-6.2..6.2], lz in [-5.0..5.0]
  // Upstairs Balcony extends along front (+Z): lx in [-5.8..5.8], lz in [5.0..7.6]
  const lx = x - HOME_CENTER.x;
  const lz = z - HOME_CENTER.z;

  // Front porch steps (lz: 5.0..7.45, lx: -2.65..2.65 — matches porchDeck geometry)
  if (lx >= -2.65 && lx <= 2.65 && lz >= 5.0 && lz <= 7.45) {
    return Math.max(base, 0.26);
  }

  if (lx >= -6.4 && lx <= 6.4 && lz >= -5.2 && lz <= 5.2) {
    // Walkable interior staircase along east wall (lx: 3.5..5.6, lz: -3.2..2.2)
    // Climbs from y = 0.45 at lz = 2.2 up to y = 3.65 at lz = -3.2!
    if (lx >= 3.4 && lx <= 5.7 && lz >= -3.6 && lz <= 2.4) {
      const tStair = Math.max(0, Math.min(1, (2.2 - lz) / 5.4));
      return 0.45 + tStair * 3.2;
    }
    return Math.max(base, 0.45);
  }

  return base;
}

/**
 * Floor-aware walkable height used when player is upstairs in En Illam
 * (Bedroom + 2nd-floor Balcony + Exterior East Helipad Staircase + Rooftop Helipad Deck at y = 10.4m).
 */
export function walkableHeightWithFloor(x: number, z: number, currentY: number): number {
  const lx = x - HOME_CENTER.x;
  const lz = z - HOME_CENTER.z;
  const insideHomeComplex = lx >= -6.6 && lx <= 8.35 && lz >= -6.2 && lz <= 7.8;

  if (insideHomeComplex && currentY > 2.35) {
    // 1. Rooftop Helipad Deck (circular r = 5.6m centered at local 0,0) + East Skywalk Bridge (y = 10.4m)
    if (currentY > 8.6) {
      if (Math.hypot(lx, lz) <= 5.65) {
        return 10.4;
      }
      if (lx >= 3.8 && lx <= 8.2 && lz >= -4.7 && lz <= -1.7) {
        return 10.4;
      }
    }

    // 2. Exterior East Helipad Staircase (connects 2nd-floor east balcony lz: 6.2 -> -3.8, climbing y: 3.65 -> 10.4m)
    if (lx >= 5.75 && lx <= 8.2 && lz >= -4.5 && lz <= 7.5) {
      if (lz >= 6.2) {
        return 3.65;
      }
      const tHeli = Math.max(0, Math.min(1, (6.2 - lz) / 10.0));
      return 3.65 + tHeli * (10.4 - 3.65);
    }

    // 2B. 3rd Floor Hero Character-Switching Hall (y = 7.0m, accessed off East Staircase mid-landing at lz: 0.0..2.4!)
    if (currentY >= 5.6 && currentY <= 8.6 && lx >= -6.2 && lx <= 6.2 && lz >= -5.0 && lz <= 5.2) {
      return 7.0;
    }

    // 3. Interior staircase descent zone (Ground <-> 2nd Floor)
    if (currentY < 5.6 && lx >= 3.4 && lx <= 5.7 && lz >= -3.6 && lz <= 2.4) {
      const tStair = Math.max(0, Math.min(1, (2.2 - lz) / 5.4));
      return 0.45 + tStair * 3.2;
    }

    // 4. Second floor bedroom + hallway + front scenic balcony (lz up to 7.5!)
    if (currentY < 5.6 && lx >= -6.2 && lx <= 6.2 && lz >= -5.0 && lz <= 7.5) {
      return 3.65;
    }
  }

  const avsY = getAvsSnowHouseFloorHeight(x, z, currentY);
  if (avsY !== null) {
    return Math.max(walkableHeightAt(x, z), avsY);
  }

  const exhibitionY = getExhibitionComplexFloorHeight(x, z, currentY);
  if (exhibitionY !== null) {
    return Math.max(walkableHeightAt(x, z), exhibitionY);
  }

  const desertY = getDesertStructureFloorHeight(x, z, currentY);
  if (desertY !== null) {
    return desertY;
  }

  const airportY = getAirportFloorHeight(x, z);
  if (airportY !== null) {
    return airportY;
  }

  return walkableHeightAt(x, z);
}

export function isWaterAt(x: number, z: number): boolean {
  // Wooden piers, Sovereign Boarding Pier, Desert Oasis Jetty, Ocean Bus Causeway, Marina Pier, and the Sea Railway Bridge deck are walkable over water!
  if (x >= 26.5 && x <= 35.5 && z >= -14.0 && z <= -9.5) return false;
  if (x >= 105.5 && x <= 120.5 && z >= 58.5 && z <= 65.5) return false;
  if (x >= 103.5 && x <= 123.0 && z >= 46.2 && z <= 51.0) return false;
  if (isOnDesertOasisJetty(x, z)) return false;
  if (isOceanAt(x, z) && minDistToRail(x, z) < 2.65) return false;
  if (isOnOceanBusCauseway(x, z)) return false;
  if (isOnExhibitionMarinaPier(x, z)) return false;
  if (isInsideExhibitionIsland(x, z, 0.5)) return false;
  return groundHeightAt(x, z) < WATER_LEVEL - 0.16;
}

/**
 * True when the player is wading/swimming in Neelam Lake or Kadalkarai Ocean
 * (excluding wooden piers/docks).
 */
export function isSwimmableWaterAt(x: number, z: number): boolean {
  return isWaterAt(x, z);
}

export function getLocationAt(x: number, z: number): LocationInfo {
  let best = LOCATIONS[0];
  let bestDist = Infinity;
  for (const loc of LOCATIONS) {
    const d = Math.hypot(x - loc.x, z - loc.z);
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  }
  if (bestDist < 36) return best;

  const region = getRegionAt(x, z);
  const match = LOCATIONS.find((l) => l.regionId === region);
  return match ?? LOCATIONS[0];
}

export function resolvePlayerCollision(
  nextX: number,
  nextZ: number,
  prevX: number,
  prevZ: number,
  radius: number,
  colliders: AabbCollider[],
  currentY = 0,
  allowWater = false
): { x: number; z: number; collided: boolean } {
  let x = nextX;
  let z = nextZ;
  let collided = false;

  const distFromCenter = Math.hypot(x, z);
  if (distFromCenter > WORLD_PLAYABLE_RADIUS) {
    const scale = WORLD_PLAYABLE_RADIUS / distFromCenter;
    x *= scale;
    z *= scale;
    collided = true;
  }

  // Keep player safely inside balcony, helipad stairs, and rooftop helipad railings when elevated in En Illam!
  const prevLx = prevX - HOME_CENTER.x;
  const prevLz = prevZ - HOME_CENTER.z;
  const wasInsideHome = prevLx >= -6.8 && prevLx <= 8.5 && prevLz >= -6.2 && prevLz <= 8.0;
  if (wasInsideHome && currentY > 2.35) {
    const lx = x - HOME_CENTER.x;
    const lz = z - HOME_CENTER.z;
    if (currentY > 8.6) {
      // On En Illam Rooftop Helipad Deck (r <= 5.35) or East Skywalk Bridge + Stair Top
      const onDeck = Math.hypot(lx, lz) <= 5.35;
      const onBridgeOrTopStair = lx >= 4.0 && lx <= 7.85 && lz >= -4.35 && lz <= -1.9;
      const headingDownStair = lx >= 6.15 && lx <= 7.85 && lz >= -4.35 && lz <= 6.8;
      if (!onDeck && !onBridgeOrTopStair && !headingDownStair) {
        x = prevX;
        z = prevZ;
        collided = true;
      }
    } else if (currentY >= 5.6 && prevLx < 5.95) {
      // On 3rd Floor Hero Character-Switching Hall (y = 7.0m) — open east doorway out to East Staircase at lz: 0.0..2.5!
      const maxAllowedLx = lz >= 0.0 && lz <= 2.5 ? 7.85 : 5.6;
      const clampedLx = Math.max(-5.6, Math.min(maxAllowedLx, lx));
      const clampedLz = Math.max(-4.5, Math.min(4.6, lz));
      if (clampedLx !== lx || clampedLz !== lz) {
        x = HOME_CENTER.x + clampedLx;
        z = HOME_CENTER.z + clampedLz;
        collided = true;
      }
    } else if (prevLx >= 5.7 || (lx >= 5.6 && lz >= 5.4 && lz <= 7.3)) {
      // On the Exterior East Helipad Staircase / East Balcony Entry Landing / 3rd Floor Mid-Landing Doorway
      const inBalconyDoor = lx >= -5.6 && lx <= 7.85 && lz >= 5.45 && lz <= 7.25 && currentY < 4.5;
      const inThirdFloorDoor = lx >= -5.6 && lx <= 7.85 && lz >= 0.0 && lz <= 2.5 && currentY >= 5.8 && currentY <= 8.4;
      const onHeliStair = lx >= 6.15 && lx <= 7.85 && lz >= -4.35 && lz <= 7.25;
      if (!inBalconyDoor && !inThirdFloorDoor && !onHeliStair) {
        x = prevX;
        z = prevZ;
        collided = true;
      }
    } else {
      // On 2nd Floor Bedroom / Balcony — allow open doorway out to East Helipad Stairs at lz: 5.55..7.2!
      const maxAllowedLx = lz >= 5.55 && lz <= 7.2 ? 7.85 : 5.6;
      const clampedLx = Math.max(-5.6, Math.min(maxAllowedLx, lx));
      const clampedLz = Math.max(-4.5, Math.min(7.1, lz));
      if (clampedLx !== lx || clampedLz !== lz) {
        x = HOME_CENTER.x + clampedLx;
        z = HOME_CENTER.z + clampedLz;
        collided = true;
      }
    }
  }

  if (!allowWater && isWaterAt(x, z)) {
    if (!isWaterAt(prevX, z)) {
      x = prevX;
      collided = true;
    } else if (!isWaterAt(x, prevZ)) {
      z = prevZ;
      collided = true;
    } else {
      x = prevX;
      z = prevZ;
      collided = true;
    }
  }

  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    // Respect vertical collider bounds so downstairs walls don't block 2nd-floor balcony or vice versa!
    if (c.maxY !== undefined && currentY > c.maxY) continue;
    if (c.minY !== undefined && currentY + 1.5 < c.minY) continue;

    const minX = c.minX - radius;
    const maxX = c.maxX + radius;
    const minZ = c.minZ - radius;
    const maxZ = c.maxZ + radius;
    if (x > minX && x < maxX && z > minZ && z < maxZ) {
      collided = true;
      const penLeft = Math.abs(x - minX);
      const penRight = Math.abs(maxX - x);
      const penTop = Math.abs(z - minZ);
      const penBottom = Math.abs(maxZ - z);
      const minPen = Math.min(penLeft, penRight, penTop, penBottom);
      if (minPen === penLeft) x = minX;
      else if (minPen === penRight) x = maxX;
      else if (minPen === penTop) z = minZ;
      else z = maxZ;
    }
  }

  return { x, z, collided };
}
