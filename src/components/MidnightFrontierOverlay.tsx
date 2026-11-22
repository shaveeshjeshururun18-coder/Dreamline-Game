import React from 'react';
import { ArrowLeft, MoonStar } from 'lucide-react';
import { MIDNIGHT_FRONTIER_ASSET_URL } from '../game/midnightFrontier';

interface MidnightFrontierOverlayProps {
  onReturn: () => void;
}

export const MidnightFrontierOverlay: React.FC<MidnightFrontierOverlayProps> = ({
  onReturn,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#05060b] flex flex-col"
      role="dialog"
      aria-label="The Midnight Frontier"
      data-testid="midnight-frontier-overlay"
    >
      <iframe
        src={MIDNIGHT_FRONTIER_ASSET_URL}
        title="The Midnight Frontier"
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; pointer-lock"
      />
      <div className="fixed top-3 left-3 z-50 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={onReturn}
          data-testid="midnight-frontier-return-btn"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0d101c]/95 hover:bg-[#191f35] border border-amber-300/35 text-amber-100 text-xs font-medium tracking-wide shadow-lg cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
          Return to DREAMLINE
        </button>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d101c]/90 border border-indigo-300/25 text-indigo-200 text-[11px]">
          <MoonStar className="w-3.5 h-3.5 text-amber-300" />
          The Midnight Frontier · Night-Only Realm
        </div>
      </div>
    </div>
  );
};
