import * as THREE from 'three';
import { BUS_STOPS, SOVEREIGN_SHORE_BERTH, sampleBusRoad } from '../game/vehicles';
import { WATER_LEVEL, groundHeightAt, isOceanAt } from '../game/terrain';
import type { BoatId, BoatState, BusState, InteractableItem } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface VehiclesWorldSystem {
  group: THREE.Group;
  interactables: InteractableItem[];
  syncBus: (bus: BusState, time: number, lanternStrength: number) => void;
  getBusWindowSeatTransform: () => { position: THREE.Vector3; lookAt: THREE.Vector3 };
  getBusDriverCabTransform: () => { position: THREE.Vector3; lookAt: THREE.Vector3 };
  getBusExteriorAnchor: () => THREE.Vector3;
  getBusCompanionSeatTransform: () => { position: THREE.Vector3; heading: number };
  syncBoats: (boats: BoatState[], time: number) => void;
  getBoatPlayerTransform: (boatId: BoatId) => { position: THREE.Vector3; heading: number };
  getBoatCompanionBowTransform: (boatId: BoatId) => { position: THREE.Vector3; heading: number };
  getBoatBowFpvTransform: (boatId: BoatId) => { position: THREE.Vector3; lookAt: THREE.Vector3 };
  dispose: () => void;
}

/**
 * Builds the Dreamline Rural Bus, 4 Roadside Bus Stop Shelters, Subtle Country Road Ribbon,
 * and 2 Drivable Wooden/Blue Boats (Neelam Lake Rowboat + Kadalkarai Harbour Boat).
 */
