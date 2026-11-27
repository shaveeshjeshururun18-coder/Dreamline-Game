import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATLAS_BASE_H,
  ATLAS_BASE_W,
  ATLAS_BOUNDS,
  ATLAS_PINS,
  ATLAS_REGION_PRESETS,
  atlasToWorldX,
  atlasToWorldZ,
  clampAtlasCamera,
  computeAtlasScaleBar,
  computeAtlasViewBox,
  sampleAtlasPixelRGB,
  worldToAtlasX,
  worldToAtlasY,
} from './worldAtlas';
import {
  HERO_CHARACTERS,
  getHeroById,
  getHeroOutfitById,
  cycleHeroOutfit,
  createInitialHeroRuntimeState,
  getAllWearableSuits,
  filterWearableSuits,
  getHeroPowerOptions,
} from './heroCharacters';
import {
  CAMERA_PERSPECTIVES,
  createInitialJetSkiState,
  createInitialSafariJeepState,
  createInitialVtolAircraftState,
  cycleCameraPerspective,
  getSurfacePhysicsParams,
  getTerrainSurfaceAt,
  sampleWaterWaveHeight,
  stepJetSki,
  stepSafariJeep,
  stepVtolAircraft,
  VTOL_AIRCRAFT_SPAWN,
} from './expeditionVehicles';
import {
  computeUnderwaterAtmosphere,
  createMarineLifeActors,
  stepMarineLifeActors,
} from './underwaterOcean';
import {
  WILDLIFE_SPECIES_CATALOG,
  createInitialWildlifeEcosystem,
  findWildlifeInViewfinder,
  stepWildlifeEcosystem,
} from './wildlifeEcosystem';
import {
  LAND_TRANSPORT_OPTIONS,
  SNOWMAN_TRANSPORTS,
  WATER_TRANSPORT_OPTIONS,
  createInitialSnowmanTaxiState,
  dispatchSnowmanTaxi,
  stepSnowmanTaxi,
  triggerInstantCycleJetSkiMorph,
} from './snowmanTaxi';
import { resolveGraphicsProfile } from './graphicsQuality';
import {
  createWeatherOverlayParticles,
  resolveWeatherOverlayConfig,
  resolveWeatherVignetteProfile,
  stepWeatherOverlayParticles,
} from './weatherOverlay';
import {
  createInitialPlayerLanternState,
  setPlayerLanternOverride,
  stepPlayerLantern,
  togglePlayerLantern,
} from './playerLantern';
import {
  applyScreenOrbitInput,
  applyScreenZoomInput,
  createInitialSmoothCameraState,
  createInitialSmoothLocomotionState,
  dampAngleSpring,
  dampScalarSpring,
  filterFrameDt,
  filterMovementInput,
  stepSmoothCameraOrbit,
  stepSmoothCameraRig,
  stepSmoothLocomotionVisuals,
  syncSmoothCameraImmediate,
  syncSmoothLocomotionImmediate,
} from './smoothCameraMotion';
import {
  VAULT_BATMOBILE_BAY,
  VAULT_CAR_SPECS,
  VAULT_CONNECTOR_MAX_X,
  VAULT_CONNECTOR_MIN_X,
  VAULT_EXIT_GATE_X,
  VAULT_EXIT_TUNNEL_POS,
  VAULT_FLOOR_Y,
  VAULT_HALF_X,
  VAULT_HALF_Z,
  VAULT_HEIGHT,
  VAULT_HERO_PODS,
  VAULT_HOME_INTERIOR_DOOR_WORLD,
  VAULT_HOME_TUNNEL_MOUTH_Z,
  VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z,
  VAULT_HOME_TUNNEL_RAMP_TOP_Z,
  VAULT_HOME_TUNNEL_X,
  VAULT_MEGA_CHAMBER_LENGTH,
  VAULT_MEGA_END_Z,
  VAULT_MEGA_START_Z,
  VAULT_PASSAGE_END_X,
  VAULT_SURFACE_DRIVE_EXIT,
  clampVaultPosition,
  createInitialHomeVaultState,
  getVaultMegaChamberDistanceM,
  isEnteringHouseSecretTunnelFromSurface,
  isExitingHouseSecretTunnelToSurface,
  isInsideMegaChamber,
  isInsideVaultDriveExitTunnel,
  isPlayerInsidePersonalHome,
  stepSecretHatchAnimation,
  stepVaultCarState,
  stepGenericVehicleVaultTunnel,
  toggleSecretVaultHatch,
  toggleVaultExitGate,
  vaultFloorYAt,
  type VaultCarRuntimeState,
} from './homeUndergroundVault';
import {
  AIRPORT_CENTER,
  AIRPORT_GROUND_Y,
  AIRPORT_RUNWAY_BOUNDS,
  AIRPORT_SPAWN,
  HERO_HQ_INTERSECTION_POS,
  METRO_FLOOR_Y,
  METRO_MEZZANINE_Y,
  METRO_SURFACE_ENTRANCES,
  PARACHUTE_TOWER_POS,
  clampUndergroundMetroPosition,
  computeSimultaneousSubwayState,
  createInitialAirlinerState,
  createInitialParachuteState,
  createInitialSubwayTrainState,
  getHeroHqCollider,
  getUndergroundMetroFloorY,
  isInsideAirport,
  stepAirlinerState,
  stepParachuteGlide,
  stepSubwayTrainState,
} from './airportMetro';
import {
  OCEAN_HERO_SUIT_PODS,
  OCEAN_HERO_TOWER_CENTER,
  OCEAN_RESCUE_THRESHOLD_SECONDS,
  SNOWMAN_ISLAND_CENTER,
  SNOWMAN_ISLAND_SPAWN,
  SUBMARINE_DOCK_POS,
  SUBMARINE_MAX_DEPTH,
  createInitialSnowmanRescueState,
  createInitialSubmarineState,
  isInsideOceanHeroTowerLand,
  isInsideSnowmanIsland,
  stepOceanSnowmanRescue,
  stepSubmarineState,
} from './oceanWorldSystems';
import {
  createInitialBatmobileState,
  stepBatmobileState,
  getBatmobileExitPosition,
  repairBatmobile,
  BATMOBILE_MAX_SPEED,
  type BatmobileState,
} from './batmobile';
import {
  METRO_CITY_CENTER,
  METRO_CITY_SPAWN,
  createInitialMetroDestructionState,
  applyDestructionImpact,
  stepMetroDestruction,
  getMetroBuildingColliders,
  getMetroRooftopHeightAt,
  findBestWebOrGrappleAnchor,
  startWebSwing,
  stepWebSwingPhysics,
  isInsideMetroCity,
} from './metroCity';
import { getAvatarMeta, isValidBoyOutfitId, PLAYABLE_AVATARS } from './avatars';
import {
  computePassengerActivityWeights,
  createInitialTrainPassengerStates,
  stepTrainPassengers,
  TRAIN_PASSENGER_SEEDS,
} from './trainPassengers';
import {
  computeEffectiveTemperatureC,
  computeTrainSteamProfile,
  createTrainSteamPool,
  stepTrainSteamPool,
} from './trainSteam';
import {
  computeStationCrowdProfile,
  generateStationAnnouncement,
  getStationRegionId,
} from './stationAnnouncements';
import {
  getActivePlantVariantForSeason,
  getActiveTreeVariantForSeason,
  getSeasonalFoliageProfile,
  SEASONAL_FOLIAGE_PROFILES,
} from './seasonalFoliage';
import {
  computeFlockSkyActivity,
  createInitialBirdFlockingState,
  FLOCK_MIN_BIRDS,
  getFlockingStats,
  MAX_ACTIVE_FLOCKS,
  MAX_BIRD_SPEED,
  MAX_FLOCK_BIRDS,
  MIN_BIRD_SPEED,
  refreshFlocksForFocus,
  SEPARATION_RADIUS,
  stepBirdFlockingSystem,
} from './birdFlocking';
import {
  DESERT_HELIPAD_POS,
  DESERT_OASIS_CENTER,
  DESERT_OASIS_JETTY_BOUNDS,
  DESERT_OASIS_SPAWN,
  DESERT_PYRAMID_BASE_Y,
  DESERT_PYRAMID_CENTER,
  DESERT_PYRAMID_CHAMBER_Y,
  DESERT_PYRAMID_SOUTH_PORTAL,
  DESERT_PYRAMID_SUMMIT_Y,
  isInsideDesertBiome,
  isInsidePyramidChamber,
} from './desertOasis';
import {
  computeCatalogueSpawnPoint,
  getCatalogueVehiclesByCategory,
  VEHICLE_CATALOGUE,
} from './vehicleCatalogue';
import {
  COAST_CENTER,
  groundHeightAt,
  distanceToRail,
  walkableHeightAt,
  walkableHeightWithFloor,
  isWaterAt,
  isSwimmableWaterAt,
  isOceanAt,
  getLocationAt,
  getRegionAt,
  resolvePlayerCollision,
  ENCHANTED_FOREST_CENTER,
  HILL_CENTER,
  HOME_CENTER,
  LAKE_CENTER,
  LOCATIONS,
  WATER_LEVEL,
  WILDLIFE_FOREST_SANCTUARY_CENTER,
  WORLD_PLAYABLE_RADIUS,
} from './terrain';
import {
  DINOSAUR_ARENA_CENTER,
  DINOSAUR_ISLAND_CENTER,
  DINOSAUR_ISLAND_LAND_RADIUS,
  DINOSAUR_ISLAND_RADIUS,
  DINOSAUR_MARINA_BOAT_BERTH,
  DINOSAUR_MARINA_PIER_BOUNDS,
  SSJ_DINOSAUR_SPECIES,
  SSJ_ISLAND_LANDMARKS,
  createInitialDinosaurIslandState,
  fireDinosaurIslandAk47,
  getActiveArenaWallColliders,
  isOnDinosaurIsland,
  isOnDinosaurMarinaPier,
  spawnNextDinoWave,
  stepDinosaurIslandState,
  stepSafariCarState,
  toggleJurassicGate,
} from './dinosaurIsland';
import {
  AIRPORT_AIRCRAFT_STANDS,
  ORANGE_HELI_HOME_POS,
  ORANGE_HELI_ISLAND_POS,
  VEHICLE_GARAGE_CENTER,
  VEHICLE_GARAGE_SPAWN_BAY,
  createInitialOrangeHeliState,
  getOrangeHeliExitPosition,
  stepOrangeHeliState,
} from './skyExplorer';
import {
  HOVER_GLIDER_SPAWN,
  computeLookToFlyVerticalRate,
  createInitialHoverGliderState,
  stepHoverGlider,
} from './hoverGlider';
import {
  BUS_STOPS,
  canBoardBus,
  createInitialBoats,
  createInitialBusState,
  isNavigableBoatWater,
  stepBoatState,
  stepBusManualDrive,
  stepBusState,
} from './vehicles';
import {
  createInitialCompanionMemory,
  createInitialCompanionState,
  pickContextualDialogue,
  recordRegionVisit,
  stepCompanionFollow,
  triggerFrostyEmote,
} from './companion';
import {
  sampleRailway,
  RAILWAY_TOTAL_LENGTH,
  STATIONS,
  createInitialTrainState,
  createTrainRoutePlan,
  applyTrainRoutePlan,
  stepTrainManualDrive,
  stepTrainState,
  canBoardTrain,
  getDisembarkPosition,
  getRailwayGradeProfile,
  TRAIN_DRIVER_NOTCH_MPS,
} from './railway';
import {
  generateDigitalTicket,
  buildTicketQrMatrix,
  buildTicketTimeline,
} from './tickets';
import {
  NORMAL_PLAYER_HEIGHT_M,
  GIANT_IGLOO_MAN_HEIGHT_M,
  GIANT_PLAYER_HEIGHT_M,
  ICELAND_GIANT_SCALE,
  ICELAND_ARRIVAL_POS,
  createIcelandState,
  stepIcelandState,
  getScaleGameplayMetrics,
  isInIceland,
} from './iceland';
import {
  computeNightBlackoutFactor,
  computeSkyPalette,
  getTimePeriod,
  formatClockTime,
  TIME_PRESET_HOURS,
} from './timeWeather';
import {
  TRANSPORT_SPECS,
  normalizeJoystickInput,
  combineMovementInput,
  toggleNightModeHours,
  createInitialJumpState,
  requestJump,
  stepJumpState,
  createInitialScreenTouchState,
  beginScreenPointer,
  moveScreenPointer,
  endScreenPointer,
} from './locomotion';
import {
  buildDreamlineAndroidProjectFiles,
  createDreamlineAndroidProjectZip,
  computeCrc32,
} from './androidApkPackage';
import {
  computeTrainStationTimetable,
  computeBusStopTimetable,
} from './transitSchedule';
import {
  createInitialCamperState,
  stepCamperState,
  getCamperExitPosition,
} from './camper';
import {
  createInitialExtremeWeatherState,
  FLOOD_TARGET_Y,
  getEffectiveWaterLevel,
  getWeatherProfile,
  primeExtremeWeatherOnSelect,
  stepExtremeWeatherState,
  TSUNAMI_FLOOD_TARGET_Y,
} from './extremeWeather';
import {
  computeFireflyTimeFactor,
  computeFireflyVisibility,
  FORESTED_ZONES,
  generateFireflySeeds,
  isClearWeatherForFireflies,
  isInForestedRegion,
} from './fireflies';
import { computeNavigationState, sampleNavigationPath } from './navigation';
import {
  MIDNIGHT_FRONTIER_ASSET_URL,
  MIDNIGHT_FRONTIER_DISCOVERIES,
  MIDNIGHT_FRONTIER_PORTAL_POS,
  computeMidnightFrontierVisibility,
  isMidnightFrontierOpen,
} from './midnightFrontier';
import {
  createInitialBusDispatchState,
  requestMobileBusRide,
  stepDispatchedBus,
} from './busHailing';
import {
  AVS_SNOW_HOUSE_BASE_Y,
  AVS_SNOW_HOUSE_CENTER,
  AVS_SNOW_HOUSE_ROT_Y,
  AVS_SNOW_HOUSE_SCALE,
  CAVE_CHAMBERS,
  CAVE_ENTRANCES,
  CAVE_FLOOR_Y,
  CAVE_PASSAGES,
  avsLocalToWorld,
  getAvsSnowHouseFloorHeight,
  getCaveChamberAt,
  getCaveFloorHeightAt,
  isInFrozenKingdom,
  isPointInsideCaveWorld,
} from './frozenKingdom';
import {
  AVS_HELIPAD_POS,
  HOME_HELIPAD_POS,
  SKY_EXPLORER_PAD_POS,
  createInitialSkyExplorerState,
  createSkyExplorerAtHelipad,
  getSkyExplorerExitPosition,
  stepSkyExplorerState,
} from './skyExplorer';
import {
  DEALERSHIP_1F_Y,
  DEALERSHIP_2F_Y,
  DEALERSHIP_GF_Y,
  EXHIBITION_DEALERSHIP_CENTER,
  EXHIBITION_HANGAR_CENTER,
  EXHIBITION_ISLAND_CENTER,
  EXHIBITION_VEHICLE_CATALOG,
  HANGAR_FLOOR_Y,
  HANGAR_MEZZ_1_Y,
  getExhibitionComplexFloorHeight,
  isInsideExhibitionIsland,
  isOnExhibitionMarinaPier,
  isOnOceanBusCauseway,
} from './exhibitionComplex';
import {
  SKY_TAXI_STOPS,
  boardSkyTaxi,
  cancelSkyTaxi,
  createInitialSkyTaxiState,
  requestMobileSkyTaxi,
  stepSkyTaxiState,
} from './skyTaxi';
import {
  computeBirdActivity,
  computeButterflyActivity,
  computeGrassAnimalActivity,
  createInitialGrassAnimalStates,
  generateBirdSeeds,
  generateButterflySeeds,
  generateGrassAnimalSeeds,
  sampleBirdPose,
  sampleButterflyPose,
  stepGrassAnimal,
} from './wildlife';

test('terrain grades railway flat, lake sunken below water, and hilltop elevated', () => {
  const stationY = groundHeightAt(0, 10);
  assert.ok(Math.abs(stationY) < 0.35, `Expected flat station ground, got ${stationY}`);

  const platformY = walkableHeightAt(0, 14.5);
  assert.ok(platformY >= 0.8, `Expected elevated Sakuragawa platform, got ${platformY}`);

  const lakeY = groundHeightAt(LAKE_CENTER.x, LAKE_CENTER.z);
  assert.ok(lakeY < WATER_LEVEL - 0.5, `Expected lake basin below water, got ${lakeY}`);
  assert.equal(isWaterAt(LAKE_CENTER.x, LAKE_CENTER.z), true);

  const hillY = groundHeightAt(HILL_CENTER.x, HILL_CENTER.z);
  assert.ok(hillY > 8.5, `Expected elevated hilltop viewpoint, got ${hillY}`);
  assert.equal(getLocationAt(HILL_CENTER.x, HILL_CENTER.z).id, 'hilltop_viewpoint');
  assert.equal(getLocationAt(0, 10).id, 'sakuragawa_station');
});

test('collision solver blocks solid boxes, deep water, and world boundary', () => {
  const colliders = [
    { id: 'wall', minX: 4, maxX: 8, minZ: 4, maxZ: 8 },
  ];
  const hitWall = resolvePlayerCollision(5.5, 5.5, 3.0, 5.5, 0.5, colliders);
  assert.equal(hitWall.collided, true);
  assert.ok(hitWall.x <= 3.51 || hitWall.z <= 3.51);

  const hitEdge = resolvePlayerCollision(WORLD_PLAYABLE_RADIUS + 20, 0, 120, 0, 0.5, []);
  assert.equal(hitEdge.collided, true);
  assert.ok(Math.hypot(hitEdge.x, hitEdge.z) <= WORLD_PLAYABLE_RADIUS + 0.01);

  const hitWater = resolvePlayerCollision(
    LAKE_CENTER.x,
    LAKE_CENTER.z,
    LAKE_CENTER.x - 45,
    LAKE_CENTER.z,
    0.5,
    []
  );
  assert.equal(hitWater.collided, true);
});

test('railway spline is closed, smooth, crosses the sea to Ocean Exhibition Complex & SSJ Dinosaur Island, and links all 9 stations including Snow Summit & Thar Desert Oasis', () => {
  assert.equal(STATIONS.length, 9);
  assert.ok(STATIONS.some((s) => s.id === 'iceland_gateway' && s.connectsToIceland));
  assert.ok(STATIONS.some((s) => s.id === 'panimalai_snow_station' && s.connectsToIceland));
  assert.ok(STATIONS.some((s) => s.id === 'thar_desert_station'));
  assert.ok(STATIONS.some((s) => s.id === 'exhibition_complex_station'));
  assert.ok(STATIONS.some((s) => s.id === 'dinosaur_island_station' && s.isDinosaurIsland));
  assert.ok(RAILWAY_TOTAL_LENGTH > 1200, `Expected extended snow + desert + sea loop > 1200m, got ${RAILWAY_TOTAL_LENGTH}`);

  let seaBridgeSamples = 0;
  for (let i = 0; i < 200; i++) {
    const s = sampleRailway(i / 200);
    if (isOceanAt(s.x, s.z)) seaBridgeSamples++;
  }
  assert.ok(seaBridgeSamples >= 20, `Expected railway track to cross open sea on bridge, got ${seaBridgeSamples} sea samples`);

  const p0 = sampleRailway(0);
  const p1 = sampleRailway(0.9999);
  const gap = Math.hypot(p0.x - p1.x, p0.z - p1.z);
  assert.ok(gap < 1.0, `Expected closed railway loop, seam gap=${gap}`);
});

test('train approaches Sakuragawa, stops, opens doors for boarding, then departs cleanly', () => {
  let train = createInitialTrainState();
  assert.equal(train.phase, 'approaching');

  // Step forward up to 20s until train arrives and stops
  let reachedStop = false;
  let doorsOpened = false;
  for (let i = 0; i < 400; i++) {
    train = stepTrainState(train, 0.05);
    if (train.phase === 'stopped') {
      reachedStop = true;
      if (train.doorOpen >= 0.5) {
        doorsOpened = true;
        break;
      }
    }
  }
  assert.equal(reachedStop, true, 'Train should stop at Sakuragawa Station');
  assert.equal(doorsOpened, true, 'Train doors should open while stopped');

  // Player standing near platform can board
  const disembark = getDisembarkPosition(train);
  assert.equal(canBoardTrain(train, disembark.x, disembark.z), true);
  assert.equal(canBoardTrain(train, disembark.x + 40, disembark.z), false);

  // Step forward until train departs
  let departed = false;
  for (let i = 0; i < 400; i++) {
    train = stepTrainState(train, 0.05);
    if (train.phase === 'departing' || train.phase === 'cruising') {
      departed = true;
      break;
    }
  }
  assert.equal(departed, true, 'Train should depart after dwell period');
  assert.equal(train.doorOpen, 0, 'Doors should be closed upon departure');
});

test('time-of-day periods, formatting, and weather lighting modifiers work smoothly', () => {
  assert.equal(getTimePeriod(TIME_PRESET_HOURS.morning), 'morning');
  assert.equal(getTimePeriod(TIME_PRESET_HOURS.afternoon), 'afternoon');
  assert.equal(getTimePeriod(TIME_PRESET_HOURS.golden), 'golden');
  assert.equal(getTimePeriod(TIME_PRESET_HOURS.sunset), 'sunset');
  assert.equal(getTimePeriod(TIME_PRESET_HOURS.evening), 'evening');
  assert.equal(getTimePeriod(TIME_PRESET_HOURS.night), 'night');

  assert.equal(formatClockTime(17.75), '17:45');
  assert.equal(formatClockTime(6.5), '06:30');

  const sunsetClear = computeSkyPalette(17.8, 'clear');
  const sunsetRain = computeSkyPalette(17.8, 'rain');
  const afternoonClear = computeSkyPalette(13.0, 'clear');
  const nightClear = computeSkyPalette(22.5, 'clear');

  assert.ok(sunsetClear.lanternStrength > 0.7, 'Station lamps should glow at sunset');
  assert.equal(afternoonClear.lanternStrength, 0, 'Station lamps off at midday');
  assert.ok(nightClear.starOpacity > 0.9, 'Stars should be visible at night');
  assert.ok(sunsetRain.fogDensity > sunsetClear.fogDensity, 'Rain should thicken atmospheric fog');
});

test('mobile joystick clamps magnitude, applies deadzone, and combines cleanly with keyboard', () => {
  const dead = normalizeJoystickInput(2, -2, 38, 0.12);
  assert.equal(dead.magnitude, 0);
  assert.equal(dead.forward, 0);

  const up = normalizeJoystickInput(0, -80, 38, 0.12);
  assert.ok(Math.abs(up.forward - 1) < 0.001, `Expected full forward=1, got ${up.forward}`);
  assert.ok(Math.abs(up.knobY + 38) < 0.001, `Expected clamped knobY=-38, got ${up.knobY}`);

  const merged = combineMovementInput(1, 0, 0, 1);
  assert.ok(Math.abs(merged.magnitude - 1) < 0.001);
  assert.ok(merged.forward > 0.7 && merged.right > 0.7);
});

test('bicycle and skateboard specs exceed walking speed and night mode toggles cleanly', () => {
  assert.ok(TRANSPORT_SPECS.bicycle.cruiseSpeed > TRANSPORT_SPECS.walk.cruiseSpeed);
  assert.ok(TRANSPORT_SPECS.skateboard.cruiseSpeed > TRANSPORT_SPECS.walk.cruiseSpeed);

  const toNight = toggleNightModeHours(17.72);
  assert.equal(toNight.isNight, true);
  assert.equal(getTimePeriod(toNight.hours), 'night');

  const toSunset = toggleNightModeHours(toNight.hours);
  assert.equal(toSunset.isNight, false);
  assert.equal(getTimePeriod(toSunset.hours), 'sunset');
});

test('all 5 regions classify cleanly and En Illam two-storey house supports stairs and balcony', () => {
  assert.equal(getRegionAt(0, 10), 'sakura');
  assert.equal(getRegionAt(100, 62), 'coastal');
  assert.equal(getRegionAt(-92, -80), 'snow');
  assert.equal(getRegionAt(-24, 98), 'countryside');
  assert.equal(getRegionAt(34, -10), 'lake_camp');

  // Ground floor inside En Illam
  const gfY = walkableHeightWithFloor(HOME_CENTER.x, HOME_CENTER.z, 0.45);
  assert.ok(Math.abs(gfY - 0.45) < 0.05, `Expected En Illam ground floor y=0.45, got ${gfY}`);

  // Staircase midpoint climbs between floor 1 and floor 2
  const midStairY = walkableHeightWithFloor(HOME_CENTER.x + 4.5, HOME_CENTER.z - 0.5, 1.5);
  assert.ok(midStairY > 1.5 && midStairY < 3.0, `Expected mid-stair elevation, got ${midStairY}`);

  // Second-floor walk-out scenic balcony above the front porch
  const balconyY = walkableHeightWithFloor(HOME_CENTER.x, HOME_CENTER.z + 6.4, 3.65);
  assert.ok(Math.abs(balconyY - 3.65) < 0.05, `Expected 2nd-floor balcony y=3.65, got ${balconyY}`);

  // High-elevation Panimalai Snow Peaks (y ~ 3.2m) must NEVER clamp back to En Illam balcony
  const snowMove = resolvePlayerCollision(-83.5, -73.5, -84.0, -74.0, 0.42, [], 3.2);
  assert.equal(snowMove.collided, false);
  assert.ok(Math.abs(snowMove.x - -83.5) < 0.01 && Math.abs(snowMove.z - -73.5) < 0.01);
});

test('countryside bus loops smoothly, stops with doors open, and allows boarding nearby', () => {
  assert.equal(BUS_STOPS.length, 5);
  assert.ok(BUS_STOPS.some((s) => s.id === 'bus_exhibition'));
  let bus = createInitialBusState();
  let stoppedWithDoor = false;
  for (let i = 0; i < 320; i++) {
    bus = stepBusState(bus, 0.05);
    if (bus.phase === 'stopped' && bus.doorOpen >= 0.4) {
      stoppedWithDoor = true;
      break;
    }
  }
  assert.equal(stoppedWithDoor, true, 'Bus should arrive at stop and open doors');
  assert.equal(canBoardBus(bus, bus.worldX + 2.5, bus.worldZ), true);
  assert.equal(canBoardBus(bus, bus.worldX + 30, bus.worldZ), false);
});

test('drivable boats steer smoothly and stay safely inside navigable lake and ocean waters', () => {
  const [lakeBoat, coastalBoat] = createInitialBoats();
  assert.equal(isNavigableBoatWater('lake', lakeBoat.x, lakeBoat.z), true);
  assert.equal(isNavigableBoatWater('ocean', coastalBoat.x, coastalBoat.z), true);

  let driven = lakeBoat;
  let peakSpeed = 0;
  for (let i = 0; i < 60; i++) {
    driven = stepBoatState(driven, 1.0, 0.35, true, 0.05);
    if (driven.speed > peakSpeed) peakSpeed = driven.speed;
  }
  assert.ok(peakSpeed > 6.0, `Expected boosted boat to accelerate cleanly, peak=${peakSpeed}`);
  assert.equal(isNavigableBoatWater('lake', driven.x, driven.z), true);
});

test('main railway station is named ஷவீஷ் ஜெஷுருன் சா and Frosty companion follows, emotes, avoids obstacles, and sleeps in igloo', () => {
  const mainStop = STATIONS.find((s) => s.id === 'sakuragawa_station');
  assert.ok(mainStop, 'Main station should exist');
  assert.equal(mainStop.name, 'ஷவீஷ் ஜெஷுருன் சா');
  assert.equal(LOCATIONS[0].name, 'ஷவீஷ் ஜெஷுருன் சா');

  let comp = createInitialCompanionState(0, 0, 0);
  assert.equal(comp.name, 'Frosty');
  assert.equal(comp.tamilName, 'ஃபிராஸ்டி');

  for (let i = 0; i < 80; i++) {
    comp = stepCompanionFollow(comp, 8, 0, 4, 0.4, 4.0, 0.05, () => 0, () => false, 'snow');
  }
  const distToPlayer = Math.hypot(comp.x - 8, comp.z - 4);
  assert.ok(distToPlayer >= 0.9 && distToPlayer <= 3.5, `Expected polite follow spacing, got ${distToPlayer}`);

  // Emotes work cleanly
  comp = triggerFrostyEmote(comp, 'dance', 3.5);
  assert.equal(comp.emote, 'dance');
  assert.equal(comp.restingInIgloo, false);

  // Igloo resting keeps Frosty curled up sleeping while player is nearby inside En Illam
  comp = { ...comp, restingInIgloo: true, activity: 'sleeping', emote: 'sleeping' };
  const sleepingStep = stepCompanionFollow(comp, comp.x + 2, comp.y, comp.z + 1, 0, 0, 0.05, () => 0.45, () => false, 'sakura');
  assert.equal(sleepingStep.activity, 'sleeping');
  assert.equal(sleepingStep.restingInIgloo, true);

  const mem = createInitialCompanionMemory();
  assert.equal(recordRegionVisit(mem, 'coastal', 'Kadalkarai Coast'), true);
  assert.equal(recordRegionVisit(mem, 'coastal', 'Kadalkarai Coast'), false);

  const line1 = pickContextualDialogue('coastal', mem, false);
  const line2 = pickContextualDialogue('coastal', mem, false);
  assert.ok(line1 && line2 && line1 !== line2, 'Contextual dialogue should not repeat back-to-back');
});

