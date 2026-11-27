import React, { useMemo } from 'react';
import { Bus, Car, Clock, Compass, Home, Ship, TrainFront, X } from 'lucide-react';
import type { BoatId, HudSnapshot } from '../game/types';
import {
  computeBusStopTimetable,
  computeTrainStationTimetable,
} from '../game/transitSchedule';
import { sampleRailway, STATIONS } from '../game/railway';
import { BUS_STOPS, sampleBusRoad } from '../game/vehicles';
import { ENCHANTED_FOREST_CENTER, HOME_CENTER, LAKE_CENTER } from '../game/terrain';
import { DINOSAUR_ISLAND_CENTER } from '../game/dinosaurIsland';
import { DESERT_BIOME_CENTER, DESERT_OASIS_CENTER } from '../game/desertOasis';

interface TransitScheduleModalProps {
  hud: HudSnapshot;
  onTeleport: (x: number, z: number, label: string) => void;
  onBoardBoat: (boatId: BoatId) => void;
  onDriveCamper: () => void;
  onClose: () => void;
}

const MAP_SCALE = 0.6;
function toMapX(x: number): number {
  return 212 + x * MAP_SCALE;
}
function toMapY(z: number): number {
  return 198 + z * MAP_SCALE;
}

export const TransitScheduleModal: React.FC<TransitScheduleModalProps> = ({
  hud,
  onTeleport,
  onBoardBoat,
  onDriveCamper,
  onClose,
}) => {
  const trainRows = useMemo(
    () => computeTrainStationTimetable(hud.train, hud.timeHours),
    [hud.train, hud.timeHours]
  );

  const busRows = useMemo(
    () => computeBusStopTimetable(hud.bus, hud.timeHours),
    [hud.bus, hud.timeHours]
  );

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
    for (let i = 0; i <= 72; i++) {
      const s = sampleBusRoad(i / 72);
      pts.push(`${i === 0 ? 'M' : 'L'} ${toMapX(s.x).toFixed(1)} ${toMapY(s.z).toFixed(1)}`);
    }
    return pts.join(' ') + ' Z';
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bus and Train Live Destination and Departure Timing Map"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#100C1E]/86 p-3 sm:p-5"
    >
      <div className="w-full max-w-6xl max-h-[90vh] flex flex-col rounded-xl bg-[#19142B] border border-[#F5D6C0]/28 text-[#FAF5EF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#F5D6C0]/16 bg-[#201A36]">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F4BE98]" />
              <h2 className="font-display text-lg sm:text-xl font-semibold tracking-wide">
                Bus &amp; Train Live Departure Timing Map
              </h2>
            </div>
            <p className="text-xs text-[#DFC8BC] mt-0.5">
              ஷவீஷ் ஜெஷுருன் சா · En Illam Home · Every Station Live Destinations &amp; Departures · World Clock{' '}
              <span className="font-mono-tabular text-[#FCE2C8] font-medium">
                {hud.timeFormatted}
              </span>
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Bus and Train Timing Map"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#2E254B] text-[#FAF5EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Combined Live SVG Transit Route Map + Boat & Camper Launch */}
          <div className="lg:col-span-5 p-4 bg-[#141024] border-b lg:border-b-0 lg:border-r border-[#F5D6C0]/14 flex flex-col gap-3">
            <svg
              viewBox="0 0 480 420"
              className="w-full max-w-[440px] mx-auto h-auto rounded-lg bg-[#1E1935] border border-[#F5D6C0]/16"
            >
              {/* Snow Kingdom (NW), Thar Desert Oasis (SW), Water, Offshore Dinosaur Island & Enchanted Forest Landmarks */}
              <ellipse
                cx={toMapX(-154)}
                cy={toMapY(-145)}
                rx="88"
                ry="76"
                fill="#DDE8F7"
                fillOpacity="0.16"
                stroke="#B8DCF8"
                strokeOpacity="0.28"
                strokeDasharray="4 3"
              />
              <ellipse
                cx={toMapX(DESERT_BIOME_CENTER.x)}
                cy={toMapY(DESERT_BIOME_CENTER.z)}
                rx="64"
                ry="52"
                fill="#D99B4E"
                fillOpacity="0.28"
                stroke="#F6C873"
                strokeOpacity="0.45"
                strokeDasharray="4 3"
              />
              <ellipse
                cx={toMapX(DESERT_OASIS_CENTER.x)}
                cy={toMapY(DESERT_OASIS_CENTER.z)}
                rx="13"
                ry="10"
                fill="#1FA896"
                fillOpacity="0.65"
              />
              <ellipse
                cx={toMapX(LAKE_CENTER.x)}
                cy={toMapY(LAKE_CENTER.z)}
                rx={34 * MAP_SCALE}
                ry={26 * MAP_SCALE}
                fill="#2E5988"
                fillOpacity="0.62"
              />
              <path
                d={`M ${toMapX(118)} ${toMapY(-26)} Q ${toMapX(114)} ${toMapY(14)} ${toMapX(110)} ${toMapY(40)} Q ${toMapX(106)} ${toMapY(112)} ${toMapX(94)} 420 L 480 420 L 480 ${toMapY(-26)} Z`}
                fill="#1D758B"
                fillOpacity="0.58"
              />
              <text
                x={toMapX(202)}
                y={toMapY(42)}
                textAnchor="middle"
                fill="#FCE2C8"
                fontSize="7.4"
                fontWeight="600"
              >
                Long Sea Railway Bridge
              </text>
              <circle
                cx={Math.min(440, toMapX(DINOSAUR_ISLAND_CENTER.x))}
                cy={Math.min(340, toMapY(DINOSAUR_ISLAND_CENTER.z))}
                r="24"
                fill="#2E5F34"
                fillOpacity="0.92"
                stroke="#EAB308"
                strokeWidth="2.2"
              />
              <text
                x={Math.min(440, toMapX(DINOSAUR_ISLAND_CENTER.x))}
                y={Math.min(340, toMapY(DINOSAUR_ISLAND_CENTER.z)) + 34}
                textAnchor="middle"
                fill="#FDE047"
                fontSize="8.2"
                fontWeight="700"
              >
                1 KM Dinosaur Island
              </text>
              <circle
                cx={toMapX(ENCHANTED_FOREST_CENTER.x)}
                cy={toMapY(ENCHANTED_FOREST_CENTER.z)}
                r="24"
                fill="#D96EA8"
                fillOpacity="0.18"
                stroke="#F2B8DE"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <text
                x={toMapX(ENCHANTED_FOREST_CENTER.x)}
                y={toMapY(ENCHANTED_FOREST_CENTER.z) + 32}
                textAnchor="middle"
                fill="#F6C8E8"
                fontSize="8.5"
                fontWeight="600"
              >
                Mayavanam · Olga
              </text>

              {/* Bus Loop (Teal dashed) */}
              <path
                d={busPath}
                fill="none"
                stroke="#63C7CC"
                strokeWidth="2.4"
                strokeDasharray="5 3"
                strokeOpacity="0.88"
              />

              {/* Railway Loop (Warm amber) */}
              <path
                d={railPath}
                fill="none"
                stroke="#F4BE98"
                strokeWidth="3.4"
                strokeOpacity="0.95"
              />

              {/* All 9 Train Stations with concise non-overlapping labels */}
              {STATIONS.map((st, i) => {
                const isDesert = st.id === 'thar_desert_station';
                const isSnowSummit = st.id === 'panimalai_snow_station';
                const shortLabel =
                  i === 0
                    ? 'ஷவீஷ் ஜெஷுருன் சா'
                    : st.isDinosaurIsland
                    ? 'Dino Isle'
                    : isSnowSummit
                    ? 'Snow Summit'
                    : isDesert
                    ? 'Desert Oasis'
                    : st.name.split(' ')[0];
                return (
                  <g key={st.id} transform={`translate(${toMapX(st.worldX)}, ${toMapY(st.worldZ)})`}>
                    <circle
                      r="5.0"
                      fill={
                        st.isDinosaurIsland || isDesert
                          ? '#FEF08A'
                          : st.connectsToIceland
                          ? '#BCEFFF'
                          : '#FAF5EF'
                      }
                      stroke={
                        st.isDinosaurIsland || isDesert
                          ? '#D97706'
                          : st.connectsToIceland
                          ? '#2D9BD6'
                          : '#D46254'
                      }
                      strokeWidth="2"
                    />
                    <text
                      x={isDesert ? 8 : 0}
                      y={i === 0 ? 15 : isDesert ? 3 : -9}
                      textAnchor={isDesert ? 'start' : 'middle'}
                      fill={st.isDinosaurIsland || isDesert ? '#FDE047' : isSnowSummit ? '#C5F3FF' : '#FCE7D6'}
                      fontSize="7.4"
                      fontWeight="600"
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              })}

              {/* All 4 Bus Stops */}
              {BUS_STOPS.map((stop) => (
                <g key={stop.id} transform={`translate(${toMapX(stop.worldX)}, ${toMapY(stop.worldZ)})`}>
                  <rect
                    x="-4"
                    y="-4"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="#63C7CC"
                    stroke="#14222B"
                    strokeWidth="1.4"
                  />
                </g>
              ))}

              {/* En Illam Home */}
              <g transform={`translate(${toMapX(HOME_CENTER.x)}, ${toMapY(HOME_CENTER.z)})`}>
                <rect
                  x="-5.5"
                  y="-5.5"
                  width="11"
                  height="11"
                  rx="2"
                  fill="#F7C99B"
                  stroke="#1A152C"
                  strokeWidth="1.4"
                />
                <text x="0" y="-9" textAnchor="middle" fill="#FFE6CC" fontSize="8.5" fontWeight="600">
                  En Illam
                </text>
              </g>

              {/* Live Moving Train */}
              <g transform={`translate(${toMapX(hud.train.worldX)}, ${toMapY(hud.train.worldZ)})`}>
                <rect x="-7" y="-4.5" width="14" height="9" rx="2" fill="#FF9E57" stroke="#181228" strokeWidth="1.4" />
              </g>

              {/* Live Moving Bus */}
              <g transform={`translate(${toMapX(hud.bus.worldX)}, ${toMapY(hud.bus.worldZ)})`}>
                <rect x="-6" y="-4" width="12" height="8" rx="2" fill="#4FD6D6" stroke="#181228" strokeWidth="1.4" />
              </g>

              {/* Live Olga Pastel Camper Van */}
              <g transform={`translate(${toMapX(hud.camper.x)}, ${toMapY(hud.camper.z)})`}>
                <rect x="-6" y="-4" width="12" height="8" rx="2.5" fill="#F29ED0" stroke="#2B1633" strokeWidth="1.3" />
              </g>

              {/* Player Marker */}
              <g transform={`translate(${toMapX(hud.playerX)}, ${toMapY(hud.playerZ)})`}>
                <circle r="7" fill="#7BE0C3" fillOpacity="0.32" />
                <circle r="4" fill="#9AF0D6" stroke="#161226" strokeWidth="1.4" />
              </g>
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#DED2CA]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-[#FF9E57]" /> Train (DL-402)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-[#4FD6D6]" /> Bus (BUS-12)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-[#F29ED0]" /> Olga Camper
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9AF0D6]" /> You
              </span>
            </div>

            {/* Direct Boat & Camper Quick Launch */}
            <div className="pt-2 border-t border-[#F5D6C0]/14 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-[#DEC5B8] font-medium">
                Boat Travel &amp; Olga Pastel Camper Van
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onBoardBoat('lake_boat')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#1D3549] hover:bg-[#274762] border border-[#85C7DE]/45 text-xs font-medium text-[#DCF4FF] transition-colors cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#85C7DE]" />
                  <span>Sail Lake Boat</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBoardBoat('coastal_boat')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#1D3549] hover:bg-[#274762] border border-[#85C7DE]/45 text-xs font-medium text-[#DCF4FF] transition-colors cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5 text-[#85C7DE]" />
                  <span>Sail Ocean Boat</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onDriveCamper}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#3D2246] hover:bg-[#502D5C] border border-[#F2A6D8]/50 text-xs font-semibold text-[#FFE6F6] transition-colors cursor-pointer"
              >
                <Car className="w-4 h-4 text-[#F5AEE0]" />
                <span>Drive Olga Camper Van (Mayavanam Enchanted Forest)</span>
              </button>
              <button
                type="button"
                onClick={() => onTeleport(HOME_CENTER.x, HOME_CENTER.z + 9.2, 'En Illam · My Home')}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-[#251E3C] hover:bg-[#322850] border border-[#F5D6C0]/20 text-xs text-[#F5E6DC] transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-[#F4BE98]" />
                <span>Return to En Illam (My Home)</span>
              </button>
            </div>
          </div>

          {/* Right: Live Station-by-Station Train & Bus Departure Tables */}
          <div className="lg:col-span-7 p-4 sm:p-5 space-y-5">
            {/* Train Timetable (All 5 Stations) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <TrainFront className="w-4 h-4 text-[#F4BE98]" />
                  <h3 className="font-display text-sm sm:text-base font-semibold text-[#FAF5EF]">
                    Dreamline Scenic Express · DL-402 (All {STATIONS.length} Stations)
                  </h3>
                </div>
                <span className="text-[11px] font-mono-tabular text-[#FCE2C8] px-2 py-0.5 rounded bg-[#272042] border border-[#F4BE98]/25">
                  {hud.train.speedKmh} km/h
                </span>
              </div>

              <div className="space-y-1.5">
                {trainRows.map((row) => (
                  <div
                    key={row.stationId}
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
                      row.status === 'boarding'
                        ? 'bg-[#1D3831]/90 border-[#8CE0B8]/50'
                        : row.status === 'arriving'
                        ? 'bg-[#362642]/90 border-[#F4BE98]/50'
                        : 'bg-[#221B36] border-[#F5D6C0]/14'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[#FAF5EF]">{row.stationName}</span>
                        <span className="text-[11px] text-[#E8C5B0]">{row.tamilName}</span>
                        {row.connectsToIceland && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1E3B52] text-[#AEEBFF] border border-[#8DE4FF]/35">
                            {row.stationId === 'panimalai_snow_station' ? 'Snow Kingdom' : 'Iceland Transfer'}
                          </span>
                        )}
                        {row.stationId === 'thar_desert_station' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#4A3114] text-[#FDE68A] border border-[#F59E0B]/45">
                            Desert Oasis
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#CFC0D6] mt-0.5">
                        {row.platformLabel} · Next Destination:{' '}
                        <span className="text-[#FCE2C8]">{row.destinationName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right font-mono-tabular">
                        <div className="text-[11px] text-[#FCE2C8] font-semibold">
                          Dep {row.departureTime}
                        </div>
                        <div
                          className={`text-[10px] ${
                            row.status === 'boarding'
                              ? 'text-[#A9F2CF] font-semibold'
                              : row.status === 'arriving'
                              ? 'text-[#F8CCA8]'
                              : 'text-[#BFB2CA]'
                          }`}
                        >
                          {row.statusLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTeleport(row.teleportX, row.teleportZ, row.stationName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#2E264B] hover:bg-[#F4BE98] hover:text-[#1D162E] text-[#FAF5EF] border border-[#F5D6C0]/20 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Go</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bus Timetable (All 4 Stops) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#63C7CC]" />
                  <h3 className="font-display text-sm sm:text-base font-semibold text-[#FAF5EF]">
                    Dreamline Countryside Bus · BUS-12 (All 4 Stops)
                  </h3>
                </div>
                <span className="text-[11px] font-mono-tabular text-[#B6F0F2] px-2 py-0.5 rounded bg-[#1B2F3B] border border-[#63C7CC]/30">
                  {hud.bus.speedKmh} km/h
                </span>
              </div>

              <div className="space-y-1.5">
                {busRows.map((row) => (
                  <div
                    key={row.stopId}
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
                      row.status === 'boarding'
                        ? 'bg-[#1A393D]/90 border-[#6FE0E4]/50'
                        : row.status === 'arriving'
                        ? 'bg-[#263248]/90 border-[#85C7DE]/45'
                        : 'bg-[#221B36] border-[#F5D6C0]/14'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[#FAF5EF]">{row.stopName}</span>
                        <span className="text-[11px] text-[#AEE4E6]">{row.tamilName}</span>
                      </div>
                      <div className="text-[11px] text-[#CFC0D6] mt-0.5">
                        Next Destination:{' '}
                        <span className="text-[#C7F2F4]">{row.destinationName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right font-mono-tabular">
                        <div className="text-[11px] text-[#C7F2F4] font-semibold">
                          Dep {row.departureTime}
                        </div>
                        <div
                          className={`text-[10px] ${
                            row.status === 'boarding'
                              ? 'text-[#9DF5E3] font-semibold'
                              : row.status === 'arriving'
                              ? 'text-[#BBE7FA]'
                              : 'text-[#BFB2CA]'
                          }`}
                        >
                          {row.statusLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTeleport(row.teleportX, row.teleportZ, row.stopName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1E3444] hover:bg-[#63C7CC] hover:text-[#122029] text-[#E6FAFB] border border-[#63C7CC]/30 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Go</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
