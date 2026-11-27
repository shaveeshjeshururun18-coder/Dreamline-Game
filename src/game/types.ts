import type { NavigationHudState } from './navigation';
import type { BusDispatchState } from './busHailing';
import type { SkyTaxiState } from './skyTaxi';
import type { ActiveHeroRuntimeState } from './heroCharacters';
import type { BatmobileState } from './batmobile';
import type { SnowmanTaxiState } from './snowmanTaxi';
import type {
  CameraPerspectiveMode,
  JetSkiState,
  SafariJeepState,
  VtolAircraftState,
} from './expeditionVehicles';
import type { DirtBike49ccState } from './dirtBike';
import type { HoverGliderState } from './hoverGlider';
import type { WildlifeDiscoverySnapshot } from './wildlifeEcosystem';

export type GameMode =
  | 'title'
  | 'playing'
  | 'paused'
  | 'camera'
  | 'map'
  | 'transit_map'
  | 'inspect'
  | 'home_menu'
  | 'journal'
  | 'route_select'
  | 'ticket'
  | 'ai_conductor'
  | 'mobile_phone'
  | 'midnight_frontier'
  | 'exhibition_vehicle'
  | 'hero_armory'
  | 'snowman_taxi'
  | 'wildlife_guide';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type SizeMode = 'auto' | 'giant' | 'small';

export type RegionId = 'coastal' | 'snow' | 'sakura' | 'countryside' | 'lake_camp' | 'desert' | 'airport';

export type TimePeriod =
  | 'morning'
  | 'afternoon'
  | 'golden'
  | 'sunset'
  | 'evening'
  | 'night';

export type WeatherType =
  | 'clear'
  | 'breeze'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'ferocious_rain'
  | 'flood'
  | 'tsunami'
  | 'snow';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export type DayCyclePreference = 'dynamic' | 'slow' | 'frozen';

export type TransportMode = 'walk' | 'bicycle' | 'skateboard';

export type VehicleKind =
  | 'none'
  | 'train'
  | 'bus'
  | 'boat'
  | 'camper'
  | 'safari_car'
  | 'sky_explorer'
  | 'batmobile'
  | 'airliner'
  | 'vault_car'
  | 'submarine'
  | 'safari_jeep'
  | 'vtol_aircraft'
  | 'jetski_sport'
  | 'jetski_perf'
  | 'dirt_bike_49cc'
  | 'hover_glider'
  | 'orange_heli';

export type BoatId =
  | 'lake_boat'
  | 'coastal_boat'
  | 'bamboo_catamaran'
  | 'tribal_outrigger'
  | 'sovereign_ship'
  | 'ssj_expedition_boat';

export type TrainViewMode = 'window' | 'cabin' | 'driver' | 'exterior';

export type BoyOutfitId =
  | 'navy_jacket'
  | 'coastal_tee'
  | 'winter_parka'
  | 'igloo_man'
  | 'alan_grant';

export type HomeDecorStyle = 'warm_wood' | 'coastal_breeze' | 'botanical';

export type FrostyEmote =
  | 'none'
  | 'wave'
  | 'dance'
  | 'happy_bounce'
  | 'snowball'
  | 'curious'
  | 'sleeping';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  resolutionScale: number; // 0.6 to 1.0
  mouseSensitivity: number; // 0.3 to 2.0
  cameraSensitivity: number; // 0.3 to 2.0
  soundVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  muted: boolean;
  brightness: number; // 0.75 to 1.35
  dayCycleMode: DayCyclePreference;
}

export interface LocationInfo {
  id: string;
  regionId: RegionId;
  name: string;
  jpName: string; // Tamil display name
  subtitle: string;
  x: number;
  z: number;
  teleportX?: number;
  teleportZ?: number;
}

