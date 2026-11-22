import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BoatId,
  DayCyclePreference,
  GameMode,
  GameSettings,
  HudSnapshot,
  InspectContent,
  PostcardRecord,
  SeasonType,
  SizeMode,
  WeatherType,
} from './game/types';
import { HOME_CENTER, LOCATIONS, WATER_LEVEL } from './game/terrain';
import { createInitialTrainState } from './game/railway';
import { createIcelandState } from './game/iceland';
import { createInitialBoats, createInitialBusState } from './game/vehicles';
import { createInitialCamperState } from './game/camper';
import { SKY_EXPLORER_PAD_POS, type SkyExplorerPadId } from './game/skyExplorer';
import { createInitialSkyTaxiState } from './game/skyTaxi';
import {
  getExhibitionVehicleById,
  type ExhibitionVehicleId,
} from './game/exhibitionComplex';
import {
  createInitialDinosaurIslandState,
  extractDinosaurIslandHud,
} from './game/dinosaurIsland';
import { createInitialCompanionMemory, createInitialCompanionState } from './game/companion';
import { createInitialBusDispatchState } from './game/busHailing';
import {
  loadJourneySave,
  loadPostcards,
  loadSettings,
  saveJourney,
  savePostcards,
  saveSettings,
} from './game/storage';
import { DreamlineEngine } from './world/DreamlineEngine';
import { TitleOverlay } from './components/TitleOverlay';
import { GameHud } from './components/GameHud';
import { AtmospherePanel } from './components/AtmospherePanel';
import { WorldMapModal } from './components/WorldMapModal';
import { TransitScheduleModal } from './components/TransitScheduleModal';
import { PhotoModeOverlay } from './components/PhotoModeOverlay';
import { InspectModal } from './components/InspectModal';
import { PauseSettingsModal } from './components/PauseSettingsModal';
import { CompanionJournalModal } from './components/CompanionBar';
import { HomeCustomizeModal } from './components/HomeCustomizeModal';
import { TrainRouteModal } from './components/TrainRouteModal';
import { AndroidAppModal, OfflineIndicator } from './components/AndroidAppModal';
import { AiConductorModal } from './components/AiConductorModal';
import { MobilePhoneModal } from './components/MobilePhoneModal';
import { ExhibitionVehicleModal } from './components/ExhibitionVehicleModal';

