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
import { buildWorldPeople } from './people';
import { buildNavigationGuide3D } from './navigationGuide3D';
import { buildMidnightFrontierPortal } from './midnightFrontierPortal';
import { buildAvsSnowHouse } from './avsSnowHouse';
import { buildFrozenKingdomWorld } from './frozenKingdomWorld';
import { buildExhibitionComplexWorld } from './exhibitionComplexWorld';
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
  private peopleSystem: ReturnType<typeof buildWorldPeople>;
  private navigationGuide: ReturnType<typeof buildNavigationGuide3D>;
  private midnightPortal: ReturnType<typeof buildMidnightFrontierPortal>;
  private avsSnowHouse: ReturnType<typeof buildAvsSnowHouse>;
  private frozenKingdom: ReturnType<typeof buildFrozenKingdomWorld>;
  private skyExplorerWorld: ReturnType<typeof buildSkyExplorerWorld>;
  private skyTaxiWorld: ReturnType<typeof buildSkyExplorerWorld>;
  private exhibitionComplexWorld: ReturnType<typeof buildExhibitionComplexWorld>;
  public audio: DreamlineAudio;

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

  // Iceland Giant Transformation state
  private icelandState: IcelandState = createIcelandState(0.6, 13.3, false, 'auto');
  private prevInIceland = false;

  // Camera orbit & Photo Mode state
  private camYaw = 0.55;
  private camPitch = 0.14;
  private camDistance = 4.6;
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

  // Loop & timing
  private frameId = 0;
  private lastFrameMs = 0;
  private elapsed = 0;
  private hudEmitTimer = 0;
  private lightBudgetTimer = 0;
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
    this.fog = new THREE.FogExp2(0xc98b9e, 0.0036);
    this.scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    // Camera (clean unobstructed Poongavanam platform vista — balanced far plane for offshore islands & faster depth culling)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.2, 680);
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

    this.staticColliders = [
      ...this.architecture.colliders,
      ...this.personalHome.colliders,
      ...this.regionsWorld.colliders,
      ...this.enchantedForest.colliders,
      ...this.exhibitionComplexWorld.colliders,
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

    const maxActive = this.inUndergroundCave ? 3 : 4;
    const candidates: Array<{ light: THREE.PointLight | THREE.SpotLight; distSq: number }> = [];

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

      light.getWorldPosition(_tmpLightPos);
      const dx = _tmpLightPos.x - this.playerX;
      const dz = _tmpLightPos.z - this.playerZ;
      const distSq = dx * dx + dz * dz;
      const maxRange = this.inUndergroundCave
        ? 135
        : Math.max((light.distance || 22) * 2.1, 46);
      if (distSq > maxRange * maxRange) {
        light.visible = false;
        continue;
      }
      candidates.push({ light, distSq });
    }

    if (candidates.length <= maxActive) {
      for (let i = 0; i < candidates.length; i++) {
        candidates[i].light.visible = true;
      }
      return;
    }

    candidates.sort((a, b) => a.distSq - b.distSq);
    for (let i = 0; i < candidates.length; i++) {
      candidates[i].light.visible = i < maxActive;
    }
  }

  private applyQualitySettings(): void {
    const maxDpr =
      this.settings.graphicsQuality === 'low'
        ? 0.95
        : this.settings.graphicsQuality === 'medium'
        ? 1.18
        : 1.5;
    const qScale =
      this.settings.graphicsQuality === 'low'
        ? 0.72
        : this.settings.graphicsQuality === 'medium'
        ? 0.88
        : 1.0;
    const targetDpr = this.isSoftwareGl
      ? 1.0
      : Math.min(window.devicePixelRatio || 1, maxDpr) * this.settings.resolutionScale * qScale;
    this.renderer.setPixelRatio(Math.max(0.5, targetDpr));
    this.renderer.shadowMap.enabled =
      !this.isSoftwareGl && this.settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (this.sunLight) {
      const targetShadowSize = this.settings.graphicsQuality === 'high' ? 1024 : 512;
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
    context: 'coastal' | 'snow' | 'sakura' | 'countryside' | 'lake_camp' | 'home' | 'igloo' | 'train' | 'bus' | 'boat' | 'campfire' | 'night' | 'general',
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
      this.callbacks.onModeChangeRequest(this.mode === 'camera' ? 'playing' : 'camera');
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
      if (code === 'Space' && this.activeVehicle === 'none') {
        e.preventDefault();
        if (!e.repeat) {
          this.triggerJump();
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
      }
      if (code === 'KeyL' && this.activeVehicle === 'camper') {
        e.preventDefault();
        this.toggleCamperLights();
        return;
      }
      if (code === 'KeyG') {
        e.preventDefault();
        const regionNow = getRegionAt(this.playerX, this.playerZ);
        this.playFrostyEmote(regionNow === 'snow' ? 'snowball' : 'wave');
        return;
      }
      if (
        code === 'KeyV' &&
        (this.activeVehicle === 'train' ||
          this.activeVehicle === 'bus' ||
          this.activeVehicle === 'camper')
      ) {
        e.preventDefault();
        this.toggleTrainViewMode();
        return;
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
    this.camYaw -= dx * sens;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * sens, -0.18, 1.05);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== this.activeCameraPointerId) return;
    this.isDragging = false;
    this.activeCameraPointerId = null;
  };

  private onWheel = (e: WheelEvent) => {
    if (this.mode === 'playing') {
      this.camDistance = THREE.MathUtils.clamp(this.camDistance + e.deltaY * 0.004, 3.2, 12.5);
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
    const groundAtCam = this.inUndergroundCave
      ? getCaveFloorHeightAt(desiredX, desiredZ)
      : walkableHeightWithFloor(desiredX, desiredZ, this.playerY);
    const rawSafeY = Math.max(
      focusY + Math.sin(this.camPitch) * effDist + 0.35 * metrics.cameraDistanceMultiplier,
      groundAtCam + metrics.cameraGroundClearance
    );
    const safeY = this.inUndergroundCave
      ? Math.min(CAVE_FLOOR_Y + 9.0, rawSafeY)
      : rawSafeY;
    this.camera.position.set(desiredX, safeY, desiredZ);
    _camCurrentLook.set(this.playerX, focusY, this.playerZ);
    this.camera.lookAt(_camCurrentLook);
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
    this.firefliesWorld.snapVisibility(this.timeHours, this.weather);
    this.showNotice(
      res.isNight
        ? 'Night Mode · Starry Countryside (22:15)'
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

  public setSeason(season: SeasonType): void {
    this.season = season;
    const label = SEASON_LABELS[season];
    this.showNotice(`Season changed to ${label.name} (${label.tamil})`);
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
    this.wildlifeWorld.group.visible = false;
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

    this.skyWater.group.visible = true;
    this.nature.group.visible = true;
    this.architecture.group.visible = true;
    this.personalHome.group.visible = true;
    this.regionsWorld.group.visible = true;
    this.avsSnowHouse.group.visible = true;
    this.frozenKingdom.surfaceGroup.visible = true;
    this.skyExplorerWorld.group.visible = true;
    this.skyTaxiWorld.group.visible = true;
    this.exhibitionComplexWorld.group.visible = true;
    this.wildlifeWorld.group.visible = true;
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
      boatId === 'bamboo_catamaran' || boatId === 'tribal_outrigger' ? 11.2 : 7.6;
    this.camera.position.set(
      boat.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * boatDist,
      Math.max(1.8, Math.sin(this.camPitch) * boatDist + 2.1),
      boat.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * boatDist
    );
    _camCurrentLook.set(
      boat.x + Math.sin(boat.heading) * 1.4,
      1.1,
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
      this.skyWater.group.visible = true;
      this.nature.group.visible = true;
      this.architecture.group.visible = true;
      this.personalHome.group.visible = true;
      this.regionsWorld.group.visible = true;
      this.avsSnowHouse.group.visible = true;
      this.frozenKingdom.surfaceGroup.visible = true;
      this.skyExplorerWorld.group.visible = true;
      this.skyTaxiWorld.group.visible = true;
      this.exhibitionComplexWorld.group.visible = true;
      this.wildlifeWorld.group.visible = true;
      this.frozenKingdom.caveGroup.visible = false;
      this.scene.background = null;
    }
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
        if (distToDock <= 9.5) {
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
      const padId =
        prompt.metaId === 'avs' || prompt.metaId === 'home'
          ? (prompt.metaId as SkyExplorerPadId)
          : undefined;
      this.boardSkyExplorer(padId);
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
        this.camYaw += dt * 1.45 * this.settings.cameraSensitivity;
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
          this.audio.playStationChime();
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
        } else if (this.trainState.phase === 'approaching' && distToTrain < 95) {
          this.audio.playDistantTrainHorn(1 - distToTrain / 110);
        }
        this.prevTrainPhase = this.trainState.phase;
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
      const hasMove = combined.magnitude > 0.01;
      if (hasMove && this.isSitting) {
        this.isSitting = false;
        this.sittingSpot = null;
      }

      if (!this.isSitting) {
        const activeMode = this.icelandState.isGiant || this.isSwimming ? 'walk' : this.transportMode;
        const spec = TRANSPORT_SPECS[activeMode];
        const swimSpeedFactor = this.isSwimming ? 0.72 : 1.0;
        const maxSpeed =
          (isSprinting ? spec.sprintSpeed : spec.cruiseSpeed) *
          scaleMetrics.moveSpeedMultiplier *
          swimSpeedFactor;

        let targetVx = 0;
        let targetVz = 0;
        if (hasMove) {
          const fwdX = -Math.sin(this.camYaw);
          const fwdZ = -Math.cos(this.camYaw);
          const rightX = Math.cos(this.camYaw);
          const rightZ = -Math.sin(this.camYaw);

          targetVx = (fwdX * combined.forward + rightX * combined.right) * maxSpeed;
          targetVz = (fwdZ * combined.forward + rightZ * combined.right) * maxSpeed;
        }

        const rate = hasMove ? spec.accel : spec.decel;
        const blend = 1 - Math.exp(-rate * dt);
        this.playerVx += (targetVx - this.playerVx) * blend;
        this.playerVz += (targetVz - this.playerVz) * blend;

        const nextX = this.playerX + this.playerVx * dt;
        const nextZ = this.playerZ + this.playerVz * dt;
        if (this.inUndergroundCave) {
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
            scaleMetrics.collisionRadius,
            this.allColliders,
            this.playerY,
            true // Allow wading & swimming freely in Neelam Lake & Kadalkarai Ocean!
          );
          this.playerX = resolved.x;
          this.playerZ = resolved.z;
        }

        const wasSwimming = this.isSwimming;
        const groundRefY = this.playerY - this.jumpState.offsetY;
        const groundY = this.inUndergroundCave
          ? getCaveFloorHeightAt(this.playerX, this.playerZ)
          : walkableHeightWithFloor(this.playerX, this.playerZ, groundRefY);
        const effWaterLevel = getEffectiveWaterLevel(this.extremeWeatherState.floodLevel);
        const floodedHere =
          !this.inUndergroundCave &&
          this.extremeWeatherState.floodLevel > WATER_LEVEL + 0.15 &&
          groundY < effWaterLevel - 0.14;
        const onWater =
          !this.inUndergroundCave &&
          ((isSwimmableWaterAt(this.playerX, this.playerZ) && groundY < WATER_LEVEL - 0.12) ||
            floodedHere);
        this.isSwimming = onWater;

        const jumpStep = stepJumpState(this.jumpState, dt, {
          scale: this.icelandState.playerScale,
          transportMode: activeMode,
          canJump: this.mode === 'playing' && !this.isSitting,
        });
        this.jumpState = jumpStep.state;
        if (jumpStep.jumped) {
          this.audio.playJump(scaleMetrics.footstepPitchMultiplier);
        }
        if (jumpStep.landed) {
          if (onWater) {
            this.audio.playBoatSplash();
          } else {
            this.audio.playLand(scaleMetrics.footstepPitchMultiplier);
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
        } else {
          this.playerY = groundY + this.jumpState.offsetY;
        }

        moveSpeed = Math.hypot(this.playerVx, this.playerVz);
        if (moveSpeed > 0.2) {
          const desiredHeading = Math.atan2(this.playerVx, this.playerVz);
          let diff = desiredHeading - this.playerHeading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const stepYaw = diff * (1 - Math.exp(-spec.turnRate * dt));
          this.playerHeading += stepYaw;
          this.currentTurnRate = stepYaw / Math.max(0.008, dt);
        }
      }
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

    if (this.inUndergroundCave) {
      this.sunLight.color.setHex(0x88e6ff);
      this.sunLight.intensity = 1.15;
      this.hemiLight.color.setHex(0x74e0ff);
      this.hemiLight.groundColor.setHex(0x283e5e);
      this.hemiLight.intensity = 1.45;
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

    if (!this.inUndergroundCave) {
      this.skyWater.update(this.elapsed, dt, palette, _sunDir);
      this.architecture.update({
        elapsed: this.elapsed,
        dt,
        timeHours: this.timeHours,
        lanternStrength: palette.lanternStrength,
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
        isSteamVisible
      );

      const distToHome = Math.hypot(
        this.playerX - HOME_CENTER.x,
        this.playerZ - HOME_CENTER.z
      );
      if (distToHome < 72 || this.elapsed < 0.25) {
        this.personalHome.applyHomeState(this.homeState, palette.lanternStrength, this.elapsed);
      }

      this.regionsWorld.update(
        this.elapsed,
        dt,
        _sunDir,
        _skyCol,
        _sunCol,
        palette.lanternStrength,
        this.campingState,
        this.playerX,
        this.playerZ
      );
      this.vehiclesWorld.syncBus(this.busState, this.elapsed, palette.lanternStrength);
      this.vehiclesWorld.syncBoats(this.boats, this.elapsed);

      const distToForest = Math.hypot(
        this.playerX - ENCHANTED_FOREST_CENTER.x,
        this.playerZ - ENCHANTED_FOREST_CENTER.z
      );
      const distToCamper = Math.hypot(
        this.playerX - this.camperState.x,
        this.playerZ - this.camperState.z
      );
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
          palette.lanternStrength
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
      const distToAvs = Math.hypot(
        this.playerX - AVS_SNOW_HOUSE_CENTER.x,
        this.playerZ - AVS_SNOW_HOUSE_CENTER.z
      );
      this.avsSnowHouse.group.visible = distToAvs < 245;
      if (distToAvs < 190 || this.elapsed < 0.25) {
        this.avsSnowHouse.update(palette.lanternStrength);
      }
      if (distToAvs < 245 || this.elapsed < 0.25) {
        this.frozenKingdom.update(this.elapsed, palette.lanternStrength, false);
      }

      const distToExhibition = Math.hypot(
        this.playerX - EXHIBITION_ISLAND_CENTER.x,
        this.playerZ - EXHIBITION_ISLAND_CENTER.z
      );
      this.exhibitionComplexWorld.group.visible = distToExhibition < 285;
      if (distToExhibition < 230 || this.elapsed < 0.25) {
        this.exhibitionComplexWorld.update(
          this.elapsed,
          palette.lanternStrength,
          this.playerX,
          this.playerZ
        );
      }

      // Step Offshore SSJ Dinosaur Island (chasing T-Rex, wall shatters 1->4, Safari Car & AK-47 tracer)
      const distToDino = Math.hypot(
        this.playerX - DINOSAUR_ISLAND_CENTER.x,
        this.playerZ - DINOSAUR_ISLAND_CENTER.z
      );
      const onDinoIslandNow =
        this.activeVehicle === 'safari_car' || isOnDinosaurIsland(this.playerX, this.playerZ);
      this.dinosaurIslandWorld.group.visible = onDinoIslandNow || distToDino < 285;
      if (onDinoIslandNow || distToDino < 210 || this.elapsed < 0.25) {
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
          palette.lanternStrength
        );
      }
    } else {
      // Underground Cave fast path: only update cave glow & motes
      this.frozenKingdom.update(this.elapsed, palette.lanternStrength, true);
    }

    // Re-evaluate <= 4 active nearest dynamic lights at 5Hz (slashes fragment shader cost!)
    this.lightBudgetTimer += dt;
    if (this.lightBudgetTimer >= 0.2) {
      this.lightBudgetTimer = 0;
      this.updateLocalLightBudget();
    }

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
    } else {
      const { footstepTriggered, skatePushTriggered } = this.playerRig.setPose({
        x: this.playerX,
        y: this.playerY,
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
        visible: true,
        lanternStrength: palette.lanternStrength,
        elapsed: this.elapsed,
        dt,
      });

      if (footstepTriggered && this.mode === 'playing' && !this.isSwimming && !this.jumpState.isAirborne) {
        const surface = this.playerY > 0.4 ? 'wood' : 'grass';
        this.audio.playFootstep(surface, scaleMetrics.footstepPitchMultiplier);
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
            if (this.inUndergroundCave) {
              return getCaveFloorHeightAt(cx, cz);
            }
            const effWater = getEffectiveWaterLevel(this.extremeWeatherState.floodLevel);
            const gY = walkableHeightWithFloor(cx, cz, this.playerY);
            if (isSwimmableWaterAt(cx, cz) || (this.extremeWeatherState.floodLevel > WATER_LEVEL + 0.15 && gY < effWater - 0.14)) {
              return effWater + 0.04 + Math.sin(this.elapsed * 2.4) * 0.04;
            }
            return gY;
          },
          this.isSwimming || this.inUndergroundCave ? () => false : isWaterAt,
          currentRegion,
          this.inUndergroundCave ? () => false : isObstacleBlocked
        );
      }
      this.companionRig.setPose(this.companionState, this.elapsed, {
        lanternStrength: palette.lanternStrength,
        dt,
      });
    }

    // 7. Spatial Regional Audio
    const distToOcean = Math.max(0, 112 - this.playerX) + Math.max(0, 20 - this.playerZ);
    const distToWaterfall = Math.hypot(this.playerX - WATERFALL_CENTER.x, this.playerZ - WATERFALL_CENTER.z);
    const activeBoat = this.activeBoatId ? this.boats.find((b) => b.id === this.activeBoatId) : null;

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
    });

    // 8. Camera Choreography
    this.updateCamera(dt);
  }

  private updateCamera(dt: number): void {
    const damp = 1 - Math.exp(-6.5 * dt);

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

    // Scale-aware third-person exploration camera (smoothly pulls back & widens FOV when Giant in Iceland!)
    const metrics = getScaleGameplayMetrics(
      this.icelandState.playerScale,
      this.isSitting,
      this.transportMode === 'bicycle'
    );
    const targetFov = 52 + metrics.cameraFovBonus;
    if (Math.abs(this.camera.fov - targetFov) > 0.08) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, damp);
      this.camera.updateProjectionMatrix();
    }

    const vehicleDistBonus =
      !this.icelandState.isGiant && this.transportMode === 'bicycle'
        ? 0.85
        : !this.icelandState.isGiant && this.transportMode === 'skateboard'
        ? 0.45
        : 0;
    const inHomeInterior =
      Math.abs(this.playerX - HOME_CENTER.x) < 6.4 && Math.abs(this.playerZ - HOME_CENTER.z) < 5.4;
    const baseDist = inHomeInterior ? Math.min(this.camDistance, 3.3) : this.camDistance + vehicleDistBonus;
    const effectiveDist = baseDist * metrics.cameraDistanceMultiplier;
    const camAnchorY = this.playerY - this.jumpState.offsetY * 0.68;
    const focusY = camAnchorY + metrics.cameraFocusHeight;
    _camTargetLook.set(this.playerX, focusY, this.playerZ);

    const horiz = Math.cos(this.camPitch) * effectiveDist;
    const rawDirX = Math.sin(this.camYaw) * horiz;
    const rawDirZ = Math.cos(this.camYaw) * horiz;

    let safeScale = 1.0;
    if (!this.icelandState.isGiant) {
      const steps = 6;
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
          safeScale = Math.max(0.32, (s - 1) / steps);
          break;
        }
      }
    }

    const desiredX = this.playerX + rawDirX * safeScale;
    const desiredZ = this.playerZ + rawDirZ * safeScale;
    const desiredY =
      focusY +
      Math.sin(this.camPitch) * effectiveDist * safeScale +
      0.35 * metrics.cameraDistanceMultiplier;
    const groundAtCam = this.inUndergroundCave
      ? getCaveFloorHeightAt(desiredX, desiredZ)
      : walkableHeightWithFloor(desiredX, desiredZ, this.playerY);
    const maxCaveCamY = CAVE_FLOOR_Y + 9.2;
    const safeY = this.inUndergroundCave
      ? Math.min(maxCaveCamY, Math.max(desiredY, groundAtCam + 0.9))
      : Math.max(desiredY, groundAtCam + metrics.cameraGroundClearance);

    _camTargetPos.set(desiredX, safeY, desiredZ);
    this.camera.position.lerp(_camTargetPos, damp);
    _camCurrentLook.lerp(_camTargetLook, 1 - Math.exp(-10 * dt));
    this.camera.lookAt(_camCurrentLook);
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
    const loc = inMidnightValley
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
    const rawDt = (nowMs - this.lastFrameMs) / 1000;
    this.lastFrameMs = nowMs;
    const maxDt = this.isSoftwareGl ? 0.1 : 0.05;
    const dt = Math.min(Math.max(rawDt, 0.001), maxDt);
    this.elapsed += dt;

    this.updateSimulation(dt);
    this.renderer.render(this.scene, this.camera);

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.25) {
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
    this.playerRig.dispose();
    this.companionRig.dispose();
    this.personalHome.dispose();
    this.regionsWorld.dispose();
    this.vehiclesWorld.dispose();
    this.enchantedForest.dispose();
    this.firefliesWorld.dispose();
    this.wildlifeWorld.dispose();
    this.dinosaurIslandWorld.dispose();
    this.peopleSystem.dispose();
    this.navigationGuide.dispose();
    this.midnightPortal.dispose();
    this.avsSnowHouse.dispose();
    this.frozenKingdom.dispose();
    this.skyExplorerWorld.dispose();
    this.skyTaxiWorld.dispose();
    this.exhibitionComplexWorld.dispose();
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
