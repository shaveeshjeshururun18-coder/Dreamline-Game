import { AVS_HELIPAD_POS, HOME_HELIPAD_POS } from './skyExplorer';
import { EXHIBITION_HELIPAD_POS } from './exhibitionComplex';
import { DINOSAUR_ISLAND_CENTER } from './dinosaurIsland';
import { DESERT_HELIPAD_POS } from './desertOasis';
import { COAST_CENTER, walkableHeightAt } from './terrain';

export type SkyTaxiPhase =
  | 'patrol_cruising'
  | 'patrol_docked'
  | 'en_route_pickup'
  | 'arrived_pickup'
  | 'flying_to_destination'
  | 'arrived_dropoff';

export interface SkyTaxiStop {
  id: string;
  name: string;
  tamilName: string;
  x: number;
  y: number;
  z: number;
}

export interface SkyTaxiDestination {
  id: string;
  label: string;
  tamilLabel?: string;
  x: number;
  y?: number;
  z: number;
}

export interface SkyTaxiState {
  x: number;
  y: number;
  z: number;
  heading: number;
  speedKmh: number;
  altitudeM: number;
  phase: SkyTaxiPhase;
  currentStopIndex: number;
  nextStopIndex: number;
  dwellTimer: number;
  pickupX: number;
  pickupY: number;
  pickupZ: number;
  destination: SkyTaxiDestination | null;
  distanceMeters: number;
  etaSeconds: number;
  dropoffTimer: number;
  statusMessage: string;
  playerOnboard: boolean;
}

export const SKY_TAXI_STOPS: SkyTaxiStop[] = [
  {
    id: 'sky_home',
    name: 'En Illam Home Helipad',
    tamilName: 'என் இல்லம் ஹெலிபேட்',
    x: HOME_HELIPAD_POS.x,
    y: HOME_HELIPAD_POS.y,
    z: HOME_HELIPAD_POS.z,
  },
  {
    id: 'sky_coast',
    name: 'Kadalkarai Coast Sky Pad',
    tamilName: 'கடற்கரை வான்வழி தளம்',
    x: COAST_CENTER.x,
    y: 4.5,
    z: COAST_CENTER.z,
  },
  {
    id: 'sky_exhibition',
    name: 'Ocean Exhibition Helipad',
    tamilName: 'கண்காட்சி ஹெலிபேட்',
    x: EXHIBITION_HELIPAD_POS.x,
    y: EXHIBITION_HELIPAD_POS.y + 0.6,
    z: EXHIBITION_HELIPAD_POS.z,
  },
  {
    id: 'sky_dinosaur',
    name: 'SSJ Dinosaur Island Sky Pad',
    tamilName: 'டைனோசர் தீவு வான் தளம்',
    x: DINOSAUR_ISLAND_CENTER.x - 4,
    y: 4.8,
    z: DINOSAUR_ISLAND_CENTER.z - 6,
  },
  {
    id: 'sky_avs',
    name: 'AVS Snow Residence Helipad',
    tamilName: 'பனிமலை இல்லம் ஹெலிபேட்',
    x: AVS_HELIPAD_POS.x,
    y: AVS_HELIPAD_POS.y,
    z: AVS_HELIPAD_POS.z,
  },
  {
    id: 'sky_desert',
    name: 'Thar Desert Oasis Sky Pad',
    tamilName: 'பாலைவன சோலை ஹெலிபேட்',
    x: DESERT_HELIPAD_POS.x,
    y: DESERT_HELIPAD_POS.y + 0.6,
    z: DESERT_HELIPAD_POS.z,
  },
];

const SKY_TAXI_CRUISE_ALTITUDE = 28.0;
const SKY_TAXI_CRUISE_MPS = 28.0; // ~101 km/h swift scenic air travel
const SKY_TAXI_PATROL_MPS = 21.0; // ~76 km/h scheduled air-route loop
const SKY_TAXI_DWELL_SECONDS = 8.0;

