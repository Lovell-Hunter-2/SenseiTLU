import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { useBannerConfig } from '../hooks/useBannerConfig';

export default function PopupBanner() {
  const config = useBannerConfig();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!config.popupEnabled || !config.popupImageUrl) {
      setIsOpen(false);
      return;
    }

    const triggerType = config.popupTriggerType || 'time';
    const frequency = config.popupFrequency || 15;

    // Check last dismiss time
    const lastDismiss = Number(localStorage.getItem('sensei_popup_last_dismiss') || 0);
    const now = Date.now();

    // 1. Entry Trigger: shows once after X seconds upon visiting
    if (triggerType === 'entry') {
      const sessionShown = sessionStorage.getItem('sensei_popup_entry_shown');
      if (!sessionShown) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem('sensei_popup_entry_shown', 'true');
        }, Math.max(1, frequency) * 1000);
        return () => clearTimeout(timer);
      }
    } 
    // 2. Time Trigger: shows every X minutes
    else if (triggerType === 'time') {
      const cooldownMs = Math.max(1, frequency) * 60 * 1000;
      if (now - lastDismiss > cooldownMs) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } 
    // 3. Document clicks trigger: shows every X document views
    else if (triggerType === 'docs') {
      const handleDocViewed = (e: any) => {
        const count = e.detail?.count || 0;
        const targetCount = Math.max(1, frequency);
        if (count >= targetCount) {
          setIsOpen(true);
          sessionStorage.setItem('sensei_doc_views_count', '0');
        }
      };
      window.addEventListener('sensei_doc_viewed', handleDocViewed);
      return () => window.removeEventListener('sensei_doc_viewed', handleDocViewed);
    }
  }, [config.popupEnabled, config.popupImageUrl, config.popupTriggerType, config.popupFrequency]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('sensei_popup_last_dismiss', String(Date.now()));
  };

  const handleBannerClick = () => {
    if (config.popupLinkUrl) {
      window.open(config.popupLinkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen || !config.popupEnabled || !config.popupImageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3 h-3" /> Tài trợ
            </span>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[240px]">
              {config.popupTitle || 'Thông tin đối tác'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Image Content */}
        <div 
          onClick={handleBannerClick}
          className={`relative w-full bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden ${
            config.popupLinkUrl ? 'cursor-pointer group' : ''
          }`}
        >
          <img 
            src={config.popupImageUrl} 
            alt={config.popupTitle || 'Quảng cáo'} 
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
          {config.popupLinkUrl && (
            <div className="absolute bottom-3 right-3 bg-slate-900/90 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1.5 transition-colors">
              <span>Xem chi tiết</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>SenseiTLU Sponsor</span>
          <button 
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
