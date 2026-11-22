import type { DigitalTrainTicket, TrainRoutePlan, TrainState } from './types';
import { DREAMLINE_TRAIN_NAME, DREAMLINE_TRAIN_NUMBER, STATIONS } from './railway';
import { formatClockTime } from './timeWeather';

export type TicketStopLiveStatus =
  | 'origin'
  | 'visited'
  | 'next_selected'
  | 'upcoming_selected'
  | 'skipped_passed'
  | 'skipped_planned'
  | 'destination_reached'
  | 'destination_pending';

export interface TicketStopTimelineItem {
  stationIndex: number;
  stationId: string;
  name: string;
  tamilName: string;
  connectsToIceland: boolean;
  isSelected: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  status: TicketStopLiveStatus;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates a realistic, 100%-synchronized DigitalTrainTicket directly from a confirmed TrainRoutePlan.
 * Uses the exact same stations, stops, and routePlanId as the live railway simulation.
 */
export function generateDigitalTicket(
  routePlan: TrainRoutePlan,
  trainName = DREAMLINE_TRAIN_NAME,
  trainNumber = DREAMLINE_TRAIN_NUMBER,
  issuedAt = Date.now()
): DigitalTrainTicket {
  const origin = STATIONS[routePlan.originStationIndex] ?? STATIONS[0];
  const destination = STATIONS[routePlan.destinationIndex] ?? STATIONS[STATIONS.length - 1];

  const intermediateStopIndices = routePlan.selectedStopIndices.filter(
    (idx) => idx !== routePlan.destinationIndex
  );
  const intermediateStopNames = intermediateStopIndices.map(
    (idx) => STATIONS[idx]?.name ?? `Station ${idx + 1}`
  );
  const skippedStopIndices = routePlan.allUpcomingIndices.filter(
    (idx) => !routePlan.selectedStopIndices.includes(idx)
  );

  const seedStr = `${routePlan.id}|${origin.id}|${destination.id}|${routePlan.selectedStopIndices.join(',')}`;
  const hash = hashString(seedStr);
  const codeSuffix = (hash % 8999 + 1000).toString();
  const seatRow = (hash % 8) + 1;
  const seatCol = ['A', 'B', 'C', 'D'][(hash >>> 4) % 4];
  const carriageNum = (hash % 2) === 0 ? '01' : '02';

  const d = new Date(issuedAt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const travelDate = `${dd} ${monthNames[d.getMonth()]} ${yyyy}`;

  return {
    ticketId: `DL-${yyyy}${mm}${dd}-${codeSuffix}`,
    routePlanId: routePlan.id,
    operatorName: 'DREAMLINE RAILWAYS',
    trainName,
    trainNumber,
    ticketClass: routePlan.includesIcelandTransfer
      ? 'Scenic Glacier Express · First Class'
      : 'Panoramic Countryside · First Class',
    carriageNumber: `CAR ${carriageNum}`,
    seatNumber: `${seatRow}${seatCol}`,
    travelDate,
    departureTime: formatClockTime(routePlan.departureTimeHours),
    estimatedArrivalTime: formatClockTime(routePlan.estimatedArrivalTimeHours),
    originStationIndex: routePlan.originStationIndex,
    originStationId: origin.id,
    originName: origin.name,
    originTamilName: origin.jpName,
    destinationStationIndex: routePlan.destinationIndex,
    destinationStationId: destination.id,
    destinationName: destination.name,
    destinationTamilName: destination.jpName,
    selectedStopIndices: [...routePlan.selectedStopIndices],
    intermediateStopIndices,
    intermediateStopNames,
    skippedStopIndices,
    allUpcomingIndices: [...routePlan.allUpcomingIndices],
    includesIcelandTransfer: routePlan.includesIcelandTransfer,
    qrSeed: `${seedStr}|${codeSuffix}`,
    issuedAt,
  };
}

/**
 * Generates a deterministic 21x21 QR-code-style boolean matrix with authentic 7x7 finder patterns
 * for rendering a razor-sharp inline SVG QR code on the digital ticket.
 */
export function buildTicketQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = border || core;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing strips
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic pseudo-random payload modules
  let state = hashString(seed) || 0x9e3779b9;
  const nextBit = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) & 1) === 1;
  };

  const inFinderOrSeparator = (r: number, c: number) => {
    if (r < 8 && c < 8) return true;
    if (r < 8 && c >= size - 8) return true;
    if (r >= size - 8 && c < 8) return true;
    if (r === 6 || c === 6) return true;
    return false;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!inFinderOrSeparator(r, c)) {
        grid[r][c] = nextBit();
      }
    }
  }

  return grid;
}

/**
 * Produces the synchronized per-station timeline for both the Digital Train Ticket
 * and the live On-Train Passenger Information Display.
 */
export function buildTicketTimeline(
  ticket: DigitalTrainTicket,
  train: TrainState
): TicketStopTimelineItem[] {
  const plan = train.routePlan && train.routePlan.id === ticket.routePlanId ? train.routePlan : null;
  const originSt = STATIONS[ticket.originStationIndex] ?? STATIONS[0];

  const items: TicketStopTimelineItem[] = [
    {
      stationIndex: ticket.originStationIndex,
      stationId: originSt.id,
      name: originSt.name,
      tamilName: originSt.jpName,
      connectsToIceland: Boolean(originSt.connectsToIceland),
      isSelected: true,
      isOrigin: true,
      isDestination: false,
      status: 'origin',
    },
  ];

  for (const idx of ticket.allUpcomingIndices) {
    const st = STATIONS[idx];
    if (!st) continue;
    const isSelected = ticket.selectedStopIndices.includes(idx);
    const isDestination = idx === ticket.destinationStationIndex;
    const visited = plan ? plan.visitedStopIndices.includes(idx) : false;
    const skippedPassed = plan ? plan.skippedStopIndices.includes(idx) : false;

    let status: TicketStopLiveStatus;
    if (isDestination) {
      status = visited || plan?.status === 'completed' ? 'destination_reached' : 'destination_pending';
    } else if (isSelected) {
      if (visited) status = 'visited';
      else if (plan && train.nextStationIndex === idx) status = 'next_selected';
      else status = 'upcoming_selected';
    } else {
      status = skippedPassed ? 'skipped_passed' : 'skipped_planned';
    }

    items.push({
      stationIndex: idx,
      stationId: st.id,
      name: st.name,
      tamilName: st.jpName,
      connectsToIceland: Boolean(st.connectsToIceland),
      isSelected,
      isOrigin: false,
      isDestination,
      status,
    });
  }

  return items;
}
