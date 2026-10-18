import React, { useState, useRef } from 'react';
import { AnimatedTextWord } from './AnimatedTextWord';

export interface AnimatedBrandLogoProps {
  size?: 'nav' | 'hero';
  interactive?: boolean;
  className?: string;
  onHover?: () => void;
}

export const AnimatedBrandLogo: React.FC<AnimatedBrandLogoProps> = ({
  size = 'nav',
  interactive = true,
  className = '',
  onHover,
}) => {
  const [replayKey, setReplayKey] = useState(0);
  const lastTriggerRef = useRef(0);

  const handleMouseEnter = () => {
    if (!interactive) return;
    const now = Date.now();
    if (now - lastTriggerRef.current > 1200) {
      lastTriggerRef.current = now;
      setReplayKey((k) => k + 1);
      if (onHover) onHover();
    }
  };

  return (
    <span
      className={`inline-flex items-center text-blue-600 dark:text-blue-400 select-none cursor-pointer group ${className}`}
      onMouseEnter={handleMouseEnter}
      role="presentation"
      aria-label="SenseiTLU"
    >
      <AnimatedTextWord
        text="SenseiTLU"
        size={size}
        startDelay={0}
        charDelayStep={0.08}
        replayKey={replayKey}
      />
    </span>
  );
};

export default AnimatedBrandLogo;
