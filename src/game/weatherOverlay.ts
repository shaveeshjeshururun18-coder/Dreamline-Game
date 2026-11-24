import type { SeasonType, TimePeriod, WeatherType } from './types';

export type WeatherOverlayEffectKind =
  | 'sakura_petals'
  | 'autumn_leaves'
  | 'rain_streaks'
  | 'storm_rain'
  | 'snowflakes'
  | 'fog_wisps'
  | 'ambient_motes';

export type WeatherVignetteTone =
  | 'calm'
  | 'cloudy'
  | 'mist'
  | 'rain'
  | 'storm'
  | 'deluge'
  | 'snow';

export interface WeatherVignetteProfile {
  tone: WeatherVignetteTone;
  intensity: number;
  frostRim: boolean;
  nightDeepened: boolean;
}

export interface WeatherOverlayConfig {
  weather: WeatherType;
  season: SeasonType;
  period: TimePeriod;
  kind: WeatherOverlayEffectKind;
  count: number;
  windVx: number;
  fallVyMin: number;
  fallVyMax: number;
  sizeMin: number;
  sizeMax: number;
  opacityMin: number;
  opacityMax: number;
  swayAmplitude: number;
  swayFrequency: number;
  palette: readonly string[];
  lightningRate: number;
  splashEnabled: boolean;
}

