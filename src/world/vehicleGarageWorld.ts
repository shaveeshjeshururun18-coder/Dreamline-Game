import * as THREE from 'three';
import { VEHICLE_GARAGE_CENTER, VEHICLE_GARAGE_SPAWN_BAY } from '../game/skyExplorer';
import { groundHeightAt, type AabbCollider } from '../game/terrain';
import type { InteractableItem } from '../game/types';

export interface VehicleGarageWorldHandle {
  group: THREE.Group;
  interactable: InteractableItem;
  colliders: AabbCollider[];
  update: (elapsed: number) => void;
  dispose: () => void;
}

function makeGarageSignTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, c.width, c.height);

  // Amber racing accent stripes
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, c.width, 16);
  ctx.fillRect(0, c.height - 16, c.width, 16);

  // Badge on left
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(28, 36, 120, 120, 18);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 58px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', 88, 98);

  // Main title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 56px system-ui, sans-serif';
  ctx.fillText('DREAMLINE VEHICLE GARAGE', 176, 80);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText('WALK-IN SPAWNING BAY · CARS · JEEPS · AIRCRAFT · BOATS', 178, 134);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBayFloorTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Outer amber dashed safety ring
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 18;
  ctx.setLineDash([28, 16]);
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner cyan turntable glow ring
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(256, 256, 178, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair arrows
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '900 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPAWN PAD', 256, 232);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('DRIVE-OUT READY', 256, 286);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the spacious 3-Bay Walk-In Dreamline Vehicle Spawning Garage west of En Illam at (-42, -4):
 * - Illuminated circular Vehicle Spawn Turntable Pad right at the front drive-out bay
 * - Modern dark-slate steel portal frame with 3 open roll-up service bays
 * - Glowing overhead "DREAMLINE VEHICLE GARAGE" marquee + warm interior shop light bars
 * - Tool cabinets, spare wheel rack, and glowing Vehicle Spawner Console pedestal
 */
