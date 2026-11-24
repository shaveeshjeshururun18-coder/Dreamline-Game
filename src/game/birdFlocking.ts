import { groundHeightAt, WATER_LEVEL } from './terrain';
import { getWeatherProfile } from './extremeWeather';
import type { SeasonType, WeatherType } from './types';

export type FlockSpecies =
  | 'countryside_swallow'
  | 'meadow_swift'
  | 'autumn_migrator'
  | 'winter_starling';

export interface FlockingBird {
  id: number;
  flockId: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number;
  pitch: number;
  roll: number;
  wingAngle: number;
  wingPhase: number;
  flapSpeed: number;
  glideOffset: number;
  scale: number;
  bodyColorHex: number;
  wingColorHex: number;
  opacityScale: number;
}

export interface BirdFlock {
  id: number;
  species: FlockSpecies;
  anchorX: number;
  anchorY: number;
  anchorZ: number;
  dirX: number;
  dirZ: number;
  cruiseSpeed: number;
  curveRate: number;
  age: number;
  maxLife: number;
  baseAltitude: number;
  birds: FlockingBird[];
}

export interface BirdFlockingState {
  flocks: BirdFlock[];
  nextFlockId: number;
  nextBirdId: number;
  spawnCooldown: number;
  totalSpawnedFlocks: number;
  rngState: number;
}

export interface FlockingStats {
  activeFlocks: number;
  activeBirds: number;
  totalSpawnedFlocks: number;
}

export const MAX_ACTIVE_FLOCKS = 3;
export const MAX_FLOCK_BIRDS = 36;
export const FLOCK_MIN_BIRDS = 7;
export const FLOCK_MAX_BIRDS = 12;

export const SEPARATION_RADIUS = 2.9;
export const NEIGHBOR_RADIUS = 11.5;
export const MIN_BIRD_SPEED = 6.2;
export const MAX_BIRD_SPEED = 11.8;

const FLOCK_SPAWN_MIN_INTERVAL = 8.5;
const FLOCK_SPAWN_MAX_INTERVAL = 15.0;
const FADE_IN_SECONDS = 2.2;
const FADE_OUT_SECONDS = 3.4;

interface FlockPaletteSpec {
  species: FlockSpecies;
  bodyHexes: readonly number[];
  wingHexes: readonly number[];
  scaleMin: number;
  scaleMax: number;
  flapMin: number;
  flapMax: number;
}

const SEASON_FLOCK_SPECS: Record<SeasonType, FlockPaletteSpec> = {
  spring: {
    species: 'countryside_swallow',
    bodyHexes: [0x222c47, 0x2c3857, 0x384566],
    wingHexes: [0x171f36, 0x212c45, 0x2b3654],
    scaleMin: 1.18,
    scaleMax: 1.52,
    flapMin: 7.4,
    flapMax: 9.2,
  },
  summer: {
    species: 'meadow_swift',
    bodyHexes: [0x3d352d, 0x574634, 0x2d3c4a],
    wingHexes: [0x26211c, 0x3b3024, 0x1e2933],
    scaleMin: 1.15,
    scaleMax: 1.48,
    flapMin: 7.8,
    flapMax: 9.6,
  },
  autumn: {
    species: 'autumn_migrator',
    bodyHexes: [0x4a3126, 0x63422e, 0x3b2e28],
    wingHexes: [0x2e1e18, 0x452d1f, 0x241c19],
    scaleMin: 1.24,
    scaleMax: 1.58,
    flapMin: 6.4,
    flapMax: 8.0,
  },
  winter: {
    species: 'winter_starling',
    bodyHexes: [0x2d3d54, 0x3d516b, 0xd8e4f2],
    wingHexes: [0x1e2a3b, 0x2d3d52, 0xa8bdd6],
    scaleMin: 1.16,
    scaleMax: 1.48,
    flapMin: 7.2,
    flapMax: 8.8,
  },
};

