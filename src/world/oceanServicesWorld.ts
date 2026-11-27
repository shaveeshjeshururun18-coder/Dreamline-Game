import * as THREE from 'three';
import type { HeroCharacterId } from '../game/heroCharacters';
import type { InteractableItem } from '../game/types';
import {
  OCEAN_HERO_CONSOLE_POS,
  OCEAN_HERO_SUIT_PODS,
  OCEAN_HERO_TOWER_CENTER,
  OCEAN_HERO_TOWER_DECK_Y,
  OCEAN_HERO_TOWER_PIER_BOUNDS,
  OCEAN_HERO_TOWER_RADIUS,
  SNOWMAN_ISLAND_CENTER,
  SNOWMAN_ISLAND_DOCK_POS,
  SNOWMAN_ISLAND_PIER_BOUNDS,
  SNOWMAN_ISLAND_RADIUS,
  SUBMARINE_EXIT_POS,
  SUBMARINE_PIER_BOUNDS,
  getOceanHeroTowerColliders,
  getSnowmanIslandColliders,
  type OceanCollider,
  type SnowmanRescueState,
  type SubmarineState,
} from '../game/oceanWorldSystems';
import { WATER_LEVEL, groundHeightAt } from '../game/terrain';
import { createHeroCharacterRig, type HeroRig3D } from './heroCharacters3D';

export interface OceanServicesWorld3D {
  rootGroup: THREE.Group;
  submarineGroup: THREE.Group;
  oceanHeroTowerGroup: THREE.Group;
  snowmanIslandGroup: THREE.Group;
  snowmanJetSkiGroup: THREE.Group;
  colliders: OceanCollider[];
  interactables: InteractableItem[];
  update: (params: {
    elapsed: number;
    dt: number;
    nightFactor: number;
    submarine: SubmarineState;
    rescue: SnowmanRescueState;
    activeHeroId: HeroCharacterId | null;
    playerX: number;
    playerZ: number;
  }) => void;
  dispose: () => void;
}

function makeCanvasSign(
  title: string,
  subtitle: string,
  accentHex: string,
  bgHex = '#0b172a',
  w = 512,
  h = 128
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, h * 0.47);
  ctx.fillStyle = accentHex;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(subtitle, w / 2, h * 0.8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildCompositeSnowman(scale = 1, hasLifeRing = false): THREE.Group {
  const g = new THREE.Group();
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72, metalness: 0.04 });
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.55 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.2 });
  const twigMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });

  // 3 stacked snow spheres (grounded bottom-center)
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 12), snowMat);
  base.position.y = 0.56;
  const mid = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), snowMat);
  mid.position.y = 1.38;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), snowMat);
  head.position.y = 2.02;
  g.add(base, mid, head);

  // Scarf + trailing tail
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.08, 8, 16), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.74;
  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.07), scarfMat);
  scarfTail.position.set(0.24, 1.52, 0.22);
  scarfTail.rotation.z = -0.22;
  g.add(scarf, scarfTail);

  // Coal buttons & eyes + carrot nose
  for (const by of [1.2, 1.42, 1.6]) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), coalMat);
    btn.position.set(0, by, 0.44);
    g.add(btn);
  }
  for (const ex of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 6, 6), coalMat);
    eye.position.set(ex, 2.09, 0.28);
    g.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 8), carrotMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 2.01, 0.42);
  g.add(nose);

  // Top hat with crimson ribbon
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 14), hatMat);
  brim.position.y = 2.3;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.36, 14), hatMat);
  crown.position.y = 2.5;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.08, 14), scarfMat);
  band.position.y = 2.36;
  g.add(brim, crown, band);

  // Twig arms
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.68, 6), twigMat);
    arm.position.set(sx * 0.6, 1.45, 0.12);
    arm.rotation.z = sx * 0.95;
    arm.rotation.x = 0.28;
    g.add(arm);
  }

  // Optional Rescue Life-Buoy strapped on back for the Rescue Snowman
  if (hasLifeRing) {
    const buoy = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.085, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, emissive: 0xea580c, emissiveIntensity: 0.3 })
    );
    buoy.position.set(0, 1.38, -0.42);
    g.add(buoy);
  }

  g.scale.setScalar(scale);
  return g;
}