test('selective-stop railway routing skips unselected stations smoothly and stops only at chosen stops and destination', () => {
  const originIdx = STATIONS.findIndex((s) => s.id === 'sakuragawa_station');
  const skipIdx1 = STATIONS.findIndex((s) => s.id === 'pachai_meadow_halt');
  const selectedMidIdx = STATIONS.findIndex((s) => s.id === 'aomizu_lakeside');
  const skipIdx2 = STATIONS.findIndex((s) => s.id === 'kaze_no_oka');
  const destIdx = STATIONS.findIndex((s) => s.id === 'iceland_gateway');

  assert.ok(originIdx >= 0 && skipIdx1 >= 0 && selectedMidIdx >= 0 && skipIdx2 >= 0 && destIdx >= 0);

  // Start train stopped cleanly at origin station
  let train = createInitialTrainState();
  for (let i = 0; i < 400 && train.phase !== 'stopped'; i++) {
    train = stepTrainState(train, 0.05);
  }
  assert.equal(train.phase, 'stopped');
  assert.equal(train.currentStationIndex, originIdx);

  const plan = createTrainRoutePlan(originIdx, [selectedMidIdx], destIdx, 17.72);
  assert.deepEqual(plan.selectedStopIndices, [selectedMidIdx, destIdx]);
  assert.equal(plan.includesIcelandTransfer, true);

  train = applyTrainRoutePlan(train, plan);
  const stoppedAtStations = new Set<number>();

  // Simulate full scenic journey around the loop up to 240s
  for (let i = 0; i < 4800; i++) {
    train = stepTrainState(train, 0.05);
    if (train.phase === 'stopped') {
      stoppedAtStations.add(train.currentStationIndex);
    }
    if (train.routePlan?.status === 'completed' && train.doorOpen >= 0.5) {
      break;
    }
  }

  assert.equal(train.routePlan?.status, 'completed', 'Train should complete route at final destination');
  assert.equal(train.currentStationIndex, destIdx, 'Train should stop at Iceland Express Halt');
  assert.equal(train.journeyProgress, 1, 'Journey progress should reach 100%');
  assert.ok(stoppedAtStations.has(selectedMidIdx), 'Train MUST stop at selected intermediate station Neelam Lakeside');
  assert.ok(stoppedAtStations.has(destIdx), 'Train MUST stop at final destination Iceland Express Halt');
  assert.equal(stoppedAtStations.has(skipIdx1), false, 'Train MUST NOT stop at skipped station Pachai Meadow Halt');
  assert.equal(stoppedAtStations.has(skipIdx2), false, 'Train MUST NOT stop at skipped station Thendral Malai Halt');
  assert.ok(train.routePlan?.skippedStopIndices.includes(skipIdx1), 'Skipped station 1 should be recorded');
  assert.ok(train.routePlan?.skippedStopIndices.includes(skipIdx2), 'Skipped station 2 should be recorded');
});

test('digital train ticket synchronizes 100% with route plan, generates valid 21x21 QR matrix, and tracks live timeline', () => {
  const originIdx = STATIONS.findIndex((s) => s.id === 'sakuragawa_station');
  const midIdx = STATIONS.findIndex((s) => s.id === 'aomizu_lakeside');
  const destIdx = STATIONS.findIndex((s) => s.id === 'iceland_gateway');
  const plan = createTrainRoutePlan(originIdx, [midIdx], destIdx, 17.72);
  const ticket = generateDigitalTicket(plan, undefined, undefined, Date.UTC(2026, 10, 20, 12, 0, 0));

  assert.equal(ticket.routePlanId, plan.id);
  assert.equal(ticket.originStationIndex, originIdx);
  assert.equal(ticket.destinationStationIndex, destIdx);
  assert.deepEqual(ticket.selectedStopIndices, plan.selectedStopIndices);
  assert.equal(ticket.intermediateStopIndices.length, 1);
  assert.equal(ticket.intermediateStopIndices[0], midIdx);
  assert.equal(ticket.includesIcelandTransfer, true);
  assert.match(ticket.ticketId, /^DL-20261120-\d{4}$/);
  assert.match(ticket.seatNumber, /^[1-8][ABCD]$/);
  assert.match(ticket.carriageNumber, /^CAR 0[12]$/);

  const qr = buildTicketQrMatrix(ticket.qrSeed);
  assert.equal(qr.length, 21);
  assert.equal(qr[0].length, 21);
  assert.equal(qr[0][0], true, 'Top-left QR finder corner must be filled');
  assert.equal(qr[0][20], true, 'Top-right QR finder corner must be filled');
  assert.equal(qr[20][0], true, 'Bottom-left QR finder corner must be filled');

  // Verify live timeline updates cleanly as train starts active route
  let train = createInitialTrainState();
  train = applyTrainRoutePlan(train, plan);
  const timeline = buildTicketTimeline(ticket, train);
  assert.equal(timeline[0].status, 'origin');
  assert.equal(timeline[timeline.length - 1].isDestination, true);
  assert.ok(timeline.some((t) => t.status === 'skipped_planned'));
  assert.ok(timeline.some((t) => t.status === 'next_selected'));
});

test('Iceland enforces colossal scale hierarchy (1.68m < 18.0m Giant Igloo Man < 23.5m Giant Player) and supports Stay Giant Throughout', () => {
  assert.equal(GIANT_IGLOO_MAN_HEIGHT_M, 18.0);
  assert.equal(GIANT_PLAYER_HEIGHT_M, 23.5);
  assert.ok(
    NORMAL_PLAYER_HEIGHT_M < GIANT_IGLOO_MAN_HEIGHT_M &&
      GIANT_IGLOO_MAN_HEIGHT_M < GIANT_PLAYER_HEIGHT_M,
    `Scale hierarchy must satisfy ${NORMAL_PLAYER_HEIGHT_M} < ${GIANT_IGLOO_MAN_HEIGHT_M} < ${GIANT_PLAYER_HEIGHT_M}`
  );

  // Outside Iceland with Stay Giant OFF, player remains exact 1.0 normal scale
  assert.equal(isInIceland(0.6, 13.3), false);
  let iceland = createIcelandState(0.6, 13.3, false, false);
  assert.equal(iceland.playerScale, 1.0);
  assert.equal(iceland.isGiant, false);
  assert.equal(iceland.stayGiantThroughout, false);

  // Entering Panimalai Iceland smoothly grows the player to full 14.0x Giant Form (23.5m)
  assert.equal(isInIceland(ICELAND_ARRIVAL_POS.x, ICELAND_ARRIVAL_POS.z), true);
  for (let i = 0; i < 80; i++) {
    iceland = stepIcelandState(iceland, ICELAND_ARRIVAL_POS.x, ICELAND_ARRIVAL_POS.z, 0.05);
  }
  assert.equal(iceland.inIceland, true);
  assert.equal(iceland.isGiant, true);
  assert.ok(Math.abs(iceland.playerScale - ICELAND_GIANT_SCALE) < 0.05, `Expected scale ~${ICELAND_GIANT_SCALE}, got ${iceland.playerScale}`);
  assert.ok(iceland.playerHeightMeters > GIANT_IGLOO_MAN_HEIGHT_M);

  const normalMetrics = getScaleGameplayMetrics(1.0, false, false);
  const giantMetrics = getScaleGameplayMetrics(iceland.playerScale, false, false);
  assert.ok(giantMetrics.cameraDistanceMultiplier > normalMetrics.cameraDistanceMultiplier * 5.0);
  assert.ok(giantMetrics.moveSpeedMultiplier > normalMetrics.moveSpeedMultiplier * 2.5);
  assert.ok(giantMetrics.collisionRadius > normalMetrics.collisionRadius * 3.0);
  assert.ok(giantMetrics.footstepPitchMultiplier < normalMetrics.footstepPitchMultiplier);

  // Turning ON Stay Giant Throughout locks Giant Form (23.5m) even when travelling outside Iceland (zero shrinking!)
  iceland = { ...iceland, stayGiantThroughout: true };
  for (let i = 0; i < 80; i++) {
    iceland = stepIcelandState(iceland, 0.6, 13.3, 0.05);
  }
  assert.equal(iceland.inIceland, false);
  assert.equal(iceland.stayGiantThroughout, true);
  assert.equal(iceland.isGiant, true);
  assert.ok(
    Math.abs(iceland.playerScale - ICELAND_GIANT_SCALE) < 0.01,
    `Expected locked giant scale ${ICELAND_GIANT_SCALE} outside Iceland, got ${iceland.playerScale}`
  );
  assert.equal(iceland.playerHeightMeters, GIANT_PLAYER_HEIGHT_M);

  // Turning OFF Stay Giant Throughout outside Iceland smoothly restores normal human scale (1.68m)
  iceland = { ...iceland, stayGiantThroughout: false };
  for (let i = 0; i < 100; i++) {
    iceland = stepIcelandState(iceland, 0.6, 13.3, 0.05);
  }
  assert.equal(iceland.inIceland, false);
  assert.equal(iceland.isGiant, false);
  assert.equal(iceland.playerScale, 1.0);
  assert.equal(iceland.playerHeightMeters, NORMAL_PLAYER_HEIGHT_M);
});

test('Android APK project packager produces a valid PK ZIP archive with Kotlin WebView, Gradle, and TWA manifest', () => {
  const sampleUrl = 'https://dreamline.example.app/';
  const files = buildDreamlineAndroidProjectFiles(sampleUrl);
  assert.ok(files.length >= 10, `Expected full Android Gradle project files, got ${files.length}`);
  assert.ok(files.some((f) => f.path.endsWith('AndroidManifest.xml')));
  assert.ok(files.some((f) => f.path.endsWith('MainActivity.kt')));
  assert.ok(files.some((f) => f.path.endsWith('app/build.gradle')));
  assert.ok(files.some((f) => f.path.endsWith('twa-manifest.json')));

  const mainKt = files.find((f) => f.path.endsWith('MainActivity.kt'));
  assert.ok(typeof mainKt?.content === 'string' && mainKt.content.includes(sampleUrl));
  assert.ok(typeof mainKt?.content === 'string' && mainKt.content.includes('com.dreamline.railway'));

  // Standard IEEE CRC-32 check on "123456789" === 0xCBF43926
  const checkBytes = new TextEncoder().encode('123456789');
  assert.equal(computeCrc32(checkBytes), 0xcbf43926);

  const zip = createDreamlineAndroidProjectZip(sampleUrl);
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  // Local file header signature PK\x03\x04
  assert.equal(view.getUint32(0, true), 0x04034b50);
  // End of Central Directory signature PK\x05\x06 at last 22 bytes
  assert.equal(view.getUint32(zip.byteLength - 22, true), 0x06054b50);
  // Central directory entry count matches generated files
  assert.equal(view.getUint16(zip.byteLength - 12, true), files.length);
});

test('Snow Place supports being both Giant (23.5m) AND Small (1.68m) via sizeMode', () => {
  // Start inside Panimalai Snow Place in auto mode -> Giant (23.5m)
  let iceland = createIcelandState(ICELAND_ARRIVAL_POS.x, ICELAND_ARRIVAL_POS.z, false, 'auto');
  assert.equal(iceland.inIceland, true);
  assert.equal(iceland.isGiant, true);
  assert.equal(iceland.playerHeightMeters, GIANT_PLAYER_HEIGHT_M);

  // Switch to 'small' WHILE STILL INSIDE Panimalai Snow Place -> shrinks cleanly to 1.68m!
  iceland = { ...iceland, sizeMode: 'small', stayGiantThroughout: false };
  for (let i = 0; i < 120; i++) {
    iceland = stepIcelandState(iceland, ICELAND_ARRIVAL_POS.x, ICELAND_ARRIVAL_POS.z, 0.05);
  }
  assert.equal(iceland.inIceland, true);
  assert.equal(iceland.isGiant, false);
  assert.equal(iceland.playerScale, 1.0);
  assert.equal(iceland.playerHeightMeters, NORMAL_PLAYER_HEIGHT_M);

  // Switch back to 'giant' -> grows back to 23.5m!
  iceland = { ...iceland, sizeMode: 'giant', stayGiantThroughout: true };
  for (let i = 0; i < 120; i++) {
    iceland = stepIcelandState(iceland, ICELAND_ARRIVAL_POS.x, ICELAND_ARRIVAL_POS.z, 0.05);
  }
  assert.equal(iceland.isGiant, true);
  assert.equal(iceland.playerHeightMeters, GIANT_PLAYER_HEIGHT_M);
});

test('live Bus & Train departure timetable computes destinations and timings for every station', () => {
  const train = createInitialTrainState();
  const bus = createInitialBusState();

  const trainRows = computeTrainStationTimetable(train, 17.72);
  assert.equal(trainRows.length, STATIONS.length);
  assert.equal(trainRows[0].stationName, 'ஷவீஷ் ஜெஷுருன் சா');
  assert.ok(trainRows.every((r) => /^\d{2}:\d{2}$/.test(r.departureTime)));
  assert.ok(trainRows.every((r) => r.destinationName.startsWith('To ')));

  const busRows = computeBusStopTimetable(bus, 17.72);
  assert.equal(busRows.length, BUS_STOPS.length);
  assert.ok(busRows.every((r) => /^\d{2}:\d{2}$/.test(r.departureTime)));
  assert.ok(busRows.every((r) => r.destinationName.startsWith('To ')));
});

test('swimming water allows wading into Neelam Lake & Ocean while seasons shift sky palette', () => {
  assert.equal(isSwimmableWaterAt(LAKE_CENTER.x, LAKE_CENTER.z), true);
  assert.equal(isSwimmableWaterAt(0, 10), false);

  // With allowWater = true, player can wade smoothly into lake water to swim
  const swimMove = resolvePlayerCollision(
    LAKE_CENTER.x,
    LAKE_CENTER.z,
    LAKE_CENTER.x - 1,
    LAKE_CENTER.z,
    0.42,
    [],
    0,
    true
  );
  assert.equal(swimMove.collided, false);
  assert.equal(swimMove.x, LAKE_CENTER.x);

  const spring = computeSkyPalette(13.0, 'clear', 'spring');
  const autumn = computeSkyPalette(13.0, 'clear', 'autumn');
  const winter = computeSkyPalette(13.0, 'clear', 'winter');
  assert.notEqual(spring.horizon.r, autumn.horizon.r);
  assert.ok(winter.fogDensity > spring.fogDensity);
});

test('Olga Pastel Pink Camper Van spawns in Mayavanam Enchanted Forest and drives smoothly', () => {
  let camper = createInitialCamperState();
  const distToForest = Math.hypot(
    camper.x - ENCHANTED_FOREST_CENTER.x,
    camper.z - ENCHANTED_FOREST_CENTER.z
  );
  assert.ok(distToForest < 12, `Olga should wait inside Mayavanam clearing, dist=${distToForest}`);
  assert.equal(getLocationAt(camper.x, camper.z).id, 'enchanted_forest');

  const startX = camper.x;
  const startZ = camper.z;
  for (let i = 0; i < 40; i++) {
    camper = stepCamperState(camper, 1.0, 0.3, false, [], 0.05);
  }
  const moved = Math.hypot(camper.x - startX, camper.z - startZ);
  assert.ok(moved > 5.0, `Expected Olga to drive forward smoothly, moved=${moved}`);
  assert.ok(camper.speedKmh > 10, `Expected speedometer > 10 km/h, got ${camper.speedKmh}`);
  assert.ok(Math.abs(camper.steerAngle) > 0.05, 'Front wheels should steer');

  const exit = getCamperExitPosition(camper);
  assert.ok(Math.hypot(exit.x - camper.x, exit.z - camper.z) >= 2.0);
});

test('extreme weather profiles scale rain, wind, lightning, floodwater, and tsunami wave wall cleanly', () => {
  const light = getWeatherProfile('rain');
  const heavy = getWeatherProfile('heavy_rain');
  const thunder = getWeatherProfile('thunderstorm');
  const ferocious = getWeatherProfile('ferocious_rain');
  const flood = getWeatherProfile('flood');
  const tsunami = getWeatherProfile('tsunami');

  assert.ok(heavy.rainIntensity > light.rainIntensity, 'Heavy rain must be denser than light rain');
  assert.ok(ferocious.rainIntensity > heavy.rainIntensity, 'Ferocious rain must hit maximum density');
  assert.ok(ferocious.windStrength > thunder.windStrength && thunder.windStrength > heavy.windStrength);
  assert.ok(thunder.lightningRate > 0 && ferocious.lightningRate > thunder.lightningRate);
  assert.equal(flood.targetFloodLevel, FLOOD_TARGET_Y);
  assert.equal(tsunami.targetFloodLevel, TSUNAMI_FLOOD_TARGET_Y);
  assert.equal(tsunami.hasTsunamiWave, true);
  assert.equal(flood.hasTsunamiWave, false);

  // Thunder Rain & Ferocious Rain trigger immediate lightning flash & periodic thunder strikes
  let state = createInitialExtremeWeatherState();
  state = primeExtremeWeatherOnSelect(state, 'ferocious_rain', 0);
  assert.equal(state.thunderTriggered, true);
  assert.ok(state.lightningFlash >= 0.9);

  let thunderCount = 0;
  for (let i = 0; i < 160; i++) {
    state = stepExtremeWeatherState(state, 'ferocious_rain', 0.05);
    if (state.thunderTriggered) thunderCount++;
  }
  assert.ok(thunderCount >= 2, `Expected repeated lightning/thunder strikes in ferocious rain, got ${thunderCount}`);

  // Flood raises valley floodwater level above y=0 (swimmable roads) and recedes cleanly when Clear Sky selected
  state = primeExtremeWeatherOnSelect(state, 'flood', 0);
  for (let i = 0; i < 140; i++) {
    state = stepExtremeWeatherState(state, 'flood', 0.05);
  }
  assert.ok(state.floodLevel > 1.2, `Expected floodwater to rise above 1.2m, got ${state.floodLevel}`);
  assert.equal(getEffectiveWaterLevel(state.floodLevel), state.floodLevel);

  for (let i = 0; i < 220; i++) {
    state = stepExtremeWeatherState(state, 'clear', 0.05);
  }
  assert.ok(state.floodLevel < WATER_LEVEL + 0.1, `Expected floodwater to recede to dry level, got ${state.floodLevel}`);

  // Tsunami spawns towering wave wall sweeping westward across coast & valley
  state = primeExtremeWeatherOnSelect(state, 'tsunami', 10);
  assert.equal(state.tsunamiRoarTriggered, true);
  const startWaveX = state.tsunamiWaveX;
  for (let i = 0; i < 60; i++) {
    state = stepExtremeWeatherState(state, 'tsunami', 0.05);
  }
  assert.ok(state.tsunamiWaveX < startWaveX - 20, 'Tsunami wave wall should surge westward across the world');
  assert.ok(state.tsunamiWaveHeight >= 8.0, `Expected towering tsunami wave >= 8m, got ${state.tsunamiWaveHeight}`);

  // Storm palettes darken sunlight and thicken mist vs clear sky
  const clearSky = computeSkyPalette(13.0, 'clear', 'spring');
  const ferociousSky = computeSkyPalette(13.0, 'ferocious_rain', 'spring');
  const tsunamiSky = computeSkyPalette(13.0, 'tsunami', 'spring');
  assert.ok(ferociousSky.sunIntensity < clearSky.sunIntensity * 0.4);
  assert.ok(ferociousSky.fogDensity > clearSky.fogDensity * 2.0);
  assert.equal(tsunamiSky.lanternStrength, 1.0);
});

test('jump physics launches cleanly, reaches apex, prevents double-jump mid-air, lands safely, and scales for Giant Form', () => {
  let jump = createInitialJumpState();
  jump = requestJump(jump);

  let takeoff = false;
  let maxHeight = 0;
  let landed = false;
  let midAirDoubleJumped = false;

  for (let i = 0; i < 60; i++) {
    // Attempt a double-jump mid-air — must NOT launch a second time while airborne!
    if (i === 5) {
      jump = requestJump(jump);
    }
    const res = stepJumpState(jump, 0.025, {
      scale: 1.0,
      transportMode: 'walk',
      canJump: true,
    });
    jump = res.state;
    if (i === 0 && res.jumped) takeoff = true;
    if (i >= 5 && res.jumped && !landed) midAirDoubleJumped = true;
    if (jump.offsetY > maxHeight) maxHeight = jump.offsetY;
    if (res.landed) {
      landed = true;
      break;
    }
  }

  assert.equal(takeoff, true, 'Jump should take off immediately when requested on ground');
  assert.ok(maxHeight > 1.0 && maxHeight < 2.2, `Expected crisp ~1.3m jump apex, got ${maxHeight}`);
  assert.equal(midAirDoubleJumped, false, 'Must not double-jump while already airborne');
  assert.equal(landed, true, 'Player should land smoothly back on the ground');
  assert.equal(jump.offsetY, 0);
  assert.equal(jump.isAirborne, false);

  // Giant Form (14x scale) leaps proportionally higher!
  let giantJump = requestJump(createInitialJumpState());
  let giantMax = 0;
  for (let i = 0; i < 120; i++) {
    const res = stepJumpState(giantJump, 0.025, {
      scale: ICELAND_GIANT_SCALE,
      transportMode: 'walk',
      canJump: true,
    });
    giantJump = res.state;
    if (giantJump.offsetY > giantMax) giantMax = giantJump.offsetY;
    if (res.landed) break;
  }
  assert.ok(giantMax > maxHeight * 4.0, `Expected colossal Giant Form jump apex > 4x normal, got ${giantMax}`);
});

test('SSJ Dinosaur Island sits far offshore in the sea, linked by extended railway bridge and ocean boat access', () => {
  // Island must be genuinely far offshore from Kadalkarai Coast (x=110)
  const offshoreDist = Math.hypot(DINOSAUR_ISLAND_CENTER.x - 110, DINOSAUR_ISLAND_CENTER.z - 62);
  assert.ok(offshoreDist > 170, `Expected far offshore Dinosaur Island (>170m), got ${offshoreDist}m`);

  // Island center & arena are dry land cleanly above ocean WATER_LEVEL
  const centerY = groundHeightAt(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z);
  assert.ok(centerY > WATER_LEVEL + 0.5, `Expected dry Dinosaur Island plateau, got y=${centerY}`);
  assert.equal(isOnDinosaurIsland(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z), true);
  assert.equal(isOceanAt(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z), false);
  assert.equal(getLocationAt(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z).id, 'dinosaur_island');

  // Surrounded by wide open ocean water on West (between coast & island), East, and South!
  assert.equal(isOceanAt(190, 96), true, 'Wide open sea should separate Kadalkarai Coast and Dinosaur Island');
  assert.equal(
    isOceanAt(DINOSAUR_ISLAND_CENTER.x + DINOSAUR_ISLAND_RADIUS + 18, DINOSAUR_ISLAND_CENTER.z),
    true,
    'Open sea should lie east of Dinosaur Island'
  );
  assert.equal(
    isOceanAt(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z + DINOSAUR_ISLAND_RADIUS + 18),
    true,
    'Open sea should lie south of Dinosaur Island'
  );

  // Ocean boat can sail across the sea toward Dinosaur Island without clipping into the island landmass
  assert.equal(isNavigableBoatWater('ocean', 200, 96), true);
  assert.equal(isNavigableBoatWater('ocean', DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z), false);

  // Train station on Dinosaur Island sits on dry platform terrain
  const dinoStation = STATIONS.find((s) => s.id === 'dinosaur_island_station');
  assert.ok(dinoStation, 'Expected dinosaur_island_station on railway loop');
  const platY = walkableHeightAt(dinoStation.platformX, dinoStation.platformZ);
  assert.ok(platY >= 0.7, `Expected elevated Dinosaur Island station platform, got ${platY}`);
});

test('Exact SSJ Dinosaur Island starts completely open (zero wall-breaking sequence), has 18 species, AK-47 endless waves, and drivable Safari Tour Cruiser', () => {
  let state = createInitialDinosaurIslandState();
  assert.equal(state.dinoHp, 350);
  assert.equal(state.brokenWalls, 4, 'Island must start completely open with zero wall-breaking sequence');
  assert.deepEqual(state.wallsIntact, [false, false, false, false]);
  assert.equal(getActiveArenaWallColliders(state).length, 0, 'Must have zero containment wall colliders');
  assert.equal(SSJ_DINOSAUR_SPECIES.length, 18, 'Exact SSJ Dinosaur Island must include all 18 dinosaur species');

  // Burst 1 deals 175 damage
  const shot1 = fireDinosaurIslandAk47(state, DINOSAUR_ARENA_CENTER.x - 4, 1.5, DINOSAUR_ARENA_CENTER.z - 4);
  assert.equal(shot1.fired, true);
  assert.equal(shot1.killedDino, false);
  assert.equal(shot1.state.dinoHp, 175);
  state = shot1.state;

  // Cooldown passes, Burst 2 finishes T-Rex (0 HP, kills=1) with zero wall-shatter events
  for (let i = 0; i < 8; i++) {
    const stepped = stepDinosaurIslandState(
      state,
      DINOSAUR_ARENA_CENTER.x - 4,
      DINOSAUR_ARENA_CENTER.z - 4,
      true,
      0.05
    );
    assert.equal(stepped.events.wallJustBrokenStage, null, 'No wall-breaking sequence should trigger');
    state = stepped.state;
  }
  const shot2 = fireDinosaurIslandAk47(state, DINOSAUR_ARENA_CENTER.x - 4, 1.5, DINOSAUR_ARENA_CENTER.z - 4);
  assert.equal(shot2.killedDino, true);
  assert.equal(shot2.state.dinoAlive, false);
  assert.equal(shot2.state.kills, 1);
  state = shot2.state;

  // Spawn Endless Wave #2
  state = spawnNextDinoWave(state, DINOSAUR_ARENA_CENTER.x, DINOSAUR_ARENA_CENTER.z);
  assert.equal(state.dinoAlive, true);
  assert.equal(state.dinoHp, 350);

  // Safari Tour Cruiser drives smoothly across the island and stays on dry island landmass
  let car = state.safariCar;
  const startCarX = car.x;
  const startCarZ = car.z;
  for (let i = 0; i < 40; i++) {
    car = stepSafariCarState(car, 1.0, 0.12, false, state.wallsIntact, 0.05, isWaterAt);
  }
  const carMoved = Math.hypot(car.x - startCarX, car.z - startCarZ);
  assert.ok(carMoved > 8.0, `Expected Safari Tour Cruiser to drive smoothly, moved=${carMoved}`);
  assert.ok(isOnDinosaurIsland(car.x, car.z), 'Safari Tour Cruiser must remain safely on Dinosaur Island');
});

test('fireflies appear exclusively in forested regions during twilight and night hours when weather is clear', () => {
  // 1. Weather gating: ONLY clear sky allows fireflies
  assert.equal(isClearWeatherForFireflies('clear'), true);
  for (const w of [
    'breeze',
    'cloudy',
    'fog',
    'rain',
    'heavy_rain',
    'thunderstorm',
    'ferocious_rain',
    'flood',
    'tsunami',
    'snow',
  ] as const) {
    assert.equal(isClearWeatherForFireflies(w), false, `Fireflies must not appear in weather=${w}`);
    assert.equal(computeFireflyVisibility(22.0, w), 0, `Night visibility must be 0 in weather=${w}`);
    assert.equal(computeFireflyVisibility(19.35, w), 0, `Twilight visibility must be 0 in weather=${w}`);
  }

  // 2. Time-of-day gating: invisible in daytime, emerging in twilight, full glow at night
  assert.equal(computeFireflyTimeFactor(TIME_PRESET_HOURS.morning), 0);
  assert.equal(computeFireflyTimeFactor(TIME_PRESET_HOURS.afternoon), 0);
  assert.equal(computeFireflyTimeFactor(TIME_PRESET_HOURS.golden), 0);

  const sunsetVis = computeFireflyVisibility(TIME_PRESET_HOURS.sunset, 'clear');
  const eveningVis = computeFireflyVisibility(TIME_PRESET_HOURS.evening, 'clear');
  const nightVis = computeFireflyVisibility(TIME_PRESET_HOURS.night, 'clear');
  const midnightVis = computeFireflyVisibility(1.5, 'clear');
  const predawnVis = computeFireflyVisibility(4.85, 'clear');

  assert.ok(sunsetVis > 0.1 && sunsetVis < 0.7, `Expected gentle dusk ramp at sunset, got ${sunsetVis}`);
  assert.equal(eveningVis, 1.0, 'Deep twilight evening should show full firefly brilliance');
  assert.equal(nightVis, 1.0, 'Clear night should show full firefly brilliance');
  assert.equal(midnightVis, 1.0, 'Post-midnight clear hours should keep fireflies glowing');
  assert.ok(predawnVis > 0 && predawnVis < 1, `Expected smooth pre-dawn fade, got ${predawnVis}`);

  // 3. Spatial seeding: every firefly anchors inside a forested zone, above ground, off water & rails
  const seeds = generateFireflySeeds(520);
  assert.ok(seeds.length >= 420, `Expected dense forested firefly distribution, got ${seeds.length}`);
  const coveredZones = new Set<string>();
  for (const s of seeds) {
    coveredZones.add(s.zoneId);
    assert.equal(isInForestedRegion(s.x, s.z), true, `Firefly (${s.x}, ${s.z}) must lie in a forested region`);
    assert.equal(isWaterAt(s.x, s.z), false, `Firefly (${s.x}, ${s.z}) must not spawn inside water`);
    assert.ok(
      s.y > groundHeightAt(s.x, s.z) + 0.5,
      `Firefly must hover above forest floor (y=${s.y}, ground=${groundHeightAt(s.x, s.z)})`
    );
  }
  assert.equal(
    coveredZones.size,
    FORESTED_ZONES.length,
    `Expected fireflies across all ${FORESTED_ZONES.length} forested zones, covered ${coveredZones.size}`
  );
  // Open ocean & main station concrete plaza are NOT forested zones
  assert.equal(isInForestedRegion(140, 120), false);
  assert.equal(isInForestedRegion(0, 10), false);
});

