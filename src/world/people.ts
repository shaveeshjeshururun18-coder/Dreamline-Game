import * as THREE from 'three';
import type { InteractableItem } from '../game/types';
import {
  COAST_CENTER,
  ENCHANTED_FOREST_CENTER,
  groundHeightAt,
  HOME_CENTER,
  VILLAGE_CENTER,
  walkableHeightAt,
} from '../game/terrain';
import { STATIONS } from '../game/railway';

interface NpcSpec {
  id: string;
  name: string;
  tamilRole: string;
  x: number;
  z: number;
  patrolRadius: number;
  patrolSpeed: number;
  shirtHex: number;
  pantsHex: number;
  hairHex: number;
  skinHex: number;
  hasCap?: boolean;
  capHex?: number;
  greeting: string;
  locationId: string;
}

interface NpcInstance {
  spec: NpcSpec;
  root: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Group;
  phase: number;
  waveTimer: number;
  prompt: InteractableItem;
}

export interface WorldPeopleSystem {
  group: THREE.Group;
  interactables: InteractableItem[];
  update: (elapsed: number, dt: number, playerX: number, playerZ: number) => void;
  greetNpc: (npcId: string) => { name: string; line: string } | null;
  dispose: () => void;
}

/**
 * Populates DREAMLINE with friendly animated 3D people:
 * - Station Master & waiting passengers at ஷவீஷ் ஜெஷுருன் சா + all 4 other railway stations
 * - Neighbors strolling in Nila Gramam & near En Illam Home
 * - Coastal visitors at Kadalkarai Beach
 * - Winter explorers in Panimalai Iceland & nature lovers near Mayavanam Enchanted Forest
 */
