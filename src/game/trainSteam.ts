import type { RegionId, SeasonType, TrainPhase, WeatherType } from './types';

export const MIN_TEMPERATURE_C = -15;
export const MAX_TEMPERATURE_C = 38;

export interface TrainSteamProfile {
  /** Puffs emitted per second */
  emissionRate: number;
  /** Lifetime of each puff in seconds */
  puffLifetime: number;
  /** Initial puff diameter in world meters */
  startScale: number;
  /** Expanded puff diameter at end of life in world meters */
  endScale: number;
  /** Initial vertical exhaust velocity in m/s */
  riseSpeed: number;
  /** Peak opacity [0..1] of each puff */
  baseOpacity: number;
  /** Cold-air condensation multiplier (~0.35 in hot air -> ~2.0 in freezing air) */
  condensationFactor: number;
  /** Normalized overall plume intensity [0..1] */
  intensity01: number;
  /** Inner puff color hex */
  coreColorHex: number;
  /** Outer puff color hex */
  edgeColorHex: number;
  /** Ambient horizontal wind drift X (m/s) */
  windDriftX: number;
  /** Ambient horizontal wind drift Z (m/s) */
  windDriftZ: number;
}

export interface TrainSteamParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  maxAge: number;
  startSize: number;
  endSize: number;
  maxAlpha: number;
  rotation: number;
  rotSpeed: number;
  tintMix: number;
}

