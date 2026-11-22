import * as THREE from 'three';
import {
  AVS_SNOW_HOUSE_BASE_Y,
  AVS_SNOW_HOUSE_CENTER,
  AVS_SNOW_HOUSE_ROT_Y,
  AVS_SNOW_HOUSE_SCALE,
} from '../game/frozenKingdom';

export interface AvsSnowHouseSystem {
  group: THREE.Group;
  update: (lanternStrength: number) => void;
  dispose: () => void;
}

/**
 * Full 3D architectural reconstruction of the user's attached AVS Residence,
 * scaled up 1.62x bigger and rotated to face directly toward Frozen Mirror Lake!
 */
export function buildAvsSnowHouse(): AvsSnowHouseSystem {
  const group = new THREE.Group();
  group.position.set(
    AVS_SNOW_HOUSE_CENTER.x,
    AVS_SNOW_HOUSE_BASE_Y,
    AVS_SNOW_HOUSE_CENTER.z
  );
  group.rotation.y = AVS_SNOW_HOUSE_ROT_Y;
  group.scale.setScalar(AVS_SNOW_HOUSE_SCALE);

  const disposables: Array<{ dispose: () => void }> = [];

  const mat = (
    color: number,
    roughness = 0.82,
    metalness = 0.04,
    extra: Partial<THREE.MeshStandardMaterialParameters> = {}
  ) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    disposables.push(m);
    return m;
  };

  const mainConcrete = mat(0xe6e4dc, 0.85);
  const weatheredConcrete = mat(0xc7c4b8, 0.9);
  const yellowTrim = mat(0xd9c26c, 0.62);
  const whiteTrim = mat(0xf6f7f2, 0.58);
  const snowCapMat = mat(0xf2f7ff, 0.68, 0.05);
  const windowFrameDark = mat(0x2c1b12, 0.45, 0.14);
  const tintedGlass = mat(0x162930, 0.14, 0.25, {
    transparent: true,
    opacity: 0.75,
    emissive: new THREE.Color(0xffc878),
    emissiveIntensity: 0.25,
  });
  const ironGrille = mat(0x232325, 0.4, 0.72);
  const brownGate = mat(0x4a2419, 0.46, 0.52);
  const stepRedTile = mat(0x9e362b, 0.55);
  const stepDarkTread = mat(0x36393c, 0.5);
  const stainlessSteel = mat(0xe2e8f0, 0.2, 0.88);
  const ochreStone = mat(0xb88736, 0.86);
  const foyerMosaic = mat(0x636e66, 0.52);
  const woodFloor = mat(0x8b633e, 0.45);
  const interiorYellowWall = mat(0xd4cf46, 0.72);
  const interiorWhiteWall = mat(0xe7e9ed, 0.74);
  const bathTile = mat(0x1f6d7f, 0.34);
  const graniteBlack = mat(0x1e2022, 0.26, 0.2);
  const foliageGreen = mat(0x2d5a27, 0.76);
  const bluePlastic = mat(0x1d4ed8, 0.38);
  const yellowTank = mat(0xd99b26, 0.45);
  const warmCeilingGlow = mat(0xfff4d6, 0.2, 0.0, {
    emissive: new THREE.Color(0xffcf82),
    emissiveIntensity: 1.5,
  });

  const addBox = (
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = group
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const addCyl = (
    rt: number,
    rb: number,
    h: number,
    segs: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = group
  ) => {
    const geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const W = 4.6;
  const D = 11.8;
  const H1 = 3.15;
  const P = 0.96;
  const BProj = 1.45;
  const wallT = 0.23;
  const slabT = 0.18;
  const halfW = W / 2;
  const frontPorchDepth = 1.65;
  const rightPassageW = 1.68;
  const leftWallW = W - rightPassageW;

  // 1. Plinth & Forecourt
  addBox(W, P, D, weatheredConcrete, 0, P / 2, -D / 2);
  const forecourtW = W - rightPassageW + 0.15;
  const forecourtD = 1.55;
  addBox(forecourtW, P - 0.18, forecourtD, weatheredConcrete, -halfW + forecourtW / 2, (P - 0.18) / 2, forecourtD / 2);
  addBox(forecourtW + 0.06, 0.08, forecourtD + 0.06, mainConcrete, -halfW + forecourtW / 2, P - 0.14, forecourtD / 2);

  // Corner white planter pillar + ochre stone water trough + snow-dusted aloe
  const pillarW = 0.68;
  const pillarH = 1.12;
  const pillarD = 0.68;
  const pillarX = -halfW + pillarW / 2 + 0.05;
  const pillarZ = forecourtD - pillarD / 2 - 0.05;
  addBox(pillarW, pillarH, pillarD, mainConcrete, pillarX, P - 0.1 + pillarH / 2, pillarZ);
  addBox(pillarW + 0.04, 0.08, pillarD + 0.04, snowCapMat, pillarX, P - 0.08 + pillarH, pillarZ);

  const tubW = 0.86;
  const tubH = 0.46;
  const tubD = 0.54;
  const tubX = pillarX + pillarW / 2 + tubW / 2 + 0.08;
  const tubZ = pillarZ + 0.06;
  addBox(tubW, tubH, tubD, ochreStone, tubX, P - 0.1 + tubH / 2, tubZ);
  addCyl(0.18, 0.16, 0.42, 10, bluePlastic, tubX + 0.15, P + 0.12, tubZ - 0.65);

  const leafGeo = new THREE.ConeGeometry(0.05, 0.48, 5);
  disposables.push(leafGeo);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const blade = new THREE.Mesh(leafGeo, foliageGreen);
    blade.position.set(pillarX + Math.cos(ang) * 0.12, P + pillarH + 0.14, pillarZ + Math.sin(ang) * 0.12);
    blade.rotation.set(Math.sin(ang) * 0.45, 0, Math.cos(ang) * 0.45);
    group.add(blade);
  }

  // 2. Ground Floor Perimeter & Front Porch Wall
  addBox(wallT, H1, D, mainConcrete, -halfW + wallT / 2, P + H1 / 2, -D / 2);
  addBox(wallT, H1, D, mainConcrete, halfW - wallT / 2, P + H1 / 2, -D / 2);
  addBox(W, H1, wallT, mainConcrete, 0, P + H1 / 2, -D + wallT / 2);

  const gfFrontWallZ = -frontPorchDepth;
  const gfFrontWallCenterX = -halfW + leftWallW / 2;
  addBox(leftWallW, 0.88, wallT, mainConcrete, gfFrontWallCenterX, P + 0.44, gfFrontWallZ);
  addBox(leftWallW, 0.92, wallT, mainConcrete, gfFrontWallCenterX, P + H1 - 0.46, gfFrontWallZ);
  addBox(0.55, 1.35, wallT, mainConcrete, -halfW + 0.275, P + 0.88 + 0.675, gfFrontWallZ);
  addBox(0.62, 1.35, wallT, mainConcrete, -halfW + leftWallW - 0.31, P + 0.88 + 0.675, gfFrontWallZ);

  // 3-Bay Dark Wood Window + Chajja Sunshade with yellow edge trim + snow cap
  const chajjaW = leftWallW - 0.15;
  const chajjaD = 0.52;
  const chajjaY = P + H1 - 0.88;
  addBox(chajjaW, 0.09, chajjaD, mainConcrete, gfFrontWallCenterX, chajjaY, gfFrontWallZ + chajjaD / 2);
  addBox(chajjaW + 0.02, 0.05, chajjaD + 0.02, yellowTrim, gfFrontWallCenterX, chajjaY + 0.05, gfFrontWallZ + chajjaD / 2);
  addBox(chajjaW, 0.06, chajjaD * 0.86, snowCapMat, gfFrontWallCenterX, chajjaY + 0.09, gfFrontWallZ + chajjaD / 2);

  const winW = 1.48;
  const winH = 1.25;
  const winX = gfFrontWallCenterX - 0.04;
  const winY = P + 0.88 + winH / 2;
  const winZ = gfFrontWallZ + 0.04;
  addBox(winW, winH, 0.12, windowFrameDark, winX, winY, winZ);
  addBox(winW - 0.14, winH - 0.14, 0.04, tintedGlass, winX, winY, winZ + 0.04);
  addBox(0.05, winH - 0.1, 0.14, windowFrameDark, winX - winW / 6, winY, winZ + 0.01);
  addBox(0.05, winH - 0.1, 0.14, windowFrameDark, winX + winW / 6, winY, winZ + 0.01);
  addBox(0.24, 0.14, 0.03, brownGate, halfW - rightPassageW - 0.28, P + 1.32, gfFrontWallZ + 0.12);

  // Dividing wall between Living Hall and Recessed Entrance Foyer (with open walkable doorway)
  const foyerLen = 4.65;
  const foyerWallSolidLen = foyerLen - 1.15;
  addBox(wallT, H1, foyerWallSolidLen, mainConcrete, halfW - rightPassageW, P + H1 / 2, -frontPorchDepth - foyerWallSolidLen / 2 + 0.1);
  addBox(wallT, H1 - 2.1, 1.15, mainConcrete, halfW - rightPassageW, P + 2.1 + (H1 - 2.1) / 2, -frontPorchDepth - foyerLen + 0.65);

  // Open Brown Security Grille Gate in Foyer
  const gateGroup = new THREE.Group();
  gateGroup.position.set(halfW - rightPassageW + 0.12, P, -frontPorchDepth - foyerLen + 0.65);
  gateGroup.rotation.y = -Math.PI * 0.48;
  addBox(1.02, 0.72, 0.045, brownGate, 0.51, 0.36, 0, gateGroup);
  addBox(1.02, 0.04, 0.045, brownGate, 0.51, 2.04, 0, gateGroup);
  addBox(0.04, 2.06, 0.045, brownGate, 0.02, 1.03, 0, gateGroup);
  addBox(0.04, 2.06, 0.045, brownGate, 1.0, 1.03, 0, gateGroup);
  for (let gx = 1; gx <= 4; gx++) {
    addBox(0.02, 1.32, 0.035, ironGrille, (1.02 / 5) * gx, 1.38, 0, gateGroup);
  }
  group.add(gateGroup);

  // 3. First Floor Slab & Prominent Cantilevered Balcony with Yellow Trim + Snow Drift
  const slabY = P + H1 + slabT / 2;
  const totalSlabD = D + BProj;
  const slabCenterZ = -D / 2 + BProj / 2;
  const leftSlabW = W - rightPassageW + 0.15;
  addBox(leftSlabW, slabT, totalSlabD, mainConcrete, -halfW + leftSlabW / 2, slabY, slabCenterZ);
  const rightFrontSlabD = BProj + frontPorchDepth + 0.65;
  addBox(rightPassageW, slabT, rightFrontSlabD, mainConcrete, halfW - rightPassageW / 2, slabY, BProj - rightFrontSlabD / 2);
  const rightRearSlabD = D - frontPorchDepth - 3.65;
  addBox(rightPassageW, slabT, rightRearSlabD, mainConcrete, halfW - rightPassageW / 2, slabY, -D + rightRearSlabD / 2);

  const parapetH = 1.08;
  const parapetY = slabY + slabT / 2 + parapetH / 2;
  const frontBalconyZ = BProj - 0.12;
  const returnD = BProj + frontPorchDepth;
  addBox(W + 0.08, parapetH, 0.18, mainConcrete, 0, parapetY, frontBalconyZ);
  addBox(0.18, parapetH, returnD, mainConcrete, -halfW + 0.05, parapetY, BProj - returnD / 2);
  // Right balcony return leaves a clean open doorway (lz: -0.15..1.25) onto the Exterior Helipad Staircase!
  addBox(0.18, parapetH, 0.35, mainConcrete, halfW - 0.05, parapetY, -frontPorchDepth + 0.18);
  // Signature Yellow Trim Bands + Snow Cap along Balcony Top
  addBox(W + 0.12, 0.065, 0.21, yellowTrim, 0, parapetY + parapetH / 2 + 0.02, frontBalconyZ);
  addBox(0.21, 0.065, returnD, yellowTrim, -halfW + 0.05, parapetY + parapetH / 2 + 0.02, BProj - returnD / 2);
  addBox(0.21, 0.065, 0.38, yellowTrim, halfW - 0.05, parapetY + parapetH / 2 + 0.02, -frontPorchDepth + 0.18);
  addBox(W + 0.1, 0.08, 0.22, snowCapMat, 0, parapetY + parapetH / 2 + 0.09, frontBalconyZ);
  addBox(W + 0.1, 0.06, 0.08, whiteTrim, 0, slabY - slabT / 2 + 0.03, frontBalconyZ + 0.06);

  // Upper Floor Mumty Room + Snow Roof + Rooftop Yellow Water Tank
  const upperH = 2.65;
  const upperBaseY = slabY + slabT / 2;
  const upperSetbackZ = -0.65;
  const upperBoxD = D - 1.5;
  addBox(wallT, upperH, upperBoxD, mainConcrete, -halfW + wallT / 2 + 0.05, upperBaseY + upperH / 2, upperSetbackZ - upperBoxD / 2);
  addBox(wallT, upperH, upperBoxD, mainConcrete, halfW - wallT / 2 - 0.05, upperBaseY + upperH / 2, upperSetbackZ - upperBoxD / 2);
  addBox(W - 0.1, upperH, wallT, mainConcrete, 0, upperBaseY + upperH / 2, upperSetbackZ - upperBoxD);
  addBox(W - rightPassageW, upperH, wallT, mainConcrete, -halfW + (W - rightPassageW) / 2, upperBaseY + upperH / 2, upperSetbackZ);
  addBox(rightPassageW, 0.55, wallT, mainConcrete, halfW - rightPassageW / 2, upperBaseY + upperH - 0.275, upperSetbackZ);
  addBox(W - 0.06, slabT, upperBoxD + 0.06, mainConcrete, 0, upperBaseY + upperH, upperSetbackZ - upperBoxD / 2);
  addBox(W + 0.04, 0.24, upperBoxD + 0.14, snowCapMat, 0, upperBaseY + upperH + 0.2, upperSetbackZ - upperBoxD / 2);
  // Upper window & yellow-trimmed chajja
  addBox(1.35, 1.15, 0.12, windowFrameDark, -halfW + 1.2, upperBaseY + 0.85, upperSetbackZ + 0.02);
  addBox(1.2, 1.0, 0.06, tintedGlass, -halfW + 1.2, upperBaseY + 0.85, upperSetbackZ + 0.06);
  addBox(2.1, 0.08, 0.48, mainConcrete, -halfW + 1.25, upperBaseY + 1.52, upperSetbackZ + 0.24);
  addBox(2.12, 0.045, 0.5, yellowTrim, -halfW + 1.25, upperBaseY + 1.56, upperSetbackZ + 0.24);
  // Rooftop Yellow Cylindrical Water Tank (rear corner clear of helipad)
  addCyl(0.48, 0.48, 1.08, 14, yellowTank, halfW - 0.85, upperBaseY + upperH + 0.7, upperSetbackZ - 9.0);

  // Rooftop Helipad Deck atop AVS Snow Residence for the SSJ Tropical Sky Explorer!
  const heliPadY = upperBaseY + upperH + 0.54;
  const heliPadZ = -5.8;
  const padAsphalt = mat(0x262d3d, 0.78, 0.15);
  const padMarkYellow = mat(0xfacc15, 0.35, 0.08, {
    emissive: new THREE.Color(0xca8a04),
    emissiveIntensity: 0.45,
  });
  const padBeaconCyan = mat(0x7df9ff, 0.2, 0.1, {
    emissive: new THREE.Color(0x38bdf8),
    emissiveIntensity: 1.65,
  });
  // Support steel piers under helipad
  for (const sx of [-1.85, 1.85]) {
    for (const sz of [heliPadZ - 1.85, heliPadZ + 1.85]) {
      addBox(0.22, 0.56, 0.22, ironGrille, sx, upperBaseY + upperH + 0.24, sz);
    }
  }
  // Elevated octagonal/circular helipad deck overhanging slightly for wide landing clearance
  addCyl(3.35, 3.45, 0.22, 16, padAsphalt, 0, heliPadY, heliPadZ);
  // Outer yellow safety ring + bold "H" emblem on helipad deck
  const ringGeo = new THREE.RingGeometry(2.45, 2.72, 24);
  ringGeo.rotateX(-Math.PI / 2);
  disposables.push(ringGeo);
  const ringMesh = new THREE.Mesh(ringGeo, padMarkYellow);
  ringMesh.position.set(0, heliPadY + 0.125, heliPadZ);
  group.add(ringMesh);
  addBox(0.32, 0.04, 2.55, padMarkYellow, -0.82, heliPadY + 0.125, heliPadZ);
  addBox(0.32, 0.04, 2.55, padMarkYellow, 0.82, heliPadY + 0.125, heliPadZ);
  addBox(1.8, 0.04, 0.32, padMarkYellow, 0, heliPadY + 0.125, heliPadZ);
  // 4 glowing aviation corner beacons around the AVS helipad
  for (let b = 0; b < 4; b++) {
    const ba = (b / 4) * Math.PI * 2 + Math.PI / 4;
    addCyl(0.11, 0.14, 0.26, 8, padBeaconCyan, Math.cos(ba) * 3.05, heliPadY + 0.22, heliPadZ + Math.sin(ba) * 3.05);
  }

  // 3B. Walkable Exterior East Helipad Staircase & Rooftop Skywalk Bridge
  const avsHeliDeckTopY = heliPadY + 0.11; // 7.59
  const avsStairBaseY = upperBaseY; // 4.29
  const avsStairCenterX = halfW + 0.58; // 2.88
  const avsStairWidth = 1.14;
  addBox(avsStairWidth + 0.12, 0.16, 1.45, mainConcrete, avsStairCenterX, avsStairBaseY - 0.08, 0.58);
  addBox(avsStairWidth + 0.16, 0.05, 1.48, yellowTrim, avsStairCenterX, avsStairBaseY + 0.01, 0.58);
  addBox(avsStairWidth + 0.12, 0.06, 0.06, steelRailMat, avsStairCenterX, avsStairBaseY + 0.88, 1.26);
  addBox(0.06, 0.06, 1.4, steelRailMat, avsStairCenterX + avsStairWidth / 2, avsStairBaseY + 0.88, 0.58);
  addBox(0.06, 0.9, 0.06, steelRailMat, avsStairCenterX + avsStairWidth / 2, avsStairBaseY + 0.45, 1.26);
  addBox(0.06, 0.9, 0.06, steelRailMat, avsStairCenterX - avsStairWidth / 2, avsStairBaseY + 0.45, 1.26);

  const avsCols: Array<[number, number, number]> = [
    [avsStairCenterX + 0.48, avsStairBaseY, 1.15],
    [avsStairCenterX + 0.48, (avsStairBaseY + avsHeliDeckTopY) * 0.5, -2.4],
    [avsStairCenterX + 0.48, avsHeliDeckTopY, -5.0],
    [avsStairCenterX + 0.48, avsHeliDeckTopY, -6.6],
  ];
  for (const [cx, ch, cz] of avsCols) {
    addBox(0.14, ch, 0.14, ironGrille, cx, ch * 0.5, cz);
  }

  const avsHeliSteps = 14;
  const avsHeliStartZ = -0.1;
  const avsHeliRun = 4.8;
  const avsHeliRise = avsHeliDeckTopY - avsStairBaseY;
  for (let i = 0; i < avsHeliSteps; i++) {
    const f = (i + 0.5) / avsHeliSteps;
    const sy = avsStairBaseY + f * avsHeliRise;
    const sz = avsHeliStartZ - f * avsHeliRun;
    addBox(avsStairWidth, 0.1, 0.4, stepRedTile, avsStairCenterX, sy - 0.05, sz);
    addBox(avsStairWidth + 0.02, 0.03, 0.42, i % 3 === 0 ? yellowTrim : stepDarkTread, avsStairCenterX, sy + 0.01, sz);
  }

  const avsSlopeLen = Math.hypot(avsHeliRun, avsHeliRise);
  const avsSlopePitch = Math.atan2(avsHeliRise, avsHeliRun);
  for (const rx of [avsStairCenterX - avsStairWidth / 2 + 0.04, avsStairCenterX + avsStairWidth / 2 - 0.04]) {
    const stringer = addBox(0.08, 0.16, avsSlopeLen + 0.25, ironGrille, rx, avsStairBaseY + avsHeliRise * 0.5 - 0.14, avsHeliStartZ - avsHeliRun * 0.5);
    stringer.rotation.x = avsSlopePitch;
    const hRail = addBox(0.05, 0.05, avsSlopeLen + 0.25, steelRailMat, rx, avsStairBaseY + avsHeliRise * 0.5 + 0.85, avsHeliStartZ - avsHeliRun * 0.5);
    hRail.rotation.x = avsSlopePitch;
    for (let p = 0; p <= 4; p++) {
      const pf = p / 4;
      addBox(0.045, 0.9, 0.045, steelRailMat, rx, avsStairBaseY + pf * avsHeliRise + 0.42, avsHeliStartZ - pf * avsHeliRun);
    }
  }

  addBox(1.68, 0.2, 1.85, padAsphalt, 2.65, avsHeliDeckTopY - 0.1, -5.8);
  addBox(1.72, 0.04, 0.1, padMarkYellow, 2.65, avsHeliDeckTopY + 0.02, -6.68);
  addBox(0.06, 0.06, 1.85, steelRailMat, 3.45, avsHeliDeckTopY + 0.88, -5.8);
  addBox(1.68, 0.06, 0.06, steelRailMat, 2.65, avsHeliDeckTopY + 0.88, -6.7);
  addCyl(0.09, 0.12, 0.24, 8, padBeaconCyan, 3.4, avsHeliDeckTopY + 1.05, -6.65);

  // 3B. Walkable Exterior East Helipad Staircase & Rooftop Skywalk Bridge
  //     Connects 1st-floor east balcony (localY = 4.29, lz: -0.1..1.25) smoothly up to AVS Rooftop Helipad (localY = 7.59)!
  const avsHeliDeckTopY = heliPadY + 0.11; // 7.59
  const avsStairBaseY = upperBaseY; // 4.29
  const avsStairCenterX = halfW + 0.58; // 2.88 (lx spans ~2.32..3.44)
  const avsStairWidth = 1.14;
  // Entry landing outside East 1st-floor balcony
  addBox(avsStairWidth + 0.12, 0.16, 1.45, mainConcrete, avsStairCenterX, avsStairBaseY - 0.08, 0.58);
  addBox(avsStairWidth + 0.16, 0.05, 1.48, yellowTrim, avsStairCenterX, avsStairBaseY + 0.01, 0.58);
  // Protective rail along front & outer edge of entry landing
  addBox(avsStairWidth + 0.12, 0.06, 0.06, steelRailMat, avsStairCenterX, avsStairBaseY + 0.88, 1.26);
  addBox(0.06, 0.06, 1.4, steelRailMat, avsStairCenterX + avsStairWidth / 2, avsStairBaseY + 0.88, 0.58);
  addBox(0.06, 0.9, 0.06, steelRailMat, avsStairCenterX + avsStairWidth / 2, avsStairBaseY + 0.45, 1.26);
  addBox(0.06, 0.9, 0.06, steelRailMat, avsStairCenterX - avsStairWidth / 2, avsStairBaseY + 0.45, 1.26);

  // Steel support columns grounding the AVS exterior helipad staircase to plinth base
  const avsCols: Array<[number, number, number]> = [
    [avsStairCenterX + 0.48, avsStairBaseY, 1.15],
    [avsStairCenterX + 0.48, (avsStairBaseY + avsHeliDeckTopY) * 0.5, -2.4],
    [avsStairCenterX + 0.48, avsHeliDeckTopY, -5.0],
    [avsStairCenterX + 0.48, avsHeliDeckTopY, -6.6],
  ];
  for (const [cx, ch, cz] of avsCols) {
    addBox(0.14, ch, 0.14, ironGrille, cx, ch * 0.5, cz);
  }

  // 14 Exterior Steps rising from lz = -0.1 (localY = 4.29) to lz = -4.9 (localY = 7.59)
  const avsHeliSteps = 14;
  const avsHeliStartZ = -0.1;
  const avsHeliRun = 4.8;
  const avsHeliRise = avsHeliDeckTopY - avsStairBaseY; // 3.30
  for (let i = 0; i < avsHeliSteps; i++) {
    const f = (i + 0.5) / avsHeliSteps;
    const sy = avsStairBaseY + f * avsHeliRise;
    const sz = avsHeliStartZ - f * avsHeliRun;
    addBox(avsStairWidth, 0.1, 0.4, stepRedTile, avsStairCenterX, sy - 0.05, sz);
    addBox(avsStairWidth + 0.02, 0.03, 0.42, i % 3 === 0 ? yellowTrim : stepDarkTread, avsStairCenterX, sy + 0.01, sz);
  }

  // Sloped stainless-steel stringers & handrails on both sides of the AVS helipad flight
  const avsSlopeLen = Math.hypot(avsHeliRun, avsHeliRise);
  const avsSlopePitch = Math.atan2(avsHeliRise, avsHeliRun);
  for (const rx of [avsStairCenterX - avsStairWidth / 2 + 0.04, avsStairCenterX + avsStairWidth / 2 - 0.04]) {
    const stringer = addBox(0.08, 0.16, avsSlopeLen + 0.25, ironGrille, rx, avsStairBaseY + avsHeliRise * 0.5 - 0.14, avsHeliStartZ - avsHeliRun * 0.5);
    stringer.rotation.x = avsSlopePitch;
    const hRail = addBox(0.05, 0.05, avsSlopeLen + 0.25, steelRailMat, rx, avsStairBaseY + avsHeliRise * 0.5 + 0.85, avsHeliStartZ - avsHeliRun * 0.5);
    hRail.rotation.x = avsSlopePitch;
    for (let p = 0; p <= 4; p++) {
      const pf = p / 4;
      addBox(0.045, 0.9, 0.045, steelRailMat, rx, avsStairBaseY + pf * avsHeliRise + 0.42, avsHeliStartZ - pf * avsHeliRun);
    }
  }

  // Rooftop Skywalk Bridge connecting stair top (lz: -4.9..-6.7, lx: 1.85..3.45) smoothly onto the circular AVS Helipad!
  addBox(1.68, 0.2, 1.85, padAsphalt, 2.65, avsHeliDeckTopY - 0.1, -5.8);
  addBox(1.72, 0.04, 0.1, padMarkYellow, 2.65, avsHeliDeckTopY + 0.02, -6.68);
  addBox(0.06, 0.06, 1.85, steelRailMat, 3.45, avsHeliDeckTopY + 0.88, -5.8);
  addBox(1.68, 0.06, 0.06, steelRailMat, 2.65, avsHeliDeckTopY + 0.88, -6.7);
  addCyl(0.09, 0.12, 0.24, 8, padBeaconCyan, 3.4, avsHeliDeckTopY + 1.05, -6.65);

  // 4. Exterior 6-Step Red-Tiled Entrance Staircase + Stainless-Steel Tubular Handrail
  const numSteps = 6;
  const stairW = rightPassageW - 0.12;
  const stepRun = 0.28;
  const stepRise = P / numSteps;
  const stairStartX = halfW - rightPassageW / 2 - 0.04;
  const stairStartZ = numSteps * stepRun;
  for (let i = 0; i < numSteps; i++) {
    const currentH = (i + 1) * stepRise;
    const stepZ = stairStartZ - i * stepRun - stepRun / 2;
    addBox(stairW, currentH, stepRun, stepRedTile, stairStartX, currentH / 2, stepZ);
    addBox(stairW + 0.02, 0.035, stepRun + 0.025, stepDarkTread, stairStartX, currentH + 0.015, stepZ + 0.01);
  }
  const dwarfWallD = numSteps * stepRun + 0.25;
  addBox(0.16, P + 0.18, dwarfWallD, weatheredConcrete, halfW - 0.08, (P + 0.18) / 2, dwarfWallD / 2 - 0.1);
  const railX = halfW - rightPassageW + 0.14;
  const railTopZ = 0.05;
  const railBotZ = stairStartZ - 0.12;
  const railTopY = P + 0.88;
  const railBotY = 0.88;
  const railLen = Math.hypot(railBotZ - railTopZ, railTopY - railBotY);
  const railAngle = Math.atan2(railTopY - railBotY, railBotZ - railTopZ);
  [0, 0.5, 1].forEach((t) => {
    const pz = railTopZ + (railBotZ - railTopZ) * t;
    const baseH = P * (1 - t);
    addCyl(0.022, 0.022, 0.88, 8, stainlessSteel, railX, baseH + 0.44, pz);
  });
  [0.88, 0.62, 0.38].forEach((offsetH) => {
    const bar = addCyl(0.02, 0.02, railLen + 0.15, 8, stainlessSteel, railX, (railTopY + railBotY) / 2 - (0.88 - offsetH), (railTopZ + railBotZ) / 2);
    bar.rotation.x = Math.PI / 2 - railAngle;
  });

  // 5. Interior 12-Step Granite Staircase + Black Metal Handrail
  const intSteps = 12;
  const intStairW = 0.82;
  const intStepRun = 0.25;
  const intStepRise = H1 / intSteps;
  const intStairX = halfW - wallT - intStairW / 2;
  const intStairStartZ = -frontPorchDepth - 0.55;
  for (let s = 0; s < intSteps; s++) {
    const sy = P + (s + 1) * intStepRise;
    const sz = intStairStartZ - s * intStepRun;
    addBox(intStairW, intStepRise * 1.4, intStepRun, interiorWhiteWall, intStairX, sy - intStepRise * 0.4, sz);
    addBox(intStairW + 0.02, 0.035, intStepRun + 0.02, stepDarkTread, intStairX, sy + 0.02, sz);
  }
  const intRailX = intStairX - intStairW / 2 + 0.04;
  const intRailLen = Math.hypot(intSteps * intStepRun, H1);
  const intRail = addBox(0.05, 0.05, intRailLen, ironGrille, intRailX, P + H1 / 2 + 0.88, intStairStartZ - (intSteps * intStepRun) / 2);
  intRail.rotation.x = Math.atan2(H1, intSteps * intStepRun);

  // 6. Rich Interior Rooms (Foyer, Living/Office Hall, Kitchen, Teal Bathroom)
  addBox(rightPassageW - 0.1, 0.04, foyerLen + frontPorchDepth, foyerMosaic, halfW - rightPassageW / 2, P + 0.02, -frontPorchDepth - foyerLen / 2 + 0.8);
  addBox(0.38, 0.46, 1.45, graniteBlack, halfW - rightPassageW + 0.34, P + 0.23, -frontPorchDepth - 1.15);
  // Warm Wood-Plank Floor across Living Hall & Kitchen
  addBox(W - wallT * 2, 0.04, D - frontPorchDepth - wallT, woodFloor, 0, P + 0.02, -frontPorchDepth - (D - frontPorchDepth) / 2);
  // Yellow Accent Wall + Office Counter + Sofa + Fridge + Ceiling Glow Strips
  addBox(0.05, H1 - 0.1, 2.85, interiorYellowWall, -halfW + wallT + 0.03, P + H1 / 2, -frontPorchDepth - 1.55);
  addBox(1.25, 0.74, 0.68, interiorWhiteWall, -halfW + 1.15, P + 0.37, -frontPorchDepth - 2.35);
  addBox(1.32, 0.05, 0.74, brownGate, -halfW + 1.15, P + 0.765, -frontPorchDepth - 2.35);
  addBox(0.72, 0.78, 1.85, windowFrameDark, -halfW + 0.65, P + 0.39, -frontPorchDepth - 4.15);
  addBox(0.58, 0.46, 0.92, bluePlastic, -halfW + 1.6, P + 0.23, -frontPorchDepth - 4.15);
  addBox(0.72, 1.78, 0.72, stepDarkTread, 0.48, P + 0.89, -frontPorchDepth - 4.85);
  // Warm ceiling lamp panels so the whole interior feels cozy & bright
  addBox(0.65, 0.06, 1.8, warmCeilingGlow, -0.45, P + H1 - 0.04, -frontPorchDepth - 3.2);
  addBox(0.55, 0.06, 1.4, warmCeilingGlow, -0.8, P + H1 - 0.04, -D + 2.0);
  addBox(0.45, 0.06, 1.2, warmCeilingGlow, halfW - rightPassageW / 2, P + H1 - 0.04, -frontPorchDepth - 1.6);

  // Rear Partition with Central Doorway
  const rearPartZ = -frontPorchDepth - 5.85;
  addBox(1.55, H1, 0.15, interiorWhiteWall, -halfW + wallT + 0.775, P + H1 / 2, rearPartZ);
  addBox(1.65, H1, 0.15, interiorWhiteWall, halfW - wallT - 0.825, P + H1 / 2, rearPartZ);
  addBox(1.05, H1 - 2.05, 0.15, interiorWhiteWall, -0.18, P + 2.05 + (H1 - 2.05) / 2, rearPartZ);

  // Rear Kitchen: L-shaped Black Granite Counter + Stove + Wet Grinder + Yellow/Blue Drums
  addBox(2.25, 0.06, 0.62, graniteBlack, -halfW + 1.35, P + 0.82, -D + 0.55);
  addBox(0.62, 0.06, 2.15, graniteBlack, -halfW + 0.55, P + 0.82, -D + 1.65);
  addBox(0.65, 0.09, 0.38, stainlessSteel, -halfW + 1.55, P + 0.89, -D + 0.52);
  addBox(0.42, 0.32, 0.28, whiteTrim, -halfW + 0.55, P + 1.01, -D + 1.15);
  addCyl(0.18, 0.16, 0.46, 10, yellowTank, -halfW + 1.15, P + 0.25, -D + 0.55);
  addCyl(0.18, 0.16, 0.46, 10, bluePlastic, -halfW + 1.62, P + 0.25, -D + 0.55);

  // Teal-Tiled Bathroom: Bathtub + WC + Red Stool + Grey Drum
  const bathW = 1.85;
  const bathD = 2.65;
  const bathX = halfW - wallT - bathW / 2;
  const bathZ = -D + wallT + bathD / 2;
  addBox(bathW, 0.05, bathD, bathTile, bathX, P + 0.03, bathZ);
  addBox(0.14, H1, bathD - 0.88, bathTile, bathX - bathW / 2, P + H1 / 2, -D + wallT + (bathD - 0.88) / 2);
  addBox(bathW - 0.15, 0.52, 0.78, bathTile, bathX, P + 0.26, -D + wallT + 0.42);
  addBox(bathW - 0.28, 0.08, 0.66, whiteTrim, bathX, P + 0.53, -D + wallT + 0.42);
  addBox(0.42, 0.42, 0.55, whiteTrim, bathX - bathW / 2 + 0.35, P + 0.24, bathZ + 0.45);
  addBox(0.32, 0.34, 0.32, stepRedTile, bathX + 0.25, P + 0.19, bathZ - 0.15);
  addCyl(0.24, 0.21, 0.54, 10, weatheredConcrete, bathX + 0.32, P + 0.29, bathZ + 0.38);

  // Cozy exterior porch lantern light (warm glow in snow place)
  const porchLight = new THREE.PointLight(0xffcf88, 3.2, 22, 1.5);
  porchLight.position.set(0, P + 2.6, 1.4);
  group.add(porchLight);

  const update = (lanternStrength: number) => {
    const glow = 0.55 + lanternStrength * 1.15;
    tintedGlass.emissiveIntensity = 0.22 + lanternStrength * 0.75;
    warmCeilingGlow.emissiveIntensity = 1.2 + lanternStrength * 1.1;
    porchLight.intensity = 1.8 + glow * 2.6;
  };

  return {
    group,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
