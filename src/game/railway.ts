import type {
  StationStop,
  TrainBoardingStatus,
  TrainRoutePlan,
  TrainState,
} from './types';
import { registerRailSamplesForTerrain } from './terrain';
import { normalizeHours } from './timeWeather';
import { DINOSAUR_STATION_APPROX } from './dinosaurIsland';
import { EXHIBITION_STATION_POS } from './exhibitionComplex';

export interface SplinePoint {
  x: number;
  y: number;
  z: number;
  tx: number; // unit tangent x
  tz: number; // unit tangent z
  angle: number; // heading in radians (atan2(tx, tz))
}

export const DREAMLINE_TRAIN_NAME = 'Dreamline Scenic Express';
export const DREAMLINE_TRAIN_NUMBER = 'DL-402';

/**
 * Control points for the closed scenic railway loop (clockwise).
 * Links all 6 stations in order:
 * 1. ஷவீஷ் ஜெஷுருன் சா (0, 9.6) — Main Blossom Valley Station
 * 2. Pachai Meadow Halt (38, 12.0) — Golden Countryside Fields
 * 3. SSJ Dinosaur Island (150, 56.0) — Offshore Sea Island via the Ocean Railway Bridge!
 * 4. Neelam Lakeside (56.5, -5.5) — Mirror Lake & Campsite Shore
 * 5. Thendral Malai Halt (-18, -56.2) — Stone Tunnel Foothill Stop
 * 6. Iceland Express Halt (-46.5, -24.0) — Northwest Glacier Gateway into Panimalai Iceland!
 */
const CONTROL_POINTS: Array<{ x: number; z: number }> = [
  { x: -16, z: 9.6 },
  { x: 0, z: 9.6 },
  { x: 18, z: 9.8 },
  { x: 38, z: 12.0 },
  { x: 68, z: 24.0 },
  { x: 96, z: 54.0 },
  { x: 122, z: 102.0 },
  { x: 146, z: 158.0 },
  { x: 174, z: 198.0 },
  { x: 204, z: 210.0 }, // Universal Exhibition Complex Ocean Station!
  { x: 242, z: 206.0 },
  { x: 270, z: 182.0 },
  { x: 274, z: 144.0 },
  { x: 280, z: 106.0 }, // SSJ Dinosaur Island Station!
  { x: 292, z: 82.0 },
  { x: 266, z: 58.0 },
  { x: 216, z: 40.0 },
  { x: 158, z: 22.0 },
  { x: 104, z: 8.5 },
  { x: 64, z: 3.5 },
  { x: 56.5, z: -5.5 },
  { x: 52, z: -26.0 },
  { x: 40, z: -48.0 },
  { x: 16, z: -61.5 },
  { x: -18, z: -56.2 },
  { x: -38, z: -42.0 },
  { x: -48, z: -18.0 },
  { x: -44, z: 3.5 },
  { x: -30, z: 9.2 },
];

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const TABLE_SIZE = 1600;

interface LutEntry {
  x: number;
  z: number;
  arcLen: number;
}

const rawSamples: LutEntry[] = [];
let totalLength = 0;

(function buildRailLut() {
  const n = CONTROL_POINTS.length;
  let prevX = 0;
  let prevZ = 0;
  for (let i = 0; i <= TABLE_SIZE; i++) {
    const u = (i / TABLE_SIZE) * n;
    const seg = Math.floor(u) % n;
    const localT = u - Math.floor(u);

    const p0 = CONTROL_POINTS[(seg - 1 + n) % n];
    const p1 = CONTROL_POINTS[seg];
    const p2 = CONTROL_POINTS[(seg + 1) % n];
    const p3 = CONTROL_POINTS[(seg + 2) % n];

    const x = catmullRom(p0.x, p1.x, p2.x, p3.x, localT);
    const z = catmullRom(p0.z, p1.z, p2.z, p3.z, localT);

    if (i > 0) {
      totalLength += Math.hypot(x - prevX, z - prevZ);
    }
    rawSamples.push({ x, z, arcLen: totalLength });
    prevX = x;
    prevZ = z;
  }

  const terrainSamples = [];
  for (let i = 0; i < TABLE_SIZE; i += 4) {
    terrainSamples.push({ x: rawSamples[i].x, z: rawSamples[i].z });
  }
  registerRailSamplesForTerrain(terrainSamples);
})();

