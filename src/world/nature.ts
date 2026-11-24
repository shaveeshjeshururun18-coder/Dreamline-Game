import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
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
import {
  desertBiomeBlend,
  desertOasisNormDist,
  distToDesertCaravanTrail,
  isInsideDesertBiome,
} from '../game/desertOasis';
import {
  getSeasonalFoliageProfile,
  type SeasonalFoliageProfile,
} from '../game/seasonalFoliage';

export interface WorldNature {
  group: THREE.Group;
  applySeason: (season: SeasonType) => SeasonalFoliageProfile;
  getActiveProfile: () => SeasonalFoliageProfile;
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
  const cDesertGold = new THREE.Color(0xe6be7a);
  const cDesertOchre = new THREE.Color(0xcf944e);
  const cOasisMoss = new THREE.Color(0x4b8756);
  const cDesertTrail = new THREE.Color(0xc29d6a);
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

    // Thar Golden Desert Oasis & Pyramid Ruins vertex-blended dunes, emerald oasis banks & caravan trail
    const desertMix = desertBiomeBlend(x, z);
    if (desertMix > 0.005) {
      const duneTone = Math.max(0, Math.min(1, (y - 1.0) / 6.5));
      const dCol = cDesertOchre.clone().lerp(cDesertGold, 0.35 + duneTone * 0.65);
      const dOasis = desertOasisNormDist(x, z);
      if (dOasis < 1.32) {
        const lushRing = Math.max(0, Math.min(1, 1 - Math.abs(dOasis - 1.02) / 0.34));
        dCol.lerp(cOasisMoss, lushRing * 0.78);
      }
      const dCaravan = distToDesertCaravanTrail(x, z);
      if (dCaravan < 4.5) {
        dCol.lerp(cDesertTrail, (1 - dCaravan / 4.5) * 0.65);
      }
      cTmp.lerp(dCol, desertMix);
    }

