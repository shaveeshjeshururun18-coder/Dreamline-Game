import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  X,
  RotateCw,
  Shield,
  Sparkles,
  Building2,
  Car,
  Play,
  Eye,
  UserCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import {
  HERO_CHARACTERS,
  getAllWearableSuits,
  getHeroById,
  getHeroOutfitById,
  type HeroCharacterId,
  type HeroOutfitId,
  type HeroPreviewAnim,
} from '../game/heroCharacters';
import { createHeroCharacterRig, type HeroRig3D } from '../world/heroCharacters3D';
import { buildBatmobileWorld, type BatmobileWorldSystem } from '../world/batmobileWorld';
import { createInitialBatmobileState } from '../game/batmobile';
import { SuitSelectionModal } from './SuitSelectionModal';

interface HeroArmoryModalProps {
  activeHeroId: HeroCharacterId | null;
  activeOutfitId: HeroOutfitId | null;
  onDeployHero: (heroId: HeroCharacterId, outfitId: HeroOutfitId, teleportToMetro: boolean) => void;
  onSpawnBatmobile: (teleportToMetro: boolean) => void;
  onUseClassicTraveler: () => void;
  onClose: () => void;
}

type StudioCameraPreset = 'full' | 'closeup' | 'cinematic';

const STAT_ROWS: Array<{ key: keyof (typeof HERO_CHARACTERS)[number]['stats']; label: string; color: string }> = [
  { key: 'strength', label: 'Strength', color: 'bg-rose-500' },
  { key: 'speed', label: 'Speed', color: 'bg-sky-400' },
  { key: 'agility', label: 'Agility', color: 'bg-emerald-400' },
  { key: 'defence', label: 'Defence', color: 'bg-amber-400' },
  { key: 'mobility', label: 'Mobility', color: 'bg-cyan-400' },
  { key: 'intelligence', label: 'Intelligence', color: 'bg-indigo-400' },
];