export type InteractableKind =
  | 'bench'
  | 'train_board'
  | 'bus_board'
  | 'boat_board'
  | 'timetable'
  | 'info_board'
  | 'vending_machine'
  | 'station_door'
  | 'viewpoint'
  | 'camp_tent'
  | 'camp_fire'
  | 'camp_cook'
  | 'camp_sleep'
  | 'home_bed'
  | 'home_wardrobe'
  | 'home_kitchen'
  | 'home_decor'
  | 'frosty_igloo'
  | 'companion_talk'
  | 'batmobile_drive'
  | 'iceland_transfer'
  | 'iceland_return'
  | 'giant_igloo_man'
  | 'transit_board'
  | 'npc_talk'
  | 'camper_drive'
  | 'safari_car_drive'
  | 'midnight_frontier_portal'
  | 'midnight_frontier_discovery'
  | 'midnight_frontier_door'
  | 'midnight_frontier_cellar'
  | 'cave_enter'
  | 'cave_exit'
  | 'sky_explorer_fly'
  | 'sky_taxi_board'
  | 'exhibition_vehicle'
  | 'home_avatar_stand'
  | 'metro_enter'
  | 'metro_exit'
  | 'metro_train_board'
  | 'airliner_board'
  | 'home_hero_hall'
  | 'hero_hq_switch'
  | 'parachute_tower_launch'
  | 'home_vault_toggle'
  | 'home_vault_enter'
  | 'home_vault_exit'
  | 'vault_hero_pod'
  | 'vault_car_drive'
  | 'vault_exit_gate'
  | 'submarine_board'
  | 'ocean_hero_console'
  | 'snowman_island_return'
  | 'safari_jeep_drive'
  | 'vtol_aircraft_fly'
  | 'jetski_sport_ride'
  | 'jetski_perf_ride'
  | 'dirt_bike_49cc_ride'
  | 'hover_glider_ride'
  | 'orange_heli_fly'
  | 'jurassic_gate_toggle'
  | 'vehicle_garage_console'
  | 'airport_aircraft_stand'
  | 'terrace_aircraft_lever';

export interface InteractableItem {
  id: string;
  kind: InteractableKind;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  z: number;
  facingAngle?: number;
  radius: number;
  locationId?: string;
  metaId?: string;
}

export type TrainPhase = 'cruising' | 'approaching' | 'stopped' | 'departing';

export type TrainBoardingStatus = 'arriving' | 'boarding' | 'waiting' | 'departing' | 'in_transit';

export interface StationStop {
  id: string;
  name: string;
  jpName: string;
  regionTag: string;
  connectsToIceland?: boolean;
  isDinosaurIsland?: boolean;
  splineT: number; // 0..1 along closed loop
  platformSide: 1 | -1;
  worldX: number;
  worldZ: number;
  platformX: number;
  platformZ: number;
  tangentAngle: number;
}

export interface TrainRoutePlan {
  id: string;
  originStationIndex: number;
  /** Ordered upcoming station indices (excluding origin) that the train MUST stop at; last entry is destinationIndex */
  selectedStopIndices: number[];
  destinationIndex: number;
  /** Ordered upcoming station indices along the loop from origin -> destination (inclusive) */
  allUpcomingIndices: number[];
  visitedStopIndices: number[];
  skippedStopIndices: number[];
  status: 'planning' | 'active' | 'completed';
  departureTimeHours: number;
  estimatedArrivalTimeHours: number;
  totalRouteMeters: number;
  remainingMeters: number;
  includesIcelandTransfer: boolean;
}

export interface DigitalTrainTicket {
  ticketId: string;
  routePlanId: string;
  operatorName: string;
  trainName: string;
  trainNumber: string;
  ticketClass: string;
  carriageNumber: string;
  seatNumber: string;
  travelDate: string;
  departureTime: string;
  estimatedArrivalTime: string;
  originStationIndex: number;
  originStationId: string;
  originName: string;
  originTamilName: string;
  destinationStationIndex: number;
  destinationStationId: string;
  destinationName: string;
  destinationTamilName: string;
  selectedStopIndices: number[];
  intermediateStopIndices: number[];
  intermediateStopNames: string[];
  skippedStopIndices: number[];
  allUpcomingIndices: number[];
  includesIcelandTransfer: boolean;
  qrSeed: string;
  issuedAt: number;
}

export interface IcelandState {
  inIceland: boolean;
  playerScale: number;
  targetScale: number;
  playerHeightMeters: number;
  iglooManHeightMeters: number;
  isGiant: boolean;
  stayGiantThroughout: boolean;
  sizeMode: SizeMode;
  transformProgress: number; // 0 = normal, 1 = full giant
  greetedIglooMan: boolean;
}

export interface TrainState {
  trainName: string;
  trainNumber: string;
  t: number; // 0..1 along railway loop
  speed: number;
  speedKmh: number;
  phase: TrainPhase;
  boardingStatus: TrainBoardingStatus;
  doorOpen: number; // 0..1
  dwellTimer: number;
  dwellHold: boolean;
  currentStationIndex: number;
  nextStationIndex: number;
  etaSeconds: number;
  worldX: number;
  worldZ: number;
  heading: number;
  routePlan: TrainRoutePlan | null;
  lastPassedStationIndex: number | null;
  journeyProgress: number; // 0..1 along active route
}

export interface BusStop {
  id: string;
  name: string;
  tamilName: string;
  splineT: number;
  worldX: number;
  worldZ: number;
  stopX: number;
  stopZ: number;
  tangentAngle: number;
}

