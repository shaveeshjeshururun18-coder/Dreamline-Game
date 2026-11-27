import { HERO_CHARACTERS, type HeroCharacterId } from './heroCharacters';
import { groundHeightAt, HOME_CENTER, isWaterAt, WORLD_PLAYABLE_RADIUS } from './terrain';

/**
 * Pure spatial layout, hidden hatch mechanics, superhero costume display pods,
 * and drivable underground garage car physics for the Secret Underground Floor
 * hidden beneath En Illam (My Home).
 */

export const VAULT_FLOOR_Y = -28.0;
export const VAULT_CEILING_Y = -6.0; // Soaring 22m cathedral-height subterranean superhero base!
export const VAULT_HEIGHT = VAULT_CEILING_Y - VAULT_FLOOR_Y;
export const VAULT_HALF_X = 28.0; // 56m wide main subterranean hall
export const VAULT_HALF_Z = 24.0; // 48m deep main subterranean hall

/** Long East Driving Passage Tunnel extending 94m out from the secret base to the animated outside blast gate */
export const VAULT_PASSAGE_START_X = 28.0;
export const VAULT_PASSAGE_END_X = 122.0;
export const VAULT_PASSAGE_HALF_Z = 5.4;
export const VAULT_PASSAGE_HEIGHT = 10.5;
export const VAULT_EXIT_GATE_X = 114.0;

/**
 * Real Superhero House Secret Tunnel (tucked directly beneath Twin Helipad Pad B on the West Wing of En Illam).
 * - Outside Armored Blast Doors sit at z = -12.0 facing South (+z) into En Illam's front yard.
 * - Flat covered concrete vestibule runs z = -12.0..-19.5 at y = 0.04m, connecting straight into En Illam's
 *   Living Room West Wall via an animated Interior Secret Wall Door at x = -28.1, z = -18.1!
 * - 62.5m illuminated descending concrete ramp runs z = -19.5..-82.0 smoothly from y = 0.04m down to y = -28.0m!
 */
export const VAULT_HOME_TUNNEL_X = HOME_CENTER.x - 11.4; // -33.4 (centered right beneath Pad B!)
export const VAULT_HOME_TUNNEL_HALF_X = 3.15; // 6.3m clear driving/walking width inside Pad B columns (-36.8..-30.0)
export const VAULT_HOME_TUNNEL_MIN_X = VAULT_HOME_TUNNEL_X - VAULT_HOME_TUNNEL_HALF_X; // -36.55
export const VAULT_HOME_TUNNEL_MAX_X = VAULT_HOME_TUNNEL_X + VAULT_HOME_TUNNEL_HALF_X; // -30.25
export const VAULT_HOME_TUNNEL_MOUTH_Z = -12.0; // Exterior animated blast doors facing South into yard
export const VAULT_HOME_TUNNEL_RAMP_TOP_Z = -19.5; // End of flat vestibule / start of 62.5m downward ramp
export const VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z = -82.0; // Arrives directly at 0m start line of the 1 KM Mega-Chamber!

export const VAULT_HOME_INTERIOR_DOOR_LOCAL = { x: -6.1, y: 0.45, z: -2.1 } as const;
export const VAULT_HOME_INTERIOR_DOOR_WORLD = {
  x: HOME_CENTER.x + VAULT_HOME_INTERIOR_DOOR_LOCAL.x, // -28.1
  y: VAULT_HOME_INTERIOR_DOOR_LOCAL.y, // 0.45
  z: HOME_CENTER.z + VAULT_HOME_INTERIOR_DOOR_LOCAL.z, // -18.1
} as const;
export const VAULT_HOME_INTERIOR_DOOR_MIN_Z = VAULT_HOME_INTERIOR_DOOR_WORLD.z - 1.2; // -19.3
export const VAULT_HOME_INTERIOR_DOOR_MAX_Z = VAULT_HOME_INTERIOR_DOOR_WORLD.z + 1.2; // -16.9

/** Outside vantage point in En Illam's front yard facing North directly at the House Secret Tunnel Portal */
export const VAULT_HOME_OUTSIDE_STAND_POS = {
  x: VAULT_HOME_TUNNEL_X,
  z: -2.5,
  heading: Math.PI,
} as const;

/** Wide Connector Avenue joining Main Superhero Vault (z = -24) seamlessly to the 1 KM Mega-Chamber (z = -82) */
export const VAULT_CONNECTOR_MIN_X = -27.8;
export const VAULT_CONNECTOR_MAX_X = -20.2;
export const VAULT_CONNECTOR_START_Z = -24.0;
export const VAULT_CONNECTOR_END_Z = -82.0;

/**
 * Literal 1 KM (1,000.0 m) Underground Superhero Mega-Chamber & High-Speed Proving Arena!
 * - Width: 52.0 m (x in [-46.0, +6.0])
 * - Length: 1,000.0 m (z in [-1082.0, -82.0]) — literally 1.00 KM straightaway!
 * - Ceiling Height: 22.0 m (y in [-28.0, -6.0]) — room for flying, web-swinging, & 220+ km/h hypercar runs!
 */
export const VAULT_MEGA_MIN_X = -46.0;
export const VAULT_MEGA_MAX_X = 6.0;
export const VAULT_MEGA_CENTER_X = (VAULT_MEGA_MIN_X + VAULT_MEGA_MAX_X) * 0.5; // -20.0
export const VAULT_MEGA_WIDTH = VAULT_MEGA_MAX_X - VAULT_MEGA_MIN_X; // 52.0m
export const VAULT_MEGA_START_Z = -82.0;
export const VAULT_MEGA_CHAMBER_LENGTH = 1000.0; // Literal 1.00 KM!
export const VAULT_MEGA_END_Z = VAULT_MEGA_START_Z - VAULT_MEGA_CHAMBER_LENGTH; // -1082.0

/** Local coordinates inside En Illam ground floor (relative to HOME_CENTER) */
export const VAULT_SWITCH_LOCAL = { x: -2.45, y: 0.45, z: 0.3 } as const;
export const VAULT_HATCH_LOCAL = { x: -0.95, y: 0.45, z: 1.85 } as const;

