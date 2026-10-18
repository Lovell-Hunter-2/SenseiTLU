import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Check } from 'lucide-react';
import {
  AdminTabId,
  ADMIN_NAV_ITEMS,
  ADMIN_GROUPS,
  ADMIN_GROUP_COLORS,
  AdminNavItem,
  AdminGroupName,
} from './adminNavigationConfig';

interface AdminMobileNavProps {
  activeTab: AdminTabId;
  onTabChange: (tabId: AdminTabId) => void;
  reportsCount?: number;
  errorsCount?: number;
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({
  activeTab,
  onTabChange,
  reportsCount = 0,
  errorsCount = 0,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sheetCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // References for horizontal chip elements to enable scrollIntoView({ inline: 'center' })
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Find currently active item
  const currentItem =
    ADMIN_NAV_ITEMS.find((item) => item.id === activeTab) || ADMIN_NAV_ITEMS[0];
  const currentGroupColor = ADMIN_GROUP_COLORS[currentItem.group];

  const getBadgeCount = (item: AdminNavItem): number => {
    if (item.badgeKey === 'reports') return reportsCount;
    if (item.badgeKey === 'errors') return errorsCount;
    return 0;
  };

  // Auto-scroll active chip into center whenever activeTab changes
  useEffect(() => {
    const activeChipElement = chipRefs.current.get(activeTab);
    if (activeChipElement) {
      activeChipElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeTab]);

  // Handle Escape key to close bottom sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSheetOpen) {
        handleCloseSheet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSheetOpen]);

  const handleOpenSheet = () => {
    if (sheetCloseTimeoutRef.current) {
      clearTimeout(sheetCloseTimeoutRef.current);
      sheetCloseTimeoutRef.current = null;
    }
    setIsClosing(false);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    if (!isSheetOpen && !isClosing) return;
    setIsClosing(true);
    sheetCloseTimeoutRef.current = setTimeout(() => {
      setIsSheetOpen(false);
      setIsClosing(false);
      sheetCloseTimeoutRef.current = null;
    }, 280);
  };

  const handleSelectTab = (tabId: AdminTabId) => {
    onTabChange(tabId);
    handleCloseSheet();
    // Scroll window to top as required
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="md:hidden sticky top-16 z-30 w-full">
      {/* 1. Sticky Header */}
      <div className="bg-[#0a1120]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">
            {currentItem.label}
          </h1>
          <p
            className="text-[12px] font-medium leading-tight mt-0.5"
            style={{ color: currentGroupColor }}
          >
            {currentItem.group}
          </p>
        </div>

        <button
          onClick={handleOpenSheet}
          className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-white hover:border-cyan-500/60 active:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Tất cả mục quản trị"
          aria-haspopup="dialog"
          aria-expanded={isSheetOpen}
        >
          <Menu className="w-4 h-4 text-cyan-400" />
          <span>Tất cả mục</span>
        </button>
      </div>

      {/* 2. Horizontal Chip Strip */}
      <div
        className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-[#0b1324]/90 backdrop-blur-xs"
        role="tablist"
        aria-label="Thanh chọn nhanh mục quản trị"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const isSelected = activeTab === item.id;
          const groupColor = ADMIN_GROUP_COLORS[item.group];
          const badgeCount = getBadgeCount(item);

          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) chipRefs.current.set(item.id, el);
                else chipRefs.current.delete(item.id);
              }}
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleSelectTab(item.id)}
              className="min-h-[38px] rounded-full px-3.5 py-1.5 flex items-center gap-2 shrink-0 text-xs transition-all duration-200 select-none cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
              style={{
                backgroundColor: isSelected
                  ? groupColor
                  : 'rgba(15, 23, 42, 0.65)',
                color: isSelected ? '#090f1d' : '#cbd5e1',
                border: isSelected
                  ? `1px solid ${groupColor}`
                  : `1px solid color-mix(in srgb, ${groupColor} 40%, transparent)`,
                boxShadow: isSelected
                  ? `0 0 14px color-mix(in srgb, ${groupColor} 40%, transparent)`
                  : 'none',
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              {/* 8px Dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-colors"
                style={{
                  backgroundColor: isSelected ? '#090f1d' : groupColor,
                }}
              />

              {/* Label */}
              <span className="whitespace-nowrap">{item.label}</span>

              {/* Red Badge for pending reports / error logs */}
              {badgeCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shrink-0 shadow-xs">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Bottom Sheet Modal */}
      {(isSheetOpen || isClosing) && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ${
              isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onClick={handleCloseSheet}
            aria-hidden="true"
          />

          {/* Sliding Sheet Panel */}
          <div
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[80vh] flex flex-col bg-[#0c1427] border-t border-slate-700/80 rounded-t-[20px] shadow-2xl overflow-hidden transition-transform duration-300 motion-reduce:transition-none ease-[cubic-bezier(.2,.8,.2,1)] ${
              isClosing ? 'translate-y-full' : 'translate-y-0'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Danh mục quản trị"
          >
            {/* Top Pull Handle */}
            <div className="pt-3 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-slate-600/70 mx-auto" />
            </div>

            {/* Sheet Title Bar */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  Danh mục quản trị
                </span>
                <span className="text-xs text-slate-400">
                  ({ADMIN_NAV_ITEMS.length} mục)
                </span>
              </div>
              <button
                onClick={handleCloseSheet}
                className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-center"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Groups & Items */}
            <div className="overflow-y-auto px-4 py-4 space-y-5 flex-1 pb-[calc(24px+env(safe-area-inset-bottom))]">
              {ADMIN_GROUPS.map((groupName) => {
                const groupColor = ADMIN_GROUP_COLORS[groupName];
                const groupItems = ADMIN_NAV_ITEMS.filter(
                  (item) => item.group === groupName
                );

                return (
                  <div key={groupName} className="space-y-2">
                    {/* Group Title */}
                    <div className="px-1 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: groupColor }}
                      />
                      <h3
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: groupColor }}
                      >
                        {groupName}
                      </h3>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-1.5">
                      {groupItems.map((item) => {
                        const isSelected = activeTab === item.id;
                        const badgeCount = getBadgeCount(item);
                        const ItemIcon = item.icon;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-all duration-150 border-l-[3px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
                            style={{
                              borderLeftColor: groupColor,
                              backgroundColor: isSelected
                                ? `color-mix(in srgb, ${groupColor} 18%, transparent)`
                                : 'rgba(15, 23, 42, 0.4)',
                              color: isSelected ? groupColor : '#e2e8f0',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <ItemIcon
                                className="w-4 h-4 shrink-0"
                                style={{
                                  color: isSelected ? groupColor : '#94a3b8',
                                }}
                              />
                              <span
                                className={`text-sm ${
                                  isSelected ? 'font-bold' : 'font-medium'
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {badgeCount > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center leading-none">
                                  {badgeCount}
                                </span>
                              )}
                              {isSelected && (
                                <Check
                                  className="w-4 h-4"
                                  style={{ color: groupColor }}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMobileNav;
