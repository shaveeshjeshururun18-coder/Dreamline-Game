import test from 'node:test';
import assert from 'node:assert/strict';
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
  WORLD_PLAYABLE_RADIUS,
} from './terrain';
import {
  DINOSAUR_ARENA_CENTER,
  DINOSAUR_ISLAND_CENTER,
  createInitialDinosaurIslandState,
  fireDinosaurIslandAk47,
  getActiveArenaWallColliders,
  isOnDinosaurIsland,
  spawnNextDinoWave,
  stepDinosaurIslandState,
  stepSafariCarState,
} from './dinosaurIsland';
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

test('railway spline is closed, smooth, crosses the sea to Ocean Exhibition Complex & SSJ Dinosaur Island, and links all 7 stations', () => {
  assert.equal(STATIONS.length, 7);
  assert.ok(STATIONS.some((s) => s.id === 'iceland_gateway' && s.connectsToIceland));
  assert.ok(STATIONS.some((s) => s.id === 'exhibition_complex_station'));
  assert.ok(STATIONS.some((s) => s.id === 'dinosaur_island_station' && s.isDinosaurIsland));
  assert.ok(RAILWAY_TOTAL_LENGTH > 360, `Expected extended sea-bridge loop > 360m, got ${RAILWAY_TOTAL_LENGTH}`);

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
    isOceanAt(DINOSAUR_ISLAND_CENTER.x + 48, DINOSAUR_ISLAND_CENTER.z),
    true,
    'Open sea should lie east of Dinosaur Island'
  );
  assert.equal(
    isOceanAt(DINOSAUR_ISLAND_CENTER.x, DINOSAUR_ISLAND_CENTER.z + 48),
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

test('Dinosaur Island AK-47 kills T-Rex, shatters walls 1->4 sequentially, spawns endless waves, and drives Safari Car', () => {
  let state = createInitialDinosaurIslandState();
  assert.equal(state.dinoHp, 350);
  assert.equal(state.brokenWalls, 0);
  assert.equal(getActiveArenaWallColliders(state).length, 4);

  // Burst 1 deals 175 damage
  const shot1 = fireDinosaurIslandAk47(state, DINOSAUR_ARENA_CENTER.x - 4, 1.5, DINOSAUR_ARENA_CENTER.z - 4);
  assert.equal(shot1.fired, true);
  assert.equal(shot1.killedDino, false);
  assert.equal(shot1.state.dinoHp, 175);
  state = shot1.state;

  // Cooldown passes, Burst 2 finishes T-Rex (0 HP, kills=1) and starts sequential 1->4 wall destruction
  for (let i = 0; i < 8; i++) {
    state = stepDinosaurIslandState(state, DINOSAUR_ARENA_CENTER.x - 4, DINOSAUR_ARENA_CENTER.z - 4, true, 0.05).state;
  }
  const shot2 = fireDinosaurIslandAk47(state, DINOSAUR_ARENA_CENTER.x - 4, 1.5, DINOSAUR_ARENA_CENTER.z - 4);
  assert.equal(shot2.killedDino, true);
  assert.equal(shot2.state.dinoAlive, false);
  assert.equal(shot2.state.kills, 1);
  state = shot2.state;

  const brokenStages: number[] = [];
  for (let i = 0; i < 60; i++) {
    const stepped = stepDinosaurIslandState(
      state,
      DINOSAUR_ARENA_CENTER.x - 4,
      DINOSAUR_ARENA_CENTER.z - 4,
      true,
      0.05
    );
    state = stepped.state;
    if (stepped.events.wallJustBrokenStage !== null) {
      brokenStages.push(stepped.events.wallJustBrokenStage);
    }
  }
  assert.deepEqual(brokenStages, [1, 2, 3, 4], 'All 4 containment walls should break one by one in order');
  assert.equal(state.brokenWalls, 4);
  assert.equal(getActiveArenaWallColliders(state).length, 0, 'Broken walls must have zero remaining colliders');

  // Spawn Endless Wave #2
  state = spawnNextDinoWave(state, DINOSAUR_ARENA_CENTER.x, DINOSAUR_ARENA_CENTER.z);
  assert.equal(state.dinoAlive, true);
  assert.equal(state.dinoHp, 350);

  // Safari Car drives smoothly across the island and stays on dry island landmass
  let car = state.safariCar;
  const startCarX = car.x;
  const startCarZ = car.z;
  for (let i = 0; i < 40; i++) {
    car = stepSafariCarState(car, 1.0, 0.2, false, state.wallsIntact, 0.05);
  }
  const carMoved = Math.hypot(car.x - startCarX, car.z - startCarZ);
  assert.ok(carMoved > 8.0, `Expected Safari Car to drive smoothly, moved=${carMoved}`);
  assert.ok(isOnDinosaurIsland(car.x, car.z), 'Safari Car must remain safely on Dinosaur Island');
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
  assert.equal(boats.length, 5);

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
  assert.equal(SKY_TAXI_STOPS.length, 5);
  assert.ok(SKY_TAXI_STOPS.some((s) => s.id === 'sky_exhibition'));

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