export const RAILWAY_TOTAL_LENGTH = totalLength;

export function wrapT(t: number): number {
  const r = t % 1;
  return r < 0 ? r + 1 : r;
}

export function forwardDeltaT(fromT: number, toT: number): number {
  const d = wrapT(toT) - wrapT(fromT);
  return d >= 0 ? d : d + 1;
}

export function sampleRailway(tNormalized: number): SplinePoint {
  const t = wrapT(tNormalized);
  const targetLen = t * totalLength;

  let lo = 0;
  let hi = TABLE_SIZE;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (rawSamples[mid].arcLen <= targetLen) lo = mid;
    else hi = mid;
  }

  const a = rawSamples[lo];
  const b = rawSamples[hi];
  const span = Math.max(1e-6, b.arcLen - a.arcLen);
  const f = (targetLen - a.arcLen) / span;
  const x = a.x + (b.x - a.x) * f;
  const z = a.z + (b.z - a.z) * f;

  const idxNext = (lo + 2) % TABLE_SIZE;
  const idxPrev = (lo - 2 + TABLE_SIZE) % TABLE_SIZE;
  const dx = rawSamples[idxNext].x - rawSamples[idxPrev].x;
  const dz = rawSamples[idxNext].z - rawSamples[idxPrev].z;
  const len = Math.max(1e-6, Math.hypot(dx, dz));
  const tx = dx / len;
  const tz = dz / len;
  const y = 0.14;

  return {
    x,
    y,
    z,
    tx,
    tz,
    angle: Math.atan2(tx, tz),
  };
}

export function findClosestSplineT(targetX: number, targetZ: number): number {
  let bestIdx = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < TABLE_SIZE; i++) {
    const p = rawSamples[i];
    const dSq = (p.x - targetX) ** 2 + (p.z - targetZ) ** 2;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }
  return rawSamples[bestIdx].arcLen / totalLength;
}

function makeStationStop(
  id: string,
  name: string,
  jpName: string,
  regionTag: string,
  approxX: number,
  approxZ: number,
  platformSide: 1 | -1,
  connectsToIceland = false,
  isDinosaurIsland = false
): StationStop {
  const splineT = findClosestSplineT(approxX, approxZ);
  const sample = sampleRailway(splineT);
  const nx = -sample.tz * platformSide;
  const nz = sample.tx * platformSide;
  const offset = 4.4;
  return {
    id,
    name,
    jpName,
    regionTag,
    connectsToIceland,
    isDinosaurIsland,
    splineT,
    platformSide,
    worldX: sample.x,
    worldZ: sample.z,
    platformX: sample.x + nx * offset,
    platformZ: sample.z + nz * offset,
    tangentAngle: sample.angle,
  };
}

export const STATIONS: StationStop[] = [
  makeStationStop(
    'sakuragawa_station',
    'ஷவீஷ் ஜெஷுருன் சா',
    'ஷவீஷ் ஜெஷுருன் சா நிலையம்',
    'Blossom Valley',
    0,
    9.6,
    1
  ),
  makeStationStop(
    'pachai_meadow_halt',
    'Pachai Meadow Halt',
    'பச்சை வயல் நிறுத்தம்',
    'Green Countryside',
    35.5,
    11.8,
    1
  ),
  makeStationStop(
    'exhibition_complex_station',
    'Universal Exhibition Complex',
    'உலக போக்குவரத்து கண்காட்சி',
    'Ocean Showroom · Hangar & Marina',
    EXHIBITION_STATION_POS.x,
    EXHIBITION_STATION_POS.z,
    1
  ),
  makeStationStop(
    'dinosaur_island_station',
    'SSJ Dinosaur Island',
    'டைனோசர் தீவு நிலையம்',
    'Sea Island · T-Rex Arena',
    DINOSAUR_STATION_APPROX.x,
    DINOSAUR_STATION_APPROX.z,
    1,
    false,
    true
  ),
  makeStationStop(
    'aomizu_lakeside',
    'Neelam Lakeside',
    'நீலம் ஏரி',
    'Lake & Campsite',
    56.5,
    -5.5,
    -1
  ),
  makeStationStop(
    'kaze_no_oka',
    'Thendral Malai Halt',
    'தென்றல் மலை',
    'Tunnel Foothills',
    -18,
    -56.2,
    -1
  ),
  makeStationStop(
    'iceland_gateway',
    'Iceland Express Halt',
    'ஐஸ்லாந்து நுழைவு',
    'Iceland Glacier Transfer',
    -46.5,
    -24.0,
    1,
    true
  ),
].sort((a, b) => a.splineT - b.splineT);

