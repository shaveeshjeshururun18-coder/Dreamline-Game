import React, { useState } from 'react';
import {
  Bus,
  Compass,
  MapPin,
  MountainSnow,
  Navigation,
  PhoneCall,
  Plane,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import { LOCATIONS } from '../game/terrain';
import type { BusRideDestination } from '../game/busHailing';
import type { SkyTaxiDestination } from '../game/skyTaxi';
import type { NavigationTarget } from '../game/navigation';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from '../game/midnightFrontier';

interface MobilePhoneModalProps {
  hud: HudSnapshot;
  onCallBus: (destination: BusRideDestination) => void;
  onCancelBus: () => void;
  onBoardDispatchedBus: () => void;
  onCallSkyTaxi: (destination: SkyTaxiDestination) => void;
  onCancelSkyTaxi: () => void;
  onBoardSkyTaxi: () => void;
  onSetNavigation: (target: NavigationTarget) => void;
  onOpenAiConductor: () => void;
  onEnterCaves: () => void;
  onExitCaves: () => void;
  onClose: () => void;
}

export const MobilePhoneModal: React.FC<MobilePhoneModalProps> = ({
  hud,
  onCallBus,
  onCancelBus,
  onBoardDispatchedBus,
  onCallSkyTaxi,
  onCancelSkyTaxi,
  onBoardSkyTaxi,
  onSetNavigation,
  onOpenAiConductor,
  onEnterCaves,
  onExitCaves,
  onClose,
}) => {
  const [rideMode, setRideMode] = useState<'bus' | 'sky_taxi'>('bus');

  const destinations: Array<BusRideDestination & { busSupported: boolean }> = [
    ...LOCATIONS.map((l) => ({
      id: l.id,
      label: l.name,
      tamilLabel: l.jpName,
      x: l.teleportX ?? l.x,
      z: l.teleportZ ?? l.z,
      busSupported: l.id !== 'dinosaur_island',
    })),
    ...(hud.midnightFrontierOpen
      ? [
          {
            id: 'midnight_frontier',
            label: 'The Midnight Frontier Valley',
            tamilLabel: 'நள்ளிரவு எல்லை',
            x: MIDNIGHT_FRONTIER_PORTAL_POS.x,
            z: MIDNIGHT_FRONTIER_PORTAL_POS.z,
            busSupported: true,
          },
        ]
      : []),
  ];

  const visibleDestinations =
    rideMode === 'bus' ? destinations.filter((d) => d.busSupported) : destinations;

  const [selectedId, setSelectedId] = useState<string>(visibleDestinations[0]?.id ?? '');
  const selectedDest =
    visibleDestinations.find((d) => d.id === selectedId) ?? visibleDestinations[0];

  const dispatch = hud.busDispatch;
  const isBusBusy = dispatch.phase !== 'idle';
  const skyTaxi = hud.skyTaxi;
  const isSkyTaxiBusy =
    skyTaxi.phase === 'en_route_pickup' ||
    skyTaxi.phase === 'arrived_pickup' ||
    skyTaxi.phase === 'flying_to_destination';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-label="Dreamline Mobile Phone"
      data-testid="mobile-phone-modal"
    >
      <div className="w-full max-w-[380px] rounded-[32px] bg-[#0b101d] border-[5px] border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Top Phone Status Bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 bg-[#11192c] border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Dreamline 5G</span>
          </div>
          <span className="text-[11px] font-mono text-slate-300">{hud.timeFormatted}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dreamline Mobile"
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Bus vs Tropical Sky Explorer Air Taxi Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#111a2e] border border-white/10">
            <button
              type="button"
              onClick={() => setRideMode('bus')}
              data-testid="mobile-tab-bus"
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                rideMode === 'bus'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              Bus Pickup
            </button>
            <button
              type="button"
              onClick={() => setRideMode('sky_taxi')}
              data-testid="mobile-tab-sky-taxi"
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                rideMode === 'sky_taxi'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              Sky Explorer Taxi
            </button>
          </div>

          {/* Service Info Card */}
          <div
            className={`rounded-2xl p-3.5 border ${
              rideMode === 'bus'
                ? 'bg-[#16233d] border-emerald-400/25'
                : 'bg-[#102638] border-sky-400/35'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  rideMode === 'bus'
                    ? 'bg-emerald-400/20 border-emerald-300/35'
                    : 'bg-sky-400/20 border-sky-300/40'
                }`}
              >
                {rideMode === 'bus' ? (
                  <Bus className="w-5 h-5 text-emerald-300" />
                ) : (
                  <Plane className="w-5 h-5 text-sky-300" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {rideMode === 'bus' ? 'Dreamline Bus Pickup' : 'SSJ Tropical Sky Explorer Taxi'}
                </h2>
                <p className="text-[11px] text-slate-300">
                  {rideMode === 'bus'
                    ? 'Bus drives to pick you up & drop you off anywhere (including Ocean Showroom).'
                    : 'Aerial taxi flies to pick you up & drops you anywhere — even Dinosaur Island & Snow Peaks!'}
                </p>
              </div>
            </div>

            {/* Active Bus Status */}
            {rideMode === 'bus' && isBusBusy && (
              <div
                className="mt-3 rounded-xl bg-[#0c1424] border border-emerald-300/30 p-3 space-y-2"
                data-testid="mobile-bus-active-status"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300">{dispatch.statusMessage}</span>
                  {dispatch.distanceMeters > 1 && (
                    <span className="font-mono text-amber-200">{Math.round(dispatch.distanceMeters)}m</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {(dispatch.phase === 'arrived_pickup' || dispatch.phase === 'en_route_pickup') && (
                    <button
                      type="button"
                      onClick={() => {
                        onBoardDispatchedBus();
                        onClose();
                      }}
                      data-testid="mobile-board-bus-btn"
                      className="flex-1 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Board Bus Now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onCancelBus}
                    className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Active Sky Taxi Status */}
            {rideMode === 'sky_taxi' && isSkyTaxiBusy && (
              <div
                className="mt-3 rounded-xl bg-[#0a1a28] border border-sky-300/35 p-3 space-y-2"
                data-testid="mobile-sky-taxi-active-status"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-300">{skyTaxi.statusMessage}</span>
                  {skyTaxi.distanceMeters > 1 && (
                    <span className="font-mono text-amber-200">{skyTaxi.distanceMeters}m</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {(skyTaxi.phase === 'arrived_pickup' || skyTaxi.phase === 'en_route_pickup') && (
                    <button
                      type="button"
                      onClick={() => {
                        onBoardSkyTaxi();
                        onClose();
                      }}
                      data-testid="mobile-board-sky-taxi-btn"
                      className="flex-1 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Board Sky Taxi Now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onCancelSkyTaxi}
                    className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Destination Picker */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Select Destination
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {visibleDestinations.map((dest) => {
                const active = dest.id === selectedDest?.id;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setSelectedId(dest.id)}
                    data-testid={`mobile-dest-${dest.id}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? rideMode === 'bus'
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-white'
                          : 'bg-sky-500/20 border-sky-400/60 text-white'
                        : 'bg-[#131b2e] border-white/10 text-slate-200 hover:bg-[#1a2540]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{dest.label}</div>
                      {dest.tamilLabel && (
                        <div className="text-[10px] text-slate-400 truncate">{dest.tamilLabel}</div>
                      )}
                    </div>
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active
                          ? rideMode === 'bus'
                            ? 'text-emerald-300'
                            : 'text-sky-300'
                          : 'text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Buttons */}
          {selectedDest && (
            <div className="grid grid-cols-2 gap-2">
              {rideMode === 'bus' ? (
                <button
                  type="button"
                  onClick={() => {
                    onCallBus(selectedDest);
                    onClose();
                  }}
                  data-testid="mobile-call-bus-btn"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call Bus Pickup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onCallSkyTaxi({
                      id: selectedDest.id,
                      label: selectedDest.label,
                      tamilLabel: selectedDest.tamilLabel,
                      x: selectedDest.x,
                      z: selectedDest.z,
                    });
                    onClose();
                  }}
                  data-testid="mobile-call-sky-taxi-btn"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
                >
                  <Plane className="w-3.5 h-3.5" />
                  Call Sky Taxi
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onSetNavigation({
                    id: selectedDest.id,
                    label: selectedDest.label,
                    tamilLabel: selectedDest.tamilLabel,
                    x: selectedDest.x,
                    z: selectedDest.z,
                  });
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-300/35 text-cyan-100 font-medium text-xs cursor-pointer transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Live GPS Arrow
              </button>
            </div>
          )}

          {/* Quick Phone Apps */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiConductor();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161f33] hover:bg-[#1e2a45] border border-white/10 text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-white">AI Conductor</div>
                <div className="text-[10px] text-slate-400">PA & Smart Routes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (hud.inUndergroundCave) onExitCaves();
                else onEnterCaves();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161f33] hover:bg-[#1e2a45] border border-cyan-300/20 text-left cursor-pointer"
            >
              <MountainSnow className="w-4 h-4 text-cyan-300 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-white">
                  {hud.inUndergroundCave ? 'Exit Caves' : 'Crystal Caves'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {hud.inUndergroundCave ? 'Back to Snow' : '6 Underground Areas'}
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <Compass className="w-3 h-3" />
            <span>Press P anytime to open or close Dreamline Mobile</span>
          </div>
        </div>
      </div>
    </div>
  );
};
