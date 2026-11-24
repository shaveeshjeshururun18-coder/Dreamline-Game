/**
 * Thar Golden Desert Oasis & Pyramid Ruins (பாலைவன சோலை) — Pure Spatial Logic Module
 *
 * Completely decoupled from Three.js for deterministic unit testing and terrain/walkability sync.
 * Located in the wide-open western desert expanse beyond Mayavanam Enchanted Forest:
 * - Rolling wind-sculpted golden sand dunes (ideal for Safari 4x4 & Camper Van dune-bashing)
 * - Emerald Oasis Lagoon (swimmable turquoise water + walkable timber jetty + 24 date palms)
 * - Starlit Bedouin Nomad Camp (pavilion tent, glowing campfire, caravan carpets & lanterns)
 * - Grand 6-Tier Stepped Sandstone Pyramid with BOTH:
 *     1) Walkable East Processional Staircase climbing to the 14.65m Golden Sun Summit
 *     2) Walkable South Portal leading into a Torch-Lit Secret Burial & Solar Relic Chamber
 * - Elevated Sandstone Desert Helipad integrated into the Sky Taxi patrol & mobile hailing network
 */

export const DESERT_BIOME_CENTER = { x: -222, z: 126 } as const;

export const DESERT_OASIS_CENTER = { x: -206, z: 112 } as const;
export const DESERT_OASIS_RX = 20.0;
export const DESERT_OASIS_RZ = 14.5;

export const DESERT_OASIS_SPAWN = { x: -187.5, z: 112.0 } as const;
export const DESERT_OASIS_CAMP_POS = { x: -183.0, z: 102.0 } as const;
export const DESERT_CAMPFIRE_POS = { x: -185.5, z: 105.5 } as const;

export const DESERT_PYRAMID_CENTER = { x: -244, z: 144 } as const;
export const DESERT_PYRAMID_BASE_Y = 0.65;
export const DESERT_PYRAMID_CHAMBER_Y = 0.85;
export const DESERT_PYRAMID_SUMMIT_Y = DESERT_PYRAMID_BASE_Y + 14.0; // 14.65m
export const DESERT_PYRAMID_BASE_HALF = 17.5;

export const DESERT_PYRAMID_SOUTH_PORTAL = {
  x: DESERT_PYRAMID_CENTER.x,
  z: DESERT_PYRAMID_CENTER.z + 19.8,
} as const;

export const DESERT_PYRAMID_RELIC_POS = {
  x: DESERT_PYRAMID_CENTER.x,
  y: DESERT_PYRAMID_CHAMBER_Y,
  z: DESERT_PYRAMID_CENTER.z - 1.5,
} as const;

export const DESERT_HELIPAD_POS = {
  x: -196.0,
  y: 1.85,
  z: 138.0,
} as const;

export const DESERT_TRAIN_STATION_APPROX = {
  x: -168.0,
  z: 112.0,
} as const;

export const DESERT_SPHINX_ARCH_POS = {
  x: -222.0,
  z: 130.0,
} as const;

export const DESERT_OASIS_JETTY_BOUNDS = {
  minX: -194.5,
  maxX: -184.5,
  minZ: 109.6,
  maxZ: 114.4,
  deckY: 0.28,
} as const;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function distPointToSeg2D(
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
  if (lenSq < 1e-6) return Math.hypot(wx, wz);
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
  return Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
}

/**
 * Smooth 0..1 blend weight for the Thar Golden Desert biome in the western expanse.
 * Keeps Mayavanam (-102, 48), Midnight Frontier (-72, 86), Pachai Vayal (-32, 112),
 * and Panimalai Frozen Kingdom (z < -36) completely untouched.
 */
export function desertBiomeBlend(x: number, z: number): number {
  const westMask = smoothstep(-132, -168, x);
  const southMask = smoothstep(10, 44, z);
  return westMask * southMask;
}

export function isInsideDesertBiome(x: number, z: number): boolean {
  return desertBiomeBlend(x, z) > 0.45;
}

/**
 * Normalized elliptical distance from the Emerald Oasis Lagoon center (< 1.0 is inside lagoon).
 */
