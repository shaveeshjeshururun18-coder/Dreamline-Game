import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createInitialBirdFlockingState,
  getFlockingStats,
  MAX_FLOCK_BIRDS,
  refreshFlocksForFocus,
  stepBirdFlockingSystem,
  type BirdFlockingState,
  type FlockingStats,
} from '../game/birdFlocking';
import type { SeasonType, WeatherType } from '../game/types';

export interface BirdFlockingWorldSystem {
  group: THREE.Group;
  update: (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    season: SeasonType,
    playerX: number,
    playerZ: number
  ) => FlockingStats;
  reset: (playerX: number, playerZ: number, season: SeasonType) => FlockingStats;
  onFocusTeleport: (
    playerX: number,
    playerZ: number,
    timeHours: number,
    weather: WeatherType,
    season: SeasonType
  ) => FlockingStats;
  getStats: () => FlockingStats;
  dispose: () => void;
}

// Reusable module-scoped transforms so per-frame updates incur zero heap allocations
const _dummy = new THREE.Object3D();
const _wingDummy = new THREE.Object3D();
const _parentMat = new THREE.Matrix4();
const _localMat = new THREE.Matrix4();
const _finalMat = new THREE.Matrix4();
const _color = new THREE.Color();

function normalizeForMerge(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const nonIndexed = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!nonIndexed.attributes.normal) {
    nonIndexed.computeVertexNormals();
  }
  if (nonIndexed.attributes.uv) {
    nonIndexed.deleteAttribute('uv');
  }
  return nonIndexed;
}

/**
 * Composite sculpted swallow/songbird silhouette (tapered body + head + beak + forked tail)
 * that reads crisply from a distance against golden-hour and daylight skies.
 */
function createFlockBirdBodyGeometry(): THREE.BufferGeometry {
  const torso = new THREE.SphereGeometry(0.115, 7, 5);
  torso.scale(0.84, 0.72, 2.35);

  const head = new THREE.SphereGeometry(0.078, 6, 5);
  head.translate(0, 0.048, 0.25);

  const beak = new THREE.ConeGeometry(0.028, 0.12, 4);
  beak.rotateX(Math.PI * 0.5);
  beak.translate(0, 0.036, 0.36);

  // Forked swallow tail (two angled tail feathers)
  const tailL = new THREE.BoxGeometry(0.065, 0.018, 0.28);
  tailL.rotateY(0.18);
  tailL.rotateX(0.1);
  tailL.translate(-0.048, 0.014, -0.34);

  const tailR = new THREE.BoxGeometry(0.065, 0.018, 0.28);
  tailR.rotateY(-0.18);
  tailR.rotateX(0.1);
  tailR.translate(0.048, 0.014, -0.34);

  const parts = [torso, head, beak, tailL, tailR];
  const normalized = parts.map(normalizeForMerge);
  const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
  parts.forEach((p) => p.dispose());
  normalized.forEach((n) => n.dispose());
  if (!merged) {
    throw new Error('Failed to merge flocking bird body geometry');
  }
  merged.computeVertexNormals();
  return merged;
}

/**
 * Swept crescent avian wing pivoted cleanly at the shoulder (x = 0) for articulated flapping.
 */
