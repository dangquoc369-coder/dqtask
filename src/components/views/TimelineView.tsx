/**
 * @license
 * Daily Timeline Schedule View
 */

import React from 'react';
import { Clock, Plus, Timer, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const TimelineView: React.FC = () => {
  const { tasks, setQuickAddOpen, setActivePomodoroTask } = useAppStore();

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span>Dòng Thời Gian (Timeline Schedule)</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Lịch trình công việc phân bổ theo khung giờ trong ngày.
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Task Mới</span>
        </button>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-4">
        {timeSlots.map((slot) => {
          const matchedTasks = tasks.filter((t) => t.dueTime && t.dueTime.startsWith(slot.substring(0, 2)));

          return (
            <div key={slot} className="flex gap-4 items-start border-b border-app-border/60 pb-3">
              <span className="w-14 text-xs font-mono font-bold text-indigo-500 shrink-0 pt-1">
                {slot}
              </span>

              <div className="flex-1 space-y-2">
                {matchedTasks.length === 0 ? (
                  <div className="h-8 border border-dashed border-app-border rounded-lg flex items-center px-3 text-[11px] text-app-muted">
                    Trống
                  </div>
                ) : (
                  matchedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-app-card border border-indigo-500/30 flex items-center justify-between text-xs shadow-sm"
                    >
                      <div>
                        <span className="font-bold text-app-primary">{t.title}</span>
                        <span className="text-[10px] text-app-muted block">{t.category} • {t.estimateMinutes}m</span>
                      </div>
                      <button
                        onClick={() => setActivePomodoroTask(t)}
                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors"
                      >
                        <Timer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
