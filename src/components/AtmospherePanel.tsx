import React from 'react';
import { CloudLightning, CloudRain, CloudRainWind, Thermometer, Waves, X } from 'lucide-react';
import type { DayCyclePreference, SeasonType, TimePeriod, WeatherType } from '../game/types';
import {
  SEASON_LABELS,
  TIME_PERIOD_LABELS,
  TIME_PRESET_HOURS,
  WEATHER_LABELS,
} from '../game/timeWeather';
import {
  getTemperatureDescriptor,
  MAX_TEMPERATURE_C,
  MIN_TEMPERATURE_C,
} from '../game/trainSteam';

import type { OceanThemeId } from '../game/gerstnerOcean';

interface AtmospherePanelProps {
  open: boolean;
  timeHours: number;
  activePeriod: TimePeriod;
  weather: WeatherType;
  season: SeasonType;
  oceanTheme?: OceanThemeId;
  temperatureC: number;
  manualTemperatureC: number | null;
  dayCycleMode: DayCyclePreference;
  onSelectTime: (hours: number) => void;
  onSelectWeather: (weather: WeatherType) => void;
  onSelectSeason: (season: SeasonType) => void;
  onSelectOceanTheme?: (theme: OceanThemeId) => void;
  onSelectTemperature: (tempC: number | null) => void;
  onChangeDayCycle: (mode: DayCyclePreference) => void;
  onClose: () => void;
}

const PERIODS: TimePeriod[] = [
  'morning',
  'afternoon',
  'golden',
  'sunset',
  'evening',
  'night',
];

const CALM_WEATHERS: WeatherType[] = [
  'clear',
  'breeze',
  'cloudy',
  'fog',
  'rain',
  'snow',
];

const EXTREME_WEATHERS: WeatherType[] = [
  'heavy_rain',
  'thunderstorm',
  'ferocious_rain',
  'flood',
  'tsunami',
];

const SEASONS: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];

const TEMP_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: 'Auto', value: null },
  { label: '-10°C Frost', value: -10 },
  { label: '18°C Mild', value: 18 },
  { label: '34°C Hot', value: 34 },
];

