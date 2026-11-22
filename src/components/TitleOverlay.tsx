import React, { useEffect } from 'react';

interface TitleOverlayProps {
  hasSave: boolean;
  onContinue: () => void;
  onNewJourney: () => void;
  onExplore: () => void;
  onOpenSettings: () => void;
  onOpenAndroidApp: () => void;
  onScenicScreensaver: () => void;
  scenicOnly: boolean;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  hasSave,
  onContinue,
  onNewJourney,
  onExplore,
  onOpenSettings,
  onOpenAndroidApp,
  onScenicScreensaver,
  scenicOnly,
}) => {
  // Bind Enter / Space to primary start action while on Title Screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (scenicOnly) {
        if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          onScenicScreensaver();
        }
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT') return;
        e.preventDefault();
        if (hasSave) onContinue();
        else onNewJourney();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSave, onContinue, onNewJourney, onScenicScreensaver, scenicOnly]);

  if (scenicOnly) {
    return (
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-end items-center pb-8">
        <button
          type="button"
          onClick={onScenicScreensaver}
          className="pointer-events-auto px-5 py-2.5 text-sm tracking-wide text-[#F7F3EE] bg-[#181326]/80 border border-[#F5D6C0]/25 rounded-md hover:bg-[#231B38]/90 transition-colors cursor-pointer"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between px-8 py-10 md:px-16 md:py-14"
      style={{
        background:
          'linear-gradient(95deg, rgba(18,14,32,0.72) 0%, rgba(18,14,32,0.34) 32%, rgba(18,14,32,0.02) 56%, rgba(18,14,32,0) 100%)',
      }}
    >
      {/* Top quiet brand mark */}
      <div className="flex items-center gap-3 text-xs tracking-[0.18em] text-[#F5D8C6]/85 uppercase text-shadow-subtle">
        <span className="normal-case font-display tracking-normal text-sm">கனவுப் பாதை</span>
        <span aria-hidden="true">·</span>
        <span>ஷவீஷ் ஜெஷுருன் சா · Dreamline</span>
      </div>

      {/* Main Left-Third Editorial Lockup over calm negative space */}
      <div className="max-w-md pointer-events-auto my-auto">
        {/* Bespoke Inline SVG Japanese Countryside Railway Emblem & Title Lockup */}
        <div className="mb-8">
          <svg
            viewBox="0 0 360 112"
            className="w-full max-w-[340px] h-auto overflow-visible"
            role="img"
            aria-label="DREAMLINE — A Peaceful Railway Journey"
          >
            {/* Subtle warm horizon arc + railway perspective emblem */}
            <circle
              cx="30"
              cy="44"
              r="24"
              fill="none"
              stroke="#F4B898"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            <path
              d="M12 52 Q30 34 48 52"
              fill="none"
              stroke="#FCE5D4"
              strokeWidth="1.4"
              strokeOpacity="0.85"
            />
            <line x1="21" y1="62" x2="27" y2="44" stroke="#F4B898" strokeWidth="1.5" />
            <line x1="39" y1="62" x2="33" y2="44" stroke="#F4B898" strokeWidth="1.5" />
            <line x1="23" y1="56" x2="37" y2="56" stroke="#F4B898" strokeWidth="1.2" />
            <line x1="25" y1="50" x2="35" y2="50" stroke="#F4B898" strokeWidth="1.1" />
            <circle cx="30" cy="30" r="3.5" fill="#FFBE88" />

            {/* Main Display Title */}
            <text
              x="70"
              y="56"
              fill="#FAF5EF"
              fontSize="40"
              fontWeight="600"
              letterSpacing="6"
              style={{
                fontFamily: 'var(--font-display)',
                filter: 'drop-shadow(0 3px 12px rgba(14,10,28,0.75))',
              }}
            >
              DREAMLINE
            </text>
            <line
              x1="70"
              y1="70"
              x2="336"
              y2="70"
              stroke="#F4B898"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <text
              x="70"
              y="92"
              fill="#F3D6C4"
              fontSize="13.5"
              letterSpacing="2.4"
              style={{
                fontFamily: 'var(--font-sans)',
                filter: 'drop-shadow(0 1px 6px rgba(14,10,28,0.85))',
              }}
            >
              A PEACEFUL RAILWAY JOURNEY
            </text>
          </svg>
        </div>

        {/* Clean Vertical Menu Navigation */}
        <nav aria-label="Main menu" className="flex flex-col items-start gap-2.5">
          {hasSave && (
            <button
              type="button"
              data-start="true"
              onClick={onContinue}
              className="group flex items-center justify-between w-64 px-5 py-3 text-left text-base font-medium text-[#1D162E] bg-[#F5C5A3] hover:bg-[#FAD6BC] rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCE5D4]"
            >
              <span>Continue Journey</span>
              <span className="text-xs font-display opacity-80">தொடரவும்</span>
            </button>
          )}

          <button
            type="button"
            data-start={hasSave ? undefined : 'true'}
            onClick={onNewJourney}
            className={`group flex items-center justify-between w-64 px-5 py-3 text-left text-base font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCE5D4] ${
              hasSave
                ? 'text-[#FAF5EF] bg-[#1E1830]/85 border border-[#F5D6C0]/25 hover:bg-[#2B2245]/95'
                : 'text-[#1D162E] bg-[#F5C5A3] hover:bg-[#FAD6BC]'
            }`}
          >
            <span>New Journey</span>
            <span className="text-xs font-display opacity-80">புதிய பயணம்</span>
          </button>

          <button
            type="button"
            onClick={onExplore}
            className="flex items-center justify-between w-64 px-5 py-2.5 text-left text-sm font-medium text-[#F7F1EB] bg-[#1B162C]/80 border border-[#F5D6C0]/20 hover:bg-[#2A2242]/90 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCE5D4]"
          >
            <span>Explore Landmarks</span>
            <span className="text-xs font-display text-[#E5C6B5]">இடங்கள்</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-between w-64 px-5 py-2.5 text-left text-sm font-medium text-[#F7F1EB] bg-[#1B162C]/80 border border-[#F5D6C0]/20 hover:bg-[#2A2242]/90 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCE5D4]"
          >
            <span>Settings</span>
            <span className="text-xs font-display text-[#E5C6B5]">அமைப்புகள்</span>
          </button>

          <button
            type="button"
            onClick={onOpenAndroidApp}
            className="flex items-center justify-between w-64 px-5 py-2.5 text-left text-sm font-medium text-[#D8F5FF] bg-[#18293D]/85 border border-[#8DE4FF]/38 hover:bg-[#213852]/95 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8DE4FF]"
          >
            <span>Android App / APK</span>
            <span className="text-xs font-display text-[#9CE8FF]">ஆண்ட்ராய்டு</span>
          </button>

          <button
            type="button"
            onClick={onScenicScreensaver}
            className="mt-1 px-2 py-1.5 text-xs tracking-wide text-[#E5CFC2]/85 hover:text-[#FAF5EF] transition-colors cursor-pointer"
          >
            Exit to Scenic View
          </button>
        </nav>
      </div>

      {/* Single flat borderless bottom control hint line */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#EDE1D8]/85 text-shadow-subtle">
        <p className="tracking-wide">
          WASD / Joystick Move · 1 Walk · 2 Bicycle · 3 Skateboard · N Night Mode · E Interact &amp; Board · C Photo · M Map
        </p>
        <p className="font-display tracking-wide text-[#F3D6C4]/85">
          ஷவீஷ் ஜெஷுருன் சா · நீலம் ஏரி · தென்றல் மலை
        </p>
      </div>
    </div>
  );
};
