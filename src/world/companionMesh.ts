import * as THREE from 'three';
import type { CompanionState } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface CompanionRig {
  group: THREE.Group;
  worldFxGroup: THREE.Group;
  setPose: (
    state: CompanionState,
    time: number,
    options?: {
      worldPos?: THREE.Vector3;
      worldHeading?: number;
      visible?: boolean;
      lanternStrength?: number;
      dt?: number;
    }
  ) => void;
  spawnSnowSculpture: (x: number, y: number, z: number) => void;
  dispose: () => void;
}

interface FootprintItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  active: boolean;
}

interface SparkleItem {
  mesh: THREE.Mesh;
  angle: number;
  radius: number;
  baseY: number;
  speed: number;
  phase: number;
}

/**
 * Permanent travelling companion: FROSTY (ஃபிராஸ்டி) — The Living Ice Companion
 * - Three-tier soft rounded white snowman silhouette (bottom snowball, torso, cute head)
 * - Translucent icy-blue mitten hands and stubby feet
 * - Expressive glowing cyan eyes with blinking + sleepy arc pose
 * - Faceted crystal nose & friendly animated 5-bead smile
 * - Cerulean blue knit scarf with dual fluttering striped ends + decorative ice crystals
 * - Subtle orbiting ice sparkles, fading frost footprints, soft cyan night glow
 * - Full animation suite: cute waddle walk, gentle run, idle breathing/look-around/head-tilt,
 *   happy bounce, waving, dancing, snowball-making (+ mini snow sculptures), sitting, boat-bow, sleeping
 */