export const CROSSING_POINT = sampleRailway(findClosestSplineT(-25, 9.4));

export const TRAIN_CRUISE_MPS = 18.5;
export const TRAIN_DRIVER_MAX_MPS = 26.5; // ~95 km/h top speed in manual Driver Mode
export const TRAIN_DRIVER_MAX_REVERSE_MPS = -9.0; // ~32 km/h gentle reverse
export const TRAIN_MAX_SPEED_T = TRAIN_CRUISE_MPS / RAILWAY_TOTAL_LENGTH;
export const STATION_DWELL_SECONDS = 12.0;
export const APPROACH_DISTANCE_M = 34.0;
export const APPROACH_DISTANCE_T = APPROACH_DISTANCE_M / RAILWAY_TOTAL_LENGTH;

/**
 * Returns all upcoming station indices in clockwise route order starting right after originIndex.
 */
export function getOrderedUpcomingStations(originIndex: number): number[] {
  const n = STATIONS.length;
  const list: number[] = [];
  for (let offset = 1; offset < n; offset++) {
    list.push((originIndex + offset) % n);
  }
  return list;
}

/**
 * Computes total forward track distance (meters) from station A to station B along the closed loop.
 */
export function getTrackDistanceBetweenStations(fromIndex: number, toIndex: number): number {
  if (fromIndex === toIndex) return RAILWAY_TOTAL_LENGTH;
  const dt = forwardDeltaT(STATIONS[fromIndex].splineT, STATIONS[toIndex].splineT);
  return dt * RAILWAY_TOTAL_LENGTH;
}

/**
 * Builds a validated, single-source-of-truth TrainRoutePlan from player-selected stops & destination.
 * - Intermediate stops AFTER the destination are automatically excluded.
 * - The destination is always included as the final entry of `selectedStopIndices`.
 */
export function createTrainRoutePlan(
  originStationIndex: number,
  chosenIntermediateIndices: number[],
  destinationIndex: number,
  currentTimeHours: number
): TrainRoutePlan {
  const orderedAll = getOrderedUpcomingStations(originStationIndex);
  const destPos = orderedAll.indexOf(destinationIndex);
  const validDestPos = destPos >= 0 ? destPos : orderedAll.length - 1;
  const validDestinationIndex = orderedAll[validDestPos];

  // Stations from origin -> destination along the loop (inclusive of destination)
  const allUpcomingIndices = orderedAll.slice(0, validDestPos + 1);
  const chosenSet = new Set(chosenIntermediateIndices);
  chosenSet.add(validDestinationIndex);

  const selectedStopIndices = allUpcomingIndices.filter((idx) => chosenSet.has(idx));
  const totalRouteMeters = getTrackDistanceBetweenStations(
    originStationIndex,
    validDestinationIndex
  );

  // Estimate travel minutes in-world (each intermediate stop adds gentle dwell time)
  const intermediateCount = Math.max(0, selectedStopIndices.length - 1);
  const travelSeconds = totalRouteMeters / (TRAIN_CRUISE_MPS * 0.84) + intermediateCount * (STATION_DWELL_SECONDS + 3.5);
  // Map real travel seconds to scenic timetable minutes (minimum +4 min, scaled smoothly)
  const timetableMinutes = Math.max(4, Math.round(travelSeconds * 0.45));
  const departureTimeHours = normalizeHours(currentTimeHours);
  const estimatedArrivalTimeHours = normalizeHours(currentTimeHours + timetableMinutes / 60);

  const includesIcelandTransfer = selectedStopIndices.some(
    (idx) => STATIONS[idx]?.connectsToIceland
  );

  return {
    id: `RT-${originStationIndex}-${validDestinationIndex}-${selectedStopIndices.join('')}-${Math.round(currentTimeHours * 100)}`,
    originStationIndex,
    selectedStopIndices,
    destinationIndex: validDestinationIndex,
    allUpcomingIndices,
    visitedStopIndices: [],
    skippedStopIndices: [],
    status: 'active',
    departureTimeHours,
    estimatedArrivalTimeHours,
    totalRouteMeters,
    remainingMeters: totalRouteMeters,
    includesIcelandTransfer,
  };
}