export function createInitialSkyTaxiState(): SkyTaxiState {
  const start = SKY_TAXI_STOPS[0];
  return {
    x: start.x,
    y: start.y + 0.6,
    z: start.z,
    heading: 0.4,
    speedKmh: 0,
    altitudeM: Math.round(start.y + 0.6),
    phase: 'patrol_docked',
    currentStopIndex: 0,
    nextStopIndex: 1,
    dwellTimer: 0,
    pickupX: start.x,
    pickupY: start.y + 0.6,
    pickupZ: start.z,
    destination: null,
    distanceMeters: 0,
    etaSeconds: SKY_TAXI_DWELL_SECONDS,
    dropoffTimer: 0,
    statusMessage: `Docked at ${start.name}`,
    playerOnboard: false,
  };
}

export function requestMobileSkyTaxi(
  playerX: number,
  playerY: number,
  playerZ: number,
  destination: SkyTaxiDestination,
  taxi: SkyTaxiState
): SkyTaxiState {
  const pickupY = Math.max(playerY + 0.9, walkableHeightAt(playerX, playerZ) + 0.9);
  const destY =
    destination.y !== undefined
      ? destination.y
      : Math.max(1.2, walkableHeightAt(destination.x, destination.z) + 1.0);

  // If the Sky Taxi is > 110m away, bring its approach start to ~70m away high in the sky
  // so the player sees it swoop in gracefully within ~3 seconds!
  let sx = taxi.x;
  let sy = taxi.y;
  let sz = taxi.z;
  const dNow = Math.hypot(playerX - sx, playerZ - sz);
  if (dNow > 110) {
    const dx = sx - playerX;
    const dz = sz - playerZ;
    const len = Math.max(1e-4, Math.hypot(dx, dz));
    sx = playerX + (dx / len) * 68;
    sz = playerZ + (dz / len) * 68;
    sy = Math.max(pickupY + 18, SKY_TAXI_CRUISE_ALTITUDE);
  }

  return {
    ...taxi,
    x: sx,
    y: sy,
    z: sz,
    phase: 'en_route_pickup',
    pickupX: playerX,
    pickupY,
    pickupZ: playerZ,
    destination: { ...destination, y: destY },
    distanceMeters: Math.round(Math.hypot(playerX - sx, playerZ - sz)),
    etaSeconds: Math.max(1, Math.round(Math.hypot(playerX - sx, playerZ - sz) / SKY_TAXI_CRUISE_MPS)),
    dropoffTimer: 0,
    playerOnboard: false,
    statusMessage: `Sky Explorer Taxi inbound to pick you up for ${destination.label}`,
  };
}

export function cancelSkyTaxi(taxi: SkyTaxiState): SkyTaxiState {
  return {
    ...taxi,
    phase: 'patrol_cruising',
    destination: null,
    playerOnboard: false,
    dropoffTimer: 0,
    statusMessage: 'Sky Explorer Taxi resumed scheduled aerial route',
  };
}

export function boardSkyTaxi(taxi: SkyTaxiState): SkyTaxiState {
  if (taxi.phase === 'arrived_pickup' && taxi.destination) {
    return {
      ...taxi,
      phase: 'flying_to_destination',
      playerOnboard: true,
      statusMessage: `Air Taxi en route to ${taxi.destination.label}`,
    };
  }
  // Boarding during scheduled patrol loop rides along the next helipad stop!
  const nextStop = SKY_TAXI_STOPS[taxi.nextStopIndex] ?? SKY_TAXI_STOPS[0];
  return {
    ...taxi,
    phase: 'patrol_cruising',
    playerOnboard: true,
    statusMessage: `Sky Explorer Air Route · Next pad: ${nextStop.name}`,
  };
}

