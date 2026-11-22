import React, { useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Megaphone,
  Route,
  Send,
  Sparkles,
  TrainFront,
  Volume2,
  X,
} from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import { STATIONS } from '../game/railway';

interface AiConductorModalProps {
  hud: HudSnapshot;
  onApplyRoute: (intermediateIndices: number[], destinationIndex: number) => void;
  onClose: () => void;
}

interface AnnouncementResult {
  english: string;
  tamil: string;
  vibeNote: string;
}

interface RoutePlanResult {
  englishReply: string;
  tamilReply: string;
  destinationIndex: number;
  intermediateIndices: number[];
  reason: string;
}

const QUICK_PROMPTS = [
  'Take me to Dinosaur Island with a stop at the Lake',
  'I want a quiet scenic loop ending at Iceland Express Halt',
  'Direct express ride to Thendral Malai Halt',
];

export const AiConductorModal: React.FC<AiConductorModalProps> = ({
  hud,
  onApplyRoute,
  onClose,
}) => {
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceError, setAnnounceError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementResult | null>(null);

  const [tripPrompt, setTripPrompt] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routePlan, setRoutePlan] = useState<RoutePlanResult | null>(null);

  const currentStation = STATIONS[hud.train.currentStationIndex] ?? STATIONS[0];
  const nextStation = STATIONS[hud.train.nextStationIndex] ?? STATIONS[1];

  const handleGenerateAnnouncement = async () => {
    setAnnounceLoading(true);
    setAnnounceError(null);
    try {
      const resp = await fetch('/api/conductor/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationName: currentStation.name,
          stationTamil: currentStation.jpName,
          nextStationName: nextStation.name,
          timeFormatted: hud.timeFormatted,
          period: hud.period,
          weather: hud.weather,
          season: hud.season,
          trainName: hud.train.trainName,
          trainNumber: hud.train.trainNumber,
          speedKmh: hud.train.speedKmh,
          isDinosaurIslandNext: Boolean(nextStation.isDinosaurIsland),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || `Server error (${resp.status})`);
      }
      setAnnouncement(data as AnnouncementResult);
    } catch (err) {
      setAnnounceError(err instanceof Error ? err.message : 'Unable to reach AI Station Announcer.');
    } finally {
      setAnnounceLoading(false);
    }
  };

  const handleReadAloud = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.96;
    utter.pitch = 1.02;
    window.speechSynthesis.speak(utter);
  };

  const handlePlanTrip = async (promptOverride?: string) => {
    const query = (promptOverride ?? tripPrompt).trim();
    if (!query) return;
    if (promptOverride) setTripPrompt(promptOverride);

    setRouteLoading(true);
    setRouteError(null);
    try {
      const resp = await fetch('/api/conductor/plan-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: query,
          currentStationIndex: hud.train.currentStationIndex,
          timeFormatted: hud.timeFormatted,
          weather: hud.weather,
          season: hud.season,
          stations: STATIONS.map((s, idx) => ({
            index: idx,
            id: s.id,
            name: s.name,
            tamilName: s.jpName,
            regionTag: s.regionTag,
            connectsToIceland: Boolean(s.connectsToIceland),
            isDinosaurIsland: Boolean(s.isDinosaurIsland),
          })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || `Server error (${resp.status})`);
      }
      setRoutePlan(data as RoutePlanResult);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Unable to plan AI route.');
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/72 p-4"
      role="dialog"
      aria-label="AI Station Announcer and Smart Railway Conductor"
      data-testid="ai-conductor-modal"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111726] border border-cyan-300/30 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161e31]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-300/35 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                AI Station Announcer & Smart Conductor
              </h2>
              <p className="text-xs text-slate-300">
                Bilingual English + Tamil PA Announcements · Natural-Language Train Route Planner
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Conductor"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Section 1: Bilingual Station Announcer */}
          <section className="rounded-xl bg-[#182135] border border-white/10 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-semibold text-amber-100">
                  Live Bilingual Station Announcer
                </h3>
              </div>
              <span className="text-[11px] text-slate-300">
                {hud.timeFormatted} · {hud.weather.replace('_', ' ')} · Next: {nextStation.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAnnouncement}
                disabled={announceLoading}
                data-testid="ai-generate-announcement-btn"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
              >
                {announceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Megaphone className="w-4 h-4" />
                )}
                Generate Live PA Announcement
              </button>
              {announcement && (
                <button
                  type="button"
                  onClick={() => handleReadAloud(announcement.english)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  Read Aloud
                </button>
              )}
            </div>

            {announceError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-400/35 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{announceError}</span>
              </div>
            )}

            {announcement && (
              <div className="space-y-2 rounded-lg bg-[#0f1523] border border-amber-300/20 p-3.5">
                <p className="text-sm text-white leading-relaxed">{announcement.english}</p>
                <p className="text-xs text-amber-200/90 leading-relaxed">{announcement.tamil}</p>
                {announcement.vibeNote && (
                  <p className="text-[11px] text-cyan-200/80 pt-1 border-t border-white/10">
                    {announcement.vibeNote}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Section 2: Smart AI Railway Conductor */}
          <section className="rounded-xl bg-[#182135] border border-white/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-cyan-300" />
              <h3 className="text-sm font-semibold text-cyan-100">
                Smart AI Railway Conductor
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Tell the conductor where you want to go in natural language — it will pick the exact stops and apply the route directly to the Dreamline Express.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={tripPrompt}
                onChange={(e) => setTripPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePlanTrip();
                }}
                placeholder="e.g., Take me to Dinosaur Island with a stop at Neelam Lake"
                data-testid="ai-conductor-input"
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0d1320] border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handlePlanTrip()}
                disabled={routeLoading || !tripPrompt.trim()}
                data-testid="ai-plan-route-btn"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
              >
                {routeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Plan
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handlePlanTrip(q)}
                  disabled={routeLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/14 border border-white/10 text-[11px] text-slate-200 cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {routeError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-400/35 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{routeError}</span>
              </div>
            )}

            {routePlan && (
              <div className="space-y-3 rounded-lg bg-[#0f1523] border border-cyan-300/25 p-3.5">
                <p className="text-sm text-white leading-relaxed">{routePlan.englishReply}</p>
                <p className="text-xs text-cyan-200/90 leading-relaxed">{routePlan.tamilReply}</p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Planned Stops:</span>
                  {routePlan.intermediateIndices.map((idx) => (
                    <span
                      key={`int-${idx}`}
                      className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] text-slate-100"
                    >
                      {STATIONS[idx]?.name ?? `Station ${idx + 1}`}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded bg-cyan-400/20 border border-cyan-300/40 text-[11px] font-semibold text-cyan-200">
                    Destination: {STATIONS[routePlan.destinationIndex]?.name ?? 'Destination'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onApplyRoute(routePlan.intermediateIndices, routePlan.destinationIndex);
                    onClose();
                  }}
                  data-testid="ai-apply-route-btn"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
                >
                  <TrainFront className="w-4 h-4" />
                  Board & Apply AI Train Route
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
