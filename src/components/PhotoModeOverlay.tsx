import React, { useEffect, useState } from 'react';
import { Camera, Download, Image as ImageIcon, Trash2, X } from 'lucide-react';
import type { HudSnapshot, PostcardRecord } from '../game/types';

interface PhotoModeOverlayProps {
  hud: HudSnapshot;
  postcards: PostcardRecord[];
  onFovChange: (fov: number) => void;
  onCapture: () => void;
  onDeletePostcard: (id: string) => void;
  onClose: () => void;
}

export const PhotoModeOverlay: React.FC<PhotoModeOverlayProps> = ({
  hud,
  postcards,
  onFovChange,
  onCapture,
  onDeletePostcard,
  onClose,
}) => {
  const [fov, setFov] = useState(48);
  const [showGrid, setShowGrid] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleShutter = () => {
    setFlash(true);
    onCapture();
    window.setTimeout(() => setFlash(false), 180);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (galleryOpen) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleShutter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleFov = (next: number) => {
    setFov(next);
    onFovChange(next);
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
      {/* Subtle shutter flash */}
      {flash && <div className="fixed inset-0 bg-[#FFF7EE]/55 pointer-events-none z-40" />}

      {/* Rule-of-thirds viewfinder guides */}
      {showGrid && !galleryOpen && (
        <div className="fixed inset-8 pointer-events-none border border-[#FAF5EF]/22">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-[#FAF5EF]/15" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-[#FAF5EF]/15" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-[#FAF5EF]/15" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-[#FAF5EF]/15" />
        </div>
      )}

      {/* Top Viewfinder Info */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-shadow-subtle">
          <p className="font-display text-lg text-[#FAF5EF]">
            Postcard Camera · {hud.location.name}
          </p>
          <p className="text-xs font-mono-tabular text-[#EAD6C8]">
            {hud.timeFormatted} · Drag mouse to frame · Scroll or slide to zoom
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGalleryOpen((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md bg-[#191429]/88 border border-[#F5D6C0]/25 text-[#FAF5EF] hover:bg-[#2A2242] transition-colors cursor-pointer whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4 text-[#F4BE98]" />
            <span>Postcards ({postcards.length})</span>
          </button>

          <button
            type="button"
            aria-label="Exit Photo Mode"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md bg-[#191429]/88 border border-[#F5D6C0]/25 text-[#FAF5EF] hover:bg-[#2A2242] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Camera Controls */}
      {!galleryOpen && (
        <div className="relative z-10 pointer-events-auto self-center flex flex-wrap items-center gap-5 px-5 py-3 rounded-lg bg-[#191429]/90 border border-[#F5D6C0]/24">
          <label className="flex items-center gap-3 text-xs text-[#E8D5C8]">
            <span>Lens</span>
            <input
              type="range"
              aria-label="Camera Lens Zoom"
              min={26}
              max={74}
              value={fov}
              onChange={(e) => handleFov(Number(e.target.value))}
              className="w-28 dreamline-slider"
            />
            <span className="font-mono-tabular w-10 text-[#FAF5EF]">
              {Math.round(100 - fov)}mm
            </span>
          </label>

          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer whitespace-nowrap ${
              showGrid
                ? 'bg-[#2C2446] border-[#F4BE98]/40 text-[#FAF5EF]'
                : 'bg-[#151125] border-[#F5D6C0]/15 text-[#C8B9CF]'
            }`}
          >
            {showGrid ? 'Grid On' : 'Grid Off'}
          </button>

          <button
            type="button"
            onClick={handleShutter}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Postcard</span>
          </button>
        </div>
      )}

      {/* Saved Postcards Album Drawer */}
      {galleryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Captured Postcards Album"
          className="fixed inset-0 z-30 pointer-events-auto flex items-center justify-center bg-[#120E20]/84 p-6"
        >
          <div className="w-full max-w-4xl max-h-[82vh] flex flex-col rounded-xl bg-[#1A152C] border border-[#F5D6C0]/25 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5D6C0]/15">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#FAF5EF]">
                  Countryside Postcards
                </h2>
                <p className="text-xs text-[#DFC8BC]">
                  Quiet snapshots collected along your journey
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Postcard Album"
                onClick={() => setGalleryOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#2A2242] text-[#FAF5EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {postcards.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#D6C3BA]">
                  No postcards captured yet. Frame a sunset or passing train and press Capture Postcard.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {postcards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-lg bg-[#231C38] border border-[#F5D6C0]/18 overflow-hidden"
                    >
                      <img
                        src={card.dataUrl}
                        alt={`Postcard of ${card.locationName} at ${card.timeLabel}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <div>
                          <div className="font-display text-sm font-medium text-[#FAF5EF]">
                            {card.locationName} · {card.jpName}
                          </div>
                          <div className="text-xs font-mono-tabular text-[#D9C5BC]">
                            {card.timeLabel} · {card.period}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={card.dataUrl}
                            download={`dreamline-${card.locationName.toLowerCase().replace(/\s+/g, '-')}.jpg`}
                            aria-label={`Download postcard of ${card.locationName}`}
                            className="w-8 h-8 flex items-center justify-center rounded bg-[#2E2548] hover:bg-[#3B305C] text-[#FAF5EF]"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            aria-label={`Delete postcard of ${card.locationName}`}
                            onClick={() => onDeletePostcard(card.id)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-[#2E2548] hover:bg-[#4F2634] text-[#F5B4A8] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
