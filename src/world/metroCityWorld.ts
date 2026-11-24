import * as THREE from 'three';
import {
  METRO_CITY_CENTER,
  METRO_CITY_HALF_SIZE,
  MAX_DEBRIS_CHUNKS,
  MAX_DUST_CLOUDS,
  type MetroDestructionState,
} from '../game/metroCity';

export interface HeroVfxRenderInput {
  webLine?: { fromX: number; fromY: number; fromZ: number; toX: number; toY: number; toZ: number; color: number } | null;
  energyBeam?: { fromX: number; fromY: number; fromZ: number; toX: number; toY: number; toZ: number; color: number; alpha: number } | null;
  shockwave?: { x: number; y: number; z: number; radius: number; alpha: number; color: number } | null;
}

export interface MetroCityWorldSystem {
  group: THREE.Group;
  update: (
    state: MetroDestructionState,
    vfx: HeroVfxRenderInput,
    elapsed: number,
    lanternStrength: number
  ) => void;
  dispose: () => void;
}

function createSkyscraperWindowTexture(baseHex: number, glassHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const baseCol = new THREE.Color(baseHex);
    const glassCol = new THREE.Color(glassHex);
    ctx.fillStyle = `#${baseCol.getHexString()}`;
    ctx.fillRect(0, 0, 256, 512);

    const cols = 8;
    const rows = 20;
    const padX = 5;
    const padY = 5;
    const winW = 256 / cols - padX * 2;
    const winH = 512 / rows - padY * 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = (r * 31 + c * 17) % 11;
        const lit = seed < 7;
        ctx.fillStyle = lit
          ? `#${glassCol.getHexString()}`
          : 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(c * (256 / cols) + padX, r * (512 / rows) + padY, winW, winH);

        if (lit && seed % 3 === 0) {
          ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
          ctx.fillRect(c * (256 / cols) + padX + 2, r * (512 / rows) + padY + 2, winW - 4, winH * 0.45);
        }
      }
      // Floor concrete ledge line
      ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
      ctx.fillRect(0, r * (512 / rows), 256, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createAsphaltGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Concrete sidewalk base
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 512);

    // Asphalt Manhattan grid avenues
    ctx.fillStyle = '#1e242d';
    // Central North-South Avenue (x center) & outer avenues
    ctx.fillRect(224, 0, 64, 512);
    ctx.fillRect(102, 0, 42, 512);
    ctx.fillRect(368, 0, 42, 512);
    // East-West Cross Streets
    ctx.fillRect(0, 224, 512, 64);
    ctx.fillRect(0, 102, 512, 42);
    ctx.fillRect(0, 368, 512, 42);

    // Double yellow NYC lane dividers
    ctx.fillStyle = '#facc15';
    ctx.fillRect(253, 0, 2, 512);
    ctx.fillRect(257, 0, 2, 512);
    ctx.fillRect(0, 253, 512, 2);
    ctx.fillRect(0, 257, 512, 2);

    // White crosswalk stripes at intersections
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(229 + i * 9, 214, 5, 10);
      ctx.fillRect(229 + i * 9, 288, 5, 10);
      ctx.fillRect(214, 229 + i * 9, 10, 5);
      ctx.fillRect(288, 229 + i * 9, 10, 5);
    }

    // Central Plaza green park square
    ctx.fillStyle = '#2f6f44';
    ctx.fillRect(236, 236, 40, 40);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface BuildingVisual {
  root: THREE.Group;
  towerGroup: THREE.Group;
  lowerTier: THREE.Mesh;
  midTier: THREE.Mesh;
  upperTier: THREE.Mesh;
  crackOverlay: THREE.Mesh;
  rubbleMound: THREE.Mesh;
  billboard?: THREE.Mesh;
  baseX: number;
  baseZ: number;
}

