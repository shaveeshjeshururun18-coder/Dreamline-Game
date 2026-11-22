import type { SeasonType, WeatherType } from './types';
import { getWeatherProfile } from './extremeWeather';

export type TrainPassengerActivity =
  | 'reading'
  | 'window_gazing'
  | 'weather_watching'
  | 'sipping_tea'
  | 'dozing'
  | 'chatting';

export type PassengerPersonality =
  | 'bookworm'
  | 'scenic'
  | 'tea_lover'
  | 'sleepy'
  | 'friendly';

export interface TrainPassengerSeed {
  id: string;
  name: string;
  carIndex: 0 | 1; // 0 = Lead Car, 1 = Rear Car
  side: -1 | 1; // -1 = left bench, +1 = right bench
  seatZ: number;
  personality: PassengerPersonality;
  coatHex: number;
  shirtHex: number;
  pantsHex: number;
  hairHex: number;
  skinHex: number;
  bookHex: number;
  cupHex: number;
  phaseOffset: number;
}

export interface TrainPassengerState {
  id: string;
  seed: TrainPassengerSeed;
  activity: TrainPassengerActivity;
  timeInActivity: number;
  activityDuration: number;
  // Normalized smoothed pose channels consumed by the 3D rig (0..1 or radians)
  headYaw: number; // + turns toward window, - turns toward aisle/neighbor
  headPitch: number; // + looks down (book/doze), - looks up (sky/rain)
  torsoLean: number; // + leans forward/toward window
  bookRaise: number; // 0..1 visibility & hold height of book
  cupRaise: number; // 0..1 visibility & sip height of teacup
  pageTurnPulse: number; // 0..1 periodic subtle page turn
  nodPhase: number; // continuous subtle breathing / nod phase
  lastWeatherKey: WeatherType;
  lastPeriodBucket: 'night' | 'morning' | 'day' | 'sunset';
}

/**
 * 8 diverse seated commuters across Lead Car (5) and Rear Car (3).
 * Coordinates strictly avoid:
 * - Player window seat in Lead Car: (x=+0.96, z=+0.42)
 * - Frosty companion seat in Lead Car: (x=-0.88, z=+0.35)
 * - Doorway bays at z = ±2.45 and driver cab at z > +5.2
 */
export const TRAIN_PASSENGER_SEEDS: readonly TrainPassengerSeed[] = [
  {
    id: 'p_lead_left_rear',
    name: 'Meera',
    carIndex: 0,
    side: -1,
    seatZ: -4.95,
    personality: 'bookworm',
    coatHex: 0x3b5875,
    shirtHex: 0xf6efe6,
    pantsHex: 0x262b38,
    hairHex: 0x1e1a22,
    skinHex: 0xe8c3a5,
    bookHex: 0x9b3b3b,
    cupHex: 0xf4ece1,
    phaseOffset: 0.4,
  },
  {
    id: 'p_lead_right_rear',
    name: 'Haruto',
    carIndex: 0,
    side: 1,
    seatZ: -4.2,
    personality: 'tea_lover',
    coatHex: 0x6f513c,
    shirtHex: 0xefe3d2,
    pantsHex: 0x2d323e,
    hairHex: 0x261f1c,
    skinHex: 0xf1d0b5,
    bookHex: 0x2d5a4c,
    cupHex: 0xd9e8e3,
    phaseOffset: 1.7,
  },
  {
    id: 'p_lead_left_mid',
    name: 'Ananya',
    carIndex: 0,
    side: -1,
    seatZ: -0.78,
    personality: 'scenic',
    coatHex: 0x8e4a5f,
    shirtHex: 0xfbf2e8,
    pantsHex: 0x2c2838,
    hairHex: 0x1a1720,
    skinHex: 0xd8a986,
    bookHex: 0x3f4e7a,
    cupHex: 0xfae6d2,
    phaseOffset: 2.9,
  },
  {
    id: 'p_lead_right_front',
    name: 'Kenji',
    carIndex: 0,
    side: 1,
    seatZ: 4.1,
    personality: 'scenic',
    coatHex: 0x456352,
    shirtHex: 0xf2ece1,
    pantsHex: 0x252c36,
    hairHex: 0x232026,
    skinHex: 0xf0cdb0,
    bookHex: 0x8b5d33,
    cupHex: 0xf7eee2,
    phaseOffset: 4.1,
  },
  {
    id: 'p_lead_left_front',
    name: 'Kavya',
    carIndex: 0,
    side: -1,
    seatZ: 4.82,
    personality: 'sleepy',
    coatHex: 0xb98245,
    shirtHex: 0xfaf3ea,
    pantsHex: 0x2d3140,
    hairHex: 0x281e1c,
    skinHex: 0xdfb28f,
    bookHex: 0x5c3e6b,
    cupHex: 0xf0e1d1,
    phaseOffset: 5.3,
  },
  {
    id: 'p_rear_right_rear',
    name: 'Sora',
    carIndex: 1,
    side: 1,
    seatZ: -4.55,
    personality: 'bookworm',
    coatHex: 0x524872,
    shirtHex: 0xf7f1e8,
    pantsHex: 0x242834,
    hairHex: 0x2b2220,
    skinHex: 0xf3d4bc,
    bookHex: 0x2f5f6d,
    cupHex: 0xf6ebd8,
    phaseOffset: 0.9,
  },
  {
    id: 'p_rear_left_mid',
    name: 'Karthik',
    carIndex: 1,
    side: -1,
    seatZ: 0.15,
    personality: 'friendly',
    coatHex: 0x3b636b,
    shirtHex: 0xf4eee6,
    pantsHex: 0x2a2f3a,
    hairHex: 0x1b191f,
    skinHex: 0xd5a480,
    bookHex: 0x8d423a,
    cupHex: 0xeae5dc,
    phaseOffset: 2.3,
  },
  {
    id: 'p_rear_right_front',
    name: 'Yui',
    carIndex: 1,
    side: 1,
    seatZ: 4.55,
    personality: 'tea_lover',
    coatHex: 0x9c5548,
    shirtHex: 0xf9f0e4,
    pantsHex: 0x2a2936,
    hairHex: 0x291e1a,
    skinHex: 0xf2d1b6,
    bookHex: 0x45634b,
    cupHex: 0xf8e9d6,
    phaseOffset: 3.7,
  },
];

