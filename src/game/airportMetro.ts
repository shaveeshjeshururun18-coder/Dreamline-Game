import type { AabbCollider } from './terrain';

/**
 * Dreamline Underground Metro Station & Dreamline International Airport
 * Pure Spatial Layout, Multi-Level Walkability, Subway Train & Commercial Airliner Physics
 */

// ─── DREAMLINE INTERNATIONAL AIRPORT (NE Flat Coastal-Plateau Expanse) ────────

export const AIRPORT_CENTER = { x: 215, z: -135 } as const;
export const AIRPORT_HALF_X = 68;
export const AIRPORT_HALF_Z = 58;
export const AIRPORT_GROUND_Y = 0.65;

export const AIRPORT_SPAWN = { x: 185, z: -137 } as const;
export const AIRPORT_TERMINAL_CENTER = { x: 185, z: -160 } as const;
export const AIRPORT_ATC_TOWER_POS = { x: 224, z: -162 } as const;

export const AIRPORT_RUNWAY_BOUNDS = {
  minX: 156,
  maxX: 274,
  minZ: -112,
  maxZ: -96,
  centerZ: -104,
} as const;

export const AIRPORT_JET_PARK_POS = {
  x: 198,
  y: AIRPORT_GROUND_Y,
  z: -124,
  heading: Math.PI * 0.5, // Facing East toward Runway 09 threshold
} as const;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function isInsideAirport(x: number, z: number, pad = 0): boolean {
  return (
    Math.abs(x - AIRPORT_CENTER.x) <= AIRPORT_HALF_X + pad &&
    Math.abs(z - AIRPORT_CENTER.z) <= AIRPORT_HALF_Z + pad
  );
}

export function applyAirportTerrainHeight(x: number, z: number, baseH: number): number {
  if (!isInsideAirport(x, z, 20)) return baseH;
  const dx = Math.max(0, Math.abs(x - AIRPORT_CENTER.x) - AIRPORT_HALF_X);
  const dz = Math.max(0, Math.abs(z - AIRPORT_CENTER.z) - AIRPORT_HALF_Z);
  const dist = Math.hypot(dx, dz);
  const blend = 1 - smoothstep(0, 18, dist);
  return baseH * (1 - blend) + AIRPORT_GROUND_Y * blend;
}

export function getAirportFloorHeight(x: number, z: number): number | null {
  // Walkable Terminal 1 Departure Hall Concourse + Front Canopy Apron
  if (x >= 162 && x <= 208 && z >= -169 && z <= -146) {
    return AIRPORT_GROUND_Y + 0.2;
  }
  return null;
}

export function getAirportColliders(): AabbCollider[] {
  return [
    // Terminal rear wall (north edge)
    { id: 'airport_term_back', minX: 162, maxX: 208, minZ: -170.5, maxZ: -168.5 },
    // Terminal west & east side walls
    { id: 'airport_term_west', minX: 161.5, maxX: 163.5, minZ: -170, maxZ: -151 },
    { id: 'airport_term_east', minX: 206.5, maxX: 208.5, minZ: -170, maxZ: -151 },
    // Front glass walls flanking wide open central departure doorway (x: 179..191 stays open!)
    { id: 'airport_term_front_w', minX: 162, maxX: 179, minZ: -151.8, maxZ: -150.2 },
    { id: 'airport_term_front_e', minX: 191, maxX: 208, minZ: -151.8, maxZ: -150.2 },
    // Air Traffic Control Tower base shaft
    {
      id: 'airport_atc_base',
      minX: AIRPORT_ATC_TOWER_POS.x - 4.2,
      maxX: AIRPORT_ATC_TOWER_POS.x + 4.2,
      minZ: AIRPORT_ATC_TOWER_POS.z - 4.2,
      maxZ: AIRPORT_ATC_TOWER_POS.z + 4.2,
    },
  ];
}

// ─── FLYABLE COMMERCIAL JET AIRLINER (DL-787 DREAMLINER) ──────────────────────

