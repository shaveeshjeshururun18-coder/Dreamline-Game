export interface CaveChamber {
  id: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  name: string;
  tamilName: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  ceilingHeight: number;
  accentHex: number;
  hasLake?: boolean;
  lakeRadius?: number;
}

export interface CavePassage {
  from: { x: number; z: number };
  to: { x: number; z: number };
  halfWidth: number;
  ceilingHeight: number;
}

export interface CaveEntrance {
  id: string;
  name: string;
  tamilName: string;
  surfaceX: number;
  surfaceZ: number;
  caveX: number;
  caveZ: number;
  targetChamberId: string;
  description: string;
}

/**
 * MAJOR WORLD EXPANSION — THE FROZEN KINGDOM (NW Alpine Snow Biome + AVS Snow Residence + 6-Area Underground Caves)
 */
export const AVS_SNOW_HOUSE_CENTER = { x: -158, z: -140 } as const;
export const AVS_SNOW_HOUSE_SCALE = 1.62; // Bigger grander reconstruction inside the expanded snow place
export const AVS_SNOW_HOUSE_BASE_Y = 3.2;

export const FROZEN_MIRROR_LAKE_CENTER = { x: -196, z: -162 } as const;
export const FROZEN_MIRROR_LAKE_RX = 28;
export const FROZEN_MIRROR_LAKE_RZ = 22;

/**
 * Rotation (radians around Y) so the AVS Snow Residence front porch, red entrance steps,
 * 3-bay window, and cantilevered balcony face directly toward Frozen Mirror Lake!
 */
export const AVS_SNOW_HOUSE_ROT_Y = Math.atan2(
  FROZEN_MIRROR_LAKE_CENTER.x - AVS_SNOW_HOUSE_CENTER.x,
  FROZEN_MIRROR_LAKE_CENTER.z - AVS_SNOW_HOUSE_CENTER.z
);

export function avsLocalToWorld(lx: number, lz: number): { x: number; z: number } {
  const cosR = Math.cos(AVS_SNOW_HOUSE_ROT_Y);
  const sinR = Math.sin(AVS_SNOW_HOUSE_ROT_Y);
  return {
    x: AVS_SNOW_HOUSE_CENTER.x + (lx * cosR + lz * sinR) * AVS_SNOW_HOUSE_SCALE,
    z: AVS_SNOW_HOUSE_CENTER.z + (-lx * sinR + lz * cosR) * AVS_SNOW_HOUSE_SCALE,
  };
}

/**
 * Unobstructed lakeside front courtyard right outside the AVS Snow Residence red steps,
 * overlooking Frozen Mirror Lake with zero trees blocking the view.
 */
export const AVS_SNOW_HOUSE_FRONT_PLAZA = {
  x: Number((AVS_SNOW_HOUSE_CENTER.x + Math.sin(AVS_SNOW_HOUSE_ROT_Y) * 10.5).toFixed(2)),
  z: Number((AVS_SNOW_HOUSE_CENTER.z + Math.cos(AVS_SNOW_HOUSE_ROT_Y) * 10.5).toFixed(2)),
} as const;

export const FROZEN_MIRROR_PIER_POS = {
  x: Number((AVS_SNOW_HOUSE_CENTER.x + Math.sin(AVS_SNOW_HOUSE_ROT_Y) * 21.0).toFixed(2)),
  z: Number((AVS_SNOW_HOUSE_CENTER.z + Math.cos(AVS_SNOW_HOUSE_ROT_Y) * 21.0).toFixed(2)),
} as const;

export const FROZEN_WATERFALL_POS = { x: -226, z: -124 } as const;
export const SNOW_VILLAGE_CENTER = { x: -136, z: -164 } as const;
export const SNOW_OBSERVATION_DECK_POS = { x: -172, z: -206 } as const;
export const SNOW_MOUNTAIN_BRIDGE_POS = { x: -160, z: -182 } as const;
export const WINTER_SUMMIT_STATION_POS = { x: -112, z: -138 } as const;

export interface SnowPathSegment {
  id: string;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  width: number;
}

/**
 * Clearly visible stone-flagstone & lantern-lined snowy walking pathways
 * linking Winter Summit Station, AVS Snow Residence, Frozen Mirror Lake Pier,
 * Snow Village, Mountain Bridge, Observation Deck, and Mountain Cave Entrances.
 */
