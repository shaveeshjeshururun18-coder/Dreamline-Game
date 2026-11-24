import React, { useMemo } from 'react';
import {
  Bus,
  Car,
  Clock,
  Compass,
  Home,
  MoonStar,
  MountainSnow,
  Navigation,
  Plane,
  Ship,
  Sparkles,
  TrainFront,
  Wind,
  X,
} from 'lucide-react';
import type { BoatId, HudSnapshot } from '../game/types';
import {
  ENCHANTED_FOREST_CENTER,
  FROZEN_LAKE_CENTER,
  HOME_CENTER,
  LAKE_CENTER,
  LOCATIONS,
  SCENIC_SPOTS,
  WATERFALL_CENTER,
} from '../game/terrain';
import { sampleRailway, STATIONS } from '../game/railway';
import { sampleBusRoad } from '../game/vehicles';
import { GIANT_IGLOO_MAN_POS } from '../game/iceland';
import { DINOSAUR_ISLAND_CENTER } from '../game/dinosaurIsland';
import {
  AVS_SNOW_HOUSE_CENTER,
  CAVE_ENTRANCES,
  FROZEN_MIRROR_LAKE_CENTER,
  FROZEN_MIRROR_LAKE_RX,
  FROZEN_MIRROR_LAKE_RZ,
} from '../game/frozenKingdom';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from '../game/midnightFrontier';
import {
  EXHIBITION_ISLAND_CENTER,
  EXHIBITION_PLAZA_SPAWN,
} from '../game/exhibitionComplex';
import {
  DESERT_BIOME_CENTER,
  DESERT_HELIPAD_POS,
  DESERT_OASIS_CENTER,
  DESERT_OASIS_RX,
  DESERT_OASIS_RZ,
  DESERT_OASIS_SPAWN,
  DESERT_PYRAMID_CENTER,
} from '../game/desertOasis';
import { sampleNavigationPath, type NavigationTarget } from '../game/navigation';
import type { BusRideDestination } from '../game/busHailing';
import type { SkyExplorerPadId } from '../game/skyExplorer';
import {
  AIRPORT_CENTER,
  METRO_SURFACE_ENTRANCES,
} from '../game/airportMetro';

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
  onBoardSkyExplorer: (pad?: SkyExplorerPadId) => void;
  onBoardSkyTaxi: () => void;
  onDriveCamper: () => void;
  onEnterUndergroundMetro: () => void;
  onBoardAirliner: () => void;
  onTeleportMidnightFrontier: () => void;
  onClose: () => void;
}

// Fits NW Frozen Kingdom (-260,-240), Dinosaur Island (296,128), AND Ocean Exhibition Island (204,256) cleanly in 480x420
const MAP_ORIGIN_X = 212;
const MAP_ORIGIN_Y = 198;
const MAP_SCALE = 0.6;

