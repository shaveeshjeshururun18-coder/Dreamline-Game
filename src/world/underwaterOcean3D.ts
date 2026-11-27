import * as THREE from 'three';
import {
  OCEAN_REEF_ZONES,
  SUNKEN_GALLEON_POS,
  type MarineCreatureActor,
  type UnderwaterAtmosphere,
} from '../game/underwaterOcean';
import { groundHeightAt, isOceanAt, WATER_LEVEL } from '../game/terrain';

export interface UnderwaterOceanWorld3D {
  root: THREE.Group;
  update: (params: {
    elapsed: number;
    dt: number;
    atmosphere: UnderwaterAtmosphere;
    actors: MarineCreatureActor[];
    cameraX: number;
    cameraY: number;
    cameraZ: number;
  }) => void;
  dispose: () => void;
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildMantaRayMesh(disposables: Array<{ dispose: () => void }>): {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
} {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.32,
    metalness: 0.14,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.45,
  });
  disposables.push(topMat, bellyMat);

  const bodyGeo = new THREE.SphereGeometry(0.62, 10, 8);
  bodyGeo.scale(1.15, 0.28, 1.55);
  const body = new THREE.Mesh(bodyGeo, topMat);
  const belly = new THREE.Mesh(bodyGeo, bellyMat);
  belly.scale.set(0.95, 0.65, 0.94);
  belly.position.y = -0.07;
  group.add(body, belly);

  const wingGeo = new THREE.ConeGeometry(0.95, 2.35, 4);
  wingGeo.scale(1.0, 1.0, 0.14);
  const leftWing = new THREE.Mesh(wingGeo, topMat);
  leftWing.rotation.z = Math.PI * 0.5;
  leftWing.rotation.y = 0.22;
  leftWing.position.set(-1.05, 0.0, 0.1);
  const rightWing = new THREE.Mesh(wingGeo, topMat);
  rightWing.rotation.z = -Math.PI * 0.5;
  rightWing.rotation.y = -0.22;
  rightWing.position.set(1.05, 0.0, 0.1);
  group.add(leftWing, rightWing);

  // Cephalic fins + whip tail
  const hornGeo = new THREE.BoxGeometry(0.14, 0.08, 0.52);
  for (const sx of [-0.36, 0.36]) {
    const horn = new THREE.Mesh(hornGeo, topMat);
    horn.position.set(sx, -0.02, 1.02);
    group.add(horn);
  }
  const tailGeo = new THREE.CylinderGeometry(0.025, 0.06, 2.4, 6);
  tailGeo.rotateX(Math.PI / 2);
  const tail = new THREE.Mesh(tailGeo, topMat);
  tail.position.set(0, 0, -1.9);
  group.add(tail);

  disposables.push(bodyGeo, wingGeo, hornGeo, tailGeo);
  return { group, leftWing, rightWing };
}

function buildSeaTurtleMesh(disposables: Array<{ dispose: () => void }>): {
  group: THREE.Group;
  leftFlipper: THREE.Mesh;
  rightFlipper: THREE.Mesh;
} {
  const group = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.48, metalness: 0.08 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.55 });
  disposables.push(shellMat, skinMat);

  const shellGeo = new THREE.SphereGeometry(0.68, 12, 8);
  shellGeo.scale(0.92, 0.44, 1.24);
  const shell = new THREE.Mesh(shellGeo, shellMat);
  group.add(shell);

  const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 0.02, 0.92);
  group.add(head);

  const flipGeo = new THREE.BoxGeometry(0.85, 0.08, 0.28);
  const leftFlipper = new THREE.Mesh(flipGeo, skinMat);
  leftFlipper.position.set(-0.76, -0.04, 0.32);
  const rightFlipper = new THREE.Mesh(flipGeo, skinMat);
  rightFlipper.position.set(0.76, -0.04, 0.32);
  group.add(leftFlipper, rightFlipper);

  const rearGeo = new THREE.BoxGeometry(0.38, 0.06, 0.22);
  for (const sx of [-0.42, 0.42]) {
    const rf = new THREE.Mesh(rearGeo, skinMat);
    rf.position.set(sx, -0.05, -0.78);
    group.add(rf);
  }
  disposables.push(shellGeo, headGeo, flipGeo, rearGeo);
  return { group, leftFlipper, rightFlipper };
}

