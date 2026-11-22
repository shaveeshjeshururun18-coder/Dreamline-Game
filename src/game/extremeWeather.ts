import type { WeatherType } from './types';
import { WATER_LEVEL } from './terrain';

export interface WeatherIntensityProfile {
  /** 0 = dry, 0.35 = light rain, 0.7 = heavy rain, 1.0 = ferocious deluge */
  rainIntensity: number;
  /** Wind strength driving grass, tree sway, and slanted rain angle */
  windStrength: number;
  /** Slant horizontal velocity for falling rain streaks (m/s) */
  rainWindX: number;
  /** Fall velocity of rain streaks (m/s) */
  rainFallSpeed: number;
  /** 0 = no lightning, 0.45 = thunder rain, 1.0 = ferocious storm */
  lightningRate: number;
  /** Target world Y height of rising valley floodwater (WATER_LEVEL when dry) */
  targetFloodLevel: number;
  /** Whether a giant breaking 3D tsunami wave wall rolls across the coast & valley */
  hasTsunamiWave: boolean;
  /** Ambient rain audio gain (0..0.44) */
  rainAudioGain: number;
  /** Ambient wind audio gain (0.075..0.38) */
  windAudioGain: number;
  /** Extra ambient flood/surge water roar gain (0..0.42) */
  waterSurgeAudioGain: number;
  /** True for any rainy or storm condition */
  isRainy: boolean;
  /** True for severe storm modes (heavy_rain, thunderstorm, ferocious_rain, flood, tsunami) */
  isExtremeStorm: boolean;
}

export interface ExtremeWeatherState {
  /** Current smoothed valley floodwater height (Y in meters; WATER_LEVEL = -0.85 when dry) */
  floodLevel: number;
  /** 0..1 instantaneous sky & directional light lightning flash intensity */
  lightningFlash: number;
  /** Countdown seconds until next lightning strike */
  lightningTimer: number;
  /** Deterministic seed incremented per strike to randomize 3D bolt shape & sky position */
  lightningSeed: number;
  /** True on the exact simulation tick when a thunder clap SFX should fire */
  thunderTriggered: boolean;
  /** Intensity of the triggered thunder (0.6..1.15) */
  thunderIntensity: number;
  /** Continuous cycle progress 0..1 of the rolling tsunami wave wall */
  tsunamiPhase: number;
  /** World X coordinate of the tsunami crest (sweeps from East Ocean +190 -> West Valley -145) */
  tsunamiWaveX: number;
  /** Dynamic height of the breaking tsunami wall in meters (0 when inactive) */
  tsunamiWaveHeight: number;
  /** True on the exact tick a new tsunami wave crest surges in (triggers deep roar SFX) */
  tsunamiRoarTriggered: boolean;
}

export const FLOOD_TARGET_Y = 1.38;
export const TSUNAMI_FLOOD_TARGET_Y = 1.82;
export const TSUNAMI_START_X = 188;
export const TSUNAMI_END_X = -148;