function computeBoardingStatus(
  phase: TrainState['phase'],
  doorOpen: number,
  dwellTimer: number,
  dwellHold: boolean
): TrainBoardingStatus {
  if (phase === 'approaching') return 'arriving';
  if (phase === 'departing') return 'departing';
  if (phase === 'stopped') {
    if (dwellHold) return 'waiting';
    if (doorOpen >= 0.35 && dwellTimer < STATION_DWELL_SECONDS - 2.2) return 'boarding';
    return 'departing';
  }
  return 'in_transit';
}

export function createInitialTrainState(): TrainState {
  const sakuragawaIdx = STATIONS.findIndex((s) => s.id === 'sakuragawa_station');
  const stopIdx = sakuragawaIdx >= 0 ? sakuragawaIdx : 0;
  const startT = wrapT(STATIONS[stopIdx].splineT - 0.008);
  const sample = sampleRailway(startT);

  return {
    trainName: DREAMLINE_TRAIN_NAME,
    trainNumber: DREAMLINE_TRAIN_NUMBER,
    t: startT,
    speed: TRAIN_MAX_SPEED_T * 0.36,
    speedKmh: Math.round(TRAIN_CRUISE_MPS * 0.36 * 3.6),
    phase: 'approaching',
    boardingStatus: 'arriving',
    doorOpen: 0,
    dwellTimer: 0,
    dwellHold: false,
    currentStationIndex: (stopIdx - 1 + STATIONS.length) % STATIONS.length,
    nextStationIndex: stopIdx,
    etaSeconds: 0.9,
    worldX: sample.x,
    worldZ: sample.z,
    heading: sample.angle,
    routePlan: null,
    lastPassedStationIndex: null,
    journeyProgress: 0,
  };
}

/**
 * Applies a player-confirmed route plan to the train state and prepares smooth departure.
 */
export function applyTrainRoutePlan(
  state: TrainState,
  routePlan: TrainRoutePlan
): TrainState {
  const firstSelectedStop = routePlan.selectedStopIndices[0] ?? routePlan.destinationIndex;
  const nextDwellTimer =
    state.phase === 'stopped' ? Math.max(state.dwellTimer, STATION_DWELL_SECONDS - 1.35) : state.dwellTimer;

  return {
    ...state,
    routePlan: {
      ...routePlan,
      visitedStopIndices: [...routePlan.visitedStopIndices],
      skippedStopIndices: [...routePlan.skippedStopIndices],
    },
    nextStationIndex: firstSelectedStop,
    dwellHold: false,
    dwellTimer: nextDwellTimer,
    lastPassedStationIndex: null,
    journeyProgress: 0,
    boardingStatus: computeBoardingStatus(state.phase, state.doorOpen, nextDwellTimer, false),
  };
}

function didPassSplineT(prevT: number, nextT: number, targetT: number): boolean {
  const step = forwardDeltaT(prevT, nextT);
  if (step <= 0 || step > 0.25) return false;
  const distToTarget = forwardDeltaT(prevT, targetT);
  return distToTarget > 1e-6 && distToTarget <= step + 1e-6;
}

