import type { BoatState, BusState, BusStop } from './types';
import { LAKE_CENTER, LAKE_RX, LAKE_RZ } from './terrain';
import { DINOSAUR_HEADLAND_CENTER, DINOSAUR_ISLAND_CENTER } from './dinosaurIsland';
import { clampToBusDrivablePoint } from './busHailing';
import {
  EXHIBITION_BUS_STOP_POS,
  isInsideExhibitionIsland,
  isOnExhibitionMarinaPier,
  registerBusRoadSamplesForTerrain,
} from './exhibitionComplex';

// Moored right beside Kadalkarai Shore Timber Boarding Pier (x: 103.5..123.0, z: 46.2..51.0)
export const SOVEREIGN_SHORE_BERTH = {
  x: 126.8,
  z: 48.6,
  heading: 0.12,
  exitX: 120.8,
  exitZ: 48.6,
};

export interface RoadPoint {
  x: number;
  z: number;
  tx: number;
  tz: number;
  angle: number;
}

/**
 * Closed scenic countryside road loop for the Dreamline Rural Bus:
 * Connects Poongavanam Plaza -> En Illam (My Home) -> Nila Gramam -> Pachai Vayal -> Kadalkarai Coast Bus Stop -> back to Poongavanam!
 */
const BUS_ROAD_CONTROL: Array<{ x: number; z: number }> = [
  { x: 0, z: 29 }, // Poongavanam Station Front Road
  { x: -16, z: 28 },
  { x: -34, z: 26 }, // Nila Gramam Road
  { x: -42, z: 48 },
  { x: -24, z: 74 }, // Pachai Vayal Countryside Road
  { x: 14, z: 84 },
  { x: 50, z: 96 },
  { x: 80, z: 126 }, // Southern Coastal Approach to Ocean Causeway
  { x: 108, z: 170 }, // Ocean Highway Causeway Bridge (Southbound)
  { x: 136, z: 210 },
  { x: 164, z: 226 }, // Universal Exhibition Complex Drop-Off Stop!
  { x: 168, z: 204 }, // Ocean Causeway Return Bridge (Northbound)
  { x: 144, z: 164 },
  { x: 122, z: 122 },
  { x: 100, z: 86 },
  { x: 86, z: 62 }, // Kadalkarai Coastal Boulevard
  { x: 84, z: 36 },
  { x: 52, z: 28 },
  { x: 24, z: 29 },
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

const ROAD_TABLE_SIZE = 420;
const roadLut: Array<{ x: number; z: number; arcLen: number }> = [];
let busRoadTotalLength = 0;

(function buildBusRoadLut() {
  const n = BUS_ROAD_CONTROL.length;
  let prevX = 0;
  let prevZ = 0;
  for (let i = 0; i <= ROAD_TABLE_SIZE; i++) {
    const u = (i / ROAD_TABLE_SIZE) * n;
    const seg = Math.floor(u) % n;
    const lt = u - Math.floor(u);
    const p0 = BUS_ROAD_CONTROL[(seg - 1 + n) % n];
    const p1 = BUS_ROAD_CONTROL[seg];
    const p2 = BUS_ROAD_CONTROL[(seg + 1) % n];
    const p3 = BUS_ROAD_CONTROL[(seg + 2) % n];
    const x = catmullRom(p0.x, p1.x, p2.x, p3.x, lt);
    const z = catmullRom(p0.z, p1.z, p2.z, p3.z, lt);
    if (i > 0) busRoadTotalLength += Math.hypot(x - prevX, z - prevZ);
    roadLut.push({ x, z, arcLen: busRoadTotalLength });
    prevX = x;
    prevZ = z;
  }
  const causewaySamples: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < ROAD_TABLE_SIZE; i += 2) {
    causewaySamples.push({ x: roadLut[i].x, z: roadLut[i].z });
  }
  registerBusRoadSamplesForTerrain(causewaySamples);
})();

export const BUS_ROAD_LENGTH = busRoadTotalLength;

function wrapT(t: number): number {
  const r = t % 1;
  return r < 0 ? r + 1 : r;
}

function forwardDeltaT(fromT: number, toT: number): number {
  const d = wrapT(toT) - wrapT(fromT);
  return d >= 0 ? d : d + 1;
}

