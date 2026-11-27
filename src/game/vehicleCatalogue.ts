import type { BoatId } from './types';

export type CatalogueCategory = 'all' | 'cars' | 'bikes' | 'ships' | 'air_rail';

export type CatalogueVehicleId =
  | 'safari_jeep'
  | 'dirt_bike_49cc'
  | 'hover_glider'
  | 'vtol_aircraft'
  | 'jetski_sport'
  | 'jetski_perf'
  | 'kadalkarai_submarine'
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
  | 'ssj_expedition_boat'
  | 'orange_heli'
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
    id: 'safari_jeep',
    name: 'Off-Road Safari Jeep 4x4',
    tamilName: 'ஆஃப்-ரோடு சஃபாரி ஜீப்',
    category: 'cars',
    badge: 'AAA 4x4 EXPEDITION',
    tagline: 'Olive-sand open-cabin 4WD with tubular roll cage, front winch, canvas canopy, mud tyres & 4-wheel suspension.',
    topSpeedLabel: '128 km/h',
    capacityLabel: '4 Seats',
    actionLabel: 'Spawn & Drive',
    accentClass: 'from-lime-500/35 via-emerald-600/20 to-slate-950/95',
    borderClass: 'border-lime-400/60',
  },
  {
    id: 'vtol_aircraft',
    name: 'Aurelia VTOL Aircraft',
    tamilName: 'ஆரேலியா VTOL வானூர்தி',
    category: 'air_rail',
    badge: 'HELIPAD VTOL',
    tagline: 'Gold, bronze & dark-walnut twin ducted-fan VTOL prototype stationed on En Illam Twin Helipad Pad B.',
    topSpeedLabel: '240 km/h',
    capacityLabel: '2 Pilots',
    actionLabel: 'Spawn & Fly',
    accentClass: 'from-amber-400/35 via-yellow-500/20 to-slate-950/95',
    borderClass: 'border-amber-300/65',
  },
  {
    id: 'hover_glider',
    name: 'Aero-Ti Hoverboard Glider',
    tamilName: 'ஏரோ-டை ஹோவர்போர்டு கிளைடர்',
    category: 'air_rail',
    badge: 'TWIN-JET HOVER GLIDER',
    tagline: 'Brushed titanium & matte carbon-fiber personal jet hoverboard with twin rear turbines, swept fins, magnetic straps & cyan LED nose strip. Look up/down to climb or dive!',
    topSpeedLabel: '166 km/h',
    capacityLabel: '1 Pilot',
    actionLabel: 'Spawn & Fly',
    accentClass: 'from-cyan-400/35 via-slate-500/25 to-slate-950/95',
    borderClass: 'border-cyan-300/70',
  },
  {
    id: 'jetski_sport',
    name: 'Sport Jet Ski 310X',
    tamilName: 'ஸ்போர்ட் ஜெட் ஸ்கி 310X',
    category: 'ships',
    badge: 'SPORT JET SKI',
    tagline: 'Yellow-and-black marine watercraft with dynamic wave buoyancy, deep carving lean & spray wake.',
    topSpeedLabel: '98 km/h',
    capacityLabel: '2 Riders',
    actionLabel: 'Spawn & Ride',
    accentClass: 'from-yellow-400/30 via-amber-500/18 to-slate-950/95',
    borderClass: 'border-yellow-400/55',
  },
  {
    id: 'jetski_perf',
    name: 'Apex-K Pro Jet Ski',
    tamilName: 'அபெக்ஸ்-கே ஜெட் ஸ்கி',
    category: 'ships',
    badge: 'HIGH-PERF JET SKI',
    tagline: 'Kawasaki-inspired green-and-black racing watercraft built for rough Kadalkarai swells & agile carving.',
    topSpeedLabel: '115 km/h',
    capacityLabel: '1 Rider',
    actionLabel: 'Spawn & Ride',
    accentClass: 'from-emerald-400/30 via-green-500/20 to-slate-950/95',
    borderClass: 'border-emerald-400/60',
  },
  {
    id: 'kadalkarai_submarine',
    name: 'Kadalkarai Deep Submarine',
    tamilName: 'ஆழ்கடல் நீர்மூழ்கி கப்பல்',
    category: 'ships',
    badge: 'DEEP OCEAN SUB',
    tagline: 'Glass-dome deep-sea explorer for diving into coral reefs, kelp forests, sunken galleon & whale trenches.',
    topSpeedLabel: '38 kt',
    capacityLabel: '2 Explorers',
    actionLabel: 'Dive Now',
    accentClass: 'from-cyan-500/35 via-teal-600/20 to-slate-950/95',
    borderClass: 'border-cyan-400/60',
  },
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
    name: 'SSJ Safari Tour Cruiser',
    tamilName: 'SSJ சஃபாரி ஜீப் 4x4',
    category: 'cars',
    badge: 'JURASSIC 4x4 + AK-47',
    tagline: 'Yellow, jungle-green & crimson stripe Dinosaur Island tour cruiser with roof-mounted AK-47 turret.',
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
    id: 'dirt_bike_49cc',
    name: '49cc Petrol Dirt Bike (Orion Mini)',
    tamilName: '49cc பெட்ரோல் டர்ட் பைக்',
    category: 'bikes',
    badge: '49CC 2-STROKE MX',
    tagline: 'Orange anodized USD forks, Orion 49 racing decals, knobby tires, wave disc brakes, crimson bar pad & raspy 2-stroke exhaust.',
    topSpeedLabel: '86 km/h',
    capacityLabel: '1 Rider',
    actionLabel: 'Spawn & Ride',
    accentClass: 'from-orange-500/35 via-red-600/20 to-slate-950/95',
    borderClass: 'border-orange-400/70',
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
    id: 'ssj_expedition_boat',
    name: 'SSJ Expedition Cruiser',
    tamilName: 'SSJ கடல் பயணப் படகு',
    category: 'ships',
    badge: 'ISLAND BOAT',
    tagline: 'White-and-teal ocean cruiser with cyan wheelhouse, radar mast & twin orange lifebuoys from Dinosaur Island.',
    topSpeedLabel: '28 kt',
    capacityLabel: '6 Explorers',
    actionLabel: 'Spawn & Sail',
    accentClass: 'from-cyan-500/30 via-orange-500/18 to-slate-900/90',
    borderClass: 'border-cyan-300/55',
    boatId: 'ssj_expedition_boat',
  },
  {
    id: 'orange_heli',
    name: 'SSJ Orange Rescue Helicopter',
    tamilName: 'ஆரஞ்சு மீட்பு ஹெலிகாப்டர்',
    category: 'air_rail',
    badge: 'ORANGE AIRCRAFT',
    tagline: 'Vibrant orange rescue chopper with cyan bubble cockpit, spinning 9.6m rotors & winch — stationed at En Illam & Dinosaur Island.',
    topSpeedLabel: '210 km/h',
    capacityLabel: '4 Flyers',
    actionLabel: 'Spawn & Fly',
    accentClass: 'from-orange-500/35 via-amber-500/22 to-slate-950/95',
    borderClass: 'border-orange-400/70',
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
 * Spawns ANY summoned vehicle right at the player's EXACT current location
 * (never teleports the vehicle away to some distant pier, shore, or track!).
 */
export function computeCatalogueSpawnPoint(
  _vehicleId: CatalogueVehicleId,
  playerX: number,
  playerZ: number,
  playerHeading: number
): { x: number; z: number; heading: number } {
  return {
    x: playerX,
    z: playerZ,
    heading: playerHeading,
  };
}
