import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  BoatId,
  BoatState,
  BoyOutfitId,
  CamperState,
  CampingState,
  CompanionMemory,
  CompanionState,
  DigitalTrainTicket,
  FrostyEmote,
  GameMode,
  GameSettings,
  HomeDecorStyle,
  HomeState,
  HudSnapshot,
  IcelandState,
  InspectContent,
  InteractableItem,
  RegionId,
  SaveData,
  SeasonType,
  SizeMode,
  TrainViewMode,
  TransportMode,
  VehicleKind,
  WeatherType,
} from '../game/types';
import { getAvatarMeta, isValidBoyOutfitId } from '../game/avatars';
import {
  COAST_CENTER,
  ENCHANTED_FOREST_CENTER,
  getLocationAt,
  getRegionAt,
  HOME_CENTER,
  isSwimmableWaterAt,
  isWaterAt,
  LAKE_CENTER,
  REGION_LABELS,
  resolvePlayerCollision,
  SCENIC_SPOTS,
  walkableHeightAt,
  walkableHeightWithFloor,
  WATER_LEVEL,
  WATERFALL_CENTER,
  type AabbCollider,
} from '../game/terrain';
import {
  applyTrainRoutePlan,
  canBoardTrain,
  createInitialTrainState,
  createTrainRoutePlan,
  CROSSING_POINT,
  findNearbyStationIndex,
  getDisembarkPosition,
  STATIONS,
  stepTrainManualDrive,
  stepTrainState,
} from '../game/railway';
import {
  computeStationCrowdProfile,
  generateStationAnnouncement,
  type StationAnnouncement,
  type StationAnnouncementEventKind,
} from '../game/stationAnnouncements';
import {
  computeCatalogueSpawnPoint,
  getCatalogueVehicleById,
  type CatalogueVehicleId,
} from '../game/vehicleCatalogue';
import {
  computeEffectiveTemperatureC,
  getTemperatureDescriptor,
  MAX_TEMPERATURE_C,
  MIN_TEMPERATURE_C,
} from '../game/trainSteam';
import {
  createIcelandState,
  getScaleGameplayMetrics,
  GIANT_IGLOO_MAN_HEIGHT_M,
  GIANT_PLAYER_HEIGHT_M,
  ICELAND_ARRIVAL_POS,
  ICELAND_GIANT_SCALE,
  stepIcelandState,
} from '../game/iceland';
import {
  BUS_STOPS,
  canBoardBus,
  createInitialBoats,
  createInitialBusState,
  getBusDisembarkPosition,
  stepBoatState,
  stepBusManualDrive,
  stepBusState,
} from '../game/vehicles';
import {
  createInitialCamperState,
  getCamperExitPosition,
  stepCamperState,
} from '../game/camper';
import {
  createInitialCompanionMemory,
  createInitialCompanionState,
  pickContextualDialogue,
  recordCompanionMilestone,
  recordRegionVisit,
  stepCompanionFollow,
  triggerFrostyEmote,
} from '../game/companion';
import {
  computeSkyPalette,
  formatClockTime,
  getTimePeriod,
  normalizeHours,
  SEASON_LABELS,
  WEATHER_LABELS,
} from '../game/timeWeather';
import {
  createInitialPlayerLanternState,
  setPlayerLanternOverride,
  stepPlayerLantern,
  togglePlayerLantern,
  type PlayerLanternState,
} from '../game/playerLantern';
import { createPlayerLanternRig, type PlayerLanternRig } from './playerLantern3D';
import {
  applyScreenOrbitInput,
  applyScreenZoomInput,
  createInitialSmoothCameraState,
  createInitialSmoothLocomotionState,
  filterFrameDt,
  filterMovementInput,
  stepSmoothCameraOrbit,
  stepSmoothCameraRig,
  stepSmoothLocomotionVisuals,
  syncSmoothCameraImmediate,
  syncSmoothCameraOrbitTargets,
  syncSmoothLocomotionImmediate,
  type SmoothCameraState,
  type SmoothLocomotionState,
} from '../game/smoothCameraMotion';
import {
  createInitialExtremeWeatherState,
  getEffectiveWaterLevel,
  getWeatherProfile,
  primeExtremeWeatherOnSelect,
  stepExtremeWeatherState,
  type ExtremeWeatherState,
} from '../game/extremeWeather';
import {
  combineMovementInput,
  createInitialJumpState,
  requestJump,
  stepJumpState,
  toggleNightModeHours,
  TRANSPORT_SPECS,
  type JumpState,
} from '../game/locomotion';
import { createProceduralTextures } from './textures';
import { createSkyAndWater } from './skyAndWater';
import { createWorldArchitecture } from './architecture';
import { createWorldNature } from './nature';
import { createExtremeWeather3D } from './extremeWeather3D';
import { createPassengerTrain } from './train';
import { createPlayerCharacter } from './player';
import { createCompanionRig } from './companionMesh';
import { buildPersonalHome } from './personalHome';
import { buildRegionsWorld } from './regionsWorld';
import { buildVehiclesWorld } from './vehiclesWorld';
import {
  createInitialDinosaurIslandState,
  DINOSAUR_ARENA_CENTER,
  DINOSAUR_ISLAND_CENTER,
  extractDinosaurIslandHud,
  fireDinosaurIslandAk47,
  getActiveArenaWallColliders,
  isOnDinosaurIsland,
  spawnNextDinoWave,
  stepDinosaurIslandState,
  stepSafariCarState,
  type DinosaurIslandState,
} from '../game/dinosaurIsland';
import { computeNavigationState, type NavigationTarget } from '../game/navigation';
import {
  isMidnightFrontierOpen,
  MIDNIGHT_FRONTIER_DISCOVERIES,
  MIDNIGHT_FRONTIER_PORTAL_POS,
  MIDNIGHT_FRONTIER_VALLEY_RADIUS,
} from '../game/midnightFrontier';
import {
  createInitialBusDispatchState,
  requestMobileBusRide,
  stepDispatchedBus,
  type BusDispatchState,
  type BusRideDestination,
} from '../game/busHailing';
import {
  AVS_SNOW_HOUSE_CENTER,
  AVS_SNOW_HOUSE_ROT_Y,
  CAVE_ENTRANCES,
  CAVE_FLOOR_Y,
  getCaveChamberAt,
  getCaveFloorHeightAt,
  isPointInsideCaveWorld,
} from '../game/frozenKingdom';
import {
  EXHIBITION_HELIPAD_POS,
  EXHIBITION_ISLAND_CENTER,
  EXHIBITION_LAND_CIRCUIT_CENTER,
  EXHIBITION_PLAZA_SPAWN,
  getExhibitionSubzoneLabel,
  getExhibitionVehicleById,
  isInsideExhibitionIsland,
  type ExhibitionVehicleId,
} from '../game/exhibitionComplex';
import {
  boardSkyTaxi,
  cancelSkyTaxi,
  createInitialSkyTaxiState,
  requestMobileSkyTaxi,
  SKY_TAXI_STOPS,
  stepSkyTaxiState,
  type SkyTaxiDestination,
  type SkyTaxiState,
} from '../game/skyTaxi';
import { buildEnchantedForestWorld } from './enchantedForest';
import { buildDinosaurIslandWorld } from './dinosaurIslandWorld';
import { buildFirefliesWorld } from './firefliesWorld';
import { buildWildlifeWorld } from './wildlifeWorld';
import { buildBirdFlockingWorld } from './birdFlockingWorld';
import { buildWorldPeople } from './people';
import { buildNavigationGuide3D } from './navigationGuide3D';
import { buildMidnightFrontierPortal } from './midnightFrontierPortal';
import { buildAvsSnowHouse } from './avsSnowHouse';
import { buildFrozenKingdomWorld } from './frozenKingdomWorld';
import { buildExhibitionComplexWorld } from './exhibitionComplexWorld';
import { createDesertOasisWorld } from './desertOasisWorld';
import {
  DESERT_BIOME_CENTER,
  DESERT_HELIPAD_POS,
  DESERT_OASIS_CENTER,
  DESERT_PYRAMID_CENTER,
} from '../game/desertOasis';
import {
  AVS_HELIPAD_POS,
  createInitialSkyExplorerState,
  createSkyExplorerAtHelipad,
  getSkyExplorerExitPosition,
  HOME_HELIPAD_POS,
  stepSkyExplorerState,
  type SkyExplorerPadId,
  type SkyExplorerState,
} from '../game/skyExplorer';
import { buildSkyExplorerWorld } from './skyExplorerWorld';
import { DreamlineAudio } from './audio';
import {
  computeHeroMovementMultipliers,
  createInitialHeroRuntimeState,
  cycleHeroOutfit,
  getHeroById,
  getHeroOutfitById,
  type ActiveHeroRuntimeState,
  type HeroCharacterId,
  type HeroOutfitId,
} from '../game/heroCharacters';
import {
  createInitialBatmobileState,
  getBatmobileExitPosition,
  repairBatmobile,
  stepBatmobileState,
  type BatmobileState,
} from '../game/batmobile';
import {
  createInitialWebSwingState,
  findBestWebOrGrappleAnchor,
  startWebSwing,
  stepWebSwingPhysics,
  type MetroDestructionState,
  type WebSwingState,
} from '../game/metroCity';
import { createHeroCharacterRig } from './heroCharacters3D';
import { buildBatmobileWorld } from './batmobileWorld';
import { createHeroVfxSystem3D, type HeroVfxRenderInput } from './heroVfx3D';
import {
  VAULT_CEILING_Y,
  VAULT_FLOOR_Y,
  VAULT_HATCH_WORLD,
  VAULT_SPAWN_POS,
  clampVaultPosition,
  createInitialHomeVaultState,
  getVaultCarSpec,
  isPlayerInsidePersonalHome,
  stepSecretHatchAnimation,
  stepVaultCarState,
  toggleSecretVaultHatch,
  type HomeVaultState,
  type VaultCarId,
} from '../game/homeUndergroundVault';
import {
  buildHomeUndergroundVault3D,
  type HomeUndergroundVault3D,
} from './homeUndergroundVault3D';
import {
  AIRPORT_CENTER,
  METRO_FLOOR_Y,
  METRO_SURFACE_ENTRANCES,
  PARACHUTE_TOWER_POS,
  clampUndergroundMetroPosition,
  createInitialAirlinerState,
  createInitialParachuteState,
  createInitialSubwayTrainState,
  getAirlinerExitPosition,
  getMetroStationById,
  getUndergroundMetroFloorY,
  stepAirlinerState,
  stepParachuteGlide,
  stepSubwayTrainState,
  type AirlinerState,
  type MetroStationId,
  type ParachuteState,
  type SubwayTrainState,
} from '../game/airportMetro';
import { buildAirportMetroWorld } from './airportMetroWorld';

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onInspect: (content: InspectContent) => void;
  onOpenExhibitionVehicle?: (vehicleId: ExhibitionVehicleId) => void;
  onModeChangeRequest: (mode: GameMode) => void;
  onWebglLost?: () => void;
}

