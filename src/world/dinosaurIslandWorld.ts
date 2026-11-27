import * as THREE from 'three';
import {
  DINOSAUR_CRYSTAL_LAKE_CENTER,
  DINOSAUR_CRYSTAL_LAKE_RX,
  DINOSAUR_CRYSTAL_LAKE_RZ,
  DINOSAUR_ISLAND_CENTER,
  DINOSAUR_ISLAND_HELIPAD_POS,
  DINOSAUR_ISLAND_LAND_RADIUS,
  DINOSAUR_LAKE_WATER_Y,
  DINOSAUR_MARINA_PIER_BOUNDS,
  DINOSAUR_PERIMETER_GATES,
  DINOSAUR_PERIMETER_WALL_HEIGHT,
  DINOSAUR_PERIMETER_WALL_RADIUS,
  DINOSAUR_RIVER_BRIDGE_LZS,
  DINOSAUR_RIVER_END_LZ,
  DINOSAUR_RIVER_START_LZ,
  DINOSAUR_ROOF_DOOR_Y,
  DINOSAUR_TRIANGLE_PLACES,
  DINOSAUR_TRIANGLE_VERTICES,
  SSJ_DINOSAUR_SPECIES,
  SSJ_ISLAND_LANDMARKS,
  dinoCrystalLakeNormDist,
  distanceToDinosaurTriangleTrack,
  sampleDinosaurTriangleTrack,
  ssjRiverHalfWidth,
  ssjRiverLocalX,
  ssjRiverWaterY,
  type DinosaurIslandState,
  type DinosaurPerimeterGateSpec,
  type SsjDinosaurSpeciesSpec,
} from '../game/dinosaurIsland';
import { WATER_LEVEL, WILDLIFE_FOREST_SANCTUARY_CENTER, groundHeightAt } from '../game/terrain';
import { vaultFloorYAt } from '../game/homeUndergroundVault';
import type { InteractableItem } from '../game/types';

export interface DinosaurIslandWorldSystem {
  group: THREE.Group;
  gateInteractable: InteractableItem;
  triggerWallShatter: (stage: number) => void;
  setSafariCarOnlyVisible: (onlyCar: boolean) => void;
  update: (state: DinosaurIslandState, elapsed: number, dt: number, lanternStrength: number) => void;
  dispose: () => void;
}

interface AnimatedAmbientDino {
  spec: SsjDinosaurSpeciesSpec;
  root: THREE.Group;
  leftLeg?: THREE.Group;
  rightLeg?: THREE.Group;
  tail?: THREE.Group;
  wingL?: THREE.Group;
  wingR?: THREE.Group;
  jaw?: THREE.Group;
  phaseOffset: number;
}

function createSsjGrandArchSignTexture(titleText = 'JURASSIC PARK'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 224;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 224);
  grad.addColorStop(0, '#1e0b04');
  grad.addColorStop(0.5, '#120703');
  grad.addColorStop(1, '#2d1106');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 224);

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 1004, 204);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, 976, 176);

  for (const cx of [86, 938]) {
    ctx.beginPath();
    ctx.arc(cx, 112, 46, 0, Math.PI * 2);
    ctx.fillStyle = '#b91c1c';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('JP', cx, 114);
  }

  ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 72px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, 512, 92);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fb923c';
  ctx.font = '900 23px system-ui, sans-serif';
  ctx.fillText('GRAND DINOSAUR SANCTUARY · AUTO-OPENING GATE & TRIANGLE TRACK', 512, 164);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTrianglePlaceSignTexture(
  order: number,
  name: string,
  subtitle: string,
  accentHex: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 192;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 768, 192);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#182235');
  grad.addColorStop(1, '#0b1120');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 192);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 752, 176);

  // Triangular badge icon on left
  ctx.beginPath();
  ctx.moveTo(76, 46);
  ctx.lineTo(122, 134);
  ctx.lineTo(30, 134);
  ctx.closePath();
  ctx.fillStyle = accentHex;
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`0${order}`, 76, 108);

  ctx.textAlign = 'left';
  ctx.fillStyle = accentHex;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText(`TRIANGLE TRACK · PLACE ${order} OF 6`, 148, 52);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 34px system-ui, sans-serif';
  ctx.fillText(name.slice(0, 34), 148, 98);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.fillText(subtitle.slice(0, 56), 148, 144);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createIslandHelipadTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(172, 136, 36, 240);
  ctx.fillRect(304, 136, 36, 240);
  ctx.fillRect(172, 238, 168, 36);
  ctx.fillStyle = '#fb923c';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JP ISLAND PAD', 256, 434);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHazardStripeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#eab308';
  for (let x = -64; x < 320; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x + 22, 64);
    ctx.lineTo(x + 48, 0);
    ctx.lineTo(x + 26, 0);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the Gigantic 1 KM (1,000m across!) Jurassic Park · SSJ Dinosaur Island 3D sanctuary:
 * - Dedicated High-Resolution Lush Emerald Prehistoric Jungle Terrain (ZERO white layer / ZERO snow / ZERO ocean swash bleed!)
 * - Colossal 360° Jurassic-Style Perimeter Boundary Gate Wall (34m tall towers, riveted dark basalt walls, amber hazard stripes & torches)
 * - Automated Gigantic Horizontal Upper Roof Doors spanning the ENTIRE 1 KM island top (CLOSE at night, slide WIDE OPEN at morning!)
 * - Colossal Motorized Swinging Jurassic Park Grand Entrance Gate fused directly into the southern boundary wall
 * - 1 KM Primeval Jungle Forest (~1,800 instanced redwoods, conifers, tropical palms, giant ferns & mossy boulders)
 * - Scenic 172m × 124m Jurassic Crystal Lake + ~1,050m (1 KM) Continuous Flowing Forest River + 32m Northern Volcanic Waterfall + 4 Walkable Timber Bridges
 * - Rotunda Visitor Center & T-Rex Fossil Atrium, Hostel Resort, Glass Pavilion, Genomic Lab, Marina Pier & Rescue Helipad
 * - All 18 Animated Prehistoric Dinosaur Species + Drivable Safari Tour Cruiser
 */