export function sampleBusRoad(tNorm: number): RoadPoint {
  const t = wrapT(tNorm);
  const targetLen = t * busRoadTotalLength;
  let lo = 0;
  let hi = ROAD_TABLE_SIZE;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (roadLut[mid].arcLen <= targetLen) lo = mid;
    else hi = mid;
  }
  const a = roadLut[lo];
  const b = roadLut[hi];
  const f = (targetLen - a.arcLen) / Math.max(1e-6, b.arcLen - a.arcLen);
  const x = a.x + (b.x - a.x) * f;
  const z = a.z + (b.z - a.z) * f;

  const next = roadLut[(lo + 2) % ROAD_TABLE_SIZE];
  const prev = roadLut[(lo - 2 + ROAD_TABLE_SIZE) % ROAD_TABLE_SIZE];
  const dx = next.x - prev.x;
  const dz = next.z - prev.z;
  const len = Math.max(1e-6, Math.hypot(dx, dz));
  const tx = dx / len;
  const tz = dz / len;
  return { x, z, tx, tz, angle: Math.atan2(tx, tz) };
}

function findClosestRoadT(tx: number, tz: number): number {
  let bestIdx = 0;
  let bestD = Infinity;
  for (let i = 0; i < ROAD_TABLE_SIZE; i++) {
    const d = (roadLut[i].x - tx) ** 2 + (roadLut[i].z - tz) ** 2;
    if (d < bestD) {
      bestD = d;
      bestIdx = i;
    }
  }
  return roadLut[bestIdx].arcLen / busRoadTotalLength;
}

function makeBusStop(id: string, name: string, tamilName: string, ax: number, az: number): BusStop {
  const splineT = findClosestRoadT(ax, az);
  const s = sampleBusRoad(splineT);
  const nx = -s.tz;
  const nz = s.tx;
  return {
    id,
    name,
    tamilName,
    splineT,
    worldX: s.x,
    worldZ: s.z,
    stopX: s.x + nx * 3.8,
    stopZ: s.z + nz * 3.8,
    tangentAngle: s.angle,
  };
}

export const BUS_STOPS: BusStop[] = [
  makeBusStop('bus_poongavanam', 'ஷவீஷ் ஜெஷுருன் சா Stop', 'ஷவீஷ் ஜெஷுருன் சா பேருந்து நிறுத்தம்', 4, 29),
  makeBusStop('bus_nila', 'Nila Gramam Stop', 'நிலா கிராமம் நிறுத்தம்', -34, 27),
  makeBusStop('bus_countryside', 'Pachai Vayal Stop', 'பச்சை வயல் நிறுத்தம்', -14, 77),
  makeBusStop(
    'bus_exhibition',
    'Universal Exhibition Complex Stop',
    'உலக போக்குவரத்து கண்காட்சி நிறுத்தம்',
    EXHIBITION_BUS_STOP_POS.x,
    EXHIBITION_BUS_STOP_POS.z
  ),
  makeBusStop('bus_coast', 'Kadalkarai Beach Stop', 'கடற்கரை நிறுத்தம்', 86, 62),
].sort((a, b) => a.splineT - b.splineT);

const BUS_CRUISE_MPS = 13.5;
const BUS_MAX_SPEED_T = BUS_CRUISE_MPS / busRoadTotalLength;
const BUS_DWELL_SECONDS = 9.5;
const BUS_APPROACH_M = 20;
const BUS_APPROACH_T = BUS_APPROACH_M / busRoadTotalLength;

export function createInitialBusState(): BusState {
  const stopIdx = 0;
  const startT = wrapT(BUS_STOPS[stopIdx].splineT - 0.04);
  const s = sampleBusRoad(startT);
  return {
    t: startT,
    speed: BUS_MAX_SPEED_T * 0.6,
    speedKmh: Math.round(BUS_CRUISE_MPS * 0.6 * 3.6),
    phase: 'approaching',
    doorOpen: 0,
    dwellTimer: 0,
    currentStopIndex: (stopIdx - 1 + BUS_STOPS.length) % BUS_STOPS.length,
    nextStopIndex: stopIdx,
    etaSeconds: 2.5,
    worldX: s.x,
    worldZ: s.z,
    heading: s.angle,
  };
}

