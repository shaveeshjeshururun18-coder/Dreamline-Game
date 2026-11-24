import React, { useEffect, useMemo, useRef } from 'react';
import type { SeasonType, TimePeriod, WeatherType } from '../game/types';
import {
  createWeatherOverlayParticles,
  resolveWeatherOverlayConfig,
  resolveWeatherVignetteProfile,
  stepWeatherOverlayParticles,
  type WeatherOverlayConfig,
  type WeatherOverlayParticle,
  type WeatherVignetteTone,
} from '../game/weatherOverlay';

interface WeatherEffectsOverlayProps {
  weather: WeatherType;
  season?: SeasonType;
  period?: TimePeriod;
  suppressed?: boolean;
}

const VIGNETTE_TONE_CLASSES: Record<WeatherVignetteTone, string> = {
  calm: 'bg-[radial-gradient(ellipse_at_center,rgba(14,10,26,0)_62%,rgba(14,10,26,0.18)_85%,rgba(10,8,20,0.42)_100%)]',
  cloudy:
    'bg-[radial-gradient(ellipse_at_center,rgba(16,20,36,0)_56%,rgba(16,20,36,0.28)_82%,rgba(11,15,28,0.56)_100%)]',
  mist: 'bg-[radial-gradient(ellipse_at_center,rgba(205,214,230,0)_50%,rgba(176,190,214,0.26)_78%,rgba(122,138,168,0.52)_100%)]',
  rain: 'bg-[radial-gradient(ellipse_at_center,rgba(10,18,36,0)_48%,rgba(10,18,36,0.38)_76%,rgba(6,12,26,0.72)_100%)]',
  storm:
    'bg-[radial-gradient(ellipse_at_center,rgba(6,11,26,0)_42%,rgba(8,14,32,0.52)_72%,rgba(4,7,18,0.86)_100%)]',
  deluge:
    'bg-[radial-gradient(ellipse_at_center,rgba(5,9,22,0)_36%,rgba(7,12,28,0.62)_68%,rgba(3,5,14,0.94)_100%)]',
  snow: 'bg-[radial-gradient(ellipse_at_center,rgba(18,32,58,0)_46%,rgba(28,50,86,0.32)_75%,rgba(14,26,48,0.66)_100%)]',
};

const VIGNETTE_NIGHT_EXTRA_CLASS =
  'bg-[radial-gradient(ellipse_at_center,rgba(4,6,18,0)_54%,rgba(4,6,18,0.28)_84%,rgba(2,4,12,0.52)_100%)]';

const VIGNETTE_FROST_RIM_CLASS =
  'bg-[radial-gradient(ellipse_at_center,rgba(220,238,255,0)_56%,rgba(204,232,255,0.24)_82%,rgba(232,246,255,0.52)_100%)]';

function drawSakuraPetal(
  ctx: CanvasRenderingContext2D,
  p: WeatherOverlayParticle,
  color: string
): void {
  const flutterScaleY = 0.42 + 0.58 * Math.abs(Math.cos(p.tumblePhase));
  const r = p.size * 0.55;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.scale(1, flutterScaleY);
  ctx.globalAlpha = p.opacity;

  // Two-lobe notched cherry blossom petal
  ctx.beginPath();
  ctx.moveTo(0, r * 0.95);
  ctx.bezierCurveTo(-r * 1.15, r * 0.35, -r * 0.98, -r * 0.9, -r * 0.16, -r * 0.78);
  ctx.lineTo(0, -r * 0.46);
  ctx.lineTo(r * 0.16, -r * 0.78);
  ctx.bezierCurveTo(r * 0.98, -r * 0.9, r * 1.15, r * 0.35, 0, r * 0.95);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Delicate pale highlight along inner crease
  ctx.globalAlpha = p.opacity * 0.45;
  ctx.strokeStyle = '#FFF8FA';
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.62);
  ctx.lineTo(0, -r * 0.38);
  ctx.stroke();

  ctx.restore();
}