function createFlockBirdWingGeometry(side: -1 | 1): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.1);
  shape.quadraticCurveTo(0.32 * side, 0.16, 0.74 * side, 0.03);
  shape.quadraticCurveTo(0.54 * side, -0.09, 0.22 * side, -0.12);
  shape.lineTo(0, -0.1);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 5);
  geo.rotateX(-Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Ultra-lightweight InstancedMesh 3D bird flocking renderer (3 draw calls total for up to 36 birds)
 * driven by the Boids flocking simulation in src/game/birdFlocking.ts.
 */
export function buildBirdFlockingWorld(
  initialPlayerX = 0,
  initialPlayerZ = 14,
  initialSeason: SeasonType = 'spring'
): BirdFlockingWorldSystem {
  const group = new THREE.Group();
  let state: BirdFlockingState = createInitialBirdFlockingState(
    initialPlayerX,
    initialPlayerZ,
    initialSeason
  );

  const bodyGeo = createFlockBirdBodyGeometry();
  const leftWingGeo = createFlockBirdWingGeometry(-1);
  const rightWingGeo = createFlockBirdWingGeometry(1);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.74,
    metalness: 0.04,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const bodyInst = new THREE.InstancedMesh(bodyGeo, bodyMat, MAX_FLOCK_BIRDS);
  const leftWingInst = new THREE.InstancedMesh(leftWingGeo, wingMat, MAX_FLOCK_BIRDS);
  const rightWingInst = new THREE.InstancedMesh(rightWingGeo, wingMat, MAX_FLOCK_BIRDS);

  bodyInst.frustumCulled = false;
  leftWingInst.frustumCulled = false;
  rightWingInst.frustumCulled = false;

  // Initialize instance color attributes up front so setColorAt never reallocates mid-flight
  const initCol = new THREE.Color(0x354263);
  for (let i = 0; i < MAX_FLOCK_BIRDS; i++) {
    bodyInst.setColorAt(i, initCol);
    leftWingInst.setColorAt(i, initCol);
    rightWingInst.setColorAt(i, initCol);
  }
  if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true;
  if (leftWingInst.instanceColor) leftWingInst.instanceColor.needsUpdate = true;
  if (rightWingInst.instanceColor) rightWingInst.instanceColor.needsUpdate = true;

  bodyInst.count = 0;
  leftWingInst.count = 0;
  rightWingInst.count = 0;

  group.add(bodyInst, leftWingInst, rightWingInst);

  const syncInstances = () => {
    let cursor = 0;
    for (let f = 0; f < state.flocks.length; f++) {
      const birds = state.flocks[f].birds;
      for (let i = 0; i < birds.length && cursor < MAX_FLOCK_BIRDS; i++) {
        const b = birds[i];
        const effScale = b.scale * b.opacityScale;
        if (effScale <= 0.02) continue;

        _dummy.position.set(b.x, b.y, b.z);
        _dummy.rotation.set(b.pitch, b.heading, b.roll, 'YXZ');
        _dummy.scale.setScalar(effScale);
        _dummy.updateMatrix();
        _parentMat.copy(_dummy.matrix);
        bodyInst.setMatrixAt(cursor, _parentMat);

        // Articulated left wing
        _wingDummy.position.set(-0.048, 0.022, 0.02);
        _wingDummy.rotation.set(0, 0, -b.wingAngle);
        _wingDummy.scale.set(1, 1, 1);
        _wingDummy.updateMatrix();
        _localMat.copy(_wingDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        leftWingInst.setMatrixAt(cursor, _finalMat);

        // Articulated right wing
        _wingDummy.position.set(0.048, 0.022, 0.02);
        _wingDummy.rotation.set(0, 0, b.wingAngle);
        _wingDummy.scale.set(1, 1, 1);
        _wingDummy.updateMatrix();
        _localMat.copy(_wingDummy.matrix);
        _finalMat.multiplyMatrices(_parentMat, _localMat);
        rightWingInst.setMatrixAt(cursor, _finalMat);

        _color.setHex(b.bodyColorHex);
        bodyInst.setColorAt(cursor, _color);
        _color.setHex(b.wingColorHex);
        leftWingInst.setColorAt(cursor, _color);
        rightWingInst.setColorAt(cursor, _color);

        cursor++;
      }
    }

    const visible = cursor > 0;
    bodyInst.visible = visible;
    leftWingInst.visible = visible;
    rightWingInst.visible = visible;
    bodyInst.count = cursor;
    leftWingInst.count = cursor;
    rightWingInst.count = cursor;

    if (visible) {
      bodyInst.instanceMatrix.needsUpdate = true;
      leftWingInst.instanceMatrix.needsUpdate = true;
      rightWingInst.instanceMatrix.needsUpdate = true;
      if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true;
      if (leftWingInst.instanceColor) leftWingInst.instanceColor.needsUpdate = true;
      if (rightWingInst.instanceColor) rightWingInst.instanceColor.needsUpdate = true;
    }
  };

  // Seed initial matrices so first frame renders immediately
  syncInstances();

  const update = (
    elapsed: number,
    dt: number,
    timeHours: number,
    weather: WeatherType,
    season: SeasonType,
    playerX: number,
    playerZ: number
  ): FlockingStats => {
    stepBirdFlockingSystem(
      state,
      dt,
      elapsed,
      timeHours,
      weather,
      season,
      playerX,
      playerZ
    );
    syncInstances();
    return getFlockingStats(state);
  };

  const reset = (
    playerX: number,
    playerZ: number,
    season: SeasonType
  ): FlockingStats => {
    state = createInitialBirdFlockingState(playerX, playerZ, season);
    syncInstances();
    return getFlockingStats(state);
  };

  const onFocusTeleport = (
    playerX: number,
    playerZ: number,
    timeHours: number,
    weather: WeatherType,
    season: SeasonType
  ): FlockingStats => {
    refreshFlocksForFocus(state, playerX, playerZ, timeHours, weather, season);
    syncInstances();
    return getFlockingStats(state);
  };

  const getStats = (): FlockingStats => getFlockingStats(state);

  const dispose = () => {
    bodyGeo.dispose();
    leftWingGeo.dispose();
    rightWingGeo.dispose();
    bodyMat.dispose();
    wingMat.dispose();
  };

  return {
    group,
    update,
    reset,
    onFocusTeleport,
    getStats,
    dispose,
  };
}