export interface WeatherOverlayParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  phase: number;
  tumblePhase: number;
  tumbleSpeed: number;
  colorIndex: number;
  lengthFactor: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(weather: WeatherType, season: SeasonType, period: TimePeriod): number {
  const key = `${weather}:${season}:${period}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getSakuraPalette(period: TimePeriod): readonly string[] {
  if (period === 'night' || period === 'evening') {
    return ['#F9D2E2', '#F2B5CF', '#FCE6F0', '#E8A5C6'];
  }
  if (period === 'golden' || period === 'sunset') {
    return ['#FFD3DE', '#F9B4C8', '#FFE4DC', '#F5A6B8'];
  }
  return ['#FFDCE7', '#FBBBD0', '#FFF0F5', '#F6A8C1'];
}

function getAutumnPalette(period: TimePeriod): readonly string[] {
  if (period === 'night' || period === 'evening') {
    return ['#D4845A', '#C96E4B', '#DFAC69', '#B95D48'];
  }
  return ['#E88A4F', '#D9643B', '#F0B65A', '#C84E3A'];
}

function getRainPalette(period: TimePeriod, isStorm: boolean): readonly string[] {
  if (period === 'night' || period === 'evening') {
    return isStorm
      ? ['#CBE0F8', '#A9C7EB', '#E4F0FF']
      : ['#D2E5FA', '#B8D4F2', '#E8F3FF'];
  }
  if (period === 'golden' || period === 'sunset') {
    return isStorm
      ? ['#DFD7E6', '#C8C5DA', '#F0E4E8']
      : ['#F2E2DC', '#DFD3E2', '#FAF0EB'];
  }
  return isStorm
    ? ['#D6E6F7', '#B9D1EC', '#ECF4FD']
    : ['#E2EFFC', '#C8DDF4', '#F2F8FF'];
}

function getSnowPalette(period: TimePeriod): readonly string[] {
  if (period === 'night' || period === 'evening') {
    return ['#EBF4FF', '#D4E6FA', '#FFFFFF'];
  }
  if (period === 'golden' || period === 'sunset') {
    return ['#FFF4F0', '#FDEAE6', '#FFFFFF'];
  }
  return ['#FFFFFF', '#EEF6FF', '#F8FBFF'];
}

export function resolveWeatherOverlayConfig(
  weather: WeatherType,
  season: SeasonType = 'spring',
  period: TimePeriod = 'sunset'
): WeatherOverlayConfig {
  switch (weather) {
    case 'breeze': {
      if (season === 'autumn') {
        return {
          weather,
          season,
          period,
          kind: 'autumn_leaves',
          count: 42,
          windVx: 86,
          fallVyMin: 34,
          fallVyMax: 78,
          sizeMin: 7,
          sizeMax: 14,
          opacityMin: 0.45,
          opacityMax: 0.85,
          swayAmplitude: 38,
          swayFrequency: 1.5,
          palette: getAutumnPalette(period),
          lightningRate: 0,
          splashEnabled: false,
        };
      }
      if (season === 'winter') {
        return {
          weather,
          season,
          period,
          kind: 'snowflakes',
          count: 38,
          windVx: 72,
          fallVyMin: 28,
          fallVyMax: 66,
          sizeMin: 3,
          sizeMax: 7.5,
          opacityMin: 0.35,
          opacityMax: 0.78,
          swayAmplitude: 28,
          swayFrequency: 1.3,
          palette: getSnowPalette(period),
          lightningRate: 0,
          splashEnabled: false,
        };
      }
      return {
        weather,
        season,
        period,
        kind: 'sakura_petals',
        count: 48,
        windVx: 94,
        fallVyMin: 30,
        fallVyMax: 76,
        sizeMin: 6.5,
        sizeMax: 13.5,
        opacityMin: 0.46,
        opacityMax: 0.88,
        swayAmplitude: 42,
        swayFrequency: 1.65,
        palette: getSakuraPalette(period),
        lightningRate: 0,
        splashEnabled: false,
      };
    }

    case 'rain':
      return {
        weather,
        season,
        period,
        kind: 'rain_streaks',
        count: 76,
        windVx: -95,
        fallVyMin: 460,
        fallVyMax: 720,
        sizeMin: 14,
        sizeMax: 26,
        opacityMin: 0.24,
        opacityMax: 0.56,
        swayAmplitude: 0,
        swayFrequency: 0,
        palette: getRainPalette(period, false),
        lightningRate: 0,
        splashEnabled: true,
      };

    case 'heavy_rain':
      return {
        weather,
        season,
        period,
        kind: 'storm_rain',
        count: 112,
        windVx: -175,
        fallVyMin: 660,
        fallVyMax: 980,
        sizeMin: 20,
        sizeMax: 36,
        opacityMin: 0.28,
        opacityMax: 0.64,
        swayAmplitude: 0,
        swayFrequency: 0,
        palette: getRainPalette(period, true),
        lightningRate: 0,
        splashEnabled: true,
      };

    case 'thunderstorm':
      return {
        weather,
        season,
        period,
        kind: 'storm_rain',
        count: 124,
        windVx: -225,
        fallVyMin: 740,
        fallVyMax: 1080,
        sizeMin: 22,
        sizeMax: 40,
        opacityMin: 0.3,
        opacityMax: 0.68,
        swayAmplitude: 0,
        swayFrequency: 0,
        palette: getRainPalette(period, true),
        lightningRate: 0.22,
        splashEnabled: true,
      };

    case 'ferocious_rain':
      return {
        weather,
        season,
        period,
        kind: 'storm_rain',
        count: 142,
        windVx: -300,
        fallVyMin: 840,
        fallVyMax: 1220,
        sizeMin: 26,
        sizeMax: 46,
        opacityMin: 0.32,
        opacityMax: 0.74,
        swayAmplitude: 0,
        swayFrequency: 0,
        palette: getRainPalette(period, true),
        lightningRate: 0.42,
        splashEnabled: true,
      };

    case 'flood':
      return {
        weather,
        season,
        period,
        kind: 'storm_rain',
        count: 118,
        windVx: -200,
        fallVyMin: 680,
        fallVyMax: 1020,
        sizeMin: 20,
        sizeMax: 36,
        opacityMin: 0.28,
        opacityMax: 0.65,
        swayAmplitude: 0,
        swayFrequency: 0,
        palette: getRainPalette(period, true),
        lightningRate: 0.14,
        splashEnabled: true,
      };

    case 'tsunami':
      return {
        weather,
        season,
        period,
        kind: 'storm_rain',
        count: 132,
        windVx: -340,
        fallVyMin: 720,
        fallVyMax: 1140,
        sizeMin: 22,
        sizeMax: 42,
        opacityMin: 0.3,
        opacityMax: 0.72,
        swayAmplitude: 12,
        swayFrequency: 2.2,
        palette: ['#D5F0FA', '#B8E0F2', '#EEFAFF'],
        lightningRate: 0.18,
        splashEnabled: true,
      };

    case 'snow':
      return {
        weather,
        season,
        period,
        kind: 'snowflakes',
        count: 82,
        windVx: 24,
        fallVyMin: 34,
        fallVyMax: 92,
        sizeMin: 2.8,
        sizeMax: 8.6,
        opacityMin: 0.4,
        opacityMax: 0.9,
        swayAmplitude: 32,
        swayFrequency: 1.1,
        palette: getSnowPalette(period),
        lightningRate: 0,
        splashEnabled: false,
      };

    case 'fog':
      return {
        weather,
        season,
        period,
        kind: 'fog_wisps',
        count: 14,
        windVx: 22,
        fallVyMin: -4,
        fallVyMax: 6,
        sizeMin: 180,
        sizeMax: 340,
        opacityMin: 0.06,
        opacityMax: 0.14,
        swayAmplitude: 16,
        swayFrequency: 0.35,
        palette:
          period === 'night' || period === 'evening'
            ? ['#B5C2D9', '#99AAC6']
            : ['#EAE4EE', '#D8DCE6'],
        lightningRate: 0,
        splashEnabled: false,
      };

    case 'cloudy':
      return {
        weather,
        season,
        period,
        kind: 'ambient_motes',
        count: 20,
        windVx: 28,
        fallVyMin: 10,
        fallVyMax: 26,
        sizeMin: 2.2,
        sizeMax: 4.8,
        opacityMin: 0.14,
        opacityMax: 0.34,
        swayAmplitude: 20,
        swayFrequency: 0.9,
        palette: ['#E6E2EE', '#D5D4E2', '#F3EFEA'],
        lightningRate: 0,
        splashEnabled: false,
      };

    case 'clear':
    default: {
      if (season === 'spring') {
        return {
          weather: 'clear',
          season,
          period,
          kind: 'sakura_petals',
          count: 18,
          windVx: 30,
          fallVyMin: 18,
          fallVyMax: 40,
          sizeMin: 5.5,
          sizeMax: 10.5,
          opacityMin: 0.32,
          opacityMax: 0.68,
          swayAmplitude: 26,
          swayFrequency: 1.15,
          palette: getSakuraPalette(period),
          lightningRate: 0,
          splashEnabled: false,
        };
      }
      if (season === 'autumn') {
        return {
          weather: 'clear',
          season,
          period,
          kind: 'autumn_leaves',
          count: 16,
          windVx: 28,
          fallVyMin: 20,
          fallVyMax: 42,
          sizeMin: 6.5,
          sizeMax: 11.5,
          opacityMin: 0.3,
          opacityMax: 0.64,
          swayAmplitude: 24,
          swayFrequency: 1.05,
          palette: getAutumnPalette(period),
          lightningRate: 0,
          splashEnabled: false,
        };
      }
      return {
        weather: 'clear',
        season,
        period,
        kind: 'ambient_motes',
        count: 18,
        windVx: 14,
        fallVyMin: 8,
        fallVyMax: 22,
        sizeMin: 2.2,
        sizeMax: 4.6,
        opacityMin: 0.16,
        opacityMax: 0.42,
        swayAmplitude: 18,
        swayFrequency: 0.85,
        palette:
          period === 'night' || period === 'evening'
            ? ['#F7E6B7', '#D6E8FF', '#FFF3CF']
            : ['#FFF2D6', '#FFE2C2', '#FFFFFF'],
        lightningRate: 0,
        splashEnabled: false,
      };
    }
  }
}

export function createWeatherOverlayParticles(
  config: WeatherOverlayConfig,
  width: number,
  height: number
): WeatherOverlayParticle[] {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const rand = mulberry32(hashSeed(config.weather, config.season, config.period));
  const particles: WeatherOverlayParticle[] = [];

  for (let i = 0; i < config.count; i++) {
    const depth = 0.35 + rand() * 0.65;
    const size = config.sizeMin + (config.sizeMax - config.sizeMin) * depth;
    const fallVy =
      config.fallVyMin + (config.fallVyMax - config.fallVyMin) * (0.4 + 0.6 * depth);
    const vxJitter = (rand() - 0.5) * Math.max(14, Math.abs(config.windVx) * 0.25);

    particles.push({
      x: rand() * safeW,
      y: rand() * safeH,
      vx: config.windVx * (0.65 + 0.45 * depth) + vxJitter,
      vy: fallVy,
      size,
      depth,
      opacity:
        config.opacityMin + (config.opacityMax - config.opacityMin) * (0.35 + 0.65 * depth),
      rotation: rand() * Math.PI * 2,
      rotationSpeed: (rand() - 0.5) * (config.kind === 'fog_wisps' ? 0.08 : 2.2),
      phase: rand() * Math.PI * 2,
      tumblePhase: rand() * Math.PI * 2,
      tumbleSpeed: 1.4 + rand() * 2.4,
      colorIndex: Math.floor(rand() * config.palette.length),
      lengthFactor: 0.8 + rand() * 0.45,
    });
  }

  return particles;
}

export function stepWeatherOverlayParticles(
  particles: WeatherOverlayParticle[],
  config: WeatherOverlayConfig,
  width: number,
  height: number,
  dt: number,
  elapsed: number
): void {
  const safeDt = Math.min(0.05, Math.max(0, dt));
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const margin = config.kind === 'fog_wisps' ? 280 : 48;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const sway =
      config.swayAmplitude > 0
        ? Math.sin(elapsed * config.swayFrequency + p.phase) * config.swayAmplitude * p.depth
        : 0;

    p.x += (p.vx + sway) * safeDt;
    p.y += p.vy * safeDt;
    p.rotation += p.rotationSpeed * safeDt;
    p.tumblePhase += p.tumbleSpeed * safeDt;

    if (p.y > safeH + margin) {
      p.y = -margin + ((p.y - (safeH + margin)) % Math.max(1, margin));
      p.x = ((p.x % safeW) + safeW) % safeW;
    } else if (p.y < -margin) {
      p.y = safeH + margin;
    }

    if (p.x > safeW + margin) {
      p.x = -margin;
    } else if (p.x < -margin) {
      p.x = safeW + margin;
    }
  }
}

export function resolveWeatherVignetteProfile(
  weather: WeatherType,
  season: SeasonType = 'spring',
  period: TimePeriod = 'sunset'
): WeatherVignetteProfile {
  const nightDeepened = period === 'night' || period === 'evening';
  const nightBoost = nightDeepened ? 0.08 : 0;
  const clampIntensity = (val: number) => Math.min(1, Math.max(0, Number(val.toFixed(2))));

  switch (weather) {
    case 'ferocious_rain':
      return {
        tone: 'deluge',
        intensity: clampIntensity(0.95 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'tsunami':
      return {
        tone: 'deluge',
        intensity: clampIntensity(0.9 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'thunderstorm':
      return {
        tone: 'deluge',
        intensity: clampIntensity(0.88 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'flood':
      return {
        tone: 'storm',
        intensity: clampIntensity(0.8 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'heavy_rain':
      return {
        tone: 'storm',
        intensity: clampIntensity(0.76 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'snow':
      return {
        tone: 'snow',
        intensity: clampIntensity(0.78 + nightBoost * 0.6),
        frostRim: true,
        nightDeepened,
      };
    case 'rain':
      return {
        tone: 'rain',
        intensity: clampIntensity(0.58 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'fog':
      return {
        tone: 'mist',
        intensity: clampIntensity(0.54 + nightBoost * 0.5),
        frostRim: false,
        nightDeepened,
      };
    case 'cloudy':
      return {
        tone: 'cloudy',
        intensity: clampIntensity(0.38 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'breeze':
      if (season === 'winter') {
        return {
          tone: 'snow',
          intensity: clampIntensity(0.58 + nightBoost * 0.5),
          frostRim: true,
          nightDeepened,
        };
      }
      return {
        tone: 'calm',
        intensity: clampIntensity(0.28 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
    case 'clear':
    default:
      return {
        tone: 'calm',
        intensity: clampIntensity(0.22 + nightBoost),
        frostRim: false,
        nightDeepened,
      };
  }
}

