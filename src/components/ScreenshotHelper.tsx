import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
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
      // Too small, ignore
      return;
    }

    setIsCapturing(true);

    try {
      // Small delay to allow the overlay to hide if we want it to, 
      // but if we do this, React needs to unmount this overlay, meaning we shouldn't render the dark bg while capturing.
      // So we can hide the dark bg in UI based on isCapturing state.
      setTimeout(async () => {
        const canvas = await html2canvas(document.body, {
          x: x + window.scrollX,
          y: y + window.scrollY,
          width,
          height,
          useCORS: true,
          scale: window.devicePixelRatio, // keep good quality
          ignoreElements: (element) => {
             return element.id === 'screenshot-overlay';
          }
        });
        const dataUrl = canvas.toDataURL('image/png');
        onCapture(dataUrl);
      }, 50); // delay let state update
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  // Calculate box dimensions
  const boxX = Math.min(startPos.x, currentPos.x);
  const boxY = Math.min(startPos.y, currentPos.y);
  const boxW = Math.abs(currentPos.x - startPos.x);
  const boxH = Math.abs(currentPos.y - startPos.y);

  return (
    <div 
      id="screenshot-overlay"
      className="fixed inset-0 z-[100] cursor-crosshair touch-none"
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