export const SNOW_PATH_SEGMENTS: SnowPathSegment[] = [
  { id: 'path_station_cave', ax: -112, az: -138, bx: -124, bz: -126, width: 3.4 },
  { id: 'path_station_jct', ax: -112, az: -138, bx: -146, bz: -152, width: 3.6 },
  {
    id: 'path_jct_avs_plaza',
    ax: -146,
    az: -152,
    bx: AVS_SNOW_HOUSE_FRONT_PLAZA.x,
    bz: AVS_SNOW_HOUSE_FRONT_PLAZA.z,
    width: 3.8,
  },
  {
    id: 'path_avs_to_mirror_pier',
    ax: AVS_SNOW_HOUSE_FRONT_PLAZA.x,
    az: AVS_SNOW_HOUSE_FRONT_PLAZA.z,
    bx: FROZEN_MIRROR_PIER_POS.x,
    bz: FROZEN_MIRROR_PIER_POS.z,
    width: 3.8,
  },
  { id: 'path_jct_village', ax: -146, az: -152, bx: -136, bz: -164, width: 3.4 },
  { id: 'path_village_bridge', ax: -136, az: -164, bx: -160, bz: -182, width: 3.4 },
  { id: 'path_bridge_deck', ax: -160, az: -182, bx: -172, bz: -206, width: 3.2 },
  { id: 'path_cave_panimalai', ax: -124, az: -126, bx: -102, bz: -96, width: 3.4 },
];

/**
 * Underground Cave Network elevation floor — completely beneath the Frozen Kingdom mountains!
 */
export const CAVE_FLOOR_Y = -28.0;

export const CAVE_CHAMBERS: CaveChamber[] = [
  {
    id: 'cave_main_crystal',
    code: 'A',
    name: 'Area A · Main Crystal Cavern',
    tamilName: 'முதன்மை படிக குகை',
    subtitle: 'Tall rock vault glowing with blue & turquoise crystals and reflective pools',
    x: -148,
    z: -142,
    radius: 30,
    ceilingHeight: 16,
    accentHex: 0x38e4ff,
    hasLake: true,
    lakeRadius: 11,
  },
  {
    id: 'cave_frozen_cavern',
    code: 'B',
    name: 'Area B · Frozen Cavern',
    tamilName: 'பனிப்பாறை குகை',
    subtitle: 'Massive ice formations, frozen waterfalls, and glowing translucent blue ice walls',
    x: -206,
    z: -128,
    radius: 27,
    ceilingHeight: 15,
    accentHex: 0x8de4ff,
  },
  {
    id: 'cave_underground_lake',
    code: 'C',
    name: 'Area C · Underground Lake',
    tamilName: 'பாதாள ஏரி',
    subtitle: 'Vast luminous subterranean lake ringed with crystals and natural islands',
    x: -198,
    z: -190,
    radius: 33,
    ceilingHeight: 18,
    accentHex: 0x2ec4e8,
    hasLake: true,
    lakeRadius: 21,
  },
  {
    id: 'cave_crystal_forest',
    code: 'D',
    name: 'Area D · Crystal Forest',
    tamilName: 'படிகக் காடு',
    subtitle: 'Towering crystal groves, stone pillars, glowing subterranean flora, and drifting motes',
    x: -132,
    z: -202,
    radius: 29,
    ceilingHeight: 17,
    accentHex: 0x5df2d6,
  },
  {
    id: 'cave_hidden_passages',
    code: 'E',
    name: 'Area E · Hidden Cave Passages',
    tamilName: 'மறைந்த குகைப் பாதைகள்',
    subtitle: 'Winding interconnected tunnels, underground streams, and elevated viewpoints',
    x: -168,
    z: -172,
    radius: 18,
    ceilingHeight: 12,
    accentHex: 0x7dd3fc,
  },
  {
    id: 'cave_grand_chamber',
    code: 'F',
    name: 'Area F · Grand Underground Chamber',
    tamilName: 'மாபெரும் பாதாள அரங்கம்',
    subtitle: 'Cathedral-scale cavern with giant stalactites, underground waterfalls, and central lake',
    x: -168,
    z: -248,
    radius: 40,
    ceilingHeight: 24,
    accentHex: 0x67e8f9,
    hasLake: true,
    lakeRadius: 19,
  },
];

