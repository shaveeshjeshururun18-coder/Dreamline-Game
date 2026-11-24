import React from 'react';
import {
  Compass,
  Flame,
  Hand,
  MessageCircleHeart,
  Music,
  Ship,
  Snowflake,
  Sparkles,
  TrainFront,
  X,
} from 'lucide-react';
import type { FrostyEmote, HudSnapshot, RegionId } from '../game/types';
import { REGION_LABELS } from '../game/terrain';

interface CompanionSpeechProps {
  name: string;
  tamilName: string;
  line: string;
}

export const CompanionSpeechBanner: React.FC<CompanionSpeechProps> = ({
  name,
  tamilName,
  line,
}) => (
  <div className="flex justify-center pointer-events-none">
    <div className="max-w-lg px-4 py-2.5 rounded-lg bg-[#16192E]/92 border border-[#7AE6FF]/40 text-[#FAF5EF] shadow-lg">
      <div className="flex items-center gap-1.5 text-[11px] text-[#8CEBFF] tracking-wide mb-0.5">
        <Snowflake className="w-3.5 h-3.5 text-[#7AE6FF]" />
        <span className="font-semibold uppercase">{name}</span>
        <span className="text-[#C6EFFF]">{tamilName}</span>
      </div>
      <p className="text-xs sm:text-sm leading-relaxed text-[#F2F9FF]">{line}</p>
    </div>
  </div>
);

interface CompanionJournalModalProps {
  hud: HudSnapshot;
  onChat: () => void;
  onFrostyEmote: (emote: FrostyEmote) => void;
  onTeleportHome: () => void;
  onClose: () => void;
}

const ALL_REGIONS: RegionId[] = ['sakura', 'coastal', 'snow', 'countryside', 'lake_camp', 'desert'];

export const CompanionJournalModal: React.FC<CompanionJournalModalProps> = ({
  hud,
  onChat,
  onFrostyEmote,
  onTeleportHome,
  onClose,
}) => {
  const mem = hud.companionMemory;
  const visitedSet = new Set(mem.visitedRegions);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Frosty Travel Journal"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#101222]/82 p-4 md:p-8"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#16182E] border border-[#8CEBFF]/25 text-[#FAF5EF] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#8CEBFF]/15">
          <div className="flex items-center gap-3">
            <Snowflake className="w-5 h-5 text-[#7AE6FF]" />
            <div>
              <h2 className="font-display text-xl font-semibold tracking-wide">
                Travel Journal with {hud.companion.name}
              </h2>
              <p className="text-xs text-[#BEE6F5]">
                {hud.companion.tamilName} · Permanent Living Ice Companion
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Journal"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#232746] text-[#F2F9FF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Play with Frosty & Quick Companion Actions */}
          <div className="p-4 rounded-lg bg-[#1E223D] border border-[#8CEBFF]/18 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-[#EEF8FF]">
                <div className="font-medium text-[#FAF5EF]">
                  Currently: {hud.location.name} ({hud.location.jpName})
                </div>
                <p className="text-xs text-[#B7D7E8] mt-0.5">
                  {hud.companion.restingInIgloo
                    ? 'Curled up peacefully inside his En Illam igloo bed.'
                    : hud.companion.currentLine || 'Waddling happily beside you across Dreamline!'}
                </p>
              </div>
              <button
                type="button"
                onClick={onTeleportHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2A3052] hover:bg-[#353D66] text-[#FAF5EF] border border-[#8CEBFF]/25 text-xs font-medium cursor-pointer transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-[#8CEBFF]" />
                Visit Frosty&apos;s Igloo at En Illam
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7AE6FF] hover:bg-[#A1EEFF] text-[#111829] text-xs font-semibold cursor-pointer transition-colors"
              >
                <MessageCircleHeart className="w-3.5 h-3.5" />
                Chat [H]
              </button>
              <button
                type="button"
                onClick={() => onFrostyEmote('wave')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262C4D] hover:bg-[#323B66] text-[#E6F8FF] border border-[#8CEBFF]/25 text-xs font-medium cursor-pointer transition-colors"
              >
                <Hand className="w-3.5 h-3.5 text-[#8CEBFF]" />
                Wave [G]
              </button>
              <button
                type="button"
                onClick={() => onFrostyEmote('dance')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262C4D] hover:bg-[#323B66] text-[#E6F8FF] border border-[#8CEBFF]/25 text-xs font-medium cursor-pointer transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-[#8CEBFF]" />
                Snow Dance
              </button>
              <button
                type="button"
                onClick={() => onFrostyEmote('snowball')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262C4D] hover:bg-[#323B66] text-[#E6F8FF] border border-[#8CEBFF]/25 text-xs font-medium cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8CEBFF]" />
                Make Snow Buddy
              </button>
            </div>
          </div>

          {/* 5 Regions Explored */}
          <div>
            <h3 className="text-xs font-medium tracking-wider text-[#B6D9EB] uppercase mb-2.5">
              Regions Explored Together ({visitedSet.size} / 5)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_REGIONS.map((rid) => {
                const info = REGION_LABELS[rid];
                const visited = visitedSet.has(rid);
                return (
                  <div
                    key={rid}
                    className={`px-3.5 py-2.5 rounded-md border flex items-center justify-between ${
                      visited
                        ? 'bg-[#202644] border-[#7AE6FF]/35 text-[#FAF5EF]'
                        : 'bg-[#121528] border-[#8CEBFF]/10 text-[#8694B0]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{info.name}</div>
                      <div className="text-[11px] opacity-80">{info.tamil}</div>
                    </div>
                    <span className="text-[11px] font-mono-tabular">
                      {visited ? 'Visited' : 'Unvisited'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared Journey Counters */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-md bg-[#1D213B] border border-[#8CEBFF]/14">
              <TrainFront className="w-4 h-4 text-[#F4BE98] mx-auto mb-1" />
              <div className="font-mono-tabular text-lg font-semibold">
                {mem.trainRides + mem.busRides}
              </div>
              <div className="text-[11px] text-[#C5D8E6]">Train & Bus Rides</div>
            </div>
            <div className="p-3 rounded-md bg-[#1D213B] border border-[#8CEBFF]/14">
              <Ship className="w-4 h-4 text-[#8CEBFF] mx-auto mb-1" />
              <div className="font-mono-tabular text-lg font-semibold">{mem.boatRides}</div>
              <div className="text-[11px] text-[#C5D8E6]">Boat Voyages</div>
            </div>
            <div className="p-3 rounded-md bg-[#1D213B] border border-[#8CEBFF]/14">
              <Flame className="w-4 h-4 text-[#FFAD6B] mx-auto mb-1" />
              <div className="font-mono-tabular text-lg font-semibold">{mem.campingNights}</div>
              <div className="text-[11px] text-[#C5D8E6]">Campfire Moments</div>
            </div>
          </div>

          {/* Recent Shared Memories Log */}
          <div>
            <h3 className="text-xs font-medium tracking-wider text-[#B6D9EB] uppercase mb-2">
              Shared Memories with Frosty
            </h3>
            <div className="space-y-1.5">
              {mem.memoriesLog.slice(0, 6).map((note, idx) => (
                <div
                  key={`${idx}-${note}`}
                  className="px-3.5 py-2 rounded bg-[#121528] border border-[#8CEBFF]/10 text-xs text-[#E4EFF8]"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