export function buildDinosaurIslandWorld(isSoftwareGl: boolean): DinosaurIslandWorldSystem {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const ix = DINOSAUR_ISLAND_CENTER.x;
  const iz = DINOSAUR_ISLAND_CENTER.z;

  const worldPos = (lx: number, lz: number) => ({
    x: ix + lx,
    y: groundHeightAt(ix + lx, iz + lz),
    z: iz + lz,
  });

  // =========================================================================
  // 0. DEDICATED HIGH-RES LUSH EMERALD 1 KM ISLAND TERRAIN (ZERO WHITE LAYER!)
  // =========================================================================
  const islandPlaneSize = (DINOSAUR_ISLAND_LAND_RADIUS + 34) * 2;
  const islandSegs = 160;
  const islandGeo = new THREE.PlaneGeometry(islandPlaneSize, islandPlaneSize, islandSegs, islandSegs);
  islandGeo.rotateX(-Math.PI / 2);

  const iPos = islandGeo.attributes.position as THREE.BufferAttribute;
  const iColors = new Float32Array(iPos.count * 3);
  const cDeepJungle = new THREE.Color(0x1f4d26);
  const cLushEmerald = new THREE.Color(0x2f6b33);
  const cSunMeadow = new THREE.Color(0x467a36);
  const cTrailEarth = new THREE.Color(0x7c6548);
  const cVolcanicBasalt = new THREE.Color(0x3a3e46);
  const cRiverBed = new THREE.Color(0x355249);
  const cCoastalEarth = new THREE.Color(0x5c533e);
  const cTmp = new THREE.Color();

  for (let i = 0; i < iPos.count; i++) {
    const lx = iPos.getX(i);
    const lz = iPos.getZ(i);
    const wx = ix + lx;
    const wz = iz + lz;
    const dist = Math.hypot(lx, lz);
    let y = groundHeightAt(wx, wz);

    // Smoothly tuck outer vertices outside the island footprint down below the ocean seabed
    if (dist > DINOSAUR_ISLAND_LAND_RADIUS + 18) {
      const sinkT = Math.min(1, (dist - (DINOSAUR_ISLAND_LAND_RADIUS + 18)) / 22);
      y = y * (1 - sinkT) + -16.5 * sinkT;
    }
    iPos.setY(i, y);

    // Rich lush prehistoric emerald forest vertex palette (ZERO snow, ZERO chalky white!)
    const fWave = Math.sin(lx * 0.025 + lz * 0.02) * 0.5 + 0.5;
    const fPatch = Math.cos(lx * 0.014 - lz * 0.019) * 0.5 + 0.5;
    cTmp.copy(cDeepJungle).lerp(cLushEmerald, fWave * 0.72).lerp(cSunMeadow, fPatch * 0.32);

    const dLake = dinoCrystalLakeNormDist(wx, wz);
    const inRiverSpan = lz >= DINOSAUR_RIVER_START_LZ - 10 && lz <= DINOSAUR_RIVER_END_LZ + 8;
    const riverDist = inRiverSpan ? Math.abs(lx - ssjRiverLocalX(lz)) : 999;
    const riverHalfW = inRiverSpan ? ssjRiverHalfWidth(lz) : 9.2;

    if (y > 6.5) {
      // Towering dark volcanic basalt massif at the northern waterfall headwaters
      const cliffT = Math.min(1, (y - 6.5) / 14.0);
      cTmp.lerp(cVolcanicBasalt, 0.35 + cliffT * 0.58);
    } else if (dLake < 1.12 || riverDist < riverHalfW + 5.5) {
      // Dark mossy pebble riverbed & lake shoreline
      const wetT =
        dLake < 1.12
          ? Math.max(0, Math.min(1, 1 - (dLake - 0.7) / 0.42))
          : Math.max(0, Math.min(1, 1 - (riverDist - riverHalfW * 0.5) / (riverHalfW * 0.5 + 5.5)));
      cTmp.lerp(cRiverBed, wetT * 0.85);
    } else if (dist > DINOSAUR_PERIMETER_WALL_RADIUS - 10) {
      // Dark fortified coastal earth & volcanic shore outside the 360° perimeter wall
      const rimT = Math.min(1, (dist - (DINOSAUR_PERIMETER_WALL_RADIUS - 10)) / 36);
      cTmp.lerp(cCoastalEarth, rimT * 0.78);
    }

    // Warm compacted Jurassic Safari Avenue running from South Grand Gate (lz=226) -> Rotunda Visitor Center (lz=112)
    if (Math.abs(lx) < 13 && lz > 96 && lz < 228) {
      const roadT = 1 - Math.min(1, Math.abs(lx) / 13);
      cTmp.lerp(cTrailEarth, roadT * 0.65);
    }
    // Subtle compacted shoulder flanking the Grand Triangle Explorer Track
    const triDist = distanceToDinosaurTriangleTrack(wx, wz);
    if (triDist < 8.5 && dLake > 1.05) {
      cTmp.lerp(cTrailEarth, (1 - triDist / 8.5) * 0.55);
    }
    // Perimeter patrol road hugging just inside the 360° Jurassic boundary gate wall
    const dWallRoad = Math.abs(dist - (DINOSAUR_PERIMETER_WALL_RADIUS - 10));
    if (dWallRoad < 6.5 && dLake > 1.1 && riverDist > riverHalfW + 4) {
      cTmp.lerp(cTrailEarth, (1 - dWallRoad / 6.5) * 0.48);
    }

    iColors[i * 3] = cTmp.r;
    iColors[i * 3 + 1] = cTmp.g;
    iColors[i * 3 + 2] = cTmp.b;
  }

  islandGeo.setAttribute('color', new THREE.BufferAttribute(iColors, 3));
  islandGeo.computeVertexNormals();
  const islandTerrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.0,
  });
  disposables.push(islandGeo, islandTerrainMat);

  const islandTerrainMesh = new THREE.Mesh(islandGeo, islandTerrainMat);
  islandTerrainMesh.position.set(ix, 0, iz);
  islandTerrainMesh.receiveShadow = true;
  group.add(islandTerrainMesh);

  // =========================================================================
  // SHARED PBR MATERIALS
  // =========================================================================
  const signTex = createSsjGrandArchSignTexture();
  const padTex = createIslandHelipadTexture();
  const hazardTex = createHazardStripeTexture();
  hazardTex.repeat.set(6, 1);
  disposables.push(signTex, padTex, hazardTex);

  const stonePillarMat = new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.88, metalness: 0.14 });
  const fortressWallMat = new THREE.MeshStandardMaterial({ color: 0x232933, roughness: 0.78, metalness: 0.34 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
  const warmWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.82 });
  const timberDeckMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.82 });
  const sandstoneBuildingMat = new THREE.MeshStandardMaterial({ color: 0xd6c7ad, roughness: 0.74 });
  const tealRoofMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.6 });
  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.1,
    roughness: 0.25,
  });
  const cyanGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
    roughness: 0.14,
    metalness: 0.25,
    transparent: true,
    opacity: isSoftwareGl ? 0.52 : 0.44,
    side: THREE.DoubleSide,
  });
  const poolWaterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.32,
    roughness: 0.16,
    metalness: 0.2,
  });
  const torchFlameMat = new THREE.MeshStandardMaterial({
    color: 0xfed7aa,
    emissive: 0xf97316,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xf59e0b,
    emissiveMap: signTex,
    emissiveIntensity: 0.38,
    roughness: 0.42,
  });
  const hazardStripeMat = new THREE.MeshStandardMaterial({
    map: hazardTex,
    emissive: 0xd97706,
    emissiveIntensity: 0.18,
    roughness: 0.55,
    metalness: 0.28,
  });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55, metalness: 0.05 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.46, metalness: 0.72 });
  const roofArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1f2836,
    roughness: 0.54,
    metalness: 0.64,
    side: THREE.DoubleSide,
  });
  const roofRibMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.48,
    metalness: 0.76,
    side: THREE.DoubleSide,
  });
  const roofBayLightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });
  const cliffRockMat = new THREE.MeshStandardMaterial({ color: 0x3f434a, roughness: 0.94, metalness: 0.04 });
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x523620, roughness: 0.92 });
  const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x1d5830, roughness: 0.8 });
  const pineCrownMat = new THREE.MeshStandardMaterial({ color: 0x266c3a, roughness: 0.78 });
  const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x2c7a36, roughness: 0.76, side: THREE.DoubleSide });
  const fernMat = new THREE.MeshStandardMaterial({ color: 0x358237, roughness: 0.82, side: THREE.DoubleSide });
  const amberCollectMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.5,
    roughness: 0.18,
  });
  const pearlCollectMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.2,
    roughness: 0.15,
  });
  disposables.push(
    stonePillarMat,
    fortressWallMat,
    darkWoodMat,
    warmWoodMat,
    timberDeckMat,
    sandstoneBuildingMat,
    tealRoofMat,
    warmWindowMat,
    cyanGlassMat,
    poolWaterMat,
    torchFlameMat,
    signMat,
    hazardStripeMat,
    boneMat,
    darkSteelMat,
    roofArmorMat,
    roofRibMat,
    roofBayLightMat,
    cliffRockMat,
    pineTrunkMat,
    pineLeafMat,
    pineCrownMat,
    palmFrondMat,
    fernMat,
    amberCollectMat,
    pearlCollectMat
  );

  // =========================================================================
  // 1. GIGANTIC 360° JURASSIC-STYLE PERIMETER BOUNDARY GATE WALL (r = 212m, 38m TALL!)
  //    Surrounds the ENTIRE Grand Dinosaur Island with colossal monolith towers,
  //    fortress curtain walls, amber hazard stripes & 4 BIGGER Auto-Opening Swinging Gates!
  // =========================================================================
  const WALL_SEGMENTS = 48;
  const WALL_R = DINOSAUR_PERIMETER_WALL_RADIUS;
  const WALL_H = DINOSAUR_PERIMETER_WALL_HEIGHT;
  const segChord = 2 * WALL_R * Math.sin(Math.PI / WALL_SEGMENTS) + 1.8;

  const riverOutAngle = Math.atan2(206, ssjRiverLocalX(210));

  const angleDiff = (a: number, b: number) => {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  };

  const isNearAnyPerimeterGate = (ang: number, tol: number) =>
    DINOSAUR_PERIMETER_GATES.some((g) => angleDiff(ang, g.angle) < tol);

  const wallTransforms: Array<{ x: number; y: number; z: number; rotY: number; isArchSpan: boolean }> = [];
  const towerTransforms: Array<{ x: number; y: number; z: number; rotY: number }> = [];

  for (let i = 0; i < WALL_SEGMENTS; i++) {
    const a0 = (i / WALL_SEGMENTS) * Math.PI * 2;
    const aMid = ((i + 0.5) / WALL_SEGMENTS) * Math.PI * 2;

    if (!isNearAnyPerimeterGate(a0, 0.12)) {
      const tx = ix + Math.cos(a0) * WALL_R;
      const tz = iz + Math.sin(a0) * WALL_R;
      const ty = Math.max(1.2, groundHeightAt(tx, tz));
      towerTransforms.push({ x: tx, y: ty, z: tz, rotY: -a0 + Math.PI * 0.5 });
    }

    const nearGate = isNearAnyPerimeterGate(aMid, 0.11);
    const nearRiverMouth = angleDiff(aMid, riverOutAngle) < 0.085;

    if (!nearGate) {
      const mx = ix + Math.cos(aMid) * WALL_R;
      const mz = iz + Math.sin(aMid) * WALL_R;
      const my = Math.max(1.2, groundHeightAt(mx, mz));
      wallTransforms.push({
        x: mx,
        y: my,
        z: mz,
        rotY: -aMid + Math.PI * 0.5,
        isArchSpan: nearRiverMouth,
      });
    }
  }

  const perimTowerGeo = new THREE.BoxGeometry(7.2, WALL_H + 3.6, 7.6);
  const perimCapGeo = new THREE.ConeGeometry(6.2, 4.8, 4);
  perimCapGeo.rotateY(Math.PI / 4);
  const perimFlameGeo = new THREE.SphereGeometry(1.55, 8, 8);
  const perimWallGeo = new THREE.BoxGeometry(segChord, WALL_H - 1.5, 4.6);
  const perimArchLintelGeo = new THREE.BoxGeometry(segChord, 12.0, 5.2);
  const perimStripeGeo = new THREE.BoxGeometry(segChord + 0.2, 2.4, 4.95);
  const perimTopBeamGeo = new THREE.BoxGeometry(segChord + 0.4, 2.8, 6.4);
  disposables.push(
    perimTowerGeo,
    perimCapGeo,
    perimFlameGeo,
    perimWallGeo,
    perimArchLintelGeo,
    perimStripeGeo,
    perimTopBeamGeo
  );

  const solidWalls = wallTransforms.filter((w) => !w.isArchSpan);
  const archSpans = wallTransforms.filter((w) => w.isArchSpan);

  const dummy = new THREE.Object3D();

  const perimTowerInst = new THREE.InstancedMesh(perimTowerGeo, stonePillarMat, towerTransforms.length);
  const perimCapInst = new THREE.InstancedMesh(perimCapGeo, darkWoodMat, towerTransforms.length);
  const perimTorchInst = new THREE.InstancedMesh(perimFlameGeo, torchFlameMat, towerTransforms.length);
  towerTransforms.forEach((t, idx) => {
    dummy.position.set(t.x, t.y + (WALL_H + 3.6) * 0.5 - 1.5, t.z);
    dummy.rotation.set(0, t.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    perimTowerInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(t.x, t.y + WALL_H + 4.0, t.z);
    dummy.updateMatrix();
    perimCapInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(t.x, t.y + WALL_H + 7.2, t.z);
    dummy.updateMatrix();
    perimTorchInst.setMatrixAt(idx, dummy.matrix);
  });
  perimTowerInst.instanceMatrix.needsUpdate = true;
  perimCapInst.instanceMatrix.needsUpdate = true;
  perimTorchInst.instanceMatrix.needsUpdate = true;
  group.add(perimTowerInst, perimCapInst, perimTorchInst);

  const perimWallInst = new THREE.InstancedMesh(perimWallGeo, fortressWallMat, solidWalls.length);
  const perimStripeInst = new THREE.InstancedMesh(perimStripeGeo, hazardStripeMat, solidWalls.length);
  const perimTopBeamInst = new THREE.InstancedMesh(perimTopBeamGeo, darkSteelMat, wallTransforms.length);
  solidWalls.forEach((w, idx) => {
    dummy.position.set(w.x, w.y + (WALL_H - 1.5) * 0.5 - 1.0, w.z);
    dummy.rotation.set(0, w.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    perimWallInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(w.x, w.y + 9.2, w.z);
    dummy.updateMatrix();
    perimStripeInst.setMatrixAt(idx, dummy.matrix);
  });
  wallTransforms.forEach((w, idx) => {
    dummy.position.set(w.x, DINOSAUR_ROOF_DOOR_Y - 1.4, w.z);
    dummy.rotation.set(0, w.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    perimTopBeamInst.setMatrixAt(idx, dummy.matrix);
  });
  perimWallInst.instanceMatrix.needsUpdate = true;
  perimStripeInst.instanceMatrix.needsUpdate = true;
  perimTopBeamInst.instanceMatrix.needsUpdate = true;
  group.add(perimWallInst, perimStripeInst, perimTopBeamInst);

  if (archSpans.length > 0) {
    const perimArchInst = new THREE.InstancedMesh(perimArchLintelGeo, fortressWallMat, archSpans.length);
    archSpans.forEach((w, idx) => {
      dummy.position.set(w.x, DINOSAUR_ROOF_DOOR_Y - 7.2, w.z);
      dummy.rotation.set(0, w.rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      perimArchInst.setMatrixAt(idx, dummy.matrix);
    });
    perimArchInst.instanceMatrix.needsUpdate = true;
    group.add(perimArchInst);
  }

  // =========================================================================
  // 2. GIGANTIC AUTOMATED HORIZONTAL UPPER ROOF DOORS (CLOSE AT NIGHT, OPEN AT MORNING!)
  //    Two colossal semi-circular horizontal armored steel roof leaves spanning
  //    the ENTIRE Dinosaur Island top (r = 218m, y = 40.0m) atop the 360° boundary wall!
  // =========================================================================
  const ROOF_R = WALL_R + 6.0; // 218m radius -> covers full 436m interior roof span!
  const ROOF_Y = DINOSAUR_ROOF_DOOR_Y;

  const gantryRingGeo = new THREE.TorusGeometry(WALL_R, 2.2, 8, 64);
  gantryRingGeo.rotateX(Math.PI / 2);
  const slideTrackGeo = new THREE.BoxGeometry(ROOF_R * 2.18, 2.4, 4.0);
  disposables.push(gantryRingGeo, slideTrackGeo);

  const gantryRing = new THREE.Mesh(gantryRingGeo, darkSteelMat);
  gantryRing.position.set(ix, ROOF_Y - 0.6, iz);
  group.add(gantryRing);

  for (const trackZ of [-ROOF_R * 0.62, ROOF_R * 0.62]) {
    const trackBeam = new THREE.Mesh(slideTrackGeo, darkSteelMat);
    trackBeam.position.set(ix, ROOF_Y + 1.8, iz + trackZ);
    group.add(trackBeam);
  }

  const buildHorizontalRoofLeaf = (side: -1 | 1): THREE.Group => {
    const leafGroup = new THREE.Group();
    leafGroup.position.set(ix, ROOF_Y, iz);

    const startAngle = side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5;
    const plateGeo = new THREE.CircleGeometry(ROOF_R, 48, startAngle, Math.PI);
    plateGeo.rotateX(-Math.PI / 2);
    disposables.push(plateGeo);

    const plateMesh = new THREE.Mesh(plateGeo, roofArmorMat);
    plateMesh.position.y = 0;
    leafGroup.add(plateMesh);

    const seamBeamGeo = new THREE.BoxGeometry(4.8, 2.8, ROOF_R * 2.0);
    const seamHazardGeo = new THREE.BoxGeometry(5.4, 1.3, ROOF_R * 1.98);
    disposables.push(seamBeamGeo, seamHazardGeo);

    const seamBeam = new THREE.Mesh(seamBeamGeo, darkSteelMat);
    seamBeam.position.set(side * 2.4, 0.2, 0);
    const seamHazard = new THREE.Mesh(seamHazardGeo, hazardStripeMat);
    seamHazard.position.set(side * 2.5, -1.0, 0);
    leafGroup.add(seamBeam, seamHazard);

    const trussOffsets = [-160, -106, -52, 0, 52, 106, 160];
    for (const tz of trussOffsets) {
      const chordHalf = Math.sqrt(Math.max(80, ROOF_R * ROOF_R - tz * tz));
      const ribGeo = new THREE.BoxGeometry(chordHalf, 2.0, 3.6);
      disposables.push(ribGeo);
      const rib = new THREE.Mesh(ribGeo, roofRibMat);
      rib.position.set(side * chordHalf * 0.5, -0.8, tz);
      leafGroup.add(rib);
    }

    for (const ringR of [68, 130, 188]) {
      const arcGeo = new THREE.RingGeometry(ringR - 2.6, ringR + 2.6, 32, 1, startAngle, Math.PI);
      arcGeo.rotateX(-Math.PI / 2);
      disposables.push(arcGeo);
      const arcMesh = new THREE.Mesh(arcGeo, roofRibMat);
      arcMesh.position.y = -1.2;
      leafGroup.add(arcMesh);
    }

    const bayGeo = new THREE.BoxGeometry(16, 0.55, 7);
    disposables.push(bayGeo);
    const bayCoords: Array<[number, number]> = [];
    for (const r of [52, 112, 172]) {
      for (let k = 0; k < 5; k++) {
        const frac = (k + 0.5) / 5;
        const ang = startAngle + frac * Math.PI;
        bayCoords.push([Math.cos(ang) * r, -Math.sin(ang) * r]);
      }
    }
    const bayInst = new THREE.InstancedMesh(bayGeo, roofBayLightMat, bayCoords.length);
    bayCoords.forEach(([bx, bz], idx) => {
      dummy.position.set(bx, -1.4, bz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bayInst.setMatrixAt(idx, dummy.matrix);
    });
    bayInst.instanceMatrix.needsUpdate = true;
    leafGroup.add(bayInst);

    return leafGroup;
  };

  const westRoofLeaf = buildHorizontalRoofLeaf(-1);
  const eastRoofLeaf = buildHorizontalRoofLeaf(1);
  group.add(westRoofLeaf, eastRoofLeaf);

  // =========================================================================
  // 3. FOUR BIGGER MONUMENTAL MOTORIZED SWINGING PERIMETER GATES (44m WIDE × 42m TALL!)
  //    Surround the island at South, West (Railway), North & East — each automatically
  //    swings its colossal twin doors WIDE OPEN whenever the explorer enters!
  // =========================================================================
  const towerBaseGeo = new THREE.CylinderGeometry(4.2, 5.4, 34.0, 4);
  towerBaseGeo.rotateY(Math.PI / 4);
  const towerCapTier1Geo = new THREE.ConeGeometry(6.8, 4.2, 4);
  towerCapTier1Geo.rotateY(Math.PI / 4);
  const towerCapTier2Geo = new THREE.ConeGeometry(4.6, 3.6, 4);
  towerCapTier2Geo.rotateY(Math.PI / 4);
  const timberCollarGeo = new THREE.BoxGeometry(7.8, 1.35, 7.8);
  const brazierGeo = new THREE.CylinderGeometry(1.6, 0.85, 1.6, 8);
  const flameGeo = new THREE.SphereGeometry(1.65, 10, 10);
  const sconceBracketGeo = new THREE.BoxGeometry(0.75, 0.75, 3.2);
  const lintelGeo = new THREE.BoxGeometry(44.0, 5.2, 6.2);
  const lintelRoofGeo = new THREE.BoxGeometry(46.8, 1.35, 7.8);
  const upperBridgeGeo = new THREE.BoxGeometry(44.0, 13.5, 4.8);
  const signFaceGeo = new THREE.PlaneGeometry(34.0, 6.4);
  const doorPlankGeo = new THREE.BoxGeometry(16.4, 19.2, 1.15);
  const doorStrapGeo = new THREE.BoxGeometry(16.6, 0.85, 1.32);
  const doorDiagGeo = new THREE.BoxGeometry(19.6, 0.68, 1.25);
  const latchGeo = new THREE.BoxGeometry(1.0, 2.4, 1.45);
  disposables.push(
    towerBaseGeo,
    towerCapTier1Geo,
    towerCapTier2Geo,
    timberCollarGeo,
    brazierGeo,
    flameGeo,
    sconceBracketGeo,
    lintelGeo,
    lintelRoofGeo,
    upperBridgeGeo,
    signFaceGeo,
    doorPlankGeo,
    doorStrapGeo,
    doorDiagGeo,
    latchGeo
  );

  const torchFlames: THREE.Mesh[] = [];
  const perimeterGateRigs: Array<{
    spec: DinosaurPerimeterGateSpec;
    worldX: number;
    worldY: number;
    worldZ: number;
    leftPivot: THREE.Group;
    rightPivot: THREE.Group;
  }> = [];

  const buildMonumentalPerimeterGate = (spec: DinosaurPerimeterGateSpec, idx: number) => {
    const spot = worldPos(spec.lx, spec.lz);
    const gateGroup = new THREE.Group();
    gateGroup.position.set(spot.x, spot.y, spot.z);
    // Local +Z faces outward from island center so doors swing cleanly inward (-Z)!
    gateGroup.rotation.y = -spec.angle + Math.PI * 0.5;

    const gateSignMat =
      idx === 0
        ? signMat
        : (() => {
            const tex = createSsjGrandArchSignTexture(spec.signTitle);
            const mat = new THREE.MeshStandardMaterial({
              map: tex,
              emissive: 0xf59e0b,
              emissiveMap: tex,
              emissiveIntensity: 0.38,
              roughness: 0.42,
            });
            disposables.push(tex, mat);
            return mat;
          })();

    for (const side of [-1, 1]) {
      const tx = side * 20.2;
      const tower = new THREE.Mesh(towerBaseGeo, stonePillarMat);
      tower.position.set(tx, 17.0, 0);
      tower.castShadow = !isSoftwareGl;
      tower.receiveShadow = true;
      gateGroup.add(tower);

      for (const cy of [6.5, 14.5, 22.5, 30.5]) {
        const collar = new THREE.Mesh(timberCollarGeo, darkWoodMat);
        collar.position.set(tx, cy, 0);
        const s = 1.0 - (cy / 36.0) * 0.16;
        collar.scale.set(s, 1, s);
        gateGroup.add(collar);
      }

      const cap1 = new THREE.Mesh(towerCapTier1Geo, warmWoodMat);
      cap1.position.set(tx, 36.1, 0);
      const cap2 = new THREE.Mesh(towerCapTier2Geo, darkWoodMat);
      cap2.position.set(tx, 39.2, 0);
      gateGroup.add(cap1, cap2);

      const topBrazier = new THREE.Mesh(brazierGeo, darkSteelMat);
      topBrazier.position.set(tx, 41.6, 0);
      const topFlame = new THREE.Mesh(flameGeo, torchFlameMat);
      topFlame.position.set(tx, 43.4, 0);
      gateGroup.add(topBrazier, topFlame);
      torchFlames.push(topFlame);

      // Flaming sconce torches on BOTH outside & inside faces
      for (const faceZ of [1, -1]) {
        const bracket = new THREE.Mesh(sconceBracketGeo, darkSteelMat);
        bracket.position.set(tx, 13.8, faceZ * 3.8);
        const sconceCup = new THREE.Mesh(brazierGeo, darkSteelMat);
        sconceCup.position.set(tx, 14.8, faceZ * 5.0);
        sconceCup.scale.setScalar(0.92);
        const sconceFlame = new THREE.Mesh(flameGeo, torchFlameMat);
        sconceFlame.position.set(tx, 16.3, faceZ * 5.0);
        sconceFlame.scale.setScalar(0.95);
        gateGroup.add(bracket, sconceCup, sconceFlame);
        torchFlames.push(sconceFlame);
      }
    }

    const lintel = new THREE.Mesh(lintelGeo, darkWoodMat);
    lintel.position.set(0, 22.2, 0);
    lintel.castShadow = !isSoftwareGl;
    const lintelRoof = new THREE.Mesh(lintelRoofGeo, warmWoodMat);
    lintelRoof.position.set(0, 25.4, 0);
    gateGroup.add(lintel, lintelRoof);

    const upperBridge = new THREE.Mesh(upperBridgeGeo, fortressWallMat);
    upperBridge.position.set(0, 32.6, 0);
    gateGroup.add(upperBridge);

    const signFront = new THREE.Mesh(signFaceGeo, gateSignMat);
    signFront.position.set(0, 22.3, 3.22);
    const signBack = new THREE.Mesh(signFaceGeo, gateSignMat);
    signBack.position.set(0, 22.3, -3.22);
    signBack.rotation.y = Math.PI;
    gateGroup.add(signFront, signBack);

    const buildDoorLeaf = (side: -1 | 1): THREE.Group => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 16.6, 0, 0);

      const leafOffsetX = -side * 8.25;
      const doorBody = new THREE.Mesh(doorPlankGeo, warmWoodMat);
      doorBody.position.set(leafOffsetX, 9.6, 0);
      doorBody.castShadow = !isSoftwareGl;
      doorBody.receiveShadow = true;
      pivot.add(doorBody);

      for (const sy of [2.6, 9.6, 16.6]) {
        const strap = new THREE.Mesh(doorStrapGeo, darkSteelMat);
        strap.position.set(leafOffsetX, sy, 0);
        pivot.add(strap);
      }
      const diag1 = new THREE.Mesh(doorDiagGeo, darkWoodMat);
      diag1.position.set(leafOffsetX, 9.6, 0);
      diag1.rotation.z = side * 0.68;
      const diag2 = new THREE.Mesh(doorDiagGeo, darkWoodMat);
      diag2.position.set(leafOffsetX, 9.6, 0);
      diag2.rotation.z = -side * 0.68;
      pivot.add(diag1, diag2);

      const latch = new THREE.Mesh(latchGeo, amberCollectMat);
      latch.position.set(-side * 15.6, 9.2, 0);
      pivot.add(latch);

      return pivot;
    };

    const leftPivot = buildDoorLeaf(-1);
    const rightPivot = buildDoorLeaf(1);
    gateGroup.add(leftPivot, rightPivot);
    group.add(gateGroup);

    perimeterGateRigs.push({
      spec,
      worldX: spot.x,
      worldY: spot.y,
      worldZ: spot.z,
      leftPivot,
      rightPivot,
    });
  };

  DINOSAUR_PERIMETER_GATES.forEach((spec, idx) => buildMonumentalPerimeterGate(spec, idx));

  const southRig = perimeterGateRigs[0];
  const gateInteractable: InteractableItem = {
    id: 'jurassic_park_grand_gate',
    kind: 'jurassic_gate_toggle',
    label: 'Open / Close Jurassic Park Grand Swinging Gate',
    sublabel: 'ஜுராசிக் பார்க் பிரம்மாண்ட நுழைவாயில் · Auto-Opening Double Gates',
    x: southRig.worldX,
    y: southRig.worldY + 1.4,
    z: southRig.worldZ + 10.0,
    radius: 22.0,
    locationId: 'dinosaur_island',
  };

  // =========================================================================
  // 3B. GRAND 3D TRIANGLE EXPLORER TRACK (3 EDGES + 6 PLACE SHOWCASE ARCHWAYS!)
  //     Connects all 6 iconic Dinosaur Island places in a crisp luminous triangle loop!
  // =========================================================================
  const trackAsphaltMat = new THREE.MeshStandardMaterial({
    color: 0x262c38,
    roughness: 0.86,
    metalness: 0.08,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const trackCurbGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.25,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const trackPostMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.52,
    metalness: 0.65,
  });
  disposables.push(trackAsphaltMat, trackCurbGlowMat, trackPostMat);

  const buildTriangleTrackRibbon = () => {
    const segsPerEdge = 36;
    const totalSegs = segsPerEdge * 3;
    const roadHalfW = 3.6;
    const curbOffset = 3.9;
    const curbHalfW = 0.28;

    const roadVerts: number[] = [];
    const roadIndices: number[] = [];
    const curbLVerts: number[] = [];
    const curbRVerts: number[] = [];
    const curbIndices: number[] = [];
    const postPositions: Array<{ x: number; y: number; z: number }> = [];

    for (let i = 0; i <= totalSegs; i++) {
      const sample = sampleDinosaurTriangleTrack(i / totalSegs);
      const nx = -sample.tangentZ;
      const nz = sample.tangentX;
      const baseH = Math.max(WATER_LEVEL + 0.45, groundHeightAt(sample.x, sample.z));
      const y = baseH + 0.14;

      roadVerts.push(
        sample.x - nx * roadHalfW,
        y,
        sample.z - nz * roadHalfW,
        sample.x + nx * roadHalfW,
        y,
        sample.z + nz * roadHalfW
      );
      curbLVerts.push(
        sample.x - nx * (curbOffset + curbHalfW),
        y + 0.04,
        sample.z - nz * (curbOffset + curbHalfW),
        sample.x - nx * (curbOffset - curbHalfW),
        y + 0.04,
        sample.z - nz * (curbOffset - curbHalfW)
      );
      curbRVerts.push(
        sample.x + nx * (curbOffset - curbHalfW),
        y + 0.04,
        sample.z + nz * (curbOffset - curbHalfW),
        sample.x + nx * (curbOffset + curbHalfW),
        y + 0.04,
        sample.z + nz * (curbOffset + curbHalfW)
      );

      if (i < totalSegs) {
        const b = i * 2;
        roadIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        curbIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }

      if (i % 4 === 0 && i < totalSegs) {
        postPositions.push(
          { x: sample.x - nx * 4.55, y: baseH, z: sample.z - nz * 4.55 },
          { x: sample.x + nx * 4.55, y: baseH, z: sample.z + nz * 4.55 }
        );
      }
    }

    const mkRibbon = (verts: number[], indices: number[], mat: THREE.Material) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      disposables.push(geo);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      group.add(mesh);
    };

    mkRibbon(roadVerts, roadIndices, trackAsphaltMat);
    mkRibbon(curbLVerts, curbIndices, trackCurbGlowMat);
    mkRibbon(curbRVerts, curbIndices, trackCurbGlowMat);

    // Triangular Corner Plaza Pads at all 3 vertices so corners join cleanly!
    const vertexPadGeo = new THREE.CylinderGeometry(5.6, 6.0, 0.22, 3);
    disposables.push(vertexPadGeo);
    for (const v of DINOSAUR_TRIANGLE_VERTICES) {
      const p = worldPos(v.lx, v.lz);
      const pad = new THREE.Mesh(vertexPadGeo, trackAsphaltMat);
      pad.position.set(p.x, Math.max(WATER_LEVEL + 0.45, p.y) + 0.1, p.z);
      group.add(pad);
    }

    // Glowing amber guide bollards lining the Triangle Track
    const bollardGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.35, 6);
    const bollardLampGeo = new THREE.OctahedronGeometry(0.28, 0);
    disposables.push(bollardGeo, bollardLampGeo);

    const bollardInst = new THREE.InstancedMesh(bollardGeo, trackPostMat, postPositions.length);
    const bollardLampInst = new THREE.InstancedMesh(bollardLampGeo, trackCurbGlowMat, postPositions.length);
    postPositions.forEach((p, idx) => {
      dummy.position.set(p.x, p.y + 0.68, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bollardInst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(p.x, p.y + 1.52, p.z);
      dummy.updateMatrix();
      bollardLampInst.setMatrixAt(idx, dummy.matrix);
    });
    bollardInst.instanceMatrix.needsUpdate = true;
    bollardLampInst.instanceMatrix.needsUpdate = true;
    group.add(bollardInst, bollardLampInst);

    // 6 Illuminated Triangular Place Showcase Archways along the Triangle Track!
    const archLegGeo = new THREE.BoxGeometry(0.85, 7.6, 0.85);
    const archBeamGeo = new THREE.BoxGeometry(10.8, 0.9, 1.1);
    const archSignGeo = new THREE.PlaneGeometry(9.6, 2.4);
    const archRingGeo = new THREE.RingGeometry(4.2, 4.85, 3);
    archRingGeo.rotateX(-Math.PI / 2);
    disposables.push(archLegGeo, archBeamGeo, archSignGeo, archRingGeo);

    for (const place of DINOSAUR_TRIANGLE_PLACES) {
      const sample = sampleDinosaurTriangleTrack(place.trackT);
      const spot = worldPos(place.lx, place.lz);
      const archG = new THREE.Group();
      archG.position.set(spot.x, Math.max(WATER_LEVEL + 0.45, spot.y), spot.z);
      archG.rotation.y = Math.atan2(sample.tangentX, sample.tangentZ);

      const accentColor = new THREE.Color(place.accentHex);
      const placeGlowMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.4,
        roughness: 0.25,
        side: THREE.DoubleSide,
      });
      const signTexP = createTrianglePlaceSignTexture(
        place.order,
        place.name,
        place.subtitle,
        place.accentHex
      );
      const placeSignMat = new THREE.MeshStandardMaterial({
        map: signTexP,
        emissive: accentColor,
        emissiveMap: signTexP,
        emissiveIntensity: 0.45,
        roughness: 0.35,
      });
      disposables.push(placeGlowMat, signTexP, placeSignMat);

      for (const sx of [-4.9, 4.9]) {
        const leg = new THREE.Mesh(archLegGeo, trackPostMat);
        leg.position.set(sx, 3.8, 0);
        archG.add(leg);
      }
      const beam = new THREE.Mesh(archBeamGeo, trackPostMat);
      beam.position.set(0, 7.7, 0);
      archG.add(beam);

      // Front & Back illuminated signboards readable from both directions along the triangle!
      const sFront = new THREE.Mesh(archSignGeo, placeSignMat);
      sFront.position.set(0, 6.2, 0.62);
      const sBack = new THREE.Mesh(archSignGeo, placeSignMat);
      sBack.position.set(0, 6.2, -0.62);
      sBack.rotation.y = Math.PI;
      archG.add(sFront, sBack);

      // Glowing triangular waypoint marker on the roadway
      const groundTri = new THREE.Mesh(archRingGeo, placeGlowMat);
      groundTri.position.set(0, 0.2, 0);
      archG.add(groundTri);

      group.add(archG);
    }
  };
  buildTriangleTrackRibbon();

  // =========================================================================
  // 4. SSJ PARK HOSTEL & RESORT SWIMMING POOL PLAZA
  // =========================================================================
  const hostelSpot = worldPos(SSJ_ISLAND_LANDMARKS.hostelPlaza.lx, SSJ_ISLAND_LANDMARKS.hostelPlaza.lz);
  const hostelGroup = new THREE.Group();
  hostelGroup.position.set(hostelSpot.x, hostelSpot.y, hostelSpot.z);
  hostelGroup.rotation.y = Math.PI * 0.14;

  const hostelBodyGeo = new THREE.BoxGeometry(18.0, 8.5, 10.0);
  const hostelRoofGeo = new THREE.ConeGeometry(13.8, 4.6, 4);
  hostelRoofGeo.rotateY(Math.PI / 4);
  const winGeo = new THREE.BoxGeometry(1.75, 1.45, 0.18);
  const deckGeo = new THREE.BoxGeometry(12.8, 0.35, 7.2);
  const poolGeo = new THREE.BoxGeometry(10.6, 0.22, 5.4);
  disposables.push(hostelBodyGeo, hostelRoofGeo, winGeo, deckGeo, poolGeo);

  const hostelBody = new THREE.Mesh(hostelBodyGeo, sandstoneBuildingMat);
  hostelBody.position.set(0, 4.25, 0);
  hostelBody.castShadow = !isSoftwareGl;
  hostelBody.receiveShadow = true;
  hostelGroup.add(hostelBody);

  const hostelRoof = new THREE.Mesh(hostelRoofGeo, tealRoofMat);
  hostelRoof.position.set(0, 10.75, 0);
  hostelRoof.scale.set(1.04, 1.0, 0.64);
  hostelGroup.add(hostelRoof);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const wx = -6.4 + col * 3.2;
      const wy = 2.4 + row * 3.3;
      const wf = new THREE.Mesh(winGeo, warmWindowMat);
      wf.position.set(wx, wy, 5.04);
      const wb = new THREE.Mesh(winGeo, warmWindowMat);
      wb.position.set(wx, wy, -5.04);
      hostelGroup.add(wf, wb);
    }
  }

  const resortDeck = new THREE.Mesh(deckGeo, timberDeckMat);
  resortDeck.position.set(0, 0.18, 9.2);
  const resortPool = new THREE.Mesh(poolGeo, poolWaterMat);
  resortPool.position.set(0, 0.31, 9.2);
  hostelGroup.add(resortDeck, resortPool);
  group.add(hostelGroup);

  // =========================================================================
  // 5. PAN-TROPICAL GLASS PAVILION RESTAURANT
  // =========================================================================
  const pavSpot = worldPos(SSJ_ISLAND_LANDMARKS.glassPavilion.lx, SSJ_ISLAND_LANDMARKS.glassPavilion.lz);
  const pavGroup = new THREE.Group();
  pavGroup.position.set(pavSpot.x, pavSpot.y, pavSpot.z);

  const pavBaseGeo = new THREE.CylinderGeometry(6.5, 6.8, 0.6, 20);
  const pavGlassGeo = new THREE.CylinderGeometry(5.8, 5.8, 4.2, 20);
  const pavRoofGeo = new THREE.ConeGeometry(7.6, 3.2, 20);
  const pavCoreGeo = new THREE.CylinderGeometry(1.1, 1.3, 4.0, 10);
  disposables.push(pavBaseGeo, pavGlassGeo, pavRoofGeo, pavCoreGeo);

  const pavBase = new THREE.Mesh(pavBaseGeo, timberDeckMat);
  pavBase.position.y = 0.3;
  const pavGlass = new THREE.Mesh(pavGlassGeo, cyanGlassMat);
  pavGlass.position.y = 2.7;
  const pavRoof = new THREE.Mesh(pavRoofGeo, warmWoodMat);
  pavRoof.position.y = 6.3;
  const pavCore = new THREE.Mesh(pavCoreGeo, warmWindowMat);
  pavCore.position.y = 2.5;
  pavGroup.add(pavBase, pavCore, pavGlass, pavRoof);
  group.add(pavGroup);

  // =========================================================================
  // 6. GRAND JURASSIC PARK ROTUNDA VISITOR CENTER & MOUNTED IVORY T-REX FOSSIL
  // =========================================================================
  const musSpot = worldPos(SSJ_ISLAND_LANDMARKS.skeletonMuseum.lx, SSJ_ISLAND_LANDMARKS.skeletonMuseum.lz);
  const musGroup = new THREE.Group();
  musGroup.position.set(musSpot.x, musSpot.y, musSpot.z);

  const rotundaBaseGeo = new THREE.CylinderGeometry(13.2, 14.2, 1.6, 24);
  const musHallGeo = new THREE.CylinderGeometry(11.6, 12.2, 8.8, 24);
  const rotundaRoofGeo = new THREE.ConeGeometry(14.6, 5.4, 24);
  const musDomeGeo = new THREE.SphereGeometry(5.6, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const rotundaStepsGeo = new THREE.BoxGeometry(10.5, 1.5, 4.4);
  const plinthGeo = new THREE.CylinderGeometry(4.2, 4.6, 0.85, 20);
  disposables.push(rotundaBaseGeo, musHallGeo, rotundaRoofGeo, musDomeGeo, rotundaStepsGeo, plinthGeo);

  const rotundaBase = new THREE.Mesh(rotundaBaseGeo, stonePillarMat);
  rotundaBase.position.y = 0.8;
  const musHall = new THREE.Mesh(musHallGeo, sandstoneBuildingMat);
  musHall.position.set(0, 5.8, 0);
  musHall.castShadow = !isSoftwareGl;
  musHall.receiveShadow = true;
  const rotundaRoof = new THREE.Mesh(rotundaRoofGeo, warmWoodMat);
  rotundaRoof.position.set(0, 12.7, 0);
  const musDome = new THREE.Mesh(musDomeGeo, cyanGlassMat);
  musDome.position.set(0, 14.6, 0);
  const rotundaSteps = new THREE.Mesh(rotundaStepsGeo, stonePillarMat);
  rotundaSteps.position.set(0, 0.75, 13.4);
  musGroup.add(rotundaBase, musHall, rotundaRoof, musDome, rotundaSteps);

  const musFacadeGeo = new THREE.BoxGeometry(9.6, 6.2, 0.35);
  const rPoolGeo = new THREE.BoxGeometry(6.8, 0.3, 4.2);
  disposables.push(musFacadeGeo, rPoolGeo);
  const musFacade = new THREE.Mesh(musFacadeGeo, cyanGlassMat);
  musFacade.position.set(0, 4.6, 11.95);
  musGroup.add(musFacade);
  for (const side of [-1, 1]) {
    const rPool = new THREE.Mesh(rPoolGeo, poolWaterMat);
    rPool.position.set(side * 9.5, 0.25, 12.6);
    musGroup.add(rPool);
  }

  const skeletonRoot = new THREE.Group();
  skeletonRoot.position.set(0, 0, 19.2);
  const plinth = new THREE.Mesh(plinthGeo, warmWoodMat);
  plinth.position.y = 0.42;
  skeletonRoot.add(plinth);

  const spineGeo = new THREE.CylinderGeometry(0.18, 0.22, 6.2, 8);
  spineGeo.rotateZ(Math.PI / 2);
  const ribGeo = new THREE.TorusGeometry(0.88, 0.085, 6, 14, Math.PI * 1.4);
  const skullGeo = new THREE.CapsuleGeometry(0.55, 0.95, 6, 10);
  skullGeo.rotateZ(Math.PI / 2);
  const legBoneGeo = new THREE.CylinderGeometry(0.16, 0.14, 2.6, 8);
  disposables.push(spineGeo, ribGeo, skullGeo, legBoneGeo);

  const spine = new THREE.Mesh(spineGeo, boneMat);
  spine.position.set(0, 3.35, 0);
  spine.rotation.z = 0.18;
  skeletonRoot.add(spine);

  for (let r = 0; r < 7; r++) {
    const rib = new THREE.Mesh(ribGeo, boneMat);
    rib.position.set(-1.1 + r * 0.48, 3.1 + r * 0.08, 0);
    rib.rotation.y = Math.PI / 2;
    rib.rotation.z = -Math.PI * 0.7;
    const ribScale = 0.68 + Math.sin((r / 6) * Math.PI) * 0.45;
    rib.scale.setScalar(ribScale);
    skeletonRoot.add(rib);
  }

  const skull = new THREE.Mesh(skullGeo, boneMat);
  skull.position.set(3.25, 4.15, 0);
  skull.rotation.z = -0.18;
  skeletonRoot.add(skull);

  for (const side of [-1, 1]) {
    const legBone = new THREE.Mesh(legBoneGeo, boneMat);
    legBone.position.set(-0.35, 1.95, side * 0.65);
    legBone.rotation.z = 0.12;
    skeletonRoot.add(legBone);
  }
  musGroup.add(skeletonRoot);
  group.add(musGroup);

  // =========================================================================
  // 7. CIRCULAR GENOMIC RESEARCH FACILITY
  // =========================================================================
  const labSpot = worldPos(SSJ_ISLAND_LANDMARKS.researchLab.lx, SSJ_ISLAND_LANDMARKS.researchLab.lz);
  const labGroup = new THREE.Group();
  labGroup.position.set(labSpot.x, labSpot.y, labSpot.z);

  const labBodyGeo = new THREE.CylinderGeometry(7.5, 8.0, 5.5, 24);
  const labGlassBandGeo = new THREE.CylinderGeometry(7.85, 7.85, 2.0, 24);
  const labRoofGeo = new THREE.CylinderGeometry(6.8, 7.5, 0.55, 24);
  const radarDishGeo = new THREE.ConeGeometry(1.4, 0.85, 12);
  disposables.push(labBodyGeo, labGlassBandGeo, labRoofGeo, radarDishGeo);

  const labBody = new THREE.Mesh(labBodyGeo, sandstoneBuildingMat);
  labBody.position.y = 2.75;
  labBody.castShadow = !isSoftwareGl;
  const labBand = new THREE.Mesh(labGlassBandGeo, cyanGlassMat);
  labBand.position.y = 3.15;
  const labRoof = new THREE.Mesh(labRoofGeo, darkSteelMat);
  labRoof.position.y = 5.75;
  const radarDish = new THREE.Mesh(radarDishGeo, sandstoneBuildingMat);
  radarDish.position.set(0, 7.1, 0);
  radarDish.rotation.x = 0.65;
  labGroup.add(labBody, labBand, labRoof, radarDish);
  group.add(labGroup);

  // =========================================================================
  // 8. OCEANLAB OPTICAL 1 KM FLOWING FOREST RIVER, SCENIC CRYSTAL LAKE & 32m WATERFALL
  // =========================================================================
  const riverUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.45, 0.72, -0.5).normalize() },
    uFlowSpeed: { value: 1.85 },
  };
  const riverMat = new THREE.ShaderMaterial({
    uniforms: riverUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform float uFlowSpeed;
      varying vec2 vUv;
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

      const mat2 rotM = mat2(0.80, -0.60, 0.60, 0.80);

      float flowFBM(vec2 p, float t) {
        float val = 0.0;
        float amp = 0.5;
        vec2 shift = vec2(0.0, -t * uFlowSpeed);
        for (int i = 0; i < 4; i++) {
          val += amp * noise2D(p + shift);
          p = rotM * p * 2.08;
          shift = rotM * shift * 1.32;
          amp *= 0.48;
        }
        return val;
      }

      void main() {
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);
        float bankDist = abs(vUv.x - 0.5) * 2.0;

        vec2 p = vec2(vUv.x * 7.5, vUv.y * 85.0);
        float eps = 0.08;
        float h0 = flowFBM(p, uTime);
        float hx = flowFBM(p + vec2(eps, 0.0), uTime);
        float hz = flowFBM(p + vec2(0.0, eps), uTime);

        vec3 N = normalize(vec3(-(hx - h0) * 1.7, 1.0, -(hz - h0) * 1.7));
        float NoV = clamp(dot(N, V), 0.05, 1.0);
        float fresnel = 0.03 + 0.97 * pow(1.0 - NoV, 5.0);

        // Beer-Lambert optical emerald-turquoise river body + sunlit caustics
        vec3 deepCol = vec3(0.025, 0.22, 0.30);
        vec3 shallowCol = vec3(0.055, 0.52, 0.48);
        vec3 waterBody = mix(deepCol, shallowCol, smoothstep(0.25, 0.92, bankDist));

        float caust = pow(clamp(1.0 - abs(h0 - 0.5) * 2.4, 0.0, 1.0), 3.0);
        waterBody += vec3(0.18, 0.65, 0.56) * caust * 0.28;

        vec3 skyRefl = mix(vec3(0.32, 0.58, 0.80), vec3(0.06, 0.18, 0.40), clamp(V.y, 0.0, 1.0));
        vec3 col = mix(waterBody, skyRefl, fresnel * 0.78);

        // Crisp solar glitter along flowing capillary waves
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 180.0) * 2.2;
        col += vec3(1.0, 0.96, 0.85) * spec;

        // Aerated white rapids streaks & gentle shoreline swash lace
        float rapidBand = pow(clamp(h0 * 1.25 - 0.12, 0.0, 1.0), 3.2);
        float bankFoam = smoothstep(0.76, 0.98, bankDist + h0 * 0.16);
        float foam = clamp(bankFoam * 0.55 + rapidBand * 0.45 * (1.0 - bankDist * 0.4), 0.0, 0.82);
        col = mix(col, vec3(0.88, 0.95, 0.98), foam);

        // ACES filmic tone map + gamma
        col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
        col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

        float alpha = smoothstep(1.0, 0.80, bankDist) * 0.88;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  // Dedicated OceanLab Optical Crystal Lake Shader (radial shore depth + gentle ripples + caustics!)
  const lakeMat = new THREE.ShaderMaterial({
    uniforms: riverUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec3 uSunDir;
      varying vec2 vUv;
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

      const mat2 rotM = mat2(0.80, -0.60, 0.60, 0.80);

      float lakeFBM(vec2 p, float t) {
        float val = 0.0;
        float amp = 0.5;
        vec2 shift = vec2(t * 0.38, -t * 0.52);
        for (int i = 0; i < 4; i++) {
          val += amp * noise2D(p + shift);
          p = rotM * p * 2.04;
          shift = rotM * shift * 1.28;
          amp *= 0.48;
        }
        return val;
      }

      void main() {
        float rNorm = length((vUv - 0.5) * 2.0);
        if (rNorm > 1.0) discard;

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        vec2 p = vWorldPos.xz * 0.24;
        float eps = 0.09;
        float h0 = lakeFBM(p, uTime);
        float hx = lakeFBM(p + vec2(eps, 0.0), uTime);
        float hz = lakeFBM(p + vec2(0.0, eps), uTime);

        vec3 N = normalize(vec3(-(hx - h0) * 1.45, 1.0, -(hz - h0) * 1.45));
        float NoV = clamp(dot(N, V), 0.05, 1.0);
        float fresnel = 0.025 + 0.975 * pow(1.0 - NoV, 5.0);

        vec3 deepCol = vec3(0.015, 0.16, 0.26);
        vec3 shallowCol = vec3(0.045, 0.48, 0.44);
        vec3 waterBody = mix(deepCol, shallowCol, smoothstep(0.42, 0.96, rNorm));
        float caust = pow(clamp(1.0 - abs(h0 - 0.5) * 2.4, 0.0, 1.0), 3.2);
        waterBody += vec3(0.20, 0.72, 0.62) * caust * smoothstep(0.35, 0.92, rNorm) * 0.34;

        vec3 skyRefl = mix(vec3(0.34, 0.60, 0.82), vec3(0.05, 0.18, 0.42), clamp(V.y, 0.0, 1.0));
        vec3 col = mix(waterBody, skyRefl, fresnel * 0.82);

        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 260.0) * 2.8;
        col += vec3(1.0, 0.96, 0.86) * spec;

        float shoreFoam = smoothstep(0.86, 0.99, rNorm + (h0 - 0.5) * 0.12);
        col = mix(col, vec3(0.88, 0.96, 0.98), shoreFoam * 0.46);

        col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
        col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

        float alpha = smoothstep(1.0, 0.88, rNorm) * 0.90;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  disposables.push(riverMat, lakeMat);

  // Build Continuous ~1 KM Flowing Forest River Ribbon (180 segments from lz = -418 to lz = +496)
  const riverSegs = 180;
  const riverVerts: number[] = [];
  const riverUvs: number[] = [];
  const riverIndices: number[] = [];
  for (let i = 0; i <= riverSegs; i++) {
    const t = i / riverSegs;
    const lz = DINOSAUR_RIVER_START_LZ + t * (DINOSAUR_RIVER_END_LZ - DINOSAUR_RIVER_START_LZ);
    const cx = ssjRiverLocalX(lz);
    const halfW = ssjRiverHalfWidth(lz) + 1.4;
    const y = ssjRiverWaterY(lz);
    riverVerts.push(ix + cx - halfW, y, iz + lz, ix + cx + halfW, y, iz + lz);
    riverUvs.push(0, t, 1, t);
    if (i < riverSegs) {
      const b = i * 2;
      riverIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverVerts, 3));
  riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(riverUvs, 2));
  riverGeo.setIndex(riverIndices);
  riverGeo.computeVertexNormals();
  disposables.push(riverGeo);
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  group.add(riverMesh);

  // Scenic 172m × 124m Jurassic Crystal Lake right along the river's heart!
  const crystalLakeGeo = new THREE.PlaneGeometry(
    DINOSAUR_CRYSTAL_LAKE_RX * 2.08,
    DINOSAUR_CRYSTAL_LAKE_RZ * 2.08,
    1,
    1
  );
  crystalLakeGeo.rotateX(-Math.PI / 2);
  disposables.push(crystalLakeGeo);
  const crystalLakeMesh = new THREE.Mesh(crystalLakeGeo, lakeMat);
  crystalLakeMesh.position.set(
    ix + DINOSAUR_CRYSTAL_LAKE_CENTER.lx,
    DINOSAUR_LAKE_WATER_Y + 0.03,
    iz + DINOSAUR_CRYSTAL_LAKE_CENTER.lz
  );
  group.add(crystalLakeMesh);

  // Towering 32m Northern Volcanic Waterfall Gorge Curtain & Plunge Pool feeding the 1 KM River
  const wfX = ix + SSJ_ISLAND_LANDMARKS.waterfallCliff.lx;
  const wfZ = iz + SSJ_ISLAND_LANDMARKS.waterfallCliff.lz;
  const wfCurtainGeo = new THREE.PlaneGeometry(18.5, 31.0, 10, 16);
  const wfPlungeGeo = new THREE.CircleGeometry(16.5, 28);
  wfPlungeGeo.rotateX(-Math.PI / 2);
  const wfBoulderGeo = new THREE.DodecahedronGeometry(6.8, 1);
  disposables.push(wfCurtainGeo, wfPlungeGeo, wfBoulderGeo);

  const wfCurtain = new THREE.Mesh(wfCurtainGeo, riverMat);
  wfCurtain.position.set(wfX, 15.6, wfZ + 5.6);
  wfCurtain.rotation.x = -0.15;
  group.add(wfCurtain);

  const wfPlunge = new THREE.Mesh(wfPlungeGeo, lakeMat);
  wfPlunge.position.set(wfX, 1.2, wfZ + 12.2);
  group.add(wfPlunge);

  for (const [bx, by, bz, sc] of [
    [-13.5, 11.5, -1.5, 1.85],
    [13.5, 11.0, -1.2, 1.8],
    [0, 24.5, -4.8, 2.7],
    [-9.5, 3.8, 8.2, 1.25],
    [10.2, 3.6, 8.6, 1.3],
  ] as const) {
    const crag = new THREE.Mesh(wfBoulderGeo, cliffRockMat);
    crag.position.set(wfX + bx, by, wfZ + bz);
    crag.scale.set(sc * 1.25, sc * 1.15, sc);
    group.add(crag);
  }

  // 4 Walkable Timber Suspension Bridges spanning the 1 KM Flowing Forest River!
  const bridgePlankGeo = new THREE.BoxGeometry(1, 0.36, 7.0);
  const bridgePostGeo = new THREE.CylinderGeometry(0.2, 0.24, 3.8, 8);
  const bridgeRailGeo = new THREE.BoxGeometry(1, 0.2, 0.22);
  const bridgeLampGeo = new THREE.SphereGeometry(0.32, 8, 8);
  disposables.push(bridgePlankGeo, bridgePostGeo, bridgeRailGeo, bridgeLampGeo);

  for (const bridgeLz of DINOSAUR_RIVER_BRIDGE_LZS) {
    const cx = ssjRiverLocalX(bridgeLz);
    const halfSpan = ssjRiverHalfWidth(bridgeLz) + 6.8;
    const spanLen = halfSpan * 2;
    const deckY = Math.max(ssjRiverWaterY(bridgeLz) + 1.95, 2.55);

    const bGroup = new THREE.Group();
    bGroup.position.set(ix + cx, deckY, iz + bridgeLz);

    const deck = new THREE.Mesh(bridgePlankGeo, timberDeckMat);
    deck.scale.set(spanLen, 1, 1);
    deck.receiveShadow = true;
    bGroup.add(deck);

    for (const sideZ of [-3.3, 3.3]) {
      const rail = new THREE.Mesh(bridgeRailGeo, darkWoodMat);
      rail.scale.set(spanLen, 1, 1);
      rail.position.set(0, 1.25, sideZ);
      bGroup.add(rail);

      for (const frac of [-0.48, -0.24, 0, 0.24, 0.48]) {
        const px = frac * spanLen;
        const post = new THREE.Mesh(bridgePostGeo, darkWoodMat);
        post.position.set(px, -0.45, sideZ);
        bGroup.add(post);
        if (Math.abs(frac) > 0.4) {
          const lamp = new THREE.Mesh(bridgeLampGeo, warmWindowMat);
          lamp.position.set(px, 1.65, sideZ);
          bGroup.add(lamp);
        }
      }
    }
    group.add(bGroup);
  }

  // =========================================================================
  // 9. SSJ MARINA TIMBER PIER & ISLAND RESCUE HELIPAD ("H · JP")
  // =========================================================================
  const pierW = DINOSAUR_MARINA_PIER_BOUNDS.maxX - DINOSAUR_MARINA_PIER_BOUNDS.minX;
  const pierLen = DINOSAUR_MARINA_PIER_BOUNDS.maxZ - DINOSAUR_MARINA_PIER_BOUNDS.minZ;
  const pierCx = (DINOSAUR_MARINA_PIER_BOUNDS.minX + DINOSAUR_MARINA_PIER_BOUNDS.maxX) * 0.5;
  const pierCz = (DINOSAUR_MARINA_PIER_BOUNDS.minZ + DINOSAUR_MARINA_PIER_BOUNDS.maxZ) * 0.5;
  const pierDeckGeo = new THREE.BoxGeometry(pierW, 0.28, pierLen);
  const pierPostGeo = new THREE.CylinderGeometry(0.16, 0.2, 2.8, 8);
  disposables.push(pierDeckGeo, pierPostGeo);

  const pierDeck = new THREE.Mesh(pierDeckGeo, timberDeckMat);
  pierDeck.position.set(pierCx, DINOSAUR_MARINA_PIER_BOUNDS.deckY - 0.14, pierCz);
  pierDeck.receiveShadow = true;
  group.add(pierDeck);

  for (let pz = DINOSAUR_MARINA_PIER_BOUNDS.minZ + 1.2; pz <= DINOSAUR_MARINA_PIER_BOUNDS.maxZ - 0.6; pz += 3.2) {
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(pierPostGeo, darkWoodMat);
      post.position.set(pierCx + side * (pierW * 0.45), DINOSAUR_MARINA_PIER_BOUNDS.deckY - 1.0, pz);
      group.add(post);
    }
  }

  const islandPadY = groundHeightAt(DINOSAUR_ISLAND_HELIPAD_POS.x, DINOSAUR_ISLAND_HELIPAD_POS.z);
  const islandPadGeo = new THREE.CylinderGeometry(6.2, 6.6, 0.24, 24);
  const islandPadTopMat = new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.62 });
  disposables.push(islandPadGeo, islandPadTopMat);
  const islandPad = new THREE.Mesh(islandPadGeo, [darkSteelMat, islandPadTopMat, darkSteelMat]);
  islandPad.position.set(DINOSAUR_ISLAND_HELIPAD_POS.x, islandPadY + 0.12, DINOSAUR_ISLAND_HELIPAD_POS.z);
  islandPad.receiveShadow = true;
  group.add(islandPad);

  // =========================================================================
  // 10. ALL 18 PREHISTORIC DINOSAUR SPECIES (Roaming Rexy + 17 Living Species)
  // =========================================================================
  const sharedDinoGeos = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cone: new THREE.ConeGeometry(0.5, 1, 6),
    sphere: new THREE.SphereGeometry(0.5, 10, 8),
    cyl: new THREE.CylinderGeometry(0.45, 0.5, 1, 8),
    wing: new THREE.BoxGeometry(2.4, 0.08, 0.85),
  };
  disposables.push(
    sharedDinoGeos.box,
    sharedDinoGeos.cone,
    sharedDinoGeos.sphere,
    sharedDinoGeos.cyl,
    sharedDinoGeos.wing
  );

  const buildSculptedDinoRig = (spec: SsjDinosaurSpeciesSpec) => {
    const root = new THREE.Group();
    const bodyPivot = new THREE.Group();
    root.add(bodyPivot);

    const skinMat = new THREE.MeshStandardMaterial({ color: spec.bodyColor, roughness: 0.76 });
    const accentMat = new THREE.MeshStandardMaterial({ color: spec.accentColor, roughness: 0.72 });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: spec.eyeColor,
      emissive: spec.eyeColor,
      emissiveIntensity: 1.4,
      roughness: 0.18,
    });
    disposables.push(skinMat, accentMat, eyeMat);

    const s = spec.scale * 0.52;
    let leftLeg: THREE.Group | undefined;
    let rightLeg: THREE.Group | undefined;
    let tail: THREE.Group | undefined;
    let wingL: THREE.Group | undefined;
    let wingR: THREE.Group | undefined;
    let jaw: THREE.Group | undefined;

    if (spec.archetype === 'pterosaur') {
      const torso = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      torso.scale.set(0.65 * s, 0.52 * s, 1.5 * s);
      const crest = new THREE.Mesh(sharedDinoGeos.cone, accentMat);
      crest.scale.set(0.28 * s, 1.3 * s, 0.5 * s);
      crest.rotation.x = -Math.PI * 0.42;
      crest.position.set(0, 0.25 * s, 0.9 * s);
      const beak = new THREE.Mesh(sharedDinoGeos.cone, accentMat);
      beak.scale.set(0.26 * s, 1.45 * s, 0.32 * s);
      beak.rotation.x = Math.PI * 0.5;
      beak.position.set(0, 0.02 * s, 1.35 * s);
      bodyPivot.add(torso, crest, beak);

      wingL = new THREE.Group();
      wingL.position.set(-0.3 * s, 0.12 * s, 0.1 * s);
      const wMeshL = new THREE.Mesh(sharedDinoGeos.wing, accentMat);
      wMeshL.scale.set(s * 1.45, s, s * 1.25);
      wMeshL.position.set(-1.65 * s, 0, 0);
      wingL.add(wMeshL);

      wingR = new THREE.Group();
      wingR.position.set(0.3 * s, 0.12 * s, 0.1 * s);
      const wMeshR = new THREE.Mesh(sharedDinoGeos.wing, accentMat);
      wMeshR.scale.set(s * 1.45, s, s * 1.25);
      wMeshR.position.set(1.65 * s, 0, 0);
      wingR.add(wMeshR);
      bodyPivot.add(wingL, wingR);
    } else if (spec.archetype === 'marine') {
      const torso = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      torso.scale.set(1.35 * s, 0.95 * s, 3.8 * s);
      const head = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      head.scale.set(0.95 * s, 0.65 * s, 1.9 * s);
      head.position.set(0, 0.05 * s, 2.55 * s);
      bodyPivot.add(torso, head);
      for (const side of [-1, 1]) {
        const fin = new THREE.Mesh(sharedDinoGeos.box, accentMat);
        fin.scale.set(1.6 * s, 0.14 * s, 0.9 * s);
        fin.position.set(side * 1.25 * s, -0.15 * s, 0.6 * s);
        fin.rotation.y = side * -0.35;
        bodyPivot.add(fin);
      }
      tail = new THREE.Group();
      tail.position.set(0, 0, -1.85 * s);
      const tailMain = new THREE.Mesh(sharedDinoGeos.cone, skinMat);
      tailMain.scale.set(0.95 * s, 3.6 * s, 0.65 * s);
      tailMain.rotation.x = -Math.PI / 2;
      tailMain.position.set(0, 0, -1.7 * s);
      tail.add(tailMain);
      bodyPivot.add(tail);
    } else if (spec.archetype === 'sauropod') {
      const torso = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      torso.scale.set(1.55 * s, 1.45 * s, 2.85 * s);
      torso.position.set(0, 2.25 * s, 0);
      bodyPivot.add(torso);

      const neck = new THREE.Mesh(sharedDinoGeos.cyl, skinMat);
      neck.scale.set(0.55 * s, 3.8 * s, 0.55 * s);
      neck.position.set(0, 4.15 * s, 1.85 * s);
      neck.rotation.x = 0.42;
      const head = new THREE.Mesh(sharedDinoGeos.box, accentMat);
      head.scale.set(0.65 * s, 0.55 * s, 0.95 * s);
      head.position.set(0, 5.85 * s, 2.75 * s);
      bodyPivot.add(neck, head);

      for (const lx of [-0.58, 0.58]) {
        for (const lz of [-0.95, 0.95]) {
          const leg = new THREE.Mesh(sharedDinoGeos.cyl, accentMat);
          leg.scale.set(0.42 * s, 2.25 * s, 0.42 * s);
          leg.position.set(lx * s, 1.12 * s, lz * s);
          bodyPivot.add(leg);
        }
      }
      tail = new THREE.Group();
      tail.position.set(0, 2.15 * s, -1.35 * s);
      const tMesh = new THREE.Mesh(sharedDinoGeos.cone, skinMat);
      tMesh.scale.set(0.75 * s, 3.4 * s, 0.75 * s);
      tMesh.rotation.x = -Math.PI / 2;
      tMesh.position.set(0, -0.25 * s, -1.65 * s);
      tail.add(tMesh);
      bodyPivot.add(tail);
    } else if (
      spec.archetype === 'triceratops' ||
      spec.archetype === 'stegosaurus' ||
      spec.archetype === 'ankylosaurus'
    ) {
      const torso = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      torso.scale.set(1.45 * s, 1.15 * s, 2.55 * s);
      torso.position.set(0, 1.35 * s, 0);
      bodyPivot.add(torso);

      const head = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      head.scale.set(0.95 * s, 0.8 * s, 1.2 * s);
      head.position.set(0, 1.42 * s, 1.7 * s);
      bodyPivot.add(head);

      if (spec.archetype === 'triceratops') {
        const frill = new THREE.Mesh(sharedDinoGeos.cyl, accentMat);
        frill.scale.set(1.45 * s, 0.22 * s, 1.25 * s);
        frill.rotation.x = Math.PI * 0.4;
        frill.position.set(0, 1.95 * s, 1.25 * s);
        bodyPivot.add(frill);
        for (const sx of [-0.35, 0.35]) {
          const horn = new THREE.Mesh(sharedDinoGeos.cone, boneMat);
          horn.scale.set(0.16 * s, 1.15 * s, 0.16 * s);
          horn.rotation.x = Math.PI * 0.42;
          horn.position.set(sx * s, 1.85 * s, 2.25 * s);
          bodyPivot.add(horn);
        }
      } else if (spec.archetype === 'stegosaurus') {
        for (let p = 0; p < 6; p++) {
          const plate = new THREE.Mesh(sharedDinoGeos.box, accentMat);
          plate.scale.set(0.16 * s, 0.72 * s, 0.48 * s);
          plate.rotation.x = 0.4;
          plate.position.set((p % 2 === 0 ? -0.2 : 0.2) * s, 2.25 * s, -0.95 * s + p * 0.42 * s);
          bodyPivot.add(plate);
        }
      } else {
        const shell = new THREE.Mesh(sharedDinoGeos.sphere, accentMat);
        shell.scale.set(1.75 * s, 0.85 * s, 2.75 * s);
        shell.position.set(0, 1.72 * s, 0);
        bodyPivot.add(shell);
      }

      for (const lx of [-0.55, 0.55]) {
        for (const lz of [-0.85, 0.85]) {
          const leg = new THREE.Mesh(sharedDinoGeos.cyl, accentMat);
          leg.scale.set(0.36 * s, 1.2 * s, 0.36 * s);
          leg.position.set(lx * s, 0.6 * s, lz * s);
          bodyPivot.add(leg);
        }
      }
      tail = new THREE.Group();
      tail.position.set(0, 1.25 * s, -1.25 * s);
      const tMesh = new THREE.Mesh(sharedDinoGeos.cone, skinMat);
      tMesh.scale.set(0.55 * s, 2.1 * s, 0.55 * s);
      tMesh.rotation.x = -Math.PI / 2;
      tMesh.position.set(0, 0, -1.0 * s);
      tail.add(tMesh);
      if (spec.archetype === 'ankylosaurus') {
        const club = new THREE.Mesh(sharedDinoGeos.sphere, accentMat);
        club.scale.set(0.68 * s, 0.55 * s, 0.68 * s);
        club.position.set(0, 0, -2.0 * s);
        tail.add(club);
      }
      bodyPivot.add(tail);
    } else {
      const torso = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      torso.scale.set(1.38 * s, 1.48 * s, 2.55 * s);
      torso.position.set(0, 2.18 * s, 0);
      torso.rotation.x = -0.14;
      torso.castShadow = !isSoftwareGl;
      bodyPivot.add(torso);

      const belly = new THREE.Mesh(sharedDinoGeos.box, accentMat);
      belly.scale.set(1.08 * s, 0.45 * s, 2.05 * s);
      belly.position.set(0, 1.52 * s, 0.08 * s);
      belly.rotation.x = -0.14;
      bodyPivot.add(belly);

      if (spec.archetype === 'spinosaurus') {
        const sail = new THREE.Mesh(sharedDinoGeos.cyl, accentMat);
        sail.scale.set(0.18 * s, 2.2 * s, 2.5 * s);
        sail.rotation.z = Math.PI / 2;
        sail.position.set(0, 3.15 * s, -0.1 * s);
        bodyPivot.add(sail);
      }

      const neck = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      neck.scale.set(0.88 * s, 1.18 * s, 0.98 * s);
      neck.position.set(0, 2.95 * s, 1.32 * s);
      neck.rotation.x = 0.34;
      bodyPivot.add(neck);

      const head = new THREE.Mesh(sharedDinoGeos.box, skinMat);
      head.scale.set(1.08 * s, 0.85 * s, 1.75 * s);
      head.position.set(0, 3.68 * s, 2.15 * s);
      bodyPivot.add(head);

      if (spec.archetype === 'parasaurolophus') {
        const crest = new THREE.Mesh(sharedDinoGeos.cyl, accentMat);
        crest.scale.set(0.26 * s, 1.45 * s, 0.26 * s);
        crest.rotation.x = -0.75;
        crest.position.set(0, 4.25 * s, 1.45 * s);
        bodyPivot.add(crest);
      }

      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(sharedDinoGeos.sphere, eyeMat);
        eye.scale.setScalar(0.24 * s);
        eye.position.set(side * 0.56 * s, 3.88 * s, 2.28 * s);
        bodyPivot.add(eye);

        const arm = new THREE.Mesh(sharedDinoGeos.box, accentMat);
        arm.scale.set(0.22 * s, 0.65 * s, 0.28 * s);
        arm.position.set(side * 0.78 * s, 2.02 * s, 1.05 * s);
        arm.rotation.x = -0.6;
        bodyPivot.add(arm);
      }

      jaw = new THREE.Group();
      jaw.position.set(0, 3.25 * s, 1.65 * s);
      const jawMesh = new THREE.Mesh(sharedDinoGeos.box, accentMat);
      jawMesh.scale.set(0.85 * s, 0.3 * s, 1.45 * s);
      jawMesh.position.set(0, -0.14 * s, 0.65 * s);
      jaw.add(jawMesh);
      bodyPivot.add(jaw);

      tail = new THREE.Group();
      tail.position.set(0, 2.25 * s, -1.2 * s);
      const tMesh = new THREE.Mesh(sharedDinoGeos.cone, skinMat);
      tMesh.scale.set(0.95 * s, 3.4 * s, 0.95 * s);
      tMesh.rotation.x = -Math.PI / 2;
      tMesh.position.set(0, -0.15 * s, -1.65 * s);
      tail.add(tMesh);
      bodyPivot.add(tail);

      const makeLeg = (side: number) => {
        const p = new THREE.Group();
        p.position.set(side * 0.76 * s, 1.85 * s, -0.15 * s);
        const upper = new THREE.Mesh(sharedDinoGeos.box, skinMat);
        upper.scale.set(0.55 * s, 1.25 * s, 0.82 * s);
        upper.position.set(0, -0.42 * s, 0.05 * s);
        const lower = new THREE.Mesh(sharedDinoGeos.box, accentMat);
        lower.scale.set(0.38 * s, 1.08 * s, 0.45 * s);
        lower.position.set(0, -1.22 * s, -0.1 * s);
        const foot = new THREE.Mesh(sharedDinoGeos.box, accentMat);
        foot.scale.set(0.62 * s, 0.24 * s, 0.92 * s);
        foot.position.set(0, -1.74 * s, 0.18 * s);
        p.add(upper, lower, foot);
        bodyPivot.add(p);
        return p;
      };
      leftLeg = makeLeg(-1);
      rightLeg = makeLeg(1);
    }

    return { root, bodyPivot, leftLeg, rightLeg, tail, wingL, wingR, jaw, eyeMat };
  };

  const rexRig = buildSculptedDinoRig(SSJ_DINOSAUR_SPECIES[0]);
  group.add(rexRig.root);

  const ambientDinos: AnimatedAmbientDino[] = [];
  for (let i = 1; i < SSJ_DINOSAUR_SPECIES.length; i++) {
    const spec = SSJ_DINOSAUR_SPECIES[i];
    const built = buildSculptedDinoRig(spec);
    group.add(built.root);
    ambientDinos.push({
      spec,
      root: built.root,
      leftLeg: built.leftLeg,
      rightLeg: built.rightLeg,
      tail: built.tail,
      wingL: built.wingL,
      wingR: built.wingR,
      jaw: built.jaw,
      phaseOffset: i * 1.17,
    });
  }

  // =========================================================================
  // 11. SSJ SAFARI TOUR CRUISER
  // =========================================================================
  const carRoot = new THREE.Group();
  const carYellowMat = new THREE.MeshStandardMaterial({ color: 0xd4a317, roughness: 0.42, metalness: 0.22 });
  const carGreenMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.46, metalness: 0.18 });
  const carRedStripeMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45, metalness: 0.2 });
  const carGlassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.14,
    metalness: 0.4,
    transparent: true,
    opacity: 0.68,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.92 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3, metalness: 0.8 });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfde047,
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.2,
    roughness: 0.25,
  });
  const akWoodMat = new THREE.MeshStandardMaterial({ color: 0x7c3f12, roughness: 0.78 });
  disposables.push(
    carYellowMat,
    carGreenMat,
    carRedStripeMat,
    carGlassMat,
    tireMat,
    hubMat,
    headlightMat,
    tailLightMat,
    akWoodMat
  );

  const carLowerGeo = new THREE.BoxGeometry(2.15, 0.72, 4.45);
  const carStripeGeo = new THREE.BoxGeometry(2.2, 0.18, 4.48);
  const carUpperGeo = new THREE.BoxGeometry(2.02, 0.86, 2.35);
  const carHoodGeo = new THREE.BoxGeometry(1.96, 0.36, 1.65);
  const carWindGeo = new THREE.BoxGeometry(1.88, 0.62, 0.12);
  const bumperGeo = new THREE.BoxGeometry(2.24, 0.32, 0.34);
  const lampGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10);
  lampGeo.rotateX(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.42, 10);
  hubGeo.rotateZ(Math.PI / 2);
  disposables.push(
    carLowerGeo,
    carStripeGeo,
    carUpperGeo,
    carHoodGeo,
    carWindGeo,
    bumperGeo,
    lampGeo,
    wheelGeo,
    hubGeo
  );

  const carLower = new THREE.Mesh(carLowerGeo, carYellowMat);
  carLower.position.set(0, 0.82, 0);
  carLower.castShadow = !isSoftwareGl;
  const carStripe = new THREE.Mesh(carStripeGeo, carRedStripeMat);
  carStripe.position.set(0, 1.18, 0);
  const carHood = new THREE.Mesh(carHoodGeo, carGreenMat);
  carHood.position.set(0, 1.38, 1.32);
  const carUpper = new THREE.Mesh(carUpperGeo, carGreenMat);
  carUpper.position.set(0, 1.68, -0.35);
  carUpper.castShadow = !isSoftwareGl;
  const carWind = new THREE.Mesh(carWindGeo, carGlassMat);
  carWind.position.set(0, 1.72, 0.85);
  carWind.rotation.x = -0.22;
  const frontBump = new THREE.Mesh(bumperGeo, darkSteelMat);
  frontBump.position.set(0, 0.64, 2.26);
  const rearBump = new THREE.Mesh(bumperGeo, darkSteelMat);
  rearBump.position.set(0, 0.64, -2.26);
  const spareTire = new THREE.Mesh(wheelGeo, tireMat);
  spareTire.rotation.y = Math.PI / 2;
  spareTire.position.set(0, 1.18, -2.32);
  carRoot.add(carLower, carStripe, carHood, carUpper, carWind, frontBump, rearBump, spareTire);

  for (const sx of [-0.72, 0.72]) {
    const hl = new THREE.Mesh(lampGeo, headlightMat);
    hl.position.set(sx, 0.98, 2.24);
    const tl = new THREE.Mesh(lampGeo, tailLightMat);
    tl.position.set(sx, 0.98, -2.24);
    carRoot.add(hl, tl);
  }

  const akTurret = new THREE.Group();
  akTurret.position.set(0, 2.22, -0.15);
  const akMountGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.32, 8);
  const akRecGeo = new THREE.BoxGeometry(0.16, 0.2, 0.92);
  const akBarrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
  akBarrelGeo.rotateX(Math.PI / 2);
  const akMagGeo = new THREE.BoxGeometry(0.1, 0.42, 0.18);
  const akStockGeo = new THREE.BoxGeometry(0.14, 0.18, 0.55);
  disposables.push(akMountGeo, akRecGeo, akBarrelGeo, akMagGeo, akStockGeo);
  akTurret.add(new THREE.Mesh(akMountGeo, darkSteelMat));
  const akRec = new THREE.Mesh(akRecGeo, darkSteelMat);
  akRec.position.set(0, 0.22, 0.1);
  const akBarrel = new THREE.Mesh(akBarrelGeo, darkSteelMat);
  akBarrel.position.set(0, 0.24, 0.95);
  const akMag = new THREE.Mesh(akMagGeo, akWoodMat);
  akMag.position.set(0, -0.02, 0.28);
  akMag.rotation.x = 0.26;
  const akStock = new THREE.Mesh(akStockGeo, akWoodMat);
  akStock.position.set(0, 0.18, -0.58);
  akTurret.add(akRec, akBarrel, akMag, akStock);
  carRoot.add(akTurret);

  const frontSteerPivots: THREE.Group[] = [];
  const wheelSpinMeshes: THREE.Group[] = [];
  for (const [wx, wz, isFront] of [
    [-1.12, 1.42, true],
    [1.12, 1.42, true],
    [-1.12, -1.42, false],
    [1.12, -1.42, false],
  ] as const) {
    const steerGroup = new THREE.Group();
    steerGroup.position.set(wx, 0.48, wz);
    const spinGroup = new THREE.Group();
    spinGroup.add(new THREE.Mesh(wheelGeo, tireMat), new THREE.Mesh(hubGeo, hubMat));
    steerGroup.add(spinGroup);
    carRoot.add(steerGroup);
    if (isFront) frontSteerPivots.push(steerGroup);
    wheelSpinMeshes.push(spinGroup);
  }
  group.add(carRoot);

  // =========================================================================
  // 12. AK-47 GOLDEN TRACER BEAM & MUZZLE FLASH
  // =========================================================================
  const tracerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95 });
  const tracerGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6);
  tracerGeo.rotateX(Math.PI / 2);
  const muzzleGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.92 });
  disposables.push(tracerMat, tracerGeo, muzzleGeo, muzzleMat);

  const tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
  tracerMesh.visible = false;
  const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzleMesh.visible = false;
  group.add(tracerMesh, muzzleMesh);

  // =========================================================================
  // 13. DENSE 1 KM PRIMEVAL JUNGLE FOREST (~1,650 INSTANCED TREES, PALMS, FERNS & BOULDERS)
  // =========================================================================
  const wildLocalX = WILDLIFE_FOREST_SANCTUARY_CENTER.x - ix;
  const wildLocalZ = WILDLIFE_FOREST_SANCTUARY_CENTER.z - iz;

  const isClearing = (lx: number, lz: number): boolean => {
    const wx = ix + lx;
    const wz = iz + lz;
    const r = Math.hypot(lx, lz);
    if (r > DINOSAUR_PERIMETER_WALL_RADIUS - 14) return true; // Keep 360° perimeter wall & patrol road clear
    for (const g of DINOSAUR_PERIMETER_GATES) {
      if (Math.hypot(lx - g.lx, lz - g.lz) < 34) return true; // Keep all 4 monumental gates completely clear
    }
    if (distanceToDinosaurTriangleTrack(wx, wz) < 11.5) return true; // Keep Grand Triangle Track wide & scenic!
    if (Math.abs(lx) < 16 && lz > 96 && lz < 224) return true; // Grand Jurassic Avenue
    if (Math.hypot(lx, lz - 112) < 30) return true; // Rotunda Visitor Center
    if (Math.hypot(lx + 72, lz - 84) < 22) return true; // Park Hostel
    if (Math.hypot(lx + 94, lz + 74) < 18) return true; // Glass Pavilion
    if (Math.hypot(lx + 24, lz + 124) < 18) return true; // Genomic Lab
    if (Math.hypot(lx + 34, lz - 182) < 18) return true; // Helipad clearing
    if (Math.hypot(lx - wildLocalX, lz - wildLocalZ) < 32) return true; // Wildlife Valley
    if (Math.hypot(lx - 44, lz + 176) < 28) return true; // Northern waterfall massif
    if (dinoCrystalLakeNormDist(wx, wz) < 1.14) return true; // Scenic Crystal Lake
    if (lz >= DINOSAUR_RIVER_START_LZ - 6 && lz <= DINOSAUR_RIVER_END_LZ + 6) {
      if (Math.abs(lx - ssjRiverLocalX(lz)) < ssjRiverHalfWidth(lz) + 6.0) return true;
    }
    return false;
  };

  const pineSpots: Array<[number, number, number]> = [];
  const palmSpots: Array<[number, number, number]> = [];
  const fernSpots: Array<[number, number, number]> = [];

  for (let i = 0; i < 760; i++) {
    const ang = (i * 2.3999632) % (Math.PI * 2);
    const rad = 18 + Math.sqrt((i + 0.5) / 760) * (DINOSAUR_PERIMETER_WALL_RADIUS - 32);
    const lx = Math.cos(ang) * rad;
    const lz = Math.sin(ang) * rad;
    if (isClearing(lx, lz)) continue;

    const wx = ix + lx;
    const wz = iz + lz;
    const sc = 0.96 + (i % 5) * 0.24;
    if (i % 5 === 0) {
      palmSpots.push([wx, wz, sc * 0.92]);
    } else if (i % 6 === 1) {
      fernSpots.push([wx, wz, 0.9 + (i % 4) * 0.32]);
    } else {
      pineSpots.push([wx, wz, sc]);
    }
  }

  const trunkGeo = new THREE.CylinderGeometry(0.32, 0.52, 6.2, 6);
  const lowerCanopyGeo = new THREE.ConeGeometry(3.4, 8.2, 7);
  const upperCanopyGeo = new THREE.ConeGeometry(2.35, 6.4, 7);
  const palmTrunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 8.6, 6);
  const palmCrownGeo = new THREE.ConeGeometry(4.2, 2.2, 7);
  const fernGeo = new THREE.ConeGeometry(2.4, 1.35, 6);
  const rockGeo = new THREE.DodecahedronGeometry(2.1, 0);
  disposables.push(
    trunkGeo,
    lowerCanopyGeo,
    upperCanopyGeo,
    palmTrunkGeo,
    palmCrownGeo,
    fernGeo,
    rockGeo
  );

  const trunkInst = new THREE.InstancedMesh(trunkGeo, pineTrunkMat, pineSpots.length);
  const lowerCanopyInst = new THREE.InstancedMesh(lowerCanopyGeo, pineLeafMat, pineSpots.length);
  const upperCanopyInst = new THREE.InstancedMesh(upperCanopyGeo, pineCrownMat, pineSpots.length);
  pineSpots.forEach(([px, pz, sc], idx) => {
    const py = groundHeightAt(px, pz);
    dummy.position.set(px, py + 3.1 * sc, pz);
    dummy.rotation.set(0, idx * 0.9, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px, py + 8.0 * sc, pz);
    dummy.updateMatrix();
    lowerCanopyInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px, py + 12.2 * sc, pz);
    dummy.updateMatrix();
    upperCanopyInst.setMatrixAt(idx, dummy.matrix);
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  lowerCanopyInst.instanceMatrix.needsUpdate = true;
  upperCanopyInst.instanceMatrix.needsUpdate = true;
  group.add(trunkInst, lowerCanopyInst, upperCanopyInst);

  const palmTrunkInst = new THREE.InstancedMesh(palmTrunkGeo, pineTrunkMat, palmSpots.length);
  const palmCrownInst = new THREE.InstancedMesh(palmCrownGeo, palmFrondMat, palmSpots.length);
  palmSpots.forEach(([px, pz, sc], idx) => {
    const py = groundHeightAt(px, pz);
    dummy.position.set(px, py + 4.2 * sc, pz);
    dummy.rotation.set(0.08, idx * 1.3, 0.06);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    palmTrunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px, py + 8.6 * sc, pz);
    dummy.rotation.set(Math.PI, idx * 1.3, 0);
    dummy.updateMatrix();
    palmCrownInst.setMatrixAt(idx, dummy.matrix);
  });
  palmTrunkInst.instanceMatrix.needsUpdate = true;
  palmCrownInst.instanceMatrix.needsUpdate = true;
  group.add(palmTrunkInst, palmCrownInst);

  const fernInst = new THREE.InstancedMesh(fernGeo, fernMat, fernSpots.length);
  fernSpots.forEach(([px, pz, sc], idx) => {
    const py = groundHeightAt(px, pz);
    dummy.position.set(px, py + 0.55 * sc, pz);
    dummy.rotation.set(0, idx * 1.1, 0);
    dummy.scale.set(sc * 1.25, sc * 0.85, sc * 1.25);
    dummy.updateMatrix();
    fernInst.setMatrixAt(idx, dummy.matrix);
  });
  fernInst.instanceMatrix.needsUpdate = true;
  group.add(fernInst);

  // Mossy Volcanic Boulders lining the 1 KM Riverbanks & Scenic Crystal Lake Shore
  const boulderSpots: Array<[number, number, number]> = [];
  for (let i = 0; i < 120; i++) {
    const t = i / 120;
    const lz = DINOSAUR_RIVER_START_LZ + 14 + t * (DINOSAUR_RIVER_END_LZ - DINOSAUR_RIVER_START_LZ - 28);
    const side = i % 2 === 0 ? -1 : 1;
    const lx = ssjRiverLocalX(lz) + side * (ssjRiverHalfWidth(lz) + 3.2 + (i % 4) * 1.6);
    if (dinoCrystalLakeNormDist(ix + lx, iz + lz) < 1.02) continue;
    boulderSpots.push([ix + lx, iz + lz, 0.85 + (i % 4) * 0.42]);
  }
  for (let i = 0; i < 36; i++) {
    const ang = (i / 36) * Math.PI * 2;
    const lx = DINOSAUR_CRYSTAL_LAKE_CENTER.lx + Math.cos(ang) * (DINOSAUR_CRYSTAL_LAKE_RX + 4.5);
    const lz = DINOSAUR_CRYSTAL_LAKE_CENTER.lz + Math.sin(ang) * (DINOSAUR_CRYSTAL_LAKE_RZ + 4.5);
    if (Math.abs(lx - ssjRiverLocalX(lz)) < ssjRiverHalfWidth(lz) + 3) continue;
    boulderSpots.push([ix + lx, iz + lz, 1.0 + (i % 3) * 0.45]);
  }

  const boulderInst = new THREE.InstancedMesh(rockGeo, cliffRockMat, boulderSpots.length);
  boulderSpots.forEach(([bx, bz, sc], idx) => {
    const by = groundHeightAt(bx, bz);
    dummy.position.set(bx, by + sc * 0.45, bz);
    dummy.rotation.set(idx * 0.4, idx * 1.1, idx * 0.2);
    dummy.scale.set(sc * 1.35, sc * 0.85, sc);
    dummy.updateMatrix();
    boulderInst.setMatrixAt(idx, dummy.matrix);
  });
  boulderInst.instanceMatrix.needsUpdate = true;
  group.add(boulderInst);

  // Glowing Prehistoric Collectibles (Amber, Fossils, Pearls)
  const collectibleGeo = new THREE.OctahedronGeometry(0.62, 0);
  disposables.push(collectibleGeo);
  const collectibles: Array<{ mesh: THREE.Mesh; baseY: number; phase: number }> = [];
  for (const [clx, clz, isPearl] of [
    [-16, 178, false],
    [16, 178, false],
    [-62, 36, false],
    [62, 36, true],
    [-122, -82, true],
    [122, -82, false],
  ] as const) {
    const p = worldPos(clx, clz);
    const m = new THREE.Mesh(collectibleGeo, isPearl ? pearlCollectMat : amberCollectMat);
    m.position.set(p.x, p.y + 1.45, p.z);
    group.add(m);
    collectibles.push({ mesh: m, baseY: p.y + 1.45, phase: clx * 0.3 });
  }

  // Zero-GC scratch vectors
  const tmpFrom = new THREE.Vector3();
  const tmpTo = new THREE.Vector3();
  const tmpMid = new THREE.Vector3();

  const triggerWallShatter = (_stage: number) => {};

  const update = (
    state: DinosaurIslandState,
    elapsed: number,
    _dt: number,
    lanternStrength: number
  ) => {
    // 1. Animate 1 KM Flowing Forest River, Crystal Lake & Waterfall Shader
    riverUniforms.uTime.value = elapsed;

    // 2. Flicker Grand Entrance Arch torches & smoothly swing colossal Jurassic Park Double Gates!
    const flicker = 0.92 + Math.sin(elapsed * 14.0) * 0.1 + Math.cos(elapsed * 23.0) * 0.06;
    for (let i = 0; i < torchFlames.length; i++) {
      torchFlames[i].scale.set(flicker, 1.05 + (flicker - 0.92) * 1.4, flicker);
    }
    torchFlameMat.emissiveIntensity = 1.9 + lanternStrength * 1.25;
    warmWindowMat.emissiveIntensity = 0.85 + lanternStrength * 1.05;

    // 3. Animate Gigantic Automated Horizontal Upper Roof Doors (CLOSE at night, WIDE OPEN at morning!)
    const closeP = Math.max(0, Math.min(1, state.roofDoorCloseProgress));
    const openP = 1.0 - closeP;
    const slideDist = openP * (ROOF_R + 12.0);
    westRoofLeaf.position.set(ix - slideDist, ROOF_Y, iz);
    eastRoofLeaf.position.set(ix + slideDist, ROOF_Y, iz);
    // Retract smoothly when fully open so the leaves park cleanly off the roof aperture
    const openScaleX = 1.0 - openP * 0.86;
    westRoofLeaf.scale.set(openScaleX, 1, 1);
    eastRoofLeaf.scale.set(openScaleX, 1, 1);
    const roofVisible = closeP > 0.015;
    westRoofLeaf.visible = roofVisible;
    eastRoofLeaf.visible = roofVisible;
    roofBayLightMat.emissiveIntensity = 0.25 + lanternStrength * 1.85 * closeP;

    // 4. Smoothly swing ALL 4 Bigger Surrounding Perimeter Gates wide open (0 -> ±98 deg) as explorer enters!
    for (let gi = 0; gi < perimeterGateRigs.length; gi++) {
      const rig = perimeterGateRigs[gi];
      const openVal = Math.max(0, Math.min(1, state.perimeterGateProgress[gi] ?? state.gateOpenProgress));
      const swingAngle = openVal * 1.71; // ±98 degrees wide open!
      rig.leftPivot.rotation.y = swingAngle;
      rig.rightPivot.rotation.y = -swingAngle;
    }
    const activeRig = perimeterGateRigs[state.nearestGateIndex] ?? perimeterGateRigs[0];
    gateInteractable.x = activeRig.worldX;
    gateInteractable.y = activeRig.worldY + 1.4;
    gateInteractable.z = activeRig.worldZ;
    gateInteractable.label =
      state.gateOpenProgress > 0.5
        ? `Close ${activeRig.spec.name}`
        : `Open ${activeRig.spec.name}`;

    // 5. Animate Roaming T-Rex ("Rexy")
    const rexY = groundHeightAt(state.dinoX, state.dinoZ);
    rexRig.root.position.set(state.dinoX, Math.max(WATER_LEVEL + 0.15, rexY), state.dinoZ);
    rexRig.root.rotation.y = state.dinoHeading;
    const c = state.dinoCollapse;
    rexRig.bodyPivot.rotation.z = c * (Math.PI * 0.46);
    rexRig.bodyPivot.position.y = -c * 1.15 + (1 - c) * Math.abs(Math.sin(state.dinoRunPhase)) * 0.22;
    const stride = (1 - c) * Math.sin(state.dinoRunPhase);
    if (rexRig.leftLeg) rexRig.leftLeg.rotation.x = stride * 0.62;
    if (rexRig.rightLeg) rexRig.rightLeg.rotation.x = -stride * 0.62;
    if (rexRig.tail) rexRig.tail.rotation.y = Math.sin(elapsed * 3.8) * 0.28 * (1 - c);
    if (rexRig.jaw) {
      const roarOpen =
        state.dinoRoarTimer > 0
          ? 0.44 + Math.sin(elapsed * 18) * 0.14
          : 0.12 + Math.sin(elapsed * 4) * 0.06;
      rexRig.jaw.rotation.x = (1 - c) * roarOpen;
    }
    rexRig.eyeMat.emissiveIntensity = state.dinoAlive ? 1.8 + lanternStrength * 0.8 : 0.15;

    // 6. Animate all 17 other Prehistoric Species across the 1 KM sanctuary
    for (let i = 0; i < ambientDinos.length; i++) {
      const d = ambientDinos[i];
      const ang = elapsed * d.spec.speed * 0.22 + d.phaseOffset;
      const wx = ix + d.spec.localX + Math.cos(ang) * d.spec.orbitRadius;
      const wz = iz + d.spec.localZ + Math.sin(ang) * d.spec.orbitRadius;
      const heading = Math.atan2(-Math.sin(ang), Math.cos(ang));

      if (d.spec.archetype === 'pterosaur') {
        const alt = Math.min(
          ROOF_Y - 4.5,
          (d.spec.altitude ?? 24) + Math.sin(elapsed * 0.9 + d.phaseOffset) * 2.2
        );
        d.root.position.set(wx, alt, wz);
        d.root.rotation.y = heading;
        const flap = Math.sin(elapsed * 5.2 + d.phaseOffset) * 0.46;
        if (d.wingL) d.wingL.rotation.z = flap;
        if (d.wingR) d.wingR.rotation.z = -flap;
      } else if (d.spec.archetype === 'marine') {
        d.root.position.set(wx, WATER_LEVEL - 0.65 + Math.sin(elapsed * 1.4) * 0.35, wz);
        d.root.rotation.y = heading;
        if (d.tail) d.tail.rotation.y = Math.sin(elapsed * 4.2) * 0.42;
      } else {
        const wy = groundHeightAt(wx, wz);
        d.root.position.set(wx, Math.max(WATER_LEVEL + 0.15, wy), wz);
        d.root.rotation.y = heading;
        const step = Math.sin(elapsed * 4.5 + d.phaseOffset);
        if (d.leftLeg) d.leftLeg.rotation.x = step * 0.48;
        if (d.rightLeg) d.rightLeg.rotation.x = -step * 0.48;
        if (d.tail) d.tail.rotation.y = Math.sin(elapsed * 2.8 + d.phaseOffset) * 0.22;
      }
    }

    // 7. Update SSJ Safari Tour Cruiser transform & wheels
    const carGroundY = state.safariCar.inVault
      ? vaultFloorYAt(state.safariCar.x, state.safariCar.z)
      : Math.max(WATER_LEVEL + 0.15, groundHeightAt(state.safariCar.x, state.safariCar.z));
    carRoot.position.set(
      state.safariCar.x,
      carGroundY + 0.04,
      state.safariCar.z
    );
    carRoot.rotation.y = state.safariCar.heading;
    for (const pivot of frontSteerPivots) {
      pivot.rotation.y = state.safariCar.steerAngle;
    }
    for (const w of wheelSpinMeshes) {
      w.rotation.x = state.safariCar.wheelSpin;
    }

    // 8. Update AK-47 Golden Tracer Beam & Muzzle Flash
    if (state.tracerTimer > 0) {
      tmpFrom.set(state.tracerFromX, state.tracerFromY, state.tracerFromZ);
      tmpTo.set(state.tracerToX, state.tracerToY, state.tracerToZ);
      const len = Math.max(0.5, tmpFrom.distanceTo(tmpTo));
      tmpMid.addVectors(tmpFrom, tmpTo).multiplyScalar(0.5);

      tracerMesh.position.copy(tmpMid);
      tracerMesh.lookAt(tmpTo);
      tracerMesh.scale.set(1, 1, len);
      tracerMat.opacity = Math.min(1, state.tracerTimer / 0.14);
      tracerMesh.visible = true;

      muzzleMesh.position.copy(tmpFrom);
      const pulse = 0.85 + Math.sin(elapsed * 60) * 0.35;
      muzzleMesh.scale.set(pulse, pulse, pulse);
      muzzleMesh.visible = true;
    } else {
      tracerMesh.visible = false;
      muzzleMesh.visible = false;
    }

    // 9. Gently float glowing prehistoric collectibles
    for (let i = 0; i < collectibles.length; i++) {
      const col = collectibles[i];
      col.mesh.position.y = col.baseY + Math.sin(elapsed * 2.4 + col.phase) * 0.25;
      col.mesh.rotation.y = elapsed * 1.5 + col.phase;
    }
  };

  const setSafariCarOnlyVisible = (onlyCar: boolean) => {
    for (const child of group.children) {
      child.visible = onlyCar ? child === carRoot : true;
    }
  };

  return {
    group,
    gateInteractable,
    triggerWallShatter,
    setSafariCarOnlyVisible,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
