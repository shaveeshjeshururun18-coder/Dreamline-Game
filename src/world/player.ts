import * as THREE from 'three';
import type { BoyOutfitId, TransportMode } from '../game/types';
import { buildAlanGrantCostumeParts } from './avatarMannequin';
import type { ProceduralTextureSet } from './textures';

export interface PlayerRig {
  group: THREE.Group;
  setOutfit: (outfit: BoyOutfitId) => void;
  setPose: (params: {
    x: number;
    y: number;
    z: number;
    heading: number;
    speed: number;
    turnRate: number;
    transportMode: TransportMode;
    isSitting: boolean;
    isInBoat?: boolean;
    isInCamper?: boolean;
    isSwimming?: boolean;
    isAirborne?: boolean;
    jumpVelocityY?: number;
    jumpOffsetY?: number;
    scale?: number;
    visible: boolean;
    lanternStrength: number;
    elapsed: number;
    dt: number;
  }) => { footstepTriggered: boolean; skatePushTriggered: boolean };
  dispose: () => void;
}

/**
 * Expressive third-person anime young teenage boy protagonist + ridable Bicycle & Skateboard:
 * - Young teenage boy silhouette: short tousled dark anime boy hair with spiky crown & bangs,
 *   visible ears, crisp white inner tee & open navy-slate casual bomber/windbreaker jacket,
 *   slim dark charcoal jeans/trousers, white-soled navy sneakers, and structured campus daypack.
 * - Built-in Japanese commuter bicycle (teal frame, spoked rotating wheels, handlebars, wire basket,
 *   warm dynamo headlight that illuminates at night, red taillight, rotating crank pedals).
 * - Built-in maple wood cruiser skateboard (kicktail deck, grip tape, racing stripe, metal trucks,
 *   4 spinning urethane wheels).
 * - Full procedural animation across Walk/Run, Idle, Bench Sit, Bicycle Pedaling, and Skateboard Carving.
 */
