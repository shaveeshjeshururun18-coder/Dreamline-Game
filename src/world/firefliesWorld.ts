import * as THREE from 'three';
import type { WeatherType } from '../game/types';
import {
  computeFireflyVisibility,
  evaluateFireflyKinematics,
  generateFireflySeeds,
} from '../game/fireflies';

export interface FirefliesWorldSystem {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    pixelRatio: number
  ) => void;
  snapVisibility: (timeHours: number, weather: WeatherType) => void;
  getCurrentVisibility: () => number;
  dispose: () => void;
}

/**
 * Builds a tiny sculpted 3D beetle body geometry (head + thorax + folded wing-covers)
 * oriented along +Z so every firefly looks like an actual organic insect up close.
 */
function buildFireflyBodyGeometry(): THREE.BufferGeometry {
  // Compact elongated ellipsoid beetle body (~9.5cm stylized for crisp 3D readability)
  const geo = new THREE.SphereGeometry(0.032, 7, 5);
  geo.scale(0.68, 0.56, 1.65);
  return geo;
}

/**
 * Builds a delicate translucent insect wing blade pivoted at the thorax shoulder.
 */
function buildFireflyWingGeometry(side: -1 | 1): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(side * 0.045, 0.012, side * 0.088, -0.008);
  shape.quadraticCurveTo(side * 0.072, -0.034, side * 0.022, -0.028);
  shape.quadraticCurveTo(side * 0.006, -0.018, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 4);
  // Lay wing flat in XZ plane (pivoting around Z-axis for natural wingbeat flapping)
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Builds the real 3D bioluminescent firefly insect swarm across all forested regions of DREAMLINE.
 * Replaces bright light-beam/orb point sprites with actual tiny 3D winged firefly insects:
 *  - Sculpted dark-amber beetle body oriented along instantaneous 3D flight velocity
 *  - Rapidly fluttering paired translucent insect wings
 *  - Tiny warm chartreuse-lime / honey-gold pulsing bioluminescent abdomen lantern
 *  - Delicate tight organic lantern halo (NO beams of light, NO oversized glare streaks!)
 */
