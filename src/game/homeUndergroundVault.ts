import { HERO_CHARACTERS, type HeroCharacterId } from './heroCharacters';
import { groundHeightAt, HOME_CENTER, isWaterAt, WORLD_PLAYABLE_RADIUS } from './terrain';

/**
 * Pure spatial layout, hidden hatch mechanics, superhero costume display pods,
 * and drivable underground garage car physics for the Secret Underground Floor
 * hidden beneath En Illam (My Home).
 */

export const VAULT_FLOOR_Y = -14.0;
export const VAULT_CEILING_Y = -5.0;
export const VAULT_HALF_X = 28.0; // 56m wide subterranean hall
export const VAULT_HALF_Z = 24.0; // 48m deep subterranean hall

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
export const VAULT_EXIT_TUNNEL_POS = { x: 25.4, y: VAULT_FLOOR_Y, z: 0.0 } as const;

/** Open countryside driveway point right outside En Illam when driving out of the underground garage */
export const VAULT_SURFACE_DRIVE_EXIT = {
  x: HOME_CENTER.x + 14.5,
  z: HOME_CENTER.z + 11.5,
  heading: 0.35,
} as const;

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

export interface HomeVaultState {
  hatchUnlocked: boolean;
  hatchOpenProgress: number; // 0 = hidden flush floor, 1 = fully open secret shaft
  inVault: boolean;
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
    activeVaultCarId: null,
    cars: createInitialVaultCars(),
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
 * Smoothly animates the secret floor hatch sliding open / closed.
 */
export function stepSecretHatchAnimation(state: HomeVaultState, dt: number): HomeVaultState {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const target = state.hatchUnlocked ? 1 : 0;
  const rate = 2.4;
  const diff = target - state.hatchOpenProgress;
  if (Math.abs(diff) < 0.001) {
    return state.hatchOpenProgress === target ? state : { ...state, hatchOpenProgress: target };
  }
  const step = Math.sign(diff) * Math.min(Math.abs(diff), rate * safeDt);
  return {
    ...state,
    hatchOpenProgress: Math.max(0, Math.min(1, state.hatchOpenProgress + step)),
  };
}

/**
 * Keeps players and vehicles cleanly inside the spacious subterranean vault boundaries.
 */
export function clampVaultPosition(
  nextX: number,
  nextZ: number,
  margin = 1.4
): { x: number; z: number; hitWall: boolean } {
  const minX = -VAULT_HALF_X + margin;
  const maxX = VAULT_HALF_X - margin;
  const minZ = -VAULT_HALF_Z + margin;
  const maxZ = VAULT_HALF_Z - margin;

  // Keep player/cars out of the solid Hero Pod glass alcove row back wall (z < -16.1)
  const effectiveMinZ = minZ;
  const clampedX = Math.max(minX, Math.min(maxX, nextX));
  const clampedZ = Math.max(effectiveMinZ, Math.min(maxZ, nextZ));
  const hitWall = clampedX !== nextX || clampedZ !== nextZ;
  return { x: clampedX, z: clampedZ, hitWall };
}

/**
 * Returns true if a vehicle driving inside the underground garage has entered the East Surface Exit Tunnel.
 */
export function isInsideVaultDriveExitTunnel(x: number, z: number): boolean {
  return x >= VAULT_EXIT_TUNNEL_POS.x - 1.8 && Math.abs(z - VAULT_EXIT_TUNNEL_POS.z) <= 4.4;
}

/**
 * Pure physics integrator for driving any of the underground vault cars —
 * supports driving smoothly inside the huge underground bunker AND cruising outside on the open-world surface!
 */
export function stepVaultCarState(
  prev: VaultCarRuntimeState,
  throttle: number,
  steerInput: number,
  boostPressed: boolean,
  brakePressed: boolean,
  dt: number
): { state: VaultCarRuntimeState; exitedToSurface: boolean } {
  const spec = getVaultCarSpec(prev.id);
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const boosting = boostPressed && throttle > 0.1 && !brakePressed;
  // Slightly gentler top speed inside the underground bunker so steering feels crisp indoors
  const maxFwd = prev.inVault
    ? boosting
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
    const accel = boosting ? spec.accel * 1.4 : spec.accel;
    speed = Math.min(maxFwd, speed + throttle * accel * safeDt);
  } else if (throttle < -0.05) {
    if (speed > 0.5) {
      speed = Math.max(0, speed - 28.0 * safeDt);
    } else {
      speed = Math.max(-spec.reverseSpeed, speed + throttle * 14.5 * safeDt);
    }
  } else {
    const drag = (6.2 + Math.abs(speed) * 0.24) * safeDt;
    speed = Math.abs(speed) <= drag ? 0 : speed - Math.sign(speed) * drag;
  }

  const targetSteer = Math.max(-0.58, Math.min(0.58, -steerInput * 0.58));
  const steerAngle = prev.steerAngle + (targetSteer - prev.steerAngle) * (1 - Math.exp(-10.5 * safeDt));

  const speedSign = speed >= -0.05 ? 1 : -1;
  const turnFactor = Math.min(1, Math.abs(speed) / 4.2) * (1 - Math.min(0.4, Math.abs(speed) / 88));
  let heading = prev.heading + steerAngle * turnFactor * spec.turnRate * speedSign * safeDt;

  let nextX = prev.x + Math.sin(heading) * speed * safeDt;
  let nextZ = prev.z + Math.cos(heading) * speed * safeDt;
  let nextY = prev.y;
  let inVault = prev.inVault;
  let exitedToSurface = false;

  if (inVault) {
    // Driving into the illuminated East Exit Tunnel seamlessly drives the car out onto the surface road!
    if (isInsideVaultDriveExitTunnel(nextX, nextZ) && speed > 1.5) {
      inVault = false;
      exitedToSurface = true;
      nextX = VAULT_SURFACE_DRIVE_EXIT.x;
      nextZ = VAULT_SURFACE_DRIVE_EXIT.z;
      heading = VAULT_SURFACE_DRIVE_EXIT.heading;
      nextY = Math.max(0, groundHeightAt(nextX, nextZ));
    } else {
      const clamped = clampVaultPosition(nextX, nextZ, 2.4);
      // Keep cars clear of the Hero Display Pod glass alcoves on the far north wall
      const safeZ = Math.max(-14.2, clamped.z);
      if (clamped.hitWall || safeZ !== clamped.z) {
        speed *= -0.18;
      }
      nextX = clamped.x;
      nextZ = safeZ;
      nextY = VAULT_FLOOR_Y;
    }
  } else {
    const worldR = Math.hypot(nextX, nextZ);
    if (worldR > WORLD_PLAYABLE_RADIUS - 12 || isWaterAt(nextX, nextZ)) {
      nextX = prev.x;
      nextZ = prev.z;
      speed *= -0.25;
    }
    nextY = Math.max(0, groundHeightAt(nextX, nextZ));
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
  };
}