export function getPassengerTimeBucket(
  timeHours: number
): 'night' | 'morning' | 'day' | 'sunset' {
  const h = ((timeHours % 24) + 24) % 24;
  if (h >= 21.0 || h < 5.2) return 'night';
  if (h >= 5.2 && h < 9.8) return 'morning';
  if (h >= 16.0 && h < 19.8) return 'sunset';
  return 'day';
}

/**
 * Pure environment-sensitive activity probability weights driven by
 * time of day, weather condition, season, and passenger personality.
 */
export function computePassengerActivityWeights(
  timeHours: number,
  weather: WeatherType,
  season: SeasonType,
  personality: PassengerPersonality = 'scenic'
): Record<TrainPassengerActivity, number> {
  const bucket = getPassengerTimeBucket(timeHours);
  const wp = getWeatherProfile(weather);
  const isStormy = wp.isExtremeStorm || weather === 'rain' || weather === 'fog';
  const isSnowy = weather === 'snow' || season === 'winter';

  const w: Record<TrainPassengerActivity, number> = {
    reading: 1.0,
    window_gazing: 1.0,
    weather_watching: 0.1,
    sipping_tea: 0.65,
    dozing: 0.25,
    chatting: 0.5,
  };

  // Time-of-day modulation
  if (bucket === 'night') {
    w.dozing += 2.6;
    w.reading += 1.25; // Cozy reading under warm carriage lamps
    w.sipping_tea += 0.55;
    w.window_gazing *= 0.45;
    w.chatting *= 0.25;
  } else if (bucket === 'sunset') {
    w.window_gazing += 2.5; // Admiring golden sunset & twilight reflections
    w.sipping_tea += 0.55;
    w.reading += 0.45;
    w.dozing *= 0.35;
  } else if (bucket === 'morning') {
    w.sipping_tea += 1.85; // Warm morning tea on the commuter train
    w.reading += 1.35;
    w.window_gazing += 0.85;
    w.dozing += 0.4;
  } else {
    // Bright daytime
    w.reading += 1.1;
    w.window_gazing += 1.15;
    w.chatting += 0.95;
    w.dozing *= 0.25;
  }

  // Weather sensitivity
  if (wp.isExtremeStorm) {
    w.weather_watching += 3.6; // Actively watching torrential rain / lightning / waves
    w.sipping_tea += 1.15;
    w.reading += 0.95;
    w.chatting *= 0.25;
    w.dozing *= 0.35;
  } else if (weather === 'rain') {
    w.weather_watching += 2.2;
    w.reading += 1.4;
    w.sipping_tea += 1.3;
    w.dozing += 0.45;
  } else if (weather === 'snow') {
    w.weather_watching += 2.1;
    w.window_gazing += 1.4;
    w.sipping_tea += 1.4;
  } else if (weather === 'fog') {
    w.weather_watching += 1.3;
    w.reading += 1.1;
  } else if (weather === 'breeze' || weather === 'clear') {
    w.window_gazing += 0.65;
  }

  // Seasonal ambiance
  if (season === 'spring' && !isStormy) {
    w.window_gazing += 0.7; // Watching drifting cherry blossoms
  } else if (season === 'autumn' && !isStormy) {
    w.window_gazing += 0.55;
    w.reading += 0.4;
  } else if (isSnowy) {
    w.sipping_tea += 0.7;
  }

  // Individual passenger personality bias
  if (personality === 'bookworm') w.reading *= 1.85;
  else if (personality === 'scenic') {
    w.window_gazing *= 1.65;
    w.weather_watching *= 1.35;
  } else if (personality === 'tea_lover') w.sipping_tea *= 1.9;
  else if (personality === 'sleepy') w.dozing *= 1.95;
  else if (personality === 'friendly') w.chatting *= 1.8;

  return w;
}

