import * as THREE from 'three';
import {
  DEALERSHIP_1F_Y,
  DEALERSHIP_2F_Y,
  DEALERSHIP_GF_Y,
  EXHIBITION_DEALERSHIP_CENTER,
  EXHIBITION_DECK_Y,
  EXHIBITION_HANGAR_CENTER,
  EXHIBITION_HELIPAD_POS,
  EXHIBITION_ISLAND_BOUNDS,
  EXHIBITION_ISLAND_CENTER,
  EXHIBITION_LAND_CIRCUIT_CENTER,
  EXHIBITION_MARINA_PIER_BOUNDS,
  EXHIBITION_RUNWAY_CENTER,
  EXHIBITION_VEHICLE_CATALOG,
  HANGAR_FLOOR_Y,
  HANGAR_MEZZ_1_Y,
  HANGAR_MEZZ_2_Y,
  type ExhibitionVehicleId,
} from '../game/exhibitionComplex';
import type { AabbCollider } from '../game/terrain';
import type { InteractableItem } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface ExhibitionComplexWorldSystem {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  setVehicleDisplayStatus: (vehicleId: ExhibitionVehicleId, onDisplay: boolean) => void;
  update: (elapsed: number, lanternStrength: number, playerX: number, playerZ: number) => void;
  dispose: () => void;
}