export function buildFirefliesWorld(particleCount = 720): FirefliesWorldSystem {
  const group = new THREE.Group();
  const seeds = generateFireflySeeds(particleCount);
  const count = seeds.length;

  const bodyGeo = buildFireflyBodyGeometry();
  const leftWingGeo = buildFireflyWingGeometry(-1);
  const rightWingGeo = buildFireflyWingGeometry(1);
  const lanternGeo = new THREE.SphereGeometry(0.024, 7, 5);
  lanternGeo.scale(0.85, 0.78, 1.15);
  const microGlowGeo = new THREE.SphereGeometry(0.072, 7, 5);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1e,
    roughness: 0.55,
    metalness: 0.12,
    emissive: new THREE.Color(0x1e1608),
    emissiveIntensity: 0.35,
  });

  const wingMat = new THREE.MeshBasicMaterial({
    color: 0xdce6c8,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const lanternMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.96,
  });

  // Soft, tight, non-glaring bioluminescent air glow immediately around the insect's tail tip
  const microGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  const bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
  const leftWingMesh = new THREE.InstancedMesh(leftWingGeo, wingMat, count);
  const rightWingMesh = new THREE.InstancedMesh(rightWingGeo, wingMat, count);
  const lanternMesh = new THREE.InstancedMesh(lanternGeo, lanternMat, count);
  const microGlowMesh = new THREE.InstancedMesh(microGlowGeo, microGlowMat, count);

  const meshes = [bodyMesh, leftWingMesh, rightWingMesh, lanternMesh, microGlowMesh];
  for (const m of meshes) {
    m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(m);
  }
  group.visible = false;

  // Pre-allocated scratch math objects (zero per-frame GC allocations)
  const dummy = new THREE.Object3D();
  const wingDummy = new THREE.Object3D();
  const lanternDummy = new THREE.Object3D();
  const glowDummy = new THREE.Object3D();
  const tailOffset = new THREE.Vector3();
  const wingOffset = new THREE.Vector3();
  const qBody = new THREE.Quaternion();
  const qWingFlap = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  const limeColor = new THREE.Color(0xb8ff38); // Natural Photinus chartreuse-lime
  const goldColor = new THREE.Color(0xffd94a); // Warm amber-gold firefly lantern
  const restingColor = new THREE.Color(0x3a3218); // Dim resting abdomen between flashes
  const tmpColor = new THREE.Color();
  const tmpGlowColor = new THREE.Color();

  // Initialize instance colors once so Three.js allocates instanceColor buffer cleanly
  for (let i = 0; i < count; i++) {
    bodyMesh.setMatrixAt(i, dummy.matrix);
    leftWingMesh.setMatrixAt(i, dummy.matrix);
    rightWingMesh.setMatrixAt(i, dummy.matrix);
    lanternMesh.setMatrixAt(i, dummy.matrix);
    microGlowMesh.setMatrixAt(i, dummy.matrix);
    lanternMesh.setColorAt(i, limeColor);
    microGlowMesh.setColorAt(i, limeColor);
  }
  if (lanternMesh.instanceColor) lanternMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  if (microGlowMesh.instanceColor) microGlowMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

  let currentVisibility = 0;
  let initialized = false;

  const updateInstances = (elapsed: number, visibility: number) => {
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const kin = evaluateFireflyKinematics(s, elapsed);

      const scale = (0.72 + (s.size - 0.9) * 0.42) * (0.45 + 0.55 * visibility);
      const horizSpeed = Math.hypot(kin.vx, kin.vz);
      const yaw = horizSpeed > 0.001 ? Math.atan2(kin.vx, kin.vz) : s.phase;
      const pitch = Math.max(-0.42, Math.min(0.42, -Math.atan2(kin.vy, Math.max(0.25, horizSpeed))));

      euler.set(pitch, yaw, Math.sin(elapsed * 2.4 + s.phase) * 0.14);
      qBody.setFromEuler(euler);

      // 1. 3D Beetle Body
      dummy.position.set(kin.x, kin.y, kin.z);
      dummy.quaternion.copy(qBody);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);

      // 2. Fluttering Paired Translucent Wings attached to dorsal thorax
      wingOffset.set(0, 0.014 * scale, 0.008 * scale).applyQuaternion(qBody);

      wingDummy.position.set(kin.x + wingOffset.x, kin.y + wingOffset.y, kin.z + wingOffset.z);
      qWingFlap.setFromAxisAngle(zAxis, 0.25 + kin.wingAngle);
      wingDummy.quaternion.copy(qBody).multiply(qWingFlap);
      wingDummy.scale.setScalar(scale);
      wingDummy.updateMatrix();
      leftWingMesh.setMatrixAt(i, wingDummy.matrix);

      wingDummy.position.set(kin.x + wingOffset.x, kin.y + wingOffset.y, kin.z + wingOffset.z);
      qWingFlap.setFromAxisAngle(zAxis, -(0.25 + kin.wingAngle));
      wingDummy.quaternion.copy(qBody).multiply(qWingFlap);
      wingDummy.scale.setScalar(scale);
      wingDummy.updateMatrix();
      rightWingMesh.setMatrixAt(i, wingDummy.matrix);

      // 3. Bioluminescent Abdomen Tail Lantern (-Z rear tip of insect)
      tailOffset.set(0, -0.008 * scale, -0.048 * scale).applyQuaternion(qBody);
      const lx = kin.x + tailOffset.x;
      const ly = kin.y + tailOffset.y;
      const lz = kin.z + tailOffset.z;

      const flashIntensity = kin.flash * visibility;
      lanternDummy.position.set(lx, ly, lz);
      lanternDummy.quaternion.copy(qBody);
      lanternDummy.scale.setScalar(scale * (0.78 + 0.55 * flashIntensity));
      lanternDummy.updateMatrix();
      lanternMesh.setMatrixAt(i, lanternDummy.matrix);

      tmpGlowColor.copy(limeColor).lerp(goldColor, s.warmth);
      tmpColor.copy(restingColor).lerp(tmpGlowColor, Math.min(1, flashIntensity * 1.15));
      lanternMesh.setColorAt(i, tmpColor);

      // 4. Tiny, soft organic air-glow right around the tail lantern (vanishes when insect rests)
      const glowScale = flashIntensity > 0.12 ? scale * (0.55 + 0.85 * flashIntensity) : 0.0001;
      glowDummy.position.set(lx, ly, lz);
      glowDummy.quaternion.identity();
      glowDummy.scale.setScalar(glowScale);
      glowDummy.updateMatrix();
      microGlowMesh.setMatrixAt(i, glowDummy.matrix);
      microGlowMesh.setColorAt(i, tmpGlowColor);
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    leftWingMesh.instanceMatrix.needsUpdate = true;
    rightWingMesh.instanceMatrix.needsUpdate = true;
    lanternMesh.instanceMatrix.needsUpdate = true;
    microGlowMesh.instanceMatrix.needsUpdate = true;
    if (lanternMesh.instanceColor) lanternMesh.instanceColor.needsUpdate = true;
    if (microGlowMesh.instanceColor) microGlowMesh.instanceColor.needsUpdate = true;

    wingMat.opacity = 0.36 * visibility;
    lanternMat.opacity = 0.94 * visibility;
    microGlowMat.opacity = 0.22 * visibility;
  };

  const snapVisibility = (timeHours: number, weather: WeatherType) => {
    currentVisibility = computeFireflyVisibility(timeHours, weather);
    initialized = true;
    const active = currentVisibility > 0.004;
    group.visible = active;
    if (active) {
      updateInstances(0, currentVisibility);
    }
  };

  const update = (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    _pixelRatio: number
  ) => {
    const targetVisibility = computeFireflyVisibility(timeHours, weather);

    if (!initialized) {
      currentVisibility = targetVisibility;
      initialized = true;
    } else {
      const damp = 1 - Math.exp(-3.8 * Math.max(dt, 0.001));
      currentVisibility += (targetVisibility - currentVisibility) * damp;
      if (Math.abs(targetVisibility - currentVisibility) < 0.002) {
        currentVisibility = targetVisibility;
      }
    }

    const active = currentVisibility > 0.004;
    group.visible = active;
    if (!active) return;

    updateInstances(elapsed, currentVisibility);
  };

  const getCurrentVisibility = () => currentVisibility;

  const dispose = () => {
    bodyGeo.dispose();
    leftWingGeo.dispose();
    rightWingGeo.dispose();
    lanternGeo.dispose();
    microGlowGeo.dispose();
    bodyMat.dispose();
    wingMat.dispose();
    lanternMat.dispose();
    microGlowMat.dispose();
  };

  return {
    group,
    update,
    snapVisibility,
    getCurrentVisibility,
    dispose,
  };
}