function buildJellyfishMesh(
  colorHex: number,
  disposables: Array<{ dispose: () => void }>
): { group: THREE.Group; bell: THREE.Mesh } {
  const group = new THREE.Group();
  const bellMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.15,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const tendrilMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.55,
  });
  disposables.push(bellMat, tendrilMat);

  const bellGeo = new THREE.SphereGeometry(0.48, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const bell = new THREE.Mesh(bellGeo, bellMat);
  group.add(bell);

  const tendGeo = new THREE.CylinderGeometry(0.015, 0.008, 1.35, 5);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const t = new THREE.Mesh(tendGeo, tendrilMat);
    t.position.set(Math.cos(ang) * 0.22, -0.68, Math.sin(ang) * 0.22);
    group.add(t);
  }
  disposables.push(bellGeo, tendGeo);
  return { group, bell };
}

function buildReefSharkMesh(disposables: Array<{ dispose: () => void }>): {
  group: THREE.Group;
  tail: THREE.Group;
} {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.34, metalness: 0.16 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.42 });
  disposables.push(topMat, bellyMat);

  const bodyGeo = new THREE.CapsuleGeometry(0.42, 2.2, 8, 12);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, topMat);
  const belly = new THREE.Mesh(bodyGeo, bellyMat);
  belly.scale.set(0.86, 0.55, 0.92);
  belly.position.y = -0.14;
  group.add(body, belly);

  const dorsalGeo = new THREE.ConeGeometry(0.28, 0.72, 4);
  const dorsal = new THREE.Mesh(dorsalGeo, topMat);
  dorsal.position.set(0, 0.56, 0.15);
  dorsal.rotation.x = -0.35;
  group.add(dorsal);

  const pecGeo = new THREE.BoxGeometry(1.5, 0.07, 0.46);
  const pec = new THREE.Mesh(pecGeo, topMat);
  pec.position.set(0, -0.14, 0.42);
  group.add(pec);

  const tail = new THREE.Group();
  tail.position.set(0, 0, -1.52);
  const tailFinGeo = new THREE.ConeGeometry(0.32, 0.95, 4);
  tailFinGeo.scale(0.22, 1.0, 1.0);
  const tailTop = new THREE.Mesh(tailFinGeo, topMat);
  tailTop.position.set(0, 0.24, -0.36);
  tailTop.rotation.x = -0.58;
  const tailBot = new THREE.Mesh(tailFinGeo, topMat);
  tailBot.position.set(0, -0.18, -0.32);
  tailBot.rotation.x = Math.PI + 0.52;
  tailBot.scale.setScalar(0.7);
  tail.add(tailTop, tailBot);
  group.add(tail);

  disposables.push(bodyGeo, dorsalGeo, pecGeo, tailFinGeo);
  return { group, tail };
}

function buildWhaleMesh(disposables: Array<{ dispose: () => void }>): {
  group: THREE.Group;
  tailGroup: THREE.Group;
} {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d3b5c, roughness: 0.36, metalness: 0.12 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.48 });
  disposables.push(bodyMat, bellyMat);

  const torsoGeo = new THREE.CapsuleGeometry(1.65, 7.6, 10, 16);
  torsoGeo.rotateX(Math.PI / 2);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  const belly = new THREE.Mesh(torsoGeo, bellyMat);
  belly.scale.set(0.88, 0.56, 0.92);
  belly.position.y = -0.62;
  group.add(torso, belly);

  // Sweeping humpback pectoral flippers
  const flipGeo = new THREE.BoxGeometry(4.4, 0.2, 1.15);
  for (const sx of [-1, 1]) {
    const flip = new THREE.Mesh(flipGeo, bodyMat);
    flip.position.set(sx * 2.55, -0.45, 1.45);
    flip.rotation.y = sx * -0.34;
    flip.rotation.z = sx * -0.16;
    group.add(flip);
  }

  // Articulated tail fluke
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0, -5.2);
  const stalkGeo = new THREE.CylinderGeometry(0.45, 0.92, 2.8, 10);
  stalkGeo.rotateX(Math.PI / 2);
  const stalk = new THREE.Mesh(stalkGeo, bodyMat);
  stalk.position.z = -1.2;
  const flukeGeo = new THREE.BoxGeometry(4.8, 0.18, 1.45);
  const fluke = new THREE.Mesh(flukeGeo, bodyMat);
  fluke.position.z = -2.65;
  tailGroup.add(stalk, fluke);
  group.add(tailGroup);

  disposables.push(torsoGeo, flipGeo, stalkGeo, flukeGeo);
  return { group, tailGroup };
}

