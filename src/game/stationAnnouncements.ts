import { STATIONS } from './railway';
import type { RegionId, TrainState, WeatherType } from './types';

export type StationAnnouncementEventKind = 'approaching' | 'arrived' | 'departing' | 'ambient';

export interface StationAnnouncement {
  id: string;
  stationIndex: number;
  stationId: string;
  stationName: string;
  localName: string;
  regionId: RegionId;
  regionTag: string;
  chimeName: string;
  chimeNotes: number[];
  chimeWave: OscillatorType;
  chimeTempoSec: number;
  voicePitchHz: number;
  syllableCount: number;
  text: string;
  eventKind: StationAnnouncementEventKind;
}

export interface StationCrowdProfile {
  nearestStationIndex: number;
  stationId: string;
  regionId: RegionId;
  proximity01: number;
  gain: number;
  bustle01: number;
  formantLowHz: number;
  formantMidHz: number;
  formantHighHz: number;
  modulationHz: number;
}

interface RegionPaVoiceSpec {
  regionTag: string;
  chimeName: string;
  chimeNotes: number[];
  chimeWave: OscillatorType;
  chimeTempoSec: number;
  voicePitchHz: number;
  baseBustle: number;
  formants: [number, number, number];
  modulationHz: number;
  greetings: string[];
  localTips: string[];
}

const REGION_PA_SPECS: Record<RegionId, RegionPaVoiceSpec> = {
  sakura: {
    regionTag: 'Blossom Valley Line',
    chimeName: 'Sakura Bell Chime',
    chimeNotes: [523.25, 659.25, 783.99, 1046.5, 783.99],
    chimeWave: 'sine',
    chimeTempoSec: 0.21,
    voicePitchHz: 232,
    baseBustle: 0.92,
    formants: [320, 790, 1580],
    modulationHz: 0.34,
    greetings: ['Vanakkam, Poongavanam travelers.', 'Attention on Platform 1, Blossom Valley.'],
    localTips: [
      'Watch the gentle gap beside the sakura platform lanterns.',
      'Transfer here for En Illam and the Blossom Valley bus stop.',
      'Fresh tea and bento boxes are available near the ticket pavilion.',
    ],
  },
  countryside: {
    regionTag: 'Green Valley Local',
    chimeName: 'Meadow Chime',
    chimeNotes: [392.0, 493.88, 587.33, 659.25, 587.33],
    chimeWave: 'triangle',
    chimeTempoSec: 0.24,
    voicePitchHz: 196,
    baseBustle: 0.42,
    formants: [275, 690, 1380],
    modulationHz: 0.22,
    greetings: ['Good day from Green Valley Halt.', 'Gentle announcement for countryside riders.'],
    localTips: [
      'Please mind the timber step along the rice-terrace crossing.',
      'Breeze carries over the foothills—enjoy the scenic tunnel approach.',
      'Rural bus connections run regularly along the meadow road.',
    ],
  },
  lake_camp: {
    regionTag: 'Neelam Lakeside Stop',
    chimeName: 'Mirror Water Arpeggio',
    chimeNotes: [440.0, 523.25, 659.25, 880.0, 659.25],
    chimeWave: 'sine',
    chimeTempoSec: 0.25,
    voicePitchHz: 214,
    baseBustle: 0.48,
    formants: [290, 730, 1450],
    modulationHz: 0.24,
    greetings: ['Welcome to Neelam Lakeside.', 'Quiet platform notice by the mirror waters.'],
    localTips: [
      'Rowboats and lakeside campfires are a short stroll down the timber pier.',
      'Please keep voices soft near the heron reeds at dusk.',
      'Camp lanterns light automatically as twilight settles over the lake.',
    ],
  },
  snow: {
    regionTag: 'Iceland Alpine Express',
    chimeName: 'Glacier Celesta Chime',
    chimeNotes: [587.33, 739.99, 880.0, 1174.66, 987.77, 880.0],
    chimeWave: 'sine',
    chimeTempoSec: 0.19,
    voicePitchHz: 248,
    baseBustle: 0.62,
    formants: [345, 840, 1710],
    modulationHz: 0.28,
    greetings: ['Panimalai Alpine Express announcement.', 'Attention, Snow Valley & Iceland Gateway.'],
    localTips: [
      'Please button coats warmly before stepping onto the snowy timber deck.',
      'Direct transfer to Panimalai Iceland & AVS Snow Residence is open.',
      'Watch your footing on frosted stone paths near the glacier overlook.',
    ],
  },
  coastal: {
    regionTag: 'Kadalkarai Ocean Viaduct',
    chimeName: 'Harbour Brass Bell',
    chimeNotes: [329.63, 440.0, 523.25, 659.25, 783.99],
    chimeWave: 'triangle',
    chimeTempoSec: 0.2,
    voicePitchHz: 205,
    baseBustle: 0.84,
    formants: [310, 770, 1520],
    modulationHz: 0.36,
    greetings: ['Harbour Line PA calling all ocean passengers.', 'Sea breeze notice on the Coastal Viaduct.'],
    localTips: [
      'Sovereign of the Tides and harbour vessels are moored right off Kadalkarai Shore.',
      'Hold onto sun hats along the open ocean viaduct boardwalk.',
      'Exhibition Complex pavilions and Dinosaur Island trails await beyond the pier.',
    ],
  },
};

