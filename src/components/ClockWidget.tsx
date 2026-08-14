import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ClockWidget() {
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
    <div className={`hidden md:flex items-center gap-2 mr-2 font-mono`}>
       <div className="flex items-center gap-1.5 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 px-3 py-1.5 rounded-2xl border border-pink-200 dark:border-pink-800/50 shadow-sm text-pink-700 dark:text-pink-300 font-bold transition-transform hover:scale-105 cursor-default relative overflow-hidden group">
                    <span className="relative flex items-center justify-center w-5 h-5 overflow-visible">
            <span className="text-base group-hover:animate-bounce z-10 relative">🌸</span>
            <div className="absolute inset-0 pointer-events-none -inset-4 overflow-hidden z-0 hidden group-hover:block">
              <span className="absolute text-[8px] top-[-5px] left-[20%] animate-petal-fall" style={{ animationDelay: '0.1s', animationDuration: '2.2s' }}>🌸</span>
              <span className="absolute text-[10px] top-[-10px] left-[50%] animate-petal-fall" style={{ animationDelay: '0.4s', animationDuration: '1.8s' }}>🌸</span>
              <span className="absolute text-[8px] top-[0px] left-[80%] animate-petal-fall" style={{ animationDelay: '0.7s', animationDuration: '2.5s' }}>🌸</span>
              <span className="absolute text-[12px] top-[-15px] left-[35%] animate-petal-fall" style={{ animationDelay: '1.2s', animationDuration: '2s' }}>🌸</span>
              <span className="absolute text-[9px] top-[-5px] left-[70%] animate-petal-fall" style={{ animationDelay: '0.5s', animationDuration: '2.1s' }}>🌸</span>
            </div>
          </span>
          <span className="ml-1">{formatTime(now)}</span>
          <span className="text-xs opacity-60 animate-pulse">{getSeconds(now)}</span>
       </div>
       
       {isHome && (
         <>
           <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 px-3 py-1.5 rounded-2xl border border-cyan-200 dark:border-cyan-800/50 shadow-sm text-cyan-700 dark:text-cyan-300 font-bold transition-transform hover:scale-105 cursor-default group">
                            <span className="relative flex items-center justify-center w-5 h-5 overflow-visible">
                <span className="absolute transition-all duration-700 ease-in-out z-10 text-base group-hover:animate-sway origin-bottom group-hover:-translate-x-1">☁️</span>
                <span className="absolute transition-all duration-700 ease-in-out transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-x-2 group-hover:-translate-y-1 text-sm z-0">☀️</span>
              </span>
              <span>{formatDate(now)}</span>
           </div>
           
           <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 px-3 py-1.5 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm text-amber-700 dark:text-amber-300 font-bold transition-transform hover:scale-105 cursor-default group" title="Thời gian học hôm nay">
              <span className="relative flex items-center justify-center w-5 h-5 overflow-visible">
                <span className="absolute transition-all duration-700 ease-in-out transform group-hover:scale-0 group-hover:opacity-0 group-hover:-translate-y-2">🌱</span>
                <span className="absolute transition-all duration-700 ease-in-out transform scale-0 opacity-0 translate-y-2 group-hover:scale-125 group-hover:opacity-100 group-hover:translate-y-0">🌳</span>
              </span>
              <span className="tracking-wider">{formatSpent(timeSpent)}</span>
           </div>
         </>
       )}
    </div>
  );
}