export function stepBusState(state: BusState, dt: number): BusState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let { t, speed, phase, doorOpen, dwellTimer, currentStopIndex, nextStopIndex } = state;
  const nextStop = BUS_STOPS[nextStopIndex];
  const distT = forwardDeltaT(t, nextStop.splineT);
  const distM = distT * busRoadTotalLength;

  if (phase === 'stopped') {
    speed = 0;
    dwellTimer += cdt;
    if (dwellTimer < BUS_DWELL_SECONDS - 1.3) {
      doorOpen = Math.min(1, doorOpen + cdt * 1.4);
    } else {
      doorOpen = Math.max(0, doorOpen - cdt * 1.4);
    }
    if (dwellTimer >= BUS_DWELL_SECONDS) {
      doorOpen = 0;
      dwellTimer = 0;
      phase = 'departing';
      currentStopIndex = nextStopIndex;
      nextStopIndex = (nextStopIndex + 1) % BUS_STOPS.length;
    }
  } else if (phase === 'departing') {
    doorOpen = Math.max(0, doorOpen - cdt * 2);
    speed = Math.min(BUS_MAX_SPEED_T, speed + BUS_MAX_SPEED_T * 0.35 * cdt);
    t = wrapT(t + speed * cdt);
    if (speed >= BUS_MAX_SPEED_T * 0.94) phase = 'cruising';
  } else if (phase === 'cruising') {
    doorOpen = 0;
    speed = speed + (BUS_MAX_SPEED_T - speed) * Math.min(1, cdt * 2.5);
    t = wrapT(t + speed * cdt);
    if (distT <= BUS_APPROACH_T) phase = 'approaching';
  } else if (phase === 'approaching') {
    doorOpen = 0;
    const desiredMps = Math.max(1.0, Math.sqrt(Math.max(0, distM) / BUS_APPROACH_M) * BUS_CRUISE_MPS);
    const desiredT = desiredMps / busRoadTotalLength;
    speed = speed + (desiredT - speed) * Math.min(1, cdt * 4.5);
    const stepT = speed * cdt;
    if (stepT >= distT || distM < 0.4) {
      t = nextStop.splineT;
      speed = 0;
      phase = 'stopped';
      dwellTimer = 0;
      currentStopIndex = nextStopIndex;
    } else {
      t = wrapT(t + stepT);
    }
  }

  const s = sampleBusRoad(t);
  const remM = forwardDeltaT(t, BUS_STOPS[nextStopIndex].splineT) * busRoadTotalLength;
  const mps = speed * busRoadTotalLength;
  const etaSeconds =
    phase === 'stopped'
      ? Math.max(0, BUS_DWELL_SECONDS - dwellTimer)
      : remM / Math.max(2.0, mps > 1 ? mps : BUS_CRUISE_MPS * 0.65);

  return {
    t,
    speed,
    speedKmh: Math.round(mps * 3.6),
    phase,
    doorOpen,
    dwellTimer,
    currentStopIndex,
    nextStopIndex,
    etaSeconds,
    worldX: s.x,
    worldZ: s.z,
    heading: s.angle,
  };
}

export function canBoardBus(bus: BusState, playerX: number, playerZ: number): boolean {
  if (bus.phase !== 'stopped' || bus.doorOpen < 0.3) return false;
  return Math.hypot(playerX - bus.worldX, playerZ - bus.worldZ) < 10.5;
}

export function getBusDisembarkPosition(bus: BusState): { x: number; z: number; heading: number } {
  const stop = BUS_STOPS[bus.currentStopIndex] ?? BUS_STOPS[0];
  return { x: stop.stopX, z: stop.stopZ, heading: stop.tangentAngle + Math.PI * 0.5 };
}

// =========================================================================
// DRIVABLE BOAT KINEMATICS (Neelam Lake Boat & Kadalkarai Ocean Boat)
// =========================================================================