export function buildVehiclesWorld(textures: ProceduralTextureSet): VehiclesWorldSystem {
  const group = new THREE.Group();
  const interactables: InteractableItem[] = [];

  // =========================================================================
  // 1. COUNTRYSIDE ROAD RIBBON & 4 RURAL BUS STOP SHELTERS
  // =========================================================================
  const roadSamples = 260;
  const roadVerts: number[] = [];
  const roadIndices: number[] = [];
  const roadHalfW = 2.85;
  const causewayPierMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.78 });
  const causewayRailMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.45, metalness: 0.35 });
  const causewayLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffcf77,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  for (let i = 0; i <= roadSamples; i++) {
    const s = sampleBusRoad(i / roadSamples);
    const nx = -s.tz;
    const nz = s.tx;
    const lx = s.x - nx * roadHalfW;
    const lz = s.z - nz * roadHalfW;
    const rx = s.x + nx * roadHalfW;
    const rz = s.z + nz * roadHalfW;
    const overSea = isOceanAt(s.x, s.z);
    const ly = overSea ? 0.44 : Math.max(0.18, groundHeightAt(lx, lz) + 0.055);
    const ry = overSea ? 0.44 : Math.max(0.18, groundHeightAt(rx, rz) + 0.055);
    roadVerts.push(lx, ly, lz, rx, ry, rz);
    if (i < roadSamples) {
      const base = i * 2;
      roadIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }

    // Build concrete support piers, guardrails & street lamps along the Ocean Highway Causeway Bridge
    if (overSea && i % 4 === 0) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 0.9), causewayPierMat);
      pier.position.set(s.x, -1.2, s.z);
      pier.rotation.y = s.angle;
      group.add(pier);

      for (const side of [-1, 1]) {
        const gx = s.x + nx * (roadHalfW + 0.12) * side;
        const gz = s.z + nz * (roadHalfW + 0.12) * side;
        const railSeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 7.6), causewayRailMat);
        railSeg.position.set(gx, 0.84, gz);
        railSeg.rotation.y = s.angle;
        group.add(railSeg);
      }

      if (i % 12 === 0) {
        const lampX = s.x + nx * (roadHalfW + 0.2) * 1;
        const lampZ = s.z + nz * (roadHalfW + 0.2) * 1;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.2, 6), causewayRailMat);
        post.position.set(lampX, 2.5, lampZ);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.24), causewayLampMat);
        bulb.position.set(lampX - nx * 0.35, 4.55, lampZ - nz * 0.35);
        group.add(post, bulb);
      }
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();
  const roadMesh = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({ color: 0x5c606a, roughness: 0.88 })
  );
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Wooden Bus Stop Shelters at each stop
  const shelterWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.8,
    color: 0x8d674d,
  });
  const signTealMat = new THREE.MeshStandardMaterial({ color: 0x2f7578, roughness: 0.5 });

  for (const stop of BUS_STOPS) {
    const sy = groundHeightAt(stop.stopX, stop.stopZ);
    const sh = new THREE.Group();
    sh.position.set(stop.stopX, sy, stop.stopZ);
    sh.rotation.y = stop.tangentAngle + Math.PI;

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.3, 0.14), shelterWoodMat);
    backWall.position.set(0, 1.15, -0.7);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 1.85), signTealMat);
    roof.position.set(0, 2.38, 0.05);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.52), shelterWoodMat);
    bench.position.set(0, 0.32, -0.3);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), signTealMat);
    pole.position.set(2.05, 1.3, 0.4);
    const signHead = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), signTealMat);
    signHead.rotation.x = Math.PI / 2;
    signHead.position.set(2.05, 2.5, 0.4);

    sh.add(backWall, roof, bench, pole, signHead);
    group.add(sh);
  }

  // =========================================================================
  // 2. DREAMLINE RURAL BUS (கிராமப் பேருந்து)
  // =========================================================================
  const busGroup = new THREE.Group();
  const busCreamMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.48 });
  const busTealMat = new THREE.MeshStandardMaterial({ color: 0x2c7873, roughness: 0.45 });
  const busTrimMat = new THREE.MeshStandardMaterial({ color: 0xd98a4a, roughness: 0.5 });
  const busWindowMat = new THREE.MeshStandardMaterial({
    color: 0xa7cfdf,
    emissive: 0xffd088,
    emissiveIntensity: 0.2,
    roughness: 0.15,
    metalness: 0.25,
    transparent: true,
    opacity: 0.72,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x222328, roughness: 0.9 });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d0,
    emissive: 0xffe4a0,
    emissiveIntensity: 1.2,
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xd9453b,
    emissive: 0xff3b30,
    emissiveIntensity: 0.85,
  });

  // Lower teal chassis + upper cream body + roof
  const busLower = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.05, 7.4), busTealMat);
  busLower.position.y = 1.02;
  busLower.castShadow = true;
  const busStripe = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.18, 7.42), busTrimMat);
  busStripe.position.y = 1.56;
  const busUpper = new THREE.Mesh(new THREE.BoxGeometry(2.32, 1.12, 7.25), busCreamMat);
  busUpper.position.y = 2.18;
  busUpper.castShadow = true;
  const busRoof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 6.9), busCreamMat);
  busRoof.position.y = 2.82;
  busGroup.add(busLower, busStripe, busUpper, busRoof);

  // Side windows + front windshield
  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.82, 5.6), busWindowMat);
  sideGlass.position.set(0, 2.15, -0.1);
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.88, 0.12), busWindowMat);
  frontGlass.position.set(0, 2.15, 3.63);
  busGroup.add(sideGlass, frontGlass);

  // Animated sliding passenger door on the right (+X) side
  const busDoor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.95), busTrimMat);
  busDoor.position.set(1.18, 1.48, 2.45);
  busGroup.add(busDoor);

  // Headlights & Taillights
  for (const lx of [-0.78, 0.78]) {
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), headlightMat);
    hl.rotation.x = Math.PI / 2;
    hl.position.set(lx, 0.92, 3.72);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.08), taillightMat);
    tl.position.set(lx, 0.95, -3.72);
    busGroup.add(hl, tl);
  }

  // Spinning wheels
  const busWheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [wx, wz] of [
    [-1.15, 2.35],
    [1.15, 2.35],
    [-1.15, -2.25],
    [1.15, -2.25],
  ]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, 0.46, wz);
    busGroup.add(w);
    busWheels.push(w);
  }
  group.add(busGroup);

  let busWheelAngle = 0;

  const syncBus = (bus: BusState, _time: number, lanternStrength: number) => {
    const by = groundHeightAt(bus.worldX, bus.worldZ) + 0.06;
    busGroup.position.set(bus.worldX, by, bus.worldZ);
    busGroup.rotation.y = bus.heading;

    busDoor.position.z = 2.45 - bus.doorOpen * 0.75;
    busWheelAngle += (bus.speedKmh / 3.6) * 0.04;
    for (const w of busWheels) w.rotation.x = busWheelAngle;

    busWindowMat.emissiveIntensity = 0.18 + lanternStrength * 1.1;
    headlightMat.emissiveIntensity = 0.65 + lanternStrength * 1.5;
  };

  const getBusWindowSeatTransform = () => {
    const localPos = new THREE.Vector3(0.76, 2.08, 0.6);
    const localLook = new THREE.Vector3(10.0, 1.9, 5.0);
    busGroup.updateMatrixWorld();
    return {
      position: localPos.applyMatrix4(busGroup.matrixWorld),
      lookAt: localLook.applyMatrix4(busGroup.matrixWorld),
    };
  };

  const getBusDriverCabTransform = () => {
    // Crisp forward bus driver cockpit view right behind the wide front windshield
    const localPos = new THREE.Vector3(-0.48, 2.18, 2.95);
    const localLook = new THREE.Vector3(-0.32, 1.95, 18.0);
    busGroup.updateMatrixWorld();
    return {
      position: localPos.applyMatrix4(busGroup.matrixWorld),
      lookAt: localLook.applyMatrix4(busGroup.matrixWorld),
    };
  };

  const getBusExteriorAnchor = () => {
    const localPos = new THREE.Vector3(0, 1.8, 0);
    busGroup.updateMatrixWorld();
    return localPos.applyMatrix4(busGroup.matrixWorld);
  };

  const getBusCompanionSeatTransform = () => {
    const localPos = new THREE.Vector3(-0.62, 1.25, 0.55);
    busGroup.updateMatrixWorld();
    return {
      position: localPos.applyMatrix4(busGroup.matrixWorld),
      heading: busGroup.rotation.y,
    };
  };

  // =========================================================================
  // 3. FOUR DRIVABLE BOATS:
  //    - Neelam Lake Rowboat + Kadalkarai Harbour Boat
  //    - Boat 1: Bamboo Catamaran Sail Raft (Polynesian Craft)
  //    - Boat 2: Tribal Survival Outrigger Canoe (with Bow Spars, Axe & Paddle Wheel)
  // =========================================================================
  interface BoatVisual {
    id: BoatId;
    root: THREE.Group;
    leftOar?: THREE.Group;
    rightOar?: THREE.Group;
    sailGeo?: THREE.PlaneGeometry;
    flagGeo?: THREE.PlaneGeometry;
    paddleWheel?: THREE.Group;
    wake: THREE.Mesh;
    playerLocalPos: THREE.Vector3;
    companionLocalPos: THREE.Vector3;
    fpvLocalPos: THREE.Vector3;
    fpvLocalLook: THREE.Vector3;
  }

  const boatVisuals: Record<BoatId, BoatVisual> = {} as Record<BoatId, BoatVisual>;

  const makeWakeMesh = (zOffset: number, widthScale = 1.0) => {
    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xeaf8ff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const wake = new THREE.Mesh(new THREE.ConeGeometry(1.35 * widthScale, 4.8, 3), wakeMat);
    wake.rotation.x = Math.PI / 2;
    wake.position.set(0, 0.06, zOffset);
    return wake;
  };

  const makeRowboatMesh = (id: 'lake_boat' | 'coastal_boat', hullHex: number) => {
    const root = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: hullHex, roughness: 0.62 });
    const gunwaleMat = new THREE.MeshStandardMaterial({ color: 0xc2935c, roughness: 0.7 });
    const insideWoodMat = new THREE.MeshStandardMaterial({ color: 0x996d46, roughness: 0.78 });

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 3.8), hullMat);
    bottom.position.y = 0.08;
    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 3.9), hullMat);
    leftSide.position.set(-0.72, 0.34, 0);
    leftSide.rotation.z = 0.16;
    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 3.9), hullMat);
    rightSide.position.set(0.72, 0.34, 0);
    rightSide.rotation.z = -0.16;

    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.84, 1.15, 4), hullMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.scale.set(0.95, 1.0, 0.56);
    bow.position.set(0, 0.34, 2.32);

    const stern = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.54, 0.16), hullMat);
    stern.position.set(0, 0.34, -1.92);

    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 4.0), gunwaleMat);
    trimL.position.set(-0.77, 0.62, 0);
    const trimR = trimL.clone();
    trimR.position.x = 0.77;

    const midBench = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 0.48), insideWoodMat);
    midBench.position.set(0, 0.42, -0.35);
    const bowDeck = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.08, 0.95), insideWoodMat);
    bowDeck.position.set(0, 0.36, 1.25);
    root.add(bottom, leftSide, rightSide, bow, stern, trimL, trimR, midBench, bowDeck);

    const makeOar = (side: -1 | 1) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.76, 0.62, -0.25);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 2.1, 6), gunwaleMat);
      shaft.rotation.z = side * (Math.PI / 2 - 0.32);
      shaft.position.set(side * 0.78, -0.18, 0);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.16), gunwaleMat);
      blade.position.set(side * 1.65, -0.5, 0);
      pivot.add(shaft, blade);
      return pivot;
    };
    const leftOar = makeOar(-1);
    const rightOar = makeOar(1);
    const wake = makeWakeMesh(-4.1, 1.0);
    root.add(leftOar, rightOar, wake);

    group.add(root);
    boatVisuals[id] = {
      id,
      root,
      leftOar,
      rightOar,
      wake,
      playerLocalPos: new THREE.Vector3(0, 0.46, -0.35),
      companionLocalPos: new THREE.Vector3(0, 0.42, 1.28),
      fpvLocalPos: new THREE.Vector3(0, 1.48, 0.25),
      fpvLocalLook: new THREE.Vector3(0, 1.2, 14.0),
    };
  };

  // Procedural tropical emblem flag & woven mat textures for Catamaran
  const makeTropicalFlagTex = () => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#2eab27';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(115, 64, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(85, 76);
      ctx.quadraticCurveTo(115, 35, 148, 56);
      ctx.quadraticCurveTo(125, 88, 85, 76);
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  };

  const makeWovenMatTex = () => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#3f7d20';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#539e2b';
      for (let y = 0; y < 128; y += 8) {
        for (let x = 0; x < 128; x += 8) {
          ctx.fillRect(x, y, (x + y) % 16 === 0 ? 7 : 4, (x + y) % 16 === 0 ? 4 : 7);
        }
      }
    }
    return new THREE.CanvasTexture(c);
  };

  // BOAT 1: BAMBOO CATAMARAN SAIL RAFT (Polynesian Craft from user's attached HTML, rotated so bow faces +Z)
  const makeBambooCatamaranMesh = () => {
    const root = new THREE.Group();
    const hull = new THREE.Group();
    hull.rotation.y = Math.PI; // Original HTML had bow at -Z; rotate PI so bow faces +Z!
    hull.scale.setScalar(0.84);
    root.add(hull);

    const bambooMat = new THREE.MeshStandardMaterial({ color: 0xa67038, roughness: 0.72, metalness: 0.05 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.8 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd6b57c, roughness: 0.9 });
    const bluePontoonMat = new THREE.MeshStandardMaterial({ color: 0x1d5bbf, roughness: 0.45, metalness: 0.08 });
    const pontoonTipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });

    // Twin Blue Curved Pontoons
    for (const xOffset of [-2.25, 2.25]) {
      const pg = new THREE.Group();
      pg.position.set(xOffset, 0.08, 0);
      const bodyGeo = new THREE.CylinderGeometry(0.36, 0.36, 6.6, 12);
      bodyGeo.rotateX(Math.PI / 2);
      pg.add(new THREE.Mesh(bodyGeo, bluePontoonMat));

      const bowGeo = new THREE.ConeGeometry(0.36, 1.5, 12);
      bowGeo.rotateX(-Math.PI / 2);
      const bow = new THREE.Mesh(bowGeo, bluePontoonMat);
      bow.position.set(0, 0.12, -3.95);
      bow.rotation.x = 0.18;
      pg.add(bow);

      const sternGeo = new THREE.ConeGeometry(0.36, 1.2, 12);
      sternGeo.rotateX(Math.PI / 2);
      const stern = new THREE.Mesh(sternGeo, bluePontoonMat);
      stern.position.set(0, 0.06, 3.85);
      stern.rotation.x = -0.12;
      pg.add(stern);

      for (const zPos of [-2.2, 0, 2.2]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.365, 0.035, 6, 14), pontoonTipMat);
        band.position.z = zPos;
        pg.add(band);
      }
      hull.add(pg);
    }

    // Crossbeams (Akas) + Rope Knots
    const crossZ = [-2.6, -0.9, 0.9, 2.6];
    const beamGeo = new THREE.CylinderGeometry(0.11, 0.11, 5.2, 8);
    beamGeo.rotateZ(Math.PI / 2);
    const strutGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.45, 7);
    const knotGeo = new THREE.TorusGeometry(0.14, 0.045, 6, 10);
    knotGeo.rotateY(Math.PI / 4);
    for (const zPos of crossZ) {
      const beam = new THREE.Mesh(beamGeo, darkWoodMat);
      beam.position.set(0, 0.42, zPos);
      hull.add(beam);
      for (const xPos of [-2.25, 2.25]) {
        const strut = new THREE.Mesh(strutGeo, darkWoodMat);
        strut.position.set(xPos, 0.24, zPos);
        const knot = new THREE.Mesh(knotGeo, ropeMat);
        knot.position.set(xPos, 0.42, zPos);
        hull.add(strut, knot);
      }
    }

    // 15 Bamboo Deck Poles
    for (let i = 0; i < 15; i++) {
      const xPos = -1.96 + i * (3.92 / 14);
      const poleLen = 6.2 + Math.sin(i * 1.7) * 0.25;
      const poleGeo = new THREE.CylinderGeometry(0.095, 0.095, poleLen, 8);
      poleGeo.rotateX(Math.PI / 2);
      const pole = new THREE.Mesh(poleGeo, bambooMat);
      pole.position.set(xPos, 0.56, 0);
      hull.add(pole);
    }

    // Woven Pandanus Green Leaf Mat + Stern Bench + Steering Oar
    const leafMat = new THREE.MeshStandardMaterial({ map: makeWovenMatTex(), roughness: 0.85 });
    const greenMatMesh = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.05, 1.55), leafMat);
    greenMatMesh.position.set(0.65, 0.66, 2.05);
    greenMatMesh.rotation.y = -0.06;
    const sternBox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 0.62), darkWoodMat);
    sternBox.position.set(1.35, 0.72, 2.55);
    hull.add(greenMatMesh, sternBox);

    const oarGroup = new THREE.Group();
    oarGroup.position.set(1.45, 0.75, 2.75);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 3.2, 6), darkWoodMat);
    shaft.rotation.x = 0.72;
    shaft.rotation.z = -0.15;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.04), darkWoodMat);
    blade.position.set(0.15, -0.95, 1.05);
    blade.rotation.x = 0.72;
    oarGroup.add(shaft, blade);
    hull.add(oarGroup);

    // Tall Mast + Coiled Rope Base + Bamboo Boom
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 6.6, 10), darkWoodMat);
    mast.position.set(0, 3.86, -0.65);
    mast.rotation.z = -0.03;
    hull.add(mast);

    for (let c = 0; c < 4; c++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.24 - c * 0.02, 0.045, 6, 12), ropeMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0, 0.64 + c * 0.06, -0.65);
      hull.add(coil);
    }

    const boomGeo = new THREE.CylinderGeometry(0.045, 0.06, 3.8, 6);
    boomGeo.rotateX(Math.PI / 2);
    const boom = new THREE.Mesh(boomGeo, bambooMat);
    boom.position.set(0, 1.55, 1.05);
    boom.rotation.x = -0.22;
    hull.add(boom);

    // Dynamic Triangular Cream Sail
    const sailGeo = new THREE.PlaneGeometry(3.4, 5.2, 10, 12);
    const posAttr = sailGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const normY = (y + 2.6) / 5.2;
      const x = posAttr.getX(i);
      const widthAtY = 3.3 * (1.0 - normY * 0.88);
      const u = (x + 1.7) / 3.4;
      posAttr.setXYZ(i, u * widthAtY, y + u * (1.0 - normY) * 0.55, 0);
    }
    sailGeo.computeVertexNormals();
    const sailMesh = new THREE.Mesh(
      sailGeo,
      new THREE.MeshStandardMaterial({ color: 0xf5ebd6, roughness: 0.65, side: THREE.DoubleSide })
    );
    sailMesh.rotation.y = -Math.PI / 2;
    sailMesh.position.set(0, 3.65, -0.62);
    hull.add(sailMesh);

    // Waving Green & Gold Tropical Emblem Flag
    const flagGeo = new THREE.PlaneGeometry(1.35, 0.72, 8, 4);
    const fPos = flagGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fPos.count; i++) fPos.setX(i, fPos.getX(i) + 0.675);
    flagGeo.computeVertexNormals();
    const flagMesh = new THREE.Mesh(
      flagGeo,
      new THREE.MeshStandardMaterial({ map: makeTropicalFlagTex(), roughness: 0.5, side: THREE.DoubleSide })
    );
    flagMesh.rotation.y = -Math.PI / 2;
    flagMesh.position.set(0, 6.72, -0.65);
    hull.add(flagMesh);

    // Taut Rigging Stays
    const mastTop = new THREE.Vector3(0, 6.3, -0.65);
    for (const pt of [
      new THREE.Vector3(-2.1, 0.58, -2.55),
      new THREE.Vector3(2.1, 0.58, -2.55),
      new THREE.Vector3(0, 1.95, 2.75),
    ]) {
      const dist = mastTop.distanceTo(pt);
      const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, dist, 5), ropeMat);
      stay.position.copy(mastTop).add(pt).multiplyScalar(0.5);
      stay.lookAt(pt);
      stay.rotateX(Math.PI / 2);
      hull.add(stay);
    }

    const wake = makeWakeMesh(-4.8, 1.55);
    root.add(wake);
    group.add(root);

    boatVisuals.bamboo_catamaran = {
      id: 'bamboo_catamaran',
      root,
      sailGeo,
      flagGeo,
      wake,
      playerLocalPos: new THREE.Vector3(-0.55, 0.68, -1.65),
      companionLocalPos: new THREE.Vector3(0.75, 0.64, 0.95),
      fpvLocalPos: new THREE.Vector3(-0.45, 1.75, -1.35),
      fpvLocalLook: new THREE.Vector3(0, 1.25, 16.0),
    };
  };

  // BOAT 2: TRIBAL SURVIVAL OUTRIGGER CANOE (From user's attached HTML, rotated so bow faces +Z)
  const makeTribalOutriggerMesh = () => {
    const root = new THREE.Group();
    const hull = new THREE.Group();
    hull.rotation.y = Math.PI; // Original HTML had bow at -Z; rotate PI so bow faces +Z!
    hull.scale.setScalar(0.84);
    root.add(hull);

    const hullWoodMat = new THREE.MeshStandardMaterial({
      map: textures.woodAlbedo,
      color: 0xa47448,
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    const weatheredTimberMat = new THREE.MeshStandardMaterial({ color: 0x6e4b2a, roughness: 0.85 });
    const darkRopeMat = new THREE.MeshStandardMaterial({ color: 0x3b2818, roughness: 0.92 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.82 });
    const tribalAccentMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const sackMat = new THREE.MeshStandardMaterial({ color: 0x9ca38f, roughness: 0.9 });

    // Pointed Planked Canoe Hull with flared gunwales
    const hullGeo = new THREE.PlaneGeometry(2.4, 8.4, 10, 20);
    hullGeo.rotateX(-Math.PI / 2);
    const hPos = hullGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < hPos.count; i++) {
      const x = hPos.getX(i);
      const z = hPos.getZ(i);
      const normZ = z / 4.2;
      let wf = 1.0 - Math.pow(Math.abs(normZ), 1.65);
      if (normZ < 0) wf = Math.pow(1.0 + normZ, 0.85);
      wf = Math.max(0.03, wf);
      const edgeRatio = Math.abs(x) / 1.2;
      const y = Math.pow(edgeRatio, 2.2) * 0.82 + Math.pow(Math.abs(normZ), 2.4) * 0.38;
      hPos.setXYZ(i, x * wf, y, z);
    }
    hullGeo.computeVertexNormals();
    const hullMesh = new THREE.Mesh(hullGeo, hullWoodMat);
    hullMesh.position.y = 0.05;
    hull.add(hullMesh);

    // Slatted Floorboards
    const floorGeo = new THREE.PlaneGeometry(1.5, 5.8, 6, 12);
    floorGeo.rotateX(-Math.PI / 2);
    const flPos = floorGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < flPos.count; i++) {
      const normZ = flPos.getZ(i) / 3.4;
      flPos.setX(i, flPos.getX(i) * Math.max(0.08, 1.0 - Math.pow(Math.abs(normZ), 1.4)));
    }
    floorGeo.computeVertexNormals();
    const floorMesh = new THREE.Mesh(floorGeo, hullWoodMat);
    floorMesh.position.set(0, 0.34, 0.15);
    hull.add(floorMesh);

    // Carved Gunwale Rails
    for (const side of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 14; s++) {
        const z = -4.15 + (s / 14) * 8.3;
        const normZ = z / 4.2;
        let wf = 1.0 - Math.pow(Math.abs(normZ), 1.65);
        if (normZ < 0) wf = Math.pow(1.0 + normZ, 0.85);
        pts.push(new THREE.Vector3(side * 1.18 * Math.max(0.02, wf), 0.85 + Math.pow(Math.abs(normZ), 2.4) * 0.38, z));
      }
      hull.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.085, 7, false), weatheredTimberMat));
    }

    // Forward & Rear Benches
    const fwdBench = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.09, 0.42), hullWoodMat);
    fwdBench.position.set(0, 0.68, -1.85);
    const rearBench = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.1, 0.48), hullWoodMat);
    rearBench.position.set(0, 0.72, 1.65);
    hull.add(fwdBench, rearBench);

    // Iconic Lashed Crossed Bow Spars & Slack Catenary Ropes
    const bowSpars = new THREE.Group();
    bowSpars.position.set(0, 1.05, -3.55);
    const sparGeo = new THREE.CylinderGeometry(0.045, 0.065, 1.65, 7);
    const sparL = new THREE.Mesh(sparGeo, weatheredTimberMat);
    sparL.rotation.set(-0.28, 0, -0.36);
    sparL.position.set(-0.08, 0.35, -0.1);
    const sparR = new THREE.Mesh(sparGeo, weatheredTimberMat);
    sparR.rotation.set(-0.35, 0, 0.25);
    sparR.position.set(0.08, 0.3, -0.12);
    const centerPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.35, 7), weatheredTimberMat);
    centerPost.position.set(0, 0.15, -0.25);
    centerPost.rotation.x = -0.18;
    bowSpars.add(sparL, sparR, centerPost);
    for (let r = 0; r < 4; r++) {
      const knot = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 10), darkRopeMat);
      knot.position.set(0, 0.22 + r * 0.05, -0.15);
      knot.rotation.x = Math.PI / 3;
      bowSpars.add(knot);
    }
    hull.add(bowSpars);

    for (const dir of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.35, -3.68),
        new THREE.Vector3(dir * 1.35, 0.92, -2.55),
        new THREE.Vector3(dir * 2.55, 1.05, -1.25),
      ]);
      hull.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.025, 5, false), darkRopeMat));
    }

    // Crafted Iron-Headed Survival Axe Mounted on Starboard Gunwale
    const axeGroup = new THREE.Group();
    axeGroup.position.set(0.88, 0.92, -1.55);
    axeGroup.rotation.set(0.18, -0.35, -0.12);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.045, 1.15, 8), weatheredTimberMat);
    handle.position.y = 0.25;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.26), ironMat);
    collar.position.set(0, 0.68, 0.02);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.28), ironMat);
    blade.position.set(0, 0.64, -0.16);
    axeGroup.add(handle, collar, blade);
    hull.add(axeGroup);

    // Side Outrigger Stabilizer Floats & Curved Booms
    for (const side of [-1, 1]) {
      for (const zBoom of [-1.25, 1.35]) {
        const bCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.95, 0.78, zBoom),
          new THREE.Vector3(side * 1.85, 0.86, zBoom),
          new THREE.Vector3(side * 2.55, 0.32, zBoom),
        ]);
        hull.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 10, 0.065, 6, false), weatheredTimberMat));
      }
      const fg = new THREE.Group();
      fg.position.set(side * 2.55, 0.18, 0.05);
      const logGeo = new THREE.CylinderGeometry(0.22, 0.22, 4.2, 10);
      logGeo.rotateX(Math.PI / 2);
      fg.add(new THREE.Mesh(logGeo, weatheredTimberMat));
      const tipF = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 10), tribalAccentMat);
      tipF.rotation.x = -Math.PI / 2;
      tipF.position.z = -2.55;
      const tipB = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 10), weatheredTimberMat);
      tipB.rotation.x = Math.PI / 2;
      tipB.position.z = 2.45;
      fg.add(tipF, tipB);
      hull.add(fg);

      // Tribal amber side trim
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 3.2), tribalAccentMat);
      trim.position.set(side * 1.08, 0.65, 0.3);
      hull.add(trim);
    }

    // Cargo Sacks
    for (const sp of [
      { x: -0.35, y: 0.55, z: -0.6, s: 0.34 },
      { x: 0.42, y: 0.52, z: 0.45, s: 0.38 },
      { x: -0.45, y: 0.58, z: 2.45, s: 0.36 },
    ]) {
      const sack = new THREE.Mesh(new THREE.DodecahedronGeometry(sp.s, 0), sackMat);
      sack.scale.set(1.1, 0.75, 1.25);
      sack.position.set(sp.x, sp.y, sp.z);
      hull.add(sack);
    }

    // Rear Rotating Paddle-Wheel Thruster
    const paddleWheel = new THREE.Group();
    paddleWheel.position.set(0, 0.42, 4.15);
    const pwHub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.65, 8), ironMat);
    pwHub.rotation.z = Math.PI / 2;
    paddleWheel.add(pwHub);
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.45), weatheredTimberMat);
      p.position.set(0, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
      p.rotation.x = a;
      paddleWheel.add(p);
    }
    hull.add(paddleWheel);

    const wake = makeWakeMesh(-4.9, 1.45);
    root.add(wake);
    group.add(root);

    boatVisuals.tribal_outrigger = {
      id: 'tribal_outrigger',
      root,
      paddleWheel,
      wake,
      playerLocalPos: new THREE.Vector3(0, 0.65, -1.3),
      companionLocalPos: new THREE.Vector3(0, 0.62, 1.55),
      fpvLocalPos: new THREE.Vector3(0, 1.38, 0.38),
      fpvLocalLook: new THREE.Vector3(0, 1.05, 15.0),
    };
  };

  // BOAT 3: SOVEREIGN OF THE TIDES — 3-Masted Historical Wooden Sailing Ship (from user's attached blueprint)
  const makeSovereignShipMesh = () => {
    const root = new THREE.Group();
    const ship = new THREE.Group();
    ship.scale.setScalar(0.46); // Grand ocean-scale proportions (~18.5m long x 15m tall masts)
    root.add(ship);

    const oakDark = new THREE.MeshStandardMaterial({
      map: textures.woodAlbedo,
      color: 0x4c2d17,
      roughness: 0.84,
      side: THREE.DoubleSide,
    });
    const oakTrim = new THREE.MeshStandardMaterial({
      map: textures.woodAlbedo,
      color: 0x6f4324,
      roughness: 0.78,
    });
    const deckWood = new THREE.MeshStandardMaterial({
      map: textures.woodAlbedo,
      color: 0xa2774c,
      roughness: 0.82,
    });
    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xd9a84e,
      roughness: 0.36,
      metalness: 0.72,
    });
    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0xf4ead6,
      roughness: 0.88,
      side: THREE.DoubleSide,
    });
    const sternGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffe4a8,
      emissive: 0xffb347,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x3b2c1d, roughness: 0.92 });
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    // Sculpted lofted wooden hull (bow pointing toward +Z)
    const hullGeo = new THREE.BoxGeometry(9.2, 5.2, 34.0, 10, 6, 22);
    const hPos = hullGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < hPos.count; i++) {
      let x = hPos.getX(i);
      let y = hPos.getY(i);
      const z = hPos.getZ(i);
      const zn = z / 17.0; // -1 stern .. +1 bow
      const yn = (y + 2.6) / 5.2; // 0 keel .. 1 bulwark
      let widthFactor = 1.0;
      if (zn > 0.15) {
        widthFactor = Math.max(0.06, Math.cos(((zn - 0.15) / 0.85) * Math.PI * 0.49));
      } else if (zn < -0.55) {
        widthFactor = 1.0 - Math.pow((-0.55 - zn) / 0.45, 1.5) * 0.28;
      }
      // Taper keel narrower at bottom, flare gracefully upward
      const keelTaper = 0.46 + 0.54 * Math.pow(yn, 0.55);
      x *= widthFactor * keelTaper;
      // Sheer curve rising at bow & stern quarterdeck
      const sheer = (zn > 0 ? Math.pow(zn, 2.2) * 1.65 : Math.pow(-zn, 2.0) * 2.25) * yn;
      y += sheer;
      hPos.setXYZ(i, x, y, z);
    }
    hullGeo.computeVertexNormals();
    const hullMesh = new THREE.Mesh(hullGeo, oakDark);
    hullMesh.position.y = 2.0;
    hullMesh.castShadow = true;
    ship.add(hullMesh);

    // Main Deck + Raised Stern Quarterdeck & Poop Cabin
    const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 24.5), deckWood);
    mainDeck.position.set(0, 4.45, 0.2);
    const quarterDeck = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.4, 9.2), oakTrim);
    quarterDeck.position.set(0, 5.4, -11.4);
    const sternTransom = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.6, 0.55), oakTrim);
    sternTransom.position.set(0, 5.4, -16.2);
    ship.add(mainDeck, quarterDeck, sternTransom);

    // Glowing Captain's Stern Gallery Windows + Gold Ornate Trim + Stern Lanterns
    for (let w = -2; w <= 2; w++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.2), sternGlassMat);
      win.position.set(w * 1.15, 5.75, -16.48);
      ship.add(win);
    }
    const sternBar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 0.65), goldTrim);
    sternBar.position.set(0, 7.2, -16.2);
    ship.add(sternBar);
    for (const lx of [-1.8, 0, 1.8]) {
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.85, 6), sternGlassMat);
      lantern.position.set(lx, 7.85, -16.35);
      ship.add(lantern);
    }

    // Gold Hull Wales & Gunport Accents along both sides
    for (const side of [-1, 1]) {
      const wale = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 23.0), goldTrim);
      wale.position.set(side * 4.45, 3.8, -0.5);
      ship.add(wale);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 22.0), oakTrim);
      rail.position.set(side * 4.15, 5.1, -0.4);
      ship.add(rail);
    }

    // Curved Bowsprit Spar & Twin Triangular Jib Sails
    const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 12.5, 8), oakTrim);
    bowsprit.rotation.x = Math.PI * 0.37;
    bowsprit.position.set(0, 6.9, 20.6);
    ship.add(bowsprit);

    const jibShape = new THREE.Shape();
    jibShape.moveTo(0, 0);
    jibShape.lineTo(0, 8.5);
    jibShape.lineTo(7.4, 0.8);
    jibShape.closePath();
    const jibGeo = new THREE.ShapeGeometry(jibShape);
    jibGeo.rotateY(-Math.PI / 2);
    const jib1 = new THREE.Mesh(jibGeo, canvasMat);
    jib1.position.set(0, 6.8, 17.5);
    ship.add(jib1);

    // Three Towering Masts (Fore, Main, Mizzen) with Fighting Tops, Yards, Billowing Square Sails & Shrouds
    const mastConfigs = [
      { z: 8.8, height: 22.0, sailW: 9.8, yards: [11.5, 17.5, 22.0] },
      { z: -0.6, height: 26.5, sailW: 11.4, yards: [12.8, 19.6, 25.4] },
      { z: -9.8, height: 19.5, sailW: 8.2, yards: [11.2, 16.6] },
    ];
    for (const mc of mastConfigs) {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.44, mc.height, 10),
        oakTrim
      );
      mast.position.set(0, 4.4 + mc.height * 0.5, mc.z);
      mast.castShadow = true;
      ship.add(mast);

      // Crow's Nest / Fighting Top
      const topPlatform = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 2.2), oakDark);
      topPlatform.position.set(0, 4.4 + mc.height * 0.56, mc.z);
      ship.add(topPlatform);

      // Yards + Billowing Curved Square Sails
      mc.yards.forEach((yh, idx) => {
        const yw = mc.sailW * (1 - idx * 0.18);
        const sailH = idx === 0 ? 5.6 : idx === 1 ? 4.4 : 3.2;
        const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, yw + 1.4, 7), oakDark);
        yard.rotation.z = Math.PI / 2;
        yard.position.set(0, yh, mc.z + 0.35);
        ship.add(yard);

        const sGeo = new THREE.PlaneGeometry(yw, sailH, 8, 6);
        const sp = sGeo.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < sp.count; k++) {
          const sx = sp.getX(k);
          const sy = sp.getY(k);
          const belly =
            Math.cos((sx / (yw * 0.5)) * Math.PI * 0.48) *
            Math.cos((sy / (sailH * 0.5)) * Math.PI * 0.48) *
            1.45;
          sp.setZ(k, belly);
        }
        sGeo.computeVertexNormals();
        const sail = new THREE.Mesh(sGeo, canvasMat);
        sail.position.set(0, yh - sailH * 0.5 - 0.15, mc.z + 0.55);
        ship.add(sail);
      });

      // Shroud Rigging Lines down to Port & Starboard Channels
      for (const side of [-1, 1]) {
        const shroudLen = Math.hypot(4.2, mc.height * 0.56);
        const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, shroudLen, 5), ropeMat);
        shroud.position.set(side * 2.1, 4.4 + mc.height * 0.28, mc.z);
        shroud.rotation.z = side * Math.atan2(4.2, mc.height * 0.56);
        ship.add(shroud);
      }

      // Crimson Masthead Pennant
      const pennant = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 3.6), flagMat);
      pennant.position.set(0, 4.4 + mc.height + 0.2, mc.z - 1.8);
      ship.add(pennant);
    }

    // Captain's Helm Wheel on Quarterdeck
    const helm = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 6, 12), goldTrim);
    helm.position.set(0, 7.45, -8.5);
    ship.add(helm);

    const wake = makeWakeMesh(-9.5, 4.2);
    root.add(wake);
    group.add(root);

    boatVisuals.sovereign_ship = {
      id: 'sovereign_ship',
      root,
      wake,
      playerLocalPos: new THREE.Vector3(0, 3.15, -4.4),
      companionLocalPos: new THREE.Vector3(0.95, 3.15, -3.5),
      fpvLocalPos: new THREE.Vector3(0, 4.35, -3.8),
      fpvLocalLook: new THREE.Vector3(0, 3.2, 22.0),
    };
  };

  makeRowboatMesh('lake_boat', 0x355c7d);
  makeRowboatMesh('coastal_boat', 0x2d6e82);
  makeBambooCatamaranMesh();
  makeTribalOutriggerMesh();
  makeSovereignShipMesh();

  const boatPrompts: Record<BoatId, InteractableItem> = {
    lake_boat: {
      id: 'board_lake_boat',
      kind: 'boat_board',
      label: 'Board Neelam Lake Boat',
      sublabel: 'நீலம் ஏரி படகு · Row with Frosty',
      x: 34.5,
      y: WATER_LEVEL + 0.3,
      z: -14.5,
      radius: 5.8,
      locationId: 'aomizu_lakeside',
      metaId: 'lake_boat',
    },
    coastal_boat: {
      id: 'board_coastal_boat',
      kind: 'boat_board',
      label: 'Board Kadalkarai Harbour Boat',
      sublabel: 'கடற்கரை படகு · Sail the turquoise coast',
      x: 118.0,
      y: WATER_LEVEL + 0.3,
      z: 66.0,
      radius: 7.4,
      locationId: 'coastal_town',
      metaId: 'coastal_boat',
    },
    bamboo_catamaran: {
      id: 'board_bamboo_catamaran',
      kind: 'boat_board',
      label: 'Sail Bamboo Catamaran Raft',
      sublabel: 'மூங்கில் பாய்மரப் படகு · Twin-pontoon Polynesian sail craft',
      x: 121.5,
      y: WATER_LEVEL + 0.3,
      z: 57.2,
      radius: 13.5,
      locationId: 'coastal_town',
      metaId: 'bamboo_catamaran',
    },
    tribal_outrigger: {
      id: 'board_tribal_outrigger',
      kind: 'boat_board',
      label: 'Sail Tribal Outrigger Canoe',
      sublabel: 'பழங்குடி அவுட்ரிகர் படகு · Crossed bow spars, axe & paddle wheel',
      x: 121.5,
      y: WATER_LEVEL + 0.3,
      z: 69.5,
      radius: 13.5,
      locationId: 'coastal_town',
      metaId: 'tribal_outrigger',
    },
    sovereign_ship: {
      id: 'board_sovereign_ship',
      kind: 'boat_board',
      label: 'Sail Sovereign of the Tides',
      sublabel: 'அலைகளின் அரசன் · Walk onto Shore Pier & Sail the 3-Masted Ship',
      x: SOVEREIGN_SHORE_BERTH.x,
      y: WATER_LEVEL + 1.2,
      z: SOVEREIGN_SHORE_BERTH.z,
      radius: 17.5,
      locationId: 'coastal_town',
      metaId: 'sovereign_ship',
    },
  };
  interactables.push(
    boatPrompts.lake_boat,
    boatPrompts.coastal_boat,
    boatPrompts.bamboo_catamaran,
    boatPrompts.tribal_outrigger,
    boatPrompts.sovereign_ship
  );

  const syncBoats = (boats: BoatState[], time: number) => {
    for (const b of boats) {
      const vis = boatVisuals[b.id];
      if (!vis) continue;
      const phase =
        b.id === 'lake_boat'
          ? 0
          : b.id === 'coastal_boat'
          ? 1.7
          : b.id === 'bamboo_catamaran'
          ? 3.1
          : b.id === 'sovereign_ship'
          ? 5.8
          : 4.6;
      const bobAmp = b.id === 'sovereign_ship' ? 0.095 : 0.065;
      const bob = Math.sin(time * (b.id === 'sovereign_ship' ? 1.4 : 2.1) + phase) * bobAmp;
      vis.root.position.set(b.x, WATER_LEVEL + 0.06 + bob, b.z);
      vis.root.rotation.y = b.heading;
      vis.root.rotation.z = Math.sin(time * 1.5 + phase) * (b.id === 'sovereign_ship' ? 0.022 : 0.036);
      vis.root.rotation.x = -Math.min(0.08, Math.abs(b.speed) * 0.009);

      const speedNorm = Math.min(1, Math.abs(b.speed) / 6.5);

      if (vis.leftOar && vis.rightOar) {
        if (speedNorm > 0.05) {
          const stroke = Math.sin(time * 4.2) * 0.42 * speedNorm;
          const dip = Math.cos(time * 4.2) * 0.16 * speedNorm;
          vis.leftOar.rotation.y = stroke;
          vis.rightOar.rotation.y = -stroke;
          vis.leftOar.rotation.z = dip;
          vis.rightOar.rotation.z = -dip;
        } else {
          vis.leftOar.rotation.y *= 0.9;
          vis.rightOar.rotation.y *= 0.9;
        }
      }

      // Billow Bamboo Catamaran sail & wave emblem flag
      if (vis.sailGeo) {
        const sPos = vis.sailGeo.attributes.position as THREE.BufferAttribute;
        const wind = 0.8 + speedNorm * 0.9;
        for (let i = 0; i < sPos.count; i++) {
          const x = sPos.getX(i);
          const y = sPos.getY(i);
          const arch = Math.sin((x / 3.3) * Math.PI) * 0.42 * wind;
          const flutter = Math.sin(time * 5.0 - x * 2.2 + y) * 0.045 * wind;
          sPos.setZ(i, arch + flutter);
        }
        sPos.needsUpdate = true;
      }
      if (vis.flagGeo) {
        const fPos = vis.flagGeo.attributes.position as THREE.BufferAttribute;
        const wind = 0.9 + speedNorm * 0.8;
        for (let i = 0; i < fPos.count; i++) {
          const x = fPos.getX(i);
          fPos.setZ(i, Math.sin(time * 8.2 - x * 4.5) * (x * 0.16 * wind));
        }
        fPos.needsUpdate = true;
      }

      // Spin Tribal Outrigger stern paddle-wheel
      if (vis.paddleWheel) {
        vis.paddleWheel.rotation.x -= (Math.abs(b.speed) + 0.5) * 0.12;
      }

      const wakeMat = vis.wake.material as THREE.MeshBasicMaterial;
      wakeMat.opacity = speedNorm * 0.52;
      vis.wake.scale.set(0.75 + speedNorm * 0.7, 0.7 + speedNorm * 0.85, 1);

      const prompt = boatPrompts[b.id];
      prompt.x = b.x;
      prompt.z = b.z;
    }
  };

  const getBoatPlayerTransform = (boatId: BoatId) => {
    const vis = boatVisuals[boatId];
    vis.root.updateMatrixWorld();
    return {
      position: vis.playerLocalPos.clone().applyMatrix4(vis.root.matrixWorld),
      heading: vis.root.rotation.y,
    };
  };

  const getBoatCompanionBowTransform = (boatId: BoatId) => {
    const vis = boatVisuals[boatId];
    vis.root.updateMatrixWorld();
    return {
      position: vis.companionLocalPos.clone().applyMatrix4(vis.root.matrixWorld),
      heading: vis.root.rotation.y,
    };
  };

  const getBoatBowFpvTransform = (boatId: BoatId) => {
    const vis = boatVisuals[boatId];
    vis.root.updateMatrixWorld();
    return {
      position: vis.fpvLocalPos.clone().applyMatrix4(vis.root.matrixWorld),
      lookAt: vis.fpvLocalLook.clone().applyMatrix4(vis.root.matrixWorld),
    };
  };

  return {
    group,
    interactables,
    syncBus,
    getBusWindowSeatTransform,
    getBusDriverCabTransform,
    getBusExteriorAnchor,
    getBusCompanionSeatTransform,
    syncBoats,
    getBoatPlayerTransform,
    getBoatCompanionBowTransform,
    getBoatBowFpvTransform,
    dispose: () => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    },
  };
}