export function createPlayerCharacter(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): PlayerRig {
  const group = new THREE.Group();
  const leanRoot = new THREE.Group();
  const bodyRoot = new THREE.Group();
  leanRoot.add(bodyRoot);
  group.add(leanRoot);

  const disposables: Array<{ dispose: () => void }> = [];

  // Teenage Boy Materials (crisp Makoto Shinkai anime boy palette)
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x2d4364, roughness: 0.78, metalness: 0.05 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.85, metalness: 0.0 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x252836, roughness: 0.86, metalness: 0.03 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d7be, roughness: 0.7, metalness: 0.0 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1b1d2b, roughness: 0.55, metalness: 0.1 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.3, metalness: 0.1 });
  const backpackMat = new THREE.MeshStandardMaterial({ color: 0x4b5c49, roughness: 0.82, metalness: 0.04 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x2d362d, roughness: 0.85, metalness: 0.04 });
  const sneakerMat = new THREE.MeshStandardMaterial({ color: 0x334766, roughness: 0.6, metalness: 0.08 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0xf2f0eb, roughness: 0.72, metalness: 0.02 });

  // Bicycle Materials
  const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x2e7a8c, roughness: 0.34, metalness: 0.55 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd4dae2, roughness: 0.25, metalness: 0.82 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e1f24, roughness: 0.88, metalness: 0.05 });
  const saddleMat = new THREE.MeshStandardMaterial({ color: 0x6b432b, roughness: 0.65, metalness: 0.08 });
  const basketMat = new THREE.MeshStandardMaterial({ color: 0x3a3e48, roughness: 0.55, metalness: 0.55 });
  const bikeLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d4,
    emissive: new THREE.Color(0xffd27d),
    emissiveIntensity: 0.4,
    roughness: 0.2,
  });
  const bikeTailMat = new THREE.MeshStandardMaterial({
    color: 0xd93636,
    emissive: new THREE.Color(0xff2e2e),
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });

  // Skateboard Materials
  const deckWoodMat = new THREE.MeshStandardMaterial({ color: 0xc88d55, roughness: 0.58, metalness: 0.05 });
  const gripTapeMat = new THREE.MeshStandardMaterial({ color: 0x1f2026, roughness: 0.94, metalness: 0.02 });
  const deckStripeMat = new THREE.MeshStandardMaterial({ color: 0xe66f5c, roughness: 0.48, metalness: 0.08 });
  const skateWheelMat = new THREE.MeshStandardMaterial({ color: 0xf5d28e, roughness: 0.4, metalness: 0.05 });

  disposables.push(
    jacketMat,
    shirtMat,
    pantsMat,
    skinMat,
    hairMat,
    eyeMat,
    backpackMat,
    strapMat,
    sneakerMat,
    soleMat,
    bikeFrameMat,
    chromeMat,
    tireMat,
    saddleMat,
    basketMat,
    bikeLampMat,
    bikeTailMat,
    deckWoodMat,
    gripTapeMat,
    deckStripeMat,
    skateWheelMat
  );

  const addMesh = (
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

  // =========================================================================
  // 1. YOUNG TEENAGE BOY MODEL (athletic teen boy silhouette, ~1.68m tall)
  // =========================================================================
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.88, 0);
  bodyRoot.add(torsoPivot);

  // Inner crisp white tee / shirt front
  addMesh(torsoPivot, new THREE.BoxGeometry(0.32, 0.52, 0.19), shirtMat, 0, 0.27, 0.01);
  // Open casual navy-slate jacket panels (left, right, back — boxy teen boy fit, no skirt!)
  addMesh(torsoPivot, new THREE.BoxGeometry(0.13, 0.54, 0.22), jacketMat, 0.12, 0.27, 0);
  addMesh(torsoPivot, new THREE.BoxGeometry(0.13, 0.54, 0.22), jacketMat, -0.12, 0.27, 0);
  addMesh(torsoPivot, new THREE.BoxGeometry(0.36, 0.54, 0.11), jacketMat, 0, 0.27, -0.06);
  // Crisp jacket collar
  addMesh(torsoPivot, new THREE.BoxGeometry(0.28, 0.08, 0.2), jacketMat, 0, 0.54, -0.02);
  // Waist belt / hips
  addMesh(torsoPivot, new THREE.BoxGeometry(0.33, 0.13, 0.2), pantsMat, 0, -0.03, 0);

  // Structured Teenage Campus Backpack (hidden in Igloo Man & Dr. Alan Grant forms)
  const backpackGroup = new THREE.Group();
  torsoPivot.add(backpackGroup);
  addMesh(backpackGroup, new THREE.BoxGeometry(0.28, 0.36, 0.15), backpackMat, 0, 0.27, -0.18);
  addMesh(backpackGroup, new THREE.BoxGeometry(0.24, 0.14, 0.06), strapMat, 0, 0.16, -0.26);
  // Backpack shoulder straps
  addMesh(backpackGroup, new THREE.BoxGeometry(0.045, 0.38, 0.24), strapMat, 0.12, 0.32, 0.0);
  addMesh(backpackGroup, new THREE.BoxGeometry(0.045, 0.38, 0.24), strapMat, -0.12, 0.32, 0.0);

  // Neck + Head with Short Tousled Anime Teenage Boy Hair
  addMesh(torsoPivot, new THREE.CylinderGeometry(0.06, 0.068, 0.11, 8), skinMat, 0, 0.58, 0);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.72, 0);
  torsoPivot.add(headPivot);

  // Face / Cranium
  addMesh(headPivot, new THREE.SphereGeometry(0.155, 14, 12), skinMat, 0, 0.04, 0.01);
  // Ears (clearly visible with short boy hair!)
  addMesh(headPivot, new THREE.SphereGeometry(0.034, 8, 8), skinMat, 0.15, 0.03, 0);
  addMesh(headPivot, new THREE.SphereGeometry(0.034, 8, 8), skinMat, -0.15, 0.03, 0);

  // Default Anime Hair & Eyes Group (hidden when Dr. Alan Grant hat/aviators or Igloo dome active)
  const defaultHairGroup = new THREE.Group();
  headPivot.add(defaultHairGroup);

  // Subtle expressive eyes & brows on front of head (+Z)
  addMesh(defaultHairGroup, new THREE.BoxGeometry(0.032, 0.028, 0.015), eyeMat, 0.055, 0.04, 0.152, false);
  addMesh(defaultHairGroup, new THREE.BoxGeometry(0.032, 0.028, 0.015), eyeMat, -0.055, 0.04, 0.152, false);
  addMesh(defaultHairGroup, new THREE.BoxGeometry(0.042, 0.01, 0.015), hairMat, 0.055, 0.072, 0.15, false);
  addMesh(defaultHairGroup, new THREE.BoxGeometry(0.042, 0.01, 0.015), hairMat, -0.055, 0.072, 0.15, false);

  // Short Layered Boy Hair Crown (tightly cropped back & sides, tousled bangs)
  const hairCrown = addMesh(defaultHairGroup, new THREE.SphereGeometry(0.166, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat, 0, 0.065, -0.01);
  hairCrown.rotation.x = -0.15;
  // Short tapered back hairline (stops neatly at mid-neck, never shoulder-length)
  addMesh(defaultHairGroup, new THREE.BoxGeometry(0.24, 0.12, 0.09), hairMat, 0, 0.01, -0.115);
  // Tousled boyish spiky bangs & crown tufts
  const tuftSpecs: Array<[number, number, number, number, number, number]> = [
    [-0.07, 0.135, 0.11, 0.35, -0.2, 0.25],
    [0.01, 0.145, 0.12, 0.42, 0.05, -0.12],
    [0.085, 0.13, 0.105, 0.35, 0.22, -0.28],
    [-0.04, 0.21, 0.02, -0.2, 0.1, 0.38],
    [0.05, 0.215, -0.02, -0.25, -0.1, -0.32],
    [0.0, 0.195, -0.09, -0.55, 0, 0.05],
  ];
  tuftSpecs.forEach(([tx, ty, tz, rx, ry, rz]) => {
    const tuft = addMesh(defaultHairGroup, new THREE.ConeGeometry(0.046, 0.125, 5), hairMat, tx, ty, tz);
    tuft.rotation.set(rx, ry, rz);
  });

  // =========================================================================
  // 1B. ICELAND IGLOO MAN FORM OVERLAY (toggled by setOutfit('igloo_man'))
  // =========================================================================
  const iglooSnowMat = new THREE.MeshStandardMaterial({
    color: 0xeaf6ff,
    roughness: 0.42,
    metalness: 0.08,
  });
  const iglooIceMat = new THREE.MeshStandardMaterial({
    color: 0x8be2ff,
    emissive: new THREE.Color(0x2898c8),
    emissiveIntensity: 0.32,
    roughness: 0.22,
    metalness: 0.18,
  });
  const iglooEyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xc2f6ff,
    emissive: new THREE.Color(0x3ce8ff),
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });
  const iglooScarfMat = new THREE.MeshStandardMaterial({
    color: 0x1b6fa8,
    emissive: new THREE.Color(0x0b3659),
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });
  disposables.push(iglooSnowMat, iglooIceMat, iglooEyeGlowMat, iglooScarfMat);

  // Igloo Dome Helmet on headPivot
  const iglooHeadGroup = new THREE.Group();
  iglooHeadGroup.visible = false;
  headPivot.add(iglooHeadGroup);
  // Main snow-block dome shell enclosing head
  addMesh(iglooHeadGroup, new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.68), iglooSnowMat, 0, 0.04, 0);
  // Frosted lower snow collar ring
  addMesh(iglooHeadGroup, new THREE.CylinderGeometry(0.225, 0.24, 0.11, 14), iglooSnowMat, 0, -0.02, 0);
  // Carved horizontal ice-block seam bands around the igloo dome
  const seam1 = addMesh(iglooHeadGroup, new THREE.TorusGeometry(0.215, 0.012, 6, 18), iglooIceMat, 0, 0.08, 0, false);
  seam1.rotation.x = Math.PI / 2;
  const seam2 = addMesh(iglooHeadGroup, new THREE.TorusGeometry(0.165, 0.011, 6, 16), iglooIceMat, 0, 0.17, 0, false);
  seam2.rotation.x = Math.PI / 2;
  // Crown ice spire crystal atop dome
  addMesh(iglooHeadGroup, new THREE.OctahedronGeometry(0.068, 0), iglooIceMat, 0, 0.29, 0, false);
  // Iconic mini igloo tunnel arch visor on face (+Z) with glowing cyan eyes inside!
  addMesh(iglooHeadGroup, new THREE.BoxGeometry(0.24, 0.13, 0.09), iglooIceMat, 0, 0.04, 0.19, false);
  addMesh(iglooHeadGroup, new THREE.BoxGeometry(0.18, 0.085, 0.06), eyeMat, 0, 0.04, 0.215, false);
  addMesh(iglooHeadGroup, new THREE.SphereGeometry(0.026, 8, 8), iglooEyeGlowMat, 0.052, 0.046, 0.245, false);
  addMesh(iglooHeadGroup, new THREE.SphereGeometry(0.026, 8, 8), iglooEyeGlowMat, -0.052, 0.046, 0.245, false);

  // Sculpted Glacier Snow-Block Torso Shell + Shoulder Pauldrons + Frost Scarf on torsoPivot
  const iglooTorsoGroup = new THREE.Group();
  iglooTorsoGroup.visible = false;
  torsoPivot.add(iglooTorsoGroup);
  // Broad snow-block igloo body armor
  addMesh(iglooTorsoGroup, new THREE.CylinderGeometry(0.23, 0.27, 0.56, 10), iglooSnowMat, 0, 0.27, 0);
  // Glowing glacier crystal core on chest
  addMesh(iglooTorsoGroup, new THREE.OctahedronGeometry(0.085, 0), iglooEyeGlowMat, 0, 0.31, 0.23, false);
  // Shoulder ice pauldrons
  addMesh(iglooTorsoGroup, new THREE.SphereGeometry(0.135, 10, 8), iglooSnowMat, 0.24, 0.5, 0);
  addMesh(iglooTorsoGroup, new THREE.SphereGeometry(0.135, 10, 8), iglooSnowMat, -0.24, 0.5, 0);
  addMesh(iglooTorsoGroup, new THREE.ConeGeometry(0.06, 0.16, 6), iglooIceMat, 0.27, 0.6, 0, false);
  addMesh(iglooTorsoGroup, new THREE.ConeGeometry(0.06, 0.16, 6), iglooIceMat, -0.27, 0.6, 0, false);
  // Flowing Iceland arctic scarf around collar + trailing tail down back
  const scarfRing = addMesh(iglooTorsoGroup, new THREE.TorusGeometry(0.16, 0.042, 8, 16), iglooScarfMat, 0, 0.56, 0, false);
  scarfRing.rotation.x = Math.PI / 2;
  const scarfTail = addMesh(iglooTorsoGroup, new THREE.BoxGeometry(0.11, 0.32, 0.035), iglooScarfMat, 0.09, 0.38, -0.26, false);
  scarfTail.rotation.x = 0.24;

  // Articulated Left & Right Arms (slightly broader teen boy shoulders)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(0.225, 0.48, 0);
  torsoPivot.add(leftArmPivot);
  addMesh(leftArmPivot, new THREE.CapsuleGeometry(0.056, 0.34, 6, 8), jacketMat, 0, -0.2, 0);
  addMesh(leftArmPivot, new THREE.SphereGeometry(0.048, 8, 8), skinMat, 0, -0.43, 0);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-0.225, 0.48, 0);
  torsoPivot.add(rightArmPivot);
  addMesh(rightArmPivot, new THREE.CapsuleGeometry(0.056, 0.34, 6, 8), jacketMat, 0, -0.2, 0);
  addMesh(rightArmPivot, new THREE.SphereGeometry(0.048, 8, 8), skinMat, 0, -0.43, 0);

  // =========================================================================
  // 1C. DR. ALAN GRANT — JURASSIC SURVIVOR OVERLAY (toggled by setOutfit('alan_grant'))
  // =========================================================================
  const alanParts = buildAlanGrantCostumeParts(isSoftwareGl, true);
  alanParts.headGroup.visible = false;
  alanParts.torsoGroup.visible = false;
  alanParts.leftArmGroup.visible = false;
  alanParts.rightArmGroup.visible = false;
  headPivot.add(alanParts.headGroup);
  torsoPivot.add(alanParts.torsoGroup);
  leftArmPivot.add(alanParts.leftArmGroup);
  rightArmPivot.add(alanParts.rightArmGroup);
  disposables.push(...alanParts.disposables);

  // Articulated Left & Right Legs (slim dark trousers + white-soled canvas sneakers)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(0.095, 0.84, 0);
  bodyRoot.add(leftLegPivot);
  addMesh(leftLegPivot, new THREE.CapsuleGeometry(0.068, 0.56, 6, 8), pantsMat, 0, -0.35, 0);
  addMesh(leftLegPivot, new THREE.BoxGeometry(0.11, 0.085, 0.23), sneakerMat, 0, -0.75, 0.04);
  addMesh(leftLegPivot, new THREE.BoxGeometry(0.116, 0.032, 0.24), soleMat, 0, -0.805, 0.04);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-0.095, 0.84, 0);
  bodyRoot.add(rightLegPivot);
  addMesh(rightLegPivot, new THREE.CapsuleGeometry(0.068, 0.56, 6, 8), pantsMat, 0, -0.35, 0);
  addMesh(rightLegPivot, new THREE.BoxGeometry(0.11, 0.085, 0.23), sneakerMat, 0, -0.75, 0.04);
  addMesh(rightLegPivot, new THREE.BoxGeometry(0.116, 0.032, 0.24), soleMat, 0, -0.805, 0.04);

  // =========================================================================
  // 2. JAPANESE COUNTRYSIDE COMMUTER BICYCLE (自転車)
  // =========================================================================
  const bicycleGroup = new THREE.Group();
  bicycleGroup.visible = false;
  leanRoot.add(bicycleGroup);

  const buildBikeWheel = (zPos: number): THREE.Group => {
    const wg = new THREE.Group();
    wg.position.set(0, 0.34, zPos);
    // Rubber tire + silver rim oriented in YZ plane (spins around X axis!)
    const tireGeo = new THREE.TorusGeometry(0.32, 0.034, 8, 22);
    tireGeo.rotateY(Math.PI / 2);
    const rimGeo = new THREE.TorusGeometry(0.285, 0.016, 6, 20);
    rimGeo.rotateY(Math.PI / 2);
    addMesh(wg, tireGeo, tireMat, 0, 0, 0);
    addMesh(wg, rimGeo, chromeMat, 0, 0, 0, false);
    // Hub
    const hubGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8);
    hubGeo.rotateZ(Math.PI / 2);
    addMesh(wg, hubGeo, chromeMat, 0, 0, 0, false);
    // 4 cross spokes so rotation is clearly visible!
    for (let s = 0; s < 4; s++) {
      const spoke = addMesh(wg, new THREE.CylinderGeometry(0.006, 0.006, 0.56, 4), chromeMat, 0, 0, 0, false);
      spoke.rotation.x = (s / 4) * Math.PI;
    }
    bicycleGroup.add(wg);
    return wg;
  };

  const bikeFrontWheel = buildBikeWheel(0.56);
  const bikeRearWheel = buildBikeWheel(-0.56);

  // Tubular Frame (top tube, down tube, seat tube, forks, rear stays)
  const addTube = (p1: [number, number, number], p2: [number, number, number], radius: number, mat: THREE.Material) => {
    const a = new THREE.Vector3(...p1);
    const b = new THREE.Vector3(...p2);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 7);
    const m = addMesh(bicycleGroup, geo, mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  };

  // Main diamond / commuter frame
  addTube([0, 0.36, -0.04], [0, 0.84, -0.22], 0.022, bikeFrameMat); // seat tube
  addTube([0, 0.84, -0.22], [0, 0.86, 0.36], 0.02, bikeFrameMat); // top tube
  addTube([0, 0.36, -0.04], [0, 0.78, 0.39], 0.024, bikeFrameMat); // down tube
  addTube([0, 0.34, -0.56], [0, 0.82, -0.22], 0.015, bikeFrameMat); // seatstay
  addTube([0, 0.34, -0.56], [0, 0.36, -0.04], 0.015, bikeFrameMat); // chainstay
  // Front fork + steering stem
  addTube([0.055, 0.34, 0.56], [0.03, 0.78, 0.39], 0.016, bikeFrameMat);
  addTube([-0.055, 0.34, 0.56], [-0.03, 0.78, 0.39], 0.016, bikeFrameMat);
  addTube([0, 0.76, 0.4], [0, 1.04, 0.34], 0.022, chromeMat);
  // Swept Handlebars + Grips
  addTube([-0.28, 1.04, 0.3], [0.28, 1.04, 0.3], 0.016, chromeMat);
  addTube([0.26, 1.04, 0.3], [0.28, 1.04, 0.2], 0.022, tireMat);
  addTube([-0.26, 1.04, 0.3], [-0.28, 1.04, 0.2], 0.022, tireMat);
  // Saddle + Seatpost
  addTube([0, 0.84, -0.22], [0, 0.94, -0.25], 0.016, chromeMat);
  addMesh(bicycleGroup, new THREE.BoxGeometry(0.16, 0.06, 0.28), saddleMat, 0, 0.96, -0.26);
  // Classic Japanese Front Wire Basket + Rear Rack
  addMesh(bicycleGroup, new THREE.BoxGeometry(0.32, 0.22, 0.24), basketMat, 0, 0.92, 0.52);
  addMesh(bicycleGroup, new THREE.BoxGeometry(0.18, 0.035, 0.44), chromeMat, 0, 0.72, -0.52);
  // Warm Dynamo Headlight & Rear Red Reflector
  const lampHousing = addMesh(bicycleGroup, new THREE.CylinderGeometry(0.042, 0.035, 0.09, 10), chromeMat, 0, 0.76, 0.56);
  lampHousing.rotation.x = Math.PI / 2;
  addMesh(bicycleGroup, new THREE.SphereGeometry(0.04, 10, 8), bikeLampMat, 0, 0.76, 0.61, false);
  addMesh(bicycleGroup, new THREE.BoxGeometry(0.05, 0.07, 0.03), bikeTailMat, 0, 0.71, -0.75, false);

  // Bicycle Headlight Spot/Point Light for Night Mode riding!
  const bikeHeadlight = new THREE.PointLight(0xffd78a, 0, 14, 1.4);
  bikeHeadlight.position.set(0, 0.82, 1.15);
  bicycleGroup.add(bikeHeadlight);

  // Rotating Pedal Crankset
  const crankPivot = new THREE.Group();
  crankPivot.position.set(0, 0.36, -0.04);
  bicycleGroup.add(crankPivot);
  const chainringGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.02, 12);
  chainringGeo.rotateZ(Math.PI / 2);
  addMesh(crankPivot, chainringGeo, chromeMat, 0.07, 0, 0, false);
  addMesh(crankPivot, new THREE.BoxGeometry(0.02, 0.16, 0.03), chromeMat, 0.11, 0.07, 0, false);
  addMesh(crankPivot, new THREE.BoxGeometry(0.09, 0.025, 0.065), tireMat, 0.15, 0.14, 0, false);
  addMesh(crankPivot, new THREE.BoxGeometry(0.02, 0.16, 0.03), chromeMat, -0.11, -0.07, 0, false);
  addMesh(crankPivot, new THREE.BoxGeometry(0.09, 0.025, 0.065), tireMat, -0.15, -0.14, 0, false);

  // =========================================================================
  // 3. CRUISER SKATEBOARD (スケートボード)
  // =========================================================================
  const skateboardGroup = new THREE.Group();
  skateboardGroup.visible = false;
  leanRoot.add(skateboardGroup);

  // Maple Deck + Grip Tape + Sunset Stripe + Kicktail & Nose
  addMesh(skateboardGroup, new THREE.BoxGeometry(0.24, 0.024, 0.66), deckWoodMat, 0, 0.11, 0);
  addMesh(skateboardGroup, new THREE.BoxGeometry(0.22, 0.008, 0.62), gripTapeMat, 0, 0.125, 0, false);
  addMesh(skateboardGroup, new THREE.BoxGeometry(0.1, 0.006, 0.62), deckStripeMat, 0, 0.096, 0, false);
  const nose = addMesh(skateboardGroup, new THREE.BoxGeometry(0.22, 0.022, 0.14), deckWoodMat, 0, 0.128, 0.38);
  nose.rotation.x = -0.28;
  const tail = addMesh(skateboardGroup, new THREE.BoxGeometry(0.22, 0.022, 0.14), deckWoodMat, 0, 0.128, -0.38);
  tail.rotation.x = 0.28;

  // Front & Rear Metal Trucks + 4 Spinning Urethane Wheels
  const skateWheels: THREE.Mesh[] = [];
  [-0.22, 0.22].forEach((tz) => {
    addMesh(skateboardGroup, new THREE.BoxGeometry(0.22, 0.04, 0.05), chromeMat, 0, 0.075, tz, false);
    [-0.125, 0.125].forEach((wx) => {
      const wGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.034, 10);
      wGeo.rotateZ(Math.PI / 2);
      const wheel = addMesh(skateboardGroup, wGeo, skateWheelMat, wx, 0.045, tz, false);
      skateWheels.push(wheel);
    });
  });

  // Soft Radial Contact Shadow Disc beneath feet / vehicle
  const shadowGeo = new THREE.CircleGeometry(0.62, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.022;
  group.add(shadowDisc);
  disposables.push(shadowGeo, shadowMat);

  // Expanding white water-ripple rings visible while swimming in Neelam Lake or Kadalkarai Ocean
  const rippleGeo = new THREE.RingGeometry(0.42, 0.56, 24);
  rippleGeo.rotateX(-Math.PI / 2);
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xeaf8ff,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const swimRippleRing = new THREE.Mesh(rippleGeo, rippleMat);
  swimRippleRing.position.y = 0.56;
  swimRippleRing.visible = false;
  group.add(swimRippleRing);
  disposables.push(rippleGeo, rippleMat);

  scene.add(group);

  let walkPhase = 0;
  let lastStepHalf = 0;
  let pedalPhase = 0;
  let wheelRot = 0;
  let skatePushPhase = 0;
  let lastSkatePushCycle = 0;
  let smoothLean = 0;

  let currentOutfit: BoyOutfitId = 'navy_jacket';

  const setOutfit = (outfit: BoyOutfitId) => {
    currentOutfit = outfit;
    const isIgloo = outfit === 'igloo_man';
    const isAlan = outfit === 'alan_grant';
    iglooHeadGroup.visible = isIgloo;
    iglooTorsoGroup.visible = isIgloo;
    alanParts.headGroup.visible = isAlan;
    alanParts.torsoGroup.visible = isAlan;
    alanParts.leftArmGroup.visible = isAlan;
    alanParts.rightArmGroup.visible = isAlan;
    backpackGroup.visible = !isIgloo && !isAlan;
    defaultHairGroup.visible = !isIgloo && !isAlan;

    if (isAlan) {
      jacketMat.color.setHex(0x4b79a1); // blue chambray denim sleeves & collar
      shirtMat.color.setHex(0x4b79a1);
      pantsMat.color.setHex(0xd0c4b0); // pleated khaki trousers
      backpackMat.color.setHex(0x4a533b);
      sneakerMat.color.setHex(0xc2782b); // honey/tan nubuck work boots
      soleMat.color.setHex(0x26201b); // dark lug tread boot soles
    } else if (isIgloo) {
      jacketMat.color.setHex(0xdaf2ff); // frosted arctic snow-white arms
      shirtMat.color.setHex(0xeef9ff);
      pantsMat.color.setHex(0x8ecae6); // crystalline glacier legs
      backpackMat.color.setHex(0x63b9e0);
      sneakerMat.color.setHex(0x2d6a9f);
      soleMat.color.setHex(0xf2f0eb);
    } else if (outfit === 'coastal_tee') {
      jacketMat.color.setHex(0x3a89a8); // breezy coastal sky-blue overshirt
      shirtMat.color.setHex(0xfff9ee);
      pantsMat.color.setHex(0x6e6252); // sandy chino trousers
      backpackMat.color.setHex(0xc9884c);
      sneakerMat.color.setHex(0x2f6c82);
      soleMat.color.setHex(0xf2f0eb);
    } else if (outfit === 'winter_parka') {
      jacketMat.color.setHex(0x8e3b38); // warm alpine crimson-rust winter parka
      shirtMat.color.setHex(0xf2e8d5);
      pantsMat.color.setHex(0x1f2533);
      backpackMat.color.setHex(0x4f433b);
      sneakerMat.color.setHex(0x4d3528);
      soleMat.color.setHex(0xf2f0eb);
    } else {
      // Classic navy_jacket
      jacketMat.color.setHex(0x2d4364);
      shirtMat.color.setHex(0xf4f1ea);
      pantsMat.color.setHex(0x252836);
      backpackMat.color.setHex(0x4b5c49);
      sneakerMat.color.setHex(0x334766);
      soleMat.color.setHex(0xf2f0eb);
    }
  };

  const setPose = (params: {
    x: number;
    y: number;
    z: number;
    heading: number;
    speed: number;
    turnRate: number;
    transportMode: TransportMode;
    isSitting: boolean;
    isInBoat?: boolean;
    isInCamper?: boolean;
    isSwimming?: boolean;
    isAirborne?: boolean;
    jumpVelocityY?: number;
    jumpOffsetY?: number;
    scale?: number;
    visible: boolean;
    lanternStrength: number;
    elapsed: number;
    dt: number;
  }) => {
    const scale = params.scale ?? 1.0;
    group.visible = params.visible;
    group.position.set(params.x, params.y, params.z);
    group.rotation.y = params.heading;
    group.scale.setScalar(scale);
    const inBoat = Boolean(params.isInBoat);
    const inCamper = Boolean(params.isInCamper);
    const isSwimming = Boolean(params.isSwimming) && !inBoat && !inCamper;
    const isGiantForm = scale > 1.35;
    const isAirborne = Boolean(params.isAirborne) && !params.isSitting && !inBoat && !inCamper;
    const jumpVelY = params.jumpVelocityY ?? 0;
    const jumpOffY = params.jumpOffsetY ?? 0;

    const onBike =
      params.transportMode === 'bicycle' &&
      !params.isSitting &&
      !inBoat &&
      !inCamper &&
      !isSwimming &&
      !isGiantForm;
    const onSkate =
      params.transportMode === 'skateboard' &&
      !params.isSitting &&
      !inBoat &&
      !inCamper &&
      !isSwimming &&
      !isGiantForm;

    shadowDisc.visible = !params.isSitting && !inBoat && !inCamper && !isSwimming;
    if (shadowDisc.visible) {
      const normAlt = Math.max(0, jumpOffY / Math.max(1, scale));
      shadowDisc.position.y = -normAlt + 0.025;
      const shShrink = Math.max(0.35, 1 - normAlt * 0.28);
      shadowDisc.scale.set(
        (onBike ? 0.9 : 1.0) * shShrink,
        1.0,
        (onBike ? 1.55 : onSkate ? 1.2 : 1.0) * shShrink
      );
    }
    swimRippleRing.visible = isSwimming && !isAirborne;
    bicycleGroup.visible = onBike;
    skateboardGroup.visible = onSkate;
    bicycleGroup.rotation.x = onBike && isAirborne ? THREE.MathUtils.clamp(-jumpVelY * 0.036, -0.26, 0.2) : 0;
    skateboardGroup.rotation.x = onSkate && isAirborne ? THREE.MathUtils.clamp(-jumpVelY * 0.048, -0.34, 0.24) : 0;

    // Update bicycle dynamo headlight & taillight intensity based on night/sunset darkness
    const lampGlow = onBike ? Math.max(0.25, params.lanternStrength) : 0;
    bikeLampMat.emissiveIntensity = 0.35 + lampGlow * 3.0;
    bikeTailMat.emissiveIntensity = 0.3 + lampGlow * 1.8;
    bikeHeadlight.intensity = onBike && params.lanternStrength > 0.35 ? params.lanternStrength * 5.2 : 0;

    // Subtle banking lean into corners while riding bicycle or skateboard
    const targetLean =
      onBike || onSkate
        ? THREE.MathUtils.clamp(-params.turnRate * Math.min(1, params.speed / 6) * 0.18, -0.26, 0.26)
        : 0;
    smoothLean += (targetLean - smoothLean) * Math.min(1, params.dt * 8);
    leanRoot.rotation.z = smoothLean;

    let footstepTriggered = false;
    let skatePushTriggered = false;

    // 0A. Camper Van Driving Pose (seated cleanly inside Olga gripping the vintage steering wheel!)
    if (inCamper) {
      bodyRoot.position.set(0, -0.52, 0);
      bodyRoot.rotation.set(0, 0, 0);
      torsoPivot.rotation.set(0.06, 0, 0);
      leftLegPivot.rotation.set(-1.32, 0, 0.06);
      rightLegPivot.rotation.set(-1.32, 0, -0.06);
      leftArmPivot.rotation.set(-1.12, 0, -0.14);
      rightArmPivot.rotation.set(-1.12, 0, 0.14);
      headPivot.rotation.set(-0.04, THREE.MathUtils.clamp(-params.turnRate * 0.35, -0.3, 0.3), 0);
      return { footstepTriggered: false, skatePushTriggered: false };
    }

    // 0B. Swimming Pose (horizontal buoyant stroke in Neelam Lake or Kadalkarai Ocean!)
    if (isSwimming) {
      const swimMove = Math.min(1, params.speed / 3.2);
      const strokePhase = params.elapsed * (3.2 + swimMove * 3.6);
      const bob = Math.sin(params.elapsed * 2.6) * 0.045;

      // Pulse expanding white water ripple ring around shoulders
      const pulse = (params.elapsed * (0.9 + swimMove * 0.6)) % 1;
      const rScale = 0.85 + pulse * 1.45;
      swimRippleRing.scale.set(rScale, 1, rScale);
      rippleMat.opacity = (1 - pulse) * (0.42 + swimMove * 0.28);

      if (swimMove > 0.15) {
        // Horizontal freestyle / breaststroke glide
        bodyRoot.position.set(0, 0.38 + bob, 0);
        bodyRoot.rotation.set(1.18, 0, Math.sin(strokePhase) * 0.14);
        torsoPivot.rotation.set(0.1, 0, 0);
        leftArmPivot.rotation.set(-2.2 + Math.sin(strokePhase) * 1.15, 0, 0.45);
        rightArmPivot.rotation.set(-2.2 - Math.sin(strokePhase) * 1.15, 0, -0.45);
        leftLegPivot.rotation.set(Math.sin(strokePhase * 1.8) * 0.45, 0, 0.06);
        rightLegPivot.rotation.set(-Math.sin(strokePhase * 1.8) * 0.45, 0, -0.06);
        headPivot.rotation.set(-0.98, 0, 0);
      } else {
        // Relaxed treading water upright with gentle arm sweeps
        bodyRoot.position.set(0, -0.18 + bob, 0);
        bodyRoot.rotation.set(0.16, 0, 0);
        torsoPivot.rotation.set(0, 0, 0);
        leftArmPivot.rotation.set(-0.55 + Math.sin(strokePhase) * 0.28, 0, 0.55 + Math.cos(strokePhase) * 0.25);
        rightArmPivot.rotation.set(-0.55 - Math.sin(strokePhase) * 0.28, 0, -0.55 - Math.cos(strokePhase) * 0.25);
        leftLegPivot.rotation.set(Math.sin(strokePhase * 1.2) * 0.34, 0, 0.08);
        rightLegPivot.rotation.set(-Math.sin(strokePhase * 1.2) * 0.34, 0, -0.08);
        headPivot.rotation.set(-0.1, Math.sin(params.elapsed * 0.6) * 0.15, 0);
      }
      return { footstepTriggered: false, skatePushTriggered: false };
    }

    // 0C. Boat Rowing Pose (seated on wooden rowboat bench, arms gently pulling oars!)
    if (inBoat) {
      const stroke = Math.sin(params.elapsed * 4.2) * Math.min(1, Math.abs(params.speed) / 4.5);
      bodyRoot.position.set(0, -0.32, 0);
      bodyRoot.rotation.set(0, 0, 0);
      torsoPivot.rotation.set(0.08 + stroke * 0.14, 0, 0);
      leftLegPivot.rotation.set(-1.32, 0, 0.08);
      rightLegPivot.rotation.set(-1.32, 0, -0.08);
      leftArmPivot.rotation.set(-0.95 - stroke * 0.32, 0, 0.32);
      rightArmPivot.rotation.set(-0.95 - stroke * 0.32, 0, -0.32);
      headPivot.rotation.set(-0.04, Math.sin(params.elapsed * 0.4) * 0.12, 0);
      return { footstepTriggered: false, skatePushTriggered: false };
    }

    // 1. Bench Sitting Pose
    if (params.isSitting) {
      bodyRoot.position.set(0, -0.34, 0);
      bodyRoot.rotation.set(0, 0, 0);
      torsoPivot.rotation.set(-0.06, 0, 0);
      leftLegPivot.rotation.set(-1.38, 0, 0);
      rightLegPivot.rotation.set(-1.38, 0, 0);
      leftArmPivot.rotation.set(-0.32, 0, 0.08);
      rightArmPivot.rotation.set(-0.32, 0, -0.08);
      headPivot.rotation.set(0, Math.sin(params.elapsed * 0.45) * 0.14, 0);
      return { footstepTriggered: false, skatePushTriggered: false };
    }

    // 2. Bicycle Riding Pose (seated on saddle, hands on handlebars, feet pedaling!)
    if (onBike) {
      wheelRot += (params.speed / 0.32) * params.dt;
      bikeFrontWheel.rotation.x = wheelRot;
      bikeRearWheel.rotation.x = wheelRot;

      if (params.speed > 0.2) {
        pedalPhase += params.speed * params.dt * 1.35;
      }
      crankPivot.rotation.x = pedalPhase;

      bodyRoot.position.set(0, 0.25 + Math.abs(Math.sin(pedalPhase)) * 0.015, -0.26);
      bodyRoot.rotation.set(0, 0, 0);
      torsoPivot.rotation.set(0.32, 0, 0);

      // Arms reaching forward onto swept handlebars
      leftArmPivot.rotation.set(-1.12, 0, -0.1);
      rightArmPivot.rotation.set(-1.12, 0, 0.1);

      // Legs pumping alternately with pedal crank
      const leftPedal = -0.68 + Math.sin(pedalPhase) * 0.42;
      const rightPedal = -0.68 - Math.sin(pedalPhase) * 0.42;
      leftLegPivot.rotation.set(leftPedal, 0, 0.08);
      rightLegPivot.rotation.set(rightPedal, 0, -0.08);

      headPivot.rotation.set(-0.22, THREE.MathUtils.clamp(params.turnRate * 0.12, -0.28, 0.28), 0);
      return { footstepTriggered: false, skatePushTriggered: false };
    }

    // 3. Skateboard Carving & Pushing Pose (sideways stance on deck!)
    if (onSkate) {
      const wheelSpin = (params.speed / 0.04) * params.dt;
      for (let i = 0; i < skateWheels.length; i++) {
        skateWheels[i].rotation.x += wheelSpin;
      }

      const moving = params.speed > 0.35;
      if (moving) {
        skatePushPhase += params.dt * (2.6 + Math.min(2.5, params.speed * 0.22));
      }
      const pushWave = moving ? Math.max(0, Math.sin(skatePushPhase) - 0.55) / 0.45 : 0;
      const pushCycle = Math.floor(skatePushPhase / (Math.PI * 2));
      if (moving && pushCycle !== lastSkatePushCycle && params.speed < 8.5) {
        lastSkatePushCycle = pushCycle;
        skatePushTriggered = true;
      }

      // Stand cleanly atop the maple deck (y = 0.13) turned sideways in goofy/regular surf stance
      bodyRoot.position.set(0, 0.13 + (moving ? Math.abs(Math.sin(skatePushPhase * 0.5)) * 0.02 : 0), 0);
      bodyRoot.rotation.set(0, Math.PI * 0.42, 0);
      torsoPivot.rotation.set(0.08 + pushWave * 0.12, -Math.PI * 0.22, 0);

      // Arms out slightly for stylish balance
      leftArmPivot.rotation.set(-0.22 + pushWave * 0.3, 0, 0.45);
      rightArmPivot.rotation.set(0.22 - pushWave * 0.3, 0, -0.45);

      // Front foot planted on board, back foot swings back to kick-push periodically
      leftLegPivot.rotation.set(-0.18, 0, 0.18);
      rightLegPivot.rotation.set(0.18 + pushWave * 0.52, 0, -0.18);

      // Head looks straight ahead along travel direction
      headPivot.rotation.set(0, -Math.PI * 0.2, 0);
      return { footstepTriggered: false, skatePushTriggered };
    }

    // 4. Mid-Air Jump Pose (expressive anime leap with tucked front leg & lifted balance arms!)
    if (isAirborne) {
      const riseFactor = THREE.MathUtils.clamp(jumpVelY / (7.5 * Math.sqrt(Math.max(1, scale))), -1, 1);
      bodyRoot.position.set(0, 0.06, 0);
      bodyRoot.rotation.set(0, 0, 0);
      torsoPivot.rotation.set(0.14 - riseFactor * 0.08, 0, 0);
      leftLegPivot.rotation.set(-0.72 - riseFactor * 0.28, 0, 0.08);
      rightLegPivot.rotation.set(0.38 - riseFactor * 0.15, 0, -0.08);
      leftArmPivot.rotation.set(-0.62 - riseFactor * 0.35, 0, 0.42);
      rightArmPivot.rotation.set(-0.42 - riseFactor * 0.28, 0, -0.42);
      headPivot.rotation.set(-riseFactor * 0.12, 0, 0);
      return { footstepTriggered: false, skatePushTriggered: false };
    }

    // Animate Dr. Alan Grant's burning red road flare ember flicker
    if (currentOutfit === 'alan_grant') {
      const flicker = 0.84 + Math.sin(params.elapsed * 18.0) * 0.12 + Math.cos(params.elapsed * 31.0) * 0.08;
      alanParts.flareGlowMat.opacity = (0.56 + params.lanternStrength * 0.34) * flicker;
      if (alanParts.flareLight) {
        alanParts.flareLight.intensity = (0.7 + params.lanternStrength * 2.4) * flicker;
      }
    }

    // 5. Walking / Running / Idle on Foot (scale-aware giant stride cadence)
    bodyRoot.rotation.set(0, 0, 0);
    const strideDiv = Math.sqrt(Math.max(1, scale));
    const speedFactor = Math.min(1, params.speed / (6.5 * strideDiv));
    if (params.speed > 0.15) {
      walkPhase += (params.speed / strideDiv) * params.dt * 2.15;
      const stepHalf = Math.floor(walkPhase / Math.PI);
      if (stepHalf !== lastStepHalf) {
        lastStepHalf = stepHalf;
        footstepTriggered = true;
      }
      const swing = Math.sin(walkPhase) * (0.44 + speedFactor * 0.36);
      const bob = Math.abs(Math.cos(walkPhase)) * (0.04 + speedFactor * 0.045);

      bodyRoot.position.set(0, bob, 0);
      torsoPivot.rotation.set(0.05 + speedFactor * 0.09, 0, 0);
      leftLegPivot.rotation.set(swing, 0, 0);
      rightLegPivot.rotation.set(-swing, 0, 0);
      leftArmPivot.rotation.set(-swing * 0.82, 0, 0.05);
      if (currentOutfit === 'alan_grant') {
        // Hold glowing red road flare heroically forward-outward while striding
        rightArmPivot.rotation.set(-0.56 + swing * 0.22, 0, -0.14);
      } else {
        rightArmPivot.rotation.set(swing * 0.82, 0, -0.05);
      }
      headPivot.rotation.set(0, 0, 0);
    } else {
      const breathe = Math.sin(params.elapsed * 1.9);
      bodyRoot.position.set(0, breathe * 0.014, 0);
      torsoPivot.rotation.set(0, 0, 0);
      const decay = Math.max(0, 1 - params.dt * 10);
      leftLegPivot.rotation.set(leftLegPivot.rotation.x * decay, 0, 0);
      rightLegPivot.rotation.set(rightLegPivot.rotation.x * decay, 0, 0);
      leftArmPivot.rotation.set(leftArmPivot.rotation.x * decay, 0, 0.04);
      if (currentOutfit === 'alan_grant') {
        rightArmPivot.rotation.set(-0.52 + breathe * 0.03, 0, -0.14);
      } else {
        rightArmPivot.rotation.set(rightArmPivot.rotation.x * decay, 0, -0.04);
      }
      headPivot.rotation.set(0, Math.sin(params.elapsed * 0.55) * 0.09, 0);
    }

    return { footstepTriggered, skatePushTriggered };
  };

  return {
    group,
    setOutfit,
    setPose,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.remove(group);
    },
  };
}
