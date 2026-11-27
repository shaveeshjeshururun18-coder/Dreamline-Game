import {
  distanceToRail,
  groundHeightAt,
  isOceanAt,
  isWaterAt,
  WATER_LEVEL,
  WILDLIFE_FOREST_SANCTUARY_CENTER,
  WILDLIFE_SANCTUARY_POND_CENTER,
} from './terrain';

export type WildlifeCategory = 'mammal' | 'bird' | 'reptile_amphibian';

export type WildlifeSpeciesId =
  // Mammals (10)
  | 'elephant'
  | 'gaur'
  | 'sambar_deer'
  | 'wild_boar'
  | 'macaque'
  | 'nilgiri_langur'
  | 'leopard'
  | 'tiger'
  | 'sloth_bear'
  | 'otter'
  // Birds (8)
  | 'peacock'
  | 'hornbill'
  | 'eagle'
  | 'kingfisher'
  | 'parakeet'
  | 'owl'
  | 'water_egret'
  | 'forest_bird'
  // Reptiles & Amphibians (3)
  | 'monitor_lizard'
  | 'turtle'
  | 'frog';

export type WildlifeBehaviorState =
  | 'wandering'
  | 'feeding'
  | 'drinking'
  | 'resting'
  | 'sleeping'
  | 'grooming'
  | 'socializing'
  | 'flying'
  | 'swimming'
  | 'fleeing_vehicle'
  | 'stalking'
  | 'chasing_prey';

export type WildlifeHabitatId =
  | 'tropical_forest'
  | 'grasslands'
  | 'mountain_range'
  | 'river_waterfall'
  | 'lake_reservoir'
  | 'coastal_beach';

export interface WildlifeSpeciesSpec {
  id: WildlifeSpeciesId;
  name: string;
  scientificName: string;
  category: WildlifeCategory;
  habitat: WildlifeHabitatId;
  habitatLabel: string;
  isPredator: boolean;
  isPrey: boolean;
  canFly: boolean;
  canSwim: boolean;
  nocturnal?: boolean;
  baseScale: number;
  walkSpeed: number;
  runSpeed: number;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  description: string;
  anchorX: number;
  anchorZ: number;
  roamRadius: number;
  count: number;
}

export interface WildlifeActorState {
  uid: string;
  speciesId: WildlifeSpeciesId;
  category: WildlifeCategory;
  habitat: WildlifeHabitatId;
  x: number;
  y: number;
  z: number;
  homeX: number;
  homeZ: number;
  roamRadius: number;
  targetX: number;
  targetZ: number;
  heading: number;
  speed: number;
  behavior: WildlifeBehaviorState;
  stateTimer: number;
  gaitPhase: number;
  breathPhase: number;
  wingPhase: number;
  headTurn: number;
  scale: number;
  altitudeOffset: number;
  preyUid: string | null;
}

export interface WildlifeViewfinderTarget {
  uid: string;
  speciesId: WildlifeSpeciesId;
  name: string;
  scientificName: string;
  category: WildlifeCategory;
  habitatLabel: string;
  behavior: WildlifeBehaviorState;
  distanceM: number;
  x: number;
  y: number;
  z: number;
}

export interface WildlifeDiscoverySnapshot {
  totalSpecies: number;
  discoveredIds: WildlifeSpeciesId[];
  photographedIds: WildlifeSpeciesId[];
  nearestTarget: WildlifeViewfinderTarget | null;
  activeCount: number;
}

