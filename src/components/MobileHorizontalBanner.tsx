import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useBannerConfig } from '../hooks/useBannerConfig';

interface MobileHorizontalBannerProps {
  className?: string;
}

export default function MobileHorizontalBanner({ className = '' }: MobileHorizontalBannerProps) {
  const config = useBannerConfig();

  if (!config.mobileBannerUrl) return null;

  const content = (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-900/50 shadow-md group">
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
        Tài trợ
      </div>
      <div className="w-full flex items-center justify-center bg-slate-950">
        <img
          src={config.mobileBannerUrl}
          alt="Quảng cáo"
          className="w-full h-auto max-h-32 object-cover object-center transition-transform duration-300 group-hover:scale-[1.01]"
          referrerPolicy="no-referrer"
        />
      </div>
      {config.mobileBannerLinkUrl && (
        <div className="absolute bottom-2 right-2 z-10 px-2 py-1 rounded-lg bg-slate-900/90 text-[10px] font-semibold text-blue-400 border border-slate-700 flex items-center gap-1 shadow-sm">
          <span>Xem chi tiết</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );

  if (config.mobileBannerLinkUrl) {
    return (
      <div className={`md:hidden w-full my-3 px-1 ${className}`}>
        <a
          href={config.mobileBannerLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block active:scale-[0.99] transition-transform"
        >
          {content}
        </a>
      </div>
    );
  }

  return <div className={`md:hidden w-full my-3 px-1 ${className}`}>{content}</div>;
}