test('live navigation computes distance, bearing, arrival state, and terrain-hugging 3D path points', () => {
  const target = {
    id: 'avs_snow_house',
    label: 'AVS Snow Residence',
    x: AVS_SNOW_HOUSE_CENTER.x,
    z: AVS_SNOW_HOUSE_CENTER.z,
  };
  const nav = computeNavigationState(0, 0, 0, target);
  assert.ok(nav.distanceMeters > 170, `Expected >170m to AVS Snow Residence, got ${nav.distanceMeters}`);
  assert.equal(nav.arrived, false);
  assert.ok(Number.isFinite(nav.relativeAngleRad));

  const arrived = computeNavigationState(target.x + 2, target.z - 2, 0, target);
  assert.equal(arrived.arrived, true);

  const pts = sampleNavigationPath(0, 0, target.x, target.z, 24);
  assert.equal(pts.length, 25);
  assert.ok(pts.every((p) => Number.isFinite(p.y) && p.y > WATER_LEVEL));
});

test('The Midnight Frontier portal opens strictly at Night and preserves exact unmodified asset path', () => {
  assert.equal(
    MIDNIGHT_FRONTIER_ASSET_URL,
    '/assets/aistudio/the-midnight-frontier-2nd-version__1__f447db31.html'
  );
  assert.ok(Number.isFinite(MIDNIGHT_FRONTIER_PORTAL_POS.x) && Number.isFinite(MIDNIGHT_FRONTIER_PORTAL_POS.z));

  assert.equal(isMidnightFrontierOpen(22.25), true);
  assert.equal(isMidnightFrontierOpen(1.5), true);
  assert.equal(isMidnightFrontierOpen(12.0), false);
  assert.equal(isMidnightFrontierOpen(17.72), false);
  assert.equal(isMidnightFrontierOpen(19.35), false);
});

test('Dreamline Mobile Bus hails to pick up player, boards, drives to destination, and drops off cleanly', () => {
  let bus = createInitialBusState();
  let dispatch = createInitialBusDispatchState();
  assert.equal(dispatch.phase, 'idle');

  const booked = requestMobileBusRide(
    0,
    18,
    0,
    { id: 'avs_snow_house', label: 'AVS Snow Residence', x: AVS_SNOW_HOUSE_CENTER.x, z: AVS_SNOW_HOUSE_CENTER.z },
    bus
  );
  bus = booked.bus;
  dispatch = booked.dispatch;
  assert.ok(dispatch.phase === 'en_route_pickup' || dispatch.phase === 'arrived_pickup');

  // Step until bus arrives at player pickup point
  for (let i = 0; i < 200 && dispatch.phase === 'en_route_pickup'; i++) {
    const res = stepDispatchedBus(bus, dispatch, 0.05);
    bus = res.bus;
    dispatch = res.dispatch;
  }
  assert.equal(dispatch.phase, 'arrived_pickup', 'Bus must reach player pickup point');

  // Player boards -> bus switches to driving_to_destination
  dispatch = { ...dispatch, phase: 'driving_to_destination' };
  let reachedDropoff = false;
  for (let i = 0; i < 600; i++) {
    const res = stepDispatchedBus(bus, dispatch, 0.05);
    bus = res.bus;
    dispatch = res.dispatch;
    if (res.justArrivedAtDropoff || dispatch.phase === 'arrived_dropoff') {
      reachedDropoff = true;
      break;
    }
  }
  assert.equal(reachedDropoff, true, 'Dispatched bus must drive player all the way to AVS Snow Residence');
  const distToDest = Math.hypot(
    bus.worldX - AVS_SNOW_HOUSE_CENTER.x,
    bus.worldZ - AVS_SNOW_HOUSE_CENTER.z
  );
  assert.ok(distToDest < 6.0, `Bus should drop player right at AVS Snow Residence, dist=${distToDest}`);
});

test('Train Driver Mode and Bus Driver Mode accelerate, brake to stop, and toggle manual doors cleanly', () => {
  // Train Driver Mode
  let train = createInitialTrainState();
  train = { ...train, speed: 0, speedKmh: 0, phase: 'stopped', doorOpen: 1 };
  for (let i = 0; i < 40; i++) {
    train = stepTrainManualDrive(train, 1.0, false, false, 0.05);
  }
  assert.ok(train.speedKmh > 40, `Expected manual train acceleration > 40 km/h, got ${train.speedKmh}`);
  assert.equal(train.doorOpen, 0, 'Doors must close automatically when driving train');

  for (let i = 0; i < 60; i++) {
    train = stepTrainManualDrive(train, 0, true, true, 0.05);
  }
  assert.equal(train.phase, 'stopped', 'Train service brake should bring train to full stop');
  assert.ok(train.doorOpen > 0.4, 'Manual door request should open doors when stopped');

  // Bus Driver Mode
  let bus = createInitialBusState();
  bus = { ...bus, speed: 0, speedKmh: 0, phase: 'stopped', doorOpen: 1, worldX: 0, worldZ: 24 };
  const startBusX = bus.worldX;
  const startBusZ = bus.worldZ;
  for (let i = 0; i < 40; i++) {
    bus = stepBusManualDrive(bus, 1.0, 0.3, false, false, 0.05);
  }
  const busMoved = Math.hypot(bus.worldX - startBusX, bus.worldZ - startBusZ);
  assert.ok(busMoved > 12, `Expected manual bus to drive smoothly across terrain, moved=${busMoved}`);
  assert.ok(bus.speedKmh > 40, `Expected boosted manual bus speed > 40 km/h, got ${bus.speedKmh}`);

  for (let i = 0; i < 40; i++) {
    bus = stepBusManualDrive(bus, 0, 0, true, true, 0.05);
  }
  assert.equal(bus.phase, 'stopped', 'Bus brake must stop bus cleanly');
  assert.ok(bus.doorOpen > 0.3, 'Bus manual doors should open when stopped');
});

test('Expanded Frozen Kingdom Snow Biome, bigger AVS Snow Residence, and 6-Area Underground Cave World are fully walkable', () => {
  assert.equal(isInFrozenKingdom(AVS_SNOW_HOUSE_CENTER.x, AVS_SNOW_HOUSE_CENTER.z), true);
  assert.equal(getRegionAt(AVS_SNOW_HOUSE_CENTER.x, AVS_SNOW_HOUSE_CENTER.z), 'snow');
  assert.ok(AVS_SNOW_HOUSE_SCALE >= 1.5, 'AVS Snow Residence should be scaled noticeably bigger');

  // AVS Snow Residence (rotated cleanly to face Frozen Mirror Lake!): exterior red steps -> ground floor -> interior granite stairs -> 1st floor balcony
  const S = AVS_SNOW_HOUSE_SCALE;
  const stepPt = avsLocalToWorld(1.4, 0.84);
  const stepMidY = getAvsSnowHouseFloorHeight(stepPt.x, stepPt.z, AVS_SNOW_HOUSE_BASE_Y + 0.5);
  assert.ok(stepMidY !== null && stepMidY > AVS_SNOW_HOUSE_BASE_Y + 0.3, `Expected exterior red steps height, got ${stepMidY}`);

  const gfPt = avsLocalToWorld(0, -4.0);
  const groundFloorY = getAvsSnowHouseFloorHeight(gfPt.x, gfPt.z, AVS_SNOW_HOUSE_BASE_Y + 0.96 * S);
  assert.ok(
    groundFloorY !== null && Math.abs(groundFloorY - (AVS_SNOW_HOUSE_BASE_Y + 0.96 * S)) < 0.08,
    `Expected AVS ground floor elevation, got ${groundFloorY}`
  );

  const stairPt = avsLocalToWorld(1.65, -3.6);
  const stairMidY = getAvsSnowHouseFloorHeight(stairPt.x, stairPt.z, AVS_SNOW_HOUSE_BASE_Y + 2.5 * S);
  assert.ok(
    stairMidY !== null && stairMidY > AVS_SNOW_HOUSE_BASE_Y + 1.8 * S && stairMidY < AVS_SNOW_HOUSE_BASE_Y + 4.0 * S,
    `Expected AVS interior granite stairs mid-height, got ${stairMidY}`
  );

  const balcPt = avsLocalToWorld(0, 0.8);
  const balconyY = getAvsSnowHouseFloorHeight(balcPt.x, balcPt.z, AVS_SNOW_HOUSE_BASE_Y + 4.29 * S);
  assert.ok(
    balconyY !== null && Math.abs(balconyY - (AVS_SNOW_HOUSE_BASE_Y + 4.29 * S)) < 0.08,
    `Expected AVS 1st-floor balcony elevation, got ${balconyY}`
  );

  // 6-Area Interconnected Underground Cave World (Areas A-F, 9 passages, 5 entrances)
  assert.equal(CAVE_CHAMBERS.length, 6);
  assert.equal(CAVE_ENTRANCES.length, 5);
  assert.ok(CAVE_PASSAGES.length >= 9);

  for (const chamber of CAVE_CHAMBERS) {
    assert.equal(
      isPointInsideCaveWorld(chamber.x, chamber.z),
      true,
      `Chamber ${chamber.name} center must be inside cave world`
    );
    assert.equal(getCaveChamberAt(chamber.x, chamber.z).id, chamber.id);
    const floorY = getCaveFloorHeightAt(chamber.x, chamber.z);
    assert.ok(
      floorY > CAVE_FLOOR_Y - 1.5 && floorY < CAVE_FLOOR_Y + 4.0,
      `Chamber ${chamber.name} floor height out of range: ${floorY}`
    );
  }

  // Midpoints of every connecting passage must be seamlessly walkable
  for (const p of CAVE_PASSAGES) {
    const mx = (p.from.x + p.to.x) * 0.5;
    const mz = (p.from.z + p.to.z) * 0.5;
    assert.equal(isPointInsideCaveWorld(mx, mz), true, `Passage midpoint (${mx}, ${mz}) must be walkable`);
  }

  // Every cave entrance lands cleanly inside the walkable cave network
  for (const ent of CAVE_ENTRANCES) {
    assert.equal(
      isPointInsideCaveWorld(ent.caveX, ent.caveZ),
      true,
      `Entrance ${ent.id} cave landing (${ent.caveX}, ${ent.caveZ}) must be inside cave world`
    );
  }
});

test('SSJ Tropical Sky Explorer flies smoothly in 3D, climbs, boosts, turns, and exits cleanly', () => {
  let sky = createInitialSkyExplorerState();
  assert.equal(sky.x, SKY_EXPLORER_PAD_POS.x);
  assert.equal(sky.z, SKY_EXPLORER_PAD_POS.z);

  const startX = sky.x;
  const startY = sky.y;
  const startZ = sky.z;

  // Fly forward + ascend + turn + boost for 3 seconds
  for (let i = 0; i < 60; i++) {
    sky = stepSkyExplorerState(sky, 1.0, 0.35, true, false, true, 0.05);
  }
  const distMoved = Math.hypot(sky.x - startX, sky.z - startZ);
  assert.ok(distMoved > 25, `Expected boosted Sky Explorer to fly > 25m horizontally, got ${distMoved}`);
  assert.ok(sky.y > startY + 8, `Expected Sky Explorer to climb > 8m, got ${sky.y - startY}`);
  assert.ok(sky.speedKmh > 60, `Expected Sky Explorer boost speed > 60 km/h, got ${sky.speedKmh}`);
  assert.ok(sky.altitudeM >= 8, `Expected Sky Explorer altitude >= 8m, got ${sky.altitudeM}`);
  assert.ok(Math.abs(sky.roll) > 0.02, `Expected aerodynamic banking roll during turn, got ${sky.roll}`);
  assert.equal(sky.boostActive, true);

  // Descend cleanly and exit at safe lateral offset
  const highY = sky.y;
  for (let i = 0; i < 60; i++) {
    sky = stepSkyExplorerState(sky, 0, 0, false, true, false, 0.05);
  }
  assert.ok(sky.y < highY - 5, `Expected Sky Explorer to descend smoothly from ${highY}, got ${sky.y}`);
  const exit = getSkyExplorerExitPosition(sky);
  assert.ok(Math.hypot(exit.x - sky.x, exit.z - sky.z) >= 2.0);
});

test('Bamboo Catamaran, Tribal Outrigger, and Sovereign of the Tides spawn in navigable ocean water and sail cleanly', () => {
  const boats = createInitialBoats();
  assert.equal(boats.length, 6);

  const catamaran = boats.find((b) => b.id === 'bamboo_catamaran');
  const outrigger = boats.find((b) => b.id === 'tribal_outrigger');
  const sovereign = boats.find((b) => b.id === 'sovereign_ship');
  assert.ok(catamaran, 'Expected Bamboo Catamaran Sail Raft in initial boats');
  assert.ok(outrigger, 'Expected Tribal Survival Outrigger Canoe in initial boats');
  assert.ok(sovereign, 'Expected Sovereign of the Tides sailing ship in initial boats');
  assert.equal(isNavigableBoatWater('ocean', catamaran.x, catamaran.z), true);
  assert.equal(isNavigableBoatWater('ocean', outrigger.x, outrigger.z), true);
  assert.equal(isNavigableBoatWater('ocean', sovereign.x, sovereign.z), true);

  let drivenCat = catamaran;
  let drivenOut = outrigger;
  for (let i = 0; i < 50; i++) {
    drivenCat = stepBoatState(drivenCat, 1.0, 0.25, true, 0.05);
    drivenOut = stepBoatState(drivenOut, 1.0, -0.25, true, 0.05);
  }
  assert.ok(
    Math.hypot(drivenCat.x - catamaran.x, drivenCat.z - catamaran.z) > 10,
    'Bamboo Catamaran should sail smoothly across open sea'
  );
  assert.ok(
    Math.hypot(drivenOut.x - outrigger.x, drivenOut.z - outrigger.z) > 10,
    'Tribal Outrigger Canoe should sail smoothly across open sea'
  );
  assert.equal(isNavigableBoatWater('ocean', drivenCat.x, drivenCat.z), true);
  assert.equal(isNavigableBoatWater('ocean', drivenOut.x, drivenOut.z), true);
});

test('Ocean Universal Transportation Exhibition Complex sits far offshore, inventories all 12 real vehicles, and has multi-floor walkable architecture + Ocean Train & Bus routes', () => {
  // Island sits far offshore in the ocean, > 120m from Dinosaur Island
  assert.equal(isInsideExhibitionIsland(EXHIBITION_ISLAND_CENTER.x, EXHIBITION_ISLAND_CENTER.z), true);
  assert.equal(isOceanAt(EXHIBITION_ISLAND_CENTER.x, EXHIBITION_ISLAND_CENTER.z), false);
  assert.equal(isOceanAt(EXHIBITION_ISLAND_CENTER.x + 68, EXHIBITION_ISLAND_CENTER.z), true);
  const distFromDino = Math.hypot(
    EXHIBITION_ISLAND_CENTER.x - DINOSAUR_ISLAND_CENTER.x,
    EXHIBITION_ISLAND_CENTER.z - DINOSAUR_ISLAND_CENTER.z
  );
  assert.ok(distFromDino > 120, `Expected Ocean Exhibition Complex far from Dinosaur Island (>120m), got ${distFromDino}`);

  // All 12 real playable vehicles discovered honestly
  assert.equal(EXHIBITION_VEHICLE_CATALOG.length, 12);
  assert.ok(EXHIBITION_VEHICLE_CATALOG.some((v) => v.id === 'sovereign_ship' && v.category === 'water'));
  assert.ok(EXHIBITION_VEHICLE_CATALOG.some((v) => v.id === 'sky_explorer' && v.category === 'air'));
  assert.ok(EXHIBITION_VEHICLE_CATALOG.some((v) => v.id === 'dreamline_train' && v.category === 'land'));

  // Multi-floor walkable heights: Dealership GF / 1F / 2F (perimeter gallery outside skylight atrium), Aviation Hangar Floor & Mezzanine, Marina Pier
  const gf = getExhibitionComplexFloorHeight(EXHIBITION_DEALERSHIP_CENTER.x, EXHIBITION_DEALERSHIP_CENTER.z, DEALERSHIP_GF_Y);
  const f1 = getExhibitionComplexFloorHeight(EXHIBITION_DEALERSHIP_CENTER.x, EXHIBITION_DEALERSHIP_CENTER.z, DEALERSHIP_1F_Y);
  const f2 = getExhibitionComplexFloorHeight(EXHIBITION_DEALERSHIP_CENTER.x + 8.5, EXHIBITION_DEALERSHIP_CENTER.z, DEALERSHIP_2F_Y);
  assert.equal(gf, DEALERSHIP_GF_Y);
  assert.equal(f1, DEALERSHIP_1F_Y);
  assert.equal(f2, DEALERSHIP_2F_Y);

  const hFloor = getExhibitionComplexFloorHeight(EXHIBITION_HANGAR_CENTER.x, EXHIBITION_HANGAR_CENTER.z, HANGAR_FLOOR_Y);
  const hMezz = getExhibitionComplexFloorHeight(EXHIBITION_HANGAR_CENTER.x - 16, EXHIBITION_HANGAR_CENTER.z, HANGAR_MEZZ_1_Y);
  assert.equal(hFloor, HANGAR_FLOOR_Y);
  assert.equal(hMezz, HANGAR_MEZZ_1_Y);

  assert.equal(isOnExhibitionMarinaPier(264, 240), true);
  assert.equal(isOnOceanBusCauseway(144, 164), true);
});

test('SSJ Tropical Sky Explorer Air Taxi patrols 5 helipads AND responds to mobile pickup/dropoff, and dual rooftop helipads launch cleanly', () => {
  assert.equal(SKY_TAXI_STOPS.length, 6);
  assert.ok(SKY_TAXI_STOPS.some((s) => s.id === 'sky_exhibition'));
  assert.ok(SKY_TAXI_STOPS.some((s) => s.id === 'sky_desert'));

  // Dual rooftop helipads (Home & AVS Snow Residence)
  const homePadCraft = createSkyExplorerAtHelipad('home');
  const avsPadCraft = createSkyExplorerAtHelipad('avs');
  assert.equal(homePadCraft.x, HOME_HELIPAD_POS.x);
  assert.equal(avsPadCraft.x, AVS_HELIPAD_POS.x);
  assert.ok(Math.hypot(homePadCraft.x - avsPadCraft.x, homePadCraft.z - avsPadCraft.z) > 100);

  // On-demand mobile Air Taxi pickup -> board -> flight -> dropoff
  let taxi = createInitialSkyTaxiState();
  taxi = requestMobileSkyTaxi(
    10,
    1,
    12,
    { id: 'exhibition_complex', label: 'Universal Mobility Exhibition', x: 184, z: 266 },
    taxi
  );
  assert.equal(taxi.phase, 'en_route_pickup');

  let arrivedPickup = false;
  for (let i = 0; i < 400; i++) {
    const res = stepSkyTaxiState(taxi, 0.05);
    taxi = res.state;
    if (res.justArrivedPickup || taxi.phase === 'arrived_pickup') {
      arrivedPickup = true;
      break;
    }
  }
  assert.equal(arrivedPickup, true, 'Sky Explorer Taxi must arrive at player pickup');

  taxi = boardSkyTaxi(taxi);
  assert.equal(taxi.phase, 'flying_to_destination');
  assert.equal(taxi.playerOnboard, true);

  let arrivedDropoff = false;
  for (let i = 0; i < 600; i++) {
    const res = stepSkyTaxiState(taxi, 0.05);
    taxi = res.state;
    if (res.justArrivedDropoff) {
      arrivedDropoff = true;
      break;
    }
  }
  assert.equal(arrivedDropoff, true, 'Sky Explorer Taxi must deliver player smoothly to Ocean Exhibition Complex');
  assert.equal(taxi.playerOnboard, false);

  const cancelled = cancelSkyTaxi(taxi);
  assert.equal(cancelled.phase, 'patrol_cruising');
});

test('In-world Midnight Frontier glows bright at Night with all 8 discoveries and disappears completely in Morning', () => {
  assert.equal(MIDNIGHT_FRONTIER_DISCOVERIES.length, 8);
  const nightVis = computeMidnightFrontierVisibility(22.5);
  const morningVis = computeMidnightFrontierVisibility(8.5);
  assert.equal(isMidnightFrontierOpen(22.5), true);
  assert.ok(nightVis >= 0.85, `Expected bright night glow >= 0.85, got ${nightVis}`);
  assert.equal(isMidnightFrontierOpen(8.5), false);
  assert.equal(morningVis, 0);
});

test('Ambient wildlife generates soaring bird flocks, flower-perching butterflies, and grounded meadow rabbits & squirrels cleanly', () => {
  // 1. Soaring Birds: multiple species/flocks, safe altitude above terrain, animated wing flap/glide, weather sheltering
  const birds = generateBirdSeeds();
  assert.ok(birds.length >= 25, `Expected >= 25 birds across flocks, got ${birds.length}`);
  assert.ok(new Set(birds.map((b) => b.species)).size >= 3, 'Expected diverse bird species');
  const p0 = sampleBirdPose(birds[0], 0);
  const p1 = sampleBirdPose(birds[0], 2.5);
  assert.ok(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 3.0, 'Bird should glide smoothly along its path');
  assert.ok(p0.y > groundHeightAt(p0.x, p0.z) + 4.5, 'Birds should fly safely above terrain');
  assert.equal(computeBirdActivity(17.5, 'clear'), 1.0);
  assert.equal(computeBirdActivity(23.0, 'clear'), 0);
  assert.equal(computeBirdActivity(14.0, 'thunderstorm'), 0);

  // 2. Flower Butterflies: flutter-and-perch cycle over dry wildflower meadows, calm seasonal activity
  const butterflies = generateButterflySeeds();
  assert.ok(butterflies.length >= 35, `Expected >= 35 flower butterflies, got ${butterflies.length}`);
  let sawPerched = false;
  let sawAirborne = false;
  for (let t = 0; t < 18; t += 0.25) {
    const bp = sampleButterflyPose(butterflies[0], t);
    if (bp.perched) sawPerched = true;
    else sawAirborne = true;
  }
  assert.equal(sawAirborne, true, 'Butterflies should flutter through the air');
  assert.equal(sawPerched, true, 'Butterflies should gently perch on flowers periodically');
  assert.equal(computeButterflyActivity(16.0, 'clear', 'spring'), 1.0);
  assert.equal(computeButterflyActivity(16.0, 'clear', 'winter'), 0);
  assert.equal(computeButterflyActivity(16.0, 'rain', 'spring'), 0);
  assert.equal(computeButterflyActivity(22.5, 'clear', 'spring'), 0);

  // 3. Small Grass Animals (Rabbits & Squirrels): grounded on dry grass, clear of water/rail, subtle shy hop on player proximity
  const animalSeeds = generateGrassAnimalSeeds();
  assert.ok(animalSeeds.length >= 20, `Expected >= 20 small meadow animals, got ${animalSeeds.length}`);
  assert.ok(animalSeeds.some((a) => a.species === 'rabbit'), 'Expected meadow rabbits');
  assert.ok(animalSeeds.some((a) => a.species === 'squirrel'), 'Expected woodland squirrels');
  for (const a of animalSeeds) {
    assert.equal(isWaterAt(a.homeX, a.homeZ), false, `Grass animal ${a.id} must not spawn in water`);
    assert.ok(distanceToRail(a.homeX, a.homeZ) >= 4.2, `Grass animal ${a.id} must stay clear of railway tracks`);
  }

  const animals = createInitialGrassAnimalStates(animalSeeds);
  const rabbit = animals.find((a) => a.species === 'rabbit')!;
  const startX = rabbit.x;
  const startZ = rabbit.z;
  // Walk right next to the rabbit -> should trigger gentle shy_hop deeper into the meadow
  for (let i = 0; i < 45; i++) {
    stepGrassAnimal(rabbit, 0.05, i * 0.05, startX + 0.8, startZ + 0.6);
  }
  assert.ok(
    Math.hypot(rabbit.x - startX, rabbit.z - startZ) > 0.6,
    'Rabbit should gently hop away into the grass when approached closely'
  );
  assert.equal(isWaterAt(rabbit.x, rabbit.z), false, 'Hopping rabbit must remain on dry grass');
  assert.ok(
    Math.abs(rabbit.y - groundHeightAt(rabbit.x, rabbit.z)) < 0.05,
    'Grass animal must remain grounded on terrain height'
  );
  assert.equal(computeGrassAnimalActivity(17.5, 'clear'), 1.0);
  assert.equal(computeGrassAnimalActivity(17.5, 'tsunami'), 0);
});

test('Playable avatar catalog includes Dr. Alan Grant and all 5 avatars with distinct unobstructed En Illam display slots', () => {
  assert.equal(PLAYABLE_AVATARS.length, 5, 'Expected all 5 playable avatars');
  const ids = PLAYABLE_AVATARS.map((a) => a.id);
  for (const required of ['alan_grant', 'igloo_man', 'navy_jacket', 'coastal_tee', 'winter_parka'] as const) {
    assert.ok(ids.includes(required), `Missing avatar ${required}`);
    assert.equal(isValidBoyOutfitId(required), true);
  }
  assert.equal(isValidBoyOutfitId('unknown_outfit'), false);

  const alan = getAvatarMeta('alan_grant');
  assert.equal(alan.name, 'Dr. Alan Grant');
  assert.ok(alan.desc.toLowerCase().includes('flare'), 'Alan Grant description should include glowing road flare');

  // Verify all 5 En Illam display pedestals have clean spacing (>= 1.2m apart) inside Ground Floor bounds (-4.5..2.5)
  const zPositions = PLAYABLE_AVATARS.map((a) => a.homeGalleryZ).sort((a, b) => a - b);
  for (let i = 0; i < zPositions.length; i++) {
    assert.ok(zPositions[i] >= -4.2 && zPositions[i] <= 2.4, `Pedestal Z ${zPositions[i]} outside En Illam gallery`);
    if (i > 0) {
      assert.ok(
        zPositions[i] - zPositions[i - 1] >= 1.2,
        `Pedestals too close: ${zPositions[i - 1]} and ${zPositions[i]}`
      );
    }
  }
});

test('AI train passengers keep player & Frosty seats clear and adapt activities to time of day and weather', () => {
  assert.ok(TRAIN_PASSENGER_SEEDS.length >= 6, 'Expected populated 2-car train passengers');

  // Ensure zero overlap with Player window seat (leadCar, side=+1, z=+0.42) or Frosty seat (leadCar, side=-1, z=+0.35)
  for (const p of TRAIN_PASSENGER_SEEDS) {
    if (p.carIndex === 0 && p.side === 1) {
      assert.ok(Math.abs(p.seatZ - 0.42) > 1.0, `Passenger ${p.id} overlaps player window seat`);
    }
    if (p.carIndex === 0 && p.side === -1) {
      assert.ok(Math.abs(p.seatZ - 0.35) > 0.9, `Passenger ${p.id} overlaps Frosty companion seat`);
    }
  }

  // Sunset favors window_gazing over dozing; Late Night favors dozing over window_gazing
  const sunsetW = computePassengerActivityWeights(17.7, 'clear', 'spring', 'scenic');
  const nightW = computePassengerActivityWeights(23.0, 'clear', 'spring', 'scenic');
  assert.ok(
    sunsetW.window_gazing > sunsetW.dozing * 3,
    `Sunset should strongly favor window gazing (${sunsetW.window_gazing} vs ${sunsetW.dozing})`
  );
  assert.ok(
    nightW.dozing > sunsetW.dozing * 4,
    `Late night should strongly increase dozing (${nightW.dozing} vs ${sunsetW.dozing})`
  );

  // Thunderstorm / Heavy Rain strongly activates weather_watching & sipping_tea compared to clear midday
  const clearDayW = computePassengerActivityWeights(13.0, 'clear', 'summer', 'scenic');
  const stormW = computePassengerActivityWeights(13.0, 'thunderstorm', 'summer', 'scenic');
  assert.ok(
    stormW.weather_watching > clearDayW.weather_watching * 10,
    `Storm should dramatically boost weather_watching (${stormW.weather_watching} vs ${clearDayW.weather_watching})`
  );
  assert.ok(
    stormW.sipping_tea > clearDayW.sipping_tea,
    'Storm should boost cozy tea sipping'
  );

  // Morning boosts sipping_tea vs bright afternoon
  const morningW = computePassengerActivityWeights(7.2, 'clear', 'winter', 'tea_lover');
  const afternoonW = computePassengerActivityWeights(14.0, 'clear', 'summer', 'tea_lover');
  assert.ok(
    morningW.sipping_tea > afternoonW.sipping_tea * 2,
    'Cool winter morning should boost warm tea sipping'
  );

  // Stepping passengers smoothly transitions poses and responds promptly when storm hits
  const passengers = createInitialTrainPassengerStates(17.72, 'clear', 'spring');
  assert.ok(passengers.some((p) => p.activity === 'reading'), 'Should start with a reading passenger');
  assert.ok(passengers.some((p) => p.activity === 'window_gazing'), 'Should start with a window-gazing passenger');
  assert.ok(passengers.some((p) => p.activity === 'sipping_tea'), 'Should start with a tea-sipping passenger');

  for (let i = 0; i < 60; i++) {
    stepTrainPassengers(passengers, 0.05, 17.72, 'thunderstorm', 'spring', i * 0.05);
  }
  assert.ok(
    passengers.some((p) => p.activity === 'weather_watching'),
    'Passengers should react to sudden thunderstorm by watching the weather out the window'
  );
  for (const p of passengers) {
    assert.ok(Number.isFinite(p.headYaw) && Number.isFinite(p.headPitch) && Number.isFinite(p.bookRaise));
  }
});