const ACTIVITIES: readonly TrainPassengerActivity[] = [
  'reading',
  'window_gazing',
  'weather_watching',
  'sipping_tea',
  'dozing',
  'chatting',
];

function deterministicRand(seedNum: number): number {
  const x = Math.sin(seedNum * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function pickWeightedActivity(
  weights: Record<TrainPassengerActivity, number>,
  roll01: number
): TrainPassengerActivity {
  let total = 0;
  for (let i = 0; i < ACTIVITIES.length; i++) {
    total += Math.max(0, weights[ACTIVITIES[i]]);
  }
  if (total <= 0) return 'window_gazing';
  let acc = 0;
  const target = Math.max(0, Math.min(0.9999, roll01)) * total;
  for (let i = 0; i < ACTIVITIES.length; i++) {
    const act = ACTIVITIES[i];
    acc += Math.max(0, weights[act]);
    if (target <= acc) return act;
  }
  return 'reading';
}

export function createInitialTrainPassengerStates(
  timeHours = 17.72,
  weather: WeatherType = 'clear',
  season: SeasonType = 'spring'
): TrainPassengerState[] {
  const bucket = getPassengerTimeBucket(timeHours);
  return TRAIN_PASSENGER_SEEDS.map((seed, idx) => {
    const weights = computePassengerActivityWeights(
      timeHours,
      weather,
      season,
      seed.personality
    );
    // Guarantee visible variety immediately on load (reading, window gazing, sipping tea)
    const activity: TrainPassengerActivity =
      idx === 0
        ? 'reading'
        : idx === 1
        ? 'sipping_tea'
        : idx === 2
        ? 'window_gazing'
        : pickWeightedActivity(weights, deterministicRand(idx * 17.3 + 4.1));

    const initialPose = computeTargetPose(activity, 0, seed.phaseOffset);
    return {
      id: seed.id,
      seed,
      activity,
      timeInActivity: (idx * 1.9) % 7.5,
      activityDuration: 7.5 + (idx % 4) * 2.4,
      headYaw: initialPose.headYaw,
      headPitch: initialPose.headPitch,
      torsoLean: initialPose.torsoLean,
      bookRaise: initialPose.bookRaise,
      cupRaise: initialPose.cupRaise,
      pageTurnPulse: 0,
      nodPhase: seed.phaseOffset,
      lastWeatherKey: weather,
      lastPeriodBucket: bucket,
    };
  });
}

function computeTargetPose(
  activity: TrainPassengerActivity,
  t: number,
  phase: number
): {
  headYaw: number;
  headPitch: number;
  torsoLean: number;
  bookRaise: number;
  cupRaise: number;
  pageTurn: number;
} {
  if (activity === 'reading') {
    const pageCycle = (t * 0.28 + phase * 0.3) % 1.0;
    const pageTurn = pageCycle > 0.84 ? Math.sin(((pageCycle - 0.84) / 0.16) * Math.PI) : 0;
    return {
      headYaw: Math.sin(t * 0.7 + phase) * 0.08,
      headPitch: 0.42 + Math.sin(t * 0.9 + phase) * 0.04,
      torsoLean: 0.12,
      bookRaise: 1.0,
      cupRaise: 0.0,
      pageTurn,
    };
  }
  if (activity === 'window_gazing') {
    return {
      headYaw: 1.02 + Math.sin(t * 0.55 + phase) * 0.18,
      headPitch: -0.05 + Math.sin(t * 0.4 + phase) * 0.08,
      torsoLean: 0.08,
      bookRaise: 0.0,
      cupRaise: 0.0,
      pageTurn: 0,
    };
  }
  if (activity === 'weather_watching') {
    // Leaning closer to the glass, scanning rain streaks & sky upward
    return {
      headYaw: 1.18 + Math.sin(t * 1.15 + phase) * 0.24,
      headPitch: -0.18 + Math.sin(t * 0.85 + phase) * 0.12,
      torsoLean: 0.2,
      bookRaise: 0.0,
      cupRaise: 0.0,
      pageTurn: 0,
    };
  }
  if (activity === 'sipping_tea') {
    // Periodic cozy sip pulse every ~4.5 seconds
    const sipWave = Math.max(0, Math.sin(t * 1.25 + phase));
    const sip = sipWave * sipWave;
    return {
      headYaw: 0.35 + Math.sin(t * 0.45 + phase) * 0.2,
      headPitch: 0.06 - sip * 0.14,
      torsoLean: 0.06,
      bookRaise: 0.0,
      cupRaise: 0.38 + sip * 0.62,
      pageTurn: 0,
    };
  }
  if (activity === 'dozing') {
    const breathe = Math.sin(t * 0.85 + phase);
    return {
      headYaw: 0.42 + breathe * 0.05,
      headPitch: 0.48 + breathe * 0.11,
      torsoLean: -0.05,
      bookRaise: 0.0,
      cupRaise: 0.0,
      pageTurn: 0,
    };
  }
  // chatting: subtle glances toward aisle / opposite commuters
  return {
    headYaw: -0.28 + Math.sin(t * 1.35 + phase) * 0.34,
    headPitch: Math.sin(t * 2.4 + phase) * 0.09,
    torsoLean: 0.09,
    bookRaise: 0.0,
    cupRaise: 0.0,
    pageTurn: 0,
  };
}

/**
 * Advances all seated AI train passengers in-place (zero allocations per frame).
 */
export function stepTrainPassengers(
  states: TrainPassengerState[],
  dt: number,
  timeHours: number,
  weather: WeatherType,
  season: SeasonType,
  elapsedSec: number
): void {
  const bucket = getPassengerTimeBucket(timeHours);
  const blend = 1 - Math.exp(-Math.min(0.1, dt) * 4.5);

  for (let i = 0; i < states.length; i++) {
    const p = states[i];
    p.timeInActivity += dt;
    p.nodPhase += dt;

    // React promptly when weather or time-of-day shifts!
    const envChanged = p.lastWeatherKey !== weather || p.lastPeriodBucket !== bucket;
    if (envChanged) {
      p.lastWeatherKey = weather;
      p.lastPeriodBucket = bucket;
      p.activityDuration = Math.min(p.activityDuration, p.timeInActivity + 0.35 + i * 0.18);
    }

    if (p.timeInActivity >= p.activityDuration) {
      const weights = computePassengerActivityWeights(
        timeHours,
        weather,
        season,
        p.seed.personality
      );
      const roll = deterministicRand(elapsedSec * 1.37 + i * 31.7 + p.seed.phaseOffset * 9.3);
      p.activity = pickWeightedActivity(weights, roll);
      p.timeInActivity = 0;
      p.activityDuration = 7.0 + deterministicRand(elapsedSec + i * 19.1) * 7.5;
    }

    const target = computeTargetPose(p.activity, p.timeInActivity, p.seed.phaseOffset);
    p.headYaw += (target.headYaw - p.headYaw) * blend;
    p.headPitch += (target.headPitch - p.headPitch) * blend;
    p.torsoLean += (target.torsoLean - p.torsoLean) * blend;
    p.bookRaise += (target.bookRaise - p.bookRaise) * blend;
    p.cupRaise += (target.cupRaise - p.cupRaise) * blend;
    p.pageTurnPulse += (target.pageTurn - p.pageTurnPulse) * Math.min(1, dt * 9);
  }
}
