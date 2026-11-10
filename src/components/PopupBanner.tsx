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

  const hasCustomTitle = Boolean(config.popupTitle && config.popupTitle.trim());

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative flex flex-col items-center animate-in zoom-in-95 duration-200 max-w-[92vw] sm:max-w-lg md:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optional Title Badge only if admin explicitly entered one in settings */}
        {hasCustomTitle && (
          <div className="mb-2.5 px-3 py-1 bg-slate-900/90 text-white rounded-full border border-slate-700/80 shadow-lg text-xs font-semibold flex items-center gap-1.5 self-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{config.popupTitle}</span>
          </div>
        )}

        {/* Frameless Image Container with corner Close Button */}
        <div className="relative group">
          {/* Floating Close 'X' Button on top-right */}
          <button
            onClick={handleClose}
            className="absolute -top-3.5 -right-3.5 md:-top-4 md:-right-4 z-30 w-8 h-8 md:w-9 md:h-9 bg-slate-900/95 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl border border-white/20 transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Đóng quảng cáo (Esc)"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </button>

          {/* Clean Image - no border frame */}
          <div 
            onClick={handleBannerClick}
            className={`relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-transparent transition-transform duration-200 ${
              config.popupLinkUrl ? 'cursor-pointer hover:opacity-95' : ''
            }`}
          >
            <img 
              src={config.popupImageUrl} 
              alt={config.popupTitle || 'Quảng cáo'} 
              className="max-h-[80vh] max-w-[90vw] md:max-w-xl w-auto h-auto object-contain rounded-2xl md:rounded-3xl shadow-2xl block"
            />
            {config.popupLinkUrl && (
              <div className="absolute bottom-3 right-3 bg-slate-900/85 hover:bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 shadow-lg flex items-center gap-1 backdrop-blur-xs transition-colors">
                <span>Mở liên kết</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Subtle skip link underneath */}
        <button 
          onClick={handleClose}
          className="mt-2.5 text-xs text-slate-300 hover:text-white underline font-medium transition-colors drop-shadow-sm cursor-pointer"
        >
          Bỏ qua quảng cáo
        </button>
      </div>
    </div>
  );
}
