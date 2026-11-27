import React, { useState } from 'react';
import { Check, Phone, Smartphone, Snowflake, X } from 'lucide-react';
import type {
  DayCyclePreference,
  GameSettings,
  GraphicsQuality,
  HudSnapshot,
  SeasonType,
  SizeMode,
  WeatherType,
} from '../game/types';
import { SEASON_LABELS, WEATHER_LABELS } from '../game/timeWeather';

interface PauseSettingsModalProps {
  isTitleSettingsOnly: boolean;
  settings: GameSettings;
  hud: HudSnapshot;
  onUpdateSettings: (next: GameSettings) => void;
  onChangeWeather: (weather: WeatherType) => void;
  onChangeSeason: (season: SeasonType) => void;
  onSetSizeMode: (mode: SizeMode) => void;
  onToggleGiantSmall: () => void;
  onOpenMobilePhone?: () => void;
  onOpenAndroidApp: () => void;
  onResume: () => void;
  onSaveJourney: () => void;
  onReturnToTitle: () => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  isTitleSettingsOnly,
  settings,
  hud,
  onUpdateSettings,
  onChangeWeather,
  onChangeSeason,
  onSetSizeMode,
  onToggleGiantSmall,
  onOpenMobilePhone,
  onOpenAndroidApp,
  onResume,
  onSaveJourney,
  onReturnToTitle,
}) => {
  const [tab, setTab] = useState<'menu' | 'settings'>(
    isTitleSettingsOnly ? 'settings' : 'menu'
  );
  const [savedToast, setSavedToast] = useState(false);

  const patch = (partial: Partial<GameSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const handleSave = () => {
    onSaveJourney();
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'settings' ? 'Settings' : 'Journey Paused'}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#120E20]/82 p-4"
    >
      <div className="w-full max-w-lg rounded-xl bg-[#1A152C] border border-[#F5D6C0]/25 text-[#FAF5EF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5D6C0]/15">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {tab === 'settings' ? 'Settings' : 'Journey Paused'}
            </h2>
            <p className="text-xs text-[#DFC8BC] mt-0.5">
              {tab === 'settings'
                ? 'Graphics, camera feel, audio balance, and atmosphere'
                : `${hud.location.name} · ${hud.timeFormatted}`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Menu"
            onClick={onResume}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#2A2242] text-[#FAF5EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {tab === 'menu' ? (
          <div className="p-6 space-y-5">
            {/* Compact journey stat summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-[#221B36] border border-[#F5D6C0]/14">
                <div className="text-xs text-[#D5C0B7]">Time</div>
                <div className="font-mono-tabular text-base font-medium mt-0.5">
                  {hud.timeFormatted}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#221B36] border border-[#F5D6C0]/14">
                <div className="text-xs text-[#D5C0B7]">Scenic Spots</div>
                <div className="font-mono-tabular text-base font-medium mt-0.5">
                  {hud.discoveredSpotIds.length} / 6
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#221B36] border border-[#F5D6C0]/14">
                <div className="text-xs text-[#D5C0B7]">Weather</div>
                <div className="text-sm font-medium mt-1 truncate">
                  {WEATHER_LABELS[hud.weather].name}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                aria-pressed={hud.iceland.isGiant}
                onClick={onToggleGiantSmall}
                className={`w-full py-2.5 px-4 rounded-md border text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  hud.iceland.isGiant
                    ? 'bg-[#1D354A] hover:bg-[#24425B] border-[#8DE4FF]/65 text-[#D8F6FF]'
                    : 'bg-[#251E3C] hover:bg-[#31284F] border-[#F5D6C0]/20 text-[#FAF5EF]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-[#8DE4FF]" />
                  <span>
                    {hud.iceland.isGiant
                      ? 'Switch to Small Form (1.68m)'
                      : 'Switch to Giant Form (23.5m)'}
                  </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono-tabular font-semibold ${
                    hud.iceland.isGiant
                      ? 'bg-[#8DE4FF] text-[#112233]'
                      : 'bg-[#151124] text-[#C8B9D4]'
                  }`}
                >
                  {hud.iceland.isGiant ? 'GIANT · 23.5m' : 'SMALL · 1.68m'}
                </span>
              </button>

              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 px-4 rounded-md bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] text-sm font-semibold transition-colors cursor-pointer"
              >
                Resume Journey
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2.5 px-4 rounded-md bg-[#251E3C] hover:bg-[#31284F] border border-[#F5D6C0]/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {savedToast ? (
                  <>
                    <Check className="w-4 h-4 text-[#9AF0D6]" />
                    <span>Journey Saved</span>
                  </>
                ) : (
                  <span>Save Journey Progress</span>
                )}
              </button>

              {onOpenMobilePhone && (
                <button
                  type="button"
                  data-testid="pause-mobile-phone-btn"
                  onClick={onOpenMobilePhone}
                  className="w-full py-2.5 px-4 rounded-md bg-[#122628] hover:bg-[#1A383B] border border-emerald-400/45 text-emerald-100 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <span>Dreamline Mobile Phone (P)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenAndroidApp}
                className="w-full py-2.5 px-4 rounded-md bg-[#1D2D42] hover:bg-[#253A54] border border-[#8DE4FF]/38 text-[#D8F5FF] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#8DE4FF]" />
                <span>Download Android App / APK</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('settings')}
                className="w-full py-2.5 px-4 rounded-md bg-[#251E3C] hover:bg-[#31284F] border border-[#F5D6C0]/20 text-sm font-medium transition-colors cursor-pointer"
              >
                Settings
              </button>

              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 px-4 rounded-md text-[#E6CBC0] hover:text-[#FAF5EF] hover:bg-[#251E3C] text-sm transition-colors cursor-pointer"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-sm">
            {/* Graphics Quality */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Graphics Quality</span>
              <div className="flex items-center gap-1 bg-[#120E20] p-1 rounded-md border border-[#F5D6C0]/14">
                {(['low', 'medium', 'high', 'ultra'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    data-testid={`settings-quality-${q}`}
                    onClick={() => patch({ graphicsQuality: q })}
                    className={`px-2.5 py-1 text-xs rounded capitalize cursor-pointer ${
                      settings.graphicsQuality === q
                        ? 'bg-[#F4BE98] text-[#1D162E] font-medium'
                        : 'text-[#D6C7DC] hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Scale */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Resolution Scale</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.6}
                  max={1.25}
                  step={0.05}
                  value={settings.resolutionScale}
                  onChange={(e) => patch({ resolutionScale: parseFloat(e.target.value) })}
                  className="w-32 dreamline-slider"
                />
                <span className="font-mono-tabular text-xs w-10 text-right">
                  {Math.round(settings.resolutionScale * 100)}%
                </span>
              </div>
            </label>

            {/* Brightness */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Brightness</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.75}
                  max={1.35}
                  step={0.05}
                  value={settings.brightness}
                  onChange={(e) => patch({ brightness: parseFloat(e.target.value) })}
                  className="w-32 dreamline-slider"
                />
                <span className="font-mono-tabular text-xs w-10 text-right">
                  {Math.round(settings.brightness * 100)}%
                </span>
              </div>
            </label>

            {/* Mouse Sensitivity */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Mouse Sensitivity</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  value={settings.mouseSensitivity}
                  onChange={(e) => patch({ mouseSensitivity: parseFloat(e.target.value) })}
                  className="w-32 dreamline-slider"
                />
                <span className="font-mono-tabular text-xs w-10 text-right">
                  {settings.mouseSensitivity.toFixed(1)}x
                </span>
              </div>
            </label>

            {/* Camera Sensitivity */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Camera Sensitivity</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  value={settings.cameraSensitivity}
                  onChange={(e) => patch({ cameraSensitivity: parseFloat(e.target.value) })}
                  className="w-32 dreamline-slider"
                />
                <span className="font-mono-tabular text-xs w-10 text-right">
                  {settings.cameraSensitivity.toFixed(1)}x
                </span>
              </div>
            </label>

            {/* Sound Volume */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Ambient Sound Volume</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.soundVolume}
                  onChange={(e) => patch({ soundVolume: parseFloat(e.target.value) })}
                  className="w-32 dreamline-slider"
                />
                <span className="font-mono-tabular text-xs w-10 text-right">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            </label>

            {/* Music Volume */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Peaceful Music Volume</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => patch({ musicVolume: parseFloat(e.target.value) })}
                  className="w-32 dreamline-slider"
                />
                <span className="font-mono-tabular text-xs w-10 text-right">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
            </label>

            {/* Day/Night Cycle Preference */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-[#E6D3C8]">Day / Night Flow</span>
              <div className="flex items-center gap-1 bg-[#120E20] p-1 rounded-md border border-[#F5D6C0]/14">
                {(['slow', 'dynamic', 'frozen'] as DayCyclePreference[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => patch({ dayCycleMode: mode })}
                    className={`px-2.5 py-1 text-xs rounded cursor-pointer whitespace-nowrap ${
                      settings.dayCycleMode === mode
                        ? 'bg-[#F4BE98] text-[#1D162E] font-medium'
                        : 'text-[#D6C7DC] hover:text-white'
                    }`}
                  >
                    {mode === 'slow' ? 'Gentle' : mode === 'dynamic' ? 'Live' : 'Hold'}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Size Mode (works in Snow Place & everywhere!) */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="min-w-0">
                <div className="text-[#E6D3C8]">Player Size (Snow Place &amp; World)</div>
                <div className="text-[11px] text-[#BFB0CA]">
                  Be Giant (23.5m) or Small (1.68m) anywhere — including Panimalai Snow Peaks
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#120E20] p-1 rounded-md border border-[#F5D6C0]/14 shrink-0">
                {(
                  [
                    { id: 'auto', label: 'Auto' },
                    { id: 'giant', label: 'Giant' },
                    { id: 'small', label: 'Small' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSetSizeMode(opt.id)}
                    className={`px-2.5 py-1 text-xs rounded cursor-pointer whitespace-nowrap ${
                      hud.iceland.sizeMode === opt.id
                        ? 'bg-[#8DE4FF] text-[#112233] font-semibold'
                        : 'text-[#D6C7DC] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Season Quick Select */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Season</span>
              <select
                aria-label="Season Preference"
                value={hud.season}
                onChange={(e) => onChangeSeason(e.target.value as SeasonType)}
                className="px-3 py-1.5 text-xs rounded-md bg-[#231C38] border border-[#F5D6C0]/20 text-[#FAF5EF]"
              >
                {(Object.keys(SEASON_LABELS) as SeasonType[]).map((s) => (
                  <option key={s} value={s}>
                    {SEASON_LABELS[s].name} ({SEASON_LABELS[s].tamil})
                  </option>
                ))}
              </select>
            </label>

            {/* Weather Quick Select */}
            <label className="flex items-center justify-between gap-4">
              <span className="text-[#E6D3C8]">Weather</span>
              <select
                aria-label="Weather Preference"
                value={hud.weather}
                onChange={(e) => onChangeWeather(e.target.value as WeatherType)}
                className="px-3 py-1.5 text-xs rounded-md bg-[#231C38] border border-[#F5D6C0]/20 text-[#FAF5EF]"
              >
                {(Object.keys(WEATHER_LABELS) as WeatherType[]).map((w) => (
                  <option key={w} value={w}>
                    {WEATHER_LABELS[w].name} ({WEATHER_LABELS[w].jp})
                  </option>
                ))}
              </select>
            </label>

            <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#F5D6C0]/15">
              {!isTitleSettingsOnly ? (
                <button
                  type="button"
                  onClick={() => setTab('menu')}
                  className="px-4 py-2 text-sm rounded-md bg-[#251E3C] hover:bg-[#31284F] text-[#FAF5EF] cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onResume}
                className="px-5 py-2 text-sm font-medium rounded-md bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] cursor-pointer"
              >
                {isTitleSettingsOnly ? 'Done' : 'Resume'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