export function stepTrainState(state: TrainState, dt: number): TrainState {
  const clampedDt = Math.min(Math.max(dt, 0), 0.1);
  let {
    t,
    speed,
    phase,
    doorOpen,
    dwellTimer,
    dwellHold,
    currentStationIndex,
    nextStationIndex,
    lastPassedStationIndex,
  } = state;

  let routePlan: TrainRoutePlan | null = state.routePlan
    ? {
        ...state.routePlan,
        selectedStopIndices: [...state.routePlan.selectedStopIndices],
        allUpcomingIndices: [...state.routePlan.allUpcomingIndices],
        visitedStopIndices: [...state.routePlan.visitedStopIndices],
        skippedStopIndices: [...state.routePlan.skippedStopIndices],
      }
    : null;

  const prevT = t;
  const nextStation = STATIONS[nextStationIndex] ?? STATIONS[0];
  const distToNextT = forwardDeltaT(t, nextStation.splineT);
  const distToNextM = distToNextT * RAILWAY_TOTAL_LENGTH;

  if (phase === 'stopped') {
    speed = 0;
    if (dwellHold) {
      // Hold patiently with doors open while the player selects stations on the route screen
      doorOpen = Math.min(1, doorOpen + clampedDt * 1.4);
    } else if (routePlan && routePlan.status === 'completed') {
      // At final destination: keep doors open comfortably until player exits or picks a new route
      doorOpen = Math.min(1, doorOpen + clampedDt * 1.3);
      dwellTimer = Math.min(STATION_DWELL_SECONDS * 0.5, dwellTimer + clampedDt);
    } else {
      dwellTimer += clampedDt;
      if (dwellTimer < STATION_DWELL_SECONDS - 1.5) {
        doorOpen = Math.min(1, doorOpen + clampedDt * 1.15);
      } else {
        doorOpen = Math.max(0, doorOpen - clampedDt * 1.15);
      }
      if (dwellTimer >= STATION_DWELL_SECONDS) {
        doorOpen = 0;
        dwellTimer = 0;
        phase = 'departing';

        if (routePlan && routePlan.status === 'active') {
          // Depart from currentStationIndex toward the NEXT unvisited player-selected stop
          const remainingStops = routePlan.selectedStopIndices.filter(
            (idx) => !routePlan!.visitedStopIndices.includes(idx) && idx !== currentStationIndex
          );
          if (remainingStops.length > 0) {
            nextStationIndex = remainingStops[0];
          } else {
            nextStationIndex = (currentStationIndex + 1) % STATIONS.length;
          }
        } else {
          currentStationIndex = nextStationIndex;
          nextStationIndex = (currentStationIndex + 1) % STATIONS.length;
        }
      }
    }
  } else if (phase === 'departing') {
    doorOpen = Math.max(0, doorOpen - clampedDt * 1.8);
    const accel = TRAIN_MAX_SPEED_T * 0.34;
    speed = Math.min(TRAIN_MAX_SPEED_T, speed + accel * clampedDt);
    t = wrapT(t + speed * clampedDt);
    if (distToNextT <= APPROACH_DISTANCE_T) {
      phase = 'approaching';
    } else if (speed >= TRAIN_MAX_SPEED_T * 0.96) {
      phase = 'cruising';
    }
  } else if (phase === 'cruising') {
    doorOpen = 0;
    speed = speed + (TRAIN_MAX_SPEED_T - speed) * Math.min(1, clampedDt * 2.2);
    t = wrapT(t + speed * clampedDt);
    if (distToNextT <= APPROACH_DISTANCE_T) {
      phase = 'approaching';
    }
  } else if (phase === 'approaching') {
    doorOpen = 0;
    const desiredMps = Math.max(
      1.3,
      Math.sqrt(Math.max(0, distToNextM) / APPROACH_DISTANCE_M) * TRAIN_CRUISE_MPS
    );
    const desiredT = desiredMps / RAILWAY_TOTAL_LENGTH;
    speed = speed + (desiredT - speed) * Math.min(1, clampedDt * 4.5);
    const stepT = speed * clampedDt;

    if (stepT >= distToNextT || distToNextM < 0.45) {
      t = nextStation.splineT;
      speed = 0;
      phase = 'stopped';
      dwellTimer = 0;
      currentStationIndex = nextStationIndex;

      if (routePlan && routePlan.status === 'active') {
        if (!routePlan.visitedStopIndices.includes(currentStationIndex)) {
          routePlan.visitedStopIndices.push(currentStationIndex);
        }
        if (currentStationIndex === routePlan.destinationIndex) {
          routePlan.status = 'completed';
          routePlan.remainingMeters = 0;
        }
      }
    } else {
      t = wrapT(t + stepT);
    }
  }

  // Record any unselected stations smoothly passed at cruising speed without stopping!
  if (routePlan && routePlan.status === 'active' && phase !== 'stopped') {
    for (const stIdx of routePlan.allUpcomingIndices) {
      if (
        !routePlan.selectedStopIndices.includes(stIdx) &&
        !routePlan.skippedStopIndices.includes(stIdx)
      ) {
        if (didPassSplineT(prevT, t, STATIONS[stIdx].splineT)) {
          routePlan.skippedStopIndices.push(stIdx);
          lastPassedStationIndex = stIdx;
        }
      }
    }
  }

  // Compute accurate journey progress for ticket + HUD synchronization
  let journeyProgress = state.journeyProgress;
  if (routePlan) {
    if (routePlan.status === 'completed') {
      journeyProgress = 1;
      routePlan.remainingMeters = 0;
    } else {
      const destT = STATIONS[routePlan.destinationIndex].splineT;
      const remMeters = forwardDeltaT(t, destT) * RAILWAY_TOTAL_LENGTH;
      // Avoid wrap spike at exact origin before leaving
      const clampedRem = Math.min(routePlan.totalRouteMeters, remMeters);
      routePlan.remainingMeters = clampedRem;
      journeyProgress =
        routePlan.totalRouteMeters > 1
          ? Math.max(0, Math.min(1, 1 - clampedRem / routePlan.totalRouteMeters))
          : 0;
    }
  } else {
    journeyProgress = 0;
  }

  const sample = sampleRailway(t);
  const finalNextDistM =
    forwardDeltaT(t, (STATIONS[nextStationIndex] ?? STATIONS[0]).splineT) * RAILWAY_TOTAL_LENGTH;
  const speedMps = speed * RAILWAY_TOTAL_LENGTH;
  const etaSeconds =
    phase === 'stopped'
      ? dwellHold || routePlan?.status === 'completed'
        ? 0
        : Math.max(0, STATION_DWELL_SECONDS - dwellTimer)
      : finalNextDistM / Math.max(2.5, speedMps > 1 ? speedMps : TRAIN_CRUISE_MPS * 0.65);

  const boardingStatus = computeBoardingStatus(phase, doorOpen, dwellTimer, dwellHold);

  return {
    trainName: state.trainName,
    trainNumber: state.trainNumber,
    t,
    speed,
    speedKmh: Math.round(speedMps * 3.6),
    phase,
    boardingStatus,
    doorOpen,
    dwellTimer,
    dwellHold,
    currentStationIndex,
    nextStationIndex,
    etaSeconds,
    worldX: sample.x,
    worldZ: sample.z,
    heading: sample.angle,
    routePlan,
    lastPassedStationIndex,
    journeyProgress,
  };
}

