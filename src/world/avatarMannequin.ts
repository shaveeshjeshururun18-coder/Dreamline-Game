import * as THREE from 'three';
import { getAvatarMeta } from '../game/avatars';
import type { BoyOutfitId } from '../game/types';

export interface AlanGrantCostumeParts {
  headGroup: THREE.Group;
  torsoGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  flareTipMat: THREE.MeshBasicMaterial;
  flareGlowMat: THREE.MeshBasicMaterial;
  flareLight: THREE.PointLight | null;
  disposables: Array<{ dispose: () => void }>;
}

export interface AvatarDisplayStand {
  outfitId: BoyOutfitId;
  root: THREE.Group;
  setActive: (active: boolean) => void;
  update: (time: number, lanternStrength: number) => void;
  dispose: () => void;
}

/**
 * Procedural canvas texture for Dr. Alan Grant's iconic yellow Jurassic Park VIP ID badge.
 */
function createJpBadgeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 0, 96, 128);
  // Top crimson VIP header bar
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(4, 4, 88, 22);
  ctx.fillStyle = '#fefce8';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIP PASS', 48, 20);
  // Center emblem circle
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(48, 66, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('JP', 48, 73);
  // Footer name bar
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(10, 102, 76, 16);
  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('DR. GRANT', 48, 114);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural subtle woven straw texture for Dr. Alan Grant's curved Panama/fedora hat.
 */
function createStrawWeaveTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c9ae82';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? 'rgba(92, 68, 38, 0.18)' : 'rgba(255, 240, 210, 0.16)';
    ctx.fillRect(0, y, 128, 3);
  }
  for (let x = 0; x < 128; x += 8) {
    ctx.fillStyle = 'rgba(72, 52, 26, 0.14)';
    ctx.fillRect(x, 0, 2, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural canvas placard texture for each avatar pedestal inside En Illam.
 */
function createAvatarNameplateTexture(
  title: string,
  subtitle: string,
  accentHex: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1c1528';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 246, 86);

  ctx.fillStyle = '#faf4eb';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 44);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(subtitle, 128, 72);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds all iconic 3D costume attachments for Dr. Alan Grant ("Jurassic Survivor"):
 * - Curved tan straw fedora hat with dark brown ribbon band
 * - Gold-rimmed dark aviator sunglasses
 * - Red bandana neckerchief wrapped around collar with front triangular fold
 * - Blue chambray denim shirt placket, white buttons, twin buttoned flap pockets & yellow JP VIP badge
 * - Brown leather belt, silver buckle, khaki belt loops, right-hip olive pouch & left-hip leather claw holster
 * - Rolled light-blue denim cuffs revealing bare forearms + black-strap silver wristwatch (left)
 * - Glowing red road flare held in right hand with bright burning ember tip, crimson halo & optional PointLight
 */
export function buildAlanGrantCostumeParts(
  isSoftwareGl: boolean,
  withPointLight = true
): AlanGrantCostumeParts {
  const disposables: Array<{ dispose: () => void }> = [];

  const strawTex = createStrawWeaveTexture();
  const jpBadgeTex = createJpBadgeTexture();
  disposables.push(strawTex, jpBadgeTex);

  const strawMat = new THREE.MeshStandardMaterial({
    map: strawTex,
    color: 0xd2b88c,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const hatBandMat = new THREE.MeshStandardMaterial({ color: 0x332011, roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.08, metalness: 0.75 });
  const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xbe2424, roughness: 0.84 });
  const denimMat = new THREE.MeshStandardMaterial({ color: 0x4b79a1, roughness: 0.82 });
  const denimLightMat = new THREE.MeshStandardMaterial({ color: 0x7ba1c7, roughness: 0.84 });
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const badgeMat = new THREE.MeshStandardMaterial({ map: jpBadgeTex, roughness: 0.35 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4e321e, roughness: 0.65 });
  const holsterMat = new THREE.MeshStandardMaterial({ color: 0x3d2616, roughness: 0.7 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.25, metalness: 0.82 });
  const oliveMat = new THREE.MeshStandardMaterial({ color: 0x4a533b, roughness: 0.82 });
  const khakiLoopMat = new THREE.MeshStandardMaterial({ color: 0xd0c4b0, roughness: 0.86 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c7a5, roughness: 0.68 });
  const watchBandMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 });
  const flareStickMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const flareTipMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const flareGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff3b30,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  const grantHairMat = new THREE.MeshStandardMaterial({ color: 0x5c432e, roughness: 0.82 });

  disposables.push(
    strawMat,
    hatBandMat,
    goldMat,
    lensMat,
    bandanaMat,
    denimMat,
    denimLightMat,
    buttonMat,
    badgeMat,
    leatherMat,
    holsterMat,
    silverMat,
    oliveMat,
    khakiLoopMat,
    skinMat,
    watchBandMat,
    flareStickMat,
    flareTipMat,
    flareGlowMat,
    grantHairMat
  );

  const add = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast = true
  ) => {
    disposables.push(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast && !isSoftwareGl;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // -------------------------------------------------------------------------
  // 1. HEAD ATTACHMENTS: Curved Straw Fedora Hat + Gold Aviators + Hair Trim
  // -------------------------------------------------------------------------
  const headGroup = new THREE.Group();

  // Warm brown back hair under hat
  add(headGroup, new THREE.BoxGeometry(0.25, 0.11, 0.1), grantHairMat, 0, 0.02, -0.12);

  // Hat sub-group angled slightly jauntily back on brow
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.145, 0.0);
  hatGroup.rotation.x = -0.09;
  headGroup.add(hatGroup);

  // Curved fedora brim (sides curl gently upward, front/back dip subtly)
  const brimGeo = new THREE.CylinderGeometry(0.305, 0.315, 0.014, 24, 1, false);
  const brimPos = brimGeo.attributes.position;
  for (let i = 0; i < brimPos.count; i++) {
    const bx = brimPos.getX(i);
    const by = brimPos.getY(i);
    const bz = brimPos.getZ(i);
    const dist = Math.hypot(bx, bz);
    if (dist > 0.15) {
      const curlUp = Math.pow(Math.abs(bx) / 0.31, 2) * 0.048;
      const dipFB = -Math.pow(Math.abs(bz) / 0.31, 2) * 0.018;
      brimPos.setY(i, by + curlUp + dipFB);
    }
  }
  brimGeo.computeVertexNormals();
  add(hatGroup, brimGeo, strawMat, 0, 0, 0);

  // Tapered straw crown with subtle pinched top ridge
  const crown = add(hatGroup, new THREE.CylinderGeometry(0.135, 0.165, 0.135, 16), strawMat, 0, 0.068, 0);
  crown.scale.set(0.95, 1, 1.12);
  const crownTop = add(hatGroup, new THREE.SphereGeometry(0.132, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), strawMat, 0, 0.12, 0);
  crownTop.scale.set(0.92, 0.45, 1.1);
  // Dark brown hatband ribbon
  const band = add(hatGroup, new THREE.CylinderGeometry(0.162, 0.169, 0.032, 16), hatBandMat, 0, 0.02, 0);
  band.scale.set(0.96, 1, 1.13);

  // Iconic Gold-Rimmed Aviator Sunglasses
  const aviators = new THREE.Group();
  aviators.position.set(0, 0.042, 0.156);
  headGroup.add(aviators);
  // Left & right teardrop dark lenses + gold rims
  for (const side of [-1, 1]) {
    const rim = add(aviators, new THREE.BoxGeometry(0.068, 0.048, 0.012), goldMat, side * 0.056, -0.002, 0, false);
    rim.rotation.z = side * -0.08;
    const lens = add(aviators, new THREE.BoxGeometry(0.058, 0.038, 0.015), lensMat, side * 0.056, -0.002, 0.002, false);
    lens.rotation.z = side * -0.08;
    // Gold temple arm going back to ear
    add(aviators, new THREE.BoxGeometry(0.008, 0.008, 0.15), goldMat, side * 0.105, 0.005, -0.072, false);
  }
  // Double aviator nose bridge
  add(aviators, new THREE.BoxGeometry(0.044, 0.008, 0.012), goldMat, 0, 0.016, 0.002, false);
  add(aviators, new THREE.BoxGeometry(0.036, 0.007, 0.012), goldMat, 0, 0.004, 0.002, false);

  // -------------------------------------------------------------------------
  // 2. TORSO ATTACHMENTS: Blue Chambray Shirt Details, Red Bandana, JP Badge, Belt & Holsters
  // -------------------------------------------------------------------------
  const torsoGroup = new THREE.Group();

  // Closed blue chambray denim shirt front shell covering white tee opening
  add(torsoGroup, new THREE.BoxGeometry(0.365, 0.54, 0.224), denimMat, 0, 0.27, 0.002);
  // Center vertical button placket + 4 crisp white buttons
  add(torsoGroup, new THREE.BoxGeometry(0.05, 0.51, 0.016), denimLightMat, 0, 0.26, 0.115, false);
  for (let b = 0; b < 4; b++) {
    add(torsoGroup, new THREE.SphereGeometry(0.009, 6, 6), buttonMat, 0, 0.41 - b * 0.11, 0.124, false);
  }
  // Two buttoned denim chest flap pockets
  for (const side of [-1, 1]) {
    add(torsoGroup, new THREE.BoxGeometry(0.105, 0.11, 0.018), denimMat, side * 0.1, 0.35, 0.116, false);
    add(torsoGroup, new THREE.BoxGeometry(0.108, 0.034, 0.022), denimLightMat, side * 0.1, 0.392, 0.118, false);
    add(torsoGroup, new THREE.SphereGeometry(0.008, 6, 6), buttonMat, side * 0.1, 0.386, 0.13, false);
  }
  // Yellow Jurassic Park VIP ID badge clipped to left chest pocket (+X on rig is character's left)
  add(torsoGroup, new THREE.BoxGeometry(0.072, 0.095, 0.012), badgeMat, 0.115, 0.305, 0.128, false);
  add(torsoGroup, new THREE.BoxGeometry(0.018, 0.024, 0.016), silverMat, 0.115, 0.355, 0.128, false);

  // Red Bandana / Neckerchief wrapped tightly around collar + front triangular fold
  const bandanaRing = add(torsoGroup, new THREE.TorusGeometry(0.095, 0.038, 8, 16), bandanaMat, 0, 0.548, 0.012, false);
  bandanaRing.rotation.x = Math.PI / 2;
  const bandanaKnot = add(torsoGroup, new THREE.ConeGeometry(0.092, 0.155, 4), bandanaMat, 0, 0.475, 0.112, false);
  bandanaKnot.rotation.x = Math.PI;
  bandanaKnot.rotation.y = Math.PI / 4;
  bandanaKnot.scale.set(1.1, 1.0, 0.42);

  // Brown Leather Belt, Silver Buckle, Khaki Belt Loops, Olive Pouch & Leather Claw Holster
  add(torsoGroup, new THREE.BoxGeometry(0.355, 0.068, 0.228), leatherMat, 0, 0.01, 0.0);
  // Silver buckle center front
  add(torsoGroup, new THREE.BoxGeometry(0.078, 0.074, 0.022), silverMat, 0, 0.01, 0.116, false);
  add(torsoGroup, new THREE.BoxGeometry(0.044, 0.042, 0.026), leatherMat, 0, 0.01, 0.117, false);
  // Khaki belt loops
  for (const lx of [-0.12, 0.12]) {
    add(torsoGroup, new THREE.BoxGeometry(0.022, 0.082, 0.236), khakiLoopMat, lx, 0.01, 0, false);
  }
  // Olive field belt pouch on character's right hip (-X)
  add(torsoGroup, new THREE.BoxGeometry(0.072, 0.115, 0.11), oliveMat, -0.195, -0.015, 0.01);
  add(torsoGroup, new THREE.BoxGeometry(0.078, 0.038, 0.114), oliveMat, -0.195, 0.028, 0.01);
  // Leather Velociraptor claw / tool holster on character's left hip (+X) with silver tip
  const holster = add(torsoGroup, new THREE.CylinderGeometry(0.036, 0.022, 0.16, 8), holsterMat, 0.195, -0.045, 0.015);
  holster.rotation.z = -0.14;
  const clawTip = add(torsoGroup, new THREE.ConeGeometry(0.018, 0.055, 6), silverMat, 0.205, -0.125, 0.02, false);
  clawTip.rotation.z = Math.PI - 0.14;

  // -------------------------------------------------------------------------
  // 3. LEFT ARM ATTACHMENTS (+X): Rolled Light-Blue Cuff, Bare Forearm & Silver Wristwatch
  // -------------------------------------------------------------------------
  const leftArmGroup = new THREE.Group();
  // Rolled denim cuff at mid-arm
  add(leftArmGroup, new THREE.CylinderGeometry(0.068, 0.068, 0.058, 10), denimLightMat, 0, -0.17, 0);
  // Bare sun-tanned forearm below rolled cuff
  add(leftArmGroup, new THREE.CylinderGeometry(0.052, 0.045, 0.21, 10), skinMat, 0, -0.3, 0);
  // Black-strap wristwatch with silver dial near wrist
  add(leftArmGroup, new THREE.CylinderGeometry(0.053, 0.053, 0.03, 10), watchBandMat, 0, -0.355, 0, false);
  add(leftArmGroup, new THREE.BoxGeometry(0.038, 0.036, 0.026), silverMat, 0.042, -0.355, 0.01, false);

  // -------------------------------------------------------------------------
  // 4. RIGHT ARM ATTACHMENTS (-X): Rolled Cuff, Bare Forearm & Glowing Red Road Flare!
  // -------------------------------------------------------------------------
  const rightArmGroup = new THREE.Group();
  add(rightArmGroup, new THREE.CylinderGeometry(0.068, 0.068, 0.058, 10), denimLightMat, 0, -0.17, 0);
  add(rightArmGroup, new THREE.CylinderGeometry(0.052, 0.045, 0.21, 10), skinMat, 0, -0.3, 0);

  // Iconic Red Road Flare gripped in right hand pointing forward-up
  const flareGroup = new THREE.Group();
  flareGroup.position.set(-0.01, -0.43, 0.075);
  flareGroup.rotation.x = Math.PI * 0.42;
  rightArmGroup.add(flareGroup);

  add(flareGroup, new THREE.CylinderGeometry(0.018, 0.018, 0.26, 8), flareStickMat, 0, 0.05, 0);
  // Bright burning ember tip
  add(flareGroup, new THREE.SphereGeometry(0.028, 8, 8), flareTipMat, 0, 0.185, 0, false);
  // Soft crimson plasma halo around burning flare
  add(flareGroup, new THREE.SphereGeometry(0.075, 10, 8), flareGlowMat, 0, 0.195, 0, false);

  let flareLight: THREE.PointLight | null = null;
  if (withPointLight && !isSoftwareGl) {
    flareLight = new THREE.PointLight(0xff453a, 1.4, 7.5, 1.8);
    flareLight.position.set(0, 0.22, 0);
    flareGroup.add(flareLight);
  }

  return {
    headGroup,
    torsoGroup,
    leftArmGroup,
    rightArmGroup,
    flareTipMat,
    flareGlowMat,
    flareLight,
    disposables,
  };
}

