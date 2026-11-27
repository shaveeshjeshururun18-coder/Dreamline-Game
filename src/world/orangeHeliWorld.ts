import * as THREE from 'three';
import { ORANGE_HELI_HOME_POS, type OrangeHeliState } from '../game/skyExplorer';
import type { InteractableItem } from '../game/types';

export interface OrangeHeliWorldSystem {
  group: THREE.Group;
  interactable: InteractableItem;
  sync: (state: OrangeHeliState, elapsed: number, playerSeated: boolean) => void;
  getPilotSeatTransform: () => { position: THREE.Vector3; heading: number };
  getCompanionSeatTransform: () => { position: THREE.Vector3; heading: number };
  getFollowAnchor: () => THREE.Vector3;
  dispose: () => void;
}

/**
 * Builds the extracted SSJ Orange Rescue Helicopter (rA) from SSJ Dinosaur Island:
 * - Vibrant rescue orange capsule fuselage (0xea580c) with crisp white livery stripe (0xf8fafc)
 * - Cyan glass bubble cockpit (0x38bdf8)
 * - Orange tail boom + white vertical stabilizer + spinning tail rotor
 * - Twin dark steel landing skids (0x1e293b) with struts
 * - Spinning 9.6m 4-blade main rotor + mast hub
 * - Hanging rescue winch cable & glowing amber harness ring (0xf97316)
 * - Parked cleanly on En Illam's External East Rooftop Sky Terrace Pad C (y = 10.4m) — zero yard clutter!
 */
