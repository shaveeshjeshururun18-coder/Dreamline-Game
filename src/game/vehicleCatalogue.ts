import type { BoatId } from './types';
import { isNavigableBoatWater, SOVEREIGN_SHORE_BERTH } from './vehicles';
import { LAKE_CENTER, isWaterAt } from './terrain';

export type CatalogueCategory = 'all' | 'cars' | 'bikes' | 'ships' | 'air_rail';

export type CatalogueVehicleId =
  | 'camper_van'
  | 'safari_car'
  | 'rural_bus'
  | 'commuter_bicycle'
  | 'cruiser_skateboard'
  | 'sovereign_ship'
  | 'bamboo_catamaran'
  | 'tribal_outrigger'
  | 'coastal_boat'
  | 'lake_boat'
  | 'sky_explorer'
  | 'dreamline_train'
  | 'batmobile';

export interface CatalogueVehicleEntry {
  id: CatalogueVehicleId;
  name: string;
  tamilName: string;
  category: Exclude<CatalogueCategory, 'all'>;
  badge: string;
  tagline: string;
  topSpeedLabel: string;
  capacityLabel: string;
  actionLabel: string;
  accentClass: string;
  borderClass: string;
  boatId?: BoatId;
}

export const VEHICLE_CATALOGUE: CatalogueVehicleEntry[] = [
  {
    id: 'batmobile',
    name: 'Armoured Batmobile',
    tamilName: 'பேட்மொபைல் கவச வாகனம்',
    category: 'cars',
    badge: 'ARMOURED JET CAR',
    tagline: 'Stealth-black tactical interceptor with sliding canopy, 167 km/h jet afterburner & ramming power.',
    topSpeedLabel: '167 km/h',
    capacityLabel: '2 Seats',
    actionLabel: 'Spawn & Drive',
    accentClass: 'from-slate-600/35 via-amber-500/20 to-slate-950/95',
    borderClass: 'border-amber-400/60',
  },
  {
    id: 'camper_van',
    name: 'Dreamline Camper Van',
    tamilName: 'கனவு கேம்பர் வேன்',
    category: 'cars',
    badge: 'ROAD CAR',
    tagline: 'Cozy retro-cream touring camper with rooftop awning & Frosty co-pilot seat.',
    topSpeedLabel: '82 km/h',
    capacityLabel: '4 Seats',
    actionLabel: 'Spawn & Drive',
    accentClass: 'from-amber-500/25 via-orange-500/15 to-slate-900/90',
    borderClass: 'border-amber-400/45',
  },
  {
    id: 'safari_car',
    name: 'SSJ Safari Jeep 4x4',
    tamilName: 'சஃபாரி ஜீப் 4x4',
    category: 'cars',
    badge: 'OFF-ROAD 4x4',
    tagline: 'Rugged expedition 4x4 built for coastal sand, forest trails & Dinosaur Island.',
    topSpeedLabel: '76 km/h',
    capacityLabel: '4 Seats',
    actionLabel: 'Spawn & Drive',
    accentClass: 'from-lime-500/25 via-emerald-500/15 to-slate-900/90',
    borderClass: 'border-lime-400/45',
  },
  {
    id: 'rural_bus',
    name: 'Dreamline Rural Bus',
    tamilName: 'கிராமப்புற பேருந்து',
    category: 'cars',
    badge: 'TRANSIT COACH',
    tagline: 'Full-size scenic touring coach with manual driver controls & opening doors.',
    topSpeedLabel: '72 km/h',
    capacityLabel: '24 Seats',
    actionLabel: 'Spawn & Drive',
    accentClass: 'from-emerald-500/25 via-teal-500/15 to-slate-900/90',
    borderClass: 'border-emerald-400/45',
  },
  {
    id: 'commuter_bicycle',
    name: 'Classic Commuter Bike',
    tamilName: 'மிதிவண்டி',
    category: 'bikes',
    badge: 'BICYCLE',
    tagline: 'Breezy step-through town bicycle with handlebar basket & metallic bell.',
    topSpeedLabel: '28 km/h',
    capacityLabel: '1 Rider',
    actionLabel: 'Ride Now',
    accentClass: 'from-rose-500/25 via-pink-500/15 to-slate-900/90',
    borderClass: 'border-rose-400/45',
  },
  {
    id: 'cruiser_skateboard',
    name: 'Cruiser Skateboard',
    tamilName: 'ஸ்கேட்போர்டு',
    category: 'bikes',
    badge: 'STREET BOARD',
    tagline: 'Carving wooden street cruiser for quick hops along piers & village lanes.',
    topSpeedLabel: '24 km/h',
    capacityLabel: '1 Rider',
    actionLabel: 'Ride Now',
    accentClass: 'from-fuchsia-500/25 via-purple-500/15 to-slate-900/90',
    borderClass: 'border-fuchsia-400/45',
  },
  {
    id: 'sovereign_ship',
    name: 'Sovereign of the Tides',
    tamilName: 'அலைகளின் அரசன் கப்பல்',
    category: 'ships',
    badge: '3-MASTED SHIP',
    tagline: 'Grand 3-masted historical galleon moored near Kadalkarai Shore with full sails.',
    topSpeedLabel: '30 kt',
    capacityLabel: 'Tall Ship',
    actionLabel: 'Spawn & Sail',
    accentClass: 'from-sky-500/30 via-indigo-500/20 to-slate-900/90',
    borderClass: 'border-sky-300/55',
    boatId: 'sovereign_ship',
  },
  {
    id: 'bamboo_catamaran',
    name: 'Bamboo Catamaran Raft',
    tamilName: 'மூங்கில் பாய்மரப் படகு',
    category: 'ships',
    badge: 'SAIL RAFT',
    tagline: 'Twin-pontoon Polynesian ocean craft with billowing canvas sail & wave flag.',
    topSpeedLabel: '24 kt',
    capacityLabel: '2 Sailors',
    actionLabel: 'Spawn & Sail',
    accentClass: 'from-cyan-500/25 via-teal-500/15 to-slate-900/90',
    borderClass: 'border-cyan-400/45',
    boatId: 'bamboo_catamaran',
  },
  {
    id: 'tribal_outrigger',
    name: 'Tribal Outrigger Canoe',
    tamilName: 'பழங்குடி அவுட்ரிகர் படகு',
    category: 'ships',
    badge: 'PADDLE CANOE',
    tagline: 'Hand-carved island outrigger with spinning stern paddle-wheel & bow spars.',
    topSpeedLabel: '22 kt',
    capacityLabel: '2 Sailors',
    actionLabel: 'Spawn & Sail',
    accentClass: 'from-orange-500/25 via-amber-500/15 to-slate-900/90',
    borderClass: 'border-orange-400/45',
    boatId: 'tribal_outrigger',
  },
  {
    id: 'coastal_boat',
    name: 'Kadalkarai Harbour Boat',
    tamilName: 'கடற்கரை படகு',
    category: 'ships',
    badge: 'HARBOUR CRAFT',
    tagline: 'Nimble wooden coastal launch ideal for lighthouse cruises & bay exploration.',
    topSpeedLabel: '20 kt',
    capacityLabel: '2 Sailors',
    actionLabel: 'Spawn & Sail',
    accentClass: 'from-blue-500/25 via-cyan-500/15 to-slate-900/90',
    borderClass: 'border-blue-400/45',
    boatId: 'coastal_boat',
  },
  {
    id: 'lake_boat',
    name: 'Neelam Lake Rowboat',
    tamilName: 'நீலம் ஏரி படகு',
    category: 'ships',
    badge: 'LAKE BOAT',
    tagline: 'Tranquil timber rowboat with animated dual oars for Neelam Mirror Lake.',
    topSpeedLabel: '12 kt',
    capacityLabel: '2 Rowers',
    actionLabel: 'Spawn & Row',
    accentClass: 'from-teal-500/25 via-emerald-500/15 to-slate-900/90',
    borderClass: 'border-teal-400/45',
    boatId: 'lake_boat',
  },
  {
    id: 'sky_explorer',
    name: 'SSJ Tropical Sky Explorer',
    tamilName: 'வான ஊர்தி',
    category: 'air_rail',
    badge: 'VTOL AIRCRAFT',
    tagline: 'Twin-rotor aerial cruiser with turbo boost, rooftop helipad landing & panoramic views.',
    topSpeedLabel: '165 km/h',
    capacityLabel: '2 Flyers',
    actionLabel: 'Spawn & Fly',
    accentClass: 'from-sky-400/30 via-cyan-500/20 to-slate-900/90',
    borderClass: 'border-sky-400/55',
  },
  {
    id: 'dreamline_train',
    name: 'Dreamline Local Express',
    tamilName: 'கனவு ரயில்',
    category: 'air_rail',
    badge: 'SCENIC RAIL',
    tagline: 'Cream-and-crimson anime commuter train with manual driver cab & live steam plume.',
    topSpeedLabel: '95 km/h',
    capacityLabel: '7 Stations',
    actionLabel: 'Board & Drive',
    accentClass: 'from-red-500/25 via-amber-500/15 to-slate-900/90',
    borderClass: 'border-rose-400/50',
  },
];