export function buildOceanServicesWorld3D(isSoftwareGl = false): OceanServicesWorld3D {
  const rootGroup = new THREE.Group();
  const submarineGroup = new THREE.Group();
  const oceanHeroTowerGroup = new THREE.Group();
  const snowmanIslandGroup = new THREE.Group();
  const snowmanJetSkiGroup = new THREE.Group();

  const disposables: Array<{ dispose: () => void }> = [];
  const interactables: InteractableItem[] = [];
  const colliders: OceanCollider[] = [
    ...getOceanHeroTowerColliders(),
    ...getSnowmanIslandColliders(),
  ];

  // Shared materials
  const woodPierMat = new THREE.MeshStandardMaterial({ color: 0x785233, roughness: 0.84, metalness: 0.05 });
  const darkPilingMat = new THREE.MeshStandardMaterial({ color: 0x47301e, roughness: 0.9 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.32, metalness: 0.78 });
  const titaniumMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.82 });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.7,
    roughness: 0.2,
  });
  const amberGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const glassDomeMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.25,
    transparent: true,
    opacity: 0.34,
  });
  disposables.push(woodPierMat, darkPilingMat, steelMat, titaniumMat, cyanGlowMat, amberGlowMat, glassDomeMat);

  // =========================================================================
  // 1. KADALKARAI SUBMARINE SERVICE PIER & COMPOSITE 3D SUBMARINE
  // =========================================================================
  const subPierGroup = new THREE.Group();
  const pierLen = SUBMARINE_PIER_BOUNDS.maxX - SUBMARINE_PIER_BOUNDS.minX;
  const pierWid = SUBMARINE_PIER_BOUNDS.maxZ - SUBMARINE_PIER_BOUNDS.minZ;
  const pierMidX = (SUBMARINE_PIER_BOUNDS.minX + SUBMARINE_PIER_BOUNDS.maxX) * 0.5;
  const pierMidZ = (SUBMARINE_PIER_BOUNDS.minZ + SUBMARINE_PIER_BOUNDS.maxZ) * 0.5;

  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(pierLen, 0.24, pierWid), woodPierMat);
  pierDeck.position.set(pierMidX, SUBMARINE_PIER_BOUNDS.deckY - 0.12, pierMidZ);
  pierDeck.receiveShadow = true;
  subPierGroup.add(pierDeck);

  for (let px = SUBMARINE_PIER_BOUNDS.minX + 1.2; px <= SUBMARINE_PIER_BOUNDS.maxX - 0.8; px += 4.2) {
    for (const pz of [SUBMARINE_PIER_BOUNDS.minZ + 0.35, SUBMARINE_PIER_BOUNDS.maxZ - 0.35]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 3.4, 8), darkPilingMat);
      piling.position.set(px, SUBMARINE_PIER_BOUNDS.deckY - 1.5, pz);
      subPierGroup.add(piling);
    }
  }

  // Submarine Service Illuminated Sign Arch at Pier Entrance
  for (const sz of [SUBMARINE_PIER_BOUNDS.minZ + 0.2, SUBMARINE_PIER_BOUNDS.maxZ - 0.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 8), steelMat);
    post.position.set(SUBMARINE_PIER_BOUNDS.minX + 2.2, SUBMARINE_PIER_BOUNDS.deckY + 1.8, sz);
    subPierGroup.add(post);
  }
  const subSignTex = makeCanvasSign('SUBMARINE SERVICE', 'DEEP-SEA EXPLORATION · BOARD [E]', '#facc15', '#082f49');
  disposables.push(subSignTex);
  const subSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.25),
    new THREE.MeshBasicMaterial({ map: subSignTex, side: THREE.DoubleSide })
  );
  subSign.position.set(SUBMARINE_PIER_BOUNDS.minX + 2.2, SUBMARINE_PIER_BOUNDS.deckY + 3.45, pierMidZ);
  subSign.rotation.y = -Math.PI / 2;
  subPierGroup.add(subSign);
  rootGroup.add(subPierGroup);

  // Composite 10-Part 3D Research & Passenger Submarine
  const subYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.28, metalness: 0.45 });
  const subNavyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.26, metalness: 0.85 });
  disposables.push(subYellowMat, subNavyMat, brassMat);

  // Main streamlined pressure hull (aligned along +Z forward)
  const mainHull = new THREE.Mesh(new THREE.CapsuleGeometry(1.48, 5.4, 10, 18), subYellowMat);
  mainHull.rotation.x = Math.PI / 2;
  mainHull.position.y = 0.2;
  mainHull.castShadow = !isSoftwareGl;
  submarineGroup.add(mainHull);

  // Dark keel stripe & side ballast tanks
  const keelStrip = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 5.6), subNavyMat);
  keelStrip.position.set(0, -0.78, 0);
  submarineGroup.add(keelStrip);
  for (const sx of [-1.35, 1.35]) {
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 4.2, 6, 10), subNavyMat);
    tank.rotation.x = Math.PI / 2;
    tank.position.set(sx, -0.25, -0.1);
    const porthole = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 12), cyanGlowMat);
    porthole.rotation.z = Math.PI / 2;
    porthole.position.set(sx * 1.12, 0.42, 1.1);
    submarineGroup.add(tank, porthole);
  }

  // Panoramic Bow Observation Glass Dome + Glowing Interior
  const bowDome = new THREE.Mesh(new THREE.SphereGeometry(1.18, 16, 12), glassDomeMat);
  bowDome.position.set(0, 0.25, 3.45);
  const bowRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 8, 18), steelMat);
  bowRing.position.set(0, 0.25, 3.05);
  submarineGroup.add(bowDome, bowRing);

  // Conning Tower Sail + Bridge Window + Brass Periscope Mast
  const sail = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.85, 2.5), subYellowMat);
  sail.position.set(0, 2.05, 0.45);
  const sailTrim = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.32, 2.56), subNavyMat);
  sailTrim.position.set(0, 2.86, 0.45);
  const sailGlass = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.48, 0.15), cyanGlowMat);
  sailGlass.position.set(0, 2.38, 1.72);
  const periscopeMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.45, 8), brassMat);
  periscopeMast.position.set(0, 3.65, 0.65);
  const periscopeHead = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.42), brassMat);
  periscopeHead.position.set(0, 4.35, 0.8);
  submarineGroup.add(sail, sailTrim, sailGlass, periscopeMast, periscopeHead);

  // Forward Hydroplanes & Tail Cruciform Rudders
  const divePlanes = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.85), subNavyMat);
  divePlanes.position.set(0, 0.2, 1.85);
  const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.5, 1.1), subNavyMat);
  tailV.position.set(0, 0.2, -3.65);
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.9), subNavyMat);
  tailH.position.set(0, 0.2, -3.65);
  submarineGroup.add(divePlanes, tailV, tailH);

  // Spinning 4-Blade Brass Propeller
  const propellerGroup = new THREE.Group();
  propellerGroup.position.set(0, 0.2, -4.35);
  const propHub = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 10), brassMat);
  propHub.rotation.x = -Math.PI / 2;
  propellerGroup.add(propHub);
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.06), brassMat);
    blade.rotation.z = (b * Math.PI) / 2;
    propellerGroup.add(blade);
  }
  submarineGroup.add(propellerGroup);

  // Bow Volumetric Searchlight Cone (illuminates underwater depths!)
  const searchlightCone = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 15.0, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  searchlightCone.rotation.x = -Math.PI / 2;
  searchlightCone.position.set(0, 0.2, 11.4);
  submarineGroup.add(searchlightCone);

  // Animated Underwater Bubble Trail Spheres
  const subBubbles: THREE.Mesh[] = [];
  const bubbleGeo = new THREE.SphereGeometry(0.16, 6, 6);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65 });
  disposables.push(bubbleGeo, bubbleMat);
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(bubbleGeo, bubbleMat);
    b.position.set((i % 2 === 0 ? -0.5 : 0.5) * 0.7, 0.2, -4.8 - i * 0.9);
    submarineGroup.add(b);
    subBubbles.push(b);
  }

  rootGroup.add(submarineGroup);

  interactables.push({
    id: 'kadalkarai_submarine_board',
    kind: 'submarine_board',
    label: 'Board Kadalkarai Submarine Service',
    sublabel: 'Cruise Ocean & Dive Underwater ([Space]/[Ctrl] Depth · [F] Exit)',
    x: SUBMARINE_EXIT_POS.x + 1.8,
    y: SUBMARINE_PIER_BOUNDS.deckY,
    z: SUBMARINE_EXIT_POS.z,
    radius: 5.5,
    locationId: 'submarine_dock',
  });

  // =========================================================================
  // 2. OCEAN SUPERHERO SUITS BUILDING (OFFSHORE MARINE HERO TOWER)
  // =========================================================================
  const ox = OCEAN_HERO_TOWER_CENTER.x;
  const oz = OCEAN_HERO_TOWER_CENTER.z;
  const oy = OCEAN_HERO_TOWER_DECK_Y;

  // Engineered Octagonal Seawall Foundation & Deck
  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(OCEAN_HERO_TOWER_RADIUS, OCEAN_HERO_TOWER_RADIUS + 1.8, 3.6, 16),
    steelMat
  );
  foundation.position.set(ox, oy - 1.8, oz);
  foundation.receiveShadow = true;
  oceanHeroTowerGroup.add(foundation);

  const deckSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(OCEAN_HERO_TOWER_RADIUS - 0.35, OCEAN_HERO_TOWER_RADIUS - 0.35, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.45 })
  );
  deckSurface.position.set(ox, oy - 0.08, oz);
  deckSurface.receiveShadow = true;
  oceanHeroTowerGroup.add(deckSurface);

  // Glowing Perimeter Safety Ring
  const deckRing = new THREE.Mesh(
    new THREE.TorusGeometry(OCEAN_HERO_TOWER_RADIUS - 0.65, 0.14, 8, 36),
    cyanGlowMat
  );
  deckRing.rotation.x = Math.PI / 2;
  deckRing.position.set(ox, oy + 0.08, oz);
  oceanHeroTowerGroup.add(deckRing);

  // West Ocean Boat & Submarine Landing Pier connecting to the Hero Tower
  const hpLen = OCEAN_HERO_TOWER_PIER_BOUNDS.maxX - OCEAN_HERO_TOWER_PIER_BOUNDS.minX;
  const hpWid = OCEAN_HERO_TOWER_PIER_BOUNDS.maxZ - OCEAN_HERO_TOWER_PIER_BOUNDS.minZ;
  const hpMidX = (OCEAN_HERO_TOWER_PIER_BOUNDS.minX + OCEAN_HERO_TOWER_PIER_BOUNDS.maxX) * 0.5;
  const hpDeck = new THREE.Mesh(new THREE.BoxGeometry(hpLen, 0.24, hpWid), woodPierMat);
  hpDeck.position.set(hpMidX, OCEAN_HERO_TOWER_PIER_BOUNDS.deckY - 0.12, oz);
  oceanHeroTowerGroup.add(hpDeck);

  // Soaring Titanium-and-Glass Curved Pavilion Superstructure (15m tall iconic ocean landmark!)
  const pillarOffsets: Array<[number, number]> = [
    [11.4, -9.2],
    [11.4, 9.2],
    [-9.2, -10.2],
    [-9.2, 10.2],
  ];
  for (const [px, pz] of pillarOffsets) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 13.5, 12), titaniumMat);
    col.position.set(ox + px, oy + 6.75, oz + pz);
    col.castShadow = !isSoftwareGl;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 12.2, 0.28), cyanGlowMat);
    strip.position.set(ox + px * 0.92, oy + 6.75, oz + pz * 0.92);
    oceanHeroTowerGroup.add(col, strip);
  }

  // Sweeping Architectural Upper Canopy Ring & Glass Atrium Dome
  const upperRing = new THREE.Mesh(new THREE.TorusGeometry(13.8, 0.72, 10, 32), titaniumMat);
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.set(ox, oy + 13.4, oz);
  const crownGlow = new THREE.Mesh(new THREE.TorusGeometry(13.8, 0.22, 8, 32), cyanGlowMat);
  crownGlow.rotation.x = Math.PI / 2;
  crownGlow.position.set(ox, oy + 14.1, oz);
  const atriumDome = new THREE.Mesh(
    new THREE.SphereGeometry(13.4, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    glassDomeMat
  );
  atriumDome.position.set(ox, oy + 12.6, oz);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.55, 7.5, 10), titaniumMat);
  spire.position.set(ox, oy + 20.6, oz);
  const spireBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), cyanGlowMat);
  spireBeacon.position.set(ox, oy + 24.6, oz);
  oceanHeroTowerGroup.add(upperRing, crownGlow, atriumDome, spire, spireBeacon);

  // Giant Illuminated Ocean Sign facing West (toward Kadalkarai Coast & Submarine approach!)
  const towerSignTex = makeCanvasSign(
    'OCEAN SUPERHERO SUITS TOWER',
    'ALL 7 HERO SUITS READY TO WEAR OUT AT SEA',
    '#38bdf8',
    '#0f172a',
    768,
    144
  );
  disposables.push(towerSignTex);
  const towerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 2.2),
    new THREE.MeshBasicMaterial({ map: towerSignTex, side: THREE.DoubleSide })
  );
  towerSign.position.set(ox - 13.8, oy + 11.4, oz);
  towerSign.rotation.y = -Math.PI / 2;
  oceanHeroTowerGroup.add(towerSign);

  // All 7 3D Superhero Suits Displayed Inside the Ocean Hero Building!
  const oceanPodRigs: Array<{
    heroId: HeroCharacterId;
    rig: HeroRig3D;
    turntable: THREE.Group;
    ringMat: THREE.MeshStandardMaterial;
  }> = [];

  for (const pod of OCEAN_HERO_SUIT_PODS) {
    const podGroup = new THREE.Group();
    podGroup.position.set(pod.x, pod.y, pod.z);
    // Face inward toward the center of the pavilion
    podGroup.rotation.y = Math.atan2(ox - pod.x, oz - pod.z);

    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.52, 0.34, 16), steelMat);
    ped.position.y = 0.17;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.48, 0.28, 16), titaniumMat);
    cap.position.y = 4.55;
    const ringMat = new THREE.MeshStandardMaterial({
      color: pod.accentHex,
      emissive: pod.accentHex,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    disposables.push(ringMat);
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.065, 8, 22), ringMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.36;

    const glassCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.36, 1.36, 4.0, 14, 1, true, Math.PI * 0.28, Math.PI * 1.44),
      glassDomeMat
    );
    glassCyl.position.y = 2.4;

    const turntable = new THREE.Group();
    turntable.position.y = 0.36;
    const heroRig = createHeroCharacterRig(isSoftwareGl);
    heroRig.setHero(pod.heroId);
    turntable.add(heroRig.group);

    podGroup.add(ped, cap, baseRing, glassCyl, turntable);
    oceanHeroTowerGroup.add(podGroup);

    oceanPodRigs.push({ heroId: pod.heroId, rig: heroRig, turntable, ringMat });

    interactables.push({
      id: `ocean_hero_pod_${pod.heroId}`,
      kind: 'vault_hero_pod',
      label: `Wear ${pod.name} Suit`,
      sublabel: `Ocean Superhero Suits Building · ${pod.alias}`,
      x: pod.x + (ox - pod.x) * 0.22,
      y: pod.y,
      z: pod.z + (oz - pod.z) * 0.22,
      radius: 2.9,
      locationId: 'ocean_hero_tower',
      metaId: pod.heroId,
    });
  }

  // Central Ocean Suit Variations Console
  const oceanConsoleBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.38, 1.15, 14), steelMat);
  oceanConsoleBase.position.set(OCEAN_HERO_CONSOLE_POS.x, oy + 0.58, OCEAN_HERO_CONSOLE_POS.z);
  const oceanConsoleTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.14), cyanGlowMat);
  oceanConsoleTop.position.set(OCEAN_HERO_CONSOLE_POS.x, oy + 1.55, OCEAN_HERO_CONSOLE_POS.z);
  oceanConsoleTop.rotation.y = -Math.PI / 2;
  oceanConsoleTop.rotation.x = -0.22;
  oceanHeroTowerGroup.add(oceanConsoleBase, oceanConsoleTop);

  interactables.push({
    id: 'ocean_hero_console',
    kind: 'ocean_hero_console',
    label: 'Open Ocean Superhero Suits Armory',
    sublabel: 'Ocean Hero Tower · Choose Any Superhero Suit or Skin Variation',
    x: OCEAN_HERO_CONSOLE_POS.x,
    y: oy,
    z: OCEAN_HERO_CONSOLE_POS.z,
    radius: 3.4,
    locationId: 'ocean_hero_tower',
  });

  rootGroup.add(oceanHeroTowerGroup);

  // =========================================================================
  // 3. NEW SNOWMAN ISLAND (SNOWY OCEAN SANCTUARY FOR RESCUED SWIMMERS!)
  // =========================================================================
  const sx = SNOWMAN_ISLAND_CENTER.x;
  const sz = SNOWMAN_ISLAND_CENTER.z;
  const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.78, metalness: 0.04 });
  const iceRimMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.28, metalness: 0.18 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x1e4d3b, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const redBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.45,
  });
  disposables.push(snowCapMat, iceRimMat, pineMat, trunkMat, redBeaconMat);

  // Sparkling Snow & Ice Cap covering Snowman Island cleanly above the contoured ocean island hill
  const islandSnowDisc = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    snowCapMat
  );
  islandSnowDisc.scale.set(SNOWMAN_ISLAND_RADIUS - 0.3, 1.65, SNOWMAN_ISLAND_RADIUS - 0.3);
  islandSnowDisc.position.set(sx, 0.14, sz);
  islandSnowDisc.receiveShadow = true;
  const iceCoastRing = new THREE.Mesh(
    new THREE.TorusGeometry(SNOWMAN_ISLAND_RADIUS - 0.5, 0.55, 8, 32),
    iceRimMat
  );
  iceCoastRing.rotation.x = Math.PI / 2;
  iceCoastRing.position.set(sx, 0.08, sz);
  snowmanIslandGroup.add(islandSnowDisc, iceCoastRing);

  // Welcome Arch & Snowman Island Jet Ski Rescue Pier
  const spLen = SNOWMAN_ISLAND_PIER_BOUNDS.maxX - SNOWMAN_ISLAND_PIER_BOUNDS.minX;
  const spWid = SNOWMAN_ISLAND_PIER_BOUNDS.maxZ - SNOWMAN_ISLAND_PIER_BOUNDS.minZ;
  const spMidX = (SNOWMAN_ISLAND_PIER_BOUNDS.minX + SNOWMAN_ISLAND_PIER_BOUNDS.maxX) * 0.5;
  const spDeck = new THREE.Mesh(new THREE.BoxGeometry(spLen, 0.22, spWid), woodPierMat);
  spDeck.position.set(spMidX, SNOWMAN_ISLAND_PIER_BOUNDS.deckY - 0.11, sz);
  snowmanIslandGroup.add(spDeck);

  const islandSignTex = makeCanvasSign('SNOWMAN ISLAND', 'OCEAN JET SKI RESCUE SANCTUARY', '#7dd3fc', '#0f2942');
  disposables.push(islandSignTex);
  const islandSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.35),
    new THREE.MeshBasicMaterial({ map: islandSignTex, side: THREE.DoubleSide })
  );
  islandSign.position.set(SNOWMAN_ISLAND_PIER_BOUNDS.maxX + 1.2, 3.6, sz);
  islandSign.rotation.y = -Math.PI / 2;
  for (const lz of [-2.4, 2.4]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.8, 8), darkPilingMat);
    p.position.set(SNOWMAN_ISLAND_PIER_BOUNDS.maxX + 1.2, 1.9, sz + lz);
    snowmanIslandGroup.add(p);
  }
  snowmanIslandGroup.add(islandSign);

  // Snowman Island Red-and-White Striped Lighthouse with Rotating Beacon
  const lhX = sx + 9.5;
  const lhZ = sz - 9.0;
  const lhBaseY = Math.max(0.7, groundHeightAt(lhX, lhZ));
  const lhTower = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.5, 13.5, 16), snowCapMat);
  lhTower.position.set(lhX, lhBaseY + 6.75, lhZ);
  lhTower.castShadow = !isSoftwareGl;
  for (const sy of [3.2, 7.6, 11.4]) {
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(2.05 - sy * 0.04, 2.18 - sy * 0.04, 1.6, 16), redBeaconMat);
    stripe.position.set(lhX, lhBaseY + sy, lhZ);
    snowmanIslandGroup.add(stripe);
  }
  const lhLantern = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.1, 12), amberGlowMat);
  lhLantern.position.set(lhX, lhBaseY + 14.5, lhZ);
  const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 2.2, 14), redBeaconMat);
  lhRoof.position.set(lhX, lhBaseY + 16.6, lhZ);
  const lighthouseBeam = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 22.0, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  lighthouseBeam.rotation.z = Math.PI / 2;
  lighthouseBeam.position.set(11.0, 0, 0);
  const lighthousePivot = new THREE.Group();
  lighthousePivot.position.set(lhX, lhBaseY + 14.5, lhZ);
  lighthousePivot.add(lighthouseBeam);
  snowmanIslandGroup.add(lhTower, lhLantern, lhRoof, lighthousePivot);

  // Two Cozy Sculpted Snowman Igloos with Warm Glowing Interiors
  const iglooSpecs: Array<[number, number, number, number]> = [
    [sx, sz + 9.2, 3.6, Math.PI],
    [sx - 7.5, sz - 9.0, 2.9, 0.35],
  ];
  for (const [ix, iz, ir, iRot] of iglooSpecs) {
    const iy = Math.max(0.75, groundHeightAt(ix, iz));
    const ig = new THREE.Group();
    ig.position.set(ix, iy, iz);
    ig.rotation.y = iRot;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(ir, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), snowCapMat);
    const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(ir * 0.36, ir * 0.4, ir * 0.72, 12), snowCapMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.set(0, ir * 0.32, ir * 0.85);
    const warmDoor = new THREE.Mesh(new THREE.CircleGeometry(ir * 0.31, 12), amberGlowMat);
    warmDoor.position.set(0, ir * 0.32, ir * 1.22);
    ig.add(dome, tunnel, warmDoor);
    snowmanIslandGroup.add(ig);
  }

  // Frosted Pine Trees around Snowman Island
  const pineCoords: Array<[number, number, number]> = [
    [sx - 12, sz + 11, 1.1],
    [sx - 15, sz - 4, 0.95],
    [sx + 13, sz + 7, 1.15],
    [sx + 15, sz - 2, 1.0],
    [sx + 2, sz - 15, 1.2],
    [sx - 4, sz + 17, 0.9],
    [sx + 9, sz + 14, 1.05],
    [sx - 13, sz - 13, 1.0],
  ];
  for (const [tx, tz, sc] of pineCoords) {
    const ty = Math.max(0.7, groundHeightAt(tx, tz));
    const tree = new THREE.Group();
    tree.position.set(tx, ty, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.4, 7), trunkMat);
    trunk.position.y = 0.7;
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.75, 2.8, 9), pineMat);
    cone1.position.y = 2.4;
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.3, 9), pineMat);
    cone2.position.y = 4.0;
    const snowTop = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.4, 9), snowCapMat);
    snowTop.position.y = 5.1;
    tree.add(trunk, cone1, cone2, snowTop);
    tree.scale.setScalar(sc);
    snowmanIslandGroup.add(tree);
  }

  // 4 Cheerful Snowman Villagers Greeting Rescued Explorers!
  const villagerPositions: Array<[number, number, number, number]> = [
    [sx - 8.0, sz + 3.2, 1.15, -Math.PI * 0.35],
    [sx + 4.5, sz + 2.5, 1.45, -Math.PI * 0.55], // Giant Snowman Chief!
    [sx - 1.5, sz - 5.2, 1.0, 0.2],
    [sx + 10.5, sz + 2.0, 1.05, -Math.PI * 0.75],
  ];
  const islandSnowmen: THREE.Group[] = [];
  for (const [vx, vz, sc, rotY] of villagerPositions) {
    const vy = Math.max(0.75, groundHeightAt(vx, vz));
    const sm = buildCompositeSnowman(sc, false);
    sm.position.set(vx, vy, vz);
    sm.rotation.y = rotY;
    snowmanIslandGroup.add(sm);
    islandSnowmen.push(sm);
  }

  rootGroup.add(snowmanIslandGroup);

  interactables.push({
    id: 'snowman_island_return_coast',
    kind: 'snowman_island_return',
    label: 'Ride Snowman Jet Ski Back to Kadalkarai Beach',
    sublabel: 'Snowman Island Rescue Dock · Express Return to Coast',
    x: SNOWMAN_ISLAND_PIER_BOUNDS.minX + 3.5,
    y: SNOWMAN_ISLAND_PIER_BOUNDS.deckY,
    z: sz,
    radius: 5.5,
    locationId: 'snowman_island',
  });

  // =========================================================================
  // 4. ANIMATED 3D SNOWMAN ON JET SKI RESCUE WATERCRAFT
  // =========================================================================
  const jetSkiRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.22, metalness: 0.45 });
  const jetSkiWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.25 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  disposables.push(jetSkiRedMat, jetSkiWhiteMat, seatMat);

  // Sculpted Jet Ski Lower Hull + Red Bow Cowling + Seat + Handlebars + Headlamp
  const skiHull = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.46, 3.35), jetSkiWhiteMat);
  skiHull.position.set(0, 0.22, 0);
  const skiNose = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.35, 6), jetSkiRedMat);
  skiNose.rotation.x = Math.PI / 2;
  skiNose.position.set(0, 0.34, 2.25);
  const skiDeck = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.34, 2.55), jetSkiRedMat);
  skiDeck.position.set(0, 0.56, 0.15);
  const skiSeat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 1.55), seatMat);
  skiSeat.position.set(0, 0.82, -0.32);
  const handlePost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 8), steelMat);
  handlePost.position.set(0, 0.96, 0.92);
  handlePost.rotation.x = -0.32;
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.96, 8), steelMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.24, 0.8);
  const skiHeadlamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), amberGlowMat);
  skiHeadlamp.position.set(0, 0.62, 1.65);

  // Frothy white ocean spray wake behind Jet Ski
  const wakeMesh = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 5.2, 10, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  wakeMesh.rotation.x = Math.PI / 2;
  wakeMesh.position.set(0, 0.12, -3.9);

  // Rescue Snowman Driver holding the Jet Ski handlebars!
  const rescueSnowman = buildCompositeSnowman(0.72, true);
  rescueSnowman.position.set(0, 0.62, 0.22);

  snowmanJetSkiGroup.add(
    skiHull,
    skiNose,
    skiDeck,
    skiSeat,
    handlePost,
    handleBar,
    skiHeadlamp,
    wakeMesh,
    rescueSnowman
  );
  snowmanJetSkiGroup.position.set(SNOWMAN_ISLAND_DOCK_POS.x, WATER_LEVEL + 0.05, SNOWMAN_ISLAND_DOCK_POS.z);
  rootGroup.add(snowmanJetSkiGroup);

  // =========================================================================
  // 5. PER-FRAME UPDATE LOOP (LIGHTWEIGHT & DISTANCE-CULLED)
  // =========================================================================
  const update: OceanServicesWorld3D['update'] = ({
    elapsed,
    dt,
    nightFactor,
    submarine,
    rescue,
    activeHeroId,
    playerX,
    playerZ,
  }) => {
    // 1. Submarine Transform, Propeller, Searchlight & Bubbles
    submarineGroup.position.set(
      submarine.x,
      submarine.y + Math.sin(elapsed * 1.9) * (submarine.submerged ? 0.05 : 0.12),
      submarine.z
    );
    submarineGroup.rotation.order = 'YXZ';
    submarineGroup.rotation.set(submarine.pitch, submarine.heading, 0);
    propellerGroup.rotation.z = submarine.propellerSpin;
    searchlightCone.visible = submarine.searchlightOn && (submarine.submerged || nightFactor > 0.25);

    const showBubbles = submarine.submerged || Math.abs(submarine.speed) > 1.2;
    for (let i = 0; i < subBubbles.length; i++) {
      const b = subBubbles[i];
      b.visible = showBubbles;
      if (showBubbles) {
        const t = ((elapsed * 1.8 + i * 0.25) % 1.6) / 1.6;
        b.position.set(
          Math.sin(elapsed * 4 + i) * 0.45,
          0.15 + t * 2.4,
          -4.6 - t * 3.8
        );
        b.scale.setScalar(0.55 + t * 0.8);
      }
    }

    // 2. Ocean Superhero Suits Building (distance-culled when far inland to stay fast!)
    const distHeroTower = Math.hypot(playerX - ox, playerZ - oz);
    const towerNear = distHeroTower < 210;
    oceanHeroTowerGroup.visible = towerNear;
    if (towerNear) {
      const animateSuits = distHeroTower < 70;
      for (let i = 0; i < oceanPodRigs.length; i++) {
        const p = oceanPodRigs[i];
        p.turntable.rotation.y = Math.sin(elapsed * 0.55 + i * 0.85) * 0.35;
        p.ringMat.emissiveIntensity = activeHeroId === p.heroId ? 2.5 : 1.25;
        if (animateSuits) {
          p.rig.updatePose({
            elapsed: elapsed + i * 0.6,
            speed: 0,
            dt,
            helmetOpen: p.heroId === 'iron_man_classic' && Math.sin(elapsed * 0.45) > 0.55,
          });
        }
      }
    }

    // 3. Snowman Island (distance-culled when far inland; always visible during rescue!)
    const distSnowIsland = Math.hypot(playerX - sx, playerZ - sz);
    const islandVisible = distSnowIsland < 240 || rescue.phase !== 'idle';
    snowmanIslandGroup.visible = islandVisible;
    if (islandVisible) {
      lighthousePivot.rotation.y = elapsed * 0.9;
      for (let i = 0; i < islandSnowmen.length; i++) {
        islandSnowmen[i].position.y =
          Math.max(0.75, groundHeightAt(islandSnowmen[i].position.x, islandSnowmen[i].position.z)) +
          Math.abs(Math.sin(elapsed * 2.2 + i * 1.3)) * 0.08;
      }
    }

    // 4. Snowman Jet Ski Rescue Watercraft
    const bob = Math.sin(elapsed * 4.5) * 0.09;
    snowmanJetSkiGroup.position.set(rescue.jetSkiX, WATER_LEVEL + 0.05 + bob, rescue.jetSkiZ);
    snowmanJetSkiGroup.rotation.y = rescue.jetSkiHeading;
    snowmanJetSkiGroup.rotation.x = rescue.jetSkiSpeed > 4 ? -0.1 : 0;
    wakeMesh.visible = rescue.jetSkiSpeed > 2.5;
    if (wakeMesh.visible) {
      wakeMesh.scale.set(1, 0.85 + Math.sin(elapsed * 18) * 0.2, 1);
    }
  };

  const dispose = () => {
    oceanPodRigs.forEach((p) => p.rig.dispose());
    disposables.forEach((d) => d.dispose());
    rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  };

  return {
    rootGroup,
    submarineGroup,
    oceanHeroTowerGroup,
    snowmanIslandGroup,
    snowmanJetSkiGroup,
    colliders,
    interactables,
    update,
    dispose,
  };
}