export interface TrainSteamPool {
  particles: TrainSteamParticle[];
  capacity: number;
  spawnCarry: number;
  cursor: number;
  activeCount: number;
  lastProfile: TrainSteamProfile;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hash01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Computes the effective ambient air temperature in °C from Season, Weather,
 * Time of Day, and Region — or honors the player's explicit manual setting.
 */
export function computeEffectiveTemperatureC(
  season: SeasonType,
  weather: WeatherType,
  timeHours: number,
  regionId: RegionId,
  manualTemperatureC: number | null
): number {
  if (manualTemperatureC !== null && Number.isFinite(manualTemperatureC)) {
    return Math.round(clamp(manualTemperatureC, MIN_TEMPERATURE_C, MAX_TEMPERATURE_C) * 10) / 10;
  }

  let base = 18;
  switch (season) {
    case 'spring':
      base = 18;
      break;
    case 'summer':
      base = 29;
      break;
    case 'autumn':
      base = 13.5;
      break;
    case 'winter':
      base = -2.5;
      break;
  }

  // Regional microclimate offset
  if (regionId === 'snow') base -= 13;
  else if (regionId === 'coastal') base -= 1.5;
  else if (regionId === 'lake_camp') base -= 1.0;
  else if (regionId === 'countryside') base += 0.5;

  // Diurnal temperature cycle: coolest ~04:30 (-4.5°C), warmest ~14:30 (+4.5°C)
  const diurnal = Math.sin(((timeHours - 8.5) / 24) * Math.PI * 2) * 4.5;
  base += diurnal;

  // Weather offset
  switch (weather) {
    case 'snow':
      base -= 7.5;
      break;
    case 'ferocious_rain':
      base -= 5.0;
      break;
    case 'thunderstorm':
    case 'heavy_rain':
      base -= 4.0;
      break;
    case 'rain':
      base -= 3.0;
      break;
    case 'fog':
      base -= 2.5;
      break;
    case 'flood':
    case 'tsunami':
      base -= 2.0;
      break;
    case 'cloudy':
      base -= 1.5;
      break;
    case 'breeze':
      base -= 1.0;
      break;
    case 'clear':
      base += 1.0;
      break;
  }

  return Math.round(clamp(base, MIN_TEMPERATURE_C, MAX_TEMPERATURE_C) * 10) / 10;
}

export function getTemperatureDescriptor(tempC: number): string {
  if (tempC <= -4) return 'Freezing';
  if (tempC <= 4) return 'Frosty';
  if (tempC <= 12) return 'Crisp';
  if (tempC <= 23) return 'Mild';
  if (tempC <= 30) return 'Warm';
  return 'Hot';
}

/**
 * Pure physics model scaling train steam/smoke emission rate, puff volume,
 * condensation density, lifetime, buoyancy, and tint based on train speed,
 * phase, ambient temperature (°C), and weather wind/humidity.
 */
export function computeTrainSteamProfile(
  speedKmh: number,
  phase: TrainPhase,
  temperatureC: number,
  weather: WeatherType
): TrainSteamProfile {
  const safeSpeed = Math.max(0, Number.isFinite(speedKmh) ? speedKmh : 0);
  const safeTemp = clamp(Number.isFinite(temperatureC) ? temperatureC : 18, MIN_TEMPERATURE_C, MAX_TEMPERATURE_C);

  const speed01 = clamp(safeSpeed / 60, 0, 1.35);
  // Cold air sharply increases visible steam condensation; hot air dissipates wisps rapidly
  const coldness = clamp((22 - safeTemp) / 32, 0, 1.15);
  const heatFactor = clamp((safeTemp - 22) / 16, 0, 1);

  let humidityBoost = 0;
  let windStrength = 0.55;
  switch (weather) {
    case 'snow':
      humidityBoost = 0.22;
      windStrength = 1.65;
      break;
    case 'fog':
      humidityBoost = 0.24;
      windStrength = 0.45;
      break;
    case 'rain':
      humidityBoost = 0.14;
      windStrength = 1.25;
      break;
    case 'heavy_rain':
      humidityBoost = 0.18;
      windStrength = 2.0;
      break;
    case 'thunderstorm':
      humidityBoost = 0.2;
      windStrength = 2.6;
      break;
    case 'ferocious_rain':
      humidityBoost = 0.22;
      windStrength = 3.2;
      break;
    case 'breeze':
      humidityBoost = 0.04;
      windStrength = 1.7;
      break;
    case 'cloudy':
      humidityBoost = 0.06;
      windStrength = 0.8;
      break;
    case 'flood':
    case 'tsunami':
      humidityBoost = 0.14;
      windStrength = 1.9;
      break;
    default:
      humidityBoost = 0;
      windStrength = 0.55;
      break;
  }

  const condensationFactor = clamp(
    0.48 + coldness * 1.42 - heatFactor * 0.24 + humidityBoost,
    0.34,
    2.25
  );

  // Departing from a station creates a classic pressurized steam chug burst
  const phaseMult = phase === 'departing' ? 1.45 : phase === 'approaching' ? 0.92 : 1.0;

  const emissionRate = clamp(
    (2.8 + speed01 * 14.2) * phaseMult * (0.64 + condensationFactor * 0.44),
    1.8,
    30
  );

  const puffLifetime = clamp(
    1.55 + coldness * 2.15 - heatFactor * 0.48 + speed01 * 0.42,
    0.95,
    4.2
  );

  const startScale = 0.42 + speed01 * 0.24 + coldness * 0.18;
  const endScale = (1.65 + speed01 * 1.85) * (0.72 + condensationFactor * 0.48);

  const riseSpeed =
    1.25 + speed01 * 1.45 + (phase === 'departing' ? 0.72 : 0) + coldness * 0.35;

  const baseOpacity = clamp(
    (0.38 + speed01 * 0.24 + (phase === 'departing' ? 0.08 : 0)) *
      (0.62 + condensationFactor * 0.42),
    0.22,
    0.86
  );

  const intensity01 = clamp(
    (speed01 * 0.55 + coldness * 0.45) * (phase === 'departing' ? 1.15 : 1.0),
    0.12,
    1.0
  );

  // Color shifts from crisp bright condensing steam in cold air to softer warm-grey smoke in heat
  let coreColorHex = 0xf2ece5;
  let edgeColorHex = 0xd2ccd0;
  if (safeTemp <= 6) {
    coreColorHex = 0xf8fbff;
    edgeColorHex = 0xdce9f7;
  } else if (safeTemp >= 28) {
    coreColorHex = 0xcfc8c2;
    edgeColorHex = 0x9b9694;
  }

  return {
    emissionRate,
    puffLifetime,
    startScale,
    endScale,
    riseSpeed,
    baseOpacity,
    condensationFactor,
    intensity01,
    coreColorHex,
    edgeColorHex,
    windDriftX: windStrength * 0.78,
    windDriftZ: -windStrength * 0.42,
  };
}

export function createTrainSteamPool(capacity = 72): TrainSteamPool {
  const particles: TrainSteamParticle[] = [];
  for (let i = 0; i < capacity; i++) {
    particles.push({
      active: false,
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      maxAge: 1,
      startSize: 0.4,
      endSize: 1.8,
      maxAlpha: 0.5,
      rotation: 0,
      rotSpeed: 0,
      tintMix: 0,
    });
  }
  return {
    particles,
    capacity,
    spawnCarry: 0,
    cursor: 0,
    activeCount: 0,
    lastProfile: computeTrainSteamProfile(0, 'stopped', 18, 'clear'),
  };
}

/**
 * Advances all world-space steam/smoke particles in-place with zero heap allocations.
 * Particles inherit a fraction of locomotive velocity on emission and then decelerate
 * via aerodynamic drag so plumes curve naturally behind the moving train.
 */
export function stepTrainSteamPool(
  pool: TrainSteamPool,
  dt: number,
  emitterX: number,
  emitterY: number,
  emitterZ: number,
  trainVx: number,
  trainVz: number,
  speedKmh: number,
  phase: TrainPhase,
  temperatureC: number,
  weather: WeatherType,
  elapsedSec: number
): TrainSteamProfile {
  const clampedDt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.12);
  const profile = computeTrainSteamProfile(speedKmh, phase, temperatureC, weather);
  pool.lastProfile = profile;

