export interface LookToFlyOptions {
  /** Neutral chase camera pitch (radians) where the pilot flies level. Default ~0.18 rad. */
  neutralPitch?: number;
  /** Half-width deadzone around neutralPitch (radians) so level cruising stays rock-steady. */
  deadzone?: number;
  /** Maximum climb speed (m/s) when looking steeply skyward at full forward thrust. */
  maxClimbRate?: number;
  /** Maximum dive speed (m/s) when looking steeply earthward at full forward thrust. */
  maxDiveRate?: number;
  /** Minimum forward input magnitude required before camera pitch drives climb/dive. */
  minForwardThreshold?: number;
}

export interface LookToFlyResult {
  /** Signed vertical velocity target (m/s): positive = climb up, negative = dive down, 0 = level. */
  verticalRate: number;
  /** Normalized signed pitch command in [-1, 1]: +1 = full skyward climb, -1 = full earthward dive. */
  normalizedPitch: number;
  /** True when camera pitch is actively driving climb or dive without manual Up/Down buttons. */
  active: boolean;
}

/**
 * Pure camera-directed 3D flight ("Look-to-Fly") vertical rate helper used across
 * Superheroes and ALL flying craft (Hoverboard Glider, VTOL, Orange Helicopter, Sky Explorer, Airliner).
 *
 * Camera sign convention in DreamlineEngine:
 *   camY = targetY + Math.sin(camPitch) * dist + lift
 *   - Looking UP into the sky  => camPitch decreases below neutralPitch (negative)  => climb UP (+vy)
 *   - Looking DOWN at ground   => camPitch increases above neutralPitch (positive)  => dive DOWN (-vy)
 *   - Looking level (deadzone) => verticalRate = 0 (rock-steady level cruise)
 */
export function computeLookToFlyVerticalRate(
  camPitch: number | undefined,
  forwardInput: number,
  options: LookToFlyOptions = {}
): LookToFlyResult {
  if (typeof camPitch !== 'number' || !Number.isFinite(camPitch)) {
    return { verticalRate: 0, normalizedPitch: 0, active: false };
  }

  const neutralPitch = options.neutralPitch ?? 0.18;
  const deadzone = options.deadzone ?? 0.085;
  const maxClimbRate = options.maxClimbRate ?? 18.5;
  const maxDiveRate = options.maxDiveRate ?? 17.5;
  const minForwardThreshold = options.minForwardThreshold ?? 0.08;

  const fwdMag = Math.max(0, Math.min(1, forwardInput));
  if (fwdMag < minForwardThreshold) {
    return { verticalRate: 0, normalizedPitch: 0, active: false };
  }

  // Positive delta = looking UP into the sky; Negative delta = looking DOWN toward the ground
  const lookUpDelta = neutralPitch - camPitch;
  if (Math.abs(lookUpDelta) <= deadzone) {
    return { verticalRate: 0, normalizedPitch: 0, active: false };
  }

  const signedExcess = lookUpDelta > 0 ? lookUpDelta - deadzone : lookUpDelta + deadzone;
  const fullRange = 0.52;
  const normalizedPitch = Math.max(-1, Math.min(1, signedExcess / fullRange));
  // Gentle quadratic-blended curve for fine control near level and snappy climb/dive at steep angles
  const shaped =
    Math.sign(normalizedPitch) *
    (0.45 * Math.abs(normalizedPitch) + 0.55 * normalizedPitch * normalizedPitch);
  const verticalRate = shaped * (shaped >= 0 ? maxClimbRate : maxDiveRate) * fwdMag;

  return {
    verticalRate,
    normalizedPitch,
    active: Math.abs(verticalRate) > 0.05,
  };
}
