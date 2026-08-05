/**
 * @license
 * Quick Add Modal Overlay (Tasks, Trades, Notes, Habits)
 */

import React, { useState } from 'react';
import { X, CheckSquare, TrendingUp, Activity, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Priority, TaskCategory, TradeDirection, TradeMarket, TradeSession } from '../types';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, setQuickAddOpen, addTask, addTrade, addHabit } = useAppStore();
  const [activeTab, setActiveTab] = useState<'task' | 'trade' | 'habit'>('task');

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('trading');
  const [taskPriority, setTaskPriority] = useState<Priority>('high');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskEstimate, setTaskEstimate] = useState(30);

  // Trade state
  const [symbol, setSymbol] = useState('XAUUSD');
  const [direction, setDirection] = useState<TradeDirection>('Long');
  const [volume, setVolume] = useState(0.5);
  const [entryPrice, setEntryPrice] = useState(2425.0);
  const [exitPrice, setExitPrice] = useState(2438.0);
  const [stopLoss, setStopLoss] = useState(2418.0);
  const [takeProfit, setTakeProfit] = useState(2445.0);
  const [pnl, setPnl] = useState(650);
  const [setup, setSetup] = useState('Order Block H1');
  const [market, setMarket] = useState<TradeMarket>('Commodities');
  const [session, setSession] = useState<TradeSession>('London');

  // Habit state
  const [habitTitle, setHabitTitle] = useState('');
  const [habitCategory, setHabitCategory] = useState('Phát triển');

  if (!isQuickAddOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask({
      title: taskTitle.trim(),
      category: taskCategory,
      priority: taskPriority,
      quadrant: taskPriority === 'urgent' ? 'do_first' : 'schedule',
      completed: false,
      dueDate: taskDueDate,
      repeat: 'none',
      tags: [taskCategory],
      color: '#3b82f6',
      estimateMinutes: taskEstimate,
      actualMinutes: 0,
      subtasks: [],
    });
    setTaskTitle('');
    setQuickAddOpen(false);
  };

  const handleCreateTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const nowISO = new Date().toISOString();
    addTrade({
      symbol: symbol.toUpperCase(),
      direction,
      volume,
      openTime: new Date(Date.now() - 3600000).toISOString(),
      closeTime: nowISO,
      openPrice: entryPrice,
      closePrice: exitPrice,
      stopLoss,
      takeProfit,
      pnl,
      commission: 3.5,
      swap: 0,
      netPnl: pnl - 3.5,
      setup,
      market,
      session,
      holdingTimeMinutes: 60,
      tags: [symbol.toLowerCase(), direction.toLowerCase()],
    });
    setQuickAddOpen(false);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    addHabit({
      title: habitTitle.trim(),
      category: habitCategory,
      icon: 'Activity',
      color: '#10b981',
      targetPerWeek: 7,
    });
    setHabitTitle('');
    setQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-overlay backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-app-modal border border-app-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>Tạo Mục Mới Nhanh</span>
          </h3>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="p-1 rounded-lg hover:bg-app-surface-secondary text-app-muted hover:text-app-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-app-border bg-app-surface-secondary p-1">
          <button
            onClick={() => setActiveTab('task')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'task' ? 'bg-indigo-600 text-white shadow-sm' : 'text-app-muted hover:text-app-primary'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Nhiệm vụ (Task)</span>
          </button>

          <button
            onClick={() => setActiveTab('trade')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'trade' ? 'bg-amber-600 text-white shadow-sm' : 'text-app-muted hover:text-app-primary'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Lệnh Giao Dịch</span>
          </button>

          <button
            onClick={() => setActiveTab('habit')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'habit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-app-muted hover:text-app-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Thói Quen</span>
          </button>
        </div>

        {/* Forms */}
        <div className="p-5">
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-app-secondary mb-1">Tên Nhiệm Vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phân tích kỹ thuật XAUUSD trước phiên London..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-app-secondary mb-1">Danh Mục</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                  >
                    <option value="trading">Trading</option>
                    <option value="work">Công việc</option>
                    <option value="personal">Cá nhân</option>
                    <option value="fitness">Thể thao</option>
                    <option value="learning">Học tập</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-secondary mb-1">Mức Độ Ưu Tiên</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                  >
                    <option value="urgent">Khẩn cấp (Urgent)</option>
                    <option value="high">Cao (High)</option>
                    <option value="medium">Trung bình (Medium)</option>
                    <option value="low">Thấp (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-app-secondary mb-1">Ngày Hạn Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-secondary mb-1">Thời Gian Dự Kiến (Phút)</label>
                  <input
                    type="number"
                    value={taskEstimate}
                    onChange={(e) => setTaskEstimate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition-all shadow-md cursor-pointer"
              >
                Tạo Nhiệm Vụ Mới
              </button>
            </form>
          )}

          {activeTab === 'trade' && (
            <form onSubmit={handleCreateTrade} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Sản Phẩm Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg input-themed text-xs text-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Chiều Lệnh</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as TradeDirection)}
                    className="w-full px-2.5 py-1.5 rounded-lg input-themed text-xs"
                  >
                    <option value="Long">LONG (Mua)</option>
                    <option value="Short">SHORT (Bán)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Khối Lượng Lot</label>
                  <input
                    type="number"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg input-themed text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Giá Vào Entry</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg input-themed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Giá Chốt Exit</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg input-themed text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Lợi Nhuận Net PnL ($)</label>
                  <input
                    type="number"
                    value={pnl}
                    onChange={(e) => setPnl(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg input-themed text-xs font-bold ${
                      pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-app-muted mb-1">Phiên Session</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value as TradeSession)}
                    className="w-full px-2.5 py-1.5 rounded-lg input-themed text-xs"
                  >
                    <option value="London">London Session</option>
                    <option value="New York">New York Session</option>
                    <option value="Asian">Asian Session</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-xs text-white transition-all shadow-md cursor-pointer"
              >
                Ghi Nhật Ký Lệnh Giao Dịch
              </button>
            </form>
          )}

          {activeTab === 'habit' && (
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-app-secondary mb-1">Tên Thói Quen Mới *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thiền định 15 phút, Đọc tin tức kinh tế..."
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-app-secondary mb-1">Phân Loại</label>
                <input
                  type="text"
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-themed text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white transition-all shadow-md cursor-pointer"
              >
                Tạo Thói Quen Mới
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
