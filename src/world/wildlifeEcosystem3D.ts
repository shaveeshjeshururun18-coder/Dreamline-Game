import * as THREE from 'three';
import {
  getWildlifeSpeciesById,
  type WildlifeActorState,
  type WildlifeSpeciesId,
} from '../game/wildlifeEcosystem';
import {
  groundHeightAt,
  WATER_LEVEL,
  WILDLIFE_FOREST_SANCTUARY_CENTER,
  WILDLIFE_SANCTUARY_POND_CENTER,
} from '../game/terrain';

interface WildlifeRig {
  uid: string;
  speciesId: WildlifeSpeciesId;
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  legs: THREE.Object3D[];
  leftWing?: THREE.Object3D;
  rightWing?: THREE.Object3D;
  tail?: THREE.Object3D;
  trunk?: THREE.Object3D;
  ears?: THREE.Object3D[];
  peacockFan?: THREE.Object3D;
}

export interface WildlifeEcosystemWorld {
  root: THREE.Group;
  update: (actors: WildlifeActorState[], elapsed: number) => void;
}

function makePatternTex(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  draw(ctx, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function createWildlifePatternTextures() {
  const tigerCoat = makePatternTex((ctx, w, h) => {
    ctx.fillStyle = '#d4762c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1c140e';
    for (let x = 6; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 7, h * 0.45);
      ctx.lineTo(x + 2, h);
      ctx.lineTo(x - 4, h * 0.55);
      ctx.closePath();
      ctx.fill();
    }
  });

  const leopardCoat = makePatternTex((ctx, w, h) => {
    ctx.fillStyle = '#cda054';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 42; i++) {
      const x = (i * 37) % w;
      const y = (i * 53) % h;
      ctx.strokeStyle = '#2a1d12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const peacockFeather = makePatternTex((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#186694');
    g.addColorStop(0.55, '#197f5c');
    g.addColorStop(1, '#124c3b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Iridescent gold & sapphire ocelli eyespots
    for (let i = 0; i < 18; i++) {
      const x = 14 + ((i * 29) % (w - 28));
      const y = 14 + ((i * 41) % (h - 28));
      ctx.fillStyle = '#e2b63f';
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#144c8c';
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const shadowTex = makePatternTex((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(10, 12, 10, 0.5)');
    g.addColorStop(1, 'rgba(10, 12, 10, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  return { tigerCoat, leopardCoat, peacockFeather, shadowTex };
}

function buildQuadrupedRig(
  actor: WildlifeActorState,
  textures: ReturnType<typeof createWildlifePatternTextures>,
  castShadow: boolean
): WildlifeRig {
  const spec = getWildlifeSpeciesById(actor.speciesId);
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  let tail: THREE.Object3D | undefined;
  let trunk: THREE.Object3D | undefined;
  let ears: THREE.Object3D[] | undefined;

  const isTiger = actor.speciesId === 'tiger';
  const isLeopard = actor.speciesId === 'leopard';
  const isElephant = actor.speciesId === 'elephant';
  const isGaur = actor.speciesId === 'gaur';
  const isDeer = actor.speciesId === 'sambar_deer';
  const isBoar = actor.speciesId === 'wild_boar';
  const isBear = actor.speciesId === 'sloth_bear';
  const isPrimate = actor.speciesId === 'macaque' || actor.speciesId === 'nilgiri_langur';
  const isOtter = actor.speciesId === 'otter';
  const isMonitor = actor.speciesId === 'monitor_lizard';

  const primaryMat = new THREE.MeshStandardMaterial({
    color: isTiger || isLeopard ? 0xffffff : spec.primaryColor,
    map: isTiger ? textures.tigerCoat : isLeopard ? textures.leopardCoat : null,
    roughness: isOtter || isMonitor ? 0.42 : 0.84,
    metalness: 0.04,
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: spec.secondaryColor,
    roughness: 0.86,
    metalness: 0.03,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: spec.accentColor,
    roughness: 0.48,
    metalness: 0.08,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.08,
    metalness: 0.25,
  });

  // Species anatomical proportions
  const dims = isElephant
    ? { bw: 1.55, bh: 1.55, bl: 2.55, legH: 1.55, legR: 0.24, neckZ: 1.38, neckY: 2.25, headR: 0.62 }
    : isGaur
    ? { bw: 1.05, bh: 1.15, bl: 2.05, legH: 1.02, legR: 0.14, neckZ: 1.06, neckY: 1.65, headR: 0.42 }
    : isDeer
    ? { bw: 0.62, bh: 0.68, bl: 1.48, legH: 0.92, legR: 0.075, neckZ: 0.78, neckY: 1.48, headR: 0.24 }
    : isTiger || isLeopard
    ? { bw: 0.66, bh: 0.62, bl: 1.68, legH: 0.72, legR: 0.11, neckZ: 0.92, neckY: 1.12, headR: 0.29 }
    : isBear
    ? { bw: 0.82, bh: 0.78, bl: 1.48, legH: 0.64, legR: 0.14, neckZ: 0.84, neckY: 1.12, headR: 0.31 }
    : isBoar
    ? { bw: 0.56, bh: 0.54, bl: 1.18, legH: 0.44, legR: 0.085, neckZ: 0.64, neckY: 0.72, headR: 0.26 }
    : isPrimate
    ? { bw: 0.36, bh: 0.42, bl: 0.72, legH: 0.44, legR: 0.06, neckZ: 0.36, neckY: 0.72, headR: 0.19 }
    : isOtter
    ? { bw: 0.32, bh: 0.28, bl: 1.05, legH: 0.22, legR: 0.06, neckZ: 0.56, neckY: 0.36, headR: 0.16 }
    : /* monitor_lizard */ { bw: 0.32, bh: 0.2, bl: 1.12, legH: 0.22, legR: 0.055, neckZ: 0.66, neckY: 0.32, headR: 0.14 };

  const torsoY = dims.legH + dims.bh * 0.42;
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(dims.bw * 0.5, dims.bl * 0.58, 8, 14),
    primaryMat
  );
  torso.rotation.x = Math.PI / 2;
  torso.scale.set(1.0, 1.0, dims.bh / dims.bw);
  torso.position.set(0, torsoY, 0);
  torso.castShadow = castShadow;
  body.add(torso);

  // Muscular shoulder hump for Indian Gaur or Sloth Bear white chest V
  if (isGaur) {
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), primaryMat);
    hump.position.set(0, torsoY + 0.32, 0.35);
    body.add(hump);
  }
  if (isBear) {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.12), secondaryMat);
    crest.position.set(0, torsoY - 0.04, dims.bl * 0.48);
    body.add(crest);
  }

  // Articulated Head & Snout
  head.position.set(0, dims.neckY, dims.neckZ);
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(dims.headR, 12, 10),
    actor.speciesId === 'nilgiri_langur' ? secondaryMat : primaryMat
  );
  skull.scale.set(0.92, 0.9, 1.18);
  skull.castShadow = castShadow;
  head.add(skull);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(dims.headR * 0.72, dims.headR * 0.52, dims.headR * 0.82),
    isDeer || isPrimate ? secondaryMat : primaryMat
  );
  snout.position.set(0, -dims.headR * 0.14, dims.headR * 0.85);
  head.add(snout);

  // Glossy eyes with specular highlight
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(dims.headR * 0.13, 8, 8), eyeMat);
    eye.position.set(sx * dims.headR * 0.54, dims.headR * 0.22, dims.headR * 0.64);
    head.add(eye);
  }

  // Species signature anatomy!
  if (isElephant) {
    // Articulated elephant trunk
    const trunkGroup = new THREE.Group();
    trunkGroup.position.set(0, -0.15, 0.62);
    const tUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.95, 10), primaryMat);
    tUpper.position.set(0, -0.45, 0.18);
    tUpper.rotation.x = 0.28;
    trunkGroup.add(tUpper);
    const tLower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.78, 10), primaryMat);
    tLower.position.set(0, -1.16, 0.24);
    tLower.rotation.x = -0.18;
    trunkGroup.add(tLower);
    head.add(trunkGroup);
    trunk = trunkGroup;

    // Ivory tusks & large flapping ears
    ears = [];
    for (const sx of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.95, 8), accentMat);
      tusk.rotation.x = Math.PI * 0.36;
      tusk.position.set(sx * 0.28, -0.25, 0.72);
      head.add(tusk);

      const earPivot = new THREE.Group();
      earPivot.position.set(sx * 0.54, 0.12, -0.06);
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.66), secondaryMat);
      ear.position.set(sx * 0.16, -0.06, -0.16);
      earPivot.add(ear);
      head.add(earPivot);
      ears.push(earPivot);
    }
  } else if (isGaur) {
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.62, 8), accentMat);
      horn.position.set(sx * 0.38, 0.34, 0.06);
      horn.rotation.z = sx * -0.68;
      head.add(horn);
    }
  } else if (isDeer) {
    // Graceful branching antlers & neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.62, 10), primaryMat);
    neck.position.set(0, torsoY + 0.26, 0.62);
    neck.rotation.x = 0.35;
    body.add(neck);
    for (const sx of [-1, 1]) {
      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.032, 0.58, 6), accentMat);
      antler.position.set(sx * 0.16, 0.34, -0.04);
      antler.rotation.z = sx * -0.45;
      head.add(antler);
      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.26, 6), accentMat);
      tine.position.set(sx * 0.28, 0.44, 0.08);
      tine.rotation.x = 0.55;
      head.add(tine);
    }
  } else if (isBoar) {
    for (const sx of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18, 6), accentMat);
      tusk.position.set(sx * 0.13, -0.06, 0.28);
      tusk.rotation.z = sx * -0.5;
      head.add(tusk);
    }
  }

  body.add(head);

  // 4 Articulated Legs
  const lx = dims.bw * 0.38;
  const lz = dims.bl * 0.34;
  const legCoords: Array<[number, number]> = [
    [-lx, lz],
    [lx, lz],
    [-lx, -lz],
    [lx, -lz],
  ];
  for (const [xPos, zPos] of legCoords) {
    const legPivot = new THREE.Group();
    legPivot.position.set(xPos, dims.legH, zPos);
    const legMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(dims.legR, dims.legR * 0.8, dims.legH, 8),
      isGaur ? accentMat : primaryMat
    );
    legMesh.position.y = -dims.legH * 0.5;
    legMesh.castShadow = castShadow;
    legPivot.add(legMesh);
    body.add(legPivot);
    legs.push(legPivot);
  }

  // Expressive Tail
  const tailLen = isTiger || isLeopard || isPrimate || isMonitor || isOtter ? dims.bl * 0.82 : dims.bl * 0.38;
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, torsoY, -dims.bl * 0.48);
  const tailMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(dims.legR * 0.45, dims.legR * 0.22, tailLen, 8),
    primaryMat
  );
  tailMesh.rotation.x = isMonitor || isOtter ? -Math.PI * 0.46 : -Math.PI * 0.28;
  tailMesh.position.set(0, -tailLen * 0.22, -tailLen * 0.42);
  tailPivot.add(tailMesh);
  body.add(tailPivot);
  tail = tailPivot;

  root.add(body);

  // Grounding contact shadow disc
  if (!isOtter) {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(dims.bw * 2.1, dims.bl * 1.65),
      new THREE.MeshBasicMaterial({
        map: textures.shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.46,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    root.add(shadow);
  }

  root.scale.setScalar(actor.scale);
  return { uid: actor.uid, speciesId: actor.speciesId, root, body, head, legs, tail, trunk, ears };
}

function buildBirdRig(
  actor: WildlifeActorState,
  textures: ReturnType<typeof createWildlifePatternTextures>,
  castShadow: boolean
): WildlifeRig {
  const spec = getWildlifeSpeciesById(actor.speciesId);
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  let peacockFan: THREE.Object3D | undefined;

  const isPeacock = actor.speciesId === 'peacock';
  const isHornbill = actor.speciesId === 'hornbill';
  const isEgret = actor.speciesId === 'water_egret';
  const isEagle = actor.speciesId === 'eagle';

  const bodyMat = new THREE.MeshStandardMaterial({ color: spec.primaryColor, roughness: 0.56, metalness: 0.14 });
  const wingMat = new THREE.MeshStandardMaterial({ color: spec.secondaryColor, roughness: 0.62, metalness: 0.12 });
  const beakMat = new THREE.MeshStandardMaterial({ color: spec.accentColor, roughness: 0.35, metalness: 0.18 });

  const bodyY = isPeacock || isEgret ? 0.62 : 0.25;
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bodyMat);
  torso.scale.set(0.85, 0.82, 1.55);
  torso.position.set(0, bodyY, 0);
  torso.castShadow = castShadow;
  body.add(torso);

  // Neck + Head + Beak
  head.position.set(0, bodyY + (isPeacock || isEgret ? 0.38 : 0.12), 0.32);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), bodyMat);
  head.add(skull);

  const beakLen = isHornbill ? 0.42 : isEgret ? 0.28 : 0.16;
  const beak = new THREE.Mesh(new THREE.ConeGeometry(isHornbill ? 0.075 : 0.04, beakLen, 8), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0, 0.12 + beakLen * 0.45);
  head.add(beak);
  if (isHornbill) {
    // Iconic golden casque atop Great Hornbill beak
    const casque = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.22), wingMat);
    casque.position.set(0, 0.1, 0.18);
    head.add(casque);
  }
  body.add(head);

  // Articulated Flapping Wings
  const wingSpan = isEagle || isHornbill ? 1.05 : isPeacock || isEgret ? 0.42 : 0.56;
  const leftWing = new THREE.Group();
  leftWing.position.set(-0.18, bodyY + 0.04, 0.04);
  const lwMesh = new THREE.Mesh(new THREE.BoxGeometry(wingSpan, 0.04, 0.34), wingMat);
  lwMesh.position.x = -wingSpan * 0.5;
  leftWing.add(lwMesh);
  body.add(leftWing);

  const rightWing = new THREE.Group();
  rightWing.position.set(0.18, bodyY + 0.04, 0.04);
  const rwMesh = new THREE.Mesh(new THREE.BoxGeometry(wingSpan, 0.04, 0.34), wingMat);
  rwMesh.position.x = wingSpan * 0.5;
  rightWing.add(rwMesh);
  body.add(rightWing);

  // Peacock Iridescent Fanned Tail Train!
  if (isPeacock) {
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.peacockFeather,
      roughness: 0.34,
      metalness: 0.36,
      side: THREE.DoubleSide,
    });
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, bodyY + 0.06, -0.32);
    const fanDisc = new THREE.Mesh(new THREE.CircleGeometry(0.92, 18, 0, Math.PI), fanMat);
    fanDisc.position.set(0, 0.04, -0.05);
    fanGroup.add(fanDisc);
    body.add(fanGroup);
    peacockFan = fanGroup;
  } else {
    const tailFeather = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.38), bodyMat);
    tailFeather.position.set(0, bodyY, -0.44);
    body.add(tailFeather);
  }

  // Legs for ground-walking birds (Peacock & Egret)
  if (isPeacock || isEgret) {
    for (const sx of [-0.09, 0.09]) {
      const legP = new THREE.Group();
      legP.position.set(sx, bodyY - 0.14, 0);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, bodyY - 0.12, 6), beakMat);
      leg.position.y = -(bodyY - 0.12) * 0.5;
      legP.add(leg);
      body.add(legP);
      legs.push(legP);
    }
  }

  root.add(body);
  root.scale.setScalar(actor.scale);
  return {
    uid: actor.uid,
    speciesId: actor.speciesId,
    root,
    body,
    head,
    legs,
    leftWing,
    rightWing,
    peacockFan,
  };
}

