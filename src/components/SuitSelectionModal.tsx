import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Eye, Layers, Shirt, UserCheck, X } from 'lucide-react';
import {
  filterWearableSuits,
  getAllWearableSuits,
  getHeroById,
  type HeroCharacterId,
  type HeroOutfitId,
  type SuitSkinCategory,
  type WearableSuitEntry,
} from '../game/heroCharacters';

export interface SuitSelectionModalProps {
  selectedHeroId: HeroCharacterId;
  selectedOutfitId: HeroOutfitId;
  activeHeroId: HeroCharacterId | null;
  activeOutfitId: HeroOutfitId | null;
  onPreviewSuit: (heroId: HeroCharacterId, outfitId: HeroOutfitId) => void;
  onEquipSuit: (heroId: HeroCharacterId, outfitId: HeroOutfitId, teleportToMetro: boolean) => void;
  onClose: () => void;
}

const SuitThumbnail: React.FC<{ entry: WearableSuitEntry }> = ({ entry }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center p-2 text-center"
        style={{
          background: `linear-gradient(135deg, ${entry.outfit.primaryColor} 0%, #0f172a 70%, ${entry.outfit.accentColor} 100%)`,
        }}
      >
        <Shirt className="h-6 w-6 text-white/90" />
        <span className="mt-1 text-[11px] font-semibold text-white">{entry.outfit.label}</span>
      </div>
    );
  }

  return (
    <img
      src={entry.outfit.referenceImage}
      alt={`${entry.heroName} — ${entry.outfit.label}`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]"
    />
  );
};

export const SuitSelectionModal: React.FC<SuitSelectionModalProps> = ({
  selectedHeroId,
  selectedOutfitId,
  activeHeroId,
  activeOutfitId,
  onPreviewSuit,
  onEquipSuit,
  onClose,
}) => {
  const [category, setCategory] = useState<SuitSkinCategory>('all');
  const [focusedHeroId, setFocusedHeroId] = useState<HeroCharacterId>(selectedHeroId);
  const [focusedOutfitId, setFocusedOutfitId] = useState<HeroOutfitId>(selectedOutfitId);

  const allSuits = useMemo(() => getAllWearableSuits(), []);
  const currentHero = getHeroById(selectedHeroId);

  const filteredSuits = useMemo(
    () => filterWearableSuits(category, selectedHeroId),
    [category, selectedHeroId]
  );

  const focusedEntry = useMemo(
    () =>
      allSuits.find(
        (item) => item.heroId === focusedHeroId && item.outfit.id === focusedOutfitId
      ) ?? allSuits[0],
    [allSuits, focusedHeroId, focusedOutfitId]
  );

  const armourCount = useMemo(
    () => allSuits.filter((s) => s.category === 'armour').length,
    [allSuits]
  );
  const streetCount = useMemo(
    () => allSuits.filter((s) => s.category === 'street_stealth').length,
    [allSuits]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const filterTabs: Array<{ id: SuitSkinCategory; label: string; count: number }> = [
    { id: 'all', label: 'All Suits', count: allSuits.length },
    { id: 'current_hero', label: currentHero.name, count: currentHero.outfits.length },
    { id: 'armour', label: 'Powered Armour', count: armourCount },
    { id: 'street_stealth', label: 'Street & Stealth', count: streetCount },
  ];

  const handleSelectCard = (entry: WearableSuitEntry) => {
    setFocusedHeroId(entry.heroId);
    setFocusedOutfitId(entry.outfit.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Suit Skin Selection"
      data-testid="suit-selection-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0b101b] text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight text-white">
                Wearable Suit Wardrobe
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Browse all {allSuits.length} wearable hero skins · Preview live in 360° or equip immediately onto your character
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Suit Wardrobe"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/50 px-6 py-3">
          <div
            role="tablist"
            aria-label="Suit Skin Categories"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-1"
          >
            {filterTabs.map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-suit-filter={tab.id}
                  onClick={() => setCategory(tab.id)}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                    active
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-1.5 font-mono tabular-nums ${active ? 'text-slate-900/80' : 'text-slate-500'}`}>
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Showing {filteredSuits.length} of {allSuits.length} suits
          </div>
        </div>

        {/* Suit Skins Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredSuits.map((entry) => {
              const isFocused =
                entry.heroId === focusedHeroId && entry.outfit.id === focusedOutfitId;
              const isEquippedInWorld =
                activeHeroId === entry.heroId && activeOutfitId === entry.outfit.id;

              return (
                <button
                  key={`${entry.heroId}_${entry.outfit.id}`}
                  type="button"
                  data-suit-skin-option={entry.outfit.id}
                  onClick={() => handleSelectCard(entry)}
                  onDoubleClick={() => onPreviewSuit(entry.heroId, entry.outfit.id)}
                  className={`group flex w-full items-stretch gap-4 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                    isFocused
                      ? 'border-sky-400 bg-sky-500/12'
                      : 'border-slate-800 bg-slate-900/65 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  {/* Suit Reference Artwork */}
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-700/90 bg-slate-950">
                    <SuitThumbnail entry={entry} />
                  </div>

                  {/* Suit Details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-bold text-white">
                          {entry.outfit.label}
                        </h3>
                        {isEquippedInWorld ? (
                          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Equipped
                          </span>
                        ) : isFocused ? (
                          <span className="shrink-0 text-[11px] font-semibold text-sky-300">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      {/* Clean unboxed metadata */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-200">{entry.heroName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {entry.heightMeters.toFixed(2)}m
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.primaryPowerLabel}</span>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
                        {entry.outfit.subtitle}
                      </p>
                    </div>

                    {/* Palette Swatches + Capabilities Text */}
                    <div className="mt-2.5 flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span
                          className="inline-block h-3 w-5 rounded-sm border border-white/20"
                          style={{ backgroundColor: entry.outfit.primaryColor }}
                          aria-label="Primary suit colour"
                        />
                        <span
                          className="inline-block h-3 w-5 rounded-sm border border-white/20"
                          style={{ backgroundColor: entry.outfit.accentColor }}
                          aria-label="Accent suit colour"
                        />
                        <span className="truncate text-slate-400">
                          {entry.traits.join(' · ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/95 px-6 py-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {focusedEntry.outfit.label}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {focusedEntry.heroName} · {focusedEntry.heroAlias} · Primary: {focusedEntry.primaryPowerLabel}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="apply-suit-preview-btn"
              onClick={() => onPreviewSuit(focusedEntry.heroId, focusedEntry.outfit.id)}
              className="flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-sky-400/70 bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-500/25"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Preview in 360° Studio
            </button>
            <button
              type="button"
              data-testid="equip-suit-vault-btn"
              onClick={() => onEquipSuit(focusedEntry.heroId, focusedEntry.outfit.id, true)}
              className="flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/70 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              Deploy in Secret Vault
            </button>
            <button
              type="button"
              data-testid="equip-suit-now-btn"
              onClick={() => onEquipSuit(focusedEntry.heroId, focusedEntry.outfit.id, false)}
              className="flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Equip Suit Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