/**
 * Builds a complete, life-size 3D Avatar Display Mannequin standing atop a polished dark-oak
 * & brass pedestal with an illuminated active ring and tilted front nameplate for En Illam.
 */
export function buildAvatarDisplayMannequin(
  outfitId: BoyOutfitId,
  isSoftwareGl: boolean
): AvatarDisplayStand {
  const meta = getAvatarMeta(outfitId);
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const add = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast = true
  ) => {
    disposables.push(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast && !isSoftwareGl;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // Pedestal Materials
  const pedestalWoodMat = new THREE.MeshStandardMaterial({ color: 0x4c3222, roughness: 0.52, metalness: 0.08 });
  const pedestalTopMat = new THREE.MeshStandardMaterial({ color: 0x704c34, roughness: 0.45, metalness: 0.05 });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd9a86c,
    emissive: new THREE.Color(0xf6b95c),
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.65,
  });
  const placardTex = createAvatarNameplateTexture(meta.shortLabel, 'WEAR [E]', meta.accent);
  const placardMat = new THREE.MeshStandardMaterial({ map: placardTex, roughness: 0.4 });
  disposables.push(pedestalWoodMat, pedestalTopMat, ringMat, placardTex, placardMat);

  // Chamfered Circular Display Plinth (height = 0.16m)
  add(root, new THREE.CylinderGeometry(0.39, 0.44, 0.12, 18), pedestalWoodMat, 0, 0.06, 0);
  add(root, new THREE.CylinderGeometry(0.35, 0.37, 0.04, 18), pedestalTopMat, 0, 0.14, 0);
  const activeRing = add(root, new THREE.TorusGeometry(0.385, 0.022, 8, 24), ringMat, 0, 0.145, 0, false);
  activeRing.rotation.x = Math.PI / 2;

  // Front Tilted Nameplate Placard
  const placardBase = add(root, new THREE.BoxGeometry(0.46, 0.17, 0.025), pedestalWoodMat, 0, 0.12, 0.42, false);
  placardBase.rotation.x = -0.52;
  const placardFace = add(root, new THREE.PlaneGeometry(0.42, 0.145), placardMat, 0, 0.128, 0.435, false);
  placardFace.rotation.x = -0.52;

  // -------------------------------------------------------------------------
  // Life-Size 3D Avatar Figure (standing cleanly on pedestal top y = 0.16m)
  // -------------------------------------------------------------------------
  const figureRoot = new THREE.Group();
  figureRoot.position.set(0, 0.16, 0);
  figureRoot.scale.setScalar(0.94); // crisp ~1.58m display scale under 3.1m ceiling
  root.add(figureRoot);

  const isIgloo = outfitId === 'igloo_man';
  const isAlan = outfitId === 'alan_grant';

  const palette = isAlan
    ? { jacket: 0x4b79a1, shirt: 0x4b79a1, pants: 0xd0c4b0, shoe: 0xc2782b, sole: 0x26201b, pack: 0x4b5c49 }
    : isIgloo
    ? { jacket: 0xdaf2ff, shirt: 0xeef9ff, pants: 0x8ecae6, shoe: 0x2d6a9f, sole: 0xf2f0eb, pack: 0x63b9e0 }
    : outfitId === 'coastal_tee'
    ? { jacket: 0x3a89a8, shirt: 0xfff9ee, pants: 0x6e6252, shoe: 0x2f6c82, sole: 0xf2f0eb, pack: 0xc9884c }
    : outfitId === 'winter_parka'
    ? { jacket: 0x8e3b38, shirt: 0xf2e8d5, pants: 0x1f2533, shoe: 0x4d3528, sole: 0xf2f0eb, pack: 0x4f433b }
    : { jacket: 0x2d4364, shirt: 0xf4f1ea, pants: 0x252836, shoe: 0x334766, sole: 0xf2f0eb, pack: 0x4b5c49 };

  const jacketMat = new THREE.MeshStandardMaterial({ color: palette.jacket, roughness: 0.78 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: palette.shirt, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: palette.pants, roughness: 0.86 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d7be, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1b1d2b, roughness: 0.55 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.3 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: palette.shoe, roughness: 0.62 });
  const soleMat = new THREE.MeshStandardMaterial({ color: palette.sole, roughness: 0.72 });
  const packMat = new THREE.MeshStandardMaterial({ color: palette.pack, roughness: 0.82 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x2d362d, roughness: 0.85 });
  disposables.push(jacketMat, shirtMat, pantsMat, skinMat, hairMat, eyeMat, shoeMat, soleMat, packMat, strapMat);

  // Torso
  const torso = new THREE.Group();
  torso.position.set(0, 0.88, 0);
  figureRoot.add(torso);
  add(torso, new THREE.BoxGeometry(0.32, 0.52, 0.19), shirtMat, 0, 0.27, 0.01);
  add(torso, new THREE.BoxGeometry(0.13, 0.54, 0.22), jacketMat, 0.12, 0.27, 0);
  add(torso, new THREE.BoxGeometry(0.13, 0.54, 0.22), jacketMat, -0.12, 0.27, 0);
  add(torso, new THREE.BoxGeometry(0.36, 0.54, 0.11), jacketMat, 0, 0.27, -0.06);
  add(torso, new THREE.BoxGeometry(0.28, 0.08, 0.2), jacketMat, 0, 0.54, -0.02);
  add(torso, new THREE.BoxGeometry(0.33, 0.13, 0.2), pantsMat, 0, -0.03, 0);
  add(torso, new THREE.CylinderGeometry(0.06, 0.068, 0.11, 8), skinMat, 0, 0.58, 0);

  if (!isAlan && !isIgloo) {
    add(torso, new THREE.BoxGeometry(0.28, 0.36, 0.15), packMat, 0, 0.27, -0.18);
    add(torso, new THREE.BoxGeometry(0.045, 0.38, 0.24), strapMat, 0.12, 0.32, 0);
    add(torso, new THREE.BoxGeometry(0.045, 0.38, 0.24), strapMat, -0.12, 0.32, 0);
  }

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  torso.add(head);
  add(head, new THREE.SphereGeometry(0.155, 12, 10), skinMat, 0, 0.04, 0.01);
  add(head, new THREE.SphereGeometry(0.032, 6, 6), skinMat, 0.15, 0.03, 0, false);
  add(head, new THREE.SphereGeometry(0.032, 6, 6), skinMat, -0.15, 0.03, 0, false);

  if (!isAlan && !isIgloo) {
    add(head, new THREE.BoxGeometry(0.032, 0.028, 0.015), eyeMat, 0.055, 0.04, 0.152, false);
    add(head, new THREE.BoxGeometry(0.032, 0.028, 0.015), eyeMat, -0.055, 0.04, 0.152, false);
    const crown = add(head, new THREE.SphereGeometry(0.166, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat, 0, 0.065, -0.01);
    crown.rotation.x = -0.15;
    add(head, new THREE.BoxGeometry(0.24, 0.12, 0.09), hairMat, 0, 0.01, -0.115);
    for (const [tx, ty, tz, rx, rz] of [
      [-0.07, 0.135, 0.11, 0.35, 0.25],
      [0.01, 0.145, 0.12, 0.42, -0.12],
      [0.085, 0.13, 0.105, 0.35, -0.28],
    ]) {
      const tuft = add(head, new THREE.ConeGeometry(0.045, 0.12, 5), hairMat, tx, ty, tz, false);
      tuft.rotation.set(rx, 0, rz);
    }
  }

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(0.225, 0.48, 0);
  leftArm.rotation.z = 0.08;
  torso.add(leftArm);
  add(leftArm, new THREE.CapsuleGeometry(0.056, 0.34, 5, 8), jacketMat, 0, -0.2, 0);
  add(leftArm, new THREE.SphereGeometry(0.048, 6, 6), skinMat, 0, -0.43, 0, false);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.225, 0.48, 0);
  rightArm.rotation.z = -0.08;
  torso.add(rightArm);
  add(rightArm, new THREE.CapsuleGeometry(0.056, 0.34, 5, 8), jacketMat, 0, -0.2, 0);
  add(rightArm, new THREE.SphereGeometry(0.048, 6, 6), skinMat, 0, -0.43, 0, false);

  // Legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.095, 0.84, 0);
    figureRoot.add(leg);
    add(leg, new THREE.CapsuleGeometry(0.068, 0.56, 5, 8), pantsMat, 0, -0.35, 0);
    add(leg, new THREE.BoxGeometry(0.11, 0.085, 0.23), shoeMat, 0, -0.75, 0.04);
    add(leg, new THREE.BoxGeometry(0.116, 0.032, 0.24), soleMat, 0, -0.805, 0.04);
  }

  // Outfit-Specific Signature 3D Overlays
  let alanParts: AlanGrantCostumeParts | null = null;
  let iglooCrystalMat: THREE.MeshStandardMaterial | null = null;

  if (isAlan) {
    alanParts = buildAlanGrantCostumeParts(isSoftwareGl, false);
    head.add(alanParts.headGroup);
    torso.add(alanParts.torsoGroup);
    leftArm.add(alanParts.leftArmGroup);
    rightArm.add(alanParts.rightArmGroup);
    // Heroic flare-holding pose on the display stand!
    rightArm.rotation.set(-0.62, 0, -0.18);
    disposables.push(...alanParts.disposables);
  } else if (isIgloo) {
    const iglooSnowMat = new THREE.MeshStandardMaterial({ color: 0xeaf6ff, roughness: 0.42, metalness: 0.08 });
    const iglooIceMat = new THREE.MeshStandardMaterial({
      color: 0x8be2ff,
      emissive: new THREE.Color(0x2898c8),
      emissiveIntensity: 0.35,
      roughness: 0.22,
    });
    iglooCrystalMat = new THREE.MeshStandardMaterial({
      color: 0xc2f6ff,
      emissive: new THREE.Color(0x3ce8ff),
      emissiveIntensity: 1.9,
      roughness: 0.1,
    });
    const iglooScarfMat = new THREE.MeshStandardMaterial({ color: 0x1b6fa8, roughness: 0.5 });
    disposables.push(iglooSnowMat, iglooIceMat, iglooCrystalMat, iglooScarfMat);

    add(head, new THREE.SphereGeometry(0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.68), iglooSnowMat, 0, 0.04, 0);
    add(head, new THREE.CylinderGeometry(0.225, 0.24, 0.11, 12), iglooSnowMat, 0, -0.02, 0);
    const s1 = add(head, new THREE.TorusGeometry(0.215, 0.012, 6, 16), iglooIceMat, 0, 0.08, 0, false);
    s1.rotation.x = Math.PI / 2;
    add(head, new THREE.OctahedronGeometry(0.068, 0), iglooIceMat, 0, 0.29, 0, false);
    add(head, new THREE.BoxGeometry(0.24, 0.13, 0.09), iglooIceMat, 0, 0.04, 0.19, false);
    add(head, new THREE.BoxGeometry(0.18, 0.085, 0.06), eyeMat, 0, 0.04, 0.215, false);
    add(head, new THREE.SphereGeometry(0.026, 6, 6), iglooCrystalMat, 0.052, 0.046, 0.245, false);
    add(head, new THREE.SphereGeometry(0.026, 6, 6), iglooCrystalMat, -0.052, 0.046, 0.245, false);

    add(torso, new THREE.CylinderGeometry(0.23, 0.27, 0.56, 10), iglooSnowMat, 0, 0.27, 0);
    add(torso, new THREE.OctahedronGeometry(0.085, 0), iglooCrystalMat, 0, 0.31, 0.23, false);
    add(torso, new THREE.SphereGeometry(0.135, 8, 8), iglooSnowMat, 0.24, 0.5, 0);
    add(torso, new THREE.SphereGeometry(0.135, 8, 8), iglooSnowMat, -0.24, 0.5, 0);
    const scarf = add(torso, new THREE.TorusGeometry(0.16, 0.042, 6, 14), iglooScarfMat, 0, 0.56, 0, false);
    scarf.rotation.x = Math.PI / 2;
  }

  let isActive = false;

  return {
    outfitId,
    root,
    setActive: (active: boolean) => {
      isActive = active;
      ringMat.color.setHex(active ? 0xffe49e : 0xb58a54);
      ringMat.emissive.setHex(active ? 0xffbf47 : 0x7c5426);
      ringMat.emissiveIntensity = active ? 1.55 : 0.14;
    },
    update: (time: number, lanternStrength: number) => {
      // Gentle living breathing motion on the active display ring + Alan's glowing flare
      if (isActive) {
        const pulse = 1.25 + Math.sin(time * 3.1) * 0.38;
        ringMat.emissiveIntensity = pulse;
      }
      if (alanParts) {
        const flicker = 0.86 + Math.sin(time * 16.5) * 0.14 + Math.cos(time * 27.0) * 0.08;
        alanParts.flareGlowMat.opacity = (0.52 + lanternStrength * 0.28) * flicker;
      }
      if (iglooCrystalMat) {
        iglooCrystalMat.emissiveIntensity = 1.45 + Math.sin(time * 2.4) * 0.35;
      }
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