export function getStationRegionId(stationIndex: number): RegionId {
  const safeIdx = ((stationIndex % STATIONS.length) + STATIONS.length) % STATIONS.length;
  const st = STATIONS[safeIdx];
  switch (st.id) {
    case 'sakuragawa_station':
      return 'sakura';
    case 'pachai_meadow_halt':
    case 'kaze_no_oka':
      return 'countryside';
    case 'aomizu_lakeside':
      return 'lake_camp';
    case 'iceland_gateway':
      return 'snow';
    case 'exhibition_complex_station':
    case 'dinosaur_island_station':
    default:
      return 'coastal';
  }
}

function getTimeAdvisory(timeHours: number): string {
  const h = ((timeHours % 24) + 24) % 24;
  if (h >= 5 && h < 10.5) return 'Morning service is running smoothly on time.';
  if (h >= 10.5 && h < 16.5) return 'Afternoon express intervals are clear across the loop.';
  if (h >= 16.5 && h < 19.5) return 'Golden sunset views are clearest from the left-side windows.';
  return 'Evening lantern service is active; mind the illuminated platform edge.';
}

function getWeatherAdvisory(weather: WeatherType): string {
  switch (weather) {
    case 'rain':
    case 'heavy_rain':
    case 'ferocious_rain':
      return 'Rain is falling—please step carefully on wet platform tiles.';
    case 'thunderstorm':
      return 'Thunderstorm overhead; please shelter beneath the station canopy.';
    case 'snow':
      return 'Light snowfall on the tracks; heated cabin doors will open shortly.';
    case 'fog':
      return 'Soft valley mist ahead; listen for the approaching train chime.';
    case 'flood':
    case 'tsunami':
      return 'Coastal swell advisory active—remain on elevated station platforms.';
    default:
      return '';
  }
}

/**
 * Procedurally generates a region-aware station platform announcement with
 * distinct melodic chime notes, PA speaker pitch, and weather/time-sensitive text.
 */
