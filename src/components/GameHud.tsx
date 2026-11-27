import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Bike,
  Binoculars,
  Bus,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudLightning,
  CloudSun,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Footprints,
  Home,
  Map as MapIcon,
  Megaphone,
  MountainSnow,
  Navigation,
  Pause,
  Plane,
  RotateCcw,
  Route,
  Shield,
  Ship,
  Smartphone,
  Snowflake,
  TrainFront,
  Video,
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
import { getHeroById, getHeroOutfitById, getHeroPowerOptions } from '../game/heroCharacters';
import {
  CAMERA_PERSPECTIVES,
  type CameraPerspectiveMode,
} from '../game/expeditionVehicles';
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
  hudHidden?: boolean;
  onToggleHudHidden?: () => void;
  onToggleMap: () => void;
  onOpenTransitMap: () => void;
  onOpenMobilePhone: () => void;
  onToggleAtmosphere: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
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
  onJoystickMove: (right: number, forward: number, active?: boolean) => void;
  onMobileSprintChange: (active: boolean) => void;
  onJump: () => void;
  onFireAk47: () => void;
  onToggleSafariCar: () => void;
  onSpawnDinoWave: () => void;
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
  onToggleVaultExitGate: () => void;
  onEnterHomeVault: () => void;
  onExitHomeVault: () => void;
  onExitVaultCar: () => void;
  onToggleVaultCarLights: () => void;
  onSetSubmarineDiveHold: (delta: -1 | 0 | 1) => void;
  onToggleSubmarineSearchlight: () => void;
  onExitSubmarine: () => void;
  onRideUndergroundMetro: (targetStationId: 'metro_central' | 'metro_airport') => void;
  onExitUndergroundMetro: () => void;
  onExitAirliner: (withParachute: boolean) => void;
  onToggleParachute: () => void;
  onToggleLantern: () => void;
  onOpenSnowmanTaxi: () => void;
  onMorphSnowmanCycleJetSki: () => void;
  onCancelSnowmanTaxi: () => void;
  onOpenWildlifeGuide: () => void;
  onPhotographWildlife: () => void;
  onBoardExpeditionVehicle: (
    kind:
      | 'safari_jeep'
      | 'vtol_aircraft'
      | 'jetski_sport'
      | 'jetski_perf'
      | 'dirt_bike_49cc'
      | 'hover_glider'
  ) => void;
  onExitExpeditionVehicle: () => void;
  onToggleSafariJeepLights: () => void;
  onToggleVtolHoverMode: () => void;
  onDirtBikeRev: (active: boolean) => void;
  onToggleDirtBikeKickstand: () => void;
  onVtolVertical: (ascend: boolean, descend: boolean) => void;
  onSetCameraPerspective: (mode: CameraPerspectiveMode) => void;
  onCycleCameraPerspective: () => void;
  onSelectHeroPowerOption: (index: number) => void;
  onHeroDodge: () => void;
  onToggleSpiderDive: () => void;
  onSetTrainDriverNotch: (notch: -1 | 0 | 1 | 2 | 3) => void;
  onJumpTrainSection: (section: 'surface' | 'elevated' | 'subway') => void;
  onBoardSubmarine: () => void;
  onSetSwimDiveHold: (delta: -1 | 0 | 1) => void;
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
  hudHidden = false,
  onToggleHudHidden,
  onToggleMap,
  onOpenTransitMap,
  onOpenMobilePhone,
  onToggleAtmosphere,
  onToggleMute,
  onOpenPause,
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
  onToggleSafariCar,
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
  onToggleVaultExitGate,
  onEnterHomeVault,
  onExitHomeVault,
  onExitVaultCar,
  onToggleVaultCarLights,
  onSetSubmarineDiveHold,
  onToggleSubmarineSearchlight,
  onExitSubmarine,
  onRideUndergroundMetro,
  onExitUndergroundMetro,
  onExitAirliner,
  onToggleParachute,
  onToggleLantern,
  onOpenSnowmanTaxi,
  onMorphSnowmanCycleJetSki,
  onCancelSnowmanTaxi,
  onOpenWildlifeGuide,
  onPhotographWildlife,
  onBoardExpeditionVehicle,
  onExitExpeditionVehicle,
  onToggleSafariJeepLights,
  onToggleVtolHoverMode,
  onDirtBikeRev,
  onToggleDirtBikeKickstand,
  onVtolVertical,
  onSetCameraPerspective,
  onCycleCameraPerspective,
  onSelectHeroPowerOption,
  onHeroDodge,
  onToggleSpiderDive,
  onSetTrainDriverNotch,
  onJumpTrainSection,
  onBoardSubmarine,
  onSetSwimDiveHold,
}) => {
  const [dockExpanded, setDockExpanded] = React.useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
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
  const isDrivingSubmarine = hud.activeVehicle === 'submarine';
  const isDrivingCamper = hud.activeVehicle === 'camper';
  const isDrivingSafariCar = hud.activeVehicle === 'safari_car';
  const isFlyingSkyExplorer = hud.activeVehicle === 'sky_explorer';
  const isFlyingOrangeHeli = hud.activeVehicle === 'orange_heli';
  const isDrivingBatmobile = hud.activeVehicle === 'batmobile';
  const isDrivingVaultCar = hud.activeVehicle === 'vault_car';
  const isFlyingAirliner = hud.activeVehicle === 'airliner';
  const isDrivingSafariJeep = hud.activeVehicle === 'safari_jeep';
  const isRidingDirtBike = hud.activeVehicle === 'dirt_bike_49cc';
  const isFlyingHoverGlider = hud.activeVehicle === 'hover_glider';
  const isFlyingVtol = hud.activeVehicle === 'vtol_aircraft';
  const isRidingSportJetSki = hud.activeVehicle === 'jetski_sport';
  const isRidingPerfJetSki = hud.activeVehicle === 'jetski_perf';
  const isRidingJetSki = isRidingSportJetSki || isRidingPerfJetSki;
  const isExpeditionVehicle =
    isDrivingSafariJeep || isRidingDirtBike || isFlyingHoverGlider || isFlyingVtol || isRidingJetSki;
  React.useEffect(() => {
    if (isExpeditionVehicle) {
      setDockExpanded(false);
    }
  }, [isExpeditionVehicle, hud.activeVehicle]);
  const activeHeroSpec = hud.hero.activeHeroId ? getHeroById(hud.hero.activeHeroId) : null;
  const activeHeroOutfit =
    activeHeroSpec && hud.hero.activeHeroId
      ? getHeroOutfitById(hud.hero.activeHeroId, hud.hero.activeOutfitId)
      : null;
  const activeHeroPowerOptions =
    activeHeroSpec && hud.hero.activeHeroId ? getHeroPowerOptions(hud.hero.activeHeroId) : [];
  const activeHeroPower =
    activeHeroPowerOptions[hud.hero.activePowerIndex] ?? activeHeroPowerOptions[0] ?? null;
  const activeCamSpec =
    CAMERA_PERSPECTIVES.find((c) => c.id === hud.cameraPerspective) ?? CAMERA_PERSPECTIVES[0];

  const handleUtilityClick =
    (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      fn();
    };

  if (hudHidden) {
    return (
      <div
        data-testid="hud-hidden-container"
        className="fixed inset-0 z-10 pointer-events-none flex items-start justify-end p-4 sm:p-5 md:p-7"
      >
        {hud.underwater.submerged && (
          <div
            data-testid="underwater-vignette"
            className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 50% 42%, rgba(10, 88, 122, 0.04) 36%, rgba(4, 34, 58, ${Math.min(
                0.68,
                0.24 + hud.underwater.vignetteAlpha * 0.42
              ).toFixed(2)}) 100%)`,
            }}
          />
        )}
        {onToggleHudHidden && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-show-all-btn"
            aria-label="Show all HUD options (Z)"
            title="Show All HUD Options [Z]"
            onClick={handleUtilityClick(onToggleHudHidden)}
            className="pointer-events-auto relative z-10 min-h-[40px] h-10 px-3 flex items-center justify-center gap-1.5 rounded-md bg-[#161124]/72 hover:bg-[#231B38]/92 border border-[#F5D6C0]/30 text-[#FAF5EF] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-md"
          >
            <Eye className="w-4 h-4 text-[#F4BE98] shrink-0" />
            <span>Show UI</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5 md:p-7">
      {/* Underwater Ocean Radial Vignette (Zero backdrop-blur for crisp WebGL performance) */}
      {hud.underwater.submerged && (
        <div
          data-testid="underwater-vignette"
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 42%, rgba(10, 88, 122, 0.04) 36%, rgba(4, 34, 58, ${Math.min(
              0.68,
              0.24 + hud.underwater.vignetteAlpha * 0.42
            ).toFixed(2)}) 100%)`,
          }}
        />
      )}
      {/* Top Perimeter Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        {/* Top-Left: Editorial Location, Tamil Script, Season & Time */}
        <div className="min-w-0 max-w-full sm:max-w-[300px] md:max-w-[350px] lg:max-w-[440px] xl:max-w-[520px] w-fit shrink overflow-hidden rounded-lg bg-[#161124]/82 border border-[#F5E8DC]/18 px-3 py-1.5">
          <div className="flex items-baseline gap-2 min-w-0 max-w-full overflow-hidden text-shadow-soft">
            <h1 className="font-display text-sm sm:text-base md:text-lg font-semibold tracking-wide text-[#FAF5EF] truncate min-w-0">
              {hud.location.name}
            </h1>
            <span className="hidden lg:inline font-display text-xs text-[#F4C9AD] truncate min-w-0 max-w-[160px] shrink">
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
          {hud.dinosaurIsland.onIsland && (
            <div
              data-testid="triangle-track-hud"
              className="mt-1.5 pt-1.5 border-t border-amber-400/25 flex flex-col gap-1 text-[11px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-amber-300 truncate">
                  ▲ Triangle Track · {hud.dinosaurIsland.triangleTrack.activePlaceOrder}/
                  {hud.dinosaurIsland.triangleTrack.totalPlaces}{' '}
                  {hud.dinosaurIsland.triangleTrack.activePlaceName}
                </span>
                <span className="font-mono-tabular text-[10px] text-amber-200/85 shrink-0">
                  {hud.dinosaurIsland.triangleTrack.visitedCount}/
                  {hud.dinosaurIsland.triangleTrack.totalPlaces} Explored
                </span>
              </div>
              <div className="text-[10px] text-[#F2E5DC]/85 leading-snug">
                {hud.dinosaurIsland.triangleTrack.activePlaceSubtitle}
                <span className="text-amber-200/90">
                  {' '}
                  · Next: {hud.dinosaurIsland.triangleTrack.nextPlaceName} (
                  {hud.dinosaurIsland.triangleTrack.distanceToNextM}m)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {hud.dinosaurIsland.triangleTrack.places.map((p) => (
                  <span
                    key={p.id}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-tight border ${
                      p.isCurrent
                        ? 'bg-amber-400/25 border-amber-300/70 text-amber-100'
                        : p.visited
                        ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
                        : 'bg-slate-900/55 border-slate-500/35 text-slate-300/80'
                    }`}
                  >
                    {p.order}. {p.shortName}
                  </span>
                ))}
              </div>
            </div>
          )}
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
            <div className="mt-1 pointer-events-auto flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#9EEBFF]">
              <Waves className="w-3.5 h-3.5 shrink-0" />
              <span>
                {hud.underwater.submerged
                  ? `Underwater · -${hud.underwater.depthM.toFixed(1)}m${hud.underwater.reefZoneName ? ` · ${hud.underwater.reefZoneName}` : ''}`
                  : 'Swimming · WASD / Joystick'}
              </span>
              {hud.snowmanRescue.inOceanWater && (
                <>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="swim-dive-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSetSwimDiveHold(1);
                    }}
                    onPointerUp={() => onSetSwimDiveHold(0)}
                    onPointerLeave={() => onSetSwimDiveHold(0)}
                    onPointerCancel={() => onSetSwimDiveHold(0)}
                    style={{ touchAction: 'none' }}
                    className="px-2 py-0.5 rounded bg-cyan-500/30 hover:bg-cyan-500/45 border border-cyan-300/45 text-cyan-100 text-[10px] font-semibold cursor-pointer select-none"
                  >
                    Dive [X]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="swim-surface-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSetSwimDiveHold(-1);
                    }}
                    onPointerUp={() => onSetSwimDiveHold(0)}
                    onPointerLeave={() => onSetSwimDiveHold(0)}
                    onPointerCancel={() => onSetSwimDiveHold(0)}
                    style={{ touchAction: 'none' }}
                    className="px-2 py-0.5 rounded bg-sky-400/25 hover:bg-sky-400/40 border border-sky-300/40 text-sky-100 text-[10px] font-semibold cursor-pointer select-none"
                  >
                    Surface [Space]
                  </button>
                </>
              )}
            </div>
          )}
          {hud.underwater.submerged && !hud.isSwimming && (
            <div
              data-testid="underwater-depth-badge"
              className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-200 font-mono-tabular"
            >
              <Waves className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>
                Ocean Depth -{hud.underwater.depthM.toFixed(1)}m
                {hud.underwater.reefZoneName ? ` · ${hud.underwater.reefZoneName}` : ''}
              </span>
            </div>
          )}
          {(hud.snowmanRescue.inOceanWater || hud.snowmanRescue.phase !== 'idle') && (
            <div
              data-testid="hud-snowman-rescue-banner"
              className="mt-1.5 flex flex-wrap items-center gap-2 pt-1.5 border-t border-sky-300/35 text-[11px]"
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
              {hud.snowmanRescue.phase === 'idle' ? (
                <span className="text-cyan-100 font-medium font-mono-tabular">
                  Ocean Water · {Math.floor(hud.snowmanRescue.oceanSwimSeconds)}s / {Math.round(hud.snowmanRescue.thresholdSeconds)}s · Snowman Jet Ski Rescue
                </span>
              ) : (
                <span className="text-amber-200 font-semibold">
                  {hud.snowmanRescue.phase === 'approaching'
                    ? 'Snowman on Jet Ski Racing to Rescue You!'
                    : hud.snowmanRescue.phase === 'boarding'
                    ? 'Hopping onto Snowman’s Jet Ski...'
                    : hud.snowmanRescue.phase === 'transporting'
                    ? 'Snowman Jet Ski Heading to New Snowman Island!'
                    : 'Rescued! Welcome to Snowman Island!'}
                </span>
              )}
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
                data-testid="metro-board-combined-train-btn"
                onClick={handleUtilityClick(() => onJumpTrainSection('subway'))}
                className="px-2.5 py-0.5 rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-[10px] cursor-pointer whitespace-nowrap"
              >
                Ride Combined Train (Metro → Surface &amp; Skyway)
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
          {hud.snowmanTaxi.phase !== 'idle' && (
            <div
              data-testid="hud-snowman-taxi-banner"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-cyan-300/35 text-xs"
            >
              <Snowflake className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="text-cyan-100 font-medium truncate max-w-[240px]">
                {hud.snowmanTaxi.statusMessage}
              </span>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-snowman-morph-btn"
                onClick={handleUtilityClick(onMorphSnowmanCycleJetSki)}
                className="min-h-[38px] px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs cursor-pointer whitespace-nowrap"
              >
                Morph Cycle ⇄ JetSki
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={handleUtilityClick(onCancelSnowmanTaxi)}
                className="min-h-[38px] px-2.5 py-1 rounded bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
          {hud.homeVault.elevatorPhase !== 'idle' && (
            <div
              data-testid="hud-vault-elevator-banner"
              className="mt-1.5 pt-1.5 border-t border-cyan-400/40 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between gap-2 text-cyan-100 font-semibold">
                <span>
                  {hud.homeVault.elevatorPhase === 'descending'
                    ? 'Hydraulic Elevator Descending to Secret Vault...'
                    : 'Hydraulic Elevator Ascending to House...'}
                </span>
                <span className="font-mono-tabular text-amber-200">
                  {Math.round(hud.homeVault.elevatorProgress * 100)}% ({hud.homeVault.elevatorY.toFixed(1)}m)
                </span>
              </div>
              <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${Math.round(hud.homeVault.elevatorProgress * 100)}%` }}
                />
              </div>
            </div>
          )}
          {hud.homeVault.inPersonalHome && !hud.homeVault.inVault && hud.homeVault.elevatorPhase === 'idle' && (
            <div
              data-testid="hud-home-secret-button-bar"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-cyan-400/35 text-xs"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                En Illam Secret Tunnel → 1 KM Chamber
              </span>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-vault-toggle-btn"
                onClick={handleUtilityClick(onToggleHomeVaultHatch)}
                className={`min-h-[44px] px-3 py-1.5 rounded-md font-semibold text-xs cursor-pointer transition-colors ${
                  hud.homeVault.hatchUnlocked
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-sm shadow-cyan-400/30'
                }`}
              >
                {hud.homeVault.hatchUnlocked
                  ? 'Secret Wall Door OPEN · Walk West to Enter!'
                  : 'Open House Secret Tunnel'}
              </button>
              {hud.homeVault.hatchUnlocked && (
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-vault-enter-btn"
                  onClick={handleUtilityClick(onEnterHomeVault)}
                  className="min-h-[44px] px-3 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                >
                  Ride Elevator Down
                </button>
              )}
            </div>
          )}
          {hud.homeVault.inVault && hud.homeVault.elevatorPhase === 'idle' && (
            <div
              data-testid="hud-home-vault-banner"
              className="mt-1.5 pointer-events-auto flex flex-wrap items-center gap-2 pt-1.5 border-t border-amber-400/35 text-xs"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                {hud.homeVault.inMegaChamber
                  ? `1 KM Superhero Chamber · ${hud.homeVault.megaChamberDistanceM} m / 1,000 m`
                  : 'Superhero Secret Base · 1 KM Chamber & House Exit Ramp'}
              </span>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-vault-toggle-doors-btn"
                onClick={handleUtilityClick(onToggleHomeVaultHatch)}
                className={`min-h-[44px] px-3 py-1.5 rounded-md font-semibold text-xs cursor-pointer transition-colors ${
                  hud.homeVault.hatchUnlocked
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                }`}
              >
                {hud.homeVault.hatchUnlocked ? 'House Tunnel Doors OPEN' : 'Open House Tunnel Doors'}
              </button>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-vault-exit-gate-btn"
                onClick={handleUtilityClick(onToggleVaultExitGate)}
                className={`min-h-[44px] px-3 py-1.5 rounded-md font-semibold text-xs cursor-pointer transition-colors ${
                  hud.homeVault.exitGateOpen
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                }`}
              >
                {hud.homeVault.exitGateOpen ? 'East Ramp Gate OPEN' : 'Open East Ramp Gate'}
              </button>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-vault-exit-btn"
                onClick={handleUtilityClick(onExitHomeVault)}
                className="min-h-[44px] px-3 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs cursor-pointer"
              >
                Elevator Up to House
              </button>
            </div>
          )}
        </div>

        {/* Top-Right: Crisp 44px Utility Strip (3rd Icon Removed; Heroes inside Mobile Phone [P] & [U]) */}
        <div className="pointer-events-auto shrink-0 flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-wildlife-guide-btn"
            aria-label="Open Wildlife Forest Sanctuary Guide"
            title="Jurassic Wildlife Sanctuary (21 Species & Expedition Fleet)"
            onClick={handleUtilityClick(onOpenWildlifeGuide)}
            className="min-h-[44px] h-11 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap bg-[#1B2419]/92 border-[#D9B366]/50 text-[#F4E6C1] hover:bg-[#263323]"
          >
            <Binoculars className="w-4 h-4 text-[#D9B366] shrink-0" />
            <span className="hidden md:inline">Wildlife</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-snowman-taxi-btn"
            aria-label="Open Snowman Multi-Transport Taxi"
            title="Snowman Exact-Location Taxi (Land, Water & Cycle-JetSki)"
            onClick={handleUtilityClick(onOpenSnowmanTaxi)}
            className={`min-h-[44px] h-11 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              hud.snowmanTaxi.phase !== 'idle'
                ? 'bg-[#38BDF8] border-[#BAE6FD] text-[#081524]'
                : 'bg-[#142235]/92 border-[#7DD3FC]/45 text-[#BAE6FD] hover:bg-[#1D314B]'
            }`}
          >
            <Snowflake className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Taxi</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-mobile-phone-btn"
            aria-label="Open Dreamline Mobile Phone (P)"
            title="Dreamline Mobile Phone — Vehicles, Heroes & Dispatch (P)"
            onClick={handleUtilityClick(onOpenMobilePhone)}
            className="min-h-[44px] w-11 h-11 flex items-center justify-center rounded-md border transition-colors cursor-pointer bg-[#13292E]/90 border-emerald-400/55 text-emerald-300 hover:bg-[#193A40] shadow-sm shadow-emerald-500/15"
          >
            <Smartphone className="w-5 h-5 shrink-0" />
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
                ? 'Currently Giant (23.5m) — Click to become Small (1.68m)'
                : 'Currently Small (1.68m) — Click to become Giant (23.5m)'
            }
            onClick={handleUtilityClick(onToggleGiantSmall)}
            className={`min-h-[44px] h-11 px-2.5 flex items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              hud.iceland.isGiant
                ? 'bg-[#8DE4FF] border-[#C9F4FF] text-[#112233] font-semibold'
                : 'bg-[#191429]/86 border-[#F5D6C0]/22 text-[#D8F3FF] hover:bg-[#271F3F]/92'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline">
              {hud.iceland.isGiant ? 'Small' : 'Giant'}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Bus and Train Departure Timing Map"
            title="Bus & Train Live Departure Timing Map"
            onClick={handleUtilityClick(onOpenTransitMap)}
            className="hidden sm:flex min-h-[44px] h-11 px-2.5 items-center justify-center gap-1.5 rounded-md bg-[#191429]/86 border border-[#F4BE98]/32 text-[#FCE2C8] hover:bg-[#271F3F]/92 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Clock className="w-4 h-4 text-[#F4BE98] shrink-0" />
            <span className="hidden xl:inline">Timings</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Travel Home to En Illam"
            title="Return to En Illam (My Home)"
            onClick={handleUtilityClick(onGoHome)}
            className="min-h-[44px] w-11 h-11 flex items-center justify-center rounded-md bg-[#191429]/86 border border-[#F5D6C0]/22 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#F4BE98]" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Open 5-Region World Map (M)"
            title="World Map (M)"
            onClick={handleUtilityClick(onToggleMap)}
            className="min-h-[44px] w-11 h-11 flex items-center justify-center rounded-md bg-[#191429]/86 border border-[#F5D6C0]/22 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
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
                ? 'Lantern ON — Tap or press L to turn OFF'
                : 'Lantern OFF — Tap or press L to turn ON'
            }
            onClick={handleUtilityClick(onToggleLantern)}
            className={`flex min-h-[44px] h-11 px-2.5 items-center justify-center gap-1 rounded-md border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              hud.lanternOn
                ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-md shadow-amber-500/25'
                : 'bg-[#191429]/86 border-[#F5D6C0]/22 text-[#FCE2C8]/80 hover:bg-[#271F3F]/92'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline">{hud.lanternOn ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Time and Weather Controls"
            aria-expanded={atmosphereOpen}
            title="Sky & Weather (T)"
            onClick={handleUtilityClick(onToggleAtmosphere)}
            className={`min-h-[44px] w-11 h-11 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
              atmosphereOpen
                ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E]'
                : 'bg-[#191429]/86 border-[#F5D6C0]/22 text-[#F7EFE8] hover:bg-[#271F3F]/92'
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
            className="hidden md:flex min-h-[44px] w-11 h-11 items-center justify-center rounded-md bg-[#191429]/86 border border-[#F5D6C0]/22 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {onToggleHudHidden && (
            <button
              type="button"
              tabIndex={-1}
              data-testid="hud-hide-all-btn"
              aria-label="Hide all HUD options (Z)"
              title="Hide All Options [Z]"
              onClick={handleUtilityClick(onToggleHudHidden)}
              className="min-h-[44px] h-11 px-2.5 flex items-center justify-center gap-1.5 rounded-md bg-[#191429]/86 border border-[#F5D6C0]/28 text-[#FAF5EF] hover:bg-[#271F3F]/92 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <EyeOff className="w-4 h-4 text-[#F4BE98] shrink-0" />
              <span className="hidden sm:inline">Hide UI</span>
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Menu (Esc)"
            title="Pause (Esc)"
            onClick={handleUtilityClick(onOpenPause)}
            className="min-h-[44px] w-11 h-11 flex items-center justify-center rounded-md bg-[#191429]/86 border border-[#F5D6C0]/22 text-[#F7EFE8] hover:bg-[#271F3F]/92 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wildlife Telephoto Viewfinder (Centered ONLY in Wildlife Observation Mode) */}
      {!atmosphereOpen && hud.cameraPerspective === 'wildlife_obs' && (
        <div
          data-testid="wildlife-viewfinder-hud"
          className="pointer-events-none flex flex-col items-center justify-center my-auto"
        >
          <div className="w-56 sm:w-72 h-36 sm:h-44 relative mb-2">
            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#D9B366]/85" />
            <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#D9B366]/85" />
            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#D9B366]/85" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#D9B366]/85" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[#D9B366]/90" />
          </div>
          {hud.wildlife.nearestTarget && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#141914]/92 border border-[#D9B366]/55 text-xs text-[#F5F1E6] shadow-xl">
              <div className="flex items-center gap-2">
                <Binoculars className="w-4 h-4 text-[#D9B366] shrink-0" />
                <div>
                  <div className="font-semibold text-[#FAF5EC]">
                    {hud.wildlife.nearestTarget.name}{' '}
                    <span className="font-mono-tabular text-[#D9B366] font-normal">
                      {Math.round(hud.wildlife.nearestTarget.distanceM)}m
                    </span>
                  </div>
                  <div className="text-[11px] text-[#B7C2AC]">
                    {hud.wildlife.nearestTarget.behavior.replace(/_/g, ' ')} ·{' '}
                    <span className="italic">{hud.wildlife.nearestTarget.scientificName}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-wildlife-photo-btn"
                onClick={handleUtilityClick(onPhotographWildlife)}
                className="min-h-[44px] px-3 py-1.5 rounded-md bg-[#D9B366] hover:bg-[#E7C67F] text-[#151813] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Photo [F]</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Unobtrusive Top-Right Wildlife Sighting Chip when exploring outside Wildlife Obs mode */}
      {!atmosphereOpen && hud.cameraPerspective !== 'wildlife_obs' && hud.wildlife.nearestTarget && (
        <div
          data-testid="wildlife-sighting-chip"
          className="pointer-events-auto self-end mt-1.5 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#141914]/88 border border-[#D9B366]/45 text-xs text-[#F5F1E6] shadow-lg"
        >
          <Binoculars className="w-3.5 h-3.5 text-[#D9B366] shrink-0" />
          <span className="font-semibold text-[#FAF5EC]">{hud.wildlife.nearestTarget.name}</span>
          <span className="font-mono-tabular text-[#D9B366]">
            {Math.round(hud.wildlife.nearestTarget.distanceM)}m
          </span>
          <span className="text-[11px] text-[#B7C2AC] capitalize">
            {hud.wildlife.nearestTarget.behavior.replace(/_/g, ' ')}
          </span>
          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-wildlife-photo-btn"
            onClick={handleUtilityClick(onPhotographWildlife)}
            className="min-h-[34px] px-2.5 py-1 rounded bg-[#D9B366] hover:bg-[#E7C67F] text-[#151813] font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap [F]</span>
          </button>
        </div>
      )}

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

                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {/* Combined Surface / Elevated Sky Viaduct / Underground Metro Subway Selector */}
                      <div
                        role="group"
                        aria-label="Combined Railway Level"
                        className="flex items-center gap-1 p-0.5 rounded bg-[#18132B] border border-cyan-300/30"
                      >
                        {(
                          [
                            { id: 'surface', label: 'Surface', match: 'surface' },
                            { id: 'elevated', label: 'Skyway +7m', match: 'elevated' },
                            { id: 'subway', label: 'Subway -7m', match: 'subway_tunnel' },
                          ] as const
                        ).map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            tabIndex={-1}
                            data-testid={`train-section-${sec.id}`}
                            onClick={handleUtilityClick(() => onJumpTrainSection(sec.id))}
                            className={`min-h-[34px] px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                              hud.trainGradeType === sec.match
                                ? 'bg-cyan-400 text-slate-950'
                                : 'text-cyan-100 hover:bg-cyan-500/20'
                            }`}
                          >
                            {sec.label}
                          </button>
                        ))}
                      </div>

                      {/* Effortless 1-Tap Easy Train Driver Throttle Notches */}
                      {hud.trainDriverMode && (
                        <>
                          <div
                            role="group"
                            aria-label="Easy Train Driver Speed Control"
                            className="flex items-center gap-1 p-0.5 rounded bg-[#231B38] border border-amber-300/40"
                          >
                            {(
                              [
                                { notch: -1 as const, label: 'Rev' },
                                { notch: 0 as const, label: 'Stop' },
                                { notch: 1 as const, label: 'Slow' },
                                { notch: 2 as const, label: 'Cruise' },
                                { notch: 3 as const, label: 'Fast' },
                              ]
                            ).map((item) => {
                              const active = hud.trainDriverNotch === item.notch;
                              return (
                                <button
                                  key={item.notch}
                                  type="button"
                                  tabIndex={-1}
                                  data-testid={`train-notch-${item.notch}`}
                                  onClick={handleUtilityClick(() => onSetTrainDriverNotch(item.notch))}
                                  className={`min-h-[36px] px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    active
                                      ? item.notch === 0
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-amber-400 text-slate-950'
                                      : 'text-[#FAF5EF] hover:bg-[#352A54]'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(onTrainHorn)}
                            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#F5D6C0]/20 cursor-pointer"
                          >
                            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                            <span>Horn</span>
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(onTrainDoors)}
                            className="min-h-[36px] px-2.5 py-1 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#F5D6C0]/20 cursor-pointer"
                          >
                            Doors
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(() => onSetTrainDriverMode(false))}
                            className="min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded bg-cyan-400/25 hover:bg-cyan-400/35 border border-cyan-300/45 text-cyan-100 cursor-pointer"
                          >
                            Auto Pilot
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleUtilityClick(onOpenRouteSelect)}
                        className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#2B2344] hover:bg-[#382E58] text-[#FAF5EF] border border-[#F5D6C0]/20 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Route className="w-3.5 h-3.5 text-[#F4BE98]" />
                        <span>Stops</span>
                      </button>

                      {hud.canTransferToIceland && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(onEnterIceland)}
                          className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-[#8DE4FF] hover:bg-[#B2EEFF] text-[#112233] transition-colors cursor-pointer whitespace-nowrap"
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
                        className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                          hud.canExitTrain
                            ? 'bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] cursor-pointer'
                            : 'bg-[#221C35]/70 text-[#B8A9C2] cursor-not-allowed'
                        }`}
                      >
                        {hud.canExitTrain ? 'Exit Train [E]' : 'Exit at Stop'}
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
                    <span className="font-display font-semibold text-[#FEF3C7]">Jurassic Safari 4x4</span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#362814] text-[#FDE68A]">
                      {hud.safariCarSpeedKmh} km/h
                    </span>
                  </div>
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
                    <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-300/35 text-cyan-200 text-[10px] font-medium">
                      Look Up/Down + Move
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
              ) : isFlyingOrangeHeli ? (
                <div
                  data-testid="hud-orange-heli-panel"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#2A1408]/94 border border-orange-400/60 text-xs text-orange-50 shadow-xl"
                >
                  <div className="flex items-center gap-2 pr-1">
                    <Wind className="w-4 h-4 text-orange-400" />
                    <span className="font-display font-semibold text-orange-100">
                      {hud.orangeHeli.name}
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#431C0A] text-orange-200">
                      ALT {hud.orangeHeli.altitudeM}m
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#431C0A] text-amber-200">
                      {hud.orangeHeli.speedKmh} km/h
                    </span>
                    <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-300/40 text-orange-100 text-[10px] font-medium">
                      Look Up/Down + Move
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Ascend Orange Rescue Helicopter (Space)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSkyVertical(true, false);
                    }}
                    onPointerUp={() => onSkyVertical(false, false)}
                    onPointerLeave={() => onSkyVertical(false, false)}
                    onPointerCancel={() => onSkyVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#5C240B] hover:bg-[#7A3010] border border-orange-400/45 text-orange-50 text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Up [Space]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Descend Orange Rescue Helicopter (Q or Ctrl)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSkyVertical(false, true);
                    }}
                    onPointerUp={() => onSkyVertical(false, false)}
                    onPointerLeave={() => onSkyVertical(false, false)}
                    onPointerCancel={() => onSkyVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#5C240B] hover:bg-[#7A3010] border border-orange-400/45 text-orange-50 text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Down [Q]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Hold to Boost Orange Rescue Helicopter (Shift)"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onMobileSprintChange(true);
                    }}
                    onPointerUp={() => onMobileSprintChange(false)}
                    onPointerLeave={() => onMobileSprintChange(false)}
                    onPointerCancel={() => onMobileSprintChange(false)}
                    style={{ touchAction: 'none' }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-medium cursor-pointer select-none ${
                      hud.orangeHeli.boostActive
                        ? 'bg-amber-300 border-amber-100 text-slate-950 font-semibold'
                        : 'bg-[#5C240B] hover:bg-[#7A3010] border-orange-400/45 text-orange-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Boost [Shift]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onInteractClick)}
                    className="px-3 py-1.5 rounded bg-orange-400 hover:bg-orange-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
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
                    <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-300/40 text-sky-100 text-[10px] font-medium">
                      Look Up/Down + Move
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
                        {hud.homeVault.exitGateOpen
                          ? 'Exit Gate OPEN · Drive East Passage Outside'
                          : 'Open Exit Gate to Drive Outside'}
                      </span>
                    )}
                  </div>
                  {hud.homeVault.inVault && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={handleUtilityClick(onToggleVaultExitGate)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        hud.homeVault.exitGateOpen
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {hud.homeVault.exitGateOpen ? 'Gate Open' : 'Open Exit Gate'}
                    </button>
                  )}
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
              ) : isDrivingSubmarine ? (
                <div
                  data-testid="submarine-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0D1F2E]/94 border border-amber-400/55 text-xs text-sky-50 shadow-2xl"
                >
                  <div className="flex items-center gap-2 pr-1">
                    <Waves className="w-4 h-4 text-amber-300" />
                    <span className="font-display font-semibold text-amber-200">
                      Kadalkarai Submarine
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-semibold">
                      {hud.submarine.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-900 text-amber-200">
                      Depth {hud.submarine.depthM.toFixed(1)}m
                    </span>
                    {hud.submarine.submerged && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-semibold text-[10px]">
                        SUBMERGED
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="sub-surface-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSetSubmarineDiveHold(-1);
                    }}
                    onPointerUp={() => onSetSubmarineDiveHold(0)}
                    onPointerLeave={() => onSetSubmarineDiveHold(0)}
                    onPointerCancel={() => onSetSubmarineDiveHold(0)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-300/45 text-cyan-100 text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Surface [Space]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="sub-dive-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSetSubmarineDiveHold(1);
                    }}
                    onPointerUp={() => onSetSubmarineDiveHold(0)}
                    onPointerLeave={() => onSetSubmarineDiveHold(0)}
                    onPointerCancel={() => onSetSubmarineDiveHold(0)}
                    style={{ touchAction: 'none' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-sky-600/35 hover:bg-sky-600/50 border border-sky-300/45 text-sky-100 text-xs font-medium cursor-pointer select-none"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Dive [Ctrl/X]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleUtilityClick(onToggleSubmarineSearchlight)}
                    className={`px-2.5 py-1.5 rounded border text-xs font-medium cursor-pointer ${
                      hud.submarine.searchlightOn
                        ? 'bg-amber-300 border-amber-100 text-slate-950 font-semibold'
                        : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    Searchlight [L]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="sub-exit-btn"
                    onClick={handleUtilityClick(onExitSubmarine)}
                    className="px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Exit Sub [E]
                  </button>
                </div>
              ) : isFlyingHoverGlider ? (
                <div
                  data-testid="hover-glider-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0E1621]/95 border border-cyan-400/60 text-xs text-slate-100 shadow-2xl"
                >
                  <div className="flex flex-wrap items-center gap-2 pr-1">
                    <Wind className="w-4 h-4 text-cyan-300" />
                    <span className="font-display font-semibold text-cyan-100">
                      Aero-Ti Hoverboard Glider
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 font-semibold">
                      {hud.expedition.hoverGlider.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-slate-900/90 border border-slate-600/40 text-slate-200">
                      ALT {hud.expedition.hoverGlider.altitudeM}m
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-400/25 text-cyan-300">
                      Turbine {hud.expedition.hoverGlider.turbinePct}%
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-300/30 text-[10px] font-medium text-cyan-100">
                      Look Up/Down + W to Fly
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="glider-climb-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onVtolVertical(true, false);
                    }}
                    onPointerUp={() => onVtolVertical(false, false)}
                    onPointerLeave={() => onVtolVertical(false, false)}
                    onPointerCancel={() => onVtolVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-cyan-400/35 text-cyan-200 text-xs font-semibold cursor-pointer select-none"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Up</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="glider-descend-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onVtolVertical(false, true);
                    }}
                    onPointerUp={() => onVtolVertical(false, false)}
                    onPointerLeave={() => onVtolVertical(false, false)}
                    onPointerCancel={() => onVtolVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-cyan-400/35 text-cyan-200 text-xs font-semibold cursor-pointer select-none"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Down</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vehicle-cycle-cam-btn"
                    onClick={handleUtilityClick(onCycleCameraPerspective)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-cyan-400/35 text-xs font-medium text-slate-100 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-cyan-300" />
                    <span>{activeCamSpec.shortLabel} [C]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="expedition-exit-btn"
                    onClick={handleUtilityClick(onExitExpeditionVehicle)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Exit Glider [E]
                  </button>
                </div>
              ) : isRidingDirtBike ? (
                <div
                  data-testid="dirt-bike-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#1A130F]/94 border border-orange-500/55 text-xs text-white shadow-2xl"
                >
                  <div className="flex flex-wrap items-center gap-2 pr-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="font-display font-semibold text-orange-200">
                      49cc Petrol Dirt Bike · Orion Mini
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-orange-950/80 border border-orange-500/35 text-white font-semibold">
                      {hud.expedition.dirtBike.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-black/50 text-orange-400">
                      {hud.expedition.dirtBike.rpm} RPM
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-black/50 text-amber-200">
                      Steer {hud.expedition.dirtBike.steerDeg}°
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-200 uppercase text-[10px] font-semibold">
                      {hud.expedition.dirtBike.surface}
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="dirt-bike-rev-btn"
                    onMouseDown={() => onDirtBikeRev(true)}
                    onMouseUp={() => onDirtBikeRev(false)}
                    onMouseLeave={() => onDirtBikeRev(false)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      onDirtBikeRev(true);
                    }}
                    onTouchEnd={() => onDirtBikeRev(false)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer ${
                      hud.expedition.dirtBike.revving
                        ? 'bg-orange-500 border-amber-300 text-slate-950'
                        : 'bg-[#2B1D14] border-orange-500/40 text-amber-200 hover:bg-[#3A271B]'
                    }`}
                  >
                    Rev [R]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="dirt-bike-kickstand-btn"
                    onClick={handleUtilityClick(onToggleDirtBikeKickstand)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer ${
                      hud.expedition.dirtBike.kickstandDown
                        ? 'bg-amber-400 border-amber-200 text-slate-950'
                        : 'bg-[#2B1D14] border-orange-500/35 text-orange-100 hover:bg-[#3A271B]'
                    }`}
                  >
                    Stand: {hud.expedition.dirtBike.kickstandDown ? 'DOWN' : 'UP'}
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vehicle-cycle-cam-btn"
                    onClick={handleUtilityClick(onCycleCameraPerspective)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2B1D14] hover:bg-[#3A271B] border border-orange-500/40 text-xs font-medium text-orange-100 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-orange-400" />
                    <span>
                      {hud.cameraPerspective === 'cockpit' ? 'Handlebar POV' : activeCamSpec.shortLabel} [C]
                    </span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="expedition-exit-btn"
                    onClick={handleUtilityClick(onExitExpeditionVehicle)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-md bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Exit Bike [E]
                  </button>
                </div>
              ) : isDrivingSafariJeep ? (
                <div
                  data-testid="safari-jeep-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#1A2016]/94 border border-[#B8C496]/50 text-xs text-[#F5F2E6] shadow-2xl"
                >
                  <div className="flex flex-wrap items-center gap-2 pr-1">
                    <Car className="w-4 h-4 text-[#C9D89C]" />
                    <span className="font-display font-semibold text-[#F4F1DE]">
                      4×4 Safari Jeep
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#273120] text-[#E6F2C2] font-semibold">
                      {hud.expedition.jeep.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#273120] text-[#D9B366]">
                      Gear {hud.expedition.jeep.gear} · {hud.expedition.jeep.rpm} RPM
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#2E3824] border border-[#B8C496]/30 text-[#D4E1B2] uppercase text-[10px] font-semibold">
                      {hud.expedition.jeep.surface}
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="jeep-lights-btn"
                    onClick={handleUtilityClick(onToggleSafariJeepLights)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer ${
                      hud.expedition.jeep.headlightsOn
                        ? 'bg-[#D9B366] border-[#F0D594] text-[#171913]'
                        : 'bg-[#262E20] border-[#B8C496]/30 text-[#E6ECE0] hover:bg-[#333E2B]'
                    }`}
                  >
                    Lights [L]
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vehicle-cycle-cam-btn"
                    onClick={handleUtilityClick(onCycleCameraPerspective)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262E20] hover:bg-[#333E2B] border border-[#B8C496]/35 text-xs font-medium text-[#F5F2E6] cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-[#D9B366]" />
                    <span>{activeCamSpec.shortLabel} [C]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="expedition-exit-btn"
                    onClick={handleUtilityClick(onExitExpeditionVehicle)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-md bg-[#D9B366] hover:bg-[#E7C67F] text-[#151813] text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Exit Jeep [E]
                  </button>
                </div>
              ) : isFlyingVtol ? (
                <div
                  data-testid="vtol-aircraft-hud"
                  className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#211911]/94 border border-[#E5C170]/55 text-xs text-[#FDF5E6] shadow-2xl"
                >
                  <div className="flex flex-wrap items-center gap-2 pr-1">
                    <Plane className="w-4 h-4 text-[#E5C170]" />
                    <span className="font-display font-semibold text-[#F8E2A8]">
                      Gold/Wood VTOL
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#332618] text-[#7DD3FC] font-semibold">
                      {hud.expedition.vtol.speedKmh} km/h
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#332618] text-[#F8E2A8]">
                      AGL {hud.expedition.vtol.aglM.toFixed(0)}m
                    </span>
                    <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#332618] text-[#A7F3D0]">
                      Tilt {Math.round(hud.expedition.vtol.nacelleTilt * 100)}% · Bat {Math.round(hud.expedition.vtol.batteryPct)}%
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#332618] border border-[#E5C170]/30 text-[10px] font-medium text-[#FCE6B0]">
                      Look Up/Down + W
                    </span>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vtol-hover-toggle-btn"
                    onClick={handleUtilityClick(onToggleVtolHoverMode)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer ${
                      hud.expedition.vtol.hoverMode
                        ? 'bg-[#38BDF8] border-[#BAE6FD] text-[#081524]'
                        : 'bg-[#E5C170] border-[#FCE6B0] text-[#1C140A]'
                    }`}
                  >
                    {hud.expedition.vtol.hoverMode ? 'VTOL Hover [H]' : 'Forward Cruise [H]'}
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vtol-climb-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onVtolVertical(true, false);
                    }}
                    onPointerUp={() => onVtolVertical(false, false)}
                    onPointerLeave={() => onVtolVertical(false, false)}
                    onPointerCancel={() => onVtolVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#332618] hover:bg-[#463420] border border-[#E5C170]/40 text-[#FCE6B0] text-xs font-semibold cursor-pointer select-none"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Lift</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vtol-descend-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onVtolVertical(false, true);
                    }}
                    onPointerUp={() => onVtolVertical(false, false)}
                    onPointerLeave={() => onVtolVertical(false, false)}
                    onPointerCancel={() => onVtolVertical(false, false)}
                    style={{ touchAction: 'none' }}
                    className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#332618] hover:bg-[#463420] border border-[#E5C170]/40 text-[#FCE6B0] text-xs font-semibold cursor-pointer select-none"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Descend</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="vehicle-cycle-cam-btn"
                    onClick={handleUtilityClick(onCycleCameraPerspective)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#332618] hover:bg-[#463420] border border-[#E5C170]/40 text-xs font-medium text-[#FDF5E6] cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-[#E5C170]" />
                    <span>{activeCamSpec.shortLabel} [C]</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="expedition-exit-btn"
                    onClick={handleUtilityClick(onExitExpeditionVehicle)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-md bg-[#E5C170] hover:bg-[#F3D58E] text-[#1A130A] text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Exit VTOL [E]
                  </button>
                </div>
              ) : isRidingJetSki ? (
                (() => {
                  const ski = isRidingSportJetSki
                    ? hud.expedition.sportJetSki
                    : hud.expedition.perfJetSki;
                  const waveLabel =
                    ski.waterRoughness > 0.65
                      ? 'Rough Waves'
                      : ski.waterRoughness > 0.35
                      ? 'Choppy'
                      : 'Calm';
                  return (
                    <div
                      data-testid="jetski-hud"
                      className={`pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#11191D]/94 border text-xs text-[#F2FAFC] shadow-2xl ${
                        isRidingSportJetSki ? 'border-[#D9EC18]/55' : 'border-[#34D85A]/55'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 pr-1">
                        <Waves
                          className={`w-4 h-4 ${
                            isRidingSportJetSki ? 'text-[#D9EC18]' : 'text-[#34D85A]'
                          }`}
                        />
                        <span className="font-display font-semibold">{ski.name}</span>
                        <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#1B2A30] text-[#7DD3FC] font-semibold">
                          {ski.speedKmh} km/h
                        </span>
                        <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#1B2A30] text-[#BAE6FD]">
                          {waveLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="jetski-swap-model-btn"
                        onClick={handleUtilityClick(() =>
                          onBoardExpeditionVehicle(
                            isRidingSportJetSki ? 'jetski_perf' : 'jetski_sport'
                          )
                        )}
                        className="min-h-[44px] px-3 py-1.5 rounded-md bg-[#1E3138] hover:bg-[#29424B] border border-[#7DD3FC]/35 text-xs font-semibold text-[#E0F2FE] cursor-pointer whitespace-nowrap"
                      >
                        Switch to {isRidingSportJetSki ? 'Pro Green' : 'Sport Yellow'}
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="vehicle-cycle-cam-btn"
                        onClick={handleUtilityClick(onCycleCameraPerspective)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E3138] hover:bg-[#29424B] border border-[#7DD3FC]/35 text-xs font-medium text-[#F2FAFC] cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-[#7DD3FC]" />
                        <span>{activeCamSpec.shortLabel} [C]</span>
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="expedition-exit-btn"
                        onClick={handleUtilityClick(onExitExpeditionVehicle)}
                        className={`min-h-[44px] px-3.5 py-1.5 rounded-md text-[#0C1414] text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          isRidingSportJetSki
                            ? 'bg-[#D9EC18] hover:bg-[#E7F74A]'
                            : 'bg-[#34D85A] hover:bg-[#55E677]'
                        }`}
                      >
                        Exit Jet Ski [E]
                      </button>
                    </div>
                  );
                })()
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
                    className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border cursor-pointer whitespace-nowrap transition-colors ${
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
                    className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded bg-[#85C7DE] hover:bg-[#A1D8EB] text-[#12202B] cursor-pointer whitespace-nowrap"
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

                  {/* Desktop/Tablet Active 3D Hero Action Bar on foot (hidden on <640px mobile where ergonomic thumb pad takes over) */}
                  {activeHeroSpec && hud.activeVehicle === 'none' && (
                    <div
                      data-testid="hero-action-bar"
                      className="hidden sm:flex pointer-events-auto w-full max-w-[min(640px,calc(100vw-24px))] flex-col gap-1.5 px-2.5 py-2 rounded-lg bg-[#141122]/94 border border-amber-400/45 shadow-xl text-xs text-slate-100"
                    >
                      {/* Row 1: Primary Power, Mobility, Dodge, Dive, Change Suit */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="hero-primary-power-btn"
                          onClick={handleUtilityClick(onHeroPrimaryPower)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          <span>{activeHeroPower?.shortLabel ?? activeHeroSpec.primaryPower.label}</span>
                        </button>

                        {(activeHeroSpec.mobility.canFly ||
                          activeHeroSpec.mobility.canWebSwing ||
                          activeHeroSpec.mobility.canCapeGlide) && (
                          <button
                            type="button"
                            tabIndex={-1}
                            data-testid="hero-mobility-btn"
                            onClick={handleUtilityClick(onHeroFlightOrSpecial)}
                            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              hud.hero.isFlying || hud.hero.isGliding || hud.hero.isWebSwinging
                                ? 'bg-cyan-400 border-cyan-200 text-slate-950'
                                : 'bg-sky-500/25 hover:bg-sky-500/40 border-sky-300/45 text-sky-100'
                            }`}
                          >
                            <Wind className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {activeHeroSpec.mobility.canFly
                                ? hud.hero.isFlying
                                  ? 'Land (Look Up/Down + Move)'
                                  : 'Fly'
                                : activeHeroSpec.mobility.canWebSwing
                                ? 'Web Swing'
                                : hud.hero.isGliding
                                ? 'Drop Glide'
                                : 'Cape Glide'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="hero-dodge-btn"
                          onClick={handleUtilityClick(onHeroDodge)}
                          className={`min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            hud.hero.dodgeTimer > 0
                              ? 'bg-emerald-400 border-emerald-200 text-slate-950'
                              : 'bg-emerald-500/25 hover:bg-emerald-500/40 border-emerald-300/45 text-emerald-100'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5 shrink-0" />
                          <span>Dodge</span>
                        </button>

                        {activeHeroSpec.mobility.canWebSwing && (
                          <button
                            type="button"
                            tabIndex={-1}
                            data-testid="hero-spider-dive-btn"
                            onClick={handleUtilityClick(onToggleSpiderDive)}
                            className={`min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              hud.hero.isDiving
                                ? 'bg-amber-400 border-amber-200 text-slate-950'
                                : 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-300/45 text-amber-100'
                            }`}
                          >
                            <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                            <span>{hud.hero.isDiving ? 'Diving' : 'Dive'}</span>
                          </button>
                        )}

                        {activeHeroSpec.outfits.length > 1 && (
                          <button
                            type="button"
                            tabIndex={-1}
                            data-testid="hero-swap-outfit-btn"
                            onClick={handleUtilityClick(onCycleHeroOutfit)}
                            className="min-h-[44px] px-2.5 py-1.5 rounded-md bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-300/45 text-indigo-100 text-xs font-medium cursor-pointer whitespace-nowrap"
                          >
                            Change Suit
                          </button>
                        )}

                        {activeHeroSpec.mobility.hasHelmetToggle && (
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleUtilityClick(onToggleHeroHelmet)}
                            className="min-h-[44px] px-2.5 py-1.5 rounded-md bg-amber-500/25 hover:bg-amber-500/40 border border-amber-300/45 text-amber-100 text-xs font-medium cursor-pointer whitespace-nowrap"
                          >
                            {hud.hero.helmetOpen ? 'Seal Helmet' : 'Faceplate'}
                          </button>
                        )}

                        {activeHeroSpec.mobility.hasBatmobileLink && (
                          <button
                            type="button"
                            tabIndex={-1}
                            data-testid="summon-batmobile-btn"
                            onClick={handleUtilityClick(() => onSpawnBatmobile(false))}
                            className="min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <Car className="w-3.5 h-3.5" />
                            <span>Batmobile</span>
                          </button>
                        )}
                      </div>

                      {/* Row 2: Selectable Superpower Options */}
                      {activeHeroPowerOptions.length > 1 && (
                        <div
                          data-testid="hero-power-options-row"
                          className="flex flex-wrap items-center justify-center gap-1 pt-1 border-t border-white/12"
                        >
                          {activeHeroPowerOptions.map((opt, idx) => {
                            const selected = idx === hud.hero.activePowerIndex;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                tabIndex={-1}
                                data-testid={`hero-power-opt-${idx}`}
                                onClick={handleUtilityClick(() => onSelectHeroPowerOption(idx))}
                                className={`min-h-[40px] px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                  selected
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600/70'
                                }`}
                              >
                                {opt.shortLabel}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            tabIndex={-1}
                            data-testid="hero-secondary-power-btn"
                            onClick={handleUtilityClick(onHeroSecondaryPower)}
                            className={`min-h-[40px] px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap border ${
                              hud.hero.energyShieldActive ||
                              hud.hero.spiderSenseActive ||
                              hud.hero.detectiveVisionActive
                                ? 'bg-cyan-400 border-cyan-200 text-slate-950'
                                : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600 text-cyan-200'
                            }`}
                          >
                            {activeHeroSpec.secondaryPower.label}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile Vertical (<640px): Full-Width Single-Row Scrollable Power & Suit Rail cleanly above Thumb Controls */}
                  {activeHeroSpec && hud.activeVehicle === 'none' && (
                    <div
                      data-testid="mobile-hero-power-rail"
                      className="sm:hidden fixed inset-x-3 bottom-[178px] z-30 pointer-events-auto flex items-center gap-1.5 overflow-x-auto px-2 py-1.5 rounded-lg bg-[#141122]/94 border border-amber-400/45 shadow-xl"
                    >
                      {activeHeroPowerOptions.map((opt, idx) => {
                        const selected = idx === hud.hero.activePowerIndex;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            tabIndex={-1}
                            data-testid={`mobile-hero-opt-${idx}`}
                            onClick={handleUtilityClick(() => onSelectHeroPowerOption(idx))}
                            className={`min-h-[36px] px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                              selected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800/95 text-slate-200 border border-slate-600/70'
                            }`}
                          >
                            {opt.shortLabel}
                          </button>
                        );
                      })}
                      {activeHeroSpec.outfits.length > 1 && (
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="mobile-hero-suit-btn"
                          onClick={handleUtilityClick(onCycleHeroOutfit)}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-indigo-500/35 border border-indigo-300/45 text-indigo-100 text-[11px] font-semibold shrink-0 cursor-pointer whitespace-nowrap"
                        >
                          Suit
                        </button>
                      )}
                      {activeHeroSpec.mobility.hasBatmobileLink && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={handleUtilityClick(() => onSpawnBatmobile(false))}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0 cursor-pointer whitespace-nowrap"
                        >
                          Batmobile
                        </button>
                      )}
                    </div>
                  )}

                  {!activeHeroSpec && hud.parachuteActive && hud.activeVehicle === 'none' && (
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="hud-parachute-active-btn"
                      onClick={handleUtilityClick(onToggleParachute)}
                      className="pointer-events-auto min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-lg cursor-pointer"
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
                      className="pointer-events-auto min-h-[44px] flex items-center gap-2.5 px-4 py-2 rounded-md bg-[#191429]/92 border border-[#F4C29F]/40 text-xs sm:text-sm text-[#FAF5EF] hover:bg-[#271F3F] transition-colors cursor-pointer"
                    >
                      <span className="font-mono-tabular text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F4BE98] text-[#1D162E]">
                        E
                      </span>
                      <span>{hud.activePrompt.label}</span>
                    </button>
                  )}
                </>
              )}

              {/* Collapsible Expedition Fleet & 7-Perspective Camera Dock (hidden on <640px mobile when a Superhero is active to keep Joystick & Hero Pad unobstructed) */}
              {(hud.activeVehicle === 'none' || isExpeditionVehicle) && (
                <div
                  data-testid="expedition-dock"
                  className={`pointer-events-auto w-full max-w-[min(780px,calc(100vw-24px))] ${
                    activeHeroSpec ? 'hidden sm:flex' : 'flex'
                  } flex-col items-center gap-1.5`}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="expedition-dock-toggle"
                    aria-expanded={dockExpanded}
                    onClick={handleUtilityClick(() => setDockExpanded((v) => !v))}
                    className="min-h-[40px] px-3 py-1 rounded-md bg-[#171B15]/92 border border-[#D9B366]/40 text-[11px] sm:text-xs font-semibold text-[#F4E8C6] hover:bg-[#232A1F] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#D9B366]" />
                    <span>Expedition Vehicles &amp; Camera ({activeCamSpec.shortLabel})</span>
                    {dockExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#D9B366]" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-[#D9B366]" />
                    )}
                  </button>

                  {dockExpanded && (
                    <div className="w-full rounded-lg bg-[#151814]/94 border border-[#D4C3A3]/30 p-2 space-y-1.5 shadow-2xl">
                      {/* Flagship Vehicles Row */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-hover-glider"
                          onClick={handleUtilityClick(() => onBoardExpeditionVehicle('hover_glider'))}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isFlyingHoverGlider
                              ? 'bg-cyan-400 border-cyan-100 text-slate-950'
                              : 'bg-[#102634] hover:bg-[#17364A] border-cyan-400/55 text-cyan-100'
                          }`}
                        >
                          Hover Glider
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-dirt-bike"
                          onClick={handleUtilityClick(() => onBoardExpeditionVehicle('dirt_bike_49cc'))}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isRidingDirtBike
                              ? 'bg-[#FF6A00] border-[#FFB36B] text-[#140B04]'
                              : 'bg-[#331B0E] hover:bg-[#4A2512] border-[#FF7B1C]/55 text-[#FFE8D4]'
                          }`}
                        >
                          49cc Dirt Bike
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-safari-jeep"
                          onClick={handleUtilityClick(() => onBoardExpeditionVehicle('safari_jeep'))}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isDrivingSafariJeep
                              ? 'bg-[#8DA35A] border-[#D8E8AF] text-[#12170D]'
                              : 'bg-[#252E1E] hover:bg-[#313D27] border-[#9EB26D]/35 text-[#EEF2E2]'
                          }`}
                        >
                          4×4 Safari Jeep
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-vtol"
                          onClick={handleUtilityClick(() => onBoardExpeditionVehicle('vtol_aircraft'))}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isFlyingVtol
                              ? 'bg-[#E5C170] border-[#FDF0C8] text-[#1B1308]'
                              : 'bg-[#332515] hover:bg-[#45321C] border-[#E5C170]/40 text-[#FCECD0]'
                          }`}
                        >
                          Gold/Wood VTOL
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-jetski-sport"
                          onClick={handleUtilityClick(() => onBoardExpeditionVehicle('jetski_sport'))}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isRidingSportJetSki
                              ? 'bg-[#D9EC18] border-[#F4FA96] text-[#141706]'
                              : 'bg-[#2C2F12] hover:bg-[#3B3F18] border-[#D9EC18]/40 text-[#F7FAD4]'
                          }`}
                        >
                          Sport Jet Ski (Yellow)
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-jetski-perf"
                          onClick={handleUtilityClick(() => onBoardExpeditionVehicle('jetski_perf'))}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isRidingPerfJetSki
                              ? 'bg-[#34D85A] border-[#A7F3BD] text-[#0A1E10]'
                              : 'bg-[#14301D] hover:bg-[#1C4228] border-[#34D85A]/40 text-[#DCFCE7]'
                          }`}
                        >
                          Pro Jet Ski (Green)
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          data-testid="dock-board-submarine"
                          onClick={handleUtilityClick(onBoardSubmarine)}
                          className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isDrivingSubmarine
                              ? 'bg-[#38BDF8] border-[#BAE6FD] text-[#081624]'
                              : 'bg-[#0E263A] hover:bg-[#153752] border-[#38BDF8]/45 text-[#E0F2FE]'
                          }`}
                        >
                          Deep Submarine
                        </button>
                      </div>

                      {/* 7-Perspective Camera Bar */}
                      <div className="flex flex-wrap items-center justify-center gap-1 pt-1 border-t border-[#D4C3A3]/15">
                        {CAMERA_PERSPECTIVES.map((cam) => {
                          const active = hud.cameraPerspective === cam.id;
                          return (
                            <button
                              key={cam.id}
                              type="button"
                              tabIndex={-1}
                              data-testid={`cam-mode-${cam.id}`}
                              title={cam.description}
                              onClick={handleUtilityClick(() => onSetCameraPerspective(cam.id))}
                              className={`min-h-[40px] px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                active
                                  ? 'bg-[#D9B366] text-[#151813] font-semibold'
                                  : 'bg-[#21271F] hover:bg-[#2C342A] text-[#CDD5C6] border border-[#D4C3A3]/15'
                              }`}
                            >
                              {cam.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom-Right: Mobile 2x2 Hero Thumb Pad + Walk / Bicycle / Skateboard Switcher + Jump / Boost */}
            {hud.activeVehicle === 'none' && (
              <div className="pointer-events-auto shrink-0 flex flex-col items-end gap-2">
                {/* Mobile Vertical (<640px) Ergonomic Right-Thumb 2x2 Superhero Action Pad */}
                {activeHeroSpec && (
                  <div
                    data-testid="mobile-hero-thumb-pad"
                    className="sm:hidden grid grid-cols-2 gap-1.5 w-[176px]"
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="mobile-hero-dodge-btn"
                      onClick={handleUtilityClick(onHeroDodge)}
                      className={`min-h-[48px] px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer select-none ${
                        hud.hero.dodgeTimer > 0
                          ? 'bg-emerald-400 border-emerald-200 text-slate-950'
                          : 'bg-[#132920]/94 border-emerald-400/50 text-emerald-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>Dodge</span>
                    </button>

                    {activeHeroSpec.mobility.canWebSwing ? (
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="mobile-hero-dive-btn"
                        onClick={handleUtilityClick(onToggleSpiderDive)}
                        className={`min-h-[48px] px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer select-none ${
                          hud.hero.isDiving
                            ? 'bg-amber-400 border-amber-200 text-slate-950'
                            : 'bg-[#2B2012]/94 border-amber-400/50 text-amber-100'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                        <span>{hud.hero.isDiving ? 'Diving' : 'Dive'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        tabIndex={-1}
                        data-testid="mobile-hero-secondary-btn"
                        onClick={handleUtilityClick(onHeroSecondaryPower)}
                        className={`min-h-[48px] px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center cursor-pointer select-none ${
                          hud.hero.energyShieldActive || hud.hero.detectiveVisionActive
                            ? 'bg-cyan-400 border-cyan-200 text-slate-950'
                            : 'bg-[#122536]/94 border-cyan-400/50 text-cyan-100'
                        }`}
                      >
                        <span className="truncate">{activeHeroSpec.secondaryPower.label}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="mobile-hero-primary-btn"
                      onClick={handleUtilityClick(onHeroPrimaryPower)}
                      className="min-h-[50px] px-2 rounded-lg bg-rose-600 active:bg-rose-500 border border-rose-300/60 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-lg cursor-pointer select-none"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {activeHeroPower?.shortLabel === 'Swing'
                          ? 'Web Shot'
                          : activeHeroPower?.shortLabel ?? activeHeroSpec.primaryPower.label}
                      </span>
                    </button>

                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="mobile-hero-mobility-btn"
                      onClick={handleUtilityClick(onHeroFlightOrSpecial)}
                      className={`min-h-[50px] px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 shadow-lg cursor-pointer select-none ${
                        hud.hero.isFlying || hud.hero.isGliding || hud.hero.isWebSwinging
                          ? 'bg-cyan-400 border-cyan-200 text-slate-950'
                          : 'bg-[#112A42]/94 border-sky-400/60 text-sky-100'
                      }`}
                    >
                      <Wind className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {activeHeroSpec.mobility.canFly
                          ? hud.hero.isFlying
                            ? 'Land'
                            : 'Fly'
                          : activeHeroSpec.mobility.canWebSwing
                          ? 'Web Swing'
                          : 'Glide'}
                      </span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  {hud.transportMode === 'bicycle' && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Ring Bicycle Bell (R)"
                      title="Bicycle Bell (R)"
                      onClick={handleUtilityClick(onRingBicycleBell)}
                      className="min-h-[44px] h-11 px-3 flex items-center gap-1.5 rounded-md bg-[#191429]/88 border border-[#F5D6C0]/25 text-xs text-[#FAF5EF] hover:bg-[#271F3F] transition-colors cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-[#F4BE98]" />
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
                    className={`min-h-[44px] h-11 px-3.5 flex items-center gap-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer select-none ${
                      hud.isJumping
                        ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E]'
                        : 'bg-[#191429]/88 border-[#F5D6C0]/25 text-[#FAF5EF] active:bg-[#F4BE98] active:text-[#1D162E] hover:bg-[#271F3F]'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
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
                    className="min-h-[44px] h-11 px-3.5 flex items-center gap-1.5 rounded-md bg-[#191429]/88 border border-[#F5D6C0]/25 text-xs font-medium text-[#FAF5EF] active:bg-[#F4BE98] active:text-[#1D162E] hover:bg-[#271F3F] transition-colors cursor-pointer select-none"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Boost</span>
                  </button>
                </div>

                {!hud.iceland.isGiant && (
                  <div
                    role="group"
                    aria-label="Ride Mode"
                    className={`${
                      activeHeroSpec ? 'hidden sm:flex' : 'flex'
                    } items-center gap-1 p-1 rounded-md bg-[#181327]/88 border border-[#F5D6C0]/24`}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Walk on Foot (1)"
                      aria-pressed={hud.transportMode === 'walk'}
                      title="Walk (1)"
                      onClick={handleUtilityClick(() => onSelectTransport('walk'))}
                      className={`min-h-[44px] h-11 px-3 flex items-center gap-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
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
                      className={`min-h-[44px] h-11 px-3 flex items-center gap-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
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
                      className={`min-h-[44px] h-11 px-3 flex items-center gap-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
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
