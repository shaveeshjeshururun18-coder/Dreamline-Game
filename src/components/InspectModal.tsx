import React, { useState } from 'react';
import { Coffee, TrainFront, X } from 'lucide-react';
import type { HudSnapshot, InspectContent } from '../game/types';
import { STATIONS } from '../game/railway';

interface InspectModalProps {
  content: InspectContent;
  hud: HudSnapshot;
  onDispenseDrink: (drinkName: string) => void;
  onClose: () => void;
}

const DRINKS = [
  { id: 'filter_kaapi', name: 'Filter Kaapi', jp: 'பில்டர் காபி', temp: 'Hot · ₹25', color: '#B5835A' },
  { id: 'nannari', name: 'Nannari Sarbath', jp: 'நன்னாரி சர்பத்', temp: 'Cold · ₹30', color: '#E8BD5C' },
  { id: 'masala_tea', name: 'Masala Tea', jp: 'மசாலா தேநீர்', temp: 'Hot · ₹20', color: '#8A9E5B' },
  { id: 'rose_milk', name: 'Chilled Rose Milk', jp: 'ரோஸ் மில்க்', temp: 'Cold · ₹35', color: '#F2A2B4' },
];

export const InspectModal: React.FC<InspectModalProps> = ({
  content,
  hud,
  onDispenseDrink,
  onClose,
}) => {
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const nextStation = STATIONS[hud.train.nextStationIndex];
  const currentStation = STATIONS[hud.train.currentStationIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#120E20]/80 p-4"
    >
      <div className="w-full max-w-lg rounded-xl bg-[#1A152C] border border-[#F5D6C0]/26 text-[#FAF5EF] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5D6C0]/15">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {content.title}{' '}
              <span className="text-sm font-normal text-[#F4C4A2] ml-1.5">
                {content.jpTitle}
              </span>
            </h2>
            <p className="text-xs text-[#D9C4BA] mt-0.5">{content.stationName}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#2A2242] text-[#FAF5EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {content.kind === 'timetable' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#231C38] border border-[#F4BE98]/24">
                <div className="flex items-center gap-2.5">
                  <TrainFront className="w-4 h-4 text-[#F4BE98]" />
                  <div>
                    <div className="text-sm font-medium">
                      {hud.train.phase === 'stopped'
                        ? `Now boarding at ${currentStation?.name}`
                        : `Approaching ${nextStation?.name}`}
                    </div>
                    <div className="text-xs text-[#D8C5BC]">
                      2-Car Scenic Local · All Stops Loop
                    </div>
                  </div>
                </div>
                <span className="font-mono-tabular text-sm font-semibold text-[#FCE2C8]">
                  {Math.ceil(hud.train.etaSeconds)}s
                </span>
              </div>

              <div className="divide-y divide-[#F5D6C0]/12 border-y border-[#F5D6C0]/12 text-sm">
                {[
                  { time: '06:30', service: 'Morning Mist Local', route: 'ஷவீஷ் ஜெஷுருன் சா → Neelam → Thendral Malai' },
                  { time: '12:45', service: 'Midday Valley Local', route: 'All Countryside Platforms' },
                  { time: '16:40', service: 'Golden Hour Scenic', route: 'Neelam Mirror Shore View' },
                  { time: '17:45', service: 'Sunset Dreamline Local', route: 'Continuous Loop · Active Now' },
                  { time: '19:30', service: 'Evening Lantern Train', route: 'Warm Carriage Illumination' },
                ].map((row) => (
                  <div key={row.time} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="font-mono-tabular text-[#F4BE98]">{row.time}</span>
                    <span className="font-medium text-[#FAF5EF] flex-1">{row.service}</span>
                    <span className="text-xs text-[#CDBBC8] text-right">{row.route}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.kind === 'info_board' && (
            <div className="space-y-3 text-sm text-[#EDE0D8] leading-relaxed">
              <p>
                Welcome to <strong className="text-[#FAF5EF]">ஷவீஷ் ஜெஷுருன் சா (Shavish Jeshurun Sa Station)</strong>,
                the quiet wooden gateway to the Dreamline countryside loop. No ticket purchase is
                necessary — all local rides are complimentary for travelers.
              </p>
              <ul className="space-y-2 text-xs text-[#DFCBC0] pt-1">
                <li>
                  <strong className="text-[#FCE2C8]">Neelam Lakeside (நீலம் ஏரிக்கரை):</strong> East past the
                  golden grass fields, famous for sunset mirror reflections and lakeside benches.
                </li>
                <li>
                  <strong className="text-[#FCE2C8]">Nila Gramam (நிலா கிராமம்):</strong> Follow the
                  winding dirt lane southwest across the plaza for lantern-lit countryside houses.
                </li>
                <li>
                  <strong className="text-[#FCE2C8]">Malaiyur Overlook (மலையூர் காட்சிமுனை):</strong> Climb the
                  northwestern footpath past the railway crossing for panoramic valley train watching.
                </li>
              </ul>
            </div>
          )}

          {content.kind === 'vending_machine' && (
            <div className="space-y-4">
              <p className="text-xs text-[#DFC8BC]">
                Select a warm or chilled countryside drink from the softly humming machine.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DRINKS.map((drink) => (
                  <button
                    key={drink.id}
                    type="button"
                    onClick={() => {
                      setSelectedDrink(drink.name);
                      onDispenseDrink(drink.name);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#231C38] hover:bg-[#30264C] border border-[#F5D6C0]/18 text-left transition-colors cursor-pointer"
                  >
                    <span
                      className="w-8 h-10 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: drink.color }}
                    >
                      <Coffee className="w-4 h-4 text-[#1A152C]" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-[#FAF5EF]">{drink.name}</div>
                      <div className="text-xs text-[#D5C1B8]">
                        {drink.jp} · {drink.temp}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedDrink && (
                <p className="text-xs text-[#FCE2C8] pt-1">
                  Dispensed {selectedDrink} with a warm comforting clunk.
                </p>
              )}
            </div>
          )}

          {content.kind === 'midnight_lore' && (
            <div className="space-y-3 rounded-lg bg-[#10132a] border border-indigo-400/35 p-4 text-sm text-indigo-100 leading-relaxed">
              <p className="text-amber-200 font-medium text-xs uppercase tracking-widest">
                Night-Only In-World Discovery · The Midnight Frontier
              </p>
              <p>{content.bodyText}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
