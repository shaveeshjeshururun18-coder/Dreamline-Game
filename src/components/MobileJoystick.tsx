import React, { useRef, useState } from 'react';
import { normalizeJoystickInput } from '../game/locomotion';

interface MobileJoystickProps {
  onMove: (right: number, forward: number, active?: boolean) => void;
}

const OUTER_RADIUS = 54;
const MAX_TRAVEL = 38;

/**
 * Responsive touch & pointer virtual thumbstick for mobile & desktop movement.
 * Uses Pointer Capture + touch-action: none so left-thumb movement never scrolls the page
 * or interferes with right-thumb camera orbiting on the 3D canvas.
 */
export const MobileJoystick: React.FC<MobileJoystickProps> = ({ onMove }) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const updateFromClientPos = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const sample = normalizeJoystickInput(clientX - cx, clientY - cy, MAX_TRAVEL);
    setKnob({ x: sample.knobX, y: sample.knobY, active: true });
    onMove(sample.right, sample.forward, true);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0, active: false });
    onMove(0, 0, false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resetStick();
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement Joystick"
      data-testid="mobile-joystick"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: OUTER_RADIUS * 2,
        height: OUTER_RADIUS * 2,
        touchAction: 'none',
      }}
      className="relative select-none rounded-full bg-[#181327]/72 border border-[#F5D6C0]/28 flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      {/* Subtle cardinal directional notches */}
      <span
        aria-hidden="true"
        className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F5D6C0]/45"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F5D6C0]/45"
      />
      <span
        aria-hidden="true"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F5D6C0]/45"
      />
      <span
        aria-hidden="true"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F5D6C0]/45"
      />

      {/* Inner thumbstick guide ring */}
      <div
        aria-hidden="true"
        className="w-14 h-14 rounded-full border border-[#F5D6C0]/16 pointer-events-none"
      />

      {/* Draggable warm thumb knob */}
      <div
        aria-hidden="true"
        data-testid="mobile-joystick-knob"
        style={{
          transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
        }}
        className={`absolute w-11 h-11 rounded-full border pointer-events-none transition-colors ${
          knob.active
            ? 'bg-[#F4BE98] border-[#FFF3E8]'
            : 'bg-[#F4BE98]/82 border-[#FCE4D0]/70'
        }`}
      />
    </div>
  );
};
