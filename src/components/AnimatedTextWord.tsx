import React from 'react';

export interface AnimatedTextWordProps {
  text: string;
  size?: 'nav' | 'hero';
  startDelay?: number; // Starting delay in seconds
  charDelayStep?: number; // Delay increment between letters
  className?: string;
  replayKey?: number;
}

// Proportional character width ratios for standard bold system font
const CHAR_WIDTH_RATIOS: Record<string, number> = {
  ' ': 0.30,
  'i': 0.32,
  'l': 0.32,
  'I': 0.35,
  'j': 0.35,
  't': 0.42,
  'f': 0.42,
  'r': 0.45,
  's': 0.52,
  'c': 0.54,
  'e': 0.56,
  'a': 0.56,
  'o': 0.58,
  'n': 0.58,
  'u': 0.58,
  'v': 0.56,
  'x': 0.56,
  'z': 0.52,
  'k': 0.56,
  'b': 0.60,
  'd': 0.60,
  'p': 0.60,
  'q': 0.60,
  'h': 0.58,
  'g': 0.58,
  'y': 0.56,
  'à': 0.56,
  'á': 0.56,
  'ả': 0.56,
  'ã': 0.56,
  'ạ': 0.56,
  'ệ': 0.56,
  'ê': 0.56,
  'T': 0.62,
  'L': 0.54,
  'S': 0.60,
  'U': 0.64,
  'A': 0.64,
  'B': 0.60,
  'C': 0.62,
  'D': 0.64,
  'E': 0.56,
  'F': 0.54,
  'G': 0.66,
  'H': 0.66,
  'M': 0.82,
  'N': 0.66,
  'O': 0.68,
  'P': 0.58,
  'R': 0.60,
  'W': 0.84,
};

export const AnimatedTextWord: React.FC<AnimatedTextWordProps> = ({
  text,
  size = 'hero',
  startDelay = 0,
  charDelayStep = 0.08,
  className = '',
  replayKey = 0,
}) => {
  const isHero = size === 'hero';
  const fontSize = isHero ? 40 : 25;
  const strokeWidth = isHero ? 1.5 : 1.2;
  const baselineY = isHero ? 36 : 24;
  const svgHeight = isHero ? 46 : 30;

  // Calculate character positions
  const chars = text.split('');
  let currentX = 1;
  const charPositions = chars.map((char) => {
    const x = currentX;
    const ratio = CHAR_WIDTH_RATIOS[char] ?? 0.58;
    const width = Math.round(fontSize * ratio);
    currentX += width;
    return { char, x };
  });

  const totalWidth = Math.max(currentX + 2, 20);

  return (
    <svg
      key={replayKey}
      viewBox={`0 0 ${totalWidth} ${svgHeight}`}
      className={`inline-block overflow-visible align-baseline select-none ${
        isHero ? 'h-9 sm:h-10 md:h-12' : 'h-6 sm:h-7'
      } w-auto ${className}`}
      style={{ width: `${totalWidth}px`, maxWidth: '100%' }}
      aria-hidden="true"
    >
      <text
        fontFamily="inherit"
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing="-0.02em"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
      >
        {charPositions.map(({ char, x }, index) => {
          const delay = startDelay + index * charDelayStep;
          return (
            <tspan
              key={index}
              x={x}
              y={baselineY}
              className="handwriting-char"
              style={{
                ['--hw-delay' as any]: `${delay.toFixed(2)}s`,
              }}
            >
              {char}
            </tspan>
          );
        })}
      </text>
    </svg>
  );
};

export default AnimatedTextWord;
