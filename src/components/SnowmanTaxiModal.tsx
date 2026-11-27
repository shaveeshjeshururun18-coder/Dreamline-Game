import React, { useMemo, useRef, useState } from 'react';
import { Crosshair, MapPin, Navigation, Snowflake, Waves, X, Zap } from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import { isOceanAt, isWaterAt, LAKE_CENTER, LOCATIONS } from '../game/terrain';
import {
  clampExactWorldCoord,
  getSnowmanTransportSpec,
  LAND_TRANSPORT_OPTIONS,
  WATER_TRANSPORT_OPTIONS,
  type SnowmanTransportId,
} from '../game/snowmanTaxi';

interface SnowmanTaxiModalProps {
  hud: HudSnapshot;
  onDispatch: (params: {
    targetX: number;
    targetZ: number;
    landTransport: SnowmanTransportId;
    waterTransport: SnowmanTransportId;
    instantExpress: boolean;
  }) => void;
  onCancelTaxi: () => void;
  onClose: () => void;
}

const MAP_MIN_X = -240;
const MAP_MAX_X = 320;
const MAP_MIN_Z = -200;
const MAP_MAX_Z = 220;

function worldToPct(x: number, z: number): { left: number; top: number } {
  const left = ((x - MAP_MIN_X) / (MAP_MAX_X - MAP_MIN_X)) * 100;
  const top = ((z - MAP_MIN_Z) / (MAP_MAX_Z - MAP_MIN_Z)) * 100;
  return {
    left: Math.max(2, Math.min(98, left)),
    top: Math.max(2, Math.min(98, top)),
  };
}

