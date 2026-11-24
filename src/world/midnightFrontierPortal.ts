import * as THREE from 'three';
import { groundHeightAt, type AabbCollider } from '../game/terrain';
import {
  MIDNIGHT_FRONTIER_DISCOVERIES,
  MIDNIGHT_FRONTIER_PORTAL_POS,
  computeMidnightFrontierVisibility,
} from '../game/midnightFrontier';
import type { InteractableItem } from '../game/types';

export interface MidnightFrontierPortalSystem {
  group: THREE.Group;
  toggleFarmhouseDoor: () => boolean;
  toggleCellarHatch: () => boolean;
  getActiveInteractables: (timeHours: number) => InteractableItem[];
  getActiveColliders: (timeHours: number) => AabbCollider[];
  update: (timeHours: number, elapsed: number) => void;
  dispose: () => void;
}

/**
 * Exact 1:1 Physical In-World 3D Recreation of "The Midnight Frontier" (anchored at (-72, 86)):
 * - ZERO teleportation / ZERO iframe! Walk, drive, or fly straight into it in DREAMLINE!
 * - At Night, the entire Midnight Frontier valley materializes and glows big across the landscape
 *   (4 tall glowing boundary lantern/beacon towers with soft sky light beams, Holloway Abandoned Farmhouse
 *   with warm glowing amber downstairs window + swaying curtains + eerie pulsing upper gable window + hinged front door
 *   + interior oil lamp/radio/table/chairs, Red Barn + 9.5m Silo + Rusted Harvester Tractor,
 *   28-plank Arched Timber River Bridge with 6 pairs of lantern posts & X-truss rails,
 *   3 Tilted Fence Runs & Stone Wishing Well, Cornfield Scarecrow, Mossy Forest Stone Cairn,
 *   Expedition Tent + Sleeping Bag + Crackling Campfire, Subterranean Root Cellar Hatch with cyan glow,
 *   and all 8 spinning golden Discovery Beacons inspectable with [E]!).
 * - In the Morning / Daytime, the entire Midnight Frontier disappears completely (leaving an empty sunlit meadow)!
 */
