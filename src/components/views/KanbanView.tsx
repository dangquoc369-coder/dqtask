/**
 * @license
 * Interactive Kanban Board View
 */

import React from 'react';
import { Kanban, Plus, Clock, Timer, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Task } from '../../types';

export const KanbanView: React.FC = () => {
  const { tasks, updateTask, setQuickAddOpen, setActivePomodoroTask } = useAppStore();

  const todoTasks = tasks.filter((t) => !t.completed && (t.actualMinutes === 0 || !t.actualMinutes));
  const inProgressTasks = tasks.filter((t) => !t.completed && t.actualMinutes > 0);
  const completedTasks = tasks.filter((t) => t.completed);

  const moveTaskStage = (task: Task, targetStage: 'todo' | 'progress' | 'completed') => {
    if (targetStage === 'completed') {
      updateTask(task.id, { completed: true, completedAt: new Date().toISOString() });
    } else if (targetStage === 'progress') {
      updateTask(task.id, { completed: false, actualMinutes: Math.max(10, task.actualMinutes || 10) });
    } else {
      updateTask(task.id, { completed: false, actualMinutes: 0 });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Kanban className="w-5 h-5 text-indigo-500" />
            <span>Bảng Kanban Theo Dõi Tiến Độ</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Kéo thả hoặc nhấn nút để chuyển trạng thái công việc qua các cột.
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

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: To Do */}
        <div className="glass-panel p-4 rounded-2xl border border-app-border flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border">
            <h3 className="font-bold text-app-secondary text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span>Cần Làm (To Do)</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-app-surface-secondary text-[10px] font-bold text-app-secondary">
              {todoTasks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {todoTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-app-card border border-app-border hover:border-indigo-500/40 transition-all text-xs space-y-2 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-app-primary">{task.title}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-app-muted pt-1">
                  <span className="bg-app-surface-secondary px-2 py-0.5 rounded font-medium">{task.category}</span>
                  <button
                    onClick={() => moveTaskStage(task, 'progress')}
                    className="flex items-center gap-1 text-indigo-500 font-bold hover:underline"
                  >
                    <span>Bắt đầu</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="glass-panel p-4 rounded-2xl border border-app-border flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border">
            <h3 className="font-bold text-amber-500 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Đang Thực Hiện (In Progress)</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[10px] font-bold text-amber-500">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {inProgressTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-app-card border border-amber-500/30 hover:border-amber-500/50 transition-all text-xs space-y-2 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-app-primary">{task.title}</span>
                  <button
                    onClick={() => setActivePomodoroTask(task)}
                    className="p-1 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                    title="Bật Pomodoro"
                  >
                    <Timer className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-app-muted pt-1">
                  <span>Đã tập trung: {task.actualMinutes}m</span>
                  <button
                    onClick={() => moveTaskStage(task, 'completed')}
                    className="flex items-center gap-1 text-emerald-500 font-bold hover:underline"
                  >
                    <span>Hoàn thành</span>
                    <CheckCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="glass-panel p-4 rounded-2xl border border-app-border flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border">
            <h3 className="font-bold text-emerald-500 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Đã Hoàn Thành (Done)</span>
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-500">
              {completedTasks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-app-card/60 border border-app-border opacity-75 text-xs space-y-1"
              >
                <span className="font-bold text-app-secondary line-through">{task.title}</span>
                <p className="text-[10px] text-emerald-500 font-medium">✓ Đã xong</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
