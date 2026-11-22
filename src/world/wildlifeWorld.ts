import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  computeBirdActivity,
  computeButterflyActivity,
  computeGrassAnimalActivity,
  createInitialGrassAnimalStates,
  generateBirdSeeds,
  generateButterflySeeds,
  generateGrassAnimalSeeds,
  sampleBirdPose,
  sampleButterflyPose,
  stepGrassAnimal,
  type BirdSeed,
  type ButterflySeed,
  type GrassAnimalState,
} from '../game/wildlife';
import { groundHeightAt } from '../game/terrain';
import type { SeasonType, WeatherType } from '../game/types';

export interface WildlifeWorldSystem {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    season: SeasonType,
    playerX: number,
    playerZ: number
  ) => void;
  dispose: () => void;
}

// Module-scoped reusable scratch transforms — zero garbage collection in the render loop
const _dummy = new THREE.Object3D();
const _partDummy = new THREE.Object3D();
const _parentMat = new THREE.Matrix4();
const _localMat = new THREE.Matrix4();
const _finalMat = new THREE.Matrix4();
const _color = new THREE.Color();

function normalizeForMerge(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const nonIndexed = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!nonIndexed.attributes.normal) {
    nonIndexed.computeVertexNormals();
  }
  // Strip UVs if inconsistent across primitives so mergeGeometries always succeeds cleanly
  if (nonIndexed.attributes.uv) {
    nonIndexed.deleteAttribute('uv');
  }
  return nonIndexed;
}

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const normalized = parts.map(normalizeForMerge);
  const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
  parts.forEach((p) => p.dispose());
  normalized.forEach((n) => n.dispose());
  if (!merged) {
    throw new Error('Failed to merge wildlife geometry parts');
  }
  merged.computeVertexNormals();
  return merged;
}

/**
 * Streamlined sculpted bird body (torso + head + tapered beak + forked tail), facing +Z.
 */
function createBirdBodyGeometry(): THREE.BufferGeometry {
  const torso = new THREE.SphereGeometry(0.11, 7, 6);
  torso.scale(0.85, 0.72, 2.25);

  const head = new THREE.SphereGeometry(0.075, 6, 5);
  head.translate(0, 0.045, 0.24);

  const beak = new THREE.ConeGeometry(0.026, 0.11, 4);
  beak.rotateX(Math.PI * 0.5);
  beak.translate(0, 0.035, 0.34);

  const tail = new THREE.BoxGeometry(0.14, 0.018, 0.24);
  tail.rotateX(0.12);
  tail.translate(0, 0.01, -0.32);

  return mergeParts([torso, head, beak, tail]);
}

/**
 * Sculpted swept avian wing pivoted at the shoulder (x = 0) extending along +X (right) or -X (left).
 */
