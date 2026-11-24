import * as THREE from 'three';

export interface HeroVfxRenderInput {
  webLine?: {
    fromX: number;
    fromY: number;
    fromZ: number;
    toX: number;
    toY: number;
    toZ: number;
    color: number;
  } | null;
  energyBeam?: {
    fromX: number;
    fromY: number;
    fromZ: number;
    toX: number;
    toY: number;
    toZ: number;
    color: number;
    radius: number;
  } | null;
  shockwave?: { x: number; y: number; z: number; progress: number; color: number } | null;
}

export interface HeroVfxSystem3D {
  group: THREE.Group;
  update: (vfx: HeroVfxRenderInput) => void;
  dispose: () => void;
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function alignCylinderBetween(
  mesh: THREE.Mesh,
  fx: number,
  fy: number,
  fz: number,
  tx: number,
  ty: number,
  tz: number,
  radiusScale = 1
): void {
  _from.set(fx, fy, fz);
  _to.set(tx, ty, tz);
  _dir.subVectors(_to, _from);
  const len = _dir.length();
  if (len < 0.05) {
    mesh.visible = false;
    return;
  }
  mesh.position.copy(_from).addScaledVector(_dir, 0.5);
  mesh.scale.set(radiusScale, len, radiusScale);
  mesh.quaternion.setFromUnitVectors(_up, _dir.normalize());
}

/**
 * Standalone lightweight 3D Superhero VFX rig (Spider-Man web line, Batman grapple line,
 * Iron Man Repulsor / Unibeam / Superman Heat Vision beam, and Hulkbuster seismic shockwave).
 */
export function createHeroVfxSystem3D(): HeroVfxSystem3D {
  const group = new THREE.Group();

  const webLineGeo = new THREE.CylinderGeometry(0.032, 0.032, 1, 6);
  const webLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const webLineMesh = new THREE.Mesh(webLineGeo, webLineMat);
  webLineMesh.visible = false;
  group.add(webLineMesh);

  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.visible = false;
  group.add(beamMesh);

  const shockGeo = new THREE.RingGeometry(0.65, 1.0, 28);
  shockGeo.rotateX(-Math.PI / 2);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shockMesh = new THREE.Mesh(shockGeo, shockMat);
  shockMesh.visible = false;
  group.add(shockMesh);

  const update = (vfx: HeroVfxRenderInput) => {
    if (vfx.webLine) {
      webLineMesh.visible = true;
      webLineMat.color.setHex(vfx.webLine.color);
      alignCylinderBetween(
        webLineMesh,
        vfx.webLine.fromX,
        vfx.webLine.fromY,
        vfx.webLine.fromZ,
        vfx.webLine.toX,
        vfx.webLine.toY,
        vfx.webLine.toZ,
        1
      );
    } else {
      webLineMesh.visible = false;
    }

    if (vfx.energyBeam) {
      beamMesh.visible = true;
      beamMat.color.setHex(vfx.energyBeam.color);
      alignCylinderBetween(
        beamMesh,
        vfx.energyBeam.fromX,
        vfx.energyBeam.fromY,
        vfx.energyBeam.fromZ,
        vfx.energyBeam.toX,
        vfx.energyBeam.toY,
        vfx.energyBeam.toZ,
        vfx.energyBeam.radius
      );
    } else {
      beamMesh.visible = false;
    }

    if (vfx.shockwave && vfx.shockwave.progress < 1) {
      shockMesh.visible = true;
      shockMat.color.setHex(vfx.shockwave.color);
      shockMat.opacity = Math.max(0, (1 - vfx.shockwave.progress) * 0.82);
      const r = 1.2 + vfx.shockwave.progress * 14.5;
      shockMesh.position.set(vfx.shockwave.x, vfx.shockwave.y + 0.14, vfx.shockwave.z);
      shockMesh.scale.set(r, 1, r);
    } else {
      shockMesh.visible = false;
    }
  };

  const dispose = () => {
    webLineGeo.dispose();
    webLineMat.dispose();
    beamGeo.dispose();
    beamMat.dispose();
    shockGeo.dispose();
    shockMat.dispose();
  };

  return { group, update, dispose };
}
