import type { BoyOutfitId } from './types';

export interface PlayableAvatarMeta {
  id: BoyOutfitId;
  name: string;
  shortLabel: string;
  desc: string;
  swatch: string;
  accent: string;
  /** Local Z position inside En Illam Ground Floor Avatar Showcase Gallery */
  homeGalleryZ: number;
}

/**
 * Canonical catalog of all playable avatars in DREAMLINE.
 * Every avatar listed here is physically displayed on a selectable pedestal inside
 * En Illam (My Home) and also selectable from the Home Wardrobe menu.
 */
export const PLAYABLE_AVATARS: readonly PlayableAvatarMeta[] = [
  {
    id: 'alan_grant',
    name: 'Dr. Alan Grant',
    shortLabel: 'Alan Grant',
    desc: 'Straw fedora, aviators, red bandana, chambray shirt, JP badge & glowing road flare',
    swatch: '#4b79a1',
    accent: '#ef4444',
    homeGalleryZ: 1.8,
  },
  {
    id: 'igloo_man',
    name: 'Igloo Man (Iceland)',
    shortLabel: 'Igloo Man',
    desc: 'Snow-block igloo dome helmet, glowing cyan eyes & glacier armor',
    swatch: '#8be2ff',
    accent: '#3ce8ff',
    homeGalleryZ: 0.45,
  },
  {
    id: 'navy_jacket',
    name: 'Navy Windbreaker',
    shortLabel: 'Navy Jacket',
    desc: 'Classic Poongavanam valley windbreaker, white tee & campus pack',
    swatch: '#2d4364',
    accent: '#f4be98',
    homeGalleryZ: -0.9,
  },
  {
    id: 'coastal_tee',
    name: 'Coastal Breeze',
    shortLabel: 'Coastal Tee',
    desc: 'Sky-blue coastal overshirt, crisp tee & sandy chino trousers',
    swatch: '#3a89a8',
    accent: '#f5d28e',
    homeGalleryZ: -2.25,
  },
  {
    id: 'winter_parka',
    name: 'Panimalai Parka',
    shortLabel: 'Winter Parka',
    desc: 'Warm alpine crimson-rust mountain parka & cold-weather boots',
    swatch: '#8e3b38',
    accent: '#f2e8d5',
    homeGalleryZ: -3.6,
  },
];

const AVATAR_ID_SET = new Set<string>(PLAYABLE_AVATARS.map((a) => a.id));

export function isValidBoyOutfitId(value: unknown): value is BoyOutfitId {
  return typeof value === 'string' && AVATAR_ID_SET.has(value);
}

export function getAvatarMeta(id: BoyOutfitId): PlayableAvatarMeta {
  return PLAYABLE_AVATARS.find((a) => a.id === id) ?? PLAYABLE_AVATARS[2];
}
