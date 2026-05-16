import React, { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { X } from 'lucide-react';

interface ScreenshotHelperProps {
  onCapture: (base64String: string) => void;
  onCancel: () => void;
}

export function ScreenshotHelper({ onCapture, onCancel }: ScreenshotHelperProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  // Optional: dim screen first
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < 10 || height < 10) {
      onCancel();
      return;
    }

    setIsCapturing(true);

    // Give React time to re-render and hide the overlay and chat box completely
    setTimeout(async () => {
      try {
        const fullCanvas = await htmlToImage.toCanvas(document.body, {
          cacheBust: true,
          pixelRatio: window.devicePixelRatio,
          filter: (node) => {
            // Exclude the overlay and the AI assistant
            return node.id !== 'screenshot-overlay' && node.id !== 'ai-assistant-container';
          }
        });

        // Now crop it
        const cropCanvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        cropCanvas.width = width * dpr;
        cropCanvas.height = height * dpr;
        
        const ctx = cropCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            fullCanvas,
            (x + window.scrollX) * dpr, // source x
            (y + window.scrollY) * dpr, // source y
            width * dpr, // source width
            height * dpr, // source height
            0, // dest x
            0, // dest y
            cropCanvas.width, // dest width
            cropCanvas.height // dest height
          );
        }

        const dataUrl = cropCanvas.toDataURL('image/png', 0.9);
        onCapture(dataUrl);
      } catch (e) {
        console.error("Screenshot capture failed:", e);
        alert("Lỗi khi chụp màn hình. Có thể do thành phần không được hỗ trợ hoặc lỗi CORS. Vui lòng thử lại vùng khác hoặc tải ảnh trực tiếp.");
        onCancel();
      }
    }, 150); // increased delay to ensure UI is updated before heavy CPU blocking task
  };

  // Calculate box dimensions
  const boxX = Math.min(startPos.x, currentPos.x);
  const boxY = Math.min(startPos.y, currentPos.y);
  const boxW = Math.abs(currentPos.x - startPos.x);
  const boxH = Math.abs(currentPos.y - startPos.y);

  return (
    <div 
      id="screenshot-overlay"
      className={`fixed inset-0 z-[100] ${isCapturing ? 'pointer-events-none' : 'cursor-crosshair touch-none'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {!isCapturing && (
        <>
          {/* Dim background */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Top instructional text */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
            Kéo để chọn vùng chụp
            <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="p-1 hover:bg-white/20 rounded-full ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Render the selection box if drawing */}
          {isDrawing && (
            <div 
              className="absolute border-2 border-primary-500 bg-primary-500/20"
              style={{
                left: boxX,
                top: boxY,
                width: boxW,
                height: boxH
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