function createBirdWingGeometry(side: -1 | 1): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.09);
  shape.quadraticCurveTo(0.28 * side, 0.14, 0.62 * side, 0.02);
  shape.quadraticCurveTo(0.46 * side, -0.1, 0.18 * side, -0.12);
  shape.lineTo(0, -0.1);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 5);
  geo.rotateX(-Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Delicate two-lobe butterfly wing (forewing + hindwing) pivoted at x = 0 so wings flap cleanly.
 */
function createButterflyWingGeometry(side: -1 | 1): THREE.BufferGeometry {
  const s = side;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.02);
  // Upper rounded forewing lobe
  shape.bezierCurveTo(0.06 * s, 0.14, 0.2 * s, 0.14, 0.18 * s, 0.02);
  // Waist indentation
  shape.quadraticCurveTo(0.11 * s, -0.01, 0.13 * s, -0.05);
  // Lower scalloped hindwing lobe
  shape.bezierCurveTo(0.13 * s, -0.13, 0.04 * s, -0.13, 0, -0.04);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 5);
  geo.rotateX(-Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Cute meadow rabbit body + head + long upright ears + paws, pivoted strictly at bottom-center (y = 0).
 */
function createRabbitBodyGeometry(): THREE.BufferGeometry {
  const body = new THREE.SphereGeometry(0.17, 8, 7);
  body.scale(0.88, 0.82, 1.28);
  body.translate(0, 0.15, -0.02);

  const head = new THREE.SphereGeometry(0.115, 7, 6);
  head.scale(0.92, 0.92, 1.05);
  head.translate(0, 0.26, 0.17);

  const earL = new THREE.CapsuleGeometry(0.028, 0.15, 3, 5);
  earL.rotateZ(0.14);
  earL.rotateX(-0.18);
  earL.translate(-0.048, 0.43, 0.14);

  const earR = new THREE.CapsuleGeometry(0.028, 0.15, 3, 5);
  earR.rotateZ(-0.14);
  earR.rotateX(-0.18);
  earR.translate(0.048, 0.43, 0.14);

  const hindFootL = new THREE.SphereGeometry(0.055, 5, 4);
  hindFootL.scale(0.75, 0.55, 1.45);
  hindFootL.translate(-0.095, 0.032, -0.08);

  const hindFootR = new THREE.SphereGeometry(0.055, 5, 4);
  hindFootR.scale(0.75, 0.55, 1.45);
  hindFootR.translate(0.095, 0.032, -0.08);

  return mergeParts([body, head, earL, earR, hindFootL, hindFootR]);
}

/**
 * Rabbit fluffy white cottontail + soft chest fluff accent, sharing the exact same bottom-center pivot (y = 0).
 */
function createRabbitAccentGeometry(): THREE.BufferGeometry {
  const tail = new THREE.SphereGeometry(0.068, 6, 5);
  tail.translate(0, 0.14, -0.24);

  const chest = new THREE.SphereGeometry(0.09, 6, 5);
  chest.scale(0.85, 0.72, 0.9);
  chest.translate(0, 0.13, 0.13);

  return mergeParts([tail, chest]);
}

/**
 * Woodland squirrel body + perked head + tiny pointed ears + paws, pivoted at bottom-center (y = 0).
 */
function createSquirrelBodyGeometry(): THREE.BufferGeometry {
  const body = new THREE.SphereGeometry(0.125, 7, 6);
  body.scale(0.84, 0.88, 1.35);
  body.translate(0, 0.12, -0.01);

  const head = new THREE.SphereGeometry(0.088, 7, 6);
  head.scale(0.92, 0.92, 1.12);
  head.translate(0, 0.21, 0.15);

  const earL = new THREE.ConeGeometry(0.026, 0.065, 4);
  earL.translate(-0.042, 0.295, 0.13);

  const earR = new THREE.ConeGeometry(0.026, 0.065, 4);
  earR.translate(0.042, 0.295, 0.13);

  const pawL = new THREE.SphereGeometry(0.034, 5, 4);
  pawL.translate(-0.055, 0.03, 0.11);

  const pawR = new THREE.SphereGeometry(0.034, 5, 4);
  pawR.translate(0.055, 0.03, 0.11);

  return mergeParts([body, head, earL, earR, pawL, pawR]);
}

/**
 * Signature upright fluffy S-curved squirrel tail pivoted at the rump base so it wags smoothly.
 */
function createSquirrelTailGeometry(): THREE.BufferGeometry {
  const seg1 = new THREE.SphereGeometry(0.062, 6, 5);
  seg1.scale(0.82, 1.35, 0.9);
  seg1.translate(0, 0.07, -0.05);

  const seg2 = new THREE.SphereGeometry(0.078, 6, 5);
  seg2.scale(0.85, 1.45, 0.92);
  seg2.translate(0, 0.2, -0.09);

  const seg3 = new THREE.SphereGeometry(0.072, 6, 5);
  seg3.scale(0.85, 1.2, 1.15);
  seg3.translate(0, 0.32, -0.03);

  return mergeParts([seg1, seg2, seg3]);
}

/**
 * Builds the ultra-lightweight InstancedMesh ambient wildlife ecosystem:
 * - 33 articulated soaring birds across 5 valley/lake/coast flocks (3 draw calls)
 * - 48 double-winged butterflies fluttering & perching around flower meadows (3 draw calls)
 * - Blooming wildflower clusters beneath butterfly gardens (1 static draw call)
 * - 28 small meadow animals (18 rabbits + 10 woodland squirrels) hopping & grazing in the grass (4 draw calls)
 */
export function buildWildlifeWorld(): WildlifeWorldSystem {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const birdSeeds: BirdSeed[] = generateBirdSeeds();
  const butterflySeeds: ButterflySeed[] = generateButterflySeeds();
  const animalSeeds = generateGrassAnimalSeeds();
  const animalStates: GrassAnimalState[] = createInitialGrassAnimalStates(animalSeeds);

  const rabbits = animalStates.filter((a) => a.species === 'rabbit');
  const squirrels = animalStates.filter((a) => a.species === 'squirrel');

  // =========================================================================
  // 1. ARTICULATED FLYING BIRDS (3 InstancedMesh draw calls)
  // =========================================================================
  const birdBodyGeo = createBirdBodyGeometry();
  const birdLeftWingGeo = createBirdWingGeometry(-1);
  const birdRightWingGeo = createBirdWingGeometry(1);

  const birdBodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    metalness: 0.04,
  });
  const birdWingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const birdBodyInst = new THREE.InstancedMesh(birdBodyGeo, birdBodyMat, birdSeeds.length);
  const birdLeftWingInst = new THREE.InstancedMesh(birdLeftWingGeo, birdWingMat, birdSeeds.length);
  const birdRightWingInst = new THREE.InstancedMesh(birdRightWingGeo, birdWingMat, birdSeeds.length);

  birdBodyInst.frustumCulled = false;
  birdLeftWingInst.frustumCulled = false;
  birdRightWingInst.frustumCulled = false;

  for (let i = 0; i < birdSeeds.length; i++) {
    _color.setHex(birdSeeds[i].colorHex);
    birdBodyInst.setColorAt(i, _color);
    _color.setHex(birdSeeds[i].wingColorHex);
    birdLeftWingInst.setColorAt(i, _color);
    birdRightWingInst.setColorAt(i, _color);
  }
  if (birdBodyInst.instanceColor) birdBodyInst.instanceColor.needsUpdate = true;
  if (birdLeftWingInst.instanceColor) birdLeftWingInst.instanceColor.needsUpdate = true;
  if (birdRightWingInst.instanceColor) birdRightWingInst.instanceColor.needsUpdate = true;

  group.add(birdBodyInst, birdLeftWingInst, birdRightWingInst);
  disposables.push(birdBodyGeo, birdLeftWingGeo, birdRightWingGeo, birdBodyMat, birdWingMat);

  // =========================================================================
  // 2. ARTICULATED BUTTERFLIES + BLOOMING FLOWER PATCHES (4 draw calls)
  // =========================================================================
  const bflyBodyGeo = new THREE.CapsuleGeometry(0.012, 0.09, 2, 4);
  bflyBodyGeo.rotateX(Math.PI * 0.5);
  const bflyLeftWingGeo = createButterflyWingGeometry(-1);
  const bflyRightWingGeo = createButterflyWingGeometry(1);

  const bflyBodyMat = new THREE.MeshStandardMaterial({
    color: 0x352c26,
    roughness: 0.85,
  });
  const bflyWingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.52,
    metalness: 0.05,
    emissive: 0x2a1f16,
    emissiveIntensity: 0.16,
    side: THREE.DoubleSide,
  });

  const bflyBodyInst = new THREE.InstancedMesh(bflyBodyGeo, bflyBodyMat, butterflySeeds.length);
  const bflyLeftWingInst = new THREE.InstancedMesh(bflyLeftWingGeo, bflyWingMat, butterflySeeds.length);
  const bflyRightWingInst = new THREE.InstancedMesh(bflyRightWingGeo, bflyWingMat, butterflySeeds.length);

  bflyBodyInst.frustumCulled = false;
  bflyLeftWingInst.frustumCulled = false;
  bflyRightWingInst.frustumCulled = false;

  for (let i = 0; i < butterflySeeds.length; i++) {
    _color.setHex(butterflySeeds[i].colorHex);
    bflyLeftWingInst.setColorAt(i, _color);
    bflyRightWingInst.setColorAt(i, _color);
  }
  if (bflyLeftWingInst.instanceColor) bflyLeftWingInst.instanceColor.needsUpdate = true;
  if (bflyRightWingInst.instanceColor) bflyRightWingInst.instanceColor.needsUpdate = true;

  group.add(bflyBodyInst, bflyLeftWingInst, bflyRightWingInst);
  disposables.push(bflyBodyGeo, bflyLeftWingGeo, bflyRightWingGeo, bflyBodyMat, bflyWingMat);

  // Dedicated wildflower blossoms directly beneath each butterfly anchor (green stem + leaves + tinted petals!)
  const makeColoredPart = (geo: THREE.BufferGeometry, r: number, g: number, b: number) => {
    const g2 = normalizeForMerge(geo);
    const count = g2.attributes.position.count;
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      cols[i * 3] = r;
      cols[i * 3 + 1] = g;
      cols[i * 3 + 2] = b;
    }
    g2.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.dispose();
    return g2;
  };
  const stemRaw = new THREE.CylinderGeometry(0.01, 0.014, 0.24, 4);
  stemRaw.translate(0, 0.12, 0);
  const leafRawL = new THREE.CircleGeometry(0.045, 4);
  leafRawL.rotateX(-Math.PI * 0.35);
  leafRawL.rotateZ(0.45);
  leafRawL.translate(-0.035, 0.11, 0);
  const leafRawR = new THREE.CircleGeometry(0.045, 4);
  leafRawR.rotateX(-Math.PI * 0.35);
  leafRawR.rotateZ(-0.45);
  leafRawR.translate(0.035, 0.13, 0.01);
  const petalRaw = new THREE.CircleGeometry(0.095, 6);
  petalRaw.rotateX(-Math.PI * 0.44);
  petalRaw.translate(0, 0.25, 0);

  const bloomParts = [
    makeColoredPart(stemRaw, 0.34, 0.56, 0.28),
    makeColoredPart(leafRawL, 0.38, 0.62, 0.3),
    makeColoredPart(leafRawR, 0.38, 0.62, 0.3),
    makeColoredPart(petalRaw, 1.0, 1.0, 1.0),
  ];
  const bloomGeo = BufferGeometryUtils.mergeGeometries(bloomParts, false);
  bloomParts.forEach((p) => p.dispose());
  if (!bloomGeo) throw new Error('Failed to build wildflower geometry');
  bloomGeo.computeVertexNormals();
  const bloomMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.74,
    side: THREE.DoubleSide,
  });
  const bloomsPerAnchor = 3;
  const bloomInst = new THREE.InstancedMesh(
    bloomGeo,
    bloomMat,
    butterflySeeds.length * bloomsPerAnchor
  );
  const bloomPalette = [0xffb7d0, 0xffe896, 0xd4bff9, 0xfff5dc, 0xffcaa6];
  let bIdx = 0;
  for (let i = 0; i < butterflySeeds.length; i++) {
    const s = butterflySeeds[i];
    for (let k = 0; k < bloomsPerAnchor; k++) {
      const ang = (k / bloomsPerAnchor) * Math.PI * 2 + s.phase;
      const r = k === 0 ? 0.0 : 0.35 + (k * 0.18);
      const fx = s.flowerX + Math.cos(ang) * r;
      const fz = s.flowerZ + Math.sin(ang) * r;
      const fy = groundHeightAt(fx, fz);
      _dummy.position.set(fx, fy - 0.02, fz);
      _dummy.rotation.set(0, ang, 0);
      const sc = 0.85 + ((i + k) % 4) * 0.14;
      _dummy.scale.set(sc, sc, sc);
      _dummy.updateMatrix();
      bloomInst.setMatrixAt(bIdx, _dummy.matrix);
      _color.setHex(bloomPalette[(i + k) % bloomPalette.length]);
      bloomInst.setColorAt(bIdx, _color);
      bIdx++;
    }
  }
  bloomInst.instanceMatrix.needsUpdate = true;
  if (bloomInst.instanceColor) bloomInst.instanceColor.needsUpdate = true;
  bloomInst.computeBoundingSphere();
  group.add(bloomInst);
  disposables.push(bloomGeo, bloomMat);

  // =========================================================================
  // 3. SMALL GRASS ANIMALS: MEADOW RABBITS & WOODLAND SQUIRRELS (4 draw calls)
  // =========================================================================
  const rabbitBodyGeo = createRabbitBodyGeometry();
  const rabbitAccentGeo = createRabbitAccentGeometry();
  const rabbitBodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
  });
  const rabbitAccentMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.0,
  });

  const rabbitBodyInst = new THREE.InstancedMesh(
    rabbitBodyGeo,
    rabbitBodyMat,
    Math.max(1, rabbits.length)
  );
  const rabbitAccentInst = new THREE.InstancedMesh(
    rabbitAccentGeo,
    rabbitAccentMat,
    Math.max(1, rabbits.length)
  );
  rabbitBodyInst.frustumCulled = false;
  rabbitAccentInst.frustumCulled = false;
  rabbitBodyInst.count = rabbits.length;
  rabbitAccentInst.count = rabbits.length;

  for (let i = 0; i < rabbits.length; i++) {
    _color.setHex(rabbits[i].bodyColorHex);
    rabbitBodyInst.setColorAt(i, _color);
    _color.setHex(rabbits[i].accentColorHex);
    rabbitAccentInst.setColorAt(i, _color);
  }
  if (rabbitBodyInst.instanceColor) rabbitBodyInst.instanceColor.needsUpdate = true;
  if (rabbitAccentInst.instanceColor) rabbitAccentInst.instanceColor.needsUpdate = true;

  const squirrelBodyGeo = createSquirrelBodyGeometry();
  const squirrelTailGeo = createSquirrelTailGeometry();
  const squirrelBodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.0,
  });
  const squirrelTailMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.0,
  });

  const squirrelBodyInst = new THREE.InstancedMesh(
    squirrelBodyGeo,
    squirrelBodyMat,
    Math.max(1, squirrels.length)
  );
  const squirrelTailInst = new THREE.InstancedMesh(
    squirrelTailGeo,
    squirrelTailMat,
    Math.max(1, squirrels.length)
  );
  squirrelBodyInst.frustumCulled = false;
  squirrelTailInst.frustumCulled = false;
  squirrelBodyInst.count = squirrels.length;
  squirrelTailInst.count = squirrels.length;

  for (let i = 0; i < squirrels.length; i++) {
    _color.setHex(squirrels[i].bodyColorHex);
    squirrelBodyInst.setColorAt(i, _color);
    _color.setHex(squirrels[i].accentColorHex);
    squirrelTailInst.setColorAt(i, _color);
  }
  if (squirrelBodyInst.instanceColor) squirrelBodyInst.instanceColor.needsUpdate = true;
  if (squirrelTailInst.instanceColor) squirrelTailInst.instanceColor.needsUpdate = true;

  group.add(rabbitBodyInst, rabbitAccentInst, squirrelBodyInst, squirrelTailInst);
  disposables.push(
    rabbitBodyGeo,
    rabbitAccentGeo,
    rabbitBodyMat,
    rabbitAccentMat,
    squirrelBodyGeo,
    squirrelTailGeo,
    squirrelBodyMat,
    squirrelTailMat
  );

  // =========================================================================
  // FRAME UPDATE (Zero Allocations + Distance Culling for Smooth Performance)
  // =========================================================================
  let firstFrame = true;

  const update = (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    season: SeasonType,
    playerX: number,
    playerZ: number
  ) => {
    // 1. Update Soaring Birds
    const birdActivity = computeBirdActivity(timeHours, weather);
    const birdsVisible = birdActivity > 0.02;
    birdBodyInst.visible = birdsVisible;
    birdLeftWingInst.visible = birdsVisible;
    birdRightWingInst.visible = birdsVisible;

    if (birdsVisible) {
      for (let i = 0; i < birdSeeds.length; i++) {
        const pose = sampleBirdPose(birdSeeds[i], elapsed);
        const effScale = pose.scale * (0.35 + 0.65 * birdActivity);

        _dummy.position.set(pose.x, pose.y, pose.z);
        _dummy.rotation.set(pose.pitch, pose.heading, pose.roll, 'YXZ');
        _dummy.scale.setScalar(effScale);
        _dummy.updateMatrix();
        _parentMat.copy(_dummy.matrix);
        birdBodyInst.setMatrixAt(i, _parentMat);

        // Articulated Left Wing
        _partDummy.position.set(-0.045, 0.02, 0.02);
        _partDummy.rotation.set(0, 0, -pose.wingAngle);
        _partDummy.scale.set(1, 1, 1);
        _partDummy.updateMatrix();
        _localMat.copy(_partDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        birdLeftWingInst.setMatrixAt(i, _finalMat);

        // Articulated Right Wing
        _partDummy.position.set(0.045, 0.02, 0.02);
        _partDummy.rotation.set(0, 0, pose.wingAngle);
        _partDummy.scale.set(1, 1, 1);
        _partDummy.updateMatrix();
        _localMat.copy(_partDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        birdRightWingInst.setMatrixAt(i, _finalMat);
      }
      birdBodyInst.instanceMatrix.needsUpdate = true;
      birdLeftWingInst.instanceMatrix.needsUpdate = true;
      birdRightWingInst.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Fluttering Butterflies
    const bflyActivity = computeButterflyActivity(timeHours, weather, season);
    const bflyVisible = bflyActivity > 0.02;
    bflyBodyInst.visible = bflyVisible;
    bflyLeftWingInst.visible = bflyVisible;
    bflyRightWingInst.visible = bflyVisible;
    bloomInst.visible = season !== 'winter';

    if (bflyVisible) {
      let anyBflyUpdated = false;
      for (let i = 0; i < butterflySeeds.length; i++) {
        const s = butterflySeeds[i];
        // Skip updating far-off tiny butterflies beyond 95m after initial placement
        const dx = s.homeX - playerX;
        const dz = s.homeZ - playerZ;
        if (!firstFrame && dx * dx + dz * dz > 95 * 95) continue;

        const pose = sampleButterflyPose(s, elapsed);
        const effScale = pose.scale * (0.25 + 0.75 * bflyActivity);

        _dummy.position.set(pose.x, pose.y, pose.z);
        _dummy.rotation.set(pose.pitch, pose.heading, 0, 'YXZ');
        _dummy.scale.setScalar(effScale);
        _dummy.updateMatrix();
        _parentMat.copy(_dummy.matrix);
        bflyBodyInst.setMatrixAt(i, _parentMat);

        // Articulated Left Wing
        _partDummy.position.set(-0.008, 0.004, 0);
        _partDummy.rotation.set(0, 0, -pose.wingAngle);
        _partDummy.scale.set(1, 1, 1);
        _partDummy.updateMatrix();
        _localMat.copy(_partDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        bflyLeftWingInst.setMatrixAt(i, _finalMat);

        // Articulated Right Wing
        _partDummy.position.set(0.008, 0.004, 0);
        _partDummy.rotation.set(0, 0, pose.wingAngle);
        _partDummy.scale.set(1, 1, 1);
        _partDummy.updateMatrix();
        _localMat.copy(_partDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        bflyRightWingInst.setMatrixAt(i, _finalMat);
        anyBflyUpdated = true;
      }
      if (anyBflyUpdated) {
        bflyBodyInst.instanceMatrix.needsUpdate = true;
        bflyLeftWingInst.instanceMatrix.needsUpdate = true;
        bflyRightWingInst.instanceMatrix.needsUpdate = true;
      }
    }

    // 3. Update Small Meadow Animals (Rabbits & Squirrels in the grass)
    const animalActivity = computeGrassAnimalActivity(timeHours, weather);
    const animalsVisible = animalActivity > 0.02;
    rabbitBodyInst.visible = animalsVisible && rabbits.length > 0;
    rabbitAccentInst.visible = animalsVisible && rabbits.length > 0;
    squirrelBodyInst.visible = animalsVisible && squirrels.length > 0;
    squirrelTailInst.visible = animalsVisible && squirrels.length > 0;

    if (animalsVisible) {
      let anyRabbitUpdated = false;
      for (let i = 0; i < rabbits.length; i++) {
        const r = rabbits[i];
        const dx = r.x - playerX;
        const dz = r.z - playerZ;
        if (!firstFrame && dx * dx + dz * dz > 100 * 100) continue;

        stepGrassAnimal(r, dt, elapsed, playerX, playerZ);
        const sc = r.scale * (0.4 + 0.6 * animalActivity);
        // Gentle grazing nose-dip or subtle hop pitch + squash/stretch
        const pitch =
          r.behavior === 'grazing'
            ? 0.22 + r.headBob * 0.12
            : r.behavior === 'alert'
            ? -0.14
            : -0.1 + r.hopHeight * 0.65;
        const stretchY = 1 + r.hopHeight * 0.35 - (r.behavior === 'grazing' ? 0.05 : 0);
        const stretchZ = 1 + r.hopHeight * 0.2;

        _dummy.position.set(r.x, r.y + r.hopHeight, r.z);
        _dummy.rotation.set(pitch, r.heading, r.earWiggle * 0.35, 'YXZ');
        _dummy.scale.set(sc, sc * stretchY, sc * stretchZ);
        _dummy.updateMatrix();
        rabbitBodyInst.setMatrixAt(i, _dummy.matrix);
        rabbitAccentInst.setMatrixAt(i, _dummy.matrix);
        anyRabbitUpdated = true;
      }
      if (anyRabbitUpdated) {
        rabbitBodyInst.instanceMatrix.needsUpdate = true;
        rabbitAccentInst.instanceMatrix.needsUpdate = true;
      }

      let anySquirrelUpdated = false;
      for (let i = 0; i < squirrels.length; i++) {
        const sq = squirrels[i];
        const dx = sq.x - playerX;
        const dz = sq.z - playerZ;
        if (!firstFrame && dx * dx + dz * dz > 100 * 100) continue;

        stepGrassAnimal(sq, dt, elapsed, playerX, playerZ);
        const sc = sq.scale * (0.4 + 0.6 * animalActivity);
        const pitch =
          sq.behavior === 'grazing'
            ? 0.16 + sq.headBob * 0.1
            : sq.behavior === 'alert'
            ? -0.22
            : -0.06 + sq.hopHeight * 0.5;

        _dummy.position.set(sq.x, sq.y + sq.hopHeight, sq.z);
        _dummy.rotation.set(pitch, sq.heading, 0, 'YXZ');
        _dummy.scale.setScalar(sc);
        _dummy.updateMatrix();
        _parentMat.copy(_dummy.matrix);
        squirrelBodyInst.setMatrixAt(i, _parentMat);

        // Articulated upright fluffy tail wags gently behind rump
        _partDummy.position.set(0, 0.09, -0.14);
        _partDummy.rotation.set(
          -0.12 + Math.sin(elapsed * 3.4 + sq.phase) * 0.14,
          0,
          sq.tailWag * 0.45
        );
        _partDummy.scale.set(1, 1, 1);
        _partDummy.updateMatrix();
        _localMat.copy(_partDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        squirrelTailInst.setMatrixAt(i, _finalMat);
        anySquirrelUpdated = true;
      }
      if (anySquirrelUpdated) {
        squirrelBodyInst.instanceMatrix.needsUpdate = true;
        squirrelTailInst.instanceMatrix.needsUpdate = true;
      }
    }

    firstFrame = false;
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    group,
    update,
    dispose,
  };
}
