import React, { useState, useEffect, useRef } from 'react';
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
  
  // Vị trí mặc định ở góc trên cùng bên phải (dưới header)
  const padding = 16;
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 64 - padding : 300, 
    y: 80 
  });
  const isDragging = useRef(false);

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
    
    // Xử lý resize window, đảm bảo mascot không bị rơi ra ngoài màn hình
    const handleResize = () => {
       setPosition(prev => {
          const mascotWidth = 64;
          const mascotHeight = 80;
          let newX = Math.max(padding, Math.min(prev.x, window.innerWidth - mascotWidth - padding));
          let newY = Math.max(padding, Math.min(prev.y, window.innerHeight - mascotHeight - padding));
          return { x: newX, y: newY };
       });
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggle);
      window.removeEventListener('ping-ai-assistant', handlePing);
      window.removeEventListener('resize', handleResize);
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

  const handleDragEnd = (e: any, info: any) => {
    setTimeout(() => { isDragging.current = false; }, 100);
    
    const mascotWidth = 64;
    const mascotHeight = 80;
    
    // Vị trí sau khi kéo (sử dụng info.point thay cho offset vì element được dịch chuyển fixed layout top-0 left-0)
    // Thực ra với motion framer khi binding x/y, animate tự duy trì vị trí tuyệt đối. 
    // offset chỉ là mức dịch chuyển trong 1 lần kéo.
    let currentX = position.x + info.offset.x;
    let currentY = position.y + info.offset.y;

    // Khoảng cách tới các cạnh màn hình
    const distLeft = currentX;
    const distRight = window.innerWidth - (currentX + mascotWidth);
    const distTop = currentY;
    const distBottom = window.innerHeight - (currentY + mascotHeight);

    // Tìm cạnh gần nhất
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    let snapX = currentX;
    let snapY = currentY;

    if (minDist === distLeft) {
      snapX = padding;
    } else if (minDist === distRight) {
      snapX = window.innerWidth - mascotWidth - padding;
    } else if (minDist === distTop) {
      snapY = padding;
    } else if (minDist === distBottom) {
      snapY = window.innerHeight - mascotHeight - padding;
    }
    
    // Đảm bảo không bị lọt ra ngoài màn hình ở trục còn lại
    snapX = Math.max(padding, Math.min(snapX, window.innerWidth - mascotWidth - padding));
    snapY = Math.max(padding, Math.min(snapY, window.innerHeight - mascotHeight - padding));

    setPosition({ x: snapX, y: snapY });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging.current) return;
    setIsMinimized(false);
  };

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
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: ping ? 1.2 : 1, 
              opacity: 1,
              x: position.x,
              y: position.y
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed z-50 top-0 left-0 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 group"
            style={{ touchAction: 'none' }}
          >
            {/* Nút đóng mascot - chỉ hiện khi hover */}
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
            >
              <span className="text-[10px] font-bold">✕</span>
            </button>

            <button
              onClick={handleClick}
              className="w-12 h-12 bg-white dark:bg-slate-800 border-2 border-blue-500 text-white rounded-full shadow-lg flex items-center justify-center relative shadow-blue-500/30 ring-4 ring-white dark:ring-slate-900 transition-transform hover:scale-105"
            >
              <img src="/avt_tlu (remove).png" alt="AI" className="w-[38px] h-[38px] object-contain rounded-b-xl drop-shadow-sm scale-110" />
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
