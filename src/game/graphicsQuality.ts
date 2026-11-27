import type { GraphicsQuality } from './types';

export interface GraphicsQualityProfile {
  quality: GraphicsQuality;
  pixelRatio: number;
  minDynamicDpr: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  shadowFrustumHalf: number;
  shadowUpdateInterval: number;
  softShadows: boolean;
  bloomEnabled: boolean;
  bloomBaseStrength: number;
  bloomNightStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  msaaSamples: number;
  maxAnisotropy: number;
  envIntensityBoost: number;
  rimLightIntensity: number;
  toneMappingExposureBase: number;
}

export function resolveGraphicsProfile(params: {
  quality: GraphicsQuality;
  isSoftwareGl: boolean;
  devicePixelRatio: number;
  resolutionScale: number;
  dynamicDprScale: number;
}): GraphicsQualityProfile {
  const { quality, isSoftwareGl, devicePixelRatio, resolutionScale, dynamicDprScale } = params;
  const safeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const safeRes = Math.min(1.25, Math.max(0.6, resolutionScale || 1));
  const safeDyn = Math.min(1.0, Math.max(0.68, dynamicDprScale || 1));

  if (quality === 'low') {
    const targetDpr = isSoftwareGl
      ? 0.9
      : Math.max(0.65, Math.min(safeDpr, 1.0) * safeRes * 0.88 * safeDyn);
    return {
      quality,
      pixelRatio: targetDpr,
      minDynamicDpr: 0.72,
      shadowsEnabled: false,
      shadowMapSize: 512,
      shadowFrustumHalf: 34,
      shadowUpdateInterval: 3,
      softShadows: false,
      bloomEnabled: false,
      bloomBaseStrength: 0,
      bloomNightStrength: 0,
      bloomThreshold: 1.32,
      bloomRadius: 0.32,
      msaaSamples: 0,
      maxAnisotropy: 4,
      envIntensityBoost: 0.22,
      rimLightIntensity: 0.05,
      toneMappingExposureBase: 0.78,
    };
  }

  if (quality === 'medium') {
    const targetDpr = isSoftwareGl
      ? 1.0
      : Math.max(0.8, Math.min(safeDpr, 1.35) * safeRes * safeDyn);
    return {
      quality,
      pixelRatio: targetDpr,
      minDynamicDpr: 0.8,
      shadowsEnabled: !isSoftwareGl,
      shadowMapSize: 1024,
      shadowFrustumHalf: 38,
      shadowUpdateInterval: 2,
      softShadows: true,
      bloomEnabled: false,
      bloomBaseStrength: 0,
      bloomNightStrength: 0,
      bloomThreshold: 1.30,
      bloomRadius: 0.34,
      msaaSamples: 0,
      maxAnisotropy: 8,
      envIntensityBoost: 0.24,
      rimLightIntensity: 0.07,
      toneMappingExposureBase: 0.79,
    };
  }

  if (quality === 'high') {
    const targetDpr = isSoftwareGl
      ? 1.0
      : Math.max(0.95, Math.min(safeDpr, 1.75) * safeRes * safeDyn);
    return {
      quality,
      pixelRatio: targetDpr,
      minDynamicDpr: 0.88,
      shadowsEnabled: !isSoftwareGl,
      shadowMapSize: 1536,
      shadowFrustumHalf: 40,
      shadowUpdateInterval: 2,
      softShadows: true,
      bloomEnabled: !isSoftwareGl,
      bloomBaseStrength: 0.03,
      bloomNightStrength: 0.12,
      bloomThreshold: 1.30,
      bloomRadius: 0.36,
      msaaSamples: 4,
      maxAnisotropy: 16,
      envIntensityBoost: 0.25,
      rimLightIntensity: 0.08,
      toneMappingExposureBase: 0.80,
    };
  }

  // Ultra quality: Full Retina 2.0x DPR, 2048px PCFSoftShadowMap every frame, MSAA 4x + Subtle Night Bloom, 16x Anisotropy
  const targetDpr = isSoftwareGl
    ? 1.0
    : Math.max(1.0, Math.min(safeDpr, 2.0) * safeRes * safeDyn);
  return {
    quality: 'ultra',
    pixelRatio: targetDpr,
    minDynamicDpr: 0.94,
    shadowsEnabled: !isSoftwareGl,
    shadowMapSize: 2048,
    shadowFrustumHalf: 42,
    shadowUpdateInterval: 1,
    softShadows: true,
    bloomEnabled: !isSoftwareGl,
    bloomBaseStrength: 0.04,
    bloomNightStrength: 0.15,
    bloomThreshold: 1.28,
    bloomRadius: 0.38,
    msaaSamples: 4,
    maxAnisotropy: 16,
    envIntensityBoost: 0.26,
    rimLightIntensity: 0.10,
    toneMappingExposureBase: 0.81,
  };
}

/**
 * Computes time-of-day aware bloom strength so daytime stays crisp & natural
 * while sunset, twilight, lanterns, train headlights, and hero suit pods glow cinematically.
 */
export function computeDynamicBloomStrength(
  profile: GraphicsQualityProfile,
  nightDarkness: number,
  inInteriorVaultOrMetro: boolean
): number {
  if (!profile.bloomEnabled) return 0;
  if (inInteriorVaultOrMetro) {
    return profile.bloomBaseStrength * 1.35;
  }
  const t = Math.min(1, Math.max(0, nightDarkness));
  return profile.bloomBaseStrength + (profile.bloomNightStrength - profile.bloomBaseStrength) * t;
}
