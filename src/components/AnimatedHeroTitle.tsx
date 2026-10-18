import React, { useState, useRef } from 'react';
import { AnimatedTextWord } from './AnimatedTextWord';

export const AnimatedHeroTitle: React.FC = () => {
  const [triggerCount, setTriggerCount] = useState(0);
  const lastTriggerRef = useRef(0);

  const handleMouseEnter = () => {
    const now = Date.now();
    if (now - lastTriggerRef.current > 1200) {
      lastTriggerRef.current = now;
      setTriggerCount((c) => c + 1);
    }
  };

  return (
    <h1
      className="text-4xl md:text-5xl font-bold tracking-tight inline-flex items-center justify-center flex-wrap cursor-pointer select-none group"
      onMouseEnter={handleMouseEnter}
      aria-label="📚 Tài liệu SenseiTLU"
    >
      <span className="mr-2 sm:mr-3 inline-block transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        📚
      </span>

      {/* Từ 1: "Tài" (chạy từ 0.0s) */}
      <span className="text-slate-900 dark:text-slate-50 inline-flex items-center">
        <AnimatedTextWord
          text="Tài"
          size="hero"
          startDelay={0.0}
          replayKey={triggerCount}
        />
      </span>

      {/* Khoảng cách tiêu chuẩn giữa "Tài" và "liệu" */}
      <span className="w-2 sm:w-2.5 inline-block" />

      {/* Từ 2: "liệu" (chạy từ 0.28s) */}
      <span className="text-slate-900 dark:text-slate-50 inline-flex items-center">
        <AnimatedTextWord
          text="liệu"
          size="hero"
          startDelay={0.28}
          replayKey={triggerCount}
        />
      </span>

      {/* Khoảng cách tiêu chuẩn giữa "liệu" và "SenseiTLU" */}
      <span className="w-2.5 sm:w-3.5 inline-block" />

      {/* Từ 3: "SenseiTLU" (chạy từ 0.66s) */}
      <span className="text-blue-600 dark:text-blue-400 inline-flex items-center">
        <AnimatedTextWord
          text="SenseiTLU"
          size="hero"
          startDelay={0.66}
          replayKey={triggerCount}
        />
      </span>
    </h1>
  );
};

export default AnimatedHeroTitle;