export const CAVE_PASSAGES: CavePassage[] = [
  // Area A <-> Area B (Crystal Cavern to Frozen Cavern)
  { from: { x: -148, z: -142 }, to: { x: -206, z: -128 }, halfWidth: 7.5, ceilingHeight: 9.5 },
  // Area A <-> Area E (Crystal Cavern to Hidden Passages Hub)
  { from: { x: -148, z: -142 }, to: { x: -168, z: -172 }, halfWidth: 7.5, ceilingHeight: 9.5 },
  // Area B <-> Area C (Frozen Cavern to Underground Lake)
  { from: { x: -206, z: -128 }, to: { x: -198, z: -190 }, halfWidth: 7.5, ceilingHeight: 10.0 },
  // Area E <-> Area C (Hidden Hub to Underground Lake)
  { from: { x: -168, z: -172 }, to: { x: -198, z: -190 }, halfWidth: 7.5, ceilingHeight: 9.5 },
  // Area E <-> Area D (Hidden Hub to Crystal Forest)
  { from: { x: -168, z: -172 }, to: { x: -132, z: -202 }, halfWidth: 7.5, ceilingHeight: 9.5 },
  // Area A <-> Area D (Crystal Cavern to Crystal Forest)
  { from: { x: -148, z: -142 }, to: { x: -132, z: -202 }, halfWidth: 7.2, ceilingHeight: 9.5 },
  // Area C <-> Area F (Underground Lake to Grand Underground Chamber)
  { from: { x: -198, z: -190 }, to: { x: -168, z: -248 }, halfWidth: 8.5, ceilingHeight: 11.5 },
  // Area D <-> Area F (Crystal Forest to Grand Underground Chamber)
  { from: { x: -132, z: -202 }, to: { x: -168, z: -248 }, halfWidth: 8.5, ceilingHeight: 11.5 },
  // Area E <-> Area F (Direct Central Passage into Grand Cathedral)
  { from: { x: -168, z: -172 }, to: { x: -168, z: -248 }, halfWidth: 7.5, ceilingHeight: 11.0 },
];

export const CAVE_ENTRANCES: CaveEntrance[] = [
  {
    id: 'entrance_mountain_mouth',
    name: 'Snow Mountain Cave Opening',
    tamilName: 'பனிமலை குகை நுழைவு',
    surfaceX: -124,
    surfaceZ: -126,
    caveX: -140,
    caveZ: -134,
    targetChamberId: 'cave_main_crystal',
    description: 'Grand stone archway carved into the snowy peak beside the AVS Snow Residence',
  },
  {
    id: 'entrance_frozen_waterfall',
    name: 'Behind the Frozen Waterfall',
    tamilName: 'உறைந்த நீர்வீழ்ச்சி குகை',
    surfaceX: -222,
    surfaceZ: -126,
    caveX: -206,
    caveZ: -126,
    targetChamberId: 'cave_frozen_cavern',
    description: 'Shimmering blue ice curtain concealing the Frozen Cavern',
  },
  {
    id: 'entrance_frozen_lake',
    name: 'Mirror Ice Lake Grotto',
    tamilName: 'பனி ஏரி குகை',
    surfaceX: -196,
    surfaceZ: -186,
    caveX: -196,
    caveZ: -180,
    targetChamberId: 'cave_underground_lake',
    description: 'Crystalline cavern opening along the north rim of Frozen Mirror Lake',
  },
  {
    id: 'entrance_snow_forest',
    name: 'Snowy Pine Forest Hollow',
    tamilName: 'பனிக்காடு குகை',
    surfaceX: -130,
    surfaceZ: -196,
    caveX: -132,
    caveZ: -196,
    targetChamberId: 'cave_crystal_forest',
    description: 'Lantern-lit hollow among snow-laden pines descending into the Crystal Forest',
  },
  {
    id: 'entrance_summit_trail',
    name: 'Summit Trail Cathedral Arch',
    tamilName: 'சிகரப் பாதை குகை',
    surfaceX: -170,
    surfaceZ: -214,
    caveX: -168,
    caveZ: -230,
    targetChamberId: 'cave_grand_chamber',
    description: 'Hidden alpine trail arch leading directly to the Grand Underground Chamber',
  },
];

function distToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  if (lenSq < 1e-6) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
  return Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
}

/**
 * Returns true if (x, z) lies cleanly inside any walkable chamber or connecting passage of the Underground Cave World.
 */
export function isPointInsideCaveWorld(x: number, z: number): boolean {
  for (let i = 0; i < CAVE_CHAMBERS.length; i++) {
    const c = CAVE_CHAMBERS[i];
    if (Math.hypot(x - c.x, z - c.z) <= c.radius - 1.6) {
      return true;
    }
  }
  for (let i = 0; i < CAVE_PASSAGES.length; i++) {
    const p = CAVE_PASSAGES[i];
    if (distToSegment(x, z, p.from.x, p.from.z, p.to.x, p.to.z) <= p.halfWidth - 1.2) {
      return true;
    }
  }
  return false;
}

/**
 * Identifies the closest named Underground Cave Area (Areas A–F) for HUD location display & audio ambiance.
 */
export function getCaveChamberAt(x: number, z: number): CaveChamber {
  let best = CAVE_CHAMBERS[0];
  let bestScore = Infinity;
  for (let i = 0; i < CAVE_CHAMBERS.length; i++) {
    const c = CAVE_CHAMBERS[i];
    const d = Math.hypot(x - c.x, z - c.z) / c.radius;
    if (d < bestScore) {
      bestScore = d;
      best = c;
    }
  }
  return best;
}

/**
 * Smooth multi-elevation walkable floor height inside the 6-Area Underground Cave World.
 * Includes raised viewing decks in the Grand Chamber and gentle rocky trails around underground lakes.
 */
export function getCaveFloorHeightAt(x: number, z: number): number {
  let y = CAVE_FLOOR_Y;

  // Subtle natural stone undulation
  y += Math.sin(x * 0.09) * Math.cos(z * 0.08) * 0.24;

  // Elevated scenic viewing rim along the south/east edge of the Grand Underground Chamber (Area F)
  const grand = CAVE_CHAMBERS[5];
  const dGrand = Math.hypot(x - grand.x, z - grand.z);
  if (dGrand < grand.radius && dGrand > 21 && z > grand.z - 6) {
    const ramp = Math.min(1, Math.max(0, (dGrand - 21) / 8));
    y = Math.max(y, CAVE_FLOOR_Y + ramp * 2.4);
  }

  // Stone walkways & island bridges across Area C Underground Lake and Area F Central Lake
  const lakeC = CAVE_CHAMBERS[2];
  const dLakeC = Math.hypot(x - lakeC.x, z - lakeC.z);
  if (dLakeC < 19.5) {
    // Natural central crystal island & stone causeway across the lake
    const onCauseway = Math.abs(x - lakeC.x) < 3.4 || Math.abs(z - lakeC.z) < 3.4;
    if (dLakeC < 7.2 || onCauseway) {
      y = CAVE_FLOOR_Y + 0.42;
    } else {
      y = CAVE_FLOOR_Y - 0.12; // shallow reflective luminous pool
    }
  }

  // Elevated viewpoint ledge inside Area E Hidden Passages
  const hubE = CAVE_CHAMBERS[4];
  if (Math.hypot(x - (hubE.x + 8), z - hubE.z) < 5.5) {
    y = CAVE_FLOOR_Y + 1.35;
  }

  return y;
}

/**
 * Returns whether the player is currently standing in the expanded Frozen Kingdom snow biome.
 */
export function isInFrozenKingdom(x: number, z: number): boolean {
  return x < -56 && z < -36;
}

/**
 * World-space center of the rooftop helipad perched directly on top of the expanded AVS Snow Residence.
 */
export const AVS_HELIPAD_WORLD_POS = {
  x: Number((AVS_SNOW_HOUSE_CENTER.x + -5.8 * Math.sin(AVS_SNOW_HOUSE_ROT_Y) * AVS_SNOW_HOUSE_SCALE).toFixed(2)),
  y: Number((AVS_SNOW_HOUSE_BASE_Y + 7.55 * AVS_SNOW_HOUSE_SCALE).toFixed(2)),
  z: Number((AVS_SNOW_HOUSE_CENTER.z + -5.8 * Math.cos(AVS_SNOW_HOUSE_ROT_Y) * AVS_SNOW_HOUSE_SCALE).toFixed(2)),
} as const;