    const lakeD = lakeNormDist(x, z);
    if (lakeD < 1.15 || (x < 85 && desertMix < 0.25 && y < WATER_LEVEL + 0.45)) {
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
    uGrassScaleY: { value: 1.0 },
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
    shader.uniforms.uGrassScaleY = grassUniforms.uGrassScaleY;
    shader.vertexShader =
      `uniform float uTime;\nuniform float uWindStrength;\nuniform float uGrassScaleY;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        transformed.y *= uGrassScaleY;
        float tip = clamp(position.y / 1.05, 0.0, 1.0);
        vec4 worldBase = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float sway = sin(uTime * 1.85 + worldBase.x * 0.22 + worldBase.z * 0.18) * uWindStrength;
        float gust = cos(uTime * 0.95 + worldBase.x * 0.09 - worldBase.z * 0.12) * uWindStrength * 0.5;
        transformed.x += (sway + gust) * tip * tip * uGrassScaleY;
        transformed.z += sway * 0.45 * tip * tip * uGrassScaleY;
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
    if (isInsideDesertBiome(x, z)) continue; // Keep Thar Golden Desert dunes sandy & open
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
  // 3. SEASONALLY SWAPPABLE COMPOSITE 3D TREES (4 DISTINCT SILHOUETTE MODELS)
  //    - Spring: Cherry Blossom (Sakura) billowing petal domes + dangling clusters
  //    - Summer: Lush broad emerald canopy domes + golden orchard fruit accents
  //    - Autumn: Pagoda-tiered crimson/amber maple crowns + fallen leaf base rings
  //    - Winter: Multi-tier conical pine needles + 3D snow-dusted bough mantles
  // =========================================================================
  const trunkGeo = createBranchedTrunkGeometry();
  const pineTrunkGeo = createPineTrunkGeometry();
  const springCrownGeo = createCherryBlossomCrownGeometry();
  const springGarlandGeo = createBlossomClusterAccentGeometry();
  const summerCrownGeo = createSummerBroadleafCrownGeometry();
  const summerFruitGeo = createSummerFruitAccentGeometry();
  const autumnCrownGeo = createAutumnMapleCrownGeometry();
  const autumnLeafRingGeo = createAutumnFallenLeafRingGeometry();
  const winterPineNeedlesGeo = createWinterPineNeedlesGeometry();
  const winterPineSnowGeo = createWinterPineSnowCapGeometry();

  disposables.push(
    trunkGeo,
    pineTrunkGeo,
    springCrownGeo,
    springGarlandGeo,
    summerCrownGeo,
    summerFruitGeo,
    autumnCrownGeo,
    autumnLeafRingGeo,
    winterPineNeedlesGeo,
    winterPineSnowGeo
  );

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4b352a,
    roughness: 0.92,
    metalness: 0.0,
  });
  const pineTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c26,
    roughness: 0.94,
    metalness: 0.0,
  });
  const springCrownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.0,
    flatShading: true,
  });
  const springBlossomAccentMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x521d33),
    emissiveIntensity: 0.14,
    roughness: 0.52,
    metalness: 0.0,
  });
  const summerCrownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.0,
    flatShading: true,
  });
  const summerFruitMat = new THREE.MeshStandardMaterial({
    color: 0xffd25a,
    emissive: new THREE.Color(0x6e4700),
    emissiveIntensity: 0.18,
    roughness: 0.36,
    metalness: 0.06,
  });
  const autumnCrownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.84,
    metalness: 0.0,
    flatShading: true,
  });
  const autumnLeafRingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const winterPineNeedlesMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.0,
    flatShading: true,
  });
  const winterPineSnowMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    emissive: new THREE.Color(0x27405c),
    emissiveIntensity: 0.12,
    roughness: 0.58,
    metalness: 0.04,
    flatShading: true,
  });

  disposables.push(
    trunkMat,
    pineTrunkMat,
    springCrownMat,
    springBlossomAccentMat,
    summerCrownMat,
    summerFruitMat,
    autumnCrownMat,
    autumnLeafRingMat,
    winterPineNeedlesMat,
    winterPineSnowMat
  );

  const treeWindUniforms = {
    uWindMult: { value: 1.0 },
  };
  const applyTreeWind = (mat: THREE.MeshStandardMaterial) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = grassUniforms.uTime;
      shader.uniforms.uWindStrength = grassUniforms.uWindStrength;
      shader.uniforms.uWindMult = treeWindUniforms.uWindMult;
      shader.vertexShader =
        `uniform float uTime;\nuniform float uWindStrength;\nuniform float uWindMult;\n` +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vec4 wb = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float hFactor = clamp(position.y / 6.5, 0.0, 1.25);
          float sw = sin(uTime * 1.15 + wb.x * 0.14 + wb.z * 0.12) * uWindStrength * uWindMult * 0.36;
          transformed.x += sw * hFactor * hFactor;
          transformed.z += sw * 0.45 * hFactor * hFactor;
          `
        );
    };
  };
  applyTreeWind(springCrownMat);
  applyTreeWind(springBlossomAccentMat);
  applyTreeWind(summerCrownMat);
  applyTreeWind(summerFruitMat);
  applyTreeWind(autumnCrownMat);
  applyTreeWind(winterPineNeedlesMat);
  applyTreeWind(winterPineSnowMat);

  interface TreeSpot {
    x: number;
    y: number;
    z: number;
    scale: number;
    rotY: number;
    isHeroSakura: boolean;
  }

  const sakuraCoords: Array<{ x: number; z: number; scale: number }> = [
    { x: -13.8, z: 18.2, scale: 1.38 },
    { x: 11.4, z: 21.0, scale: 1.3 },
    { x: -19.5, z: 4.5, scale: 1.22 },
    { x: 19.2, z: 19.8, scale: 1.26 },
    { x: -57.0, z: -43.0, scale: 1.3 },
    { x: VILLAGE_CENTER.x - 9, z: VILLAGE_CENTER.z + 1, scale: 1.18 },
    { x: VILLAGE_CENTER.x + 15, z: VILLAGE_CENTER.z + 2, scale: 1.22 },
    { x: 39.5, z: 3.5, scale: 1.25 },
    { x: -12.0, z: -61.0, scale: 1.18 },
    { x: -8.5, z: -13.5, scale: 1.24 },
  ];

  const treeSpots: TreeSpot[] = [];
  sakuraCoords.forEach((sp) => {
    treeSpots.push({
      x: sp.x,
      y: groundHeightAt(sp.x, sp.z),
      z: sp.z,
      scale: sp.scale,
      rotY: rand() * Math.PI * 2,
      isHeroSakura: true,
    });
  });

  for (let i = 0; i < 135; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 26 + rand() * 105;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (isWaterAt(x, z)) continue;
    if (distanceToRail(x, z) < 7.8) continue;
    if (distToPath(x, z) < 5.0) continue;
    if (Math.hypot(x - MAIN_STATION_CENTER.x, z - 15) < 22) continue;
    if (Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z) < 24) continue;
    if (Math.hypot(x - HILL_CENTER.x, z - HILL_CENTER.z) < 9.0) continue;
    if (Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z) < 17.5) continue;
    if (Math.hypot(x - CAMPSITE_CENTER.x, z - CAMPSITE_CENTER.z) < 13.5) continue;
    if (Math.hypot(x - ENCHANTED_FOREST_CENTER.x, z - ENCHANTED_FOREST_CENTER.z) < 28.0) continue;
    if (Math.hypot(x - MIDNIGHT_FRONTIER_PORTAL_POS.x, z - MIDNIGHT_FRONTIER_PORTAL_POS.z) < 46.0) continue;
    if (isInsideDesertBiome(x, z)) continue; // Date palms live in Thar Desert Oasis instead
    if (x < -54 && z < -34) continue; // Permanent alpine snow pines live in Panimalai
    if (x > 76 && z > 20) continue; // Coastal town & beach
    if (x > -24 && x < 16 && z > -10 && z < 8) continue; // Keep foreground north of Main Station open
    treeSpots.push({
      x,
      y: groundHeightAt(x, z),
      z,
      scale: 0.9 + rand() * 0.72,
      rotY: rand() * Math.PI * 2,
      isHeroSakura: rand() < 0.28, // ~28% of valley trees bloom pink in spring too!
    });
  }

  const totalTrees = treeSpots.length;
  const heroIndices: number[] = [];
  treeSpots.forEach((sp, idx) => {
    if (sp.isHeroSakura) heroIndices.push(idx);
  });

  // Deciduous branched trunks (shown in Spring, Summer, Autumn) vs straight conifer trunks (Winter)
  const deciduousTrunksInst = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrees);
  deciduousTrunksInst.castShadow = !isSoftwareGl;
  deciduousTrunksInst.receiveShadow = true;
  deciduousTrunksInst.frustumCulled = false;

  const pineTrunksInst = new THREE.InstancedMesh(pineTrunkGeo, pineTrunkMat, totalTrees);
  pineTrunksInst.castShadow = !isSoftwareGl;
  pineTrunksInst.receiveShadow = true;
  pineTrunksInst.frustumCulled = false;

  // Season Group A: Spring Cherry Blossom Trees + Dangling Petal Clusters
  const springTreeGroup = new THREE.Group();
  const springCrownInst = new THREE.InstancedMesh(springCrownGeo, springCrownMat, totalTrees);
  springCrownInst.castShadow = !isSoftwareGl;
  springCrownInst.frustumCulled = false;
  const springBlossomAccentInst = new THREE.InstancedMesh(
    springGarlandGeo,
    springBlossomAccentMat,
    Math.max(1, heroIndices.length)
  );
  springBlossomAccentInst.frustumCulled = false;
  springTreeGroup.add(springCrownInst, springBlossomAccentInst);

  // Season Group B: Summer Lush Broadleaf Trees + Sunlit Orchard Fruits
  const summerTreeGroup = new THREE.Group();
  const summerCrownInst = new THREE.InstancedMesh(summerCrownGeo, summerCrownMat, totalTrees);
  summerCrownInst.castShadow = !isSoftwareGl;
  summerCrownInst.frustumCulled = false;
  const summerFruitInst = new THREE.InstancedMesh(
    summerFruitGeo,
    summerFruitMat,
    Math.max(1, heroIndices.length)
  );
  summerFruitInst.frustumCulled = false;
  summerTreeGroup.add(summerCrownInst, summerFruitInst);

  // Season Group C: Autumn Pagoda-Tiered Maple Trees + Fallen Leaf Base Rings
  const autumnTreeGroup = new THREE.Group();
  const autumnCrownInst = new THREE.InstancedMesh(autumnCrownGeo, autumnCrownMat, totalTrees);
  autumnCrownInst.castShadow = !isSoftwareGl;
  autumnCrownInst.frustumCulled = false;
  const autumnLeafRingInst = new THREE.InstancedMesh(
    autumnLeafRingGeo,
    autumnLeafRingMat,
    totalTrees
  );
  autumnLeafRingInst.receiveShadow = true;
  autumnLeafRingInst.frustumCulled = false;
  autumnTreeGroup.add(autumnCrownInst, autumnLeafRingInst);

  // Season Group D: Winter Snow-Dusted Conical Pine Trees (Pine Needles + 3D Snow Mantles)
  const winterTreeGroup = new THREE.Group();
  const winterPineNeedlesInst = new THREE.InstancedMesh(
    winterPineNeedlesGeo,
    winterPineNeedlesMat,
    totalTrees
  );
  winterPineNeedlesInst.castShadow = !isSoftwareGl;
  winterPineNeedlesInst.frustumCulled = false;
  const winterPineSnowInst = new THREE.InstancedMesh(
    winterPineSnowGeo,
    winterPineSnowMat,
    totalTrees
  );
  winterPineSnowInst.castShadow = !isSoftwareGl;
  winterPineSnowInst.frustumCulled = false;
  winterTreeGroup.add(winterPineNeedlesInst, winterPineSnowInst);

  const springProf = getSeasonalFoliageProfile('spring');
  const summerProf = getSeasonalFoliageProfile('summer');
  const autumnProf = getSeasonalFoliageProfile('autumn');
  const winterProf = getSeasonalFoliageProfile('winter');

  let heroCursor = 0;
  treeSpots.forEach((sp, i) => {
    const s = sp.scale;
    dummy.position.set(sp.x, sp.y - 0.08, sp.z);
    dummy.rotation.set(0, sp.rotY, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();

    deciduousTrunksInst.setMatrixAt(i, dummy.matrix);
    pineTrunksInst.setMatrixAt(i, dummy.matrix);

    // Spring crown + petal garland
    springCrownInst.setMatrixAt(i, dummy.matrix);
    const springPal = sp.isHeroSakura ? springProf.heroTreePalette : springProf.valleyTreePalette;
    tint.setHex(springPal[i % springPal.length]);
    springCrownInst.setColorAt(i, tint);

    if (sp.isHeroSakura) {
      springBlossomAccentInst.setMatrixAt(heroCursor, dummy.matrix);
      tint.setHex(springProf.heroTreePalette[(heroCursor + 1) % springProf.heroTreePalette.length]);
      springBlossomAccentInst.setColorAt(heroCursor, tint);

      summerFruitInst.setMatrixAt(heroCursor, dummy.matrix);
      heroCursor++;
    }

    // Summer lush broadleaf crown (slightly fuller + taller)
    dummy.scale.set(s * 1.06, s * 1.05, s * 1.06);
    dummy.updateMatrix();
    summerCrownInst.setMatrixAt(i, dummy.matrix);
    const summerPal = sp.isHeroSakura ? summerProf.heroTreePalette : summerProf.valleyTreePalette;
    tint.setHex(summerPal[i % summerPal.length]);
    summerCrownInst.setColorAt(i, tint);

    // Autumn tiered maple crown + fallen leaf ring flush on ground
    dummy.scale.set(s * 1.04, s * 1.02, s * 1.04);
    dummy.updateMatrix();
    autumnCrownInst.setMatrixAt(i, dummy.matrix);
    const autumnPal = sp.isHeroSakura ? autumnProf.heroTreePalette : autumnProf.valleyTreePalette;
    tint.setHex(autumnPal[i % autumnPal.length]);
    autumnCrownInst.setColorAt(i, tint);

    dummy.position.set(sp.x, sp.y + 0.04, sp.z);
    dummy.scale.set(s * 1.1, 1.0, s * 1.1);
    dummy.updateMatrix();
    autumnLeafRingInst.setMatrixAt(i, dummy.matrix);
    tint.setHex(autumnPal[(i + 1) % autumnPal.length]);
    autumnLeafRingInst.setColorAt(i, tint);

    // Winter snow-dusted conifer pine (tall proud alpine silhouette)
    dummy.position.set(sp.x, sp.y - 0.08, sp.z);
    dummy.scale.set(s * 0.96, s * 1.12, s * 0.96);
    dummy.updateMatrix();
    winterPineNeedlesInst.setMatrixAt(i, dummy.matrix);
    winterPineSnowInst.setMatrixAt(i, dummy.matrix);
    const winterPal = sp.isHeroSakura ? winterProf.heroTreePalette : winterProf.valleyTreePalette;
    tint.setHex(winterPal[i % winterPal.length]);
    winterPineNeedlesInst.setColorAt(i, tint);
  });

  springBlossomAccentInst.count = heroCursor;
  summerFruitInst.count = heroCursor;

  const finalizeInst = (mesh: THREE.InstancedMesh) => {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  };
  [
    deciduousTrunksInst,
    pineTrunksInst,
    springCrownInst,
    springBlossomAccentInst,
    summerCrownInst,
    summerFruitInst,
    autumnCrownInst,
    autumnLeafRingInst,
    winterPineNeedlesInst,
    winterPineSnowInst,
  ].forEach(finalizeInst);

  group.add(
    deciduousTrunksInst,
    pineTrunksInst,
    springTreeGroup,
    summerTreeGroup,
    autumnTreeGroup,
    winterTreeGroup
  );

  // =========================================================================
  // 4. SEASONALLY SWAPPABLE 3D GROUND PLANTS BESIDE RAILWAY, STATION & PATHS
  //    - Spring: 3D Stemmed Tulips & Cupped Wildflower Clusters
  //    - Summer: Tall Radiant 3D Sunflowers & Lush Ferns
  //    - Autumn: Forest Toadstool Clusters & Curled Leaf Mounds
  //    - Winter: Snow-Dusted Holly Shrubs, Frost Crystals & Crimson Winter Berries
  // =========================================================================
  const plantCount = 260;
  interface PlantSpot {
    x: number;
    y: number;
    z: number;
    rotY: number;
    scale: number;
  }
  const plantSpots: PlantSpot[] = [];

  // Hand-placed foreground garden beds right around Sakuragawa Station & Plaza for immediate visual joy
  const curatedPlantCoords: Array<[number, number]> = [
    [-11.5, 17.6], [-8.8, 18.2], [-6.0, 17.8], [6.4, 17.9], [9.2, 18.4], [12.4, 17.8],
    [-14.8, 14.5], [-15.2, 12.2], [14.2, 17.4], [-4.2, 19.6], [3.4, 19.5], [7.8, 19.8],
    [-12.2, 19.4], [10.8, 20.1], [-17.4, 16.5], [16.5, 16.2],
  ];
  curatedPlantCoords.forEach(([px, pz]) => {
    plantSpots.push({
      x: px,
      y: groundHeightAt(px, pz),
      z: pz,
      rotY: rand() * Math.PI * 2,
      scale: 0.95 + rand() * 0.42,
    });
  });

  for (let i = 0; i < plantCount * 5 && plantSpots.length < plantCount; i++) {
    const x = (rand() - 0.5) * 145;
    const z = (rand() - 0.5) * 145;
    const dRail = distanceToRail(x, z);
    const dPath = distToPath(x, z);
    if (dRail > 9.5 && dPath > 8.5) continue;
    if (dRail < 2.6 || dPath < 1.8 || isWaterAt(x, z)) continue;
    if (isInsideDesertBiome(x, z)) continue;
    if (x < -56 && z < -38) continue;
    plantSpots.push({
      x,
      y: groundHeightAt(x, z),
      z,
      rotY: rand() * Math.PI * 2,
      scale: 0.8 + rand() * 0.55,
    });
  }

  const pCount = plantSpots.length;

  // Build 4 distinct composite 3D plant geometries
  const springStemGeo = createSpringTulipStemsGeometry();
  const springBloomGeo = createSpringTulipBloomsGeometry();
  const summerStalkGeo = createSummerSunflowerStalksGeometry();
  const summerHeadGeo = createSummerSunflowerHeadsGeometry();
  const autumnStemGeo = createAutumnMushroomStemsGeometry();
  const autumnCapGeo = createAutumnMushroomCapsGeometry();
  const winterBushGeo = createWinterHollyBushGeometry();
  const winterSnowGeo = createWinterHollySnowCapGeometry();
  const winterBerryGeo = createWinterHollyBerriesGeometry();

  disposables.push(
    springStemGeo,
    springBloomGeo,
    summerStalkGeo,
    summerHeadGeo,
    autumnStemGeo,
    autumnCapGeo,
    winterBushGeo,
    winterSnowGeo,
    winterBerryGeo
  );

  const plantGreenMat = new THREE.MeshStandardMaterial({ color: 0x3f7843, roughness: 0.84 });
  const springBloomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58 });
  const summerHeadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x4f3400),
    emissiveIntensity: 0.12,
    roughness: 0.55,
  });
  const autumnStemMat = new THREE.MeshStandardMaterial({ color: 0xf0e1c6, roughness: 0.85 });
  const autumnCapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62 });
  const winterBushMat = new THREE.MeshStandardMaterial({ color: 0x1f4739, roughness: 0.88 });
  const winterPlantSnowMat = new THREE.MeshStandardMaterial({ color: 0xf0f7ff, roughness: 0.55 });
  const winterBerryMat = new THREE.MeshStandardMaterial({
    color: 0xd92b3a,
    emissive: new THREE.Color(0x4a0b12),
    emissiveIntensity: 0.25,
    roughness: 0.32,
  });

  disposables.push(
    plantGreenMat,
    springBloomMat,
    summerHeadMat,
    autumnStemMat,
    autumnCapMat,
    winterBushMat,
    winterPlantSnowMat,
    winterBerryMat
  );

  const springPlantGroup = new THREE.Group();
  const springStemInst = new THREE.InstancedMesh(springStemGeo, plantGreenMat, pCount);
  const springBloomInst = new THREE.InstancedMesh(springBloomGeo, springBloomMat, pCount);
  springPlantGroup.add(springStemInst, springBloomInst);

  const summerPlantGroup = new THREE.Group();
  const summerStalkInst = new THREE.InstancedMesh(summerStalkGeo, plantGreenMat, pCount);
  const summerHeadInst = new THREE.InstancedMesh(summerHeadGeo, summerHeadMat, pCount);
  summerPlantGroup.add(summerStalkInst, summerHeadInst);

  const autumnPlantGroup = new THREE.Group();
  const autumnStemInst = new THREE.InstancedMesh(autumnStemGeo, autumnStemMat, pCount);
  const autumnCapInst = new THREE.InstancedMesh(autumnCapGeo, autumnCapMat, pCount);
  autumnPlantGroup.add(autumnStemInst, autumnCapInst);

  const winterPlantGroup = new THREE.Group();
  const winterBushInst = new THREE.InstancedMesh(winterBushGeo, winterBushMat, pCount);
  const winterSnowInst = new THREE.InstancedMesh(winterSnowGeo, winterPlantSnowMat, pCount);
  const winterBerryInst = new THREE.InstancedMesh(winterBerryGeo, winterBerryMat, pCount);
  winterPlantGroup.add(winterBushInst, winterSnowInst, winterBerryInst);

  plantSpots.forEach((p, idx) => {
    dummy.position.set(p.x, p.y - 0.02, p.z);
    dummy.rotation.set(0, p.rotY, 0);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();

    springStemInst.setMatrixAt(idx, dummy.matrix);
    springBloomInst.setMatrixAt(idx, dummy.matrix);
    tint.setHex(springProf.plantAccentPalette[idx % springProf.plantAccentPalette.length]);
    springBloomInst.setColorAt(idx, tint);

    summerStalkInst.setMatrixAt(idx, dummy.matrix);
    summerHeadInst.setMatrixAt(idx, dummy.matrix);
    tint.setHex(summerProf.plantAccentPalette[idx % summerProf.plantAccentPalette.length]);
    summerHeadInst.setColorAt(idx, tint);

    autumnStemInst.setMatrixAt(idx, dummy.matrix);
    autumnCapInst.setMatrixAt(idx, dummy.matrix);
    tint.setHex(autumnProf.plantAccentPalette[idx % autumnProf.plantAccentPalette.length]);
    autumnCapInst.setColorAt(idx, tint);

    winterBushInst.setMatrixAt(idx, dummy.matrix);
    winterSnowInst.setMatrixAt(idx, dummy.matrix);
    winterBerryInst.setMatrixAt(idx, dummy.matrix);
  });

  [
    springStemInst,
    springBloomInst,
    summerStalkInst,
    summerHeadInst,
    autumnStemInst,
    autumnCapInst,
    winterBushInst,
    winterSnowInst,
    winterBerryInst,
  ].forEach((m) => {
    m.frustumCulled = false;
    finalizeInst(m);
  });

  group.add(springPlantGroup, summerPlantGroup, autumnPlantGroup, winterPlantGroup);

  // =========================================================================
  // 5. LIVING DETAILS: SEASONAL PETALS/POLLEN/LEAVES/SNOW & WEATHER
  // =========================================================================
  const softSpriteTex = createSoftCircleTexture();
  disposables.push(softSpriteTex);

  const moteCount = 150;
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
    size: 0.28,
    transparent: true,
    opacity: 0.78,
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
  let activeProfile: SeasonalFoliageProfile = getSeasonalFoliageProfile('spring');

  const applySeason = (season: SeasonType): SeasonalFoliageProfile => {
    const profile = getSeasonalFoliageProfile(season);
    if (season === appliedSeason) {
      return activeProfile;
    }
    appliedSeason = season;
    activeProfile = profile;

    // Dynamically swap 3D tree & trunk models
    const isWinter = season === 'winter';
    deciduousTrunksInst.visible = !isWinter;
    pineTrunksInst.visible = isWinter;
    springTreeGroup.visible = season === 'spring';
    summerTreeGroup.visible = season === 'summer';
    autumnTreeGroup.visible = season === 'autumn';
    winterTreeGroup.visible = isWinter;

    // Dynamically swap 3D ground plant models
    springPlantGroup.visible = season === 'spring';
    summerPlantGroup.visible = season === 'summer';
    autumnPlantGroup.visible = season === 'autumn';
    winterPlantGroup.visible = isWinter;

    // Update meadow grass, terrain tint, wind response & seasonal motes
    grassUniforms.uGrassScaleY.value = profile.grassScaleY;
    treeWindUniforms.uWindMult.value = profile.canopyWindMultiplier;
    grassMat.color.setHex(profile.grassTintHex);
    terrainMat.color.setHex(profile.terrainTintHex);
    moteMat.color.setHex(profile.moteColorHex);
    moteMat.opacity = profile.moteOpacity;
    moteMat.size = profile.moteSize;

    // Bark tint shifts subtly warm in autumn vs deep bark in summer
    trunkMat.color.setHex(
      season === 'autumn' ? 0x523728 : season === 'summer' ? 0x453125 : 0x4c372d
    );

    return profile;
  };

  // Initialize default spring 3D models immediately on creation
  applySeason('spring');

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
    if (season !== appliedSeason) {
      applySeason(season);
    }

    const weatherProfile = getWeatherProfile(weather);
    grassUniforms.uTime.value = elapsed;
    const targetWind = weatherProfile.windStrength;
    grassUniforms.uWindStrength.value +=
      (targetWind - grassUniforms.uWindStrength.value) * Math.min(1, dt * 2.4);
    void sunIntensity;

    const showMotes = !weatherProfile.isExtremeStorm;
    motes.visible = showMotes;
    if (showMotes) {
      const mArr = moteGeo.attributes.position.array as Float32Array;
      const fallRate = season === 'winter' ? 0.65 : season === 'autumn' ? 0.52 : 0.36;
      for (let i = 0; i < moteCount; i++) {
        mArr[i * 3] +=
          Math.sin(elapsed * 0.6 + i) * dt * 0.44 + dt * (0.32 + weatherProfile.windStrength * 0.8);
        mArr[i * 3 + 1] -= dt * fallRate;
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
    applySeason,
    getActiveProfile: () => activeProfile,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.remove(group);
    },
  };
}

