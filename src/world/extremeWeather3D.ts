import * as THREE from 'three';
import type { RegionId, SeasonType, WeatherType } from '../game/types';
import {
  getWeatherProfile,
  type ExtremeWeatherState,
} from '../game/extremeWeather';
import { WATER_LEVEL } from '../game/terrain';

export interface ExtremeWeather3DSystem {
  group: THREE.Group;
  update: (params: {
    elapsed: number;
    dt: number;
    weather: WeatherType;
    season: SeasonType;
    regionId: RegionId;
    playerX: number;
    playerZ: number;
    state: ExtremeWeatherState;
    sunDir: THREE.Vector3;
    skyColor: THREE.Color;
    fogColor: THREE.Color;
    fogDensity: number;
  }) => void;
  dispose: () => void;
}

// Pre-allocated scratch math objects (zero GC in render loop)
const _dummy = new THREE.Object3D();
const _segStart = new THREE.Vector3();
const _segEnd = new THREE.Vector3();
const _segMid = new THREE.Vector3();
const _segDir = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

/**
 * High-impact 3D Extreme Weather Visual Rig:
 * 1. Dense Instanced Slanted 3D Raindrop Streak Quads (thick, anime-crisp pouring sheets!)
 * 2. Thick Glowing 3D Forked Lightning Bolt Cylinders + Sky Flash Halo
 * 3. Alias-Free Animated Valley Floodwater Surface (organic multi-angle waves + raindrop rings)
 * 4. Towering Curved 3D Breaking Tsunami Ocean Wave Wall + White Foam Crest + Spray Particles
 */
