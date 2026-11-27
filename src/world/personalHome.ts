import * as THREE from 'three';
import { PLAYABLE_AVATARS } from '../game/avatars';
import { HOME_CENTER, type AabbCollider } from '../game/terrain';
import type { HomeDecorStyle, HomeState, InteractableItem } from '../game/types';
import { buildAvatarDisplayMannequin, type AvatarDisplayStand } from './avatarMannequin';
import type { ProceduralTextureSet } from './textures';
import { VAULT_HATCH_LOCAL, VAULT_SWITCH_LOCAL } from '../game/homeUndergroundVault';

export interface PersonalHomeSystem {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  frostyIglooSeat: { x: number; y: number; z: number; heading: number };
  applyHomeState: (
    home: HomeState,
    lanternStrength: number,
    time: number,
    vaultHatchOpenProgress?: number
  ) => void;
  updatePostcardDisplay: (dataUrl?: string) => void;
  dispose: () => void;
}

const DECOR_PALETTES: Record<
  HomeDecorStyle,
  { wall: number; rug: number; sofa: number; bedQuilt: number; accent: number }
> = {
  warm_wood: {
    wall: 0xf0e4d3,
    rug: 0xb87654,
    sofa: 0x7c5c48,
    bedQuilt: 0xd99b66,
    accent: 0xc26e4d,
  },
  coastal_breeze: {
    wall: 0xeaf1f4,
    rug: 0x4f8fa6,
    sofa: 0x3b677d,
    bedQuilt: 0x6ba7be,
    accent: 0xd49d56,
  },
  botanical: {
    wall: 0xeaece2,
    rug: 0x62805b,
    sofa: 0x4b6347,
    bedQuilt: 0x7ea172,
    accent: 0xc97b63,
  },
};

/**
 * En Illam (என் இல்லம்) — Walkable 2-Storey Personal Countryside House at HOME_CENTER = (-22, -16)
 * - Ground Floor (y = 0.45): Living Room, Kitchen, Bathroom, East Staircase
 * - Second Floor (y = 3.65): Bedroom (bed, wardrobe, desk) + Walk-out Front Scenic Balcony (lz: 5.0..7.5)
 * - Exterior: Garden pathway, wooden fence, mailbox, flower beds, small garden pond, warm fairy lights
 * - Uses floor-aware AABB colliders (minY/maxY) so player can walk freely both downstairs and upstairs.
 */