export function createCompanionRig(textures: ProceduralTextureSet): CompanionRig {
  const group = new THREE.Group();
  const worldFxGroup = new THREE.Group();
  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  // Materials
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf4fbff,
    emissive: 0x3ec8e8,
    emissiveIntensity: 0.04,
    roughness: 0.68,
    metalness: 0.04,
  });
  const iceLimbMat = new THREE.MeshStandardMaterial({
    color: 0x8ce7ff,
    emissive: 0x2ec8f0,
    emissiveIntensity: 0.22,
    roughness: 0.16,
    metalness: 0.12,
    transparent: true,
    opacity: 0.84,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xbaf4ff,
    emissive: 0x52e8ff,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7af5ff,
    emissive: 0x2de6ff,
    emissiveIntensity: 1.55,
    roughness: 0.15,
  });
  const eyePupilSpecMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const smileMat = new THREE.MeshStandardMaterial({
    color: 0x1e5070,
    emissive: 0x1c9ec4,
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });
  const cheekMat = new THREE.MeshBasicMaterial({
    color: 0x9aeaff,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const scarfMainMat = new THREE.MeshStandardMaterial({
    color: 0x2674c4,
    roughness: 0.82,
    metalness: 0.02,
  });
  const scarfStripeMat = new THREE.MeshStandardMaterial({
    color: 0x99dcff,
    roughness: 0.78,
  });
  const buttonIceMat = new THREE.MeshStandardMaterial({
    color: 0x45b8e8,
    emissive: 0x1d8eb8,
    emissiveIntensity: 0.28,
    roughness: 0.22,
    metalness: 0.18,
  });

  // Soft ground contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);

  // Soft cyan night glow PointLight (activates smoothly at dusk/night)
  const nightGlowLight = new THREE.PointLight(0x66e8ff, 0.2, 6.5, 1.8);
  nightGlowLight.position.set(0, 0.75, 0.2);
  group.add(nightGlowLight);

  // 1. Translucent icy-blue stubby feet (grounded at y = 0)
  const leftFootPivot = new THREE.Group();
  leftFootPivot.position.set(-0.16, 0.13, 0.02);
  const rightFootPivot = new THREE.Group();
  rightFootPivot.position.set(0.16, 0.13, 0.02);

  const footGeo = new THREE.SphereGeometry(0.115, 12, 10);
  for (const fp of [leftFootPivot, rightFootPivot]) {
    const fMesh = new THREE.Mesh(footGeo, iceLimbMat);
    fMesh.scale.set(0.92, 0.62, 1.25);
    fMesh.position.set(0, -0.055, 0.04);
    fMesh.castShadow = true;
    fp.add(fMesh);
  }
  bodyRoot.add(leftFootPivot, rightFootPivot);

  // 2. Plump rounded lower snowball section
  const lowerBall = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), snowMat);
  lowerBall.scale.set(1.06, 0.88, 1.04);
  lowerBall.position.y = 0.36;
  lowerBall.castShadow = true;
  lowerBall.receiveShadow = true;
  bodyRoot.add(lowerBall);

  // 3. Upper torso snowball section + 2 faceted crystal buttons
  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = 0.72;
  bodyRoot.add(torsoPivot);

  const middleBall = new THREE.Mesh(new THREE.SphereGeometry(0.255, 18, 14), snowMat);
  middleBall.scale.set(1.03, 0.94, 1.02);
  middleBall.castShadow = true;
  middleBall.receiveShadow = true;
  torsoPivot.add(middleBall);

  const btnGeo = new THREE.OctahedronGeometry(0.036, 0);
  const btnTop = new THREE.Mesh(btnGeo, buttonIceMat);
  btnTop.position.set(0, 0.05, 0.245);
  const btnBot = new THREE.Mesh(btnGeo, buttonIceMat);
  btnBot.position.set(0, -0.075, 0.255);
  torsoPivot.add(btnTop, btnBot);

  // 4. Translucent icy-blue mitten arms (left & right)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.24, 0.08, 0.02);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.24, 0.08, 0.02);

  const armStemGeo = new THREE.CapsuleGeometry(0.046, 0.16, 4, 8);
  const mittenGeo = new THREE.SphereGeometry(0.078, 10, 10);
  const thumbGeo = new THREE.SphereGeometry(0.034, 8, 8);

  const buildArm = (pivot: THREE.Group, side: -1 | 1) => {
    const stem = new THREE.Mesh(armStemGeo, iceLimbMat);
    stem.position.set(side * 0.09, -0.04, 0);
    stem.rotation.z = side * 1.15;
    stem.castShadow = true;
    pivot.add(stem);

    const hand = new THREE.Mesh(mittenGeo, iceLimbMat);
    hand.scale.set(1.12, 0.92, 0.88);
    hand.position.set(side * 0.21, -0.09, 0.03);
    pivot.add(hand);

    const thumb = new THREE.Mesh(thumbGeo, crystalMat);
    thumb.position.set(side * 0.18, -0.03, 0.075);
    pivot.add(thumb);
  };
  buildArm(leftArmPivot, -1);
  buildArm(rightArmPivot, 1);
  torsoPivot.add(leftArmPivot, rightArmPivot);

  // Held glowing snowball prop (visible during snowball-making animation!)
  const heldSnowball = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), snowMat);
  heldSnowball.position.set(0, 0.06, 0.34);
  heldSnowball.visible = false;
  torsoPivot.add(heldSnowball);

  // 5. Beautiful Blue Scarf wrapped around neck + fluttering striped scarf tails
  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.056, 10, 20), scarfMainMat);
  scarfCollar.rotation.x = Math.PI / 2;
  scarfCollar.position.y = 0.22;
  scarfCollar.castShadow = true;
  torsoPivot.add(scarfCollar);

  const scarfKnot = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), scarfMainMat);
  scarfKnot.position.set(0.11, 0.2, 0.19);
  torsoPivot.add(scarfKnot);

  const scarfTail1Pivot = new THREE.Group();
  scarfTail1Pivot.position.set(0.13, 0.19, 0.18);
  const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.28, 0.032), scarfMainMat);
  tail1.position.set(0.02, -0.13, 0);
  const tail1Stripe = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.045, 0.036), scarfStripeMat);
  tail1Stripe.position.set(0.02, -0.22, 0);
  scarfTail1Pivot.add(tail1, tail1Stripe);

  const scarfTail2Pivot = new THREE.Group();
  scarfTail2Pivot.position.set(0.18, 0.18, 0.06);
  const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.24, 0.028), scarfMainMat);
  tail2.position.set(0.02, -0.11, -0.02);
  const tail2Stripe = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.04, 0.032), scarfStripeMat);
  tail2Stripe.position.set(0.02, -0.18, -0.02);
  scarfTail2Pivot.add(tail2, tail2Stripe);
  torsoPivot.add(scarfTail1Pivot, scarfTail2Pivot);

  // 6. Head Pivot: cute rounded snowball head + glowing cyan eyes + crystal nose + smile + ice crystals
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.41;
  torsoPivot.add(headPivot);

  const headBall = new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 14), snowMat);
  headBall.scale.set(1.05, 0.96, 1.02);
  headBall.castShadow = true;
  headPivot.add(headBall);

  // Expressive glowing cyan eyes with crisp white catchlights
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.076, 0.038, 0.188);
  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.076, 0.038, 0.188);

  const eyeOrbGeo = new THREE.SphereGeometry(0.036, 10, 10);
  const specGeo = new THREE.SphereGeometry(0.012, 6, 6);
  for (const eg of [leftEyeGroup, rightEyeGroup]) {
    const orb = new THREE.Mesh(eyeOrbGeo, eyeGlowMat);
    orb.scale.set(0.95, 1.12, 0.65);
    eg.add(orb);
    const spec = new THREE.Mesh(specGeo, eyePupilSpecMat);
    spec.position.set(0.011, 0.013, 0.022);
    eg.add(spec);
  }
  headPivot.add(leftEyeGroup, rightEyeGroup);

  // Soft icy-rosy cheeks
  const cheekGeo = new THREE.CircleGeometry(0.034, 10);
  const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
  leftCheek.position.set(-0.128, -0.022, 0.168);
  leftCheek.rotation.y = -0.5;
  const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
  rightCheek.position.set(0.128, -0.022, 0.168);
  rightCheek.rotation.y = 0.5;
  headPivot.add(leftCheek, rightCheek);

  // Tiny faceted crystal nose
  const crystalNose = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.115, 6), crystalMat);
  crystalNose.rotation.x = Math.PI * 0.48;
  crystalNose.position.set(0, -0.005, 0.245);
  headPivot.add(crystalNose);

  // Friendly animated 5-bead curved smile
  const smileGroup = new THREE.Group();
  smileGroup.position.set(0, -0.072, 0.194);
  const smileBeads: THREE.Mesh[] = [];
  const smileBeadGeo = new THREE.SphereGeometry(0.014, 7, 7);
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) / 2; // -1..1
    const bead = new THREE.Mesh(smileBeadGeo, smileMat);
    bead.position.set(t * 0.068, t * t * 0.024, (1 - t * t) * 0.016);
    smileGroup.add(bead);
    smileBeads.push(bead);
  }
  headPivot.add(smileGroup);

  // Decorative Ice Crystal Crown Cluster tucked playfully on head
  const crystalGroup = new THREE.Group();
  crystalGroup.position.set(-0.07, 0.195, -0.02);
  crystalGroup.rotation.z = 0.26;
  const cMain = new THREE.Mesh(new THREE.OctahedronGeometry(0.062, 0), crystalMat);
  cMain.scale.set(0.65, 1.45, 0.65);
  const cLeft = new THREE.Mesh(new THREE.OctahedronGeometry(0.044, 0), crystalMat);
  cLeft.scale.set(0.6, 1.35, 0.6);
  cLeft.position.set(-0.048, -0.02, 0.01);
  cLeft.rotation.z = 0.45;
  const cRight = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), crystalMat);
  cRight.scale.set(0.6, 1.25, 0.6);
  cRight.position.set(0.045, -0.025, 0.015);
  cRight.rotation.z = -0.4;
  crystalGroup.add(cMain, cLeft, cRight);
  headPivot.add(crystalGroup);

  // 7. Subtle Orbiting Sparkling Ice Particles & Tiny Snowflakes
  const sparkleMat = new THREE.MeshBasicMaterial({
    color: 0xd9f9ff,
    transparent: true,
    opacity: 0.78,
  });
  const sparkleGeo = new THREE.OctahedronGeometry(0.024, 0);
  const sparkles: SparkleItem[] = [];
  for (let i = 0; i < 12; i++) {
    const sMesh = new THREE.Mesh(sparkleGeo, sparkleMat);
    group.add(sMesh);
    sparkles.push({
      mesh: sMesh,
      angle: (i / 12) * Math.PI * 2,
      radius: 0.44 + (i % 3) * 0.14,
      baseY: 0.25 + (i % 4) * 0.28,
      speed: 0.65 + (i % 3) * 0.28,
      phase: i * 0.85,
    });
  }

  // 8. Subtle Frosty Footprints Pool (placed on ground as Frosty waddles)
  const footprintGeo = new THREE.CircleGeometry(0.14, 6);
  const footprints: FootprintItem[] = [];
  for (let i = 0; i < 12; i++) {
    const fMat = new THREE.MeshBasicMaterial({
      color: 0xb6f2ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const fMesh = new THREE.Mesh(footprintGeo, fMat);
    fMesh.rotation.x = -Math.PI / 2;
    fMesh.visible = false;
    worldFxGroup.add(fMesh);
    footprints.push({ mesh: fMesh, mat: fMat, age: 10, active: false });
  }
  let footprintIdx = 0;
  let lastFootX = 9999;
  let lastFootZ = 9999;
  let footSide = 1;

  // 9. Tiny Decorative Snow Sculptures Pool (built by Frosty in Panimalai Snow Peaks or Snowball emote!)
  const sculptures: THREE.Group[] = [];
  let sculptureCursor = 0;
  const maxSculptures = 4;

  const spawnSnowSculpture = (x: number, y: number, z: number) => {
    if (sculptures.length < maxSculptures) {
      const sc = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), snowMat);
      s1.position.y = 0.15;
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10), snowMat);
      s2.position.y = 0.36;
      const tinyNose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.075, 5), crystalMat);
      tinyNose.rotation.x = Math.PI * 0.5;
      tinyNose.position.set(0, 0.36, 0.13);
      const tinyScarf = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 12), scarfStripeMat);
      tinyScarf.rotation.x = Math.PI / 2;
      tinyScarf.position.y = 0.27;
      const tinyEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), eyeGlowMat);
      tinyEyeL.position.set(-0.04, 0.39, 0.108);
      const tinyEyeR = tinyEyeL.clone();
      tinyEyeR.position.x = 0.04;
      sc.add(s1, s2, tinyNose, tinyScarf, tinyEyeL, tinyEyeR);
      worldFxGroup.add(sc);
      sculptures.push(sc);
      sc.position.set(x, y, z);
    } else {
      const reused = sculptures[sculptureCursor % maxSculptures];
      reused.position.set(x, y, z);
      reused.rotation.y = sculptureCursor * 0.9;
      sculptureCursor++;
    }
  };

  let walkPhase = 0;

  const setPose = (
    state: CompanionState,
    time: number,
    options?: {
      worldPos?: THREE.Vector3;
      worldHeading?: number;
      visible?: boolean;
      lanternStrength?: number;
      dt?: number;
    }
  ) => {
    const isVis = options?.visible ?? true;
    const dt = options?.dt ?? 0.016;
    const lanternStrength = options?.lanternStrength ?? 0.25;
    group.visible = isVis;

    // Fade active frost footprints regardless of visibility
    for (const fp of footprints) {
      if (!fp.active) continue;
      fp.age += dt;
      if (fp.age >= 5.2) {
        fp.active = false;
        fp.mesh.visible = false;
      } else {
        fp.mat.opacity = (1 - fp.age / 5.2) * 0.38;
      }
    }

    if (!isVis) return;

    if (options?.worldPos) {
      group.position.copy(options.worldPos);
    } else {
      group.position.set(state.x, state.y, state.z);
    }
    group.rotation.y = options?.worldHeading ?? state.heading;

    // Soft cyan night glow on Frosty & crystal accents
    nightGlowLight.intensity = 0.12 + lanternStrength * 1.15;
    snowMat.emissiveIntensity = 0.03 + lanternStrength * 0.16;
    eyeGlowMat.emissiveIntensity = state.activity === 'sleeping' ? 0.28 : 1.15 + lanternStrength * 0.95;

    // Orbiting sparkles gently twinkle around Frosty
    const emoteBoost = state.emote === 'dance' || state.emote === 'happy_bounce' || state.emote === 'snowball' ? 1.8 : 1.0;
    for (const sp of sparkles) {
      const a = sp.angle + time * sp.speed * emoteBoost;
      const yOff = Math.sin(time * 2.1 + sp.phase) * 0.09;
      sp.mesh.position.set(Math.cos(a) * sp.radius, sp.baseY + yOff, Math.sin(a) * sp.radius);
      sp.mesh.rotation.y = time * 1.6 + sp.phase;
      const sc = 0.65 + (Math.sin(time * 3.8 + sp.phase) * 0.5 + 0.5) * 0.65;
      sp.mesh.scale.setScalar(state.activity === 'sleeping' ? sc * 0.55 : sc);
    }

    // Gentle blinking (every ~4.2s) or sleepy closed eyes
    const isSleeping = state.activity === 'sleeping' || state.emote === 'sleeping';
    const blinkCycle = time % 4.3;
    const isBlink = blinkCycle > 4.14;
    const eyeScaleY = isSleeping ? 0.18 : isBlink ? 0.15 : 1.0;
    leftEyeGroup.scale.set(1, eyeScaleY, 1);
    rightEyeGroup.scale.set(1, eyeScaleY, 1);

    // Smile expressiveness
    const isJoyful =
      state.emote === 'wave' ||
      state.emote === 'dance' ||
      state.emote === 'happy_bounce' ||
      state.emote === 'snowball';
    smileGroup.scale.set(isJoyful ? 1.18 : 1.0, isJoyful ? 1.28 : isSleeping ? 0.72 : 1.0, 1);

    // Reset default transforms before applying active state
    bodyRoot.scale.set(1, 1, 1);
    bodyRoot.rotation.set(0, 0, 0);
    bodyRoot.position.set(0, 0, 0);
    torsoPivot.rotation.set(0, 0, 0);
    headPivot.rotation.set(0, 0, 0);
    heldSnowball.visible = false;

    const activity = state.activity;
    const isSeated =
      activity === 'sitting' || activity === 'train' || activity === 'bus' || activity === 'campfire';

    // 1. SLEEPING IN IGLOO BED
    if (isSleeping) {
      shadow.visible = false;
      const breath = Math.sin(time * 1.45);
      bodyRoot.position.y = -0.05;
      bodyRoot.scale.set(1.06 + breath * 0.025, 0.88 - breath * 0.025, 1.06 + breath * 0.025);
      leftFootPivot.rotation.set(-0.65, 0, 0);
      rightFootPivot.rotation.set(-0.65, 0, 0);
      leftArmPivot.rotation.set(-0.35, 0.35, -0.4);
      rightArmPivot.rotation.set(-0.35, -0.35, 0.4);
      headPivot.rotation.set(0.24, Math.sin(time * 0.5) * 0.06, 0.18);
      scarfTail1Pivot.rotation.set(0.1, 0, -0.1);
      scarfTail2Pivot.rotation.set(0.1, 0, -0.15);
      return;
    }

    // 2. SITTING (bench, sofa, balcony, train, bus, campfire)
    if (isSeated) {
      shadow.visible = false;
      bodyRoot.position.y = -0.16;
      bodyRoot.scale.set(1.05, 0.94, 1.05);
      leftFootPivot.rotation.set(-1.1, 0, 0.1);
      rightFootPivot.rotation.set(-1.1, 0, -0.1);
      leftArmPivot.rotation.set(-0.28, 0.2, -0.22);
      rightArmPivot.rotation.set(-0.28, -0.2, 0.22);
      headPivot.rotation.y = Math.sin(time * 0.65) * 0.26;
      headPivot.rotation.x = activity === 'campfire' ? -0.16 : 0.04; // gazes up at stars by campfire!
      headPivot.rotation.z = Math.sin(time * 0.9) * 0.08;
      scarfTail1Pivot.rotation.x = 0.14 + Math.sin(time * 1.8) * 0.08;
      scarfTail2Pivot.rotation.x = 0.2 + Math.cos(time * 1.6) * 0.08;
      return;
    }

    // 3. BOAT VOYAGE (perched joyfully at the bow watching sunlit waves!)
    if (activity === 'boat') {
      shadow.visible = false;
      bodyRoot.position.y = Math.sin(time * 2.5) * 0.025;
      bodyRoot.rotation.z = Math.sin(time * 1.7) * 0.06;
      leftFootPivot.rotation.set(0, 0, 0);
      rightFootPivot.rotation.set(0, 0, 0);
      leftArmPivot.rotation.set(0.1, 0, 0.35 + Math.sin(time * 2.2) * 0.08);
      rightArmPivot.rotation.set(0.1, 0, -0.35 - Math.sin(time * 2.2) * 0.08);
      headPivot.rotation.y = Math.sin(time * 0.55) * 0.3;
      headPivot.rotation.x = -0.06;
      // Scarf streaming in the sea/lake breeze!
      scarfTail1Pivot.rotation.set(-0.55 + Math.sin(time * 4.5) * 0.18, 0, 0.12);
      scarfTail2Pivot.rotation.set(-0.68 + Math.cos(time * 5.0) * 0.2, 0, 0.2);
      return;
    }

    shadow.visible = true;
    const moveFactor = Math.min(1, state.speed / 3.8);
    const isRunning = state.speed > 4.4;

    // 4. WALKING (CUTE WADDLE) & GENTLE RUNNING
    if (moveFactor > 0.08) {
      walkPhase += dt * (isRunning ? 13.5 : 8.5);
      const waddle = Math.sin(walkPhase);
      const bounce = Math.abs(Math.cos(walkPhase));

      // Adorable side-to-side waddle roll + vertical spring bounce
      bodyRoot.rotation.z = waddle * (isRunning ? 0.14 : 0.19) * moveFactor;
      bodyRoot.rotation.x = isRunning ? 0.18 : 0.05 * moveFactor;
      bodyRoot.position.y = bounce * (isRunning ? 0.14 : 0.075) * moveFactor;
      const squash = 1 - bounce * 0.05;
      bodyRoot.scale.set(1 + bounce * 0.03, squash + bounce * 0.09, 1 + bounce * 0.03);

      leftFootPivot.rotation.x = waddle * 0.72 * moveFactor;
      rightFootPivot.rotation.x = -waddle * 0.72 * moveFactor;
      leftArmPivot.rotation.set(-waddle * 0.55 * moveFactor, 0, 0.22);
      rightArmPivot.rotation.set(waddle * 0.55 * moveFactor, 0, -0.22);
      headPivot.rotation.z = -waddle * 0.09 * moveFactor;
      headPivot.rotation.y = Math.sin(time * 1.1) * 0.09;

      // Scarf flutter behind Frosty
      scarfTail1Pivot.rotation.set(-0.35 * moveFactor + Math.sin(walkPhase * 1.4) * 0.15, 0, 0.1);
      scarfTail2Pivot.rotation.set(-0.48 * moveFactor + Math.cos(walkPhase * 1.5) * 0.18, 0, 0.15);

      // Leave subtle fading frosty footprints every ~0.95m walked
      const distFromLast = Math.hypot(group.position.x - lastFootX, group.position.z - lastFootZ);
      if (distFromLast > 0.95) {
        const fp = footprints[footprintIdx % footprints.length];
        footprintIdx++;
        const sideOffset = footSide * 0.16;
        footSide *= -1;
        const h = group.rotation.y;
        fp.mesh.position.set(
          group.position.x + Math.cos(h) * sideOffset,
          group.position.y + 0.03,
          group.position.z - Math.sin(h) * sideOffset
        );
        fp.mesh.rotation.z = h;
        fp.mesh.visible = true;
        fp.age = 0;
        fp.active = true;
        fp.mat.opacity = 0.38;
        lastFootX = group.position.x;
        lastFootZ = group.position.z;
      }
      return;
    }

    // 5. EXPRESSIVE EMOTES WHEN STANDING (Wave, Dance, Happy Bounce, Snowball-Making, Curious)
    leftFootPivot.rotation.set(0, 0, 0);
    rightFootPivot.rotation.set(0, 0, 0);

    if (state.emote === 'wave') {
      const waveOsc = Math.sin(time * 9.5);
      bodyRoot.position.y = Math.abs(Math.sin(time * 3.8)) * 0.05;
      bodyRoot.rotation.z = -0.06;
      leftArmPivot.rotation.set(0, 0, 0.18);
      rightArmPivot.rotation.set(-0.2, 0.25, 1.35 + waveOsc * 0.36);
      headPivot.rotation.z = 0.16;
      headPivot.rotation.y = Math.sin(time * 2.5) * 0.12;
      scarfTail1Pivot.rotation.set(0.08 + Math.sin(time * 4) * 0.12, 0, 0.1);
      scarfTail2Pivot.rotation.set(0.12 + Math.cos(time * 4) * 0.12, 0, 0.14);
      return;
    }

    if (state.emote === 'dance') {
      const beat = time * 7.2;
      const hop = Math.abs(Math.sin(beat));
      bodyRoot.position.y = hop * 0.17;
      bodyRoot.rotation.y = Math.sin(beat * 0.5) * 0.55;
      bodyRoot.rotation.z = Math.sin(beat) * 0.18;
      bodyRoot.scale.set(1.05 - hop * 0.07, 0.94 + hop * 0.12, 1.05 - hop * 0.07);
      leftArmPivot.rotation.set(0, 0, -0.95 - Math.sin(beat) * 0.45);
      rightArmPivot.rotation.set(0, 0, 0.95 + Math.cos(beat) * 0.45);
      headPivot.rotation.z = -Math.sin(beat) * 0.2;
      scarfTail1Pivot.rotation.set(-0.35 + Math.sin(beat * 1.2) * 0.25, 0, 0.25);
      scarfTail2Pivot.rotation.set(-0.42 + Math.cos(beat * 1.2) * 0.25, 0, -0.2);
      return;
    }

    if (state.emote === 'happy_bounce') {
      const b = Math.abs(Math.sin(time * 6.4));
      bodyRoot.position.y = b * 0.22;
      bodyRoot.scale.set(1.08 - b * 0.1, 0.9 + b * 0.16, 1.08 - b * 0.1);
      leftArmPivot.rotation.set(0, 0, -0.85 - b * 0.35);
      rightArmPivot.rotation.set(0, 0, 0.85 + b * 0.35);
      headPivot.rotation.x = -b * 0.12;
      scarfTail1Pivot.rotation.set(-0.25 - b * 0.2, 0, 0.1);
      scarfTail2Pivot.rotation.set(-0.3 - b * 0.22, 0, 0.14);
      return;
    }

    if (state.emote === 'snowball') {
      heldSnowball.visible = true;
      const roll = Math.sin(time * 10.0);
      bodyRoot.position.y = Math.abs(Math.sin(time * 4.0)) * 0.04;
      torsoPivot.rotation.x = 0.12;
      leftArmPivot.rotation.set(-0.55 + roll * 0.16, 0.65, -0.15);
      rightArmPivot.rotation.set(-0.55 - roll * 0.16, -0.65, 0.15);
      heldSnowball.position.set(Math.sin(time * 8) * 0.02, 0.05 + Math.abs(roll) * 0.03, 0.35);
      heldSnowball.scale.setScalar(0.85 + Math.sin(time * 3.5) * 0.18);
      headPivot.rotation.x = 0.18;
      headPivot.rotation.z = Math.sin(time * 3.5) * 0.14;
      scarfTail1Pivot.rotation.set(0.15, 0, 0.06);
      scarfTail2Pivot.rotation.set(0.18, 0, 0.1);
      return;
    }

    if (state.emote === 'curious') {
      // Curious head-tilt watching falling cherry blossom petals or fluttering countryside butterflies!
      bodyRoot.position.y = Math.sin(time * 2.2) * 0.015;
      leftArmPivot.rotation.set(-0.15, 0, 0.22);
      rightArmPivot.rotation.set(-0.15, 0, -0.22);
      headPivot.rotation.z = Math.sin(time * 1.9) * 0.28;
      headPivot.rotation.x = -0.22 + Math.sin(time * 1.1) * 0.08;
      headPivot.rotation.y = Math.sin(time * 1.3) * 0.34;
      scarfTail1Pivot.rotation.set(0.08 + Math.sin(time * 2.0) * 0.07, 0, 0.06);
      scarfTail2Pivot.rotation.set(0.12 + Math.cos(time * 1.8) * 0.08, 0, 0.1);
      return;
    }

    // 6. NATURAL IDLE: gentle squash-and-stretch breathing + looking around + subtle head tilt
    const breath = Math.sin(time * 2.1);
    bodyRoot.scale.set(1 + breath * 0.02, 1 - breath * 0.022, 1 + breath * 0.02);
    bodyRoot.position.y = Math.max(0, breath * 0.015);
    leftArmPivot.rotation.set(Math.sin(time * 1.4) * 0.08, 0, 0.16);
    rightArmPivot.rotation.set(-Math.sin(time * 1.4) * 0.08, 0, -0.16);
    headPivot.rotation.y = Math.sin(time * 0.62) * 0.32;
    headPivot.rotation.z = Math.sin(time * 0.85) * 0.11;
    headPivot.rotation.x = Math.sin(time * 0.44) * 0.06;
    scarfTail1Pivot.rotation.set(0.08 + Math.sin(time * 1.9) * 0.08, 0, 0.05);
    scarfTail2Pivot.rotation.set(0.12 + Math.cos(time * 1.7) * 0.09, 0, 0.08);
  };

  return {
    group,
    worldFxGroup,
    setPose,
    spawnSnowSculpture,
    dispose: () => {
      const disposeTree = (root: THREE.Object3D) => {
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      };
      disposeTree(group);
      disposeTree(worldFxGroup);
    },
  };
}
