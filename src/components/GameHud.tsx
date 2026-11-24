import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Bike,
  Bus,
  Car,
  Clock,
  CloudLightning,
  CloudSun,
  Crosshair,
  Eye,
  Flame,
  Footprints,
  Home,
  Map as MapIcon,
  Megaphone,
  MountainSnow,
  Navigation,
  Pause,
  Phone,
  Plane,
  RotateCcw,
  Route,
  Shield,
  Ship,
  Smartphone,
  Snowflake,
  TrainFront,
  Volume2,
  VolumeX,
  Building2,
  Camera,
  Sparkles,
  Wrench,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import type { HudSnapshot, TrainBoardingStatus, TrainViewMode, TransportMode } from '../game/types';
import { getHeroById, getHeroOutfitById } from '../game/heroCharacters';
import { SEASON_LABELS, TIME_PERIOD_LABELS, WEATHER_LABELS } from '../game/timeWeather';
import { getWeatherProfile } from '../game/extremeWeather';
import { REGION_LABELS } from '../game/terrain';
import { STATIONS } from '../game/railway';
import { BUS_STOPS } from '../game/vehicles';
import { MobileJoystick } from './MobileJoystick';
import { CompanionSpeechBanner } from './CompanionBar';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  atmosphereOpen: boolean;
  onToggleMap: () => void;
  onOpenTransitMap: () => void;
  onToggleAtmosphere: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onOpenAndroidApp: () => void;
  onToggleGiantSmall: () => void;
  onToggleIglooMan: () => void;
  onOpenRouteSelect: () => void;
  onSetTrainView: (view: TrainViewMode) => void;
  onEnterIceland: () => void;
  onGoHome: () => void;
  onInteractClick: () => void;
  onToggleTrainView: () => void;
  onSelectTransport: (mode: TransportMode) => void;
  onRingBicycleBell: () => void;
  onToggleCamperDoors: () => void;
  onToggleCamperRoof: () => void;
  onToggleCamperLights: () => void;
  onToggleCamperHazards: () => void;
  onJoystickMove: (right: number, forward: number) => void;
  onMobileSprintChange: (active: boolean) => void;
  onJump: () => void;
  onFireAk47: () => void;
  onToggleSafariCar: () => void;
  onSpawnDinoWave: () => void;
  onOpenMobilePhone: () => void;
  onClearNavigation: () => void;
  onCallBusToNavTarget: () => void;
  onBoardDispatchedBus: () => void;
  onCancelMobileBus: () => void;
  onBoardSkyTaxi: () => void;
  onCancelSkyTaxi: () => void;
  onReturnToExhibition: () => void;
  onSetTrainDriverMode: (enabled: boolean) => void;
  onTrainHorn: () => void;
  onTrainDoors: () => void;
  onSetBusDriverMode: (enabled: boolean) => void;
  onBusHorn: () => void;
  onBusDoors: () => void;
  onExitUndergroundCave: () => void;
  onToggleBoatFpv: (fpv: boolean) => void;
  onSkyVertical: (ascend: boolean, descend: boolean) => void;
  onOpenHeroArmory: () => void;
  onHeroPrimaryPower: () => void;
  onHeroSecondaryPower: () => void;
  onHeroFlightOrSpecial: () => void;
  onCycleHeroOutfit: () => void;
  onToggleHeroHelmet: () => void;
  onSpawnBatmobile: (teleportToMetro: boolean) => void;
  onToggleBatmobileCanopy: () => void;
  onToggleBatmobileLights: () => void;
  onCycleBatmobileCamera: () => void;
  onRepairBatmobile: () => void;
  onExitBatmobile: () => void;
  onToggleHomeVaultHatch: () => void;
  onEnterHomeVault: () => void;
  onExitHomeVault: () => void;
  onExitVaultCar: () => void;
  onToggleVaultCarLights: () => void;
  onRideUndergroundMetro: (targetStationId: 'metro_central' | 'metro_airport') => void;
  onExitUndergroundMetro: () => void;
  onExitAirliner: (withParachute: boolean) => void;
  onToggleParachute: () => void;
  onToggleLantern: () => void;
}

function formatBoardingStatus(status: TrainBoardingStatus): string {
  switch (status) {
    case 'arriving':
      return 'Arriving';
    case 'boarding':
      return 'Boarding Now';
    case 'waiting':
      return 'Waiting · Doors Open';
    case 'departing':
      return 'Departing';
    default:
      return 'In Transit';
  }
}

const SkateboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 12.5c1.5 1.2 3 1.5 5 1.5h8c2 0 3.5-.3 5-1.5" />
    <circle cx="7.5" cy="17" r="1.6" />
    <circle cx="16.5" cy="17" r="1.6" />
  </svg>
);

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  atmosphereOpen,
  onToggleMap,
  onOpenTransitMap,
  onToggleAtmosphere,
  onToggleMute,
  onOpenPause,
  onOpenAndroidApp,
  onToggleGiantSmall,
  onToggleIglooMan,
  onOpenRouteSelect,
  onSetTrainView,
  onEnterIceland,
  onGoHome,
  onInteractClick,
  onToggleTrainView,
  onSelectTransport,
  onRingBicycleBell,
  onToggleCamperDoors,
  onToggleCamperRoof,
  onToggleCamperLights,
  onToggleCamperHazards,
  onJoystickMove,
  onMobileSprintChange,
  onJump,
  onFireAk47,
  onToggleSafariCar,
  onSpawnDinoWave,
  onOpenMobilePhone,
  onClearNavigation,
  onCallBusToNavTarget,
  onBoardDispatchedBus,
  onCancelMobileBus,
  onBoardSkyTaxi,
  onCancelSkyTaxi,
  onReturnToExhibition,
  onSetTrainDriverMode,
  onTrainHorn,
  onTrainDoors,
  onSetBusDriverMode,
  onBusHorn,
  onBusDoors,
  onExitUndergroundCave,
  onToggleBoatFpv,
  onSkyVertical,
  onOpenHeroArmory,
  onHeroPrimaryPower,
  onHeroSecondaryPower,
  onHeroFlightOrSpecial,
  onCycleHeroOutfit,
  onToggleHeroHelmet,
  onSpawnBatmobile,
  onToggleBatmobileCanopy,
  onToggleBatmobileLights,
  onCycleBatmobileCamera,
  onRepairBatmobile,
  onExitBatmobile,
  onToggleHomeVaultHatch,
  onEnterHomeVault,
  onExitHomeVault,
  onExitVaultCar,
  onToggleVaultCarLights,
  onRideUndergroundMetro,
  onExitUndergroundMetro,
  onExitAirliner,
  onToggleParachute,
  onToggleLantern,
}) => {
  const periodLabel = TIME_PERIOD_LABELS[hud.period].name;
  const weatherLabel = WEATHER_LABELS[hud.weather].name;
  const seasonLabel = SEASON_LABELS[hud.season].name;
  const regionLabel = REGION_LABELS[hud.regionId];
  const nextStation = STATIONS[hud.train.nextStationIndex];
  const currentStation = STATIONS[hud.train.currentStationIndex];
  const nearbyStation =
    hud.nearbyStationIndex !== null ? STATIONS[hud.nearbyStationIndex] : null;
  const routePlan = hud.train.routePlan;
  const routeDestStation = routePlan ? STATIONS[routePlan.destinationIndex] : null;
  const nextBusStop = BUS_STOPS[hud.bus.nextStopIndex];
  const currentBusStop = BUS_STOPS[hud.bus.currentStopIndex];
  const activeBoat = hud.activeBoatId
    ? hud.boats.find((b) => b.id === hud.activeBoatId)
    : null;

  const isRidingRailOrBus = hud.activeVehicle === 'train' || hud.activeVehicle === 'bus';
  const showJoystick =
    !isRidingRailOrBus ||
    (hud.activeVehicle === 'train' && (hud.trainViewMode === 'cabin' || hud.trainDriverMode)) ||
    (hud.activeVehicle === 'bus' && hud.busDriverMode);
  const isDrivingBoat = hud.activeVehicle === 'boat';
  const isDrivingCamper = hud.activeVehicle === 'camper';
  const isDrivingSafariCar = hud.activeVehicle === 'safari_car';
  const isFlyingSkyExplorer = hud.activeVehicle === 'sky_explorer';
  const isDrivingBatmobile = hud.activeVehicle === 'batmobile';
  const isDrivingVaultCar = hud.activeVehicle === 'vault_car';
  const isFlyingAirliner = hud.activeVehicle === 'airliner';
  const activeHeroSpec = hud.hero.activeHeroId ? getHeroById(hud.hero.activeHeroId) : null;
  const activeHeroOutfit =
    activeHeroSpec && hud.hero.activeHeroId
      ? getHeroOutfitById(hud.hero.activeHeroId, hud.hero.activeOutfitId)
      : null;
  const dino = hud.dinosaurIsland;

  const handleUtilityClick =
    (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      fn();
    };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5 md:p-7">
      {/* Top Perimeter Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        {/* Top-Left: Editorial Location, Tamil Script, Season & Time */}
        <div className="min-w-0 max-w-full sm:max-w-[54vw] lg:max-w-[720px] w-fit rounded-lg bg-[#161124]/78 border border-[#F5E8DC]/18 px-3 py-1.5">
          <div className="flex items-baseline gap-2 text-shadow-soft">
            <h1 className="font-display text-base sm:text-lg md:text-xl font-semibold tracking-wide text-[#FAF5EF] truncate">
              {hud.location.name}
            </h1>
            <span className="hidden sm:inline font-display text-sm text-[#F4C9AD] shrink-0">
              {hud.location.jpName}
            </span>
          </div>
          <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#F2E5DC]/90 text-shadow-subtle">
            <span className="font-mono-tabular font-medium text-[#FCE2C8]">
              {hud.timeFormatted}
            </span>
            <span aria-hidden="true">·</span>
            <span>{periodLabel}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{seasonLabel}</span>
            <span aria-hidden="true" className="hidden md:inline">·</span>
            <span className="hidden md:inline">{weatherLabel}</span>
            <span aria-hidden="true" className="hidden lg:inline">·</span>
            <span className="hidden lg:inline text-[#F4C9AD]">{regionLabel.name}</span>
          </div>
          {hud.iceland.isGiant && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#AEEBFF]">
              <Snowflake className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono-tabular">
                Giant Form · {hud.iceland.playerHeightMeters.toFixed(1)}m
              </span>
              <span className="hidden sm:inline text-[#D6F5FF]/85">
                {hud.iceland.inIceland
                  ? `(Giant Igloo Man ${hud.iceland.iglooManHeightMeters.toFixed(1)}m)`
                  : '· Staying Giant Everywhere'}
              </span>
            </div>
          )}
          {getWeatherProfile(hud.weather).isExtremeStorm && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#8DE0FF]">
              {hud.weather === 'tsunami' || hud.weather === 'flood' ? (
                <Waves className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <CloudLightning className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {hud.weather === 'tsunami'
                  ? `Tsunami Surge · Giant Wave & +${Math.max(0, hud.floodLevel).toFixed(1)}m Floodwater`
                  : hud.weather === 'flood'
                  ? `Flood Active · Water +${Math.max(0, hud.floodLevel).toFixed(1)}m (Swimmable)`
                  : `${WEATHER_LABELS[hud.weather].name} · ${WEATHER_LABELS[hud.weather].jp}`}
              </span>
            </div>
          )}
          {hud.isSwimming && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#9EEBFF]">
              <Waves className="w-3.5 h-3.5 shrink-0" />
              <span>Swimming · Use WASD or Joystick</span>
            </div>
          )}
          {hud.inUndergroundCave && (
            <div
              data-testid="hud-cave-banner"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-cyan-300/25 text-[11px] text-cyan-100"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-200">
                <MountainSnow className="w-3.5 h-3.5 text-cyan-300" />
                {hud.caveAreaName ?? 'Underground Crystal Caverns'}
              </span>
              <button
                type="button"
                tabIndex={-1}
                onClick={handleUtilityClick(onExitUndergroundCave)}
                className="px-2 py-0.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-[10px] cursor-pointer"
              >
                Surface Exit
              </button>
            </div>
          )}
          {hud.inUndergroundMetro && (
            <div
              data-testid="underground-metro-hud"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-cyan-300/35 text-[11px] text-cyan-100"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-200">
                <TrainFront className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                {hud.metroStationName ?? 'Underground Metro'}
              </span>
              <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/30 text-[10px] text-amber-200">
                {hud.subwayTrainStatus}
              </span>
              <button
                type="button"
                tabIndex={-1}
                data-testid="metro-ride-central-btn"
                onClick={handleUtilityClick(() => onRideUndergroundMetro('metro_central'))}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  hud.metroStationId === 'metro_central'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-300/40 text-cyan-100'
                }`}
              >
                Central
              </button>
              <button
                type="button"
                tabIndex={-1}
                data-testid="metro-ride-airport-btn"
                onClick={handleUtilityClick(() => onRideUndergroundMetro('metro_airport'))}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  hud.metroStationId === 'metro_airport'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-300/40 text-cyan-100'
                }`}
              >
                Airport T1
              </button>
              <button
                type="button"
                tabIndex={-1}
                data-testid="metro-exit-surface-btn"
                onClick={handleUtilityClick(onExitUndergroundMetro)}
                className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[10px] cursor-pointer"
              >
                Exit to Surface
              </button>
            </div>
          )}
          {hud.navigation && !hud.inUndergroundCave && (
            <div
              data-testid="hud-live-nav-strip"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-cyan-300/25 text-[11px]"
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-400/20 border border-cyan-300/50 text-cyan-200 shrink-0"
                style={{
                  transform: `rotate(${Math.round(
                    (-hud.navigation.relativeAngleRad * 180) / Math.PI
                  )}deg)`,
                }}
              >
                <Navigation className="w-3 h-3" />
              </span>
              <span className="font-semibold text-cyan-100 truncate max-w-[160px]">
                {hud.navigation.target.label}
              </span>
              <span className="font-mono-tabular text-amber-200 font-semibold">
                {Math.round(hud.navigation.distanceMeters)}m
              </span>
              <button
                type="button"
                tabIndex={-1}
                onClick={handleUtilityClick(onCallBusToNavTarget)}
                className="px-1.5 py-0.5 rounded bg-emerald-400/25 hover:bg-emerald-400/40 border border-emerald-300/45 text-emerald-100 text-[10px] font-medium cursor-pointer"
              >
                Call Bus
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Clear Live Navigation"
                onClick={handleUtilityClick(onClearNavigation)}
                className="p-0.5 rounded hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {hud.busDispatch.phase !== 'idle' && (
            <div
              data-testid="hud-bus-dispatch-banner"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-emerald-300/30 text-[11px]"
            >
              <Bus className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-emerald-100 font-medium truncate max-w-[210px]">
                {hud.busDispatch.statusMessage}
              </span>
              {(hud.busDispatch.phase === 'arrived_pickup' ||
                hud.busDispatch.phase === 'en_route_pickup') && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleUtilityClick(onBoardDispatchedBus)}
                  className="px-2 py-0.5 rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-[10px] cursor-pointer"
                >
                  Board Bus
                </button>
              )}
              <button
                type="button"
                tabIndex={-1}
                onClick={handleUtilityClick(onCancelMobileBus)}
                className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
          {(hud.skyTaxi.phase === 'en_route_pickup' ||
            hud.skyTaxi.phase === 'arrived_pickup' ||
            hud.skyTaxi.phase === 'flying_to_destination' ||
            hud.skyTaxi.playerOnboard) && (
            <div
              data-testid="hud-sky-taxi-banner"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-sky-300/30 text-[11px]"
            >
              <Plane className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span className="text-sky-100 font-medium truncate max-w-[230px]">
                {hud.skyTaxi.statusMessage}
              </span>
              {!hud.skyTaxi.playerOnboard &&
                (hud.skyTaxi.phase === 'arrived_pickup' ||
                  hud.skyTaxi.phase === 'en_route_pickup') && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onBoardSkyTaxi)}
                    className="px-2 py-0.5 rounded bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-[10px] cursor-pointer"
                  >
                    Board Sky Taxi
                  </button>
                )}
              {hud.skyTaxi.playerOnboard ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleUtilityClick(onInteractClick)}
                  className="px-2 py-0.5 rounded bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold text-[10px] cursor-pointer"
                >
                  Exit Sky Taxi [E]
                </button>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleUtilityClick(onCancelSkyTaxi)}
                  className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
          {hud.exhibitionTestVehicleId && (
            <div
              data-testid="hud-exhibition-return-banner"
              className="mt-1.5 pointer-events-auto flex items-center gap-2 pt-1.5 border-t border-amber-300/30 text-[11px]"
            >
              <span className="text-amber-200 font-medium">Exhibition Test Drive Active</span>
              <button
                type="button"
                tabIndex={-1}
                onClick={handleUtilityClick(onReturnToExhibition)}
                className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[10px] cursor-pointer"
              >
                Return to Exhibition
              </button>
            </div>
          )}
          {hud.stationAnnouncement && (
            <div
              data-testid="station-pa-banner"
              className="mt-1.5 pt-1.5 border-t border-amber-200/25 text-[11px] max-w-[320px]"
            >
              <div className="flex items-center gap-1.5 text-amber-200 font-semibold">
                <Megaphone className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span className="truncate">{hud.stationAnnouncement.regionTag}</span>
                <span className="text-[9px] font-normal text-amber-100/75 ml-auto shrink-0">
                  ♪ {hud.stationAnnouncement.chimeName}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-100/95">
                {hud.stationAnnouncement.text}
              </p>
            </div>
          )}
          {dino.onIsland && (
            <div className="mt-2 pt-2 border-t border-[#FACC15]/30 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold tracking-wider text-[#FDE047] uppercase">
                  {dino.bannerText}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#BBF7D0]">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Explorer
                    </span>
                    <span className="font-mono-tabular font-semibold">
                      {dino.explorerHp}/{dino.explorerMaxHp}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-[#1F2937] overflow-hidden mt-0.5">
                    <div className="h-full bg-[#22C55E]" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#FECACA]">
                    <span>T-Rex Chase</span>
                    <span className="font-mono-tabular font-semibold">
                      {dino.dinoHp}/{dino.dinoMaxHp}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-[#1F2937] overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-[#EF4444] transition-all duration-150"
                      style={{
                        width: `${Math.max(0, Math.round((dino.dinoHp / dino.dinoMaxHp) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono-tabular">
                <span className="px-1.5 py-0.5 rounded bg-[#27203A] text-[#FDE047] border border-[#FACC15]/35">
                  KILLS: {dino.kills}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#27203A] text-[#FCA5A5] border border-[#EF4444]/35">
                  WALLS: {dino.brokenWalls}/4 BROKEN
                </span>
              </div>
            </div>
          )}
          {hud.homeVault.inPersonalHome && !hud.homeVault.inVault && (
            <div
              data-testid="hud-home-secret-button-bar"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-cyan-400/35 text-[11px]"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                En Illam Secret Floor
              </span>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-vault-toggle-btn"
                onClick={handleUtilityClick(onToggleHomeVaultHatch)}
                className={`px-2.5 py-0.5 rounded font-semibold text-[10px] cursor-pointer transition-colors ${
                  hud.homeVault.hatchUnlocked
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-500'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-sm shadow-cyan-400/30'
                }`}
              >
                {hud.homeVault.hatchUnlocked ? 'Close Hidden Floor Hatch' : 'Press Secret Underground Button'}
              </button>
              {hud.homeVault.hatchUnlocked && (
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-vault-enter-btn"
                  onClick={handleUtilityClick(onEnterHomeVault)}
                  className="px-2.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] cursor-pointer shadow-sm"
                >
                  Go Down to Secret Superhero Vault &amp; Garage
                </button>
              )}
            </div>
          )}
          {hud.homeVault.inVault && (
            <div
              data-testid="hud-home-vault-banner"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-amber-400/35 text-[11px]"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                Secret Underground Floor · 7 Hero Suits &amp; 4 Cars
              </span>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-vault-exit-btn"
                onClick={handleUtilityClick(onExitHomeVault)}
                className="px-2.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[10px] cursor-pointer"
              >
                Go Up to House
              </button>
            </div>
          )}
        </div>

        {/* Top-Right: Compact Square Utility Strip */}
        <div className="pointer-events-auto shrink-0 flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            data-testid="open-hero-armory-btn"
            aria-label="Open 360 Hero Armory and Batmobile Studio (U)"
            title="360° Hero Armory — Steve, Iron Man, Hulkbuster, Batman, Spider-Man & Batmobile (U)"
            onClick={handleUtilityClick(onOpenHeroArmory)}
            className={`h-8 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeHeroSpec
                ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#2A182E]/90 border-amber-400/55 text-amber-200 hover:bg-[#3A2140]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{activeHeroSpec ? activeHeroSpec.name.split(' ')[0] : 'Heroes'}</span>
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label={
              hud.iceland.isGiant
                ? 'Switch to Small Form (1.68m)'
                : 'Switch to Giant Form (23.5m)'
            }
            aria-pressed={hud.iceland.isGiant}
            title={
              hud.iceland.isGiant
                ? 'Currently Giant (23.5m) — Click to become Small (1.68m) even in Snow Place!'
                : 'Currently Small (1.68m) — Click to become Giant (23.5m) everywhere!'
            }
            onClick={handleUtilityClick(onToggleGiantSmall)}
            className={`h-8 sm:h-10 px-2 sm:px-2.5 flex items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              hud.iceland.isGiant
                ? 'bg-[#8DE4FF] border-[#C9F4FF] text-[#112233] font-semibold'
                : 'bg-[#191429]/82 border-[#F5D6C0]/20 text-[#D8F3FF] hover:bg-[#271F3F]/92'
            }`}
          >
            <Snowflake className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {hud.iceland.isGiant ? 'Be Small' : 'Be Giant'}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-igloo-man-btn"
            aria-label={
              hud.home.outfit === 'igloo_man'
                ? 'Switch back from Igloo Man Iceland Form'
                : 'Become Igloo Man (Iceland Form)'
            }
            aria-pressed={hud.home.outfit === 'igloo_man'}
            title={
              hud.home.outfit === 'igloo_man'
                ? 'Currently Igloo Man (Iceland) — Click to return to traveler outfit'
                : 'Transform into Iceland Igloo Man (works at Normal & Giant sizes!)'
            }
            onClick={handleUtilityClick(onToggleIglooMan)}
            className={`h-8 sm:h-10 px-2 sm:px-2.5 flex items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              hud.home.outfit === 'igloo_man'
                ? 'bg-cyan-300 border-cyan-100 text-[#0c2233] font-semibold'
                : 'bg-[#191429]/82 border-cyan-300/30 text-cyan-200 hover:bg-[#232b45]'
            }`}
          >
            <MountainSnow className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {hud.home.outfit === 'igloo_man' ? 'Igloo Man ✓' : 'Igloo Man'}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Dreamline Mobile Phone (P)"
            title="Dreamline Mobile — Call Bus Pickup & GPS (P)"
            data-testid="hud-mobile-phone-btn"
            onClick={handleUtilityClick(onOpenMobilePhone)}
            className="relative h-8 sm:h-10 px-2 sm:px-2.5 flex items-center justify-center gap-1.5 rounded-md bg-[#122628] border border-emerald-400/45 text-emerald-200 hover:bg-[#1a383b] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="hidden sm:inline">Mobile</span>
            {hud.busDispatch.phase !== 'idle' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Bus and Train Departure Timing Map"
            title="Bus & Train Live Departure Timing Map"
            onClick={handleUtilityClick(onOpenTransitMap)}
            className="h-8 sm:h-10 px-2 sm:px-2.5 flex items-center justify-center gap-1.5 rounded-md bg-[#191429]/82 border border-[#F4BE98]/32 text-[#FCE2C8] hover:bg-[#271F3F]/92 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Clock className="w-4 h-4 text-[#F4BE98] shrink-0" />
            <span className="hidden lg:inline">Timings</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Travel Home to En Illam"
            title="Return to En Illam (My Home)"
            onClick={handleUtilityClick(onGoHome)}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-[#191429]/82 border border-[#F5D6C0]/20 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#F4BE98]" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Open 5-Region World Map (M)"
            title="World Map (M)"
            onClick={handleUtilityClick(onToggleMap)}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-[#191429]/82 border border-[#F5D6C0]/20 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-lantern-btn"
            aria-label={
              hud.lanternOn
                ? 'Turn Personal Lantern Off (L)'
                : 'Turn Personal Lantern On (L)'
            }
            aria-pressed={hud.lanternOn}
            title={
              hud.lanternOn
                ? 'Personal Lantern ON — Click or press L to extinguish'
                : 'Personal Lantern OFF — Click or press L to light your lantern'
            }
            onClick={handleUtilityClick(onToggleLantern)}
            className={`h-8 sm:h-10 px-2 sm:px-2.5 flex items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              hud.lanternOn
                ? 'bg-amber-400 border-amber-200 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                : 'bg-[#191429]/82 border-[#F5D6C0]/20 text-[#FCE2C8] hover:bg-[#271F3F]/92'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">
              {hud.lanternOn ? 'Lantern On' : 'Lantern'}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Time and Weather Controls"
            aria-expanded={atmosphereOpen}
            title="Sky & Weather (T)"
            onClick={handleUtilityClick(onToggleAtmosphere)}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
              atmosphereOpen
                ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E]'
                : 'bg-[#191429]/82 border-[#F5D6C0]/20 text-[#F7EFE8] hover:bg-[#271F3F]/92'
            }`}
          >
            <CloudSun className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            title={muted ? 'Unmute' : 'Mute'}
            onClick={handleUtilityClick(onToggleMute)}
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-md bg-[#191429]/82 border border-[#F5D6C0]/20 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Download Android App / APK"
            title="Download Android App / APK"
            onClick={handleUtilityClick(onOpenAndroidApp)}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-[#191429]/82 border border-[#8DE4FF]/28 text-[#AEEBFF] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Menu (Esc)"
            title="Pause (Esc)"
            onClick={handleUtilityClick(onOpenPause)}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-[#191429]/82 border border-[#F5D6C0]/20 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Perimeter Area */}
      {!atmosphereOpen && (
        <div className="flex flex-col gap-2.5 pb-1">
          {/* Frosty Ice Companion Speech Banner */}
          {hud.companion.currentLine && (
            <CompanionSpeechBanner
              name={hud.companion.name}
              tamilName={hud.companion.tamilName}
              line={hud.companion.currentLine}
            />
          )}

          {hud.recentNotice && (
            <div className="flex justify-center">
              <div
                role="status"
                className="px-3.5 py-1.5 rounded-md bg-[#1A152C]/88 border border-[#F5C5A3]/30 text-xs sm:text-sm text-[#FAF2EA] tracking-wide text-center max-w-[90vw]"
              >
                {hud.recentNotice}
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-2 sm:gap-3">
            {/* Bottom-Left: Responsive Mobile Virtual Joystick (foot, bike, skate, boat, AND train cabin walk!) */}
            <div className="pointer-events-auto shrink-0">
              {showJoystick && <MobileJoystick onMove={onJoystickMove} />}
            </div>

            {/* Bottom-Center: Interact Prompt / Realistic Train PID / Bus / Boat Bar */}
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              {hud.activeVehicle === 'train' ? (
                <div className="pointer-events-auto w-full max-w-3xl rounded-lg bg-[#191429]/92 border border-[#F4C29F]/32 px-3.5 py-2.5 text-xs sm:text-sm text-[#FAF5EF] shadow-xl space-y-2">
                  {/* Top Row: Live Passenger Information Display */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <TrainFront className="w-4 h-4 text-[#F4BE98] shrink-0" />
                      <span className="font-mono-tabular text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#2D2448] text-[#F4BE98]">
                        {hud.train.trainNumber}
                      </span>
                      <span className="font-display font-semibold truncate">
                        {hud.train.phase === 'stopped'
                          ? `At ${currentStation?.name ?? 'Station'}`
                          : `Next Stop: ${nextStation?.name ?? 'Station'}`}
                      </span>
                      {routeDestStation && (
                        <span className="hidden sm:inline text-xs text-[#D8C5BC]">
                          → Dest: <strong className="text-[#FCE2C8] font-medium">{routeDestStation.name}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono-tabular shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded border ${
                          hud.train.doorOpen >= 0.35
                            ? 'bg-[#213B34] border-[#8CD9B2]/45 text-[#B9F3D5]'
                            : 'bg-[#261F3E] border-[#F5D6C0]/18 text-[#E8CFC0]'
                        }`}
                      >
                        {hud.train.doorOpen >= 0.35
                          ? 'Doors Open'
                          : formatBoardingStatus(hud.train.boardingStatus)}
                      </span>
                      <span className="text-[#FCE2C8]">
                        {hud.train.phase === 'stopped'
                          ? hud.train.dwellHold || routePlan?.status === 'completed'
                            ? 'Ready'
                            : `Dep ${Math.ceil(hud.train.etaSeconds)}s`
                          : `${hud.train.speedKmh} km/h · ETA ${Math.ceil(hud.train.etaSeconds)}s`}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Synchronized Journey Progress & Stop Chips */}
                  {routePlan && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-[#2A2242] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            routePlan.includesIcelandTransfer ? 'bg-[#8DE4FF]' : 'bg-[#F4BE98]'
                          }`}
                          style={{ width: `${Math.max(4, Math.round(hud.train.journeyProgress * 100))}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        {routePlan.allUpcomingIndices.map((idx) => {
                          const st = STATIONS[idx];
                          if (!st) return null;
                          const selected = routePlan.selectedStopIndices.includes(idx);
                          const visited = routePlan.visitedStopIndices.includes(idx);
                          const skippedPassed = routePlan.skippedStopIndices.includes(idx);
                          const isNext = hud.train.nextStationIndex === idx && !visited;
                          return (
                            <span
                              key={st.id}
                              className={`px-1.5 py-0.5 rounded border ${
                                visited
                                  ? 'bg-[#213B34]/90 border-[#8CD9B2]/45 text-[#B9F3D5]'
                                  : isNext
                                  ? 'bg-[#3C2B46] border-[#F4BE98]/65 text-[#FCE2C8] font-medium'
                                  : selected
                                  ? 'bg-[#26203E] border-[#F5D6C0]/25 text-[#EFE3DA]'
                                  : skippedPassed
                                  ? 'bg-[#1D1830] border-dashed border-[#F5D6C0]/12 text-[#8F839E] line-through'
                                  : 'bg-[#1D1830] border-dashed border-[#F5D6C0]/18 text-[#A99DB8]'
                              }`}
                            >
                              {st.name}
                              {!selected ? ' (Skip)' : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bottom Row: Cabin Views, Driver Mode, Route Select, Iceland Transfer & Exit */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div
                      role="group"
                      aria-label="Train Camera View"
                      className="flex items-center gap-1 p-0.5 rounded bg-[#231C3A] border border-[#F5D6C0]/16"
                    >
                      {(
                        [
                          { id: 'window', label: 'Window' },
                          { id: 'cabin', label: 'Walk Cabin' },
                          { id: 'driver', label: 'Driver' },
                          { id: 'exterior', label: 'Exterior' },
                        ] as const
                      ).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          tabIndex={-1}
                          aria-pressed={hud.trainViewMode === v.id}
                          data-testid={`train-view-${v.id}`}
                          onClick={handleUtilityClick(() => onSetTrainView(v.id))}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            hud.trainViewMode === v.id
                              ? v.id === 'driver'
                                ? 'bg-amber-400 text-slate-950 font-semibold'
                                : 'bg-[#F4BE98] text-[#1D162E]'
                              : 'text-[#E3D5CC] hover:bg-[#31284F]'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {hud.trainDriverMode && (
                        <>
                          <span className="px-2 py-1 rounded bg-amber-400/20 border border-amber-300/40 text-[11px] font-semibold text-amber-200">
                            W/S Throttle · Space Brake
                          </span>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(onTrainHorn)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#F5D6C0]/20 cursor-pointer"
                          >
                            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                            <span>Horn [H]</span>
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(onTrainDoors)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#F5D6C0]/20 cursor-pointer"
                          >
                            Doors [O]
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(() => onSetTrainDriverMode(false))}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded bg-cyan-400/25 hover:bg-cyan-400/35 border border-cyan-300/45 text-cyan-100 cursor-pointer"
                          >
                            Auto Pilot
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleUtilityClick(onOpenRouteSelect)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#F5D6C0]/20 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Route className="w-3.5 h-3.5 text-[#F4BE98]" />
                        <span>Choose Stops</span>
                      </button>

                      {hud.canTransferToIceland && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(onEnterIceland)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-[#8DE4FF] hover:bg-[#B2EEFF] text-[#112233] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>Enter Panimalai Iceland</span>
                        </button>
                      )}

                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleUtilityClick(onInteractClick)}
                        disabled={!hud.canExitTrain}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                          hud.canExitTrain
                            ? 'bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] cursor-pointer'
                            : 'bg-[#221C35]/70 text-[#B8A9C2] cursor-not-allowed'
                        }`}
                      >
                        {hud.canExitTrain ? 'Exit Train [E]' : hud.trainDriverMode ? 'Stop to Exit' : 'Exit at Selected Stop'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : hud.activeVehicle === 'bus' ? (
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#191429]/92 border border-[#63B4B8]/45 text-xs sm:text-sm text-[#FAF5EF] shadow-xl">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#63B4B8]" />
                    <span className="font-display font-medium">
                      {hud.busDriverMode
                        ? 'Bus Driver Mode · WASD to Drive'
                        : hud.busDispatch.phase === 'driving_to_destination'
                        ? `Mobile Bus -> ${hud.busDispatch.destination?.label ?? 'Destination'}`
                        : hud.bus.phase === 'stopped'
                        ? `Stopped: ${currentBusStop?.name ?? 'Stop'}`
                        : `Next Stop: ${nextBusStop?.name ?? 'Stop'}`}
                    </span>
                    <span className="text-xs font-mono-tabular text-[#D8EAEB]">
                      {hud.bus.speedKmh} km/h
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div
                      role="group"
                      aria-label="Bus View and Driver Mode"
                      className="flex items-center gap-1 p-0.5 rounded bg-[#231C3A] border border-[#63B4B8]/30"
                    >
                      {(
                        [
                          { id: 'window', label: 'Window' },
                          { id: 'driver', label: 'Driver' },
                          { id: 'exterior', label: 'Exterior' },
                        ] as const
                      ).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          tabIndex={-1}
                          data-testid={`bus-view-${v.id}`}
                          onClick={handleUtilityClick(() => onSetTrainView(v.id))}
                          className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                            hud.trainViewMode === v.id
                              ? v.id === 'driver'
                                ? 'bg-emerald-400 text-slate-950 font-semibold'
                                : 'bg-[#63B4B8] text-[#142029]'
                              : 'text-[#E3D5CC] hover:bg-[#31284F]'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                    {hud.busDriverMode && (
                      <>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(onBusHorn)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#63B4B8]/30 cursor-pointer"
                        >
                          Horn [H]
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(onBusDoors)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#63B4B8]/30 cursor-pointer"
                        >
                          Doors [O]
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(() => onSetBusDriverMode(false))}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded bg-cyan-400/25 hover:bg-cyan-400/35 border border-cyan-300/45 text-cyan-100 cursor-pointer"
                        >
                          Auto Pilot
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={handleUtilityClick(onInteractClick)}
                      disabled={!hud.canExitBus}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        hud.canExitBus
                          ? 'bg-[#63B4B8] hover:bg-[#7EC8CC] text-[#142029] cursor-pointer'
                          : 'bg-[#221C35]/70 text-[#B8A9C2] cursor-not-allowed'
                      }`}
                    >
                      {hud.canExitBus ? 'Exit Bus [E]' : hud.busDriverMode ? 'Stop to Exit' : 'Exit at Stop'}
                    </button>
                  </div>
                </div>
              ) : isDrivingCamper ? (
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#211530]/92 border border-[#F2A6D8]/45 text-xs text-[#FAF5EF] shadow-xl">
                  <div className="flex items-center gap-2 pr-1">
                    <Car className="w-4 h-4 text-[#F5AEE0]" />
                    <span className="font-display font-semibold text-[#FFE6F6]">Olga Camper</span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#34214A] text-[#FBD3EE]">
                      {hud.camper.speedKmh} km/h
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleCamperDoors)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                      hud.camper.doorsOpen
                        ? 'bg-[#F2A6D8] border-[#FFD3F0] text-[#22122E]'
                        : 'bg-[#2C1F3E] border-[#F2A6D8]/25 text-[#F6E2F0] hover:bg-[#3B2A52]'
                    }`}
                  >
                    Doors [O]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleCamperRoof)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                      hud.camper.roofPopped
                        ? 'bg-[#F2A6D8] border-[#FFD3F0] text-[#22122E]'
                        : 'bg-[#2C1F3E] border-[#F2A6D8]/25 text-[#F6E2F0] hover:bg-[#3B2A52]'
                    }`}
                  >
                    Pop Roof [R]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleCamperLights)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                      hud.camper.headlightsOn
                        ? 'bg-[#FFE6A3] border-[#FFF3CE] text-[#241A0F]'
                        : 'bg-[#2C1F3E] border-[#F2A6D8]/25 text-[#F6E2F0] hover:bg-[#3B2A52]'
                    }`}
                  >
                    Lights [L]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleCamperHazards)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                      hud.camper.hazardsOn
                        ? 'bg-[#FFB35C] border-[#FFD7A3] text-[#24160A]'
                        : 'bg-[#2C1F3E] border-[#F2A6D8]/25 text-[#F6E2F0] hover:bg-[#3B2A52]'
                    }`}
                  >
                    Hazards [H]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleTrainView)}
                    className="px-2.5 py-1 rounded bg-[#2C1F3E] hover:bg-[#3B2A52] border border-[#F2A6D8]/25 text-[11px] font-medium text-[#F6E2F0] cursor-pointer"
                  >
                    View [V]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onInteractClick)}
                    className="px-3 py-1 rounded bg-[#F5AEE0] hover:bg-[#FFCAEF] text-[#22122E] text-[11px] font-semibold cursor-pointer"
                  >
                    Exit Olga [E]
                  </button>
                </div>
              ) : isDrivingSafariCar ? (
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#1C1612]/94 border border-[#F59E0B]/55 text-xs text-[#FAF5EF] shadow-xl">
                  <div className="flex items-center gap-2 pr-1">
                    <Car className="w-4 h-4 text-[#FBBF24]" />
                    <span className="font-display font-semibold text-[#FEF3C7]">Safari 4x4</span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#362814] text-[#FDE68A]">
                      {hud.safariCarSpeedKmh} km/h
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onFireAk47)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Fire AK-47 [K/F]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onSpawnDinoWave)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#2A223E] hover:bg-[#3A2F58] border border-[#FACC15]/40 text-[#FEF08A] text-xs font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Next Dino [N]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleSafariCar)}
                    className="px-3 py-1.5 rounded bg-[#F59E0B] hover:bg-[#FBBF24] text-[#1A1208] text-xs font-semibold cursor-pointer"
                  >
                    Exit Car [E/J]
                  </button>
                </div>
              ) : isFlyingSkyExplorer ? (
                <div
                  data-testid="hud-sky-explorer-panel"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#112432]/94 border border-[#5FE2FF]/50 text-xs text-[#F0FAFF] shadow-xl"
                >
                  <div className="flex items-center gap-2 pr-1">
                    <Wind className="w-4 h-4 text-[#5FE2FF]" />
                    <span className="font-display font-semibold text-[#E8FAFF]">
                      SSJ Tropical Sky Explorer
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#1A394D] text-[#8CEBFF]">
                      ALT {hud.skyExplorer.altitudeM}m
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#1A394D] text-[#FFE8A3]">
                      {hud.skyExplorer.speedKmh} km/h
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Ascend Sky Explorer (Space)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSkyVertical(true, false);
                    }}
                    onPointerUp={() => onSkyVertical(false, false)}
                    onPointerLeave={() => onSkyVertical(false, false)}
                    onPointerCancel={() => onSkyVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1E445A] hover:bg-[#275A75] border border-[#5FE2FF]/40 text-[#E0F8FF] text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Up [Space]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Descend Sky Explorer (Q or Ctrl)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSkyVertical(false, true);
                    }}
                    onPointerUp={() => onSkyVertical(false, false)}
                    onPointerLeave={() => onSkyVertical(false, false)}
                    onPointerCancel={() => onSkyVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1E445A] hover:bg-[#275A75] border border-[#5FE2FF]/40 text-[#E0F8FF] text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Down [Q]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Hold to Boost Sky Explorer (Shift)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onMobileSprintChange(true);
                    }}
                    onPointerUp={() => onMobileSprintChange(false)}
                    onPointerLeave={() => onMobileSprintChange(false)}
                    onPointerCancel={() => onMobileSprintChange(false)}
                    style={{ touchAction: 'none' }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-medium cursor-pointer select-none ${
                      hud.skyExplorer.boostActive
                        ? 'bg-[#FFE082] border-[#FFF3C4] text-[#1A160B] font-semibold'
                        : 'bg-[#1E445A] hover:bg-[#275A75] border-[#5FE2FF]/40 text-[#E0F8FF]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Boost [Shift]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onInteractClick)}
                    className="px-3 py-1.5 rounded bg-[#5FE2FF] hover:bg-[#8DEDFF] text-[#0D202C] text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Land &amp; Exit [E]
                  </button>
                </div>
              ) : isFlyingAirliner ? (
                <div
                  data-testid="airliner-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0C1D2E]/94 border border-sky-300/55 text-xs text-sky-50 shadow-2xl"
                >
                  <div className="flex items-center gap-2 pr-1">
                    <Plane className="w-4 h-4 text-sky-300" />
                    <span className="font-display font-semibold text-sky-100">
                      DL-787 Dreamliner
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-semibold">
                      {hud.airliner.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-800 text-amber-200">
                      ALT {hud.airliner.altitudeM}m
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 text-[10px]">
                      GEAR {hud.airliner.landingGearDown ? 'DOWN' : 'UP'}
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSkyVertical(true, false);
                    }}
                    onPointerUp={() => onSkyVertical(false, false)}
                    onPointerLeave={() => onSkyVertical(false, false)}
                    onPointerCancel={() => onSkyVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-sky-500/25 hover:bg-sky-500/40 border border-sky-300/40 text-sky-100 text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Climb [Space]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSkyVertical(false, true);
                    }}
                    onPointerUp={() => onSkyVertical(false, false)}
                    onPointerLeave={() => onSkyVertical(false, false)}
                    onPointerCancel={() => onSkyVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-sky-500/25 hover:bg-sky-500/40 border border-sky-300/40 text-sky-100 text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Descend [Q]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="airliner-skydive-btn"
                    onClick={handleUtilityClick(() => onExitAirliner(true))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Skydive + Parachute</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(() => onExitAirliner(false))}
                    className="px-3 py-1.5 rounded bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Exit Jet [E]
                  </button>
                </div>
              ) : isDrivingBatmobile ? (
                <div
                  data-testid="batmobile-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0D111A]/94 border border-amber-400/50 text-xs text-slate-100 shadow-2xl"
                >
                  <div className="flex items-center gap-2 pr-1">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span className="font-display font-semibold text-amber-200">
                      Armoured Batmobile
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">
                      {hud.batmobile.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                      Armour {Math.round(hud.batmobile.integrity)}%
                    </span>
                    {hud.batmobile.boostActive && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-semibold text-[10px]">
                        AFTERBURNER
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleBatmobileCanopy)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                      hud.batmobile.canopyOpen
                        ? 'bg-cyan-400 border-cyan-200 text-slate-950 font-semibold'
                        : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    Canopy [O]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleBatmobileLights)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                      hud.batmobile.headlightsOn
                        ? 'bg-amber-300 border-amber-100 text-slate-950 font-semibold'
                        : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    Lights [L]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onCycleBatmobileCamera)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-[11px] font-medium text-slate-100 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{hud.batmobile.cameraMode.toUpperCase()} [V]</span>
                  </button>
                  {hud.batmobile.integrity < 100 && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={handleUtilityClick(onRepairBatmobile)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-400/25 hover:bg-emerald-400/35 border border-emerald-300/45 text-emerald-100 text-[11px] font-semibold cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Repair [R]</span>
                    </button>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onExitBatmobile)}
                    className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-semibold cursor-pointer"
                  >
                    Exit [E]
                  </button>
                </div>
              ) : isDrivingVaultCar ? (
                <div
                  data-testid="vault-car-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0D111A]/94 border border-cyan-400/50 text-xs text-slate-100 shadow-2xl"
                >
                  <div className="flex items-center gap-2 pr-1">
                    <Car className="w-4 h-4 text-cyan-300" />
                    <span className="font-display font-semibold text-cyan-200">
                      {hud.homeVault.activeVaultCarName ?? 'Underground Garage Car'}
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                      {hud.homeVault.activeVaultCarSpeedKmh} km/h
                    </span>
                    {hud.homeVault.activeVaultCarBoost && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-semibold text-[10px]">
                        TURBO
                      </span>
                    )}
                    {hud.homeVault.inVault && (
                      <span className="hidden sm:inline text-[11px] text-slate-300">
                        Drive East Tunnel to exit outdoors
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleVaultCarLights)}
                    className="px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-[11px] font-medium text-amber-200 cursor-pointer"
                  >
                    Lights [L]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vault-car-exit-btn"
                    onClick={handleUtilityClick(onExitVaultCar)}
                    className="px-3 py-1 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[11px] font-semibold cursor-pointer"
                  >
                    Exit Car [E]
                  </button>
                </div>
              ) : isDrivingBoat ? (
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 px-4 py-2.5 rounded-md bg-[#191429]/92 border border-[#85C7DE]/45 text-xs sm:text-sm text-[#FAF5EF] shadow-xl">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-[#85C7DE]" />
                    <span className="font-display font-medium">
                      {activeBoat?.name ?? 'Boat'}
                    </span>
                    <span className="hidden sm:inline text-xs text-[#D4E6EE]">
                      WASD / Joystick · Shift Boost
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="boat-fpv-toggle-btn"
                    aria-pressed={hud.boatFpvMode}
                    onClick={handleUtilityClick(() => onToggleBoatFpv(!hud.boatFpvMode))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border cursor-pointer whitespace-nowrap transition-colors ${
                      hud.boatFpvMode
                        ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E] font-semibold'
                        : 'bg-[#26203E] hover:bg-[#342B55] border-[#85C7DE]/40 text-[#E5F6FC]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{hud.boatFpvMode ? 'Bow POV (1st)' : '3rd Person'}</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onInteractClick)}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-[#85C7DE] hover:bg-[#A1D8EB] text-[#12202B] cursor-pointer whitespace-nowrap"
                  >
                    Exit / Swim [E]
                  </button>
                </div>
              ) : hud.isSitting ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleUtilityClick(onInteractClick)}
                  className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-[#191429]/88 border border-[#F4C29F]/30 text-xs sm:text-sm text-[#FAF5EF] hover:bg-[#271F3F] transition-colors cursor-pointer"
                >
                  <span className="font-mono-tabular text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F4BE98] text-[#1D162E]">
                    E
                  </span>
                  <span>Stand Up</span>
                </button>
              ) : (
                <>
                  {/* Station Train Status Banner when near a Railway Platform */}
                  {hud.activeVehicle === 'none' && nearbyStation && (
                    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-3.5 py-1.5 rounded-md bg-[#181327]/86 border border-[#F4C29F]/28 text-[11px] sm:text-xs text-[#F5EBE3]">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#FCE2C8]">
                        <TrainFront className="w-3.5 h-3.5 text-[#F4BE98]" />
                        {hud.train.trainNumber} · {hud.train.trainName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          hud.train.phase === 'stopped' &&
                          hud.train.currentStationIndex === hud.nearbyStationIndex
                            ? 'text-[#9EE4C0] font-semibold'
                            : 'text-[#E3D1C6]'
                        }
                      >
                        {hud.train.phase === 'stopped' &&
                        hud.train.currentStationIndex === hud.nearbyStationIndex
                          ? formatBoardingStatus(hud.train.boardingStatus)
                          : hud.train.nextStationIndex === hud.nearbyStationIndex
                          ? `Arriving in ${Math.ceil(hud.train.etaSeconds)}s`
                          : `Next Stop: ${nextStation?.name ?? 'Loop'}`}
                      </span>
                      {nearbyStation.connectsToIceland && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#9CE8FF]">Iceland Transfer</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Contextual SSJ Dinosaur Island Action Bar on foot */}
                  {dino.onIsland && hud.activeVehicle === 'none' && (
                    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#161423]/92 border border-[#FACC15]/45 shadow-lg">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleUtilityClick(onFireAk47)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Fire AK-47 [K/F]</span>
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleUtilityClick(onToggleSafariCar)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#D97706] hover:bg-[#F59E0B] text-[#1A1208] text-xs font-semibold cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Drive Safari Car [J]</span>
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleUtilityClick(onSpawnDinoWave)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#27203F] hover:bg-[#362C58] border border-[#FACC15]/40 text-[#FEF08A] text-xs font-medium cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Next Endless Dino [N]</span>
                      </button>
                    </div>
                  )}

                  {/* Active 3D Hero Action Bar on foot */}
                  {activeHeroSpec && hud.activeVehicle === 'none' && (
                    <div
                      data-testid="hero-action-bar"
                      className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#141122]/92 border border-amber-400/45 shadow-xl text-xs text-slate-100"
                    >
                      <div className="flex items-center gap-1.5 pr-1.5 border-r border-white/15">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-display font-semibold text-amber-200">
                          {activeHeroSpec.name}
                        </span>
                        {activeHeroOutfit && (
                          <span className="hidden md:inline text-[11px] text-slate-300">
                            · {activeHeroOutfit.label}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="hero-primary-power-btn"
                        onClick={handleUtilityClick(onHeroPrimaryPower)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          {activeHeroSpec.primaryPower.label} [{activeHeroSpec.primaryPower.keyHint}]
                        </span>
                      </button>

                      {(activeHeroSpec.mobility.canFly ||
                        activeHeroSpec.mobility.canWebSwing ||
                        activeHeroSpec.mobility.canCapeGlide) && (
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="hero-mobility-btn"
                          onClick={handleUtilityClick(onHeroFlightOrSpecial)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            hud.hero.isFlying || hud.hero.isGliding || hud.hero.isWebSwinging
                              ? 'bg-cyan-400 border-cyan-200 text-slate-950'
                              : 'bg-sky-500/25 hover:bg-sky-500/40 border-sky-300/45 text-sky-100'
                          }`}
                        >
                          <Wind className="w-3.5 h-3.5" />
                          <span>
                            {activeHeroSpec.mobility.canFly
                              ? hud.hero.isFlying
                                ? 'Land [F]'
                                : 'Fly / Hover [F]'
                              : activeHeroSpec.mobility.canWebSwing
                              ? 'Web-Zip [F]'
                              : hud.hero.isGliding
                              ? 'Drop Glide [F]'
                              : 'Cape Glide [F]'}
                          </span>
                        </button>
                      )}

                      {activeHeroSpec.mobility.canFly && hud.hero.isFlying && (
                        <>
                          <button
                            type="button"
                            tabIndex={-1}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              onSkyVertical(true, false);
                            }}
                            onPointerUp={() => onSkyVertical(false, false)}
                            onPointerLeave={() => onSkyVertical(false, false)}
                            onPointerCancel={() => onSkyVertical(false, false)}
                            style={{ touchAction: 'none' }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-300/45 text-cyan-100 text-xs font-semibold cursor-pointer select-none"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>Up</span>
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              onSkyVertical(false, true);
                            }}
                            onPointerUp={() => onSkyVertical(false, false)}
                            onPointerLeave={() => onSkyVertical(false, false)}
                            onPointerCancel={() => onSkyVertical(false, false)}
                            style={{ touchAction: 'none' }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-300/45 text-cyan-100 text-xs font-semibold cursor-pointer select-none"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>Down</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="hero-secondary-power-btn"
                        onClick={handleUtilityClick(onHeroSecondaryPower)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium cursor-pointer whitespace-nowrap ${
                          hud.hero.energyShieldActive ||
                          hud.hero.spiderSenseActive ||
                          hud.hero.detectiveVisionActive
                            ? 'bg-emerald-400 border-emerald-200 text-slate-950 font-semibold'
                            : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600 text-slate-100'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-cyan-300" />
                        <span>
                          {activeHeroSpec.secondaryPower.label} [{activeHeroSpec.secondaryPower.keyHint}]
                        </span>
                      </button>

                      {activeHeroSpec.outfits.length > 1 && (
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="hero-swap-outfit-btn"
                          onClick={handleUtilityClick(onCycleHeroOutfit)}
                          className="px-2.5 py-1.5 rounded bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-300/45 text-indigo-100 text-xs font-medium cursor-pointer whitespace-nowrap"
                        >
                          Swap Suit [C/V]
                        </button>
                      )}

                      {activeHeroSpec.mobility.hasHelmetToggle && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(onToggleHeroHelmet)}
                          className="px-2.5 py-1.5 rounded bg-amber-500/25 hover:bg-amber-500/40 border border-amber-300/45 text-amber-100 text-xs font-medium cursor-pointer whitespace-nowrap"
                        >
                          {hud.hero.helmetOpen ? 'Seal Helmet' : 'Open Faceplate'}
                        </button>
                      )}

                      {activeHeroSpec.mobility.hasBatmobileLink && (
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="summon-batmobile-btn"
                          onClick={handleUtilityClick(() => onSpawnBatmobile(false))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>Batmobile</span>
                        </button>
                      )}

                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="hud-parachute-btn"
                        onClick={handleUtilityClick(onToggleParachute)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          hud.parachuteActive
                            ? 'bg-emerald-400 border-emerald-200 text-slate-950'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-300/40 text-emerald-100'
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>{hud.parachuteActive ? 'Fold Chute [G]' : 'Parachute [G]'}</span>
                      </button>
                    </div>
                  )}

                  {!activeHeroSpec && hud.parachuteActive && hud.activeVehicle === 'none' && (
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="hud-parachute-active-btn"
                      onClick={handleUtilityClick(onToggleParachute)}
                      className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-lg cursor-pointer"
                    >
                      <Wind className="w-4 h-4" />
                      <span>Parachute Glide Active · Fold [G]</span>
                    </button>
                  )}

                  {hud.activePrompt && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={handleUtilityClick(onInteractClick)}
                      className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-[#191429]/90 border border-[#F4C29F]/35 text-xs sm:text-sm text-[#FAF5EF] hover:bg-[#271F3F] transition-colors cursor-pointer"
                    >
                      <span className="font-mono-tabular text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F4BE98] text-[#1D162E]">
                        E
                      </span>
                      <span>{hud.activePrompt.label}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Bottom-Right: Walk / Bicycle / Skateboard Switcher + Boost */}
            {hud.activeVehicle === 'none' && (
              <div className="pointer-events-auto shrink-0 flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  {hud.transportMode === 'bicycle' && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Ring Bicycle Bell (R)"
                      title="Bicycle Bell (R)"
                      onClick={handleUtilityClick(onRingBicycleBell)}
                      className="h-9 px-2.5 flex items-center gap-1.5 rounded-md bg-[#191429]/85 border border-[#F5D6C0]/25 text-xs text-[#FAF5EF] hover:bg-[#271F3F] transition-colors cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#F4BE98]" />
                      <span className="hidden sm:inline">Bell</span>
                    </button>
                  )}

                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Jump (Space)"
                    title="Jump (Space)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onJump();
                    }}
                    onClick={(e) => {
                      e.currentTarget.blur();
                    }}
                    style={{ touchAction: 'none' }}
                    className={`h-9 px-3 flex items-center gap-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer select-none ${
                      hud.isJumping
                        ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E]'
                        : 'bg-[#191429]/85 border-[#F5D6C0]/25 text-[#FAF5EF] active:bg-[#F4BE98] active:text-[#1D162E] hover:bg-[#271F3F]'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Jump</span>
                  </button>

                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Hold to Sprint"
                    title="Hold to Boost / Run (Shift)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onMobileSprintChange(true);
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      onMobileSprintChange(false);
                    }}
                    onPointerLeave={() => onMobileSprintChange(false)}
                    onPointerCancel={() => onMobileSprintChange(false)}
                    style={{ touchAction: 'none' }}
                    className="h-9 px-3 flex items-center gap-1.5 rounded-md bg-[#191429]/85 border border-[#F5D6C0]/25 text-xs font-medium text-[#FAF5EF] active:bg-[#F4BE98] active:text-[#1D162E] hover:bg-[#271F3F] transition-colors cursor-pointer select-none"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Boost</span>
                  </button>
                </div>

                {!hud.iceland.isGiant && (
                  <div
                    role="group"
                    aria-label="Ride Mode"
                    className="flex items-center gap-1 p-1 rounded-md bg-[#181327]/84 border border-[#F5D6C0]/22"
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Walk on Foot (1)"
                      aria-pressed={hud.transportMode === 'walk'}
                      title="Walk (1)"
                      onClick={handleUtilityClick(() => onSelectTransport('walk'))}
                      className={`h-9 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        hud.transportMode === 'walk'
                          ? 'bg-[#F4BE98] text-[#1D162E]'
                          : 'text-[#EAE0D8] hover:bg-[#271F3F]'
                      }`}
                    >
                      <Footprints className="w-4 h-4" />
                      <span className="hidden sm:inline">Walk</span>
                    </button>

                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Ride Bicycle (2)"
                      aria-pressed={hud.transportMode === 'bicycle'}
                      title="Bicycle (2 / B)"
                      onClick={handleUtilityClick(() => onSelectTransport('bicycle'))}
                      className={`h-9 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        hud.transportMode === 'bicycle'
                          ? 'bg-[#F4BE98] text-[#1D162E]'
                          : 'text-[#EAE0D8] hover:bg-[#271F3F]'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span className="hidden sm:inline">Bicycle</span>
                    </button>

                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Ride Skateboard (3)"
                      aria-pressed={hud.transportMode === 'skateboard'}
                      title="Skateboard (3 / K)"
                      onClick={handleUtilityClick(() => onSelectTransport('skateboard'))}
                      className={`h-9 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        hud.transportMode === 'skateboard'
                          ? 'bg-[#F4BE98] text-[#1D162E]'
                          : 'text-[#EAE0D8] hover:bg-[#271F3F]'
                      }`}
                    >
                      <SkateboardIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Skate</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
