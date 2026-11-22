import type { IcelandState, SizeMode } from './types';
import { getRegionAt } from './terrain';

/**
 * Mandatory Scale Hierarchy inside DREAMLINE's Iceland Region (Panimalai Iceland):
 * - Normal / Small Player (1.68 m, scale = 1.0) — available EVERYWHERE including inside Panimalai Iceland!
 * - Colossal Giant Igloo Man (inside Iceland): 18.0 m (more than 10x normal player!)
 * - Giant Player (23.5 m, scale = 14.0x) — auto in Iceland, or locked Giant/Small anywhere on demand!
 */
export const NORMAL_PLAYER_HEIGHT_M = 1.68;
export const GIANT_IGLOO_MAN_HEIGHT_M = 18.0;
export const ICELAND_GIANT_SCALE = 14.0; // 1.68 * 14.0 = 23.52 m > 18.0 m!
export const GIANT_PLAYER_HEIGHT_M = Number((NORMAL_PLAYER_HEIGHT_M * ICELAND_GIANT_SCALE).toFixed(1));

export const GIANT_IGLOO_MAN_POS = { x: -72, z: -96 };
export const ICELAND_ARRIVAL_POS = { x: -90, z: -68 };
export const ICELAND_RETURN_GATE_POS = { x: -64, z: -56 };

/**
 * Single source of truth for whether a world coordinate is inside Iceland.
 * Integrated seamlessly within the existing northwest alpine snow biome without expanding map size.
 */
export function isInIceland(x: number, z: number): boolean {
  return getRegionAt(x, z) === 'snow';
}

export function createIcelandState(
  x: number,
  z: number,
  greetedIglooMan = false,
  stayGiantOrMode: boolean | SizeMode = false,
  sizeMode?: SizeMode
): IcelandState {
  const resolvedMode: SizeMode =
    sizeMode ??
    (typeof stayGiantOrMode === 'string'
      ? stayGiantOrMode
      : stayGiantOrMode
      ? 'giant'
      : 'auto');
  const inIceland = isInIceland(x, z);
  const shouldBeGiant = resolvedMode === 'giant' || (resolvedMode === 'auto' && inIceland);
  const scale = shouldBeGiant ? ICELAND_GIANT_SCALE : 1.0;
  return {
    inIceland,
    playerScale: scale,
    targetScale: scale,
    playerHeightMeters: shouldBeGiant
      ? Number((NORMAL_PLAYER_HEIGHT_M * scale).toFixed(1))
      : NORMAL_PLAYER_HEIGHT_M,
    iglooManHeightMeters: GIANT_IGLOO_MAN_HEIGHT_M,
    isGiant: shouldBeGiant,
    stayGiantThroughout: resolvedMode === 'giant',
    sizeMode: resolvedMode,
    transformProgress: shouldBeGiant ? 1 : 0,
    greetedIglooMan,
  };
}

/**
 * Smoothly interpolates player scale according to `sizeMode`:
 * - `'auto'`: grows to Giant (23.5m) inside Panimalai Iceland, Small (1.68m) outside
 * - `'giant'`: stays Giant (23.5m) everywhere without changing
 * - `'small'`: stays Small (1.68m) everywhere — including right beside the 18m Giant Igloo Man in Panimalai Iceland!
 */
export function stepIcelandState(
  prev: IcelandState,
  x: number,
  z: number,
  dt: number
): IcelandState {
  const clampedDt = Math.min(Math.max(dt, 0), 0.1);
  const inIceland = isInIceland(x, z);
  const resolvedMode: SizeMode =
    prev.sizeMode ?? (prev.stayGiantThroughout ? 'giant' : 'auto');
  const shouldBeGiant =
    resolvedMode === 'giant' ||
    (resolvedMode === 'auto' && (prev.stayGiantThroughout || inIceland));
  const targetScale = shouldBeGiant ? ICELAND_GIANT_SCALE : 1.0;

  let nextScale = prev.playerScale;
  const blend = 1 - Math.exp(-3.4 * clampedDt);
  nextScale += (targetScale - nextScale) * blend;
  if (Math.abs(targetScale - nextScale) < 0.025) {
    nextScale = targetScale;
  }

  const transformProgress = Math.max(
    0,
    Math.min(1, (nextScale - 1.0) / (ICELAND_GIANT_SCALE - 1.0))
  );

  return {
    inIceland,
    playerScale: nextScale,
    targetScale,
    playerHeightMeters:
      Math.abs(nextScale - 1.0) < 0.02
        ? NORMAL_PLAYER_HEIGHT_M
        : Number((NORMAL_PLAYER_HEIGHT_M * nextScale).toFixed(1)),
    iglooManHeightMeters: GIANT_IGLOO_MAN_HEIGHT_M,
    isGiant: nextScale > 1.5,
    stayGiantThroughout: resolvedMode === 'giant' || prev.stayGiantThroughout,
    sizeMode: resolvedMode,
    transformProgress,
    greetedIglooMan: prev.greetedIglooMan,
  };
}

export interface ScaleGameplayMetrics {
  collisionRadius: number;
  moveSpeedMultiplier: number;
  cameraDistanceMultiplier: number;
  cameraFocusHeight: number;
  cameraGroundClearance: number;
  interactionRadiusBonus: number;
  strideFrequencyDivisor: number;
  footstepPitchMultiplier: number;
  cameraFovBonus: number;
}

/**
 * Scale-aware gameplay metrics so colossal 23.5m Giant Form feels majestic, grounded,
 * and frames both the Giant Player and 18.0m Giant Igloo Man cleanly across the whole world.
 */
export function getScaleGameplayMetrics(
  scale: number,
  isSitting: boolean,
  onBicycle: boolean
): ScaleGameplayMetrics {
  const t = Math.max(0, Math.min(1, (scale - 1.0) / (ICELAND_GIANT_SCALE - 1.0)));
  // Keep collision radius grounded yet nimble enough to roam all 5 regions when Stay Giant is ON
  const collisionRadius = (onBicycle ? 0.52 : 0.42) + t * 1.45;
  const moveSpeedMultiplier = 1.0 + t * 2.25; // Majestic sweeping giant stride (~3.25x speed)
  const cameraDistanceMultiplier = 1.0 + t * 6.8; // Pulls camera smoothly back to frame 23.5m Giant + 18.0m Igloo Man!
  const baseFocus = isSitting ? 1.15 : onBicycle ? 1.7 : 1.55;
  const cameraFocusHeight = baseFocus * (1.0 + t * 9.8);
  const cameraGroundClearance = 0.65 + t * 3.8;
  const interactionRadiusBonus = t * 16.0;
  const strideFrequencyDivisor = Math.sqrt(Math.max(1, scale));
  const footstepPitchMultiplier = 1.0 - t * 0.62; // Deep resonant giant footsteps
  const cameraFovBonus = t * 9.5;

  return {
    collisionRadius,
    moveSpeedMultiplier,
    cameraDistanceMultiplier,
    cameraFocusHeight,
    cameraGroundClearance,
    interactionRadiusBonus,
    strideFrequencyDivisor,
    footstepPitchMultiplier,
    cameraFovBonus,
  };
}
