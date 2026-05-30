import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Volume2, VolumeX, Minus } from 'lucide-react';

type Mode = 'work' | 'break';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

interface PomodoroWidgetProps {
  variant?: 'floating' | 'fixed';
  position?: 'bottom-left' | 'top-right';
}

export function PomodoroWidget({ variant = 'floating', position = 'bottom-left' }: PomodoroWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cycles, setCycles] = useState(0);

  // Audio references
  const workAlarmRef = useRef<HTMLAudioElement | null>(null);
  const breakAlarmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We create simple bubble sounds for alarms
    workAlarmRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
    breakAlarmRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_7ce860e61d.mp3?filename=ui-bubble-109677.mp3');
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Switch mode
      if (!isMuted) {
        if (mode === 'work') {
          breakAlarmRef.current?.play().catch(e => console.log(e));
        } else {
          workAlarmRef.current?.play().catch(e => console.log(e));
        }
      }

      if (mode === 'work') {
        setCycles(c => c + 1);
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        setMode('work');
        setTimeLeft(WORK_TIME);
      }
      // Auto pause when switching
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, isMuted]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = mode === 'work' ? WORK_TIME : BREAK_TIME;
    return ((total - timeLeft) / total) * 100;
  };

  const positionClass = position === 'bottom-left' ? 'bottom-6 left-6' : 'top-6 right-6';

  return (
    <>
      {/* Floating Button / Mini Widget */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClass} z-40 flex items-center justify-center p-3 sm:p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            mode === 'work' 
              ? 'bg-rose-500 text-white hover:bg-rose-600' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
          title="Mở Góc Pomodoro"
        >
          {isRunning && <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          <div className="flex items-center justify-center gap-2">
            {mode === 'work' ? <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /> : <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />}
            <span className="font-mono font-bold hidden sm:inline">{formatTime(timeLeft)}</span>
          </div>
        </button>
      )}

      {/* Expanded Widget Panel */}
      {isOpen && (
        <div className={`fixed ${positionClass} z-40 w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          position === 'bottom-left' ? 'slide-in-from-bottom-4' : 'slide-in-from-top-4'
        }`}>
          {/* Header */}
          <div className={`py-3 px-4 flex items-center justify-between text-white ${mode === 'work' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
            <div className="flex items-center gap-2">
              {mode === 'work' ? <BookOpen className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              <span className="font-bold text-sm">Góc Pomodoro</span>
            </div>
            <button onClick={() => setIsOpen(false)} title="Thu nhỏ" className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-6 flex flex-col items-center relative">
             <button title="Âm thanh nhắc nhở" onClick={() => setIsMuted(!isMuted)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
               {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
             </button>

            {/* Circular Progress (Simplified styling) */}
            <div className="relative w-32 h-32 flex flex-col items-center justify-center mt-2 group">
              <svg className="w-32 h-32 transform -rotate-90 absolute top-0 left-0">
                <circle 
                  cx="64" cy="64" r="60" strokeWidth="8" stroke="currentColor" fill="transparent" 
                  className="text-slate-100 dark:text-slate-800" 
                />
                <circle 
                  cx="64" cy="64" r="60" strokeWidth="8" stroke="currentColor" fill="transparent"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * getProgress()) / 100}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-linear ${mode === 'work' ? 'text-rose-500' : 'text-emerald-500'}`} 
                />
              </svg>
              <span className={`text-4xl font-black font-mono tracking-tighter z-10 ${mode === 'work' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                {mode === 'work' ? 'Ôn Thi' : 'Nghỉ Ngơi'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={resetTimer}
                className="w-12 h-12 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Làm mới"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleTimer}
                className={`w-16 h-16 flex items-center justify-center text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition active:scale-95 ${
                  mode === 'work' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-1" />}
              </button>
              
              <button 
                onClick={() => {
                  setTimeLeft(mode === 'work' ? BREAK_TIME : WORK_TIME);
                  setMode(mode === 'work' ? 'break' : 'work');
                  setIsRunning(false);
                }}
                className="w-12 h-12 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition font-bold"
                title="Chuyển chế độ"
              >
                ⏭
              </button>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-1 w-full text-sm text-slate-500">
               <span className="font-medium text-slate-700 dark:text-slate-300">🔥 Đã hoàn thành:</span>
               <span className="font-black text-rose-500">{cycles}</span> 
               <span>chu kỳ Pomodoro</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
