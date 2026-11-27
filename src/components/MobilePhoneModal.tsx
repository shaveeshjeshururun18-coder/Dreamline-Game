import React, { useState } from 'react';
import {
  Anchor,
  ArrowDown,
  ArrowUp,
  Bike,
  Bus,
  Car,
  Check,
  Compass,
  Gauge,
  Home,
  Lock,
  LockOpen,
  MapPin,
  MoonStar,
  MountainSnow,
  Navigation,
  PhoneCall,
  Plane,
  Shield,
  Ship,
  Smartphone,
  Sparkles,
  TrainFront,
  User,
  Users,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import { LOCATIONS } from '../game/terrain';
import type { BusRideDestination } from '../game/busHailing';
import type { SkyTaxiDestination } from '../game/skyTaxi';
import type { NavigationTarget } from '../game/navigation';
import { MIDNIGHT_FRONTIER_PORTAL_POS } from '../game/midnightFrontier';
import {
  HERO_CHARACTERS,
  getHeroById,
  type HeroCharacterId,
  type HeroOutfitId,
} from '../game/heroCharacters';
import {
  getCatalogueVehiclesByCategory,
  VEHICLE_CATALOGUE,
  type CatalogueCategory,
  type CatalogueVehicleEntry,
  type CatalogueVehicleId,
} from '../game/vehicleCatalogue';
import { getVehiclePreviewImage } from './vehiclePreviews';

interface MobilePhoneModalProps {
  hud: HudSnapshot;
  onCallBus: (destination: BusRideDestination) => void;
  onCancelBus: () => void;
  onBoardDispatchedBus: () => void;
  onCallSkyTaxi: (destination: SkyTaxiDestination) => void;
  onCancelSkyTaxi: () => void;
  onBoardSkyTaxi: () => void;
  onSpawnCatalogueVehicle: (vehicleId: CatalogueVehicleId, boardNow: boolean) => void;
  onSetNavigation: (target: NavigationTarget) => void;
  onOpenAiConductor: () => void;
  onEnterCaves: () => void;
  onExitCaves: () => void;
  onSelectHeroSuit: (heroId: HeroCharacterId, outfitId: HeroOutfitId, teleportToMetro: boolean) => void;
  onUseClassicTraveler: () => void;
  onEnterUndergroundMetro: () => void;
  onBoardAirliner: () => void;
  onLaunchParachuteTower: () => void;
  onTeleportMidnightFrontier: () => void;
  onOpenHouseSecretTunnel: () => void;
  onGoOutsideSuperheroHouse: () => void;
  onEnterHouseSecretVault: () => void;
  onExitHouseSecretVault: () => void;
  onClose: () => void;
}

function renderVehicleIcon(entry: CatalogueVehicleEntry) {
  if (entry.id === 'sovereign_ship' || entry.id === 'kadalkarai_submarine') {
    return <Ship className="w-5 h-5 text-sky-200" />;
  }
  if (entry.category === 'ships') return <Anchor className="w-5 h-5 text-cyan-200" />;
  if (entry.category === 'bikes') return <Bike className="w-5 h-5 text-rose-200" />;
  if (entry.id === 'sky_explorer' || entry.id === 'vtol_aircraft') {
    return <Plane className="w-5 h-5 text-amber-200" />;
  }
  if (entry.id === 'dreamline_train') return <TrainFront className="w-5 h-5 text-amber-200" />;
  if (entry.id === 'rural_bus') return <Bus className="w-5 h-5 text-emerald-200" />;
  return <Car className="w-5 h-5 text-amber-200" />;
}

const CATEGORY_TABS: Array<{ id: CatalogueCategory; label: string }> = [
  { id: 'all', label: `All (${VEHICLE_CATALOGUE.length})` },
  { id: 'cars', label: 'Cars & Jeep' },
  { id: 'bikes', label: 'Bikes' },
  { id: 'ships', label: 'Jet Skis & Ships' },
  { id: 'air_rail', label: 'VTOL, Air & Rail' },
];

export const MobilePhoneModal: React.FC<MobilePhoneModalProps> = ({
  hud,
  onCallBus,
  onCancelBus,
  onBoardDispatchedBus,
  onCallSkyTaxi,
  onCancelSkyTaxi,
  onBoardSkyTaxi,
  onSpawnCatalogueVehicle,
  onSetNavigation,
  onOpenAiConductor,
  onEnterCaves,
  onExitCaves,
  onSelectHeroSuit,
  onUseClassicTraveler,
  onEnterUndergroundMetro,
  onBoardAirliner,
  onLaunchParachuteTower,
  onTeleportMidnightFrontier,
  onOpenHouseSecretTunnel,
  onGoOutsideSuperheroHouse,
  onEnterHouseSecretVault,
  onExitHouseSecretVault,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'heroes' | 'catalogue' | 'bus' | 'sky_taxi'>('heroes');
  const [catalogueCategory, setCatalogueCategory] = useState<CatalogueCategory>('all');
  const [selectedHeroId, setSelectedHeroId] = useState<HeroCharacterId>(
    hud.hero.activeHeroId ?? 'iron_man_classic'
  );
  const selectedHero = getHeroById(selectedHeroId);
  const [selectedOutfitId, setSelectedOutfitId] = useState<HeroOutfitId>(
    hud.hero.activeHeroId === selectedHeroId && hud.hero.activeOutfitId
      ? hud.hero.activeOutfitId
      : selectedHero.defaultOutfitId
  );

  const handlePickHeroCard = (heroId: HeroCharacterId) => {
    setSelectedHeroId(heroId);
    const hero = getHeroById(heroId);
    if (hud.hero.activeHeroId === heroId && hud.hero.activeOutfitId) {
      setSelectedOutfitId(hud.hero.activeOutfitId);
    } else {
      setSelectedOutfitId(hero.defaultOutfitId);
    }
  };

  const destinations: Array<BusRideDestination & { busSupported: boolean }> = [
    ...LOCATIONS.map((l) => ({
      id: l.id,
      label: l.name,
      tamilLabel: l.jpName,
      x: l.teleportX ?? l.x,
      z: l.teleportZ ?? l.z,
      busSupported: l.id !== 'dinosaur_island',
    })),
    {
      id: 'midnight_frontier',
      label: 'The Midnight Frontier Portal',
      tamilLabel: 'நள்ளிரவு எல்லை',
      x: MIDNIGHT_FRONTIER_PORTAL_POS.x,
      z: MIDNIGHT_FRONTIER_PORTAL_POS.z,
      busSupported: true,
    },
  ];

  const visibleDestinations =
    activeTab === 'bus' ? destinations.filter((d) => d.busSupported) : destinations;

  const [selectedId, setSelectedId] = useState<string>(visibleDestinations[0]?.id ?? '');
  const selectedDest =
    visibleDestinations.find((d) => d.id === selectedId) ?? visibleDestinations[0];

  const dispatch = hud.busDispatch;
  const isBusBusy = dispatch.phase !== 'idle';
  const skyTaxi = hud.skyTaxi;
  const isSkyTaxiBusy =
    skyTaxi.phase === 'en_route_pickup' ||
    skyTaxi.phase === 'arrived_pickup' ||
    skyTaxi.phase === 'flying_to_destination';

  const catalogueVehicles = getCatalogueVehiclesByCategory(catalogueCategory);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-4"
      role="dialog"
      aria-label="Dreamline Mobile Phone"
      data-testid="mobile-phone-modal"
    >
      <div className="w-full max-w-[448px] rounded-[34px] bg-gradient-to-b from-[#0d1426] via-[#090f1d] to-[#070b15] border-[5px] border-slate-700/90 shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden text-slate-100">
        {/* Top Phone Status Bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2.5 bg-[#121c33] border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Dreamline 5G</span>
          </div>
          <div className="w-16 h-1.5 rounded-full bg-slate-800 border border-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-300">{hud.timeFormatted}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Dreamline Mobile"
              className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3.5 max-h-[84vh] overflow-y-auto">
          {/* 4-Tab Switcher: Heroes | Vehicles | Bus Ride | Sky Taxi */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#111a2e] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('heroes')}
              data-testid="mobile-tab-heroes"
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                activeTab === 'heroes'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              Heroes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalogue')}
              data-testid="mobile-tab-catalogue"
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                activeTab === 'catalogue'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              Vehicles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bus')}
              data-testid="mobile-tab-bus"
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                activeTab === 'bus'
                  ? 'bg-emerald-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5 shrink-0" />
              Bus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sky_taxi')}
              data-testid="mobile-tab-sky-taxi"
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                activeTab === 'sky_taxi'
                  ? 'bg-sky-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5 shrink-0" />
              Sky Taxi
            </button>
          </div>

          {/* Direct 1-Tap House Secret Underground Superhero Tunnel Remote Control (ZERO Teleport!) */}
          <div
            data-testid="mobile-house-tunnel-card"
            className="rounded-2xl p-3 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-amber-500/15 border border-cyan-300/45 shadow-lg space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-cyan-400/20 border border-cyan-300/40 flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4 text-cyan-200" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 truncate">
                    En Illam · Real Secret Tunnel Remote
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    House Portal + 1 KM Superhero Mega-Chamber
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                  hud.homeVault.inVault
                    ? 'bg-amber-400 text-slate-950 border-amber-200'
                    : hud.homeVault.hatchUnlocked
                      ? 'bg-emerald-400/25 text-emerald-200 border-emerald-300/45'
                      : 'bg-slate-800/90 text-slate-300 border-white/15'
                }`}
              >
                {hud.homeVault.inMegaChamber
                  ? `${hud.homeVault.megaChamberDistanceM}m / 1KM`
                  : hud.homeVault.inVault
                    ? 'Inside Base'
                    : hud.homeVault.hatchUnlocked
                      ? 'Doors Open'
                      : 'Sealed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="mobile-house-tunnel-toggle-btn"
                onClick={() => {
                  onOpenHouseSecretTunnel();
                  onClose();
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl font-bold text-[11px] cursor-pointer shadow-sm transition-colors ${
                  hud.homeVault.hatchUnlocked
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                }`}
              >
                {hud.homeVault.hatchUnlocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Close House Tunnel</span>
                  </>
                ) : (
                  <>
                    <LockOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>Open House Tunnel</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="mobile-house-tunnel-enter-btn"
                onClick={() => {
                  if (hud.homeVault.inVault) onExitHouseSecretVault();
                  else if (hud.homeVault.inPersonalHome) onEnterHouseSecretVault();
                  else onGoOutsideSuperheroHouse();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] cursor-pointer shadow-sm transition-colors"
              >
                {hud.homeVault.inVault ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Elevator Up</span>
                  </>
                ) : hud.homeVault.inPersonalHome ? (
                  <>
                    <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                    <span>Ride Elevator Down</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    <span>Go Outside House</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-[10px] text-cyan-100/80 leading-snug">
              Tap <strong>Open House Tunnel</strong> from outside to watch the armored doors slide open — walk, fly, or drive straight in &amp; out (no teleporting) into the 1,000 m chamber!
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 0: 1-TAP HERO ROSTER + CHARACTER SUIT VARIATIONS           */}
          {/* ============================================================== */}
          {activeTab === 'heroes' && (
            <div className="space-y-3" data-testid="mobile-heroes-panel">
              <div className="rounded-2xl p-3 bg-gradient-to-br from-rose-500/20 via-amber-500/15 to-slate-900 border border-amber-300/35">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
                      1-Tap Hero Switcher
                    </div>
                    <h2 className="text-sm font-bold text-white mt-0.5">
                      Pick a Hero &amp; Switch Suit Variations
                    </h2>
                  </div>
                  <button
                    type="button"
                    data-testid="mobile-classic-traveler-btn"
                    onClick={() => {
                      onUseClassicTraveler();
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer transition-colors ${
                      hud.hero.activeHeroId === null
                        ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/15'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    Classic
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Tap any character below to see their suit variations, then tap Wear Suit Here. Press C or V anytime to swap suits!
                </p>
              </div>

              {/* Easy Large Tap Hero Grid */}
              <div className="grid grid-cols-2 gap-2">
                {HERO_CHARACTERS.map((hero) => {
                  const isPicked = selectedHeroId === hero.id;
                  const isEquipped = hud.hero.activeHeroId === hero.id;
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      data-testid={`mobile-hero-card-${hero.id}`}
                      onClick={() => handlePickHeroCard(hero.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        isPicked
                          ? 'bg-amber-400/20 border-amber-300 shadow-md ring-1 ring-amber-300/60'
                          : 'bg-[#141e34] border-white/10 hover:bg-[#1c2947]'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-white/15 shrink-0">
                        <img
                          src={hero.referenceImage}
                          alt={hero.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                        {isEquipped && (
                          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{hero.name}</div>
                        <div className="text-[10px] text-amber-200/90 truncate">
                          {hero.outfits.length} Variations
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {hero.mobility.canFly
                            ? 'Long-Range Flight'
                            : hero.mobility.canWebSwing
                            ? 'Web-Swing'
                            : hero.mobility.canCapeGlide
                            ? 'Cape Glide + Batmobile'
                            : 'Melee + Sprint'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Character Variations Panel */}
              <div
                data-testid="mobile-hero-variations-panel"
                className="rounded-2xl p-3 bg-[#111b31] border border-amber-300/35 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                      {selectedHero.name} · Suit Variations
                    </div>
                    <div className="text-[11px] text-slate-300">{selectedHero.tagline}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-amber-200">
                    {selectedHero.outfits.length} Suits
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedHero.outfits.map((outfit) => {
                    const isSelectedOutfit = selectedOutfitId === outfit.id;
                    const isWorn =
                      hud.hero.activeHeroId === selectedHero.id &&
                      hud.hero.activeOutfitId === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        type="button"
                        data-testid={`mobile-suit-variation-${outfit.id}`}
                        onClick={() => setSelectedOutfitId(outfit.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left cursor-pointer transition-colors ${
                          isSelectedOutfit
                            ? 'bg-gradient-to-r from-amber-400/25 to-rose-500/20 border-amber-300 text-white'
                            : 'bg-[#18243f] border-white/10 text-slate-200 hover:bg-[#203054]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span className="truncate">{outfit.label}</span>
                            {isWorn && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-300/90 truncate">
                            {outfit.subtitle}
                          </div>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                            isSelectedOutfit
                              ? 'bg-amber-300 border-amber-100 text-slate-950'
                              : 'border-slate-500'
                          }`}
                        >
                          {isSelectedOutfit && <Check className="w-2.5 h-2.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="mobile-wear-suit-here-btn"
                    onClick={() => {
                      onSelectHeroSuit(selectedHero.id, selectedOutfitId, false);
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Wear Suit Here
                  </button>
                  <button
                    type="button"
                    data-testid="mobile-deploy-vault-btn"
                    onClick={() => {
                      onSelectHeroSuit(selectedHero.id, selectedOutfitId, true);
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/45 border border-indigo-300/45 text-indigo-100 font-semibold text-xs cursor-pointer"
                  >
                    Secret Home Vault
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: INSTANT VEHICLE CATALOGUE (ALL CARS, BIKES, SHIPS, AIR) */}
          {/* ============================================================== */}
          {activeTab === 'catalogue' && (
            <div className="space-y-3" data-testid="mobile-vehicle-catalogue">
              {/* Hero Header Banner */}
              <div className="rounded-2xl p-3.5 bg-gradient-to-br from-amber-500/20 via-indigo-500/15 to-slate-900 border border-amber-300/35">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                      Instant Fleet Showroom
                    </div>
                    <h2 className="text-sm font-bold text-white mt-0.5">
                      Spawn Any Vehicle Anywhere
                    </h2>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-300/40 text-[11px] font-bold text-amber-200">
                    {VEHICLE_CATALOGUE.length} Rides
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Tap any car, bike, ship, boat, train, or aircraft below to summon it immediately.
                </p>
              </div>

              {/* Category Filter Row */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TABS.map((cat) => {
                  const selected = catalogueCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCatalogueCategory(cat.id)}
                      data-testid={`catalogue-cat-${cat.id}`}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                        selected
                          ? 'bg-white text-slate-950 border-white'
                          : 'bg-[#141e34] text-slate-300 border-white/10 hover:bg-[#1c2947] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Showroom Vehicle Cards */}
              <div className="space-y-2.5 max-h-[41vh] overflow-y-auto pr-1">
                {catalogueVehicles.map((v) => (
                  <div
                    key={v.id}
                    data-testid={`catalogue-card-${v.id}`}
                    className={`group rounded-2xl p-3 bg-gradient-to-br ${v.accentClass} border ${v.borderClass} shadow-lg`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-[96px] h-[72px] rounded-xl overflow-hidden bg-slate-950/80 border border-white/20 shrink-0 shadow-md">
                        <img
                          src={getVehiclePreviewImage(v.id)}
                          alt={v.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          data-testid={`catalogue-preview-${v.id}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-1 left-1 w-5 h-5 rounded-md bg-slate-950/80 border border-white/15 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3">
                          {renderVehicleIcon(v)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold text-white truncate">{v.name}</h3>
                          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-amber-200 shrink-0">
                            {v.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300/90 truncate">{v.tamilName}</div>
                        <p className="text-[11px] text-slate-200/85 mt-1 leading-snug line-clamp-2">
                          {v.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Specs + Dual Instant Spawn Actions */}
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-amber-300" />
                          {v.topSpeedLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-300" />
                          {v.capacityLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {v.category !== 'bikes' && (
                          <button
                            type="button"
                            onClick={() => {
                              onSpawnCatalogueVehicle(v.id, false);
                              onClose();
                            }}
                            data-testid={`catalogue-drop-${v.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-semibold text-white cursor-pointer transition-colors"
                          >
                            Spawn
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onSpawnCatalogueVehicle(v.id, true);
                            onClose();
                          }}
                          data-testid={`catalogue-spawn-${v.id}`}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-slate-950 text-[11px] font-bold cursor-pointer transition-all shadow-sm"
                        >
                          {v.actionLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2 & 3: BUS PICKUP & SKY EXPLORER AIR TAXI                  */}
          {/* ============================================================== */}
          {(activeTab === 'bus' || activeTab === 'sky_taxi') && (
            <>
              <div
                className={`rounded-2xl p-3.5 border ${
                  activeTab === 'bus'
                    ? 'bg-[#16233d] border-emerald-400/25'
                    : 'bg-[#102638] border-sky-400/35'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      activeTab === 'bus'
                        ? 'bg-emerald-400/20 border-emerald-300/35'
                        : 'bg-sky-400/20 border-sky-300/40'
                    }`}
                  >
                    {activeTab === 'bus' ? (
                      <Bus className="w-5 h-5 text-emerald-300" />
                    ) : (
                      <Plane className="w-5 h-5 text-sky-300" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {activeTab === 'bus' ? 'Dreamline Bus Pickup' : 'SSJ Tropical Sky Explorer Taxi'}
                    </h2>
                    <p className="text-[11px] text-slate-300">
                      {activeTab === 'bus'
                        ? 'Bus drives to pick you up & drop you off anywhere (including Airport & Showroom).'
                        : 'Aerial taxi flies to pick you up & drops you anywhere — even Dinosaur Island & Snow Peaks!'}
                    </p>
                  </div>
                </div>

                {activeTab === 'bus' && isBusBusy && (
                  <div
                    className="mt-3 rounded-xl bg-[#0c1424] border border-emerald-300/30 p-3 space-y-2"
                    data-testid="mobile-bus-active-status"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-300">{dispatch.statusMessage}</span>
                      {dispatch.distanceMeters > 1 && (
                        <span className="font-mono text-amber-200">
                          {Math.round(dispatch.distanceMeters)}m
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(dispatch.phase === 'arrived_pickup' ||
                        dispatch.phase === 'en_route_pickup') && (
                        <button
                          type="button"
                          onClick={() => {
                            onBoardDispatchedBus();
                            onClose();
                          }}
                          data-testid="mobile-board-bus-btn"
                          className="flex-1 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs cursor-pointer"
                        >
                          Board Bus Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onCancelBus}
                        className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'sky_taxi' && isSkyTaxiBusy && (
                  <div
                    className="mt-3 rounded-xl bg-[#0a1a28] border border-sky-300/35 p-3 space-y-2"
                    data-testid="mobile-sky-taxi-active-status"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-300">{skyTaxi.statusMessage}</span>
                      {skyTaxi.distanceMeters > 1 && (
                        <span className="font-mono text-amber-200">{skyTaxi.distanceMeters}m</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(skyTaxi.phase === 'arrived_pickup' ||
                        skyTaxi.phase === 'en_route_pickup') && (
                        <button
                          type="button"
                          onClick={() => {
                            onBoardSkyTaxi();
                            onClose();
                          }}
                          data-testid="mobile-board-sky-taxi-btn"
                          className="flex-1 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-xs cursor-pointer"
                        >
                          Board Sky Taxi Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onCancelSkyTaxi}
                        className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Destination Picker */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Select Destination
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {visibleDestinations.map((dest) => {
                    const active = dest.id === selectedDest?.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setSelectedId(dest.id)}
                        data-testid={`mobile-dest-${dest.id}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? activeTab === 'bus'
                              ? 'bg-emerald-500/20 border-emerald-400/60 text-white'
                              : 'bg-sky-500/20 border-sky-400/60 text-white'
                            : 'bg-[#131b2e] border-white/10 text-slate-200 hover:bg-[#1a2540]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{dest.label}</div>
                          {dest.tamilLabel && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {dest.tamilLabel}
                            </div>
                          )}
                        </div>
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active
                              ? activeTab === 'bus'
                                ? 'text-emerald-300'
                                : 'text-sky-300'
                              : 'text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDest && (
                <div className="grid grid-cols-2 gap-2">
                  {activeTab === 'bus' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onCallBus(selectedDest);
                        onClose();
                      }}
                      data-testid="mobile-call-bus-btn"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Call Bus Pickup
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onCallSkyTaxi({
                          id: selectedDest.id,
                          label: selectedDest.label,
                          tamilLabel: selectedDest.tamilLabel,
                          x: selectedDest.x,
                          z: selectedDest.z,
                        });
                        onClose();
                      }}
                      data-testid="mobile-call-sky-taxi-btn"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      Call Sky Taxi
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onSetNavigation({
                        id: selectedDest.id,
                        label: selectedDest.label,
                        tamilLabel: selectedDest.tamilLabel,
                        x: selectedDest.x,
                        z: selectedDest.z,
                      });
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-300/35 text-cyan-100 font-medium text-xs cursor-pointer transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Live GPS Arrow
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quick World Teleports & Phone Apps */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="mobile-enter-metro-btn"
              onClick={() => {
                onEnterUndergroundMetro();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#122238] hover:bg-[#19304f] border border-cyan-300/30 text-left cursor-pointer"
            >
              <TrainFront className="w-4 h-4 text-cyan-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">Underground Metro</div>
                <div className="text-[10px] text-cyan-200/80 truncate">Line M1 Subway</div>
              </div>
            </button>

            <button
              type="button"
              data-testid="mobile-board-airliner-btn"
              onClick={() => {
                onBoardAirliner();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#12263a] hover:bg-[#1a3652] border border-sky-300/35 text-left cursor-pointer"
            >
              <Plane className="w-4 h-4 text-sky-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">Fly DL-787 Jet</div>
                <div className="text-[10px] text-sky-200/80 truncate">International Airport</div>
              </div>
            </button>

            <button
              type="button"
              data-testid="mobile-teleport-midnight-btn"
              onClick={() => {
                onTeleportMidnightFrontier();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#20173d] hover:bg-[#2c2054] border border-amber-300/40 text-left cursor-pointer"
            >
              <MoonStar className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-amber-100 truncate">Midnight Frontier</div>
                <div className="text-[10px] text-indigo-200/85 truncate">Teleport to Night Portal</div>
              </div>
            </button>

            <button
              type="button"
              data-testid="mobile-parachute-tower-btn"
              onClick={() => {
                onLaunchParachuteTower();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#182924] hover:bg-[#213a32] border border-emerald-300/35 text-left cursor-pointer"
            >
              <Wind className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">Parachute Jump</div>
                <div className="text-[10px] text-emerald-200/80 truncate">Airport Test Tower</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiConductor();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161f33] hover:bg-[#1e2a45] border border-white/10 text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-white">AI Conductor</div>
                <div className="text-[10px] text-slate-400">PA &amp; Smart Routes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (hud.inUndergroundCave) onExitCaves();
                else onEnterCaves();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161f33] hover:bg-[#1e2a45] border border-cyan-300/20 text-left cursor-pointer"
            >
              <MountainSnow className="w-4 h-4 text-cyan-300 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-white">
                  {hud.inUndergroundCave ? 'Exit Caves' : 'Crystal Caves'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {hud.inUndergroundCave ? 'Back to Snow' : '6 Underground Areas'}
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
            <Compass className="w-3 h-3" />
            <span>Press P anytime for Heroes, Vehicles, Metro, Airport &amp; Midnight Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
