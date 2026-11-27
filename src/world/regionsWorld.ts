import * as THREE from 'three';
import {
  CAMPSITE_CENTER,
  COAST_CENTER,
  FROZEN_LAKE_CENTER,
  SNOW_PEAK_CENTER,
  WATERFALL_CENTER,
  WATER_LEVEL,
  distanceToRail,
  groundHeightAt,
  type AabbCollider,
} from '../game/terrain';
import {
  GIANT_IGLOO_MAN_HEIGHT_M,
  GIANT_IGLOO_MAN_POS,
  ICELAND_RETURN_GATE_POS,
} from '../game/iceland';
import { isNearFrozenKingdomClearing } from '../game/frozenKingdom';
import {
  OCEAN_HEIGHTMAP_BOUNDS,
  OCEAN_THEMES,
  buildSeabedHeightTextureData,
  computeOceanWeatherParams,
  evaluateGerstnerOceanCPU,
  type OceanThemeId,
} from '../game/gerstnerOcean';
import type { CampingState, InteractableItem, WeatherType } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface RegionsWorldSystem {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  triggerIglooManWave: () => void;
  setOceanTheme: (themeId: OceanThemeId) => void;
  getOceanTheme: () => OceanThemeId;
  update: (
    time: number,
    dt: number,
    sunDir: THREE.Vector3,
    skyColor: THREE.Color,
    sunColor: THREE.Color,
    lanternStrength: number,
    camping: CampingState,
    playerX?: number,
    playerZ?: number,
    weather?: WeatherType
  ) => void;
  dispose: () => void;
}

/**
 * Builds the 4 new interconnected regions of DREAMLINE:
 * 1. Kadalkarai Coast (கடற்கரை நகரம்) — Animated Ocean shader, Sandy Beach, Rotating Lighthouse, Fishing Harbour, Coastal Cafés
 * 2. Panimalai Snow Peaks (பனிமலைச் சிகரம்) — Snowy Alpine Crags, Instanced Snow Pines, Frozen Lake, Warm Winter Cabins + Chimney Smoke
 * 3. Pachai Vayal Countryside (பச்சை வயல்) — Terraced Emerald Rice Paddies, Animated Cascading Waterfall + Mist Pool
 * 4. Neelam Lake Campsite (நீலம் ஏரி முகாம்) — Pitchable Canvas Tent, Interactive Campfire + Flames/Embers/Smoke, Lakeside Cabin
 */
