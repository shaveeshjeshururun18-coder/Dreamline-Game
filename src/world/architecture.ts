import * as THREE from 'three';
import type { AabbCollider } from '../game/terrain';
import {
  groundHeightAt,
  HILL_CENTER,
  isOceanAt,
  VILLAGE_CENTER,
} from '../game/terrain';
import {
  CROSSING_POINT,
  RAILWAY_TOTAL_LENGTH,
  sampleRailway,
  STATIONS,
} from '../game/railway';
import type { InteractableItem } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface WorldArchitecture {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  toggleStationDoor: () => boolean;
  update: (params: {
    elapsed: number;
    dt: number;
    timeHours: number;
    lanternStrength: number;
    trainDistToCrossing: number;
  }) => void;
  dispose: () => void;
}

export function createWorldArchitecture(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): WorldArchitecture {
  const group = new THREE.Group();
  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const warmGlowMaterials: THREE.MeshStandardMaterial[] = [];
  const warmPointLights: Array<{ light: THREE.PointLight; maxIntensity: number }> = [];

  // Shared PBR Materials with calibrated roughness/metalness contrast
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.04,
  });
  const darkTimberMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c26,
    roughness: 0.84,
    metalness: 0.05,
  });
  const plasterMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.plasterWall,
    roughness: 0.9,
    metalness: 0.0,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.roofTile,
    roughness: 0.65,
    metalness: 0.16,
  });
  const canopyMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2c3040,
    roughness: 0.45,
    metalness: 0.55,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x5f6473,
    roughness: 0.36,
    metalness: 0.78,
  });
  const railSteelMat = new THREE.MeshStandardMaterial({
    color: 0x878d9c,
    roughness: 0.25,
    metalness: 0.88,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.concretePlatform,
    roughness: 0.88,
    metalness: 0.04,
  });
  const tactileMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.tactileStrip,
    roughness: 0.75,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const ballastMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.gravelBallast,
    roughness: 0.95,
    metalness: 0.0,
  });
  const sleeperMat = new THREE.MeshStandardMaterial({
    color: 0x453429,
    roughness: 0.92,
    metalness: 0.02,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x6f6c74,
    roughness: 0.9,
    metalness: 0.05,
  });
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x252230 });
  const redAccentMat = new THREE.MeshStandardMaterial({
    color: 0xc2463d,
    roughness: 0.48,
    metalness: 0.22,
  });
  const benchWoodMat = new THREE.MeshStandardMaterial({
    color: 0x8d6346,
    roughness: 0.74,
    metalness: 0.04,
  });

  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b3,
    emissive: new THREE.Color(0xffb454),
    emissiveIntensity: 1.5,
    roughness: 0.22,
    metalness: 0.1,
  });
  warmGlowMaterials.push(windowGlowMat);

  const lampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: new THREE.Color(0xffc26b),
    emissiveIntensity: 2.2,
    roughness: 0.15,
    metalness: 0.0,
  });
  warmGlowMaterials.push(lampBulbMat);

  const crossingLampMat = new THREE.MeshStandardMaterial({
    color: 0x441414,
    emissive: new THREE.Color(0xff2b2b),
    emissiveIntensity: 0.0,
    roughness: 0.25,
    metalness: 0.1,
  });

  const signalGreenMat = new THREE.MeshStandardMaterial({
    color: 0x9cf7c8,
    emissive: new THREE.Color(0x35e085),
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.1,
  });

  disposables.push(
    woodMat,
    darkTimberMat,
    plasterMat,
    roofMat,
    canopyMetalMat,
    steelMat,
    railSteelMat,
    concreteMat,
    tactileMat,
    ballastMat,
    sleeperMat,
    stoneMat,
    wireMat,
    redAccentMat,
    benchWoodMat,
    windowGlowMat,
    lampBulbMat,
    crossingLampMat,
    signalGreenMat
  );

  const addBox = (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    castShadow = true,
    receiveShadow = true
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow && !isSoftwareGl;
    mesh.receiveShadow = receiveShadow;
    parent.add(mesh);
    return mesh;
  };

  // Helper: Composite wooden bench (5 parts: seat planks, backrest, 2 legs, cross rail)
  const addBench = (
    x: number,
    y: number,
    z: number,
    rotY: number,
    id: string,
    label: string,
    locationId: string
  ) => {
    const bg = new THREE.Group();
    bg.position.set(x, y, z);
    bg.rotation.y = rotY;
    addBox(bg, 1.9, 0.08, 0.48, benchWoodMat, 0, 0.46, 0);
    addBox(bg, 1.9, 0.36, 0.07, benchWoodMat, 0, 0.78, -0.2);
    addBox(bg, 0.08, 0.46, 0.42, darkTimberMat, -0.78, 0.23, 0);
    addBox(bg, 0.08, 0.46, 0.42, darkTimberMat, 0.78, 0.23, 0);
    addBox(bg, 1.56, 0.07, 0.07, darkTimberMat, 0, 0.2, 0);
    group.add(bg);

    interactables.push({
      id,
      kind: 'bench',
      label,
      x,
      y: y + 0.45,
      z,
      facingAngle: rotY,
      radius: 2.3,
      locationId,
    });
  };

  // Helper: Composite Street / Platform Lamp Post (4 parts)
  const addLampPost = (x: number, y: number, z: number, withPointLight = false) => {
    const lg = new THREE.Group();
    lg.position.set(x, y, z);
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.09, 3.8, 8);
    const capGeo = new THREE.ConeGeometry(0.28, 0.18, 8);
    const bulbGeo = new THREE.SphereGeometry(0.14, 10, 8);
    disposables.push(poleGeo, capGeo, bulbGeo);

    const pole = new THREE.Mesh(poleGeo, steelMat);
    pole.position.y = 1.9;
    pole.castShadow = !isSoftwareGl;
    lg.add(pole);

    addBox(lg, 0.72, 0.06, 0.06, steelMat, 0.34, 3.72, 0);
    const cap = new THREE.Mesh(capGeo, canopyMetalMat);
    cap.position.set(0.64, 3.66, 0);
    lg.add(cap);

    const bulb = new THREE.Mesh(bulbGeo, lampBulbMat);
    bulb.position.set(0.64, 3.52, 0);
    lg.add(bulb);

    if (withPointLight && warmPointLights.length < 5) {
      const pl = new THREE.PointLight(0xffb866, 4.5, 22, 1.5);
      pl.position.set(0.64, 3.3, 0);
      lg.add(pl);
      warmPointLights.push({ light: pl, maxIntensity: 5.2 });
    }
    group.add(lg);
  };

  // =========================================================================
  // 1. CONTINUOUS RAILWAY TRACKS, GRAVEL BALLAST, SLEEPERS, SEA BRIDGE & CATENARY
  // =========================================================================
  const trackSegs = 560;
  const railGaugeHalf = 0.62;
  const leftRailPts: THREE.Vector3[] = [];
  const rightRailPts: THREE.Vector3[] = [];
  const wirePts: THREE.Vector3[] = [];
  const ballastPositions: number[] = [];
  const ballastUvs: number[] = [];
  const ballastIndices: number[] = [];

  for (let i = 0; i <= trackSegs; i++) {
    const t = i / trackSegs;
    const s = sampleRailway(t);
    const nx = -s.tz;
    const nz = s.tx;

    leftRailPts.push(new THREE.Vector3(s.x + nx * railGaugeHalf, s.y + 0.09, s.z + nz * railGaugeHalf));
    rightRailPts.push(new THREE.Vector3(s.x - nx * railGaugeHalf, s.y + 0.09, s.z - nz * railGaugeHalf));

    // Slight natural sag in overhead catenary wire between poles
    const poleSpan = 16;
    const wireSag = Math.sin((i % poleSpan) / poleSpan * Math.PI) * 0.16;
    wirePts.push(new THREE.Vector3(s.x, s.y + 5.35 - wireSag, s.z));

    // Gravel ballast ribbon
    const halfW = 1.65;
    ballastPositions.push(
      s.x - nx * halfW, s.y - 0.04, s.z - nz * halfW,
      s.x + nx * halfW, s.y - 0.04, s.z + nz * halfW
    );
    ballastUvs.push(0, t * 72, 1, t * 72);

    if (i < trackSegs) {
      const base = i * 2;
      ballastIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const ballastGeo = new THREE.BufferGeometry();
  ballastGeo.setAttribute('position', new THREE.Float32BufferAttribute(ballastPositions, 3));
  ballastGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ballastUvs, 2));
  ballastGeo.setIndex(ballastIndices);
  ballastGeo.computeVertexNormals();
  disposables.push(ballastGeo);
  const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
  ballastMesh.receiveShadow = true;
  group.add(ballastMesh);

  // Dual steel rails using smooth TubeGeometry
  const leftCurve = new THREE.CatmullRomCurve3(leftRailPts.slice(0, -1), true);
  const rightCurve = new THREE.CatmullRomCurve3(rightRailPts.slice(0, -1), true);
  const wireCurve = new THREE.CatmullRomCurve3(wirePts.slice(0, -1), true);

  const railGeoL = new THREE.TubeGeometry(leftCurve, 560, 0.055, 5, true);
  const railGeoR = new THREE.TubeGeometry(rightCurve, 560, 0.055, 5, true);
  const wireGeo = new THREE.TubeGeometry(wireCurve, 440, 0.022, 4, true);
  disposables.push(railGeoL, railGeoR, wireGeo);

  group.add(new THREE.Mesh(railGeoL, railSteelMat));
  group.add(new THREE.Mesh(railGeoR, railSteelMat));
  group.add(new THREE.Mesh(wireGeo, wireMat));

  // Instanced Wooden Sleepers along the entire railway loop
  const sleeperCount = Math.floor(RAILWAY_TOTAL_LENGTH / 0.85);
  const sleeperGeo = new THREE.BoxGeometry(2.15, 0.1, 0.22);
  disposables.push(sleeperGeo);
  const sleepersMesh = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleepersMesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < sleeperCount; i++) {
    const s = sampleRailway(i / sleeperCount);
    dummy.position.set(s.x, s.y + 0.01, s.z);
    dummy.rotation.set(0, s.angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    sleepersMesh.setMatrixAt(i, dummy.matrix);
  }
  sleepersMesh.instanceMatrix.needsUpdate = true;
  sleepersMesh.computeBoundingSphere();
  group.add(sleepersMesh);

  // Ocean Railway Bridge / Sea Viaduct spanning across open sea water to SSJ Dinosaur Island!
  const seaBridgeDeckSamples: Array<{ x: number; z: number; angle: number; nx: number; nz: number }> = [];
  const bridgeCheckCount = 460;
  for (let i = 0; i < bridgeCheckCount; i++) {
    const s = sampleRailway(i / bridgeCheckCount);
    if (isOceanAt(s.x, s.z)) {
      seaBridgeDeckSamples.push({
        x: s.x,
        z: s.z,
        angle: s.angle,
        nx: -s.tz,
        nz: s.tx,
      });
    }
  }
  if (seaBridgeDeckSamples.length > 0) {
    const segLen = (RAILWAY_TOTAL_LENGTH / bridgeCheckCount) * 1.18;
    const deckGeo = new THREE.BoxGeometry(4.6, 0.44, segLen);
    const girderGeo = new THREE.BoxGeometry(0.22, 0.88, segLen);
    const pierGeo = new THREE.CylinderGeometry(0.42, 0.56, 3.2, 8);
    disposables.push(deckGeo, girderGeo, pierGeo);

    const deckInst = new THREE.InstancedMesh(deckGeo, concreteMat, seaBridgeDeckSamples.length);
    const girderInst = new THREE.InstancedMesh(girderGeo, redAccentMat, seaBridgeDeckSamples.length * 2);
    const pierIndices: number[] = [];
    seaBridgeDeckSamples.forEach((b, idx) => {
      dummy.position.set(b.x, -0.14, b.z);
      dummy.rotation.set(0, b.angle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      deckInst.setMatrixAt(idx, dummy.matrix);

      for (let sideIdx = 0; sideIdx < 2; sideIdx++) {
        const side = sideIdx === 0 ? -1 : 1;
        dummy.position.set(b.x + b.nx * 2.28 * side, 0.42, b.z + b.nz * 2.28 * side);
        dummy.rotation.set(0, b.angle, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        girderInst.setMatrixAt(idx * 2 + sideIdx, dummy.matrix);
      }

      if (idx % 4 === 0) pierIndices.push(idx);
    });
    deckInst.instanceMatrix.needsUpdate = true;
    deckInst.receiveShadow = true;
    girderInst.instanceMatrix.needsUpdate = true;
    group.add(deckInst, girderInst);

    const pierInst = new THREE.InstancedMesh(pierGeo, stoneMat, pierIndices.length * 2);
    let pCursor = 0;
    for (const idx of pierIndices) {
      const b = seaBridgeDeckSamples[idx];
      for (const side of [-1.55, 1.55]) {
        dummy.position.set(b.x + b.nx * side, -1.75, b.z + b.nz * side);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pierInst.setMatrixAt(pCursor++, dummy.matrix);
      }
    }
    pierInst.instanceMatrix.needsUpdate = true;
    group.add(pierInst);
  }

  // Overhead Catenary Utility Poles & Railway Signals (every ~18m along loop)
  const poleCount = 56;
  const catPoleGeo = new THREE.CylinderGeometry(0.09, 0.13, 6.2, 7);
  const catArmGeo = new THREE.BoxGeometry(2.8, 0.09, 0.09);
  disposables.push(catPoleGeo, catArmGeo);

  for (let i = 0; i < poleCount; i++) {
    const t = i / poleCount;
    const s = sampleRailway(t);
    // Skip poles inside the stone tunnel region
    if (s.z < -56 && s.x > -4 && s.x < 24) continue;
    const nx = -s.tz;
    const nz = s.tx;
    const side = 1;
    const px = s.x + nx * 2.55 * side;
    const pz = s.z + nz * 2.55 * side;

    const pg = new THREE.Group();
    pg.position.set(px, 0, pz);
    pg.rotation.y = s.angle;

    const pole = new THREE.Mesh(catPoleGeo, steelMat);
    pole.position.y = 3.1;
    pole.castShadow = !isSoftwareGl;
    pg.add(pole);

    const arm = new THREE.Mesh(catArmGeo, steelMat);
    arm.position.set(-1.35 * side, 5.5, 0);
    pg.add(arm);

    const brace = new THREE.Mesh(catArmGeo, steelMat);
    brace.scale.set(0.75, 0.65, 0.65);
    brace.position.set(-1.05 * side, 5.15, 0);
    brace.rotation.z = 0.25 * side;
    pg.add(brace);

    // Every 6th pole has a glowing green railway signal light
    if (i % 6 === 1) {
      addBox(pg, 0.34, 0.9, 0.28, canopyMetalMat, -0.45 * side, 3.6, 0.12, false, false);
      const sigBulbGeo = new THREE.SphereGeometry(0.1, 8, 8);
      disposables.push(sigBulbGeo);
      const sigBulb = new THREE.Mesh(sigBulbGeo, signalGreenMat);
      sigBulb.position.set(-0.45 * side, 3.78, 0.26);
      pg.add(sigBulb);
    }

    group.add(pg);
  }

  // =========================================================================
  // 2. SAKURAGAWA MAIN STATION (桜川駅) — Hero Landmark
  // =========================================================================
  const mainStationGroup = new THREE.Group();
  const mainSignTex = textures.createStationSign('Shavish Jeshurun Sa', 'ஷவீஷ் ஜெஷுருன் சா', 'Thendral Malai', 'Neelam Eri');

  // Elevated Concrete Platform (x: -13.5..13.5, z: 12.1..16.5, top y = 0.85)
  addBox(mainStationGroup, 27.0, 0.85, 4.4, concreteMat, 0, 0.425, 14.3, true, true);
  // Platform steps on southern entrance
  addBox(mainStationGroup, 6.4, 0.56, 0.55, concreteMat, 0, 0.28, 16.75);
  addBox(mainStationGroup, 6.4, 0.28, 0.55, concreteMat, 0, 0.14, 17.25);
  // Yellow Tactile Safety Strip along track edge (offset +0.02 on Y to prevent Z-fighting)
  addBox(mainStationGroup, 26.6, 0.025, 0.44, tactileMat, 0, 0.865, 12.55, false, true);

  // Dark Corrugated Canopy Roof supported by iconic Y-shaped columns (matching reference images!)
  const canopyRoof = addBox(mainStationGroup, 16.8, 0.22, 3.9, canopyMetalMat, -0.5, 4.15, 14.35);
  canopyRoof.rotation.x = 0.09; // gentle drainage slope
  addBox(mainStationGroup, 17.1, 0.14, 0.18, darkTimberMat, -0.5, 3.98, 12.45);

  const colXs = [-7.2, -1.8, 3.6, 6.8];
  colXs.forEach((cx) => {
    addBox(mainStationGroup, 0.22, 3.25, 0.22, darkTimberMat, cx, 2.45, 14.35);
    // Y-brace arms
    const b1 = addBox(mainStationGroup, 0.14, 1.05, 0.14, darkTimberMat, cx, 3.55, 13.75);
    b1.rotation.x = -0.58;
    const b2 = addBox(mainStationGroup, 0.14, 1.05, 0.14, darkTimberMat, cx, 3.55, 14.95);
    b2.rotation.x = 0.58;
  });

  // Warm Glowing Hanging Station Lights under Canopy
  [-5.0, 0.2, 5.2].forEach((lx) => {
    addBox(mainStationGroup, 0.85, 0.1, 0.18, lampBulbMat, lx, 3.88, 14.2, false, false);
  });
  // Hero warm station canopy PointLight (1 of 5 max)
  const stationLight = new THREE.PointLight(0xffbe70, 6.2, 28, 1.35);
  stationLight.position.set(0, 3.55, 13.8);
  mainStationGroup.add(stationLight);
  warmPointLights.push({ light: stationLight, maxIntensity: 6.8 });

  // Traditional Wooden Station Building behind platform (centered around x: -2.5, z: 22.8 for wide open platform plaza)
  const sbX = -2.5;
  const sbZ = 22.8;
  // Base plinth
  addBox(mainStationGroup, 11.4, 0.35, 5.4, concreteMat, sbX, 0.175, sbZ);
  // Cedar timber lower walls & warm shikkui plaster upper walls (framed around doorway)
  addBox(mainStationGroup, 4.0, 3.1, 4.8, woodMat, sbX - 3.5, 1.85, sbZ);
  addBox(mainStationGroup, 4.0, 3.1, 4.8, woodMat, sbX + 3.5, 1.85, sbZ);
  addBox(mainStationGroup, 3.2, 1.1, 4.8, plasterMat, sbX, 2.9, sbZ); // lintel above doorway
  addBox(mainStationGroup, 11.0, 3.1, 0.4, woodMat, sbX, 1.85, sbZ + 2.2); // back wall

  // Interactive Sliding Wooden Station Entrance Door (with solid wall jambs on both sides!)
  const stationDoor = addBox(mainStationGroup, 2.2, 2.25, 0.12, darkTimberMat, sbX, 1.48, sbZ - 2.35);
  addBox(stationDoor, 1.6, 1.1, 0.15, windowGlowMat, 0, 0.25, 0, false, false);
  let doorIsOpen = false;
  let doorSlide = 0;

  // Warm Glowing Lattice Windows on Station Building
  [-3.5, 3.5].forEach((wx) => {
    addBox(mainStationGroup, 2.2, 1.45, 0.14, windowGlowMat, sbX + wx, 1.95, sbZ - 2.42, false, false);
    addBox(mainStationGroup, 2.35, 0.1, 0.2, darkTimberMat, sbX + wx, 1.95, sbZ - 2.45, false, false);
    addBox(mainStationGroup, 0.1, 1.55, 0.2, darkTimberMat, sbX + wx, 1.95, sbZ - 2.45, false, false);
  });

  // Pitched Japanese Kawara Tiled Gable Roof (2 angled slabs + ridge beam)
  const roofL = addBox(mainStationGroup, 12.6, 0.24, 4.1, roofMat, sbX, 4.15, sbZ - 1.55);
  roofL.rotation.x = 0.42;
  const roofR = addBox(mainStationGroup, 12.6, 0.24, 4.1, roofMat, sbX, 4.15, sbZ + 1.55);
  roofR.rotation.x = -0.42;
  addBox(mainStationGroup, 12.8, 0.26, 0.34, canopyMetalMat, sbX, 4.95, sbZ);

  // Station Building Colliders (leaving doorway walkway clear)
  colliders.push(
    { id: 'station_west_wing', minX: sbX - 5.5, maxX: sbX - 1.4, minZ: sbZ - 2.5, maxZ: sbZ + 2.5 },
    { id: 'station_east_wing', minX: sbX + 1.4, maxX: sbX + 5.5, minZ: sbZ - 2.5, maxZ: sbZ + 2.5 },
    { id: 'station_back_wall', minX: sbX - 5.5, maxX: sbX + 5.5, minZ: sbZ + 1.9, maxZ: sbZ + 2.6 }
  );

  interactables.push({
    id: 'sakuragawa_door',
    kind: 'station_door',
    label: 'Slide Station Waiting Room Door',
    x: sbX,
    y: 1.4,
    z: sbZ - 2.6,
    radius: 2.6,
    locationId: 'sakuragawa_station',
  });

  // Station Name Signboard on Platform
  const signMatMain = new THREE.MeshStandardMaterial({
    map: mainSignTex,
    roughness: 0.45,
    metalness: 0.05,
  });
  disposables.push(signMatMain);
  addBox(mainStationGroup, 0.1, 2.3, 0.1, steelMat, -9.8, 2.0, 15.2);
  addBox(mainStationGroup, 0.1, 2.3, 0.1, steelMat, -7.8, 2.0, 15.2);
  addBox(mainStationGroup, 2.25, 1.15, 0.12, signMatMain, -8.8, 2.55, 15.2);

  // Working Analog Station Clock mounted under Canopy
  const clockGroup = new THREE.Group();
  clockGroup.position.set(1.2, 3.25, 13.65);
  const clkRingGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.14, 20);
  clkRingGeo.rotateX(Math.PI / 2);
  const clkFaceGeo = new THREE.CircleGeometry(0.42, 20);
  const clkFaceMat = new THREE.MeshStandardMaterial({
    map: textures.clockFace,
    emissive: new THREE.Color(0xfff1d6),
    emissiveMap: textures.clockFace,
    emissiveIntensity: 0.4,
    roughness: 0.35,
  });
  disposables.push(clkRingGeo, clkFaceGeo, clkFaceMat);
  clockGroup.add(new THREE.Mesh(clkRingGeo, canopyMetalMat));
  const faceFront = new THREE.Mesh(clkFaceGeo, clkFaceMat);
  faceFront.position.z = 0.075;
  clockGroup.add(faceFront);

  const hourHandPivot = new THREE.Group();
  hourHandPivot.position.z = 0.09;
  addBox(hourHandPivot, 0.045, 0.22, 0.015, canopyMetalMat, 0, 0.09, 0, false, false);
  clockGroup.add(hourHandPivot);

  const minHandPivot = new THREE.Group();
  minHandPivot.position.z = 0.095;
  addBox(minHandPivot, 0.03, 0.32, 0.015, canopyMetalMat, 0, 0.14, 0, false, false);
  clockGroup.add(minHandPivot);
  mainStationGroup.add(clockGroup);

  // Timetable Board on Platform (Interactive!)
  const ttMat = new THREE.MeshStandardMaterial({
    map: textures.timetableBoard,
    roughness: 0.4,
    metalness: 0.04,
  });
  disposables.push(ttMat);
  addBox(mainStationGroup, 0.1, 2.0, 0.1, darkTimberMat, 5.2, 1.85, 15.8);
  addBox(mainStationGroup, 0.1, 2.0, 0.1, darkTimberMat, 7.0, 1.85, 15.8);
  addBox(mainStationGroup, 1.95, 1.25, 0.1, ttMat, 6.1, 2.25, 15.8);
  interactables.push({
    id: 'sakuragawa_timetable',
    kind: 'transit_board',
    label: 'View Bus & Train Departure Map',
    sublabel: 'ஷவீஷ் ஜெஷுருன் சா · Live Station Timings',
    x: 6.1,
    y: 1.8,
    z: 15.4,
    radius: 3.2,
    locationId: 'sakuragawa_station',
  });

  // Ticket Machine beside Station Entrance
  addBox(mainStationGroup, 0.95, 1.75, 0.65, steelMat, sbX + 5.8, 0.88, sbZ - 1.8);
  addBox(mainStationGroup, 0.65, 0.48, 0.06, windowGlowMat, sbX + 5.8, 1.22, sbZ - 2.13, false, false);
  interactables.push({
    id: 'sakuragawa_info',
    kind: 'info_board',
    label: 'Inspect Station Guide & Ticket Kiosk',
    sublabel: 'ஷவீஷ் ஜெஷுருன் சா',
    x: sbX + 5.8,
    y: 1.2,
    z: sbZ - 2.4,
    radius: 2.5,
    locationId: 'sakuragawa_station',
  });

  // Japanese Retro Vending Machine beside Sakuragawa Station (Interactive!)
  const vmMat = new THREE.MeshStandardMaterial({
    map: textures.vendingFront,
    emissive: new THREE.Color(0xfff1d6),
    emissiveMap: textures.vendingFront,
    emissiveIntensity: 0.45,
    roughness: 0.32,
    metalness: 0.18,
  });
  disposables.push(vmMat);
  const vmX = 4.6;
  const vmZ = 18.8;
  addBox(mainStationGroup, 1.05, 1.95, 0.78, redAccentMat, vmX, 0.975, vmZ);
  addBox(mainStationGroup, 0.98, 1.88, 0.04, vmMat, vmX, 0.975, vmZ - 0.39, false, false);
  colliders.push({ id: 'vending_main', minX: vmX - 0.55, maxX: vmX + 0.55, minZ: vmZ - 0.45, maxZ: vmZ + 0.45 });
  interactables.push({
    id: 'vending_sakuragawa',
    kind: 'vending_machine',
    label: 'Use Drink Vending Machine',
    sublabel: 'Hot & Cold Drinks',
    x: vmX,
    y: 1.0,
    z: vmZ - 0.8,
    radius: 2.4,
    locationId: 'sakuragawa_station',
  });

  // Wooden Benches on Sakuragawa Platform
  addBench(-3.6, 0.85, 15.45, Math.PI, 'bench_sakura_1', 'Sit on Platform Bench', 'sakuragawa_station');
  addBench(2.4, 0.85, 15.45, Math.PI, 'bench_sakura_2', 'Sit on Platform Bench', 'sakuragawa_station');

  // Overhead Railway Footbridge (just east of Sakuragawa platform — iconic silhouette from reference image 5!)
  const fbX = 14.5;
  addBox(mainStationGroup, 2.2, 5.4, 1.4, steelMat, fbX, 2.7, 15.2);
  addBox(mainStationGroup, 2.2, 5.4, 1.4, steelMat, fbX, 2.7, 4.0);
  addBox(mainStationGroup, 2.1, 0.32, 12.6, steelMat, fbX, 5.35, 9.6);
  addBox(mainStationGroup, 0.14, 1.15, 12.4, canopyMetalMat, fbX - 0.98, 6.05, 9.6);
  addBox(mainStationGroup, 0.14, 1.15, 12.4, canopyMetalMat, fbX + 0.98, 6.05, 9.6);
  addBox(mainStationGroup, 2.35, 0.18, 12.8, canopyMetalMat, fbX, 7.65, 9.6);
  colliders.push(
    { id: 'fb_pier_s', minX: fbX - 1.15, maxX: fbX + 1.15, minZ: 14.4, maxZ: 16.0 },
    { id: 'fb_pier_n', minX: fbX - 1.15, maxX: fbX + 1.15, minZ: 3.2, maxZ: 4.8 }
  );

  // Warm Street Lamps around Sakuragawa Plaza
  addLampPost(-12.2, 0.85, 15.6, false);
  addLampPost(11.6, 0.85, 15.6, false);
  addLampPost(-9.5, 0, 22.8, true);

  group.add(mainStationGroup);

  // =========================================================================
  // 3. AOMIZU LAKESIDE STATION (青水湖畔) & LAKESIDE PIER / BENCHES
  // =========================================================================
  const lakeStation = STATIONS.find((s) => s.id === 'aomizu_lakeside')!;
  const lakeStationGroup = new THREE.Group();
  lakeStationGroup.position.set(lakeStation.platformX, 0, lakeStation.platformZ);
  lakeStationGroup.rotation.y = lakeStation.tangentAngle + Math.PI * 0.5;

  addBox(lakeStationGroup, 14.5, 0.72, 3.6, concreteMat, 0, 0.36, 0);
  addBox(lakeStationGroup, 14.2, 0.025, 0.4, tactileMat, 0, 0.735, -1.4, false, true);
  // Intimate lakeside wooden shelter canopy
  const lsRoof = addBox(lakeStationGroup, 7.2, 0.18, 3.1, canopyMetalMat, 0, 3.55, 0.15);
  lsRoof.rotation.x = 0.08;
  [-2.8, 0, 2.8].forEach((cx) => {
    addBox(lakeStationGroup, 0.18, 2.85, 0.18, darkTimberMat, cx, 2.1, 0.2);
  });
  addBox(lakeStationGroup, 0.75, 0.09, 0.14, lampBulbMat, 0, 3.38, 0.15, false, false);
  const lakeSignTex = textures.createStationSign('Neelam Lakeside', 'நீலம் ஏரி', 'ஷவீஷ் ஜெஷுருன் சா', 'Thendral Malai');
  const lakeSignMat = new THREE.MeshStandardMaterial({ map: lakeSignTex, roughness: 0.45 });
  disposables.push(lakeSignMat);
  addBox(lakeStationGroup, 2.1, 1.05, 0.1, lakeSignMat, -4.6, 2.15, 0.6);
  addBox(lakeStationGroup, 0.08, 1.8, 0.08, steelMat, -5.4, 1.6, 0.6);
  addBox(lakeStationGroup, 0.08, 1.8, 0.08, steelMat, -3.8, 1.6, 0.6);

  addBox(lakeStationGroup, 0.08, 1.8, 0.08, darkTimberMat, 3.6, 1.65, 0.65);
  addBox(lakeStationGroup, 0.08, 1.8, 0.08, darkTimberMat, 5.2, 1.65, 0.65);
  addBox(lakeStationGroup, 1.75, 1.15, 0.1, ttMat, 4.4, 2.05, 0.65);
  interactables.push({
    id: 'lake_transit_board',
    kind: 'transit_board',
    label: 'View Bus & Train Departure Map',
    sublabel: 'Neelam Lakeside · Live Timings',
    x: lakeStation.platformX,
    y: 1.2,
    z: lakeStation.platformZ,
    radius: 4.2,
    locationId: 'aomizu_lakeside',
  });

  const lakeLight = new THREE.PointLight(0xffb866, 4.6, 24, 1.45);
  lakeLight.position.set(0, 3.1, 0);
  lakeStationGroup.add(lakeLight);
  warmPointLights.push({ light: lakeLight, maxIntensity: 5.0 });
  group.add(lakeStationGroup);

  // Scenic Wooden Lakeside Benches facing the calm reflective water
  addBench(32.5, groundHeightAt(32.5, -5.5), -5.5, 2.35, 'bench_lake_1', 'Sit by the Lake', 'aomizu_lakeside');
  addBench(22.0, groundHeightAt(22.0, -16.5), -16.5, 1.85, 'bench_lake_2', 'Watch Sunset Reflections', 'aomizu_lakeside');

  // Small Wooden Lakeside Pier extending slightly over the shallow water
  const pierGroup = new THREE.Group();
  pierGroup.position.set(27.5, -0.1, -11.5);
  pierGroup.rotation.y = 0.65;
  addBox(pierGroup, 2.4, 0.14, 6.2, woodMat, 0, 0.25, 0);
  [-1.0, 1.0].forEach((px) => {
    [-2.5, 0, 2.5].forEach((pz) => {
      addBox(pierGroup, 0.16, 1.5, 0.16, darkTimberMat, px, -0.35, pz);
    });
  });
  group.add(pierGroup);

  // =========================================================================
  // 4. KAZE-NO-OKA HALT (風の丘駅) & STONE RAILWAY TUNNEL & LAKESIDE BRIDGE
  // =========================================================================
  const kazeStation = STATIONS.find((s) => s.id === 'kaze_no_oka')!;
  const kazeGroup = new THREE.Group();
  kazeGroup.position.set(kazeStation.platformX, 0, kazeStation.platformZ);
  kazeGroup.rotation.y = kazeStation.tangentAngle + Math.PI * 0.5;

  addBox(kazeGroup, 13.0, 0.72, 3.5, concreteMat, 0, 0.36, 0);
  addBox(kazeGroup, 12.6, 0.025, 0.4, tactileMat, 0, 0.735, -1.35, false, true);
  addBox(kazeGroup, 5.8, 0.18, 2.9, canopyMetalMat, 0, 3.45, 0.15);
  [-2.2, 2.2].forEach((cx) => {
    addBox(kazeGroup, 0.18, 2.75, 0.18, darkTimberMat, cx, 2.05, 0.15);
  });
  addBox(kazeGroup, 0.7, 0.09, 0.14, lampBulbMat, 0, 3.3, 0.15, false, false);
  const kazeSignTex = textures.createStationSign('Thendral Malai', 'தென்றல் மலை', 'Neelam Eri', 'ஷவீஷ் ஜெஷுருன் சா');
  const kazeSignMat = new THREE.MeshStandardMaterial({ map: kazeSignTex, roughness: 0.45 });
  disposables.push(kazeSignMat);
  addBox(kazeGroup, 2.1, 1.05, 0.1, kazeSignMat, 4.2, 2.15, 0.5);
  addBox(kazeGroup, 1.75, 1.15, 0.1, ttMat, -4.1, 2.05, 0.55);
  group.add(kazeGroup);

  interactables.push({
    id: 'kaze_transit_board',
    kind: 'transit_board',
    label: 'View Bus & Train Departure Map',
    sublabel: 'Thendral Malai Halt · Live Timings',
    x: kazeStation.platformX,
    y: 1.2,
    z: kazeStation.platformZ,
    radius: 4.2,
    locationId: 'kaze_no_oka',
  });

  addBench(
    kazeStation.platformX,
    0.72,
    kazeStation.platformZ + 0.6,
    0,
    'bench_kaze_1',
    'Rest at Thendral Malai Halt',
    'kaze_no_oka'
  );

  // =========================================================================
  // 4B. PACHAI MEADOW HALT (பச்சை வயல் நிறுத்தம்) — Golden Countryside Stop
  // =========================================================================
  const pachaiStation = STATIONS.find((s) => s.id === 'pachai_meadow_halt');
  if (pachaiStation) {
    const pachaiGroup = new THREE.Group();
    pachaiGroup.position.set(pachaiStation.platformX, 0, pachaiStation.platformZ);
    pachaiGroup.rotation.y = pachaiStation.tangentAngle + Math.PI * 0.5;

    addBox(pachaiGroup, 13.0, 0.72, 3.4, concreteMat, 0, 0.36, 0);
    addBox(pachaiGroup, 12.6, 0.025, 0.4, tactileMat, 0, 0.735, -1.3, false, true);
    const pmRoof = addBox(pachaiGroup, 6.2, 0.16, 2.8, canopyMetalMat, 0, 3.42, 0.15);
    pmRoof.rotation.x = 0.08;
    [-2.4, 2.4].forEach((cx) => {
      addBox(pachaiGroup, 0.16, 2.72, 0.16, darkTimberMat, cx, 2.02, 0.15);
    });
    addBox(pachaiGroup, 0.68, 0.09, 0.14, lampBulbMat, 0, 3.26, 0.15, false, false);
    const pachaiSignTex = textures.createStationSign(
      'Pachai Meadow',
      'பச்சை வயல்',
      'ஷவீஷ் ஜெஷுருன் சா',
      'Neelam Eri'
    );
    const pachaiSignMat = new THREE.MeshStandardMaterial({ map: pachaiSignTex, roughness: 0.45 });
    disposables.push(pachaiSignMat);
    addBox(pachaiGroup, 2.1, 1.05, 0.1, pachaiSignMat, 4.1, 2.12, 0.5);
    addBox(pachaiGroup, 0.08, 1.8, 0.08, steelMat, 3.3, 1.6, 0.5);
    addBox(pachaiGroup, 0.08, 1.8, 0.08, steelMat, 4.9, 1.6, 0.5);
    addBox(pachaiGroup, 1.75, 1.15, 0.1, ttMat, -4.1, 2.05, 0.55);
    group.add(pachaiGroup);

    interactables.push({
      id: 'pachai_transit_board',
      kind: 'transit_board',
      label: 'View Bus & Train Departure Map',
      sublabel: 'Pachai Meadow Halt · Live Timings',
      x: pachaiStation.platformX,
      y: 1.2,
      z: pachaiStation.platformZ,
      radius: 4.2,
      locationId: 'open_countryside',
    });

    addBench(
      pachaiStation.platformX,
      0.72,
      pachaiStation.platformZ + 0.5,
      Math.PI,
      'bench_pachai_1',
      'Sit at Pachai Meadow Halt',
      'open_countryside'
    );
  }

  // =========================================================================
  // 4B-2. SSJ DINOSAUR ISLAND STATION (டைனோசர் தீவு நிலையம்) — Sea Island Stop
  // =========================================================================
  const dinoStation = STATIONS.find((s) => s.id === 'dinosaur_island_station');
  if (dinoStation) {
    const dinoStGroup = new THREE.Group();
    dinoStGroup.position.set(dinoStation.platformX, 0, dinoStation.platformZ);
    dinoStGroup.rotation.y = dinoStation.tangentAngle + Math.PI * 0.5;

    addBox(dinoStGroup, 13.5, 0.78, 3.6, concreteMat, 0, 0.39, 0);
    addBox(dinoStGroup, 13.0, 0.025, 0.42, tactileMat, 0, 0.795, -1.35, false, true);
    const dsRoof = addBox(dinoStGroup, 7.2, 0.18, 3.0, canopyMetalMat, 0, 3.5, 0.15);
    dsRoof.rotation.x = 0.08;
    [-2.7, 2.7].forEach((cx) => {
      addBox(dinoStGroup, 0.18, 2.78, 0.18, redAccentMat, cx, 2.1, 0.15);
    });
    addBox(dinoStGroup, 0.8, 0.1, 0.16, lampBulbMat, 0, 3.34, 0.15, false, false);

    const dinoSignTex = textures.createStationSign(
      'SSJ Dinosaur Island',
      'டைனோசர் தீவு',
      'Pachai Meadow',
      'Neelam Eri'
    );
    const dinoSignMat = new THREE.MeshStandardMaterial({ map: dinoSignTex, roughness: 0.42 });
    disposables.push(dinoSignMat);
    addBox(dinoStGroup, 2.3, 1.1, 0.12, dinoSignMat, 4.3, 2.2, 0.52);
    addBox(dinoStGroup, 0.08, 1.85, 0.08, steelMat, 3.4, 1.65, 0.52);
    addBox(dinoStGroup, 0.08, 1.85, 0.08, steelMat, 5.2, 1.65, 0.52);
    addBox(dinoStGroup, 1.75, 1.15, 0.1, ttMat, -4.3, 2.1, 0.55);
    group.add(dinoStGroup);

    interactables.push({
      id: 'dino_island_transit_board',
      kind: 'transit_board',
      label: 'View Bus & Train Departure Map',
      sublabel: 'SSJ Dinosaur Island · Live Timings',
      x: dinoStation.platformX,
      y: 1.2,
      z: dinoStation.platformZ,
      radius: 4.4,
      locationId: 'dinosaur_island',
    });

    addBench(
      dinoStation.platformX,
      0.78,
      dinoStation.platformZ + 0.7,
      0.3,
      'bench_dino_station',
      'Rest at SSJ Dinosaur Island Station',
      'dinosaur_island'
    );
  }

  // =========================================================================
  // 4B-3. UNIVERSAL EXHIBITION COMPLEX STATION — Ocean Island Modern Stop
  // =========================================================================
  const exhibitionStation = STATIONS.find((s) => s.id === 'exhibition_complex_station');
  if (exhibitionStation) {
    const exStGroup = new THREE.Group();
    exStGroup.position.set(exhibitionStation.platformX, 0, exhibitionStation.platformZ);
    exStGroup.rotation.y = exhibitionStation.tangentAngle + Math.PI * 0.5;

    addBox(exStGroup, 16.0, 0.82, 4.0, concreteMat, 0, 0.41, 0);
    addBox(exStGroup, 15.2, 0.025, 0.44, tactileMat, 0, 0.835, -1.5, false, true);
    const exRoof = addBox(exStGroup, 11.0, 0.2, 3.6, canopyMetalMat, 0, 3.85, 0.2);
    exRoof.rotation.x = 0.06;
    [-4.4, 0, 4.4].forEach((cx) => {
      addBox(exStGroup, 0.2, 3.05, 0.2, steelMat, cx, 2.35, 0.35);
    });
    addBox(exStGroup, 8.8, 0.12, 0.18, lampBulbMat, 0, 3.68, 0.15, false, false);

    const exSignTex = textures.createStationSign(
      'Universal Exhibition',
      'உலக போக்குவரத்து கண்காட்சி',
      'Pachai Meadow',
      'SSJ Dinosaur Island'
    );
    const exSignMat = new THREE.MeshStandardMaterial({ map: exSignTex, roughness: 0.38 });
    disposables.push(exSignMat);
    addBox(exStGroup, 2.8, 1.15, 0.12, exSignMat, 5.2, 2.3, 0.65);
    addBox(exStGroup, 0.08, 1.9, 0.08, steelMat, 4.1, 1.7, 0.65);
    addBox(exStGroup, 0.08, 1.9, 0.08, steelMat, 6.3, 1.7, 0.65);
    addBox(exStGroup, 1.8, 1.2, 0.1, ttMat, -5.2, 2.15, 0.68);
    group.add(exStGroup);

    interactables.push({
      id: 'exhibition_transit_board',
      kind: 'transit_board',
      label: 'View Bus & Train Departure Map',
      sublabel: 'Universal Exhibition Complex · Live Timings',
      x: exhibitionStation.platformX,
      y: 1.2,
      z: exhibitionStation.platformZ,
      radius: 4.8,
      locationId: 'exhibition_complex',
    });

    addBench(
      exhibitionStation.platformX,
      0.82,
      exhibitionStation.platformZ + 0.8,
      0.0,
      'bench_exhibition_station',
      'Rest at Universal Exhibition Station',
      'exhibition_complex'
    );
  }

  // =========================================================================
  // 4C. ICELAND EXPRESS HALT (ஐஸ்லாந்து நுழைவு) — Northwest Glacier Gateway
  // =========================================================================
  const icelandStation = STATIONS.find((s) => s.id === 'iceland_gateway');
  if (icelandStation) {
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0xbde8ff,
      emissive: new THREE.Color(0x52c8ff),
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.15,
    });
    const frostRoofMat = new THREE.MeshStandardMaterial({
      color: 0xe6f2fa,
      roughness: 0.72,
      metalness: 0.06,
    });
    disposables.push(iceMat, frostRoofMat);

    const iceGroup = new THREE.Group();
    iceGroup.position.set(icelandStation.platformX, 0, icelandStation.platformZ);
    iceGroup.rotation.y = icelandStation.tangentAngle + Math.PI * 0.5;

    addBox(iceGroup, 14.2, 0.74, 3.6, concreteMat, 0, 0.37, 0);
    addBox(iceGroup, 13.8, 0.025, 0.4, tactileMat, 0, 0.755, -1.4, false, true);
    // Snow-dusted station canopy with icy-blue glowing lantern strip
    const igRoof = addBox(iceGroup, 7.2, 0.2, 3.2, frostRoofMat, 0, 3.62, 0.15);
    igRoof.rotation.x = 0.08;
    addBox(iceGroup, 7.2, 0.14, 3.0, canopyMetalMat, 0, 3.48, 0.15);
    [-2.8, 0, 2.8].forEach((cx) => {
      addBox(iceGroup, 0.18, 2.8, 0.18, darkTimberMat, cx, 2.08, 0.18);
    });
    addBox(iceGroup, 1.35, 0.12, 0.18, iceMat, 0, 3.34, 0.15, false, false);

    const iceSignTex = textures.createStationSign(
      'Iceland Express Halt',
      'ஐஸ்லாந்து நுழைவு',
      'Thendral Malai',
      'ஷவீஷ் ஜெஷுருன் சா'
    );
    const iceSignMat = new THREE.MeshStandardMaterial({ map: iceSignTex, roughness: 0.45 });
    disposables.push(iceSignMat);
    addBox(iceGroup, 1.75, 1.15, 0.1, ttMat, -4.6, 2.05, 0.55);
    interactables.push({
      id: 'iceland_transit_board',
      kind: 'transit_board',
      label: 'View Bus & Train Departure Map',
      sublabel: 'Iceland Express Halt · Live Timings',
      x: icelandStation.platformX,
      y: 1.2,
      z: icelandStation.platformZ,
      radius: 4.2,
      locationId: 'iceland_gateway',
    });
    addBox(iceGroup, 2.25, 1.1, 0.1, iceSignMat, -4.5, 2.15, 0.55);
    addBox(iceGroup, 0.08, 1.8, 0.08, steelMat, -5.3, 1.6, 0.55);
    addBox(iceGroup, 0.08, 1.8, 0.08, steelMat, -3.7, 1.6, 0.55);

    // Glowing Crystalline Iceland Transfer Archway at back of platform
    addBox(iceGroup, 0.34, 3.2, 0.34, iceMat, 3.2, 2.34, 1.25, false, false);
    addBox(iceGroup, 0.34, 3.2, 0.34, iceMat, 5.8, 2.34, 1.25, false, false);
    addBox(iceGroup, 3.1, 0.36, 0.42, iceMat, 4.5, 3.92, 1.25, false, false);
    group.add(iceGroup);

    interactables.push({
      id: 'iceland_glacier_transfer',
      kind: 'iceland_transfer',
      label: 'Enter Panimalai Iceland Region',
      sublabel: 'ஐஸ்லாந்து நுழைவு · Meet Giant Igloo Man',
      x: icelandStation.platformX - 1.2,
      y: 0.74,
      z: icelandStation.platformZ - 3.6,
      radius: 4.5,
      locationId: 'iceland_gateway',
    });
  }

  // Stone-Arch Railway Tunnel Portals (eastern & western ends of the northern ridge)
  const addTunnelPortal = (splineT: number) => {
    const s = sampleRailway(splineT);
    const tg = new THREE.Group();
    tg.position.set(s.x, 0, s.z);
    tg.rotation.y = s.angle;
    addBox(tg, 1.6, 6.2, 2.6, stoneMat, -2.75, 3.1, 0);
    addBox(tg, 1.6, 6.2, 2.6, stoneMat, 2.75, 3.1, 0);
    addBox(tg, 7.2, 2.2, 2.6, stoneMat, 0, 6.4, 0);
    addBox(tg, 7.5, 0.4, 2.9, darkTimberMat, 0, 7.6, 0);
    group.add(tg);
  };
  addTunnelPortal(0.49);
  addTunnelPortal(0.56);

  // Open Steel Truss Railway Bridge spanning the lakeside edge (reflective water visible beneath!)
  for (let b = 0; b < 7; b++) {
    const s = sampleRailway(0.355 + b * 0.011);
    const bg = new THREE.Group();
    bg.position.set(s.x, 0, s.z);
    bg.rotation.y = s.angle;
    // Open lower deck & slim red top/bottom chords with vertical posts
    addBox(bg, 3.3, 0.24, 3.8, steelMat, 0, -0.06, 0);
    [-1.62, 1.62].forEach((sideX) => {
      addBox(bg, 0.14, 0.16, 3.8, redAccentMat, sideX, 0.92, 0);
      addBox(bg, 0.14, 0.16, 3.8, redAccentMat, sideX, 0.18, 0);
      addBox(bg, 0.14, 0.84, 0.14, redAccentMat, sideX, 0.55, -1.7);
      addBox(bg, 0.14, 0.84, 0.14, redAccentMat, sideX, 0.55, 0.0);
      addBox(bg, 0.14, 0.84, 0.14, redAccentMat, sideX, 0.55, 1.7);
    });
    if (b % 2 === 0) {
      addBox(bg, 0.45, 2.2, 0.45, concreteMat, -1.2, -1.25, 0);
      addBox(bg, 0.45, 2.2, 0.45, concreteMat, 1.2, -1.25, 0);
    }
    group.add(bg);
  }

  // =========================================================================
  // 5. RAILWAY LEVEL CROSSING (Fumikiri) near Hoshino Village Road
  // =========================================================================
  const crossingGroup = new THREE.Group();
  crossingGroup.position.set(CROSSING_POINT.x, 0, CROSSING_POINT.z);
  crossingGroup.rotation.y = CROSSING_POINT.angle;
  // Wooden road crossing planks over rails
  addBox(crossingGroup, 2.6, 0.14, 4.4, woodMat, 0, 0.08, 0, false, true);

  const crossingBars: THREE.Group[] = [];
  [-2.3, 2.3].forEach((sideX, idx) => {
    const postZ = idx === 0 ? 2.3 : -2.3;
    addBox(crossingGroup, 0.18, 3.1, 0.18, tactileMat, sideX, 1.55, postZ);
    // Crossbuck X sign
    const x1 = addBox(crossingGroup, 0.12, 1.1, 0.06, plasterMat, sideX, 2.65, postZ);
    x1.rotation.z = 0.72;
    const x2 = addBox(crossingGroup, 0.12, 1.1, 0.06, plasterMat, sideX, 2.65, postZ);
    x2.rotation.z = -0.72;

    // Flashing red warning lamps
    const lampGeo = new THREE.SphereGeometry(0.11, 8, 8);
    disposables.push(lampGeo);
    const l1 = new THREE.Mesh(lampGeo, crossingLampMat);
    l1.position.set(sideX - 0.16, 2.05, postZ + (idx === 0 ? 0.12 : -0.12));
    const l2 = new THREE.Mesh(lampGeo, crossingLampMat);
    l2.position.set(sideX + 0.16, 2.05, postZ + (idx === 0 ? 0.12 : -0.12));
    crossingGroup.add(l1, l2);

    // Animated barrier arm pivot
    const pivot = new THREE.Group();
    pivot.position.set(sideX, 1.05, postZ);
    const armDir = idx === 0 ? 1 : -1;
    addBox(pivot, 3.6, 0.09, 0.09, tactileMat, armDir * 1.75, 0, 0);
    addBox(pivot, 0.65, 0.11, 0.11, canopyMetalMat, armDir * 0.9, 0, 0);
    addBox(pivot, 0.65, 0.11, 0.11, canopyMetalMat, armDir * 2.3, 0, 0);
    pivot.rotation.z = armDir * 1.25; // raised by default
    crossingGroup.add(pivot);
    crossingBars.push(pivot);
  });
  group.add(crossingGroup);

  // =========================================================================
  // 6. HOSHINO JAPANESE COUNTRYSIDE VILLAGE (星野の里)
  // =========================================================================
  const houseSpecs = [
    { x: VILLAGE_CENTER.x - 12, z: VILLAGE_CENTER.z - 8, w: 7.4, d: 6.2, h: 3.6, rot: 0.15, isShop: false },
    { x: VILLAGE_CENTER.x + 2, z: VILLAGE_CENTER.z - 10, w: 8.0, d: 5.8, h: 3.4, rot: -0.08, isShop: true },
    { x: VILLAGE_CENTER.x + 14, z: VILLAGE_CENTER.z - 4, w: 6.8, d: 5.6, h: 3.2, rot: 0.22, isShop: false },
    { x: VILLAGE_CENTER.x - 16, z: VILLAGE_CENTER.z + 6, w: 7.2, d: 6.4, h: 4.4, rot: 1.48, isShop: false },
    { x: VILLAGE_CENTER.x - 4, z: VILLAGE_CENTER.z + 12, w: 7.8, d: 6.0, h: 3.5, rot: Math.PI - 0.12, isShop: false },
    { x: VILLAGE_CENTER.x + 11, z: VILLAGE_CENTER.z + 11, w: 6.6, d: 5.5, h: 3.3, rot: Math.PI + 0.18, isShop: false },
    { x: VILLAGE_CENTER.x - 24, z: VILLAGE_CENTER.z - 2, w: 6.4, d: 5.4, h: 3.2, rot: 0.42, isShop: false },
    { x: VILLAGE_CENTER.x + 20, z: VILLAGE_CENTER.z + 6, w: 7.0, d: 5.8, h: 3.6, rot: -0.35, isShop: false },
  ];

  houseSpecs.forEach((hs, idx) => {
    const gy = groundHeightAt(hs.x, hs.z);
    const hg = new THREE.Group();
    hg.position.set(hs.x, gy, hs.z);
    hg.rotation.y = hs.rot;

    // Foundation stone plinth
    addBox(hg, hs.w + 0.4, 0.45, hs.d + 0.4, stoneMat, 0, 0.225, 0);
    // Cedar lower paneling + shikkui plaster upper walls
    addBox(hg, hs.w, hs.h * 0.48, hs.d, woodMat, 0, 0.45 + hs.h * 0.24, 0);
    addBox(hg, hs.w - 0.08, hs.h * 0.54, hs.d - 0.08, plasterMat, 0, 0.45 + hs.h * 0.74, 0);

    // Corner timber columns
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sz) => {
        addBox(hg, 0.22, hs.h, 0.22, darkTimberMat, sx * (hs.w * 0.5 - 0.06), 0.45 + hs.h * 0.5, sz * (hs.d * 0.5 - 0.06));
      });
    });

    // Sloped Japanese kawara tiled roof
    const rLen = hs.d * 0.65;
    const roofY = 0.45 + hs.h + 0.72;
    const rl = addBox(hg, hs.w + 1.35, 0.22, rLen, roofMat, 0, roofY, -hs.d * 0.26);
    rl.rotation.x = 0.44;
    const rr = addBox(hg, hs.w + 1.35, 0.22, rLen, roofMat, 0, roofY, hs.d * 0.26);
    rr.rotation.x = -0.44;
    addBox(hg, hs.w + 1.45, 0.24, 0.3, canopyMetalMat, 0, roofY + 0.65, 0);

    // Warm glowing shoji / glass windows
    addBox(hg, 1.5, 1.15, 0.12, windowGlowMat, -hs.w * 0.22, 1.75, hs.d * 0.5 + 0.02, false, false);
    addBox(hg, 1.5, 1.15, 0.12, windowGlowMat, hs.w * 0.22, 1.75, hs.d * 0.5 + 0.02, false, false);
    addBox(hg, 1.5, 1.15, 0.12, windowGlowMat, 0, 1.75, -hs.d * 0.5 - 0.02, false, false);

    // Corner Shop extra detail: wooden awning + indigo noren curtains
    if (hs.isShop) {
      const awn = addBox(hg, hs.w * 0.85, 0.12, 1.3, canopyMetalMat, 0, 2.65, hs.d * 0.5 + 0.55);
      awn.rotation.x = 0.25;
      const norenMat = new THREE.MeshStandardMaterial({ color: 0x2c4270, roughness: 0.85 });
      disposables.push(norenMat);
      for (let n = -2; n <= 2; n++) {
        addBox(hg, 0.52, 0.78, 0.04, norenMat, n * 0.62, 2.15, hs.d * 0.5 + 0.92, false, false);
      }
    }

    // Small garden wooden fence beside house
    addBox(hg, hs.w * 0.6, 0.9, 0.12, woodMat, -hs.w * 0.2, 0.45, hs.d * 0.5 + 2.2);

    group.add(hg);

    const rad = Math.max(hs.w, hs.d) * 0.52;
    colliders.push({
      id: `village_house_${idx}`,
      minX: hs.x - rad,
      maxX: hs.x + rad,
      minZ: hs.z - rad,
      maxZ: hs.z + rad,
    });
  });

  // Village Street Lamps, Bench & Village Vending Machine
  addLampPost(VILLAGE_CENTER.x - 6, groundHeightAt(VILLAGE_CENTER.x - 6, VILLAGE_CENTER.z + 2), VILLAGE_CENTER.z + 2, true);
  addLampPost(VILLAGE_CENTER.x + 8, groundHeightAt(VILLAGE_CENTER.x + 8, VILLAGE_CENTER.z + 3), VILLAGE_CENTER.z + 3, false);
  addBench(
    VILLAGE_CENTER.x - 1,
    groundHeightAt(VILLAGE_CENTER.x - 1, VILLAGE_CENTER.z + 3.5),
    VILLAGE_CENTER.z + 3.5,
    0.2,
    'bench_village',
    'Rest in Nila Gramam',
    'japanese_village'
  );

  // Second vending machine in Nila Gramam
  const vvmX = VILLAGE_CENTER.x + 6.4;
  const vvmZ = VILLAGE_CENTER.z - 6.8;
  const vvmY = groundHeightAt(vvmX, vvmZ);
  addBox(group, 1.05, 1.95, 0.78, redAccentMat, vvmX, vvmY + 0.975, vvmZ);
  addBox(group, 0.98, 1.88, 0.04, vmMat, vvmX, vvmY + 0.975, vvmZ + 0.39, false, false);
  interactables.push({
    id: 'vending_village',
    kind: 'vending_machine',
    label: 'Use Village Refreshment Kiosk',
    sublabel: 'Nila Corner Shop',
    x: vvmX,
    y: vvmY + 1.0,
    z: vvmZ + 0.85,
    radius: 2.5,
    locationId: 'japanese_village',
  });

  // =========================================================================
  // 7. YUUGURE HILLTOP VIEWPOINT (夕暮れ見晴らし台)
  // =========================================================================
  const hillY = groundHeightAt(HILL_CENTER.x, HILL_CENTER.z);
  const hillGroup = new THREE.Group();
  hillGroup.position.set(HILL_CENTER.x, hillY, HILL_CENTER.z);

  // Wooden overlook deck rim & rustic rail overlooking Sakuragawa and Aomizu Lake
  addBox(hillGroup, 5.4, 0.22, 4.2, woodMat, 0, 0.11, 0);
  // Traditional stone lantern (Toro)
  addBox(hillGroup, 0.56, 0.24, 0.56, stoneMat, -2.1, 0.32, 1.3);
  addBox(hillGroup, 0.28, 0.95, 0.28, stoneMat, -2.1, 0.9, 1.3);
  addBox(hillGroup, 0.42, 0.42, 0.42, lampBulbMat, -2.1, 1.55, 1.3, false, false);
  const toroRoof = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.35, 4), stoneMat);
  toroRoof.position.set(-2.1, 1.92, 1.3);
  toroRoof.rotation.y = Math.PI / 4;
  disposables.push(toroRoof.geometry);
  hillGroup.add(toroRoof);

  // Wooden trail signpost
  addBox(hillGroup, 0.14, 2.2, 0.14, darkTimberMat, 2.2, 1.1, -1.2);
  addBox(hillGroup, 1.25, 0.28, 0.08, woodMat, 2.55, 1.85, -1.2);

  group.add(hillGroup);

  // Panoramic Hilltop Resting Bench facing southeast across the railway & sunset lake
  addBench(
    HILL_CENTER.x,
    hillY + 0.22,
    HILL_CENTER.z,
    0.72,
    'bench_hilltop',
    'Sit at Malaiyur Overlook',
    'hilltop_viewpoint'
  );

  // =========================================================================
  // 8. COUNTRYSIDE WOODEN FENCES along station/meadow paths
  // =========================================================================
  const addFenceSegment = (x1: number, z1: number, x2: number, z2: number) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const mx = (x1 + x2) * 0.5;
    const mz = (z1 + z2) * 0.5;
    const my = groundHeightAt(mx, mz);
    const angle = Math.atan2(x2 - x1, z2 - z1);
    const fg = new THREE.Group();
    fg.position.set(mx, my, mz);
    fg.rotation.y = angle;
    addBox(fg, 0.1, 0.09, len, woodMat, 0, 0.85, 0);
    addBox(fg, 0.1, 0.09, len, woodMat, 0, 0.45, 0);
    const posts = Math.max(2, Math.round(len / 2.6));
    for (let i = 0; i <= posts; i++) {
      const pz = -len * 0.5 + (i / posts) * len;
      addBox(fg, 0.13, 1.1, 0.13, darkTimberMat, 0, 0.55, pz);
    }
    group.add(fg);
  };

  addFenceSegment(-18, 17.5, -9, 17.5);
  addFenceSegment(9, 17.5, 22, 17.5);
  addFenceSegment(-18, 3.2, 12, 3.2);
  addFenceSegment(16, 17.5, 30, 12.5);

  scene.add(group);

  const toggleStationDoor = () => {
    doorIsOpen = !doorIsOpen;
    return doorIsOpen;
  };

  const update = (params: {
    elapsed: number;
    dt: number;
    timeHours: number;
    lanternStrength: number;
    trainDistToCrossing: number;
  }) => {
    // Smoothly slide interactive station waiting room door
    const targetSlide = doorIsOpen ? 1.85 : 0;
    doorSlide += (targetSlide - doorSlide) * Math.min(1, params.dt * 6.5);
    stationDoor.position.x = sbX + doorSlide;

    // Update analog station clock hands to match live world time
    const h = params.timeHours % 12;
    const m = (params.timeHours - Math.floor(params.timeHours)) * 60;
    hourHandPivot.rotation.z = -(h / 12) * Math.PI * 2;
    minHandPivot.rotation.z = -(m / 60) * Math.PI * 2;

    // Update glowing warm windows, station canopy lamps, and point lights for dusk/night
    const glow = params.lanternStrength;
    windowGlowMat.emissiveIntensity = 0.2 + glow * 1.85;
    lampBulbMat.emissiveIntensity = 0.25 + glow * 2.35;
    for (let i = 0; i < warmPointLights.length; i++) {
      warmPointLights[i].light.intensity = warmPointLights[i].maxIntensity * glow;
    }

    // Animate railway crossing barriers & flashing warning lights when train approaches
    const crossingActive = params.trainDistToCrossing < 34;
    const targetAngleFactor = crossingActive ? 0.02 : 1.25;
    crossingBars.forEach((pivot, idx) => {
      const dir = idx === 0 ? 1 : -1;
      const targetRot = dir * targetAngleFactor;
      pivot.rotation.z += (targetRot - pivot.rotation.z) * Math.min(1, params.dt * 4.5);
    });
    crossingLampMat.emissiveIntensity = crossingActive
      ? Math.sin(params.elapsed * 9.0) > 0
        ? 3.2
        : 0.2
      : 0.0;
  };

  return {
    group,
    colliders,
    interactables,
    toggleStationDoor,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.remove(group);
    },
  };
}