export function createInitialBoats(): BoatState[] {
  return [
    {
      id: 'lake_boat',
      name: 'Neelam Lake Rowboat',
      tamilName: 'நீலம் ஏரி படகு',
      waterZone: 'lake',
      x: 34.5,
      z: -14.5,
      heading: 2.35,
      speed: 0,
      dockX: 34.5,
      dockZ: -14.5,
      exitX: 29.0,
      exitZ: -10.5,
    },
    {
      id: 'coastal_boat',
      name: 'Kadalkarai Harbour Boat',
      tamilName: 'கடற்கரை படகு',
      waterZone: 'ocean',
      x: 118.0,
      z: 66.0,
      heading: 1.2,
      speed: 0,
      dockX: 118.0,
      dockZ: 66.0,
      exitX: 108.5,
      exitZ: 61.0,
    },
    {
      id: 'bamboo_catamaran',
      name: 'Bamboo Catamaran Sail Raft',
      tamilName: 'மூங்கில் பாய்மரப் படகு',
      waterZone: 'ocean',
      x: 121.5,
      z: 57.2,
      heading: 1.35,
      speed: 0,
      dockX: 121.5,
      dockZ: 57.2,
      exitX: 112.0,
      exitZ: 60.5,
    },
    {
      id: 'tribal_outrigger',
      name: 'Tribal Outrigger Canoe',
      tamilName: 'பழங்குடி அவுட்ரிகர் படகு',
      waterZone: 'ocean',
      x: 121.5,
      z: 69.5,
      heading: 1.15,
      speed: 0,
      dockX: 121.5,
      dockZ: 69.5,
      exitX: 112.0,
      exitZ: 63.5,
    },
    {
      id: 'sovereign_ship',
      name: 'Sovereign of the Tides',
      tamilName: 'அலைகளின் அரசன் கப்பல்',
      waterZone: 'ocean',
      x: SOVEREIGN_SHORE_BERTH.x,
      z: SOVEREIGN_SHORE_BERTH.z,
      heading: SOVEREIGN_SHORE_BERTH.heading,
      speed: 0,
      dockX: SOVEREIGN_SHORE_BERTH.x,
      dockZ: SOVEREIGN_SHORE_BERTH.z,
      exitX: SOVEREIGN_SHORE_BERTH.exitX,
      exitZ: SOVEREIGN_SHORE_BERTH.exitZ,
    },
  ];
}

export function isNavigableBoatWater(zone: 'lake' | 'ocean', x: number, z: number): boolean {
  if (zone === 'lake') {
    const nx = (x - LAKE_CENTER.x) / (LAKE_RX - 3.5);
    const nz = (z - LAKE_CENTER.z) / (LAKE_RZ - 3.5);
    return nx * nx + nz * nz <= 1.0;
  }
  // Open ocean east/southeast of Kadalkarai shoreline extending far around Dinosaur Island & Ocean Exhibition Complex
  const inOceanBounds = x >= 113 && x <= 410 && z >= 4 && z <= 365;
  const clearOfDinosaurIsland =
    Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z) >= 31.0 &&
    Math.hypot(x - DINOSAUR_HEADLAND_CENTER.x, z - DINOSAUR_HEADLAND_CENTER.z) >= 13.5;
  const clearOfExhibitionIsland =
    !isInsideExhibitionIsland(x, z, 3.2) && !isOnExhibitionMarinaPier(x, z);
  return inOceanBounds && clearOfDinosaurIsland && clearOfExhibitionIsland;
}

/**
 * Manual Bus Driver Mode physics — lets the player freely drive the Dreamline Rural Bus
 * anywhere across the mainland roads, countryside, Snow Place, Enchanted Forest, and coast!
 */
