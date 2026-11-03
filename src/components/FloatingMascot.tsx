import React, { useState, useEffect, useRef } from 'react';
import { Minus } from 'lucide-react';
import Mascot3D from './Mascot3D';

interface FloatingMascotProps {
  onSupportClick?: () => void;
}

export const FloatingMascot: React.FC<FloatingMascotProps> = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const mascotRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const MASCOT_WIDTH = 72;
  const MASCOT_HEIGHT = 72;
  const TOP_NAV_HEIGHT = 68; // Chiều cao thanh header trên
  const BOTTOM_NAV_HEIGHT = 78; // Chiều cao thanh tab dưới điện thoại
  const EDGE_MARGIN = 10; // Khoảng cách khi áp sát cạnh viền

  // Khởi tạo vị trí ban đầu (góc phải bên dưới, trên tab bar)
  useEffect(() => {
    const initPos = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const initX = screenW - MASCOT_WIDTH - EDGE_MARGIN;
      const initY = screenH - BOTTOM_NAV_HEIGHT - MASCOT_HEIGHT - 14;
      setPosition({ x: initX, y: initY });
    };

    initPos();

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const maxY = screenH - BOTTOM_NAV_HEIGHT - MASCOT_HEIGHT - EDGE_MARGIN;
        const clampedY = Math.max(TOP_NAV_HEIGHT + EDGE_MARGIN, Math.min(prev.y, maxY));
        // Áp sát vào cạnh gần nhất khi đổi kích thước màn hình
        const clampedX =
          prev.x + MASCOT_WIDTH / 2 < screenW / 2
            ? EDGE_MARGIN
            : screenW - MASCOT_WIDTH - EDGE_MARGIN;
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!position) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragDataRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent | MouseEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - dragDataRef.current.startX;
      const deltaY = clientY - dragDataRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 6) {
        dragDataRef.current.hasMoved = true;
      }

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Giới hạn trong phạm vi 2 cạnh bên và nằm giữa header trên + tabbar dưới
      const minX = 4;
      const maxX = screenW - MASCOT_WIDTH - 4;
      const minY = TOP_NAV_HEIGHT + 6;
      const maxY = screenH - BOTTOM_NAV_HEIGHT - MASCOT_HEIGHT - 6;

      const rawX = dragDataRef.current.initialX + deltaX;
      const rawY = dragDataRef.current.initialY + deltaY;

      setPosition({
        x: Math.max(minX, Math.min(rawX, maxX)),
        y: Math.max(minY, Math.min(rawY, maxY)),
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);

      // Thao tác thả ngón tay: Tự động hít nam châm (snap) vào cạnh viền gần nhất
      setPosition((prev) => {
        if (!prev) return prev;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const isCloserToLeft = prev.x + MASCOT_WIDTH / 2 < screenW / 2;
        const snappedX = isCloserToLeft ? EDGE_MARGIN : screenW - MASCOT_WIDTH - EDGE_MARGIN;

        const minY = TOP_NAV_HEIGHT + 6;
        const maxY = screenH - BOTTOM_NAV_HEIGHT - MASCOT_HEIGHT - 6;
        const clampedY = Math.max(minY, Math.min(prev.y, maxY));

        return { x: snappedX, y: clampedY };
      });
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousemove', handleTouchMove);
    window.addEventListener('mouseup', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleTouchMove);
      window.removeEventListener('mouseup', handleTouchEnd);
    };
  }, [isDragging]);

  const handleMascotClick = (e: React.MouseEvent) => {
    // Nếu người dùng vừa kéo thả thì không kích hoạt mở link
    if (dragDataRef.current.hasMoved) {
      e.preventDefault();
      return;
    }
    window.open('https://www.facebook.com/lovelltitussof1910', '_blank', 'noopener,noreferrer');
  };

  if (!isVisible || !position) return null;

  return (
    <div
      ref={mascotRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.18, 0.89, 0.32, 1.25)',
        width: `${MASCOT_WIDTH}px`,
        height: `${MASCOT_HEIGHT}px`,
        touchAction: 'none',
      }}
      className="fixed top-0 left-0 z-40 md:hidden select-none cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onMouseDown={handleTouchStart}
    >
      <div className="relative w-full h-full">
        {/* Nút dấu trừ (-) để người dùng loại bỏ mascot */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute -top-1.5 -right-1.5 z-50 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white p-1 rounded-full shadow-lg border border-slate-700/60 active:scale-90 transition-transform cursor-pointer"
          aria-label="Ẩn mascot"
          title="Ẩn mascot"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Mascot 3D dạng mini */}
        <div
          onClick={handleMascotClick}
          className="w-full h-full cursor-pointer flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] active:scale-105 transition-transform"
          title="Cần hỗ trợ? Nhấn vào đây!"
        >
          <div className="w-[72px] h-[72px] pointer-events-none">
            <Mascot3D className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingMascot;
