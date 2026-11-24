import * as THREE from 'three';
import type { BatmobileState } from '../game/batmobile';

export interface BatmobileWorldSystem {
  group: THREE.Group;
  update: (state: BatmobileState, elapsed: number, lanternStrength: number) => void;
  dispose: () => void;
}

/**
 * Vehicle 06: Armoured Batmobile (Futuristic Stealth Tumbler + Arkham Bat-Fin Hybrid)
 * - Angular matte-black & gunmetal stealth armour panels
 * - Wide armoured front wheel pods, dual turbine nose intakes & twin white LED headlights
 * - 4 oversized deeply-treaded tactical tires with spinning rims, red brake calipers & steering
 * - Animated sliding armoured cockpit canopy exposing glowing cyan dashboard & seat
 * - Twin swept rear bat-wing stabilizer fins, crimson LED tail bar & jet afterburner flame
 */
export function buildBatmobileWorld(_isSoftwareGl = false): BatmobileWorldSystem {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const matteStealth = new THREE.MeshStandardMaterial({
    color: 0x222936,
    roughness: 0.38,
    metalness: 0.62,
  });
  const satinCarbon = new THREE.MeshStandardMaterial({
    color: 0x313c4f,
    roughness: 0.3,
    metalness: 0.72,
  });
  const gunmetal = new THREE.MeshStandardMaterial({
    color: 0x52647c,
    roughness: 0.28,
    metalness: 0.84,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x151921,
    roughness: 0.88,
    metalness: 0.12,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x8fa0b5,
    roughness: 0.24,
    metalness: 0.88,
  });
  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.32,
    metalness: 0.58,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.84,
  });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const dashGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // 1. Main low-slung armoured central hull
  const mainHull = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.64, 5.25), matteStealth);
  mainHull.position.set(0, 0.72, 0.05);
  bodyGroup.add(mainHull);

  // Sloped angular armoured nose hood (Tumbler + Arkham wedge)
  const noseWedge = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.44, 2.25), satinCarbon);
  noseWedge.position.set(0, 0.92, 1.48);
  noseWedge.rotation.x = 0.22;
  bodyGroup.add(noseWedge);

  // Central front turbine intake scoop
  const turbineHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.95, 16), gunmetal);
  turbineHousing.rotation.x = Math.PI * 0.5;
  turbineHousing.position.set(0, 0.64, 2.52);
  bodyGroup.add(turbineHousing);

  const turbineGlow = new THREE.Mesh(new THREE.CircleGeometry(0.24, 14), dashGlowMat);
  turbineGlow.position.set(0, 0.64, 3.01);
  bodyGroup.add(turbineGlow);

  // Twin aggressive front armoured fender pods flanking front tires
  for (const s of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.56, 2.15), matteStealth);
    pod.position.set(s * 1.18, 0.78, 1.52);
    pod.rotation.x = 0.14;
    pod.rotation.y = -s * 0.08;
    bodyGroup.add(pod);

    const sideVent = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 1.85), satinCarbon);
    sideVent.position.set(s * 1.16, 0.72, -0.35);
    bodyGroup.add(sideVent);

    // Side tactical rocket/exhaust pods
    const sidePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.45, 10), gunmetal);
    sidePipe.rotation.x = Math.PI * 0.5;
    sidePipe.position.set(s * 1.24, 0.56, -0.25);
    bodyGroup.add(sidePipe);

    // Aggressive twin swept rear bat-wing fins!
    const rearFin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.78, 1.92), satinCarbon);
    rearFin.position.set(s * 0.96, 1.32, -1.76);
    rearFin.rotation.x = -0.34;
    rearFin.rotation.z = -s * 0.18;
    bodyGroup.add(rearFin);
  }

  // 2. Interior Cockpit Tub (revealed when sliding canopy opens!)
  const interiorSeat = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.55, 0.85), satinCarbon);
  interiorSeat.position.set(0, 0.94, -0.36);
  bodyGroup.add(interiorSeat);

  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.24, 0.42), gunmetal);
  dashboard.position.set(0, 1.04, 0.56);
  bodyGroup.add(dashboard);

  // Glowing cyan triple-screen tactical cockpit HUD
  for (let i = -1; i <= 1; i++) {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.15), dashGlowMat);
    screen.position.set(i * 0.35, 1.07, 0.34);
    screen.rotation.y = Math.PI;
    bodyGroup.add(screen);
  }

  // 3. Animated Sliding Armoured Cockpit Canopy
  const canopyGroup = new THREE.Group();
  canopyGroup.position.set(0, 1.18, 0.05);
  const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.46, 1.98), matteStealth);
  canopyGroup.add(canopyFrame);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.34, 1.42), glassMat);
  windshield.position.set(0, 0.06, 0.24);
  windshield.rotation.x = 0.2;
  canopyGroup.add(windshield);
  bodyGroup.add(canopyGroup);

  // 4. Twin White LED Headlights + Beams & Crimson Rear LED Tail Bar
  const headlightBeams: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.08), headlightMat);
    hl.position.set(s * 0.86, 0.72, 2.68);
    bodyGroup.add(hl);

    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.68, 5.2, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beam.rotation.x = -Math.PI * 0.5;
    beam.position.set(s * 0.86, 0.68, 5.25);
    bodyGroup.add(beam);
    headlightBeams.push(beam);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.08), tailLightMat);
    tl.position.set(s * 0.72, 0.88, -2.58);
    bodyGroup.add(tl);
  }

  // 5. Rear Jet Afterburner Exhaust Nozzle + Dynamic Flame Cone
  const exhaustNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.68, 16), gunmetal);
  exhaustNozzle.rotation.x = Math.PI * 0.5;
  exhaustNozzle.position.set(0, 0.82, -2.65);
  bodyGroup.add(exhaustNozzle);

  const afterburnerCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 2.35, 14),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  afterburnerCore.rotation.x = -Math.PI * 0.5;
  afterburnerCore.position.set(0, 0.82, -4.1);
  afterburnerCore.visible = false;
  bodyGroup.add(afterburnerCore);

  const afterburnerOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 3.1, 14),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  afterburnerOuter.rotation.x = -Math.PI * 0.5;
  afterburnerOuter.position.set(0, 0.82, -4.45);
  afterburnerOuter.visible = false;
  bodyGroup.add(afterburnerOuter);

  // 6. Four Massive Armoured Combat Wheels (wider rear Tumbler tires + steerable front hubs)
  const frontSteerPivots: THREE.Group[] = [];
  const wheelSpinGroups: THREE.Group[] = [];
  const wheelSpecs: Array<{ x: number; z: number; radius: number; width: number; isFront: boolean }> = [
    { x: -1.36, z: 1.78, radius: 0.54, width: 0.48, isFront: true },
    { x: 1.36, z: 1.78, radius: 0.54, width: 0.48, isFront: true },
    { x: -1.46, z: -1.68, radius: 0.68, width: 0.72, isFront: false },
    { x: 1.46, z: -1.68, radius: 0.68, width: 0.72, isFront: false },
  ];

  for (const ws of wheelSpecs) {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(ws.x, ws.radius, ws.z);

    const spinGroup = new THREE.Group();
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(ws.radius, ws.radius, ws.width, 18),
      tireMat
    );
    tire.rotation.z = Math.PI * 0.5;
    spinGroup.add(tire);

    // Deep angular tread lugs around tire circumference
    for (let t = 0; t < 10; t++) {
      const a = (t / 10) * Math.PI * 2;
      const lug = new THREE.Mesh(
        new THREE.BoxGeometry(ws.width * 0.92, 0.06, 0.14),
        satinCarbon
      );
      lug.position.set(0, Math.cos(a) * ws.radius, Math.sin(a) * ws.radius);
      lug.rotation.x = -a;
      spinGroup.add(lug);
    }

    // Metallic rim & spoke pattern
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(ws.radius * 0.56, ws.radius * 0.56, ws.width + 0.03, 12),
      rimMat
    );
    rim.rotation.z = Math.PI * 0.5;
    spinGroup.add(rim);

    // Visible crimson tactical brake caliper
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(ws.width * 0.4, 0.22, 0.18), brakeCaliperMat);
    caliper.position.set(ws.x > 0 ? 0.14 : -0.14, 0.12, 0.16);
    steerPivot.add(caliper);

    steerPivot.add(spinGroup);
    group.add(steerPivot);
    if (ws.isFront) frontSteerPivots.push(steerPivot);
    wheelSpinGroups.push(spinGroup);
  }

  // 7. Detective Vision tactical sonar ring under chassis
  const scanRing = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.1, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scanRing.rotation.x = -Math.PI * 0.5;
  scanRing.position.y = 0.09;
  scanRing.visible = false;
  group.add(scanRing);

  const update = (state: BatmobileState, elapsed: number, lanternStrength: number) => {
    group.position.set(state.x, state.y, state.z);
    group.rotation.y = state.heading;

    // Working suspension travel & engine rumble
    const rumble = Math.abs(state.speed) > 0.2 ? Math.sin(elapsed * 28) * 0.012 : Math.sin(elapsed * 6) * 0.004;
    bodyGroup.position.y = state.suspensionBounce + rumble;
    bodyGroup.rotation.x = -Math.max(-0.04, Math.min(0.05, state.speed * 0.0012));

    // Steering & rotating wheels
    for (const p of frontSteerPivots) {
      p.rotation.y = state.steerAngle;
    }
    for (const w of wheelSpinGroups) {
      w.rotation.x = state.wheelSpin;
    }

    // Sliding cockpit canopy animation
    canopyGroup.position.z = 0.05 - state.canopyProgress * 0.92;
    canopyGroup.position.y = 1.18 + state.canopyProgress * 0.34;
    canopyGroup.rotation.x = -state.canopyProgress * 0.24;

    // Headlight beam brightness
    const showBeams = state.headlightsOn && (lanternStrength > 0.18 || state.boostActive);
    for (const beam of headlightBeams) {
      beam.visible = showBeams;
    }

    // Roaring jet afterburner flame cone
    afterburnerCore.visible = state.boostActive;
    afterburnerOuter.visible = state.boostActive;
    if (state.boostActive) {
      const flicker = 0.85 + Math.sin(elapsed * 48) * 0.25;
      afterburnerCore.scale.set(1, flicker, 1);
      afterburnerOuter.scale.set(1.05, flicker * 1.15, 1.05);
    }

    // Detective scan pulse
    scanRing.visible = state.detectiveScanActive;
    if (state.detectiveScanActive) {
      const p = (elapsed * 0.85) % 1;
      scanRing.scale.setScalar(1 + p * 4.5);
    }
  };

  const dispose = () => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) m?.dispose();
      }
    });
  };

  return { group, update, dispose };
}