export function stepBusManualDrive(
  bus: BusState,
  throttleForward: number, // -1..1
  steerRight: number, // -1 (left) .. +1 (right)
  brakePressed: boolean,
  doorsOpenRequested: boolean,
  dt: number
): BusState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  const prevMps = bus.speed * busRoadTotalLength;
  let speedMps = prevMps;
  let doorOpen = bus.doorOpen;

  const MAX_FWD_MPS = 20.0; // 72 km/h
  const MAX_REV_MPS = -7.5; // 27 km/h

  if (brakePressed) {
    const decel = 18.0 * cdt;
    if (Math.abs(speedMps) <= decel) speedMps = 0;
    else speedMps -= Math.sign(speedMps) * decel;
  } else if (Math.abs(throttleForward) > 0.04) {
    if (doorOpen > 0.05) doorOpen = Math.max(0, doorOpen - cdt * 2.5);
    const accel = throttleForward > 0 ? 11.5 : 10.5;
    speedMps += throttleForward * accel * cdt;
    speedMps = Math.max(MAX_REV_MPS, Math.min(MAX_FWD_MPS, speedMps));
  } else {
    const drag = 4.2 * cdt;
    if (Math.abs(speedMps) <= drag) speedMps = 0;
    else speedMps -= Math.sign(speedMps) * drag;
  }

  let heading = bus.heading;
  if (Math.abs(speedMps) > 0.2) {
    const steerDir = speedMps >= 0 ? 1 : -1;
    const turnRate = 1.65 * Math.min(1, Math.abs(speedMps) / 4.5 + 0.35);
    heading -= steerRight * turnRate * steerDir * cdt;
  }

  const rawNextX = bus.worldX + Math.sin(heading) * speedMps * cdt;
  const rawNextZ = bus.worldZ + Math.cos(heading) * speedMps * cdt;
  const safe = clampToBusDrivablePoint(rawNextX, rawNextZ);
  // Damp speed gently if clamped at a water/world edge
  if (Math.hypot(safe.x - rawNextX, safe.z - rawNextZ) > 0.05) {
    speedMps *= 0.55;
  }

  const absMps = Math.abs(speedMps);
  if (absMps < 0.8 && doorsOpenRequested) {
    doorOpen = Math.min(1, doorOpen + cdt * 2.2);
  } else if (absMps >= 0.8 || !doorsOpenRequested) {
    doorOpen = Math.max(0, doorOpen - cdt * 2.2);
  }

  const nearestT = findClosestRoadT(safe.x, safe.z);
  let nearestStopIdx = bus.currentStopIndex;
  let bestStopD = Infinity;
  for (let i = 0; i < BUS_STOPS.length; i++) {
    const d = Math.hypot(safe.x - BUS_STOPS[i].worldX, safe.z - BUS_STOPS[i].worldZ);
    if (d < bestStopD) {
      bestStopD = d;
      nearestStopIdx = i;
    }
  }

  return {
    ...bus,
    t: nearestT,
    speed: speedMps / busRoadTotalLength,
    speedKmh: Math.round(absMps * 3.6),
    phase: absMps < 0.45 ? 'stopped' : 'cruising',
    doorOpen,
    dwellTimer: 0,
    currentStopIndex: nearestStopIdx,
    nextStopIndex: (nearestStopIdx + 1) % BUS_STOPS.length,
    etaSeconds: 0,
    worldX: safe.x,
    worldZ: safe.z,
    heading,
  };
}

export function stepBoatState(
  boat: BoatState,
  throttleForward: number,
  steerRight: number,
  isBoost: boolean,
  dt: number
): BoatState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let { x, z, heading, speed } = boat;

  const maxSpeed = isBoost ? 15.5 : 10.5;
  const targetSpeed = throttleForward * maxSpeed;
  const accel = Math.abs(throttleForward) > 0.05 ? 3.2 : 1.9;
  speed = speed + (targetSpeed - speed) * (1 - Math.exp(-accel * cdt));
  if (Math.abs(speed) < 0.03 && Math.abs(throttleForward) < 0.05) speed = 0;

  // Responsive boat turning even at gentle gliding speed
  const turnSpeed = 1.65 * (0.45 + 0.55 * Math.min(1, Math.abs(speed) / 4));
  heading -= steerRight * turnSpeed * cdt;

  const nextX = x + Math.sin(heading) * speed * cdt;
  const nextZ = z + Math.cos(heading) * speed * cdt;

  if (isNavigableBoatWater(boat.waterZone, nextX, nextZ)) {
    x = nextX;
    z = nextZ;
  } else {
    // Slide along water boundary gently
    if (isNavigableBoatWater(boat.waterZone, nextX, z)) {
      x = nextX;
    } else if (isNavigableBoatWater(boat.waterZone, x, nextZ)) {
      z = nextZ;
    } else {
      speed *= 0.25;
    }
  }

  return {
    ...boat,
    x,
    z,
    heading,
    speed,
  };
}