function flyTowardsTarget(
  x: number,
  y: number,
  z: number,
  heading: number,
  tx: number,
  ty: number,
  tz: number,
  maxMps: number,
  dt: number
): { x: number; y: number; z: number; heading: number; speedMps: number; arrived: boolean; horizDist: number } {
  const dx = tx - x;
  const dz = tz - z;
  const horizDist = Math.hypot(dx, dz);

  // Smooth scenic arc altitude: climb high while > 26m out, descend cleanly on final approach
  const desiredAlt =
    horizDist > 26
      ? Math.max(SKY_TAXI_CRUISE_ALTITUDE, Math.max(y, ty) + 6)
      : ty + (horizDist / 26) * Math.max(0, SKY_TAXI_CRUISE_ALTITUDE - ty);

  const desiredHeading = horizDist > 0.6 ? Math.atan2(dx, dz) : heading;
  let dAng = desiredHeading - heading;
  while (dAng > Math.PI) dAng -= Math.PI * 2;
  while (dAng < -Math.PI) dAng += Math.PI * 2;
  const nextHeading = heading + dAng * Math.min(1, dt * 4.2);

  const speedMps =
    horizDist > 24 ? maxMps : Math.max(4.5, (horizDist / 24) * maxMps);

  const stepH = Math.min(horizDist, speedMps * dt);
  const nx = horizDist > 0.05 ? x + (dx / horizDist) * stepH : tx;
  const nz = horizDist > 0.05 ? z + (dz / horizDist) * stepH : tz;
  const dy = desiredAlt - y;
  const ny = y + dy * Math.min(1, dt * 3.0);

  const arrived = horizDist < 2.4 && Math.abs(ny - ty) < 1.8;
  return {
    x: arrived ? tx : nx,
    y: arrived ? ty : ny,
    z: arrived ? tz : nz,
    heading: nextHeading,
    speedMps: arrived ? 0 : speedMps,
    arrived,
    horizDist,
  };
}

