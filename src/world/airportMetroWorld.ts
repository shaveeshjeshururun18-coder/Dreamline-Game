import * as THREE from 'three';
import {
  AIRPORT_ATC_TOWER_POS,
  AIRPORT_CENTER,
  AIRPORT_GROUND_Y,
  AIRPORT_RUNWAY_BOUNDS,
  AIRPORT_TERMINAL_CENTER,
  METRO_EXIT_STAIRS_POS,
  METRO_FLOOR_Y,
  METRO_MEZZANINE_Y,
  METRO_PLATFORM_BOARD_POS,
  METRO_SURFACE_ENTRANCES,
  PARACHUTE_TOWER_POS,
  getAirportColliders,
  type AirlinerState,
  type MetroStationId,
  type ParachuteState,
  type SubwayTrainState,
} from '../game/airportMetro';
import { groundHeightAt, type AabbCollider } from '../game/terrain';
import type { InteractableItem } from '../game/types';

export interface AirportMetroWorldHandle {
  surfaceGroup: THREE.Group;
  undergroundGroup: THREE.Group;
  airlinerGroup: THREE.Group;
  parachuteGroup: THREE.Group;
  colliders: AabbCollider[];
  surfaceInteractables: InteractableItem[];
  undergroundInteractables: InteractableItem[];
  setUndergroundStationVisual: (stationId: MetroStationId) => void;
  update: (
    elapsed: number,
    nightFactor: number,
    inUndergroundMetro: boolean,
    subwayState: SubwayTrainState,
    airlinerState: AirlinerState,
    parachuteState: ParachuteState,
    playerX: number,
    playerY: number,
    playerZ: number,
    playerHeading: number
  ) => void;
  dispose: () => void;
}

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildCommercialJetModel(
  liveryPrimary: number,
  liveryAccent: number,
  includeLandingGear: boolean
): {
  root: THREE.Group;
  landingGearGroup: THREE.Group;
  fanMeshes: THREE.Mesh[];
  afterburnerMeshes: THREE.Mesh[];
  strobeLightMat: THREE.MeshBasicMaterial;
} {
  const root = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.22 });
  const primaryMat = new THREE.MeshStandardMaterial({ color: liveryPrimary, roughness: 0.3, metalness: 0.38 });
  const accentMat = new THREE.MeshStandardMaterial({ color: liveryAccent, roughness: 0.25, metalness: 0.5 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.32, metalness: 0.78 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12, metalness: 0.75 });
  const strobeLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Cylindrical fuselage oriented along +Z (forward)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.38, 17.5, 16), whiteMat);
  body.rotation.x = Math.PI * 0.5;
  body.position.set(0, 2.55, 0);
  root.add(body);

  // Belly livery stripe
  const belly = new THREE.Mesh(new THREE.CylinderGeometry(1.47, 1.4, 16.2, 14, 1, false, Math.PI * 0.65, Math.PI * 0.7), primaryMat);
  belly.rotation.x = Math.PI * 0.5;
  belly.position.set(0, 2.52, -0.1);
  root.add(belly);

  // Aerodynamic nose cone + cockpit wrap windshield
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.44, 16, 12), whiteMat);
  nose.scale.set(1, 0.94, 2.35);
  nose.position.set(0, 2.48, 8.75);
  root.add(nose);

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.56, 1.55), glassMat);
  cockpit.position.set(0, 3.05, 8.85);
  cockpit.rotation.x = 0.26;
  root.add(cockpit);

  // Tapered tail cone
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(1.38, 5.2, 14), whiteMat);
  tailCone.rotation.x = -Math.PI * 0.5;
  tailCone.position.set(0, 2.65, -11.3);
  root.add(tailCone);

  // Passenger window strip along both sides
  for (const s of [-1, 1]) {
    const winStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 13.8), glassMat);
    winStrip.position.set(s * 1.44, 2.86, 0.4);
    root.add(winStrip);

    const cheatLine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 15.6), accentMat);
    cheatLine.position.set(s * 1.45, 2.42, 0.0);
    root.add(cheatLine);
  }

  // Swept main wings + winglets + twin under-wing turbofans
  const fanMeshes: THREE.Mesh[] = [];
  const afterburnerMeshes: THREE.Mesh[] = [];
  const afterburnerMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.28, 3.4), whiteMat);
    wing.position.set(s * 5.6, 2.18, -0.5);
    wing.rotation.y = -s * 0.34;
    wing.rotation.z = s * 0.06;
    root.add(wing);

    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.45, 1.35), primaryMat);
    winglet.position.set(s * 10.2, 3.02, -2.05);
    winglet.rotation.z = -s * 0.16;
    root.add(winglet);

    const navLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: s === -1 ? 0xef4444 : 0x22c55e })
    );
    navLight.position.set(s * 10.3, 2.45, -1.9);
    root.add(navLight);

    const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), strobeLightMat);
    strobe.position.set(s * 10.35, 3.62, -2.1);
    root.add(strobe);

    // Under-wing turbofan nacelle
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.68, 3.2, 14), primaryMat);
    nacelle.rotation.x = Math.PI * 0.5;
    nacelle.position.set(s * 4.1, 1.42, 0.9);
    root.add(nacelle);

    const intakeRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 16), metalMat);
    intakeRing.position.set(s * 4.1, 1.42, 2.5);
    root.add(intakeRing);

    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.16, 8), darkMat);
    fan.rotation.x = Math.PI * 0.5;
    fan.position.set(s * 4.1, 1.42, 2.25);
    root.add(fan);
    fanMeshes.push(fan);

    const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.54, 2.4, 10), afterburnerMat);
    exhaust.rotation.x = -Math.PI * 0.5;
    exhaust.position.set(s * 4.1, 1.42, -1.7);
    exhaust.visible = false;
    root.add(exhaust);
    afterburnerMeshes.push(exhaust);
  }

  // Tall vertical stabilizer tail fin + horizontal tailplanes
  const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.4, 3.4), primaryMat);
  vTail.position.set(0, 5.2, -10.2);
  vTail.rotation.x = -0.34;
  root.add(vTail);

  const tailStripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.15, 3.1), accentMat);
  tailStripe.position.set(0, 5.5, -10.35);
  tailStripe.rotation.x = -0.34;
  root.add(tailStripe);

  for (const s of [-1, 1]) {
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 1.7), whiteMat);
    hTail.position.set(s * 2.2, 2.85, -10.8);
    hTail.rotation.y = -s * 0.35;
    root.add(hTail);
  }

  // Retractable Tricycle Landing Gear
  const landingGearGroup = new THREE.Group();
  if (includeLandingGear) {
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
    tireGeo.rotateZ(Math.PI * 0.5);
    const strutSpecs: Array<[number, number]> = [
      [0, 6.8],
      [-2.35, -1.2],
      [2.35, -1.2],
    ];
    for (const [gx, gz] of strutSpecs) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.35, 8), metalMat);
      strut.position.set(gx, 0.92, gz);
      const wheel = new THREE.Mesh(tireGeo, darkMat);
      wheel.position.set(gx, 0.42, gz);
      landingGearGroup.add(strut, wheel);
    }
  }
  root.add(landingGearGroup);

  return { root, landingGearGroup, fanMeshes, afterburnerMeshes, strobeLightMat };
}

