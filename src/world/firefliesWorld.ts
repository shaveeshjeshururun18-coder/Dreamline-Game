import * as THREE from 'three';
import type { WeatherType } from '../game/types';
import { computeFireflyVisibility, generateFireflySeeds } from '../game/fireflies';

export interface FirefliesWorldSystem {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    pixelRatio: number
  ) => void;
  snapVisibility: (timeHours: number, weather: WeatherType) => void;
  getCurrentVisibility: () => number;
  dispose: () => void;
}

const FIREFLY_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uVisibility;

  attribute float aPhase;
  attribute float aSpeed;
  attribute vec2 aRadius;
  attribute float aSize;
  attribute float aBlinkRate;
  attribute float aWarmth;

  varying float vGlow;
  varying float vWarmth;
  varying float vDistanceFade;

  void main() {
    float t = uTime * aSpeed + aPhase;

    // Gentle organic figure-8 / Lissajous forest wander around each firefly's anchor
    vec3 displaced = position;
    displaced.x += sin(t * 1.07 + aPhase * 1.3) * aRadius.x + cos(t * 0.43) * aRadius.x * 0.35;
    displaced.z += cos(t * 0.89 + aPhase * 0.7) * aRadius.x + sin(t * 0.51) * aRadius.x * 0.35;
    displaced.y += sin(t * 1.31 + aPhase * 2.1) * aRadius.y + cos(t * 0.62) * aRadius.y * 0.28;

    // Authentic asynchronous bioluminescent pulse: luminous flash, gentle hold, warm resting ember
    float wave = sin(uTime * aBlinkRate + aPhase * 5.13) * 0.5 + 0.5;
    float pulse = pow(wave, 1.85);
    float secondaryFlutter = 0.90 + 0.10 * sin(uTime * 4.5 + aPhase * 11.0);
    vGlow = (0.28 + 0.72 * pulse) * secondaryFlutter;
    vWarmth = aWarmth;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    float dist = max(1.0, -mvPosition.z);

    // Smooth atmospheric fade beyond 105m so distant forests blend naturally
    vDistanceFade = 1.0 - smoothstep(72.0, 124.0, dist);

    float pointSize = aSize * uPixelRatio * (350.0 / dist) * (0.68 + 0.52 * vGlow);
    gl_PointSize = clamp(pointSize * (0.55 + 0.45 * uVisibility), 5.0, 58.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FIREFLY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uVisibility;

  varying float vGlow;
  varying float vWarmth;
  varying float vDistanceFade;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float d = length(centered);
    if (d > 0.5) discard;

    // Hot luminous white-gold bioluminescent core + lush chartreuse/honey aura + soft bloom halo
    float core = exp(-d * d * 26.0);
    float innerAura = exp(-d * d * 7.8);
    float outerHalo = pow(max(0.0, 1.0 - d * 2.0), 1.9) * 0.55;

    vec3 limeTint = vec3(0.76, 1.0, 0.28);   // Natural Photinus firefly chartreuse-lime
    vec3 goldTint = vec3(1.0, 0.87, 0.34);   // Warm Makoto Shinkai twilight honey-gold
    vec3 coreWhite = vec3(1.0, 1.0, 0.86);   // Bright bioluminescent center

    vec3 bodyColor = mix(limeTint, goldTint, vWarmth);
    vec3 finalColor = mix(bodyColor, coreWhite, clamp(core * 0.88, 0.0, 1.0));

    float intensity = (core * 1.25 + innerAura * 0.88 + outerHalo) * vGlow * vDistanceFade * uVisibility;
    if (intensity < 0.004) discard;

    gl_FragColor = vec4(finalColor * (1.2 + 0.38 * core), clamp(intensity, 0.0, 1.0));
  }
`;

/**
 * Builds the GPU-driven bioluminescent firefly particle system across all forested
 * regions of DREAMLINE. Appears exclusively during twilight and night hours when the
 * weather is clear, smoothly fading in at dusk and fading out at dawn or in bad weather.
 */
export function buildFirefliesWorld(particleCount = 720): FirefliesWorldSystem {
  const group = new THREE.Group();
  const seeds = generateFireflySeeds(particleCount);
  const count = seeds.length;

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const radii = new Float32Array(count * 2);
  const sizes = new Float32Array(count);
  const blinkRates = new Float32Array(count);
  const warmths = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const s = seeds[i];
    positions[i * 3] = s.x;
    positions[i * 3 + 1] = s.y;
    positions[i * 3 + 2] = s.z;
    phases[i] = s.phase;
    speeds[i] = s.speed;
    radii[i * 2] = s.wanderRadiusX;
    radii[i * 2 + 1] = s.wanderRadiusY;
    sizes[i] = s.size;
    blinkRates[i] = s.blinkRate;
    warmths[i] = s.warmth;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 2));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aBlinkRate', new THREE.BufferAttribute(blinkRates, 1));
  geometry.setAttribute('aWarmth', new THREE.BufferAttribute(warmths, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uVisibility: { value: 0 },
    },
    vertexShader: FIREFLY_VERTEX_SHADER,
    fragmentShader: FIREFLY_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  group.add(points);

  let currentVisibility = 0;
  let initialized = false;

  const snapVisibility = (timeHours: number, weather: WeatherType) => {
    currentVisibility = computeFireflyVisibility(timeHours, weather);
    initialized = true;
    points.visible = currentVisibility > 0.004;
    material.uniforms.uVisibility.value = currentVisibility;
  };

  const update = (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    pixelRatio: number
  ) => {
    const targetVisibility = computeFireflyVisibility(timeHours, weather);

    if (!initialized) {
      currentVisibility = targetVisibility;
      initialized = true;
    } else {
      // Smooth exponential damping so fireflies softly emerge at twilight and gently vanish at dawn/rain
      const damp = 1 - Math.exp(-3.8 * Math.max(dt, 0.001));
      currentVisibility += (targetVisibility - currentVisibility) * damp;
      if (Math.abs(targetVisibility - currentVisibility) < 0.002) {
        currentVisibility = targetVisibility;
      }
    }

    const active = currentVisibility > 0.004;
    points.visible = active;
    if (!active) return;

    material.uniforms.uTime.value = elapsed;
    material.uniforms.uPixelRatio.value = pixelRatio;
    material.uniforms.uVisibility.value = currentVisibility;
  };

  const getCurrentVisibility = () => currentVisibility;

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return {
    group,
    update,
    snapVisibility,
    getCurrentVisibility,
    dispose,
  };
}
