/**
 * @license
 * Calendar Schedule View
 */

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const CalendarView: React.FC = () => {
  const { tasks, trades, setQuickAddOpen } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyPrefix = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-app-primary">
            Tháng {month + 1}, {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover text-app-secondary border border-app-border cursor-pointer transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover text-app-secondary border border-app-border cursor-pointer transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setQuickAddOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white flex items-center gap-2 shadow-md cursor-pointer ml-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mục Mới</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel p-5 rounded-2xl border border-app-border">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-app-muted mb-3 uppercase tracking-wider">
          <span>CN</span>
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyPrefix.map((i) => (
            <div key={`empty-${i}`} className="h-28 rounded-xl bg-app-surface/30 border border-transparent"></div>
          ))}

          {daysArray.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
            const dayTrades = trades.filter((t) => t.closeTime.startsWith(dateStr));
            const dayPnl = dayTrades.reduce((acc, curr) => acc + curr.netPnl, 0);

            return (
              <div
                key={day}
                className="h-28 p-2 rounded-xl bg-app-card border border-app-border hover:border-indigo-500/40 flex flex-col justify-between text-xs overflow-hidden transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-app-primary">{day}</span>
                  {dayTrades.length > 0 && (
                    <span
                      className={`font-mono text-[9px] font-bold ${
                        dayPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {dayPnl >= 0 ? '+' : ''}${Math.round(dayPnl)}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto custom-scrollbar">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[9px] truncate border border-indigo-500/20 font-medium"
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
