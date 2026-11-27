import * as THREE from 'three';

export interface ProceduralTextureSet {
  woodAlbedo: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  woodNormal: THREE.CanvasTexture;
  concretePlatform: THREE.CanvasTexture;
  concreteNormal: THREE.CanvasTexture;
  tactileStrip: THREE.CanvasTexture;
  gravelBallast: THREE.CanvasTexture;
  gravelNormal: THREE.CanvasTexture;
  roofTile: THREE.CanvasTexture;
  roofTileNormal: THREE.CanvasTexture;
  plasterWall: THREE.CanvasTexture;
  plasterNormal: THREE.CanvasTexture;
  groundDetailAlbedo: THREE.CanvasTexture;
  groundDetailNormal: THREE.CanvasTexture;
  groundDetailRoughness: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  clockFace: THREE.CanvasTexture;
  timetableBoard: THREE.CanvasTexture;
  vendingFront: THREE.CanvasTexture;
  createStationSign: (enName: string, jpName: string, prevName: string, nextName: string) => THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a true linear-space Tangent-Space Normal Map from any grayscale height canvas
 * using a seamless wrap-around Sobel filter for crisp PBR micro-relief lighting.
 */
function createNormalMapFromHeightCanvas(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext('2d')!;
  const src = hCtx.getImageData(0, 0, w, h).data;

  const [nCanvas, nCtx] = makeCanvas(w, h);
  const outImg = nCtx.createImageData(w, h);
  const dst = outImg.data;

  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  nCtx.putImageData(outImg, 0, 0);
  return finalizeTexture(nCanvas, maxAnisotropy, false, repeatX, repeatY);
}

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const created: THREE.CanvasTexture[] = [];
  const track = (t: THREE.CanvasTexture) => {
    created.push(t);
    return t;
  };

  // 1. High-Res 512x512 Weathered Japanese Cedar Wood Planks (Albedo + Bump + Tangent Normal)
  const [woodC, woodCtx] = makeCanvas(512, 512);
  const [woodBC, woodBCtx] = makeCanvas(512, 512);
  woodCtx.fillStyle = '#6c4d3a';
  woodCtx.fillRect(0, 0, 512, 512);
  woodBCtx.fillStyle = '#828282';
  woodBCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    const y = i * 64;
    const tone = 86 + ((i * 23) % 28);
    const plankGrad = woodCtx.createLinearGradient(0, y, 0, y + 60);
    plankGrad.addColorStop(0, `rgb(${tone + 26}, ${tone + 1}, ${tone - 16})`);
    plankGrad.addColorStop(0.5, `rgb(${tone + 16}, ${tone - 8}, ${tone - 24})`);
    plankGrad.addColorStop(1, `rgb(${tone + 6}, ${tone - 16}, ${tone - 30})`);
    woodCtx.fillStyle = plankGrad;
    woodCtx.fillRect(0, y, 512, 60);
    // Crisp dark bevel groove
    woodCtx.fillStyle = 'rgba(22, 13, 8, 0.65)';
    woodCtx.fillRect(0, y + 60, 512, 4);
    woodBCtx.fillStyle = '#181818';
    woodBCtx.fillRect(0, y + 60, 512, 4);
    woodBCtx.fillStyle = '#a4a4a4';
    woodBCtx.fillRect(0, y + 1, 512, 2);