const INITIAL_HUD: HudSnapshot = {
  location: LOCATIONS[0],
  regionId: 'sakura',
  timeHours: 17.72,
  timeFormatted: '17:43',
  period: 'sunset',
  weather: 'clear',
  season: 'spring',
  temperatureC: 19,
  manualTemperatureC: null,
  isNightMode: false,
  transportMode: 'walk',
  activeVehicle: 'none',
  activeBoatId: null,
  boatFpvMode: false,
  playerX: 0.6,
  playerY: 0.85,
  playerZ: 13.3,
  playerHeading: Math.PI * 0.88,
  isSitting: false,
  isSwimming: false,
  isJumping: false,
  floodLevel: WATER_LEVEL,
  tsunamiActive: false,
  isOnTrain: false,
  trainViewMode: 'window',
  train: createInitialTrainState(),
  activeTicket: null,
  iceland: createIcelandState(0.6, 13.3, false, 'auto'),
  nearbyStationIndex: 0,
  bus: createInitialBusState(),
  boats: createInitialBoats(),
  camper: createInitialCamperState(),
  skyExplorer: {
    x: SKY_EXPLORER_PAD_POS.x,
    y: 2.2,
    z: SKY_EXPLORER_PAD_POS.z,
    speedKmh: 0,
    altitudeM: 2.2,
    boostActive: false,
  },
  camping: {
    tentPitched: true,
    fireLit: true,
    mealsCooked: 0,
    nightsCamped: 0,
  },
  home: {
    outfit: 'navy_jacket',
    decorStyle: 'warm_wood',
    fairyLightsOn: true,
    mealsPrepared: 0,
  },
  companion: createInitialCompanionState(0.6, 0.85, 13.3),
  companionMemory: createInitialCompanionMemory(),
  activePrompt: null,
  discoveredSpotIds: ['spot_sakuragawa'],
  recentNotice: null,
  canExitTrain: false,
  canExitBus: false,
  canTransferToIceland: false,
  dinosaurIsland: extractDinosaurIslandHud(createInitialDinosaurIslandState()),
  safariCarSpeedKmh: 0,
  trainDriverMode: false,
  busDriverMode: false,
  navigation: null,
  busDispatch: createInitialBusDispatchState(),
  skyTaxi: createInitialSkyTaxiState(),
  midnightFrontierOpen: false,
  inUndergroundCave: false,
  caveAreaName: null,
  exhibitionTestVehicleId: null,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<DreamlineEngine | null>(null);

  const [mode, setMode] = useState<GameMode>('title');
  const [titleSettingsOpen, setTitleSettingsOpen] = useState(false);
  const [androidAppModalOpen, setAndroidAppModalOpen] = useState(false);
  const [scenicOnly, setScenicOnly] = useState(false);
  const [atmosphereOpen, setAtmosphereOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [inspectContent, setInspectContent] = useState<InspectContent | null>(null);
  const [activeExhibitionVehicleId, setActiveExhibitionVehicleId] =
    useState<ExhibitionVehicleId | null>(null);
  const [isInspectingExhibition, setIsInspectingExhibition] = useState(false);
  const [postcards, setPostcards] = useState<PostcardRecord[]>(() => loadPostcards());
  const [hasSave, setHasSave] = useState<boolean>(() => loadJourneySave() !== null);
  const [webglLost, setWebglLost] = useState(false);

  useEffect(() => {
    const bodyState =
      mode === 'title' ? 'title' : mode === 'paused' ? 'paused' : 'playing';
    document.body.dataset.state = bodyState;
  }, [mode]);

  const applyMode = useCallback((next: GameMode) => {
    setMode(next);
    if (next !== 'playing') {
      setAtmosphereOpen(false);
    }
    if (next !== 'inspect') {
      setInspectContent(null);
    }
    if (next !== 'exhibition_vehicle') {
      setActiveExhibitionVehicleId(null);
      setIsInspectingExhibition(false);
      engineRef.current?.clearExhibitionInspectFocus();
    }
    engineRef.current?.setSuspended(false);
    engineRef.current?.setMode(next);
  }, []);

  const callbacksRef = useRef({
    onHudUpdate: (snapshot: HudSnapshot) => setHud(snapshot),
    onInspect: (content: InspectContent) => {
      setInspectContent(content);
      setMode('inspect');
      engineRef.current?.setMode('inspect');
    },
    onOpenExhibitionVehicle: (vehicleId: ExhibitionVehicleId) => {
      setActiveExhibitionVehicleId(vehicleId);
      setIsInspectingExhibition(false);
      setMode('exhibition_vehicle');
      engineRef.current?.setMode('exhibition_vehicle');
    },
    onModeChangeRequest: (next: GameMode) => {
      applyMode(next);
    },
    onWebglLost: () => setWebglLost(true),
  });

  useEffect(() => {
    callbacksRef.current.onModeChangeRequest = applyMode;
  }, [applyMode]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const initialSettings = loadSettings();
    const engine = new DreamlineEngine(mount, initialSettings, {
      onHudUpdate: (s) => callbacksRef.current.onHudUpdate(s),
      onInspect: (c) => callbacksRef.current.onInspect(c),
      onOpenExhibitionVehicle: (id) => callbacksRef.current.onOpenExhibitionVehicle(id),
      onModeChangeRequest: (m) => callbacksRef.current.onModeChangeRequest(m),
      onWebglLost: () => callbacksRef.current.onWebglLost(),
    });
    engineRef.current = engine;

    const savedCards = loadPostcards();
    if (savedCards[0]?.dataUrl) {
      engine.updateHomePostcardWall(savedCards[0].dataUrl);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      document.body.dataset.state = 'playing';
      setMode('playing');
      engine.setMode('playing');
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'playing') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT') return;
      if (e.code === 'KeyT') {
        e.preventDefault();
        setAtmosphereOpen((v) => !v);
      } else if (e.code === 'Escape' && atmosphereOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAtmosphereOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mode, atmosphereOpen]);

  const handleUpdateSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
    engineRef.current?.updateSettings(next);
  }, []);

  const handleNewJourney = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    engineRef.current?.resetJourney();
    document.body.dataset.state = 'playing';
    applyMode('playing');
  }, [applyMode]);

  const handleContinueJourney = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const saved = loadJourneySave();
    if (saved) {
      engineRef.current?.loadFromSave(saved);
    }
    document.body.dataset.state = 'playing';
    applyMode('playing');
  }, [applyMode]);

  const handleExploreFromTitle = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    applyMode('map');
  }, [applyMode]);

  const handleSaveJourney = useCallback(() => {
    const data = engineRef.current?.exportSaveData();
    if (data) {
      saveJourney(data);
      setHasSave(true);
    }
  }, []);

  const handleGoHome = useCallback(() => {
    engineRef.current?.teleportTo(HOME_CENTER.x, HOME_CENTER.z + 9.2, 'En Illam · My Home');
    applyMode('playing');
  }, [applyMode]);

  const handleCapturePostcard = useCallback(() => {
    const dataUrl = engineRef.current?.capturePostcardDataUrl();
    if (!dataUrl) return;
    const record: PostcardRecord = {
      id: `pc_${Date.now()}`,
      dataUrl,
      locationName: hud.location.name,
      jpName: hud.location.jpName,
      timeLabel: hud.timeFormatted,
      period: hud.period,
      weather: hud.weather,
      capturedAt: Date.now(),
    };
    setPostcards((prev) => {
      const next = [record, ...prev].slice(0, 12);
      savePostcards(next);
      return next;
    });
    engineRef.current?.showNotice(`Postcard saved & framed at En Illam · ${hud.location.name}`);
  }, [hud]);

  const handleDeletePostcard = useCallback((id: string) => {
    setPostcards((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePostcards(next);
      return next;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    handleUpdateSettings({ ...settings, muted: !settings.muted });
  }, [handleUpdateSettings, settings]);

  const handleChangeDayCycle = useCallback(
    (dayCycleMode: DayCyclePreference) => {
      handleUpdateSettings({ ...settings, dayCycleMode });
    },
    [handleUpdateSettings, settings]
  );

  const handleChangeWeather = useCallback((weather: WeatherType) => {
    engineRef.current?.setWeather(weather);
  }, []);

  const handleChangeSeason = useCallback((season: SeasonType) => {
    engineRef.current?.setSeason(season);
  }, []);

  const handleSetSizeMode = useCallback((sizeMode: SizeMode) => {
    engineRef.current?.setSizeMode(sizeMode);
  }, []);

  const handleBoardBoat = useCallback(
    (boatId: BoatId) => {
      engineRef.current?.boardBoatById(boatId);
      applyMode('playing');
    },
    [applyMode]
  );

  const handleBoardSkyExplorer = useCallback(
    (pad?: SkyExplorerPadId) => {
      engineRef.current?.boardSkyExplorer(pad);
      applyMode('playing');
    },
    [applyMode]
  );

  const handleBoardSkyTaxi = useCallback(() => {
    engineRef.current?.boardSkyTaxiNow();
    applyMode('playing');
  }, [applyMode]);

  const handleDriveCamper = useCallback(() => {
    engineRef.current?.boardCamperVan();
    applyMode('playing');
  }, [applyMode]);

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#171324]">
      <div
        ref={canvasMountRef}
        className="fixed inset-0 w-full h-full z-0"
        aria-label="DREAMLINE 3D 5-region open-world railway journey"
      />

      {webglLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171324] text-center p-8">
          <div className="max-w-md space-y-3">
            <h1 className="font-display text-2xl text-[#FAF5EF]">DREAMLINE</h1>
            <p className="text-sm text-[#DFC8BC]">
              The 3D graphics context was interrupted. Reload the page to continue your railway journey.
            </p>
          </div>
        </div>
      )}

      {mode === 'title' && !titleSettingsOpen && (
        <TitleOverlay
          hasSave={hasSave}
          scenicOnly={scenicOnly}
          onContinue={handleContinueJourney}
          onNewJourney={handleNewJourney}
          onExplore={handleExploreFromTitle}
          onOpenSettings={() => setTitleSettingsOpen(true)}
          onOpenAndroidApp={() => setAndroidAppModalOpen(true)}
          onScenicScreensaver={() => setScenicOnly((v) => !v)}
        />
      )}

      {mode === 'title' && titleSettingsOpen && (
        <PauseSettingsModal
          isTitleSettingsOnly
          settings={settings}
          hud={hud}
          onUpdateSettings={handleUpdateSettings}
          onChangeWeather={handleChangeWeather}
          onChangeSeason={handleChangeSeason}
          onSetSizeMode={handleSetSizeMode}
          onToggleGiantSmall={() => engineRef.current?.toggleGiantSmall()}
          onOpenAndroidApp={() => {
            setTitleSettingsOpen(false);
            setAndroidAppModalOpen(true);
          }}
          onResume={() => setTitleSettingsOpen(false)}
          onSaveJourney={handleSaveJourney}
          onReturnToTitle={() => setTitleSettingsOpen(false)}
        />
      )}

      {mode === 'playing' && (
        <>
          <GameHud
            hud={hud}
            muted={settings.muted}
            atmosphereOpen={atmosphereOpen}
            onToggleMap={() => applyMode('map')}
            onOpenTransitMap={() => applyMode('transit_map')}
            onToggleAtmosphere={() => setAtmosphereOpen((v) => !v)}
            onToggleMute={handleToggleMute}
            onOpenPause={() => applyMode('paused')}
            onOpenAndroidApp={() => setAndroidAppModalOpen(true)}
            onToggleGiantSmall={() => engineRef.current?.toggleGiantSmall()}
            onToggleIglooMan={() => engineRef.current?.toggleIglooManForm()}
            onOpenRouteSelect={() => engineRef.current?.openRouteSelection()}
            onSetTrainView={(v) => engineRef.current?.setTrainViewMode(v)}
            onEnterIceland={() => engineRef.current?.enterIcelandFromGateway()}
            onGoHome={handleGoHome}
            onInteractClick={() => engineRef.current?.triggerPrimaryInteract()}
            onToggleTrainView={() => engineRef.current?.toggleTrainViewMode()}
            onSelectTransport={(m) => engineRef.current?.setTransportMode(m)}
            onRingBicycleBell={() => engineRef.current?.ringBicycleBell()}
            onToggleCamperDoors={() => engineRef.current?.toggleCamperDoors()}
            onToggleCamperRoof={() => engineRef.current?.toggleCamperRoof()}
            onToggleCamperLights={() => engineRef.current?.toggleCamperLights()}
            onToggleCamperHazards={() => engineRef.current?.toggleCamperHazards()}
            onJoystickMove={(r, f) => engineRef.current?.setJoystickInput(r, f)}
            onMobileSprintChange={(active) => engineRef.current?.setMobileSprint(active)}
            onJump={() => engineRef.current?.triggerJump()}
            onFireAk47={() => engineRef.current?.fireDinosaurAk47()}
            onToggleSafariCar={() => engineRef.current?.toggleSafariCar()}
            onSpawnDinoWave={() => engineRef.current?.spawnNextDinosaurWave()}
            onOpenMobilePhone={() => applyMode('mobile_phone')}
            onClearNavigation={() => engineRef.current?.clearNavigationTarget()}
            onCallBusToNavTarget={() => {
              if (hud.navigation) {
                engineRef.current?.callMobileBus({
                  id: hud.navigation.target.id,
                  label: hud.navigation.target.label,
                  tamilLabel: hud.navigation.target.tamilLabel,
                  x: hud.navigation.target.x,
                  z: hud.navigation.target.z,
                });
              }
            }}
            onBoardDispatchedBus={() => engineRef.current?.boardDispatchedBusNow()}
            onCancelMobileBus={() => engineRef.current?.cancelMobileBus()}
            onBoardSkyTaxi={() => engineRef.current?.boardSkyTaxiNow()}
            onCancelSkyTaxi={() => engineRef.current?.cancelSkyTaxi()}
            onReturnToExhibition={() => engineRef.current?.returnFromExhibitionTest()}
            onSetTrainDriverMode={(en) => engineRef.current?.setTrainDriverMode(en)}
            onTrainHorn={() => engineRef.current?.soundTrainHorn()}
            onTrainDoors={() => engineRef.current?.toggleTrainManualDoors()}
            onSetBusDriverMode={(en) => engineRef.current?.setBusDriverMode(en)}
            onBusHorn={() => engineRef.current?.soundBusHorn()}
            onBusDoors={() => engineRef.current?.toggleBusManualDoors()}
            onExitUndergroundCave={() => engineRef.current?.exitUndergroundCave()}
            onToggleBoatFpv={(fpv) => engineRef.current?.setBoatFpvMode(fpv)}
            onSkyVertical={(up, down) => engineRef.current?.setSkyVerticalInput(up, down)}
          />

          <AtmospherePanel
            open={atmosphereOpen}
            timeHours={hud.timeHours}
            activePeriod={hud.period}
            weather={hud.weather}
            season={hud.season}
            temperatureC={hud.temperatureC}
            manualTemperatureC={hud.manualTemperatureC}
            dayCycleMode={settings.dayCycleMode}
            onSelectTime={(h) => engineRef.current?.setTimeHours(h)}
            onSelectWeather={handleChangeWeather}
            onSelectSeason={handleChangeSeason}
            onSelectTemperature={(tempC) => engineRef.current?.setManualTemperatureC(tempC)}
            onChangeDayCycle={handleChangeDayCycle}
            onClose={() => setAtmosphereOpen(false)}
          />
        </>
      )}

      {mode === 'camera' && (
        <PhotoModeOverlay
          hud={hud}
          postcards={postcards}
          onFovChange={(fov) => engineRef.current?.setPhotoFov(fov)}
          onCapture={handleCapturePostcard}
          onDeletePostcard={handleDeletePostcard}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'map' && (
        <WorldMapModal
          hud={hud}
          onTeleport={(x, z, label) => {
            engineRef.current?.teleportTo(x, z, label);
            applyMode('playing');
          }}
          onSetNavigation={(target) => engineRef.current?.setNavigationTarget(target)}
          onClearNavigation={() => engineRef.current?.clearNavigationTarget()}
          onCallBus={(dest) => engineRef.current?.callMobileBus(dest)}
          onEnterCaves={() => engineRef.current?.enterUndergroundCave()}
          onToggleNightMode={() => engineRef.current?.toggleNightMode()}
          onOpenTransitMap={() => applyMode('transit_map')}
          onBoardBoat={handleBoardBoat}
          onBoardSkyExplorer={handleBoardSkyExplorer}
          onBoardSkyTaxi={handleBoardSkyTaxi}
          onDriveCamper={handleDriveCamper}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'transit_map' && (
        <TransitScheduleModal
          hud={hud}
          onTeleport={(x, z, label) => {
            engineRef.current?.teleportTo(x, z, label);
            applyMode('playing');
          }}
          onBoardBoat={handleBoardBoat}
          onDriveCamper={handleDriveCamper}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'journal' && (
        <CompanionJournalModal
          hud={hud}
          onChat={() => {
            engineRef.current?.chatWithCompanion();
            applyMode('playing');
          }}
          onFrostyEmote={(emote) => {
            engineRef.current?.playFrostyEmote(emote);
            applyMode('playing');
          }}
          onTeleportHome={handleGoHome}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'home_menu' && (
        <HomeCustomizeModal
          home={hud.home}
          onSelectOutfit={(o) => engineRef.current?.setOutfit(o)}
          onSelectDecor={(d) => engineRef.current?.setHomeDecor(d)}
          onToggleFairyLights={() => engineRef.current?.toggleFairyLights()}
          onCookMeal={() => engineRef.current?.cookAtHome()}
          onSleepUntil={(h, label) => engineRef.current?.sleepUntil(h, label)}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'route_select' && (
        <TrainRouteModal
          hud={hud}
          onConfirmRoute={(intermediates, destinationIdx) => {
            engineRef.current?.confirmTrainRoute(intermediates, destinationIdx);
          }}
          onOpenAiConductor={() => applyMode('ai_conductor')}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'ai_conductor' && (
        <AiConductorModal
          hud={hud}
          onApplyRoute={(intermediates, destinationIdx) => {
            engineRef.current?.applyAiTrainRoute(intermediates, destinationIdx);
          }}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'mobile_phone' && (
        <MobilePhoneModal
          hud={hud}
          onCallBus={(dest) => engineRef.current?.callMobileBus(dest)}
          onCancelBus={() => engineRef.current?.cancelMobileBus()}
          onBoardDispatchedBus={() => engineRef.current?.boardDispatchedBusNow()}
          onCallSkyTaxi={(dest) => engineRef.current?.callMobileSkyTaxi(dest)}
          onCancelSkyTaxi={() => engineRef.current?.cancelSkyTaxi()}
          onBoardSkyTaxi={handleBoardSkyTaxi}
          onSetNavigation={(target) => engineRef.current?.setNavigationTarget(target)}
          onOpenAiConductor={() => applyMode('ai_conductor')}
          onEnterCaves={() => engineRef.current?.enterUndergroundCave()}
          onExitCaves={() => engineRef.current?.exitUndergroundCave()}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'exhibition_vehicle' && activeExhibitionVehicleId && (() => {
        const entry = getExhibitionVehicleById(activeExhibitionVehicleId);
        if (!entry) return null;
        return (
          <ExhibitionVehicleModal
            vehicle={entry}
            isDispatched={hud.exhibitionTestVehicleId === entry.id}
            isInspecting={isInspectingExhibition}
            onInspect={(id) => {
              const next = !isInspectingExhibition;
              setIsInspectingExhibition(next);
              if (next) {
                engineRef.current?.focusExhibitionVehicle(id);
              } else {
                engineRef.current?.clearExhibitionInspectFocus();
              }
            }}
            onEnter={(id) => {
              engineRef.current?.enterExhibitionVehicle(id);
              applyMode('playing');
            }}
            onTest={(id) => {
              engineRef.current?.testExhibitionVehicle(id);
              applyMode('playing');
            }}
            onSpawn={(id) => {
              engineRef.current?.spawnExhibitionVehicle(id);
              applyMode('playing');
            }}
            onReturn={(id) => {
              engineRef.current?.returnExhibitionVehicle(id);
            }}
            onClose={() => applyMode('playing')}
          />
        );
      })()}

      {mode === 'inspect' && inspectContent && (
        <InspectModal
          content={inspectContent}
          hud={hud}
          onDispenseDrink={(drinkName) => {
            engineRef.current?.audio.playVendingDispense();
            engineRef.current?.showNotice(`Enjoying ${drinkName}`);
          }}
          onClose={() => applyMode('playing')}
        />
      )}

      {mode === 'paused' && (
        <PauseSettingsModal
          isTitleSettingsOnly={false}
          settings={settings}
          hud={hud}
          onUpdateSettings={handleUpdateSettings}
          onChangeWeather={handleChangeWeather}
          onChangeSeason={handleChangeSeason}
          onSetSizeMode={handleSetSizeMode}
          onToggleGiantSmall={() => engineRef.current?.toggleGiantSmall()}
          onOpenAndroidApp={() => setAndroidAppModalOpen(true)}
          onResume={() => applyMode('playing')}
          onSaveJourney={handleSaveJourney}
          onReturnToTitle={() => {
            handleSaveJourney();
            applyMode('title');
          }}
        />
      )}

      {androidAppModalOpen && (
        <AndroidAppModal
          onClose={() => setAndroidAppModalOpen(false)}
          onDownloaded={(msg) => engineRef.current?.showNotice(msg)}
        />
      )}

      <OfflineIndicator />
    </main>
  );
}
