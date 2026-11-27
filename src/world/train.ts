import * as THREE from 'three';
import { RAILWAY_TOTAL_LENGTH, sampleRailway, wrapT } from '../game/railway';
import type { SeasonType, TrainState, WeatherType } from '../game/types';
import {
  createInitialTrainPassengerStates,
  stepTrainPassengers,
  type TrainPassengerSeed,
} from '../game/trainPassengers';
import { createTrainSteamPool, stepTrainSteamPool } from '../game/trainSteam';

export interface PassengerTrainRig {
  group: THREE.Group;
  leadCar: THREE.Group;
  getWindowSeatTransform: (outPos: THREE.Vector3, outLook: THREE.Vector3) => void;
  getDriverCabTransform: (outPos: THREE.Vector3, outLook: THREE.Vector3) => void;
  getCabinWalkTransform: (
    cabinWalkZ: number,
    cabinWalkX: number,
    yawOffset: number,
    pitchOffset: number,
    outPos: THREE.Vector3,
    outLook: THREE.Vector3
  ) => void;
  getCompanionSeatTransform: (outPos: THREE.Vector3) => number;
  getExteriorAnchor: (outPos: THREE.Vector3) => void;
  update: (
    state: TrainState,
    dt: number,
    lanternStrength: number,
    timeHours?: number,
    weather?: WeatherType,
    season?: SeasonType,
    isPlayerNearOrRiding?: boolean,
    temperatureC?: number,
    skyTintHex?: number,
    pixelRatio?: number,
    isSteamVisible?: boolean,
    nightDarkness?: number
  ) => void;
  dispose: () => void;
}

/**
 * Detailed 2-car Japanese rural local passenger train inspired by classic KiHa-40 / rural anime trains:
 * - Warm terracotta-coral & cream two-tone exterior body with deep twilight blue roofline
 * - Recessed transparent windows revealing a warmly lit interior with facing bench seats & ceiling lamps
 * - Animated sliding doors on both sides
 * - Roof AC units, exhaust vents & overhead pantograph
 * - Dual glowing headlights, ruby tail lights, and rotating wheel bogies
 */