export function buildMetroCityWorld(
  initialState: MetroDestructionState,
  _isSoftwareGl = false
): MetroCityWorldSystem {
  const group = new THREE.Group();
  const texturesToDispose: THREE.Texture[] = [];

  const cx = METRO_CITY_CENTER.x;
  const cz = METRO_CITY_CENTER.z;
  const fullSize = METRO_CITY_HALF_SIZE * 2;

  // 1. Manhattan Asphalt & Sidewalk Ground Grid
  const gridTex = createAsphaltGridTexture();
  texturesToDispose.push(gridTex);
  const groundMat = new THREE.MeshStandardMaterial({
    map: gridTex,
    roughness: 0.88,
    metalness: 0.06,
  });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(fullSize, fullSize), groundMat);
  groundMesh.rotation.x = -Math.PI * 0.5;
  groundMesh.position.set(cx, 0.04, cz);
  group.add(groundMesh);

  // Glowing Times-Square style billboard palette
  const billboardColors = [0x38bdf8, 0xf43f5e, 0xfacc15, 0xa855f7, 0x10b981];
  const crackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.95,
    transparent: true,
    opacity: 0.52,
  });
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.96 });
  const spireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.82 });

  // 2. 18 Multi-Tier Destructible Skyscrapers
  const buildingVisuals: BuildingVisual[] = [];
  for (let i = 0; i < initialState.buildings.length; i++) {
    const b = initialState.buildings[i];
    const root = new THREE.Group();
    root.position.set(b.x, 0, b.z);

    const towerGroup = new THREE.Group();
    root.add(towerGroup);

    const winTex = createSkyscraperWindowTexture(b.baseColorHex, b.glassColorHex);
    texturesToDispose.push(winTex);
    const towerMat = new THREE.MeshStandardMaterial({
      map: winTex,
      roughness: 0.36,
      metalness: 0.42,
      emissive: new THREE.Color(b.glassColorHex),
      emissiveIntensity: 0.14,
    });

    const t1H = b.height * 0.36;
    const t2H = b.height * 0.36;
    const t3H = b.height * 0.28;

    const lowerTier = new THREE.Mesh(new THREE.BoxGeometry(b.width, t1H, b.depth), towerMat);
    lowerTier.position.y = t1H * 0.5;
    towerGroup.add(lowerTier);

    const midTier = new THREE.Mesh(
      new THREE.BoxGeometry(b.width * 0.94, t2H, b.depth * 0.94),
      towerMat
    );
    midTier.position.y = t1H + t2H * 0.5;
    towerGroup.add(midTier);

    const upperTier = new THREE.Mesh(
      new THREE.BoxGeometry(b.width * 0.82, t3H, b.depth * 0.82),
      towerMat
    );
    upperTier.position.y = t1H + t2H + t3H * 0.5;
    towerGroup.add(upperTier);

    // Architectural spire on tall landmarks
    if (b.hasSpire) {
      const crown = new THREE.Mesh(new THREE.BoxGeometry(b.width * 0.48, 3.2, b.depth * 0.48), spireMat);
      crown.position.y = t3H * 0.5 + 1.6;
      upperTier.add(crown);
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.55, 11.5, 8), spireMat);
      needle.position.y = t3H * 0.5 + 8.5;
      upperTier.add(needle);
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.y = t3H * 0.5 + 14.3;
      upperTier.add(beacon);
    }

    // Glowing Manhattan neon billboard
    let billboard: THREE.Mesh | undefined;
    if (b.hasBillboard) {
      billboard = new THREE.Mesh(
        new THREE.BoxGeometry(b.width * 0.78, 4.4, 0.45),
        new THREE.MeshBasicMaterial({
          color: billboardColors[i % billboardColors.length],
        })
      );
      billboard.position.set(0, t1H * 0.72, b.depth * 0.5 + 0.35);
      lowerTier.add(billboard);
    }

    // Damage scorch/fracture shell (shown on cracked / heavy_damage)
    const crackOverlay = new THREE.Mesh(
      new THREE.BoxGeometry(b.width * 1.02, b.height * 0.56, b.depth * 1.02),
      crackMat
    );
    crackOverlay.position.y = b.height * 0.28;
    crackOverlay.visible = false;
    towerGroup.add(crackOverlay);

    // Collapsed concrete rubble mound (rises cleanly when building collapses!)
    const rubbleMound = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(b.width, b.depth) * 0.62, 5.2, 7),
      rubbleMat
    );
    rubbleMound.position.y = 2.4;
    rubbleMound.visible = false;
    root.add(rubbleMound);

    group.add(root);
    buildingVisuals.push({
      root,
      towerGroup,
      lowerTier,
      midTier,
      upperTier,
      crackOverlay,
      rubbleMound,
      billboard,
      baseX: b.x,
      baseZ: b.z,
    });
  }

  // 3. 50+ Destructible Street Props (Taxis, Buses, Lamps, Traffic Lights, Benches, Water Towers, Crates)
  const propMeshes: THREE.Group[] = [];
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
  const lampGlow = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const glassWin = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2, metalness: 0.65 });

  for (let i = 0; i < initialState.props.length; i++) {
    const p = initialState.props[i];
    const pGroup = new THREE.Group();
    const colMat = new THREE.MeshStandardMaterial({ color: p.colorHex, roughness: 0.55, metalness: 0.25 });

    if (p.kind === 'city_car' || p.kind === 'city_bus') {
      const isBus = p.kind === 'city_bus';
      const len = isBus ? 6.8 : 3.7;
      const wid = isBus ? 2.1 : 1.65;
      const hgt = isBus ? 2.25 : 0.85;
      const body = new THREE.Mesh(new THREE.BoxGeometry(wid, hgt, len), colMat);
      body.position.y = hgt * 0.5 + 0.35;
      pGroup.add(body);
      if (!isBus) {
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.86, 0.62, len * 0.52), glassWin);
        cabin.position.set(0, 1.48, -0.15);
        pGroup.add(cabin);
      }
      for (const sx of [-wid * 0.48, wid * 0.48]) {
        for (const sz of [-len * 0.32, len * 0.32]) {
          const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 10), wheelMat);
          wh.rotation.z = Math.PI * 0.5;
          wh.position.set(sx, 0.32, sz);
          pGroup.add(wh);
        }
      }
    } else if (p.kind === 'street_lamp') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.2, 8), darkMetal);
      pole.position.y = 3.1;
      pGroup.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.1), darkMetal);
      arm.position.set(0.6, 6.1, 0);
      pGroup.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), lampGlow);
      bulb.position.set(1.2, 5.95, 0);
      pGroup.add(bulb);
    } else if (p.kind === 'traffic_light') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 5.8, 8), darkMetal);
      pole.position.y = 2.9;
      pGroup.add(pole);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.25, 0.45), darkMetal);
      box.position.set(0, 5.6, 0);
      pGroup.add(box);
      const redL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redL.position.set(0, 5.95, 0.24);
      pGroup.add(redL);
      const greenL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      greenL.position.set(0, 5.25, 0.24);
      pGroup.add(greenL);
    } else if (p.kind === 'water_tower') {
      for (const sx of [-1.0, 1.0]) {
        for (const sz of [-1.0, 1.0]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.8, 6), darkMetal);
          leg.position.set(sx, 1.4, sz);
          pGroup.add(leg);
        }
      }
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 2.6, 12), colMat);
      tank.position.y = 4.0;
      pGroup.add(tank);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.72, 1.2, 12), darkMetal);
      roof.position.y = 5.9;
      pGroup.add(roof);
    } else if (p.kind === 'bench') {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.6), colMat);
      seat.position.y = 0.52;
      pGroup.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.1), colMat);
      back.position.set(0, 0.82, -0.25);
      pGroup.add(back);
    } else if (p.kind === 'street_barrier') {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.35), colMat);
      bar.position.y = 0.48;
      pGroup.add(bar);
    } else if (p.kind === 'newsstand') {
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.35, 1.6), colMat);
      kiosk.position.y = 1.18;
      pGroup.add(kiosk);
    } else {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.55, 1.55), colMat);
      crate.position.y = 0.78;
      pGroup.add(crate);
    }

    pGroup.position.set(p.x, p.y, p.z);
    pGroup.rotation.y = p.rotY;
    group.add(pGroup);
    propMeshes.push(pGroup);
  }

  // 4. Moving Avenue Traffic Vehicles
  const trafficMeshes: THREE.Group[] = [];
  for (let i = 0; i < initialState.traffic.length; i++) {
    const t = initialState.traffic[i];
    const tGroup = new THREE.Group();
    const carMat = new THREE.MeshStandardMaterial({ color: t.colorHex, roughness: 0.4, metalness: 0.35 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.78, 3.65), carMat);
    body.position.y = 0.68;
    tGroup.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.55, 1.85), glassWin);
    cabin.position.set(0, 1.32, -0.1);
    tGroup.add(cabin);
    if (t.isTaxi) {
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.24), lampGlow);
      sign.position.set(0, 1.7, 0);
      tGroup.add(sign);
    }
    group.add(tGroup);
    trafficMeshes.push(tGroup);
  }

  // 5. High-Performance InstancedMesh Rigid-Body Falling Debris (1 draw call for up to 140 chunks!)
  const debrisGeo = new THREE.BoxGeometry(1, 1, 1);
  const debrisMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.2 });
  const debrisInstanced = new THREE.InstancedMesh(debrisGeo, debrisMat, MAX_DEBRIS_CHUNKS);
  debrisInstanced.count = 0;
  debrisInstanced.frustumCulled = false;
  group.add(debrisInstanced);

  // 6. InstancedMesh Expanding Impact Dust Clouds (1 draw call for up to 28 clouds!)
  const dustGeo = new THREE.IcosahedronGeometry(1, 1);
  const dustMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.98,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  });
  const dustInstanced = new THREE.InstancedMesh(dustGeo, dustMat, MAX_DUST_CLOUDS);
  dustInstanced.count = 0;
  dustInstanced.frustumCulled = false;
  group.add(dustInstanced);

  // 7. Live Superhero VFX Layer (Web-Swing Silk Line, Energy Repulsor/Solar Beam, Seismic Shockwave Ring)
  const webLineGeo = new THREE.CylinderGeometry(0.032, 0.032, 1, 6);
  const webLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const webLineMesh = new THREE.Mesh(webLineGeo, webLineMat);
  webLineMesh.visible = false;
  group.add(webLineMesh);

  const beamGeo = new THREE.CylinderGeometry(0.16, 0.24, 1, 8);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.visible = false;
  group.add(beamMesh);

  const shockwaveMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 1.0, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  shockwaveMesh.rotation.x = -Math.PI * 0.5;
  shockwaveMesh.visible = false;
  group.add(shockwaveMesh);

  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();
  const vFrom = new THREE.Vector3();
  const vTo = new THREE.Vector3();
  const vDir = new THREE.Vector3();
  const vUp = new THREE.Vector3(0, 1, 0);

  const orientCylinder = (
    mesh: THREE.Mesh,
    fromX: number,
    fromY: number,
    fromZ: number,
    toX: number,
    toY: number,
    toZ: number
  ) => {
    vFrom.set(fromX, fromY, fromZ);
    vTo.set(toX, toY, toZ);
    vDir.subVectors(vTo, vFrom);
    const len = Math.max(0.05, vDir.length());
    mesh.position.copy(vFrom).addScaledVector(vDir, 0.5);
    mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(vUp, vDir.normalize());
  };

  const update = (
    state: MetroDestructionState,
    vfx: HeroVfxRenderInput,
    elapsed: number,
    lanternStrength: number
  ) => {
    // 1. Update skyscrapers staged damage, shake, upper-tier breakoff & full collapse
    for (let i = 0; i < state.buildings.length; i++) {
      const b = state.buildings[i];
      const vis = buildingVisuals[i];
      if (!vis) continue;

      const shakeX = b.shakenTimer > 0 ? Math.sin(elapsed * 58 + i) * 0.42 * b.shakenTimer : 0;
      const shakeZ = b.shakenTimer > 0 ? Math.cos(elapsed * 52 + i) * 0.42 * b.shakenTimer : 0;
      vis.root.position.set(vis.baseX + shakeX, 0, vis.baseZ + shakeZ);

      const mat = vis.lowerTier.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = b.stage === 'collapsed' ? 0.02 : 0.14 + lanternStrength * 0.48;

      if (b.stage === 'collapsed') {
        const p = b.collapseProgress;
        vis.towerGroup.position.y = -p * (b.height * 0.92);
        vis.towerGroup.rotation.z = p * 0.24 * (i % 2 === 0 ? 1 : -1);
        vis.towerGroup.visible = p < 0.98;
        vis.rubbleMound.visible = true;
        vis.rubbleMound.scale.setScalar(0.35 + p * 0.72);
      } else {
        vis.towerGroup.visible = true;
        vis.towerGroup.position.y = 0;
        vis.towerGroup.rotation.z = 0;
        vis.rubbleMound.visible = false;
        vis.upperTier.visible = !b.tierDestroyed[2];
        vis.crackOverlay.visible = b.stage === 'cracked' || b.stage === 'heavy_damage';
        if (b.stage === 'heavy_damage') {
          vis.midTier.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.05;
        } else {
          vis.midTier.rotation.z = 0;
        }
      }
    }

    // 2. Update destructible street props
    for (let i = 0; i < state.props.length; i++) {
      const p = state.props[i];
      const mesh = propMeshes[i];
      if (!mesh) continue;
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.set(p.rx, p.rotY, p.rz);
      if (p.destroyed) {
        mesh.scale.set(1, 0.36, 1);
      } else {
        mesh.scale.set(1, 1, 1);
      }
    }

    // 3. Update cruising Manhattan avenue traffic
    for (let i = 0; i < state.traffic.length; i++) {
      const t = state.traffic[i];
      const mesh = trafficMeshes[i];
      if (!mesh) continue;
      if (t.axis === 'z') {
        mesh.position.set(t.lanePos, 0.05, t.coord);
        mesh.rotation.y = t.dir > 0 ? 0 : Math.PI;
      } else {
        mesh.position.set(t.coord, 0.05, t.lanePos);
        mesh.rotation.y = t.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      }
    }

    // 4. Update rigid-body falling debris chunks
    const dCount = Math.min(state.debris.length, MAX_DEBRIS_CHUNKS);
    debrisInstanced.count = dCount;
    for (let i = 0; i < dCount; i++) {
      const d = state.debris[i];
      const fade = d.age > d.maxAge - 1.2 ? Math.max(0.05, (d.maxAge - d.age) / 1.2) : 1;
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(d.rx, d.ry, d.rz);
      dummy.scale.set(d.scaleX * fade, d.scaleY * fade, d.scaleZ * fade);
      dummy.updateMatrix();
      debrisInstanced.setMatrixAt(i, dummy.matrix);
      debrisInstanced.setColorAt(i, tmpColor.setHex(d.colorHex));
    }
    debrisInstanced.instanceMatrix.needsUpdate = true;
    if (debrisInstanced.instanceColor) debrisInstanced.instanceColor.needsUpdate = true;

    // 5. Update impact dust clouds
    const cCount = Math.min(state.dustClouds.length, MAX_DUST_CLOUDS);
    dustInstanced.count = cCount;
    for (let i = 0; i < cCount; i++) {
      const c = state.dustClouds[i];
      const shrink = 1 - Math.max(0, (c.age / c.maxAge - 0.6) / 0.4);
      dummy.position.set(c.x, c.y, c.z);
      dummy.rotation.set(elapsed * 0.4 + i, elapsed * 0.3, 0);
      dummy.scale.setScalar(Math.max(0.1, c.radius * shrink));
      dummy.updateMatrix();
      dustInstanced.setMatrixAt(i, dummy.matrix);
    }
    dustInstanced.instanceMatrix.needsUpdate = true;

    // 6. Live Hero VFX (Web line, Repulsor/Solar Beam, Seismic Shockwave)
    if (vfx.webLine) {
      webLineMesh.visible = true;
      webLineMat.color.setHex(vfx.webLine.color);
      orientCylinder(
        webLineMesh,
        vfx.webLine.fromX,
        vfx.webLine.fromY,
        vfx.webLine.fromZ,
        vfx.webLine.toX,
        vfx.webLine.toY,
        vfx.webLine.toZ
      );
    } else {
      webLineMesh.visible = false;
    }

    if (vfx.energyBeam && vfx.energyBeam.alpha > 0.02) {
      beamMesh.visible = true;
      beamMat.color.setHex(vfx.energyBeam.color);
      beamMat.opacity = Math.min(0.95, vfx.energyBeam.alpha);
      orientCylinder(
        beamMesh,
        vfx.energyBeam.fromX,
        vfx.energyBeam.fromY,
        vfx.energyBeam.fromZ,
        vfx.energyBeam.toX,
        vfx.energyBeam.toY,
        vfx.energyBeam.toZ
      );
    } else {
      beamMesh.visible = false;
    }

    if (vfx.shockwave && vfx.shockwave.alpha > 0.02) {
      shockwaveMesh.visible = true;
      shockwaveMesh.position.set(vfx.shockwave.x, Math.max(0.14, vfx.shockwave.y + 0.14), vfx.shockwave.z);
      shockwaveMesh.scale.setScalar(Math.max(0.5, vfx.shockwave.radius));
      const sMat = shockwaveMesh.material as THREE.MeshBasicMaterial;
      sMat.color.setHex(vfx.shockwave.color);
      sMat.opacity = Math.min(0.85, vfx.shockwave.alpha);
    } else {
      shockwaveMesh.visible = false;
    }
  };

  const dispose = () => {
    texturesToDispose.forEach((t) => t.dispose());
    group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
        child.geometry?.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) m?.dispose();
      }
    });
  };

  return { group, update, dispose };
}
