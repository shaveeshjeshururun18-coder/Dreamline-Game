import type { WeatherType } from './types';
import { getWeatherProfile } from './extremeWeather';

export type OceanThemeId = 'bengal' | 'atlantic' | 'pacific';

export interface OceanThemeSpec {
  id: OceanThemeId;
  name: string;
  shortLabel: string;
  abyssalColor: readonly [number, number, number];
  shallowColor: readonly [number, number, number];
  sssTint: readonly [number, number, number];
  sandColor: readonly [number, number, number];
  baseAmplitude: number;
  baseSteepness: number;
  baseWavelength: number;
  baseSpread: number;
  baseChop: number;
  baseSSSIntensity: number;
  baseFoamIntensity: number;
}

/**
 * Exact OceanLab 3D Optical Ocean Basin Themes (Bay of Bengal, North Atlantic, Pacific Reef).
 * Colors are in linear optical space matching the OceanLab 3D PBR + Beer-Lambert + ACES shader.
 */
export const OCEAN_THEMES: Record<OceanThemeId, OceanThemeSpec> = {
  bengal: {
    id: 'bengal',
    name: 'Bay of Bengal Coast',
    shortLabel: 'Bay of Bengal',
    abyssalColor: [0.008, 0.052, 0.068],
    shallowColor: [0.035, 0.320, 0.265],
    sssTint: [0.060, 0.820, 0.620],
    sandColor: [0.830, 0.710, 0.520],
    baseAmplitude: 0.56,
    baseSteepness: 0.80,
    baseWavelength: 54.0,
    baseSpread: 0.62,
    baseChop: 1.05,
    baseSSSIntensity: 1.25,
    baseFoamIntensity: 1.15,
  },
  atlantic: {
    id: 'atlantic',
    name: 'North Atlantic Swell',
    shortLabel: 'Atlantic',
    abyssalColor: [0.005, 0.028, 0.052],
    shallowColor: [0.020, 0.195, 0.215],
    sssTint: [0.040, 0.640, 0.580],
    sandColor: [0.720, 0.690, 0.630],
    baseAmplitude: 0.66,
    baseSteepness: 0.88,
    baseWavelength: 60.0,
    baseSpread: 0.82,
    baseChop: 1.25,
    baseSSSIntensity: 1.05,
    baseFoamIntensity: 1.35,
  },
  pacific: {
    id: 'pacific',
    name: 'Pacific Reef & Shore',
    shortLabel: 'Pacific',
    abyssalColor: [0.004, 0.038, 0.115],
    shallowColor: [0.015, 0.360, 0.440],
    sssTint: [0.030, 0.880, 0.860],
    sandColor: [0.910, 0.860, 0.760],
    baseAmplitude: 0.52,
    baseSteepness: 0.75,
    baseWavelength: 68.0,
    baseSpread: 0.48,
    baseChop: 0.88,
    baseSSSIntensity: 1.45,
    baseFoamIntensity: 1.00,
  },
};

export interface GerstnerWaveComponent {
  readonly dir: readonly [number, number];
  readonly relLen: number;
  readonly relAmp: number;
  readonly phase: number;
}

/**
 * Exact 8-Wave Directional Gerstner Spectrum from OceanLab 3D.
 * Shared verbatim between GPU vertex shader and CPU buoyancy evaluator.
 */
export const OCEAN_WAVE_SPECTRUM: readonly GerstnerWaveComponent[] = [
  { dir: [0.14, 0.99], relLen: 1.0, relAmp: 1.0, phase: 0.0 },
  { dir: [-0.28, 0.96], relLen: 0.72, relAmp: 0.72, phase: 1.7 },
  { dir: [0.36, 0.93], relLen: 0.5, relAmp: 0.5, phase: 3.1 },
  { dir: [-0.48, 0.88], relLen: 0.35, relAmp: 0.35, phase: 4.3 },
  { dir: [0.58, 0.81], relLen: 0.24, relAmp: 0.24, phase: 2.2 },
  { dir: [-0.18, 0.98], relLen: 0.16, relAmp: 0.16, phase: 5.4 },
  { dir: [0.75, 0.66], relLen: 0.11, relAmp: 0.11, phase: 0.9 },
  { dir: [-0.68, 0.73], relLen: 0.075, relAmp: 0.075, phase: 3.8 },
];

export const OCEAN_GRAVITY = 9.81;

/**
 * Bathymetry heightmap domain covering DREAMLINE's entire coastal shelf & offshore islands:
 * Kadalkarai Coast (x≈110), Exhibition Island, Ocean Hero Tower, Snowman Island,
 * and the Gigantic 1 KM Jurassic Park Dinosaur Island (x=848, z=222, radius=500m).
 */
