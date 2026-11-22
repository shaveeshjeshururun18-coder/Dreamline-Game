import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  FastForward,
  Flag,
  MapPin,
  Snowflake,
  Sparkles,
  TrainFront,
  X,
} from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import {
  DREAMLINE_TRAIN_NAME,
  DREAMLINE_TRAIN_NUMBER,
  STATION_DWELL_SECONDS,
  STATIONS,
  TRAIN_CRUISE_MPS,
  getOrderedUpcomingStations,
  getTrackDistanceBetweenStations,
} from '../game/railway';
import { formatClockTime, normalizeHours } from '../game/timeWeather';

interface TrainRouteModalProps {
  hud: HudSnapshot;
  onConfirmRoute: (intermediateIndices: number[], destinationIndex: number) => void;
  onOpenAiConductor?: () => void;
  onClose: () => void;
}

export const TrainRouteModal: React.FC<TrainRouteModalProps> = ({
  hud,
  onConfirmRoute,
  onOpenAiConductor,
  onClose,
}) => {
  const originIndex = hud.train.currentStationIndex;
  const originStation = STATIONS[originIndex] ?? STATIONS[0];
  const upcomingIndices = useMemo(
    () => getOrderedUpcomingStations(originIndex),
    [originIndex]
  );

  // Default destination: Iceland Express Halt if upcoming, otherwise final stop along loop
  const defaultDestIndex = useMemo(() => {
    const existing = hud.train.routePlan;
    if (
      existing &&
      existing.originStationIndex === originIndex &&
      upcomingIndices.includes(existing.destinationIndex)
    ) {
      return existing.destinationIndex;
    }
    const icelandIdx = upcomingIndices.find((idx) => STATIONS[idx]?.connectsToIceland);
    return icelandIdx ?? upcomingIndices[upcomingIndices.length - 1];
  }, [hud.train.routePlan, originIndex, upcomingIndices]);

  // Default selected intermediate stops: preserve active plan or pick 1 scenic stop so player sees stop vs skip immediately
  const [destinationIndex, setDestinationIndex] = useState<number>(defaultDestIndex);
  const [selectedIntermediates, setSelectedIntermediates] = useState<number[]>(() => {
    const existing = hud.train.routePlan;
    if (existing && existing.originStationIndex === originIndex) {
      return existing.selectedStopIndices.filter((idx) => idx !== existing.destinationIndex);
    }
    const destPos = upcomingIndices.indexOf(defaultDestIndex);
    const beforeDest = upcomingIndices.slice(0, Math.max(0, destPos));
    const lakesideIdx = beforeDest.find((idx) => STATIONS[idx]?.id === 'aomizu_lakeside');
    if (lakesideIdx !== undefined) return [lakesideIdx];
    return beforeDest.length > 0 ? [beforeDest[Math.floor(beforeDest.length / 2)]] : [];
  });

  const destPos = upcomingIndices.indexOf(destinationIndex);
  const stopsBeforeDestination = useMemo(
    () => upcomingIndices.slice(0, Math.max(0, destPos)),
    [upcomingIndices, destPos]
  );

  const validIntermediates = useMemo(
    () => selectedIntermediates.filter((idx) => stopsBeforeDestination.includes(idx)),
    [selectedIntermediates, stopsBeforeDestination]
  );

  const skippedCount = stopsBeforeDestination.length - validIntermediates.length;
  const totalSelectedStops = validIntermediates.length + 1; // intermediates + final destination

  const previewStats = useMemo(() => {
    const routeMeters = getTrackDistanceBetweenStations(originIndex, destinationIndex);
    const travelSec =
      routeMeters / (TRAIN_CRUISE_MPS * 0.84) +
      validIntermediates.length * (STATION_DWELL_SECONDS + 3.5);
    const timetableMin = Math.max(4, Math.round(travelSec * 0.45));
    const departTime = formatClockTime(hud.timeHours);
    const etaTime = formatClockTime(normalizeHours(hud.timeHours + timetableMin / 60));
    const includesIceland =
      STATIONS[destinationIndex]?.connectsToIceland ||
      validIntermediates.some((idx) => STATIONS[idx]?.connectsToIceland);
    return {
      routeMeters: Math.round(routeMeters),
      timetableMin,
      departTime,
      etaTime,
      includesIceland,
    };
  }, [originIndex, destinationIndex, validIntermediates, hud.timeHours]);

  const toggleIntermediate = (idx: number) => {
    setSelectedIntermediates((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const handleSelectDestination = (idx: number) => {
    setDestinationIndex(idx);
    const newPos = upcomingIndices.indexOf(idx);
    const allowedBefore = new Set(upcomingIndices.slice(0, Math.max(0, newPos)));
    setSelectedIntermediates((prev) => prev.filter((item) => allowedBefore.has(item)));
  };

  const handleSelectAllStops = () => {
    setSelectedIntermediates([...stopsBeforeDestination]);
  };

  const handleExpressDirect = () => {
    setSelectedIntermediates([]);
  };

  const destinationStation = STATIONS[destinationIndex] ?? STATIONS[STATIONS.length - 1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Train Route & Station Selection"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#120E20]/86 p-3 sm:p-5"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-[#1A152C] border border-[#F5D6C0]/28 text-[#FAF5EF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-[#221B3A] border-b border-[#F5D6C0]/16">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-widest text-[#F4BE98]">
              <TrainFront className="w-3.5 h-3.5 shrink-0" />
              <span>
                {DREAMLINE_TRAIN_NUMBER} · {DREAMLINE_TRAIN_NAME}
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-semibold tracking-wide mt-0.5 text-[#FAF5EF]">
              Choose Your Railway Stops & Destination
            </h2>
            <p className="text-xs text-[#DFC8BC] mt-0.5">
              Select which stations the train stops at and which ones it cruises past non-stop.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Route Selection"
            onClick={onClose}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-md hover:bg-[#2E264A] text-[#F2E5DC] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Route Editor */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Origin Station Card */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[#251E3D] border border-[#F4BE98]/35">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#F4BE98] text-[#1D162E] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#F4BE98]">
                    Origin · Boarding
                  </span>
                  <span className="text-[11px] text-[#CBB8D4]">{originStation.regionTag}</span>
                </div>
                <div className="font-display text-sm sm:text-base font-semibold text-[#FAF5EF] truncate">
                  {originStation.name}
                  <span className="ml-2 text-xs font-normal text-[#DFC8BC]">
                    {originStation.jpName}
                  </span>
                </div>
              </div>
            </div>
            <span className="font-mono-tabular text-xs text-[#FCE2C8] shrink-0">
              {previewStats.departTime}
            </span>
          </div>

          {/* Quick Selection Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-medium uppercase tracking-wider text-[#DFC8BC]">
              Ordered Route Stations
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExpressDirect}
                disabled={stopsBeforeDestination.length === 0}
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#261F3E] hover:bg-[#322952] disabled:opacity-45 text-[#E8D9CF] border border-[#F5D6C0]/18 transition-colors cursor-pointer"
              >
                Express Non-Stop
              </button>
              <button
                type="button"
                onClick={handleSelectAllStops}
                disabled={stopsBeforeDestination.length === 0}
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#261F3E] hover:bg-[#322952] disabled:opacity-45 text-[#E8D9CF] border border-[#F5D6C0]/18 transition-colors cursor-pointer"
              >
                Stop at All
              </button>
            </div>
          </div>

          {/* Ordered Upcoming Station List */}
          <div className="space-y-2">
            {upcomingIndices.map((stIdx, listPos) => {
              const st = STATIONS[stIdx];
              const isDest = stIdx === destinationIndex;
              const isBeforeDest = listPos < destPos;
              const isAfterDest = listPos > destPos;
              const isSelectedStop = isDest || (isBeforeDest && validIntermediates.includes(stIdx));
              const isIceland = Boolean(st.connectsToIceland);

              return (
                <div
                  key={st.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg border transition-colors ${
                    isDest
                      ? isIceland
                        ? 'bg-[#1D2D44] border-[#8DE4FF]/65'
                        : 'bg-[#2C213E] border-[#F4BE98]/65'
                      : isSelectedStop
                      ? 'bg-[#231D3A] border-[#8CD9B2]/45'
                      : isAfterDest
                      ? 'bg-[#171326]/70 border-[#F5D6C0]/10 opacity-65'
                      : 'bg-[#1C1730] border-dashed border-[#F5D6C0]/20'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 mt-0.5 sm:mt-0 rounded-full flex items-center justify-center text-xs font-mono-tabular font-semibold shrink-0 ${
                        isDest
                          ? isIceland
                            ? 'bg-[#8DE4FF] text-[#112233]'
                            : 'bg-[#F4BE98] text-[#1D162E]'
                          : isSelectedStop
                          ? 'bg-[#8CD9B2] text-[#12261F]'
                          : 'bg-[#2C2545] text-[#B9ABC6]'
                      }`}
                    >
                      {isDest ? (
                        <Flag className="w-3.5 h-3.5" />
                      ) : isSelectedStop ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <FastForward className="w-3 h-3" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-semibold text-[#FAF5EF]">
                          {st.name}
                        </span>
                        <span className="text-xs text-[#D6C2BA]">{st.jpName}</span>
                        {isIceland && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#8DE4FF]/18 border border-[#8DE4FF]/40 text-[10px] font-medium text-[#C5F3FF]">
                            <Snowflake className="w-2.5 h-2.5" />
                            Iceland Gateway
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#BEB0C9] mt-0.5">
                        {st.regionTag} ·{' '}
                        {isDest ? (
                          <span className={isIceland ? 'text-[#9CE8FF] font-medium' : 'text-[#F7CBA6] font-medium'}>
                            Final Destination (Doors Open)
                          </span>
                        ) : isSelectedStop ? (
                          <span className="text-[#9EE4C0] font-medium">
                            Selected Stop (Train Stops Here)
                          </span>
                        ) : isAfterDest ? (
                          <span>Beyond Final Destination</span>
                        ) : (
                          <span className="text-[#C7B8D4]">
                            Skipped (Train Cruises Past Non-Stop)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Per-Station Controls */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-9 sm:pl-0">
                    {isBeforeDest && (
                      <button
                        type="button"
                        aria-label={`${isSelectedStop ? 'Skip' : 'Stop at'} ${st.name}`}
                        aria-pressed={isSelectedStop}
                        onClick={() => toggleIntermediate(stIdx)}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                          isSelectedStop
                            ? 'bg-[#213B34] hover:bg-[#294A41] border-[#8CD9B2]/50 text-[#B9F3D5]'
                            : 'bg-[#26203E] hover:bg-[#322A50] border-[#F5D6C0]/22 text-[#DFD2E6]'
                        }`}
                      >
                        {isSelectedStop ? 'Stop Here' : 'Skip Stop'}
                      </button>
                    )}

                    {!isDest && (
                      <button
                        type="button"
                        aria-label={`Set ${st.name} as Final Destination`}
                        onClick={() => handleSelectDestination(stIdx)}
                        className="px-2.5 py-1.5 rounded text-xs font-medium bg-[#2C2346] hover:bg-[#3A2E5C] border border-[#F5D6C0]/22 text-[#F8E7D8] transition-colors cursor-pointer"
                      >
                        Destination
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Iceland Transfer Note */}
          {previewStats.includesIceland && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#182B42] border border-[#8DE4FF]/40 text-xs text-[#D6F4FF]">
              <Snowflake className="w-4 h-4 text-[#8DE4FF] shrink-0 mt-0.5" />
              <p>
                <strong>Iceland Express Halt</strong> connects directly to{' '}
                <strong>Panimalai Iceland</strong>. Step inside to grow into colossal Giant Form
                (23.5m) beside the towering Giant Igloo Man (18.0m) — toggle{' '}
                <strong>Stay Giant</strong> anytime to keep Giant Form everywhere without changing
                back.
              </p>
            </div>
          )}
        </div>

        {/* Route Preview & Confirm Footer */}
        <div className="px-5 py-3.5 bg-[#161226] border-t border-[#F5D6C0]/16 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#E4D3CA]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[#FAF5EF]">
                {originStation.name} → {destinationStation.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#9EE4C0] font-medium">
                {totalSelectedStops} Stop{totalSelectedStops === 1 ? '' : 's'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#C7B8D4]">{skippedCount} Skipped</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-tabular text-[#FCE2C8]">
              <Clock className="w-3.5 h-3.5 text-[#F4BE98]" />
              <span>
                {previewStats.departTime} → {previewStats.etaTime} (~{previewStats.timetableMin} min)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {onOpenAiConductor && (
              <button
                type="button"
                onClick={onOpenAiConductor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/40 text-cyan-100 transition-colors cursor-pointer mr-auto"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Ask AI Conductor</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-[#27203F] hover:bg-[#342B52] border border-[#F5D6C0]/20 text-[#F2E5DC] transition-colors cursor-pointer"
            >
              Stay on Train
            </button>
            <button
              type="button"
              onClick={() => onConfirmRoute(validIntermediates, destinationIndex)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] transition-colors cursor-pointer"
            >
              <TrainFront className="w-4 h-4" />
              <span>Confirm Route & Depart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