const WEATHER_PROFILES: Record<WeatherType, WeatherIntensityProfile> = {
  clear: {
    rainIntensity: 0,
    windStrength: 0.22,
    rainWindX: 0,
    rainFallSpeed: 18,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0,
    windAudioGain: 0.075,
    waterSurgeAudioGain: 0,
    isRainy: false,
    isExtremeStorm: false,
  },
  breeze: {
    rainIntensity: 0,
    windStrength: 0.48,
    rainWindX: 0,
    rainFallSpeed: 18,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0,
    windAudioGain: 0.16,
    waterSurgeAudioGain: 0,
    isRainy: false,
    isExtremeStorm: false,
  },
  cloudy: {
    rainIntensity: 0,
    windStrength: 0.26,
    rainWindX: 0,
    rainFallSpeed: 18,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0,
    windAudioGain: 0.09,
    waterSurgeAudioGain: 0,
    isRainy: false,
    isExtremeStorm: false,
  },
  fog: {
    rainIntensity: 0,
    windStrength: 0.18,
    rainWindX: 0,
    rainFallSpeed: 18,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0,
    windAudioGain: 0.065,
    waterSurgeAudioGain: 0,
    isRainy: false,
    isExtremeStorm: false,
  },
  rain: {
    rainIntensity: 0.34,
    windStrength: 0.36,
    rainWindX: 2.2,
    rainFallSpeed: 21,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0.15,
    windAudioGain: 0.12,
    waterSurgeAudioGain: 0,
    isRainy: true,
    isExtremeStorm: false,
  },
  heavy_rain: {
    rainIntensity: 0.72,
    windStrength: 0.72,
    rainWindX: 5.4,
    rainFallSpeed: 29,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0.28,
    windAudioGain: 0.19,
    waterSurgeAudioGain: 0.04,
    isRainy: true,
    isExtremeStorm: true,
  },
  thunderstorm: {
    rainIntensity: 0.84,
    windStrength: 0.96,
    rainWindX: 7.5,
    rainFallSpeed: 33,
    lightningRate: 0.55,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0.33,
    windAudioGain: 0.24,
    waterSurgeAudioGain: 0.06,
    isRainy: true,
    isExtremeStorm: true,
  },
  ferocious_rain: {
    rainIntensity: 1.0,
    windStrength: 1.55,
    rainWindX: 12.8,
    rainFallSpeed: 42,
    lightningRate: 1.0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0.42,
    windAudioGain: 0.36,
    waterSurgeAudioGain: 0.1,
    isRainy: true,
    isExtremeStorm: true,
  },
  flood: {
    rainIntensity: 0.88,
    windStrength: 0.88,
    rainWindX: 6.4,
    rainFallSpeed: 32,
    lightningRate: 0.32,
    targetFloodLevel: FLOOD_TARGET_Y,
    hasTsunamiWave: false,
    rainAudioGain: 0.34,
    windAudioGain: 0.22,
    waterSurgeAudioGain: 0.34,
    isRainy: true,
    isExtremeStorm: true,
  },
  tsunami: {
    rainIntensity: 0.94,
    windStrength: 1.65,
    rainWindX: 13.5,
    rainFallSpeed: 40,
    lightningRate: 0.65,
    targetFloodLevel: TSUNAMI_FLOOD_TARGET_Y,
    hasTsunamiWave: true,
    rainAudioGain: 0.36,
    windAudioGain: 0.38,
    waterSurgeAudioGain: 0.44,
    isRainy: true,
    isExtremeStorm: true,
  },
  snow: {
    rainIntensity: 0,
    windStrength: 0.18,
    rainWindX: 0,
    rainFallSpeed: 18,
    lightningRate: 0,
    targetFloodLevel: WATER_LEVEL,
    hasTsunamiWave: false,
    rainAudioGain: 0,
    windAudioGain: 0.085,
    waterSurgeAudioGain: 0,
    isRainy: false,
    isExtremeStorm: false,
  },
};

export function getWeatherProfile(weather: WeatherType): WeatherIntensityProfile {
  return WEATHER_PROFILES[weather] ?? WEATHER_PROFILES.clear;
}

export function createInitialExtremeWeatherState(): ExtremeWeatherState {
  return {
    floodLevel: WATER_LEVEL,
    lightningFlash: 0,
    lightningTimer: 1.8,
    lightningSeed: 1,
    thunderTriggered: false,
    thunderIntensity: 0,
    tsunamiPhase: 0,
    tsunamiWaveX: TSUNAMI_START_X,
    tsunamiWaveHeight: 0,
    tsunamiRoarTriggered: false,
  };
}

/**
 * Returns the effective water surface elevation (Y in meters) combining
 * natural lakes/ocean (WATER_LEVEL = -0.85) with any active valley floodwater.
 */
export function getEffectiveWaterLevel(floodLevel: number): number {
  return Math.max(WATER_LEVEL, floodLevel);
}

/**
 * Computes an immediate dramatic kick-in state when the player switches directly
 * to thunderstorm, ferocious_rain, flood, or tsunami so effects are unmistakable right away.
 */
export function primeExtremeWeatherOnSelect(
  prev: ExtremeWeatherState,
  weather: WeatherType,
  playerX = 0
): ExtremeWeatherState {
  const profile = getWeatherProfile(weather);
  const next: ExtremeWeatherState = {
    ...prev,
    thunderTriggered: false,
    tsunamiRoarTriggered: false,
  };

  if (profile.lightningRate > 0) {
    next.lightningFlash = 1.0;
    next.lightningSeed = prev.lightningSeed + 1;
    next.lightningTimer = weather === 'ferocious_rain' ? 2.0 : 3.4;
    next.thunderTriggered = true;
    next.thunderIntensity = weather === 'ferocious_rain' ? 1.15 : 0.92;
  } else {
    next.lightningFlash = 0;
  }

  if (weather === 'flood') {
    // Rise immediately into vivid valley flooding and keep climbing to FLOOD_TARGET_Y
    next.floodLevel = Math.max(prev.floodLevel, 1.22);
    next.tsunamiWaveHeight = 0;
  } else if (weather === 'tsunami') {
    next.floodLevel = Math.max(prev.floodLevel, 1.48);
    // Place the towering breaking tsunami wave wall ~44m east of the player so it looms dramatically!
    const desiredX = Math.max(TSUNAMI_END_X + 40, Math.min(TSUNAMI_START_X - 8, playerX + 44));
    const phase = (TSUNAMI_START_X - desiredX) / (TSUNAMI_START_X - TSUNAMI_END_X);
    next.tsunamiPhase = Math.max(0.05, Math.min(0.84, phase));
    next.tsunamiWaveX = TSUNAMI_START_X - next.tsunamiPhase * (TSUNAMI_START_X - TSUNAMI_END_X);
    next.tsunamiWaveHeight = 18.0;
    next.tsunamiRoarTriggered = true;
  } else {
    // Switching back to any non-flood weather clears floodwater & tsunami wave immediately
    next.floodLevel = WATER_LEVEL;
    next.tsunamiWaveHeight = 0;
    next.tsunamiPhase = 0;
    next.tsunamiWaveX = TSUNAMI_START_X;
  }

  return next;
}

