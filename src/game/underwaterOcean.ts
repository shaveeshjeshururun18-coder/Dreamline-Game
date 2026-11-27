import { groundHeightAt, isOceanAt, WATER_LEVEL } from './terrain';

export interface UnderwaterAtmosphere {
  submerged: boolean;
  depthM: number; // positive meters below WATER_LEVEL (0 when above)
  submersionBlend: number; // 0 = dry air, 1 = fully underwater
  fogHex: number;
  fogR: number;
  fogG: number;
  fogB: number;
  fogDensity: number;
  ambientSkyHex: number;
  ambientGroundHex: number;
  sunIntensityScale: number; // Beer-Lambert absorption (1.0 surface -> 0.22 deep)
  causticsStrength: number; // 0..1 strong in sunlit shallows, fades with depth/night
  godRayStrength: number; // 0..1 volumetric sunlight shafts
  vignetteAlpha: number; // 0..0.55 subtle edge immersion tint
}

export type MarineCreatureKind =
  | 'tropical_fish'
  | 'manta_ray'
  | 'sea_turtle'
  | 'jellyfish'
  | 'reef_shark'
  | 'whale';

export interface MarineCreatureActor {
  id: string;
  kind: MarineCreatureKind;
  name: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  speed: number;
  orbitCenterX: number;
  orbitCenterZ: number;
  orbitRadius: number;
  baseDepthM: number; // target meters below WATER_LEVEL
  phase: number;
  scale: number;
  colorHex: number;
  accentHex: number;
  schoolId: number;
  fleeTimer: number;
}

export interface OceanReefZone {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  kind: 'coral_garden' | 'kelp_cathedral' | 'sunken_galleon' | 'deep_trench';
}

export const OCEAN_REEF_ZONES: readonly OceanReefZone[] = [
  {
    id: 'kadalkarai_coral_garden',
    name: 'Kadalkarai Coral Garden',
    x: 136,
    z: 66,
    radius: 26,
    kind: 'coral_garden',
  },
  {
    id: 'emerald_kelp_cathedral',
    name: 'Emerald Kelp Cathedral',
    x: 152,
    z: 98,
    radius: 28,
    kind: 'kelp_cathedral',
  },
  {
    id: 'sunken_galleon_reef',
    name: 'Sunken Galleon Reef',
    x: 162,
    z: 126,
    radius: 24,
    kind: 'sunken_galleon',
  },
  {
    id: 'azure_canyon_reef',
    name: 'Azure Coral Canyon',
    x: 146,
    z: 158,
    radius: 26,
    kind: 'coral_garden',
  },
  {
    id: 'leviathan_deep_trench',
    name: 'Leviathan Deep Trench',
    x: 214,
    z: 118,
    radius: 38,
    kind: 'deep_trench',
  },
];

export const SUNKEN_GALLEON_POS = { x: 162, z: 126, heading: 0.65 } as const;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToHex(r: number, g: number, b: number): number {
  const ri = clamp(Math.round(r * 255), 0, 255);
  const gi = clamp(Math.round(g * 255), 0, 255);
  const bi = clamp(Math.round(b * 255), 0, 255);
  return (ri << 16) | (gi << 8) | bi;
}

/**
 * Computes physically motivated Beer-Lambert underwater ocean atmosphere,
 * color absorption, fog density, caustics intensity, and god-ray visibility.
 */
