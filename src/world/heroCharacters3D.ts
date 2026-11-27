import * as THREE from 'three';
import type { HeroCharacterId, HeroOutfitId, HeroPreviewAnim } from '../game/heroCharacters';
import { getHeroById } from '../game/heroCharacters';

export interface HeroPoseInput {
  elapsed: number;
  speed: number;
  isSprinting?: boolean;
  isAirborne?: boolean;
  isFlying?: boolean;
  isGliding?: boolean;
  isWebSwinging?: boolean;
  isSitting?: boolean;
  helmetOpen?: boolean;
  energyShieldActive?: boolean;
  detectiveVisionActive?: boolean;
  spiderSenseActive?: boolean;
  attackTimer?: number; // > 0 when performing primary attack/power
  attackKind?: string;
  previewAnim?: HeroPreviewAnim;
  webHandSide?: 1 | -1;
  swingAngleRad?: number;
  isDiving?: boolean;
  airTrickKind?: 'none' | 'front_flip' | 'corkscrew_spin' | 'back_tuck' | 'web_cyclone';
  airTrickAngle?: number;
  dodgeTimer?: number;
  dodgeKind?: 'none' | 'spider_flip' | 'combat_roll' | 'jet_dash' | 'cape_evade';
  dt?: number;
  bankRad?: number;
  pitchLeanRad?: number;
  flightSurgeBlend?: number;
}

export interface HeroRig3D {
  group: THREE.Group;
  setHero: (heroId: HeroCharacterId, outfitId?: HeroOutfitId | null) => void;
  updatePose: (pose: HeroPoseInput) => void;
  getCurrentHero: () => { heroId: HeroCharacterId; outfitId: HeroOutfitId };
  dispose: () => void;
}

interface ProceduralTextures {
  denim: THREE.CanvasTexture;
  spideyClassicTorso: THREE.CanvasTexture;
  spideyAdvancedTorso: THREE.CanvasTexture;
  spideyIronTorso: THREE.CanvasTexture;
  spideyMask: THREE.CanvasTexture;
  spideyIronMask: THREE.CanvasTexture;
  supermanShield: THREE.CanvasTexture;
  scoopsBadge: THREE.CanvasTexture;
  kevlarWeave: THREE.CanvasTexture;
}

function makeCanvasTexture(
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

function createHeroTextures(): ProceduralTextures {
  // 1. Realistic blue denim weave with seam stitching
  const denim = makeCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3b6ca8';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(12,28,58,0.14)';
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 3) {
      ctx.fillStyle = 'rgba(22,48,88,0.12)';
      ctx.fillRect(x, 0, 1, h);
    }
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(4, 4, w - 8, h - 8);
  });

  const drawWebPattern = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    baseRed: string,
    lineColor: string,
    spiderColor: string,
    largeSpider: boolean
  ) => {
    ctx.fillStyle = baseRed;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    const cx = w * 0.5;
    const cy = h * 0.42;
    for (let r = 18; r < w; r += 20) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * h);
      ctx.stroke();
    }

    // Chest spider emblem
    ctx.fillStyle = spiderColor;
    ctx.strokeStyle = spiderColor;
    const s = largeSpider ? 1.55 : 0.78;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8 * s, 10 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8 * s, 6.5 * s, 7.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = largeSpider ? 6.5 : 3.2;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const legs: Array<[number, number, number, number]> = [
        [side * 8 * s, cy - 8 * s, side * 38 * s, cy - 36 * s],
        [side * 10 * s, cy - 2 * s, side * 46 * s, cy - 16 * s],
        [side * 10 * s, cy + 4 * s, side * 48 * s, cy + 14 * s],
        [side * 8 * s, cy + 12 * s, side * 34 * s, cy + 42 * s],
      ];
      for (const [x1, y1, x2, y2] of legs) {
        ctx.beginPath();
        ctx.moveTo(cx + x1, y1);
        ctx.quadraticCurveTo(cx + (x1 + x2) * 0.55, (y1 + y2) * 0.5 - 8, cx + x2, y2);
        ctx.stroke();
      }
    }
  };

  const spideyClassicTorso = makeCanvasTexture(256, 256, (ctx, w, h) => {
    drawWebPattern(ctx, w, h, '#dc2626', '#18181b', '#09090b', false);
    // Blue side torso panels
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, h * 0.25, w * 0.17, h * 0.75);
    ctx.fillRect(w * 0.83, h * 0.25, w * 0.17, h * 0.75);
  });

  const spideyAdvancedTorso = makeCanvasTexture(256, 256, (ctx, w, h) => {
    drawWebPattern(ctx, w, h, '#e11d48', 'rgba(20,20,28,0.68)', '#f8fafc', true);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, h * 0.36, w * 0.18, h * 0.64);
    ctx.fillRect(w * 0.82, h * 0.36, w * 0.18, h * 0.64);
  });

  const spideyIronTorso = makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h * 0.34, w * 0.2, h * 0.66);
    ctx.fillRect(w * 0.8, h * 0.34, w * 0.2, h * 0.66);
    drawWebPattern(ctx, w, h, 'rgba(153,27,27,0.72)', 'rgba(245,158,11,0.45)', '#fbbf24', true);
  });

  const drawMask = (ctx: CanvasRenderingContext2D, w: number, h: number, base: string, web: string) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = web;
    ctx.lineWidth = 2;
    const cx = w * 0.5;
    const cy = h * 0.52;
    for (let r = 14; r < w * 0.7; r += 16) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * h);
      ctx.stroke();
    }
  };

  const spideyMask = makeCanvasTexture(256, 256, (ctx, w, h) =>
    drawMask(ctx, w, h, '#dc2626', 'rgba(12,12,16,0.72)')
  );
  const spideyIronMask = makeCanvasTexture(256, 256, (ctx, w, h) =>
    drawMask(ctx, w, h, '#991b1b', 'rgba(251,191,36,0.52)')
  );

  const supermanShield = makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 0, w, h);
    // Classic red/gold pentagonal S-emblem
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.18);
    ctx.lineTo(w * 0.78, h * 0.18);
    ctx.lineTo(w * 0.88, h * 0.36);
    ctx.lineTo(w * 0.5, h * 0.88);
    ctx.lineTo(w * 0.12, h * 0.36);
    ctx.closePath();
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 132px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', w * 0.5, h * 0.5);
  });

  const scoopsBadge = makeCanvasTexture(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Steve', w * 0.52, h * 0.52);
  });

  const kevlarWeave = makeCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#262b33';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1c2026';
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        if (((x + y) / 8) % 2 === 0) ctx.fillRect(x, y, 4, 4);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  });

  return {
    denim,
    spideyClassicTorso,
    spideyAdvancedTorso,
    spideyIronTorso,
    spideyMask,
    spideyIronMask,
    supermanShield,
    scoopsBadge,
    kevlarWeave,
  };
}

interface RigHandles {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftForearmPivot: THREE.Group;
  rightForearmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftKneePivot: THREE.Group;
  rightKneePivot: THREE.Group;
  eyelids: THREE.Mesh[];
  faceplatePivot?: THREE.Group;
  capePanels: THREE.Group[];
  wingBlades: THREE.Group[];
  ironSpiderLegs: Array<{ root: THREE.Group; mid: THREE.Group; tip: THREE.Group; side: number; idx: number }>;
  thrusters: THREE.Mesh[];
  energyShield?: THREE.Mesh;
  spiderSenseRing?: THREE.Group;
  detectiveRing?: THREE.Mesh;
  seismicRing?: THREE.Mesh;
  batOnBack?: THREE.Group;
  batInHand?: THREE.Group;
  reactorMeshes: THREE.Mesh[];
  hairTufts: THREE.Group[];
}

function addArticulatedFingers(
  handGroup: THREE.Group,
  mat: THREE.Material,
  scale = 1,
  side: 1 | -1 = 1
): void {
  const fingerGeo = new THREE.CapsuleGeometry(0.011 * scale, 0.045 * scale, 4, 6);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(fingerGeo, mat);
    f.position.set((-0.028 + i * 0.0185) * scale, -0.055 * scale, 0.008 * scale);
    f.rotation.x = 0.22;
    handGroup.add(f);
  }
  const thumb = new THREE.Mesh(fingerGeo, mat);
  thumb.position.set(side * 0.042 * scale, -0.025 * scale, 0.022 * scale);
  thumb.rotation.z = -side * 0.65;
  thumb.rotation.x = 0.25;
  handGroup.add(thumb);
}

