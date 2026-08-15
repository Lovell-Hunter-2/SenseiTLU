import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ClockWidget({ isMobileView = false }: { isMobileView?: boolean }) {
  const [now, setNow] = useState(new Date());
  const [timeSpent, setTimeSpent] = useState(0); 

  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `timeSpent_${today}`;
    const storedTime = parseInt(localStorage.getItem(storageKey) || '0', 10);
    setTimeSpent(storedTime);

    const intervalId = setInterval(() => {
      setNow(new Date());
      setTimeSpent(prev => {
        const next = prev + 1;
        localStorage.setItem(storageKey, next.toString());
        return next; 
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getSeconds = (date: Date) => { 
    return date.getSeconds().toString().padStart(2, '0');
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const formatSpent = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <>
      {isMobileView && (
        <style>
          {`
            .mobile-widget-1 .flower-icon { animation: bounce 3s infinite; }
            .mobile-widget-1 .petals-container { display: block !important; }
            .mobile-widget-2 .cloud-icon-inner { animation: slow-cloud-move 4s ease-in-out infinite alternate; }
            .mobile-widget-2 .sun-icon { animation: slow-sun-rise 4s ease-in-out infinite alternate; }
            .mobile-widget-3 .seed-icon { animation: slow-shrink 4s ease-in-out infinite alternate; }
            .mobile-widget-3 .tree-icon { animation: slow-grow 4s ease-in-out infinite alternate; }

            @keyframes slow-cloud-move {
              0%, 15% { transform: translateX(0); }
              85%, 100% { transform: translateX(-6px); }
            }
            @keyframes slow-sun-rise {
              0%, 15% { opacity: 0; transform: scale(0.5) translate(-8px, 4px) rotate(0deg); }
              85%, 100% { opacity: 1; transform: scale(1) translate(8px, -4px) rotate(12deg); }
            }
            @keyframes slow-grow {
              0%, 15% { transform: scale(0) translateY(8px); opacity: 0; }
              85%, 100% { transform: scale(1.25) translateY(0); opacity: 1; }
            }
            @keyframes slow-shrink {
              0%, 15% { transform: scale(1) translateY(0); opacity: 1; }
              85%, 100% { transform: scale(0) translateY(-8px); opacity: 0; }
            }
          `}
        </style>
      )}
      <div className={isMobileView ? "flex md:hidden justify-between items-stretch gap-1 mb-2 font-mono w-full text-[9px] min-[375px]:text-[10px] min-[400px]:text-xs z-20 relative" : "hidden md:flex items-center gap-2 mr-2 font-mono"}>
         <div className={isMobileView 
            ? "flex flex-1 items-center justify-center gap-1 min-[375px]:gap-1.5 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 py-1.5 rounded-xl min-[375px]:rounded-2xl border border-pink-200 dark:border-pink-800/50 shadow-sm text-pink-700 dark:text-pink-300 font-bold transition-transform cursor-default relative overflow-hidden mobile-widget-1" 
            : "flex items-center gap-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 px-4 py-2 rounded-[20px] border border-pink-200 dark:border-pink-800/50 shadow-sm text-pink-700 dark:text-pink-300 font-bold transition-transform hover:scale-105 cursor-default relative group overflow-hidden"}>
            <span className="relative flex items-center justify-center w-4 h-4 min-[375px]:w-5 min-[375px]:h-5 md:w-5 md:h-5 overflow-visible z-10">
              <span className={`z-10 relative ${isMobileView ? 'text-sm min-[375px]:text-base flower-icon' : 'text-xl group-hover:animate-bounce'}`}>🌸</span>
            </span>
            <div className={`absolute inset-0 pointer-events-none z-0 opacity-60 ${isMobileView ? 'petals-container' : 'hidden group-hover:block'}`}>
              <span className="absolute text-[8px] min-[375px]:text-[10px] md:text-[10px] top-[-15px] left-[10%] animate-petal-fall" style={{ animationDelay: '0s', animationDuration: isMobileView ? '3s' : '1.5s' }}>🌸</span>
              <span className="absolute text-[6px] min-[375px]:text-[8px] md:text-[8px] top-[-15px] left-[40%] animate-petal-fall" style={{ animationDelay: '0.1s', animationDuration: isMobileView ? '4s' : '2s' }}>🌸</span>
              <span className="absolute text-[10px] min-[375px]:text-[12px] md:text-[12px] top-[-15px] left-[70%] animate-petal-fall" style={{ animationDelay: '0.2s', animationDuration: isMobileView ? '3.5s' : '1.7s' }}>🌸</span>
              <span className="absolute text-[8px] min-[375px]:text-[10px] md:text-[10px] top-[-15px] left-[25%] animate-petal-fall" style={{ animationDelay: '0.3s', animationDuration: isMobileView ? '2.8s' : '1.4s' }}>🌸</span>
              <span className="absolute text-[7px] min-[375px]:text-[9px] md:text-[9px] top-[-15px] left-[85%] animate-petal-fall" style={{ animationDelay: '0.1s', animationDuration: isMobileView ? '3.8s' : '1.9s' }}>🌸</span>
              <span className="absolute text-[9px] min-[375px]:text-[11px] md:text-[11px] top-[-15px] left-[55%] animate-petal-fall" style={{ animationDelay: '0.4s', animationDuration: isMobileView ? '3.2s' : '1.6s' }}>🌸</span>
            </div>
            <span className={`z-10 relative ${isMobileView ? 'whitespace-nowrap tracking-tighter min-[375px]:tracking-normal' : 'ml-1 text-[17px] tracking-wider'}`}>{formatTime(now)}</span>
            <span className={`opacity-60 animate-pulse z-10 relative ${isMobileView ? 'text-[8px] min-[375px]:text-[10px] hidden min-[375px]:inline' : 'text-[11px] ml-0.5'}`}>{getSeconds(now)}</span>
         </div>
         
         {isHome && (
           <>
             <div className={isMobileView 
                ? "flex flex-1 items-center justify-center gap-1 min-[375px]:gap-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 py-1.5 rounded-xl min-[375px]:rounded-2xl border border-cyan-200 dark:border-cyan-800/50 shadow-sm text-cyan-700 dark:text-cyan-300 font-bold transition-transform cursor-default mobile-widget-2"
                : "hidden lg:flex items-center gap-2.5 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 px-4 py-2 rounded-[20px] border border-cyan-200 dark:border-cyan-800/50 shadow-sm text-cyan-700 dark:text-cyan-300 font-bold transition-transform hover:scale-105 cursor-default group"}>
                <span className={`relative flex items-center justify-center w-5 h-5 min-[375px]:w-6 min-[375px]:h-6 md:w-6 md:h-6 overflow-visible origin-bottom ${isMobileView ? '' : 'group-hover:animate-sway'}`}>
                  <span className={`absolute z-10 ${isMobileView ? 'text-sm min-[375px]:text-base transition-transform duration-500 cloud-icon-inner' : 'text-[22px] transition-transform duration-500 group-hover:-translate-x-1.5'}`}>☁️</span>
                  <span className={`absolute z-0 opacity-0 scale-50 -translate-x-2 translate-y-1 transition-all duration-500 ease-out ${isMobileView ? 'text-xs min-[375px]:text-sm sun-icon' : 'text-lg group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-3 group-hover:-translate-y-2 group-hover:rotate-12'}`}>☀️</span>
                </span>
                <span className={isMobileView ? "whitespace-nowrap tracking-tighter min-[375px]:tracking-normal" : "text-[17px] tracking-wider"}>{formatDate(now)}</span>
             </div>
                
             <div className={isMobileView
                ? "flex flex-1 items-center justify-center gap-1 min-[375px]:gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 py-1.5 rounded-xl min-[375px]:rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm text-amber-700 dark:text-amber-300 font-bold transition-transform cursor-default mobile-widget-3"
                : "flex items-center gap-2.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 px-4 py-2 rounded-[20px] border border-amber-200 dark:border-amber-800/50 shadow-sm text-amber-700 dark:text-amber-300 font-bold transition-transform hover:scale-105 cursor-default group"} title="Thời gian học hôm nay">
                <span className="relative flex items-center justify-center w-4 h-4 min-[375px]:w-5 min-[375px]:h-5 md:w-6 md:h-6 overflow-visible">
                  <span className={`absolute transition-all duration-700 ease-in-out transform ${isMobileView ? 'text-sm min-[375px]:text-base seed-icon' : 'text-[22px] group-hover:scale-0 group-hover:opacity-0 group-hover:-translate-y-2'}`}>🌱</span>
                  <span className={`absolute transition-all duration-700 ease-in-out transform scale-0 opacity-0 translate-y-2 ${isMobileView ? 'text-sm min-[375px]:text-base tree-icon' : 'text-[24px] group-hover:scale-125 group-hover:opacity-100 group-hover:translate-y-0'}`}>🌳</span>
                </span>
                <span className={isMobileView ? "whitespace-nowrap tracking-tighter min-[375px]:tracking-normal" : "text-[17px] tracking-wider"}>{formatSpent(timeSpent)}</span>
             </div>
           </>
         )}
      </div>
    </>
  );
}
