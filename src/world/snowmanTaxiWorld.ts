import * as THREE from 'three';
import type { SnowmanTaxiState, SnowmanTransportId } from '../game/snowmanTaxi';

export interface SnowmanTaxiWorld3D {
  group: THREE.Group;
  update: (state: SnowmanTaxiState, elapsed: number, dt: number) => void;
  dispose: () => void;
}

function buildSnowmanDriverMesh(): { root: THREE.Group; scarfTail: THREE.Mesh; rightArm: THREE.Mesh } {
  const root = new THREE.Group();
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55, metalness: 0.05 });
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.65 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const hatBandMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 });

  const lower = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), snowMat);
  lower.position.y = 0.32;
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), snowMat);
  torso.position.y = 0.78;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), snowMat);
  head.position.y = 1.18;

  // Carrot nose & coal eyes + buttons
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 8), carrotMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.18, 0.25);

  for (const sx of [-0.075, 0.075]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), coalMat);
    eye.position.set(sx, 1.24, 0.18);
    root.add(eye);
  }
  for (let b = 0; b < 3; b++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), coalMat);
    btn.position.set(0, 0.68 + b * 0.11, 0.26);
    root.add(btn);
  }

  // Red scarf + fluttering tail
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.048, 8, 16), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.99;
  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.36), scarfMat);
  scarfTail.position.set(0.14, 0.94, -0.2);

  // Top hat with glowing taxi blue band
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 14), hatMat);
  brim.position.y = 1.37;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.24, 14), hatMat);
  crown.position.y = 1.5;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.055, 14), hatBandMat);
  band.position.y = 1.42;

  // Twig arms holding controls
  const twigMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.44, 6), twigMat);
  leftArm.position.set(-0.3, 0.82, 0.18);
  leftArm.rotation.set(Math.PI * 0.38, 0, 0.32);
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.44, 6), twigMat);
  rightArm.position.set(0.3, 0.82, 0.18);
  rightArm.rotation.set(Math.PI * 0.38, 0, -0.32);

  root.add(lower, torso, head, nose, scarf, scarfTail, brim, crown, band, leftArm, rightArm);
  return { root, scarfTail, rightArm };
}

/**
 * Builds the 3D Snowman Multi-Transport Taxi fleet (all driven by the Snowman, ZERO ships!).
 * Supports instant simultaneous Cycle ⇄ Jet Ski conversion, Jet Ski, Combat Bus,
 * Snowman Express Train, Submarine, Aircraft, and Combined Omni-Craft!
 */