function buildDetailedFace(
  headGroup: THREE.Group,
  skinMat: THREE.Material,
  hairMat: THREE.Material,
  eyeColor: number,
  options?: { sunglasses?: boolean; goatee?: boolean; hairStyle?: 'steve80s' | 'stark' | 'superman' }
): { eyelids: THREE.Mesh[]; hairTufts: THREE.Group[] } {
  const eyelids: THREE.Mesh[] = [];
  const hairTufts: THREE.Group[] = [];

  // Cranium + sculpted jaw
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.142, 18, 16), skinMat);
  skull.scale.set(0.92, 1.08, 0.96);
  skull.position.y = 0.02;
  headGroup.add(skull);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.088, 0.14), skinMat);
  jaw.position.set(0, -0.072, 0.024);
  headGroup.add(jaw);

  // Nose bridge + tip
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.021, 0.062, 6), skinMat);
  nose.rotation.x = Math.PI * 0.44;
  nose.position.set(0, -0.008, 0.142);
  headGroup.add(nose);

  // Lips
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xb97a6b, roughness: 0.65 });
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.014, 0.018), lipMat);
  lips.position.set(0, -0.065, 0.13);
  headGroup.add(lips);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.028, 8, 8);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.scale.set(0.45, 1.15, 0.72);
    ear.position.set(s * 0.132, 0.005, -0.005);
    headGroup.add(ear);
  }

  // Detailed eyes + blinking eyelids + eyebrows
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const irisMat = new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), scleraMat);
    sclera.scale.set(1.1, 0.76, 0.55);
    sclera.position.set(s * 0.048, 0.022, 0.122);
    headGroup.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), irisMat);
    iris.position.set(s * 0.048, 0.022, 0.133);
    headGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), pupilMat);
    pupil.position.set(s * 0.048, 0.022, 0.139);
    headGroup.add(pupil);

    // Blinking upper eyelid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.005, 0.022), skinMat);
    lid.position.set(s * 0.048, 0.036, 0.131);
    headGroup.add(lid);
    eyelids.push(lid);

    // Sculpted eyebrow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.013, 0.02), hairMat);
    brow.position.set(s * 0.05, 0.054, 0.129);
    brow.rotation.z = -s * 0.08;
    headGroup.add(brow);
  }

  // Optional 1980s Wayfarer Sunglasses (Steve Outfit 1)
  if (options?.sunglasses) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.22, metalness: 0.3 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.08, metalness: 0.72 });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.014, 0.016), frameMat);
    bridge.position.set(0, 0.028, 0.146);
    headGroup.add(bridge);
    for (const s of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.046, 0.014), lensMat);
      lens.position.set(s * 0.054, 0.022, 0.146);
      headGroup.add(lens);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.13), frameMat);
      temple.position.set(s * 0.095, 0.028, 0.084);
      headGroup.add(temple);
    }
  }

  // Optional Tony Stark goatee
  if (options?.goatee) {
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.012, 0.016), hairMat);
    stache.position.set(0, -0.046, 0.134);
    headGroup.add(stache);
    const chinBeard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.026, 0.02), hairMat);
    chinBeard.position.set(0, -0.092, 0.125);
    headGroup.add(chinBeard);
  }

  // Sculpted hairstyles
  if (options?.hairStyle === 'steve80s') {
    // Voluminous swept-back 1980s Steve Harrington hair (multi-layered crown & side waves)
    const crownBase = new THREE.Mesh(new THREE.SphereGeometry(0.162, 16, 14), hairMat);
    crownBase.scale.set(1.06, 0.94, 1.12);
    crownBase.position.set(0, 0.095, -0.02);
    headGroup.add(crownBase);

    // Iconic tall swept forehead pompadour tufts
    const tuftConfigs: Array<[number, number, number, number, number, number, number]> = [
      [0, 0.175, 0.055, 0.11, 0.075, 0.14, -0.32],
      [-0.065, 0.162, 0.048, 0.09, 0.072, 0.13, -0.25],
      [0.072, 0.158, 0.045, 0.095, 0.07, 0.135, -0.22],
      [-0.125, 0.095, 0.01, 0.068, 0.12, 0.13, 0.12],
      [0.125, 0.095, 0.01, 0.068, 0.12, 0.13, 0.12],
      [0, 0.03, -0.142, 0.16, 0.15, 0.09, 0.2],
      [-0.115, -0.02, -0.095, 0.065, 0.11, 0.085, 0.28],
      [0.115, -0.02, -0.095, 0.065, 0.11, 0.085, 0.28],
    ];
    for (const [x, y, z, sx, sy, sz, rx] of tuftConfigs) {
      const tuftPivot = new THREE.Group();
      tuftPivot.position.set(x, y, z);
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), hairMat);
      tuft.scale.set(sx, sy, sz);
      tuft.rotation.x = rx;
      tuftPivot.add(tuft);
      headGroup.add(tuftPivot);
      hairTufts.push(tuftPivot);
    }
  } else if (options?.hairStyle === 'superman') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), hairMat);
    cap.scale.set(0.98, 0.84, 1.04);
    cap.position.set(0, 0.075, -0.015);
    headGroup.add(cap);
    // Iconic S-curl on forehead
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 6, 10, Math.PI * 1.35), hairMat);
    curl.position.set(0.012, 0.115, 0.125);
    curl.rotation.z = 0.65;
    headGroup.add(curl);
  } else {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.148, 12, 10), hairMat);
    cap.scale.set(0.96, 0.78, 1.0);
    cap.position.set(0, 0.072, -0.012);
    headGroup.add(cap);
  }

  return { eyelids, hairTufts };
}

function createBaseballBatWithNails(): THREE.Group {
  const bat = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb68952, roughness: 0.68, metalness: 0.05 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const nailMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.88 });

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.32, 10), gripMat);
  handle.position.y = 0.16;
  bat.add(handle);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.022, 0.56, 12), woodMat);
  barrel.position.y = 0.58;
  bat.add(barrel);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), woodMat);
  tip.position.y = 0.86;
  bat.add(tip);

  // Decorative nail spikes protruding from upper barrel (matching Steve reference!)
  const nailGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.095, 5);
  for (let i = 0; i < 12; i++) {
    const nail = new THREE.Mesh(nailGeo, nailMat);
    const angle = (i / 12) * Math.PI * 2 + (i % 2) * 0.35;
    const h = 0.58 + (i % 5) * 0.062;
    nail.position.set(Math.cos(angle) * 0.042, h, Math.sin(angle) * 0.042);
    nail.rotation.z = Math.PI * 0.5 - 0.12;
    nail.rotation.y = -angle;
    bat.add(nail);
  }
  return bat;
}

function buildFlowingCape(
  bodyGroup: THREE.Group,
  colorHex: number,
  width: number,
  length: number,
  scalloped: boolean
): THREE.Group[] {
  const capePanels: THREE.Group[] = [];
  const capeMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.72,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  // Shoulder mantle collar
  const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.14, 12, 1, true), capeMat);
  mantle.position.set(0, 1.38, -0.02);
  bodyGroup.add(mantle);

  const panelCount = 4;
  for (let i = 0; i < panelCount; i++) {
    const panelPivot = new THREE.Group();
    const frac = (i / (panelCount - 1)) * 2 - 1; // -1..1
    panelPivot.position.set(frac * (width * 0.24), 1.39, -0.145);

    const upper = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.34, length * 0.56, 2, 2),
      capeMat
    );
    upper.position.set(frac * 0.06, -length * 0.28, -0.02);
    panelPivot.add(upper);

    const lower = new THREE.Mesh(
      scalloped
        ? new THREE.ConeGeometry(width * 0.21, length * 0.54, 4)
        : new THREE.PlaneGeometry(width * 0.38, length * 0.48, 2, 2),
      capeMat
    );
    lower.position.set(frac * 0.11, -length * 0.76, -0.04);
    if (scalloped) {
      lower.rotation.x = Math.PI;
      lower.scale.set(1, 1, 0.12);
    }
    panelPivot.add(lower);

    bodyGroup.add(panelPivot);
    capePanels.push(panelPivot);
  }
  return capePanels;
}