export const WILDLIFE_SPECIES_CATALOG: WildlifeSpeciesSpec[] = [
  // ===================== MAMMALS (10) =====================
  {
    id: 'elephant',
    name: 'Asian Elephant',
    scientificName: 'Elephas maximus',
    category: 'mammal',
    habitat: 'tropical_forest',
    habitatLabel: 'Tropical Forest & River Meadow',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 1.9,
    runSpeed: 4.2,
    primaryColor: 0x5c5853,
    secondaryColor: 0x47433e,
    accentColor: 0xede3cf,
    description: 'Gentle forest matriarchal herd foraging near lush alpine-forest groves and watering glades.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 14,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 8,
    roamRadius: 18,
    count: 3,
  },
  {
    id: 'gaur',
    name: 'Indian Gaur',
    scientificName: 'Bos gaurus',
    category: 'mammal',
    habitat: 'grasslands',
    habitatLabel: 'Sanctuary Meadows & Snow Foothills',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.1,
    runSpeed: 5.4,
    primaryColor: 0x2b201b,
    secondaryColor: 0x45342a,
    accentColor: 0xe6decb,
    description: 'Towering wild bovine with muscular shoulders, white stockings, and swept horns.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x + 14,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 12,
    roamRadius: 16,
    count: 3,
  },
  {
    id: 'sambar_deer',
    name: 'Sambar Deer',
    scientificName: 'Rusa unicolor',
    category: 'mammal',
    habitat: 'grasslands',
    habitatLabel: 'Panimalai Forest Clearing',
    isPredator: false,
    isPrey: true,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.4,
    runSpeed: 7.4,
    primaryColor: 0x7a5c42,
    secondaryColor: 0x59422f,
    accentColor: 0xd9cbb8,
    description: 'Alert woodland deer with branching antlers grazing across misty forest meadows.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 2,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 18,
    roamRadius: 16,
    count: 4,
  },
  {
    id: 'wild_boar',
    name: 'Indian Wild Boar',
    scientificName: 'Sus scrofa cristatus',
    category: 'mammal',
    habitat: 'tropical_forest',
    habitatLabel: 'Sanctuary Understory & Mud Trails',
    isPredator: false,
    isPrey: true,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.2,
    runSpeed: 6.2,
    primaryColor: 0x483d36,
    secondaryColor: 0x332a24,
    accentColor: 0xe8dfd0,
    description: 'Bristled omnivore rooting through damp soil along shaded woodland tracks.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 24,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 8,
    roamRadius: 15,
    count: 3,
  },
  {
    id: 'macaque',
    name: 'Bonnet Macaque',
    scientificName: 'Macaca radiata',
    category: 'mammal',
    habitat: 'tropical_forest',
    habitatLabel: 'Sanctuary Canopy & Grove Paths',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.6,
    runSpeed: 5.8,
    primaryColor: 0x87725c,
    secondaryColor: 0xc2ab92,
    accentColor: 0xdba58c,
    description: 'Curious social primates grooming and foraging near sunlit woodland paths.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 16,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 20,
    roamRadius: 12,
    count: 3,
  },
  {
    id: 'nilgiri_langur',
    name: 'Nilgiri Langur',
    scientificName: 'Semnopithecus johnii',
    category: 'mammal',
    habitat: 'mountain_range',
    habitatLabel: 'Snow-Border Evergreen Ridges',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.5,
    runSpeed: 5.5,
    primaryColor: 0x1e1d20,
    secondaryColor: 0xc49c66,
    accentColor: 0x363438,
    description: 'Glossy black highland leaf-monkey with a distinctive golden-brown hood.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 28,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 16,
    roamRadius: 14,
    count: 2,
  },
  {
    id: 'leopard',
    name: 'Indian Leopard',
    scientificName: 'Panthera pardus fusca',
    category: 'mammal',
    habitat: 'mountain_range',
    habitatLabel: 'Rocky Snow-Forest Overlooks',
    isPredator: true,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.5,
    runSpeed: 8.6,
    primaryColor: 0xc89a51,
    secondaryColor: 0x2b2016,
    accentColor: 0xf2e4c8,
    description: 'Stealthy rosette-coated solitary feline patrolling rocky forest ridges near the snow peaks.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 26,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 28,
    roamRadius: 18,
    count: 2,
  },
  {
    id: 'tiger',
    name: 'Bengal Tiger',
    scientificName: 'Panthera tigris tigris',
    category: 'mammal',
    habitat: 'tropical_forest',
    habitatLabel: 'Deep Panimalai Forest Sanctuary',
    isPredator: true,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.4,
    runSpeed: 8.8,
    primaryColor: 0xd4762c,
    secondaryColor: 0x1f1712,
    accentColor: 0xf6efe4,
    description: 'Apex striped predator stalking silently through the protected forest reserve.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x + 16,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 18,
    roamRadius: 20,
    count: 2,
  },
  {
    id: 'sloth_bear',
    name: 'Sloth Bear',
    scientificName: 'Melursus ursinus',
    category: 'mammal',
    habitat: 'tropical_forest',
    habitatLabel: 'Woodland & Rocky Clearings',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 2.0,
    runSpeed: 5.6,
    primaryColor: 0x201d1c,
    secondaryColor: 0xe8ddc8,
    accentColor: 0x8f7a68,
    description: 'Shaggy forest bear marked by a cream V-shaped chest crest, foraging for fruit and honey.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 6,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 28,
    roamRadius: 15,
    count: 2,
  },
  {
    id: 'otter',
    name: 'Smooth-Coated Otter',
    scientificName: 'Lutrogale perspicillata',
    category: 'mammal',
    habitat: 'lake_reservoir',
    habitatLabel: 'Sanctuary Forest Pond',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: true,
    baseScale: 1.0,
    walkSpeed: 2.2,
    runSpeed: 4.8,
    primaryColor: 0x5c4637,
    secondaryColor: 0x99806c,
    accentColor: 0x3b2c22,
    description: 'Playful aquatic mammal gliding gracefully through the clear forest sanctuary pond.',
    anchorX: WILDLIFE_SANCTUARY_POND_CENTER.x - 2,
    anchorZ: WILDLIFE_SANCTUARY_POND_CENTER.z + 1,
    roamRadius: 7,
    count: 3,
  },

  // ===================== BIRDS (8) =====================
  {
    id: 'peacock',
    name: 'Indian Peacock',
    scientificName: 'Pavo cristatus',
    category: 'bird',
    habitat: 'grasslands',
    habitatLabel: 'Sunlit Sanctuary Meadow',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 1.6,
    runSpeed: 4.2,
    primaryColor: 0x16558f,
    secondaryColor: 0x1b7a5e,
    accentColor: 0xd9a83b,
    description: 'Radiant cobalt-necked bird displaying an iridescent emerald-and-gold ocellated train.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x + 8,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 20,
    roamRadius: 14,
    count: 3,
  },
  {
    id: 'hornbill',
    name: 'Great Hornbill',
    scientificName: 'Buceros bicornis',
    category: 'bird',
    habitat: 'tropical_forest',
    habitatLabel: 'Sanctuary Forest Canopy',
    isPredator: false,
    isPrey: false,
    canFly: true,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 6.5,
    runSpeed: 9.2,
    primaryColor: 0x1f1f22,
    secondaryColor: 0xf4c430,
    accentColor: 0xf7f5ef,
    description: 'Iconic canopy frugivore with a dramatic golden casque and sweeping black-and-white wings.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 10,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 6,
    roamRadius: 28,
    count: 2,
  },
  {
    id: 'eagle',
    name: 'Crested Serpent Eagle',
    scientificName: 'Spilornis cheela',
    category: 'bird',
    habitat: 'mountain_range',
    habitatLabel: 'Snow-Peak Thermals & Forest Skies',
    isPredator: true,
    isPrey: false,
    canFly: true,
    canSwim: false,
    baseScale: 1.15,
    walkSpeed: 8.2,
    runSpeed: 12.0,
    primaryColor: 0x4b382a,
    secondaryColor: 0x2c2018,
    accentColor: 0xe6b83c,
    description: 'Broad-winged raptor wheeling on crisp mountain thermals above the wildlife forest.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 18,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 14,
    roamRadius: 34,
    count: 2,
  },
  {
    id: 'kingfisher',
    name: 'Common Kingfisher',
    scientificName: 'Alcedo atthis',
    category: 'bird',
    habitat: 'river_waterfall',
    habitatLabel: 'Sanctuary Pond & Streams',
    isPredator: false,
    isPrey: false,
    canFly: true,
    canSwim: false,
    baseScale: 0.72,
    walkSpeed: 7.4,
    runSpeed: 10.5,
    primaryColor: 0x1289a7,
    secondaryColor: 0xd96b27,
    accentColor: 0xf5f5f5,
    description: 'Jewel-like turquoise and copper bird darting low above the sanctuary forest pond.',
    anchorX: WILDLIFE_SANCTUARY_POND_CENTER.x,
    anchorZ: WILDLIFE_SANCTUARY_POND_CENTER.z,
    roamRadius: 14,
    count: 3,
  },
  {
    id: 'parakeet',
    name: 'Rose-Ringed Parakeet',
    scientificName: 'Psittacula krameri',
    category: 'bird',
    habitat: 'tropical_forest',
    habitatLabel: 'Sanctuary Forest Canopy',
    isPredator: false,
    isPrey: false,
    canFly: true,
    canSwim: false,
    baseScale: 0.78,
    walkSpeed: 7.8,
    runSpeed: 10.8,
    primaryColor: 0x52a83c,
    secondaryColor: 0x76c954,
    accentColor: 0xd9383a,
    description: 'Vibrant emerald parakeet flock weaving swiftly between sunlit sanctuary tree crowns.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x + 10,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 6,
    roamRadius: 22,
    count: 4,
  },
  {
    id: 'owl',
    name: 'Forest Eagle-Owl',
    scientificName: 'Bubo nipalensis',
    category: 'bird',
    habitat: 'tropical_forest',
    habitatLabel: 'Deep Woodland Hollows',
    isPredator: true,
    isPrey: false,
    canFly: true,
    canSwim: false,
    nocturnal: true,
    baseScale: 0.92,
    walkSpeed: 6.2,
    runSpeed: 8.8,
    primaryColor: 0x6e5b49,
    secondaryColor: 0xcab9a3,
    accentColor: 0xf2ba38,
    description: 'Silent nocturnal hunter gliding noiselessly beneath dusk and moonlit canopies.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x - 16,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z - 20,
    roamRadius: 20,
    count: 2,
  },
  {
    id: 'water_egret',
    name: 'Great Forest Egret',
    scientificName: 'Ardea alba',
    category: 'bird',
    habitat: 'lake_reservoir',
    habitatLabel: 'Sanctuary Pond Margins',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 0.95,
    walkSpeed: 1.5,
    runSpeed: 3.4,
    primaryColor: 0xf4f4f0,
    secondaryColor: 0xdce2e8,
    accentColor: 0xeba934,
    description: 'Slender white wading bird stalking fish along the serene forest pond banks.',
    anchorX: WILDLIFE_SANCTUARY_POND_CENTER.x + 14,
    anchorZ: WILDLIFE_SANCTUARY_POND_CENTER.z + 6,
    roamRadius: 9,
    count: 3,
  },
  {
    id: 'forest_bird',
    name: 'Malabar Songbird',
    scientificName: 'Myophonus horsfieldii',
    category: 'bird',
    habitat: 'tropical_forest',
    habitatLabel: 'Sanctuary Forest Glades',
    isPredator: false,
    isPrey: false,
    canFly: true,
    canSwim: false,
    baseScale: 0.62,
    walkSpeed: 6.8,
    runSpeed: 9.0,
    primaryColor: 0x264878,
    secondaryColor: 0x5c9bd1,
    accentColor: 0xf0d68a,
    description: 'Melodious blue-black forest songster flitting through shaded alpine-forest glades.',
    anchorX: WILDLIFE_FOREST_SANCTUARY_CENTER.x + 2,
    anchorZ: WILDLIFE_FOREST_SANCTUARY_CENTER.z + 10,
    roamRadius: 18,
    count: 4,
  },

  // ===================== REPTILES & AMPHIBIANS (4) =====================
  {
    id: 'monitor_lizard',
    name: 'Bengal Monitor Lizard',
    scientificName: 'Varanus bengalensis',
    category: 'reptile_amphibian',
    habitat: 'river_waterfall',
    habitatLabel: 'Sanctuary Pond Boulders',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 1.8,
    runSpeed: 4.5,
    primaryColor: 0x5a5741,
    secondaryColor: 0x3b3a2b,
    accentColor: 0x9b926c,
    description: 'Alert scaled reptile basking on sun-warmed rocks beside the forest sanctuary pond.',
    anchorX: WILDLIFE_SANCTUARY_POND_CENTER.x - 15,
    anchorZ: WILDLIFE_SANCTUARY_POND_CENTER.z + 4,
    roamRadius: 9,
    count: 2,
  },
  {
    id: 'turtle',
    name: 'Forest Pond Turtle',
    scientificName: 'Lepidochelys olivacea',
    category: 'reptile_amphibian',
    habitat: 'lake_reservoir',
    habitatLabel: 'Sanctuary Forest Pond',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: true,
    baseScale: 1.0,
    walkSpeed: 0.9,
    runSpeed: 2.2,
    primaryColor: 0x4b5e42,
    secondaryColor: 0x768560,
    accentColor: 0xc2b28a,
    description: 'Armoured pond turtles swimming calmly in the clear forest sanctuary waters.',
    anchorX: WILDLIFE_SANCTUARY_POND_CENTER.x + 2,
    anchorZ: WILDLIFE_SANCTUARY_POND_CENTER.z - 2,
    roamRadius: 6.5,
    count: 3,
  },
  {
    id: 'frog',
    name: 'Malabar Gliding Frog',
    scientificName: 'Rhacophorus malabaricus',
    category: 'reptile_amphibian',
    habitat: 'river_waterfall',
    habitatLabel: 'Sanctuary Pond & Ferns',
    isPredator: false,
    isPrey: false,
    canFly: false,
    canSwim: false,
    baseScale: 1.0,
    walkSpeed: 1.4,
    runSpeed: 3.1,
    primaryColor: 0x4ca64c,
    secondaryColor: 0xd9843b,
    accentColor: 0xebde5c,
    description: 'Vibrant emerald amphibian hopping along damp fern banks beside the forest pond.',
    anchorX: WILDLIFE_SANCTUARY_POND_CENTER.x + 8,
    anchorZ: WILDLIFE_SANCTUARY_POND_CENTER.z + 8,
    roamRadius: 7,
    count: 3,
  },
];

