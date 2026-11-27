import * as THREE from 'three';
import type { SkyPalette } from '../game/timeWeather';
import { LAKE_CENTER, LAKE_RX, LAKE_RZ, WATER_LEVEL } from '../game/terrain';
import { DINOSAUR_ISLAND_CENTER, DINOSAUR_ISLAND_RADIUS } from '../game/dinosaurIsland';

export interface SkyWaterRig {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    palette: SkyPalette,
    sunDir: THREE.Vector3,
    cameraX?: number,
    cameraZ?: number
  ) => void;
  dispose: () => void;
}

export function createSkyAndWater(scene: THREE.Scene): SkyWaterRig {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  // 1. Custom Anime Atmospheric Sky Dome Shader (Makoto Shinkai twilight gradient + glowing sun + stars + painted cirrus bands)
  const skyUniforms = {
    uZenith: { value: new THREE.Color(0x343b8c) },
    uMidSky: { value: new THREE.Color(0x8864a8) },
    uHorizon: { value: new THREE.Color(0xff9c7c) },
    uSunColor: { value: new THREE.Color(0xff9966) },
    uCloudLit: { value: new THREE.Color(0xffcdb8) },
    uCloudShadow: { value: new THREE.Color(0x6c5994) },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.14, -0.78).normalize() },
    uStarOpacity: { value: 0.25 },
    uNightDarkness: { value: 0.0 },
    uCloudStrength: { value: 1.0 },
    uTime: { value: 0 },
  };

  const skyGeo = new THREE.SphereGeometry(2400, 36, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uZenith;
      uniform vec3 uMidSky;
      uniform vec3 uHorizon;
      uniform vec3 uSunColor;
      uniform vec3 uCloudLit;
      uniform vec3 uCloudShadow;
      uniform vec3 uSunDir;
      uniform float uStarOpacity;
      uniform float uNightDarkness;
      uniform float uCloudStrength;
      uniform float uTime;

      varying vec3 vWorldDir;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 4; i++) {
          v += amp * vnoise(p);
          p = p * 2.06 + vec2(11.3, 6.9);
          amp *= 0.48;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);

        // Rich multi-stop anime sky gradient (horizon peach -> mid lavender/pink -> deep indigo zenith)
        vec3 lower = mix(uHorizon, uMidSky, smoothstep(0.0, 0.24, h));
        vec3 col = mix(lower, uZenith, smoothstep(0.18, 0.78, h));

        // Golden-peach horizon bloom toward sun direction (suppressed at full-dark night)
        float daySunVis = 1.0 - uNightDarkness * 0.96;
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float horizonGlow = pow(1.0 - h, 3.6) * (0.38 + 0.62 * pow(sunDot, 1.8));
        col += uSunColor * horizonGlow * 0.48 * daySunVis;

        // Crisp sun/moon disc + soft atmospheric halo
        float sunDisc = smoothstep(0.9986, 0.9994, sunDot);
        float sunHalo = pow(sunDot, 14.0) * 0.42 + pow(sunDot, 84.0) * 0.52;
        col += uSunColor * (sunHalo * 0.68 + sunDisc * 1.6) * daySunVis;

        // Layered painted anime cloud streaks across upper & mid sky (cleared completely over Dinosaur Island!)
        if (dir.y > 0.015 && uCloudStrength > 0.01) {
          vec2 uv1 = dir.xz / (dir.y + 0.19) * 1.15 + vec2(uTime * 0.006, uTime * 0.002);
          float cBase = fbm(uv1 * 1.35);
          float cDetail = fbm(uv1 * 3.1 - vec2(uTime * 0.004, 0.0));
          float bandFade = smoothstep(0.015, 0.16, dir.y) * smoothstep(0.9, 0.28, dir.y);
          float cloudMask = smoothstep(0.45, 0.75, cBase * 0.68 + cDetail * 0.32) * bandFade;
          float litMix = smoothstep(0.32, 0.85, cDetail * 0.75 + sunDot * 0.5 + (1.0 - h) * 0.25);
          vec3 cloudCol = mix(uCloudShadow, uCloudLit, litMix);
          col = mix(col, cloudCol, cloudMask * 0.78 * (1.0 - uNightDarkness * 0.78) * uCloudStrength);
        }

        // Delicate twinkling stars at twilight / night
        if (uStarOpacity > 0.01 && dir.y > 0.12) {
          vec2 starGrid = floor((dir.xz / (dir.y + 0.35)) * 130.0);
          float starRand = hash21(starGrid);
          if (starRand > 0.989) {
            float twinkle = 0.6 + 0.4 * sin(uTime * 2.4 + starRand * 120.0);
            float starAlpha = smoothstep(0.12, 0.38, dir.y) * uStarOpacity * twinkle;
            col += vec3(0.96, 0.97, 1.0) * starAlpha * 0.9;
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.frustumCulled = false;
  group.add(skyDome);
  disposables.push(skyGeo, skyMat);

  // 2. Painterly Sculpted Towering Anime Cumulus Clouds (distant & grand on the horizon like reference images #2, #3, #12!)
  const cloudUniforms = {
    uCloudLit: { value: new THREE.Color(0xffcdb8) },
    uCloudShadow: { value: new THREE.Color(0x6c5994) },
    uHorizon: { value: new THREE.Color(0xff9c7c) },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.14, -0.78).normalize() },
  };

  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: cloudUniforms,
    vertexShader: `
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uCloudLit;
      uniform vec3 uCloudShadow;
      uniform vec3 uHorizon;
      uniform vec3 uSunDir;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float n3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash31(i);
        float b = hash31(i + vec3(1,0,0));
        float c = hash31(i + vec3(0,1,0));
        float d = hash31(i + vec3(1,1,0));
        float e = hash31(i + vec3(0,0,1));
        float g = hash31(i + vec3(1,0,1));
        float h = hash31(i + vec3(0,1,1));
        float k = hash31(i + vec3(1,1,1));
        return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
      }

      void main() {
        vec3 n = normalize(vNormalW);
        float puffNoise = n3(vWorldPos * 0.045) * 0.55 + n3(vWorldPos * 0.11) * 0.25;
        float sunLight = dot(n, normalize(uSunDir)) * 0.5 + 0.5;
        float topLight = clamp(n.y * 0.55 + 0.5, 0.0, 1.0);

        // Soft anime cel-painted billow lighting
        float lit = smoothstep(0.28, 0.78, sunLight * 0.55 + topLight * 0.42 + (puffNoise - 0.35) * 0.35);
        vec3 col = mix(uCloudShadow, uCloudLit, lit);
        // Subtle peach warm rim along sunlit edge
        float edgeGlow = smoothstep(0.65, 0.96, sunLight * topLight);
        col += uCloudLit * edgeGlow * 0.18;

        // Soften silhouette edges so clouds feel painted & fluffy rather than hard geometric balls
        float facing = clamp(abs(dot(n, normalize(vViewDir))), 0.0, 1.0);
        float alpha = smoothstep(0.08, 0.58, facing + (puffNoise - 0.35) * 0.32) * 0.92;
        // Blend base gently into horizon haze
        float baseHaze = smoothstep(32.0, 72.0, vWorldPos.y);
        col = mix(uHorizon, col, 0.35 + baseHaze * 0.65);

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  disposables.push(cloudMat);

  const puffGeo = new THREE.IcosahedronGeometry(1, 3);
  disposables.push(puffGeo);

  const cloudClusters: Array<{ group: THREE.Group; baseAngle: number; radius: number; height: number; speed: number }> = [];
  // Keep distant horizon clouds far beyond Dinosaur Island (r >= 1350m, y >= 220m) so zero white clouds ever appear over or inside Dinosaur Island!
  const clusterSpecs = [
    { angle: 1.55, radius: 1380, height: 235, scale: 52, puffs: 10, speed: 0.0012 },
    { angle: 2.35, radius: 1460, height: 245, scale: 48, puffs: 9, speed: 0.0010 },
    { angle: -1.15, radius: 1400, height: 255, scale: 50, puffs: 9, speed: 0.0011 },
    { angle: -2.05, radius: 1520, height: 225, scale: 46, puffs: 8, speed: 0.0009 },
    { angle: 3.15, radius: 1420, height: 240, scale: 50, puffs: 9, speed: 0.0011 },
  ];

  clusterSpecs.forEach((spec, idx) => {
    const cg = new THREE.Group();
    for (let i = 0; i < spec.puffs; i++) {
      const m = new THREE.Mesh(puffGeo, cloudMat);
      const frac = i / spec.puffs;
      const spread = (1.15 - frac * 0.55) * spec.scale * 1.35;
      const px = Math.cos(frac * Math.PI * 2.4 + idx * 1.1) * spread;
      const py = (i < 5 ? -0.15 : (i - 4) * 0.36) * spec.scale;
      const pz = Math.sin(frac * Math.PI * 2.4 + idx * 1.1) * 0.42 * spec.scale;
      const s = spec.scale * (0.52 + (1 - Math.abs(frac - 0.42)) * 0.52);
      m.position.set(px, py, pz);
      m.scale.set(s * 1.38, s * 0.85, s * 0.9);
      cg.add(m);
    }
    cg.position.set(
      Math.cos(spec.angle) * spec.radius,
      spec.height,
      Math.sin(spec.angle) * spec.radius
    );
    cg.lookAt(0, spec.height * 0.75, 0);
    group.add(cg);
    cloudClusters.push({
      group: cg,
      baseAngle: spec.angle,
      radius: spec.radius,
      height: spec.height,
      speed: spec.speed,
    });
  });

  // 3. Continuous Layered Japanese Mountain Range Silhouettes (smooth undulating ridges, zero sharp low-poly cones!)
  const buildMountainRing = (
    radius: number,
    baseHeight: number,
    peakAmp: number,
    seed: number,
    mat: THREE.Material
  ) => {
    const segs = 128;
    const geo = new THREE.CylinderGeometry(radius, radius + 24, 1, segs, 1, true);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      if (y > 0) {
        const ridge =
          Math.sin(ang * 4.0 + seed) * 0.45 +
          Math.sin(ang * 9.0 + seed * 2.1) * 0.28 +
          Math.cos(ang * 15.0 - seed * 1.4) * 0.16 +
          Math.sin(ang * 23.0 + seed * 3.3) * 0.08;
        const h = baseHeight + (ridge * 0.5 + 0.5) * peakAmp;
        pos.setY(i, h);
      } else {
        pos.setY(i, -12);
      }
    }
    geo.computeVertexNormals();
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = -1;
    group.add(mesh);
    return mesh;
  };

  const mountainMatFar = new THREE.MeshBasicMaterial({
    color: 0x4b4878,
    side: THREE.DoubleSide,
    fog: true,
  });
  const mountainMatMid = new THREE.MeshBasicMaterial({
    color: 0x3b4469,
    side: THREE.DoubleSide,
    fog: true,
  });
  disposables.push(mountainMatFar, mountainMatMid);

  buildMountainRing(1680, 38, 86, 0.7, mountainMatFar);
  buildMountainRing(1520, 22, 52, 2.4, mountainMatMid);

  // 4. Reflective Calm Lakeside Water (Aomizu Lake) with glassy sunset mirror reflections & shimmering ripple bands
  const waterUniforms = {
    uTime: { value: 0 },
    uHorizon: { value: new THREE.Color(0xff9c7c) },
    uZenith: { value: new THREE.Color(0x343b8c) },
    uMidSky: { value: new THREE.Color(0x8864a8) },
    uWaterTint: { value: new THREE.Color(0x544b82) },
    uSunColor: { value: new THREE.Color(0xff9966) },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.14, -0.78).normalize() },
    uFogColor: { value: new THREE.Color(0xc98b9e) },
    uFogDensity: { value: 0.004 },
  };

  const waterGeo = new THREE.CircleGeometry(1, 64);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: waterUniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        // Gentle lake swell displacement matched to OceanLab wave cadence
        float edge = length(uv - vec2(0.5)) * 2.0;
        float swellMask = smoothstep(1.0, 0.25, edge);
        wp.y += (sin(wp.x * 0.22 + uTime * 1.4) * 0.045 + cos(wp.z * 0.26 - uTime * 1.15) * 0.035) * swellMask;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform vec3 uHorizon;
      uniform vec3 uZenith;
      uniform vec3 uMidSky;
      uniform vec3 uWaterTint;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform vec3 uFogColor;
      uniform float uFogDensity;

      varying vec3 vWorldPos;
      varying vec2 vUv;

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
        vec2 shift = vec2(t * 0.72, -t * 0.48);
        for (int i = 0; i < 5; i++) {
          val += amp * noise2D(p + shift);
          p = rotMat * p * 2.12;
          shift = rotMat * shift * 1.32;
          amp *= 0.48;
        }
        return val;
      }

      float computeCaustics(vec2 p, float t) {
        vec2 uv1 = p * 0.92 + vec2(t * 0.35, -t * 0.25);
        vec2 uv2 = rotMat * p * 1.2 - vec2(t * 0.3, t * 0.4);
        float n1 = abs(noise2D(uv1) - 0.5);
        float n2 = abs(noise2D(uv2) - 0.5);
        return pow(1.0 - clamp((n1 + n2) * 2.2, 0.0, 1.0), 3.4);
      }

      void main() {
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);
        float dist = length(cameraPosition - vWorldPos);
        float detailFade = exp(-dist * 0.0045);

        vec2 uv = vWorldPos.xz * 0.40;
        float eps = 0.08;
        float h0 = capillaryFBM(uv, uTime);
        float hx = capillaryFBM(uv + vec2(eps, 0.0), uTime);
        float hz = capillaryFBM(uv + vec2(0.0, eps), uTime);
        vec3 N = normalize(vec3(-(hx - h0) / eps * 0.14 * detailFade, 1.0, -(hz - h0) / eps * 0.14 * detailFade));

        float NoV = clamp(dot(N, V), 0.001, 1.0);
        float NoL = clamp(dot(N, L), 0.0, 1.0);
        float sunElev = clamp(L.y, 0.0, 1.0);
        float dayFactor = smoothstep(-0.14, 0.16, L.y);
        float lightScale = 0.25 + 0.75 * dayFactor;

        // Schlick Fresnel reflection of live DREAMLINE sky dome
        float fresnel = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
        vec3 R = reflect(-V, N);
        R.y = max(R.y, 0.015);
        vec3 skyLow = mix(uHorizon, uMidSky, smoothstep(0.0, 0.25, R.y));
        vec3 skyRefl = mix(skyLow, uZenith, smoothstep(0.2, 0.75, R.y));
        vec3 skyReflLin = pow(clamp(skyRefl, 0.001, 1.0), vec3(2.2));

        // Optical depth across lake basin: shallow turquoise shore with caustics -> deep emerald-teal center
        float edge = length(vUv - vec2(0.5)) * 2.0;
        float opticalDepth = max(0.05, (1.0 - edge) * 5.8);
        vec3 abyssal = vec3(0.008, 0.052, 0.072) * (0.45 + 0.65 * sunElev) * lightScale;
        vec3 shallow = vec3(0.032, 0.305, 0.275) * (0.55 + 0.60 * sunElev) * lightScale;
        vec3 deepWater = mix(shallow, abyssal, pow(1.0 - NoV, 0.65));

        float seabedVis = exp(-opticalDepth * 0.52);
        float caustics = computeCaustics(vWorldPos.xz + N.xz * 0.55, uTime) * smoothstep(4.2, 0.2, opticalDepth) * dayFactor;
        vec3 sandBed = vec3(0.76, 0.68, 0.52) * (0.36 + 0.58 * max(L.y, 0.15)) * lightScale + vec3(1.0, 0.95, 0.80) * caustics * 0.45;
        vec3 waterBody = mix(deepWater, shallow, exp(-opticalDepth * 0.22));
        waterBody = mix(waterBody, sandBed, seabedVis * 0.72);

        vec3 col = mix(waterBody, skyReflLin, clamp(fresnel * 0.92 + 0.08, 0.0, 0.96));

        // Crisp OceanLab solar specular glitter path
        vec3 H = normalize(L + V);
        float NoH = max(dot(N, H), 0.0);
        vec3 sunLin = pow(clamp(uSunColor, 0.01, 1.0), vec3(2.0));
        col += sunLin * (pow(NoH, 640.0) * 5.2 + pow(NoH, 42.0) * 0.32) * (0.25 + 0.75 * fresnel) * max(NoL, 0.08);

        // Shoreline swash foam lace around lake edge
        float bubble = smoothstep(0.24, 0.76, noise2D(vWorldPos.xz * 2.2 + vec2(uTime * 0.3, -uTime * 0.2)));
        float swash = smoothstep(0.68, 0.94, edge) * (0.5 + 0.5 * sin(edge * 22.0 - uTime * 2.6)) * bubble * detailFade;
        vec3 foamCol = vec3(0.92, 0.96, 0.98) * lightScale * (0.45 + 0.55 * max(NoL, 0.25));
        col = mix(col, foamCol, clamp(swash * 0.65, 0.0, 0.75));

        // ACES tone mapping + gamma
        col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
        col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        float alpha = smoothstep(1.0, 0.84, edge) * 0.96;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(LAKE_CENTER.x, WATER_LEVEL, LAKE_CENTER.z);
  waterMesh.scale.set(LAKE_RX * 1.08, 1, LAKE_RZ * 1.08);
  group.add(waterMesh);
  disposables.push(waterGeo, waterMat);

  scene.add(group);

  const tmpFog = new THREE.Color();
  const tmpZenith = new THREE.Color();

  const update = (
    elapsed: number,
    _dt: number,
    palette: SkyPalette,
    sunDir: THREE.Vector3,
    cameraX = 0,
    cameraZ = 0
  ) => {
    // Keep the sky dome centered around the camera so it never clips against the far plane!
    skyDome.position.set(cameraX, 0, cameraZ);

    skyUniforms.uZenith.value.setRGB(palette.zenith.r, palette.zenith.g, palette.zenith.b);
    skyUniforms.uMidSky.value.setRGB(palette.midSky.r, palette.midSky.g, palette.midSky.b);
    skyUniforms.uHorizon.value.setRGB(palette.horizon.r, palette.horizon.g, palette.horizon.b);
    skyUniforms.uSunColor.value.setRGB(palette.sunColor.r, palette.sunColor.g, palette.sunColor.b);
    skyUniforms.uCloudLit.value.setRGB(palette.cloudLit.r, palette.cloudLit.g, palette.cloudLit.b);
    skyUniforms.uCloudShadow.value.setRGB(palette.cloudShadow.r, palette.cloudShadow.g, palette.cloudShadow.b);
    skyUniforms.uSunDir.value.copy(sunDir);
    skyUniforms.uStarOpacity.value = palette.starOpacity;
    skyUniforms.uNightDarkness.value = palette.nightDarkness;
    skyUniforms.uTime.value = elapsed;

    // Smoothly clear all white clouds when exploring Dinosaur Island so the sky & sanctuary are 100% crisp!
    const distCamToDino = Math.hypot(
      cameraX - DINOSAUR_ISLAND_CENTER.x,
      cameraZ - DINOSAUR_ISLAND_CENTER.z
    );
    const dinoClearBlend = Math.max(
      0,
      Math.min(1, (distCamToDino - (DINOSAUR_ISLAND_RADIUS + 40)) / 180)
    );
    skyUniforms.uCloudStrength.value = dinoClearBlend;

    cloudUniforms.uCloudLit.value.setRGB(palette.cloudLit.r, palette.cloudLit.g, palette.cloudLit.b);
    cloudUniforms.uCloudShadow.value.setRGB(palette.cloudShadow.r, palette.cloudShadow.g, palette.cloudShadow.b);
    cloudUniforms.uHorizon.value.setRGB(palette.horizon.r, palette.horizon.g, palette.horizon.b);
    cloudUniforms.uSunDir.value.copy(sunDir);
    const showClouds = palette.nightDarkness < 0.85 && dinoClearBlend > 0.25;
    for (let i = 0; i < cloudClusters.length; i++) {
      cloudClusters[i].group.visible = showClouds;
    }

    for (let i = 0; i < cloudClusters.length; i++) {
      const c = cloudClusters[i];
      const ang = c.baseAngle + elapsed * c.speed;
      c.group.position.set(Math.cos(ang) * c.radius, c.height, Math.sin(ang) * c.radius);
      c.group.lookAt(0, c.height * 0.75, 0);
    }

    // Soft layered atmospheric perspective on distant Japanese mountain silhouettes
    tmpZenith.setRGB(palette.zenith.r, palette.zenith.g, palette.zenith.b);
    tmpFog.setRGB(palette.fogColor.r, palette.fogColor.g, palette.fogColor.b);
    mountainMatFar.color.copy(tmpZenith).lerp(tmpFog, 0.56);
    mountainMatMid.color.copy(tmpZenith).lerp(tmpFog, 0.34);

    waterUniforms.uTime.value = elapsed;
    waterUniforms.uHorizon.value.setRGB(palette.horizon.r, palette.horizon.g, palette.horizon.b);
    waterUniforms.uMidSky.value.setRGB(palette.midSky.r, palette.midSky.g, palette.midSky.b);
    waterUniforms.uZenith.value.setRGB(palette.zenith.r, palette.zenith.g, palette.zenith.b);
    waterUniforms.uWaterTint.value.setRGB(palette.waterTint.r, palette.waterTint.g, palette.waterTint.b);
    waterUniforms.uSunColor.value.setRGB(palette.sunColor.r, palette.sunColor.g, palette.sunColor.b);
    waterUniforms.uSunDir.value.copy(sunDir);
    waterUniforms.uFogColor.value.setRGB(palette.fogColor.r, palette.fogColor.g, palette.fogColor.b);
    waterUniforms.uFogDensity.value = palette.fogDensity;
  };

  return {
    group,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.remove(group);
    },
  };
}