test('Procedural train steam/smoke particles scale intensity with train speed and ambient temperature settings', () => {
  // Effective ambient temperature responds to season, region, weather, and honors manual overrides
  const summerMidday = computeEffectiveTemperatureC('summer', 'clear', 14.5, 'sakura', null);
  const winterSnowKingdom = computeEffectiveTemperatureC('winter', 'snow', 5.0, 'snow', null);
  assert.ok(
    summerMidday > 28 && winterSnowKingdom <= -10,
    `Expected warm summer (${summerMidday}°C) vs freezing winter snow (${winterSnowKingdom}°C)`
  );
  assert.equal(
    computeEffectiveTemperatureC('summer', 'clear', 14.5, 'sakura', -10),
    -10,
    'Manual temperature override must take precedence over auto climate'
  );

  // Speed scaling: cruising and departing emit denser, larger, faster-rising plumes than stopped idle
  const stoppedMild = computeTrainSteamProfile(0, 'stopped', 18, 'clear');
  const cruisingMild = computeTrainSteamProfile(56, 'cruising', 18, 'clear');
  const departingMild = computeTrainSteamProfile(22, 'departing', 18, 'clear');
  assert.ok(
    cruisingMild.emissionRate > stoppedMild.emissionRate * 2.5,
    `Cruising emission (${cruisingMild.emissionRate}) must exceed stopped (${stoppedMild.emissionRate})`
  );
  assert.ok(
    cruisingMild.endScale > stoppedMild.endScale && cruisingMild.baseOpacity > stoppedMild.baseOpacity,
    'Cruising puffs must expand larger and denser than idle simmering wisps'
  );
  assert.ok(
    departingMild.emissionRate > stoppedMild.emissionRate * 1.8,
    'Departing chug burst must noticeably boost steam emission'
  );

  // Temperature scaling: freezing cold air (-10°C) produces thicker, longer-lived condensing white steam than hot (+34°C) air
  const cruisingFreezing = computeTrainSteamProfile(50, 'cruising', -10, 'clear');
  const cruisingHot = computeTrainSteamProfile(50, 'cruising', 34, 'clear');
  assert.ok(
    cruisingFreezing.condensationFactor > cruisingHot.condensationFactor * 2.5,
    `Freezing condensation (${cruisingFreezing.condensationFactor}) must strongly exceed hot air (${cruisingHot.condensationFactor})`
  );
  assert.ok(
    cruisingFreezing.puffLifetime > cruisingHot.puffLifetime * 1.8,
    `Cold-air steam (${cruisingFreezing.puffLifetime}s) must linger longer than hot-air smoke (${cruisingHot.puffLifetime}s)`
  );
  assert.ok(
    cruisingFreezing.baseOpacity > cruisingHot.baseOpacity * 1.35,
    'Cold-air steam must render more visibly opaque than hot-air wisps'
  );

  // World-space particle pool emits, rises, trails behind a moving train, and ages out cleanly without NaNs
  const pool = createTrainSteamPool(48);
  let trainX = 0;
  const trainVx = 12; // 12 m/s forward along +X
  for (let i = 0; i < 45; i++) {
    trainX += trainVx * 0.05;
    stepTrainSteamPool(pool, 0.05, trainX, 4.4, 0, trainVx, 0, 44, 'cruising', -8, 'clear', i * 0.05);
  }
  assert.ok(pool.activeCount >= 12, `Expected active steam plume particles >= 12, got ${pool.activeCount}`);

  let hasTrailingHigherPuff = false;
  for (const p of pool.particles) {
    if (!p.active) continue;
    assert.ok(
      Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z) && Number.isFinite(p.maxAlpha),
      'Steam particle coordinates must remain finite'
    );
    if (p.y > 5.0 && p.x < trainX - 1.5) {
      hasTrailingHigherPuff = true;
    }
  }
  assert.equal(
    hasTrailingHigherPuff,
    true,
    'Older steam puffs must rise above the exhaust stack and trail behind the moving train'
  );
});

test('regional station platform announcements & ambient crowd murmur vary cleanly across regions, time, and weather', () => {
  const train = createInitialTrainState();
  const seenRegions = new Set<string>();
  const seenChimes = new Set<string>();

  for (let i = 0; i < STATIONS.length; i++) {
    const region = getStationRegionId(i);
    seenRegions.add(region);
    const arrived = generateStationAnnouncement({
      stationIndex: i,
      eventKind: 'arrived',
      timeHours: 17.5,
      weather: 'clear',
      seed: 3 + i,
    });
    seenChimes.add(arrived.chimeName);
    assert.ok(arrived.text.includes(STATIONS[i].name), 'Announcement must include station name');
    assert.ok(arrived.chimeNotes.length >= 4, 'Each region chime must contain at least 4 notes');
  }
  assert.equal(seenRegions.size, 6, 'All 6 regions (including Desert) must be represented across the 9 stations');
  assert.equal(seenChimes.size, 6, 'Each region must have its own distinct melodic station chime');

  const rainPa = generateStationAnnouncement({
    stationIndex: 0,
    eventKind: 'approaching',
    timeHours: 14,
    weather: 'rain',
    seed: 11,
  });
  assert.ok(/rain|wet/i.test(rainPa.text), `Rain PA should include weather safety note, got: ${rainPa.text}`);

  // Ambient crowd murmur swells right on the main platform, quiets at night, and drops to 0 far away
  const st0 = STATIONS[0];
  const rushCrowd = computeStationCrowdProfile(st0.platformX, st0.platformZ, 17.8, 'clear', train, false);
  const nightCrowd = computeStationCrowdProfile(st0.platformX, st0.platformZ, 2.0, 'clear', train, false);
  const farCrowd = computeStationCrowdProfile(-180, -180, 17.8, 'clear', train, false);
  assert.ok(rushCrowd.gain > 0.06, `Expected audible rush-hour crowd murmur on platform, got ${rushCrowd.gain}`);
  assert.ok(rushCrowd.gain > nightCrowd.gain * 1.8, 'Sunset rush crowd must exceed late-night hush');
  assert.equal(farCrowd.gain, 0, 'Station crowd murmur must be 0 far from any platform');
});

test('both En Illam and AVS Snow Residence provide walkable routes all the way to their rooftop helipads', () => {
  // 1. En Illam (My Home): 2F east balcony doorway -> exterior helipad stairs -> skywalk -> rooftop helipad (y = 10.4m)
  const hx = HOME_CENTER.x;
  const hz = HOME_CENTER.z;
  const stepOut = resolvePlayerCollision(hx + 6.9, hz + 6.4, hx + 5.2, hz + 6.4, 0.35, [], 3.65, false);
  assert.equal(stepOut.collided, false, 'Player must be able to step out En Illam east balcony onto helipad stairs');

  let y = 3.65;
  const stairsZs = [6.2, 4.0, 1.5, -1.0, -3.8];
  for (const lz of stairsZs) {
    const nextY = walkableHeightWithFloor(hx + 7.1, hz + lz, y);
    assert.ok(nextY >= y - 0.01, `En Illam helipad stair should ascend smoothly at lz=${lz}: ${y} -> ${nextY}`);
    y = nextY;
  }
  assert.ok(Math.abs(y - 10.4) < 0.15, `Top of En Illam helipad stairs must reach y=10.4m, got ${y}`);

  const bridgeY = walkableHeightWithFloor(hx + 5.2, hz - 3.0, y);
  const padCenterY = walkableHeightWithFloor(hx, hz, bridgeY);
  assert.equal(bridgeY, 10.4, 'En Illam helipad skywalk bridge must sit at y=10.4m');
  assert.equal(padCenterY, 10.4, 'En Illam circular rooftop helipad deck must sit at y=10.4m');

  // 2. AVS Snow Residence: 1F balcony -> exterior helipad stairs -> rooftop bridge -> circular AVS helipad deck
  const S = AVS_SNOW_HOUSE_SCALE;
  const cosR = Math.cos(AVS_SNOW_HOUSE_ROT_Y);
  const sinR = Math.sin(AVS_SNOW_HOUSE_ROT_Y);
  const toAvsWorld = (lx: number, lz: number) => ({
    x: AVS_SNOW_HOUSE_CENTER.x + (lx * cosR + lz * sinR) * S,
    z: AVS_SNOW_HOUSE_CENTER.z + (-lx * sinR + lz * cosR) * S,
  });

  let avsY = AVS_SNOW_HOUSE_BASE_Y + 4.29 * S;
  const avsExpectedPadY = AVS_SNOW_HOUSE_BASE_Y + 7.59 * S;
  for (const lz of [0.5, -0.5, -2.0, -3.5, -4.9]) {
    const wp = toAvsWorld(2.88, lz);
    const nextY = getAvsSnowHouseFloorHeight(wp.x, wp.z, avsY);
    assert.ok(nextY !== null && nextY >= avsY - 0.05, `AVS helipad stair must climb cleanly at local z=${lz}`);
    avsY = nextY;
  }
  assert.ok(
    Math.abs(avsY - avsExpectedPadY) < 0.25,
    `Top of AVS helipad stairs must reach rooftop deck (${avsExpectedPadY.toFixed(2)}), got ${avsY.toFixed(2)}`
  );
  const avsPadCenter = toAvsWorld(0, -5.8);
  const avsPadFloor = getAvsSnowHouseFloorHeight(avsPadCenter.x, avsPadCenter.z, avsY);
  assert.ok(
    avsPadFloor !== null && Math.abs(avsPadFloor - avsExpectedPadY) < 0.05,
    'AVS circular rooftop helipad deck must be fully walkable'
  );
});

test('Sovereign of the Tides is moored near Kadalkarai Shore with a walkable boarding pier and sails smoothly', () => {
  const boats = createInitialBoats();
  const sov = boats.find((b) => b.id === 'sovereign_ship');
  assert.ok(sov, 'Sovereign of the Tides must exist in initial boats');

  const distFromCoast = Math.hypot(sov.x - COAST_CENTER.x, sov.z - COAST_CENTER.z);
  assert.ok(distFromCoast < 32, `Sovereign ship must be near Kadalkarai shore (<32m), got ${distFromCoast.toFixed(1)}m`);

  // Walkable timber boarding pier connects dry sandy beach (x=104) right up to the ship (x=122)
  for (const px of [105, 110, 116, 121.5]) {
    assert.equal(isWaterAt(px, 48.6), false, `Sovereign boarding pier at x=${px} must be dry & walkable`);
    assert.ok(walkableHeightAt(px, 48.6) >= 0.35, `Sovereign boarding pier deck height at x=${px} must be >= 0.35m`);
  }

  // Ship starts in navigable ocean water and sails smoothly forward when driven
  assert.equal(isNavigableBoatWater('ocean', sov.x, sov.z), true);
  let sailing = sov;
  for (let i = 0; i < 45; i++) {
    sailing = stepBoatState(sailing, 1.0, 0.15, true, 0.05);
  }
  const sailedDist = Math.hypot(sailing.x - sov.x, sailing.z - sov.z);
  assert.ok(sailedDist > 12, `Sovereign of the Tides should sail smoothly when driven, moved ${sailedDist.toFixed(1)}m`);
  assert.equal(isNavigableBoatWater('ocean', sailing.x, sailing.z), true);
});

test('Mobile Vehicle Catalogue includes all 22 vehicles (including Aero-Ti Hoverboard Glider, 49cc Petrol Dirt Bike, Orange Rescue Helicopter & SSJ Expedition Cruiser) and spawns EVERY vehicle at exact player location', () => {
  assert.equal(VEHICLE_CATALOGUE.length, 22, 'Catalogue must include all 22 playable vehicles including Aero-Ti Hoverboard Glider, 49cc Petrol Dirt Bike, Orange Rescue Helicopter & SSJ Expedition Cruiser');
  for (const requiredId of [
    'safari_jeep',
    'hover_glider',
    'vtol_aircraft',
    'jetski_sport',
    'jetski_perf',
    'dirt_bike_49cc',
    'kadalkarai_submarine',
    'batmobile',
    'orange_heli',
    'ssj_expedition_boat',
    'safari_car',
  ] as const) {
    assert.ok(
      VEHICLE_CATALOGUE.some((v) => v.id === requiredId),
      `Catalogue must include ${requiredId}`
    );
  }
  assert.ok(getCatalogueVehiclesByCategory('cars').length >= 5);
  assert.ok(getCatalogueVehiclesByCategory('bikes').length >= 3);
  assert.ok(getCatalogueVehiclesByCategory('ships').length >= 9);
  assert.ok(getCatalogueVehiclesByCategory('air_rail').length >= 5);

  const testPositions = [
    { x: -12.4, z: -18.7, h: 0.72 },
    { x: 348.2, z: 184.5, h: -1.15 },
    { x: 12.0, z: 22.0, h: 2.4 },
  ];
  for (const pos of testPositions) {
    for (const v of VEHICLE_CATALOGUE) {
      const pt = computeCatalogueSpawnPoint(v.id, pos.x, pos.z, pos.h);
      assert.equal(pt.x, pos.x, `${v.id} must spawn at exact player X (${pos.x}), got ${pt.x}`);
      assert.equal(pt.z, pos.z, `${v.id} must spawn at exact player Z (${pos.z}), got ${pt.z}`);
      assert.equal(pt.heading, pos.h, `${v.id} must inherit exact player heading`);
    }
  }
});

test('Thar Golden Desert Oasis & Grand Pyramid Ruins have rolling dunes, swimmable oasis, walkable jetty, pyramid stairs, secret chamber & desert helipad', () => {
  // 1. Region classification without disturbing existing regions
  assert.equal(isInsideDesertBiome(DESERT_OASIS_CENTER.x, DESERT_OASIS_CENTER.z), true);
  assert.equal(getRegionAt(DESERT_OASIS_CENTER.x, DESERT_OASIS_CENTER.z), 'desert');
  assert.equal(getRegionAt(DESERT_PYRAMID_CENTER.x, DESERT_PYRAMID_CENTER.z), 'desert');
  assert.equal(getRegionAt(0, 10), 'sakura');
  assert.equal(getRegionAt(-102, 48), 'sakura');

  // 2. Emerald Oasis Lagoon is swimmable water while the Wooden Jetty over it is dry & walkable
  assert.equal(isWaterAt(DESERT_OASIS_CENTER.x, DESERT_OASIS_CENTER.z), true);
  assert.equal(isWaterAt(DESERT_OASIS_SPAWN.x, DESERT_OASIS_SPAWN.z), false);
  const jettyMidX = (DESERT_OASIS_JETTY_BOUNDS.minX + DESERT_OASIS_JETTY_BOUNDS.maxX) * 0.5;
  const jettyMidZ = (DESERT_OASIS_JETTY_BOUNDS.minZ + DESERT_OASIS_JETTY_BOUNDS.maxZ) * 0.5;
  assert.equal(isWaterAt(jettyMidX, jettyMidZ), false, 'Oasis timber jetty must stay dry & walkable');
  assert.ok(walkableHeightAt(jettyMidX, jettyMidZ) >= DESERT_OASIS_JETTY_BOUNDS.deckY);

  // 3. Walkable East Processional Staircase climbs monotonically from base (0.65m) to Golden Sun Summit (14.65m)
  let prevH = DESERT_PYRAMID_BASE_Y - 0.1;
  for (const lx of [19.4, 15.0, 11.0, 7.0, 3.0]) {
    const h = walkableHeightWithFloor(
      DESERT_PYRAMID_CENTER.x + lx,
      DESERT_PYRAMID_CENTER.z,
      Math.max(prevH, 0.7)
    );
    assert.ok(h > prevH, `East Pyramid Staircase must climb at lx=${lx} (got ${h.toFixed(2)}m <= ${prevH.toFixed(2)}m)`);
    prevH = h;
  }
  const summitH = walkableHeightWithFloor(DESERT_PYRAMID_CENTER.x, DESERT_PYRAMID_CENTER.z, 13.5);
  assert.ok(
    Math.abs(summitH - DESERT_PYRAMID_SUMMIT_Y) < 0.05,
    `Pyramid Summit platform must sit at ${DESERT_PYRAMID_SUMMIT_Y}m, got ${summitH}`
  );

  // 4. South Monumental Portal leads into hollow Torch-Lit Secret Solar Relic Chamber at ground level
  assert.equal(isInsidePyramidChamber(DESERT_PYRAMID_SOUTH_PORTAL.x, DESERT_PYRAMID_CENTER.z + 12.0, 0.9), true);
  assert.equal(isInsidePyramidChamber(DESERT_PYRAMID_CENTER.x, DESERT_PYRAMID_CENTER.z, 0.9), true);
  const chamberH = walkableHeightWithFloor(DESERT_PYRAMID_CENTER.x, DESERT_PYRAMID_CENTER.z, 0.9);
  assert.ok(
    Math.abs(chamberH - DESERT_PYRAMID_CHAMBER_Y) < 0.05,
    `Secret Chamber floor must be walkable at ${DESERT_PYRAMID_CHAMBER_Y}m, got ${chamberH}`
  );

  // 5. Desert Sandstone Helipad & rolling outer dunes
  const padH = walkableHeightWithFloor(DESERT_HELIPAD_POS.x, DESERT_HELIPAD_POS.z, 1.5);
  assert.ok(Math.abs(padH - DESERT_HELIPAD_POS.y) < 0.05);
  const outerDuneH = groundHeightAt(-285, 175);
  assert.ok(outerDuneH > 2.0, `Outer Thar sand dunes should rise above 2.0m, got ${outerDuneH.toFixed(2)}m`);
});

test('seasonal foliage profiles dynamically swap distinct 3D tree and plant models across all 4 seasons', () => {
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;
  const treeVariants = new Set(seasons.map((s) => getActiveTreeVariantForSeason(s)));
  const plantVariants = new Set(seasons.map((s) => getActivePlantVariantForSeason(s)));

  assert.equal(treeVariants.size, 4, 'Each season must map to its own distinct 3D tree model variant');
  assert.equal(plantVariants.size, 4, 'Each season must map to its own distinct 3D ground plant variant');

  const spring = getSeasonalFoliageProfile('spring');
  const summer = getSeasonalFoliageProfile('summer');
  const autumn = getSeasonalFoliageProfile('autumn');
  const winter = getSeasonalFoliageProfile('winter');

  assert.equal(spring.treeModelVariant, 'cherry_blossom');
  assert.equal(spring.plantModelVariant, 'spring_tulip');
  assert.equal(spring.hasCherryBlossoms, true);
  assert.equal(spring.hasSnowDusting, false);

  assert.equal(summer.treeModelVariant, 'summer_broadleaf');
  assert.equal(summer.plantModelVariant, 'summer_sunflower');
  assert.ok(summer.grassScaleY > winter.grassScaleY, 'Summer grass must stand taller than frosted winter grass');

  assert.equal(autumn.treeModelVariant, 'autumn_maple');
  assert.equal(autumn.plantModelVariant, 'autumn_mushroom_fern');

  assert.equal(winter.treeModelVariant, 'snow_pine');
  assert.equal(winter.plantModelVariant, 'winter_frost_shrub');
  assert.equal(winter.hasSnowDusting, true);
  assert.equal(Object.keys(SEASONAL_FOLIAGE_PROFILES).length, 4);
});

test('extended Dreamline railway reaches both Panimalai Snow Summit and Thar Desert Oasis with flat graded tracks, platforms, PA chimes, and routing', () => {
  const snowSt = STATIONS.find((s) => s.id === 'panimalai_snow_station');
  const desertSt = STATIONS.find((s) => s.id === 'thar_desert_station');
  assert.ok(snowSt, 'Panimalai Snow Summit station must exist on railway loop');
  assert.ok(desertSt, 'Thar Desert Oasis station must exist on railway loop');

  // Stations lie cleanly inside their target biomes
  assert.equal(getRegionAt(snowSt.worldX, snowSt.worldZ), 'snow');
  assert.equal(getRegionAt(desertSt.worldX, desertSt.worldZ), 'desert');

  // Track bed is graded flat (not buried under dunes or snow slopes) and platforms are elevated & walkable
  const snowRailY = groundHeightAt(snowSt.worldX, snowSt.worldZ);
  const desertRailY = groundHeightAt(desertSt.worldX, desertSt.worldZ);
  assert.ok(Math.abs(snowRailY) < 0.35, `Expected flat graded rail bed at Snow Summit, got y=${snowRailY.toFixed(2)}`);
  assert.ok(Math.abs(desertRailY) < 0.35, `Expected flat graded rail bed at Thar Desert, got y=${desertRailY.toFixed(2)}`);
  assert.ok(walkableHeightAt(snowSt.platformX, snowSt.platformZ) >= 0.75, 'Snow Summit platform must be elevated');
  assert.ok(walkableHeightAt(desertSt.platformX, desertSt.platformZ) >= 0.75, 'Thar Desert platform must be elevated');

  // Regional PA chimes match Snow and Desert biomes
  const snowIdx = STATIONS.findIndex((s) => s.id === 'panimalai_snow_station');
  const desertIdx = STATIONS.findIndex((s) => s.id === 'thar_desert_station');
  assert.equal(getStationRegionId(snowIdx), 'snow');
  assert.equal(getStationRegionId(desertIdx), 'desert');
  const snowPa = generateStationAnnouncement({
    stationIndex: snowIdx,
    eventKind: 'approaching',
    timeHours: 14.0,
    weather: 'clear',
    seed: 1,
  });
  const desertPa = generateStationAnnouncement({
    stationIndex: desertIdx,
    eventKind: 'approaching',
    timeHours: 14.0,
    weather: 'clear',
    seed: 2,
  });
  assert.equal(snowPa.chimeName, 'Glacier Celesta Chime');
  assert.equal(desertPa.chimeName, 'Desert Santoor Chime');

  // Selective-stop route planning from Sakuragawa -> Panimalai Snow Summit -> Thar Desert Oasis
  const originIdx = STATIONS.findIndex((s) => s.id === 'sakuragawa_station');
  const plan = createTrainRoutePlan(originIdx, [snowIdx], desertIdx, 14.0);
  assert.deepEqual(plan.selectedStopIndices, [snowIdx, desertIdx]);
  assert.equal(plan.includesIcelandTransfer, true);
});

test('distant countryside bird flocking system applies Boids separation, alignment, cohesion, periodic spawning, and weather/night gating', () => {
  // 1. Initial scenic distant flock spawns safely above terrain with articulated birds
  const state = createInitialBirdFlockingState(0.6, 13.3, 'spring');
  const initialStats = getFlockingStats(state);
  assert.equal(initialStats.activeFlocks, 1);
  assert.ok(
    initialStats.activeBirds >= FLOCK_MIN_BIRDS && initialStats.activeBirds <= MAX_FLOCK_BIRDS,
    `Expected ${FLOCK_MIN_BIRDS}..${MAX_FLOCK_BIRDS} initial flocking birds, got ${initialStats.activeBirds}`
  );
  const firstFlock = state.flocks[0];
  assert.equal(firstFlock.species, 'countryside_swallow');
  for (const b of firstFlock.birds) {
    const minSafeY = groundHeightAt(b.x, b.z) + 8.5;
    assert.ok(b.y >= minSafeY, `Flock bird must stay clear above countryside terrain (y=${b.y}, min=${minSafeY})`);
  }

  // 2. Boids Separation rule: two birds placed closer than SEPARATION_RADIUS steer apart
  const b0 = firstFlock.birds[0];
  const b1 = firstFlock.birds[1];
  b1.x = b0.x + 0.6;
  b1.y = b0.y;
  b1.z = b0.z;
  b1.vx = b0.vx;
  b1.vy = b0.vy;
  b1.vz = b0.vz;
  const startPairDist = Math.hypot(b1.x - b0.x, b1.y - b0.y, b1.z - b0.z);
  assert.ok(startPairDist < SEPARATION_RADIUS);

  // 3. Boids Alignment & Cohesion rule: stray bird heading off-course turns back toward flockmates
  const stray = firstFlock.birds[firstFlock.birds.length - 1];
  stray.x = firstFlock.anchorX - 9.0;
  stray.z = firstFlock.anchorZ - 4.0;
  stray.vx = -firstFlock.dirX * 8.0;
  stray.vz = -firstFlock.dirZ * 8.0;

  let elapsed = 0;
  for (let i = 0; i < 40; i++) {
    elapsed += 0.05;
    stepBirdFlockingSystem(state, 0.05, elapsed, 17.5, 'clear', 'spring', 0.6, 13.3);
  }

  const endPairDist = Math.hypot(b1.x - b0.x, b1.y - b0.y, b1.z - b0.z);
  assert.ok(
    endPairDist > startPairDist + 0.35,
    `Expected Boids separation to push overly close birds apart (${startPairDist.toFixed(2)} -> ${endPairDist.toFixed(2)})`
  );

  // Stray bird aligns with flock direction
  const alignedDot = stray.vx * firstFlock.dirX + stray.vz * firstFlock.dirZ;
  assert.ok(alignedDot > 0, `Expected stray bird to align with flock travel vector, dot=${alignedDot.toFixed(2)}`);

  // All speeds remain clamped within realistic flight envelope and altitudes remain clear of terrain
  for (const flock of state.flocks) {
    for (const b of flock.birds) {
      const spd = Math.hypot(b.vx, b.vy, b.vz);
      assert.ok(
        spd >= MIN_BIRD_SPEED - 0.05 && spd <= MAX_BIRD_SPEED + 0.05,
        `Bird speed ${spd.toFixed(2)} out of [${MIN_BIRD_SPEED}, ${MAX_BIRD_SPEED}]`
      );
      assert.ok(
        b.y >= groundHeightAt(b.x, b.z) + 8.5,
        `Bird altitude ${b.y.toFixed(2)} dipped too close to ground`
      );
    }
  }

  // 4. Periodic distant spawning & recycling over ~45 seconds never exceeds caps
  let maxObservedFlocks = 0;
  let maxObservedBirds = 0;
  for (let i = 0; i < 900; i++) {
    elapsed += 0.05;
    stepBirdFlockingSystem(state, 0.05, elapsed, 14.0, 'clear', 'autumn', 0.6, 13.3);
    const s = getFlockingStats(state);
    if (s.activeFlocks > maxObservedFlocks) maxObservedFlocks = s.activeFlocks;
    if (s.activeBirds > maxObservedBirds) maxObservedBirds = s.activeBirds;
  }
  const midStats = getFlockingStats(state);
  assert.ok(
    midStats.totalSpawnedFlocks >= 3,
    `Expected periodic spawning of multiple flocks over 45s, got ${midStats.totalSpawnedFlocks}`
  );
  assert.ok(maxObservedFlocks <= MAX_ACTIVE_FLOCKS, `Exceeded MAX_ACTIVE_FLOCKS (${maxObservedFlocks})`);
  assert.ok(maxObservedBirds <= MAX_FLOCK_BIRDS, `Exceeded MAX_FLOCK_BIRDS (${maxObservedBirds})`);

  // 5. Weather and deep-night gating pause spawns and gracefully clear flocks
  assert.equal(computeFlockSkyActivity(14.0, 'clear'), 1);
  assert.equal(computeFlockSkyActivity(17.7, 'clear'), 1);
  assert.equal(computeFlockSkyActivity(23.0, 'clear'), 0);
  assert.equal(computeFlockSkyActivity(14.0, 'thunderstorm'), 0);
  assert.equal(computeFlockSkyActivity(14.0, 'ferocious_rain'), 0);

  const spawnedBeforeStorm = state.totalSpawnedFlocks;
  for (let i = 0; i < 120; i++) {
    elapsed += 0.05;
    stepBirdFlockingSystem(state, 0.05, elapsed, 14.0, 'thunderstorm', 'autumn', 0.6, 13.3);
  }
  assert.equal(state.totalSpawnedFlocks, spawnedBeforeStorm, 'No new flocks should spawn during a thunderstorm');
  assert.equal(state.flocks.length, 0, 'Existing flocks should gracefully depart when a thunderstorm hits');

  // 6. Fast-travel across the world prunes out-of-sight flocks and seeds a fresh distant horizon flock
  refreshFlocksForFocus(state, 240, -180, 14.0, 'clear', 'summer');
  assert.equal(state.flocks.length, 1);
  assert.equal(state.flocks[0].species, 'meadow_swift');
  assert.ok(
    Math.hypot(state.flocks[0].anchorX - 240, state.flocks[0].anchorZ - -180) <= 105,
    'Fast-travel should seed a distant flock over the new destination horizon'
  );
});