function nextRand(state: BirdFlockingState): number {
  let a = (state.rngState + 0x6d2b79f5) | 0;
  state.rngState = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Returns 0..1 atmospheric flocking activity for time-of-day and weather.
 * Distant countryside flocks glide peacefully from dawn through dusk in calm weather
 * and shelter during severe storms or deep night.
 */
export function computeFlockSkyActivity(timeHours: number, weather: WeatherType): number {
  const profile = getWeatherProfile(weather);
  if (profile.isExtremeStorm || weather === 'rain' || weather === 'heavy_rain') {
    return 0;
  }
  const h = ((timeHours % 24) + 24) % 24;
  if (h < 5.0 || h > 20.8) return 0;
  if (h < 5.8) return (h - 5.0) / 0.8;
  if (h > 19.8) return Math.max(0, (20.8 - h) / 1.0);
  if (weather === 'fog') return 0.55;
  if (weather === 'snow') return 0.65;
  return 1.0;
}

export function countActiveFlockBirds(state: BirdFlockingState): number {
  let total = 0;
  for (let i = 0; i < state.flocks.length; i++) {
    total += state.flocks[i].birds.length;
  }
  return total;
}

export function getFlockingStats(state: BirdFlockingState): FlockingStats {
  return {
    activeFlocks: state.flocks.length,
    activeBirds: countActiveFlockBirds(state),
    totalSpawnedFlocks: state.totalSpawnedFlocks,
  };
}

/**
 * Spawns a cohesive distant flock sweeping across the countryside horizon around (focusX, focusZ).
 */
export function spawnDistantFlock(
  state: BirdFlockingState,
  focusX: number,
  focusZ: number,
  season: SeasonType,
  options?: { initialScenicPass?: boolean }
): BirdFlock | null {
  if (state.flocks.length >= MAX_ACTIVE_FLOCKS) return null;
  const remainingSlots = MAX_FLOCK_BIRDS - countActiveFlockBirds(state);
  if (remainingSlots < FLOCK_MIN_BIRDS) return null;

  const spec = SEASON_FLOCK_SPECS[season] ?? SEASON_FLOCK_SPECS.spring;
  const desiredCount = Math.min(
    remainingSlots,
    FLOCK_MIN_BIRDS + Math.floor(nextRand(state) * (FLOCK_MAX_BIRDS - FLOCK_MIN_BIRDS + 1))
  );

  // Pick a scenic distant crossing chord across the countryside horizon
  let spawnX: number;
  let spawnZ: number;
  let dirX: number;
  let dirZ: number;
  let baseAltitude: number;

  if (options?.initialScenicPass) {
    // Immediate welcoming distant flock crossing the sunlit horizon ahead of the valley vista
    spawnX = focusX - 24;
    spawnZ = focusZ - 42;
    const heading = 1.28; // sweeping gracefully left-to-right across the distant sky
    dirX = Math.sin(heading);
    dirZ = Math.cos(heading);
    baseAltitude = 17.5;
  } else {
    // Spawn on a distant 46m..88m ring around the player and fly along a sweeping chord
    // passing 26m..58m away so flocks read clearly against the horizon without buzzing the camera.
    const spawnAngle = nextRand(state) * Math.PI * 2;
    const spawnDist = 46 + nextRand(state) * 42;
    spawnX = focusX + Math.cos(spawnAngle) * spawnDist;
    spawnZ = focusZ + Math.sin(spawnAngle) * spawnDist;

    const toFocusX = focusX - spawnX;
    const toFocusZ = focusZ - spawnZ;
    const toFocusAng = Math.atan2(toFocusX, toFocusZ);
    const tangentSign = nextRand(state) > 0.5 ? 1 : -1;
    // Offset heading by 24°–46° from direct center so the flock crosses the distant skyline gracefully
    const chordOffset = tangentSign * (0.42 + nextRand(state) * 0.38);
    const flyAngle = toFocusAng + chordOffset;
    dirX = Math.sin(flyAngle);
    dirZ = Math.cos(flyAngle);
    baseAltitude = 15.5 + nextRand(state) * 11.0;
  }

  const cruiseSpeed = 7.6 + nextRand(state) * 2.6;
  const curveRate = (nextRand(state) - 0.5) * 0.075; // gentle broad arc across the valley sky
  const maxLife = 24.0 + nextRand(state) * 12.0;

  const groundY = Math.max(WATER_LEVEL, groundHeightAt(spawnX, spawnZ));
  const anchorY = Math.max(groundY + 11.5, baseAltitude);
  const flockId = state.nextFlockId++;

  const rightX = dirZ;
  const rightZ = -dirX;
  const birds: FlockingBird[] = [];

  for (let i = 0; i < desiredCount; i++) {
    // Soft V / staggered formation seed so boids begin in a believable airborne cluster
    const rank = Math.floor((i + 1) / 2);
    const side = i % 2 === 0 ? 1 : -1;
    const lateral = (i === 0 ? 0 : side * (1.8 + rank * 1.45)) + (nextRand(state) - 0.5) * 1.6;
    const back = -(rank * 1.65) + (nextRand(state) - 0.5) * 1.8;
    const vert = (nextRand(state) - 0.5) * 2.4;

    const bx = spawnX + rightX * lateral + dirX * back;
    const bz = spawnZ + rightZ * lateral + dirZ * back;
    const birdGroundY = Math.max(WATER_LEVEL, groundHeightAt(bx, bz));
    const by = Math.max(birdGroundY + 9.5, anchorY + vert);

    const speedJitter = cruiseSpeed * (0.94 + nextRand(state) * 0.12);
    const vx = dirX * speedJitter + (nextRand(state) - 0.5) * 0.7;
    const vz = dirZ * speedJitter + (nextRand(state) - 0.5) * 0.7;
    const vy = (nextRand(state) - 0.5) * 0.35;

    const palIdx = i % spec.bodyHexes.length;
    birds.push({
      id: state.nextBirdId++,
      flockId,
      x: bx,
      y: by,
      z: bz,
      vx,
      vy,
      vz,
      heading: Math.atan2(vx, vz),
      pitch: 0,
      roll: 0,
      wingAngle: 0.14,
      wingPhase: nextRand(state) * Math.PI * 2,
      flapSpeed: spec.flapMin + nextRand(state) * (spec.flapMax - spec.flapMin),
      glideOffset: nextRand(state) * Math.PI * 2,
      scale: spec.scaleMin + nextRand(state) * (spec.scaleMax - spec.scaleMin),
      bodyColorHex: spec.bodyHexes[palIdx],
      wingColorHex: spec.wingHexes[palIdx],
      opacityScale: options?.initialScenicPass ? 1.0 : 0.05,
    });
  }

  const flock: BirdFlock = {
    id: flockId,
    species: spec.species,
    anchorX: spawnX,
    anchorY,
    anchorZ: spawnZ,
    dirX,
    dirZ,
    cruiseSpeed,
    curveRate,
    age: options?.initialScenicPass ? FADE_IN_SECONDS : 0,
    maxLife,
    baseAltitude,
    birds,
  };

  state.flocks.push(flock);
  state.totalSpawnedFlocks++;
  return flock;
}

/**
 * Initializes the periodic distant flocking system with one welcoming flock already gliding across
 * the countryside sky and a scheduled timer for subsequent flocks.
 */
export function createInitialBirdFlockingState(
  focusX = 0,
  focusZ = 14,
  season: SeasonType = 'spring'
): BirdFlockingState {
  const state: BirdFlockingState = {
    flocks: [],
    nextFlockId: 1,
    nextBirdId: 1,
    spawnCooldown: 5.5,
    totalSpawnedFlocks: 0,
    rngState: 9172453,
  };
  spawnDistantFlock(state, focusX, focusZ, season, { initialScenicPass: true });
  return state;
}

/**
 * Keeps the distant sky alive when the player fast-travels across the 600m open world:
 * prunes far out-of-sight flocks and seeds a fresh horizon pass over the new destination.
 */
export function refreshFlocksForFocus(
  state: BirdFlockingState,
  focusX: number,
  focusZ: number,
  timeHours: number,
  weather: WeatherType,
  season: SeasonType
): void {
  for (let f = state.flocks.length - 1; f >= 0; f--) {
    const fl = state.flocks[f];
    if (Math.hypot(fl.anchorX - focusX, fl.anchorZ - focusZ) > 145) {
      state.flocks.splice(f, 1);
    }
  }
  if (computeFlockSkyActivity(timeHours, weather) <= 0.05) return;
  const hasNearbyFlock = state.flocks.some(
    (fl) => Math.hypot(fl.anchorX - focusX, fl.anchorZ - focusZ) <= 105
  );
  if (!hasNearbyFlock) {
    spawnDistantFlock(state, focusX, focusZ, season, { initialScenicPass: true });
    state.spawnCooldown = 6.5;
  }
}

/**
 * Advances all active bird flocks in-place using lightweight 3D Boids rules
 * (separation + alignment + cohesion + curved distant-sky migration anchor + terrain clearance)
 * and periodically spawns/recycles flocks over the countryside.
 */
export function stepBirdFlockingSystem(
  state: BirdFlockingState,
  dt: number,
  elapsed: number,
  timeHours: number,
  weather: WeatherType,
  season: SeasonType,
  playerX: number,
  playerZ: number
): number {
  const safeDt = Math.min(Math.max(dt, 0.001), 0.1);
  const skyActivity = computeFlockSkyActivity(timeHours, weather);

  // Periodic spawning when weather & daylight permit
  if (skyActivity > 0.05) {
    state.spawnCooldown -= safeDt;
    if (state.spawnCooldown <= 0) {
      if (state.flocks.length < MAX_ACTIVE_FLOCKS) {
        spawnDistantFlock(state, playerX, playerZ, season);
      }
      state.spawnCooldown =
        FLOCK_SPAWN_MIN_INTERVAL +
        nextRand(state) * (FLOCK_SPAWN_MAX_INTERVAL - FLOCK_SPAWN_MIN_INTERVAL);
    }
  } else {
    state.spawnCooldown = Math.max(state.spawnCooldown, 3.0);
  }

  const sepRadSq = SEPARATION_RADIUS * SEPARATION_RADIUS;
  const neighRadSq = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;

  for (let f = state.flocks.length - 1; f >= 0; f--) {
    const flock = state.flocks[f];
    flock.age += safeDt;

    // If weather turns stormy or deep night falls, accelerate graceful horizon exit
    const effectiveMaxLife =
      skyActivity <= 0.02 ? Math.min(flock.maxLife, flock.age + FADE_OUT_SECONDS) : flock.maxLife;
    flock.maxLife = effectiveMaxLife;

    // Gentle curved migration path across the countryside sky
    const turnAngle = flock.curveRate * safeDt;
    if (Math.abs(turnAngle) > 1e-6) {
      const c = Math.cos(turnAngle);
      const s = Math.sin(turnAngle);
      const nx = flock.dirX * c - flock.dirZ * s;
      const nz = flock.dirX * s + flock.dirZ * c;
      const len = Math.max(1e-6, Math.hypot(nx, nz));
      flock.dirX = nx / len;
      flock.dirZ = nz / len;
    }

    flock.anchorX += flock.dirX * flock.cruiseSpeed * safeDt;
    flock.anchorZ += flock.dirZ * flock.cruiseSpeed * safeDt;
    const anchorGroundY = Math.max(WATER_LEVEL, groundHeightAt(flock.anchorX, flock.anchorZ));
    const thermalUndulation = Math.sin(elapsed * 0.35 + flock.id * 1.7) * 2.1;
    const targetAnchorY = Math.max(anchorGroundY + 12.0, flock.baseAltitude + thermalUndulation);
    flock.anchorY += (targetAnchorY - flock.anchorY) * Math.min(1, safeDt * 1.4);

    // Fade-in / fade-out envelope for seamless horizon arrivals and departures
    const fadeIn = Math.min(1, flock.age / FADE_IN_SECONDS);
    const timeLeft = Math.max(0, flock.maxLife - flock.age);
    const fadeOut = Math.min(1, timeLeft / FADE_OUT_SECONDS);
    const flockEnvelope = Math.max(0, Math.min(fadeIn, fadeOut)) * Math.max(0.15, skyActivity);

    const birds = flock.birds;
    const count = birds.length;

    for (let i = 0; i < count; i++) {
      const b = birds[i];

      let sepX = 0;
      let sepY = 0;
      let sepZ = 0;
      let sepCount = 0;

      let alignX = 0;
      let alignY = 0;
      let alignZ = 0;
      let cohX = 0;
      let cohY = 0;
      let cohZ = 0;
      let neighCount = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const other = birds[j];
        const dx = b.x - other.x;
        const dy = b.y - other.y;
        const dz = b.z - other.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > 1e-6 && distSq < neighRadSq) {
          alignX += other.vx;
          alignY += other.vy;
          alignZ += other.vz;
          cohX += other.x;
          cohY += other.y;
          cohZ += other.z;
          neighCount++;

          if (distSq < sepRadSq) {
            const invDist = 1 / Math.sqrt(distSq);
            const push = (SEPARATION_RADIUS - 1 / invDist) * invDist;
            sepX += dx * push;
            sepY += dy * push * 0.7;
            sepZ += dz * push;
            sepCount++;
          }
        }
      }

      let steerX = 0;
      let steerY = 0;
      let steerZ = 0;

      // 1. Separation (avoid collisions with nearby flockmates)
      if (sepCount > 0) {
        steerX += (sepX / sepCount) * 4.8;
        steerY += (sepY / sepCount) * 3.6;
        steerZ += (sepZ / sepCount) * 4.8;
      }

      // 2. Alignment & 3. Cohesion (move together as a fluid ribbon)
      if (neighCount > 0) {
        const invN = 1 / neighCount;
        steerX += (alignX * invN - b.vx) * 1.15;
        steerY += (alignY * invN - b.vy) * 1.0;
        steerZ += (alignZ * invN - b.vz) * 1.15;

        const cx = cohX * invN - b.x;
        const cy = cohY * invN - b.y;
        const cz = cohZ * invN - b.z;
        steerX += cx * 0.42;
        steerY += cy * 0.36;
        steerZ += cz * 0.42;
      }

      // 4. Migration Goal Anchor (pulls flock gracefully across the countryside skyline)
      const toAnchorX = flock.anchorX - b.x;
      const toAnchorY = flock.anchorY - b.y;
      const toAnchorZ = flock.anchorZ - b.z;
      steerX += toAnchorX * 0.34 + (flock.dirX * flock.cruiseSpeed - b.vx) * 0.65;
      steerY += toAnchorY * 0.55;
      steerZ += toAnchorZ * 0.34 + (flock.dirZ * flock.cruiseSpeed - b.vz) * 0.65;

      // Subtle organic breeze shimmer so every bird has lively micro-motion
      steerY += Math.sin(elapsed * 1.45 + b.glideOffset) * 0.45;

      const prevVx = b.vx;
      const prevVz = b.vz;

      b.vx += steerX * safeDt;
      b.vy += steerY * safeDt;
      b.vz += steerZ * safeDt;

      // Keep vertical climb rate gentle & graceful
      b.vy = Math.max(-2.6, Math.min(2.6, b.vy));

      // Clamp total flight speed to realistic bird cruise range
      const speed = Math.hypot(b.vx, b.vy, b.vz);
      if (speed > 1e-4) {
        const clampedSpeed = Math.max(MIN_BIRD_SPEED, Math.min(MAX_BIRD_SPEED, speed));
        const ratio = clampedSpeed / speed;
        b.vx *= ratio;
        b.vy *= ratio;
        b.vz *= ratio;
      }

      b.x += b.vx * safeDt;
      b.y += b.vy * safeDt;
      b.z += b.vz * safeDt;

      // Enforce safe countryside altitude clearance above terrain/peaks/water
      const minClearY = Math.max(WATER_LEVEL, groundHeightAt(b.x, b.z)) + 9.5;
      if (b.y < minClearY) {
        b.y = minClearY;
        if (b.vy < 0.6) b.vy = 0.6;
      }

      const horizSpeed = Math.max(0.1, Math.hypot(b.vx, b.vz));
      b.heading = Math.atan2(b.vx, b.vz);
      b.pitch = -Math.atan2(b.vy, horizSpeed) * 0.72;

      // Compute banking roll from lateral turning acceleration
      const turnCross = (prevVx * b.vz - prevVz * b.vx) / (horizSpeed * horizSpeed * safeDt);
      const targetRoll = Math.max(-0.52, Math.min(0.52, turnCross * 0.38));
      b.roll += (targetRoll - b.roll) * Math.min(1, safeDt * 5.0);

      // Intermittent flap-and-glide wing cycle (more active flapping while climbing)
      const glideWave = Math.sin(elapsed * 0.85 + b.glideOffset);
      const climbBoost = b.vy > 0.25 ? 0.35 : 0;
      const flapEnvelope = Math.min(
        1,
        Math.max(0, (glideWave + 0.18 + climbBoost) / 0.5)
      );
      const wingStroke = Math.sin(elapsed * b.flapSpeed + b.wingPhase);
      b.wingAngle = 0.14 * (1 - flapEnvelope) + wingStroke * 0.76 * flapEnvelope;
      b.opacityScale = flockEnvelope;
    }

    // Recycle completed or far-out-of-range flocks cleanly
    const distFromPlayer = Math.hypot(flock.anchorX - playerX, flock.anchorZ - playerZ);
    if (flock.age >= flock.maxLife || (flock.age > 8 && distFromPlayer > 220)) {
      state.flocks.splice(f, 1);
    }
  }

  return skyActivity;
}
