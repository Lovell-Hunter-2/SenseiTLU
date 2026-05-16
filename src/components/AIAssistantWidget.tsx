import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

// Global state using events so the layout header can trigger it
export const toggleAIAssistant = () => {
  const event = new CustomEvent('toggle-ai-assistant');
  window.dispatchEvent(event);
};

export const pingAIAssistant = () => {
  const event = new CustomEvent('ping-ai-assistant');
  window.dispatchEvent(event);
};

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [ping, setPing] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    const handlePing = () => {
      if (!isMinimized && isOpen) {
        setPing(true);
        setTimeout(() => setPing(false), 1000);
      } else {
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    window.addEventListener('toggle-ai-assistant', handleToggle);
    window.addEventListener('ping-ai-assistant', handlePing);
    
    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggle);
      window.removeEventListener('ping-ai-assistant', handlePing);
    };
  }, [isOpen, isMinimized]);

  if (!isOpen && !isMinimized) {
    // Hidden initially until triggered by a top level component (or if you want it always visible, set isMinimized=true by default)
  }

  // Khởi tạo luôn chạy nhưng thu nhỏ dưới dạng Mascot
  useEffect(() => {
    // Có thể mặc định bật mascot
    setIsMinimized(true);
    setIsOpen(true);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <AIAssistant 
            isVisible={true} 
            onClose={() => setIsOpen(false)} 
            onMinimize={() => setIsMinimized(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            drag
            dragConstraints={{ top: 0, left: 0, right: window.innerWidth - 60, bottom: window.innerHeight - 60 }}
            dragElastic={0.2}
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: ping ? 1.2 : 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed z-50 bottom-6 right-6 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 group"
            style={{ touchAction: 'none' }}
          >
            {/* Nút đóng mascot - chỉ hiện khi hover */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
            >
              <span className="text-[10px] font-bold">✕</span>
            </button>

            <button
              onClick={() => setIsMinimized(false)}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center relative shadow-blue-500/30 ring-4 ring-white dark:ring-slate-900 transition-transform hover:scale-105"
            >
              <Sparkles className="w-6 h-6" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-full bg-white opacity-20"
              />
            </button>
            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-90 shadow-sm pointer-events-none">
              AI
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