export function stepSkyTaxiState(
  taxi: SkyTaxiState,
  dt: number
): { state: SkyTaxiState; justArrivedPickup: boolean; justArrivedDropoff: boolean } {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let justArrivedPickup = false;
  let justArrivedDropoff = false;

  if (taxi.phase === 'patrol_docked') {
    const dwellTimer = taxi.dwellTimer + cdt;
    const currentStop = SKY_TAXI_STOPS[taxi.currentStopIndex] ?? SKY_TAXI_STOPS[0];
    if (dwellTimer >= SKY_TAXI_DWELL_SECONDS) {
      const nextIdx = (taxi.currentStopIndex + 1) % SKY_TAXI_STOPS.length;
      return {
        state: {
          ...taxi,
          phase: 'patrol_cruising',
          dwellTimer: 0,
          nextStopIndex: nextIdx,
          statusMessage: `Air Route departing for ${SKY_TAXI_STOPS[nextIdx].name}`,
        },
        justArrivedPickup,
        justArrivedDropoff,
      };
    }
    return {
      state: {
        ...taxi,
        dwellTimer,
        speedKmh: 0,
        etaSeconds: Math.max(0, Math.round(SKY_TAXI_DWELL_SECONDS - dwellTimer)),
        statusMessage: `Docked at ${currentStop.name}`,
      },
      justArrivedPickup,
      justArrivedDropoff,
    };
  }

  if (taxi.phase === 'patrol_cruising') {
    const targetStop = SKY_TAXI_STOPS[taxi.nextStopIndex] ?? SKY_TAXI_STOPS[0];
    const step = flyTowardsTarget(
      taxi.x,
      taxi.y,
      taxi.z,
      taxi.heading,
      targetStop.x,
      targetStop.y + 0.6,
      targetStop.z,
      SKY_TAXI_PATROL_MPS,
      cdt
    );
    if (step.arrived) {
      return {
        state: {
          ...taxi,
          x: step.x,
          y: step.y,
          z: step.z,
          heading: step.heading,
          speedKmh: 0,
          altitudeM: Math.round(step.y),
          phase: 'patrol_docked',
          currentStopIndex: taxi.nextStopIndex,
          dwellTimer: 0,
          distanceMeters: 0,
          etaSeconds: SKY_TAXI_DWELL_SECONDS,
          statusMessage: `Arrived at ${targetStop.name}`,
        },
        justArrivedPickup,
        justArrivedDropoff,
      };
    }
    return {
      state: {
        ...taxi,
        x: step.x,
        y: step.y,
        z: step.z,
        heading: step.heading,
        speedKmh: Math.round(step.speedMps * 3.6),
        altitudeM: Math.round(step.y),
        distanceMeters: Math.round(step.horizDist),
        etaSeconds: Math.max(1, Math.round(step.horizDist / SKY_TAXI_PATROL_MPS)),
        statusMessage: `Sky Explorer Route -> ${targetStop.name}`,
      },
      justArrivedPickup,
      justArrivedDropoff,
    };
  }

  if (taxi.phase === 'en_route_pickup') {
    const step = flyTowardsTarget(
      taxi.x,
      taxi.y,
      taxi.z,
      taxi.heading,
      taxi.pickupX,
      taxi.pickupY,
      taxi.pickupZ,
      SKY_TAXI_CRUISE_MPS,
      cdt
    );
    if (step.arrived) {
      justArrivedPickup = true;
      return {
        state: {
          ...taxi,
          x: step.x,
          y: step.y,
          z: step.z,
          heading: step.heading,
          speedKmh: 0,
          altitudeM: Math.round(step.y),
          phase: 'arrived_pickup',
          distanceMeters: 0,
          etaSeconds: 0,
          statusMessage: `Sky Explorer Taxi arrived! Boarding for ${taxi.destination?.label ?? 'destination'}`,
        },
        justArrivedPickup,
        justArrivedDropoff,
      };
    }
    return {
      state: {
        ...taxi,
        x: step.x,
        y: step.y,
        z: step.z,
        heading: step.heading,
        speedKmh: Math.round(step.speedMps * 3.6),
        altitudeM: Math.round(step.y),
        distanceMeters: Math.round(step.horizDist),
        etaSeconds: Math.max(1, Math.round(step.horizDist / SKY_TAXI_CRUISE_MPS)),
        statusMessage: `Sky Explorer Taxi arriving (${Math.round(step.horizDist)}m)`,
      },
      justArrivedPickup,
      justArrivedDropoff,
    };
  }

  if (taxi.phase === 'arrived_pickup') {
    return {
      state: {
        ...taxi,
        speedKmh: 0,
        statusMessage: `Sky Explorer Taxi hovering — press E to board for ${taxi.destination?.label ?? 'destination'}`,
      },
      justArrivedPickup,
      justArrivedDropoff,
    };
  }

  if (taxi.phase === 'flying_to_destination' && taxi.destination) {
    const destY = taxi.destination.y ?? 1.8;
    const step = flyTowardsTarget(
      taxi.x,
      taxi.y,
      taxi.z,
      taxi.heading,
      taxi.destination.x,
      destY,
      taxi.destination.z,
      SKY_TAXI_CRUISE_MPS,
      cdt
    );
    if (step.arrived) {
      justArrivedDropoff = true;
      return {
        state: {
          ...taxi,
          x: step.x,
          y: step.y,
          z: step.z,
          heading: step.heading,
          speedKmh: 0,
          altitudeM: Math.round(step.y),
          phase: 'arrived_dropoff',
          dropoffTimer: 0,
          distanceMeters: 0,
          etaSeconds: 0,
          playerOnboard: false,
          statusMessage: `Arrived at ${taxi.destination.label}!`,
        },
        justArrivedPickup,
        justArrivedDropoff,
      };
    }
    return {
      state: {
        ...taxi,
        x: step.x,
        y: step.y,
        z: step.z,
        heading: step.heading,
        speedKmh: Math.round(step.speedMps * 3.6),
        altitudeM: Math.round(step.y),
        distanceMeters: Math.round(step.horizDist),
        etaSeconds: Math.max(1, Math.round(step.horizDist / SKY_TAXI_CRUISE_MPS)),
        statusMessage: `Sky Taxi cruising to ${taxi.destination.label} (${Math.round(step.horizDist)}m)`,
      },
      justArrivedPickup,
      justArrivedDropoff,
    };
  }

  // arrived_dropoff -> return cleanly to scheduled patrol loop after 4s
  const dropoffTimer = taxi.dropoffTimer + cdt;
  if (dropoffTimer >= 4.0) {
    return {
      state: cancelSkyTaxi(taxi),
      justArrivedPickup,
      justArrivedDropoff,
    };
  }
  return {
    state: {
      ...taxi,
      dropoffTimer,
      speedKmh: 0,
    },
    justArrivedPickup,
    justArrivedDropoff,
  };
}