export function computeUnderwaterAtmosphere(
  cameraY: number,
  inOceanWater: boolean,
  nightDarkness: number,
  waterLevel = WATER_LEVEL
): UnderwaterAtmosphere {
  const rawDepth = waterLevel - cameraY;
  const submerged = inOceanWater && rawDepth > 0.04;
  if (!submerged) {
    return {
      submerged: false,
      depthM: 0,
      submersionBlend: 0,
      fogHex: 0x0a5d75,
      fogR: 0.04,
      fogG: 0.36,
      fogB: 0.46,
      fogDensity: 0.004,
      ambientSkyHex: 0x38bdf8,
      ambientGroundHex: 0x072d44,
      sunIntensityScale: 1.0,
      causticsStrength: 0,
      godRayStrength: 0,
      vignetteAlpha: 0,
    };
  }

  const depthM = Math.max(0, rawDepth);
  const submersionBlend = clamp(depthM / 0.65, 0, 1);
  const depthT = clamp(depthM / 15.0, 0, 1);
  const dayFactor = clamp(1 - nightDarkness * 0.82, 0.16, 1.0);

  // Shallow tropical turquoise -> mid cerulean -> deep abyssal ocean cobalt
  const shallowR = 0.035;
  const shallowG = 0.36;
  const shallowB = 0.48;
  const midR = 0.022;
  const midG = 0.22;
  const midB = 0.38;
  const deepR = 0.012;
  const deepG = 0.1;
  const deepB = 0.22;

  let fogR: number;
  let fogG: number;
  let fogB: number;
  if (depthT < 0.45) {
    const u = depthT / 0.45;
    fogR = lerp(shallowR, midR, u) * dayFactor;
    fogG = lerp(shallowG, midG, u) * dayFactor;
    fogB = lerp(shallowB, midB, u) * dayFactor;
  } else {
    const u = (depthT - 0.45) / 0.55;
    fogR = lerp(midR, deepR, u) * dayFactor;
    fogG = lerp(midG, deepG, u) * dayFactor;
    fogB = lerp(midB, deepB, u) * dayFactor;
  }

  // Visible crystal-clear tropical reef visibility (~35-55m) tightening gently in the abyss
  const fogDensity = lerp(0.0175, 0.031, depthT) * lerp(1.0, 1.18, nightDarkness);
  const sunIntensityScale = Math.exp(-depthM * 0.095) * dayFactor;
  const causticsStrength = clamp((1 - depthT * 0.72) * dayFactor, 0.08, 1.0);
  const godRayStrength = clamp((1 - depthT * 0.58) * dayFactor, 0.06, 0.95);
  const vignetteAlpha = clamp(0.18 + depthT * 0.26, 0.16, 0.46) * submersionBlend;

  return {
    submerged: true,
    depthM,
    submersionBlend,
    fogHex: rgbToHex(fogR, fogG, fogB),
    fogR,
    fogG,
    fogB,
    fogDensity,
    ambientSkyHex: rgbToHex(
      lerp(0.14, 0.04, depthT) * dayFactor,
      lerp(0.68, 0.26, depthT) * dayFactor,
      lerp(0.78, 0.46, depthT) * dayFactor
    ),
    ambientGroundHex: rgbToHex(
      0.02 * dayFactor,
      lerp(0.16, 0.07, depthT) * dayFactor,
      lerp(0.24, 0.14, depthT) * dayFactor
    ),
    sunIntensityScale,
    causticsStrength,
    godRayStrength,
    vignetteAlpha,
  };
}

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Spawns a rich, ecologically distributed 3D underwater marine ecosystem across Kadalkarai Ocean.
 */
