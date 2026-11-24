import * as THREE from 'three';
import type { HeroCharacterId } from '../game/heroCharacters';
import type { InteractableItem } from '../game/types';
import {
  VAULT_ARMORY_CONSOLE_POS,
  VAULT_BATMOBILE_BAY,
  VAULT_CAR_SPECS,
  VAULT_CEILING_Y,
  VAULT_ELEVATOR_POS,
  VAULT_EXIT_TUNNEL_POS,
  VAULT_FLOOR_Y,
  VAULT_HALF_X,
  VAULT_HALF_Z,
  VAULT_HERO_PODS,
  type VaultCarId,
  type VaultCarRuntimeState,
  type VaultCarSpec,
} from '../game/homeUndergroundVault';
import { createHeroCharacterRig, type HeroRig3D } from './heroCharacters3D';

export interface HomeUndergroundVault3D {
  /** Subterranean bunker chamber (visible only while player is inside the underground floor) */
  chamberGroup: THREE.Group;
  /** Drivable vault car 3D rigs (individually toggled visible based on whether each car is inVault vs surface) */
  carsGroup: THREE.Group;
  /** Static vault interactables (7 hero costume pods, armory console, elevator up, Batmobile bay) */
  interactables: InteractableItem[];
  update: (params: {
    inVault: boolean;
    activeHeroId: HeroCharacterId | null;
    cars: VaultCarRuntimeState[];
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

  const carsGroup = new THREE.Group();

  const disposables: Array<{ dispose: () => void }> = [];
  const interactables: InteractableItem[] = [];

  const W = VAULT_HALF_X * 2; // 56m
  const D = VAULT_HALF_Z * 2; // 48m
  const H = VAULT_CEILING_Y - VAULT_FLOOR_Y; // 9m
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

  const northWall = new THREE.Mesh(new THREE.BoxGeometry(W + 2, H, 0.8), concreteWallMat);
  northWall.position.set(0, midY, -VAULT_HALF_Z - 0.4);
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(W + 2, H, 0.8), concreteWallMat);
  southWall.position.set(0, midY, VAULT_HALF_Z + 0.4);
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, D + 2), concreteWallMat);
  westWall.position.set(-VAULT_HALF_X - 0.4, midY, 0);
  // East wall split around the wide Surface Exit Tunnel archway (z in [-4.5, +4.5])
  const eastWallN = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, 19.5), concreteWallMat);
  eastWallN.position.set(VAULT_HALF_X + 0.4, midY, -14.25);
  const eastWallS = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, 19.5), concreteWallMat);
  eastWallS.position.set(VAULT_HALF_X + 0.4, midY, 14.25);
  const eastWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 9.4), concreteWallMat);
  eastWallTop.position.set(VAULT_HALF_X + 0.4, VAULT_CEILING_Y - 1.7, 0);
  chamberGroup.add(northWall, southWall, westWall, eastWallN, eastWallS, eastWallTop);

  // Structural Steel Vault Arches + Overhead Linear LED Light Strips
  for (let x = -21; x <= 21; x += 7) {
    const colN = new THREE.Mesh(new THREE.BoxGeometry(0.65, H, 0.75), steelRibMat);
    colN.position.set(x, midY, -VAULT_HALF_Z + 0.45);
    const colS = new THREE.Mesh(new THREE.BoxGeometry(0.65, H, 0.75), steelRibMat);
    colS.position.set(x, midY, VAULT_HALF_Z - 0.45);
    const roofBeam = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, D - 1.5), steelRibMat);
    roofBeam.position.set(x, VAULT_CEILING_Y - 0.25, 0);
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, D - 6), cyanStripMat);
    ledBar.position.set(x, VAULT_CEILING_Y - 0.52, 0);
    chamberGroup.add(colN, colS, roofBeam, ledBar);
  }

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
    new THREE.PlaneGeometry(18.0, 2.1),
    new THREE.MeshBasicMaterial({ map: vaultBannerTex })
  );
  vaultBanner.position.set(0, VAULT_FLOOR_Y + 6.9, -VAULT_HALF_Z + 0.92);
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

  // 4. Illuminated Glass Elevator Shaft Going Back UP Into En Illam (South Wall, z = +19.6)
  const elevPad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.45, 0.24, 20), steelRibMat);
  elevPad.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + 0.12, VAULT_ELEVATOR_POS.z);
  const elevRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.09, 8, 28), amberStripMat);
  elevRing.rotation.x = Math.PI / 2;
  elevRing.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + 0.26, VAULT_ELEVATOR_POS.z);
  const elevTube = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, H - 0.5, 20, 1, true, -Math.PI * 0.65, Math.PI * 1.3),
    podGlassMat
  );
  elevTube.position.set(VAULT_ELEVATOR_POS.x, midY, VAULT_ELEVATOR_POS.z);
  const elevSignTex = makeSignTexture('ELEVATOR UP TO EN ILLAM', 'PRESS [E] TO RETURN TO HOUSE', '#f59e0b', 512, 112);
  disposables.push(elevSignTex);
  const elevSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 0.96),
    new THREE.MeshBasicMaterial({ map: elevSignTex })
  );
  elevSign.position.set(VAULT_ELEVATOR_POS.x, VAULT_FLOOR_Y + 4.4, VAULT_ELEVATOR_POS.z - 2.35);
  elevSign.rotation.y = Math.PI;
  chamberGroup.add(elevPad, elevRing, elevTube, elevSign);

  interactables.push({
    id: 'vault_elevator_up',
    kind: 'home_vault_exit',
    label: 'Take Secret Elevator Up to En Illam',
    sublabel: 'Return to My House Ground Floor',
    x: VAULT_ELEVATOR_POS.x,
    y: VAULT_FLOOR_Y,
    z: VAULT_ELEVATOR_POS.z - 0.8,
    radius: 3.4,
    locationId: 'my_home',
  });

  // 5. Glowing East Surface Exit Tunnel Archway (Drive any Vault Car straight out to the countryside!)
  const tunnelArchFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.6, 9.6), steelRibMat);
  tunnelArchFrame.position.set(VAULT_HALF_X - 0.8, VAULT_FLOOR_Y + 2.8, VAULT_EXIT_TUNNEL_POS.z);
  const tunnelGlowPortal = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 4.9),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    })
  );
  tunnelGlowPortal.rotation.y = -Math.PI / 2;
  tunnelGlowPortal.position.set(VAULT_HALF_X - 0.2, VAULT_FLOOR_Y + 2.45, VAULT_EXIT_TUNNEL_POS.z);
  const tunnelSignTex = makeSignTexture('DRIVE OUT TO SURFACE →', 'DRIVE ANY CAR THROUGH TUNNEL TO EXIT', '#34d399', 512, 112);
  disposables.push(tunnelSignTex);
  const tunnelSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 1.35),
    new THREE.MeshBasicMaterial({ map: tunnelSignTex })
  );
  tunnelSign.rotation.y = -Math.PI / 2;
  tunnelSign.position.set(VAULT_HALF_X - 0.45, VAULT_FLOOR_Y + 6.3, VAULT_EXIT_TUNNEL_POS.z);
  const exitChevron = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.04, 1.4), exitGreenMat);
  exitChevron.position.set(VAULT_HALF_X - 4.2, VAULT_FLOOR_Y + 0.03, VAULT_EXIT_TUNNEL_POS.z);
  chamberGroup.add(tunnelArchFrame, tunnelGlowPortal, tunnelSign, exitChevron);

  // 6. Clean Underground Architectural Lighting (3 crisp local lights inside light budget)
  const vaultAmbientLight = new THREE.PointLight(0xdbeafe, 3.2, 58, 1.15);
  vaultAmbientLight.position.set(0, VAULT_CEILING_Y - 1.2, 0);
  const heroWingLight = new THREE.PointLight(0x93c5fd, 2.8, 42, 1.2);
  heroWingLight.position.set(0, VAULT_CEILING_Y - 1.6, -15.5);
  const garageWingLight = new THREE.PointLight(0xfef3c7, 2.5, 42, 1.2);
  garageWingLight.position.set(0, VAULT_CEILING_Y - 1.6, 8.5);
  chamberGroup.add(vaultAmbientLight, heroWingLight, garageWingLight);

  // 7. Build the 3 Composite Drivable Underground Vault Cars!
  const carRigs: CarMeshRig[] = VAULT_CAR_SPECS.map((spec) => {
    const rig = buildCompositeVaultCar(spec, isSoftwareGl);
    carsGroup.add(rig.root);
    return rig;
  });

  const update: HomeUndergroundVault3D['update'] = ({
    inVault,
    activeHeroId,
    cars,
    elapsed,
    dt,
  }) => {
    chamberGroup.visible = inVault;

    if (inVault) {
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
    disposeTree(carsGroup);
  };

  return {
    chamberGroup,
    carsGroup,
    interactables,
    update,
    dispose,
  };
}