function buildReptileAmphibianRig(
  actor: WildlifeActorState,
  textures: ReturnType<typeof createWildlifePatternTextures>,
  castShadow: boolean
): WildlifeRig {
  const spec = getWildlifeSpeciesById(actor.speciesId);
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const legs: THREE.Object3D[] = [];

  if (actor.speciesId === 'turtle') {
    const shellMat = new THREE.MeshStandardMaterial({ color: spec.primaryColor, roughness: 0.46, metalness: 0.12 });
    const skinMat = new THREE.MeshStandardMaterial({ color: spec.secondaryColor, roughness: 0.66 });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), shellMat);
    shell.scale.set(1.0, 0.48, 1.24);
    shell.position.set(0, 0.2, 0);
    body.add(shell);
    head.position.set(0, 0.18, 0.56);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), skinMat));
    body.add(head);
    for (const [fx, fz] of [
      [-0.42, 0.22],
      [0.42, 0.22],
      [-0.36, -0.32],
      [0.36, -0.32],
    ]) {
      const flipper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.14), skinMat);
      flipper.position.set(fx, 0.14, fz);
      body.add(flipper);
      legs.push(flipper);
    }
  } else {
    // Malabar Gliding Frog
    const frogMat = new THREE.MeshStandardMaterial({ color: spec.primaryColor, roughness: 0.28, metalness: 0.08 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: spec.accentColor, roughness: 0.4 });
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), frogMat);
    torso.scale.set(1.0, 0.72, 1.22);
    torso.position.set(0, 0.16, 0);
    body.add(torso);
    head.position.set(0, 0.22, 0.16);
    for (const sx of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bellyMat);
      eye.position.set(sx, 0.06, 0.04);
      head.add(eye);
    }
    body.add(head);
    for (const sx of [-0.15, 0.15]) {
      const hindLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.24), frogMat);
      hindLeg.position.set(sx, 0.08, -0.14);
      body.add(hindLeg);
      legs.push(hindLeg);
    }
  }

  root.add(body);
  root.scale.setScalar(actor.scale);
  return { uid: actor.uid, speciesId: actor.speciesId, root, body, head, legs };
}

