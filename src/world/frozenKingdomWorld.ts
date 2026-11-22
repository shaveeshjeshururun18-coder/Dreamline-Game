import * as THREE from 'three';
import {
  AVS_SNOW_HOUSE_FRONT_PLAZA,
  AVS_SNOW_HOUSE_ROT_Y,
  CAVE_CHAMBERS,
  CAVE_ENTRANCES,
  CAVE_FLOOR_Y,
  CAVE_PASSAGES,
  FROZEN_MIRROR_LAKE_CENTER,
  FROZEN_MIRROR_LAKE_RX,
  FROZEN_MIRROR_LAKE_RZ,
  FROZEN_MIRROR_PIER_POS,
  FROZEN_WATERFALL_POS,
  SNOW_MOUNTAIN_BRIDGE_POS,
  SNOW_OBSERVATION_DECK_POS,
  SNOW_PATH_SEGMENTS,
  SNOW_VILLAGE_CENTER,
  WINTER_SUMMIT_STATION_POS,
  isNearFrozenKingdomClearing,
} from '../game/frozenKingdom';
import { groundHeightAt } from '../game/terrain';
import type { InteractableItem } from '../game/types';

export interface FrozenKingdomWorldSystem {
  surfaceGroup: THREE.Group;
  caveGroup: THREE.Group;
  surfaceInteractables: InteractableItem[];
  caveExitInteractables: InteractableItem[];
  update: (elapsed: number, lanternStrength: number, inCave: boolean) => void;
  dispose: () => void;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the MAJOR WORLD EXPANSION — THE FROZEN KINGDOM:
 * 1. Massive Expanded Snow Surface (snowy forests, frozen mirror lake, frozen waterfall,
 *    snow village cabins, mountain timber bridge, wooden observation lookout deck,
 *    Winter Summit Station with warm waiting room, and 5 glowing mountain cave entrances).
 * 2. Huge 6-Area Interconnected 3D Underground Cave World (Areas A–F) using performant
 *    InstancedMesh crystals, stalactites, stalagmites, glowing underground lakes,
 *    frozen & liquid underground waterfalls, stone walkways, volumetric shafts, and pathway lanterns!
 */
export function buildFrozenKingdomWorld(isSoftwareGl: boolean): FrozenKingdomWorldSystem {
  const surfaceGroup = new THREE.Group();
  const caveGroup = new THREE.Group();
  const surfaceInteractables: InteractableItem[] = [];
  const caveExitInteractables: InteractableItem[] = [];
  const disposables: Array<{ dispose: () => void }> = [];
  const rand = mulberry32(20261120);

  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  // Shared Frozen Kingdom Surface Materials
  const snowMat = track(new THREE.MeshStandardMaterial({ color: 0xebf3fc, roughness: 0.72, metalness: 0.05 }));
  const pineBarkMat = track(new THREE.MeshStandardMaterial({ color: 0x4d3a2f, roughness: 0.9 }));
  const pineLeafMat = track(new THREE.MeshStandardMaterial({ color: 0x26483e, roughness: 0.85 }));
  const timberMat = track(new THREE.MeshStandardMaterial({ color: 0x73523b, roughness: 0.8 }));
  const darkRoofMat = track(new THREE.MeshStandardMaterial({ color: 0x384359, roughness: 0.65 }));
  const iceMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x9ce8ff,
      emissive: new THREE.Color(0x2884b8),
      emissiveIntensity: 0.35,
      roughness: 0.16,
      metalness: 0.25,
      transparent: true,
      opacity: 0.84,
    })
  );
  const warmWinMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffebc2,
      emissive: new THREE.Color(0xffb85c),
      emissiveIntensity: 1.4,
      roughness: 0.25,
    })
  );
  const caveRockMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x2d3548,
      roughness: 0.92,
      metalness: 0.06,
      side: THREE.DoubleSide,
    })
  );

  // =========================================================================
  // 1. MASSIVE EXPANDED SNOW BIOME SURFACE LANDMARKS
  // =========================================================================

  // 1A. Vast Snow-Covered Pine Forest (strictly excluding AVS Snow House, Frozen Mirror Lake & all clear walking pathways!)
  const pinePositions: Array<{ x: number; y: number; z: number; s: number }> = [];
  for (let i = 0; i < 220 && pinePositions.length < (isSoftwareGl ? 68 : 96); i++) {
    const px = -88 - rand() * 192;
    const pz = -88 - rand() * 182;
    if (isNearFrozenKingdomClearing(px, pz)) continue;
    const py = groundHeightAt(px, pz);
    pinePositions.push({ x: px, y: py, z: pz, s: 0.85 + rand() * 0.75 });
  }

  const trunkGeo = track(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 6));
  const foliageLowGeo = track(new THREE.ConeGeometry(2.1, 4.2, 7));
  const foliageTopGeo = track(new THREE.ConeGeometry(1.45, 3.4, 7));
  const snowCapGeo = track(new THREE.ConeGeometry(1.1, 1.8, 7));

  const trunkInst = new THREE.InstancedMesh(trunkGeo, pineBarkMat, pinePositions.length);
  const lowInst = new THREE.InstancedMesh(foliageLowGeo, pineLeafMat, pinePositions.length);
  const topInst = new THREE.InstancedMesh(foliageTopGeo, pineLeafMat, pinePositions.length);
  const capInst = new THREE.InstancedMesh(snowCapGeo, snowMat, pinePositions.length);
  const dummy = new THREE.Object3D();

  pinePositions.forEach((p, idx) => {
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.scale.set(p.s, p.s, p.s);

    dummy.position.set(p.x, p.y + 1.6 * p.s, p.z);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 4.1 * p.s, p.z);
    dummy.updateMatrix();
    lowInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 6.4 * p.s, p.z);
    dummy.updateMatrix();
    topInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 7.45 * p.s, p.z);
    dummy.updateMatrix();
    capInst.setMatrixAt(idx, dummy.matrix);
  });
  [trunkInst, lowInst, topInst, capInst].forEach((inst) => {
    inst.instanceMatrix.needsUpdate = true;
    surfaceGroup.add(inst);
  });

  // 1B. Frozen Mirror Lake (Glacial Reflective Ice Sheet) + Wooden Viewing Pier facing AVS Snow Residence!
  const mirrorLakeY = groundHeightAt(FROZEN_MIRROR_LAKE_CENTER.x, FROZEN_MIRROR_LAKE_CENTER.z) + 0.16;
  const mirrorGeo = track(new THREE.CircleGeometry(1, 32));
  mirrorGeo.rotateX(-Math.PI / 2);
  const mirrorLake = new THREE.Mesh(mirrorGeo, iceMat);
  mirrorLake.scale.set(FROZEN_MIRROR_LAKE_RX, 1, FROZEN_MIRROR_LAKE_RZ);
  mirrorLake.position.set(FROZEN_MIRROR_LAKE_CENTER.x, mirrorLakeY, FROZEN_MIRROR_LAKE_CENTER.z);
  surfaceGroup.add(mirrorLake);

  // Wooden Lakeside Boardwalk Pier extending onto Frozen Mirror Lake straight from AVS Snow Residence!
  const pierGroup = new THREE.Group();
  const pierY = Math.max(mirrorLakeY + 0.25, groundHeightAt(FROZEN_MIRROR_PIER_POS.x, FROZEN_MIRROR_PIER_POS.z) + 0.15);
  pierGroup.position.set(FROZEN_MIRROR_PIER_POS.x, pierY, FROZEN_MIRROR_PIER_POS.z);
  pierGroup.rotation.y = AVS_SNOW_HOUSE_ROT_Y;
  const pierDeck = new THREE.Mesh(track(new THREE.BoxGeometry(4.6, 0.28, 12.5)), timberMat);
  pierGroup.add(pierDeck);
  for (const side of [-2.15, 2.15]) {
    for (const pz of [-5.2, 0, 5.2]) {
      const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.13, 1.45, 7)), timberMat);
      post.position.set(side, 0.55, pz);
      pierGroup.add(post);
      if (pz === 5.2) {
        const lamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.42, 0.34)), warmWinMat);
        lamp.position.set(side, 1.42, pz);
        pierGroup.add(lamp);
      }
    }
    const rail = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 0.12, 10.6)), timberMat);
    rail.position.set(side, 1.05, 0);
    pierGroup.add(rail);
  }
  surfaceGroup.add(pierGroup);

  // 1B2. Clearly Visible Lantern-Lined Stone Flagstone & Timber-Curbed Walking Pathways
  const pathStoneMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x5c6473,
      roughness: 0.84,
      metalness: 0.06,
    })
  );
  const flagstoneGeo = track(new THREE.BoxGeometry(2.75, 0.14, 1.65));
  const curbPostGeo = track(new THREE.CylinderGeometry(0.08, 0.1, 1.9, 6));
  const pathLampGeo = track(new THREE.BoxGeometry(0.34, 0.44, 0.34));

  // Paved Stone Courtyard right in front of AVS Snow Residence steps
  const plazaY = groundHeightAt(AVS_SNOW_HOUSE_FRONT_PLAZA.x, AVS_SNOW_HOUSE_FRONT_PLAZA.z);
  const plazaDisc = new THREE.Mesh(track(new THREE.CylinderGeometry(5.8, 6.2, 0.16, 16)), pathStoneMat);
  plazaDisc.position.set(AVS_SNOW_HOUSE_FRONT_PLAZA.x, plazaY + 0.08, AVS_SNOW_HOUSE_FRONT_PLAZA.z);
  surfaceGroup.add(plazaDisc);

  SNOW_PATH_SEGMENTS.forEach((seg) => {
    const dx = seg.bx - seg.ax;
    const dz = seg.bz - seg.az;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const steps = Math.max(4, Math.floor(len / 2.25));
    const nx = -dz / Math.max(1e-5, len);
    const nz = dx / Math.max(1e-5, len);

    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const sx = seg.ax + dx * f;
      const sz = seg.az + dz * f;
      const sy = groundHeightAt(sx, sz);

      const slab = new THREE.Mesh(flagstoneGeo, pathStoneMat);
      slab.position.set(sx, sy + 0.12, sz);
      slab.rotation.y = angle;
      slab.scale.set(seg.width / 3.2, 1, 1);
      surfaceGroup.add(slab);

      // Warm timber border posts & glowing amber trail lanterns every ~11m so path is unmistakable!
      if (i > 0 && i < steps && i % 5 === 0) {
        const sideSign = i % 10 === 0 ? 1 : -1;
        const lx = sx + nx * (seg.width * 0.56) * sideSign;
        const lz = sz + nz * (seg.width * 0.56) * sideSign;
        const ly = groundHeightAt(lx, lz);
        const post = new THREE.Mesh(curbPostGeo, timberMat);
        post.position.set(lx, ly + 0.95, lz);
        const lamp = new THREE.Mesh(pathLampGeo, warmWinMat);
        lamp.position.set(lx, ly + 2.02, lz);
        surfaceGroup.add(post, lamp);
      }
    }
  });

  // Launch SSJ Tropical Sky Explorer directly from AVS Snow Residence Rooftop Helipad!
  surfaceInteractables.push({
    id: 'avs_helipad_launch',
    kind: 'sky_explorer_fly',
    label: 'Launch SSJ Sky Explorer (AVS Helipad)',
    sublabel: 'பனிமலை இல்லம் ஹெலிபேட் · Fly from AVS Rooftop Helipad',
    x: AVS_SNOW_HOUSE_FRONT_PLAZA.x,
    y: plazaY + 0.4,
    z: AVS_SNOW_HOUSE_FRONT_PLAZA.z,
    radius: 5.5,
    locationId: 'avs_snow_house',
    metaId: 'avs',
  });

  // 1C. Towering Frozen Waterfall Cliff at (-226, -124)
  const wfBaseY = groundHeightAt(FROZEN_WATERFALL_POS.x, FROZEN_WATERFALL_POS.z);
  const wfGroup = new THREE.Group();
  wfGroup.position.set(FROZEN_WATERFALL_POS.x, wfBaseY, FROZEN_WATERFALL_POS.z);
  const wfCliff = new THREE.Mesh(track(new THREE.ConeGeometry(16, 26, 8)), caveRockMat);
  wfCliff.position.set(-6, 11, -3);
  wfGroup.add(wfCliff);
  const wfSnowTop = new THREE.Mesh(track(new THREE.ConeGeometry(11.5, 9, 8)), snowMat);
  wfSnowTop.position.set(-6, 20.5, -3);
  wfGroup.add(wfSnowTop);
  for (let i = -2; i <= 2; i++) {
    const icicle = new THREE.Mesh(track(new THREE.CylinderGeometry(1.0, 1.5, 16 - Math.abs(i) * 1.5, 8)), iceMat);
    icicle.position.set(2.2, 7.5, i * 2.1);
    wfGroup.add(icicle);
  }
  surfaceGroup.add(wfGroup);

  // 1D. Snowy Alpine Village Cabins around SNOW_VILLAGE_CENTER
  const cabinOffsets = [
    { dx: -10, dz: -6, rot: 0.35 },
    { dx: 8, dz: -10, rot: -0.42 },
    { dx: 12, dz: 6, rot: -1.1 },
    { dx: -6, dz: 12, rot: 0.8 },
  ];
  const cabinBodyGeo = track(new THREE.BoxGeometry(6.2, 3.8, 5.2));
  const cabinRoofGeo = track(new THREE.ConeGeometry(4.8, 2.7, 4));
  cabinRoofGeo.rotateY(Math.PI / 4);
  const cabinWinGeo = track(new THREE.BoxGeometry(1.4, 1.2, 0.16));

  cabinOffsets.forEach(({ dx, dz, rot }) => {
    const cx = SNOW_VILLAGE_CENTER.x + dx;
    const cz = SNOW_VILLAGE_CENTER.z + dz;
    const cy = groundHeightAt(cx, cz);
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    cg.rotation.y = rot;
    const body = new THREE.Mesh(cabinBodyGeo, timberMat);
    body.position.y = 1.9;
    const roof = new THREE.Mesh(cabinRoofGeo, snowMat);
    roof.position.y = 5.1;
    const win = new THREE.Mesh(cabinWinGeo, warmWinMat);
    win.position.set(0, 2.0, 2.62);
    const win2 = new THREE.Mesh(cabinWinGeo, warmWinMat);
    win2.position.set(0, 2.0, -2.62);
    cg.add(body, roof, win, win2);
    surfaceGroup.add(cg);
  });

  // 1E. Mountain Timber Bridge & Wooden Observation Lookout Deck
  const bridgeY = groundHeightAt(SNOW_MOUNTAIN_BRIDGE_POS.x, SNOW_MOUNTAIN_BRIDGE_POS.z) + 0.55;
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(SNOW_MOUNTAIN_BRIDGE_POS.x, bridgeY, SNOW_MOUNTAIN_BRIDGE_POS.z);
  bridgeGroup.rotation.y = 0.6;
  const bridgeDeck = new THREE.Mesh(track(new THREE.BoxGeometry(4.2, 0.3, 18.0)), timberMat);
  const railL = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 1.1, 18.0)), timberMat);
  railL.position.set(-2.0, 0.65, 0);
  const railR = railL.clone();
  railR.position.x = 2.0;
  bridgeGroup.add(bridgeDeck, railL, railR);
  surfaceGroup.add(bridgeGroup);

  const deckY = groundHeightAt(SNOW_OBSERVATION_DECK_POS.x, SNOW_OBSERVATION_DECK_POS.z) + 0.6;
  const deckGroup = new THREE.Group();
  deckGroup.position.set(SNOW_OBSERVATION_DECK_POS.x, deckY, SNOW_OBSERVATION_DECK_POS.z);
  const deckFloor = new THREE.Mesh(track(new THREE.CylinderGeometry(5.8, 6.2, 0.45, 8)), timberMat);
  const deckSnowRim = new THREE.Mesh(track(new THREE.TorusGeometry(5.6, 0.24, 6, 16)), snowMat);
  deckSnowRim.rotation.x = Math.PI / 2;
  deckSnowRim.position.y = 1.15;
  deckGroup.add(deckFloor, deckSnowRim);
  surfaceGroup.add(deckGroup);

  // 1F. Large Winter Summit Station with Warm Waiting Room at (-112, -138)
  const stY = groundHeightAt(WINTER_SUMMIT_STATION_POS.x, WINTER_SUMMIT_STATION_POS.z);
  const stGroup = new THREE.Group();
  stGroup.position.set(WINTER_SUMMIT_STATION_POS.x, stY, WINTER_SUMMIT_STATION_POS.z);
  const stPlat = new THREE.Mesh(track(new THREE.BoxGeometry(16, 0.85, 8)), snowMat);
  stPlat.position.y = 0.42;
  const stHall = new THREE.Mesh(track(new THREE.BoxGeometry(11.5, 4.4, 5.4)), timberMat);
  stHall.position.set(0, 3.0, -0.8);
  const stRoof = new THREE.Mesh(track(new THREE.BoxGeometry(13.2, 0.65, 7.2)), darkRoofMat);
  stRoof.position.set(0, 5.4, -0.8);
  const stRoofSnow = new THREE.Mesh(track(new THREE.BoxGeometry(13.0, 0.32, 7.0)), snowMat);
  stRoofSnow.position.set(0, 5.82, -0.8);
  const stWin = new THREE.Mesh(track(new THREE.BoxGeometry(8.5, 2.2, 0.14)), warmWinMat);
  stWin.position.set(0, 2.8, 1.94);
  stGroup.add(stPlat, stHall, stRoof, stRoofSnow, stWin);
  surfaceGroup.add(stGroup);

  // 1G. 5 Sculpted Mountain Cave Entrance Archways + Glowing Turquoise Beacons
  const archRockGeo = track(new THREE.TorusGeometry(3.4, 1.15, 7, 14, Math.PI));
  const portalGlowMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x5be8ff,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const portalDiscGeo = track(new THREE.CircleGeometry(2.6, 16));

  CAVE_ENTRANCES.forEach((ent) => {
    const ey = groundHeightAt(ent.surfaceX, ent.surfaceZ);
    const eg = new THREE.Group();
    eg.position.set(ent.surfaceX, ey, ent.surfaceZ);
    const arch = new THREE.Mesh(archRockGeo, caveRockMat);
    arch.position.y = 0.3;
    const snowArch = new THREE.Mesh(archRockGeo, snowMat);
    snowArch.scale.set(1.02, 0.45, 0.9);
    snowArch.position.y = 2.55;
    const glowDisc = new THREE.Mesh(portalDiscGeo, portalGlowMat);
    glowDisc.position.set(0, 1.8, 0);
    const lantern = new THREE.Mesh(track(new THREE.BoxGeometry(0.45, 0.6, 0.45)), warmWinMat);
    lantern.position.set(-3.4, 2.4, 0.8);
    const lantern2 = lantern.clone();
    lantern2.position.x = 3.4;
    eg.add(arch, snowArch, glowDisc, lantern, lantern2);
    surfaceGroup.add(eg);

    surfaceInteractables.push({
      id: ent.id,
      kind: 'cave_enter',
      label: `Enter ${ent.name}`,
      sublabel: `${ent.tamilName} · Descend into Underground Caves`,
      x: ent.surfaceX,
      y: ey + 1.2,
      z: ent.surfaceZ,
      radius: 5.5,
      locationId: 'snow_mountains',
      metaId: ent.id,
    });
  });

  // =========================================================================
  // 2. HUGE 6-AREA INTERCONNECTED 3D UNDERGROUND CAVE WORLD (y = -28m)
  // =========================================================================
  const caveFloorMat = track(new THREE.MeshStandardMaterial({ color: 0x354057, roughness: 0.86, metalness: 0.08 }));
  const stoneBridgeMat = track(new THREE.MeshStandardMaterial({ color: 0x5c667a, roughness: 0.78 }));
  const caveLakeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1e88a8,
      emissive: new THREE.Color(0x165e85),
      emissiveIntensity: 0.65,
      roughness: 0.14,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
    })
  );
  const crystalCyanMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x7df9ff,
      emissive: new THREE.Color(0x22d3ee),
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.22,
    })
  );
  const crystalBlueMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: new THREE.Color(0x2563eb),
      emissiveIntensity: 1.25,
      roughness: 0.22,
      metalness: 0.2,
    })
  );
  const crystalMintMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: new THREE.Color(0x10b981),
      emissiveIntensity: 1.25,
      roughness: 0.22,
      metalness: 0.18,
    })
  );
  const beamMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x99f6ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  // 2A. Vaulted Rock Cavern Domes, Floors, Underground Lakes & Volumetric Light Shafts (Areas A–F)
  CAVE_CHAMBERS.forEach((ch) => {
    // Natural stone floor disc
    const flGeo = track(new THREE.CircleGeometry(ch.radius + 2.5, 28));
    flGeo.rotateX(-Math.PI / 2);
    const flMesh = new THREE.Mesh(flGeo, caveFloorMat);
    flMesh.position.set(ch.x, CAVE_FLOOR_Y - 0.1, ch.z);
    caveGroup.add(flMesh);

    // Tall Sculpted Cavern Dome Ceiling (hemisphere rock vault)
    const domeGeo = track(new THREE.SphereGeometry(ch.radius + 2.0, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.56));
    const dome = new THREE.Mesh(domeGeo, caveRockMat);
    dome.scale.set(1, ch.ceilingHeight / (ch.radius + 2.0), 1);
    dome.position.set(ch.x, CAVE_FLOOR_Y - 1.2, ch.z);
    caveGroup.add(dome);

    // Underground Lake / Reflective Pool + Stone Causeway Bridges
    if (ch.hasLake && ch.lakeRadius) {
      const lakeGeo = track(new THREE.CircleGeometry(ch.lakeRadius, 28));
      lakeGeo.rotateX(-Math.PI / 2);
      const lakeMesh = new THREE.Mesh(lakeGeo, caveLakeMat);
      lakeMesh.position.set(ch.x, CAVE_FLOOR_Y + 0.04, ch.z);
      caveGroup.add(lakeMesh);

      // Walkable Stone Bridges & Central Crystal Island across Underground Lakes
      const bridgeN = new THREE.Mesh(track(new THREE.BoxGeometry(5.6, 0.5, ch.lakeRadius * 2 + 4)), stoneBridgeMat);
      bridgeN.position.set(ch.x, CAVE_FLOOR_Y + 0.18, ch.z);
      const bridgeE = new THREE.Mesh(track(new THREE.BoxGeometry(ch.lakeRadius * 2 + 4, 0.5, 5.6)), stoneBridgeMat);
      bridgeE.position.set(ch.x, CAVE_FLOOR_Y + 0.18, ch.z);
      const island = new THREE.Mesh(track(new THREE.CylinderGeometry(6.8, 7.6, 0.8, 12)), stoneBridgeMat);
      island.position.set(ch.x, CAVE_FLOOR_Y + 0.06, ch.z);
      caveGroup.add(bridgeN, bridgeE, island);
    }

    // Soft Volumetric Sky-Light Beam entering each major cavern from high fissures
    const beam = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.6, 5.8, ch.ceilingHeight, 12, 1, true)),
      beamMat
    );
    beam.position.set(ch.x + 2, CAVE_FLOOR_Y + ch.ceilingHeight * 0.5, ch.z - 2);
    beam.rotation.z = 0.08;
    caveGroup.add(beam);
  });

  // 2B. Interconnected Underground Stone Tunnel Passages (Area E + All Inter-Chamber Links)
  CAVE_PASSAGES.forEach((p) => {
    const dx = p.to.x - p.from.x;
    const dz = p.to.z - p.from.z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const midX = (p.from.x + p.to.x) * 0.5;
    const midZ = (p.from.z + p.to.z) * 0.5;

    const pFloor = new THREE.Mesh(
      track(new THREE.BoxGeometry(p.halfWidth * 2.1, 0.4, len + 2)),
      caveFloorMat
    );
    pFloor.position.set(midX, CAVE_FLOOR_Y - 0.18, midZ);
    pFloor.rotation.y = angle;
    caveGroup.add(pFloor);

    // Vaulted rock tunnel arch shell
    const archGeo = track(
      new THREE.CylinderGeometry(p.halfWidth + 0.8, p.halfWidth + 1.2, len, 10, 1, true, 0, Math.PI)
    );
    archGeo.rotateZ(Math.PI / 2);
    archGeo.rotateY(Math.PI / 2);
    const archMesh = new THREE.Mesh(archGeo, caveRockMat);
    archMesh.position.set(midX, CAVE_FLOOR_Y, midZ);
    archMesh.rotation.y = angle;
    caveGroup.add(archMesh);

    // Warm pathway lanterns along every tunnel
    const lanternCount = Math.max(2, Math.floor(len / 14));
    for (let i = 1; i <= lanternCount; i++) {
      const f = i / (lanternCount + 1);
      const lx = p.from.x + dx * f + Math.cos(angle) * (p.halfWidth - 1.4);
      const lz = p.from.z + dz * f - Math.sin(angle) * (p.halfWidth - 1.4);
      const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6)), timberMat);
      post.position.set(lx, CAVE_FLOOR_Y + 1.1, lz);
      const lamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.38, 0.48, 0.38)), warmWinMat);
      lamp.position.set(lx, CAVE_FLOOR_Y + 2.35, lz);
      caveGroup.add(post, lamp);
    }
  });

  // 2C. Special Frozen Cavern (Area B) Translucent Ice Walls & Underground Waterfalls (Area B & Area F)
  const frozenCh = CAVE_CHAMBERS[1];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const iceWall = new THREE.Mesh(track(new THREE.BoxGeometry(5.5, 9.5, 1.4)), iceMat);
    iceWall.position.set(
      frozenCh.x + Math.cos(ang) * (frozenCh.radius - 4.5),
      CAVE_FLOOR_Y + 4.6,
      frozenCh.z + Math.sin(ang) * (frozenCh.radius - 4.5)
    );
    iceWall.rotation.y = -ang + Math.PI / 2;
    caveGroup.add(iceWall);
  }
  // Towering Underground Waterfalls cascading down the Grand Underground Chamber (Area F)
  const grandCh = CAVE_CHAMBERS[5];
  const ugWaterfallMeshes: THREE.Mesh[] = [];
  [-1, 0, 1].forEach((side) => {
    const wf = new THREE.Mesh(track(new THREE.PlaneGeometry(4.2, 20.5)), iceMat);
    wf.position.set(grandCh.x + side * 14, CAVE_FLOOR_Y + 10.2, grandCh.z - 26);
    wf.rotation.y = side * -0.32;
    caveGroup.add(wf);
    ugWaterfallMeshes.push(wf);
  });

  // 2D. Instanced Glowing Crystals (150+ crystals across all 6 caverns — Cyan, Sapphire & Mint!)
  const crystalGeo = track(new THREE.OctahedronGeometry(1.0, 0));
  crystalGeo.scale(0.45, 2.4, 0.45);
  const cyanPts: Array<{ x: number; y: number; z: number; s: number; rx: number; rz: number }> = [];
  const bluePts: Array<{ x: number; y: number; z: number; s: number; rx: number; rz: number }> = [];
  const mintPts: Array<{ x: number; y: number; z: number; s: number; rx: number; rz: number }> = [];

  CAVE_CHAMBERS.forEach((ch, chIdx) => {
    const count = ch.code === 'D' || ch.code === 'F' ? 32 : 20;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + rand() * 0.25;
      const dist = ch.hasLake
        ? (ch.lakeRadius ?? 10) + 2.5 + rand() * (ch.radius - (ch.lakeRadius ?? 10) - 5.5)
        : 5 + rand() * (ch.radius - 8);
      const cx = ch.x + Math.cos(ang) * dist;
      const cz = ch.z + Math.sin(ang) * dist;
      const s = (ch.code === 'F' || ch.code === 'D' ? 1.4 : 0.95) + rand() * 1.4;
      const item = {
        x: cx,
        y: CAVE_FLOOR_Y + s * 1.6,
        z: cz,
        s,
        rx: (rand() - 0.5) * 0.45,
        rz: (rand() - 0.5) * 0.45,
      };
      if ((i + chIdx) % 3 === 0) cyanPts.push(item);
      else if ((i + chIdx) % 3 === 1) bluePts.push(item);
      else mintPts.push(item);
    }
  });

  const buildInst = (
    list: typeof cyanPts,
    geo: THREE.BufferGeometry,
    m: THREE.Material
  ) => {
    const inst = new THREE.InstancedMesh(geo, m, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, i * 0.9, p.rz);
      dummy.scale.set(p.s, p.s, p.s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
    caveGroup.add(inst);
  };
  buildInst(cyanPts, crystalGeo, crystalCyanMat);
  buildInst(bluePts, crystalGeo, crystalBlueMat);
  buildInst(mintPts, crystalGeo, crystalMintMat);

  // 2E. Instanced Stalactites & Stalagmites across Chambers A, B, D, F
  const spireGeo = track(new THREE.ConeGeometry(0.9, 5.2, 6));
  const spirePts: Array<{ x: number; y: number; z: number; s: number; invert: boolean }> = [];
  CAVE_CHAMBERS.forEach((ch) => {
    const n = ch.code === 'F' ? 24 : 10;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + 0.12;
      const r = 6 + rand() * (ch.radius - 9);
      const sx = ch.x + Math.cos(ang) * r;
      const sz = ch.z + Math.sin(ang) * r;
      const s = 0.75 + rand() * (ch.code === 'F' ? 1.55 : 0.85);
      // Hanging stalactite from vault ceiling
      spirePts.push({
        x: sx,
        y: CAVE_FLOOR_Y + ch.ceilingHeight - s * 2.4,
        z: sz,
        s,
        invert: true,
      });
      // Floor stalagmite away from central bridges
      if (r > 12) {
        spirePts.push({
          x: sx + 1.4,
          y: CAVE_FLOOR_Y + s * 2.1,
          z: sz - 1.2,
          s: s * 0.82,
          invert: false,
        });
      }
    }
  });
  const spireInst = new THREE.InstancedMesh(spireGeo, caveRockMat, spirePts.length);
  spirePts.forEach((sp, i) => {
    dummy.position.set(sp.x, sp.y, sp.z);
    dummy.rotation.set(sp.invert ? Math.PI : 0, i * 0.5, 0);
    dummy.scale.set(sp.s, sp.s, sp.s);
    dummy.updateMatrix();
    spireInst.setMatrixAt(i, dummy.matrix);
  });
  spireInst.instanceMatrix.needsUpdate = true;
  caveGroup.add(spireInst);

  // 2F. Glowing Surface Exit Portals inside the Underground Cave World (matching all 5 surface entrances!)
  CAVE_ENTRANCES.forEach((ent) => {
    const exitGroup = new THREE.Group();
    exitGroup.position.set(ent.caveX, CAVE_FLOOR_Y, ent.caveZ);
    const arch = new THREE.Mesh(archRockGeo, stoneBridgeMat);
    arch.position.y = 0.3;
    const disc = new THREE.Mesh(portalDiscGeo, portalGlowMat);
    disc.position.y = 1.8;
    const lamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.45, 0.55, 0.45)), warmWinMat);
    lamp.position.set(0, 3.8, 0.4);
    exitGroup.add(arch, disc, lamp);
    caveGroup.add(exitGroup);

    caveExitInteractables.push({
      id: `exit_${ent.id}`,
      kind: 'cave_exit',
      label: `Exit to ${ent.name}`,
      sublabel: 'Return to Snowy Mountains Surface',
      x: ent.caveX,
      y: CAVE_FLOOR_Y + 1.2,
      z: ent.caveZ,
      radius: 5.5,
      locationId: 'snow_mountains',
      metaId: ent.id,
    });
  });

  // 2G. Luminous Ambient Cave Particles (floating cyan/turquoise motes)
  const moteCount = isSoftwareGl ? 140 : 280;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    const ch = CAVE_CHAMBERS[i % CAVE_CHAMBERS.length];
    const ang = rand() * Math.PI * 2;
    const r = rand() * (ch.radius - 4);
    motePositions[i * 3] = ch.x + Math.cos(ang) * r;
    motePositions[i * 3 + 1] = CAVE_FLOOR_Y + 1.2 + rand() * (ch.ceilingHeight - 3.5);
    motePositions[i * 3 + 2] = ch.z + Math.sin(ang) * r;
  }
  const moteGeo = track(new THREE.BufferGeometry());
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = track(
    new THREE.PointsMaterial({
      color: 0x99f6ff,
      size: 0.42,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    })
  );
  const motes = new THREE.Points(moteGeo, moteMat);
  caveGroup.add(motes);

  // Soft peaceful underground cave lights (tight budget: only 2 dynamic PointLights!)
  const caveAmbientMain = new THREE.PointLight(0x52e0ff, 5.5, 110, 1.15);
  caveAmbientMain.position.set(-168, CAVE_FLOOR_Y + 12, -165);
  const caveAmbientGrand = new THREE.PointLight(0x70ecff, 6.2, 120, 1.15);
  caveAmbientGrand.position.set(-168, CAVE_FLOOR_Y + 15, -242);
  caveGroup.add(caveAmbientMain, caveAmbientGrand);

  // Keep cave geometry hidden when player is outdoors on the surface for maximum frame rate!
  caveGroup.visible = false;

  const update = (elapsed: number, lanternStrength: number, inCave: boolean) => {
    caveGroup.visible = inCave;
    warmWinMat.emissiveIntensity = 1.0 + lanternStrength * 1.1;

    if (inCave) {
      const pulse = 1.25 + Math.sin(elapsed * 1.8) * 0.25;
      crystalCyanMat.emissiveIntensity = pulse;
      crystalBlueMat.emissiveIntensity = 1.05 + Math.cos(elapsed * 1.5) * 0.2;
      crystalMintMat.emissiveIntensity = 1.1 + Math.sin(elapsed * 2.1 + 1.2) * 0.2;
      motes.position.y = Math.sin(elapsed * 0.7) * 0.45;
      for (let i = 0; i < ugWaterfallMeshes.length; i++) {
        ugWaterfallMeshes[i].position.y = CAVE_FLOOR_Y + 10.2 + Math.sin(elapsed * 4 + i) * 0.08;
      }
    }
  };

  return {
    surfaceGroup,
    caveGroup,
    surfaceInteractables,
    caveExitInteractables,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