export interface BusState {
  t: number;
  speed: number;
  speedKmh: number;
  phase: TrainPhase;
  doorOpen: number;
  dwellTimer: number;
  currentStopIndex: number;
  nextStopIndex: number;
  etaSeconds: number;
  worldX: number;
  worldZ: number;
  heading: number;
  inVault?: boolean;
}

export interface BoatState {
  id: BoatId;
  name: string;
  tamilName: string;
  waterZone: 'lake' | 'ocean';
  x: number;
  z: number;
  heading: number;
  speed: number;
  dockX: number;
  dockZ: number;
  exitX: number;
  exitZ: number;
  inVault?: boolean;
}

export interface CamperState {
  name: string;
  x: number;
  z: number;
  heading: number;
  speed: number;
  speedKmh: number;
  steerAngle: number;
  wheelSpin: number;
  isBraking: boolean;
  doorsOpen: boolean;
  roofPopped: boolean;
  headlightsOn: boolean;
  hazardsOn: boolean;
  leftIndicator: boolean;
  rightIndicator: boolean;
  inVault?: boolean;
}

export interface SafariCarState {
  x: number;
  z: number;
  heading: number;
  speed: number;
  speedKmh: number;
  steerAngle: number;
  wheelSpin: number;
  inVault?: boolean;
}

export interface DinosaurTriangleTrackPlaceHud {
  id: string;
  order: number;
  name: string;
  shortName: string;
  subtitle: string;
  x: number;
  z: number;
  visited: boolean;
  isCurrent: boolean;
}

export interface DinosaurTriangleTrackHudState {
  onTrack: boolean;
  activePlaceId: string;
  activePlaceName: string;
  activePlaceSubtitle: string;
  activePlaceOrder: number;
  nextPlaceName: string;
  distanceToNextM: number;
  visitedCount: number;
  totalPlaces: number;
  places: DinosaurTriangleTrackPlaceHud[];
}

export interface DinosaurIslandHudState {
  onIsland: boolean;
  explorerHp: number;
  explorerMaxHp: number;
  dinoHp: number;
  dinoMaxHp: number;
  dinoAlive: boolean;
  kills: number;
  brokenWalls: number;
  wallsIntact: [boolean, boolean, boolean, boolean];
  bannerText: string;
  statusLine: string;
  roofDoorCloseProgress: number;
  roofDoorClosed: boolean;
  nearestGateName: string;
  nearestGateOpenProgress: number;
  triangleTrack: DinosaurTriangleTrackHudState;
}

export interface CampingState {
  tentPitched: boolean;
  fireLit: boolean;
  mealsCooked: number;
  nightsCamped: number;
}

export interface HomeState {
  outfit: BoyOutfitId;
  decorStyle: HomeDecorStyle;
  fairyLightsOn: boolean;
  mealsPrepared: number;
}

export interface CompanionMemory {
  visitedRegions: RegionId[];
  trainRides: number;
  busRides: number;
  boatRides: number;
  campingNights: number;
  homeVisits: number;
  snowSculpturesBuilt?: number;
  memoriesLog: string[];
  spokenIds: string[];
}

export interface CompanionState {
  name: string;
  tamilName: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  activity: 'following' | 'idle' | 'sitting' | 'train' | 'bus' | 'boat' | 'campfire' | 'sleeping';
  emote: FrostyEmote;
  emoteTimer: number;
  restingInIgloo: boolean;
  regionMood: RegionId;
  currentLine: string | null;
  lineTimer: number;
  cooldownTimer: number;
}

export interface PostcardRecord {
  id: string;
  dataUrl: string;
  locationName: string;
  jpName: string;
  timeLabel: string;
  period: TimePeriod;
  weather: WeatherType;
  capturedAt: number;
}

export interface ScenicSpot {
  id: string;
  regionId: RegionId;
  name: string;
  jpName: string;
  description: string;
  x: number;
  z: number;
  radius: number;
}