function buildSunkenGalleonWreck(disposables: Array<{ dispose: () => void }>): THREE.Group {
  const g = new THREE.Group();
  const oakMat = new THREE.MeshStandardMaterial({ color: 0x423022, roughness: 0.92, metalness: 0.04 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x2a4f3c, roughness: 0.88 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.55 });
  const goldGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.5,
    roughness: 0.28,
    metalness: 0.75,
  });
  disposables.push(oakMat, mossMat, ironMat, goldGlowMat);

  // Tilted sunken wooden hull
  const hullGeo = new THREE.BoxGeometry(5.6, 3.2, 16.5);
  const hull = new THREE.Mesh(hullGeo, oakMat);
  hull.position.y = 1.4;
  g.add(hull);

  // Curved weathered hull ribs & broken stern castle
  const ribGeo = new THREE.BoxGeometry(6.1, 0.34, 0.38);
  for (let i = -3; i <= 3; i++) {
    const rib = new THREE.Mesh(ribGeo, i % 2 === 0 ? oakMat : mossMat);
    rib.position.set(0, 3.05, i * 2.1);
    g.add(rib);
  }
  const sternGeo = new THREE.BoxGeometry(5.2, 2.4, 4.6);
  const stern = new THREE.Mesh(sternGeo, oakMat);
  stern.position.set(0, 3.8, -5.6);
  g.add(stern);

  // Broken mainmast & yardarm
  const mastGeo = new THREE.CylinderGeometry(0.24, 0.34, 8.8, 8);
  const mast = new THREE.Mesh(mastGeo, oakMat);
  mast.position.set(0.2, 6.2, 0.8);
  mast.rotation.z = 0.24;
  const yardGeo = new THREE.CylinderGeometry(0.14, 0.14, 6.4, 8);
  yardGeo.rotateZ(Math.PI / 2);
  const yard = new THREE.Mesh(yardGeo, mossMat);
  yard.position.set(0.8, 7.6, 0.8);
  yard.rotation.y = 0.35;
  g.add(mast, yard);

  // Glowing Sunken Treasure Chest on the deck
  const chestGeo = new THREE.BoxGeometry(1.4, 0.88, 0.95);
  const chest = new THREE.Mesh(chestGeo, oakMat);
  chest.position.set(0, 3.4, 3.6);
  const goldPile = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), goldGlowMat);
  goldPile.scale.set(1.2, 0.45, 0.85);
  goldPile.position.set(0, 3.92, 3.6);
  g.add(chest, goldPile);

  // Iron anchor resting in sand beside bow
  const anchorShank = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.8, 6), ironMat);
  anchorShank.position.set(3.8, 1.0, 6.2);
  anchorShank.rotation.z = 0.6;
  const anchorCross = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.11, 6, 12, Math.PI), ironMat);
  anchorCross.position.set(4.5, 0.45, 6.2);
  anchorCross.rotation.z = Math.PI + 0.6;
  g.add(anchorShank, anchorCross);

  disposables.push(hullGeo, ribGeo, sternGeo, mastGeo, yardGeo, chestGeo);

  const floorY = groundHeightAt(SUNKEN_GALLEON_POS.x, SUNKEN_GALLEON_POS.z);
  g.position.set(SUNKEN_GALLEON_POS.x, floorY - 0.5, SUNKEN_GALLEON_POS.z);
  g.rotation.set(0.08, SUNKEN_GALLEON_POS.heading, 0.22);
  return g;
}

/**
 * Builds the living 3D Underwater Ocean Ecosystem:
 * - Animated seabed sunlight caustics shader conformed to the ocean floor
 * - Volumetric sunlit god-rays descending through the turquoise water column
 * - Instanced coral reef gardens (staghorn, brain corals, boulders, glowing anemones)
 * - Swaying underwater kelp forest
 * - Sunken Wooden Galleon Wreck
 * - Articulated Manta Rays, Sea Turtles, Bioluminescent Jellyfish, Reef Sharks, Whales & Fish Schools
 * - Camera-following marine snow / plankton & rising bubbles
 */
