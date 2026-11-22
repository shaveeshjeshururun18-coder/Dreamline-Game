export type ExhibitionCategory = 'land' | 'air' | 'water';

export type ExhibitionZoneId =
  | 'zone_a_land'
  | 'zone_b_aviation'
  | 'zone_c_marine'
  | 'zone_d_luxury'
  | 'zone_e_special';

export type ExhibitionVehicleId =
  | 'dreamline_train'
  | 'rural_bus'
  | 'safari_car'
  | 'commuter_bicycle'
  | 'olga_camper'
  | 'cruiser_skateboard'
  | 'sky_explorer'
  | 'lake_boat'
  | 'coastal_boat'
  | 'bamboo_catamaran'
  | 'tribal_outrigger'
  | 'sovereign_ship';

export interface ExhibitionVehicleSpec {
  topSpeed: string;
  propulsion: string;
  capacity: string;
  controls: string;
  originRegion: string;
  sourceAsset: string;
  capabilities: string[];
}

export interface ExhibitionVehicleEntry {
  id: ExhibitionVehicleId;
  name: string;
  tamilName: string;
  category: ExhibitionCategory;
  zoneId: ExhibitionZoneId;
  zoneLabel: string;
  floorLabel: string;
  testAreaLabel: string;
  description: string;
  displayPos: { x: number; y: number; z: number; heading: number };
  inspectCameraOffset: { dx: number; dy: number; dz: number };
  testSpawnPos: { x: number; y: number; z: number; heading: number };
  worldSpawnPos: { x: number; y: number; z: number; heading: number };
  specs: ExhibitionVehicleSpec;
}

// =========================================================================
// OCEAN EXHIBITION COMPLEX ISLAND GEOMETRY (FAR FROM DINOSAUR ISLAND)
// Dinosaur Island is at (296, 128). This Ocean Island is centered at (204, 256)
// — ~158m across open turquoise ocean from Dinosaur Island and ~60m off the coast!
// =========================================================================

export const EXHIBITION_ISLAND_CENTER = { x: 204, z: 256 };
export const EXHIBITION_ISLAND_BOUNDS = {
  minX: 154,
  maxX: 254,
  minZ: 212,
  maxZ: 300,
};
export const EXHIBITION_DECK_Y = 0.48;

// Architectural anchors on the Ocean Island
export const EXHIBITION_DEALERSHIP_CENTER = { x: 184, z: 238 }; // 28m (x: 170..198) x 22m (z: 227..249)
export const EXHIBITION_HANGAR_CENTER = { x: 224, z: 240 }; // 40m (x: 204..244) x 28m (z: 226..254)
export const EXHIBITION_MARINE_CENTER = { x: 250, z: 240 }; // Waterfront glass pavilion + deep-water pier extending east
export const EXHIBITION_STATION_POS = { x: 204, z: 210 }; // Ocean Railway Viaduct Station on north edge
export const EXHIBITION_BUS_STOP_POS = { x: 164, z: 226 }; // Ocean Causeway Bus Stop at cantilevered drop-off
export const EXHIBITION_PLAZA_SPAWN = { x: 176, z: 219 }; // Dramatic arrival view of Ref 1 facade & Hangar
export const EXHIBITION_LAND_CIRCUIT_CENTER = { x: 176, z: 278 };
export const EXHIBITION_RUNWAY_CENTER = { x: 226, z: 278 };
export const EXHIBITION_HELIPAD_POS = { x: 212, y: 0.56, z: 268 };
export const EXHIBITION_MARINA_PIER_BOUNDS = {
  minX: 252,
  maxX: 280,
  minZ: 231,
  maxZ: 249,
};
export const SOVEREIGN_SHIP_BERTH = { x: 286, z: 242, heading: 1.52 };

// Dealership multi-storey floor elevations
export const DEALERSHIP_GF_Y = 0.68;
export const DEALERSHIP_1F_Y = 5.18;
export const DEALERSHIP_2F_Y = 9.68;

// Aviation Hangar floor & multi-level steel mezzanine elevations
export const HANGAR_FLOOR_Y = 0.58;
export const HANGAR_MEZZ_1_Y = 5.18;
export const HANGAR_MEZZ_2_Y = 9.68;

/**
 * True when (x, z) is on the artificial Ocean Exhibition Complex Island platform
 * (so terrain raises above sea level and isOceanAt returns false).
 */
export function isInsideExhibitionIsland(x: number, z: number, margin = 0): boolean {
  return (
    x >= EXHIBITION_ISLAND_BOUNDS.minX - margin &&
    x <= EXHIBITION_ISLAND_BOUNDS.maxX + margin &&
    z >= EXHIBITION_ISLAND_BOUNDS.minZ - margin &&
    z <= EXHIBITION_ISLAND_BOUNDS.maxZ + margin
  );
}