export function buildPersonalHome(
  textures: ProceduralTextureSet,
  isSoftwareGl = false
): PersonalHomeSystem {
  const group = new THREE.Group();
  const hx = HOME_CENTER.x;
  const hz = HOME_CENTER.z;
  group.position.set(hx, 0, hz);

  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];

  const addLocalCollider = (
    id: string,
    minLx: number,
    maxLx: number,
    minLz: number,
    maxLz: number,
    minY?: number,
    maxY?: number
  ) => {
    colliders.push({
      id: `home_${id}`,
      minX: hx + minLx,
      maxX: hx + maxLx,
      minZ: hz + minLz,
      maxZ: hz + maxLz,
      minY,
      maxY,
    });
  };

  // Shared materials (some dynamically themed by HomeDecorStyle)
  const extWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.82,
    color: 0xc8a484,
  });
  const darkTimberMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.78,
    color: 0x5c3e2d,
  });
  const floorWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.62,
    color: 0xdcb98f,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: textures.roofTile,
    roughness: 0.78,
    color: 0x3f4c63,
  });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8b8682, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xb7d9eb,
    roughness: 0.14,
    metalness: 0.15,
    transparent: true,
    opacity: 0.44,
  });
  const interiorWallMat = new THREE.MeshStandardMaterial({
    map: textures.plasterWall,
    color: DECOR_PALETTES.warm_wood.wall,
    roughness: 0.88,
  });
  const rugMat = new THREE.MeshStandardMaterial({
    color: DECOR_PALETTES.warm_wood.rug,
    roughness: 0.94,
  });
  const sofaMat = new THREE.MeshStandardMaterial({
    color: DECOR_PALETTES.warm_wood.sofa,
    roughness: 0.85,
  });
  const bedQuiltMat = new THREE.MeshStandardMaterial({
    color: DECOR_PALETTES.warm_wood.bedQuilt,
    roughness: 0.86,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: DECOR_PALETTES.warm_wood.accent,
    roughness: 0.65,
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.55 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xbec5cc, roughness: 0.35, metalness: 0.65 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4b7d47, roughness: 0.8 });

  const warmLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: 0xffb85c,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });
  const fairyBulbMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xffb347,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });

  // =========================================================================
  // 1. FOUNDATION, GROUND FLOOR & PORCH
  // =========================================================================
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.45, 10.4), stoneMat);
  foundation.position.set(0, 0.225, 0);
  foundation.receiveShadow = true;
  group.add(foundation);

  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.08, 9.8), floorWoodMat);
  groundFloor.position.set(0, 0.45, 0);
  groundFloor.receiveShadow = true;
  group.add(groundFloor);

  // Front Porch Deck + Two Steps leading to Open Front Door (lx: -1.4..1.4, lz = 5.0)
  const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.26, 2.4), darkTimberMat);
  porchDeck.position.set(0, 0.13, 6.2);
  porchDeck.receiveShadow = true;
  group.add(porchDeck);

  // Porch pillars supporting the 2nd-floor Scenic Balcony above!
  for (const px of [-5.5, -2.2, 2.2, 5.5]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, 0.24), darkTimberMat);
    pillar.position.set(px, 1.85, 7.25);
    pillar.castShadow = true;
    group.add(pillar);
  }

  // Garden stepping stone pathway from front porch out to lz = 11.5
  for (let i = 0; i < 6; i++) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.08, 10), stoneMat);
    stone.position.set(Math.sin(i * 0.7) * 0.25, 0.04, 8.0 + i * 0.95);
    stone.receiveShadow = true;
    group.add(stone);
  }

  // Home Nameplate ("என் இல்லம் · En Illam") & Mailbox beside pathway
  const mailboxPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), darkTimberMat);
  mailboxPost.position.set(2.8, 0.55, 8.8);
  const mailboxBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.56), accentMat);
  mailboxBox.position.set(2.8, 1.14, 8.8);
  group.add(mailboxPost, mailboxBox);

  // Low Wooden Garden Fence around front/side yard with open front entrance AND wide west tunnel driveway apron
  const fenceSections: Array<[number, number, number, number]> = [
    [-5.0, 9.5, 4.2, 0.14], // front-left (shortened so west driveway to Secret Tunnel Portal is wide open!)
    [7.5, 9.5, 9.2, 0.14], // front-right
    [-16.2, 1.5, 0.14, 16.0], // west yard fence shifted outside Pad B & Secret Tunnel Portal
    [11.8, 1.5, 0.14, 16.0], // east yard fence
  ];
  for (const [fx, fz, fw, fd] of fenceSections) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.12, fd), extWoodMat);
    rail.position.set(fx, 0.72, fz);
    const railLow = rail.clone();
    railLow.position.y = 0.36;
    group.add(rail, railLow);
  }

  // Small Garden Pond on the right front lawn (lx: +8.2, lz: 6.2 — clear of west Secret Tunnel driveway!)
  const pondRim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.22, 8, 18), stoneMat);
  pondRim.rotation.x = Math.PI / 2;
  pondRim.position.set(8.2, 0.12, 6.2);
  const pondWater = new THREE.Mesh(
    new THREE.CircleGeometry(1.65, 18),
    new THREE.MeshStandardMaterial({ color: 0x3b8ea5, roughness: 0.12, metalness: 0.2 })
  );
  pondWater.rotation.x = -Math.PI / 2;
  pondWater.position.set(8.2, 0.1, 6.2);
  group.add(pondRim, pondWater);

  // Flower Beds along porch front
  const flowerColors = [0xf29eb4, 0xf7d070, 0xfff2e6, 0xd8859e];
  for (let i = 0; i < 16; i++) {
    const side = i < 8 ? -1 : 1;
    const idx = i % 8;
    const fx = side * (3.1 + idx * 0.45);
    const fz = 7.7 + (idx % 2) * 0.45;
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), leafMat);
    bush.position.set(fx, 0.22, fz);
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 6, 6),
      new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length], roughness: 0.7 })
    );
    bloom.position.set(fx, 0.42, fz);
    group.add(bush, bloom);
  }

  // =========================================================================
  // 2. GROUND FLOOR WALLS (y: 0.45..3.65) WITH OPEN FRONT DOORWAY & WINDOWS
  // =========================================================================
  const addWall = (
    w: number,
    h: number,
    d: number,
    lx: number,
    yCenter: number,
    lz: number,
    mat: THREE.Material = interiorWallMat
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(lx, yCenter, lz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // Back wall (-Z)
  addWall(12.4, 3.2, 0.28, 0, 2.05, -5.0, extWoodMat);
  // West wall (-X) split around lz: -3.3..-0.9 for the Real Animated Interior Secret Tunnel Wall Door!
  addWall(0.28, 3.2, 5.9, -6.1, 2.05, 2.05, extWoodMat); // south segment (-0.9..+5.0)
  addWall(0.28, 3.2, 1.7, -6.1, 2.05, -4.15, extWoodMat); // north segment (-5.0..-3.3)
  addWall(0.32, 0.82, 2.46, -6.1, 3.25, -2.1, darkTimberMat); // header transom above secret doorway

  // Concealed Sliding Interior Secret Wall Door (flush wood inside Living Room, neon cyan frame when opened!)
  const interiorSecretDoor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.4, 2.38), extWoodMat);
  interiorSecretDoor.position.set(-6.1, 1.65, -2.1);
  interiorSecretDoor.castShadow = true;
  interiorSecretDoor.receiveShadow = true;
  group.add(interiorSecretDoor);

  const interiorSecretTrimMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.2,
    roughness: 0.25,
    metalness: 0.5,
  });
  const interiorDoorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.42, 0.12), interiorSecretTrimMat);
  interiorDoorFrameL.position.set(-6.1, 1.65, -3.28);
  const interiorDoorFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.42, 0.12), interiorSecretTrimMat);
  interiorDoorFrameR.position.set(-6.1, 1.65, -0.92);
  const interiorDoorFrameT = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 2.48), interiorSecretTrimMat);
  interiorDoorFrameT.position.set(-6.1, 2.84, -2.1);
  group.add(interiorDoorFrameL, interiorDoorFrameR, interiorDoorFrameT);

  // Sloped covered threshold corridor bridging Living Room (lx=-6.1, y=0.45) to Secret Tunnel Vestibule (lx=-8.25, y=0.04)
  const thresholdFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 0.12, 2.46),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.55 })
  );
  thresholdFloor.position.set(-7.22, 0.22, -2.1);
  thresholdFloor.rotation.z = Math.atan2(0.41, 2.25);
  thresholdFloor.receiveShadow = true;
  group.add(thresholdFloor);
  // Covered corridor roof & side walls so stepping through the house wall feels completely enclosed!
  const thresholdRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 0.22, 2.68),
    new THREE.MeshStandardMaterial({ color: 0x162032, roughness: 0.6, metalness: 0.45 })
  );
  thresholdRoof.position.set(-7.22, 2.95, -2.1);
  group.add(thresholdRoof);
  for (const tz of [-3.36, -0.84]) {
    const tSide = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 2.95, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.5 })
    );
    tSide.position.set(-7.22, 1.48, tz);
    group.add(tSide);
  }

  // East wall (+X)
  addWall(0.28, 3.2, 10.0, 6.1, 2.05, 0, extWoodMat);
  // Front wall (+Z) left and right of wide open entrance doorway (lx: -1.4..1.4)
  addWall(4.7, 3.2, 0.28, -3.75, 2.05, 5.0, extWoodMat);
  addWall(4.7, 3.2, 0.28, 3.75, 2.05, 5.0, extWoodMat);
  // Transom header above front door
  addWall(2.8, 0.75, 0.3, 0, 3.28, 5.0, darkTimberMat);
  // Open hinged wooden door panel swung invitingly inward
  const openDoor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.35, 1.15), darkTimberMat);
  openDoor.position.set(-1.32, 1.62, 4.38);
  group.add(openDoor);

  // Large picture window glass inserts on ground front wall
  for (const wx of [-3.75, 3.75]) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.45, 0.34), glassMat);
    pane.position.set(wx, 2.05, 5.0);
    group.add(pane);
  }

  // Ground-floor perimeter colliders (only active when player is downstairs: maxY = 2.6!)
  addLocalCollider('gf_back', -6.3, 6.3, -5.25, -4.75, 0, 2.6);
  addLocalCollider('gf_west_south', -6.35, -5.85, -0.9, 5.2, 0, 2.6);
  addLocalCollider('gf_west_north', -6.35, -5.85, -5.2, -3.3, 0, 2.6);
  const interiorSecretDoorCollider: AabbCollider = {
    id: 'home_gf_secret_door',
    minX: hx - 6.35,
    maxX: hx - 5.85,
    minZ: hz - 3.3,
    maxZ: hz - 0.9,
    minY: 0,
    maxY: 2.6,
  };
  const exteriorSecretDoorCollider: AabbCollider = {
    id: 'home_ext_secret_tunnel_doors',
    minX: hx - 14.55,
    maxX: hx - 8.25,
    minZ: hz + 3.65,
    maxZ: hz + 4.35,
    minY: 0,
    maxY: 5.0,
  };
  colliders.push(interiorSecretDoorCollider, exteriorSecretDoorCollider);
  addLocalCollider('gf_east', 5.85, 6.35, -5.2, 5.2, 0, 2.6);
  addLocalCollider('gf_front_l', -6.3, -1.45, 4.75, 5.25, 0, 2.6);
  addLocalCollider('gf_front_r', 1.45, 6.3, 4.75, 5.25, 0, 2.6);

  // =========================================================================
  // 3. GROUND FLOOR INTERIOR: LIVING ROOM, KITCHEN, BATHROOM, STAIRCASE
  // =========================================================================
  // Living Room (west-front zone: lx -5.6..-1.0, lz -0.5..4.4)
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 2.8), rugMat);
  rug.position.set(-3.4, 0.5, 1.9);
  rug.receiveShadow = true;
  group.add(rug);

  // Cozy Sofa facing east toward coffee table & TV
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 2.5), sofaMat);
  sofaBase.position.set(-5.05, 0.72, 1.9);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 2.5), sofaMat);
  sofaBack.position.set(-5.45, 1.1, 1.9);
  const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.42), accentMat);
  cushion1.position.set(-5.15, 1.08, 1.15);
  const cushion2 = cushion1.clone();
  cushion2.position.z = 2.65;
  group.add(sofaBase, sofaBack, cushion1, cushion2);
  addLocalCollider('sofa', -5.6, -4.5, 0.65, 3.15, 0, 2.2);

  // Coffee Table with teapot & cups
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 1.45), darkTimberMat);
  coffeeTable.position.set(-3.4, 0.68, 1.9);
  const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), accentMat);
  teapot.position.set(-3.4, 0.99, 1.85);
  group.add(coffeeTable, teapot);

  // Bookshelf + TV Console along interior divider (lx = -1.35)
  const bookshelf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.1, 1.6), darkTimberMat);
  bookshelf.position.set(-5.55, 1.52, -0.4);
  group.add(bookshelf);
  // Colorful book rows
  const bookColors = [0xc96256, 0x4f789c, 0xd8a752, 0x678f69];
  for (let r = 0; r < 3; r++) {
    for (let b = 0; b < 5; b++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.3, 0.18),
        new THREE.MeshStandardMaterial({ color: bookColors[(r + b) % bookColors.length], roughness: 0.75 })
      );
      book.position.set(-5.45, 0.9 + r * 0.56, -0.95 + b * 0.26);
      group.add(book);
    }
  }

  // =========================================================================
  // 3A. HIDDEN SECRET UNDERGROUND VAULT BUTTON & SLIDING FLOOR HATCH
  // =========================================================================
  const secretPanelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.75,
  });
  const secretBtnMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const secretShaftGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.6,
    roughness: 0.25,
  });

  // Hidden Secret Wall Switch Pedestal tucked beside living room bookshelf / foyer
  const switchPedestal = new THREE.Group();
  switchPedestal.position.set(VAULT_SWITCH_LOCAL.x, 0.49, VAULT_SWITCH_LOCAL.z);
  const switchBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.08, 0.32), darkTimberMat);
  switchBase.position.y = 0.54;
  const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.06), secretPanelMat);
  switchPlate.position.set(0, 0.96, 0.16);
  const secretBtnKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 14), secretBtnMat);
  secretBtnKnob.rotation.x = Math.PI / 2;
  secretBtnKnob.position.set(0, 0.96, 0.2);
  const secretRingTrim = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.014, 8, 18), secretBtnMat);
  secretRingTrim.position.set(0, 0.96, 0.195);
  switchPedestal.add(switchBase, switchPlate, secretBtnKnob, secretRingTrim);
  group.add(switchPedestal);

  // Floor-Flush Hidden Sliding Secret Hatch (disguised as oak planks until opened!)
  const hatchGroup = new THREE.Group();
  hatchGroup.position.set(VAULT_HATCH_LOCAL.x, 0.495, VAULT_HATCH_LOCAL.z);
  const hatchRim = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.04, 2.55), darkTimberMat);
  hatchRim.position.y = -0.01;
  // Dark recessed shaft interior + glowing hydraulic steps revealed when doors slide open
  const hatchPit = new THREE.Mesh(
    new THREE.BoxGeometry(2.26, 0.05, 2.26),
    new THREE.MeshBasicMaterial({ color: 0x050b16 })
  );
  hatchPit.position.y = 0.005;
  const hatchGlowBorder = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.045, 2.36), secretShaftGlowMat);
  hatchGlowBorder.position.y = 0.0;
  hatchGlowBorder.visible = false;

  const hatchStepsGroup = new THREE.Group();
  hatchStepsGroup.visible = false;
  for (let st = 0; st < 4; st++) {
    const stepBar = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.24), secretShaftGlowMat);
    stepBar.position.set(0, 0.02 - st * 0.01, -0.7 + st * 0.46);
    hatchStepsGroup.add(stepBar);
  }

  // Twin oak floor door leaves that slide open left & right when triggered
  const hatchLeafLeft = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 2.32), floorWoodMat);
  hatchLeafLeft.position.set(-0.59, 0.025, 0);
  const hatchLeafRight = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 2.32), floorWoodMat);
  hatchLeafRight.position.set(0.59, 0.025, 0);

  hatchGroup.add(
    hatchRim,
    hatchGlowBorder,
    hatchPit,
    hatchStepsGroup,
    hatchLeafLeft,
    hatchLeafRight
  );
  group.add(hatchGroup);

  // Floor Lamp in Living Room corner
  const lampStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.7, 8), darkTimberMat);
  lampStand.position.set(-5.2, 1.32, 3.85);
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.36, 12), warmLampMat);
  lampShade.position.set(-5.2, 2.22, 3.85);
  group.add(lampStand, lampShade);

  // Framed Travel Postcard Display on back living wall (updates when player takes a photo!)
  const postcardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 0.08), darkTimberMat);
  postcardFrame.position.set(-3.2, 2.1, -4.82);
  const defaultPhotoCanvas = document.createElement('canvas');
  defaultPhotoCanvas.width = 256;
  defaultPhotoCanvas.height = 160;
  const pCtx = defaultPhotoCanvas.getContext('2d')!;
  const pGrad = pCtx.createLinearGradient(0, 0, 0, 160);
  pGrad.addColorStop(0, '#5a6ca6');
  pGrad.addColorStop(0.55, '#e89b84');
  pGrad.addColorStop(1, '#4c6652');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 256, 160);
  pCtx.fillStyle = '#fff5dc';
  pCtx.font = 'bold 18px sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText('DREAMLINE MEMORIES', 128, 86);
  const postcardTex = new THREE.CanvasTexture(defaultPhotoCanvas);
  postcardTex.colorSpace = THREE.SRGBColorSpace;
  const postcardMat = new THREE.MeshBasicMaterial({ map: postcardTex });
  const postcardCanvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.96), postcardMat);
  postcardCanvasMesh.position.set(-3.2, 2.1, -4.77);
  group.add(postcardFrame, postcardCanvasMesh);

  // Kitchen (back-center-west zone: lx -2.4..1.85, lz -4.85..-3.9 — leaves clean aisle for Avatar Gallery!)
  const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.92, 0.85), whiteMat);
  kitchenCounter.position.set(0.15, 0.95, -4.4);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 0.92), darkTimberMat);
  counterTop.position.set(0.15, 1.44, -4.4);
  // Stove burners + brass kettle
  const stovePlate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.62), metalMat);
  stovePlate.position.set(0.0, 1.5, -4.4);
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.22, 10), metalMat);
  kettle.position.set(-0.12, 1.63, -4.4);
  // Refrigerator
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.05, 0.88), whiteMat);
  fridge.position.set(-1.95, 1.5, -4.38);
  group.add(kitchenCounter, counterTop, stovePlate, kettle, fridge);
  addLocalCollider('kitchen', -2.45, 1.85, -4.85, -3.9, 0, 2.2);

  // Dining Table & 2 Wooden Chairs (centered at lx = 0.05 so lx 1.15..2.55 is a spacious Avatar Gallery aisle)
  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.78, 1.0), extWoodMat);
  diningTable.position.set(0.05, 0.86, -2.0);
  const chair1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.45), darkTimberMat);
  chair1.position.set(-0.85, 0.9, -2.0);
  const chair2 = chair1.clone();
  chair2.position.x = 0.95;
  group.add(diningTable, chair1, chair2);
  addLocalCollider('dining', -0.95, 1.1, -2.55, -1.45, 0, 2.0);

  // Compact Bathroom Corner (back-west: lx -5.9..-3.6, lz -4.8..-2.4)
  addWall(0.18, 2.9, 2.2, -3.6, 1.9, -3.7, interiorWallMat);
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.6), whiteMat);
  vanity.position.set(-4.8, 0.9, -4.5);
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.06), glassMat);
  mirror.position.set(-4.8, 1.95, -4.8);
  group.add(vanity, mirror);

  // Indoor Potted Plants (kept clear of the foyer entrance into the Avatar Showcase Gallery)
  for (const [px, pz] of [
    [-2.0, 4.1],
    [5.45, 4.25],
    [-2.8, -3.5],
  ]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.34, 10), accentMat);
    pot.position.set(px, 0.64, pz);
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), leafMat);
    foliage.position.set(px, 1.02, pz);
    group.add(pot, foliage);
  }

  // =========================================================================
  // FROSTY'S PERSONAL IGLOO CORNER (Ground Floor East-Front: lx 4.2, lz 3.65)
  // Small decorative igloo bed, plush blue cushion, snowflake lamp, ice crystals & storage chest
  // =========================================================================
  const frostyCorner = new THREE.Group();
  frostyCorner.position.set(4.15, 0.49, 3.65);
  frostyCorner.rotation.y = -Math.PI * 0.72; // faces inward toward room center
  group.add(frostyCorner);

  const iglooSnowMat = new THREE.MeshStandardMaterial({
    color: 0xeef8ff,
    emissive: 0x3ec8f0,
    emissiveIntensity: 0.08,
    roughness: 0.62,
  });
  const frostyCushionMat = new THREE.MeshStandardMaterial({
    color: 0x2c78c8,
    roughness: 0.85,
  });
  const frostyIceDecoMat = new THREE.MeshStandardMaterial({
    color: 0x92ecff,
    emissive: 0x42deff,
    emissiveIntensity: 0.55,
    roughness: 0.16,
    transparent: true,
    opacity: 0.88,
  });
  const snowflakeLampMat = new THREE.MeshStandardMaterial({
    color: 0xdafaff,
    emissive: 0x52e8ff,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  // Soft frosted ice-blue mat under Frosty's corner
  const frostyMatDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 20),
    new THREE.MeshStandardMaterial({ color: 0xbadff5, roughness: 0.88 })
  );
  frostyMatDisc.rotation.x = -Math.PI / 2;
  frostyMatDisc.position.y = 0.015;
  frostyCorner.add(frostyMatDisc);

  // Decorative curved open-front Igloo Dome Bed
  const iglooDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 16, 12, Math.PI * 0.25, Math.PI * 1.5, 0, Math.PI * 0.54),
    iglooSnowMat
  );
  iglooDome.position.set(0, 0.04, -0.15);
  iglooDome.castShadow = true;
  frostyCorner.add(iglooDome);

  const iglooRimArch = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.095, 8, 16, Math.PI),
    iglooSnowMat
  );
  iglooRimArch.position.set(0, 0.08, 0.36);
  frostyCorner.add(iglooRimArch);

  // Plush Blue Cushion nestled inside the Igloo Bed
  const blueCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.14, 16), frostyCushionMat);
  blueCushion.position.set(0, 0.09, 0.05);
  frostyCorner.add(blueCushion);

  // Snowflake-shaped glowing cyan lamp beside the igloo
  const sfLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.16, 10), darkTimberMat);
  sfLampBase.position.set(-0.98, 0.08, 0.28);
  const sfLampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.56, 8), metalMat);
  sfLampStem.position.set(-0.98, 0.42, 0.28);
  const snowflakeHead = new THREE.Group();
  snowflakeHead.position.set(-0.98, 0.78, 0.28);
  for (let ray = 0; ray < 3; ray++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.42, 0.045), snowflakeLampMat);
    bar.rotation.z = (ray * Math.PI) / 3;
    snowflakeHead.add(bar);
  }
  const sfCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), snowflakeLampMat);
  snowflakeHead.add(sfCore);
  frostyCorner.add(sfLampBase, sfLampStem, snowflakeHead);

  // Small Storage Chest for Frosty's snow-globes & pinecones
  const frostyChest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.42), frostyCushionMat);
  frostyChest.position.set(0.95, 0.19, 0.12);
  const frostyChestLid = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.46), iglooSnowMat);
  frostyChestLid.position.set(0.95, 0.4, 0.12);
  frostyCorner.add(frostyChest, frostyChestLid);

  // Tiny Decorative Ice Crystal Clusters framing the corner
  for (const [cx, cz, sc] of [
    [0.82, -0.45, 1.0],
    [1.06, -0.32, 0.72],
    [-0.86, -0.38, 0.88],
  ]) {
    const cryst = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 * sc, 0), frostyIceDecoMat);
    cryst.scale.set(0.65, 1.65, 0.65);
    cryst.position.set(cx, 0.14 * sc, cz);
    frostyCorner.add(cryst);
  }

  const frostyIglooSeat = {
    x: hx + 4.12,
    y: 0.58,
    z: hz + 3.62,
    heading: -Math.PI * 0.72,
  };

  // Climbable Wooden Staircase along East Wall (lx: 3.6..5.7, lz: 2.2 down to -3.2)
  const stepCount = 13;
  for (let s = 0; s < stepCount; s++) {
    const t = s / (stepCount - 1);
    const sz = 2.0 - t * 5.0;
    const sy = 0.56 + t * 3.02;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.48), darkTimberMat);
    tread.position.set(4.75, sy, sz);
    tread.castShadow = true;
    tread.receiveShadow = true;
    group.add(tread);
  }
  // Stair handrail
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 6.2), darkTimberMat);
  handrail.position.set(3.72, 2.9, -0.5);
  handrail.rotation.x = Math.atan2(3.15, 5.2);
  group.add(handrail);

  // =========================================================================
  // 3B. ALL-AVATAR DISPLAY GALLERY (Ground Floor Center-East: lx = 2.95, lz = 1.8..-3.6)
  // Displays EVERY playable avatar on an oak & brass pedestal right inside En Illam;
  // walk up to any displayed avatar and press [E] / Interact to wear it immediately!
  // =========================================================================
  const galleryRunner = new THREE.Mesh(
    new THREE.BoxGeometry(1.06, 0.03, 6.6),
    new THREE.MeshStandardMaterial({ color: 0x3b2c40, roughness: 0.9 })
  );
  galleryRunner.position.set(2.95, 0.505, -0.9);
  galleryRunner.receiveShadow = true;
  group.add(galleryRunner);

  // Warm overhead gallery light bar illuminating all 5 avatar mannequins clearly
  const galleryLightBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 6.2), warmLampMat);
  galleryLightBar.position.set(2.85, 3.36, -0.9);
  group.add(galleryLightBar);

  // Subtle ceiling header banner identifying the Avatar Wardrobe Display
  const galleryBannerCanvas = document.createElement('canvas');
  galleryBannerCanvas.width = 512;
  galleryBannerCanvas.height = 64;
  const gbCtx = galleryBannerCanvas.getContext('2d')!;
  gbCtx.fillStyle = '#241a32';
  gbCtx.fillRect(0, 0, 512, 64);
  gbCtx.strokeStyle = '#f4be98';
  gbCtx.lineWidth = 4;
  gbCtx.strokeRect(4, 4, 504, 56);
  gbCtx.fillStyle = '#faf5ef';
  gbCtx.font = 'bold 20px sans-serif';
  gbCtx.textAlign = 'center';
  gbCtx.fillText('AVATAR GALLERY · PRESS [E] TO WEAR', 256, 39);
  const galleryBannerTex = new THREE.CanvasTexture(galleryBannerCanvas);
  galleryBannerTex.colorSpace = THREE.SRGBColorSpace;
  const galleryBannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.42),
    new THREE.MeshBasicMaterial({ map: galleryBannerTex, side: THREE.DoubleSide })
  );
  galleryBannerMesh.position.set(2.95, 3.02, -0.9);
  galleryBannerMesh.rotation.y = -Math.PI / 2;
  group.add(galleryBannerMesh);

  const avatarStands: AvatarDisplayStand[] = [];
  for (const avatar of PLAYABLE_AVATARS) {
    const stand = buildAvatarDisplayMannequin(avatar.id, isSoftwareGl);
    stand.root.position.set(2.85, 0.49, avatar.homeGalleryZ);
    stand.root.rotation.y = -Math.PI * 0.62; // angled warmly toward the foyer & open front doorway
    group.add(stand.root);
    avatarStands.push(stand);

    interactables.push({
      id: `home_avatar_stand_${avatar.id}`,
      kind: 'home_avatar_stand',
      label: `Wear ${avatar.name}`,
      sublabel: `என் இல்லம் · ${avatar.desc}`,
      x: hx + 2.25,
      y: 0.45,
      z: hz + avatar.homeGalleryZ,
      radius: 1.75,
      locationId: 'my_home',
      metaId: avatar.id,
    });
  }
  // Floor-aware collider around the pedestal row so the player walks cleanly beside each stand
  addLocalCollider('avatar_gallery_row', 2.52, 3.28, -4.05, 2.25, 0, 2.4);

  // =========================================================================
  // 4. SECOND FLOOR (y = 3.65): BEDROOM + WALK-OUT SCENIC BALCONY (lz: 5..7.5)
  // =========================================================================
  // Floor slab covering lx -6.1..3.5 (leaving stairwell open on east side lx 3.5..5.9, lz -3.2..2.4)
  const floor2West = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 10.0), floorWoodMat);
  floor2West.position.set(-1.3, 3.55, 0);
  floor2West.receiveShadow = true;
  group.add(floor2West);

  const floor2LandingBack = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.24, 1.9), floorWoodMat);
  floor2LandingBack.position.set(4.75, 3.55, -4.1);
  floor2LandingBack.receiveShadow = true;
  group.add(floor2LandingBack);

  const floor2LandingFront = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.24, 2.8), floorWoodMat);
  floor2LandingFront.position.set(4.75, 3.55, 3.65);
  floor2LandingFront.receiveShadow = true;
  group.add(floor2LandingFront);

  // Walk-out Scenic Balcony Deck (lx: -6.0..6.0, lz: 5.0..7.6)
  const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.24, 2.7), extWoodMat);
  balconyDeck.position.set(0, 3.55, 6.25);
  balconyDeck.castShadow = true;
  balconyDeck.receiveShadow = true;
  group.add(balconyDeck);

  // Balcony Timber Railing
  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.12, 0.14), darkTimberMat);
  frontRail.position.set(0, 4.65, 7.48);
  group.add(frontRail);
  for (let bx = -5.8; bx <= 5.8; bx += 1.15) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 0.08), darkTimberMat);
    post.position.set(bx, 4.15, 7.48);
    group.add(post);
  }
  // West side balcony railing (east side opens cleanly onto the Rooftop Helipad Staircase!)
  const westSideRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 2.6), darkTimberMat);
  westSideRail.position.set(-6.0, 4.65, 6.25);
  group.add(westSideRail);
  // Short east entry post framing the helipad staircase doorway
  const eastDoorPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 0.12), darkTimberMat);
  eastDoorPost.position.set(6.0, 4.15, 5.15);
  group.add(eastDoorPost);

  // Balcony Furniture: Two Sittable Sunset Chairs + Small Round Table + Lantern + Flower Boxes
  const balTable = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, 0.65, 12), darkTimberMat);
  balTable.position.set(-1.5, 4.0, 6.35);
  const balLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.28, 8), warmLampMat);
  balLantern.position.set(-1.5, 4.46, 6.35);
  group.add(balTable, balLantern);

  for (const cx of [-2.6, -0.4]) {
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.65), extWoodMat);
    chairSeat.position.set(cx, 4.1, 6.3);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.1), extWoodMat);
    chairBack.position.set(cx, 4.44, 6.0);
    group.add(chairSeat, chairBack);
  }

  // Second-floor Walls (y: 3.65..6.85) with wide open Balcony Glass Sliding Opening (lx: -1.8..1.8)
  addWall(12.4, 3.2, 0.28, 0, 5.25, -5.0, extWoodMat);
  addWall(0.28, 3.2, 10.0, -6.1, 5.25, 0, extWoodMat);
  addWall(0.28, 3.2, 10.0, 6.1, 5.25, 0, extWoodMat);
  addWall(4.3, 3.2, 0.28, -3.95, 5.25, 5.0, extWoodMat);
  addWall(4.3, 3.2, 0.28, 3.95, 5.25, 5.0, extWoodMat);
  addWall(3.6, 0.65, 0.28, 0, 6.52, 5.0, darkTimberMat);

  // Second-floor Bedroom Furniture (west half of Floor 2)
  // Bed (lx: -4.2, lz: -2.2)
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 2.5), darkTimberMat);
  bedFrame.position.set(-4.4, 3.9, -2.2);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.28, 2.38), whiteMat);
  mattress.position.set(-4.4, 4.22, -2.2);
  const quilt = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.18, 1.75), bedQuiltMat);
  quilt.position.set(-4.4, 4.34, -1.9);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.46), whiteMat);
  pillow.position.set(-4.4, 4.42, -3.05);
  group.add(bedFrame, mattress, quilt, pillow);

  // Wardrobe Closet (lx: -5.4, lz: 2.2)
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.3, 1.85), darkTimberMat);
  wardrobe.position.set(-5.45, 4.82, 2.2);
  group.add(wardrobe);

  // Study Desk + Warm Desk Lamp (lx: -0.6, lz: -4.1)
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.78, 0.85), extWoodMat);
  desk.position.set(-0.6, 4.05, -4.15);
  const deskLamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), warmLampMat);
  deskLamp.position.set(-1.15, 4.62, -4.25);
  group.add(desk, deskLamp);

  // =========================================================================
  // 5. PITCHED TIMBER ROOF + CHIMNEY + WARM FAIRY LIGHTS
  // =========================================================================
  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.28, 8.2), roofMat);
  roofLeft.position.set(0, 8.25, -3.1);
  roofLeft.rotation.x = -0.36;
  roofLeft.castShadow = true;
  const roofRight = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.28, 9.6), roofMat);
  roofRight.position.set(0, 8.05, 3.6);
  roofRight.rotation.x = 0.34;
  roofRight.castShadow = true;
  group.add(roofLeft, roofRight);

  // Stone Chimney on west roof slope
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.6, 0.95), stoneMat);
  chimney.position.set(-4.5, 8.9, -2.5);
  group.add(chimney);

  // =========================================================================
  // 5B. ROOFTOP HELIPAD ABOVE MY HOME (y = 10.4m) FOR SSJ TROPICAL SKY EXPLORER
  // =========================================================================
  const heliSteelMat = new THREE.MeshStandardMaterial({ color: 0x2f3747, roughness: 0.5, metalness: 0.65 });
  const heliDeckMat = new THREE.MeshStandardMaterial({ color: 0x242a38, roughness: 0.76, metalness: 0.18 });
  const heliYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: new THREE.Color(0xca8a04),
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const heliBeaconMat = new THREE.MeshStandardMaterial({
    color: 0x7df9ff,
    emissive: new THREE.Color(0x38bdf8),
    emissiveIntensity: 1.75,
    roughness: 0.18,
  });
  const heliY = 10.4;
  // 4 steel support columns anchoring the helipad cleanly above the pitched timber roof
  for (const sx of [-3.6, 3.6]) {
    for (const sz of [-3.2, 3.2]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.1, 8), heliSteelMat);
      strut.position.set(sx, heliY - 1.55, sz);
      group.add(strut);
    }
  }
  const heliDeck = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.75, 0.32, 20), heliDeckMat);
  heliDeck.position.set(0, heliY - 0.16, 0);
  heliDeck.receiveShadow = true;
  group.add(heliDeck);

  const heliRim = new THREE.Mesh(new THREE.TorusGeometry(5.45, 0.12, 8, 28), heliSteelMat);
  heliRim.rotation.x = Math.PI / 2;
  heliRim.position.set(0, heliY + 0.04, 0);
  group.add(heliRim);

  const heliCircle = new THREE.Mesh(new THREE.RingGeometry(3.85, 4.25, 28), heliYellowMat);
  heliCircle.rotation.x = -Math.PI / 2;
  heliCircle.position.set(0, heliY + 0.03, 0);
  group.add(heliCircle);

  // Bold yellow "H" on My Home Helipad
  const hBarL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 4.1), heliYellowMat);
  hBarL.position.set(-1.35, heliY + 0.03, 0);
  const hBarR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 4.1), heliYellowMat);
  hBarR.position.set(1.35, heliY + 0.03, 0);
  const hCross = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.04, 0.5), heliYellowMat);
  hCross.position.set(0, heliY + 0.03, 0);
  group.add(hBarL, hBarR, hCross);

  for (let b = 0; b < 4; b++) {
    const ba = (b / 4) * Math.PI * 2 + Math.PI / 4;
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), heliBeaconMat);
    beacon.position.set(Math.cos(ba) * 5.05, heliY + 0.2, Math.sin(ba) * 5.05);
    group.add(beacon);
  }

  // =========================================================================
  // 5B-2. TWIN WEST WING HELIPAD (PAD B, local x = -11.4, y = 10.4m)
  //       Dedicated circular helipad for the Gold/Wood Ducted-Fan VTOL Aircraft,
  //       connected directly to Pad A via a walkable steel skybridge!
  // =========================================================================
  const padBX = -11.4;
  // 4 tall steel structural support columns anchoring Pad B cleanly down to ground (y = 0)
  for (const sx of [-3.4, 3.4]) {
    for (const sz of [-3.4, 3.4]) {
      const colB = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, heliY - 0.16, 10), heliSteelMat);
      colB.position.set(padBX + sx, (heliY - 0.16) * 0.5, sz);
      colB.castShadow = true;
      colB.receiveShadow = true;
      group.add(colB);
    }
  }
  // Cross-bracing trusses beneath Pad B for architectural realism
  const braceB1 = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.22, 0.22), heliSteelMat);
  braceB1.position.set(padBX, heliY - 3.6, 0);
  const braceB2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 6.9), heliSteelMat);
  braceB2.position.set(padBX, heliY - 3.6, 0);
  group.add(braceB1, braceB2);

  const heliDeckB = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.75, 0.32, 22), heliDeckMat);
  heliDeckB.position.set(padBX, heliY - 0.16, 0);
  heliDeckB.castShadow = true;
  heliDeckB.receiveShadow = true;
  group.add(heliDeckB);

  const heliRimB = new THREE.Mesh(new THREE.TorusGeometry(5.45, 0.12, 8, 28), heliSteelMat);
  heliRimB.rotation.x = Math.PI / 2;
  heliRimB.position.set(padBX, heliY + 0.04, 0);
  group.add(heliRimB);

  const heliCircleB = new THREE.Mesh(new THREE.RingGeometry(3.85, 4.25, 28), heliYellowMat);
  heliCircleB.rotation.x = -Math.PI / 2;
  heliCircleB.position.set(padBX, heliY + 0.03, 0);
  group.add(heliCircleB);

  // Bold yellow "H" on Pad B
  const hBarLB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 4.1), heliYellowMat);
  hBarLB.position.set(padBX - 1.35, heliY + 0.03, 0);
  const hBarRB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 4.1), heliYellowMat);
  hBarRB.position.set(padBX + 1.35, heliY + 0.03, 0);
  const hCrossB = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.04, 0.5), heliYellowMat);
  hCrossB.position.set(padBX, heliY + 0.03, 0);
  group.add(hBarLB, hBarRB, hCrossB);

  for (let b = 0; b < 4; b++) {
    const ba = (b / 4) * Math.PI * 2 + Math.PI / 4;
    const beaconB = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), heliBeaconMat);
    beaconB.position.set(padBX + Math.cos(ba) * 5.05, heliY + 0.2, Math.sin(ba) * 5.05);
    group.add(beaconB);
  }

  // Walkable Steel Skybridge connecting Pad A (lx = -5.4) and Pad B (lx = -6.0)
  const twinBridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.26, 3.6), heliDeckMat);
  twinBridgeDeck.position.set(-5.7, heliY - 0.13, 0);
  twinBridgeDeck.castShadow = true;
  twinBridgeDeck.receiveShadow = true;
  group.add(twinBridgeDeck);
  for (const rz of [-1.72, 1.72]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 0.12), heliSteelMat);
    rail.position.set(-5.7, heliY + 0.88, rz);
    group.add(rail);
    for (const px of [-6.9, -5.7, -4.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), heliSteelMat);
      post.position.set(px, heliY + 0.44, rz);
      group.add(post);
    }
  }

  // =========================================================================
  // 5B-3. EXTERNAL EAST WING SKY TERRACE PAD C (local x = +11.4, y = 10.4m)
  //       Dedicated circular rescue-orange helipad for the SSJ Orange Rescue Helicopter,
  //       connected to Pad A via a symmetrical East Skybridge — zero yard congestion!
  // =========================================================================
  const padCX = 11.4;
  const heliOrangeRingMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: new THREE.Color(0xea580c),
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });
  const heliOrangeBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xfb923c,
    emissive: new THREE.Color(0xea580c),
    emissiveIntensity: 1.85,
    roughness: 0.2,
  });
  for (const sx of [-3.4, 3.4]) {
    for (const sz of [-3.4, 3.4]) {
      const colC = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, heliY - 0.16, 10), heliSteelMat);
      colC.position.set(padCX + sx, (heliY - 0.16) * 0.5, sz);
      colC.castShadow = true;
      colC.receiveShadow = true;
      group.add(colC);
    }
  }
  const braceC1 = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.22, 0.22), heliSteelMat);
  braceC1.position.set(padCX, heliY - 3.6, 0);
  const braceC2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 6.9), heliSteelMat);
  braceC2.position.set(padCX, heliY - 3.6, 0);
  group.add(braceC1, braceC2);

  const heliDeckC = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.75, 0.32, 22), heliDeckMat);
  heliDeckC.position.set(padCX, heliY - 0.16, 0);
  heliDeckC.castShadow = true;
  heliDeckC.receiveShadow = true;
  group.add(heliDeckC);

  const heliRimC = new THREE.Mesh(new THREE.TorusGeometry(5.45, 0.12, 8, 28), heliSteelMat);
  heliRimC.rotation.x = Math.PI / 2;
  heliRimC.position.set(padCX, heliY + 0.04, 0);
  group.add(heliRimC);

  const heliCircleC = new THREE.Mesh(new THREE.RingGeometry(3.85, 4.25, 28), heliOrangeRingMat);
  heliCircleC.rotation.x = -Math.PI / 2;
  heliCircleC.position.set(padCX, heliY + 0.03, 0);
  group.add(heliCircleC);

  // Bold white/orange "H" on Pad C
  const hBarLC = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 4.1), heliOrangeRingMat);
  hBarLC.position.set(padCX - 1.35, heliY + 0.03, 0);
  const hBarRC = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 4.1), heliOrangeRingMat);
  hBarRC.position.set(padCX + 1.35, heliY + 0.03, 0);
  const hCrossC = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.04, 0.5), heliOrangeRingMat);
  hCrossC.position.set(padCX, heliY + 0.03, 0);
  group.add(hBarLC, hBarRC, hCrossC);

  for (let b = 0; b < 4; b++) {
    const ba = (b / 4) * Math.PI * 2 + Math.PI / 4;
    const beaconC = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), heliOrangeBeaconMat);
    beaconC.position.set(padCX + Math.cos(ba) * 5.05, heliY + 0.2, Math.sin(ba) * 5.05);
    group.add(beaconC);
  }

  // Symmetrical Walkable East Steel Skybridge connecting Pad A (lx = +4.4) and Pad C (lx = +7.0)
  const eastBridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.26, 3.6), heliDeckMat);
  eastBridgeDeck.position.set(5.7, heliY - 0.13, 0);
  eastBridgeDeck.castShadow = true;
  eastBridgeDeck.receiveShadow = true;
  group.add(eastBridgeDeck);
  for (const rz of [-1.72, 1.72]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 0.12), heliSteelMat);
    rail.position.set(5.7, heliY + 0.88, rz);
    group.add(rail);
    for (const px of [4.5, 5.7, 6.9]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), heliSteelMat);
      post.position.set(px, heliY + 0.44, rz);
      group.add(post);
    }
  }

  // External Rooftop Sky-Terrace Launch Lever Pedestal at the top of the staircase (lx = 5.0, lz = -3.0)
  const leverPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.55), heliSteelMat);
  leverPedestal.position.set(5.0, heliY + 0.55, -3.0);
  const leverArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65, 8), heliOrangeBeaconMat);
  leverArm.position.set(5.0, heliY + 1.32, -3.0);
  leverArm.rotation.z = -0.35;
  const leverKnob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), heliBeaconMat);
  leverKnob.position.set(5.12, heliY + 1.62, -3.0);
  group.add(leverPedestal, leverArm, leverKnob);

  // =========================================================================
  // 5C. WALKABLE EXTERIOR EAST HELIPAD STAIRCASE & TOP SKYWALK BRIDGE
  //     Connects 2nd-floor east balcony (lx: 6.0..8.0, lz: 6.2, y = 3.65m)
  //     smoothly up to the Rooftop Helipad Deck (y = 10.4m)!
  // =========================================================================
  // Entry landing deck extending off the east edge of the 2nd-floor balcony (lx: 6.0..8.0, lz: 5.5..7.55)
  const heliEntryDeck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.24, 2.1), extWoodMat);
  heliEntryDeck.position.set(7.0, 3.55, 6.5);
  heliEntryDeck.castShadow = true;
  heliEntryDeck.receiveShadow = true;
  group.add(heliEntryDeck);
  const heliEntryFrontRail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.14), heliSteelMat);
  heliEntryFrontRail.position.set(7.0, 4.65, 7.48);
  const heliEntryOuterRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 2.0), heliSteelMat);
  heliEntryOuterRail.position.set(7.98, 4.65, 6.55);
  group.add(heliEntryFrontRail, heliEntryOuterRail);

  // Steel support columns grounding the exterior staircase & top bridge cleanly to y = 0
  const stairSupports: Array<[number, number, number]> = [
    [7.85, 3.55, 7.35],
    [7.85, 5.2, 3.8],
    [7.85, 7.1, 0.8],
    [7.85, 9.0, -2.0],
    [7.85, 10.35, -4.15],
    [6.35, 10.35, -4.15],
  ];
  for (const [sx, sh, sz] of stairSupports) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, sh, 8), heliSteelMat);
    col.position.set(sx, sh * 0.5, sz);
    group.add(col);
  }

  // 22 Timber-Tread Steel Steps climbing from lz = 6.2 (y = 3.65) to lz = -3.8 (y = 10.4)
  const heliStepCount = 22;
  const heliStartZ = 6.2;
  const heliRun = 10.0;
  const heliRise = heliY - 3.65; // 6.75m
  for (let s = 0; s < heliStepCount; s++) {
    const frac = (s + 0.5) / heliStepCount;
    const treadY = 3.65 + frac * heliRise;
    const treadZ = heliStartZ - frac * heliRun;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 0.52), extWoodMat);
    tread.position.set(7.1, treadY - 0.06, treadZ);
    tread.castShadow = true;
    tread.receiveShadow = true;
    group.add(tread);
    // Bright amber step-edge trim every 4th step for easy night-time visibility
    if (s % 4 === 0) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.03, 0.06), heliYellowMat);
      strip.position.set(7.1, treadY + 0.01, treadZ + 0.22);
      group.add(strip);
    }
  }

  // Sloped steel stringers & twin safety handrails along both edges of the helipad staircase
  const heliSlopeLen = Math.hypot(heliRun, heliRise);
  const heliSlopePitch = Math.atan2(heliRise, heliRun);
  for (const railX of [6.28, 7.92]) {
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, heliSlopeLen + 0.4), heliSteelMat);
    stringer.position.set(railX, 3.65 + heliRise * 0.5 - 0.18, heliStartZ - heliRun * 0.5);
    stringer.rotation.x = heliSlopePitch;
    group.add(stringer);

    const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, heliSlopeLen + 0.4), heliSteelMat);
    handrail.position.set(railX, 3.65 + heliRise * 0.5 + 0.92, heliStartZ - heliRun * 0.5);
    handrail.rotation.x = heliSlopePitch;
    group.add(handrail);

    for (let p = 0; p <= 5; p++) {
      const pf = p / 5;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), heliSteelMat);
      post.position.set(railX, 3.65 + pf * heliRise + 0.45, heliStartZ - pf * heliRun);
      group.add(post);
    }
  }

  // Top Skywalk Bridge Deck (lx: 4.3..8.0, lz: -4.4..-2.0, y = 10.4m) stepping smoothly onto the circular Helipad!
  const skywalkDeck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 2.4), heliDeckMat);
  skywalkDeck.position.set(6.1, heliY - 0.12, -3.2);
  skywalkDeck.receiveShadow = true;
  group.add(skywalkDeck);
  const skywalkEdgeStripe = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.035, 0.12), heliYellowMat);
  skywalkEdgeStripe.position.set(6.1, heliY + 0.02, -4.25);
  const skywalkBackRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.1), heliSteelMat);
  skywalkBackRail.position.set(6.1, heliY + 1.0, -4.32);
  const skywalkEastRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.3), heliSteelMat);
  skywalkEastRail.position.set(7.92, heliY + 1.0, -3.2);
  const skywalkGuideBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.3, 8), heliBeaconMat);
  skywalkGuideBeacon.position.set(7.8, heliY + 1.18, -4.25);
  group.add(skywalkEdgeStripe, skywalkBackRail, skywalkEastRail, skywalkGuideBeacon);

  // =========================================================================
  // 5B. NEW 3RD FLOOR: HERO CHARACTER-SWITCHING HALL (y = 7.0m, off East Staircase mid-landing!)
  // =========================================================================
  const heroFloorY = 7.0;
  const heroFloorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.35 });
  const heroNeonMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const heroGlassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.32,
  });

  // 3rd Floor Slab & Mid-Landing Bridge connecting East Staircase (lz: 0.2..2.2) into the Hero Hall
  const heroSlab = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.24, 9.8), heroFloorMat);
  heroSlab.position.set(0, heroFloorY - 0.12, 0);
  heroSlab.receiveShadow = true;
  const heroLandingBridge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.2), heroFloorMat);
  heroLandingBridge.position.set(6.1, heroFloorY - 0.1, 1.2);
  group.add(heroSlab, heroLandingBridge);

  // Panoramic Glass Walls framing the 3rd Floor Hero Gallery (open doorway on East wall at lz: 0.0..2.4)
  const hWallN = new THREE.Mesh(new THREE.BoxGeometry(12.2, 2.9, 0.18), heroGlassMat);
  hWallN.position.set(0, heroFloorY + 1.45, -4.85);
  const hWallS = new THREE.Mesh(new THREE.BoxGeometry(12.2, 2.9, 0.18), heroGlassMat);
  hWallS.position.set(0, heroFloorY + 1.45, 4.85);
  const hWallW = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.9, 9.8), heroGlassMat);
  hWallW.position.set(-6.05, heroFloorY + 1.45, 0);
  const hWallEN = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.9, 4.8), heroGlassMat);
  hWallEN.position.set(6.05, heroFloorY + 1.45, -2.45);
  const hWallES = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.9, 2.4), heroGlassMat);
  hWallES.position.set(6.05, heroFloorY + 1.45, 3.65);
  group.add(hWallN, hWallS, hWallW, hWallEN, hWallES);

  // Glowing Central Hero Switching Pedestal + 5 Illuminated Suit Alcove Bays along North Gallery Wall
  const heroConsoleBase = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.55, 0.24, 18), heroFloorMat);
  heroConsoleBase.position.set(0, heroFloorY + 0.12, 0);
  const heroConsoleRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.07, 10, 28), heroNeonMat);
  heroConsoleRing.rotation.x = Math.PI * 0.5;
  heroConsoleRing.position.set(0, heroFloorY + 0.26, 0);
  const heroHoloPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 1.1, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.7 })
  );
  heroHoloPillar.position.set(0, heroFloorY + 0.55, -2.35);
  const heroHoloScreen = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.72, 0.08), heroNeonMat);
  heroHoloScreen.position.set(0, heroFloorY + 1.45, -2.35);
  group.add(heroConsoleBase, heroConsoleRing, heroHoloPillar, heroHoloScreen);

  const alcoveColors = [0xdc2626, 0xf59e0b, 0x38bdf8, 0x1e293b, 0x2563eb];
  for (let i = 0; i < alcoveColors.length; i++) {
    const ax = -4.2 + i * 2.1;
    const bayBack = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.35, 0.28), heroFloorMat);
    bayBack.position.set(ax, heroFloorY + 1.18, -4.35);
    const bayPad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.18, 12), heroFloorMat);
    bayPad.position.set(ax, heroFloorY + 0.09, -3.75);
    const suitSilhouette = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.95, 6, 10),
      new THREE.MeshStandardMaterial({
        color: alcoveColors[i],
        emissive: alcoveColors[i],
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.65,
      })
    );
    suitSilhouette.position.set(ax, heroFloorY + 1.05, -3.75);
    const bayRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 8, 18), heroNeonMat);
    bayRing.rotation.x = Math.PI * 0.5;
    bayRing.position.set(ax, heroFloorY + 0.2, -3.75);
    group.add(bayBack, bayPad, suitSilhouette, bayRing);
  }

  // Fairy lights strung along the balcony eaves!
  const fairyLightsGroup = new THREE.Group();
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const fx = -5.5 + t * 11.0;
    const sag = Math.sin(t * Math.PI) * 0.35;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), fairyBulbMat);
    bulb.position.set(fx, 6.45 - sag, 7.35);
    fairyLightsGroup.add(bulb);
  }
  group.add(fairyLightsGroup);

  // Warm PointLight illuminating the house foyer, living room & 5-Avatar Showcase Gallery cleanly
  const homeWarmLight = new THREE.PointLight(0xffcf94, 2.1, 20, 1.45);
  homeWarmLight.position.set(1.1, 2.85, 0.35);
  group.add(homeWarmLight);

  // Framed Bus & Train Destination & Departure Timing Map inside En Illam Living Room + Front Porch!
  const homeTransitMat = new THREE.MeshStandardMaterial({
    map: textures.timetableBoard,
    roughness: 0.38,
    metalness: 0.05,
  });
  // Living room interior wall board (shifted slightly west to clear the Avatar Gallery)
  const indoorBoardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.08, 0.08), darkTimberMat);
  indoorBoardFrame.position.set(1.4, 2.05, -4.78);
  const indoorBoardFace = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 0.94), homeTransitMat);
  indoorBoardFace.position.set(1.4, 2.05, -4.73);
  group.add(indoorBoardFrame, indoorBoardFace);

  // Front porch standing wooden transit map board
  const porchPostL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), darkTimberMat);
  porchPostL.position.set(-3.95, 0.95, 6.25);
  const porchPostR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), darkTimberMat);
  porchPostR.position.set(-2.35, 0.95, 6.25);
  const porchBoardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.08, 0.09), darkTimberMat);
  porchBoardFrame.position.set(-3.15, 1.55, 6.25);
  const porchBoardFace = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.94), homeTransitMat);
  porchBoardFace.position.set(-3.15, 1.55, 6.31);
  group.add(porchPostL, porchPostR, porchBoardFrame, porchBoardFace);

  // =========================================================================
  // 6. INTERACTABLES INSIDE EN ILLAM
  // =========================================================================
  interactables.push(
    {
      id: 'home_transit_board_indoor',
      kind: 'transit_board',
      label: 'View Home Bus & Train Departure Map',
      sublabel: 'என் இல்லம் · All Stations & Live Timings',
      x: hx + 1.4,
      y: 0.45,
      z: hz - 3.9,
      radius: 1.9,
      locationId: 'my_home',
    },
    {
      id: 'home_transit_board_porch',
      kind: 'transit_board',
      label: 'View Bus & Train Departure Map',
      sublabel: 'என் இல்லம் · Bus & Train Route Map',
      x: hx - 3.15,
      y: 0.25,
      z: hz + 6.9,
      radius: 3.1,
      locationId: 'my_home',
    },
    {
      id: 'home_sofa_sit',
      kind: 'bench',
      label: 'Rest on Living Room Sofa',
      sublabel: 'என் இல்லம் · Relax indoors',
      x: hx - 4.7,
      y: 0.45,
      z: hz + 1.9,
      facingAngle: Math.PI * 0.5,
      radius: 2.3,
      locationId: 'my_home',
    },
    {
      id: 'home_kitchen_cook',
      kind: 'home_kitchen',
      label: 'Brew Filter Kaapi & Meal',
      sublabel: 'சமையலறை · Warm home kitchen',
      x: hx + 0.3,
      y: 0.45,
      z: hz - 3.6,
      radius: 2.5,
      locationId: 'my_home',
    },
    {
      id: 'home_decor_panel',
      kind: 'home_decor',
      label: 'Customize Home & Outfits',
      sublabel: 'என் இல்லம் · Theme, lights & wardrobe',
      x: hx - 3.2,
      y: 0.45,
      z: hz - 3.9,
      radius: 2.4,
      locationId: 'my_home',
    },
    {
      id: 'home_bed_sleep',
      kind: 'home_bed',
      label: 'Rest in Bedroom (Advance to Sunrise)',
      sublabel: 'படுக்கையறை · Sleep until 06:30',
      x: hx - 3.2,
      y: 3.65,
      z: hz - 2.2,
      radius: 2.8,
      locationId: 'my_home',
    },
    {
      id: 'home_wardrobe_outfit',
      kind: 'home_wardrobe',
      label: 'Open Wardrobe & Home Menu',
      sublabel: 'அலமாரி · Change jacket & style',
      x: hx - 4.4,
      y: 3.65,
      z: hz + 2.2,
      radius: 2.6,
      locationId: 'my_home',
    },
    {
      id: 'home_frosty_igloo',
      kind: 'frosty_igloo',
      label: "Rest Frosty in Igloo Corner",
      sublabel: 'ஃபிராஸ்டி இக்லூ · Blue cushion & snowflake lamp',
      x: hx + 4.15,
      y: 0.45,
      z: hz + 3.7,
      radius: 1.75,
      locationId: 'my_home',
    },
    {
      id: 'home_balcony_seat',
      kind: 'bench',
      label: 'Sit on Sunset Balcony',
      sublabel: 'மாடம் · Overlook the valley',
      x: hx - 2.5,
      y: 3.65,
      z: hz + 6.3,
      facingAngle: 0,
      radius: 2.6,
      locationId: 'my_home',
    },
    {
      id: 'home_helipad_launch',
      kind: 'sky_explorer_fly',
      label: 'Launch SSJ Sky Explorer (Home Helipad)',
      sublabel: 'என் இல்லம் ஹெலிபேட் · Fly from Rooftop Helipad',
      x: hx + 6.4,
      y: 0.25,
      z: hz + 8.0,
      radius: 3.1,
      locationId: 'my_home',
      metaId: 'home',
    },
    {
      id: 'home_balcony_helipad_launch',
      kind: 'sky_explorer_fly',
      label: 'Board SSJ Sky Explorer (Rooftop Helipad)',
      sublabel: 'என் இல்லம் ஹெலிபேட் · Launch straight off My Home roof',
      x: hx + 2.8,
      y: 3.65,
      z: hz + 6.2,
      radius: 3.2,
      locationId: 'my_home',
      metaId: 'home',
    },
    {
      id: 'home_rooftop_helipad_launch',
      kind: 'sky_explorer_fly',
      label: 'Fly SSJ Sky Explorer from Rooftop Helipad',
      sublabel: 'என் இல்லம் கூரை ஹெலிபேட் · Take off directly from Pad A',
      x: hx,
      y: 10.4,
      z: hz,
      radius: 5.5,
      locationId: 'my_home',
      metaId: 'home',
    },
    {
      id: 'home_external_terrace_lever',
      kind: 'terrace_aircraft_lever',
      label: 'External Terrace Aircraft Lever — Launch Any of 3 Aircraft',
      sublabel: 'Pad B VTOL · Pad A Sky Explorer · Pad C Orange Rescue Helicopter',
      x: hx + 5.0,
      y: 10.4,
      z: hz - 3.0,
      radius: 4.0,
      locationId: 'my_home',
    },
    {
      id: 'home_hero_hall_switch',
      kind: 'home_hero_hall',
      label: 'Switch Hero Character & Suit Variations (3rd Floor Hall)',
      sublabel: 'என் இல்லம் ஹீரோ தளம் · Open Hero & Suit Switcher Console',
      x: hx,
      y: 7.0,
      z: hz - 1.2,
      radius: 4.5,
      locationId: 'my_home',
    },
    {
      id: 'home_hero_hall_ground_shortcut',
      kind: 'home_hero_hall',
      label: 'Open Hero Character & Suit Switcher',
      sublabel: '3rd Floor Hero Hall upstairs · Quick Switch Console',
      x: hx + 2.8,
      y: 0.45,
      z: hz - 3.6,
      radius: 2.4,
      locationId: 'my_home',
    },
    {
      id: 'home_secret_vault_switch',
      kind: 'home_vault_toggle',
      label: 'Press Hidden Underground Floor Button',
      sublabel: 'Secret Switch · Opens Hidden Superhero Vault & Car Garage Below',
      x: hx + VAULT_SWITCH_LOCAL.x,
      y: 0.45,
      z: hz + VAULT_SWITCH_LOCAL.z,
      radius: 2.35,
      locationId: 'my_home',
    },
    {
      id: 'home_secret_vault_hatch_enter',
      kind: 'home_vault_enter',
      label: 'Go Down into Secret Underground Superhero Vault & Garage',
      sublabel: 'All 7 Superhero Costumes Ready to Wear + Rideable Cars Below',
      x: hx + VAULT_HATCH_LOCAL.x,
      y: 0.45,
      z: hz + VAULT_HATCH_LOCAL.z,
      radius: 2.2,
      locationId: 'my_home',
    }
  );

  let appliedStyle: HomeDecorStyle = 'warm_wood';

  const applyHomeState = (
    home: HomeState,
    lanternStrength: number,
    time: number,
    vaultHatchOpenProgress = 0
  ) => {
    if (home.decorStyle !== appliedStyle) {
      appliedStyle = home.decorStyle;
      const p = DECOR_PALETTES[appliedStyle];
      interiorWallMat.color.setHex(p.wall);
      rugMat.color.setHex(p.rug);
      sofaMat.color.setHex(p.sofa);
      bedQuiltMat.color.setHex(p.bedQuilt);
      accentMat.color.setHex(p.accent);
    }

    fairyLightsGroup.visible = home.fairyLightsOn;
    const pulse = 0.88 + Math.sin(time * 2.2) * 0.12;
    const glow = Math.max(0.35, lanternStrength);
    warmLampMat.emissiveIntensity = 0.45 + glow * 1.1;
    snowflakeLampMat.emissiveIntensity = (0.85 + glow * 1.35) * pulse;
    snowflakeHead.rotation.y = time * 0.45;
    fairyBulbMat.emissiveIntensity = home.fairyLightsOn ? (0.8 + glow * 1.35) * pulse : 0;
    homeWarmLight.intensity = (1.35 + glow * 1.65) * (home.fairyLightsOn ? 1.15 : 0.9);

    // Animate hidden floor hatch AND Interior Secret Wall Door sliding smoothly when triggered!
    const openT = Math.max(0, Math.min(1, vaultHatchOpenProgress));
    const slideOffset = openT * 1.05;
    hatchLeafLeft.position.x = -0.59 - slideOffset;
    hatchLeafRight.position.x = 0.59 + slideOffset;
    hatchGlowBorder.visible = openT > 0.04;
    hatchStepsGroup.visible = openT > 0.12;
    secretBtnMat.color.setHex(openT > 0.1 ? 0x10b981 : 0x38bdf8);
    secretBtnMat.emissive.setHex(openT > 0.1 ? 0x10b981 : 0x38bdf8);
    secretBtnMat.emissiveIntensity = (1.2 + Math.sin(time * 3.8) * 0.45) * (openT > 0.1 ? 1.3 : 1.0);
    secretShaftGlowMat.emissiveIntensity = (1.3 + Math.sin(time * 3.0) * 0.35) * openT;

    // Slide the Interior Secret Wall Door open into the wall pocket & unlock its collider!
    interiorSecretDoor.position.z = -2.1 - openT * 2.28;
    interiorSecretTrimMat.color.setHex(openT > 0.15 ? 0x22d3ee : 0x334155);
    interiorSecretTrimMat.emissive.setHex(openT > 0.15 ? 0x06b6d4 : 0x0f172a);
    interiorSecretTrimMat.emissiveIntensity = openT > 0.1 ? 1.2 + Math.sin(time * 3.4) * 0.3 : 0.1;
    if (openT >= 0.45) {
      interiorSecretDoorCollider.minY = -99;
      interiorSecretDoorCollider.maxY = -98;
      exteriorSecretDoorCollider.minY = -99;
      exteriorSecretDoorCollider.maxY = -98;
    } else {
      interiorSecretDoorCollider.minY = 0;
      interiorSecretDoorCollider.maxY = 2.6;
      exteriorSecretDoorCollider.minY = 0;
      exteriorSecretDoorCollider.maxY = 5.0;
    }

    for (let i = 0; i < avatarStands.length; i++) {
      const stand = avatarStands[i];
      stand.setActive(stand.outfitId === home.outfit);
      stand.update(time, lanternStrength);
    }
  };

  const updatePostcardDisplay = (dataUrl?: string) => {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 160;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 256, 160);
      const nextTex = new THREE.CanvasTexture(c);
      nextTex.colorSpace = THREE.SRGBColorSpace;
      const prev = postcardMat.map;
      postcardMat.map = nextTex;
      postcardMat.needsUpdate = true;
      prev?.dispose();
    };
    img.src = dataUrl;
  };

  return {
    group,
    colliders,
    interactables,
    frostyIglooSeat,
    applyHomeState,
    updatePostcardDisplay,
    dispose: () => {
      avatarStands.forEach((s) => s.dispose());
      galleryBannerTex.dispose();
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
