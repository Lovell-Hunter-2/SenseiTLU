import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Languages } from 'lucide-react';
import { pingAIAssistant, toggleAIAssistant } from './AIAssistantWidget';

export function TextSelectionHelper() {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        
        if (text && text.length > 5 && sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setSelection({
            text,
            x: rect.left + rect.width / 2,
            y: rect.top - 40 // above selection
          });
        } else {
          setSelection(null);
        }
      }, 10);
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || !sel.toString().trim()) {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleAction = (action: 'explain' | 'translate') => {
    if (!selection) return;
    
    // Open AI Assistant
    toggleAIAssistant();
    pingAIAssistant();
    
    // Delay to allow AI Assistant to open, then fire a custom event or just dispatch to window for AI Assistant to pick up
    // Wait, the easiest way is to dispatch a custom event with the text
    const prompt = action === 'explain' 
      ? `Giải thích đoạn văn bản này giúp mình:\n"${selection.text}"`
      : `Dịch đoạn văn bản này sang tiếng Việt giúp mình:\n"${selection.text}"`;
      
    window.dispatchEvent(new CustomEvent('ai-assistant-fill', { detail: prompt }));
    
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="fixed z-[60] flex gap-1 bg-slate-900 border border-slate-700 shadow-2xl p-1 rounded-lg"
          style={{
            left: Math.min(Math.max(10, selection.x - 70), window.innerWidth - 150),
            top: Math.max(10, selection.y)
          }}
        >
          <button
            onClick={() => handleAction('explain')}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 rounded-md text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Giải thích
          </button>
          <div className="w-px bg-slate-700 my-1" />
          <button
            onClick={() => handleAction('translate')}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 rounded-md text-white text-xs font-medium transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-orange-400" />
            Dịch
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