test('Hero Character roster covers all 7 heroes, 15 outfits (>=2 per hero), balanced attributes, and multi-suit cycling', () => {
  assert.equal(HERO_CHARACTERS.length, 7);
  const ids = HERO_CHARACTERS.map((h) => h.id);
  for (const requiredId of [
    'steve_harrington',
    'iron_man_classic',
    'iron_man_advanced',
    'hulkbuster',
    'batman',
    'spider_man',
    'superman',
  ] as const) {
    assert.ok(ids.includes(requiredId), `Missing required hero ${requiredId}`);
  }

  const totalOutfits = HERO_CHARACTERS.reduce((sum, h) => sum + h.outfits.length, 0);
  assert.equal(totalOutfits, 15);

  // Every hero has non-uniform balanced stats within [1, 100], valid reference portrait, and >= 2 switchable variations
  for (const h of HERO_CHARACTERS) {
    const vals = Object.values(h.stats);
    assert.ok(vals.every((v) => v >= 1 && v <= 100));
    assert.ok(h.referenceImage.startsWith('/assets/aistudio/'));
    assert.ok(h.outfits.length >= 2, `Hero ${h.id} must have at least 2 switchable suit variations`);
    assert.ok(h.abilities.length >= 4);
  }

  // Steve Harrington toggles between Grey Jacket & Scoops Ahoy
  const steve = getHeroById('steve_harrington');
  assert.equal(steve.outfits.length, 2);
  const steveFirst = getHeroOutfitById('steve_harrington', steve.defaultOutfitId);
  const steveSecond = cycleHeroOutfit('steve_harrington', steveFirst.id);
  assert.equal(steveFirst.id, 'steve_grey_jacket');
  assert.equal(steveSecond.id, 'steve_scoops_ahoy');
  assert.equal(cycleHeroOutfit('steve_harrington', steveSecond.id).id, 'steve_grey_jacket');

  // Spider-Man cycles through Classic -> Remastered Advanced -> Iron Spider -> Classic
  const spidey = getHeroById('spider_man');
  assert.equal(spidey.outfits.length, 3);
  assert.equal(spidey.mobility.canWebSwing, true);
  assert.equal(spidey.mobility.hasIronSpiderArms, true);
  const s1 = cycleHeroOutfit('spider_man', 'spider_classic');
  const s2 = cycleHeroOutfit('spider_man', s1.id);
  const s3 = cycleHeroOutfit('spider_man', s2.id);
  assert.equal(s1.id, 'spider_advanced');
  assert.equal(s2.id, 'spider_iron');
  assert.equal(s3.id, 'spider_classic');

  // Hulkbuster towers over standard heroes & Iron Man suits fly with helmet toggle
  const hb = getHeroById('hulkbuster');
  const mk85 = getHeroById('iron_man_classic');
  const batman = getHeroById('batman');
  assert.ok(hb.mobility.scaleMultiplier > 1.4 && hb.mobility.heavyFootsteps);
  assert.ok(mk85.mobility.canFly && mk85.mobility.hasHelmetToggle);
  assert.ok(batman.mobility.canCapeGlide && batman.mobility.hasBatmobileLink);

  const initRuntime = createInitialHeroRuntimeState();
  assert.equal(initRuntime.activeHeroId, null);
  assert.equal(initRuntime.isFlying, false);
});

test('Armoured Batmobile accelerates with jet afterburner, steers, rams, exits safely, and repairs', () => {
  let bat: BatmobileState = {
    ...createInitialBatmobileState(),
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
    inVault: false,
  };
  assert.equal(bat.integrity, 100);
  const startX = bat.x;
  const startZ = bat.z;

  // Accelerate with Jet Afterburner + slight right steer
  for (let i = 0; i < 120; i++) {
    const res = stepBatmobileState(bat, 1, 0.35, true, false, 0.05);
    bat = res.state;
  }
  const dist = Math.hypot(bat.x - startX, bat.z - startZ);
  assert.ok(dist > 45, `Expected Batmobile to surge forward with jet boost, moved ${dist.toFixed(1)}m`);
  const maxBoostKmh = Math.round(BATMOBILE_MAX_SPEED * 3.6);
  assert.ok(
    bat.speedKmh > 120 && bat.speedKmh <= maxBoostKmh + 2,
    `Expected high jet-boost speed > 120 km/h, got ${bat.speedKmh} km/h`
  );
  assert.equal(bat.boostActive, true);
  assert.ok(Math.abs(bat.steerAngle) > 0.05);

  // Handbrake decelerates cleanly
  for (let i = 0; i < 60; i++) {
    bat = stepBatmobileState(bat, 0, 0, false, true, 0.05).state;
  }
  assert.ok(bat.speedKmh < 15, `Expected handbrake to stop Batmobile, got ${bat.speedKmh} km/h`);

  const exit = getBatmobileExitPosition(bat);
  assert.ok(Math.hypot(exit.x - bat.x, exit.z - bat.z) >= 2.2);

  bat.integrity = 64;
  bat = repairBatmobile(bat);
  assert.equal(bat.integrity, 100);
});

test('Metro City is completely removed from open-world regions & locations while open-sky Spider-Man web-swinging still works anywhere', () => {
  // Confirm Metro City is completely removed from regions & location labels
  assert.notEqual(getRegionAt(METRO_CITY_CENTER.x, METRO_CITY_CENTER.z), 'metro_city' as string);
  assert.equal(
    LOCATIONS.some((l) => (l.id as string) === 'metro_city'),
    false,
    'Metro City must not appear in world LOCATIONS'
  );

  // Open-sky Spider-Man Web-Swinging works cleanly with empty building anchors anywhere across the world
  const emptyMetro = {
    ...createInitialMetroDestructionState(),
    buildings: [],
    props: [],
  };
  const anchor = findBestWebOrGrappleAnchor(emptyMetro, 0, 8, 0, Math.PI);
  assert.equal(anchor.buildingId, null, 'Open-sky web-swinging uses high aerial anchor without city buildings');
  assert.ok(anchor.y >= 24, 'Aerial web anchor should sit high above the hero');

  let swing = startWebSwing(emptyMetro, 0, 10, 0, Math.PI, 0, -12, 1);
  let sx = 0;
  let sy = 10;
  let sz = 0;
  for (let i = 0; i < 20; i++) {
    const res = stepWebSwingPhysics(swing, sx, sy, sz, 1, 0, 0, false, 0.05);
    swing = res.swing;
    sx = res.x;
    sy = res.y;
    sz = res.z;
  }
  assert.ok(Math.hypot(sx, sz) > 8, 'Web swing should carry hero forward cleanly across the open world');
});

test('Wearable Suit Wardrobe enumerates all 15 hero suit skins and filters accurately by category and active character', () => {
  const allSuits = getAllWearableSuits();
  assert.equal(allSuits.length, 15, `Expected 15 total wearable hero suits, got ${allSuits.length}`);

  const uniqueOutfitIds = new Set(allSuits.map((s) => s.outfit.id));
  assert.equal(uniqueOutfitIds.size, 15, 'Every wearable suit must have a unique outfit ID');

  const spideyOnly = filterWearableSuits('current_hero', 'spider_man');
  assert.equal(spideyOnly.length, 3, 'Spider-Man should filter to all 3 wearable suits');
  assert.ok(spideyOnly.some((s) => s.outfit.id === 'spider_iron'));

  const steveOnly = filterWearableSuits('current_hero', 'steve_harrington');
  assert.equal(steveOnly.length, 2, 'Steve Harrington should filter to Grey Jacket and Scoops Ahoy');

  const ironClassicOnly = filterWearableSuits('current_hero', 'iron_man_classic');
  assert.equal(ironClassicOnly.length, 2, 'Iron Man Classic should filter to Mark 85 and Mark 42 Gold');

  const armourSuits = filterWearableSuits('armour', 'iron_man_classic');
  assert.equal(armourSuits.length, 8, 'Powered Armour filter should include all 8 armoured suits');
  assert.ok(armourSuits.every((s) => s.category === 'armour'));

  const streetSuits = filterWearableSuits('street_stealth', 'iron_man_classic');
  assert.equal(streetSuits.length, 7, 'Street & Stealth filter should include remaining 7 wearable suits');
  assert.equal(armourSuits.length + streetSuits.length, allSuits.length);
});

test('Underground Metro Line M1 provides 2 surface entrances (Central <-> Airport), 2-level subterranean walkability, and live subway train cycle', () => {
  assert.equal(METRO_SURFACE_ENTRANCES.length, 2);
  const stationIds = METRO_SURFACE_ENTRANCES.map((s) => s.id);
  assert.deepEqual(stationIds, ['metro_central', 'metro_airport']);

  // Lower platform (-18m), central escalator ramp (sloping cleanly), and upper mezzanine (-13.2m)
  assert.equal(getUndergroundMetroFloorY(0, 0), METRO_FLOOR_Y);
  const rampMidY = getUndergroundMetroFloorY(0, 7.8);
  assert.ok(
    rampMidY > METRO_FLOOR_Y && rampMidY < METRO_MEZZANINE_Y,
    `Escalator ramp midpoint should slope smoothly between platform and mezzanine, got ${rampMidY}`
  );
  assert.equal(getUndergroundMetroFloorY(0, 14), METRO_MEZZANINE_Y);

  // Track trench (z=-9) is fenced off from walking
  const clamped = clampUndergroundMetroPosition(0, -9, 0, -4);
  assert.equal(clamped.collided, true);
  assert.ok(clamped.z >= -5.6, `Player must not fall into underground subway track trench, got z=${clamped.z}`);

  // Live Subway Train approaches, stops with sliding doors open, departs into tunnel, and returns
  let subway = createInitialSubwayTrainState();
  let sawStopped = false;
  let sawDoorsOpen = false;
  let sawDeparting = false;
  for (let i = 0; i < 400; i++) {
    subway = stepSubwayTrainState(subway, 0.05);
    if (subway.phase === 'stopped') sawStopped = true;
    if (subway.doorOpen > 0.7) sawDoorsOpen = true;
    if (subway.phase === 'departing') sawDeparting = true;
  }
  assert.equal(sawStopped, true, 'Subway train must stop at underground platform');
  assert.equal(sawDoorsOpen, true, 'Subway train doors must slide open while stopped');
  assert.equal(sawDeparting, true, 'Subway train must depart into the tunnel after dwell');
});

test('Dreamline International Airport sits on flat NE tarmac and DL-787 Dreamliner takes off, climbs, retracts gear, and lands', () => {
  assert.equal(isInsideAirport(AIRPORT_CENTER.x, AIRPORT_CENTER.z), true);
  assert.equal(getRegionAt(AIRPORT_CENTER.x, AIRPORT_CENTER.z), 'airport');
  assert.equal(getLocationAt(AIRPORT_SPAWN.x, AIRPORT_SPAWN.z).id, 'dreamline_airport');

  const runwayY = groundHeightAt(
    (AIRPORT_RUNWAY_BOUNDS.minX + AIRPORT_RUNWAY_BOUNDS.maxX) * 0.5,
    AIRPORT_RUNWAY_BOUNDS.centerZ
  );
  assert.ok(
    Math.abs(runwayY - AIRPORT_GROUND_Y) < 0.05,
    `Airport runway should be flat at y=${AIRPORT_GROUND_Y}, got ${runwayY}`
  );

  // Accelerate down Runway 09 with afterburner & climb into the sky
  let jet = createInitialAirlinerState();
  assert.equal(jet.onGround, true);
  assert.equal(jet.landingGearDown, true);

  for (let i = 0; i < 120; i++) {
    jet = stepAirlinerState(jet, 1, 0, i > 45, false, true, 0.05, groundHeightAt);
  }
  assert.equal(jet.onGround, false, 'DL-787 Dreamliner should lift off cleanly at takeoff speed');
  assert.ok(jet.altitudeM > 15, `Expected DL-787 climb altitude > 15m, got ${jet.altitudeM}m`);
  assert.ok(jet.speedKmh > 140, `Expected high jet cruise speed > 140 km/h, got ${jet.speedKmh} km/h`);
  assert.equal(jet.landingGearDown, false, 'Landing gear should retract cleanly once airborne above climb threshold');
});

test('En Illam 3rd Floor Hero Hall (y=7.0m) preserves continuous Rooftop Helipad (y=10.4m), Parachute glides anywhere, and Hero HQ stands at intersection', () => {
  // En Illam 3rd Floor Hero Character-Switching Hall sits at y=7.0m
  const heroHallY = walkableHeightWithFloor(HOME_CENTER.x, HOME_CENTER.z, 7.0);
  assert.ok(
    Math.abs(heroHallY - 7.0) < 0.15,
    `Expected En Illam 3rd Floor Hero Hall deck at y=7.0m, got ${heroHallY}`
  );
  // Rooftop Helipad remains continuously walkable above at y=10.4m
  const helipadY = walkableHeightWithFloor(HOME_CENTER.x, HOME_CENTER.z, 10.4);
  assert.ok(
    Math.abs(helipadY - 10.4) < 0.15,
    `Expected En Illam Rooftop Helipad deck preserved at y=10.4m, got ${helipadY}`
  );

  // Parachute glide descends smoothly from Airport Parachute Test Tower outside Metro City and lands gently
  let chute = { ...createInitialParachuteState(), active: true };
  let px: number = PARACHUTE_TOWER_POS.x;
  let py: number = PARACHUTE_TOWER_POS.deckY;
  let pz: number = PARACHUTE_TOWER_POS.z;
  let landed = false;
  for (let i = 0; i < 220; i++) {
    const res = stepParachuteGlide(chute, px, py, pz, 1, 0.25, 0, AIRPORT_GROUND_Y, 0.05);
    px = res.x;
    py = res.y;
    pz = res.z;
    chute = res.state;
    if (res.landed) {
      landed = true;
      break;
    }
  }
  assert.equal(landed, true, 'Parachute must glide smoothly down from Airport Test Tower and land safely');
  assert.equal(chute.active, false, 'Parachute must auto-fold cleanly on touchdown');
  assert.ok(
    Math.hypot(px - PARACHUTE_TOWER_POS.x, pz - PARACHUTE_TOWER_POS.z) > 25,
    'Parachute glide should carry the player horizontally across the airfield'
  );

  // Hero Command HQ stands at the Superheroes Intersection with solid structural collider
  const hqCol = getHeroHqCollider();
  assert.ok(
    HERO_HQ_INTERSECTION_POS.x > hqCol.minX && HERO_HQ_INTERSECTION_POS.x < hqCol.maxX &&
    HERO_HQ_INTERSECTION_POS.z > hqCol.minZ && HERO_HQ_INTERSECTION_POS.z < hqCol.maxZ
  );
});

test('WeatherEffectsOverlay resolves all weather types, adapts seasonally, and wraps 2D particles cleanly across ticks', () => {
  const springBreeze = resolveWeatherOverlayConfig('breeze', 'spring', 'sunset');
  assert.equal(springBreeze.kind, 'sakura_petals');
  assert.ok(springBreeze.count >= 40);

  const autumnBreeze = resolveWeatherOverlayConfig('breeze', 'autumn', 'golden');
  assert.equal(autumnBreeze.kind, 'autumn_leaves');

  const gentleRain = resolveWeatherOverlayConfig('rain', 'spring', 'afternoon');
  assert.equal(gentleRain.kind, 'rain_streaks');
  assert.equal(gentleRain.splashEnabled, true);

  const ferocious = resolveWeatherOverlayConfig('ferocious_rain', 'spring', 'night');
  assert.equal(ferocious.kind, 'storm_rain');
  assert.ok(ferocious.count > gentleRain.count, 'Ferocious rain should spawn denser streaks than gentle rain');
  assert.ok(ferocious.fallVyMax > gentleRain.fallVyMax);
  assert.ok(ferocious.lightningRate > 0);

  const snow = resolveWeatherOverlayConfig('snow', 'winter', 'night');
  assert.equal(snow.kind, 'snowflakes');
  assert.ok(snow.count >= 70);

  const fog = resolveWeatherOverlayConfig('fog', 'autumn', 'morning');
  assert.equal(fog.kind, 'fog_wisps');

  const clearSpring = resolveWeatherOverlayConfig('clear', 'spring', 'sunset');
  assert.equal(clearSpring.kind, 'sakura_petals');
  assert.ok(clearSpring.count < springBreeze.count, 'Clear sky petals should stay subtler than breeze');

  // Step seeded particles for 4 seconds and verify finite, wrapped viewport coordinates & movement
  const width = 1440;
  const height = 900;
  const rainParticles = createWeatherOverlayParticles(gentleRain, width, height);
  assert.equal(rainParticles.length, gentleRain.count);
  const initialY0 = rainParticles[0].y;
  for (let i = 0; i < 80; i++) {
    stepWeatherOverlayParticles(rainParticles, gentleRain, width, height, 0.05, i * 0.05);
  }
  assert.notEqual(rainParticles[0].y, initialY0, 'Rain particles must move across frames');
  for (const p of rainParticles) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.x >= -60 && p.x <= width + 60, `Particle x out of wrap bounds: ${p.x}`);
    assert.ok(p.y >= -60 && p.y <= height + 60, `Particle y out of wrap bounds: ${p.y}`);
  }

  // Vignette profile intensifies during stormy & snowy weather and adds icy frost rim for snow
  const clearVignette = resolveWeatherVignetteProfile('clear', 'spring', 'afternoon');
  const rainVignette = resolveWeatherVignetteProfile('rain', 'spring', 'afternoon');
  const heavyRainVignette = resolveWeatherVignetteProfile('heavy_rain', 'spring', 'afternoon');
  const thunderVignette = resolveWeatherVignetteProfile('thunderstorm', 'spring', 'afternoon');
  const ferociousVignette = resolveWeatherVignetteProfile('ferocious_rain', 'spring', 'night');
  const snowVignette = resolveWeatherVignetteProfile('snow', 'winter', 'afternoon');

  assert.equal(clearVignette.tone, 'calm');
  assert.equal(rainVignette.tone, 'rain');
  assert.equal(heavyRainVignette.tone, 'storm');
  assert.equal(thunderVignette.tone, 'deluge');
  assert.equal(ferociousVignette.tone, 'deluge');
  assert.equal(ferociousVignette.nightDeepened, true);
  assert.equal(snowVignette.tone, 'snow');
  assert.equal(snowVignette.frostRim, true);
  assert.equal(thunderVignette.frostRim, false);

  assert.ok(
    rainVignette.intensity > clearVignette.intensity &&
      heavyRainVignette.intensity > rainVignette.intensity &&
      thunderVignette.intensity > heavyRainVignette.intensity &&
      ferociousVignette.intensity >= thunderVignette.intensity,
    'Vignette intensity must escalate monotonically from clear -> rain -> storm -> deluge'
  );
  assert.ok(
    snowVignette.intensity > clearVignette.intensity + 0.4,
    'Snow vignette should substantially intensify over clear sky'
  );
});

test('Night mode maintains a deep starry night sky while lighting up both world night lamps and train lights at full warmth', () => {
  assert.equal(computeNightBlackoutFactor(13.0), 0);
  assert.equal(computeNightBlackoutFactor(17.75), 0);
  assert.equal(computeNightBlackoutFactor(22.0), 1);
  assert.equal(computeNightBlackoutFactor(1.5), 1);

  const nightClear = computeSkyPalette(TIME_PRESET_HOURS.night, 'clear', 'spring');
  const nightWinterSnow = computeSkyPalette(TIME_PRESET_HOURS.night, 'snow', 'winter');
  const sunsetClear = computeSkyPalette(TIME_PRESET_HOURS.sunset, 'clear', 'spring');
  const middayClear = computeSkyPalette(TIME_PRESET_HOURS.afternoon, 'clear', 'spring');

  // At full night, sky stays genuinely dark & starry with calm, non-overbright world lamps and warm train lights
  assert.equal(nightClear.nightDarkness, 1);
  assert.ok(nightClear.hemiIntensity <= 0.12, `Expected calm dark night hemiIntensity <= 0.12, got ${nightClear.hemiIntensity}`);
  assert.ok(nightClear.sunIntensity <= 0.08, `Expected subtle moonlight sunIntensity <= 0.08, got ${nightClear.sunIntensity}`);
  assert.ok(nightClear.environmentIntensity <= 0.06, `Expected low night environmentIntensity <= 0.06, got ${nightClear.environmentIntensity}`);
  assert.ok(nightClear.starOpacity > 0.9, 'Stars should shine vividly at night');
  assert.ok(
    nightClear.worldLanternStrength >= 0.4 && nightClear.worldLanternStrength <= 0.65,
    `World lamps must be calm and non-overbright at night, got ${nightClear.worldLanternStrength}`
  );
  assert.ok(nightClear.lanternStrength >= 0.75, 'Train lighting must shine clearly at night');

  // Winter snow at night also keeps world lamps softly illuminated without overbrightness
  assert.equal(nightWinterSnow.nightDarkness, 1);
  assert.ok(nightWinterSnow.worldLanternStrength >= 0.4 && nightWinterSnow.worldLanternStrength <= 0.65);
  assert.ok(nightWinterSnow.lanternStrength >= 0.75);

  // Midday turns world lamps off, while sunset warms them up cleanly
  assert.equal(middayClear.worldLanternStrength, 0);
  assert.equal(sunsetClear.nightDarkness, 0);
  assert.ok(sunsetClear.worldLanternStrength > 0.7);
});

test('Personal player lantern auto-illuminates at night, honors manual toggles, flickers warmly, sways on movement, and stows in enclosed vehicles', () => {
  let state = createInitialPlayerLanternState();
  assert.equal(state.isOn, false);
  assert.equal(state.manualOverride, null);

  // Daytime & Sunset (17:43) -> lantern stays off & hidden until Night falls
  state = stepPlayerLantern(state, {
    dt: 0.1,
    elapsed: 1.0,
    worldLanternStrength: 0.0,
    nightDarkness: 0.0,
    inDarkInterior: false,
    playerSpeed: 0,
    turnRate: 0,
    stowedInVehicle: false,
  });
  assert.equal(state.isOn, false);
  assert.equal(state.effectiveIntensity, 0);

  state = stepPlayerLantern(state, {
    dt: 0.1,
    elapsed: 1.5,
    worldLanternStrength: 0.92,
    nightDarkness: 0.0,
    inDarkInterior: false,
    playerSpeed: 2.0,
    turnRate: 0,
    stowedInVehicle: false,
  });
  assert.equal(state.isOn, false, 'Lantern must stay hidden at Sunset and only auto-appear at Night');
  assert.equal(state.effectiveIntensity, 0);

  // Night falls -> lantern turns on automatically and ramps brightness smoothly
  for (let i = 0; i < 12; i++) {
    state = stepPlayerLantern(state, {
      dt: 0.05,
      elapsed: 2.0 + i * 0.05,
      worldLanternStrength: 1.0,
      nightDarkness: 1.0,
      inDarkInterior: false,
      playerSpeed: 4.5,
      turnRate: 0.9,
      stowedInVehicle: false,
    });
  }
  assert.equal(state.isOn, true, 'Lantern should auto-light at night');
  assert.ok(state.brightness > 0.9, `Expected lantern brightness > 0.9, got ${state.brightness}`);
  assert.ok(state.effectiveIntensity > 8.0, `Expected warm night intensity > 8.0, got ${state.effectiveIntensity}`);
  assert.ok(state.effectiveRange >= 28, `Expected generous night throw >= 28m, got ${state.effectiveRange}`);
  assert.ok(state.flickerFactor > 0.88 && state.flickerFactor < 1.12, 'Flicker should stay natural');
  assert.ok(Math.abs(state.swingAngleX) > 0.01 && Math.abs(state.swingAngleZ) > 0.01, 'Lantern should sway with walking and turning');

  // Manual toggle turns lantern OFF even at night
  state = togglePlayerLantern(state);
  assert.equal(state.isOn, false);
  assert.equal(state.manualOverride, false);
  for (let i = 0; i < 15; i++) {
    state = stepPlayerLantern(state, {
      dt: 0.05,
      elapsed: 4.0 + i * 0.05,
      worldLanternStrength: 1.0,
      nightDarkness: 1.0,
      inDarkInterior: false,
      playerSpeed: 0,
      turnRate: 0,
      stowedInVehicle: false,
    });
  }
  assert.equal(state.isOn, false, 'Manual OFF override must stay OFF at night');
  assert.ok(state.brightness < 0.05, 'Lantern brightness should fade smoothly to 0');

  // Manual toggle turns lantern ON even in broad daylight
  state = togglePlayerLantern(state);
  assert.equal(state.isOn, true);
  assert.equal(state.manualOverride, true);
  for (let i = 0; i < 12; i++) {
    state = stepPlayerLantern(state, {
      dt: 0.05,
      elapsed: 6.0 + i * 0.05,
      worldLanternStrength: 0.0,
      nightDarkness: 0.0,
      inDarkInterior: false,
      playerSpeed: 0,
      turnRate: 0,
      stowedInVehicle: false,
    });
  }
  assert.equal(state.isOn, true);
  assert.ok(state.effectiveIntensity > 5.0, 'Manual lantern ON should still emit warm glow in daytime');

  // Stowing inside enclosed vehicle fades out handheld lantern cleanly without losing user toggle
  for (let i = 0; i < 15; i++) {
    state = stepPlayerLantern(state, {
      dt: 0.05,
      elapsed: 8.0 + i * 0.05,
      worldLanternStrength: 1.0,
      nightDarkness: 1.0,
      inDarkInterior: false,
      playerSpeed: 10,
      turnRate: 0,
      stowedInVehicle: true,
    });
  }
  assert.ok(state.brightness < 0.05, 'Lantern should tuck away inside enclosed vehicle');
  state = setPlayerLanternOverride(state, null);
  assert.equal(state.manualOverride, null);
});

test('Smooth moving-screen camera & locomotion spring-dampers converge monotonically without overshoot across 30/60/144Hz', () => {
  // 1. Frame dt filter rejects huge tab-switch spikes
  const spikeDt = filterFrameDt(0.016, 0.85, false);
  assert.ok(spikeDt < 0.06, `Expected dt spike filtered smoothly, got ${spikeDt}`);

  // 2. Critically damped scalar spring converges to target with zero overshoot across 30Hz and 144Hz
  for (const hz of [30, 60, 144]) {
    const dt = 1 / hz;
    let val = 0;
    let vel = 0;
    let maxVal = 0;
    const steps = Math.round(1.5 * hz);
    for (let i = 0; i < steps; i++) {
      const next = dampScalarSpring(val, 10, vel, 0.14, dt);
      val = next.value;
      vel = next.velocity;
      if (val > maxVal) maxVal = val;
    }
    assert.ok(Math.abs(val - 10) < 0.05, `At ${hz}Hz spring must converge to 10, got ${val}`);
    assert.ok(maxVal <= 10.02, `Critically damped spring must not overshoot at ${hz}Hz, max=${maxVal}`);
  }

  // 3. Angle spring wraps cleanly across ±PI boundary without spinning the long way
  let angle = Math.PI - 0.15;
  let angVel = 0;
  const targetAngle = -Math.PI + 0.15;
  for (let i = 0; i < 40; i++) {
    const next = dampAngleSpring(angle, targetAngle, angVel, 0.1, 1 / 60);
    angle = next.value;
    angVel = next.velocity;
    assert.ok(Math.abs(angle) > 2.5, `Angle spring must cross ±PI directly, wandered to ${angle}`);
  }

  // 4. Decoupled screen orbit responds smoothly with inertia & asymmetric boom pull-in/recovery + flight FOV
  const cam = createInitialSmoothCameraState(0, 0.25, 6.0);
  syncSmoothCameraImmediate(cam, {
    yaw: 0,
    pitch: 0.25,
    distance: 6.0,
    posX: 0,
    posY: 3.0,
    posZ: 6.0,
    lookX: 0,
    lookY: 1.4,
    lookZ: 0,
    anchorX: 0,
    anchorY: 0,
    anchorZ: 0,
    fov: 52,
  });
  applyScreenOrbitInput(cam, 120, -25, 1.0, 1 / 60);
  applyScreenZoomInput(cam, 120);
  const yawBefore = cam.yaw;
  stepSmoothCameraOrbit(cam, {
    dt: 1 / 60,
    isDragging: false,
    autoFollowYaw: null,
    autoFollowStrength: 0,
    minPitch: -0.18,
    maxPitch: 1.05,
  });
  assert.notEqual(cam.yaw, yawBefore, 'Smoothed screen orbit must move cleanly toward pointer target');

  // Wall pull-in snaps fast while open recovery eases gently
  const pullIn = stepSmoothCameraRig(cam, {
    dt: 0.05,
    anchorX: 2,
    anchorY: 0,
    anchorZ: 0,
    velX: 12,
    velY: 0,
    velZ: 0,
    baseDistance: 6.0,
    focusHeight: 1.4,
    desiredBoomScale: 0.4,
    minCamY: 0.6,
    baseFov: 52,
    verticalLift: 0.35,
    isFlying: true,
    isWebSwinging: false,
    isSprinting: true,
    isHero: true,
  });
  assert.ok(cam.boomScale < 0.72, `Boom must pull in rapidly on wall collision, got ${cam.boomScale}`);
  assert.ok(pullIn.fov > 52.0, `Dynamic hero flight FOV should widen smoothly above 52, got ${pullIn.fov}`);

  // 5. Smooth locomotion filters start/stop ramps and smooths visual Y across stairs
  const loco = createInitialSmoothLocomotionState(0, 0);
  syncSmoothLocomotionImmediate(loco, 0, 0, 0, 0);
  const move1 = filterMovementInput(loco, 1, 0, 0.016);
  assert.ok(move1.forward > 0 && move1.forward < 0.7, 'Start ramp must ease smoothly instead of snapping to 1');
  const visStep = stepSmoothLocomotionVisuals(loco, {
    dt: 0.016,
    physX: 1,
    physY: 0.45,
    physZ: 0,
    targetHeading: Math.PI * 0.5,
    hasHeadingTarget: true,
    speed: 6.5,
    verticalVel: 0,
    isAirborne: false,
    isFlying: false,
    isGliding: false,
    isWebSwinging: false,
    isHero: true,
    turnSmoothTime: 0.085,
  });
  assert.ok(visStep.visualY > 0 && visStep.visualY < 0.45, 'Stair step visual Y must glide smoothly without popping');
});