/**
 * True when (x, z) is on the east Marina wooden boardwalk pier extending into the ocean.
 */
export function isOnExhibitionMarinaPier(x: number, z: number): boolean {
  return (
    x >= EXHIBITION_MARINA_PIER_BOUNDS.minX &&
    x <= EXHIBITION_MARINA_PIER_BOUNDS.maxX &&
    z >= EXHIBITION_MARINA_PIER_BOUNDS.minZ &&
    z <= EXHIBITION_MARINA_PIER_BOUNDS.maxZ
  );
}

/**
 * True when (x, z) is on the Ocean Bus Causeway connecting Kadalkarai mainland
 * to the Exhibition Complex Island (kept dry & walkable/drivable over the sea).
 */
const BUS_CAUSEWAY_SAMPLES: Array<{ x: number; z: number }> = [];
export function registerBusRoadSamplesForTerrain(samples: Array<{ x: number; z: number }>): void {
  BUS_CAUSEWAY_SAMPLES.length = 0;
  for (let i = 0; i < samples.length; i++) {
    BUS_CAUSEWAY_SAMPLES.push(samples[i]);
  }
}

export function distanceToBusRoad(x: number, z: number): number {
  if (BUS_CAUSEWAY_SAMPLES.length === 0) return 999;
  let bestSq = 999999;
  for (let i = 0; i < BUS_CAUSEWAY_SAMPLES.length; i++) {
    const p = BUS_CAUSEWAY_SAMPLES[i];
    const dx = x - p.x;
    const dz = z - p.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestSq) bestSq = dSq;
  }
  return Math.sqrt(bestSq);
}

export function isOnOceanBusCauseway(x: number, z: number): boolean {
  return x > 92 && z > 66 && distanceToBusRoad(x, z) < 3.6;
}

/**
 * Keeps nature trees & grass clear of the Ocean Exhibition Island & its approach bridges.
 */
export function isInsideExhibitionCampusClearing(x: number, z: number): boolean {
  if (isInsideExhibitionIsland(x, z, 12)) return true;
  if (isOnExhibitionMarinaPier(x, z)) return true;
  if (x > 88 && z > 72 && distanceToBusRoad(x, z) < 6.5) return true;
  return false;
}

/**
 * Returns the exact multi-floor walkable elevation inside the Universal Transportation
 * Exhibition Complex (3-storey Dealership, exterior grand entrance stairs & ramp,
 * interior staircases, connecting glass skybridge, Aviation Hangar floor & 2-level
 * elevated steel catwalks, and the Waterfront Marina Pier), or null when outside.
 */
