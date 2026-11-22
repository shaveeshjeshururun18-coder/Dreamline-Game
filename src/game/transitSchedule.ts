import type { BusState, TrainState } from './types';
import {
  RAILWAY_TOTAL_LENGTH,
  STATIONS,
  STATION_DWELL_SECONDS,
  TRAIN_CRUISE_MPS,
  forwardDeltaT,
} from './railway';
import { BUS_ROAD_LENGTH, BUS_STOPS } from './vehicles';
import { formatClockTime, normalizeHours } from './timeWeather';

export type TransitEntryStatus = 'boarding' | 'arriving' | 'scheduled';

export interface TrainStationScheduleRow {
  stationIndex: number;
  stationId: string;
  stationName: string;
  tamilName: string;
  regionTag: string;
  platformLabel: string;
  destinationName: string;
  destinationTamil: string;
  departureTime: string;
  arrivalTime: string;
  etaSeconds: number;
  status: TransitEntryStatus;
  statusLabel: string;
  connectsToIceland: boolean;
  worldX: number;
  worldZ: number;
  teleportX: number;
  teleportZ: number;
}

export interface BusStopScheduleRow {
  stopIndex: number;
  stopId: string;
  stopName: string;
  tamilName: string;
  destinationName: string;
  destinationTamil: string;
  departureTime: string;
  arrivalTime: string;
  etaSeconds: number;
  status: TransitEntryStatus;
  statusLabel: string;
  worldX: number;
  worldZ: number;
  teleportX: number;
  teleportZ: number;
}

const BUS_CRUISE_AVG_MPS = 8.4;
const BUS_DWELL_AVG_S = 9.5;
const TRAIN_CRUISE_AVG_MPS = TRAIN_CRUISE_MPS * 0.85;

function wrapT(t: number): number {
  const r = t % 1;
  return r < 0 ? r + 1 : r;
}

function busForwardDeltaT(fromT: number, toT: number): number {
  const d = wrapT(toT) - wrapT(fromT);
  return d >= 0 ? d : d + 1;
}

function secondsToClockLabel(baseTimeHours: number, offsetSeconds: number): string {
  // Scenic railway timetable maps 2 real seconds ≈ 1 in-world timetable minute for lively readability
  const addedMinutes = Math.max(0, Math.round(offsetSeconds * 0.5));
  return formatClockTime(normalizeHours(baseTimeHours + addedMinutes / 60));
}

/**
 * Computes real-time destination & departure timing rows for ALL 5 railway stations
 * on the Dreamline Scenic Express (DL-402) loop.
 */
export function computeTrainStationTimetable(
  train: TrainState,
  timeHours: number
): TrainStationScheduleRow[] {
  const totalStations = STATIONS.length;

  return STATIONS.map((st, idx) => {
    const nextStop = STATIONS[(idx + 1) % totalStations];
    const isHereStopped = train.phase === 'stopped' && train.currentStationIndex === idx;
    const isImmediateNext = train.nextStationIndex === idx && train.phase !== 'stopped';

    let arrivalEtaSec = 0;
    let departureEtaSec = 0;
    let status: TransitEntryStatus = 'scheduled';
    let statusLabel = '';

    if (isHereStopped) {
      arrivalEtaSec = 0;
      departureEtaSec = train.dwellHold
        ? Math.round(STATION_DWELL_SECONDS)
        : Math.max(1, Math.round(STATION_DWELL_SECONDS - train.dwellTimer));
      status = 'boarding';
      statusLabel = train.dwellHold
        ? 'Boarding Now · Waiting'
        : `Boarding Now · Departs in ${departureEtaSec}s`;
    } else {
      const distM = forwardDeltaT(train.t, st.splineT) * RAILWAY_TOTAL_LENGTH;
      // Count intermediate stops between train's current next station and target station
      let stopsBetween = 0;
      let cursor = train.nextStationIndex;
      while (cursor !== idx && stopsBetween < totalStations) {
        stopsBetween++;
        cursor = (cursor + 1) % totalStations;
      }
      const dwellWait =
        (train.phase === 'stopped' ? Math.max(0, STATION_DWELL_SECONDS - train.dwellTimer) : 0) +
        stopsBetween * STATION_DWELL_SECONDS;
      arrivalEtaSec = Math.max(
        1,
        Math.round(distM / TRAIN_CRUISE_AVG_MPS + dwellWait)
      );
      departureEtaSec = arrivalEtaSec + Math.round(STATION_DWELL_SECONDS);

      if (isImmediateNext && arrivalEtaSec <= 18) {
        status = 'arriving';
        statusLabel = `Arriving in ${arrivalEtaSec}s`;
      } else {
        status = 'scheduled';
        statusLabel = `Next in ${arrivalEtaSec}s`;
      }
    }

    const arrivalTime = secondsToClockLabel(timeHours, arrivalEtaSec);
    const departureTime = secondsToClockLabel(timeHours, departureEtaSec);

    return {
      stationIndex: idx,
      stationId: st.id,
      stationName: st.name,
      tamilName: st.jpName,
      regionTag: st.regionTag,
      platformLabel: `Platform ${idx + 1}`,
      destinationName: `To ${nextStop.name}`,
      destinationTamil: nextStop.jpName,
      departureTime,
      arrivalTime,
      etaSeconds: arrivalEtaSec,
      status,
      statusLabel,
      connectsToIceland: Boolean(st.connectsToIceland),
      worldX: st.worldX,
      worldZ: st.worldZ,
      teleportX: st.platformX,
      teleportZ: st.platformZ,
    };
  });
}

