import * as THREE from 'three';
import type { HoverGliderState } from '../game/hoverGlider';

export interface HoverGliderRig {
  group: THREE.Group;
  update: (
    state: HoverGliderState,
    dt: number,
    elapsed: number,
    occupied: boolean,
    hideRider: boolean
  ) => void;
  dispose: () => void;
}

function createBrushedTitaniumTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#d8dfe7');
  grad.addColorStop(0.5, '#bfc9d4');
  grad.addColorStop(1, '#cfd7e0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Fine directional brushed metal streaks
  for (let i = 0; i < 650; i++) {
    const y = (i * 19.3) % 256;
    const alpha = 0.04 + ((i * 37) % 10) * 0.008;
    ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(38,48,60,${alpha * 0.85})`;
    ctx.fillRect(0, y, 256, 1);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 4);
  map.colorSpace = THREE.SRGBColorSpace;

  const bump = new THREE.CanvasTexture(c);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(2, 4);

  return { map, bump };
}

function createCarbonFiberTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1b1f25';
  ctx.fillRect(0, 0, 128, 128);

  // Authentic 2x2 diagonal twill carbon weave
  const cell = 8;
  for (let y = 0; y < 128; y += cell) {
    for (let x = 0; x < 128; x += cell) {
      const diag = ((x / cell + y / cell) % 4 + 4) % 4;
      const g = ctx.createLinearGradient(x, y, x + cell, y + cell);
      if (diag === 0 || diag === 1) {
        g.addColorStop(0, '#363c46');
        g.addColorStop(0.5, '#252a32');
        g.addColorStop(1, '#161a20');
      } else {
        g.addColorStop(0, '#14171c');
        g.addColorStop(0.5, '#242931');
        g.addColorStop(1, '#313741');
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cell - 1, cell - 1);
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 14);
  map.colorSpace = THREE.SRGBColorSpace;

  const bump = new THREE.CanvasTexture(c);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(5, 14);

  return { map, bump };
}

function createHeatBluedTitaniumTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  // Thermal anodizing gradient from brushed silver -> warm bronze -> violet -> heat-blued tip
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, '#c8d0d9');
  g.addColorStop(0.32, '#a79578');
  g.addColorStop(0.55, '#866248');
  g.addColorStop(0.75, '#4c4678');
  g.addColorStop(0.92, '#2d558f');
  g.addColorStop(1.0, '#1e2736');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSoftShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(6, 12, 22, 0.56)');
  grad.addColorStop(0.55, 'rgba(6, 12, 22, 0.24)');
  grad.addColorStop(1, 'rgba(6, 12, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * Builds the sleek futuristic Brushed Titanium & Matte Carbon-Fiber Hoverboard Glider
 * with twin rear miniature jet turbines, swept aerodynamic tail fins, integrated magnetic
 * foot straps, front cyan LED edge strip, retractable skids, and a standing tactical flight-suit pilot.
 */
export function createHoverGliderRig(): HoverGliderRig {
  const root = new THREE.Group();
  root.name = 'hover_glider_root';

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // Procedural PBR Textures
  const tiTex = createBrushedTitaniumTexture();
  track(tiTex.map);
  track(tiTex.bump);

  const carbonTex = createCarbonFiberTexture();
  track(carbonTex.map);
  track(carbonTex.bump);

  const heatBlueTex = createHeatBluedTitaniumTexture();
  track(heatBlueTex);

  const shadowTex = createSoftShadowTexture();
  track(shadowTex);

  // Shared Studio-Grade PBR Materials
  const brushedTitaniumMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd9e1ea,
      map: tiTex.map,
      bumpMap: tiTex.bump,
      bumpScale: 0.004,
      metalness: 0.9,
      roughness: 0.24,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
    })
  );

  const darkTitaniumMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x5c6674,
      map: tiTex.map,
      metalness: 0.88,
      roughness: 0.32,
      clearcoat: 0.2,
    })
  );

  const matteCarbonMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x3b414c,
      map: carbonTex.map,
      bumpMap: carbonTex.bump,
      bumpScale: 0.008,
      metalness: 0.16,
      roughness: 0.62,
      clearcoat: 0.18,
      clearcoatRoughness: 0.45,
    })
  );

  const heatBlueNozzleMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: heatBlueTex,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.4,
    })
  );

  const seamDarkMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x11151b,
      metalness: 0.45,
      roughness: 0.72,
    })
  );

  const cyanLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xaefbff,
      emissive: 0x26ecff,
      emissiveIntensity: 2.8,
      roughness: 0.12,
      metalness: 0.1,
    })
  );

  const underGlowMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x35f0ff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  const plumeOuterMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x22e4ff,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  const plumeCoreMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xdffeff,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  // =========================================================================
  // 1. SLEEK TAPERED CARBON-FIBER & BRUSHED-TITANIUM HOVERBOARD DECK
  //    (+Z = front nose, -Z = rear tail)
  // =========================================================================
  const deckShape = new THREE.Shape();
  // Shape coordinates: x -> board width X, y -> board length Z (rotated -PI/2 around X later so +Y maps to -Z, so draw nose at -Y!)
  // Let's draw in XZ directly via rotation.x = Math.PI/2 => shape (x, y) -> world (x, -z_ext, y)!
  // With rotation.x = Math.PI / 2: shape +Y maps to world +Z (FRONT NOSE!), extrusion +depth maps to world -Y!
  deckShape.moveTo(-0.18, 1.12); // front nose left corner
  deckShape.lineTo(0.18, 1.12);  // front nose right corner
  deckShape.quadraticCurveTo(0.29, 0.96, 0.285, 0.68);
  deckShape.lineTo(0.27, -0.58);
  deckShape.quadraticCurveTo(0.26, -0.92, 0.19, -1.04); // rear right taper
  deckShape.lineTo(-0.19, -1.04); // rear left taper
  deckShape.quadraticCurveTo(-0.26, -0.92, -0.27, -0.58);
  deckShape.lineTo(-0.285, 0.68);
  deckShape.quadraticCurveTo(-0.29, 0.96, -0.18, 1.12);

  const deckGeo = track(
    new THREE.ExtrudeGeometry(deckShape, {
      depth: 0.056,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 14,
    })
  );
  deckGeo.rotateX(Math.PI / 2);
  const deckCoreMesh = new THREE.Mesh(deckGeo, matteCarbonMat);
  deckCoreMesh.position.y = 0.036;
  deckCoreMesh.castShadow = true;
  deckCoreMesh.receiveShadow = true;
  bodyPivot.add(deckCoreMesh);

  // Sleek tapered dark-carbon belly keel pan underneath
  const bellyGeo = track(new THREE.BoxGeometry(0.42, 0.036, 1.72));
  const bellyMesh = new THREE.Mesh(bellyGeo, seamDarkMat);
  bellyMesh.position.set(0, -0.042, 0.02);
  bodyPivot.add(bellyMesh);

  // Brushed-titanium sculpted outer side rails + center structural bridge (matching reference silhouette!)
  const bridgePlateGeo = track(new THREE.BoxGeometry(0.56, 0.022, 0.88));
  const bridgePlate = new THREE.Mesh(bridgePlateGeo, brushedTitaniumMat);
  bridgePlate.position.set(0, 0.048, -0.02);
  bridgePlate.castShadow = true;
  bridgePlate.receiveShadow = true;
  bodyPivot.add(bridgePlate);

  // Contoured brushed-titanium left & right perimeter rail fairings sweeping from tail to nose flanks
  const railShape = new THREE.Shape();
  railShape.moveTo(0.0, 0.92);
  railShape.lineTo(0.072, 0.82);
  railShape.lineTo(0.078, -0.92);
  railShape.lineTo(0.012, -1.0);
  railShape.lineTo(-0.022, -0.88);
  railShape.lineTo(-0.016, 0.72);
  railShape.closePath();

  const sideRailGeo = track(
    new THREE.ExtrudeGeometry(railShape, {
      depth: 0.044,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
  );
  sideRailGeo.rotateX(Math.PI / 2);

  for (const side of [-1, 1] as const) {
    const rail = new THREE.Mesh(sideRailGeo, brushedTitaniumMat);
    rail.scale.x = side;
    rail.position.set(side * 0.245, 0.056, 0.0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    bodyPivot.add(rail);

    // Precision dark panel seam grooves along brushed-titanium flanks
    for (const seamZ of [-0.46, 0.02, 0.54]) {
      const seam = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.014, 0.068, 0.008)),
        seamDarkMat
      );
      seam.position.set(side * 0.305, 0.026, seamZ);
      bodyPivot.add(seam);
    }
  }

  // Slight upturned aerodynamic front nose wedge cap (matte carbon with brushed-titanium bezel edges)
  const noseCapGeo = track(new THREE.BoxGeometry(0.46, 0.032, 0.36));
  const noseCap = new THREE.Mesh(noseCapGeo, matteCarbonMat);
  noseCap.position.set(0, 0.058, 0.94);
  noseCap.rotation.x = -0.075;
  noseCap.castShadow = true;
  bodyPivot.add(noseCap);

  // =========================================================================
  // 2. THIN GLOWING CYAN LED STRIP ALONG THE CURVED FRONT NOSE EDGE
  // =========================================================================
  const ledCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.275, 0.045, 0.89),
    new THREE.Vector3(-0.205, 0.054, 1.095),
    new THREE.Vector3(0.0, 0.058, 1.148),
    new THREE.Vector3(0.205, 0.054, 1.095),
    new THREE.Vector3(0.275, 0.045, 0.89),
  ]);
  const ledGeo = track(new THREE.TubeGeometry(ledCurve, 28, 0.0125, 8, false));
  const frontCyanLed = new THREE.Mesh(ledGeo, cyanLedMat);
  bodyPivot.add(frontCyanLed);

  // Subtle recessed dark bezel framing the cyan LED light bar
  const ledBezelGeo = track(new THREE.TubeGeometry(ledCurve, 28, 0.018, 8, false));
  const ledBezel = new THREE.Mesh(ledBezelGeo, seamDarkMat);
  ledBezel.position.z = -0.008;
  bodyPivot.add(ledBezel);

  // Subtle downward cyan repulsor glow emitter under center hull
  const underEmitter = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.48, 1.35)),
    underGlowMat
  );
  underEmitter.rotation.x = Math.PI / 2;
  underEmitter.position.set(0, -0.075, 0.04);
  bodyPivot.add(underEmitter);

  // =========================================================================
  // 3. TWIN SUBTLE SWEPT-BACK AERODYNAMIC REAR TAIL FINS
  // =========================================================================
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.38, 0);
  finShape.lineTo(0.14, 0.165);
  finShape.lineTo(-0.08, 0.175);
  finShape.closePath();

  const finGeo = track(
    new THREE.ExtrudeGeometry(finShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
    })
  );
  // Rotate so shape +X runs toward +Z (leading edge forward) and +Y rises upward
  finGeo.rotateY(-Math.PI / 2);

  for (const side of [-1, 1] as const) {
    const finGroup = new THREE.Group();
    finGroup.position.set(side * 0.225, 0.052, -0.96);
    finGroup.rotation.z = -side * 0.36; // subtle outward cant matching reference

    const finCore = new THREE.Mesh(finGeo, matteCarbonMat);
    finCore.castShadow = true;
    finGroup.add(finCore);

    // Brushed-titanium leading-edge aerodynamic trim along fin crest
    const finEdge = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.026, 0.02, 0.42)),
      brushedTitaniumMat
    );
    finEdge.position.set(-0.008, 0.102, 0.13);
    finEdge.rotation.x = 0.46;
    finGroup.add(finEdge);

    bodyPivot.add(finGroup);
  }

  // =========================================================================
  // 4. TWIN REAR MINIATURE JET TURBINES (Brushed Titanium + Heat-Blued Nozzles
  //    + Spinning 14-Blade Compressor Rotors + Dynamic Cyan Afterburner Plumes!)
  // =========================================================================
  const turbineRotors: THREE.Group[] = [];
  const afterburnerCones: THREE.Group[] = [];

  // Lathe profile for outer turbofan cowling (intake at +Y, aft nozzle at -Y -> rotated X = PI/2 so +Y -> +Z!)
  const nacellePts = [
    new THREE.Vector2(0.082, 0.25),  // inner intake lip
    new THREE.Vector2(0.105, 0.26),  // rounded titanium intake rim
    new THREE.Vector2(0.118, 0.18),  // outer intake flare
    new THREE.Vector2(0.116, -0.02), // mid barrel
    new THREE.Vector2(0.104, -0.18), // aft taper
    new THREE.Vector2(0.082, -0.24), // meets exhaust nozzle
  ];
  const nacelleGeo = track(new THREE.LatheGeometry(nacellePts, 28));
  nacelleGeo.rotateX(Math.PI / 2);

  const nozzlePts = [
    new THREE.Vector2(0.084, 0.02),
    new THREE.Vector2(0.072, -0.11),
    new THREE.Vector2(0.058, -0.22),
    new THREE.Vector2(0.05, -0.22),
    new THREE.Vector2(0.062, -0.09),
  ];
  const nozzleGeo = track(new THREE.LatheGeometry(nozzlePts, 28));
  nozzleGeo.rotateX(Math.PI / 2);

  const bladeGeo = track(new THREE.BoxGeometry(0.016, 0.082, 0.005));
  const spinnerGeo = track(new THREE.ConeGeometry(0.026, 0.078, 16));
  spinnerGeo.rotateX(Math.PI / 2);

  const outerPlumeGeo = track(new THREE.ConeGeometry(0.056, 0.72, 16, 1, true));
  outerPlumeGeo.rotateX(-Math.PI / 2);
  outerPlumeGeo.translate(0, 0, -0.36);

  const corePlumeGeo = track(new THREE.ConeGeometry(0.031, 0.46, 14, 1, true));
  corePlumeGeo.rotateX(-Math.PI / 2);
  corePlumeGeo.translate(0, 0, -0.23);

  for (const side of [-1, 1] as const) {
    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(side * 0.285, -0.048, -0.78);
    bodyPivot.add(turbineGroup);

    // Sculpted brushed-titanium mounting pylon strut linking nacelle to deck flank
    const pylon = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.11, 0.055, 0.28)),
      brushedTitaniumMat
    );
    pylon.position.set(-side * 0.075, 0.052, 0.02);
    pylon.rotation.z = side * 0.34;
    turbineGroup.add(pylon);

    // Brushed titanium outer nacelle shroud
    const nacelle = new THREE.Mesh(nacelleGeo, brushedTitaniumMat);
    nacelle.castShadow = true;
    turbineGroup.add(nacelle);

    // Dark matte-carbon mid-collar band around turbine barrel
    const collar = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.119, 0.117, 0.14, 24, 1, true)),
      matteCarbonMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.z = 0.06;
    turbineGroup.add(collar);

    // Dark inner intake duct cavity
    const intakeDuct = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.082, 0.076, 0.24, 20)),
      seamDarkMat
    );
    intakeDuct.rotation.x = Math.PI / 2;
    intakeDuct.position.z = 0.12;
    turbineGroup.add(intakeDuct);

    // Spinning 14-blade intake compressor rotor + polished central spinner cone
    const rotorGroup = new THREE.Group();
    rotorGroup.position.z = 0.2;
    for (let b = 0; b < 14; b++) {
      const ang = (b / 14) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, darkTitaniumMat);
      blade.position.set(Math.cos(ang) * 0.045, Math.sin(ang) * 0.045, 0);
      blade.rotation.z = ang + Math.PI / 2;
      blade.rotation.y = 0.35;
      rotorGroup.add(blade);
    }
    const spinner = new THREE.Mesh(spinnerGeo, brushedTitaniumMat);
    spinner.position.z = 0.026;
    rotorGroup.add(spinner);
    turbineGroup.add(rotorGroup);
    turbineRotors.push(rotorGroup);

    // Heat-blued titanium converging rear exhaust nozzle
    const nozzle = new THREE.Mesh(nozzleGeo, heatBlueNozzleMat);
    nozzle.position.z = -0.23;
    nozzle.castShadow = true;
    turbineGroup.add(nozzle);

    // Glowing cyan burner core ring deep inside exhaust nozzle
    const burnerRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.044, 0.008, 8, 18)),
      cyanLedMat
    );
    burnerRing.position.z = -0.4;
    turbineGroup.add(burnerRing);

    // Dynamic twin-jet cyan/white afterburner plume group
    const plumeGroup = new THREE.Group();
    plumeGroup.position.z = -0.44;
    plumeGroup.add(new THREE.Mesh(outerPlumeGeo, plumeOuterMat));
    plumeGroup.add(new THREE.Mesh(corePlumeGeo, plumeCoreMat));
    turbineGroup.add(plumeGroup);
    afterburnerCones.push(plumeGroup);
  }

  // =========================================================================
  // 5. INTEGRATED MAGNETIC FOOT STRAPS & OCTAGONAL CARBON FOOTPADS
  // =========================================================================
  const createMagneticBinding = (zPos: number, yawAngle: number): THREE.Group => {
    const binding = new THREE.Group();
    binding.position.set(0, 0.056, zPos);
    binding.rotation.y = yawAngle;

    // Octagonal brushed-titanium perimeter bezel
    const padShape = new THREE.Shape();
    padShape.moveTo(-0.15, -0.17);
    padShape.lineTo(0.15, -0.17);
    padShape.lineTo(0.21, -0.09);
    padShape.lineTo(0.21, 0.09);
    padShape.lineTo(0.15, 0.17);
    padShape.lineTo(-0.15, 0.17);
    padShape.lineTo(-0.21, 0.09);
    padShape.lineTo(-0.21, -0.09);
    padShape.closePath();

    const bezelGeo = track(
      new THREE.ExtrudeGeometry(padShape, {
        depth: 0.014,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.006,
        bevelSegments: 2,
      })
    );
    bezelGeo.rotateX(Math.PI / 2);
    const bezel = new THREE.Mesh(bezelGeo, brushedTitaniumMat);
    bezel.position.y = 0.014;
    binding.add(bezel);

    // Textured dark matte-carbon magnetic footpad center
    const gripPad = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.32, 0.012, 0.25)),
      matteCarbonMat
    );
    gripPad.position.y = 0.018;
    binding.add(gripPad);

    // Sculpted arched magnetic foot strap curving cleanly across the boot instep
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.155, 0.018, 0.0),
      new THREE.Vector3(-0.125, 0.098, 0.0),
      new THREE.Vector3(0.0, 0.128, 0.0),
      new THREE.Vector3(0.125, 0.098, 0.0),
      new THREE.Vector3(0.155, 0.018, 0.0),
    ]);
    const strapGeo = track(new THREE.TubeGeometry(strapCurve, 18, 0.022, 8, false));
    strapGeo.scale(1, 0.85, 1.9);
    const strap = new THREE.Mesh(strapGeo, darkTitaniumMat);
    strap.castShadow = true;
    binding.add(strap);

    // Titanium mounting clamps & subtle cyan magnetic lock micro-LEDs
    for (const s of [-1, 1] as const) {
      const clamp = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.044, 0.024, 0.11)),
        brushedTitaniumMat
      );
      clamp.position.set(s * 0.165, 0.022, 0);
      binding.add(clamp);

      const lockLed = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.012, 0.007, 0.045)),
        cyanLedMat
      );
      lockLed.position.set(s * 0.188, 0.026, 0);
      binding.add(lockLed);
    }

    return binding;
  };

  bodyPivot.add(createMagneticBinding(0.38, -0.24));
  bodyPivot.add(createMagneticBinding(-0.32, 0.18));

  // =========================================================================
  // 6. COMPACT RETRACTABLE BRUSHED-TITANIUM LANDING SKIDS UNDERNEATH
  // =========================================================================
  const skidGroup = new THREE.Group();
  bodyPivot.add(skidGroup);

  const skidBarGeo = track(new THREE.CylinderGeometry(0.013, 0.013, 0.42, 10));
  skidBarGeo.rotateX(Math.PI / 2);
  const skidStrutGeo = track(new THREE.CylinderGeometry(0.01, 0.01, 0.13, 8));

  for (const side of [-1, 1] as const) {
    const rail = new THREE.Mesh(skidBarGeo, brushedTitaniumMat);
    rail.position.set(side * 0.135, -0.145, 0.44);
    skidGroup.add(rail);

    for (const sz of [0.31, 0.56]) {
      const strut = new THREE.Mesh(skidStrutGeo, darkTitaniumMat);
      strut.position.set(side * 0.125, -0.09, sz);
      strut.rotation.z = side * 0.18;
      skidGroup.add(strut);
    }
  }

  // =========================================================================
  // 7. STANDING TACTICAL FLIGHT-SUIT PILOT (Auto-hidden in 1st-Person / Cockpit)
  // =========================================================================
  const riderGroup = new THREE.Group();
  riderGroup.name = 'hover_glider_rider';
  bodyPivot.add(riderGroup);

  const suitMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x161a22,
      roughness: 0.58,
      metalness: 0.25,
    })
  );
  const armorMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x2a313d,
      metalness: 0.72,
      roughness: 0.28,
      clearcoat: 0.35,
    })
  );
  const visorMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x091624,
      emissive: 0x0a3b52,
      emissiveIntensity: 0.55,
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1.0,
    })
  );

  // Athletic bent-knee surf/glider stance boots locked into front (+0.38) and rear (-0.32) magnetic straps
  const bootGeo = track(new THREE.BoxGeometry(0.11, 0.09, 0.24));
  const frontBoot = new THREE.Mesh(bootGeo, armorMat);
  frontBoot.position.set(0.01, 0.11, 0.38);
  frontBoot.rotation.y = -0.24;
  riderGroup.add(frontBoot);

  const rearBoot = new THREE.Mesh(bootGeo, armorMat);
  rearBoot.position.set(-0.01, 0.11, -0.32);
  rearBoot.rotation.y = 0.18;
  riderGroup.add(rearBoot);

  // Lower & upper legs angled dynamically toward hips
  const limbGeo = track(new THREE.CapsuleGeometry(0.056, 0.34, 6, 10));
  const frontShin = new THREE.Mesh(limbGeo, suitMat);
  frontShin.position.set(0.03, 0.34, 0.3);
  frontShin.rotation.x = -0.34;
  riderGroup.add(frontShin);

  const frontThigh = new THREE.Mesh(limbGeo, suitMat);
  frontThigh.position.set(0.04, 0.69, 0.16);
  frontThigh.rotation.x = 0.28;
  riderGroup.add(frontThigh);

  const rearShin = new THREE.Mesh(limbGeo, suitMat);
  rearShin.position.set(-0.03, 0.34, -0.26);
  rearShin.rotation.x = 0.22;
  riderGroup.add(rearShin);

  const rearThigh = new THREE.Mesh(limbGeo, suitMat);
  rearThigh.position.set(-0.04, 0.69, -0.14);
  rearThigh.rotation.x = -0.26;
  riderGroup.add(rearThigh);

  // Upper torso pivot (leans dynamically into turns & forward acceleration!)
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.86, 0.02);
  riderGroup.add(torsoPivot);

  const pelvis = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.14, 0.2)), armorMat);
  pelvis.position.y = 0.04;
  torsoPivot.add(pelvis);

  const chest = new THREE.Mesh(track(new THREE.BoxGeometry(0.32, 0.42, 0.21)), suitMat);
  chest.position.y = 0.3;
  chest.rotation.y = -0.32; // athletic surf shoulder angle facing forward nose
  chest.castShadow = true;
  torsoPivot.add(chest);

  const chestPlate = new THREE.Mesh(track(new THREE.BoxGeometry(0.29, 0.26, 0.23)), armorMat);
  chestPlate.position.y = 0.35;
  chestPlate.rotation.y = -0.32;
  torsoPivot.add(chestPlate);

  // Subtle cyan tactical chest telemetry bar
  const chestStrip = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.018, 0.015)), cyanLedMat);
  chestStrip.position.set(0.035, 0.38, 0.118);
  chestStrip.rotation.y = -0.32;
  torsoPivot.add(chestStrip);

  // Sculpted shoulder pads + naturally poised downward-outward surf-balance arms & gauntlets
  const shoulderGeo = track(new THREE.SphereGeometry(0.068, 12, 10));
  const upperArmGeo = track(new THREE.CapsuleGeometry(0.044, 0.22, 6, 8));
  const forearmGeo = track(new THREE.CapsuleGeometry(0.038, 0.2, 6, 8));

  // Left arm (trails slightly aft & down-outward for aerodynamic hoverboard balance)
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.2, 0.46, -0.05);
  torsoPivot.add(leftShoulder);
  leftShoulder.add(new THREE.Mesh(shoulderGeo, armorMat));

  const leftUpper = new THREE.Mesh(upperArmGeo, suitMat);
  leftUpper.position.set(-0.07, -0.13, -0.04);
  leftUpper.rotation.z = -0.42; // angles downward & outward (-X, -Y)
  leftUpper.rotation.x = 0.22;
  leftShoulder.add(leftUpper);

  const leftForearm = new THREE.Mesh(forearmGeo, armorMat);
  leftForearm.position.set(-0.17, -0.25, -0.05);
  leftForearm.rotation.z = -0.82;
  leftForearm.rotation.x = -0.15;
  leftShoulder.add(leftForearm);

  // Right arm (reaches slightly forward & down-outward along flight vector)
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.2, 0.46, 0.05);
  torsoPivot.add(rightShoulder);
  rightShoulder.add(new THREE.Mesh(shoulderGeo, armorMat));

  const rightUpper = new THREE.Mesh(upperArmGeo, suitMat);
  rightUpper.position.set(0.07, -0.13, 0.06);
  rightUpper.rotation.z = 0.42; // angles downward & outward (+X, -Y)
  rightUpper.rotation.x = -0.3;
  rightShoulder.add(rightUpper);

  const rightForearm = new THREE.Mesh(forearmGeo, armorMat);
  rightForearm.position.set(0.16, -0.23, 0.14);
  rightForearm.rotation.z = 0.78;
  rightForearm.rotation.x = -0.45;
  rightShoulder.add(rightForearm);

  // Sleek aerodynamic tactical visor helmet facing forward (+Z)
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 0.64, 0.04);
  torsoPivot.add(helmetGroup);

  const helmetShell = new THREE.Mesh(track(new THREE.SphereGeometry(0.135, 18, 16)), armorMat);
  helmetShell.scale.set(0.95, 1.04, 1.12);
  helmetShell.castShadow = true;
  helmetGroup.add(helmetShell);

  const visor = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.132, 18, 14, -Math.PI * 0.38, Math.PI * 0.76, Math.PI * 0.28, Math.PI * 0.38)),
    visorMat
  );
  visor.scale.set(0.98, 1.0, 1.16);
  visor.position.z = 0.01;
  helmetGroup.add(visor);

  // Subtle glowing cyan tactical trim arc across rear/side helmet shell
  const helmetTrim = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.125, 0.008, 8, 20, Math.PI * 1.15)),
    cyanLedMat
  );
  helmetTrim.rotation.x = Math.PI / 2;
  helmetTrim.rotation.z = Math.PI * 0.92;
  helmetTrim.position.y = -0.01;
  helmetGroup.add(helmetTrim);

  // =========================================================================
  // 8. GROUND-PROJECTED SOFT CONTACT SHADOW (fades smoothly with AGL altitude)
  // =========================================================================
  const contactShadowMat = track(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  const contactShadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 2.7)), contactShadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -0.28;
  root.add(contactShadow);

  return {
    group: root,
    update(state, _dt, elapsed, occupied, hideRider) {
      root.position.set(state.x, state.y, state.z);
      root.rotation.set(0, state.heading, 0);

      // Smooth magnetic hover bob + aerodynamic banking roll & nose climb/dive pitch
      const bobAmp = occupied ? 0.045 : 0.032;
      const bobY = Math.sin(state.hoverBobPhase) * bobAmp;
      bodyPivot.position.y = bobY;
      bodyPivot.rotation.order = 'YXZ';
      bodyPivot.rotation.x = state.pitch;
      bodyPivot.rotation.z = state.roll;

      // Spin twin miniature turbofan intake compressor blades
      for (let i = 0; i < turbineRotors.length; i++) {
        turbineRotors[i].rotation.z = state.rotorAngle * (i === 0 ? 1 : -1);
      }

      // Dynamic cyan-white jet afterburner exhaust plume scaling & flicker
      const glow = state.afterburnerGlow;
      const flicker = 0.92 + Math.sin(elapsed * 46.0) * 0.08;
      const plumeLen = (0.28 + glow * (state.boostActive ? 1.85 : 1.05)) * flicker;
      const plumeRad = 0.65 + glow * 0.55;
      for (let i = 0; i < afterburnerCones.length; i++) {
        const cone = afterburnerCones[i];
        cone.visible = glow > 0.14;
        cone.scale.set(plumeRad, plumeRad, plumeLen);
      }
      plumeOuterMat.opacity = Math.min(0.85, 0.18 + glow * 0.58);
      plumeCoreMat.opacity = Math.min(0.95, 0.25 + glow * 0.68);
      cyanLedMat.emissiveIntensity = 2.2 + glow * (state.boostActive ? 2.6 : 1.4);
      underGlowMat.opacity = 0.16 + glow * 0.28;

      // Smoothly retract brushed-titanium landing skids flush into hull when flying
      skidGroup.position.y = (1 - state.skidProgress) * 0.125;
      skidGroup.scale.y = 0.25 + state.skidProgress * 0.75;
      skidGroup.visible = state.skidProgress > 0.06;

      // Tactical flight-suit pilot visibility & athletic lean into turns/acceleration
      riderGroup.visible = occupied && !hideRider;
      if (riderGroup.visible) {
        torsoPivot.rotation.z = state.roll * 0.55;
        torsoPivot.rotation.x = Math.max(-0.22, Math.min(0.32, state.speed * 0.008 - state.vy * 0.012));
        helmetGroup.rotation.y = -state.roll * 0.45;
      }

      // Ground-projected soft contact shadow fades out gracefully as glider climbs high
      const shadowFade = Math.max(0, 1 - state.aglM / 12.0);
      contactShadow.visible = shadowFade > 0.02;
      if (contactShadow.visible) {
        contactShadow.position.y = -Math.min(state.aglM, 12.0) + 0.04;
        const spread = 1 + state.aglM * 0.12;
        contactShadow.scale.set(spread, spread, 1);
        contactShadowMat.opacity = 0.55 * shadowFade;
      }
    },
    dispose() {
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}