export function getExhibitionComplexFloorHeight(
  x: number,
  z: number,
  currentY: number
): number | null {
  // 1. Marina Wooden Pier over ocean (east of island)
  if (isOnExhibitionMarinaPier(x, z)) {
    return 0.44;
  }

  // Only evaluate interior floors inside the island perimeter
  if (!isInsideExhibitionIsland(x, z, 2)) {
    return null;
  }

  // 2. Main Dealership Building (x: 170..198, z: 227..249) + front entrance stairs (z: 223.8..227)
  const dx = x - EXHIBITION_DEALERSHIP_CENTER.x; // -14..+14
  const dz = z - EXHIBITION_DEALERSHIP_CENTER.z; // -11..+11

  // Front grand entrance staircase (dx: -3.2..3.2, dz: -14.2..-11.0)
  if (dx >= -3.4 && dx <= 3.4 && dz >= -14.2 && dz <= -11.0) {
    const t = Math.max(0, Math.min(1, (-11.0 - dz) / 3.2));
    return EXHIBITION_DECK_Y + (1 - t) * (DEALERSHIP_GF_Y - EXHIBITION_DECK_Y);
  }

  // Accessible pedestrian ramp on front-west side (dx: -11.5..-4.5, dz: -13.6..-11.0)
  if (dx >= -11.5 && dx <= -4.5 && dz >= -13.6 && dz <= -11.0) {
    const t = Math.max(0, Math.min(1, (dx - -11.5) / 7.0));
    return EXHIBITION_DECK_Y + t * (DEALERSHIP_GF_Y - EXHIBITION_DECK_Y);
  }

  // Connecting Glass Skybridge between Dealership 1F (x=198) and Hangar Mezzanine 1F (x=204)
  if (x >= 197.4 && x <= 204.6 && z >= 231.5 && z <= 237.5) {
    if (currentY > 3.2) return DEALERSHIP_1F_Y;
    return EXHIBITION_DECK_Y;
  }

  // Inside Main Dealership footprint
  if (dx >= -14.2 && dx <= 14.2 && dz >= -11.2 && dz <= 11.2) {
    // Staircase 1: Ground -> 1st Floor along east-interior wall (dx: 9.8..13.0, dz: -5.5..4.5)
    // Ascends from z = +4.5 (GF 0.68) to z = -5.5 (1F 5.18)
    if (dx >= 9.6 && dx <= 13.2 && dz >= -6.0 && dz <= 4.8 && currentY < 7.2) {
      const t = Math.max(0, Math.min(1, (4.5 - dz) / 10.0));
      return DEALERSHIP_GF_Y + t * (DEALERSHIP_1F_Y - DEALERSHIP_GF_Y);
    }

    // Staircase 2: 1st Floor -> 2nd Floor along west-back wall (dx: -13.0..-9.8, dz: -5.5..4.5)
    // Ascends from z = -5.5 (1F 5.18) to z = +4.5 (2F 9.68)
    if (dx >= -13.2 && dx <= -9.6 && dz >= -6.0 && dz <= 4.8 && currentY >= 3.8) {
      const t = Math.max(0, Math.min(1, (dz - -5.5) / 10.0));
      return DEALERSHIP_1F_Y + t * (DEALERSHIP_2F_Y - DEALERSHIP_1F_Y);
    }

    // Second Floor slab (open central skylight atrium cutout dx: -6.5..6.5, dz: -4.2..3.6)
    if (currentY > 7.6) {
      const inAtriumHole = dx > -6.2 && dx < 6.2 && dz > -4.0 && dz < 3.4;
      if (!inAtriumHole) return DEALERSHIP_2F_Y;
    }

    // First Floor slab (open front-center double-height lobby atrium dx: -5.5..5.5, dz: -9.8..-3.8)
    if (currentY > 3.2) {
      const inLobbyAtrium = dx > -5.2 && dx < 5.2 && dz > -9.6 && dz < -4.0;
      if (!inLobbyAtrium) return DEALERSHIP_1F_Y;
    }

    return DEALERSHIP_GF_Y;
  }

  // 3. Industrial Aviation Exhibition Hangar (x: 204..244, z: 226..254)
  const hx = x - EXHIBITION_HANGAR_CENTER.x; // -20..+20
  const hz = z - EXHIBITION_HANGAR_CENTER.z; // -14..+14

  if (hx >= -20.2 && hx <= 20.2 && hz >= -14.2 && hz <= 14.2) {
    // Industrial Steel Staircase A: Hangar Floor -> Mezzanine 1 along NW corner (hx: -19.5..-16.5, hz: -4.0..5.5)
    if (hx >= -19.8 && hx <= -16.2 && hz >= -4.5 && hz <= 5.8 && currentY < 7.2) {
      const t = Math.max(0, Math.min(1, (5.5 - hz) / 9.5));
      return HANGAR_FLOOR_Y + t * (HANGAR_MEZZ_1_Y - HANGAR_FLOOR_Y);
    }
    // Industrial Steel Staircase B: Mezzanine 1 -> Upper Catwalk 2 along NE corner (hx: 16.5..19.5, hz: -4.0..5.5)
    if (hx >= 16.2 && hx <= 19.8 && hz >= -4.5 && hz <= 5.8 && currentY >= 3.8) {
      const t = Math.max(0, Math.min(1, (5.5 - hz) / 9.5));
      return HANGAR_MEZZ_1_Y + t * (HANGAR_MEZZ_2_Y - HANGAR_MEZZ_1_Y);
    }

    // Upper Catwalk Level 2 (y = 9.68) along north & east/west perimeter
    const onCatwalkPerimeter = hz <= -9.2 || hx <= -15.6 || hx >= 15.6;
    if (currentY > 7.6 && onCatwalkPerimeter) {
      return HANGAR_MEZZ_2_Y;
    }

    // Lower Steel Mezzanine Level 1 (y = 5.18) along north, west, and east walls
    if (currentY > 3.2 && (hz <= -7.2 || hx <= -14.8 || hx >= 14.8)) {
      return HANGAR_MEZZ_1_Y;
    }

    return HANGAR_FLOOR_Y;
  }

  // 4. General Ocean Island Concrete Deck, Plaza, Runway, Circuit & Marine Pavilion
  return EXHIBITION_DECK_Y;
}

/**
 * Returns the named sub-zone inside the Ocean Exhibition Complex for HUD location display.
 */
