import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Upload,
  Info,
  Home,
  FileText,
  LayoutGrid,
  Bot,
  Calendar,
  Brain,
  Layers,
  Globe,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { MOBILE_BOTTOM_TABS } from './navigationConfig';
import { useEcosystemApps, EcosystemAppItem } from '../hooks/useEcosystemApps';
import { toggleAIAssistant, pingAIAssistant } from './AIAssistantWidget';
import { ECOSYSTEM_ICONS } from './EcosystemManagerModal';

// Dedicated custom tile styling matching Image 2
const APP_STYLE_MAP: Record<
  string,
  { bgClass: string; iconColor: string; iconComponent: React.FC<any> }
> = {
  'hoi-ai': {
    bgClass: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400',
    iconColor: 'text-emerald-400',
    iconComponent: Bot,
  },
  'study-space': {
    bgClass: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400',
    iconColor: 'text-cyan-400',
    iconComponent: Layers,
  },
  'ho-tro': {
    bgClass: 'bg-amber-950/60 border-amber-500/30 text-amber-400',
    iconColor: 'text-amber-400',
    iconComponent: MessageCircle,
  },
  'thi-online-ai': {
    bgClass: 'bg-rose-950/60 border-rose-500/30 text-rose-400',
    iconColor: 'text-rose-400',
    iconComponent: Brain,
  },
  'lich-hoc': {
    bgClass: 'bg-purple-950/60 border-purple-500/30 text-purple-400',
    iconColor: 'text-purple-400',
    iconComponent: Calendar,
  },
};

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { apps } = useEcosystemApps();

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close menu on route change
  useEffect(() => {
    handleClose();
  }, [location.pathname]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isOpen || isClosing)) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing]);

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isOpen && !isClosing) return;
    setIsClosing(true);
    // Reverse exit duration ~220ms
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 220);
  };

  const toggleEcosystem = () => {
    if (isOpen || isClosing) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleAppClick = (app: EcosystemAppItem) => {
    handleClose();
    if (app.isSpecialAction === 'ai-assistant') {
      toggleAIAssistant();
      pingAIAssistant();
      return;
    }
    if (app.path) {
      navigate(app.path);
      return;
    }
    if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to check active state of bottom tabs
  const isTabActive = (tabId: string, path: string) => {
    if (tabId === 'ecosystem') {
      return isOpen || isClosing;
    }
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Order items so closest to button is first (Hỏi AI -> Lịch học -> Thi online AI -> Study Space)
  // When rendering with flex-col-reverse, index 0 is at the bottom, closest to the button
  const orderedApps = [...apps].sort((a, b) => {
    const priority = ['hoi-ai', 'study-space', 'ho-tro', 'thi-online-ai', 'lich-hoc'];
    const indexA = priority.indexOf(a.id);
    const indexB = priority.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  return (
    <>
      {/* 1. Backdrop when Ecosystem drawer is open */}
      {(isOpen || isClosing) && (
        <div
          className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-xs transition-opacity duration-200 md:hidden ${
            isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* 2. Ecosystem Popup Cards (Right-aligned, stacked vertically above the button) */}
      {(isOpen || isClosing) && (
        <div
          className="fixed z-50 right-3 sm:right-4 bottom-[calc(68px+env(safe-area-inset-bottom))] max-h-[calc(100vh-80px-env(safe-area-inset-bottom))] overflow-y-auto no-scrollbar md:hidden flex flex-col-reverse items-end gap-2.5 max-w-[280px] pointer-events-auto pr-1"
          role="dialog"
          aria-label="Danh sách ứng dụng Hệ sinh thái"
          aria-modal="true"
        >
          {orderedApps.map((app, index) => {
            const style = APP_STYLE_MAP[app.id] || {
              bgClass: 'bg-slate-800/70 border-slate-700/50 text-cyan-400',
              iconColor: 'text-cyan-400',
              iconComponent: ECOSYSTEM_ICONS[app.iconName] || Globe,
            };
            const AppIcon = style.iconComponent;

            // Staggered timing:
            // Entering: Closest (index 0) springs out first (+70ms each)
            // Exiting: Topmost shrinks first (+40ms each in reverse)
            const enterDelay = `${index * 0.07}s`;
            const exitDelay = `${(orderedApps.length - 1 - index) * 0.04}s`;

            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                className={`group flex items-center gap-3.5 px-4 py-2.5 min-w-[185px] sm:min-w-[200px] bg-[#0c1425]/95 hover:bg-[#121c33] active:bg-[#162340] border border-slate-800/90 hover:border-cyan-500/50 rounded-2xl shadow-xl shadow-black/40 backdrop-blur-md text-left transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isClosing ? 'ecosystem-item-exit' : 'ecosystem-item-enter'
                }`}
                style={{
                  animationDelay: isClosing ? exitDelay : enterDelay,
                }}
              >
                {/* App Icon Tile */}
                <div
                  className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-105 ${style.bgClass}`}
                >
                  <AppIcon className={`w-5 h-5 ${style.iconColor}`} />
                </div>

                {/* App Name */}
                <span className="font-semibold text-white text-[15px] tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                  {app.name}
                </span>

                {/* Subtle external indicator if external URL */}
                {app.url && (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto opacity-70 group-hover:text-cyan-400 transition-colors" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Fixed Bottom Navigation Bar (Mobile only: < 768px) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a1120]/95 backdrop-blur-md border-t border-slate-800/90 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Thanh điều hướng chính trên điện thoại"
      >
        <div className="relative flex items-center justify-around h-[62px] px-2 max-w-lg mx-auto">
          {MOBILE_BOTTOM_TABS.map((tab) => {
            const active = isTabActive(tab.id, tab.path);
            const TabIcon = tab.icon;

            // Center Tab: Elevated Circular "Trang chủ"
            if (tab.id === 'home') {
              return (
                <div key={tab.id} className="relative flex flex-col items-center justify-end w-16 h-full pb-1">
                  {/* Elevated Circle 58px */}
                  <Link
                    to="/"
                    className="absolute -top-[22px] w-[58px] h-[58px] rounded-full bg-gradient-to-tr from-[#00c6ff] via-[#00e5ff] to-[#22d3ee] flex items-center justify-center border-[3.5px] border-[#0a1120] shadow-[0_0_20px_rgba(0,229,255,0.42)] active:scale-95 transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-300"
                    aria-label="Trang chủ"
                  >
                    <Home className="w-[27px] h-[27px] text-[#090f1d] stroke-[2.3]" />
                  </Link>

                  {/* Label "Trang chủ" positioned below elevated button */}
                  <span className="text-[11px] font-medium text-cyan-400 tracking-tight leading-none mt-auto">
                    Trang chủ
                  </span>
                </div>
              );
            }

            // Tab 5: Hệ sinh thái (Action button opening drawer)
            if (tab.isAction) {
              return (
                <button
                  key={tab.id}
                  onClick={toggleEcosystem}
                  className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg ${
                    active
                      ? 'text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-label="Hệ sinh thái"
                  aria-expanded={isOpen}
                  aria-haspopup="dialog"
                >
                  <TabIcon
                    className={`w-[22px] h-[22px] mb-1 transition-transform duration-200 ${
                      active ? 'scale-110 text-cyan-400' : ''
                    }`}
                  />
                  <span
                    className={`text-[11px] tracking-tight leading-none ${
                      active ? 'font-semibold text-cyan-400' : 'font-normal'
                    }`}
                  >
                    {tab.shortName}
                  </span>
                </button>
              );
            }

            // Standard Navigation Tabs: Đóng góp, About, Blog
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg ${
                  active
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label={tab.name}
              >
                <TabIcon
                  className={`w-[22px] h-[22px] mb-1 transition-transform duration-200 ${
                    active ? 'scale-110 text-cyan-400' : ''
                  }`}
                />
                <span
                  className={`text-[11px] tracking-tight leading-none ${
                    active ? 'font-semibold text-cyan-400' : 'font-normal'
                  }`}
                >
                  {tab.shortName}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
