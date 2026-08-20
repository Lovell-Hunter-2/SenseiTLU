import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ECOSYSTEM_ICONS, ECOSYSTEM_COLORS } from './EcosystemManagerModal';

export default function EcosystemDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "ecosystem"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApps(appsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
      >
        Hệ sinh thái
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-4 w-[320px] md:w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 origin-top-left md:origin-top-right">
          <div className="mb-4 px-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" /> Hệ sinh thái
            </h3>
            <p className="text-sm text-slate-500 mt-1">Các tiện ích và ứng dụng thuộc hệ sinh thái của chúng tôi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apps.length === 0 ? (
              <div className="col-span-2 text-center py-6 text-slate-500 text-sm italic">
                Đang cập nhật ứng dụng...
              </div>
            ) : (
              apps.map(app => {
                const Icon = ECOSYSTEM_ICONS[app.iconName] || Globe;
                const theme = ECOSYSTEM_COLORS.find(c => c.id === app.colorTheme) || ECOSYSTEM_COLORS[0];
                return (
                  <a
                    key={app.id}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group block p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${theme.classes} hover:shadow-md relative overflow-hidden`}
                  >
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-current to-transparent" style={{ backgroundSize: '12px 12px', backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)' }} />
                    
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-slate-950/40 flex items-center justify-center mb-3 shadow-sm border border-white/20 dark:border-black/20 group-hover:rotate-6 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base mb-1 truncate">{app.name}</h4>
                      <p className="text-xs opacity-80 line-clamp-2 leading-relaxed">{app.description}</p>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
