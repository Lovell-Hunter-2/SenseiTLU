import React from 'react';

export type ChristmasStickerVariant =
  | 'hat'
  | 'gift'
  | 'snowflake'
  | 'bell'
  | 'reindeer'
  | 'stocking'
  | 'sleigh'
  | 'candy';

/**
 * 1. Mũ Noel (Santa Hat) — Cranberry/Holly hat with snowy fluffy trim & pom-pom
 */
export function SantaHatSvg({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Main hat body */}
      <path
        d="M12 45C14 27 25 14 40 12C48 11 54 17 55 26C48 22 42 24 39 29C37 33 41 38 45 45H12Z"
        fill="url(#xmasHatGrad)"
        stroke="#07160E"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Highlight curve */}
      <path
        d="M19 39C21 27 28 19 38 17"
        stroke="#F0EDE8"
        strokeOpacity="0.28"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Fluffy snow brim */}
      <rect
        x="8"
        y="42"
        width="40"
        height="11"
        rx="5.5"
        fill="#F0EDE8"
        stroke="#A8D8EA"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      {/* Subtle gold stitch */}
      <path
        d="M14 47.5H42"
        stroke="#F5C842"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      {/* Pom-pom */}
      <circle
        cx="54"
        cy="27"
        r="6.2"
        fill="#F0EDE8"
        stroke="#A8D8EA"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <circle cx="52.5" cy="25.2" r="1.8" fill="#FFFFFF" fillOpacity="0.85" />
      <defs>
        <linearGradient id="xmasHatGrad" x1="12" y1="12" x2="54" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E74C3C" />
          <stop offset="1" stopColor="#A93226" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 2. Hộp quà (Gift Box) — Cranberry box wrapped in Gold ribbon & bow
 */