    // Fine organic wood fibers & occasional subtle cedar knot
    for (let g = 0; g < 38; g++) {
      const gy = y + 3 + ((g * 11) % 54);
      woodCtx.fillStyle = g % 2 === 0 ? 'rgba(255,234,205,0.08)' : 'rgba(24,14,9,0.14)';
      woodCtx.fillRect(0, gy, 512, 1.4);
      woodBCtx.fillStyle = g % 2 === 0 ? '#989898' : '#6c6c6c';
      woodBCtx.fillRect(0, gy, 512, 1.4);
    }
    const knotX = ((i * 157 + 64) % 420) + 46;
    const knotY = y + 22 + ((i * 19) % 18);
    woodCtx.fillStyle = 'rgba(38, 22, 14, 0.32)';
    woodCtx.beginPath();
    woodCtx.ellipse(knotX, knotY, 14, 6, 0.08, 0, Math.PI * 2);
    woodCtx.fill();
    woodBCtx.fillStyle = '#4f4f4f';
    woodBCtx.beginPath();
    woodBCtx.ellipse(knotX, knotY, 12, 5, 0.08, 0, Math.PI * 2);
    woodBCtx.fill();
  }
  const woodAlbedo = track(finalizeTexture(woodC, maxAniso, true, 2, 2));
  const woodBump = track(finalizeTexture(woodBC, maxAniso, false, 2, 2));
  const woodNormal = track(createNormalMapFromHeightCanvas(woodBC, 2.2, maxAniso, 2, 2));

  // 2. High-Res 512x512 Architectural Concrete Platform Paving (Albedo + Tangent Normal)
  const [concC, concCtx] = makeCanvas(512, 512);
  const [concH, concHCtx] = makeCanvas(512, 512);
  concCtx.fillStyle = '#9f9a98';
  concCtx.fillRect(0, 0, 512, 512);
  concHCtx.fillStyle = '#8c8c8c';
  concHCtx.fillRect(0, 0, 512, 512);
  // Subtle slab-to-slab tonal richness
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const delta = (((row * 7 + col * 13) % 5) - 2) * 4;
      concCtx.fillStyle = `rgb(${158 + delta}, ${153 + delta}, ${151 + delta})`;
      concCtx.fillRect(col * 128 + 3, row * 128 + 3, 122, 122);
    }
  }
  for (let i = 0; i < 4200; i++) {
    const px = (i * 137 + (i % 13) * 17) % 512;
    const py = (i * 223 + (i % 11) * 19) % 512;
    const bright = i % 2 === 0;
    concCtx.fillStyle = bright ? 'rgba(255,250,245,0.075)' : 'rgba(35,32,42,0.085)';
    concCtx.fillRect(px, py, 3, 3);
    concHCtx.fillStyle = bright ? '#9d9d9d' : '#767676';
    concHCtx.fillRect(px, py, 3, 3);
  }
  concCtx.strokeStyle = 'rgba(42,38,48,0.34)';
  concCtx.lineWidth = 3;
  concHCtx.strokeStyle = '#282828';
  concHCtx.lineWidth = 4;
  for (let p = 0; p <= 512; p += 128) {
    concCtx.beginPath();
    concCtx.moveTo(p, 0);
    concCtx.lineTo(p, 512);
    concCtx.stroke();
    concCtx.beginPath();
    concCtx.moveTo(0, p);
    concCtx.lineTo(512, p);
    concCtx.stroke();

    concHCtx.beginPath();
    concHCtx.moveTo(p, 0);
    concHCtx.lineTo(p, 512);
    concHCtx.stroke();
    concHCtx.beginPath();
    concHCtx.moveTo(0, p);
    concHCtx.lineTo(512, p);
    concHCtx.stroke();
  }
  const concretePlatform = track(finalizeTexture(concC, maxAniso, true, 6, 2));
  const concreteNormal = track(createNormalMapFromHeightCanvas(concH, 1.8, maxAniso, 6, 2));

  // 3. Crisp 256x256 Yellow Tactile Platform Strip (Tenji Block)
  const [tacC, tacCtx] = makeCanvas(256, 256);
  tacCtx.fillStyle = '#e7bb34';
  tacCtx.fillRect(0, 0, 256, 256);
  for (let y = 24; y < 256; y += 48) {
    for (let x = 24; x < 256; x += 48) {
      tacCtx.fillStyle = 'rgba(130, 88, 8, 0.45)';
      tacCtx.beginPath();
      tacCtx.arc(x + 2, y + 3, 10, 0, Math.PI * 2);
      tacCtx.fill();
      tacCtx.fillStyle = '#f8d558';
      tacCtx.beginPath();
      tacCtx.arc(x, y, 9.5, 0, Math.PI * 2);
      tacCtx.fill();
      tacCtx.fillStyle = '#d3a21d';
      tacCtx.beginPath();
      tacCtx.arc(x, y, 7, 0, Math.PI * 2);
      tacCtx.fill();
    }
  }
  const tactileStrip = track(finalizeTexture(tacC, maxAniso, true, 22, 1));

  // 4. High-Res 512x512 Crushed Granite Railway Gravel Ballast (Albedo + Normal)
  const [gravC, gravCtx] = makeCanvas(512, 512);
  const [gravH, gravHCtx] = makeCanvas(512, 512);
  gravCtx.fillStyle = '#534e51';
  gravCtx.fillRect(0, 0, 512, 512);
  gravHCtx.fillStyle = '#484848';
  gravHCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6400; i++) {
    const px = (i * 197 + (i % 13) * 29) % 512;
    const py = (i * 107 + (i % 17) * 31) % 512;
    const wStone = 4 + (i % 6);
    const hStone = 3 + ((i * 3) % 5);
    const v = 64 + ((i * 37) % 86);
    gravCtx.fillStyle = `rgb(${v + 6}, ${v + 1}, ${v + 3})`;
    gravCtx.fillRect(px, py, wStone, hStone);
    const hv = Math.min(255, Math.max(40, v + 52));
    gravHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    gravHCtx.fillRect(px, py, wStone, hStone);
  }
  const gravelBallast = track(finalizeTexture(gravC, maxAniso, true, 1, 24));
  const gravelNormal = track(createNormalMapFromHeightCanvas(gravH, 3.0, maxAniso, 1, 24));

  // 5. High-Res 512x512 Glazed Japanese Kawara Roof Tile (Albedo + Normal)
  const [roofC, roofCtx] = makeCanvas(512, 512);
  const [roofH, roofHCtx] = makeCanvas(512, 512);
  roofCtx.fillStyle = '#2d3144';
  roofCtx.fillRect(0, 0, 512, 512);
  roofHCtx.fillStyle = '#555555';
  roofHCtx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    const rowGrad = roofCtx.createLinearGradient(0, y, 0, y + 60);
    rowGrad.addColorStop(0, row % 2 === 0 ? '#434963' : '#3a4058');
    rowGrad.addColorStop(0.7, '#2d3145');
    rowGrad.addColorStop(1, '#1d2030');
    roofCtx.fillStyle = rowGrad;
    roofCtx.fillRect(0, y, 512, 58);
    roofCtx.fillStyle = 'rgba(10, 12, 22, 0.7)';
    roofCtx.fillRect(0, y + 57, 512, 7);

    const hGrad = roofHCtx.createLinearGradient(0, y, 0, y + 64);
    hGrad.addColorStop(0, '#c8c8c8');
    hGrad.addColorStop(0.82, '#7c7c7c');
    hGrad.addColorStop(1, '#202020');
    roofHCtx.fillStyle = hGrad;
    roofHCtx.fillRect(0, y, 512, 64);

    for (let col = 0; col < 8; col++) {
      const x = col * 64;
      const ridgeGrad = roofCtx.createLinearGradient(x, y, x + 64, y);
      ridgeGrad.addColorStop(0, 'rgba(12, 14, 24, 0.45)');
      ridgeGrad.addColorStop(0.28, 'rgba(215, 226, 248, 0.14)');
      ridgeGrad.addColorStop(0.65, 'rgba(20, 24, 38, 0.12)');
      ridgeGrad.addColorStop(1, 'rgba(10, 12, 20, 0.5)');
      roofCtx.fillStyle = ridgeGrad;
      roofCtx.fillRect(x, y, 64, 58);

      roofHCtx.fillStyle = '#e0e0e0';
      roofHCtx.fillRect(x + 12, y + 2, 16, 54);
      roofHCtx.fillStyle = '#262626';
      roofHCtx.fillRect(x, y, 5, 64);
    }
  }
  const roofTile = track(finalizeTexture(roofC, maxAniso, true, 4, 2));
  const roofTileNormal = track(createNormalMapFromHeightCanvas(roofH, 2.5, maxAniso, 4, 2));

  // 6. High-Res 512x512 Warm Artisan Shikkui Plaster Wall (Albedo + Normal)
  const [plasC, plasCtx] = makeCanvas(512, 512);
  const [plasH, plasHCtx] = makeCanvas(512, 512);
  plasCtx.fillStyle = '#ebe3d8';
  plasCtx.fillRect(0, 0, 512, 512);
  plasHCtx.fillStyle = '#808080';
  plasHCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const px = (i * 113 + (i % 7) * 19) % 512;
    const py = (i * 197 + (i % 11) * 13) % 512;
    const light = i % 2 === 0;
    plasCtx.fillStyle = light ? 'rgba(255,255,255,0.09)' : 'rgba(115,94,78,0.065)';
    plasCtx.fillRect(px, py, 10, 5);
    plasHCtx.fillStyle = light ? '#949494' : '#6d6d6d';
    plasHCtx.fillRect(px, py, 10, 5);
  }
  const plasterWall = track(finalizeTexture(plasC, maxAniso, true, 2, 2));
  const plasterNormal = track(createNormalMapFromHeightCanvas(plasH, 1.15, maxAniso, 2, 2));

  // 7. Seamless 512x512 Organic Ground Micro-Detail PBR Texture Set (Albedo + Normal + Roughness)
  // Multiplies cleanly with terrain vertex colors so meadows, beaches, snow, and dunes look rich & tactile up close!
  const [gndC, gndCtx] = makeCanvas(512, 512);
  const [gndH, gndHCtx] = makeCanvas(512, 512);
  const [gndR, gndRCtx] = makeCanvas(512, 512);
  gndCtx.fillStyle = '#ededed';
  gndCtx.fillRect(0, 0, 512, 512);
  gndHCtx.fillStyle = '#808080';
  gndHCtx.fillRect(0, 0, 512, 512);
  gndRCtx.fillStyle = '#e0e0e0';
  gndRCtx.fillRect(0, 0, 512, 512);
  // Soft organic soil/turf patches
  for (let i = 0; i < 420; i++) {
    const px = (i * 151 + (i % 19) * 23) % 512;
    const py = (i * 239 + (i % 17) * 29) % 512;
    const r = 10 + (i % 24);
    const bright = i % 2 === 0;
    gndCtx.fillStyle = bright ? 'rgba(255,255,255,0.09)' : 'rgba(130,124,114,0.11)';
    gndCtx.beginPath();
    gndCtx.arc(px, py, r, 0, Math.PI * 2);
    gndCtx.fill();

    gndHCtx.fillStyle = bright ? 'rgba(165,165,165,0.22)' : 'rgba(95,95,95,0.22)';
    gndHCtx.beginPath();
    gndHCtx.arc(px, py, r, 0, Math.PI * 2);
    gndHCtx.fill();

    gndRCtx.fillStyle = bright ? 'rgba(205,205,205,0.35)' : 'rgba(242,242,242,0.35)';
    gndRCtx.beginPath();
    gndRCtx.arc(px, py, r, 0, Math.PI * 2);
    gndRCtx.fill();
  }
  // Fine tactile blades, pebbles & soil grain
  for (let i = 0; i < 7200; i++) {
    const px = (i * 173 + (i % 23) * 11) % 512;
    const py = (i * 263 + (i % 29) * 7) % 512;
    const v = 216 + ((i * 29) % 40);
    gndCtx.fillStyle = `rgb(${v},${v},${v - 3})`;
    gndCtx.fillRect(px, py, 2 + (i % 3), 2 + ((i + 1) % 3));
    const hv = 96 + ((i * 43) % 72);
    gndHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    gndHCtx.fillRect(px, py, 2 + (i % 3), 2);
  }
  const groundDetailAlbedo = track(finalizeTexture(gndC, maxAniso, true, 68, 68));
  const groundDetailNormal = track(createNormalMapFromHeightCanvas(gndH, 1.55, maxAniso, 68, 68));
  const groundDetailRoughness = track(finalizeTexture(gndR, maxAniso, false, 68, 68));

  // 8. Soft Radial Contact Shadow Disc
  const [shadC, shadCtx] = makeCanvas(128, 128);
  const grad = shadCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(12, 8, 22, 0.68)');
  grad.addColorStop(0.55, 'rgba(12, 8, 22, 0.30)');
  grad.addColorStop(1, 'rgba(12, 8, 22, 0.0)');
  shadCtx.fillStyle = grad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadow = track(finalizeTexture(shadC, maxAniso, true, 1, 1));
  contactShadow.wrapS = THREE.ClampToEdgeWrapping;
  contactShadow.wrapT = THREE.ClampToEdgeWrapping;

  // 9. Crisp 512x512 Station Analog Clock Face
  const [clkC, clkCtx] = makeCanvas(512, 512);
  const dialGrad = clkCtx.createRadialGradient(256, 256, 30, 256, 256, 240);
  dialGrad.addColorStop(0, '#fcfaf2');
  dialGrad.addColorStop(1, '#ede5d4');
  clkCtx.fillStyle = dialGrad;
  clkCtx.beginPath();
  clkCtx.arc(256, 256, 240, 0, Math.PI * 2);
  clkCtx.fill();
  clkCtx.strokeStyle = '#262332';
  clkCtx.lineWidth = 18;
  clkCtx.stroke();
  for (let i = 0; i < 60; i++) {
    const ang = (i / 60) * Math.PI * 2;
    const isHour = i % 5 === 0;
    const isQuarter = i % 15 === 0;
    const r1 = isQuarter ? 172 : isHour ? 188 : 206;
    const r2 = 218;
    clkCtx.strokeStyle = isHour ? '#1f1c29' : 'rgba(40,36,52,0.45)';
    clkCtx.lineWidth = isQuarter ? 12 : isHour ? 7 : 3;
    clkCtx.beginPath();
    clkCtx.moveTo(256 + Math.sin(ang) * r1, 256 - Math.cos(ang) * r1);
    clkCtx.lineTo(256 + Math.sin(ang) * r2, 256 - Math.cos(ang) * r2);
    clkCtx.stroke();
  }
  clkCtx.fillStyle = '#b94848';
  clkCtx.beginPath();
  clkCtx.arc(256, 256, 13, 0, Math.PI * 2);
  clkCtx.fill();
  const clockFace = track(finalizeTexture(clkC, maxAniso, true, 1, 1));
  clockFace.wrapS = THREE.ClampToEdgeWrapping;
  clockFace.wrapT = THREE.ClampToEdgeWrapping;

  // 10. High-Res Station Timetable Board Texture (1024x640)
  const [ttC, ttCtx] = makeCanvas(1024, 640);
  ttCtx.fillStyle = '#f8f3e8';
  ttCtx.fillRect(0, 0, 1024, 640);
  ttCtx.fillStyle = '#253552';
  ttCtx.fillRect(0, 0, 1024, 124);
  ttCtx.fillStyle = '#f8f4ec';
  ttCtx.font = 'bold 44px "Noto Serif Tamil", serif';
  ttCtx.fillText('கால அட்டவணை  DREAMLINE', 48, 82);
  ttCtx.fillStyle = '#332d3d';
  ttCtx.font = '34px monospace';
  const rows = [
    '06:30  Local   Neelam Eri -> Thendral Malai',
    '12:15  Local   Valley Loop (All Stops)',
    '16:40  Sunset  Golden Hour Scenic Service',
    '17:45  Local   Shavish Jeshurun Sa -> Neelam',
    '19:20  Night   Twilight Lantern Local',
    '21:30  Last    Starlight Rural Express',
  ];
  rows.forEach((line, idx) => {
    const y = 208 + idx * 68;
    if (idx % 2 === 1) {
      ttCtx.fillStyle = 'rgba(44, 61, 89, 0.08)';
      ttCtx.fillRect(32, y - 44, 960, 60);
    }
    ttCtx.fillStyle = idx === 3 ? '#b5463b' : '#2a2736';
    ttCtx.fillText(line, 48, y);
  });
  const timetableBoard = track(finalizeTexture(ttC, maxAniso, true, 1, 1));
  timetableBoard.wrapS = THREE.ClampToEdgeWrapping;
  timetableBoard.wrapT = THREE.ClampToEdgeWrapping;

  // 11. High-Res Retro Vending Machine Front (512x1024)
  const [vmC, vmCtx] = makeCanvas(512, 1024);
  vmCtx.fillStyle = '#ebe6dc';
  vmCtx.fillRect(0, 0, 512, 1024);
  vmCtx.fillStyle = '#fff6df';
  vmCtx.fillRect(36, 44, 440, 460);
  vmCtx.strokeStyle = '#3a3540';
  vmCtx.lineWidth = 8;
  vmCtx.strokeRect(36, 44, 440, 460);
  const canColors = ['#e05a47', '#f0a848', '#5ba36d', '#4f82b8', '#e68ea4', '#7a5842'];
  for (let r = 0; r < 3; r++) {
    const ry = 84 + r * 140;
    vmCtx.fillStyle = '#d4ccb8';
    vmCtx.fillRect(48, ry + 84, 416, 20);
    for (let c = 0; c < 6; c++) {
      vmCtx.fillStyle = canColors[(r * 2 + c) % canColors.length];
      vmCtx.fillRect(64 + c * 66, ry + 12, 44, 68);
      vmCtx.fillStyle = 'rgba(255,255,255,0.28)';
      vmCtx.fillRect(72 + c * 66, ry + 16, 10, 60);
      vmCtx.fillStyle = r === 2 ? '#d6453a' : '#2b6cb0';
      vmCtx.fillRect(60 + c * 66, ry + 88, 52, 12);
    }
  }
  vmCtx.fillStyle = '#c4463e';
  vmCtx.fillRect(0, 540, 512, 104);
  vmCtx.fillStyle = '#ffffff';
  vmCtx.font = 'bold 38px "Noto Sans Tamil", sans-serif';
  vmCtx.fillText('DRINKS · பானங்கள்', 68, 608);
  vmCtx.fillStyle = '#26242d';
  vmCtx.fillRect(72, 736, 368, 184);
  const vendingFront = track(finalizeTexture(vmC, maxAniso, true, 1, 1));
  vendingFront.wrapS = THREE.ClampToEdgeWrapping;
  vendingFront.wrapT = THREE.ClampToEdgeWrapping;

  // 12. Crisp 1024x512 Station Signboards
  const createStationSign = (
    enName: string,
    tamilName: string,
    prevName: string,
    nextName: string
  ) => {
    const [c, ctx] = makeCanvas(1024, 512);
    ctx.fillStyle = '#faf7f0';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = '#283246';
    ctx.lineWidth = 20;
    ctx.strokeRect(20, 20, 984, 472);
    ctx.fillStyle = '#4367a3';
    ctx.fillRect(28, 348, 968, 48);
    ctx.fillStyle = '#d87a5e';
    ctx.fillRect(380, 348, 264, 48);
    ctx.fillStyle = '#1b202e';
    ctx.textAlign = 'center';
    const tamilFontPx = tamilName.length > 14 ? 56 : tamilName.length > 10 ? 68 : 80;
    ctx.font = `bold ${tamilFontPx}px "Noto Serif Tamil", serif`;
    ctx.fillText(tamilName, 512, 188, 928);
    ctx.font = '600 48px sans-serif';
    ctx.fillStyle = '#383f52';
    ctx.fillText(enName, 512, 296, 920);
    ctx.font = '36px sans-serif';
    ctx.fillStyle = '#292e3d';
    ctx.textAlign = 'left';
    ctx.fillText(`◀ ${prevName}`, 56, 456);
    ctx.textAlign = 'right';
    ctx.fillText(`${nextName} ▶`, 968, 456);

    const tex = track(finalizeTexture(c, maxAniso, true, 1, 1));
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  };

  return {
    woodAlbedo,
    woodBump,
    woodNormal,
    concretePlatform,
    concreteNormal,
    tactileStrip,
    gravelBallast,
    gravelNormal,
    roofTile,
    roofTileNormal,
    plasterWall,
    plasterNormal,
    groundDetailAlbedo,
    groundDetailNormal,
    groundDetailRoughness,
    contactShadow,
    clockFace,
    timetableBoard,
    vendingFront,
    createStationSign,
    dispose: () => {
      created.forEach((t) => t.dispose());
    },
  };
}