export function createWildlifeEcosystemWorld(
  initialActors: WildlifeActorState[],
  castShadow: boolean
): WildlifeEcosystemWorld {
  const root = new THREE.Group();
  root.name = 'living_wildlife_ecosystem';

  const textures = createWildlifePatternTextures();
  const rigs = new Map<string, WildlifeRig>();

  for (const actor of initialActors) {
    let rig: WildlifeRig;
    if (actor.category === 'bird') {
      rig = buildBirdRig(actor, textures, castShadow);
    } else if (actor.speciesId === 'turtle' || actor.speciesId === 'frog') {
      rig = buildReptileAmphibianRig(actor, textures, castShadow);
    } else {
      rig = buildQuadrupedRig(actor, textures, castShadow);
    }
    rig.root.position.set(actor.x, actor.y, actor.z);
    rig.root.rotation.y = actor.heading;
    root.add(rig.root);
    rigs.set(actor.uid, rig);
  }

  // =========================================================================
  // DEDICATED PANIMALAI WILDLIFE FOREST SANCTUARY SETUP (NEAR SNOW REGION)
  // Lush evergreen reserve, mossy boulders, forest pond, boardwalk & watchtower
  // =========================================================================
  const sc = WILDLIFE_FOREST_SANCTUARY_CENTER;
  const pondC = WILDLIFE_SANCTUARY_POND_CENTER;
  const sanctuaryGroup = new THREE.Group();
  sanctuaryGroup.name = 'panimalai_wildlife_forest_sanctuary';

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4b382a, roughness: 0.92, metalness: 0.02 });
  const pineDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e4a2b, roughness: 0.86, metalness: 0.02 });
  const pineMidMat = new THREE.MeshStandardMaterial({ color: 0x2c6336, roughness: 0.84, metalness: 0.02 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5c6258, roughness: 0.9, metalness: 0.05 });
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x6f4b30, roughness: 0.8, metalness: 0.04 });
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x1e3824,
    emissive: new THREE.Color(0x163820),
    emissiveIntensity: 0.25,
    roughness: 0.55,
  });

  // 115 instanced evergreen & alpine-forest trees encircling the sanctuary clearings
  const treeCount = 115;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 4.4, 7);
  const foliageLowGeo = new THREE.ConeGeometry(2.35, 5.2, 8);
  const foliageTopGeo = new THREE.ConeGeometry(1.65, 4.1, 8);
  const trunks = new THREE.InstancedMesh(trunkGeo, barkMat, treeCount);
  const crownsLow = new THREE.InstancedMesh(foliageLowGeo, pineDarkMat, treeCount);
  const crownsTop = new THREE.InstancedMesh(foliageTopGeo, pineMidMat, treeCount);
  const dObj = new THREE.Object3D();

  let tPlaced = 0;
  for (let i = 0; i < 240 && tPlaced < treeCount; i++) {
    const ang = i * 2.39996;
    const rad = 14 + Math.sqrt(i / 240) * 44;
    const tx = sc.x + Math.cos(ang) * rad;
    const tz = sc.z + Math.sin(ang) * rad;
    // Keep pond & southern entrance trail clear
    if (Math.hypot(tx - pondC.x, tz - pondC.z) < 15.5) continue;
    if (Math.abs(tx - sc.x) < 5.5 && tz > sc.z + 12) continue;
    const ty = groundHeightAt(tx, tz);
    if (ty < WATER_LEVEL + 0.35) continue;

    const s = 0.82 + ((i * 37) % 100) / 135;
    dObj.position.set(tx, ty + 2.1 * s, tz);
    dObj.rotation.set(0, ang, 0);
    dObj.scale.set(s, s, s);
    dObj.updateMatrix();
    trunks.setMatrixAt(tPlaced, dObj.matrix);

    dObj.position.set(tx, ty + 5.2 * s, tz);
    dObj.updateMatrix();
    crownsLow.setMatrixAt(tPlaced, dObj.matrix);

    dObj.position.set(tx, ty + 7.9 * s, tz);
    dObj.updateMatrix();
    crownsTop.setMatrixAt(tPlaced, dObj.matrix);
    tPlaced++;
  }
  trunks.count = tPlaced;
  crownsLow.count = tPlaced;
  crownsTop.count = tPlaced;
  trunks.instanceMatrix.needsUpdate = true;
  crownsLow.instanceMatrix.needsUpdate = true;
  crownsTop.instanceMatrix.needsUpdate = true;
  sanctuaryGroup.add(trunks, crownsLow, crownsTop);

  // 42 mossy forest boulders & understory ferns
  const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 42);
  let rPlaced = 0;
  for (let i = 0; i < 80 && rPlaced < 42; i++) {
    const ang = i * 1.91 + 0.4;
    const rad = 11 + ((i * 23) % 38);
    const rx = sc.x + Math.cos(ang) * rad;
    const rz = sc.z + Math.sin(ang) * rad;
    const ry = groundHeightAt(rx, rz);
    if (ry < WATER_LEVEL + 0.1) continue;
    const sx = 0.7 + ((i * 13) % 12) * 0.11;
    const sy = 0.45 + ((i * 17) % 10) * 0.08;
    dObj.position.set(rx, ry + sy * 0.35, rz);
    dObj.rotation.set(i * 0.2, ang, i * 0.15);
    dObj.scale.set(sx, sy, sx * 0.85);
    dObj.updateMatrix();
    rocks.setMatrixAt(rPlaced++, dObj.matrix);
  }
  rocks.count = rPlaced;
  rocks.instanceMatrix.needsUpdate = true;
  sanctuaryGroup.add(rocks);

  // Shimmering Sanctuary Forest Pond + Lily Pads
  const pondMat = new THREE.MeshStandardMaterial({
    color: 0x1d7578,
    roughness: 0.14,
    metalness: 0.22,
    transparent: true,
    opacity: 0.88,
  });
  const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(12.6, 28), pondMat);
  pondMesh.rotation.x = -Math.PI / 2;
  pondMesh.position.set(pondC.x, WATER_LEVEL + 0.02, pondC.z);
  sanctuaryGroup.add(pondMesh);

  // Rustic Timber Wildlife Reserve Entrance Arch (facing south toward snow valley)
  const archX = sc.x;
  const archZ = sc.z + 30;
  const archY = groundHeightAt(archX, archZ);
  for (const sx of [-3.6, 3.6]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 5.4, 8), timberMat);
    post.position.set(archX + sx, archY + 2.7, archZ);
    sanctuaryGroup.add(post);
  }
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.55, 0.65), timberMat);
  archBeam.position.set(archX, archY + 5.3, archZ);
  const archBoard = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.05, 0.18), signMat);
  archBoard.position.set(archX, archY + 4.55, archZ + 0.2);
  sanctuaryGroup.add(archBeam, archBoard);

  // Wooden Wildlife Observation Watchtower overlooking the Forest Sanctuary
  const towerX = sc.x - 11;
  const towerZ = sc.z + 24;
  const towerY = groundHeightAt(towerX, towerZ);
  for (const sx of [-1.4, 1.4]) {
    for (const sz of [-1.4, 1.4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.4, 7), timberMat);
      leg.position.set(towerX + sx, towerY + 3.2, towerZ + sz);
      sanctuaryGroup.add(leg);
    }
  }
  const towerDeck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 3.8), timberMat);
  towerDeck.position.set(towerX, towerY + 6.3, towerZ);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.7, 4), pineDarkMat);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(towerX, towerY + 9.1, towerZ);
  sanctuaryGroup.add(towerDeck, towerRoof);

  // Separated Wildlife Reserve Timber Perimeter Fence (48 posts around the 44m forest border, open at entrance arch)
  const fenceRadius = 43.5;
  const fenceCount = 44;
  const postGeo = new THREE.CylinderGeometry(0.11, 0.14, 1.45, 6);
  const railGeo = new THREE.BoxGeometry(6.1, 0.12, 0.1);
  for (let f = 0; f < fenceCount; f++) {
    const a = (f / fenceCount) * Math.PI * 2;
    const fx = sc.x + Math.cos(a) * fenceRadius;
    const fz = sc.z + Math.sin(a) * fenceRadius;
    // Leave wide safari entry opening beside the welcome arch (+Z side)
    if (Math.hypot(fx - archX, fz - archZ) < 11.5) continue;
    const fy = groundHeightAt(fx, fz);
    const post = new THREE.Mesh(postGeo, timberMat);
    post.position.set(fx, fy + 0.7, fz);
    sanctuaryGroup.add(post);

    const nextA = ((f + 1) / fenceCount) * Math.PI * 2;
    const nx = sc.x + Math.cos(nextA) * fenceRadius;
    const nz = sc.z + Math.sin(nextA) * fenceRadius;
    if (Math.hypot(nx - archX, nz - archZ) < 11.5) continue;
    const mx = (fx + nx) * 0.5;
    const mz = (fz + nz) * 0.5;
    const my = groundHeightAt(mx, mz);
    const yaw = Math.atan2(nx - fx, nz - fz) + Math.PI * 0.5;
    const railTop = new THREE.Mesh(railGeo, timberMat);
    railTop.position.set(mx, my + 1.15, mz);
    railTop.rotation.y = yaw;
    const railMid = new THREE.Mesh(railGeo, timberMat);
    railMid.position.set(mx, my + 0.62, mz);
    railMid.rotation.y = yaw;
    sanctuaryGroup.add(railTop, railMid);
  }

  root.add(sanctuaryGroup);

  const update = (actors: WildlifeActorState[], elapsed: number) => {
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      const rig = rigs.get(a.uid);
      if (!rig) continue;

      rig.root.position.set(a.x, a.y, a.z);
      rig.root.rotation.y = a.heading;

      // Subtle living breathing expansion
      const breath = 1 + Math.sin(a.breathPhase) * 0.025;
      rig.body.scale.set(breath, 1 + Math.sin(a.breathPhase) * 0.018, 1);

      // Resting / sleeping crouch
      const restDrop = a.behavior === 'sleeping' ? -0.22 : a.behavior === 'resting' ? -0.14 : 0;
      rig.body.position.y = restDrop;

      // Natural head gaze & grazing dip
      const grazePitch = a.behavior === 'feeding' || a.behavior === 'drinking' ? 0.34 + Math.sin(elapsed * 3.2 + i) * 0.08 : 0;
      rig.head.rotation.x = grazePitch;
      rig.head.rotation.y = a.headTurn;

      // Gait cycle for quadrupeds & walking birds
      const stride = a.speed > 0.15 ? Math.min(0.68, 0.25 + a.speed * 0.08) : 0;
      for (let l = 0; l < rig.legs.length; l++) {
        const phaseOffset = l === 0 || l === 3 ? 0 : Math.PI;
        if (a.speciesId === 'turtle') {
          rig.legs[l].rotation.y = Math.sin(a.gaitPhase + phaseOffset) * 0.35;
        } else {
          rig.legs[l].rotation.x = Math.sin(a.gaitPhase + phaseOffset) * stride;
        }
      }

      // Bird flapping & gliding wings
      if (rig.leftWing && rig.rightWing) {
        const flap = a.behavior === 'flying' ? Math.sin(a.wingPhase) * 0.64 : Math.sin(elapsed * 2 + i) * 0.05;
        rig.leftWing.rotation.z = flap;
        rig.rightWing.rotation.z = -flap;
      }

      // Peacock iridescent fan display sway
      if (rig.peacockFan) {
        const displayPitch = a.behavior === 'socializing' || a.behavior === 'grooming' ? 0.05 : -0.62;
        rig.peacockFan.rotation.x += (displayPitch - rig.peacockFan.rotation.x) * 0.06;
        rig.peacockFan.rotation.z = Math.sin(elapsed * 1.8 + i) * 0.06;
      }

      // Elephant trunk & ear animation
      if (rig.trunk) {
        rig.trunk.rotation.x = Math.sin(elapsed * 1.5 + i) * 0.22 + (a.behavior === 'feeding' ? 0.3 : 0);
      }
      if (rig.ears) {
        const earFlap = Math.sin(elapsed * 2.1 + i) * 0.18;
        rig.ears[0].rotation.y = earFlap;
        rig.ears[1].rotation.y = -earFlap;
      }

      // Tail gentle swish
      if (rig.tail) {
        rig.tail.rotation.y = Math.sin(elapsed * 3.1 + i) * 0.26;
      }
    }
  };

  return { root, update };
}
