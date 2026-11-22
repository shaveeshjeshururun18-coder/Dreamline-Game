import * as THREE from 'three';
import type { CamperState, InteractableItem } from '../game/types';
import {
  ENCHANTED_FOREST_CENTER,
  ENCHANTED_POND_CENTER,
  ENCHANTED_POND_RADIUS,
  groundHeightAt,
  type AabbCollider,
} from '../game/terrain';

const PALETTE = {
  mainBodyPink: 0xe8add7,
  lowerBubblegum: 0xd96ea8,
  roofPastelPink: 0xf4c9e8,
  windowFrame: 0x7e6c9e,
  sideTrimPink: 0xe480b8,
  bumperPink: 0xebb7de,
  mirrorPink: 0xdf76b2,
  chromeSilver: 0xd8dce8,
  glassTint: 0xf6dcf4,
  interiorCream: 0xf8edf3,
  interiorWood: 0xc99c8c,
  interiorLav: 0xb89ad1,
  tireRubber: 0x352c44,
  hubcapCream: 0xf2e4f0,
  headlightWarm: 0xfff1bf,
  indicatorAmber: 0xffb35c,
  taillightRed: 0xff6b8b,
};

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw * 0.95, hh * 0.95);
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

function createRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevelSize?: number
): THREE.ExtrudeGeometry {
  const b = bevelSize !== undefined ? bevelSize : Math.min(radius * 0.5, 0.08);
  const shape = createRoundedRectShape(
    Math.max(0.02, width - b * 2),
    Math.max(0.02, height - b * 2),
    Math.max(0.01, radius - b)
  );
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, depth - b * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: b,
    bevelThickness: b,
    curveSegments: 8,
  });
  geom.center();
  return geom;
}

function createLicensePlateTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8eff5';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#9c84b8';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 80);
  ctx.fillStyle = '#c4a6d8';
  [
    [24, 24],
    [232, 24],
    [24, 72],
    [232, 72],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#5f467a';
  ctx.font = 'italic bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDashboardGaugeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#4c3a66';
  ctx.fillRect(0, 0, 512, 160);
  const dials = [
    { cx: 165, cy: 80, r: 58, label: 'KM/H' },
    { cx: 345, cy: 80, r: 46, label: 'COZY' },
  ];
  dials.forEach((d) => {
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#d9dceb';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fdf4fa';
    ctx.fill();
    for (let i = 0; i <= 10; i++) {
      const ang = Math.PI * 0.78 + (i / 10) * Math.PI * 1.44;
      ctx.strokeStyle = i >= 8 ? '#e26ea6' : '#7b689c';
      ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(d.cx + Math.cos(ang) * (d.r - 12), d.cy + Math.sin(ang) * (d.r - 12));
      ctx.lineTo(d.cx + Math.cos(ang) * (d.r - 4), d.cy + Math.sin(ang) * (d.r - 4));
      ctx.stroke();
    }
    ctx.strokeStyle = '#e0629e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(d.cx, d.cy);
    ctx.lineTo(d.cx - d.r * 0.55, d.cy - d.r * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#685086';
    ctx.fill();
    ctx.fillStyle = '#8b77ab';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, d.cx, d.cy + d.r * 0.56);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWaterfallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, 'rgba(145, 130, 255, 0.15)');
  grad.addColorStop(0.25, 'rgba(165, 225, 255, 0.85)');
  grad.addColorStop(0.5, 'rgba(225, 240, 255, 0.95)');
  grad.addColorStop(0.75, 'rgba(180, 165, 255, 0.85)');
  grad.addColorStop(1, 'rgba(145, 130, 255, 0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 85; i++) {
    const x = ((i * 53) % 248);
    const y = ((i * 97) % 480);
    const h = 40 + (i % 5) * 26;
    const w = 2 + (i % 4) * 1.4;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(182, 232, 255, 0.35)';
    ctx.fillRect(x, y, w, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGlowSpriteTexture(innerColor: string, outerColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, innerColor);
  g.addColorStop(0.35, outerColor);
  g.addColorStop(1, 'rgba(255, 180, 110, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface EnchantedForestWorld {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  update: (
    camper: CamperState,
    elapsed: number,
    dt: number,
    playerX: number,
    playerZ: number,
    lanternStrength: number
  ) => void;
  getDriverSeatTransform: () => { position: THREE.Vector3; heading: number };
  getCompanionSeatTransform: () => { position: THREE.Vector3; heading: number };
  getCamperViewTransform: (
    viewMode: 'window' | 'cabin' | 'exterior'
  ) => { position: THREE.Vector3; lookAt: THREE.Vector3 };
  dispose: () => void;
}

/**
 * Builds the Mayavanam Enchanted Forest Clearing (wisteria trees, hanging lanterns,
 * tree swing, glowing violet-cyan waterfall & pink lotus pond, picnic blanket, camp cat, fireflies)
 * AND "Olga" — the detailed Pastel Pink Vintage Camper Van waiting for the user to drive!
 */
export function buildEnchantedForestWorld(isSoftwareGl: boolean): EnchantedForestWorld {
  const group = new THREE.Group();
  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const cx = ENCHANTED_FOREST_CENTER.x;
  const cz = ENCHANTED_FOREST_CENTER.z;

  const makeMesh = (
    geom: THREE.BufferGeometry,
    mat: THREE.Material,
    cast = true,
    receive = true
  ) => {
    disposables.push(geom);
    const m = new THREE.Mesh(geom, mat);
    m.castShadow = cast && !isSoftwareGl;
    m.receiveShadow = receive;
    return m;
  };

  // =========================================================================
  // 1. ENCHANTED FOREST ENVIRONMENT (Mayavanam Clearing)
  // =========================================================================
  const envGroup = new THREE.Group();
  group.add(envGroup);

  const haloTex = createGlowSpriteTexture('rgba(255,235,180,0.9)', 'rgba(255,175,90,0.32)');
  const aoShadowTex = createGlowSpriteTexture('rgba(24,14,42,0.72)', 'rgba(24,14,42,0.28)');
  disposables.push(haloTex, aoShadowTex);

  // Soft mossy twilight meadow clearing floor disc so the glade pops visually
  const clearingMat = new THREE.MeshStandardMaterial({
    color: 0x456b52,
    roughness: 0.92,
    metalness: 0.02,
  });
  disposables.push(clearingMat);
  const clearingDisc = makeMesh(new THREE.CircleGeometry(24, 36), clearingMat, false, true);
  clearingDisc.rotation.x = -Math.PI / 2;
  clearingDisc.position.set(cx, groundHeightAt(cx, cz) + 0.03, cz);
  envGroup.add(clearingDisc);

  // Stepping Stones curving gently around the Enchanted Clearing and leading east toward Nila Gramam
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa69bb8, roughness: 0.88 });
  disposables.push(stoneMat);
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const sx = cx + 10 + t * 44;
    const sz = cz - 2 - Math.sin(t * Math.PI) * 7 - t * 10;
    const sy = groundHeightAt(sx, sz);
    const st = makeMesh(new THREE.CylinderGeometry(0.85, 0.95, 0.08, 8), stoneMat, false, true);
    st.scale.set(1.25, 1, 0.82);
    st.rotation.y = i * 0.7;
    st.position.set(sx, sy + 0.03, sz);
    envGroup.add(st);
  }

  // Cozy Picnic Area (lavender blanket, cushion, wooden table, glowing lantern)
  const picnicX = cx - 4.2;
  const picnicZ = cz + 2.4;
  const picnicY = groundHeightAt(picnicX, picnicZ);
  const picnicGroup = new THREE.Group();
  picnicGroup.position.set(picnicX, picnicY, picnicZ);

  const blanketMat = new THREE.MeshStandardMaterial({ color: 0xdcbde8, roughness: 0.92 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf6e6ee, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xc99c84, roughness: 0.8 });
  const campLanternMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: 0xffb85e,
    emissiveIntensity: 1.85,
  });
  disposables.push(blanketMat, cushionMat, woodMat, campLanternMat);

  const blanket = makeMesh(createRoundedBox(2.6, 0.05, 2.3, 0.14, 0.015), blanketMat, false, true);
  blanket.position.y = 0.03;
  blanket.rotation.y = 0.25;
  picnicGroup.add(blanket);

  const cushion = makeMesh(new THREE.CylinderGeometry(0.42, 0.44, 0.18, 14), cushionMat);
  cushion.position.set(-0.78, 0.12, 0.45);
  picnicGroup.add(cushion);

  const tableTop = makeMesh(createRoundedBox(0.84, 0.06, 0.58, 0.06, 0.015), woodMat);
  tableTop.position.set(0.62, 0.34, -0.35);
  tableTop.rotation.y = -0.32;
  picnicGroup.add(tableTop);

  const campLantern = makeMesh(new THREE.CylinderGeometry(0.11, 0.13, 0.28, 8), campLanternMat);
  campLantern.position.set(-0.08, 0.18, -0.18);
  picnicGroup.add(campLantern);

  const picnicLight = new THREE.PointLight(0xffcb85, 1.8, 14, 1.6);
  picnicLight.position.set(-0.08, 0.65, -0.18);
  picnicGroup.add(picnicLight);

  envGroup.add(picnicGroup);
  colliders.push({
    id: 'enchanted_picnic',
    minX: picnicX - 1.35,
    maxX: picnicX + 1.35,
    minZ: picnicZ - 1.25,
    maxZ: picnicZ + 1.25,
  });

  // Glowing Violet-Cyan Waterfall Cliff & Pink Lotus Pond
  const px = ENCHANTED_POND_CENTER.x;
  const pz = ENCHANTED_POND_CENTER.z;
  const pondGroup = new THREE.Group();
  envGroup.add(pondGroup);

  const pondWaterMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d8f,
    emissive: 0x2a3b7d,
    emissiveIntensity: 0.65,
    roughness: 0.14,
    metalness: 0.35,
    transparent: true,
    opacity: 0.9,
  });
  const cliffRockMat = new THREE.MeshStandardMaterial({ color: 0x4b4269, roughness: 0.88 });
  const wfTex = createWaterfallTexture();
  const wfMat = new THREE.MeshBasicMaterial({
    map: wfTex,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lotusMat = new THREE.MeshStandardMaterial({
    color: 0xffa6d8,
    emissive: 0xe85ca8,
    emissiveIntensity: 0.72,
    roughness: 0.38,
  });
  const padMat = new THREE.MeshStandardMaterial({ color: 0x38695a, roughness: 0.75 });
  disposables.push(pondWaterMat, cliffRockMat, wfTex, wfMat, lotusMat, padMat);

  const pondWater = makeMesh(
    new THREE.CircleGeometry(ENCHANTED_POND_RADIUS, 30),
    pondWaterMat,
    false,
    true
  );
  pondWater.rotation.x = -Math.PI / 2;
  pondWater.position.set(px, -0.45, pz);
  pondGroup.add(pondWater);

  const cliffSpecs: Array<[number, number, number, number, number, number]> = [
    [-5.8, 2.2, -7.2, 4.4, 5.4, 3.6],
    [0.0, 3.2, -8.5, 5.2, 7.2, 3.8],
    [5.6, 2.3, -6.8, 4.2, 5.6, 3.4],
    [-8.5, 1.0, -2.2, 3.0, 3.2, 3.0],
  ];
  cliffSpecs.forEach(([rx, ry, rz, sx, sy, sz], i) => {
    const rock = makeMesh(new THREE.DodecahedronGeometry(1, 1), cliffRockMat);
    rock.scale.set(sx, sy, sz);
    rock.position.set(px + rx, ry, pz + rz);
    pondGroup.add(rock);
    colliders.push({
      id: `ench_cliff_${i}`,
      minX: px + rx - sx * 0.75,
      maxX: px + rx + sx * 0.75,
      minZ: pz + rz - sz * 0.75,
      maxZ: pz + rz + sz * 0.75,
    });
  });

  const mainFall = makeMesh(new THREE.PlaneGeometry(2.6, 7.4), wfMat, false, false);
  mainFall.position.set(px, 3.0, pz - 6.0);
  mainFall.rotation.y = 0.25;
  pondGroup.add(mainFall);

  const sideFall = makeMesh(new THREE.PlaneGeometry(1.4, 5.0), wfMat, false, false);
  sideFall.position.set(px - 4.8, 1.8, pz - 5.1);
  sideFall.rotation.y = 0.52;
  pondGroup.add(sideFall);

  const wfLight = new THREE.PointLight(0x88b8ff, 2.4, 22, 1.5);
  wfLight.position.set(px, 1.5, pz - 4.6);
  pondGroup.add(wfLight);

  const lotusFlowers: Array<{ group: THREE.Group; baseY: number; phase: number }> = [];
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 1.6 - 0.5;
    const dist = 2.0 + (i % 4) * 1.45;
    const lx = px + Math.cos(ang) * dist;
    const lz = pz + Math.sin(ang) * dist;
    const lg = new THREE.Group();
    lg.position.set(lx, -0.41, lz);
    const pad = makeMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 10), padMat, false, true);
    lg.add(pad);
    for (let p = 0; p < 6; p++) {
      const pa = (p / 6) * Math.PI * 2;
      const petal = makeMesh(new THREE.ConeGeometry(0.11, 0.26, 5), lotusMat, false, false);
      petal.position.set(Math.cos(pa) * 0.14, 0.08, Math.sin(pa) * 0.14);
      petal.rotation.z = -Math.cos(pa) * 0.7;
      petal.rotation.x = Math.sin(pa) * 0.7;
      lg.add(petal);
    }
    pondGroup.add(lg);
    lotusFlowers.push({ group: lg, baseY: -0.41, phase: i * 0.9 });
  }

  // Stylized Enchanted Wisteria Trees with Hanging Lanterns & Hero Tree Swing
  const matBark = new THREE.MeshStandardMaterial({ color: 0x5c4658, roughness: 0.92 });
  const matLeaf1 = new THREE.MeshStandardMaterial({ color: 0x265949, roughness: 0.85 });
  const matLeaf2 = new THREE.MeshStandardMaterial({ color: 0x357557, roughness: 0.82 });
  const matWisteria = new THREE.MeshStandardMaterial({
    color: 0xc98ee8,
    emissive: 0x7643a8,
    emissiveIntensity: 0.36,
    roughness: 0.68,
  });
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffebb8,
    emissive: 0xffb357,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd9b89c, roughness: 0.9 });
  disposables.push(matBark, matLeaf1, matLeaf2, matWisteria, lanternGlassMat, ropeMat);

  const lanterns: Array<{ group: THREE.Group; phase: number }> = [];
  const treeSpots = [
    { x: cx - 8.2, z: cz - 2.4, scale: 1.45, wisteria: true, lantern: true, swing: true },
    { x: cx + 10.6, z: cz - 5.6, scale: 1.32, wisteria: true, lantern: true, swing: false },
    { x: cx + 1.2, z: cz - 12.0, scale: 1.4, wisteria: true, lantern: true, swing: false },
    { x: cx + 12.8, z: cz + 8.0, scale: 1.26, wisteria: false, lantern: true, swing: false },
    { x: cx - 10.2, z: cz + 10.6, scale: 1.34, wisteria: true, lantern: true, swing: false },
    { x: cx + 4.5, z: cz + 14.5, scale: 1.38, wisteria: true, lantern: false, swing: false },
    { x: cx - 16.5, z: cz + 3.0, scale: 1.4, wisteria: true, lantern: true, swing: false },
    { x: cx - 6.0, z: cz - 16.5, scale: 1.5, wisteria: true, lantern: false, swing: false },
  ];

  treeSpots.forEach((cfg, idx) => {
    const tg = new THREE.Group();
    const ty = groundHeightAt(cfg.x, cfg.z);
    tg.position.set(cfg.x, ty, cfg.z);
    const s = cfg.scale;

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.3, 0),
      new THREE.Vector3(0.24 * s, 2.2 * s, 0.1 * s),
      new THREE.Vector3(-0.14 * s, 4.8 * s, -0.14 * s),
    ]);
    const trunk = makeMesh(new THREE.TubeGeometry(trunkCurve, 8, 0.42 * s, 7, false), matBark);
    tg.add(trunk);

    const boughCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1 * s, 3.2 * s, 0),
      new THREE.Vector3(1.5 * s, 4.1 * s, 0.6 * s),
      new THREE.Vector3(2.8 * s, 4.3 * s, 0.9 * s),
    ]);
    const bough = makeMesh(new THREE.TubeGeometry(boughCurve, 6, 0.18 * s, 6, false), matBark);
    tg.add(bough);

    const puffs: Array<[number, number, number, number, THREE.Material]> = [
      [0, 5.4, 0, 2.3, matLeaf1],
      [1.8, 4.9, 0.8, 1.85, matLeaf2],
      [-1.5, 4.8, -0.6, 1.75, matLeaf1],
      [0.4, 6.2, -0.5, 1.65, matLeaf2],
      [-0.6, 5.1, 1.4, 1.55, matLeaf2],
    ];
    puffs.forEach(([pxo, pyo, pzo, pr, mat]) => {
      const puff = makeMesh(new THREE.IcosahedronGeometry(pr * s, 1), mat);
      puff.scale.y = 0.72;
      puff.position.set(pxo * s, pyo * s, pzo * s);
      tg.add(puff);
    });

    if (cfg.wisteria) {
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + 0.3;
        const dist = (1.2 + (i % 2) * 0.9) * s;
        const vineLen = (1.1 + (i % 3) * 0.35) * s;
        const vine = makeMesh(new THREE.ConeGeometry(0.24 * s, vineLen, 6), matWisteria, false, false);
        vine.rotation.x = Math.PI;
        vine.position.set(Math.cos(ang) * dist, 4.0 * s - vineLen * 0.35, Math.sin(ang) * dist);
        tg.add(vine);
      }
    }

    if (cfg.lantern) {
      const lGroup = new THREE.Group();
      lGroup.position.set(2.1 * s, 3.65 * s, 0.75 * s);
      tg.add(lGroup);
      const cord = makeMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 5), matBark, false, false);
      cord.position.y = 0.42;
      lGroup.add(cord);
      const lGlass = makeMesh(new THREE.CylinderGeometry(0.16, 0.13, 0.32, 6), lanternGlassMat, false, false);
      lGroup.add(lGlass);
      const cap = makeMesh(new THREE.ConeGeometry(0.21, 0.14, 6), matBark, false, false);
      cap.position.y = 0.2;
      lGroup.add(cap);

      const haloMat = new THREE.SpriteMaterial({
        map: haloTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      disposables.push(haloMat);
      const halo = new THREE.Sprite(haloMat);
      halo.scale.set(1.85, 1.85, 1);
      lGroup.add(halo);
      lanterns.push({ group: lGroup, phase: idx * 1.1 });
    }

    if (cfg.swing) {
      const swingGroup = new THREE.Group();
      swingGroup.position.set(1.7 * s, 4.1 * s, 0.65 * s);
      tg.add(swingGroup);
      [-0.45, 0.45].forEach((rx) => {
        const rope = makeMesh(new THREE.CylinderGeometry(0.018, 0.018, 3.1 * s, 5), ropeMat, false, false);
        rope.position.set(rx, -1.55 * s, 0);
        swingGroup.add(rope);
      });
      const seat = makeMesh(createRoundedBox(1.05, 0.07, 0.36, 0.04, 0.015), woodMat);
      seat.position.set(0, -3.1 * s, 0);
      swingGroup.add(seat);
    }

    envGroup.add(tg);
    colliders.push({
      id: `ench_tree_${idx}`,
      minX: cfg.x - 0.75 * s,
      maxX: cfg.x + 0.75 * s,
      minZ: cfg.z - 0.75 * s,
      maxZ: cfg.z + 0.75 * s,
    });
  });

  // Lavender Lupine Wildflowers & Glowing Pastel Mushrooms
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xd4a4f5,
    emissive: 0x6f4799,
    emissiveIntensity: 0.3,
    roughness: 0.7,
  });
  const mushCapMat = new THREE.MeshStandardMaterial({
    color: 0xdf78aa,
    emissive: 0x702d56,
    emissiveIntensity: 0.32,
    roughness: 0.55,
  });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xf4e8f0, roughness: 0.8 });
  disposables.push(flowerMat, mushCapMat, stemMat);

  for (let i = 0; i < 42; i++) {
    const ang = (i / 42) * Math.PI * 2 + (i % 3) * 0.2;
    const dist = 7.5 + (i % 7) * 2.4;
    const fx = cx + Math.cos(ang) * dist;
    const fz = cz + Math.sin(ang) * dist;
    if (Math.hypot(fx - px, fz - pz) < ENCHANTED_POND_RADIUS + 0.9) continue;
    const fy = groundHeightAt(fx, fz);
    if (i % 4 === 0) {
      const mg = new THREE.Group();
      mg.position.set(fx, fy, fz);
      const sc = 0.75 + (i % 3) * 0.28;
      mg.scale.setScalar(sc);
      const st = makeMesh(new THREE.CylinderGeometry(0.06, 0.09, 0.24, 6), stemMat, false, false);
      st.position.y = 0.12;
      mg.add(st);
      const cap = makeMesh(
        new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mushCapMat,
        false,
        false
      );
      cap.position.y = 0.2;
      mg.add(cap);
      envGroup.add(mg);
    } else {
      const h = 0.45 + (i % 4) * 0.16;
      const spire = makeMesh(new THREE.ConeGeometry(0.11, h, 5), flowerMat, false, false);
      spire.position.set(fx, fy + h / 2, fz);
      envGroup.add(spire);
    }
  }

  // Adorable Fluffy Cream & Cocoa Camp Cat right beside the picnic area!
  const catHomeX = cx + 0.9;
  const catHomeZ = cz + 5.6;
  const campCatGroup = new THREE.Group();
  campCatGroup.position.set(catHomeX, groundHeightAt(catHomeX, catHomeZ), catHomeZ);
  const matCatCream = new THREE.MeshStandardMaterial({ color: 0xf7e1d8, roughness: 0.8 });
  const matCatCocoa = new THREE.MeshStandardMaterial({ color: 0x735252, roughness: 0.8 });
  disposables.push(matCatCream, matCatCocoa);

  const catBody = makeMesh(new THREE.SphereGeometry(0.24, 12, 10), matCatCream);
  catBody.scale.set(0.85, 0.82, 1.25);
  catBody.position.set(0, 0.25, 0);
  campCatGroup.add(catBody);

  [
    [-0.11, 0.16],
    [0.11, 0.16],
    [-0.11, -0.16],
    [0.11, -0.16],
  ].forEach(([pwx, pwz]) => {
    const paw = makeMesh(new THREE.CylinderGeometry(0.055, 0.05, 0.16, 7), matCatCocoa, false, false);
    paw.position.set(pwx, 0.08, pwz);
    campCatGroup.add(paw);
  });

  const catHead = makeMesh(new THREE.SphereGeometry(0.18, 12, 10), matCatCream);
  catHead.position.set(0, 0.4, 0.24);
  campCatGroup.add(catHead);

  const catMuzzle = makeMesh(new THREE.SphereGeometry(0.11, 10, 8), matCatCocoa, false, false);
  catMuzzle.scale.set(1.1, 0.85, 0.7);
  catMuzzle.position.set(0, 0.38, 0.36);
  campCatGroup.add(catMuzzle);

  [-0.11, 0.11].forEach((ex) => {
    const ear = makeMesh(new THREE.ConeGeometry(0.065, 0.12, 5), matCatCocoa, false, false);
    ear.position.set(ex, 0.55, 0.22);
    ear.rotation.z = ex > 0 ? -0.25 : 0.25;
    campCatGroup.add(ear);
  });

  const catTailPivot = new THREE.Group();
  catTailPivot.position.set(0, 0.3, -0.26);
  campCatGroup.add(catTailPivot);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.16, -0.12),
    new THREE.Vector3(0, 0.34, -0.06),
  ]);
  const catTail = makeMesh(new THREE.TubeGeometry(tailCurve, 10, 0.055, 7, false), matCatCocoa);
  catTailPivot.add(catTail);
  envGroup.add(campCatGroup);

  // Forest fireflies in Mayavanam are now rendered by the unified twilight/night clear-weather firefliesWorld shader system.

  // =========================================================================
  // 2. "OLGA" — PASTEL PINK VINTAGE CAMPER VAN (Full Drivable 3D Vehicle!)
  // =========================================================================
  const vanRoot = new THREE.Group();
  const chassis = new THREE.Group();
  vanRoot.add(chassis);
  group.add(vanRoot);

  const matBody = new THREE.MeshStandardMaterial({
    color: PALETTE.mainBodyPink,
    roughness: 0.36,
    metalness: 0.08,
  });
  const matLowerPink = new THREE.MeshStandardMaterial({
    color: PALETTE.lowerBubblegum,
    roughness: 0.34,
    metalness: 0.08,
  });
  const matRoof = new THREE.MeshStandardMaterial({
    color: PALETTE.roofPastelPink,
    roughness: 0.32,
    metalness: 0.06,
  });
  const matFrame = new THREE.MeshStandardMaterial({
    color: PALETTE.windowFrame,
    roughness: 0.48,
    metalness: 0.1,
  });
  const matTrim = new THREE.MeshStandardMaterial({
    color: PALETTE.sideTrimPink,
    roughness: 0.35,
    metalness: 0.1,
  });
  const matBumper = new THREE.MeshStandardMaterial({
    color: PALETTE.bumperPink,
    roughness: 0.35,
    metalness: 0.08,
  });
  const matMirror = new THREE.MeshStandardMaterial({
    color: PALETTE.mirrorPink,
    roughness: 0.3,
    metalness: 0.12,
  });
  const matSilver = new THREE.MeshStandardMaterial({
    color: PALETTE.chromeSilver,
    roughness: 0.24,
    metalness: 0.68,
  });
  const matGlass = new THREE.MeshStandardMaterial({
    color: PALETTE.glassTint,
    roughness: 0.12,
    metalness: 0.18,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
  });
  const matInteriorCream = new THREE.MeshStandardMaterial({
    color: PALETTE.interiorCream,
    roughness: 0.72,
    metalness: 0.02,
  });
  const matInteriorLav = new THREE.MeshStandardMaterial({
    color: PALETTE.interiorLav,
    roughness: 0.75,
    metalness: 0.02,
  });
  const matInteriorWood = new THREE.MeshStandardMaterial({
    color: PALETTE.interiorWood,
    roughness: 0.68,
    metalness: 0.03,
  });
  const matDarkUnder = new THREE.MeshStandardMaterial({
    color: 0x3b2f4d,
    roughness: 0.85,
    metalness: 0.05,
  });
  const matTire = new THREE.MeshStandardMaterial({
    color: PALETTE.tireRubber,
    roughness: 0.84,
    metalness: 0.05,
  });
  const matRim = new THREE.MeshStandardMaterial({
    color: PALETTE.hubcapCream,
    roughness: 0.35,
    metalness: 0.25,
  });
  const matHeadlightOn = new THREE.MeshStandardMaterial({
    color: PALETTE.headlightWarm,
    emissive: 0xffe49e,
    emissiveIntensity: 1.5,
    roughness: 0.15,
  });
  const matHeadlightOff = new THREE.MeshStandardMaterial({
    color: 0xeae4f2,
    emissive: 0x000000,
    roughness: 0.2,
    metalness: 0.25,
  });
  const matIndOff = new THREE.MeshStandardMaterial({
    color: 0xf4c298,
    emissive: 0x000000,
    roughness: 0.3,
  });
  const matIndOn = new THREE.MeshStandardMaterial({
    color: PALETTE.indicatorAmber,
    emissive: 0xffa638,
    emissiveIntensity: 1.9,
    roughness: 0.15,
  });
  const matTailIdle = new THREE.MeshStandardMaterial({
    color: PALETTE.taillightRed,
    emissive: 0xd93862,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });
  const matTailBrake = new THREE.MeshStandardMaterial({
    color: 0xff82a2,
    emissive: 0xff2e63,
    emissiveIntensity: 1.9,
    roughness: 0.15,
  });
  const popCanvasMat = new THREE.MeshStandardMaterial({
    color: 0xf7e3f2,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  disposables.push(
    matBody,
    matLowerPink,
    matRoof,
    matFrame,
    matTrim,
    matBumper,
    matMirror,
    matSilver,
    matGlass,
    matInteriorCream,
    matInteriorLav,
    matInteriorWood,
    matDarkUnder,
    matTire,
    matRim,
    matHeadlightOn,
    matHeadlightOff,
    matIndOff,
    matIndOn,
    matTailIdle,
    matTailBrake,
    popCanvasMat
  );

  const W = 2.12;
  const L = 4.92;
  const beltY = 1.24;
  const bottomY = 0.4;
  const roofBaseY = 2.04;
  const wheelR = 0.42;
  const frontAxleZ = 1.44;
  const rearAxleZ = -1.48;
  const wallThick = 0.11;
  const lowerH = beltY - bottomY;
  const lowerMidY = bottomY + lowerH / 2;

  // Underbody & Cedar Wood Floor
  const floorPan = makeMesh(createRoundedBox(W - 0.16, 0.1, L - 0.24, 0.22, 0.03), matDarkUnder);
  floorPan.position.set(0, bottomY + 0.02, 0.02);
  chassis.add(floorPan);

  const woodFloor = makeMesh(createRoundedBox(W - 0.24, 0.05, L - 0.34, 0.16, 0.02), matInteriorWood, false, true);
  woodFloor.position.set(0, bottomY + 0.08, 0.0);
  chassis.add(woodFloor);

  // Rounded Front Nose + Signature Bubblegum Pink Front V-Chevron
  const noseMain = makeMesh(createRoundedBox(W, lowerH, 0.52, 0.28, 0.11), matBody);
  noseMain.position.set(0, lowerMidY, L / 2 - 0.26);
  chassis.add(noseMain);

  const noseBulge = makeMesh(new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), matBody);
  noseBulge.rotation.x = Math.PI / 2;
  noseBulge.scale.set(W * 0.48, 0.18, lowerH * 0.46);
  noseBulge.position.set(0, lowerMidY - 0.03, L / 2 - 0.04);
  chassis.add(noseBulge);

  const vShape = new THREE.Shape();
  const vw = W * 0.485;
  vShape.moveTo(-vw, 0.23);
  vShape.lineTo(vw, 0.23);
  vShape.lineTo(vw, 0.07);
  vShape.quadraticCurveTo(vw * 0.42, 0.04, 0, -0.14);
  vShape.quadraticCurveTo(-vw * 0.42, 0.04, -vw, 0.07);
  vShape.closePath();
  const vBandGeom = new THREE.ExtrudeGeometry(vShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  vBandGeom.center();
  const vBand = makeMesh(vBandGeom, matLowerPink);
  vBand.position.set(0, beltY - 0.14, L / 2 - 0.02);
  vBand.rotation.x = -0.06;
  chassis.add(vBand);

  const vTrimCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W * 0.495, beltY - 0.11, L / 2 - 0.02),
    new THREE.Vector3(-W * 0.28, beltY - 0.17, L / 2 + 0.05),
    new THREE.Vector3(0, beltY - 0.3, L / 2 + 0.085),
    new THREE.Vector3(W * 0.28, beltY - 0.17, L / 2 + 0.05),
    new THREE.Vector3(W * 0.495, beltY - 0.11, L / 2 - 0.02),
  ]);
  chassis.add(makeMesh(new THREE.TubeGeometry(vTrimCurve, 24, 0.018, 7, false), matRoof));

  const frontApron = makeMesh(createRoundedBox(W - 0.06, 0.24, 0.38, 0.14, 0.06), matLowerPink);
  frontApron.position.set(0, bottomY + 0.11, L / 2 - 0.18);
  chassis.add(frontApron);

  // Rear Lower Shell
  const rearLower = makeMesh(createRoundedBox(W, lowerH, 0.46, 0.26, 0.1), matBody);
  rearLower.position.set(0, lowerMidY, -L / 2 + 0.23);
  chassis.add(rearLower);

  const rearApron = makeMesh(createRoundedBox(W - 0.06, 0.22, 0.34, 0.14, 0.05), matLowerPink);
  rearApron.position.set(0, bottomY + 0.1, -L / 2 + 0.17);
  chassis.add(rearApron);

  // Left & Right Lower Side Panels + Rocker Trim + Decorative Side Stripes + Slide Rail
  const leftRearSide = makeMesh(createRoundedBox(wallThick, lowerH, 2.86, 0.08, 0.03), matBody);
  leftRearSide.position.set(W / 2 - wallThick / 2, lowerMidY, -0.78);
  chassis.add(leftRearSide);

  const leftRocker = makeMesh(createRoundedBox(0.125, 0.2, L - 0.65, 0.06, 0.025), matLowerPink);
  leftRocker.position.set(W / 2 - 0.055, bottomY + 0.095, -0.02);
  chassis.add(leftRocker);

  const rightFrontPanel = makeMesh(createRoundedBox(wallThick, lowerH, 1.32, 0.08, 0.03), matBody);
  rightFrontPanel.position.set(-W / 2 + wallThick / 2, lowerMidY, 1.42);
  chassis.add(rightFrontPanel);

  const rightRearPanel = makeMesh(createRoundedBox(wallThick, lowerH, 1.48, 0.08, 0.03), matBody);
  rightRearPanel.position.set(-W / 2 + wallThick / 2, lowerMidY, -1.41);
  chassis.add(rightRearPanel);

  const rightRocker = makeMesh(createRoundedBox(0.125, 0.18, L - 0.65, 0.06, 0.025), matLowerPink);
  rightRocker.position.set(-W / 2 + 0.055, bottomY + 0.085, -0.02);
  chassis.add(rightRocker);

  const stripeRFront = makeMesh(createRoundedBox(0.035, 0.08, 1.38, 0.02, 0.01), matTrim);
  stripeRFront.position.set(-W / 2 - 0.004, beltY - 0.06, 1.42);
  chassis.add(stripeRFront);

  const stripeRRear = makeMesh(createRoundedBox(0.035, 0.08, 1.56, 0.02, 0.01), matTrim);
  stripeRRear.position.set(-W / 2 - 0.004, beltY - 0.06, -1.44);
  chassis.add(stripeRRear);

  const stripeLRear = makeMesh(createRoundedBox(0.035, 0.08, 2.94, 0.02, 0.01), matTrim);
  stripeLRear.position.set(W / 2 + 0.004, beltY - 0.06, -0.8);
  chassis.add(stripeLRear);

  const slideTrack = makeMesh(createRoundedBox(0.04, 0.048, 1.38, 0.015, 0.008), matLowerPink);
  slideTrack.position.set(-W / 2 - 0.012, beltY - 0.24, -1.36);
  chassis.add(slideTrack);

  // Flared Rounded Bubblegum Wheel Arches
  [
    { x: W / 2 - 0.01, z: frontAxleZ, rotY: Math.PI / 2 },
    { x: -W / 2 + 0.01, z: frontAxleZ, rotY: -Math.PI / 2 },
    { x: W / 2 - 0.01, z: rearAxleZ, rotY: Math.PI / 2 },
    { x: -W / 2 + 0.01, z: rearAxleZ, rotY: -Math.PI / 2 },
  ].forEach((ap) => {
    const arch = makeMesh(new THREE.TorusGeometry(0.49, 0.095, 10, 20, Math.PI), matLowerPink);
    arch.position.set(ap.x, wheelR + 0.03, ap.z);
    arch.rotation.y = ap.rotY;
    arch.scale.set(1.06, 0.94, 0.72);
    chassis.add(arch);

    const well = makeMesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.34, 14, 1, false, 0, Math.PI),
      matDarkUnder,
      false,
      true
    );
    well.rotation.z = Math.PI / 2;
    well.rotation.x = Math.PI / 2;
    well.position.set(ap.x > 0 ? ap.x - 0.18 : ap.x + 0.18, wheelR + 0.02, ap.z);
    chassis.add(well);
  });

  // Upper Cabin Pillars & Muted Lavender Window Frames
  const topW = W - 0.16;
  const frontBeltZ = L / 2 - 0.12;
  const frontRoofZ = L / 2 - 0.44;
  const rearBeltZ = -L / 2 + 0.12;
  const rearRoofZ = -L / 2 + 0.26;

  const addPillar = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number) => {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const mesh = makeMesh(new THREE.CylinderGeometry(radius, radius * 1.08, len, 8), matFrame);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    chassis.add(mesh);
  };

  addPillar(
    new THREE.Vector3(W / 2 - 0.07, beltY - 0.02, frontBeltZ - 0.06),
    new THREE.Vector3(topW / 2 - 0.05, roofBaseY + 0.02, frontRoofZ - 0.04),
    0.055
  );
  addPillar(
    new THREE.Vector3(-W / 2 + 0.07, beltY - 0.02, frontBeltZ - 0.06),
    new THREE.Vector3(-topW / 2 + 0.05, roofBaseY + 0.02, frontRoofZ - 0.04),
    0.055
  );
  addPillar(
    new THREE.Vector3(W / 2 - 0.07, beltY - 0.02, rearBeltZ + 0.08),
    new THREE.Vector3(topW / 2 - 0.05, roofBaseY + 0.02, rearRoofZ + 0.06),
    0.06
  );
  addPillar(
    new THREE.Vector3(-W / 2 + 0.07, beltY - 0.02, rearBeltZ + 0.08),
    new THREE.Vector3(-topW / 2 + 0.05, roofBaseY + 0.02, rearRoofZ + 0.06),
    0.06
  );
  [0.76, -0.68, -1.48].forEach((pzVal) => {
    addPillar(
      new THREE.Vector3(W / 2 - 0.06, beltY - 0.01, pzVal),
      new THREE.Vector3(topW / 2 - 0.04, roofBaseY + 0.01, pzVal),
      0.042
    );
    addPillar(
      new THREE.Vector3(-W / 2 + 0.06, beltY - 0.01, pzVal),
      new THREE.Vector3(-topW / 2 + 0.04, roofBaseY + 0.01, pzVal),
      0.042
    );
  });

  const wsBottomFrame = makeMesh(createRoundedBox(W - 0.08, 0.07, 0.09, 0.025, 0.01), matFrame);
  wsBottomFrame.position.set(0, beltY + 0.01, frontBeltZ - 0.04);
  chassis.add(wsBottomFrame);
  const wsTopFrame = makeMesh(createRoundedBox(topW - 0.04, 0.07, 0.09, 0.025, 0.01), matFrame);
  wsTopFrame.position.set(0, roofBaseY - 0.01, frontRoofZ - 0.03);
  chassis.add(wsTopFrame);

  const rearBottomFrame = makeMesh(createRoundedBox(W - 0.12, 0.07, 0.09, 0.025, 0.01), matFrame);
  rearBottomFrame.position.set(0, beltY + 0.01, rearBeltZ + 0.06);
  chassis.add(rearBottomFrame);
  const rearTopFrame = makeMesh(createRoundedBox(topW - 0.06, 0.07, 0.09, 0.025, 0.01), matFrame);
  rearTopFrame.position.set(0, roofBaseY - 0.01, rearRoofZ + 0.05);
  chassis.add(rearTopFrame);

  [-1, 1].forEach((side) => {
    const topRail = makeMesh(createRoundedBox(0.08, 0.07, L - 0.64, 0.02, 0.01), matFrame);
    topRail.position.set(side * (topW / 2 - 0.04), roofBaseY - 0.01, -0.1);
    chassis.add(topRail);
    const botRail = makeMesh(createRoundedBox(0.08, 0.065, L - 0.42, 0.02, 0.01), matFrame);
    botRail.position.set(side * (W / 2 - 0.05), beltY + 0.01, 0.0);
    chassis.add(botRail);
  });

  // Panoramic Sloped Windshield + Rear + Side Windows
  const wsHeight = Math.hypot(roofBaseY - beltY, frontBeltZ - frontRoofZ);
  const wsAngle = Math.atan2(frontBeltZ - frontRoofZ, roofBaseY - beltY);
  const windshield = makeMesh(new THREE.PlaneGeometry(W - 0.2, wsHeight - 0.04), matGlass, false, false);
  windshield.position.set(0, (beltY + roofBaseY) / 2, (frontBeltZ + frontRoofZ) / 2 - 0.03);
  windshield.rotation.x = -wsAngle;
  chassis.add(windshield);

  const rearGlassH = Math.hypot(roofBaseY - beltY, rearRoofZ - rearBeltZ);
  const rearAngle = Math.atan2(rearRoofZ - rearBeltZ, roofBaseY - beltY);
  const rearGlass = makeMesh(new THREE.PlaneGeometry(W - 0.24, rearGlassH - 0.04), matGlass, false, false);
  rearGlass.position.set(0, (beltY + roofBaseY) / 2, (rearBeltZ + rearRoofZ) / 2 + 0.05);
  rearGlass.rotation.y = Math.PI;
  rearGlass.rotation.x = -rearAngle;
  chassis.add(rearGlass);

  const sideSlopeAngle = Math.atan2((W - topW) / 2, roofBaseY - beltY);
  const sideGlassH = Math.hypot(roofBaseY - beltY, (W - topW) / 2) - 0.06;
  const sideMidY = (beltY + roofBaseY) / 2;
  const sideMidX = (W + topW) / 4 - 0.05;

  const addSideGlass = (sideSign: 1 | -1, zStart: number, zEnd: number) => {
    const len = Math.abs(zEnd - zStart) - 0.07;
    const midZ = (zStart + zEnd) / 2;
    const pane = makeMesh(new THREE.PlaneGeometry(len, sideGlassH), matGlass, false, false);
    pane.position.set(sideSign * sideMidX, sideMidY, midZ);
    pane.rotation.order = 'YXZ';
    pane.rotation.y = sideSign > 0 ? Math.PI / 2 : -Math.PI / 2;
    pane.rotation.x = -sideSlopeAngle;
    chassis.add(pane);
  };
  addSideGlass(1, 0.76, -0.68);
  addSideGlass(1, -0.68, -1.48);
  addSideGlass(1, -1.48, rearBeltZ + 0.08);
  addSideGlass(-1, frontRoofZ + 0.08, 0.76);
  addSideGlass(-1, -0.68, -1.48);
  addSideGlass(-1, -1.48, rearBeltZ + 0.08);

  // Animated Sliding Passenger Door (-X) & Hinged Driver Door (+X)
  const slidingDoorGroup = new THREE.Group();
  chassis.add(slidingDoorGroup);
  const sDoorLen = 1.4;
  const sDoorCenterZ = 0.04;
  const sDoorLower = makeMesh(createRoundedBox(wallThick, lowerH - 0.02, sDoorLen, 0.06, 0.025), matBody);
  sDoorLower.position.set(-W / 2 + wallThick / 2, lowerMidY, sDoorCenterZ);
  slidingDoorGroup.add(sDoorLower);
  const sDoorStripe = makeMesh(createRoundedBox(0.036, 0.08, sDoorLen - 0.02, 0.02, 0.01), matTrim);
  sDoorStripe.position.set(-W / 2 - 0.005, beltY - 0.06, sDoorCenterZ);
  slidingDoorGroup.add(sDoorStripe);
  const sDoorWinPivot = new THREE.Group();
  sDoorWinPivot.position.set(-sideMidX, sideMidY, sDoorCenterZ);
  sDoorWinPivot.rotation.z = -sideSlopeAngle;
  slidingDoorGroup.add(sDoorWinPivot);
  const sDoorGlass = makeMesh(new THREE.PlaneGeometry(sDoorLen - 0.12, sideGlassH - 0.02), matGlass, false, false);
  sDoorGlass.rotation.y = -Math.PI / 2;
  sDoorWinPivot.add(sDoorGlass);
  const sDoorMidBar = makeMesh(new THREE.CylinderGeometry(0.028, 0.03, sideGlassH + 0.02, 7), matFrame);
  sDoorMidBar.position.set(0, 0, 0.02);
  sDoorWinPivot.add(sDoorMidBar);
  const sDoorHandle = makeMesh(createRoundedBox(0.045, 0.042, 0.15, 0.018, 0.01), matSilver);
  sDoorHandle.position.set(-W / 2 - 0.025, beltY - 0.16, 0.56);
  slidingDoorGroup.add(sDoorHandle);

  const driverDoorPivot = new THREE.Group();
  driverDoorPivot.position.set(W / 2 - 0.04, 0, 2.08);
  chassis.add(driverDoorPivot);
  const dDoorLen = 1.32;
  const dDoorRelZ = -dDoorLen / 2;
  const dDoorLower = makeMesh(createRoundedBox(wallThick, lowerH - 0.02, dDoorLen, 0.06, 0.025), matBody);
  dDoorLower.position.set(-wallThick / 2 + 0.04, lowerMidY, dDoorRelZ);
  driverDoorPivot.add(dDoorLower);
  const dDoorStripe = makeMesh(createRoundedBox(0.036, 0.08, dDoorLen - 0.02, 0.02, 0.01), matTrim);
  dDoorStripe.position.set(0.044, beltY - 0.06, dDoorRelZ);
  driverDoorPivot.add(dDoorStripe);
  const dDoorWinPivot = new THREE.Group();
  dDoorWinPivot.position.set(-(W / 2 - 0.04) + sideMidX, sideMidY, dDoorRelZ - 0.05);
  dDoorWinPivot.rotation.z = sideSlopeAngle;
  driverDoorPivot.add(dDoorWinPivot);
  const dDoorGlass = makeMesh(new THREE.PlaneGeometry(dDoorLen - 0.22, sideGlassH - 0.02), matGlass, false, false);
  dDoorGlass.rotation.y = Math.PI / 2;
  dDoorWinPivot.add(dDoorGlass);
  const dDoorHandle = makeMesh(createRoundedBox(0.045, 0.042, 0.15, 0.018, 0.01), matSilver);
  dDoorHandle.position.set(0.062, beltY - 0.16, -dDoorLen + 0.18);
  driverDoorPivot.add(dDoorHandle);

  // Curved Pastel Roof + Samba Skylights + Animated Pop-Top Camper Roof
  const roofMain = makeMesh(createRoundedBox(topW + 0.08, 0.22, L - 0.48, 0.28, 0.1), matRoof);
  roofMain.position.set(0, roofBaseY + 0.1, -0.09);
  chassis.add(roofMain);

  const dripRail = makeMesh(createRoundedBox(topW + 0.13, 0.045, L - 0.44, 0.18, 0.018), matRoof);
  dripRail.position.set(0, roofBaseY + 0.015, -0.09);
  chassis.add(dripRail);

  [0.85, -0.18, -1.2].forEach((sz) => {
    [-1, 1].forEach((side) => {
      const skyFrame = makeMesh(createRoundedBox(0.2, 0.04, 0.82, 0.05, 0.012), matFrame);
      skyFrame.position.set(side * (topW / 2 - 0.16), roofBaseY + 0.165, sz);
      skyFrame.rotation.z = -side * 0.42;
      chassis.add(skyFrame);
      const skyGlass = makeMesh(createRoundedBox(0.15, 0.045, 0.74, 0.04, 0.008), matGlass, false, false);
      skyGlass.position.set(side * (topW / 2 - 0.16), roofBaseY + 0.172, sz);
      skyGlass.rotation.z = -side * 0.42;
      chassis.add(skyGlass);
    });
  });

  const popRoofGroup = new THREE.Group();
  popRoofGroup.position.set(0, roofBaseY + 0.21, -0.22);
  chassis.add(popRoofGroup);
  const popCap = makeMesh(createRoundedBox(1.24, 0.09, 2.35, 0.16, 0.04), matRoof);
  popCap.position.set(0, 0.04, 0);
  popRoofGroup.add(popCap);
  const popCanvas = makeMesh(new THREE.BoxGeometry(1.12, 1.0, 2.18), popCanvasMat);
  popCanvas.position.set(0, -0.02, 0);
  popCanvas.scale.y = 0.01;
  popCanvas.visible = false;
  popRoofGroup.add(popCanvas);

  // Bumpers, "Olga" License Plates, Headlights, Indicators, Taillights & Side Mirrors
  const frontBumper = makeMesh(createRoundedBox(W + 0.1, 0.21, 0.24, 0.12, 0.055), matBumper);
  frontBumper.position.set(0, bottomY + 0.12, L / 2 + 0.1);
  chassis.add(frontBumper);
  const rearBumper = makeMesh(createRoundedBox(W + 0.08, 0.2, 0.22, 0.12, 0.05), matBumper);
  rearBumper.position.set(0, bottomY + 0.12, -L / 2 - 0.08);
  chassis.add(rearBumper);

  const plateTex = createLicensePlateTexture('Olga');
  const matPlate = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.4 });
  disposables.push(plateTex, matPlate);

  const frontPlateFrame = makeMesh(createRoundedBox(0.56, 0.21, 0.04, 0.03, 0.01), matFrame);
  frontPlateFrame.position.set(0, bottomY + 0.13, L / 2 + 0.22);
  chassis.add(frontPlateFrame);
  const frontPlate = makeMesh(new THREE.PlaneGeometry(0.5, 0.17), matPlate, false, false);
  frontPlate.position.set(0, bottomY + 0.13, L / 2 + 0.242);
  chassis.add(frontPlate);

  const rearPlateFrame = makeMesh(createRoundedBox(0.54, 0.2, 0.04, 0.03, 0.01), matFrame);
  rearPlateFrame.position.set(0, bottomY + 0.14, -L / 2 - 0.19);
  chassis.add(rearPlateFrame);
  const rearPlate = makeMesh(new THREE.PlaneGeometry(0.48, 0.16), matPlate, false, false);
  rearPlate.position.set(0, bottomY + 0.14, -L / 2 - 0.212);
  rearPlate.rotation.y = Math.PI;
  chassis.add(rearPlate);

  const headlightBulbs: THREE.Mesh[] = [];
  const headlightBeams: THREE.Mesh[] = [];
  const headlightSpots: THREE.SpotLight[] = [];

  [-0.64, 0.64].forEach((hx) => {
    const hlGroup = new THREE.Group();
    hlGroup.position.set(hx, bottomY + 0.39, L / 2 + 0.075);
    hlGroup.rotation.y = hx > 0 ? 0.14 : -0.14;
    chassis.add(hlGroup);

    hlGroup.add(makeMesh(new THREE.TorusGeometry(0.175, 0.036, 10, 20), matFrame));
    const silverRing = makeMesh(new THREE.TorusGeometry(0.155, 0.024, 10, 20), matSilver);
    silverRing.position.z = 0.018;
    hlGroup.add(silverRing);

    const bulb = makeMesh(
      new THREE.SphereGeometry(0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      matHeadlightOn,
      false,
      false
    );
    bulb.rotation.x = Math.PI / 2;
    bulb.scale.z = 0.45;
    bulb.position.z = 0.005;
    hlGroup.add(bulb);
    headlightBulbs.push(bulb);

    const coneGeom = new THREE.ConeGeometry(1.1, 4.8, 16, 1, true);
    coneGeom.translate(0, -2.4, 0);
    coneGeom.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff0c4,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    disposables.push(coneMat);
    const beam = makeMesh(coneGeom, coneMat, false, false);
    beam.position.set(0, -0.02, 0.08);
    beam.rotation.x = 0.08;
    hlGroup.add(beam);
    headlightBeams.push(beam);

    const spot = new THREE.SpotLight(0xffe8b5, 2.2, 24, Math.PI / 4.2, 0.65, 1.3);
    spot.position.set(hx, bottomY + 0.4, L / 2 + 0.12);
    const target = new THREE.Object3D();
    target.position.set(hx * 1.15, 0.0, L / 2 + 9.0);
    chassis.add(target);
    spot.target = target;
    chassis.add(spot);
    headlightSpots.push(spot);
  });

  const leftIndMeshes: THREE.Mesh[] = [];
  const rightIndMeshes: THREE.Mesh[] = [];
  [
    { x: 0.46, isLeft: true },
    { x: -0.46, isLeft: false },
  ].forEach((ind) => {
    const ig = new THREE.Group();
    ig.position.set(ind.x, bottomY + 0.25, L / 2 + 0.115);
    ig.rotation.y = ind.x > 0 ? 0.1 : -0.1;
    chassis.add(ig);
    ig.add(makeMesh(new THREE.TorusGeometry(0.062, 0.016, 8, 14), matSilver));
    const lens = makeMesh(new THREE.SphereGeometry(0.056, 10, 8), matIndOff, false, false);
    lens.scale.z = 0.5;
    ig.add(lens);
    if (ind.isLeft) leftIndMeshes.push(lens);
    else rightIndMeshes.push(lens);
  });

  const rearTailMeshes: THREE.Mesh[] = [];
  [-0.78, 0.78].forEach((rx) => {
    const isLeft = rx > 0;
    const housing = makeMesh(createRoundedBox(0.14, 0.26, 0.08, 0.06, 0.02), matSilver);
    housing.position.set(rx, bottomY + 0.42, -L / 2 - 0.01);
    chassis.add(housing);
    const tailLens = makeMesh(createRoundedBox(0.095, 0.12, 0.05, 0.035, 0.01), matTailIdle, false, false);
    tailLens.position.set(rx, bottomY + 0.37, -L / 2 - 0.045);
    chassis.add(tailLens);
    rearTailMeshes.push(tailLens);
    const rearInd = makeMesh(createRoundedBox(0.095, 0.085, 0.05, 0.03, 0.01), matIndOff, false, false);
    rearInd.position.set(rx, bottomY + 0.49, -L / 2 - 0.045);
    chassis.add(rearInd);
    if (isLeft) leftIndMeshes.push(rearInd);
    else rightIndMeshes.push(rearInd);
  });

  // Cute Round Pastel Pink Side Mirrors
  [-1, 1].forEach((side) => {
    const mGroup = new THREE.Group();
    mGroup.position.set(side * (W / 2 - 0.02), beltY + 0.06, frontBeltZ - 0.16);
    chassis.add(mGroup);
    const stem = makeMesh(new THREE.CylinderGeometry(0.016, 0.02, 0.2, 6), matFrame);
    stem.rotation.z = -side * 0.85;
    stem.position.set(side * 0.08, 0.06, 0);
    mGroup.add(stem);
    const head = makeMesh(new THREE.SphereGeometry(0.11, 12, 10), matMirror);
    head.scale.set(1.0, 1.0, 0.45);
    head.position.set(side * 0.16, 0.13, 0.02);
    head.rotation.y = side * 0.22;
    mGroup.add(head);
  });

  // Cozy Interior (Dashboard, Rotating Steering Wheel, Seats, Lounge Bench, Mini Table)
  const dash = makeMesh(createRoundedBox(W - 0.26, 0.26, 0.42, 0.1, 0.04), matInteriorCream);
  dash.position.set(0, beltY - 0.08, frontBeltZ - 0.34);
  chassis.add(dash);

  const gaugeTex = createDashboardGaugeTexture();
  const gaugeMat = new THREE.MeshStandardMaterial({
    map: gaugeTex,
    emissive: 0xf0c2e8,
    emissiveMap: gaugeTex,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  disposables.push(gaugeTex, gaugeMat);
  const gaugePanel = makeMesh(new THREE.PlaneGeometry(0.5, 0.16), gaugeMat, false, false);
  gaugePanel.position.set(0.46, beltY - 0.05, frontBeltZ - 0.555);
  gaugePanel.rotation.y = Math.PI;
  chassis.add(gaugePanel);

  const steerCol = makeMesh(new THREE.CylinderGeometry(0.036, 0.042, 0.42, 8), matFrame);
  steerCol.position.set(0.46, beltY - 0.14, frontBeltZ - 0.64);
  steerCol.rotation.x = Math.PI * 0.36;
  chassis.add(steerCol);

  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(0.46, beltY - 0.03, frontBeltZ - 0.8);
  steeringWheelGroup.rotation.x = -Math.PI * 0.14;
  chassis.add(steeringWheelGroup);
  steeringWheelGroup.add(makeMesh(new THREE.TorusGeometry(0.19, 0.024, 8, 20), matInteriorCream));
  const wheelHub = makeMesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 10), matLowerPink);
  wheelHub.rotation.x = Math.PI / 2;
  steeringWheelGroup.add(wheelHub);
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ang) => {
    const spoke = makeMesh(new THREE.BoxGeometry(0.024, 0.18, 0.018), matSilver);
    spoke.position.set(Math.sin(ang) * 0.09, Math.cos(ang) * 0.09, 0);
    spoke.rotation.z = -ang;
    steeringWheelGroup.add(spoke);
  });

  // Front Driver (+X) & Passenger (-X) Plush Seats
  const addSeat = (xPos: number, zPos: number) => {
    const sg = new THREE.Group();
    sg.position.set(xPos, bottomY + 0.1, zPos);
    const base = makeMesh(createRoundedBox(0.54, 0.26, 0.52, 0.08, 0.03), matInteriorLav);
    base.position.set(0, 0.13, 0);
    const cushionMesh = makeMesh(createRoundedBox(0.58, 0.14, 0.56, 0.08, 0.04), matInteriorCream);
    cushionMesh.position.set(0, 0.3, 0.02);
    const back = makeMesh(createRoundedBox(0.56, 0.62, 0.15, 0.1, 0.045), matInteriorCream);
    back.position.set(0, 0.62, -0.22);
    back.rotation.x = -0.14;
    const headrest = makeMesh(createRoundedBox(0.28, 0.18, 0.11, 0.06, 0.03), matRoof);
    headrest.position.set(0, 1.0, -0.27);
    sg.add(base, cushionMesh, back, headrest);
    chassis.add(sg);
  };
  addSeat(0.48, 1.18);
  addSeat(-0.48, 1.18);

  // Rear Cozy Camper Bench, Throw Pillows & Mini Table
  const rearBenchBase = makeMesh(createRoundedBox(W - 0.34, 0.34, 0.72, 0.08, 0.03), matInteriorWood);
  rearBenchBase.position.set(0, bottomY + 0.25, -1.62);
  const rearBenchCushion = makeMesh(createRoundedBox(W - 0.32, 0.15, 0.76, 0.08, 0.04), matInteriorCream);
  rearBenchCushion.position.set(0, bottomY + 0.45, -1.6);
  const rearBenchBack = makeMesh(createRoundedBox(W - 0.32, 0.55, 0.16, 0.08, 0.04), matInteriorCream);
  rearBenchBack.position.set(0, bottomY + 0.74, -1.94);
  rearBenchBack.rotation.x = -0.12;
  const pillow1 = makeMesh(createRoundedBox(0.32, 0.28, 0.14, 0.09, 0.04), matInteriorLav);
  pillow1.position.set(-0.56, bottomY + 0.64, -1.78);
  const pillow2 = makeMesh(createRoundedBox(0.3, 0.26, 0.14, 0.09, 0.04), matBody);
  pillow2.position.set(0.54, bottomY + 0.64, -1.78);
  const miniTableTop = makeMesh(createRoundedBox(0.68, 0.05, 0.74, 0.12, 0.02), matInteriorWood);
  miniTableTop.position.set(0.45, bottomY + 0.7, -0.56);
  const cabinLantern = makeMesh(new THREE.CylinderGeometry(0.065, 0.075, 0.15, 8), campLanternMat, false, false);
  cabinLantern.position.set(0.52, bottomY + 0.8, -0.62);
  chassis.add(rearBenchBase, rearBenchCushion, rearBenchBack, pillow1, pillow2, miniTableTop, cabinLantern);

  const cabinLight = new THREE.PointLight(0xffd7a8, 0.9, 5.2, 1.8);
  cabinLight.position.set(0, 1.72, -0.2);
  chassis.add(cabinLight);

  // 4 Independent Steering & Spinning Vintage Wheels
  const makeWheel = (isLeftSide: boolean) => {
    const steerPivot = new THREE.Group();
    const spinGroup = new THREE.Group();
    steerPivot.add(spinGroup);

    const tire = makeMesh(new THREE.CylinderGeometry(wheelR, wheelR, 0.24, 20), matTire);
    tire.rotation.z = Math.PI / 2;
    spinGroup.add(tire);

    const rim = makeMesh(new THREE.CylinderGeometry(wheelR * 0.62, wheelR * 0.62, 0.255, 16), matRim);
    rim.rotation.z = Math.PI / 2;
    spinGroup.add(rim);

    const outerSign = isLeftSide ? 1 : -1;
    const hub = makeMesh(
      new THREE.SphereGeometry(wheelR * 0.42, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      matSilver
    );
    hub.rotation.z = isLeftSide ? -Math.PI / 2 : Math.PI / 2;
    hub.scale.set(1, 0.45, 1);
    hub.position.x = outerSign * 0.115;
    spinGroup.add(hub);

    const lugMark = makeMesh(new THREE.BoxGeometry(0.02, 0.14, 0.035), matFrame, false, false);
    lugMark.position.set(outerSign * 0.145, 0, 0);
    spinGroup.add(lugMark);

    return { steerPivot, spinGroup };
  };

  const trackHalfW = W / 2 - 0.1;
  const wheelFL = makeWheel(true);
  wheelFL.steerPivot.position.set(trackHalfW, wheelR, frontAxleZ);
  const wheelFR = makeWheel(false);
  wheelFR.steerPivot.position.set(-trackHalfW, wheelR, frontAxleZ);
  const wheelRL = makeWheel(true);
  wheelRL.steerPivot.position.set(trackHalfW, wheelR, rearAxleZ);
  const wheelRR = makeWheel(false);
  wheelRR.steerPivot.position.set(-trackHalfW, wheelR, rearAxleZ);
  vanRoot.add(wheelFL.steerPivot, wheelFR.steerPivot, wheelRL.steerPivot, wheelRR.steerPivot);

  const aoShadowMat = new THREE.MeshBasicMaterial({
    map: aoShadowTex,
    transparent: true,
    depthWrite: false,
  });
  disposables.push(aoShadowMat);
  const aoShadow = makeMesh(new THREE.PlaneGeometry(W + 0.9, L + 0.9), aoShadowMat, false, false);
  aoShadow.rotation.x = -Math.PI / 2;
  aoShadow.position.set(0, 0.03, 0);
  vanRoot.add(aoShadow);

  // Live synced "Drive Olga" interactable so user can hop in wherever Olga is parked!
  const camperPrompt: InteractableItem = {
    id: 'drive_olga_camper',
    kind: 'camper_drive',
    label: 'Drive Olga — Pastel Camper Van',
    sublabel: 'ஓல்கா வேன் · Hop in & drive anywhere',
    x: cx + 3.8,
    y: groundHeightAt(cx + 3.8, cz + 1.8) + 0.6,
    z: cz + 1.8,
    radius: 4.8,
    locationId: 'enchanted_forest',
  };
  interactables.push(camperPrompt);

  let doorAnim = 0;
  let roofAnim = 0;
  let prevSpeed = 0;
  let smoothPitch = 0;
  let smoothRoll = 0;

  const update = (
    camper: CamperState,
    elapsed: number,
    dt: number,
    playerX: number,
    playerZ: number,
    lanternStrength: number
  ) => {
    // 1. Animate Enchanted Forest environment
    wfTex.offset.y += dt * 0.85;
    for (let i = 0; i < lotusFlowers.length; i++) {
      const l = lotusFlowers[i];
      l.group.position.y = l.baseY + Math.sin(elapsed * 1.4 + l.phase) * 0.035;
      l.group.rotation.y += dt * 0.12;
    }
    for (let i = 0; i < lanterns.length; i++) {
      const l = lanterns[i];
      l.group.rotation.z = Math.sin(elapsed * 1.1 + l.phase) * 0.06;
      l.group.rotation.x = Math.cos(elapsed * 0.9 + l.phase) * 0.04;
    }

    // Camp Cat curious gaze + tail wag
    const desiredCatRot = Math.atan2(playerX - catHomeX, playerZ - catHomeZ);
    campCatGroup.rotation.y += (desiredCatRot - campCatGroup.rotation.y) * Math.min(1, dt * 1.8);
    catTailPivot.rotation.z = Math.sin(elapsed * 3.2) * 0.28;
    campCatGroup.scale.y = 1 + Math.sin(elapsed * 2.8) * 0.025;

    // 2. Sync Olga Camper Van position, terrain tilt, suspension, doors, pop-roof & lights
    const sinH = Math.sin(camper.heading);
    const cosH = Math.cos(camper.heading);
    const fz = 1.44;
    const rz = -1.48;
    const hw = 0.96;
    const hFL = groundHeightAt(camper.x + sinH * fz + cosH * hw, camper.z + cosH * fz - sinH * hw);
    const hFR = groundHeightAt(camper.x + sinH * fz - cosH * hw, camper.z + cosH * fz + sinH * hw);
    const hRL = groundHeightAt(camper.x + sinH * rz + cosH * hw, camper.z + cosH * rz - sinH * hw);
    const hRR = groundHeightAt(camper.x + sinH * rz - cosH * hw, camper.z + cosH * rz + sinH * hw);
    const avgY = (hFL + hFR + hRL + hRR) * 0.25;

    const terrainPitch = Math.atan2(((hRL + hRR) - (hFL + hFR)) * 0.5, fz - rz);
    const terrainRoll = Math.atan2(((hFR + hRR) - (hFL + hRL)) * 0.5, hw * 2);

    vanRoot.position.set(camper.x, avgY, camper.z);
    vanRoot.rotation.order = 'YXZ';
    vanRoot.rotation.y = camper.heading;
    vanRoot.rotation.x = terrainPitch;
    vanRoot.rotation.z = terrainRoll;

    // Suspension spring feel
    const accel = (camper.speed - prevSpeed) / Math.max(dt, 0.008);
    prevSpeed = camper.speed;
    const targetPitch = THREE.MathUtils.clamp(-accel * 0.007, -0.05, 0.05);
    const targetRoll = THREE.MathUtils.clamp(camper.speed * camper.steerAngle * 0.012, -0.065, 0.065);
    smoothPitch += (targetPitch - smoothPitch) * Math.min(1, dt * 8);
    smoothRoll += (targetRoll - smoothRoll) * Math.min(1, dt * 8);
    const roadBounce = Math.sin(camper.wheelSpin * 2.1) * Math.min(0.015, Math.abs(camper.speed) * 0.0016);
    chassis.position.y = Math.sin(elapsed * 12) * 0.002 + roadBounce;
    chassis.rotation.x = smoothPitch;
    chassis.rotation.z = smoothRoll;

    // Steering & Wheel Rotation
    wheelFL.steerPivot.rotation.y = camper.steerAngle;
    wheelFR.steerPivot.rotation.y = camper.steerAngle;
    wheelFL.spinGroup.rotation.x = camper.wheelSpin;
    wheelFR.spinGroup.rotation.x = camper.wheelSpin;
    wheelRL.spinGroup.rotation.x = camper.wheelSpin;
    wheelRR.spinGroup.rotation.x = camper.wheelSpin;
    steeringWheelGroup.rotation.z = -camper.steerAngle * 2.8;

    // Doors & Pop-Top Roof animation
    doorAnim += ((camper.doorsOpen ? 1 : 0) - doorAnim) * Math.min(1, dt * 5.2);
    const popOut = Math.sin(Math.min(1, doorAnim * 2.2) * (Math.PI / 2)) * 0.13;
    const slideBack = Math.max(0, Math.min(1, (doorAnim - 0.15) / 0.85)) * 1.18;
    slidingDoorGroup.position.set(-popOut, 0, -slideBack);
    driverDoorPivot.rotation.y = -doorAnim * 1.05;

    roofAnim += ((camper.roofPopped ? 1 : 0) - roofAnim) * Math.min(1, dt * 4.5);
    const popH = roofAnim * 0.56;
    popRoofGroup.position.y = roofBaseY + 0.21 + popH;
    popCanvas.visible = roofAnim > 0.02;
    popCanvas.scale.y = Math.max(0.01, popH);
    popCanvas.position.y = -popH / 2;

    // Headlights, Brake lights & Blinkers
    const hlOn = camper.headlightsOn;
    const nightBoost = 0.65 + lanternStrength * 0.95;
    for (let i = 0; i < headlightBulbs.length; i++) {
      headlightBulbs[i].material = hlOn ? matHeadlightOn : matHeadlightOff;
      headlightBeams[i].visible = hlOn;
      headlightSpots[i].intensity = hlOn ? 1.8 * nightBoost : 0;
    }
    const tailMat = camper.isBraking ? matTailBrake : matTailIdle;
    for (let i = 0; i < rearTailMeshes.length; i++) {
      rearTailMeshes[i].material = tailMat;
    }

    const blinkOn = Math.floor(elapsed * 2.4) % 2 === 0;
    const lBlink = blinkOn && (camper.leftIndicator || camper.hazardsOn);
    const rBlink = blinkOn && (camper.rightIndicator || camper.hazardsOn);
    for (let i = 0; i < leftIndMeshes.length; i++) {
      leftIndMeshes[i].material = lBlink ? matIndOn : matIndOff;
    }
    for (let i = 0; i < rightIndMeshes.length; i++) {
      rightIndMeshes[i].material = rBlink ? matIndOn : matIndOff;
    }

    // Keep live interactable synced to Olga's current location!
    camperPrompt.x = camper.x;
    camperPrompt.y = avgY + 0.6;
    camperPrompt.z = camper.z;
  };

  const getDriverSeatTransform = () => {
    vanRoot.updateMatrixWorld();
    const pos = new THREE.Vector3(0.48, bottomY + 0.44, 1.18).applyMatrix4(chassis.matrixWorld);
    return { position: pos, heading: vanRoot.rotation.y };
  };

  const getCompanionSeatTransform = () => {
    vanRoot.updateMatrixWorld();
    const pos = new THREE.Vector3(-0.48, bottomY + 0.56, 1.18).applyMatrix4(chassis.matrixWorld);
    return { position: pos, heading: vanRoot.rotation.y };
  };

  const getCamperViewTransform = (viewMode: 'window' | 'cabin' | 'exterior') => {
    vanRoot.updateMatrixWorld();
    if (viewMode === 'window') {
      // Driver Interior POV
      const position = new THREE.Vector3(0.48, 1.62, 1.12).applyMatrix4(chassis.matrixWorld);
      const lookAt = new THREE.Vector3(0.42, 1.45, 7.2).applyMatrix4(chassis.matrixWorld);
      return { position, lookAt };
    }
    // Cozy Rear Camper Lounge View looking through panoramic windshield
    const position = new THREE.Vector3(-0.34, 1.6, -1.24).applyMatrix4(chassis.matrixWorld);
    const lookAt = new THREE.Vector3(0.0, 1.48, 5.8).applyMatrix4(chassis.matrixWorld);
    return { position, lookAt };
  };

  return {
    group,
    colliders,
    interactables,
    update,
    getDriverSeatTransform,
    getCompanionSeatTransform,
    getCamperViewTransform,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