export function buildMidnightFrontierPortal(): MidnightFrontierPortalSystem {
  const OX = MIDNIGHT_FRONTIER_PORTAL_POS.x;
  const OZ = MIDNIGHT_FRONTIER_PORTAL_POS.z;

  const group = new THREE.Group();
  group.visible = false;

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  const yAt = (lx: number, lz: number) => groundHeightAt(OX + lx, OZ + lz);

  // Shared PBR Materials faithful to The Midnight Frontier
  const darkWoodMat = track(new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 0.9, metalness: 0.05 }));
  const weatheredWoodMat = track(new THREE.MeshStandardMaterial({ color: 0x524034, roughness: 0.92 }));
  const barnRedMat = track(new THREE.MeshStandardMaterial({ color: 0x5c231c, roughness: 0.88 }));
  const roofSlateMat = track(new THREE.MeshStandardMaterial({ color: 0x1c212c, roughness: 0.84, metalness: 0.12 }));
  const stoneMat = track(new THREE.MeshStandardMaterial({ color: 0x4b515e, roughness: 0.94 }));
  const siloMetalMat = track(new THREE.MeshStandardMaterial({ color: 0x586270, roughness: 0.55, metalness: 0.55 }));
  const rustIronMat = track(new THREE.MeshStandardMaterial({ color: 0x6e3a24, roughness: 0.72, metalness: 0.45 }));
  const tireMat = track(new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.95 }));
  const burlapMat = track(new THREE.MeshStandardMaterial({ color: 0x8f7a58, roughness: 0.96 }));
  const tentMat = track(new THREE.MeshStandardMaterial({ color: 0x385746, roughness: 0.88, side: THREE.DoubleSide }));
  const sleepBagMat = track(new THREE.MeshStandardMaterial({ color: 0x8c2f34, roughness: 0.85 }));

  const warmGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffe4a0,
      emissive: new THREE.Color(0xff9c38),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })
  );
  const eerieGableGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffb074,
      emissive: new THREE.Color(0xd94826),
      emissiveIntensity: 1.5,
      roughness: 0.25,
    })
  );
  const cyanCellarGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x99e8ff,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 1.85,
      roughness: 0.2,
    })
  );
  const beaconGoldMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffe680,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 1.9,
      roughness: 0.22,
      metalness: 0.35,
    })
  );
  const towerBeamMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  const indigoRimMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];

  // =========================================================================
  // 0. BIG GLOWING FRONTIER BOUNDARY BEACON TOWERS & MOONLIT VALLEY RING
  // (Makes The Midnight Frontier unmistakable and glowing big at Night!)
  // =========================================================================
  const boundaryCorners = [
    { x: -34, z: -34 },
    { x: 34, z: -34 },
    { x: -34, z: 30 },
    { x: 34, z: 30 },
  ];
  const beaconOrbs: THREE.Mesh[] = [];
  const beaconShafts: THREE.Mesh[] = [];

  boundaryCorners.forEach((c) => {
    const wy = yAt(c.x, c.z);
    const tg = new THREE.Group();
    tg.position.set(OX + c.x, wy, OZ + c.z);

    // Stone pedestal + 8.5m wrought-iron frontier lantern tower
    const ped = new THREE.Mesh(track(new THREE.CylinderGeometry(1.1, 1.45, 1.4, 8)), stoneMat);
    ped.position.y = 0.7;
    const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.28, 7.6, 8)), roofSlateMat);
    pole.position.y = 4.6;
    const cage = new THREE.Mesh(track(new THREE.BoxGeometry(1.3, 1.5, 1.3)), warmGlowMat);
    cage.position.y = 8.9;
    const cap = new THREE.Mesh(track(new THREE.ConeGeometry(1.25, 1.1, 4)), roofSlateMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 10.15;

    // Translucent golden-amber vertical sky beacon beam (big glowing landmark at night!)
    const shaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.55, 2.2, 34, 12, 1, true)), towerBeamMat);
    shaft.position.y = 25.5;
    beaconShafts.push(shaft);
    beaconOrbs.push(cage);

    tg.add(ped, pole, cage, cap, shaft);
    group.add(tg);
  });

  // Glowing moonlit valley perimeter ring on the meadow floor
  const valleyRingGeo = track(new THREE.RingGeometry(41.5, 43.2, 48));
  valleyRingGeo.rotateX(-Math.PI / 2);
  const valleyRing = new THREE.Mesh(valleyRingGeo, indigoRimMat);
  valleyRing.position.set(OX, yAt(0, 0) + 0.14, OZ);
  group.add(valleyRing);

  // =========================================================================
  // 1. HOLLOWAY ABANDONED FARMHOUSE (local +24, +8)
  // =========================================================================
  const fhGroup = new THREE.Group();
  const fhY = yAt(24, 8);
  fhGroup.position.set(OX + 24, fhY, OZ + 8);
  group.add(fhGroup);

  // Raised wooden porch deck & 3 exterior front steps (-5.65..-6.35)
  const fhDeck = new THREE.Mesh(track(new THREE.BoxGeometry(10.4, 0.56, 7.4)), weatheredWoodMat);
  fhDeck.position.set(-1.1, 0.28, 0);
  fhGroup.add(fhDeck);
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.18 * (3 - s), 2.4)), weatheredWoodMat);
    step.position.set(-5.65 - s * 0.35, 0.09 * (3 - s), -1.85);
    fhGroup.add(step);
  }

  // Main farmhouse walls (7.8 x 3.8 x 7.0) with open front doorway on -X side
  const fhBackWall = new THREE.Mesh(track(new THREE.BoxGeometry(0.26, 3.8, 7.0)), darkWoodMat);
  fhBackWall.position.set(3.8, 2.46, 0);
  const fhNorthWall = new THREE.Mesh(track(new THREE.BoxGeometry(7.8, 3.8, 0.26)), darkWoodMat);
  fhNorthWall.position.set(0, 2.46, -3.4);
  const fhSouthWall = new THREE.Mesh(track(new THREE.BoxGeometry(7.8, 3.8, 0.26)), darkWoodMat);
  fhSouthWall.position.set(0, 2.46, 3.4);
  // Front wall split around hinged door (-3.8, z: -2.45..-1.25)
  const fhFrontSouth = new THREE.Mesh(track(new THREE.BoxGeometry(0.26, 3.8, 4.6)), darkWoodMat);
  fhFrontSouth.position.set(-3.8, 2.46, 1.15);
  const fhFrontNorth = new THREE.Mesh(track(new THREE.BoxGeometry(0.26, 3.8, 1.0)), darkWoodMat);
  fhFrontNorth.position.set(-3.8, 2.46, -2.95);
  const fhDoorHeader = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 1.4, 1.35)), darkWoodMat);
  fhDoorHeader.position.set(-3.8, 3.66, -1.85);
  fhGroup.add(fhBackWall, fhNorthWall, fhSouthWall, fhFrontSouth, fhFrontNorth, fhDoorHeader);

  // Interactive Hinged Front Door with Brass Knob
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-3.8, 0.56, -2.45);
  const doorSlab = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 2.4, 1.18)), weatheredWoodMat);
  doorSlab.position.set(0, 1.2, 0.59);
  const doorKnob = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 8, 8)), beaconGoldMat);
  doorKnob.position.set(-0.1, 1.12, 1.02);
  doorPivot.add(doorSlab, doorKnob);
  fhGroup.add(doorPivot);

  // Warm Glowing Amber Downstairs Window + 2 Swaying Curtains
  const winGlow = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 1.45, 1.65)), warmGlowMat);
  winGlow.position.set(-3.92, 2.25, 1.45);
  const curtainMat = track(new THREE.MeshStandardMaterial({ color: 0xe8d9be, roughness: 0.9 }));
  const curtainL = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 1.4, 0.34)), curtainMat);
  curtainL.position.set(-3.66, 2.25, 0.85);
  const curtainR = curtainL.clone();
  curtainR.position.z = 2.05;
  fhGroup.add(winGlow, curtainL, curtainR);

  // Sloped Dark Gable Roof + Attic Gables + Eerie Pulsing Upper Window + Porch Roof on 3 Posts + Stone Chimney
  const roofL = new THREE.Mesh(track(new THREE.BoxGeometry(8.6, 0.24, 4.7)), roofSlateMat);
  roofL.position.set(0, 5.25, -1.9);
  roofL.rotation.x = -0.56;
  const roofR = new THREE.Mesh(track(new THREE.BoxGeometry(8.6, 0.24, 4.7)), roofSlateMat);
  roofR.position.set(0, 5.25, 1.9);
  roofR.rotation.x = 0.56;
  const gableFront = new THREE.Mesh(track(new THREE.ConeGeometry(3.6, 2.2, 3)), darkWoodMat);
  gableFront.rotation.y = Math.PI / 2;
  gableFront.scale.set(1.0, 1.0, 0.08);
  gableFront.position.set(-3.75, 5.2, 0);
  const upperWindow = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 1.15, 0.95)), eerieGableGlowMat);
  upperWindow.position.set(-3.88, 5.15, 0);
  const porchRoof = new THREE.Mesh(track(new THREE.BoxGeometry(2.8, 0.18, 7.2)), roofSlateMat);
  porchRoof.position.set(-5.15, 3.65, 0);
  porchRoof.rotation.z = 0.14;
  for (const pz of [-3.2, 0.1, 3.2]) {
    const post = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 3.1, 0.18)), weatheredWoodMat);
    post.position.set(-6.15, 2.05, pz);
    fhGroup.add(post);
  }
  const chimney = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 3.2, 1.1)), stoneMat);
  chimney.position.set(2.4, 6.2, -1.8);
  fhGroup.add(roofL, roofR, gableFront, upperWindow, porchRoof, chimney);

  // Interior Farmhouse Furnishings: Table, Flickering Brass Oil Lamp, Vintage Radio, 2 Wooden Chairs & Cupboard
  const tableTop = new THREE.Mesh(track(new THREE.BoxGeometry(1.7, 0.1, 1.1)), weatheredWoodMat);
  tableTop.position.set(0.4, 1.38, 1.1);
  const oilLamp = new THREE.Mesh(track(new THREE.CylinderGeometry(0.12, 0.18, 0.42, 8)), warmGlowMat);
  oilLamp.position.set(0.2, 1.64, 1.05);
  const radio = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.28, 0.22)), rustIronMat);
  radio.position.set(0.75, 1.56, 1.25);
  const cupboard = new THREE.Mesh(track(new THREE.BoxGeometry(0.75, 2.3, 1.65)), darkWoodMat);
  cupboard.position.set(3.25, 1.72, -1.6);
  fhGroup.add(tableTop, oilLamp, radio, cupboard);
  for (const cz of [0.25, 1.95]) {
    const chair = new THREE.Mesh(track(new THREE.BoxGeometry(0.5, 0.9, 0.5)), weatheredWoodMat);
    chair.position.set(0.4, 1.02, cz);
    fhGroup.add(chair);
  }

  // Warm flickering farmhouse interior & porch PointLight (1 of 3 total lights)
  const farmhouseLight = new THREE.PointLight(0xffa44a, 0, 26, 1.4);
  farmhouseLight.position.set(-4.4, 2.8, 1.2);
  fhGroup.add(farmhouseLight);

  colliders.push({
    id: 'mf_farmhouse_back',
    minX: OX + 24 + 2.8,
    maxX: OX + 24 + 4.1,
    minZ: OZ + 8 - 3.6,
    maxZ: OZ + 8 + 3.6,
  });

  // =========================================================================
  // 2. ABANDONED RED BARN, 9.5m CYLINDRICAL SILO & RUSTED TRACTOR (local -26, +10)
  // =========================================================================
  const barnGroup = new THREE.Group();
  barnGroup.position.set(OX - 26, yAt(-26, 10), OZ + 10);
  group.add(barnGroup);

  const barnBody = new THREE.Mesh(track(new THREE.BoxGeometry(9.2, 5.2, 11.5)), barnRedMat);
  barnBody.position.set(0, 2.6, 0);
  const barnRoofL = new THREE.Mesh(track(new THREE.BoxGeometry(6.2, 0.24, 12.2)), roofSlateMat);
  barnRoofL.position.set(-2.5, 6.45, 0);
  barnRoofL.rotation.z = 0.56;
  const barnRoofR = new THREE.Mesh(track(new THREE.BoxGeometry(6.2, 0.24, 12.2)), roofSlateMat);
  barnRoofR.position.set(2.5, 6.45, 0);
  barnRoofR.rotation.z = -0.56;
  const barnLoftWin = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 1.5, 0.16)), warmGlowMat);
  barnLoftWin.position.set(0, 5.2, 5.8);
  barnGroup.add(barnBody, barnRoofL, barnRoofR, barnLoftWin);

  // 9.5m Cylindrical Grain Silo with Domed Metallic Cap at (-6.4, -2.5)
  const siloTower = new THREE.Mesh(track(new THREE.CylinderGeometry(2.1, 2.1, 9.5, 14)), siloMetalMat);
  siloTower.position.set(-6.4, 4.75, -2.5);
  const siloDome = new THREE.Mesh(track(new THREE.SphereGeometry(2.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), siloMetalMat);
  siloDome.position.set(-6.4, 9.5, -2.5);
  barnGroup.add(siloTower, siloDome);

  // Rusted Vintage Harvester Tractor at (+5.6, +0.4)
  const tractor = new THREE.Group();
  tractor.position.set(5.6, 0, 0.4);
  tractor.rotation.y = 0.35;
  const trHood = new THREE.Mesh(track(new THREE.BoxGeometry(1.3, 1.15, 2.4)), rustIronMat);
  trHood.position.set(0, 1.15, 0.4);
  const trCab = new THREE.Mesh(track(new THREE.BoxGeometry(1.4, 1.35, 1.25)), rustIronMat);
  trCab.position.set(0, 1.9, -0.75);
  const trStack = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 6)), roofSlateMat);
  trStack.position.set(0.32, 2.15, 1.05);
  const bigWheelGeo = track(new THREE.CylinderGeometry(0.78, 0.78, 0.42, 12));
  bigWheelGeo.rotateZ(Math.PI / 2);
  const smWheelGeo = track(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10));
  smWheelGeo.rotateZ(Math.PI / 2);
  for (const sx of [-0.88, 0.88]) {
    const rw = new THREE.Mesh(bigWheelGeo, tireMat);
    rw.position.set(sx, 0.78, -0.65);
    const fw = new THREE.Mesh(smWheelGeo, tireMat);
    fw.position.set(sx * 0.85, 0.45, 1.25);
    tractor.add(rw, fw);
  }
  tractor.add(trHood, trCab, trStack);
  barnGroup.add(tractor);

  colliders.push({
    id: 'mf_barn',
    minX: OX - 26 - 4.8,
    maxX: OX - 26 + 4.8,
    minZ: OZ + 10 - 6.0,
    maxZ: OZ + 10 + 6.0,
  });

  // =========================================================================
  // 3. 28-PLANK ARCHED TIMBER RIVER BRIDGE WITH 6 PAIRS OF LANTERN POSTS (local 0, -14)
  // =========================================================================
  const bridgeGroup = new THREE.Group();
  const brY = yAt(0, -14);
  bridgeGroup.position.set(OX, brY, OZ - 14);
  group.add(bridgeGroup);

  // Dark shimmering moonlit stream ribbon beneath the arched bridge
  const streamMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0f2538,
      emissive: new THREE.Color(0x163858),
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.35,
    })
  );
  const streamMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(34, 8.8)), streamMat);
  streamMesh.rotation.x = -Math.PI / 2;
  streamMesh.position.y = 0.08;
  bridgeGroup.add(streamMesh);

  // 28 arched timber planks spanning local z = -6.8..+6.8
  const plankGeo = track(new THREE.BoxGeometry(4.4, 0.14, 0.42));
  for (let p = 0; p < 28; p++) {
    const f = p / 27;
    const pz = -6.8 + f * 13.6;
    const archY = 0.32 + Math.sin(f * Math.PI) * 1.15;
    const plank = new THREE.Mesh(plankGeo, weatheredWoodMat);
    plank.position.set(0, archY, pz);
    bridgeGroup.add(plank);
  }
  // Stone caissons & timber pilings + 6 pairs of glowing lantern posts & side rails
  const postGeo = track(new THREE.BoxGeometry(0.18, 1.75, 0.18));
  const lanternGeo = track(new THREE.BoxGeometry(0.28, 0.34, 0.28));
  for (let i = 0; i < 6; i++) {
    const f = i / 5;
    const pz = -6.2 + f * 12.4;
    const archY = 0.32 + Math.sin(f * Math.PI) * 1.15;
    for (const sideX of [-2.15, 2.15]) {
      const post = new THREE.Mesh(postGeo, darkWoodMat);
      post.position.set(sideX, archY + 0.85, pz);
      const lamp = new THREE.Mesh(lanternGeo, warmGlowMat);
      lamp.position.set(sideX, archY + 1.85, pz);
      bridgeGroup.add(post, lamp);
    }
  }
  for (const sideX of [-2.15, 2.15]) {
    const rail = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 0.12, 13.2)), darkWoodMat);
    rail.position.set(sideX, 1.95, 0);
    bridgeGroup.add(rail);
  }

  // =========================================================================
  // 4. TIMBER FENCE RUNS, STONE WISHING WELL, SCARECROW, CAIRN & CAMPSITE
  // =========================================================================
  const fenceRuns: Array<[number, number, number, number]> = [
    [13.5, 4.2, 13.5, 13.5],
    [-4.5, 14, -4.5, 30],
    [4.5, 14, 4.5, 29],
  ];
  const fPostGeo = track(new THREE.BoxGeometry(0.16, 1.35, 0.16));
  fenceRuns.forEach(([x1, z1, x2, z2]) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const steps = Math.max(3, Math.floor(len / 2.4));
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const fx = x1 + (x2 - x1) * f;
      const fz = z1 + (z2 - z1) * f;
      const p = new THREE.Mesh(fPostGeo, weatheredWoodMat);
      p.position.set(OX + fx, yAt(fx, fz) + 0.65, OZ + fz);
      p.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.05;
      group.add(p);
    }
    const midX = (x1 + x2) * 0.5;
    const midZ = (z1 + z2) * 0.5;
    const ang = Math.atan2(x2 - x1, z2 - z1);
    const rail = new THREE.Mesh(track(new THREE.BoxGeometry(0.1, 0.12, len)), weatheredWoodMat);
    rail.position.set(OX + midX, yAt(midX, midZ) + 0.92, OZ + midZ);
    rail.rotation.y = ang;
    group.add(rail);
  });

  // Circular Stone Wishing Well at (+17.5, +14.2)
  const wellGroup = new THREE.Group();
  wellGroup.position.set(OX + 17.5, yAt(17.5, 14.2), OZ + 14.2);
  const wellBase = new THREE.Mesh(track(new THREE.CylinderGeometry(1.15, 1.25, 1.1, 10)), stoneMat);
  wellBase.position.y = 0.55;
  const wellPostL = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 1.6, 0.14)), darkWoodMat);
  wellPostL.position.set(-0.95, 1.75, 0);
  const wellPostR = wellPostL.clone();
  wellPostR.position.x = 0.95;
  const wellRoof = new THREE.Mesh(track(new THREE.ConeGeometry(1.65, 1.2, 6)), roofSlateMat);
  wellRoof.position.y = 3.05;
  wellGroup.add(wellBase, wellPostL, wellPostR, wellRoof);
  group.add(wellGroup);

  // Burlap Cornfield Scarecrow at (-16, +18)
  const scGroup = new THREE.Group();
  scGroup.position.set(OX - 16, yAt(-16, 18), OZ + 18);
  const scPole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6)), darkWoodMat);
  scPole.position.y = 1.6;
  const scArms = new THREE.Mesh(track(new THREE.CylinderGeometry(0.07, 0.07, 2.3, 6)), darkWoodMat);
  scArms.rotation.z = Math.PI / 2;
  scArms.position.y = 2.25;
  const scCoat = new THREE.Mesh(track(new THREE.ConeGeometry(0.65, 1.45, 7)), burlapMat);
  scCoat.position.y = 1.75;
  const scHead = new THREE.Mesh(track(new THREE.SphereGeometry(0.32, 8, 8)), burlapMat);
  scHead.position.y = 2.75;
  const scHat = new THREE.Mesh(track(new THREE.ConeGeometry(0.62, 0.55, 8)), roofSlateMat);
  scHat.position.y = 3.15;
  scGroup.add(scPole, scArms, scCoat, scHead, scHat);
  group.add(scGroup);

  // Mossy 5-Stone Forest Cairn at (-24, -34)
  const cairnGroup = new THREE.Group();
  cairnGroup.position.set(OX - 24, yAt(-24, -34), OZ - 34);
  [1.05, 0.82, 0.64, 0.46, 0.3].forEach((r, idx) => {
    const st = new THREE.Mesh(track(new THREE.DodecahedronGeometry(r, 0)), stoneMat);
    st.scale.set(1.2, 0.55, 1.1);
    st.position.y = 0.25 + idx * 0.48;
    st.rotation.y = idx * 0.7;
    cairnGroup.add(st);
  });
  group.add(cairnGroup);

  // Expedition Campsite: A-Frame Tent + Sleeping Bag + 10-Stone Crackling Campfire at (0, -24.5)
  const campGroup = new THREE.Group();
  campGroup.position.set(OX, yAt(0, -24.5), OZ - 24.5);
  const tent = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 1.85, 2.2, 4)), tentMat);
  tent.rotation.y = Math.PI / 4;
  tent.position.set(-2.6, 1.1, -0.6);
  const sleepBag = new THREE.Mesh(track(new THREE.BoxGeometry(0.85, 0.18, 1.95)), sleepBagMat);
  sleepBag.position.set(-2.6, 0.1, -0.6);
  campGroup.add(tent, sleepBag);

  const fireGroup = new THREE.Group();
  fireGroup.position.set(0.4, 0, 0.4);
  for (let s = 0; s < 10; s++) {
    const a = (s / 10) * Math.PI * 2;
    const rock = new THREE.Mesh(track(new THREE.DodecahedronGeometry(0.22, 0)), stoneMat);
    rock.position.set(Math.cos(a) * 0.78, 0.15, Math.sin(a) * 0.78);
    fireGroup.add(rock);
  }
  const campFlame = new THREE.Mesh(track(new THREE.ConeGeometry(0.42, 1.15, 7)), warmGlowMat);
  campFlame.position.y = 0.6;
  fireGroup.add(campFlame);
  const campLight = new THREE.PointLight(0xff8a30, 0, 22, 1.45);
  campLight.position.set(0, 1.3, 0);
  fireGroup.add(campLight);
  campGroup.add(fireGroup);
  group.add(campGroup);

  // =========================================================================
  // 5. SUBTERRANEAN ROOT CELLAR MOUND & HINGED IRON HATCH (local +30, -38)
  // =========================================================================
  const cellarGroup = new THREE.Group();
  const celY = yAt(30, -38);
  cellarGroup.position.set(OX + 30, celY, OZ - 38);
  const mound = new THREE.Mesh(track(new THREE.SphereGeometry(3.8, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)), stoneMat);
  mound.scale.set(1.2, 0.75, 1.0);
  const bulkhead = new THREE.Mesh(track(new THREE.BoxGeometry(2.4, 1.1, 2.2)), stoneMat);
  bulkhead.position.set(-2.4, 0.55, 0);
  const hatchPivot = new THREE.Group();
  hatchPivot.position.set(-1.3, 1.1, 0);
  const hatchDoor = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 0.14, 1.9)), rustIronMat);
  hatchDoor.position.set(-1.05, 0, 0);
  hatchDoor.rotation.z = 0.28;
  hatchPivot.add(hatchDoor);
  const cellarGlowPlate = new THREE.Mesh(track(new THREE.PlaneGeometry(1.7, 1.6)), cyanCellarGlowMat);
  cellarGlowPlate.rotation.x = -Math.PI / 2;
  cellarGlowPlate.position.set(-2.4, 0.25, 0);
  const cellarLight = new THREE.PointLight(0x68b6ff, 0, 18, 1.5);
  cellarLight.position.set(-2.4, 1.8, 0);
  cellarGroup.add(mound, bulkhead, hatchPivot, cellarGlowPlate, cellarLight);
  group.add(cellarGroup);

  // =========================================================================
  // 6. ALL 8 SPINNING GOLDEN DISCOVERY BEACONS (Inspectable with [E] in-world!)
  // =========================================================================
  const beaconMeshes: Array<{ mesh: THREE.Mesh; baseY: number; phase: number }> = [];
  const octGeo = track(new THREE.OctahedronGeometry(0.45, 0));
  const ringHaloGeo = track(new THREE.TorusGeometry(0.82, 0.05, 6, 16));
  ringHaloGeo.rotateX(Math.PI / 2);

  MIDNIGHT_FRONTIER_DISCOVERIES.forEach((disc, idx) => {
    const wx = OX + disc.localX;
    const wz = OZ + disc.localZ;
    const wy = yAt(disc.localX, disc.localZ);

    const oct = new THREE.Mesh(octGeo, beaconGoldMat);
    oct.position.set(wx, wy + 1.55, wz);
    const halo = new THREE.Mesh(ringHaloGeo, beaconGoldMat);
    halo.position.set(wx, wy + 0.18, wz);
    group.add(oct, halo);
    beaconMeshes.push({ mesh: oct, baseY: wy + 1.55, phase: idx * 0.85 });

    interactables.push({
      id: `mf_disc_${disc.id}`,
      kind: 'midnight_frontier_discovery',
      label: disc.promptText,
      sublabel: `The Midnight Frontier · ${disc.category}`,
      x: wx,
      y: wy + 1.2,
      z: wz,
      radius: disc.radius,
      metaId: disc.id,
    });
  });

  // =========================================================================
  // 6B. ULTRA-BRIGHT NIGHTTIME TELEPORTATION PORTAL & 240M SKY BEACON (VISIBLE FROM ANY DISTANCE!)
  // =========================================================================
  const portalBaseY = yAt(0, 0);
  const portalGroup = new THREE.Group();
  portalGroup.position.set(OX, portalBaseY, OZ);

  const portalRingMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  const portalCoreMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.56,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  const skyPillarMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  const skyOuterBeamMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );

  // Sculpted stone portal dais + glowing vertical rift gate
  const dais = new THREE.Mesh(track(new THREE.CylinderGeometry(3.4, 3.9, 0.32, 16)), stoneMat);
  dais.position.y = 0.16;
  const portalArch = new THREE.Mesh(track(new THREE.TorusGeometry(2.55, 0.24, 12, 32)), portalRingMat);
  portalArch.position.y = 2.75;
  const portalVortex = new THREE.Mesh(track(new THREE.CircleGeometry(2.38, 28)), portalCoreMat);
  portalVortex.position.y = 2.75;
  const portalInnerHalo = new THREE.Mesh(track(new THREE.TorusGeometry(1.75, 0.11, 10, 28)), skyOuterBeamMat);
  portalInnerHalo.position.y = 2.75;
  // Towering 260m fog-free sky beacon pillar + crown orb visible from anywhere in Dreamline at Night!
  const skyPillarCore = new THREE.Mesh(track(new THREE.CylinderGeometry(0.95, 1.85, 260, 12, 1, true)), skyPillarMat);
  skyPillarCore.position.y = 130;
  const skyPillarOuter = new THREE.Mesh(track(new THREE.CylinderGeometry(3.2, 4.4, 260, 12, 1, true)), skyOuterBeamMat);
  skyPillarOuter.position.y = 130;
  const skyCrownOrb = new THREE.Mesh(track(new THREE.SphereGeometry(4.2, 16, 12)), portalRingMat);
  skyCrownOrb.position.y = 62;
  const portalLight = new THREE.PointLight(0xffd166, 0, 48, 1.2);
  portalLight.position.set(0, 4.2, 0);

  portalGroup.add(dais, portalArch, portalVortex, portalInnerHalo, skyPillarCore, skyPillarOuter, skyCrownOrb, portalLight);
  group.add(portalGroup);

  // Interactive Portal Gate + Farmhouse Door + Cellar Hatch prompts
  interactables.push(
    {
      id: 'mf_enter_portal',
      kind: 'midnight_frontier_portal',
      label: 'Enter The Midnight Frontier Portal',
      sublabel: 'Step into the glowing gate to launch the game-inside-a-game',
      x: OX,
      y: portalBaseY + 1.4,
      z: OZ,
      radius: 4.6,
    },
    {
      id: 'mf_toggle_farmhouse_door',
      kind: 'midnight_frontier_door',
      label: 'Open / Close Holloway Farmhouse Door',
      sublabel: 'The Midnight Frontier · Step inside to the oil lamp & radio',
      x: OX + 24 - 4.5,
      y: fhY + 1.2,
      z: OZ + 8 - 1.85,
      radius: 3.4,
    },
    {
      id: 'mf_toggle_cellar_hatch',
      kind: 'midnight_frontier_cellar',
      label: 'Open / Close Iron Root Cellar Hatch',
      sublabel: 'The Midnight Frontier · Glowing subterranean vault',
      x: OX + 30 - 3.6,
      y: celY + 1.0,
      z: OZ - 38,
      radius: 4.0,
    }
  );

  let doorOpen = false;
  let cellarOpen = false;

  const toggleFarmhouseDoor = () => {
    doorOpen = !doorOpen;
    return doorOpen;
  };
  const toggleCellarHatch = () => {
    cellarOpen = !cellarOpen;
    return cellarOpen;
  };

  const getActiveInteractables = (timeHours: number): InteractableItem[] =>
    computeMidnightFrontierVisibility(timeHours) > 0.05 ? interactables : [];

  const getActiveColliders = (timeHours: number): AabbCollider[] =>
    computeMidnightFrontierVisibility(timeHours) > 0.05 ? colliders : [];

  const update = (timeHours: number, elapsed: number) => {
    const vis = computeMidnightFrontierVisibility(timeHours);
    group.visible = vis > 0.01;
    if (!group.visible) return;

    // Smooth door & cellar hatch hinges
    const targetDoorYaw = doorOpen ? -Math.PI * 0.58 : 0;
    doorPivot.rotation.y += (targetDoorYaw - doorPivot.rotation.y) * 0.14;
    const targetHatchRot = cellarOpen ? -Math.PI * 0.45 : 0;
    hatchPivot.rotation.z += (targetHatchRot - hatchPivot.rotation.z) * 0.14;

    // Big dramatic night glow animations!
    const flicker = 0.88 + Math.sin(elapsed * 9.5) * 0.08 + Math.cos(elapsed * 14.2) * 0.06;
    const eeriePulse = 0.9 + Math.sin(elapsed * 2.1) * 0.65;
    warmGlowMat.emissiveIntensity = 2.15 * vis * flicker;
    eerieGableGlowMat.emissiveIntensity = 1.65 * vis * eeriePulse;
    cyanCellarGlowMat.emissiveIntensity = (1.5 + Math.sin(elapsed * 3.0) * 0.4) * vis;
    beaconGoldMat.emissiveIntensity = (1.8 + Math.sin(elapsed * 3.8) * 0.45) * vis;
    towerBeamMat.opacity = (0.14 + Math.sin(elapsed * 1.4) * 0.03) * vis;
    indigoRimMat.opacity = 0.24 * vis;

    farmhouseLight.intensity = 5.4 * vis * flicker;
    campLight.intensity = 4.6 * vis * flicker;
    cellarLight.intensity = 3.8 * vis;

    // Gentle curtain sway & campfire flame dance
    curtainL.rotation.z = Math.sin(elapsed * 1.8) * 0.08;
    curtainR.rotation.z = Math.cos(elapsed * 1.6) * 0.08;
    campFlame.scale.set(0.95 + Math.sin(elapsed * 12) * 0.1, flicker * 1.15, 0.95);

    // Spin & float all 8 golden Discovery Beacons + beacon tower orbs
    for (let i = 0; i < beaconMeshes.length; i++) {
      const b = beaconMeshes[i];
      b.mesh.rotation.y = elapsed * 1.6 + b.phase;
      b.mesh.position.y = b.baseY + Math.sin(elapsed * 2.4 + b.phase) * 0.24;
    }
    for (let i = 0; i < beaconOrbs.length; i++) {
      beaconOrbs[i].rotation.y = elapsed * 0.7 + i;
      beaconShafts[i].rotation.y = -elapsed * 0.25;
    }

    // Ultra-bright Nighttime Portal & 260m Sky Pillar pulsing visible from ANY distance!
    const portalPulse = 0.85 + Math.sin(elapsed * 3.4) * 0.15;
    portalArch.rotation.z = elapsed * 0.55;
    portalInnerHalo.rotation.z = -elapsed * 1.1;
    portalInnerHalo.rotation.y = Math.sin(elapsed * 1.4) * 0.35;
    portalVortex.rotation.z = elapsed * 0.9;
    portalRingMat.opacity = 0.98 * vis;
    portalCoreMat.opacity = (0.56 + Math.sin(elapsed * 4.2) * 0.14) * vis;
    skyPillarMat.opacity = (0.52 + Math.sin(elapsed * 2.2) * 0.14) * vis;
    skyOuterBeamMat.opacity = (0.28 + Math.cos(elapsed * 1.9) * 0.08) * vis;
    skyPillarCore.rotation.y = elapsed * 0.35;
    skyPillarOuter.rotation.y = -elapsed * 0.22;
    skyCrownOrb.scale.setScalar((0.92 + Math.sin(elapsed * 2.6) * 0.18) * vis);
    portalLight.intensity = 10.5 * vis * portalPulse;
  };

  return {
    group,
    toggleFarmhouseDoor,
    toggleCellarHatch,
    getActiveInteractables,
    getActiveColliders,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
