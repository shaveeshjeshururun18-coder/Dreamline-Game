import type { SeasonType, TimePeriod, WeatherType } from './types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface SkyPalette {
  zenith: Rgb;
  midSky: Rgb;
  horizon: Rgb;
  sunColor: Rgb;
  cloudLit: Rgb;
  cloudShadow: Rgb;
  fogColor: Rgb;
  fogDensity: number;
  hemiSky: Rgb;
  hemiGround: Rgb;
  hemiIntensity: number;
  sunIntensity: number;
  sunElevation: number; // radians
  sunAzimuth: number; // radians
  lanternStrength: number; // 0..1 (train lights & storm beacons)
  worldLanternStrength: number; // 0..1 (non-train world lamps: warm at sunset/evening, OFF at full dark night)
  nightDarkness: number; // 0..1 (1.0 during full dark night)
  environmentIntensity: number; // PBR IBL intensity (0.45 day/sunset -> 0.012 full dark night)
  starOpacity: number; // 0..1
  waterTint: Rgb;
}

function hex(h: number): Rgb {
  return {
    r: ((h >> 16) & 255) / 255,
    g: ((h >> 8) & 255) / 255,
    b: (h & 255) / 255,
  };
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

interface Keyframe {
  hour: number;
  palette: SkyPalette;
}

/**
 * Curated Makoto Shinkai / anime countryside railway palettes matching the reference images:
 * Lavender-purple twilight, pastel pink clouds, peach-orange sunset, warm golden hour, soft morning mist, starry night.
 */
const KEYFRAMES: Keyframe[] = [
  {
    hour: 0.0, // Midnight — starry night sky lit by warm streetlamps, stations, windows, train & player lantern
    palette: {
      zenith: hex(0x030612),
      midSky: hex(0x060c1f),
      horizon: hex(0x0e1830),
      sunColor: hex(0x4b689c),
      cloudLit: hex(0x16223d),
      cloudShadow: hex(0x050914),
      fogColor: hex(0x081022),
      fogDensity: 0.0056,
      hemiSky: hex(0x16223d),
      hemiGround: hex(0x070a12),
      hemiIntensity: 0.08,
      sunIntensity: 0.04,
      sunElevation: 0.55,
      sunAzimuth: 0.6,
      lanternStrength: 0.82,
      worldLanternStrength: 0.52,
      nightDarkness: 1.0,
      environmentIntensity: 0.04,
      starOpacity: 0.96,
      waterTint: hex(0x050c1a),
    },
  },
  {
    hour: 6.5, // Morning (calm soft sunrise blue, gentle golden warmth, zero blinding glare)
    palette: {
      zenith: hex(0x244e82),
      midSky: hex(0x4d7db0),
      horizon: hex(0xc4947a),
      sunColor: hex(0xe3b482),
      cloudLit: hex(0xcab6a3),
      cloudShadow: hex(0x5e708c),
      fogColor: hex(0x8299b0),
      fogDensity: 0.0044,
      hemiSky: hex(0x6c90b5),
      hemiGround: hex(0x3b4933),
      hemiIntensity: 0.44,
      sunIntensity: 0.82,
      sunElevation: 0.32,
      sunAzimuth: 1.15,
      lanternStrength: 0.05,
      worldLanternStrength: 0.12,
      nightDarkness: 0.0,
      environmentIntensity: 0.22,
      starOpacity: 0.0,
      waterTint: hex(0x316080),
    },
  },
  {
    hour: 13.0, // Afternoon (balanced natural sunlight, rich green countryside, crisp contrast)
    palette: {
      zenith: hex(0x1f5296),
      midSky: hex(0x4984c2),
      horizon: hex(0x94b8d4),
      sunColor: hex(0xe8d7ba),
      cloudLit: hex(0xd0dce6),
      cloudShadow: hex(0x6d83a3),
      fogColor: hex(0x84a5c2),
      fogDensity: 0.0029,
      hemiSky: hex(0x709ec9),
      hemiGround: hex(0x415632),
      hemiIntensity: 0.50,
      sunIntensity: 1.12,
      sunElevation: 0.96,
      sunAzimuth: 2.2,
      lanternStrength: 0.0,
      worldLanternStrength: 0.0,
      nightDarkness: 0.0,
      environmentIntensity: 0.25,
      starOpacity: 0.0,
      waterTint: hex(0x285c8c),
    },
  },
  {
    hour: 16.5, // Golden Hour (warm amber sunlight, golden grass, balanced exposure)
    palette: {
      zenith: hex(0x325294),
      midSky: hex(0x796ba3),
      horizon: hex(0xd4965c),
      sunColor: hex(0xe09a52),
      cloudLit: hex(0xd4b68e),
      cloudShadow: hex(0x6c5e85),
      fogColor: hex(0xb88c70),
      fogDensity: 0.0036,
      hemiSky: hex(0xa88292),
      hemiGround: hex(0x5c4630),
      hemiIntensity: 0.48,
      sunIntensity: 1.10,
      sunElevation: 0.25,
      sunAzimuth: 3.75,
      lanternStrength: 0.25,
      worldLanternStrength: 0.35,
      nightDarkness: 0.0,
      environmentIntensity: 0.26,
      starOpacity: 0.05,
      waterTint: hex(0x525478),
    },
  },
  {
    hour: 17.8, // Sunset (signature reference look: lavender purple, pastel pink, peach-orange clouds!)
    palette: {
      zenith: hex(0x293073),
      midSky: hex(0x6e508c),
      horizon: hex(0xd67d62),
      sunColor: hex(0xe07e52),
      cloudLit: hex(0xd6a994),
      cloudShadow: hex(0x554678),
      fogColor: hex(0xa36e7f),
      fogDensity: 0.0040,
      hemiSky: hex(0x946894),
      hemiGround: hex(0x40323d),
      hemiIntensity: 0.48,
      sunIntensity: 1.02,
      sunElevation: 0.13,
      sunAzimuth: 4.15,
      lanternStrength: 0.72,
      worldLanternStrength: 0.85,
      nightDarkness: 0.0,
      environmentIntensity: 0.26,
      starOpacity: 0.28,
      waterTint: hex(0x433b6b),
    },
  },
  {
    hour: 19.3, // Evening (deep twilight blue, glowing warm railway & train windows)
    palette: {
      zenith: hex(0x161f52),
      midSky: hex(0x373c7a),
      horizon: hex(0x9e6386),
      sunColor: hex(0xd98494),
      cloudLit: hex(0x8c6896),
      cloudShadow: hex(0x272c59),
      fogColor: hex(0x3d3b69),
      fogDensity: 0.0045,
      hemiSky: hex(0x465082),
      hemiGround: hex(0x1d1a2c),
      hemiIntensity: 0.34,
      sunIntensity: 0.36,
      sunElevation: 0.06,
      sunAzimuth: 4.45,
      lanternStrength: 0.78,
      worldLanternStrength: 0.48,
      nightDarkness: 0.16,
      environmentIntensity: 0.14,
      starOpacity: 0.72,
      waterTint: hex(0x1e254d),
    },
  },
  {
    hour: 21.5, // Night — calm starry dark night illuminated gently by warm lanterns & train headlights
    palette: {
      zenith: hex(0x030612),
      midSky: hex(0x060c1f),
      horizon: hex(0x0d162c),
      sunColor: hex(0x3f5a8a),
      cloudLit: hex(0x131d36),
      cloudShadow: hex(0x040812),
      fogColor: hex(0x070e1e),
      fogDensity: 0.0056,
      hemiSky: hex(0x16223d),
      hemiGround: hex(0x070a12),
      hemiIntensity: 0.08,
      sunIntensity: 0.04,
      sunElevation: 0.55,
      sunAzimuth: 0.6,
      lanternStrength: 0.82,
      worldLanternStrength: 0.52,
      nightDarkness: 1.0,
      environmentIntensity: 0.04,
      starOpacity: 0.96,
      waterTint: hex(0x050c1a),
    },
  },
];

export const TIME_PRESET_HOURS: Record<TimePeriod, number> = {
  morning: 6.75,
  afternoon: 13.0,
  golden: 16.5,
  sunset: 17.75,
  evening: 19.35,
  night: 22.0,
};

export const TIME_PERIOD_LABELS: Record<TimePeriod, { name: string; jp: string }> = {
  morning: { name: 'Morning', jp: 'காலை' },
  afternoon: { name: 'Afternoon', jp: 'மதியம்' },
  golden: { name: 'Golden Hour', jp: 'பொன்மாலை' },
  sunset: { name: 'Sunset', jp: 'அந்திமாலை' },
  evening: { name: 'Evening', jp: 'மாலை' },
  night: { name: 'Night', jp: 'இரவு' },
};

export const WEATHER_LABELS: Record<WeatherType, { name: string; jp: string }> = {
  clear: { name: 'Clear Sky', jp: 'தெளிவான வானம்' },
  breeze: { name: 'Gentle Wind', jp: 'தென்றல் காற்று' },
  cloudy: { name: 'Soft Clouds', jp: 'மேகமூட்டம்' },
  fog: { name: 'Morning Mist', jp: 'காலைப் பனி' },
  rain: { name: 'Light Rain', jp: 'சிறுமழை' },
  heavy_rain: { name: 'Heavy Rain', jp: 'பெருமழை' },
  thunderstorm: { name: 'Thunder Rain', jp: 'இடிமழை' },
  ferocious_rain: { name: 'Ferocious Rain', jp: 'கொடும் மழை' },
  flood: { name: 'Flood', jp: 'வெள்ளம்' },
  tsunami: { name: 'Tsunami', jp: 'சுனாமி' },
  snow: { name: 'Light Snow', jp: 'மென்பனி' },
};

export const SEASON_LABELS: Record<
  SeasonType,
  { name: string; tamil: string; desc: string }
> = {
  spring: {
    name: 'Spring',
    tamil: 'வசந்தம்',
    desc: 'Sakura blossoms & drifting pink petals',
  },
  summer: {
    name: 'Summer',
    tamil: 'கோடை',
    desc: 'Warm golden sun & vivid emerald hills',
  },
  autumn: {
    name: 'Autumn',
    tamil: 'இலையுதிர்',
    desc: 'Crimson-amber maple leaves & warm breeze',
  },
  winter: {
    name: 'Winter',
    tamil: 'குளிர்',
    desc: 'Frosted trees & gentle snowfall everywhere',
  },
};

export function normalizeHours(hours: number): number {
  const m = hours % 24;
  return m < 0 ? m + 24 : m;
}

export function getTimePeriod(hours: number): TimePeriod {
  const h = normalizeHours(hours);
  if (h >= 5.0 && h < 10.5) return 'morning';
  if (h >= 10.5 && h < 15.5) return 'afternoon';
  if (h >= 15.5 && h < 17.2) return 'golden';
  if (h >= 17.2 && h < 18.7) return 'sunset';
  if (h >= 18.7 && h < 20.6) return 'evening';
  return 'night';
}

export function formatClockTime(hours: number): string {
  const h = normalizeHours(hours);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Computes how deeply the world is in full-dark night mode (0 = day/twilight, 1 = pitch-dark night
 * where ambient/world lamps switch off so the train's headlights & glowing cabin dominate).
 */
export function computeNightBlackoutFactor(hours: number): number {
  const h = normalizeHours(hours);
  if (h >= 21.0 || h <= 4.5) return 1.0;
  if (h > 19.6 && h < 21.0) {
    const u = (h - 19.6) / 1.4;
    return u * u * (3 - 2 * u);
  }
  if (h > 4.5 && h < 5.8) {
    const u = 1 - (h - 4.5) / 1.3;
    return u * u * (3 - 2 * u);
  }
  return 0.0;
}

export function computeSkyPalette(
  hours: number,
  weather: WeatherType,
  season: SeasonType = 'spring'
): SkyPalette {
  const h = normalizeHours(hours);

  let a = KEYFRAMES[KEYFRAMES.length - 1];
  let b = KEYFRAMES[0];
  let span = 24 - a.hour + b.hour;
  let dist = h >= a.hour ? h - a.hour : 24 - a.hour + h;

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (h >= KEYFRAMES[i].hour && h <= KEYFRAMES[i + 1].hour) {
      a = KEYFRAMES[i];
      b = KEYFRAMES[i + 1];
      span = b.hour - a.hour;
      dist = h - a.hour;
      break;
    }
  }

  const rawT = span > 0 ? dist / span : 0;
  // Smoothstep for silky transitions
  const t = rawT * rawT * (3 - 2 * rawT);

  const nightDarkness = computeNightBlackoutFactor(h);
  const daylightWeight = 1 - nightDarkness * 0.94;

  const p: SkyPalette = {
    zenith: lerpRgb(a.palette.zenith, b.palette.zenith, t),
    midSky: lerpRgb(a.palette.midSky, b.palette.midSky, t),
    horizon: lerpRgb(a.palette.horizon, b.palette.horizon, t),
    sunColor: lerpRgb(a.palette.sunColor, b.palette.sunColor, t),
    cloudLit: lerpRgb(a.palette.cloudLit, b.palette.cloudLit, t),
    cloudShadow: lerpRgb(a.palette.cloudShadow, b.palette.cloudShadow, t),
    fogColor: lerpRgb(a.palette.fogColor, b.palette.fogColor, t),
    fogDensity: lerpNum(a.palette.fogDensity, b.palette.fogDensity, t),
    hemiSky: lerpRgb(a.palette.hemiSky, b.palette.hemiSky, t),
    hemiGround: lerpRgb(a.palette.hemiGround, b.palette.hemiGround, t),
    hemiIntensity: lerpNum(a.palette.hemiIntensity, b.palette.hemiIntensity, t),
    sunIntensity: lerpNum(a.palette.sunIntensity, b.palette.sunIntensity, t),
    sunElevation: lerpNum(a.palette.sunElevation, b.palette.sunElevation, t),
    sunAzimuth: lerpNum(a.palette.sunAzimuth, b.palette.sunAzimuth, t),
    lanternStrength: lerpNum(a.palette.lanternStrength, b.palette.lanternStrength, t),
    worldLanternStrength: lerpNum(a.palette.worldLanternStrength, b.palette.worldLanternStrength, t),
    nightDarkness,
    environmentIntensity: lerpNum(a.palette.environmentIntensity, b.palette.environmentIntensity, t),
    starOpacity: lerpNum(a.palette.starOpacity, b.palette.starOpacity, t),
    waterTint: lerpRgb(a.palette.waterTint, b.palette.waterTint, t),
  };

  // Weather modifiers (scaled by daylightWeight so night stays pitch-dark even in rain/snow/fog!)
  const overcastGrey = hex(0x8893ab);
  if (weather === 'cloudy') {
    p.zenith = lerpRgb(p.zenith, overcastGrey, 0.32 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, overcastGrey, 0.25 * daylightWeight);
    p.sunIntensity *= 0.72;
    p.fogDensity *= 1.25;
    p.starOpacity *= 0.35;
  } else if (weather === 'fog') {
    const mistTint = lerpRgb(p.horizon, hex(0xe8e4ec), 0.45 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, mistTint, 0.55 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 2.35, 0.0095);
    p.sunIntensity *= 0.78;
    p.starOpacity *= 0.25;
  } else if (weather === 'rain') {
    const rainSlate = hex(0x4c5875);
    p.zenith = lerpRgb(p.zenith, rainSlate, 0.48 * daylightWeight);
    p.midSky = lerpRgb(p.midSky, rainSlate, 0.42 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, rainSlate, 0.45 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 1.9, 0.0078);
    p.sunIntensity *= 0.58;
    p.lanternStrength = Math.max(p.lanternStrength, 0.72);
    p.worldLanternStrength = Math.max(p.worldLanternStrength, 0.72);
    p.starOpacity *= 0.12;
  } else if (weather === 'heavy_rain') {
    const heavySlate = hex(0x37435e);
    const heavyCloud = hex(0x525e7a);
    p.zenith = lerpRgb(p.zenith, heavySlate, 0.66 * daylightWeight);
    p.midSky = lerpRgb(p.midSky, heavySlate, 0.6 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, heavyCloud, 0.52 * daylightWeight);
    p.cloudLit = lerpRgb(p.cloudLit, heavyCloud, 0.65 * daylightWeight);
    p.cloudShadow = lerpRgb(p.cloudShadow, hex(0x1f273d), 0.65 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, heavySlate, 0.62 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 2.3, 0.0098);
    p.sunIntensity *= 0.42;
    p.hemiIntensity *= 0.78;
    p.lanternStrength = Math.max(p.lanternStrength, 0.88);
    p.worldLanternStrength = Math.max(p.worldLanternStrength, 0.88);
    p.starOpacity = 0;
  } else if (weather === 'thunderstorm') {
    const stormIndigo = hex(0x232d47);
    const stormHorizon = hex(0x404d6b);
    p.zenith = lerpRgb(p.zenith, stormIndigo, 0.78 * daylightWeight);
    p.midSky = lerpRgb(p.midSky, stormIndigo, 0.72 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, stormHorizon, 0.62 * daylightWeight);
    p.cloudLit = lerpRgb(p.cloudLit, hex(0x4d5a78), 0.75 * daylightWeight);
    p.cloudShadow = lerpRgb(p.cloudShadow, hex(0x141a2e), 0.78 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, stormHorizon, 0.7 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 2.55, 0.011);
    p.sunIntensity *= 0.34;
    p.hemiIntensity *= 0.72;
    p.lanternStrength = Math.max(p.lanternStrength, 0.96);
    p.worldLanternStrength = Math.max(p.worldLanternStrength, 0.96);
    p.starOpacity = 0;
  } else if (weather === 'ferocious_rain') {
    const tempestDark = hex(0x182136);
    const tempestMist = hex(0x323f59);
    p.zenith = lerpRgb(p.zenith, tempestDark, 0.88 * daylightWeight);
    p.midSky = lerpRgb(p.midSky, tempestDark, 0.84 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, tempestMist, 0.76 * daylightWeight);
    p.cloudLit = lerpRgb(p.cloudLit, hex(0x3f4c68), 0.84 * daylightWeight);
    p.cloudShadow = lerpRgb(p.cloudShadow, hex(0x0d1221), 0.88 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, tempestMist, 0.8 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 2.95, 0.0132);
    p.sunIntensity *= 0.25;
    p.hemiIntensity *= 0.66;
    p.lanternStrength = 1.0;
    p.worldLanternStrength = 1.0;
    p.starOpacity = 0;
  } else if (weather === 'flood') {
    const floodTeal = hex(0x2b3e52);
    const floodMist = hex(0x465d72);
    p.zenith = lerpRgb(p.zenith, floodTeal, 0.76 * daylightWeight);
    p.midSky = lerpRgb(p.midSky, floodTeal, 0.68 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, floodMist, 0.64 * daylightWeight);
    p.cloudLit = lerpRgb(p.cloudLit, hex(0x586d82), 0.72 * daylightWeight);
    p.cloudShadow = lerpRgb(p.cloudShadow, hex(0x182534), 0.76 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, floodMist, 0.72 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 2.45, 0.0108);
    p.sunIntensity *= 0.36;
    p.hemiIntensity *= 0.76;
    p.lanternStrength = Math.max(p.lanternStrength, 0.94);
    p.worldLanternStrength = Math.max(p.worldLanternStrength, 0.94);
    p.waterTint = lerpRgb(p.waterTint, hex(0x28566b), 0.65 * daylightWeight);
    p.starOpacity = 0;
  } else if (weather === 'tsunami') {
    const surgeNavy = hex(0x16293d);
    const seaSpray = hex(0x3a5a70);
    p.zenith = lerpRgb(p.zenith, surgeNavy, 0.84 * daylightWeight);
    p.midSky = lerpRgb(p.midSky, surgeNavy, 0.78 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, seaSpray, 0.72 * daylightWeight);
    p.cloudLit = lerpRgb(p.cloudLit, hex(0x527087), 0.78 * daylightWeight);
    p.cloudShadow = lerpRgb(p.cloudShadow, hex(0x0f1e2e), 0.84 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, seaSpray, 0.74 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 2.55, 0.0112);
    p.sunIntensity *= 0.34;
    p.hemiIntensity *= 0.74;
    p.lanternStrength = 1.0;
    p.worldLanternStrength = 1.0;
    p.waterTint = lerpRgb(p.waterTint, hex(0x145369), 0.75 * daylightWeight);
    p.starOpacity = 0;
  } else if (weather === 'snow') {
    const snowTint = hex(0xcbd5e8);
    p.fogColor = lerpRgb(p.fogColor, snowTint, 0.35 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 1.7, 0.0072);
    p.sunIntensity *= 0.78;
    p.lanternStrength = Math.max(p.lanternStrength, 0.55);
    p.worldLanternStrength = Math.max(p.worldLanternStrength, 0.55);
  }

  // Seasonal colour & lighting shifts (muted during full-dark night so winter/autumn never brighten the blackout)
  if (season === 'summer') {
    const warmSun = hex(0xffe19c);
    p.sunColor = lerpRgb(p.sunColor, warmSun, 0.22 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, hex(0xffdfb0), 0.14 * daylightWeight);
    p.sunIntensity *= 1 + 0.12 * daylightWeight;
    p.fogDensity *= 0.88;
  } else if (season === 'autumn') {
    const amberHorizon = hex(0xf59e6c);
    const copperFog = hex(0xd48e6a);
    p.horizon = lerpRgb(p.horizon, amberHorizon, 0.26 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, copperFog, 0.22 * daylightWeight);
    p.hemiGround = lerpRgb(p.hemiGround, hex(0x8a5236), 0.35 * daylightWeight);
    p.cloudLit = lerpRgb(p.cloudLit, hex(0xffd2a6), 0.22 * daylightWeight);
  } else if (season === 'winter') {
    const frostMist = hex(0xcfdff2);
    p.zenith = lerpRgb(p.zenith, hex(0x3a527a), 0.24 * daylightWeight);
    p.horizon = lerpRgb(p.horizon, frostMist, 0.3 * daylightWeight);
    p.fogColor = lerpRgb(p.fogColor, frostMist, 0.36 * daylightWeight);
    p.fogDensity = Math.max(p.fogDensity * 1.28, 0.0052);
    p.hemiSky = lerpRgb(p.hemiSky, hex(0xbcd4f2), 0.3 * daylightWeight);
    p.sunIntensity *= 0.9;
  }

  // Keep night calm, starry, and comfortable on the eyes (zero night overbrightness)
  if (nightDarkness > 0.001) {
    p.worldLanternStrength = lerpNum(p.worldLanternStrength, 0.52, nightDarkness);
    p.environmentIntensity = lerpNum(p.environmentIntensity, 0.04, nightDarkness);
    p.hemiIntensity = lerpNum(p.hemiIntensity, 0.08, nightDarkness);
    p.sunIntensity = lerpNum(p.sunIntensity, 0.04, nightDarkness);
  }

  return p;
}