export const VAULT_SWITCH_WORLD = {
  x: HOME_CENTER.x + VAULT_SWITCH_LOCAL.x,
  y: VAULT_SWITCH_LOCAL.y,
  z: HOME_CENTER.z + VAULT_SWITCH_LOCAL.z,
} as const;

export const VAULT_HATCH_WORLD = {
  x: HOME_CENTER.x + VAULT_HATCH_LOCAL.x,
  y: VAULT_HATCH_LOCAL.y,
  z: HOME_CENTER.z + VAULT_HATCH_LOCAL.z,
} as const;

/** Key underground landmarks in vault coordinates */
export const VAULT_SPAWN_POS = { x: 0, y: VAULT_FLOOR_Y, z: 14.5, heading: Math.PI } as const;
export const VAULT_ELEVATOR_POS = { x: 0, y: VAULT_FLOOR_Y, z: 19.6 } as const;
export const VAULT_ARMORY_CONSOLE_POS = { x: -12.5, y: VAULT_FLOOR_Y, z: -11.8 } as const;
export const VAULT_EXIT_TUNNEL_POS = { x: VAULT_EXIT_GATE_X, y: VAULT_FLOOR_Y, z: 0.0 } as const;
export const VAULT_GATE_CONTROL_POS = { x: 26.2, y: VAULT_FLOOR_Y, z: -6.4 } as const;
export const VAULT_FAR_GATE_CONTROL_POS = { x: 109.5, y: VAULT_FLOOR_Y, z: -4.2 } as const;

/** Physical surface tunnel portal exit point right at the top of the 94m inclined East Driving Ramp (ZERO teleport!) */
export const VAULT_SURFACE_DRIVE_EXIT = {
  x: 124.0,
  z: 0.0,
  heading: Math.PI * 0.5,
} as const;

export const VAULT_SURFACE_PORTAL_X = VAULT_PASSAGE_END_X; // 122.0m — exact top of inclined ramp!
export const VAULT_SURFACE_PORTAL_Y = Math.max(0.0, groundHeightAt(VAULT_SURFACE_PORTAL_X, 0.0));

/**
 * Continuous physical floor height throughout:
 * 1. Main cavern & 1 KM Mega-Chamber & Connector Avenue: flat VAULT_FLOOR_Y (-28.0m)
 * 2. Inclined East Driving Ramp (x = 28..122, |z| <= 6.5): smooth climb from -28.0m to surface daylight
 * 3. Superhero House Secret Tunnel Ramp (x in [-36.55, -30.25], z = -82..-12): smooth climb from -28.0m to y = 0.04m
 * 4. En Illam Interior Secret Wall Threshold (x in [-30.25, -28.1], z in [-19.4, -16.8]): gentle step from 0.04m to 0.45m
 */
export function vaultFloorYAt(x: number, z = 0): number {
  // 1. East Driving Ramp (x > 28)
  if (x > VAULT_PASSAGE_START_X && Math.abs(z) <= VAULT_PASSAGE_HALF_Z + 1.8) {
    const surfaceY = Math.max(0.0, groundHeightAt(VAULT_SURFACE_PORTAL_X, z));
    if (x >= VAULT_PASSAGE_END_X) return surfaceY;
    const t = (x - VAULT_PASSAGE_START_X) / (VAULT_PASSAGE_END_X - VAULT_PASSAGE_START_X);
    const eased = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
    return VAULT_FLOOR_Y + (surfaceY - VAULT_FLOOR_Y) * eased;
  }

  // 2. En Illam Interior Secret Door Threshold Corridor (connecting vestibule x=-30.25 to Living Room x=-28.1)
  if (
    x > VAULT_HOME_TUNNEL_MAX_X &&
    x <= VAULT_HOME_INTERIOR_DOOR_WORLD.x + 0.5 &&
    z >= VAULT_HOME_INTERIOR_DOOR_MIN_Z - 0.3 &&
    z <= VAULT_HOME_INTERIOR_DOOR_MAX_Z + 0.3
  ) {
    const t = Math.max(
      0,
      Math.min(1, (x - VAULT_HOME_TUNNEL_MAX_X) / (VAULT_HOME_INTERIOR_DOOR_WORLD.x - VAULT_HOME_TUNNEL_MAX_X))
    );
    return 0.04 + (VAULT_HOME_INTERIOR_DOOR_WORLD.y - 0.04) * t;
  }

  // 3. Superhero House Secret Tunnel Vestibule & 62.5m Descending Ramp (x in [-36.55, -30.25], z in [-82, -12])
  if (
    x >= VAULT_HOME_TUNNEL_MIN_X - 0.6 &&
    x <= VAULT_HOME_TUNNEL_MAX_X + 0.6 &&
    z > VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z
  ) {
    if (z >= VAULT_HOME_TUNNEL_RAMP_TOP_Z) return 0.04;
    const t =
      (VAULT_HOME_TUNNEL_RAMP_TOP_Z - z) /
      (VAULT_HOME_TUNNEL_RAMP_TOP_Z - VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z);
    const eased = t * t * (3 - 2 * t) * 0.28 + t * 0.72;
    return 0.04 + (VAULT_FLOOR_Y - 0.04) * eased;
  }

  return VAULT_FLOOR_Y;
}

/** True when player or vehicle is inside the literal 1,000 m (1.00 KM) Underground Mega-Chamber */
export function isInsideMegaChamber(x: number, z: number): boolean {
  return (
    x >= VAULT_MEGA_MIN_X - 1.0 &&
    x <= VAULT_MEGA_MAX_X + 1.0 &&
    z <= VAULT_MEGA_START_Z + 1.5 &&
    z >= VAULT_MEGA_END_Z - 1.5
  );
}