export function buildVehicleGarageWorld(isSoftwareGl: boolean): VehicleGarageWorldHandle {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const gx = VEHICLE_GARAGE_CENTER.x;
  const gz = VEHICLE_GARAGE_CENTER.z;
  const gy = groundHeightAt(gx, gz);
  group.position.set(gx, gy, gz);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.86, metalness: 0.08 });
  const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.42 });
  const trimSteelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.38, metalness: 0.65 });
  const amberAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.55,
    roughness: 0.2,
  });
  const warmLedMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde68a,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });
  const redToolMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42, metalness: 0.32 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  const bayFloorTex = makeBayFloorTex();
  const signTex = makeGarageSignTex();
  const bayFloorMat = new THREE.MeshStandardMaterial({ map: bayFloorTex, roughness: 0.6, metalness: 0.14 });
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  disposables.push(
    concreteMat,
    darkSlateMat,
    trimSteelMat,
    amberAccentMat,
    cyanGlowMat,
    warmLedMat,
    redToolMat,
    tireMat,
    bayFloorTex,
    signTex,
    bayFloorMat,
    signMat
  );

  // 1. Concrete Foundation Apron (22m wide x 16m deep)
  const apronGeo = new THREE.BoxGeometry(22.0, 0.2, 16.5);
  const apron = new THREE.Mesh(apronGeo, concreteMat);
  apron.position.set(0, 0.1, 1.5);
  apron.receiveShadow = true;
  group.add(apron);
  disposables.push(apronGeo);

  // 2. Illuminated Circular Vehicle Spawning Turntable Pad in the Center Front Bay
  const padGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.12, 28);
  const pad = new THREE.Mesh(padGeo, [trimSteelMat, bayFloorMat, trimSteelMat]);
  pad.position.set(VEHICLE_GARAGE_SPAWN_BAY.x - gx, 0.22, VEHICLE_GARAGE_SPAWN_BAY.z - gz);
  pad.receiveShadow = true;
  group.add(pad);
  disposables.push(padGeo);

  const ringGeo = new THREE.TorusGeometry(4.32, 0.07, 8, 32);
  const padRing = new THREE.Mesh(ringGeo, cyanGlowMat);
  padRing.rotation.x = Math.PI / 2;
  padRing.position.set(VEHICLE_GARAGE_SPAWN_BAY.x - gx, 0.29, VEHICLE_GARAGE_SPAWN_BAY.z - gz);
  group.add(padRing);
  disposables.push(ringGeo);

  // 3. Architectural 3-Bay Steel Garage Structure (Open Front South Face z = +4.2)
  const backWallGeo = new THREE.BoxGeometry(20.4, 6.2, 0.45);
  const backWall = new THREE.Mesh(backWallGeo, darkSlateMat);
  backWall.position.set(0, 3.2, -5.8);
  backWall.castShadow = !isSoftwareGl;
  backWall.receiveShadow = true;
  group.add(backWall);

  const sideWallGeo = new THREE.BoxGeometry(0.45, 6.2, 10.4);
  for (const sx of [-10.0, 10.0]) {
    const sw = new THREE.Mesh(sideWallGeo, darkSlateMat);
    sw.position.set(sx, 3.2, -0.8);
    sw.castShadow = !isSoftwareGl;
    sw.receiveShadow = true;
    group.add(sw);
  }

  // Sloped Modern Cantilever Roof + Overhang Canopy
  const roofGeo = new THREE.BoxGeometry(21.4, 0.42, 13.0);
  const roof = new THREE.Mesh(roofGeo, darkSlateMat);
  roof.position.set(0, 6.45, -0.2);
  roof.castShadow = !isSoftwareGl;
  roof.receiveShadow = true;
  group.add(roof);

  // Front Fascia Trim & Glowing Marquee Sign
  const fasciaGeo = new THREE.BoxGeometry(21.4, 1.35, 0.35);
  const fascia = new THREE.Mesh(fasciaGeo, trimSteelMat);
  fascia.position.set(0, 6.95, 6.2);
  group.add(fascia);

  const signGeo = new THREE.PlaneGeometry(15.2, 2.55);
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 7.65, 6.42);
  group.add(signMesh);

  // 4 Structural Front Columns Framing 3 Wide Drive-Through Service Bays (each 6.2m wide!)
  const pillarGeo = new THREE.BoxGeometry(0.55, 6.2, 0.55);
  for (const px of [-9.9, -3.5, 3.5, 9.9]) {
    const p = new THREE.Mesh(pillarGeo, trimSteelMat);
    p.position.set(px, 3.2, 4.35);
    p.castShadow = !isSoftwareGl;
    group.add(p);

    // Amber safety stripe on lower column
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), amberAccentMat);
    stripe.position.set(px, 1.15, 4.35);
    group.add(stripe);
  }

  // Partially Rolled-Up Metallic Service Bay Doors tucked neatly at the top of each bay
  const rollupGeo = new THREE.BoxGeometry(5.8, 0.72, 0.25);
  for (const bx of [-6.7, 0, 6.7]) {
    const door = new THREE.Mesh(rollupGeo, trimSteelMat);
    door.position.set(bx, 5.78, 4.35);
    group.add(door);

    // Overhead warm LED shop light tube per bay
    const led = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 0.24), warmLedMat);
    led.position.set(bx, 6.18, -0.4);
    group.add(led);
  }

  // 4. Workshop Interior Props (Red Mechanic Tool Chests & Spare Tire Stack against back wall)
  const chestGeo = new THREE.BoxGeometry(2.2, 1.45, 0.9);
  for (const cx of [-7.4, 7.4]) {
    const chest = new THREE.Mesh(chestGeo, redToolMat);
    chest.position.set(cx, 0.92, -4.9);
    group.add(chest);
  }
  const tireGeo = new THREE.TorusGeometry(0.42, 0.18, 8, 16);
  for (let i = 0; i < 4; i++) {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(-4.2, 0.36 + i * 0.32, -4.85);
    group.add(tire);
  }

  // 5. Interactive Glowing Vehicle Spawner Console Pedestal right beside the front right bay
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(6.2, 0.2, 5.2);
  const pedGeo = new THREE.BoxGeometry(1.15, 1.35, 0.75);
  const ped = new THREE.Mesh(pedGeo, darkSlateMat);
  ped.position.y = 0.68;
  const screenGeo = new THREE.BoxGeometry(1.02, 0.68, 0.12);
  const screen = new THREE.Mesh(screenGeo, cyanGlowMat);
  screen.position.set(0, 1.52, 0.08);
  screen.rotation.x = -0.32;
  const beaconOrbGeo = new THREE.OctahedronGeometry(0.22, 0);
  const beaconOrb = new THREE.Mesh(beaconOrbGeo, amberAccentMat);
  beaconOrb.position.set(0, 2.25, 0);
  consoleGroup.add(ped, screen, beaconOrb);
  group.add(consoleGroup);

  disposables.push(
    backWallGeo,
    sideWallGeo,
    roofGeo,
    fasciaGeo,
    signGeo,
    pillarGeo,
    rollupGeo,
    chestGeo,
    tireGeo,
    pedGeo,
    screenGeo,
    beaconOrbGeo
  );

  const interactable: InteractableItem = {
    id: 'vehicle_garage_spawner',
    kind: 'vehicle_garage_console',
    label: 'Open Vehicle Spawning Garage',
    sublabel: 'வாகன கேரேஜ் · Spawn any car, jeep, jet ski, boat or aircraft right in this bay!',
    x: gx + 6.2,
    y: gy + 1.3,
    z: gz + 5.2,
    radius: 5.5,
    locationId: 'vehicle_garage',
  };

  // Colliders for the back wall and side walls (front 3 bays stay 100% open & drivable!)
  const colliders: AabbCollider[] = [
    { id: 'garage_back_wall', minX: gx - 10.2, maxX: gx + 10.2, minZ: gz - 6.1, maxZ: gz - 5.5 },
    { id: 'garage_west_wall', minX: gx - 10.3, maxX: gx - 9.7, minZ: gz - 6.0, maxZ: gz + 4.4 },
    { id: 'garage_east_wall', minX: gx + 9.7, maxX: gx + 10.3, minZ: gz - 6.0, maxZ: gz + 4.4 },
  ];

  return {
    group,
    interactable,
    colliders,
    update: (elapsed: number) => {
      beaconOrb.rotation.y = elapsed * 1.8;
      beaconOrb.position.y = 2.25 + Math.sin(elapsed * 2.8) * 0.14;
      cyanGlowMat.emissiveIntensity = 1.35 + Math.sin(elapsed * 2.4) * 0.25;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