function buildHeroRigInternal(
  heroId: HeroCharacterId,
  outfitId: HeroOutfitId,
  tex: ProceduralTextures
): RigHandles {
  const spec = getHeroById(heroId);
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const headGroup = new THREE.Group();
  const leftArmPivot = new THREE.Group();
  const rightArmPivot = new THREE.Group();
  const leftForearmPivot = new THREE.Group();
  const rightForearmPivot = new THREE.Group();
  const leftLegPivot = new THREE.Group();
  const rightLegPivot = new THREE.Group();
  const leftKneePivot = new THREE.Group();
  const rightKneePivot = new THREE.Group();

  let eyelids: THREE.Mesh[] = [];
  let hairTufts: THREE.Group[] = [];
  let faceplatePivot: THREE.Group | undefined;
  let capePanels: THREE.Group[] = [];
  const wingBlades: THREE.Group[] = [];
  const ironSpiderLegs: RigHandles['ironSpiderLegs'] = [];
  const thrusters: THREE.Mesh[] = [];
  const reactorMeshes: THREE.Mesh[] = [];
  let energyShield: THREE.Mesh | undefined;
  let spiderSenseRing: THREE.Group | undefined;
  let detectiveRing: THREE.Mesh | undefined;
  let seismicRing: THREE.Mesh | undefined;
  let batOnBack: THREE.Group | undefined;
  let batInHand: THREE.Group | undefined;

  const isHulkbuster = heroId === 'hulkbuster';
  const torsoY = isHulkbuster ? 1.15 : 1.14;
  const shoulderX = isHulkbuster ? 0.42 : 0.265;
  const shoulderY = isHulkbuster ? 1.44 : 1.38;
  const hipX = isHulkbuster ? 0.18 : 0.11;
  const hipY = isHulkbuster ? 0.82 : 0.84;

  headGroup.position.set(0, isHulkbuster ? 1.66 : 1.61, 0);
  leftArmPivot.position.set(-shoulderX, shoulderY, 0);
  rightArmPivot.position.set(shoulderX, shoulderY, 0);
  leftLegPivot.position.set(-hipX, hipY, 0);
  rightLegPivot.position.set(hipX, hipY, 0);

  bodyGroup.add(headGroup, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

  // Common helper to wire limb geometry cleanly
  const buildLimbs = (opts: {
    upperArmMat: THREE.Material;
    forearmMat: THREE.Material;
    handMat: THREE.Material;
    thighMat: THREE.Material;
    shinMat: THREE.Material;
    bootMat: THREE.Material;
    shoulderMat?: THREE.Material;
    armR?: number;
    legR?: number;
    palmGlow?: boolean;
    gauntletFins?: boolean;
    kneeReactors?: boolean;
    elbowArmorMat?: THREE.Material;
  }) => {
    const aR = opts.armR ?? 0.068;
    const lR = opts.legR ?? 0.088;

    for (const [side, armPivot, forePivot] of [
      [-1, leftArmPivot, leftForearmPivot],
      [1, rightArmPivot, rightForearmPivot],
    ] as const) {
      if (opts.shoulderMat) {
        const pauldron = new THREE.Mesh(
          new THREE.SphereGeometry(aR * (isHulkbuster ? 1.75 : 1.42), 14, 12),
          opts.shoulderMat
        );
        pauldron.scale.set(1.15, 0.92, 1.08);
        pauldron.position.set(side * 0.025, 0.02, 0);
        armPivot.add(pauldron);
      }

      const upper = new THREE.Mesh(
        new THREE.CapsuleGeometry(aR, 0.23, 6, 10),
        opts.upperArmMat
      );
      upper.position.y = -0.15;
      armPivot.add(upper);

      forePivot.position.set(0, -0.31, 0);
      armPivot.add(forePivot);

      if (opts.elbowArmorMat) {
        const elbow = new THREE.Mesh(new THREE.SphereGeometry(aR * 0.96, 10, 8), opts.elbowArmorMat);
        forePivot.add(elbow);
      }

      const lower = new THREE.Mesh(
        new THREE.CapsuleGeometry(aR * 0.9, 0.22, 6, 10),
        opts.forearmMat
      );
      lower.position.y = -0.14;
      forePivot.add(lower);

      if (opts.gauntletFins) {
        for (let f = 0; f < 3; f++) {
          const fin = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.075, 4), opts.forearmMat);
          fin.rotation.z = side * Math.PI * 0.5;
          fin.position.set(side * (aR + 0.02), -0.08 - f * 0.055, -0.02);
          forePivot.add(fin);
        }
      }

      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.29, 0);
      const palm = new THREE.Mesh(
        new THREE.BoxGeometry(aR * 1.25, aR * 1.1, aR * 0.82),
        opts.handMat
      );
      handGroup.add(palm);
      addArticulatedFingers(handGroup, opts.handMat, isHulkbuster ? 1.48 : 1.0, side);

      if (opts.palmGlow) {
        const emitter = new THREE.Mesh(
          new THREE.CircleGeometry(0.028, 12),
          new THREE.MeshBasicMaterial({ color: 0xbef8ff })
        );
        emitter.rotation.x = Math.PI * 0.5;
        emitter.position.set(0, -0.03, 0.032);
        handGroup.add(emitter);
        reactorMeshes.push(emitter);

        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.045, 0.36, 10),
          new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0.78,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        cone.rotation.x = Math.PI;
        cone.position.set(0, -0.24, 0);
        cone.visible = false;
        handGroup.add(cone);
        thrusters.push(cone);
      }

      forePivot.add(handGroup);
    }

    for (const [side, legPivot, kneePivot] of [
      [-1, leftLegPivot, leftKneePivot],
      [1, rightLegPivot, rightKneePivot],
    ] as const) {
      const thigh = new THREE.Mesh(
        new THREE.CapsuleGeometry(lR, 0.29, 6, 10),
        opts.thighMat
      );
      thigh.position.y = -0.19;
      legPivot.add(thigh);

      kneePivot.position.set(0, -0.41, 0);
      legPivot.add(kneePivot);

      const kneeGuard = new THREE.Mesh(
        new THREE.SphereGeometry(lR * 0.94, 10, 8),
        opts.elbowArmorMat ?? opts.shinMat
      );
      kneeGuard.position.set(0, 0, 0.025);
      kneePivot.add(kneeGuard);

      if (opts.kneeReactors) {
        const kr = new THREE.Mesh(
          new THREE.CircleGeometry(0.048, 14),
          new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
        );
        kr.position.set(0, 0.005, lR + 0.025);
        kneePivot.add(kr);
        reactorMeshes.push(kr);
      }

      const shin = new THREE.Mesh(
        new THREE.CapsuleGeometry(lR * 0.88, 0.28, 6, 10),
        opts.shinMat
      );
      shin.position.y = -0.19;
      kneePivot.add(shin);

      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(lR * 1.68, 0.115, lR * 2.55),
        opts.bootMat
      );
      boot.position.set(0, -0.37, 0.048);
      kneePivot.add(boot);

      if (opts.palmGlow) {
        const bootJet = new THREE.Mesh(
          new THREE.ConeGeometry(0.068, 0.56, 10),
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        bootJet.rotation.x = Math.PI;
        bootJet.position.set(side * 0.005, -0.68, 0.02);
        bootJet.visible = false;
        kneePivot.add(bootJet);
        thrusters.push(bootJet);
      }
    }
  };

  // =========================================================================
  // CHARACTER 01: STEVE HARRINGTON (Outfit 1: Grey Jacket | Outfit 2: Scoops Ahoy)
  // =========================================================================
  if (heroId === 'steve_harrington') {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe9be9b, roughness: 0.62 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4b2f1d, roughness: 0.82 });
    const isScoops = outfitId === 'steve_scoops_ahoy';

    const face = buildDetailedFace(headGroup, skinMat, hairMat, 0x3b2415, {
      sunglasses: !isScoops,
      hairStyle: 'steve80s',
    });
    eyelids = face.eyelids;
    hairTufts = face.hairTufts;

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.064, 0.11, 10), skinMat);
    neck.position.set(0, 1.46, 0);
    bodyGroup.add(neck);

    if (!isScoops) {
      // Outfit 1: Light grey zip-up jacket, dark navy tee, denim jeans, black backpack, yellow gloves, nail bat!
      const jacketMat = new THREE.MeshStandardMaterial({ color: 0xa3abb6, roughness: 0.78 });
      const ribMat = new THREE.MeshStandardMaterial({ color: 0x8a929d, roughness: 0.86 });
      const teeMat = new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.85 });
      const jeansMat = new THREE.MeshStandardMaterial({ map: tex.denim, roughness: 0.86 });
      const gloveMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
      const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
      const metalMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.25, metalness: 0.85 });
      const packMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.82 });
      const beltMat = new THREE.MeshStandardMaterial({ color: 0x7c3f1c, roughness: 0.7 });

      // Inner dark navy tee visible in collar V
      const tee = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.21), teeMat);
      tee.position.set(0, torsoY, 0.01);
      bodyGroup.add(tee);

      // Left & right jacket panels + raised collar + full-length silver zipper + ribbed hem
      for (const s of [-1, 1]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.51, 0.245), jacketMat);
        panel.position.set(s * 0.115, torsoY, 0);
        bodyGroup.add(panel);
      }
      const backPanel = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.51, 0.14), jacketMat);
      backPanel.position.set(0, torsoY, -0.055);
      bodyGroup.add(backPanel);

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.085, 12, 1, true), jacketMat);
      collar.position.set(0, 1.43, -0.005);
      bodyGroup.add(collar);

      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.46, 0.014), metalMat);
      zipper.position.set(0, torsoY - 0.01, 0.128);
      bodyGroup.add(zipper);

      const waistRib = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.075, 0.25), ribMat);
      waistRib.position.set(0, 0.89, 0);
      bodyGroup.add(waistRib);

      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.048, 0.23), beltMat);
      belt.position.set(0, 0.84, 0);
      bodyGroup.add(belt);

      // Black backpack with twin shoulder straps + metallic brass buckles
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.16), packMat);
      pack.position.set(0, 1.15, -0.2);
      bodyGroup.add(pack);
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.85 });
      for (const s of [-1, 1]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.48, 0.28), packMat);
        strap.position.set(s * 0.145, 1.18, -0.01);
        bodyGroup.add(strap);
        const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 10), brassMat);
        buckle.position.set(s * 0.145, 1.12, 0.135);
        bodyGroup.add(buckle);
      }

      // Wooden nail-studded baseball bat strapped across back + active combat copy in right hand
      batOnBack = createBaseballBatWithNails();
      batOnBack.position.set(-0.18, 0.94, -0.29);
      batOnBack.rotation.z = -0.52;
      bodyGroup.add(batOnBack);

      buildLimbs({
        upperArmMat: jacketMat,
        forearmMat: jacketMat,
        handMat: gloveMat,
        thighMat: jeansMat,
        shinMat: jeansMat,
        bootMat: sneakerMat,
        armR: 0.062,
        legR: 0.078,
      });

      // Elastic cuffs + yellow glove wrist collars
      for (const fore of [leftForearmPivot, rightForearmPivot]) {
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.056, 0.06, 10), gloveMat);
        cuff.position.y = -0.24;
        fore.add(cuff);
      }

      batInHand = createBaseballBatWithNails();
      batInHand.position.set(0, -0.32, 0.06);
      batInHand.rotation.x = Math.PI * 0.46;
      batInHand.visible = false;
      rightForearmPivot.add(batInHand);
    } else {
      // Outfit 2: Scoops Ahoy Sailor Uniform!
      const navyMat = new THREE.MeshStandardMaterial({ color: 0x1d3b7a, roughness: 0.78 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72 });
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
      const badgeMat = new THREE.MeshStandardMaterial({ map: tex.scoopsBadge, roughness: 0.4 });
      const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.65 });

      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.54, 0.23), navyMat);
      shirt.position.set(0, torsoY, 0);
      bodyGroup.add(shirt);

      // Red & white striped V sailor collar
      const backCollar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.03), whiteMat);
      backCollar.position.set(0, 1.34, -0.125);
      bodyGroup.add(backCollar);

      for (const s of [-1, 1]) {
        const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.025), whiteMat);
        lapel.position.set(s * 0.085, 1.32, 0.122);
        lapel.rotation.z = s * 0.42;
        bodyGroup.add(lapel);
        const redTrim = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.24, 0.028), redMat);
        redTrim.position.set(s * 0.072, 1.31, 0.126);
        redTrim.rotation.z = s * 0.42;
        bodyGroup.add(redTrim);
      }

      // Red sailor neckerchief scarf
      const tieKnot = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), redMat);
      tieKnot.position.set(0, 1.21, 0.13);
      bodyGroup.add(tieKnot);
      const tieTail = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.24, 0.022), redMat);
      tieTail.position.set(0, 1.07, 0.13);
      bodyGroup.add(tieTail);

      // Red "Steve" name badge
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.042, 0.012), badgeMat);
      badge.position.set(0.11, 1.24, 0.122);
      bodyGroup.add(badge);

      // Sailor hat
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.145, 0.09, 14), whiteMat);
      hat.position.set(0, 0.21, -0.01);
      hat.rotation.x = -0.12;
      headGroup.add(hat);
      const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.147, 0.147, 0.024, 14), navyMat);
      hatBand.position.set(0, 0.175, -0.01);
      hatBand.rotation.x = -0.12;
      headGroup.add(hatBand);

      buildLimbs({
        upperArmMat: navyMat,
        forearmMat: skinMat,
        handMat: skinMat,
        thighMat: navyMat,
        shinMat: skinMat,
        bootMat: sneakerMat,
        armR: 0.058,
        legR: 0.075,
      });

      // White double piping around short sailor sleeves
      for (const arm of [leftArmPivot, rightArmPivot]) {
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.028, 10), whiteMat);
        stripe.position.y = -0.25;
        arm.add(stripe);
      }

      batInHand = createBaseballBatWithNails();
      batInHand.position.set(0, -0.32, 0.06);
      batInHand.rotation.x = Math.PI * 0.46;
      batInHand.visible = false;
      rightForearmPivot.add(batInHand);
    }
  }

  // =========================================================================
  // CHARACTER 02 & 03: IRON MAN CLASSIC (MK 85) & ADVANCED FLYING (MK 50 NANO)
  // =========================================================================
  else if (heroId === 'iron_man_classic' || heroId === 'iron_man_advanced') {
    const isAdv = heroId === 'iron_man_advanced';
    const isMk42Gold = outfitId === 'iron_man_mk42_gold';
    const isStealthCobalt = outfitId === 'iron_man_stealth_cobalt';
    const redArmor = new THREE.MeshStandardMaterial({
      color: isStealthCobalt ? 0x1e3a5f : isMk42Gold ? 0xd4a72c : isAdv ? 0xdc2626 : 0xb91c1c,
      roughness: 0.24,
      metalness: 0.8,
    });
    const goldArmor = new THREE.MeshStandardMaterial({
      color: isStealthCobalt ? 0x94a3b8 : isMk42Gold ? 0x991b1b : isAdv ? 0xfbbf24 : 0xf59e0b,
      roughness: 0.22,
      metalness: 0.86,
    });
    const gunmetal = new THREE.MeshStandardMaterial({
      color: isStealthCobalt ? 0x0f172a : 0x3b475a,
      roughness: 0.34,
      metalness: 0.82,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: isStealthCobalt ? 0x38bdf8 : isMk42Gold ? 0x7dd3fc : isAdv ? 0x67e8f9 : 0xe0f2fe,
    });

    // Inner Tony Stark face visible when faceplate opens!
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b996, roughness: 0.6 });
    const starkHairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
    const innerFace = buildDetailedFace(headGroup, skinMat, starkHairMat, 0x3b2415, {
      goatee: true,
      hairStyle: 'stark',
    });
    eyelids = innerFace.eyelids;

    // Armored neck collar
    const neckGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.115, 0.13, 14), gunmetal);
    neckGuard.position.set(0, 1.46, 0);
    bodyGroup.add(neckGuard);

    // Outer aerodynamic crimson helmet shell + cheek guards
    const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.168, 20, 18), redArmor);
    helmetShell.scale.set(0.94, 1.12, 1.06);
    helmetShell.position.set(0, 0.025, -0.01);
    headGroup.add(helmetShell);

    for (const s of [-1, 1]) {
      const cheekGuard = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.15, 0.16), redArmor);
      cheekGuard.position.set(s * 0.125, -0.02, 0.04);
      cheekGuard.rotation.y = -s * 0.24;
      headGroup.add(cheekGuard);
    }

    // Hinged sculpted metallic gold faceplate (contoured brow, cheekbones & chin — not a flat block!)
    faceplatePivot = new THREE.Group();
    faceplatePivot.position.set(0, 0.155, 0.068);
    const maskCore = new THREE.Mesh(new THREE.SphereGeometry(0.146, 18, 16), goldArmor);
    maskCore.scale.set(0.84, 1.04, 0.62);
    maskCore.position.set(0, -0.138, 0.036);
    faceplatePivot.add(maskCore);

    const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.036, 0.06), redArmor);
    browRidge.position.set(0, -0.065, 0.085);
    browRidge.rotation.x = 0.18;
    faceplatePivot.add(browRidge);

    const jawPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.052, 0.075, 10), redArmor);
    jawPlate.scale.set(1.25, 1, 0.85);
    jawPlate.position.set(0, -0.248, 0.064);
    faceplatePivot.add(jawPlate);

    for (const s of [-1, 1]) {
      const eyeLens = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.018, 0.025), glowMat);
      eyeLens.position.set(s * 0.048, -0.108, 0.112);
      eyeLens.rotation.z = -s * 0.14;
      faceplatePivot.add(eyeLens);
      reactorMeshes.push(eyeLens);
    }
    headGroup.add(faceplatePivot);

    // Sculpted athletic V-tapered metallic chest & layered pectoral plates
    const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.175, 0.36, 10), redArmor);
    chestCore.scale.set(1.06, 1, 0.68);
    chestCore.position.set(0, 1.25, 0.01);
    bodyGroup.add(chestCore);

    for (const s of [-1, 1]) {
      const pecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.17, 0.085), redArmor);
      pecPlate.position.set(s * 0.115, 1.31, 0.125);
      pecPlate.rotation.y = -s * 0.22;
      pecPlate.rotation.x = -0.1;
      bodyGroup.add(pecPlate);

      const trapPlate = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.065, 0.18), goldArmor);
      trapPlate.position.set(s * 0.155, 1.43, 0);
      trapPlate.rotation.z = -s * 0.22;
      bodyGroup.add(trapPlate);
    }

    // Tapered segmented armored abs + pelvic armor
    const abs = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.158, 0.24, 10), gunmetal);
    abs.scale.set(1.05, 1, 0.68);
    abs.position.set(0, 0.99, 0);
    bodyGroup.add(abs);

    for (let r = 0; r < 3; r++) {
      const abSeg = new THREE.Mesh(new THREE.BoxGeometry(0.16 - r * 0.012, 0.045, 0.055), redArmor);
      abSeg.position.set(0, 1.07 - r * 0.065, 0.112);
      bodyGroup.add(abSeg);
    }

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.125, 0.14, 10), redArmor);
    pelvis.scale.set(1.08, 1, 0.72);
    pelvis.position.set(0, 0.84, 0);
    bodyGroup.add(pelvis);

    // Gold rib & oblique armor plates
    for (const s of [-1, 1]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.22, 0.21), goldArmor);
      rib.position.set(s * 0.148, 1.01, 0.005);
      rib.rotation.z = s * 0.12;
      bodyGroup.add(rib);

      // Dorsal flight flaps on back (makes 3rd-person view look sleek & mechanical!)
      const dorsalFlap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.05), goldArmor);
      dorsalFlap.position.set(s * 0.105, 1.27, -0.155);
      dorsalFlap.rotation.y = s * 0.2;
      dorsalFlap.rotation.x = 0.08;
      bodyGroup.add(dorsalFlap);
    }
    const spinePlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.06), gunmetal);
    spinePlate.position.set(0, 1.18, -0.155);
    bodyGroup.add(spinePlate);

    // Glowing triangular central arc reactor with recessed metallic bezel
    const reactorBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.088, 0.032, 3), gunmetal);
    reactorBezel.rotation.x = Math.PI * 0.5;
    reactorBezel.rotation.z = Math.PI;
    reactorBezel.position.set(0, 1.28, 0.162);
    bodyGroup.add(reactorBezel);

    const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.036, 3), glowMat);
    reactorCore.rotation.x = Math.PI * 0.5;
    reactorCore.rotation.z = Math.PI;
    reactorCore.position.set(0, 1.28, 0.168);
    bodyGroup.add(reactorCore);
    reactorMeshes.push(reactorCore);

    // Additional cyan energy nodes & 4 articulated rear flight stabilizer wings for Advanced Nano Suit
    if (isAdv) {
      for (const s of [-1, 1]) {
        const node = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.075, 0.022), glowMat);
        node.position.set(s * 0.145, 1.34, 0.168);
        node.rotation.z = s * 0.38;
        bodyGroup.add(node);
        reactorMeshes.push(node);
      }

      // 4 Articulated aerodynamic flight stabilizer wing blades mounted on rear pack
      const backPack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.12), redArmor);
      backPack.position.set(0, 1.24, -0.18);
      bodyGroup.add(backPack);

      const bladeSpecs: Array<[number, number, number, number]> = [
        [-0.14, 1.36, 0.55, 0.92],
        [0.14, 1.36, -0.55, 0.92],
        [-0.14, 1.15, 1.25, 0.72],
        [0.14, 1.15, -1.25, 0.72],
      ];
      for (const [bx, by, baseZRot, len] of bladeSpecs) {
        const bladePivot = new THREE.Group();
        bladePivot.position.set(bx, by, -0.22);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.095, len, 0.032), redArmor);
        blade.position.y = len * 0.45;
        bladePivot.add(blade);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.028, len * 0.92, 0.038), goldArmor);
        edge.position.set(bx > 0 ? 0.042 : -0.042, len * 0.45, 0);
        bladePivot.add(edge);
        const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.02, len * 0.72, 0.042), glowMat);
        glowStrip.position.set(0, len * 0.42, 0);
        bladePivot.add(glowStrip);
        reactorMeshes.push(glowStrip);
        bladePivot.rotation.z = baseZRot;
        bladePivot.userData.baseZRot = baseZRot;
        bodyGroup.add(bladePivot);
        wingBlades.push(bladePivot);
      }
    }

    buildLimbs({
      upperArmMat: isAdv ? redArmor : goldArmor,
      forearmMat: redArmor,
      handMat: redArmor,
      thighMat: goldArmor,
      shinMat: redArmor,
      bootMat: redArmor,
      shoulderMat: isAdv ? redArmor : goldArmor,
      elbowArmorMat: gunmetal,
      armR: 0.072,
      legR: 0.092,
      palmGlow: true,
    });

    // Translucent deployable energy shield
    energyShield = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, 20, 16),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.24,
        wireframe: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    energyShield.position.set(0, 1.05, 0);
    energyShield.visible = false;
    bodyGroup.add(energyShield);
  }

  // =========================================================================
  // CHARACTER 04: HULKBUSTER ARMOUR (MK 44 COLOSSAL HEAVY EXOSKELETON)
  // =========================================================================
  else if (heroId === 'hulkbuster') {
    const isTitan = outfitId === 'hulkbuster_mk48_titan';
    const heavyRed = new THREE.MeshStandardMaterial({
      color: isTitan ? 0x334155 : 0xb91c1c,
      roughness: 0.28,
      metalness: 0.82,
    });
    const heavyGold = new THREE.MeshStandardMaterial({
      color: isTitan ? 0xf59e0b : 0xeab308,
      roughness: 0.24,
      metalness: 0.86,
    });
    const pistonMat = new THREE.MeshStandardMaterial({
      color: isTitan ? 0x1e293b : 0x3b4454,
      roughness: 0.32,
      metalness: 0.85,
    });
    const whiteGlow = new THREE.MeshBasicMaterial({ color: isTitan ? 0x38bdf8 : 0xe0f2fe });

    // Heavy domed recessed helmet + layered curved collar shroud
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.185, 18, 16), heavyGold);
    dome.scale.set(1.12, 0.92, 1.08);
    headGroup.add(dome);
    const outerHood = new THREE.Mesh(new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), heavyRed);
    outerHood.position.set(0, 0.01, -0.025);
    outerHood.rotation.x = -0.25;
    headGroup.add(outerHood);
    for (const s of [-1, 1]) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.02, 0.025), whiteGlow);
      slit.position.set(s * 0.058, 0.01, 0.188);
      headGroup.add(slit);
      reactorMeshes.push(slit);
    }

    // Colossal industrial sculpted broad chest & beveled dorsal armor
    const upperTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.31, 0.48, 8), heavyRed);
    upperTorso.scale.set(1.12, 1, 0.76);
    upperTorso.position.set(0, 1.29, 0.01);
    bodyGroup.add(upperTorso);

    // Sculpted layered waist & armored pelvic frame (dark gunmetal + gold plates — no flat beige slab!)
    const midTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.25, 0.34, 8), pistonMat);
    midTorso.scale.set(1.06, 1, 0.76);
    midTorso.position.set(0, 0.95, 0);
    bodyGroup.add(midTorso);

    const hipBelt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.11, 0.38), heavyRed);
    hipBelt.position.set(0, 0.85, 0);
    bodyGroup.add(hipBelt);

    // Gold reinforced chest ribs, dorsal thruster pods & hydraulic spine
    for (const s of [-1, 1]) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.09), heavyGold);
      vent.position.set(s * 0.22, 1.38, 0.25);
      vent.rotation.y = -s * 0.22;
      bodyGroup.add(vent);

      const waistPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.36), heavyGold);
      waistPlate.position.set(s * 0.21, 0.98, 0);
      bodyGroup.add(waistPlate);

      // Twin dorsal thruster pods + glowing exhaust vents on Hulkbuster's back!
      const backPod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.42, 12), heavyRed);
      backPod.position.set(s * 0.19, 1.3, -0.28);
      backPod.rotation.x = 0.14;
      bodyGroup.add(backPod);

      const podTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.06, 12), heavyGold);
      podTrim.position.set(s * 0.19, 1.44, -0.26);
      podTrim.rotation.x = 0.14;
      bodyGroup.add(podTrim);

      const podGlow = new THREE.Mesh(new THREE.CircleGeometry(0.085, 12), whiteGlow);
      podGlow.position.set(s * 0.19, 1.11, -0.32);
      podGlow.rotation.x = Math.PI * 0.6;
      bodyGroup.add(podGlow);
      reactorMeshes.push(podGlow);
    }

    // Central armored dorsal spine casing
    const dorsalSpine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.18), pistonMat);
    dorsalSpine.position.set(0, 1.24, -0.26);
    bodyGroup.add(dorsalSpine);
    const spineGoldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.05), heavyGold);
    spineGoldPlate.position.set(0, 1.32, -0.355);
    bodyGroup.add(spineGoldPlate);

    // Circular white chest arc reactor
    const chestRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 18), pistonMat);
    chestRing.position.set(0, 1.26, 0.285);
    bodyGroup.add(chestRing);
    const chestCore = new THREE.Mesh(new THREE.CircleGeometry(0.082, 18), whiteGlow);
    chestCore.position.set(0, 1.26, 0.29);
    bodyGroup.add(chestCore);
    reactorMeshes.push(chestCore);

    buildLimbs({
      upperArmMat: heavyRed,
      forearmMat: heavyRed,
      handMat: heavyGold,
      thighMat: heavyRed,
      shinMat: heavyRed,
      bootMat: heavyGold,
      shoulderMat: heavyRed,
      elbowArmorMat: heavyGold,
      armR: 0.118,
      legR: 0.142,
      palmGlow: true,
      kneeReactors: true,
    });

    // Seismic impact ring & heavy defense aura
    seismicRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 1.6, 28),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    seismicRing.rotation.x = -Math.PI * 0.5;
    seismicRing.position.y = 0.06;
    seismicRing.visible = false;
    bodyGroup.add(seismicRing);

    energyShield = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 18, 14),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    energyShield.position.set(0, 1.15, 0);
    energyShield.visible = false;
    bodyGroup.add(energyShield);
  }

  // =========================================================================
  // CHARACTER 05: BATMAN (THE DARK KNIGHT)
  // =========================================================================
  else if (heroId === 'batman') {
    const isMech = outfitId === 'batman_armoured_mech';
    const cowlMat = new THREE.MeshStandardMaterial({
      color: isMech ? 0x334155 : 0x0f1218,
      roughness: isMech ? 0.28 : 0.46,
      metalness: isMech ? 0.76 : 0.22,
    });
    const kevlarMat = new THREE.MeshStandardMaterial({
      color: isMech ? 0x64748b : 0xffffff,
      map: isMech ? null : tex.kevlarWeave,
      roughness: isMech ? 0.3 : 0.56,
      metalness: isMech ? 0.72 : 0.28,
    });
    const armorBlack = new THREE.MeshStandardMaterial({
      color: isMech ? 0x1e293b : 0x141820,
      roughness: isMech ? 0.3 : 0.42,
      metalness: isMech ? 0.68 : 0.34,
    });
    const beltGold = new THREE.MeshStandardMaterial({
      color: isMech ? 0x94a3b8 : 0xd9a116,
      roughness: 0.3,
      metalness: 0.8,
    });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe2b494, roughness: 0.62 });
    const eyeGlow = new THREE.MeshBasicMaterial({ color: isMech ? 0x7dd3fc : 0xe2e8f0 });

    // Sculpted cowl + pointed bat ears + exposed jaw
    const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 14), cowlMat);
    cowl.scale.set(0.94, 1.06, 0.98);
    cowl.position.set(0, 0.025, 0);
    headGroup.add(cowl);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.165, 6), cowlMat);
      ear.position.set(s * 0.095, 0.2, -0.01);
      ear.rotation.z = -s * 0.08;
      headGroup.add(ear);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.012, 0.015), eyeGlow);
      eye.position.set(s * 0.048, 0.022, 0.142);
      eye.rotation.z = -s * 0.14;
      headGroup.add(eye);
    }

    const lowerFace = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.072, 0.07), skinMat);
    lowerFace.position.set(0, -0.068, 0.105);
    headGroup.add(lowerFace);

    // Charcoal tactical Kevlar chest + sculpted Bat emblem
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.52, 0.25), kevlarMat);
    chest.position.set(0, torsoY, 0);
    bodyGroup.add(chest);

    const batBody = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.082, 0.018), cowlMat);
    batBody.position.set(0, 1.28, 0.132);
    bodyGroup.add(batBody);
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.052, 0.018), cowlMat);
      wing.position.set(s * 0.078, 1.29, 0.132);
      wing.rotation.z = s * 0.22;
      bodyGroup.add(wing);
    }

    // Golden-yellow utility belt with 8 pouches & circular buckle
    const beltBand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.064, 0.26), beltGold);
    beltBand.position.set(0, 0.87, 0);
    bodyGroup.add(beltBand);
    const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 12), beltGold);
    buckle.rotation.x = Math.PI * 0.5;
    buckle.position.set(0, 0.87, 0.136);
    bodyGroup.add(buckle);
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.078, 0.048), beltGold);
      pouch.position.set(i * 0.062, 0.865, 0.132);
      bodyGroup.add(pouch);
    }

    // Flowing multi-panel scalloped dark cape!
    capePanels = buildFlowingCape(bodyGroup, 0x0b0e14, 1.05, 1.26, true);

    buildLimbs({
      upperArmMat: kevlarMat,
      forearmMat: armorBlack,
      handMat: armorBlack,
      thighMat: kevlarMat,
      shinMat: armorBlack,
      bootMat: armorBlack,
      shoulderMat: armorBlack,
      armR: 0.072,
      legR: 0.088,
      gauntletFins: true,
    });

    // Detective Vision cyan ground scan pulse ring
    detectiveRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.25, 32),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    detectiveRing.rotation.x = -Math.PI * 0.5;
    detectiveRing.position.y = 0.08;
    detectiveRing.visible = false;
    bodyGroup.add(detectiveRing);
  }

  // =========================================================================
  // CHARACTER 06: SPIDER-MAN (3 SUITS: CLASSIC | ADVANCED | IRON SPIDER + 4 GOLD ARMS)
  // =========================================================================
  else if (heroId === 'spider_man') {
    const isIron = outfitId === 'spider_iron';
    const isAdvanced = outfitId === 'spider_advanced';

    const torsoTex = isIron
      ? tex.spideyIronTorso
      : isAdvanced
        ? tex.spideyAdvancedTorso
        : tex.spideyClassicTorso;
    const maskTex = isIron ? tex.spideyIronMask : tex.spideyMask;

    const redSuit = new THREE.MeshStandardMaterial({
      map: torsoTex,
      roughness: isIron ? 0.24 : 0.62,
      metalness: isIron ? 0.85 : 0.08,
    });
    const maskMat = new THREE.MeshStandardMaterial({
      map: maskTex,
      roughness: isIron ? 0.24 : 0.6,
      metalness: isIron ? 0.84 : 0.08,
    });
    const limbRed = new THREE.MeshStandardMaterial({
      color: isIron ? 0x991b1b : isAdvanced ? 0xe11d48 : 0xdc2626,
      roughness: isIron ? 0.25 : 0.62,
      metalness: isIron ? 0.85 : 0.08,
    });
    const limbBlue = new THREE.MeshStandardMaterial({
      color: isIron ? 0x0f172a : isAdvanced ? 0x1d4ed8 : 0x1e3a8a,
      roughness: isIron ? 0.3 : 0.68,
      metalness: isIron ? 0.78 : 0.05,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.94,
    });
    const eyeRimMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });
    const eyeLensMat = new THREE.MeshBasicMaterial({ color: isIron ? 0xbef8ff : 0xf8fafc });

    // Sculpted web-patterned Spider-Man mask + expressive angled lenses
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.144, 18, 16), maskMat);
    headMesh.scale.set(0.92, 1.08, 0.98);
    headGroup.add(headMesh);

    for (const s of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.048, 0.018), eyeRimMat);
      rim.position.set(s * 0.052, 0.018, 0.132);
      rim.rotation.z = s * 0.32;
      rim.rotation.y = s * 0.26;
      headGroup.add(rim);

      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.032, 0.02), eyeLensMat);
      lens.position.set(s * 0.052, 0.018, 0.136);
      lens.rotation.z = s * 0.32;
      lens.rotation.y = s * 0.26;
      headGroup.add(lens);
      if (isIron) reactorMeshes.push(lens);
    }

    // Athletic sculpted torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.54, 0.23), redSuit);
    torso.position.set(0, torsoY, 0);
    bodyGroup.add(torso);

    buildLimbs({
      upperArmMat: limbBlue,
      forearmMat: limbRed,
      handMat: isAdvanced ? new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 }) : limbRed,
      thighMat: limbBlue,
      shinMat: limbRed,
      bootMat: limbRed,
      shoulderMat: limbRed,
      elbowArmorMat: isIron ? goldMat : undefined,
      armR: 0.06,
      legR: 0.078,
    });

    // Iron Spider 4 Articulated Golden Mechanical Spider Legs mounted on back!
    if (isIron) {
      const backMount = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 8), goldMat);
      backMount.rotation.x = Math.PI * 0.5;
      backMount.position.set(0, 1.24, -0.14);
      bodyGroup.add(backMount);

      const legConfigs: Array<{ side: number; idx: number; yOff: number }> = [
        { side: -1, idx: 0, yOff: 1.32 },
        { side: 1, idx: 0, yOff: 1.32 },
        { side: -1, idx: 1, yOff: 1.18 },
        { side: 1, idx: 1, yOff: 1.18 },
      ];
      for (const cfg of legConfigs) {
        const legRoot = new THREE.Group();
        legRoot.position.set(cfg.side * 0.09, cfg.yOff, -0.17);

        const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.56, 8), goldMat);
        seg1.position.set(cfg.side * 0.22, 0.18, -0.12);
        seg1.rotation.z = -cfg.side * 0.92;
        seg1.rotation.x = -0.35;
        legRoot.add(seg1);

        const mid = new THREE.Group();
        mid.position.set(cfg.side * 0.44, 0.36, -0.24);
        const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.58, 8), goldMat);
        seg2.position.set(cfg.side * 0.14, -0.22, 0.12);
        seg2.rotation.z = cfg.side * 0.55;
        seg2.rotation.x = 0.4;
        mid.add(seg2);

        const tip = new THREE.Group();
        tip.position.set(cfg.side * 0.26, -0.46, 0.22);
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.34, 6), goldMat);
        claw.rotation.x = Math.PI * 0.82;
        claw.position.set(0, -0.15, 0.08);
        tip.add(claw);

        mid.add(tip);
        legRoot.add(mid);
        bodyGroup.add(legRoot);
        ironSpiderLegs.push({ root: legRoot, mid, tip, side: cfg.side, idx: cfg.idx });
      }
    }

    // Radiating Spider-Sense golden tingle halo
    spiderSenseRing = new THREE.Group();
    spiderSenseRing.position.set(0, 1.66, 0);
    const senseMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 6; i++) {
      const bolt = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.16, 4), senseMat);
      const a = (i / 6) * Math.PI * 2;
      bolt.position.set(Math.cos(a) * 0.28, Math.sin(a) * 0.26, 0);
      bolt.rotation.z = a - Math.PI * 0.5;
      spiderSenseRing.add(bolt);
    }
    spiderSenseRing.visible = false;
    bodyGroup.add(spiderSenseRing);
  }

  // =========================================================================
  // CHARACTER 07 (BONUS FROM UPLOADED IMAGE): SUPERMAN
  // =========================================================================
  else {
    const isSolarBlack = outfitId === 'superman_solar_black';
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe7bc98, roughness: 0.58 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.72 });
    const blueSuit = new THREE.MeshStandardMaterial({
      color: isSolarBlack ? 0x111827 : 0x1d4ed8,
      roughness: isSolarBlack ? 0.36 : 0.45,
      metalness: isSolarBlack ? 0.38 : 0.15,
    });
    const shieldMat = isSolarBlack
      ? new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 })
      : new THREE.MeshStandardMaterial({ map: tex.supermanShield, roughness: 0.38 });
    const redSuit = new THREE.MeshStandardMaterial({
      color: isSolarBlack ? 0x1f2937 : 0xdc2626,
      roughness: isSolarBlack ? 0.32 : 0.42,
      metalness: isSolarBlack ? 0.55 : 0.14,
    });
    const goldBelt = new THREE.MeshStandardMaterial({
      color: isSolarBlack ? 0xcbd5e1 : 0xfacc15,
      roughness: 0.28,
      metalness: 0.78,
    });

    const face = buildDetailedFace(headGroup, skinMat, hairMat, 0x2563eb, { hairStyle: 'superman' });
    eyelids = face.eyelids;

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.25), blueSuit);
    chest.position.set(0, torsoY, 0);
    bodyGroup.add(chest);

    const emblem = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.22), shieldMat);
    emblem.position.set(0, 1.24, 0.13);
    bodyGroup.add(emblem);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.055, 0.25), goldBelt);
    belt.position.set(0, 0.87, 0);
    bodyGroup.add(belt);
    const trunks = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.12, 0.24), redSuit);
    trunks.position.set(0, 0.79, 0);
    bodyGroup.add(trunks);

    capePanels = buildFlowingCape(bodyGroup, isSolarBlack ? 0x0f172a : 0xc81e1e, 1.02, 1.28, false);

    buildLimbs({
      upperArmMat: blueSuit,
      forearmMat: blueSuit,
      handMat: skinMat,
      thighMat: blueSuit,
      shinMat: redSuit,
      bootMat: redSuit,
      armR: 0.076,
      legR: 0.092,
    });

    seismicRing = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 1.4, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    seismicRing.rotation.x = -Math.PI * 0.5;
    seismicRing.position.y = 0.06;
    seismicRing.visible = false;
    bodyGroup.add(seismicRing);
  }

  // Apply accurate hero stature scale (e.g. Hulkbuster = 1.56x colossal, Steve = 1.04x)
  root.scale.setScalar(spec.mobility.scaleMultiplier);

  return {
    root,
    bodyGroup,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftForearmPivot,
    rightForearmPivot,
    leftLegPivot,
    rightLegPivot,
    leftKneePivot,
    rightKneePivot,
    eyelids,
    faceplatePivot,
    capePanels,
    wingBlades,
    ironSpiderLegs,
    thrusters,
    energyShield,
    spiderSenseRing,
    detectiveRing,
    seismicRing,
    batOnBack,
    batInHand,
    reactorMeshes,
    hairTufts,
  };
}

