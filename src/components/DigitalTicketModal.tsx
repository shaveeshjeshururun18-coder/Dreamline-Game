import React, { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FastForward,
  Flag,
  Route,
  Snowflake,
  TrainFront,
  X,
} from 'lucide-react';
import type { DigitalTrainTicket, HudSnapshot } from '../game/types';
import { buildTicketQrMatrix, buildTicketTimeline } from '../game/tickets';

interface DigitalTicketModalProps {
  ticket: DigitalTrainTicket;
  hud: HudSnapshot;
  onEditRoute: () => void;
  onClose: () => void;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  ticket,
  hud,
  onEditRoute,
  onClose,
}) => {
  const qrMatrix = useMemo(() => buildTicketQrMatrix(ticket.qrSeed), [ticket.qrSeed]);
  const timeline = useMemo(() => buildTicketTimeline(ticket, hud.train), [ticket, hud.train]);

  const isSyncedWithLiveTrain = hud.train.routePlan?.id === ticket.routePlanId;
  const progressPct = isSyncedWithLiveTrain
    ? Math.round(hud.train.journeyProgress * 100)
    : hud.train.routePlan?.status === 'completed'
    ? 100
    : 0;

  const liveBadge = useMemo(() => {
    if (!isSyncedWithLiveTrain) return { label: 'ISSUED PASS', tone: 'bg-[#F4BE98]/20 text-[#FCE2C8] border-[#F4BE98]/45' };
    if (hud.train.routePlan?.status === 'completed') {
      return { label: 'ARRIVED', tone: 'bg-[#8CD9B2]/20 text-[#B9F3D5] border-[#8CD9B2]/50' };
    }
    if (hud.train.phase === 'stopped') {
      return { label: 'BOARDING', tone: 'bg-[#F4BE98]/22 text-[#FCE2C8] border-[#F4BE98]/55' };
    }
    return { label: 'IN TRANSIT', tone: 'bg-[#8DE4FF]/20 text-[#D0F5FF] border-[#8DE4FF]/50' };
  }, [isSyncedWithLiveTrain, hud.train.routePlan?.status, hud.train.phase]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Digital Train Ticket"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#120E20]/86 p-3 sm:p-5"
    >
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-[#F5D6C0]/30 bg-[#FCF7EE] text-[#1D162E] transition-all">
        {/* Top Operator Band */}
        <div
          className={`px-5 sm:px-6 py-4 flex items-center justify-between gap-3 ${
            ticket.includesIcelandTransfer
              ? 'bg-gradient-to-r from-[#1A2440] via-[#213458] to-[#1D3E5E]'
              : 'bg-gradient-to-r from-[#1D162E] via-[#2B2044] to-[#3B2648]'
          } text-[#FAF5EF]`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-[0.2em] text-[#F4BE98]">
              <TrainFront className="w-4 h-4 shrink-0" />
              <span>{ticket.operatorName}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
              <h2 className="font-display text-lg sm:text-xl font-semibold tracking-wide">
                {ticket.trainName}
              </h2>
              <span className="font-mono-tabular text-xs px-2 py-0.5 rounded bg-[#FAF5EF]/14 text-[#FCE2C8]">
                {ticket.trainNumber}
              </span>
            </div>
            <div className="text-[11px] text-[#DFD1CC] mt-0.5 flex items-center gap-1.5">
              {ticket.includesIcelandTransfer && (
                <Snowflake className="w-3.5 h-3.5 text-[#8DE4FF] shrink-0" />
              )}
              <span>{ticket.ticketClass}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular font-semibold tracking-wider border ${liveBadge.tone}`}
            >
              {liveBadge.label}
            </span>
            <button
              type="button"
              aria-label="Close Digital Ticket"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[#FAF5EF]/10 hover:bg-[#FAF5EF]/20 text-[#FAF5EF] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Ticket Body + Perforated QR Stub */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Main Boarding Pass Details */}
          <div className="md:col-span-8 p-5 sm:p-6 space-y-5">
            {/* Origin -> Destination Banner */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#1D162E]/12">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#7A5D58]">
                  From · Origin
                </div>
                <div className="font-display text-sm sm:text-base font-bold text-[#1D162E] leading-snug mt-0.5">
                  {ticket.originName}
                </div>
                <div className="text-[11px] text-[#6B5450] leading-snug mt-0.5">
                  {ticket.originTamilName}
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0 px-2 pt-3">
                <ArrowRight className="w-5 h-5 text-[#C86A4B]" />
                <span className="text-[10px] font-mono-tabular text-[#7A5D58] mt-0.5">
                  {ticket.selectedStopIndices.length} stop
                  {ticket.selectedStopIndices.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-right">
                <div className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#7A5D58]">
                  To · Destination
                </div>
                <div className="font-display text-sm sm:text-base font-bold text-[#1D162E] leading-snug mt-0.5">
                  {ticket.destinationName}
                </div>
                <div className="text-[11px] text-[#6B5450] leading-snug mt-0.5">
                  {ticket.destinationTamilName}
                </div>
              </div>
            </div>

            {/* Ticket Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="rounded-lg bg-[#F4ECE0] px-2.5 py-2 border border-[#1D162E]/8">
                <div className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#7A5D58]">
                  Date
                </div>
                <div className="font-mono-tabular text-xs font-semibold text-[#1D162E] mt-0.5">
                  {ticket.travelDate}
                </div>
              </div>
              <div className="rounded-lg bg-[#F4ECE0] px-2.5 py-2 border border-[#1D162E]/8">
                <div className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#7A5D58]">
                  Depart
                </div>
                <div className="font-mono-tabular text-xs font-semibold text-[#1D162E] mt-0.5">
                  {ticket.departureTime}
                </div>
              </div>
              <div className="rounded-lg bg-[#F4ECE0] px-2.5 py-2 border border-[#1D162E]/8">
                <div className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#7A5D58]">
                  Est. Arrival
                </div>
                <div className="font-mono-tabular text-xs font-semibold text-[#1D162E] mt-0.5">
                  {ticket.estimatedArrivalTime}
                </div>
              </div>
              <div className="rounded-lg bg-[#F4ECE0] px-2.5 py-2 border border-[#1D162E]/8">
                <div className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#7A5D58]">
                  Carriage
                </div>
                <div className="font-mono-tabular text-xs font-semibold text-[#1D162E] mt-0.5">
                  {ticket.carriageNumber}
                </div>
              </div>
              <div className="rounded-lg bg-[#F4ECE0] px-2.5 py-2 border border-[#1D162E]/8">
                <div className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#7A5D58]">
                  Seat
                </div>
                <div className="font-mono-tabular text-xs font-semibold text-[#1D162E] mt-0.5">
                  {ticket.seatNumber}
                </div>
              </div>
              <div className="rounded-lg bg-[#F4ECE0] px-2.5 py-2 border border-[#1D162E]/8">
                <div className="text-[9px] font-mono-tabular uppercase tracking-wider text-[#7A5D58]">
                  Companion
                </div>
                <div className="text-xs font-semibold text-[#1D162E] mt-0.5 truncate">Frosty</div>
              </div>
            </div>

            {/* Live Route Progress & Synchronized Stop Timeline */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2A203E] uppercase tracking-wider text-[11px]">
                  Live Route Progress & Stop Schedule
                </span>
                <span className="font-mono-tabular font-semibold text-[#C86A4B]">
                  {progressPct}% complete
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-[#E7DAC9] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    ticket.includesIcelandTransfer ? 'bg-[#2C7FA8]' : 'bg-[#C86A4B]'
                  }`}
                  style={{ width: `${Math.max(4, progressPct)}%` }}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                {timeline.map((item) => {
                  const isSkipped =
                    item.status === 'skipped_planned' || item.status === 'skipped_passed';
                  const isVisited =
                    item.status === 'origin' ||
                    item.status === 'visited' ||
                    item.status === 'destination_reached';
                  const isNext = item.status === 'next_selected';

                  const statusLabel =
                    item.status === 'origin'
                      ? 'Boarded'
                      : item.status === 'visited'
                      ? 'Stopped'
                      : item.status === 'next_selected'
                      ? 'Next Stop'
                      : item.status === 'upcoming_selected'
                      ? 'Selected Stop'
                      : item.status === 'skipped_passed'
                      ? 'Passed Non-Stop'
                      : item.status === 'skipped_planned'
                      ? 'Express Skip'
                      : item.status === 'destination_reached'
                      ? 'Arrived'
                      : 'Final Destination';

                  return (
                    <div
                      key={item.stationId}
                      className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-xs border ${
                        isNext
                          ? 'bg-[#FFF0E0] border-[#D98A5C] text-[#1D162E]'
                          : item.isDestination
                          ? item.connectsToIceland
                            ? 'bg-[#E6F6FD] border-[#5BB4DC] text-[#122638]'
                            : 'bg-[#F8ECDC] border-[#C86A4B]/50 text-[#1D162E]'
                          : isSkipped
                          ? 'bg-[#F5EFE6]/70 border-dashed border-[#1D162E]/15 text-[#7A6B69]'
                          : 'bg-[#FAF3E8] border-[#1D162E]/12 text-[#2A203E]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isVisited ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                        ) : item.isDestination ? (
                          <Flag className="w-3.5 h-3.5 text-[#C86A4B] shrink-0" />
                        ) : isSkipped ? (
                          <FastForward className="w-3.5 h-3.5 text-[#8D7D7B] shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-[#C86A4B] shrink-0" />
                        )}
                        <span className={`font-medium truncate ${isSkipped ? 'line-through decoration-[#9A8A88]' : ''}`}>
                          {item.name}
                        </span>
                        {item.connectsToIceland && (
                          <Snowflake className="w-3 h-3 text-[#2B82AA] shrink-0" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono-tabular uppercase tracking-wider shrink-0 font-semibold ${
                          isVisited
                            ? 'text-[#2E7D5B]'
                            : isNext
                            ? 'text-[#B85635]'
                            : isSkipped
                            ? 'text-[#8B7B78]'
                            : 'text-[#5C4946]'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Perforated QR Boarding Stub */}
          <div className="md:col-span-4 bg-[#F3E9DA] border-t md:border-t-0 md:border-l border-dashed border-[#1D162E]/25 p-5 sm:p-6 flex flex-col items-center justify-between gap-4">
            <div className="text-center">
              <div className="text-[10px] font-mono-tabular uppercase tracking-[0.18em] text-[#7A5D58]">
                Boarding Verification
              </div>
              <div className="font-mono-tabular text-sm font-bold text-[#1D162E] mt-1">
                {ticket.ticketId}
              </div>
            </div>

            {/* Crisp Procedural 21x21 SVG QR Code */}
            <div className="p-3 rounded-xl bg-white border border-[#1D162E]/15 shadow-sm">
              <svg
                viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                className="w-36 h-36 block"
                role="img"
                aria-label={`QR verification code for ticket ${ticket.ticketId}`}
              >
                <rect width={qrMatrix.length} height={qrMatrix.length} fill="#FFFFFF" />
                {qrMatrix.map((row, r) =>
                  row.map((on, c) =>
                    on ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width={1}
                        height={1}
                        fill="#1D162E"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <div className="w-full space-y-2 text-center">
              <p className="text-[11px] text-[#5C4A46] leading-snug">
                Valid for 1 Passenger + Frosty the Ice Companion · Reopen anytime with{' '}
                <span className="font-mono-tabular font-semibold">[I]</span>
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-md text-xs sm:text-sm font-semibold bg-[#1D162E] hover:bg-[#2F244A] text-[#FAF5EF] transition-colors cursor-pointer"
                >
                  Continue Journey
                </button>
                {hud.activeVehicle === 'train' && (
                  <button
                    type="button"
                    onClick={onEditRoute}
                    className="w-full py-1.5 px-3 rounded-md text-xs font-medium bg-[#E8DACA] hover:bg-[#DECBB6] text-[#1D162E] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Route className="w-3.5 h-3.5" />
                    <span>Edit Stops / Route</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
