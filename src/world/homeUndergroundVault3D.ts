import * as THREE from 'three';
import type { HeroCharacterId } from '../game/heroCharacters';
import type { InteractableItem } from '../game/types';
import {
  VAULT_ARMORY_CONSOLE_POS,
  VAULT_BATMOBILE_BAY,
  VAULT_CAR_SPECS,
  VAULT_CEILING_Y,
  VAULT_CONNECTOR_END_Z,
  VAULT_CONNECTOR_MAX_X,
  VAULT_CONNECTOR_MIN_X,
  VAULT_CONNECTOR_START_Z,
  VAULT_ELEVATOR_POS,
  VAULT_EXIT_GATE_X,
  VAULT_EXIT_TUNNEL_POS,
  VAULT_FAR_GATE_CONTROL_POS,
  VAULT_FLOOR_Y,
  VAULT_GATE_CONTROL_POS,
  VAULT_HALF_X,
  VAULT_HALF_Z,
  VAULT_HERO_PODS,
  VAULT_HOME_INTERIOR_DOOR_MAX_Z,
  VAULT_HOME_INTERIOR_DOOR_MIN_Z,
  VAULT_HOME_TUNNEL_HALF_X,
  VAULT_HOME_TUNNEL_MAX_X,
  VAULT_HOME_TUNNEL_MIN_X,
  VAULT_HOME_TUNNEL_MOUTH_Z,
  VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z,
  VAULT_HOME_TUNNEL_RAMP_TOP_Z,
  VAULT_HOME_TUNNEL_X,
  VAULT_MEGA_CENTER_X,
  VAULT_MEGA_CHAMBER_LENGTH,
  VAULT_MEGA_END_Z,
  VAULT_MEGA_MAX_X,
  VAULT_MEGA_MIN_X,
  VAULT_MEGA_START_Z,
  VAULT_MEGA_WIDTH,
  VAULT_PASSAGE_END_X,
  VAULT_PASSAGE_HALF_Z,
  VAULT_PASSAGE_HEIGHT,
  VAULT_PASSAGE_START_X,
  VAULT_SURFACE_PORTAL_X,
  VAULT_SURFACE_PORTAL_Y,
  vaultFloorYAt,
  type VaultCarId,
  type VaultCarRuntimeState,
  type VaultCarSpec,
} from '../game/homeUndergroundVault';
import { createHeroCharacterRig, type HeroRig3D } from './heroCharacters3D';

export interface HomeUndergroundVault3D {
  /** Subterranean bunker chamber, House Secret Tunnel ramp, and 1 KM Mega-Chamber */
  chamberGroup: THREE.Group;
  /** Permanent surface-side portals (Superhero House Secret Tunnel under Pad B + East Ramp Portal at x=122) */
  surfacePortalGroup: THREE.Group;
  /** Drivable vault car 3D rigs (individually toggled visible based on whether each car is inVault vs surface) */
  carsGroup: THREE.Group;
  /** Static vault interactables (7 hero costume pods, armory console, elevator up, blast gate controls) */
  interactables: InteractableItem[];
  update: (params: {
    inVault: boolean;
    elevatorPhase?: 'idle' | 'descending' | 'ascending';
    elevatorY?: number;
    activeHeroId: HeroCharacterId | null;
    cars: VaultCarRuntimeState[];
    exitGateProgress: number;
    hatchOpenProgress?: number;
    playerZ?: number;
    elapsed: number;
    dt: number;
  }) => void;
  dispose: () => void;
}

function makeSignTexture(
  title: string,
  subtitle: string,
  accentHex: string,
  w = 512,
  h = 128
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, h * 0.48);
  ctx.fillStyle = accentHex;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(subtitle, w / 2, h * 0.8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

interface CarMeshRig {
  id: VaultCarId;
  root: THREE.Group;
  frontWheels: THREE.Group[];
  rearWheels: THREE.Group[];
  boostFlame: THREE.Mesh;
  headlightBeamMat: THREE.MeshBasicMaterial;
  headlightLight: THREE.PointLight;
}

function buildCompositeVaultCar(spec: VaultCarSpec, isSoftwareGl: boolean): CarMeshRig {
  const root = new THREE.Group();
  const isSuv = spec.id === 'vault_suv';
  const isRoadster = spec.id === 'vault_roadster';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: spec.bodyHex,
    roughness: isSuv ? 0.42 : 0.2,
    metalness: isSuv ? 0.48 : 0.78,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x161b26,
    roughness: 0.46,
    metalness: 0.55,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: spec.accentHex,
    emissive: spec.accentHex,
    emissiveIntensity: 0.6,
    roughness: 0.25,
    metalness: 0.7,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0b1628,
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.82,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.22, metalness: 0.88 });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff8dc });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a3c });

  // 1. Chassis lower floorpan + side skirts
  const chassisW = isSuv ? 2.15 : 2.02;
  const chassisH = isSuv ? 0.62 : 0.42;
  const chassisL = isSuv ? 4.65 : 4.55;
  const rideY = isSuv ? 0.68 : 0.46;

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(chassisW, chassisH, chassisL), bodyMat);
  lowerBody.position.set(0, rideY, 0);
  lowerBody.castShadow = !isSoftwareGl;
  lowerBody.receiveShadow = true;
  root.add(lowerBody);

  // Sculpted front splitter + hood slope
  const frontSplitter = new THREE.Mesh(
    new THREE.BoxGeometry(chassisW + 0.08, 0.1, 0.62),
    carbonMat
  );
  frontSplitter.position.set(0, rideY - chassisH * 0.45, chassisL * 0.48);
  root.add(frontSplitter);

  const hoodMesh = new THREE.Mesh(
    new THREE.BoxGeometry(chassisW * 0.88, isSuv ? 0.34 : 0.22, 1.55),
    bodyMat
  );
  hoodMesh.position.set(0, rideY + chassisH * 0.45, 1.15);
  hoodMesh.rotation.x = isSuv ? 0.05 : 0.14;
  root.add(hoodMesh);

  // Racing / accent hood stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, chassisL * 0.82), accentMat);
  stripe.position.set(0, rideY + chassisH * 0.52, 0.05);
  root.add(stripe);

  // 2. Cabin / Cockpit Canopy
  if (isSuv) {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.82, 2.55), bodyMat);
    cabin.position.set(0, rideY + 0.68, -0.35);
    cabin.castShadow = !isSoftwareGl;
    root.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.62, 0.12), glassMat);
    windshield.position.set(0, rideY + 0.68, 0.96);
    windshield.rotation.x = -0.34;
    root.add(windshield);

    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.48, 2.05), glassMat);
    sideWin.position.set(0, rideY + 0.72, -0.32);
    root.add(sideWin);

    // Tactical Roof Rack + LED Lightbar
    const roofRack = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 1.85), carbonMat);
    roofRack.position.set(0, rideY + 1.14, -0.42);
    const roofLightBar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.09, 0.12), headlightMat);
    roofLightBar.position.set(0, rideY + 1.16, 0.64);
    root.add(roofRack, roofLightBar);
  } else if (isRoadster) {
    // Sleek open-top cockpit with twin roll hoops + swept aero windscreen
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.44, 0.1), glassMat);
    windscreen.position.set(0, rideY + 0.44, 0.62);
    windscreen.rotation.x = -0.78;
    root.add(windscreen);

    const cockpitTub = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.24, 1.35), carbonMat);
    cockpitTub.position.set(0, rideY + 0.24, -0.2);
    root.add(cockpitTub);

    for (const sx of [-0.46, 0.46]) {
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.16), bodyMat);
      seatBack.position.set(sx, rideY + 0.42, -0.58);
      seatBack.rotation.x = -0.18;
      const rollHoop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 12, Math.PI), accentMat);
      rollHoop.position.set(sx, rideY + 0.48, -0.72);
      root.add(seatBack, rollHoop);
    }

    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.24, 1.25), bodyMat);
    rearDeck.position.set(0, rideY + 0.34, -1.35);
    root.add(rearDeck);
  } else {
    // Sleek Crimson Apex Hypercar teardrop cockpit + high carbon rear wing
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.5, 2.05), glassMat);
    canopy.position.set(0, rideY + 0.44, -0.18);
    root.add(canopy);

    const roofSpine = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 1.75), bodyMat);
    roofSpine.position.set(0, rideY + 0.68, -0.28);
    root.add(roofSpine);

    // Carbon Rear Aero Wing
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.06, 0.38), carbonMat);
    wingBlade.position.set(0, rideY + 0.72, -2.05);
    wingBlade.rotation.x = 0.14;
    root.add(wingBlade);
    for (const wx of [-0.62, 0.62]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.22), accentMat);
      strut.position.set(wx, rideY + 0.5, -2.0);
      root.add(strut);
    }
  }

  // 3. Headlights + Full-Width LED Taillight Bar + Rear Diffuser
  for (const sx of [-0.68, 0.68]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.08), headlightMat);
    hl.position.set(sx, rideY + 0.08, chassisL * 0.5 + 0.02);
    root.add(hl);
  }
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(chassisW * 0.86, 0.1, 0.08), tailMat);
  tailBar.position.set(0, rideY + 0.14, -chassisL * 0.5 - 0.02);
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(chassisW * 0.88, 0.2, 0.28), carbonMat);
  rearDiffuser.position.set(0, rideY - chassisH * 0.35, -chassisL * 0.48);
  root.add(tailBar, rearDiffuser);

  // Turbo Boost Exhaust Plume
  const boostFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 1.45, 10),
    new THREE.MeshBasicMaterial({
      color: spec.accentHex,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  boostFlame.rotation.x = -Math.PI / 2;
  boostFlame.position.set(0, rideY - 0.08, -chassisL * 0.5 - 0.78);
  boostFlame.visible = false;
  root.add(boostFlame);

  // Subtle forward headlight pool light
  const headlightLight = new THREE.PointLight(0xfff1cc, 1.6, 16, 1.5);
  headlightLight.position.set(0, rideY + 0.35, chassisL * 0.5 + 1.2);
  root.add(headlightLight);

  // 4. Four Articulated Spoked Wheels (front steering + spin, rear spin)
  const wheelR = isSuv ? 0.46 : 0.37;
  const wheelW = isSuv ? 0.3 : 0.28;
  const wheelZFront = 1.42;
  const wheelZRear = -1.42;
  const wheelTrackX = chassisW * 0.5 + 0.03;

  const frontWheels: THREE.Group[] = [];
  const rearWheels: THREE.Group[] = [];

  const makeWheel = (wx: number, wz: number, isFront: boolean) => {
    const steerGroup = new THREE.Group();
    steerGroup.position.set(wx, wheelR, wz);
    const spinGroup = new THREE.Group();

    const tireGeo = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 14);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);

    const rimGeo = new THREE.CylinderGeometry(wheelR * 0.62, wheelR * 0.62, wheelW + 0.02, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);

    const spoke = new THREE.Mesh(new THREE.BoxGeometry(wheelW + 0.03, wheelR * 1.1, 0.07), accentMat);
    spinGroup.add(tire, rim, spoke);
    steerGroup.add(spinGroup);
    root.add(steerGroup);

    if (isFront) {
      steerGroup.userData.spinGroup = spinGroup;
      frontWheels.push(steerGroup);
    } else {
      rearWheels.push(spinGroup);
    }
  };

  makeWheel(-wheelTrackX, wheelZFront, true);
  makeWheel(wheelTrackX, wheelZFront, true);
  makeWheel(-wheelTrackX, wheelZRear, false);
  makeWheel(wheelTrackX, wheelZRear, false);

  return {
    id: spec.id,
    root,
    frontWheels,
    rearWheels,
    boostFlame,
    headlightBeamMat: headlightMat,
    headlightLight,
  };
}