function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (m) m.dispose();
      }
    }
  });
}

export function createHeroCharacterRig(_isSoftwareGl = false): HeroRig3D {
  const group = new THREE.Group();
  const textures = createHeroTextures();

  let currentHeroId: HeroCharacterId = 'iron_man_classic';
  let currentOutfitId: HeroOutfitId = 'iron_man_mk85';
  let handles: RigHandles | null = null;
  let faceplateAngle = 0;

  const rebuild = (heroId: HeroCharacterId, outfitId?: HeroOutfitId | null) => {
    const spec = getHeroById(heroId);
    const resolvedOutfit =
      outfitId && spec.outfits.some((o) => o.id === outfitId) ? outfitId : spec.defaultOutfitId;

    if (handles) {
      group.remove(handles.root);
      disposeObject3D(handles.root);
    }
    currentHeroId = heroId;
    currentOutfitId = resolvedOutfit;
    faceplateAngle = 0;
    stridePhase = 0;
    smoothBodyRotX = 0;
    smoothBodyRotZ = 0;
    smoothBodyPosY = 0;
    smoothHeadRotX = 0;
    handles = buildHeroRigInternal(heroId, resolvedOutfit, textures);
    group.add(handles.root);
  };

  let stridePhase = 0;
  let smoothBodyRotX = 0;
  let smoothBodyRotZ = 0;
  let smoothBodyPosY = 0;
  let smoothHeadRotX = 0;
  let lastPoseElapsed = 0;

  rebuild(currentHeroId, currentOutfitId);

  const updatePose = (pose: HeroPoseInput) => {
    if (!handles) return;
    const h = handles;
    const t = pose.elapsed;
    const dt =
      pose.dt !== undefined
        ? Math.min(Math.max(pose.dt, 0.001), 0.08)
        : Math.min(Math.max(t - lastPoseElapsed, 0.001), 0.05);
    lastPoseElapsed = t;
    const isHulkbuster = currentHeroId === 'hulkbuster';

    // Support Armory preview animation overrides cleanly
    let speed = pose.speed;
    let isFlying = Boolean(pose.isFlying);
    let isGliding = Boolean(pose.isGliding);
    let isWebSwinging = Boolean(pose.isWebSwinging);
    let attackTimer = pose.attackTimer ?? 0;
    let helmetOpen = Boolean(pose.helmetOpen);

    if (pose.previewAnim === 'run') {
      speed = isHulkbuster ? 4.2 : 6.8;
    } else if (pose.previewAnim === 'flight_swing') {
      if (currentHeroId === 'spider_man') isWebSwinging = true;
      else if (currentHeroId === 'batman') isGliding = true;
      else if (
        currentHeroId === 'iron_man_classic' ||
        currentHeroId === 'iron_man_advanced' ||
        currentHeroId === 'hulkbuster' ||
        currentHeroId === 'superman'
      ) {
        isFlying = true;
        speed = 12;
      } else {
        speed = 7.5;
      }
    } else if (pose.previewAnim === 'action') {
      attackTimer = 0.55;
    } else if (pose.previewAnim === 'helmet_pose') {
      helmetOpen = true;
    }

    // 1. Natural blinking animation for exposed faces
    const blinkCycle = t % 4.3;
    const isBlinking = blinkCycle > 4.14;
    for (const lid of h.eyelids) {
      lid.scale.y = isBlinking ? 6.2 : 1.0;
      lid.position.y = isBlinking ? 0.023 : 0.036;
    }

    // 2. Hair subtle wind/motion bounce (Steve Harrington's 80s hair!)
    for (let i = 0; i < h.hairTufts.length; i++) {
      h.hairTufts[i].rotation.x = Math.sin(t * (3.2 + speed * 0.6) + i * 0.9) * (0.04 + Math.min(0.1, speed * 0.012));
    }

    // 3. Iron Man animated hinged mechanical faceplate open/close
    if (h.faceplatePivot) {
      const targetAngle = helmetOpen ? -1.18 : 0;
      faceplateAngle += (targetAngle - faceplateAngle) * 0.16;
      h.faceplatePivot.rotation.x = faceplateAngle;
    }

    // 4. Core body locomotion / flight / web-swing / gliding / attack poses
    const isMoving = speed > 0.2;
    const strideFreq = isHulkbuster
      ? 4.6 + Math.min(2.0, speed * 0.16)
      : 6.4 + Math.min(5.4, speed * 0.34);
    if (isMoving) {
      stridePhase = (stridePhase + dt * strideFreq) % (Math.PI * 200);
    }
    const swingPhase = stridePhase;
    const swingAmp = isMoving ? Math.min(0.95, speed * (isHulkbuster ? 0.13 : 0.14)) : 0;
    const poseBlend = 1 - Math.exp(-13.5 * dt);

    let targetBodyRotX = 0;
    let targetBodyRotZ = pose.bankRad ?? 0;
    let targetBodyPosY = 0;
    let targetHeadRotX = 0;
    h.bodyGroup.rotation.y = 0;
    h.headGroup.rotation.y = Math.sin(t * 1.1) * 0.07;
    h.headGroup.rotation.z = -(pose.bankRad ?? 0) * 0.35;

    if (isFlying) {
      const lean =
        pose.pitchLeanRad !== undefined
          ? pose.pitchLeanRad
          : Math.min(1.16, 0.28 + speed * 0.045);
      targetBodyRotX = lean;
      targetBodyPosY = Math.sin(t * 3.8) * 0.1 + 0.25;
      targetHeadRotX = -lean * 0.76;
      if (currentHeroId === 'superman') {
        // Heroic Superman soaring pose: right fist thrust boldly forward, left fist raised ready in front!
        h.rightArmPivot.rotation.set(-Math.PI * 0.96, 0, -0.06);
        h.leftArmPivot.rotation.set(-Math.PI * 0.78, 0, 0.16);
        h.rightForearmPivot.rotation.set(0, 0, 0);
        h.leftForearmPivot.rotation.set(-0.28, 0, 0);
      } else {
        // Continuous hover-to-surge blend (arms forward/outward — NEVER pinned behind back or snapping!)
        const surge =
          pose.flightSurgeBlend !== undefined
            ? pose.flightSurgeBlend
            : Math.max(0, Math.min(1, (speed - 2.5) / 10.0));
        const rArmX = THREE.MathUtils.lerp(-0.48, -Math.PI * 0.92, surge);
        const rArmZ = THREE.MathUtils.lerp(-0.52, -0.14, surge);
        const lArmX = THREE.MathUtils.lerp(-0.48, -Math.PI * 0.62, surge);
        const lArmZ = THREE.MathUtils.lerp(0.52, 0.28, surge);
        const rForeX = THREE.MathUtils.lerp(-0.28, -0.08, surge);
        const lForeX = THREE.MathUtils.lerp(-0.28, -0.36, surge);
        h.rightArmPivot.rotation.set(rArmX, 0, rArmZ);
        h.leftArmPivot.rotation.set(lArmX, 0, lArmZ);
        h.rightForearmPivot.rotation.set(rForeX, 0, 0);
        h.leftForearmPivot.rotation.set(lForeX, 0, 0);
      }
      h.leftLegPivot.rotation.set(0.14, 0, 0.05);
      h.rightLegPivot.rotation.set(0.32, 0, -0.05);
      h.leftKneePivot.rotation.set(0.16, 0, 0);
      h.rightKneePivot.rotation.set(0.46, 0, 0);
    } else if (isWebSwinging) {
      // Insomniac-grade Spider-Man pendulum crouch-swing pose!
      // Body pitches dynamically with pendulum arc angle (diving into low swoop, rising legs-tucked at apex!)
      const side = pose.webHandSide ?? 1;
      const arcRad = pose.swingAngleRad ?? 0;
      targetBodyRotX = THREE.MathUtils.clamp(0.45 - arcRad * 0.55, -0.35, 0.92);
      targetBodyRotZ = side * 0.22 + (pose.bankRad ?? 0) * 0.72;
      targetBodyPosY = 0.2 + Math.sin(t * 5.2) * 0.06;
      targetHeadRotX = -targetBodyRotX * 0.45;
      if (side === 1) {
        h.rightArmPivot.rotation.set(-Math.PI * 0.94, 0, -0.14);
        h.rightForearmPivot.rotation.set(-0.08, 0, 0);
        h.leftArmPivot.rotation.set(0.75, 0.2, 0.52);
        h.leftForearmPivot.rotation.set(-0.55, 0, 0);
      } else {
        h.leftArmPivot.rotation.set(-Math.PI * 0.94, 0, 0.14);
        h.leftForearmPivot.rotation.set(-0.08, 0, 0);
        h.rightArmPivot.rotation.set(0.75, -0.2, -0.52);
        h.rightForearmPivot.rotation.set(-0.55, 0, 0);
      }
      // Iconic tucked Spider-Man mid-swing leg crouch!
      h.leftLegPivot.rotation.set(-1.05 + arcRad * 0.25, 0, 0.14);
      h.rightLegPivot.rotation.set(-0.42 + arcRad * 0.2, 0, -0.12);
      h.leftKneePivot.rotation.set(1.48, 0, 0);
      h.rightKneePivot.rotation.set(0.95, 0, 0);
    } else if (pose.isDiving) {
      // Insomniac nose-down sky-dive pose building slingshot energy!
      targetBodyRotX = 2.05;
      targetHeadRotX = -0.65;
      targetBodyPosY = 0.22;
      h.leftArmPivot.rotation.set(0.42, 0, 0.35);
      h.rightArmPivot.rotation.set(0.42, 0, -0.35);
      h.leftForearmPivot.rotation.set(-0.25, 0, 0);
      h.rightForearmPivot.rotation.set(-0.25, 0, 0);
      h.leftLegPivot.rotation.set(0.22, 0, 0.08);
      h.rightLegPivot.rotation.set(0.32, 0, -0.08);
      h.leftKneePivot.rotation.set(0.35, 0, 0);
      h.rightKneePivot.rotation.set(0.45, 0, 0);
    } else if (isGliding) {
      // Batman aerodynamic bat-cape rooftop glide!
      targetBodyRotX = 0.72;
      targetHeadRotX = -0.58;
      targetBodyPosY = 0.2 + Math.sin(t * 3.0) * 0.06;
      h.leftArmPivot.rotation.set(-0.2, 0, 1.18);
      h.rightArmPivot.rotation.set(-0.2, 0, -1.18);
      h.leftForearmPivot.rotation.set(0, 0, 0);
      h.rightForearmPivot.rotation.set(0, 0, 0);
      h.leftLegPivot.rotation.set(0.24, 0, 0.08);
      h.rightLegPivot.rotation.set(0.32, 0, -0.08);
      h.leftKneePivot.rotation.set(0.25, 0, 0);
      h.rightKneePivot.rotation.set(0.32, 0, 0);
    } else if (pose.isSitting) {
      targetBodyPosY = -0.32;
      targetBodyRotZ = 0;
      h.leftLegPivot.rotation.set(-1.42, 0, 0.05);
      h.rightLegPivot.rotation.set(-1.42, 0, -0.05);
      h.leftKneePivot.rotation.set(1.38, 0, 0);
      h.rightKneePivot.rotation.set(1.38, 0, 0);
      h.leftArmPivot.rotation.set(-0.3, 0, 0.08);
      h.rightArmPivot.rotation.set(-0.3, 0, -0.08);
    } else {
      // Ground idle / walk / heavy stomp / sprint
      const bob = isMoving ? Math.abs(Math.sin(swingPhase)) * (isHulkbuster ? 0.08 : 0.055) : Math.sin(t * 2.2) * 0.018;
      targetBodyPosY = bob;
      targetBodyRotX =
        pose.pitchLeanRad !== undefined
          ? pose.pitchLeanRad
          : isMoving
            ? Math.min(0.22, speed * 0.028)
            : 0;

      h.leftLegPivot.rotation.set(Math.sin(swingPhase) * swingAmp, 0, 0);
      h.rightLegPivot.rotation.set(-Math.sin(swingPhase) * swingAmp, 0, 0);
      h.leftKneePivot.rotation.set(Math.max(0, -Math.cos(swingPhase) * swingAmp * 0.85), 0, 0);
      h.rightKneePivot.rotation.set(Math.max(0, Math.cos(swingPhase) * swingAmp * 0.85), 0, 0);

      h.leftArmPivot.rotation.set(-Math.sin(swingPhase) * swingAmp * 0.88, 0, isHulkbuster ? 0.18 : 0.07);
      h.rightArmPivot.rotation.set(Math.sin(swingPhase) * swingAmp * 0.88, 0, isHulkbuster ? -0.18 : -0.07);
      h.leftForearmPivot.rotation.set(isMoving ? -0.45 : -0.12, 0, 0);
      h.rightForearmPivot.rotation.set(isMoving ? -0.45 : -0.12, 0, 0);
    }

    smoothBodyRotX += (targetBodyRotX - smoothBodyRotX) * poseBlend;
    smoothBodyRotZ += (targetBodyRotZ - smoothBodyRotZ) * poseBlend;
    smoothBodyPosY += (targetBodyPosY - smoothBodyPosY) * poseBlend;
    smoothHeadRotX += (targetHeadRotX - smoothHeadRotX) * poseBlend;

    h.bodyGroup.rotation.x = smoothBodyRotX;
    h.bodyGroup.rotation.z = smoothBodyRotZ;
    h.bodyGroup.position.y = smoothBodyPosY;
    h.headGroup.rotation.x = smoothHeadRotX;

    // 4b. Insomniac 360° Mid-Air Acrobatic Spins / Flips on Web-Swing Release!
    const trickKind = pose.airTrickKind ?? 'none';
    const trickAngle = pose.airTrickAngle ?? 0;
    if (trickKind !== 'none' && !isWebSwinging && trickAngle > 0.01) {
      if (trickKind === 'front_flip') {
        h.bodyGroup.rotation.x = trickAngle;
        h.leftLegPivot.rotation.set(-1.35, 0, 0.08);
        h.rightLegPivot.rotation.set(-1.35, 0, -0.08);
        h.leftKneePivot.rotation.set(1.65, 0, 0);
        h.rightKneePivot.rotation.set(1.65, 0, 0);
        h.leftArmPivot.rotation.set(-0.95, 0, 0.32);
        h.rightArmPivot.rotation.set(-0.95, 0, -0.32);
      } else if (trickKind === 'corkscrew_spin') {
        h.bodyGroup.rotation.x = 0.55;
        h.bodyGroup.rotation.y = trickAngle * 1.4;
        h.bodyGroup.rotation.z = Math.sin(trickAngle) * 0.45;
        h.leftArmPivot.rotation.set(-0.4, 0, 0.95);
        h.rightArmPivot.rotation.set(-0.4, 0, -0.95);
      } else if (trickKind === 'back_tuck') {
        h.bodyGroup.rotation.x = -trickAngle;
        h.leftLegPivot.rotation.set(-1.25, 0, 0.1);
        h.rightLegPivot.rotation.set(-1.25, 0, -0.1);
        h.leftKneePivot.rotation.set(1.55, 0, 0);
        h.rightKneePivot.rotation.set(1.55, 0, 0);
      } else if (trickKind === 'web_cyclone') {
        h.bodyGroup.rotation.y = trickAngle * 2.0;
        h.leftArmPivot.rotation.set(-1.35, 0, 0.88);
        h.rightArmPivot.rotation.set(-1.35, 0, -0.88);
      }
    }

    // 4c. Acrobatic Dodge Roll / Spider-Flip / Jet-Dash Animation!
    const dodgeT = pose.dodgeTimer ?? 0;
    if (dodgeT > 0.01) {
      const p = 1 - Math.min(1, dodgeT / 0.48);
      const dk = pose.dodgeKind ?? 'combat_roll';
      if (dk === 'spider_flip') {
        h.bodyGroup.rotation.x = p * Math.PI * 2;
        h.bodyGroup.position.y = Math.sin(p * Math.PI) * 0.95;
        h.leftLegPivot.rotation.set(-1.3, 0, 0.1);
        h.rightLegPivot.rotation.set(-1.3, 0, -0.1);
        h.leftKneePivot.rotation.set(1.6, 0, 0);
        h.rightKneePivot.rotation.set(1.6, 0, 0);
      } else if (dk === 'jet_dash') {
        h.bodyGroup.rotation.z = Math.sin(p * Math.PI) * 0.65;
        h.bodyGroup.rotation.x = 0.55;
        h.bodyGroup.position.y = 0.25 + Math.sin(p * Math.PI) * 0.35;
      } else if (dk === 'cape_evade') {
        h.bodyGroup.rotation.y = p * Math.PI * 2;
        h.bodyGroup.position.y = Math.sin(p * Math.PI) * 0.45;
      } else {
        h.bodyGroup.rotation.x = p * Math.PI * 2;
        h.bodyGroup.position.y = -0.25 + Math.sin(p * Math.PI) * 0.4;
      }
    }

    // 5. Primary Power / Attack Animations
    const isAttacking = attackTimer > 0.02;
    if (h.batOnBack && h.batInHand) {
      h.batOnBack.visible = !isAttacking;
      h.batInHand.visible = isAttacking;
    } else if (h.batInHand) {
      h.batInHand.visible = isAttacking;
    }

    if (isAttacking) {
      if (currentHeroId === 'steve_harrington') {
        const swing = Math.sin(t * 24) * 1.1;
        h.rightArmPivot.rotation.set(-1.35, -0.45 + swing, -0.5);
        h.rightForearmPivot.rotation.set(-0.35, 0, 0);
        h.bodyGroup.rotation.y = swing * 0.35;
      } else if (currentHeroId === 'iron_man_classic' || currentHeroId === 'iron_man_advanced') {
        // Dual outstretched palm repulsor / Unibeam firing stance!
        h.leftArmPivot.rotation.set(-Math.PI * 0.48, 0.14, 0.08);
        h.rightArmPivot.rotation.set(-Math.PI * 0.48, -0.14, -0.08);
        h.leftForearmPivot.rotation.set(0, 0, 0);
        h.rightForearmPivot.rotation.set(0, 0, 0);
      } else if (currentHeroId === 'hulkbuster') {
        // Ground-shattering overhead seismic double-fist smash!
        h.leftArmPivot.rotation.set(-1.15, 0.2, 0.22);
        h.rightArmPivot.rotation.set(-1.15, -0.2, -0.22);
        h.bodyGroup.rotation.x = 0.35;
      } else if (currentHeroId === 'batman' || currentHeroId === 'spider_man') {
        h.rightArmPivot.rotation.set(-Math.PI * 0.52, -0.08, -0.08);
        h.rightForearmPivot.rotation.set(0, 0, 0);
      }
    }

    // 6. Cape fluid cloth simulation (Batman & Superman)
    for (let i = 0; i < h.capePanels.length; i++) {
      const panel = h.capePanels[i];
      const frac = (i / Math.max(1, h.capePanels.length - 1)) * 2 - 1;
      const billow = isGliding
        ? 0.45
        : isFlying
          ? 0.95 + Math.sin(t * 14 + i) * 0.14
          : 0.14 + Math.min(0.62, speed * 0.08) + Math.sin(t * (3.2 + speed * 0.55) + i * 0.85) * 0.09;
      panel.rotation.x = billow;
      panel.rotation.z = isGliding ? frac * 0.68 : frac * (0.08 + Math.min(0.18, speed * 0.02));
    }

    // 7. Iron Man Advanced 4 Rear Flight Stabilizer Wings
    for (let i = 0; i < h.wingBlades.length; i++) {
      const b = h.wingBlades[i];
      const baseZ = (b.userData.baseZRot as number) ?? 0;
      const spreadMul = isFlying || isAttacking ? 1.42 : 0.72;
      b.rotation.z = baseZ * spreadMul + Math.sin(t * 5 + i) * (isFlying ? 0.07 : 0.015);
      b.rotation.x = isFlying ? -0.35 : -0.1;
    }

    // 8. Iron Spider 4 Articulated Mechanical Gold Spider Legs
    for (let i = 0; i < h.ironSpiderLegs.length; i++) {
      const leg = h.ironSpiderLegs[i];
      const phase = t * (isMoving || isWebSwinging ? 7.5 : 2.6) + i * 1.55;
      leg.root.rotation.y = leg.side * (isAttacking ? -0.52 : 0.14) + Math.sin(phase) * 0.18;
      leg.root.rotation.x = (isWebSwinging ? -0.35 : 0.05) + Math.cos(phase) * 0.14;
      leg.mid.rotation.z = Math.sin(phase + 0.8) * 0.22;
      leg.tip.rotation.x = Math.cos(phase + 1.4) * 0.25;
    }

    // 9. Flight thrusters, Energy Shield, Spider-Sense, Detective Vision & Seismic Ring
    const showThrust = isFlying || (isAttacking && (currentHeroId === 'iron_man_classic' || currentHeroId === 'iron_man_advanced'));
    for (let i = 0; i < h.thrusters.length; i++) {
      const th = h.thrusters[i];
      th.visible = showThrust;
      if (showThrust) {
        const pulse = 0.85 + Math.sin(t * 36 + i * 1.3) * 0.25;
        th.scale.set(1, pulse, 1);
      }
    }

    if (h.energyShield) {
      h.energyShield.visible = Boolean(pose.energyShieldActive);
      if (h.energyShield.visible) {
        h.energyShield.rotation.y = t * 0.9;
        const s = 1 + Math.sin(t * 6) * 0.03;
        h.energyShield.scale.setScalar(s);
      }
    }

    if (h.spiderSenseRing) {
      h.spiderSenseRing.visible = Boolean(pose.spiderSenseActive);
      if (h.spiderSenseRing.visible) {
        h.spiderSenseRing.rotation.z = t * 4.5;
        const s = 1 + Math.sin(t * 14) * 0.14;
        h.spiderSenseRing.scale.setScalar(s);
      }
    }

    if (h.detectiveRing) {
      h.detectiveRing.visible = Boolean(pose.detectiveVisionActive);
      if (h.detectiveRing.visible) {
        const p = (t * 0.95) % 1;
        h.detectiveRing.scale.setScalar(0.8 + p * 5.2);
      }
    }

    if (h.seismicRing) {
      h.seismicRing.visible = isAttacking && (currentHeroId === 'hulkbuster' || currentHeroId === 'superman');
      if (h.seismicRing.visible) {
        const s = 1.2 + (1 - Math.min(1, attackTimer)) * 3.8;
        h.seismicRing.scale.setScalar(s);
      }
    }
  };

  return {
    group,
    setHero: rebuild,
    updatePose,
    getCurrentHero: () => ({ heroId: currentHeroId, outfitId: currentOutfitId }),
    dispose: () => {
      if (handles) disposeObject3D(handles.root);
      Object.values(textures).forEach((tex) => tex.dispose());
    },
  };
}
