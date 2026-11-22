import React from 'react';
import { Coffee, Home, Lamp, Palette, Shirt, Sun, Sunset, X } from 'lucide-react';
import { PLAYABLE_AVATARS } from '../game/avatars';
import type { BoyOutfitId, HomeDecorStyle, HomeState } from '../game/types';

interface HomeCustomizeModalProps {
  home: HomeState;
  onSelectOutfit: (outfit: BoyOutfitId) => void;
  onSelectDecor: (decor: HomeDecorStyle) => void;
  onToggleFairyLights: () => void;
  onCookMeal: () => void;
  onSleepUntil: (hour: number, label: string) => void;
  onClose: () => void;
}

const DECORS: Array<{ id: HomeDecorStyle; label: string; swatch: string }> = [
  { id: 'warm_wood', label: 'Warm Cedar', swatch: '#B87654' },
  { id: 'coastal_breeze', label: 'Coastal Breeze', swatch: '#4F8FA6' },
  { id: 'botanical', label: 'Botanical Sage', swatch: '#62805B' },
];

export const HomeCustomizeModal: React.FC<HomeCustomizeModalProps> = ({
  home,
  onSelectOutfit,
  onSelectDecor,
  onToggleFairyLights,
  onCookMeal,
  onSleepUntil,
  onClose,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="En Illam Personal Home Menu"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#120E20]/82 p-4 md:p-8"
    >
      <div className="w-full max-w-xl rounded-xl bg-[#1A152C] border border-[#F5D6C0]/25 text-[#FAF5EF] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5D6C0]/15">
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-[#F4BE98]" />
            <div>
              <h2 className="font-display text-xl font-semibold tracking-wide">
                En Illam · My Home
              </h2>
              <p className="text-xs text-[#DFC8BC]">
                என் இல்லம் · Wardrobe, interior style & cozy daily life
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Home Menu"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#2A2242] text-[#F2E5DC] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* All Playable Avatars (also physically displayed downstairs in En Illam!) */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium tracking-wider text-[#E5C9BA] uppercase mb-2.5">
              <span className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#F4BE98]" />
                <span>Avatars & Wardrobe ({PLAYABLE_AVATARS.length} Displayed at Home)</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAYABLE_AVATARS.map((item) => {
                const active = home.outfit === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectOutfit(item.id)}
                    className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F4BE98] border-[#FCE4D0] text-[#1D162E]'
                        : 'bg-[#231C38] border-[#F5D6C0]/15 text-[#FAF5EF] hover:bg-[#2E2548]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs font-semibold">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 border border-black/25"
                          style={{ backgroundColor: item.swatch }}
                        />
                        {item.name}
                      </span>
                      {active && <span className="text-[10px] font-bold uppercase">Wearing</span>}
                    </div>
                    <div className={`text-[11px] mt-1 ${active ? 'text-[#3A2D42]' : 'text-[#C8B9B4]'}`}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interior Decor Palette */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-[#E5C9BA] uppercase mb-2.5">
              <Palette className="w-4 h-4 text-[#F4BE98]" />
              <span>Interior Theme & Balcony Lights</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {DECORS.map((d) => {
                const active = home.decorStyle === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelectDecor(d.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2E2548] border-[#F4BE98] text-[#FAF5EF]'
                        : 'bg-[#211B36] border-[#F5D6C0]/15 text-[#D8CCC5] hover:bg-[#2A2242]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/25"
                      style={{ backgroundColor: d.swatch }}
                    />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onToggleFairyLights}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md bg-[#231C38] hover:bg-[#2F264A] border border-[#F5D6C0]/15 text-xs font-medium cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lamp className="w-4 h-4 text-[#F4BE98]" />
                Balcony Warm Fairy Lights
              </span>
              <span className={home.fairyLightsOn ? 'text-[#F4BE98] font-semibold' : 'text-[#A094B0]'}>
                {home.fairyLightsOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Cozy Home Daily Actions */}
          <div className="pt-2 border-t border-[#F5D6C0]/15 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onCookMeal();
                onClose();
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-[#26203E] hover:bg-[#332A52] border border-[#F5D6C0]/20 text-xs font-medium cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-[#F4BE98]" />
              Brew Filter Kaapi
            </button>
            <button
              type="button"
              onClick={() => {
                onSleepUntil(6.5, 'Rested at En Illam — Crisp Morning Sunrise (06:30)');
                onClose();
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-[#26203E] hover:bg-[#332A52] border border-[#F5D6C0]/20 text-xs font-medium cursor-pointer"
            >
              <Sun className="w-4 h-4 text-[#FCE2A8]" />
              Sleep to Sunrise
            </button>
            <button
              type="button"
              onClick={() => {
                onSleepUntil(17.72, 'Relaxed indoors until Golden Sunset (17:43)');
                onClose();
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-[#26203E] hover:bg-[#332A52] border border-[#F5D6C0]/20 text-xs font-medium cursor-pointer"
            >
              <Sunset className="w-4 h-4 text-[#F49E82]" />
              Rest to Sunset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