export function createExtremeWeather3D(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): ExtremeWeather3DSystem {
  const group = new THREE.Group();
  group.name = 'ExtremeWeather3D';
  scene.add(group);

  const disposables: Array<{ dispose: () => void }> = [];

  // Deterministic PRNG
  let rng = 948271;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };

  // =========================================================================
  // 1. DENSE SLANTED 3D RAINDROP STREAK QUADS (InstancedMesh — visible even on 1px-line WebGL!)
  // =========================================================================
  const maxDrops = isSoftwareGl ? 620 : 1350;
  const dropBoxXZ = 36;
  const dropBoxY = 22;
  const dropPos = new Float32Array(maxDrops * 3);
  const dropScale = new Float32Array(maxDrops);
  const dropYaw = new Float32Array(maxDrops);

  for (let i = 0; i < maxDrops; i++) {
    dropPos[i * 3] = (rand() - 0.5) * dropBoxXZ;
    dropPos[i * 3 + 1] = rand() * dropBoxY;
    dropPos[i * 3 + 2] = (rand() - 0.5) * dropBoxXZ;
    dropScale[i] = 0.72 + rand() * 0.78;
    dropYaw[i] = rand() * Math.PI;
  }

  // Crossed thin quad pair so streaks read cleanly from every camera orbit angle
  const dropGeo = new THREE.PlaneGeometry(0.042, 1.75);
  disposables.push(dropGeo);

  const dropMat = new THREE.MeshBasicMaterial({
    color: 0xd8ecff,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(dropMat);

  const rainInst = new THREE.InstancedMesh(dropGeo, dropMat, maxDrops);
  rainInst.frustumCulled = false;
  rainInst.visible = false;
  rainInst.count = 0;
  group.add(rainInst);

  // =========================================================================
  // 2. THICK GLOWING 3D FORKED LIGHTNING BOLT RIG (Instanced Cylinder Segments)
  // =========================================================================
  const boltSegCount = 26;
  const boltCylGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.0, 5, 1);
  disposables.push(boltCylGeo);

  const boltMat = new THREE.MeshBasicMaterial({
    color: 0xf2faff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(boltMat);

  const boltInst = new THREE.InstancedMesh(boltCylGeo, boltMat, boltSegCount);
  boltInst.frustumCulled = false;
  boltInst.visible = false;
  group.add(boltInst);

  // Glowing electric cloud flash halo high in the storm sky
  const haloGeo = new THREE.CircleGeometry(26, 24);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xd4eeff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(haloGeo, haloMat);
  const boltHalo = new THREE.Mesh(haloGeo, haloMat);
  boltHalo.visible = false;
  group.add(boltHalo);

  let lastLightningSeed = -1;

  function placeBoltSegment(
    idx: number,
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    thickness: number
  ): void {
    _segStart.set(ax, ay, az);
    _segEnd.set(bx, by, bz);
    _segMid.addVectors(_segStart, _segEnd).multiplyScalar(0.5);
    _segDir.subVectors(_segEnd, _segStart);
    const len = Math.max(0.1, _segDir.length());
    _segDir.divideScalar(len);
    _quat.setFromUnitVectors(_upAxis, _segDir);

    _dummy.position.copy(_segMid);
    _dummy.quaternion.copy(_quat);
    _dummy.scale.set(thickness, len * 1.06, thickness);
    _dummy.updateMatrix();
    boltInst.setMatrixAt(idx, _dummy.matrix);
  }

  function rebuildLightningBolt(seed: number, anchorX: number, anchorZ: number): void {
    let s = (seed * 7919 + 104729) >>> 0;
    const r = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    const angle = r() * Math.PI * 2;
    const dist = 34 + r() * 42;
    const baseX = anchorX + Math.cos(angle) * dist;
    const baseZ = anchorZ + Math.sin(angle) * dist;
    const topY = 62 + r() * 16;

    boltHalo.position.set(baseX, topY - 4, baseZ);
    boltHalo.lookAt(anchorX, 6, anchorZ);

    let cx = baseX;
    let cy = topY;
    let cz = baseZ;
    let segIdx = 0;

    const trunkNodes: Array<[number, number, number]> = [[cx, cy, cz]];
    const trunkSteps = 14;
    for (let i = 0; i < trunkSteps; i++) {
      const nx = cx + (r() - 0.5) * 9.0;
      const ny = cy - topY / trunkSteps;
      const nz = cz + (r() - 0.5) * 9.0;
      const thick = 1.65 - (i / trunkSteps) * 0.7;
      placeBoltSegment(segIdx++, cx, cy, cz, nx, ny, nz, thick);
      cx = nx;
      cy = ny;
      cz = nz;
      trunkNodes.push([cx, cy, cz]);
    }

    const forkStarts = [3, 6, 9];
    for (let f = 0; f < forkStarts.length; f++) {
      const start = trunkNodes[forkStarts[f]];
      let bx = start[0];
      let by = start[1];
      let bz = start[2];
      const dirX = (r() > 0.5 ? 1 : -1) * (2.8 + r() * 3.8);
      const dirZ = (r() - 0.5) * 5.0;
      for (let step = 0; step < 4 && segIdx < boltSegCount; step++) {
        const nx = bx + dirX + (r() - 0.5) * 2.4;
        const ny = by - (3.2 + r() * 2.6);
        const nz = bz + dirZ + (r() - 0.5) * 2.4;
        const thick = 0.85 - step * 0.14;
        placeBoltSegment(segIdx++, bx, by, bz, nx, ny, nz, thick);
        bx = nx;
        by = ny;
        bz = nz;
      }
    }

    boltInst.instanceMatrix.needsUpdate = true;
  }

  // =========================================================================
  // 3. ALIAS-FREE ANIMATED VALLEY FLOODWATER SURFACE (Multi-Angle Organic Ripples)
  // =========================================================================
  const floodUniforms = {
    uTime: { value: 0 },
    uRainIntensity: { value: 0.8 },
    uSkyColor: { value: new THREE.Color(0x465d72) },
    uDeepColor: { value: new THREE.Color(0x133344) },
    uShallowColor: { value: new THREE.Color(0x23596e) },
    uFogColor: { value: new THREE.Color(0x465d72) },
    uFogDensity: { value: 0.0108 },
    uSunDir: { value: new THREE.Vector3(0.3, 0.5, 0.5).normalize() },
    uLightning: { value: 0 },
  };

  const floodGeo = new THREE.PlaneGeometry(360, 360, isSoftwareGl ? 18 : 34, isSoftwareGl ? 18 : 34);
  floodGeo.rotateX(-Math.PI / 2);
  disposables.push(floodGeo);

  const floodMat = new THREE.ShaderMaterial({
    uniforms: floodUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vSwell;
      void main() {
        vec3 pos = position;
        float w1 = sin(pos.x * 0.11 + pos.z * 0.07 + uTime * 2.1);
        float w2 = cos(pos.x * -0.06 + pos.z * 0.13 - uTime * 1.7) * 0.7;
        pos.y += (w1 + w2) * 0.06;
        vSwell = (w1 + w2) * 0.5;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uRainIntensity;
      uniform vec3 uSkyColor;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec3 uSunDir;
      uniform float uLightning;
      varying vec3 vWorldPos;
      varying float vSwell;

      void main() {
        vec2 p = vWorldPos.xz;
        float dist = length(cameraPosition - vWorldPos);
        // Attenuate micro-ripples with distance so far floodwater NEVER aliases or stripes!
        float detailFade = smoothstep(72.0, 10.0, dist);

        // 3 non-orthogonal rotated wave octaves for natural organic water texture
        float a1 = dot(p, vec2(0.86, 0.51)) * 0.42 + uTime * 2.6;
        float a2 = dot(p, vec2(-0.44, 0.90)) * 0.58 - uTime * 2.1;
        float a3 = dot(p, vec2(0.29, -0.96)) * 0.95 + uTime * 3.4;

        float nx = (cos(a1) * 0.45 - cos(a2) * 0.35 + cos(a3) * 0.22) * 0.11 * detailFade;
        float nz = (sin(a1) * 0.35 + cos(a2) * 0.45 - sin(a3) * 0.22) * 0.11 * detailFade;
        vec3 normal = normalize(vec3(nx, 1.0, nz));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        // Soft animated raindrop splash rings only visible within medium range
        float splashRing = 0.0;
        if (detailFade > 0.05) {
          vec2 grid = p * 0.32;
          vec2 cell = fract(grid) - 0.5;
          float cellDist = length(cell);
          float h = fract(sin(dot(floor(grid), vec2(127.1, 311.7))) * 43758.5453);
          float ringPhase = fract(uTime * 1.25 + h);
          splashRing = smoothstep(0.055, 0.0, abs(cellDist - ringPhase * 0.4))
            * (1.0 - ringPhase) * uRainIntensity * detailFade;
        }

        vec3 baseWater = mix(uDeepColor, uShallowColor, clamp(0.45 + vSwell * 0.22, 0.0, 1.0));
        vec3 col = mix(baseWater, uSkyColor * (0.95 + uLightning * 0.65), clamp(fresnel * 0.58 + 0.12, 0.0, 0.78));

        // Gentle organic white foam flecks & rain splash shimmer
        float foam = smoothstep(0.68, 1.0, sin(a1) * 0.5 + sin(a2) * 0.5) * 0.18 * detailFade;
        col += vec3(0.74, 0.88, 0.95) * (foam + splashRing * 0.32);

        vec3 halfV = normalize(uSunDir + viewDir);
        float spec = pow(max(dot(normal, halfV), 0.0), 48.0) * (0.28 + uLightning * 0.85) * (0.35 + 0.65 * detailFade);
        col += vec3(0.84, 0.93, 1.0) * spec;

        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 0.96));

        gl_FragColor = vec4(col, 0.86);
      }
    `,
  });
  disposables.push(floodMat);

  const floodMesh = new THREE.Mesh(floodGeo, floodMat);
  floodMesh.position.y = WATER_LEVEL;
  floodMesh.visible = false;
  floodMesh.renderOrder = 2;
  group.add(floodMesh);

  // =========================================================================
  // 4. TOWERING CURVED 3D BREAKING TSUNAMI WAVE WALL + WHITE FOAM CREST + SPRAY
  // =========================================================================
  const tsunamiGroup = new THREE.Group();
  tsunamiGroup.visible = false;
  group.add(tsunamiGroup);

  const zSegs = isSoftwareGl ? 32 : 56;
  const profileSegs = 22;
  const waveSpanZ = 260;
  const wavePositions: number[] = [];
  const waveUvs: number[] = [];
  const waveIndices: number[] = [];

  for (let iz = 0; iz <= zSegs; iz++) {
    const v = iz / zSegs;
    const z = (v - 0.5) * waveSpanZ;
    const zCurveX = Math.sin(v * Math.PI * 5.0) * 3.8 + Math.cos(v * Math.PI * 2.0) * 4.5;
    const zHeightMod = 0.88 + Math.sin(v * Math.PI * 3.0) * 0.14;

    for (let ip = 0; ip <= profileSegs; ip++) {
      const u = ip / profileSegs;
      let px: number;
      let py: number;

      if (u < 0.58) {
        const t = u / 0.58;
        px = 24.0 * (1.0 - t) + 1.0 * t;
        py = Math.pow(t, 1.45) * 0.94;
      } else {
        const t = (u - 0.58) / 0.42;
        const theta = t * Math.PI * 1.18;
        px = 1.0 - Math.sin(theta) * 5.8 - t * 3.2;
        py = 0.94 + Math.sin(theta) * 0.12 - (1.0 - Math.cos(theta)) * 0.24;
      }

      wavePositions.push(px + zCurveX, py * zHeightMod, z);
      waveUvs.push(u, v);
    }
  }

  for (let iz = 0; iz < zSegs; iz++) {
    for (let ip = 0; ip < profileSegs; ip++) {
      const a = iz * (profileSegs + 1) + ip;
      const b = a + 1;
      const c = a + (profileSegs + 1);
      const d = c + 1;
      waveIndices.push(a, c, b, b, c, d);
    }
  }

  const tsunamiWaveGeo = new THREE.BufferGeometry();
  tsunamiWaveGeo.setAttribute('position', new THREE.Float32BufferAttribute(wavePositions, 3));
  tsunamiWaveGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waveUvs, 2));
  tsunamiWaveGeo.setIndex(waveIndices);
  tsunamiWaveGeo.computeVertexNormals();
  disposables.push(tsunamiWaveGeo);

  const tsunamiUniforms = {
    uTime: { value: 0 },
    uFogColor: { value: new THREE.Color(0x3a5a70) },
    uFogDensity: { value: 0.0112 },
    uLightning: { value: 0 },
  };

  const tsunamiWaveMat = new THREE.ShaderMaterial({
    uniforms: tsunamiUniforms,
    side: THREE.DoubleSide,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float churn = sin(pos.z * 0.14 + uTime * 3.6 + uv.x * 6.0) * 0.55;
        pos.x += churn * smoothstep(0.25, 0.95, uv.x);
        pos.y += cos(pos.z * 0.11 - uTime * 3.0) * 0.045;
        vNormal = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform float uLightning;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        vec3 deepOcean = vec3(0.05, 0.21, 0.34);
        vec3 midTurquoise = vec3(0.08, 0.46, 0.60);
        vec3 crestGlow = vec3(0.32, 0.78, 0.84);
        vec3 whiteFoam = vec3(0.94, 0.98, 1.0);

        float u = vUv.x;
        vec3 col = mix(deepOcean, midTurquoise, smoothstep(0.08, 0.58, u));
        col = mix(col, crestGlow, smoothstep(0.48, 0.76, u));

        float streak1 = sin(vWorldPos.z * 0.35 + u * 18.0 - uTime * 5.2);
        float streak2 = cos(vWorldPos.z * 0.72 - u * 12.0 + uTime * 3.8);
        float foamPattern = smoothstep(0.45, 0.92, (streak1 * 0.55 + streak2 * 0.45) * 0.5 + 0.5);

        float lipFoam = smoothstep(0.68, 0.94, u + foamPattern * 0.14);
        float baseChurn = (1.0 - smoothstep(0.0, 0.16, u)) * 0.45;
        col = mix(col, whiteFoam, clamp(lipFoam + foamPattern * 0.22 * smoothstep(0.3, 0.8, u) + baseChurn, 0.0, 0.98));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.2);
        col += vec3(0.45, 0.80, 0.90) * rim * 0.38;
        col *= 1.0 + uLightning * 0.55;

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, clamp(fogFactor * 0.68, 0.0, 0.82));

        gl_FragColor = vec4(col, 0.96);
      }
    `,
  });
  disposables.push(tsunamiWaveMat);

  const tsunamiWaveMesh = new THREE.Mesh(tsunamiWaveGeo, tsunamiWaveMat);
  tsunamiGroup.add(tsunamiWaveMesh);

  const surfGeo = new THREE.CylinderGeometry(2.1, 2.8, waveSpanZ, 12, 1, false);
  surfGeo.rotateX(Math.PI / 2);
  const surfMat = new THREE.MeshStandardMaterial({
    color: 0xeaf6fc,
    emissive: 0x3b6e82,
    emissiveIntensity: 0.28,
    roughness: 0.52,
    transparent: true,
    opacity: 0.9,
  });
  disposables.push(surfGeo, surfMat);
  const surfRoller = new THREE.Mesh(surfGeo, surfMat);
  surfRoller.position.set(-5.8, 1.35, 0);
  tsunamiGroup.add(surfRoller);

  const sprayCount = isSoftwareGl ? 220 : 480;
  const sprayPositions = new Float32Array(sprayCount * 3);
  const spraySeeds = new Float32Array(sprayCount * 3);
  for (let i = 0; i < sprayCount; i++) {
    spraySeeds[i * 3] = (rand() - 0.5) * waveSpanZ;
    spraySeeds[i * 3 + 1] = rand();
    spraySeeds[i * 3 + 2] = 0.6 + rand() * 0.8;
    sprayPositions[i * 3] = -5;
    sprayPositions[i * 3 + 1] = 8;
    sprayPositions[i * 3 + 2] = spraySeeds[i * 3];
  }
  const sprayGeo = new THREE.BufferGeometry();
  const sprayPosAttr = new THREE.BufferAttribute(sprayPositions, 3);
  sprayPosAttr.setUsage(THREE.DynamicDrawUsage);
  sprayGeo.setAttribute('position', sprayPosAttr);
  disposables.push(sprayGeo);

  const sprayMat = new THREE.PointsMaterial({
    color: 0xf0f9ff,
    size: 1.95,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  disposables.push(sprayMat);

  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  sprayPoints.frustumCulled = false;
  tsunamiGroup.add(sprayPoints);

  // =========================================================================
  // UPDATE LOOP (ZERO PER-FRAME ALLOCATIONS)
  // =========================================================================
  const update: ExtremeWeather3DSystem['update'] = ({
    elapsed,
    dt,
    weather,
    season,
    regionId,
    playerX,
    playerZ,
    state,
    sunDir,
    skyColor,
    fogColor,
    fogDensity,
  }) => {
    const profile = getWeatherProfile(weather);

    // 1. Update Dense Instanced Slanted Raindrop Quads
    const showRain = profile.rainIntensity > 0.02 && regionId !== 'snow' && season !== 'winter';
    rainInst.visible = showRain;
    if (showRain) {
      const activeCount = Math.max(
        140,
        Math.min(maxDrops, Math.floor(maxDrops * (0.28 + profile.rainIntensity * 0.72)))
      );
      rainInst.count = activeCount;
      rainInst.position.set(playerX, 0, playerZ);
      dropMat.opacity = 0.36 + profile.rainIntensity * 0.44;
      dropMat.color.setHex(state.lightningFlash > 0.25 ? 0xf5fbff : 0xd0e6ff);

      const windX = profile.rainWindX;
      const fallY = profile.rainFallSpeed;
      const windZ = windX * 0.24;
      const halfXZ = dropBoxXZ * 0.5;
      const slantAngle = Math.atan2(windX, fallY);
      const widthScale = 0.8 + profile.rainIntensity * 0.75;
      const heightScale = 0.8 + profile.rainIntensity * 0.95;

      for (let i = 0; i < activeCount; i++) {
        let bx = dropPos[i * 3] + windX * dt;
        let by = dropPos[i * 3 + 1] - fallY * dt;
        let bz = dropPos[i * 3 + 2] + windZ * dt;

        if (by < 0.0) {
          by += dropBoxY;
          bx = (rand() - 0.5) * dropBoxXZ;
          bz = (rand() - 0.5) * dropBoxXZ;
        }
        if (bx > halfXZ) bx -= dropBoxXZ;
        else if (bx < -halfXZ) bx += dropBoxXZ;
        if (bz > halfXZ) bz -= dropBoxXZ;
        else if (bz < -halfXZ) bz += dropBoxXZ;

        dropPos[i * 3] = bx;
        dropPos[i * 3 + 1] = by;
        dropPos[i * 3 + 2] = bz;

        const sc = dropScale[i];
        _dummy.position.set(bx, by, bz);
        _dummy.rotation.set(0, dropYaw[i], slantAngle);
        _dummy.scale.set(widthScale, heightScale * sc, 1);
        _dummy.updateMatrix();
        rainInst.setMatrixAt(i, _dummy.matrix);
      }
      rainInst.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Thick 3D Forked Lightning Bolt & Sky Halo
    if (state.lightningFlash > 0.08 && profile.lightningRate > 0) {
      if (state.lightningSeed !== lastLightningSeed) {
        lastLightningSeed = state.lightningSeed;
        rebuildLightningBolt(state.lightningSeed, playerX, playerZ);
      }
      boltInst.visible = true;
      boltHalo.visible = true;
      const flicker = 0.72 + Math.sin(elapsed * 64.0) * 0.28;
      boltMat.opacity = Math.min(1, state.lightningFlash * 1.45 * flicker);
      haloMat.opacity = Math.min(0.7, state.lightningFlash * 0.6);
    } else {
      boltInst.visible = false;
      boltHalo.visible = false;
    }

    // 3. Update Alias-Free Valley Floodwater Plane
    const showFlood = state.floodLevel > WATER_LEVEL + 0.06;
    floodMesh.visible = showFlood;
    if (showFlood) {
      floodMesh.position.set(0, state.floodLevel, 0);
      floodUniforms.uTime.value = elapsed;
      floodUniforms.uRainIntensity.value = profile.rainIntensity;
      floodUniforms.uSkyColor.value.copy(skyColor);
      floodUniforms.uFogColor.value.copy(fogColor);
      floodUniforms.uFogDensity.value = fogDensity;
      floodUniforms.uSunDir.value.copy(sunDir);
      floodUniforms.uLightning.value = state.lightningFlash;
    }

    // 4. Update Towering Rolling 3D Tsunami Wave Wall
    const showTsunami = state.tsunamiWaveHeight > 0.2;
    tsunamiGroup.visible = showTsunami;
    if (showTsunami) {
      tsunamiGroup.position.set(state.tsunamiWaveX, Math.max(-0.5, state.floodLevel - 0.65), 0);
      tsunamiWaveMesh.scale.set(1, state.tsunamiWaveHeight, 1);
      tsunamiUniforms.uTime.value = elapsed;
      tsunamiUniforms.uFogColor.value.copy(fogColor);
      tsunamiUniforms.uFogDensity.value = fogDensity;
      tsunamiUniforms.uLightning.value = state.lightningFlash;

      surfRoller.rotation.z = elapsed * 4.5;
      surfRoller.position.y = Math.max(0.9, state.tsunamiWaveHeight * 0.14);

      const crestH = state.tsunamiWaveHeight * 0.92;
      for (let i = 0; i < sprayCount; i++) {
        const zBase = spraySeeds[i * 3];
        const phase = (spraySeeds[i * 3 + 1] + dt * 0.72 * spraySeeds[i * 3 + 2]) % 1.0;
        spraySeeds[i * 3 + 1] = phase;
        const arcX = -4.2 - phase * 14.5;
        const arcY = crestH + Math.sin(phase * Math.PI) * 5.2 - phase * phase * 7.5;
        const o = i * 3;
        sprayPositions[o] = arcX;
        sprayPositions[o + 1] = Math.max(0.4, arcY);
        sprayPositions[o + 2] = zBase + Math.sin(elapsed * 2.1 + i) * 1.4;
      }
      sprayPosAttr.needsUpdate = true;
    }
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
