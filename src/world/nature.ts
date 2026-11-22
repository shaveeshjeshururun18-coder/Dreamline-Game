import * as THREE from 'three';
import {
  CAMPSITE_CENTER,
  distanceToRail,
  ENCHANTED_FOREST_CENTER,
  groundHeightAt,
  HILL_CENTER,
  HOME_CENTER,
  isWaterAt,
  lakeNormDist,
  MAIN_STATION_CENTER,
  VILLAGE_CENTER,
  WATER_LEVEL,
} from '../game/terrain';
import type { RegionId, SeasonType, WeatherType } from '../game/types';
import { getWeatherProfile } from '../game/extremeWeather';
import { DINOSAUR_ISLAND_CENTER } from '../game/dinosaurIsland';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from '../game/midnightFrontier';
import {
  isInsideExhibitionCampusClearing,
  isInsideExhibitionIsland,
} from '../game/exhibitionComplex';

export interface WorldNature {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    weather: WeatherType,
    sunIntensity: number,
    regionId?: RegionId,
    playerX?: number,
    playerZ?: number,
    season?: SeasonType
  ) => void;
  dispose: () => void;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSoftCircleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,245,248,0.65)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWorldNature(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): WorldNature {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const rand = mulberry32(20261119);

  // =========================================================================
  // 1. SCULPTED COUNTRYSIDE TERRAIN WITH VERTEX-BLENDED BIOMES & PATHS
  // =========================================================================
  const terrainSize = 900;
  const terrainSegs = 128;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(posAttr.count * 3);
  const cLush = new THREE.Color(0x527343);
  const cGolden = new THREE.Color(0xa68952);
  const cPath = new THREE.Color(0x9a846d);
  const cSand = new THREE.Color(0xdcc79c);
  const cLakeShore = new THREE.Color(0x7c7062);
  const cHill = new THREE.Color(0x415f3d);
  const cSnow = new THREE.Color(0xeef3fb);
  const cEmerald = new THREE.Color(0x457d47);
  const cDinoJungle = new THREE.Color(0x3a5a36);
  const cDinoVolcanic = new THREE.Color(0x4a4d54);
  const cTmp = new THREE.Color();

  const distToPath = (x: number, z: number) => {
    const d1 = distPointToSeg(x, z, 0, 22, -42, 34);
    const d2 = distPointToSeg(x, z, 6, 21, 34, -4);
    const d3 = distPointToSeg(x, z, -36, 28, -25, 9);
    const d4 = distPointToSeg(x, z, -25, 9, -52, -48);
    const d5 = distPointToSeg(x, z, -52, -48, -18, -56);
    const d6 = distPointToSeg(x, z, -22, -6, 0, 20); // Path to En Illam personal home
    return Math.min(d1, d2, d3, d4, d5, d6);
  };

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = groundHeightAt(x, z);
    posAttr.setY(i, y);

    const fieldWave = Math.sin(x * 0.045 + z * 0.03) * 0.5 + 0.5;
    cTmp.copy(cLush).lerp(cGolden, fieldWave * 0.48);

    // Pachai Vayal lush emerald countryside in south
    if (z > 50 && x < 72) {
      const tEm = Math.min(1, (z - 50) / 28);
      cTmp.lerp(cEmerald, tEm * 0.65);
    }

    if (y > 4.0) {
      cTmp.lerp(cHill, Math.min(1, (y - 4.0) / 10));
    }

    // Panimalai Snow Peaks biome blend (northwest x < -52, z < -34)
    if (x < -52 && z < -34) {
      const snowBlend =
        Math.min(1, (-52 - x) / 24) * Math.min(1, (-34 - z) / 24);
      cTmp.lerp(cSnow, Math.min(0.96, snowBlend * 1.15));
    }

    // Kadalkarai Sandy Beach & Coastal shore (east x > 84, z > 14)
    if (x > 84 && z > 14) {
      const coastSand = Math.min(1, (x - 84) / 20) * Math.min(1, (z - 14) / 18);
      cTmp.lerp(cSand, coastSand * 0.88);
    }

    // SSJ Dinosaur Island volcanic jungle & sandy coastal rim at (166, 78)
    const dDinoIsland = Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z);
    if (dDinoIsland < 33) {
      if (dDinoIsland < 24) {
        cTmp.copy(cDinoJungle).lerp(cDinoVolcanic, dDinoIsland < 16 ? 0.65 : 0.25);
      } else {
        const beachMix = Math.min(1, (dDinoIsland - 24) / 6);
        cTmp.copy(cDinoJungle).lerp(cSand, beachMix * 0.92);
      }
    }

    // Engineered Ocean Exhibition Complex Island concrete marine deck
    if (isInsideExhibitionIsland(x, z, 3)) {
      cTmp.setHex(0x6e747e);
    }

    const lakeD = lakeNormDist(x, z);
    if (lakeD < 1.15 || (x < 85 && y < WATER_LEVEL + 0.45)) {
      const shoreT = Math.max(0, Math.min(1, 1 - (y - WATER_LEVEL) / 0.95));
      cTmp.lerp(cLakeShore, shoreT * 0.82);
    }

    const pDist = distToPath(x, z);
    if (pDist < 3.4) {
      const pt = 1 - pDist / 3.4;
      cTmp.lerp(cPath, pt * 0.78);
    }

    if (Math.hypot(x - 0, z - 20.5) < 11.5) {
      cTmp.lerp(cPath, 0.55);
    }

    colors[i * 3] = cTmp.r;
    colors[i * 3 + 1] = cTmp.g;
    colors[i * 3 + 2] = cTmp.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.0,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);
  disposables.push(terrainGeo, terrainMat);

  // =========================================================================
  // 2. SLENDER WIND-SWAYING ANIME PAMPAS GRASS CLUSTERS (vertex-colored base-to-tip!)
  // =========================================================================
  const grassCount = 2400;
  const grassGeo = createSlenderGrassClumpGeometry();
  const grassUniforms = {
    uTime: { value: 0 },
    uWindStrength: { value: 0.24 },
  };
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.86,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = grassUniforms.uTime;
    shader.uniforms.uWindStrength = grassUniforms.uWindStrength;
    shader.vertexShader =
      `uniform float uTime;\nuniform float uWindStrength;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float tip = clamp(position.y / 1.05, 0.0, 1.0);
        vec4 worldBase = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float sway = sin(uTime * 1.85 + worldBase.x * 0.22 + worldBase.z * 0.18) * uWindStrength;
        float gust = cos(uTime * 0.95 + worldBase.x * 0.09 - worldBase.z * 0.12) * uWindStrength * 0.5;
        transformed.x += (sway + gust) * tip * tip;
        transformed.z += sway * 0.45 * tip * tip;
        `
      );
  };

  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  grassMesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const cGrassGreen = new THREE.Color(0x6e8f52);
  const cGrassGold = new THREE.Color(0xd2ad6c);
  const cGrassPlume = new THREE.Color(0xe6c89e);

  let placedGrass = 0;
  let attempts = 0;
  while (placedGrass < grassCount && attempts < grassCount * 6) {
    attempts++;
    // Bias 55% of grass along the railway corridor & station foreground (reference images #1, #6, #12!)
    let x: number;
    let z: number;
    if (placedGrass < grassCount * 0.45) {
      x = (rand() - 0.5) * 120;
      z = -45 + rand() * 80;
    } else {
      x = (rand() - 0.5) * 195;
      z = (rand() - 0.5) * 195;
    }
    const y = groundHeightAt(x, z);
    if (y < WATER_LEVEL + 0.18) continue;
    if (distanceToRail(x, z) < 2.6) continue;
    if (distToPath(x, z) < 2.2) continue;
    if (Math.hypot(x - MAIN_STATION_CENTER.x, z - 17.5) < 13.5) continue;
    if (Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z) < 15) continue;
    if (Math.hypot(x - HILL_CENTER.x, z - HILL_CENTER.z) < 4.5) continue;
    if (Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z) < 14.5) continue;
    if (Math.hypot(x - CAMPSITE_CENTER.x, z - CAMPSITE_CENTER.z) < 9.5) continue;
    if (Math.hypot(x - MIDNIGHT_FRONTIER_PORTAL_POS.x, z - MIDNIGHT_FRONTIER_PORTAL_POS.z) < 42) continue;
    if (isInsideExhibitionCampusClearing(x, z)) continue;
    if (x < -56 && z < -38) continue; // Keep Panimalai snow crisp
    if (x > 82 && z > 20) continue; // Keep Kadalkarai sandy beach open

    const s = 0.72 + rand() * 0.65;
    dummy.position.set(x, y - 0.05, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(s, s * (0.78 + rand() * 0.52), s);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(placedGrass, dummy.matrix);

    const mixVal = rand();
    if (mixVal < 0.45) tint.copy(cGrassGreen).lerp(cGrassGold, rand() * 0.55);
    else if (mixVal < 0.82) tint.copy(cGrassGold);
    else tint.copy(cGrassPlume);
    grassMesh.setColorAt(placedGrass, tint);
    placedGrass++;
  }
  grassMesh.count = placedGrass;
  grassMesh.instanceMatrix.needsUpdate = true;
  if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
  grassMesh.computeBoundingSphere();
  group.add(grassMesh);
  disposables.push(grassGeo, grassMat);

  // =========================================================================
  // 3. COMPOSITE TREES: SAKURA CHERRY BLOSSOMS & LAYERED JAPANESE TREES
  // =========================================================================
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.32, 3.8, 7);
  trunkGeo.translate(0, 1.9, 0);
  // Organic multi-faceted foliage cluster with bumpy surface normals (much less spherical!)
  const foliageGeo = new THREE.IcosahedronGeometry(1.35, 1);
  const fPos = foliageGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < fPos.count; i++) {
    const vx = fPos.getX(i);
    const vy = fPos.getY(i);
    const vz = fPos.getZ(i);
    const jitter = 0.84 + 0.3 * Math.sin(vx * 3.1 + vy * 2.7) * Math.cos(vz * 3.3);
    fPos.setXYZ(i, vx * jitter, vy * (0.78 * jitter), vz * jitter);
  }
  foliageGeo.computeVertexNormals();
  disposables.push(trunkGeo, foliageGeo);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x473329, roughness: 0.92, metalness: 0.0 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.0, flatShading: true });
  const sakuraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.0, flatShading: true });
  disposables.push(trunkMat, leafMat, sakuraMat);

  const applyTreeWind = (mat: THREE.MeshStandardMaterial) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = grassUniforms.uTime;
      shader.uniforms.uWindStrength = grassUniforms.uWindStrength;
      shader.vertexShader =
        `uniform float uTime;\nuniform float uWindStrength;\n` +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vec4 wb = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float sw = sin(uTime * 1.15 + wb.x * 0.14 + wb.z * 0.12) * uWindStrength * 0.42;
          transformed.x += sw * (position.y * 0.35 + 0.5);
          `
        );
    };
  };
  applyTreeWind(leafMat);
  applyTreeWind(sakuraMat);

  const sakuraSpots: Array<{ x: number; z: number; scale: number }> = [
    { x: -13.8, z: 18.2, scale: 1.4 },
    { x: 11.4, z: 21.0, scale: 1.3 },
    { x: -19.5, z: 4.5, scale: 1.2 },
    { x: -57.0, z: -43.0, scale: 1.3 },
    { x: VILLAGE_CENTER.x - 9, z: VILLAGE_CENTER.z + 1, scale: 1.15 },
    { x: VILLAGE_CENTER.x + 15, z: VILLAGE_CENTER.z + 2, scale: 1.2 },
    { x: 39.5, z: 3.5, scale: 1.25 },
    { x: -12.0, z: -61.0, scale: 1.15 },
  ];

  const greenSpots: Array<{ x: number; z: number; scale: number }> = [];
  for (let i = 0; i < 125; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 28 + rand() * 105;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (isWaterAt(x, z)) continue;
    if (distanceToRail(x, z) < 7.5) continue;
    if (distToPath(x, z) < 5.0) continue;
    if (Math.hypot(x - MAIN_STATION_CENTER.x, z - 15) < 23) continue;
    if (Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z) < 24) continue;
    if (Math.hypot(x - HILL_CENTER.x, z - HILL_CENTER.z) < 9.0) continue;
    if (Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z) < 17.5) continue;
    if (Math.hypot(x - CAMPSITE_CENTER.x, z - CAMPSITE_CENTER.z) < 13.5) continue;
    if (Math.hypot(x - ENCHANTED_FOREST_CENTER.x, z - ENCHANTED_FOREST_CENTER.z) < 28.0) continue;
    if (Math.hypot(x - MIDNIGHT_FRONTIER_PORTAL_POS.x, z - MIDNIGHT_FRONTIER_PORTAL_POS.z) < 46.0) continue;
    if (x < -54 && z < -34) continue; // Snow pines live here instead
    if (x > 76 && z > 20) continue; // Coastal town & beach
    // Keep foreground north of Sakuragawa Station clear so Title Screen vista is wide open!
    if (x > -24 && x < 16 && z > -10 && z < 8) continue;
    greenSpots.push({ x, z, scale: 0.9 + rand() * 0.8 });
  }

  const totalTrees = sakuraSpots.length + greenSpots.length;
  const trunksInst = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrees);
  trunksInst.castShadow = !isSoftwareGl;
  trunksInst.receiveShadow = true;

  const sakuraCanopyInst = new THREE.InstancedMesh(foliageGeo, sakuraMat, sakuraSpots.length * 7);
  sakuraCanopyInst.castShadow = !isSoftwareGl;
  sakuraCanopyInst.frustumCulled = false;

  const greenCanopyInst = new THREE.InstancedMesh(foliageGeo, leafMat, greenSpots.length * 6);
  greenCanopyInst.castShadow = !isSoftwareGl;
  greenCanopyInst.frustumCulled = false;

  const sakuraColors = [new THREE.Color(0xf7bfd1), new THREE.Color(0xfde6ee), new THREE.Color(0xe69eb9)];
  const greenColors = [new THREE.Color(0x36593b), new THREE.Color(0x466b43), new THREE.Color(0x2e4d38), new THREE.Color(0x557547)];

  let tIdx = 0;
  let scIdx = 0;
  sakuraSpots.forEach((sp) => {
    const y = groundHeightAt(sp.x, sp.z);
    dummy.position.set(sp.x, y - 0.1, sp.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(sp.scale, sp.scale, sp.scale);
    dummy.updateMatrix();
    trunksInst.setMatrixAt(tIdx++, dummy.matrix);

    const lobeOffsets = [
      [0, 4.5, 0, 1.35],
      [-1.7, 3.8, 0.9, 1.15],
      [1.6, 3.9, -0.7, 1.18],
      [0.5, 3.6, 1.6, 1.05],
      [-0.9, 5.0, -0.6, 1.0],
      [1.1, 4.7, 0.8, 0.95],
      [-1.2, 3.5, -1.2, 0.92],
    ];
    lobeOffsets.forEach(([ox, oy, oz, os], li) => {
      dummy.position.set(sp.x + ox * sp.scale, y + oy * sp.scale, sp.z + oz * sp.scale);
      dummy.rotation.set(rand(), rand(), rand());
      const ls = os * sp.scale;
      dummy.scale.set(ls * 1.22, ls * 0.78, ls * 1.15);
      dummy.updateMatrix();
      sakuraCanopyInst.setMatrixAt(scIdx, dummy.matrix);
      sakuraCanopyInst.setColorAt(scIdx, sakuraColors[li % sakuraColors.length]);
      scIdx++;
    });
  });

  let gcIdx = 0;
  greenSpots.forEach((sp) => {
    const y = groundHeightAt(sp.x, sp.z);
    dummy.position.set(sp.x, y - 0.15, sp.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(sp.scale, sp.scale * 1.12, sp.scale);
    dummy.updateMatrix();
    trunksInst.setMatrixAt(tIdx++, dummy.matrix);

    const lobes = [
      [0, 4.4, 0, 1.35],
      [-1.25, 3.4, 0.8, 1.05],
      [1.15, 3.5, -0.75, 1.08],
      [-0.4, 3.7, -1.15, 0.95],
      [0.85, 4.3, 0.9, 0.92],
      [0.05, 5.5, 0.1, 0.88],
    ];
    lobes.forEach(([ox, oy, oz, os], li) => {
      dummy.position.set(sp.x + ox * sp.scale, y + oy * sp.scale, sp.z + oz * sp.scale);
      dummy.rotation.set(rand(), rand(), rand());
      const ls = os * sp.scale;
      dummy.scale.set(ls * 1.12, ls * 0.88, ls * 1.12);
      dummy.updateMatrix();
      greenCanopyInst.setMatrixAt(gcIdx, dummy.matrix);
      greenCanopyInst.setColorAt(gcIdx, greenColors[(gcIdx + li) % greenColors.length]);
      gcIdx++;
    });
  });

  trunksInst.instanceMatrix.needsUpdate = true;
  sakuraCanopyInst.instanceMatrix.needsUpdate = true;
  if (sakuraCanopyInst.instanceColor) sakuraCanopyInst.instanceColor.needsUpdate = true;
  greenCanopyInst.instanceMatrix.needsUpdate = true;
  if (greenCanopyInst.instanceColor) greenCanopyInst.instanceColor.needsUpdate = true;

  trunksInst.computeBoundingSphere();
  sakuraCanopyInst.computeBoundingSphere();
  greenCanopyInst.computeBoundingSphere();
  group.add(trunksInst, sakuraCanopyInst, greenCanopyInst);

  // =========================================================================
  // 4. DELICATE WILDFLOWERS BESIDE RAILWAY & PATHS
  // =========================================================================
  const flowerCount = 260;
  const flowerGeo = new THREE.CircleGeometry(0.11, 6);
  flowerGeo.rotateX(-Math.PI * 0.42);
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, side: THREE.DoubleSide });
  const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const flowerPalette = [
    new THREE.Color(0xffb7ce),
    new THREE.Color(0xfff1c9),
    new THREE.Color(0xf4c468),
    new THREE.Color(0xcab6f2),
  ];

  let fPlaced = 0;
  for (let i = 0; i < flowerCount * 4 && fPlaced < flowerCount; i++) {
    const x = (rand() - 0.5) * 140;
    const z = (rand() - 0.5) * 140;
    const dRail = distanceToRail(x, z);
    const dPath = distToPath(x, z);
    if (dRail > 8.5 && dPath > 7.5) continue;
    if (dRail < 2.6 || dPath < 1.8 || isWaterAt(x, z)) continue;
    const y = groundHeightAt(x, z);
    dummy.position.set(x, y + 0.28, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    const fs = 0.75 + rand() * 0.55;
    dummy.scale.set(fs, fs, fs);
    dummy.updateMatrix();
    flowerInst.setMatrixAt(fPlaced, dummy.matrix);
    flowerInst.setColorAt(fPlaced, flowerPalette[fPlaced % flowerPalette.length]);
    fPlaced++;
  }
  flowerInst.count = fPlaced;
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  flowerInst.computeBoundingSphere();
  group.add(flowerInst);
  disposables.push(flowerGeo, flowerMat);

  // =========================================================================
  // 5. LIVING DETAILS: SOFT PETALS/DUST & WEATHER (Articulated wildlife lives in wildlifeWorld.ts)
  // =========================================================================
  const softSpriteTex = createSoftCircleTexture();
  disposables.push(softSpriteTex);

  // Drifting Cherry Blossom Petals & Sunlit Dust Motes with soft radial circle sprite
  const moteCount = 140;
  const motePos = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (rand() - 0.5) * 110;
    motePos[i * 3 + 1] = 1.0 + rand() * 14.0;
    motePos[i * 3 + 2] = (rand() - 0.5) * 110;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xffd7e5,
    map: softSpriteTex,
    size: 0.26,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  group.add(motes);
  disposables.push(moteGeo, moteMat);

  // Weather Particles (Rain & Snow) with soft circular sprite
  const precipCount = 520;
  const precipPos = new Float32Array(precipCount * 3);
  for (let i = 0; i < precipCount; i++) {
    precipPos[i * 3] = (rand() - 0.5) * 90;
    precipPos[i * 3 + 1] = rand() * 32;
    precipPos[i * 3 + 2] = (rand() - 0.5) * 90;
  }
  const precipGeo = new THREE.BufferGeometry();
  precipGeo.setAttribute('position', new THREE.BufferAttribute(precipPos, 3));
  const precipMat = new THREE.PointsMaterial({
    color: 0xdbe9ff,
    map: softSpriteTex,
    size: 0.28,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const precipPoints = new THREE.Points(precipGeo, precipMat);
  precipPoints.frustumCulled = false;
  precipPoints.visible = false;
  group.add(precipPoints);
  disposables.push(precipGeo, precipMat);

  scene.add(group);

  let appliedSeason: SeasonType | null = null;

  const update = (
    elapsed: number,
    dt: number,
    weather: WeatherType,
    sunIntensity: number,
    regionId: RegionId = 'sakura',
    playerX = 0,
    playerZ = 0,
    season: SeasonType = 'spring'
  ) => {
    // Seasonal foliage, meadow grass, terrain & drifting particle transformation!
    if (season !== appliedSeason) {
      appliedSeason = season;
      if (season === 'spring') {
        leafMat.color.setHex(0xffffff);
        sakuraMat.color.setHex(0xffffff);
        grassMat.color.setHex(0xffffff);
        terrainMat.color.setHex(0xffffff);
        moteMat.color.setHex(0xffd2e2);
        moteMat.opacity = 0.72;
      } else if (season === 'summer') {
        leafMat.color.setHex(0xc8f5bc);
        sakuraMat.color.setHex(0xa8e09e); // Lush green summer canopies
        grassMat.color.setHex(0xd4f2b8);
        terrainMat.color.setHex(0xedf7dc);
        moteMat.color.setHex(0xfff1a8); // Sunlit golden fireflies / pollen
        moteMat.opacity = 0.78;
      } else if (season === 'autumn') {
        leafMat.color.setHex(0xf29a58); // Crimson & amber autumn leaves!
        sakuraMat.color.setHex(0xe87a52);
        grassMat.color.setHex(0xe8b976);
        terrainMat.color.setHex(0xf0d6bc);
        moteMat.color.setHex(0xff9b4d); // Drifting autumn leaves
        moteMat.opacity = 0.82;
      } else {
        // Winter: frosted snow-dusted foliage & pale cool ground
        leafMat.color.setHex(0xdbe8f5);
        sakuraMat.color.setHex(0xeaf2fa);
        grassMat.color.setHex(0xd8e4f0);
        terrainMat.color.setHex(0xe6eff8);
        moteMat.color.setHex(0xffffff);
        moteMat.opacity = 0.85;
      }
    }

    const weatherProfile = getWeatherProfile(weather);
    grassUniforms.uTime.value = elapsed;
    const targetWind = weatherProfile.windStrength;
    grassUniforms.uWindStrength.value += (targetWind - grassUniforms.uWindStrength.value) * Math.min(1, dt * 2.4);
    void sunIntensity;

    const showMotes = !weatherProfile.isExtremeStorm;
    motes.visible = showMotes;
    if (showMotes) {
      const mArr = moteGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < moteCount; i++) {
        mArr[i * 3] += Math.sin(elapsed * 0.6 + i) * dt * 0.42 + dt * (0.32 + weatherProfile.windStrength * 0.8);
        mArr[i * 3 + 1] -= dt * 0.38;
        if (mArr[i * 3 + 1] < 0.4) mArr[i * 3 + 1] = 14.5;
        if (mArr[i * 3] > 55) mArr[i * 3] = -55;
      }
      moteGeo.attributes.position.needsUpdate = true;
    }

    const isRain = weatherProfile.isRainy && regionId !== 'snow' && season !== 'winter';
    const isSnow = weather === 'snow' || regionId === 'snow' || season === 'winter';
    precipPoints.visible = isRain || isSnow;
    if (precipPoints.visible) {
      precipPoints.position.set(playerX, 0, playerZ);
      precipMat.opacity = isRain ? 0.46 + weatherProfile.rainIntensity * 0.38 : 0.82;
      precipMat.size = isRain ? 0.22 + weatherProfile.rainIntensity * 0.14 : 0.32;
      precipMat.color.setHex(isRain ? 0xcadbf7 : 0xffffff);
      const pArr = precipGeo.attributes.position.array as Float32Array;
      const fallSpeed = isRain ? weatherProfile.rainFallSpeed : 2.5;
      const driftX = isRain ? weatherProfile.rainWindX : 0.8;
      for (let i = 0; i < precipCount; i++) {
        pArr[i * 3] += (isSnow ? Math.sin(elapsed + i) * 0.7 : driftX) * dt;
        pArr[i * 3 + 1] -= fallSpeed * dt;
        if (pArr[i * 3 + 1] < 0) {
          pArr[i * 3 + 1] = 30;
          pArr[i * 3] = (rand() - 0.5) * 90;
          pArr[i * 3 + 2] = (rand() - 0.5) * 90;
        }
      }
      precipGeo.attributes.position.needsUpdate = true;
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

/**
 * Slender 5-blade pampas grass clump with dark root-to-golden-tip vertex gradient
 * so blades look natural, wispy, and blended with the meadow ground.
 */
function createSlenderGrassClumpGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];

  const blades = [
    { ox: -0.12, oz: 0.05, rot: 0.2, h: 0.92, lean: 0.14 },
    { ox: 0.11, oz: -0.06, rot: 1.4, h: 1.05, lean: -0.16 },
    { ox: 0.0, oz: 0.09, rot: 2.5, h: 0.82, lean: 0.11 },
    { ox: -0.06, oz: -0.1, rot: 3.7, h: 1.12, lean: 0.18 },
    { ox: 0.07, oz: 0.04, rot: 4.9, h: 0.76, lean: -0.1 },
  ];

  const halfW = 0.042;
  blades.forEach((b) => {
    const c = Math.cos(b.rot);
    const s = Math.sin(b.rot);
    const x1 = b.ox - c * halfW;
    const z1 = b.oz - s * halfW;
    const x2 = b.ox + c * halfW;
    const z2 = b.oz + s * halfW;
    const tx = b.ox + s * b.lean;
    const tz = b.oz - c * b.lean;

    positions.push(x1, 0, z1, x2, 0, z2, tx, b.h, tz);
    // Darker mossy base -> bright sunlit golden tip
    colors.push(
      0.52, 0.58, 0.45,
      0.52, 0.58, 0.45,
      1.0, 0.98, 0.92
    );
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function distPointToSeg(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return Math.hypot(px - x1, pz - z1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lenSq));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}
