import React, { useState } from 'react';
import {
  Compass,
  Eye,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Car,
  Plane,
  Ship,
} from 'lucide-react';
import type {
  ExhibitionVehicleEntry,
  ExhibitionVehicleId,
} from '../game/exhibitionComplex';
import { getVehiclePreviewImage } from './vehiclePreviews';

interface ExhibitionVehicleModalProps {
  vehicle: ExhibitionVehicleEntry;
  isDispatched: boolean;
  isInspecting: boolean;
  onInspect: (id: ExhibitionVehicleId) => void;
  onEnter: (id: ExhibitionVehicleId) => void;
  onTest: (id: ExhibitionVehicleId) => void;
  onSpawn: (id: ExhibitionVehicleId) => void;
  onReturn: (id: ExhibitionVehicleId) => void;
  onClose: () => void;
}

export const ExhibitionVehicleModal: React.FC<ExhibitionVehicleModalProps> = ({
  vehicle,
  isDispatched,
  isInspecting,
  onInspect,
  onEnter,
  onTest,
  onSpawn,
  onReturn,
  onClose,
}) => {
  const [tab, setTab] = useState<'overview' | 'details'>('overview');

  const CategoryIcon =
    vehicle.category === 'air' ? Plane : vehicle.category === 'water' ? Ship : Car;

  const accentBorder =
    vehicle.category === 'air'
      ? 'border-sky-400/50'
      : vehicle.category === 'water'
      ? 'border-teal-400/50'
      : 'border-amber-400/50';

  const accentText =
    vehicle.category === 'air'
      ? 'text-sky-300'
      : vehicle.category === 'water'
      ? 'text-teal-300'
      : 'text-amber-300';

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-end md:items-center justify-end p-4 md:p-8">
      <div
        className={`pointer-events-auto w-full max-w-md bg-[#111622]/96 border ${accentBorder} text-[#f3f5f8] shadow-2xl overflow-hidden`}
      >
        {/* Architectural Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3 bg-[#171d2c]">
          <div className="min-w-0">
            <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold ${accentText}`}>
              <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{vehicle.zoneLabel}</span>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white leading-snug">
              {vehicle.name}
            </h2>
            <div className="text-xs text-slate-300/80 mt-0.5 flex items-center justify-between gap-2">
              <span>{vehicle.tamilName}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                {vehicle.floorLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Exhibition Panel"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip & Mode Switcher */}
        <div className="px-5 py-2.5 border-b border-white/10 bg-[#0d111a] flex items-center justify-between text-xs">
          <span className={isDispatched ? 'text-amber-300 font-medium' : 'text-emerald-300 font-medium'}>
            {isDispatched ? 'Dispatched in Test / Open World' : 'On Exhibition Display'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                tab === 'overview'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('details')}
              className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                tab === 'details'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3 h-3" />
              View Details
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Generated Showroom Vehicle Preview Thumbnail */}
          <div className="relative h-36 w-full rounded-xl overflow-hidden border border-white/15 bg-[#0a0f1c] shadow-lg">
            <img
              src={getVehiclePreviewImage(vehicle.id)}
              alt={vehicle.name}
              referrerPolicy="no-referrer"
              data-testid={`exhibition-preview-${vehicle.id}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111622]/85 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white/95 drop-shadow">
                {vehicle.specs.originRegion}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-white/15 font-mono text-[10px] text-amber-200">
                {vehicle.specs.topSpeed}
              </span>
            </div>
          </div>

          {tab === 'overview' ? (
            <>
              <p className="text-sm text-slate-200/90 leading-relaxed">
                {vehicle.description}
              </p>
              <div className="grid grid-cols-2 gap-2.5 text-xs bg-[#182032] p-3 border border-white/8">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Top Speed
                  </div>
                  <div className="font-semibold text-white mt-0.5">
                    {vehicle.specs.topSpeed}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Test Environment
                  </div>
                  <div className={`font-semibold mt-0.5 ${accentText}`}>
                    {vehicle.testAreaLabel}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vehicle.specs.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 text-[11px] bg-white/8 border border-white/10 text-slate-200"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-2.5 text-xs">
              {[
                ['Propulsion', vehicle.specs.propulsion],
                ['Top Speed', vehicle.specs.topSpeed],
                ['Capacity', vehicle.specs.capacity],
                ['Controls', vehicle.specs.controls],
                ['Region / Route', vehicle.specs.originRegion],
                ['Project Asset', vehicle.specs.sourceAsset],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col border-b border-white/8 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    {k}
                  </span>
                  <span className="text-slate-100 font-medium mt-0.5">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* 6 Interactive Actions (Inspect, View Details, Enter, Test, Spawn, Return) */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onInspect(vehicle.id)}
              className={`px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border cursor-pointer transition-colors ${
                isInspecting
                  ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                  : 'bg-[#1a2234] hover:bg-[#232d44] border-white/12 text-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {isInspecting ? 'Inspecting View' : 'Inspect'}
            </button>

            <button
              type="button"
              onClick={() => setTab((prev) => (prev === 'details' ? 'overview' : 'details'))}
              className="px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#1a2234] hover:bg-[#232d44] border border-white/12 text-slate-100 cursor-pointer transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              {tab === 'details' ? 'Hide Details' : 'View Details'}
            </button>

            <button
              type="button"
              onClick={() => onEnter(vehicle.id)}
              className="px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Enter Vehicle
            </button>

            <button
              type="button"
              onClick={() => onTest(vehicle.id)}
              className="px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              Test Now
            </button>

            <button
              type="button"
              onClick={() => onSpawn(vehicle.id)}
              className="px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#1a2234] hover:bg-[#232d44] border border-white/12 text-slate-100 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Spawn Outside
            </button>

            <button
              type="button"
              onClick={() => onReturn(vehicle.id)}
              className="px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#1a2234] hover:bg-[#232d44] border border-white/12 text-slate-100 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return to Display
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
