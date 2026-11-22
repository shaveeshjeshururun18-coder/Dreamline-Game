import * as THREE from 'three';
import {
  DINOSAUR_ARENA_CENTER,
  DINOSAUR_ARENA_HALF_SIZE,
  DINOSAUR_ISLAND_CENTER,
  type DinosaurIslandState,
} from '../game/dinosaurIsland';
import { groundHeightAt } from '../game/terrain';

interface DebrisPiece {
  mesh: THREE.Mesh;
  wallIndex: number;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  life: number;
}

export interface DinosaurIslandWorldSystem {
  group: THREE.Group;
  triggerWallShatter: (stage: number) => void;
  update: (state: DinosaurIslandState, elapsed: number, dt: number, lanternStrength: number) => void;
  dispose: () => void;
}

function createHazardStripeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#18181b';
  for (let x = -64; x < 320; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 18, 0);
    ctx.lineTo(x + 42, 64);
    ctx.lineTo(x + 24, 64);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(6, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createArenaBannerTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 502, 118);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SSJ DINOSAUR ISLAND', 256, 54);

  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('PAD-01N · T-REX CONTAINMENT ARENA', 256, 94);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the offshore SSJ Dinosaur Island 3D world:
 * - Sculpted multi-part animated T-Rex
 * - 4 breakable reinforced containment walls with flying physics debris chunks
 * - Composite amber-gold drivable Safari 4x4 Jeep
 * - AK-47 golden tracer beam & muzzle flash
 * - Volcanic coastal boulders, instanced jungle palms, arena floodlight towers & PAD-01N markings
 */