export function buildSnowmanTaxiWorld3D(): SnowmanTaxiWorld3D {
  const group = new THREE.Group();
  group.visible = false;

  const driver = buildSnowmanDriverMesh();
  group.add(driver.root);

  // Shared materials
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.28, metalness: 0.6 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.26, metalness: 0.55 });
  const navyArmorMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.36, metalness: 0.65 });
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.3, metalness: 0.55 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.24, metalness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.72, metalness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.26, metalness: 0.75 });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x22d3ee,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.1,
    metalness: 0.5,
    transparent: true,
    opacity: 0.58,
  });

  // 1. CYCLE (Spoked Bicycle that converts simultaneously into Jet Ski!)
  const cycleGroup = new THREE.Group();
  const cycleWheels: THREE.Mesh[] = [];
  for (const wz of [-0.75, 0.75]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 8, 18), darkMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.44, wz);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 10), cyanGlowMat);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);
    cycleGroup.add(wheel);
    cycleWheels.push(wheel);
  }
  const frameBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.5), redMat);
  frameBar.position.set(0, 0.76, 0);
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.1), whiteMat);
  fork.position.set(0, 0.84, 0.62);
  fork.rotation.x = -0.25;
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 8), darkMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.2, 0.56);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.55), darkMat);
  seat.position.set(0, 0.84, -0.28);
  const cycleLamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), cyanGlowMat);
  cycleLamp.position.set(0, 1.05, 0.78);
  cycleGroup.add(frameBar, fork, handleBar, seat, cycleLamp);
  group.add(cycleGroup);

  // 2. JET SKI (Also serves as morphed form of Cycle ⇄ Jet Ski!)
  const jetSkiGroup = new THREE.Group();
  const skiHull = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.48, 3.05), blueMat);
  skiHull.position.set(0, 0.28, 0.08);
  const skiNose = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.15, 6), whiteMat);
  skiNose.rotation.x = Math.PI / 2;
  skiNose.scale.set(1.0, 0.52, 1.0);
  skiNose.position.set(0, 0.34, 2.02);
  const skiStripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 2.5), cyanGlowMat);
  skiStripe.position.set(0, 0.44, 0.1);
  const skiSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 1.55), darkMat);
  skiSeat.position.set(0, 0.62, -0.25);
  const skiConsole = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.6), whiteMat);
  skiConsole.position.set(0, 0.72, 0.82);
  const skiHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), darkMat);
  skiHandle.rotation.z = Math.PI / 2;
  skiHandle.position.set(0, 1.02, 0.74);
  const skiWake = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 2.2, 10),
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
  skiWake.rotation.x = -Math.PI / 2;
  skiWake.position.set(0, 0.22, -2.35);
  jetSkiGroup.add(skiHull, skiNose, skiStripe, skiSeat, skiConsole, skiHandle, skiWake);
  group.add(jetSkiGroup);

  // 3. COMBAT BUS (Armoured Snowman Combat Bus)
  const busGroup = new THREE.Group();
  const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.95, 6.4), navyArmorMat);
  busBody.position.set(0, 1.48, 0);
  const busRoof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.26, 5.8), goldMat);
  busRoof.position.set(0, 2.55, 0);
  const busWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.78, 0.12), glassMat);
  busWindshield.position.set(0, 1.85, 3.22);
  const busBumper = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.52, 0.48), goldMat);
  busBumper.position.set(0, 0.65, 3.28);
  const busBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 12), cyanGlowMat);
  busBeacon.position.set(0, 2.8, 1.6);
  const busWheels: THREE.Mesh[] = [];
  for (const wx of [-1.32, 1.32]) {
    for (const wz of [-2.05, 2.05]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.38, 14), darkMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.55, wz);
      busGroup.add(w);
      busWheels.push(w);
    }
  }
  busGroup.add(busBody, busRoof, busWindshield, busBumper, busBeacon);
  group.add(busGroup);

  // 4. SNOWMAN EXPRESS TRAIN
  const trainGroup = new THREE.Group();
  const trainHull = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.1, 7.2), redMat);
  trainHull.position.set(0, 1.55, 0);
  const trainStripe = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.28, 7.0), goldMat);
  trainStripe.position.set(0, 1.1, 0);
  const trainNose = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 1.6, 12), whiteMat);
  trainNose.rotation.x = Math.PI / 2;
  trainNose.position.set(0, 1.45, 4.15);
  const trainLamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), cyanGlowMat);
  trainLamp.position.set(0, 1.52, 4.95);
  const trainGlass = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 0.14), glassMat);
  trainGlass.position.set(0, 2.05, 3.62);
  const trainBogie = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 6.2), darkMat);
  trainBogie.position.set(0, 0.35, 0);
  trainGroup.add(trainHull, trainStripe, trainNose, trainLamp, trainGlass, trainBogie);
  group.add(trainGroup);

  // 5. SNOWMAN SUBMARINE
  const subGroup = new THREE.Group();
  const subHull = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 4.2, 8, 16), tealMat);
  subHull.rotation.x = Math.PI / 2;
  subHull.position.set(0, 0.85, 0);
  const subTower = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.68, 0.95, 14), goldMat);
  subTower.position.set(0, 1.85, 0.45);
  const subDome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), glassMat);
  subDome.position.set(0, 2.28, 0.45);
  const subProp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), goldMat);
  subProp.position.set(0, 0.85, -3.2);
  const subLight = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), cyanGlowMat);
  subLight.position.set(0, 0.9, 3.05);
  subGroup.add(subHull, subTower, subDome, subProp, subLight);
  group.add(subGroup);

  // 6. SNOWMAN AIRCRAFT
  const aircraftGroup = new THREE.Group();
  const airFuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 4.5, 8, 16), whiteMat);
  airFuselage.rotation.x = Math.PI / 2;
  airFuselage.position.set(0, 1.15, 0);
  const airWings = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 1.65), blueMat);
  airWings.position.set(0, 1.05, 0.25);
  const airTail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.85), redMat);
  airTail.position.set(0, 1.55, -2.5);
  const airFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.35, 1.0), redMat);
  airFin.position.set(0, 1.85, -2.4);
  const airCanopy = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 12), glassMat);
  airCanopy.scale.set(0.95, 0.72, 1.6);
  airCanopy.position.set(0, 1.68, 1.15);
  for (const sx of [-1.75, 1.75]) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.2, 12), darkMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(sx, 0.82, 0.25);
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.1, 8), cyanGlowMat);
    jet.rotation.x = -Math.PI / 2;
    jet.position.set(sx, 0.82, -0.85);
    aircraftGroup.add(pod, jet);
  }
  aircraftGroup.add(airFuselage, airWings, airTail, airFin, airCanopy);
  group.add(aircraftGroup);

  // 7. COMBINED OMNI-CRAFT (Aircraft + Combat Bus + Train + Submarine + Jet Ski — NO Ship!)
  const omniGroup = new THREE.Group();
  const omniBody = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.6, 6.0), navyArmorMat);
  omniBody.position.set(0, 1.28, 0);
  const omniTrainNose = new THREE.Mesh(new THREE.ConeGeometry(1.18, 1.85, 8), redMat);
  omniTrainNose.rotation.x = Math.PI / 2;
  omniTrainNose.position.set(0, 1.28, 3.88);
  const omniSubDome = new THREE.Mesh(new THREE.SphereGeometry(0.86, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), glassMat);
  omniSubDome.position.set(0, 2.08, 0.75);
  const omniWings = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 1.75), blueMat);
  omniWings.position.set(0, 1.52, -0.15);
  const omniGlowStrip = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 0.22), cyanGlowMat);
  omniGlowStrip.position.set(0, 1.62, 0.65);
  // Twin hydro Jet-Ski skis + retractable Bus/Train wheels underneath!
  for (const sx of [-1.25, 1.25]) {
    const ski = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 4.8), whiteMat);
    ski.position.set(sx, 0.28, 0.1);
    const thruster = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.45, 8), cyanGlowMat);
    thruster.rotation.x = -Math.PI / 2;
    thruster.position.set(sx * 1.4, 1.42, -3.55);
    omniGroup.add(ski, thruster);
  }
  omniGroup.add(omniBody, omniTrainNose, omniSubDome, omniWings, omniGlowStrip);
  group.add(omniGroup);

  // Simultaneous Instant Morph Energy Ring VFX!
  const morphRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const morphRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.14, 10, 28), morphRingMat);
  morphRing.rotation.x = Math.PI / 2;
  morphRing.position.y = 0.85;
  group.add(morphRing);

  const vehicleMap: Record<SnowmanTransportId, THREE.Group> = {
    cycle_jetski: cycleGroup,
    jetski: jetSkiGroup,
    combat_bus: busGroup,
    snowman_train: trainGroup,
    snowman_submarine: subGroup,
    snowman_aircraft: aircraftGroup,
    combined_omni: omniGroup,
  };

  const update: SnowmanTaxiWorld3D['update'] = (state, elapsed, dt) => {
    const visible = state.phase !== 'idle';
    group.visible = visible;
    if (!visible) return;

    const bob =
      state.activeTransport === 'jetski' ||
      (state.activeTransport === 'cycle_jetski' && state.cycleMorphedToJetSki) ||
      state.activeTransport === 'snowman_submarine'
        ? Math.sin(elapsed * 5.2) * 0.09
        : state.activeTransport === 'snowman_aircraft' || state.activeTransport === 'combined_omni'
          ? Math.sin(elapsed * 3.8) * 0.14
          : 0;

    group.position.set(state.x, state.y + bob, state.z);
    group.rotation.y = state.heading;

    // Show ONLY the active vehicle (and switch Cycle <-> Jet Ski instantaneously!)
    const showJetSki =
      state.activeTransport === 'jetski' ||
      (state.activeTransport === 'cycle_jetski' && state.cycleMorphedToJetSki);
    const showCycle = state.activeTransport === 'cycle_jetski' && !state.cycleMorphedToJetSki;

    cycleGroup.visible = showCycle;
    jetSkiGroup.visible = showJetSki;
    busGroup.visible = state.activeTransport === 'combat_bus';
    trainGroup.visible = state.activeTransport === 'snowman_train';
    subGroup.visible = state.activeTransport === 'snowman_submarine';
    aircraftGroup.visible = state.activeTransport === 'snowman_aircraft';
    omniGroup.visible = state.activeTransport === 'combined_omni';

    // Position the universal Snowman Driver visibly in the cockpit/seat of EVERY vehicle!
    if (showCycle) {
      driver.root.position.set(0, 0.72, -0.05);
      driver.root.scale.setScalar(0.86);
    } else if (showJetSki) {
      driver.root.position.set(0, 0.56, 0.25);
      driver.root.scale.setScalar(0.88);
    } else if (state.activeTransport === 'combat_bus') {
      driver.root.position.set(0, 1.35, 2.35);
      driver.root.scale.setScalar(0.92);
    } else if (state.activeTransport === 'snowman_train') {
      driver.root.position.set(0, 1.48, 2.55);
      driver.root.scale.setScalar(0.92);
    } else if (state.activeTransport === 'snowman_submarine') {
      driver.root.position.set(0, 1.65, 0.45);
      driver.root.scale.setScalar(0.82);
    } else if (state.activeTransport === 'snowman_aircraft') {
      driver.root.position.set(0, 1.38, 1.05);
      driver.root.scale.setScalar(0.84);
    } else {
      // Combined Omni-Craft command dome
      driver.root.position.set(0, 1.85, 0.75);
      driver.root.scale.setScalar(0.9);
    }

    driver.scarfTail.rotation.y = Math.sin(elapsed * 14) * 0.35;
    driver.rightArm.rotation.z = -0.32 + Math.sin(elapsed * 6) * 0.14;

    // Spin wheels / propeller / wake
    const spin = dt * Math.max(4, state.speed * 0.9);
    for (const w of cycleWheels) w.rotation.x += spin;
    for (const w of busWheels) w.rotation.x += spin * 0.7;
    subProp.rotation.z += dt * 16;
    skiWake.visible = showJetSki && state.speed > 1.5;
    if (skiWake.visible) {
      const s = 0.85 + Math.sin(elapsed * 22) * 0.2;
      skiWake.scale.set(s, 1.0 + state.speed * 0.03, s);
    }

    // Morph Flash VFX Ring when converting Cycle <-> Jet Ski or switching Land <-> Water!
    if (state.morphFlashTimer > 0.02) {
      const t = 1 - Math.min(1, state.morphFlashTimer / 0.9);
      morphRing.visible = true;
      morphRing.scale.setScalar(0.8 + t * 2.4);
      morphRing.position.y = 0.55 + t * 1.4;
      morphRingMat.opacity = (1 - t) * 0.85;
    } else {
      morphRing.visible = false;
    }

    // Keep unused map reference cleanly alive for TS
    void vehicleMap;
  };

  const dispose = () => {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  };

  return { group, update, dispose };
}