export const AtmospherePanel: React.FC<AtmospherePanelProps> = ({
  open,
  timeHours,
  activePeriod,
  weather,
  season,
  oceanTheme = 'bengal',
  temperatureC,
  manualTemperatureC,
  dayCycleMode,
  onSelectTime,
  onSelectWeather,
  onSelectSeason,
  onSelectOceanTheme,
  onSelectTemperature,
  onChangeDayCycle,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="Sky, Weather and Seasons Controls"
      data-testid="atmosphere-panel"
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[min(780px,95vw)] max-h-[78vh] overflow-y-auto rounded-lg bg-[#191429]/95 border border-[#F5D6C0]/28 px-4 sm:px-5 py-3.5 sm:py-4 text-[#FAF5EF] shadow-2xl"
    >
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-5 -mt-3.5 sm:-mt-4 px-4 sm:px-5 pt-3.5 sm:pt-4 pb-2.5 mb-3 bg-[#191429] border-b border-[#F5D6C0]/16 flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h2 className="font-display text-sm sm:text-base font-semibold text-[#FAF5EF]">
              Sky, Weather &amp; Seasons
            </h2>
            <span className="hidden sm:inline text-xs text-[#E4CFC3]">
              Shape light, weather, and season across the valley
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1 w-fit bg-[#110D1E] p-0.5 rounded-md border border-[#F5D6C0]/15">
            {(['slow', 'dynamic', 'frozen'] as DayCyclePreference[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeDayCycle(mode)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded transition-colors cursor-pointer whitespace-nowrap ${
                  dayCycleMode === mode
                    ? 'bg-[#F4BE98] text-[#1D162E] font-medium'
                    : 'text-[#DCD0E5] hover:text-white'
                }`}
              >
                {mode === 'slow' ? 'Gentle Flow' : mode === 'dynamic' ? 'Live Cycle' : 'Hold Sky'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          data-testid="close-weather-panel-btn"
          aria-label="Close Sky and Weather Panel"
          title="Close Weather (Esc / T)"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-[#2A2144] hover:bg-[#F4BE98] active:bg-[#F4BE98] text-[#FAF5EF] hover:text-[#1D162E] border border-[#F5D6C0]/40 transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>

      {/* Season Selector Row */}
      <div className="mb-3 pb-3 border-b border-[#F5D6C0]/14">
        <div className="flex items-center justify-between text-xs text-[#E4CFC3] mb-1.5">
          <span>Season</span>
          <span className="font-display text-[#F4C9AD]">
            {SEASON_LABELS[season].name} · {SEASON_LABELS[season].tamil}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SEASONS.map((s) => {
            const active = season === s;
            const info = SEASON_LABELS[s];
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectSeason(s)}
                className={`px-3 py-1.5 text-xs rounded border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E] font-semibold'
                    : 'bg-[#231C38] border-[#F5D6C0]/16 text-[#F2E6DE] hover:bg-[#2E2548]'
                }`}
              >
                <span>{info.name}</span>
                <span className={`ml-1.5 text-[10px] ${active ? 'text-[#3A2742]' : 'text-[#CFAFB8]'}`}>
                  {info.tamil}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ambient Temperature & Train Steam Condensation Control */}
      <div className="mb-3 pb-3 border-b border-[#F5D6C0]/14">
        <div className="flex items-center justify-between text-xs text-[#E4CFC3] mb-1.5 gap-2">
          <span className="inline-flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-[#9DD7F5]" />
            <span>Air Temperature &amp; Train Steam</span>
          </span>
          <span
            data-testid="temperature-readout"
            className="font-mono-tabular text-[#FCE2C8] whitespace-nowrap"
          >
            {Math.round(temperatureC)}°C · {getTemperatureDescriptor(temperatureC)}
            {manualTemperatureC === null ? ' (Auto)' : ''}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="grid grid-cols-4 gap-1.5 shrink-0">
            {TEMP_PRESETS.map((preset) => {
              const active =
                preset.value === null
                  ? manualTemperatureC === null
                  : manualTemperatureC !== null && Math.abs(manualTemperatureC - preset.value) < 0.5;
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectTemperature(preset.value)}
                  className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#9DD7F5] border-[#D8F3FF] text-[#111C2D] font-semibold'
                      : 'bg-[#231C38] border-[#F5D6C0]/16 text-[#F2E6DE] hover:bg-[#2E2548]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <input
            type="range"
            data-testid="temperature-slider"
            aria-label="Ambient Air Temperature Slider"
            min={MIN_TEMPERATURE_C}
            max={MAX_TEMPERATURE_C}
            step={1}
            value={Math.round(temperatureC)}
            onChange={(e) => onSelectTemperature(parseFloat(e.target.value))}
            className="w-full dreamline-slider"
          />
        </div>
      </div>

      {/* Time of Day Presets + Fine Scrubber */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between text-xs text-[#E4CFC3] mb-1.5">
            <span>Time of Day</span>
            <span className="font-mono-tabular text-[#FCE2C8]">
              {Math.floor(timeHours).toString().padStart(2, '0')}:
              {Math.floor((timeHours % 1) * 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            {PERIODS.map((p) => {
              const active = activePeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onSelectTime(TIME_PRESET_HOURS[p])}
                  className={`px-2.5 py-1.5 text-xs rounded border text-left transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E] font-medium'
                      : 'bg-[#231C38] border-[#F5D6C0]/16 text-[#F2E6DE] hover:bg-[#2E2548]'
                  }`}
                >
                  {TIME_PERIOD_LABELS[p].name}
                </button>
              );
            })}
          </div>
          <input
            type="range"
            aria-label="Fine Time of Day Slider"
            min={0}
            max={23.95}
            step={0.05}
            value={timeHours}
            onChange={(e) => onSelectTime(parseFloat(e.target.value))}
            className="w-full dreamline-slider"
          />
        </div>

        {/* Calm & Light Weather Selector */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#E4CFC3] mb-1.5">
            <span>Calm &amp; Light Weather</span>
            <span className="font-display text-[#F4C9AD]">
              {WEATHER_LABELS[weather].name} · {WEATHER_LABELS[weather].jp}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {CALM_WEATHERS.map((w) => {
              const active = weather === w;
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectWeather(w)}
                  className={`px-2 py-1.5 text-xs rounded border text-left transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E] font-medium'
                      : 'bg-[#231C38] border-[#F5D6C0]/16 text-[#F2E6DE] hover:bg-[#2E2548]'
                  }`}
                >
                  {WEATHER_LABELS[w].name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dedicated Full-Width Row for Heavy Rain, Thunder Rain, Ferocious Rain, Flood & Tsunami */}
      <div className="mt-3 pt-3 border-t border-[#7ED6F5]/18">
        <div className="flex items-center justify-between text-xs text-[#9DD7F5] mb-1.5">
          <span className="font-medium">Heavy Storms, Flood &amp; Tsunami</span>
          <span className="text-[11px] text-[#B7C7E3]">
            Rain · Lightning &amp; Thunder · Swimmable Flood · Giant Wave
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {EXTREME_WEATHERS.map((w) => {
            const active = weather === w;
            const Icon =
              w === 'heavy_rain'
                ? CloudRain
                : w === 'thunderstorm'
                ? CloudLightning
                : w === 'ferocious_rain'
                ? CloudRainWind
                : Waves;
            return (
              <button
                key={w}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectWeather(w)}
                className={`px-2.5 py-2 text-xs rounded border text-left transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-[#7ED6F5] border-[#D0F3FF] text-[#0E1E2E] font-semibold'
                    : 'bg-[#1D243C] border-[#7ED6F5]/26 text-[#DFEEFA] hover:bg-[#273354]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{WEATHER_LABELS[w].name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ocean Basin Optics Switcher (Bay of Bengal / North Atlantic / Pacific Reef) */}
      {onSelectOceanTheme && (
        <div className="mt-3 pt-3 border-t border-emerald-300/18">
          <div className="flex items-center justify-between text-xs text-emerald-200 mb-1.5">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Waves className="w-3.5 h-3.5 text-emerald-300" />
              <span>Realistic Ocean Optics (Gerstner Wave Physics)</span>
            </span>
            <span className="text-[11px] text-[#B7C7E3]">
              {oceanTheme === 'bengal'
                ? 'Bay of Bengal Coast'
                : oceanTheme === 'atlantic'
                ? 'North Atlantic Swell'
                : 'Pacific Reef & Shore'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'bengal', label: 'Bay of Bengal', dot: 'bg-emerald-400' },
                { id: 'atlantic', label: 'Atlantic Ocean', dot: 'bg-teal-400' },
                { id: 'pacific', label: 'Pacific Reef', dot: 'bg-cyan-400' },
              ] as const
            ).map((opt) => {
              const active = oceanTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`ocean-theme-${opt.id}-btn`}
                  aria-pressed={active}
                  onClick={() => onSelectOceanTheme(opt.id)}
                  className={`px-2.5 py-1.5 text-xs rounded border transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'bg-emerald-300 border-emerald-100 text-[#0B1F1C] font-semibold'
                      : 'bg-[#17282A] border-emerald-300/25 text-emerald-100 hover:bg-[#1E3639]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#0B1F1C]' : opt.dot}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