export const OCEAN_HEIGHTMAP_BOUNDS = {
  centerX: 720,
  centerZ: 210,
  size: 1760,
} as const;

export const SEABED_MIN_H = -25.0;
export const SEABED_MAX_H = 15.0;
const SEABED_RANGE = SEABED_MAX_H - SEABED_MIN_H;

/**
 * Encodes a relative seabed height (groundY - waterLevel) in [-25m, +15m]
 * into 16-bit RG channel bytes [hi, lo] matching the OceanLab 3D DataTexture format.
 */
export function encodeSeabedHeight16(relBedH: number): [number, number] {
  const norm = Math.max(0, Math.min(1, (relBedH - SEABED_MIN_H) / SEABED_RANGE));
  const scaled = norm * 255.0;
  let hi = Math.floor(scaled);
  let lo = Math.round((scaled - hi) * 255.0);
  if (lo >= 255) {
    if (hi < 255) {
      hi += 1;
      lo = 0;
    } else {
      lo = 255;
    }
  }
  return [hi, lo];
}

/**
 * Decodes 16-bit RG channel bytes [hi, lo] back into relative seabed height [-25m, +15m].
 */
export function decodeSeabedHeight16(hi: number, lo: number): number {
  const norm = hi / 255.0 + lo / (255.0 * 255.0);
  return SEABED_MIN_H + Math.max(0, Math.min(1, norm)) * SEABED_RANGE;
}

/**
 * Bakes DREAMLINE's real coastal & island terrain elevation into a 16-bit RG RGBA DataTexture buffer.
 * World coordinates map cleanly via:
 *   uv = ((worldXZ - centerXZ) / size) + 0.5
 */
export function buildSeabedHeightTextureData(
  res: number,
  sampleGroundY: (x: number, z: number) => number,
  waterLevel: number
): Uint8Array {
  const data = new Uint8Array(res * res * 4);
  const { centerX, centerZ, size } = OCEAN_HEIGHTMAP_BOUNDS;

  for (let iz = 0; iz < res; iz++) {
    const vz = (iz + 0.5) / res - 0.5;
    const wz = centerZ + vz * size;
    for (let ix = 0; ix < res; ix++) {
      const ux = (ix + 0.5) / res - 0.5;
      const wx = centerX + ux * size;
      const relBedH = sampleGroundY(wx, wz) - waterLevel;
      const [hi, lo] = encodeSeabedHeight16(relBedH);
      const idx = (iz * res + ix) * 4;
      data[idx] = hi;
      data[idx + 1] = lo;
      data[idx + 2] = 0;
      data[idx + 3] = 255;
    }
  }

  return data;
}

export interface OceanDynamicParams {
  theme: OceanThemeSpec;
  amplitude: number;
  steepness: number;
  wavelength: number;
  spread: number;
  chop: number;
  sssIntensity: number;
  foamIntensity: number;
}

/**
 * Maps DREAMLINE's weather state & selected Ocean Basin theme into synchronized
 * Gerstner wave spectrum and optical shader uniforms.
 */
export function computeOceanWeatherParams(
  weather: WeatherType,
  themeId: OceanThemeId = 'bengal'
): OceanDynamicParams {
  const theme = OCEAN_THEMES[themeId] ?? OCEAN_THEMES.bengal;
  const profile = getWeatherProfile(weather);

  let ampMult = 1.0;
  let steepMult = 1.0;
  let chopMult = 1.0;
  let foamMult = 1.0;

  if (weather === 'tsunami') {
    ampMult = 2.55;
    steepMult = 1.25;
    chopMult = 1.75;
    foamMult = 1.85;
  } else if (weather === 'ferocious_rain' || weather === 'flood') {
    ampMult = 2.1;
    steepMult = 1.18;
    chopMult = 1.65;
    foamMult = 1.65;
  } else if (weather === 'thunderstorm') {
    ampMult = 1.85;
    steepMult = 1.14;
    chopMult = 1.5;
    foamMult = 1.5;
  } else if (weather === 'heavy_rain' || profile.isRainy) {
    ampMult = 1.42;
    steepMult = 1.08;
    chopMult = 1.28;
    foamMult = 1.28;
  } else if (weather === 'breeze') {
    ampMult = 1.18;
    steepMult = 1.04;
    chopMult = 1.15;
    foamMult = 1.12;
  } else if (weather === 'fog') {
    ampMult = 0.78;
    steepMult = 0.88;
    chopMult = 0.75;
    foamMult = 0.8;
  }

  return {
    theme,
    amplitude: theme.baseAmplitude * ampMult,
    steepness: Math.min(1.12, theme.baseSteepness * steepMult),
    wavelength: theme.baseWavelength,
    spread: theme.baseSpread,
    chop: Math.min(2.0, theme.baseChop * chopMult),
    sssIntensity: theme.baseSSSIntensity,
    foamIntensity: Math.min(2.0, theme.baseFoamIntensity * foamMult),
  };
}

