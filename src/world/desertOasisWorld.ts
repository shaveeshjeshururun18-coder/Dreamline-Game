import * as THREE from 'three';
import {
  DESERT_CAMPFIRE_POS,
  DESERT_HELIPAD_POS,
  DESERT_OASIS_CAMP_POS,
  DESERT_OASIS_CENTER,
  DESERT_OASIS_JETTY_BOUNDS,
  DESERT_OASIS_RX,
  DESERT_OASIS_RZ,
  DESERT_PYRAMID_BASE_HALF,
  DESERT_PYRAMID_BASE_Y,
  DESERT_PYRAMID_CENTER,
  DESERT_PYRAMID_CHAMBER_Y,
  DESERT_PYRAMID_RELIC_POS,
  DESERT_PYRAMID_SOUTH_PORTAL,
  DESERT_PYRAMID_SUMMIT_Y,
  DESERT_SPHINX_ARCH_POS,
  isDesertClearingAt,
} from '../game/desertOasis';
import { groundHeightAt, WATER_LEVEL, type AabbCollider } from '../game/terrain';
import type { InteractableItem } from '../game/types';

export interface DesertOasisWorldSystem {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  setCampfireLit: (lit: boolean) => void;
  update: (elapsed: number, dt: number, lanternStrength: number, playerX: number, playerZ: number) => void;
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

function createHieroglyphTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c89b5e';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#6c4923';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 112);

  // Carved golden sun & caravan motifs
  ctx.fillStyle = '#e7bd63';
  for (let i = 0; i < 8; i++) {
    const cx = 42 + i * 61;
    // Sun disc + rays
    ctx.beginPath();
    ctx.arc(cx, 54, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a3b1b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 20, 86);
    ctx.lineTo(cx, 72);
    ctx.lineTo(cx + 20, 86);
    ctx.stroke();
    // Side wing bars
    ctx.fillStyle = '#8b5e2d';
    ctx.fillRect(cx - 18, 94, 36, 6);
    ctx.fillStyle = '#e7bd63';
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHelipadSandstoneTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8d6e4c';
  ctx.fillRect(0, 0, 256, 256);

  // Outer carved gold circle
  ctx.strokeStyle = '#f5c451';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 106, 0, Math.PI * 2);
  ctx.stroke();

  // Inner dashed compass ring
  ctx.strokeStyle = '#ffdf8c';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.arc(128, 128, 84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crisp H landing mark
  ctx.fillStyle = '#fff3d1';
  ctx.fillRect(88, 72, 18, 112);
  ctx.fillRect(150, 72, 18, 112);
  ctx.fillRect(88, 118, 80, 18);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRugTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8f242c';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#f0b94a';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 236, 108);
  ctx.fillStyle = '#1f5a66';
  for (let i = 0; i < 4; i++) {
    const cx = 46 + i * 54;
    ctx.beginPath();
    ctx.moveTo(cx, 28);
    ctx.lineTo(cx + 20, 64);
    ctx.lineTo(cx, 100);
    ctx.lineTo(cx - 20, 64);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f3cc70';
    ctx.beginPath();
    ctx.arc(cx, 64, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f5a66';
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDesertOasisWorld(scene: THREE.Scene): DesertOasisWorldSystem {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];
  const rand = mulberry32(20261122);

  const track = <T extends { dispose: () => void }>(obj: T): T => {
    disposables.push(obj);
    return obj;
  };

  // Shared PBR Materials (varied roughness & metalness per Three.js directives)
  const sandstoneLight = track(new THREE.MeshStandardMaterial({ color: 0xdcb476, roughness: 0.88, metalness: 0.02 }));
  const sandstoneMid = track(new THREE.MeshStandardMaterial({ color: 0xc59554, roughness: 0.91, metalness: 0.02 }));
  const sandstoneDark = track(new THREE.MeshStandardMaterial({ color: 0x9b6d3c, roughness: 0.93, metalness: 0.03 }));
  const chamberFloorMat = track(new THREE.MeshStandardMaterial({ color: 0xb28752, roughness: 0.72, metalness: 0.06 }));
  const goldTrimMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf0be4b,
      roughness: 0.24,
      metalness: 0.86,
      emissive: new THREE.Color(0x52340a),
      emissiveIntensity: 0.22,
    })
  );
  const relicOrbMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffe48f,
      roughness: 0.14,
      metalness: 0.85,
      emissive: new THREE.Color(0xffa62b),
      emissiveIntensity: 1.35,
    })
  );
  const torchFlameMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffcf5a,
      emissive: new THREE.Color(0xff7718),
      emissiveIntensity: 2.1,
      roughness: 0.35,
    })
  );
  const timberMat = track(new THREE.MeshStandardMaterial({ color: 0x6f4b2f, roughness: 0.82, metalness: 0.04 }));
  const tentSilkCrimson = track(new THREE.MeshStandardMaterial({ color: 0x9b2d30, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide }));
  const tentSilkCream = track(new THREE.MeshStandardMaterial({ color: 0xf2dfc0, roughness: 0.84, metalness: 0.02, side: THREE.DoubleSide }));
  const brassMat = track(new THREE.MeshStandardMaterial({ color: 0xdba948, roughness: 0.28, metalness: 0.82 }));
  const hieroTex = track(createHieroglyphTexture());
  const hieroMat = track(new THREE.MeshStandardMaterial({ map: hieroTex, roughness: 0.84, metalness: 0.06 }));
  const rugTex = track(createRugTexture());
  const rugMat = track(new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.9, metalness: 0.0 }));

  const addBox = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = group
  ) => {
    const geo = track(new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // =========================================================================
  // 1. EMERALD OASIS LAGOON WATER & WALKABLE TIMBER JETTY
  // =========================================================================
  const oasisWaterGeo = track(new THREE.CircleGeometry(1, 44));
  oasisWaterGeo.rotateX(-Math.PI / 2);
  const oasisWaterMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1ea896,
      emissive: new THREE.Color(0x0a4d46),
      emissiveIntensity: 0.22,
      roughness: 0.14,
      metalness: 0.35,
      transparent: true,
      opacity: 0.86,
    })
  );
  const oasisWaterMesh = new THREE.Mesh(oasisWaterGeo, oasisWaterMat);
  oasisWaterMesh.scale.set(DESERT_OASIS_RX * 1.04, 1, DESERT_OASIS_RZ * 1.04);
  oasisWaterMesh.position.set(DESERT_OASIS_CENTER.x, WATER_LEVEL + 0.04, DESERT_OASIS_CENTER.z);
  oasisWaterMesh.receiveShadow = true;
  group.add(oasisWaterMesh);

  // Shimmering turquoise shallow inner ripple ring
  const oasisRingGeo = track(new THREE.RingGeometry(0.62, 0.96, 40));
  oasisRingGeo.rotateX(-Math.PI / 2);
  const oasisRingMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x7ef3e0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  const oasisRingMesh = new THREE.Mesh(oasisRingGeo, oasisRingMat);
  oasisRingMesh.scale.set(DESERT_OASIS_RX, 1, DESERT_OASIS_RZ);
  oasisRingMesh.position.set(DESERT_OASIS_CENTER.x, WATER_LEVEL + 0.06, DESERT_OASIS_CENTER.z);
  group.add(oasisRingMesh);

  // Walkable Oasis Timber Jetty extending from eastern sandy shore into the turquoise water
  const jMinX = DESERT_OASIS_JETTY_BOUNDS.minX;
  const jMaxX = DESERT_OASIS_JETTY_BOUNDS.maxX;
  const jMidX = (jMinX + jMaxX) * 0.5;
  const jMidZ = (DESERT_OASIS_JETTY_BOUNDS.minZ + DESERT_OASIS_JETTY_BOUNDS.maxZ) * 0.5;
  const jLen = jMaxX - jMinX;
  const jWidth = DESERT_OASIS_JETTY_BOUNDS.maxZ - DESERT_OASIS_JETTY_BOUNDS.minZ;
  const jY = DESERT_OASIS_JETTY_BOUNDS.deckY;

  addBox(jLen, 0.22, jWidth, timberMat, jMidX, jY - 0.11, jMidZ);
  // Decorative wooden plank grooves & corner mooring posts + brass lanterns
  const postGeo = track(new THREE.CylinderGeometry(0.14, 0.16, 2.2, 8));
  const lanternGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      emissive: new THREE.Color(0xffb44c),
      emissiveIntensity: 1.5,
      roughness: 0.2,
    })
  );
  const lanternBulbGeo = track(new THREE.OctahedronGeometry(0.22, 0));
  const lanternGlowMeshes: THREE.Mesh[] = [];

  for (const px of [jMinX + 0.4, jMidX, jMaxX - 0.4]) {
    for (const pz of [jMidZ - jWidth * 0.45, jMidZ + jWidth * 0.45]) {
      const post = new THREE.Mesh(postGeo, timberMat);
      post.position.set(px, jY - 0.35, pz);
      group.add(post);
      if (px === jMinX + 0.4) {
        const tallPost = new THREE.Mesh(postGeo, timberMat);
        tallPost.position.set(px, jY + 1.0, pz);
        group.add(tallPost);
        const cap = addBox(0.38, 0.08, 0.38, brassMat, px, jY + 2.15, pz);
        cap.castShadow = false;
        const bulb = new THREE.Mesh(lanternBulbGeo, lanternGlowMat);
        bulb.position.set(px, jY + 1.9, pz);
        group.add(bulb);
        lanternGlowMeshes.push(bulb);
      }
    }
  }

  // Floating green oasis lily pads
  const lilyGeo = track(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 12));
  const lilyMat = track(new THREE.MeshStandardMaterial({ color: 0x3b8c52, roughness: 0.72 }));
  const lilyInst = new THREE.InstancedMesh(lilyGeo, lilyMat, 22);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.25 + rand() * 0.62;
    const lx = DESERT_OASIS_CENTER.x + Math.cos(a) * DESERT_OASIS_RX * r;
    const lz = DESERT_OASIS_CENTER.z + Math.sin(a) * DESERT_OASIS_RZ * r;
    const sc = 0.65 + rand() * 0.65;
    dummy.position.set(lx, WATER_LEVEL + 0.06, lz);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(sc, 1, sc);
    dummy.updateMatrix();
    lilyInst.setMatrixAt(i, dummy.matrix);
  }
  lilyInst.computeBoundingSphere();
  group.add(lilyInst);

  // =========================================================================
  // 2. CURVED DATE PALM GROVE RINGING THE EMERALD OASIS (Instanced Composite Trees!)
  // =========================================================================
  const palmTrunkMat = track(new THREE.MeshStandardMaterial({ color: 0x7b5638, roughness: 0.92 }));
  const palmFrondMat = track(
    new THREE.MeshStandardMaterial({ color: 0x3c7d3b, roughness: 0.72, side: THREE.DoubleSide })
  );
  const palmDateMat = track(new THREE.MeshStandardMaterial({ color: 0xc26a1f, roughness: 0.55 }));
  const trunkSegGeo = track(new THREE.CylinderGeometry(0.22, 0.28, 1.25, 7));
  const frondGeo = track(new THREE.ConeGeometry(0.75, 3.6, 5));
  frondGeo.scale(1.0, 1.0, 0.22);
  const dateClusterGeo = track(new THREE.SphereGeometry(0.28, 7, 6));

  const palmSpecs: Array<{ px: number; pz: number; scale: number; leanAngle: number }> = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + (rand() - 0.5) * 0.14;
    if (angle > -0.28 && angle < 0.28) continue;
    const radScale = 1.08 + rand() * 0.26;
    const px = DESERT_OASIS_CENTER.x + Math.cos(angle) * DESERT_OASIS_RX * radScale;
    const pz = DESERT_OASIS_CENTER.z + Math.sin(angle) * DESERT_OASIS_RZ * radScale;
    if (Math.hypot(px - DESERT_OASIS_CAMP_POS.x, pz - DESERT_OASIS_CAMP_POS.z) < 8.5) continue;
    palmSpecs.push({ px, pz, scale: 0.85 + rand() * 0.45, leanAngle: angle + Math.PI });
  }
  palmSpecs.push(
    { px: DESERT_OASIS_CAMP_POS.x + 8.5, pz: DESERT_OASIS_CAMP_POS.z - 4.5, scale: 1.15, leanAngle: 2.4 },
    { px: DESERT_OASIS_CAMP_POS.x - 5.5, pz: DESERT_OASIS_CAMP_POS.z - 8.2, scale: 1.05, leanAngle: 1.2 },
    { px: DESERT_HELIPAD_POS.x + 9.2, pz: DESERT_HELIPAD_POS.z + 4.8, scale: 1.1, leanAngle: 3.6 }
  );

  const trunkSegsPerPalm = 6;
  const frondsPerPalm = 8;
  const datesPerPalm = 3;
  const palmTrunkInst = new THREE.InstancedMesh(trunkSegGeo, palmTrunkMat, palmSpecs.length * trunkSegsPerPalm);
  const palmFrondInst = new THREE.InstancedMesh(frondGeo, palmFrondMat, palmSpecs.length * frondsPerPalm);
  const palmDateInst = new THREE.InstancedMesh(dateClusterGeo, palmDateMat, palmSpecs.length * datesPerPalm);
  const frondColor = new THREE.Color();
  const palmQ = new THREE.Quaternion();
  const palmEuler = new THREE.Euler();
  const palmPivot = new THREE.Object3D();
  const palmChild = new THREE.Object3D();
  palmPivot.add(palmChild);

  let trIdx = 0;
  let frIdx = 0;
  let dtIdx = 0;
  for (const spec of palmSpecs) {
    const py = groundHeightAt(spec.px, spec.pz) - 0.12;
    let curY = 0;
    let curLean = 0;
    for (let s = 0; s < trunkSegsPerPalm; s++) {
      const t = s / (trunkSegsPerPalm - 1);
      const rad = (1.15 - t * 0.36) * spec.scale;
      dummy.position.set(
        spec.px + Math.cos(spec.leanAngle) * curLean,
        py + curY + 0.58 * spec.scale,
        spec.pz + Math.sin(spec.leanAngle) * curLean
      );
      palmEuler.set(
        Math.sin(spec.leanAngle) * (0.06 + t * 0.16),
        0,
        -Math.cos(spec.leanAngle) * (0.06 + t * 0.16)
      );
      palmQ.setFromEuler(palmEuler);
      dummy.quaternion.copy(palmQ);
      dummy.scale.set(rad, spec.scale, rad);
      dummy.updateMatrix();
      palmTrunkInst.setMatrixAt(trIdx++, dummy.matrix);
      curY += 1.05 * spec.scale;
      curLean += (0.14 + t * 0.22) * spec.scale;
    }
    const crownX = spec.px + Math.cos(spec.leanAngle) * curLean;
    const crownY = py + curY;
    const crownZ = spec.pz + Math.sin(spec.leanAngle) * curLean;
    for (let d = 0; d < datesPerPalm; d++) {
      const da = (d / datesPerPalm) * Math.PI * 2;
      dummy.position.set(
        crownX + Math.cos(da) * 0.35 * spec.scale,
        crownY - 0.25 * spec.scale,
        crownZ + Math.sin(da) * 0.35 * spec.scale
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(spec.scale);
      dummy.updateMatrix();
      palmDateInst.setMatrixAt(dtIdx++, dummy.matrix);
    }
    for (let f = 0; f < frondsPerPalm; f++) {
      const fa = (f / frondsPerPalm) * Math.PI * 2 + spec.leanAngle * 0.4;
      palmPivot.position.set(crownX, crownY + 0.1 * spec.scale, crownZ);
      palmPivot.rotation.set(0, fa, 0);
      palmChild.position.set(0, 0.25 * spec.scale, 1.55 * spec.scale);
      palmChild.rotation.set(Math.PI * 0.58, 0, 0);
      palmChild.scale.setScalar(spec.scale * (0.9 + (f % 2) * 0.16));
      palmPivot.updateMatrixWorld(true);
      palmFrondInst.setMatrixAt(frIdx, palmChild.matrixWorld);
      frondColor.setHex(f % 2 === 0 ? 0x3c7d3b : 0x4c9446);
      palmFrondInst.setColorAt(frIdx, frondColor);
      frIdx++;
    }
  }
  palmTrunkInst.computeBoundingSphere();
  palmFrondInst.computeBoundingSphere();
  palmDateInst.computeBoundingSphere();
  group.add(palmTrunkInst, palmFrondInst, palmDateInst);

  // =========================================================================
  // 3. GRAND 6-TIER STEPPED SANDSTONE PYRAMID + WALKABLE STAIRS + SECRET CHAMBER
  // =========================================================================
  const pyrGroup = new THREE.Group();
  pyrGroup.position.set(DESERT_PYRAMID_CENTER.x, DESERT_PYRAMID_BASE_Y, DESERT_PYRAMID_CENTER.z);
  group.add(pyrGroup);

  const totalH = DESERT_PYRAMID_SUMMIT_Y - DESERT_PYRAMID_BASE_Y; // 14.0m
  const tiers = 6;
  const tierH = totalH / tiers; // 2.333m each

  // Build Tiers 1 & 2 (ground y = 0..4.66m) as HOLLOW massive sandstone perimeter walls so the South Portal &
  // Inner Secret Chamber (lx: -7.5..7.5, lz: -7.5..7.5) are 100% open & walkable!
  for (let t = 0; t < tiers; t++) {
    const frac = t / tiers;
    const half = DESERT_PYRAMID_BASE_HALF * (1 - frac * 0.8) + 0.5;
    const yCenter = t * tierH + tierH * 0.5;
    const tierMat = t % 2 === 0 ? sandstoneLight : sandstoneMid;

    if (t < 2) {
      const innerHalf = 7.4;
      const sideThick = half - innerHalf;
      // North solid block
      addBox(half * 2, tierH, sideThick, tierMat, 0, yCenter, -(innerHalf + sideThick * 0.5), pyrGroup);
      // West solid block
      addBox(sideThick, tierH, innerHalf * 2, tierMat, -(innerHalf + sideThick * 0.5), yCenter, 0, pyrGroup);
      // East solid block
      addBox(sideThick, tierH, innerHalf * 2, tierMat, innerHalf + sideThick * 0.5, yCenter, 0, pyrGroup);
      // South wall split around monumental 5.6m-wide Portal Corridor (lx: -2.8..+2.8)!
      const southWingW = half - 2.8;
      addBox(southWingW, tierH, sideThick, tierMat, -(2.8 + southWingW * 0.5), yCenter, innerHalf + sideThick * 0.5, pyrGroup);
      addBox(southWingW, tierH, sideThick, tierMat, 2.8 + southWingW * 0.5, yCenter, innerHalf + sideThick * 0.5, pyrGroup);
    } else {
      // Upper solid stepped sandstone tiers (3..6) forming the roof above the chamber & rising to the summit
      addBox(half * 2, tierH, half * 2, tierMat, 0, yCenter, 0, pyrGroup);
      // Carved golden cornice trim band along tier 4 & tier 6
      if (t === 3 || t === 5) {
        addBox(half * 2 + 0.25, 0.24, half * 2 + 0.25, goldTrimMat, 0, (t + 1) * tierH - 0.12, 0, pyrGroup);
      }
    }
  }

  // Chamber Floor & Engraved Sandstone Wall Lining (inside the pyramid!)
  const chamberFloorRelY = DESERT_PYRAMID_CHAMBER_Y - DESERT_PYRAMID_BASE_Y; // 0.2m
  addBox(15.2, 0.24, 15.2, chamberFloorMat, 0, chamberFloorRelY - 0.12, 0, pyrGroup);
  addBox(5.6, 0.24, 12.2, chamberFloorMat, 0, chamberFloorRelY - 0.12, 13.0, pyrGroup);
  // Decorative central crimson carpet runner inside the Secret Chamber
  addBox(3.4, 0.04, 15.5, rugMat, 0, chamberFloorRelY + 0.02, 4.0, pyrGroup);

  // Monumental South Portal Entrance Frame & Hieroglyphic Lintel Frieze
  const portalZ = DESERT_PYRAMID_BASE_HALF + 0.45;
  addBox(1.8, 5.4, 2.2, sandstoneDark, -3.5, 2.7, portalZ, pyrGroup);
  addBox(1.8, 5.4, 2.2, sandstoneDark, 3.5, 2.7, portalZ, pyrGroup);
  addBox(9.2, 1.35, 2.6, hieroMat, 0, 5.45, portalZ, pyrGroup);
  addBox(9.6, 0.32, 2.9, goldTrimMat, 0, 6.22, portalZ, pyrGroup);

  // 4 Carved Lotus Columns inside the Secret Chamber
  const colShaftGeo = track(new THREE.CylinderGeometry(0.46, 0.56, 4.3, 10));
  const colCapGeo = track(new THREE.CylinderGeometry(0.86, 0.48, 0.55, 10));
  for (const cx of [-4.6, 4.6]) {
    for (const cz of [-4.4, 4.2]) {
      const shaft = new THREE.Mesh(colShaftGeo, sandstoneMid);
      shaft.position.set(cx, chamberFloorRelY + 2.15, cz);
      pyrGroup.add(shaft);
      const cap = new THREE.Mesh(colCapGeo, goldTrimMat);
      cap.position.set(cx, chamberFloorRelY + 4.35, cz);
      pyrGroup.add(cap);
    }
  }

  // Torch-Lit Secret Chamber — 6 Animated Flickering Wall Torches + Warm Chamber PointLight
  const torchFlames: THREE.Mesh[] = [];
  const torchHolderGeo = track(new THREE.CylinderGeometry(0.08, 0.12, 0.72, 6));
  const torchFlameGeo = track(new THREE.ConeGeometry(0.18, 0.55, 7));
  const torchSpots: Array<[number, number, number]> = [
    [-6.9, chamberFloorRelY + 2.35, -3.5],
    [6.9, chamberFloorRelY + 2.35, -3.5],
    [-6.9, chamberFloorRelY + 2.35, 3.5],
    [6.9, chamberFloorRelY + 2.35, 3.5],
    [-2.5, chamberFloorRelY + 2.55, 11.5],
    [2.5, chamberFloorRelY + 2.55, 11.5],
    [-3.5, 3.6, portalZ + 1.15],
    [3.5, 3.6, portalZ + 1.15],
  ];
  for (const [tx, ty, tz] of torchSpots) {
    const holder = new THREE.Mesh(torchHolderGeo, brassMat);
    holder.position.set(tx, ty - 0.3, tz);
    pyrGroup.add(holder);
    const flame = new THREE.Mesh(torchFlameGeo, torchFlameMat);
    flame.position.set(tx, ty + 0.18, tz);
    pyrGroup.add(flame);
    torchFlames.push(flame);
  }

  // Warm emissive chamber ceiling lantern ring (zero extra PointLight shader uniform cost!)
  const chamberGlowRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(3.2, 0.12, 8, 24)),
    torchFlameMat
  );
  chamberGlowRing.rotation.x = Math.PI * 0.5;
  chamberGlowRing.position.set(0, chamberFloorRelY + 4.2, -0.8);
  pyrGroup.add(chamberGlowRing);

  // Golden Solar Relic Pedestal & Floating Rotating Sun Orb inside the Secret Chamber!
  addBox(2.6, 0.45, 2.6, sandstoneDark, 0, chamberFloorRelY + 0.22, -1.5, pyrGroup);
  addBox(1.5, 0.95, 1.5, hieroMat, 0, chamberFloorRelY + 0.9, -1.5, pyrGroup);
  addBox(1.7, 0.16, 1.7, goldTrimMat, 0, chamberFloorRelY + 1.42, -1.5, pyrGroup);

  const relicGroup = new THREE.Group();
  relicGroup.position.set(0, chamberFloorRelY + 2.35, -1.5);
  const relicCore = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.46, 0)), relicOrbMat);
  const relicRing1 = new THREE.Mesh(track(new THREE.TorusGeometry(0.76, 0.055, 8, 28)), goldTrimMat);
  const relicRing2 = new THREE.Mesh(track(new THREE.TorusGeometry(0.95, 0.04, 8, 28)), goldTrimMat);
  relicRing2.rotation.x = Math.PI * 0.42;
  relicGroup.add(relicCore, relicRing1, relicRing2);
  pyrGroup.add(relicGroup);

  // Flanking Golden Treasure Chests inside the chamber
  for (const chx of [-5.2, 5.2]) {
    addBox(1.35, 0.72, 0.85, timberMat, chx, chamberFloorRelY + 0.36, -5.6, pyrGroup);
    addBox(1.42, 0.18, 0.92, goldTrimMat, chx, chamberFloorRelY + 0.74, -5.6, pyrGroup);
  }

  // Grand Walkable East Processional Staircase (lx: 19.6 -> 2.8, climbing y: 0 -> 14.0m via InstancedMesh!)
  const stairSteps = 34;
  const stairStartX = 19.6;
  const stairEndX = 2.8;
  const stairSpan = stairStartX - stairEndX;
  const stepWidth = 5.4;
  const stairStepGeo = track(new THREE.BoxGeometry(stairSpan / stairSteps + 0.22, 0.42, stepWidth));
  const stairInst = new THREE.InstancedMesh(stairStepGeo, sandstoneLight, stairSteps);
  const stairStepColor = new THREE.Color();
  for (let s = 0; s < stairSteps; s++) {
    const f = (s + 0.5) / stairSteps;
    const sx = stairStartX - f * stairSpan;
    const sy = f * totalH;
    dummy.position.set(sx, sy - 0.18, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stairInst.setMatrixAt(s, dummy.matrix);
    stairStepColor.setHex(s % 2 === 0 ? 0xe5be7e : 0xcfa05c);
    stairInst.setColorAt(s, stairStepColor);
  }
  stairInst.computeBoundingSphere();
  pyrGroup.add(stairInst);
  // Sloped sandstone balustrades flanking the East Processional Staircase
  const stairSlopeLen = Math.hypot(stairSpan, totalH);
  const stairPitch = Math.atan2(totalH, stairSpan);
  for (const bz of [-stepWidth * 0.5 - 0.25, stepWidth * 0.5 + 0.25]) {
    const rail = addBox(stairSlopeLen + 0.5, 0.95, 0.46, sandstoneDark, (stairStartX + stairEndX) * 0.5, totalH * 0.5 + 0.35, bz, pyrGroup);
    rail.rotation.z = -stairPitch;
    // Lower guardian plinths at foot of stairs
    addBox(1.1, 1.65, 1.1, sandstoneDark, stairStartX + 0.45, 0.82, bz, pyrGroup);
    addBox(0.75, 0.4, 0.75, goldTrimMat, stairStartX + 0.45, 1.82, bz, pyrGroup);
  }

  // Golden Sun Observatory Pavilion atop the Pyramid Summit (y = 14.0m local -> 14.65m world!)
  addBox(6.8, 0.36, 6.8, chamberFloorMat, 0, totalH - 0.16, 0, pyrGroup);
  for (const sx of [-2.8, 2.8]) {
    for (const sz of [-2.8, 2.8]) {
      const p = new THREE.Mesh(track(new THREE.CylinderGeometry(0.24, 0.28, 3.6, 8)), sandstoneLight);
      p.position.set(sx, totalH + 1.8, sz);
      pyrGroup.add(p);
    }
  }
  // Hovering Gilded Pyramid Capstone above the open 4-pillar summit observatory
  const apexCapstone = new THREE.Mesh(track(new THREE.ConeGeometry(3.4, 2.6, 4)), goldTrimMat);
  apexCapstone.rotation.y = Math.PI * 0.25;
  apexCapstone.position.set(0, totalH + 4.9, 0);
  pyrGroup.add(apexCapstone);

  // Pyramid Solid Ground-Level Colliders (leave South Portal Corridor & Inner Secret Chamber & East Stair Entry open!)
  const px = DESERT_PYRAMID_CENTER.x;
  const pz = DESERT_PYRAMID_CENTER.z;
  // North massive wall collider
  colliders.push({
    id: 'desert_pyr_north',
    minX: px - DESERT_PYRAMID_BASE_HALF,
    maxX: px + DESERT_PYRAMID_BASE_HALF,
    minZ: pz - DESERT_PYRAMID_BASE_HALF,
    maxZ: pz - 7.3,
    minY: 0,
    maxY: 4.5,
  });
  // West massive wall collider
  colliders.push({
    id: 'desert_pyr_west',
    minX: px - DESERT_PYRAMID_BASE_HALF,
    maxX: px - 7.3,
    minZ: pz - 7.3,
    maxZ: pz + DESERT_PYRAMID_BASE_HALF,
    minY: 0,
    maxY: 4.5,
  });
  // East wall north & south wings (leaving East Processional Staircase lz: -3.0..+3.0 wide open!)
  colliders.push({
    id: 'desert_pyr_east_n',
    minX: px + 7.3,
    maxX: px + DESERT_PYRAMID_BASE_HALF,
    minZ: pz - 7.3,
    maxZ: pz - 3.1,
    minY: 0,
    maxY: 4.5,
  });
  colliders.push({
    id: 'desert_pyr_east_s',
    minX: px + 7.3,
    maxX: px + DESERT_PYRAMID_BASE_HALF,
    minZ: pz + 3.1,
    maxZ: pz + DESERT_PYRAMID_BASE_HALF,
    minY: 0,
    maxY: 4.5,
  });
  // South wall west & east wings (leaving South Portal Corridor lx: -2.8..+2.8 wide open!)
  colliders.push({
    id: 'desert_pyr_south_w',
    minX: px - 7.3,
    maxX: px - 2.9,
    minZ: pz + 7.3,
    maxZ: pz + DESERT_PYRAMID_BASE_HALF,
    minY: 0,
    maxY: 4.5,
  });
  colliders.push({
    id: 'desert_pyr_south_e',
    minX: px + 2.9,
    maxX: px + 7.3,
    minZ: pz + 7.3,
    maxZ: pz + DESERT_PYRAMID_BASE_HALF,
    minY: 0,
    maxY: 4.5,
  });

  // =========================================================================
  // 4. TWIN GOLD-CAPPED OBELISKS & ANCIENT SANDSTONE ARCHWAY AVENUE
  // =========================================================================
  const archX = DESERT_SPHINX_ARCH_POS.x;
  const archZ = DESERT_SPHINX_ARCH_POS.z;
  const archBaseY = groundHeightAt(archX, archZ);
  const archGroup = new THREE.Group();
  archGroup.position.set(archX, archBaseY, archZ);
  archGroup.rotation.y = Math.atan2(
    DESERT_PYRAMID_CENTER.x - DESERT_OASIS_CENTER.x,
    DESERT_PYRAMID_CENTER.z - DESERT_OASIS_CENTER.z
  );
  group.add(archGroup);

  for (const side of [-4.2, 4.2]) {
    // Tall carved sandstone obelisk with gilded pyramidion tip
    addBox(1.5, 0.8, 1.5, sandstoneDark, side, 0.4, 0, archGroup);
    const shaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.36, 0.62, 7.2, 4)), sandstoneLight);
    shaft.rotation.y = Math.PI * 0.25;
    shaft.position.set(side, 4.4, 0);
    archGroup.add(shaft);
    const tip = new THREE.Mesh(track(new THREE.ConeGeometry(0.52, 1.1, 4)), goldTrimMat);
    tip.rotation.y = Math.PI * 0.25;
    tip.position.set(side, 8.55, 0);
    archGroup.add(tip);
  }
  // Overhead stone temple arch lintel bridging the two obelisk pylons
  addBox(9.8, 0.85, 1.4, hieroMat, 0, 5.8, 0, archGroup);

  // =========================================================================
  // 5. STARLIT BEDOUIN NOMAD PAVILION TENT, RUGS & INTERACTIVE DESERT CAMPFIRE
  // =========================================================================
  const campX = DESERT_OASIS_CAMP_POS.x;
  const campZ = DESERT_OASIS_CAMP_POS.z;
  const campY = groundHeightAt(campX, campZ);
  const tentGroup = new THREE.Group();
  tentGroup.position.set(campX + 2.8, campY, campZ - 2.2);
  tentGroup.rotation.y = -0.42;
  group.add(tentGroup);

  // Woven desert carpets beneath the Bedouin pavilion
  addBox(6.8, 0.06, 5.2, rugMat, 0, 0.04, 0, tentGroup);
  // 4 corner poles + tall central brass-tipped tent mast
  const tentPoleGeo = track(new THREE.CylinderGeometry(0.07, 0.08, 3.1, 8));
  for (const tx of [-3.1, 3.1]) {
    for (const tz of [-2.3, 2.3]) {
      const pole = new THREE.Mesh(tentPoleGeo, timberMat);
      pole.position.set(tx, 1.55, tz);
      tentGroup.add(pole);
    }
  }
  const mast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.11, 4.3, 8)), brassMat);
  mast.position.set(0, 2.15, 0);
  tentGroup.add(mast);

  // Draped crimson & cream Bedouin canopy pyramid roof + valance panels
  const canopyCone = new THREE.Mesh(track(new THREE.ConeGeometry(4.4, 1.65, 4)), tentSilkCrimson);
  canopyCone.rotation.y = Math.PI * 0.25;
  canopyCone.position.set(0, 3.65, 0);
  tentGroup.add(canopyCone);
  addBox(6.5, 0.55, 0.12, tentSilkCream, 0, 2.75, -2.32, tentGroup);
  addBox(6.5, 0.55, 0.12, tentSilkCream, 0, 2.75, 2.32, tentGroup);
  addBox(0.12, 0.55, 4.7, tentSilkCream, -3.12, 2.75, 0, tentGroup);
  // Back wind-curtain wall & cozy floor cushions + spice amphorae
  addBox(6.2, 2.4, 0.12, tentSilkCrimson, 0, 1.25, -2.25, tentGroup);
  for (const cx of [-1.8, 0, 1.8]) {
    addBox(1.15, 0.28, 0.85, tentSilkCream, cx, 0.2, -1.35, tentGroup);
  }
  const potGeo = track(new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.28, 0.05),
      new THREE.Vector2(0.38, 0.42),
      new THREE.Vector2(0.18, 0.78),
      new THREE.Vector2(0.26, 0.92),
    ],
    10
  ));
  for (const [ax, az] of [[2.4, 1.6], [2.85, 1.25], [-2.5, 1.55]]) {
    const pot = new THREE.Mesh(potGeo, sandstoneDark);
    pot.position.set(ax, 0.04, az);
    tentGroup.add(pot);
  }
  // Hanging warm Moroccan lantern inside the tent
  const tentLantern = new THREE.Mesh(lanternBulbGeo, lanternGlowMat);
  tentLantern.position.set(0, 2.95, 0.85);
  tentGroup.add(tentLantern);
  lanternGlowMeshes.push(tentLantern);

  // Interactive Desert Campfire Ring
  const cfX = DESERT_CAMPFIRE_POS.x;
  const cfZ = DESERT_CAMPFIRE_POS.z;
  const cfY = groundHeightAt(cfX, cfZ);
  const fireGroup = new THREE.Group();
  fireGroup.position.set(cfX, cfY, cfZ);
  group.add(fireGroup);

  const stoneGeo = track(new THREE.DodecahedronGeometry(0.28, 0));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const st = new THREE.Mesh(stoneGeo, sandstoneDark);
    st.position.set(Math.cos(a) * 0.92, 0.16, Math.sin(a) * 0.92);
    fireGroup.add(st);
  }
  for (let l = 0; l < 4; l++) {
    const log = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.1, 1.25, 6)), timberMat);
    log.rotation.z = Math.PI * 0.5;
    log.rotation.y = (l / 4) * Math.PI;
    log.position.set(0, 0.16, 0);
    fireGroup.add(log);
  }
  const campfireFlameOuter = new THREE.Mesh(track(new THREE.ConeGeometry(0.42, 1.15, 7)), torchFlameMat);
  campfireFlameOuter.position.set(0, 0.65, 0);
  fireGroup.add(campfireFlameOuter);
  const campfireEmberHalo = new THREE.Mesh(
    track(new THREE.CircleGeometry(1.5, 16)),
    track(new THREE.MeshBasicMaterial({ color: 0xff8f2b, transparent: true, opacity: 0.28, depthWrite: false }))
  );
  campfireEmberHalo.rotation.x = -Math.PI * 0.5;
  campfireEmberHalo.position.set(0, 0.06, 0);
  fireGroup.add(campfireEmberHalo);
  let campfireLit = true;

  // =========================================================================
  // 6. ELEVATED DESERT SANDSTONE SKY HELIPAD (SKY TAXI STOP #6)
  // =========================================================================
  const hx = DESERT_HELIPAD_POS.x;
  const hz = DESERT_HELIPAD_POS.z;
  const hy = DESERT_HELIPAD_POS.y;
  const heliTex = track(createHelipadSandstoneTexture());
  const heliTopMat = track(new THREE.MeshStandardMaterial({ map: heliTex, roughness: 0.72, metalness: 0.08 }));
  const heliBase = new THREE.Mesh(track(new THREE.CylinderGeometry(6.3, 7.1, hy - 0.2, 24)), sandstoneMid);
  heliBase.position.set(hx, (hy + 0.2) * 0.5, hz);
  heliBase.receiveShadow = true;
  group.add(heliBase);

  const heliTopDisc = new THREE.Mesh(track(new THREE.CylinderGeometry(6.25, 6.25, 0.12, 24)), heliTopMat);
  heliTopDisc.position.set(hx, hy - 0.04, hz);
  heliTopDisc.receiveShadow = true;
  group.add(heliTopDisc);

  // Walkable sandstone ramp on north edge of Desert Helipad (dhz: -10.5..-6.0)
  const rampMesh = addBox(4.4, 0.45, 4.9, sandstoneLight, hx, (0.58 + hy) * 0.5 - 0.18, hz - 8.2);
  rampMesh.rotation.x = Math.atan2(hy - 0.58, 4.5);

  // Glowing golden perimeter beacons around the Desert Helipad
  for (let b = 0; b < 8; b++) {
    const ba = (b / 8) * Math.PI * 2;
    const beacon = new THREE.Mesh(track(new THREE.CylinderGeometry(0.14, 0.18, 0.34, 8)), lanternGlowMat);
    beacon.position.set(hx + Math.cos(ba) * 5.95, hy + 0.17, hz + Math.sin(ba) * 5.95);
    group.add(beacon);
    lanternGlowMeshes.push(beacon);
  }

  // =========================================================================
  // 7. SCATTERED ANCIENT BROKEN COLUMNS & DESERT SANDSTONE BOULDERS (Instanced!)
  // =========================================================================
  const boulderGeo = track(new THREE.DodecahedronGeometry(1.15, 0));
  const boulderInst = new THREE.InstancedMesh(boulderGeo, sandstoneMid, 42);
  const bColor = new THREE.Color();
  let placedBoulders = 0;
  let bAttempts = 0;
  while (placedBoulders < 42 && bAttempts < 420) {
    bAttempts++;
    const bx = -152 - rand() * 165;
    const bz = 34 + rand() * 185;
    if (isDesertClearingAt(bx, bz)) continue;
    const by = groundHeightAt(bx, bz);
    if (by < WATER_LEVEL + 0.35) continue;
    const sx = 0.7 + rand() * 1.9;
    const sy = 0.45 + rand() * 1.1;
    const sz = 0.7 + rand() * 1.9;
    dummy.position.set(bx, by + sy * 0.35, bz);
    dummy.rotation.set(rand() * 0.6, rand() * Math.PI * 2, rand() * 0.6);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    boulderInst.setMatrixAt(placedBoulders, dummy.matrix);
    bColor.setHex(placedBoulders % 3 === 0 ? 0xd5a460 : placedBoulders % 3 === 1 ? 0xbc8848 : 0xe0b97b);
    boulderInst.setColorAt(placedBoulders, bColor);
    placedBoulders++;
  }
  boulderInst.count = placedBoulders;
  boulderInst.computeBoundingSphere();
  group.add(boulderInst);

  // 8 Half-Buried Ruined Sandstone Columns rising artistically out of the surrounding dunes
  const ruinColPositions: Array<[number, number, number, number]> = [
    [-228, 118, 3.8, 0.18],
    [-234, 122, 2.9, -0.22],
    [-258, 126, 4.2, 0.14],
    [-265, 155, 3.4, -0.25],
    [-232, 168, 4.6, 0.11],
    [-212, 152, 3.1, -0.15],
    [-176, 128, 3.6, 0.19],
    [-196, 86, 3.2, -0.18],
  ];
  for (const [rx, rz, rh, tilt] of ruinColPositions) {
    const ry = groundHeightAt(rx, rz);
    const col = new THREE.Mesh(track(new THREE.CylinderGeometry(0.54, 0.62, rh, 10)), sandstoneLight);
    col.position.set(rx, ry + rh * 0.42, rz);
    col.rotation.z = tilt;
    col.rotation.x = tilt * 0.6;
    group.add(col);
  }

  // =========================================================================
  // 8. WIND-DRIFTING GOLDEN DESERT SAND-SHIMMER PARTICLES (Zero GC per frame!)
  // =========================================================================
  const dustCount = 180;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustPhases = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const dx = -150 - rand() * 145;
    const dz = 50 + rand() * 145;
    dustPositions[i * 3] = dx;
    dustPositions[i * 3 + 1] = groundHeightAt(dx, dz) + 0.6 + rand() * 8.5;
    dustPositions[i * 3 + 2] = dz;
    dustPhases[i] = rand() * Math.PI * 2;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  const dustPosAttr = new THREE.BufferAttribute(dustPositions, 3);
  dustGeo.setAttribute('position', dustPosAttr);
  const dustMat = track(
    new THREE.PointsMaterial({
      color: 0xffdf9e,
      size: 0.42,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
  );
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.frustumCulled = false;
  group.add(dustPoints);

  // =========================================================================
  // 9. INTERACTABLES (Campfire, Bedouin Tent, Relic Altar, Pyramid Summit, Desert Helipad)
  // =========================================================================
  interactables.push(
    {
      id: 'desert_oasis_campfire',
      kind: 'camp_fire',
      label: 'Toggle Desert Campfire',
      sublabel: 'Thar Oasis Starlit Hearth',
      x: cfX,
      y: cfY,
      z: cfZ,
      radius: 4.5,
      locationId: 'thar_desert_oasis',
    },
    {
      id: 'desert_bedouin_tent',
      kind: 'camp_sleep',
      label: 'Rest in Bedouin Pavilion (Starlit Night)',
      sublabel: 'Thar Nomad Camp · Watch the desert stars',
      x: campX + 2.8,
      y: campY,
      z: campZ - 0.8,
      radius: 5.0,
      locationId: 'thar_desert_oasis',
    },
    {
      id: 'desert_pyramid_relic',
      kind: 'viewpoint',
      label: 'Inspect Golden Solar Relic',
      sublabel: 'Secret Torch-Lit Pyramid Chamber',
      x: DESERT_PYRAMID_RELIC_POS.x,
      y: DESERT_PYRAMID_CHAMBER_Y,
      z: DESERT_PYRAMID_RELIC_POS.z + 1.8,
      radius: 4.8,
      locationId: 'thar_pyramid_ruins',
    },
    {
      id: 'desert_pyramid_summit_view',
      kind: 'viewpoint',
      label: 'Admire Thar Golden Dunes Summit',
      sublabel: '14.65m Grand Pyramid Sun Observatory',
      x: DESERT_PYRAMID_CENTER.x,
      y: DESERT_PYRAMID_SUMMIT_Y,
      z: DESERT_PYRAMID_CENTER.z,
      radius: 4.5,
      locationId: 'thar_pyramid_ruins',
    },
    {
      id: 'desert_helipad_launch',
      kind: 'sky_explorer_fly',
      label: 'Launch SSJ Sky Explorer from Desert Pad',
      sublabel: 'Thar Oasis Helipad · Fly over dunes & pyramid',
      x: DESERT_HELIPAD_POS.x,
      y: DESERT_HELIPAD_POS.y,
      z: DESERT_HELIPAD_POS.z,
      radius: 6.8,
      locationId: 'thar_desert_oasis',
    },
    {
      id: 'desert_pyramid_portal_sign',
      kind: 'info_board',
      label: 'Read Ancient Pyramid Inscription',
      sublabel: 'South Chamber Portal & East Stairway Guide',
      x: DESERT_PYRAMID_SOUTH_PORTAL.x + 3.5,
      y: DESERT_PYRAMID_BASE_Y,
      z: DESERT_PYRAMID_SOUTH_PORTAL.z + 1.4,
      radius: 4.5,
      locationId: 'thar_pyramid_ruins',
    }
  );

  scene.add(group);

  return {
    group,
    colliders,
    interactables,
    setCampfireLit(lit: boolean) {
      campfireLit = lit;
      campfireFlameOuter.visible = lit;
      campfireEmberHalo.visible = lit;
    },
    update(elapsed: number, dt: number, lanternStrength: number, playerX: number, playerZ: number) {
      // Animate floating Golden Solar Relic inside the Secret Chamber
      relicGroup.position.y = chamberFloorRelY + 2.35 + Math.sin(elapsed * 2.1) * 0.16;
      relicCore.rotation.y = elapsed * 1.1;
      relicRing1.rotation.z = elapsed * 0.85;
      relicRing1.rotation.x = Math.sin(elapsed * 0.6) * 0.45;
      relicRing2.rotation.y = -elapsed * 0.72;

      // Subtle floating pulse on Golden Pyramid Summit Capstone
      apexCapstone.position.y = totalH + 4.85 + Math.sin(elapsed * 1.2) * 0.12;

      // Flicker Secret Chamber torches & Desert Campfire
      for (let i = 0; i < torchFlames.length; i++) {
        const f = 0.85 + 0.28 * Math.sin(elapsed * 9.5 + i * 2.1);
        torchFlames[i].scale.set(0.92 + f * 0.1, f, 0.92 + f * 0.1);
      }
      torchFlameMat.emissiveIntensity = 1.9 + Math.sin(elapsed * 7.4) * 0.45;

      if (campfireLit) {
        const cfFlicker = 0.88 + 0.24 * Math.sin(elapsed * 11.2);
        campfireFlameOuter.scale.set(1, cfFlicker, 1);
      }

      // Warm lantern glow strength scales cleanly with twilight/night
      lanternGlowMat.emissiveIntensity = 0.75 + lanternStrength * 1.45;

      // Subtle shimmer on Emerald Oasis water
      oasisRingMesh.rotation.y = elapsed * 0.05;
      oasisRingMat.opacity = 0.16 + 0.08 * Math.sin(elapsed * 1.8);

      // Drift golden desert sand shimmer particles only when player is reasonably close to western desert
      const nearDesert = playerX < -105 && playerZ > 15;
      dustPoints.visible = nearDesert;
      if (nearDesert) {
        const step = Math.min(dt, 0.05);
        for (let i = 0; i < dustCount; i++) {
          let x = dustPositions[i * 3] + step * 3.2;
          const z = dustPositions[i * 3 + 2] + Math.sin(elapsed * 0.9 + dustPhases[i]) * step * 0.6;
          if (x > -148) x = -295;
          dustPositions[i * 3] = x;
          dustPositions[i * 3 + 2] = z;
        }
        dustPosAttr.needsUpdate = true;
      }
    },
    dispose() {
      scene.remove(group);
      for (const d of disposables) d.dispose();
    },
  };
}