export function createPassengerTrain(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): PassengerTrainRig {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  // Shared High-Fidelity Clearcoat PBR Train Materials
  const upperBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xebd3b8, // warm nostalgic Japanese local cream lacquer
    roughness: 0.34,
    metalness: 0.18,
    clearcoat: 0.78,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.28,
  });
  const lowerBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xc24f42, // vintage rural terracotta-vermilion clearcoat
    roughness: 0.36,
    metalness: 0.18,
    clearcoat: 0.82,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.28,
  });
  const stripeMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a385b, // twilight railway navy lacquer
    roughness: 0.32,
    metalness: 0.28,
    clearcoat: 0.75,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.3,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x3b4152,
    roughness: 0.56,
    metalness: 0.42,
    envMapIntensity: 1.1,
  });
  const underframeMat = new THREE.MeshStandardMaterial({
    color: 0x22242e,
    roughness: 0.68,
    metalness: 0.62,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x6f7685,
    roughness: 0.24,
    metalness: 0.9,
    envMapIntensity: 1.35,
  });
  const interiorWallMat = new THREE.MeshStandardMaterial({
    color: 0xf7e7c8,
    emissive: new THREE.Color(0xffb85e),
    emissiveIntensity: 0.78,
    roughness: 0.76,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x943f3c, // plush Japanese retro red-velvet carriage seats
    roughness: 0.88,
  });
  const ceilingGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff5db,
    emissive: new THREE.Color(0xffcc78),
    emissiveIntensity: 2.35,
    roughness: 0.18,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaed4e6,
    emissive: new THREE.Color(0xffcf88),
    emissiveIntensity: 0.16,
    roughness: 0.05,
    metalness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 0.96,
    envMapIntensity: 1.45,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff8df,
    emissive: new THREE.Color(0xffdd94),
    emissiveIntensity: 3.4,
    roughness: 0.08,
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff4b4b,
    emissive: new THREE.Color(0xff2828),
    emissiveIntensity: 2.6,
    roughness: 0.16,
  });
  const doorMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0c4a7,
    roughness: 0.32,
    metalness: 0.32,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.25,
  });

  disposables.push(
    upperBodyMat,
    lowerBodyMat,
    stripeMat,
    roofMat,
    underframeMat,
    wheelMat,
    interiorWallMat,
    seatMat,
    ceilingGlowMat,
    glassMat,
    headlightMat,
    taillightMat,
    doorMat
  );

  const slidingDoors: Array<{ mesh: THREE.Mesh; baseZ: number; dir: number }> = [];
  const wheels: THREE.Mesh[] = [];
  const carLength = 12.6;
  const carWidth = 2.72;

  const buildCar = (isFront: boolean): THREE.Group => {
    const car = new THREE.Group();

    const addPart = (
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      cast = true
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      disposables.push(geo);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast && !isSoftwareGl;
      mesh.receiveShadow = true;
      car.add(mesh);
      return mesh;
    };

    // Underframe & floor deck
    addPart(carWidth - 0.14, 0.36, carLength - 0.2, underframeMat, 0, 0.72, 0);
    addPart(carWidth - 0.06, 0.12, carLength, interiorWallMat, 0, 0.96, 0, false);

    // Lower solid exterior walls (left & right, interrupted at 2 doorway bays)
    [-1, 1].forEach((side) => {
      const wx = side * (carWidth * 0.5 - 0.06);
      // Lower terracotta apron along full length except door openings
      addPart(0.12, 0.88, 3.0, lowerBodyMat, wx, 1.4, -4.7);
      addPart(0.12, 0.88, 3.4, lowerBodyMat, wx, 1.4, 0.0);
      addPart(0.12, 0.88, 3.0, lowerBodyMat, wx, 1.4, 4.7);

      // Navy accent stripe
      addPart(0.14, 0.14, 3.0, stripeMat, wx, 1.84, -4.7, false);
      addPart(0.14, 0.14, 3.4, stripeMat, wx, 1.84, 0.0, false);
      addPart(0.14, 0.14, 3.0, stripeMat, wx, 1.84, 4.7, false);

      // Upper header beam above windows
      addPart(0.14, 0.42, carLength, upperBodyMat, wx, 3.12, 0);

      // Window pillars separating wide panoramic windows (open center bay z=-1.5..+1.5 matches unobstructed bus window view!)
      [-5.9, -4.4, -1.5, 1.5, 4.4, 5.9].forEach((pz) => {
        addPart(0.13, 1.15, 0.28, upperBodyMat, wx, 2.42, pz);
      });

      // Clear sky-tinted panoramic window glass strips
      addPart(0.04, 1.06, 2.65, glassMat, wx, 2.42, -4.7, false);
      addPart(0.04, 1.06, 2.95, glassMat, wx, 2.42, 0.0, false);
      addPart(0.04, 1.06, 2.65, glassMat, wx, 2.42, 4.7, false);

      // Sliding Double Passenger Doors (at z = -2.45 and z = +2.45)
      [-2.45, 2.45].forEach((dz) => {
        const dLeft = addPart(0.09, 2.02, 0.68, doorMat, wx - side * 0.04, 1.96, dz - 0.35, false);
        const dRight = addPart(0.09, 2.02, 0.68, doorMat, wx - side * 0.04, 1.96, dz + 0.35, false);
        slidingDoors.push(
          { mesh: dLeft, baseZ: dz - 0.35, dir: -1 },
          { mesh: dRight, baseZ: dz + 0.35, dir: 1 }
        );
      });
    });

    // Front & Rear End Bulkheads with driver cabin windows
    [-1, 1].forEach((end) => {
      const ez = end * (carLength * 0.5 - 0.07);
      addPart(carWidth, 0.98, 0.16, lowerBodyMat, 0, 1.44, ez);
      addPart(carWidth, 0.14, 0.18, stripeMat, 0, 1.9, ez, false);
      addPart(carWidth, 0.44, 0.16, upperBodyMat, 0, 3.12, ez);
      addPart(0.42, 1.08, 0.16, upperBodyMat, -1.12, 2.42, ez);
      addPart(0.42, 1.08, 0.16, upperBodyMat, 1.12, 2.42, ez);
      addPart(0.24, 1.08, 0.16, upperBodyMat, 0, 2.42, ez);
      addPart(carWidth - 0.6, 1.0, 0.06, glassMat, 0, 2.42, ez, false);
    });

    // Rounded Roof + AC Cooling Units + Overhead Pantograph (on front car)
    addPart(carWidth - 0.1, 0.26, carLength + 0.08, roofMat, 0, 3.44, 0);
    addPart(carWidth - 0.55, 0.18, carLength - 0.4, roofMat, 0, 3.62, 0);
    [-3.2, 0.0, 3.2].forEach((az) => {
      addPart(1.35, 0.28, 1.65, roofMat, 0, 3.82, az);
    });

    if (isFront) {
      // Diamond pantograph reaching toward overhead catenary wire
      const p1 = addPart(0.08, 1.15, 0.08, underframeMat, -0.5, 4.25, -4.2, false);
      p1.rotation.x = 0.48;
      const p2 = addPart(0.08, 1.15, 0.08, underframeMat, 0.5, 4.25, -4.2, false);
      p2.rotation.x = 0.48;
      const p3 = addPart(0.08, 1.05, 0.08, underframeMat, -0.5, 4.95, -4.2, false);
      p3.rotation.x = -0.48;
      const p4 = addPart(0.08, 1.05, 0.08, underframeMat, 0.5, 4.95, -4.2, false);
      p4.rotation.x = -0.48;
      addPart(1.45, 0.07, 0.18, wheelMat, 0, 5.34, -4.2, false);

      // Composite Cast-Iron Locomotive Steam/Exhaust Stack on front roof crown (z = +4.85, clear of AC at z=+3.2)
      const stackCollarGeo = new THREE.CylinderGeometry(0.31, 0.38, 0.14, 14);
      const stackBandGeo = new THREE.CylinderGeometry(0.285, 0.285, 0.05, 14);
      const stackBarrelGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.46, 14);
      const stackRimGeo = new THREE.CylinderGeometry(0.29, 0.22, 0.1, 14);
      const stackCoreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12);
      const brassBandMat = new THREE.MeshStandardMaterial({
        color: 0xc99c58,
        roughness: 0.34,
        metalness: 0.78,
      });
      const flueSootMat = new THREE.MeshStandardMaterial({
        color: 0x111216,
        roughness: 0.95,
        metalness: 0.1,
      });
      disposables.push(
        stackCollarGeo,
        stackBandGeo,
        stackBarrelGeo,
        stackRimGeo,
        stackCoreGeo,
        brassBandMat,
        flueSootMat
      );

      const stackCollar = new THREE.Mesh(stackCollarGeo, underframeMat);
      stackCollar.position.set(0, 3.76, 4.85);
      stackCollar.castShadow = !isSoftwareGl;
      car.add(stackCollar);

      const stackBand = new THREE.Mesh(stackBandGeo, brassBandMat);
      stackBand.position.set(0, 3.85, 4.85);
      car.add(stackBand);

      const stackBarrel = new THREE.Mesh(stackBarrelGeo, underframeMat);
      stackBarrel.position.set(0, 4.08, 4.85);
      stackBarrel.castShadow = !isSoftwareGl;
      car.add(stackBarrel);

      const stackRim = new THREE.Mesh(stackRimGeo, wheelMat);
      stackRim.position.set(0, 4.33, 4.85);
      car.add(stackRim);

      const stackCore = new THREE.Mesh(stackCoreGeo, flueSootMat);
      stackCore.position.set(0, 4.37, 4.85);
      car.add(stackCore);
    }

    // Warm Illuminated Interior: plush red bench seats, wood aisle runner, armrests & ceiling luggage rails
    const aisleMat = new THREE.MeshStandardMaterial({ color: 0xb68a64, roughness: 0.78 });
    const railBarMat = new THREE.MeshStandardMaterial({ color: 0xd0d6e0, roughness: 0.3, metalness: 0.8 });
    disposables.push(aisleMat, railBarMat);

    addPart(1.12, 0.04, carLength - 0.8, aisleMat, 0, 1.03, 0, false);
    addPart(1.1, 0.08, carLength - 1.4, ceilingGlowMat, 0, 3.26, 0, false);
    [-1, 1].forEach((side) => {
      const sx = side * (carWidth * 0.5 - 0.36);
      // Overhead luggage rail & hand-strap bar
      addPart(0.28, 0.05, carLength - 1.6, railBarMat, side * (carWidth * 0.5 - 0.38), 2.86, 0, false);
      [-4.6, 0.0, 4.6].forEach((sz) => {
        addPart(0.48, 0.42, 2.45, seatMat, sx, 1.24, sz, false);
        addPart(0.14, 0.54, 2.45, seatMat, sx + side * 0.18, 1.66, sz, false);
        // Wooden seat end armrests
        addPart(0.46, 0.36, 0.08, aisleMat, sx, 1.38, sz - 1.22, false);
        addPart(0.46, 0.36, 0.08, aisleMat, sx, 1.38, sz + 1.22, false);
      });
    });

    // Headlights (front of lead car) & Ruby Tail Lights (rear of trailing car)
    const lampGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12);
    lampGeo.rotateX(Math.PI / 2);
    disposables.push(lampGeo);

    if (isFront) {
      [-0.78, 0.78].forEach((hx) => {
        const hl = new THREE.Mesh(lampGeo, headlightMat);
        hl.position.set(hx, 1.48, carLength * 0.5 + 0.04);
        car.add(hl);
      });
      // Glowing roof destination headsign
      addPart(0.86, 0.24, 0.08, ceilingGlowMat, 0, 3.12, carLength * 0.5 + 0.04, false);
    } else {
      [-0.78, 0.78].forEach((tx) => {
        const tl = new THREE.Mesh(lampGeo, taillightMat);
        tl.position.set(tx, 1.48, -carLength * 0.5 - 0.04);
        car.add(tl);
      });
    }

    // 2 Detailed Bogies with 4 rotating steel wheels each
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    disposables.push(wheelGeo);

    [-4.1, 4.1].forEach((bz) => {
      addPart(1.68, 0.32, 2.15, underframeMat, 0, 0.42, bz, false);
      [-0.72, 0.72].forEach((wz) => {
        [-0.64, 0.64].forEach((wx) => {
          const w = new THREE.Mesh(wheelGeo, wheelMat);
          w.position.set(wx, 0.38, bz + wz);
          car.add(w);
          wheels.push(w);
        });
      });
    });

    return car;
  };

  const leadCar = buildCar(true);
  const rearCar = buildCar(false);

  // =========================================================================
  // ENVIRONMENT-SENSITIVE SEATED AI PASSENGERS (Books, Teacups, Window Gazing)
  // =========================================================================
  interface PassengerMeshRig {
    side: -1 | 1;
    torsoPivot: THREE.Group;
    headPivot: THREE.Group;
    leftArmPivot: THREE.Group;
    rightArmPivot: THREE.Group;
    bookGroup: THREE.Group;
    rightBookPage: THREE.Mesh;
    cupGroup: THREE.Group;
  }

  const pHeadGeo = new THREE.SphereGeometry(0.145, 10, 8);
  const pHairGeo = new THREE.SphereGeometry(0.156, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const pTorsoGeo = new THREE.BoxGeometry(0.36, 0.44, 0.22);
  const pShirtGeo = new THREE.BoxGeometry(0.14, 0.34, 0.232);
  const pThighGeo = new THREE.BoxGeometry(0.135, 0.13, 0.38);
  const pShinGeo = new THREE.BoxGeometry(0.115, 0.38, 0.12);
  const pShoeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.2);
  const pArmGeo = new THREE.BoxGeometry(0.105, 0.34, 0.105);
  const pHandGeo = new THREE.SphereGeometry(0.055, 7, 6);
  const pBookHalfGeo = new THREE.BoxGeometry(0.15, 0.018, 0.21);
  const pBookPageGeo = new THREE.BoxGeometry(0.135, 0.014, 0.19);
  const pCupBodyGeo = new THREE.CylinderGeometry(0.044, 0.036, 0.085, 8);
  const pCupTeaGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.012, 8);
  const pPageMat = new THREE.MeshStandardMaterial({ color: 0xfbf4e4, roughness: 0.92 });
  const pTeaMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.35 });
  const pShoeMat = new THREE.MeshStandardMaterial({ color: 0x22232c, roughness: 0.72 });

  disposables.push(
    pHeadGeo,
    pHairGeo,
    pTorsoGeo,
    pShirtGeo,
    pThighGeo,
    pShinGeo,
    pShoeGeo,
    pArmGeo,
    pHandGeo,
    pBookHalfGeo,
    pBookPageGeo,
    pCupBodyGeo,
    pCupTeaGeo,
    pPageMat,
    pTeaMat,
    pShoeMat
  );

  const passengerStates = createInitialTrainPassengerStates();
  const passengerRigs: PassengerMeshRig[] = [];

  const buildSeatedPassenger = (seed: TrainPassengerSeed): PassengerMeshRig => {
    const coatMat = new THREE.MeshStandardMaterial({ color: seed.coatHex, roughness: 0.78 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: seed.shirtHex, roughness: 0.85 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: seed.pantsHex, roughness: 0.86 });
    const hairMat = new THREE.MeshStandardMaterial({ color: seed.hairHex, roughness: 0.82 });
    const skinMat = new THREE.MeshStandardMaterial({ color: seed.skinHex, roughness: 0.72 });
    const bookMat = new THREE.MeshStandardMaterial({ color: seed.bookHex, roughness: 0.65 });
    const cupMat = new THREE.MeshStandardMaterial({ color: seed.cupHex, roughness: 0.32 });
    disposables.push(coatMat, shirtMat, pantsMat, hairMat, skinMat, bookMat, cupMat);

    const root = new THREE.Group();
    // Seat top sits at y = 1.45, bench X at ±1.0; face toward center aisle (+Z local)
    root.position.set(seed.side * 0.96, 1.45, seed.seatZ);
    root.rotation.y = seed.side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5;

    // Seated legs resting naturally from bench edge down to carriage floor (y = 1.03)
    for (const lx of [-0.095, 0.095]) {
      const thigh = new THREE.Mesh(pThighGeo, pantsMat);
      thigh.position.set(lx, 0.06, 0.14);
      root.add(thigh);

      const shin = new THREE.Mesh(pShinGeo, pantsMat);
      shin.position.set(lx, -0.17, 0.31);
      root.add(shin);

      const shoe = new THREE.Mesh(pShoeGeo, pShoeMat);
      shoe.position.set(lx, -0.37, 0.36);
      root.add(shoe);
    }

    // Articulated upper torso pivot
    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 0.12, -0.02);
    root.add(torsoPivot);

    const torso = new THREE.Mesh(pTorsoGeo, coatMat);
    torso.position.set(0, 0.22, 0);
    torsoPivot.add(torso);

    const shirt = new THREE.Mesh(pShirtGeo, shirtMat);
    shirt.position.set(0, 0.23, 0);
    torsoPivot.add(shirt);

    // Articulated head pivot
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.47, 0);
    torsoPivot.add(headPivot);

    const head = new THREE.Mesh(pHeadGeo, skinMat);
    head.position.set(0, 0.13, 0);
    headPivot.add(head);

    const hair = new THREE.Mesh(pHairGeo, hairMat);
    hair.position.set(0, 0.155, -0.015);
    hair.rotation.x = -0.16;
    headPivot.add(hair);

    // Left & Right Arms
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.23, 0.39, 0.02);
    torsoPivot.add(leftArmPivot);
    const lArm = new THREE.Mesh(pArmGeo, coatMat);
    lArm.position.set(0, -0.15, 0);
    leftArmPivot.add(lArm);
    const lHand = new THREE.Mesh(pHandGeo, skinMat);
    lHand.position.set(0, -0.33, 0.02);
    leftArmPivot.add(lHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.23, 0.39, 0.02);
    torsoPivot.add(rightArmPivot);
    const rArm = new THREE.Mesh(pArmGeo, coatMat);
    rArm.position.set(0, -0.15, 0);
    rightArmPivot.add(rArm);
    const rHand = new THREE.Mesh(pHandGeo, skinMat);
    rHand.position.set(0, -0.33, 0.02);
    rightArmPivot.add(rHand);

    // Open Hardcover Book Prop (mounted in front of torso, raised during 'reading')
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, 0.22, 0.34);
    bookGroup.rotation.x = 0.46;
    const leftCover = new THREE.Mesh(pBookHalfGeo, bookMat);
    leftCover.position.set(-0.075, 0, 0);
    leftCover.rotation.z = 0.24;
    const rightCover = new THREE.Mesh(pBookHalfGeo, bookMat);
    rightCover.position.set(0.075, 0, 0);
    rightCover.rotation.z = -0.24;
    const leftPage = new THREE.Mesh(pBookPageGeo, pPageMat);
    leftPage.position.set(-0.072, 0.014, 0);
    leftPage.rotation.z = 0.24;
    const rightBookPage = new THREE.Mesh(pBookPageGeo, pPageMat);
    rightBookPage.position.set(0.072, 0.014, 0);
    rightBookPage.rotation.z = -0.24;
    bookGroup.add(leftCover, rightCover, leftPage, rightBookPage);
    torsoPivot.add(bookGroup);

    // Warm Porcelain Teacup Prop (mounted to right hand, visible during 'sipping_tea')
    const cupGroup = new THREE.Group();
    cupGroup.position.set(-0.02, -0.34, 0.08);
    const cupBody = new THREE.Mesh(pCupBodyGeo, cupMat);
    const cupTea = new THREE.Mesh(pCupTeaGeo, pTeaMat);
    cupTea.position.y = 0.038;
    cupGroup.add(cupBody, cupTea);
    rightArmPivot.add(cupGroup);

    const targetCar = seed.carIndex === 0 ? leadCar : rearCar;
    targetCar.add(root);

    return {
      side: seed.side,
      torsoPivot,
      headPivot,
      leftArmPivot,
      rightArmPivot,
      bookGroup,
      rightBookPage,
      cupGroup,
    };
  };

  for (let i = 0; i < passengerStates.length; i++) {
    passengerRigs.push(buildSeatedPassenger(passengerStates[i].seed));
  }

  let passengerElapsed = 0;

  // Flexible black inter-car gangway coupler
  const couplerGeo = new THREE.BoxGeometry(1.4, 2.25, 0.9);
  disposables.push(couplerGeo);
  const coupler = new THREE.Mesh(couplerGeo, underframeMat);
  coupler.position.set(0, 2.1, -carLength * 0.5 - 0.45);
  leadCar.add(coupler);

  // =========================================================================
  // CINEMATIC LOCOMOTIVE NIGHT LIGHTING SUITE (4 Prioritized Real Lights + Volumetric Headlight Beams)
  // =========================================================================
  // 1. Warm dynamic PointLight inside the lead carriage spilling golden light onto tracks & platforms
  const trainGlowLight = new THREE.PointLight(0xffbe68, 5.5, 36, 1.15);
  trainGlowLight.position.set(0, 2.55, 0.4);
  trainGlowLight.userData.isTrainLight = true;
  leadCar.add(trainGlowLight);

  // 2. Warm dynamic PointLight inside the rear carriage so both cars illuminate the pitch-dark night
  const rearGlowLight = new THREE.PointLight(0xffb85e, 0, 30, 1.2);
  rearGlowLight.position.set(0, 2.55, 0);
  rearGlowLight.userData.isTrainLight = true;
  rearCar.add(rearGlowLight);

  // 3. Long-throw Locomotive Headlight SpotLight cutting far ahead down the pitch-black railway tracks
  const trainHeadlightSpot = new THREE.SpotLight(0xfff1cc, 0, 125, Math.PI / 3.6, 0.46, 0.92);
  trainHeadlightSpot.position.set(0, 1.72, carLength * 0.5 + 0.18);
  trainHeadlightSpot.target.position.set(0, 0.15, carLength * 0.5 + 34.0);
  trainHeadlightSpot.userData.isTrainLight = true;
  leadCar.add(trainHeadlightSpot);
  leadCar.add(trainHeadlightSpot.target);

  // 4. Forward Headlight Spill PointLight lighting the immediate nose, platform, rails & characters ahead
  const trainHeadlightFill = new THREE.PointLight(0xffe8b8, 0, 44, 1.15);
  trainHeadlightFill.position.set(0, 2.05, carLength * 0.5 + 5.8);
  trainHeadlightFill.userData.isTrainLight = true;
  leadCar.add(trainHeadlightFill);

  // Volumetric Additive Headlight Light-Beam Cones (feathered Fresnel + distance decay shader)
  const beamLength = 30.0;
  const headlightBeamGeo = new THREE.CylinderGeometry(0.18, 4.5, beamLength, 24, 1, true);
  // Shift apex to origin (z=0) and orient beam forward along +Z
  headlightBeamGeo.translate(0, -beamLength * 0.5, 0);
  headlightBeamGeo.rotateX(-Math.PI * 0.5);

  const headlightBeamUniforms = {
    uColor: { value: new THREE.Color(0xfff0c2) },
    uOpacity: { value: 0.0 },
  };
  const headlightBeamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: headlightBeamUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      void main() {
        if (uOpacity <= 0.004) discard;
        // vUv.y = 1.0 at headlamp apex, 0.0 at far end of beam
        float along = clamp(vUv.y, 0.0, 1.0);
        float distFade = pow(along, 1.55) * smoothstep(0.0, 0.14, along);
        float edgeSoft = pow(abs(dot(normalize(vNormalV), normalize(vViewDir))), 1.45);
        float alpha = distFade * edgeSoft * uOpacity;
        if (alpha <= 0.004) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });

  const headlightBeams: THREE.Mesh[] = [];
  [-0.78, 0.78].forEach((hx) => {
    const beam = new THREE.Mesh(headlightBeamGeo, headlightBeamMat);
    beam.position.set(hx, 1.48, carLength * 0.5 + 0.08);
    beam.rotation.x = 0.055; // Slight downward aim onto rails
    beam.renderOrder = 15;
    beam.visible = false;
    leadCar.add(beam);
    headlightBeams.push(beam);
  });

  // Bright Additive Headlamp Lens Glow Halos
  const lensHaloGeo = new THREE.PlaneGeometry(1.15, 1.15);
  const lensHaloUniforms = {
    uColor: { value: new THREE.Color(0xfff4cf) },
    uOpacity: { value: 0.0 },
  };
  const lensHaloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: lensHaloUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        if (uOpacity <= 0.004) discard;
        float d = length(vUv - 0.5) * 2.0;
        float glow = exp(-d * d * 4.2) * smoothstep(1.0, 0.25, d);
        gl_FragColor = vec4(uColor, glow * uOpacity);
      }
    `,
  });
  const lensHalos: THREE.Mesh[] = [];
  [-0.78, 0.78].forEach((hx) => {
    const halo = new THREE.Mesh(lensHaloGeo, lensHaloMat);
    halo.position.set(hx, 1.48, carLength * 0.5 + 0.14);
    halo.renderOrder = 16;
    halo.visible = false;
    leadCar.add(halo);
    lensHalos.push(halo);
  });

  // Warm Golden Window-Light Spill Pools along both sides of both carriages at Night
  const windowSpillGeo = new THREE.PlaneGeometry(5.8, carLength * 0.92);
  windowSpillGeo.rotateX(-Math.PI * 0.5);
  const windowSpillUniforms = {
    uColor: { value: new THREE.Color(0xffbd62) },
    uOpacity: { value: 0.0 },
  };
  const windowSpillMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: windowSpillUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        if (uOpacity <= 0.004) discard;
        vec2 p = (vUv - 0.5) * 2.0;
        float falloff = smoothstep(1.0, 0.0, abs(p.x)) * smoothstep(1.0, 0.12, abs(p.y));
        gl_FragColor = vec4(uColor, falloff * falloff * uOpacity);
      }
    `,
  });
  const windowSpills: THREE.Mesh[] = [];
  [leadCar, rearCar].forEach((car) => {
    [-1, 1].forEach((side) => {
      const spill = new THREE.Mesh(windowSpillGeo, windowSpillMat);
      spill.position.set(side * (carWidth * 0.5 + 2.35), 0.18, 0);
      spill.renderOrder = 12;
      spill.visible = false;
      car.add(spill);
      windowSpills.push(spill);
    });
  });

  disposables.push(
    headlightBeamGeo,
    headlightBeamMat,
    lensHaloGeo,
    lensHaloMat,
    windowSpillGeo,
    windowSpillMat
  );

  group.add(leadCar, rearCar);

  // =========================================================================
  // PROCEDURAL STEAM / SMOKE PARTICLE PLUME (Single Draw Call Volumetric Cloud InstancedMesh)
  // =========================================================================
  const STEAM_CAPACITY = 72;
  const steamPool = createTrainSteamPool(STEAM_CAPACITY);

  const steamPuffGeo = new THREE.IcosahedronGeometry(0.55, 2);
  const steamAlphaArr = new Float32Array(STEAM_CAPACITY);
  const steamTintArr = new Float32Array(STEAM_CAPACITY);
  const steamAlphaAttr = new THREE.InstancedBufferAttribute(steamAlphaArr, 1);
  const steamTintAttr = new THREE.InstancedBufferAttribute(steamTintArr, 1);
  steamAlphaAttr.setUsage(THREE.DynamicDrawUsage);
  steamTintAttr.setUsage(THREE.DynamicDrawUsage);
  steamPuffGeo.setAttribute('aAlpha', steamAlphaAttr);
  steamPuffGeo.setAttribute('aTintMix', steamTintAttr);

  const steamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uCoreColor: { value: new THREE.Color(0xf2ece5) },
      uEdgeColor: { value: new THREE.Color(0xd2ccd0) },
      uSkyTint: { value: new THREE.Color(0xffd9c0) },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aTintMix;
      varying float vAlpha;
      varying float vTintMix;
      varying vec3 vViewNormal;
      varying vec3 vViewPos;
      varying float vUpDot;

      void main() {
        vAlpha = aAlpha;
        vTintMix = aTintMix;
        vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPos;
        vViewPos = -mvPosition.xyz;
        mat3 instNormMat = mat3(instanceMatrix);
        vec3 worldNormal = normalize(mat3(modelMatrix) * instNormMat * normal);
        vUpDot = worldNormal.y * 0.5 + 0.5;
        vViewNormal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCoreColor;
      uniform vec3 uEdgeColor;
      uniform vec3 uSkyTint;
      varying float vAlpha;
      varying float vTintMix;
      varying vec3 vViewNormal;
      varying vec3 vViewPos;
      varying float vUpDot;

      void main() {
        if (vAlpha <= 0.004) discard;
        vec3 n = normalize(vViewNormal);
        vec3 v = normalize(vViewPos);
        // Soft cloud Fresnel feathering so puff edges dissolve smoothly into the sky
        float ndv = max(0.0, dot(n, v));
        float softEdge = pow(ndv, 1.12);
        float alpha = min(0.92, softEdge * vAlpha * 1.18);
        if (alpha <= 0.008) discard;
        vec3 baseCol = mix(uCoreColor, uEdgeColor, clamp(vTintMix, 0.0, 1.0));
        // Subtle sunlit crown + cool belly shading harmonized with ambient sky palette
        vec3 skyLit = mix(baseCol * 0.88, baseCol * (0.82 + 0.38 * uSkyTint), vUpDot);
        gl_FragColor = vec4(skyLit, alpha);
      }
    `,
  });

  const steamMesh = new THREE.InstancedMesh(steamPuffGeo, steamMat, STEAM_CAPACITY);
  steamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  steamMesh.frustumCulled = false;
  steamMesh.renderOrder = 14;
  group.add(steamMesh);
  disposables.push(steamPuffGeo, steamMat);

  const _steamDummy = new THREE.Object3D();
  let steamElapsed = 0;
  let steamPrimed = false;
  let lastSteamTempC = 18;
  let bogieSideToggle = 1;

  scene.add(group);

  // Pre-allocated scratch helpers (zero GC in loop)
  // Window seat mirrors the Bus panoramic side-forward window framing cleanly!
  const _localSeat = new THREE.Vector3(0.96, 2.38, 0.42);
  const _localLook = new THREE.Vector3(10.5, 2.12, 5.2);
  // Front Driver's Cab panoramic forward view looking down the railway tracks
  const _localDriverPos = new THREE.Vector3(0.0, 2.44, 5.35);
  const _localDriverLook = new THREE.Vector3(0.0, 2.08, 22.0);
  const _localExt = new THREE.Vector3(0, 2.4, -3.5);
  const _localCabinPos = new THREE.Vector3(0, 2.25, 0);
  const _localCabinLook = new THREE.Vector3(0, 2.12, 4.0);
  const _localCompSeat = new THREE.Vector3(-0.88, 1.45, 0.35);
  const _localExhaust = new THREE.Vector3(0, 4.44, 4.85);
  const _worldExhaust = new THREE.Vector3();
  const _localBogieVent = new THREE.Vector3(1.36, 0.72, 4.35);
  const _worldBogieVent = new THREE.Vector3();

  const getWindowSeatTransform = (outPos: THREE.Vector3, outLook: THREE.Vector3) => {
    leadCar.updateMatrixWorld(true);
    outPos.copy(_localSeat).applyMatrix4(leadCar.matrixWorld);
    outLook.copy(_localLook).applyMatrix4(leadCar.matrixWorld);
  };

  const getDriverCabTransform = (outPos: THREE.Vector3, outLook: THREE.Vector3) => {
    leadCar.updateMatrixWorld(true);
    outPos.copy(_localDriverPos).applyMatrix4(leadCar.matrixWorld);
    outLook.copy(_localDriverLook).applyMatrix4(leadCar.matrixWorld);
  };

  const getCabinWalkTransform = (
    cabinWalkZ: number,
    cabinWalkX: number,
    yawOffset: number,
    pitchOffset: number,
    outPos: THREE.Vector3,
    outLook: THREE.Vector3
  ) => {
    leadCar.updateMatrixWorld(true);
    _localCabinPos.set(cabinWalkX, 2.28, cabinWalkZ);
    _localCabinLook.set(
      cabinWalkX + Math.sin(yawOffset) * 5.0,
      2.18 + Math.sin(-pitchOffset) * 3.0,
      cabinWalkZ + Math.cos(yawOffset) * 5.0
    );
    outPos.copy(_localCabinPos).applyMatrix4(leadCar.matrixWorld);
    outLook.copy(_localCabinLook).applyMatrix4(leadCar.matrixWorld);
  };

  const getCompanionSeatTransform = (outPos: THREE.Vector3): number => {
    leadCar.updateMatrixWorld(true);
    outPos.copy(_localCompSeat).applyMatrix4(leadCar.matrixWorld);
    return leadCar.rotation.y - Math.PI * 0.5;
  };

  const getExteriorAnchor = (outPos: THREE.Vector3) => {
    leadCar.updateMatrixWorld(true);
    outPos.copy(_localExt).applyMatrix4(leadCar.matrixWorld);
  };

  const carSpacingT = (carLength + 0.9) / RAILWAY_TOTAL_LENGTH;

  const update = (
    state: TrainState,
    dt: number,
    lanternStrength: number,
    timeHours = 17.72,
    weather: WeatherType = 'clear',
    season: SeasonType = 'spring',
    isPlayerNearOrRiding = true,
    temperatureC = 18,
    skyTintHex = 0xffd9c0,
    pixelRatio = 1,
    isSteamVisible = true,
    nightDarkness = 0
  ) => {
    const sLead = sampleRailway(state.t);
    leadCar.position.set(sLead.x, sLead.y + 0.08, sLead.z);
    leadCar.rotation.order = 'YXZ';
    leadCar.rotation.set(-sLead.pitch, sLead.angle, 0);

    const sRear = sampleRailway(wrapT(state.t - carSpacingT));
    rearCar.position.set(sRear.x, sRear.y + 0.08, sRear.z);
    rearCar.rotation.order = 'YXZ';
    rearCar.rotation.set(-sRear.pitch, sRear.angle, 0);

    const slideDist = state.doorOpen * 0.62;
    for (let i = 0; i < slidingDoors.length; i++) {
      const d = slidingDoors[i];
      d.mesh.position.z = d.baseZ + d.dir * slideDist;
    }

    const linearSpeed = state.speed * RAILWAY_TOTAL_LENGTH;
    const wheelSpin = (linearSpeed / 0.38) * dt;
    for (let i = 0; i < wheels.length; i++) {
      wheels[i].rotation.x += wheelSpin;
    }

    // Procedural locomotive steam/smoke plume scaled by speed & ambient temperature
    steamMesh.visible = isSteamVisible;
    if (isSteamVisible) {
      leadCar.updateMatrixWorld();
      _worldExhaust.copy(_localExhaust).applyMatrix4(leadCar.matrixWorld);
      const trainVx = Math.sin(sLead.angle) * linearSpeed;
      const trainVz = Math.cos(sLead.angle) * linearSpeed;

      // Warm-start when gameplay begins (dt > 0) or pulse condensation immediately when temperature shifts sharply
      const tempShifted = Math.abs(temperatureC - lastSteamTempC) >= 5.0;
      if ((!steamPrimed && dt > 0) || tempShifted) {
        steamPrimed = true;
        lastSteamTempC = temperatureC;
        const warmSteps = tempShifted ? 6 : 10;
        for (let k = 0; k < warmSteps; k++) {
          steamElapsed += 0.16;
          stepTrainSteamPool(
            steamPool,
            0.16,
            _worldExhaust.x,
            _worldExhaust.y,
            _worldExhaust.z,
            trainVx,
            trainVz,
            state.speedKmh,
            state.phase,
            temperatureC,
            weather,
            steamElapsed
          );
          if (temperatureC <= 10 || state.phase === 'departing') {
            bogieSideToggle = -bogieSideToggle;
            _localBogieVent.set(bogieSideToggle * 1.42, 0.92, 4.35);
            _worldBogieVent.copy(_localBogieVent).applyMatrix4(leadCar.matrixWorld);
            const sideVx = Math.cos(sLead.angle) * bogieSideToggle * 1.8;
            const sideVz = -Math.sin(sLead.angle) * bogieSideToggle * 1.8;
            stepTrainSteamPool(
              steamPool,
              0.09,
              _worldBogieVent.x,
              _worldBogieVent.y,
              _worldBogieVent.z,
              trainVx + sideVx,
              trainVz + sideVz,
              Math.max(12, state.speedKmh),
              state.phase,
              temperatureC,
              weather,
              steamElapsed + 0.05
            );
          }
        }
      }

      // In cold air or on station approach/departure, also release paired cylinder steam wisps from front bogie vents
      const emitFromBogie =
        (temperatureC <= 10 || state.phase === 'departing' || state.phase === 'approaching') &&
        steamPool.cursor % 3 === 0;
      let emitX = _worldExhaust.x;
      let emitY = _worldExhaust.y;
      let emitZ = _worldExhaust.z;
      let extraVx = 0;
      let extraVz = 0;
      if (emitFromBogie) {
        bogieSideToggle = -bogieSideToggle;
        _localBogieVent.set(bogieSideToggle * 1.42, 0.92, 4.35);
        _worldBogieVent.copy(_localBogieVent).applyMatrix4(leadCar.matrixWorld);
        emitX = _worldBogieVent.x;
        emitY = _worldBogieVent.y;
        emitZ = _worldBogieVent.z;
        extraVx = Math.cos(sLead.angle) * bogieSideToggle * 1.8;
        extraVz = -Math.sin(sLead.angle) * bogieSideToggle * 1.8;
      }

      steamElapsed += dt;
      const steamProfile = stepTrainSteamPool(
        steamPool,
        dt,
        emitX,
        emitY,
        emitZ,
        trainVx + extraVx,
        trainVz + extraVz,
        state.speedKmh,
        state.phase,
        temperatureC,
        weather,
        steamElapsed
      );

      void pixelRatio;
      steamMat.uniforms.uCoreColor.value.setHex(steamProfile.coreColorHex);
      steamMat.uniforms.uEdgeColor.value.setHex(steamProfile.edgeColorHex);
      steamMat.uniforms.uSkyTint.value.setHex(skyTintHex);

      const particles = steamPool.particles;
      for (let i = 0; i < STEAM_CAPACITY; i++) {
        const p = particles[i];
        if (!p.active) {
          steamAlphaArr[i] = 0;
          _steamDummy.position.set(0, -500, 0);
          _steamDummy.scale.set(0.001, 0.001, 0.001);
          _steamDummy.updateMatrix();
          steamMesh.setMatrixAt(i, _steamDummy.matrix);
          continue;
        }
        const lifeT = p.age / Math.max(0.05, p.maxAge);
        const fadeIn = Math.min(1, lifeT / 0.12);
        const fadeOut = 1 - lifeT * lifeT;
        const size = (p.startSize + (p.endSize - p.startSize) * Math.pow(lifeT, 0.68)) * 1.18;
        // Slightly oblate organic cloud puff proportions that billow as they rise
        _steamDummy.position.set(p.x, p.y, p.z);
        _steamDummy.rotation.set(p.rotation * 0.45, p.rotation, p.rotation * 0.3);
        _steamDummy.scale.set(size * 1.14, size * 0.88, size * 1.08);
        _steamDummy.updateMatrix();
        steamMesh.setMatrixAt(i, _steamDummy.matrix);

        steamAlphaArr[i] = Math.max(0, fadeIn * fadeOut * p.maxAlpha);
        steamTintArr[i] = Math.min(1, p.tintMix + lifeT * 0.65);
      }

      steamMesh.instanceMatrix.needsUpdate = true;
      steamAlphaAttr.needsUpdate = true;
      steamTintAttr.needsUpdate = true;
    }

    // Animate seated AI passengers when the player is riding or nearby (zero cost when train is far away!)
    if (isPlayerNearOrRiding) {
      passengerElapsed += dt;
      stepTrainPassengers(passengerStates, dt, timeHours, weather, season, passengerElapsed);

      for (let i = 0; i < passengerStates.length; i++) {
        const ps = passengerStates[i];
        const rig = passengerRigs[i];
        // Window is behind passenger's shoulder; turn smoothly sideways/toward window (+1 for left bench, -1 for right)
        const windowSign = rig.side === -1 ? 1 : -1;
        const breathe = Math.sin(ps.nodPhase * 1.45) * 0.015;

        // Torso gentle lean + twist toward window when gazing/weather-watching
        const windowTwist = Math.max(0, ps.headYaw - 0.35) * 0.44 * windowSign;
        rig.torsoPivot.rotation.y = windowTwist;
        rig.torsoPivot.rotation.x = ps.torsoLean + breathe;
        rig.torsoPivot.position.z =
          -0.02 - (ps.activity === 'weather_watching' ? 0.07 : ps.activity === 'window_gazing' ? 0.04 : 0);

        // Head turn (remaining yaw after torso twist) + pitch
        rig.headPivot.rotation.y = ps.headYaw * windowSign - windowTwist * 0.65;
        rig.headPivot.rotation.x = ps.headPitch;

        // Arms & held props (book or teacup)
        const readAmt = ps.bookRaise;
        const cupAmt = ps.cupRaise;
        const chatGesture =
          ps.activity === 'chatting' ? Math.sin(ps.nodPhase * 2.8) * 0.16 : 0;

        rig.leftArmPivot.rotation.x = -0.35 - readAmt * 0.68 - chatGesture;
        rig.leftArmPivot.rotation.z = 0.06 + readAmt * 0.14;

        rig.rightArmPivot.rotation.x =
          -0.35 - readAmt * (0.68 + ps.pageTurnPulse * 0.24) - cupAmt * 1.05 + chatGesture;
        rig.rightArmPivot.rotation.z = -0.06 - readAmt * 0.14 - cupAmt * 0.18;

        rig.bookGroup.visible = readAmt > 0.08;
        if (rig.bookGroup.visible) {
          const s = 0.45 + readAmt * 0.55;
          rig.bookGroup.scale.set(s, s, s);
          rig.bookGroup.position.y = 0.12 + readAmt * 0.13;
          rig.rightBookPage.rotation.z = -0.24 + ps.pageTurnPulse * 1.15;
        }

        rig.cupGroup.visible = cupAmt > 0.08;
        if (rig.cupGroup.visible) {
          const cs = 0.55 + cupAmt * 0.45;
          rig.cupGroup.scale.set(cs, cs, cs);
          // Keep cup upright while arm raises to sip
          rig.cupGroup.rotation.x = -rig.rightArmPivot.rotation.x * 0.72;
        }
      }
    }

    // Train brightness & interior/headlight illumination turn ON only at dark dusk/night OR inside Underground Metro Subway Tunnel!
    const inSubwayTunnel = sLead.gradeType === 'subway_tunnel' || sRear.gradeType === 'subway_tunnel';
    const nightBoost = Math.max(inSubwayTunnel ? 0.92 : 0, Math.max(0, Math.min(1, nightDarkness)));
    const duskRamp = Math.max(0, Math.min(1, (lanternStrength - 0.62) / 0.38));
    const nightTrainLight = Math.max(nightBoost, duskRamp * 0.72);

    interiorWallMat.emissiveIntensity = nightTrainLight * 1.15 + nightBoost * 0.55;
    ceilingGlowMat.emissiveIntensity = nightTrainLight * 2.4 + nightBoost * 1.4;
    glassMat.emissiveIntensity = nightTrainLight * 0.48 + nightBoost * 0.42;
    headlightMat.emissiveIntensity = 0.08 + nightTrainLight * 3.8 + nightBoost * 3.2;
    taillightMat.emissiveIntensity = 0.12 + nightTrainLight * 2.2 + nightBoost * 1.6;

    // Real 3D train lights stay OFF in bright daylight and shine warmly & brightly at night
    trainGlowLight.intensity = nightTrainLight * 6.5 + nightBoost * 5.0;
    rearGlowLight.intensity = nightTrainLight * 3.8 + nightBoost * 3.5;
    trainHeadlightSpot.intensity = nightTrainLight * 14.0 + nightBoost * 24.0;
    trainHeadlightFill.intensity = nightTrainLight * 4.2 + nightBoost * 6.0;

    // Volumetric headlight beams, lens halos & trackside warm window light pools appear at night
    const beamOpacity = Math.max(0, nightTrainLight * 0.16 + nightBoost * 0.24);
    headlightBeamUniforms.uOpacity.value = beamOpacity;
    const showBeams = beamOpacity > 0.01;
    for (let i = 0; i < headlightBeams.length; i++) {
      headlightBeams[i].visible = showBeams;
    }

    const haloOpacity = Math.max(0, nightTrainLight * 0.34 + nightBoost * 0.58);
    lensHaloUniforms.uOpacity.value = haloOpacity;
    for (let i = 0; i < lensHalos.length; i++) {
      lensHalos[i].visible = haloOpacity > 0.01;
    }

    const spillOpacity = Math.max(nightTrainLight * 0.14, nightBoost * 0.34);
    windowSpillUniforms.uOpacity.value = spillOpacity;
    for (let i = 0; i < windowSpills.length; i++) {
      windowSpills[i].visible = spillOpacity > 0.01;
    }
  };

  return {
    group,
    leadCar,
    getWindowSeatTransform,
    getDriverCabTransform,
    getCabinWalkTransform,
    getCompanionSeatTransform,
    getExteriorAnchor,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.remove(group);
    },
  };
}