/** Distance in meters (0..1000) traveled down the 1 KM Underground Superhero Mega-Chamber */
export function getVaultMegaChamberDistanceM(x: number, z: number): number {
  if (!isInsideMegaChamber(x, z)) return 0;
  return Math.max(0, Math.min(VAULT_MEGA_CHAMBER_LENGTH, Math.round(VAULT_MEGA_START_Z - z)));
}

/** True when player or vehicle on the surface enters the open Superhero House Secret Tunnel Portal (outside OR via interior wall door) */
export function isEnteringHouseSecretTunnelFromSurface(
  x: number,
  z: number,
  hatchOpenProgress: number
): boolean {
  if (hatchOpenProgress < 0.25) return false;
  // Walking/driving North through the open exterior armored blast doors (z = -12.0)
  const throughExteriorMouth =
    x >= VAULT_HOME_TUNNEL_MIN_X + 0.2 &&
    x <= VAULT_HOME_TUNNEL_MAX_X - 0.2 &&
    z <= VAULT_HOME_TUNNEL_MOUTH_Z - 0.35 &&
    z >= VAULT_HOME_TUNNEL_RAMP_TOP_Z - 2.0;
  // Walking West through En Illam's open Interior Secret Wall Door (x = -28.1 -> -30.25)
  const throughInteriorDoor =
    x <= VAULT_HOME_INTERIOR_DOOR_WORLD.x - 0.35 &&
    x >= VAULT_HOME_TUNNEL_MIN_X &&
    z >= VAULT_HOME_INTERIOR_DOOR_MIN_Z &&
    z <= VAULT_HOME_INTERIOR_DOOR_MAX_Z;
  return throughExteriorMouth || throughInteriorDoor;
}

/** True when player or vehicle underground physically exits out the open Superhero House Secret Tunnel Portal into yard or living room */
export function isExitingHouseSecretTunnelToSurface(
  x: number,
  z: number,
  hatchOpenProgress: number
): 'yard' | 'living_room' | null {
  if (hatchOpenProgress < 0.45) return null;
  // Exiting South out the exterior blast doors into En Illam front yard
  if (
    x >= VAULT_HOME_TUNNEL_MIN_X - 0.4 &&
    x <= VAULT_HOME_TUNNEL_MAX_X + 0.4 &&
    z >= VAULT_HOME_TUNNEL_MOUTH_Z - 0.15
  ) {
    return 'yard';
  }
  // Exiting East through the open Interior Secret Wall Door straight back into En Illam Living Room!
  if (
    x >= VAULT_HOME_INTERIOR_DOOR_WORLD.x - 0.15 &&
    x <= VAULT_HOME_INTERIOR_DOOR_WORLD.x + 1.4 &&
    z >= VAULT_HOME_INTERIOR_DOOR_MIN_Z &&
    z <= VAULT_HOME_INTERIOR_DOOR_MAX_Z
  ) {
    return 'living_room';
  }
  return null;
}

/**
 * Returns true if the player or vehicle on the surface is right outside the permanent East hillside tunnel portal mouth
 * and wants to walk/drive literally back down the ramp underground!
 */
export function isNearSurfaceTunnelMouth(x: number, z: number): boolean {
  return x >= VAULT_PASSAGE_END_X - 3.5 && x <= VAULT_PASSAGE_END_X + 6.5 && Math.abs(z) <= VAULT_PASSAGE_HALF_Z + 1.0;
}

/**
 * Returns true when a player or ANY vehicle is approaching the exterior House Secret Tunnel
 * armored blast doors (under Twin Helipad Pad B in En Illam's front yard) so the doors
 * automatically swing open for effortless drive-in access!
 */
export function isApproachingHouseTunnelExterior(x: number, z: number): boolean {
  return (
    x >= VAULT_HOME_TUNNEL_MIN_X - 4.5 &&
    x <= VAULT_HOME_TUNNEL_MAX_X + 4.5 &&
    z >= VAULT_HOME_TUNNEL_MOUTH_Z - 2.5 &&
    z <= VAULT_HOME_TUNNEL_MOUTH_Z + 15.0
  );
}

export interface GenericVehicleTunnelStepInput {
  x: number;
  z: number;
  heading: number;
  speed: number;
  inVault: boolean;
  exitGateProgress: number;
  hatchOpenProgress: number;
  margin?: number;
}

export interface GenericVehicleTunnelStepResult {
  x: number;
  z: number;
  y: number;
  inVault: boolean;
  enteredVault: boolean;
  exitedToSurface: boolean;
  hitWall: boolean;
}

/**
 * Universal Secret Underground Tunnel & 1 KM Mega-Chamber transition helper for ANY vehicle
 * (49cc Dirt Bike, Safari Jeep, Olga Camper Van, Jurassic Safari Cruiser, Rural Bus, Boats,
 * Jet Skis, VTOL, Helicopters, etc.) — lets every vehicle drive seamlessly from the surface
 * straight down EITHER the Superhero House Secret Tunnel ramp OR the 94m East Hillside Ramp
 * into the -28.0m underground vault / 1 KM Mega-Chamber and drive straight back out into daylight!
 */