export function GiftBoxSvg({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Box base */}
      <rect
        x="12"
        y="28"
        width="40"
        height="28"
        rx="5"
        fill="url(#xmasGiftGrad)"
        stroke="#07160E"
        strokeWidth="1.4"
      />
      {/* Lid */}
      <rect
        x="9"
        y="20"
        width="46"
        height="10"
        rx="3.5"
        fill="#E74C3C"
        stroke="#07160E"
        strokeWidth="1.4"
      />
      {/* Gold vertical ribbon */}
      <rect x="28" y="20" width="8" height="36" fill="#F5C842" />
      {/* Gold horizontal ribbon */}
      <rect x="12" y="38" width="40" height="6" fill="#F5C842" fillOpacity="0.9" />
      {/* Bow left & right */}
      <path
        d="M32 20C26 11 16 11 18 17C19.5 21 27 20.5 32 20Z"
        fill="#FFD700"
        stroke="#B87333"
        strokeWidth="1.2"
      />
      <path
        d="M32 20C38 11 48 11 46 17C44.5 21 37 20.5 32 20Z"
        fill="#FFD700"
        stroke="#B87333"
        strokeWidth="1.2"
      />
      <circle cx="32" cy="20" r="3.4" fill="#F5C842" stroke="#B87333" strokeWidth="1.2" />
      <defs>
        <linearGradient id="xmasGiftGrad" x1="12" y1="28" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C0392B" />
          <stop offset="1" stopColor="#8E241A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 3. Bông tuyết (Snowflake) — Delicate 6-point Ice & Snow crystal
 */
export function SnowflakeSvg({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#A8D8EA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="32" y1="6" x2="32" y2="58" />
        <line x1="9.5" y1="19" x2="54.5" y2="45" />
        <line x1="54.5" y1="19" x2="9.5" y2="45" />
        {/* Branches */}
        <path d="M26 12L32 17L38 12" />
        <path d="M26 52L32 47L38 52" />
        <path d="M13 28L19 25L18 18" />
        <path d="M51 36L45 39L46 46" />
        <path d="M46 18L45 25L51 28" />
        <path d="M18 46L19 39L13 36" />
      </g>
      <circle cx="32" cy="32" r="5" fill="#F0EDE8" fillOpacity="0.9" stroke="#A8D8EA" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="2" fill="#F5C842" />
    </svg>
  );
}

/**
 * 4. Chuông Giáng sinh (Jingle Bell) — Gold bell hanging on string with holly leaves
 */
export function JingleBellSvg({ className = 'w-8 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hanging string */}
      <line x1="28" y1="0" x2="28" y2="18" stroke="#F5C842" strokeOpacity="0.7" strokeWidth="1.6" strokeDasharray="2 2" />
      {/* Holly leaves */}
      <path d="M28 19C20 12 12 15 10 22C17 24 23 23 28 19Z" fill="#2D6A4F" stroke="#07160E" strokeWidth="1.1" />
      <path d="M28 19C36 12 44 15 46 22C39 24 33 23 28 19Z" fill="#2D6A4F" stroke="#07160E" strokeWidth="1.1" />
      {/* Bell body */}
      <path
        d="M28 20C18 20 14 29 14 39C14 44 11 48 9 50H47C45 48 42 44 42 39C42 29 38 20 28 20Z"
        fill="url(#xmasBellGrad)"
        stroke="#07160E"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Bell shine */}
      <path d="M21 26C18.5 30 18 36 18 41" stroke="#FFF8DC" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" />
      {/* Bell rim & clapper */}
      <rect x="8" y="49" width="40" height="4.5" rx="2.25" fill="#B87333" />
      <circle cx="28" cy="57" r="4.5" fill="#F5C842" stroke="#B87333" strokeWidth="1.2" />
      {/* Holly berries */}
      <circle cx="28" cy="19" r="3" fill="#E74C3C" />
      <circle cx="24" cy="21" r="2.3" fill="#C0392B" />
      <circle cx="32" cy="21" r="2.3" fill="#C0392B" />
      <defs>
        <linearGradient id="xmasBellGrad" x1="12" y1="20" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD700" />
          <stop offset="0.55" stopColor="#F5C842" />
          <stop offset="1" stopColor="#B87333" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 5. Tuần lộc (Reindeer) — Warm Copper Rudolph with antlers & glowing red nose
 */
export function ReindeerSvg({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left antler */}
      <path
        d="M24 23L16 9M19 15L12 14M21 18L22 10"
        stroke="#D4A373"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right antler */}
      <path
        d="M40 23L48 9M45 15L52 14M43 18L42 10"
        stroke="#D4A373"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ears */}
      <ellipse cx="16" cy="29" rx="5.5" ry="3.2" transform="rotate(-24 16 29)" fill="#B87333" stroke="#07160E" strokeWidth="1.2" />
      <ellipse cx="48" cy="29" rx="5.5" ry="3.2" transform="rotate(24 48 29)" fill="#B87333" stroke="#07160E" strokeWidth="1.2" />
      {/* Head */}
      <ellipse cx="32" cy="37" rx="15" ry="16" fill="url(#xmasDeerGrad)" stroke="#07160E" strokeWidth="1.4" />
      {/* Snout */}
      <ellipse cx="32" cy="44" rx="9.5" ry="7.2" fill="#E6CCB2" />
      {/* Eyes */}
      <circle cx="25.5" cy="34" r="2.3" fill="#07160E" />
      <circle cx="38.5" cy="34" r="2.3" fill="#07160E" />
      <circle cx="26.2" cy="33.2" r="0.8" fill="#FFFFFF" />
      <circle cx="39.2" cy="33.2" r="0.8" fill="#FFFFFF" />
      {/* Rudolph glowing red nose */}
      <circle cx="32" cy="42.5" r="4.3" fill="#E74C3C" stroke="#C0392B" strokeWidth="1" />
      <circle cx="30.6" cy="41.2" r="1.3" fill="#FFFFFF" fillOpacity="0.8" />
      {/* Smile */}
      <path d="M28.5 47.5C30 49.3 34 49.3 35.5 47.5" stroke="#5C3A21" strokeWidth="1.5" strokeLinecap="round" />
      {/* Festive scarf hint */}
      <path d="M21 51C25 54 39 54 43 51" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M26 52.8H38" stroke="#F5C842" strokeWidth="1.2" strokeDasharray="2 2" strokeLinecap="round" />
      <defs>
        <linearGradient id="xmasDeerGrad" x1="17" y1="21" x2="47" y2="53" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C98646" />
          <stop offset="1" stopColor="#8F5320" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 6. Tất Giáng sinh (Stocking) — Red festive stocking with snow cuff & gold star
 */
export function StockingSvg({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hanging loop */}
      <path d="M23 12C23 7 28 7 28 12" stroke="#F5C842" strokeWidth="2.2" strokeLinecap="round" />
      {/* Stocking foot */}
      <path
        d="M23 18H41V37C41 44 37 51 28 53C20 55 13 51 12 45C11 39 17 36 23 35V18Z"
        fill="url(#xmasStockingGrad)"
        stroke="#07160E"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Toe & heel accent */}
      <path d="M12.5 45C12.2 41 15 38 18.5 37.5C19.5 42 18 47.5 15 50.5C13.2 49.2 12.6 47.2 12.5 45Z" fill="#2D6A4F" />
      {/* Fluffy cuff */}
      <rect x="20" y="11" width="24" height="9" rx="4.5" fill="#F0EDE8" stroke="#A8D8EA" strokeOpacity="0.6" strokeWidth="1.2" />
      {/* Gold star ornament */}
      <path
        d="M32 25L33.5 28.4L37.2 28.8L34.4 31.2L35.2 34.8L32 32.9L28.8 34.8L29.6 31.2L26.8 28.8L30.5 28.4L32 25Z"
        fill="#F5C842"
      />
      <defs>
        <linearGradient id="xmasStockingGrad" x1="12" y1="18" x2="41" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E74C3C" />
          <stop offset="1" stopColor="#A93226" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 7. Xe tuần lộc kéo quà (Santa Sleigh & Reindeer) — Crisp horizontal emblem for bars & banners
 */
export function SantaSleighSvg({ className = 'w-20 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 156 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Magic stardust trail */}
      <circle cx="8" cy="36" r="1.8" fill="#F5C842" fillOpacity="0.65" />
      <circle cx="16" cy="31" r="1.3" fill="#FFD700" fillOpacity="0.8" />
      <circle cx="13" cy="42" r="1.2" fill="#A8D8EA" fillOpacity="0.7" />

      {/* Gift sack & wrapped gifts inside sleigh */}
      <circle cx="38" cy="24" r="9.5" fill="#2D6A4F" stroke="#07160E" strokeWidth="1.2" />
      <rect x="44" y="18" width="11" height="11" rx="2" fill="#F5C842" stroke="#07160E" strokeWidth="1.1" />
      <line x1="49.5" y1="18" x2="49.5" y2="29" stroke="#C0392B" strokeWidth="1.8" />
      <rect x="30" y="16" width="9" height="9" rx="1.8" fill="#E74C3C" stroke="#07160E" strokeWidth="1.1" />
      <line x1="34.5" y1="16" x2="34.5" y2="25" stroke="#F5C842" strokeWidth="1.6" />

      {/* Sleigh body */}
      <path
        d="M22 25C24 25 27 28 29 33H58C61 33 65 29 67 24C70 25 71 29 68 35C65 40 59 42 52 42H30C24 42 20 38 20 31C20 27 21 25 22 25Z"
        fill="url(#xmasSleighGrad)"
        stroke="#07160E"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Gold trim on sleigh */}
      <path d="M27 36H61" stroke="#F5C842" strokeWidth="2" strokeLinecap="round" />
      {/* Sleigh runners */}
      <path
        d="M19 47H66C71 47 74 44 74 40"
        stroke="#F5C842"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <line x1="33" y1="42" x2="31" y2="47" stroke="#F5C842" strokeWidth="2" />
      <line x1="54" y1="42" x2="56" y2="47" stroke="#F5C842" strokeWidth="2" />

      {/* Reins connecting sleigh to reindeer */}
      <path
        d="M67 28C82 32 98 30 113 24"
        stroke="#F5C842"
        strokeOpacity="0.8"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />

      {/* Leaping Reindeer */}
      <g>
        {/* Back legs */}
        <path d="M107 34L98 44M111 35L106 46" stroke="#8F5320" strokeWidth="2.6" strokeLinecap="round" />
        {/* Front legs */}
        <path d="M126 33L138 39M124 35L133 45" stroke="#8F5320" strokeWidth="2.6" strokeLinecap="round" />
        {/* Body */}
        <ellipse cx="117" cy="31" rx="13" ry="6.5" transform="rotate(-8 117 31)" fill="#B87333" stroke="#07160E" strokeWidth="1.2" />
        {/* Tail */}
        <circle cx="103" cy="29" r="2.2" fill="#F0EDE8" />
        {/* Neck & Head */}
        <path d="M125 28L132 18" stroke="#B87333" strokeWidth="5.5" strokeLinecap="round" />
        <ellipse cx="136" cy="17" rx="6.2" ry="4.4" transform="rotate(-12 136 17)" fill="#C98646" stroke="#07160E" strokeWidth="1.2" />
        {/* Antlers */}
        <path d="M133 13L128 5M131 9L125 9M135 13L138 5M136 9L141 8" stroke="#D4A373" strokeWidth="1.8" strokeLinecap="round" />
        {/* Collar & Bell */}
        <path d="M126 24L132 25" stroke="#E74C3C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="131" cy="27" r="1.8" fill="#FFD700" />
        {/* Glowing Rudolph Nose */}
        <circle cx="143" cy="17.5" r="2.5" fill="#E74C3C" />
        <circle cx="143" cy="17.5" r="5" fill="#E74C3C" fillOpacity="0.28" />
      </g>

      <defs>
        <linearGradient id="xmasSleighGrad" x1="20" y1="24" x2="70" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E74C3C" />
          <stop offset="1" stopColor="#A93226" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 8. Kẹo gậy (Candy Cane) — Red & Snow striped cane with sage ribbon
 */
export function CandyCaneSvg({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M25 54V24C25 15 31 10 38 10C45 10 50 15 50 22C50 25 48 27 45 27C42 27 40 25 40 22C40 19.5 38.8 18 37 18C35 18 33.5 20 33.5 24V54C33.5 56.5 31.6 58 29.25 58C26.9 58 25 56.5 25 54Z"
        fill="#F0EDE8"
        stroke="#07160E"
        strokeWidth="1.4"
      />
      {/* Red stripes */}
      <path d="M25.5 47L33 43M25.5 38L33 34M25.5 29L33 25M28 16L34 19M38 10.5L39.5 18M46.5 14L41.5 20" stroke="#E74C3C" strokeWidth="3.6" strokeLinecap="round" />
      {/* Mini sage bow */}
      <circle cx="29.5" cy="31" r="2.8" fill="#2D6A4F" stroke="#F5C842" strokeWidth="1" />
    </svg>
  );
}

/**
 * 9. Dải tuyết phủ (Snow Cap / Frost Drift) — Soft snow edge draped on top of bars/cards
 */
export function ChristmasSnowCap({ className = 'w-full h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 20"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 0H320V6C305 6 300 14 285 13C270 12 264 6 248 7C232 8 228 16 212 15C196 14 190 6 172 7C154 8 148 15 132 14C116 13 110 5 92 7C74 9 68 17 50 15C32 13 24 6 10 8C4 9 0 7 0 6V0Z"
        fill="#F0EDE8"
        fillOpacity="0.9"
      />
      <path
        d="M0 5C14 8 28 14 50 15C70 16 78 9 94 7C112 5 118 14 134 14C150 14 156 8 174 7C192 6 198 14 214 15C230 16 236 8 250 7C266 6 272 13 287 13C302 13 308 7 320 6"
        stroke="#A8D8EA"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
    </svg>
  );
}

const ROTATION_ORDER: ChristmasStickerVariant[] = [
  'hat',
  'gift',
  'snowflake',
  'bell',
  'reindeer',
  'stocking',
  'candy',
];

/**
 * Reusable corner/header sticker component following the exact positioning & animation
 * classes from Christmas Decoration Elements — Sticker Kit.md.
 * Always pointer-events-none so it never blocks clicks on card buttons or links.
 */
export function ChristmasCardSticker({
  variant,
  index,
  size = 'md',
}: {
  variant?: ChristmasStickerVariant;
  index?: number;
  size?: 'sm' | 'md';
}) {
  const resolved: ChristmasStickerVariant =
    variant ?? ROTATION_ORDER[(index ?? 0) % ROTATION_ORDER.length];

  const isSmall = size === 'sm';

  switch (resolved) {
    case 'hat':
      return (
        <span className="deco-corner-hat pointer-events-none select-none" aria-hidden="true">
          <SantaHatSvg className={isSmall ? 'w-8 h-8 drop-shadow-md' : 'w-10 h-10 drop-shadow-md'} />
        </span>
      );
    case 'gift':
      return (
        <span className="deco-topleft bounce-anim pointer-events-none select-none" aria-hidden="true">
          <GiftBoxSvg className={isSmall ? 'w-7 h-7 drop-shadow-md' : 'w-8 h-8 drop-shadow-md'} />
        </span>
      );
    case 'snowflake':
      return (
        <span className="deco-bottomright spin-slow pointer-events-none select-none" aria-hidden="true">
          <SnowflakeSvg className={isSmall ? 'w-7 h-7 opacity-85' : 'w-9 h-9 opacity-85'} />
        </span>
      );
    case 'bell':
      return (
        <span className="deco-hang string-hang pointer-events-none select-none" aria-hidden="true">
          <JingleBellSvg className={isSmall ? 'w-6 h-8 drop-shadow-md' : 'w-7 h-9 drop-shadow-md'} />
        </span>
      );
    case 'reindeer':
      return (
        <span className="deco-topright sway-anim pointer-events-none select-none" aria-hidden="true">
          <ReindeerSvg className={isSmall ? 'w-8 h-8 drop-shadow-md' : 'w-9 h-9 drop-shadow-md'} />
        </span>
      );
    case 'stocking':
      return (
        <span className="deco-topleft deco-stocking pointer-events-none select-none" aria-hidden="true">
          <StockingSvg className={isSmall ? 'w-7 h-7 drop-shadow-md' : 'w-8 h-8 drop-shadow-md'} />
        </span>
      );
    case 'candy':
      return (
        <span className="deco-bottomleft pointer-events-none select-none" aria-hidden="true">
          <CandyCaneSvg className={isSmall ? 'w-6 h-6 opacity-90 drop-shadow-sm' : 'w-7 h-7 opacity-90 drop-shadow-sm'} />
        </span>
      );
    case 'sleigh':
      return (
        <span className="deco-sleigh-corner pointer-events-none select-none" aria-hidden="true">
          <SantaSleighSvg className={isSmall ? 'w-16 h-7 drop-shadow-md' : 'w-20 h-8 drop-shadow-md'} />
        </span>
      );
  }
}