/**
 * Shared tree/obstacle exclusion check for ALL Frozen Kingdom tree generators.
 * Keeps AVS Snow Residence, its lakeside front courtyard, Frozen Mirror Lake,
 * all stone walking pathways, Snow Village, Winter Summit Station, and Cave Entrances 100% unobstructed!
 */
export function isNearFrozenKingdomClearing(x: number, z: number): boolean {
  // House footprint & rear mass (shifted along -front axis)
  const houseMidX = AVS_SNOW_HOUSE_CENTER.x - Math.sin(AVS_SNOW_HOUSE_ROT_Y) * 8.5;
  const houseMidZ = AVS_SNOW_HOUSE_CENTER.z - Math.cos(AVS_SNOW_HOUSE_ROT_Y) * 8.5;
  if (Math.hypot(x - houseMidX, z - houseMidZ) < 28) return true;
  if (Math.hypot(x - AVS_SNOW_HOUSE_CENTER.x, z - AVS_SNOW_HOUSE_CENTER.z) < 26) return true;
  if (Math.hypot(x - AVS_SNOW_HOUSE_FRONT_PLAZA.x, z - AVS_SNOW_HOUSE_FRONT_PLAZA.z) < 22) return true;
  if (Math.hypot(x - FROZEN_MIRROR_PIER_POS.x, z - FROZEN_MIRROR_PIER_POS.z) < 18) return true;

  // Frozen Mirror Lake & shore promenade
  if (Math.hypot(x - FROZEN_MIRROR_LAKE_CENTER.x, z - FROZEN_MIRROR_LAKE_CENTER.z) < 35) return true;

  // Snow Village, Winter Summit Station, Bridge, Observation Deck
  if (Math.hypot(x - SNOW_VILLAGE_CENTER.x, z - SNOW_VILLAGE_CENTER.z) < 22) return true;
  if (Math.hypot(x - WINTER_SUMMIT_STATION_POS.x, z - WINTER_SUMMIT_STATION_POS.z) < 18) return true;
  if (Math.hypot(x - SNOW_MOUNTAIN_BRIDGE_POS.x, z - SNOW_MOUNTAIN_BRIDGE_POS.z) < 14) return true;
  if (Math.hypot(x - SNOW_OBSERVATION_DECK_POS.x, z - SNOW_OBSERVATION_DECK_POS.z) < 14) return true;

  // All 5 Cave Entrances
  for (let i = 0; i < CAVE_ENTRANCES.length; i++) {
    const ent = CAVE_ENTRANCES[i];
    if (Math.hypot(x - ent.surfaceX, z - ent.surfaceZ) < 12) return true;
  }

  // Every visible stone-flagstone walking pathway segment
  for (let i = 0; i < SNOW_PATH_SEGMENTS.length; i++) {
    const seg = SNOW_PATH_SEGMENTS[i];
    if (distToSegment(x, z, seg.ax, seg.az, seg.bx, seg.bz) < seg.width * 0.5 + 7.2) {
      return true;
    }
  }

  return false;
}

/**
 * Multi-floor walkable heightfield for the expanded (1.62x bigger!) AVS Snow Residence
 * rotated to face directly toward Frozen Mirror Lake!
 * Supports:
 * - 6 exterior red-tiled front steps climbing to raised plinth
 * - Ground floor porch, foyer, living/office hall, rear kitchen, teal bathroom
 * - 12 interior granite stairs climbing smoothly to the 1st-floor cantilevered yellow-trimmed balcony!
 */
