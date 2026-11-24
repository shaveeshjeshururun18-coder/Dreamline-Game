import * as THREE from 'three';
import type { PlayerLanternState } from '../game/playerLantern';

export interface PlayerLanternRig {
  group: THREE.Group;
  light: THREE.PointLight;
  update: (params: {
    x: number;
    y: number;
    z: number;
    heading: number;
    scale: number;
    groundY: number;
    state: PlayerLanternState;
    isOnBike: boolean;
    isHeroActive: boolean;
    visible: boolean;
    elapsed: number;
  }) => void;
  dispose: () => void;
}

function createSoftGlowTexture(
  innerColor: string,
  midColor: string,
  outerColor: string
): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      2,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0.0, innerColor);
    grad.addColorStop(0.28, midColor);
    grad.addColorStop(0.65, outerColor);
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Composite 10-part procedural brass-and-glass Japanese handheld Explorer Lantern
 * carried by the player (works seamlessly for both the teen traveler and all Superheroes).
 * Casts genuine warm amber PointLight + soft additive halo + warm ground light pool.
 */
export function createPlayerLanternRig(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): PlayerLanternRig {
  const group = new THREE.Group();
  const lanternPivot = new THREE.Group();
  group.add(lanternPivot);

  const disposables: Array<{ dispose: () => void }> = [];

  // Brushed Antique Brass (high metalness, low-mid roughness for crisp rim highlights)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc99643,
    roughness: 0.28,
    metalness: 0.85,
  });
  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x2b2520,
    roughness: 0.62,
    metalness: 0.68,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b3,
    emissive: new THREE.Color(0xffaa3b),
    emissiveIntensity: 0.0,
    roughness: 0.14,
    metalness: 0.05,
    transparent: true,
    opacity: 0.78,
  });
  const flameCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfff8dc,
  });
  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xffa638,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const haloTex = createSoftGlowTexture(
    'rgba(255, 245, 200, 0.95)',
    'rgba(255, 185, 82, 0.52)',
    'rgba(255, 130, 35, 0.14)'
  );
  const poolTex = createSoftGlowTexture(
    'rgba(255, 205, 115, 0.62)',
    'rgba(255, 168, 72, 0.30)',
    'rgba(240, 120, 30, 0.06)'
  );
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  disposables.push(
    brassMat,
    darkIronMat,
    glassMat,
    flameCoreMat,
    flameOuterMat,
    haloTex,
    poolTex,
    haloMat,
    poolMat
  );

  const addPart = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number
  ) => {
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  };

  // Lantern hangs from lanternPivot origin (0, 0, 0) = grip/handle top so pendulum sway pivots naturally!
  // 1. Arched brass bail handle & top hanging ring
  const bailGeo = new THREE.TorusGeometry(0.085, 0.011, 8, 18, Math.PI);
  const bail = addPart(lanternPivot, bailGeo, brassMat, 0, -0.075, 0);
  bail.rotation.y = Math.PI * 0.5;
  addPart(lanternPivot, new THREE.TorusGeometry(0.024, 0.007, 6, 12), brassMat, 0, -0.015, 0);

  // 2. Stepped brass chimney finial & vented dome hood
  addPart(lanternPivot, new THREE.CylinderGeometry(0.022, 0.036, 0.042, 8), darkIronMat, 0, -0.095, 0);
  addPart(lanternPivot, new THREE.ConeGeometry(0.115, 0.072, 6), brassMat, 0, -0.145, 0);

  // 3. Upper & lower hexagonal brass collar rims
  addPart(lanternPivot, new THREE.CylinderGeometry(0.098, 0.098, 0.022, 6), darkIronMat, 0, -0.185, 0);
  addPart(lanternPivot, new THREE.CylinderGeometry(0.096, 0.112, 0.045, 6), brassMat, 0, -0.375, 0);

  // 4. Weighted oil reservoir base
  addPart(lanternPivot, new THREE.CylinderGeometry(0.115, 0.102, 0.042, 8), darkIronMat, 0, -0.415, 0);

  // 5. Four protective vertical brass guard rods around the glass chamber
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    addPart(
      lanternPivot,
      new THREE.CylinderGeometry(0.008, 0.008, 0.185, 6),
      brassMat,
      Math.cos(a) * 0.086,
      -0.28,
      Math.sin(a) * 0.086
    );
  }

  // 6. Warm amber glass chamber cylinder
  addPart(lanternPivot, new THREE.CylinderGeometry(0.076, 0.072, 0.175, 12), glassMat, 0, -0.28, 0);

  // 7. Layered inner oil-wick flame (bright white-gold core + warm orange outer envelope)
  const flameGroup = new THREE.Group();
  flameGroup.position.set(0, -0.29, 0);
  lanternPivot.add(flameGroup);
  addPart(flameGroup, new THREE.SphereGeometry(0.026, 8, 8), flameCoreMat, 0, 0.012, 0).scale.set(0.85, 1.45, 0.85);
  addPart(flameGroup, new THREE.SphereGeometry(0.042, 8, 8), flameOuterMat, 0, 0.02, 0).scale.set(0.95, 1.55, 0.95);

  // 8. Crossed additive volumetric glow halo planes around the lantern
  const haloGeo = new THREE.PlaneGeometry(1.15, 1.15);
  disposables.push(haloGeo);
  const haloPlaneA = new THREE.Mesh(haloGeo, haloMat);
  haloPlaneA.position.set(0, -0.28, 0);
  const haloPlaneB = new THREE.Mesh(haloGeo, haloMat);
  haloPlaneB.position.set(0, -0.28, 0);
  haloPlaneB.rotation.y = Math.PI * 0.5;
  lanternPivot.add(haloPlaneA, haloPlaneB);

  // 9. Soft warm ground light pool beneath the player (world-aligned horizontal disc)
  const poolGeo = new THREE.CircleGeometry(4.8, isSoftwareGl ? 18 : 26);
  poolGeo.rotateX(-Math.PI / 2);
  disposables.push(poolGeo);
  const groundPool = new THREE.Mesh(poolGeo, poolMat);
  groundPool.renderOrder = 2;
  group.add(groundPool);

  // 10. Real dynamic warm amber PointLight (highest priority in DreamlineEngine light budget!)
  const light = new THREE.PointLight(0xffbe63, 0, 26, 1.25);
  light.position.set(0, -0.26, 0);
  light.userData.isPlayerLantern = true;
  lanternPivot.add(light);

  scene.add(group);

  const update = (params: {
    x: number;
    y: number;
    z: number;
    heading: number;
    scale: number;
    groundY: number;
    state: PlayerLanternState;
    isOnBike: boolean;
    isHeroActive: boolean;
    visible: boolean;
    elapsed: number;
  }) => {
    const b = params.state.brightness;
    const showLantern = params.visible && (params.state.isOn || b > 0.02);
    group.visible = showLantern;

    if (!showLantern) {
      light.intensity = 0;
      return;
    }

    const s = Math.max(0.85, params.scale);
    const sinH = Math.sin(params.heading);
    const cosH = Math.cos(params.heading);
    // Right-hand side vector (-cosH, sinH) and forward vector (sinH, cosH) matching Three.js player heading
    const sideOffset = params.isOnBike ? 0.0 : params.isHeroActive ? -0.38 * s : -0.24 * s;
    const forwardOffset = params.isOnBike ? 0.72 * s : params.isHeroActive ? 0.48 * s : 0.33 * s;
    const handHeight = params.isOnBike ? 1.02 * s : params.isHeroActive ? 1.24 * s : 1.14 * s;

    const lx = params.x + cosH * sideOffset + sinH * forwardOffset;
    const ly = params.y + handHeight;
    const lz = params.z - sinH * sideOffset + cosH * forwardOffset;

    group.position.set(lx, ly, lz);
    lanternPivot.scale.setScalar(Math.min(3.0, Math.max(0.95, s * 0.92)));
    lanternPivot.rotation.set(
      params.state.swingAngleX,
      params.heading,
      params.state.swingAngleZ
    );

    // Animate warm flame & emissive amber glass
    const flick = params.state.flickerFactor;
    glassMat.emissiveIntensity = b * 2.5 * flick;
    flameGroup.visible = b > 0.06;
    flameGroup.scale.set(
      0.85 + (flick - 1) * 1.4,
      (0.85 + b * 0.25) * flick,
      0.85 + (flick - 1) * 1.4
    );

    haloMat.opacity = Math.min(0.68, b * 0.62 * flick);
    const haloScale = (0.72 + b * 0.36) * (0.96 + Math.sin(params.elapsed * 5.2) * 0.04);
    haloPlaneA.scale.setScalar(haloScale);
    haloPlaneB.scale.setScalar(haloScale);

    // Keep ground glow pool flush above terrain/platform surface (+0.045m prevents Z-fighting)
    const dropY = params.groundY + 0.045 - ly;
    groundPool.position.set(0, dropY, 0);
    const poolRadiusScale = Math.max(0.85, Math.min(2.4, 0.95 + Math.max(0, -dropY) * 0.1));
    groundPool.scale.setScalar(poolRadiusScale);
    poolMat.opacity = Math.min(0.36, b * 0.32 * flick);

    // Dynamic PointLight intensity & range
    light.intensity = params.state.effectiveIntensity;
    light.distance = params.state.effectiveRange;
  };

  return {
    group,
    light,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.remove(group);
    },
  };
}