export function stepGenericVehicleVaultTunnel(
  input: GenericVehicleTunnelStepInput
): GenericVehicleTunnelStepResult {
  const {
    x: nextX,
    z: nextZ,
    heading,
    speed,
    inVault: wasInVault,
    exitGateProgress,
    hatchOpenProgress,
    margin = 1.65,
  } = input;

  if (wasInVault) {
    const gateOpen = exitGateProgress > 0.6;
    const houseOpen = hatchOpenProgress > 0.45;
    const velZ = Math.cos(heading) * speed;
    const velX = Math.sin(heading) * speed;

    // A. Drive straight South out the open Superhero House Secret Tunnel into En Illam front yard
    if (
      houseOpen &&
      nextX >= VAULT_HOME_TUNNEL_MIN_X - 0.6 &&
      nextX <= VAULT_HOME_TUNNEL_MAX_X + 0.6 &&
      nextZ >= VAULT_HOME_TUNNEL_MOUTH_Z - 0.15 &&
      velZ > 0.25
    ) {
      return {
        x: nextX,
        z: nextZ,
        y: Math.max(0, groundHeightAt(nextX, nextZ)),
        inVault: false,
        enteredVault: false,
        exitedToSurface: true,
        hitWall: false,
      };
    }

    // B. Drive straight East out the open 94m East Driving Ramp crest into daylight
    if (
      gateOpen &&
      nextX >= VAULT_SURFACE_DRIVE_EXIT.x - 0.4 &&
      Math.abs(nextZ) <= VAULT_PASSAGE_HALF_Z &&
      velX > 0.25
    ) {
      const clampedExitX = Math.min(nextX, VAULT_SURFACE_DRIVE_EXIT.x + 0.35);
      return {
        x: clampedExitX,
        z: nextZ,
        y: Math.max(0, groundHeightAt(clampedExitX, nextZ)),
        inVault: false,
        enteredVault: false,
        exitedToSurface: true,
        hitWall: false,
      };
    }

    // Otherwise clamp cleanly inside the tunnel ramps, Connector Avenue, Main Vault & 1 KM Mega-Chamber
    const clamped = clampVaultPosition(nextX, nextZ, margin, gateOpen, houseOpen);
    const inConnectorMouth =
      clamped.x >= VAULT_CONNECTOR_MIN_X && clamped.x <= VAULT_CONNECTOR_MAX_X;
    const inMainHall =
      clamped.x > -VAULT_HALF_X &&
      clamped.x <= VAULT_HALF_X &&
      clamped.z >= -VAULT_HALF_Z &&
      clamped.z <= VAULT_HALF_Z;
    const safeZ = inMainHall && !inConnectorMouth ? Math.max(-14.2, clamped.z) : clamped.z;
    const hitWall = clamped.hitWall || safeZ !== clamped.z;
    return {
      x: clamped.x,
      z: safeZ,
      y: vaultFloorYAt(clamped.x, safeZ),
      inVault: true,
      enteredVault: false,
      exitedToSurface: false,
      hitWall,
    };
  }

  // On Surface: check physical drive-in to EITHER underground tunnel portal!
  const velZ = Math.cos(heading) * speed;
  const velX = Math.sin(heading) * speed;

  // 1. Entering Superhero House Secret Tunnel driving North (z <= -12.35)
  if (
    isEnteringHouseSecretTunnelFromSurface(nextX, nextZ, hatchOpenProgress) &&
    velZ < -0.2
  ) {
    return {
      x: nextX,
      z: nextZ,
      y: vaultFloorYAt(nextX, nextZ),
      inVault: true,
      enteredVault: true,
      exitedToSurface: false,
      hitWall: false,
    };
  }

  // 2. Entering 94m East Hillside Tunnel driving West at (x ≈ 122, |z| <= 5.4)
  if (isNearSurfaceTunnelMouth(nextX, nextZ) && velX < -0.25 && nextX <= VAULT_PASSAGE_END_X + 1.5) {
    return {
      x: nextX,
      z: nextZ,
      y: vaultFloorYAt(nextX, nextZ),
      inVault: true,
      enteredVault: true,
      exitedToSurface: false,
      hitWall: false,
    };
  }

  return {
    x: nextX,
    z: nextZ,
    y: Math.max(0, groundHeightAt(nextX, nextZ)),
    inVault: false,
    enteredVault: false,
    exitedToSurface: false,
    hitWall: false,
  };
}

export interface VaultHeroPod {
  heroId: HeroCharacterId;
  name: string;
  alias: string;
  x: number;
  y: number;
  z: number;
  accentHex: number;
}

const HERO_POD_ACCENTS: Record<HeroCharacterId, number> = {
  steve_harrington: 0xfacc15,
  iron_man_classic: 0xef4444,
  iron_man_advanced: 0x38bdf8,
  hulkbuster: 0xf59e0b,
  batman: 0x94a3b8,
  spider_man: 0xe11d48,
  superman: 0x3b82f6,
};

/** All 7 superhero costume pods lined up along the illuminated North Hero Vault Wing */
export const VAULT_HERO_PODS: readonly VaultHeroPod[] = HERO_CHARACTERS.map((hero, idx) => {
  const count = HERO_CHARACTERS.length;
  const spacing = 6.2;
  const x = (idx - (count - 1) / 2) * spacing;
  return {
    heroId: hero.id,
    name: hero.name,
    alias: hero.alias,
    x,
    y: VAULT_FLOOR_Y,
    z: -18.2,
    accentHex: HERO_POD_ACCENTS[hero.id] ?? 0x38bdf8,
  };
});

export type VaultCarId = 'vault_supercar' | 'vault_roadster' | 'vault_suv';

export interface VaultCarSpec {
  id: VaultCarId;
  name: string;
  subtitle: string;
  bodyHex: number;
  accentHex: number;
  cruiseSpeed: number;
  boostSpeed: number;
  reverseSpeed: number;
  accel: number;
  turnRate: number;
  homeBayX: number;
  homeBayZ: number;
  homeHeading: number;
}

export const VAULT_CAR_SPECS: readonly VaultCarSpec[] = [
  {
    id: 'vault_supercar',
    name: 'Crimson Apex Hypercar',
    subtitle: 'Twin-Turbo Carbon Coupe · Underground Vault Bay 1',
    bodyHex: 0xdc2626,
    accentHex: 0xfacc15,
    cruiseSpeed: 34.0,
    boostSpeed: 48.0,
    reverseSpeed: 12.0,
    accel: 22.0,
    turnRate: 2.35,
    homeBayX: -15.5,
    homeBayZ: 6.0,
    homeHeading: Math.PI * 0.25,
  },
  {
    id: 'vault_roadster',
    name: 'Cobalt Volt Roadster',
    subtitle: 'Electric Neon Hyper-Roadster · Underground Vault Bay 2',
    bodyHex: 0x0284c7,
    accentHex: 0x67e8f9,
    cruiseSpeed: 33.0,
    boostSpeed: 46.0,
    reverseSpeed: 12.0,
    accel: 24.5,
    turnRate: 2.55,
    homeBayX: -5.5,
    homeBayZ: 6.0,
    homeHeading: Math.PI * 0.12,
  },
  {
    id: 'vault_suv',
    name: 'Emerald Titan 4x4 SUV',
    subtitle: 'Armoured All-Terrain Cruiser · Underground Vault Bay 3',
    bodyHex: 0x047857,
    accentHex: 0xf59e0b,
    cruiseSpeed: 26.5,
    boostSpeed: 36.5,
    reverseSpeed: 10.5,
    accel: 17.5,
    turnRate: 2.1,
    homeBayX: 5.5,
    homeBayZ: 6.0,
    homeHeading: -Math.PI * 0.12,
  },
] as const;