export function getExhibitionSubzoneLabel(x: number, y: number, z: number): string | null {
  if (!isInsideExhibitionIsland(x, z, 6) && !isOnExhibitionMarinaPier(x, z)) {
    return null;
  }
  if (isOnExhibitionMarinaPier(x, z) || x >= 245) {
    return 'Zone C · Marine Gallery & Marina';
  }
  const hx = x - EXHIBITION_HANGAR_CENTER.x;
  const hz = z - EXHIBITION_HANGAR_CENTER.z;
  if (Math.abs(hx) <= 20.5 && Math.abs(hz) <= 14.5) {
    if (y > 7.5) return 'Zone B · Aviation Hangar Upper Catwalk';
    if (y > 3.2) return 'Zone B · Aviation Hangar Mezzanine';
    return 'Zone B · Industrial Aviation Hangar';
  }
  const dx = x - EXHIBITION_DEALERSHIP_CENTER.x;
  const dz = z - EXHIBITION_DEALERSHIP_CENTER.z;
  if (Math.abs(dx) <= 14.5 && Math.abs(dz) <= 11.5) {
    if (y > 7.5) return 'Zone E · 2F Special Mobility Gallery';
    if (y > 3.2) return 'Zone D · 1F Luxury Mobility Gallery';
    return 'Zone A · Ground Floor Main Exhibition';
  }
  if (z > 256 && x >= 198) {
    return 'Ocean Aviation Runway & Helipad';
  }
  if (z > 256 && x < 198) {
    return 'Land Driving & Off-Road Test Circuit';
  }
  return 'Universal Transportation Exhibition';
}

// =========================================================================
// AUTOMATICALLY DISCOVERED PROJECT VEHICLE INVENTORY (ALL 12 ACTUAL VEHICLES)
// Every entry maps directly to an actual playable vehicle in DREAMLINE.
// =========================================================================