export const SnowmanTaxiModal: React.FC<SnowmanTaxiModalProps> = ({
  hud,
  onDispatch,
  onCancelTaxi,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [landTransport, setLandTransport] = useState<SnowmanTransportId>(
    hud.snowmanTaxi.landTransport || 'cycle_jetski'
  );
  const [waterTransport, setWaterTransport] = useState<SnowmanTransportId>(
    hud.snowmanTaxi.waterTransport || 'jetski'
  );
  const [pinX, setPinX] = useState<number>(Math.round(hud.playerX + 42));
  const [pinZ, setPinZ] = useState<number>(Math.round(hud.playerZ - 18));
  const [instantExpress, setInstantExpress] = useState<boolean>(false);

  const pinIsWater = useMemo(() => isWaterAt(pinX, pinZ) || isOceanAt(pinX, pinZ), [pinX, pinZ]);
  const playerIsWater = useMemo(
    () => isWaterAt(hud.playerX, hud.playerZ) || isOceanAt(hud.playerX, hud.playerZ),
    [hud.playerX, hud.playerZ]
  );
  const distanceM = Math.round(Math.hypot(pinX - hud.playerX, pinZ - hud.playerZ));

  const playerPct = worldToPct(hud.playerX, hud.playerZ);
  const pinPct = worldToPct(pinX, pinZ);

  const handleMapPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rz = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const rawX = MAP_MIN_X + rx * (MAP_MAX_X - MAP_MIN_X);
    const rawZ = MAP_MIN_Z + rz * (MAP_MAX_Z - MAP_MIN_Z);
    const clamped = clampExactWorldCoord(rawX, rawZ);
    setPinX(clamped.x);
    setPinZ(clamped.z);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Snowman Exact-Location Multi-Transport Taxi"
      data-testid="snowman-taxi-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-2.5 sm:p-5"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl bg-[#131926] border border-[#7DD3FC]/30 text-[#F4F8FC] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#7DD3FC]/20 bg-[#172033]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Snowflake className="w-5 h-5 text-[#7DD3FC] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-semibold text-white truncate">
                Snowman Multi-Transport Taxi
              </h2>
              <p className="text-[11px] sm:text-xs text-[#A9C7E0] truncate">
                Driver: Snowman · Tap ANY exact map spot · No ships
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Snowman Taxi"
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#22304A] hover:bg-[#2E4163] border border-[#7DD3FC]/25 text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* Interactive Exact-Coordinate Map */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[#D8ECFA] flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-[#FBBF24]" />
                Tap exact coordinate on map
              </span>
              <span className="font-mono tabular-nums text-[#9DD5F8]">
                Pin: X {pinX.toFixed(1)} · Z {pinZ.toFixed(1)} · {pinIsWater ? 'WATER' : 'LAND'} · {distanceM}m
              </span>
            </div>

            <div
              ref={mapRef}
              onClick={handleMapPointer}
              data-testid="snowman-taxi-map-picker"
              className="relative w-full h-52 sm:h-64 rounded-lg border border-[#7DD3FC]/30 overflow-hidden cursor-crosshair select-none bg-[#1B312B]"
            >
              {/* Biome Regions Canvas SVG */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Main green countryside */}
                <rect x="0" y="0" width="100" height="100" fill="#234232" />
                {/* Panimalai Snow Northwest */}
                <ellipse cx="22" cy="24" rx="22" ry="20" fill="#6F8BA4" opacity="0.6" />
                {/* Thar Desert West */}
                <ellipse cx="14" cy="70" rx="18" ry="22" fill="#B68B4C" opacity="0.55" />
                {/* Kadalkarai Ocean East */}
                <rect x="63" y="48" width="37" height="52" fill="#0E5A7A" />
                {/* Neelam Lake */}
                <ellipse
                  cx={worldToPct(LAKE_CENTER.x, LAKE_CENTER.z).left}
                  cy={worldToPct(LAKE_CENTER.x, LAKE_CENTER.z).top}
                  rx="7.5"
                  ry="7.5"
                  fill="#187FA3"
                />
                {/* Subtle Coordinate Grid */}
                {[20, 40, 60, 80].map((v) => (
                  <g key={v} stroke="rgba(255,255,255,0.09)" strokeWidth="0.3">
                    <line x1={v} y1="0" x2={v} y2="100" />
                    <line x1="0" y1={v} x2="100" y2={v} />
                  </g>
                ))}
                {/* Direct Snowman route line */}
                <line
                  x1={playerPct.left}
                  y1={playerPct.top}
                  x2={pinPct.left}
                  y2={pinPct.top}
                  stroke="#FBBF24"
                  strokeWidth="0.7"
                  strokeDasharray="2 1.5"
                />
              </svg>

              {/* Subtle landmark dots */}
              {LOCATIONS.slice(0, 10).map((loc) => {
                const pos = worldToPct(loc.x, loc.z);
                return (
                  <div
                    key={loc.id}
                    style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/55" />
                  </div>
                );
              })}

              {/* Blue Player Live Pin */}
              <div
                style={{ left: `${playerPct.left}%`, top: `${playerPct.top}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#38BDF8] border-2 border-white shadow" />
                <span className="mt-0.5 px-1 rounded bg-[#0F172A]/85 text-[9px] font-semibold text-[#7DD3FC]">
                  You ({playerIsWater ? 'Water' : 'Land'})
                </span>
              </div>

              {/* Amber Exact Destination Crosshair Pin */}
              <div
                style={{ left: `${pinPct.left}%`, top: `${pinPct.top}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
              >
                <MapPin className="w-5 h-5 text-[#FBBF24] drop-shadow" />
                <span className="px-1 rounded bg-[#0F172A]/90 text-[9px] font-semibold text-[#FDE68A] whitespace-nowrap">
                  Exact Pin ({pinIsWater ? 'Water' : 'Land'})
                </span>
              </div>
            </div>
          </div>

          {/* Separate Land & Water Transport Selectors (Zero Ships!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Land Transport Selector */}
            <div className="p-3 rounded-lg bg-[#182236] border border-[#7DD3FC]/18 space-y-2">
              <div className="text-xs font-semibold text-[#FDE68A] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                Land Transport (Driver: Snowman)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {LAND_TRANSPORT_OPTIONS.map((id) => {
                  const spec = getSnowmanTransportSpec(id);
                  const active = landTransport === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`snowman-land-${id}`}
                      onClick={() => setLandTransport(id)}
                      className={`min-h-[44px] px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#38BDF8] border-[#BAE6FD] text-[#091524] font-semibold'
                          : 'bg-[#1F2C44] border-[#7DD3FC]/15 text-[#E2EFFA] hover:bg-[#283957]'
                      }`}
                    >
                      {spec.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Water Transport Selector */}
            <div className="p-3 rounded-lg bg-[#182236] border border-[#7DD3FC]/18 space-y-2">
              <div className="text-xs font-semibold text-[#7DD3FC] flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" />
                Water Transport (No Ship!)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {WATER_TRANSPORT_OPTIONS.map((id) => {
                  const spec = getSnowmanTransportSpec(id);
                  const active = waterTransport === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`snowman-water-${id}`}
                      onClick={() => setWaterTransport(id)}
                      className={`min-h-[44px] px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#22D3EE] border-[#CFFAFE] text-[#082026] font-semibold'
                          : 'bg-[#1F2C44] border-[#7DD3FC]/15 text-[#E2EFFA] hover:bg-[#283957]'
                      }`}
                    >
                      {spec.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Instant Cycle <-> JetSki & Express Delivery Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#1A253B] border border-[#7DD3FC]/18">
            <button
              type="button"
              onClick={() => {
                setLandTransport('cycle_jetski');
                setWaterTransport('cycle_jetski');
              }}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#233657] hover:bg-[#2D4570] border border-[#38BDF8]/40 text-xs font-semibold text-[#BAE6FD] flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#FACC15]" />
              <span>Cycle ⇄ JetSki Instant Morph</span>
            </button>

            <label className="inline-flex items-center gap-2 text-xs text-[#E2EFFA] cursor-pointer min-h-[44px] px-2">
              <input
                type="checkbox"
                checked={instantExpress}
                onChange={(e) => setInstantExpress(e.target.checked)}
                className="w-4 h-4 accent-[#38BDF8]"
              />
              <span>Instant Direct Arrival</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-[#7DD3FC]/20 bg-[#172033] flex flex-wrap items-center justify-between gap-2">
          {hud.snowmanTaxi.phase !== 'idle' ? (
            <button
              type="button"
              onClick={() => {
                onCancelTaxi();
                onClose();
              }}
              className="min-h-[46px] px-4 py-2 rounded-lg bg-[#3B1E28] hover:bg-[#522735] border border-[#FB7185]/40 text-xs font-semibold text-[#FECDD3] cursor-pointer"
            >
              Cancel Active Taxi
            </button>
          ) : (
            <span className="text-xs text-[#9CC3E0]">
              Picks you up on {playerIsWater ? 'water' : 'land'} and delivers to exact pin
            </span>
          )}

          <button
            type="button"
            data-testid="snowman-taxi-dispatch-btn"
            onClick={() => {
              onDispatch({
                targetX: pinX,
                targetZ: pinZ,
                landTransport,
                waterTransport,
                instantExpress,
              });
              onClose();
            }}
            className="min-h-[46px] px-5 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#081524] font-semibold text-sm cursor-pointer"
          >
            Dispatch Snowman Taxi to Exact Pin
          </button>
        </div>
      </div>
    </div>
  );
};