export function buildWorldPeople(isSoftwareGl: boolean): WorldPeopleSystem {
  const group = new THREE.Group();
  const interactables: InteractableItem[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const lakeSt = STATIONS.find((s) => s.id === 'aomizu_lakeside');
  const pachaiSt = STATIONS.find((s) => s.id === 'pachai_meadow_halt');
  const kazeSt = STATIONS.find((s) => s.id === 'kaze_no_oka');
  const iceSt = STATIONS.find((s) => s.id === 'iceland_gateway');

  const specs: NpcSpec[] = [
    // 1. ஷவீஷ் ஜெஷுருன் சா Main Station (Station Master + 3 friendly waiting passengers!)
    {
      id: 'npc_station_master',
      name: 'Station Master Selvam',
      tamilRole: 'நிலைய அதிகாரி செல்வம்',
      x: -5.2,
      z: 14.3,
      patrolRadius: 1.4,
      patrolSpeed: 0.32,
      shirtHex: 0x243b66,
      pantsHex: 0x1c2436,
      hairHex: 0x262228,
      skinHex: 0xe6b898,
      hasCap: true,
      capHex: 0x1d3258,
      greeting: 'Vanakkam! Dreamline Scenic Express (DL-402) is running right on schedule. Check the departure map anytime!',
      locationId: 'sakuragawa_station',
    },
    {
      id: 'npc_passenger_meera',
      name: 'Meera (Traveller)',
      tamilRole: 'பயணி மீரா',
      x: 4.5,
      z: 14.4,
      patrolRadius: 1.1,
      patrolSpeed: 0.25,
      shirtHex: 0xd96b96,
      pantsHex: 0x5c365c,
      hairHex: 0x1d1820,
      skinHex: 0xecc2a4,
      greeting: 'I love watching the pink sunset clouds from ஷவீஷ் ஜெஷுருன் சா platform before boarding the express!',
      locationId: 'sakuragawa_station',
    },
    {
      id: 'npc_passenger_karthik',
      name: 'Karthik (Student)',
      tamilRole: 'மாணவன் கார்த்திக்',
      x: -1.4,
      z: 19.6,
      patrolRadius: 2.2,
      patrolSpeed: 0.35,
      shirtHex: 0x3b8c7c,
      pantsHex: 0x2f3848,
      hairHex: 0x221d24,
      skinHex: 0xdca884,
      greeting: 'The rural bus stops right outside the station plaza — it takes you all the way to Kadalkarai Beach!',
      locationId: 'sakuragawa_station',
    },
    {
      id: 'npc_passenger_ananya',
      name: 'Ananya (Painter)',
      tamilRole: 'ஓவியர் அனன்யா',
      x: 8.2,
      z: 14.2,
      patrolRadius: 0.9,
      patrolSpeed: 0.22,
      shirtHex: 0xe8a84c,
      pantsHex: 0x4b425c,
      hairHex: 0x241d26,
      skinHex: 0xf0c9ad,
      greeting: 'Have you seen the pastel pink camper van Olga waiting in Mayavanam Enchanted Forest to the west?',
      locationId: 'sakuragawa_station',
    },

    // 2. Nila Gramam & En Illam Neighborhood
    {
      id: 'npc_neighbor_arun',
      name: 'Neighbor Arun',
      tamilRole: 'அண்டைவீட்டார் அருண்',
      x: HOME_CENTER.x + 7.4,
      z: HOME_CENTER.z + 10.5,
      patrolRadius: 2.4,
      patrolSpeed: 0.34,
      shirtHex: 0x4f78b8,
      pantsHex: 0x4e483f,
      hairHex: 0x1f1c22,
      skinHex: 0xdba986,
      greeting: 'Hello neighbor! Your En Illam home looks so warm with the balcony fairy lights glowing tonight.',
      locationId: 'my_home',
    },
    {
      id: 'npc_village_kavya',
      name: 'Kavya (Baker)',
      tamilRole: 'கிராமவாசி காவியா',
      x: VILLAGE_CENTER.x + 2.5,
      z: VILLAGE_CENTER.z - 2.0,
      patrolRadius: 2.8,
      patrolSpeed: 0.38,
      shirtHex: 0xc95a6e,
      pantsHex: 0x3b445e,
      hairHex: 0x211b21,
      skinHex: 0xe9bfa1,
      greeting: 'Fresh filter kaapi and warm snacks are ready in Nila Gramam! Frosty always makes everyone smile.',
      locationId: 'japanese_village',
    },
    {
      id: 'npc_village_ravi',
      name: 'Ravi (Cyclist)',
      tamilRole: 'கிராமவாசி ரவி',
      x: VILLAGE_CENTER.x - 5.5,
      z: VILLAGE_CENTER.z + 4.8,
      patrolRadius: 2.6,
      patrolSpeed: 0.4,
      shirtHex: 0x528f5c,
      pantsHex: 0x313640,
      hairHex: 0x262126,
      skinHex: 0xd9a682,
      hasCap: true,
      capHex: 0x355c42,
      greeting: 'Cycling down these blossom lanes in Autumn or Spring feels like stepping right into a painting!',
      locationId: 'japanese_village',
    },

    // 3. Other 4 Railway Stations (Waiting Passengers!)
    {
      id: 'npc_lake_passenger',
      name: 'Deepa (Camper)',
      tamilRole: 'முகாம் பயணி தீபா',
      x: (lakeSt?.platformX ?? 52) - 1.2,
      z: (lakeSt?.platformZ ?? -4) + 0.5,
      patrolRadius: 1.2,
      patrolSpeed: 0.25,
      shirtHex: 0x6c88c4,
      pantsHex: 0x3a3f4c,
      hairHex: 0x1e1922,
      skinHex: 0xe8bc9e,
      greeting: 'Neelam Lake is so calm today — you can swim straight into the mirror water or take the wooden rowboat!',
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'npc_pachai_farmer',
      name: 'Murugan (Meadow Keeper)',
      tamilRole: 'வயல் காவலர் முருகன்',
      x: (pachaiSt?.platformX ?? 35.5) + 1.4,
      z: (pachaiSt?.platformZ ?? 16.0) - 0.6,
      patrolRadius: 1.4,
      patrolSpeed: 0.28,
      shirtHex: 0x8ea855,
      pantsHex: 0x544a3a,
      hairHex: 0x2c262a,
      skinHex: 0xd29c76,
      greeting: 'Listen to the wind across Pachai Meadow! Try changing the season to Autumn to see the golden-red leaves.',
      locationId: 'open_countryside',
    },
    {
      id: 'npc_kaze_hiker',
      name: 'Nikhil (Hiker)',
      tamilRole: 'மலைப்பயணி நிகில்',
      x: (kazeSt?.platformX ?? -18) + 1.5,
      z: (kazeSt?.platformZ ?? -60) + 0.3,
      patrolRadius: 1.2,
      patrolSpeed: 0.26,
      shirtHex: 0xc97646,
      pantsHex: 0x353c4a,
      hairHex: 0x201c22,
      skinHex: 0xe3b494,
      greeting: 'Thendral Malai breeze is so refreshing. Next stop along the tracks is the Iceland Glacier Gateway!',
      locationId: 'kaze_no_oka',
    },
    {
      id: 'npc_iceland_guide',
      name: 'Priya (Glacier Guide)',
      tamilRole: 'பனிமலை வழிகாட்டி பிரியா',
      x: (iceSt?.platformX ?? -50.5) + 0.8,
      z: (iceSt?.platformZ ?? -24.0) - 1.2,
      patrolRadius: 1.1,
      patrolSpeed: 0.24,
      shirtHex: 0x3f8ec4,
      pantsHex: 0x233044,
      hairHex: 0x231d26,
      skinHex: 0xeec4a7,
      hasCap: true,
      capHex: 0x8ecdf5,
      greeting: 'Inside Panimalai Iceland you can toggle between Giant (23.5m) and Small (1.68m) right beside the 18m Giant Igloo Man!',
      locationId: 'iceland_gateway',
    },

    // 4. Kadalkarai Coast & Beach
    {
      id: 'npc_coast_fisher',
      name: 'Senthil (Boatman)',
      tamilRole: 'படகோட்டி செந்தில்',
      x: COAST_CENTER.x + 2.5,
      z: COAST_CENTER.z - 2.0,
      patrolRadius: 2.2,
      patrolSpeed: 0.32,
      shirtHex: 0x368ba8,
      pantsHex: 0x6e6252,
      hairHex: 0x221d20,
      skinHex: 0xd09a75,
      hasCap: true,
      capHex: 0xf0e4c8,
      greeting: 'Our Kadalkarai Harbour Boat is moored right at the pier — hop aboard or dive in for a refreshing ocean swim!',
      locationId: 'coastal_town',
    },
    {
      id: 'npc_coast_tourist',
      name: 'Divya (Seaside Walker)',
      tamilRole: 'கடற்கரை பயணி திவ்யா',
      x: COAST_CENTER.x - 4.5,
      z: COAST_CENTER.z + 6.5,
      patrolRadius: 2.6,
      patrolSpeed: 0.35,
      shirtHex: 0xf29bb8,
      pantsHex: 0x4d5d82,
      hairHex: 0x1e1820,
      skinHex: 0xedc2a4,
      greeting: 'The turquoise waves and lighthouse glow look magical every evening!',
      locationId: 'coastal_town',
    },

    // 5. Panimalai Iceland Winter Explorers
    {
      id: 'npc_snow_explorer',
      name: 'Vikram (Snow Explorer)',
      tamilRole: 'பனி ஆராய்ச்சியாளர் விக்ரம்',
      x: -82.0,
      z: -74.0,
      patrolRadius: 2.0,
      patrolSpeed: 0.3,
      shirtHex: 0xb84248,
      pantsHex: 0x202838,
      hairHex: 0x1f1c24,
      skinHex: 0xe3b496,
      hasCap: true,
      capHex: 0xe8ecf5,
      greeting: 'Look up at the colossal 18m Giant Igloo Man! Try shrinking to Small mode or growing Giant right here in the snow!',
      locationId: 'snow_mountains',
    },

    // 6. Mayavanam Enchanted Forest Camper Friend
    {
      id: 'npc_enchanted_keeper',
      name: 'Lakshmi (Forest Camper)',
      tamilRole: 'மாயவன முகாம் தோழி லக்ஷ்மி',
      x: ENCHANTED_FOREST_CENTER.x - 1.5,
      z: ENCHANTED_FOREST_CENTER.z + 3.8,
      patrolRadius: 1.5,
      patrolSpeed: 0.25,
      shirtHex: 0xb688d9,
      pantsHex: 0x5c4678,
      hairHex: 0x3b2640,
      skinHex: 0xf3cab2,
      hasCap: true,
      capHex: 0xf5c8e3,
      greeting: 'Welcome to Mayavanam! Olga the Pastel Pink Camper Van is all warmed up and waiting right there for you to drive!',
      locationId: 'enchanted_forest',
    },
  ];

  // Shared geometries for efficient instanced-like lightweight NPCs
  const torsoGeo = new THREE.BoxGeometry(0.42, 0.56, 0.24);
  const headGeo = new THREE.SphereGeometry(0.165, 12, 10);
  const hairGeo = new THREE.SphereGeometry(0.175, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const limbGeo = new THREE.CylinderGeometry(0.062, 0.055, 0.54, 8);
  const legGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.64, 8);
  const capGeo = new THREE.CylinderGeometry(0.17, 0.19, 0.11, 10);
  disposables.push(torsoGeo, headGeo, hairGeo, limbGeo, legGeo, capGeo);

  const npcs: NpcInstance[] = [];

  specs.forEach((spec, idx) => {
    const root = new THREE.Group();
    const baseY = walkableHeightAt(spec.x, spec.z);
    root.position.set(spec.x, baseY, spec.z);

    const shirtMat = new THREE.MeshStandardMaterial({ color: spec.shirtHex, roughness: 0.72 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: spec.pantsHex, roughness: 0.78 });
    const hairMat = new THREE.MeshStandardMaterial({ color: spec.hairHex, roughness: 0.68 });
    const skinMat = new THREE.MeshStandardMaterial({ color: spec.skinHex, roughness: 0.62 });
    disposables.push(shirtMat, pantsMat, hairMat, skinMat);

    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.02;
    torso.castShadow = !isSoftwareGl;
    root.add(torso);

    const head = new THREE.Group();
    head.position.set(0, 1.46, 0);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = !isSoftwareGl;
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.02, -0.015);
    hairMesh.rotation.x = -0.22;
    head.add(headMesh, hairMesh);

    if (spec.hasCap) {
      const capMat = new THREE.MeshStandardMaterial({
        color: spec.capHex ?? 0x243b66,
        roughness: 0.65,
      });
      disposables.push(capMat);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 0.14, 0.01);
      head.add(cap);
    }
    root.add(head);

    const leftArm = new THREE.Group();
    leftArm.position.set(0.28, 1.24, 0);
    const lArmMesh = new THREE.Mesh(limbGeo, shirtMat);
    lArmMesh.position.y = -0.24;
    leftArm.add(lArmMesh);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(-0.28, 1.24, 0);
    const rArmMesh = new THREE.Mesh(limbGeo, shirtMat);
    rArmMesh.position.y = -0.24;
    rightArm.add(rArmMesh);
    root.add(rightArm);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.11, 0.68, 0);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.32;
    leftLeg.add(lLegMesh);
    root.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.11, 0.68, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.32;
    rightLeg.add(rLegMesh);
    root.add(rightLeg);

    group.add(root);

    const prompt: InteractableItem = {
      id: spec.id,
      kind: 'npc_talk',
      label: `Greet ${spec.name}`,
      sublabel: spec.tamilRole,
      x: spec.x,
      y: baseY + 0.5,
      z: spec.z,
      radius: 3.1,
      locationId: spec.locationId,
      metaId: spec.id,
    };
    interactables.push(prompt);

    npcs.push({
      spec,
      root,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      head,
      phase: idx * 1.37,
      waveTimer: 0,
      prompt,
    });
  });

  const update = (elapsed: number, dt: number, playerX: number, playerZ: number) => {
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const distToPlayer = Math.hypot(playerX - npc.root.position.x, playerZ - npc.root.position.z);

      if (npc.waveTimer > 0) {
        npc.waveTimer = Math.max(0, npc.waveTimer - dt);
      }

      if (distToPlayer < 4.8) {
        // Pause politely, face the player, and wave gently!
        const desiredYaw = Math.atan2(playerX - npc.root.position.x, playerZ - npc.root.position.z);
        let diff = desiredYaw - npc.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        npc.root.rotation.y += diff * Math.min(1, dt * 6);

        npc.leftLeg.rotation.x *= 0.85;
        npc.rightLeg.rotation.x *= 0.85;
        npc.leftArm.rotation.x *= 0.85;
        const waveBoost = npc.waveTimer > 0 ? 1.0 : 0.65;
        npc.rightArm.rotation.z = -2.45 * waveBoost + Math.sin(elapsed * 7.5 + npc.phase) * 0.32;
        npc.rightArm.rotation.x = -0.25;
        npc.head.rotation.y = Math.sin(elapsed * 1.4 + npc.phase) * 0.08;
      } else {
        // Gentle strolling loop near home spot
        npc.phase += dt * npc.spec.patrolSpeed;
        const nx = npc.spec.x + Math.cos(npc.phase) * npc.spec.patrolRadius;
        const nz = npc.spec.z + Math.sin(npc.phase * 0.8) * npc.spec.patrolRadius * 0.6;
        const dx = nx - npc.root.position.x;
        const dz = nz - npc.root.position.z;
        const ny = walkableHeightAt(nx, nz);

        npc.root.position.set(nx, ny, nz);
        if (Math.hypot(dx, dz) > 0.002) {
          npc.root.rotation.y = Math.atan2(dx, dz);
        }

        const stride = Math.sin(elapsed * 4.2 + i) * 0.34;
        npc.leftLeg.rotation.x = stride;
        npc.rightLeg.rotation.x = -stride;
        npc.leftArm.rotation.x = -stride * 0.7;
        npc.rightArm.rotation.x = stride * 0.7;
        npc.rightArm.rotation.z *= 0.85;
        npc.head.rotation.y = Math.sin(elapsed * 0.9 + i) * 0.14;
      }

      // Sync interactable coordinates with moving NPC
      npc.prompt.x = npc.root.position.x;
      npc.prompt.y = npc.root.position.y + 0.5;
      npc.prompt.z = npc.root.position.z;
    }
  };

  const greetNpc = (npcId: string) => {
    const found = npcs.find((n) => n.spec.id === npcId);
    if (!found) return null;
    found.waveTimer = 3.5;
    return { name: found.spec.name, line: found.spec.greeting };
  };

  return {
    group,
    interactables,
    update,
    greetNpc,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