test('Secret Underground House Floor stays hidden until house button is pressed, holds all 7 Hero Costumes, and drives 4 garage cars out to the surface', () => {
  // 1. Starts completely hidden flush beneath En Illam floor
  let vault = createInitialHomeVaultState();
  assert.equal(vault.hatchUnlocked, false);
  assert.equal(vault.hatchOpenProgress, 0);
  assert.equal(vault.inVault, false);
  assert.equal(vault.cars.length, 3);
  assert.equal(VAULT_CAR_SPECS.length, 3);
  assert.equal(VAULT_HERO_PODS.length, HERO_CHARACTERS.length, 'All 7 superhero costumes must be ready to wear in underground pods');

  // Inside En Illam detection works on surface and returns false underground
  assert.equal(isPlayerInsidePersonalHome(HOME_CENTER.x, 0.5, HOME_CENTER.z, false), true);
  assert.equal(isPlayerInsidePersonalHome(HOME_CENTER.x, VAULT_FLOOR_Y, HOME_CENTER.z, true), false);
  assert.equal(isPlayerInsidePersonalHome(120, 0.5, 120, false), false);

  // 2. Clicking the hidden house button opens the sliding floor hatch smoothly from 0 -> 1
  vault = toggleSecretVaultHatch(vault);
  assert.equal(vault.hatchUnlocked, true);
  for (let i = 0; i < 20; i++) {
    vault = stepSecretHatchAnimation(vault, 0.05);
  }
  assert.equal(vault.hatchOpenProgress, 1, 'Secret floor hatch must open fully to 1.0');

  // 3. Tall 22m underground base + 94m East Driving Passage clamps walking/driving cleanly with closed vs open blast gate
  assert.ok(VAULT_HEIGHT >= 22, `Expected much taller secret base >= 22m, got ${VAULT_HEIGHT}m`);
  const clamped = clampVaultPosition(99, -99, 1.4, false);
  assert.equal(clamped.hitWall, true);
  assert.equal(clamped.x, VAULT_HALF_X - 1.4);
  assert.equal(clamped.z, -VAULT_HALF_Z + 1.4);

  // Inside the long East Driving Passage (z=0), closed gate stops vehicles before VAULT_EXIT_GATE_X; opening the gate lets them drive all the way to VAULT_PASSAGE_END_X
  const closedGateClamp = clampVaultPosition(VAULT_EXIT_GATE_X + 5, 0, 1.4, false);
  assert.equal(closedGateClamp.hitWall, true);
  assert.ok(closedGateClamp.x < VAULT_EXIT_GATE_X, 'Closed blast gate must block exiting passage');

  vault = toggleVaultExitGate(vault);
  assert.equal(vault.exitGateOpen, true);
  for (let i = 0; i < 30; i++) {
    vault = stepSecretHatchAnimation(vault, 0.05);
  }
  assert.equal(vault.exitGateProgress, 1, 'Outside blast exit gate must slide fully open to 1.0');
  const openGateClamp = clampVaultPosition(VAULT_EXIT_GATE_X + 5, 0, 1.4, true);
  assert.ok(openGateClamp.x > VAULT_EXIT_GATE_X, 'Open blast gate must allow driving past exit threshold');

  // 4. Driving an underground vault car down the 94m East Passage and straight out the open Blast Gate onto the surface
  let car: VaultCarRuntimeState = {
    ...vault.cars[0],
    x: VAULT_EXIT_TUNNEL_POS.x - 4.0,
    z: VAULT_EXIT_TUNNEL_POS.z,
    heading: Math.PI * 0.5, // Facing +X directly toward East Exit Tunnel
    inVault: true,
  };
  let exitedSurface = false;
  for (let i = 0; i < 50; i++) {
    const res = stepVaultCarState(car, 1, 0, true, false, 0.05, 1.0);
    car = res.state;
    if (res.exitedToSurface) {
      exitedSurface = true;
      break;
    }
  }
  assert.equal(exitedSurface, true, 'Driving a Vault Car through the open East Driving Passage must emerge onto the surface');
  assert.equal(car.inVault, false);
  assert.equal(Math.round(car.x), Math.round(VAULT_SURFACE_DRIVE_EXIT.x));
  assert.equal(Math.round(car.z), Math.round(VAULT_SURFACE_DRIVE_EXIT.z));

  // 5. Batmobile starts parked in Underground Vault Bay 4 and can drive seamlessly out through open East Exit Gate
  let bat = createInitialBatmobileState();
  assert.equal(bat.inVault, true);
  assert.equal(bat.x, VAULT_BATMOBILE_BAY.x);
  assert.equal(bat.y, VAULT_FLOOR_Y);
  assert.equal(isInsideVaultDriveExitTunnel(VAULT_PASSAGE_END_X - 2, 0, 1.0), true);
  assert.equal(isInsideVaultDriveExitTunnel(VAULT_PASSAGE_END_X - 2, 0, 0.0), false);
  bat = {
    ...bat,
    x: VAULT_EXIT_TUNNEL_POS.x - 4.0,
    z: VAULT_EXIT_TUNNEL_POS.z,
    heading: Math.PI * 0.5,
    inVault: true,
  };
  let batExited = false;
  for (let i = 0; i < 50; i++) {
    const res = stepBatmobileState(bat, 1, 0, true, false, 0.05, 1.0);
    bat = res.state;
    if (res.exitedToSurface) {
      batExited = true;
      break;
    }
  }
  assert.equal(batExited, true, 'Driving Batmobile through open East Driving Passage must emerge onto surface driveway');
  assert.equal(bat.inVault, false);
});

test('Simultaneous subway trains climb above the surface AND dive inside the tunnel concurrently', () => {
  let sawAscendingElevated = false;
  let sawAscendingTunnel = false;
  let sawDescendingElevated = false;
  let sawDescendingTunnel = false;
  let sawSimultaneousOppositeSlope = false;

  for (let t = 0; t < 24; t += 0.25) {
    const s = computeSimultaneousSubwayState(t);
    if (s.ascendingTrain.elevation > 4.0) sawAscendingElevated = true;
    if (s.ascendingTrain.elevation < -2.0) sawAscendingTunnel = true;
    if (s.descendingTrain.elevation > 4.0) sawDescendingElevated = true;
    if (s.descendingTrain.elevation < -2.0) sawDescendingTunnel = true;
    if (s.ascendingTrain.pitch > 0.05 && s.descendingTrain.pitch < -0.05) {
      sawSimultaneousOppositeSlope = true;
    }
  }

  assert.equal(sawAscendingElevated, true, 'Ascending subway train must rise above the surface onto the elevated viaduct');
  assert.equal(sawAscendingTunnel, true, 'Ascending subway train must emerge from inside the underground tunnel');
  assert.equal(sawDescendingElevated, true, 'Descending subway train must travel above the surface');
  assert.equal(sawDescendingTunnel, true, 'Descending subway train must dive back inside the underground tunnel');
  assert.equal(
    sawSimultaneousOppositeSlope,
    true,
    'Ascending and descending trains must travel upward and downward simultaneously'
  );
});

test('Submarine cruises ocean & dives underwater, Ocean Superhero Suits Building holds 7 suits, and >1min ocean swim triggers Snowman Jet Ski rescue to Snowman Island', () => {
  // 1. Kadalkarai Submarine Service cruises across open ocean and dives underwater smoothly
  let sub = createInitialSubmarineState();
  assert.equal(isOceanAt(SUBMARINE_DOCK_POS.x, SUBMARINE_DOCK_POS.z), true);
  const startSubX = sub.x;
  const startSubZ = sub.z;
  for (let i = 0; i < 60; i++) {
    sub = stepSubmarineState(
      sub,
      { throttle: 1.0, steer: 0.15, diveDelta: 1.0, boost: true },
      0.05,
      isOceanAt
    );
  }
  assert.ok(Math.hypot(sub.x - startSubX, sub.z - startSubZ) > 12, 'Submarine must cruise forward through ocean');
  assert.ok(sub.depth > 4.0 && sub.depth <= SUBMARINE_MAX_DEPTH, `Submarine must dive smoothly underwater, depth=${sub.depth}`);
  assert.equal(sub.submerged, true);
  assert.ok(sub.speedKmh > 15, `Expected submarine speed > 15 km/h, got ${sub.speedKmh}`);

  // 2. Ocean Superhero Suits Building sits offshore in ocean as dry walkable structure with all 7 hero suit pods
  assert.equal(isInsideOceanHeroTowerLand(OCEAN_HERO_TOWER_CENTER.x, OCEAN_HERO_TOWER_CENTER.z), true);
  assert.equal(isOceanAt(OCEAN_HERO_TOWER_CENTER.x, OCEAN_HERO_TOWER_CENTER.z), false);
  assert.equal(isWaterAt(OCEAN_HERO_TOWER_CENTER.x, OCEAN_HERO_TOWER_CENTER.z), false);
  assert.ok(walkableHeightAt(OCEAN_HERO_TOWER_CENTER.x, OCEAN_HERO_TOWER_CENTER.z) >= 0.8);
  assert.equal(OCEAN_HERO_SUIT_PODS.length, HERO_CHARACTERS.length, 'Ocean Superhero Suits Building must showcase all 7 hero suits');

  // 3. New Snowman Island sits offshore in ocean as dry snowy land
  assert.equal(isInsideSnowmanIsland(SNOWMAN_ISLAND_CENTER.x, SNOWMAN_ISLAND_CENTER.z), true);
  assert.equal(isOceanAt(SNOWMAN_ISLAND_CENTER.x, SNOWMAN_ISLAND_CENTER.z), false);
  assert.equal(isWaterAt(SNOWMAN_ISLAND_CENTER.x, SNOWMAN_ISLAND_CENTER.z), false);
  assert.ok(walkableHeightAt(SNOWMAN_ISLAND_SPAWN.x, SNOWMAN_ISLAND_SPAWN.z) > 0.5);

  // 4. Staying in ocean water > 30 seconds triggers Snowman Jet Ski rescue and moves player directly to Snowman Island
  let rescue = createInitialSnowmanRescueState();
  let playerX = 165;
  let playerZ = 95;
  assert.equal(isOceanAt(playerX, playerZ), true);
  assert.equal(OCEAN_RESCUE_THRESHOLD_SECONDS, 30);

  // 25 seconds in ocean -> still counting, not triggered yet
  for (let i = 0; i < 250; i++) {
    const r = stepOceanSnowmanRescue(rescue, { dt: 0.1, inOceanWater: true, playerX, playerZ });
    rescue = r.state;
  }
  assert.equal(rescue.phase, 'idle', 'Rescue must not trigger before 30 seconds');
  assert.ok(rescue.oceanSwimSeconds >= 24.5 && rescue.oceanSwimSeconds < 30);

  // Past 30 seconds -> Snowman Jet Ski dispatches, picks up player, and drops them safely on Snowman Island!
  let sawApproaching = false;
  let sawTransporting = false;
  let delivered = false;
  for (let i = 0; i < 600; i++) {
    const r = stepOceanSnowmanRescue(rescue, { dt: 0.1, inOceanWater: true, playerX, playerZ });
    rescue = r.state;
    if (r.overridePlayerPos) {
      playerX = r.overridePlayerPos.x;
      playerZ = r.overridePlayerPos.z;
    }
    if (rescue.phase === 'approaching') sawApproaching = true;
    if (rescue.phase === 'transporting') sawTransporting = true;
    if (r.justArrivedAtIsland) {
      delivered = true;
      break;
    }
  }
  assert.equal(sawApproaching, true, 'Snowman on Jet Ski must approach player after >30 seconds in ocean water');
  assert.equal(sawTransporting, true, 'Snowman on Jet Ski must pick up player and ride to Snowman Island');
  assert.equal(delivered, true, 'Snowman Jet Ski must deliver player onto the new Snowman Island');
  assert.equal(isInsideSnowmanIsland(playerX, playerZ), true, 'Delivered player must stand safely on Snowman Island');
});

test('Flagship Expedition Vehicles: 4x4 Safari Jeep, Gold/Wood VTOL, Sport & Pro Jet Skis, and 7 Camera Perspectives', () => {
  // 1. Safari Jeep surface physics & 4WD suspension
  const asphaltGrip = getSurfacePhysicsParams('asphalt');
  const mudGrip = getSurfacePhysicsParams('mud');
  assert.ok(asphaltGrip.maxSpeed > mudGrip.maxSpeed, 'Asphalt must permit higher top speed than mud');
  assert.ok(mudGrip.mudFactor > 0.5, 'Mud surface must emit strong mud splash');
  assert.equal(getTerrainSurfaceAt(0, 15, 'clear'), 'asphalt');

  const jeep = createInitialSafariJeepState();
  const jeepStartX = jeep.x;
  const jeepStartZ = jeep.z;
  for (let i = 0; i < 60; i++) {
    stepSafariJeep(
      jeep,
      { forward: 1, turn: 0.25, ascend: false, descend: false, brake: false, boost: true },
      0.05,
      'clear',
      true
    );
  }
  assert.ok(Math.hypot(jeep.x - jeepStartX, jeep.z - jeepStartZ) > 10, 'Safari Jeep must accelerate strongly in 4WD');
  assert.ok(jeep.speedKmh > 25, `Expected Safari Jeep > 25 km/h, got ${jeep.speedKmh}`);
  assert.ok(jeep.gear !== 'N' && jeep.gear !== 'R', `Expected forward gear, got ${jeep.gear}`);
  assert.ok(jeep.rpm > 1200, `Expected revving diesel RPM > 1200, got ${jeep.rpm}`);

  // 2. Advanced Gold/Wood VTOL vertical hover takeoff + forward cruise nacelle tilt transition
  const vtol = createInitialVtolAircraftState();
  assert.equal(vtol.onGround, true);
  for (let i = 0; i < 50; i++) {
    stepVtolAircraft(
      vtol,
      { forward: 0, turn: 0, ascend: true, descend: false, brake: false, boost: false },
      0.05,
      i * 0.05,
      'clear',
      true
    );
  }
  assert.equal(vtol.onGround, false, 'VTOL must lift off vertically');
  assert.ok(vtol.aglM > 6, `Expected VTOL hover climb > 6m AGL, got ${vtol.aglM}`);
  assert.ok(vtol.nacelleTilt < 0.25, 'VTOL hover mode must keep ducted fans near vertical');

  // Switch to forward cruise -> nacelles tilt toward 1.0 and forward speed builds
  vtol.hoverMode = false;
  for (let i = 0; i < 80; i++) {
    stepVtolAircraft(
      vtol,
      { forward: 1, turn: 0.1, ascend: false, descend: false, brake: false, boost: true },
      0.05,
      2.5 + i * 0.05,
      'breeze',
      true
    );
  }
  assert.ok(vtol.nacelleTilt > 0.7, `Expected tilted cruise nacelles > 0.7, got ${vtol.nacelleTilt}`);
  assert.ok(vtol.speedKmh > 60, `Expected VTOL cruise speed > 60 km/h, got ${vtol.speedKmh}`);

  // 3. Sport Yellow & Pro Green Jet Skis Gerstner wave buoyancy & carving lean
  const calmWave = sampleWaterWaveHeight(43, -15.5, 1.2, 'clear');
  const stormWave = sampleWaterWaveHeight(140, 60, 1.2, 'thunderstorm');
  assert.ok(Number.isFinite(calmWave.y) && Number.isFinite(stormWave.y));
  assert.ok(stormWave.roughness > calmWave.roughness, 'Storm waves must be rougher than calm lake waves');

  const sportSki = createInitialJetSkiState('sport_yellow');
  const perfSki = createInitialJetSkiState('perf_green');
  assert.equal(sportSki.model, 'sport_yellow');
  assert.equal(perfSki.model, 'perf_green');
  for (let i = 0; i < 35; i++) {
    stepJetSki(
      sportSki,
      { forward: 1, turn: 0.85, ascend: false, descend: false, brake: false, boost: false },
      0.05,
      i * 0.05,
      'clear',
      true
    );
    stepJetSki(
      perfSki,
      { forward: 1, turn: -0.45, ascend: false, descend: false, brake: false, boost: true },
      0.05,
      i * 0.05,
      'breeze',
      true
    );
  }
  assert.ok(sportSki.speedKmh > 25, `Sport Jet Ski must plane cleanly, got ${sportSki.speedKmh} km/h`);
  assert.ok(perfSki.speedKmh > sportSki.speedKmh, 'Boosted Pro Jet Ski must exceed Sport cruise speed');
  assert.ok(Math.abs(sportSki.leanRoll) > 0.05, 'Jet Ski must carve/lean into turns');
  assert.ok(perfSki.sprayIntensity > 0.3, 'High-speed Jet Ski must kick up spray');

  // 4. All 7 camera perspectives cycle cleanly back to chase
  assert.equal(CAMERA_PERSPECTIVES.length, 7);
  let cam = CAMERA_PERSPECTIVES[0].id;
  const visited = new Set<string>();
  for (let i = 0; i < CAMERA_PERSPECTIVES.length; i++) {
    visited.add(cam);
    cam = cycleCameraPerspective(cam);
  }
  assert.equal(visited.size, CAMERA_PERSPECTIVES.length);
  assert.equal(cam, CAMERA_PERSPECTIVES[0].id);
});

test('Separate Panimalai Wildlife Forest Sanctuary (21 species, zero snakes, off railway) with independent AI, vehicle avoidance & viewfinder photography', () => {
  assert.equal(WILDLIFE_SPECIES_CATALOG.length, 21, 'Must include all 21 wildlife species (zero snakes)');
  assert.equal(
    WILDLIFE_SPECIES_CATALOG.some((s) => (s.id as string) === 'snake' || s.name.toLowerCase().includes('python') || s.name.toLowerCase().includes('snake')),
    false,
    'Snakes must be completely removed from the wildlife catalog'
  );
  const mammals = WILDLIFE_SPECIES_CATALOG.filter((s) => s.category === 'mammal');
  const birds = WILDLIFE_SPECIES_CATALOG.filter((s) => s.category === 'bird');
  const reptiles = WILDLIFE_SPECIES_CATALOG.filter((s) => s.category === 'reptile_amphibian');
  assert.equal(mammals.length, 10, 'Must include 10 mammal species');
  assert.equal(birds.length, 8, 'Must include 8 bird species');
  assert.equal(reptiles.length, 3, 'Must include 3 reptile/amphibian species (zero snakes)');

  const actors = createInitialWildlifeEcosystem();
  assert.ok(actors.length >= 45, `Expected living multi-individual ecosystem >= 45 animals, got ${actors.length}`);
  assert.equal(
    actors.some((a) => (a.speciesId as string) === 'snake'),
    false,
    'Zero snake actors may exist in the world'
  );
  for (const a of actors) {
    const distSanctuary = Math.hypot(
      a.x - WILDLIFE_FOREST_SANCTUARY_CENTER.x,
      a.z - WILDLIFE_FOREST_SANCTUARY_CENTER.z
    );
    assert.ok(
      distSanctuary < 65,
      `Wildlife ${a.speciesId} must stay in separated Panimalai Wildlife Forest Sanctuary, dist=${distSanctuary.toFixed(1)}m`
    );
    assert.ok(
      distanceToRail(a.x, a.z) > 12,
      `Wildlife ${a.speciesId} must stay clear of railway tracks, railDist=${distanceToRail(a.x, a.z).toFixed(1)}m`
    );
  }

  // Verify animals advance independent gait/breathing & flee when a fast vehicle approaches
  const prey = actors.find((a) => a.speciesId === 'sambar_deer');
  assert.ok(prey, 'Sambar deer must exist in ecosystem');
  const startPreyX = prey.x;
  const startPreyZ = prey.z;

  for (let i = 0; i < 40; i++) {
    stepWildlifeEcosystem(
      actors,
      0.05,
      i * 0.05,
      14,
      startPreyX + 4,
      startPreyZ + 4,
      true,
      45
    );
  }
  const movedDist = Math.hypot(prey.x - startPreyX, prey.z - startPreyZ);
  assert.ok(movedDist > 2.5, `Prey must actively flee approaching vehicle, moved=${movedDist}m`);
  assert.ok(
    prey.behavior === 'fleeing_vehicle' || movedDist > 4.0,
    `Expected fleeing_vehicle reaction, got ${prey.behavior}`
  );

  // Viewfinder lock detects an animal cleanly in front of the observer
  const elephant = actors.find((a) => a.speciesId === 'elephant');
  assert.ok(elephant);
  const camX = elephant.x - 4.5;
  const camZ = elephant.z;
  const lookAngle = Math.atan2(elephant.x - camX, elephant.z - camZ);
  const locked = findWildlifeInViewfinder(actors, camX, camZ, lookAngle, 45);
  assert.ok(locked, 'Wildlife viewfinder must lock onto animal in line of sight');
  assert.equal(locked.speciesId, 'elephant');
});

test('Snowman Multi-Transport Taxi (zero ships, exact coords, Cycle <-> JetSki morph), Ultra Graphics & Hero Power Options', () => {
  // Zero ships in Snowman Taxi transport options
  assert.equal(
    SNOWMAN_TRANSPORTS.some(
      (t) => t.id.includes('ship') || t.name.toLowerCase().includes('ship')
    ),
    false,
    'Snowman Taxi must never include ships'
  );
  assert.ok(LAND_TRANSPORT_OPTIONS.includes('cycle_jetski'));
  assert.ok(WATER_TRANSPORT_OPTIONS.includes('cycle_jetski'));

  let taxi = createInitialSnowmanTaxiState();
  taxi = dispatchSnowmanTaxi(taxi, {
    playerX: 10,
    playerZ: 15,
    targetX: 145.5,
    targetZ: 62.25,
    landTransport: 'cycle_jetski',
    waterTransport: 'cycle_jetski',
    instantExpress: false,
  });
  assert.equal(taxi.phase, 'approaching');
  assert.equal(taxi.targetX, 145.5);
  assert.equal(taxi.targetZ, 62.3);

  // Instant Cycle <-> JetSki morph toggles form cleanly
  const beforeForm = taxi.cycleMorphedToJetSki;
  taxi = triggerInstantCycleJetSkiMorph(taxi);
  assert.notEqual(taxi.cycleMorphedToJetSki, beforeForm);

  // Step Snowman Taxi to pick up player and deliver to exact coordinates
  let delivered = false;
  let px = 10;
  let pz = 15;
  for (let i = 0; i < 600; i++) {
    const res = stepSnowmanTaxi(taxi, { dt: 0.1, playerX: px, playerZ: pz });
    taxi = res.state;
    if (res.overridePlayerPos) {
      px = res.overridePlayerPos.x;
      pz = res.overridePlayerPos.z;
    }
    if (res.justArrived) {
      delivered = true;
      break;
    }
  }
  assert.equal(delivered, true, 'Snowman Taxi must deliver player to exact target coordinates');
  assert.ok(Math.hypot(taxi.x - 145.5, taxi.z - 62.25) < 1.5);

  // Ultra Graphics quality profile enables peak fidelity on hardware GPU
  const ultraProfile = resolveGraphicsProfile({
    quality: 'ultra',
    resolutionScale: 1.0,
    devicePixelRatio: 2,
    isSoftwareGl: false,
    dynamicDprScale: 1.0,
  });
  const lowProfile = resolveGraphicsProfile({
    quality: 'low',
    resolutionScale: 1.0,
    devicePixelRatio: 2,
    isSoftwareGl: false,
    dynamicDprScale: 1.0,
  });
  assert.ok(ultraProfile.shadowMapSize >= 2048);
  assert.ok(ultraProfile.bloomEnabled);
  assert.ok(ultraProfile.pixelRatio > lowProfile.pixelRatio);

  // Spider-Man has multiple selectable superpower options for mobile-vertical HUD
  const spiderPowers = getHeroPowerOptions('spider_man');
  assert.ok(spiderPowers.length >= 3, `Expected >= 3 Spider-Man power options, got ${spiderPowers.length}`);
});

test('Immersive Underwater Ocean, Calm Morning/Night Exposure, Twin Helipad Pad B, Combined Surface/Skyway/Subway Train & Easy Driver Notches, and Instant Lantern Toggle', () => {
  // 1. Deep undulating ocean seabed & Beer-Lambert underwater atmosphere + 79 marine creatures
  const deepSeabedY = groundHeightAt(210, 118);
  assert.ok(deepSeabedY < -13.0, `Expected deep ocean seabed < -13m, got ${deepSeabedY}`);

  const surfaceAtmo = computeUnderwaterAtmosphere(WATER_LEVEL + 1.0, true, 0);
  const shallowAtmo = computeUnderwaterAtmosphere(WATER_LEVEL - 3.0, true, 0);
  const deepAtmo = computeUnderwaterAtmosphere(WATER_LEVEL - 12.0, true, 0);
  assert.equal(surfaceAtmo.submerged, false);
  assert.equal(shallowAtmo.submerged, true);
  assert.equal(deepAtmo.submerged, true);
  assert.ok(deepAtmo.sunIntensityScale < shallowAtmo.sunIntensityScale, 'Beer-Lambert absorption must dim deeper water');
  assert.ok(deepAtmo.fogDensity > shallowAtmo.fogDensity, 'Deeper ocean water must have denser fog');

  const marineActors = createMarineLifeActors();
  assert.equal(marineActors.length, 79, 'Expected 79 living marine animals across reefs & trench');
  const firstFishX = marineActors[0].x;
  for (let i = 0; i < 20; i++) {
    stepMarineLifeActors(marineActors, 0.05, i * 0.05, 136, -4, 66, true);
  }
  assert.notEqual(marineActors[0].x, firstFishX, 'Marine life actors must swim smoothly');

  // 2. Calm non-overbright Morning & Night palettes and subdued graphics exposure/bloom
  const morning = computeSkyPalette(TIME_PRESET_HOURS.morning, 'clear', 'spring');
  assert.ok(morning.sunIntensity <= 0.95, `Morning sunIntensity must not overbrighten, got ${morning.sunIntensity}`);
  assert.ok(morning.environmentIntensity <= 0.26, `Morning IBL must stay calm, got ${morning.environmentIntensity}`);
  const highGfx = resolveGraphicsProfile({
    quality: 'high',
    resolutionScale: 1.0,
    devicePixelRatio: 2,
    isSoftwareGl: false,
    dynamicDprScale: 1.0,
  });
  assert.ok(highGfx.toneMappingExposureBase <= 0.84, `Global exposure must stay calm, got ${highGfx.toneMappingExposureBase}`);
  assert.ok(highGfx.bloomNightStrength <= 0.16, `Night bloom must stay gentle, got ${highGfx.bloomNightStrength}`);

  // 3. Twin West Wing Helipad (Pad B) is walkable at y=10.4m and holds Gold/Wood VTOL
  const padBY = walkableHeightWithFloor(VTOL_AIRCRAFT_SPAWN.x, VTOL_AIRCRAFT_SPAWN.z, 10.4);
  assert.ok(Math.abs(padBY - 10.4) < 0.15, `Twin Helipad Pad B must be walkable at 10.4m, got ${padBY}`);

  // 4. Combined Normal Train traverses Surface, Elevated Sky Viaduct (+7m), and Underground Metro Subway (-7m)
  let sawSurface = false;
  let sawElevated = false;
  let sawSubway = false;
  for (let i = 0; i < 100; i++) {
    const profile = getRailwayGradeProfile(i / 100);
    if (profile.gradeType === 'surface') sawSurface = true;
    if (profile.gradeType === 'elevated' && profile.y > 5.0) sawElevated = true;
    if (profile.gradeType === 'subway_tunnel' && profile.y < -5.0) sawSubway = true;
  }
  assert.equal(sawSurface, true, 'Combined railway must include Surface tracks');
  assert.equal(sawElevated, true, 'Combined railway must include Elevated Skyway (+7.4m)');
  assert.equal(sawSubway, true, 'Combined railway must include Underground Metro Subway (-7.2m)');

  // 5. Easy Train Driver Mode Cruise Notch holds target speed automatically without holding W
  let driverTrain = createInitialTrainState();
  driverTrain = { ...driverTrain, speed: 0, speedKmh: 0, phase: 'stopped', doorOpen: 1 };
  for (let i = 0; i < 60; i++) {
    driverTrain = stepTrainManualDrive(driverTrain, 0, false, false, 0.05, TRAIN_DRIVER_NOTCH_MPS[2]);
  }
  const expectedKmh = Math.round(TRAIN_DRIVER_NOTCH_MPS[2] * 3.6);
  assert.ok(
    Math.abs(driverTrain.speedKmh - expectedKmh) <= 3,
    `Cruise notch must hold ~${expectedKmh} km/h automatically, got ${driverTrain.speedKmh} km/h`
  );
  assert.equal(driverTrain.doorOpen, 0, 'Doors must close automatically when cruise notch engages');

  // 6. Instant Personal Lantern ON/OFF snap
  let lantern = createInitialPlayerLanternState();
  lantern = togglePlayerLantern(lantern);
  assert.equal(lantern.isOn, true);
  assert.equal(lantern.brightness, 1.0);
  lantern = togglePlayerLantern(lantern);
  assert.equal(lantern.isOn, false);
  assert.equal(lantern.brightness, 0);
});