export const VAULT_BATMOBILE_BAY = {
  x: 15.5,
  y: VAULT_FLOOR_Y,
  z: 6.0,
  heading: -Math.PI * 0.25,
} as const;

export interface VaultCarRuntimeState {
  id: VaultCarId;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  speedKmh: number;
  steerAngle: number;
  wheelSpin: number;
  boostActive: boolean;
  headlightsOn: boolean;
  inVault: boolean;
}

export type VaultElevatorPhase = 'idle' | 'descending' | 'ascending';

export interface HomeVaultState {
  hatchUnlocked: boolean;
  hatchOpenProgress: number; // 0 = hidden flush floor, 1 = fully open secret shaft
  inVault: boolean;
  elevatorPhase: VaultElevatorPhase;
  elevatorProgress: number; // 0 = top (En Illam y=0.45), 1 = bottom (Vault y=-28.0)
  elevatorY: number;
  exitGateOpen: boolean;
  exitGateProgress: number; // 0 = blast door sealed, 1 = wide open to outside
  activeVaultCarId: VaultCarId | null;
  cars: VaultCarRuntimeState[];
}

export function createInitialVaultCars(): VaultCarRuntimeState[] {
  return VAULT_CAR_SPECS.map((spec) => ({
    id: spec.id,
    x: spec.homeBayX,
    y: VAULT_FLOOR_Y,
    z: spec.homeBayZ,
    heading: spec.homeHeading,
    speed: 0,
    speedKmh: 0,
    steerAngle: 0,
    wheelSpin: 0,
    boostActive: false,
    headlightsOn: true,
    inVault: true,
  }));
}

export function createInitialHomeVaultState(): HomeVaultState {
  return {
    hatchUnlocked: false,
    hatchOpenProgress: 0,
    inVault: false,
    elevatorPhase: 'idle',
    elevatorProgress: 0,
    elevatorY: VAULT_HATCH_WORLD.y,
    exitGateOpen: false,
    exitGateProgress: 0,
    activeVaultCarId: null,
    cars: createInitialVaultCars(),
  };
}

/**
 * Starts the physical hydraulic elevator ride DOWN into the Secret Underground Base (NO instant teleport!).
 */
export function startVaultElevatorDescent(state: HomeVaultState): HomeVaultState {
  return {
    ...state,
    hatchUnlocked: true,
    hatchOpenProgress: Math.max(state.hatchOpenProgress, 0.35),
    inVault: false,
    elevatorPhase: 'descending',
    elevatorProgress: 0,
    elevatorY: VAULT_HATCH_WORLD.y,
  };
}

/**
 * Starts the physical hydraulic elevator ride UP from the Secret Underground Base back into En Illam.
 */
export function startVaultElevatorAscent(state: HomeVaultState): HomeVaultState {
  return {
    ...state,
    hatchUnlocked: true,
    hatchOpenProgress: 1,
    elevatorPhase: 'ascending',
    elevatorProgress: 1,
    elevatorY: VAULT_FLOOR_Y,
  };
}

/**
 * Steps the physical hydraulic elevator smoothly through the 28m illuminated shaft.
 */
export function stepVaultElevator(
  state: HomeVaultState,
  dt: number
): { state: HomeVaultState; arrivedUnderground: boolean; arrivedSurface: boolean } {
  if (state.elevatorPhase === 'idle') {
    return { state, arrivedUnderground: false, arrivedSurface: false };
  }
  const safeDt = Math.min(0.1, Math.max(0.001, dt));
  const rideRate = 0.44; // ~2.25 seconds physical ride through the 28m shaft

  if (state.elevatorPhase === 'descending') {
    const nextProg = Math.min(1, state.elevatorProgress + rideRate * safeDt);
    const eased = nextProg * nextProg * (3 - 2 * nextProg);
    const nextY = VAULT_HATCH_WORLD.y + (VAULT_FLOOR_Y - VAULT_HATCH_WORLD.y) * eased;
    if (nextProg >= 1) {
      return {
        state: {
          ...state,
          inVault: true,
          elevatorPhase: 'idle',
          elevatorProgress: 1,
          elevatorY: VAULT_FLOOR_Y,
          hatchOpenProgress: 1,
        },
        arrivedUnderground: true,
        arrivedSurface: false,
      };
    }
    return {
      state: {
        ...state,
        elevatorProgress: nextProg,
        elevatorY: nextY,
        hatchOpenProgress: Math.min(1, state.hatchOpenProgress + safeDt * 3.0),
      },
      arrivedUnderground: false,
      arrivedSurface: false,
    };
  }

  // ascending
  const nextProg = Math.max(0, state.elevatorProgress - rideRate * safeDt);
  const eased = nextProg * nextProg * (3 - 2 * nextProg);
  const nextY = VAULT_HATCH_WORLD.y + (VAULT_FLOOR_Y - VAULT_HATCH_WORLD.y) * eased;
  if (nextProg <= 0) {
    return {
      state: {
        ...state,
        inVault: false,
        elevatorPhase: 'idle',
        elevatorProgress: 0,
        elevatorY: VAULT_HATCH_WORLD.y,
      },
      arrivedUnderground: false,
      arrivedSurface: true,
    };
  }
  return {
    state: {
      ...state,
      elevatorProgress: nextProg,
      elevatorY: nextY,
    },
    arrivedUnderground: false,
    arrivedSurface: false,
  };
}