export function buildDinosaurIslandWorld(isSoftwareGl: boolean): DinosaurIslandWorldSystem {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const cx = DINOSAUR_ARENA_CENTER.x;
  const cz = DINOSAUR_ARENA_CENTER.z;
  const hs = DINOSAUR_ARENA_HALF_SIZE;
  const arenaY = groundHeightAt(cx, cz);

  // Shared PBR Materials
  const hazardTex = createHazardStripeTexture();
  const bannerTex = createArenaBannerTexture();
  disposables.push(hazardTex, bannerTex);

  const concreteWallMat = new THREE.MeshStandardMaterial({
    color: 0x4b5563,
    roughness: 0.9,
    metalness: 0.08,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.42,
    metalness: 0.72,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    map: hazardTex,
    roughness: 0.6,
    metalness: 0.1,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 1.6,
    roughness: 0.25,
  });
  const arenaPadMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.94,
    metalness: 0.04,
  });
  const bannerMat = new THREE.MeshStandardMaterial({
    map: bannerTex,
    emissive: new THREE.Color(0xfacc15),
    emissiveMap: bannerTex,
    emissiveIntensity: 0.32,
    roughness: 0.4,
  });
  const volcanicRockMat = new THREE.MeshStandardMaterial({
    color: 0x3f434a,
    roughness: 0.94,
    metalness: 0.04,
  });
  const palmTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x6b4f35,
    roughness: 0.9,
  });
  const palmFrondMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a3e,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  disposables.push(
    concreteWallMat,
    darkSteelMat,
    hazardMat,
    beaconMat,
    arenaPadMat,
    bannerMat,
    volcanicRockMat,
    palmTrunkMat,
    palmFrondMat
  );

  // =========================================================================
  // 1. PAD-01N ARENA FLOOR, CORNER FLOODLIGHT TOWERS & OVERHEAD GANTRY SIGN
  // =========================================================================
  const padGeo = new THREE.BoxGeometry(hs * 2 + 1.2, 0.12, hs * 2 + 1.2);
  disposables.push(padGeo);
  const padMesh = new THREE.Mesh(padGeo, arenaPadMat);
  padMesh.position.set(cx, arenaY + 0.02, cz);
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Hazard perimeter ring painted onto pad
  const stripeGeoLong = new THREE.BoxGeometry(hs * 2 - 0.6, 0.04, 0.55);
  const stripeGeoSide = new THREE.BoxGeometry(0.55, 0.04, hs * 2 - 0.6);
  disposables.push(stripeGeoLong, stripeGeoSide);
  const sN = new THREE.Mesh(stripeGeoLong, hazardMat);
  sN.position.set(cx, arenaY + 0.09, cz - hs + 0.9);
  const sS = new THREE.Mesh(stripeGeoLong, hazardMat);
  sS.position.set(cx, arenaY + 0.09, cz + hs - 0.9);
  const sW = new THREE.Mesh(stripeGeoSide, hazardMat);
  sW.position.set(cx - hs + 0.9, arenaY + 0.09, cz);
  const sE = new THREE.Mesh(stripeGeoSide, hazardMat);
  sE.position.set(cx + hs - 0.9, arenaY + 0.09, cz);
  group.add(sN, sS, sW, sE);

  // 4 Corner Steel Floodlight Towers (permanent landmarks even after walls shatter!)
  const towerPostGeo = new THREE.CylinderGeometry(0.24, 0.34, 8.2, 8);
  const towerHeadGeo = new THREE.BoxGeometry(1.5, 0.55, 0.5);
  const towerLampGeo = new THREE.BoxGeometry(1.3, 0.32, 0.15);
  disposables.push(towerPostGeo, towerHeadGeo, towerLampGeo);

  const cornerOffsets: Array<[number, number]> = [
    [-hs - 0.6, -hs - 0.6],
    [hs + 0.6, -hs - 0.6],
    [hs + 0.6, hs + 0.6],
    [-hs - 0.6, hs + 0.6],
  ];
  for (const [ox, oz] of cornerOffsets) {
    const tg = new THREE.Group();
    tg.position.set(cx + ox, arenaY, cz + oz);
    const post = new THREE.Mesh(towerPostGeo, darkSteelMat);
    post.position.y = 4.1;
    post.castShadow = !isSoftwareGl;
    tg.add(post);

    const head = new THREE.Mesh(towerHeadGeo, darkSteelMat);
    head.position.y = 8.1;
    head.lookAt(cx, arenaY + 1.5, cz);
    tg.add(head);

    const lamp = new THREE.Mesh(towerLampGeo, beaconMat);
    lamp.position.set(0, 8.05, 0);
    lamp.lookAt(cx, arenaY + 1.5, cz);
    tg.add(lamp);
    group.add(tg);
  }

  // Overhead Ranger Entrance Archway facing the NW Train Station (x: 158.8, z: cz - hs)
  const gateX = cx - 9.0;
  const gateZ = cz - hs;
  const gateGroup = new THREE.Group();
  gateGroup.position.set(gateX, arenaY, gateZ);
  const gatePillarGeo = new THREE.BoxGeometry(0.65, 5.8, 0.65);
  const gateHeaderGeo = new THREE.BoxGeometry(6.8, 1.45, 0.45);
  disposables.push(gatePillarGeo, gateHeaderGeo);
  const gpL = new THREE.Mesh(gatePillarGeo, darkSteelMat);
  gpL.position.set(-3.0, 2.9, 0);
  const gpR = new THREE.Mesh(gatePillarGeo, darkSteelMat);
  gpR.position.set(3.0, 2.9, 0);
  const gHeader = new THREE.Mesh(gateHeaderGeo, bannerMat);
  gHeader.position.set(0, 5.4, 0);
  gateGroup.add(gpL, gpR, gHeader);
  group.add(gateGroup);

  // =========================================================================
  // 2. FOUR BREAKABLE CONTAINMENT WALLS (Stages 1 -> 4) + FLYING DEBRIS POOL
  // =========================================================================
  const wallGroups: THREE.Group[] = [];
  const wallH = 4.4;
  const wallLen = hs * 2 - 0.6;

  const buildContainmentWall = (
    x: number,
    z: number,
    len: number,
    rotY: number,
    shiftX = 0
  ): THREE.Group => {
    const wg = new THREE.Group();
    wg.position.set(x, arenaY, z);
    wg.rotation.y = rotY;

    const baseH = 2.05;
    const slabGeo = new THREE.BoxGeometry(len, baseH, 0.9);
    const bandGeo = new THREE.BoxGeometry(len + 0.08, 0.48, 0.98);
    const railGeo = new THREE.BoxGeometry(len, 0.12, 0.14);
    const buttressGeo = new THREE.BoxGeometry(0.42, wallH + 0.35, 1.35);
    disposables.push(slabGeo, bandGeo, railGeo, buttressGeo);

    const slab = new THREE.Mesh(slabGeo, concreteWallMat);
    slab.position.set(shiftX, baseH * 0.5, 0);
    slab.castShadow = !isSoftwareGl;
    slab.receiveShadow = true;
    wg.add(slab);

    const hazardBand = new THREE.Mesh(bandGeo, hazardMat);
    hazardBand.position.set(shiftX, 0.72, 0);
    wg.add(hazardBand);

    // Upper Jurassic reinforced high-voltage cable rails (open sightlines to ocean & sea railway bridge!)
    for (const railY of [2.65, 3.35, 4.05, wallH + 0.4]) {
      const rail = new THREE.Mesh(railGeo, darkSteelMat);
      rail.position.set(shiftX, railY, 0);
      wg.add(rail);
    }

    const numButtresses = Math.max(4, Math.floor(len / 4.8));
    for (let b = 0; b <= numButtresses; b++) {
      const bx = shiftX - len * 0.46 + (b / numButtresses) * (len * 0.92);
      const but = new THREE.Mesh(buttressGeo, darkSteelMat);
      but.position.set(bx, wallH * 0.5 + 0.12, 0);
      wg.add(but);
    }

    group.add(wg);
    return wg;
  };

  // Wall 0 (West), Wall 1 (North — leaves NW station access archway clear), Wall 2 (East), Wall 3 (South)
  wallGroups.push(buildContainmentWall(cx - hs, cz, wallLen, Math.PI / 2));
  wallGroups.push(buildContainmentWall(cx + 4.1, cz - hs, wallLen - 8.4, 0));
  wallGroups.push(buildContainmentWall(cx + hs, cz, wallLen, Math.PI / 2));
  wallGroups.push(buildContainmentWall(cx, cz + hs, wallLen, 0));

  // Pre-allocated pool of 56 physics debris chunks (14 per wall)
  const debrisPool: DebrisPiece[] = [];
  const debrisGeoA = new THREE.BoxGeometry(1.15, 0.85, 0.78);
  const debrisGeoB = new THREE.DodecahedronGeometry(0.62, 0);
  disposables.push(debrisGeoA, debrisGeoB);

  for (let w = 0; w < 4; w++) {
    for (let k = 0; k < 14; k++) {
      const mat = k % 3 === 0 ? darkSteelMat : k % 5 === 0 ? hazardMat : concreteWallMat;
      const mesh = new THREE.Mesh(k % 2 === 0 ? debrisGeoA : debrisGeoB, mat);
      mesh.visible = false;
      mesh.castShadow = !isSoftwareGl;
      group.add(mesh);
      debrisPool.push({
        mesh,
        wallIndex: w,
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        life: 0,
      });
    }
  }

  const triggerWallShatter = (stage: number) => {
    const wallIdx = stage - 1;
    if (wallIdx < 0 || wallIdx > 3) return;
    if (wallGroups[wallIdx]) {
      wallGroups[wallIdx].visible = false;
    }

    let outDirX = 0;
    let outDirZ = 0;
    let baseX = cx;
    let baseZ = cz;
    if (wallIdx === 0) {
      baseX = cx - hs;
      outDirX = -1;
    } else if (wallIdx === 1) {
      baseX = cx + 4.0;
      baseZ = cz - hs;
      outDirZ = -1;
    } else if (wallIdx === 2) {
      baseX = cx + hs;
      outDirX = 1;
    } else {
      baseZ = cz + hs;
      outDirZ = 1;
    }

    let localIdx = 0;
    for (let i = 0; i < debrisPool.length; i++) {
      const d = debrisPool[i];
      if (d.wallIndex !== wallIdx) continue;
      const spread = (localIdx / 13 - 0.5) * (wallLen * 0.85);
      const px = outDirX !== 0 ? baseX : baseX + spread * 0.85;
      const pz = outDirZ !== 0 ? baseZ : baseZ + spread;
      const py = arenaY + 0.8 + (localIdx % 4) * 0.95;

      d.mesh.position.set(px, py, pz);
      d.mesh.rotation.set(localIdx * 0.5, localIdx * 0.9, localIdx * 0.3);
      const sc = 0.75 + (localIdx % 3) * 0.3;
      d.mesh.scale.set(sc, sc * 0.85, sc);
      d.mesh.visible = true;
      d.active = true;
      d.life = 4.5;

      const burstSpeed = 6.5 + (localIdx % 5) * 2.2;
      d.vx = outDirX * burstSpeed + Math.sin(localIdx * 1.9) * 3.2;
      d.vz = outDirZ * burstSpeed + Math.cos(localIdx * 2.3) * 3.2;
      d.vy = 4.8 + (localIdx % 4) * 2.1;
      d.rx = (localIdx % 2 === 0 ? 1 : -1) * (3.0 + (localIdx % 3));
      d.ry = (localIdx % 3 === 0 ? 1 : -1) * 4.2;
      d.rz = 2.6;
      localIdx++;
    }
  };

  // =========================================================================
  // 3. COMPOSITE MULTI-PART 3D CHASING T-REX (16+ Sculpted Articulated Parts)
  // =========================================================================
  const dinoRoot = new THREE.Group();
  const dinoBodyPivot = new THREE.Group();
  dinoRoot.add(dinoBodyPivot);

  const dinoSkinMat = new THREE.MeshStandardMaterial({
    color: 0x355e2b,
    roughness: 0.78,
    metalness: 0.06,
  });
  const dinoBellyMat = new THREE.MeshStandardMaterial({
    color: 0x7c8c54,
    roughness: 0.84,
    metalness: 0.02,
  });
  const dinoSpineMat = new THREE.MeshStandardMaterial({
    color: 0x1f3618,
    roughness: 0.72,
  });
  const dinoEyeMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 2.0,
    roughness: 0.15,
  });
  const dinoToothMat = new THREE.MeshStandardMaterial({
    color: 0xfaf7ef,
    roughness: 0.35,
  });
  disposables.push(dinoSkinMat, dinoBellyMat, dinoSpineMat, dinoEyeMat, dinoToothMat);

  // Muscular Torso & Belly
  const torsoGeo = new THREE.BoxGeometry(1.75, 1.85, 3.1);
  const bellyGeo = new THREE.BoxGeometry(1.38, 0.55, 2.5);
  disposables.push(torsoGeo, bellyGeo);
  const torso = new THREE.Mesh(torsoGeo, dinoSkinMat);
  torso.position.set(0, 2.65, 0);
  torso.rotation.x = -0.14;
  torso.castShadow = !isSoftwareGl;
  dinoBodyPivot.add(torso);

  const belly = new THREE.Mesh(bellyGeo, dinoBellyMat);
  belly.position.set(0, 1.82, 0.1);
  belly.rotation.x = -0.14;
  dinoBodyPivot.add(belly);

  // Dorsal Ridge Spines
  const spineGeo = new THREE.ConeGeometry(0.18, 0.48, 5);
  disposables.push(spineGeo);
  for (let sp = 0; sp < 5; sp++) {
    const spike = new THREE.Mesh(spineGeo, dinoSpineMat);
    spike.position.set(0, 3.65 - sp * 0.1, 1.0 - sp * 0.65);
    spike.rotation.x = -0.25;
    dinoBodyPivot.add(spike);
  }

  // Articulated Tapering Tail (3 segments)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 2.75, -1.45);
  const tailGeo1 = new THREE.BoxGeometry(1.1, 1.15, 1.9);
  const tailGeo2 = new THREE.BoxGeometry(0.72, 0.78, 1.85);
  const tailGeo3 = new THREE.ConeGeometry(0.38, 1.8, 6);
  tailGeo3.rotateX(-Math.PI / 2);
  disposables.push(tailGeo1, tailGeo2, tailGeo3);

  const tail1 = new THREE.Mesh(tailGeo1, dinoSkinMat);
  tail1.position.set(0, -0.05, -0.9);
  tail1.castShadow = !isSoftwareGl;
  const tail2 = new THREE.Mesh(tailGeo2, dinoSkinMat);
  tail2.position.set(0, -0.12, -2.55);
  const tail3 = new THREE.Mesh(tailGeo3, dinoSpineMat);
  tail3.position.set(0, -0.16, -4.15);
  tailPivot.add(tail1, tail2, tail3);
  dinoBodyPivot.add(tailPivot);

  // Curved Neck + Fierce Skull + Hinged Lower Jaw + Teeth + Glowing Eyes
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, 3.2, 1.25);
  const neckGeo = new THREE.BoxGeometry(1.15, 1.45, 1.2);
  const headUpperGeo = new THREE.BoxGeometry(1.38, 1.02, 2.05);
  const snoutGeo = new THREE.BoxGeometry(1.12, 0.65, 1.25);
  const jawGeo = new THREE.BoxGeometry(1.05, 0.36, 1.75);
  const eyeGeo = new THREE.SphereGeometry(0.16, 8, 8);
  const toothGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
  toothGeo.rotateX(Math.PI);
  disposables.push(neckGeo, headUpperGeo, snoutGeo, jawGeo, eyeGeo, toothGeo);

  const neck = new THREE.Mesh(neckGeo, dinoSkinMat);
  neck.position.set(0, 0.52, 0.35);
  neck.rotation.x = 0.35;
  neck.castShadow = !isSoftwareGl;
  neckPivot.add(neck);

  const headUpper = new THREE.Mesh(headUpperGeo, dinoSkinMat);
  headUpper.position.set(0, 1.38, 1.05);
  headUpper.castShadow = !isSoftwareGl;
  neckPivot.add(headUpper);

  const snout = new THREE.Mesh(snoutGeo, dinoSkinMat);
  snout.position.set(0, 1.28, 2.15);
  neckPivot.add(snout);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, dinoEyeMat);
    eye.position.set(side * 0.68, 1.62, 1.35);
    neckPivot.add(eye);
  }
  for (let t = 0; t < 4; t++) {
    for (const side of [-1, 1]) {
      const tooth = new THREE.Mesh(toothGeo, dinoToothMat);
      tooth.position.set(side * 0.44, 0.88, 1.35 + t * 0.36);
      neckPivot.add(tooth);
    }
  }

  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, 0.85, 0.95);
  const jawMesh = new THREE.Mesh(jawGeo, dinoBellyMat);
  jawMesh.position.set(0, -0.15, 0.85);
  jawPivot.add(jawMesh);
  neckPivot.add(jawPivot);
  dinoBodyPivot.add(neckPivot);

  // Tiny Iconic T-Rex Arms
  const armGeo = new THREE.BoxGeometry(0.28, 0.72, 0.32);
  disposables.push(armGeo);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, dinoSkinMat);
    arm.position.set(side * 0.95, 2.45, 1.25);
    arm.rotation.x = -0.65;
    dinoBodyPivot.add(arm);
  }

  // Articulated Muscular Hind Legs (Left & Right Pivots)
  const thighGeo = new THREE.BoxGeometry(0.68, 1.55, 1.02);
  const shinGeo = new THREE.BoxGeometry(0.46, 1.35, 0.56);
  const footGeo = new THREE.BoxGeometry(0.76, 0.28, 1.12);
  disposables.push(thighGeo, shinGeo, footGeo);

  const makeHindLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.96, 2.25, -0.2);
    const thigh = new THREE.Mesh(thighGeo, dinoSkinMat);
    thigh.position.set(0, -0.45, 0.05);
    thigh.rotation.x = 0.2;
    thigh.castShadow = !isSoftwareGl;
    const shin = new THREE.Mesh(shinGeo, dinoSkinMat);
    shin.position.set(0, -1.45, -0.15);
    shin.rotation.x = -0.18;
    const foot = new THREE.Mesh(footGeo, dinoSpineMat);
    foot.position.set(0, -2.12, 0.22);
    pivot.add(thigh, shin, foot);
    dinoBodyPivot.add(pivot);
    return pivot;
  };
  const leftLegPivot = makeHindLeg(-1);
  const rightLegPivot = makeHindLeg(1);

  group.add(dinoRoot);

  // =========================================================================
  // 4. COMPOSITE DRIVABLE SAFARI 4x4 JEEP (Amber-Gold Rugged Expedition Car)
  // =========================================================================
  const carRoot = new THREE.Group();
  const safariBodyMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.42,
    metalness: 0.22,
  });
  const safariTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.35,
  });
  const safariGlassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.14,
    metalness: 0.45,
    transparent: true,
    opacity: 0.72,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.92,
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.3,
    metalness: 0.8,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: new THREE.Color(0xfde047),
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: new THREE.Color(0xdc2626),
    emissiveIntensity: 1.2,
    roughness: 0.25,
  });
  disposables.push(
    safariBodyMat,
    safariTrimMat,
    safariGlassMat,
    tireMat,
    hubMat,
    headlightMat,
    tailLightMat
  );

  // Lower Chassis + Hood + Open Roll-Cage Cabin + Bumpers + Spare Tire
  const carHullGeo = new THREE.BoxGeometry(2.05, 0.82, 4.35);
  const carHoodGeo = new THREE.BoxGeometry(1.88, 0.36, 1.55);
  const carCabinGeo = new THREE.BoxGeometry(1.85, 0.92, 2.05);
  const carGlassGeo = new THREE.BoxGeometry(1.78, 0.62, 0.12);
  const bumperGeo = new THREE.BoxGeometry(2.15, 0.34, 0.34);
  const rackGeo = new THREE.BoxGeometry(1.75, 0.12, 1.85);
  const lampGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10);
  lampGeo.rotateX(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.38, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 10);
  hubGeo.rotateZ(Math.PI / 2);
  disposables.push(
    carHullGeo,
    carHoodGeo,
    carCabinGeo,
    carGlassGeo,
    bumperGeo,
    rackGeo,
    lampGeo,
    wheelGeo,
    hubGeo
  );

  const carHull = new THREE.Mesh(carHullGeo, safariBodyMat);
  carHull.position.set(0, 0.88, 0);
  carHull.castShadow = !isSoftwareGl;
  carHull.receiveShadow = true;
  carRoot.add(carHull);

  const carHood = new THREE.Mesh(carHoodGeo, safariBodyMat);
  carHood.position.set(0, 1.38, 1.32);
  carHood.castShadow = !isSoftwareGl;
  carRoot.add(carHood);

  const carRoof = new THREE.Mesh(rackGeo, safariTrimMat);
  carRoof.position.set(0, 2.15, -0.35);
  carRoot.add(carRoof);

  // 4 Roll-cage pillars
  const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.95, 6);
  disposables.push(pillarGeo);
  for (const px of [-0.82, 0.82]) {
    for (const pz of [-1.25, 0.52]) {
      const pil = new THREE.Mesh(pillarGeo, safariTrimMat);
      pil.position.set(px, 1.72, pz);
      carRoot.add(pil);
    }
  }

  const windshield = new THREE.Mesh(carGlassGeo, safariGlassMat);
  windshield.position.set(0, 1.68, 0.62);
  windshield.rotation.x = -0.25;
  carRoot.add(windshield);

  const frontBumper = new THREE.Mesh(bumperGeo, safariTrimMat);
  frontBumper.position.set(0, 0.68, 2.22);
  const rearBumper = new THREE.Mesh(bumperGeo, safariTrimMat);
  rearBumper.position.set(0, 0.68, -2.22);
  carRoot.add(frontBumper, rearBumper);

  // Rear Spare Tire mounted on tailgate
  const spareTire = new THREE.Mesh(wheelGeo, tireMat);
  spareTire.rotation.y = Math.PI / 2;
  spareTire.position.set(0, 1.15, -2.26);
  carRoot.add(spareTire);

  // Dual Headlights & Tail Lights
  for (const sx of [-0.68, 0.68]) {
    const hl = new THREE.Mesh(lampGeo, headlightMat);
    hl.position.set(sx, 1.02, 2.18);
    const tl = new THREE.Mesh(lampGeo, tailLightMat);
    tl.position.set(sx, 1.02, -2.18);
    carRoot.add(hl, tl);
  }

  // 4 Steering/Spinning Off-road Wheels
  const frontSteerPivots: THREE.Group[] = [];
  const wheelSpinMeshes: THREE.Group[] = [];
  const wheelCoords: Array<[number, number, boolean]> = [
    [-1.08, 1.38, true],
    [1.08, 1.38, true],
    [-1.08, -1.38, false],
    [1.08, -1.38, false],
  ];
  for (const [wx, wz, isFront] of wheelCoords) {
    const steerGroup = new THREE.Group();
    steerGroup.position.set(wx, 0.46, wz);
    const spinGroup = new THREE.Group();
    spinGroup.add(new THREE.Mesh(wheelGeo, tireMat));
    spinGroup.add(new THREE.Mesh(hubGeo, hubMat));
    steerGroup.add(spinGroup);
    carRoot.add(steerGroup);
    if (isFront) frontSteerPivots.push(steerGroup);
    wheelSpinMeshes.push(spinGroup);
  }

  group.add(carRoot);

  // =========================================================================
  // 5. AK-47 GOLDEN TRACER BEAM & MUZZLE FLASH (Pre-allocated, Zero GC)
  // =========================================================================
  const tracerMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.95,
  });
  const tracerGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6);
  tracerGeo.rotateX(Math.PI / 2);
  const muzzleGeo = new THREE.SphereGeometry(0.32, 8, 8);
  const muzzleMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.92,
  });
  disposables.push(tracerMat, tracerGeo, muzzleGeo, muzzleMat);

  const tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
  tracerMesh.visible = false;
  const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzleMesh.visible = false;
  group.add(tracerMesh, muzzleMesh);

  // =========================================================================
  // 6. PREHISTORIC ISLAND ENVIRONMENT (Volcanic Boulders & Jungle Palms)
  // =========================================================================
  const rockGeo = new THREE.DodecahedronGeometry(1.6, 0);
  disposables.push(rockGeo);
  const rockPositions: Array<[number, number, number]> = [];
  for (let i = 0; i < 22; i++) {
    const ang = (i / 22) * Math.PI * 2;
    // Leave NW railway station approach corridor open (ang around -2.35 rad)
    if (ang > 3.55 && ang < 4.55) continue;
    const rad = 23.2 + (i % 3) * 2.2;
    const rx = DINOSAUR_ISLAND_CENTER.x + Math.cos(ang) * rad;
    const rz = DINOSAUR_ISLAND_CENTER.z + Math.sin(ang) * rad;
    // Keep strictly outside the PAD-01N containment wall perimeter so boulders never clip through walls
    if (Math.abs(rx - cx) < hs + 3.6 && Math.abs(rz - cz) < hs + 3.6) continue;
    const scale = 0.85 + (i % 4) * 0.4;
    rockPositions.push([rx, rz, scale]);
  }
  const rockInst = new THREE.InstancedMesh(rockGeo, volcanicRockMat, rockPositions.length);
  const dummy = new THREE.Object3D();
  rockPositions.forEach(([rx, rz, sc], idx) => {
    const ry = groundHeightAt(rx, rz);
    dummy.position.set(rx, ry + sc * 0.45, rz);
    dummy.rotation.set(idx * 0.4, idx * 1.1, idx * 0.25);
    dummy.scale.set(sc * 1.25, sc * 0.85, sc);
    dummy.updateMatrix();
    rockInst.setMatrixAt(idx, dummy.matrix);
  });
  rockInst.instanceMatrix.needsUpdate = true;
  rockInst.receiveShadow = true;
  group.add(rockInst);

  // Tropical Jungle Palms ringing Dinosaur Island outside the arena
  const palmSpots: Array<[number, number, number]> = [];
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + 0.18;
    if (ang > 3.5 && ang < 4.65) continue;
    const rad = 21.8 + (i % 2) * 3.6;
    const px = DINOSAUR_ISLAND_CENTER.x + Math.cos(ang) * rad;
    const pz = DINOSAUR_ISLAND_CENTER.z + Math.sin(ang) * rad;
    if (Math.abs(px - cx) < hs + 2.8 && Math.abs(pz - cz) < hs + 2.8) continue;
    palmSpots.push([px, pz, 0.9 + (i % 3) * 0.24]);
  }
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 6.2, 7);
  const frondGeo = new THREE.ConeGeometry(1.15, 3.6, 5);
  frondGeo.rotateX(Math.PI * 0.38);
  disposables.push(trunkGeo, frondGeo);

  const trunkInst = new THREE.InstancedMesh(trunkGeo, palmTrunkMat, palmSpots.length);
  const frondInst = new THREE.InstancedMesh(frondGeo, palmFrondMat, palmSpots.length * 5);
  let frondIdx = 0;
  palmSpots.forEach(([px, pz, sc], idx) => {
    const py = groundHeightAt(px, pz);
    dummy.position.set(px, py + 3.0 * sc, pz);
    dummy.rotation.set(0.08 * Math.sin(idx), idx * 1.4, 0.08 * Math.cos(idx));
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    for (let f = 0; f < 5; f++) {
      const fAng = (f / 5) * Math.PI * 2 + idx * 0.5;
      dummy.position.set(
        px + Math.cos(fAng) * 1.2 * sc,
        py + 5.7 * sc,
        pz + Math.sin(fAng) * 1.2 * sc
      );
      dummy.rotation.set(0, -fAng + Math.PI / 2, 0);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      frondInst.setMatrixAt(frondIdx++, dummy.matrix);
    }
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  frondInst.instanceMatrix.needsUpdate = true;
  trunkInst.castShadow = !isSoftwareGl;
  frondInst.castShadow = !isSoftwareGl;
  group.add(trunkInst, frondInst);

  // Reusable scratch vectors for zero-GC update
  const tmpFrom = new THREE.Vector3();
  const tmpTo = new THREE.Vector3();
  const tmpMid = new THREE.Vector3();

  const update = (
    state: DinosaurIslandState,
    elapsed: number,
    dt: number,
    lanternStrength: number
  ) => {
    // 1. Sync wall visibility (handles resets or load)
    for (let i = 0; i < 4; i++) {
      if (wallGroups[i]) {
        wallGroups[i].visible = state.wallsIntact[i];
      }
    }

    // 2. Step flying wall debris physics
    for (let i = 0; i < debrisPool.length; i++) {
      const d = debrisPool[i];
      if (!d.active) continue;
      d.life -= dt;
      if (d.life <= 0) {
        d.active = false;
        d.mesh.visible = false;
        continue;
      }
      d.vy -= 18.0 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.x += d.rx * dt;
      d.mesh.rotation.y += d.ry * dt;
      d.mesh.rotation.z += d.rz * dt;

      const floorY = arenaY + 0.35;
      if (d.mesh.position.y < floorY) {
        d.mesh.position.y = floorY;
        d.vy *= -0.32;
        d.vx *= 0.78;
        d.vz *= 0.78;
        d.rx *= 0.7;
        d.ry *= 0.7;
        d.rz *= 0.7;
      }
    }

    // 3. Animate T-Rex position, stride, roar jaw, tail wag & defeat collapse
    const dinoGroundY = groundHeightAt(state.dinoX, state.dinoZ);
    dinoRoot.position.set(state.dinoX, dinoGroundY, state.dinoZ);
    dinoRoot.rotation.y = state.dinoHeading;

    const c = state.dinoCollapse;
    dinoBodyPivot.rotation.z = c * (Math.PI * 0.46);
    dinoBodyPivot.position.y = -c * 1.15 + (1 - c) * Math.abs(Math.sin(state.dinoRunPhase)) * 0.24;

    const stride = (1 - c) * Math.sin(state.dinoRunPhase);
    leftLegPivot.rotation.x = stride * 0.65;
    rightLegPivot.rotation.x = -stride * 0.65;
    tailPivot.rotation.y = Math.sin(elapsed * 3.8) * 0.28 * (1 - c);

    const roarOpen = state.dinoRoarTimer > 0 ? 0.42 + Math.sin(elapsed * 18) * 0.14 : 0.14 + Math.sin(elapsed * 4.5) * 0.08;
    jawPivot.rotation.x = (1 - c) * roarOpen;
    dinoEyeMat.emissiveIntensity = state.dinoAlive ? 1.8 + lanternStrength * 0.9 : 0.15;

    // 4. Update Safari Car transform & wheel steering/spin
    const carGroundY = groundHeightAt(state.safariCar.x, state.safariCar.z);
    carRoot.position.set(state.safariCar.x, carGroundY + 0.04, state.safariCar.z);
    carRoot.rotation.y = state.safariCar.heading;
    for (const pivot of frontSteerPivots) {
      pivot.rotation.y = state.safariCar.steerAngle;
    }
    for (const w of wheelSpinMeshes) {
      w.rotation.x = state.safariCar.wheelSpin;
    }

    // 5. Update AK-47 Golden Tracer Beam & Muzzle Flash
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
      const pulse = 0.8 + Math.sin(elapsed * 60) * 0.35;
      muzzleMesh.scale.set(pulse, pulse, pulse);
      muzzleMesh.visible = true;
    } else {
      tracerMesh.visible = false;
      muzzleMesh.visible = false;
    }

    // 6. Floodlight glow intensity scales warmly at dusk/night
    beaconMat.emissiveIntensity = 1.2 + lanternStrength * 1.4;
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    group,
    triggerWallShatter,
    update,
    dispose,
  };
}