test('Real Superhero House Secret Tunnel opens without teleporting, connects house & outside via 62.5m ramp, and opens into a literal 1 KM (1,000 m) Mega-Chamber', () => {
  // 1. Literal 1,000.0 m (1.00 KM) Underground Mega-Chamber dimensions & distance meter
  assert.equal(VAULT_MEGA_CHAMBER_LENGTH, 1000.0, 'Mega-Chamber must be literally 1,000 meters (1 km) long');
  assert.equal(VAULT_MEGA_START_Z - VAULT_MEGA_END_Z, 1000.0);
  assert.equal(isInsideMegaChamber(-20, VAULT_MEGA_START_Z - 500), true);
  assert.equal(getVaultMegaChamberDistanceM(-20, VAULT_MEGA_START_Z), 0);
  assert.equal(getVaultMegaChamberDistanceM(-20, VAULT_MEGA_START_Z - 500), 500);
  assert.equal(getVaultMegaChamberDistanceM(-20, VAULT_MEGA_END_Z), 1000);

  // 2. Continuous physical House Secret Tunnel Ramp descending smoothly from y=0.04m to y=-28.0m
  const topY = vaultFloorYAt(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_MOUTH_Z);
  const midY = vaultFloorYAt(
    VAULT_HOME_TUNNEL_X,
    (VAULT_HOME_TUNNEL_RAMP_TOP_Z + VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z) * 0.5
  );
  const botY = vaultFloorYAt(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z);
  assert.ok(Math.abs(topY - 0.04) < 0.05, `Expected vestibule floor near 0.04m, got ${topY}`);
  assert.ok(midY < -10 && midY > -18, `Expected smooth mid-ramp depth between -10m and -18m, got ${midY}`);
  assert.equal(botY, VAULT_FLOOR_Y, 'Bottom of House Secret Tunnel ramp must meet Mega-Chamber floor at -28m');

  // 3. Zero-teleport surface-to-vault entry & vault-to-surface exit (closed blocks, open allows BOTH yard & living room!)
  assert.equal(
    isEnteringHouseSecretTunnelFromSurface(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_MOUTH_Z - 1.0, 0.0),
    false,
    'Sealed tunnel doors must block entry from outside'
  );
  assert.equal(
    isEnteringHouseSecretTunnelFromSurface(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_MOUTH_Z - 1.0, 1.0),
    true,
    'Open exterior blast doors must allow walking/driving directly inside'
  );
  assert.equal(
    isEnteringHouseSecretTunnelFromSurface(
      VAULT_HOME_INTERIOR_DOOR_WORLD.x - 0.6,
      VAULT_HOME_INTERIOR_DOOR_WORLD.z,
      1.0
    ),
    true,
    'Open En Illam Interior Secret Wall Door must allow stepping directly into tunnel'
  );
  assert.equal(
    isExitingHouseSecretTunnelToSurface(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_MOUTH_Z + 0.1, 1.0),
    'yard'
  );
  assert.equal(
    isExitingHouseSecretTunnelToSurface(
      VAULT_HOME_INTERIOR_DOOR_WORLD.x + 0.2,
      VAULT_HOME_INTERIOR_DOOR_WORLD.z,
      1.0
    ),
    'living_room'
  );

  // 4. Seamless clamping connects Main Vault -> Connector -> full 1,000 m Mega-Chamber -> House Secret Tunnel Ramp
  const connMidX = (VAULT_CONNECTOR_MIN_X + VAULT_CONNECTOR_MAX_X) * 0.5;
  const connPass = clampVaultPosition(connMidX, -50.0, 1.4, true, true);
  assert.equal(connPass.hitWall, false, 'Connector Avenue must pass cleanly between Main Vault and 1 KM Mega-Chamber');
  const deepMega = clampVaultPosition(-20.0, VAULT_MEGA_END_Z + 5.0, 1.4, true, true);
  assert.equal(deepMega.hitWall, false, 'Must be able to travel all the way to 995m inside the 1 KM Mega-Chamber');
  const blockedClosedDoor = clampVaultPosition(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_MOUTH_Z + 0.5, 1.4, true, false);
  assert.equal(blockedClosedDoor.hitWall, true, 'Closed House Tunnel doors must hold player inside vestibule');

  // 5. Driving Batmobile at high speed inside the 1 KM Mega-Chamber (> 180 km/h) AND physically exiting out the House Secret Tunnel Portal with ZERO teleport!
  let bat = createInitialBatmobileState();
  bat = {
    ...bat,
    x: -20.0,
    y: VAULT_FLOOR_Y,
    z: VAULT_MEGA_START_Z - 40.0,
    heading: Math.PI, // Facing -Z straight down the 1 KM Mega-Chamber!
    inVault: true,
  };
  let peakKmh = 0;
  for (let i = 0; i < 80; i++) {
    const res = stepBatmobileState(bat, 1, 0, true, false, 0.05, 1.0, 1.0);
    bat = res.state;
    peakKmh = Math.max(peakKmh, bat.speedKmh);
  }
  assert.ok(peakKmh >= 180, `Batmobile must unleash >= 180 km/h down the 1 KM Mega-Chamber, got ${peakKmh} km/h`);
  assert.ok(bat.z < VAULT_MEGA_START_Z - 150, 'Batmobile must cover > 150m smoothly down the 1 KM chamber');

  // Now drive Batmobile UP the House Secret Tunnel vestibule facing South (+Z, heading = 0) straight out the open exterior portal!
  bat = {
    ...bat,
    x: VAULT_HOME_TUNNEL_X,
    y: vaultFloorYAt(VAULT_HOME_TUNNEL_X, VAULT_HOME_TUNNEL_MOUTH_Z - 3.5),
    z: VAULT_HOME_TUNNEL_MOUTH_Z - 3.5,
    heading: 0, // Facing +Z straight out into En Illam front yard
    speed: 14,
    inVault: true,
  };
  const prevX = bat.x;
  let exitedHousePortal = false;
  for (let i = 0; i < 20; i++) {
    const res = stepBatmobileState(bat, 1, 0, false, false, 0.05, 1.0, 1.0);
    bat = res.state;
    if (res.exitedToSurface) {
      exitedHousePortal = true;
      break;
    }
  }
  assert.equal(exitedHousePortal, true, 'Driving Batmobile South out the open House Secret Tunnel Portal must exit to front yard');
  assert.equal(bat.inVault, false);
  assert.ok(Math.abs(bat.x - prevX) < 0.5, 'House Secret Tunnel exit must be ZERO-teleport continuous X');
  assert.ok(
    Math.abs(bat.z - VAULT_HOME_TUNNEL_MOUTH_Z) < 2.5,
    `House Secret Tunnel exit must emerge right at portal mouth z=${VAULT_HOME_TUNNEL_MOUTH_Z}, got ${bat.z}`
  );

  // And driving a Vault Car straight North BACK INTO the open House Secret Tunnel from outside front yard enters with ZERO teleport!
  let vcar: VaultCarRuntimeState = {
    ...createInitialHomeVaultState().cars[0],
    x: VAULT_HOME_TUNNEL_X,
    y: 0,
    z: VAULT_HOME_TUNNEL_MOUTH_Z + 2.5,
    heading: Math.PI, // Facing -Z straight into the open portal!
    speed: 12,
    inVault: false,
  };
  let reEnteredVault = false;
  for (let i = 0; i < 20; i++) {
    const res = stepVaultCarState(vcar, 1, 0, false, false, 0.05, 1.0, 1.0);
    vcar = res.state;
    if (res.enteredVault) {
      reEnteredVault = true;
      break;
    }
  }
  assert.equal(reEnteredVault, true, 'Driving from outside yard into open House Secret Tunnel must enter underground with ZERO teleport');
  assert.equal(vcar.inVault, true);
});

test('Test 66: Mobile full-screen touch movement works anywhere on screen while supporting simultaneous 2nd-finger camera orbit & desktop mouse', () => {
  // 1. Desktop mouse stays camera-orbit only
  let st = createInitialScreenTouchState();
  const mouseDown = beginScreenPointer(st, {
    pointerId: 1,
    pointerType: 'mouse',
    clientX: 600,
    clientY: 400,
    allowTouchMove: true,
    fixedJoystickActive: false,
  });
  assert.equal(mouseDown.role, 'camera');
  assert.equal(mouseDown.state.active, false);

  // 2. Mobile touch anywhere (e.g. upper-right quadrant 310, 220) activates floating movement pad!
  st = createInitialScreenTouchState();
  const touchDown = beginScreenPointer(st, {
    pointerId: 10,
    pointerType: 'touch',
    clientX: 310,
    clientY: 220,
    allowTouchMove: true,
    fixedJoystickActive: false,
  });
  assert.equal(touchDown.role, 'move');
  assert.equal(touchDown.state.active, true);
  st = touchDown.state;

  // Dragging upward & right produces strong positive forward & right movement vectors
  const drag1 = moveScreenPointer(st, { pointerId: 10, clientX: 345, clientY: 165 });
  assert.equal(drag1.role, 'move');
  assert.ok(drag1.state.forward > 0.65, `Expected strong forward movement, got ${drag1.state.forward}`);
  assert.ok(drag1.state.right > 0.35, `Expected positive right strafe, got ${drag1.state.right}`);
  st = drag1.state;

  // Simultaneous 2nd finger orbits camera without interrupting movement!
  const finger2Down = beginScreenPointer(st, {
    pointerId: 11,
    pointerType: 'touch',
    clientX: 180,
    clientY: 320,
    allowTouchMove: true,
    fixedJoystickActive: false,
  });
  assert.equal(finger2Down.role, 'camera');
  st = finger2Down.state;
  const finger2Move = moveScreenPointer(st, { pointerId: 11, clientX: 220, clientY: 300 });
  assert.equal(finger2Move.role, 'camera');
  assert.equal(finger2Move.camDx, 40);
  assert.equal(finger2Move.camDy, -20);
  assert.ok(finger2Move.state.forward > 0.65, '2nd-finger orbit must not disrupt active touch movement');
  st = finger2Move.state;

  // Lifting move finger clears floating thumbpad cleanly
  const liftMove = endScreenPointer(st, 10);
  assert.equal(liftMove.active, false);
  assert.equal(liftMove.forward, 0);
  assert.equal(liftMove.right, 0);
});

test('Test 67: Extracted SSJ Orange Rescue Helicopter sits beside En Illam (My House), flies to SSJ Dinosaur Island, and SSJ Expedition Cruiser moors at Marina Pier', () => {
  // 1. Orange Rescue Helicopter starts right beside En Illam (My House) on dry ground!
  const heli = createInitialOrangeHeliState();
  const distFromHome = Math.hypot(
    ORANGE_HELI_HOME_POS.x - HOME_CENTER.x,
    ORANGE_HELI_HOME_POS.z - HOME_CENTER.z
  );
  assert.ok(distFromHome < 24, `Orange Rescue Helicopter should park right beside En Illam (<24m), got ${distFromHome.toFixed(1)}m`);
  assert.equal(isWaterAt(heli.x, heli.z), false, 'Orange Rescue Helicopter home pad must sit on dry ground');

  // 2. Takes off, climbs smoothly, and accelerates forward across the unified ocean
  let flying = heli;
  for (let i = 0; i < 40; i++) {
    flying = stepOrangeHeliState(flying, 1.0, 0.0, true, false, true, true, 0.05);
  }
  assert.ok(flying.altitudeM > 8, `Expected Orange Helicopter climb > 8m, got ${flying.altitudeM}m`);
  assert.ok(flying.speedKmh > 60, `Expected high cruise speed > 60 km/h, got ${flying.speedKmh}`);
  const exit = getOrangeHeliExitPosition(flying);
  assert.ok(Number.isFinite(exit.x) && Number.isFinite(exit.y) && Number.isFinite(exit.z));

  // 3. Island Helipad sits on dry SSJ Dinosaur Island ground
  assert.equal(isOnDinosaurIsland(ORANGE_HELI_ISLAND_POS.x, ORANGE_HELI_ISLAND_POS.z), true);
  assert.equal(isWaterAt(ORANGE_HELI_ISLAND_POS.x, ORANGE_HELI_ISLAND_POS.z), false);

  // 4. SSJ Expedition Cruiser starts moored in navigable unified ocean right beside dry Marina Pier
  const boats = createInitialBoats();
  const expBoat = boats.find((b) => b.id === 'ssj_expedition_boat');
  assert.ok(expBoat, 'Expected extracted ssj_expedition_boat in initial boats');
  assert.equal(
    isNavigableBoatWater('ocean', DINOSAUR_MARINA_BOAT_BERTH.x, DINOSAUR_MARINA_BOAT_BERTH.z),
    true,
    'SSJ Expedition Cruiser berth must lie in navigable unified ocean water'
  );
  const pierMidX = (DINOSAUR_MARINA_PIER_BOUNDS.minX + DINOSAUR_MARINA_PIER_BOUNDS.maxX) * 0.5;
  const pierMidZ = (DINOSAUR_MARINA_PIER_BOUNDS.minZ + DINOSAUR_MARINA_PIER_BOUNDS.maxZ) * 0.5;
  assert.equal(isOnDinosaurMarinaPier(pierMidX, pierMidZ), true);
  assert.equal(isWaterAt(pierMidX, pierMidZ), false, 'Dinosaur Island Marina Timber Pier must be dry & walkable');
});

test('Test 68: Enormous Jurassic Park Island + Motorized Swinging Gate + Integrated Wildlife Valley + 3-Aircraft Rooftop/Airport + Dedicated Vehicle Garage', () => {
  // 1. Enormous Jurassic Park Island (>= 244m across) situated far offshore from every other island
  assert.ok(DINOSAUR_ISLAND_LAND_RADIUS >= 120, `Expected enormous Jurassic Park Island (>=120m radius), got ${DINOSAUR_ISLAND_LAND_RADIUS}`);
  const distSnowman = Math.hypot(
    DINOSAUR_ISLAND_CENTER.x - SNOWMAN_ISLAND_CENTER.x,
    DINOSAUR_ISLAND_CENTER.z - SNOWMAN_ISLAND_CENTER.z
  );
  const distHeroTower = Math.hypot(
    DINOSAUR_ISLAND_CENTER.x - OCEAN_HERO_TOWER_CENTER.x,
    DINOSAUR_ISLAND_CENTER.z - OCEAN_HERO_TOWER_CENTER.z
  );
  assert.ok(distSnowman > 200, `Expected Jurassic Park far from Snowman Island (>200m), got ${distSnowman.toFixed(1)}m`);
  assert.ok(distHeroTower > 190, `Expected Jurassic Park far from Ocean Hero Tower (>190m), got ${distHeroTower.toFixed(1)}m`);

  // 2. Colossal Motorized Swinging Jurassic Park Gate toggles and auto-swings open smoothly from 0 -> 1
  let jpState = createInitialDinosaurIslandState();
  assert.equal(jpState.gateOpenProgress, 0);
  const gateX = DINOSAUR_ISLAND_CENTER.x + SSJ_ISLAND_LANDMARKS.entranceArch.lx;
  const gateZ = DINOSAUR_ISLAND_CENTER.z + SSJ_ISLAND_LANDMARKS.entranceArch.lz;
  for (let i = 0; i < 60; i++) {
    jpState = stepDinosaurIslandState(jpState, gateX, gateZ + 8, true, 0.05).state;
  }
  assert.ok(jpState.gateOpenProgress > 0.95, `Expected automatic approach swing open (>0.95), got ${jpState.gateOpenProgress}`);
  jpState = toggleJurassicGate(jpState);
  assert.equal(jpState.gateTargetOpen, false);
  for (let i = 0; i < 60; i++) {
    jpState = stepDinosaurIslandState(jpState, gateX, gateZ + 8, true, 0.05).state;
  }
  assert.ok(jpState.gateOpenProgress < 0.05, `Expected manual close (<0.05), got ${jpState.gateOpenProgress}`);

  // 3. All 21 Wildlife Sanctuary species (zero snakes) are integrated right onto dry Jurassic Park Island
  assert.equal(
    isOnDinosaurIsland(WILDLIFE_FOREST_SANCTUARY_CENTER.x, WILDLIFE_FOREST_SANCTUARY_CENTER.z),
    true,
    'Wildlife Sanctuary center must sit directly on Jurassic Park Island'
  );
  assert.equal(
    isWaterAt(WILDLIFE_FOREST_SANCTUARY_CENTER.x, WILDLIFE_FOREST_SANCTUARY_CENTER.z),
    false,
    'Wildlife Sanctuary center on Jurassic Park Island must be dry land'
  );

  // 4. Orange Rescue Helicopter rests cleanly on En Illam External East Rooftop Pad C (y = 10.4m) and NEVER sinks!
  const padCWalkY = walkableHeightWithFloor(ORANGE_HELI_HOME_POS.x, ORANGE_HELI_HOME_POS.z, 10.4);
  assert.ok(Math.abs(padCWalkY - 10.4) < 0.15, `Expected walkable En Illam Rooftop Pad C at y=10.4m, got ${padCWalkY}`);
  let parkedHeli = createInitialOrangeHeliState();
  assert.ok(Math.abs(parkedHeli.y - 10.4) < 0.1, `Orange Rescue Helicopter should start on Pad C (y=10.4m), got ${parkedHeli.y}`);
  for (let i = 0; i < 30; i++) {
    parkedHeli = stepOrangeHeliState(parkedHeli, 0, 0, false, false, false, false, 0.05);
  }
  assert.ok(
    Math.abs(parkedHeli.y - 10.4) < 0.15,
    `Parked Orange Rescue Helicopter must remain on Pad C (10.4m) without sinking, got ${parkedHeli.y}`
  );

  // 5. All 3 Airport Aircraft Stands sit inside Dreamline International Airport apron, clear of ATC tower & Gate A2 jet
  assert.equal(AIRPORT_AIRCRAFT_STANDS.length, 3, 'Must provide all 3 aircraft stands at Dreamline Airport');
  for (const stand of AIRPORT_AIRCRAFT_STANDS) {
    assert.equal(isInsideAirport(stand.x, stand.z), true, `Airport stand ${stand.id} must lie inside Airport bounds`);
    assert.ok(Math.hypot(stand.x - 224, stand.z - -162) > 18, `Airport stand ${stand.id} must clear ATC tower`);
    assert.ok(Math.hypot(stand.x - 234, stand.z - -125) > 18, `Airport stand ${stand.id} must clear parked Gate A2 jet`);
  }

  // 6. Dedicated Vehicle Spawning Garage sits on flat dry plaza beside En Illam, >20m clear of railway tracks, and is listed in LOCATIONS
  const garageLoc = LOCATIONS.find((l) => l.id === 'vehicle_garage');
  assert.ok(garageLoc, 'Expected vehicle_garage location in World Map LOCATIONS');
  assert.equal(isWaterAt(VEHICLE_GARAGE_CENTER.x, VEHICLE_GARAGE_CENTER.z), false);
  assert.ok(
    distanceToRail(VEHICLE_GARAGE_CENTER.x, VEHICLE_GARAGE_CENTER.z) > 20,
    `Vehicle Garage must sit clear of all railway tracks (>20m), got ${distanceToRail(VEHICLE_GARAGE_CENTER.x, VEHICLE_GARAGE_CENTER.z).toFixed(1)}m`
  );
  assert.ok(
    Math.abs(groundHeightAt(VEHICLE_GARAGE_SPAWN_BAY.x, VEHICLE_GARAGE_SPAWN_BAY.z)) < 0.2,
    'Vehicle Garage spawn bay must sit on a flat dry plaza'
  );
});

test('OceanLab 3D 8-Wave Gerstner Ocean physics, 16-bit coastal bathymetry & 3D Firefly Photinus kinematics', async () => {
  const {
    OCEAN_THEMES,
    OCEAN_WAVE_SPECTRUM,
    buildSeabedHeightTextureData,
    computeOceanWeatherParams,
    decodeSeabedHeight16,
    encodeSeabedHeight16,
    evaluateGerstnerOceanCPU,
  } = await import('./gerstnerOcean');
  const { evaluateFireflyKinematics, generateFireflySeeds } = await import('./fireflies');

  // 1. 16-bit RG Seabed heightmap round-trip precision (< 0.01m error across [-24m, +14m])
  assert.equal(OCEAN_WAVE_SPECTRUM.length, 8, 'OceanLab spectrum must have exactly 8 directional Gerstner waves');
  for (const h of [-24.0, -12.5, -2.2, 0.0, 4.75, 14.0]) {
    const [hi, lo] = encodeSeabedHeight16(h);
    const decoded = decodeSeabedHeight16(hi, lo);
    assert.ok(
      Math.abs(decoded - h) < 0.02,
      `16-bit seabed encoding error too large at h=${h}: decoded=${decoded}`
    );
  }

  // 2. Bathymetry texture bakes real DREAMLINE ocean & island relief cleanly
  const texData = buildSeabedHeightTextureData(32, groundHeightAt, WATER_LEVEL);
  assert.equal(texData.length, 32 * 32 * 4);

  // 3. Weather & Ocean Basin scaling (clear < rain < thunderstorm < tsunami)
  const clearP = computeOceanWeatherParams('clear', 'bengal');
  const rainP = computeOceanWeatherParams('rain', 'bengal');
  const stormP = computeOceanWeatherParams('thunderstorm', 'bengal');
  const tsunamiP = computeOceanWeatherParams('tsunami', 'bengal');
  assert.ok(clearP.amplitude < rainP.amplitude && rainP.amplitude < stormP.amplitude && stormP.amplitude < tsunamiP.amplitude);
  assert.ok(OCEAN_THEMES.bengal && OCEAN_THEMES.atlantic && OCEAN_THEMES.pacific);

  // 4. Trochoidal Gerstner displacement, unit normal & Jacobian compression
  let minJ = Infinity;
  let maxY = -Infinity;
  let minY = Infinity;
  for (let i = 0; i < 40; i++) {
    const s = evaluateGerstnerOceanCPU(190 + i * 3.1, 60 + i * 1.7, 4.2, stormP, -12.0);
    const nLen = Math.hypot(s.nx, s.ny, s.nz);
    assert.ok(Math.abs(nLen - 1.0) < 0.001, `Surface normal must be unit length, got ${nLen}`);
    assert.ok(s.ny > 0.3, `Surface normal must point upward, got ny=${s.ny}`);
    minJ = Math.min(minJ, s.jacobian);
    maxY = Math.max(maxY, s.y);
    minY = Math.min(minY, s.y);
  }
  assert.ok(maxY - minY > 0.4, `Expected visible storm wave height span (>0.4m), got ${(maxY - minY).toFixed(2)}m`);
  assert.ok(minJ < 0.96, `Expected Gerstner crest Jacobian pinching (<0.96), got ${minJ.toFixed(3)}`);

  // 5. Real 3D Firefly flight tangent, wing flutter & Photinus on/off bioluminescent flash
  const seeds = generateFireflySeeds(64);
  const sampleSeed = seeds[0];
  let maxFlash = 0;
  let minFlash = 1;
  let minWing = 1;
  let maxWing = -1;
  for (let step = 0; step < 80; step++) {
    const k = evaluateFireflyKinematics(sampleSeed, step * 0.08);
    maxFlash = Math.max(maxFlash, k.flash);
    minFlash = Math.min(minFlash, k.flash);
    minWing = Math.min(minWing, k.wingAngle);
    maxWing = Math.max(maxWing, k.wingAngle);
    assert.ok(Number.isFinite(k.vx) && Number.isFinite(k.vy) && Number.isFinite(k.vz));
  }
  assert.ok(maxFlash > 0.85, `Expected bright firefly Photinus pulse (>0.85), got ${maxFlash.toFixed(3)}`);
  assert.ok(minFlash < 0.1, `Expected dark resting phase between firefly flashes (<0.10), got ${minFlash.toFixed(3)}`);
  assert.ok(minWing < -0.3 && maxWing > 0.3, `Expected fluttering wings oscillating across 0, got [${minWing.toFixed(2)}, ${maxWing.toFixed(2)}]`);
});

test('Test 70: Resized Grand Dinosaur Island (~470m, bigger than original yet not 1 KM) + 360° Perimeter Wall + Night/Morning Roof Doors + Crystal Lake & Flowing River', async () => {
  const {
    DINOSAUR_CRYSTAL_LAKE_CENTER,
    DINOSAUR_LAKE_WATER_Y,
    DINOSAUR_PERIMETER_WALL_HEIGHT,
    DINOSAUR_PERIMETER_WALL_RADIUS,
    DINOSAUR_RIVER_BRIDGE_LZS,
    DINOSAUR_ROOF_DOOR_Y,
    computeJurassicRoofDoorTarget,
    computeSsjRiverArcLength,
    isInsideDinoCrystalLake,
    isOnDinosaurRiverBridge,
    snapJurassicRoofDoorsForTime,
    ssjRiverLocalX,
  } = await import('./dinosaurIsland');

  // 1. Grand Dinosaur Island: bigger than original (~120m), NOT oversized 1 KM (508m)!
  assert.ok(
    DINOSAUR_ISLAND_LAND_RADIUS >= 210 && DINOSAUR_ISLAND_LAND_RADIUS <= 280,
    `Expected grand-but-not-1KM Dinosaur Island (radius 210..280m), got ${DINOSAUR_ISLAND_LAND_RADIUS}m`
  );
  assert.ok(DINOSAUR_PERIMETER_WALL_RADIUS >= 200 && DINOSAUR_PERIMETER_WALL_HEIGHT >= 36);
  assert.ok(DINOSAUR_ROOF_DOOR_Y > DINOSAUR_PERIMETER_WALL_HEIGHT);
  const spawnGroundY = groundHeightAt(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z + 224);
  assert.ok(
    spawnGroundY > 1.2,
    `Expected elevated dry Dinosaur Island South Promenade (>1.2m above 0), got y=${spawnGroundY.toFixed(2)}m`
  );

  // 2. Automated Horizontal Upper Roof Doors: CLOSE at night (18:30-05:30), OPEN at morning/day (05:30-18:30)!
  assert.equal(computeJurassicRoofDoorTarget(22.0), 1, 'Upper roof doors must close at night (22:00)');
  assert.equal(computeJurassicRoofDoorTarget(2.0), 1, 'Upper roof doors must stay closed before dawn (02:00)');
  assert.equal(computeJurassicRoofDoorTarget(6.5), 0, 'Upper roof doors must open in the morning (06:30)');
  assert.equal(computeJurassicRoofDoorTarget(12.0), 0, 'Upper roof doors must stay open at noon (12:00)');

  let state = createInitialDinosaurIslandState(9.0);
  assert.equal(state.roofDoorCloseProgress, 0, 'Roof doors start wide open in morning');
  for (let i = 0; i < 80; i++) {
    state = stepDinosaurIslandState(state, DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z, true, 0.05, 22.0).state;
  }
  assert.ok(state.roofDoorCloseProgress > 0.98, `Roof doors must glide shut at night, got ${state.roofDoorCloseProgress}`);
  for (let i = 0; i < 80; i++) {
    state = stepDinosaurIslandState(state, DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z, true, 0.05, 7.0).state;
  }
  assert.ok(state.roofDoorCloseProgress < 0.02, `Roof doors must glide wide open at morning, got ${state.roofDoorCloseProgress}`);

  state = snapJurassicRoofDoorsForTime(state, 23.0);
  assert.equal(state.roofDoorCloseProgress, 1);
  state = snapJurassicRoofDoorsForTime(state, 8.0);
  assert.equal(state.roofDoorCloseProgress, 0);

  // 3. Scenic Crystal Lake + continuous Flowing Forest River + 4 Dry Walkable Timber Bridges
  const lakeWorldX = DINOSAUR_ISLAND_CENTER.x + DINOSAUR_CRYSTAL_LAKE_CENTER.lx;
  const lakeWorldZ = DINOSAUR_ISLAND_CENTER.z + DINOSAUR_CRYSTAL_LAKE_CENTER.lz;
  assert.equal(isInsideDinoCrystalLake(lakeWorldX, lakeWorldZ), true);
  assert.ok(
    groundHeightAt(lakeWorldX, lakeWorldZ) < DINOSAUR_LAKE_WATER_Y - 1.0,
    'Crystal Lake bed must be carved cleanly below lake surface'
  );

  const riverLen = computeSsjRiverArcLength();
  assert.ok(riverLen >= 400 && riverLen <= 550, `Expected flowing forest river (400..550m), got ${riverLen.toFixed(1)}m`);

  assert.equal(DINOSAUR_RIVER_BRIDGE_LZS.length, 4);
  for (const bridgeLz of DINOSAUR_RIVER_BRIDGE_LZS) {
    const bx = DINOSAUR_ISLAND_CENTER.x + ssjRiverLocalX(bridgeLz);
    const bz = DINOSAUR_ISLAND_CENTER.z + bridgeLz;
    assert.equal(isOnDinosaurRiverBridge(bx, bz), true, `Expected bridge at lz=${bridgeLz}`);
    assert.equal(isWaterAt(bx, bz), false, `River bridge at lz=${bridgeLz} must be dry & walkable`);
    assert.ok(walkableHeightAt(bx, bz) > 2.0, `River bridge deck at lz=${bridgeLz} must rise above river water`);
  }
});