function drawAutumnLeaf(
  ctx: CanvasRenderingContext2D,
  p: WeatherOverlayParticle,
  color: string
): void {
  const flutterScaleY = 0.45 + 0.55 * Math.abs(Math.cos(p.tumblePhase));
  const r = p.size * 0.6;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.scale(1, flutterScaleY);
  ctx.globalAlpha = p.opacity;

  ctx.beginPath();
  ctx.moveTo(0, -r * 1.1);
  ctx.quadraticCurveTo(r * 0.95, -r * 0.25, 0, r * 1.05);
  ctx.quadraticCurveTo(-r * 0.95, -r * 0.25, 0, -r * 1.1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.globalAlpha = p.opacity * 0.5;
  ctx.strokeStyle = '#5B2A18';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(0, r * 1.15);
  ctx.stroke();

  ctx.restore();
}

function drawRainStreak(
  ctx: CanvasRenderingContext2D,
  p: WeatherOverlayParticle,
  color: string,
  isStorm: boolean,
  height: number,
  splashEnabled: boolean
): void {
  const speed = Math.hypot(p.vx, p.vy) || 1;
  const nx = p.vx / speed;
  const ny = p.vy / speed;
  const len = p.size * p.lengthFactor * (isStorm ? 1.25 : 1.0);

  const x0 = p.x;
  const y0 = p.y;
  const x1 = x0 - nx * len;
  const y1 = y0 - ny * len;

  const grad = ctx.createLinearGradient(x1, y1, x0, y0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, color);

  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.strokeStyle = grad;
  ctx.lineWidth = isStorm ? 1.1 + p.depth * 1.0 : 0.85 + p.depth * 0.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x0, y0);
  ctx.stroke();

  // Subtle splash ring glint near lower edge of viewport
  if (splashEnabled && p.y > height * 0.84 && p.depth > 0.72) {
    const splashAlpha = Math.max(0, 1 - (p.y - height * 0.84) / (height * 0.16)) * p.opacity * 0.45;
    if (splashAlpha > 0.03) {
      ctx.globalAlpha = splashAlpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.ellipse(x0, y0, 4.5 * p.depth, 1.5 * p.depth, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  p: WeatherOverlayParticle,
  color: string
): void {
  const r = p.size * 0.55;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.opacity;

  // Soft bokeh halo
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.1);
  halo.addColorStop(0, color);
  halo.addColorStop(0.55, color);
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // Crisp 6-point crystal star on larger foreground flakes
  if (p.size >= 5.2) {
    ctx.rotate(p.rotation);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = p.opacity * 0.9;
    for (let arm = 0; arm < 3; arm++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(-r * 1.15, 0);
      ctx.lineTo(r * 1.15, 0);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawFogWisp(
  ctx: CanvasRenderingContext2D,
  p: WeatherOverlayParticle,
  color: string
): void {
  const rx = p.size;
  const ry = p.size * 0.34;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, ry / rx);
  ctx.globalAlpha = p.opacity;

  const grad = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAmbientMote(
  ctx: CanvasRenderingContext2D,
  p: WeatherOverlayParticle,
  color: string,
  elapsed: number
): void {
  const pulse = 0.65 + 0.35 * Math.sin(elapsed * 1.8 + p.phase);
  const r = p.size * 0.7;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.opacity * pulse;

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderWeatherFrame(
  ctx: CanvasRenderingContext2D,
  particles: WeatherOverlayParticle[],
  config: WeatherOverlayConfig,
  width: number,
  height: number,
  elapsed: number,
  lightningFlash: number
): void {
  ctx.clearRect(0, 0, width, height);

  if (lightningFlash > 0.01) {
    const skyFlash = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    skyFlash.addColorStop(0, `rgba(220, 236, 255, ${(lightningFlash * 0.22).toFixed(3)})`);
    skyFlash.addColorStop(1, 'rgba(220, 236, 255, 0)');
    ctx.fillStyle = skyFlash;
    ctx.fillRect(0, 0, width, height * 0.55);
  }

  const palette = config.palette;
  const isStorm = config.kind === 'storm_rain';

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const color = palette[p.colorIndex % palette.length];
    switch (config.kind) {
      case 'sakura_petals':
        drawSakuraPetal(ctx, p, color);
        break;
      case 'autumn_leaves':
        drawAutumnLeaf(ctx, p, color);
        break;
      case 'rain_streaks':
      case 'storm_rain':
        drawRainStreak(ctx, p, color, isStorm, height, config.splashEnabled);
        break;
      case 'snowflakes':
        drawSnowflake(ctx, p, color);
        break;
      case 'fog_wisps':
        drawFogWisp(ctx, p, color);
        break;
      case 'ambient_motes':
      default:
        drawAmbientMote(ctx, p, color, elapsed);
        break;
    }
  }
}

export const WeatherEffectsOverlay: React.FC<WeatherEffectsOverlayProps> = ({
  weather,
  season = 'spring',
  period = 'sunset',
  suppressed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const config = useMemo(
    () => resolveWeatherOverlayConfig(weather, season, period),
    [weather, season, period]
  );

  const vignette = useMemo(
    () => resolveWeatherVignetteProfile(weather, season, period),
    [weather, season, period]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (suppressed) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let width = window.innerWidth;
    let height = window.innerHeight;
    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      // 1x DPR for soft 2D weather overlay avoids competing with WebGL for GPU fill rate
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles = createWeatherOverlayParticles(config, width, height);
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      renderWeatherFrame(ctx, particles, config, width, height, 0, 0);
      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    let rafId = 0;
    let lastDrawTime = performance.now();
    let elapsed = 0;
    let lightningFlash = 0;
    let nextLightning = config.lightningRate > 0 ? 1.8 / config.lightningRate : Infinity;

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      const deltaMs = now - lastDrawTime;
      // Smooth 30 FPS weather overlay keeps main WebGL render thread silky fast
      if (deltaMs < 32) return;
      const dt = Math.min(0.06, Math.max(0.001, deltaMs / 1000));
      lastDrawTime = now;
      elapsed += dt;

      if (config.lightningRate > 0) {
        nextLightning -= dt;
        if (nextLightning <= 0) {
          lightningFlash = 0.85;
          nextLightning = (2.8 + (Math.sin(elapsed * 7.3) * 0.5 + 0.5) * 4.0) / Math.max(0.1, config.lightningRate);
        }
        lightningFlash = Math.max(0, lightningFlash - dt * 3.4);
      } else {
        lightningFlash = 0;
      }

      stepWeatherOverlayParticles(particles, config, width, height, dt, elapsed);
      renderWeatherFrame(ctx, particles, config, width, height, elapsed, lightningFlash);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [config, suppressed]);

  return (
    <div
      aria-hidden="true"
      data-testid="weather-effects-overlay"
      data-weather={weather}
      data-effect={config.kind}
      data-particle-count={suppressed ? 0 : config.count}
      className="fixed inset-0 w-full h-full z-[5] pointer-events-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      <div
        data-testid="weather-vignette"
        data-vignette-tone={vignette.tone}
        data-vignette-intensity={suppressed ? '0.00' : vignette.intensity.toFixed(2)}
        data-frost-rim={vignette.frostRim && !suppressed ? 'true' : 'false'}
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${
          suppressed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {!suppressed && (
          <div className={`absolute inset-0 ${VIGNETTE_TONE_CLASSES[vignette.tone]}`} />
        )}
        {!suppressed && vignette.nightDeepened && (
          <div className={`absolute inset-0 ${VIGNETTE_NIGHT_EXTRA_CLASS}`} />
        )}
        {!suppressed && vignette.frostRim && (
          <div className={`absolute inset-0 ${VIGNETTE_FROST_RIM_CLASS}`} />
        )}
      </div>
    </div>
  );
};