export const AIRLINER_MAX_SPEED = 68.0; // m/s (~245 km/h)
export const AIRLINER_TAKEOFF_SPEED = 20.0; // m/s (~72 km/h)
export const AIRLINER_MIN_ALTITUDE_OFFSET = 0.0;
export const AIRLINER_MAX_ALTITUDE = 148.0;

export interface AirlinerState {
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
  speedKmh: number;
  altitudeM: number;
  throttle: number;
  afterburner: boolean;
  landingGearDown: boolean;
  onGround: boolean;
  wheelSpin: number;
}

export function createInitialAirlinerState(): AirlinerState {
  return {
    x: AIRPORT_JET_PARK_POS.x,
    y: AIRPORT_GROUND_Y,
    z: AIRPORT_JET_PARK_POS.z,
    heading: AIRPORT_JET_PARK_POS.heading,
    pitch: 0,
    roll: 0,
    speed: 0,
    speedKmh: 0,
    altitudeM: 0,
    throttle: 0,
    afterburner: false,
    landingGearDown: true,
    onGround: true,
    wheelSpin: 0,
  };
}

export function stepAirlinerState(
  prev: AirlinerState,
  forwardInput: number,
  steerInput: number,
  ascend: boolean,
  descend: boolean,
  afterburner: boolean,
  dt: number,
  groundYFn: (x: number, z: number) => number,
  worldRadius = 425
): AirlinerState {
  const safeDt = Math.min(0.08, Math.max(0.001, dt));
  const boostActive = afterburner && forwardInput > 0.1;
  const maxSpd = boostActive ? AIRLINER_MAX_SPEED : 48.0;
  const accel = boostActive ? 26.0 : 16.5;

  let speed = prev.speed;
  if (forwardInput > 0.05) {
    speed = Math.min(maxSpd, speed + accel * forwardInput * safeDt);
  } else if (forwardInput < -0.05) {
    const brakeRate = prev.onGround ? 24.0 : 12.0;
    const minSpd = prev.onGround ? -6.0 : 14.0;
    speed = Math.max(minSpd, speed + brakeRate * forwardInput * safeDt);
  } else {
    // Gentle aerodynamic drag / cruise hold when airborne
    if (prev.onGround) {
      speed *= Math.max(0, 1 - 1.3 * safeDt);
      if (Math.abs(speed) < 0.15) speed = 0;
    } else {
      const targetCruise = 28.0;
      speed += (targetCruise - speed) * Math.min(1, safeDt * 0.45);
    }
  }

  // Turning: sharper nose-wheel steering on tarmac, banked sweeping turns in sky
  const turnRate = prev.onGround ? 1.15 : 0.95;
  const speedSteerFactor = prev.onGround ? Math.min(1, Math.abs(speed) / 4.0) : 1.0;
  let heading = prev.heading - steerInput * turnRate * speedSteerFactor * safeDt;

  // Vertical flight control
  const groundY = Math.max(-0.2, groundYFn(prev.x, prev.z));
  let y = prev.y;
  let targetPitch = 0;

  const canLiftoff = speed >= AIRLINER_TAKEOFF_SPEED || !prev.onGround;
  if (ascend && canLiftoff) {
    const climbRate = boostActive ? 22.0 : 15.0;
    y = Math.min(AIRLINER_MAX_ALTITUDE, y + climbRate * safeDt);
    targetPitch = 0.24;
  } else if (descend) {
    const descendRate = 16.0;
    y = Math.max(groundY, y - descendRate * safeDt);
    targetPitch = y > groundY + 0.5 ? -0.2 : 0;
  } else if (!prev.onGround && speed < 15.0) {
    // Gentle sink when below stall speed
    y = Math.max(groundY, y - 5.5 * safeDt);
    targetPitch = -0.08;
  }

  // Forward displacement
  let x = prev.x + Math.sin(heading) * speed * safeDt;
  let z = prev.z + Math.cos(heading) * speed * safeDt;

  // Soft circular airspace turn-back near world boundary
  const distFromOrigin = Math.hypot(x, z);
  if (distFromOrigin > worldRadius) {
    const scale = worldRadius / distFromOrigin;
    x *= scale;
    z *= scale;
    heading = Math.atan2(-x, -z);
  }

  const nextGroundY = Math.max(-0.2, groundYFn(x, z));
  if (y < nextGroundY) y = nextGroundY;
  const agl = Math.max(0, y - nextGroundY);
  const onGround = agl <= 0.35;
  const landingGearDown = agl < 11.0;

  const targetRoll = onGround ? 0 : -steerInput * 0.42;
  const roll = prev.roll + (targetRoll - prev.roll) * Math.min(1, safeDt * 6.0);
  const pitch = prev.pitch + (targetPitch - prev.pitch) * Math.min(1, safeDt * 5.5);

  return {
    x,
    y,
    z,
    heading,
    pitch,
    roll,
    speed,
    speedKmh: Math.round(Math.abs(speed) * 3.6),
    altitudeM: Math.round(agl),
    throttle: Math.min(1, Math.max(0, Math.abs(speed) / AIRLINER_MAX_SPEED)),
    afterburner: boostActive,
    landingGearDown,
    onGround,
    wheelSpin: prev.wheelSpin + (onGround ? speed * safeDt * 1.4 : 0),
  };
}