export function getCatalogueVehicleById(id: CatalogueVehicleId): CatalogueVehicleEntry {
  return VEHICLE_CATALOGUE.find((v) => v.id === id) ?? VEHICLE_CATALOGUE[0];
}

export function getCatalogueVehiclesByCategory(category: CatalogueCategory): CatalogueVehicleEntry[] {
  if (category === 'all') return VEHICLE_CATALOGUE;
  return VEHICLE_CATALOGUE.filter((v) => v.category === category);
}

/**
 * Computes a clean, safe spawn position for any land or sea vehicle relative to the player.
 * - Land vehicles spawn 4.8m ahead of the player if dry, otherwise fall back to player's ground position.
 * - Ocean ships spawn right beside the player if already near navigable ocean water, otherwise at Kadalkarai Shore Pier!
 * - Lake boat spawns cleanly inside Neelam Mirror Lake.
 */
export function computeCatalogueSpawnPoint(
  vehicleId: CatalogueVehicleId,
  playerX: number,
  playerZ: number,
  playerHeading: number
): { x: number; z: number; heading: number } {
  const entry = getCatalogueVehicleById(vehicleId);
  if (entry.boatId) {
    if (entry.boatId === 'lake_boat') {
      if (isNavigableBoatWater('lake', playerX, playerZ)) {
        return { x: playerX, z: playerZ, heading: playerHeading };
      }
      return { x: LAKE_CENTER.x + 6, z: LAKE_CENTER.z - 2, heading: 0.4 };
    }
    // Ocean ship/boat: if player is already near/in open ocean, spawn right there; otherwise bring to Kadalkarai Shore Pier!
    const aheadX = playerX + Math.sin(playerHeading) * 6.5;
    const aheadZ = playerZ + Math.cos(playerHeading) * 6.5;
    if (isNavigableBoatWater('ocean', aheadX, aheadZ)) {
      return { x: aheadX, z: aheadZ, heading: playerHeading };
    }
    if (isNavigableBoatWater('ocean', playerX, playerZ)) {
      return { x: playerX, z: playerZ, heading: playerHeading };
    }
    if (entry.boatId === 'sovereign_ship') {
      return {
        x: SOVEREIGN_SHORE_BERTH.x,
        z: SOVEREIGN_SHORE_BERTH.z,
        heading: SOVEREIGN_SHORE_BERTH.heading,
      };
    }
    return { x: 121.5, z: 57.2, heading: 1.25 };
  }

  // Land / Air vehicles: spawn smoothly right ahead of the player on dry ground
  const aheadX = playerX + Math.sin(playerHeading) * 4.8;
  const aheadZ = playerZ + Math.cos(playerHeading) * 4.8;
  if (!isWaterAt(aheadX, aheadZ)) {
    return { x: aheadX, z: aheadZ, heading: playerHeading };
  }
  if (!isWaterAt(playerX, playerZ)) {
    return { x: playerX, z: playerZ, heading: playerHeading };
  }
  return { x: 102, z: 54, heading: 0 };
}
