/**
 * @license
 * Eisenhower Matrix Prioritization View (4 Quadrants)
 */

import React from 'react';
import { Grid2X2, Plus, Flame, Calendar, UserCheck, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const EisenhowerMatrixView: React.FC = () => {
  const { tasks, toggleTaskCompleted, setQuickAddOpen } = useAppStore();

  const doFirst = tasks.filter((t) => t.priority === 'urgent' && !t.completed);
  const schedule = tasks.filter((t) => t.priority === 'high' && !t.completed);
  const delegate = tasks.filter((t) => t.priority === 'medium' && !t.completed);
  const eliminate = tasks.filter((t) => t.priority === 'low' && !t.completed);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Grid2X2 className="w-5 h-5 text-indigo-500" />
            <span>Ma Trận Eisenhower (Eisenhower Matrix)</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Phân loại công việc theo mức độ Khẩn Cấp & Cấp Thiết để tối ưu hóa hiệu suất mỗi ngày.
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Task Mới</span>
        </button>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Q1: Urgent & Important (Do First) */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 min-h-[280px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-500/20">
            <h3 className="font-bold text-rose-500 text-xs uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Q1: LÀM NGAY (Khẩn Cấp & Quan Trọng)</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 font-bold text-[10px]">
              {doFirst.length}
            </span>
          </div>

          <div className="space-y-2">
            {doFirst.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-app-card border border-rose-500/20 flex items-center justify-between text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTaskCompleted(t.id)}
                    className="w-4 h-4 rounded border-app-border text-rose-600"
                  />
                  <span className="font-semibold text-app-primary">{t.title}</span>
                </div>
                <span className="text-[10px] text-app-muted">{t.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Q2: Important & Not Urgent (Schedule) */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 min-h-[280px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/20">
            <h3 className="font-bold text-indigo-500 text-xs uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Q2: LÊN LỊCH (Quan Trọng & Không Khẩn Cấp)</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-500 font-bold text-[10px]">
              {schedule.length}
            </span>
          </div>

          <div className="space-y-2">
            {schedule.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-app-card border border-indigo-500/20 flex items-center justify-between text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTaskCompleted(t.id)}
                    className="w-4 h-4 rounded border-app-border text-indigo-600"
                  />
                  <span className="font-semibold text-app-primary">{t.title}</span>
                </div>
                <span className="text-[10px] text-app-muted">{t.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Q3: Urgent & Not Important (Delegate) */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 min-h-[280px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20">
            <h3 className="font-bold text-amber-500 text-xs uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Q3: BÀN GIAO (Khẩn Cấp & Ít Quan Trọng)</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold text-[10px]">
              {delegate.length}
            </span>
          </div>

          <div className="space-y-2">
            {delegate.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-app-card border border-amber-500/20 flex items-center justify-between text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTaskCompleted(t.id)}
                    className="w-4 h-4 rounded border-app-border text-amber-600"
                  />
                  <span className="font-semibold text-app-primary">{t.title}</span>
                </div>
                <span className="text-[10px] text-app-muted">{t.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Q4: Neither Urgent nor Important (Eliminate) */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border bg-app-surface min-h-[280px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border">
            <h3 className="font-bold text-app-muted text-xs uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-app-muted" />
              <span>Q4: LOẠI BỎ / GIẢM BỚT</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-app-surface-secondary text-app-muted font-bold text-[10px]">
              {eliminate.length}
            </span>
          </div>

          <div className="space-y-2">
            {eliminate.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-app-card border border-app-border flex items-center justify-between text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTaskCompleted(t.id)}
                    className="w-4 h-4 rounded border-app-border text-app-muted"
                  />
                  <span className="font-semibold text-app-primary">{t.title}</span>
                </div>
                <span className="text-[10px] text-app-muted">{t.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