export function buildOrangeHeliWorld(isSoftwareGl: boolean): OrangeHeliWorldSystem {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const beaconGeo = new THREE.SphereGeometry(0.14, 8, 8);
  disposables.push(beaconGeo);

  // Extracted SSJ Orange Rescue Helicopter (exact rA palette & proportions)
  const heliRoot = new THREE.Group();
  const bodyPivot = new THREE.Group();
  heliRoot.add(bodyPivot);

  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xea580c, // 15357964 rescue orange
    roughness: 0.3,
    metalness: 0.22,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.36,
    metalness: 0.12,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.72,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.62,
  });
  const harnessMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.35,
    roughness: 0.25,
  });
  const strobeRedMat = new THREE.MeshStandardMaterial({
    color: 0xf87171,
    emissive: 0xef4444,
    emissiveIntensity: 2.0,
  });
  const strobeGreenMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: 0x22c55e,
    emissiveIntensity: 2.0,
  });
  disposables.push(orangeMat, whiteMat, darkSteelMat, glassMat, harnessMat, strobeRedMat, strobeGreenMat);

  // Main Rescue Orange Capsule Fuselage (oriented forward along +Z)
  const fuselageGeo = new THREE.CapsuleGeometry(1.18, 3.1, 10, 16);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, orangeMat);
  fuselage.position.set(0, 1.95, 0.15);
  fuselage.scale.set(1.02, 0.94, 1.0);
  fuselage.castShadow = !isSoftwareGl;
  bodyPivot.add(fuselage);

  // Crisp White Livery Band wrapping mid fuselage
  const stripeGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.52, 16);
  stripeGeo.rotateX(Math.PI / 2);
  const stripe = new THREE.Mesh(stripeGeo, whiteMat);
  stripe.position.set(0, 1.92, -0.25);
  stripe.scale.set(1.02, 0.95, 1.0);
  bodyPivot.add(stripe);

  // Cyan Bubble Cockpit Canopy
  const cockpitGeo = new THREE.SphereGeometry(1.12, 16, 12);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(0, 2.08, 1.62);
  cockpit.scale.set(0.95, 0.84, 1.15);
  bodyPivot.add(cockpit);

  // Upper Turbine Engine Cowling
  const cowlingGeo = new THREE.BoxGeometry(1.25, 0.65, 2.35);
  const cowling = new THREE.Mesh(cowlingGeo, orangeMat);
  cowling.position.set(0, 2.98, -0.35);
  cowling.castShadow = !isSoftwareGl;
  bodyPivot.add(cowling);

  // Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.65, 8);
  exhaustGeo.rotateX(Math.PI / 2);
  for (const sx of [-0.46, 0.46]) {
    const ex = new THREE.Mesh(exhaustGeo, darkSteelMat);
    ex.position.set(sx, 3.02, -1.6);
    bodyPivot.add(ex);
  }

  // Orange Tail Boom + White Vertical Stabilizer + Horizontal Tailplane
  const boomGeo = new THREE.CylinderGeometry(0.24, 0.46, 4.6, 10);
  boomGeo.rotateX(Math.PI / 2);
  const boom = new THREE.Mesh(boomGeo, orangeMat);
  boom.position.set(0, 2.15, -3.55);
  boom.castShadow = !isSoftwareGl;
  bodyPivot.add(boom);

  const finGeo = new THREE.BoxGeometry(0.18, 1.65, 0.95);
  const fin = new THREE.Mesh(finGeo, whiteMat);
  fin.position.set(0, 2.75, -5.65);
  fin.rotation.x = -0.26;
  bodyPivot.add(fin);

  const tailPlaneGeo = new THREE.BoxGeometry(1.9, 0.1, 0.48);
  const tailPlane = new THREE.Mesh(tailPlaneGeo, orangeMat);
  tailPlane.position.set(0, 2.15, -4.65);
  bodyPivot.add(tailPlane);

  // Spinning Tail Rotor
  const tailRotorPivot = new THREE.Group();
  tailRotorPivot.position.set(0.24, 2.95, -5.75);
  const tailHubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8);
  tailHubGeo.rotateZ(Math.PI / 2);
  const tailBladeGeo = new THREE.BoxGeometry(0.06, 1.55, 0.16);
  tailRotorPivot.add(
    new THREE.Mesh(tailHubGeo, darkSteelMat),
    new THREE.Mesh(tailBladeGeo, whiteMat)
  );
  const tailBlade2 = new THREE.Mesh(tailBladeGeo, darkSteelMat);
  tailBlade2.rotation.x = Math.PI / 2;
  tailRotorPivot.add(tailBlade2);
  bodyPivot.add(tailRotorPivot);

  // Twin Dark Steel Landing Skids & Cross-Struts (rest flush at y = 0.0)
  const skidGeo = new THREE.CylinderGeometry(0.09, 0.09, 4.4, 8);
  skidGeo.rotateX(Math.PI / 2);
  const strutGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.25, 6);
  for (const side of [-1, 1]) {
    const skid = new THREE.Mesh(skidGeo, darkSteelMat);
    skid.position.set(side * 1.18, 0.1, 0.2);
    bodyPivot.add(skid);

    for (const sz of [-0.95, 1.15]) {
      const strut = new THREE.Mesh(strutGeo, darkSteelMat);
      strut.position.set(side * 0.96, 0.68, sz);
      strut.rotation.z = side * 0.34;
      bodyPivot.add(strut);
    }

    // Navigation Strobes (Port Red, Starboard Green)
    const navLight = new THREE.Mesh(beaconGeo, side < 0 ? strobeRedMat : strobeGreenMat);
    navLight.position.set(side * 1.28, 1.9, 0.45);
    bodyPivot.add(navLight);
  }

  // Spinning 9.6m 4-Blade Main Rotor Mast & Hub
  const mastGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.72, 10);
  const mast = new THREE.Mesh(mastGeo, darkSteelMat);
  mast.position.set(0, 3.55, -0.15);
  bodyPivot.add(mast);

  const mainRotorPivot = new THREE.Group();
  mainRotorPivot.position.set(0, 3.88, -0.15);
  const mainHubGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.22, 12);
  const mainBladeGeo = new THREE.BoxGeometry(9.6, 0.06, 0.34);
  const bladeTipGeo = new THREE.BoxGeometry(0.65, 0.07, 0.36);
  mainRotorPivot.add(new THREE.Mesh(mainHubGeo, darkSteelMat));
  for (let b = 0; b < 2; b++) {
    const bg = new THREE.Group();
    bg.rotation.y = (b * Math.PI) / 2;
    bg.add(new THREE.Mesh(mainBladeGeo, darkSteelMat));
    for (const side of [-1, 1]) {
      const tip = new THREE.Mesh(bladeTipGeo, orangeMat);
      tip.position.set(side * 4.48, 0, 0);
      bg.add(tip);
    }
    mainRotorPivot.add(bg);
  }
  bodyPivot.add(mainRotorPivot);

  // Hanging Rescue Winch Arm, Cable & Glowing Amber Harness Ring (rA signature detail!)
  const winchArmGeo = new THREE.BoxGeometry(0.75, 0.14, 0.22);
  const winchArm = new THREE.Mesh(winchArmGeo, darkSteelMat);
  winchArm.position.set(1.22, 2.55, 0.35);
  const cableGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.45, 5);
  const cable = new THREE.Mesh(cableGeo, darkSteelMat);
  cable.position.set(1.52, 1.82, 0.35);
  const ringGeo = new THREE.TorusGeometry(0.24, 0.055, 8, 16);
  const harnessRing = new THREE.Mesh(ringGeo, harnessMat);
  harnessRing.position.set(1.52, 0.96, 0.35);
  bodyPivot.add(winchArm, cable, harnessRing);

  disposables.push(
    fuselageGeo,
    stripeGeo,
    cockpitGeo,
    cowlingGeo,
    exhaustGeo,
    boomGeo,
    finGeo,
    tailPlaneGeo,
    tailHubGeo,
    tailBladeGeo,
    skidGeo,
    strutGeo,
    mastGeo,
    mainHubGeo,
    mainBladeGeo,
    bladeTipGeo,
    winchArmGeo,
    cableGeo,
    ringGeo
  );

  group.add(heliRoot);

  const interactable: InteractableItem = {
    id: 'board_orange_heli',
    kind: 'orange_heli_fly',
    label: 'Fly SSJ Orange Rescue Helicopter',
    sublabel: 'ஆரஞ்சு மீட்பு ஹெலிகாப்டர் · Rooftop Sky Terrace Pad C — click [E] to launch!',
    x: ORANGE_HELI_HOME_POS.x,
    y: ORANGE_HELI_HOME_POS.y + 1.0,
    z: ORANGE_HELI_HOME_POS.z,
    radius: 6.5,
    locationId: 'my_home',
  };

  const pilotLocal = new THREE.Vector3(-0.36, 1.55, 1.05);
  const companionLocal = new THREE.Vector3(0.42, 1.48, 0.95);
  const anchorLocal = new THREE.Vector3(0, 2.25, 0);

  const sync = (state: OrangeHeliState, elapsed: number, _playerSeated: boolean) => {
    heliRoot.position.set(state.x, state.y, state.z);
    heliRoot.rotation.y = state.heading;

    const hoverBob = state.onGround ? 0 : Math.sin(elapsed * 2.8) * 0.12;
    bodyPivot.position.y = hoverBob;
    bodyPivot.rotation.x = state.pitch;
    bodyPivot.rotation.z = state.roll;

    mainRotorPivot.rotation.y = state.rotorAngle;
    tailRotorPivot.rotation.x = state.rotorAngle * 2.4;
    harnessRing.rotation.y = elapsed * 1.4;

    interactable.x = state.x;
    interactable.y = state.y + 1.0;
    interactable.z = state.z;
  };

  return {
    group,
    interactable,
    sync,
    getPilotSeatTransform: () => {
      heliRoot.updateMatrixWorld();
      return {
        position: pilotLocal.clone().applyMatrix4(heliRoot.matrixWorld),
        heading: heliRoot.rotation.y,
      };
    },
    getCompanionSeatTransform: () => {
      heliRoot.updateMatrixWorld();
      return {
        position: companionLocal.clone().applyMatrix4(heliRoot.matrixWorld),
        heading: heliRoot.rotation.y,
      };
    },
    getFollowAnchor: () => {
      heliRoot.updateMatrixWorld();
      return anchorLocal.clone().applyMatrix4(heliRoot.matrixWorld);
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
