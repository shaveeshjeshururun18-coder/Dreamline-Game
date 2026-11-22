import * as THREE from 'three';
import { WATER_LEVEL, walkableHeightAt } from '../game/terrain';
import type { NavigationTarget } from '../game/navigation';

export interface NavigationGuide3DSystem {
  group: THREE.Group;
  update: (
    playerX: number,
    playerY: number,
    playerZ: number,
    target: NavigationTarget | null,
    elapsed: number
  ) => void;
  dispose: () => void;
}

const LINE_SEGMENTS = 36;
const CHEVRON_COUNT = 6;

/**
 * Renders live 3D GPS navigation elements in the scene:
 * 1. Glowing terrain-hugging guidance line from player to target
 * 2. Animated flowing directional chevrons gliding along the route line
 * 3. Floating 3D directional navigation arrow hovering ahead of the player pointing directly toward the target
 * 4. Pulsing vertical beacon ring & beam at the destination
 */
export function buildNavigationGuide3D(): NavigationGuide3DSystem {
  const group = new THREE.Group();
  group.visible = false;

  // 1. Live Glowing 3D Navigation Line
  const positions = new Float32Array((LINE_SEGMENTS + 1) * 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x7ef7db,
    transparent: true,
    opacity: 0.92,
  });
  const guideLine = new THREE.Line(lineGeo, lineMat);
  guideLine.frustumCulled = false;
  group.add(guideLine);

  // 2. Floating 3D Directional Navigation Arrow (above & ahead of player)
  const arrowGroup = new THREE.Group();
  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0x7ef7db,
    emissive: 0x2ad9b5,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.2,
  });
  const arrowRingMat = new THREE.MeshBasicMaterial({
    color: 0xf4be98,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });

  // Shaft + crisp arrowhead pointing along +Z in local space
  const shaftGeo = new THREE.BoxGeometry(0.18, 0.12, 0.78);
  const shaft = new THREE.Mesh(shaftGeo, arrowMat);
  shaft.position.set(0, 0, -0.18);

  const headGeo = new THREE.ConeGeometry(0.36, 0.72, 4);
  headGeo.rotateX(Math.PI / 2);
  headGeo.rotateZ(Math.PI / 4);
  const head = new THREE.Mesh(headGeo, arrowMat);
  head.position.set(0, 0, 0.48);

  const haloGeo = new THREE.RingGeometry(0.46, 0.56, 20);
  haloGeo.rotateX(-Math.PI / 2);
  const halo = new THREE.Mesh(haloGeo, arrowRingMat);
  halo.position.set(0, -0.1, 0.05);

  arrowGroup.add(shaft, head, halo);
  group.add(arrowGroup);

  // 3. Flowing Chevrons along the ground path
  const chevronGeo = new THREE.ConeGeometry(0.28, 0.62, 3);
  chevronGeo.rotateX(Math.PI / 2);
  const chevronMat = new THREE.MeshBasicMaterial({
    color: 0xa6ffeb,
    transparent: true,
    opacity: 0.85,
  });
  const chevrons: THREE.Mesh[] = [];
  for (let i = 0; i < CHEVRON_COUNT; i++) {
    const ch = new THREE.Mesh(chevronGeo, chevronMat);
    group.add(ch);
    chevrons.push(ch);
  }

  // 4. Destination Beacon Pillar + Expanding Ground Ring
  const beaconGroup = new THREE.Group();
  const beaconBeamGeo = new THREE.CylinderGeometry(0.22, 0.55, 22, 12, 1, true);
  const beaconBeamMat = new THREE.MeshBasicMaterial({
    color: 0x7ef7db,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beaconBeam = new THREE.Mesh(beaconBeamGeo, beaconBeamMat);
  beaconBeam.position.y = 11;

  const beaconRingGeo = new THREE.RingGeometry(1.4, 2.05, 28);
  beaconRingGeo.rotateX(-Math.PI / 2);
  const beaconRingMat = new THREE.MeshBasicMaterial({
    color: 0xf4be98,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
  beaconRing.position.y = 0.25;

  beaconGroup.add(beaconBeam, beaconRing);
  group.add(beaconGroup);

  const update = (
    playerX: number,
    playerY: number,
    playerZ: number,
    target: NavigationTarget | null,
    elapsed: number
  ) => {
    if (!target) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const dx = target.x - playerX;
    const dz = target.z - playerZ;
    const dist = Math.hypot(dx, dz);
    const bearing = Math.atan2(dx, dz);

    // Update terrain-hugging line points (zero GC)
    const posAttr = lineGeo.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i <= LINE_SEGMENTS; i++) {
      const f = i / LINE_SEGMENTS;
      const x = playerX + dx * f;
      const z = playerZ + dz * f;
      const gY = walkableHeightAt(x, z);
      const y = Math.max(gY, WATER_LEVEL + 0.14) + 0.52;
      const idx = i * 3;
      arr[idx] = x;
      arr[idx + 1] = y;
      arr[idx + 2] = z;
    }
    posAttr.needsUpdate = true;

    // Update floating directional 3D arrow hovering 2.6m ahead of player toward target
    const leadDist = Math.min(2.8, Math.max(1.2, dist * 0.45));
    const ax = playerX + Math.sin(bearing) * leadDist;
    const az = playerZ + Math.cos(bearing) * leadDist;
    const ay = Math.max(playerY, walkableHeightAt(ax, az), WATER_LEVEL) + 2.35 + Math.sin(elapsed * 3.4) * 0.14;
    arrowGroup.position.set(ax, ay, az);
    arrowGroup.rotation.set(0, bearing, 0);

    // Animate chevrons flowing toward target
    const flowPhase = (elapsed * 0.35) % 1;
    for (let i = 0; i < CHEVRON_COUNT; i++) {
      const ch = chevrons[i];
      if (dist < 8) {
        ch.visible = false;
        continue;
      }
      ch.visible = true;
      const frac = ((i / CHEVRON_COUNT) + flowPhase) % 1;
      // Keep chevrons neatly between 6% and 94% of the path
      const clampedFrac = 0.06 + frac * 0.88;
      const cx = playerX + dx * clampedFrac;
      const cz = playerZ + dz * clampedFrac;
      const cy = Math.max(walkableHeightAt(cx, cz), WATER_LEVEL + 0.14) + 0.68;
      ch.position.set(cx, cy, cz);
      ch.rotation.set(0, bearing, 0);
    }

    // Update destination beacon
    const destY = Math.max(walkableHeightAt(target.x, target.z), WATER_LEVEL + 0.12);
    beaconGroup.position.set(target.x, destY, target.z);
    const pulse = 1 + Math.sin(elapsed * 3.2) * 0.16;
    beaconRing.scale.set(pulse, 1, pulse);
    beaconBeamMat.opacity = 0.2 + Math.sin(elapsed * 2.5) * 0.08;
  };

  return {
    group,
    update,
    dispose: () => {
      lineGeo.dispose();
      lineMat.dispose();
      shaftGeo.dispose();
      headGeo.dispose();
      haloGeo.dispose();
      arrowMat.dispose();
      arrowRingMat.dispose();
      chevronGeo.dispose();
      chevronMat.dispose();
      beaconBeamGeo.dispose();
      beaconBeamMat.dispose();
      beaconRingGeo.dispose();
      beaconRingMat.dispose();
    },
  };
}