// Pre-allocated scratch vectors (zero GC in render loop)
const _sunDir = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camTargetLook = new THREE.Vector3();
const _camCurrentLook = new THREE.Vector3(0, 2.2, 10);
const _seatPos = new THREE.Vector3();
const _seatLook = new THREE.Vector3();
const _extAnchor = new THREE.Vector3();
const _compTrainSeat = new THREE.Vector3();
const _tmpLightPos = new THREE.Vector3();
const _skyCol = new THREE.Color();
const _sunCol = new THREE.Color();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class DreamlineEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private resizeObserver: ResizeObserver;

  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fog: THREE.FogExp2;

  private textures: ReturnType<typeof createProceduralTextures>;
  private skyWater: ReturnType<typeof createSkyAndWater>;
  private architecture: ReturnType<typeof createWorldArchitecture>;
  private nature: ReturnType<typeof createWorldNature>;
  private extremeWeather3D: ReturnType<typeof createExtremeWeather3D>;
  private trainRig: ReturnType<typeof createPassengerTrain>;
  private playerRig: ReturnType<typeof createPlayerCharacter>;
  private companionRig: ReturnType<typeof createCompanionRig>;
  private personalHome: ReturnType<typeof buildPersonalHome>;
  private regionsWorld: ReturnType<typeof buildRegionsWorld>;
  private vehiclesWorld: ReturnType<typeof buildVehiclesWorld>;
  private enchantedForest: ReturnType<typeof buildEnchantedForestWorld>;
  private dinosaurIslandWorld: ReturnType<typeof buildDinosaurIslandWorld>;
  private firefliesWorld: ReturnType<typeof buildFirefliesWorld>;
  private wildlifeWorld: ReturnType<typeof buildWildlifeWorld>;
  private birdFlockingWorld: ReturnType<typeof buildBirdFlockingWorld>;
  private lastFlockCountAttr = -1;
  private lastFlockBirdsAttr = -1;
  private peopleSystem: ReturnType<typeof buildWorldPeople>;
  private navigationGuide: ReturnType<typeof buildNavigationGuide3D>;
  private midnightPortal: ReturnType<typeof buildMidnightFrontierPortal>;
  private avsSnowHouse: ReturnType<typeof buildAvsSnowHouse>;
  private frozenKingdom: ReturnType<typeof buildFrozenKingdomWorld>;
  private skyExplorerWorld: ReturnType<typeof buildSkyExplorerWorld>;
  private skyTaxiWorld: ReturnType<typeof buildSkyExplorerWorld>;
  private exhibitionComplexWorld: ReturnType<typeof buildExhibitionComplexWorld>;
  private desertOasisWorld: ReturnType<typeof createDesertOasisWorld>;
  private heroRig: ReturnType<typeof createHeroCharacterRig>;
  private batmobileWorld: ReturnType<typeof buildBatmobileWorld>;
  private heroVfxWorld: ReturnType<typeof createHeroVfxSystem3D>;
  private homeVaultWorld: HomeUndergroundVault3D;
  private airportMetroWorld: ReturnType<typeof buildAirportMetroWorld>;
  private desertCampfireLit = true;
  public audio: DreamlineAudio;

  // 3D Heroes, Armoured Batmobile & Secret Underground Superhero Vault + Car Garage State
  private heroState: ActiveHeroRuntimeState = createInitialHeroRuntimeState();
  private batmobileState: BatmobileState = createInitialBatmobileState();
  private homeVaultState: HomeVaultState = createInitialHomeVaultState();
  private readonly emptyWebAnchorState: MetroDestructionState = {
    buildings: [],
    props: [],
    debris: [],
    dustClouds: [],
    traffic: [],
    totalDestructionScore: 0,
    destroyedBuildingsCount: 0,
    destroyedPropsCount: 0,
    nextDebrisId: 1,
    rngState: 1,
  };
  private webSwingState: WebSwingState = createInitialWebSwingState();
  // Underground Metro, Flyable DL-787 Airliner, Parachute & Midnight Portal auto-trigger
  private inUndergroundMetro = false;
  private metroStationId: MetroStationId = 'metro_central';
  private subwayState: SubwayTrainState = createInitialSubwayTrainState();
  private subwayRidingTo: string | null = null;
  private subwayRideTimer = 0;
  private subwayTargetStationId: MetroStationId | null = null;
  private airlinerState: AirlinerState = createInitialAirlinerState();
  private parachuteState: ParachuteState = createInitialParachuteState();
  private midnightPortalCooldown = 0;
  private activeBeamVfx: {
    fromX: number;
    fromY: number;
    fromZ: number;
    toX: number;
    toY: number;
    toZ: number;
    color: number;
    timer: number;
    maxTime: number;
  } | null = null;
  private activeShockwaveVfx: {
    x: number;
    y: number;
    z: number;
    maxRadius: number;
    timer: number;
    maxTime: number;
    color: number;
  } | null = null;

  private staticColliders: AabbCollider[] = [];
  private allColliders: AabbCollider[] = [];
  private allInteractables: InteractableItem[] = [];

  // New Systems: Suspension, Live Navigation, Mobile Bus Dispatch, Sky Explorer Taxi, Exhibition Complex, Underground Caves
  private suspended = false;
  private navTarget: NavigationTarget | null = null;
  private busDispatch: BusDispatchState = createInitialBusDispatchState();
  private skyTaxi: SkyTaxiState = createInitialSkyTaxiState();
  private prevMidnightOpen = false;
  private exhibitionInspectTargetId: ExhibitionVehicleId | null = null;
  private exhibitionTestVehicleId: ExhibitionVehicleId | null = null;
  private trainDriverMode = false;
  private trainManualDoors = false;
  private trainManualBrake = false;
  private busDriverMode = false;
  private busManualDoors = false;
  private inUndergroundCave = false;
  private lastCaveEntranceId: string = CAVE_ENTRANCES[0].id;
  private activeStationAnnouncement: StationAnnouncement | null = null;
  private stationAnnouncementTimer = 0;
  private ambientPaCooldown = 9;
  private announcementSeq = 1;
  private readonly sceneBgColor = new THREE.Color(0x8864a8);

  // Game & simulation state
  private mode: GameMode = 'title';
  private settings: GameSettings;
  private timeHours = 17.72; // Signature pink-lavender sunset
  private weather: WeatherType = 'clear';
  private extremeWeatherState: ExtremeWeatherState = createInitialExtremeWeatherState();
  private season: SeasonType = 'spring';
  private manualTemperatureC: number | null = null;
  private trainState = createInitialTrainState();
  private prevTrainPhase = this.trainState.phase;
  private prevPassedStationIndex: number | null = null;
  private activeTicket: DigitalTrainTicket | null = null;
  private busState = createInitialBusState();
  private boats: BoatState[] = createInitialBoats();
  private camperState: CamperState = createInitialCamperState();
  private dinosaurIslandState: DinosaurIslandState = createInitialDinosaurIslandState();
  private skyExplorerState: SkyExplorerState = createInitialSkyExplorerState();
  private skyAscendHeld = false;
  private skyDescendHeld = false;
  private boatFpvMode = false;

  // Camping, Personal Home, and Companion Frosty state
  private campingState: CampingState = {
    tentPitched: true,
    fireLit: true,
    mealsCooked: 0,
    nightsCamped: 0,
  };
  private homeState: HomeState = {
    outfit: 'navy_jacket',
    decorStyle: 'warm_wood',
    fairyLightsOn: true,
    mealsPrepared: 0,
  };
  private companionState: CompanionState = createInitialCompanionState(0.6, 0.85, 13.3);
  private companionMemory: CompanionMemory = createInitialCompanionMemory();
  private lastRegionId: RegionId = 'sakura';

  // Player state
  private playerX = 0.6;
  private playerY = 0.85;
  private playerZ = 13.3;
  private playerVx = 0;
  private playerVz = 0;
  private playerHeading = Math.PI * 0.88;
  private isSitting = false;
  private isSwimming = false;
  private jumpState: JumpState = createInitialJumpState();
  private sittingSpot: InteractableItem | null = null;
  private activeVehicle: VehicleKind = 'none';
  private activeBoatId: BoatId | null = null;
  private trainViewMode: TrainViewMode = 'window';
  private cabinWalkZ = -1.2;
  private cabinWalkX = 0;
  private transportMode: TransportMode = 'walk';
  private currentTurnRate = 0;
  private playerLanternRig!: PlayerLanternRig;
  private playerLanternState: PlayerLanternState = createInitialPlayerLanternState();

  // Iceland Giant Transformation state
  private icelandState: IcelandState = createIcelandState(0.6, 13.3, false, 'auto');
  private prevInIceland = false;

  // Camera orbit & Photo Mode state (critically damped smooth moving screen)
  private camYaw = 0.55;
  private camPitch = 0.14;
  private camDistance = 4.6;
  private lastCamYawSynced = 0.55;
  private lastCamPitchSynced = 0.14;
  private lastCamDistSynced = 4.6;
  private smoothCam: SmoothCameraState = createInitialSmoothCameraState(0.55, 0.14, 4.6, 52);
  private smoothLoco: SmoothLocomotionState = createInitialSmoothLocomotionState(0, 0);
  private smoothVisualY = 0;
  private smoothBankRad = 0;
  private smoothPitchLeanRad = 0;
  private smoothFlightSurge = 0;
  private lastMoveSpeed = 0;
  private lastIsSprinting = false;
  private filteredDt = 1 / 60;
  private photoFov = 48;
  private isDragging = false;
  private activeCameraPointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Discovery & notices
  private discoveredSpots = new Set<string>(['spot_sakuragawa']);
  private recentNotice: string | null = null;
  private noticeTimer = 0;

  // Input state (keyboard + virtual mobile joystick)
  private keysHeld = new Set<string>();
  private joyRight = 0;
  private joyForward = 0;
  private mobileSprint = false;

  // Loop & timing + adaptive anti-lag performance guard
  private frameId = 0;
  private lastFrameMs = 0;
  private elapsed = 0;
  private hudEmitTimer = 0;
  private lightBudgetTimer = 0;
  private shadowFrameCounter = 0;
  private avgFrameMs = 16.6;
  private dprAdjustTimer = 0;
  private dynamicDprScale = 1.0;
  private sceneLocalLights: Array<THREE.PointLight | THREE.SpotLight> = [];
  private disposed = false;

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, window.innerWidth, 320);
    const height = Math.max(container.clientHeight, window.innerHeight, 240);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05 * this.settings.brightness;
    this.renderer.setSize(width, height);
    this.applyQualitySettings();
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.setAttribute('data-testid', 'dreamline-canvas');
    container.appendChild(this.renderer.domElement);

    // Scene, Studio RoomEnvironment PMREM & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = this.sceneBgColor;
    this.fog = new THREE.FogExp2(0xc98b9e, 0.0036);
    this.scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    // Camera (far = 1280 > 950m camera-centered sky dome; tighter far plane improves depth precision & frustum culling)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.25, 1280);
    this.camera.position.set(11.8, 3.0, 12.6);
    this.camera.lookAt(-4.0, 2.2, 10.0);
    _camCurrentLook.set(-4.0, 2.2, 10.0);

    // Warm Key Sun Light + Cool/Warm Sky-Ground Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xb684b5, 0x52414f, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xff9966, 1.65);
    this.sunLight.position.set(-60, 24, -75);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    const d = 44;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.025;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Build Procedural Assets & World Modules
    this.textures = createProceduralTextures(this.renderer);
    this.skyWater = createSkyAndWater(this.scene);
    this.architecture = createWorldArchitecture(this.scene, this.textures, this.isSoftwareGl);
    this.nature = createWorldNature(this.scene, this.isSoftwareGl);
    this.applySeasonFoliage();
    this.extremeWeather3D = createExtremeWeather3D(this.scene, this.isSoftwareGl);
    this.trainRig = createPassengerTrain(this.scene, this.isSoftwareGl);
    this.playerRig = createPlayerCharacter(this.scene, this.textures, this.isSoftwareGl);

    // New 5-Region Expansion Modules: Frosty the Ice Companion, En Illam Home, 4 New Regions, Bus & Boats
    this.companionRig = createCompanionRig(this.textures);
    this.scene.add(this.companionRig.group);
    this.scene.add(this.companionRig.worldFxGroup);

    this.personalHome = buildPersonalHome(this.textures, this.isSoftwareGl);
    this.scene.add(this.personalHome.group);

    this.regionsWorld = buildRegionsWorld(this.textures);
    this.scene.add(this.regionsWorld.group);

    this.vehiclesWorld = buildVehiclesWorld(this.textures);
    this.scene.add(this.vehiclesWorld.group);

    this.enchantedForest = buildEnchantedForestWorld(this.isSoftwareGl);
    this.scene.add(this.enchantedForest.group);

    this.peopleSystem = buildWorldPeople(this.isSoftwareGl);
    this.scene.add(this.peopleSystem.group);

    this.dinosaurIslandWorld = buildDinosaurIslandWorld(this.isSoftwareGl);
    this.scene.add(this.dinosaurIslandWorld.group);

    this.firefliesWorld = buildFirefliesWorld(720);
    this.scene.add(this.firefliesWorld.group);

    this.wildlifeWorld = buildWildlifeWorld();
    this.scene.add(this.wildlifeWorld.group);

    this.birdFlockingWorld = buildBirdFlockingWorld(this.playerX, this.playerZ, this.season);
    this.scene.add(this.birdFlockingWorld.group);
    const initialFlockStats = this.birdFlockingWorld.getStats();
    this.lastFlockCountAttr = initialFlockStats.activeFlocks;
    this.lastFlockBirdsAttr = initialFlockStats.activeBirds;
    this.container.dataset.flockCount = String(initialFlockStats.activeFlocks);
    this.container.dataset.flockBirds = String(initialFlockStats.activeBirds);

    this.navigationGuide = buildNavigationGuide3D();
    this.scene.add(this.navigationGuide.group);

    this.midnightPortal = buildMidnightFrontierPortal();
    this.scene.add(this.midnightPortal.group);

    this.avsSnowHouse = buildAvsSnowHouse();
    this.scene.add(this.avsSnowHouse.group);

    this.frozenKingdom = buildFrozenKingdomWorld(this.isSoftwareGl);
    this.scene.add(this.frozenKingdom.surfaceGroup);
    this.scene.add(this.frozenKingdom.caveGroup);

    this.skyExplorerWorld = buildSkyExplorerWorld(this.skyExplorerState);
    this.scene.add(this.skyExplorerWorld.group);

    // Dedicated SSJ Tropical Sky Explorer Air Taxi (scheduled aerial route + on-demand mobile pickup!)
    const initialTaxiCraft: SkyExplorerState = {
      ...createInitialSkyExplorerState(),
      x: this.skyTaxi.x,
      y: this.skyTaxi.y,
      z: this.skyTaxi.z,
      heading: this.skyTaxi.heading,
    };
    this.skyTaxiWorld = buildSkyExplorerWorld(initialTaxiCraft);
    // Keep only the primary craft on the Air Taxi (hide its second twin clone) and add an illuminated SKY TAXI beacon!
    if (this.skyTaxiWorld.group.children.length > 1) {
      this.skyTaxiWorld.group.children[1].visible = false;
    }
    const taxiBeaconCanvas = document.createElement('canvas');
    taxiBeaconCanvas.width = 256;
    taxiBeaconCanvas.height = 96;
    const tbCtx = taxiBeaconCanvas.getContext('2d');
    if (tbCtx) {
      tbCtx.fillStyle = '#0f172a';
      tbCtx.fillRect(0, 0, 256, 96);
      tbCtx.strokeStyle = '#38bdf8';
      tbCtx.lineWidth = 6;
      tbCtx.strokeRect(4, 4, 248, 88);
      tbCtx.fillStyle = '#fde047';
      tbCtx.font = 'bold 40px sans-serif';
      tbCtx.textAlign = 'center';
      tbCtx.textBaseline = 'middle';
      tbCtx.fillText('SKY TAXI', 128, 50);
    }
    const taxiBeaconTex = new THREE.CanvasTexture(taxiBeaconCanvas);
    taxiBeaconTex.colorSpace = THREE.SRGBColorSpace;
    const taxiBeaconMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.62, 0.34),
      new THREE.MeshStandardMaterial({
        map: taxiBeaconTex,
        emissive: new THREE.Color(0xfacc15),
        emissiveIntensity: 0.55,
        roughness: 0.25,
      })
    );
    taxiBeaconMesh.position.set(0, 3.35, 0);
    if (this.skyTaxiWorld.group.children[0]) {
      this.skyTaxiWorld.group.children[0].add(taxiBeaconMesh);
    }
    this.scene.add(this.skyTaxiWorld.group);

    // Offshore Ocean Universal Transportation Exhibition & Experience Complex
    this.exhibitionComplexWorld = buildExhibitionComplexWorld(this.textures, this.isSoftwareGl);
    this.scene.add(this.exhibitionComplexWorld.group);

    // Western Expanse: Thar Golden Desert Oasis & Walkable Grand Sandstone Pyramid Ruins
    this.desertOasisWorld = createDesertOasisWorld(this.scene);

    // 3D Hero Rigs, Armoured Batmobile, Standalone Hero VFX & Secret Underground House Vault
    this.heroRig = createHeroCharacterRig(this.isSoftwareGl);
    this.heroRig.group.visible = false;
    this.scene.add(this.heroRig.group);

    this.batmobileWorld = buildBatmobileWorld(this.isSoftwareGl);
    this.batmobileWorld.update(this.batmobileState, 0, 0.8);
    this.batmobileWorld.group.visible = !this.batmobileState.inVault;
    this.scene.add(this.batmobileWorld.group);

    this.heroVfxWorld = createHeroVfxSystem3D();
    this.scene.add(this.heroVfxWorld.group);

    this.homeVaultWorld = buildHomeUndergroundVault3D(this.isSoftwareGl);
    this.scene.add(this.homeVaultWorld.chamberGroup);
    this.scene.add(this.homeVaultWorld.carsGroup);

    this.airportMetroWorld = buildAirportMetroWorld(this.isSoftwareGl);
    this.scene.add(this.airportMetroWorld.surfaceGroup);
    this.scene.add(this.airportMetroWorld.undergroundGroup);
    this.scene.add(this.airportMetroWorld.airlinerGroup);
    this.scene.add(this.airportMetroWorld.parachuteGroup);

    this.playerLanternRig = createPlayerLanternRig(this.scene, this.isSoftwareGl);

    this.container.dataset.activeHero = 'none';
    this.container.dataset.batmobileActive = 'false';
    this.container.dataset.lanternOn = 'false';
    this.container.dataset.inHomeVault = 'false';
    this.container.dataset.vaultHatchOpen = 'false';
    this.container.dataset.activeVaultCar = 'none';

    this.staticColliders = [
      ...this.architecture.colliders,
      ...this.personalHome.colliders,
      ...this.regionsWorld.colliders,
      ...this.enchantedForest.colliders,
      ...this.exhibitionComplexWorld.colliders,
      ...this.desertOasisWorld.colliders,
      ...this.airportMetroWorld.colliders,
    ];
    this.prevMidnightOpen = isMidnightFrontierOpen(this.timeHours);
    this.refreshDynamicColliders();
    this.allInteractables = [
      ...this.architecture.interactables,
      ...this.personalHome.interactables,
      ...this.regionsWorld.interactables,
      ...this.vehiclesWorld.interactables,
      ...this.enchantedForest.interactables,
      ...this.peopleSystem.interactables,
      ...this.exhibitionComplexWorld.interactables,
      ...this.desertOasisWorld.interactables,
      ...this.airportMetroWorld.surfaceInteractables,
      this.skyExplorerWorld.interactable,
    ];

    this.audio = new DreamlineAudio();
    this.audio.setVolumes(this.settings.soundVolume, this.settings.musicVolume, this.settings.muted);

    // Initial placement before first frame
    this.playerY = walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
    this.companionState = createInitialCompanionState(this.playerX, this.playerY, this.playerZ);
    this.playerRig.setOutfit(this.homeState.outfit);
    this.trainRig.update(this.trainState, 0, 0.9);
    this.vehiclesWorld.syncBus(this.busState, 0, 0.9);
    this.vehiclesWorld.syncBoats(this.boats, 0);
    this.playerRig.setPose({
      x: this.playerX,
      y: this.playerY,
      z: this.playerZ,
      heading: this.playerHeading,
      speed: 0,
      turnRate: 0,
      transportMode: this.transportMode,
      isSitting: false,
      visible: true,
      lanternStrength: 0.9,
      elapsed: 0,
      dt: 0.016,
    });
    this.companionRig.setPose(this.companionState, 0);

    // Collect all local PointLight/SpotLight nodes once for fast distance-based shader budgeting (<= 4 active!)
    this.sceneLocalLights = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.PointLight || obj instanceof THREE.SpotLight) {
        this.sceneLocalLights.push(obj);
      }
    });
    this.updateLocalLightBudget();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.lastFrameMs = performance.now();
    this.emitHudSnapshot();
    this.tick();
  }

  private updateLocalLightBudget(): void {
    const lights = this.sceneLocalLights;
    if (lights.length === 0) return;

    const maxActive = 3;
    const candidates: Array<{
      light: THREE.PointLight | THREE.SpotLight;
      distSq: number;
      priority: number;
    }> = [];

    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      if (light.intensity <= 0.02) {
        light.visible = false;
        continue;
      }
      // Verify ancestor chain is visible (skip lights inside culled/hidden world groups)
      let ancestorVisible = true;
      let p = light.parent;
      while (p) {
        if (!p.visible) {
          ancestorVisible = false;
          break;
        }
        p = p.parent;
      }
      if (!ancestorVisible) {
        light.visible = false;
        continue;
      }

      const isPlayerLantern = Boolean(light.userData?.isPlayerLantern);
      const isTrainLight = Boolean(light.userData?.isTrainLight);
      light.getWorldPosition(_tmpLightPos);
      const dx = _tmpLightPos.x - this.playerX;
      const dz = _tmpLightPos.z - this.playerZ;
      const distSq = dx * dx + dz * dz;
      const maxRange = this.inUndergroundCave
        ? 135
        : isPlayerLantern
        ? 250
        : isTrainLight
        ? 195
        : Math.max((light.distance || 24) * 2.2, 54);
      if (distSq > maxRange * maxRange) {
        light.visible = false;
        continue;
      }
      const priority = isPlayerLantern ? 0 : 1;
      candidates.push({ light, distSq, priority });
    }

    if (candidates.length <= maxActive) {
      for (let i = 0; i < candidates.length; i++) {
        candidates[i].light.visible = true;
      }
      return;
    }

    candidates.sort((a, b) => (a.priority !== b.priority ? a.priority - b.priority : a.distSq - b.distSq));
    for (let i = 0; i < candidates.length; i++) {
      candidates[i].light.visible = i < maxActive;
    }
  }

  private applyQualitySettings(): void {
    const maxDpr =
      this.settings.graphicsQuality === 'low'
        ? 0.78
        : this.settings.graphicsQuality === 'medium'
        ? 0.96
        : 1.15;
    const qScale =
      this.settings.graphicsQuality === 'low'
        ? 0.72
        : this.settings.graphicsQuality === 'medium'
        ? 0.86
        : 0.96;
    const targetDpr = this.isSoftwareGl
      ? 0.85
      : Math.min(window.devicePixelRatio || 1, maxDpr) *
        this.settings.resolutionScale *
        qScale *
        this.dynamicDprScale;
    this.renderer.setPixelRatio(Math.max(0.55, targetDpr));
    this.renderer.shadowMap.enabled =
      !this.isSoftwareGl && this.settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    if (this.sunLight) {
      const targetShadowSize = this.settings.graphicsQuality === 'high' ? 768 : 512;
      if (this.sunLight.shadow.mapSize.x !== targetShadowSize) {
        this.sunLight.shadow.mapSize.set(targetShadowSize, targetShadowSize);
        if (this.sunLight.shadow.map) {
          this.sunLight.shadow.map.dispose();
          this.sunLight.shadow.map = null;
        }
      }
    }
    this.renderer.toneMappingExposure = 1.05 * this.settings.brightness;
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, window.innerWidth, 320);
    const height = Math.max(this.container.clientHeight, window.innerHeight, 240);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.render(this.scene, this.camera);
  }

  private renderImmediate(): void {
    if (this.disposed) return;
    this.updateSimulation(0.001);
    this.renderer.render(this.scene, this.camera);
  }

  private speakCompanion(
    context: 'coastal' | 'snow' | 'sakura' | 'countryside' | 'lake_camp' | 'desert' | 'airport' | 'home' | 'igloo' | 'train' | 'bus' | 'boat' | 'campfire' | 'night' | 'general',
    force = false
  ): void {
    if (!force && this.companionState.cooldownTimer > 0) return;
    const line = pickContextualDialogue(context, this.companionMemory, force);
    if (!line) return;
    this.companionState.currentLine = line;
    this.companionState.lineTimer = 6.2;
    this.companionState.cooldownTimer = 14.0;
    this.emitHudSnapshot();
  }

  public chatWithCompanion(): void {
    this.audio.unlock();
    if (this.companionState.restingInIgloo) {
      this.speakCompanion('igloo', true);
      return;
    }
    this.companionState = triggerFrostyEmote(this.companionState, 'wave', 2.6);
    if (this.activeVehicle === 'train') this.speakCompanion('train', true);
    else if (this.activeVehicle === 'bus') this.speakCompanion('bus', true);
    else if (this.activeVehicle === 'boat') this.speakCompanion('boat', true);
    else if (Math.hypot(this.playerX - HOME_CENTER.x, this.playerZ - HOME_CENTER.z) < 16) {
      this.speakCompanion('home', true);
    } else if (getTimePeriod(this.timeHours) === 'night') {
      this.speakCompanion('night', true);
    } else {
      this.speakCompanion(getRegionAt(this.playerX, this.playerZ), true);
    }
  }

  public playFrostyEmote(emote: FrostyEmote): void {
    this.audio.unlock();
    this.companionState = triggerFrostyEmote(this.companionState, emote, 3.8);
    if (emote === 'snowball') {
      const fx = this.companionState.x + Math.sin(this.companionState.heading) * 0.85;
      const fz = this.companionState.z + Math.cos(this.companionState.heading) * 0.85;
      const fy = walkableHeightWithFloor(fx, fz, this.companionState.y);
      this.companionRig.spawnSnowSculpture(fx, fy, fz);
      recordCompanionMilestone(
        this.companionMemory,
        'sculpture',
        'Frosty sculpted a tiny sparkling snow buddy!'
      );
      this.showNotice('Frosty crafted a tiny sparkling snow sculpture!');
      this.speakCompanion('snow', true);
    } else if (emote === 'dance') {
      this.showNotice('Frosty is doing a joyful snow dance!');
    } else if (emote === 'wave') {
      this.showNotice('Frosty waves happily with icy mittens!');
    } else if (emote === 'happy_bounce') {
      this.showNotice('Frosty bounces with sparkling joy!');
    }
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public setOutfit(outfit: BoyOutfitId): void {
    this.homeState = { ...this.homeState, outfit };
    this.playerRig.setOutfit(outfit);
    const meta = getAvatarMeta(outfit);
    this.showNotice(`Now wearing ${meta.name}`);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleIglooManForm(): void {
    this.audio.unlock();
    const next: BoyOutfitId =
      this.homeState.outfit === 'igloo_man' ? 'navy_jacket' : 'igloo_man';
    this.audio.playIcelandTransform(next === 'igloo_man');
    this.setOutfit(next);
  }

  public setHomeDecor(decorStyle: HomeDecorStyle): void {
    this.homeState = { ...this.homeState, decorStyle };
    this.showNotice(`Updated En Illam decor style`);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleFairyLights(): void {
    this.homeState = { ...this.homeState, fairyLightsOn: !this.homeState.fairyLightsOn };
    this.showNotice(this.homeState.fairyLightsOn ? 'Warm balcony fairy lights ON' : 'Balcony fairy lights OFF');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public sleepUntil(targetHour: number, label: string): void {
    this.timeHours = normalizeHours(targetHour);
    this.showNotice(label);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public cookAtHome(): void {
    this.homeState = { ...this.homeState, mealsPrepared: this.homeState.mealsPrepared + 1 };
    recordCompanionMilestone(this.companionMemory, 'home', 'Brewed warm Filter Kaapi together at En Illam.');
    this.showNotice('Brewed fresh Filter Kaapi & hot dosai in En Illam kitchen');
    this.speakCompanion('home', true);
    this.emitHudSnapshot();
  }

  public updateHomePostcardWall(dataUrl?: string): void {
    this.personalHome.updatePostcardDisplay(dataUrl);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    const code = e.code;
    this.audio.unlock();
    if (this.mode === 'title') return;

    if (code === 'Escape') {
      e.preventDefault();
      if (this.mode === 'playing') {
        this.callbacks.onModeChangeRequest('paused');
      } else {
        this.callbacks.onModeChangeRequest('playing');
      }
      return;
    }

    if (code === 'KeyP' && (this.mode === 'playing' || this.mode === 'mobile_phone')) {
      e.preventDefault();
      this.callbacks.onModeChangeRequest(this.mode === 'mobile_phone' ? 'playing' : 'mobile_phone');
      return;
    }

    if (code === 'KeyM' && (this.mode === 'playing' || this.mode === 'map')) {
      e.preventDefault();
      this.callbacks.onModeChangeRequest(this.mode === 'map' ? 'playing' : 'map');
      return;
    }

    if (code === 'KeyC' && (this.mode === 'playing' || this.mode === 'camera')) {
      e.preventDefault();
      if (this.mode === 'playing' && this.activeVehicle === 'none' && this.heroState.activeHeroId) {
        this.cycleActiveHeroOutfit();
      } else {
        this.callbacks.onModeChangeRequest(this.mode === 'camera' ? 'playing' : 'camera');
      }
      return;
    }

    if (code === 'KeyJ' && (this.mode === 'playing' || this.mode === 'journal')) {
      if (this.mode === 'playing' && this.dinosaurIslandState.onIsland) {
        e.preventDefault();
        this.toggleSafariCar();
        return;
      }
      e.preventDefault();
      this.callbacks.onModeChangeRequest(this.mode === 'journal' ? 'playing' : 'journal');
      return;
    }
    if (code === 'KeyU' && (this.mode === 'playing' || this.mode === 'hero_armory')) {
      e.preventDefault();
      this.callbacks.onModeChangeRequest(this.mode === 'hero_armory' ? 'playing' : 'hero_armory');
      return;
    }

    if (this.mode === 'playing') {
      if (
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
      }
      if (code === 'KeyF' && this.dinosaurIslandState.onIsland) {
        e.preventDefault();
        this.fireDinosaurAk47();
        return;
      }
      if (code === 'KeyQ' && this.activeVehicle === 'none' && this.heroState.activeHeroId) {
        e.preventDefault();
        this.triggerHeroPrimaryPower();
        return;
      }
      if (
        code === 'KeyF' &&
        !this.dinosaurIslandState.onIsland &&
        this.activeVehicle === 'none' &&
        this.heroState.activeHeroId
      ) {
        e.preventDefault();
        this.toggleHeroFlightOrSpecial();
        return;
      }
      if (code === 'Space' && this.activeVehicle === 'none') {
        e.preventDefault();
        if (!e.repeat) {
          if (this.heroState.isWebSwinging) {
            // Release web swing with upward acrobatic launch!
            this.heroState.isWebSwinging = false;
            this.webSwingState.active = false;
            this.jumpState.isAirborne = true;
            this.jumpState.velocityY = 12.0;
            this.audio.playJump(1.18);
          } else if (!this.heroState.isFlying) {
            this.triggerJump();
          }
        }
        return;
      }
      if (code === 'KeyE') {
        e.preventDefault();
        this.triggerPrimaryInteract();
        return;
      }
      if (code === 'KeyH') {
        e.preventDefault();
        if (this.activeVehicle === 'train' && this.trainDriverMode) {
          this.soundTrainHorn();
        } else if (this.activeVehicle === 'bus' && this.busDriverMode) {
          this.soundBusHorn();
        } else if (this.activeVehicle === 'camper') {
          this.toggleCamperHazards();
        } else if (this.activeVehicle === 'batmobile') {
          this.toggleBatmobileLights();
        } else {
          this.chatWithCompanion();
        }
        return;
      }
      if (code === 'KeyO') {
        if (this.activeVehicle === 'train' && this.trainDriverMode) {
          e.preventDefault();
          this.toggleTrainManualDoors();
          return;
        }
        if (this.activeVehicle === 'bus' && this.busDriverMode) {
          e.preventDefault();
          this.toggleBusManualDoors();
          return;
        }
        if (this.activeVehicle === 'camper') {
          e.preventDefault();
          this.toggleCamperDoors();
          return;
        }
        if (this.activeVehicle === 'batmobile') {
          e.preventDefault();
          this.toggleBatmobileCanopy();
          return;
        }
      }
      if (code === 'KeyL' && this.activeVehicle === 'camper') {
        e.preventDefault();
        this.toggleCamperLights();
        return;
      }
      if (code === 'KeyL' && this.activeVehicle === 'batmobile') {
        e.preventDefault();
        this.toggleBatmobileLights();
        return;
      }
      if (code === 'KeyL' && this.activeVehicle === 'vault_car') {
        e.preventDefault();
        this.toggleVaultCarLights();
        return;
      }
      if (code === 'KeyL') {
        e.preventDefault();
        this.togglePersonalLantern();
        return;
      }
      if (code === 'KeyG') {
        e.preventDefault();
        if (
          this.activeVehicle === 'none' &&
          !this.inUndergroundCave &&
          !this.inUndergroundMetro &&
          !this.homeVaultState.inVault
        ) {
          const gY = walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
          if (this.parachuteState.active || this.playerY > gY + 2.4) {
            this.toggleParachute();
            return;
          }
        }
        const regionNow = getRegionAt(this.playerX, this.playerZ);
        this.playFrostyEmote(regionNow === 'snow' ? 'snowball' : 'wave');
        return;
      }
      if (code === 'KeyV') {
        if (
          this.activeVehicle === 'train' ||
          this.activeVehicle === 'bus' ||
          this.activeVehicle === 'camper'
        ) {
          e.preventDefault();
          this.toggleTrainViewMode();
          return;
        }
        if (this.activeVehicle === 'batmobile') {
          e.preventDefault();
          this.cycleBatmobileCamera();
          return;
        }
        if (this.activeVehicle === 'none' && this.heroState.activeHeroId) {
          e.preventDefault();
          this.cycleActiveHeroOutfit();
          return;
        }
      }
      if (code === 'KeyN') {
        e.preventDefault();
        if (this.dinosaurIslandState.onIsland) {
          this.spawnNextDinosaurWave();
        } else {
          this.toggleNightMode();
        }
        return;
      }
      if (code === 'Digit1') {
        e.preventDefault();
        this.setTransportMode('walk');
        return;
      }
      if (code === 'Digit2' || code === 'KeyB') {
        e.preventDefault();
        this.setTransportMode(this.transportMode === 'bicycle' ? 'walk' : 'bicycle');
        return;
      }
      if (code === 'Digit3' || code === 'KeyK') {
        e.preventDefault();
        if (code === 'KeyK' && this.dinosaurIslandState.onIsland) {
          this.fireDinosaurAk47();
          return;
        }
        this.setTransportMode(this.transportMode === 'skateboard' ? 'walk' : 'skateboard');
        return;
      }
      if (code === 'KeyR') {
        if (this.activeVehicle === 'camper') {
          e.preventDefault();
          this.toggleCamperRoof();
          return;
        }
        if (this.activeVehicle === 'batmobile') {
          e.preventDefault();
          this.repairBatmobileNow();
          return;
        }
        if (this.activeVehicle === 'none' && this.heroState.activeHeroId) {
          e.preventDefault();
          this.triggerHeroSecondaryPower();
          return;
        }
        if (this.transportMode === 'bicycle' && this.activeVehicle === 'none') {
          e.preventDefault();
          this.ringBicycleBell();
          return;
        }
      }
    }

    this.keysHeld.add(code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.audio.unlock();
    if (this.mode !== 'playing' && this.mode !== 'camera' && this.mode !== 'exhibition_vehicle') return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    if (this.activeCameraPointerId !== null) return;
    this.activeCameraPointerId = e.pointerId;
    this.isDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging || e.pointerId !== this.activeCameraPointerId) return;
    if (this.mode !== 'playing' && this.mode !== 'camera' && this.mode !== 'exhibition_vehicle') return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const sens = 0.0052 * this.settings.mouseSensitivity * this.settings.cameraSensitivity;
    // Feed decoupled orbit targets + subtle release inertia so screen panning is critically damped & silky smooth
    applyScreenOrbitInput(this.smoothCam, dx, dy, sens, -0.18, 1.05);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== this.activeCameraPointerId) return;
    this.isDragging = false;
    this.activeCameraPointerId = null;
  };

  private onWheel = (e: WheelEvent) => {
    if (this.mode === 'playing') {
      applyScreenZoomInput(this.smoothCam, e.deltaY, 3.2, 12.5);
    } else if (this.mode === 'camera') {
      this.photoFov = THREE.MathUtils.clamp(this.photoFov + e.deltaY * 0.025, 24, 78);
    }
  };

  private onWindowBlur = () => {
    this.keysHeld.clear();
    this.joyRight = 0;
    this.joyForward = 0;
    this.mobileSprint = false;
    this.isDragging = false;
    this.activeCameraPointerId = null;
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onWebglLost?.();
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
    dom.addEventListener('webglcontextlost', this.onContextLost);
  }

  public setMode(mode: GameMode): void {
    const prev = this.mode;
    this.mode = mode;
    this.keysHeld.clear();
    this.joyRight = 0;
    this.joyForward = 0;
    this.mobileSprint = false;
    this.isDragging = false;
    this.activeCameraPointerId = null;
    this.audio.setPaused(mode === 'paused');

    if (prev === 'title' && mode === 'playing') {
      this.audio.unlock();
      this.camYaw = 0.55;
      this.camPitch = 0.14;
      this.camDistance = 4.6;
      this.snapThirdPersonCamera();
    }

    if (prev === 'route_select' && mode === 'playing') {
      // Release dwell hold when closing route selector
      this.trainState = { ...this.trainState, dwellHold: false };
    }

    if (mode !== 'camera') {
      const metrics = getScaleGameplayMetrics(
        this.icelandState.playerScale,
        this.isSitting,
        this.transportMode === 'bicycle'
      );
      this.camera.fov = 52 + metrics.cameraFovBonus;
      this.camera.updateProjectionMatrix();
    }

    this.emitHudSnapshot();
  }

  private snapThirdPersonCamera(): void {
    const metrics = getScaleGameplayMetrics(
      this.icelandState.playerScale,
      this.isSitting,
      this.transportMode === 'bicycle'
    );
    const effDist = this.camDistance * metrics.cameraDistanceMultiplier;
    const focusY = this.playerY + metrics.cameraFocusHeight;
    const horiz = Math.cos(this.camPitch) * effDist;
    const rawDirX = Math.sin(this.camYaw) * horiz;
    const rawDirZ = Math.cos(this.camYaw) * horiz;
    const desiredX = this.playerX + rawDirX;
    const desiredZ = this.playerZ + rawDirZ;
    const groundAtCam = this.homeVaultState.inVault
      ? VAULT_FLOOR_Y
      : this.inUndergroundMetro
        ? getUndergroundMetroFloorY(desiredX, desiredZ)
        : this.inUndergroundCave
          ? getCaveFloorHeightAt(desiredX, desiredZ)
          : walkableHeightWithFloor(desiredX, desiredZ, this.playerY);
    const rawSafeY = Math.max(
      focusY + Math.sin(this.camPitch) * effDist + 0.35 * metrics.cameraDistanceMultiplier,
      groundAtCam + (this.homeVaultState.inVault ? 0.9 : metrics.cameraGroundClearance)
    );
    const safeY = this.homeVaultState.inVault
      ? Math.min(VAULT_CEILING_Y - 1.0, rawSafeY)
      : this.inUndergroundMetro
        ? Math.min(METRO_FLOOR_Y + 9.2, rawSafeY)
        : this.inUndergroundCave
          ? Math.min(CAVE_FLOOR_Y + 9.0, rawSafeY)
          : rawSafeY;
    this.camera.position.set(desiredX, safeY, desiredZ);
    _camCurrentLook.set(this.playerX, focusY, this.playerZ);
    this.camera.lookAt(_camCurrentLook);
    syncSmoothCameraImmediate(this.smoothCam, {
      yaw: this.camYaw,
      pitch: this.camPitch,
      distance: this.camDistance,
      posX: desiredX,
      posY: safeY,
      posZ: desiredZ,
      lookX: this.playerX,
      lookY: focusY,
      lookZ: this.playerZ,
      anchorX: this.playerX,
      anchorY: this.playerY,
      anchorZ: this.playerZ,
      fov: 52 + metrics.cameraFovBonus,
    });
    syncSmoothLocomotionImmediate(
      this.smoothLoco,
      this.playerX,
      this.playerY,
      this.playerZ,
      this.playerHeading
    );
    this.smoothVisualY = this.playerY;
    this.smoothBankRad = 0;
    this.smoothPitchLeanRad = 0;
    this.lastCamYawSynced = this.camYaw;
    this.lastCamPitchSynced = this.camPitch;
    this.lastCamDistSynced = this.camDistance;
  }

  public updateSettings(next: GameSettings): void {
    this.settings = { ...next };
    this.applyQualitySettings();
    this.audio.setVolumes(next.soundVolume, next.musicVolume, next.muted);
  }

  public setTimeHours(hours: number): void {
    this.timeHours = normalizeHours(hours);
    this.firefliesWorld.snapVisibility(this.timeHours, this.weather);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleNightMode(): void {
    this.audio.unlock();
    const res = toggleNightModeHours(this.timeHours);
    this.timeHours = res.hours;
    this.playerLanternState = setPlayerLanternOverride(this.playerLanternState, null);
    this.firefliesWorld.snapVisibility(this.timeHours, this.weather);
    this.showNotice(
      res.isNight
        ? 'Night Mode · Starry Countryside (22:15) · Lantern Lit'
        : 'Sunset Mode · Golden Dusk (17:43)'
    );
    if (res.isNight) this.speakCompanion('night');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public setTransportMode(mode: TransportMode): void {
    this.audio.unlock();
    if (this.activeVehicle !== 'none') return;
    if (this.icelandState.isGiant && mode !== 'walk') {
      this.transportMode = 'walk';
      this.showNotice('Giant Form walks on foot · Turn off Stay Giant to ride Bicycle or Skateboard');
      this.emitHudSnapshot();
      return;
    }
    if (this.isSitting) {
      this.isSitting = false;
      this.sittingSpot = null;
    }
    this.transportMode = mode;
    const spec = TRANSPORT_SPECS[mode];
    if (mode === 'bicycle') {
      this.audio.playBicycleBell();
      this.showNotice(`Riding ${spec.label} (${spec.jpLabel}) · Press R for bell`);
    } else if (mode === 'skateboard') {
      this.audio.playSkatePush();
      this.showNotice(`Cruising on ${spec.label} (${spec.jpLabel})`);
    } else {
      this.showNotice(`Walking on Foot (${spec.jpLabel})`);
    }
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public ringBicycleBell(): void {
    this.audio.unlock();
    this.audio.playBicycleBell();
    this.showNotice('Chirin-chirin! ♪');
  }

  public setJoystickInput(right: number, forward: number): void {
    this.audio.unlock();
    this.joyRight = THREE.MathUtils.clamp(right, -1, 1);
    this.joyForward = THREE.MathUtils.clamp(forward, -1, 1);
  }

  public setMobileSprint(active: boolean): void {
    this.mobileSprint = active;
  }

  public triggerJump(): void {
    this.audio.unlock();
    if (this.mode !== 'playing' || this.activeVehicle !== 'none') return;
    if (this.isSitting) {
      this.isSitting = false;
      this.sittingSpot = null;
    }
    this.jumpState = requestJump(this.jumpState);
  }

  public setWeather(weather: WeatherType): void {
    this.audio.unlock();
    this.weather = weather;
    this.extremeWeatherState = primeExtremeWeatherOnSelect(
      this.extremeWeatherState,
      weather,
      this.playerX
    );
    if (this.extremeWeatherState.thunderTriggered) {
      this.audio.playThunderClap(this.extremeWeatherState.thunderIntensity);
    }
    if (this.extremeWeatherState.tsunamiRoarTriggered) {
      this.audio.playTsunamiRoar();
    }
    const label = WEATHER_LABELS[weather];
    if (weather === 'flood') {
      this.showNotice(`Flood (${label.jp}) · Valley waters rising — swim across flooded streets!`);
    } else if (weather === 'tsunami') {
      this.showNotice(`Tsunami (${label.jp}) · Giant ocean wave wall surging across the coast & valley!`);
    } else if (weather === 'ferocious_rain') {
      this.showNotice(`Ferocious Rain (${label.jp}) · Intense monsoon storm with rapid lightning & thunder!`);
    } else if (weather === 'thunderstorm') {
      this.showNotice(`Thunder Rain (${label.jp}) · Heavy storm rain with forked lightning & rolling thunder!`);
    } else if (weather === 'heavy_rain') {
      this.showNotice(`Heavy Rain (${label.jp}) · Dense pouring rainfall across the valley!`);
    }
    this.firefliesWorld.snapVisibility(this.timeHours, this.weather);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  private applySeasonFoliage() {
    const profile = this.nature.applySeason(this.season);
    this.container.dataset.season = this.season;
    this.container.dataset.foliageModel = profile.treeModelVariant;
    this.container.dataset.plantModel = profile.plantModelVariant;
    return profile;
  }

  public setSeason(season: SeasonType): void {
    this.season = season;
    const profile = this.applySeasonFoliage();
    const label = SEASON_LABELS[season];
    this.showNotice(
      `Season changed to ${label.name} (${label.tamil}) · ${profile.heroTreeLabel} & ${profile.plantLabel}`
    );
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public setManualTemperatureC(tempC: number | null): void {
    if (tempC === null || !Number.isFinite(tempC)) {
      this.manualTemperatureC = null;
      const autoTemp = computeEffectiveTemperatureC(
        this.season,
        this.weather,
        this.timeHours,
        getRegionAt(this.trainState.worldX, this.trainState.worldZ),
        null
      );
      this.showNotice(`Air temperature set to Auto (${Math.round(autoTemp)}°C · ${getTemperatureDescriptor(autoTemp)})`);
    } else {
      const clamped = Math.round(THREE.MathUtils.clamp(tempC, MIN_TEMPERATURE_C, MAX_TEMPERATURE_C));
      this.manualTemperatureC = clamped;
      this.showNotice(`Air temperature set to ${clamped}°C (${getTemperatureDescriptor(clamped)})`);
    }
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public setPhotoFov(fov: number): void {
    this.photoFov = THREE.MathUtils.clamp(fov, 24, 78);
  }

  public setSuspended(suspended: boolean): void {
    this.suspended = suspended;
    this.audio.setPaused(suspended || this.mode === 'paused');
    if (!suspended) {
      this.lastFrameMs = performance.now();
    }
  }

  public setNavigationTarget(target: NavigationTarget): void {
    this.audio.unlock();
    this.navTarget = { ...target };
    this.showNotice(`Live GPS Arrow active · Navigating to ${target.label}`);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public clearNavigationTarget(): void {
    this.navTarget = null;
    this.navigationGuide.group.visible = false;
    this.emitHudSnapshot();
  }

  public callMobileBus(destination: BusRideDestination): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave(this.lastCaveEntranceId);
    }
    this.busDriverMode = false;
    this.busManualDoors = false;
    const res = requestMobileBusRide(
      this.playerX,
      this.playerZ,
      this.playerHeading,
      destination,
      this.busState
    );
    this.busState = res.bus;
    this.busDispatch = res.dispatch;
    this.audio.playStationChime();
    this.showNotice(res.dispatch.statusMessage);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public cancelMobileBus(): void {
    this.busDispatch = createInitialBusDispatchState();
    this.showNotice('Mobile bus pickup cancelled');
    this.emitHudSnapshot();
  }

  public boardDispatchedBusNow(): void {
    this.audio.unlock();
    if (this.busDispatch.phase !== 'arrived_pickup' && this.busDispatch.phase !== 'en_route_pickup') {
      return;
    }
    if (this.busDispatch.phase === 'en_route_pickup') {
      // Bring bus right to pickup spot if user clicks instant board
      this.busState = {
        ...this.busState,
        worldX: this.busDispatch.pickupX,
        worldZ: this.busDispatch.pickupZ,
        phase: 'stopped',
        doorOpen: 1,
        speed: 0,
        speedKmh: 0,
      };
    }
    this.activeVehicle = 'bus';
    this.busDriverMode = false;
    this.trainViewMode = 'window';
    this.isSitting = false;
    this.busDispatch = {
      ...this.busDispatch,
      phase: 'driving_to_destination',
      statusMessage: `Driving you to ${this.busDispatch.destination?.label ?? 'Destination'}`,
    };
    this.audio.playDoorChime();
    this.showNotice(
      `Boarded Dreamline Bus · Heading straight to ${this.busDispatch.destination?.label ?? 'Destination'}`
    );
    this.speakCompanion('bus', true);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public callMobileSkyTaxi(destination: SkyTaxiDestination): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave(this.lastCaveEntranceId);
    }
    this.skyTaxi = requestMobileSkyTaxi(
      this.playerX,
      this.playerY,
      this.playerZ,
      destination,
      this.skyTaxi
    );
    this.audio.playStationChime();
    this.showNotice(this.skyTaxi.statusMessage);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public cancelSkyTaxi(): void {
    if (this.skyTaxi.playerOnboard) {
      this.disembarkSkyTaxi();
    }
    this.skyTaxi = cancelSkyTaxi(this.skyTaxi);
    this.showNotice('Sky Explorer Taxi returned to scheduled aerial route');
    this.emitHudSnapshot();
  }

  public boardSkyTaxiNow(): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave(this.lastCaveEntranceId);
    }
    if (this.skyTaxi.phase === 'en_route_pickup') {
      this.skyTaxi = {
        ...this.skyTaxi,
        x: this.skyTaxi.pickupX,
        y: this.skyTaxi.pickupY,
        z: this.skyTaxi.pickupZ,
        phase: 'arrived_pickup',
      };
    }
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.boatFpvMode = false;
    this.transportMode = 'walk';
    if (this.icelandState.isGiant) {
      this.icelandState = {
        ...this.icelandState,
        sizeMode: 'small',
        stayGiantThroughout: false,
        playerScale: 1,
        targetScale: 1,
        isGiant: false,
        playerHeightMeters: 1.68,
      };
    }
    this.skyTaxi = boardSkyTaxi(this.skyTaxi);
    this.playerX = this.skyTaxi.x;
    this.playerY = this.skyTaxi.y;
    this.playerZ = this.skyTaxi.z;
    this.playerHeading = this.skyTaxi.heading;
    this.camYaw = this.skyTaxi.heading + Math.PI;
    this.camPitch = 0.24;
    this.audio.playStationChime();
    this.showNotice(this.skyTaxi.statusMessage);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  private disembarkSkyTaxi(): void {
    const dropX = this.skyTaxi.x + Math.cos(this.skyTaxi.heading) * 3.0;
    const dropZ = this.skyTaxi.z - Math.sin(this.skyTaxi.heading) * 3.0;
    const safeY = walkableHeightWithFloor(dropX, dropZ, this.skyTaxi.y);
    this.skyTaxi = {
      ...this.skyTaxi,
      playerOnboard: false,
      phase: 'patrol_cruising',
      destination: null,
      statusMessage: 'Sky Explorer Taxi resumed scheduled aerial route',
    };
    this.playerX = dropX;
    this.playerZ = dropZ;
    this.playerY = safeY;
    this.isSwimming = isSwimmableWaterAt(dropX, dropZ) && safeY <= WATER_LEVEL + 0.25;
    this.companionState.x = dropX - 1.4;
    this.companionState.z = dropZ + 0.8;
    this.companionState.y = this.isSwimming ? WATER_LEVEL + 0.04 : safeY;
    this.companionState.activity = 'idle';
    this.audio.playDoorChime();
    this.showNotice('Stepped off the SSJ Tropical Sky Explorer Air Taxi');
    this.snapThirdPersonCamera();
    this.emitHudSnapshot();
  }

  public focusExhibitionVehicle(id: ExhibitionVehicleId): void {
    this.exhibitionInspectTargetId = id;
    const entry = getExhibitionVehicleById(id);
    if (entry) {
      this.camYaw = entry.displayPos.heading + 0.65;
      this.camPitch = 0.22;
      this.showNotice(`Inspecting ${entry.name} · Drag mouse to orbit 360°`);
    }
    this.renderImmediate();
  }

  public clearExhibitionInspectFocus(): void {
    this.exhibitionInspectTargetId = null;
  }

  private placeExhibitionVehicleForTest(id: ExhibitionVehicleId, boardNow: boolean): void {
    const entry = getExhibitionVehicleById(id);
    if (!entry) return;
    if (this.exhibitionTestVehicleId && this.exhibitionTestVehicleId !== id) {
      this.exhibitionComplexWorld.setVehicleDisplayStatus(this.exhibitionTestVehicleId, true);
    }
    this.exhibitionTestVehicleId = id;
    this.exhibitionComplexWorld.setVehicleDisplayStatus(id, false);
    this.clearExhibitionInspectFocus();

    const cx = EXHIBITION_LAND_CIRCUIT_CENTER.x;
    const cz = EXHIBITION_LAND_CIRCUIT_CENTER.z;
    const hx = EXHIBITION_HELIPAD_POS.x;
    const hy = EXHIBITION_HELIPAD_POS.y;
    const hz = EXHIBITION_HELIPAD_POS.z;

    if (id === 'sky_explorer') {
      this.skyExplorerState = {
        ...createInitialSkyExplorerState(),
        x: hx,
        y: hy + 1.55,
        z: hz,
        heading: Math.PI * 0.5,
      };
      if (boardNow) {
        this.boardSkyExplorer();
      } else {
        this.teleportTo(hx - 4.5, hz, 'Exhibition Aviation Helipad · SSJ Sky Explorer Ready');
      }
      return;
    }

    if (id === 'olga_camper') {
      this.camperState = {
        ...this.camperState,
        x: cx,
        z: cz,
        heading: Math.PI * 0.5,
        speed: 0,
        speedKmh: 0,
      };
      if (boardNow) {
        this.boardCamperVan();
      } else {
        this.teleportTo(cx - 4.2, cz - 3.5, 'Exhibition Driving Track · Olga Camper Spawned');
      }
      return;
    }

    if (id === 'safari_car') {
      this.dinosaurIslandState = {
        ...this.dinosaurIslandState,
        safariCar: {
          ...this.dinosaurIslandState.safariCar,
          x: cx,
          z: cz,
          heading: Math.PI * 0.5,
          speed: 0,
          speedKmh: 0,
        },
      };
      if (boardNow) {
        this.toggleSafariCar();
      } else {
        this.teleportTo(cx - 4.2, cz - 3.5, 'Exhibition Driving Track · Safari 4x4 Spawned');
      }
      return;
    }

    if (id === 'rural_bus') {
      this.busState = {
        ...this.busState,
        worldX: cx,
        worldZ: cz,
        heading: Math.PI * 0.5,
        speed: 0,
        speedKmh: 0,
        phase: 'stopped',
        doorOpen: 1,
      };
      if (boardNow) {
        this.activeVehicle = 'bus';
        this.busDriverMode = true;
        this.trainViewMode = 'exterior';
        this.playerX = cx;
        this.playerZ = cz;
        this.playerY = walkableHeightAt(cx, cz) + 1.4;
        this.showNotice('Testing Dreamline Rural Bus on Exhibition Circuit · WASD to Drive · E to Exit');
        this.renderImmediate();
        this.emitHudSnapshot();
      } else {
        this.teleportTo(cx - 5.2, cz - 4.0, 'Exhibition Driving Track · Rural Bus Ready');
      }
      return;
    }

    if (id === 'dreamline_train') {
      const exStationIdx = STATIONS.findIndex((s) => s.id === 'exhibition_complex_station');
      const targetIdx = exStationIdx >= 0 ? exStationIdx : 0;
      const st = STATIONS[targetIdx];
      this.trainState = {
        ...this.trainState,
        t: st.splineT,
        worldX: st.worldX,
        worldZ: st.worldZ,
        heading: st.tangentAngle,
        speed: 0,
        speedKmh: 0,
        phase: 'stopped',
        doorOpen: 1,
        currentStationIndex: targetIdx,
      };
      if (boardNow) {
        this.activeVehicle = 'train';
        this.trainDriverMode = true;
        this.trainViewMode = 'driver';
        this.showNotice('Driving Dreamline Scenic Express from Ocean Exhibition Station · W/S Throttle · E Exit');
        this.renderImmediate();
        this.emitHudSnapshot();
      } else {
        this.teleportTo(st.platformX, st.platformZ, 'Ocean Exhibition Railway Station · Train Ready');
      }
      return;
    }

    if (id === 'commuter_bicycle' || id === 'cruiser_skateboard') {
      this.teleportTo(cx, cz, `Exhibition Driving Track · ${entry.name}`);
      this.setTransportMode(id === 'commuter_bicycle' ? 'bicycle' : 'skateboard');
      return;
    }

    // All 5 watercraft: Sovereign of the Tides, Bamboo Catamaran, Tribal Outrigger, Coastal Boat, Lake Boat
    const boatMap: Partial<Record<ExhibitionVehicleId, BoatId>> = {
      sovereign_ship: 'sovereign_ship',
      bamboo_catamaran: 'bamboo_catamaran',
      tribal_outrigger: 'tribal_outrigger',
      coastal_boat: 'coastal_boat',
      lake_boat: 'lake_boat',
    };
    const boatId = boatMap[id];
    if (boatId) {
      const bIdx = this.boats.findIndex((b) => b.id === boatId);
      if (bIdx >= 0) {
        if (this.boats[bIdx].waterZone === 'ocean') {
          this.boats[bIdx] = {
            ...this.boats[bIdx],
            x: 268,
            z: 240,
            heading: Math.PI * 0.5,
            speed: 0,
          };
        }
        if (boardNow) {
          this.boardBoatById(boatId);
        } else {
          this.teleportTo(256, 240, `Exhibition Marina Pier · ${entry.name} Ready to Sail`);
        }
      }
    }
  }

  public enterExhibitionVehicle(id: ExhibitionVehicleId): void {
    this.audio.unlock();
    this.placeExhibitionVehicleForTest(id, true);
  }

  public testExhibitionVehicle(id: ExhibitionVehicleId): void {
    this.audio.unlock();
    this.placeExhibitionVehicleForTest(id, true);
  }

  public spawnExhibitionVehicle(id: ExhibitionVehicleId): void {
    this.audio.unlock();
    this.placeExhibitionVehicleForTest(id, false);
  }

  public returnExhibitionVehicle(id: ExhibitionVehicleId): void {
    this.audio.unlock();
    this.exhibitionComplexWorld.setVehicleDisplayStatus(id, true);
    if (this.exhibitionTestVehicleId === id) {
      this.exhibitionTestVehicleId = null;
    }
    const entry = getExhibitionVehicleById(id);
    this.audio.playStationChime();
    this.showNotice(`Returned ${entry?.name ?? 'vehicle'} to its Exhibition Display Platform`);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public returnFromExhibitionTest(): void {
    this.audio.unlock();
    if (this.exhibitionTestVehicleId) {
      this.exhibitionComplexWorld.setVehicleDisplayStatus(this.exhibitionTestVehicleId, true);
      this.exhibitionTestVehicleId = null;
    }
    this.teleportTo(
      EXHIBITION_PLAZA_SPAWN.x,
      EXHIBITION_PLAZA_SPAWN.z,
      'Universal Mobility Exhibition · Grand Entrance Plaza'
    );
  }

  /**
   * Instant Mobile Phone Vehicle Catalogue Spawner — summons any car, bus, bike,
   * skateboard, ship, boat, aircraft, or train on demand at any time!
   */
  public spawnCatalogueVehicle(vehicleId: CatalogueVehicleId, boardNow = true): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave();
    }
    const entry = getCatalogueVehicleById(vehicleId);
    const spawn = computeCatalogueSpawnPoint(
      vehicleId,
      this.playerX,
      this.playerZ,
      this.playerHeading
    );

    if (vehicleId === 'commuter_bicycle' || vehicleId === 'cruiser_skateboard') {
      if (this.activeVehicle !== 'none') {
        this.activeVehicle = 'none';
        this.activeBoatId = null;
      }
      this.setTransportMode(vehicleId === 'commuter_bicycle' ? 'bicycle' : 'skateboard');
      this.audio.playBicycleBell();
      this.showNotice(`${entry.name} summoned! WASD / Joystick to ride`);
      this.renderImmediate();
      this.emitHudSnapshot();
      return;
    }

    if (vehicleId === 'batmobile') {
      this.batmobileState = {
        ...this.batmobileState,
        x: spawn.x,
        y: this.homeVaultState.inVault ? VAULT_FLOOR_Y : walkableHeightAt(spawn.x, spawn.z),
        z: spawn.z,
        heading: spawn.heading,
        speed: 0,
        speedKmh: 0,
        inVault: this.homeVaultState.inVault,
      };
      this.batmobileWorld.group.visible = true;
      if (boardNow) {
        this.boardBatmobile();
      } else {
        this.audio.playStationChime();
        this.showNotice('Armoured Batmobile summoned ahead! Press E beside it to drive');
        this.renderImmediate();
        this.emitHudSnapshot();
      }
      return;
    }

    if (vehicleId === 'camper_van') {
      this.camperState = {
        ...this.camperState,
        x: spawn.x,
        z: spawn.z,
        heading: spawn.heading,
        speed: 0,
        speedKmh: 0,
      };
      if (boardNow) {
        this.boardCamperVan();
      } else {
        this.audio.playStationChime();
        this.showNotice(`Spawned ${entry.name} right beside you! Walk over & press E to drive`);
        this.renderImmediate();
        this.emitHudSnapshot();
      }
      return;
    }

    if (vehicleId === 'safari_car') {
      this.dinosaurIslandState = {
        ...this.dinosaurIslandState,
        safariCar: {
          ...this.dinosaurIslandState.safariCar,
          x: spawn.x,
          z: spawn.z,
          heading: spawn.heading,
          speed: 0,
          speedKmh: 0,
        },
      };
      if (boardNow) {
        this.activeVehicle = 'safari_car';
        this.activeBoatId = null;
        this.isSitting = false;
        this.isSwimming = false;
        this.playerX = spawn.x;
        this.playerZ = spawn.z;
        this.playerY = walkableHeightAt(spawn.x, spawn.z) + 0.65;
        this.playerHeading = spawn.heading;
        this.audio.playStationChime();
        this.showNotice(`Driving ${entry.name}! WASD / Joystick to drive · E to exit`);
        this.renderImmediate();
        this.emitHudSnapshot();
      } else {
        this.audio.playStationChime();
        this.showNotice(`Spawned ${entry.name} right ahead of you! Press E beside it to drive`);
        this.renderImmediate();
        this.emitHudSnapshot();
      }
      return;
    }

    if (vehicleId === 'rural_bus') {
      this.busDispatch = createInitialBusDispatchState();
      this.busState = {
        ...this.busState,
        worldX: spawn.x,
        worldZ: spawn.z,
        heading: spawn.heading,
        speed: 0,
        speedKmh: 0,
        phase: 'stopped',
        doorOpen: 1,
      };
      this.vehiclesWorld.syncBus(this.busState, this.elapsed, 0.5);
      if (boardNow) {
        this.activeVehicle = 'bus';
        this.activeBoatId = null;
        this.busDriverMode = true;
        this.trainViewMode = 'exterior';
        this.isSitting = false;
        this.isSwimming = false;
        this.playerX = spawn.x;
        this.playerZ = spawn.z;
        this.playerY = walkableHeightAt(spawn.x, spawn.z) + 1.4;
        this.playerHeading = spawn.heading;
        this.audio.playStationChime();
        this.showNotice(`Driving ${entry.name}! WASD to drive · Space brake · E to exit`);
        this.renderImmediate();
        this.emitHudSnapshot();
      } else {
        this.audio.playStationChime();
        this.showNotice(`Spawned ${entry.name} right beside you! Press E to board`);
        this.renderImmediate();
        this.emitHudSnapshot();
      }
      return;
    }

    if (vehicleId === 'sky_explorer') {
      const groundY = walkableHeightWithFloor(spawn.x, spawn.z, this.playerY);
      this.skyExplorerState = {
        ...this.skyExplorerState,
        x: spawn.x,
        y: groundY + 1.4,
        z: spawn.z,
        heading: spawn.heading,
        forwardSpeed: 0,
        verticalSpeed: 0,
        yawRate: 0,
        roll: 0,
        pitch: 0,
        speedKmh: 0,
        altitudeM: 1.4,
        boostActive: false,
      };
      this.skyExplorerWorld.sync(this.skyExplorerState, this.elapsed, boardNow);
      if (boardNow) {
        this.activeVehicle = 'sky_explorer';
        this.activeBoatId = null;
        this.isSitting = false;
        this.isSwimming = false;
        this.playerX = spawn.x;
        this.playerY = groundY + 1.4;
        this.playerZ = spawn.z;
        this.playerHeading = spawn.heading;
        this.camYaw = spawn.heading + Math.PI;
        this.camPitch = 0.24;
        this.audio.playStationChime();
        this.showNotice(`Flying ${entry.name}! W/S Fly · A/D Turn · Space Ascend · Q Descend · E Exit`);
        this.renderImmediate();
        this.emitHudSnapshot();
      } else {
        this.audio.playStationChime();
        this.showNotice(`Spawned ${entry.name} right beside you! Press E to take off`);
        this.renderImmediate();
        this.emitHudSnapshot();
      }
      return;
    }

    if (vehicleId === 'dreamline_train') {
      const nearestIdx = findNearbyStationIndex(this.playerX, this.playerZ, 999) ?? 0;
      const st = STATIONS[nearestIdx];
      this.trainState = {
        ...this.trainState,
        t: st.splineT,
        worldX: st.worldX,
        worldZ: st.worldZ,
        heading: st.tangentAngle,
        speed: 0,
        speedKmh: 0,
        phase: 'stopped',
        doorOpen: 1,
        currentStationIndex: nearestIdx,
      };
      this.trainRig.update(this.trainState, 0.016, 0.5);
      if (boardNow) {
        this.activeVehicle = 'train';
        this.activeBoatId = null;
        this.trainDriverMode = true;
        this.trainViewMode = 'driver';
        this.isSitting = false;
        this.isSwimming = false;
        this.playerX = st.worldX;
        this.playerZ = st.worldZ;
        this.playerY = walkableHeightAt(st.worldX, st.worldZ) + 1.5;
        this.playerHeading = st.tangentAngle;
        this.trainRig.getDriverCabTransform(_seatPos, _seatLook);
        this.camera.position.copy(_seatPos);
        _camCurrentLook.copy(_seatLook);
        this.camera.lookAt(_camCurrentLook);
        this.triggerStationAnnouncement(nearestIdx, 'arrived');
        this.showNotice(`Driving ${entry.name} from ${st.name}! W/S Throttle · Space Brake · E Exit`);
        this.renderImmediate();
        this.emitHudSnapshot();
      } else {
        this.teleportTo(st.platformX, st.platformZ, `${st.name} · Train Ready on Platform`);
        this.triggerStationAnnouncement(nearestIdx, 'arrived');
      }
      return;
    }

    // All 5 Ships & Boats (Sovereign of the Tides, Catamaran, Outrigger, Coastal Boat, Lake Rowboat)
    if (entry.boatId) {
      const bIdx = this.boats.findIndex((b) => b.id === entry.boatId);
      if (bIdx >= 0) {
        this.boats[bIdx] = {
          ...this.boats[bIdx],
          x: spawn.x,
          z: spawn.z,
          heading: spawn.heading,
          speed: 0,
        };
        this.vehiclesWorld.syncBoats(this.boats, this.elapsed);
      }
      if (boardNow) {
        this.boardBoatById(entry.boatId);
      } else {
        const pierX = entry.boatId === 'lake_boat' ? 31.5 : 118.5;
        const pierZ = entry.boatId === 'lake_boat' ? -11.5 : 48.6;
        this.teleportTo(pierX, pierZ, `${entry.name} Moored Right Beside the Pier! Press E to Sail`);
      }
    }
  }

  private triggerStationAnnouncement(
    stationIndex: number,
    eventKind: StationAnnouncementEventKind
  ): void {
    const nextIdx = this.trainState.nextStationIndex ?? (stationIndex + 1) % STATIONS.length;
    const announcement = generateStationAnnouncement({
      stationIndex,
      eventKind,
      timeHours: this.timeHours,
      weather: this.weather,
      nextStationIndex: nextIdx,
      seed: this.announcementSeq++,
    });
    this.activeStationAnnouncement = announcement;
    this.stationAnnouncementTimer = 7.8;
    this.audio.playStationAnnouncement(announcement);
  }

  public setTrainDriverMode(enabled: boolean): void {
    this.audio.unlock();
    if (this.activeVehicle !== 'train') return;
    this.trainDriverMode = enabled;
    this.trainManualBrake = false;
    if (enabled) {
      this.trainViewMode = 'driver';
      this.trainState = { ...this.trainState, dwellHold: false };
      this.audio.playDistantTrainHorn(0.85);
      this.showNotice('Train Driver Mode ON · W/S or Joystick Throttle · Space Brake · Horn [H] · Doors [O]');
    } else {
      this.trainManualDoors = false;
      if (this.trainViewMode === 'driver') {
        this.trainViewMode = 'window';
      }
      this.showNotice('Train Auto Pilot resumed · Relax by the panoramic window');
    }
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleTrainManualDoors(): void {
    if (this.activeVehicle !== 'train') return;
    this.trainManualDoors = !this.trainManualDoors;
    this.audio.playDoorChime();
    this.showNotice(this.trainManualDoors ? 'Train doors opening' : 'Train doors closing');
    this.emitHudSnapshot();
  }

  public soundTrainHorn(): void {
    this.audio.unlock();
    this.audio.playDistantTrainHorn(1.0);
    this.showNotice('Train Horn! Whoo-whoo! ♪');
  }

  public setTrainManualBrake(active: boolean): void {
    this.trainManualBrake = active;
  }

  public setBusDriverMode(enabled: boolean): void {
    this.audio.unlock();
    if (this.activeVehicle !== 'bus') return;
    this.busDriverMode = enabled;
    if (enabled) {
      this.busDispatch = createInitialBusDispatchState();
      this.trainViewMode = 'driver';
      this.audio.playStationChime();
      this.showNotice('Bus Driver Mode ON · WASD / Joystick to drive freely · Space Brake · Horn [H] · Doors [O]');
    } else {
      this.busManualDoors = false;
      if (this.trainViewMode === 'driver') {
        this.trainViewMode = 'window';
      }
      this.showNotice('Bus Auto Pilot resumed');
    }
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleBusManualDoors(): void {
    if (this.activeVehicle !== 'bus') return;
    this.busManualDoors = !this.busManualDoors;
    this.audio.playDoorChime();
    this.showNotice(this.busManualDoors ? 'Bus door opened' : 'Bus door closed');
    this.emitHudSnapshot();
  }

  public soundBusHorn(): void {
    this.audio.unlock();
    this.audio.playStationChime();
    this.showNotice('Bus Horn! Honk-honk! ♪');
  }

  public enterUndergroundCave(entranceId?: string): void {
    this.audio.unlock();
    const entrance =
      CAVE_ENTRANCES.find((e) => e.id === entranceId) ?? CAVE_ENTRANCES[0];
    this.lastCaveEntranceId = entrance.id;
    this.inUndergroundCave = true;
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.boatFpvMode = false;
    this.transportMode = 'walk';
    // Always explore the glowing Underground Caves at crisp human scale (1.68m) so camera stays inside the crystal vaults!
    this.icelandState = {
      ...this.icelandState,
      inIceland: false,
      playerScale: 1.0,
      targetScale: 1.0,
      isGiant: false,
      transformProgress: 0,
      playerHeightMeters: 1.68,
    };
    this.playerX = entrance.caveX;
    this.playerZ = entrance.caveZ - 4.0;
    this.playerY = getCaveFloorHeightAt(this.playerX, this.playerZ);
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerHeading = Math.PI;
    this.camYaw = 0;
    this.camPitch = 0.14;
    this.camDistance = 5.4;

    // Place Frosty beside the player inside the glowing cavern
    this.companionState.x = this.playerX - 1.6;
    this.companionState.z = this.playerZ + 1.2;
    this.companionState.y = getCaveFloorHeightAt(this.companionState.x, this.companionState.z);
    this.companionState.activity = 'idle';

    // Hide surface sky/terrain and reveal the 6-area 3D Underground Cave World!
    this.skyWater.group.visible = false;
    this.nature.group.visible = false;
    this.architecture.group.visible = false;
    this.personalHome.group.visible = false;
    this.regionsWorld.group.visible = false;
    this.avsSnowHouse.group.visible = false;
    this.frozenKingdom.surfaceGroup.visible = false;
    this.skyExplorerWorld.group.visible = false;
    this.skyTaxiWorld.group.visible = false;
    this.exhibitionComplexWorld.group.visible = false;
    this.desertOasisWorld.group.visible = false;
    this.wildlifeWorld.group.visible = false;
    this.birdFlockingWorld.group.visible = false;
    this.batmobileWorld.group.visible = false;
    this.homeVaultWorld.chamberGroup.visible = false;
    this.homeVaultWorld.carsGroup.visible = false;
    this.homeVaultState = { ...this.homeVaultState, inVault: false, activeVaultCarId: null };
    this.container.dataset.inHomeVault = 'false';
    this.airportMetroWorld.surfaceGroup.visible = false;
    this.airportMetroWorld.undergroundGroup.visible = false;
    this.airportMetroWorld.airlinerGroup.visible = false;
    this.inUndergroundMetro = false;
    this.frozenKingdom.caveGroup.visible = true;
    this.scene.background = new THREE.Color(0x0f2438);

    const area = getCaveChamberAt(this.playerX, this.playerZ);
    this.audio.playIcelandTransform(true);
    this.showNotice(`Entered ${area.name} (${area.tamilName}) · Explore all 6 glowing chambers freely!`);
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public exitUndergroundCave(entranceId?: string): void {
    if (!this.inUndergroundCave) return;
    this.audio.unlock();
    const entrance =
      CAVE_ENTRANCES.find((e) => e.id === (entranceId || this.lastCaveEntranceId)) ??
      CAVE_ENTRANCES[0];
    this.inUndergroundCave = false;

    this.setSurfaceGroupsVisible(true);
    this.frozenKingdom.caveGroup.visible = false;
    this.scene.background = null;

    this.playerX = entrance.surfaceX;
    this.playerZ = entrance.surfaceZ + 5.2;
    this.playerY = walkableHeightAt(this.playerX, this.playerZ);
    this.playerVx = 0;
    this.playerVz = 0;
    this.companionState.x = this.playerX - 1.5;
    this.companionState.z = this.playerZ + 1.0;
    this.companionState.y = walkableHeightAt(this.companionState.x, this.companionState.z);
    this.audio.playStationChime();
    this.showNotice(`Emerged into the Frozen Kingdom at ${entrance.name}`);
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  private setSurfaceGroupsVisible(visible: boolean): void {
    this.skyWater.group.visible = visible;
    this.nature.group.visible = visible;
    this.architecture.group.visible = visible;
    this.personalHome.group.visible = visible;
    this.regionsWorld.group.visible = visible;
    this.avsSnowHouse.group.visible = visible;
    this.frozenKingdom.surfaceGroup.visible = visible;
    this.skyExplorerWorld.group.visible = visible;
    this.skyTaxiWorld.group.visible = visible;
    this.exhibitionComplexWorld.group.visible = visible;
    this.desertOasisWorld.group.visible = visible;
    this.wildlifeWorld.group.visible = visible;
    this.birdFlockingWorld.group.visible = visible;
    this.batmobileWorld.group.visible =
      visible ? !this.batmobileState.inVault : this.homeVaultState.inVault && Boolean(this.batmobileState.inVault);
    this.homeVaultWorld.carsGroup.visible = visible || this.homeVaultState.inVault;
    this.airportMetroWorld.surfaceGroup.visible = visible;
    this.airportMetroWorld.airlinerGroup.visible = visible;
  }

  public toggleHomeSecretVaultHatch(): void {
    this.audio.unlock();
    this.homeVaultState = toggleSecretVaultHatch(this.homeVaultState);
    this.container.dataset.vaultHatchOpen = String(this.homeVaultState.hatchUnlocked);
    this.audio.playDoorChime();
    this.showNotice(
      this.homeVaultState.hatchUnlocked
        ? 'Secret Floor Hatch Opened! Step onto the glowing shaft or click "Go Down to Secret Vault"!'
        : 'Secret Floor Hatch Sealed — Hidden flush beneath the En Illam floor.'
    );
    this.personalHome.applyHomeState(
      this.homeState,
      0.7,
      this.elapsed,
      this.homeVaultState.hatchUnlocked ? 1 : 0
    );
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public openHomeSecretTunnelFromPhone(): void {
    this.audio.unlock();
    if (this.homeVaultState.inVault) {
      this.homeVaultState = { ...this.homeVaultState, hatchUnlocked: true, hatchOpenProgress: 1 };
      this.exitHomeSecretVault();
      return;
    }

    const insideHome = isPlayerInsidePersonalHome(
      this.playerX,
      this.playerY,
      this.playerZ,
      false
    );
    if (!insideHome) {
      this.teleportTo(HOME_CENTER.x, HOME_CENTER.z + 4.0);
      this.homeVaultState = {
        ...this.homeVaultState,
        hatchUnlocked: true,
        hatchOpenProgress: 0.25,
      };
      this.container.dataset.vaultHatchOpen = 'true';
      this.audio.playDoorChime();
      this.personalHome.applyHomeState(this.homeState, 0.7, this.elapsed, 1);
      this.showNotice(
        'House Secret Superhero Tunnel Opened! Walk into the glowing shaft or tap "Go Down to Secret Vault"!'
      );
      this.renderImmediate();
      this.emitHudSnapshot();
      return;
    }

    this.toggleHomeSecretVaultHatch();
  }

  public enterHomeSecretVault(): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.inUndergroundCave = false;
      this.frozenKingdom.caveGroup.visible = false;
    }
    if (this.inUndergroundMetro) {
      this.inUndergroundMetro = false;
      this.airportMetroWorld.undergroundGroup.visible = false;
    }
    this.homeVaultState = {
      ...this.homeVaultState,
      hatchUnlocked: true,
      hatchOpenProgress: 1,
      inVault: true,
      activeVaultCarId: null,
    };
    this.isSitting = false;
    this.isSwimming = false;
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.parachuteState = createInitialParachuteState();
    this.heroState.isFlying = false;
    this.heroState.isGliding = false;
    this.heroState.isWebSwinging = false;
    this.webSwingState.active = false;

    this.setSurfaceGroupsVisible(false);
    this.homeVaultWorld.chamberGroup.visible = true;
    this.homeVaultWorld.carsGroup.visible = true;
    this.batmobileWorld.group.visible = Boolean(this.batmobileState.inVault);
    this.scene.background = new THREE.Color(0x0b1220);

    this.playerX = VAULT_SPAWN_POS.x;
    this.playerY = VAULT_SPAWN_POS.y;
    this.playerZ = VAULT_SPAWN_POS.z;
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerHeading = VAULT_SPAWN_POS.heading;
    this.camYaw = 0;
    this.camPitch = 0.22;
    this.camDistance = 5.4;

    this.companionState.x = VAULT_SPAWN_POS.x - 2.2;
    this.companionState.y = VAULT_FLOOR_Y;
    this.companionState.z = VAULT_SPAWN_POS.z + 0.8;
    this.companionState.activity = 'idle';

    this.container.dataset.inHomeVault = 'true';
    this.container.dataset.vaultHatchOpen = 'true';
    this.container.dataset.activeVaultCar = 'none';

    this.homeVaultWorld.update({
      inVault: true,
      activeHeroId: this.heroState.activeHeroId,
      cars: this.homeVaultState.cars,
      elapsed: this.elapsed,
      dt: 0.016,
    });
    this.batmobileWorld.update(this.batmobileState, this.elapsed, 0.9);
    this.audio.playStationChime();
    this.showNotice(
      'Entered Secret Underground Superhero Vault & Car Garage! Wear all 7 Hero Costumes or drive any car!'
    );
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public exitHomeSecretVault(): void {
    if (!this.homeVaultState.inVault) return;
    this.audio.unlock();
    this.homeVaultState = {
      ...this.homeVaultState,
      inVault: false,
      activeVaultCarId: null,
    };
    this.activeVehicle = 'none';
    this.homeVaultWorld.chamberGroup.visible = false;
    this.setSurfaceGroupsVisible(true);
    this.scene.background = null;

    this.playerX = VAULT_HATCH_WORLD.x + 1.4;
    this.playerZ = VAULT_HATCH_WORLD.z;
    this.playerY = walkableHeightWithFloor(this.playerX, this.playerZ, 0.5);
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerHeading = 0;
    this.camYaw = Math.PI;
    this.camPitch = 0.2;
    this.camDistance = 3.2;

    this.companionState.x = this.playerX - 1.2;
    this.companionState.z = this.playerZ + 0.8;
    this.companionState.y = this.playerY;
    this.companionState.activity = 'idle';

    this.container.dataset.inHomeVault = 'false';
    this.container.dataset.activeVaultCar = 'none';
    this.audio.playDoorChime();
    this.showNotice('Returned upstairs to En Illam Living Room!');
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public boardVaultCar(carId: VaultCarId): void {
    const car = this.homeVaultState.cars.find((c) => c.id === carId);
    if (!car) return;
    this.audio.unlock();
    const spec = getVaultCarSpec(carId);
    this.activeVehicle = 'vault_car';
    this.activeBoatId = null;
    this.isSitting = false;
    this.isSwimming = false;
    this.heroState.isFlying = false;
    this.heroState.isGliding = false;
    this.heroState.isWebSwinging = false;
    this.webSwingState.active = false;
    this.homeVaultState = {
      ...this.homeVaultState,
      activeVaultCarId: carId,
    };
    this.playerX = car.x;
    this.playerY = car.y + 0.85;
    this.playerZ = car.z;
    this.playerHeading = car.heading;
    this.camYaw = car.heading + Math.PI;
    this.camPitch = 0.2;
    this.container.dataset.activeVaultCar = carId;
    this.audio.playRepulsorBlast();
    this.showNotice(
      `Driving ${spec.name}! WASD to drive · Shift Turbo Boost · Drive through East Exit Tunnel to hit the open road · [E] Exit`
    );
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public exitVaultCar(): void {
    if (this.activeVehicle !== 'vault_car' || !this.homeVaultState.activeVaultCarId) return;
    const car = this.homeVaultState.cars.find((c) => c.id === this.homeVaultState.activeVaultCarId);
    this.activeVehicle = 'none';
    this.homeVaultState = {
      ...this.homeVaultState,
      activeVaultCarId: null,
      cars: this.homeVaultState.cars.map((c) =>
        c.id === this.homeVaultState.activeVaultCarId
          ? { ...c, speed: 0, speedKmh: 0, boostActive: false }
          : c
      ),
    };
    if (car) {
      const sideX = car.x - Math.cos(car.heading) * 2.4;
      const sideZ = car.z + Math.sin(car.heading) * 2.4;
      if (car.inVault) {
        const clamped = clampVaultPosition(sideX, sideZ, 1.4);
        this.playerX = clamped.x;
        this.playerZ = clamped.z;
        this.playerY = VAULT_FLOOR_Y;
      } else {
        this.playerX = sideX;
        this.playerZ = sideZ;
        this.playerY = walkableHeightAt(sideX, sideZ);
      }
      this.companionState.x = this.playerX - 1.2;
      this.companionState.z = this.playerZ + 0.8;
      this.companionState.y = this.playerY;
      this.companionState.activity = 'idle';
    }
    this.container.dataset.activeVaultCar = 'none';
    this.audio.playDoorChime();
    this.showNotice('Parked Vault Car · Press [E] beside any car to drive again!');
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleVaultCarLights(): void {
    if (!this.homeVaultState.activeVaultCarId) return;
    const id = this.homeVaultState.activeVaultCarId;
    this.homeVaultState = {
      ...this.homeVaultState,
      cars: this.homeVaultState.cars.map((c) =>
        c.id === id ? { ...c, headlightsOn: !c.headlightsOn } : c
      ),
    };
    this.emitHudSnapshot();
  }

  public enterUndergroundMetro(stationId?: MetroStationId | string): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.inUndergroundCave = false;
      this.frozenKingdom.caveGroup.visible = false;
    }
    if (this.homeVaultState.inVault) {
      this.homeVaultState = { ...this.homeVaultState, inVault: false, activeVaultCarId: null };
      this.homeVaultWorld.chamberGroup.visible = false;
      this.container.dataset.inHomeVault = 'false';
    }
    const station = getMetroStationById(stationId);
    this.metroStationId = station.id;
    this.inUndergroundMetro = true;
    this.isSitting = false;
    this.isSwimming = false;
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.parachuteState = createInitialParachuteState();
    this.heroState.isFlying = false;
    this.heroState.isGliding = false;
    this.heroState.isWebSwinging = false;
    this.webSwingState.active = false;
    this.subwayState = createInitialSubwayTrainState();
    this.subwayRidingTo = null;
    this.subwayRideTimer = 0;

    this.setSurfaceGroupsVisible(false);
    this.airportMetroWorld.setUndergroundStationVisual(station.id);
    this.airportMetroWorld.undergroundGroup.visible = true;
    this.scene.background = new THREE.Color(0x0b1322);

    this.playerX = -2.2;
    this.playerZ = -1.4;
    this.playerY = METRO_FLOOR_Y;
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerHeading = Math.PI - 0.22;
    this.camYaw = 0.24;
    this.camPitch = 0.14;
    this.camDistance = 4.8;

    this.companionState.x = -4.0;
    this.companionState.z = -0.6;
    this.companionState.y = METRO_FLOOR_Y;
    this.companionState.activity = 'idle';

    this.audio.playStationChime();
    this.showNotice(`Entered ${station.name} (Line M1 Underground) · Board the Subway or explore the Mezzanine!`);
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public exitUndergroundMetro(): void {
    if (!this.inUndergroundMetro) return;
    this.audio.unlock();
    const resolvedId = this.subwayTargetStationId ?? this.metroStationId;
    const station = getMetroStationById(resolvedId);
    this.metroStationId = station.id;
    this.subwayTargetStationId = null;
    this.inUndergroundMetro = false;
    this.subwayRidingTo = null;
    this.subwayRideTimer = 0;
    this.airportMetroWorld.undergroundGroup.visible = false;
    this.setSurfaceGroupsVisible(true);
    this.scene.background = null;

    this.playerX = station.surfaceX;
    this.playerZ = station.surfaceZ + 5.2;
    this.playerY = walkableHeightAt(this.playerX, this.playerZ);
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerHeading = station.exitFacingAngle;
    this.camYaw = station.exitFacingAngle + Math.PI;
    this.camPitch = 0.15;

    this.companionState.x = this.playerX - 1.6;
    this.companionState.z = this.playerZ + 1.0;
    this.companionState.y = walkableHeightAt(this.companionState.x, this.companionState.z);
    this.audio.playStationChime();
    this.showNotice(`Exited Underground Metro to ${station.districtLabel}`);
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public rideUndergroundMetroTo(targetStationId?: MetroStationId): void {
    if (!this.inUndergroundMetro) {
      this.enterUndergroundMetro(targetStationId ?? 'metro_central');
      return;
    }
    this.audio.unlock();
    const ids = METRO_SURFACE_ENTRANCES.map((s) => s.id);
    const curIdx = ids.indexOf(this.metroStationId);
    const nextId =
      targetStationId && targetStationId !== this.metroStationId
        ? targetStationId
        : ids[(curIdx + 1) % ids.length];
    const target = getMetroStationById(nextId);
    this.metroStationId = target.id;
    this.subwayTargetStationId = target.id;
    this.subwayRidingTo = target.name;
    this.subwayRideTimer = 0.75;
    this.airportMetroWorld.setUndergroundStationVisual(target.id);
    this.subwayState = {
      ...this.subwayState,
      phase: 'departing',
      doorOpen: 0,
      statusLabel: `Express → ${target.name}`,
    };
    this.audio.playDoorChime();
    this.audio.playStationChime();
    this.showNotice(`M1 Underground Express arriving at ${target.name}!`);
    this.emitHudSnapshot();
  }

  public boardAirliner(teleportToAirport = false): void {
    this.audio.unlock();
    if (this.inUndergroundCave) this.exitUndergroundCave();
    if (this.inUndergroundMetro) this.exitUndergroundMetro();
    if (teleportToAirport) {
      this.airlinerState = createInitialAirlinerState();
    }
    this.activeVehicle = 'airliner';
    this.activeBoatId = null;
    this.isSitting = false;
    this.isSwimming = false;
    this.parachuteState = createInitialParachuteState();
    this.heroState.isFlying = false;
    this.heroState.isGliding = false;
    this.heroState.isWebSwinging = false;
    this.webSwingState.active = false;
    this.playerX = this.airlinerState.x;
    this.playerY = this.airlinerState.y + 2.4;
    this.playerZ = this.airlinerState.z;
    this.playerHeading = this.airlinerState.heading;
    this.camYaw = this.airlinerState.heading + Math.PI;
    this.camPitch = 0.2;
    this.audio.playStationChime();
    this.showNotice(
      'Piloting DL-787 Dreamliner! Hold W + Shift to accelerate down Runway 09, Space to Take Off & Climb, G/Skydive to Parachute!'
    );
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public exitAirliner(withParachute = false): void {
    if (this.activeVehicle !== 'airliner') return;
    this.audio.unlock();
    const state = this.airlinerState;
    this.activeVehicle = 'none';
    if (withParachute || state.altitudeM >= 6) {
      this.playerX = state.x;
      this.playerZ = state.z;
      this.playerY = Math.max(walkableHeightAt(state.x, state.z) + 18, state.y);
      this.parachuteState = {
        ...createInitialParachuteState(),
        active: true,
        deployProgress: 0.2,
      };
      this.audio.playJump(0.95);
      this.showNotice('Skydiving from DL-787 Dreamliner! Parachute Deployed — Steer with WASD / Joystick');
    } else {
      const exit = getAirlinerExitPosition(state, walkableHeightAt);
      this.playerX = exit.x;
      this.playerY = exit.y;
      this.playerZ = exit.z;
      this.airlinerState = { ...state, speed: 0, speedKmh: 0, throttle: 0 };
      this.audio.playDoorChime();
      this.showNotice('Disembarked from DL-787 Dreamliner at the tarmac');
    }
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleParachute(): void {
    this.audio.unlock();
    if (this.inUndergroundCave || this.inUndergroundMetro) {
      this.showNotice('Parachute can only be deployed outdoors!');
      return;
    }
    if (this.activeVehicle === 'airliner') {
      this.exitAirliner(true);
      return;
    }
    if (this.activeVehicle !== 'none') return;

    if (this.parachuteState.active) {
      this.parachuteState = createInitialParachuteState();
      this.showNotice('Parachute folded');
      this.emitHudSnapshot();
      return;
    }

    const groundY = walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
    this.heroState.isFlying = false;
    this.heroState.isGliding = false;
    this.heroState.isWebSwinging = false;
    this.webSwingState.active = false;
    if (this.playerY < groundY + 4.0) {
      // Give a clean test-jump boost into the air so Parachute testing works anywhere outside Metro City!
      this.playerY = groundY + 24.0;
    }
    this.parachuteState = {
      ...createInitialParachuteState(),
      active: true,
      deployProgress: 0.15,
    };
    this.audio.playJump(0.92);
    this.showNotice('3D Parachute Deployed! Steer with WASD / Joystick · Press [G] to fold');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public launchFromParachuteTower(): void {
    this.audio.unlock();
    if (this.inUndergroundCave) this.exitUndergroundCave();
    if (this.inUndergroundMetro) this.exitUndergroundMetro();
    this.activeVehicle = 'none';
    this.isSitting = false;
    this.isSwimming = false;
    this.heroState.isFlying = false;
    this.playerX = PARACHUTE_TOWER_POS.x + 2.5;
    this.playerZ = PARACHUTE_TOWER_POS.z + 2.5;
    this.playerY = PARACHUTE_TOWER_POS.deckY + 6.0;
    this.playerHeading = Math.PI * 0.25;
    this.camYaw = this.playerHeading + Math.PI;
    this.camPitch = 0.22;
    this.parachuteState = {
      ...createInitialParachuteState(),
      active: true,
      deployProgress: 0.2,
    };
    this.audio.playJump(0.95);
    this.showNotice('Launched from Airport Parachute Jump Test Tower (28m)! Glide over the Airport & Infinite Ocean!');
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public teleportToMidnightFrontier(forceNight = true): void {
    this.audio.unlock();
    if (forceNight && !isMidnightFrontierOpen(this.timeHours)) {
      this.timeHours = 22.5;
    }
    this.midnightPortalCooldown = 4.0;
    this.teleportTo(
      MIDNIGHT_FRONTIER_PORTAL_POS.x,
      MIDNIGHT_FRONTIER_PORTAL_POS.z + 7.5,
      'The Midnight Frontier Night Portal'
    );
    this.playerHeading = Math.PI;
    this.camYaw = 0;
    this.camPitch = 0.14;
    this.showNotice(
      'Arrived at The Midnight Frontier Glowing Portal! Walk straight into the glowing gate (or press E) to enter the game!'
    );
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public applyAiTrainRoute(
    selectedIntermediateIndices: number[],
    destinationIndex: number
  ): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave(this.lastCaveEntranceId);
    }
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'train';
    this.trainDriverMode = false;
    this.trainViewMode = 'window';
    this.confirmTrainRoute(selectedIntermediateIndices, destinationIndex);
  }

  public toggleTrainViewMode(): void {
    if (this.activeVehicle === 'bus') {
      const order: TrainViewMode[] = ['window', 'driver', 'exterior'];
      const nextIdx = (order.indexOf(this.trainViewMode) + 1) % order.length;
      const nextView = order[nextIdx];
      this.trainViewMode = nextView;
      if (nextView === 'driver') {
        this.setBusDriverMode(true);
        return;
      }
    } else if (this.activeVehicle === 'camper') {
      const order: TrainViewMode[] = ['exterior', 'window', 'cabin'];
      const nextIdx = (order.indexOf(this.trainViewMode) + 1) % order.length;
      this.trainViewMode = order[nextIdx];
      const label =
        this.trainViewMode === 'exterior'
          ? 'Follow Exterior Cam'
          : this.trainViewMode === 'window'
          ? 'Driver Interior POV'
          : 'Cozy Camper Lounge View';
      this.showNotice(`Olga View: ${label}`);
    } else {
      const order: TrainViewMode[] = ['window', 'cabin', 'driver', 'exterior'];
      const nextIdx = (order.indexOf(this.trainViewMode) + 1) % order.length;
      const nextView = order[nextIdx];
      this.trainViewMode = nextView;
      if (nextView === 'driver') {
        this.setTrainDriverMode(true);
        return;
      }
      if (this.trainViewMode === 'cabin') {
        this.cabinWalkZ = -1.6;
        this.cabinWalkX = 0;
        this.camYaw = 0;
        this.camPitch = 0.04;
        this.showNotice('Cabin Walk Mode · Use W/S or Joystick to walk inside the train');
      }
    }
    this.emitHudSnapshot();
  }

  public setTrainViewMode(view: TrainViewMode): void {
    this.trainViewMode = view;
    if (this.activeVehicle === 'train') {
      if (view === 'driver') {
        this.setTrainDriverMode(true);
        return;
      }
      if (view === 'cabin') {
        this.cabinWalkZ = -1.6;
        this.cabinWalkX = 0;
        this.camYaw = 0;
        this.camPitch = 0.04;
      }
    } else if (this.activeVehicle === 'bus') {
      if (view === 'driver') {
        this.setBusDriverMode(true);
        return;
      }
    }
    this.emitHudSnapshot();
  }

  public openRouteSelection(): void {
    if (this.activeVehicle !== 'train') return;
    if (this.trainState.phase === 'stopped') {
      this.trainState = { ...this.trainState, dwellHold: true };
    }
    this.callbacks.onModeChangeRequest('route_select');
    this.emitHudSnapshot();
  }

  public confirmTrainRoute(
    selectedIntermediateIndices: number[],
    destinationIndex: number
  ): void {
    this.audio.unlock();
    const originIdx = this.trainState.currentStationIndex;
    const plan = createTrainRoutePlan(
      originIdx,
      selectedIntermediateIndices,
      destinationIndex,
      this.timeHours
    );
    this.trainState = applyTrainRoutePlan(this.trainState, plan);
    this.prevPassedStationIndex = null;
    this.activeTicket = null;
    this.audio.playDoorChime();

    const destName = STATIONS[destinationIndex]?.name ?? 'Destination';
    const stopCount = plan.selectedStopIndices.length;
    this.showNotice(
      `Route confirmed · ${stopCount} selected stop${stopCount === 1 ? '' : 's'} to ${destName}`
    );
    recordCompanionMilestone(
      this.companionMemory,
      'train',
      `Set a custom scenic train route to ${destName} with Frosty.`
    );
    this.callbacks.onModeChangeRequest('playing');
    this.emitHudSnapshot();
  }

  public setSizeMode(mode: SizeMode): void {
    this.audio.unlock();
    const targetGiant = mode === 'giant' || (mode === 'auto' && this.icelandState.inIceland);
    const targetScale = targetGiant ? ICELAND_GIANT_SCALE : 1.0;

    this.icelandState = {
      ...this.icelandState,
      sizeMode: mode,
      stayGiantThroughout: mode === 'giant',
      targetScale,
      // Instant crisp responsiveness when player explicitly chooses Giant or Small!
      playerScale: mode === 'auto' ? this.icelandState.playerScale : targetScale,
      isGiant: mode === 'auto' ? this.icelandState.isGiant : targetGiant,
      playerHeightMeters:
        mode === 'auto'
          ? this.icelandState.playerHeightMeters
          : Number((1.68 * targetScale).toFixed(2)),
    };

    if (mode === 'giant') {
      this.transportMode = 'walk';
      this.audio.playIcelandTransform(true);
      this.showNotice(
        `Giant Form ON (${GIANT_PLAYER_HEIGHT_M.toFixed(1)}m) · Staying Giant everywhere!`
      );
    } else if (mode === 'small') {
      this.audio.playIcelandTransform(false);
      this.showNotice(
        this.icelandState.inIceland
          ? 'Small Form (1.68m) in Panimalai Snow Peaks · Tap Giant anytime to grow!'
          : 'Small Form (1.68m) · Normal size everywhere'
      );
    } else {
      this.showNotice(
        this.icelandState.inIceland
          ? 'Auto Size · Giant Form active inside Panimalai Iceland'
          : 'Auto Size · Normal (1.68m) outside, Giant (23.5m) in Panimalai Iceland'
      );
    }
    this.snapThirdPersonCamera();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleGiantSmall(): void {
    // 1-click toggle between Giant (23.5m) and Small (1.68m) — works INSIDE Panimalai Snow Place & everywhere!
    if (this.icelandState.isGiant || this.icelandState.sizeMode === 'giant') {
      this.setSizeMode('small');
    } else {
      this.setSizeMode('giant');
    }
  }

  public setStayGiantThroughout(enabled: boolean): void {
    this.setSizeMode(enabled ? 'giant' : 'auto');
  }

  public toggleStayGiantThroughout(): void {
    this.toggleGiantSmall();
  }

  public setBoatFpvMode(fpv: boolean): void {
    this.boatFpvMode = fpv;
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public setSkyVerticalInput(ascend: boolean, descend: boolean): void {
    this.skyAscendHeld = ascend;
    this.skyDescendHeld = descend;
  }

  public boardSkyExplorer(pad?: SkyExplorerPadId): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave();
    }
    if (pad) {
      this.skyExplorerState = createSkyExplorerAtHelipad(pad);
    }
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'sky_explorer';
    this.activeBoatId = null;
    this.boatFpvMode = false;
    this.transportMode = 'walk';
    if (this.icelandState.isGiant) {
      this.icelandState = {
        ...this.icelandState,
        sizeMode: 'small',
        stayGiantThroughout: false,
        playerScale: 1,
        targetScale: 1,
        isGiant: false,
        playerHeightMeters: 1.68,
      };
    }
    const groundY = Math.max(walkableHeightAt(this.skyExplorerState.x, this.skyExplorerState.z), WATER_LEVEL);
    this.skyExplorerState = {
      ...this.skyExplorerState,
      y: Math.max(this.skyExplorerState.y, groundY + 4.8),
      forwardSpeed: 0,
      verticalSpeed: 0,
    };
    this.playerX = this.skyExplorerState.x;
    this.playerY = this.skyExplorerState.y;
    this.playerZ = this.skyExplorerState.z;
    this.playerHeading = this.skyExplorerState.heading;
    this.camYaw = this.skyExplorerState.heading + Math.PI;
    this.camPitch = 0.24;
    this.skyExplorerWorld.sync(this.skyExplorerState, this.elapsed, true);
    const dist = 11.2;
    this.camera.position.set(
      this.skyExplorerState.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
      Math.max(2.5, this.skyExplorerState.y + Math.sin(this.camPitch) * dist + 2.8),
      this.skyExplorerState.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
    );
    _camCurrentLook.set(this.skyExplorerState.x, this.skyExplorerState.y + 1.5, this.skyExplorerState.z);
    this.camera.lookAt(_camCurrentLook);
    this.audio.playStationChime();
    const padLabel =
      pad === 'avs'
        ? ' from AVS Snow Residence Helipad'
        : pad === 'home'
        ? ' from En Illam Rooftop Helipad'
        : '';
    this.showNotice(
      `Flying SSJ Tropical Sky Explorer${padLabel}! W/S Fly · A/D Turn · Space Ascend · Ctrl/Q Descend · Shift Boost · E Exit`
    );
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public boardBoatById(boatId: BoatId): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave();
    }
    const boat = this.boats.find((b) => b.id === boatId);
    if (!boat) return;
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'boat';
    this.activeBoatId = boatId;
    this.boatFpvMode = false;
    this.transportMode = 'walk';
    if (this.icelandState.isGiant) {
      this.icelandState = {
        ...this.icelandState,
        sizeMode: 'small',
        stayGiantThroughout: false,
        playerScale: 1,
        targetScale: 1,
        isGiant: false,
        playerHeightMeters: 1.68,
      };
    }
    this.playerX = boat.x;
    this.playerZ = boat.z;
    this.playerY = 0.2;
    this.playerHeading = boat.heading;
    this.camYaw = boat.heading + Math.PI;
    this.camPitch = 0.24;
    this.vehiclesWorld.syncBoats(this.boats, this.elapsed);
    const boatDist =
      boatId === 'sovereign_ship'
        ? 24.0
        : boatId === 'bamboo_catamaran' || boatId === 'tribal_outrigger'
        ? 11.2
        : 7.6;
    const lookY = boatId === 'sovereign_ship' ? 4.2 : 1.1;
    const camBaseY = boatId === 'sovereign_ship' ? 4.6 : 2.1;
    this.camera.position.set(
      boat.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * boatDist,
      Math.max(1.8, Math.sin(this.camPitch) * boatDist + camBaseY),
      boat.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * boatDist
    );
    _camCurrentLook.set(
      boat.x + Math.sin(boat.heading) * 1.4,
      lookY,
      boat.z + Math.cos(boat.heading) * 1.4
    );
    this.camera.lookAt(_camCurrentLook);
    this.audio.playBoatSplash();
    recordCompanionMilestone(
      this.companionMemory,
      'boat',
      `Sailed ${boat.name} with Frosty perched at the bow.`
    );
    this.showNotice(
      `Sailing ${boat.name} with Frosty · WASD / Joystick to steer · Toggle Bow POV or press E to disembark`
    );
    this.speakCompanion('boat', true);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public boardCamperVan(): void {
    this.audio.unlock();
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'camper';
    this.activeBoatId = null;
    this.transportMode = 'walk';
    this.trainViewMode = 'exterior';
    if (this.icelandState.isGiant) {
      this.icelandState = {
        ...this.icelandState,
        sizeMode: 'small',
        stayGiantThroughout: false,
        playerScale: 1,
        targetScale: 1,
        isGiant: false,
        playerHeightMeters: 1.68,
      };
    }
    this.camperState = { ...this.camperState, doorsOpen: false };
    this.playerX = this.camperState.x;
    this.playerZ = this.camperState.z;
    this.playerHeading = this.camperState.heading;
    this.camYaw = this.camperState.heading + Math.PI;
    this.camPitch = 0.22;
    // Snap camera immediately behind Olga so the pastel camper van fills the frame right away
    const cy = walkableHeightAt(this.camperState.x, this.camperState.z) + 1.55;
    const dist = 7.4;
    this.camera.position.set(
      this.camperState.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
      Math.max(cy + 0.6, cy + Math.sin(this.camPitch) * dist + 1.1),
      this.camperState.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
    );
    _camCurrentLook.set(this.camperState.x, cy, this.camperState.z);
    this.camera.lookAt(_camCurrentLook);
    this.audio.playDoorChime();
    recordCompanionMilestone(
      this.companionMemory,
      'camper',
      'Drove Olga the pastel pink vintage camper van through Mayavanam Enchanted Forest with Frosty!'
    );
    this.showNotice('Driving Olga — Pastel Camper Van · WASD / Joystick · Doors [O] · Roof [R] · Lights [L] · Exit [E]');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleCamperDoors(): void {
    this.camperState = { ...this.camperState, doorsOpen: !this.camperState.doorsOpen };
    this.audio.playDoorChime();
    this.showNotice(this.camperState.doorsOpen ? 'Olga Camper doors opened' : 'Olga Camper doors closed');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleCamperRoof(): void {
    this.camperState = { ...this.camperState, roofPopped: !this.camperState.roofPopped };
    this.showNotice(this.camperState.roofPopped ? 'Olga Pop-Top Roof raised' : 'Olga Pop-Top Roof lowered');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleCamperLights(): void {
    this.camperState = { ...this.camperState, headlightsOn: !this.camperState.headlightsOn };
    this.showNotice(this.camperState.headlightsOn ? 'Olga Headlights ON' : 'Olga Headlights OFF');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleCamperHazards(): void {
    this.camperState = { ...this.camperState, hazardsOn: !this.camperState.hazardsOn };
    this.showNotice(this.camperState.hazardsOn ? 'Olga Hazard blinkers ON' : 'Olga Hazard blinkers OFF');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  private refreshDynamicColliders(): void {
    this.allColliders = [
      ...this.staticColliders,
      ...getActiveArenaWallColliders(this.dinosaurIslandState),
      ...this.midnightPortal.getActiveColliders(this.timeHours),
    ];
  }

  // =========================================================================
  // ULTRA-REALISTIC 3D HEROES & ARMOURED BATMOBILE API
  // =========================================================================

  public selectHero(
    heroId: HeroCharacterId,
    outfitId?: HeroOutfitId | null,
    goToVault = false
  ): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave();
    }
    const spec = getHeroById(heroId);
    const resolvedOutfit = getHeroOutfitById(heroId, outfitId);
    this.heroRig.setHero(heroId, resolvedOutfit.id);
    this.heroState = {
      ...createInitialHeroRuntimeState(),
      activeHeroId: heroId,
      activeOutfitId: resolvedOutfit.id,
    };
    this.webSwingState = createInitialWebSwingState();
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.isSitting = false;
    this.transportMode = 'walk';
    this.container.dataset.activeHero = heroId;
    this.container.dataset.batmobileActive = 'false';

    if (goToVault && !this.homeVaultState.inVault) {
      this.enterHomeSecretVault();
    }

    this.audio.playStationChime();
    this.showNotice(
      `Equipped ${spec.name} (${resolvedOutfit.label}) · [Q] ${spec.primaryPower.label} · [R] ${spec.secondaryPower.label}`
    );
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public clearHero(): void {
    this.heroState = createInitialHeroRuntimeState();
    this.webSwingState = createInitialWebSwingState();
    this.heroRig.group.visible = false;
    this.container.dataset.activeHero = 'none';
    this.showNotice('Switched back to Classic Dreamline Traveler');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public cycleActiveHeroOutfit(): void {
    if (!this.heroState.activeHeroId) return;
    const next = cycleHeroOutfit(this.heroState.activeHeroId, this.heroState.activeOutfitId);
    if (next.id === this.heroState.activeOutfitId) {
      this.showNotice(`${getHeroById(this.heroState.activeHeroId).name} uses a single signature suit.`);
      return;
    }
    this.heroState.activeOutfitId = next.id;
    this.heroRig.setHero(this.heroState.activeHeroId, next.id);
    this.audio.playTicketIssued();
    this.showNotice(`Switched Outfit: ${next.label}`);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public toggleHeroHelmet(): void {
    if (!this.heroState.activeHeroId) return;
    const spec = getHeroById(this.heroState.activeHeroId);
    if (!spec.mobility.hasHelmetToggle) return;
    this.heroState.helmetOpen = !this.heroState.helmetOpen;
    this.audio.playDoorChime();
    this.showNotice(
      this.heroState.helmetOpen ? 'Iron Man Faceplate Opened' : 'Iron Man Faceplate Sealed'
    );
    this.emitHudSnapshot();
  }

  public toggleHeroFlightOrSpecial(): void {
    if (!this.heroState.activeHeroId || this.activeVehicle !== 'none') return;
    if (this.homeVaultState.inVault) {
      this.showNotice('Head upstairs or drive out the East Tunnel to launch into open-sky flight!');
      this.emitHudSnapshot();
      return;
    }
    const spec = getHeroById(this.heroState.activeHeroId);
    if (spec.mobility.canFly) {
      this.heroState.isFlying = !this.heroState.isFlying;
      this.heroState.flyVelY = this.heroState.isFlying ? 6.5 : 0;
      if (this.heroState.isFlying) {
        this.playerY = Math.max(this.playerY + 2.2, 2.5);
        this.jumpState.isAirborne = false;
        this.jumpState.offsetY = 0;
        this.audio.playRepulsorBlast();
        this.showNotice(`${spec.name} Flight Thrusters Engaged! Space = Ascend · Ctrl/X = Descend · Shift = Boost`);
      } else {
        this.showNotice(`${spec.name} Flight Disengaged — Descending`);
      }
      this.emitHudSnapshot();
      return;
    }
    if (spec.mobility.canWebSwing) {
      const anchor = findBestWebOrGrappleAnchor(
        this.emptyWebAnchorState,
        this.playerX,
        this.playerY,
        this.playerZ,
        this.playerHeading
      );
      this.activeBeamVfx = {
        fromX: this.playerX,
        fromY: this.playerY + 1.4,
        fromZ: this.playerZ,
        toX: anchor.x,
        toY: anchor.y,
        toZ: anchor.z,
        color: 0xf8fafc,
        timer: 0.35,
        maxTime: 0.35,
      };
      this.playerX = this.playerX * 0.35 + anchor.x * 0.65;
      this.playerZ = this.playerZ * 0.35 + anchor.z * 0.65;
      this.playerY = Math.max(this.playerY + 6, Math.min(anchor.y + 1.5, 48));
      this.jumpState.isAirborne = true;
      this.jumpState.velocityY = 11.5;
      this.heroState.attackAnimTimer = 0.45;
      this.audio.playWebShoot();
      this.showNotice('Spider-Man Web-Zip Launch!');
      this.emitHudSnapshot();
      return;
    }
    if (spec.mobility.canCapeGlide) {
      this.heroState.isGliding = !this.heroState.isGliding;
      if (this.heroState.isGliding && this.playerY < 4) {
        this.playerY += 9.5;
      }
      this.audio.playJump(0.85);
      this.showNotice(
        this.heroState.isGliding
          ? 'Batman Bat-Cape Glide Active! Steer across the valley'
          : 'Batman Cape Folded'
      );
      this.emitHudSnapshot();
      return;
    }
    this.cycleActiveHeroOutfit();
  }

  public triggerHeroPrimaryPower(): void {
    if (!this.heroState.activeHeroId || this.activeVehicle !== 'none') return;
    if (this.heroState.powerCooldown > 0.05) return;
    this.audio.unlock();

    const spec = getHeroById(this.heroState.activeHeroId);
    const power = spec.primaryPower;
    this.heroState.powerCooldown = power.cooldownSec;
    this.heroState.attackAnimTimer = 0.55;

    const fwdX = Math.sin(this.playerHeading);
    const fwdZ = Math.cos(this.playerHeading);

    // Spider-Man primary [Q]: toggles real pendulum Web-Swinging on the open surface!
    if (power.kind === 'web_swing') {
      if (this.homeVaultState.inVault) {
        this.showNotice('Web-Swinging opens up outdoors — step upstairs or exit the garage first!');
        this.emitHudSnapshot();
        return;
      }
      if (this.heroState.isWebSwinging && this.webSwingState.active) {
        this.heroState.isWebSwinging = false;
        this.webSwingState.active = false;
        this.jumpState.isAirborne = true;
        this.jumpState.velocityY = 11.5;
        this.audio.playJump(1.2);
        this.showNotice('Web Released — Mid-Air Acrobatic Launch!');
      } else {
        this.webSwingState = startWebSwing(
          this.emptyWebAnchorState,
          this.playerX,
          Math.max(this.playerY, 4.5),
          this.playerZ,
          this.playerHeading,
          this.playerVx,
          this.playerVz,
          this.webSwingState.handSide
        );
        this.heroState.isWebSwinging = true;
        this.playerY = Math.max(this.playerY, 5.2);
        this.audio.playWebShoot();
        this.showNotice('Spider-Man Web-Swinging! WASD to carve · Shift boost · Space/Q to release');
      }
      this.emitHudSnapshot();
      return;
    }

    // Batman primary [Q]: Grapple Gun Zip to high ridge & Bat-Cape Glide!
    if (power.kind === 'grapple_zip') {
      if (this.homeVaultState.inVault) {
        this.showNotice('Step upstairs to launch Batman Grapple Gun outdoors!');
        this.emitHudSnapshot();
        return;
      }
      const anchor = findBestWebOrGrappleAnchor(
        this.emptyWebAnchorState,
        this.playerX,
        this.playerY,
        this.playerZ,
        this.playerHeading
      );
      const safeAnchorY = Math.max(anchor.y, walkableHeightAt(anchor.x, anchor.z) + 15);
      this.activeBeamVfx = {
        fromX: this.playerX,
        fromY: this.playerY + 1.4,
        fromZ: this.playerZ,
        toX: anchor.x,
        toY: safeAnchorY,
        toZ: anchor.z,
        color: 0x94a3b8,
        timer: 0.45,
        maxTime: 0.45,
      };
      this.playerX = anchor.x - fwdX * 1.4;
      this.playerZ = anchor.z - fwdZ * 1.4;
      this.playerY = safeAnchorY + 1.0;
      this.heroState.isGliding = true;
      this.audio.playWebShoot();
      this.showNotice('Batman Grapple Gun Zip → Bat-Cape Glide Engaged!');
      this.renderImmediate();
      this.emitHudSnapshot();
      return;
    }

    // Combat Powers (Repulsor Blast, Unibeam, Seismic Slam, Bat Smash, Solar Blast) — works EVERYWHERE!
    const reach =
      power.kind === 'bat_smash'
        ? 4.2
        : power.kind === 'seismic_slam'
          ? 2.2
          : this.homeVaultState.inVault
            ? 12.0
            : 22.0;
    const impactX = this.playerX + fwdX * reach;
    const impactZ = this.playerZ + fwdZ * reach;
    const impactGroundY = this.homeVaultState.inVault
      ? VAULT_FLOOR_Y
      : walkableHeightAt(impactX, impactZ);
    const impactY = Math.max(impactGroundY + 0.6, this.playerY + (power.kind === 'seismic_slam' ? 0.4 : 1.4));

    if (
      power.kind === 'repulsor_blast' ||
      power.kind === 'unibeam_barrage' ||
      power.kind === 'heat_slam'
    ) {
      this.activeBeamVfx = {
        fromX: this.playerX + fwdX * 0.6,
        fromY: this.playerY + 1.45,
        fromZ: this.playerZ + fwdZ * 0.6,
        toX: impactX,
        toY: impactY,
        toZ: impactZ,
        color:
          power.kind === 'heat_slam'
            ? 0xfef08a
            : power.kind === 'unibeam_barrage'
              ? 0x67e8f9
              : 0x38bdf8,
        timer: 0.42,
        maxTime: 0.42,
      };
      this.audio.playRepulsorBlast();
    } else if (power.kind === 'seismic_slam') {
      this.audio.playSeismicSlam();
    } else {
      this.audio.playBatSmash();
    }

    this.activeShockwaveVfx = {
      x: impactX,
      y: Math.max(impactGroundY + 0.25, this.playerY + 0.15),
      z: impactZ,
      maxRadius: power.impactRadius,
      timer: 0.6,
      maxTime: 0.6,
      color:
        power.kind === 'seismic_slam' || power.kind === 'heat_slam'
          ? 0xfbbf24
          : power.kind === 'bat_smash'
            ? 0xe2e8f0
            : 0x38bdf8,
    };

    this.showNotice(`${spec.name} unleashed ${power.label}!`);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public triggerHeroSecondaryPower(): void {
    if (!this.heroState.activeHeroId || this.activeVehicle !== 'none') return;
    this.audio.unlock();
    const spec = getHeroById(this.heroState.activeHeroId);
    const sec = spec.secondaryPower;
    this.heroState.secondaryTimer = sec.durationSec;

    this.heroState.energyShieldActive =
      sec.kind === 'energy_shield' || sec.kind === 'heavy_defense' || sec.kind === 'solar_surge';
    this.heroState.detectiveVisionActive = sec.kind === 'detective_scan';
    this.heroState.spiderSenseActive = sec.kind === 'spider_sense';

    if (sec.kind === 'dodge_roll') {
      const fwdX = Math.sin(this.playerHeading);
      const fwdZ = Math.cos(this.playerHeading);
      this.playerVx = fwdX * 14;
      this.playerVz = fwdZ * 14;
      this.audio.playJump(1.15);
    } else {
      this.audio.playIcelandTransform(true);
    }
    this.showNotice(`${spec.name}: ${sec.label} Activated (${sec.durationSec.toFixed(0)}s)`);
    this.emitHudSnapshot();
  }

  public spawnAndDriveBatmobile(inHomeVault = false): void {
    this.audio.unlock();
    if (this.inUndergroundCave) {
      this.exitUndergroundCave();
    }
    if (inHomeVault && !this.homeVaultState.inVault) {
      this.enterHomeSecretVault();
    }
    if (this.homeVaultState.inVault) {
      this.batmobileState = {
        ...createInitialBatmobileState(),
        inVault: true,
      };
    } else {
      const aheadX = this.playerX + Math.sin(this.playerHeading) * 5.0;
      const aheadZ = this.playerZ + Math.cos(this.playerHeading) * 5.0;
      this.batmobileState = {
        ...this.batmobileState,
        x: aheadX,
        y: walkableHeightAt(aheadX, aheadZ),
        z: aheadZ,
        heading: this.playerHeading,
        speed: 0,
        speedKmh: 0,
        inVault: false,
      };
    }
    this.batmobileWorld.group.visible = true;
    this.boardBatmobile();
  }

  private boardBatmobile(): void {
    this.activeVehicle = 'batmobile';
    this.activeBoatId = null;
    this.isSitting = false;
    this.isSwimming = false;
    this.heroState.isFlying = false;
    this.heroState.isGliding = false;
    this.heroState.isWebSwinging = false;
    this.webSwingState.active = false;
    this.playerX = this.batmobileState.x;
    this.playerY = this.batmobileState.y + 0.85;
    this.playerZ = this.batmobileState.z;
    this.playerHeading = this.batmobileState.heading;
    this.camYaw = this.batmobileState.heading + Math.PI;
    this.camPitch = 0.22;
    this.container.dataset.batmobileActive = 'true';
    this.batmobileWorld.group.visible = true;
    this.batmobileWorld.update(this.batmobileState, this.elapsed, 0.85);
    const snapDist = 9.2;
    const snapLookX = this.batmobileState.x + Math.sin(this.batmobileState.heading) * 3.0;
    const snapLookY = this.batmobileState.y + 1.35;
    const snapLookZ = this.batmobileState.z + Math.cos(this.batmobileState.heading) * 3.0;
    _camCurrentLook.set(snapLookX, snapLookY, snapLookZ);
    const desiredCamY = this.batmobileState.y + 1.25 + Math.sin(this.camPitch) * snapDist + 1.9;
    this.camera.position.set(
      this.batmobileState.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * snapDist,
      this.batmobileState.inVault ? Math.min(VAULT_CEILING_Y - 1.0, desiredCamY) : desiredCamY,
      this.batmobileState.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * snapDist
    );
    this.camera.lookAt(_camCurrentLook);
    this.audio.playRepulsorBlast();
    this.showNotice(
      this.batmobileState.inVault
        ? 'Driving Armoured Batmobile in Secret Garage! Drive East Tunnel to exit outdoors · [O] Canopy · [E] Exit'
        : 'Driving Armoured Batmobile! WASD to drive · Shift Jet Afterburner · O Canopy · V Camera · E Exit'
    );
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public exitBatmobile(): void {
    if (this.activeVehicle !== 'batmobile') return;
    const exit = getBatmobileExitPosition(this.batmobileState);
    this.activeVehicle = 'none';
    this.batmobileState = {
      ...this.batmobileState,
      speed: 0,
      speedKmh: 0,
      boostActive: false,
      canopyOpen: true,
    };
    if (this.batmobileState.inVault) {
      const clamped = clampVaultPosition(exit.x, exit.z, 1.4);
      this.playerX = clamped.x;
      this.playerZ = clamped.z;
      this.playerY = VAULT_FLOOR_Y;
    } else {
      this.playerX = exit.x;
      this.playerZ = exit.z;
      this.playerY = walkableHeightAt(exit.x, exit.z);
    }
    this.container.dataset.batmobileActive = 'false';
    this.audio.playDoorChime();
    this.showNotice('Exited Armoured Batmobile · Press E nearby to re-enter anytime');
    this.snapThirdPersonCamera();
    this.emitHudSnapshot();
  }

  public toggleBatmobileCanopy(): void {
    this.batmobileState = {
      ...this.batmobileState,
      canopyOpen: !this.batmobileState.canopyOpen,
    };
    this.audio.playDoorChime();
    this.showNotice(
      this.batmobileState.canopyOpen ? 'Batmobile Sliding Canopy Opened' : 'Batmobile Canopy Sealed'
    );
    this.emitHudSnapshot();
  }

  public toggleBatmobileLights(): void {
    this.batmobileState = {
      ...this.batmobileState,
      headlightsOn: !this.batmobileState.headlightsOn,
    };
    this.emitHudSnapshot();
  }

  public togglePersonalLantern(): void {
    this.playerLanternState = togglePlayerLantern(this.playerLanternState);
    this.container.dataset.lanternOn = String(this.playerLanternState.isOn);
    this.audio.playDoorChime();
    this.showNotice(
      this.playerLanternState.isOn
        ? 'Personal Lantern Lit — Warm brass lantern glowing [L]'
        : 'Personal Lantern Extinguished [L]'
    );
    const lanternGroundY = this.homeVaultState.inVault
      ? VAULT_FLOOR_Y
      : this.inUndergroundCave
        ? getCaveFloorHeightAt(this.playerX, this.playerZ)
        : this.inUndergroundMetro
          ? getUndergroundMetroFloorY(this.playerX, this.playerZ)
          : walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
    const stowed =
      this.activeVehicle === 'train' ||
      this.activeVehicle === 'bus' ||
      this.activeVehicle === 'camper' ||
      this.activeVehicle === 'batmobile' ||
      this.activeVehicle === 'vault_car' ||
      this.activeVehicle === 'airliner' ||
      this.activeVehicle === 'sky_explorer' ||
      this.activeVehicle === 'safari_car';
    this.playerLanternRig.update({
      x: this.playerX,
      y: this.smoothVisualY,
      z: this.playerZ,
      heading: this.playerHeading,
      scale: this.icelandState.playerScale,
      groundY: lanternGroundY,
      state: this.playerLanternState,
      isOnBike: this.transportMode === 'bicycle' && this.activeVehicle === 'none',
      isHeroActive: this.heroState.activeHeroId !== null,
      visible: !stowed && !this.isSitting,
      elapsed: this.elapsed,
    });
    this.updateLocalLightBudget();
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public cycleBatmobileCamera(): void {
    const order: BatmobileState['cameraMode'][] = ['chase', 'cinematic', 'cockpit'];
    const idx = (order.indexOf(this.batmobileState.cameraMode) + 1) % order.length;
    this.batmobileState = { ...this.batmobileState, cameraMode: order[idx] };
    this.showNotice(`Batmobile Camera: ${order[idx].toUpperCase()}`);
    this.emitHudSnapshot();
  }

  public repairBatmobileNow(): void {
    this.batmobileState = repairBatmobile(this.batmobileState);
    this.audio.playTicketIssued();
    this.showNotice('Batmobile Nano-Armour Repaired to 100%!');
    this.emitHudSnapshot();
  }

  public fireDinosaurAk47(): void {
    this.audio.unlock();
    const isCar = this.activeVehicle === 'safari_car';
    const shooterX = isCar ? this.dinosaurIslandState.safariCar.x : this.playerX;
    const shooterY = isCar
      ? walkableHeightAt(shooterX, this.dinosaurIslandState.safariCar.z) + 1.85
      : this.playerY + 1.35;
    const shooterZ = isCar ? this.dinosaurIslandState.safariCar.z : this.playerZ;

    const result = fireDinosaurIslandAk47(
      this.dinosaurIslandState,
      shooterX,
      shooterY,
      shooterZ
    );
    this.dinosaurIslandState = result.state;
    if (result.fired) {
      this.audio.playAk47Burst(isCar);
      if (result.killedDino) {
        this.audio.playDinoRoar();
        this.showNotice(
          this.dinosaurIslandState.brokenWalls < 4
            ? `T-Rex #${this.dinosaurIslandState.kills} defeated! Containment walls shattering 1→4!`
            : `T-Rex #${this.dinosaurIslandState.kills} defeated! Press Next Endless Dino Wave [N]`
        );
      } else {
        this.showNotice(this.dinosaurIslandState.statusLine);
      }
      this.renderImmediate();
      this.emitHudSnapshot();
    }
  }

  public toggleSafariCar(): void {
    this.audio.unlock();
    if (this.activeVehicle === 'safari_car') {
      const car = this.dinosaurIslandState.safariCar;
      this.activeVehicle = 'none';
      this.dinosaurIslandState = {
        ...this.dinosaurIslandState,
        safariCar: { ...car, speed: 0, speedKmh: 0 },
      };
      this.playerX = car.x - Math.cos(car.heading) * 2.1;
      this.playerZ = car.z + Math.sin(car.heading) * 2.1;
      this.playerY = walkableHeightAt(this.playerX, this.playerZ);
      this.playerHeading = car.heading;
      this.companionState.x = this.playerX - 1.2;
      this.companionState.z = this.playerZ + 0.6;
      this.companionState.y = walkableHeightAt(this.companionState.x, this.companionState.z);
      this.companionState.activity = 'idle';
      this.audio.playDoorChime();
      this.showNotice('Stepped out of Safari Car · Press E or J to drive again');
      this.snapThirdPersonCamera();
      this.renderImmediate();
      this.emitHudSnapshot();
      return;
    }

    const car = this.dinosaurIslandState.safariCar;
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'safari_car';
    this.activeBoatId = null;
    this.transportMode = 'walk';
    this.playerX = car.x;
    this.playerZ = car.z;
    this.playerY = walkableHeightAt(car.x, car.z) + 0.8;
    this.playerHeading = car.heading;
    this.camYaw = car.heading + Math.PI;
    this.camPitch = 0.24;
    const cy = walkableHeightAt(car.x, car.z) + 1.5;
    const dist = 7.6;
    this.camera.position.set(
      car.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
      Math.max(cy + 0.8, cy + Math.sin(this.camPitch) * dist + 1.2),
      car.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
    );
    _camCurrentLook.set(car.x, cy, car.z);
    this.camera.lookAt(_camCurrentLook);
    this.audio.playDoorChime();
    this.showNotice('Driving Safari 4x4 Car · WASD / Joystick · Fire AK-47 [K/F] · Exit [E/J]');
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public spawnNextDinosaurWave(): void {
    this.audio.unlock();
    const refX =
      this.activeVehicle === 'safari_car'
        ? this.dinosaurIslandState.safariCar.x
        : this.playerX;
    const refZ =
      this.activeVehicle === 'safari_car'
        ? this.dinosaurIslandState.safariCar.z
        : this.playerZ;
    this.dinosaurIslandState = spawnNextDinoWave(this.dinosaurIslandState, refX, refZ);
    this.audio.playDinoRoar();
    this.showNotice(this.dinosaurIslandState.statusLine);
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public enterIcelandFromGateway(): void {
    this.audio.unlock();
    if (this.activeVehicle === 'train') {
      this.activeVehicle = 'none';
      this.trainState = { ...this.trainState, routePlan: null, dwellHold: false };
    }
    this.transportMode = 'walk';
    this.teleportTo(
      ICELAND_ARRIVAL_POS.x,
      ICELAND_ARRIVAL_POS.z,
      'Panimalai Iceland · Giant Region'
    );
    // Smoothly grow into colossal Giant Form right on arrival!
    this.icelandState = {
      ...this.icelandState,
      inIceland: true,
      targetScale: ICELAND_GIANT_SCALE,
    };
    this.audio.playIcelandTransform(true);
    this.showNotice(
      `Entered Panimalai Iceland! Growing into Giant Form (${GIANT_PLAYER_HEIGHT_M.toFixed(1)}m) beside Giant Igloo Man (${GIANT_IGLOO_MAN_HEIGHT_M.toFixed(1)}m)`
    );
    this.emitHudSnapshot();
  }

  public returnToIcelandExpressHalt(): void {
    this.audio.unlock();
    const halt = STATIONS.find((s) => s.id === 'iceland_gateway');
    const tx = halt ? halt.platformX : -50.8;
    const tz = halt ? halt.platformZ : -24.0;
    this.teleportTo(tx, tz, 'Iceland Express Halt · ஐஸ்லாந்து நுழைவு');
    if (this.icelandState.stayGiantThroughout) {
      this.showNotice(
        `Returned to Iceland Express Halt — Staying Giant (${GIANT_PLAYER_HEIGHT_M.toFixed(1)}m)`
      );
    } else {
      this.audio.playIcelandTransform(false);
      this.showNotice('Returned to Iceland Express Halt — Restoring normal human scale (1.68m)');
    }
    this.emitHudSnapshot();
  }

  public showNotice(text: string): void {
    this.recentNotice = text;
    this.noticeTimer = 4.2;
    this.emitHudSnapshot();
  }

  public resetJourney(): void {
    this.playerX = 0.6;
    this.playerZ = 13.3;
    this.playerY = walkableHeightAt(this.playerX, this.playerZ);
    this.playerHeading = Math.PI * 0.88;
    this.playerVx = 0;
    this.playerVz = 0;
    this.isSitting = false;
    this.isSwimming = false;
    this.jumpState = createInitialJumpState();
    this.sittingSpot = null;
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.transportMode = 'walk';
    this.timeHours = 17.72;
    this.weather = 'clear';
    this.extremeWeatherState = createInitialExtremeWeatherState();
    this.season = 'spring';
    this.applySeasonFoliage();
    const resetFlockStats = this.birdFlockingWorld.reset(this.playerX, this.playerZ, this.season);
    this.lastFlockCountAttr = resetFlockStats.activeFlocks;
    this.lastFlockBirdsAttr = resetFlockStats.activeBirds;
    this.container.dataset.flockCount = String(resetFlockStats.activeFlocks);
    this.container.dataset.flockBirds = String(resetFlockStats.activeBirds);
    this.trainState = createInitialTrainState();
    this.prevPassedStationIndex = null;
    this.activeTicket = null;
    this.busState = createInitialBusState();
    this.boats = createInitialBoats();
    this.camperState = createInitialCamperState();
    this.campingState = { tentPitched: true, fireLit: true, mealsCooked: 0, nightsCamped: 0 };
    this.homeState = { outfit: 'navy_jacket', decorStyle: 'warm_wood', fairyLightsOn: true, mealsPrepared: 0 };
    this.playerRig.setOutfit(this.homeState.outfit);
    this.companionState = createInitialCompanionState(this.playerX, this.playerY, this.playerZ);
    this.companionMemory = createInitialCompanionMemory();
    this.icelandState = createIcelandState(this.playerX, this.playerZ, false, 'auto');
    this.prevInIceland = this.icelandState.inIceland;
    this.discoveredSpots = new Set(['spot_sakuragawa']);
    this.camYaw = 0.55;
    this.camPitch = 0.14;
    this.camDistance = 4.6;
    this.snapThirdPersonCamera();
    this.emitHudSnapshot();
  }

  public loadFromSave(save: SaveData): void {
    this.playerX = save.playerX;
    this.playerZ = save.playerZ;
    this.playerY = walkableHeightAt(this.playerX, this.playerZ);
    this.playerHeading = save.playerHeading;
    this.timeHours = normalizeHours(save.timeHours);
    this.weather = save.weather;
    this.season = save.season || 'spring';
    this.applySeasonFoliage();
    this.transportMode = save.transportMode || 'walk';
    this.isSitting = false;
    this.isSwimming = false;
    this.sittingSpot = null;
    this.activeVehicle = 'none';
    this.activeBoatId = null;
    this.activeTicket = null;
    this.discoveredSpots = new Set(save.discoveredSpotIds || ['spot_sakuragawa']);
    if (save.camping) this.campingState = { ...save.camping };
    if (save.home) {
      this.homeState = { ...save.home };
      this.playerRig.setOutfit(this.homeState.outfit);
    }
    if (save.companionMemory) this.companionMemory = { ...save.companionMemory };
    const savedSizeMode: SizeMode =
      save.sizeMode ?? (save.stayGiantThroughout ? 'giant' : 'auto');
    this.icelandState = createIcelandState(
      this.playerX,
      this.playerZ,
      Boolean(save.greetedIglooMan),
      savedSizeMode
    );
    this.prevInIceland = this.icelandState.inIceland;
    if (this.icelandState.isGiant) {
      this.transportMode = 'walk';
    }
    this.companionState = createInitialCompanionState(this.playerX, this.playerY, this.playerZ);
    this.snapThirdPersonCamera();
    this.emitHudSnapshot();
  }

  public exportSaveData(): SaveData {
    return {
      version: 3,
      playerX: this.playerX,
      playerZ: this.playerZ,
      playerHeading: this.playerHeading,
      timeHours: this.timeHours,
      weather: this.weather,
      season: this.season,
      transportMode: this.transportMode,
      discoveredSpotIds: Array.from(this.discoveredSpots),
      camping: { ...this.campingState },
      home: { ...this.homeState },
      companionMemory: { ...this.companionMemory },
      activeTicket: null,
      greetedIglooMan: this.icelandState.greetedIglooMan,
      stayGiantThroughout: this.icelandState.stayGiantThroughout,
      sizeMode: this.icelandState.sizeMode,
      savedAt: Date.now(),
    };
  }

  public teleportTo(x: number, z: number, label?: string): void {
    if (this.inUndergroundCave) {
      this.inUndergroundCave = false;
      this.setSurfaceGroupsVisible(true);
      this.frozenKingdom.caveGroup.visible = false;
      this.scene.background = null;
    }
    if (this.inUndergroundMetro) {
      this.inUndergroundMetro = false;
      this.airportMetroWorld.undergroundGroup.visible = false;
      this.setSurfaceGroupsVisible(true);
      this.scene.background = null;
    }
    if (this.homeVaultState.inVault) {
      this.homeVaultState = { ...this.homeVaultState, inVault: false, activeVaultCarId: null };
      this.homeVaultWorld.chamberGroup.visible = false;
      this.setSurfaceGroupsVisible(true);
      this.scene.background = null;
      this.container.dataset.inHomeVault = 'false';
      this.container.dataset.activeVaultCar = 'none';
    }
    this.parachuteState = createInitialParachuteState();
    this.isSitting = false;
    this.sittingSpot = null;
    this.activeVehicle = 'none';
    if (this.skyTaxi.playerOnboard) {
      this.skyTaxi = { ...this.skyTaxi, playerOnboard: false, phase: 'patrol_cruising' };
    }
    this.trainDriverMode = false;
    this.busDriverMode = false;
    this.activeBoatId = null;
    this.playerX = x;
    this.playerZ = z;
    this.playerY = walkableHeightAt(x, z);
    this.playerVx = 0;
    this.playerVz = 0;
    const tpFlockStats = this.birdFlockingWorld.onFocusTeleport(
      this.playerX,
      this.playerZ,
      this.timeHours,
      this.weather,
      this.season
    );
    this.lastFlockCountAttr = tpFlockStats.activeFlocks;
    this.lastFlockBirdsAttr = tpFlockStats.activeBirds;
    this.container.dataset.flockCount = String(tpFlockStats.activeFlocks);
    this.container.dataset.flockBirds = String(tpFlockStats.activeBirds);

    // Pick a clean scenic framing angle per region
    if (isInsideExhibitionIsland(x, z) || Math.hypot(x - EXHIBITION_ISLAND_CENTER.x, z - EXHIBITION_ISLAND_CENTER.z) < 62) {
      // Ocean Universal Transportation Exhibition Complex: look South-East directly at the Wayfort glass curtain-wall facade, rooftop sign & connected Aviation Hangar!
      this.camYaw = -2.58;
      this.playerHeading = 0.56;
      this.camDistance = 10.5;
      this.transportMode = 'walk';
    } else if (isOnDinosaurIsland(x, z)) {
      // SSJ Dinosaur Island: frame the chasing T-Rex, Safari Car & PAD-01N breakout walls!
      this.camYaw = -2.35;
      this.playerHeading = 0.78;
      this.camDistance = 6.2;
      this.dinosaurIslandState = { ...this.dinosaurIslandState, onIsland: true };
    } else if (Math.hypot(x - AVS_SNOW_HOUSE_CENTER.x, z - AVS_SNOW_HOUSE_CENTER.z) < 32) {
      // AVS Snow Residence: frame the rotated front facade facing Frozen Mirror Lake & rooftop helipad cleanly!
      this.camYaw = AVS_SNOW_HOUSE_ROT_Y + 0.14;
      this.playerHeading = AVS_SNOW_HOUSE_ROT_Y + Math.PI;
      this.camDistance = 8.4;
      this.transportMode = 'walk';
    } else if (Math.hypot(x - MIDNIGHT_FRONTIER_PORTAL_POS.x, z - MIDNIGHT_FRONTIER_PORTAL_POS.z) < 38) {
      // In-World Midnight Frontier Valley: look across the glowing boundary beacons & Holloway Farmhouse
      this.camYaw = 0.18;
      this.playerHeading = Math.PI;
      this.camDistance = 7.2;
    } else if (Math.hypot(x - DESERT_PYRAMID_CENTER.x, z - DESERT_PYRAMID_CENTER.z) < 36) {
      // Thar Grand Pyramid Ruins: look North-Northwest through the Twin Obelisks into the Torch-Lit South Portal & 6-Tier Stepped Pyramid!
      this.camYaw = 0.24;
      this.playerHeading = Math.PI + 0.12;
      this.camDistance = 9.0;
      this.camPitch = 0.16;
      this.transportMode = 'walk';
    } else if (Math.hypot(x - DESERT_OASIS_CENTER.x, z - DESERT_OASIS_CENTER.z) < 42) {
      // Thar Golden Desert Oasis: frame the wooden jetty, Emerald Oasis Lagoon, Date Palms, Helipad & Grand Pyramid on the horizon!
      this.camYaw = 2.08;
      this.playerHeading = -1.06;
      this.camDistance = 7.4;
      this.camPitch = 0.16;
      this.transportMode = 'walk';
    } else if (Math.hypot(x - ENCHANTED_FOREST_CENTER.x, z - ENCHANTED_FOREST_CENTER.z) < 28) {
      // Mayavanam Enchanted Forest: frame Olga pastel pink camper van, waterfall lotus pond & wisteria canopy
      this.camYaw = 0.72;
      this.playerHeading = -2.38;
      this.camDistance = 5.8;
    } else if (x > 70 && z > 20) {
      // Kadalkarai Coast: look east-northeast toward turquoise ocean, harbour, lighthouse & offshore Dinosaur Island
      this.camYaw = -1.15;
      this.playerHeading = Math.PI * 0.45;
      this.camDistance = 5.4;
    } else if (x < -60 && z < -42) {
      // Panimalai Iceland: three-quarter framing so colossal Giant Player (23.5m) & Giant Igloo Man (18.0m) stand side-by-side!
      this.camYaw = -1.04;
      this.playerHeading = 2.57;
      this.camDistance = 5.6;
      this.transportMode = 'walk';
    } else if (Math.abs(x - HOME_CENTER.x) <= 6.2 && Math.abs(z - HOME_CENTER.z) <= 5.2) {
      // Inside En Illam Living Room: frame the floor-flush secret hatch & glowing secret button clearly
      this.camYaw = 0.08;
      this.camPitch = 0.24;
      this.playerHeading = Math.PI;
      this.camDistance = 2.75;
    } else if (Math.hypot(x - HOME_CENTER.x, z - (HOME_CENTER.z + 9.2)) < 12) {
      // En Illam Personal Home: stand on front garden path framing both floors, balcony, fairy lights & rooftop helipad
      this.camYaw = 0.14;
      this.playerHeading = Math.PI;
      this.camDistance = 7.4;
    } else if (z > 65 && x < 120) {
      // Pachai Vayal Waterfall: look south directly at cascading waterfall & splash pool
      this.camYaw = Math.PI;
      this.playerHeading = 0;
      this.camDistance = 5.6;
    } else if (x > 22 && z < 12) {
      // Neelam Lake & Camp: look east-northeast across campfire, pier & mirror lake
      this.camYaw = -1.05;
      this.playerHeading = Math.PI * 0.45;
      this.camDistance = 5.4;
    } else if (x < -30 && z < -25) {
      this.camYaw = -2.35;
      this.playerHeading = 0.78;
      this.camDistance = 5.0;
    } else {
      this.camYaw = 0.55;
      this.playerHeading = Math.PI * 0.88;
      this.camDistance = 4.8;
    }

    // Place Frosty cleanly beside the player's left shoulder (never blocking the camera)
    const sideAngle = this.playerHeading - Math.PI * 0.55;
    this.companionState.x = x + Math.sin(sideAngle) * 1.65;
    this.companionState.z = z + Math.cos(sideAngle) * 1.65;
    this.companionState.y = walkableHeightAt(this.companionState.x, this.companionState.z);
    this.companionState.heading = this.playerHeading;
    this.companionState.activity = 'idle';
    this.companionState.restingInIgloo = false;

    this.camPitch = 0.14;
    this.snapThirdPersonCamera();

    const region = getRegionAt(x, z);
    const regionLabel = REGION_LABELS[region];
    recordRegionVisit(this.companionMemory, region, `${regionLabel.name} (${regionLabel.tamil})`);

    if (region === 'snow') {
      // Frosty gets excited in Panimalai Snow Peaks and sculpts a cute tiny snow buddy!
      this.companionState = triggerFrostyEmote(this.companionState, 'snowball', 4.2);
      const sx = this.companionState.x + Math.sin(this.playerHeading) * 1.1;
      const sz = this.companionState.z + Math.cos(this.playerHeading) * 1.1;
      this.companionRig.spawnSnowSculpture(sx, walkableHeightAt(sx, sz), sz);
    } else if (region === 'sakura' || region === 'countryside') {
      this.companionState = triggerFrostyEmote(this.companionState, 'curious', 3.4);
    } else {
      this.companionState = triggerFrostyEmote(this.companionState, 'wave', 2.8);
    }

    if (label) {
      this.showNotice(`Arrived at ${label}`);
    }
    if (Math.hypot(x - HOME_CENTER.x, z - HOME_CENTER.z) < 16) {
      recordCompanionMilestone(this.companionMemory, 'home', 'Returned home together with Frosty to En Illam.');
      this.speakCompanion('home', true);
    } else {
      this.speakCompanion(region, true);
    }
    this.renderImmediate();
    this.emitHudSnapshot();
  }

  public capturePostcardDataUrl(): string {
    this.audio.playShutter();
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.86);
    this.personalHome.updatePostcardDisplay(dataUrl);
    return dataUrl;
  }

  public triggerPrimaryInteract(): void {
    // 0. Exiting active Sky Explorer Air Taxi
    if (this.skyTaxi.playerOnboard) {
      this.disembarkSkyTaxi();
      return;
    }

    // 1. Exiting active vehicles (Train, Bus, Boat)
    if (this.activeVehicle === 'train') {
      if (this.trainState.phase === 'stopped' || (this.trainDriverMode && this.trainState.speedKmh < 3)) {
        const nearStation = findNearbyStationIndex(this.trainState.worldX, this.trainState.worldZ, 18);
        const exit =
          nearStation !== null
            ? getDisembarkPosition(this.trainState)
            : {
                x: this.trainState.worldX + Math.cos(this.trainState.heading) * 3.4,
                z: this.trainState.worldZ - Math.sin(this.trainState.heading) * 3.4,
                heading: this.trainState.heading,
              };
        this.activeVehicle = 'none';
        this.trainDriverMode = false;
        this.trainManualDoors = false;
        this.trainState = { ...this.trainState, dwellHold: false };
        if (this.trainState.routePlan?.status === 'completed') {
          this.trainState = { ...this.trainState, routePlan: null };
        }
        this.playerX = exit.x;
        this.playerZ = exit.z;
        this.playerY = walkableHeightAt(exit.x, exit.z);
        this.playerHeading = exit.heading;
        this.companionState.x = exit.x - 1.3;
        this.companionState.z = exit.z + 0.6;
        this.companionState.y = this.playerY;
        this.companionState.activity = 'idle';
        this.audio.playDoorChime();
        const station = STATIONS[this.trainState.currentStationIndex];
        this.showNotice(
          nearStation !== null
            ? `Stepped onto ${station?.name ?? 'the platform'}`
            : 'Stepped off the train safely'
        );
        this.emitHudSnapshot();
      } else {
        this.showNotice(
          this.trainDriverMode
            ? 'Brake to a stop [Space] before stepping out of the driver cab'
            : 'Wait for the next selected station stop to step off'
        );
      }
      return;
    }

    if (this.activeVehicle === 'bus') {
      if (this.busState.phase === 'stopped' || (this.busDriverMode && this.busState.speedKmh < 3)) {
        const useSideExit = this.busDriverMode || this.busDispatch.phase !== 'idle';
        const exit = useSideExit
          ? {
              x: this.busState.worldX + Math.cos(this.busState.heading) * 3.2,
              z: this.busState.worldZ - Math.sin(this.busState.heading) * 3.2,
              heading: this.busState.heading,
            }
          : getBusDisembarkPosition(this.busState);
        this.activeVehicle = 'none';
        this.busDriverMode = false;
        this.busManualDoors = false;
        this.playerX = exit.x;
        this.playerZ = exit.z;
        this.playerY = walkableHeightAt(exit.x, exit.z);
        this.playerHeading = exit.heading;
        this.companionState.x = exit.x - 1.3;
        this.companionState.z = exit.z + 0.5;
        this.companionState.y = this.playerY;
        this.companionState.activity = 'idle';
        const stop = BUS_STOPS[this.busState.currentStopIndex];
        this.showNotice(
          useSideExit
            ? 'Stepped off the Dreamline Bus'
            : `Stepped off at ${stop?.name ?? 'the bus stop'}`
        );
        this.emitHudSnapshot();
      } else {
        this.showNotice(
          this.busDriverMode
            ? 'Brake to a stop [Space] before stepping out of the bus'
            : 'Wait for the bus to stop before stepping off'
        );
      }
      return;
    }

    if (this.activeVehicle === 'boat' && this.activeBoatId) {
      const boat = this.boats.find((b) => b.id === this.activeBoatId);
      this.activeVehicle = 'none';
      this.activeBoatId = null;
      if (boat) {
        boat.speed = 0;
        const distToDock = Math.hypot(boat.x - boat.dockX, boat.z - boat.dockZ);
        const dockRadius = boat.id === 'sovereign_ship' ? 15.5 : 9.5;
        if (distToDock <= dockRadius) {
          // Near wooden dock: moor cleanly & step onto the dock
          this.playerX = boat.exitX;
          this.playerZ = boat.exitZ;
          this.playerY = walkableHeightAt(boat.exitX, boat.exitZ);
          this.isSwimming = false;
          boat.x = boat.dockX;
          boat.z = boat.dockZ;
          this.companionState.x = boat.exitX - 1.4;
          this.companionState.z = boat.exitZ + 0.7;
          this.companionState.y = this.playerY;
          this.companionState.activity = 'idle';
          this.audio.playBoatSplash();
          this.showNotice(`Moored ${boat.name} at the wooden dock`);
        } else {
          // Out on open water: hop gently into the water & swim right beside the boat!
          this.playerX = boat.x + Math.cos(boat.heading) * 2.2;
          this.playerZ = boat.z - Math.sin(boat.heading) * 2.2;
          this.isSwimming = isSwimmableWaterAt(this.playerX, this.playerZ);
          this.playerY = this.isSwimming
            ? WATER_LEVEL - 0.52 * this.icelandState.playerScale
            : walkableHeightAt(this.playerX, this.playerZ);
          this.companionState.x = this.playerX - 1.3;
          this.companionState.z = this.playerZ + 0.8;
          this.companionState.y = this.isSwimming ? WATER_LEVEL + 0.04 : this.playerY;
          this.companionState.activity = 'idle';
          this.audio.playBoatSplash();
          this.showNotice(`Splashed into the water beside ${boat.name} — Swim freely or press E to board again!`);
        }
      }
      this.snapThirdPersonCamera();
      this.emitHudSnapshot();
      return;
    }

    if (this.activeVehicle === 'camper') {
      const exit = getCamperExitPosition(this.camperState);
      this.activeVehicle = 'none';
      this.camperState = { ...this.camperState, speed: 0, speedKmh: 0, isBraking: false };
      this.playerX = exit.x;
      this.playerZ = exit.z;
      this.playerY = walkableHeightAt(exit.x, exit.z);
      this.playerHeading = exit.heading;
      this.companionState.x = exit.x - 1.2;
      this.companionState.z = exit.z + 0.6;
      this.companionState.y = walkableHeightAt(this.companionState.x, this.companionState.z);
      this.companionState.activity = 'idle';
      this.audio.playDoorChime();
      this.showNotice('Parked Olga Camper Van · Press E nearby to drive again anytime');
      this.snapThirdPersonCamera();
      this.emitHudSnapshot();
      return;
    }

    if (this.activeVehicle === 'batmobile') {
      this.exitBatmobile();
      return;
    }

    if (this.activeVehicle === 'vault_car') {
      this.exitVaultCar();
      return;
    }

    if (this.activeVehicle === 'safari_car') {
      this.toggleSafariCar();
      return;
    }

    if (this.activeVehicle === 'sky_explorer') {
      const exit = getSkyExplorerExitPosition(this.skyExplorerState);
      this.activeVehicle = 'none';
      this.skyAscendHeld = false;
      this.skyDescendHeld = false;
      this.skyExplorerState = {
        ...this.skyExplorerState,
        forwardSpeed: 0,
        verticalSpeed: 0,
        yawRate: 0,
        roll: 0,
        pitch: 0,
        speedKmh: 0,
        boostActive: false,
      };
      this.playerX = exit.x;
      this.playerY = exit.y;
      this.playerZ = exit.z;
      this.isSwimming = isSwimmableWaterAt(exit.x, exit.z) && exit.y <= WATER_LEVEL + 0.35;
      this.companionState.x = exit.x - 1.4;
      this.companionState.z = exit.z + 0.8;
      this.companionState.y = this.isSwimming ? WATER_LEVEL + 0.04 : exit.y;
      this.companionState.activity = 'idle';
      this.audio.playDoorChime();
      this.showNotice('Landed SSJ Tropical Sky Explorer · Press E nearby to fly again anytime!');
      this.snapThirdPersonCamera();
      this.emitHudSnapshot();
      return;
    }

    if (this.activeVehicle === 'airliner') {
      this.exitAirliner(false);
      return;
    }

    if (this.isSitting) {
      this.isSitting = false;
      this.sittingSpot = null;
      this.companionState.activity = 'idle';
      this.showNotice('Stood up');
      this.emitHudSnapshot();
      return;
    }

    const prompt = this.findNearestInteractable();
    if (!prompt) return;

    if (prompt.kind === 'train_board') {
      this.activeVehicle = 'train';
      this.trainViewMode = 'window';
      this.cabinWalkZ = -1.2;
      this.cabinWalkX = 0;
      this.isSitting = false;
      this.trainState = { ...this.trainState, dwellHold: true };
      this.audio.playStationChime();
      this.audio.playDoorChime();
      recordCompanionMilestone(this.companionMemory, 'train', 'Boarded the Dreamline Scenic Express with Frosty.');
      this.showNotice('Boarded Dreamline Scenic Express — Select your stops & destination');
      this.speakCompanion('train', true);
      this.callbacks.onModeChangeRequest('route_select');
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'iceland_transfer') {
      this.enterIcelandFromGateway();
      return;
    }

    if (prompt.kind === 'safari_car_drive') {
      this.toggleSafariCar();
      return;
    }

    if (prompt.kind === 'iceland_return') {
      this.returnToIcelandExpressHalt();
      return;
    }

    if (prompt.kind === 'giant_igloo_man') {
      this.regionsWorld.triggerIglooManWave();
      this.icelandState = { ...this.icelandState, greetedIglooMan: true };
      this.audio.playStationChime();
      recordCompanionMilestone(
        this.companionMemory,
        'sculpture',
        `Stood in Giant Form (${GIANT_PLAYER_HEIGHT_M.toFixed(1)}m) and waved to the colossal Giant Igloo Man (${GIANT_IGLOO_MAN_HEIGHT_M.toFixed(1)}m) in Panimalai Iceland!`
      );
      this.showNotice(
        `Giant Igloo Man (${GIANT_IGLOO_MAN_HEIGHT_M.toFixed(1)}m) waves warmly up at you (${this.icelandState.playerHeightMeters}m Giant Form)!`
      );
      this.speakCompanion('snow', true);
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'exhibition_vehicle' && prompt.metaId) {
      this.callbacks.onOpenExhibitionVehicle?.(prompt.metaId as ExhibitionVehicleId);
      return;
    }

    if (prompt.kind === 'sky_taxi_board') {
      this.boardSkyTaxiNow();
      return;
    }

    if (prompt.kind === 'midnight_frontier_door') {
      const opened = this.midnightPortal.toggleFarmhouseDoor();
      this.audio.playDoorChime();
      this.showNotice(
        opened
          ? 'Pushed open the Holloway Farmhouse door — step inside to inspect the oil lamp & radio'
          : 'Closed the Holloway Farmhouse door'
      );
      return;
    }

    if (prompt.kind === 'midnight_frontier_cellar') {
      const opened = this.midnightPortal.toggleCellarHatch();
      this.audio.playDoorChime();
      this.showNotice(
        opened
          ? 'Lifted the Subterranean Root Cellar Hatch — eerie cyan light spills upward!'
          : 'Closed the Subterranean Root Cellar Hatch'
      );
      return;
    }

    if (prompt.kind === 'midnight_frontier_discovery' && prompt.metaId) {
      const disc = MIDNIGHT_FRONTIER_DISCOVERIES.find((d) => d.id === prompt.metaId);
      if (disc) {
        this.callbacks.onInspect({
          kind: 'midnight_lore',
          title: disc.title,
          jpTitle: `The Midnight Frontier · ${disc.category}`,
          stationName: 'In-World Night Valley (-72, 86)',
          bodyText: disc.loreText,
        });
      }
      return;
    }

    if (prompt.kind === 'midnight_frontier_portal') {
      this.audio.playIcelandTransform(true);
      this.midnightPortalCooldown = 6.0;
      this.callbacks.onModeChangeRequest('midnight_frontier');
      return;
    }

    if (prompt.kind === 'metro_enter') {
      this.enterUndergroundMetro(prompt.metaId);
      return;
    }

    if (prompt.kind === 'metro_exit') {
      this.exitUndergroundMetro();
      return;
    }

    if (prompt.kind === 'metro_train_board') {
      this.rideUndergroundMetroTo();
      return;
    }

    if (prompt.kind === 'airliner_board') {
      this.boardAirliner(false);
      return;
    }

    if (prompt.kind === 'home_hero_hall' || prompt.kind === 'hero_hq_switch') {
      this.audio.playStationChime();
      this.callbacks.onModeChangeRequest('hero_armory');
      return;
    }

    if (prompt.kind === 'parachute_tower_launch') {
      this.launchFromParachuteTower();
      return;
    }

    if (prompt.kind === 'cave_enter') {
      this.enterUndergroundCave(prompt.metaId);
      return;
    }

    if (prompt.kind === 'cave_exit') {
      this.exitUndergroundCave(prompt.metaId);
      return;
    }

    if (prompt.kind === 'bus_board') {
      if (this.busDispatch.phase === 'arrived_pickup') {
        this.boardDispatchedBusNow();
        return;
      }
      this.activeVehicle = 'bus';
      this.busDriverMode = false;
      this.trainViewMode = 'window';
      this.isSitting = false;
      this.audio.playStationChime();
      recordCompanionMilestone(this.companionMemory, 'bus', 'Took the scenic rural bus with Frosty.');
      this.showNotice('Boarded the Dreamline Rural Bus with Frosty · Tap Driver anytime to take the wheel');
      this.speakCompanion('bus', true);
      this.emitHudSnapshot();
      return;
    }

    if (
      prompt.kind === 'boat_board' &&
      (prompt.metaId === 'lake_boat' ||
        prompt.metaId === 'coastal_boat' ||
        prompt.metaId === 'bamboo_catamaran' ||
        prompt.metaId === 'tribal_outrigger' ||
        prompt.metaId === 'sovereign_ship')
    ) {
      this.boardBoatById(prompt.metaId);
      return;
    }

    if (prompt.kind === 'sky_explorer_fly') {
      if (prompt.id === 'desert_helipad_launch') {
        this.skyExplorerState = {
          ...this.skyExplorerState,
          x: DESERT_HELIPAD_POS.x,
          y: DESERT_HELIPAD_POS.y + 1.4,
          z: DESERT_HELIPAD_POS.z,
          heading: -Math.PI * 0.35,
          forwardSpeed: 0,
          verticalSpeed: 0,
          yawRate: 0,
          roll: 0,
          pitch: 0,
          speedKmh: 0,
          altitudeM: 1.4,
          boostActive: false,
        };
        this.skyExplorerWorld.sync(this.skyExplorerState, this.elapsed, true);
        this.activeVehicle = 'sky_explorer';
        this.activeBoatId = null;
        this.isSitting = false;
        this.isSwimming = false;
        this.playerX = DESERT_HELIPAD_POS.x;
        this.playerY = DESERT_HELIPAD_POS.y + 1.4;
        this.playerZ = DESERT_HELIPAD_POS.z;
        this.playerHeading = this.skyExplorerState.heading;
        this.camYaw = this.playerHeading + Math.PI;
        this.camPitch = 0.24;
        this.audio.playStationChime();
        this.showNotice('Launched SSJ Sky Explorer from Thar Desert Sky Pad! W/S Fly · Space Ascend · Q Descend · E Exit');
        this.renderImmediate();
        this.emitHudSnapshot();
        return;
      }
      const padId =
        prompt.metaId === 'avs' || prompt.metaId === 'home'
          ? (prompt.metaId as SkyExplorerPadId)
          : undefined;
      this.boardSkyExplorer(padId);
      return;
    }

    if (prompt.id === 'desert_pyramid_relic') {
      this.audio.playStationChime();
      this.showNotice('Solar Sun-Chariot Relic hums with ancient golden warmth inside the Torch-Lit Pyramid Chamber!');
      this.speakCompanion('desert', true);
      this.emitHudSnapshot();
      return;
    }

    if (prompt.id === 'desert_pyramid_portal_sign') {
      this.audio.playStationChime();
      this.showNotice('Ancient Inscription: Walk North into the South Portal for the Solar Relic Chamber, or climb the East Stairs to the 14.6m Sun Summit!');
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'camper_drive') {
      this.boardCamperVan();
      return;
    }

    if (prompt.kind === 'transit_board') {
      this.audio.unlock();
      this.callbacks.onModeChangeRequest('transit_map');
      return;
    }

    if (prompt.kind === 'npc_talk' && prompt.metaId) {
      this.audio.unlock();
      const greeted = this.peopleSystem.greetNpc(prompt.metaId);
      if (greeted) {
        this.showNotice(`${greeted.name}: "${greeted.line}"`);
      }
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'camp_tent') {
      this.campingState = { ...this.campingState, tentPitched: !this.campingState.tentPitched };
      this.showNotice(this.campingState.tentPitched ? 'Pitched lakeside camping tent' : 'Packed camping tent neatly');
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'camp_fire') {
      if (prompt.id === 'desert_oasis_campfire') {
        this.desertCampfireLit = !this.desertCampfireLit;
        this.desertOasisWorld.setCampfireLit(this.desertCampfireLit);
        if (this.desertCampfireLit) {
          this.audio.playCampfireIgnite();
          this.showNotice('Kindled the Thar Oasis Bedouin campfire beneath the date palms');
          this.speakCompanion('desert', true);
        } else {
          this.showNotice('Banked the desert campfire embers safely');
        }
        this.emitHudSnapshot();
        return;
      }
      const nextLit = !this.campingState.fireLit;
      this.campingState = { ...this.campingState, fireLit: nextLit };
      if (nextLit) {
        this.audio.playCampfireIgnite();
        this.showNotice('Lit a warm crackling lakeside campfire');
        this.speakCompanion('campfire', true);
      } else {
        this.showNotice('Extinguished campfire embers safely');
      }
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'camp_cook') {
      if (!this.campingState.fireLit) {
        this.campingState = { ...this.campingState, fireLit: true };
        this.audio.playCampfireIgnite();
      }
      this.campingState = { ...this.campingState, mealsCooked: this.campingState.mealsCooked + 1 };
      recordCompanionMilestone(this.companionMemory, 'camp', 'Cooked hot campfire supper by Neelam Lake with Frosty.');
      this.showNotice('Cooked warm spiced camp stew & tea beside Frosty');
      this.speakCompanion('campfire', true);
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'camp_sleep') {
      if (prompt.id === 'desert_bedouin_tent') {
        this.campingState = { ...this.campingState, nightsCamped: this.campingState.nightsCamped + 1 };
        recordCompanionMilestone(this.companionMemory, 'camp', 'Rested in the silk Bedouin Pavilion beneath Thar Desert stars with Frosty.');
        const targetHour = this.timeHours >= 19 || this.timeHours < 5 ? 6.5 : 21.5;
        this.sleepUntil(
          targetHour,
          targetHour > 12
            ? 'Starlit Desert Night (21:30) — Watch the pyramid torches glow beneath the cosmos!'
            : 'Golden Desert Sunrise (06:30) over Thar Oasis!'
        );
        return;
      }
      this.campingState = { ...this.campingState, nightsCamped: this.campingState.nightsCamped + 1 };
      recordCompanionMilestone(this.companionMemory, 'camp', 'Camped beneath the stars with Frosty beside Neelam Lake.');
      this.sleepUntil(6.5, 'Slept peacefully under the stars — Good morning (06:30)');
      return;
    }

    if (prompt.kind === 'home_bed') {
      recordCompanionMilestone(this.companionMemory, 'home', 'Rested peacefully upstairs at En Illam.');
      this.sleepUntil(6.5, 'Rested warmly in your En Illam bedroom — Sunrise (06:30)');
      return;
    }

    if (prompt.kind === 'home_kitchen') {
      this.cookAtHome();
      return;
    }

    if (prompt.kind === 'home_avatar_stand') {
      if (isValidBoyOutfitId(prompt.metaId)) {
        this.audio.unlock();
        if (prompt.metaId === 'igloo_man' || this.homeState.outfit === 'igloo_man') {
          this.audio.playIcelandTransform(prompt.metaId === 'igloo_man');
        }
        this.setOutfit(prompt.metaId);
      }
      return;
    }

    if (prompt.kind === 'home_wardrobe' || prompt.kind === 'home_decor') {
      this.callbacks.onModeChangeRequest('home_menu');
      return;
    }

    if (prompt.kind === 'home_vault_toggle') {
      this.toggleHomeSecretVaultHatch();
      return;
    }

    if (prompt.kind === 'home_vault_enter') {
      this.enterHomeSecretVault();
      return;
    }

    if (prompt.kind === 'home_vault_exit') {
      this.exitHomeSecretVault();
      return;
    }

    if (prompt.kind === 'vault_hero_pod' && prompt.metaId) {
      this.selectHero(prompt.metaId as HeroCharacterId);
      return;
    }

    if (prompt.kind === 'vault_car_drive' && prompt.metaId) {
      this.boardVaultCar(prompt.metaId as VaultCarId);
      return;
    }

    if (prompt.kind === 'batmobile_drive') {
      this.boardBatmobile();
      return;
    }

    if (prompt.kind === 'frosty_igloo') {
      const seat = this.personalHome.frostyIglooSeat;
      if (!this.companionState.restingInIgloo) {
        this.companionState.restingInIgloo = true;
        this.companionState.x = seat.x;
        this.companionState.y = seat.y;
        this.companionState.z = seat.z;
        this.companionState.heading = seat.heading;
        this.companionState.activity = 'sleeping';
        this.companionState.emote = 'sleeping';
        this.companionState.emoteTimer = 10;
        this.companionState.speed = 0;
        recordCompanionMilestone(this.companionMemory, 'home', 'Tucked Frosty into his cozy igloo bed at En Illam.');
        this.showNotice('Frosty curled up on his blue cushion under the snowflake lamp');
        this.speakCompanion('igloo', true);
      } else {
        this.companionState.restingInIgloo = false;
        this.companionState.activity = 'idle';
        this.companionState = triggerFrostyEmote(this.companionState, 'happy_bounce', 3.0);
        this.showNotice('Frosty woke up sparkly and ready to explore!');
        this.speakCompanion('igloo', true);
      }
      this.renderImmediate();
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'bench') {
      this.isSitting = true;
      this.sittingSpot = prompt;
      this.playerX = prompt.x;
      this.playerZ = prompt.z;
      this.playerY = prompt.y;
      if (prompt.facingAngle !== undefined) {
        this.playerHeading = prompt.facingAngle;
      }
      this.playerVx = 0;
      this.playerVz = 0;
      this.showNotice('Resting quietly with Frosty — press E or move to stand up');
      this.emitHudSnapshot();
      return;
    }

    if (prompt.kind === 'station_door') {
      const opened = this.architecture.toggleStationDoor();
      this.showNotice(opened ? 'Opened ஷவீஷ் ஜெஷுருன் சா Waiting Room door' : 'Closed Waiting Room door');
      return;
    }

    if (prompt.kind === 'timetable' || prompt.kind === 'info_board' || prompt.kind === 'vending_machine') {
      this.callbacks.onInspect({
        kind: prompt.kind,
        title:
          prompt.kind === 'timetable'
            ? 'Dreamline Local Timetable'
            : prompt.kind === 'vending_machine'
            ? 'Countryside Refreshments'
            : 'ஷவீஷ் ஜெஷுருன் சா Station Guide',
        jpTitle:
          prompt.kind === 'timetable'
            ? 'கால அட்டவணை'
            : prompt.kind === 'vending_machine'
            ? 'குளிர்பான இயந்திரம்'
            : 'நிலைய வழிகாட்டி',
        stationName: prompt.sublabel || 'ஷவீஷ் ஜெஷுருன் சா',
      });
    }
  }

  private findNearestInteractable(): InteractableItem | null {
    if (this.activeVehicle !== 'none' || this.skyTaxi.playerOnboard) return null;

    // Inside the Secret Underground Superhero Vault & Car Garage beneath En Illam
    if (this.homeVaultState.inVault) {
      let bestVault: InteractableItem | null = null;
      let bestVaultD = Infinity;

      // Check proximity to each drivable vault car currently parked inside the underground garage
      for (const car of this.homeVaultState.cars) {
        if (!car.inVault) continue;
        const d = Math.hypot(this.playerX - car.x, this.playerZ - car.z);
        if (d <= 4.3 && d < bestVaultD) {
          bestVaultD = d;
          const spec = getVaultCarSpec(car.id);
          bestVault = {
            id: `vault_car_${car.id}`,
            kind: 'vault_car_drive',
            label: `Drive ${spec.name}`,
            sublabel: `${spec.subtitle} · Drive East Tunnel to exit outdoors`,
            x: car.x,
            y: VAULT_FLOOR_Y + 0.8,
            z: car.z,
            radius: 4.3,
            locationId: 'my_home',
            metaId: car.id,
          };
        }
      }

      // Check proximity to the Armoured Batmobile if parked inside Bay 4
      if (this.batmobileState.inVault) {
        const dBat = Math.hypot(
          this.playerX - this.batmobileState.x,
          this.playerZ - this.batmobileState.z
        );
        if (dBat <= 4.8 && dBat < bestVaultD) {
          bestVaultD = dBat;
          bestVault = {
            id: 'vault_batmobile_drive',
            kind: 'batmobile_drive',
            label: 'Drive The Tumbler Batmobile',
            sublabel: 'Secret Underground Garage Bay 4 · Jet Afterburner & East Exit Tunnel',
            x: this.batmobileState.x,
            y: VAULT_FLOOR_Y + 0.9,
            z: this.batmobileState.z,
            radius: 4.8,
            locationId: 'my_home',
          };
        }
      }

      // Check all 7 ready-to-wear Hero Costume Pods, Armory Console & Glass Elevator Up
      for (const item of this.homeVaultWorld.interactables) {
        const d = Math.hypot(this.playerX - item.x, this.playerZ - item.z);
        if (d <= item.radius && d < bestVaultD) {
          bestVaultD = d;
          bestVault = item;
        }
      }
      return bestVault;
    }

    // Inside the 2-Level Underground Metro Station: check train boarding & surface exit prompts
    if (this.inUndergroundMetro) {
      let bestMetro: InteractableItem | null = null;
      let bestMetroD = Infinity;
      for (const item of this.airportMetroWorld.undergroundInteractables) {
        const d = Math.hypot(this.playerX - item.x, this.playerZ - item.z);
        if (d <= item.radius && d < bestMetroD) {
          bestMetroD = d;
          bestMetro = item;
        }
      }
      return bestMetro;
    }

    // Inside the 6-Area Underground Cave World: check the 5 glowing cave exit portals
    if (this.inUndergroundCave) {
      let bestExit: InteractableItem | null = null;
      let bestExitD = Infinity;
      for (const item of this.frozenKingdom.caveExitInteractables) {
        const d = Math.hypot(this.playerX - item.x, this.playerZ - item.z);
        if (d <= item.radius && d < bestExitD) {
          bestExitD = d;
          bestExit = item;
        }
      }
      return bestExit;
    }

    if (canBoardTrain(this.trainState, this.playerX, this.playerZ)) {
      const station = STATIONS[this.trainState.currentStationIndex];
      return {
        id: 'board_local_train',
        kind: 'train_board',
        label: `Board ${this.trainState.trainName} (${this.trainState.trainNumber})`,
        sublabel: station ? `${station.name} · Choose Stops, Driver Mode & Ticket` : 'Choose Stops & Driver Mode',
        x: this.trainState.worldX,
        y: 1.5,
        z: this.trainState.worldZ,
        radius: 13.5,
      };
    }

    const canBoardDispatched =
      this.busDispatch.phase === 'arrived_pickup' &&
      Math.hypot(this.playerX - this.busState.worldX, this.playerZ - this.busState.worldZ) < 12.5;
    if (canBoardDispatched || canBoardBus(this.busState, this.playerX, this.playerZ)) {
      const stop = BUS_STOPS[this.busState.currentStopIndex];
      return {
        id: 'board_rural_bus',
        kind: 'bus_board',
        label: canBoardDispatched
          ? `Board Mobile Bus -> ${this.busDispatch.destination?.label ?? 'Destination'}`
          : 'Board Countryside Bus',
        sublabel: canBoardDispatched
          ? 'Your on-demand pickup bus is waiting!'
          : stop
          ? `${stop.name} · கிராமப் பேருந்து`
          : 'Rural Bus',
        x: this.busState.worldX,
        y: 1.5,
        z: this.busState.worldZ,
        radius: 12.5,
      };
    }

    // Board the SSJ Tropical Sky Explorer Air Taxi when docked at a helipad or waiting at pickup!
    const distSkyTaxi = Math.hypot(this.playerX - this.skyTaxi.x, this.playerZ - this.skyTaxi.z);
    if (
      (this.skyTaxi.phase === 'arrived_pickup' || this.skyTaxi.phase === 'patrol_docked') &&
      distSkyTaxi < 13.5 &&
      Math.abs(this.playerY - this.skyTaxi.y) < 9.0
    ) {
      const nextStop = SKY_TAXI_STOPS[this.skyTaxi.nextStopIndex];
      return {
        id: 'board_sky_taxi',
        kind: 'sky_taxi_board',
        label:
          this.skyTaxi.phase === 'arrived_pickup'
            ? `Board Sky Taxi -> ${this.skyTaxi.destination?.label ?? 'Destination'}`
            : 'Board SSJ Sky Explorer Air Taxi',
        sublabel:
          this.skyTaxi.phase === 'arrived_pickup'
            ? 'Your on-demand Air Taxi is hovering right here!'
            : `Scheduled Air Route · Next pad: ${nextStop?.name ?? 'Helipad'}`,
        x: this.skyTaxi.x,
        y: this.skyTaxi.y,
        z: this.skyTaxi.z,
        radius: 13.5,
      };
    }

    // Dual rooftop helipad quick-board prompts (Home Helipad & AVS Snow Residence Helipad)
    if (
      Math.hypot(this.playerX - HOME_HELIPAD_POS.x, this.playerZ - HOME_HELIPAD_POS.z) < 7.5 &&
      Math.abs(this.playerY - HOME_HELIPAD_POS.y) < 4.5
    ) {
      return {
        id: 'fly_sky_home_pad',
        kind: 'sky_explorer_fly',
        label: 'Fly SSJ Tropical Sky Explorer (Home Helipad)',
        sublabel: 'En Illam Rooftop Helipad · Hover & Fly Anywhere',
        x: HOME_HELIPAD_POS.x,
        y: HOME_HELIPAD_POS.y,
        z: HOME_HELIPAD_POS.z,
        radius: 7.5,
        metaId: 'home',
      };
    }
    if (
      Math.hypot(this.playerX - AVS_HELIPAD_POS.x, this.playerZ - AVS_HELIPAD_POS.z) < 8.0 &&
      Math.abs(this.playerY - AVS_HELIPAD_POS.y) < 4.8
    ) {
      return {
        id: 'fly_sky_avs_pad',
        kind: 'sky_explorer_fly',
        label: 'Fly SSJ Tropical Sky Explorer (AVS Helipad)',
        sublabel: 'AVS Snow Residence Rooftop Helipad · Hover & Fly Anywhere',
        x: AVS_HELIPAD_POS.x,
        y: AVS_HELIPAD_POS.y,
        z: AVS_HELIPAD_POS.z,
        radius: 8.0,
        metaId: 'avs',
      };
    }

    const safariCar = this.dinosaurIslandState.safariCar;
    if (Math.hypot(this.playerX - safariCar.x, this.playerZ - safariCar.z) <= 4.8) {
      return {
        id: 'safari_car_prompt',
        kind: 'safari_car_drive',
        label: 'Drive Safari 4x4 Car',
        sublabel: 'SSJ Dinosaur Island · Fire AK-47 While Driving',
        x: safariCar.x,
        y: walkableHeightAt(safariCar.x, safariCar.z) + 1.0,
        z: safariCar.z,
        radius: 4.8,
        locationId: 'dinosaur_island',
      };
    }

    // Surface-parked Vault Cars & Surface Batmobile re-boarding prompts
    for (const car of this.homeVaultState.cars) {
      if (car.inVault) continue;
      if (Math.hypot(this.playerX - car.x, this.playerZ - car.z) <= 4.3) {
        const spec = getVaultCarSpec(car.id);
        return {
          id: `surface_vault_car_${car.id}`,
          kind: 'vault_car_drive',
          label: `Drive ${spec.name}`,
          sublabel: 'Secret Underground Garage Fleet · Turbo Boost [Shift]',
          x: car.x,
          y: car.y + 0.8,
          z: car.z,
          radius: 4.3,
          metaId: car.id,
        };
      }
    }
    if (
      !this.batmobileState.inVault &&
      Math.hypot(this.playerX - this.batmobileState.x, this.playerZ - this.batmobileState.z) <= 4.8
    ) {
      return {
        id: 'surface_batmobile_drive',
        kind: 'batmobile_drive',
        label: 'Drive The Tumbler Batmobile',
        sublabel: 'Armoured Jet Afterburner · Press [E] to Drive',
        x: this.batmobileState.x,
        y: this.batmobileState.y + 0.9,
        z: this.batmobileState.z,
        radius: 4.8,
      };
    }

    const scaleMetrics = getScaleGameplayMetrics(
      this.icelandState.playerScale,
      this.isSitting,
      this.transportMode === 'bicycle'
    );

    let best: InteractableItem | null = null;
    let bestDist = Infinity;
    const midnightItems = this.midnightPortal.getActiveInteractables(this.timeHours);
    const candidates = [
      ...this.allInteractables,
      ...this.frozenKingdom.surfaceInteractables,
      ...midnightItems,
    ];
    for (const item of candidates) {
      // Keep the secret floor hatch entrance hidden until the house button opens it!
      if (item.kind === 'home_vault_enter' && this.homeVaultState.hatchOpenProgress < 0.35) {
        continue;
      }
      if (Math.abs(this.playerY - item.y) > 2.2 + scaleMetrics.interactionRadiusBonus * 0.35) continue;
      const d = Math.hypot(this.playerX - item.x, this.playerZ - item.z);
      const effectiveRadius =
        item.kind === 'giant_igloo_man' || item.kind === 'iceland_return'
          ? item.radius + scaleMetrics.interactionRadiusBonus
          : item.radius + scaleMetrics.interactionRadiusBonus * 0.35;
      if (d <= effectiveRadius && d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  private updateSimulation(dt: number): void {
    if (this.suspended) return;

    // 1. Dynamic day/night cycle
    if (this.mode !== 'paused') {
      if (this.settings.dayCycleMode === 'dynamic') {
        this.timeHours = normalizeHours(this.timeHours + dt * 0.045);
      } else if (this.settings.dayCycleMode === 'slow') {
        this.timeHours = normalizeHours(this.timeHours + dt * 0.012);
      }
    }

    // Gather player directional inputs early so Train & Bus Driver Modes can use them immediately
    let keyForward = 0;
    let keyRight = 0;
    if (this.mode === 'playing') {
      if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) keyForward += 1;
      if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) keyForward -= 1;
      if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) keyRight += 1;
      if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) keyRight -= 1;
      if (this.keysHeld.has('KeyQ')) {
        this.smoothCam.targetYaw += dt * 1.45 * this.settings.cameraSensitivity;
        this.smoothCam.manualOrbitCooldown = 1.8;
      }
    }
    const combined = combineMovementInput(keyForward, keyRight, this.joyForward, this.joyRight);
    const isSprinting =
      this.mobileSprint ||
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight');

    // 2. Step Train & Rural Bus (Auto Pilot, Mobile Dispatch, or Manual Driver Mode)
    if (this.mode !== 'paused') {
      if (this.activeVehicle === 'train' && this.trainDriverMode) {
        const trainBrake =
          this.trainManualBrake || (this.mode === 'playing' && this.keysHeld.has('Space'));
        this.trainState = stepTrainManualDrive(
          this.trainState,
          this.mode === 'playing' ? combined.forward : 0,
          trainBrake,
          this.trainManualDoors,
          dt
        );
      } else {
        this.trainState = stepTrainState(this.trainState, dt);
      }

      if (this.activeVehicle === 'bus' && this.busDriverMode) {
        const busBrake = this.mode === 'playing' && this.keysHeld.has('Space');
        this.busState = stepBusManualDrive(
          this.busState,
          this.mode === 'playing' ? combined.forward : 0,
          this.mode === 'playing' ? combined.right : 0,
          busBrake,
          this.busManualDoors,
          dt
        );
      } else if (this.busDispatch.phase !== 'idle') {
        const dispStep = stepDispatchedBus(this.busState, this.busDispatch, dt);
        this.busState = dispStep.bus;
        this.busDispatch = dispStep.dispatch;
        if (dispStep.justArrivedForPickup) {
          this.audio.playStationChime();
          this.audio.playDoorChime();
          this.showNotice(this.busDispatch.statusMessage);
          this.emitHudSnapshot();
        }
        if (dispStep.justArrivedAtDropoff) {
          this.audio.playStationChime();
          this.audio.playDoorChime();
          if (this.activeVehicle === 'bus') {
            const dropX = this.busState.worldX + Math.cos(this.busState.heading) * 3.4;
            const dropZ = this.busState.worldZ - Math.sin(this.busState.heading) * 3.4;
            this.activeVehicle = 'none';
            this.playerX = dropX;
            this.playerZ = dropZ;
            this.playerY = walkableHeightAt(dropX, dropZ);
            this.playerHeading = this.busState.heading;
            this.companionState.x = dropX - 1.4;
            this.companionState.z = dropZ + 0.7;
            this.companionState.y = this.playerY;
            this.companionState.activity = 'idle';
            this.snapThirdPersonCamera();
          }
          this.showNotice(
            `Dropped off safely at ${this.busDispatch.destination?.label ?? 'your destination'}!`
          );
          this.emitHudSnapshot();
        }
      } else {
        this.busState = stepBusState(this.busState, dt);
      }

      // Step SSJ Tropical Sky Explorer Air Taxi (scheduled 5-pad aerial loop OR mobile on-demand pickup/dropoff!)
      const taxiStep = stepSkyTaxiState(this.skyTaxi, dt);
      this.skyTaxi = taxiStep.state;
      if (taxiStep.justArrivedPickup) {
        this.audio.playStationChime();
        this.showNotice(this.skyTaxi.statusMessage);
        this.emitHudSnapshot();
      }
      if (taxiStep.justArrivedDropoff) {
        this.audio.playStationChime();
        this.audio.playDoorChime();
        const destLabel = this.skyTaxi.destination?.label ?? 'your destination';
        const dropX = this.skyTaxi.x + Math.cos(this.skyTaxi.heading) * 3.0;
        const dropZ = this.skyTaxi.z - Math.sin(this.skyTaxi.heading) * 3.0;
        const dropY = walkableHeightWithFloor(dropX, dropZ, this.skyTaxi.y);
        this.playerX = dropX;
        this.playerZ = dropZ;
        this.playerY = dropY;
        this.companionState.x = dropX - 1.4;
        this.companionState.z = dropZ + 0.8;
        this.companionState.y = dropY;
        this.companionState.activity = 'idle';
        this.snapThirdPersonCamera();
        this.showNotice(`Sky Explorer Taxi landed safely at ${destLabel}!`);
        this.emitHudSnapshot();
      }

      // Refresh Midnight Frontier colliders whenever Night <-> Morning transitions!
      const midnightOpenNow = isMidnightFrontierOpen(this.timeHours);
      if (midnightOpenNow !== this.prevMidnightOpen) {
        this.prevMidnightOpen = midnightOpenNow;
        this.refreshDynamicColliders();
      }

      if (
        this.trainState.lastPassedStationIndex !== null &&
        this.trainState.lastPassedStationIndex !== this.prevPassedStationIndex
      ) {
        this.prevPassedStationIndex = this.trainState.lastPassedStationIndex;
        if (this.activeVehicle === 'train' && !this.trainDriverMode) {
          const skipped = STATIONS[this.trainState.lastPassedStationIndex];
          if (skipped) {
            this.showNotice(`Express pass-through: ${skipped.name} (skipped per your route)`);
          }
        }
      }

      if (this.trainState.phase !== this.prevTrainPhase) {
        const distToTrain = Math.hypot(
          this.playerX - this.trainState.worldX,
          this.playerZ - this.trainState.worldZ
        );
        if (this.trainState.phase === 'stopped' && (this.activeVehicle === 'train' || distToTrain < 48)) {
          this.triggerStationAnnouncement(this.trainState.currentStationIndex, 'arrived');
          this.audio.playDoorChime();
          if (this.activeVehicle === 'train' && !this.trainDriverMode) {
            const st = STATIONS[this.trainState.currentStationIndex];
            if (st) {
              const isFinal = this.trainState.routePlan?.destinationIndex === this.trainState.currentStationIndex;
              if (isFinal && st.connectsToIceland) {
                this.showNotice(`Arrived at ${st.name} · Exit or transfer into Panimalai Iceland!`);
              } else if (isFinal) {
                this.showNotice(`Arrived at final destination: ${st.name} (${st.jpName})`);
              } else {
                this.showNotice(`Selected stop: ${st.name} · Doors opening`);
              }
            }
          }
        } else if (this.trainState.phase === 'departing' && (this.activeVehicle === 'train' || distToTrain < 46)) {
          this.triggerStationAnnouncement(this.trainState.currentStationIndex, 'departing');
        } else if (this.trainState.phase === 'approaching' && (this.activeVehicle === 'train' || distToTrain < 95)) {
          this.audio.playDistantTrainHorn(Math.max(0.25, 1 - distToTrain / 110));
          if (this.activeVehicle === 'train' || distToTrain < 55) {
            this.triggerStationAnnouncement(this.trainState.nextStationIndex, 'approaching');
          }
        }
        this.prevTrainPhase = this.trainState.phase;
      }

      // Station PA timer & periodic regional ambient platform announcements while waiting near a station
      if (this.stationAnnouncementTimer > 0) {
        this.stationAnnouncementTimer = Math.max(0, this.stationAnnouncementTimer - dt);
        if (this.stationAnnouncementTimer <= 0) {
          this.activeStationAnnouncement = null;
        }
      }
      if (!this.inUndergroundCave && this.mode === 'playing') {
        const nearStIdx = findNearbyStationIndex(this.playerX, this.playerZ, 34);
        if (nearStIdx !== null && this.activeVehicle === 'none') {
          this.ambientPaCooldown -= dt;
          if (this.ambientPaCooldown <= 0 && !this.activeStationAnnouncement) {
            this.triggerStationAnnouncement(nearStIdx, 'ambient');
            this.ambientPaCooldown = 26;
          }
        } else {
          this.ambientPaCooldown = Math.min(this.ambientPaCooldown, 8);
        }
      }
    }

    // 3. Player, Boat & Vehicle Locomotion
    let moveSpeed = 0;
    this.currentTurnRate = 0;

    // 2B. Iceland Temporary Giant Player Transformation (disabled inside Underground Caves so camera stays inside caverns!)
    if (this.inUndergroundCave) {
      this.icelandState = {
        ...this.icelandState,
        inIceland: false,
        playerScale: 1.0,
        targetScale: 1.0,
        isGiant: false,
        transformProgress: 0,
        playerHeightMeters: 1.68,
      };
    } else {
      const effectiveScalePos =
        this.activeVehicle === 'none'
          ? { x: this.playerX, z: this.playerZ }
          : { x: 0, z: 10 }; // Riding vehicles outside Iceland stays normal scale
      this.icelandState = stepIcelandState(
        this.icelandState,
        effectiveScalePos.x,
        effectiveScalePos.z,
        dt
      );
      if (this.icelandState.inIceland !== this.prevInIceland) {
        this.prevInIceland = this.icelandState.inIceland;
        if (!this.icelandState.stayGiantThroughout) {
          if (this.icelandState.inIceland) {
            this.transportMode = 'walk';
            this.audio.playIcelandTransform(true);
            this.showNotice(
              `Entered Panimalai Iceland! Transforming into Giant Form (${GIANT_PLAYER_HEIGHT_M.toFixed(1)}m)`
            );
          } else {
            this.audio.playIcelandTransform(false);
            this.showNotice('Left Panimalai Iceland — Restoring normal scale (1.68m)');
          }
        }
      }
    }
    const scaleMetrics = getScaleGameplayMetrics(
      this.icelandState.playerScale,
      this.isSitting,
      this.transportMode === 'bicycle'
    );

    if (this.skyTaxi.playerOnboard) {
      this.isSwimming = false;
      this.playerX = this.skyTaxi.x;
      this.playerY = this.skyTaxi.y;
      this.playerZ = this.skyTaxi.z;
      this.playerHeading = this.skyTaxi.heading;
    } else if (this.mode === 'playing' && this.activeVehicle === 'none') {
      // Smoothly ramp raw WASD / joystick inputs so starts, stops, and diagonal turns feel silky & seamless
      const smoothMove = filterMovementInput(
        this.smoothLoco,
        combined.forward,
        combined.right,
        dt,
        this.heroState.isFlying
      );
      const hasMove = smoothMove.magnitude > 0.012 || combined.magnitude > 0.01;
      if (hasMove && this.isSitting) {
        this.isSitting = false;
        this.sittingSpot = null;
      }

      if (!this.isSitting) {
        const heroMul = computeHeroMovementMultipliers(this.heroState.activeHeroId);
        const heroSpec = this.heroState.activeHeroId
          ? getHeroById(this.heroState.activeHeroId)
          : null;

        // Tick hero ability timers
        if (this.heroState.powerCooldown > 0) {
          this.heroState.powerCooldown = Math.max(0, this.heroState.powerCooldown - dt);
        }
        if (this.heroState.attackAnimTimer > 0) {
          this.heroState.attackAnimTimer = Math.max(0, this.heroState.attackAnimTimer - dt);
        }
        if (this.heroState.secondaryTimer > 0) {
          this.heroState.secondaryTimer = Math.max(0, this.heroState.secondaryTimer - dt);
          if (this.heroState.secondaryTimer === 0) {
            this.heroState.energyShieldActive = false;
            this.heroState.detectiveVisionActive = false;
            this.heroState.spiderSenseActive = false;
          }
        }

        // Branch 0: Deployable 3D Parachute Glide (works anywhere across the entire open world!)
        if (
          this.parachuteState.active &&
          !this.inUndergroundCave &&
          !this.inUndergroundMetro &&
          !this.homeVaultState.inVault
        ) {
          this.isSwimming = false;
          const groundY = walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
          const pRes = stepParachuteGlide(
            this.parachuteState,
            this.playerX,
            this.playerY,
            this.playerZ,
            smoothMove.forward,
            smoothMove.right,
            this.camYaw,
            groundY,
            dt
          );
          this.playerX = pRes.x;
          this.playerY = pRes.y;
          this.playerZ = pRes.z;
          if (pRes.heading !== null) this.playerHeading = pRes.heading;
          this.parachuteState = pRes.state;
          moveSpeed = pRes.state.glideSpeed;
          if (pRes.landed) {
            this.audio.playLand(0.95);
            this.showNotice('Parachute Touchdown! Smooth landing!');
          }
        }
        // Branch A: Real Pendulum Spider-Man Web-Swinging (works EVERYWHERE with terrain floor awareness!)
        else if (this.heroState.isWebSwinging && this.webSwingState.active) {
          const swingRes = stepWebSwingPhysics(
            this.webSwingState,
            this.playerX,
            this.playerY,
            this.playerZ,
            smoothMove.forward,
            smoothMove.right,
            this.camYaw,
            isSprinting,
            dt
          );
          const localMinY = Math.max(2.2, walkableHeightAt(swingRes.x, swingRes.z) + 2.2);
          this.playerX = swingRes.x;
          this.playerY = Math.max(localMinY, swingRes.y);
          this.playerZ = swingRes.z;
          this.playerHeading = swingRes.heading;
          this.webSwingState = swingRes.swing;
          this.playerVx = swingRes.swing.vx;
          this.playerVz = swingRes.swing.vz;
          this.heroState.flightSpeedKmh = Math.round(swingRes.speed * 3.6);
          moveSpeed = swingRes.speed;
        }
        // Branch B: Long-Distance 3D Controlled Superhero Flight (Iron Man Classic / Advanced / Hulkbuster / Superman)
        else if (this.heroState.isFlying && heroSpec?.mobility.canFly) {
          this.isSwimming = false;
          const fwdX = -Math.sin(this.camYaw);
          const fwdZ = -Math.cos(this.camYaw);
          const rightX = Math.cos(this.camYaw);
          const rightZ = -Math.sin(this.camYaw);
          // Boosted long-distance supersonic superhero cruising speed!
          const flyCruise = (isSprinting ? 58.0 : 30.0) * heroMul.sprintSpeedMul;
          const targetVx = (fwdX * smoothMove.forward + rightX * smoothMove.right) * flyCruise;
          const targetVz = (fwdZ * smoothMove.forward + rightZ * smoothMove.right) * flyCruise;
          const flyRate = smoothMove.magnitude > 0.04 ? 5.6 : 4.2;
          const blend = 1 - Math.exp(-flyRate * dt);
          this.playerVx += (targetVx - this.playerVx) * blend;
          this.playerVz += (targetVz - this.playerVz) * blend;

          const ascend = this.keysHeld.has('Space') || this.skyAscendHeld;
          const descend =
            this.keysHeld.has('ControlLeft') ||
            this.keysHeld.has('ControlRight') ||
            this.keysHeld.has('KeyX') ||
            this.skyDescendHeld;
          const targetVy = ascend ? 21.0 : descend ? -18.5 : 0;
          this.heroState.flyVelY += (targetVy - this.heroState.flyVelY) * (1 - Math.exp(-5.8 * dt));

          let nextX = this.playerX + this.playerVx * dt;
          let nextZ = this.playerZ + this.playerVz * dt;
          // Expanded 600m long-distance aerial flight corridor over the whole world & infinite ocean!
          const flyDist = Math.hypot(nextX, nextZ);
          if (flyDist > 600) {
            const s = 600 / flyDist;
            nextX *= s;
            nextZ *= s;
          }
          if (this.playerY < 18) {
            const resolved = resolvePlayerCollision(
              nextX,
              nextZ,
              this.playerX,
              this.playerZ,
              0.55,
              this.allColliders,
              this.playerY,
              true
            );
            this.playerX = resolved.x;
            this.playerZ = resolved.z;
          } else {
            this.playerX = nextX;
            this.playerZ = nextZ;
          }

          const floorY = walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
          this.playerY = Math.min(168, Math.max(floorY, this.playerY + this.heroState.flyVelY * dt));
          if (this.playerY <= floorY + 0.08 && descend) {
            this.heroState.isFlying = false;
            this.heroState.flyVelY = 0;
            this.audio.playLand(heroSpec.mobility.heavyFootsteps ? 0.52 : 1.0);
          }

          moveSpeed = Math.hypot(this.playerVx, this.playerVz);
          this.heroState.flightSpeedKmh = Math.round(moveSpeed * 3.6);
        }
        // Branch C: Standard Ground, Rooftop & Batman Cape Glide Locomotion
        else {
          const activeMode =
            this.icelandState.isGiant || this.isSwimming || this.heroState.activeHeroId
              ? 'walk'
              : this.transportMode;
          const spec = TRANSPORT_SPECS[activeMode];
          const swimSpeedFactor = this.isSwimming ? 0.72 : 1.0;
          const glideBonus = this.heroState.isGliding ? 1.85 : 1.0;
          const maxSpeed =
            (isSprinting ? spec.sprintSpeed * heroMul.sprintSpeedMul : spec.cruiseSpeed * heroMul.walkSpeedMul) *
            scaleMetrics.moveSpeedMultiplier *
            swimSpeedFactor *
            glideBonus;

          let targetVx = 0;
          let targetVz = 0;
          if (smoothMove.magnitude > 0.01) {
            const fwdX = -Math.sin(this.camYaw);
            const fwdZ = -Math.cos(this.camYaw);
            const rightX = Math.cos(this.camYaw);
            const rightZ = -Math.sin(this.camYaw);

            targetVx = (fwdX * smoothMove.forward + rightX * smoothMove.right) * maxSpeed;
            targetVz = (fwdZ * smoothMove.forward + rightZ * smoothMove.right) * maxSpeed;
          } else if (this.heroState.isGliding) {
            targetVx = Math.sin(this.playerHeading) * 11.5;
            targetVz = Math.cos(this.playerHeading) * 11.5;
          }

          const rate = smoothMove.magnitude > 0.01 ? spec.accel * 0.86 : spec.decel * 0.84;
          const blend = 1 - Math.exp(-rate * dt);
          this.playerVx += (targetVx - this.playerVx) * blend;
          this.playerVz += (targetVz - this.playerVz) * blend;

          const nextX = this.playerX + this.playerVx * dt;
          const nextZ = this.playerZ + this.playerVz * dt;
          if (this.homeVaultState.inVault) {
            const vRes = clampVaultPosition(nextX, nextZ, 1.35);
            this.playerX = vRes.x;
            this.playerZ = vRes.z;
          } else if (this.inUndergroundMetro) {
            const mRes = clampUndergroundMetroPosition(nextX, nextZ, this.playerX, this.playerZ);
            this.playerX = mRes.x;
            this.playerZ = mRes.z;
          } else if (this.inUndergroundCave) {
            if (isPointInsideCaveWorld(nextX, nextZ)) {
              this.playerX = nextX;
              this.playerZ = nextZ;
            } else if (isPointInsideCaveWorld(nextX, this.playerZ)) {
              this.playerX = nextX;
            } else if (isPointInsideCaveWorld(this.playerX, nextZ)) {
              this.playerZ = nextZ;
            }
          } else {
            const resolved = resolvePlayerCollision(
              nextX,
              nextZ,
              this.playerX,
              this.playerZ,
              scaleMetrics.collisionRadius * (heroSpec?.mobility.heavyFootsteps ? 1.35 : 1.0),
              this.allColliders,
              this.playerY,
              true
            );
            this.playerX = resolved.x;
            this.playerZ = resolved.z;
          }

          const wasSwimming = this.isSwimming;
          const groundRefY = this.playerY - this.jumpState.offsetY;
          const groundY = this.homeVaultState.inVault
            ? VAULT_FLOOR_Y
            : this.inUndergroundMetro
              ? getUndergroundMetroFloorY(this.playerX, this.playerZ)
              : this.inUndergroundCave
                ? getCaveFloorHeightAt(this.playerX, this.playerZ)
                : walkableHeightWithFloor(this.playerX, this.playerZ, groundRefY);

          const effWaterLevel = getEffectiveWaterLevel(this.extremeWeatherState.floodLevel);
          const floodedHere =
            !this.inUndergroundCave &&
            !this.homeVaultState.inVault &&
            this.extremeWeatherState.floodLevel > WATER_LEVEL + 0.15 &&
            groundY < effWaterLevel - 0.14;
          const onWater =
            !this.inUndergroundCave &&
            !this.homeVaultState.inVault &&
            ((isSwimmableWaterAt(this.playerX, this.playerZ) && groundY < WATER_LEVEL - 0.12) ||
              floodedHere);
          this.isSwimming = onWater;

          if (this.heroState.isGliding) {
            this.playerY = Math.max(groundY, this.playerY - 3.2 * dt);
            if (this.playerY <= groundY + 0.08) {
              this.heroState.isGliding = false;
              this.audio.playLand(0.95);
            }
          } else {
            const jumpStep = stepJumpState(this.jumpState, dt, {
              scale: this.icelandState.playerScale * Math.min(1.6, heroMul.jumpMul),
              transportMode: activeMode,
              canJump: this.mode === 'playing' && !this.isSitting,
            });
            this.jumpState = jumpStep.state;
            if (jumpStep.jumped) {
              this.audio.playJump(
                scaleMetrics.footstepPitchMultiplier * (heroSpec?.mobility.heavyFootsteps ? 0.55 : 1.0)
              );
            }
            if (jumpStep.landed) {
              if (onWater) {
                this.audio.playBoatSplash();
              } else {
                this.audio.playLand(
                  scaleMetrics.footstepPitchMultiplier * (heroSpec?.mobility.heavyFootsteps ? 0.5 : 1.0)
                );
              }
            }

            if (onWater) {
              this.transportMode = 'walk';
              const waterSurfaceY = effWaterLevel - 0.52 * this.icelandState.playerScale;
              this.playerY = waterSurfaceY + this.jumpState.offsetY;
              if (!wasSwimming) {
                this.audio.playBoatSplash();
                this.showNotice(
                  floodedHere
                    ? 'Swimming through Floodwater · Use WASD / Joystick to swim!'
                    : 'Swimming in clear water · Use WASD / Joystick to swim · Shift to sprint-swim!'
                );
              }
            } else if (this.playerY > groundY + this.jumpState.offsetY + 0.35 && !this.jumpState.isAirborne) {
              // Smooth gravity drop off skyscrapers
              this.playerY = Math.max(groundY, this.playerY - 18.0 * dt);
            } else {
              this.playerY = groundY + this.jumpState.offsetY;
            }
          }

          moveSpeed = Math.hypot(this.playerVx, this.playerVz);
          this.heroState.flightSpeedKmh = Math.round(moveSpeed * 3.6);
        }

        // Critically damped shortest-arc heading, smooth visual Y across stairs/curbs, and dynamic bank/lean for Player & Heroes!
        const hasHeadingTarget =
          this.parachuteState.active ||
          this.heroState.isWebSwinging ||
          moveSpeed > (this.heroState.isFlying ? 0.35 : 0.18);
        const desiredHeading =
          this.parachuteState.active || this.heroState.isWebSwinging
            ? this.playerHeading
            : moveSpeed > 0.18
              ? Math.atan2(this.playerVx, this.playerVz)
              : this.playerHeading;
        const turnSmooth = this.heroState.isFlying
          ? 0.115
          : this.transportMode === 'bicycle'
            ? 0.14
            : this.transportMode === 'skateboard'
              ? 0.115
              : 0.082;
        const locoVis = stepSmoothLocomotionVisuals(this.smoothLoco, {
          dt,
          physX: this.playerX,
          physY: this.playerY,
          physZ: this.playerZ,
          targetHeading: desiredHeading,
          hasHeadingTarget,
          speed: moveSpeed,
          verticalVel: this.heroState.isFlying ? this.heroState.flyVelY : this.jumpState.velocityY,
          isAirborne: this.jumpState.isAirborne,
          isFlying: this.heroState.isFlying,
          isGliding: this.heroState.isGliding,
          isWebSwinging: this.heroState.isWebSwinging,
          isHero: this.heroState.activeHeroId !== null,
          turnSmoothTime: turnSmooth,
        });
        this.playerHeading = locoVis.heading;
        this.currentTurnRate = locoVis.turnRate;
        this.smoothVisualY = locoVis.visualY;
        this.smoothBankRad = locoVis.bankRad;
        this.smoothPitchLeanRad = locoVis.pitchLeanRad;
        this.smoothFlightSurge = locoVis.flightSurgeBlend;
      } else {
        this.smoothVisualY = this.playerY;
      }
      this.lastMoveSpeed = moveSpeed;
      this.lastIsSprinting = isSprinting;
    } else if (this.activeVehicle === 'camper') {
      this.isSwimming = false;
      const braking = this.mode === 'playing' && this.keysHeld.has('Space');
      this.camperState = stepCamperState(
        this.camperState,
        this.mode === 'playing' ? combined.forward : 0,
        this.mode === 'playing' ? combined.right : 0,
        braking,
        this.allColliders,
        dt
      );
      moveSpeed = Math.abs(this.camperState.speed);
      this.playerX = this.camperState.x;
      this.playerZ = this.camperState.z;
      this.playerY = walkableHeightAt(this.camperState.x, this.camperState.z) + 0.65;
      this.playerHeading = this.camperState.heading;
    } else if (this.activeVehicle === 'safari_car') {
      this.isSwimming = false;
      const nextCar = stepSafariCarState(
        this.dinosaurIslandState.safariCar,
        this.mode === 'playing' ? combined.forward : 0,
        this.mode === 'playing' ? combined.right : 0,
        isSprinting,
        this.dinosaurIslandState.wallsIntact,
        dt
      );
      this.dinosaurIslandState = {
        ...this.dinosaurIslandState,
        safariCar: nextCar,
      };
      moveSpeed = Math.abs(nextCar.speed);
      this.playerX = nextCar.x;
      this.playerZ = nextCar.z;
      this.playerY = walkableHeightAt(nextCar.x, nextCar.z) + 0.8;
      this.playerHeading = nextCar.heading;
    } else if (this.activeVehicle === 'boat' && this.activeBoatId) {
      this.isSwimming = false;
      const idx = this.boats.findIndex((b) => b.id === this.activeBoatId);
      if (idx >= 0) {
        this.boats[idx] = stepBoatState(
          this.boats[idx],
          this.mode === 'playing' ? combined.forward : 0,
          this.mode === 'playing' ? combined.right : 0,
          isSprinting,
          dt
        );
        const b = this.boats[idx];
        moveSpeed = Math.abs(b.speed);
        this.playerX = b.x;
        this.playerZ = b.z;
        this.playerY = 0.2;
        this.playerHeading = b.heading;
      }
    } else if (this.activeVehicle === 'train') {
      this.isSwimming = false;
      this.playerX = this.trainState.worldX;
      this.playerZ = this.trainState.worldZ;
      this.playerY = 1.6;
      this.playerHeading = this.trainState.heading;
      // Walk freely inside the passenger carriage aisle in Cabin Walk view!
      if (this.mode === 'playing' && this.trainViewMode === 'cabin') {
        const walkSpeed = 3.2;
        this.cabinWalkZ = THREE.MathUtils.clamp(
          this.cabinWalkZ + combined.forward * walkSpeed * dt,
          -4.6,
          4.6
        );
        this.cabinWalkX = THREE.MathUtils.clamp(
          this.cabinWalkX - combined.right * 1.4 * dt,
          -0.36,
          0.36
        );
      }
    } else if (this.activeVehicle === 'bus') {
      this.isSwimming = false;
      this.playerX = this.busState.worldX;
      this.playerZ = this.busState.worldZ;
      this.playerY = walkableHeightAt(this.busState.worldX, this.busState.worldZ) + 1.4;
      this.playerHeading = this.busState.heading;
    } else if (this.activeVehicle === 'sky_explorer') {
      this.isSwimming = false;
      const ascend =
        this.mode === 'playing' && (this.keysHeld.has('Space') || this.skyAscendHeld);
      const descend =
        this.mode === 'playing' &&
        (this.keysHeld.has('ControlLeft') ||
          this.keysHeld.has('ControlRight') ||
          this.keysHeld.has('KeyQ') ||
          this.skyDescendHeld);
      this.skyExplorerState = stepSkyExplorerState(
        this.skyExplorerState,
        this.mode === 'playing' ? combined.forward : 0,
        this.mode === 'playing' ? combined.right : 0,
        ascend,
        descend,
        isSprinting,
        dt
      );
      moveSpeed = Math.abs(this.skyExplorerState.forwardSpeed);
      this.playerX = this.skyExplorerState.x;
      this.playerY = this.skyExplorerState.y;
      this.playerZ = this.skyExplorerState.z;
      this.playerHeading = this.skyExplorerState.heading;
    } else if (this.activeVehicle === 'batmobile') {
      this.isSwimming = false;
      const braking = this.mode === 'playing' && this.keysHeld.has('Space');
      const batStep = stepBatmobileState(
        this.batmobileState,
        this.mode === 'playing' ? combined.forward : 0,
        this.mode === 'playing' ? combined.right : 0,
        this.mode === 'playing' && isSprinting,
        braking,
        dt
      );
      this.batmobileState = batStep.state;
      moveSpeed = Math.abs(this.batmobileState.speed);
      this.playerX = this.batmobileState.x;
      this.playerY = this.batmobileState.y + 0.85;
      this.playerZ = this.batmobileState.z;
      this.playerHeading = this.batmobileState.heading;

      if (batStep.exitedToSurface && this.homeVaultState.inVault) {
        this.homeVaultState = { ...this.homeVaultState, inVault: false };
        this.homeVaultWorld.chamberGroup.visible = false;
        this.setSurfaceGroupsVisible(true);
        this.batmobileWorld.group.visible = true;
        this.scene.background = null;
        this.container.dataset.inHomeVault = 'false';
        this.camYaw = this.batmobileState.heading + Math.PI;
        this.audio.playStationChime();
        this.showNotice('Drove The Tumbler Batmobile out of the Secret Underground Garage onto the open road!');
      }
    } else if (this.activeVehicle === 'vault_car' && this.homeVaultState.activeVaultCarId) {
      this.isSwimming = false;
      const carIdx = this.homeVaultState.cars.findIndex(
        (c) => c.id === this.homeVaultState.activeVaultCarId
      );
      if (carIdx >= 0) {
        const braking = this.mode === 'playing' && this.keysHeld.has('Space');
        const stepRes = stepVaultCarState(
          this.homeVaultState.cars[carIdx],
          this.mode === 'playing' ? combined.forward : 0,
          this.mode === 'playing' ? combined.right : 0,
          this.mode === 'playing' && isSprinting,
          braking,
          dt
        );
        const nextCars = [...this.homeVaultState.cars];
        nextCars[carIdx] = stepRes.state;
        this.homeVaultState = { ...this.homeVaultState, cars: nextCars };
        moveSpeed = Math.abs(stepRes.state.speed);
        this.playerX = stepRes.state.x;
        this.playerY = stepRes.state.y + 0.85;
        this.playerZ = stepRes.state.z;
        this.playerHeading = stepRes.state.heading;

        if (stepRes.exitedToSurface && this.homeVaultState.inVault) {
          this.homeVaultState = { ...this.homeVaultState, inVault: false };
          this.homeVaultWorld.chamberGroup.visible = false;
          this.setSurfaceGroupsVisible(true);
          this.scene.background = null;
          this.container.dataset.inHomeVault = 'false';
          this.camYaw = stepRes.state.heading + Math.PI;
          this.audio.playStationChime();
          const spec = getVaultCarSpec(stepRes.state.id);
          this.showNotice(`Drove ${spec.name} out of the Secret Underground Garage onto the countryside road!`);
        }
      }
    } else if (this.activeVehicle === 'airliner') {
      const ascend = this.keysHeld.has('Space') || this.skyAscendHeld;
      const descend =
        this.keysHeld.has('ControlLeft') ||
        this.keysHeld.has('ControlRight') ||
        this.keysHeld.has('KeyQ') ||
        this.keysHeld.has('KeyX') ||
        this.skyDescendHeld;
      this.airlinerState = stepAirlinerState(
        this.airlinerState,
        combined.forward,
        combined.right,
        ascend,
        descend,
        isSprinting,
        dt,
        walkableHeightAt,
        620
      );
      this.playerX = this.airlinerState.x;
      this.playerY = this.airlinerState.y + 2.4;
      this.playerZ = this.airlinerState.z;
      this.playerHeading = this.airlinerState.heading;
      moveSpeed = Math.abs(this.airlinerState.speed);
    }

    // Step Live Underground Subway Train & Active Station Transit Timer
    if (this.inUndergroundMetro) {
      if (this.subwayRideTimer > 0) {
        this.subwayRideTimer -= dt;
        this.subwayState = {
          ...this.subwayState,
          trainX: Math.min(96, this.subwayState.trainX + 42 * dt),
        };
        if (this.subwayRideTimer <= 0 && this.subwayTargetStationId) {
          const arrived = getMetroStationById(this.subwayTargetStationId);
          this.metroStationId = arrived.id;
          this.subwayTargetStationId = null;
          this.subwayRidingTo = null;
          this.airportMetroWorld.setUndergroundStationVisual(arrived.id);
          this.subwayState = {
            ...createInitialSubwayTrainState(),
            trainX: 0,
            speed: 0,
            phase: 'stopped',
            doorOpen: 1,
            dwellTimer: 9.5,
            statusLabel: 'Arrived · Doors Open',
          };
          this.audio.playStationChime();
          this.showNotice(`Arrived at ${arrived.name}! Take the escalators up or click Exit to Surface`);
          this.emitHudSnapshot();
        }
      } else {
        this.subwayState = stepSubwayTrainState(this.subwayState, dt);
      }
    }

    // Auto walk-in Midnight Frontier Portal trigger at Night!
    if (this.midnightPortalCooldown > 0) {
      this.midnightPortalCooldown = Math.max(0, this.midnightPortalCooldown - dt);
    }
    if (
      this.mode === 'playing' &&
      !this.inUndergroundCave &&
      !this.inUndergroundMetro &&
      this.activeVehicle === 'none' &&
      isMidnightFrontierOpen(this.timeHours) &&
      this.midnightPortalCooldown <= 0
    ) {
      const distPortal = Math.hypot(
        this.playerX - MIDNIGHT_FRONTIER_PORTAL_POS.x,
        this.playerZ - MIDNIGHT_FRONTIER_PORTAL_POS.z
      );
      if (distPortal < 3.15) {
        this.midnightPortalCooldown = 6.0;
        this.audio.playIcelandTransform(true);
        this.callbacks.onModeChangeRequest('midnight_frontier');
      }
    }

    // 4. Region discovery & Scenic Spot discovery
    const currentRegion = getRegionAt(this.playerX, this.playerZ);
    if (this.mode === 'playing') {
      if (currentRegion !== this.lastRegionId) {
        this.lastRegionId = currentRegion;
        const rLabel = REGION_LABELS[currentRegion];
        const firstTime = recordRegionVisit(
          this.companionMemory,
          currentRegion,
          `${rLabel.name} (${rLabel.tamil})`
        );
        if (firstTime) {
          this.showNotice(`Entered ${rLabel.name} · ${rLabel.tamil}`);
        }
        this.speakCompanion(currentRegion);
      }

      for (const spot of SCENIC_SPOTS) {
        if (!this.discoveredSpots.has(spot.id)) {
          const d = Math.hypot(this.playerX - spot.x, this.playerZ - spot.z);
          if (d <= spot.radius) {
            this.discoveredSpots.add(spot.id);
            this.showNotice(`Scenic Discovery · ${spot.name} (${spot.jpName})`);
          }
        }
      }
    }

    if (this.noticeTimer > 0) {
      this.noticeTimer -= dt;
      if (this.noticeTimer <= 0) {
        this.recentNotice = null;
      }
    }

    // 5. Atmosphere, Extreme Storm Simulation, Lighting, Sky, Architecture, Regions, Home, Vehicles
    this.extremeWeatherState = stepExtremeWeatherState(this.extremeWeatherState, this.weather, dt);
    if (this.extremeWeatherState.thunderTriggered && this.mode !== 'paused') {
      this.audio.playThunderClap(this.extremeWeatherState.thunderIntensity);
    }
    if (this.extremeWeatherState.tsunamiRoarTriggered && this.mode !== 'paused') {
      this.audio.playTsunamiRoar();
    }

    const palette = computeSkyPalette(this.timeHours, this.weather, this.season);
    const flash = this.extremeWeatherState.lightningFlash;
    const elev = palette.sunElevation;
    const az = palette.sunAzimuth;
    _sunDir.set(
      Math.cos(elev) * Math.sin(az),
      Math.sin(elev),
      Math.cos(elev) * Math.cos(az)
    ).normalize();

    this.sunLight.color.setRGB(
      Math.min(1, palette.sunColor.r + flash * 0.45),
      Math.min(1, palette.sunColor.g + flash * 0.52),
      Math.min(1, palette.sunColor.b + flash * 0.65)
    );
    this.sunLight.intensity = palette.sunIntensity + flash * 2.4;
    this.sunLight.position.set(
      this.playerX + _sunDir.x * 85,
      Math.max(12, _sunDir.y * 85),
      this.playerZ + _sunDir.z * 85
    );
    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);

    // Step smooth sliding floor hatch inside En Illam
    this.homeVaultState = stepSecretHatchAnimation(this.homeVaultState, dt);

    if (this.homeVaultState.inVault) {
      this.sunLight.color.setHex(0xe2e8f0);
      this.sunLight.intensity = 1.45;
      this.hemiLight.color.setHex(0xbae6fd);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 1.75;
      this.scene.environmentIntensity = 0.55;
      this.fog.color.setHex(0x0b1220);
      this.fog.density = 0.0045;
    } else if (this.inUndergroundMetro) {
      this.sunLight.color.setHex(0xe0f2fe);
      this.sunLight.intensity = 1.25;
      this.hemiLight.color.setHex(0xbae6fd);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 1.55;
      this.scene.environmentIntensity = 0.45;
      this.fog.color.setHex(0x0b1322);
      this.fog.density = 0.0085;
    } else if (this.inUndergroundCave) {
      this.sunLight.color.setHex(0x88e6ff);
      this.sunLight.intensity = 1.15;
      this.hemiLight.color.setHex(0x74e0ff);
      this.hemiLight.groundColor.setHex(0x283e5e);
      this.hemiLight.intensity = 1.45;
      this.scene.environmentIntensity = 0.42;
      this.fog.color.setHex(0x0f253a);
      this.fog.density = 0.0052;
    } else {
      this.hemiLight.color.setRGB(
        Math.min(1, palette.hemiSky.r + flash * 0.4),
        Math.min(1, palette.hemiSky.g + flash * 0.48),
        Math.min(1, palette.hemiSky.b + flash * 0.62)
      );
      this.hemiLight.groundColor.setRGB(palette.hemiGround.r, palette.hemiGround.g, palette.hemiGround.b);
      this.hemiLight.intensity = palette.hemiIntensity + flash * 0.95;
      this.scene.environmentIntensity = Math.min(0.45, palette.environmentIntensity + flash * 0.25);

      this.fog.color.setRGB(
        Math.min(1, palette.fogColor.r + flash * 0.25),
        Math.min(1, palette.fogColor.g + flash * 0.3),
        Math.min(1, palette.fogColor.b + flash * 0.4)
      );
      this.fog.density = palette.fogDensity;
    }

    _skyCol.setRGB(palette.horizon.r, palette.horizon.g, palette.horizon.b);
    _sunCol.setRGB(palette.sunColor.r, palette.sunColor.g, palette.sunColor.b);

    const trainDistToCrossing = Math.hypot(
      this.trainState.worldX - CROSSING_POINT.x,
      this.trainState.worldZ - CROSSING_POINT.z
    );
    const worldGlow = palette.worldLanternStrength;

    if (!this.inUndergroundCave && !this.inUndergroundMetro && !this.homeVaultState.inVault) {
      this.sceneBgColor.setRGB(palette.midSky.r, palette.midSky.g, palette.midSky.b);
      this.skyWater.update(
        this.elapsed,
        dt,
        palette,
        _sunDir,
        this.camera.position.x,
        this.camera.position.z
      );
      this.architecture.update({
        elapsed: this.elapsed,
        dt,
        timeHours: this.timeHours,
        lanternStrength: worldGlow,
        trainDistToCrossing,
      });
      this.nature.update(
        this.elapsed,
        dt,
        this.weather,
        palette.sunIntensity,
        currentRegion,
        this.playerX,
        this.playerZ,
        this.season
      );
      this.extremeWeather3D.update({
        elapsed: this.elapsed,
        dt,
        weather: this.weather,
        season: this.season,
        regionId: currentRegion,
        playerX: this.playerX,
        playerZ: this.playerZ,
        state: this.extremeWeatherState,
        sunDir: _sunDir,
        skyColor: _skyCol,
        fogColor: this.fog.color,
        fogDensity: this.fog.density,
      });

      const distToTrain = Math.hypot(
        this.playerX - this.trainState.worldX,
        this.playerZ - this.trainState.worldZ
      );
      const isNearOrRidingTrain =
        this.activeVehicle === 'train' || distToTrain < 78 || this.elapsed < 0.25;
      const isSteamVisible =
        this.activeVehicle === 'train' || distToTrain < 155 || this.elapsed < 0.25;
      const trainRegion = getRegionAt(this.trainState.worldX, this.trainState.worldZ);
      const trainTempC = computeEffectiveTemperatureC(
        this.season,
        this.weather,
        this.timeHours,
        trainRegion,
        this.manualTemperatureC
      );
      this.trainRig.update(
        this.trainState,
        dt,
        palette.lanternStrength,
        this.timeHours,
        this.weather,
        this.season,
        isNearOrRidingTrain,
        trainTempC,
        _skyCol.getHex(),
        this.renderer.getPixelRatio(),
        isSteamVisible,
        palette.nightDarkness
      );

      const distToHome = Math.hypot(
        this.playerX - HOME_CENTER.x,
        this.playerZ - HOME_CENTER.z
      );
      this.personalHome.group.visible =
        distToHome < 155 || this.heroState.isFlying || this.activeVehicle === 'airliner' || this.elapsed < 0.25;
      if (distToHome < 72 || this.elapsed < 0.25) {
        this.personalHome.applyHomeState(
          this.homeState,
          worldGlow,
          this.elapsed,
          this.homeVaultState.hatchOpenProgress
        );
      }

      this.regionsWorld.update(
        this.elapsed,
        dt,
        _sunDir,
        _skyCol,
        _sunCol,
        worldGlow,
        this.campingState,
        this.playerX,
        this.playerZ
      );
      this.vehiclesWorld.syncBus(this.busState, this.elapsed, worldGlow);
      this.vehiclesWorld.syncBoats(this.boats, this.elapsed);

      const distToForest = Math.hypot(
        this.playerX - ENCHANTED_FOREST_CENTER.x,
        this.playerZ - ENCHANTED_FOREST_CENTER.z
      );
      const distToCamper = Math.hypot(
        this.playerX - this.camperState.x,
        this.playerZ - this.camperState.z
      );
      this.enchantedForest.group.visible =
        this.activeVehicle === 'camper' ||
        distToForest < 175 ||
        distToCamper < 110 ||
        this.heroState.isFlying ||
        this.elapsed < 0.25;
      if (
        this.activeVehicle === 'camper' ||
        distToForest < 155 ||
        distToCamper < 95 ||
        this.elapsed < 0.25
      ) {
        this.enchantedForest.update(
          this.camperState,
          this.elapsed,
          dt,
          this.playerX,
          this.playerZ,
          worldGlow
        );
      }

      const isFireflyWindow = this.timeHours <= 6.2 || this.timeHours >= 17.2;
      if (isFireflyWindow) {
        this.firefliesWorld.update(
          this.elapsed,
          dt,
          this.timeHours,
          this.weather,
          this.renderer.getPixelRatio()
        );
      } else {
        this.firefliesWorld.group.visible = false;
      }

      this.wildlifeWorld.update(
        this.elapsed,
        dt,
        this.timeHours,
        this.weather,
        this.season,
        this.playerX,
        this.playerZ
      );
      if (this.birdFlockingWorld.group.visible) {
        const flockStats = this.birdFlockingWorld.update(
          this.elapsed,
          dt,
          this.timeHours,
          this.weather,
          this.season,
          this.playerX,
          this.playerZ
        );
        if (flockStats.activeFlocks !== this.lastFlockCountAttr) {
          this.lastFlockCountAttr = flockStats.activeFlocks;
          this.container.dataset.flockCount = String(flockStats.activeFlocks);
        }
        if (flockStats.activeBirds !== this.lastFlockBirdsAttr) {
          this.lastFlockBirdsAttr = flockStats.activeBirds;
          this.container.dataset.flockBirds = String(flockStats.activeBirds);
        }
      }
      this.peopleSystem.update(this.elapsed, dt, this.playerX, this.playerZ);

      // Live 3D Navigation Guide
      if (this.navTarget) {
        const navState = computeNavigationState(
          this.playerX,
          this.playerZ,
          this.playerHeading,
          this.navTarget
        );
        if (navState.arrived) {
          const arrivedName = this.navTarget.label;
          this.navTarget = null;
          this.navigationGuide.update(this.playerX, this.playerY, this.playerZ, null, this.elapsed);
          this.audio.playStationChime();
          this.showNotice(`Arrived at ${arrivedName}!`);
        } else {
          this.navigationGuide.update(
            this.playerX,
            this.playerY,
            this.playerZ,
            this.navTarget,
            this.elapsed
          );
        }
      } else {
        this.navigationGuide.update(this.playerX, this.playerY, this.playerZ, null, this.elapsed);
      }

      this.midnightPortal.update(this.timeHours, this.elapsed);

      // Zone-based distance culling & distant update skipping for far biomes & offshore islands
      const isHighAltitude =
        this.heroState.isFlying ||
        this.activeVehicle === 'airliner' ||
        this.activeVehicle === 'sky_explorer';
      const distToAvs = Math.hypot(
        this.playerX - AVS_SNOW_HOUSE_CENTER.x,
        this.playerZ - AVS_SNOW_HOUSE_CENTER.z
      );
      this.avsSnowHouse.group.visible = isHighAltitude || distToAvs < 185;
      this.frozenKingdom.surfaceGroup.visible = isHighAltitude || distToAvs < 210;
      if (distToAvs < 165 || this.elapsed < 0.25) {
        this.avsSnowHouse.update(worldGlow);
      }
      if (distToAvs < 200 || this.elapsed < 0.25) {
        this.frozenKingdom.update(this.elapsed, worldGlow, false);
      }

      const distToAirport = Math.hypot(
        this.playerX - AIRPORT_CENTER.x,
        this.playerZ - AIRPORT_CENTER.z
      );
      this.airportMetroWorld.surfaceGroup.visible =
        isHighAltitude || distToAirport < 230 || this.elapsed < 0.25;

      const distToExhibition = Math.hypot(
        this.playerX - EXHIBITION_ISLAND_CENTER.x,
        this.playerZ - EXHIBITION_ISLAND_CENTER.z
      );
      this.exhibitionComplexWorld.group.visible = isHighAltitude || distToExhibition < 215;
      if (distToExhibition < 185 || this.elapsed < 0.25) {
        this.exhibitionComplexWorld.update(
          this.elapsed,
          worldGlow,
          this.playerX,
          this.playerZ
        );
      }

      const distToDesert = Math.hypot(
        this.playerX - DESERT_BIOME_CENTER.x,
        this.playerZ - DESERT_BIOME_CENTER.z
      );
      this.desertOasisWorld.group.visible = isHighAltitude || distToDesert < 225;
      if (distToDesert < 195 || this.elapsed < 0.25) {
        this.desertOasisWorld.update(
          this.elapsed,
          dt,
          worldGlow,
          this.playerX,
          this.playerZ
        );
      }

      // Step Offshore SSJ Dinosaur Island (chasing T-Rex, wall shatters 1->4, Safari Car & AK-47 tracer)
      const distToDino = Math.hypot(
        this.playerX - DINOSAUR_ISLAND_CENTER.x,
        this.playerZ - DINOSAUR_ISLAND_CENTER.z
      );
      const onDinoIslandNow = isOnDinosaurIsland(this.playerX, this.playerZ);
      const safariActive = this.activeVehicle === 'safari_car';
      this.dinosaurIslandWorld.group.visible = onDinoIslandNow || safariActive || isHighAltitude || distToDino < 210;
      if (onDinoIslandNow || safariActive || distToDino < 210 || this.elapsed < 0.25) {
        if (this.mode !== 'paused') {
          const dinoStep = stepDinosaurIslandState(
            this.dinosaurIslandState,
            this.playerX,
            this.playerZ,
            onDinoIslandNow,
            dt
          );
          this.dinosaurIslandState = dinoStep.state;
          if (dinoStep.events.wallJustBrokenStage !== null) {
            this.dinosaurIslandWorld.triggerWallShatter(dinoStep.events.wallJustBrokenStage);
            this.audio.playWallBreakBoom(dinoStep.events.wallJustBrokenStage);
            this.refreshDynamicColliders();
            if (dinoStep.events.wallJustBrokenStage === 4) {
              this.showNotice('ALL 4 WALLS BROKEN! Open-island Endless T-Rex Chase unlocked!');
            }
            this.emitHudSnapshot();
          }
          if (dinoStep.events.dinoRoared) {
            this.audio.playDinoRoar();
          }
        }
        this.dinosaurIslandWorld.update(
          this.dinosaurIslandState,
          this.elapsed,
          dt,
          worldGlow
        );
      }

    } else if (this.homeVaultState.inVault) {
      this.sceneBgColor.setHex(0x0b1220);
    } else if (this.inUndergroundMetro) {
      this.sceneBgColor.setHex(0x0b1322);
    } else {
      // Underground Cave fast path: deep cavern backdrop & cave glow motes
      this.sceneBgColor.setHex(0x0f253a);
      this.frozenKingdom.update(this.elapsed, palette.lanternStrength, true);
    }

    // Update Standalone Superhero VFX, Batmobile, and Secret Underground Vault + Cars (both underground & surface!)
    const heroVfx: HeroVfxRenderInput = {};
    if (this.heroState.isWebSwinging && this.webSwingState.active) {
      heroVfx.webLine = {
        fromX: this.playerX,
        fromY: this.playerY + 1.5,
        fromZ: this.playerZ,
        toX: this.webSwingState.anchorX,
        toY: this.webSwingState.anchorY,
        toZ: this.webSwingState.anchorZ,
        color: 0xf8fafc,
      };
    }
    if (this.activeBeamVfx) {
      this.activeBeamVfx.timer -= dt;
      if (this.activeBeamVfx.timer <= 0) {
        this.activeBeamVfx = null;
      } else {
        heroVfx.energyBeam = {
          fromX: this.activeBeamVfx.fromX,
          fromY: this.activeBeamVfx.fromY,
          fromZ: this.activeBeamVfx.fromZ,
          toX: this.activeBeamVfx.toX,
          toY: this.activeBeamVfx.toY,
          toZ: this.activeBeamVfx.toZ,
          color: this.activeBeamVfx.color,
          radius: 0.16 * (this.activeBeamVfx.timer / this.activeBeamVfx.maxTime) + 0.05,
        };
      }
    }
    if (this.activeShockwaveVfx) {
      this.activeShockwaveVfx.timer -= dt;
      if (this.activeShockwaveVfx.timer <= 0) {
        this.activeShockwaveVfx = null;
      } else {
        const p = 1 - this.activeShockwaveVfx.timer / this.activeShockwaveVfx.maxTime;
        heroVfx.shockwave = {
          x: this.activeShockwaveVfx.x,
          y: this.activeShockwaveVfx.y,
          z: this.activeShockwaveVfx.z,
          progress: p,
          color: this.activeShockwaveVfx.color,
        };
      }
    }
    this.heroVfxWorld.update(heroVfx);

    const hasSurfaceVaultCar = this.homeVaultState.cars.some((c) => !c.inVault);
    if (this.homeVaultState.inVault || hasSurfaceVaultCar || this.elapsed < 0.25) {
      this.homeVaultWorld.update({
        inVault: this.homeVaultState.inVault,
        activeHeroId: this.heroState.activeHeroId,
        cars: this.homeVaultState.cars,
        elapsed: this.elapsed,
        dt,
      });
    }
    const showBatmobileNow =
      !this.inUndergroundCave &&
      !this.inUndergroundMetro &&
      Boolean(this.batmobileState.inVault) === this.homeVaultState.inVault;
    this.batmobileWorld.group.visible = showBatmobileNow;
    if (showBatmobileNow) {
      this.batmobileWorld.update(
        this.batmobileState,
        this.elapsed,
        this.homeVaultState.inVault ? 0.95 : worldGlow
      );
    }

    // Update Underground Metro Station, Dreamline International Airport, Airliner & 3D Parachute only when relevant
    if (!this.inUndergroundCave && !this.homeVaultState.inVault) {
      this.airportMetroWorld.update(
        this.elapsed,
        this.inUndergroundMetro ? 1.0 : worldGlow,
        this.inUndergroundMetro,
        this.subwayState,
        this.airlinerState,
        this.parachuteState,
        this.playerX,
        this.playerY,
        this.playerZ,
        this.playerHeading
      );
    }

    // Re-evaluate <= 3 active nearest dynamic lights at 4Hz (slashes fragment shader cost!)
    this.lightBudgetTimer += dt;
    if (this.lightBudgetTimer >= 0.25) {
      this.lightBudgetTimer = 0;
      this.updateLocalLightBudget();
    }

    if (!this.inUndergroundCave && !this.inUndergroundMetro && !this.homeVaultState.inVault) {
      this.skyExplorerWorld.sync(
        this.skyExplorerState,
        this.elapsed,
        this.activeVehicle === 'sky_explorer'
      );
      this.skyTaxiWorld.sync(
        {
          name: 'SSJ Sky Explorer Taxi',
          tamilName: 'வான்வழி டாக்சி',
          x: this.skyTaxi.x,
          y: this.skyTaxi.y,
          z: this.skyTaxi.z,
          heading: this.skyTaxi.heading,
          forwardSpeed: this.skyTaxi.speedKmh / 3.6,
          verticalSpeed: 0,
          yawRate: 0,
          roll: 0,
          pitch: this.skyTaxi.speedKmh > 15 ? -0.06 : 0,
          speedKmh: this.skyTaxi.speedKmh,
          altitudeM: this.skyTaxi.altitudeM,
          boostActive: this.skyTaxi.phase === 'flying_to_destination',
        },
        this.elapsed + 1.1,
        this.skyTaxi.playerOnboard
      );
    }

    // 6. Update Player Pose & Permanent Ice Companion Frosty Pose!
    if (this.activeVehicle === 'camper') {
      const driverSeat = this.enchantedForest.getDriverSeatTransform();
      const compSeat = this.enchantedForest.getCompanionSeatTransform();
      this.playerRig.setPose({
        x: driverSeat.position.x,
        y: driverSeat.position.y,
        z: driverSeat.position.z,
        heading: driverSeat.heading,
        speed: moveSpeed,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: false,
        isInCamper: true,
        visible: this.trainViewMode === 'exterior',
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.companionState.activity = 'bus';
      this.companionState.restingInIgloo = false;
      this.companionState.x = compSeat.position.x;
      this.companionState.y = compSeat.position.y;
      this.companionState.z = compSeat.position.z;
      this.companionRig.setPose(this.companionState, this.elapsed, {
        worldPos: compSeat.position,
        worldHeading: compSeat.heading,
        visible: true,
        lanternStrength: palette.lanternStrength,
        dt,
      });
    } else if (this.activeVehicle === 'safari_car') {
      const car = this.dinosaurIslandState.safariCar;
      const carY = walkableHeightAt(car.x, car.z);
      this.playerRig.setPose({
        x: car.x - Math.cos(car.heading) * 0.42,
        y: carY + 0.65,
        z: car.z + Math.sin(car.heading) * 0.42,
        heading: car.heading,
        speed: moveSpeed,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: true,
        isInCamper: true,
        visible: true,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.companionState.activity = 'bus';
      this.companionState.restingInIgloo = false;
      this.companionState.x = car.x + Math.cos(car.heading) * 0.45;
      this.companionState.y = carY + 0.92;
      this.companionState.z = car.z - Math.sin(car.heading) * 0.45;
      _compTrainSeat.set(this.companionState.x, this.companionState.y, this.companionState.z);
      this.companionRig.setPose(this.companionState, this.elapsed, {
        worldPos: _compTrainSeat,
        worldHeading: car.heading,
        visible: true,
        lanternStrength: palette.lanternStrength,
        dt,
      });
    } else if (this.skyTaxi.playerOnboard) {
      const dSeat = this.skyTaxiWorld.getDriverSeatTransform();
      const cSeat = this.skyTaxiWorld.getCompanionSeatTransform();
      this.playerRig.setPose({
        x: dSeat.position.x,
        y: dSeat.position.y,
        z: dSeat.position.z,
        heading: dSeat.heading,
        speed: 0,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: true,
        visible: true,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.companionState.activity = 'boat';
      this.companionState.restingInIgloo = false;
      this.companionState.x = cSeat.position.x;
      this.companionState.y = cSeat.position.y;
      this.companionState.z = cSeat.position.z;
      this.companionRig.setPose(this.companionState, this.elapsed, {
        worldPos: cSeat.position,
        worldHeading: cSeat.heading,
        visible: true,
        lanternStrength: palette.lanternStrength,
        dt,
      });
    } else if (this.activeVehicle === 'sky_explorer') {
      const dSeat = this.skyExplorerWorld.getDriverSeatTransform();
      const cSeat = this.skyExplorerWorld.getCompanionSeatTransform();
      this.playerRig.setPose({
        x: dSeat.position.x,
        y: dSeat.position.y,
        z: dSeat.position.z,
        heading: dSeat.heading,
        speed: 0,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: true,
        visible: true,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.companionState.activity = 'boat';
      this.companionState.restingInIgloo = false;
      this.companionState.x = cSeat.position.x;
      this.companionState.y = cSeat.position.y;
      this.companionState.z = cSeat.position.z;
      this.companionRig.setPose(this.companionState, this.elapsed, {
        worldPos: cSeat.position,
        worldHeading: cSeat.heading,
        visible: true,
        lanternStrength: palette.lanternStrength,
        dt,
      });
    } else if (this.activeVehicle === 'boat' && this.activeBoatId) {
      const pSeat = this.vehiclesWorld.getBoatPlayerTransform(this.activeBoatId);
      const cBow = this.vehiclesWorld.getBoatCompanionBowTransform(this.activeBoatId);
      this.playerRig.setPose({
        x: pSeat.position.x,
        y: pSeat.position.y,
        z: pSeat.position.z,
        heading: pSeat.heading,
        speed: moveSpeed,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: false,
        isInBoat: true,
        visible: !this.boatFpvMode,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.companionState.activity = 'boat';
      this.companionState.restingInIgloo = false;
      this.companionState.x = cBow.position.x;
      this.companionState.y = cBow.position.y;
      this.companionState.z = cBow.position.z;
      this.companionRig.setPose(this.companionState, this.elapsed, {
        worldPos: cBow.position,
        worldHeading: cBow.heading,
        visible: true,
        lanternStrength: palette.lanternStrength,
        dt,
      });
    } else if (this.activeVehicle === 'train' || this.activeVehicle === 'bus') {
      this.playerRig.setPose({
        x: this.playerX,
        y: this.playerY,
        z: this.playerZ,
        heading: this.playerHeading,
        speed: 0,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: true,
        visible: false,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.companionState.activity = this.activeVehicle === 'train' ? 'train' : 'bus';
      this.companionState.restingInIgloo = false;
      if (this.activeVehicle === 'bus') {
        const seat = this.vehiclesWorld.getBusCompanionSeatTransform();
        this.companionRig.setPose(this.companionState, this.elapsed, {
          worldPos: seat.position,
          worldHeading: seat.heading,
          visible: this.trainViewMode === 'exterior',
          lanternStrength: palette.lanternStrength,
          dt,
        });
      } else {
        const seatHeading = this.trainRig.getCompanionSeatTransform(_compTrainSeat);
        this.companionRig.setPose(this.companionState, this.elapsed, {
          worldPos: _compTrainSeat,
          worldHeading: seatHeading,
          visible: this.trainViewMode === 'cabin',
          lanternStrength: palette.lanternStrength,
          dt,
        });
      }
    } else if (this.activeVehicle === 'batmobile' || this.activeVehicle === 'vault_car') {
      this.playerRig.setPose({
        x: this.playerX,
        y: this.playerY,
        z: this.playerZ,
        heading: this.playerHeading,
        speed: 0,
        turnRate: 0,
        transportMode: 'walk',
        isSitting: true,
        visible: false,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });
      this.heroRig.group.visible = false;
      this.companionState.activity = 'bus';
      this.companionState.restingInIgloo = false;
      this.companionState.x = this.playerX;
      this.companionState.y = this.playerY;
      this.companionState.z = this.playerZ;
      this.companionRig.setPose(this.companionState, this.elapsed, {
        visible: false,
        lanternStrength: palette.lanternStrength,
        dt,
      });
    } else {
      const hasActiveHero = this.heroState.activeHeroId !== null;
      const holdingLanternOnFoot =
        this.playerLanternState.isOn &&
        this.transportMode === 'walk' &&
        !this.isSitting &&
        !this.isSwimming &&
        !this.jumpState.isAirborne;
      const renderY = this.activeVehicle === 'none' ? this.smoothVisualY : this.playerY;
      const { footstepTriggered, skatePushTriggered } = this.playerRig.setPose({
        x: this.playerX,
        y: renderY,
        z: this.playerZ,
        heading: this.playerHeading,
        speed: moveSpeed,
        turnRate: this.currentTurnRate,
        transportMode: this.icelandState.isGiant || this.isSwimming ? 'walk' : this.transportMode,
        isSitting: this.isSitting,
        isSwimming: this.isSwimming,
        isAirborne: this.jumpState.isAirborne,
        jumpVelocityY: this.jumpState.velocityY,
        jumpOffsetY: this.jumpState.offsetY,
        scale: this.icelandState.playerScale,
        visible: !hasActiveHero,
        lanternStrength: palette.lanternStrength,
        holdingLantern: holdingLanternOnFoot,
        elapsed: this.elapsed,
        dt,
      });

      this.heroRig.group.visible = hasActiveHero;
      if (hasActiveHero) {
        this.heroRig.group.position.set(this.playerX, renderY, this.playerZ);
        this.heroRig.group.rotation.y = this.playerHeading;
        this.heroRig.updatePose({
          elapsed: this.elapsed,
          speed: moveSpeed,
          isSprinting,
          isAirborne: this.jumpState.isAirborne,
          isFlying: this.heroState.isFlying,
          isGliding: this.heroState.isGliding,
          isWebSwinging: this.heroState.isWebSwinging,
          isSitting: this.isSitting,
          helmetOpen: this.heroState.helmetOpen,
          energyShieldActive: this.heroState.energyShieldActive,
          detectiveVisionActive: this.heroState.detectiveVisionActive,
          spiderSenseActive: this.heroState.spiderSenseActive,
          attackTimer: this.heroState.attackAnimTimer,
          webHandSide: this.webSwingState.handSide,
          dt,
          bankRad: this.smoothBankRad,
          pitchLeanRad: this.smoothPitchLeanRad,
          flightSurgeBlend: this.smoothFlightSurge,
        });
      }

      if (
        footstepTriggered &&
        this.mode === 'playing' &&
        !this.isSwimming &&
        !this.jumpState.isAirborne &&
        !this.heroState.isFlying &&
        !this.heroState.isWebSwinging
      ) {
        const surface = this.playerY > 0.4 ? 'wood' : 'grass';
        const isHeavyHero =
          this.heroState.activeHeroId !== null &&
          getHeroById(this.heroState.activeHeroId).mobility.heavyFootsteps;
        this.audio.playFootstep(
          surface,
          scaleMetrics.footstepPitchMultiplier * (isHeavyHero ? 0.5 : 1.0)
        );
      }
      if (skatePushTriggered && this.mode === 'playing' && !this.isSwimming && !this.jumpState.isAirborne) {
        this.audio.playSkatePush();
      }

      // Companion Frosty smoothly follows, floats beside swimmer, sits beside player, or sleeps in his En Illam igloo corner
      const currentRegion = getRegionAt(this.playerX, this.playerZ);
      if (this.isSitting && this.sittingSpot && !this.companionState.restingInIgloo) {
        const sideX = this.sittingSpot.x + Math.cos(this.playerHeading) * 0.95;
        const sideZ = this.sittingSpot.z - Math.sin(this.playerHeading) * 0.95;
        this.companionState.x = sideX;
        this.companionState.y = this.sittingSpot.y;
        this.companionState.z = sideZ;
        this.companionState.heading = this.playerHeading;
        this.companionState.activity =
          this.sittingSpot.id === 'camp_log_seat' ? 'campfire' : 'sitting';
        this.companionState.speed = 0;
        if (this.companionState.lineTimer > 0) {
          this.companionState.lineTimer = Math.max(0, this.companionState.lineTimer - dt);
          if (this.companionState.lineTimer === 0) this.companionState.currentLine = null;
        }
      } else {
        const isObstacleBlocked = (cx: number, cz: number, cy: number) => {
          for (let i = 0; i < this.allColliders.length; i++) {
            const c = this.allColliders[i];
            if (c.minY !== undefined && cy < c.minY) continue;
            if (c.maxY !== undefined && cy > c.maxY) continue;
            if (cx > c.minX - 0.32 && cx < c.maxX + 0.32 && cz > c.minZ - 0.32 && cz < c.maxZ + 0.32) {
              return true;
            }
          }
          return false;
        };
        this.companionState = stepCompanionFollow(
          this.companionState,
          this.playerX,
          this.playerY,
          this.playerZ,
          this.playerHeading,
          moveSpeed,
          dt,
          (cx, cz) => {
            if (this.homeVaultState.inVault) {
              return VAULT_FLOOR_Y;
            }
            if (this.inUndergroundCave) {
              return getCaveFloorHeightAt(cx, cz);
            }
            if (this.inUndergroundMetro) {
              return getUndergroundMetroFloorY(cx, cz);
            }
            const effWater = getEffectiveWaterLevel(this.extremeWeatherState.floodLevel);
            const gY = walkableHeightWithFloor(cx, cz, this.playerY);
            if (isSwimmableWaterAt(cx, cz) || (this.extremeWeatherState.floodLevel > WATER_LEVEL + 0.15 && gY < effWater - 0.14)) {
              return effWater + 0.04 + Math.sin(this.elapsed * 2.4) * 0.04;
            }
            return gY;
          },
          this.isSwimming || this.inUndergroundCave || this.homeVaultState.inVault ? () => false : isWaterAt,
          currentRegion,
          this.inUndergroundCave || this.homeVaultState.inVault ? () => false : isObstacleBlocked
        );
      }
      this.companionRig.setPose(this.companionState, this.elapsed, {
        lanternStrength: palette.lanternStrength,
        dt,
      });
    }

    // 6B. Update Player's Personal Handheld Brass Explorer Lantern (auto-lights at dusk/night, toggleable via [L])
    const stowedInVehicle =
      this.activeVehicle === 'train' ||
      this.activeVehicle === 'bus' ||
      this.activeVehicle === 'camper' ||
      this.activeVehicle === 'batmobile' ||
      this.activeVehicle === 'vault_car' ||
      this.activeVehicle === 'airliner' ||
      this.activeVehicle === 'sky_explorer' ||
      this.activeVehicle === 'safari_car';
    this.playerLanternState = stepPlayerLantern(this.playerLanternState, {
      dt,
      elapsed: this.elapsed,
      worldLanternStrength: palette.worldLanternStrength,
      nightDarkness: palette.nightDarkness,
      inDarkInterior: this.inUndergroundCave || this.inUndergroundMetro,
      playerSpeed: moveSpeed,
      turnRate: this.currentTurnRate,
      stowedInVehicle,
    });
    this.container.dataset.lanternOn = String(this.playerLanternState.isOn);
    const lanternGroundY = this.homeVaultState.inVault
      ? VAULT_FLOOR_Y
      : this.inUndergroundCave
        ? getCaveFloorHeightAt(this.playerX, this.playerZ)
        : this.inUndergroundMetro
          ? getUndergroundMetroFloorY(this.playerX, this.playerZ)
          : walkableHeightWithFloor(this.playerX, this.playerZ, this.playerY);
    this.playerLanternRig.update({
      x: this.playerX,
      y: this.activeVehicle === 'none' ? this.smoothVisualY : this.playerY,
      z: this.playerZ,
      heading: this.playerHeading,
      scale: this.icelandState.playerScale,
      groundY: lanternGroundY,
      state: this.playerLanternState,
      isOnBike: this.transportMode === 'bicycle' && this.activeVehicle === 'none',
      isHeroActive: this.heroState.activeHeroId !== null,
      visible: !stowedInVehicle && !this.isSitting,
      elapsed: this.elapsed,
    });

    // 7. Spatial Regional Audio
    const distToOcean = Math.max(0, 112 - this.playerX) + Math.max(0, 20 - this.playerZ);
    const distToWaterfall = Math.hypot(this.playerX - WATERFALL_CENTER.x, this.playerZ - WATERFALL_CENTER.z);
    const activeBoat = this.activeBoatId ? this.boats.find((b) => b.id === this.activeBoatId) : null;

    const stationCrowd = this.inUndergroundCave
      ? undefined
      : computeStationCrowdProfile(
          this.playerX,
          this.playerZ,
          this.timeHours,
          this.weather,
          this.trainState,
          this.activeVehicle === 'train'
        );

    this.audio.update({
      dt,
      period: getTimePeriod(this.timeHours),
      weather: this.weather,
      distToTrain: Math.hypot(this.playerX - this.trainState.worldX, this.playerZ - this.trainState.worldZ),
      trainSpeedKmh: this.trainState.speedKmh,
      isOnTrain: this.activeVehicle === 'train',
      distToLake: Math.hypot(this.playerX - LAKE_CENTER.x, this.playerZ - LAKE_CENTER.z),
      distToCrossing: Math.hypot(this.playerX - CROSSING_POINT.x, this.playerZ - CROSSING_POINT.z),
      trainDistToCrossing,
      distToOcean,
      distToWaterfall,
      boatSpeed: activeBoat ? activeBoat.speed : 0,
      stationCrowd,
    });

    // 8. Camera Choreography
    this.updateCamera(dt);
  }

  private updateCamera(dt: number): void {
    // Sync any external direct assignments to camYaw/camPitch/camDistance (e.g. boarding vehicles/teleports)
    if (
      Math.abs(this.camYaw - this.lastCamYawSynced) > 1e-5 ||
      Math.abs(this.camPitch - this.lastCamPitchSynced) > 1e-5 ||
      Math.abs(this.camDistance - this.lastCamDistSynced) > 1e-5
    ) {
      syncSmoothCameraOrbitTargets(this.smoothCam, this.camYaw, this.camPitch, this.camDistance);
    }

    // Gentle auto-align behind moving hero/player when not manually dragging screen
    const onFootOrHero = this.mode === 'playing' && this.activeVehicle === 'none' && !this.skyTaxi.playerOnboard;
    const autoFollowYaw =
      onFootOrHero && this.lastMoveSpeed > 1.8 && !this.isSitting
        ? this.playerHeading + Math.PI
        : null;
    const autoFollowStrength = this.heroState.isFlying || this.heroState.isWebSwinging ? 0.65 : 0.28;

    stepSmoothCameraOrbit(this.smoothCam, {
      dt,
      isDragging: this.isDragging,
      autoFollowYaw,
      autoFollowStrength,
      minPitch: -0.18,
      maxPitch: 1.05,
    });
    this.camYaw = this.smoothCam.yaw;
    this.camPitch = this.smoothCam.pitch;
    this.camDistance = this.smoothCam.distance;
    this.lastCamYawSynced = this.camYaw;
    this.lastCamPitchSynced = this.camPitch;
    this.lastCamDistSynced = this.camDistance;

    const damp = 1 - Math.exp(-7.2 * dt);

    if (this.mode === 'title') {
      const swayZ = Math.sin(this.elapsed * 0.16) * 0.65;
      const swayY = Math.sin(this.elapsed * 0.22) * 0.14;
      _camTargetPos.set(11.8, 3.0 + swayY, 12.6 + swayZ);
      _camTargetLook.set(-4.0, 2.2, 10.0);
      this.camera.position.lerp(_camTargetPos, Math.min(1, dt * 1.8 + 0.08));
      _camCurrentLook.lerp(_camTargetLook, Math.min(1, dt * 2.0 + 0.08));
      this.camera.lookAt(_camCurrentLook);
      return;
    }

    if (this.mode === 'exhibition_vehicle' && this.exhibitionInspectTargetId) {
      const entry = getExhibitionVehicleById(this.exhibitionInspectTargetId);
      if (entry) {
        if (!this.isDragging) {
          this.camYaw += dt * 0.28;
        }
        const orbitDist = entry.category === 'air' ? 9.5 : entry.id === 'sovereign_ship' ? 18.0 : 6.4;
        const focusY = entry.displayPos.y + (entry.id === 'sovereign_ship' ? 3.4 : 1.5);
        _camTargetLook.set(entry.displayPos.x, focusY, entry.displayPos.z);
        _camTargetPos.set(
          entry.displayPos.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * orbitDist,
          Math.max(entry.displayPos.y + 1.2, focusY + Math.sin(this.camPitch) * orbitDist + 1.1),
          entry.displayPos.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * orbitDist
        );
        this.camera.position.lerp(_camTargetPos, damp);
        _camCurrentLook.lerp(_camTargetLook, damp);
        this.camera.lookAt(_camCurrentLook);
        return;
      }
    }

    if (this.skyTaxi.playerOnboard) {
      const anchor = this.skyTaxiWorld.getFollowAnchor();
      const skyDist = 11.8;
      const desiredYaw = this.skyTaxi.heading + Math.PI;
      if (!this.isDragging) {
        let diff = desiredYaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * (1 - Math.exp(-3.0 * dt));
      }
      _camTargetLook.set(
        anchor.x + Math.sin(this.skyTaxi.heading) * 3.0,
        anchor.y + 0.4,
        anchor.z + Math.cos(this.skyTaxi.heading) * 3.0
      );
      _camTargetPos.set(
        anchor.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * skyDist,
        Math.max(2.5, anchor.y + Math.sin(this.camPitch) * skyDist + 2.5),
        anchor.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * skyDist
      );
      this.camera.position.lerp(_camTargetPos, damp);
      _camCurrentLook.lerp(_camTargetLook, damp);
      this.camera.lookAt(_camCurrentLook);
      return;
    }

    if (this.mode === 'camera') {
      const eyeY = this.activeVehicle === 'train' ? 2.18 : this.playerY + 1.68;
      if (this.activeVehicle === 'train') {
        this.trainRig.getWindowSeatTransform(_seatPos, _seatLook);
        this.camera.position.lerp(_seatPos, damp);
      } else if (this.activeVehicle === 'bus') {
        const seat = this.vehiclesWorld.getBusWindowSeatTransform();
        this.camera.position.lerp(seat.position, damp);
      } else {
        _camTargetPos.set(this.playerX, eyeY, this.playerZ);
        this.camera.position.lerp(_camTargetPos, damp);
      }
      const lookDist = 18;
      _camTargetLook.set(
        this.camera.position.x - Math.sin(this.camYaw) * Math.cos(this.camPitch) * lookDist,
        this.camera.position.y - Math.sin(this.camPitch) * lookDist,
        this.camera.position.z - Math.cos(this.camYaw) * Math.cos(this.camPitch) * lookDist
      );
      this.camera.lookAt(_camTargetLook);
      if (Math.abs(this.camera.fov - this.photoFov) > 0.1) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.photoFov, damp);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    if (this.activeVehicle === 'train') {
      if (this.trainViewMode === 'window') {
        // Exact same clean, unobstructed scenic window framing as the Dreamline Bus!
        this.trainRig.getWindowSeatTransform(_seatPos, _seatLook);
        this.camera.position.lerp(_seatPos, 1 - Math.exp(-12 * dt));
        _camCurrentLook.lerp(_seatLook, 1 - Math.exp(-9 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else if (this.trainViewMode === 'driver') {
        this.trainRig.getDriverCabTransform(_seatPos, _seatLook);
        this.camera.position.lerp(_seatPos, 1 - Math.exp(-14 * dt));
        _camCurrentLook.lerp(_seatLook, 1 - Math.exp(-11 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else if (this.trainViewMode === 'cabin') {
        this.trainRig.getCabinWalkTransform(
          this.cabinWalkZ,
          this.cabinWalkX,
          this.camYaw,
          this.camPitch,
          _seatPos,
          _seatLook
        );
        this.camera.position.lerp(_seatPos, 1 - Math.exp(-12 * dt));
        _camCurrentLook.lerp(_seatLook, 1 - Math.exp(-10 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else {
        this.trainRig.getExteriorAnchor(_extAnchor);
        const dist = 14.5;
        _camTargetPos.set(
          _extAnchor.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
          Math.max(2.0, _extAnchor.y + Math.sin(this.camPitch) * dist + 2.4),
          _extAnchor.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
        );
        this.camera.position.lerp(_camTargetPos, damp);
        _camCurrentLook.lerp(_extAnchor, damp);
        this.camera.lookAt(_camCurrentLook);
      }
      return;
    }

    if (this.activeVehicle === 'bus') {
      if (this.trainViewMode === 'window') {
        const seat = this.vehiclesWorld.getBusWindowSeatTransform();
        this.camera.position.lerp(seat.position, 1 - Math.exp(-12 * dt));
        _camCurrentLook.lerp(seat.lookAt, 1 - Math.exp(-9 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else if (this.trainViewMode === 'driver') {
        const cab = this.vehiclesWorld.getBusDriverCabTransform();
        this.camera.position.lerp(cab.position, 1 - Math.exp(-14 * dt));
        _camCurrentLook.lerp(cab.lookAt, 1 - Math.exp(-11 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else {
        const anchor = this.vehiclesWorld.getBusExteriorAnchor();
        if (this.busDriverMode && !this.isDragging && this.busState.speedKmh > 2) {
          const desiredYaw = this.busState.heading + Math.PI;
          let diff = desiredYaw - this.camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.camYaw += diff * (1 - Math.exp(-2.8 * dt));
        }
        const dist = 11.5;
        _camTargetPos.set(
          anchor.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
          Math.max(2.2, anchor.y + Math.sin(this.camPitch) * dist + 2.2),
          anchor.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
        );
        this.camera.position.lerp(_camTargetPos, damp);
        _camCurrentLook.lerp(anchor, damp);
        this.camera.lookAt(_camCurrentLook);
      }
      return;
    }

    if (this.activeVehicle === 'camper') {
      if (this.trainViewMode === 'window' || this.trainViewMode === 'cabin') {
        const view = this.enchantedForest.getCamperViewTransform(this.trainViewMode);
        this.camera.position.lerp(view.position, 1 - Math.exp(-12 * dt));
        _camCurrentLook.lerp(view.lookAt, 1 - Math.exp(-10 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else {
        // Smooth behind-the-van follow camera with mouse orbit support!
        const cx = this.camperState.x;
        const cz = this.camperState.z;
        const cy = walkableHeightAt(cx, cz) + 1.55;
        if (!this.isDragging && Math.abs(this.camperState.speed) > 0.6) {
          const desiredYaw = this.camperState.heading + Math.PI;
          let diff = desiredYaw - this.camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.camYaw += diff * (1 - Math.exp(-2.6 * dt));
        }
        const dist = 7.4;
        _camTargetLook.set(cx, cy, cz);
        _camTargetPos.set(
          cx + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
          Math.max(cy + 0.6, cy + Math.sin(this.camPitch) * dist + 1.1),
          cz + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
        );
        this.camera.position.lerp(_camTargetPos, damp);
        _camCurrentLook.lerp(_camTargetLook, damp);
        this.camera.lookAt(_camCurrentLook);
      }
      return;
    }

    if (this.activeVehicle === 'batmobile') {
      const b = this.batmobileState;
      const by = b.y + 1.25;
      if (b.cameraMode === 'cockpit') {
        const fwdX = Math.sin(b.heading);
        const fwdZ = Math.cos(b.heading);
        _camTargetPos.set(b.x + fwdX * 0.25, b.y + 1.38, b.z + fwdZ * 0.25);
        _camTargetLook.set(b.x + fwdX * 18, b.y + 1.2, b.z + fwdZ * 18);
        this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-14 * dt));
        _camCurrentLook.lerp(_camTargetLook, 1 - Math.exp(-12 * dt));
        this.camera.lookAt(_camCurrentLook);
      } else {
        if (!this.isDragging && Math.abs(b.speed) > 0.8) {
          const desiredYaw = b.heading + Math.PI;
          let diff = desiredYaw - this.camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.camYaw += diff * (1 - Math.exp(-3.4 * dt));
        }
        const dist = b.cameraMode === 'cinematic' ? 10.8 : 9.2 + (b.boostActive ? 1.5 : 0);
        const lift = b.cameraMode === 'cinematic' ? 2.8 : 1.9;
        _camTargetLook.set(
          b.x + Math.sin(b.heading) * 3.0,
          by + 0.12,
          b.z + Math.cos(b.heading) * 3.0
        );
        const desiredCamY = Math.max(b.y + 1.1, by + Math.sin(this.camPitch) * dist + lift);
        _camTargetPos.set(
          b.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
          b.inVault ? Math.min(VAULT_CEILING_Y - 1.0, desiredCamY) : desiredCamY,
          b.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
        );
        this.camera.position.lerp(_camTargetPos, damp);
        _camCurrentLook.lerp(_camTargetLook, damp);
        this.camera.lookAt(_camCurrentLook);
      }
      return;
    }

    if (this.activeVehicle === 'vault_car' && this.homeVaultState.activeVaultCarId) {
      const car = this.homeVaultState.cars.find(
        (c) => c.id === this.homeVaultState.activeVaultCarId
      );
      if (car) {
        if (!this.isDragging && Math.abs(car.speed) > 0.6) {
          const desiredYaw = car.heading + Math.PI;
          let diff = desiredYaw - this.camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.camYaw += diff * (1 - Math.exp(-3.6 * dt));
        }
        const dist = 7.4 + (car.boostActive ? 1.25 : 0);
        const rawY = Math.max(car.y + 1.2, car.y + 1.5 + Math.sin(this.camPitch) * dist + 1.55);
        const clampedY = car.inVault ? Math.min(VAULT_CEILING_Y - 1.0, rawY) : rawY;
        _camTargetLook.set(
          car.x + Math.sin(car.heading) * 2.6,
          car.y + 1.2,
          car.z + Math.cos(car.heading) * 2.6
        );
        _camTargetPos.set(
          car.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist,
          clampedY,
          car.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist
        );
        this.camera.position.lerp(_camTargetPos, damp);
        _camCurrentLook.lerp(_camTargetLook, damp);
        this.camera.lookAt(_camCurrentLook);
        return;
      }
    }

    if (this.activeVehicle === 'safari_car') {
      const car = this.dinosaurIslandState.safariCar;
      const cy = walkableHeightAt(car.x, car.z) + 1.5;
      if (!this.isDragging && Math.abs(car.speed) > 0.6) {
        const desiredYaw = car.heading + Math.PI;
        let diff = desiredYaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * (1 - Math.exp(-2.8 * dt));
      }
      const dist = 6.6;
      let tx = car.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist;
      let ty = Math.max(cy + 1.25, cy + Math.sin(this.camPitch) * dist + 1.65);
      let tz = car.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist;

      // Prevent camera from clipping behind intact PAD-01N containment walls when driving inside arena
      const acx = DINOSAUR_ARENA_CENTER.x;
      const acz = DINOSAUR_ARENA_CENTER.z;
      const ahs = 13.5;
      const insideArena =
        Math.abs(car.x - acx) < ahs - 0.5 && Math.abs(car.z - acz) < ahs - 0.5;
      if (insideArena) {
        const margin = 1.25;
        if (this.dinosaurIslandState.wallsIntact[0]) tx = Math.max(acx - ahs + margin, tx);
        if (this.dinosaurIslandState.wallsIntact[1]) tz = Math.max(acz - ahs + margin, tz);
        if (this.dinosaurIslandState.wallsIntact[2]) tx = Math.min(acx + ahs - margin, tx);
        if (this.dinosaurIslandState.wallsIntact[3]) tz = Math.min(acz + ahs - margin, tz);
        ty = Math.max(ty, cy + 2.1);
      }

      _camTargetLook.set(car.x, cy + 0.25, car.z);
      _camTargetPos.set(tx, ty, tz);
      this.camera.position.lerp(_camTargetPos, damp);
      _camCurrentLook.lerp(_camTargetLook, damp);
      this.camera.lookAt(_camCurrentLook);
      return;
    }

    if (this.activeVehicle === 'airliner') {
      const a = this.airlinerState;
      const airDist = 26.5 + (a.afterburner ? 3.5 : 0);
      const desiredYaw = a.heading + Math.PI;
      if (!this.isDragging) {
        let diff = desiredYaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * (1 - Math.exp(-3.4 * dt));
      }
      _camTargetLook.set(
        a.x + Math.sin(a.heading) * 6.0,
        a.y + 3.2,
        a.z + Math.cos(a.heading) * 6.0
      );
      _camTargetPos.set(
        a.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * airDist,
        Math.max(a.y + 2.8, a.y + Math.sin(this.camPitch) * airDist + 5.6),
        a.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * airDist
      );
      this.camera.position.lerp(_camTargetPos, damp);
      _camCurrentLook.lerp(_camTargetLook, damp);
      this.camera.lookAt(_camCurrentLook);
      return;
    }

    if (this.activeVehicle === 'sky_explorer') {
      const anchor = this.skyExplorerWorld.getFollowAnchor();
      const skyDist = 11.4;
      const desiredYaw = this.skyExplorerState.heading + Math.PI;
      if (!this.isDragging) {
        let diff = desiredYaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * (1 - Math.exp(-3.4 * dt));
      }
      _camTargetLook.set(
        anchor.x + Math.sin(this.skyExplorerState.heading) * 3.0,
        anchor.y + 0.4,
        anchor.z + Math.cos(this.skyExplorerState.heading) * 3.0
      );
      _camTargetPos.set(
        anchor.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * skyDist,
        Math.max(2.0, anchor.y + Math.sin(this.camPitch) * skyDist + 2.2),
        anchor.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * skyDist
      );
      this.camera.position.lerp(_camTargetPos, damp);
      _camCurrentLook.lerp(_camTargetLook, damp);
      this.camera.lookAt(_camCurrentLook);
      return;
    }

    if (this.activeVehicle === 'boat' && this.activeBoatId) {
      if (this.boatFpvMode) {
        const fpv = this.vehiclesWorld.getBoatBowFpvTransform(this.activeBoatId);
        this.camera.position.lerp(fpv.position, 1 - Math.exp(-14 * dt));
        _camCurrentLook.lerp(fpv.lookAt, 1 - Math.exp(-14 * dt));
        this.camera.lookAt(_camCurrentLook);
        return;
      }
      const boat = this.boats.find((b) => b.id === this.activeBoatId);
      const bx = boat ? boat.x : this.playerX;
      const bz = boat ? boat.z : this.playerZ;
      const boatDist =
        this.activeBoatId === 'sovereign_ship'
          ? 24.0
          : this.activeBoatId === 'bamboo_catamaran' || this.activeBoatId === 'tribal_outrigger'
          ? 10.6
          : 7.4;
      _camTargetLook.set(bx, this.activeBoatId === 'sovereign_ship' ? 4.2 : 1.45, bz);
      _camTargetPos.set(
        bx + Math.sin(this.camYaw) * Math.cos(this.camPitch) * boatDist,
        Math.max(1.8, (this.activeBoatId === 'sovereign_ship' ? 4.6 : 1.85) + Math.sin(this.camPitch) * boatDist),
        bz + Math.cos(this.camYaw) * Math.cos(this.camPitch) * boatDist
      );
      this.camera.position.lerp(_camTargetPos, damp);
      _camCurrentLook.lerp(_camTargetLook, damp);
      this.camera.lookAt(_camCurrentLook);
      return;
    }

    // Scale-aware, critically damped spring third-person follow camera for Player & Heroes!
    const metrics = getScaleGameplayMetrics(
      this.icelandState.playerScale,
      this.isSitting,
      this.transportMode === 'bicycle'
    );

    const vehicleDistBonus =
      !this.icelandState.isGiant && this.transportMode === 'bicycle'
        ? 0.85
        : !this.icelandState.isGiant && this.transportMode === 'skateboard'
        ? 0.45
        : 0;
    const inHomeInterior =
      Math.abs(this.playerX - HOME_CENTER.x) < 6.4 && Math.abs(this.playerZ - HOME_CENTER.z) < 5.4;
    const heroScaleBoost =
      this.heroState.activeHeroId
        ? Math.max(1, getHeroById(this.heroState.activeHeroId).mobility.scaleMultiplier * 0.96)
        : 1;
    const baseDist = inHomeInterior
      ? Math.min(this.camDistance, 3.3)
      : (this.camDistance + vehicleDistBonus) * heroScaleBoost;
    const effectiveDist = baseDist * metrics.cameraDistanceMultiplier;
    const camAnchorY = this.smoothVisualY - this.jumpState.offsetY * 0.56;
    const focusHeight = metrics.cameraFocusHeight * (heroScaleBoost > 1.1 ? 1.28 : 1);

    const horiz = Math.cos(this.camPitch) * effectiveDist;
    const rawDirX = Math.sin(this.camYaw) * horiz;
    const rawDirZ = Math.cos(this.camYaw) * horiz;

    // Fine 12-step collision raycast paired with asymmetric boom spring recovery (fast pull-in, silky pull-out)
    let desiredBoomScale = 1.0;
    if (!this.icelandState.isGiant && !this.homeVaultState.inVault) {
      const steps = 12;
      for (let s = 1; s <= steps; s++) {
        const f = s / steps;
        const testX = this.playerX + rawDirX * f;
        const testZ = this.playerZ + rawDirZ * f;
        let hit = false;
        for (let i = 0; i < this.allColliders.length; i++) {
          const c = this.allColliders[i];
          if (c.maxY !== undefined && this.playerY > c.maxY) continue;
          if (c.minY !== undefined && this.playerY + 1.5 < c.minY) continue;
          if (testX > c.minX - 0.5 && testX < c.maxX + 0.5 && testZ > c.minZ - 0.5 && testZ < c.maxZ + 0.5) {
            hit = true;
            break;
          }
        }
        if (hit) {
          desiredBoomScale = Math.max(0.32, (s - 1) / steps);
          break;
        }
      }
    }

    const probeX = this.playerX + rawDirX * Math.min(desiredBoomScale, this.smoothCam.boomScale);
    const probeZ = this.playerZ + rawDirZ * Math.min(desiredBoomScale, this.smoothCam.boomScale);
    const groundAtCam = this.homeVaultState.inVault
      ? VAULT_FLOOR_Y
      : this.inUndergroundMetro
        ? getUndergroundMetroFloorY(probeX, probeZ)
        : this.inUndergroundCave
          ? getCaveFloorHeightAt(probeX, probeZ)
          : walkableHeightWithFloor(probeX, probeZ, this.playerY);
    const minCamY = this.homeVaultState.inVault
      ? VAULT_FLOOR_Y + 0.9
      : this.inUndergroundMetro
        ? groundAtCam + 0.85
        : this.inUndergroundCave
          ? groundAtCam + 0.9
          : groundAtCam + metrics.cameraGroundClearance;
    const maxCamY = this.homeVaultState.inVault
      ? VAULT_CEILING_Y - 1.0
      : this.inUndergroundMetro
        ? METRO_FLOOR_Y + 9.2
        : this.inUndergroundCave
          ? CAVE_FLOOR_Y + 9.2
          : undefined;

    const rigOut = stepSmoothCameraRig(this.smoothCam, {
      dt,
      anchorX: this.playerX,
      anchorY: camAnchorY,
      anchorZ: this.playerZ,
      velX: this.playerVx,
      velY: this.heroState.isFlying ? this.heroState.flyVelY : this.jumpState.velocityY,
      velZ: this.playerVz,
      baseDistance: effectiveDist,
      focusHeight,
      desiredBoomScale,
      minCamY,
      maxCamY,
      baseFov: 52 + metrics.cameraFovBonus,
      verticalLift: 0.35 * metrics.cameraDistanceMultiplier,
      isFlying: this.heroState.isFlying,
      isWebSwinging: this.heroState.isWebSwinging,
      isSprinting: this.lastIsSprinting,
      isHero: this.heroState.activeHeroId !== null,
    });

    if (Math.abs(this.camera.fov - rigOut.fov) > 0.04) {
      this.camera.fov = rigOut.fov;
      this.camera.updateProjectionMatrix();
    }

    this.camera.position.set(rigOut.posX, rigOut.posY, rigOut.posZ);
    _camCurrentLook.set(rigOut.lookX, rigOut.lookY, rigOut.lookZ);
    this.camera.lookAt(_camCurrentLook);
    this.container.dataset.smoothMotion = 'active';
    this.container.dataset.camYaw = this.camYaw.toFixed(3);
    this.container.dataset.camFov = this.camera.fov.toFixed(1);
  }

  private emitHudSnapshot(): void {
    const baseLoc = getLocationAt(this.playerX, this.playerZ);
    const midnightOpen = isMidnightFrontierOpen(this.timeHours);
    const inMidnightValley =
      midnightOpen &&
      Math.hypot(
        this.playerX - MIDNIGHT_FRONTIER_PORTAL_POS.x,
        this.playerZ - MIDNIGHT_FRONTIER_PORTAL_POS.z
      ) < MIDNIGHT_FRONTIER_VALLEY_RADIUS;
    const exhibitionSubzone = getExhibitionSubzoneLabel(this.playerX, this.playerY, this.playerZ);
    const loc = this.homeVaultState.inVault
      ? {
          ...baseLoc,
          name: 'Secret Superhero Vault',
          jpName: 'ரகசிய பாதாள அரங்கம்',
          subtitle: 'En Illam Hidden Sub-Floor · 7 Hero Suits & 4 Rideable Cars',
        }
      : inMidnightValley
        ? {
            ...baseLoc,
            name: 'The Midnight Frontier',
            jpName: 'நள்ளிரவு எல்லை',
            subtitle: 'In-World Glowing Night Valley',
          }
        : exhibitionSubzone
          ? {
              ...baseLoc,
              name: exhibitionSubzone,
              jpName: 'உலகப் போக்குவரத்து கண்காட்சி',
              subtitle: 'Ocean Universal Transportation Exhibition Complex',
            }
          : baseLoc;
    const period = getTimePeriod(this.timeHours);
    const currentStation = STATIONS[this.trainState.currentStationIndex];
    const nearbyStationIndex =
      this.activeVehicle === 'none'
        ? findNearbyStationIndex(this.playerX, this.playerZ, 18.0)
        : null;
    const canTransferToIceland =
      this.activeVehicle === 'train' &&
      this.trainState.phase === 'stopped' &&
      Boolean(currentStation?.connectsToIceland);

    const playerRegion = getRegionAt(this.playerX, this.playerZ);
    const effectiveTempC = computeEffectiveTemperatureC(
      this.season,
      this.weather,
      this.timeHours,
      playerRegion,
      this.manualTemperatureC
    );

    const snapshot: HudSnapshot = {
      location: loc,
      regionId: playerRegion,
      timeHours: this.timeHours,
      timeFormatted: formatClockTime(this.timeHours),
      period,
      weather: this.weather,
      season: this.season,
      temperatureC: effectiveTempC,
      manualTemperatureC: this.manualTemperatureC,
      isNightMode: period === 'night',
      lanternOn: this.playerLanternState.isOn,
      transportMode: this.transportMode,
      activeVehicle: this.activeVehicle,
      activeBoatId: this.activeBoatId,
      boatFpvMode: this.boatFpvMode,
      playerX: this.playerX,
      playerY: this.playerY,
      playerZ: this.playerZ,
      playerHeading: this.playerHeading,
      isSitting: this.isSitting,
      isSwimming: this.isSwimming,
      isJumping: this.jumpState.isAirborne,
      floodLevel: this.extremeWeatherState.floodLevel,
      tsunamiActive: this.extremeWeatherState.tsunamiWaveHeight > 0.5 && getWeatherProfile(this.weather).hasTsunamiWave,
      isOnTrain: this.activeVehicle === 'train',
      trainViewMode: this.trainViewMode,
      train: {
        ...this.trainState,
        routePlan: this.trainState.routePlan
          ? {
              ...this.trainState.routePlan,
              selectedStopIndices: [...this.trainState.routePlan.selectedStopIndices],
              allUpcomingIndices: [...this.trainState.routePlan.allUpcomingIndices],
              visitedStopIndices: [...this.trainState.routePlan.visitedStopIndices],
              skippedStopIndices: [...this.trainState.routePlan.skippedStopIndices],
            }
          : null,
      },
      activeTicket: this.activeTicket ? { ...this.activeTicket } : null,
      iceland: { ...this.icelandState },
      nearbyStationIndex,
      bus: { ...this.busState },
      boats: this.boats.map((b) => ({ ...b })),
      camper: { ...this.camperState },
      skyExplorer: {
        x: this.skyExplorerState.x,
        y: this.skyExplorerState.y,
        z: this.skyExplorerState.z,
        speedKmh: this.skyExplorerState.speedKmh,
        altitudeM: this.skyExplorerState.altitudeM,
        boostActive: this.skyExplorerState.boostActive,
      },
      camping: { ...this.campingState },
      home: { ...this.homeState },
      companion: { ...this.companionState },
      companionMemory: {
        ...this.companionMemory,
        visitedRegions: [...this.companionMemory.visitedRegions],
        memoriesLog: [...this.companionMemory.memoriesLog],
        spokenIds: [...this.companionMemory.spokenIds],
      },
      activePrompt: this.findNearestInteractable(),
      discoveredSpotIds: Array.from(this.discoveredSpots),
      recentNotice: this.recentNotice,
      canExitTrain:
        this.activeVehicle === 'train' &&
        (this.trainState.phase === 'stopped' || (this.trainDriverMode && this.trainState.speedKmh < 3)),
      canExitBus:
        this.activeVehicle === 'bus' &&
        (this.busState.phase === 'stopped' || (this.busDriverMode && this.busState.speedKmh < 3)),
      canTransferToIceland,
      dinosaurIsland: extractDinosaurIslandHud(this.dinosaurIslandState),
      safariCarSpeedKmh: this.dinosaurIslandState.safariCar.speedKmh,
      trainDriverMode: this.trainDriverMode,
      busDriverMode: this.busDriverMode,
      navigation:
        this.navTarget && !this.inUndergroundCave
          ? computeNavigationState(
              this.playerX,
              this.playerZ,
              this.playerHeading,
              this.navTarget
            )
          : null,
      busDispatch: {
        ...this.busDispatch,
        destination: this.busDispatch.destination ? { ...this.busDispatch.destination } : null,
      },
      skyTaxi: {
        ...this.skyTaxi,
        destination: this.skyTaxi.destination ? { ...this.skyTaxi.destination } : null,
      },
      midnightFrontierOpen: midnightOpen,
      inUndergroundCave: this.inUndergroundCave,
      caveAreaName: this.inUndergroundCave
        ? getCaveChamberAt(this.playerX, this.playerZ).name
        : null,
      exhibitionTestVehicleId: this.exhibitionTestVehicleId,
      hero: { ...this.heroState },
      batmobile: { ...this.batmobileState },
      metroDestruction: {
        score: 0,
        buildingsDestroyed: 0,
        totalBuildings: 0,
        propsDestroyed: 0,
        totalProps: 0,
        inMetroCity: false,
      },
      stationAnnouncement: this.activeStationAnnouncement
        ? {
            id: this.activeStationAnnouncement.id,
            stationName: this.activeStationAnnouncement.stationName,
            localName: this.activeStationAnnouncement.localName,
            regionTag: this.activeStationAnnouncement.regionTag,
            chimeName: this.activeStationAnnouncement.chimeName,
            text: this.activeStationAnnouncement.text,
            eventKind: this.activeStationAnnouncement.eventKind,
          }
        : null,
      inUndergroundMetro: this.inUndergroundMetro,
      metroStationId: this.inUndergroundMetro ? this.metroStationId : null,
      metroStationName: this.inUndergroundMetro ? getMetroStationById(this.metroStationId).name : null,
      subwayTrainStatus: this.subwayState.statusLabel,
      subwayTrainAtPlatform: this.subwayState.phase === 'stopped',
      subwayRidingTo: this.subwayRidingTo,
      airliner: {
        speedKmh: this.airlinerState.speedKmh,
        altitudeM: this.airlinerState.altitudeM,
        throttle: this.airlinerState.throttle,
        afterburner: this.airlinerState.afterburner,
        landingGearDown: this.airlinerState.landingGearDown,
        onGround: this.airlinerState.onGround,
      },
      parachuteActive: this.parachuteState.active,
      homeVault: (() => {
        const activeCar = this.homeVaultState.activeVaultCarId
          ? this.homeVaultState.cars.find((c) => c.id === this.homeVaultState.activeVaultCarId)
          : null;
        return {
          inPersonalHome: isPlayerInsidePersonalHome(
            this.playerX,
            this.playerY,
            this.playerZ,
            this.homeVaultState.inVault
          ),
          hatchUnlocked: this.homeVaultState.hatchUnlocked,
          hatchOpenProgress: this.homeVaultState.hatchOpenProgress,
          inVault: this.homeVaultState.inVault,
          activeVaultCarName: activeCar ? getVaultCarSpec(activeCar.id).name : null,
          activeVaultCarSpeedKmh: activeCar ? activeCar.speedKmh : 0,
          activeVaultCarBoost: activeCar ? activeCar.boostActive : false,
        };
      })(),
    };
    this.callbacks.onHudUpdate(snapshot);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;

    if (this.suspended) {
      this.lastFrameMs = performance.now();
      this.frameId = window.setTimeout(this.tick, 180);
      return;
    }

    const nowMs = performance.now();
    const rawMs = Math.max(1, nowMs - this.lastFrameMs);
    const rawDt = rawMs / 1000;
    this.lastFrameMs = nowMs;
    const dt = filterFrameDt(this.filteredDt, rawDt, this.isSoftwareGl);
    this.filteredDt = dt;
    this.elapsed += dt;

    // Adaptive resolution guard on hardware WebGL keeps framerate smooth on slower GPUs/phones
    if (!this.isSoftwareGl && rawMs < 250) {
      this.avgFrameMs = this.avgFrameMs * 0.92 + rawMs * 0.08;
      this.dprAdjustTimer += dt;
      if (this.dprAdjustTimer >= 1.1) {
        this.dprAdjustTimer = 0;
        let nextScale = this.dynamicDprScale;
        if (this.avgFrameMs > 28 && this.dynamicDprScale > 0.68) {
          nextScale = Math.max(0.68, this.dynamicDprScale - 0.12);
        } else if (this.avgFrameMs < 15.5 && this.dynamicDprScale < 1.0) {
          nextScale = Math.min(1.0, this.dynamicDprScale + 0.08);
        }
        if (Math.abs(nextScale - this.dynamicDprScale) > 0.01) {
          this.dynamicDprScale = nextScale;
          this.applyQualitySettings();
        }
      }
    }

    this.updateSimulation(dt);

    // Refresh directional shadow map every 3rd frame (cuts full-scene shadow pass draw calls by 66%!)
    if (this.renderer.shadowMap.enabled) {
      this.shadowFrameCounter = (this.shadowFrameCounter + 1) % 3;
      if (this.shadowFrameCounter === 0) {
        this.renderer.shadowMap.needsUpdate = true;
      }
    }

    this.renderer.render(this.scene, this.camera);

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.32) {
      this.hudEmitTimer = 0;
      this.emitHudSnapshot();
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    dom.removeEventListener('wheel', this.onWheel);
    dom.removeEventListener('webglcontextlost', this.onContextLost);

    this.audio.dispose();
    this.playerLanternRig.dispose();
    this.playerRig.dispose();
    this.companionRig.dispose();
    this.personalHome.dispose();
    this.regionsWorld.dispose();
    this.vehiclesWorld.dispose();
    this.enchantedForest.dispose();
    this.firefliesWorld.dispose();
    this.wildlifeWorld.dispose();
    this.birdFlockingWorld.dispose();
    this.heroRig.dispose();
    this.batmobileWorld.dispose();
    this.heroVfxWorld.dispose();
    this.homeVaultWorld.dispose();
    this.airportMetroWorld.dispose();
    this.dinosaurIslandWorld.dispose();
    this.peopleSystem.dispose();
    this.navigationGuide.dispose();
    this.midnightPortal.dispose();
    this.avsSnowHouse.dispose();
    this.frozenKingdom.dispose();
    this.skyExplorerWorld.dispose();
    this.skyTaxiWorld.dispose();
    this.exhibitionComplexWorld.dispose();
    this.desertOasisWorld.dispose();
    this.trainRig.dispose();
    this.extremeWeather3D.dispose();
    this.nature.dispose();
    this.architecture.dispose();
    this.skyWater.dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