export function buildUnderwaterOceanWorld3D(): UnderwaterOceanWorld3D {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const rand = seeded(884211);

  // -------------------------------------------------------------------------
  // 1. ANIMATED SEABED SUNLIGHT CAUSTICS SHADER MESH (conformed to ocean bed)
  // -------------------------------------------------------------------------
  const causticUniforms = {
    uTime: { value: 0 },
    uStrength: { value: 0.85 },
    uTint: { value: new THREE.Color(0x67e8f9) },
  };
  const causticW = 165;
  const causticD = 185;
  const causticGeo = new THREE.PlaneGeometry(causticW, causticD, 48, 48);
  causticGeo.rotateX(-Math.PI / 2);
  const cPos = causticGeo.attributes.position as THREE.BufferAttribute;
  const cCenterX = 182;
  const cCenterZ = 114;
  for (let i = 0; i < cPos.count; i++) {
    const wx = cPos.getX(i) + cCenterX;
    const wz = cPos.getZ(i) + cCenterZ;
    const fy = groundHeightAt(wx, wz);
    // Keep strictly beneath water surface so caustics never poke above islands or beach
    cPos.setY(i, fy < WATER_LEVEL - 0.5 ? fy + 0.16 : fy - 1.2);
  }
  causticGeo.computeVertexNormals();

  const causticMat = new THREE.ShaderMaterial({
    uniforms: causticUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uStrength;
      uniform vec3 uTint;
      varying vec3 vWorldPos;

      float causticPattern(vec2 uv, float t) {
        vec2 p = uv * 0.24;
        float c1 = sin(p.x * 3.1 + t * 1.4 + sin(p.y * 2.4 - t * 1.1));
        float c2 = cos(p.y * 3.5 - t * 1.25 + cos(p.x * 2.7 + t * 0.95));
        float c3 = sin((p.x + p.y) * 2.6 + t * 1.65);
        float web = abs(c1 + c2 + c3 * 0.65);
        return pow(clamp(1.0 - web * 0.52, 0.0, 1.0), 4.0);
      }

      void main() {
        float depth = ${WATER_LEVEL.toFixed(2)} - vWorldPos.y;
        if (depth < 0.65) discard;
        float ca = causticPattern(vWorldPos.xz, uTime) + causticPattern(vWorldPos.xz * 1.45 + 13.7, -uTime * 0.8) * 0.55;
        float depthFade = smoothstep(0.65, 2.2, depth) * (1.0 - smoothstep(14.0, 23.0, depth));
        float alpha = clamp(ca * 0.42 * depthFade * uStrength, 0.0, 0.52);
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(uTint * (0.85 + ca * 0.55), alpha);
      }
    `,
  });
  const causticMesh = new THREE.Mesh(causticGeo, causticMat);
  causticMesh.position.set(cCenterX, 0, cCenterZ);
  root.add(causticMesh);
  disposables.push(causticGeo, causticMat);

  // -------------------------------------------------------------------------
  // 2. VOLUMETRIC SUNLIT UNDERWATER GOD-RAYS (soft additive descending shafts)
  // -------------------------------------------------------------------------
  const godRayUniforms = {
    uTime: { value: 0 },
    uStrength: { value: 0.7 },
  };
  const godRayMat = new THREE.ShaderMaterial({
    uniforms: godRayUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vPhase;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPhase = wp.x * 0.17 + wp.z * 0.13;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      varying float vPhase;
      void main() {
        // Soft vertical fade (brightest near surface vUv.y=1, dissolving softly at seabed vUv.y=0)
        float vert = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
        float edge = sin(vUv.x * 3.14159);
        float shimmer = 0.65 + 0.35 * sin(uTime * 0.95 + vPhase + vUv.x * 6.28);
        float alpha = vert * edge * shimmer * 0.14 * uStrength;
        gl_FragColor = vec4(0.45, 0.92, 0.98, alpha);
      }
    `,
  });
  const rayGeo = new THREE.CylinderGeometry(1.1, 3.6, 16.5, 10, 1, true);
  disposables.push(godRayMat, rayGeo);

  const godRayGroup = new THREE.Group();
  const rayAnchors: Array<[number, number, number]> = [];
  for (const z of OCEAN_REEF_ZONES) {
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2 + rand() * 0.5;
      const dist = 4 + rand() * (z.radius * 0.72);
      const rx = z.x + Math.cos(ang) * dist;
      const rz = z.z + Math.sin(ang) * dist;
      if (!isOceanAt(rx, rz)) continue;
      const fy = groundHeightAt(rx, rz);
      if (fy > WATER_LEVEL - 4.5) continue;
      const ray = new THREE.Mesh(rayGeo, godRayMat);
      ray.position.set(rx, WATER_LEVEL - 8.4, rz);
      ray.rotation.set(0.18 + (rand() - 0.5) * 0.08, rand() * Math.PI, -0.14);
      godRayGroup.add(ray);
      rayAnchors.push([rx, rz, rand() * Math.PI * 2]);
    }
  }
  root.add(godRayGroup);

  // -------------------------------------------------------------------------
  // 3. LUSH CORAL REEF GARDENS, REEF BOULDERS & GLOWING SEA ANEMONES
  // -------------------------------------------------------------------------
  const coralPalette = [
    new THREE.Color(0xf43f5e), // Coral Rose
    new THREE.Color(0xfb923c), // Sunset Reef Orange
    new THREE.Color(0xfacc15), // Golden Staghorn
    new THREE.Color(0xc084fc), // Reef Amethyst
    new THREE.Color(0x2dd4bf), // Seafoam Teal
    new THREE.Color(0xf472b6), // Flamingo Pink
  ];

  // Branching coral clusters (InstancedMesh)
  const coralBranchGeo = new THREE.ConeGeometry(0.62, 2.25, 6);
  coralBranchGeo.translate(0, 1.05, 0);
  const coralMat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.04 });
  const coralCount = 220;
  const coralInst = new THREE.InstancedMesh(coralBranchGeo, coralMat, coralCount);

  // Dome brain corals & mossy reef boulders
  const boulderGeo = new THREE.DodecahedronGeometry(1.15, 1);
  boulderGeo.scale(1.25, 0.72, 1.12);
  const boulderMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.03 });
  const boulderCount = 120;
  const boulderInst = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderCount);

  // Glowing sea anemones
  const anemoneGeo = new THREE.SphereGeometry(0.45, 8, 6);
  anemoneGeo.scale(1.15, 0.62, 1.15);
  const anemoneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.65,
    roughness: 0.4,
  });
  const anemoneCount = 48;
  const anemoneInst = new THREE.InstancedMesh(anemoneGeo, anemoneMat, anemoneCount);

  const dummy = new THREE.Object3D();
  const cTmp = new THREE.Color();

  const pickReefPos = (): { x: number; y: number; z: number } | null => {
    for (let tries = 0; tries < 10; tries++) {
      const zone = OCEAN_REEF_ZONES[Math.floor(rand() * OCEAN_REEF_ZONES.length)];
      const ang = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * zone.radius;
      const x = zone.x + Math.cos(ang) * dist;
      const z = zone.z + Math.sin(ang) * dist;
      if (!isOceanAt(x, z)) continue;
      const y = groundHeightAt(x, z);
      if (y < WATER_LEVEL - 2.2) return { x, y, z };
    }
    return null;
  };

  let cPlaced = 0;
  for (let i = 0; i < coralCount; i++) {
    const p = pickReefPos();
    if (!p) continue;
    dummy.position.set(p.x, p.y - 0.1, p.z);
    dummy.rotation.set((rand() - 0.5) * 0.45, rand() * Math.PI * 2, (rand() - 0.5) * 0.45);
    const sx = 0.65 + rand() * 1.35;
    const sy = 0.55 + rand() * 1.45;
    dummy.scale.set(sx, sy, sx);
    dummy.updateMatrix();
    coralInst.setMatrixAt(cPlaced, dummy.matrix);
    coralInst.setColorAt(cPlaced, coralPalette[Math.floor(rand() * coralPalette.length)]);
    cPlaced++;
  }
  coralInst.count = cPlaced;
  coralInst.instanceMatrix.needsUpdate = true;
  if (coralInst.instanceColor) coralInst.instanceColor.needsUpdate = true;

  let bPlaced = 0;
  for (let i = 0; i < boulderCount; i++) {
    const p = pickReefPos();
    if (!p) continue;
    dummy.position.set(p.x, p.y + 0.15, p.z);
    dummy.rotation.set((rand() - 0.5) * 0.3, rand() * Math.PI * 2, (rand() - 0.5) * 0.3);
    const s = 0.75 + rand() * 1.85;
    dummy.scale.set(s, s * (0.65 + rand() * 0.5), s);
    dummy.updateMatrix();
    boulderInst.setMatrixAt(bPlaced, dummy.matrix);
    cTmp.setHex(i % 3 === 0 ? 0x5c6b58 : i % 3 === 1 ? 0x475569 : 0x7c6f5b);
    boulderInst.setColorAt(bPlaced, cTmp);
    bPlaced++;
  }
  boulderInst.count = bPlaced;
  boulderInst.instanceMatrix.needsUpdate = true;
  if (boulderInst.instanceColor) boulderInst.instanceColor.needsUpdate = true;

  let aPlaced = 0;
  for (let i = 0; i < anemoneCount; i++) {
    const p = pickReefPos();
    if (!p) continue;
    dummy.position.set(p.x, p.y + 0.18, p.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    const s = 0.7 + rand() * 0.95;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    anemoneInst.setMatrixAt(aPlaced, dummy.matrix);
    cTmp.setHex(i % 2 === 0 ? 0x38bdf8 : 0xe879f9);
    anemoneInst.setColorAt(aPlaced, cTmp);
    aPlaced++;
  }
  anemoneInst.count = aPlaced;
  anemoneInst.instanceMatrix.needsUpdate = true;
  if (anemoneInst.instanceColor) anemoneInst.instanceColor.needsUpdate = true;

  root.add(coralInst, boulderInst, anemoneInst);
  disposables.push(coralBranchGeo, coralMat, boulderGeo, boulderMat, anemoneGeo, anemoneMat);

  // -------------------------------------------------------------------------
  // 4. SWAYING UNDERWATER KELP & SEAGRASS FOREST (Shader-animated vertex wave)
  // -------------------------------------------------------------------------
  const kelpUniforms = { uTime: { value: 0 } };
  const kelpGeo = new THREE.PlaneGeometry(0.65, 6.2, 1, 7);
  kelpGeo.translate(0, 3.1, 0);
  const kelpMat = new THREE.ShaderMaterial({
    uniforms: kelpUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vShade;
      void main() {
        vUv = uv;
        vec3 pos = position;
        vec4 instWorld = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float phase = instWorld.x * 0.25 + instWorld.z * 0.21;
        float sway = sin(uTime * 1.45 + phase + uv.y * 3.2) * 0.62 * uv.y * uv.y;
        float swayZ = cos(uTime * 1.15 + phase * 1.3 + uv.y * 2.6) * 0.38 * uv.y * uv.y;
        pos.x += sway;
        pos.z += swayZ;
        // Taper leaf blade cleanly toward tip
        pos.x *= mix(1.0, 0.25, uv.y);
        vShade = mix(0.45, 1.05, uv.y);
        vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vShade;
      void main() {
        vec3 baseCol = vec3(0.06, 0.32, 0.22);
        vec3 tipCol = vec3(0.18, 0.62, 0.36);
        vec3 col = mix(baseCol, tipCol, vUv.y) * vShade;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const kelpCount = 240;
  const kelpInst = new THREE.InstancedMesh(kelpGeo, kelpMat, kelpCount);
  let kPlaced = 0;
  for (let i = 0; i < kelpCount; i++) {
    const p = pickReefPos();
    if (!p) continue;
    const availH = Math.max(2.2, WATER_LEVEL - p.y - 2.0);
    const heightScale = Math.min(availH / 6.2, 0.55 + rand() * 1.15);
    dummy.position.set(p.x, p.y - 0.12, p.z);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.scale.set(0.8 + rand() * 0.65, heightScale, 1);
    dummy.updateMatrix();
    kelpInst.setMatrixAt(kPlaced, dummy.matrix);
    kPlaced++;
  }
  kelpInst.count = kPlaced;
  kelpInst.instanceMatrix.needsUpdate = true;
  root.add(kelpInst);
  disposables.push(kelpGeo, kelpMat);

  // -------------------------------------------------------------------------
  // 5. SUNKEN WOODEN GALLEON WRECK
  // -------------------------------------------------------------------------
  const galleonWreck = buildSunkenGalleonWreck(disposables);
  root.add(galleonWreck);

  // -------------------------------------------------------------------------
  // 6. LIVING ANIMATED 3D MARINE CREATURES
  // -------------------------------------------------------------------------
  // Instanced Tropical Fish School (48 fish)
  const fishGeo = new THREE.ConeGeometry(0.19, 0.72, 5);
  fishGeo.rotateX(Math.PI / 2);
  fishGeo.scale(0.55, 1.15, 1.0);
  const fishMat = new THREE.MeshStandardMaterial({ roughness: 0.26, metalness: 0.25 });
  const maxFish = 64;
  const fishInst = new THREE.InstancedMesh(fishGeo, fishMat, maxFish);
  fishInst.frustumCulled = false;
  root.add(fishInst);
  disposables.push(fishGeo, fishMat);

  const mantaRigs: Array<{ id: string; group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh }> = [];
  const turtleRigs: Array<{ id: string; group: THREE.Group; leftFlipper: THREE.Mesh; rightFlipper: THREE.Mesh }> = [];
  const jellyRigs: Array<{ id: string; group: THREE.Group; bell: THREE.Mesh }> = [];
  const sharkRigs: Array<{ id: string; group: THREE.Group; tail: THREE.Group }> = [];
  const whaleRigs: Array<{ id: string; group: THREE.Group; tailGroup: THREE.Group }> = [];
  const creatureGroup = new THREE.Group();
  root.add(creatureGroup);

  const ensureCreatureMeshes = (actors: MarineCreatureActor[]) => {
    if (mantaRigs.length > 0 || turtleRigs.length > 0) return;
    for (const a of actors) {
      if (a.kind === 'manta_ray') {
        const rig = buildMantaRayMesh(disposables);
        rig.group.scale.setScalar(a.scale);
        creatureGroup.add(rig.group);
        mantaRigs.push({ id: a.id, ...rig });
      } else if (a.kind === 'sea_turtle') {
        const rig = buildSeaTurtleMesh(disposables);
        rig.group.scale.setScalar(a.scale);
        creatureGroup.add(rig.group);
        turtleRigs.push({ id: a.id, ...rig });
      } else if (a.kind === 'jellyfish') {
        const rig = buildJellyfishMesh(a.colorHex, disposables);
        rig.group.scale.setScalar(a.scale);
        creatureGroup.add(rig.group);
        jellyRigs.push({ id: a.id, ...rig });
      } else if (a.kind === 'reef_shark') {
        const rig = buildReefSharkMesh(disposables);
        rig.group.scale.setScalar(a.scale);
        creatureGroup.add(rig.group);
        sharkRigs.push({ id: a.id, ...rig });
      } else if (a.kind === 'whale') {
        const rig = buildWhaleMesh(disposables);
        rig.group.scale.setScalar(a.scale);
        creatureGroup.add(rig.group);
        whaleRigs.push({ id: a.id, ...rig });
      }
    }
  };

  // -------------------------------------------------------------------------
  // 7. CAMERA-FOLLOWING MARINE SNOW, PLANKTON & RISING BUBBLES
  // -------------------------------------------------------------------------
  const bubbleCount = 120;
  const moteGeo = new THREE.SphereGeometry(0.065, 5, 5);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0xcffafe,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const moteInst = new THREE.InstancedMesh(moteGeo, moteMat, bubbleCount);
  moteInst.frustumCulled = false;
  const moteSeeds = Array.from({ length: bubbleCount }, () => ({
    ox: (rand() - 0.5) * 34,
    oy: (rand() - 0.5) * 14,
    oz: (rand() - 0.5) * 34,
    speed: 0.45 + rand() * 1.15,
    scale: 0.45 + rand() * 1.35,
    phase: rand() * Math.PI * 2,
  }));
  root.add(moteInst);
  disposables.push(moteGeo, moteMat);

  // Lookup maps for O(1) per-frame updates
  const mantaById = new Map<string, (typeof mantaRigs)[number]>();
  const turtleById = new Map<string, (typeof turtleRigs)[number]>();
  const jellyById = new Map<string, (typeof jellyRigs)[number]>();
  const sharkById = new Map<string, (typeof sharkRigs)[number]>();
  const whaleById = new Map<string, (typeof whaleRigs)[number]>();
  let mapsBuilt = false;

  const update = (params: {
    elapsed: number;
    dt: number;
    atmosphere: UnderwaterAtmosphere;
    actors: MarineCreatureActor[];
    cameraX: number;
    cameraY: number;
    cameraZ: number;
  }) => {
    const { elapsed, atmosphere, actors, cameraX, cameraY, cameraZ } = params;
    ensureCreatureMeshes(actors);
    if (!mapsBuilt && mantaRigs.length > 0) {
      mantaRigs.forEach((r) => mantaById.set(r.id, r));
      turtleRigs.forEach((r) => turtleById.set(r.id, r));
      jellyRigs.forEach((r) => jellyById.set(r.id, r));
      sharkRigs.forEach((r) => sharkById.set(r.id, r));
      whaleRigs.forEach((r) => whaleById.set(r.id, r));
      mapsBuilt = true;
    }

    kelpUniforms.uTime.value = elapsed;
    causticUniforms.uTime.value = elapsed;
    causticUniforms.uStrength.value = atmosphere.submerged ? atmosphere.causticsStrength : 0.35;
    godRayUniforms.uTime.value = elapsed;
    godRayUniforms.uStrength.value = atmosphere.submerged ? atmosphere.godRayStrength : 0;
    godRayGroup.visible = atmosphere.submerged && atmosphere.godRayStrength > 0.04;

    // Update Tropical Fish School InstancedMesh + Articulated Marine Creatures
    let fishIdx = 0;
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      if (a.kind === 'tropical_fish' && fishIdx < maxFish) {
        const wag = Math.sin(elapsed * 9.5 + a.phase) * 0.16;
        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(a.pitch, a.heading + wag, 0);
        dummy.scale.setScalar(a.scale);
        dummy.updateMatrix();
        fishInst.setMatrixAt(fishIdx, dummy.matrix);
        cTmp.setHex(a.colorHex);
        fishInst.setColorAt(fishIdx, cTmp);
        fishIdx++;
      } else if (a.kind === 'manta_ray') {
        const r = mantaById.get(a.id);
        if (r) {
          r.group.position.set(a.x, a.y, a.z);
          r.group.rotation.set(a.pitch, a.heading, 0);
          const flap = Math.sin(elapsed * 2.4 + a.phase) * 0.34;
          r.leftWing.rotation.z = Math.PI * 0.5 + flap;
          r.rightWing.rotation.z = -Math.PI * 0.5 - flap;
        }
      } else if (a.kind === 'sea_turtle') {
        const r = turtleById.get(a.id);
        if (r) {
          r.group.position.set(a.x, a.y, a.z);
          r.group.rotation.set(a.pitch, a.heading, 0);
          const stroke = Math.sin(elapsed * 3.1 + a.phase) * 0.42;
          r.leftFlipper.rotation.z = stroke;
          r.rightFlipper.rotation.z = -stroke;
        }
      } else if (a.kind === 'jellyfish') {
        const r = jellyById.get(a.id);
        if (r) {
          r.group.position.set(a.x, a.y, a.z);
          const pulse = 1 + Math.sin(elapsed * 2.9 + a.phase) * 0.16;
          r.bell.scale.set(pulse, 1 / pulse, pulse);
        }
      } else if (a.kind === 'reef_shark') {
        const r = sharkById.get(a.id);
        if (r) {
          r.group.position.set(a.x, a.y, a.z);
          r.group.rotation.set(a.pitch, a.heading, 0);
          r.tail.rotation.y = Math.sin(elapsed * 5.8 + a.phase) * 0.42;
        }
      } else if (a.kind === 'whale') {
        const r = whaleById.get(a.id);
        if (r) {
          r.group.position.set(a.x, a.y, a.z);
          r.group.rotation.set(a.pitch, a.heading, 0);
          r.tailGroup.rotation.x = Math.sin(elapsed * 1.45 + a.phase) * 0.3;
        }
      }
    }
    fishInst.count = fishIdx;
    fishInst.instanceMatrix.needsUpdate = true;
    if (fishInst.instanceColor) fishInst.instanceColor.needsUpdate = true;

    // Marine snow & rising bubbles around camera when submerged
    moteInst.visible = atmosphere.submerged;
    if (atmosphere.submerged) {
      for (let i = 0; i < bubbleCount; i++) {
        const s = moteSeeds[i];
        const rise = ((elapsed * s.speed + s.oy + 140) % 14) - 7;
        const wx = cameraX + s.ox + Math.sin(elapsed * 0.8 + s.phase) * 0.65;
        const wy = Math.min(WATER_LEVEL - 0.35, cameraY + rise);
        const wz = cameraZ + s.oz + Math.cos(elapsed * 0.7 + s.phase) * 0.65;
        dummy.position.set(wx, wy, wz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(s.scale);
        dummy.updateMatrix();
        moteInst.setMatrixAt(i, dummy.matrix);
      }
      moteInst.instanceMatrix.needsUpdate = true;
    }
  };

  return {
    root,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