export function createMarineLifeActors(): MarineCreatureActor[] {
  const rand = seededRand(20261124);
  const actors: MarineCreatureActor[] = [];

  // 1. 3 Vibrant Tropical Fish Schools (48 fish total) orbiting near reefs & Submarine dive zone
  const schoolConfigs = [
    { cx: 136, cz: 66, r: 9.5, depth: 3.4, color: 0xfacc15, accent: 0x0f172a, name: 'Golden Reef Tang' },
    { cx: 150, cz: 94, r: 11.5, depth: 5.2, color: 0x38bdf8, accent: 0x1d4ed8, name: 'Royal Blue Damselfish' },
    { cx: 162, cz: 124, r: 10.0, depth: 6.4, color: 0xf97316, accent: 0xffffff, name: 'Coral Clownfish' },
  ];
  schoolConfigs.forEach((sc, sIdx) => {
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + rand() * 0.4;
      const rad = sc.r * (0.45 + rand() * 0.72);
      const x = sc.cx + Math.cos(ang) * rad;
      const z = sc.cz + Math.sin(ang) * rad;
      const d = sc.depth + (rand() - 0.5) * 2.2;
      actors.push({
        id: `fish_${sIdx}_${i}`,
        kind: 'tropical_fish',
        name: sc.name,
        x,
        y: WATER_LEVEL - d,
        z,
        heading: ang + Math.PI * 0.5,
        pitch: 0,
        speed: 2.2 + rand() * 1.4,
        orbitCenterX: sc.cx,
        orbitCenterZ: sc.cz,
        orbitRadius: rad,
        baseDepthM: d,
        phase: rand() * Math.PI * 2,
        scale: 0.78 + rand() * 0.52,
        colorHex: sc.color,
        accentHex: sc.accent,
        schoolId: sIdx,
        fleeTimer: 0,
      });
    }
  });

  // 2. 6 Graceful Gliding Manta Rays across mid-water reefs
  const mantaCenters: Array<[number, number, number, number]> = [
    [138, 72, 16, 4.6],
    [154, 102, 20, 6.2],
    [164, 130, 18, 7.0],
    [146, 156, 19, 5.5],
    [194, 114, 24, 8.0],
    [176, 84, 18, 5.8],
  ];
  mantaCenters.forEach(([cx, cz, r, depth], i) => {
    const ang = (i / mantaCenters.length) * Math.PI * 2;
    actors.push({
      id: `manta_${i}`,
      kind: 'manta_ray',
      name: 'Oceanic Manta Ray',
      x: cx + Math.cos(ang) * r,
      y: WATER_LEVEL - depth,
      z: cz + Math.sin(ang) * r,
      heading: ang + Math.PI * 0.5,
      pitch: 0,
      speed: 2.8 + (i % 3) * 0.45,
      orbitCenterX: cx,
      orbitCenterZ: cz,
      orbitRadius: r,
      baseDepthM: depth,
      phase: i * 1.15,
      scale: 0.95 + (i % 3) * 0.22,
      colorHex: 0x1e293b,
      accentHex: 0xdbeafe,
      schoolId: -1,
      fleeTimer: 0,
    });
  });

  // 3. 5 Green Sea Turtles swimming peacefully over coral gardens
  const turtleCenters: Array<[number, number, number, number]> = [
    [132, 62, 12, 3.0],
    [144, 84, 14, 4.2],
    [158, 122, 13, 5.4],
    [148, 152, 15, 4.0],
    [172, 106, 14, 4.8],
  ];
  turtleCenters.forEach(([cx, cz, r, depth], i) => {
    const ang = i * 1.3;
    actors.push({
      id: `turtle_${i}`,
      kind: 'sea_turtle',
      name: 'Green Sea Turtle',
      x: cx + Math.cos(ang) * r,
      y: WATER_LEVEL - depth,
      z: cz + Math.sin(ang) * r,
      heading: ang + Math.PI * 0.5,
      pitch: 0,
      speed: 1.55 + (i % 2) * 0.35,
      orbitCenterX: cx,
      orbitCenterZ: cz,
      orbitRadius: r,
      baseDepthM: depth,
      phase: i * 1.6,
      scale: 0.9 + (i % 3) * 0.16,
      colorHex: 0x3f6212,
      accentHex: 0xa3b18a,
      schoolId: -1,
      fleeTimer: 0,
    });
  });

  // 4. 14 Bioluminescent Jellyfish drifting gently in twilight/deep ocean layers
  const jellyColors = [0x38bdf8, 0xc084fc, 0x2dd4bf, 0xf472b6];
  for (let i = 0; i < 14; i++) {
    const zone = OCEAN_REEF_ZONES[i % OCEAN_REEF_ZONES.length];
    const ang = rand() * Math.PI * 2;
    const dist = 6 + rand() * 18;
    const depth = 5.5 + rand() * 6.5;
    actors.push({
      id: `jelly_${i}`,
      kind: 'jellyfish',
      name: 'Bioluminescent Moon Jelly',
      x: zone.x + Math.cos(ang) * dist,
      y: WATER_LEVEL - depth,
      z: zone.z + Math.sin(ang) * dist,
      heading: rand() * Math.PI * 2,
      pitch: 0,
      speed: 0.35 + rand() * 0.25,
      orbitCenterX: zone.x,
      orbitCenterZ: zone.z,
      orbitRadius: dist,
      baseDepthM: depth,
      phase: rand() * Math.PI * 2,
      scale: 0.8 + rand() * 0.55,
      colorHex: jellyColors[i % jellyColors.length],
      accentHex: 0xe0f2fe,
      schoolId: -1,
      fleeTimer: 0,
    });
  }

  // 5. 4 Sleek Reef Sharks patrolling deeper reef canyon rims
  const sharkCenters: Array<[number, number, number, number]> = [
    [166, 108, 22, 8.2],
    [186, 134, 24, 9.5],
    [154, 168, 22, 8.6],
    [206, 100, 26, 10.2],
  ];
  sharkCenters.forEach(([cx, cz, r, depth], i) => {
    const ang = i * 1.57;
    actors.push({
      id: `shark_${i}`,
      kind: 'reef_shark',
      name: 'Blacktip Reef Shark',
      x: cx + Math.cos(ang) * r,
      y: WATER_LEVEL - depth,
      z: cz + Math.sin(ang) * r,
      heading: ang + Math.PI * 0.5,
      pitch: 0,
      speed: 4.2 + (i % 2) * 0.7,
      orbitCenterX: cx,
      orbitCenterZ: cz,
      orbitRadius: r,
      baseDepthM: depth,
      phase: i * 0.9,
      scale: 1.0 + (i % 2) * 0.18,
      colorHex: 0x475569,
      accentHex: 0xe2e8f0,
      schoolId: -1,
      fleeTimer: 0,
    });
  });

  // 6. 2 Majestic Deep-Ocean Humpback Whales cruising slowly through the deep offshore trench
  const whaleSpecs: Array<[number, number, number, number]> = [
    [212, 118, 34, 9.8],
    [188, 178, 32, 10.5],
  ];
  whaleSpecs.forEach(([cx, cz, r, depth], i) => {
    const ang = i * Math.PI;
    actors.push({
      id: `whale_${i}`,
      kind: 'whale',
      name: 'Blue Humpback Whale',
      x: cx + Math.cos(ang) * r,
      y: WATER_LEVEL - depth,
      z: cz + Math.sin(ang) * r,
      heading: ang + Math.PI * 0.5,
      pitch: 0,
      speed: 2.3 + i * 0.35,
      orbitCenterX: cx,
      orbitCenterZ: cz,
      orbitRadius: r,
      baseDepthM: depth,
      phase: i * 2.1,
      scale: 1.15 - i * 0.15,
      colorHex: 0x1e3a5f,
      accentHex: 0x94a3b8,
      schoolId: -1,
      fleeTimer: 0,
    });
  });

  return actors;
}