export function getWildlifeSpeciesById(id: WildlifeSpeciesId): WildlifeSpeciesSpec {
  return WILDLIFE_SPECIES_CATALOG.find((s) => s.id === id) ?? WILDLIFE_SPECIES_CATALOG[0];
}

function seededRand(seed: number): () => number {
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
 * Generates ecologically accurate initial states for all 22 wildlife species across their natural habitats.
 */
export function createInitialWildlifeEcosystem(): WildlifeActorState[] {
  const rand = seededRand(20261124);
  const actors: WildlifeActorState[] = [];

  for (const spec of WILDLIFE_SPECIES_CATALOG) {
    for (let i = 0; i < spec.count; i++) {
      let x = spec.anchorX;
      let z = spec.anchorZ;
      for (let attempt = 0; attempt < 18; attempt++) {
        const ang = (i / Math.max(1, spec.count)) * Math.PI * 2 + rand() * 1.4;
        const r = (0.2 + rand() * 0.72) * spec.roamRadius;
        const cx = spec.anchorX + Math.cos(ang) * r;
        const cz = spec.anchorZ + Math.sin(ang) * r;
        const water = isWaterAt(cx, cz) || isOceanAt(cx, cz);
        const railClear = spec.canFly || distanceToRail(cx, cz) > 16;
        if (railClear && (spec.canFly || (spec.canSwim && water) || (!spec.canSwim && !water))) {
          x = cx;
          z = cz;
          break;
        }
      }

      const groundY = spec.canSwim
        ? WATER_LEVEL - 0.05
        : Math.max(WATER_LEVEL + 0.1, groundHeightAt(x, z));
      const altOffset = spec.canFly ? 9.5 + rand() * 10.5 : 0;

      actors.push({
        uid: `${spec.id}_${i}`,
        speciesId: spec.id,
        category: spec.category,
        habitat: spec.habitat,
        x,
        y: groundY + altOffset,
        z,
        homeX: spec.anchorX,
        homeZ: spec.anchorZ,
        roamRadius: spec.roamRadius,
        targetX: x,
        targetZ: z,
        heading: rand() * Math.PI * 2,
        speed: spec.canFly ? spec.walkSpeed : 0,
        behavior: spec.canFly ? 'flying' : spec.canSwim ? 'swimming' : 'feeding',
        stateTimer: 2.0 + rand() * 5.0,
        gaitPhase: rand() * Math.PI * 2,
        breathPhase: rand() * Math.PI * 2,
        wingPhase: rand() * Math.PI * 2,
        headTurn: 0,
        scale: spec.baseScale * (0.9 + rand() * 0.2),
        altitudeOffset: altOffset,
        preyUid: null,
      });
    }
  }

  return actors;
}

/**
 * Steps the living wildlife ecosystem: natural independent behaviours, flocking/flying,
 * swimming, vehicle avoidance, predator-prey stalking, and time-of-day rest/sleep cycles.
 */
export function stepWildlifeEcosystem(
  actors: WildlifeActorState[],
  dt: number,
  elapsed: number,
  timeHours: number,
  playerX: number,
  playerZ: number,
  vehicleActive: boolean,
  vehicleSpeedKmh: number
): void {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.08);
  const isNight = timeHours < 5.5 || timeHours >= 20.5;
  const vehicleAlertDist = vehicleActive ? 16.0 + Math.min(18.0, vehicleSpeedKmh * 0.35) : 7.5;

  for (let i = 0; i < actors.length; i++) {
    const a = actors[i];
    const spec = getWildlifeSpeciesById(a.speciesId);

    a.breathPhase += safeDt * (a.behavior === 'sleeping' ? 1.4 : 2.8);
    a.stateTimer -= safeDt;

    // 1. Flying birds: graceful soaring, flocking orbits, and thermal altitude sweeps
    if (spec.canFly) {
      a.behavior = 'flying';
      const angSpeed = (spec.walkSpeed / Math.max(10, a.roamRadius)) * (i % 2 === 0 ? 1 : -1);
      const theta = elapsed * angSpeed + i * 1.35;
      const nx = a.homeX + Math.cos(theta) * a.roamRadius + Math.sin(theta * 2) * 3.5;
      const nz = a.homeZ + Math.sin(theta) * a.roamRadius * 0.82;
      const dx = nx - a.x;
      const dz = nz - a.z;
      a.heading = Math.atan2(dx, dz);
      a.x = nx;
      a.z = nz;
      const baseG = Math.max(WATER_LEVEL, groundHeightAt(nx, nz));
      a.y = baseG + a.altitudeOffset + Math.sin(elapsed * 0.7 + i) * 2.1;
      a.speed = spec.walkSpeed;
      a.wingPhase += safeDt * (a.speciesId === 'eagle' || a.speciesId === 'hornbill' ? 4.6 : 9.4);
      continue;
    }

    // 2. Aquatic swimmers (Otters & Turtles)
    if (spec.canSwim) {
      a.behavior = 'swimming';
      const swimSpeed = spec.walkSpeed;
      const dxT = a.targetX - a.x;
      const dzT = a.targetZ - a.z;
      const distT = Math.hypot(dxT, dzT);

      if (distT < 1.2 || a.stateTimer <= 0) {
        const ang = elapsed * 0.55 + i * 2.17;
        const r = a.roamRadius * (0.35 + ((i * 37) % 10) * 0.06);
        const cx = a.homeX + Math.cos(ang) * r;
        const cz = a.homeZ + Math.sin(ang) * r;
        if (isWaterAt(cx, cz) || isOceanAt(cx, cz)) {
          a.targetX = cx;
          a.targetZ = cz;
        }
        a.stateTimer = 4.5 + (i % 4) * 1.4;
      } else {
        const desiredH = Math.atan2(dxT, dzT);
        let diff = desiredH - a.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        a.heading += diff * Math.min(1, safeDt * 3.5);

        const step = Math.min(distT, swimSpeed * safeDt);
        const nx = a.x + (dxT / distT) * step;
        const nz = a.z + (dzT / distT) * step;
        if (isWaterAt(nx, nz) || isOceanAt(nx, nz)) {
          a.x = nx;
          a.z = nz;
        }
      }
      a.speed = swimSpeed;
      a.gaitPhase += safeDt * 5.2;
      a.y = WATER_LEVEL - 0.04 + Math.sin(elapsed * 2.2 + i) * 0.05;
      continue;
    }

    // 3. Terrestrial animals: check vehicle avoidance first!
    const distToPlayer = Math.hypot(a.x - playerX, a.z - playerZ);
    const shouldFlee =
      vehicleActive &&
      vehicleSpeedKmh > 6 &&
      distToPlayer < vehicleAlertDist &&
      a.speciesId !== 'elephant';

    if (shouldFlee) {
      const awayAng = Math.atan2(a.x - playerX, a.z - playerZ);
      a.targetX = a.x + Math.sin(awayAng) * 16;
      a.targetZ = a.z + Math.cos(awayAng) * 16;
      a.behavior = 'fleeing_vehicle';
      a.stateTimer = 3.2;
    } else if (spec.isPredator && a.behavior !== 'chasing_prey' && a.stateTimer <= 0.5) {
      // Natural predator-prey stalking (Tiger / Leopard noticing nearby Deer / Boar)
      let nearestPrey: WildlifeActorState | null = null;
      let nearestD = 26;
      for (let j = 0; j < actors.length; j++) {
        const candidate = actors[j];
        const cSpec = getWildlifeSpeciesById(candidate.speciesId);
        if (!cSpec.isPrey) continue;
        const d = Math.hypot(candidate.x - a.x, candidate.z - a.z);
        if (d < nearestD) {
          nearestD = d;
          nearestPrey = candidate;
        }
      }
      if (nearestPrey) {
        a.preyUid = nearestPrey.uid;
        a.targetX = nearestPrey.x;
        a.targetZ = nearestPrey.z;
        a.behavior = nearestD < 12 ? 'chasing_prey' : 'stalking';
        a.stateTimer = 4.2;
      }
    }

    // Pick next natural behaviour when timer expires
    if (a.stateTimer <= 0) {
      const roll = Math.abs(Math.sin(elapsed * 0.83 + i * 3.17));
      if (isNight && !spec.nocturnal && roll < 0.65) {
        a.behavior = 'sleeping';
        a.stateTimer = 7.0 + roll * 6.0;
        a.speed = 0;
      } else if (roll < 0.28) {
        a.behavior = 'feeding';
        a.stateTimer = 4.0 + roll * 5.0;
        a.speed = 0;
      } else if (roll < 0.42) {
        a.behavior = 'grooming';
        a.stateTimer = 3.2 + roll * 3.5;
        a.speed = 0;
      } else if (roll < 0.56) {
        a.behavior = 'resting';
        a.stateTimer = 4.5 + roll * 4.5;
        a.speed = 0;
      } else if (roll < 0.66) {
        a.behavior = 'drinking';
        a.stateTimer = 3.8 + roll * 3.0;
        a.speed = 0;
      } else {
        // Choose a valid habitat waypoint to wander toward
        const ang = elapsed * 0.71 + i * 2.41;
        const rad = a.roamRadius * (0.28 + roll * 0.68);
        const cx = a.homeX + Math.cos(ang) * rad;
        const cz = a.homeZ + Math.sin(ang) * rad;
        if (!isWaterAt(cx, cz) && !isOceanAt(cx, cz)) {
          a.targetX = cx;
          a.targetZ = cz;
          a.behavior = roll > 0.88 ? 'socializing' : 'wandering';
          a.stateTimer = 5.5 + roll * 4.0;
        } else {
          a.behavior = 'feeding';
          a.stateTimer = 3.0;
        }
      }
    }

    // Execute movement for active locomotion states
    const isMoving =
      a.behavior === 'wandering' ||
      a.behavior === 'socializing' ||
      a.behavior === 'fleeing_vehicle' ||
      a.behavior === 'stalking' ||
      a.behavior === 'chasing_prey';

    if (isMoving) {
      const dx = a.targetX - a.x;
      const dz = a.targetZ - a.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.85) {
        a.behavior = 'feeding';
        a.stateTimer = 3.5;
        a.speed = 0;
      } else {
        const moveSpeed =
          a.behavior === 'fleeing_vehicle' || a.behavior === 'chasing_prey'
            ? spec.runSpeed
            : a.behavior === 'stalking'
            ? spec.walkSpeed * 0.78
            : spec.walkSpeed;

        const desiredH = Math.atan2(dx, dz);
        let diff = desiredH - a.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        a.heading += diff * Math.min(1, safeDt * 4.8);

        const step = Math.min(dist, moveSpeed * safeDt);
        const nx = a.x + (dx / dist) * step;
        const nz = a.z + (dz / dist) * step;
        if (!isWaterAt(nx, nz) && !isOceanAt(nx, nz) && distanceToRail(nx, nz) > 15) {
          a.x = nx;
          a.z = nz;
          a.speed = moveSpeed;
          a.gaitPhase += safeDt * (3.2 + moveSpeed * 1.15);
        } else {
          a.behavior = 'drinking';
          a.stateTimer = 3.2;
          a.speed = 0;
        }
      }
    } else {
      a.speed = 0;
      a.headTurn = Math.sin(elapsed * 1.4 + i * 1.7) * 0.28;
    }

    a.y = groundHeightAt(a.x, a.z);
  }
}