export function findNearbyStationIndex(playerX: number, playerZ: number, radius = 16.5): number | null {
  let bestIdx: number | null = null;
  let bestDist = radius;
  for (let i = 0; i < STATIONS.length; i++) {
    const st = STATIONS[i];
    const d = Math.hypot(playerX - st.platformX, playerZ - st.platformZ);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function canBoardTrain(
  train: TrainState,
  playerX: number,
  playerZ: number
): boolean {
  if (train.phase !== 'stopped' || train.doorOpen < 0.35) return false;
  const dist = Math.hypot(playerX - train.worldX, playerZ - train.worldZ);
  return dist < 13.5;
}

export function getDisembarkPosition(train: TrainState): { x: number; z: number; heading: number } {
  const station = STATIONS[train.currentStationIndex] ?? STATIONS[0];
  return {
    x: station.platformX,
    z: station.platformZ,
    heading: station.tangentAngle + Math.PI * 0.5 * station.platformSide,
  };
}

/**
 * Manual Train Driver Mode physics along the curved DREAMLINE railway loop.
 * Supports smooth forward throttle (up to ~95 km/h), gentle reverse, emergency brake,
 * automatic nearest-station tracking, and manual door control when stopped!
 */
export function stepTrainManualDrive(
  state: TrainState,
  throttleInput: number, // -1 (reverse/brake) .. +1 (forward)
  brakePressed: boolean,
  doorsOpenRequested: boolean,
  dt: number
): TrainState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let speedMps = state.speed * RAILWAY_TOTAL_LENGTH;
  let doorOpen = state.doorOpen;

  if (brakePressed) {
    // Strong service brake
    const decel = 14.5 * cdt;
    if (Math.abs(speedMps) <= decel) speedMps = 0;
    else speedMps -= Math.sign(speedMps) * decel;
  } else if (Math.abs(throttleInput) > 0.04) {
    // Close doors automatically when applying throttle
    if (doorOpen > 0.05) {
      doorOpen = Math.max(0, doorOpen - cdt * 2.5);
    }
    const accelRate = throttleInput > 0 ? 9.2 : 10.5;
    speedMps += throttleInput * accelRate * cdt;
    speedMps = Math.max(TRAIN_DRIVER_MAX_REVERSE_MPS, Math.min(TRAIN_DRIVER_MAX_MPS, speedMps));
  } else {
    // Smooth railway rolling coast drag
    const drag = 1.85 * cdt;
    if (Math.abs(speedMps) <= drag) speedMps = 0;
    else speedMps -= Math.sign(speedMps) * drag;
  }

  const speedT = speedMps / RAILWAY_TOTAL_LENGTH;
  const t = wrapT(state.t + speedT * cdt);
  const absMps = Math.abs(speedMps);

  // Doors can only stay open when nearly stationary
  if (absMps < 0.8 && doorsOpenRequested) {
    doorOpen = Math.min(1, doorOpen + cdt * 1.8);
  } else if (absMps >= 0.8 || !doorsOpenRequested) {
    doorOpen = Math.max(0, doorOpen - cdt * 2.0);
  }

  // Find closest station & next upcoming station along forward loop
  let nearestIdx = state.currentStationIndex;
  let nearestDistM = Infinity;
  let nextIdx = state.nextStationIndex;
  let bestForwardM = Infinity;
  for (let i = 0; i < STATIONS.length; i++) {
    const fwdM = forwardDeltaT(t, STATIONS[i].splineT) * RAILWAY_TOTAL_LENGTH;
    const bwdM = RAILWAY_TOTAL_LENGTH - fwdM;
    const minD = Math.min(fwdM, bwdM);
    if (minD < nearestDistM) {
      nearestDistM = minD;
      nearestIdx = i;
    }
    if (fwdM > 2.5 && fwdM < bestForwardM) {
      bestForwardM = fwdM;
      nextIdx = i;
    }
  }

  const phase: TrainState['phase'] =
    absMps < 0.45 ? 'stopped' : bestForwardM < APPROACH_DISTANCE_M ? 'approaching' : 'cruising';
  const boardingStatus: TrainBoardingStatus =
    phase === 'stopped' ? (doorOpen >= 0.35 ? 'boarding' : 'waiting') : 'in_transit';

  const sample = sampleRailway(t);
  const etaSeconds =
    phase === 'stopped' ? 0 : bestForwardM / Math.max(2.5, Math.max(absMps, TRAIN_CRUISE_MPS * 0.5));

  return {
    ...state,
    t,
    speed: speedT,
    speedKmh: Math.round(absMps * 3.6),
    phase,
    boardingStatus,
    doorOpen,
    dwellTimer: 0,
    dwellHold: true,
    currentStationIndex: nearestIdx,
    nextStationIndex: nextIdx,
    etaSeconds,
    worldX: sample.x,
    worldZ: sample.z,
    heading: sample.angle,
  };
}
