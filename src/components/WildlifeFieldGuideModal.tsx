import React, { useMemo, useState } from 'react';
import { Binoculars, Camera, Compass, Eye, MapPin, Navigation, X } from 'lucide-react';
import {
  WILDLIFE_SPECIES_CATALOG,
  type WildlifeCategory,
  type WildlifeDiscoverySnapshot,
  type WildlifeSpeciesId,
  type WildlifeSpeciesSpec,
} from '../game/wildlifeEcosystem';

interface WildlifeFieldGuideModalProps {
  wildlife: WildlifeDiscoverySnapshot;
  onObserveSpecies: (speciesId: WildlifeSpeciesId, x: number, z: number) => void;
  onBoardExpeditionVehicle: (kind: 'safari_jeep' | 'vtol_aircraft' | 'jetski_sport' | 'jetski_perf') => void;
  onClose: () => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | WildlifeCategory; label: string }> = [
  { id: 'all', label: 'All Species (21)' },
  { id: 'mammal', label: 'Mammals (10)' },
  { id: 'bird', label: 'Birds (8)' },
  { id: 'reptile_amphibian', label: 'Reptiles & Amphibians (3)' },
];

export const WildlifeFieldGuideModal: React.FC<WildlifeFieldGuideModalProps> = ({
  wildlife,
  onObserveSpecies,
  onBoardExpeditionVehicle,
  onClose,
}) => {
  const [category, setCategory] = useState<'all' | WildlifeCategory>('all');
  const [selectedId, setSelectedId] = useState<WildlifeSpeciesId>('tiger');

  const filtered = useMemo(() => {
    if (category === 'all') return WILDLIFE_SPECIES_CATALOG;
    return WILDLIFE_SPECIES_CATALOG.filter((s) => s.category === category);
  }, [category]);

  const selected: WildlifeSpeciesSpec = useMemo(() => {
    return (
      WILDLIFE_SPECIES_CATALOG.find((s) => s.id === selectedId) ??
      filtered[0] ??
      WILDLIFE_SPECIES_CATALOG[0]
    );
  }, [filtered, selectedId]);

  const isPhotographed = wildlife.photographedIds.includes(selected.id);
  const isDiscovered = wildlife.discoveredIds.includes(selected.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wildlife Field Guide and Expedition Vehicles"
      data-testid="wildlife-field-guide-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/72 p-3 sm:p-6"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl bg-[#141714] border border-[#D4C3A3]/25 text-[#F4EFE6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#D4C3A3]/18 bg-[#191E19]">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#FAF5EC] truncate">
              Panimalai Wildlife Forest Sanctuary Guide
            </h2>
            <p className="text-xs text-[#B6BFA9] mt-0.5 tabular-nums">
              Dedicated Reserve Near Snow Region · {wildlife.discoveredIds.length} / {wildlife.totalSpecies} Observed · {wildlife.photographedIds.length} Photographed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Wildlife Field Guide"
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#242B24] hover:bg-[#2E382E] border border-[#D4C3A3]/20 text-[#F4EFE6] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expedition Fleet Quick Launch Strip */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#D4C3A3]/14 bg-[#171B16] flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#C9BA9B] mr-1">Expedition Fleet:</span>
          <button
            type="button"
            data-testid="guide-board-safari-jeep"
            onClick={() => onBoardExpeditionVehicle('safari_jeep')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#3F4A2E] hover:bg-[#4F5D3A] border border-[#B8C496]/35 text-xs font-medium text-[#F5F2E6] cursor-pointer whitespace-nowrap"
          >
            Drive 4×4 Safari Jeep
          </button>
          <button
            type="button"
            data-testid="guide-board-vtol"
            onClick={() => onBoardExpeditionVehicle('vtol_aircraft')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#4A3820] hover:bg-[#5E4728] border border-[#E5C170]/40 text-xs font-medium text-[#FDF4DE] cursor-pointer whitespace-nowrap"
          >
            Fly Gold/Wood VTOL
          </button>
          <button
            type="button"
            data-testid="guide-board-jetski-sport"
            onClick={() => onBoardExpeditionVehicle('jetski_sport')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#3A3D16] hover:bg-[#4C501D] border border-[#D9EC18]/45 text-xs font-medium text-[#F8FCE0] cursor-pointer whitespace-nowrap"
          >
            Ride Sport Jet Ski (Yellow)
          </button>
          <button
            type="button"
            data-testid="guide-board-jetski-perf"
            onClick={() => onBoardExpeditionVehicle('jetski_perf')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#193C23] hover:bg-[#225230] border border-[#34D85A]/45 text-xs font-medium text-[#E4FCEB] cursor-pointer whitespace-nowrap"
          >
            Ride Pro Jet Ski (Green)
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex flex-wrap gap-1.5 border-b border-[#D4C3A3]/12">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                category === tab.id
                  ? 'bg-[#D9B366] text-[#171915]'
                  : 'bg-[#1E241E] text-[#C8CEBE] hover:bg-[#283028]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Split: Species List + Species Dossier */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Species List */}
          <div className="md:col-span-7 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((sp) => {
              const photoDone = wildlife.photographedIds.includes(sp.id);
              const seen = wildlife.discoveredIds.includes(sp.id);
              const active = sp.id === selected.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  data-testid={`species-card-${sp.id}`}
                  onClick={() => setSelectedId(sp.id)}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer min-h-[72px] ${
                    active
                      ? 'bg-[#262F24] border-[#D9B366]/70'
                      : 'bg-[#1A1F1A] border-[#D4C3A3]/14 hover:bg-[#222921]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#FAF5EC] truncate">{sp.name}</div>
                      <div className="text-[11px] italic text-[#9EA994] truncate">{sp.scientificName}</div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 mt-1 border border-white/25"
                      style={{ backgroundColor: `#${sp.primaryColor.toString(16).padStart(6, '0')}` }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#B7C0AD]">
                    <span className="truncate">{sp.habitatLabel}</span>
                    <span className="shrink-0 ml-2 font-medium text-[#D9B366]">
                      {photoDone ? 'Photographed' : seen ? 'Spotted' : 'Wild'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Species Detail Panel */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#D4C3A3]/16 p-4 sm:p-5 bg-[#181C17] flex flex-col justify-between gap-4 overflow-y-auto">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#B6BFA9] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#D9B366]" />
                  <span>{selected.habitatLabel}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-[#FAF5EC] mt-1">
                  {selected.name}
                </h3>
                <p className="text-xs italic text-[#A9B59E]">{selected.scientificName}</p>
              </div>

              <p className="text-sm leading-relaxed text-[#E3E6DC]">{selected.description}</p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-[#1F251E] border border-[#D4C3A3]/14">
                  <div className="text-[#9BA690]">Ecological Role</div>
                  <div className="font-medium text-[#FAF5EC] mt-0.5">
                    {selected.isPredator
                      ? 'Apex / Active Predator'
                      : selected.isPrey
                      ? 'Herbivore / Prey'
                      : selected.canFly
                      ? 'Avian Canopy / Sky'
                      : selected.canSwim
                      ? 'Aquatic / Riparian'
                      : 'Ecosystem Grazer'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1F251E] border border-[#D4C3A3]/14">
                  <div className="text-[#9BA690]">Field Status</div>
                  <div className="font-medium text-[#D9B366] mt-0.5">
                    {isPhotographed ? 'Photographed' : isDiscovered ? 'Observed in Wild' : 'Undiscovered'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1F251E] border border-[#D4C3A3]/14">
                  <div className="text-[#9BA690]">Habitat Coords</div>
                  <div className="font-mono tabular-nums text-[#FAF5EC] mt-0.5">
                    X {Math.round(selected.anchorX)} · Z {Math.round(selected.anchorZ)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1F251E] border border-[#D4C3A3]/14">
                  <div className="text-[#9BA690]">Active Population</div>
                  <div className="font-mono tabular-nums text-[#FAF5EC] mt-0.5">
                    {selected.count} individuals
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#D4C3A3]/14">
              <button
                type="button"
                data-testid="wildlife-observe-selected-btn"
                onClick={() => onObserveSpecies(selected.id, selected.anchorX, selected.anchorZ)}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-lg bg-[#D9B366] hover:bg-[#E6C57E] text-[#151813] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Binoculars className="w-4 h-4" />
                <span>Travel &amp; Observe {selected.name}</span>
              </button>
              <div className="flex items-center justify-between text-[11px] text-[#9EA994] px-1">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Switch to Wildlife Cam [C]
                </span>
                <span className="inline-flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Snap Photo [F]
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