export function getVaultCarSpec(id: VaultCarId): VaultCarSpec {
  return VAULT_CAR_SPECS.find((c) => c.id === id) ?? VAULT_CAR_SPECS[0];
}

/**
 * Checks whether the player is currently inside En Illam (ground or upper floor) on the surface.
 */
export function isPlayerInsidePersonalHome(
  px: number,
  py: number,
  pz: number,
  inVault: boolean
): boolean {
  if (inVault) return false;
  return (
    Math.abs(px - HOME_CENTER.x) <= 6.6 &&
    Math.abs(pz - HOME_CENTER.z) <= 5.6 &&
    py >= 0.0 &&
    py <= 9.5
  );
}

/**
 * Toggles the hidden secret hatch switch inside En Illam.
 */
export function toggleSecretVaultHatch(state: HomeVaultState): HomeVaultState {
  return {
    ...state,
    hatchUnlocked: !state.hatchUnlocked,
  };
}

/**
 * Toggles the massive hydraulic Exit Passage Blast Gate at the end of the 94m driving tunnel.
 */
export function toggleVaultExitGate(state: HomeVaultState): HomeVaultState {
  return {
    ...state,
    exitGateOpen: !state.exitGateOpen,
  };
}

/**
 * Smoothly animates both the secret floor hatch and the East Driving Passage Exit Blast Gate.
 */
export function stepSecretHatchAnimation(state: HomeVaultState, dt: number): HomeVaultState {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const hatchTarget = state.hatchUnlocked ? 1 : 0;
  const gateTarget = state.exitGateOpen ? 1 : 0;
  const hatchDiff = hatchTarget - state.hatchOpenProgress;
  const gateDiff = gateTarget - state.exitGateProgress;

  const nextHatch =
    Math.abs(hatchDiff) < 0.001
      ? hatchTarget
      : Math.max(0, Math.min(1, state.hatchOpenProgress + Math.sign(hatchDiff) * Math.min(Math.abs(hatchDiff), 2.4 * safeDt)));

  const nextGate =
    Math.abs(gateDiff) < 0.001
      ? gateTarget
      : Math.max(0, Math.min(1, state.exitGateProgress + Math.sign(gateDiff) * Math.min(Math.abs(gateDiff), 1.8 * safeDt)));

  if (nextHatch === state.hatchOpenProgress && nextGate === state.exitGateProgress) {
    return state;
  }
  return {
    ...state,
    hatchOpenProgress: nextHatch,
    exitGateProgress: nextGate,
  };
}

/**
 * Keeps players and vehicles cleanly inside:
 * 1. Main 56m x 48m Superhero Vault (x in [-28, 28], z in [-24, 24])
 * 2. 94m East Driving Passage Ramp (x in [28, 124], |z| <= 5.4)
 * 3. Wide Connector Avenue (x in [-27.8, -20.2], z in [-82, -24])
 * 4. Literal 1 KM (1,000 m) Underground Mega-Chamber (x in [-46, +6], z in [-1082, -82])
 * 5. Superhero House Secret Tunnel Ramp & Vestibule (x in [-36.55, -30.25], z in [-82, -12])
 *    + En Illam Interior Secret Wall Door corridor (x in [-30.25, -28.1], z in [-19.3, -16.9])
 */