/**
 * Pure deterministic simulation step for floodwater rise/recession,
 * lightning flashes + thunder triggers, and rolling tsunami wave sweep.
 */
export function stepExtremeWeatherState(
  prev: ExtremeWeatherState,
  weather: WeatherType,
  dt: number
): ExtremeWeatherState {
  const profile = getWeatherProfile(weather);
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.12);

  // 1. Smooth floodwater rise (faster when rising into flood/tsunami, steady recession when dry)
  const targetFlood = profile.targetFloodLevel;
  const floodRate = targetFlood > prev.floodLevel ? 0.52 : 0.75;
  let floodLevel = prev.floodLevel + (targetFlood - prev.floodLevel) * Math.min(1, clampedDt * floodRate);
  if (Math.abs(targetFlood - floodLevel) < 0.004) {
    floodLevel = targetFlood;
  }

  // 2. Lightning flash decay & periodic storm strikes
  let lightningFlash = Math.max(0, prev.lightningFlash - clampedDt * 2.35);
  let lightningTimer = prev.lightningTimer;
  let lightningSeed = prev.lightningSeed;
  let thunderTriggered = false;
  let thunderIntensity = 0;

  if (profile.lightningRate > 0) {
    lightningTimer -= clampedDt;
    if (lightningTimer <= 0) {
      lightningSeed += 1;
      lightningFlash = 0.85 + ((lightningSeed * 37) % 16) / 100;
      thunderTriggered = true;
      thunderIntensity = 0.7 + profile.lightningRate * 0.45;
      // Pseudo-random interval between strikes: ferocious ~1.8-3.4s, thunder ~3.4-6.2s, flood ~5.0-8.5s
      const jitter = ((lightningSeed * 73 + 19) % 100) / 100;
      const baseMin = 1.8 + (1 - profile.lightningRate) * 3.4;
      const baseSpan = 1.6 + (1 - profile.lightningRate) * 2.2;
      lightningTimer = baseMin + jitter * baseSpan;
    }
  } else {
    lightningTimer = 2.0;
  }

  // 3. Rolling 3D Tsunami Wave Wall (East Ocean -> West Valley sweep cycle)
  let tsunamiPhase = prev.tsunamiPhase;
  let tsunamiWaveX = prev.tsunamiWaveX;
  let tsunamiWaveHeight = prev.tsunamiWaveHeight;
  let tsunamiRoarTriggered = false;

  if (profile.hasTsunamiWave) {
    // Full sweep ~336m at ~15m/s (~22.5s per wave cycle)
    const speedPhase = 15.0 / (TSUNAMI_START_X - TSUNAMI_END_X);
    tsunamiPhase += speedPhase * clampedDt;
    if (tsunamiPhase >= 1.0) {
      tsunamiPhase -= 1.0;
      tsunamiRoarTriggered = true;
    }
    tsunamiWaveX = TSUNAMI_START_X - tsunamiPhase * (TSUNAMI_START_X - TSUNAMI_END_X);
    // Swells tall as it surges onto shore & valley, tapers at the far western boundary
    const envelope = Math.sin(Math.min(1, Math.max(0, tsunamiPhase)) * Math.PI);
    const targetHeight = 8.5 + envelope * 9.5; // up to ~18m towering wave!
    tsunamiWaveHeight =
      prev.tsunamiWaveHeight + (targetHeight - prev.tsunamiWaveHeight) * Math.min(1, clampedDt * 2.6);
  } else {
    tsunamiWaveHeight = Math.max(0, prev.tsunamiWaveHeight - clampedDt * 6.0);
    if (tsunamiWaveHeight <= 0.05) {
      tsunamiWaveHeight = 0;
      tsunamiPhase = 0;
      tsunamiWaveX = TSUNAMI_START_X;
    }
  }

  return {
    floodLevel,
    lightningFlash,
    lightningTimer,
    lightningSeed,
    thunderTriggered,
    thunderIntensity,
    tsunamiPhase,
    tsunamiWaveX,
    tsunamiWaveHeight,
    tsunamiRoarTriggered,
  };
}
