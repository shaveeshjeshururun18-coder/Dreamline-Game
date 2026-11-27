import * as THREE from 'three';
import type {
  JetSkiModelId,
  JetSkiState,
  SafariJeepState,
  VtolAircraftState,
} from '../game/expeditionVehicles';
import type { DirtBike49ccState } from '../game/dirtBike';
import type { HoverGliderState } from '../game/hoverGlider';
import { createDirtBike49ccRig, type DirtBike49ccRig } from './dirtBike3D';
import { createHoverGliderRig, type HoverGliderRig } from './hoverGlider3D';

interface CanvasMaterialTextures {
  oliveMetal: THREE.CanvasTexture;
  oliveBump: THREE.CanvasTexture;
  walnutWood: THREE.CanvasTexture;
  brushedGoldBump: THREE.CanvasTexture;
  tyreTreadBump: THREE.CanvasTexture;
  cockpitNavTex: THREE.CanvasTexture;
  vtolHudTex: THREE.CanvasTexture;
  contactShadowTex: THREE.CanvasTexture;
}

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  srgb = true,
  repeat = 1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createExpeditionTextures(): CanvasMaterialTextures {
  // 1. Weathered olive-green & sand-beige safari metal with mud speckles & scratches
  const oliveMetal = makeCanvasTex(256, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#6e7652');
    grad.addColorStop(0.55, '#5b6645');
    grad.addColorStop(1, '#4c5439');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle sand dust & mud splatters along lower edge
    for (let i = 0; i < 420; i++) {
      const x = (i * 73) % w;
      const y = ((i * 197) % h);
      const isMud = y > h * 0.58 && i % 3 === 0;
      ctx.fillStyle = isMud ? 'rgba(72, 54, 34, 0.36)' : 'rgba(176, 158, 122, 0.14)';
      ctx.beginPath();
      ctx.arc(x, y, isMud ? 2.8 : 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fine weathered brush scratches
    ctx.strokeStyle = 'rgba(215, 206, 178, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 42; i++) {
      const x = (i * 59) % w;
      const y = (i * 41) % h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14 + (i % 9), y + (i % 3) - 1);
      ctx.stroke();
    }
  }, true);

  const oliveBump = makeCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 360; i++) {
      const x = (i * 47) % w;
      const y = (i * 89) % h;
      ctx.fillStyle = i % 2 === 0 ? '#9e9e9e' : '#646464';
      ctx.fillRect(x, y, 2, 2);
    }
  }, false);

  // 2. Lacquered dark walnut wood grain for VTOL fuselage
  const walnutWood = makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5c331c';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      const wave = Math.sin(y * 0.08) * 14;
      const shade = 48 + Math.round(Math.sin(y * 0.19) * 18 + Math.cos(y * 0.05) * 10);
      ctx.strokeStyle = `rgb(${shade + 44}, ${shade + 12}, ${Math.max(12, shade - 10)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.33, y + wave * 0.3, w * 0.66, y - wave * 0.3, w, y);
      ctx.stroke();
    }
  }, true);

  // 3. Brushed metallic gold micro-grain bump
  const brushedGoldBump = makeCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const v = 116 + ((y * 37) % 28);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, w, 1);
    }
  }, false);

  // 4. Aggressive mud-terrain tyre tread bump
  const tyreTreadBump = makeCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#303030';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8d8d8';
    for (let y = 0; y < h; y += 16) {
      ctx.fillRect(8, y + 2, 46, 9);
      ctx.fillRect(w - 54, y + 8, 46, 9);
      ctx.fillRect(58, y + 4, 12, 8);
    }
  }, false, 2);

  // 5. Jeep Navigation & Instrument Display
  const cockpitNavTex = makeCanvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#0e1714';
    ctx.fillRect(0, 0, w, h);
    // Speedo + Tach rings
    ctx.strokeStyle = '#d9b56c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(54, 64, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(132, 64, 30, 0, Math.PI * 2);
    ctx.stroke();
    // GPS topo map screen
    ctx.fillStyle = '#142a21';
    ctx.fillRect(172, 18, 74, 92);
    ctx.strokeStyle = '#4ad68c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(172, 18, 74, 92);
    ctx.beginPath();
    ctx.moveTo(182, 92);
    ctx.quadraticCurveTo(208, 60, 232, 34);
    ctx.stroke();
    ctx.fillStyle = '#f5c26b';
    ctx.beginPath();
    ctx.arc(209, 62, 4, 0, Math.PI * 2);
    ctx.fill();
  }, true);

  // 6. VTOL Avionics Multi-Function Display
  const vtolHudTex = makeCanvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#071420';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38e8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    // Artificial horizon
    ctx.fillStyle = '#0f3854';
    ctx.fillRect(88, 20, 80, 44);
    ctx.fillStyle = '#3d2a18';
    ctx.fillRect(88, 64, 80, 44);
    ctx.strokeStyle = '#6cf3ff';
    ctx.beginPath();
    ctx.moveTo(88, 64);
    ctx.lineTo(168, 64);
    ctx.stroke();
    // Left & right turbine gauges
    ctx.fillStyle = '#38e8ff';
    ctx.fillRect(18, 30, 14, 72);
    ctx.fillRect(42, 42, 14, 60);
    ctx.fillStyle = '#e8c468';
    ctx.fillRect(190, 28, 44, 16);
    ctx.fillStyle = '#4be89e';
    ctx.fillRect(190, 56, 44, 42);
  }, true);

  // 7. Radial soft contact shadow disc
  const contactShadowTex = makeCanvasTex(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(8, 10, 14, 0.62)');
    g.addColorStop(0.65, 'rgba(8, 10, 14, 0.28)');
    g.addColorStop(1, 'rgba(8, 10, 14, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, true);

  return {
    oliveMetal,
    oliveBump,
    walnutWood,
    brushedGoldBump,
    tyreTreadBump,
    cockpitNavTex,
    vtolHudTex,
    contactShadowTex,
  };
}

export interface SafariJeepRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  wheelPivots: THREE.Group[]; // FL, FR, RL, RR
  wheelMeshes: THREE.Group[];
  steeringWheel: THREE.Group;
  wipers: THREE.Mesh[];
  headlightGlow: THREE.MeshStandardMaterial;
  fogLightGlow: THREE.MeshStandardMaterial;
  leftBlinkMat: THREE.MeshStandardMaterial;
  rightBlinkMat: THREE.MeshStandardMaterial;
  contactShadow: THREE.Mesh;
}

export interface VtolAircraftRig {
  root: THREE.Group;
  hullGroup: THREE.Group;
  leftNacelle: THREE.Group;
  rightNacelle: THREE.Group;
  leftFan: THREE.Group;
  rightFan: THREE.Group;
  landingGearGroup: THREE.Group;
  cyanRingMat: THREE.MeshStandardMaterial;
  contactShadow: THREE.Mesh;
}

export interface JetSkiRig {
  root: THREE.Group;
  hullGroup: THREE.Group;
  handlebarPivot: THREE.Group;
  wakeMesh: THREE.Mesh;
  wakeMat: THREE.MeshBasicMaterial;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  scale: number;
  color: THREE.Color;
}

export interface ExpeditionVehiclesWorld {
  root: THREE.Group;
  jeepRig: SafariJeepRig;
  vtolRig: VtolAircraftRig;
  sportJetSkiRig: JetSkiRig;
  perfJetSkiRig: JetSkiRig;
  dirtBikeRig: DirtBike49ccRig;
  hoverGliderRig: HoverGliderRig;
  update: (params: {
    dt: number;
    elapsed: number;
    jeep: SafariJeepState;
    vtol: VtolAircraftState;
    sportJetSki: JetSkiState;
    perfJetSki: JetSkiState;
    dirtBike?: DirtBike49ccState;
    dirtBikeOccupied?: boolean;
    dirtBikeHideRider?: boolean;
    hoverGlider?: HoverGliderState;
    hoverGliderOccupied?: boolean;
    hoverGliderHideRider?: boolean;
  }) => void;
}

const _dummyObj = new THREE.Object3D();

/**
 * Builds the Off-Road Safari Jeep closely inspired by Reference Image 5:
 * olive-green & sand-beige bodywork, tubular roll cage, canvas roof, large mud tyres,
 * bull bar, headlights/fog lamps/indicators, front winch & tow shackles, snorkel,
 * hood rack + binoculars, leather seats, steering wheel, dashboard & nav screen,
 * rear spare tyre, jerry cans, shovel, and expedition bags.
 */
function buildSafariJeepRig(tex: CanvasMaterialTextures, castShadow: boolean): SafariJeepRig {
  const root = new THREE.Group();
  root.name = 'safari_jeep_expedition';

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const oliveMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.oliveMetal,
    bumpMap: tex.oliveBump,
    bumpScale: 0.035,
    roughness: 0.64,
    metalness: 0.24,
  });
  const sandTrimMat = new THREE.MeshStandardMaterial({
    color: 0xb9aa84,
    bumpMap: tex.oliveBump,
    bumpScale: 0.025,
    roughness: 0.72,
    metalness: 0.14,
  });
  const cageMat = new THREE.MeshStandardMaterial({
    color: 0x253226,
    roughness: 0.42,
    metalness: 0.78,
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e1c,
    roughness: 0.68,
    metalness: 0.55,
  });
  const canvasRoofMat = new THREE.MeshStandardMaterial({
    color: 0x7c7b64,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x6a3c22,
    roughness: 0.52,
    metalness: 0.06,
  });
  const tyreMat = new THREE.MeshStandardMaterial({
    color: 0x1e2021,
    bumpMap: tex.tyreTreadBump,
    bumpScale: 0.08,
    roughness: 0.88,
    metalness: 0.05,
  });
  const alloyRimMat = new THREE.MeshStandardMaterial({
    color: 0x25382c,
    roughness: 0.34,
    metalness: 0.82,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x8d959b,
    roughness: 0.3,
    metalness: 0.88,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdaf0f5,
    transparent: true,
    opacity: 0.34,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const headlightGlow = new THREE.MeshStandardMaterial({
    color: 0xfff5db,
    emissive: 0xffd78c,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const fogLightGlow = new THREE.MeshStandardMaterial({
    color: 0xffefc2,
    emissive: 0xffc864,
    emissiveIntensity: 1.9,
    roughness: 0.18,
  });
  const leftBlinkMat = new THREE.MeshStandardMaterial({
    color: 0xd47d1e,
    emissive: 0xff8c1a,
    emissiveIntensity: 0.2,
    roughness: 0.25,
  });
  const rightBlinkMat = leftBlinkMat.clone();
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xb82424,
    emissive: 0xff2b2b,
    emissiveIntensity: 1.1,
    roughness: 0.25,
  });

  // Heavy-duty ladder frame undercarriage & skid plate
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.24, 3.85), chassisMat);
  chassis.position.set(0, 0.62, 0.02);
  chassis.castShadow = castShadow;
  bodyGroup.add(chassis);

  // Side step rock sliders
  for (const sx of [-0.94, 0.94]) {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.55, 10), cageMat);
    step.rotation.x = Math.PI / 2;
    step.position.set(sx, 0.56, -0.05);
    bodyGroup.add(step);
  }

  // Main lower tub (open-sided doors cut out for authentic open safari cabin!)
  const frontTub = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.62, 1.48), oliveMat);
  frontTub.position.set(0, 1.08, 1.18);
  frontTub.castShadow = castShadow;
  frontTub.receiveShadow = true;
  bodyGroup.add(frontTub);

  // Sculpted sand-olive tapered hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.16, 1.38), sandTrimMat);
  hood.position.set(0, 1.43, 1.16);
  hood.castShadow = castShadow;
  bodyGroup.add(hood);

  // Hood tubular expedition rack + binoculars
  const hoodRack = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 0.72), cageMat);
  hoodRack.position.set(0, 1.54, 1.12);
  bodyGroup.add(hoodRack);
  for (const bx of [-0.07, 0.07]) {
    const bino = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.22, 10), chassisMat);
    bino.rotation.x = Math.PI / 2;
    bino.position.set(bx, 1.59, 1.12);
    bodyGroup.add(bino);
  }

  // Cabin floor & rear cargo tub
  const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.16, 2.38), chassisMat);
  cabinFloor.position.set(0, 0.78, -0.58);
  bodyGroup.add(cabinFloor);

  for (const sx of [-0.82, 0.82]) {
    const rearSide = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 1.32), oliveMat);
    rearSide.position.set(sx, 1.16, -1.16);
    rearSide.castShadow = castShadow;
    bodyGroup.add(rearSide);

    // Open-sided tubular safari half-door guard rails + canvas saddlebag
    const doorBarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.96, 8), cageMat);
    doorBarTop.rotation.x = Math.PI / 2;
    doorBarTop.position.set(sx, 1.12, -0.02);
    bodyGroup.add(doorBarTop);

    const doorBarLow = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.96, 8), cageMat);
    doorBarLow.rotation.x = Math.PI / 2;
    doorBarLow.position.set(sx, 0.92, -0.02);
    bodyGroup.add(doorBarLow);

    const saddleBag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.34), sandTrimMat);
    saddleBag.position.set(sx + (sx > 0 ? 0.08 : -0.08), 1.01, -0.02);
    bodyGroup.add(saddleBag);
  }

  // Tailgate
  const tailgate = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.68, 0.14), oliveMat);
  tailgate.position.set(0, 1.16, -1.82);
  tailgate.castShadow = castShadow;
  bodyGroup.add(tailgate);

  // Flared off-road wheel arches / mud fenders (4 corners)
  const fenderCoords: Array<[number, number]> = [
    [-0.96, 1.36],
    [0.96, 1.36],
    [-0.96, -1.26],
    [0.96, -1.26],
  ];
  for (const [fx, fz] of fenderCoords) {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 1.02), chassisMat);
    fender.position.set(fx, 1.24, fz);
    bodyGroup.add(fender);
  }

  // Iconic 7-slot front radiator grille + headlights + amber indicators
  const grillePlate = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.56, 0.1), oliveMat);
  grillePlate.position.set(0, 1.12, 1.92);
  bodyGroup.add(grillePlate);
  for (let s = -3; s <= 3; s++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.36, 0.12), chassisMat);
    slot.position.set(s * 0.13, 1.12, 1.93);
    bodyGroup.add(slot);
  }
  for (const sx of [-0.58, 0.58]) {
    const hlRing = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.08, 16), chassisMat);
    hlRing.rotation.x = Math.PI / 2;
    hlRing.position.set(sx, 1.16, 1.94);
    bodyGroup.add(hlRing);
    const hlLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 16), headlightGlow);
    hlLens.rotation.x = Math.PI / 2;
    hlLens.position.set(sx, 1.16, 1.95);
    bodyGroup.add(hlLens);

    const indLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.08, 12),
      sx < 0 ? leftBlinkMat : rightBlinkMat
    );
    indLens.rotation.x = Math.PI / 2;
    indLens.position.set(sx, 0.96, 1.95);
    bodyGroup.add(indLens);

    // Rear taillights
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.08), taillightMat);
    tl.position.set(sx * 1.26, 1.18, -1.89);
    bodyGroup.add(tl);
  }

  // Heavy front bumper + bull bar + dual fog lamps + winch drum + twin D-ring tow shackles
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.24, 0.34), chassisMat);
  frontBumper.position.set(0, 0.78, 2.08);
  frontBumper.castShadow = castShadow;
  bodyGroup.add(frontBumper);

  const bullTop = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 1.76, 10), cageMat);
  bullTop.rotation.z = Math.PI / 2;
  bullTop.position.set(0, 1.26, 2.16);
  bodyGroup.add(bullTop);
  for (const bx of [-0.84, -0.36, 0.36, 0.84]) {
    const bullPost = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.52, 8), cageMat);
    bullPost.position.set(bx, 1.02, 2.16);
    bodyGroup.add(bullPost);
  }
  for (const fx of [-0.24, 0.24]) {
    const fogHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 14), chassisMat);
    fogHousing.rotation.x = Math.PI / 2;
    fogHousing.position.set(fx, 1.08, 2.15);
    bodyGroup.add(fogHousing);
    const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.11, 14), fogLightGlow);
    fogLens.rotation.x = Math.PI / 2;
    fogLens.position.set(fx, 1.08, 2.16);
    bodyGroup.add(fogLens);
  }
  // Winch drum & tow hooks
  const winchDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.36, 14), steelMat);
  winchDrum.rotation.z = Math.PI / 2;
  winchDrum.position.set(0, 0.92, 2.14);
  bodyGroup.add(winchDrum);
  for (const hx of [-0.52, 0.52]) {
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 8, 14), steelMat);
    shackle.position.set(hx, 0.72, 2.26);
    bodyGroup.add(shackle);
  }

  // Windshield frame + panoramic glass + wipers + side mirrors + snorkel
  const wsGroup = new THREE.Group();
  wsGroup.position.set(0, 1.48, 0.56);
  wsGroup.rotation.x = -0.22;
  bodyGroup.add(wsGroup);

  const wsGlass = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.64, 0.03), glassMat);
  wsGlass.position.set(0, 0.36, 0);
  wsGroup.add(wsGlass);
  const wsTopBar = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.08, 0.08), cageMat);
  wsTopBar.position.set(0, 0.7, 0);
  wsGroup.add(wsTopBar);
  for (const sx of [-0.79, 0.79]) {
    const wsPillar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.72, 0.09), cageMat);
    wsPillar.position.set(sx, 0.35, 0);
    wsGroup.add(wsPillar);
    // Side mirror
    const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), chassisMat);
    mirrorArm.position.set(sx + (sx > 0 ? 0.1 : -0.1), 0.16, 0.04);
    wsGroup.add(mirrorArm);
    const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.05), chassisMat);
    mirrorHead.position.set(sx + (sx > 0 ? 0.18 : -0.18), 0.2, 0.04);
    wsGroup.add(mirrorHead);
  }
  const wipers: THREE.Mesh[] = [];
  for (const wx of [-0.32, 0.28]) {
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.022, 0.02), chassisMat);
    wiper.position.set(wx, 0.12, 0.035);
    wsGroup.add(wiper);
    wipers.push(wiper);
  }
  // Raised off-road snorkel along passenger A-pillar
  const snorkelTube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.92, 10), chassisMat);
  snorkelTube.position.set(-0.88, 1.72, 0.66);
  snorkelTube.rotation.x = -0.22;
  bodyGroup.add(snorkelTube);
  const snorkelHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.16), chassisMat);
  snorkelHead.position.set(-0.88, 2.16, 0.56);
  bodyGroup.add(snorkelHead);

  // Heavy-duty tubular roll cage + draped safari canvas roof
  const pillarPositions: Array<[number, number]> = [
    [-0.78, -0.45],
    [0.78, -0.45],
    [-0.78, -1.72],
    [0.78, -1.72],
  ];
  for (const [px, pz] of pillarPositions) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.92, 8), cageMat);
    post.position.set(px, 1.72, pz);
    bodyGroup.add(post);
  }
  for (const sx of [-0.78, 0.78]) {
    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 2.18, 8), cageMat);
    topRail.rotation.x = Math.PI / 2;
    topRail.position.set(sx, 2.16, -0.64);
    bodyGroup.add(topRail);
  }
  for (const rz of [0.36, -0.45, -1.72]) {
    const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 1.58, 8), cageMat);
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, 2.16, rz);
    bodyGroup.add(crossBar);
  }
  // Canvas bikini safari roof over front & mid cabin
  const canvasRoof = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.04, 1.32), canvasRoofMat);
  canvasRoof.position.set(0, 2.19, -0.2);
  canvasRoof.castShadow = castShadow;
  bodyGroup.add(canvasRoof);

  // Detailed Interior: Dashboard + Glowing Instrument Cluster + Nav Display + Steering Wheel + Leather Seats + Gear Stick
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.34, 0.42), chassisMat);
  dash.position.set(0, 1.32, 0.44);
  bodyGroup.add(dash);

  const dashDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(1.12, 0.24),
    new THREE.MeshBasicMaterial({ map: tex.cockpitNavTex })
  );
  dashDisplay.position.set(0.06, 1.34, 0.22);
  dashDisplay.rotation.y = Math.PI;
  bodyGroup.add(dashDisplay);

  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(0.38, 1.32, 0.16);
  steeringWheel.rotation.x = 0.42;
  const swRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.024, 10, 22), leatherMat);
  steeringWheel.add(swRim);
  const swHub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12), chassisMat);
  swHub.rotation.x = Math.PI / 2;
  steeringWheel.add(swHub);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.02), steelMat);
    spoke.rotation.z = (i * Math.PI * 2) / 3;
    spoke.position.set(Math.sin((i * Math.PI * 2) / 3) * -0.07, Math.cos((i * Math.PI * 2) / 3) * 0.07, 0);
    steeringWheel.add(spoke);
  }
  bodyGroup.add(steeringWheel);

  // Gear selector & transfer-case 4WD lever
  const gearStick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.34, 8), steelMat);
  gearStick.position.set(0.02, 1.04, 0.12);
  gearStick.rotation.x = -0.18;
  bodyGroup.add(gearStick);
  const gearKnob = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), leatherMat);
  gearKnob.position.set(0.02, 1.21, 0.08);
  bodyGroup.add(gearKnob);

  // 4 Leather Safari Seats (2 front buckets + rear bench)
  for (const sx of [-0.4, 0.4]) {
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.52), leatherMat);
    cushion.position.set(sx, 0.96, -0.22);
    bodyGroup.add(cushion);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.12), leatherMat);
    backrest.position.set(sx, 1.32, -0.45);
    backrest.rotation.x = -0.14;
    bodyGroup.add(backrest);
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.1), leatherMat);
    headrest.position.set(sx, 1.7, -0.49);
    bodyGroup.add(headrest);
  }
  const rearSeat = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.14, 0.48), leatherMat);
  rearSeat.position.set(0, 0.98, -1.12);
  bodyGroup.add(rearSeat);
  const rearBack = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.54, 0.12), leatherMat);
  rearBack.position.set(0, 1.3, -1.36);
  bodyGroup.add(rearBack);

  // Expedition Gear: Side Jerry Fuel Cans, Shovel, Cargo Duffels & Rear Spare Tyre
  for (const jz of [-1.05, -1.42]) {
    const jerryCan = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.28), oliveMat);
    jerryCan.position.set(0.95, 1.38, jz);
    bodyGroup.add(jerryCan);
  }
  const shovelHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 8), sandTrimMat);
  shovelHandle.rotation.x = Math.PI / 2;
  shovelHandle.position.set(1.06, 1.24, -1.24);
  bodyGroup.add(shovelHandle);
  const shovelBlade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.22), chassisMat);
  shovelBlade.position.set(1.06, 1.24, -1.72);
  bodyGroup.add(shovelBlade);

  // Rear cargo duffels
  const duffel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.62, 10), sandTrimMat);
  duffel1.rotation.z = Math.PI / 2;
  duffel1.position.set(-0.22, 1.12, -1.56);
  bodyGroup.add(duffel1);
  const duffel2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.36), canvasRoofMat);
  duffel2.position.set(0.34, 1.12, -1.54);
  bodyGroup.add(duffel2);

  // External rear-mounted spare tyre
  const spareWheel = new THREE.Group();
  spareWheel.position.set(0, 1.22, -2.02);
  const spareTyre = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.16, 12, 22), tyreMat);
  spareWheel.add(spareTyre);
  const spareRim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 14), alloyRimMat);
  spareRim.rotation.x = Math.PI / 2;
  spareWheel.add(spareRim);
  bodyGroup.add(spareWheel);

  // 4 Articulated Off-Road Mud Wheels + Visible Coil Suspension Struts
  const wheelPivots: THREE.Group[] = [];
  const wheelMeshes: THREE.Group[] = [];
  const wheelCoords: Array<[number, number]> = [
    [-0.96, 1.38], // FL
    [0.96, 1.38],  // FR
    [-0.96, -1.28], // RL
    [0.96, -1.28],  // RR
  ];

  for (const [wx, wz] of wheelCoords) {
    // Coil spring strut connecting body to axle
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 8), steelMat);
    strut.position.set(wx * 0.78, 0.78, wz);
    bodyGroup.add(strut);

    const pivot = new THREE.Group();
    pivot.position.set(wx, 0.52, wz);
    root.add(pivot);

    const wheelGroup = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.36, 22), tyreMat);
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = castShadow;
    wheelGroup.add(tyre);

    // Sculpted deep alloy rim + hub bolts
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.38, 16), alloyRimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.41, 10), steelMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    pivot.add(wheelGroup);
    wheelPivots.push(pivot);
    wheelMeshes.push(wheelGroup);
  }

  // Contact shadow grounding plane
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 5.2),
    new THREE.MeshBasicMaterial({
      map: tex.contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.03;
  root.add(contactShadow);

  return {
    root,
    bodyGroup,
    wheelPivots,
    wheelMeshes,
    steeringWheel,
    wipers,
    headlightGlow,
    fogLightGlow,
    leftBlinkMat,
    rightBlinkMat,
    contactShadow,
  };
}

/**
 * Builds the Advanced Gold / Bronze / Walnut Wood VTOL Aircraft inspired by Reference Image 1:
 * aerodynamic tapered fuselage, two large circular wingtip ducted-fan propulsion units with
 * glowing cyan rings & spinning rotor blades, panoramic multi-ribbed glass cockpit with
 * illuminated digital flight displays, dorsal canopy dome, twin-cant tail fins, and retractable gear.
 */
function buildVtolAircraftRig(tex: CanvasMaterialTextures, castShadow: boolean): VtolAircraftRig {
  const root = new THREE.Group();
  root.name = 'vtol_aircraft_expedition';

  const hullGroup = new THREE.Group();
  hullGroup.position.y = 1.15;
  root.add(hullGroup);

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xd9b366,
    bumpMap: tex.brushedGoldBump,
    bumpScale: 0.015,
    metalness: 0.88,
    roughness: 0.24,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
  });
  const bronzeMat = new THREE.MeshPhysicalMaterial({
    color: 0x8c6236,
    bumpMap: tex.brushedGoldBump,
    bumpScale: 0.02,
    metalness: 0.84,
    roughness: 0.32,
  });
  const walnutMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tex.walnutWood,
    roughness: 0.26,
    metalness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x20262c,
    roughness: 0.44,
    metalness: 0.78,
  });
  const canopyGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x162b38,
    transparent: true,
    opacity: 0.68,
    roughness: 0.06,
    metalness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    depthWrite: false,
  });
  const cyanRingMat = new THREE.MeshStandardMaterial({
    color: 0x7ef8ff,
    emissive: 0x22e8ff,
    emissiveIntensity: 2.6,
    roughness: 0.12,
    metalness: 0.2,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3621,
    roughness: 0.52,
    metalness: 0.05,
  });

  // Main aerodynamic fuselage spine (walnut hull + brushed gold chine trim)
  const mainBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.92, 2.8, 12, 22), walnutMat);
  mainBody.rotation.x = Math.PI / 2;
  mainBody.scale.set(0.95, 1.0, 0.86);
  mainBody.castShadow = castShadow;
  hullGroup.add(mainBody);

  // Gold lower keel & nose collar
  const keel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.34, 3.6), goldMat);
  keel.position.set(0, -0.58, 0.15);
  hullGroup.add(keel);

  const noseCone = new THREE.Mesh(new THREE.SphereGeometry(0.84, 20, 16), goldMat);
  noseCone.scale.set(0.92, 0.62, 1.25);
  noseCone.position.set(0, -0.14, 1.98);
  noseCone.castShadow = castShadow;
  hullGroup.add(noseCone);

  // Nose airspeed pitot probe
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.65, 8), goldMat);
  pitot.rotation.x = Math.PI / 2;
  pitot.position.set(0, -0.34, 3.15);
  hullGroup.add(pitot);

  // Panoramic curved cockpit canopy with gold structural mullions
  const cockpitGlass = new THREE.Mesh(new THREE.SphereGeometry(0.86, 22, 16), canopyGlassMat);
  cockpitGlass.scale.set(0.92, 0.68, 1.48);
  cockpitGlass.position.set(0, 0.24, 1.42);
  cockpitGlass.renderOrder = 4;
  hullGroup.add(cockpitGlass);

  // Gold canopy mullions (arched ribs matching Ref 1)
  for (const rz of [0.95, 1.52, 2.02]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.032, 8, 20, Math.PI), goldMat);
    rib.position.set(0, 0.16, rz);
    rib.scale.set(0.98, 0.72, 1.0);
    hullGroup.add(rib);
  }
  const centerMullion = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 1.68), goldMat);
  centerMullion.position.set(0, 0.72, 1.44);
  centerMullion.rotation.x = 0.28;
  hullGroup.add(centerMullion);

  // Interior Cockpit (Pilot + Passenger Seats + Illuminated Digital Flight MFDs!)
  for (const sx of [-0.3, 0.3]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.38), leatherMat);
    seat.position.set(sx, 0.08, 1.15);
    hullGroup.add(seat);
  }
  const avionicsConsole = new THREE.Mesh(
    new THREE.PlaneGeometry(1.06, 0.36),
    new THREE.MeshBasicMaterial({ map: tex.vtolHudTex })
  );
  avionicsConsole.position.set(0, 0.24, 1.92);
  avionicsConsole.rotation.y = Math.PI;
  avionicsConsole.rotation.x = 0.25;
  hullGroup.add(avionicsConsole);

  // Dorsal glass observation dome behind cockpit
  const dorsalDome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), canopyGlassMat);
  dorsalDome.scale.set(0.88, 0.56, 1.25);
  dorsalDome.position.set(0, 0.84, -0.05);
  hullGroup.add(dorsalDome);
  const dorsalRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 20), goldMat);
  dorsalRing.rotation.x = Math.PI / 2;
  dorsalRing.scale.set(0.88, 1.25, 1);
  dorsalRing.position.set(0, 0.74, -0.05);
  hullGroup.add(dorsalRing);

  // Side mechanical brass turbine gears & cyan accent strips
  for (const sx of [-0.9, 0.9]) {
    const mechGear = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16), bronzeMat);
    mechGear.rotation.z = Math.PI / 2;
    mechGear.position.set(sx, -0.05, 0.35);
    hullGroup.add(mechGear);
    const sideGlow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 1.25), cyanRingMat);
    sideGlow.position.set(sx + (sx > 0 ? 0.04 : -0.04), -0.32, 0.3);
    hullGroup.add(sideGlow);
  }

  // Swept Wings (Gold leading edges + dark walnut wood deck panels)
  for (const side of [-1, 1]) {
    const wingGold = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.38), goldMat);
    wingGold.position.set(side * 1.62, 0.26, 0.18);
    wingGold.rotation.y = side * -0.14;
    wingGold.castShadow = castShadow;
    hullGroup.add(wingGold);

    const wingWood = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.2, 1.02), walnutMat);
    wingWood.position.set(side * 1.6, 0.26, 0.18);
    wingWood.rotation.y = side * -0.14;
    hullGroup.add(wingWood);
  }

  // Twin Large Circular Wingtip Ducted-Fan Propulsion Nacelles (tiltable for VTOL -> Cruise!)
  const makeDuctedFan = (side: -1 | 1): { nacelle: THREE.Group; fan: THREE.Group } => {
    const nacelle = new THREE.Group();
    nacelle.position.set(side * 3.15, 0.26, 0.04);
    hullGroup.add(nacelle);

    // Outer gold protective shroud ring
    const outerShroud = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.14, 14, 32), goldMat);
    outerShroud.rotation.x = Math.PI / 2;
    outerShroud.castShadow = castShadow;
    nacelle.add(outerShroud);

    // Walnut wood outer band around shroud
    const woodBand = new THREE.Mesh(
      new THREE.CylinderGeometry(1.31, 1.31, 0.2, 32, 1, true),
      walnutMat
    );
    nacelle.add(woodBand);

    // Glowing cyan stator energy ring (outer & inner — iconic look from Ref 1!)
    const cyanOuter = new THREE.Mesh(new THREE.TorusGeometry(1.31, 0.032, 8, 32), cyanRingMat);
    cyanOuter.rotation.x = Math.PI / 2;
    nacelle.add(cyanOuter);
    const cyanInner = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.036, 8, 32), cyanRingMat);
    cyanInner.rotation.x = Math.PI / 2;
    nacelle.add(cyanInner);

    // Cross structural stator struts
    const strutA = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.08, 0.12), bronzeMat);
    strutA.position.y = -0.06;
    nacelle.add(strutA);
    const strutB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 2.12), bronzeMat);
    strutB.position.y = -0.06;
    nacelle.add(strutB);

    // Spinning 4-blade aerodynamic rotor fan
    const fan = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.26, 14), goldMat);
    fan.add(hub);
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.94), darkMetalMat);
      const ang = (b * Math.PI) / 2;
      blade.position.set(Math.sin(ang) * 0.5, 0.02, Math.cos(ang) * 0.5);
      blade.rotation.y = ang;
      blade.rotation.z = 0.24;
      fan.add(blade);
    }
    nacelle.add(fan);

    // Wingtip Navigation Lights (Red Port / Green Starboard)
    const navLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 10, 10),
      new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff3b3b : 0x3bff78 })
    );
    navLight.position.set(side * 1.34, 0.04, 0.15);
    nacelle.add(navLight);

    return { nacelle, fan };
  };

  const leftDuct = makeDuctedFan(-1);
  const rightDuct = makeDuctedFan(1);

  // Tapered Tail Boom + Central Vertical Stabilizer + Twin Cant Winglet Fins
  const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.72, 2.8, 16), walnutMat);
  tailBoom.rotation.x = Math.PI / 2;
  tailBoom.position.set(0, 0.12, -2.55);
  tailBoom.castShadow = castShadow;
  hullGroup.add(tailBoom);

  const horizStab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.72), goldMat);
  horizStab.position.set(0, 0.24, -3.52);
  hullGroup.add(horizStab);

  const vertFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.38, 0.92), walnutMat);
  vertFin.position.set(0, 0.88, -3.45);
  vertFin.rotation.x = -0.26;
  hullGroup.add(vertFin);
  const vertTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), goldMat);
  vertTrim.position.set(0, 0.88, -3.02);
  vertTrim.rotation.x = -0.26;
  hullGroup.add(vertTrim);

  for (const side of [-1, 1]) {
    const tipFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.62), goldMat);
    tipFin.position.set(side * 1.38, 0.54, -3.52);
    tipFin.rotation.z = side * -0.14;
    hullGroup.add(tipFin);
  }

  // Retractable Tricycle Landing Gear
  const landingGearGroup = new THREE.Group();
  hullGroup.add(landingGearGroup);
  const gearCoords: Array<[number, number]> = [
    [0, 1.65],
    [-0.95, -0.35],
    [0.95, -0.35],
  ];
  for (const [gx, gz] of gearCoords) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.68, 8), bronzeMat);
    strut.position.set(gx, -0.82, gz);
    landingGearGroup.add(strut);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 14), darkMetalMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(gx, -1.04, gz);
    landingGearGroup.add(wheel);
  }

  // Contact shadow disc
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 6.8),
    new THREE.MeshBasicMaterial({
      map: tex.contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.04;
  root.add(contactShadow);

  return {
    root,
    hullGroup,
    leftNacelle: leftDuct.nacelle,
    rightNacelle: rightDuct.nacelle,
    leftFan: leftDuct.fan,
    rightFan: rightDuct.fan,
    landingGearGroup,
    cyanRingMat,
    contactShadow,
  };
}

/**
 * Builds either Model A (Sport Yellow-and-Black Jet Ski, Ref 3)
 * or Model B (High-Performance Kawasaki-inspired Green-and-Black Jet Ski, Ref 2).
 */
function buildJetSkiRig(
  model: JetSkiModelId,
  tex: CanvasMaterialTextures,
  castShadow: boolean
): JetSkiRig {
  const root = new THREE.Group();
  root.name = `jetski_${model}`;

  const hullGroup = new THREE.Group();
  root.add(hullGroup);

  const isSport = model === 'sport_yellow';
  const accentColor = isSport ? 0xd9ec18 : 0x26c744;

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    roughness: 0.14,
    metalness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const blackHullMat = new THREE.MeshPhysicalMaterial({
    color: 0x16191e,
    roughness: 0.24,
    metalness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const matteDeckMat = new THREE.MeshStandardMaterial({
    color: 0x24282f,
    bumpMap: tex.oliveBump,
    bumpScale: 0.03,
    roughness: 0.84,
    metalness: 0.08,
  });
  const seatLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1c1f24,
    roughness: 0.62,
    metalness: 0.06,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xc2ccd6,
    roughness: 0.18,
    metalness: 0.92,
  });

  // Lower Deep-V Marine Hull
  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.34, 2.85), blackHullMat);
  lowerHull.position.set(0, 0.16, 0.02);
  lowerHull.castShadow = castShadow;
  hullGroup.add(lowerHull);

  // Tapered aggressive bow prow
  const bowCone = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.18, 4), blackHullMat);
  bowCone.rotation.x = Math.PI / 2;
  bowCone.rotation.z = Math.PI / 4;
  bowCone.scale.set(1.08, 1.0, 0.48);
  bowCone.position.set(0, 0.22, 1.72);
  hullGroup.add(bowCone);

  // Upper sculpted aerodynamic painted cowl (Yellow for Model A, Emerald Green for Model B)
  const upperCowl = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.28, 1.52), paintMat);
  upperCowl.position.set(0, 0.44, 0.56);
  upperCowl.rotation.x = 0.08;
  upperCowl.castShadow = castShadow;
  hullGroup.add(upperCowl);

  const bowHood = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.08, 4), paintMat);
  bowHood.rotation.x = Math.PI / 2;
  bowHood.rotation.z = Math.PI / 4;
  bowHood.scale.set(1.04, 1.0, 0.38);
  bowHood.position.set(0, 0.42, 1.66);
  hullGroup.add(bowHood);

  // Side racing accent stripes (branding-free!)
  for (const sx of [-0.57, 0.57]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 2.24), paintMat);
    stripe.position.set(sx, 0.26, -0.04);
    hullGroup.add(stripe);
    // Textured footrest footwells
    const footwell = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 1.32), matteDeckMat);
    footwell.position.set(sx * 0.68, 0.35, -0.42);
    hullGroup.add(footwell);
  }

  // Ergonomic Bolster Seat (Two-person stepped bolster on Sport Yellow; sleek solo sport saddle on Perf Green)
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.24, 1.24), seatLeatherMat);
  seatBase.position.set(0, 0.56, -0.36);
  hullGroup.add(seatBase);

  if (isSport) {
    // Two-tone yellow/black stepped two-person bolster cushions matching Ref 3
    const frontAccent = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.52), paintMat);
    frontAccent.position.set(0, 0.68, -0.14);
    hullGroup.add(frontAccent);
    const rearStep = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), paintMat);
    rearStep.position.set(0, 0.74, -0.68);
    hullGroup.add(rearStep);
    // Rear passenger grab rail
    const grabBar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 14, Math.PI), blackHullMat);
    grabBar.rotation.x = Math.PI / 2;
    grabBar.rotation.z = Math.PI;
    grabBar.position.set(0, 0.62, -1.04);
    hullGroup.add(grabBar);
  } else {
    // High-performance raised cowl arm & aggressive green racing cowl matching Ref 2
    const cowlSpine = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.96), paintMat);
    cowlSpine.position.set(0, 0.72, 0.62);
    cowlSpine.rotation.x = -0.34;
    hullGroup.add(cowlSpine);
  }

  // Steering Column + Digital Marine Dashboard + Pivoting Handlebars & Throttle Grips
  const dashPod = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.14),
    new THREE.MeshBasicMaterial({ map: tex.vtolHudTex })
  );
  dashPod.position.set(0, 0.76, 0.68);
  dashPod.rotation.y = Math.PI;
  dashPod.rotation.x = 0.48;
  hullGroup.add(dashPod);

  const handlebarPivot = new THREE.Group();
  handlebarPivot.position.set(0, isSport ? 0.84 : 0.92, 0.48);
  hullGroup.add(handlebarPivot);

  const barStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.28, 10), blackHullMat);
  barStem.position.y = -0.1;
  handlebarPivot.add(barStem);

  const barWidth = isSport ? 0.68 : 0.82;
  const barTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, barWidth, 10), chromeMat);
  barTube.rotation.z = Math.PI / 2;
  handlebarPivot.add(barTube);

  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 10), seatLeatherMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(sx * (barWidth * 0.48), 0, -0.02);
    handlebarPivot.add(grip);

    // Side wing mirrors on Sport model
    if (isSport) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.06), blackHullMat);
      mirror.position.set(sx * 0.46, -0.14, 0.34);
      hullGroup.add(mirror);
    }
  }

  // Rear Hydro-Jet Propulsion Nozzle & Water Intake Grate
  const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.32, 12), chromeMat);
  jetNozzle.rotation.x = Math.PI / 2;
  jetNozzle.position.set(0, 0.16, -1.48);
  hullGroup.add(jetNozzle);

  // Dynamic V-Wake Ribbon trailing behind Jet Ski
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xeaf8ff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wakeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 8.5), wakeMat);
  wakeMesh.rotation.x = -Math.PI / 2;
  wakeMesh.position.set(0, 0.05, -5.2);
  root.add(wakeMesh);

  return {
    root,
    hullGroup,
    handlebarPivot,
    wakeMesh,
    wakeMat,
  };
}

/**
 * Mounts all 4 flagship expedition vehicles (Safari Jeep, Gold/Wood VTOL Aircraft,
 * Sport Yellow Jet Ski, High-Perf Green Jet Ski) + zero-GC pooled mud/dust/water-spray particles.
 */
export function createExpeditionVehiclesWorld(castShadow: boolean): ExpeditionVehiclesWorld {
  const root = new THREE.Group();
  root.name = 'expedition_vehicles_world';

  const tex = createExpeditionTextures();
  const jeepRig = buildSafariJeepRig(tex, castShadow);
  const vtolRig = buildVtolAircraftRig(tex, castShadow);
  const sportJetSkiRig = buildJetSkiRig('sport_yellow', tex, castShadow);
  const perfJetSkiRig = buildJetSkiRig('perf_green', tex, castShadow);
  const dirtBikeRig = createDirtBike49ccRig(castShadow);
  const hoverGliderRig = createHoverGliderRig();

  root.add(
    jeepRig.root,
    vtolRig.root,
    sportJetSkiRig.root,
    perfJetSkiRig.root,
    dirtBikeRig.root,
    hoverGliderRig.group
  );

  // Pooled zero-GC InstancedMesh for mud splashes, dust plumes, water spray & VTOL downwash
  const MAX_PARTICLES = 140;
  const particleGeo = new THREE.IcosahedronGeometry(0.18, 0);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
  particleMesh.frustumCulled = false;
  root.add(particleMesh);

  const pool: ParticleSlot[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({
      active: false,
      x: 0,
      y: -99,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      life: 1,
      scale: 0.01,
      color: new THREE.Color(0xffffff),
    });
    _dummyObj.position.set(0, -99, 0);
    _dummyObj.scale.setScalar(0.001);
    _dummyObj.updateMatrix();
    particleMesh.setMatrixAt(i, _dummyObj.matrix);
    particleMesh.setColorAt(i, pool[i].color);
  }
  particleMesh.instanceMatrix.needsUpdate = true;
  if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;

  let nextSlot = 0;
  let emitAccum = 0;
  const emitParticle = (
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    life: number,
    scale: number,
    hexColor: number
  ) => {
    const p = pool[nextSlot];
    nextSlot = (nextSlot + 1) % MAX_PARTICLES;
    p.active = true;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.age = 0;
    p.life = life;
    p.scale = scale;
    p.color.setHex(hexColor);
  };

  const update = (params: {
    dt: number;
    elapsed: number;
    jeep: SafariJeepState;
    vtol: VtolAircraftState;
    sportJetSki: JetSkiState;
    perfJetSki: JetSkiState;
    dirtBike?: DirtBike49ccState;
    dirtBikeOccupied?: boolean;
    dirtBikeHideRider?: boolean;
    hoverGlider?: HoverGliderState;
    hoverGliderOccupied?: boolean;
    hoverGliderHideRider?: boolean;
  }) => {
    const {
      dt,
      elapsed,
      jeep,
      vtol,
      sportJetSki,
      perfJetSki,
      dirtBike,
      dirtBikeOccupied,
      dirtBikeHideRider,
      hoverGlider,
      hoverGliderOccupied,
      hoverGliderHideRider,
    } = params;
    const safeDt = Math.min(Math.max(dt, 0.001), 0.05);

    // --- 1. Safari Jeep Rig ---
    jeepRig.root.position.set(jeep.x, jeep.y, jeep.z);
    jeepRig.root.rotation.y = jeep.heading;
    jeepRig.bodyGroup.rotation.x = jeep.suspensionPitch;
    jeepRig.bodyGroup.rotation.z = jeep.suspensionRoll;

    for (let i = 0; i < 4; i++) {
      const comp = jeep.wheelCompression[i] ?? 0;
      jeepRig.wheelPivots[i].position.y = 0.52 + comp * 0.65;
      if (i < 2) {
        jeepRig.wheelPivots[i].rotation.y = jeep.steerAngle;
      }
      jeepRig.wheelMeshes[i].rotation.x = jeep.wheelSpin;
    }
    jeepRig.steeringWheel.rotation.z = jeep.steerAngle * 2.4;

    // Animated windshield wipers in rain
    const wiperSwing = jeep.wipersActive ? Math.sin(elapsed * 5.2) * 0.42 : 0;
    for (const w of jeepRig.wipers) {
      w.rotation.z = wiperSwing;
    }

    // Functional headlights, fog lamps & amber turn indicators
    jeepRig.headlightGlow.emissiveIntensity = jeep.headlightsOn ? 2.2 : 0.15;
    jeepRig.fogLightGlow.emissiveIntensity = jeep.fogLampsOn ? 1.9 : 0.1;
    const blinkOn = Math.floor(elapsed * 4.2) % 2 === 0;
    jeepRig.leftBlinkMat.emissiveIntensity = jeep.leftIndicator && blinkOn ? 2.6 : 0.15;
    jeepRig.rightBlinkMat.emissiveIntensity = jeep.rightIndicator && blinkOn ? 2.6 : 0.15;

    // --- 2. Advanced VTOL Aircraft Rig ---
    vtolRig.root.position.set(vtol.x, vtol.y, vtol.z);
    vtolRig.root.rotation.y = vtol.heading;
    vtolRig.hullGroup.rotation.x = vtol.pitch;
    vtolRig.hullGroup.rotation.z = vtol.roll;

    // Smooth circular ducted-fan nacelle tilt (0° vertical hover -> 78° horizontal forward cruise)
    const tiltRad = vtol.nacelleTilt * 1.36;
    vtolRig.leftNacelle.rotation.x = tiltRad;
    vtolRig.rightNacelle.rotation.x = tiltRad;
    vtolRig.leftFan.rotation.y = vtol.rotorAngle;
    vtolRig.rightFan.rotation.y = -vtol.rotorAngle;
    vtolRig.cyanRingMat.emissiveIntensity = 1.6 + vtol.throttle * 2.2;

    // Retractable landing gear
    vtolRig.landingGearGroup.scale.y = Math.max(0.05, vtol.landingGearProgress);
    vtolRig.landingGearGroup.visible = vtol.landingGearProgress > 0.08;
    // Ground contact shadow fades smoothly with altitude
    const shadowFade = Math.max(0, 1 - vtol.aglM / 22);
    vtolRig.contactShadow.position.y = -vtol.aglM + 0.04;
    (vtolRig.contactShadow.material as THREE.MeshBasicMaterial).opacity = 0.5 * shadowFade;

    // --- 3. Dual Jet Ski Rigs ---
    const updateSki = (rig: JetSkiRig, ski: JetSkiState) => {
      rig.root.position.set(ski.x, ski.y, ski.z);
      rig.root.rotation.y = ski.heading;
      rig.hullGroup.rotation.x = ski.bowPitch;
      rig.hullGroup.rotation.z = ski.leanRoll;
      rig.handlebarPivot.rotation.y = ski.steerAngle * 0.72;
      const wakeAlpha = Math.min(0.62, ski.sprayIntensity * 0.7);
      rig.wakeMat.opacity = wakeAlpha;
      rig.wakeMesh.scale.set(0.8 + ski.sprayIntensity * 0.65, 0.5 + ski.sprayIntensity * 1.15, 1);
    };
    updateSki(sportJetSkiRig, sportJetSki);
    updateSki(perfJetSkiRig, perfJetSki);

    // --- 3b. 49cc Petrol Powered Dirt Bike Rig (Orion Mini) ---
    if (dirtBike) {
      dirtBikeRig.update(dirtBike, safeDt, elapsed, Boolean(dirtBikeOccupied), Boolean(dirtBikeHideRider));
    }

    // --- 3c. Aero-Ti Brushed Titanium & Matte Carbon Hoverboard Glider ---
    if (hoverGlider) {
      hoverGliderRig.update(
        hoverGlider,
        safeDt,
        elapsed,
        Boolean(hoverGliderOccupied),
        Boolean(hoverGliderHideRider)
      );
    }

    // --- 4. Pooled Mud / Dust / Water Spray / VTOL Downwash Particles ---
    emitAccum += safeDt;
    if (emitAccum >= 0.045) {
      emitAccum = 0;

      // Jeep mud & dust plumes behind rear tyres
      const jeepIntensity = Math.max(jeep.mudSplashIntensity, jeep.dustIntensity);
      if (jeepIntensity > 0.12) {
        const sinH = Math.sin(jeep.heading);
        const cosH = Math.cos(jeep.heading);
        const isMud = jeep.mudSplashIntensity > jeep.dustIntensity;
        const pColor = isMud ? 0x5c4329 : jeep.surface === 'sand' ? 0xd8c394 : 0xb5a68a;
        for (const side of [-0.95, 0.95]) {
          const px = jeep.x + cosH * side - sinH * 1.5;
          const pz = jeep.z - sinH * side - cosH * 1.5;
          emitParticle(
            px,
            jeep.y + 0.25,
            pz,
            -sinH * 2.2 + (Math.random() - 0.5) * 1.5,
            1.4 + Math.random() * 1.8 * jeepIntensity,
            -cosH * 2.2 + (Math.random() - 0.5) * 1.5,
            0.55 + Math.random() * 0.35,
            0.6 + jeepIntensity * 1.1,
            pColor
          );
        }
      }

      // Jet Ski water spray rooster-tail & side splashes
      for (const ski of [sportJetSki, perfJetSki]) {
        if (ski.sprayIntensity > 0.14) {
          const sinH = Math.sin(ski.heading);
          const cosH = Math.cos(ski.heading);
          for (let k = 0; k < 2; k++) {
            const side = k === 0 ? -0.55 : 0.55;
            emitParticle(
              ski.x + cosH * side - sinH * 1.35,
              ski.y + 0.18,
              ski.z - sinH * side - cosH * 1.35,
              cosH * side * 2.4 - sinH * 3.0,
              1.6 + ski.sprayIntensity * 2.4,
              -sinH * side * 2.4 - cosH * 3.0,
              0.48 + Math.random() * 0.3,
              0.55 + ski.sprayIntensity * 0.95,
              0xe8f9ff
            );
          }
        }
      }

      // 49cc Dirt Bike knobby tire dirt/sand roost plumes when tearing off-road
      if (dirtBike && dirtBike.dustIntensity > 0.14) {
        const sinH = Math.sin(dirtBike.heading);
        const cosH = Math.cos(dirtBike.heading);
        const roostColor = dirtBike.surface === 'sand' ? 0xd8c394 : dirtBike.surface === 'mud' ? 0x5c4329 : 0xa68a64;
        emitParticle(
          dirtBike.x - sinH * 0.72,
          dirtBike.y + 0.18,
          dirtBike.z - cosH * 0.72,
          -sinH * 2.4 + (Math.random() - 0.5) * 0.9,
          1.1 + dirtBike.dustIntensity * 1.4,
          -cosH * 2.4 + (Math.random() - 0.5) * 0.9,
          0.42 + Math.random() * 0.25,
          0.35 + dirtBike.dustIntensity * 0.55,
          roostColor
        );
      }

      // VTOL ground-effect rotor downwash mist when hovering low
      if (!vtol.onGround && vtol.aglM < 12 && vtol.throttle > 0.35) {
        const ang = Math.random() * Math.PI * 2;
        emitParticle(
          vtol.x + Math.cos(ang) * 2.2,
          vtol.y - vtol.aglM + 0.25,
          vtol.z + Math.sin(ang) * 2.2,
          Math.cos(ang) * 4.5,
          0.6,
          Math.sin(ang) * 4.5,
          0.55,
          1.2,
          0xc8e8f2
        );
      }

      // Aero-Ti Hoverboard Glider twin rear miniature jet-turbine cyan ion trails
      if (hoverGlider && hoverGliderOccupied && (hoverGlider.speed > 3.0 || hoverGlider.boostActive)) {
        const sinH = Math.sin(hoverGlider.heading);
        const cosH = Math.cos(hoverGlider.heading);
        const trailCol = hoverGlider.boostActive ? 0x8cfaff : 0x35e4ff;
        for (const side of [-0.28, 0.28]) {
          emitParticle(
            hoverGlider.x + cosH * side - sinH * 1.25,
            hoverGlider.y - 0.04,
            hoverGlider.z - sinH * side - cosH * 1.25,
            -sinH * 4.5 + (Math.random() - 0.5) * 0.4,
            0.35 + (Math.random() - 0.5) * 0.3,
            -cosH * 4.5 + (Math.random() - 0.5) * 0.4,
            hoverGlider.boostActive ? 0.34 : 0.24,
            hoverGlider.boostActive ? 0.36 : 0.22,
            trailCol
          );
        }
      }
    }

    let dirty = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = pool[i];
      if (!p.active) continue;
      dirty = true;
      p.age += safeDt;
      if (p.age >= p.life) {
        p.active = false;
        _dummyObj.position.set(0, -99, 0);
        _dummyObj.scale.setScalar(0.001);
        _dummyObj.updateMatrix();
        particleMesh.setMatrixAt(i, _dummyObj.matrix);
        continue;
      }
      p.vy -= 4.8 * safeDt;
      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
      p.z += p.vz * safeDt;
      const t = p.age / p.life;
      const s = p.scale * (1 - t * 0.72);
      _dummyObj.position.set(p.x, p.y, p.z);
      _dummyObj.scale.setScalar(Math.max(0.02, s));
      _dummyObj.updateMatrix();
      particleMesh.setMatrixAt(i, _dummyObj.matrix);
      particleMesh.setColorAt(i, p.color);
    }
    if (dirty) {
      particleMesh.instanceMatrix.needsUpdate = true;
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    }
  };

  return {
    root,
    jeepRig,
    vtolRig,
    sportJetSkiRig,
    perfJetSkiRig,
    dirtBikeRig,
    hoverGliderRig,
    update,
  };
}