/**
 * Computes real-time destination & departure timing rows for ALL 4 countryside & coastal bus stops
 * on the Dreamline Rural Bus (BUS-12) loop.
 */
export function computeBusStopTimetable(
  bus: BusState,
  timeHours: number
): BusStopScheduleRow[] {
  const totalStops = BUS_STOPS.length;

  return BUS_STOPS.map((stop, idx) => {
    const nextStop = BUS_STOPS[(idx + 1) % totalStops];
    const isHereStopped = bus.phase === 'stopped' && bus.currentStopIndex === idx;
    const isImmediateNext = bus.nextStopIndex === idx && bus.phase !== 'stopped';

    let arrivalEtaSec = 0;
    let departureEtaSec = 0;
    let status: TransitEntryStatus = 'scheduled';
    let statusLabel = '';

    if (isHereStopped) {
      arrivalEtaSec = 0;
      departureEtaSec = Math.max(1, Math.round(BUS_DWELL_AVG_S - bus.dwellTimer));
      status = 'boarding';
      statusLabel = `Boarding Now · Departs in ${departureEtaSec}s`;
    } else {
      const distM = busForwardDeltaT(bus.t, stop.splineT) * BUS_ROAD_LENGTH;
      let stopsBetween = 0;
      let cursor = bus.nextStopIndex;
      while (cursor !== idx && stopsBetween < totalStops) {
        stopsBetween++;
        cursor = (cursor + 1) % totalStops;
      }
      const dwellWait =
        (bus.phase === 'stopped' ? Math.max(0, BUS_DWELL_AVG_S - bus.dwellTimer) : 0) +
        stopsBetween * BUS_DWELL_AVG_S;
      arrivalEtaSec = Math.max(1, Math.round(distM / BUS_CRUISE_AVG_MPS + dwellWait));
      departureEtaSec = arrivalEtaSec + Math.round(BUS_DWELL_AVG_S);

      if (isImmediateNext && arrivalEtaSec <= 16) {
        status = 'arriving';
        statusLabel = `Arriving in ${arrivalEtaSec}s`;
      } else {
        status = 'scheduled';
        statusLabel = `Next in ${arrivalEtaSec}s`;
      }
    }

    const arrivalTime = secondsToClockLabel(timeHours, arrivalEtaSec);
    const departureTime = secondsToClockLabel(timeHours, departureEtaSec);

    return {
      stopIndex: idx,
      stopId: stop.id,
      stopName: stop.name,
      tamilName: stop.tamilName,
      destinationName: `To ${nextStop.name}`,
      destinationTamil: nextStop.tamilName,
      departureTime,
      arrivalTime,
      etaSeconds: arrivalEtaSec,
      status,
      statusLabel,
      worldX: stop.worldX,
      worldZ: stop.worldZ,
      teleportX: stop.stopX,
      teleportZ: stop.stopZ,
    };
  });
}
