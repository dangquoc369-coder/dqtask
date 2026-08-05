/**
 * @license
 * Interactive Pomodoro Focus Timer
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, Timer, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';

export const PomodoroModal: React.FC = () => {
  const { isPomodoroOpen, setPomodoroOpen, activePomodoroTask, updateTask } = useAppStore();
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (activePomodoroTask) {
        updateTask(activePomodoroTask.id, {
          actualMinutes: (activePomodoroTask.actualMinutes || 0) + (mode === 'work' ? 25 : 5),
        });
      }
      if (mode === 'work') {
        setMode('break');
        setSecondsLeft(5 * 60);
      } else {
        setMode('work');
        setSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, mode, activePomodoroTask, updateTask]);

  if (!isPomodoroOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = mode === 'work' ? ((25 * 60 - secondsLeft) / (25 * 60)) * 100 : ((5 * 60 - secondsLeft) / (5 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-overlay backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-app-modal border border-app-border rounded-3xl shadow-2xl overflow-hidden p-6 text-center relative">
        {/* Close */}
        <button
          onClick={() => setPomodoroOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-app-surface-secondary text-app-muted hover:text-app-primary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold mb-6 border border-indigo-500/20">
          <Timer className="w-4 h-4" />
          <span>{mode === 'work' ? 'Phiên Tập Trung (Deep Work)' : 'Nghỉ Giải Lao (Short Break)'}</span>
        </div>

        {activePomodoroTask && (
          <div className="mb-4 text-xs font-medium text-app-secondary bg-app-surface-secondary p-2.5 rounded-xl border border-app-border">
            Đang thực hiện: <b className="text-indigo-500">{activePomodoroTask.title}</b>
          </div>
        )}

        {/* Timer Ring / Display */}
        <div className="relative w-56 h-56 mx-auto my-6 flex items-center justify-center rounded-full bg-app-surface border-4 border-indigo-500/20 shadow-inner">
          <div className="text-center">
            <span className="text-5xl font-mono font-extrabold text-app-primary tracking-wider">
              {timeStr}
            </span>
            <p className="text-xs text-app-muted mt-2 font-medium">
              {isRunning ? '🔥 Đang chạy...' : '⏸ Tạm dừng'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(mode === 'work' ? 25 * 60 : 5 * 60);
            }}
            className="p-3 rounded-2xl bg-app-surface-secondary hover:bg-app-card-hover text-app-secondary transition-all cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Tạm Dừng' : 'Bắt Đầu Tập Trung'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
