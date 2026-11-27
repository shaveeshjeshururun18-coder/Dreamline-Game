import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bike,
  Bus,
  Car,
  Clock,
  Compass,
  Crosshair,
  Home,
  Layers,
  LocateFixed,
  MapPin,
  Maximize2,
  Minus,
  MoonStar,
  MountainSnow,
  Navigation,
  Plane,
  Plus,
  Search,
  Ship,
  Sparkles,
  TrainFront,
  Wind,
  X,
} from 'lucide-react';
import type { BoatId, HudSnapshot } from '../game/types';
import { LOCATIONS, SCENIC_SPOTS } from '../game/terrain';
import { sampleRailway, STATIONS } from '../game/railway';
import { sampleBusRoad } from '../game/vehicles';
import {
  DINOSAUR_ISLAND_CENTER,
  DINOSAUR_PERIMETER_GATES,
  DINOSAUR_PERIMETER_WALL_RADIUS,
  DINOSAUR_RIVER_END_LZ,
  DINOSAUR_RIVER_START_LZ,
  DINOSAUR_TRIANGLE_PLACES,
  DINOSAUR_TRIANGLE_VERTICES,
  ssjRiverLocalX,
} from '../game/dinosaurIsland';
import { DESERT_OASIS_SPAWN } from '../game/desertOasis';
import { EXHIBITION_PLAZA_SPAWN } from '../game/exhibitionComplex';
import { AIRPORT_RUNWAY_BOUNDS, METRO_SURFACE_ENTRANCES } from '../game/airportMetro';
import { sampleNavigationPath, type NavigationTarget } from '../game/navigation';
import type { BusRideDestination } from '../game/busHailing';
import type { SkyExplorerPadId } from '../game/skyExplorer';
import {
  ATLAS_BASE_H,
  ATLAS_BASE_W,
  ATLAS_BOUNDS,
  ATLAS_MAX_ZOOM,
  ATLAS_MIN_ZOOM,
  ATLAS_PINS,
  ATLAS_REGION_PRESETS,
  ATLAS_WORLD_H,
  ATLAS_WORLD_W,
  CAVE_ENTRANCES,
  MIDNIGHT_FRONTIER_PORTAL_POS,
  atlasToWorldX,
  atlasToWorldZ,
  clampAtlasCamera,
  computeAtlasScaleBar,
  computeAtlasViewBox,
  sampleAtlasPixelRGB,
  worldToAtlasX,
  worldToAtlasY,
  type AtlasCamera,
  type AtlasPin,
  type AtlasRegionPresetId,
} from '../game/worldAtlas';

interface WorldMapModalProps {
  hud: HudSnapshot;
  onTeleport: (x: number, z: number, label: string) => void;
  onSetNavigation: (target: NavigationTarget) => void;
  onClearNavigation: () => void;
  onCallBus: (destination: BusRideDestination) => void;
  onEnterCaves: () => void;
  onToggleNightMode: () => void;
  onOpenTransitMap: () => void;
  onBoardBoat: (boatId: BoatId) => void;
  onBoardSubmarine: () => void;
  onBoardSkyExplorer: (pad?: SkyExplorerPadId) => void;
  onBoardSkyTaxi: () => void;
  onDriveCamper: () => void;
  onEnterUndergroundMetro: () => void;
  onBoardAirliner: () => void;
  onTeleportMidnightFrontier: () => void;
  onClose: () => void;
}

type DirectoryTab = 'places' | 'craft' | 'realms';

interface SelectedSpot {
  id: string;
  name: string;
  subtitle?: string;
  regionLabel: string;
  description: string;
  x: number;
  z: number;
  teleportX: number;
  teleportZ: number;
  busReachable: boolean;
  isCustom?: boolean;
}

// Module-level cached shaded-relief cartography data URL so reopening the atlas is 0ms instant
let cachedTerrainAtlasUrl: string | null = null;