export const HeroArmoryModal: React.FC<HeroArmoryModalProps> = ({
  activeHeroId,
  activeOutfitId,
  onDeployHero,
  onSpawnBatmobile,
  onUseClassicTraveler,
  onClose,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<HeroCharacterId>(
    activeHeroId ?? 'iron_man_classic'
  );
  const [selectedOutfitId, setSelectedOutfitId] = useState<HeroOutfitId>(
    activeOutfitId ?? getHeroById(activeHeroId ?? 'iron_man_classic').defaultOutfitId
  );
  const [inspectBatmobile, setInspectBatmobile] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<StudioCameraPreset>('full');
  const [previewAnim, setPreviewAnim] = useState<HeroPreviewAnim>('idle');
  const [autoRotate, setAutoRotate] = useState(true);
  const [canopyOpenPreview, setCanopyOpenPreview] = useState(false);
  const [suitModalOpen, setSuitModalOpen] = useState(false);
  const totalSuitCount = getAllWearableSuits().length;

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<HeroRig3D | null>(null);
  const batmobileRef = useRef<BatmobileWorldSystem | null>(null);
  const yawRef = useRef(0.32);
  const pitchRef = useRef(0.14);
  const draggingRef = useRef(false);
  const lastPtrRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef({
    selectedHeroId,
    selectedOutfitId,
    inspectBatmobile,
    cameraPreset,
    previewAnim,
    autoRotate,
    canopyOpenPreview,
  });

  stateRef.current = {
    selectedHeroId,
    selectedOutfitId,
    inspectBatmobile,
    cameraPreset,
    previewAnim,
    autoRotate,
    canopyOpenPreview,
  };

  const hero = getHeroById(selectedHeroId);
  const outfit = getHeroOutfitById(selectedHeroId, selectedOutfitId);

  const handleSelectHero = (id: HeroCharacterId) => {
    const next = getHeroById(id);
    setInspectBatmobile(false);
    setSelectedHeroId(id);
    setSelectedOutfitId(next.defaultOutfitId);
    setPreviewAnim('idle');
  };

  // Update 3D studio rig whenever hero or outfit changes
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.setHero(selectedHeroId, selectedOutfitId);
    }
  }, [selectedHeroId, selectedOutfitId]);

  // Mount interactive 360° Three.js Studio Preview
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(340, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.FogExp2(0x111827, 0.028);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const glCtx = renderer.getContext();
    const rendererStr = String(glCtx?.getParameter(glCtx.RENDERER) ?? '');
    const isSoftwareGl = /swiftshader|llvmpipe|software|mesa/i.test(rendererStr);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // PBR Studio IBL Environment Map so metallic red/gold armour and stealth carbon gleam realistically!
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    // Studio 3-point dramatic lighting + warm bounce
    const hemi = new THREE.HemisphereLight(0xf1f5f9, 0x334155, 1.35);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
    keyLight.position.set(4.8, 7.2, 6.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.75);
    rimLight.position.set(-5.0, 4.4, -5.2);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xfbbf24, 0.95);
    warmFill.position.set(4.0, 2.5, -3.5);
    scene.add(warmFill);

    // Illuminated metallic turntable pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.55, 0.24, 40),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.72 })
    );
    pedestal.position.y = -0.12;
    scene.add(pedestal);

    const ringGlow = new THREE.Mesh(
      new THREE.RingGeometry(3.06, 3.16, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ringGlow.rotation.x = -Math.PI * 0.5;
    ringGlow.position.y = 0.008;
    scene.add(ringGlow);

    const rig = createHeroCharacterRig(true);
    rig.setHero(stateRef.current.selectedHeroId, stateRef.current.selectedOutfitId);
    scene.add(rig.group);
    rigRef.current = rig;

    const batmobile = buildBatmobileWorld(true);
    batmobile.group.visible = false;
    scene.add(batmobile.group);
    batmobileRef.current = batmobile;

    const demoBatState = createInitialBatmobileState();
    demoBatState.x = 0;
    demoBatState.y = 0;
    demoBatState.z = 0;
    demoBatState.heading = 0;

    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    const startTime = performance.now();

    const onResize = () => {
      if (!container) return;
      const w = Math.max(280, container.clientWidth);
      const h = Math.max(300, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      if (disposed) return;
      const elapsed = (performance.now() - startTime) * 0.001;
      const st = stateRef.current;

      if (st.autoRotate && !draggingRef.current) {
        yawRef.current += isSoftwareGl ? 0.032 : 0.0065;
      }

      const showCar = st.inspectBatmobile;
      rig.group.visible = !showCar;
      batmobile.group.visible = showCar;

      const heroSpec = getHeroById(st.selectedHeroId);
      const scaleH = heroSpec.mobility.scaleMultiplier;

      if (!showCar) {
        rig.group.rotation.y = yawRef.current;
        rig.updatePose({
          elapsed,
          speed: st.previewAnim === 'run' ? 6.5 : 0,
          previewAnim: st.previewAnim,
          helmetOpen: st.previewAnim === 'helmet_pose',
          energyShieldActive: st.previewAnim === 'helmet_pose' && st.selectedHeroId !== 'iron_man_classic',
          spiderSenseActive: st.previewAnim === 'helmet_pose' && st.selectedHeroId === 'spider_man',
          detectiveVisionActive: st.previewAnim === 'helmet_pose' && st.selectedHeroId === 'batman',
        });
      } else {
        demoBatState.heading = yawRef.current;
        demoBatState.wheelSpin = elapsed * 2.2;
        demoBatState.boostActive = st.previewAnim === 'action' || st.previewAnim === 'flight_swing';
        demoBatState.canopyOpen = st.canopyOpenPreview;
        demoBatState.canopyProgress +=
          ((st.canopyOpenPreview ? 1 : 0) - demoBatState.canopyProgress) * 0.18;
        demoBatState.detectiveScanActive = st.previewAnim === 'helmet_pose';
        batmobile.update(demoBatState, elapsed, 0.85);
      }

      // Camera presets (generous framing so entire Batmobile & Hulkbuster fit cleanly)
      let dist = showCar ? 8.6 : 3.65 * scaleH;
      let targetY = showCar ? 0.92 : 0.98 * scaleH;
      let camY = showCar ? 2.55 : 1.38 * scaleH;

      if (st.cameraPreset === 'closeup') {
        dist = showCar ? 5.6 : 1.65 * scaleH;
        targetY = showCar ? 1.0 : 1.56 * scaleH;
        camY = showCar ? 1.85 : 1.66 * scaleH;
      } else if (st.cameraPreset === 'cinematic') {
        dist = showCar ? 7.4 : 3.1 * scaleH;
        targetY = showCar ? 0.85 : 1.12 * scaleH;
        camY = showCar ? 1.45 : 0.78 * scaleH;
      }

      const pitchOffset = Math.sin(pitchRef.current) * 1.4;
      camera.position.set(0, Math.max(0.45, camY + pitchOffset), dist);
      camera.lookAt(0, targetY, 0);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        timerId = window.setTimeout(animate, 90);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener('resize', onResize);
      envRT.dispose();
      pmrem.dispose();
      rig.dispose();
      batmobile.dispose();
      renderer.dispose();
      rigRef.current = null;
      batmobileRef.current = null;
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPtrRef.current.x;
    const dy = e.clientY - lastPtrRef.current.y;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    yawRef.current += dx * 0.011;
    pitchRef.current = Math.max(-0.4, Math.min(0.6, pitchRef.current + dy * 0.007));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md md:p-5"
      data-testid="hero-armory-modal"
    >
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0b101b] text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Shield className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-bold tracking-wide text-white">
                HERO ARMORY &amp; 360° CHARACTER STUDIO
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Drag to orbit 360° · Switch outfits &amp; suits · Deploy anywhere or inside your Secret Underground Vault
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="open-suit-selection-btn"
              onClick={() => setSuitModalOpen(true)}
              className="flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-sky-400/70 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/25"
            >
              <Layers className="h-3.5 w-3.5" />
              Browse Suits ({totalSuitCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setInspectBatmobile((v) => !v);
                setPreviewAnim('idle');
              }}
              className={`flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                inspectBatmobile
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              {inspectBatmobile ? 'Viewing Batmobile 3D' : 'Inspect Batmobile 3D'}
            </button>
            <button
              type="button"
              onClick={onUseClassicTraveler}
              className="whitespace-nowrap shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Classic Traveler
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Hero Armory"
              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3-Column Studio Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Character Roster with Uploaded Reference Portraits */}
          <div className="overflow-y-auto border-b border-slate-800 bg-slate-950/60 p-3 lg:col-span-3 lg:border-r lg:border-b-0">
            <div className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Select Character ({HERO_CHARACTERS.length})
            </div>
            <div className="space-y-1.5">
              {HERO_CHARACTERS.map((item) => {
                const isSelected = !inspectBatmobile && selectedHeroId === item.id;
                const isActiveInWorld = activeHeroId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-hero-option={item.id}
                    onClick={() => handleSelectHero(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                      isSelected
                        ? 'border-sky-400/90 bg-sky-500/15 shadow-sm'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                  >
                    <img
                      src={item.referenceImage}
                      alt={item.name}
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-700 object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-white">{item.name}</span>
                        {isActiveInWorld && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-slate-400">{item.alias}</div>
                      {item.outfits.length > 1 && (
                        <div className="mt-0.5 text-[10px] font-medium text-amber-300">
                          {item.outfits.length} Switchable Suits
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: Live 360° Interactive Three.js Viewport */}
          <div className="relative flex min-h-[340px] flex-col bg-[#080c15] lg:col-span-5">
            <div
              ref={canvasMountRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative flex-1 cursor-grab active:cursor-grabbing"
            />

            {/* Top-left studio camera controls */}
            <div className="pointer-events-auto absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['full', 'Full Body'],
                  ['closeup', 'Close-Up'],
                  ['cinematic', 'Cinematic'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCameraPreset(id)}
                  className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                    cameraPreset === id
                      ? 'border-sky-400 bg-sky-500/25 text-sky-100'
                      : 'border-slate-700/80 bg-slate-950/75 text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                  autoRotate
                    ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200'
                    : 'border-slate-700/80 bg-slate-950/75 text-slate-400'
                }`}
              >
                <RotateCw className="h-3 w-3" />
                360° Spin
              </button>
            </div>

            {/* Bottom studio animation triggers */}
            <div className="border-t border-slate-800/80 bg-slate-950/90 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  {inspectBatmobile ? 'Batmobile Systems Preview' : 'Live Animation Preview'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {!inspectBatmobile ? (
                    (
                      [
                        ['idle', 'Idle'],
                        ['run', 'Run'],
                        ['flight_swing', hero.id === 'spider_man' ? 'Web-Swing' : hero.id === 'batman' ? 'Cape Glide' : 'Flight / Dash'],
                        ['action', hero.primaryPower.label],
                        [
                          'helmet_pose',
                          hero.mobility.hasHelmetToggle
                            ? 'Open Helmet'
                            : hero.id === 'spider_man'
                              ? 'Spider-Sense'
                              : hero.id === 'batman'
                                ? 'Detective Scan'
                                : 'Shield / Pose',
                        ],
                      ] as const
                    ).map(([animId, label]) => (
                      <button
                        key={animId}
                        type="button"
                        onClick={() => setPreviewAnim(animId)}
                        className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                          previewAnim === animId
                            ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <Play className="h-2.5 w-2.5" />
                        {label}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setCanopyOpenPreview((v) => !v)}
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                          canopyOpenPreview
                            ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {canopyOpenPreview ? 'Close Canopy' : 'Open Sliding Canopy'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewAnim((a) => (a === 'action' ? 'idle' : 'action'))
                        }
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                          previewAnim === 'action'
                            ? 'border-orange-400 bg-orange-500/20 text-orange-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        Jet Afterburner
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewAnim((a) => (a === 'helmet_pose' ? 'idle' : 'helmet_pose'))
                        }
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                          previewAnim === 'helmet_pose'
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        Sonar Scan
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Biography, Balanced Stats, Suit Switcher & Deploy Actions */}
          <div className="flex flex-col overflow-y-auto border-t border-slate-800 bg-slate-950/75 p-4 lg:col-span-4 lg:border-t-0 lg:border-l">
            {inspectBatmobile ? (
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase">
                    Vehicle 06 · Heavy Tactical Interceptor
                  </div>
                  <h3 className="mt-0.5 text-xl font-bold text-white">Armoured Batmobile</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Stealth-black angled combat armour combining Tumbler heavy suspension and Arkham high-speed bat-fins. Features sliding cockpit canopy, digital HUD dashboard, twin LED spotlights, 167 km/h jet afterburner, and ramming structural destruction.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <img
                      src="/assets/aistudio/images__13__2a66b595.jpeg"
                      alt="Batmobile Arkham Silhouette"
                      className="h-24 w-full rounded-lg border border-slate-700 object-cover"
                    />
                    <img
                      src="/assets/aistudio/images__14__c7fce151.jpeg"
                      alt="Batmobile Tumbler Reference"
                      className="h-24 w-full rounded-lg border border-slate-700 object-cover"
                    />
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <li>• Top Speed: 167 km/h with Rear Jet Afterburner (Shift)</li>
                    <li>• Heavy Ramming Impulse smashes street barriers, taxis &amp; crates</li>
                    <li>• Animated Sliding Canopy, Steerable Front Wheels &amp; Working Suspension</li>
                    <li>• Instant Field Armour Repair &amp; 3 Camera Modes (Chase / Cinematic / Cockpit)</li>
                  </ul>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => onSpawnBatmobile(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                  >
                    <Car className="h-4 w-4" />
                    Drive Batmobile in Secret Underground Garage
                  </button>
                  <button
                    type="button"
                    onClick={() => onSpawnBatmobile(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Summon Batmobile at Current Location
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="space-y-4">
                  {/* Identity & Reference Portrait */}
                  <div className="flex items-start gap-3">
                    <img
                      src={outfit.referenceImage}
                      alt={outfit.label}
                      className="h-20 w-20 shrink-0 rounded-xl border border-slate-700 object-cover object-top"
                    />
                    <div>
                      <div className="text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
                        {hero.alias} · {hero.mobility.heightMeters.toFixed(2)}m
                      </div>
                      <h3 className="text-xl font-bold text-white">{hero.name}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {hero.biography}
                      </p>
                    </div>
                  </div>

                  {/* Outfit / Suit Switcher & Full Wardrobe Access */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
                        <RefreshCw className="h-3 w-3" />
                        {hero.outfits.length > 1
                          ? `Suit Skin (${hero.outfits.length} Variants)`
                          : 'Active Suit Skin'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSuitModalOpen(true)}
                        className="whitespace-nowrap shrink-0 text-[11px] font-semibold text-sky-400 transition-colors hover:text-sky-300 hover:underline"
                      >
                        Open Suit Wardrobe →
                      </button>
                    </div>
                    {hero.outfits.length > 1 ? (
                      <div className="grid grid-cols-1 gap-1.5">
                        {hero.outfits.map((o) => {
                          const active = o.id === selectedOutfitId;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              data-outfit-option={o.id}
                              onClick={() => setSelectedOutfitId(o.id)}
                              className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition ${
                                active
                                  ? 'border-amber-400 bg-amber-500/15'
                                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
                              }`}
                            >
                              <img
                                src={o.referenceImage}
                                alt={o.label}
                                className="h-10 w-10 shrink-0 rounded-md border border-slate-700 object-cover object-top"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white">{o.label}</div>
                                <div className="truncate text-[11px] text-slate-400">
                                  {o.subtitle}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSuitModalOpen(true)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-left transition hover:border-sky-400/70 hover:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white">
                            {outfit.label}
                          </div>
                          <div className="truncate text-[11px] text-slate-400">
                            Browse all {totalSuitCount} wearable hero suit skins
                          </div>
                        </div>
                        <Layers className="h-4 w-4 shrink-0 text-sky-400" />
                      </button>
                    )}
                  </div>

                  {/* Balanced 6-Attribute Performance Stats */}
                  <div>
                    <div className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Combat &amp; Traversal Profile
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {STAT_ROWS.map((row) => {
                        const val = hero.stats[row.key];
                        return (
                          <div key={row.key}>
                            <div className="mb-0.5 flex justify-between text-[11px]">
                              <span className="text-slate-300">{row.label}</span>
                              <span className="font-mono font-bold text-white">{val}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={`h-full rounded-full ${row.color} transition-all duration-300`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Signature Abilities */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      <Sparkles className="h-3 w-3 text-sky-400" />
                      Signature Powers &amp; Animations
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {hero.abilities.map((ab) => (
                        <li key={ab} className="leading-snug">
                          • {ab}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Deployment CTAs */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    data-testid="deploy-hero-metro"
                    onClick={() => onDeployHero(selectedHeroId, selectedOutfitId, true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-sky-400"
                  >
                    <Building2 className="h-4 w-4" />
                    Deploy {hero.name} in Secret Home Vault
                  </button>
                  <button
                    type="button"
                    data-testid="deploy-hero-here"
                    onClick={() => onDeployHero(selectedHeroId, selectedOutfitId, false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-400 hover:bg-slate-800"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Deploy at Current Location
                  </button>
                  {hero.mobility.hasBatmobileLink && (
                    <button
                      type="button"
                      onClick={() => onSpawnBatmobile(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25"
                    >
                      <Car className="h-3.5 w-3.5" />
                      Launch Batmobile in Secret Garage
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {suitModalOpen && (
        <SuitSelectionModal
          selectedHeroId={selectedHeroId}
          selectedOutfitId={selectedOutfitId}
          activeHeroId={activeHeroId}
          activeOutfitId={activeOutfitId}
          onPreviewSuit={(nextHeroId, nextOutfitId) => {
            setInspectBatmobile(false);
            setSelectedHeroId(nextHeroId);
            setSelectedOutfitId(nextOutfitId);
            setPreviewAnim('idle');
            setSuitModalOpen(false);
          }}
          onEquipSuit={(nextHeroId, nextOutfitId, teleportToMetro) => {
            setSuitModalOpen(false);
            onDeployHero(nextHeroId, nextOutfitId, teleportToMetro);
          }}
          onClose={() => setSuitModalOpen(false)}
        />
      )}
    </div>
  );
};