export function desertOasisNormDist(x: number, z: number): number {
  const dx = (x - DESERT_OASIS_CENTER.x) / DESERT_OASIS_RX;
  const dz = (z - DESERT_OASIS_CENTER.z) / DESERT_OASIS_RZ;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Distance to the graded desert caravan trail linking Mayavanam (-102, 48) -> Oasis Camp -> Pyramid Plaza -> Helipad.
 */
export function distToDesertCaravanTrail(x: number, z: number): number {
  const d1 = distPointToSeg2D(x, z, -104, 52, -148, 82);
  const d2 = distPointToSeg2D(x, z, -148, 82, DESERT_OASIS_SPAWN.x, DESERT_OASIS_SPAWN.z);
  const d3 = distPointToSeg2D(x, z, DESERT_OASIS_SPAWN.x, DESERT_OASIS_SPAWN.z, DESERT_HELIPAD_POS.x, DESERT_HELIPAD_POS.z);
  const d4 = distPointToSeg2D(x, z, DESERT_HELIPAD_POS.x, DESERT_HELIPAD_POS.z, DESERT_PYRAMID_CENTER.x + 21, DESERT_PYRAMID_CENTER.z);
  const d5 = distPointToSeg2D(x, z, DESERT_PYRAMID_CENTER.x + 21, DESERT_PYRAMID_CENTER.z, DESERT_PYRAMID_SOUTH_PORTAL.x, DESERT_PYRAMID_SOUTH_PORTAL.z);
  return Math.min(d1, d2, d3, d4, d5);
}

/**
 * True when standing on the walkable wooden jetty extending over the Emerald Oasis Lagoon.
 */
export function isOnDesertOasisJetty(x: number, z: number): boolean {
  return (
    x >= DESERT_OASIS_JETTY_BOUNDS.minX &&
    x <= DESERT_OASIS_JETTY_BOUNDS.maxX &&
    z >= DESERT_OASIS_JETTY_BOUNDS.minZ &&
    z <= DESERT_OASIS_JETTY_BOUNDS.maxZ
  );
}

/**
 * Computes the blended Thar Desert terrain height (rolling crescent dunes, carved emerald oasis basin,
 * flat caravan camp & pyramid forecourt, and smooth desert caravan road).
 */
export function applyDesertTerrainHeight(x: number, z: number, baseH: number): number {
  const blend = desertBiomeBlend(x, z);
  if (blend <= 0.001) return baseH;

  // Sculpted wind-swept crescent sand dunes (smooth enough to drive Safari 4x4 & Camper Van over!)
  const ridge1 = Math.sin(x * 0.036 + z * 0.024 + Math.sin(z * 0.018) * 1.4);
  const ridge2 = Math.cos(x * 0.022 - z * 0.034) * 0.65;
  const ripple = Math.sin(x * 0.095 + z * 0.075) * 0.22;
  const rawDune = 2.15 + Math.pow(Math.max(0, ridge1 * 0.5 + 0.5), 1.35) * 4.8 + ridge2 * 1.35 + ripple;

  // Higher scenic outer desert dunes framing the far southwest horizon
  const distCenter = Math.hypot(x - DESERT_BIOME_CENTER.x, z - DESERT_BIOME_CENTER.z);
  const rimDunes = smoothstep(52, 115, distCenter) * (2.6 + Math.sin(x * 0.03 - z * 0.025) * 1.4);
  let desertH = rawDune + rimDunes;

  // Flatten Grand Pyramid plateau cleanly to DESERT_PYRAMID_BASE_Y (0.65m)
  const dPyr = Math.hypot(x - DESERT_PYRAMID_CENTER.x, z - DESERT_PYRAMID_CENTER.z);
  const pyrFlat = 1 - smoothstep(22.5, 36.0, dPyr);
  desertH = desertH * (1 - pyrFlat) + DESERT_PYRAMID_BASE_Y * pyrFlat;

  // Flatten Oasis Camp, Arrival Plaza, and Desert Helipad clearing smoothly around y = 0.55m
  const dCamp = Math.hypot(x - DESERT_OASIS_CAMP_POS.x, z - DESERT_OASIS_CAMP_POS.z);
  const campFlat = 1 - smoothstep(13.5, 25.0, dCamp);
  desertH = desertH * (1 - campFlat) + 0.55 * campFlat;

  const dHeli = Math.hypot(x - DESERT_HELIPAD_POS.x, z - DESERT_HELIPAD_POS.z);
  const heliFlat = 1 - smoothstep(9.5, 19.0, dHeli);
  desertH = desertH * (1 - heliFlat) + 0.58 * heliFlat;

  // Flatten Sphinx Obelisk Avenue between Oasis and Pyramid
  const dArch = Math.hypot(x - DESERT_SPHINX_ARCH_POS.x, z - DESERT_SPHINX_ARCH_POS.z);
  const archFlat = 1 - smoothstep(9.0, 18.0, dArch);
  desertH = desertH * (1 - archFlat) + 0.62 * archFlat;

  // Smoothly grade the Desert Caravan Trail so vehicles can drive straight from Mayavanam into Thar Oasis
  const dTrail = distToDesertCaravanTrail(x, z);
  if (dTrail < 9.5) {
    const trailMask = 1 - smoothstep(3.8, 9.5, dTrail);
    desertH = desertH * (1 - trailMask * 0.85) + 0.58 * (trailMask * 0.85);
  }

  // Carve Emerald Oasis Lagoon basin smoothly below WATER_LEVEL (-0.35m -> -1.95m center)
  const dOasis = desertOasisNormDist(x, z);
  if (dOasis < 1.38) {
    const bankFlat = 1 - smoothstep(1.0, 1.38, dOasis);
    desertH = desertH * (1 - bankFlat * 0.72) + 0.45 * (bankFlat * 0.72);
    const basinCarve = 1 - smoothstep(0.42, 1.12, dOasis);
    desertH = desertH * (1 - basinCarve) + -1.95 * basinCarve;
  }

  return baseH * (1 - blend) + desertH * blend;
}

/**
 * Floor-aware walkable elevation for the Grand Stepped Sandstone Pyramid & Desert Helipad:
 * - East Processional Staircase (lx: +19.6 -> +2.8, lz: -2.8..+2.8): climbs 0.65m -> 14.65m
 * - Golden Sun Summit Terrace (|lx| <= 3.5, |lz| <= 3.5): flat 14.65m observatory deck
 * - South Monumental Portal & Torch-Lit Secret Chamber (lx: -7.2..+7.2, lz: -7.2..+7.2 & portal corridor): 0.85m
 * - Desert Sandstone Helipad & approach ramp: climbs smoothly to 1.85m
 */
export function getDesertStructureFloorHeight(
  x: number,
  z: number,
  currentY: number
): number | null {
  // 1. Desert Sandstone Helipad circular deck + north-east approach ramp
  const dhx = x - DESERT_HELIPAD_POS.x;
  const dhz = z - DESERT_HELIPAD_POS.z;
  const distHeli = Math.hypot(dhx, dhz);
  if (distHeli <= 6.35) {
    return DESERT_HELIPAD_POS.y;
  }
  // Walkable sandstone ramp on north side of Desert Helipad (dhz: -10.5..-6.0, dhx: -2.2..2.2)
  if (Math.abs(dhx) <= 2.3 && dhz >= -10.5 && dhz <= -6.0) {
    const tRamp = Math.max(0, Math.min(1, (dhz - -10.5) / 4.5));
    return 0.58 + tRamp * (DESERT_HELIPAD_POS.y - 0.58);
  }

  // 2. Grand Stepped Sandstone Pyramid at DESERT_PYRAMID_CENTER
  const lx = x - DESERT_PYRAMID_CENTER.x;
  const lz = z - DESERT_PYRAMID_CENTER.z;
  if (Math.abs(lx) > 20.5 || Math.abs(lz) > 20.5) {
    return null;
  }

  // 2a. Golden Sun Summit Platform (top of pyramid when player has climbed high)
  if (currentY > 11.2 && Math.abs(lx) <= 3.6 && Math.abs(lz) <= 3.6) {
    return DESERT_PYRAMID_SUMMIT_Y;
  }

  // 2b. Walkable East Processional Staircase (climbing from lx = 19.6 up to lx = 2.8)
  if (lx >= 2.5 && lx <= 19.8 && Math.abs(lz) <= 2.95) {
    const tStair = Math.max(0, Math.min(1, (19.6 - lx) / 16.8));
    const stairY = DESERT_PYRAMID_BASE_Y + tStair * (DESERT_PYRAMID_SUMMIT_Y - DESERT_PYRAMID_BASE_Y);
    // Allow stepping seamlessly onto/off the staircase without trapping players inside the ground chamber
    if (lx >= 7.5 || currentY > 5.0) {
      return stairY;
    }
  }

  // 2c. Torch-Lit Secret Interior Chamber + South Monumental Portal Corridor (ground level!)
  if (currentY < 5.0) {
    const inPortalCorridor = Math.abs(lx) <= 2.75 && lz >= 6.5 && lz <= 19.2;
    const inInnerChamber = Math.abs(lx) <= 7.25 && Math.abs(lz) <= 7.25;
    if (inPortalCorridor || inInnerChamber) {
      return DESERT_PYRAMID_CHAMBER_Y;
    }
  }

  // 2d. Walkable stepped exterior ledges if player steps slightly off the East staircase onto a tier ledge
  const maxAbs = Math.max(Math.abs(lx), Math.abs(lz));
  if (currentY > 2.2 && maxAbs <= DESERT_PYRAMID_BASE_HALF + 0.5) {
    const tierFrac = Math.max(0, Math.min(1, (DESERT_PYRAMID_BASE_HALF - maxAbs) / (DESERT_PYRAMID_BASE_HALF - 3.2)));
    const steppedTier = Math.round(tierFrac * 6) / 6;
    const tierY = DESERT_PYRAMID_BASE_Y + steppedTier * (DESERT_PYRAMID_SUMMIT_Y - DESERT_PYRAMID_BASE_Y);
    if (Math.abs(tierY - currentY) < 3.4) {
      return tierY;
    }
  }

  return null;
}

/**
 * True when a point is inside the hollow Secret Chamber or South Portal Corridor of the Pyramid.
 */
export function isInsidePyramidChamber(x: number, z: number, y = 1.0): boolean {
  if (y > 5.2) return false;
  const lx = x - DESERT_PYRAMID_CENTER.x;
  const lz = z - DESERT_PYRAMID_CENTER.z;
  return (
    (Math.abs(lx) <= 7.2 && Math.abs(lz) <= 7.2) ||
    (Math.abs(lx) <= 2.75 && lz >= 6.5 && lz <= 18.8)
  );
}

/**
 * Returns true if a point should be kept clear of generic desert boulders/palms.
 */
export function isDesertClearingAt(x: number, z: number): boolean {
  if (Math.hypot(x - DESERT_PYRAMID_CENTER.x, z - DESERT_PYRAMID_CENTER.z) < 25.5) return true;
  if (Math.hypot(x - DESERT_OASIS_CAMP_POS.x, z - DESERT_OASIS_CAMP_POS.z) < 12.5) return true;
  if (Math.hypot(x - DESERT_HELIPAD_POS.x, z - DESERT_HELIPAD_POS.z) < 11.5) return true;
  if (Math.hypot(x - DESERT_SPHINX_ARCH_POS.x, z - DESERT_SPHINX_ARCH_POS.z) < 9.5) return true;
  if (Math.hypot(x - DESERT_TRAIN_STATION_APPROX.x, z - DESERT_TRAIN_STATION_APPROX.z) < 16.5) return true;
  // Keep outer eastern railway corridor through the desert dunes free of boulders & ruined pillars
  if (x > -186 && x < -128 && z > 20 && z < 154) return true;
  if (distToDesertCaravanTrail(x, z) < 5.2) return true;
  if (desertOasisNormDist(x, z) < 1.06) return true;
  return false;
}