export function getAirlinerExitPosition(
  state: AirlinerState,
  groundYFn: (x: number, z: number) => number
): { x: number; y: number; z: number } {
  const sideAngle = state.heading - Math.PI * 0.5;
  const x = state.x + Math.sin(sideAngle) * 7.5;
  const z = state.z + Math.cos(sideAngle) * 7.5;
  return { x, y: groundYFn(x, z), z };
}

// ─── UNDERGROUND METRO STATION & SUBWAY NETWORK ───────────────────────────────

export type MetroStationId = 'metro_central' | 'metro_airport';

export interface MetroSurfaceEntrance {
  id: MetroStationId;
  lineCode: string;
  name: string;
  tamilName: string;
  districtLabel: string;
  surfaceX: number;
  surfaceZ: number;
  exitFacingAngle: number;
  accentHex: number;
}

export const METRO_FLOOR_Y = -18.0;
export const METRO_MEZZANINE_Y = -13.2;

export const METRO_SURFACE_ENTRANCES: readonly MetroSurfaceEntrance[] = [
  {
    id: 'metro_central',
    lineCode: 'M1',
    name: 'Central Underground Metro',
    tamilName: 'மத்திய சுரங்க மெட்ரோ',
    districtLabel: 'Sakuragawa Central Station',
    surfaceX: 14,
    surfaceZ: 16,
    exitFacingAngle: Math.PI,
    accentHex: 0x38bdf8,
  },
  {
    id: 'metro_airport',
    lineCode: 'M1',
    name: 'Airport Terminal 1 Metro',
    tamilName: 'விமான நிலைய மெட்ரோ',
    districtLabel: 'Dreamline International Airport',
    surfaceX: 172,
    surfaceZ: -140,
    exitFacingAngle: 0,
    accentHex: 0x10b981,
  },
] as const;

export function getMetroStationById(id: MetroStationId | string | null | undefined): MetroSurfaceEntrance {
  return METRO_SURFACE_ENTRANCES.find((s) => s.id === id) ?? METRO_SURFACE_ENTRANCES[0];
}

/**
 * Walkable multi-level floor height inside the 3D Underground Metro Station:
 * - Track trench sits at z in [-12.5, -6.5] (y = -19.2, fenced off from players)
 * - Main Platform Deck: x in [-26, 26], z in [-6.2, 4.2] -> y = -18.0
 * - Wide Escalator & Staircase Ramp: x in [-6.5, 6.5], z in [4.2, 11.4] -> slopes -18.0 up to -13.2
 * - Upper Mezzanine Ticket Concourse: x in [-18, 18], z in [11.4, 17.5] -> y = -13.2
 */
export function getUndergroundMetroFloorY(x: number, z: number): number {
  if (z >= 11.4) {
    return METRO_MEZZANINE_Y;
  }
  if (z > 4.2 && z < 11.4 && Math.abs(x) <= 7.0) {
    const t = (z - 4.2) / (11.4 - 4.2);
    return METRO_FLOOR_Y + t * (METRO_MEZZANINE_Y - METRO_FLOOR_Y);
  }
  return METRO_FLOOR_Y;
}

