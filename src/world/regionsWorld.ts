import * as THREE from 'three';
import { DINOSAUR_ISLAND_CENTER } from '../game/dinosaurIsland';
import {
  CAMPSITE_CENTER,
  COAST_CENTER,
  FROZEN_LAKE_CENTER,
  SNOW_PEAK_CENTER,
  WATERFALL_CENTER,
  WATER_LEVEL,
  groundHeightAt,
  type AabbCollider,
} from '../game/terrain';
import {
  GIANT_IGLOO_MAN_HEIGHT_M,
  GIANT_IGLOO_MAN_POS,
  ICELAND_RETURN_GATE_POS,
} from '../game/iceland';
import { isNearFrozenKingdomClearing } from '../game/frozenKingdom';
import type { CampingState, InteractableItem } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface RegionsWorldSystem {
  group: THREE.Group;
  colliders: AabbCollider[];
  interactables: InteractableItem[];
  triggerIglooManWave: () => void;
  update: (
    time: number,
    dt: number,
    sunDir: THREE.Vector3,
    skyColor: THREE.Color,
    sunColor: THREE.Color,
    lanternStrength: number,
    camping: CampingState,
    playerX?: number,
    playerZ?: number
  ) => void;
  dispose: () => void;
}

/**
 * Builds the 4 new interconnected regions of DREAMLINE:
 * 1. Kadalkarai Coast (கடற்கரை நகரம்) — Animated Ocean shader, Sandy Beach, Rotating Lighthouse, Fishing Harbour, Coastal Cafés
 * 2. Panimalai Snow Peaks (பனிமலைச் சிகரம்) — Snowy Alpine Crags, Instanced Snow Pines, Frozen Lake, Warm Winter Cabins + Chimney Smoke
 * 3. Pachai Vayal Countryside (பச்சை வயல்) — Terraced Emerald Rice Paddies, Animated Cascading Waterfall + Mist Pool
 * 4. Neelam Lake Campsite (நீலம் ஏரி முகாம்) — Pitchable Canvas Tent, Interactive Campfire + Flames/Embers/Smoke, Lakeside Cabin
 */
