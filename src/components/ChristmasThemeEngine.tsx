import React, { useEffect, useMemo } from 'react';
import { useBannerConfig } from '../hooks/useBannerConfig';
import { JingleBellSvg, SantaSleighSvg, SnowflakeSvg } from './ChristmasDecorations';

interface SnowflakeSpec {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
  glyph: string | null;
}

// Deterministic pseudo-random generator so flakes stay stable across renders
function seededValue(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Global synchronizer for Web Theme (Default vs Christmas Deep Forest Night).
 * - Toggles `html.theme-christmas` class and updates theme-color meta tag.
 * - Mounts lightweight GPU-composited snowfall when Christmas theme is active.
 */
export function ChristmasThemeEngine() {
  const config = useBannerConfig();
  const isChristmas = config.webTheme === 'christmas';

  useEffect(() => {
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (isChristmas) {
      root.classList.add('theme-christmas');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#0D2B1F');
      }
    } else {
      root.classList.remove('theme-christmas');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#2563eb');
      }
    }

    return () => {
      root.classList.remove('theme-christmas');
    };
  }, [isChristmas]);

  const snowflakes = useMemo<SnowflakeSpec[]>(() => {
    const count = 34;
    return Array.from({ length: count }, (_, idx) => {
      const r1 = seededValue(idx + 1);
      const r2 = seededValue(idx + 37);
      const r3 = seededValue(idx + 73);
      const r4 = seededValue(idx + 113);
      const r5 = seededValue(idx + 157);
      const isGlyph = idx % 6 === 0;
      return {
        id: idx,
        left: Math.round(r1 * 1000) / 10,
        size: isGlyph ? 11 + Math.round(r2 * 5) : 3 + Math.round(r2 * 4),
        duration: 11 + Math.round(r3 * 12),
        delay: -Math.round(r4 * 18),
        opacity: isGlyph ? 0.32 + r5 * 0.25 : 0.25 + r5 * 0.4,
        drift: Math.round((r5 - 0.5) * 60),
        glyph: isGlyph ? (idx % 12 === 0 ? '❄' : '✦') : null,
      };
    });
  }, []);

  if (!isChristmas) return null;

  return (
    <div
      className="xmas-snowfall-layer fixed inset-0 pointer-events-none z-30 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Subtle deep forest ambient glow at top corners */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.22) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(168,216,234,0.18) 0%, transparent 70%)' }}
      />

      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="xmas-snowflake"
          style={
            {
              left: `${flake.left}%`,
              width: flake.glyph ? 'auto' : `${flake.size}px`,
              height: flake.glyph ? 'auto' : `${flake.size}px`,
              fontSize: flake.glyph ? `${flake.size}px` : undefined,
              opacity: flake.opacity,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
              '--xmas-drift': `${flake.drift}px`,
              color: flake.glyph === '✦' ? '#F5C842' : '#F0EDE8',
              backgroundColor: flake.glyph ? 'transparent' : '#F0EDE8',
            } as React.CSSProperties
          }
        >
          {flake.glyph}
        </span>
      ))}
    </div>
  );
}

/**
 * Festive twinkling fairy-light strand + hanging SVG Jingle Bells under the top navbar
 * when Christmas Deep Forest Night theme is active.
 */
export function ChristmasNavbarGarland() {
  const lights = [
    '#F5C842',
    '#E74C3C',
    '#A8D8EA',
    '#FFD700',
    '#2D6A4F',
    '#F5C842',
    '#C0392B',
    '#A8D8EA',
    '#FFD700',
    '#E74C3C',
    '#F5C842',
    '#A8D8EA',
    '#C0392B',
    '#FFD700',
    '#2D6A4F',
    '#F5C842',
    '#E74C3C',
    '#A8D8EA',
  ];

  return (
    <div
      className="xmas-garland-bar relative w-full h-2.5 overflow-visible pointer-events-none select-none flex items-center justify-around px-4"
      aria-hidden="true"
    >
      {/* Subtle pine & snow frost hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2D6A4F] to-transparent opacity-85" />
      {lights.map((color, idx) => (
        <span
          key={idx}
          className="xmas-fairy-bulb block w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px 1px ${color}`,
            animationDelay: `${(idx % 5) * 0.45}s`,
          }}
        />
      ))}
      {/* Hanging SVG Jingle Bells on far edges of desktop navbar */}
      <span className="hidden lg:block absolute top-0 left-5 string-hang origin-top opacity-90">
        <JingleBellSvg className="w-6 h-8 drop-shadow-md" />
      </span>
      <span className="hidden lg:block absolute top-0 right-5 string-hang origin-top opacity-90" style={{ animationDelay: '0.8s' }}>
        <JingleBellSvg className="w-6 h-8 drop-shadow-md" />
      </span>
    </div>
  );
}

/**
 * Editorial festive greeting & Christmas countdown kicker with inline SVG Reindeer Sleigh
 * shown in the Home Hero only when Christmas Deep Forest Night theme is active.
 */
export function ChristmasHeroBannerBadge() {
  const countdownText = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    let xmas = new Date(year, 11, 25); // Dec 25
    if (now.getMonth() === 11 && now.getDate() > 25) {
      xmas = new Date(year + 1, 11, 25);
    }
    const diffMs = xmas.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'Chúc mừng Giáng Sinh an lành';
    return `Còn ${days} ngày đến Giáng Sinh`;
  }, []);

  return (
    <div className="xmas-hero-kicker inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1B4332]/85 border border-[#F5C842]/35 shadow-[0_4px_20px_rgba(0,0,0,0.28)] text-xs sm:text-sm font-medium tracking-wide text-[#F5C842]">
      <SnowflakeSvg className="w-4 h-4 spin-slow shrink-0" />
      <span>Merry &amp; Bright</span>
      <span className="text-[#2D6A4F]" aria-hidden="true">·</span>
      <span className="text-[#B8C4BB] tabular-nums">{countdownText}</span>
      <span className="hidden sm:inline-flex items-center sleigh-glide -my-2">
        <SantaSleighSvg className="w-16 h-7" />
      </span>
    </div>
  );
}

export default ChristmasThemeEngine;