export function isInsideUndergroundMetroWalkable(x: number, z: number): boolean {
  // Lower platform deck
  if (x >= -25.2 && x <= 25.2 && z >= -5.6 && z <= 4.35) return true;
  // Wide central stairs & escalators connecting platform <-> upper mezzanine
  if (x >= -6.2 && x <= 6.2 && z >= 4.0 && z <= 11.6) return true;
  // Upper mezzanine ticket concourse & exit lobby
  if (x >= -17.2 && x <= 17.2 && z >= 11.2 && z <= 17.0) return true;
  return false;
}

export function clampUndergroundMetroPosition(
  nextX: number,
  nextZ: number,
  prevX: number,
  prevZ: number
): { x: number; z: number; collided: boolean } {
  if (isInsideUndergroundMetroWalkable(nextX, nextZ)) {
    return { x: nextX, z: nextZ, collided: false };
  }
  if (isInsideUndergroundMetroWalkable(nextX, prevZ)) {
    return { x: nextX, z: prevZ, collided: true };
  }
  if (isInsideUndergroundMetroWalkable(prevX, nextZ)) {
    return { x: prevX, z: nextZ, collided: true };
  }
  return { x: prevX, z: prevZ, collided: true };
}

export const METRO_EXIT_STAIRS_POS = { x: 0, y: METRO_MEZZANINE_Y, z: 16.0 } as const;
export const METRO_PLATFORM_BOARD_POS = { x: 0, y: METRO_FLOOR_Y, z: -4.2 } as const;

// ─── LIVE ANIMATED UNDERGROUND SUBWAY TRAIN ──────────────────────────────────

export type SubwayTrainPhase = 'approaching' | 'stopped' | 'departing' | 'tunnel_transit';

export interface SubwayTrainState {
  trainX: number; // -96..+96 along underground track (0 = centered at platform)
  speed: number; // m/s
  phase: SubwayTrainPhase;
  doorOpen: number; // 0..1
  dwellTimer: number;
  etaSeconds: number;
  statusLabel: string;
}

export function createInitialSubwayTrainState(): SubwayTrainState {
  return {
    trainX: -12,
    speed: 10,
    phase: 'approaching',
    doorOpen: 0,
    dwellTimer: 0,
    etaSeconds: 2,
    statusLabel: 'Arriving at Platform',
  };
}

export function stepSubwayTrainState(prev: SubwayTrainState, dt: number): SubwayTrainState {
  const safeDt = Math.min(0.08, Math.max(0.001, dt));
  let { trainX, speed, phase, doorOpen, dwellTimer } = prev;

  if (phase === 'approaching') {
    const dist = Math.max(0, -trainX);
    const targetSpeed = Math.max(2.2, Math.min(26, dist * 0.65));
    speed += (targetSpeed - speed) * Math.min(1, safeDt * 4.5);
    trainX += speed * safeDt;
    doorOpen = Math.max(0, doorOpen - safeDt * 2.5);
    if (trainX >= -0.25) {
      trainX = 0;
      speed = 0;
      phase = 'stopped';
      dwellTimer = 9.5;
    }
  } else if (phase === 'stopped') {
    speed = 0;
    trainX = 0;
    dwellTimer -= safeDt;
    if (dwellTimer > 1.4) {
      doorOpen = Math.min(1, doorOpen + safeDt * 1.9);
    } else {
      doorOpen = Math.max(0, doorOpen - safeDt * 1.9);
    }
    if (dwellTimer <= 0) {
      doorOpen = 0;
      phase = 'departing';
    }
  } else if (phase === 'departing') {
    speed = Math.min(34, speed + 12.5 * safeDt);
    trainX += speed * safeDt;
    doorOpen = 0;
    if (trainX >= 96) {
      trainX = -96;
      phase = 'tunnel_transit';
      dwellTimer = 3.0;
      speed = 0;
    }
  } else {
    dwellTimer -= safeDt;
    trainX = -96;
    speed = 0;
    doorOpen = 0;
    if (dwellTimer <= 0) {
      phase = 'approaching';
      speed = 24;
    }
  }

  let etaSeconds = 0;
  let statusLabel = 'Boarding Now · Doors Open';
  if (phase === 'approaching') {
    etaSeconds = Math.max(1, Math.ceil(Math.abs(trainX) / Math.max(4, speed)));
    statusLabel = `Approaching · ${etaSeconds}s`;
  } else if (phase === 'stopped') {
    etaSeconds = 0;
    statusLabel = doorOpen > 0.4 ? 'Boarding Now · Doors Open' : 'Doors Closing';
  } else if (phase === 'departing') {
    etaSeconds = 11;
    statusLabel = 'Departing into Tunnel';
  } else {
    etaSeconds = Math.max(3, Math.ceil(dwellTimer + 5));
    statusLabel = `Next Metro in ${etaSeconds}s`;
  }

  return {
    trainX,
    speed,
    phase,
    doorOpen,
    dwellTimer,
    etaSeconds,
    statusLabel,
  };
}