export function getAvsSnowHouseFloorHeight(
  x: number,
  z: number,
  currentY: number
): number | null {
  const S = AVS_SNOW_HOUSE_SCALE;
  // Convert world coords into rotated AVS house local unscaled coordinates
  const dx = (x - AVS_SNOW_HOUSE_CENTER.x) / S;
  const dz = (z - AVS_SNOW_HOUSE_CENTER.z) / S;
  const cosR = Math.cos(AVS_SNOW_HOUSE_ROT_Y);
  const sinR = Math.sin(AVS_SNOW_HOUSE_ROT_Y);
  const lx = dx * cosR - dz * sinR;
  const lz = dx * sinR + dz * cosR;

  const W = 4.6;
  const D = 11.8;
  const P = 0.96;
  const H1 = 3.15;
  const BProj = 1.45;
  const halfW = W / 2;
  const rightPassageW = 1.68;
  const frontPorchDepth = 1.65;

  // Quick bounding check (expanded to cover exterior East Helipad Staircase & circular Rooftop Helipad r=3.35)
  if (lx < -3.7 || lx > 3.75 || lz > 2.0 || lz < -D - 0.2) {
    return null;
  }

  const baseY = AVS_SNOW_HOUSE_BASE_Y;
  const localFootY = (currentY - baseY) / S;

  // 0. Rooftop Helipad Deck (localY = 7.59, centered at (0, -5.8), r = 3.35) + East Skywalk Bridge + Exterior Helipad Staircase!
  const slabTopY = P + H1 + 0.18; // 4.29
  const heliDeckLocalY = slabTopY + 2.65 + 0.54 + 0.11; // 7.59
  const heliPadZ = -5.8;

  if (localFootY >= heliDeckLocalY - 0.85) {
    // Circular AVS Rooftop Helipad Deck
    if (Math.hypot(lx, lz - heliPadZ) <= 3.55) {
      return baseY + heliDeckLocalY * S;
    }
    // Top Rooftop Bridge connecting exterior staircase to the circular helipad
    if (lx >= 1.65 && lx <= 3.65 && lz >= -6.9 && lz <= -4.7) {
      return baseY + heliDeckLocalY * S;
    }
  }

  // Exterior East Helipad Staircase climbing from East 1st-Floor Balcony (lz = -0.1, y = 4.29) -> Rooftop Bridge (lz = -4.9, y = 7.59)
  if (localFootY >= slabTopY - 0.65 && lx >= 2.15 && lx <= 3.65 && lz >= -5.05 && lz <= 1.35) {
    if (lz >= -0.1) {
      return baseY + slabTopY * S;
    }
    const tHeli = Math.max(0, Math.min(1, (-0.1 - lz) / 4.8));
    return baseY + (slabTopY + tHeli * (heliDeckLocalY - slabTopY)) * S;
  }

  // 1. Upper 1st-floor slab & cantilevered yellow-trimmed balcony
  if (localFootY >= slabTopY - 0.58) {
    if (lx >= -halfW - 0.08 && lx <= halfW + 0.08 && lz <= BProj && lz >= -D) {
      const inStairOpening =
        lx > halfW - rightPassageW + 0.15 &&
        lz < -frontPorchDepth - 0.45 &&
        lz > -frontPorchDepth - 3.65;
      if (!inStairOpening) {
        return baseY + slabTopY * S;
      }
    }
  }

  // 2. 12 Interior Granite Stairs rising from Foyer to 1st floor
  const intStairMinX = halfW - 0.23 - 0.95;
  const intStairMaxX = halfW - 0.15;
  const intStairStartZ = -frontPorchDepth - 0.45;
  const intStairEndZ = intStairStartZ - 3.0;
  if (
    lx >= intStairMinX &&
    lx <= intStairMaxX &&
    lz <= intStairStartZ &&
    lz >= intStairEndZ
  ) {
    const t = Math.max(0, Math.min(1, (intStairStartZ - lz) / (intStairStartZ - intStairEndZ)));
    return baseY + (P + t * (H1 + 0.18)) * S;
  }

  // 3. 6 Exterior Red-Tiled Entrance Steps on right frontage
  const extStairMinX = halfW - rightPassageW - 0.08;
  const extStairMaxX = halfW - 0.04;
  if (lx >= extStairMinX && lx <= extStairMaxX && lz <= 1.78 && lz >= -0.05) {
    const t = Math.max(0, Math.min(1, (1.68 - lz) / 1.68));
    return baseY + t * P * S;
  }

  // 4. Raised Left Forecourt Platform
  if (lx >= -halfW && lx <= halfW - rightPassageW + 0.1 && lz >= 0 && lz <= 1.55) {
    return baseY + (P - 0.1) * S;
  }

  // 5. Main Ground Floor Footprint (Porch, Foyer, Living/Office, Kitchen, Bathroom)
  if (lx >= -halfW && lx <= halfW && lz <= 0.05 && lz >= -D) {
    return baseY + P * S;
  }

  return null;
}