function getOrBuildTerrainAtlasUrl(): string {
  if (cachedTerrainAtlasUrl) return cachedTerrainAtlasUrl;
  if (typeof document === 'undefined') return '';
  const W = 540;
  const H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let py = 0; py < H; py++) {
    const wz = ATLAS_BOUNDS.minZ + ((py + 0.5) / H) * ATLAS_WORLD_H;
    for (let px = 0; px < W; px++) {
      const wx = ATLAS_BOUNDS.minX + ((px + 0.5) / W) * ATLAS_WORLD_W;
      const [r, g, b] = sampleAtlasPixelRGB(wx, wz);
      const idx = (py * W + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  cachedTerrainAtlasUrl = canvas.toDataURL('image/png');
  return cachedTerrainAtlasUrl;
}

function formatDistanceMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  hud,
  onTeleport,
  onSetNavigation,
  onClearNavigation,
  onCallBus,
  onEnterCaves,
  onToggleNightMode,
  onOpenTransitMap,
  onBoardBoat,
  onBoardSubmarine,
  onBoardSkyExplorer,
  onBoardSkyTaxi,
  onDriveCamper,
  onEnterUndergroundMetro,
  onBoardAirliner,
  onTeleportMidnightFrontier,
  onClose,
}) => {
  const terrainUrl = useMemo(() => getOrBuildTerrainAtlasUrl(), []);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);

  // Camera starts cleanly framed on the Full World showing Mainland + 1 KM Dinosaur Island + Frozen Kingdom + Desert
  const [camera, setCamera] = useState<AtlasCamera>(() => ATLAS_REGION_PRESETS[0].camera);
  const [activePreset, setActivePreset] = useState<AtlasRegionPresetId | null>('full');
  const [activeTab, setActiveTab] = useState<DirectoryTab>('places');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransit, setShowTransit] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; z: number } | null>(null);
  const [viewportWidthPx, setViewportWidthPx] = useState(820);

  // Drag-to-pan state
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCam: AtlasCamera;
    moved: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initial selected spot: active GPS target, or 1 KM Dinosaur Island / Main Station
  const [selected, setSelected] = useState<SelectedSpot>(() => {
    if (hud.navigation) {
      return {
        id: hud.navigation.target.id,
        name: hud.navigation.target.label,
        subtitle: hud.navigation.target.tamilLabel,
        regionLabel: 'Active GPS Destination',
        description: 'Live 3D guidance ribbon and directional beacon active.',
        x: hud.navigation.target.x,
        z: hud.navigation.target.z,
        teleportX: hud.navigation.target.x,
        teleportZ: hud.navigation.target.z,
        busReachable: false,
      };
    }
    const defaultPin = ATLAS_PINS.find((p) => p.id === 'dinosaur_island') ?? ATLAS_PINS[0];
    return {
      id: defaultPin.id,
      name: defaultPin.name,
      subtitle: defaultPin.subtitle,
      regionLabel: defaultPin.regionLabel,
      description: defaultPin.description,
      x: defaultPin.x,
      z: defaultPin.z,
      teleportX: defaultPin.teleportX ?? defaultPin.x,
      teleportZ: defaultPin.teleportZ ?? defaultPin.z,
      busReachable: defaultPin.busReachable,
    };
  });

  // Measure map viewport width for accurate dynamic metric scale bar
  useEffect(() => {
    const el = mapWrapRef.current;
    if (!el) return;
    const update = () => setViewportWidthPx(Math.max(260, el.clientWidth));
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const viewBox = useMemo(() => computeAtlasViewBox(camera), [camera]);
  const invZoom = 1 / camera.zoom;
  const scaleBar = useMemo(
    () => computeAtlasScaleBar(camera.zoom, viewportWidthPx),
    [camera.zoom, viewportWidthPx]
  );

  // Precomputed smooth vector paths in ATLAS_BASE_W x ATLAS_BASE_H space
  const railPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 180;
    for (let i = 0; i <= steps; i++) {
      const s = sampleRailway(i / steps);
      pts.push(
        `${i === 0 ? 'M' : 'L'} ${worldToAtlasX(s.x).toFixed(1)} ${worldToAtlasY(s.z).toFixed(1)}`
      );
    }
    return pts.join(' ') + ' Z';
  }, []);

  const busPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 84;
    for (let i = 0; i <= steps; i++) {
      const s = sampleBusRoad(i / steps);
      pts.push(
        `${i === 0 ? 'M' : 'L'} ${worldToAtlasX(s.x).toFixed(1)} ${worldToAtlasY(s.z).toFixed(1)}`
      );
    }
    return pts.join(' ') + ' Z';
  }, []);

  const dinoRiverPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lz = DINOSAUR_RIVER_START_LZ + t * (DINOSAUR_RIVER_END_LZ - DINOSAUR_RIVER_START_LZ);
      const wx = DINOSAUR_ISLAND_CENTER.x + ssjRiverLocalX(lz);
      const wz = DINOSAUR_ISLAND_CENTER.z + lz;
      pts.push(
        `${i === 0 ? 'M' : 'L'} ${worldToAtlasX(wx).toFixed(1)} ${worldToAtlasY(wz).toFixed(1)}`
      );
    }
    return pts.join(' ');
  }, []);

  const navPathD = useMemo(() => {
    if (!hud.navigation) return null;
    const pts = sampleNavigationPath(
      hud.playerX,
      hud.playerZ,
      hud.navigation.target.x,
      hud.navigation.target.z,
      20
    );
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${worldToAtlasX(p.x).toFixed(1)} ${worldToAtlasY(p.z).toFixed(1)}`)
      .join(' ');
  }, [hud.navigation, hud.playerX, hud.playerZ]);

  // Unified searchable directory combining LOCATIONS with key ATLAS_PINS
  const directoryPlaces = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        subtitle: string;
        regionLabel: string;
        description: string;
        x: number;
        z: number;
        teleportX: number;
        teleportZ: number;
        busReachable: boolean;
        isHome: boolean;
        isDino: boolean;
        distanceM: number;
      }
    >();

    for (const loc of LOCATIONS) {
      const tx = loc.teleportX ?? loc.x;
      const tz = loc.teleportZ ?? loc.z;
      byId.set(loc.id, {
        id: loc.id,
        name: loc.name,
        subtitle: loc.jpName,
        regionLabel: loc.regionId.replace('_', ' '),
        description: loc.subtitle || 'Explore this Dreamline destination.',
        x: loc.x,
        z: loc.z,
        teleportX: tx,
        teleportZ: tz,
        busReachable: loc.id !== 'dinosaur_island',
        isHome: loc.id === 'my_home' || loc.id === 'avs_snow_house',
        isDino: loc.id === 'dinosaur_island',
        distanceM: Math.hypot(tx - hud.playerX, tz - hud.playerZ),
      });
    }

    for (const pin of ATLAS_PINS) {
      if (byId.has(pin.id)) continue;
      const tx = pin.teleportX ?? pin.x;
      const tz = pin.teleportZ ?? pin.z;
      byId.set(pin.id, {
        id: pin.id,
        name: pin.name,
        subtitle: pin.subtitle ?? pin.regionLabel,
        regionLabel: pin.regionLabel,
        description: pin.description,
        x: pin.x,
        z: pin.z,
        teleportX: tx,
        teleportZ: tz,
        busReachable: pin.busReachable,
        isHome: pin.category === 'home',
        isDino: pin.id.startsWith('dino'),
        distanceM: Math.hypot(tx - hud.playerX, tz - hud.playerZ),
      });
    }

    const q = searchQuery.trim().toLowerCase();
    return Array.from(byId.values()).filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.regionLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [hud.playerX, hud.playerZ, searchQuery]);

  // Helper: convert client pointer event to world coordinates
  const clientToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; z: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      // PreserveAspectRatio xMidYMid slice mapping (edge-to-edge full bleed)
      const svgAspect = viewBox.vw / viewBox.vh;
      const rectAspect = rect.width / rect.height;
      let renderW = rect.width;
      let renderH = rect.height;
      let offsetX = 0;
      let offsetY = 0;
      if (rectAspect > svgAspect) {
        renderH = rect.width / svgAspect;
        offsetY = (rect.height - renderH) * 0.5;
      } else {
        renderW = rect.height * svgAspect;
        offsetX = (rect.width - renderW) * 0.5;
      }
      const nx = (clientX - rect.left - offsetX) / renderW;
      const ny = (clientY - rect.top - offsetY) / renderH;
      const ax = viewBox.vx + nx * viewBox.vw;
      const ay = viewBox.vy + ny * viewBox.vh;
      return {
        x: atlasToWorldX(ax),
        z: atlasToWorldZ(ay),
      };
    },
    [viewBox]
  );

  const handleZoomBy = useCallback((factor: number, anchorWorld?: { x: number; z: number }) => {
    setActivePreset(null);
    setCamera((prev) => {
      const nextZoom = Math.max(ATLAS_MIN_ZOOM, Math.min(ATLAS_MAX_ZOOM, prev.zoom * factor));
      if (!anchorWorld) {
        return clampAtlasCamera({ ...prev, zoom: nextZoom });
      }
      const ratio = prev.zoom / nextZoom;
      const nextCX = anchorWorld.x + (prev.centerX - anchorWorld.x) * ratio;
      const nextCZ = anchorWorld.z + (prev.centerZ - anchorWorld.z) * ratio;
      return clampAtlasCamera({ centerX: nextCX, centerZ: nextCZ, zoom: nextZoom });
    });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const anchor = clientToWorld(e.clientX, e.clientY) ?? undefined;
      const factor = e.deltaY < 0 ? 1.24 : 1 / 1.24;
      handleZoomBy(factor, anchor);
    },
    [clientToWorld, handleZoomBy]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startCam: camera,
        moved: false,
      };
      setIsDragging(true);
    },
    [camera]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const w = clientToWorld(e.clientX, e.clientY);
      if (w) {
        setCursorWorld({
          x: Math.round(Math.max(ATLAS_BOUNDS.minX, Math.min(ATLAS_BOUNDS.maxX, w.x))),
          z: Math.round(Math.max(ATLAS_BOUNDS.minZ, Math.min(ATLAS_BOUNDS.maxZ, w.z))),
        });
      }
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dxPx = e.clientX - drag.startClientX;
      const dyPx = e.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dxPx, dyPx) > 5) {
        drag.moved = true;
      }
      if (!drag.moved) return;

      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const visibleWorldW = ATLAS_WORLD_W / drag.startCam.zoom;
      const visibleWorldH = ATLAS_WORLD_H / drag.startCam.zoom;
      const worldDx = (dxPx / Math.max(1, rect.width)) * visibleWorldW;
      const worldDz = (dyPx / Math.max(1, rect.height)) * visibleWorldH;
      setActivePreset(null);
      setCamera(
        clampAtlasCamera({
          centerX: drag.startCam.centerX - worldDx,
          centerZ: drag.startCam.centerZ - worldDz,
          zoom: drag.startCam.zoom,
        })
      );
    },
    [clientToWorld]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      // Clean click on open map (no drag): drop a live GPS pin & select it
      if (drag && !drag.moved) {
        // Ignore if user clicked directly on a landmark pin button group
        const target = e.target as Element | null;
        if (target && target.closest('[data-atlas-pin="true"]')) return;
        const w = clientToWorld(e.clientX, e.clientY);
        if (!w) return;
        const wx = Math.round(Math.max(ATLAS_BOUNDS.minX, Math.min(ATLAS_BOUNDS.maxX, w.x)));
        const wz = Math.round(Math.max(ATLAS_BOUNDS.minZ, Math.min(ATLAS_BOUNDS.maxZ, w.z)));
        setSelected({
          id: `custom_${wx}_${wz}`,
          name: `Custom Waypoint (${wx}, ${wz})`,
          regionLabel: 'Dropped Map Pin',
          description: 'Live 3D GPS route set to this exact world coordinate.',
          x: wx,
          z: wz,
          teleportX: wx,
          teleportZ: wz,
          busReachable: false,
          isCustom: true,
        });
        onSetNavigation({
          id: `custom_${wx}_${wz}`,
          label: `Map Pin (${wx}, ${wz})`,
          x: wx,
          z: wz,
        });
      }
    },
    [clientToWorld, onSetNavigation]
  );

  const focusPoint = useCallback((wx: number, wz: number, minZoom = 2.6) => {
    setActivePreset(null);
    setCamera((prev) =>
      clampAtlasCamera({
        centerX: wx,
        centerZ: wz,
        zoom: Math.max(prev.zoom, minZoom),
      })
    );
  }, []);

  const handleSelectPin = useCallback((pin: AtlasPin) => {
    setSelected({
      id: pin.id,
      name: pin.name,
      subtitle: pin.subtitle,
      regionLabel: pin.regionLabel,
      description: pin.description,
      x: pin.x,
      z: pin.z,
      teleportX: pin.teleportX ?? pin.x,
      teleportZ: pin.teleportZ ?? pin.z,
      busReachable: pin.busReachable,
    });
  }, []);

  const handleSelectPreset = useCallback((presetId: AtlasRegionPresetId) => {
    const preset = ATLAS_REGION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setCamera(clampAtlasCamera(preset.camera));
  }, []);

  const handleCenterOnPlayer = useCallback(() => {
    setActivePreset(null);
    setCamera(
      clampAtlasCamera({
        centerX: hud.playerX,
        centerZ: hud.playerZ,
        zoom: Math.max(camera.zoom, 2.8),
      })
    );
  }, [camera.zoom, hud.playerX, hud.playerZ]);

  const discoveredCount = hud.discoveredSpotIds.length;
  const selectedDist = Math.hypot(selected.teleportX - hud.playerX, selected.teleportZ - hud.playerZ);

  // Graticule lines every 200m
  const gridXs = [-200, 0, 200, 400, 600, 800, 1000, 1200, 1400];
  const gridZs = [-200, 0, 200, 400, 600];

  // Player heading cone angle (heading=0 points +Z = down on map; +X = right; so angle in SVG degrees)
  const playerHeadingDeg = (-hud.playerHeading * 180) / Math.PI + 90;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dreamline World Atlas and Live GPS Navigation"
      data-testid="world-map-modal"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#060A12]/82 backdrop-blur-sm p-2.5 sm:p-4 lg:p-6"
    >
      <div className="w-full max-w-[1380px] h-[90vh] max-h-[860px] flex flex-col rounded-2xl bg-[#0E1522] border border-white/10 text-[#F1F5F9] shadow-2xl overflow-hidden">
        {/* Clean 3-Zone Top Bar */}
        <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/10 bg-[#0B111C] shrink-0">
          <div className="flex items-baseline gap-3 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight text-white whitespace-nowrap">
              Dreamline World Atlas
            </h2>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 truncate">
              <span>{hud.location.name}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {discoveredCount}/{SCENIC_SPOTS.length} vistas
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{hud.timeFormatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hud.navigation && (
              <button
                type="button"
                onClick={onClearNavigation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-xs font-medium text-cyan-200 cursor-pointer whitespace-nowrap transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  Clear GPS ({formatDistanceMeters(hud.navigation.distanceMeters)})
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTransitMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/12 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Timings</span>
            </button>
            <button
              type="button"
              aria-label="Close Map"
              data-testid="world-map-close"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/12 border border-white/10 text-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main 2-Column Split: Dominant Topographic Atlas + Clean Inspector Directory */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Full-Bleed Interactive Shaded-Relief World Atlas */}
          <div
            ref={mapWrapRef}
            className="lg:col-span-8 relative bg-[#0B2A44] overflow-hidden select-none min-h-[340px]"
          >
            <svg
              ref={svgRef}
              viewBox={`${viewBox.vx.toFixed(2)} ${viewBox.vy.toFixed(2)} ${viewBox.vw.toFixed(2)} ${viewBox.vh.toFixed(2)}`}
              preserveAspectRatio="xMidYMid slice"
              data-testid="world-map-svg"
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={() => setCursorWorld(null)}
              className={`w-full h-full block touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <defs>
                <filter id="atlas-label-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="#050B14" floodOpacity="0.88" />
                </filter>
                <radialGradient id="player-heading-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base Shaded-Relief Topographic & Bathymetric Terrain Raster (True 3D World Sampled!) */}
              {terrainUrl && (
                <image
                  href={terrainUrl}
                  x={0}
                  y={0}
                  width={ATLAS_BASE_W}
                  height={ATLAS_BASE_H}
                  preserveAspectRatio="none"
                />
              )}

              {/* Subtle 200m Cartographic Graticule Grid */}
              <g pointerEvents="none" opacity="0.22">
                {gridXs.map((gx) => {
                  const ax = worldToAtlasX(gx);
                  return (
                    <line
                      key={`gx_${gx}`}
                      x1={ax}
                      y1={0}
                      x2={ax}
                      y2={ATLAS_BASE_H}
                      stroke="#E2F1FF"
                      strokeWidth={0.7 * invZoom}
                      strokeDasharray={`${3 * invZoom} ${4 * invZoom}`}
                    />
                  );
                })}
                {gridZs.map((gz) => {
                  const ay = worldToAtlasY(gz);
                  return (
                    <line
                      key={`gz_${gz}`}
                      x1={0}
                      y1={ay}
                      x2={ATLAS_BASE_W}
                      y2={ay}
                      stroke="#E2F1FF"
                      strokeWidth={0.7 * invZoom}
                      strokeDasharray={`${3 * invZoom} ${4 * invZoom}`}
                    />
                  );
                })}
              </g>

              {/* Grand Dinosaur Island Architectural Overlays: 360° Boundary Wall, 4 Bigger Gates, Flowing River & Triangle Explorer Track */}
              <g pointerEvents="none">
                {/* 360° Jurassic Perimeter Boundary Wall */}
                <circle
                  cx={worldToAtlasX(DINOSAUR_ISLAND_CENTER.x)}
                  cy={worldToAtlasY(DINOSAUR_ISLAND_CENTER.z)}
                  r={(DINOSAUR_PERIMETER_WALL_RADIUS / ATLAS_WORLD_W) * ATLAS_BASE_W}
                  fill="none"
                  stroke="#FDE047"
                  strokeOpacity="0.72"
                  strokeWidth={2.0 * invZoom}
                  strokeDasharray={`${6 * invZoom} ${3.5 * invZoom}`}
                />
                {/* Flowing Forest River subtle vector highlight */}
                <path
                  d={dinoRiverPath}
                  fill="none"
                  stroke="#67E8F9"
                  strokeOpacity="0.65"
                  strokeWidth={2.4 * invZoom}
                  strokeLinecap="round"
                />
                {/* Grand Triangle Explorer Track connecting all 6 distinct island places */}
                <polygon
                  points={DINOSAUR_TRIANGLE_VERTICES.map(
                    (v) =>
                      `${worldToAtlasX(DINOSAUR_ISLAND_CENTER.x + v.lx).toFixed(1)},${worldToAtlasY(
                        DINOSAUR_ISLAND_CENTER.z + v.lz
                      ).toFixed(1)}`
                  ).join(' ')}
                  fill="rgba(250, 204, 21, 0.08)"
                  stroke="#F59E0B"
                  strokeOpacity="0.95"
                  strokeWidth={2.6 * invZoom}
                  strokeLinejoin="round"
                />
                {DINOSAUR_TRIANGLE_PLACES.map((p) => (
                  <circle
                    key={p.id}
                    cx={worldToAtlasX(DINOSAUR_ISLAND_CENTER.x + p.lx)}
                    cy={worldToAtlasY(DINOSAUR_ISLAND_CENTER.z + p.lz)}
                    r={3.8 * invZoom}
                    fill={p.accentHex}
                    stroke="#0F172A"
                    strokeWidth={1.2 * invZoom}
                  />
                ))}
                {/* 4 Bigger Surrounding Auto-Opening Perimeter Gates */}
                {DINOSAUR_PERIMETER_GATES.map((g) => (
                  <g
                    key={g.id}
                    transform={`translate(${worldToAtlasX(
                      DINOSAUR_ISLAND_CENTER.x + g.lx
                    )}, ${worldToAtlasY(
                      DINOSAUR_ISLAND_CENTER.z + g.lz
                    )}) rotate(${((g.angle - Math.PI * 0.5) * 180) / Math.PI})`}
                  >
                    <rect
                      x={-7.5 * invZoom}
                      y={-2.8 * invZoom}
                      width={15 * invZoom}
                      height={5.6 * invZoom}
                      rx={1.5 * invZoom}
                      fill="#FACC15"
                      stroke="#1E293B"
                      strokeWidth={1.1 * invZoom}
                    />
                  </g>
                ))}

                {/* Airport Runway 09 Vector Stripe */}
                <line
                  x1={worldToAtlasX(AIRPORT_RUNWAY_BOUNDS.minX)}
                  y1={worldToAtlasY((AIRPORT_RUNWAY_BOUNDS.minZ + AIRPORT_RUNWAY_BOUNDS.maxZ) * 0.5)}
                  x2={worldToAtlasX(AIRPORT_RUNWAY_BOUNDS.maxX)}
                  y2={worldToAtlasY((AIRPORT_RUNWAY_BOUNDS.minZ + AIRPORT_RUNWAY_BOUNDS.maxZ) * 0.5)}
                  stroke="#F8FAFC"
                  strokeOpacity="0.88"
                  strokeWidth={2.2 * invZoom}
                  strokeDasharray={`${5 * invZoom} ${3.5 * invZoom}`}
                />
              </g>

              {/* Transit Infrastructure Layer (Railway, Bus Loop, Metro M1, Cave Entrances) */}
              {showTransit && (
                <g pointerEvents="none">
                  {/* Bus Road Loop */}
                  <path
                    d={busPath}
                    fill="none"
                    stroke="#2DD4BF"
                    strokeWidth={1.6 * invZoom}
                    strokeDasharray={`${4 * invZoom} ${3 * invZoom}`}
                    strokeOpacity="0.72"
                  />

                  {/* Curved Dreamline Scenic Railway (dark sleeper casing + warm amber rail) */}
                  <path
                    d={railPath}
                    fill="none"
                    stroke="#0B111C"
                    strokeWidth={4.2 * invZoom}
                    strokeOpacity="0.65"
                  />
                  <path
                    d={railPath}
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth={2.1 * invZoom}
                    strokeOpacity="0.95"
                  />

                  {/* Underground Metro Line M1 */}
                  {METRO_SURFACE_ENTRANCES.length >= 2 && (
                    <path
                      d={METRO_SURFACE_ENTRANCES.map(
                        (m, idx) =>
                          `${idx === 0 ? 'M' : 'L'} ${worldToAtlasX(m.surfaceX).toFixed(
                            1
                          )} ${worldToAtlasY(m.surfaceZ).toFixed(1)}`
                      ).join(' ')}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth={2.0 * invZoom}
                      strokeDasharray={`${4 * invZoom} ${3 * invZoom}`}
                      strokeOpacity="0.9"
                    />
                  )}
                  {METRO_SURFACE_ENTRANCES.map((m) => (
                    <g
                      key={m.id}
                      transform={`translate(${worldToAtlasX(m.surfaceX)}, ${worldToAtlasY(
                        m.surfaceZ
                      )})`}
                    >
                      <circle
                        r={5.2 * invZoom}
                        fill="#0891B2"
                        stroke="#F0F9FF"
                        strokeWidth={1.2 * invZoom}
                      />
                      <text
                        x={0}
                        y={2.3 * invZoom}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={6.5 * invZoom}
                        fontWeight="800"
                      >
                        M
                      </text>
                    </g>
                  ))}

                  {/* Railway Station Dots */}
                  {STATIONS.map((st) => (
                    <circle
                      key={st.id}
                      cx={worldToAtlasX(st.worldX)}
                      cy={worldToAtlasY(st.worldZ)}
                      r={3.5 * invZoom}
                      fill={st.isDinosaurIsland ? '#FEF08A' : '#FFFFFF'}
                      stroke={st.connectsToIceland ? '#0284C7' : '#B45309'}
                      strokeWidth={1.5 * invZoom}
                    />
                  ))}

                  {/* 5 Frozen Kingdom Crystal Cave Entrances */}
                  {CAVE_ENTRANCES.map((ce) => (
                    <circle
                      key={ce.id}
                      cx={worldToAtlasX(ce.surfaceX)}
                      cy={worldToAtlasY(ce.surfaceZ)}
                      r={3.0 * invZoom}
                      fill="#67E8F9"
                      stroke="#083344"
                      strokeWidth={1.1 * invZoom}
                    />
                  ))}
                </g>
              )}

              {/* Live GPS Navigation Route Line & Target Beacon */}
              {hud.navigation && navPathD && (
                <g data-testid="map-live-nav-line" pointerEvents="none">
                  <path
                    d={navPathD}
                    fill="none"
                    stroke="#083344"
                    strokeWidth={5.2 * invZoom}
                    strokeOpacity="0.65"
                    strokeLinecap="round"
                  />
                  <path
                    d={navPathD}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth={2.8 * invZoom}
                    strokeDasharray={`${7 * invZoom} ${4.5 * invZoom}`}
                    strokeLinecap="round"
                  />
                  <g
                    transform={`translate(${worldToAtlasX(hud.navigation.target.x)}, ${worldToAtlasY(
                      hud.navigation.target.z
                    )})`}
                  >
                    <circle
                      r={12 * invZoom}
                      fill="#22D3EE"
                      fillOpacity="0.22"
                      stroke="#67E8F9"
                      strokeWidth={1.6 * invZoom}
                    />
                    <circle
                      r={4.2 * invZoom}
                      fill="#CFFAFE"
                      stroke="#083344"
                      strokeWidth={1.4 * invZoom}
                    />
                  </g>
                </g>
              )}

              {/* Selected Custom Pin Halo */}
              {selected.isCustom && (
                <g
                  pointerEvents="none"
                  transform={`translate(${worldToAtlasX(selected.x)}, ${worldToAtlasY(selected.z)})`}
                >
                  <circle
                    r={11 * invZoom}
                    fill="#38BDF8"
                    fillOpacity="0.22"
                    stroke="#7DD3FC"
                    strokeWidth={1.6 * invZoom}
                  />
                  <circle
                    r={4.2 * invZoom}
                    fill="#F8FAFC"
                    stroke="#0284C7"
                    strokeWidth={1.6 * invZoom}
                  />
                </g>
              )}

              {/* Interactive Landmark Pins with Constant-Size Crisp Typography */}
              {ATLAS_PINS.map((pin) => {
                const ax = worldToAtlasX(pin.x);
                const ay = worldToAtlasY(pin.z);
                const isSelected = selected.id === pin.id;
                const isHovered = hoveredPinId === pin.id;
                const showLabel =
                  showLabels && (camera.zoom >= pin.minLabelZoom || isSelected || isHovered);

                return (
                  <g
                    key={pin.id}
                    data-atlas-pin="true"
                    data-testid={pin.testId ?? `map-pin-${pin.id}`}
                    transform={`translate(${ax.toFixed(1)}, ${ay.toFixed(1)})`}
                    onMouseEnter={() => setHoveredPinId(pin.id)}
                    onMouseLeave={() => setHoveredPinId((cur) => (cur === pin.id ? null : cur))}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPin(pin);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Generous invisible hit circle for effortless clicking */}
                    <circle r={13 * invZoom} fill="transparent" />

                    {/* Selection / Hover Ring */}
                    {(isSelected || isHovered) && (
                      <circle
                        r={(isSelected ? 11.5 : 9.5) * invZoom}
                        fill={pin.accent}
                        fillOpacity={isSelected ? 0.28 : 0.18}
                        stroke={pin.accent}
                        strokeWidth={1.6 * invZoom}
                      />
                    )}

                    {/* Clean Geometric Cartographic Marker */}
                    {pin.category === 'home' ? (
                      <rect
                        x={-5 * invZoom}
                        y={-5 * invZoom}
                        width={10 * invZoom}
                        height={10 * invZoom}
                        rx={2.2 * invZoom}
                        fill={pin.accent}
                        stroke="#0B111C"
                        strokeWidth={1.6 * invZoom}
                      />
                    ) : pin.category === 'realm' ? (
                      <polygon
                        points={`0,${-6.5 * invZoom} ${6 * invZoom},0 0,${6.5 * invZoom} ${-6 * invZoom},0`}
                        fill={hud.midnightFrontierOpen ? '#FDE047' : pin.accent}
                        stroke="#0B111C"
                        strokeWidth={1.5 * invZoom}
                      />
                    ) : (
                      <circle
                        r={(isSelected ? 5.8 : 4.8) * invZoom}
                        fill={pin.accent}
                        stroke="#0B111C"
                        strokeWidth={1.6 * invZoom}
                      />
                    )}

                    {/* Crisp Haloed Label (100% legible over snow, sand, jungle & ocean) */}
                    {showLabel && (
                      <text
                        x={(pin.labelDx ?? 0) * invZoom}
                        y={(pin.labelDy ?? -9.5) * invZoom}
                        textAnchor={pin.labelAnchor ?? 'middle'}
                        fill={isSelected ? '#FFFFFF' : '#F8FAFC'}
                        stroke="#070D17"
                        strokeWidth={3.2 * invZoom}
                        strokeLinejoin="round"
                        style={{ paintOrder: 'stroke' }}
                        fontSize={(isSelected ? 11.2 : 10.0) * invZoom}
                        fontWeight={isSelected || pin.minLabelZoom <= 1.0 ? '700' : '600'}
                        filter="url(#atlas-label-shadow)"
                        pointerEvents="none"
                      >
                        {pin.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Live Moving Vehicles & Player Beacon */}
              {showVehicles && (
                <g pointerEvents="none">
                  {/* Live Train */}
                  <g
                    transform={`translate(${worldToAtlasX(hud.train.worldX)}, ${worldToAtlasY(
                      hud.train.worldZ
                    )})`}
                  >
                    <rect
                      x={-5.5 * invZoom}
                      y={-3.5 * invZoom}
                      width={11 * invZoom}
                      height={7 * invZoom}
                      rx={2 * invZoom}
                      fill="#FB923C"
                      stroke="#0B111C"
                      strokeWidth={1.4 * invZoom}
                    />
                  </g>
                  {/* Live Bus */}
                  <g
                    transform={`translate(${worldToAtlasX(hud.bus.worldX)}, ${worldToAtlasY(
                      hud.bus.worldZ
                    )})`}
                  >
                    <rect
                      x={-4.8 * invZoom}
                      y={-3 * invZoom}
                      width={9.6 * invZoom}
                      height={6 * invZoom}
                      rx={1.6 * invZoom}
                      fill="#2DD4BF"
                      stroke="#0B111C"
                      strokeWidth={1.3 * invZoom}
                    />
                  </g>
                  {/* Live Sky Taxi */}
                  <g
                    transform={`translate(${worldToAtlasX(hud.skyTaxi.x)}, ${worldToAtlasY(
                      hud.skyTaxi.z
                    )})`}
                  >
                    <polygon
                      points={`0,${-5.5 * invZoom} ${5 * invZoom},${3.5 * invZoom} ${-5 * invZoom},${3.5 * invZoom}`}
                      fill="#FACC15"
                      stroke="#0B111C"
                      strokeWidth={1.3 * invZoom}
                    />
                  </g>
                  {/* Live Sky Explorer */}
                  <g
                    transform={`translate(${worldToAtlasX(hud.skyExplorer.x)}, ${worldToAtlasY(
                      hud.skyExplorer.z
                    )})`}
                  >
                    <polygon
                      points={`0,${-5.5 * invZoom} ${5 * invZoom},${3.5 * invZoom} ${-5 * invZoom},${3.5 * invZoom}`}
                      fill="#38BDF8"
                      stroke="#0B111C"
                      strokeWidth={1.3 * invZoom}
                    />
                  </g>
                  {/* Live 49cc Petrol Dirt Bike */}
                  <g
                    transform={`translate(${worldToAtlasX(hud.expedition.dirtBike.x)}, ${worldToAtlasY(
                      hud.expedition.dirtBike.z
                    )})`}
                  >
                    <circle
                      r={4.2 * invZoom}
                      fill="#FF5C00"
                      stroke="#FFFFFF"
                      strokeWidth={1.3 * invZoom}
                    />
                  </g>
                </g>
              )}

              {/* Player ("You") Live Position + Directional Heading Cone */}
              <g
                pointerEvents="none"
                transform={`translate(${worldToAtlasX(hud.playerX)}, ${worldToAtlasY(hud.playerZ)})`}
              >
                <g transform={`rotate(${playerHeadingDeg.toFixed(1)})`}>
                  <path
                    d={`M 0 0 L ${20 * invZoom} ${-9 * invZoom} A ${22 * invZoom} ${22 * invZoom} 0 0 1 ${20 * invZoom} ${9 * invZoom} Z`}
                    fill="url(#player-heading-grad)"
                  />
                </g>
                <circle r={9 * invZoom} fill="#5EEAD4" fillOpacity="0.28" />
                <circle
                  r={4.8 * invZoom}
                  fill="#5EEAD4"
                  stroke="#042F2E"
                  strokeWidth={1.8 * invZoom}
                />
                <text
                  x={0}
                  y={16 * invZoom}
                  textAnchor="middle"
                  fill="#99F6E4"
                  stroke="#042F2E"
                  strokeWidth={2.8 * invZoom}
                  style={{ paintOrder: 'stroke' }}
                  fontSize={9.5 * invZoom}
                  fontWeight="800"
                >
                  YOU
                </text>
              </g>
            </svg>

            {/* TOP-LEFT OVERLAY: Region Quick-Focus Strip */}
            <div className="absolute top-3 left-3 right-16 flex flex-wrap items-center gap-1.5 pointer-events-none">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0B111C]/84 backdrop-blur-md border border-white/12 shadow-lg pointer-events-auto">
                {ATLAS_REGION_PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`map-preset-${preset.id}`}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-semibold'
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TOP-RIGHT OVERLAY: Crisp Compass Rose + Layer Toggles */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none">
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-[#0B111C]/84 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center shadow-lg"
              >
                <span className="text-[10px] font-bold text-amber-300 leading-none">N</span>
                <Compass className="w-4 h-4 text-slate-300 mt-0.5" />
              </div>

              <div className="flex flex-col gap-1 p-1 rounded-xl bg-[#0B111C]/84 backdrop-blur-md border border-white/12 shadow-lg pointer-events-auto">
                <button
                  type="button"
                  title="Toggle Transit & Cave Layers"
                  onClick={() => setShowTransit((v) => !v)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                    showTransit ? 'bg-white/14 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3 text-amber-300" />
                  <span>Transit</span>
                </button>
                <button
                  type="button"
                  title="Toggle Live Vehicles"
                  onClick={() => setShowVehicles((v) => !v)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                    showVehicles ? 'bg-white/14 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bike className="w-3 h-3 text-orange-400" />
                  <span>Craft</span>
                </button>
                <button
                  type="button"
                  title="Toggle Place Labels"
                  onClick={() => setShowLabels((v) => !v)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                    showLabels ? 'bg-white/14 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-cyan-300" />
                  <span>Labels</span>
                </button>
              </div>
            </div>

            {/* BOTTOM-LEFT OVERLAY: Metric Scale Bar, Live Coords & Compact Legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-end gap-2 pointer-events-none">
              <div className="px-3 py-2 rounded-xl bg-[#0B111C]/84 backdrop-blur-md border border-white/12 shadow-lg flex items-center gap-3.5 text-[11px] text-slate-200">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-300 tabular-nums leading-none">
                    <span>0</span>
                    <span className="font-semibold text-white">{scaleBar.label}</span>
                  </div>
                  <div
                    className="h-1.5 border-x border-b border-white/80 bg-white/15"
                    style={{ width: `${scaleBar.widthPx}px` }}
                  />
                </div>
                <div className="h-5 w-px bg-white/15" />
                <div className="text-[11px] text-slate-300 font-mono tabular-nums whitespace-nowrap">
                  {cursorWorld
                    ? `X ${cursorWorld.x} · Z ${cursorWorld.z}`
                    : `You (${Math.round(hud.playerX)}, ${Math.round(hud.playerZ)})`}
                </div>
                <div className="hidden xl:flex items-center gap-2.5 text-[10px] text-slate-300 border-l border-white/15 pl-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#5EEAD4]" /> You
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-[#FBBF24]" /> Rail
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF5C00]" /> 49cc Bike
                  </span>
                  <span className="text-slate-400">Drag to pan · Scroll to zoom · Click to pin</span>
                </div>
              </div>
            </div>

            {/* BOTTOM-RIGHT OVERLAY: Crisp Zoom & Center Controls */}
            <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 p-1 rounded-xl bg-[#0B111C]/86 backdrop-blur-md border border-white/12 shadow-lg">
              <button
                type="button"
                aria-label="Zoom In"
                data-testid="map-zoom-in"
                onClick={() => handleZoomBy(1.35)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-100 hover:bg-white/12 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom Out"
                data-testid="map-zoom-out"
                onClick={() => handleZoomBy(1 / 1.35)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-100 hover:bg-white/12 cursor-pointer transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="h-px bg-white/12 mx-1" />
              <button
                type="button"
                aria-label="Center on Player"
                title="Center on Player"
                data-testid="map-center-player"
                onClick={handleCenterOnPlayer}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-teal-300 hover:bg-white/12 cursor-pointer transition-colors"
              >
                <LocateFixed className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Fit Full World"
                title="Fit Full World"
                data-testid="map-fit-world"
                onClick={() => handleSelectPreset('full')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:bg-white/12 cursor-pointer transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT: Clean Inspector Card + 3-Tab Directory */}
          <aside className="lg:col-span-4 flex flex-col min-h-0 bg-[#111927] border-t lg:border-t-0 lg:border-l border-white/10">
            {/* Selected Place Inspector */}
            <div
              data-testid="map-selected-inspector"
              className="p-4 border-b border-white/10 bg-[#151F30] shrink-0 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{selected.regionLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-cyan-300 font-medium">
                      {formatDistanceMeters(selectedDist)} away
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate mt-0.5">
                    {selected.name}
                  </h3>
                  {selected.subtitle && (
                    <div className="text-[11px] text-slate-400 truncate">{selected.subtitle}</div>
                  )}
                </div>
                <button
                  type="button"
                  title="Focus on map"
                  onClick={() => focusPoint(selected.x, selected.z, 2.6)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/12 text-slate-300 cursor-pointer shrink-0 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {selected.description}
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  data-testid="map-inspector-nav"
                  onClick={() => {
                    onSetNavigation({
                      id: selected.id,
                      label: selected.name,
                      tamilLabel: selected.subtitle,
                      x: selected.teleportX,
                      z: selected.teleportZ,
                    });
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500/18 hover:bg-cyan-500/28 border border-cyan-400/40 text-xs font-semibold text-cyan-100 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </button>
                {selected.busReachable && (
                  <button
                    type="button"
                    onClick={() => {
                      onCallBus({
                        id: selected.id,
                        label: selected.name,
                        tamilLabel: selected.subtitle,
                        x: selected.teleportX,
                        z: selected.teleportZ,
                      });
                      onClose();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/6 hover:bg-white/12 border border-white/12 text-xs font-medium text-slate-100 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Bus className="w-3.5 h-3.5 text-teal-300" />
                    <span>Bus</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="map-inspector-go"
                  onClick={() => {
                    onTeleport(selected.teleportX, selected.teleportZ, selected.name);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Fast Travel</span>
                </button>
              </div>
            </div>

            {/* Segmented 3-Tab Directory Selector */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0B111C] border border-white/8">
                {(
                  [
                    { id: 'places', label: 'Places' },
                    { id: 'craft', label: 'Craft & Rail' },
                    { id: 'realms', label: 'Realms' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`map-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1D2A40] text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2">
              {activeTab === 'places' && (
                <>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter islands, stations, landmarks..."
                      data-testid="map-search-input"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0B111C] border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>

                  <div className="divide-y divide-white/8">
                    {directoryPlaces.map((place) => {
                      const isSel = selected.id === place.id;
                      return (
                        <div
                          key={place.id}
                          onClick={() => {
                            setSelected({
                              id: place.id,
                              name: place.name,
                              subtitle: place.subtitle,
                              regionLabel: place.regionLabel,
                              description: place.description,
                              x: place.x,
                              z: place.z,
                              teleportX: place.teleportX,
                              teleportZ: place.teleportZ,
                              busReachable: place.busReachable,
                            });
                            focusPoint(place.x, place.z, place.isDino ? 1.65 : 2.65);
                          }}
                          className={`py-2.5 px-2 -mx-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            isSel ? 'bg-white/8' : 'hover:bg-white/4'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-100 truncate">
                              {place.isHome && (
                                <Home className="w-3 h-3 text-amber-300 shrink-0" />
                              )}
                              <span className="truncate">{place.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                              <span className="truncate">{place.subtitle}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums shrink-0">
                                {formatDistanceMeters(place.distanceM)}
                              </span>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title={`Navigate to ${place.name}`}
                              data-testid={`map-nav-${place.id}`}
                              onClick={() => {
                                onSetNavigation({
                                  id: place.id,
                                  label: place.name,
                                  tamilLabel: place.subtitle,
                                  x: place.teleportX,
                                  z: place.teleportZ,
                                });
                                onClose();
                              }}
                              className="px-2 py-1 rounded-md bg-white/5 hover:bg-cyan-500/25 border border-white/10 hover:border-cyan-400/40 text-[11px] font-medium text-cyan-200 cursor-pointer transition-colors"
                            >
                              Nav
                            </button>
                            <button
                              type="button"
                              title={`Fast travel to ${place.name}`}
                              data-testid={`map-go-${place.id}`}
                              onClick={() => {
                                onTeleport(place.teleportX, place.teleportZ, place.name);
                                onClose();
                              }}
                              className="px-2 py-1 rounded-md bg-amber-400/15 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/30 text-[11px] font-semibold text-amber-200 cursor-pointer transition-colors"
                            >
                              Go
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab === 'craft' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-2">
                      Rail &amp; Aviation
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="map-enter-metro-btn"
                        onClick={() => {
                          onEnterUndergroundMetro();
                          onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <TrainFront className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span className="truncate">Underground Metro</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-fly-airliner-btn"
                        onClick={() => {
                          onBoardAirliner();
                          onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Plane className="w-4 h-4 text-sky-300 shrink-0" />
                        <span className="truncate">Fly DL-787 Jet</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-board-sky-home-btn"
                        onClick={() => onBoardSkyExplorer('home')}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Wind className="w-4 h-4 text-sky-300 shrink-0" />
                        <span className="truncate">Sky · Home Pad</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-board-sky-avs-btn"
                        onClick={() => onBoardSkyExplorer('avs')}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Wind className="w-4 h-4 text-sky-300 shrink-0" />
                        <span className="truncate">Sky · AVS Pad</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-board-sky-taxi-btn"
                        onClick={() => {
                          onBoardSkyTaxi();
                          onClose();
                        }}
                        className="col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Plane className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Board Yellow Sky Taxi</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-2">
                      Maritime Fleet &amp; Road
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="map-board-submarine-btn"
                        onClick={() => {
                          onBoardSubmarine();
                          onClose();
                        }}
                        className="col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-400/12 hover:bg-amber-400/20 border border-amber-400/35 text-xs font-semibold text-amber-100 cursor-pointer transition-colors"
                      >
                        <Ship className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Kadalkarai Submarine (Dive Underwater)</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-board-sovereign-btn"
                        onClick={() => onBoardBoat('sovereign_ship')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Ship className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>Tall Ship</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-board-catamaran-btn"
                        onClick={() => onBoardBoat('bamboo_catamaran')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Ship className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                        <span>Catamaran</span>
                      </button>
                      <button
                        type="button"
                        data-testid="map-board-outrigger-btn"
                        onClick={() => onBoardBoat('tribal_outrigger')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Ship className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                        <span>Outrigger</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onBoardBoat('lake_boat')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Ship className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                        <span>Lake Boat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onBoardBoat('coastal_boat')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Ship className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                        <span>Ocean Boat</span>
                      </button>
                      <button
                        type="button"
                        onClick={onDriveCamper}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#182234] hover:bg-[#202E45] border border-white/10 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                      >
                        <Car className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                        <span>Olga Van</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'realms' && (
                <div className="space-y-3 pt-1">
                  {/* Night-Only Midnight Frontier */}
                  <div
                    data-testid="map-midnight-frontier-card"
                    className="rounded-xl border border-white/10 bg-[#161E31] p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MoonStar className="w-4 h-4 text-amber-300" />
                        <span className="text-xs font-semibold text-white">
                          The Midnight Frontier
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {hud.midnightFrontierOpen ? 'Open now' : 'Opens at night'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      At night, its sky beacon glows from any distance. Walk into the portal to enter the realm.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-testid="map-visit-midnight-frontier-btn"
                        onClick={() => {
                          onTeleportMidnightFrontier();
                          onClose();
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Visit Night Portal</span>
                      </button>
                      {!hud.midnightFrontierOpen ? (
                        <button
                          type="button"
                          data-testid="map-switch-night-btn"
                          onClick={onToggleNightMode}
                          className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/14 border border-white/12 text-xs font-medium text-slate-100 cursor-pointer transition-colors"
                        >
                          Night [N]
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSetNavigation({
                              id: 'midnight_frontier',
                              label: 'Midnight Frontier Portal',
                              x: MIDNIGHT_FRONTIER_PORTAL_POS.x,
                              z: MIDNIGHT_FRONTIER_PORTAL_POS.z,
                            });
                            onClose();
                          }}
                          className="px-3 py-2 rounded-lg bg-cyan-500/18 hover:bg-cyan-500/28 border border-cyan-400/35 text-xs font-medium text-cyan-100 cursor-pointer transition-colors"
                        >
                          Nav
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="map-enter-caves-btn"
                    onClick={() => {
                      onEnterCaves();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-[#182234] hover:bg-[#202E45] border border-white/10 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MountainSnow className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          Frozen Kingdom Underground Caves
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          6 interconnected luminous crystal caverns
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-cyan-300 shrink-0">Enter</span>
                  </button>

                  <button
                    type="button"
                    data-testid="map-visit-thar-desert-btn"
                    onClick={() => {
                      onTeleport(
                        DESERT_OASIS_SPAWN.x,
                        DESERT_OASIS_SPAWN.z,
                        'Thar Golden Desert Oasis'
                      );
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-[#182234] hover:bg-[#202E45] border border-white/10 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Compass className="w-4 h-4 text-amber-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          Thar Desert Oasis &amp; Grand Pyramid
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Golden dunes, emerald lagoon &amp; solar chamber
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-300 shrink-0">Visit</span>
                  </button>

                  <button
                    type="button"
                    data-testid="map-visit-exhibition-btn"
                    onClick={() => {
                      onTeleport(
                        EXHIBITION_PLAZA_SPAWN.x,
                        EXHIBITION_PLAZA_SPAWN.z,
                        'Universal Mobility Exhibition'
                      );
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-[#182234] hover:bg-[#202E45] border border-white/10 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          Ocean Transportation Exhibition
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Offshore dealership, aviation hangar &amp; marina
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-300 shrink-0">Visit</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