// ===========================================================================
// COMPOSITE PROCEDURAL 3D SEASONAL TREE & PLANT GEOMETRY BUILDERS
// ===========================================================================

function mergeOrThrow(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const normalized = parts.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g.clone();
    if (!ng.getAttribute('normal')) ng.computeVertexNormals();
    if (ng.getAttribute('uv')) ng.deleteAttribute('uv');
    g.dispose();
    return ng;
  });
  const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
  normalized.forEach((g) => g.dispose());
  if (!merged) throw new Error('Failed to merge seasonal foliage geometry');
  merged.computeVertexNormals();
  return merged;
}

function makeOrganicLobe(
  radius: number,
  sx: number,
  sy: number,
  sz: number,
  ox: number,
  oy: number,
  oz: number,
  seed: number
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const jitter = 0.86 + 0.24 * Math.sin(vx * 3.1 + vy * 2.5 + seed) * Math.cos(vz * 3.2 - seed);
    pos.setXYZ(i, vx * sx * jitter + ox, vy * sy * jitter + oy, vz * sz * jitter + oz);
  }
  return geo;
}

function createBranchedTrunkGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const main = new THREE.CylinderGeometry(0.16, 0.36, 3.6, 7);
  main.translate(0, 1.8, 0);
  parts.push(main);

  // Flared root buttress
  const roots = new THREE.CylinderGeometry(0.32, 0.52, 0.65, 7);
  roots.translate(0, 0.32, 0);
  parts.push(roots);

  // 3 graceful angled upper boughs supporting the canopy
  const boughs: Array<[number, number, number]> = [
    [0.52, 0.4, 0.55],
    [-0.48, 2.5, 0.5],
    [0.44, 4.6, 0.48],
  ];
  boughs.forEach(([tilt, rotY, len]) => {
    const b = new THREE.CylinderGeometry(0.07, 0.14, 1.85 + len, 6);
    b.translate(0, 0.95, 0);
    b.rotateZ(tilt);
    b.rotateY(rotY);
    b.translate(0, 2.55, 0);
    parts.push(b);
  });
  return mergeOrThrow(parts);
}

function createPineTrunkGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.08, 0.28, 4.2, 7);
  trunk.translate(0, 2.1, 0);
  parts.push(trunk);
  const base = new THREE.CylinderGeometry(0.26, 0.42, 0.5, 7);
  base.translate(0, 0.25, 0);
  parts.push(base);
  return mergeOrThrow(parts);
}

function createCherryBlossomCrownGeometry(): THREE.BufferGeometry {
  const lobes: Array<[number, number, number, number, number, number, number]> = [
    [1.45, 1.28, 0.74, 1.24, 0, 4.65, 0],
    [1.22, 1.24, 0.72, 1.18, -1.65, 3.95, 0.85],
    [1.24, 1.22, 0.72, 1.16, 1.58, 4.05, -0.72],
    [1.12, 1.18, 0.7, 1.15, 0.45, 3.72, 1.55],
    [1.08, 1.16, 0.72, 1.12, -0.95, 5.15, -0.58],
    [1.02, 1.14, 0.7, 1.08, 1.05, 4.88, 0.76],
    [0.98, 1.15, 0.68, 1.12, -1.15, 3.65, -1.18],
  ];
  return mergeOrThrow(
    lobes.map(([r, sx, sy, sz, ox, oy, oz], idx) =>
      makeOrganicLobe(r, sx, sy, sz, ox, oy, oz, idx * 1.7)
    )
  );
}

function createBlossomClusterAccentGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Hanging cherry blossom petal clusters & bright outer puffs
  const pendants: Array<[number, number, number, number]> = [
    [-2.0, 3.05, 1.1, 0.36],
    [1.95, 3.15, -0.95, 0.34],
    [0.6, 2.95, 1.85, 0.33],
    [-1.35, 2.88, -1.45, 0.32],
    [0.0, 5.45, 0.25, 0.42],
    [-1.4, 4.95, 0.55, 0.38],
    [1.35, 4.85, -0.4, 0.37],
  ];
  pendants.forEach(([x, y, z, r]) => {
    const g = new THREE.OctahedronGeometry(r, 1);
    g.scale(1.15, 0.88, 1.15);
    g.translate(x, y, z);
    parts.push(g);
  });
  return mergeOrThrow(parts);
}

function createSummerBroadleafCrownGeometry(): THREE.BufferGeometry {
  // Full, expansive sunlit emerald canopy dome with 7 dense overlapping lobes
  const lobes: Array<[number, number, number, number, number, number, number]> = [
    [1.58, 1.24, 0.96, 1.24, 0, 4.65, 0],
    [1.32, 1.18, 0.92, 1.18, -1.52, 3.9, 0.92],
    [1.34, 1.18, 0.92, 1.16, 1.48, 3.95, -0.82],
    [1.22, 1.16, 0.9, 1.16, 0.35, 3.85, 1.52],
    [1.2, 1.15, 0.92, 1.14, -0.78, 3.9, -1.38],
    [1.18, 1.12, 0.95, 1.12, 0.72, 5.25, 0.55],
    [1.14, 1.1, 0.96, 1.1, -0.55, 5.48, -0.45],
  ];
  return mergeOrThrow(
    lobes.map(([r, sx, sy, sz, ox, oy, oz], idx) =>
      makeOrganicLobe(r, sx, sy, sz, ox, oy, oz, idx * 2.3 + 5.0)
    )
  );
}

function createSummerFruitAccentGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const spots: Array<[number, number, number]> = [
    [-1.75, 3.4, 1.05],
    [1.68, 3.55, -0.92],
    [0.52, 3.32, 1.72],
    [-0.95, 3.45, -1.45],
    [1.12, 4.62, 0.92],
    [-1.25, 4.55, 0.15],
  ];
  spots.forEach(([x, y, z]) => {
    const f = new THREE.SphereGeometry(0.16, 6, 5);
    f.translate(x, y, z);
    parts.push(f);
  });
  return mergeOrThrow(parts);
}

function createAutumnMapleCrownGeometry(): THREE.BufferGeometry {
  // Distinctive horizontal Japanese Maple pagoda tiers (flat, wide scalloped layers!)
  const parts: THREE.BufferGeometry[] = [];
  const tiers: Array<[number, number, number, number, number]> = [
    [2.65, 0.62, 3.35, 0.15, 0.08],
    [2.25, 0.58, 4.35, -0.22, -0.14],
    [1.75, 0.54, 5.25, 0.16, 0.12],
    [1.18, 0.48, 6.02, -0.05, 0.02],
  ];
  tiers.forEach(([r, h, y, ox, oz], idx) => {
    const tier = new THREE.CylinderGeometry(r * 0.68, r, h, 7);
    const pos = tier.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const ang = Math.atan2(vz, vx);
      const scallop = 0.88 + 0.18 * Math.sin(ang * 5 + idx * 1.4);
      pos.setXYZ(i, vx * scallop + ox, vy + y, vz * scallop + oz);
    }
    parts.push(tier);
  });
  return mergeOrThrow(parts);
}

function createAutumnFallenLeafRingGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + 0.25;
    const r = 1.05 + (i % 2) * 0.48;
    const mound = new THREE.ConeGeometry(0.68, 0.14, 6);
    mound.scale(1.2, 1.0, 0.9);
    mound.translate(Math.cos(ang) * r, 0.06, Math.sin(ang) * r);
    parts.push(mound);
  }
  return mergeOrThrow(parts);
}

function createWinterPineNeedlesGeometry(): THREE.BufferGeometry {
  // 4 stacked serrated evergreen conifer pine bough cones
  const parts: THREE.BufferGeometry[] = [];
  const tiers: Array<[number, number, number]> = [
    [2.25, 2.05, 2.35],
    [1.82, 1.9, 3.65],
    [1.36, 1.72, 4.82],
    [0.86, 1.55, 5.88],
  ];
  tiers.forEach(([r, h, y], idx) => {
    const cone = new THREE.ConeGeometry(r, h, 8);
    cone.rotateY(idx * 0.42);
    cone.translate(0, y, 0);
    parts.push(cone);
  });
  return mergeOrThrow(parts);
}

function createWinterPineSnowCapGeometry(): THREE.BufferGeometry {
  // Matching snow-dusted mantles resting cleanly atop each pine needle tier + snowy spire tip
  const parts: THREE.BufferGeometry[] = [];
  const caps: Array<[number, number, number]> = [
    [1.92, 0.85, 2.98],
    [1.56, 0.78, 4.22],
    [1.16, 0.72, 5.34],
    [0.74, 0.78, 6.28],
  ];
  caps.forEach(([r, h, y], idx) => {
    const cap = new THREE.ConeGeometry(r, h, 8);
    cap.rotateY(idx * 0.42);
    cap.translate(0, y, 0);
    parts.push(cap);
  });
  return mergeOrThrow(parts);
}

// ---------------------------------------------------------------------------
// 4 SEASONAL 3D GROUND PLANT GEOMETRY BUILDERS
// ---------------------------------------------------------------------------

function createSpringTulipStemsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const stems: Array<[number, number, number, number]> = [
    [-0.1, 0.04, 0.34, 0.14],
    [0.09, -0.05, 0.4, -0.12],
    [0.01, 0.09, 0.31, 0.08],
  ];
  stems.forEach(([ox, oz, h, tilt]) => {
    const s = new THREE.CylinderGeometry(0.016, 0.022, h, 5);
    s.translate(0, h * 0.5, 0);
    s.rotateZ(tilt);
    s.translate(ox, 0, oz);
    parts.push(s);
    const leaf = new THREE.ConeGeometry(0.045, 0.22, 4);
    leaf.rotateZ(tilt > 0 ? -0.55 : 0.55);
    leaf.translate(ox, 0.1, oz);
    parts.push(leaf);
  });
  return mergeOrThrow(parts);
}

function createSpringTulipBloomsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const blooms: Array<[number, number, number, number]> = [
    [-0.15, 0.36, 0.04, 0.085],
    [0.14, 0.42, -0.05, 0.095],
    [-0.02, 0.33, 0.09, 0.08],
  ];
  blooms.forEach(([x, y, z, r]) => {
    // Cupped tulip chalice (inverted open cone + inner core)
    const cup = new THREE.CylinderGeometry(r * 1.12, r * 0.42, r * 1.45, 6);
    cup.translate(x, y, z);
    parts.push(cup);
  });
  return mergeOrThrow(parts);
}

function createSummerSunflowerStalksGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const stalks: Array<[number, number, number, number]> = [
    [-0.1, 0.03, 0.72, 0.08],
    [0.11, -0.04, 0.84, -0.09],
  ];
  stalks.forEach(([ox, oz, h, tilt]) => {
    const st = new THREE.CylinderGeometry(0.024, 0.034, h, 6);
    st.translate(0, h * 0.5, 0);
    st.rotateZ(tilt);
    st.translate(ox, 0, oz);
    parts.push(st);

    // Broad fern-like summer leaves
    for (let li = 0; li < 2; li++) {
      const lf = new THREE.ConeGeometry(0.11, 0.32, 5);
      lf.scale(1.0, 1.0, 0.28);
      lf.rotateZ(li === 0 ? 0.95 : -0.95);
      lf.translate(ox + (li === 0 ? -0.11 : 0.11), h * (0.35 + li * 0.2), oz);
      parts.push(lf);
    }
  });
  return mergeOrThrow(parts);
}

function createSummerSunflowerHeadsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const heads: Array<[number, number, number, number]> = [
    [-0.16, 0.74, 0.03, 0.16],
    [0.18, 0.86, -0.04, 0.18],
  ];
  heads.forEach(([x, y, z, r]) => {
    const disc = new THREE.CylinderGeometry(r, r * 0.85, 0.055, 10);
    disc.rotateX(Math.PI * 0.36);
    disc.translate(x, y, z);
    parts.push(disc);
  });
  return mergeOrThrow(parts);
}

function createAutumnMushroomStemsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const shrooms: Array<[number, number, number, number]> = [
    [-0.08, 0.04, 0.24, 0.042],
    [0.1, -0.04, 0.18, 0.034],
    [0.02, 0.11, 0.14, 0.028],
  ];
  shrooms.forEach(([x, z, h, r]) => {
    const st = new THREE.CylinderGeometry(r * 0.8, r * 1.15, h, 6);
    st.translate(x, h * 0.5, z);
    parts.push(st);
  });
  return mergeOrThrow(parts);
}

function createAutumnMushroomCapsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const caps: Array<[number, number, number, number]> = [
    [-0.08, 0.25, 0.04, 0.15],
    [0.1, 0.19, -0.04, 0.12],
    [0.02, 0.15, 0.11, 0.095],
  ];
  caps.forEach(([x, y, z, r]) => {
    const cap = new THREE.ConeGeometry(r, r * 0.72, 8);
    cap.translate(x, y + r * 0.2, z);
    parts.push(cap);
  });
  return mergeOrThrow(parts);
}

function createWinterHollyBushGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const b1 = new THREE.DodecahedronGeometry(0.24, 0);
  b1.scale(1.25, 0.78, 1.15);
  b1.translate(0, 0.16, 0);
  parts.push(b1);
  const b2 = new THREE.DodecahedronGeometry(0.17, 0);
  b2.scale(1.15, 0.75, 1.1);
  b2.translate(0.18, 0.12, 0.08);
  parts.push(b2);
  return mergeOrThrow(parts);
}

function createWinterHollySnowCapGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s1 = new THREE.SphereGeometry(0.22, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55);
  s1.scale(1.22, 0.65, 1.12);
  s1.translate(0, 0.24, 0);
  parts.push(s1);
  const s2 = new THREE.SphereGeometry(0.15, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55);
  s2.scale(1.12, 0.6, 1.08);
  s2.translate(0.18, 0.18, 0.08);
  parts.push(s2);
  return mergeOrThrow(parts);
}

function createWinterHollyBerriesGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const berries: Array<[number, number, number]> = [
    [-0.14, 0.22, 0.16],
    [0.06, 0.26, -0.14],
    [0.22, 0.19, 0.16],
    [-0.04, 0.29, 0.18],
  ];
  berries.forEach(([x, y, z]) => {
    const b = new THREE.SphereGeometry(0.032, 5, 4);
    b.translate(x, y, z);
    parts.push(b);
  });
  return mergeOrThrow(parts);
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