// ─── ANIMATED HERO COMMAND HQ AT SUPERHEROES' INTERSECTION ───────────────────

export const HERO_HQ_INTERSECTION_POS = {
  x: 48,
  z: -206,
  doorX: 48,
  doorZ: -199.5,
} as const;

export function getHeroHqCollider(): AabbCollider {
  return {
    id: 'hero_hq_intersection_tower',
    minX: HERO_HQ_INTERSECTION_POS.x - 5.2,
    maxX: HERO_HQ_INTERSECTION_POS.x + 5.2,
    minZ: HERO_HQ_INTERSECTION_POS.z - 5.2,
    maxZ: HERO_HQ_INTERSECTION_POS.z + 5.2,
  };
}

// ─── PARACHUTE JUMP TEST TOWER (OUTSIDE METRO CITY) & DEPLOYABLE PARACHUTE ───

export const PARACHUTE_TOWER_POS = {
  x: 164,
  z: -126,
  deckY: 22.65, // 22m above airport plateau for instant parachute testing outside Metro City!
} as const;

export interface ParachuteState {
  active: boolean;
  deployProgress: number; // 0..1 canopy inflation
  glideSpeed: number;
  descentRate: number;
  swayPhase: number;
}

export function createInitialParachuteState(): ParachuteState {
  return {
    active: false,
    deployProgress: 0,
    glideSpeed: 12.5,
    descentRate: 3.4,
    swayPhase: 0,
  };
}

export function stepParachuteGlide(
  prev: ParachuteState,
  px: number,
  py: number,
  pz: number,
  forwardInput: number,
  rightInput: number,
  camYaw: number,
  groundY: number,
  dt: number
): {
  x: number;
  y: number;
  z: number;
  heading: number | null;
  landed: boolean;
  state: ParachuteState;
} {
  const safeDt = Math.min(0.06, Math.max(0.001, dt));
  const deployProgress = Math.min(1, prev.deployProgress + safeDt * 3.8);
  const fwdX = -Math.sin(camYaw);
  const fwdZ = -Math.cos(camYaw);
  const rightX = Math.cos(camYaw);
  const rightZ = -Math.sin(camYaw);

  // Forward glide with steering & gentle braking
  const baseGlide = 7.5 + Math.max(-0.5, forwardInput) * 6.5;
  const vx = fwdX * baseGlide + rightX * rightInput * 8.5;
  const vz = fwdZ * baseGlide + rightZ * rightInput * 8.5;

  const sink = prev.descentRate * (1.25 - deployProgress * 0.25);
  let ny = py - sink * safeDt;
  const nx = px + vx * safeDt;
  const nz = pz + vz * safeDt;

  let landed = false;
  if (ny <= groundY + 0.05) {
    ny = groundY;
    landed = true;
  }

  const horizSpd = Math.hypot(vx, vz);
  const heading = horizSpd > 0.25 ? Math.atan2(vx, vz) : null;

  return {
    x: nx,
    y: ny,
    z: nz,
    heading,
    landed,
    state: {
      ...prev,
      active: !landed,
      deployProgress: landed ? 0 : deployProgress,
      swayPhase: prev.swayPhase + safeDt * 2.4,
    },
  };
}