function toMapX(x: number): number {
  return MAP_ORIGIN_X + x * MAP_SCALE;
}
function toMapY(z: number): number {
  return MAP_ORIGIN_Y + z * MAP_SCALE;
}
function fromMapX(sx: number): number {
  return (sx - MAP_ORIGIN_X) / MAP_SCALE;
}
function fromMapY(sy: number): number {
  return (sy - MAP_ORIGIN_Y) / MAP_SCALE;
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
  onBoardSkyExplorer,
  onBoardSkyTaxi,
  onDriveCamper,
  onEnterUndergroundMetro,
  onBoardAirliner,
  onTeleportMidnightFrontier,
  onClose,
}) => {
  const railPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const s = sampleRailway(i / steps);
      pts.push(`${i === 0 ? 'M' : 'L'} ${toMapX(s.x).toFixed(1)} ${toMapY(s.z).toFixed(1)}`);
    }
    return pts.join(' ') + ' Z';
  }, []);

  const busPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const s = sampleBusRoad(i / steps);
      pts.push(`${i === 0 ? 'M' : 'L'} ${toMapX(s.x).toFixed(1)} ${toMapY(s.z).toFixed(1)}`);
    }
    return pts.join(' ') + ' Z';
  }, []);

  const navPathD = useMemo(() => {
    if (!hud.navigation) return null;
    const pts = sampleNavigationPath(
      hud.playerX,
      hud.playerZ,
      hud.navigation.target.x,
      hud.navigation.target.z,
      14
    );
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toMapX(p.x).toFixed(1)} ${toMapY(p.z).toFixed(1)}`)
      .join(' ');
  }, [hud.navigation, hud.playerX, hud.playerZ]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * 480;
    const sy = ((e.clientY - rect.top) / rect.height) * 420;
    const wx = Math.round(fromMapX(sx));
    const wz = Math.round(fromMapY(sy));
    onSetNavigation({
      id: `custom_${wx}_${wz}`,
      label: `Map Pin (${wx}, ${wz})`,
      x: wx,
      z: wz,
    });
  };

  const discoveredSet = new Set(hud.discoveredSpotIds);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dreamline World Atlas and Live GPS Navigation"
      data-testid="world-map-modal"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#120E20]/84 p-3 md:p-6"
    >
      <div className="w-full max-w-6xl rounded-xl bg-[#1A152C] border border-[#F5D6C0]/25 text-[#FAF5EF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-[#F5D6C0]/15">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold tracking-wide">
              Dreamline World Atlas & Live GPS Navigation
            </h2>
            <p className="text-xs text-[#DFC8BC] mt-0.5">
              Click anywhere on the map or pick a place to show a live 3D navigation arrow &amp; line · {discoveredSet.size}/{SCENIC_SPOTS.length} vistas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hud.navigation && (
              <button
                type="button"
                onClick={onClearNavigation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/45 text-xs font-medium text-cyan-100 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Clear Route ({Math.round(hud.navigation.distanceMeters)}m)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTransitMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2A2245] hover:bg-[#3A2F5E] border border-[#F4BE98]/40 text-xs font-medium text-[#FCE2C8] cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#F4BE98]" />
              <span>Bus &amp; Train Timings</span>
            </button>
            <button
              type="button"
              aria-label="Close Map"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#2A2242] text-[#F2E5DC] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Illustrated Expanded SVG World Map (Clickable for Live GPS Waypoints!) */}
          <div className="md:col-span-7 p-4 bg-[#151125] flex flex-col items-center justify-center gap-2.5">
            <svg
              viewBox="0 0 480 420"
              onClick={handleSvgClick}
              data-testid="world-map-svg"
              className="w-full max-w-[520px] h-auto rounded-lg bg-[#1F1A36] border border-[#F5D6C0]/18 cursor-crosshair"
            >
              {/* Expanded Frozen Kingdom Snow Biome (NW) */}
              <ellipse
                cx={toMapX(-158)}
                cy={toMapY(-150)}
                rx="96"
                ry="88"
                fill="#DDE8F7"
                fillOpacity="0.18"
                stroke="#B8DCF8"
                strokeOpacity="0.3"
                strokeDasharray="4 3"
              />
              {/* Original Panimalai Frozen Lake */}
              <ellipse
                cx={toMapX(FROZEN_LAKE_CENTER.x)}
                cy={toMapY(FROZEN_LAKE_CENTER.z)}
                rx="15"
                ry="12"
                fill="#8FC5E6"
                fillOpacity="0.52"
                stroke="#D9F0FF"
                strokeWidth="1"
              />
              {/* Expanded Frozen Mirror Lake */}
              <ellipse
                cx={toMapX(FROZEN_MIRROR_LAKE_CENTER.x)}
                cy={toMapY(FROZEN_MIRROR_LAKE_CENTER.z)}
                rx={FROZEN_MIRROR_LAKE_RX * MAP_SCALE}
                ry={FROZEN_MIRROR_LAKE_RZ * MAP_SCALE}
                fill="#73C5EA"
                fillOpacity="0.56"
                stroke="#E0F6FF"
                strokeWidth="1.2"
              />
              <text
                x={toMapX(-168)}
                y={toMapY(-225)}
                textAnchor="middle"
                fill="#E0F2FE"
                fontSize="9.5"
                fontWeight="700"
              >
                THE FROZEN KINGDOM &amp; 6-AREA CAVES
              </text>

              {/* Expanded AVS Snow Residence Landmark */}
              <g transform={`translate(${toMapX(AVS_SNOW_HOUSE_CENTER.x)}, ${toMapY(AVS_SNOW_HOUSE_CENTER.z)})`}>
                <rect x="-5.5" y="-5.5" width="11" height="11" rx="2" fill="#FDE047" stroke="#1E293B" strokeWidth="1.3" />
                <text x="0" y="-8.5" textAnchor="middle" fill="#FEF08A" fontSize="7.6" fontWeight="700">
                  AVS Snow House
                </text>
              </g>

              {/* 5 Glowing Mountain Cave Entrances */}
              {CAVE_ENTRANCES.map((ce) => (
                <g key={ce.id} transform={`translate(${toMapX(ce.surfaceX)}, ${toMapY(ce.surfaceZ)})`}>
                  <circle r="4.8" fill="#22D3EE" fillOpacity="0.28" />
                  <circle r="2.7" fill="#67E8F9" stroke="#0F172A" strokeWidth="1" />
                </g>
              ))}

              {/* Giant Igloo Man Landmark */}
              <g transform={`translate(${toMapX(GIANT_IGLOO_MAN_POS.x)}, ${toMapY(GIANT_IGLOO_MAN_POS.z)})`}>
                <circle r="4.2" fill="#F2FAFF" stroke="#47B5E6" strokeWidth="1.4" />
              </g>

              {/* Pachai Vayal Green Countryside & Waterfall (South) */}
              <ellipse cx={toMapX(-14)} cy={toMapY(92)} rx="62" ry="38" fill="#467E56" fillOpacity="0.22" />
              <circle
                cx={toMapX(WATERFALL_CENTER.x)}
                cy={toMapY(WATERFALL_CENTER.z)}
                r="6.5"
                fill="#4CC3D9"
                fillOpacity="0.72"
              />
              <text x={toMapX(-26)} y={toMapY(128)} textAnchor="middle" fill="#BBEAD1" fontSize="8.5" fontWeight="600">
                Pachai Vayal Waterfall
              </text>

              {/* Thar Golden Desert Oasis & Grand Pyramid Ruins (Southwest Expanse) */}
              <ellipse
                cx={toMapX(DESERT_BIOME_CENTER.x)}
                cy={toMapY(DESERT_BIOME_CENTER.z)}
                rx="66"
                ry="54"
                fill="#D99B4E"
                fillOpacity="0.32"
                stroke="#F6C873"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <ellipse
                cx={toMapX(DESERT_OASIS_CENTER.x)}
                cy={toMapY(DESERT_OASIS_CENTER.z)}
                rx={DESERT_OASIS_RX * MAP_SCALE}
                ry={DESERT_OASIS_RZ * MAP_SCALE}
                fill="#1FA896"
                fillOpacity="0.72"
                stroke="#8FF4E1"
                strokeWidth="1.2"
              />
              {/* Grand Sandstone Pyramid Marker */}
              <g transform={`translate(${toMapX(DESERT_PYRAMID_CENTER.x)}, ${toMapY(DESERT_PYRAMID_CENTER.z)})`}>
                <polygon points="0,-9 10,7 -10,7" fill="#E8B85C" stroke="#5C3A16" strokeWidth="1.3" />
                <polygon points="0,-9 3,7 -10,7" fill="#C98F3B" fillOpacity="0.45" />
                <text x="0" y="17" textAnchor="middle" fill="#FFE6A8" fontSize="7.4" fontWeight="700">
                  Grand Pyramid
                </text>
              </g>
              {/* Desert Helipad Sky Pad */}
              <g transform={`translate(${toMapX(DESERT_HELIPAD_POS.x)}, ${toMapY(DESERT_HELIPAD_POS.z)})`}>
                <circle r="4.2" fill="#F59E0B" stroke="#1E293B" strokeWidth="1.1" />
                <text x="0" y="2.3" textAnchor="middle" fill="#0F172A" fontSize="5.5" fontWeight="800">
                  H
                </text>
              </g>
              <text
                x={toMapX(DESERT_BIOME_CENTER.x + 8)}
                y={toMapY(DESERT_BIOME_CENTER.z) - 60}
                textAnchor="middle"
                fill="#FDE68A"
                fontSize="8.8"
                fontWeight="700"
              >
                THAR GOLDEN DESERT OASIS
              </text>

              {/* Kadalkarai Turquoise Open Sea & Far-Offshore SSJ Dinosaur Island (E/SE) */}
              <path
                d={`M ${toMapX(118)} ${toMapY(-26)} Q ${toMapX(114)} ${toMapY(14)} ${toMapX(110)} ${toMapY(40)} Q ${toMapX(106)} ${toMapY(112)} ${toMapX(94)} 420 L 480 420 L 480 ${toMapY(-26)} Z`}
                fill="#1C7A93"
                fillOpacity="0.62"
                stroke="#7EE0EE"
                strokeWidth="1.2"
                strokeOpacity="0.58"
              />
              <circle cx={toMapX(114)} cy={toMapY(42)} r="3.6" fill="#FFE08C" stroke="#D94D43" strokeWidth="1.3" />
              <text x={toMapX(195)} y={toMapY(188)} textAnchor="middle" fill="#BDEFF7" fontSize="8.4" fontWeight="600">
                Open Sea (Long Crossing)
              </text>
              <text x={toMapX(202)} y={toMapY(42)} textAnchor="middle" fill="#FCE2C8" fontSize="7.4" fontWeight="600">
                Long Sea Railway Bridge
              </text>

              {/* Far-Offshore SSJ Dinosaur Island */}
              <circle
                cx={toMapX(DINOSAUR_ISLAND_CENTER.x)}
                cy={toMapY(DINOSAUR_ISLAND_CENTER.z)}
                r={30 * MAP_SCALE}
                fill="#445C3E"
                fillOpacity="0.92"
                stroke="#E5C891"
                strokeWidth="2.2"
              />
              <rect
                x={toMapX(DINOSAUR_ISLAND_CENTER.x) - 7}
                y={toMapY(DINOSAUR_ISLAND_CENTER.z) - 6}
                width="14"
                height="14"
                rx="2"
                fill="#293142"
                stroke="#FACC15"
                strokeWidth="1.2"
              />
              <text
                x={toMapX(DINOSAUR_ISLAND_CENTER.x)}
                y={toMapY(DINOSAUR_ISLAND_CENTER.z) + 30}
                textAnchor="middle"
                fill="#FDE047"
                fontSize="8.2"
                fontWeight="700"
              >
                SSJ Dinosaur Island
              </text>

              {/* Neelam Lake */}
              <ellipse
                cx={toMapX(LAKE_CENTER.x)}
                cy={toMapY(LAKE_CENTER.z)}
                rx={34 * MAP_SCALE}
                ry={26 * MAP_SCALE}
                fill="#355C8C"
                fillOpacity="0.78"
                stroke="#85B8E6"
                strokeWidth="1.1"
              />
              <text x={toMapX(48)} y={toMapY(-26)} textAnchor="middle" fill="#D4ECFF" fontSize="8" fontWeight="600">
                Neelam Lake
              </text>

              {/* Bus Road Loop */}
              <path
                d={busPath}
                fill="none"
                stroke="#63B4B8"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                strokeOpacity="0.75"
              />

              {/* Curved Railway Loop */}
              <path
                d={railPath}
                fill="none"
                stroke="#F5C5A3"
                strokeWidth="2.8"
                strokeOpacity="0.92"
              />

              {/* Stations */}
              {STATIONS.map((st) => {
                const isDesert = st.id === 'thar_desert_station';
                const isSnowSummit = st.id === 'panimalai_snow_station';
                return (
                  <g key={st.id} transform={`translate(${toMapX(st.worldX)}, ${toMapY(st.worldZ)})`}>
                    <circle
                      r={isDesert || isSnowSummit ? '4.2' : '3.8'}
                      fill={
                        st.isDinosaurIsland || isDesert
                          ? '#FEF08A'
                          : st.connectsToIceland
                          ? '#C5F3FF'
                          : '#FAF5EF'
                      }
                      stroke={
                        st.isDinosaurIsland || isDesert
                          ? '#D97706'
                          : st.connectsToIceland
                          ? '#2D9BD6'
                          : '#C85D51'
                      }
                      strokeWidth="1.6"
                    />
                    {isSnowSummit && (
                      <text x="6" y="-6" textAnchor="start" fill="#D4F4FF" fontSize="6.8" fontWeight="700">
                        Snow Stn
                      </text>
                    )}
                    {isDesert && (
                      <text x="-6" y="4" textAnchor="end" fill="#FDE68A" fontSize="6.8" fontWeight="700">
                        Desert Stn
                      </text>
                    )}
                  </g>
                );
              })}

              {/* En Illam Home */}
              <g transform={`translate(${toMapX(HOME_CENTER.x)}, ${toMapY(HOME_CENTER.z)})`}>
                <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.8" fill="#F4BE98" stroke="#1A152C" strokeWidth="1.2" />
                <text x="0" y="-7.5" textAnchor="middle" fill="#FCE2C8" fontSize="7.6" fontWeight="600">
                  En Illam
                </text>
              </g>

              {/* Enchanted Forest */}
              <circle
                cx={toMapX(ENCHANTED_FOREST_CENTER.x)}
                cy={toMapY(ENCHANTED_FOREST_CENTER.z)}
                r="17"
                fill="#D96EA8"
                fillOpacity="0.22"
                stroke="#F2B8DE"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <text
                x={toMapX(ENCHANTED_FOREST_CENTER.x)}
                y={toMapY(ENCHANTED_FOREST_CENTER.z) + 25}
                textAnchor="middle"
                fill="#F9C9E8"
                fontSize="7.6"
                fontWeight="600"
              >
                Mayavanam
              </text>

              {/* Ocean Exhibition Complex Island (Dealership + Hangar + Runway + Marina) */}
              <g
                data-testid="map-exhibition-island"
                transform={`translate(${toMapX(EXHIBITION_ISLAND_CENTER.x)}, ${toMapY(EXHIBITION_ISLAND_CENTER.z)})`}
              >
                <rect
                  x="-30"
                  y="-26"
                  width="60"
                  height="52"
                  rx="4"
                  fill="#475569"
                  stroke="#F5C36C"
                  strokeWidth="1.6"
                />
                <rect x="-22" y="-18" width="18" height="14" fill="#94A3B8" />
                <rect x="-2" y="-18" width="24" height="17" fill="#2563EB" fillOpacity="0.85" />
                <line x1="-2" y1="15" x2="25" y2="15" stroke="#E2E8F0" strokeWidth="1.6" strokeDasharray="3 2" />
                <text x="0" y="36" textAnchor="middle" fill="#FDE68A" fontSize="8" fontWeight="700">
                  Ocean Exhibition Complex
                </text>
              </g>

              {/* Dreamline International Airport (NE Plateau) */}
              <g
                data-testid="map-airport-marker"
                transform={`translate(${toMapX(AIRPORT_CENTER.x)}, ${toMapY(AIRPORT_CENTER.z)})`}
              >
                <rect
                  x="-32"
                  y="-16"
                  width="64"
                  height="32"
                  rx="4"
                  fill="#1E293B"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <line x1="-26" y1="7" x2="26" y2="7" stroke="#F8FAFC" strokeWidth="2.2" strokeDasharray="4 3" />
                <rect x="-18" y="-12" width="22" height="10" rx="1.5" fill="#38BDF8" fillOpacity="0.8" />
                <text x="0" y="-20" textAnchor="middle" fill="#7DD3FC" fontSize="8" fontWeight="700">
                  International Airport
                </text>
              </g>

              {/* Underground Metro Line M1 (Central <-> Airport) */}
              {METRO_SURFACE_ENTRANCES.length >= 2 && (
                <path
                  d={METRO_SURFACE_ENTRANCES.map(
                    (m, idx) =>
                      `${idx === 0 ? 'M' : 'L'} ${toMapX(m.surfaceX).toFixed(1)} ${toMapY(m.surfaceZ).toFixed(1)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="2.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.88"
                />
              )}
              {METRO_SURFACE_ENTRANCES.map((m) => (
                <g key={m.id} transform={`translate(${toMapX(m.surfaceX)}, ${toMapY(m.surfaceZ)})`}>
                  <circle r="4.5" fill="#0891B2" stroke="#E0F2FE" strokeWidth="1.2" />
                  <text x="0" y="2.4" textAnchor="middle" fill="#FFFFFF" fontSize="5.4" fontWeight="800">
                    M
                  </text>
                </g>
              ))}

              {/* Nighttime Midnight Frontier Portal Marker (Always clickable to teleport at Night) */}
              <g
                data-testid="map-midnight-frontier-marker"
                transform={`translate(${toMapX(MIDNIGHT_FRONTIER_PORTAL_POS.x)}, ${toMapY(MIDNIGHT_FRONTIER_PORTAL_POS.z)})`}
              >
                <circle
                  r={hud.midnightFrontierOpen ? '12' : '8'}
                  fill="#818CF8"
                  fillOpacity={hud.midnightFrontierOpen ? '0.35' : '0.16'}
                />
                <circle r="4.8" fill="#FDE68A" stroke="#4F46E5" strokeWidth="1.8" />
                <text x="0" y="16" textAnchor="middle" fill="#FDE68A" fontSize="8" fontWeight="700">
                  Midnight Portal
                </text>
              </g>

              {/* Live Animated GPS Navigation Line & Destination Beacon */}
              {hud.navigation && navPathD && (
                <g data-testid="map-live-nav-line">
                  <path
                    d={navPathD}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="3.2"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                  <g
                    transform={`translate(${toMapX(hud.navigation.target.x)}, ${toMapY(hud.navigation.target.z)})`}
                  >
                    <circle r="11" fill="#22D3EE" fillOpacity="0.24" stroke="#67E8F9" strokeWidth="1.5" />
                    <circle r="4.2" fill="#A5F3FC" stroke="#083344" strokeWidth="1.4" />
                  </g>
                </g>
              )}

              {/* Live Train, Bus, Sky Taxi, Camper & Player Markers */}
              <g transform={`translate(${toMapX(hud.train.worldX)}, ${toMapY(hud.train.worldZ)})`}>
                <rect x="-5.5" y="-3.5" width="11" height="7" rx="1.8" fill="#FFAD6B" stroke="#1A152C" strokeWidth="1.2" />
              </g>
              <g transform={`translate(${toMapX(hud.bus.worldX)}, ${toMapY(hud.bus.worldZ)})`}>
                <rect x="-5" y="-3" width="10" height="6" rx="1.5" fill="#52C4C4" stroke="#1A152C" strokeWidth="1.2" />
              </g>
              <g transform={`translate(${toMapX(hud.skyTaxi.x)}, ${toMapY(hud.skyTaxi.z)})`}>
                <polygon points="0,-5.5 5.2,3.5 -5.2,3.5" fill="#FACC15" stroke="#0C2433" strokeWidth="1.2" />
              </g>
              <g transform={`translate(${toMapX(hud.camper.x)}, ${toMapY(hud.camper.z)})`}>
                <rect x="-5" y="-3" width="10" height="6" rx="1.8" fill="#F29ED0" stroke="#2B1633" strokeWidth="1.2" />
              </g>
              <g transform={`translate(${toMapX(hud.skyExplorer.x)}, ${toMapY(hud.skyExplorer.z)})`}>
                <polygon points="0,-5.5 5,3.5 -5,3.5" fill="#5FE2FF" stroke="#0C2433" strokeWidth="1.2" />
              </g>
              <g transform={`translate(${toMapX(hud.playerX)}, ${toMapY(hud.playerZ)})`}>
                <circle r="6.5" fill="#7BE0C3" fillOpacity="0.32" />
                <circle r="3.8" fill="#9AF0D6" stroke="#161226" strokeWidth="1.4" />
              </g>
            </svg>

            {/* Compact Map Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#D8CCC5]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9AF0D6]" /> You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FDE047]" /> AVS Snow House
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#67E8F9]" /> 5 Cave Entrances
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-[#FFAD6B]" /> Train
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-[#52C4C4]" /> Bus
              </span>
            </div>
          </div>

          {/* Right Column: Midnight Frontier + Caves + Vehicles + Navigate/Bus/Go Regions */}
          <div className="md:col-span-5 p-4 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-[#F5D6C0]/15 max-h-[76vh] overflow-y-auto">
            {/* Night-Only Midnight Frontier Realm Card */}
            <div
              data-testid="map-midnight-frontier-card"
              className={`rounded-lg border p-3 space-y-2 ${
                hud.midnightFrontierOpen
                  ? 'bg-[#1D1B3D] border-amber-300/50'
                  : 'bg-[#171329] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MoonStar
                    className={`w-4 h-4 ${
                      hud.midnightFrontierOpen ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-amber-100">
                    The Midnight Frontier
                  </span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    hud.midnightFrontierOpen
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                      : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  {hud.midnightFrontierOpen ? 'OPEN (Night)' : 'Night Only'}
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-300">
                  At night, its golden-violet Sky Beacon glows brightly from any distance. Walk inside the portal to enter the game-inside-a-game!
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onTeleportMidnightFrontier();
                      onClose();
                    }}
                    data-testid="map-visit-midnight-frontier-btn"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Teleport to Night Portal
                  </button>
                  {!hud.midnightFrontierOpen ? (
                    <button
                      type="button"
                      onClick={onToggleNightMode}
                      data-testid="map-switch-night-btn"
                      className="px-2.5 py-1.5 rounded bg-indigo-500/30 hover:bg-indigo-500/45 border border-indigo-300/45 text-[11px] font-medium text-indigo-100 cursor-pointer shrink-0"
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
                      className="px-2.5 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/40 text-cyan-100 text-xs font-medium cursor-pointer"
                    >
                      Nav
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Underground Metro & International Airport Quick Access */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-testid="map-enter-metro-btn"
                onClick={() => {
                  onEnterUndergroundMetro();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-300/45 text-cyan-100 text-xs font-semibold cursor-pointer"
              >
                <TrainFront className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span>Underground Metro</span>
              </button>
              <button
                type="button"
                data-testid="map-fly-airliner-btn"
                onClick={() => {
                  onBoardAirliner();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md bg-sky-500/20 hover:bg-sky-500/35 border border-sky-300/45 text-sky-100 text-xs font-semibold cursor-pointer"
              >
                <Plane className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span>Fly DL-787 Jet</span>
              </button>
            </div>

            {/* Thar Golden Desert Oasis + Ocean Exhibition Complex + Caves + Vehicles */}
            <div className="space-y-1.5 pb-2.5 border-b border-[#F5D6C0]/14">
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
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-amber-500/25 hover:bg-amber-500/38 border border-amber-300/45 text-amber-100 text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Visit Thar Golden Desert Oasis &amp; Pyramid Ruins
              </button>
              <button
                type="button"
                onClick={() => {
                  onTeleport(
                    EXHIBITION_PLAZA_SPAWN.x,
                    EXHIBITION_PLAZA_SPAWN.z,
                    'Universal Mobility Exhibition'
                  );
                  onClose();
                }}
                data-testid="map-visit-exhibition-btn"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-500/25 hover:bg-amber-500/35 border border-amber-300/50 text-xs font-semibold text-amber-100 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Visit Ocean Transportation Exhibition Complex</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnterCaves();
                  onClose();
                }}
                data-testid="map-enter-caves-btn"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/45 text-xs font-semibold text-cyan-100 cursor-pointer"
              >
                <MountainSnow className="w-4 h-4 text-cyan-300" />
                <span>Enter 6-Area Frozen Kingdom Underground Caves</span>
              </button>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  data-testid="map-board-sky-home-btn"
                  onClick={() => onBoardSkyExplorer('home')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#123747] hover:bg-[#194C62] border border-[#5FE2FF]/55 text-[11px] font-semibold text-[#D6FAFF] cursor-pointer"
                >
                  <Wind className="w-3.5 h-3.5 text-[#5FE2FF] shrink-0" />
                  <span className="truncate">Sky · Home</span>
                </button>
                <button
                  type="button"
                  data-testid="map-board-sky-avs-btn"
                  onClick={() => onBoardSkyExplorer('avs')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#123747] hover:bg-[#194C62] border border-[#5FE2FF]/55 text-[11px] font-semibold text-[#D6FAFF] cursor-pointer"
                >
                  <Wind className="w-3.5 h-3.5 text-[#5FE2FF] shrink-0" />
                  <span className="truncate">Sky · AVS</span>
                </button>
                <button
                  type="button"
                  data-testid="map-board-sky-taxi-btn"
                  onClick={() => {
                    onBoardSkyTaxi();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#2A3314] hover:bg-[#3A461C] border border-[#FACC15]/55 text-[11px] font-semibold text-[#FEF08A] cursor-pointer"
                >
                  <Plane className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                  <span className="truncate">Sky Taxi</span>
                </button>
                <button
                  type="button"
                  data-testid="map-board-catamaran-btn"
                  onClick={() => onBoardBoat('bamboo_catamaran')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#193B47] hover:bg-[#225161] border border-[#5DD5B0]/55 text-[11px] font-semibold text-[#D6FFF2] cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#5DD5B0] shrink-0" />
                  <span className="truncate">Catamaran</span>
                </button>
                <button
                  type="button"
                  data-testid="map-board-outrigger-btn"
                  onClick={() => onBoardBoat('tribal_outrigger')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#3B2A1C] hover:bg-[#523A27] border border-[#E8A464]/55 text-[11px] font-semibold text-[#FFE8D1] cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#E8A464] shrink-0" />
                  <span className="truncate">Outrigger</span>
                </button>
                <button
                  type="button"
                  data-testid="map-board-sovereign-btn"
                  onClick={() => onBoardBoat('sovereign_ship')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#3B2616] hover:bg-[#52361F] border border-[#F5C36C]/55 text-[11px] font-semibold text-[#FEF3C7] cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#F5C36C] shrink-0" />
                  <span className="truncate">Tall Ship</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBoardBoat('lake_boat')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#1D3549] hover:bg-[#274762] border border-[#85C7DE]/45 text-[11px] font-medium text-[#DCF4FF] cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#85C7DE] shrink-0" />
                  <span>Lake Boat</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBoardBoat('coastal_boat')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#1D3549] hover:bg-[#274762] border border-[#85C7DE]/45 text-[11px] font-medium text-[#DCF4FF] cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#85C7DE] shrink-0" />
                  <span>Ocean Boat</span>
                </button>
                <button
                  type="button"
                  onClick={onDriveCamper}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#3D2246] hover:bg-[#502D5C] border border-[#F2A6D8]/50 text-[11px] font-medium text-[#FFE6F6] cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5 text-[#F5AEE0] shrink-0" />
                  <span>Olga Van</span>
                </button>
              </div>
            </div>

            {/* Regions List: Live Navigate + Call Bus + Fast Travel Go */}
            <div>
              <h3 className="text-xs font-medium tracking-wider text-[#E5C9BA] uppercase mb-2">
                Navigate, Call Bus, or Fast Travel
              </h3>
              <div className="space-y-1.5">
                {LOCATIONS.map((loc) => {
                  const isHome = loc.id === 'my_home' || loc.id === 'avs_snow_house';
                  const isDino = loc.id === 'dinosaur_island';
                  const tx = loc.teleportX ?? loc.x;
                  const tz = loc.teleportZ ?? loc.z;
                  return (
                    <div
                      key={loc.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border ${
                        isDino
                          ? 'bg-[#2B2616] border-[#FACC15]/45'
                          : isHome
                          ? 'bg-[#2C223E] border-[#F4BE98]/40'
                          : 'bg-[#231C38] border-[#F5D6C0]/15'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#FAF5EF] truncate flex items-center gap-1.5">
                          {isHome && <Home className="w-3 h-3 text-[#F4BE98] shrink-0" />}
                          <span>{loc.name}</span>
                        </div>
                        <div className="text-[10px] text-[#D4C0B8] truncate">{loc.jpName}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title={`Live Navigation Arrow & Line to ${loc.name}`}
                          data-testid={`map-nav-${loc.id}`}
                          onClick={() => {
                            onSetNavigation({
                              id: loc.id,
                              label: loc.name,
                              tamilLabel: loc.jpName,
                              x: tx,
                              z: tz,
                            });
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-300/40 text-[10px] font-medium text-cyan-100 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Nav</span>
                        </button>
                        {!isDino && (
                          <button
                            type="button"
                            title={`Call Bus to pick you up & drop at ${loc.name}`}
                            onClick={() => {
                              onCallBus({
                                id: loc.id,
                                label: loc.name,
                                tamilLabel: loc.jpName,
                                x: tx,
                                z: tz,
                              });
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-300/40 text-[10px] font-medium text-emerald-100 cursor-pointer"
                          >
                            <Bus className="w-3 h-3" />
                            <span>Bus</span>
                          </button>
                        )}
                        <button
                          type="button"
                          title={`Teleport to ${loc.name}`}
                          data-testid={`map-go-${loc.id}`}
                          onClick={() => onTeleport(tx, tz, loc.name)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F4BE98]/20 hover:bg-[#F4BE98] hover:text-[#1A152C] border border-[#F4BE98]/40 text-[10px] font-semibold text-[#FCE2C8] cursor-pointer"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Go</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
