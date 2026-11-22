import * as THREE from 'three';
import { AVS_HELIPAD_POS, HOME_HELIPAD_POS, type SkyExplorerState } from '../game/skyExplorer';
import type { InteractableItem } from '../game/types';

export interface SkyExplorerWorldSystem {
  group: THREE.Group;
  interactable: InteractableItem;
  sync: (state: SkyExplorerState, elapsed: number, playerSeated: boolean) => void;
  getDriverSeatTransform: () => { position: THREE.Vector3; heading: number };
  getCompanionSeatTransform: () => { position: THREE.Vector3; heading: number };
  getFollowAnchor: () => THREE.Vector3;
  dispose: () => void;
}

function makeWoodTex(baseHex: string, grainHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = grainHex;
    for (let i = 0; i < 80; i++) {
      const y = (i * 29.7) % 256;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(0, y, 256, 2 + (i % 3));
    }
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#1f1209';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeBambooTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, '#856031');
    grad.addColorStop(0.5, '#b88c4a');
    grad.addColorStop(1, '#6e4c23');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);
    ctx.globalAlpha = 0.7;
    for (let y = 32; y < 256; y += 64) {
      ctx.fillStyle = '#3b260e';
      ctx.fillRect(0, y - 3, 128, 6);
      ctx.fillStyle = '#d4af6e';
      ctx.fillRect(0, y + 3, 128, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSailTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#dfd1b4';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#c7b595';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#b59e7a';
    ctx.fillRect(90, 120, 75, 65);
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(90, 120, 75, 65);
  }
  return new THREE.CanvasTexture(c);
}

function makeSsjFlagTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#13243a');
    grad.addColorStop(0.5, '#1b314e');
    grad.addColorStop(1, '#0f1c2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 488, 296);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(186, 150);
    ctx.lineTo(170, 75);
    ctx.lineTo(220, 115);
    ctx.lineTo(256, 60);
    ctx.lineTo(292, 115);
    ctx.lineTo(342, 75);
    ctx.lineTo(326, 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(186, 158, 140, 14);

    ctx.font = '900 92px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('SSJ', 256, 262);
  }
  return new THREE.CanvasTexture(c);
}

function makeSsjPlateTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2d1a0e';
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 84);
    ctx.font = '900 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#facc15';
    ctx.fillText('SSJ', 128, 52);
  }
  return new THREE.CanvasTexture(c);
}

/**
 * Faithful 3D reconstruction of the user's "SSJ Tropical Sky Explorer" flying bamboo raft hover-car:
 * - Layered timber & bamboo raft hull with hemp rope lashings and carved SSJ plates
 * - 4 bamboo outrigger arms with wooden/bronze turbine drums, rotating wooden propellers & blue energy plumes
 * - Handcrafted dashboard, turning wooden steering wheel, throttle lever, woven rattan seats, rear cargo crates
 * - Overhead bamboo canopy frame with billowing canvas sail & tall bamboo mast flying the SSJ Crown Flag!
 */