export function buildRegionsWorld(textures: ProceduralTextureSet): RegionsWorldSystem {
  const group = new THREE.Group();
  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.82,
    color: 0xb69072,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.84,
    color: 0x5c4132,
  });
  const plasterMat = new THREE.MeshStandardMaterial({
    map: textures.plasterWall,
    roughness: 0.88,
    color: 0xf4ece0,
  });
  const roofBlueMat = new THREE.MeshStandardMaterial({
    map: textures.roofTile,
    roughness: 0.74,
    color: 0x3b607a,
  });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f4fa, roughness: 0.85 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6c727c, roughness: 0.94 });
  const warmWinMat = new THREE.MeshStandardMaterial({
    color: 0xffe4aa,
    emissive: 0xffab4c,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  // =========================================================================
  // REGION 01: KADALKARAI COAST (கடற்கரை நகரம்) — OCEANLAB 3D GERSTNER OCEAN
  // =========================================================================
  const BATHYMETRY_RES = 384;
  const bathymetryData = buildSeabedHeightTextureData(
    BATHYMETRY_RES,
    groundHeightAt,
    WATER_LEVEL
  );
  const heightDataTexture = new THREE.DataTexture(
    bathymetryData,
    BATHYMETRY_RES,
    BATHYMETRY_RES,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  heightDataTexture.magFilter = THREE.LinearFilter;
  heightDataTexture.minFilter = THREE.LinearFilter;
  heightDataTexture.wrapS = THREE.ClampToEdgeWrapping;
  heightDataTexture.wrapT = THREE.ClampToEdgeWrapping;
  heightDataTexture.needsUpdate = true;

  let activeOceanTheme: OceanThemeId = 'bengal';
  const initOceanParams = computeOceanWeatherParams('clear', activeOceanTheme);

  const oceanUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.5, 0.4, -0.5) },
    uSkyColor: { value: new THREE.Color(0x6fb8d6) },
    uSunColor: { value: new THREE.Color(0xffd79e) },
    uAmplitude: { value: initOceanParams.amplitude },
    uSteepness: { value: initOceanParams.steepness },
    uWavelength: { value: initOceanParams.wavelength },
    uSpread: { value: initOceanParams.spread },
    uChop: { value: initOceanParams.chop },
    uSSSIntensity: { value: initOceanParams.sssIntensity },
    uFoamIntensity: { value: initOceanParams.foamIntensity },
    uHeightMap: { value: heightDataTexture },
    uHeightMapCenter: {
      value: new THREE.Vector2(OCEAN_HEIGHTMAP_BOUNDS.centerX, OCEAN_HEIGHTMAP_BOUNDS.centerZ),
    },
    uWorldSize: { value: OCEAN_HEIGHTMAP_BOUNDS.size },
    uWaterLevel: { value: WATER_LEVEL },
    uAbyssalColor: { value: new THREE.Color(...initOceanParams.theme.abyssalColor) },
    uShallowColor: { value: new THREE.Color(...initOceanParams.theme.shallowColor) },
    uSSSTint: { value: new THREE.Color(...initOceanParams.theme.sssTint) },
    uSandColor: { value: new THREE.Color(...initOceanParams.theme.sandColor) },
  };

  const applyOceanThemeUniforms = (themeId: OceanThemeId) => {
    activeOceanTheme = themeId;
    const t = OCEAN_THEMES[themeId] ?? OCEAN_THEMES.bengal;
    oceanUniforms.uAbyssalColor.value.setRGB(t.abyssalColor[0], t.abyssalColor[1], t.abyssalColor[2]);
    oceanUniforms.uShallowColor.value.setRGB(t.shallowColor[0], t.shallowColor[1], t.shallowColor[2]);
    oceanUniforms.uSSSTint.value.setRGB(t.sssTint[0], t.sssTint[1], t.sssTint[2]);
    oceanUniforms.uSandColor.value.setRGB(t.sandColor[0], t.sandColor[1], t.sandColor[2]);
  };

  const oceanMat = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    transparent: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform float uAmplitude;
      uniform float uSteepness;
      uniform float uWavelength;
      uniform float uSpread;
      uniform sampler2D uHeightMap;
      uniform vec2 uHeightMapCenter;
      uniform float uWorldSize;
      uniform float uWaterLevel;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vJacobian;
      varying float vWaveHeight;

      const float PI = 3.14159265359;
      const float G = 9.81;

      float sampleSeabedHeight(vec2 worldXZ) {
        vec2 uv = ((worldXZ - uHeightMapCenter) / uWorldSize) + 0.5;
        uv = clamp(uv, 0.002, 0.998);
        vec4 tex = texture2D(uHeightMap, uv);
        float normH = tex.r + tex.g / 255.0;
        return mix(-25.0, 15.0, normH);
      }

      void getWaveParams(int idx, out vec2 dir, out float relLen, out float relAmp, out float phaseOffset) {
        if (idx == 0) { dir = vec2( 0.14,  0.99); relLen = 1.00; relAmp = 1.00; phaseOffset = 0.0; }
        else if (idx == 1) { dir = vec2(-0.28,  0.96); relLen = 0.72; relAmp = 0.72; phaseOffset = 1.7; }
        else if (idx == 2) { dir = vec2( 0.36,  0.93); relLen = 0.50; relAmp = 0.50; phaseOffset = 3.1; }
        else if (idx == 3) { dir = vec2(-0.48,  0.88); relLen = 0.35; relAmp = 0.35; phaseOffset = 4.3; }
        else if (idx == 4) { dir = vec2( 0.58,  0.81); relLen = 0.24; relAmp = 0.24; phaseOffset = 2.2; }
        else if (idx == 5) { dir = vec2(-0.18,  0.98); relLen = 0.16; relAmp = 0.16; phaseOffset = 5.4; }
        else if (idx == 6) { dir = vec2( 0.75,  0.66); relLen = 0.11; relAmp = 0.11; phaseOffset = 0.9; }
        else               { dir = vec2(-0.68,  0.73); relLen = 0.075; relAmp = 0.075; phaseOffset = 3.8; }
      }

      void main() {
        vec3 worldBase = (modelMatrix * vec4(position, 1.0)).xyz;
        float bedH = sampleSeabedHeight(worldBase.xz);
        float waterDepth = max(0.0, -bedH);
        // Zero wave lift over dry land (eliminates ocean/white swash poking up through Dinosaur Island or beaches!)
        float dryLandFade = smoothstep(0.08, -0.42, bedH);

        // Coastal shoaling transformation: peaks steepen entering shallow shelves before damping cleanly at swash
        float shoalPeak = 1.0 + 0.42 * exp(-pow((waterDepth - 2.2) / 1.8, 2.0));
        float swashDamp = smoothstep(0.0, 0.85, waterDepth + 0.14) * dryLandFade;
        float depthAmpFactor = shoalPeak * swashDamp;

        vec3 displaced = worldBase;
        vec3 dPdx = vec3(1.0, 0.0, 0.0);
        vec3 dPdz = vec3(0.0, 0.0, 1.0);
        vec2 primaryWind = normalize(vec2(0.08, 0.99));

        for (int i = 0; i < 8; i++) {
          vec2 rawDir;
          float relLen, relAmp, phaseOff;
          getWaveParams(i, rawDir, relLen, relAmp, phaseOff);

          vec2 D = normalize(mix(primaryWind, normalize(rawDir), uSpread));
          float wl = max(3.5, uWavelength * relLen);
          float k = 2.0 * PI / wl;
          float omega = sqrt(G * k);

          float A = (wl / 28.0) * 0.40 * relAmp * uAmplitude * depthAmpFactor;
          float shoalSteep = uSteepness * (1.0 + 0.45 * smoothstep(6.0, 1.2, waterDepth));
          float Qi = clamp(shoalSteep * 0.165 / (k * A + 0.0001), 0.0, 0.23);

          float shallowPhaseDelay = k * log(1.0 + exp(-waterDepth * 0.38)) * 2.2;
          float theta = k * dot(D, worldBase.xz) - omega * uTime + phaseOff - shallowPhaseDelay;
          float s = sin(theta);
          float c = cos(theta);

          displaced.x -= Qi * A * D.x * s;
          displaced.z -= Qi * A * D.y * s;
          displaced.y += A * c;

          float kA = k * A;
          float QkA = Qi * kA;

          dPdx.x -= QkA * D.x * D.x * c;
          dPdx.z -= QkA * D.x * D.y * c;
          dPdx.y -= kA * D.x * s;

          dPdz.x -= QkA * D.y * D.x * c;
          dPdz.z -= QkA * D.y * D.y * c;
          dPdz.y -= kA * D.y * s;
        }

        // Tidal swash run-up surge strictly along wet coastal shorelines (zero lift on dry inland terrain!)
        float swashSurge = 0.20 * uAmplitude * sin(uTime * 1.45 - worldBase.z * 0.08);
        displaced.y += swashSurge * exp(-abs(waterDepth) * 0.65) * dryLandFade;

        vec3 norm = normalize(cross(dPdz, dPdx));
        float jacobian = dPdx.x * dPdz.z - dPdx.z * dPdz.x;

        vWorldPos = displaced;
        vNormal = norm;
        vJacobian = jacobian;
        vWaveHeight = displaced.y - uWaterLevel;

        gl_Position = projectionMatrix * viewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      uniform float uChop;
      uniform float uSSSIntensity;
      uniform float uFoamIntensity;
      uniform sampler2D uHeightMap;
      uniform vec2 uHeightMapCenter;
      uniform float uWorldSize;
      uniform float uWaterLevel;
      uniform vec3 uAbyssalColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSSSTint;
      uniform vec3 uSandColor;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vJacobian;
      varying float vWaveHeight;

      float sampleSeabedExact(vec2 worldXZ) {
        vec2 uv = ((worldXZ - uHeightMapCenter) / uWorldSize) + 0.5;
        uv = clamp(uv, 0.002, 0.998);
        vec4 tex = texture2D(uHeightMap, uv);
        float normH = tex.r + tex.g / 255.0;
        return mix(-25.0, 15.0, normH);
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      const mat2 rotMat = mat2(0.80, -0.60, 0.60, 0.80);

      float capillaryFBM(vec2 p, float t) {
        float val = 0.0;
        float amp = 0.5;
        vec2 shift = vec2(t * 0.85, -t * 0.55);
        for (int i = 0; i < 5; i++) {
          val += amp * noise2D(p + shift);
          p = rotMat * p * 2.12;
          shift = rotMat * shift * 1.35;
          amp *= 0.48;
        }
        return val;
      }

      float computeCaustics(vec2 p, float t) {
        vec2 uv1 = p * 0.85 + vec2(t * 0.4, -t * 0.3);
        vec2 uv2 = rotMat * p * 1.15 - vec2(t * 0.35, t * 0.45);
        float n1 = abs(noise2D(uv1) - 0.5);
        float n2 = abs(noise2D(uv2) - 0.5);
        return pow(1.0 - clamp((n1 + n2) * 2.2, 0.0, 1.0), 3.5);
      }

      vec3 evaluateSkyReflection(vec3 rd, vec3 sunDir, vec3 sceneSky, vec3 sceneSun, float dayFactor) {
        float sunElevation = clamp(sunDir.y, 0.0, 1.0);
        float yd = max(rd.y, 0.0);

        vec3 dayZenith = vec3(0.02, 0.12, 0.34);
        vec3 sunsetZenith = vec3(0.04, 0.07, 0.20);
        vec3 zenithCol = mix(sunsetZenith, dayZenith, pow(sunElevation, 0.55));

        vec3 dayHorizon = vec3(0.18, 0.44, 0.72);
        vec3 sunsetHorizon = vec3(0.84, 0.40, 0.20);
        vec3 horizonCol = mix(sunsetHorizon, dayHorizon, pow(sunElevation, 0.45));

        // Harmonize OceanLab sky scattering with DREAMLINE's live sunset/night sky palette
        vec3 linearSceneSky = pow(clamp(sceneSky, 0.001, 1.0), vec3(2.2));
        vec3 skyDay = mix(horizonCol, zenithCol, pow(yd, 0.48));
        skyDay = mix(skyDay, linearSceneSky * 0.92, 0.22);

        vec3 nightSky = mix(linearSceneSky * 0.65 + vec3(0.015, 0.028, 0.065), vec3(0.012, 0.022, 0.055), pow(yd, 0.6));
        vec3 sky = mix(nightSky, skyDay, dayFactor);

        float sunDot = max(dot(rd, sunDir), 0.0);
        vec3 mieColor = mix(pow(clamp(sceneSun, 0.01, 1.0), vec3(2.0)), vec3(1.0, 0.92, 0.80), sunElevation);
        sky += mieColor * pow(sunDot, 7.0) * (0.14 + 0.28 * dayFactor);
        sky += mieColor * pow(sunDot, 64.0) * (0.20 + 0.35 * dayFactor);
        return sky;
      }

      void main() {
        float bedY = sampleSeabedExact(vWorldPos.xz);
        float waterColumnDepth = (vWorldPos.y - uWaterLevel) - bedY;

        // Clip ocean & shoreline foam cleanly wherever dry beaches, mainland, or Dinosaur Island rise above water
        if (bedY > 0.14 || waterColumnDepth < 0.02) {
          discard;
        }

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);
        float dist = length(cameraPosition - vWorldPos);
        float detailFade = exp(-dist * 0.0038);

        vec2 uv = vWorldPos.xz * 0.36;
        float eps = 0.08;
        float h0 = capillaryFBM(uv, uTime);
        float hx = capillaryFBM(uv + vec2(eps, 0.0), uTime);
        float hz = capillaryFBM(uv + vec2(0.0, eps), uTime);

        vec3 microPerturb = vec3(-(hx - h0) / eps, 0.0, -(hz - h0) / eps) * 0.19 * uChop * detailFade;
        vec3 N = normalize(vNormal + microPerturb);

        // Preserve underwater upward Snell's Window when diving or piloting the submarine!
        if (!gl_FrontFacing) {
          vec3 underNorm = -N;
          float cosUp = max(dot(V, underNorm), 0.0);
          float snellWindow = smoothstep(0.42, 0.82, cosUp + (h0 - 0.5) * 0.18);
          vec3 tirCol = vec3(0.015, 0.18, 0.30);
          vec3 windowCol = mix(vec3(0.18, 0.72, 0.84), uSkyColor * 0.88 + uSunColor * 0.30, 0.52);
          float sparkle = pow(clamp(h0 * 1.2, 0.0, 1.0), 3.0);
          vec3 uCol = mix(tirCol, windowCol, snellWindow) + vec3(0.24, 0.68, 0.78) * sparkle * 0.28 * snellWindow;
          gl_FragColor = vec4(uCol, 1.0);
          return;
        }

        if (dot(N, V) < 0.0) {
          N = normalize(N - V * dot(N, V) * 1.01);
        }

        float NoV = clamp(dot(N, V), 0.001, 1.0);
        float NoL = clamp(dot(N, L), 0.0, 1.0);
        float sunElev = clamp(L.y, 0.0, 1.0);
        float dayFactor = smoothstep(-0.14, 0.16, L.y);
        float lightScale = 0.24 + 0.76 * dayFactor;

        // 1. Schlick's Fresnel Law
        float fresnel = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);

        // 2. Sky Reflection
        vec3 R = reflect(-V, N);
        R.y = max(R.y, 0.015);
        vec3 skyReflection = evaluateSkyReflection(R, L, uSkyColor, uSunColor, dayFactor);

        // 3. Theme-Driven Deep Water Absorption & Shallow Coastal Bathymetry Refraction
        vec3 abyssalColor = uAbyssalColor * (0.45 + 0.65 * sunElev) * lightScale;
        vec3 shallowScatter = uShallowColor * (0.55 + 0.60 * sunElev) * lightScale;
        vec3 deepWaterCol = mix(shallowScatter, abyssalColor, pow(1.0 - NoV, 0.65));

        // Beer-Lambert optical transmission through shallow coastal water & island reefs
        float opticalDepth = max(0.0, waterColumnDepth);
        float seabedVisibility = exp(-opticalDepth * 0.46);
        float caustics = computeCaustics(vWorldPos.xz + N.xz * 0.65, uTime) * smoothstep(5.5, 0.2, opticalDepth) * dayFactor;
        vec3 submergedSand = uSandColor * (0.36 + 0.62 * max(L.y, 0.15)) * lightScale + vec3(1.0, 0.95, 0.80) * caustics * 0.52;

        vec3 waterBodyColor = mix(deepWaterCol, shallowScatter, exp(-opticalDepth * 0.18));
        waterBodyColor = mix(waterBodyColor, submergedSand, seabedVisibility * 0.82);

        // 4. Subsurface Scattering (SSS) jade-turquoise crest translucency
        float waveThinness = clamp((vWaveHeight + 0.45) * 0.48, 0.0, 1.0) * pow(1.0 - N.y, 0.35);
        vec3 sssDir = normalize(L + N * 0.6);
        float forwardScatter = pow(clamp(dot(V, -sssDir), 0.0, 1.0), 3.5);
        float ambientCrestScatter = clamp(vWaveHeight * 0.38 + 0.16, 0.0, 1.0) * (1.0 - NoV * 0.5);

        vec3 sssContribution = uSSSTint * (forwardScatter * 1.55 + ambientCrestScatter * 0.62) * waveThinness * uSSSIntensity * lightScale;
        vec3 refracted = waterBodyColor + sssContribution * (1.0 - seabedVisibility * 0.55);
        vec3 surfaceColor = mix(refracted, skyReflection, fresnel * 0.54);

        // 5. Solar / Lunar Specular Glitter Path
        vec3 H = normalize(L + V);
        float NoH = max(dot(N, H), 0.0);
        vec3 sunLightCol = mix(
          vec3(0.62, 0.74, 0.95) * 0.45,
          mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.96, 0.88), sunElev),
          dayFactor
        );
        float specCore = pow(NoH, 720.0) * 6.5;
        float specSheen = pow(NoH, 48.0) * 0.28;
        surfaceColor += sunLightCol * (specCore + specSheen) * (0.22 + 0.78 * fresnel) * max(NoL, 0.10);

        // 6. Jacobian Whitecap Foam + Shallow Surf Breakers + Shoreline Swash Lace
        float foamNoiseA = noise2D(vWorldPos.xz * 1.4 + vec2(uTime * 0.35, -uTime * 0.2));
        float foamNoiseB = noise2D(vWorldPos.xz * 5.2 - vec2(uTime * 0.5, uTime * 0.4));
        float bubblePattern = smoothstep(0.24, 0.80, foamNoiseA * 0.60 + foamNoiseB * 0.40);

        float surfZoneBoost = smoothstep(3.2, 0.35, opticalDepth) * 0.30 * max(0.0, vWaveHeight + 0.18);
        float crestCompression = clamp(((0.58 - vJacobian) * 1.9 + surfZoneBoost) * uFoamIntensity, 0.0, 1.0);
        float crestFoam = smoothstep(0.22, 0.74, crestCompression) * (0.50 + 0.50 * bubblePattern);
        float trailFoam = smoothstep(0.08, 0.48, crestCompression) * smoothstep(0.50, 0.84, bubblePattern) * 0.42;
        float swashEdge = smoothstep(0.42, 0.0, opticalDepth) * (0.50 + 0.50 * sin(opticalDepth * 16.0 - uTime * 3.0)) * bubblePattern;

        float totalFoam = clamp(crestFoam + trailFoam + swashEdge * 0.72, 0.0, 0.92) * detailFade;
        vec3 foamAlbedo = mix(vec3(0.82, 0.76, 0.72), vec3(0.95, 0.98, 1.0), sunElev) * lightScale;
        foamAlbedo *= (0.45 + 0.55 * max(NoL, 0.25));
        surfaceColor = mix(surfaceColor, foamAlbedo, totalFoam);

        // 7. Horizon Atmospheric Fog
        vec3 fogColor = evaluateSkyReflection(vec3(-V.x, 0.02, -V.z), L, uSkyColor, uSunColor, dayFactor);
        float fogFactor = 1.0 - exp(-dist * 0.00075);
        surfaceColor = mix(surfaceColor, fogColor, clamp(fogFactor, 0.0, 0.78));

        // 8. ACES Filmic Tone Mapping & Gamma Correction
        surfaceColor = (surfaceColor * (2.51 * surfaceColor + 0.03)) / (surfaceColor * (2.43 * surfaceColor + 0.59) + 0.14);
        surfaceColor = pow(clamp(surfaceColor, 0.0, 1.0), vec3(1.0 / 2.2));

        gl_FragColor = vec4(surfaceColor, 1.0);
      }
    `,
  });

  const oceanMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(OCEAN_HEIGHTMAP_BOUNDS.size, OCEAN_HEIGHTMAP_BOUNDS.size, 200, 200),
    oceanMat
  );
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.set(OCEAN_HEIGHTMAP_BOUNDS.centerX, WATER_LEVEL, OCEAN_HEIGHTMAP_BOUNDS.centerZ);
  group.add(oceanMesh);

  // Seamless Infinite Horizon Ocean sharing the exact OceanLab 3D optical palette, capillary FBM ripples & ACES tone mapping!
  const infiniteOceanMat = new THREE.ShaderMaterial({
    transparent: false,
    uniforms: oceanUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uChop;
      uniform vec2 uHeightMapCenter;
      uniform float uWorldSize;
      uniform vec3 uAbyssalColor;
      uniform vec3 uShallowColor;

      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      const mat2 rotMat = mat2(0.80, -0.60, 0.60, 0.80);

      float capillaryFBM(vec2 p, float t) {
        float val = 0.0;
        float amp = 0.5;
        vec2 shift = vec2(t * 0.85, -t * 0.55);
        for (int i = 0; i < 4; i++) {
          val += amp * noise2D(p + shift);
          p = rotMat * p * 2.05;
          shift = rotMat * shift * 1.3;
          amp *= 0.48;
        }
        return val;
      }

      vec3 evaluateSkyReflection(vec3 rd, vec3 sunDir, vec3 sceneSky, vec3 sceneSun, float dayFactor) {
        float sunElevation = clamp(sunDir.y, 0.0, 1.0);
        float yd = max(rd.y, 0.0);
        vec3 dayZenith = vec3(0.02, 0.12, 0.34);
        vec3 sunsetZenith = vec3(0.04, 0.07, 0.20);
        vec3 zenithCol = mix(sunsetZenith, dayZenith, pow(sunElevation, 0.55));
        vec3 dayHorizon = vec3(0.18, 0.44, 0.72);
        vec3 sunsetHorizon = vec3(0.84, 0.40, 0.20);
        vec3 horizonCol = mix(sunsetHorizon, dayHorizon, pow(sunElevation, 0.45));
        vec3 linearSceneSky = pow(clamp(sceneSky, 0.001, 1.0), vec3(2.2));
        vec3 skyDay = mix(mix(horizonCol, zenithCol, pow(yd, 0.48)), linearSceneSky * 0.92, 0.22);
        vec3 nightSky = mix(linearSceneSky * 0.65 + vec3(0.015, 0.028, 0.065), vec3(0.012, 0.022, 0.055), pow(yd, 0.6));
        vec3 sky = mix(nightSky, skyDay, dayFactor);
        float sunDot = max(dot(rd, sunDir), 0.0);
        vec3 mieColor = mix(pow(clamp(sceneSun, 0.01, 1.0), vec3(2.0)), vec3(1.0, 0.92, 0.80), sunElevation);
        sky += mieColor * pow(sunDot, 7.0) * (0.14 + 0.28 * dayFactor);
        sky += mieColor * pow(sunDot, 64.0) * (0.20 + 0.35 * dayFactor);
        return sky;
      }

      void main() {
        // Avoid overlap z-fighting under the primary Gerstner ocean mesh
        vec2 rel = abs(vWorldPos.xz - uHeightMapCenter);
        float halfInner = uWorldSize * 0.5 - 4.0;
        if (rel.x < halfInner && rel.y < halfInner) {
          discard;
        }

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);
        float dist = length(cameraPosition - vWorldPos);
        float detailFade = exp(-dist * 0.0018);

        vec2 uv = vWorldPos.xz * 0.24;
        float eps = 0.14;
        float h0 = capillaryFBM(uv, uTime);
        float hx = capillaryFBM(uv + vec2(eps, 0.0), uTime);
        float hz = capillaryFBM(uv + vec2(0.0, eps), uTime);
        vec3 N = normalize(vec3(-(hx - h0) / eps * 0.14 * uChop * detailFade, 1.0, -(hz - h0) / eps * 0.14 * uChop * detailFade));

        float NoV = clamp(dot(N, V), 0.001, 1.0);
        float NoL = clamp(dot(N, L), 0.0, 1.0);
        float sunElev = clamp(L.y, 0.0, 1.0);
        float dayFactor = smoothstep(-0.14, 0.16, L.y);
        float lightScale = 0.24 + 0.76 * dayFactor;

        float fresnel = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
        vec3 R = reflect(-V, N);
        R.y = max(R.y, 0.015);
        vec3 skyReflection = evaluateSkyReflection(R, L, uSkyColor, uSunColor, dayFactor);

        vec3 abyssalColor = uAbyssalColor * (0.45 + 0.65 * sunElev) * lightScale;
        vec3 shallowScatter = uShallowColor * (0.55 + 0.60 * sunElev) * lightScale;
        vec3 deepWaterCol = mix(shallowScatter, abyssalColor, pow(1.0 - NoV, 0.65));

        vec3 surfaceColor = mix(deepWaterCol, skyReflection, fresnel * 0.54);

        vec3 H = normalize(L + V);
        float NoH = max(dot(N, H), 0.0);
        vec3 sunLightCol = mix(
          vec3(0.62, 0.74, 0.95) * 0.45,
          mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.96, 0.88), sunElev),
          dayFactor
        );
        surfaceColor += sunLightCol * (pow(NoH, 420.0) * 4.2 + pow(NoH, 36.0) * 0.28) * (0.25 + 0.75 * fresnel) * max(NoL, 0.1);

        vec3 fogColor = evaluateSkyReflection(vec3(-V.x, 0.01, -V.z), L, uSkyColor, uSunColor, dayFactor);
        float fogFactor = 1.0 - exp(-dist * 0.00145);
        surfaceColor = mix(surfaceColor, fogColor, clamp(fogFactor, 0.0, 1.0));

        surfaceColor = (surfaceColor * (2.51 * surfaceColor + 0.03)) / (surfaceColor * (2.43 * surfaceColor + 0.59) + 0.14);
        surfaceColor = pow(clamp(surfaceColor, 0.0, 1.0), vec3(1.0 / 2.2));
        gl_FragColor = vec4(surfaceColor, 1.0);
      }
    `,
  });

  // East infinite ocean expanse (x: 118..7118, z: -2600..4400)
  const infOceanEast = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000, 1, 1), infiniteOceanMat);
  infOceanEast.rotation.x = -Math.PI / 2;
  infOceanEast.position.set(3618, WATER_LEVEL - 0.05, 900);
  // South infinite ocean expanse (x: -2400..4600, z: 452..5452)
  const infOceanSouth = new THREE.Mesh(new THREE.PlaneGeometry(7000, 5000, 1, 1), infiniteOceanMat);
  infOceanSouth.rotation.x = -Math.PI / 2;
  infOceanSouth.position.set(1100, WATER_LEVEL - 0.06, 2952);
  group.add(infOceanEast, infOceanSouth);

  // Tall Red-and-White Kadalkarai Lighthouse at (114, 42)
  const lhGroup = new THREE.Group();
  const lhX = 114;
  const lhZ = 42;
  const lhBaseY = Math.max(0.25, groundHeightAt(lhX, lhZ));
  lhGroup.position.set(lhX, lhBaseY, lhZ);

  const lhRock = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 5.2, 2.2, 10), rockMat);
  lhRock.position.y = 0.8;
  lhGroup.add(lhRock);

  const lhStripeColors = [0xf6f3ee, 0xc94a3f, 0xf6f3ee, 0xc94a3f, 0xf6f3ee];
  for (let i = 0; i < lhStripeColors.length; i++) {
    const rBot = 2.35 - i * 0.22;
    const rTop = 2.13 - i * 0.22;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, 2.8, 14),
      new THREE.MeshStandardMaterial({ color: lhStripeColors[i], roughness: 0.7 })
    );
    band.position.y = 3.1 + i * 2.8;
    band.castShadow = true;
    lhGroup.add(band);
  }
  const lhGallery = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.55, 0.45, 14), darkWoodMat);
  lhGallery.position.y = 15.9;
  const lhLantern = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.7, 12), warmWinMat);
  lhLantern.position.y = 16.95;
  const lhCap = new THREE.Mesh(
    new THREE.ConeGeometry(1.45, 1.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xb73d36, roughness: 0.6 })
  );
  lhCap.position.y = 18.5;
  lhGroup.add(lhGallery, lhLantern, lhCap);

  // Rotating Golden Lighthouse Beam
  const lhBeamPivot = new THREE.Group();
  lhBeamPivot.position.y = 17.0;
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffdf99,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamCone = new THREE.Mesh(new THREE.ConeGeometry(3.8, 34, 14, 1, true), beamMat);
  beamCone.rotation.z = -Math.PI / 2;
  beamCone.position.x = 17;
  lhBeamPivot.add(beamCone);
  lhGroup.add(lhBeamPivot);
  group.add(lhGroup);
  colliders.push({ id: 'lighthouse', minX: lhX - 3.6, maxX: lhX + 3.6, minZ: lhZ - 3.6, maxZ: lhZ + 3.6 });

  // Fishing Harbour Wooden Dock (x: 106..120, z: 59..65)
  const dockDeck = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.24, 6.2), darkWoodMat);
  dockDeck.position.set(113.0, 0.16, 62.0);
  dockDeck.receiveShadow = true;
  group.add(dockDeck);
  for (const px of [106.5, 111.0, 115.5, 119.5]) {
    for (const pz of [59.3, 64.7]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.2, 8), darkWoodMat);
      piling.position.set(px, -0.3, pz);
      group.add(piling);
    }
  }
  // Harbour crates + warm lamp post
  for (let c = 0; c < 3; c++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.85), woodMat);
    crate.position.set(108.2 + c * 0.95, 0.64, 60.0);
    group.add(crate);
  }
  const harbourLampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 8), darkWoodMat);
  harbourLampPost.position.set(118.6, 2.0, 60.1);
  const harbourBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), warmWinMat);
  harbourBulb.position.set(118.6, 3.9, 60.1);
  group.add(harbourLampPost, harbourBulb);

  // Sovereign of the Tides Dedicated Timber Boarding Pier & Gangway (x: 103.5..123.0, z: 46.2..51.0)
  // Connects Kadalkarai sandy beach straight to the moored 3-masted historical ship!
  const sovPierDeck = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.26, 4.6), darkWoodMat);
  sovPierDeck.position.set(113.2, 0.23, 48.6);
  sovPierDeck.receiveShadow = true;
  group.add(sovPierDeck);
  // Plank accent runners + boarding gangway lip toward ship hull
  const sovGangway = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 2.2), woodMat);
  sovGangway.position.set(123.2, 0.42, 48.6);
  sovGangway.rotation.z = 0.08;
  group.add(sovGangway);
  for (const px of [104.5, 108.5, 112.5, 116.5, 120.5, 122.4]) {
    for (const pz of [46.5, 50.7]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.5, 8), darkWoodMat);
      piling.position.set(px, -0.22, pz);
      group.add(piling);
      // Mooring bollard posts rising cleanly above pier edge
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 8), woodMat);
      bollard.position.set(px, 0.72, pz);
      group.add(bollard);
    }
  }
  // Warm harbour lantern posts marking the Sovereign boarding pier clearly from shore
  for (const lx of [106.0, 121.6]) {
    const lPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 8), darkWoodMat);
    lPost.position.set(lx, 1.95, 46.7);
    const lBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), warmWinMat);
    lBulb.position.set(lx, 3.68, 46.7);
    group.add(lPost, lBulb);
  }

  // Moored Decorative Fishing Boats bobbing along harbour south side
  const mooredBoats: THREE.Group[] = [];
  for (let i = 0; i < 2; i++) {
    const mb = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.65, 1.55),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x3b6f94 : 0xc45e4b, roughness: 0.72 })
    );
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.15), plasterMat);
    cabin.position.set(-0.5, 0.65, 0);
    mb.add(hull, cabin);
    mb.position.set(118 + i * 6.5, WATER_LEVEL + 0.25, 74 + i * 5.2);
    mb.rotation.y = 0.25 - i * 0.4;
    group.add(mb);
    mooredBoats.push(mb);
  }

  // Coastal Village Cafés & Cottages (x: 88..98, z: 46..78)
  const coastalSpecs = [
    { x: 92, z: 50, w: 7.4, d: 5.2, h: 3.4, rot: 0.1, awning: 0x3f8ca3 },
    { x: 91, z: 68, w: 6.8, d: 5.0, h: 3.2, rot: -0.08, awning: 0xd97c54 },
    { x: 84, z: 77, w: 6.2, d: 4.8, h: 3.0, rot: 0.05, awning: 0x5d8d68 },
  ];
  coastalSpecs.forEach((c, idx) => {
    const gy = Math.max(0.2, groundHeightAt(c.x, c.z));
    const house = new THREE.Group();
    house.position.set(c.x, gy, c.z);
    house.rotation.y = c.rot;

    const body = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), plasterMat);
    body.position.y = c.h * 0.5;
    body.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(c.w, c.d) * 0.72, 1.8, 4), roofBlueMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = c.h + 0.85;
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 0.12), warmWinMat);
    win.position.set(0, 1.65, c.d * 0.5 + 0.04);
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(c.w * 0.85, 0.14, 1.45),
      new THREE.MeshStandardMaterial({ color: c.awning, roughness: 0.8 })
    );
    awning.position.set(0, 2.45, c.d * 0.5 + 0.7);
    awning.rotation.x = 0.25;
    house.add(body, roof, win, awning);
    group.add(house);
    colliders.push({
      id: `coast_house_${idx}`,
      minX: c.x - c.w * 0.52,
      maxX: c.x + c.w * 0.52,
      minZ: c.z - c.d * 0.52,
      maxZ: c.z + c.d * 0.52,
    });
  });

  // Sandy Beach Umbrellas & Driftwood Benches
  const umbrellaColors = [0xd95f52, 0x3b8ea5, 0xe8b04b];
  for (let i = 0; i < 3; i++) {
    const ux = 104.5 + (i % 2) * 1.8;
    const uz = 74 + i * 9.5;
    const uy = Math.max(0.05, groundHeightAt(ux, uz));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), woodMat);
    pole.position.set(ux, uy + 1.2, uz);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.7, 0.65, 10),
      new THREE.MeshStandardMaterial({ color: umbrellaColors[i], roughness: 0.78 })
    );
    canopy.position.set(ux, uy + 2.35, uz);
    group.add(pole, canopy);
  }
  const beachBenchY = Math.max(0.15, groundHeightAt(103.5, 54.0));
  const beachBench = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 2.1), woodMat);
  beachBench.position.set(103.5, beachBenchY + 0.28, 54.0);
  group.add(beachBench);
  interactables.push({
    id: 'coast_beach_bench',
    kind: 'bench',
    label: 'Sit Facing Kadalkarai Sea',
    sublabel: 'கடற்கரை · Listen to the ocean waves',
    x: 103.5,
    y: beachBenchY,
    z: 54.0,
    facingAngle: Math.PI * 0.5,
    radius: 2.6,
    locationId: 'coastal_town',
  });

  // =========================================================================
  // REGION 02: PANIMALAI SNOW PEAKS (பனிமலைச் சிகரம்)
  // =========================================================================
  // Crystalline Frozen Lake at (-102, -58)
  const frozenMat = new THREE.ShaderMaterial({
    uniforms: {
      uSkyColor: oceanUniforms.uSkyColor,
      uSunColor: oceanUniforms.uSunColor,
    },
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        // Subtle crystalline ice cracks
        float crack = smoothstep(0.95, 0.995, abs(sin(vWorldPos.x * 0.65 + sin(vWorldPos.z * 0.45) * 2.1)));
        vec3 iceBase = mix(vec3(0.68, 0.85, 0.94), vec3(0.88, 0.94, 0.98), smoothstep(0.35, 0.98, r));
        vec3 col = mix(iceBase, uSkyColor, 0.25);
        col = mix(col, vec3(0.98, 0.99, 1.0), crack * 0.6);
        col += uSunColor * 0.08;
        gl_FragColor = vec4(col, 0.92);
      }
    `,
  });
  const frozenLake = new THREE.Mesh(new THREE.CircleGeometry(20.5, 32), frozenMat);
  frozenLake.rotation.x = -Math.PI / 2;
  frozenLake.position.set(FROZEN_LAKE_CENTER.x, 2.95, FROZEN_LAKE_CENTER.z);
  group.add(frozenLake);

  // Alpine Snowy Crag Peaks framing Panimalai Snow Summit Station & Frozen Kingdom (clear of rails & station!)
  const peakSpecs = [
    { x: SNOW_PEAK_CENTER.x, z: SNOW_PEAK_CENTER.z, r: 15.5, h: 25 },
    { x: -136, z: -64, r: 15, h: 22 },
    { x: -72, z: -158, r: 20, h: 28 },
  ];
  for (const pk of peakSpecs) {
    const py = groundHeightAt(pk.x, pk.z);
    const crag = new THREE.Mesh(new THREE.ConeGeometry(pk.r, pk.h, 7), rockMat);
    crag.position.set(pk.x, py + pk.h * 0.34, pk.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(pk.r * 0.62, pk.h * 0.56, 7), snowMat);
    cap.position.set(pk.x, py + pk.h * 0.56, pk.z);
    group.add(crag, cap);
  }

  // Instanced Snow-Laden Alpine Pine Forest (~90 trees)
  const pineCount = 90;
  const pineTrunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.6, 6);
  const pineLowerGeo = new THREE.ConeGeometry(1.75, 4.0, 7);
  const pineSnowTopGeo = new THREE.ConeGeometry(1.38, 2.8, 7);
  const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, darkWoodMat, pineCount);
  const pineNeedles = new THREE.InstancedMesh(
    pineLowerGeo,
    new THREE.MeshStandardMaterial({ color: 0x2d4e3e, roughness: 0.9 }),
    pineCount
  );
  const pineSnowCaps = new THREE.InstancedMesh(pineSnowTopGeo, snowMat, pineCount);

  const dummy = new THREE.Object3D();
  let pineIdx = 0;
  for (let i = 0; i < 160 && pineIdx < pineCount; i++) {
    const rx = -62 - ((i * 53.7) % 86);
    const rz = -42 - ((i * 39.3) % 88);
    if (Math.hypot(rx - FROZEN_LAKE_CENTER.x, rz - FROZEN_LAKE_CENTER.z) < 23) continue;
    // Keep Panimalai Iceland Giant Plaza, Giant Igloo Man, AVS Snow Residence, Mirror Lake & all walkways wide open!
    if (Math.hypot(rx + 80, rz + 84) < 24) continue;
    if (isNearFrozenKingdomClearing(rx, rz)) continue;
    if (Math.hypot(rx - ICELAND_RETURN_GATE_POS.x, rz - ICELAND_RETURN_GATE_POS.z) < 9) continue;
    if (distanceToRail(rx, rz) < 9.5) continue;
    if (Math.hypot(rx + 100, rz + 128) < 15.5) continue;
    const py = groundHeightAt(rx, rz);
    const sc = 0.85 + ((i * 17) % 10) * 0.06;

    dummy.position.set(rx, py + 1.25 * sc, rz);
    dummy.scale.set(sc, sc, sc);
    dummy.rotation.y = i * 1.1;
    dummy.updateMatrix();
    pineTrunks.setMatrixAt(pineIdx, dummy.matrix);

    dummy.position.set(rx, py + 3.4 * sc, rz);
    dummy.updateMatrix();
    pineNeedles.setMatrixAt(pineIdx, dummy.matrix);

    dummy.position.set(rx, py + 5.1 * sc, rz);
    dummy.updateMatrix();
    pineSnowCaps.setMatrixAt(pineIdx, dummy.matrix);
    pineIdx++;
  }
  pineTrunks.count = pineIdx;
  pineNeedles.count = pineIdx;
  pineSnowCaps.count = pineIdx;
  group.add(pineTrunks, pineNeedles, pineSnowCaps);

  // Panimalai Iceland Winter Cabins spaced around the glacier plaza perimeter
  const smokePuffs: Array<{ mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }> = [];
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xeaf0f6,
    transparent: true,
    opacity: 0.45,
    roughness: 1,
  });
  const cabinSpecs = [
    { x: -97, z: -85, rot: 0.55 },
    { x: -91, z: -99, rot: 0.15 },
    { x: -61, z: -82, rot: -0.75 },
  ];
  cabinSpecs.forEach((cb, idx) => {
    const cy = groundHeightAt(cb.x, cb.z);
    const cab = new THREE.Group();
    cab.position.set(cb.x, cy, cb.z);
    cab.rotation.y = cb.rot;

    const wall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.0, 4.4), darkWoodMat);
    wall.position.y = 1.5;
    wall.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.2, 4), snowMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.05;
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.12), warmWinMat);
    win.position.set(0, 1.55, 2.22);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.0, 0.65), rockMat);
    chim.position.set(1.5, 4.2, -0.6);
    cab.add(wall, roof, win, chim);
    group.add(cab);

    colliders.push({
      id: `snow_cabin_${idx}`,
      minX: cb.x - 3.0,
      maxX: cb.x + 3.0,
      minZ: cb.z - 2.5,
      maxZ: cb.z + 2.5,
    });

    for (let s = 0; s < 3; s++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 7), smokeMat);
      group.add(puff);
      smokePuffs.push({
        mesh: puff,
        baseX: cb.x + Math.cos(cb.rot) * 1.5,
        baseY: cy + 5.3,
        baseZ: cb.z - Math.sin(cb.rot) * 1.5,
        phase: s * 0.33 + idx * 0.2,
      });
    }
  });

  // =========================================================================
  // COLOSSAL GIANT IGLOO MAN (18.0m tall sculpted friendly snow-igloo titan of Iceland!)
  // Mandatory Scale Hierarchy: Normal Player (1.68m) < Giant Igloo Man (18.0m) < Giant Player (23.5m)
  // =========================================================================
  const IGLOO_MAN_SCALE = GIANT_IGLOO_MAN_HEIGHT_M / 8.8;
  const iglooManGroup = new THREE.Group();
  const igX = GIANT_IGLOO_MAN_POS.x;
  const igZ = GIANT_IGLOO_MAN_POS.z;
  const igY = groundHeightAt(igX, igZ);
  iglooManGroup.position.set(igX, igY, igZ);
  iglooManGroup.scale.setScalar(IGLOO_MAN_SCALE);
  iglooManGroup.rotation.y = -0.52; // Faces southwest toward player arrival at (-90, -68)

  const iglooSnowMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    roughness: 0.78,
    metalness: 0.04,
  });
  const iglooBlockRingMat = new THREE.MeshStandardMaterial({
    color: 0xd4eafc,
    roughness: 0.62,
    metalness: 0.08,
  });
  const iglooIceCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x8ce2ff,
    emissive: new THREE.Color(0x3ec4ff),
    emissiveIntensity: 1.05,
    roughness: 0.16,
    metalness: 0.18,
    transparent: true,
    opacity: 0.88,
  });
  const iglooScarfMat = new THREE.MeshStandardMaterial({
    color: 0x246b9e,
    roughness: 0.82,
    metalness: 0.04,
  });
  const iglooEyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xe6ffff,
    emissive: new THREE.Color(0x46e6ff),
    emissiveIntensity: 2.3,
    roughness: 0.1,
  });
  const iglooSmileMat = new THREE.MeshStandardMaterial({
    color: 0x244c73,
    roughness: 0.55,
  });

  const iglooBodyRoot = new THREE.Group();
  iglooManGroup.add(iglooBodyRoot);

  // Massive snow-block igloo lower dome base (y: 0..3.6m, radius ~2.65m)
  const lowerDome = new THREE.Mesh(new THREE.SphereGeometry(2.65, 22, 16), iglooSnowMat);
  lowerDome.scale.set(1.06, 0.88, 1.02);
  lowerDome.position.y = 2.05;
  lowerDome.castShadow = true;
  lowerDome.receiveShadow = true;
  iglooBodyRoot.add(lowerDome);

  // Sculpted Igloo Ice-Block Horizontal Seam Rings around belly + miniature snow igloo entrance arch motif on belly!
  [1.2, 2.3, 3.35].forEach((ry, idx) => {
    const r = idx === 0 ? 2.66 : idx === 1 ? 2.58 : 2.15;
    const seam = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 8, 28), iglooBlockRingMat);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = ry;
    iglooBodyRoot.add(seam);
  });
  const bellyArch = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 10, 18, Math.PI), iglooBlockRingMat);
  bellyArch.position.set(0, 0.9, 2.52);
  iglooBodyRoot.add(bellyArch);

  // Rounded Snow Feet
  [-1.25, 1.25].forEach((fx) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10), iglooIceCrystalMat);
    foot.scale.set(1.0, 0.52, 1.35);
    foot.position.set(fx, 0.42, 0.6);
    iglooBodyRoot.add(foot);
  });

  // Upper Torso Snow Sphere (y: 3.6..6.4m)
  const midTorso = new THREE.Mesh(new THREE.SphereGeometry(2.05, 20, 16), iglooSnowMat);
  midTorso.scale.set(1.04, 0.94, 0.98);
  midTorso.position.y = 4.65;
  midTorso.castShadow = true;
  iglooBodyRoot.add(midTorso);

  // Glacial Blue Scarf & Flowing Tail around Giant Igloo Man's neck (y = 6.15m)
  const iglooScarf = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.34, 10, 24), iglooScarfMat);
  iglooScarf.rotation.x = Math.PI / 2;
  iglooScarf.position.y = 6.15;
  iglooBodyRoot.add(iglooScarf);
  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.75, 0.24), iglooScarfMat);
  scarfTail.position.set(1.15, 5.2, 1.32);
  scarfTail.rotation.z = 0.18;
  iglooBodyRoot.add(scarfTail);

  // Giant Ice Crystal Buttons on chest
  [4.15, 4.95, 5.65].forEach((by) => {
    const btn = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), iglooIceCrystalMat);
    btn.position.set(0, by, 1.98);
    iglooBodyRoot.add(btn);
  });

  // Articulated Giant Left & Right Snow Arms (Right arm waves warmly to Giant Player!)
  const iglooLeftArm = new THREE.Group();
  iglooLeftArm.position.set(-2.15, 5.25, 0);
  const lArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.85, 8, 12), iglooSnowMat);
  lArmMesh.position.set(-0.55, -0.75, 0.25);
  lArmMesh.rotation.z = -0.45;
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), iglooIceCrystalMat);
  lHand.position.set(-1.12, -1.65, 0.42);
  iglooLeftArm.add(lArmMesh, lHand);
  iglooBodyRoot.add(iglooLeftArm);

  const iglooRightArm = new THREE.Group();
  iglooRightArm.position.set(2.15, 5.25, 0);
  const rArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.85, 8, 12), iglooSnowMat);
  rArmMesh.position.set(0.55, -0.75, 0.25);
  rArmMesh.rotation.z = 0.45;
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), iglooIceCrystalMat);
  rHand.position.set(1.12, -1.65, 0.42);
  iglooRightArm.add(rArmMesh, rHand);
  iglooBodyRoot.add(iglooRightArm);

  // Friendly Sculpted Giant Head (top of head reaches ~8.8m!)
  const iglooHead = new THREE.Group();
  iglooHead.position.set(0, 7.25, 0);
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(1.38, 20, 16), iglooSnowMat);
  headSphere.castShadow = true;
  iglooHead.add(headSphere);

  // Expressive Glowing Cyan-Blue Eyes
  const iglooLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), iglooEyeGlowMat);
  iglooLeftEye.position.set(-0.46, 0.22, 1.24);
  const iglooRightEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), iglooEyeGlowMat);
  iglooRightEye.position.set(0.46, 0.22, 1.24);
  iglooHead.add(iglooLeftEye, iglooRightEye);

  // Translucent Ice Crystal Nose
  const crystalNose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 6), iglooIceCrystalMat);
  crystalNose.rotation.x = Math.PI / 2;
  crystalNose.position.set(0, -0.02, 1.56);
  iglooHead.add(crystalNose);

  // Warm Friendly Curved Smile (5 snow pebbles)
  [-0.5, -0.25, 0, 0.25, 0.5].forEach((sx, idx) => {
    const curveY = -0.36 - Math.cos((idx - 2) * 0.65) * 0.16;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), iglooSmileMat);
    dot.position.set(sx, curveY, 1.24 - Math.abs(sx) * 0.22);
    iglooHead.add(dot);
  });

  // Igloo Ice-Crystal Crown reaching 8.80m total height!
  const crownAngles = [-0.55, 0, 0.55, 1.15, -1.15];
  crownAngles.forEach((ang, idx) => {
    const spikeH = idx === 1 ? 0.92 : 0.68;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, spikeH, 5), iglooIceCrystalMat);
    spike.position.set(Math.sin(ang) * 0.82, 1.18 + (idx === 1 ? 0.14 : 0), Math.cos(ang) * 0.68);
    spike.rotation.z = -Math.sin(ang) * 0.28;
    iglooHead.add(spike);
  });
  iglooBodyRoot.add(iglooHead);

  // Orbiting Magical Snow Sparkles around Giant Igloo Man
  const iglooSparkles: THREE.Mesh[] = [];
  const sparkleGeo = new THREE.OctahedronGeometry(0.18, 0);
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Mesh(sparkleGeo, iglooIceCrystalMat);
    iglooManGroup.add(sp);
    iglooSparkles.push(sp);
  }
  group.add(iglooManGroup);

  colliders.push({
    id: 'giant_igloo_man_body',
    minX: igX - 5.6,
    maxX: igX + 5.6,
    minZ: igZ - 5.6,
    maxZ: igZ + 5.6,
  });

  interactables.push({
    id: 'greet_giant_igloo_man',
    kind: 'giant_igloo_man',
    label: `Greet Giant Igloo Man (${GIANT_IGLOO_MAN_HEIGHT_M.toFixed(1)}m)`,
    sublabel: 'பனி இக்லூ மனிதன் · Colossal friendly guardian of Panimalai Iceland',
    x: igX,
    y: igY,
    z: igZ,
    radius: 14.0,
    locationId: 'snow_mountains',
  });

  // Iceland Return Glacier Transfer Archway at (-64, -56) back to Iceland Express Halt!
  const retX = ICELAND_RETURN_GATE_POS.x;
  const retZ = ICELAND_RETURN_GATE_POS.z;
  const retY = groundHeightAt(retX, retZ);
  const retGate = new THREE.Group();
  retGate.position.set(retX, retY, retZ);
  retGate.rotation.y = 0.65;
  const retPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.6, 0.55), iglooIceCrystalMat);
  retPillarL.position.set(-2.2, 2.3, 0);
  const retPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.6, 0.55), iglooIceCrystalMat);
  retPillarR.position.set(2.2, 2.3, 0);
  const retLintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 0.7), iglooIceCrystalMat);
  retLintel.position.set(0, 4.65, 0);
  retGate.add(retPillarL, retPillarR, retLintel);
  group.add(retGate);

  interactables.push({
    id: 'iceland_return_to_halt',
    kind: 'iceland_return',
    label: 'Return to Iceland Express Halt',
    sublabel: 'ஐஸ்லாந்து ரயில் நிலையம் · Exit Iceland & restore normal scale',
    x: retX,
    y: retY,
    z: retZ,
    radius: 5.5,
    locationId: 'snow_mountains',
  });

  let iglooWaveTimer = 0;
  const triggerIglooManWave = () => {
    iglooWaveTimer = 4.5;
  };

  // =========================================================================
  // REGION 03: PACHAI VAYAL COUNTRYSIDE — RICE PADDIES & CASCADING WATERFALL
  // =========================================================================
  // Terraced Emerald Rice Paddies in (x: -10..26, z: 74..102)
  const paddyWaterMat = new THREE.MeshStandardMaterial({
    color: 0x5c967a,
    roughness: 0.18,
    metalness: 0.22,
  });
  for (let row = 0; row < 3; row++) {
    const px = 8 + row * 9.5;
    const pz = 88 + (row % 2) * 5.5;
    const py = groundHeightAt(px, pz);
    const berm = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.32, 11.4), darkWoodMat);
    berm.position.set(px, py + 0.08, pz);
    const paddy = new THREE.Mesh(new THREE.PlaneGeometry(8.1, 10.6), paddyWaterMat);
    paddy.rotation.x = -Math.PI / 2;
    paddy.position.set(px, py + 0.26, pz);
    group.add(berm, paddy);
  }

  // Mossy Waterfall Cliff & Animated Cascading Waterfall at WATERFALL_CENTER (-32, 112)
  const wfX = WATERFALL_CENTER.x;
  const wfZ = WATERFALL_CENTER.z;
  const wfBaseY = 0.25;

  const mossRockMat = new THREE.MeshStandardMaterial({ color: 0x546858, roughness: 0.94 });
  const cliffLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(7.6, 1), rockMat);
  cliffLeft.position.set(wfX - 10.6, wfBaseY + 6.4, wfZ + 8.8);
  cliffLeft.scale.set(1.0, 1.38, 0.85);
  const cliffRight = new THREE.Mesh(new THREE.DodecahedronGeometry(7.4, 1), rockMat);
  cliffRight.position.set(wfX + 10.6, wfBaseY + 6.1, wfZ + 8.6);
  cliffRight.scale.set(1.0, 1.32, 0.85);
  const cliffBack = new THREE.Mesh(new THREE.BoxGeometry(15.5, 15.2, 5.4), rockMat);
  cliffBack.position.set(wfX, wfBaseY + 7.2, wfZ + 9.6);
  const cliffCrest = new THREE.Mesh(new THREE.DodecahedronGeometry(6.8, 1), mossRockMat);
  cliffCrest.position.set(wfX, wfBaseY + 14.4, wfZ + 9.8);
  cliffCrest.scale.set(2.1, 0.42, 0.85);
  group.add(cliffLeft, cliffRight, cliffBack, cliffCrest);

  // Mossy framing boulders around the turquoise splash pool
  const poolBoulderSpecs = [
    { x: wfX - 8.2, z: wfZ + 0.8, r: 2.1 },
    { x: wfX + 8.4, z: wfZ + 0.2, r: 2.3 },
    { x: wfX - 6.8, z: wfZ - 5.2, r: 1.45 },
    { x: wfX + 7.1, z: wfZ - 4.8, r: 1.55 },
  ];
  for (const pb of poolBoulderSpecs) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(pb.r, 1), mossRockMat);
    rock.position.set(pb.x, wfBaseY + pb.r * 0.42, pb.z);
    rock.scale.set(1.2, 0.72, 1.0);
    group.add(rock);
  }

  const wfUniforms = {
    uTime: { value: 0 },
  };
  const waterfallMat = new THREE.ShaderMaterial({
    uniforms: wfUniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float flow = sin(vUv.x * 24.0 + sin(vUv.y * 10.0 + uTime * 5.0)) * 0.5 + 0.5;
        float streak = sin(vUv.x * 46.0) * 0.5 + 0.5;
        float cascade = fract(vUv.y * 3.0 + uTime * 1.45);
        vec3 aqua = vec3(0.45, 0.84, 0.94);
        vec3 foam = vec3(0.95, 0.99, 1.0);
        float whiteMix = smoothstep(0.35, 0.9, flow * 0.6 + streak * 0.4) * 0.65 + smoothstep(0.18, 0.0, vUv.y) * 0.55;
        vec3 col = mix(aqua, foam, clamp(whiteMix + (1.0 - cascade) * 0.15, 0.0, 1.0));
        float edgeFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        gl_FragColor = vec4(col, edgeFade * 0.92);
      }
    `,
  });
  const waterfallSheet = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 14.2, 8, 12), waterfallMat);
  waterfallSheet.position.set(wfX, wfBaseY + 7.1, wfZ + 5.8);
  waterfallSheet.rotation.y = Math.PI; // Faces north toward approaching player
  group.add(waterfallSheet);

  // Turquoise Waterfall Splash Pool + Foam Ring + Rising Mist Puffs
  const wfPool = new THREE.Mesh(
    new THREE.CircleGeometry(9.6, 28),
    new THREE.MeshStandardMaterial({ color: 0x3ba8bd, roughness: 0.14, metalness: 0.2 })
  );
  wfPool.rotation.x = -Math.PI / 2;
  wfPool.position.set(wfX, wfBaseY + 0.18, wfZ - 1.2);
  const wfFoam = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 20),
    new THREE.MeshStandardMaterial({
      color: 0xe6f8fc,
      transparent: true,
      opacity: 0.72,
      roughness: 0.4,
    })
  );
  wfFoam.rotation.x = -Math.PI / 2;
  wfFoam.position.set(wfX, wfBaseY + 0.22, wfZ + 3.4);
  group.add(wfPool, wfFoam);

  const mistPuffs: Array<{ mesh: THREE.Mesh; offset: number }> = [];
  for (let m = 0; m < 6; m++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.15, 8, 8), smokeMat);
    group.add(puff);
    mistPuffs.push({ mesh: puff, offset: m / 6 });
  }
  colliders.push({ id: 'waterfall_cliff', minX: wfX - 11, maxX: wfX + 11, minZ: wfZ + 3, maxZ: wfZ + 14 });

  // =========================================================================
  // REGION 04: NEELAM LAKE CAMPSITE (நீலம் ஏரி முகாம்)
  // =========================================================================
  const campX = CAMPSITE_CENTER.x;
  const campZ = CAMPSITE_CENTER.z;
  const campY = groundHeightAt(campX, campZ);

  const campGroup = new THREE.Group();
  campGroup.position.set(campX, campY, campZ);
  group.add(campGroup);

  // Pitchable Canvas Camping Tent
  const tentGroup = new THREE.Group();
  tentGroup.position.set(-2.6, 0, 1.5);
  tentGroup.rotation.y = 0.55;
  const tentBody = new THREE.Mesh(
    new THREE.ConeGeometry(2.15, 2.1, 4),
    new THREE.MeshStandardMaterial({ color: 0xe39b5d, roughness: 0.88 })
  );
  tentBody.rotation.y = Math.PI / 4;
  tentBody.position.y = 1.05;
  tentBody.castShadow = true;
  const tentDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x2b2530, roughness: 0.95, side: THREE.DoubleSide })
  );
  tentDoor.position.set(0, 0.68, 1.06);
  tentDoor.rotation.x = -0.35;
  const tentLantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), warmWinMat);
  tentLantern.position.set(1.25, 0.3, 1.3);
  tentGroup.add(tentBody, tentDoor, tentLantern);
  campGroup.add(tentGroup);

  // Folded Tent Roll (shown when tent is packed away)
  const packedRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xd98e52, roughness: 0.88 })
  );
  packedRoll.rotation.z = Math.PI / 2;
  packedRoll.position.set(-2.6, 0.28, 1.5);
  campGroup.add(packedRoll);

  // Stone-Ring Campfire + Logs + Flickering Flame + Embers + Dynamic Light
  const fireGroup = new THREE.Group();
  fireGroup.position.set(1.2, 0, -0.4);
  for (let s = 0; s < 10; s++) {
    const a = (s / 10) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), rockMat);
    stone.position.set(Math.cos(a) * 0.78, 0.14, Math.sin(a) * 0.78);
    fireGroup.add(stone);
  }
  for (let l = 0; l < 3; l++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.15, 6), darkWoodMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = l * (Math.PI / 3);
    log.position.y = 0.16;
    fireGroup.add(log);
  }

  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.05, 7),
    new THREE.MeshBasicMaterial({ color: 0xff6b24, transparent: true, opacity: 0.88 })
  );
  flameOuter.position.y = 0.56;
  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.72, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95 })
  );
  flameInner.position.y = 0.44;
  fireGroup.add(flameOuter, flameInner);

  const emberMeshes: THREE.Mesh[] = [];
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xffc65c });
  for (let e = 0; e < 8; e++) {
    const em = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 5), emberMat);
    fireGroup.add(em);
    emberMeshes.push(em);
  }

  const campfireLight = new THREE.PointLight(0xff8e3c, 0, 16, 1.6);
  campfireLight.position.set(0, 1.15, 0);
  fireGroup.add(campfireLight);
  campGroup.add(fireGroup);

  // Two Campfire Wooden Log Seats
  const logSeat1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.6, 8), woodMat);
  logSeat1.rotation.z = Math.PI / 2;
  logSeat1.position.set(1.2, 0.24, 1.9);
  const logSeat2 = logSeat1.clone();
  logSeat2.rotation.y = Math.PI * 0.42;
  logSeat2.position.set(3.2, 0.24, -0.3);
  campGroup.add(logSeat1, logSeat2);

  // Lakeside Wooden Cabin just west of campsite (x: 18, z: -13)
  const cabX = 18.5;
  const cabZ = -12.5;
  const cabY = groundHeightAt(cabX, cabZ);
  const lakeCabin = new THREE.Group();
  lakeCabin.position.set(cabX, cabY, cabZ);
  lakeCabin.rotation.y = 0.45;
  const lcBody = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 4.2), woodMat);
  lcBody.position.y = 1.5;
  const lcRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.9, 4), roofBlueMat);
  lcRoof.rotation.y = Math.PI / 4;
  lcRoof.position.y = 3.9;
  const lcWin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.12), warmWinMat);
  lcWin.position.set(0, 1.55, 2.12);
  lakeCabin.add(lcBody, lcRoof, lcWin);
  group.add(lakeCabin);
  colliders.push({ id: 'lake_cabin', minX: cabX - 2.9, maxX: cabX + 2.9, minZ: cabZ - 2.4, maxZ: cabZ + 2.4 });

  // Register Campsite Interactables
  interactables.push(
    {
      id: 'camp_tent_toggle',
      kind: 'camp_tent',
      label: 'Pitch / Pack Camping Tent',
      sublabel: 'நீலம் முகாம் · Lakeside shelter',
      x: campX - 2.4,
      y: campY,
      z: campZ + 1.8,
      radius: 2.9,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_fire_toggle',
      kind: 'camp_fire',
      label: 'Light / Extinguish Campfire',
      sublabel: 'நெருப்பு · Warm lakeside embers',
      x: campX + 1.2,
      y: campY,
      z: campZ - 0.4,
      radius: 2.8,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_cook_meal',
      kind: 'camp_cook',
      label: 'Cook Campfire Meal & Tea',
      sublabel: 'முகாம் சமையல் · Share with Frosty',
      x: campX + 2.5,
      y: campY,
      z: campZ - 1.5,
      radius: 2.7,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_sleep_stars',
      kind: 'camp_sleep',
      label: 'Camp Under Stars (Sleep to Sunrise)',
      sublabel: 'நட்சத்திர இரவு · Rest until 06:30',
      x: campX - 1.4,
      y: campY,
      z: campZ + 2.6,
      radius: 2.7,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_log_seat',
      kind: 'bench',
      label: 'Sit Beside Campfire',
      sublabel: 'நீலம் முகாம் · Watch the flames & stars',
      x: campX + 1.2,
      y: campY,
      z: campZ + 1.9,
      facingAngle: Math.PI,
      radius: 2.4,
      locationId: 'aomizu_lakeside',
    }
  );

  // =========================================================================
  // PER-FRAME UPDATE (OceanLab Gerstner waves, Lighthouse beam, Smoke, Waterfall, Campfire)
  // =========================================================================
  const update = (
    time: number,
    dt: number,
    sunDir: THREE.Vector3,
    skyColor: THREE.Color,
    sunColor: THREE.Color,
    lanternStrength: number,
    camping: CampingState,
    playerX = 0,
    playerZ = 0,
    weather: WeatherType = 'clear'
  ) => {
    const oceanParams = computeOceanWeatherParams(weather, activeOceanTheme);
    oceanUniforms.uTime.value = time;
    oceanUniforms.uSunDir.value.copy(sunDir);
    oceanUniforms.uSkyColor.value.copy(skyColor);
    oceanUniforms.uSunColor.value.copy(sunColor);
    oceanUniforms.uAmplitude.value = oceanParams.amplitude;
    oceanUniforms.uSteepness.value = oceanParams.steepness;
    oceanUniforms.uWavelength.value = oceanParams.wavelength;
    oceanUniforms.uSpread.value = oceanParams.spread;
    oceanUniforms.uChop.value = oceanParams.chop;
    oceanUniforms.uSSSIntensity.value = oceanParams.sssIntensity;
    oceanUniforms.uFoamIntensity.value = oceanParams.foamIntensity;

    lhBeamPivot.rotation.y = time * 0.55;
    beamMat.opacity = 0.08 + lanternStrength * 0.36;
    warmWinMat.emissiveIntensity = 0.25 + lanternStrength * 1.4;

    mooredBoats.forEach((b, idx) => {
      const bx = 118 + idx * 6.5;
      const bz = 74 + idx * 5.2;
      const relBedH = groundHeightAt(bx, bz) - WATER_LEVEL;
      const sample = evaluateGerstnerOceanCPU(bx, bz, time, oceanParams, relBedH);
      b.position.y = WATER_LEVEL + 0.24 + sample.y * 0.85;
      b.rotation.z = -sample.nx * 0.45;
      b.rotation.x = sample.nz * 0.38;
    });

    // Gentle Giant Igloo Man breathing, blinking, sparkles & friendly wave toward the Giant Player!
    const distToIgloo = Math.hypot(playerX - igX, playerZ - igZ);
    const breathe = Math.sin(time * 1.35);
    iglooBodyRoot.position.y = breathe * 0.14;
    iglooBodyRoot.scale.set(1 + breathe * 0.015, 1 - breathe * 0.01, 1 + breathe * 0.015);
    iglooHead.rotation.y = Math.sin(time * 0.55) * 0.18;
    iglooHead.rotation.z = Math.sin(time * 0.72) * 0.05;

    const blink = (time % 4.6) > 4.46 ? 0.14 : 1.0;
    iglooLeftEye.scale.y = blink;
    iglooRightEye.scale.y = blink;
    iglooEyeGlowMat.emissiveIntensity = 1.8 + lanternStrength * 1.6;
    iglooIceCrystalMat.emissiveIntensity = 0.65 + lanternStrength * 1.1;

    if (iglooWaveTimer > 0) iglooWaveTimer = Math.max(0, iglooWaveTimer - dt);
    const waving = iglooWaveTimer > 0 || distToIgloo < 48;
    if (waving) {
      iglooRightArm.rotation.z = 2.05 + Math.sin(time * 5.2) * 0.35;
      iglooRightArm.rotation.x = -0.25;
      iglooLeftArm.rotation.z = -0.15 + Math.sin(time * 1.8) * 0.08;
    } else {
      iglooRightArm.rotation.z += (0.08 - iglooRightArm.rotation.z) * Math.min(1, dt * 3.5);
      iglooRightArm.rotation.x += (0 - iglooRightArm.rotation.x) * Math.min(1, dt * 3.5);
      iglooLeftArm.rotation.z = Math.sin(time * 1.2) * 0.06;
    }

    for (let i = 0; i < iglooSparkles.length; i++) {
      const a = time * 0.55 + i * ((Math.PI * 2) / iglooSparkles.length);
      const r = 3.2 + (i % 3) * 0.75;
      const yOff = 1.4 + ((time * 0.7 + i * 0.85) % 7.4);
      iglooSparkles[i].position.set(Math.cos(a) * r, yOff, Math.sin(a) * r);
      iglooSparkles[i].rotation.y = time * 1.8 + i;
      iglooSparkles[i].rotation.x = time * 1.2;
    }

    for (const p of smokePuffs) {
      const cycle = (time * 0.18 + p.phase) % 1;
      p.mesh.position.set(
        p.baseX + Math.sin(time * 0.7 + p.phase * 6) * 0.55 * cycle,
        p.baseY + cycle * 4.5,
        p.baseZ + cycle * 0.85
      );
      const sc = 0.55 + cycle * 1.35;
      p.mesh.scale.setScalar(sc);
    }

    wfUniforms.uTime.value = time;
    for (const m of mistPuffs) {
      const cycle = (time * 0.32 + m.offset) % 1;
      const angle = m.offset * Math.PI * 2;
      m.mesh.position.set(
        wfX + Math.cos(angle) * (1.8 + cycle * 2.4),
        wfBaseY + 0.6 + cycle * 2.6,
        wfZ + 3.2 - cycle * 2.2
      );
      m.mesh.scale.setScalar(0.6 + cycle * 1.1);
    }

    tentGroup.visible = camping.tentPitched;
    packedRoll.visible = !camping.tentPitched;
    if (camping.tentPitched) {
      tentGroup.scale.x = 1 + Math.sin(time * 1.7) * 0.012;
    }

    flameOuter.visible = camping.fireLit;
    flameInner.visible = camping.fireLit;
    if (camping.fireLit) {
      const flicker = 0.88 + Math.sin(time * 14.0) * 0.12 + Math.cos(time * 21.0) * 0.08;
      flameOuter.scale.set(0.95 + Math.sin(time * 11) * 0.08, flicker * 1.05, 0.95);
      flameInner.scale.set(0.9, flicker * 0.95, 0.9);
      campfireLight.intensity = (1.6 + lanternStrength * 1.4) * flicker;
      for (let i = 0; i < emberMeshes.length; i++) {
        const em = emberMeshes[i];
        em.visible = true;
        const t = (time * 0.65 + i * 0.13) % 1;
        const ang = i * 1.9 + time * 1.5;
        em.position.set(Math.cos(ang) * (0.18 + t * 0.35), 0.35 + t * 2.3, Math.sin(ang) * (0.18 + t * 0.35));
        em.scale.setScalar(Math.max(0.2, 1 - t));
      }
    } else {
      campfireLight.intensity = 0;
      for (const em of emberMeshes) em.visible = false;
    }
  };

  return {
    group,
    colliders,
    interactables,
    triggerIglooManWave,
    setOceanTheme: applyOceanThemeUniforms,
    getOceanTheme: () => activeOceanTheme,
    update,
    dispose: () => {
      heightDataTexture.dispose();
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    },
  };
}