export function generateStationAnnouncement(params: {
  stationIndex: number;
  eventKind: StationAnnouncementEventKind;
  timeHours: number;
  weather: WeatherType;
  nextStationIndex?: number;
  seed?: number;
}): StationAnnouncement {
  const stationIdx = ((params.stationIndex % STATIONS.length) + STATIONS.length) % STATIONS.length;
  const station = STATIONS[stationIdx];
  const regionId = getStationRegionId(stationIdx);
  const spec = REGION_PA_SPECS[regionId];
  const nextIdx =
    params.nextStationIndex !== undefined
      ? ((params.nextStationIndex % STATIONS.length) + STATIONS.length) % STATIONS.length
      : (stationIdx + 1) % STATIONS.length;
  const nextStation = STATIONS[nextIdx];
  const seedNum = Math.abs(Math.floor(params.seed ?? Math.round(params.timeHours * 10) + stationIdx * 7));

  const greeting = spec.greetings[seedNum % spec.greetings.length];
  const tip = spec.localTips[(seedNum + 1) % spec.localTips.length];
  const weatherNote = getWeatherAdvisory(params.weather);
  const timeNote = getTimeAdvisory(params.timeHours);

  let body = '';
  if (params.eventKind === 'approaching') {
    body = `The Dreamline Local is now approaching ${station.name}. Please stand behind the yellow tactile line.${weatherNote ? ' ' + weatherNote : ''}`;
  } else if (params.eventKind === 'arrived') {
    body = `Now arriving at ${station.name} (${station.jpName}). Doors are opening. ${tip}`;
  } else if (params.eventKind === 'departing') {
    body = `Doors closing at ${station.name}. Next stop: ${nextStation.name}. ${weatherNote || timeNote}`;
  } else {
    body = `${greeting} ${weatherNote || tip}`;
  }

  const syllableCount = Math.max(8, Math.min(20, Math.round(body.length / 7)));

  return {
    id: `${station.id}_${params.eventKind}_${seedNum}`,
    stationIndex: stationIdx,
    stationId: station.id,
    stationName: station.name,
    localName: station.jpName,
    regionId,
    regionTag: spec.regionTag,
    chimeName: spec.chimeName,
    chimeNotes: spec.chimeNotes,
    chimeWave: spec.chimeWave,
    chimeTempoSec: spec.chimeTempoSec,
    voicePitchHz: spec.voicePitchHz,
    syllableCount,
    text: body,
    eventKind: params.eventKind,
  };
}

/**
 * Computes continuous ambient platform crowd murmur parameters based on
 * proximity to the nearest station, its regional character, time of day,
 * weather, and whether the train is currently boarding.
 */
export function computeStationCrowdProfile(
  playerX: number,
  playerZ: number,
  timeHours: number,
  weather: WeatherType,
  trainState: Pick<TrainState, 'phase' | 'currentStationIndex' | 'worldX' | 'worldZ'>,
  isOnTrain: boolean
): StationCrowdProfile {
  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < STATIONS.length; i++) {
    const st = STATIONS[i];
    const d = Math.hypot(playerX - st.platformPos.x, playerZ - st.platformPos.z);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }

  const station = STATIONS[nearestIdx];
  const regionId = getStationRegionId(nearestIdx);
  const spec = REGION_PA_SPECS[regionId];

  // Audible platform crowd radius ~44m, fades smoothly to 0 beyond that
  const rawProx = Math.max(0, Math.min(1, 1 - nearestDist / 44));
  const proximity01 = rawProx * rawProx * (3 - 2 * rawProx);

  // Commuter rhythm: busier during morning & golden sunset rush, hushed at night
  const h = ((timeHours % 24) + 24) % 24;
  let timeFactor = 0.82;
  if (h >= 7 && h < 10) timeFactor = 1.08;
  else if (h >= 16.5 && h < 20) timeFactor = 1.12;
  else if (h >= 22 || h < 5.5) timeFactor = 0.36;

  // Heavy storms hush open-air platform chatter slightly
  const weatherFactor =
    weather === 'thunderstorm' || weather === 'ferocious_rain' || weather === 'tsunami'
      ? 0.58
      : weather === 'rain' || weather === 'heavy_rain' || weather === 'snow'
      ? 0.78
      : 1.0;

  // Platform buzz swells gently when the train is stopped/boarding at this station
  const boardingBoost =
    trainState.phase === 'stopped' && trainState.currentStationIndex === nearestIdx ? 1.28 : 1.0;

  // Slightly muffled if seated inside the train cabin
  const cabinAtten = isOnTrain ? 0.52 : 1.0;

  const bustle01 = Math.max(
    0,
    Math.min(1, spec.baseBustle * timeFactor * weatherFactor * boardingBoost)
  );
  const gain = Number((proximity01 * bustle01 * cabinAtten * 0.145).toFixed(4));

  return {
    nearestStationIndex: nearestIdx,
    stationId: station.id,
    regionId,
    proximity01,
    gain,
    bustle01,
    formantLowHz: spec.formants[0],
    formantMidHz: spec.formants[1],
    formantHighHz: spec.formants[2],
    modulationHz: spec.modulationHz,
  };
}