export function buildSkyExplorerWorld(initial: SkyExplorerState): SkyExplorerWorldSystem {
  const group = new THREE.Group();
  const raftChassis = new THREE.Group();
  // Slight scale tuning (0.78) so it seats DREAMLINE's 1.68m player & Frosty harmoniously
  raftChassis.scale.setScalar(0.78);
  group.add(raftChassis);

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  const darkWoodTex = track(makeWoodTex('#4a2c16', '#2b1708'));
  const medWoodTex = track(makeWoodTex('#6e4423', '#3d2310'));
  const bambooTex = track(makeBambooTex());
  const sailTex = track(makeSailTex());
  const flagTex = track(makeSsjFlagTex());
  const plateTex = track(makeSsjPlateTex());

  const logMat = track(new THREE.MeshStandardMaterial({ map: darkWoodTex, roughness: 0.78, metalness: 0.05 }));
  const plankMat = track(new THREE.MeshStandardMaterial({ map: medWoodTex, roughness: 0.7, metalness: 0.08 }));
  const bambooMat = track(new THREE.MeshStandardMaterial({ map: bambooTex, roughness: 0.55, metalness: 0.08 }));
  const ropeMat = track(new THREE.MeshStandardMaterial({ color: 0xc2a375, roughness: 0.9 }));
  const bronzeMat = track(new THREE.MeshStandardMaterial({ color: 0x9a6b32, roughness: 0.35, metalness: 0.75 }));
  const darkIronMat = track(new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.45, metalness: 0.8 }));
  const plateMat = track(new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.5 }));
  const wickerMat = track(new THREE.MeshStandardMaterial({ color: 0x9c7444, roughness: 0.85 }));

  const hullWidth = 4.6;
  const hullLength = 6.8;

  // 1. Bottom longitudinal heavy timber logs (7 logs across)
  const logGeo = track(new THREE.CylinderGeometry(0.34, 0.33, hullLength, 10));
  logGeo.rotateX(Math.PI / 2);
  for (let i = -3; i <= 3; i++) {
    const logMesh = new THREE.Mesh(logGeo, logMat);
    logMesh.position.set(i * 0.68, 0, 0);
    logMesh.castShadow = true;
    raftChassis.add(logMesh);
  }

  // 2. Cross-beam bamboo logs + rope knots
  const crossGeo = track(new THREE.CylinderGeometry(0.24, 0.24, hullWidth + 0.9, 10));
  crossGeo.rotateZ(Math.PI / 2);
  const ropeKnotGeo = track(new THREE.TorusGeometry(0.31, 0.08, 6, 12));
  for (const zPos of [-2.7, -0.9, 0.9, 2.7]) {
    const crossLog = new THREE.Mesh(crossGeo, bambooMat);
    crossLog.position.set(0, 0.36, zPos);
    raftChassis.add(crossLog);
    for (const xPos of [-2.05, -0.7, 0.7, 2.05]) {
      const knot = new THREE.Mesh(ropeKnotGeo, ropeMat);
      knot.position.set(xPos, 0.22, zPos);
      knot.rotation.y = Math.PI / 4;
      raftChassis.add(knot);
    }
  }

  // 3. Upper side bumper logs & end bumpers + carved SSJ Wood Plates
  const sideLogGeo = track(new THREE.CylinderGeometry(0.27, 0.27, hullLength - 0.4, 10));
  sideLogGeo.rotateX(Math.PI / 2);
  for (const sideX of [-2.15, 2.15]) {
    const sideLog = new THREE.Mesh(sideLogGeo, logMat);
    sideLog.position.set(sideX, 0.68, 0);
    raftChassis.add(sideLog);

    const sidePlate = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.48, 1.4)), plateMat);
    sidePlate.position.set(sideX + Math.sign(sideX) * 0.28, 0.68, -0.4);
    raftChassis.add(sidePlate);
  }

  const endLogGeo = track(new THREE.CylinderGeometry(0.26, 0.26, hullWidth + 0.3, 10));
  endLogGeo.rotateZ(Math.PI / 2);
  const endPlateGeo = track(new THREE.BoxGeometry(1.6, 0.55, 0.1));
  [-3.15, 3.15].forEach((endZ, idx) => {
    const endLog = new THREE.Mesh(endLogGeo, logMat);
    endLog.position.set(0, 0.68, endZ);
    raftChassis.add(endLog);
    const plate = new THREE.Mesh(endPlateGeo, plateMat);
    plate.position.set(0, 0.52, endZ + (idx === 0 ? -0.26 : 0.26));
    if (idx === 0) plate.rotation.y = Math.PI;
    raftChassis.add(plate);
  });

  // Wooden Plank Deck Floor
  const deckFloor = new THREE.Mesh(
    track(new THREE.BoxGeometry(hullWidth - 0.5, 0.16, hullLength - 0.8)),
    plankMat
  );
  deckFloor.position.set(0, 0.44, 0);
  raftChassis.add(deckFloor);

  // 4. Four Outrigger Bamboo Arms + Rotating Wooden Propellers + Glowing Blue Lift Turbines
  const propellers: Array<{ group: THREE.Group; dir: number }> = [];
  const thrusterCones: Array<{ outer: THREE.Mesh; inner: THREE.Mesh }> = [];

  const strutGeo = track(new THREE.CylinderGeometry(0.11, 0.11, 1.45, 7));
  strutGeo.rotateZ(Math.PI / 2);
  const housingGeo = track(new THREE.CylinderGeometry(0.46, 0.42, 1.25, 12));
  const bandGeo = track(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 12));
  const hubGeo = track(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 10));
  const bladeGeo = track(new THREE.BoxGeometry(2.35, 0.04, 0.24));
  const nozzleGeo = track(new THREE.CylinderGeometry(0.38, 0.46, 0.26, 12));
  const glowCoreGeo = track(new THREE.CircleGeometry(0.38, 12));
  glowCoreGeo.rotateX(Math.PI / 2);
  const glowCoreMat = track(new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide }));

  const outerConeGeo = track(new THREE.ConeGeometry(0.42, 2.4, 12, 1, true));
  outerConeGeo.translate(0, -1.2, 0);
  outerConeGeo.rotateX(Math.PI);
  const outerConeMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  const innerConeGeo = track(new THREE.ConeGeometry(0.22, 1.6, 10, 1, true));
  innerConeGeo.translate(0, -0.8, 0);
  innerConeGeo.rotateX(Math.PI);
  const innerConeMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  [
    { x: -2.95, z: 2.35 },
    { x: 2.95, z: 2.35 },
    { x: -2.95, z: -2.35 },
    { x: 2.95, z: -2.35 },
  ].forEach((corner, index) => {
    const unitGroup = new THREE.Group();
    unitGroup.position.set(corner.x, 0.25, corner.z);

    for (const zOff of [-0.22, 0.22]) {
      const strut = new THREE.Mesh(strutGeo, bambooMat);
      strut.position.set(corner.x > 0 ? -0.55 : 0.55, 0.12, zOff);
      unitGroup.add(strut);
    }

    unitGroup.add(new THREE.Mesh(housingGeo, logMat));
    for (const bandY of [-0.42, 0, 0.42]) {
      const band = new THREE.Mesh(bandGeo, bronzeMat);
      band.position.y = bandY;
      unitGroup.add(band);
    }

    const propGroup = new THREE.Group();
    propGroup.position.y = 0.72;
    propGroup.add(new THREE.Mesh(hubGeo, bronzeMat));
    for (let b = 0; b < 2; b++) {
      const blade = new THREE.Mesh(bladeGeo, plankMat);
      blade.rotation.y = b * (Math.PI / 2);
      blade.rotation.x = 0.15;
      propGroup.add(blade);
    }
    unitGroup.add(propGroup);
    propellers.push({ group: propGroup, dir: index % 2 === 0 ? 1 : -1 });

    const nozzle = new THREE.Mesh(nozzleGeo, darkIronMat);
    nozzle.position.y = -0.68;
    unitGroup.add(nozzle);

    const glowCore = new THREE.Mesh(glowCoreGeo, glowCoreMat);
    glowCore.position.y = -0.8;
    unitGroup.add(glowCore);

    const outerPlume = new THREE.Mesh(outerConeGeo, outerConeMat);
    outerPlume.position.y = -3.15;
    const innerPlume = new THREE.Mesh(innerConeGeo, innerConeMat);
    innerPlume.position.y = -2.35;
    unitGroup.add(outerPlume, innerPlume);
    thrusterCones.push({ outer: outerPlume, inner: innerPlume });

    raftChassis.add(unitGroup);
  });

  // 5. Handcrafted Wooden Dashboard, Turning Steering Wheel, Throttle Lever & 2 Woven Rattan Seats
  const dashGroup = new THREE.Group();
  dashGroup.position.set(0, 0.95, 1.55);
  dashGroup.add(new THREE.Mesh(track(new THREE.BoxGeometry(3.2, 0.75, 0.65)), plankMat));

  const gaugeGeo = track(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10));
  gaugeGeo.rotateX(Math.PI / 2);
  for (const gx of [-0.4, 0.1, 0.55]) {
    const g = new THREE.Mesh(gaugeGeo, bronzeMat);
    g.position.set(gx, 0.16, -0.33);
    dashGroup.add(g);
  }

  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(-0.75, 0.28, -0.45);
  steeringWheel.rotation.x = -0.35;
  steeringWheel.add(new THREE.Mesh(track(new THREE.TorusGeometry(0.38, 0.048, 8, 16)), logMat));
  const spokeGeo = track(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 6));
  for (let s = 0; s < 4; s++) {
    const spoke = new THREE.Mesh(spokeGeo, bambooMat);
    spoke.rotation.z = (s * Math.PI) / 2;
    steeringWheel.add(spoke);
  }
  steeringWheel.add(new THREE.Mesh(track(new THREE.SphereGeometry(0.08, 8, 8)), bronzeMat));
  dashGroup.add(steeringWheel);

  const throttleLever = new THREE.Group();
  throttleLever.position.set(0.25, 0.35, -0.25);
  const leverStick = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6)), darkIronMat);
  leverStick.position.y = 0.25;
  const leverKnob = new THREE.Mesh(track(new THREE.SphereGeometry(0.08, 8, 8)), logMat);
  leverKnob.position.y = 0.52;
  throttleLever.add(leverStick, leverKnob);
  dashGroup.add(throttleLever);
  raftChassis.add(dashGroup);

  const seatCushGeo = track(new THREE.BoxGeometry(1.05, 0.22, 1.05));
  const seatBackGeo = track(new THREE.BoxGeometry(1.05, 1.15, 0.22));
  for (const seatX of [-0.78, 0.78]) {
    const seat = new THREE.Group();
    seat.position.set(seatX, 0.65, 0.25);
    const cushion = new THREE.Mesh(seatCushGeo, wickerMat);
    const backrest = new THREE.Mesh(seatBackGeo, wickerMat);
    backrest.position.set(0, 0.62, -0.44);
    backrest.rotation.x = -0.12;
    seat.add(cushion, backrest);
    raftChassis.add(seat);
  }

  // Rear Explorer Crates & Coiled Ropes
  const crate1 = new THREE.Mesh(track(new THREE.BoxGeometry(1.15, 0.85, 1.15)), plankMat);
  crate1.position.set(-1.05, 0.92, -1.75);
  crate1.rotation.y = 0.12;
  const crate2 = new THREE.Mesh(track(new THREE.BoxGeometry(0.95, 0.7, 0.95)), logMat);
  crate2.position.set(0.15, 0.85, -1.95);
  crate2.rotation.y = -0.18;
  raftChassis.add(crate1, crate2);

  // 6. Overhead Bamboo Canopy Frame + Rippling Canvas Sail
  const poleGeo = track(new THREE.CylinderGeometry(0.085, 0.105, 3.05, 7));
  for (const p of [
    { x: -1.75, z: 1.9, tiltX: -0.18 },
    { x: 1.75, z: 1.9, tiltX: -0.18 },
    { x: -1.75, z: -0.35, tiltX: 0.22 },
    { x: 1.75, z: -0.35, tiltX: 0.22 },
  ]) {
    const pole = new THREE.Mesh(poleGeo, bambooMat);
    pole.position.set(p.x, 1.95, p.z);
    pole.rotation.x = p.tiltX;
    raftChassis.add(pole);
  }

  const sideBarGeo = track(new THREE.CylinderGeometry(0.075, 0.075, 2.6, 7));
  sideBarGeo.rotateX(Math.PI / 2);
  for (const sx of [-1.75, 1.75]) {
    const sb = new THREE.Mesh(sideBarGeo, bambooMat);
    sb.position.set(sx, 3.35, 0.78);
    raftChassis.add(sb);
  }
  const frontBarGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 7));
  frontBarGeo.rotateZ(Math.PI / 2);
  for (const ez of [-0.45, 2.0]) {
    const fb = new THREE.Mesh(frontBarGeo, bambooMat);
    fb.position.set(0, 3.38, ez);
    raftChassis.add(fb);
  }

  const sailGeo = track(new THREE.PlaneGeometry(3.45, 2.45, 10, 10));
  sailGeo.rotateX(-Math.PI / 2);
  const sailPosAttr = sailGeo.attributes.position as THREE.BufferAttribute;
  const sailBaseY: number[] = [];
  for (let i = 0; i < sailPosAttr.count; i++) {
    const vx = sailPosAttr.getX(i);
    const vz = sailPosAttr.getZ(i);
    const arch = Math.cos((vx / 1.75) * (Math.PI / 2)) * Math.cos((vz / 1.25) * (Math.PI / 2)) * 0.28;
    sailPosAttr.setY(i, arch);
    sailBaseY.push(arch);
  }
  sailGeo.computeVertexNormals();
  const sailMesh = new THREE.Mesh(
    sailGeo,
    track(new THREE.MeshStandardMaterial({ map: sailTex, side: THREE.DoubleSide, roughness: 0.85 }))
  );
  sailMesh.position.set(0, 3.36, 0.78);
  raftChassis.add(sailMesh);

  // 7. Tall Bamboo Mast & Waving SSJ Golden Crown Flag
  const mast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.13, 4.8, 8)), bambooMat);
  mast.position.set(-1.05, 2.85, -1.15);
  raftChassis.add(mast);

  const flagGeo = track(new THREE.PlaneGeometry(2.35, 1.48, 14, 6));
  flagGeo.translate(-1.175, 0, 0);
  const flagMesh = new THREE.Mesh(
    flagGeo,
    track(new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.65 }))
  );
  flagMesh.position.set(-1.05, 4.35, -1.15);
  flagMesh.rotation.y = Math.PI / 2;
  raftChassis.add(flagMesh);

  // Clone the handcrafted SSJ Tropical Sky Explorer chassis as a twin aircraft so BOTH
  // En Illam (My Home) Helipad AND AVS Snow Residence Helipad always display a Sky Explorer!
  const rootGroup = new THREE.Group();
  rootGroup.add(group);
  const twinGroup = new THREE.Group();
  const twinChassis = raftChassis.clone();
  twinGroup.add(twinChassis);
  rootGroup.add(twinGroup);

  const interactable: InteractableItem = {
    id: 'fly_sky_explorer',
    kind: 'sky_explorer_fly',
    label: 'Fly SSJ Tropical Sky Explorer',
    sublabel: 'வான்வழி மூங்கில் படகு · Hover & Fly Anywhere',
    x: initial.x,
    y: initial.y,
    z: initial.z,
    radius: 7.5,
    locationId: 'my_home',
  };

  group.position.set(initial.x, initial.y, initial.z);
  group.rotation.y = initial.heading;

  const sync = (state: SkyExplorerState, elapsed: number, playerSeated: boolean) => {
    const hoverBob = Math.sin(elapsed * 2.7) * 0.16;
    group.position.set(state.x, state.y + hoverBob, state.z);
    group.rotation.y = state.heading;
    raftChassis.rotation.z = state.roll;
    raftChassis.rotation.x = state.pitch;

    // Park the twin SSJ Sky Explorer on the opposite rooftop helipad so BOTH houses have one!
    const distHome = Math.hypot(state.x - HOME_HELIPAD_POS.x, state.z - HOME_HELIPAD_POS.z);
    const distAvs = Math.hypot(state.x - AVS_HELIPAD_POS.x, state.z - AVS_HELIPAD_POS.z);
    const twinPad = distHome < distAvs ? AVS_HELIPAD_POS : HOME_HELIPAD_POS;
    const twinBob = Math.sin(elapsed * 2.4 + 1.4) * 0.14;
    twinGroup.position.set(twinPad.x, twinPad.y + 1.55 + twinBob, twinPad.z);
    twinGroup.rotation.y = twinPad.heading;

    steeringWheel.rotation.z = -state.yawRate * 0.65;
    throttleLever.rotation.x = Math.max(-0.35, Math.min(0.45, (state.forwardSpeed / 36) * 0.45));

    const thrustFactor =
      (playerSeated ? 1.15 : 0.45) +
      Math.abs(state.forwardSpeed) * 0.055 +
      (state.verticalSpeed > 1 ? 0.55 : 0) +
      (state.boostActive ? 0.85 : 0);

    for (let i = 0; i < propellers.length; i++) {
      propellers[i].group.rotation.y += propellers[i].dir * 0.28 * thrustFactor;
    }

    for (let i = 0; i < thrusterCones.length; i++) {
      const pulse = 0.84 + Math.sin(elapsed * 22 + i * 1.5) * 0.16;
      const scaleLen = Math.min(1.65, (0.55 + thrustFactor * 0.35) * pulse);
      thrusterCones[i].outer.scale.set(pulse, scaleLen, pulse);
      thrusterCones[i].inner.scale.set(pulse, scaleLen * 0.9, pulse);
    }

    // Animate waving SSJ flag & subtle canopy ripple
    const windSpeed = 6.0 + Math.abs(state.forwardSpeed) * 0.32;
    const fPos = flagGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fPos.count; i++) {
      const fx = fPos.getX(i);
      const distFromMast = Math.abs(fx);
      fPos.setZ(i, Math.sin(elapsed * windSpeed - distFromMast * 2.8) * (distFromMast * 0.14));
    }
    fPos.needsUpdate = true;

    for (let i = 0; i < sailPosAttr.count; i++) {
      const sx = sailPosAttr.getX(i);
      const sz = sailPosAttr.getZ(i);
      sailPosAttr.setY(i, sailBaseY[i] + Math.sin(elapsed * windSpeed * 0.65 + sx * 2 + sz * 2) * 0.032);
    }
    sailPosAttr.needsUpdate = true;

    interactable.x = state.x;
    interactable.y = state.y;
    interactable.z = state.z;
  };

  const getDriverSeatTransform = () => {
    const localPos = new THREE.Vector3(-0.78, 0.72, 0.28);
    raftChassis.updateMatrixWorld(true);
    return {
      position: localPos.applyMatrix4(raftChassis.matrixWorld),
      heading: group.rotation.y,
    };
  };

  const getCompanionSeatTransform = () => {
    const localPos = new THREE.Vector3(0.78, 0.85, 0.25);
    raftChassis.updateMatrixWorld(true);
    return {
      position: localPos.applyMatrix4(raftChassis.matrixWorld),
      heading: group.rotation.y,
    };
  };

  const getFollowAnchor = () => {
    const localPos = new THREE.Vector3(0, 1.8, 0);
    raftChassis.updateMatrixWorld(true);
    return localPos.applyMatrix4(raftChassis.matrixWorld);
  };

  return {
    group: rootGroup,
    interactable,
    sync,
    getDriverSeatTransform,
    getCompanionSeatTransform,
    getFollowAnchor,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