export function buildRegionsWorld(textures: ProceduralTextureSet): RegionsWorldSystem {
  const group = new THREE.Group();
  const colliders: AabbCollider[] = [];
  const interactables: InteractableItem[] = [];

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.82,
    color: 0xb69072,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodAlbedo,
    roughness: 0.84,
    color: 0x5c4132,
  });
  const plasterMat = new THREE.MeshStandardMaterial({
    map: textures.plasterWall,
    roughness: 0.88,
    color: 0xf4ece0,
  });
  const roofBlueMat = new THREE.MeshStandardMaterial({
    map: textures.roofTile,
    roughness: 0.74,
    color: 0x3b607a,
  });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f4fa, roughness: 0.85 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6c727c, roughness: 0.94 });
  const warmWinMat = new THREE.MeshStandardMaterial({
    color: 0xffe4aa,
    emissive: 0xffab4c,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  // =========================================================================
  // REGION 01: KADALKARAI COAST (கடற்கரை நகரம்)
  // =========================================================================
  const oceanUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.5, 0.4, -0.5) },
    uSkyColor: { value: new THREE.Color(0x6fb8d6) },
    uSunColor: { value: new THREE.Color(0xffd79e) },
  };
  const oceanMat = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    transparent: true,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float swell = sin(pos.x * 0.16 + uTime * 1.45) * 0.14 + cos(pos.y * 0.12 - uTime * 1.1) * 0.10;
        pos.z += swell;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        float w1 = sin(vWorldPos.x * 0.42 + uTime * 1.8) * cos(vWorldPos.z * 0.35 - uTime * 1.3);
        float w2 = sin((vWorldPos.x - vWorldPos.z) * 0.65 + uTime * 2.1);
        vec3 normal = normalize(vec3(w1 * 0.08 + w2 * 0.04, 1.0, w2 * 0.07));
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        // Shallow turquoise near mainland coast AND around far-offshore SSJ Dinosaur Island
        float distMainland = clamp((vWorldPos.x - 108.0) / 52.0, 0.0, 1.0);
        float distDinoIsland = length(vWorldPos.xz - vec2(${DINOSAUR_ISLAND_CENTER.x.toFixed(1)}, ${DINOSAUR_ISLAND_CENTER.z.toFixed(1)}));
        float islandShallow = 1.0 - smoothstep(26.0, 44.0, distDinoIsland);
        float depthT = clamp(distMainland * (1.0 - islandShallow * 0.85), 0.0, 1.0);
        vec3 shallowCol = vec3(0.19, 0.67, 0.72);
        vec3 deepCol = vec3(0.08, 0.28, 0.48);
        vec3 waterBase = mix(shallowCol, deepCol, depthT);

        // Soft animated shoreline foam band along mainland beach AND Dinosaur Island shore
        float foamEdge = smoothstep(115.0, 108.5, vWorldPos.x + sin(vWorldPos.z * 0.16 + uTime * 1.4) * 2.4);
        float islandFoamEdge = (1.0 - smoothstep(27.0, 33.5, distDinoIsland + sin(vWorldPos.x * 0.22 + uTime * 1.5) * 1.6)) * smoothstep(22.0, 27.5, distDinoIsland);
        float foamRipple = smoothstep(0.35, 0.9, sin(vWorldPos.x * 1.1 - uTime * 2.6 + sin(vWorldPos.z * 0.25)));
        float foam = clamp(max(foamEdge, islandFoamEdge) * (0.55 + foamRipple * 0.45), 0.0, 0.85);

        vec3 reflectDir = reflect(-normalize(uSunDir), normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 54.0);

        vec3 col = mix(waterBase, uSkyColor, fresnel * 0.62);
        col += uSunColor * spec * 1.1;
        col = mix(col, vec3(0.95, 0.98, 1.0), foam * 0.72);
        gl_FragColor = vec4(col, 0.93);
      }
    `,
  });

  const oceanMesh = new THREE.Mesh(new THREE.PlaneGeometry(580, 580, 76, 76), oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.set(305, WATER_LEVEL + 0.03, 165);
  group.add(oceanMesh);

  // Tall Red-and-White Kadalkarai Lighthouse at (114, 42)
  const lhGroup = new THREE.Group();
  const lhX = 114;
  const lhZ = 42;
  const lhBaseY = Math.max(0.25, groundHeightAt(lhX, lhZ));
  lhGroup.position.set(lhX, lhBaseY, lhZ);

  const lhRock = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 5.2, 2.2, 10), rockMat);
  lhRock.position.y = 0.8;
  lhGroup.add(lhRock);

  const lhStripeColors = [0xf6f3ee, 0xc94a3f, 0xf6f3ee, 0xc94a3f, 0xf6f3ee];
  for (let i = 0; i < lhStripeColors.length; i++) {
    const rBot = 2.35 - i * 0.22;
    const rTop = 2.13 - i * 0.22;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, 2.8, 14),
      new THREE.MeshStandardMaterial({ color: lhStripeColors[i], roughness: 0.7 })
    );
    band.position.y = 3.1 + i * 2.8;
    band.castShadow = true;
    lhGroup.add(band);
  }
  const lhGallery = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.55, 0.45, 14), darkWoodMat);
  lhGallery.position.y = 15.9;
  const lhLantern = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.7, 12), warmWinMat);
  lhLantern.position.y = 16.95;
  const lhCap = new THREE.Mesh(
    new THREE.ConeGeometry(1.45, 1.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xb73d36, roughness: 0.6 })
  );
  lhCap.position.y = 18.5;
  lhGroup.add(lhGallery, lhLantern, lhCap);

  // Rotating Golden Lighthouse Beam
  const lhBeamPivot = new THREE.Group();
  lhBeamPivot.position.y = 17.0;
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffdf99,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamCone = new THREE.Mesh(new THREE.ConeGeometry(3.8, 34, 14, 1, true), beamMat);
  beamCone.rotation.z = -Math.PI / 2;
  beamCone.position.x = 17;
  lhBeamPivot.add(beamCone);
  lhGroup.add(lhBeamPivot);
  group.add(lhGroup);
  colliders.push({ id: 'lighthouse', minX: lhX - 3.6, maxX: lhX + 3.6, minZ: lhZ - 3.6, maxZ: lhZ + 3.6 });

  // Fishing Harbour Wooden Dock (x: 106..120, z: 59..65)
  const dockDeck = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.24, 6.2), darkWoodMat);
  dockDeck.position.set(113.0, 0.16, 62.0);
  dockDeck.receiveShadow = true;
  group.add(dockDeck);
  for (const px of [106.5, 111.0, 115.5, 119.5]) {
    for (const pz of [59.3, 64.7]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.2, 8), darkWoodMat);
      piling.position.set(px, -0.3, pz);
      group.add(piling);
    }
  }
  // Harbour crates + warm lamp post
  for (let c = 0; c < 3; c++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.85), woodMat);
    crate.position.set(108.2 + c * 0.95, 0.64, 60.0);
    group.add(crate);
  }
  const harbourLampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 8), darkWoodMat);
  harbourLampPost.position.set(118.6, 2.0, 60.1);
  const harbourBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), warmWinMat);
  harbourBulb.position.set(118.6, 3.9, 60.1);
  group.add(harbourLampPost, harbourBulb);

  // Sovereign of the Tides Dedicated Timber Boarding Pier & Gangway (x: 103.5..123.0, z: 46.2..51.0)
  const sovPierDeck = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.26, 4.6), darkWoodMat);
  sovPierDeck.position.set(113.2, 0.23, 48.6);
  sovPierDeck.receiveShadow = true;
  group.add(sovPierDeck);
  const sovGangway = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 2.2), woodMat);
  sovGangway.position.set(123.2, 0.42, 48.6);
  sovGangway.rotation.z = 0.08;
  group.add(sovGangway);
  for (const px of [104.5, 108.5, 112.5, 116.5, 120.5, 122.4]) {
    for (const pz of [46.5, 50.7]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.5, 8), darkWoodMat);
      piling.position.set(px, -0.22, pz);
      group.add(piling);
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 8), woodMat);
      bollard.position.set(px, 0.72, pz);
      group.add(bollard);
    }
  }
  for (const lx of [106.0, 121.6]) {
    const lPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 8), darkWoodMat);
    lPost.position.set(lx, 1.95, 46.7);
    const lBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), warmWinMat);
    lBulb.position.set(lx, 3.68, 46.7);
    group.add(lPost, lBulb);
  }

  // Sovereign of the Tides Dedicated Timber Boarding Pier & Gangway (x: 103.5..123.0, z: 46.2..51.0)
  // Connects Kadalkarai sandy beach straight to the moored 3-masted historical ship!
  const sovPierDeck = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.26, 4.6), darkWoodMat);
  sovPierDeck.position.set(113.2, 0.23, 48.6);
  sovPierDeck.receiveShadow = true;
  group.add(sovPierDeck);
  // Plank accent runners + boarding gangway lip toward ship hull
  const sovGangway = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 2.2), woodMat);
  sovGangway.position.set(123.2, 0.42, 48.6);
  sovGangway.rotation.z = 0.08;
  group.add(sovGangway);
  for (const px of [104.5, 108.5, 112.5, 116.5, 120.5, 122.4]) {
    for (const pz of [46.5, 50.7]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.5, 8), darkWoodMat);
      piling.position.set(px, -0.22, pz);
      group.add(piling);
      // Mooring bollard posts rising cleanly above pier edge
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 8), woodMat);
      bollard.position.set(px, 0.72, pz);
      group.add(bollard);
    }
  }
  // Warm harbour lantern posts marking the Sovereign boarding pier clearly from shore
  for (const lx of [106.0, 121.6]) {
    const lPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 8), darkWoodMat);
    lPost.position.set(lx, 1.95, 46.7);
    const lBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), warmWinMat);
    lBulb.position.set(lx, 3.68, 46.7);
    group.add(lPost, lBulb);
  }

  // Moored Decorative Fishing Boats bobbing along harbour south side
  const mooredBoats: THREE.Group[] = [];
  for (let i = 0; i < 2; i++) {
    const mb = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.65, 1.55),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x3b6f94 : 0xc45e4b, roughness: 0.72 })
    );
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.15), plasterMat);
    cabin.position.set(-0.5, 0.65, 0);
    mb.add(hull, cabin);
    mb.position.set(118 + i * 6.5, WATER_LEVEL + 0.25, 74 + i * 5.2);
    mb.rotation.y = 0.25 - i * 0.4;
    group.add(mb);
    mooredBoats.push(mb);
  }

  // Coastal Village Cafés & Cottages (x: 88..98, z: 46..78)
  const coastalSpecs = [
    { x: 92, z: 50, w: 7.4, d: 5.2, h: 3.4, rot: 0.1, awning: 0x3f8ca3 },
    { x: 91, z: 68, w: 6.8, d: 5.0, h: 3.2, rot: -0.08, awning: 0xd97c54 },
    { x: 84, z: 77, w: 6.2, d: 4.8, h: 3.0, rot: 0.05, awning: 0x5d8d68 },
  ];
  coastalSpecs.forEach((c, idx) => {
    const gy = Math.max(0.2, groundHeightAt(c.x, c.z));
    const house = new THREE.Group();
    house.position.set(c.x, gy, c.z);
    house.rotation.y = c.rot;

    const body = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), plasterMat);
    body.position.y = c.h * 0.5;
    body.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(c.w, c.d) * 0.72, 1.8, 4), roofBlueMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = c.h + 0.85;
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 0.12), warmWinMat);
    win.position.set(0, 1.65, c.d * 0.5 + 0.04);
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(c.w * 0.85, 0.14, 1.45),
      new THREE.MeshStandardMaterial({ color: c.awning, roughness: 0.8 })
    );
    awning.position.set(0, 2.45, c.d * 0.5 + 0.7);
    awning.rotation.x = 0.25;
    house.add(body, roof, win, awning);
    group.add(house);
    colliders.push({
      id: `coast_house_${idx}`,
      minX: c.x - c.w * 0.52,
      maxX: c.x + c.w * 0.52,
      minZ: c.z - c.d * 0.52,
      maxZ: c.z + c.d * 0.52,
    });
  });

  // Sandy Beach Umbrellas & Driftwood Benches
  const umbrellaColors = [0xd95f52, 0x3b8ea5, 0xe8b04b];
  for (let i = 0; i < 3; i++) {
    const ux = 104.5 + (i % 2) * 1.8;
    const uz = 74 + i * 9.5;
    const uy = Math.max(0.05, groundHeightAt(ux, uz));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), woodMat);
    pole.position.set(ux, uy + 1.2, uz);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.7, 0.65, 10),
      new THREE.MeshStandardMaterial({ color: umbrellaColors[i], roughness: 0.78 })
    );
    canopy.position.set(ux, uy + 2.35, uz);
    group.add(pole, canopy);
  }
  const beachBenchY = Math.max(0.15, groundHeightAt(103.5, 54.0));
  const beachBench = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 2.1), woodMat);
  beachBench.position.set(103.5, beachBenchY + 0.28, 54.0);
  group.add(beachBench);
  interactables.push({
    id: 'coast_beach_bench',
    kind: 'bench',
    label: 'Sit Facing Kadalkarai Sea',
    sublabel: 'கடற்கரை · Listen to the ocean waves',
    x: 103.5,
    y: beachBenchY,
    z: 54.0,
    facingAngle: Math.PI * 0.5,
    radius: 2.6,
    locationId: 'coastal_town',
  });

  // =========================================================================
  // REGION 02: PANIMALAI SNOW PEAKS (பனிமலைச் சிகரம்)
  // =========================================================================
  // Crystalline Frozen Lake at (-102, -58)
  const frozenMat = new THREE.ShaderMaterial({
    uniforms: {
      uSkyColor: oceanUniforms.uSkyColor,
      uSunColor: oceanUniforms.uSunColor,
    },
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        // Subtle crystalline ice cracks
        float crack = smoothstep(0.95, 0.995, abs(sin(vWorldPos.x * 0.65 + sin(vWorldPos.z * 0.45) * 2.1)));
        vec3 iceBase = mix(vec3(0.68, 0.85, 0.94), vec3(0.88, 0.94, 0.98), smoothstep(0.35, 0.98, r));
        vec3 col = mix(iceBase, uSkyColor, 0.25);
        col = mix(col, vec3(0.98, 0.99, 1.0), crack * 0.6);
        col += uSunColor * 0.08;
        gl_FragColor = vec4(col, 0.92);
      }
    `,
  });
  const frozenLake = new THREE.Mesh(new THREE.CircleGeometry(20.5, 32), frozenMat);
  frozenLake.rotation.x = -Math.PI / 2;
  frozenLake.position.set(FROZEN_LAKE_CENTER.x, 2.95, FROZEN_LAKE_CENTER.z);
  group.add(frozenLake);

  // Alpine Snowy Crag Peaks around SNOW_PEAK_CENTER
  const peakSpecs = [
    { x: SNOW_PEAK_CENTER.x, z: SNOW_PEAK_CENTER.z, r: 22, h: 28 },
    { x: -134, z: -84, r: 17, h: 22 },
    { x: -94, z: -126, r: 19, h: 24 },
  ];
  for (const pk of peakSpecs) {
    const py = groundHeightAt(pk.x, pk.z);
    const crag = new THREE.Mesh(new THREE.ConeGeometry(pk.r, pk.h, 7), rockMat);
    crag.position.set(pk.x, py + pk.h * 0.34, pk.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(pk.r * 0.62, pk.h * 0.56, 7), snowMat);
    cap.position.set(pk.x, py + pk.h * 0.56, pk.z);
    group.add(crag, cap);
  }

  // Instanced Snow-Laden Alpine Pine Forest (~90 trees)
  const pineCount = 90;
  const pineTrunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.6, 6);
  const pineLowerGeo = new THREE.ConeGeometry(1.75, 4.0, 7);
  const pineSnowTopGeo = new THREE.ConeGeometry(1.38, 2.8, 7);
  const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, darkWoodMat, pineCount);
  const pineNeedles = new THREE.InstancedMesh(
    pineLowerGeo,
    new THREE.MeshStandardMaterial({ color: 0x2d4e3e, roughness: 0.9 }),
    pineCount
  );
  const pineSnowCaps = new THREE.InstancedMesh(pineSnowTopGeo, snowMat, pineCount);

  const dummy = new THREE.Object3D();
  let pineIdx = 0;
  for (let i = 0; i < 160 && pineIdx < pineCount; i++) {
    const rx = -62 - ((i * 53.7) % 86);
    const rz = -42 - ((i * 39.3) % 88);
    if (Math.hypot(rx - FROZEN_LAKE_CENTER.x, rz - FROZEN_LAKE_CENTER.z) < 23) continue;
    // Keep Panimalai Iceland Giant Plaza, Giant Igloo Man, AVS Snow Residence, Mirror Lake & all walkways wide open!
    if (Math.hypot(rx + 80, rz + 84) < 24) continue;
    if (isNearFrozenKingdomClearing(rx, rz)) continue;
    if (Math.hypot(rx - ICELAND_RETURN_GATE_POS.x, rz - ICELAND_RETURN_GATE_POS.z) < 9) continue;
    const py = groundHeightAt(rx, rz);
    const sc = 0.85 + ((i * 17) % 10) * 0.06;

    dummy.position.set(rx, py + 1.25 * sc, rz);
    dummy.scale.set(sc, sc, sc);
    dummy.rotation.y = i * 1.1;
    dummy.updateMatrix();
    pineTrunks.setMatrixAt(pineIdx, dummy.matrix);

    dummy.position.set(rx, py + 3.4 * sc, rz);
    dummy.updateMatrix();
    pineNeedles.setMatrixAt(pineIdx, dummy.matrix);

    dummy.position.set(rx, py + 5.1 * sc, rz);
    dummy.updateMatrix();
    pineSnowCaps.setMatrixAt(pineIdx, dummy.matrix);
    pineIdx++;
  }
  pineTrunks.count = pineIdx;
  pineNeedles.count = pineIdx;
  pineSnowCaps.count = pineIdx;
  group.add(pineTrunks, pineNeedles, pineSnowCaps);

  // Panimalai Iceland Winter Cabins spaced around the glacier plaza perimeter
  const smokePuffs: Array<{ mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }> = [];
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xeaf0f6,
    transparent: true,
    opacity: 0.45,
    roughness: 1,
  });
  const cabinSpecs = [
    { x: -97, z: -85, rot: 0.55 },
    { x: -91, z: -99, rot: 0.15 },
    { x: -61, z: -82, rot: -0.75 },
  ];
  cabinSpecs.forEach((cb, idx) => {
    const cy = groundHeightAt(cb.x, cb.z);
    const cab = new THREE.Group();
    cab.position.set(cb.x, cy, cb.z);
    cab.rotation.y = cb.rot;

    const wall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.0, 4.4), darkWoodMat);
    wall.position.y = 1.5;
    wall.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.2, 4), snowMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.05;
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.12), warmWinMat);
    win.position.set(0, 1.55, 2.22);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.0, 0.65), rockMat);
    chim.position.set(1.5, 4.2, -0.6);
    cab.add(wall, roof, win, chim);
    group.add(cab);

    colliders.push({
      id: `snow_cabin_${idx}`,
      minX: cb.x - 3.0,
      maxX: cb.x + 3.0,
      minZ: cb.z - 2.5,
      maxZ: cb.z + 2.5,
    });

    for (let s = 0; s < 3; s++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 7), smokeMat);
      group.add(puff);
      smokePuffs.push({
        mesh: puff,
        baseX: cb.x + Math.cos(cb.rot) * 1.5,
        baseY: cy + 5.3,
        baseZ: cb.z - Math.sin(cb.rot) * 1.5,
        phase: s * 0.33 + idx * 0.2,
      });
    }
  });

  // =========================================================================
  // COLOSSAL GIANT IGLOO MAN (18.0m tall sculpted friendly snow-igloo titan of Iceland!)
  // Mandatory Scale Hierarchy: Normal Player (1.68m) < Giant Igloo Man (18.0m) < Giant Player (23.5m)
  // =========================================================================
  const IGLOO_MAN_SCALE = GIANT_IGLOO_MAN_HEIGHT_M / 8.8;
  const iglooManGroup = new THREE.Group();
  const igX = GIANT_IGLOO_MAN_POS.x;
  const igZ = GIANT_IGLOO_MAN_POS.z;
  const igY = groundHeightAt(igX, igZ);
  iglooManGroup.position.set(igX, igY, igZ);
  iglooManGroup.scale.setScalar(IGLOO_MAN_SCALE);
  iglooManGroup.rotation.y = -0.52; // Faces southwest toward player arrival at (-90, -68)

  const iglooSnowMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    roughness: 0.78,
    metalness: 0.04,
  });
  const iglooBlockRingMat = new THREE.MeshStandardMaterial({
    color: 0xd4eafc,
    roughness: 0.62,
    metalness: 0.08,
  });
  const iglooIceCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x8ce2ff,
    emissive: new THREE.Color(0x3ec4ff),
    emissiveIntensity: 1.05,
    roughness: 0.16,
    metalness: 0.18,
    transparent: true,
    opacity: 0.88,
  });
  const iglooScarfMat = new THREE.MeshStandardMaterial({
    color: 0x246b9e,
    roughness: 0.82,
    metalness: 0.04,
  });
  const iglooEyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xe6ffff,
    emissive: new THREE.Color(0x46e6ff),
    emissiveIntensity: 2.3,
    roughness: 0.1,
  });
  const iglooSmileMat = new THREE.MeshStandardMaterial({
    color: 0x244c73,
    roughness: 0.55,
  });

  const iglooBodyRoot = new THREE.Group();
  iglooManGroup.add(iglooBodyRoot);

  // Massive snow-block igloo lower dome base (y: 0..3.6m, radius ~2.65m)
  const lowerDome = new THREE.Mesh(new THREE.SphereGeometry(2.65, 22, 16), iglooSnowMat);
  lowerDome.scale.set(1.06, 0.88, 1.02);
  lowerDome.position.y = 2.05;
  lowerDome.castShadow = true;
  lowerDome.receiveShadow = true;
  iglooBodyRoot.add(lowerDome);

  // Sculpted Igloo Ice-Block Horizontal Seam Rings around belly + miniature snow igloo entrance arch motif on belly!
  [1.2, 2.3, 3.35].forEach((ry, idx) => {
    const r = idx === 0 ? 2.66 : idx === 1 ? 2.58 : 2.15;
    const seam = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 8, 28), iglooBlockRingMat);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = ry;
    iglooBodyRoot.add(seam);
  });
  const bellyArch = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 10, 18, Math.PI), iglooBlockRingMat);
  bellyArch.position.set(0, 0.9, 2.52);
  iglooBodyRoot.add(bellyArch);

  // Rounded Snow Feet
  [-1.25, 1.25].forEach((fx) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10), iglooIceCrystalMat);
    foot.scale.set(1.0, 0.52, 1.35);
    foot.position.set(fx, 0.42, 0.6);
    iglooBodyRoot.add(foot);
  });

  // Upper Torso Snow Sphere (y: 3.6..6.4m)
  const midTorso = new THREE.Mesh(new THREE.SphereGeometry(2.05, 20, 16), iglooSnowMat);
  midTorso.scale.set(1.04, 0.94, 0.98);
  midTorso.position.y = 4.65;
  midTorso.castShadow = true;
  iglooBodyRoot.add(midTorso);

  // Glacial Blue Scarf & Flowing Tail around Giant Igloo Man's neck (y = 6.15m)
  const iglooScarf = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.34, 10, 24), iglooScarfMat);
  iglooScarf.rotation.x = Math.PI / 2;
  iglooScarf.position.y = 6.15;
  iglooBodyRoot.add(iglooScarf);
  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.75, 0.24), iglooScarfMat);
  scarfTail.position.set(1.15, 5.2, 1.32);
  scarfTail.rotation.z = 0.18;
  iglooBodyRoot.add(scarfTail);

  // Giant Ice Crystal Buttons on chest
  [4.15, 4.95, 5.65].forEach((by) => {
    const btn = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), iglooIceCrystalMat);
    btn.position.set(0, by, 1.98);
    iglooBodyRoot.add(btn);
  });

  // Articulated Giant Left & Right Snow Arms (Right arm waves warmly to Giant Player!)
  const iglooLeftArm = new THREE.Group();
  iglooLeftArm.position.set(-2.15, 5.25, 0);
  const lArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.85, 8, 12), iglooSnowMat);
  lArmMesh.position.set(-0.55, -0.75, 0.25);
  lArmMesh.rotation.z = -0.45;
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), iglooIceCrystalMat);
  lHand.position.set(-1.12, -1.65, 0.42);
  iglooLeftArm.add(lArmMesh, lHand);
  iglooBodyRoot.add(iglooLeftArm);

  const iglooRightArm = new THREE.Group();
  iglooRightArm.position.set(2.15, 5.25, 0);
  const rArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.85, 8, 12), iglooSnowMat);
  rArmMesh.position.set(0.55, -0.75, 0.25);
  rArmMesh.rotation.z = 0.45;
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), iglooIceCrystalMat);
  rHand.position.set(1.12, -1.65, 0.42);
  iglooRightArm.add(rArmMesh, rHand);
  iglooBodyRoot.add(iglooRightArm);

  // Friendly Sculpted Giant Head (top of head reaches ~8.8m!)
  const iglooHead = new THREE.Group();
  iglooHead.position.set(0, 7.25, 0);
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(1.38, 20, 16), iglooSnowMat);
  headSphere.castShadow = true;
  iglooHead.add(headSphere);

  // Expressive Glowing Cyan-Blue Eyes
  const iglooLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), iglooEyeGlowMat);
  iglooLeftEye.position.set(-0.46, 0.22, 1.24);
  const iglooRightEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), iglooEyeGlowMat);
  iglooRightEye.position.set(0.46, 0.22, 1.24);
  iglooHead.add(iglooLeftEye, iglooRightEye);

  // Translucent Ice Crystal Nose
  const crystalNose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 6), iglooIceCrystalMat);
  crystalNose.rotation.x = Math.PI / 2;
  crystalNose.position.set(0, -0.02, 1.56);
  iglooHead.add(crystalNose);

  // Warm Friendly Curved Smile (5 snow pebbles)
  [-0.5, -0.25, 0, 0.25, 0.5].forEach((sx, idx) => {
    const curveY = -0.36 - Math.cos((idx - 2) * 0.65) * 0.16;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), iglooSmileMat);
    dot.position.set(sx, curveY, 1.24 - Math.abs(sx) * 0.22);
    iglooHead.add(dot);
  });

  // Igloo Ice-Crystal Crown reaching 8.80m total height!
  const crownAngles = [-0.55, 0, 0.55, 1.15, -1.15];
  crownAngles.forEach((ang, idx) => {
    const spikeH = idx === 1 ? 0.92 : 0.68;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, spikeH, 5), iglooIceCrystalMat);
    spike.position.set(Math.sin(ang) * 0.82, 1.18 + (idx === 1 ? 0.14 : 0), Math.cos(ang) * 0.68);
    spike.rotation.z = -Math.sin(ang) * 0.28;
    iglooHead.add(spike);
  });
  iglooBodyRoot.add(iglooHead);

  // Orbiting Magical Snow Sparkles around Giant Igloo Man
  const iglooSparkles: THREE.Mesh[] = [];
  const sparkleGeo = new THREE.OctahedronGeometry(0.18, 0);
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Mesh(sparkleGeo, iglooIceCrystalMat);
    iglooManGroup.add(sp);
    iglooSparkles.push(sp);
  }
  group.add(iglooManGroup);

  colliders.push({
    id: 'giant_igloo_man_body',
    minX: igX - 5.6,
    maxX: igX + 5.6,
    minZ: igZ - 5.6,
    maxZ: igZ + 5.6,
  });

  interactables.push({
    id: 'greet_giant_igloo_man',
    kind: 'giant_igloo_man',
    label: `Greet Giant Igloo Man (${GIANT_IGLOO_MAN_HEIGHT_M.toFixed(1)}m)`,
    sublabel: 'பனி இக்லூ மனிதன் · Colossal friendly guardian of Panimalai Iceland',
    x: igX,
    y: igY,
    z: igZ,
    radius: 14.0,
    locationId: 'snow_mountains',
  });

  // Iceland Return Glacier Transfer Archway at (-64, -56) back to Iceland Express Halt!
  const retX = ICELAND_RETURN_GATE_POS.x;
  const retZ = ICELAND_RETURN_GATE_POS.z;
  const retY = groundHeightAt(retX, retZ);
  const retGate = new THREE.Group();
  retGate.position.set(retX, retY, retZ);
  retGate.rotation.y = 0.65;
  const retPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.6, 0.55), iglooIceCrystalMat);
  retPillarL.position.set(-2.2, 2.3, 0);
  const retPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.6, 0.55), iglooIceCrystalMat);
  retPillarR.position.set(2.2, 2.3, 0);
  const retLintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 0.7), iglooIceCrystalMat);
  retLintel.position.set(0, 4.65, 0);
  retGate.add(retPillarL, retPillarR, retLintel);
  group.add(retGate);

  interactables.push({
    id: 'iceland_return_to_halt',
    kind: 'iceland_return',
    label: 'Return to Iceland Express Halt',
    sublabel: 'ஐஸ்லாந்து ரயில் நிலையம் · Exit Iceland & restore normal scale',
    x: retX,
    y: retY,
    z: retZ,
    radius: 5.5,
    locationId: 'snow_mountains',
  });

  let iglooWaveTimer = 0;
  const triggerIglooManWave = () => {
    iglooWaveTimer = 4.5;
  };

  // =========================================================================
  // REGION 03: PACHAI VAYAL COUNTRYSIDE — RICE PADDIES & CASCADING WATERFALL
  // =========================================================================
  // Terraced Emerald Rice Paddies in (x: -10..26, z: 74..102)
  const paddyWaterMat = new THREE.MeshStandardMaterial({
    color: 0x5c967a,
    roughness: 0.18,
    metalness: 0.22,
  });
  for (let row = 0; row < 3; row++) {
    const px = 8 + row * 9.5;
    const pz = 88 + (row % 2) * 5.5;
    const py = groundHeightAt(px, pz);
    const berm = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.32, 11.4), darkWoodMat);
    berm.position.set(px, py + 0.08, pz);
    const paddy = new THREE.Mesh(new THREE.PlaneGeometry(8.1, 10.6), paddyWaterMat);
    paddy.rotation.x = -Math.PI / 2;
    paddy.position.set(px, py + 0.26, pz);
    group.add(berm, paddy);
  }

  // Mossy Waterfall Cliff & Animated Cascading Waterfall at WATERFALL_CENTER (-32, 112)
  const wfX = WATERFALL_CENTER.x;
  const wfZ = WATERFALL_CENTER.z;
  const wfBaseY = 0.25;

  const mossRockMat = new THREE.MeshStandardMaterial({ color: 0x546858, roughness: 0.94 });
  const cliffLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(7.6, 1), rockMat);
  cliffLeft.position.set(wfX - 10.6, wfBaseY + 6.4, wfZ + 8.8);
  cliffLeft.scale.set(1.0, 1.38, 0.85);
  const cliffRight = new THREE.Mesh(new THREE.DodecahedronGeometry(7.4, 1), rockMat);
  cliffRight.position.set(wfX + 10.6, wfBaseY + 6.1, wfZ + 8.6);
  cliffRight.scale.set(1.0, 1.32, 0.85);
  const cliffBack = new THREE.Mesh(new THREE.BoxGeometry(15.5, 15.2, 5.4), rockMat);
  cliffBack.position.set(wfX, wfBaseY + 7.2, wfZ + 9.6);
  const cliffCrest = new THREE.Mesh(new THREE.DodecahedronGeometry(6.8, 1), mossRockMat);
  cliffCrest.position.set(wfX, wfBaseY + 14.4, wfZ + 9.8);
  cliffCrest.scale.set(2.1, 0.42, 0.85);
  group.add(cliffLeft, cliffRight, cliffBack, cliffCrest);

  // Mossy framing boulders around the turquoise splash pool
  const poolBoulderSpecs = [
    { x: wfX - 8.2, z: wfZ + 0.8, r: 2.1 },
    { x: wfX + 8.4, z: wfZ + 0.2, r: 2.3 },
    { x: wfX - 6.8, z: wfZ - 5.2, r: 1.45 },
    { x: wfX + 7.1, z: wfZ - 4.8, r: 1.55 },
  ];
  for (const pb of poolBoulderSpecs) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(pb.r, 1), mossRockMat);
    rock.position.set(pb.x, wfBaseY + pb.r * 0.42, pb.z);
    rock.scale.set(1.2, 0.72, 1.0);
    group.add(rock);
  }

  const wfUniforms = {
    uTime: { value: 0 },
  };
  const waterfallMat = new THREE.ShaderMaterial({
    uniforms: wfUniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float flow = sin(vUv.x * 24.0 + sin(vUv.y * 10.0 + uTime * 5.0)) * 0.5 + 0.5;
        float streak = sin(vUv.x * 46.0) * 0.5 + 0.5;
        float cascade = fract(vUv.y * 3.0 + uTime * 1.45);
        vec3 aqua = vec3(0.45, 0.84, 0.94);
        vec3 foam = vec3(0.95, 0.99, 1.0);
        float whiteMix = smoothstep(0.35, 0.9, flow * 0.6 + streak * 0.4) * 0.65 + smoothstep(0.18, 0.0, vUv.y) * 0.55;
        vec3 col = mix(aqua, foam, clamp(whiteMix + (1.0 - cascade) * 0.15, 0.0, 1.0));
        float edgeFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        gl_FragColor = vec4(col, edgeFade * 0.92);
      }
    `,
  });
  const waterfallSheet = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 14.2, 8, 12), waterfallMat);
  waterfallSheet.position.set(wfX, wfBaseY + 7.1, wfZ + 5.8);
  waterfallSheet.rotation.y = Math.PI; // Faces north toward approaching player
  group.add(waterfallSheet);

  // Turquoise Waterfall Splash Pool + Foam Ring + Rising Mist Puffs
  const wfPool = new THREE.Mesh(
    new THREE.CircleGeometry(9.6, 28),
    new THREE.MeshStandardMaterial({ color: 0x3ba8bd, roughness: 0.14, metalness: 0.2 })
  );
  wfPool.rotation.x = -Math.PI / 2;
  wfPool.position.set(wfX, wfBaseY + 0.18, wfZ - 1.2);
  const wfFoam = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 20),
    new THREE.MeshStandardMaterial({
      color: 0xe6f8fc,
      transparent: true,
      opacity: 0.72,
      roughness: 0.4,
    })
  );
  wfFoam.rotation.x = -Math.PI / 2;
  wfFoam.position.set(wfX, wfBaseY + 0.22, wfZ + 3.4);
  group.add(wfPool, wfFoam);

  const mistPuffs: Array<{ mesh: THREE.Mesh; offset: number }> = [];
  for (let m = 0; m < 6; m++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.15, 8, 8), smokeMat);
    group.add(puff);
    mistPuffs.push({ mesh: puff, offset: m / 6 });
  }
  colliders.push({ id: 'waterfall_cliff', minX: wfX - 11, maxX: wfX + 11, minZ: wfZ + 3, maxZ: wfZ + 14 });

  // =========================================================================
  // REGION 04: NEELAM LAKE CAMPSITE (நீலம் ஏரி முகாம்)
  // =========================================================================
  const campX = CAMPSITE_CENTER.x;
  const campZ = CAMPSITE_CENTER.z;
  const campY = groundHeightAt(campX, campZ);

  const campGroup = new THREE.Group();
  campGroup.position.set(campX, campY, campZ);
  group.add(campGroup);

  // Pitchable Canvas Camping Tent
  const tentGroup = new THREE.Group();
  tentGroup.position.set(-2.6, 0, 1.5);
  tentGroup.rotation.y = 0.55;
  const tentBody = new THREE.Mesh(
    new THREE.ConeGeometry(2.15, 2.1, 4),
    new THREE.MeshStandardMaterial({ color: 0xe39b5d, roughness: 0.88 })
  );
  tentBody.rotation.y = Math.PI / 4;
  tentBody.position.y = 1.05;
  tentBody.castShadow = true;
  const tentDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x2b2530, roughness: 0.95, side: THREE.DoubleSide })
  );
  tentDoor.position.set(0, 0.68, 1.06);
  tentDoor.rotation.x = -0.35;
  const tentLantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), warmWinMat);
  tentLantern.position.set(1.25, 0.3, 1.3);
  tentGroup.add(tentBody, tentDoor, tentLantern);
  campGroup.add(tentGroup);

  // Folded Tent Roll (shown when tent is packed away)
  const packedRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xd98e52, roughness: 0.88 })
  );
  packedRoll.rotation.z = Math.PI / 2;
  packedRoll.position.set(-2.6, 0.28, 1.5);
  campGroup.add(packedRoll);

  // Stone-Ring Campfire + Logs + Flickering Flame + Embers + Dynamic Light
  const fireGroup = new THREE.Group();
  fireGroup.position.set(1.2, 0, -0.4);
  for (let s = 0; s < 10; s++) {
    const a = (s / 10) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), rockMat);
    stone.position.set(Math.cos(a) * 0.78, 0.14, Math.sin(a) * 0.78);
    fireGroup.add(stone);
  }
  for (let l = 0; l < 3; l++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.15, 6), darkWoodMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = l * (Math.PI / 3);
    log.position.y = 0.16;
    fireGroup.add(log);
  }

  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.05, 7),
    new THREE.MeshBasicMaterial({ color: 0xff6b24, transparent: true, opacity: 0.88 })
  );
  flameOuter.position.y = 0.56;
  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.72, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95 })
  );
  flameInner.position.y = 0.44;
  fireGroup.add(flameOuter, flameInner);

  const emberMeshes: THREE.Mesh[] = [];
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xffc65c });
  for (let e = 0; e < 8; e++) {
    const em = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 5), emberMat);
    fireGroup.add(em);
    emberMeshes.push(em);
  }

  const campfireLight = new THREE.PointLight(0xff8e3c, 0, 16, 1.6);
  campfireLight.position.set(0, 1.15, 0);
  fireGroup.add(campfireLight);
  campGroup.add(fireGroup);

  // Two Campfire Wooden Log Seats
  const logSeat1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.6, 8), woodMat);
  logSeat1.rotation.z = Math.PI / 2;
  logSeat1.position.set(1.2, 0.24, 1.9);
  const logSeat2 = logSeat1.clone();
  logSeat2.rotation.y = Math.PI * 0.42;
  logSeat2.position.set(3.2, 0.24, -0.3);
  campGroup.add(logSeat1, logSeat2);

  // Lakeside Wooden Cabin just west of campsite (x: 18, z: -13)
  const cabX = 18.5;
  const cabZ = -12.5;
  const cabY = groundHeightAt(cabX, cabZ);
  const lakeCabin = new THREE.Group();
  lakeCabin.position.set(cabX, cabY, cabZ);
  lakeCabin.rotation.y = 0.45;
  const lcBody = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 4.2), woodMat);
  lcBody.position.y = 1.5;
  const lcRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.9, 4), roofBlueMat);
  lcRoof.rotation.y = Math.PI / 4;
  lcRoof.position.y = 3.9;
  const lcWin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.12), warmWinMat);
  lcWin.position.set(0, 1.55, 2.12);
  lakeCabin.add(lcBody, lcRoof, lcWin);
  group.add(lakeCabin);
  colliders.push({ id: 'lake_cabin', minX: cabX - 2.9, maxX: cabX + 2.9, minZ: cabZ - 2.4, maxZ: cabZ + 2.4 });

  // Register Campsite Interactables
  interactables.push(
    {
      id: 'camp_tent_toggle',
      kind: 'camp_tent',
      label: 'Pitch / Pack Camping Tent',
      sublabel: 'நீலம் முகாம் · Lakeside shelter',
      x: campX - 2.4,
      y: campY,
      z: campZ + 1.8,
      radius: 2.9,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_fire_toggle',
      kind: 'camp_fire',
      label: 'Light / Extinguish Campfire',
      sublabel: 'நெருப்பு · Warm lakeside embers',
      x: campX + 1.2,
      y: campY,
      z: campZ - 0.4,
      radius: 2.8,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_cook_meal',
      kind: 'camp_cook',
      label: 'Cook Campfire Meal & Tea',
      sublabel: 'முகாம் சமையல் · Share with Frosty',
      x: campX + 2.5,
      y: campY,
      z: campZ - 1.5,
      radius: 2.7,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_sleep_stars',
      kind: 'camp_sleep',
      label: 'Camp Under Stars (Sleep to Sunrise)',
      sublabel: 'நட்சத்திர இரவு · Rest until 06:30',
      x: campX - 1.4,
      y: campY,
      z: campZ + 2.6,
      radius: 2.7,
      locationId: 'aomizu_lakeside',
    },
    {
      id: 'camp_log_seat',
      kind: 'bench',
      label: 'Sit Beside Campfire',
      sublabel: 'நீலம் முகாம் · Watch the flames & stars',
      x: campX + 1.2,
      y: campY,
      z: campZ + 1.9,
      facingAngle: Math.PI,
      radius: 2.4,
      locationId: 'aomizu_lakeside',
    }
  );

  // =========================================================================
  // PER-FRAME UPDATE (Ocean waves, Lighthouse beam, Smoke, Waterfall, Campfire)
  // =========================================================================
  const update = (
    time: number,
    dt: number,
    sunDir: THREE.Vector3,
    skyColor: THREE.Color,
    sunColor: THREE.Color,
    lanternStrength: number,
    camping: CampingState,
    playerX = 0,
    playerZ = 0
  ) => {
    oceanUniforms.uTime.value = time;
    oceanUniforms.uSunDir.value.copy(sunDir);
    oceanUniforms.uSkyColor.value.copy(skyColor);
    oceanUniforms.uSunColor.value.copy(sunColor);

    lhBeamPivot.rotation.y = time * 0.55;
    beamMat.opacity = 0.08 + lanternStrength * 0.36;
    warmWinMat.emissiveIntensity = 0.25 + lanternStrength * 1.4;

    mooredBoats.forEach((b, idx) => {
      b.position.y = WATER_LEVEL + 0.24 + Math.sin(time * 1.6 + idx * 1.9) * 0.08;
      b.rotation.z = Math.sin(time * 1.3 + idx) * 0.04;
    });

    // Gentle Giant Igloo Man breathing, blinking, sparkles & friendly wave toward the Giant Player!
    const distToIgloo = Math.hypot(playerX - igX, playerZ - igZ);
    const breathe = Math.sin(time * 1.35);
    iglooBodyRoot.position.y = breathe * 0.14;
    iglooBodyRoot.scale.set(1 + breathe * 0.015, 1 - breathe * 0.01, 1 + breathe * 0.015);
    iglooHead.rotation.y = Math.sin(time * 0.55) * 0.18;
    iglooHead.rotation.z = Math.sin(time * 0.72) * 0.05;

    const blink = (time % 4.6) > 4.46 ? 0.14 : 1.0;
    iglooLeftEye.scale.y = blink;
    iglooRightEye.scale.y = blink;
    iglooEyeGlowMat.emissiveIntensity = 1.8 + lanternStrength * 1.6;
    iglooIceCrystalMat.emissiveIntensity = 0.65 + lanternStrength * 1.1;

    if (iglooWaveTimer > 0) iglooWaveTimer = Math.max(0, iglooWaveTimer - dt);
    const waving = iglooWaveTimer > 0 || distToIgloo < 48;
    if (waving) {
      iglooRightArm.rotation.z = 2.05 + Math.sin(time * 5.2) * 0.35;
      iglooRightArm.rotation.x = -0.25;
      iglooLeftArm.rotation.z = -0.15 + Math.sin(time * 1.8) * 0.08;
    } else {
      iglooRightArm.rotation.z += (0.08 - iglooRightArm.rotation.z) * Math.min(1, dt * 3.5);
      iglooRightArm.rotation.x += (0 - iglooRightArm.rotation.x) * Math.min(1, dt * 3.5);
      iglooLeftArm.rotation.z = Math.sin(time * 1.2) * 0.06;
    }

    for (let i = 0; i < iglooSparkles.length; i++) {
      const a = time * 0.55 + i * ((Math.PI * 2) / iglooSparkles.length);
      const r = 3.2 + (i % 3) * 0.75;
      const yOff = 1.4 + ((time * 0.7 + i * 0.85) % 7.4);
      iglooSparkles[i].position.set(Math.cos(a) * r, yOff, Math.sin(a) * r);
      iglooSparkles[i].rotation.y = time * 1.8 + i;
      iglooSparkles[i].rotation.x = time * 1.2;
    }

    for (const p of smokePuffs) {
      const cycle = (time * 0.18 + p.phase) % 1;
      p.mesh.position.set(
        p.baseX + Math.sin(time * 0.7 + p.phase * 6) * 0.55 * cycle,
        p.baseY + cycle * 4.5,
        p.baseZ + cycle * 0.85
      );
      const sc = 0.55 + cycle * 1.35;
      p.mesh.scale.setScalar(sc);
    }

    wfUniforms.uTime.value = time;
    for (const m of mistPuffs) {
      const cycle = (time * 0.32 + m.offset) % 1;
      const angle = m.offset * Math.PI * 2;
      m.mesh.position.set(
        wfX + Math.cos(angle) * (1.8 + cycle * 2.4),
        wfBaseY + 0.6 + cycle * 2.6,
        wfZ + 3.2 - cycle * 2.2
      );
      m.mesh.scale.setScalar(0.6 + cycle * 1.1);
    }

    tentGroup.visible = camping.tentPitched;
    packedRoll.visible = !camping.tentPitched;
    if (camping.tentPitched) {
      tentGroup.scale.x = 1 + Math.sin(time * 1.7) * 0.012;
    }

    flameOuter.visible = camping.fireLit;
    flameInner.visible = camping.fireLit;
    if (camping.fireLit) {
      const flicker = 0.88 + Math.sin(time * 14.0) * 0.12 + Math.cos(time * 21.0) * 0.08;
      flameOuter.scale.set(0.95 + Math.sin(time * 11) * 0.08, flicker * 1.05, 0.95);
      flameInner.scale.set(0.9, flicker * 0.95, 0.9);
      campfireLight.intensity = (1.6 + lanternStrength * 1.4) * flicker;
      for (let i = 0; i < emberMeshes.length; i++) {
        const em = emberMeshes[i];
        em.visible = true;
        const t = (time * 0.65 + i * 0.13) % 1;
        const ang = i * 1.9 + time * 1.5;
        em.position.set(Math.cos(ang) * (0.18 + t * 0.35), 0.35 + t * 2.3, Math.sin(ang) * (0.18 + t * 0.35));
        em.scale.setScalar(Math.max(0.2, 1 - t));
      }
    } else {
      campfireLight.intensity = 0;
      for (const em of emberMeshes) em.visible = false;
    }
  };

  return {
    group,
    colliders,
    interactables,
    triggerIglooManWave,
    update,
    dispose: () => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    },
  };
}