export const EXHIBITION_VEHICLE_CATALOG: ExhibitionVehicleEntry[] = [
  // ---- ZONE A: LAND TRANSPORTATION GALLERY (GROUND FLOOR) ----
  {
    id: 'rural_bus',
    name: 'Dreamline Rural Bus',
    tamilName: 'கிராமப் பேருந்து',
    category: 'land',
    zoneId: 'zone_a_land',
    zoneLabel: 'Zone A · Land Transportation',
    floorLabel: 'Dealership Ground Floor · Bay A1',
    testAreaLabel: 'Exhibition Driving Circuit',
    description:
      'Authentic countryside passenger coach with sliding door, panoramic passenger window view, manual Bus Driver Mode, and mobile-phone hailing.',
    displayPos: { x: 176.2, y: DEALERSHIP_GF_Y + 0.14, z: 241.5, heading: 2.55 },
    inspectCameraOffset: { dx: 5.8, dy: 2.8, dz: -5.4 },
    testSpawnPos: { x: 176.0, y: EXHIBITION_DECK_Y, z: 263.5, heading: -Math.PI * 0.5 },
    worldSpawnPos: { x: 164.0, y: EXHIBITION_DECK_Y, z: 226.0, heading: 0.4 },
    specs: {
      topSpeed: '72 km/h (Manual Driver) · 49 km/h (Route)',
      propulsion: 'Diesel Coach Drive + Automated Stop Loop',
      capacity: 'Driver + Scenic Passenger Cabin + Companion',
      controls: 'W/S Throttle · A/D Steer · Space Brake · E Doors · V Views',
      originRegion: 'Poongavanam – Kadalkarai – Ocean Complex Loop',
      sourceAsset: 'src/game/vehicles.ts · src/world/vehiclesWorld.ts',
      capabilities: ['Manual Bus Driver Mode', 'Window Seat View', 'Mobile Hail Pickup'],
    },
  },
  {
    id: 'safari_car',
    name: 'SSJ Safari 4×4 Off-Road Jeep',
    tamilName: 'சஃபாரி 4×4 ஜீப்',
    category: 'land',
    zoneId: 'zone_a_land',
    zoneLabel: 'Zone A · Land Transportation',
    floorLabel: 'Dealership Ground Floor · Bay A2',
    testAreaLabel: 'Off-Road & Driving Test Circuit',
    description:
      'Rugged open-frame expedition 4×4 built for Dinosaur Island patrols, featuring responsive steering, off-road suspension clearance, and rapid acceleration.',
    displayPos: { x: 184.5, y: DEALERSHIP_GF_Y + 0.14, z: 243.0, heading: 3.14 },
    inspectCameraOffset: { dx: 3.8, dy: 2.1, dz: -4.2 },
    testSpawnPos: { x: 168.0, y: EXHIBITION_DECK_Y, z: 278.0, heading: 0 },
    worldSpawnPos: { x: 171.0, y: EXHIBITION_DECK_Y, z: 222.5, heading: -1.2 },
    specs: {
      topSpeed: '68 km/h Off-Road',
      propulsion: '4×4 Expedition Drivetrain',
      capacity: 'Driver + Open Expedition Roll-Cage',
      controls: 'W/S Accelerate/Reverse · A/D Steer · Shift Boost · E Exit',
      originRegion: 'SSJ Dinosaur Island & Mainland Trails',
      sourceAsset: 'src/game/dinosaurIsland.ts · src/world/dinosaurIslandWorld.ts',
      capabilities: ['Off-Road Maneuvering', 'Open-Top Visibility', 'High-Torque Launch'],
    },
  },
  {
    id: 'dreamline_train',
    name: 'Dreamline Scenic Express (DL-402)',
    tamilName: 'கனவுப்பாதை விரைவு ரயில்',
    category: 'land',
    zoneId: 'zone_a_land',
    zoneLabel: 'Zone A · Land Transportation',
    floorLabel: 'Dealership Ground Floor · Rail Spur A3',
    testAreaLabel: 'Ocean Viaduct Railway Loop',
    description:
      'Iconic 2-car electric countryside express serving all 7 stations across valleys, ocean viaducts, Dinosaur Island, and the Exhibition Complex.',
    displayPos: { x: 192.2, y: DEALERSHIP_GF_Y + 0.16, z: 241.0, heading: -2.65 },
    inspectCameraOffset: { dx: -5.4, dy: 2.5, dz: -4.8 },
    testSpawnPos: { x: EXHIBITION_STATION_POS.x, y: 0.48, z: EXHIBITION_STATION_POS.z, heading: 1.57 },
    worldSpawnPos: { x: EXHIBITION_STATION_POS.x, y: 0.48, z: EXHIBITION_STATION_POS.z, heading: 1.57 },
    specs: {
      topSpeed: '108 km/h (Driver Mode) · 62 km/h (Cruise)',
      propulsion: 'Overhead Catenary Electric Multiple Unit (2-Car)',
      capacity: 'Driver Cab + Walkable Interior Cabin + Window Seats',
      controls: 'W/S Throttle · Space Brake · H Horn · V Window/Cabin/Driver View',
      originRegion: 'Full 7-Station Dreamline Railway Loop',
      sourceAsset: 'src/game/railway.ts · src/world/train.ts',
      capabilities: ['Train Driver Mode', 'Window View', 'Walkable Cabin', 'Route Planner'],
    },
  },
  {
    id: 'commuter_bicycle',
    name: 'Japanese Commuter Bicycle',
    tamilName: 'மிதிவண்டி',
    category: 'land',
    zoneId: 'zone_a_land',
    zoneLabel: 'Zone A · Land Transportation',
    floorLabel: 'Dealership Ground Floor · Bay A4',
    testAreaLabel: 'Exhibition Driving Circuit',
    description:
      'Lightweight valley cruiser bicycle equipped with woven front basket, dynamo headlight for twilight rides, and cheerful brass bell.',
    displayPos: { x: 175.8, y: DEALERSHIP_GF_Y + 0.14, z: 233.2, heading: 2.1 },
    inspectCameraOffset: { dx: 2.5, dy: 1.4, dz: -2.6 },
    testSpawnPos: { x: 176.0, y: EXHIBITION_DECK_Y, z: 268.0, heading: -Math.PI * 0.5 },
    worldSpawnPos: { x: 178.0, y: EXHIBITION_DECK_Y, z: 221.0, heading: Math.PI },
    specs: {
      topSpeed: '34 km/h (Sprint Pedal)',
      propulsion: 'Human-Powered Chain Drive + Dynamo Lamp',
      capacity: 'Single Rider',
      controls: 'W/A/S/D Pedal & Steer · Shift Boost · Space Hop · B Toggle',
      originRegion: 'All Mainland Paths, Coast & Ocean Causeway',
      sourceAsset: 'src/game/locomotion.ts · src/world/player.ts',
      capabilities: ['Dynamo Night Headlight', 'Agile Cornering', 'Instant Mount (B)'],
    },
  },

  // ---- ZONE D: LUXURY & SIGNATURE MOBILITY (FIRST FLOOR) ----
  {
    id: 'olga_camper',
    name: 'Olga — Pastel Vintage Camper Van',
    tamilName: 'ஓல்கா கேம்பர் வேன்',
    category: 'land',
    zoneId: 'zone_d_luxury',
    zoneLabel: 'Zone D · Luxury & Signature Mobility',
    floorLabel: 'Dealership First Floor · Turntable D1',
    testAreaLabel: 'Exhibition Driving Circuit',
    description:
      'Hand-crafted pastel sage-and-cream expedition camper with articulating doors, expandable pop-top camper roof, warm headlights, and hazard signals.',
    displayPos: { x: 184.0, y: DEALERSHIP_1F_Y + 0.18, z: 243.0, heading: 2.85 },
    inspectCameraOffset: { dx: 4.5, dy: 2.4, dz: -4.8 },
    testSpawnPos: { x: 184.0, y: EXHIBITION_DECK_Y, z: 263.5, heading: -Math.PI * 0.5 },
    worldSpawnPos: { x: 168.0, y: EXHIBITION_DECK_Y, z: 223.0, heading: -0.9 },
    specs: {
      topSpeed: '65 km/h Touring Speed',
      propulsion: 'Rear-Engine Air-Cooled Touring Drive',
      capacity: 'Driver + Full Pop-Top Camper Cabin',
      controls: 'W/S Drive · A/D Steer · R Pop Roof · O Doors · L Headlights · H Hazards',
      originRegion: 'Mayavanam Enchanted Forest & Open World Roads',
      sourceAsset: 'src/game/camper.ts · src/world/enchantedForest.ts',
      capabilities: ['Pop-Top Roof', 'Opening Cabin Doors', 'Working Headlights & Hazards'],
    },
  },

  // ---- ZONE E: SPECIAL & CUSTOM MOBILITY (SECOND FLOOR) ----
  {
    id: 'cruiser_skateboard',
    name: 'Maple Wood Cruiser Skateboard',
    tamilName: 'ஸ்கேட்போர்டு',
    category: 'land',
    zoneId: 'zone_e_special',
    zoneLabel: 'Zone E · Special & Custom Mobility',
    floorLabel: 'Dealership Second Floor · Plinth E1',
    testAreaLabel: 'Exhibition Manoeuvring Pad',
    description:
      'Carved 7-ply maple deck cruiser skateboard with soft urethane coastal wheels, responsive carving lean, and spring-loaded ollie jump.',
    displayPos: { x: 184.0, y: DEALERSHIP_2F_Y + 0.18, z: 244.5, heading: 2.7 },
    inspectCameraOffset: { dx: 2.2, dy: 1.3, dz: -2.4 },
    testSpawnPos: { x: 180.0, y: EXHIBITION_DECK_Y, z: 274.0, heading: -Math.PI * 0.5 },
    worldSpawnPos: { x: 179.5, y: EXHIBITION_DECK_Y, z: 221.5, heading: Math.PI },
    specs: {
      topSpeed: '38 km/h (Carve Boost)',
      propulsion: 'Kick-Push Gravity & Carving Momentum',
      capacity: 'Single Rider',
      controls: 'W/A/S/D Carve · Space Ollie Jump · Shift Boost · K Toggle',
      originRegion: 'Coastal Boulevards & Exhibition Plaza',
      sourceAsset: 'src/game/locomotion.ts · src/world/player.ts',
      capabilities: ['Ollie Jump', 'Smooth Carving Lean', 'Instant Equip (K)'],
    },
  },

  // ---- ZONE B: INDUSTRIAL AVIATION EXHIBITION HANGAR ----
  {
    id: 'sky_explorer',
    name: 'SSJ Tropical Sky Explorer',
    tamilName: 'வானூர்தி எக்ஸ்ப்ளோரர்',
    category: 'air',
    zoneId: 'zone_b_aviation',
    zoneLabel: 'Zone B · Industrial Aviation Hangar',
    floorLabel: 'Main Hangar Floor · Hero Bay B1',
    testAreaLabel: 'Ocean Runway & Helipad',
    description:
      'Discovered playable flying craft in DREAMLINE: quad-turbine wooden hover-raft with four counter-rotating lift propellers, wind-billowing canvas sail, and golden SSJ crown pennant. Ready for vertical takeoff from the Ocean Runway & Helipad.',
    displayPos: { x: 224.0, y: HANGAR_FLOOR_Y + 0.65, z: 240.0, heading: Math.PI },
    inspectCameraOffset: { dx: 7.5, dy: 3.4, dz: 7.5 },
    testSpawnPos: { x: EXHIBITION_HELIPAD_POS.x, y: EXHIBITION_HELIPAD_POS.y + 0.5, z: EXHIBITION_HELIPAD_POS.z, heading: 0.2 },
    worldSpawnPos: { x: 226.0, y: EXHIBITION_DECK_Y + 0.5, z: 276.0, heading: 0 },
    specs: {
      topSpeed: '96 km/h (Turbo Cruise)',
      propulsion: 'Quad-Propeller VTOL Lift Turbines + Aerodynamic Sail',
      capacity: 'Pilot + Companion Passenger Deck',
      controls: 'W/S Forward · A/D Yaw · Space Climb · C Descend · Shift Turbo · E Land',
      originRegion: 'En Illam Helipad · AVS Snow Helipad · Ocean Runway',
      sourceAsset: 'src/game/skyExplorer.ts · src/world/skyExplorerWorld.ts',
      capabilities: ['Full 3D Free Flight', 'VTOL Hover & Landing', 'Turbo Boost'],
    },
  },

  // ---- ZONE C: MARINE TRANSPORTATION GALLERY & DEEP-WATER MARINA ----
  {
    id: 'sovereign_ship',
    name: 'Sovereign of the Tides (3-Masted Tall Ship)',
    tamilName: 'அலைகளின் அரசன் கப்பல்',
    category: 'water',
    zoneId: 'zone_c_marine',
    zoneLabel: 'Zone C · Marine Gallery & Marina',
    floorLabel: 'Deep-Water Heritage Berth · Pier C5',
    testAreaLabel: 'Open-Water Ocean Test Route',
    description:
      'Grand three-masted 18th-century wooden sailing ship featuring lofted oak timber hull, glowing stern captain cabin windows, square-rigged canvas sails, bowsprit jibs, and full ocean sailing.',
    displayPos: { x: SOVEREIGN_SHIP_BERTH.x, y: -0.35, z: SOVEREIGN_SHIP_BERTH.z, heading: SOVEREIGN_SHIP_BERTH.heading },
    inspectCameraOffset: { dx: -14.0, dy: 7.2, dz: -11.0 },
    testSpawnPos: { x: 298.0, y: -0.35, z: 244.0, heading: 1.55 },
    worldSpawnPos: { x: SOVEREIGN_SHIP_BERTH.x, y: -0.35, z: SOVEREIGN_SHIP_BERTH.z, heading: SOVEREIGN_SHIP_BERTH.heading },
    specs: {
      topSpeed: '56 km/h (Full Wind Sails)',
      propulsion: 'Three-Masted Square Rig + Bowsprit Jibs',
      capacity: 'Captain Quarterdeck + Companion Lookout',
      controls: 'W/S Full Sail / Reverse · A/D Helm · Shift Gust Boost · V Deck Cam · E Disembark',
      originRegion: 'Ocean Exhibition Marina & Kadalkarai Open Sea',
      sourceAsset: 'Sovereign of the Tides Blueprint · src/world/vehiclesWorld.ts',
      capabilities: ['3-Masted Square Sails', 'Glowing Stern Cabin', 'Open-Ocean Voyaging'],
    },
  },
  {
    id: 'bamboo_catamaran',
    name: 'Bamboo Catamaran Sail Raft',
    tamilName: 'மூங்கில் பாய்மரப் படகு',
    category: 'water',
    zoneId: 'zone_c_marine',
    zoneLabel: 'Zone C · Marine Gallery & Marina',
    floorLabel: 'Marina Waterfront Slip · Berth C3',
    testAreaLabel: 'Open-Water Ocean Test Route',
    description:
      'Twin-pontoon Polynesian bamboo sail catamaran with cross-lashed deck planks, billowing cream sailcloth, and waving red masthead pennant.',
    displayPos: { x: 263.5, y: -0.35, z: 226.0, heading: 1.2 },
    inspectCameraOffset: { dx: -5.5, dy: 3.0, dz: 5.5 },
    testSpawnPos: { x: 274.0, y: -0.35, z: 222.0, heading: 1.35 },
    worldSpawnPos: { x: 263.5, y: -0.35, z: 226.0, heading: 1.2 },
    specs: {
      topSpeed: '56 km/h (Wind Boost)',
      propulsion: 'Polynesian Billowing Sail + Twin Bamboo Pontoons',
      capacity: 'Helmsman + Companion Deck Seat',
      controls: 'W/S Sail · A/D Rudder · Shift Boost · V First-Person Bow Cam · E Dock',
      originRegion: 'Kadalkarai Harbour & Exhibition Marina',
      sourceAsset: 'src/game/vehicles.ts · src/world/vehiclesWorld.ts',
      capabilities: ['Dynamic Billowing Sail', 'Bow FPV Camera', 'High Stability Twin Hull'],
    },
  },
  {
    id: 'tribal_outrigger',
    name: 'Tribal Outrigger Canoe',
    tamilName: 'பழங்குடி அவுட்ரிகர் படகு',
    category: 'water',
    zoneId: 'zone_c_marine',
    zoneLabel: 'Zone C · Marine Gallery & Marina',
    floorLabel: 'Marina Waterfront Slip · Berth C4',
    testAreaLabel: 'Open-Water Ocean Test Route',
    description:
      'Hand-carved wooden expedition canoe stabilized by twin timber outriggers, lashed crossed bow spars, iron survival axe, and rotating rear paddle-wheel.',
    displayPos: { x: 263.5, y: -0.35, z: 254.5, heading: 1.65 },
    inspectCameraOffset: { dx: -5.5, dy: 2.8, dz: -5.5 },
    testSpawnPos: { x: 274.0, y: -0.35, z: 258.0, heading: 1.65 },
    worldSpawnPos: { x: 263.5, y: -0.35, z: 254.5, heading: 1.65 },
    specs: {
      topSpeed: '56 km/h (Paddle-Wheel Boost)',
      propulsion: 'Rotating Stern Paddle-Wheel + Twin Stabilizer Outriggers',
      capacity: 'Paddler + Cargo Deck + Companion',
      controls: 'W/S Drive · A/D Steer · Shift Boost · V Bow Cam · E Dock',
      originRegion: 'Kadalkarai Harbour & Exhibition Marina',
      sourceAsset: 'src/game/vehicles.ts · src/world/vehiclesWorld.ts',
      capabilities: ['Spinning Stern Paddle-Wheel', 'Twin Outrigger Floats', 'Expedition Gear'],
    },
  },
  {
    id: 'coastal_boat',
    name: 'Kadalkarai Harbour Boat',
    tamilName: 'கடற்கரை படகு',
    category: 'water',
    zoneId: 'zone_c_marine',
    zoneLabel: 'Zone C · Marine Gallery & Marina',
    floorLabel: 'Marine Pavilion Indoor Plinth · C2',
    testAreaLabel: 'Open-Water Ocean Test Route',
    description:
      'Classic painted coastal wooden motor-launch with teal-trimmed hull, warm brass bow lantern, and smooth wave-skimming handling.',
    displayPos: { x: 249.5, y: EXHIBITION_DECK_Y + 0.22, z: 235.5, heading: 1.57 },
    inspectCameraOffset: { dx: -4.2, dy: 2.2, dz: 3.5 },
    testSpawnPos: { x: 268.0, y: -0.35, z: 234.0, heading: 1.57 },
    worldSpawnPos: { x: 268.0, y: -0.35, z: 234.0, heading: 1.57 },
    specs: {
      topSpeed: '56 km/h (Ocean Cruise)',
      propulsion: 'Coastal Outboard Launch',
      capacity: 'Captain + Companion Bow Seat',
      controls: 'W/S Throttle · A/D Rudder · Shift Boost · V Bow Cam · E Dock',
      originRegion: 'Kadalkarai Harbour & Open Sea',
      sourceAsset: 'src/game/vehicles.ts · src/world/vehiclesWorld.ts',
      capabilities: ['Ocean Cruising', 'First-Person Bow Camera', 'Quick Harbour Return'],
    },
  },
  {
    id: 'lake_boat',
    name: 'Neelam Lake Rowboat',
    tamilName: 'நீலம் ஏரி படகு',
    category: 'water',
    zoneId: 'zone_c_marine',
    zoneLabel: 'Zone C · Marine Gallery & Marina',
    floorLabel: 'Marine Pavilion Indoor Plinth · C1',
    testAreaLabel: 'Neelam Mirror Lake Basin',
    description:
      'Hand-planked timber lake rowboat with animated twin oars, peaceful gliding physics, and brass bow lantern for sunset lake voyages.',
    displayPos: { x: 249.5, y: EXHIBITION_DECK_Y + 0.22, z: 244.5, heading: 1.57 },
    inspectCameraOffset: { dx: -4.2, dy: 2.1, dz: -3.5 },
    testSpawnPos: { x: 34.5, y: -0.35, z: -14.5, heading: 2.35 },
    worldSpawnPos: { x: 34.5, y: -0.35, z: -14.5, heading: 2.35 },
    specs: {
      topSpeed: '38 km/h (Synchronized Oars)',
      propulsion: 'Twin Animated Wooden Oars',
      capacity: 'Rower + Companion Bow Seat',
      controls: 'W/S Row · A/D Turn · Shift Sprint Row · V Bow Cam · E Dock',
      originRegion: 'Neelam Mirror Lake & Campsite',
      sourceAsset: 'src/game/vehicles.ts · src/world/vehiclesWorld.ts',
      capabilities: ['Animated Twin Oars', 'Calm Mirror Lake Navigation', 'Bow FPV Cam'],
    },
  },
];

export function getExhibitionVehicleById(id: string): ExhibitionVehicleEntry | undefined {
  return EXHIBITION_VEHICLE_CATALOG.find((v) => v.id === id);
}
