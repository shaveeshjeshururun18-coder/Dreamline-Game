import type { SeasonType } from './types';

export type TreeModelVariant =
  | 'cherry_blossom'
  | 'summer_broadleaf'
  | 'autumn_maple'
  | 'snow_pine';

export type PlantModelVariant =
  | 'spring_tulip'
  | 'summer_sunflower'
  | 'autumn_mushroom_fern'
  | 'winter_frost_shrub';

export interface SeasonalFoliageProfile {
  season: SeasonType;
  treeModelVariant: TreeModelVariant;
  plantModelVariant: PlantModelVariant;
  displayName: string;
  heroTreeLabel: string;
  plantLabel: string;
  hasSnowDusting: boolean;
  hasCherryBlossoms: boolean;
  canopyWindMultiplier: number;
  grassScaleY: number;
  grassTintHex: number;
  terrainTintHex: number;
  moteColorHex: number;
  moteOpacity: number;
  moteSize: number;
  heroTreePalette: readonly number[];
  valleyTreePalette: readonly number[];
  plantAccentPalette: readonly number[];
}

export const SEASONAL_FOLIAGE_PROFILES: Record<SeasonType, SeasonalFoliageProfile> = {
  spring: {
    season: 'spring',
    treeModelVariant: 'cherry_blossom',
    plantModelVariant: 'spring_tulip',
    displayName: 'Spring Sakura Blossoms & Tulips',
    heroTreeLabel: 'Cherry Blossom (Sakura)',
    plantLabel: 'Spring Tulips & Meadow Wildflowers',
    hasSnowDusting: false,
    hasCherryBlossoms: true,
    canopyWindMultiplier: 1.0,
    grassScaleY: 1.0,
    grassTintHex: 0xffffff,
    terrainTintHex: 0xffffff,
    moteColorHex: 0xffcce0,
    moteOpacity: 0.78,
    moteSize: 0.28,
    heroTreePalette: [0xffb7cf, 0xffe4ee, 0xf293b5, 0xffd1e2],
    valleyTreePalette: [0x4c7c48, 0x629152, 0x3f6e44, 0xf7bfd1],
    plantAccentPalette: [0xff99bd, 0xffe98a, 0xc9a8f5, 0xfff5e4],
  },
  summer: {
    season: 'summer',
    treeModelVariant: 'summer_broadleaf',
    plantModelVariant: 'summer_sunflower',
    displayName: 'Summer Lush Broadleaf & Sunflowers',
    heroTreeLabel: 'Lush Emerald Broadleaf',
    plantLabel: 'Radiant Sunflowers & Tall Ferns',
    hasSnowDusting: false,
    hasCherryBlossoms: false,
    canopyWindMultiplier: 0.88,
    grassScaleY: 1.18,
    grassTintHex: 0xcdf2aa,
    terrainTintHex: 0xecf7da,
    moteColorHex: 0xfff099,
    moteOpacity: 0.76,
    moteSize: 0.24,
    heroTreePalette: [0x2f753d, 0x3f8c46, 0x57a34d, 0x266336],
    valleyTreePalette: [0x265c34, 0x35733e, 0x468744, 0x1f4f2d],
    plantAccentPalette: [0xffcc29, 0xffb300, 0xffe066, 0xf59e0b],
  },
  autumn: {
    season: 'autumn',
    treeModelVariant: 'autumn_maple',
    plantModelVariant: 'autumn_mushroom_fern',
    displayName: 'Autumn Maple Crowns & Forest Toadstools',
    heroTreeLabel: 'Crimson & Golden Maple',
    plantLabel: 'Autumn Toadstools & Leaf Mounds',
    hasSnowDusting: false,
    hasCherryBlossoms: false,
    canopyWindMultiplier: 1.15,
    grassScaleY: 0.92,
    grassTintHex: 0xe6b56c,
    terrainTintHex: 0xefd5b8,
    moteColorHex: 0xff8f40,
    moteOpacity: 0.84,
    moteSize: 0.3,
    heroTreePalette: [0xd9432b, 0xeb7828, 0xf4bc3d, 0xb83024],
    valleyTreePalette: [0xc44b2c, 0xdf842b, 0xe8b941, 0x993d29],
    plantAccentPalette: [0xd93b2b, 0xe87b2c, 0xf2c45a, 0xc75c38],
  },
  winter: {
    season: 'winter',
    treeModelVariant: 'snow_pine',
    plantModelVariant: 'winter_frost_shrub',
    displayName: 'Winter Snow-Dusted Pines & Frost Shrubs',
    heroTreeLabel: 'Snow-Dusted Alpine Pine',
    plantLabel: 'Frosted Holly Shrubs & Ice Crystals',
    hasSnowDusting: true,
    hasCherryBlossoms: false,
    canopyWindMultiplier: 0.62,
    grassScaleY: 0.56,
    grassTintHex: 0xd9e8f5,
    terrainTintHex: 0xe4effa,
    moteColorHex: 0xffffff,
    moteOpacity: 0.9,
    moteSize: 0.32,
    heroTreePalette: [0x22463a, 0x2c5749, 0x1c3a32, 0x356455],
    valleyTreePalette: [0x1d3f35, 0x274f42, 0x2f5c4e, 0x19362e],
    plantAccentPalette: [0xd8f1ff, 0xeef7ff, 0xd63646, 0xa8d8f5],
  },
};

export function getSeasonalFoliageProfile(season: SeasonType): SeasonalFoliageProfile {
  return SEASONAL_FOLIAGE_PROFILES[season] ?? SEASONAL_FOLIAGE_PROFILES.spring;
}

export function getActiveTreeVariantForSeason(season: SeasonType): TreeModelVariant {
  return getSeasonalFoliageProfile(season).treeModelVariant;
}

export function getActivePlantVariantForSeason(season: SeasonType): PlantModelVariant {
  return getSeasonalFoliageProfile(season).plantModelVariant;
}
