export interface PlayerLanternState {
  /** Whether the player's personal handheld lantern is currently lit. */
  isOn: boolean;
  /**
   * User override:
   * - `null`: auto-illuminates during dusk/evening/night or dark interiors (caves/tunnels)
   * - `true`: forced ON even during daytime
   * - `false`: forced OFF even at night
   */
  manualOverride: boolean | null;
  /** Smoothly damped light output 0..1. */
  brightness: number;
  /** Subtle deterministic flame flicker multiplier (~0.91..1.09). */
  flickerFactor: number;
  /** Pendulum sway pitch angle in radians (forward/back swing when walking). */
  swingAngleX: number;
  /** Pendulum sway roll angle in radians (sideways swing when turning). */
  swingAngleZ: number;
  /** Calibrated Three.js PointLight intensity. */
  effectiveIntensity: number;
  /** Calibrated Three.js PointLight distance in meters. */
  effectiveRange: number;
}

export interface StepPlayerLanternParams {
  dt: number;
  elapsed: number;
  worldLanternStrength: number;
  nightDarkness: number;
  inDarkInterior: boolean;
  playerSpeed: number;
  turnRate: number;
  /** True when player is inside an enclosed vehicle cabin where a handheld lantern is tucked away. */
  stowedInVehicle: boolean;
}

export function createInitialPlayerLanternState(): PlayerLanternState {
  return {
    isOn: false,
    manualOverride: null,
    brightness: 0,
    flickerFactor: 1,
    swingAngleX: 0,
    swingAngleZ: 0,
    effectiveIntensity: 0,
    effectiveRange: 24,
  };
}

/**
 * Toggles the player's personal handheld lantern ON or OFF, recording an explicit
 * manual override so the player has full control at any time of day or night.
 */
export function togglePlayerLantern(state: PlayerLanternState): PlayerLanternState {
  const nextOn = !state.isOn;
  return {
    ...state,
    isOn: nextOn,
    manualOverride: nextOn,
    brightness: nextOn ? 1.0 : 0,
    effectiveIntensity: nextOn ? 7.2 : 0,
  };
}

/**
 * Explicitly sets the player's lantern state (e.g., turning ON/OFF from UI or returning to auto).
 */
export function setPlayerLanternOverride(
  state: PlayerLanternState,
  override: boolean | null
): PlayerLanternState {
  return {
    ...state,
    manualOverride: override,
    isOn: override === null ? state.isOn : override,
  };
}

/**
 * Advances the player's handheld lantern physics, auto-night illumination,
 * organic candle/oil-lamp flicker, and dynamic light intensity.
 */
export function stepPlayerLantern(
  state: PlayerLanternState,
  params: StepPlayerLanternParams
): PlayerLanternState {
  const dt = Math.max(0.001, Math.min(0.1, params.dt));
  // Personal lantern appears automatically only at night (or dark underground tunnels/caves), staying stowed during daytime & sunset
  const autoShouldBeOn =
    params.inDarkInterior ||
    params.nightDarkness >= 0.25;

  const isOn =
    state.manualOverride !== null ? state.manualOverride : autoShouldBeOn;

  const targetBrightness = isOn && !params.stowedInVehicle ? 1.0 : 0.0;
  const dampFactor = 1 - Math.exp(-8.5 * dt);
  const brightness =
    state.brightness + (targetBrightness - state.brightness) * dampFactor;

  // Warm multi-harmonic oil-lantern wick flicker
  const flickerFactor =
    brightness > 0.01
      ? 1.0 +
        Math.sin(params.elapsed * 9.3) * 0.045 +
        Math.sin(params.elapsed * 17.7 + 1.1) * 0.028 +
        Math.cos(params.elapsed * 29.1) * 0.014
      : 1.0;

  // Pendulum lantern sway responding smoothly to walking cadence and cornering
  const speedClamped = Math.min(12, Math.max(0, params.playerSpeed));
  const targetSwingX =
    speedClamped > 0.15
      ? -Math.min(0.28, speedClamped * 0.026) +
        Math.sin(params.elapsed * (4.8 + speedClamped * 0.45)) *
          Math.min(0.14, speedClamped * 0.018)
      : Math.sin(params.elapsed * 1.45) * 0.025;

  const targetSwingZ = Math.max(
    -0.32,
    Math.min(0.32, -params.turnRate * 0.14 + Math.cos(params.elapsed * 1.8) * 0.02)
  );

  const swingDamp = 1 - Math.exp(-7.5 * dt);
  const swingAngleX =
    state.swingAngleX + (targetSwingX - state.swingAngleX) * swingDamp;
  const swingAngleZ =
    state.swingAngleZ + (targetSwingZ - state.swingAngleZ) * swingDamp;

  // Calibrated warm oil-lantern throw & intensity (rich warm amber without white blowout)
  const darkBoost = params.inDarkInterior
    ? 1.18
    : 0.8 + params.nightDarkness * 0.34 + params.worldLanternStrength * 0.1;

  const effectiveIntensity =
    brightness > 0.005 ? brightness * 7.2 * darkBoost * flickerFactor : 0;
  const effectiveRange = params.inDarkInterior
    ? 30
    : 22 + params.nightDarkness * 8;

  return {
    isOn,
    manualOverride: state.manualOverride,
    brightness,
    flickerFactor,
    swingAngleX,
    swingAngleZ,
    effectiveIntensity,
    effectiveRange,
  };
}