export function clampVaultPosition(
  nextX: number,
  nextZ: number,
  margin = 1.4,
  exitGateOpen = false,
  houseTunnelOpen = true
): { x: number; z: number; hitWall: boolean } {
  const minX = -VAULT_HALF_X + margin;
  const hallMaxX = VAULT_HALF_X - margin;
  const minZ = -VAULT_HALF_Z + margin;
  const maxZ = VAULT_HALF_Z - margin;
  const passageHalfZ = Math.max(1.2, VAULT_PASSAGE_HALF_Z - Math.min(margin, 2.2));
  const passageMaxX = exitGateOpen
    ? VAULT_SURFACE_DRIVE_EXIT.x + 0.8
    : VAULT_EXIT_GATE_X - 1.2 - margin;

  // 1. Inside the literal 1 KM (1,000 m) Underground Superhero Mega-Chamber (z <= -82 + margin)
  if (
    nextZ <= VAULT_MEGA_START_Z + margin &&
    nextX >= VAULT_MEGA_MIN_X - 4.0 &&
    nextX <= VAULT_MEGA_MAX_X + 4.0
  ) {
    const megaMinX = VAULT_MEGA_MIN_X + margin;
    const megaMaxX = VAULT_MEGA_MAX_X - margin;
    const megaMinZ = VAULT_MEGA_END_Z + margin;
    const clampedX = Math.max(megaMinX, Math.min(megaMaxX, nextX));

    // Allow passing smoothly South out of the Mega-Chamber into EITHER the House Secret Tunnel Ramp OR the Connector Avenue!
    const inHomeRampBand =
      clampedX >= VAULT_HOME_TUNNEL_MIN_X + Math.min(margin, 1.35) &&
      clampedX <= VAULT_HOME_TUNNEL_MAX_X - Math.min(margin, 1.35);
    const inConnectorBand =
      clampedX >= VAULT_CONNECTOR_MIN_X + Math.min(margin, 1.4) &&
      clampedX <= VAULT_CONNECTOR_MAX_X - Math.min(margin, 1.4);

    const megaMaxZ =
      inHomeRampBand || inConnectorBand
        ? VAULT_MEGA_START_Z + margin
        : VAULT_MEGA_START_Z - margin;
    const clampedZ = Math.max(megaMinZ, Math.min(megaMaxZ, nextZ));
    return {
      x: clampedX,
      z: clampedZ,
      hitWall: clampedX !== nextX || clampedZ !== nextZ,
    };
  }

  // 2. Inside En Illam Interior Secret Wall Door Corridor (x in [-30.3, -27.2], z in [-19.4, -16.8])
  if (
    houseTunnelOpen &&
    nextX > VAULT_HOME_TUNNEL_MAX_X - 1.4 &&
    nextX <= VAULT_HOME_INTERIOR_DOOR_WORLD.x + 1.2 &&
    nextZ >= VAULT_HOME_INTERIOR_DOOR_MIN_Z &&
    nextZ <= VAULT_HOME_INTERIOR_DOOR_MAX_Z
  ) {
    const clampedZ = Math.max(
      VAULT_HOME_INTERIOR_DOOR_MIN_Z + 0.35,
      Math.min(VAULT_HOME_INTERIOR_DOOR_MAX_Z - 0.35, nextZ)
    );
    return {
      x: nextX,
      z: clampedZ,
      hitWall: clampedZ !== nextZ,
    };
  }

  // 3. Inside the Superhero House Secret Tunnel Vestibule & 62.5m Descending Ramp (x in [-36.55, -30.25], z in [-82, -12])
  if (
    nextX >= VAULT_HOME_TUNNEL_MIN_X - 1.2 &&
    nextX <= VAULT_HOME_TUNNEL_MAX_X + 1.2 &&
    nextZ > VAULT_MEGA_START_Z &&
    nextZ <= VAULT_HOME_TUNNEL_MOUTH_Z + 2.2
  ) {
    const rampMargin = Math.min(margin, 1.35);
    const rampMinX = VAULT_HOME_TUNNEL_MIN_X + rampMargin;
    const rampMaxX =
      houseTunnelOpen &&
      nextZ >= VAULT_HOME_INTERIOR_DOOR_MIN_Z + 0.2 &&
      nextZ <= VAULT_HOME_INTERIOR_DOOR_MAX_Z - 0.2
        ? VAULT_HOME_INTERIOR_DOOR_WORLD.x + 1.0
        : VAULT_HOME_TUNNEL_MAX_X - rampMargin;
    const rampMaxZ = houseTunnelOpen
      ? VAULT_HOME_TUNNEL_MOUTH_Z + 1.5
      : VAULT_HOME_TUNNEL_MOUTH_Z - 0.85 - Math.min(margin, 1.2);
    const clampedX = Math.max(rampMinX, Math.min(rampMaxX, nextX));
    const clampedZ = Math.max(VAULT_MEGA_START_Z - 1.0, Math.min(rampMaxZ, nextZ));
    return {
      x: clampedX,
      z: clampedZ,
      hitWall: clampedX !== nextX || clampedZ !== nextZ,
    };
  }

  // 4. Inside the Main Vault <-> 1 KM Mega-Chamber Connector Avenue (x in [-27.8, -20.2], z in [-82, -24])
  if (
    nextZ < minZ &&
    nextZ > VAULT_MEGA_START_Z &&
    nextX >= VAULT_CONNECTOR_MIN_X - 1.2 &&
    nextX <= VAULT_CONNECTOR_MAX_X + 1.2
  ) {
    const connMargin = Math.min(margin, 1.55);
    const clampedX = Math.max(
      VAULT_CONNECTOR_MIN_X + connMargin,
      Math.min(VAULT_CONNECTOR_MAX_X - connMargin, nextX)
    );
    return {
      x: clampedX,
      z: nextZ,
      hitWall: clampedX !== nextX,
    };
  }

  // 5. Inside or entering the long East Driving Passage mouth (|z| <= passageHalfZ, x > hallMaxX)
  if (nextX > hallMaxX && Math.abs(nextZ) <= VAULT_PASSAGE_HALF_Z) {
    const clampedX = Math.max(minX, Math.min(passageMaxX, nextX));
    const clampedZ = Math.max(-passageHalfZ, Math.min(passageHalfZ, nextZ));
    return {
      x: clampedX,
      z: clampedZ,
      hitWall: clampedX !== nextX || clampedZ !== nextZ,
    };
  }

  // 6. Inside the main 56m x 48m cathedral cavern (with open North Connector mouth at x in [-27.8, -20.2])
  const clampedX = Math.max(minX, Math.min(hallMaxX, nextX));
  const inNorthConnectorMouth =
    clampedX >= VAULT_CONNECTOR_MIN_X + Math.min(margin, 1.4) &&
    clampedX <= VAULT_CONNECTOR_MAX_X - Math.min(margin, 1.4);
  const effectiveMinZ = inNorthConnectorMouth ? VAULT_MEGA_START_Z : minZ;
  const clampedZ = Math.max(effectiveMinZ, Math.min(maxZ, nextZ));
  const hitWall = clampedX !== nextX || clampedZ !== nextZ;
  return { x: clampedX, z: clampedZ, hitWall };
}

/**
 * Returns true if a vehicle or player has passed through the OPEN outside blast gate at the far end of the 94m East passage.
 */
export function isInsideVaultDriveExitTunnel(
  x: number,
  z: number,
  exitGateProgress = 1
): boolean {
  return (
    exitGateProgress > 0.6 &&
    x >= VAULT_EXIT_GATE_X + 2.2 &&
    Math.abs(z) <= VAULT_PASSAGE_HALF_Z
  );
}

/**
 * Pure physics integrator for driving any of the underground vault cars —
 * supports driving seamlessly inside the 22m-tall underground base, blazing up to 220+ km/h down the
 * literal 1 KM (1,000 m) Underground Mega-Chamber, climbing the 62.5m Superhero House Secret Tunnel Ramp
 * OR the 94m East Driving Ramp, and driving straight in/out onto the open-world surface with ZERO teleport!
 */
