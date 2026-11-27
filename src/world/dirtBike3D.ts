import * as THREE from 'three';
import type { DirtBike49ccState } from '../game/dirtBike';

export interface DirtBike49ccRig {
  root: THREE.Group;
  bikeLeanGroup: THREE.Group;
  chassisGroup: THREE.Group;
  steeringPivotGroup: THREE.Group;
  frontSuspensionLowerGroup: THREE.Group;
  frontWheelSpinGroup: THREE.Group;
  rearWheelSpinGroup: THREE.Group;
  frontBrakeLeverPivot: THREE.Group;
  rearBrakeLeverPivot: THREE.Group;
  throttleGripGroup: THREE.Group;
  kickstandPivotGroup: THREE.Group;
  engineBlockGroup: THREE.Group;
  rearSwingarmPivot: THREE.Group;
  riderGroup: THREE.Group;
  exhaustTipLocal: THREE.Vector3;
  update: (state: DirtBike49ccState, dt: number, elapsed: number, occupied: boolean, hideRider: boolean) => void;
  dispose: () => void;
}

// ============================================================================
// 1. PROCEDURAL TEXTURES (MATCHING THE ORION 49CC DIRT BIKE GRAPHICS)
// ============================================================================
function createOrionDecalTexture(type: 'fairing' | 'plate'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base vibrant KTM/Orion orange
  ctx.fillStyle = '#ff5a00';
  ctx.fillRect(0, 0, 512, 512);

  // White aggressive motocross vector shards
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(20, 40);
  ctx.lineTo(480, 110);
  ctx.lineTo(390, 290);
  ctx.lineTo(60, 240);
  ctx.closePath();
  ctx.fill();

  // Black sharp slashes
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(240, 0);
  ctx.lineTo(130, 490);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(270, 50);
  ctx.lineTo(512, 180);
  ctx.lineTo(512, 460);
  ctx.lineTo(210, 360);
  ctx.closePath();
  ctx.fill();

  // Orange dynamic inner spears
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(70, 120);
  ctx.lineTo(450, 210);
  ctx.lineTo(340, 370);
  ctx.lineTo(110, 270);
  ctx.closePath();
  ctx.fill();

  // White & black racing stripes
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(30, 390);
  ctx.lineTo(490, 140);
  ctx.stroke();

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(30, 410);
  ctx.lineTo(490, 160);
  ctx.stroke();

  // Stylized "ORION 49 / MINIXIN RACING" typography
  ctx.save();
  ctx.translate(256, 245);
  ctx.rotate(-0.18);
  ctx.font = 'italic 900 72px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#090909';
  ctx.strokeText(type === 'plate' ? 'ORION' : 'ORION 49', 0, 0);
  ctx.fillStyle = '#ff6a00';
  ctx.fillText(type === 'plate' ? 'ORION' : 'ORION 49', 0, 0);

  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('MINIXIN RACING', 0, 38);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createBarPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Crimson red pad background matching reference handlebar pad
  ctx.fillStyle = '#cc1122';
  ctx.fillRect(0, 0, 512, 128);

  // Black racing grid stripes
  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 106, 512, 22);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  for (let x = 20; x < 500; x += 45) {
    ctx.strokeRect(x, 34, 34, 60);
  }

  ctx.font = 'italic 900 44px Impact, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('PRO-DIRT 49CC', 256, 80);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.68)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.30)');
  grad.addColorStop(1, 'rgba(0,0,0,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ============================================================================
// 2. COMPLETE 49CC PETROL DIRT BIKE 3D MODEL BUILDER
//    Faithfully ports every mechanical component from the Orion 49cc simulator,
//    aligned so local +Z is DREAMLINE forward and scaled cleanly (1.42x) for world riders.
// ============================================================================
export function createDirtBike49ccRig(castShadows: boolean): DirtBike49ccRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const decalTex = track(createOrionDecalTexture('fairing'));
  const plateTex = track(createOrionDecalTexture('plate'));
  const barPadTex = track(createBarPadTexture());
  const shadowTex = track(createContactShadowTexture());

  // High-Detail Shared PBR Materials matching the attached 49cc Petrol Dirt Bike simulator
  const mats = {
    anodizedOrange: track(
      new THREE.MeshStandardMaterial({ color: 0xff5900, metalness: 0.78, roughness: 0.22 })
    ),
    glossOrange: track(
      new THREE.MeshStandardMaterial({ color: 0xff5500, metalness: 0.15, roughness: 0.18 })
    ),
    graphicFairing: track(
      new THREE.MeshStandardMaterial({ map: decalTex, metalness: 0.12, roughness: 0.22 })
    ),
    numberPlate: track(
      new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.1, roughness: 0.25 })
    ),
    barPad: track(new THREE.MeshStandardMaterial({ map: barPadTex, roughness: 0.4 })),
    tireRubber: track(
      new THREE.MeshStandardMaterial({ color: 0x161618, metalness: 0.05, roughness: 0.85 })
    ),
    blackFrame: track(
      new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.45, roughness: 0.35 })
    ),
    seatVinyl: track(
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.08, roughness: 0.65 })
    ),
    castAluminum: track(
      new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: 0.82, roughness: 0.32 })
    ),
    chrome: track(
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.94, roughness: 0.12 })
    ),
    crimsonRed: track(
      new THREE.MeshStandardMaterial({ color: 0xd91424, metalness: 0.35, roughness: 0.25 })
    ),
    riderJacket: track(new THREE.MeshStandardMaterial({ color: 0x1d2432, roughness: 0.72 })),
    riderPants: track(new THREE.MeshStandardMaterial({ color: 0x17181d, roughness: 0.78 })),
    riderVisor: track(
      new THREE.MeshStandardMaterial({ color: 0xff6a00, metalness: 0.65, roughness: 0.16 })
    ),
    smokeMat: track(
      new THREE.MeshBasicMaterial({
        color: 0xdce7f5,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      })
    ),
  };

  // Root transforms: DREAMLINE uses +Z forward, +Y up, +X left
  const root = new THREE.Group();
  const modelAlignGroup = new THREE.Group();
  // Rotate bike model (+PI/2 around Y) so original -X front points straight along +Z forward!
  modelAlignGroup.rotation.y = Math.PI / 2;
  // Scale 1.42x so the Orion 49cc dirt bike fits DREAMLINE's 1.7m characters with heroic motocross presence
  modelAlignGroup.scale.setScalar(1.42);
  root.add(modelAlignGroup);

  // Soft ground contact shadow
  const shadowGeo = track(new THREE.PlaneGeometry(1.48, 0.78));
  const shadowMat = track(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0.02, 0.015, 0);
  modelAlignGroup.add(contactShadow);

  const bikeLeanGroup = new THREE.Group();
  const chassisGroup = new THREE.Group();
  modelAlignGroup.add(bikeLeanGroup);
  bikeLeanGroup.add(chassisGroup);

  // Helper to build the exact knobby off-road dirt bike wheel using InstancedMesh for lugs (blazing fast even on software WebGL!)
  const dummyObj = new THREE.Object3D();
  const buildDirtBikeWheel = (radius: number, tireTubeRadius: number, isFront: boolean): THREE.Group => {
    const wheelGroup = new THREE.Group();

    // 1. Tire Carcass Torus
    const tireMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(radius, tireTubeRadius, 14, 36)),
      mats.tireRubber
    );
    tireMesh.castShadow = castShadows;
    tireMesh.receiveShadow = true;
    wheelGroup.add(tireMesh);

    // 2. Aggressive Knobby Off-Road Tread Blocks (28 center + 56 staggered shoulder lugs via InstancedMesh)
    const numKnobs = 24;
    const centerKnobGeo = track(new THREE.BoxGeometry(0.026, 0.018, tireTubeRadius * 0.95));
    const sideKnobGeo = track(new THREE.BoxGeometry(0.022, 0.018, tireTubeRadius * 0.55));
    const centerKnobs = new THREE.InstancedMesh(centerKnobGeo, mats.tireRubber, numKnobs);
    const sideKnobs = new THREE.InstancedMesh(sideKnobGeo, mats.tireRubber, numKnobs * 2);

    for (let i = 0; i < numKnobs; i++) {
      const angle = (i / numKnobs) * Math.PI * 2;
      const rOuter = radius + tireTubeRadius - 0.003;
      dummyObj.position.set(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter, 0);
      dummyObj.rotation.set(0, 0, angle + Math.PI / 2);
      dummyObj.scale.set(1, 1, 1);
      dummyObj.updateMatrix();
      centerKnobs.setMatrixAt(i, dummyObj.matrix);

      const sideAngle = angle + Math.PI / numKnobs;
      const rSide = radius + tireTubeRadius * 0.82;

      dummyObj.position.set(Math.cos(sideAngle) * rSide, Math.sin(sideAngle) * rSide, tireTubeRadius * 0.65);
      dummyObj.rotation.set(0.48, 0, sideAngle + Math.PI / 2);
      dummyObj.updateMatrix();
      sideKnobs.setMatrixAt(i * 2, dummyObj.matrix);

      dummyObj.position.set(Math.cos(sideAngle) * rSide, Math.sin(sideAngle) * rSide, -tireTubeRadius * 0.65);
      dummyObj.rotation.set(-0.48, 0, sideAngle + Math.PI / 2);
      dummyObj.updateMatrix();
      sideKnobs.setMatrixAt(i * 2 + 1, dummyObj.matrix);
    }
    centerKnobs.instanceMatrix.needsUpdate = true;
    sideKnobs.instanceMatrix.needsUpdate = true;
    wheelGroup.add(centerKnobs, sideKnobs);

    // 3. Orange Anodized Alloy Rim Barrel & Polished Chrome Outer Lips
    const rimRadius = radius - tireTubeRadius + 0.012;
    const rimOuterRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(rimRadius, 0.013, 12, 32)),
      mats.anodizedOrange
    );
    wheelGroup.add(rimOuterRing);

    const lipGeo = track(new THREE.TorusGeometry(rimRadius + 0.006, 0.004, 8, 32));
    const silverLipF = new THREE.Mesh(lipGeo, mats.chrome);
    silverLipF.position.z = 0.022;
    const silverLipB = new THREE.Mesh(lipGeo, mats.chrome);
    silverLipB.position.z = -0.022;
    wheelGroup.add(silverLipF, silverLipB);

    // 4. Orange Center Hub
    const hubMesh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.036, 0.036, 0.085, 16)),
      mats.anodizedOrange
    );
    hubMesh.rotation.x = Math.PI / 2;
    wheelGroup.add(hubMesh);

    // 5. 5-Twin-Spoke (10 Angled Spokes in V-pairs) matching the Orion orange alloy wheels
    const spokeLength = rimRadius - 0.032;
    const spokeGeo = track(new THREE.CylinderGeometry(0.0055, 0.0075, spokeLength, 8));
    const spokeInst = new THREE.InstancedMesh(spokeGeo, mats.anodizedOrange, 10);
    let spIdx = 0;
    for (let i = 0; i < 5; i++) {
      const baseAngle = (i / 5) * Math.PI * 2;
      for (const offset of [-0.17, 0.17]) {
        const midR = 0.032 + spokeLength * 0.5;
        const a = baseAngle + offset;
        dummyObj.position.set(Math.cos(a) * midR, Math.sin(a) * midR, 0);
        dummyObj.rotation.set(0, 0, a - Math.PI / 2 + offset * 0.45);
        dummyObj.scale.set(1, 1, 1);
        dummyObj.updateMatrix();
        spokeInst.setMatrixAt(spIdx++, dummyObj.matrix);
      }
    }
    spokeInst.instanceMatrix.needsUpdate = true;
    wheelGroup.add(spokeInst);

    // 6. Perforated Wave-Style Silver Disc Brake Rotor (Left side = +Z)
    const rotorRadius = radius * 0.58;
    const rotorMesh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(rotorRadius, rotorRadius, 0.005, 22)),
      mats.chrome
    );
    rotorMesh.rotation.x = Math.PI / 2;
    rotorMesh.position.z = 0.044;
    wheelGroup.add(rotorMesh);

    const carrierMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(rotorRadius * 0.65, 0.006, 8, 20)),
      mats.blackFrame
    );
    carrierMesh.position.z = 0.046;
    wheelGroup.add(carrierMesh);

    // Rear Sprocket & Chain Ring
    if (!isFront) {
      const sprocket = new THREE.Mesh(
        track(new THREE.CylinderGeometry(rotorRadius * 0.85, rotorRadius * 0.85, 0.006, 24)),
        mats.castAluminum
      );
      sprocket.rotation.x = Math.PI / 2;
      sprocket.position.z = 0.052;
      wheelGroup.add(sprocket);
    }

    return wheelGroup;
  };

  // ========================================================================
  // A. FRONT STEERING & INVERTED (USD) ORANGE FORK ASSEMBLY
  // ========================================================================
  const steeringHeadMount = new THREE.Group();
  steeringHeadMount.position.set(-0.28, 0.69, 0);
  steeringHeadMount.rotation.z = -0.46; // 26.5° motocross steering rake
  chassisGroup.add(steeringHeadMount);

  const steeringPivotGroup = new THREE.Group();
  steeringHeadMount.add(steeringPivotGroup);

  // 1. Top & Bottom Black Triple Clamps
  const clampGeo = track(new THREE.BoxGeometry(0.065, 0.022, 0.21));
  const topClamp = new THREE.Mesh(clampGeo, mats.blackFrame);
  topClamp.position.set(-0.025, 0.04, 0);
  const bottomClamp = new THREE.Mesh(clampGeo, mats.blackFrame);
  bottomClamp.position.set(-0.025, -0.10, 0);
  steeringPivotGroup.add(topClamp, bottomClamp);

  // 2. Anodized Metallic Orange Upper USD Fork Tubes + Chrome Cap Bolts
  const forkZSpacing = 0.082;
  const upperForkGeo = track(new THREE.CylinderGeometry(0.021, 0.021, 0.29, 16));
  const forkCapGeo = track(new THREE.CylinderGeometry(0.017, 0.017, 0.01, 14));
  for (const zPos of [-forkZSpacing, forkZSpacing]) {
    const upperFork = new THREE.Mesh(upperForkGeo, mats.anodizedOrange);
    upperFork.position.set(-0.03, -0.10, zPos);
    upperFork.castShadow = castShadows;
    const cap = new THREE.Mesh(forkCapGeo, mats.chrome);
    cap.position.set(-0.03, 0.048, zPos);
    steeringPivotGroup.add(upperFork, cap);
  }

  // 3. Lower Fork Sliders + Front Knobby Wheel (compresses under braking & off-road bumps!)
  const frontSuspensionLowerGroup = new THREE.Group();
  steeringPivotGroup.add(frontSuspensionLowerGroup);

  const stanchionGeo = track(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 14));
  const lowerGuardGeo = track(new THREE.CylinderGeometry(0.023, 0.019, 0.23, 14));
  for (const zPos of [-forkZSpacing, forkZSpacing]) {
    const stanchion = new THREE.Mesh(stanchionGeo, mats.chrome);
    stanchion.position.set(-0.03, -0.28, zPos);
    const lowerLeg = new THREE.Mesh(lowerGuardGeo, mats.blackFrame);
    lowerLeg.position.set(-0.03, -0.35, zPos);
    lowerLeg.castShadow = castShadows;
    frontSuspensionLowerGroup.add(stanchion, lowerLeg);
  }

  // Front Axle + Aluminum Caliper Bracket + Crimson Red Disc Caliper
  const frontAxle = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.011, 0.011, 0.21, 12)),
    mats.chrome
  );
  frontAxle.rotation.x = Math.PI / 2;
  frontAxle.position.set(-0.03, -0.45, 0);
  frontSuspensionLowerGroup.add(frontAxle);

  const caliperBracket = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.06, 0.05, 0.02)),
    mats.castAluminum
  );
  caliperBracket.position.set(0.005, -0.43, 0.062);
  const frontCaliper = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.055, 0.068, 0.035)),
    mats.crimsonRed
  );
  frontCaliper.position.set(0.028, -0.40, 0.052);
  frontSuspensionLowerGroup.add(caliperBracket, frontCaliper);

  const frontWheelSpinGroup = buildDirtBikeWheel(0.185, 0.048, true);
  frontWheelSpinGroup.position.set(-0.03, -0.45, 0);
  frontSuspensionLowerGroup.add(frontWheelSpinGroup);

  // 4. Curved High Front Mudguard / Fender (Orange with Graphic Top)
  const fenderGroup = new THREE.Group();
  fenderGroup.position.set(-0.05, -0.11, 0);
  steeringPivotGroup.add(fenderGroup);

  const fenderCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, -0.02, 0),
    new THREE.Vector3(-0.08, 0.02, 0),
    new THREE.Vector3(-0.22, 0.01, 0),
    new THREE.Vector3(-0.34, -0.05, 0),
  ]);
  const fenderTubeGeo = track(new THREE.TubeGeometry(fenderCurve, 16, 0.045, 10, false));
  fenderTubeGeo.scale(1, 0.28, 1.35);
  const frontFenderMesh = new THREE.Mesh(fenderTubeGeo, mats.graphicFairing);
  frontFenderMesh.castShadow = castShadows;
  fenderGroup.add(frontFenderMesh);

  // 5. Front Racing Number Plate ("ORION")
  const plateGeo = track(
    new THREE.CylinderGeometry(0.11, 0.13, 0.19, 14, 1, false, -Math.PI * 0.75, Math.PI * 0.5)
  );
  const numberPlateMesh = new THREE.Mesh(plateGeo, mats.numberPlate);
  numberPlateMesh.position.set(-0.01, 0.01, 0);
  numberPlateMesh.rotation.z = 0.08;
  numberPlateMesh.castShadow = castShadows;
  steeringPivotGroup.add(numberPlateMesh);

  // 6. Motocross Handlebars, Red Crossbar Pad ("PRO-DIRT 49CC"), Levers, Red Tether Cord & Brake Cable
  const handlebarGroup = new THREE.Group();
  handlebarGroup.position.set(-0.02, 0.06, 0);
  steeringPivotGroup.add(handlebarGroup);

  const riserGeo = track(new THREE.BoxGeometry(0.025, 0.035, 0.022));
  for (const zOff of [-0.045, 0.045]) {
    const riser = new THREE.Mesh(riserGeo, mats.blackFrame);
    riser.position.set(0, 0.015, zOff);
    handlebarGroup.add(riser);
  }

  const barCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 0.11, -0.30),
    new THREE.Vector3(0.02, 0.10, -0.17),
    new THREE.Vector3(0.0, 0.03, -0.07),
    new THREE.Vector3(0.0, 0.03, 0.07),
    new THREE.Vector3(0.02, 0.10, 0.17),
    new THREE.Vector3(0.05, 0.11, 0.30),
  ]);
  const handlebarMesh = new THREE.Mesh(
    track(new THREE.TubeGeometry(barCurve, 24, 0.011, 10, false)),
    mats.blackFrame
  );
  handlebarMesh.castShadow = castShadows;
  handlebarGroup.add(handlebarMesh);

  const barPadMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.024, 0.024, 0.17, 14)),
    mats.barPad
  );
  barPadMesh.rotation.x = Math.PI / 2;
  barPadMesh.position.set(0.01, 0.095, 0);
  barPadMesh.castShadow = castShadows;
  handlebarGroup.add(barPadMesh);

  let throttleGripGroup = new THREE.Group();
  const gripCylGeo = track(new THREE.CylinderGeometry(0.016, 0.016, 0.11, 12));
  const flangeGeo = track(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 12));
  [-0.25, 0.25].forEach((zGrip, idx) => {
    const gripContainer = new THREE.Group();
    gripContainer.position.set(0.038, 0.106, zGrip);
    gripContainer.rotation.y = zGrip > 0 ? -0.18 : 0.18;

    const gripCyl = new THREE.Mesh(gripCylGeo, mats.tireRubber);
    gripCyl.rotation.x = Math.PI / 2;
    const flange = new THREE.Mesh(flangeGeo, mats.tireRubber);
    flange.rotation.x = Math.PI / 2;
    flange.position.z = zGrip > 0 ? -0.052 : 0.052;
    gripContainer.add(gripCyl, flange);

    if (idx === 0) throttleGripGroup = gripContainer;
    handlebarGroup.add(gripContainer);
  });

  let frontBrakeLeverPivot = new THREE.Group();
  let rearBrakeLeverPivot = new THREE.Group();
  const perchGeo = track(new THREE.BoxGeometry(0.025, 0.025, 0.022));
  const bladeGeo = track(new THREE.BoxGeometry(0.014, 0.008, 0.095));
  [-0.19, 0.19].forEach((zLever, idx) => {
    const leverPivot = new THREE.Group();
    leverPivot.position.set(0.015, 0.102, zLever);
    const perch = new THREE.Mesh(perchGeo, mats.blackFrame);
    const blade = new THREE.Mesh(bladeGeo, mats.chrome);
    blade.position.set(-0.028, 0, zLever > 0 ? 0.045 : -0.045);
    blade.rotation.y = zLever > 0 ? 0.35 : -0.35;
    leverPivot.add(perch, blade);
    if (idx === 0) frontBrakeLeverPivot = leverPivot;
    else rearBrakeLeverPivot = leverPivot;
    handlebarGroup.add(leverPivot);
  });

  // Crimson Red Kill-Switch & Hanging Emergency Pull Tether Cord
  const tetherCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.11, 0.16),
    new THREE.Vector3(-0.04, 0.06, 0.21),
    new THREE.Vector3(-0.02, -0.04, 0.19),
    new THREE.Vector3(0.03, -0.10, 0.15),
  ]);
  const tetherCordMesh = new THREE.Mesh(
    track(new THREE.TubeGeometry(tetherCurve, 14, 0.0055, 6, false)),
    mats.crimsonRed
  );
  const killSwitchBox = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.024, 0.026, 0.024)),
    mats.crimsonRed
  );
  killSwitchBox.position.set(0.02, 0.108, 0.16);
  handlebarGroup.add(tetherCordMesh, killSwitchBox);

  // Arching Black Front Brake Cable down to Front Caliper
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.16, 0.17),
    new THREE.Vector3(-0.11, 0.22, 0.11),
    new THREE.Vector3(-0.09, 0.02, 0.08),
    new THREE.Vector3(-0.04, -0.22, 0.075),
    new THREE.Vector3(0.02, -0.40, 0.06),
  ]);
  const brakeCableMesh = new THREE.Mesh(
    track(new THREE.TubeGeometry(cableCurve, 18, 0.0038, 6, false)),
    mats.blackFrame
  );
  steeringPivotGroup.add(brakeCableMesh);

  // ========================================================================
  // B. MAIN PERIMETER FRAME, 49CC 2-STROKE ENGINE, EXHAUST & BODYWORK
  // ========================================================================
  for (const zSide of [-0.055, 0.055]) {
    const sparCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.27, 0.66, zSide * 0.6),
      new THREE.Vector3(-0.05, 0.56, zSide),
      new THREE.Vector3(0.14, 0.37, zSide),
    ]);
    const sparMesh = new THREE.Mesh(
      track(new THREE.TubeGeometry(sparCurve, 14, 0.018, 8, false)),
      mats.blackFrame
    );
    sparMesh.castShadow = castShadows;
    chassisGroup.add(sparMesh);
  }

  // 49cc 2-Stroke Single-Cylinder Air-Cooled Engine & Left Pull-Starter with Orange Crescent
  const engineBlockGroup = new THREE.Group();
  engineBlockGroup.position.set(-0.08, 0.39, 0);
  chassisGroup.add(engineBlockGroup);

  const crankcase = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.18, 0.14, 0.14)),
    mats.blackFrame
  );
  engineBlockGroup.add(crankcase);

  const cylinderGroup = new THREE.Group();
  cylinderGroup.position.set(-0.08, 0.06, 0);
  cylinderGroup.rotation.z = 0.65;
  engineBlockGroup.add(cylinderGroup);

  const coreCyl = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.11, 0.13, 0.11)),
    mats.castAluminum
  );
  cylinderGroup.add(coreCyl);

  const finGeo = track(new THREE.BoxGeometry(0.135, 0.005, 0.135));
  for (let f = -0.055; f <= 0.055; f += 0.018) {
    const fin = new THREE.Mesh(finGeo, mats.castAluminum);
    fin.position.y = f;
    cylinderGroup.add(fin);
  }

  const sparkPlug = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8)),
    mats.crimsonRed
  );
  sparkPlug.position.set(0, 0.08, 0);
  cylinderGroup.add(sparkPlug);

  const pullStarterCover = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.078, 0.078, 0.045, 18)),
    mats.blackFrame
  );
  pullStarterCover.rotation.x = Math.PI / 2;
  pullStarterCover.position.set(0.02, -0.01, 0.075);
  engineBlockGroup.add(pullStarterCover);

  const orangeCrescent = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.072, 0.016, 10, 18, Math.PI * 1.15)),
    mats.glossOrange
  );
  orangeCrescent.position.set(0.015, -0.005, 0.088);
  orangeCrescent.rotation.z = 0.55;
  engineBlockGroup.add(orangeCrescent);

  // Under-Belly Black 2-Stroke Expansion Exhaust Pipe & Cast Aluminum Muffler Canister
  const exhaustCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.20, 0.39, 0.02),
    new THREE.Vector3(-0.21, 0.25, 0.03),
    new THREE.Vector3(-0.08, 0.22, 0.03),
    new THREE.Vector3(0.05, 0.32, 0.04),
    new THREE.Vector3(0.24, 0.54, 0.04),
    new THREE.Vector3(0.45, 0.62, 0.04),
  ]);
  const exhaustPipe = new THREE.Mesh(
    track(new THREE.TubeGeometry(exhaustCurve, 24, 0.019, 10, false)),
    mats.blackFrame
  );
  exhaustPipe.castShadow = castShadows;
  chassisGroup.add(exhaustPipe);

  const mufflerCan = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.032, 0.032, 0.20, 14)),
    mats.castAluminum
  );
  mufflerCan.rotation.z = Math.PI / 2 - 0.18;
  mufflerCan.position.set(0.48, 0.63, 0.04);
  chassisGroup.add(mufflerCan);

  // Aggressive Angular Radiator Shrouds & Tail Fairings ("ORION 49" Graphics)
  const extrudeSettings = {
    depth: 0.022,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  };
  const shroudShape = new THREE.Shape();
  shroudShape.moveTo(-0.28, 0.62);
  shroudShape.lineTo(-0.02, 0.72);
  shroudShape.lineTo(0.14, 0.58);
  shroudShape.lineTo(-0.14, 0.45);
  shroudShape.closePath();
  const shroudGeo = track(new THREE.ExtrudeGeometry(shroudShape, extrudeSettings));
  const sPos = shroudGeo.attributes.position;
  const sUvs = shroudGeo.attributes.uv;
  for (let i = 0; i < sPos.count; i++) {
    sUvs.setXY(i, (sPos.getX(i) + 0.3) * 2.1, (sPos.getY(i) - 0.44) * 3.2);
  }

  const tailShape = new THREE.Shape();
  tailShape.moveTo(0.12, 0.57);
  tailShape.lineTo(0.36, 0.64);
  tailShape.lineTo(0.62, 0.69);
  tailShape.lineTo(0.30, 0.48);
  tailShape.closePath();
  const tailGeo = track(new THREE.ExtrudeGeometry(tailShape, extrudeSettings));
  const tPos = tailGeo.attributes.position;
  const tUvs = tailGeo.attributes.uv;
  for (let i = 0; i < tPos.count; i++) {
    tUvs.setXY(i, (tPos.getX(i) - 0.1) * 1.8, (tPos.getY(i) - 0.45) * 3.5);
  }

  for (const sideSign of [-1, 1]) {
    const shroudMesh = new THREE.Mesh(shroudGeo, mats.graphicFairing);
    shroudMesh.position.z = sideSign * 0.072;
    shroudMesh.rotation.x = sideSign * -0.14;
    shroudMesh.rotation.y = sideSign * 0.12;
    shroudMesh.castShadow = castShadows;
    chassisGroup.add(shroudMesh);

    const tailSideMesh = new THREE.Mesh(tailGeo, mats.graphicFairing);
    tailSideMesh.position.z = sideSign * 0.062;
    tailSideMesh.rotation.x = sideSign * -0.1;
    tailSideMesh.castShadow = castShadows;
    chassisGroup.add(tailSideMesh);
  }

  // Fuel Tank & Gas Cap
  const fuelTank = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.24, 0.14, 0.14)),
    mats.blackFrame
  );
  fuelTank.position.set(-0.11, 0.65, 0);
  const gasCap = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.026, 0.028, 0.025, 12)),
    mats.blackFrame
  );
  gasCap.position.set(-0.12, 0.73, 0);
  chassisGroup.add(fuelTank, gasCap);

  // Contoured Black Motocross Seat & High Orange Rear Tail Fender
  const seatCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.05, 0.70, 0),
    new THREE.Vector3(0.13, 0.62, 0),
    new THREE.Vector3(0.32, 0.65, 0),
    new THREE.Vector3(0.46, 0.68, 0),
  ]);
  const seatGeo = track(new THREE.TubeGeometry(seatCurve, 18, 0.062, 12, false));
  seatGeo.scale(1, 0.55, 1.15);
  const seatMesh = new THREE.Mesh(seatGeo, mats.seatVinyl);
  seatMesh.castShadow = castShadows;
  chassisGroup.add(seatMesh);

  const rearFenderCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.38, 0.65, 0),
    new THREE.Vector3(0.54, 0.68, 0),
    new THREE.Vector3(0.68, 0.69, 0),
  ]);
  const rearFenderGeo = track(new THREE.TubeGeometry(rearFenderCurve, 12, 0.052, 10, false));
  rearFenderGeo.scale(1, 0.25, 1.25);
  const rearFenderMesh = new THREE.Mesh(rearFenderGeo, mats.glossOrange);
  rearFenderMesh.castShadow = castShadows;
  chassisGroup.add(rearFenderMesh);

  // Rear Mono-Shock Suspension (Orange Helical Coil Spring + Chrome Damper)
  const shockGroup = new THREE.Group();
  shockGroup.position.set(0.18, 0.45, 0);
  shockGroup.rotation.z = -0.35;
  chassisGroup.add(shockGroup);

  const damperShaft = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 10)),
    mats.chrome
  );
  shockGroup.add(damperShaft);

  const springPts: THREE.Vector3[] = [];
  const turns = 7;
  for (let i = 0; i <= 56; i++) {
    const t = i / 56;
    const a = t * turns * Math.PI * 2;
    springPts.push(new THREE.Vector3(Math.cos(a) * 0.025, (t - 0.5) * 0.16, Math.sin(a) * 0.025));
  }
  const springCoil = new THREE.Mesh(
    track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPts), 48, 0.0055, 6, false)),
    mats.anodizedOrange
  );
  shockGroup.add(springCoil);

  // Cast-Aluminum Footpegs & Folding Left-Side Black Kickstand
  const pegGeo = track(new THREE.BoxGeometry(0.04, 0.015, 0.075));
  for (const zPeg of [-0.12, 0.12]) {
    const peg = new THREE.Mesh(pegGeo, mats.castAluminum);
    peg.position.set(0.08, 0.30, zPeg);
    chassisGroup.add(peg);
  }

  const kickstandPivotGroup = new THREE.Group();
  kickstandPivotGroup.position.set(0.11, 0.31, 0.095);
  chassisGroup.add(kickstandPivotGroup);

  const standCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, -0.14, 0.04),
    new THREE.Vector3(0.08, -0.29, 0.075),
  ]);
  const standRod = new THREE.Mesh(
    track(new THREE.TubeGeometry(standCurve, 10, 0.011, 8, false)),
    mats.blackFrame
  );
  const standFootPad = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.045, 0.008, 0.035)),
    mats.blackFrame
  );
  standFootPad.position.set(0.08, -0.295, 0.075);
  kickstandPivotGroup.add(standRod, standFootPad);

  // ========================================================================
  // C. REAR SWINGARM, MOLDED BLACK CHAIN GUARD HOUSING & REAR KNOBBY WHEEL
  // ========================================================================
  const rearSwingarmPivot = new THREE.Group();
  rearSwingarmPivot.position.set(0.12, 0.34, 0);
  chassisGroup.add(rearSwingarmPivot);

  const armGeo = track(new THREE.BoxGeometry(0.36, 0.036, 0.022));
  for (const zArm of [-0.075, 0.075]) {
    const arm = new THREE.Mesh(armGeo, mats.blackFrame);
    arm.position.set(0.17, -0.055, zArm);
    arm.rotation.z = -0.31;
    arm.castShadow = castShadows;
    rearSwingarmPivot.add(arm);
  }

  // Heavy Molded Black Chain Guard Housing on Left Side (+Z)
  const chainCoverGroup = new THREE.Group();
  chainCoverGroup.position.set(0.17, -0.055, 0.085);
  chainCoverGroup.rotation.z = -0.31;
  rearSwingarmPivot.add(chainCoverGroup);

  const chainHousingMain = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.34, 0.095, 0.026)),
    mats.blackFrame
  );
  const chainEndFront = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.048, 0.048, 0.026, 14)),
    mats.blackFrame
  );
  chainEndFront.rotation.x = Math.PI / 2;
  chainEndFront.position.x = -0.17;
  const chainEndRear = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.054, 0.054, 0.026, 14)),
    mats.blackFrame
  );
  chainEndRear.rotation.x = Math.PI / 2;
  chainEndRear.position.x = 0.17;
  chainCoverGroup.add(chainHousingMain, chainEndFront, chainEndRear);

  const rearWheelSpinGroup = buildDirtBikeWheel(0.18, 0.048, false);
  rearWheelSpinGroup.position.set(0.34, -0.11, 0);
  rearSwingarmPivot.add(rearWheelSpinGroup);

  const rearAxle = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.011, 0.011, 0.20, 12)),
    mats.chrome
  );
  rearAxle.rotation.x = Math.PI / 2;
  rearAxle.position.set(0.34, -0.11, 0);
  const rearCaliper = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.05, 0.055, 0.035)),
    mats.crimsonRed
  );
  rearCaliper.position.set(0.30, -0.05, 0.055);
  rearSwingarmPivot.add(rearAxle, rearCaliper);

  // ========================================================================
  // D. SEATED MOTOCROSS RIDER FIGURE (VISIBLE WHEN RIDING IN 3RD PERSON)
  // ========================================================================
  const riderGroup = new THREE.Group();
  riderGroup.visible = false;
  chassisGroup.add(riderGroup);

  // Leaning torso in dark motocross jacket with orange chest accent
  const torso = new THREE.Mesh(track(new THREE.BoxGeometry(0.20, 0.34, 0.24)), mats.riderJacket);
  torso.position.set(0.14, 0.87, 0);
  torso.rotation.z = 0.28;
  torso.castShadow = castShadows;
  const chestStripe = new THREE.Mesh(track(new THREE.BoxGeometry(0.21, 0.06, 0.22)), mats.glossOrange);
  chestStripe.position.set(0.14, 0.90, 0);
  chestStripe.rotation.z = 0.28;
  riderGroup.add(torso, chestStripe);

  // Motocross Helmet with aggressive peak + anodized orange goggles visor
  const helmet = new THREE.Mesh(track(new THREE.SphereGeometry(0.115, 14, 12)), mats.blackFrame);
  helmet.position.set(0.06, 1.12, 0);
  helmet.castShadow = castShadows;
  const helmetPeak = new THREE.Mesh(track(new THREE.BoxGeometry(0.11, 0.022, 0.14)), mats.glossOrange);
  helmetPeak.position.set(-0.04, 1.18, 0);
  helmetPeak.rotation.z = 0.18;
  const helmetVisor = new THREE.Mesh(track(new THREE.BoxGeometry(0.05, 0.055, 0.15)), mats.riderVisor);
  helmetVisor.position.set(-0.045, 1.12, 0);
  riderGroup.add(helmet, helmetPeak, helmetVisor);

  // Arms reaching forward to the motocross handlebar grips + legs gripping tank onto footpegs
  const riderArmGeo = track(new THREE.CylinderGeometry(0.032, 0.028, 0.36, 8));
  const legGeo = track(new THREE.CylinderGeometry(0.042, 0.034, 0.34, 8));
  const bootGeo = track(new THREE.BoxGeometry(0.12, 0.06, 0.075));
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(riderArmGeo, mats.riderJacket);
    arm.position.set(-0.04, 0.90, side * 0.19);
    arm.rotation.z = 1.24;
    arm.rotation.y = side * -0.25;
    riderGroup.add(arm);

    const thigh = new THREE.Mesh(legGeo, mats.riderPants);
    thigh.position.set(0.12, 0.52, side * 0.13);
    thigh.rotation.z = -0.35;
    riderGroup.add(thigh);

    const boot = new THREE.Mesh(bootGeo, mats.blackFrame);
    boot.position.set(0.08, 0.33, side * 0.135);
    riderGroup.add(boot);
  }

  // ========================================================================
  // E. POOLED 2-STROKE BLUE-WHITE EXHAUST SMOKE PARTICLES (ZERO GC)
  // ========================================================================
  const MAX_SMOKE = 18;
  const smokeGeo = track(new THREE.SphereGeometry(0.024, 6, 6));
  const smokeInst = new THREE.InstancedMesh(smokeGeo, mats.smokeMat, MAX_SMOKE);
  smokeInst.frustumCulled = false;
  const smokePool = Array.from({ length: MAX_SMOKE }, () => ({
    active: false,
    x: 0,
    y: -99,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    age: 0,
    life: 0.6,
  }));
  let smokeCursor = 0;
  let smokeEmitTimer = 0;
  for (let i = 0; i < MAX_SMOKE; i++) {
    dummyObj.position.set(0, -99, 0);
    dummyObj.scale.setScalar(0.001);
    dummyObj.updateMatrix();
    smokeInst.setMatrixAt(i, dummyObj.matrix);
  }
  smokeInst.instanceMatrix.needsUpdate = true;
  root.add(smokeInst);

  const exhaustTipLocal = new THREE.Vector3(0.58, 0.65, 0.04);
  const _tipWorld = new THREE.Vector3();

  const update = (
    state: DirtBike49ccState,
    dt: number,
    elapsed: number,
    occupied: boolean,
    hideRider: boolean
  ) => {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.05);

    // 1. World position & heading
    root.position.set(state.x, state.y, state.z);
    root.rotation.y = state.heading;

    // 2. Steering pivot (handlebars, USD forks, front fender, ORION plate, front wheel)
    steeringPivotGroup.rotation.y = state.steerAngle;

    // 3. Spin knobby front & rear wheels
    frontWheelSpinGroup.rotation.z = state.wheelSpin;
    rearWheelSpinGroup.rotation.z = state.wheelSpin;

    // 4. Kickstand fold animation & realistic lean (kickstand lean when parked, carving lean in turns!)
    const targetStandAngle = state.kickstandDown ? 0 : -1.32;
    kickstandPivotGroup.rotation.z +=
      (targetStandAngle - kickstandPivotGroup.rotation.z) * Math.min(1, safeDt * 12);
    bikeLeanGroup.rotation.x = state.leanAngle;

    // 5. Inverted USD front fork compression, rear mono-shock & forward braking dive
    frontSuspensionLowerGroup.position.y = state.forkCompression * 0.068;
    chassisGroup.position.y = -state.forkCompression * 0.032;
    chassisGroup.rotation.z = state.brakeDive * 0.058;
    rearSwingarmPivot.rotation.z = state.forkCompression * 0.08;

    // 6. Throttle grip twist & hand brake lever squeeze
    const targetTwist = state.revving ? -0.45 : 0;
    throttleGripGroup.rotation.z += (targetTwist - throttleGripGroup.rotation.z) * Math.min(1, safeDt * 14);
    const leverPull = state.braking ? 0.28 : 0;
    frontBrakeLeverPivot.rotation.y += (-leverPull - frontBrakeLeverPivot.rotation.y) * Math.min(1, safeDt * 14);
    rearBrakeLeverPivot.rotation.y += (leverPull - rearBrakeLeverPivot.rotation.y) * Math.min(1, safeDt * 14);

    // 7. 49cc 2-stroke engine block high-frequency vibration
    if (state.engineRunning) {
      const vibAmp = 0.0012 + (state.rpm / 8900) * 0.0026;
      engineBlockGroup.position.x = -0.08 + Math.sin(elapsed * 78) * vibAmp;
      engineBlockGroup.position.y = 0.39 + Math.cos(elapsed * 91) * vibAmp;
    } else {
      engineBlockGroup.position.set(-0.08, 0.39, 0);
    }

    // 8. Rider visibility (shown in 3rd-person cameras when riding, hidden in Cockpit/1st-Person or when parked)
    riderGroup.visible = occupied && !hideRider;

    // 9. Pooled 2-stroke blue-white exhaust smoke emitted in local root space
    if (state.engineRunning && state.exhaustIntensity > 0.1) {
      smokeEmitTimer += safeDt;
      const emitInterval = state.revving ? 0.055 : 0.18;
      if (smokeEmitTimer >= emitInterval) {
        smokeEmitTimer = 0;
        const p = smokePool[smokeCursor];
        smokeCursor = (smokeCursor + 1) % MAX_SMOKE;
        // Convert exhaust tip into root local space (since smokeInst is child of root)
        _tipWorld.copy(exhaustTipLocal);
        // Apply modelAlignGroup (+PI/2 rotY, 1.42 scale): x' = z*1.42, z' = -x*1.42
        p.active = true;
        p.x = _tipWorld.z * 1.42;
        p.y = (_tipWorld.y - state.forkCompression * 0.032) * 1.42;
        p.z = -_tipWorld.x * 1.42;
        p.vx = (Math.random() - 0.5) * 0.35;
        p.vy = 0.42 + Math.random() * 0.35;
        p.vz = -1.2 - Math.abs(state.speed) * 0.18;
        p.age = 0;
        p.life = 0.48 + Math.random() * 0.24;
      }
    }

    let smokeDirty = false;
    for (let i = 0; i < MAX_SMOKE; i++) {
      const p = smokePool[i];
      if (!p.active) continue;
      smokeDirty = true;
      p.age += safeDt;
      if (p.age >= p.life) {
        p.active = false;
        dummyObj.position.set(0, -99, 0);
        dummyObj.scale.setScalar(0.001);
        dummyObj.updateMatrix();
        smokeInst.setMatrixAt(i, dummyObj.matrix);
        continue;
      }
      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
      p.z += p.vz * safeDt;
      const progress = p.age / p.life;
      const s = (1.0 + progress * 2.6) * (1 - progress * 0.45);
      dummyObj.position.set(p.x, p.y, p.z);
      dummyObj.rotation.set(0, 0, 0);
      dummyObj.scale.setScalar(Math.max(0.05, s));
      dummyObj.updateMatrix();
      smokeInst.setMatrixAt(i, dummyObj.matrix);
    }
    if (smokeDirty) {
      smokeInst.instanceMatrix.needsUpdate = true;
    }
  };

  const dispose = () => {
    for (const d of disposables) {
      d.dispose();
    }
  };

  return {
    root,
    bikeLeanGroup,
    chassisGroup,
    steeringPivotGroup,
    frontSuspensionLowerGroup,
    frontWheelSpinGroup,
    rearWheelSpinGroup,
    frontBrakeLeverPivot,
    rearBrakeLeverPivot,
    throttleGripGroup,
    kickstandPivotGroup,
    engineBlockGroup,
    rearSwingarmPivot,
    riderGroup,
    exhaustTipLocal,
    update,
    dispose,
  };
}