/**
 * Finds the best wildlife subject in front of the player/camera for Wildlife Observation & Photography.
 */
export function findWildlifeInViewfinder(
  actors: WildlifeActorState[],
  camX: number,
  camZ: number,
  camHeading: number,
  maxDist = 68
): WildlifeViewfinderTarget | null {
  let best: WildlifeViewfinderTarget | null = null;
  let bestScore = Infinity;
  const fwdX = Math.sin(camHeading);
  const fwdZ = Math.cos(camHeading);

  for (let i = 0; i < actors.length; i++) {
    const a = actors[i];
    const dx = a.x - camX;
    const dz = a.z - camZ;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.5 || dist > maxDist) continue;
    const dot = (dx * fwdX + dz * fwdZ) / dist;
    if (dot < 0.35) continue;
    // Prefer animals close to center of view and reasonably nearby
    const score = dist * (1.45 - dot);
    if (score < bestScore) {
      bestScore = score;
      const spec = getWildlifeSpeciesById(a.speciesId);
      best = {
        uid: a.uid,
        speciesId: a.speciesId,
        name: spec.name,
        scientificName: spec.scientificName,
        category: spec.category,
        habitatLabel: spec.habitatLabel,
        behavior: a.behavior,
        distanceM: Math.round(dist),
        x: a.x,
        y: a.y,
        z: a.z,
      };
    }
  }
  return best;
}