export function stepVaultCarState(
  prev: VaultCarRuntimeState,
  throttle: number,
  steerInput: number,
  boostPressed: boolean,
  brakePressed: boolean,
  dt: number,
  exitGateProgress = 1,
  houseTunnelProgress = 1
): { state: VaultCarRuntimeState; exitedToSurface: boolean; enteredVault?: boolean } {
  const spec = getVaultCarSpec(prev.id);
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const boosting = boostPressed && throttle > 0.1 && !brakePressed;
  const inMega = prev.inVault && isInsideMegaChamber(prev.x, prev.z);
  const inDrivingPassage =
    prev.inVault &&
    (prev.x > VAULT_PASSAGE_START_X - 3.0 ||
      (prev.z < -VAULT_HALF_Z + 2.0 && prev.z > VAULT_MEGA_START_Z));
  // Full proving-ground velocity inside the literal 1 KM Mega-Chamber (up to ~223 km/h boosted!)
  const maxFwd = prev.inVault
    ? inMega
      ? boosting
        ? Math.max(60.0, spec.boostSpeed * 1.28)
        : Math.max(42.0, spec.cruiseSpeed * 1.24)
      : inDrivingPassage
        ? boosting
          ? Math.min(38.0, spec.boostSpeed)
          : Math.min(28.0, spec.cruiseSpeed)
        : boosting
          ? Math.min(26.0, spec.boostSpeed)
          : Math.min(19.0, spec.cruiseSpeed)
    : boosting
      ? spec.boostSpeed
      : spec.cruiseSpeed;

  let speed = prev.speed;
  if (brakePressed) {
    const decel = 36.0 * safeDt;
    speed = Math.abs(speed) <= decel ? 0 : speed - Math.sign(speed) * decel;
  } else if (throttle > 0.05) {
    const accel = boosting ? spec.accel * 1.45 : spec.accel;
    speed = Math.min(maxFwd, speed + throttle * accel * safeDt);
  } else if (throttle < -0.05) {
    if (speed > 0.5) {
      speed = Math.max(0, speed - 28.0 * safeDt);
    } else {
      speed = Math.max(-spec.reverseSpeed, speed + throttle * 14.5 * safeDt);
    }
  } else {
    const drag = (6.2 + Math.abs(speed) * 0.22) * safeDt;
    speed = Math.abs(speed) <= drag ? 0 : speed - Math.sign(speed) * drag;
  }

  const targetSteer = Math.max(-0.58, Math.min(0.58, -steerInput * 0.58));
  const steerAngle = prev.steerAngle + (targetSteer - prev.steerAngle) * (1 - Math.exp(-10.5 * safeDt));

  const speedSign = speed >= -0.05 ? 1 : -1;
  const turnFactor = Math.min(1, Math.abs(speed) / 4.2) * (1 - Math.min(0.45, Math.abs(speed) / 96));
  const heading = prev.heading + steerAngle * turnFactor * spec.turnRate * speedSign * safeDt;

  let nextX = prev.x + Math.sin(heading) * speed * safeDt;
  let nextZ = prev.z + Math.cos(heading) * speed * safeDt;
  let nextY = prev.y;
  let inVault = prev.inVault;
  let exitedToSurface = false;
  let enteredVault = false;

  if (inVault) {
    const gateOpen = exitGateProgress > 0.6;
    const houseOpen = houseTunnelProgress > 0.45;

    // A. Real physical exit out the open Superhero House Secret Tunnel Portal into front yard (ZERO teleport!)
    if (
      houseOpen &&
      nextX >= VAULT_HOME_TUNNEL_MIN_X - 0.5 &&
      nextX <= VAULT_HOME_TUNNEL_MAX_X + 0.5 &&
      nextZ >= VAULT_HOME_TUNNEL_MOUTH_Z - 0.15 &&
      Math.cos(heading) * speed > 0.4
    ) {
      inVault = false;
      exitedToSurface = true;
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    }
    // B. Real physical exit out the open 94m East Driving Ramp Crest (ZERO teleport!)
    else if (
      gateOpen &&
      nextX >= VAULT_SURFACE_DRIVE_EXIT.x - 0.4 &&
      Math.abs(nextZ) <= VAULT_PASSAGE_HALF_Z &&
      speed > 0.5
    ) {
      inVault = false;
      exitedToSurface = true;
      nextX = Math.min(nextX, VAULT_SURFACE_DRIVE_EXIT.x + 0.35);
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    } else {
      const clamped = clampVaultPosition(nextX, nextZ, 2.0, gateOpen, houseOpen);
      // Keep cars clear of the Hero Display Pod glass alcoves on the main hall north wall (except through Connector Avenue!)
      const inConnectorMouth =
        clamped.x >= VAULT_CONNECTOR_MIN_X && clamped.x <= VAULT_CONNECTOR_MAX_X;
      const inMainHall =
        clamped.x > -VAULT_HALF_X &&
        clamped.x <= VAULT_HALF_X &&
        clamped.z >= -VAULT_HALF_Z &&
        clamped.z <= VAULT_HALF_Z;
      const safeZ =
        inMainHall && !inConnectorMouth ? Math.max(-14.2, clamped.z) : clamped.z;
      if (clamped.hitWall || safeZ !== clamped.z) {
        speed *= -0.18;
      }
      nextX = clamped.x;
      nextZ = safeZ;
      // Continuous physical floor across Main Hall, 1 KM Mega-Chamber, House Ramp, & East Ramp!
      nextY = vaultFloorYAt(nextX, nextZ);
    }
  } else {
    // Check if driving straight North from the front yard INTO the open Superhero House Secret Tunnel!
    if (
      isEnteringHouseSecretTunnelFromSurface(nextX, nextZ, houseTunnelProgress) &&
      Math.cos(heading) * speed < -0.35
    ) {
      inVault = true;
      enteredVault = true;
      nextY = vaultFloorYAt(nextX, nextZ);
    } else {
      const worldR = Math.hypot(nextX, nextZ);
      if (worldR > WORLD_PLAYABLE_RADIUS - 12 || isWaterAt(nextX, nextZ)) {
        nextX = prev.x;
        nextZ = prev.z;
        speed *= -0.25;
      }
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    }
  }

  const wheelSpin = prev.wheelSpin + (speed / 0.44) * safeDt;

  return {
    state: {
      ...prev,
      x: nextX,
      y: nextY,
      z: nextZ,
      heading,
      speed,
      speedKmh: Math.round(Math.abs(speed) * 3.6),
      steerAngle,
      wheelSpin,
      boostActive: boosting,
      inVault,
    },
    exitedToSurface,
    enteredVault,
  };
}