export interface HudSnapshot {
  location: LocationInfo;
  regionId: RegionId;
  timeHours: number;
  timeFormatted: string;
  period: TimePeriod;
  weather: WeatherType;
  season: SeasonType;
  temperatureC: number;
  manualTemperatureC: number | null;
  isNightMode: boolean;
  lanternOn: boolean;
  isSwimming: boolean;
  isJumping: boolean;
  floodLevel: number;
  tsunamiActive: boolean;
  transportMode: TransportMode;
  activeVehicle: VehicleKind;
  activeBoatId: BoatId | null;
  boatFpvMode: boolean;
  playerX: number;
  playerY: number;
  playerZ: number;
  playerHeading: number;
  isSitting: boolean;
  isOnTrain: boolean;
  trainViewMode: TrainViewMode;
  train: TrainState;
  activeTicket: DigitalTrainTicket | null;
  iceland: IcelandState;
  nearbyStationIndex: number | null;
  bus: BusState;
  boats: BoatState[];
  camper: CamperState;
  skyExplorer: {
    x: number;
    y: number;
    z: number;
    speedKmh: number;
    altitudeM: number;
    boostActive: boolean;
  };
  camping: CampingState;
  home: HomeState;
  companion: CompanionState;
  companionMemory: CompanionMemory;
  activePrompt: InteractableItem | null;
  discoveredSpotIds: string[];
  recentNotice: string | null;
  canExitTrain: boolean;
  canExitBus: boolean;
  canTransferToIceland: boolean;
  dinosaurIsland: DinosaurIslandHudState;
  safariCarSpeedKmh: number;
  trainDriverMode: boolean;
  busDriverMode: boolean;
  navigation: NavigationHudState | null;
  busDispatch: BusDispatchState;
  skyTaxi: SkyTaxiState;
  midnightFrontierOpen: boolean;
  inUndergroundCave: boolean;
  caveAreaName: string | null;
  exhibitionTestVehicleId: string | null;
  hero: ActiveHeroRuntimeState;
  batmobile: BatmobileState;
  metroDestruction: {
    score: number;
    buildingsDestroyed: number;
    totalBuildings: number;
    propsDestroyed: number;
    totalProps: number;
    inMetroCity: boolean;
  };
  stationAnnouncement: {
    id: string;
    stationName: string;
    localName: string;
    regionTag: string;
    chimeName: string;
    text: string;
    eventKind: 'approaching' | 'arrived' | 'departing' | 'ambient';
  } | null;
  inUndergroundMetro: boolean;
  metroStationId: string | null;
  metroStationName: string | null;
  subwayTrainStatus: string;
  subwayTrainAtPlatform: boolean;
  subwayRidingTo: string | null;
  airliner: {
    speedKmh: number;
    altitudeM: number;
    throttle: number;
    afterburner: boolean;
    landingGearDown: boolean;
    onGround: boolean;
  };
  parachuteActive: boolean;
  homeVault: {
    inPersonalHome: boolean;
    hatchUnlocked: boolean;
    hatchOpenProgress: number;
    inVault: boolean;
    elevatorPhase: 'idle' | 'descending' | 'ascending';
    elevatorProgress: number;
    elevatorY: number;
    exitGateOpen: boolean;
    exitGateProgress: number;
    activeVaultCarName: string | null;
    activeVaultCarSpeedKmh: number;
    activeVaultCarBoost: boolean;
    megaChamberDistanceM: number;
    inMegaChamber: boolean;
  };
  submarine: {
    active: boolean;
    depthM: number;
    speedKmh: number;
    submerged: boolean;
    searchlightOn: boolean;
  };
  snowmanRescue: {
    phase: 'idle' | 'approaching' | 'boarding' | 'transporting' | 'arrived';
    oceanSwimSeconds: number;
    thresholdSeconds: number;
    inOceanWater: boolean;
    rescuesCompleted: number;
  };
  snowmanTaxi: SnowmanTaxiState;
  cameraPerspective: CameraPerspectiveMode;
  expedition: {
    jeep: SafariJeepState;
    vtol: VtolAircraftState;
    sportJetSki: JetSkiState;
    perfJetSki: JetSkiState;
    dirtBike: DirtBike49ccState;
    hoverGlider: HoverGliderState;
  };
  wildlife: WildlifeDiscoverySnapshot;
  underwater: {
    submerged: boolean;
    depthM: number;
    vignetteAlpha: number;
    reefZoneName: string | null;
  };
  trainDriverNotch: -1 | 0 | 1 | 2 | 3;
  trainGradeType: 'surface' | 'elevated' | 'subway_tunnel';
  orangeHeli: {
    name: string;
    speedKmh: number;
    altitudeM: number;
    boostActive: boolean;
  };
}

export interface SaveData {
  version: number;
  playerX: number;
  playerZ: number;
  playerHeading: number;
  timeHours: number;
  weather: WeatherType;
  transportMode?: TransportMode;
  discoveredSpotIds: string[];
  camping?: CampingState;
  home?: HomeState;
  companionMemory?: CompanionMemory;
  activeTicket?: DigitalTrainTicket | null;
  greetedIglooMan?: boolean;
  stayGiantThroughout?: boolean;
  sizeMode?: SizeMode;
  season?: SeasonType;
  savedAt: number;
}

export interface InspectContent {
  kind: 'timetable' | 'info_board' | 'vending_machine' | 'midnight_lore';
  title: string;
  jpTitle: string;
  stationName: string;
  bodyText?: string;
}