/**
 * Advances all underwater marine creatures smoothly in-place with zero per-frame allocations,
 * keeping every creature safely between the ocean surface and seabed while reacting to the Submarine.
 */
export function stepMarineLifeActors(
  actors: MarineCreatureActor[],
  dt: number,
  elapsed: number,
  subX: number,
  subY: number,
  subZ: number,
  subActive: boolean
): void {
  const safeDt = Math.min(0.08, Math.max(0.001, dt));
  for (let i = 0; i < actors.length; i++) {
    const a = actors[i];
    const angularVel = a.speed / Math.max(6, a.orbitRadius);
    const orbitAngle = elapsed * angularVel + a.phase;

    if (a.kind === 'jellyfish') {
      // Gentle vertical pulsing drift
      const driftX = a.orbitCenterX + Math.cos(orbitAngle * 0.35) * a.orbitRadius;
      const driftZ = a.orbitCenterZ + Math.sin(orbitAngle * 0.35) * a.orbitRadius;
      const pulseY = Math.sin(elapsed * 1.45 + a.phase) * 0.95;
      a.x += (driftX - a.x) * Math.min(1, safeDt * 1.2);
      a.z += (driftZ - a.z) * Math.min(1, safeDt * 1.2);
      const floorY = groundHeightAt(a.x, a.z) + 1.8;
      a.y = clamp(WATER_LEVEL - a.baseDepthM + pulseY, floorY, WATER_LEVEL - 1.5);
      a.heading = orbitAngle * 0.2;
      continue;
    }

    // Subtle school darting / avoidance if submarine approaches small fish closely
    let speedMul = 1.0;
    let radialBoost = 0;
    if (subActive && a.kind === 'tropical_fish') {
      const dx = a.x - subX;
      const dy = a.y - subY;
      const dz = a.z - subZ;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < 64) {
        a.fleeTimer = 1.6;
      }
    }
    if (a.fleeTimer > 0) {
      a.fleeTimer = Math.max(0, a.fleeTimer - safeDt);
      speedMul = 2.15;
      radialBoost = 3.5;
    }

    const r = a.orbitRadius + radialBoost + Math.sin(elapsed * 0.55 + a.phase) * 1.6;
    const targetX = a.orbitCenterX + Math.cos(orbitAngle) * r;
    const targetZ = a.orbitCenterZ + Math.sin(orbitAngle) * r;
    const bobAmp = a.kind === 'whale' ? 1.4 : a.kind === 'manta_ray' ? 1.1 : 0.65;
    const targetDepth = a.baseDepthM + Math.sin(elapsed * 0.72 + a.phase * 1.7) * bobAmp;

    const dx = targetX - a.x;
    const dz = targetZ - a.z;
    const followRate = Math.min(1, safeDt * (a.kind === 'tropical_fish' ? 3.4 : 1.8) * speedMul);
    const nextX = a.x + dx * followRate;
    const nextZ = a.z + dz * followRate;

    // Keep strictly in open ocean water
    if (isOceanAt(nextX, nextZ)) {
      const moveX = nextX - a.x;
      const moveZ = nextZ - a.z;
      if (moveX * moveX + moveZ * moveZ > 1e-6) {
        a.heading = Math.atan2(moveX, moveZ);
      }
      a.x = nextX;
      a.z = nextZ;
    }

    const seabedY = groundHeightAt(a.x, a.z);
    const minY = seabedY + (a.kind === 'whale' ? 3.8 : 1.6);
    const maxY = WATER_LEVEL - (a.kind === 'whale' ? 3.2 : 1.2);
    const desiredY = clamp(WATER_LEVEL - targetDepth, minY, Math.max(minY, maxY));
    const dy = desiredY - a.y;
    a.y += dy * Math.min(1, safeDt * 2.2);
    a.pitch = clamp(dy * 0.18, -0.35, 0.35);
  }
}
