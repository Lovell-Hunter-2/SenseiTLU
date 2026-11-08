import React from 'react';
import { useBannerConfig } from '../hooks/useBannerConfig';

interface SideBannerColumnProps {
  side: 'left' | 'right';
  className?: string;
  stickyTop?: string; // e.g. "top-20" or "top-24"
}

export function SideBannerColumn({ side, className = '', stickyTop = 'top-20' }: SideBannerColumnProps) {
  const config = useBannerConfig();
  
  // Dedicated side skyscraper banner url and link
  const url = side === 'left' ? config.sideLeftUrl : config.sideRightUrl;
  const linkUrl = side === 'left' ? config.sideLeftLinkUrl : config.sideRightLinkUrl;

  if (!url) return null;

  const content = (
    <div className="relative group w-full rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-800/80 shadow-2xl bg-slate-900/20 backdrop-blur-xs transition-all duration-300 hover:shadow-blue-500/10 hover:border-slate-700/80">
      <img
        src={url}
        alt={`Banner ${side === 'left' ? 'Trái' : 'Phải'}`}
        className="w-full h-auto max-h-[86vh] object-contain object-top transition-transform duration-500 group-hover:scale-[1.015]"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  return (
    <aside className={`shrink-0 select-none ${className}`}>
      <div className={`sticky ${stickyTop} self-start transition-all`}>
        {linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
            title="Xem liên kết quảng cáo"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    </aside>
  );
}

export default SideBannerColumn;