/**
 * Builds the Secret Underground Superhero Costume Vault & Large Rideable Car Garage
 * hidden beneath En Illam (My Home).
 */
export function buildHomeUndergroundVault3D(isSoftwareGl = false): HomeUndergroundVault3D {
  const chamberGroup = new THREE.Group();
  chamberGroup.visible = false;

  const surfacePortalGroup = new THREE.Group();
  const carsGroup = new THREE.Group();

  const disposables: Array<{ dispose: () => void }> = [];
  const interactables: InteractableItem[] = [];

  const W = VAULT_HALF_X * 2; // 56m
  const D = VAULT_HALF_Z * 2; // 48m
  const H = VAULT_CEILING_Y - VAULT_FLOOR_Y; // 22m
  const midY = VAULT_FLOOR_Y + H * 0.5;

  // Materials
  const epoxyFloorMat = new THREE.MeshStandardMaterial({
    color: 0x161d2b,
    roughness: 0.28,
    metalness: 0.35,
  });
  const concreteWallMat = new THREE.MeshStandardMaterial({
    color: 0x1f2838,
    roughness: 0.78,
    metalness: 0.18,
  });
  const steelRibMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.38,
    metalness: 0.72,
  });
  const cyanStripMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.75,
    roughness: 0.2,
  });
  const amberStripMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const exitGreenMat = new THREE.MeshStandardMaterial({
    color: 0x6ee7b7,
    emissive: 0x10b981,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const podGlassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.22,
  });
  disposables.push(
    epoxyFloorMat,
    concreteWallMat,
    steelRibMat,
    cyanStripMat,
    amberStripMat,
    exitGreenMat,
    podGlassMat
  );

  // 1. Subterranean Floor, Ceiling & 4 Perimeter Walls
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 2, 0.5, D + 2), epoxyFloorMat);
  floor.position.set(0, VAULT_FLOOR_Y - 0.25, 0);
  floor.receiveShadow = true;
  chamberGroup.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(W + 2, 0.6, D + 2), concreteWallMat);
  ceiling.position.set(0, VAULT_CEILING_Y + 0.3, 0);
  chamberGroup.add(ceiling);

  // North wall split around the 7.6m-wide Connector Avenue mouth (x in [-27.8, -20.2], height 11.0m) -> 1 KM Mega-Chamber!
  const connW = VAULT_CONNECTOR_MAX_X - VAULT_CONNECTOR_MIN_X; // 7.6m
  const connCenterX = (VAULT_CONNECTOR_MIN_X + VAULT_CONNECTOR_MAX_X) * 0.5; // -24.0
  const connH = 11.0;
  const northRightW = VAULT_HALF_X + 1.0 - VAULT_CONNECTOR_MAX_X; // 49.2m
  const northWallMain = new THREE.Mesh(new THREE.BoxGeometry(northRightW, H, 0.8), concreteWallMat);
  northWallMain.position.set(VAULT_CONNECTOR_MAX_X + northRightW * 0.5, midY, -VAULT_HALF_Z - 0.4);
  const northConnUpperH = Math.max(2.0, H - connH);
  const northWallConnTop = new THREE.Mesh(
    new THREE.BoxGeometry(connW + 1.4, northConnUpperH, 0.8),
    concreteWallMat
  );
  northWallConnTop.position.set(connCenterX, VAULT_CEILING_Y - northConnUpperH * 0.5, -VAULT_HALF_Z - 0.4);
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(W + 2, H, 0.8), concreteWallMat);
  southWall.position.set(0, midY, VAULT_HALF_Z + 0.4);
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, D + 2), concreteWallMat);
  westWall.position.set(-VAULT_HALF_X - 0.4, midY, 0);
  // East wall split around the tall 10.5m x 10.8m East Driving Passage opening (z in [-5.4, +5.4])
  const eastWallN = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, 18.8), concreteWallMat);
  eastWallN.position.set(VAULT_HALF_X + 0.4, midY, -14.8);
  const eastWallS = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, 18.8), concreteWallMat);
  eastWallS.position.set(VAULT_HALF_X + 0.4, midY, 14.8);
  const eastUpperH = Math.max(2.0, H - VAULT_PASSAGE_HEIGHT);
  const eastWallTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, eastUpperH, VAULT_PASSAGE_HALF_Z * 2 + 0.4),
    concreteWallMat
  );
  eastWallTop.position.set(VAULT_HALF_X + 0.4, VAULT_CEILING_Y - eastUpperH * 0.5, 0);
  chamberGroup.add(northWallMain, northWallConnTop, southWall, westWall, eastWallN, eastWallS, eastWallTop);

  // Monumental 22m-Tall Steel Vault Arches, Upper Gallery Catwalks & Soaring Overhead Light Strips
  for (let x = -21; x <= 21; x += 7) {
    if (x > VAULT_CONNECTOR_MAX_X + 0.5) {
      const colN = new THREE.Mesh(new THREE.BoxGeometry(0.75, H, 0.85), steelRibMat);
      colN.position.set(x, midY, -VAULT_HALF_Z + 0.45);
      const vertStrip = new THREE.Mesh(new THREE.BoxGeometry(0.18, H - 3.2, 0.14), cyanStripMat);
      vertStrip.position.set(x, midY, -VAULT_HALF_Z + 0.94);
      chamberGroup.add(colN, vertStrip);
    }
    const colS = new THREE.Mesh(new THREE.BoxGeometry(0.75, H, 0.85), steelRibMat);
    colS.position.set(x, midY, VAULT_HALF_Z - 0.45);
    const roofBeam = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, D - 1.5), steelRibMat);
    roofBeam.position.set(x, VAULT_CEILING_Y - 0.42, 0);
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, D - 6), cyanStripMat);
    ledBar.position.set(x, VAULT_CEILING_Y - 0.9, 0);
    chamberGroup.add(colS, roofBeam, ledBar);
  }

  // Elevated Mid-Height Steel Catwalk Balcony Ring (y = VAULT_FLOOR_Y + 11.5m) framing the massive vertical cavern
  const catwalkY = VAULT_FLOOR_Y + 11.5;
  const catwalkN = new THREE.Mesh(new THREE.BoxGeometry(W - 2, 0.36, 2.8), steelRibMat);
  catwalkN.position.set(0, catwalkY, -VAULT_HALF_Z + 1.8);
  const catwalkS = new THREE.Mesh(new THREE.BoxGeometry(W - 2, 0.36, 2.8), steelRibMat);
  catwalkS.position.set(0, catwalkY, VAULT_HALF_Z - 1.8);
  const catwalkW = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.36, D - 6), steelRibMat);
  catwalkW.position.set(-VAULT_HALF_X + 1.8, catwalkY, 0);
  const catwalkGlowN = new THREE.Mesh(new THREE.BoxGeometry(W - 4, 0.12, 0.14), amberStripMat);
  catwalkGlowN.position.set(0, catwalkY + 0.95, -VAULT_HALF_Z + 3.15);
  const catwalkGlowS = new THREE.Mesh(new THREE.BoxGeometry(W - 4, 0.12, 0.14), amberStripMat);
  catwalkGlowS.position.set(0, catwalkY + 0.95, VAULT_HALF_Z - 3.15);
  chamberGroup.add(catwalkN, catwalkS, catwalkW, catwalkGlowN, catwalkGlowS);

  // Painted Illuminated Floor Driving Lane Guides (central driving arena!)
  for (const lz of [-9.5, 13.5]) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(46, 0.03, 0.22), amberStripMat);
    lane.position.set(0, VAULT_FLOOR_Y + 0.02, lz);
    chamberGroup.add(lane);
  }
  const centerDrivingRing = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.08, 6, 36), cyanStripMat);
  centerDrivingRing.rotation.x = Math.PI / 2;
  centerDrivingRing.position.set(0, VAULT_FLOOR_Y + 0.03, -2.2);
  chamberGroup.add(centerDrivingRing);

  // Illuminated Car Parking Turntable Pads (4 bays: 3 vault cars + Batmobile!)
  const bayCoords = [
    ...VAULT_CAR_SPECS.map((s) => ({ x: s.homeBayX, z: s.homeBayZ, color: s.accentHex })),
    { x: VAULT_BATMOBILE_BAY.x, z: VAULT_BATMOBILE_BAY.z, color: 0xf59e0b },
  ];
  for (const bay of bayCoords) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.08, 22), steelRibMat);
    disc.position.set(bay.x, VAULT_FLOOR_Y + 0.04, bay.z);
    const ringMat = new THREE.MeshStandardMaterial({
      color: bay.color,
      emissive: bay.color,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    disposables.push(ringMat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.07, 8, 28), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(bay.x, VAULT_FLOOR_Y + 0.09, bay.z);
    chamberGroup.add(disc, ring);
  }

  // 2. ALL 7 SUPERHERO COSTUME DISPLAY PODS ALONG NORTH HERO VAULT WING (z = -18.2)
  const vaultBannerTex = makeSignTexture(
    'SECRET SUPERHERO VAULT & GARAGE',
    'WALK TO ANY POD [E] TO WEAR COSTUME · DRIVE CARS THROUGH EAST TUNNEL',
    '#38bdf8',
    1024,
    128
  );
  disposables.push(vaultBannerTex);
  const vaultBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(21.0, 2.5),
    new THREE.MeshBasicMaterial({ map: vaultBannerTex })
  );
  vaultBanner.position.set(0, VAULT_FLOOR_Y + 9.2, -VAULT_HALF_Z + 0.96);
  chamberGroup.add(vaultBanner);

  const heroPodRigs: Array<{
    heroId: HeroCharacterId;
    rig: HeroRig3D;
    ringMat: THREE.MeshStandardMaterial;
    turntable: THREE.Group;
  }> = [];

  for (const pod of VAULT_HERO_PODS) {
    const podGroup = new THREE.Group();
    podGroup.position.set(pod.x, VAULT_FLOOR_Y, pod.z);

    // Armored steel alcove back & upper canopy
    const alcoveBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.9, 0.55), steelRibMat);
    alcoveBack.position.set(0, 2.45, -1.65);
    const alcoveCap = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.65, 0.36, 18), steelRibMat);
    alcoveCap.position.set(0, 4.72, 0);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.58, 0.34, 18), steelRibMat);
    pedestal.position.set(0, 0.17, 0);

    const ringMat = new THREE.MeshStandardMaterial({
      color: pod.accentHex,
      emissive: pod.accentHex,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    disposables.push(ringMat);

    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.065, 8, 24), ringMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.set(0, 0.36, 0);

    const topRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.055, 8, 24), ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, 4.5, 0);

    // Curved open-front glass display cylinder
    const glassArc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.42, 4.1, 18, 1, true, Math.PI * 0.28, Math.PI * 1.44),
      podGlassMat
    );
    glassArc.position.set(0, 2.42, 0);

    // Glowing nameplate plaque
    const hexCss = `#${pod.accentHex.toString(16).padStart(6, '0')}`;
    const plaqueTex = makeSignTexture(pod.name.toUpperCase(), pod.alias, hexCss, 384, 96);
    disposables.push(plaqueTex);
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 0.62),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaque.position.set(0, 5.15, 0.9);

    // Full 3D Superhero Rig standing ready to wear inside the glass pod!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.36, 0);
    const heroRig = createHeroCharacterRig(isSoftwareGl);
    heroRig.setHero(pod.heroId);
    turntable.add(heroRig.group);

    podGroup.add(alcoveBack, alcoveCap, pedestal, baseRing, topRing, glassArc, plaque, turntable);
    chamberGroup.add(podGroup);

    heroPodRigs.push({
      heroId: pod.heroId,
      rig: heroRig,
      ringMat,
      turntable,
    });

    interactables.push({
      id: `vault_hero_pod_${pod.heroId}`,
      kind: 'vault_hero_pod',
      label: `Wear ${pod.name} Costume`,
      sublabel: `Secret Underground Vault · ${pod.alias} · Ready to Wear`,
      x: pod.x,
      y: VAULT_FLOOR_Y,
      z: pod.z + 2.35,
      radius: 2.8,
      locationId: 'my_home',
      metaId: pod.heroId,
    });
  }

  // 3. Central Hero Suit Variations & Armory Console
  const consoleBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 1.15, 14), steelRibMat);
  consoleBase.position.set(VAULT_ARMORY_CONSOLE_POS.x, VAULT_FLOOR_Y + 0.58, VAULT_ARMORY_CONSOLE_POS.z);
  const consoleScreen = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.1), cyanStripMat);
  consoleScreen.position.set(VAULT_ARMORY_CONSOLE_POS.x, VAULT_FLOOR_Y + 1.55, VAULT_ARMORY_CONSOLE_POS.z);
  consoleScreen.rotation.x = -0.22;
  chamberGroup.add(consoleBase, consoleScreen);

  interactables.push({
    id: 'vault_armory_console',
    kind: 'home_hero_hall',
    label: 'Open All Hero Suits & Variations Console',
    sublabel: 'Secret Underground Vault · Switch Suit Skins or Return to Normal Clothes',
    x: VAULT_ARMORY_CONSOLE_POS.x,
    y: VAULT_FLOOR_Y,
    z: VAULT_ARMORY_CONSOLE_POS.z + 1.1,
    radius: 3.1,
    locationId: 'my_home',
  });

  // 4. PHYSICAL ILLUMINATED 28M HYDRAULIC ELEVATOR SHAFT + MOVING PLATFORM (NO TELEPORTING!)
  const elevPad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.45, 0.24, 20), steelRibMat);
  elevPad.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + 0.12, VAULT_ELEVATOR_POS.z);
  const elevRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.09, 8, 28), amberStripMat);
  elevRing.rotation.x = Math.PI / 2;
  elevRing.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + 0.26, VAULT_ELEVATOR_POS.z);
  // Full vertical glass + steel shaft rising 29m up to surface En Illam!
  const shaftTotalH = 29.0;
  const elevTube = new THREE.Mesh(
    new THREE.CylinderGeometry(2.28, 2.28, shaftTotalH, 20, 1, true, -Math.PI * 0.65, Math.PI * 1.3),
    podGlassMat
  );
  elevTube.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + shaftTotalH * 0.5, VAULT_ELEVATOR_POS.z);
  chamberGroup.add(elevPad, elevRing, elevTube);

  // Glowing depth-marker shaft rings every 4.5m so riding UP/DOWN feels deeply physical!
  for (let sy = VAULT_FLOOR_Y + 4.0; sy <= 0.5; sy += 4.5) {
    const shaftRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.34, 0.06, 8, 24),
      sy > -12 ? amberStripMat : cyanStripMat
    );
    shaftRing.rotation.x = Math.PI / 2;
    shaftRing.position.set(VAULT_ELEVATOR_POS.x, sy, VAULT_ELEVATOR_POS.z);
    chamberGroup.add(shaftRing);
  }

  // Animated Moving Hydraulic Elevator Platform Group!
  const movingElevatorPlatform = new THREE.Group();
  movingElevatorPlatform.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y, VAULT_ELEVATOR_POS.z);
  const platFloor = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.15, 0.24, 20), steelRibMat);
  platFloor.position.y = -0.12;
  const platGlow = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.075, 8, 24), cyanStripMat);
  platGlow.rotation.x = Math.PI / 2;
  platGlow.position.y = 0.04;
  for (let rp = 0; rp < 4; rp++) {
    const a = (rp / 4) * Math.PI * 2 + Math.PI * 0.25;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8), steelRibMat);
    post.position.set(Math.cos(a) * 1.88, 0.52, Math.sin(a) * 1.88);
    movingElevatorPlatform.add(post);
  }
  movingElevatorPlatform.add(platFloor, platGlow);
  chamberGroup.add(movingElevatorPlatform);

  const elevSignTex = makeSignTexture('HYDRAULIC ELEVATOR TO EN ILLAM', 'PRESS [E] TO RIDE ELEVATOR UP', '#f59e0b', 512, 112);
  disposables.push(elevSignTex);
  const elevSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 0.96),
    new THREE.MeshBasicMaterial({ map: elevSignTex })
  );
  elevSign.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + 4.4, VAULT_ELEVATOR_POS.z - 2.35);
  elevSign.rotation.y = Math.PI;
  chamberGroup.add(elevSign);

  interactables.push({
    id: 'vault_elevator_up',
    kind: 'home_vault_exit',
    label: 'Ride Secret Elevator Up to En Illam',
    sublabel: 'Physical 28m Hydraulic Lift to House Ground Floor',
    x: VAULT_ELEVATOR_POS.x,
    y: VAULT_FLOOR_Y,
    z: VAULT_ELEVATOR_POS.z - 0.8,
    radius: 3.4,
    locationId: 'my_home',
  });

  // 4b. LIVELY UNDERGROUND BASE ADDITIONS!
  // (A) Central Rotating Holographic Globe & Command Table at (-1.5, VAULT_FLOOR_Y, -3.5)
  const holoTableGroup = new THREE.Group();
  holoTableGroup.position.set(-1.5, VAULT_FLOOR_Y, -3.5);
  const tablePed = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.25, 1.05, 18), steelRibMat);
  tablePed.position.y = 0.52;
  const tableRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.08, 8, 28), cyanStripMat);
  tableRing.rotation.x = Math.PI / 2;
  tableRing.position.y = 1.08;
  const holoGlobeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.72,
  });
  disposables.push(holoGlobeMat);
  const holoGlobe = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), holoGlobeMat);
  holoGlobe.position.y = 2.65;
  const holoOrbitA = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.035, 8, 32), amberStripMat);
  holoOrbitA.position.y = 2.65;
  const holoOrbitB = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.03, 8, 32), cyanStripMat);
  holoOrbitB.position.y = 2.65;
  holoTableGroup.add(tablePed, tableRing, holoGlobe, holoOrbitA, holoOrbitB);
  chamberGroup.add(holoTableGroup);

  // (B) Overhead Moving Ceiling Gantry Crane gliding smoothly across the 22m ceiling!
  const gantryCrane = new THREE.Group();
  gantryCrane.position.set(0, VAULT_CEILING_Y - 1.85, 0);
  const craneBridge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, D - 3.0), amberStripMat);
  const craneTrolley = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 2.4), steelRibMat);
  craneTrolley.position.set(0, -0.65, -2.5);
  const craneCable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.2, 6), steelRibMat);
  craneCable.position.set(0, -3.2, -2.5);
  const craneHook = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 6, 14), amberStripMat);
  craneHook.position.set(0, -5.8, -2.5);
  gantryCrane.add(craneBridge, craneTrolley, craneCable, craneHook);
  chamberGroup.add(gantryCrane);

  // (C) Twin Animated Robotic Suit-Maintenance Arms flanking the Armory & Garage!
  const roboArms: Array<{ base: THREE.Group; upper: THREE.Group; offset: number }> = [];
  for (const [idx, [rx, rz]] of [
    [-21.5, -10.0] as const,
    [21.5, -10.0] as const,
    [-21.5, 11.5] as const,
  ].entries()) {
    const base = new THREE.Group();
    base.position.set(rx, VAULT_FLOOR_Y, rz);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.85, 12), steelRibMat);
    pedestal.position.y = 0.42;
    const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.3, 0.28), amberStripMat);
    lowerArm.position.y = 1.9;
    const upper = new THREE.Group();
    upper.position.set(0, 3.0, 0);
    const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.9, 0.22), steelRibMat);
    upperBeam.position.y = 0.85;
    const weldTip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), cyanStripMat);
    weldTip.position.y = 1.82;
    upper.add(upperBeam, weldTip);
    base.add(pedestal, lowerArm, upper);
    chamberGroup.add(base);
    roboArms.push({ base, upper, offset: idx * 2.1 });
  }

  // (D) Glowing Telemetry Wall Monitors along West Wall (x = -VAULT_HALF_X + 0.55)
  const monitorBars: THREE.Mesh[] = [];
  for (let mz = -12; mz <= 12; mz += 8) {
    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 5.2), steelRibMat);
    monFrame.position.set(-VAULT_HALF_X + 0.55, VAULT_FLOOR_Y + 4.4, mz);
    const monScreenTex = makeSignTexture(
      mz < 0 ? 'HERO SUIT TELEMETRY' : mz === 0 ? 'RAMP TUNNEL RADAR' : 'GARAGE TURBO DIAGNOSTICS',
      'SYSTEMS ONLINE · 100% POWER · LIVE FEED',
      mz === 0 ? '#34d399' : '#38bdf8',
      512,
      256
    );
    disposables.push(monScreenTex);
    const monScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 3.0),
      new THREE.MeshBasicMaterial({ map: monScreenTex })
    );
    monScreen.rotation.y = Math.PI / 2;
    monScreen.position.set(-VAULT_HALF_X + 0.7, VAULT_FLOOR_Y + 4.4, mz);
    const scanBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 4.6), cyanStripMat);
    scanBar.position.set(-VAULT_HALF_X + 0.74, VAULT_FLOOR_Y + 4.4, mz);
    chamberGroup.add(monFrame, monScreen, scanBar);
    monitorBars.push(scanBar);
  }

  // (E) Two Animated Base Lab Tech / Engineer NPCs patrolling & gesturing in the vault!
  const vaultEngineers: Array<{
    root: THREE.Group;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    baseX: number;
    baseZ: number;
    patrolRadius: number;
    phase: number;
  }> = [];
  const coatMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe5b893, roughness: 0.6 });
  disposables.push(coatMat, visorMat, skinMat);
  for (const cfg of [
    { x: -7.5, z: -2.0, r: 3.4, phase: 0 },
    { x: 10.5, z: -4.5, r: 3.8, phase: 2.3 },
  ]) {
    const npc = new THREE.Group();
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.85, 10), steelRibMat);
    legs.position.y = 0.42;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.28, 0.72, 10), coatMat);
    torso.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat);
    head.position.y = 1.66;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.14), visorMat);
    visor.position.set(0, 1.68, 0.12);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.56, 0.1), coatMat);
    leftArm.position.set(-0.3, 1.16, 0.06);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.56, 0.1), coatMat);
    rightArm.position.set(0.3, 1.16, 0.06);
    npc.add(legs, torso, head, visor, leftArm, rightArm);
    npc.position.set(cfg.x, VAULT_FLOOR_Y, cfg.z);
    chamberGroup.add(npc);
    vaultEngineers.push({
      root: npc,
      leftArm,
      rightArm,
      baseX: cfg.x,
      baseZ: cfg.z,
      patrolRadius: cfg.r,
      phase: cfg.phase,
    });
  }

  // (F) Floating Ambient Energy Motes bringing the 22m cathedral cavern to life!
  const energyMotes: Array<{ mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }> = [];
  const moteGeo = new THREE.SphereGeometry(0.11, 8, 6);
  disposables.push(moteGeo);
  for (let m = 0; m < 16; m++) {
    const mesh = new THREE.Mesh(moteGeo, m % 2 === 0 ? cyanStripMat : amberStripMat);
    const bx = ((m * 13.7) % 44) - 22;
    const by = VAULT_FLOOR_Y + 2.5 + ((m * 4.3) % 14);
    const bz = ((m * 17.1) % 36) - 18;
    mesh.position.set(bx, by, bz);
    chamberGroup.add(mesh);
    energyMotes.push({ mesh, baseX: bx, baseY: by, baseZ: bz, phase: m * 0.9 });
  }

  // 5. CONTINUOUS PHYSICAL INCLINED 94M EAST DRIVING RAMP (x = 28 -> 122, y = -28m -> surfaceY!)
  const passageW = VAULT_PASSAGE_HALF_Z * 2; // 10.8m wide two-lane subterranean roadway
  const passageH = VAULT_PASSAGE_HEIGHT; // 10.5m tall arched driving tunnel
  const RAMP_SEGMENTS = 12;
  const segSpanX = (VAULT_PASSAGE_END_X - VAULT_PASSAGE_START_X) / RAMP_SEGMENTS;

  for (let s = 0; s < RAMP_SEGMENTS; s++) {
    const x0 = VAULT_PASSAGE_START_X + s * segSpanX;
    const x1 = x0 + segSpanX;
    const y0 = vaultFloorYAt(x0, 0);
    const y1 = vaultFloorYAt(x1, 0);
    const xm = (x0 + x1) * 0.5;
    const ym = (y0 + y1) * 0.5;
    const slopeAngle = Math.atan2(y1 - y0, segSpanX);
    const segLen = Math.hypot(segSpanX, y1 - y0) + 0.5;

    const segGroup = new THREE.Group();
    segGroup.position.set(xm, ym, 0);
    segGroup.rotation.z = slopeAngle;

    const sFloor = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.55, passageW + 1.2), epoxyFloorMat);
    sFloor.position.y = -0.28;
    sFloor.receiveShadow = true;

    const sCeil = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.6, passageW + 1.6), concreteWallMat);
    sCeil.position.y = passageH + 0.3;

    const sWallN = new THREE.Mesh(new THREE.BoxGeometry(segLen, passageH + 0.5, 0.7), concreteWallMat);
    sWallN.position.set(0, passageH * 0.5, -VAULT_PASSAGE_HALF_Z - 0.35);

    const sWallS = new THREE.Mesh(new THREE.BoxGeometry(segLen, passageH + 0.5, 0.7), concreteWallMat);
    sWallS.position.set(0, passageH * 0.5, VAULT_PASSAGE_HALF_Z + 0.35);

    // Structural rib + glowing green lane chevron + overhead LED strip on every sloped segment!
    const ribTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, passageW), steelRibMat);
    ribTop.position.set(0, passageH - 0.32, 0);
    const roadDash = new THREE.Mesh(new THREE.BoxGeometry(segLen * 0.45, 0.05, 0.42), exitGreenMat);
    roadDash.position.set(0, 0.04, 0);
    const ledL = new THREE.Mesh(new THREE.BoxGeometry(segLen * 0.92, 0.14, 0.22), cyanStripMat);
    ledL.position.set(0, passageH - 0.26, -3.4);
    const ledR = new THREE.Mesh(new THREE.BoxGeometry(segLen * 0.92, 0.14, 0.22), cyanStripMat);
    ledR.position.set(0, passageH - 0.26, 3.4);

    segGroup.add(sFloor, sCeil, sWallN, sWallS, ribTop, roadDash, ledL, ledR);
    chamberGroup.add(segGroup);
  }

  // Entrance Sign over the East Driving Ramp Mouth (at x = 28)
  const tunnelSignTex = makeSignTexture(
    'INCLINED RAMP TUNNEL → LITERAL OUTSIDE EXIT',
    'CLIMB 94M RAMP STRAIGHT OUT INTO DAYLIGHT · NO TELEPORT!',
    '#34d399',
    640,
    120
  );
  disposables.push(tunnelSignTex);
  const tunnelSign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 1.6),
    new THREE.MeshBasicMaterial({ map: tunnelSignTex })
  );
  tunnelSign.rotation.y = -Math.PI / 2;
  tunnelSign.position.set(VAULT_HALF_X - 0.45, VAULT_FLOOR_Y + passageH + 1.4, VAULT_EXIT_TUNNEL_POS.z);
  chamberGroup.add(tunnelSign);

  // MASSIVE ANIMATED TWIN HYDRAULIC BLAST EXIT DOORS positioned right at ramp height vaultFloorYAt(114)
  const blastGateY = vaultFloorYAt(VAULT_EXIT_GATE_X, 0);
  const blastDoorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.34,
    metalness: 0.78,
  });
  const hazardStripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });
  disposables.push(blastDoorMat, hazardStripeMat);

  const blastDoorLeft = new THREE.Group();
  blastDoorLeft.position.set(VAULT_EXIT_GATE_X, blastGateY, -VAULT_PASSAGE_HALF_Z * 0.5);
  const doorPlateL = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, passageH - 0.2, VAULT_PASSAGE_HALF_Z),
    blastDoorMat
  );
  doorPlateL.position.y = (passageH - 0.2) * 0.5;
  const doorBandL = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.5, VAULT_PASSAGE_HALF_Z - 0.3),
    hazardStripeMat
  );
  doorBandL.position.y = 2.6;
  blastDoorLeft.add(doorPlateL, doorBandL);

  const blastDoorRight = new THREE.Group();
  blastDoorRight.position.set(VAULT_EXIT_GATE_X, blastGateY, VAULT_PASSAGE_HALF_Z * 0.5);
  const doorPlateR = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, passageH - 0.2, VAULT_PASSAGE_HALF_Z),
    blastDoorMat
  );
  doorPlateR.position.y = (passageH - 0.2) * 0.5;
  const doorBandR = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.5, VAULT_PASSAGE_HALF_Z - 0.3),
    hazardStripeMat
  );
  doorBandR.position.y = 2.6;
  blastDoorRight.add(doorPlateR, doorBandR);

  const daylightSignTex = makeSignTexture('OUTSIDE SURFACE PORTAL', 'DRIVE OR WALK STRAIGHT OUT!', '#38bdf8', 512, 112);
  disposables.push(daylightSignTex);
  const daylightSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.5),
    new THREE.MeshBasicMaterial({ map: daylightSignTex })
  );
  daylightSign.rotation.y = -Math.PI / 2;
  daylightSign.position.set(VAULT_EXIT_GATE_X - 0.6, blastGateY + passageH - 1.4, 0);

  chamberGroup.add(blastDoorLeft, blastDoorRight, daylightSign);

  // =========================================================================
  // 5B. SUPERHERO HOUSE SECRET TUNNEL VESTIBULE & 62.5m DESCENDING RAMP
  //     (x = -33.4, width 6.3m, z = -12.0..-82.0, y = 0.04m -> -28.0m)
  // =========================================================================
  const homeTunnelW = VAULT_HOME_TUNNEL_HALF_X * 2; // 6.3m
  const homeTunnelH = 4.9;
  const vestLen = VAULT_HOME_TUNNEL_MOUTH_Z - VAULT_HOME_TUNNEL_RAMP_TOP_Z; // 7.5m (-12.0 to -19.5)
  const vestCenterZ = (VAULT_HOME_TUNNEL_MOUTH_Z + VAULT_HOME_TUNNEL_RAMP_TOP_Z) * 0.5; // -15.75

  // Flat covered concrete vestibule directly beneath Pad B (flush at y = 0.04m)
  const vestFloor = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 0.6, 0.24, vestLen + 0.6), epoxyFloorMat);
  vestFloor.position.set(VAULT_HOME_TUNNEL_X, -0.08, vestCenterZ);
  vestFloor.receiveShadow = true;
  const vestCeil = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 1.0, 0.48, vestLen + 0.8), concreteWallMat);
  vestCeil.position.set(VAULT_HOME_TUNNEL_X, homeTunnelH + 0.24, vestCenterZ);
  const vestWallW = new THREE.Mesh(new THREE.BoxGeometry(0.55, homeTunnelH + 0.5, vestLen + 0.8), concreteWallMat);
  vestWallW.position.set(VAULT_HOME_TUNNEL_MIN_X - 0.28, homeTunnelH * 0.5, vestCenterZ);
  // East vestibule wall split cleanly around the Interior Secret Wall Door opening (z in [-19.3, -16.9])!
  const vestEastSouthLen = VAULT_HOME_TUNNEL_MOUTH_Z - VAULT_HOME_INTERIOR_DOOR_MAX_Z; // 4.9m
  const vestWallES = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, homeTunnelH + 0.5, vestEastSouthLen + 0.2),
    concreteWallMat
  );
  vestWallES.position.set(
    VAULT_HOME_TUNNEL_MAX_X + 0.28,
    homeTunnelH * 0.5,
    (VAULT_HOME_TUNNEL_MOUTH_Z + VAULT_HOME_INTERIOR_DOOR_MAX_Z) * 0.5
  );
  const vestWallETop = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, homeTunnelH - 2.6, VAULT_HOME_INTERIOR_DOOR_MAX_Z - VAULT_HOME_INTERIOR_DOOR_MIN_Z + 0.4),
    concreteWallMat
  );
  vestWallETop.position.set(
    VAULT_HOME_TUNNEL_MAX_X + 0.28,
    2.8 + (homeTunnelH - 2.6) * 0.5,
    (VAULT_HOME_INTERIOR_DOOR_MIN_Z + VAULT_HOME_INTERIOR_DOOR_MAX_Z) * 0.5
  );
  // Glowing vestibule runway stripes & ceiling LEDs so opening the doors from outside looks dramatic!
  const vestLedL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, vestLen - 0.6), cyanStripMat);
  vestLedL.position.set(VAULT_HOME_TUNNEL_X - 2.2, homeTunnelH - 0.18, vestCenterZ);
  const vestLedR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, vestLen - 0.6), cyanStripMat);
  vestLedR.position.set(VAULT_HOME_TUNNEL_X + 2.2, homeTunnelH - 0.18, vestCenterZ);
  const vestCenterLine = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, vestLen - 0.6), amberStripMat);
  vestCenterLine.position.set(VAULT_HOME_TUNNEL_X, 0.06, vestCenterZ);
  chamberGroup.add(vestFloor, vestCeil, vestWallW, vestWallES, vestWallETop, vestLedL, vestLedR, vestCenterLine);

  // 62.5m Descending Illuminated Concrete Ramp (z = -19.5 -> -82.0, y = 0.04m -> -28.0m)
  const HOME_RAMP_SEGMENTS = 12;
  const homeRampSpanZ = (VAULT_HOME_TUNNEL_RAMP_TOP_Z - VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z) / HOME_RAMP_SEGMENTS;
  for (let s = 0; s < HOME_RAMP_SEGMENTS; s++) {
    const z0 = VAULT_HOME_TUNNEL_RAMP_TOP_Z - s * homeRampSpanZ; // higher Z (closer to house)
    const z1 = z0 - homeRampSpanZ; // lower Z (deeper toward 1 KM chamber)
    const y0 = vaultFloorYAt(VAULT_HOME_TUNNEL_X, z0);
    const y1 = vaultFloorYAt(VAULT_HOME_TUNNEL_X, z1);
    const zm = (z0 + z1) * 0.5;
    const ym = (y0 + y1) * 0.5;
    // Right-hand rule around +X: negative angle tilts -Z DOWNWARD toward -Y!
    const pitchX = -Math.atan2(y0 - y1, homeRampSpanZ);
    const segLen = Math.hypot(homeRampSpanZ, y0 - y1) + 0.55;
    const segH = s >= HOME_RAMP_SEGMENTS - 2 ? 8.2 : s < 4 ? 6.4 : 6.0;

    const segGroup = new THREE.Group();
    segGroup.position.set(VAULT_HOME_TUNNEL_X, ym, zm);
    segGroup.rotation.x = pitchX;

    const rFloor = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 0.7, 0.5, segLen), epoxyFloorMat);
    rFloor.position.y = -0.25;
    rFloor.receiveShadow = true;
    const rCeil = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 1.1, 0.55, segLen), concreteWallMat);
    rCeil.position.y = segH + 0.25;
    const rWallW = new THREE.Mesh(new THREE.BoxGeometry(0.6, segH + 0.6, segLen), concreteWallMat);
    rWallW.position.set(-VAULT_HOME_TUNNEL_HALF_X - 0.3, segH * 0.5, 0);
    const rWallE = new THREE.Mesh(new THREE.BoxGeometry(0.6, segH + 0.6, segLen), concreteWallMat);
    rWallE.position.set(VAULT_HOME_TUNNEL_HALF_X + 0.3, segH * 0.5, 0);
    const rRib = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 0.2, 0.36, 0.44), steelRibMat);
    rRib.position.set(0, segH - 0.18, 0);
    const rDash = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, segLen * 0.42), s % 2 === 0 ? cyanStripMat : amberStripMat);
    rDash.position.set(0, 0.06, 0);
    const rLedL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, segLen * 0.92), cyanStripMat);
    rLedL.position.set(-2.35, segH - 0.24, 0);
    const rLedR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, segLen * 0.92), cyanStripMat);
    rLedR.position.set(2.35, segH - 0.24, 0);
    // Glowing curb rails along both sides of the descending ramp so depth reads crystal-clear from outside!
    const rCurbL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, segLen * 0.94), exitGreenMat);
    rCurbL.position.set(-VAULT_HOME_TUNNEL_HALF_X + 0.22, 0.16, 0);
    const rCurbR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, segLen * 0.94), exitGreenMat);
    rCurbR.position.set(VAULT_HOME_TUNNEL_HALF_X - 0.22, 0.16, 0);

    segGroup.add(rFloor, rCeil, rWallW, rWallE, rRib, rDash, rLedL, rLedR, rCurbL, rCurbR);
    chamberGroup.add(segGroup);
  }

  // Directional overhead sign at the bottom of the House Secret Tunnel Ramp facing into the 1 KM Mega-Chamber!
  const houseExitSignTex = makeSignTexture(
    '↑ EN ILLAM SUPERHERO HOUSE EXIT',
    'WALK OR DRIVE UP 62.5M RAMP STRAIGHT OUTSIDE (NO TELEPORT!)',
    '#34d399',
    640,
    120
  );
  disposables.push(houseExitSignTex);
  const houseExitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.35),
    new THREE.MeshBasicMaterial({ map: houseExitSignTex })
  );
  houseExitSign.rotation.y = Math.PI;
  houseExitSign.position.set(VAULT_HOME_TUNNEL_X, VAULT_FLOOR_Y + 9.4, VAULT_MEGA_START_Z - 0.6);
  chamberGroup.add(houseExitSign);

  // =========================================================================
  // 5C. MAIN VAULT <-> 1 KM MEGA-CHAMBER CONNECTOR AVENUE
  //     (x in [-27.8, -20.2], z in [-82.0, -24.0], flat y = -28.0m)
  // =========================================================================
  const connLen = VAULT_CONNECTOR_START_Z - VAULT_CONNECTOR_END_Z; // 58.0m
  const connMidZ = (VAULT_CONNECTOR_START_Z + VAULT_CONNECTOR_END_Z) * 0.5; // -53.0
  const connFloor = new THREE.Mesh(new THREE.BoxGeometry(connW + 0.8, 0.5, connLen + 1.0), epoxyFloorMat);
  connFloor.position.set(connCenterX, VAULT_FLOOR_Y - 0.25, connMidZ);
  connFloor.receiveShadow = true;
  const connCeil = new THREE.Mesh(new THREE.BoxGeometry(connW + 1.2, 0.55, connLen + 1.0), concreteWallMat);
  connCeil.position.set(connCenterX, VAULT_FLOOR_Y + connH + 0.28, connMidZ);
  const connWallW = new THREE.Mesh(new THREE.BoxGeometry(0.65, connH + 0.5, connLen + 0.8), concreteWallMat);
  connWallW.position.set(VAULT_CONNECTOR_MIN_X - 0.32, VAULT_FLOOR_Y + connH * 0.5, connMidZ);
  const connWallE = new THREE.Mesh(new THREE.BoxGeometry(0.65, connH + 0.5, connLen + 0.8), concreteWallMat);
  connWallE.position.set(VAULT_CONNECTOR_MAX_X + 0.32, VAULT_FLOOR_Y + connH * 0.5, connMidZ);
  const connLane = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, connLen - 2.0), cyanStripMat);
  connLane.position.set(connCenterX, VAULT_FLOOR_Y + 0.03, connMidZ);
  chamberGroup.add(connFloor, connCeil, connWallW, connWallE, connLane);

  const connMarqueeTex = makeSignTexture(
    '→ 1 KM SUPERHERO MEGA-CHAMBER (1,000 M)',
    'HIGH-SPEED DRIVE · FLIGHT · WEB-SWING · HOUSE EXIT RAMP',
    '#38bdf8',
    640,
    120
  );
  disposables.push(connMarqueeTex);
  const connMarquee = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 1.38),
    new THREE.MeshBasicMaterial({ map: connMarqueeTex })
  );
  connMarquee.position.set(connCenterX, VAULT_FLOOR_Y + connH + 1.25, -VAULT_HALF_Z + 0.45);
  chamberGroup.add(connMarquee);

  // =========================================================================
  // 5D. LITERAL 1 KM (1,000.0 M) UNDERGROUND SUPERHERO MEGA-CHAMBER & PROVING ARENA!
  //     x in [-46.0, +6.0] (52m wide), z in [-1082.0, -82.0] (1,000m long!), y in [-28.0, -6.0] (22m tall!)
  //     Built with high-performance InstancedMesh so 1 full kilometer renders at crisp 60fps!
  // =========================================================================
  const megaMidZ = (VAULT_MEGA_START_Z + VAULT_MEGA_END_Z) * 0.5; // -582.0
  const megaFloor = new THREE.Mesh(
    new THREE.BoxGeometry(VAULT_MEGA_WIDTH + 2.0, 0.6, VAULT_MEGA_CHAMBER_LENGTH + 2.0),
    epoxyFloorMat
  );
  megaFloor.position.set(VAULT_MEGA_CENTER_X, VAULT_FLOOR_Y - 0.3, megaMidZ);
  megaFloor.receiveShadow = true;

  const megaCeil = new THREE.Mesh(
    new THREE.BoxGeometry(VAULT_MEGA_WIDTH + 2.0, 0.8, VAULT_MEGA_CHAMBER_LENGTH + 2.0),
    concreteWallMat
  );
  megaCeil.position.set(VAULT_MEGA_CENTER_X, VAULT_CEILING_Y + 0.4, megaMidZ);

  const megaWallW = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, H + 0.8, VAULT_MEGA_CHAMBER_LENGTH + 2.0),
    concreteWallMat
  );
  megaWallW.position.set(VAULT_MEGA_MIN_X - 0.5, midY, megaMidZ);

  const megaWallE = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, H + 0.8, VAULT_MEGA_CHAMBER_LENGTH + 2.0),
    concreteWallMat
  );
  megaWallE.position.set(VAULT_MEGA_MAX_X + 0.5, midY, megaMidZ);

  // Far 1.00 KM End Wall at z = -1082.0
  const megaFarWall = new THREE.Mesh(
    new THREE.BoxGeometry(VAULT_MEGA_WIDTH + 2.0, H + 0.8, 1.2),
    concreteWallMat
  );
  megaFarWall.position.set(VAULT_MEGA_CENTER_X, midY, VAULT_MEGA_END_Z - 0.6);

  // South Wall of Mega-Chamber (z = -82.0) split around House Secret Tunnel (-36.55..-30.25) AND Connector (-27.8..-20.2)!
  const megaSouthSeg1W = VAULT_HOME_TUNNEL_MIN_X - VAULT_MEGA_MIN_X; // 9.45m (-46..-36.55)
  const megaSouthSeg1 = new THREE.Mesh(new THREE.BoxGeometry(megaSouthSeg1W, H, 0.9), concreteWallMat);
  megaSouthSeg1.position.set(VAULT_MEGA_MIN_X + megaSouthSeg1W * 0.5, midY, VAULT_MEGA_START_Z + 0.45);
  const megaSouthPillar = new THREE.Mesh(
    new THREE.BoxGeometry(VAULT_CONNECTOR_MIN_X - VAULT_HOME_TUNNEL_MAX_X, H, 0.9),
    concreteWallMat
  );
  megaSouthPillar.position.set(
    (VAULT_HOME_TUNNEL_MAX_X + VAULT_CONNECTOR_MIN_X) * 0.5,
    midY,
    VAULT_MEGA_START_Z + 0.45
  );
  const megaSouthSeg3W = VAULT_MEGA_MAX_X - VAULT_CONNECTOR_MAX_X; // 26.2m (-20.2..+6.0)
  const megaSouthSeg3 = new THREE.Mesh(new THREE.BoxGeometry(megaSouthSeg3W, H, 0.9), concreteWallMat);
  megaSouthSeg3.position.set(VAULT_CONNECTOR_MAX_X + megaSouthSeg3W * 0.5, midY, VAULT_MEGA_START_Z + 0.45);
  const megaSouthTop = new THREE.Mesh(
    new THREE.BoxGeometry(VAULT_CONNECTOR_MAX_X - VAULT_HOME_TUNNEL_MIN_X + 1.0, H - 11.0, 0.9),
    concreteWallMat
  );
  megaSouthTop.position.set(
    (VAULT_HOME_TUNNEL_MIN_X + VAULT_CONNECTOR_MAX_X) * 0.5,
    VAULT_CEILING_Y - (H - 11.0) * 0.5,
    VAULT_MEGA_START_Z + 0.45
  );
  chamberGroup.add(
    megaFloor,
    megaCeil,
    megaWallW,
    megaWallE,
    megaFarWall,
    megaSouthSeg1,
    megaSouthPillar,
    megaSouthSeg3,
    megaSouthTop
  );

  // Instanced Cathedral Steel Ribs (40 arches spaced every 25m across 1,000m!)
  const RIB_COUNT = 40;
  const dummy = new THREE.Object3D();
  const ribColGeo = new THREE.BoxGeometry(0.95, H, 1.1);
  const ribBeamGeo = new THREE.BoxGeometry(VAULT_MEGA_WIDTH - 0.6, 0.9, 1.05);
  const ledStripGeo = new THREE.BoxGeometry(0.45, 0.16, 16.0);
  const chevronGeo = new THREE.BoxGeometry(1.1, 0.05, 2.4);
  const pylonGeo = new THREE.CylinderGeometry(0.32, 0.46, 2.8, 8);
  disposables.push(ribColGeo, ribBeamGeo, ledStripGeo, chevronGeo, pylonGeo);

  const megaRibCols = new THREE.InstancedMesh(ribColGeo, steelRibMat, RIB_COUNT * 2);
  const megaRibBeams = new THREE.InstancedMesh(ribBeamGeo, steelRibMat, RIB_COUNT);
  const megaLedStrips = new THREE.InstancedMesh(ledStripGeo, cyanStripMat, RIB_COUNT * 2);
  const megaChevrons = new THREE.InstancedMesh(chevronGeo, amberStripMat, 200);
  const megaPylons = new THREE.InstancedMesh(pylonGeo, exitGreenMat, 40);

  for (let i = 0; i < RIB_COUNT; i++) {
    const rz = VAULT_MEGA_START_Z - 12.5 - i * 25.0;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);

    dummy.position.set(VAULT_MEGA_MIN_X + 0.55, midY, rz);
    dummy.updateMatrix();
    megaRibCols.setMatrixAt(i * 2, dummy.matrix);

    dummy.position.set(VAULT_MEGA_MAX_X - 0.55, midY, rz);
    dummy.updateMatrix();
    megaRibCols.setMatrixAt(i * 2 + 1, dummy.matrix);

    dummy.position.set(VAULT_MEGA_CENTER_X, VAULT_CEILING_Y - 0.5, rz);
    dummy.updateMatrix();
    megaRibBeams.setMatrixAt(i, dummy.matrix);

    dummy.position.set(VAULT_MEGA_CENTER_X - 13.5, VAULT_CEILING_Y - 1.05, rz);
    dummy.updateMatrix();
    megaLedStrips.setMatrixAt(i * 2, dummy.matrix);

    dummy.position.set(VAULT_MEGA_CENTER_X + 13.5, VAULT_CEILING_Y - 1.05, rz);
    dummy.updateMatrix();
    megaLedStrips.setMatrixAt(i * 2 + 1, dummy.matrix);

    // Alternating slalom speed pylons along the outer proving lane (x = -4.5 / +0.5)
    dummy.position.set(i % 2 === 0 ? -4.5 : 0.8, VAULT_FLOOR_Y + 1.4, rz);
    dummy.updateMatrix();
    megaPylons.setMatrixAt(i, dummy.matrix);
  }
  for (let c = 0; c < 200; c++) {
    const cz = VAULT_MEGA_START_Z - 2.5 - c * 5.0;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(VAULT_MEGA_CENTER_X, VAULT_FLOOR_Y + 0.04, cz);
    dummy.updateMatrix();
    megaChevrons.setMatrixAt(c, dummy.matrix);
  }
  for (const inst of [megaRibCols, megaRibBeams, megaLedStrips, megaChevrons, megaPylons]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;
    chamberGroup.add(inst);
  }

  // 11 Illuminated Distance Milestone Arches (0m START, 100m, 200m, ... 500m HALFWAY, ... 1000m / 1.00 KM FINISH!)
  for (let distM = 0; distM <= 1000; distM += 100) {
    const mz = VAULT_MEGA_START_Z - distM + (distM === 0 ? -3.0 : distM === 1000 ? 6.0 : 0);
    const title =
      distM === 0
        ? '0 M · 1 KM SUPERHERO MEGA-CHAMBER START'
        : distM === 500
          ? '500 M · HALFWAY MARK (0.50 KM)'
          : distM === 1000
            ? '1,000 M · 1.00 KM FINISH DOME!'
            : `${distM} M · 1 KM PROVING RUNWAY`;
    const sub =
      distM === 1000
        ? 'LITERAL 1 KILOMETER COMPLETE · TURN AROUND & BLAST BACK TO HOUSE!'
        : `${1000 - distM} M TO 1.00 KM FINISH · FULL SPEED DRIVE & FLIGHT ENABLED`;
    const colorHex = distM === 1000 ? '#facc15' : distM === 500 ? '#34d399' : '#38bdf8';
    const mTex = makeSignTexture(title, sub, colorHex, 640, 128);
    disposables.push(mTex);
    const mSign = new THREE.Mesh(
      new THREE.PlaneGeometry(16.0, 3.2),
      new THREE.MeshBasicMaterial({ map: mTex, side: THREE.DoubleSide })
    );
    mSign.position.set(VAULT_MEGA_CENTER_X, VAULT_CEILING_Y - 3.2, mz);
    const mLine = new THREE.Mesh(
      new THREE.BoxGeometry(VAULT_MEGA_WIDTH - 2.0, 0.05, 0.55),
      distM === 1000 ? amberStripMat : distM === 500 ? exitGreenMat : cyanStripMat
    );
    mLine.position.set(VAULT_MEGA_CENTER_X, VAULT_FLOOR_Y + 0.04, mz);
    chamberGroup.add(mSign, mLine);
  }

  // 10 Suspended Aerial Flight & Web-Swinging Neon Rings spanning the 1 KM Mega-Chamber!
  const megaFlightRings: THREE.Mesh[] = [];
  const flightRingGeo = new THREE.TorusGeometry(4.6, 0.24, 10, 28);
  disposables.push(flightRingGeo);
  for (let r = 0; r < 10; r++) {
    const rz = VAULT_MEGA_START_Z - 60 - r * 95;
    const rx = VAULT_MEGA_CENTER_X + Math.sin(r * 1.15) * 9.5;
    const ring = new THREE.Mesh(flightRingGeo, r % 2 === 0 ? cyanStripMat : amberStripMat);
    ring.position.set(rx, VAULT_FLOOR_Y + 11.8, rz);
    chamberGroup.add(ring);
    megaFlightRings.push(ring);
  }

  // 1.00 KM Finish Turnaround Monument Hologram at z = -1070
  const finishDomeGroup = new THREE.Group();
  finishDomeGroup.position.set(VAULT_MEGA_CENTER_X, VAULT_FLOOR_Y, VAULT_MEGA_END_Z + 14.0);
  const finishPad = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.8, 0.25, 28), steelRibMat);
  finishPad.position.y = 0.12;
  const finishRingOuter = new THREE.Mesh(new THREE.TorusGeometry(8.4, 0.18, 10, 36), amberStripMat);
  finishRingOuter.rotation.x = Math.PI / 2;
  finishRingOuter.position.y = 0.3;
  const finishBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 1), holoGlobeMat);
  finishBeacon.position.y = 6.5;
  finishDomeGroup.add(finishPad, finishRingOuter, finishBeacon);
  chamberGroup.add(finishDomeGroup);

  // =========================================================================
  // 5E. DUAL PERMANENT SURFACE PORTALS (in world coordinates inside surfacePortalGroup!)
  //     1. Superhero House Secret Tunnel Portal directly under Pad B (-33.4, 0, -12.0)
  //        with REAL Animated Twin Sliding Armored Blast Doors opened from Mobile!
  //     2. East Driving Ramp Hillside Tunnel Portal at (122, surfaceY, 0)
  // =========================================================================
  surfacePortalGroup.position.set(0, 0, 0);

  // --- (1) SUPERHERO HOUSE SECRET TUNNEL PORTAL under Twin Helipad Pad B ---
  const houseSurfacePortal = new THREE.Group();
  houseSurfacePortal.position.set(VAULT_HOME_TUNNEL_X, 0, VAULT_HOME_TUNNEL_MOUTH_Z);

  const bunkerShellMat = new THREE.MeshStandardMaterial({
    color: 0x263244,
    roughness: 0.72,
    metalness: 0.35,
  });
  const homeBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  disposables.push(bunkerShellMat, homeBeaconMat);

  // Portal Pillars & Reinforced Header Frame (fitting cleanly inside Pad B columns!)
  const hColW = new THREE.Mesh(new THREE.BoxGeometry(0.95, homeTunnelH + 1.1, 2.2), bunkerShellMat);
  hColW.position.set(-VAULT_HOME_TUNNEL_HALF_X - 0.35, (homeTunnelH + 1.1) * 0.5, 0);
  const hColE = new THREE.Mesh(new THREE.BoxGeometry(0.95, homeTunnelH + 1.1, 2.2), bunkerShellMat);
  hColE.position.set(VAULT_HOME_TUNNEL_HALF_X + 0.35, (homeTunnelH + 1.1) * 0.5, 0);
  const hHeader = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 1.7, 1.35, 2.4), bunkerShellMat);
  hHeader.position.set(0, homeTunnelH + 0.65, 0);
  const hGlowTrim = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 0.8, 0.22, 2.48), cyanStripMat);
  hGlowTrim.position.set(0, homeTunnelH + 0.04, 0);

  // Sloped Concrete Bunker Roof Cap extending back from z=0 to z=-20.5 (world z=-12..-32.5)
  // Completely covers the terrain cutout from outside/above while sloping CLEANLY DOWN into the north lawn!
  const hRoofFlat = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 1.7, 0.65, 8.2), bunkerShellMat);
  hRoofFlat.position.set(0, homeTunnelH + 0.48, -4.1);
  const hRoofSlope = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 1.7, 0.65, 13.8), bunkerShellMat);
  hRoofSlope.position.set(0, homeTunnelH * 0.72, -14.2);
  hRoofSlope.rotation.x = -0.39;
  // Side bunker retaining walls hiding the ramp cut cleanly from the yard
  const hRetainW = new THREE.Mesh(new THREE.BoxGeometry(0.6, homeTunnelH + 0.5, 19.5), bunkerShellMat);
  hRetainW.position.set(-VAULT_HOME_TUNNEL_HALF_X - 0.42, (homeTunnelH + 0.5) * 0.5 - 0.2, -9.75);
  const hRetainE = new THREE.Mesh(new THREE.BoxGeometry(0.6, homeTunnelH + 0.5, 11.5), bunkerShellMat);
  hRetainE.position.set(VAULT_HOME_TUNNEL_HALF_X + 0.42, (homeTunnelH + 0.5) * 0.5 - 0.2, -13.6);

  // Illuminated Exterior Driveway Apron leading from front yard straight to the blast doors!
  const hApron = new THREE.Mesh(new THREE.BoxGeometry(homeTunnelW + 1.0, 0.14, 11.5), epoxyFloorMat);
  hApron.position.set(0, 0.05, 5.75);
  hApron.receiveShadow = true;
  for (let a = 0; a < 3; a++) {
    const arrowBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.32), cyanStripMat);
    arrowBar.position.set(0, 0.14, 2.2 + a * 2.8);
    houseSurfacePortal.add(arrowBar);
  }

  // Pulsing Status Beacons flanking the Secret Tunnel Portal!
  const hBeaconL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.42, 10), homeBeaconMat);
  hBeaconL.position.set(-VAULT_HOME_TUNNEL_HALF_X - 0.35, homeTunnelH + 1.5, 0.65);
  const hBeaconR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.42, 10), homeBeaconMat);
  hBeaconR.position.set(VAULT_HOME_TUNNEL_HALF_X + 0.35, homeTunnelH + 1.5, 0.65);

  // REAL ANIMATED TWIN SLIDING ARMORED BLAST DOORS (openable from OUTSIDE via Mobile Phone!)
  const homeDoorW = VAULT_HOME_TUNNEL_HALF_X; // 3.15m each leaf
  const homeDoorL = new THREE.Group();
  homeDoorL.position.set(-homeDoorW * 0.5, 0, 0.25);
  const hLeafL = new THREE.Mesh(new THREE.BoxGeometry(homeDoorW, homeTunnelH - 0.05, 0.48), blastDoorMat);
  hLeafL.position.y = homeTunnelH * 0.5;
  const hStripeL = new THREE.Mesh(new THREE.BoxGeometry(homeDoorW - 0.18, 0.36, 0.54), hazardStripeMat);
  hStripeL.position.y = 1.65;
  const hEmblemL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.4, 0.56), cyanStripMat);
  hEmblemL.position.set(homeDoorW * 0.5 - 0.2, 2.5, 0);
  homeDoorL.add(hLeafL, hStripeL, hEmblemL);

  const homeDoorR = new THREE.Group();
  homeDoorR.position.set(homeDoorW * 0.5, 0, 0.25);
  const hLeafR = new THREE.Mesh(new THREE.BoxGeometry(homeDoorW, homeTunnelH - 0.05, 0.48), blastDoorMat);
  hLeafR.position.y = homeTunnelH * 0.5;
  const hStripeR = new THREE.Mesh(new THREE.BoxGeometry(homeDoorW - 0.18, 0.36, 0.54), hazardStripeMat);
  hStripeR.position.y = 1.65;
  const hEmblemR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.4, 0.56), cyanStripMat);
  hEmblemR.position.set(-homeDoorW * 0.5 + 0.2, 2.5, 0);
  homeDoorR.add(hLeafR, hStripeR, hEmblemR);

  const hSignTex = makeSignTexture(
    'SUPERHERO HOUSE SECRET TUNNEL',
    'OPEN WITH MOBILE [P] · REAL WALK / DRIVE ENTRY → 1 KM CHAMBER',
    '#38bdf8',
    640,
    120
  );
  disposables.push(hSignTex);
  const hSign = new THREE.Mesh(
    new THREE.PlaneGeometry(homeTunnelW + 1.2, 1.25),
    new THREE.MeshBasicMaterial({ map: hSignTex })
  );
  hSign.position.set(0, homeTunnelH + 0.68, 1.24);

  houseSurfacePortal.add(
    hColW,
    hColE,
    hHeader,
    hGlowTrim,
    hRoofFlat,
    hRoofSlope,
    hRetainW,
    hRetainE,
    hApron,
    hBeaconL,
    hBeaconR,
    homeDoorL,
    homeDoorR,
    hSign
  );
  surfacePortalGroup.add(houseSurfacePortal);

  // --- (2) PERMANENT SURFACE-SIDE REINFORCED CONCRETE EAST TUNNEL PORTAL ARCH at (122, surfaceY, 0) ---
  const portalY = VAULT_SURFACE_PORTAL_Y;
  const eastSurfacePortal = new THREE.Group();
  eastSurfacePortal.position.set(VAULT_SURFACE_PORTAL_X, portalY, 0);
  const pColL = new THREE.Mesh(new THREE.BoxGeometry(3.8, 7.6, 1.8), concreteWallMat);
  pColL.position.set(0, 3.6, -VAULT_PASSAGE_HALF_Z - 0.6);
  const pColR = new THREE.Mesh(new THREE.BoxGeometry(3.8, 7.6, 1.8), concreteWallMat);
  pColR.position.set(0, 3.6, VAULT_PASSAGE_HALF_Z + 0.6);
  const pBeam = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, passageW + 3.2), concreteWallMat);
  pBeam.position.set(0, 8.2, 0);
  const pRoofCap = new THREE.Mesh(new THREE.BoxGeometry(15.5, 1.4, passageW + 3.0), bunkerShellMat);
  pRoofCap.position.set(-7.5, 5.2, 0);
  pRoofCap.rotation.z = 0.28;
  const pTrim = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.28, passageW + 2.6), exitGreenMat);
  pTrim.position.set(0.1, 7.1, 0);
  const pApron = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.22, passageW + 1.0), epoxyFloorMat);
  pApron.position.set(4.5, 0.08, 0);
  const pSignTex = makeSignTexture('SECRET BASE TUNNEL PORTAL', 'DRIVE OR WALK IN TO DESCEND RAMP', '#34d399', 512, 112);
  disposables.push(pSignTex);
  const pSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 1.5),
    new THREE.MeshBasicMaterial({ map: pSignTex })
  );
  pSign.rotation.y = Math.PI / 2;
  pSign.position.set(2.16, 8.2, 0);
  eastSurfacePortal.add(pColL, pColR, pBeam, pRoofCap, pTrim, pApron, pSign);
  surfacePortalGroup.add(eastSurfacePortal);

  // Two Illuminated Gate Control Consoles (one at main hall entrance, one at far ramp near blast gate!)
  for (const [idx, gpos] of [VAULT_GATE_CONTROL_POS, VAULT_FAR_GATE_CONTROL_POS].entries()) {
    const gy = vaultFloorYAt(gpos.x, gpos.z);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.35, 0.75), steelRibMat);
    post.position.set(gpos.x, gy + 0.68, gpos.z);
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.45), exitGreenMat);
    btn.position.set(gpos.x, gy + 1.45, gpos.z);
    chamberGroup.add(post, btn);

    interactables.push({
      id: `vault_exit_gate_control_${idx}`,
      kind: 'vault_exit_gate',
      label: 'Open / Close Outside Exit Passage Gate',
      sublabel: '94m Inclined Ramp Tunnel · Slide Blast Doors Open to Drive Outside',
      x: gpos.x,
      y: gy,
      z: gpos.z,
      radius: 4.5,
      locationId: 'my_home',
    });
  }

  // 6. Clean Underground Architectural Lighting (Main Vault + House Ramp + Traveling 1 KM Mega-Chamber Light!)
  const vaultAmbientLight = new THREE.PointLight(0xdbeafe, 4.4, 78, 1.05);
  vaultAmbientLight.position.set(0, VAULT_CEILING_Y - 2.2, 0);
  const heroWingLight = new THREE.PointLight(0x93c5fd, 3.4, 54, 1.1);
  heroWingLight.position.set(0, VAULT_FLOOR_Y + 11.5, -14.5);
  const passageLight = new THREE.PointLight(0x6ee7b7, 3.6, 110, 1.05);
  passageLight.position.set(74, vaultFloorYAt(74, 0) + 7.5, 0);
  const houseVestLight = new THREE.PointLight(0xe0f2fe, 5.2, 38, 0.95);
  houseVestLight.position.set(VAULT_HOME_TUNNEL_X, 3.8, -16.8);
  const houseUpperRampLight = new THREE.PointLight(0xbae6fd, 5.4, 54, 0.95);
  houseUpperRampLight.position.set(VAULT_HOME_TUNNEL_X, -1.6, -27.5);
  const houseRampLight = new THREE.PointLight(0xbae6fd, 4.8, 76, 0.95);
  houseRampLight.position.set(VAULT_HOME_TUNNEL_X, -11.5, -48.0);
  const houseLowerRampLight = new THREE.PointLight(0x93c5fd, 5.0, 64, 0.95);
  houseLowerRampLight.position.set(VAULT_HOME_TUNNEL_X, -21.5, -69.0);
  const megaStartLight = new THREE.PointLight(0x93c5fd, 4.8, 145, 0.9);
  megaStartLight.position.set(VAULT_MEGA_CENTER_X, VAULT_CEILING_Y - 2.5, VAULT_MEGA_START_Z - 45);
  const megaTravelLight = new THREE.PointLight(0xdbeafe, 5.4, 165, 0.85);
  megaTravelLight.position.set(VAULT_MEGA_CENTER_X, VAULT_CEILING_Y - 2.5, VAULT_MEGA_START_Z - 140);
  chamberGroup.add(
    vaultAmbientLight,
    heroWingLight,
    passageLight,
    houseVestLight,
    houseUpperRampLight,
    houseRampLight,
    houseLowerRampLight,
    megaStartLight,
    megaTravelLight
  );

  // 7. Build the 3 Composite Drivable Underground Vault Cars!
  const carRigs: CarMeshRig[] = VAULT_CAR_SPECS.map((spec) => {
    const rig = buildCompositeVaultCar(spec, isSoftwareGl);
    carsGroup.add(rig.root);
    return rig;
  });

  const update: HomeUndergroundVault3D['update'] = ({
    inVault,
    elevatorPhase = 'idle',
    elevatorY = VAULT_FLOOR_Y,
    activeHeroId,
    cars,
    exitGateProgress,
    hatchOpenProgress = 0,
    playerZ = 0,
    elapsed,
    dt,
  }) => {
    // Animate Superhero House Secret Tunnel Exterior Blast Doors ALWAYS (visible from outside yard!)
    const openHome = Math.max(0, Math.min(1, hatchOpenProgress));
    const homeSlide = openHome * (homeDoorW * 0.98);
    homeDoorL.position.x = -homeDoorW * 0.5 - homeSlide;
    homeDoorR.position.x = homeDoorW * 0.5 + homeSlide;
    homeBeaconMat.color.setHex(openHome > 0.25 ? 0x10b981 : 0xf59e0b);
    homeBeaconMat.emissive.setHex(openHome > 0.25 ? 0x059669 : 0xd97706);
    homeBeaconMat.emissiveIntensity = 1.15 + Math.sin(elapsed * (openHome > 0.25 ? 6.5 : 2.2)) * 0.65;

    // Keep chamberGroup visible whenever inside OR riding elevator OR while House Tunnel Doors are open from outside!
    const showChamber = inVault || elevatorPhase !== 'idle' || openHome > 0.04 || exitGateProgress > 0.04;
    chamberGroup.visible = showChamber;
    movingElevatorPlatform.position.y = elevatorPhase !== 'idle' ? elevatorY : VAULT_FLOOR_Y;

    if (showChamber) {
      const pulse = 0.85 + Math.sin(elapsed * 2.6) * 0.2;
      for (let i = 0; i < heroPodRigs.length; i++) {
        const entry = heroPodRigs[i];
        const isEquipped = activeHeroId === entry.heroId;
        entry.turntable.rotation.y = Math.sin(elapsed * 0.55 + i * 0.9) * 0.35;
        entry.ringMat.emissiveIntensity = isEquipped ? 2.6 * pulse : 1.15;
        entry.rig.updatePose({
          elapsed: elapsed + i * 0.7,
          speed: 0,
          dt,
          helmetOpen: entry.heroId === 'iron_man_classic' && Math.sin(elapsed * 0.5) > 0.55,
        });
      }
      elevRing.rotation.z = elapsed * 0.45;
      platGlow.rotation.z = -elapsed * 1.1;

      // Animate lively base props & 1 KM Mega-Chamber aerial rings & finish beacon!
      holoGlobe.rotation.y = elapsed * 0.55;
      holoOrbitA.rotation.set(elapsed * 0.7, elapsed * 0.4, 0.4);
      holoOrbitB.rotation.set(-elapsed * 0.5, elapsed * 0.65, -0.5);
      finishBeacon.rotation.y = elapsed * 0.8;
      finishBeacon.position.y = 6.5 + Math.sin(elapsed * 1.8) * 0.6;
      for (let r = 0; r < megaFlightRings.length; r++) {
        megaFlightRings[r].rotation.z = elapsed * (r % 2 === 0 ? 0.45 : -0.45);
      }
      // Track dynamic lighting smoothly along the full 1 KM Mega-Chamber!
      const clampedLightZ = Math.max(
        VAULT_MEGA_END_Z + 35,
        Math.min(VAULT_MEGA_START_Z - 30, playerZ - 26)
      );
      megaTravelLight.position.z = clampedLightZ;

      gantryCrane.position.x = Math.sin(elapsed * 0.22) * 16.5;
      craneTrolley.position.z = Math.cos(elapsed * 0.35) * 10.0;
      craneCable.position.z = craneTrolley.position.z;
      craneHook.position.z = craneTrolley.position.z;

      for (const arm of roboArms) {
        arm.base.rotation.y = Math.sin(elapsed * 0.65 + arm.offset) * 0.6;
        arm.upper.rotation.z = Math.sin(elapsed * 1.4 + arm.offset) * 0.35;
      }
      for (let i = 0; i < monitorBars.length; i++) {
        monitorBars[i].position.y = VAULT_FLOOR_Y + 4.4 + Math.sin(elapsed * 2.1 + i * 1.2) * 1.2;
      }
      for (const eng of vaultEngineers) {
        const a = elapsed * 0.45 + eng.phase;
        eng.root.position.x = eng.baseX + Math.cos(a) * eng.patrolRadius;
        eng.root.position.z = eng.baseZ + Math.sin(a) * (eng.patrolRadius * 0.65);
        eng.root.rotation.y = Math.atan2(-Math.sin(a) * eng.patrolRadius, Math.cos(a) * eng.patrolRadius * 0.65);
        eng.leftArm.rotation.x = Math.sin(elapsed * 4.5 + eng.phase) * 0.35;
        eng.rightArm.rotation.x = -Math.sin(elapsed * 4.5 + eng.phase) * 0.35;
      }
      for (const mote of energyMotes) {
        mote.mesh.position.y = mote.baseY + Math.sin(elapsed * 1.4 + mote.phase) * 0.85;
      }

      // Slide the twin armored East blast doors wide apart to reveal outside daylight!
      const slideDist = exitGateProgress * (VAULT_PASSAGE_HALF_Z * 0.95);
      blastDoorLeft.position.z = -VAULT_PASSAGE_HALF_Z * 0.5 - slideDist;
      blastDoorRight.position.z = VAULT_PASSAGE_HALF_Z * 0.5 + slideDist;
    }

    // Sync each vault car's 3D world position, heading, wheel steering/spin & visibility
    for (let i = 0; i < carRigs.length; i++) {
      const rig = carRigs[i];
      const st = cars.find((c) => c.id === rig.id);
      if (!st) continue;
      // Show car if it matches player's current realm (inside vault OR out on surface!)
      rig.root.visible = st.inVault === inVault;
      if (!rig.root.visible) continue;
      rig.root.position.set(st.x, st.y, st.z);
      rig.root.rotation.y = st.heading;

      for (const fw of rig.frontWheels) {
        fw.rotation.y = st.steerAngle;
        const spinG = fw.userData.spinGroup as THREE.Group | undefined;
        if (spinG) spinG.rotation.x = st.wheelSpin;
      }
      for (const rw of rig.rearWheels) {
        rw.rotation.x = st.wheelSpin;
      }
      rig.boostFlame.visible = st.boostActive;
      if (st.boostActive) {
        const flicker = 0.85 + Math.sin(elapsed * 32) * 0.25;
        rig.boostFlame.scale.set(1, flicker, 1);
      }
      rig.headlightLight.intensity = st.headlightsOn ? (inVault ? 1.8 : 1.5) : 0;
    }
  };

  const dispose = () => {
    heroPodRigs.forEach((p) => p.rig.dispose());
    disposables.forEach((d) => d.dispose());
    const disposeTree = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
    disposeTree(chamberGroup);
    disposeTree(surfacePortalGroup);
    disposeTree(carsGroup);
  };

  return {
    chamberGroup,
    surfacePortalGroup,
    carsGroup,
    interactables,
    update,
    dispose,
  };
}