test('Test 71: 49cc Petrol Dirt Bike (Orion Mini) physics, kickstand auto-retraction, USD fork braking dive, 2-stroke RPM & exact-location spawning', async () => {
  const { createInitialDirtBikeState, stepDirtBike } = await import('./dirtBike');
  const { computeCatalogueSpawnPoint, getCatalogueVehicleById, getCatalogueVehiclesByCategory } = await import('./vehicleCatalogue');

  // 1. Registered in Vehicle Catalogue under bikes and spawns at exact player coordinates
  const entry = getCatalogueVehicleById('dirt_bike_49cc');
  assert.equal(entry.id, 'dirt_bike_49cc');
  assert.equal(entry.category, 'bikes');
  assert.ok(getCatalogueVehiclesByCategory('bikes').some((v) => v.id === 'dirt_bike_49cc'));
  const exactSpawn = computeCatalogueSpawnPoint('dirt_bike_49cc', 42.5, -18.25, 1.2);
  assert.equal(exactSpawn.x, 42.5);
  assert.equal(exactSpawn.z, -18.25);
  assert.equal(exactSpawn.heading, 1.2);

  // 2. Starts parked on left kickstand with resting lean & 2-stroke idle RPM (~1850)
  const bike = createInitialDirtBikeState();
  assert.equal(bike.kickstandDown, true);
  assert.ok(bike.leanAngle < -0.05, 'Parked bike must lean toward left kickstand');
  assert.ok(bike.rpm >= 1700 && bike.rpm <= 2000);

  // 3. Throttling + turning right automatically folds kickstand up, climbs speed/RPM, leans & turns smoothly
  const startX = bike.x;
  const startZ = bike.z;
  const startHeading = bike.heading;
  for (let i = 0; i < 45; i++) {
    stepDirtBike(
      bike,
      { forward: 1, turn: 0.75, ascend: false, descend: false, brake: false, boost: true },
      0.04,
      'clear',
      true,
      i * 0.04
    );
  }
  assert.equal(bike.kickstandDown, false, 'Kickstand must fold up automatically when throttling');
  assert.ok(bike.speedKmh >= 45, `Expected lively 49cc powerband speed (>=45 km/h), got ${bike.speedKmh}`);
  assert.ok(bike.rpm >= 5500, `Expected high 2-stroke RPM (>=5500), got ${bike.rpm}`);
  assert.ok(Math.hypot(bike.x - startX, bike.z - startZ) > 10, 'Dirt bike must travel smoothly across terrain');
  assert.ok(Math.abs(bike.heading - startHeading) > 0.25, 'Handlebar steering must carve turns');
  assert.ok(Math.abs(bike.leanAngle) > 0.05, 'Dirt bike must lean dynamically when carving turns');

  // 4. Wave disc braking triggers inverted USD front fork dive & slows smoothly
  const preBrakeSpeed = bike.speed;
  for (let i = 0; i < 12; i++) {
    stepDirtBike(
      bike,
      { forward: 0, turn: 0, ascend: false, descend: false, brake: true, boost: false },
      0.04,
      'clear',
      true,
      2.0 + i * 0.04
    );
  }
  assert.ok(bike.speed < preBrakeSpeed * 0.5, 'Wave disc brake must decelerate rapidly');
  assert.ok(bike.forkCompression > 0.25 && bike.brakeDive > 0.25, 'Front USD forks must dive under disc braking');

  // 5. Dismounting brings bike to a stop and drops kickstand back down
  for (let i = 0; i < 40; i++) {
    stepDirtBike(
      bike,
      { forward: 0, turn: 0, ascend: false, descend: false, brake: false, boost: false },
      0.05,
      'clear',
      false,
      3.0 + i * 0.05
    );
  }
  assert.equal(bike.speed, 0);
  assert.equal(bike.kickstandDown, true);
});

test('Test 72: Redesigned World Atlas covers full world (including Grand Dinosaur Island), supports zoom/pan bounds, scale bar, and true shaded-relief biome/water sampling', () => {
  // 1. Invertible projection across extreme corners including Grand Dinosaur Island, Frozen Kingdom & Thar Desert
  const checkPts = [
    { x: -244, z: 144 }, // Thar Pyramid
    { x: -210, z: -180 }, // Frozen Kingdom
    { x: 0, z: 14 }, // Main Station
    { x: 560, z: 195 }, // Grand Dinosaur Island Center
    { x: 780, z: 195 }, // East shore of Grand Dinosaur Island
  ];
  for (const pt of checkPts) {
    const ax = worldToAtlasX(pt.x);
    const ay = worldToAtlasY(pt.z);
    assert.ok(ax >= 0 && ax <= ATLAS_BASE_W, `Point (${pt.x}, ${pt.z}) X must fit inside atlas without clamping`);
    assert.ok(ay >= 0 && ay <= ATLAS_BASE_H, `Point (${pt.x}, ${pt.z}) Z must fit inside atlas without clamping`);
    assert.ok(Math.abs(atlasToWorldX(ax) - pt.x) < 0.05);
    assert.ok(Math.abs(atlasToWorldZ(ay) - pt.z) < 0.05);
  }

  // 2. Zoom & Pan clamping stays strictly within ATLAS_BOUNDS and valid SVG viewBox
  const extremeCam = clampAtlasCamera({ centerX: 99999, centerZ: -99999, zoom: 99 });
  assert.ok(extremeCam.zoom <= 6.5 && extremeCam.zoom >= 1.0);
  const vb = computeAtlasViewBox(extremeCam);
  assert.ok(vb.vx >= 0 && vb.vy >= 0);
  assert.ok(vb.vx + vb.vw <= ATLAS_BASE_W + 0.01);
  assert.ok(vb.vy + vb.vh <= ATLAS_BASE_H + 0.01);

  // 3. All 6 region presets & scale bar produce clean cartographic values
  assert.equal(ATLAS_REGION_PRESETS.length, 6);
  const fullScale = computeAtlasScaleBar(1.0, 900);
  const zoomScale = computeAtlasScaleBar(4.0, 900);
  assert.ok(fullScale.meters > zoomScale.meters, 'Zooming in must reduce scale bar distance');
  assert.ok(zoomScale.widthPx >= 46 && zoomScale.widthPx <= 168);

  // 4. Shaded-relief terrain sampler accurately distinguishes Ocean, Dino Island Jungle, Dino Crystal Lake, Frozen Snow & Thar Desert
  const oceanRgb = sampleAtlasPixelRGB(280, 320); // Open ocean between Exhibition Island & Dino Island
  const dinoJungleRgb = sampleAtlasPixelRGB(500, 195); // Lush jungle inside Grand Dinosaur Island
  const dinoLakeRgb = sampleAtlasPixelRGB(560 + 34, 195 - 20); // Crystal Lake inside Dinosaur Island
  const desertRgb = sampleAtlasPixelRGB(-222, 126); // Thar Golden Desert
  const snowRgb = sampleAtlasPixelRGB(-180, -140); // Frozen Kingdom Snow

  assert.ok(oceanRgb[2] > oceanRgb[0] + 25, `Open ocean must be marine blue, got ${oceanRgb}`);
  assert.ok(dinoJungleRgb[1] > dinoJungleRgb[0] + 20, `Dinosaur Island jungle must be green, got ${dinoJungleRgb}`);
  assert.ok(dinoLakeRgb[2] > dinoLakeRgb[0] + 50, `Dinosaur Crystal Lake must be bright cyan-blue, got ${dinoLakeRgb}`);
  assert.ok(desertRgb[0] > desertRgb[2] + 40, `Thar Desert must be warm golden ochre, got ${desertRgb}`);
  assert.ok(snowRgb[0] > 150 && snowRgb[1] > 165 && snowRgb[2] > 175, `Frozen Kingdom must be crisp pale snow, got ${snowRgb}`);

  // 5. Atlas pins cover key landmarks including Dinosaur Island, Vehicle Garage & Wildlife Sanctuary
  for (const id of ['main_station', 'dinosaur_island', 'dino_grand_gate', 'dino_crystal_lake', 'wildlife_sanctuary', 'vehicle_garage', 'international_airport', 'frozen_kingdom', 'thar_desert']) {
    assert.ok(ATLAS_PINS.some((p) => p.id === id), `ATLAS_PINS must include ${id}`);
  }
  assert.ok(ATLAS_BOUNDS.maxX > DINOSAUR_ISLAND_CENTER.x + DINOSAUR_ISLAND_LAND_RADIUS, 'Atlas must span past east rim of Grand Dinosaur Island');
});

test('Test 73: 4 Bigger Surrounding Auto-Opening Perimeter Gates + Grand Triangle Explorer Track showcasing all 6 distinct island places', async () => {
  const {
    DINOSAUR_PERIMETER_GATES,
    DINOSAUR_PERIMETER_WALL_RADIUS,
    DINOSAUR_TRIANGLE_PLACES,
    DINOSAUR_TRIANGLE_VERTICES,
    distanceToDinosaurTriangleTrack,
    sampleDinosaurTriangleTrack,
  } = await import('./dinosaurIsland');

  // 1. All 4 bigger surrounding perimeter gates sit on the 360° boundary wall and auto-open when approached!
  assert.equal(DINOSAUR_PERIMETER_GATES.length, 4);
  for (let gi = 0; gi < DINOSAUR_PERIMETER_GATES.length; gi++) {
    const g = DINOSAUR_PERIMETER_GATES[gi];
    const r = Math.hypot(g.lx, g.lz);
    assert.ok(
      Math.abs(r - DINOSAUR_PERIMETER_WALL_RADIUS) < 1.0,
      `Gate ${g.id} must sit cleanly on the perimeter wall radius`
    );
    let st = createInitialDinosaurIslandState(12.0);
    const gx = DINOSAUR_ISLAND_CENTER.x + g.lx;
    const gz = DINOSAUR_ISLAND_CENTER.z + g.lz;
    // Approach gate from 18m away -> gate doors must automatically swing wide open!
    for (let step = 0; step < 30; step++) {
      st = stepDinosaurIslandState(st, gx, gz + 12, true, 0.05, 12.0).state;
    }
    assert.ok(
      st.perimeterGateProgress[gi] > 0.95,
      `Gate ${g.id} must automatically swing wide open when entered, got ${st.perimeterGateProgress[gi]}`
    );
  }

  // 2. Grand Triangle Track forms a closed 3-vertex triangle inside the perimeter wall & never hits Crystal Lake
  assert.equal(DINOSAUR_TRIANGLE_VERTICES.length, 3);
  for (const v of DINOSAUR_TRIANGLE_VERTICES) {
    assert.ok(
      Math.hypot(v.lx, v.lz) < DINOSAUR_PERIMETER_WALL_RADIUS - 25,
      'Triangle vertex must sit comfortably inside the perimeter wall'
    );
  }
  for (let i = 0; i < 60; i++) {
    const pt = sampleDinosaurTriangleTrack(i / 60);
    assert.ok(
      distanceToDinosaurTriangleTrack(pt.x, pt.z) < 0.01,
      'Sampled triangle track point must lie cleanly on the triangle loop'
    );
  }

  // 3. Exploring all 6 stops around the Triangle Track discovers every distinct place & updates HUD live!
  assert.equal(DINOSAUR_TRIANGLE_PLACES.length, 6);
  let exploreState = createInitialDinosaurIslandState(12.0);
  const discoveredNames: string[] = [];
  for (const place of DINOSAUR_TRIANGLE_PLACES) {
    const px = DINOSAUR_ISLAND_CENTER.x + place.lx;
    const pz = DINOSAUR_ISLAND_CENTER.z + place.lz;
    const res = stepDinosaurIslandState(exploreState, px, pz, true, 0.05, 12.0);
    exploreState = res.state;
    assert.equal(exploreState.triangleTrackHud.onTrack, true);
    assert.equal(exploreState.triangleTrackHud.activePlaceId, place.id);
    if (res.events.trianglePlaceDiscovered) {
      discoveredNames.push(res.events.trianglePlaceDiscovered.name);
    }
  }
  assert.equal(discoveredNames.length, 6, 'Exploring the full triangle must discover all 6 distinct places');
  assert.equal(exploreState.triangleTrackHud.visitedCount, 6);
  assert.equal(exploreState.triangleTrackHud.totalPlaces, 6);
});

test('Test 74: Universal exact-location vehicle spawning anywhere + ANY vehicle driving down the Secret Underground Tunnel & back out to daylight', async () => {
  const { VEHICLE_CATALOGUE, computeCatalogueSpawnPoint } = await import('./vehicleCatalogue');
  const {
    VAULT_FLOOR_Y,
    VAULT_HOME_TUNNEL_MOUTH_Z,
    VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z,
    VAULT_HOME_TUNNEL_X,
    isApproachingHouseTunnelExterior,
    stepGenericVehicleVaultTunnel,
    vaultFloorYAt,
  } = await import('./homeUndergroundVault');
  const { createInitialDirtBikeState, stepDirtBike } = await import('./dirtBike');

  // 1. EVERY vehicle in VEHICLE_CATALOGUE spawns at exact player coordinates across all regions & underground!
  const testLocations = [
    { name: 'Dinosaur Island', x: 560, z: 260, heading: 0.4 },
    { name: 'Frozen Kingdom', x: -190, z: -150, heading: 2.1 },
    { name: 'Thar Desert', x: -230, z: 130, heading: -0.7 },
    { name: 'Underground 1 KM Mega-Chamber', x: 0, z: -320, heading: Math.PI },
  ];
  assert.ok(VEHICLE_CATALOGUE.length >= 10, 'Catalogue must contain all world vehicles');
  for (const entry of VEHICLE_CATALOGUE) {
    for (const loc of testLocations) {
      const pt = computeCatalogueSpawnPoint(entry.id, loc.x, loc.z, loc.heading);
      assert.equal(pt.x, loc.x, `${entry.id} must spawn at exact X at ${loc.name}`);
      assert.equal(pt.z, loc.z, `${entry.id} must spawn at exact Z at ${loc.name}`);
      assert.equal(pt.heading, loc.heading, `${entry.id} must inherit player heading at ${loc.name}`);
    }
  }

  // 2. Approaching En Illam House Secret Tunnel from exterior yard triggers auto-open blast doors
  assert.equal(isApproachingHouseTunnelExterior(VAULT_HOME_TUNNEL_X, -4.0), true);
  assert.equal(isApproachingHouseTunnelExterior(0, 40), false);

  // 3. Drive 49cc Dirt Bike straight from En Illam front yard down the Secret Tunnel into the 1 KM Mega-Chamber & back up!
  const bike = createInitialDirtBikeState();
  bike.x = VAULT_HOME_TUNNEL_X;
  bike.z = -10.5;
  bike.y = 0.04;
  bike.heading = Math.PI; // Facing North straight down the tunnel!
  bike.inVault = false;

  let enteredVaultCount = 0;
  let reachedMegaFloor = false;
  for (let i = 0; i < 160; i++) {
    stepDirtBike(
      bike,
      { forward: 1, turn: 0, ascend: false, descend: false, brake: false, boost: true },
      0.05,
      'clear',
      true,
      i * 0.05,
      bike.inVault ? vaultFloorYAt : undefined
    );
    const tr = stepGenericVehicleVaultTunnel({
      x: bike.x,
      z: bike.z,
      heading: bike.heading,
      speed: bike.speed,
      inVault: Boolean(bike.inVault),
      exitGateProgress: 1,
      hatchOpenProgress: 1,
      margin: 1.4,
    });
    bike.x = tr.x;
    bike.z = tr.z;
    bike.y = tr.y;
    bike.inVault = tr.inVault;
    if (tr.enteredVault) enteredVaultCount++;
    if (bike.inVault && bike.z <= VAULT_HOME_TUNNEL_RAMP_BOTTOM_Z - 4 && Math.abs(bike.y - VAULT_FLOOR_Y) < 0.2) {
      reachedMegaFloor = true;
      break;
    }
  }
  assert.equal(enteredVaultCount, 1, 'Dirt Bike must seamlessly enter the Secret Underground Tunnel');
  assert.equal(bike.inVault, true, 'Dirt Bike must be inVault after driving down the tunnel');
  assert.equal(reachedMegaFloor, true, `Dirt Bike must reach VAULT_FLOOR_Y (${VAULT_FLOOR_Y}m), got y=${bike.y.toFixed(2)}m at z=${bike.z.toFixed(2)}`);

  // 4. Turn South (heading = 0) and drive straight back up the tunnel ramp out into surface daylight!
  bike.heading = 0;
  bike.x = VAULT_HOME_TUNNEL_X;
  bike.speed = 18;
  let exitedToSurface = false;
  for (let i = 0; i < 160; i++) {
    stepDirtBike(
      bike,
      { forward: 1, turn: 0, ascend: false, descend: false, brake: false, boost: true },
      0.05,
      'clear',
      true,
      10 + i * 0.05,
      bike.inVault ? vaultFloorYAt : undefined
    );
    const tr = stepGenericVehicleVaultTunnel({
      x: bike.x,
      z: bike.z,
      heading: bike.heading,
      speed: bike.speed,
      inVault: Boolean(bike.inVault),
      exitGateProgress: 1,
      hatchOpenProgress: 1,
      margin: 1.4,
    });
    bike.x = tr.x;
    bike.z = tr.z;
    bike.y = tr.y;
    bike.inVault = tr.inVault;
    if (tr.exitedToSurface) {
      exitedToSurface = true;
      break;
    }
  }
  assert.equal(exitedToSurface, true, 'Dirt Bike must seamlessly drive back up the tunnel out into daylight');
  assert.equal(bike.inVault, false);
  assert.ok(bike.z > VAULT_HOME_TUNNEL_MOUTH_Z - 0.2, 'Dirt Bike must emerge at the tunnel mouth in En Illam yard');

  // 5. Also confirm Safari Jeep, Camper Van, Safari Car, and Rural Bus all transition cleanly through the tunnel!
  for (const margin of [1.9, 2.2, 2.6]) {
    const enterRes = stepGenericVehicleVaultTunnel({
      x: VAULT_HOME_TUNNEL_X,
      z: VAULT_HOME_TUNNEL_MOUTH_Z - 1.5,
      heading: Math.PI,
      speed: 10,
      inVault: false,
      exitGateProgress: 1,
      hatchOpenProgress: 1,
      margin,
    });
    assert.equal(enterRes.inVault, true);
    assert.equal(enterRes.enteredVault, true);
    const rampMid = stepGenericVehicleVaultTunnel({
      x: VAULT_HOME_TUNNEL_X,
      z: -52,
      heading: Math.PI,
      speed: 12,
      inVault: true,
      exitGateProgress: 1,
      hatchOpenProgress: 1,
      margin,
    });
    assert.equal(rampMid.inVault, true);
    assert.ok(rampMid.y < -10 && rampMid.y > VAULT_FLOOR_Y, `Expected mid-ramp descent Y, got ${rampMid.y}`);
  }
});

test('75. Aero-Ti Hoverboard Glider: catalogue spawn, twin-turbine boost, retracting skids & underground tunnel flight', () => {
  // 1. Verify catalogue registration & spawn-at-exact-location contract
  const entry = VEHICLE_CATALOGUE.find((v) => v.id === 'hover_glider');
  assert.ok(entry, 'Aero-Ti Hoverboard Glider must be registered in VEHICLE_CATALOGUE');
  assert.equal(entry.category, 'air_rail');
  assert.ok(entry.topSpeedLabel.includes('166'), `Expected high-speed turbine rating in topSpeedLabel, got ${entry.topSpeedLabel}`);

  const spawnPt = computeCatalogueSpawnPoint('hover_glider', 42, -88, 0.75);
  assert.ok(Math.hypot(spawnPt.x - 42, spawnPt.z - -88) < 4.5, 'Glider must spawn right beside the player');

  // 2. Parked state starts with landing skids extended near ground cushion
  const glider = createInitialHoverGliderState();
  assert.equal(glider.x, HOVER_GLIDER_SPAWN.x);
  assert.equal(glider.z, HOVER_GLIDER_SPAWN.z);
  assert.ok(glider.skidProgress > 0.9, `Parked glider skids should be extended, got ${glider.skidProgress}`);

  // 3. Climb with Boost + Turn -> reaches >135 km/h, banks smoothly, retracts skids cleanly in flight
  const startY = glider.y;
  for (let i = 0; i < 160; i++) {
    stepHoverGlider(
      glider,
      { forward: 1, turn: 0.35, boost: true, ascend: true, descend: false, brake: false, cameraPitch: 0.18 },
      0.03,
      i * 0.03,
      true
    );
  }
  assert.ok(glider.speedKmh >= 135, `Expected boosted glider speed >=135 km/h, got ${glider.speedKmh}`);
  assert.ok(glider.y > startY + 12, `Expected glider to climb high above spawn, got delta ${(glider.y - startY).toFixed(2)}m`);
  assert.ok(Math.abs(glider.roll) > 0.08, `Expected dynamic carving bank roll, got ${glider.roll}`);
  assert.ok(glider.skidProgress < 0.2, `In-flight skids should retract (<0.2), got ${glider.skidProgress}`);
  assert.ok(glider.afterburnerGlow > 0.5, `Boosted twin turbines should glow brightly, got ${glider.afterburnerGlow}`);

  // 4. Verify underground Secret Tunnel & 1 KM Mega-Chamber transit works seamlessly for Hoverboard Glider
  const enterTunnel = stepGenericVehicleVaultTunnel({
    x: VAULT_HOME_TUNNEL_X,
    z: VAULT_HOME_TUNNEL_MOUTH_Z - 1.5,
    heading: Math.PI,
    speed: 14,
    inVault: false,
    exitGateProgress: 1,
    hatchOpenProgress: 1,
    margin: 1.5,
  });
  assert.equal(enterTunnel.inVault, true, 'Hoverboard Glider must enter the Secret Underground Tunnel cleanly');
  assert.equal(enterTunnel.enteredVault, true);

  const undergroundGlider = {
    ...glider,
    x: VAULT_HOME_TUNNEL_X,
    y: VAULT_FLOOR_Y + 1.2,
    z: VAULT_MEGA_START_Z - 40,
    inVault: true,
    vy: 0,
  };
  for (let i = 0; i < 40; i++) {
    stepHoverGlider(
      undergroundGlider,
      { forward: 1, turn: 0, boost: false, ascend: true, descend: false, brake: false, cameraPitch: -0.4 },
      0.04,
      i * 0.04,
      true,
      () => VAULT_FLOOR_Y,
      VAULT_FLOOR_Y + VAULT_HEIGHT - 2.0
    );
  }
  assert.ok(
    undergroundGlider.y <= VAULT_FLOOR_Y + VAULT_HEIGHT - 1.9 && undergroundGlider.y >= VAULT_FLOOR_Y + 0.4,
    `Underground glider altitude must stay clamped inside the 1 KM Mega-Chamber ceiling/floor, got ${undergroundGlider.y}`
  );
});

test('76. Universal Camera-Directed 3D Look-to-Fly: Superheroes & ALL flying craft climb/dive without pressing Up/Down buttons', () => {
  // 1. Pure Look-to-Fly math contract:
  //    Looking UP (negative camPitch) + W => positive verticalRate (climb)
  //    Looking LEVEL (inside deadzone) + W => 0 verticalRate (level cruise)
  //    Looking DOWN (positive camPitch) + W => negative verticalRate (dive)
  //    Standing still (forward=0) => 0 verticalRate even when looking up/down
  const climb = computeLookToFlyVerticalRate(-0.58, 1.0);
  const level = computeLookToFlyVerticalRate(0.18, 1.0);
  const dive = computeLookToFlyVerticalRate(0.78, 1.0);
  const idleLookUp = computeLookToFlyVerticalRate(-0.58, 0.0);

  assert.equal(climb.active, true);
  assert.ok(climb.verticalRate > 8, `Looking skyward + W should climb strongly, got ${climb.verticalRate}`);
  assert.equal(level.active, false);
  assert.equal(level.verticalRate, 0, 'Looking level inside deadzone must fly rock-steady level');
  assert.equal(dive.active, true);
  assert.ok(dive.verticalRate < -8, `Looking earthward + W should dive strongly, got ${dive.verticalRate}`);
  assert.equal(idleLookUp.verticalRate, 0, 'Looking up without forward thrust must not drift upward');

  // 2. Hoverboard Glider climbs & dives purely via cameraPitch + forward (ascend=false, descend=false)
  const glider = createInitialHoverGliderState();
  const gliderStartY = glider.y;
  for (let i = 0; i < 90; i++) {
    stepHoverGlider(
      glider,
      { forward: 1, turn: 0, boost: false, ascend: false, descend: false, brake: false, cameraPitch: -0.58 },
      0.03,
      i * 0.03,
      true
    );
  }
  const gliderPeakY = glider.y;
  assert.ok(gliderPeakY > gliderStartY + 12, `Hover Glider must climb via Look-Up + W, delta=${(gliderPeakY - gliderStartY).toFixed(2)}m`);
  for (let i = 0; i < 70; i++) {
    stepHoverGlider(
      glider,
      { forward: 1, turn: 0, boost: false, ascend: false, descend: false, brake: false, cameraPitch: 0.78 },
      0.03,
      3 + i * 0.03,
      true
    );
  }
  assert.ok(glider.y < gliderPeakY - 8, `Hover Glider must dive via Look-Down + W, drop=${(gliderPeakY - glider.y).toFixed(2)}m`);

  // 3. VTOL Aircraft lifts off, climbs & dives purely via cameraPitch + forward
  const vtol = createInitialVtolAircraftState();
  const vtolStartY = vtol.y;
  for (let i = 0; i < 100; i++) {
    stepVtolAircraft(
      vtol,
      { forward: 1, turn: 0, boost: false, ascend: false, descend: false, brake: false, cameraPitch: -0.58 },
      0.03,
      i * 0.03,
      'clear',
      true
    );
  }
  const vtolPeakY = vtol.y;
  assert.ok(vtolPeakY > vtolStartY + 10, `VTOL must auto-lift & climb via Look-Up + W, delta=${(vtolPeakY - vtolStartY).toFixed(2)}m`);
  for (let i = 0; i < 70; i++) {
    stepVtolAircraft(
      vtol,
      { forward: 1, turn: 0, boost: false, ascend: false, descend: false, brake: false, cameraPitch: 0.78 },
      0.03,
      4 + i * 0.03,
      'clear',
      true
    );
  }
  assert.ok(vtol.y < vtolPeakY - 8, `VTOL must dive via Look-Down + W, drop=${(vtolPeakY - vtol.y).toFixed(2)}m`);

  // 4. Orange Rescue Helicopter climbs & dives purely via cameraPitch + forward
  let heli = createInitialOrangeHeliState();
  const heliStartY = heli.y;
  for (let i = 0; i < 90; i++) {
    heli = stepOrangeHeliState(heli, 1, 0, false, false, false, true, 0.03, undefined, undefined, -0.58);
  }
  const heliPeakY = heli.y;
  assert.ok(heliPeakY > heliStartY + 12, `Orange Helicopter must climb via Look-Up + W, delta=${(heliPeakY - heliStartY).toFixed(2)}m`);
  for (let i = 0; i < 65; i++) {
    heli = stepOrangeHeliState(heli, 1, 0, false, false, false, true, 0.03, undefined, undefined, 0.78);
  }
  assert.ok(heli.y < heliPeakY - 8, `Orange Helicopter must dive via Look-Down + W, drop=${(heliPeakY - heli.y).toFixed(2)}m`);

  // 5. Tropical Sky Explorer climbs & dives purely via cameraPitch + forward
  let sky = createInitialSkyExplorerState();
  const skyStartY = sky.y;
  for (let i = 0; i < 90; i++) {
    sky = stepSkyExplorerState(sky, 1, 0, false, false, false, 0.03, undefined, undefined, -0.58);
  }
  const skyPeakY = sky.y;
  assert.ok(skyPeakY > skyStartY + 12, `Sky Explorer must climb via Look-Up + W, delta=${(skyPeakY - skyStartY).toFixed(2)}m`);
  for (let i = 0; i < 65; i++) {
    sky = stepSkyExplorerState(sky, 1, 0, false, false, false, 0.03, undefined, undefined, 0.78);
  }
  assert.ok(sky.y < skyPeakY - 8, `Sky Explorer must dive via Look-Down + W, drop=${(skyPeakY - sky.y).toFixed(2)}m`);

  // 6. DL-787 Airliner climbs once at takeoff speed & dives via cameraPitch + forward
  let jet = createInitialAirlinerState();
  jet = { ...jet, speed: 46, landingGearDown: false, y: AIRPORT_GROUND_Y + 25 };
  const jetStartY = jet.y;
  for (let i = 0; i < 60; i++) {
    jet = stepAirlinerState(jet, 1, 0, false, false, false, 0.03, () => AIRPORT_GROUND_Y, 425, -0.58);
  }
  const jetPeakY = jet.y;
  assert.ok(jetPeakY > jetStartY + 8, `Airliner must climb via Look-Up + W, delta=${(jetPeakY - jetStartY).toFixed(2)}m`);
  for (let i = 0; i < 55; i++) {
    jet = stepAirlinerState(jet, 1, 0, false, false, false, 0.03, () => AIRPORT_GROUND_Y, 425, 0.78);
  }
  assert.ok(jet.y < jetPeakY - 6, `Airliner must dive via Look-Down + W, drop=${(jetPeakY - jet.y).toFixed(2)}m`);
});







