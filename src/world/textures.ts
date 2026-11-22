import * as THREE from 'three';

export interface ProceduralTextureSet {
  woodAlbedo: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  concretePlatform: THREE.CanvasTexture;
  tactileStrip: THREE.CanvasTexture;
  gravelBallast: THREE.CanvasTexture;
  roofTile: THREE.CanvasTexture;
  plasterWall: THREE.CanvasTexture;
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

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const created: THREE.CanvasTexture[] = [];
  const track = (t: THREE.CanvasTexture) => {
    created.push(t);
    return t;
  };

  // 1. Weathered Japanese Cedar Wood Planks (Albedo + Bump)
  const [woodC, woodCtx] = makeCanvas(256, 256);
  woodCtx.fillStyle = '#6c4d3a';
  woodCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    const y = i * 32;
    const tone = 88 + ((i * 19) % 24);
    woodCtx.fillStyle = `rgb(${tone + 18}, ${tone - 6}, ${tone - 22})`;
    woodCtx.fillRect(0, y, 256, 30);
    woodCtx.fillStyle = 'rgba(28, 18, 12, 0.45)';
    woodCtx.fillRect(0, y + 30, 256, 2);
    // Fine grain lines
    for (let g = 0; g < 18; g++) {
      woodCtx.fillStyle = g % 2 === 0 ? 'rgba(255,230,200,0.07)' : 'rgba(25,15,10,0.12)';
      woodCtx.fillRect(0, y + ((g * 7) % 29), 256, 1.5);
    }
  }
  const woodAlbedo = track(finalizeTexture(woodC, maxAniso, true, 2, 2));

  const [woodBC, woodBCtx] = makeCanvas(256, 256);
  woodBCtx.fillStyle = '#808080';
  woodBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    const y = i * 32;
    woodBCtx.fillStyle = '#202020';
    woodBCtx.fillRect(0, y + 30, 256, 2);
    for (let g = 0; g < 14; g++) {
      woodBCtx.fillStyle = g % 2 === 0 ? '#989898' : '#686868';
      woodBCtx.fillRect(0, y + ((g * 5) % 29), 256, 1);
    }
  }
  const woodBump = track(finalizeTexture(woodBC, maxAniso, false, 2, 2));

  // 2. Concrete Platform Paving
  const [concC, concCtx] = makeCanvas(256, 256);
  concCtx.fillStyle = '#9b9694';
  concCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const px = (i * 73) % 256;
    const py = (i * 139) % 256;
    concCtx.fillStyle = i % 2 === 0 ? 'rgba(255,250,245,0.06)' : 'rgba(40,35,45,0.07)';
    concCtx.fillRect(px, py, 3, 3);
  }
  concCtx.strokeStyle = 'rgba(55,50,58,0.22)';
  concCtx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 64) {
    concCtx.beginPath();
    concCtx.moveTo(x, 0);
    concCtx.lineTo(x, 256);
    concCtx.stroke();
  }
  for (let y = 0; y <= 256; y += 64) {
    concCtx.beginPath();
    concCtx.moveTo(0, y);
    concCtx.lineTo(256, y);
    concCtx.stroke();
  }
  const concretePlatform = track(finalizeTexture(concC, maxAniso, true, 6, 2));

  // 3. Japanese Yellow Tactile Platform Strip (Tenji Block)
  const [tacC, tacCtx] = makeCanvas(128, 128);
  tacCtx.fillStyle = '#e5b832';
  tacCtx.fillRect(0, 0, 128, 128);
  tacCtx.fillStyle = '#c4961a';
  for (let y = 12; y < 128; y += 24) {
    for (let x = 12; x < 128; x += 24) {
      tacCtx.beginPath();
      tacCtx.arc(x, y, 5, 0, Math.PI * 2);
      tacCtx.fill();
    }
  }
  const tactileStrip = track(finalizeTexture(tacC, maxAniso, true, 22, 1));

  // 4. Railway Gravel Ballast
  const [gravC, gravCtx] = makeCanvas(256, 256);
  gravCtx.fillStyle = '#5e585a';
  gravCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const px = (i * 97 + (i % 7) * 13) % 256;
    const py = (i * 53 + (i % 11) * 19) % 256;
    const v = 68 + ((i * 29) % 64);
    gravCtx.fillStyle = `rgb(${v + 4}, ${v}, ${v + 2})`;
    gravCtx.fillRect(px, py, 3 + (i % 3), 2 + (i % 3));
  }
  const gravelBallast = track(finalizeTexture(gravC, maxAniso, true, 1, 24));

  // 5. Japanese Kawara Roof Tile
  const [roofC, roofCtx] = makeCanvas(256, 256);
  roofCtx.fillStyle = '#333647';
  roofCtx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) {
    const y = row * 32;
    roofCtx.fillStyle = row % 2 === 0 ? '#3a3e52' : '#313548';
    roofCtx.fillRect(0, y, 256, 28);
    roofCtx.fillStyle = 'rgba(12, 14, 24, 0.55)';
    roofCtx.fillRect(0, y + 27, 256, 5);
    for (let col = 0; col < 8; col++) {
      const x = col * 32;
      roofCtx.fillStyle = 'rgba(200, 210, 235, 0.08)';
      roofCtx.fillRect(x + 4, y + 2, 10, 24);
      roofCtx.fillStyle = 'rgba(15, 16, 26, 0.35)';
      roofCtx.fillRect(x, y, 3, 32);
    }
  }
  const roofTile = track(finalizeTexture(roofC, maxAniso, true, 4, 2));

  // 6. Warm Japanese Shikkui Plaster Wall
  const [plasC, plasCtx] = makeCanvas(256, 256);
  plasCtx.fillStyle = '#e7dfd3';
  plasCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const px = (i * 61) % 256;
    const py = (i * 113) % 256;
    plasCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(120,100,85,0.05)';
    plasCtx.fillRect(px, py, 6, 4);
  }
  const plasterWall = track(finalizeTexture(plasC, maxAniso, true, 2, 2));

  // 7. Soft Radial Contact Shadow Disc
  const [shadC, shadCtx] = makeCanvas(128, 128);
  const grad = shadCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(12, 8, 22, 0.65)');
  grad.addColorStop(0.55, 'rgba(12, 8, 22, 0.28)');
  grad.addColorStop(1, 'rgba(12, 8, 22, 0.0)');
  shadCtx.fillStyle = grad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadow = track(finalizeTexture(shadC, maxAniso, true, 1, 1));
  contactShadow.wrapS = THREE.ClampToEdgeWrapping;
  contactShadow.wrapT = THREE.ClampToEdgeWrapping;

  // 8. Station Analog Clock Face
  const [clkC, clkCtx] = makeCanvas(256, 256);
  clkCtx.fillStyle = '#f8f4ea';
  clkCtx.beginPath();
  clkCtx.arc(128, 128, 120, 0, Math.PI * 2);
  clkCtx.fill();
  clkCtx.strokeStyle = '#2d2936';
  clkCtx.lineWidth = 10;
  clkCtx.stroke();
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 86 : 96;
    const r2 = 108;
    clkCtx.strokeStyle = '#24202e';
    clkCtx.lineWidth = i % 3 === 0 ? 6 : 3;
    clkCtx.beginPath();
    clkCtx.moveTo(128 + Math.sin(ang) * r1, 128 - Math.cos(ang) * r1);
    clkCtx.lineTo(128 + Math.sin(ang) * r2, 128 - Math.cos(ang) * r2);
    clkCtx.stroke();
  }
  // Center pin
  clkCtx.fillStyle = '#b94848';
  clkCtx.beginPath();
  clkCtx.arc(128, 128, 7, 0, Math.PI * 2);
  clkCtx.fill();
  const clockFace = track(finalizeTexture(clkC, maxAniso, true, 1, 1));
  clockFace.wrapS = THREE.ClampToEdgeWrapping;
  clockFace.wrapT = THREE.ClampToEdgeWrapping;

  // 9. Station Timetable Board Texture
  const [ttC, ttCtx] = makeCanvas(512, 320);
  ttCtx.fillStyle = '#f6f1e6';
  ttCtx.fillRect(0, 0, 512, 320);
  ttCtx.fillStyle = '#2c3d59';
  ttCtx.fillRect(0, 0, 512, 62);
  ttCtx.fillStyle = '#f8f4ec';
  ttCtx.font = 'bold 22px "Noto Serif Tamil", serif';
  ttCtx.fillText('கால அட்டவணை  DREAMLINE', 24, 41);
  ttCtx.fillStyle = '#332d3d';
  ttCtx.font = '18px monospace';
  const rows = [
    '06:30  Local   Neelam Eri -> Thendral Malai',
    '12:15  Local   Valley Loop (All Stops)',
    '16:40  Sunset  Golden Hour Scenic Service',
    '17:45  Local   Shavish Jeshurun Sa -> Neelam',
    '19:20  Night   Twilight Lantern Local',
    '21:30  Last    Starlight Rural Express',
  ];
  rows.forEach((line, idx) => {
    const y = 104 + idx * 34;
    if (idx % 2 === 1) {
      ttCtx.fillStyle = 'rgba(44, 61, 89, 0.08)';
      ttCtx.fillRect(16, y - 22, 480, 30);
    }
    ttCtx.fillStyle = idx === 3 ? '#b5463b' : '#2a2736';
    ttCtx.fillText(line, 24, y);
  });
  const timetableBoard = track(finalizeTexture(ttC, maxAniso, true, 1, 1));
  timetableBoard.wrapS = THREE.ClampToEdgeWrapping;
  timetableBoard.wrapT = THREE.ClampToEdgeWrapping;

  // 10. Japanese Retro Vending Machine Front
  const [vmC, vmCtx] = makeCanvas(256, 512);
  vmCtx.fillStyle = '#e8e3d9';
  vmCtx.fillRect(0, 0, 256, 512);
  // Warm illuminated display showcase
  vmCtx.fillStyle = '#fff5dc';
  vmCtx.fillRect(18, 22, 220, 230);
  vmCtx.strokeStyle = '#3a3540';
  vmCtx.lineWidth = 4;
  vmCtx.strokeRect(18, 22, 220, 230);
  const canColors = ['#e05a47', '#f0a848', '#5ba36d', '#4f82b8', '#e68ea4', '#7a5842'];
  for (let r = 0; r < 3; r++) {
    const ry = 42 + r * 70;
    vmCtx.fillStyle = '#d4ccb8';
    vmCtx.fillRect(24, ry + 42, 208, 10);
    for (let c = 0; c < 6; c++) {
      vmCtx.fillStyle = canColors[(r * 2 + c) % canColors.length];
      vmCtx.fillRect(32 + c * 33, ry + 6, 22, 34);
      vmCtx.fillStyle = r === 2 ? '#d6453a' : '#2b6cb0';
      vmCtx.fillRect(30 + c * 33, ry + 44, 26, 6);
    }
  }
  // Red retro lower accent band & pickup chute
  vmCtx.fillStyle = '#c4463e';
  vmCtx.fillRect(0, 270, 256, 52);
  vmCtx.fillStyle = '#ffffff';
  vmCtx.font = 'bold 19px "Noto Sans Tamil", sans-serif';
  vmCtx.fillText('DRINKS · பானங்கள்', 34, 304);
  vmCtx.fillStyle = '#2a2830';
  vmCtx.fillRect(36, 368, 184, 92);
  const vendingFront = track(finalizeTexture(vmC, maxAniso, true, 1, 1));
  vendingFront.wrapS = THREE.ClampToEdgeWrapping;
  vendingFront.wrapT = THREE.ClampToEdgeWrapping;

  const createStationSign = (
    enName: string,
    tamilName: string,
    prevName: string,
    nextName: string
  ) => {
    const [c, ctx] = makeCanvas(512, 256);
    ctx.fillStyle = '#f8f5ee';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#2e384d';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);
    // Authentic rural railway color stripe
    ctx.fillStyle = '#4c6fa8';
    ctx.fillRect(14, 174, 484, 24);
    ctx.fillStyle = '#d87a5e';
    ctx.fillRect(190, 174, 132, 24);
    // Tamil station name (auto-fit longer Tamil names cleanly within signboard margins)
    ctx.fillStyle = '#1e2230';
    ctx.textAlign = 'center';
    const tamilFontPx = tamilName.length > 14 ? 28 : tamilName.length > 10 ? 34 : 40;
    ctx.font = `bold ${tamilFontPx}px "Noto Serif Tamil", serif`;
    ctx.fillText(tamilName, 256, 94, 464);
    // English / transliterated name
    ctx.font = '600 24px sans-serif';
    ctx.fillStyle = '#3c4254';
    ctx.fillText(enName, 256, 148, 460);
    // Prev / Next hints
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#2c3140';
    ctx.textAlign = 'left';
    ctx.fillText(`◀ ${prevName}`, 28, 228);
    ctx.textAlign = 'right';
    ctx.fillText(`${nextName} ▶`, 484, 228);

    const tex = track(finalizeTexture(c, maxAniso, true, 1, 1));
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  };

  return {
    woodAlbedo,
    woodBump,
    concretePlatform,
    tactileStrip,
    gravelBallast,
    roofTile,
    plasterWall,
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