export interface GerstnerSample {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  jacobian: number;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Evaluates the exact 8-Wave Gerstner trochoidal surface displacement, normal, and
 * Jacobian crest compression on the CPU (relative to still water Y = 0), matching
 * the GPU vertex shader so boats, Jet Skis, and swimming ride the true 3D swells.
 */
export function evaluateGerstnerOceanCPU(
  x: number,
  z: number,
  time: number,
  params: Pick<OceanDynamicParams, 'amplitude' | 'steepness' | 'wavelength' | 'spread'>,
  relBedH = -12.0
): GerstnerSample {
  let dx = 0;
  let dy = 0;
  let dz = 0;
  let dPdxX = 1;
  let dPdxY = 0;
  let dPdxZ = 0;
  let dPdzX = 0;
  let dPdzY = 0;
  let dPdzZ = 1;

  const waterDepth = Math.max(0.0, -relBedH);
  const shoalPeak = 1.0 + 0.42 * Math.exp(-Math.pow((waterDepth - 2.2) / 1.8, 2.0));
  const swashDamp = smoothstep(0.0, 0.85, waterDepth + 0.45);
  const depthAmpFactor = shoalPeak * swashDamp;

  const pwLen = Math.hypot(0.08, 0.99);
  const pwx = 0.08 / pwLen;
  const pwz = 0.99 / pwLen;

  for (let i = 0; i < OCEAN_WAVE_SPECTRUM.length; i++) {
    const w = OCEAN_WAVE_SPECTRUM[i];
    const rLen = Math.hypot(w.dir[0], w.dir[1]);
    const rx = w.dir[0] / rLen;
    const rz = w.dir[1] / rLen;

    const mx = pwx * (1 - params.spread) + rx * params.spread;
    const mz = pwz * (1 - params.spread) + rz * params.spread;
    const mLen = Math.hypot(mx, mz) || 1;
    const Dx = mx / mLen;
    const Dz = mz / mLen;

    const wl = Math.max(3.5, params.wavelength * w.relLen);
    const k = (2 * Math.PI) / wl;
    const omega = Math.sqrt(OCEAN_GRAVITY * k);
    const A = (wl / 28.0) * 0.4 * w.relAmp * params.amplitude * depthAmpFactor;

    const shoalSteep =
      params.steepness * (1.0 + 0.45 * smoothstep(6.0, 1.2, waterDepth));
    const Qi = Math.min(0.23, Math.max(0.0, (shoalSteep * 0.165) / (k * A + 0.0001)));

    const shallowPhaseDelay = k * Math.log(1.0 + Math.exp(-waterDepth * 0.38)) * 2.2;
    const theta = k * (Dx * x + Dz * z) - omega * time + w.phase - shallowPhaseDelay;
    const s = Math.sin(theta);
    const c = Math.cos(theta);

    dx -= Qi * A * Dx * s;
    dz -= Qi * A * Dz * s;
    dy += A * c;

    const kA = k * A;
    const QkA = Qi * kA;

    dPdxX -= QkA * Dx * Dx * c;
    dPdxZ -= QkA * Dx * Dz * c;
    dPdxY -= kA * Dx * s;

    dPdzX -= QkA * Dz * Dx * c;
    dPdzZ -= QkA * Dz * Dz * c;
    dPdzY -= kA * Dz * s;
  }

  // Tidal swash run-up surge near shoreline
  const swashSurge = 0.22 * params.amplitude * Math.sin(time * 1.45 - z * 0.08);
  dy += swashSurge * Math.exp(-Math.abs(waterDepth) * 0.45);

  // Analytical surface normal = normalize(cross(dPdz, dPdx))
  const nx = dPdzY * dPdxZ - dPdzZ * dPdxY;
  const ny = dPdzZ * dPdxX - dPdzX * dPdxZ;
  const nz = dPdzX * dPdxY - dPdzY * dPdxX;
  const nLen = Math.hypot(nx, ny, nz) || 1;

  return {
    x: x + dx,
    y: dy,
    z: z + dz,
    nx: nx / nLen,
    ny: ny / nLen,
    nz: nz / nLen,
    jacobian: dPdxX * dPdzZ - dPdxZ * dPdzX,
  };
}
