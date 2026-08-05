/**
 * @license
 * Habit Tracker View (Streaks, Grid, Heatmap, Creation)
 */

import React, { useState } from 'react';
import { Activity, Plus, Flame, Award, CheckCircle2, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const HabitsView: React.FC = () => {
  const { habits, toggleHabitLog, addHabit, deleteHabit } = useAppStore();
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Sức khỏe');

  const todayStr = new Date().toISOString().split('T')[0];

  // Past 14 days
  const pastDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit({
      title: newTitle.trim(),
      category: newCategory,
      icon: 'Activity',
      color: '#10b981',
      targetPerWeek: 7,
    });
    setNewTitle('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>Theo Dõi Thói Quen (Habit Tracker)</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Xây dựng kỷ luật tự giác mỗi ngày. Nhấn vào từng ngày để tích điểm Streak.
          </p>
        </div>
      </div>

      {/* Add Habit Form Inline */}
      <form onSubmit={handleCreateHabit} className="glass-panel p-4 rounded-2xl border border-app-border flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Tên thói quen mới (Ví dụ: Uống 2L nước, Thiền định 15p...)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl input-themed text-xs text-app-primary"
        />

        <input
          type="text"
          placeholder="Danh mục"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="w-full sm:w-36 px-3 py-2 rounded-xl input-themed text-xs text-app-primary"
        />

        <button
          type="submit"
          className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mới</span>
        </button>
      </form>

      {/* Habits Grid */}
      <div className="space-y-4">
        {habits.map((habit) => {
          return (
            <div key={habit.id} className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-app-primary text-sm">{habit.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-app-muted mt-0.5">
                    <span>{habit.category}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-emerald-500" />
                      Streak: {habit.streak} ngày
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 rounded-xl hover:bg-rose-500/10 text-app-muted hover:text-rose-500 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Past 14 Days Toggles */}
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                {pastDays.map((dayStr) => {
                  const isDone = habit.logs[dayStr];
                  const dObj = new Date(dayStr);
                  const dayNum = dObj.getDate();

                  return (
                    <button
                      key={dayStr}
                      onClick={() => toggleHabitLog(habit.id, dayStr)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 text-white font-bold border-emerald-500 shadow-md'
                          : 'bg-app-surface border-app-border text-app-muted hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="text-[10px] opacity-80">{dayNum}</span>
                      <span className="text-xs">{isDone ? '✓' : '•'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