  const dragH = Math.exp(-1.85 * clampedDt);
  const dragV = Math.exp(-0.55 * clampedDt);
  let activeCount = 0;

  for (let i = 0; i < pool.capacity; i++) {
    const p = pool.particles[i];
    if (!p.active) continue;

    p.age += clampedDt;
    if (p.age >= p.maxAge) {
      p.active = false;
      continue;
    }

    // Gentle buoyant curl + horizontal aerodynamic drag toward ambient wind
    const swirl = Math.sin(elapsedSec * 1.8 + i * 1.73) * 0.28;
    p.vx = p.vx * dragH + profile.windDriftX * (1 - dragH);
    p.vz = p.vz * dragH + profile.windDriftZ * (1 - dragH);
    p.vy = p.vy * dragV + 0.42 * clampedDt;

    p.x += (p.vx + swirl) * clampedDt;
    p.y += p.vy * clampedDt;
    p.z += (p.vz - swirl * 0.6) * clampedDt;
    p.rotation += p.rotSpeed * clampedDt;
    activeCount++;
  }

  // Emit new puffs at the locomotive roof exhaust stack
  pool.spawnCarry = Math.min(pool.spawnCarry + profile.emissionRate * clampedDt, 4.0);
  let spawnedThisStep = 0;
  while (pool.spawnCarry >= 1.0 && spawnedThisStep < 4) {
    pool.spawnCarry -= 1.0;
    spawnedThisStep++;

    const idx = pool.cursor;
    pool.cursor = (pool.cursor + 1) % pool.capacity;
    const p = pool.particles[idx];
    const wasActive = p.active;

    const r1 = hash01(elapsedSec * 19.3 + idx * 3.1 + spawnedThisStep);
    const r2 = hash01(elapsedSec * 27.7 + idx * 5.7 + spawnedThisStep * 2.3);
    const r3 = hash01(elapsedSec * 11.1 + idx * 9.3 + spawnedThisStep * 4.1);

    p.active = true;
    // Slight radial spread inside the exhaust flue opening
    p.x = emitterX + (r1 - 0.5) * 0.24;
    p.y = emitterY + r2 * 0.14;
    p.z = emitterZ + (r3 - 0.5) * 0.24;

    // Inherit ~24% of train velocity so the plume bends smoothly backward into the slipstream
    p.vx = trainVx * 0.24 + (r2 - 0.5) * 0.55 + profile.windDriftX * 0.35;
    p.vy = profile.riseSpeed * (0.86 + r1 * 0.28);
    p.vz = trainVz * 0.24 + (r1 - 0.5) * 0.55 + profile.windDriftZ * 0.35;

    p.age = 0;
    p.maxAge = profile.puffLifetime * (0.85 + r3 * 0.3);
    p.startSize = profile.startScale * (0.88 + r1 * 0.24);
    p.endSize = profile.endScale * (0.86 + r2 * 0.28);
    p.maxAlpha = profile.baseOpacity * (0.85 + r3 * 0.22);
    p.rotation = r1 * Math.PI * 2;
    p.rotSpeed = (r2 - 0.5) * 1.1;
    p.tintMix = r3 * 0.45;

    if (!wasActive) {
      activeCount++;
    }
  }

  pool.activeCount = activeCount;
  return profile;
}