export function buildAirportMetroWorld(_isSoftwareGl = false): AirportMetroWorldHandle {
  const surfaceGroup = new THREE.Group();
  const undergroundGroup = new THREE.Group();
  undergroundGroup.visible = false;

  const surfaceInteractables: InteractableItem[] = [];
  const undergroundInteractables: InteractableItem[] = [];
  const colliders: AabbCollider[] = [...getAirportColliders()];
  const disposables: THREE.Texture[] = [];

  // =========================================================================
  // 1. THREE STREET-LEVEL UNDERGROUND METRO ENTRANCES
  // =========================================================================
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.36, metalness: 0.72 });
  const glassCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.14,
    metalness: 0.28,
    transparent: true,
    opacity: 0.46,
  });
  const stairStoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const darkShaftMat = new THREE.MeshBasicMaterial({ color: 0x050914 });

  for (const ent of METRO_SURFACE_ENTRANCES) {
    const ey = groundHeightAt(ent.surfaceX, ent.surfaceZ);
    const entGroup = new THREE.Group();
    entGroup.position.set(ent.surfaceX, ey, ent.surfaceZ);

    const accentMat = new THREE.MeshStandardMaterial({
      color: ent.accentHex,
      emissive: ent.accentHex,
      emissiveIntensity: 1.2,
      roughness: 0.25,
    });

    // Concrete curb surround + dark descending stairwell opening + 7 visible downward steps
    const surround = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.26, 7.6), stairStoneMat);
    surround.position.y = 0.13;
    entGroup.add(surround);

    const shaftHole = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.28, 6.0), darkShaftMat);
    shaftHole.position.set(0, 0.16, -0.2);
    entGroup.add(shaftHole);

    for (let s = 0; s < 6; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.75), stairStoneMat);
      step.position.set(0, 0.18 - s * 0.16, 2.3 - s * 0.85);
      entGroup.add(step);
    }

    // Curved glass & steel Metro Canopy + side guardrails
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.16, 6.8), glassCanopyMat);
    roof.position.set(0, 3.25, -0.2);
    roof.rotation.x = -0.06;
    entGroup.add(roof);

    for (const sx of [-2.45, 2.45]) {
      for (const sz of [-3.1, 0, 2.9]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 3.2, 8), steelMat);
        post.position.set(sx, 1.6, sz);
        entGroup.add(post);
      }
      const wallRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 6.4), glassCanopyMat);
      wallRail.position.set(sx, 0.65, -0.2);
      entGroup.add(wallRail);
    }

    // Glowing "M" Metro Totem Pylon + Overhead Fascia Sign
    const signTex = makeCanvasTex(512, 128, (ctx, w, h) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `#${ent.accentHex.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, 0, w, 14);
      ctx.fillRect(0, h - 14, w, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(64, h * 0.5, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 64, h * 0.52);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ent.name.toUpperCase(), 118, h * 0.42);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 21px sans-serif';
      ctx.fillText(`LINE ${ent.lineCode} · UNDERGROUND SUBWAY`, 118, h * 0.74);
    });
    disposables.push(signTex);

    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.92, 0.24),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    fascia.position.set(0, 3.35, 3.15);
    entGroup.add(fascia);

    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.2, 10), steelMat);
    pylon.position.set(3.2, 2.6, 3.0);
    const pylonOrb = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 12), accentMat);
    pylonOrb.position.set(3.2, 5.35, 3.0);
    entGroup.add(pylon, pylonOrb);

    surfaceGroup.add(entGroup);

    surfaceInteractables.push({
      id: `enter_${ent.id}`,
      kind: 'metro_enter',
      label: `Descend into ${ent.name}`,
      sublabel: `${ent.tamilName} · Ride Line M1 Underground Subway`,
      x: ent.surfaceX,
      y: ey + 1.1,
      z: ent.surfaceZ + 2.8,
      radius: 4.5,
      metaId: ent.id,
    });
  }

  // =========================================================================
  // 2. DREAMLINE INTERNATIONAL AIRPORT (Terminal 1, Runway 09/27, ATC, Parachute Tower, Jets)
  // =========================================================================
  const airportGroup = new THREE.Group();
  const agY = AIRPORT_GROUND_Y;

  // Tarmac Apron Slab
  const tarmacMat = new THREE.MeshStandardMaterial({ color: 0x262c36, roughness: 0.92 });
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(136, 114), tarmacMat);
  apron.rotation.x = -Math.PI * 0.5;
  apron.position.set(AIRPORT_CENTER.x, agY + 0.03, AIRPORT_CENTER.z);
  apron.receiveShadow = true;
  airportGroup.add(apron);

  // Runway 09/27 with crisp procedural aviation markings
  const runwayTex = makeCanvasTex(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f252e';
    ctx.fillRect(0, 0, w, h);
    // White side edge lines
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(10, 12, w - 20, 6);
    ctx.fillRect(10, h - 18, w - 20, 6);
    // Piano-key threshold bars on both ends
    for (let i = 0; i < 6; i++) {
      const y = 32 + i * 33;
      ctx.fillRect(26, y, 52, 16);
      ctx.fillRect(w - 78, y, 52, 16);
    }
    // Runway numerals 09 / 27
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('09', 132, h * 0.5);
    ctx.fillText('27', w - 132, h * 0.5);
    // Dashed centerline
    for (let x = 200; x < w - 210; x += 62) {
      ctx.fillRect(x, h * 0.5 - 5, 36, 10);
    }
  });
  disposables.push(runwayTex);

  const runwayLen = AIRPORT_RUNWAY_BOUNDS.maxX - AIRPORT_RUNWAY_BOUNDS.minX;
  const runwayWid = AIRPORT_RUNWAY_BOUNDS.maxZ - AIRPORT_RUNWAY_BOUNDS.minZ;
  const runwayMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(runwayLen, runwayWid),
    new THREE.MeshStandardMaterial({ map: runwayTex, roughness: 0.85 })
  );
  runwayMesh.rotation.x = -Math.PI * 0.5;
  runwayMesh.position.set(
    (AIRPORT_RUNWAY_BOUNDS.minX + AIRPORT_RUNWAY_BOUNDS.maxX) * 0.5,
    agY + 0.06,
    AIRPORT_RUNWAY_BOUNDS.centerZ
  );
  airportGroup.add(runwayMesh);

  // Yellow Taxiway Line connecting Gate A1/A2 to Runway 09
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const taxiH = new THREE.Mesh(new THREE.PlaneGeometry(66, 0.55), yellowLineMat);
  taxiH.rotation.x = -Math.PI * 0.5;
  taxiH.position.set(194, agY + 0.07, -124);
  const taxiConn = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 22), yellowLineMat);
  taxiConn.rotation.x = -Math.PI * 0.5;
  taxiConn.position.set(227, agY + 0.07, -114);
  airportGroup.add(taxiH, taxiConn);

  // Pulsing Runway Edge Lights
  const runwayLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const runwayEdgeLights: THREE.Mesh[] = [];
  for (let rx = AIRPORT_RUNWAY_BOUNDS.minX + 6; rx <= AIRPORT_RUNWAY_BOUNDS.maxX - 6; rx += 14) {
    for (const rz of [AIRPORT_RUNWAY_BOUNDS.minZ - 0.6, AIRPORT_RUNWAY_BOUNDS.maxZ + 0.6]) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), runwayLightMat);
      bulb.position.set(rx, agY + 0.35, rz);
      airportGroup.add(bulb);
      runwayEdgeLights.push(bulb);
    }
  }

  // Walkable Terminal 1 Glass Departure Hall
  const tx = AIRPORT_TERMINAL_CENTER.x;
  const tz = AIRPORT_TERMINAL_CENTER.z;
  const concourseMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.45, metalness: 0.12 });
  const termWallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.25 });
  const termRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.55 });

  const termFloor = new THREE.Mesh(new THREE.BoxGeometry(46, 0.2, 23), concourseMat);
  termFloor.position.set(tx, agY + 0.1, tz + 2.5);
  termFloor.receiveShadow = true;
  airportGroup.add(termFloor);

  // Back wall, side walls, and sweeping futuristic airport roof canopy
  const termBack = new THREE.Mesh(new THREE.BoxGeometry(46, 9.5, 0.6), termWallMat);
  termBack.position.set(tx, agY + 4.95, tz - 9.2);
  const termWest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.5, 18.6), termWallMat);
  termWest.position.set(tx - 22.8, agY + 4.95, tz);
  const termEast = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.5, 18.6), termWallMat);
  termEast.position.set(tx + 22.8, agY + 4.95, tz);
  // Front glass curtain walls flanking wide central open departure doorway (x: 179..191)
  const termFrontW = new THREE.Mesh(new THREE.BoxGeometry(16.5, 8.8, 0.35), glassCanopyMat);
  termFrontW.position.set(tx - 14.4, agY + 4.6, tz + 9.0);
  const termFrontE = new THREE.Mesh(new THREE.BoxGeometry(16.5, 8.8, 0.35), glassCanopyMat);
  termFrontE.position.set(tx + 14.4, agY + 4.6, tz + 9.0);
  const termRoof = new THREE.Mesh(new THREE.BoxGeometry(50, 0.75, 25), termRoofMat);
  termRoof.position.set(tx, agY + 9.9, tz + 1.2);
  airportGroup.add(termBack, termWest, termEast, termFrontW, termFrontE, termRoof);

  // Glowing "DREAMLINE INTERNATIONAL AIRPORT · TERMINAL 1" Rooftop Banner + Interior Departures Board
  const termSignTex = makeCanvasTex(1024, 160, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, h - 14, w, 14);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DREAMLINE INTERNATIONAL AIRPORT · TERMINAL 1', w * 0.5, h * 0.44);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '600 24px sans-serif';
    ctx.fillText('GATES A1 – A2  ·  DL-787 DREAMLINER BOARDING  ·  METRO M1', w * 0.5, h * 0.78);
  });
  disposables.push(termSignTex);
  const termSign = new THREE.Mesh(
    new THREE.BoxGeometry(32, 2.8, 0.3),
    new THREE.MeshBasicMaterial({ map: termSignTex })
  );
  termSign.position.set(tx, agY + 11.7, tz + 12.2);
  airportGroup.add(termSign);

  // Interior Departures Board & Check-in Desks
  const depBoardTex = makeCanvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('FLIGHT DEPARTURES', 20, 38);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '20px monospace';
    const rows = [
      'DL-787  WORLD TOUR    GATE A1  BOARDING',
      'DL-402  METRO CITY    GATE A2  ON TIME',
      'DL-910  SNOW PEAKS    GATE A3  READY',
      'M1-SUB  UNDERGROUND   LEVEL -1 EVERY 15s',
    ];
    rows.forEach((r, i) => ctx.fillText(r, 20, 86 + i * 40));
  });
  disposables.push(depBoardTex);
  const depBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 4.4),
    new THREE.MeshBasicMaterial({ map: depBoardTex })
  );
  depBoard.position.set(tx, agY + 5.2, tz - 8.75);
  airportGroup.add(depBoard);

  for (let i = 0; i < 4; i++) {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.15, 1.6), steelMat);
    desk.position.set(tx - 12 + i * 8, agY + 0.78, tz - 5.2);
    airportGroup.add(desk);
  }

  // Two Telescoping Glass Jetways extending to Gates A1 & A2
  for (const jx of [198, 232]) {
    const jetway = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 13.5), glassCanopyMat);
    jetway.position.set(jx, agY + 3.2, -138);
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.4, 8), steelMat);
    support.position.set(jx, agY + 1.2, -133);
    airportGroup.add(jetway, support);
  }

  // 26m Air Traffic Control Tower with Rotating Radar Dish & Blinking Red Beacon
  const atcGroup = new THREE.Group();
  atcGroup.position.set(AIRPORT_ATC_TOWER_POS.x, agY, AIRPORT_ATC_TOWER_POS.z);
  const atcShaft = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 3.1, 20, 10), termWallMat);
  atcShaft.position.y = 10;
  const atcCab = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 3.2, 3.6, 12), glassCanopyMat);
  atcCab.position.y = 21.8;
  const atcRoof = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 4.6, 0.85, 12), termRoofMat);
  atcRoof.position.y = 24.0;
  const radarPivot = new THREE.Group();
  radarPivot.position.y = 25.5;
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.8, 8), steelMat);
  const radarBar = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.65, 0.35), termWallMat);
  radarBar.position.y = 0.85;
  radarPivot.add(radarMast, radarBar);
  const atcBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const atcBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), atcBeaconMat);
  atcBeacon.position.y = 27.1;
  atcGroup.add(atcShaft, atcCab, atcRoof, radarPivot, atcBeacon);
  airportGroup.add(atcGroup);

  // Parked Display Jet at Gate A2
  const parkedJet = buildCommercialJetModel(0x0284c7, 0xf59e0b, true);
  parkedJet.root.position.set(234, agY, -125);
  parkedJet.root.rotation.y = Math.PI * 0.5;
  airportGroup.add(parkedJet.root);

  // Autonomous Ambient AI Jetliner circling above the Airport & Ocean!
  const aiJet = buildCommercialJetModel(0xdc2626, 0xfacc15, false);
  aiJet.root.scale.setScalar(0.85);
  airportGroup.add(aiJet.root);

  // Parachute Jump Test Tower (Outside Metro City — Right at Airport West Edge `(164, -126)`)
  const pTowerGroup = new THREE.Group();
  pTowerGroup.position.set(PARACHUTE_TOWER_POS.x, agY, PARACHUTE_TOWER_POS.z);
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, metalness: 0.4 });
  const deckYLocal = PARACHUTE_TOWER_POS.deckY - agY;
  for (const sx of [-1.8, 1.8]) {
    for (const sz of [-1.8, 1.8]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, deckYLocal, 8), orangeMat);
      leg.position.set(sx, deckYLocal * 0.5, sz);
      pTowerGroup.add(leg);
    }
  }
  const jumpDeck = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.45, 5.4), steelMat);
  jumpDeck.position.y = deckYLocal;
  const jumpRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.14, 10, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  jumpRing.rotation.x = Math.PI * 0.5;
  jumpRing.position.y = deckYLocal + 0.35;
  const towerSignTex = makeCanvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 0, w, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PARACHUTE JUMP TOWER', w * 0.5, 58);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('PRESS [E] TO TEST PARACHUTE GLIDE', w * 0.5, 102);
  });
  disposables.push(towerSignTex);
  const towerSign = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 1.35, 0.25),
    new THREE.MeshBasicMaterial({ map: towerSignTex })
  );
  towerSign.position.set(0, 3.6, 2.2);
  pTowerGroup.add(jumpDeck, jumpRing, towerSign);
  airportGroup.add(pTowerGroup);

  surfaceInteractables.push(
    {
      id: 'airport_board_airliner',
      kind: 'airliner_board',
      label: 'Pilot DL-787 Dreamliner Jet',
      sublabel: 'Dreamline International Airport · Take off down Runway 09/27',
      x: 198,
      y: agY + 1.4,
      z: -119,
      radius: 9.5,
      locationId: 'dreamline_airport',
    },
    {
      id: 'airport_parachute_tower',
      kind: 'parachute_tower_launch',
      label: 'Launch Parachute Jump Test (22m Skydiving Tower)',
      sublabel: 'Test deployable 3D Parachute Glide outside Metro City',
      x: PARACHUTE_TOWER_POS.x,
      y: agY + 1.2,
      z: PARACHUTE_TOWER_POS.z + 3.2,
      radius: 5.5,
      locationId: 'dreamline_airport',
    }
  );

  surfaceGroup.add(airportGroup);

  // =========================================================================
  // 4. FULL 2-LEVEL 3D UNDERGROUND METRO STATION + LIVE 3-CAR SUBWAY TRAIN
  // =========================================================================
  const metroFloorMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.42, metalness: 0.14 });
  const metroTileMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.1 });
  const metroVaultMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.25 });
  const metroTrackBedMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92 });
  const metroYellowEdgeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const metroLedMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

  // Main Platform Deck (y = -18.0)
  const platDeck = new THREE.Mesh(new THREE.BoxGeometry(54, 0.5, 11), metroFloorMat);
  platDeck.position.set(0, METRO_FLOOR_Y - 0.25, -1.0);
  undergroundGroup.add(platDeck);

  // Bright Yellow Tactile Platform Safety Line
  const safetyEdge = new THREE.Mesh(new THREE.BoxGeometry(52, 0.06, 0.45), metroYellowEdgeMat);
  safetyEdge.position.set(0, METRO_FLOOR_Y + 0.03, -6.15);
  undergroundGroup.add(safetyEdge);

  // Lower Track Trench + Twin Steel Rails + Receding Deep Tunnels (-110m..+110m)
  const trackBed = new THREE.Mesh(new THREE.BoxGeometry(220, 0.4, 8.5), metroTrackBedMat);
  trackBed.position.set(0, METRO_FLOOR_Y - 1.35, -9.5);
  undergroundGroup.add(trackBed);

  for (const rz of [-8.3, -10.7]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(220, 0.14, 0.16), steelMat);
    rail.position.set(0, METRO_FLOOR_Y - 1.05, rz);
    undergroundGroup.add(rail);
  }

  // Far Tunnel Wall & Twin Dark Tunnel Portals on West (-27) and East (+27)
  const tunnelBackWall = new THREE.Mesh(new THREE.BoxGeometry(56, 10, 0.5), metroTileMat);
  tunnelBackWall.position.set(0, METRO_FLOOR_Y + 3.8, -13.6);
  undergroundGroup.add(tunnelBackWall);

  for (const sx of [-28, 28]) {
    const tunnelTube = new THREE.Mesh(
      new THREE.CylinderGeometry(5.4, 5.4, 84, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, side: THREE.BackSide })
    );
    tunnelTube.rotation.z = Math.PI * 0.5;
    tunnelTube.position.set(sx + (sx < 0 ? -42 : 42), METRO_FLOOR_Y + 2.4, -9.5);
    undergroundGroup.add(tunnelTube);
  }

  // Upper Mezzanine Ticket Concourse (y = -13.2) + Wide Central Escalator & Stairs Ramp!
  const mezzDeck = new THREE.Mesh(new THREE.BoxGeometry(38, 0.5, 7.2), metroFloorMat);
  mezzDeck.position.set(0, METRO_MEZZANINE_Y - 0.25, 14.6);
  undergroundGroup.add(mezzDeck);

  // 16 Wide Concrete Steps + Flanking Glowing Cyan Escalator Side Rails connecting -18.0 -> -13.2
  for (let i = 0; i < 16; i++) {
    const frac = (i + 0.5) / 16;
    const step = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.34, 0.58), metroTileMat);
    step.position.set(0, METRO_FLOOR_Y + frac * (METRO_MEZZANINE_Y - METRO_FLOOR_Y) - 0.14, 4.2 + frac * 7.2);
    undergroundGroup.add(step);
  }
  const escLen = Math.hypot(7.2, METRO_MEZZANINE_Y - METRO_FLOOR_Y);
  const escPitch = Math.atan2(METRO_MEZZANINE_Y - METRO_FLOOR_Y, 7.2);
  for (const ex of [-6.2, -2.2, 2.2, 6.2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, escLen), steelMat);
    rail.position.set(ex, (METRO_FLOOR_Y + METRO_MEZZANINE_Y) * 0.5 + 0.4, 7.8);
    rail.rotation.x = -escPitch;
    undergroundGroup.add(rail);
  }

  // Ticket Turnstiles on Mezzanine + Station Enclosure Walls & Vaulted Ceiling Ribs
  for (let i = -4; i <= 4; i++) {
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.05, 1.4), steelMat);
    gate.position.set(i * 1.45, METRO_MEZZANINE_Y + 0.52, 13.4);
    undergroundGroup.add(gate);
  }

  const southBackWall = new THREE.Mesh(new THREE.BoxGeometry(56, 12, 0.6), metroTileMat);
  southBackWall.position.set(0, METRO_FLOOR_Y + 5.8, 17.8);
  const westEndWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 26), metroTileMat);
  westEndWall.position.set(-26.5, METRO_FLOOR_Y + 5.8, 5.0);
  const eastEndWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 26), metroTileMat);
  eastEndWall.position.set(26.5, METRO_FLOOR_Y + 5.8, 5.0);
  const ceilingSlab = new THREE.Mesh(new THREE.BoxGeometry(58, 0.6, 33), metroVaultMat);
  ceilingSlab.position.set(0, METRO_FLOOR_Y + 11.4, 2.2);
  undergroundGroup.add(southBackWall, westEndWall, eastEndWall, ceilingSlab);

  for (let rx = -22; rx <= 22; rx += 5.5) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 31), metroVaultMat);
    rib.position.set(rx, METRO_FLOOR_Y + 10.8, 2.2);
    const led = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.55), metroLedMat);
    led.position.set(rx, METRO_FLOOR_Y + 10.35, -1.5);
    undergroundGroup.add(rib, led);
  }

  // Dynamic Underground Station Name Sign & Illuminated M1 Route Map
  const stationBannerCanvas = document.createElement('canvas');
  stationBannerCanvas.width = 1024;
  stationBannerCanvas.height = 192;
  const stationBannerTex = new THREE.CanvasTexture(stationBannerCanvas);
  stationBannerTex.colorSpace = THREE.SRGBColorSpace;
  disposables.push(stationBannerTex);

  const drawStationBanner = (stationId: MetroStationId) => {
    const st = METRO_SURFACE_ENTRANCES.find((s) => s.id === stationId) ?? METRO_SURFACE_ENTRANCES[0];
    const ctx = stationBannerCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, 1024, 192);
    ctx.fillStyle = `#${st.accentHex.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 1024, 18);
    ctx.fillRect(0, 174, 1024, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.name.toUpperCase(), 512, 82);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('LINE M1: CENTRAL METRO  ⟷  METRO CITY (5TH AVE)  ⟷  AIRPORT TERMINAL 1', 512, 138);
    stationBannerTex.needsUpdate = true;
  };
  drawStationBanner('metro_central');

  const undergroundBannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 3.2),
    new THREE.MeshBasicMaterial({ map: stationBannerTex })
  );
  undergroundBannerMesh.position.set(0, METRO_FLOOR_Y + 5.0, -13.25);
  undergroundGroup.add(undergroundBannerMesh);

  // Bright Overhead Underground Station PointLights
  const ugLight1 = new THREE.PointLight(0xe0f2fe, 5.0, 42, 1.2);
  ugLight1.position.set(-10, METRO_FLOOR_Y + 7.5, -1);
  const ugLight2 = new THREE.PointLight(0xe0f2fe, 5.0, 42, 1.2);
  ugLight2.position.set(10, METRO_FLOOR_Y + 7.5, -1);
  const ugLight3 = new THREE.PointLight(0xfef3c7, 4.2, 34, 1.2);
  ugLight3.position.set(0, METRO_MEZZANINE_Y + 4.8, 13.5);
  undergroundGroup.add(ugLight1, ugLight2, ugLight3);

  // Live 3-Car Electric Subway Train with Sliding Doors & Glowing Headlights!
  const subwayTrainGroup = new THREE.Group();
  subwayTrainGroup.position.set(-12, METRO_FLOOR_Y - 1.0, -9.5);
  const carBodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.28, metalness: 0.65 });
  const carStripeMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.25,
  });
  const carWinMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  const subwayDoors: Array<{ mesh: THREE.Mesh; baseX: number; side: number }> = [];

  for (let c = -1; c <= 1; c++) {
    const cx = c * 15.2;
    const car = new THREE.Mesh(new THREE.BoxGeometry(14.4, 3.4, 3.1), carBodyMat);
    car.position.set(cx, 1.9, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.55, 3.16), carStripeMat);
    stripe.position.set(cx, 1.25, 0);
    const winBand = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.05, 3.14), carWinMat);
    winBand.position.set(cx, 2.35, 0);
    subwayTrainGroup.add(car, stripe, winBand);

    // Animated sliding doors on platform side (+Z)
    for (const dx of [-3.6, 3.6]) {
      for (const side of [-1, 1]) {
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.35, 0.14), steelMat);
        door.position.set(cx + dx + side * 0.48, 1.55, 1.56);
        subwayTrainGroup.add(door);
        subwayDoors.push({ mesh: door, baseX: cx + dx + side * 0.48, side });
      }
    }
  }
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const headL = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), headlightMat);
  headL.position.set(22.5, 1.4, -0.8);
  const headR = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), headlightMat);
  headR.position.set(22.5, 1.4, 0.8);
  subwayTrainGroup.add(headL, headR);
  undergroundGroup.add(subwayTrainGroup);

  undergroundInteractables.push(
    {
      id: 'ug_metro_board_train',
      kind: 'metro_train_board',
      label: 'Ride M1 Underground Subway to Next Station',
      sublabel: 'Central Metro ⟷ Airport Terminal 1',
      x: METRO_PLATFORM_BOARD_POS.x,
      y: METRO_FLOOR_Y + 1.1,
      z: METRO_PLATFORM_BOARD_POS.z,
      radius: 7.5,
    },
    {
      id: 'ug_metro_exit_surface',
      kind: 'metro_exit',
      label: 'Exit Underground Metro to Street Surface',
      sublabel: 'Take escalators back up to street level',
      x: METRO_EXIT_STAIRS_POS.x,
      y: METRO_MEZZANINE_Y + 1.1,
      z: METRO_EXIT_STAIRS_POS.z,
      radius: 5.5,
    }
  );

  // =========================================================================
  // 5. FLYABLE DL-787 DREAMLINER AIRLINER
  // =========================================================================
  const playerAirliner = buildCommercialJetModel(0x1d4ed8, 0x38bdf8, true);
  const airlinerGroup = playerAirliner.root;

  // =========================================================================
  // 6. DEPLOYABLE 3D PARACHUTE RIG (MULTI-PANEL RAM-AIR CANOPY + LINES)
  // =========================================================================
  const parachuteGroup = new THREE.Group();
  parachuteGroup.visible = false;
  const canopyGroup = new THREE.Group();
  canopyGroup.position.set(0, 4.35, 0);
  const cellColors = [0xef4444, 0xf8fafc, 0x38bdf8, 0xfacc15, 0x38bdf8, 0xf8fafc, 0xef4444];
  for (let i = 0; i < cellColors.length; i++) {
    const frac = (i - 3) / 3; // -1..1
    const cell = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.36, 1.95),
      new THREE.MeshStandardMaterial({ color: cellColors[i], roughness: 0.55 })
    );
    cell.position.set(frac * 2.15, -frac * frac * 0.48, 0);
    cell.rotation.z = -frac * 0.36;
    canopyGroup.add(cell);
  }
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0 });
  for (const lx of [-2.0, -1.0, 1.0, 2.0]) {
    for (const lz of [-0.75, 0.75]) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(lx * 0.14, 1.45, lz * 0.18),
        new THREE.Vector3(lx, 4.15 - (lx / 2.2) * (lx / 2.2) * 0.45, lz),
      ]);
      parachuteGroup.add(new THREE.Line(geo, lineMat));
    }
  }
  parachuteGroup.add(canopyGroup);

  // =========================================================================
  // 7. UPDATE LOOP
  // =========================================================================
  const update = (
    elapsed: number,
    _nightFactor: number,
    inUndergroundMetro: boolean,
    subwayState: SubwayTrainState,
    airlinerState: AirlinerState,
    parachuteState: ParachuteState,
    playerX: number,
    playerY: number,
    playerZ: number,
    playerHeading: number
  ) => {
    undergroundGroup.visible = inUndergroundMetro;

    // 1. Animate ATC Radar, Beacon, Runway Lights & Ambient AI Jetliner
    radarPivot.rotation.y = elapsed * 1.4;
    const beaconBlink = Math.sin(elapsed * 4.5) > 0.15;
    atcBeaconMat.color.setHex(beaconBlink ? 0xff3b30 : 0x550000);
    runwayLightMat.color.setHex(Math.sin(elapsed * 2.6) > -0.2 ? 0x7dd3fc : 0x0284c7);

    // Ambient AI Jetliner circling scenic sky route over Airport & Coast
    const aiAngle = elapsed * 0.14;
    const aiX = AIRPORT_CENTER.x + Math.cos(aiAngle) * 95;
    const aiZ = AIRPORT_CENTER.z + Math.sin(aiAngle) * 75;
    const aiY = agY + 34 + Math.sin(aiAngle * 2) * 8;
    aiJet.root.position.set(aiX, aiY, aiZ);
    aiJet.root.rotation.set(0, -aiAngle, 0.24);

    // 3. Update Live Underground Subway Train & Sliding Doors
    if (inUndergroundMetro) {
      subwayTrainGroup.position.x = subwayState.trainX;
      const openOffset = subwayState.doorOpen * 0.72;
      for (let i = 0; i < subwayDoors.length; i++) {
        const d = subwayDoors[i];
        d.mesh.position.x = d.baseX + d.side * openOffset;
      }
    }

    // 4. Update Flyable DL-787 Dreamliner Airliner
    airlinerGroup.visible = !inUndergroundMetro;
    airlinerGroup.position.set(airlinerState.x, airlinerState.y, airlinerState.z);
    airlinerGroup.rotation.order = 'YXZ';
    airlinerGroup.rotation.set(-airlinerState.pitch, airlinerState.heading, airlinerState.roll);
    playerAirliner.landingGearGroup.visible = airlinerState.landingGearDown;
    playerAirliner.strobeLightMat.color.setHex(Math.sin(elapsed * 9.0) > 0.6 ? 0xffffff : 0x334155);
    const fanSpin = (0.12 + airlinerState.throttle * 0.9) * 12;
    for (const fan of playerAirliner.fanMeshes) {
      fan.rotation.z += fanSpin * 0.016;
    }
    for (const ab of playerAirliner.afterburnerMeshes) {
      ab.visible = airlinerState.afterburner;
      ab.scale.set(1, 0.85 + Math.sin(elapsed * 28) * 0.22, 1);
    }

    // 5. Update Deployable 3D Parachute Rig
    parachuteGroup.visible = parachuteState.active && !inUndergroundMetro;
    if (parachuteGroup.visible) {
      const s = 0.25 + parachuteState.deployProgress * 0.75;
      parachuteGroup.scale.set(s, s, s);
      parachuteGroup.position.set(playerX, playerY, playerZ);
      parachuteGroup.rotation.set(
        Math.sin(parachuteState.swayPhase * 0.8) * 0.08,
        playerHeading,
        Math.sin(parachuteState.swayPhase) * 0.12
      );
    }
  };

  const dispose = () => {
    for (const tex of disposables) tex.dispose();
    for (const grp of [surfaceGroup, undergroundGroup, airlinerGroup, parachuteGroup]) {
      grp.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
  };

  return {
    surfaceGroup,
    undergroundGroup,
    airlinerGroup,
    parachuteGroup,
    colliders,
    surfaceInteractables,
    undergroundInteractables,
    setUndergroundStationVisual: drawStationBanner,
    update,
    dispose,
  };
}
