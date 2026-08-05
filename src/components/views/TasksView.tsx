/**
 * @license
 * Tasks Management View (List View, Filters, Subtasks, Pomodoro integration)
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Timer,
  Trash2,
  Tag,
  Filter,
  Check,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Priority, Task, TaskCategory } from '../../types';

export const TasksView: React.FC = () => {
  const { tasks, toggleTaskCompleted, deleteTask, setQuickAddOpen, setActivePomodoroTask, updateTask } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newSubtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    updateTask(taskId, {
      subtasks: [...(task.subtasks || []), newSubtask],
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            <span>Quản Lý Công Việc & Tasks</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Lên kế hoạch, ưu tiên theo Ma trận Eisenhower, bấm icon Timer để bật Pomodoro.
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white flex items-center gap-2 transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Task Mới</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-app-surface p-3 rounded-xl border border-app-border text-xs">
        <div className="flex items-center gap-2 text-app-muted font-medium">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>Lọc theo:</span>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg input-themed text-app-primary"
        >
          <option value="all">Tất cả danh mục</option>
          <option value="trading">Trading</option>
          <option value="work">Công việc</option>
          <option value="fitness">Thể thao</option>
          <option value="learning">Học tập</option>
          <option value="personal">Cá nhân</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 rounded-lg input-themed text-app-primary"
        >
          <option value="all">Mọi độ ưu tiên</option>
          <option value="urgent">Khẩn cấp (Urgent)</option>
          <option value="high">Ưu tiên Cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-app-muted rounded-2xl">
            Không tìm thấy công việc nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`glass-panel rounded-2xl border transition-all overflow-hidden ${
                  task.completed
                    ? 'bg-app-surface-secondary/40 border-app-border opacity-65'
                    : 'bg-app-card border-app-border hover:border-indigo-500/40'
                }`}
              >
                {/* Main Row */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompleted(task.id)}
                      className="w-4 h-4 rounded border-app-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-bold truncate ${
                            task.completed ? 'line-through text-app-muted' : 'text-app-primary'
                          }`}
                        >
                          {task.title}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                              : task.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-app-surface-secondary text-app-muted'
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-app-muted">
                        <span className="capitalize px-2 py-0.5 rounded bg-app-surface-secondary font-medium">
                          {task.category}
                        </span>

                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-app-muted" />
                          {task.dueDate}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-app-muted" />
                          {task.estimateMinutes}m (Thực tế: {task.actualMinutes}m)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActivePomodoroTask(task)}
                      className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 transition-all cursor-pointer"
                      title="Chạy Pomodoro cho task này"
                    >
                      <Timer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-2 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover text-app-secondary transition-all cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-app-muted hover:text-rose-500 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Accordion */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-2 border-t border-app-border bg-app-surface-secondary/40 space-y-3">
                    {task.description && (
                      <p className="text-xs text-app-secondary italic">{task.description}</p>
                    )}

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider block">
                        Danh Sách Subtasks Checklist:
                      </span>

                      {(task.subtasks || []).map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 text-xs text-app-secondary">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => handleToggleSubtask(task.id, sub.id)}
                            className="w-3.5 h-3.5 rounded border-app-border text-indigo-600"
                          />
                          <span className={sub.completed ? 'line-through text-app-muted' : ''}>
                            {sub.title}
                          </span>
                        </div>
                      ))}

                      {/* Add Subtask input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Thêm bước nhỏ (subtask)..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg input-themed text-xs text-app-primary"
                        />
                        <button
                          onClick={() => handleAddSubtask(task.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