function makeCanvasSignTexture(
  topLine: string,
  bottomLine: string,
  bgHex: string,
  fgHex: string,
  accentHex: string,
  w = 1024,
  h = 256
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = fgHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.38)}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText(topLine, w / 2, h * 0.37);
    ctx.fillStyle = accentHex;
    ctx.font = `700 ${Math.round(h * 0.21)}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText(bottomLine, w / 2, h * 0.74);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWavyPlazaTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d4d8df';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#3c414d';
    for (let row = 0; row < 12; row++) {
      ctx.beginPath();
      const baseY = row * 44;
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= 512; x += 16) {
        const y = baseY + Math.sin((x / 512) * Math.PI * 4 + row * 0.8) * 14;
        ctx.lineTo(x, y);
      }
      for (let x = 512; x >= 0; x -= 16) {
        const y = baseY + 18 + Math.sin((x / 512) * Math.PI * 4 + row * 0.8) * 14;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHangarFloorTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');
  if (ctx) {
    // Polished light-grey concrete base
    ctx.fillStyle = '#d2d6dc';
    ctx.fillRect(0, 0, 1024, 1024);

    // Concrete expansion joint grid
    ctx.strokeStyle = 'rgba(90, 98, 112, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 1024; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Crimson-red bay lanes (Reference Image 2)
    ctx.fillStyle = '#a81c22';
    ctx.fillRect(42, 42, 940, 56);
    ctx.fillRect(42, 926, 940, 56);
    ctx.fillRect(42, 42, 56, 940);
    ctx.fillRect(926, 42, 56, 940);
    ctx.fillRect(320, 42, 44, 940);
    ctx.fillRect(660, 42, 44, 940);

    // Black & white dashed taxi stripes inside red corridors (Ref 2)
    ctx.fillStyle = '#1f232b';
    ctx.fillRect(98, 490, 828, 44);
    ctx.fillStyle = '#f8fafc';
    for (let x = 112; x < 910; x += 52) {
      ctx.fillRect(x, 505, 28, 14);
    }

    // Royal-blue precision bay outline boxes (Reference Image 3)
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 8;
    ctx.strokeRect(126, 134, 168, 320);
    ctx.strokeRect(392, 134, 240, 320);
    ctx.strokeRect(730, 134, 168, 320);
    ctx.strokeRect(392, 566, 240, 320);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHelipadTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#333b48';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(256, 256, 206, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 256, 174, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(166, 136, 42, 240);
    ctx.fillRect(304, 136, 42, 240);
    ctx.fillRect(166, 236, 180, 42);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the massive, architecturally detailed Oceanfront Universal Transportation
 * Exhibition & Experience Complex combining all three reference images:
 * - Multi-storey Wayfort-style luxury dealership & exhibition hall (Ref 1)
 * - Enormous connected industrial aviation hangar with red/blue girders, yellow bridge crane & walkable catwalks (Refs 2 & 3)
 * - Waterfront Marine Gallery & deep-water marina pier with Sovereign of the Tides berth
 * - Exterior Land Driving & Off-Road Circuit + Ocean Aviation Runway & Helipad
 * - Live interactive displays for all 12 discovered vehicles in DREAMLINE!
 */
export function buildExhibitionComplexWorld(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): ExhibitionComplexWorldSystem {
  const group = new THREE.Group();
  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackTex = (t: THREE.Texture) => {
    disposables.push(t);
    return t;
  };

  // =========================================================================
  // SHARED ARCHITECTURAL PBR MATERIALS
  // =========================================================================
  const claddingGreyMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xb2b7c0, roughness: 0.54, metalness: 0.14 })
  );
  const claddingDarkMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b414c, roughness: 0.48, metalness: 0.35 })
  );
  const mullionMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x20252e, roughness: 0.36, metalness: 0.65 })
  );
  const curtainGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x9ec5df,
      roughness: 0.08,
      metalness: 0.18,
      transparent: true,
      opacity: isSoftwareGl ? 0.34 : 0.32,
      reflectivity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const canopyWoodSlatMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.woodAlbedo,
      color: 0xb88b5a,
      roughness: 0.62,
      metalness: 0.08,
    })
  );
  const greenWallMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2a5c2d, roughness: 0.92, metalness: 0.0 })
  );
  const warmLedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff4d6,
      emissive: 0xffd180,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    })
  );
  const coolLedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6f4ff,
      emissive: 0x93d5ff,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );
  const terrazzoMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.32, metalness: 0.08 })
  );
  const seawallConcreteMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.concretePlatform,
      color: 0x9ca3af,
      roughness: 0.82,
    })
  );
  const asphaltMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2f343d, roughness: 0.88 })
  );
  const whitePaintMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.72 })
  );
  const redSteelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xa61c22, roughness: 0.42, metalness: 0.58 })
  );
  const blueSteelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x16389c, roughness: 0.42, metalness: 0.58 })
  );
  const yellowCraneMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.38, metalness: 0.45 })
  );
  const hangarWallMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xcbd2dc, roughness: 0.62, metalness: 0.22 })
  );
  const hangarDoorMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x8a929e, roughness: 0.52, metalness: 0.45 })
  );
  const catwalkSteelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x47505e, roughness: 0.55, metalness: 0.65 })
  );
  const officeWhiteMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe8edf4, roughness: 0.5 })
  );
  const officeGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1c2738,
      emissive: 0x3b5a7a,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.5,
    })
  );
  const pierWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.woodAlbedo,
      color: 0x8f6745,
      roughness: 0.82,
    })
  );

  const addBox = (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    cast = true,
    receive = true
  ) => {
    const m = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.set(x, y, z);
    m.castShadow = cast && !isSoftwareGl;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  };

  // =========================================================================
  // 1. ENGINEERED OCEAN ISLAND SEAWALL PLATFORM, PLAZA & PARKING LOT
  // =========================================================================
  const islandW = EXHIBITION_ISLAND_BOUNDS.maxX - EXHIBITION_ISLAND_BOUNDS.minX; // 100
  const islandD = EXHIBITION_ISLAND_BOUNDS.maxZ - EXHIBITION_ISLAND_BOUNDS.minZ; // 88
  const ix = EXHIBITION_ISLAND_CENTER.x;
  const iz = EXHIBITION_ISLAND_CENTER.z;

  // Main marine foundation caisson dropping below ocean bed
  addBox(group, islandW, 3.1, islandD, seawallConcreteMat, ix, EXHIBITION_DECK_Y - 1.55, iz, false, true);
  // Crisp white coping edge along the entire seawall perimeter
  addBox(group, islandW + 0.6, 0.24, 0.6, whitePaintMat, ix, EXHIBITION_DECK_Y + 0.08, EXHIBITION_ISLAND_BOUNDS.minZ, false, true);
  addBox(group, islandW + 0.6, 0.24, 0.6, whitePaintMat, ix, EXHIBITION_DECK_Y + 0.08, EXHIBITION_ISLAND_BOUNDS.maxZ, false, true);
  addBox(group, 0.6, 0.24, islandD + 0.6, whitePaintMat, EXHIBITION_ISLAND_BOUNDS.minX, EXHIBITION_DECK_Y + 0.08, iz, false, true);
  addBox(group, 0.6, 0.24, islandD + 0.6, whitePaintMat, EXHIBITION_ISLAND_BOUNDS.maxX, EXHIBITION_DECK_Y + 0.08, iz, false, true);

  // Designer wavy monochrome paved arrival plaza in front of Dealership (Reference Image 1!)
  const wavyTex = trackTex(makeWavyPlazaTexture());
  const wavyPlazaMat = trackMat(new THREE.MeshStandardMaterial({ map: wavyTex, roughness: 0.72 }));
  const wavyPlaza = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(42, 16)), wavyPlazaMat);
  wavyPlaza.rotation.x = -Math.PI / 2;
  wavyPlaza.position.set(177, EXHIBITION_DECK_Y + 0.03, 220.5);
  wavyPlaza.receiveShadow = true;
  group.add(wavyPlaza);

  // Visitor Parking Lot stalls along NW arrival zone
  addBox(group, 22, 0.04, 11, asphaltMat, 166, EXHIBITION_DECK_Y + 0.02, 218.5, false, true);
  for (let p = 0; p < 6; p++) {
    addBox(group, 0.14, 0.05, 4.4, whitePaintMat, 157.5 + p * 3.4, EXHIBITION_DECK_Y + 0.03, 216.2, false, false);
  }

  // Modern Plaza Streetlamps + Cypress & Palm Landscaping (Reference Image 1 left side)
  const lampHeadPositions = [
    { x: 173, z: 221 },
    { x: 193, z: 221 },
    { x: 160, z: 230 },
    { x: 160, z: 248 },
    { x: 204, z: 220 },
  ];
  for (const lp of lampHeadPositions) {
    addBox(group, 0.16, 4.8, 0.16, mullionMat, lp.x, EXHIBITION_DECK_Y + 2.4, lp.z);
    addBox(group, 1.3, 0.14, 0.28, mullionMat, lp.x, EXHIBITION_DECK_Y + 4.8, lp.z);
    addBox(group, 0.42, 0.1, 0.22, warmLedMat, lp.x - 0.38, EXHIBITION_DECK_Y + 4.72, lp.z, false, false);
    addBox(group, 0.42, 0.1, 0.22, warmLedMat, lp.x + 0.38, EXHIBITION_DECK_Y + 4.72, lp.z, false, false);
  }

  // Tall Mediterranean Cypress Trees flanking west entrance plaza (Ref 1!)
  const cypressMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x264b2a, roughness: 0.88 }));
  const trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x5c422c, roughness: 0.9 }));
  for (const cp of [
    { x: 157.5, z: 226.5, h: 6.4 },
    { x: 157.5, z: 233.5, h: 7.2 },
    { x: 157.5, z: 241.0, h: 6.0 },
    { x: 199.5, z: 224.5, h: 5.5 },
  ]) {
    const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.2, 1.2, 7)), trunkMat);
    trunk.position.set(cp.x, EXHIBITION_DECK_Y + 0.6, cp.z);
    const foliage = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.85, cp.h, 8)), cypressMat);
    foliage.position.set(cp.x, EXHIBITION_DECK_Y + 1.0 + cp.h * 0.5, cp.z);
    group.add(trunk, foliage);
  }

  // =========================================================================
  // 2. BUILDING 1 — MULTI-STOREY LUXURY DEALERSHIP & EXHIBITION HALL (REF 1)
  // Centered at (184, 238), 28m wide (x: 170..198) x 22m deep (z: 227..249)
  // =========================================================================
  const dGroup = new THREE.Group();
  const dx0 = EXHIBITION_DEALERSHIP_CENTER.x;
  const dz0 = EXHIBITION_DEALERSHIP_CENTER.z;
  dGroup.position.set(dx0, 0, dz0);
  group.add(dGroup);

  const dW = 28;
  const dD = 22;
  const roofY = 14.3;

  // Ground Floor polished terrazzo slab
  addBox(dGroup, dW, 0.24, dD, terrazzoMat, 0, DEALERSHIP_GF_Y - 0.12, 0, false, true);

  // First Floor Slab (with open front-center double-height lobby atrium!)
  addBox(dGroup, dW - 0.4, 0.3, 14.6, terrazzoMat, 0, DEALERSHIP_1F_Y - 0.15, 3.4, false, true);
  addBox(dGroup, 8.6, 0.3, 6.8, terrazzoMat, -9.5, DEALERSHIP_1F_Y - 0.15, -7.3, false, true);
  addBox(dGroup, 8.6, 0.3, 6.8, terrazzoMat, 9.5, DEALERSHIP_1F_Y - 0.15, -7.3, false, true);
  // Glass balustrade overlooking the Ground Floor atrium
  addBox(dGroup, 10.6, 1.05, 0.08, curtainGlassMat, 0, DEALERSHIP_1F_Y + 0.52, -3.9, false, false);
  addBox(dGroup, 10.6, 0.07, 0.12, mullionMat, 0, DEALERSHIP_1F_Y + 1.05, -3.9, false, false);

  // Second Floor Slab (with central skylight atrium cutout!)
  addBox(dGroup, dW - 0.4, 0.3, 7.2, terrazzoMat, 0, DEALERSHIP_2F_Y - 0.15, 7.2, false, true);
  addBox(dGroup, dW - 0.4, 0.3, 6.8, terrazzoMat, 0, DEALERSHIP_2F_Y - 0.15, -7.4, false, true);
  addBox(dGroup, 7.6, 0.3, 8.0, terrazzoMat, -10.0, DEALERSHIP_2F_Y - 0.15, 0.0, false, true);
  addBox(dGroup, 7.6, 0.3, 8.0, terrazzoMat, 10.0, DEALERSHIP_2F_Y - 0.15, 0.0, false, true);
  // Glass atrium railings on 2F
  addBox(dGroup, 12.6, 1.05, 0.08, curtainGlassMat, 0, DEALERSHIP_2F_Y + 0.52, 3.6, false, false);
  addBox(dGroup, 12.6, 1.05, 0.08, curtainGlassMat, 0, DEALERSHIP_2F_Y + 0.52, -4.0, false, false);

  // Roof Deck + Modern Grey Parapet Wall + Skylight Lantern
  addBox(dGroup, dW + 0.8, 0.45, dD + 0.8, claddingGreyMat, 0, roofY, 0);
  addBox(dGroup, dW + 1.0, 0.9, 0.55, claddingGreyMat, 0, roofY + 0.65, -dD / 2 - 0.1);
  addBox(dGroup, dW + 1.0, 0.9, 0.55, claddingGreyMat, 0, roofY + 0.65, dD / 2 + 0.1);
  addBox(dGroup, 0.55, 0.9, dD + 0.8, claddingGreyMat, -dW / 2 - 0.1, roofY + 0.65, 0);
  addBox(dGroup, 0.55, 0.9, dD + 0.8, claddingGreyMat, dW / 2 + 0.1, roofY + 0.65, 0);

  // Architectural Grey Vertical Structural Columns & Horizontal Floor Spandrel Bands (Ref 1!)
  const frontColsX = [-14, -9.2, -3.4, 3.4, 9.2, 14];
  for (const cx of frontColsX) {
    addBox(dGroup, 0.95, roofY - EXHIBITION_DECK_Y, 0.95, claddingGreyMat, cx, (roofY + EXHIBITION_DECK_Y) * 0.5, -dD / 2);
    addBox(dGroup, 0.95, roofY - EXHIBITION_DECK_Y, 0.95, claddingGreyMat, cx, (roofY + EXHIBITION_DECK_Y) * 0.5, dD / 2);
  }
  for (const cz of [-6.0, 0.0, 6.0]) {
    addBox(dGroup, 0.95, roofY - EXHIBITION_DECK_Y, 0.95, claddingGreyMat, -dW / 2, (roofY + EXHIBITION_DECK_Y) * 0.5, cz);
    addBox(dGroup, 0.95, roofY - EXHIBITION_DECK_Y, 0.95, claddingGreyMat, dW / 2, (roofY + EXHIBITION_DECK_Y) * 0.5, cz);
  }

  // Horizontal Grey Cladding Fascia Bands between storeys
  for (const bandY of [DEALERSHIP_1F_Y - 0.1, DEALERSHIP_2F_Y - 0.1, roofY - 0.25]) {
    addBox(dGroup, dW + 0.4, 0.55, 0.55, claddingGreyMat, 0, bandY, -dD / 2 - 0.08);
    addBox(dGroup, dW + 0.4, 0.55, 0.55, claddingGreyMat, 0, bandY, dD / 2 + 0.08);
    addBox(dGroup, 0.55, 0.55, dD + 0.4, claddingGreyMat, -dW / 2 - 0.08, bandY, 0);
    addBox(dGroup, 0.55, 0.55, dD + 0.4, claddingGreyMat, dW / 2 + 0.08, bandY, 0);
  }

  // Full-Height Transparent Curtain-Wall Glass Panels with Dark Aluminium Mullions (Ref 1!)
  // Front (-Z) glass bays (leaving center door opening x: -3.0..3.0, y: GF..4.2 open to walk right in!)
  for (const bx of [-11.6, -6.3, 6.3, 11.6]) {
    const bw = Math.abs(bx) > 9 ? 4.1 : 5.1;
    addBox(dGroup, bw, roofY - DEALERSHIP_GF_Y - 0.5, 0.08, curtainGlassMat, bx, (roofY + DEALERSHIP_GF_Y) * 0.5, -dD / 2 + 0.1, false, false);
    for (const my of [2.8, 7.2, 11.6]) {
      addBox(dGroup, bw, 0.1, 0.16, mullionMat, bx, my, -dD / 2 + 0.12, false, false);
    }
  }
  // West (-X) glass curtain wall facing the cantilevered drop-off canopy
  addBox(dGroup, 0.08, roofY - DEALERSHIP_GF_Y - 0.5, dD - 1.2, curtainGlassMat, -dW / 2 + 0.1, (roofY + DEALERSHIP_GF_Y) * 0.5, 0, false, false);
  // South (+Z) glass curtain wall overlooking the Land Driving Circuit & Ocean
  addBox(dGroup, dW - 1.2, roofY - DEALERSHIP_GF_Y - 0.5, 0.08, curtainGlassMat, 0, (roofY + DEALERSHIP_GF_Y) * 0.5, dD / 2 - 0.1, false, false);

  // SIGNATURE VERTICAL LIVING GREEN GARDEN WALL ON FRONT FACADE WITH WARM LED FRAME (REF 1!)
  addBox(dGroup, 4.4, 9.2, 0.36, claddingDarkMat, 0, 9.0, -dD / 2 - 0.06);
  addBox(dGroup, 3.8, 8.6, 0.28, greenWallMat, 0, 9.0, -dD / 2 - 0.22);
  // Crisp warm-white illuminated LED strip framing the vertical garden
  addBox(dGroup, 4.2, 0.14, 0.14, warmLedMat, 0, 13.45, -dD / 2 - 0.32, false, false);
  addBox(dGroup, 4.2, 0.14, 0.14, warmLedMat, 0, 4.55, -dD / 2 - 0.32, false, false);
  addBox(dGroup, 0.14, 9.0, 0.14, warmLedMat, -2.05, 9.0, -dD / 2 - 0.32, false, false);
  addBox(dGroup, 0.14, 9.0, 0.14, warmLedMat, 2.05, 9.0, -dD / 2 - 0.32, false, false);

  // GRAND RECESSED FRONT ENTRANCE, STAIRCASE & ACCESSIBLE PEDESTRIAN RAMP (REF 1!)
  // Warm bronze entrance portal header
  addBox(dGroup, 5.8, 0.8, 0.9, canopyWoodSlatMat, 0, 4.2, -dD / 2 - 0.15);
  // 5 Crisp Entrance Steps descending to plaza
  for (let s = 0; s < 5; s++) {
    const sy = EXHIBITION_DECK_Y + ((5 - s) / 5) * (DEALERSHIP_GF_Y - EXHIBITION_DECK_Y);
    addBox(dGroup, 6.2, sy - EXHIBITION_DECK_Y + 0.08, 0.62, terrazzoMat, 0, (sy + EXHIBITION_DECK_Y) * 0.5, -dD / 2 - 0.45 - s * 0.58, false, true);
  }
  // Accessible pedestrian ramp on front-west
  const rampMesh = addBox(dGroup, 7.0, 0.16, 2.3, terrazzoMat, -8.0, (EXHIBITION_DECK_Y + DEALERSHIP_GF_Y) * 0.5, -dD / 2 - 1.4, false, true);
  rampMesh.rotation.z = Math.atan2(DEALERSHIP_GF_Y - EXHIBITION_DECK_Y, 7.0);

  // MONUMENTAL CANTILEVERED ENTRANCE CANOPY WITH HORIZONTAL ARCHITECTURAL SLATS (REF 1!)
  // Projects west over the drop-off lane (local x: -24.5..-14, z: -10..+8)
  const canopyBaseY = 9.4;
  // Angled iconic white/grey structural support pillar at outer west corner
  const angledPillar = addBox(dGroup, 1.15, 10.6, 1.25, claddingGreyMat, -23.4, 5.4, -7.2);
  angledPillar.rotation.z = -0.14;
  const angledPillarBack = addBox(dGroup, 1.15, 10.6, 1.25, claddingGreyMat, -23.4, 5.4, 6.2);
  angledPillarBack.rotation.z = -0.14;
  // Outer fascia beam + 13 crisp horizontal architectural bronze/wood slats overhead
  addBox(dGroup, 0.65, 0.65, 16.0, claddingGreyMat, -24.1, canopyBaseY + 0.8, -0.5);
  for (let sl = 0; sl < 13; sl++) {
    const sz = -8.0 + sl * 1.26;
    addBox(dGroup, 11.4, 0.24, 0.36, canopyWoodSlatMat, -19.2, canopyBaseY + 1.05, sz);
  }
  // Lower cantilevered drop-off soffit with warm architectural LED strip (Ref 1 left mid-deck!)
  addBox(dGroup, 9.8, 0.55, 14.5, claddingDarkMat, -18.8, 5.65, -0.5);
  addBox(dGroup, 9.8, 0.1, 0.16, warmLedMat, -18.8, 5.4, -7.8, false, false);

  // BOLD 3D ILLUMINATED ROOFTOP SIGNAGE — CLEANLY ELEVATED ABOVE ROOFLINE (ZERO CLIPPING!)
  const roofSignFrameY = roofY + 1.05;
  for (const sx of [-9.5, -3.2, 3.2, 9.5]) {
    addBox(dGroup, 0.22, 3.1, 0.22, mullionMat, sx, roofSignFrameY + 1.55, -dD / 2 + 0.35);
    // Diagonal back brace strut
    const brace = addBox(dGroup, 0.16, 3.1, 0.16, mullionMat, sx, roofSignFrameY + 1.3, -dD / 2 + 1.35);
    brace.rotation.x = 0.58;
  }
  const mainSignTex = trackTex(
    makeCanvasSignTexture(
      'WAYFORT · DREAMLINE',
      'UNIVERSAL TRANSPORTATION EXHIBITION',
      '#131924',
      '#f8fafc',
      '#f5c36c',
      1024,
      256
    )
  );
  const mainSignMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: mainSignTex,
      emissiveMap: mainSignTex,
      emissive: new THREE.Color(0xfff1d0),
      emissiveIntensity: 0.72,
      roughness: 0.28,
    })
  );
  const roofSignBoard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(22.4, 3.8, 0.45)), mainSignMat);
  roofSignBoard.position.set(0, roofSignFrameY + 2.1, -dD / 2 + 0.1);
  dGroup.add(roofSignBoard);

  // INTERIOR WALKABLE STAIRCASES (Ground -> 1F along east wall, 1F -> 2F along west wall)
  const buildStaircase = (
    parent: THREE.Object3D,
    xCenter: number,
    zStart: number,
    zEnd: number,
    yStart: number,
    yEnd: number,
    steps: number,
    width: number,
    stepMat: THREE.Material,
    railMat: THREE.Material
  ) => {
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sy = yStart + t * (yEnd - yStart);
      const sz = zStart + t * (zEnd - zStart);
      const stepD = Math.abs(zEnd - zStart) / steps + 0.08;
      addBox(parent, width, 0.18, stepD, stepMat, xCenter, sy - 0.09, sz, false, true);
    }
    const len = Math.hypot(zEnd - zStart, yEnd - yStart);
    const pitch = Math.atan2(yEnd - yStart, Math.abs(zEnd - zStart));
    const dirSign = zEnd > zStart ? -1 : 1;
    for (const side of [-1, 1]) {
      const rail = addBox(
        parent,
        0.08,
        0.08,
        len,
        railMat,
        xCenter + side * (width * 0.48),
        (yStart + yEnd) * 0.5 + 0.95,
        (zStart + zEnd) * 0.5,
        false,
        false
      );
      rail.rotation.x = dirSign * pitch;
    }
  };
  buildStaircase(dGroup, 11.4, 4.5, -5.5, DEALERSHIP_GF_Y, DEALERSHIP_1F_Y, 18, 2.8, claddingDarkMat, mullionMat);
  buildStaircase(dGroup, -11.4, -5.5, 4.5, DEALERSHIP_1F_Y, DEALERSHIP_2F_Y, 18, 2.8, claddingDarkMat, mullionMat);

  // GRAND RECEPTION LOBBY DESK & VISITOR LOUNGE (Ground Floor Front Center)
  addBox(dGroup, 5.4, 1.05, 1.35, claddingDarkMat, 0, DEALERSHIP_GF_Y + 0.52, -7.2);
  addBox(dGroup, 5.6, 0.1, 1.5, canopyWoodSlatMat, 0, DEALERSHIP_GF_Y + 1.08, -7.2);
  addBox(dGroup, 4.8, 0.08, 0.12, warmLedMat, 0, DEALERSHIP_GF_Y + 0.15, -7.9, false, false);
  // Reception Lounge Seating
  for (const sx of [-7.5, 7.5]) {
    addBox(dGroup, 2.4, 0.46, 0.95, claddingDarkMat, sx, DEALERSHIP_GF_Y + 0.23, -7.8);
    addBox(dGroup, 2.4, 0.42, 0.22, canopyWoodSlatMat, sx, DEALERSHIP_GF_Y + 0.62, -7.4);
  }
  // Interior Overhead Linear Ceiling Strip Lights across all 3 storeys
  for (const ly of [DEALERSHIP_1F_Y - 0.35, DEALERSHIP_2F_Y - 0.35, roofY - 0.35]) {
    for (const lz of [-7.5, 0, 7.5]) {
      addBox(dGroup, 18.0, 0.08, 0.22, warmLedMat, 0, ly, lz, false, false);
    }
  }

  // ELEVATED GLASS SKYBRIDGE CONNECTING DEALERSHIP 1F -> AVIATION HANGAR MEZZANINE (x: 198..204)
  addBox(group, 6.4, 0.28, 5.8, terrazzoMat, 201.0, DEALERSHIP_1F_Y - 0.14, 234.5, false, true);
  addBox(group, 6.4, 0.28, 5.8, claddingGreyMat, 201.0, DEALERSHIP_1F_Y + 3.4, 234.5);
  addBox(group, 6.4, 3.2, 0.1, curtainGlassMat, 201.0, DEALERSHIP_1F_Y + 1.65, 231.65, false, false);
  addBox(group, 6.4, 3.2, 0.1, curtainGlassMat, 201.0, DEALERSHIP_1F_Y + 1.65, 237.35, false, false);

  // Dealership perimeter colliders (leaving wide front entrance, east skybridge & hangar passage open!)
  colliders.push(
    { id: 'ex_d_front_l', minX: 169.5, maxX: 180.5, minZ: 226.4, maxZ: 227.6 },
    { id: 'ex_d_front_r', minX: 187.5, maxX: 198.5, minZ: 226.4, maxZ: 227.6 },
    { id: 'ex_d_west', minX: 169.4, maxX: 170.5, minZ: 226.8, maxZ: 249.4 },
    { id: 'ex_d_south', minX: 169.5, maxX: 198.5, minZ: 248.4, maxZ: 249.5 },
    { id: 'ex_d_east_n', minX: 197.5, maxX: 198.5, minZ: 226.8, maxZ: 231.2 },
    { id: 'ex_d_east_s', minX: 197.5, maxX: 198.5, minZ: 241.5, maxZ: 249.4 }
  );

  // =========================================================================
  // 3. BUILDING 2 — MASSIVE INDUSTRIAL AVIATION EXHIBITION HANGAR (REFS 2 & 3)
  // Centered at (224, 240), 40m wide (x: 204..244) x 28m deep (z: 226..254) x 19.5m tall
  // =========================================================================
  const hGroup = new THREE.Group();
  const hx0 = EXHIBITION_HANGAR_CENTER.x;
  const hz0 = EXHIBITION_HANGAR_CENTER.z;
  hGroup.position.set(hx0, 0, hz0);
  group.add(hGroup);

  const hW = 40;
  const hD = 28;
  const hTall = 19.2;

  // Polished Industrial Concrete Hangar Floor with Crimson-Red & Royal-Blue Bay Markings (Refs 2 & 3!)
  const hangarFloorTex = trackTex(makeHangarFloorTexture());
  const hangarFloorMat = trackMat(
    new THREE.MeshStandardMaterial({ map: hangarFloorTex, roughness: 0.36, metalness: 0.1 })
  );
  const hangarFloor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(hW, 0.24, hD)), hangarFloorMat);
  hangarFloor.position.set(0, HANGAR_FLOOR_Y - 0.12, 0);
  hangarFloor.receiveShadow = true;
  hGroup.add(hangarFloor);

  // Towering Hangar Exterior Cladding Walls (North, West with passage to Dealership, East with passage to Marine Gallery)
  addBox(hGroup, hW + 0.6, hTall, 0.65, hangarWallMat, 0, hTall * 0.5, -hD / 2);
  // West wall (leaving ground & 1F passage open from z = -8.5..-2.0 to Dealership!)
  addBox(hGroup, 0.65, hTall, 10.5, hangarWallMat, -hW / 2, hTall * 0.5, 8.8);
  addBox(hGroup, 0.65, hTall, 5.6, hangarWallMat, -hW / 2, hTall * 0.5, -11.2);
  addBox(hGroup, 0.65, hTall - 9.0, 12.2, hangarWallMat, -hW / 2, 9.0 + (hTall - 9.0) * 0.5, -2.5);
  // East wall (leaving central wide passage to Zone C Marine Gallery)
  addBox(hGroup, 0.65, hTall, 9.5, hangarWallMat, hW / 2, hTall * 0.5, -9.2);
  addBox(hGroup, 0.65, hTall, 9.5, hangarWallMat, hW / 2, hTall * 0.5, 9.2);
  addBox(hGroup, 0.65, hTall - 5.2, 9.2, hangarWallMat, hW / 2, 5.2 + (hTall - 5.2) * 0.5, 0);

  // Giant Sliding Corrugated Steel Hangar Doors on South (+Z) wall — SLID WIDE OPEN onto the Runway!
  addBox(hGroup, 8.2, 13.4, 0.65, hangarDoorMat, -15.9, 6.7 + HANGAR_FLOOR_Y, hD / 2);
  addBox(hGroup, 8.2, 13.4, 0.65, hangarDoorMat, 15.9, 6.7 + HANGAR_FLOOR_Y, hD / 2);
  // Upper door lintel fascia + hangar signage above opening
  addBox(hGroup, hW + 0.8, 5.6, 0.85, hangarWallMat, 0, 16.5, hD / 2);
  const hangarSignTex = trackTex(
    makeCanvasSignTexture(
      'AVIATION EXHIBITION HANGAR',
      'ZONE B · AIRCRAFT BAY & RUNWAY APRON',
      '#172033',
      '#f8fafc',
      '#38bdf8',
      1024,
      220
    )
  );
  const hangarSignMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: hangarSignTex,
      emissiveMap: hangarSignTex,
      emissive: new THREE.Color(0xcceeff),
      emissiveIntensity: 0.55,
      roughness: 0.3,
    })
  );
  const hangarSign = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(20.0, 3.0, 0.3)), hangarSignMat);
  hangarSign.position.set(0, 16.5, hD / 2 + 0.55);
  hGroup.add(hangarSign);

  // Roof Slab + Long-Span Royal-Blue & Crimson-Red Industrial Steel Trusses & Columns (Refs 2 & 3!)
  addBox(hGroup, hW + 1.2, 0.6, hD + 1.2, claddingDarkMat, 0, hTall + 0.2, 0);
  const trussZPositions = [-12.5, -6.2, 0.0, 6.2, 12.5];
  for (let ti = 0; ti < trussZPositions.length; ti++) {
    const tz = trussZPositions[ti];
    const girderMat = ti % 2 === 0 ? blueSteelMat : redSteelMat;
    // Left & Right Heavy Industrial Structural Columns
    addBox(hGroup, 0.9, hTall, 0.9, girderMat, -hW / 2 + 0.8, hTall * 0.5, tz);
    addBox(hGroup, 0.9, hTall, 0.9, girderMat, hW / 2 - 0.8, hTall * 0.5, tz);
    // Main Overhead Clear-Span I-Beam Roof Girder
    addBox(hGroup, hW - 1.4, 1.25, 0.65, girderMat, 0, hTall - 1.2, tz);
    // Secondary lower truss chord + high-bay luminous LED light bars
    addBox(hGroup, hW - 2.4, 0.32, 0.38, girderMat, 0, hTall - 2.9, tz);
    for (let dx = -15; dx <= 15; dx += 6) {
      const diag = addBox(hGroup, 0.2, 2.3, 0.2, girderMat, dx, hTall - 2.05, tz, false, false);
      diag.rotation.z = dx % 12 === 0 ? 0.62 : -0.62;
    }
    // High-Bay Industrial LED Floodlight Panels
    for (const lx of [-11, 0, 11]) {
      addBox(hGroup, 2.8, 0.16, 0.95, coolLedMat, lx, hTall - 3.15, tz, false, false);
    }
  }

  // OVERHEAD YELLOW TRAVELING BRIDGE CRANE WITH TROLLEY & HOOK (REFERENCE IMAGE 3!)
  const craneY = 13.8;
  addBox(hGroup, hW - 2.4, 0.95, 0.72, yellowCraneMat, 0, craneY, -1.2);
  addBox(hGroup, hW - 2.4, 0.95, 0.72, yellowCraneMat, 0, craneY, 1.2);
  // Crane side runway rails along east & west walls
  addBox(hGroup, 0.55, 0.7, hD - 2.0, yellowCraneMat, -hW / 2 + 1.45, craneY - 0.55, 0);
  addBox(hGroup, 0.55, 0.7, hD - 2.0, yellowCraneMat, hW / 2 - 1.45, craneY - 0.55, 0);
  // Trolley & hanging hook assembly
  addBox(hGroup, 2.8, 0.9, 3.0, yellowCraneMat, 6.5, craneY + 0.55, 0);
  addBox(hGroup, 0.14, 3.2, 0.14, mullionMat, 6.5, craneY - 1.6, 0, false, false);
  const hookBlock = addBox(hGroup, 0.9, 0.85, 0.55, yellowCraneMat, 6.5, craneY - 3.3, 0);
  hookBlock.rotation.y = 0.3;

  // WALKABLE MULTI-LEVEL INDUSTRIAL MEZZANINE CATWALKS & OBSERVATION ROOMS (REFS 2 & 3!)
  // Mezzanine Level 1 (y = 5.18) along North, West, and East walls
  addBox(hGroup, hW - 1.2, 0.28, 6.6, catwalkSteelMat, 0, HANGAR_MEZZ_1_Y - 0.14, -hD / 2 + 3.4, false, true);
  addBox(hGroup, 5.0, 0.28, 17.0, catwalkSteelMat, -hW / 2 + 2.6, HANGAR_MEZZ_1_Y - 0.14, -1.2, false, true);
  addBox(hGroup, 5.0, 0.28, 17.0, catwalkSteelMat, hW / 2 - 2.6, HANGAR_MEZZ_1_Y - 0.14, -1.2, false, true);
  // Mezzanine Safety Railings (metal silver-grey & yellow)
  addBox(hGroup, 29.8, 0.08, 0.08, yellowCraneMat, 0, HANGAR_MEZZ_1_Y + 1.05, -hD / 2 + 6.65, false, false);
  addBox(hGroup, 0.08, 0.08, 13.0, yellowCraneMat, -hW / 2 + 5.05, HANGAR_MEZZ_1_Y + 1.05, 0.8, false, false);
  addBox(hGroup, 0.08, 0.08, 13.0, yellowCraneMat, hW / 2 - 5.05, HANGAR_MEZZ_1_Y + 1.05, 0.8, false, false);

  // Mezzanine Level 2 Upper Catwalk (y = 9.68) along North & sides
  addBox(hGroup, hW - 1.2, 0.24, 4.4, catwalkSteelMat, 0, HANGAR_MEZZ_2_Y - 0.12, -hD / 2 + 2.3, false, true);
  addBox(hGroup, 3.8, 0.24, 15.0, catwalkSteelMat, -hW / 2 + 2.0, HANGAR_MEZZ_2_Y - 0.12, -2.0, false, true);
  addBox(hGroup, 3.8, 0.24, 15.0, catwalkSteelMat, hW / 2 - 2.0, HANGAR_MEZZ_2_Y - 0.12, -2.0, false, true);
  addBox(hGroup, 32.0, 0.08, 0.08, yellowCraneMat, 0, HANGAR_MEZZ_2_Y + 1.05, -hD / 2 + 4.45, false, false);

  // Modular White/Blue-Trimmed & Dark-Glass Observation Control Offices on Mezzanine (Refs 2 & 3!)
  for (const ox of [-9.5, 9.5]) {
    addBox(hGroup, 9.2, 3.4, 4.2, officeWhiteMat, ox, HANGAR_MEZZ_1_Y + 1.7, -hD / 2 + 2.3);
    addBox(hGroup, 9.3, 0.22, 4.3, blueSteelMat, ox, HANGAR_MEZZ_1_Y + 3.45, -hD / 2 + 2.3);
    addBox(hGroup, 7.2, 1.55, 0.14, officeGlassMat, ox, HANGAR_MEZZ_1_Y + 2.05, -hD / 2 + 4.42);
  }
  // Industrial Maintenance Lockers along East Floor Wall (Ref 2 right side!)
  for (let lk = 0; lk < 4; lk++) {
    addBox(hGroup, 0.85, 2.2, 1.4, claddingGreyMat, hW / 2 - 1.2, HANGAR_FLOOR_Y + 1.1, 6.0 + lk * 1.6);
  }

  // Walkable Industrial Steel Staircases (Yellow Railings matching Ref 3!)
  buildStaircase(hGroup, -18.0, 5.5, -4.0, HANGAR_FLOOR_Y, HANGAR_MEZZ_1_Y, 18, 2.4, catwalkSteelMat, yellowCraneMat);
  buildStaircase(hGroup, 18.0, 5.5, -4.0, HANGAR_MEZZ_1_Y, HANGAR_MEZZ_2_Y, 18, 2.4, catwalkSteelMat, yellowCraneMat);

  // Hangar perimeter wall colliders
  colliders.push(
    { id: 'ex_h_north', minX: 203.5, maxX: 244.5, minZ: 225.4, maxZ: 226.6 },
    { id: 'ex_h_south_l', minX: 203.5, maxX: 212.2, minZ: 253.4, maxZ: 254.6 },
    { id: 'ex_h_south_r', minX: 235.8, maxX: 244.5, minZ: 253.4, maxZ: 254.6 }
  );

  // =========================================================================
  // 4. ZONE C — WATERFRONT MARINE GALLERY PAVILION, MARINA PIER & BUOYS
  // =========================================================================
  // Sleek glass marine pavilion on the eastern waterfront edge (x: 245..254, z: 228..252)
  addBox(group, 9.2, 0.2, 24.0, terrazzoMat, 249.5, EXHIBITION_DECK_Y + 0.1, 240.0, false, true);
  addBox(group, 9.6, 0.35, 24.6, claddingGreyMat, 249.5, EXHIBITION_DECK_Y + 5.8, 240.0);
  for (const pz of [228.5, 236.0, 244.0, 251.5]) {
    addBox(group, 0.38, 5.6, 0.38, mullionMat, 253.8, EXHIBITION_DECK_Y + 2.9, pz);
  }
  addBox(group, 0.08, 5.2, 23.0, curtainGlassMat, 253.8, EXHIBITION_DECK_Y + 2.9, 240.0, false, false);

  // Wide Wooden Marina Pier extending directly into the turquoise ocean (x: 252..280, z: 231..249)
  const pierW = EXHIBITION_MARINA_PIER_BOUNDS.maxX - EXHIBITION_MARINA_PIER_BOUNDS.minX;
  const pierD = EXHIBITION_MARINA_PIER_BOUNDS.maxZ - EXHIBITION_MARINA_PIER_BOUNDS.minZ;
  const pierCX = (EXHIBITION_MARINA_PIER_BOUNDS.minX + EXHIBITION_MARINA_PIER_BOUNDS.maxX) * 0.5;
  const pierCZ = (EXHIBITION_MARINA_PIER_BOUNDS.minZ + EXHIBITION_MARINA_PIER_BOUNDS.maxZ) * 0.5;
  addBox(group, pierW, 0.28, pierD, pierWoodMat, pierCX, 0.3, pierCZ, false, true);
  // Concrete Marine Pilings + Mooring Bollards + Pier Lanterns
  for (let px = 256; px <= 278; px += 7) {
    for (const pz of [232.0, 248.0]) {
      const piling = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.32, 3.2, 8)), seawallConcreteMat);
      piling.position.set(px, -1.2, pz);
      group.add(piling);
      // Warm marine pier bollard lamp
      addBox(group, 0.26, 0.9, 0.26, mullionMat, px, 0.85, pz);
      addBox(group, 0.28, 0.22, 0.28, warmLedMat, px, 1.38, pz, false, false);
    }
  }
  // Open-Water Ocean Test Course Channel Buoys (Red/Green floating markers east of Marina!)
  const buoyRedMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 0.6 }));
  const buoyGreenMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x22c55e, emissiveIntensity: 0.6 }));
  for (let bi = 0; bi < 4; bi++) {
    const bx = 302 + bi * 22;
    const b1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.55, 1.6, 8)), buoyRedMat);
    b1.position.set(bx, 0.1, 224);
    const b2 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.55, 1.6, 8)), buoyGreenMat);
    b2.position.set(bx, 0.1, 262);
    group.add(b1, b2);
  }

  // =========================================================================
  // 5. EXTERIOR TESTING ENVIRONMENTS — DRIVING CIRCUIT & OCEAN AVIATION RUNWAY
  // =========================================================================
  // A. LAND DRIVING CIRCUIT & OFF-ROAD TEST PAD (x: 156..196, z: 258..296)
  const cx = EXHIBITION_LAND_CIRCUIT_CENTER.x;
  const cz = EXHIBITION_LAND_CIRCUIT_CENTER.z;
  addBox(group, 38, 0.06, 36, asphaltMat, cx, EXHIBITION_DECK_Y + 0.03, cz, false, true);
  // Inner emerald grass infield island inside the oval track
  const infieldMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x457342, roughness: 0.9 }));
  addBox(group, 21, 0.1, 18, infieldMat, cx, EXHIBITION_DECK_Y + 0.06, cz, false, true);
  // Red/White racing kerbs around infield corners
  for (let ki = 0; ki < 10; ki++) {
    const km = ki % 2 === 0 ? redSteelMat : whitePaintMat;
    addBox(group, 2.0, 0.14, 0.65, km, cx - 9 + ki * 2.0, EXHIBITION_DECK_Y + 0.08, cz - 9.2, false, false);
    addBox(group, 2.0, 0.14, 0.65, km, cx - 9 + ki * 2.0, EXHIBITION_DECK_Y + 0.08, cz + 9.2, false, false);
  }
  // Start/Finish Gantry Arch ("TEST TRACK")
  addBox(group, 0.35, 5.2, 0.35, redSteelMat, cx - 3.2, EXHIBITION_DECK_Y + 2.6, cz - 13.8);
  addBox(group, 0.35, 5.2, 0.35, redSteelMat, cx + 3.2, EXHIBITION_DECK_Y + 2.6, cz - 13.8);
  const trackSignTex = trackTex(
    makeCanvasSignTexture('EXHIBITION TEST CIRCUIT', 'LAND DRIVING & OFF-ROAD PAD', '#181e2a', '#ffffff', '#f59e0b', 512, 128)
  );
  const trackSignMat = trackMat(new THREE.MeshStandardMaterial({ map: trackSignTex, roughness: 0.35 }));
  addBox(group, 7.2, 1.3, 0.3, trackSignMat, cx, EXHIBITION_DECK_Y + 4.9, cz - 13.8);
  // Off-Road Timber/Gravel Test Strip along west side of circuit
  const dirtMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x8b6c4a, roughness: 0.94 }));
  addBox(group, 4.5, 0.12, 22, dirtMat, 160.5, EXHIBITION_DECK_Y + 0.06, cz, false, true);
  for (let h = 0; h < 5; h++) {
    addBox(group, 4.1, 0.24, 1.1, dirtMat, 160.5, EXHIBITION_DECK_Y + 0.14, cz - 8 + h * 4, false, true);
  }

  // B. OCEAN AVIATION RUNWAY, TAXIWAY APRON & HELIPAD (x: 198..252, z: 256..298)
  const rx = EXHIBITION_RUNWAY_CENTER.x;
  const rz = EXHIBITION_RUNWAY_CENTER.z;
  addBox(group, 52, 0.07, 40, asphaltMat, rx, EXHIBITION_DECK_Y + 0.035, rz, false, true);
  // Runway centerline dashes (East-West along z = 286)
  for (let rd = 0; rd < 7; rd++) {
    addBox(group, 4.4, 0.09, 0.45, whitePaintMat, 203 + rd * 7.2, EXHIBITION_DECK_Y + 0.04, 286, false, false);
  }
  // Runway threshold piano keys on both ends
  for (let pk = -2; pk <= 2; pk++) {
    addBox(group, 2.2, 0.09, 0.5, whitePaintMat, 200.5, EXHIBITION_DECK_Y + 0.04, 286 + pk * 1.4, false, false);
    addBox(group, 2.2, 0.09, 0.5, whitePaintMat, 250.0, EXHIBITION_DECK_Y + 0.04, 286 + pk * 1.4, false, false);
  }
  // Glowing blue/amber runway edge lights
  for (let rl = 0; rl < 8; rl++) {
    const rlx = 200 + rl * 7.2;
    addBox(group, 0.25, 0.35, 0.25, coolLedMat, rlx, EXHIBITION_DECK_Y + 0.2, 277.5, false, false);
    addBox(group, 0.25, 0.35, 0.25, warmLedMat, rlx, EXHIBITION_DECK_Y + 0.2, 294.5, false, false);
  }
  // Bold Illuminated Aviation Helipad ("H") right outside Hangar Doors!
  const helipadTex = trackTex(makeHelipadTexture());
  const helipadMat = trackMat(new THREE.MeshStandardMaterial({ map: helipadTex, roughness: 0.55 }));
  const helipad = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(5.6, 5.8, 0.14, 24)), helipadMat);
  helipad.position.set(EXHIBITION_HELIPAD_POS.x, EXHIBITION_HELIPAD_POS.y, EXHIBITION_HELIPAD_POS.z);
  helipad.receiveShadow = true;
  group.add(helipad);

  // =========================================================================
  // 6. DISPLAYED COMPOSITE 3D SHOWROOM VEHICLES (ALL 12 DISCOVERED VEHICLES!)
  // =========================================================================
  const displayWrappers: Partial<Record<ExhibitionVehicleId, THREE.Group>> = {};
  const animatedTurntables: THREE.Group[] = [];
  const animatedRotors: THREE.Object3D[] = [];

  const makePlinth = (x: number, y: number, z: number, radius: number, label: string, sublabel: string) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, y, z);
    const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(radius, radius + 0.2, 0.16, 24)), claddingDarkMat);
    base.position.y = -0.08;
    const rim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(radius + 0.05, 0.04, 6, 28)), warmLedMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.0;
    pGroup.add(base, rim);

    // Compact architectural info placard pedestal beside display
    const cardTex = trackTex(makeCanvasSignTexture(label, sublabel, '#111827', '#f8fafc', '#f5c36c', 512, 160));
    const cardMat = trackMat(new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.35 }));
    addBox(pGroup, 0.12, 1.05, 0.12, mullionMat, radius + 0.5, 0.52, -0.4);
    const card = addBox(pGroup, 1.35, 0.48, 0.08, cardMat, radius + 0.5, 1.12, -0.4);
    card.rotation.x = -0.42;
    group.add(pGroup);
    return pGroup;
  };

  // Helper composite builders matching DREAMLINE's exact vehicles
  const buildShowcaseModel = (id: ExhibitionVehicleId): THREE.Group => {
    const g = new THREE.Group();
    if (id === 'rural_bus') {
      const teal = trackMat(new THREE.MeshStandardMaterial({ color: 0x2c7873, roughness: 0.42 }));
      const cream = trackMat(new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.45 }));
      const trim = trackMat(new THREE.MeshStandardMaterial({ color: 0xd98a4a, roughness: 0.48 }));
      const wheelMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2026, roughness: 0.9 }));
      addBox(g, 2.2, 0.95, 6.6, teal, 0, 0.95, 0);
      addBox(g, 2.24, 0.16, 6.64, trim, 0, 1.48, 0);
      addBox(g, 2.18, 1.05, 6.5, cream, 0, 2.05, 0);
      addBox(g, 2.22, 0.72, 5.1, curtainGlassMat, 0, 2.02, -0.1, false, false);
      for (const wx of [-1.05, 1.05]) {
        for (const wz of [-2.0, 2.0]) {
          const w = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 12)), wheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.42, wz);
          g.add(w);
        }
      }
      g.scale.setScalar(0.84);
    } else if (id === 'safari_car') {
      const sand = trackMat(new THREE.MeshStandardMaterial({ color: 0xc29b58, roughness: 0.55 }));
      const dark = trackMat(new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.75 }));
      addBox(g, 1.95, 0.68, 4.1, sand, 0, 0.75, 0);
      addBox(g, 1.75, 0.58, 1.5, sand, 0, 1.05, 1.15);
      addBox(g, 1.8, 0.78, 0.1, curtainGlassMat, 0, 1.48, 0.55, false, false);
      // Roll cage bars
      for (const rx of [-0.82, 0.82]) {
        addBox(g, 0.08, 0.95, 0.08, dark, rx, 1.52, -1.55);
        addBox(g, 0.08, 0.95, 0.08, dark, rx, 1.52, 0.45);
        addBox(g, 0.08, 0.08, 2.1, dark, rx, 1.98, -0.55);
      }
      for (const wx of [-0.98, 0.98]) {
        for (const wz of [-1.25, 1.25]) {
          const w = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.34, 12)), dark);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.46, wz);
          g.add(w);
        }
      }
    } else if (id === 'dreamline_train') {
      const cream = trackMat(new THREE.MeshStandardMaterial({ color: 0xf6efe1, roughness: 0.38 }));
      const green = trackMat(new THREE.MeshStandardMaterial({ color: 0x2d6a56, roughness: 0.42 }));
      const roof = trackMat(new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5 }));
      // Indoor exhibition rail spur underneath showcase carriage
      addBox(g, 1.9, 0.14, 7.6, claddingDarkMat, 0, 0.07, 0);
      addBox(g, 2.35, 1.15, 6.8, green, 0, 0.92, 0);
      addBox(g, 2.32, 1.18, 6.75, cream, 0, 2.02, 0);
      addBox(g, 2.38, 0.78, 5.6, curtainGlassMat, 0, 2.02, 0, false, false);
      addBox(g, 2.2, 0.25, 6.6, roof, 0, 2.72, 0);
      addBox(g, 0.5, 0.26, 0.12, warmLedMat, 0, 1.3, 3.42, false, false);
      g.scale.setScalar(0.82);
    } else if (id === 'commuter_bicycle') {
      const frame = trackMat(new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.6 }));
      const tire = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2026, roughness: 0.85 }));
      for (const wz of [-0.62, 0.62]) {
        const wheel = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.36, 0.05, 8, 18)), tire);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(0, 0.38, wz);
        g.add(wheel);
      }
      addBox(g, 0.06, 0.08, 1.15, frame, 0, 0.72, 0);
      addBox(g, 0.06, 0.62, 0.06, frame, 0, 0.72, 0.48);
      addBox(g, 0.65, 0.05, 0.05, frame, 0, 1.02, 0.48);
      addBox(g, 0.34, 0.24, 0.28, canopyWoodSlatMat, 0, 0.86, 0.68);
      g.scale.setScalar(1.35);
    } else if (id === 'olga_camper') {
      const sage = trackMat(new THREE.MeshStandardMaterial({ color: 0x9ec5ab, roughness: 0.42 }));
      const cream = trackMat(new THREE.MeshStandardMaterial({ color: 0xf7f1e3, roughness: 0.44 }));
      const wheelMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1f2229, roughness: 0.88 }));
      addBox(g, 2.05, 0.92, 4.7, sage, 0, 0.82, 0);
      addBox(g, 2.0, 0.88, 4.5, cream, 0, 1.68, -0.05);
      addBox(g, 2.04, 0.62, 3.6, curtainGlassMat, 0, 1.68, 0.1, false, false);
      // Pop-top camper roof raised slightly for showroom elegance
      const popRoof = addBox(g, 1.85, 0.16, 3.2, cream, 0, 2.48, -0.15);
      popRoof.rotation.x = -0.14;
      for (const lx of [-0.65, 0.65]) {
        const hl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10)), warmLedMat);
        hl.rotation.x = Math.PI / 2;
        hl.position.set(lx, 0.86, 2.38);
        g.add(hl);
      }
      for (const wx of [-0.96, 0.96]) {
        for (const wz of [-1.4, 1.4]) {
          const w = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 12)), wheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.38, wz);
          g.add(w);
        }
      }
    } else if (id === 'cruiser_skateboard') {
      const deck = trackMat(new THREE.MeshStandardMaterial({ map: textures.woodAlbedo, color: 0xd99b56, roughness: 0.5 }));
      const wheelMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }));
      addBox(g, 0.42, 0.06, 1.45, deck, 0, 0.56, 0);
      for (const wx of [-0.18, 0.18]) {
        for (const wz of [-0.46, 0.46]) {
          const w = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 10)), wheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.46, wz);
          g.add(w);
        }
      }
      g.scale.setScalar(1.65);
    } else if (id === 'sky_explorer') {
      // Full-scale hero SSJ Tropical Sky Explorer inside the Industrial Aviation Hangar!
      const bamboo = trackMat(new THREE.MeshStandardMaterial({ map: textures.woodAlbedo, color: 0xc2955d, roughness: 0.65 }));
      const sailMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf7efe0, roughness: 0.78, side: THREE.DoubleSide }));
      const turbineMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.72 }));
      const goldMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.75 }));
      // Twin pontoons + wooden raft deck
      for (const px of [-1.55, 1.55]) {
        const pt = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 5.4, 12)), bamboo);
        pt.rotation.x = Math.PI / 2;
        pt.position.set(px, 0.38, 0);
        g.add(pt);
      }
      addBox(g, 3.3, 0.24, 4.4, bamboo, 0, 0.72, 0);
      // Central Mast + Billowing Sail + Golden SSJ Pennant
      const mast = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.12, 4.8, 8)), bamboo);
      mast.position.set(0, 3.1, 0.3);
      g.add(mast);
      addBox(g, 2.9, 2.8, 0.08, sailMat, 0, 3.3, 0.45);
      addBox(g, 0.06, 0.45, 1.25, goldMat, 0, 5.45, -0.35);
      // 4 Outrigger Lift Turbine Rings & Spinning Propellers
      for (const [rx, rz] of [
        [-2.4, -2.0],
        [2.4, -2.0],
        [-2.4, 2.0],
        [2.4, 2.0],
      ]) {
        addBox(g, Math.abs(rx), 0.14, 0.16, turbineMat, rx * 0.5, 0.85, rz * 0.85);
        const ring = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.75, 0.09, 8, 18)), turbineMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(rx, 0.92, rz);
        g.add(ring);
        const rotor = new THREE.Group();
        rotor.position.set(rx, 0.95, rz);
        addBox(rotor, 1.3, 0.05, 0.14, goldMat, 0, 0, 0, false, false);
        addBox(rotor, 0.14, 0.05, 1.3, goldMat, 0, 0, 0, false, false);
        g.add(rotor);
        animatedRotors.push(rotor);
      }
      g.scale.setScalar(1.22);
    } else if (id === 'lake_boat' || id === 'coastal_boat') {
      const hullColor = id === 'lake_boat' ? 0x355c7d : 0x2d6e82;
      const hullMat = trackMat(new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.55 }));
      addBox(g, 1.55, 0.52, 4.1, hullMat, 0, 0.36, 0);
      addBox(g, 1.35, 0.12, 0.45, pierWoodMat, 0, 0.58, -0.6);
      addBox(g, 1.35, 0.12, 0.45, pierWoodMat, 0, 0.58, 0.6);
    } else {
      // Waterfront live moored vessels (sovereign_ship, bamboo_catamaran, tribal_outrigger)
      // Place an illuminated marina berth exhibition pedestal right on the pier beside them!
      addBox(g, 0.25, 1.3, 0.25, mullionMat, 0, 0.65, 0);
      addBox(g, 1.2, 0.45, 0.14, warmLedMat, 0, 1.45, 0, false, false);
    }
    return g;
  };

  for (const entry of EXHIBITION_VEHICLE_CATALOG) {
    const isLiveMarinaShip =
      entry.id === 'sovereign_ship' ||
      entry.id === 'bamboo_catamaran' ||
      entry.id === 'tribal_outrigger';

    if (!isLiveMarinaShip) {
      const plinthRadius =
        entry.id === 'sky_explorer'
          ? 5.2
          : entry.id === 'rural_bus' || entry.id === 'dreamline_train'
          ? 3.8
          : entry.id === 'olga_camper' || entry.id === 'safari_car'
          ? 3.0
          : 2.0;
      makePlinth(
        entry.displayPos.x,
        entry.displayPos.y,
        entry.displayPos.z,
        plinthRadius,
        entry.name.toUpperCase(),
        `${entry.zoneLabel} · [E] Inspect / Test`
      );
      const wrapper = new THREE.Group();
      wrapper.position.set(entry.displayPos.x, entry.displayPos.y, entry.displayPos.z);
      wrapper.rotation.y = entry.displayPos.heading;
      const model = buildShowcaseModel(entry.id);
      wrapper.add(model);
      group.add(wrapper);
      displayWrappers[entry.id] = wrapper;

      if (entry.id === 'olga_camper' || entry.id === 'cruiser_skateboard') {
        animatedTurntables.push(wrapper);
      }

      interactables.push({
        id: `exhibition_vehicle_${entry.id}`,
        kind: 'exhibition_vehicle',
        label: `Inspect / Test ${entry.name}`,
        sublabel: `${entry.zoneLabel} · Enter, Test, Spawn or View Specs`,
        x: entry.displayPos.x,
        y: entry.displayPos.y + 1.0,
        z: entry.displayPos.z,
        radius: entry.id === 'sky_explorer' ? 7.2 : 5.2,
        locationId: 'exhibition_complex',
        metaId: entry.id,
      });
    } else {
      // Marina Berth interactive inspection kiosks on the wooden Marina Pier right beside the boats!
      const kioskX = entry.id === 'sovereign_ship' ? 278.5 : 263.5;
      const kioskZ = entry.id === 'sovereign_ship' ? 241.0 : entry.id === 'bamboo_catamaran' ? 232.2 : 247.8;
      makePlinth(
        kioskX,
        0.46,
        kioskZ,
        1.1,
        entry.name.toUpperCase(),
        `MARINA BERTH · [E] Inspect / Sail`
      );
      interactables.push({
        id: `exhibition_vehicle_${entry.id}`,
        kind: 'exhibition_vehicle',
        label: `Inspect / Test ${entry.name}`,
        sublabel: `${entry.floorLabel} · Enter, Sail Test Route, or View Specs`,
        x: kioskX,
        y: 1.4,
        z: kioskZ,
        radius: 5.8,
        locationId: 'exhibition_complex',
        metaId: entry.id,
      });
    }
  }

  // Aviation Hangar Discovery & Expansion Bay Info Board (Honest transparency per Part 4 & 11)
  const aviationBoardTex = trackTex(
    makeCanvasSignTexture(
      'ZONE B · DISCOVERED AIRCRAFT: SSJ SKY EXPLORER',
      'BAYS B2 & B3 RESERVED FOR FUTURE AIRCRAFT EXPANSION',
      '#111827',
      '#f8fafc',
      '#38bdf8',
      1024,
      200
    )
  );
  const aviationBoardMat = trackMat(new THREE.MeshStandardMaterial({ map: aviationBoardTex, roughness: 0.35 }));
  addBox(hGroup, 7.2, 1.5, 0.16, aviationBoardMat, -10.5, HANGAR_FLOOR_Y + 2.4, -hD / 2 + 7.2);

  return {
    group,
    colliders,
    interactables,
    setVehicleDisplayStatus: (vehicleId, onDisplay) => {
      const w = displayWrappers[vehicleId];
      if (w) w.visible = onDisplay;
    },
    update: (elapsed, lanternStrength, playerX, playerZ) => {
      const dist = Math.hypot(playerX - EXHIBITION_ISLAND_CENTER.x, playerZ - EXHIBITION_ISLAND_CENTER.z);
      const nearCampus = dist < 210;
      // Rotate luxury turntable displays & idle hangar propellers smoothly when nearby
      if (nearCampus) {
        for (const tt of animatedTurntables) {
          tt.rotation.y += 0.004;
        }
        for (const rotor of animatedRotors) {
          rotor.rotation.y = elapsed * 2.2;
        }
      }
      // Subtle night-time architectural lighting boost
      warmLedMat.emissiveIntensity = 1.2 + lanternStrength * 1.4;
      coolLedMat.emissiveIntensity = 1.0 + lanternStrength * 1.1;
      mainSignMat.emissiveIntensity = 0.52 + lanternStrength * 0.65;
    },
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
