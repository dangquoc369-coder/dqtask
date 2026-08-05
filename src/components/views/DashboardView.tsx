/**
 * @license
 * Bento Grid Dashboard (Apple + Linear + Notion Aesthetic)
 */

import React from 'react';
import {
  CheckSquare,
  TrendingUp,
  Activity,
  Calendar as CalendarIcon,
  Zap,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Calculator,
  Award,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { calculateTradingMetrics } from '../../lib/tradingAnalytics';
import { PWAInstallBanner } from '../PWAInstallBanner';

export const DashboardView: React.FC = () => {
  const {
    tasks,
    habits,
    trades,
    goals,
    toggleTaskCompleted,
    toggleHabitLog,
    setQuickAddOpen,
    setActiveView
  } = useAppStore();

  const todayStr = new Date().toISOString().split('T')[0];

  // Task stats
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const taskProgress = todayTasks.length > 0 ? Math.round((completedTasks / todayTasks.length) * 100) : 100;

  // Trading stats
  const metrics = calculateTradingMetrics(trades, 10000);

  // Recent 4 trades
  const recentTrades = trades.slice(0, 4);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1: Today Tasks */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border hover:border-indigo-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-app-muted">Nhiệm Vụ Hôm Nay</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-app-primary">
              {completedTasks}/{todayTasks.length || 0}
            </span>
            <span className="text-xs font-bold text-indigo-500">{taskProgress}% Hoàn Thành</span>
          </div>
          <div className="w-full bg-app-surface-secondary h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Metric Card 2: Trading Winrate */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-app-muted">Trading Winrate</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-app-primary">{metrics.winRate}%</span>
            <span className="text-xs font-bold text-emerald-500">PF: {metrics.profitFactor}</span>
          </div>
          <p className="text-[11px] text-app-muted mt-2">
            Tổng {metrics.totalTrades} lệnh • Lợi nhuận Net: <b className="text-emerald-500">${metrics.netProfit}</b>
          </p>
        </div>

        {/* Metric Card 3: Active Habit Streaks */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-app-muted">Thói Quen Streaks</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-app-primary">
              {habits.filter((h) => h.logs[todayStr]).length}/{habits.length}
            </span>
            <span className="text-xs font-bold text-emerald-500">Hôm nay</span>
          </div>
          <p className="text-[11px] text-app-muted mt-2">
            Streak cao nhất: <b className="text-emerald-500">{Math.max(...habits.map((h) => h.bestStreak), 0)} ngày</b>
          </p>
        </div>

        {/* Metric Card 4: Max Drawdown */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border hover:border-rose-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-app-muted">Max Drawdown</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-500">{metrics.maxDrawdownPercent}%</span>
            <span className="text-xs font-medium text-app-muted">${metrics.maxDrawdownDollar}</span>
          </div>
          <p className="text-[11px] text-app-muted mt-2">
            Risk of Ruin: <b className="text-app-secondary">{metrics.riskOfRuinPercent}%</b>
          </p>
        </div>
      </div>

      {/* Main Grid: Left Column (Tasks & Habits) | Right Column (Trading Journal & Goals) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Priority Tasks Card */}
          <div className="glass-panel p-5 rounded-2xl border border-app-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span>Nhiệm Vụ Ưu Tiên Hôm Nay</span>
              </h3>
              <button
                onClick={() => setActiveView('tasks')}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-app-muted bg-app-surface-secondary/50 rounded-xl border border-app-border">
                  Chưa có nhiệm vụ nào lên lịch cho hôm nay.
                  <button
                    onClick={() => setQuickAddOpen(true)}
                    className="block mx-auto mt-2 text-indigo-500 font-bold hover:underline"
                  >
                    + Tạo nhiệm vụ mới
                  </button>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      task.completed
                        ? 'bg-app-surface-secondary/40 border-app-border opacity-60'
                        : 'bg-app-card border-app-border hover:bg-app-card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompleted(task.id)}
                        className="w-4 h-4 rounded border-app-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            task.completed ? 'line-through text-app-muted' : 'text-app-primary'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-app-surface-secondary text-app-muted">
                            {task.category}
                          </span>
                          {task.dueTime && (
                            <span className="text-[10px] text-app-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.dueTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

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
                ))
              )}
            </div>
          </div>

          {/* Daily Habits Grid Card */}
          <div className="glass-panel p-5 rounded-2xl border border-app-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Theo Dõi Thói Quen (Habit Tracker)</span>
              </h3>
              <button
                onClick={() => setActiveView('habits')}
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Chi tiết</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {habits.map((habit) => {
                const isLogged = habit.logs[todayStr];
                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabitLog(habit.id, todayStr)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isLogged
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 font-medium shadow-sm'
                        : 'bg-app-card border-app-border hover:bg-app-card-hover text-app-secondary'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-app-primary">{habit.title}</h4>
                      <p className="text-[10px] text-app-muted mt-0.5">
                        Streak: <b className="text-emerald-500">{habit.streak} ngày liên tiếp</b>
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-xs ${
                        isLogged
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'border-app-border bg-app-surface-secondary text-app-muted'
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col width) */}
        <div className="space-y-6">
          {/* Quick Trading Journal Widget */}
          <div className="glass-panel p-5 rounded-2xl border border-app-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Lệnh Giao Dịch Gần Đây</span>
              </h3>
              <button
                onClick={() => setActiveView('trading-log')}
                className="text-xs font-semibold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Nhật ký</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentTrades.length === 0 ? (
                <div className="p-4 text-center text-xs text-app-muted bg-app-surface-secondary/50 rounded-xl">
                  Chưa có lệnh giao dịch nào.
                </div>
              ) : (
                recentTrades.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-app-card border border-app-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-amber-500">{t.symbol}</span>
                        <span
                          className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                            t.direction === 'Long'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {t.direction} {t.volume}L
                        </span>
                      </div>
                      <span className="text-[10px] text-app-muted mt-0.5 block">{t.setup}</span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          t.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {t.netPnl >= 0 ? '+' : ''}${t.netPnl}
                      </span>
                      <span className="text-[10px] text-app-muted block">
                        {new Date(t.closeTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quant Trading Coach Banner Widget */}
          <div className="p-5 rounded-2xl bg-app-surface border border-indigo-500/30 relative overflow-hidden shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h3 className="font-bold text-app-primary text-sm">Cố Vấn Giao Dịch Định Lượng</h3>
            </div>
            <p className="text-xs text-app-secondary leading-relaxed mb-4">
              Phân tích 100% tự động & miễn phí dựa trên công thức toán học tỷ lệ Kelly, Kỳ vọng EV, Risk of Ruin và soi bẫy tâm lý.
            </p>
            <button
              onClick={() => setActiveView('ai-coach')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Xem Báo Cáo Định Lượng</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekly & Monthly Goals */}
          <div className="glass-panel p-5 rounded-2xl border border-app-border">
            <h3 className="font-bold text-app-primary text-sm flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-500" />
              <span>Mục Tiêu Tuần & Tháng</span>
            </h3>

            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-app-secondary font-medium">
                    <span>{goal.title}</span>
                    <b className="text-purple-500">{goal.progress}%</b>
                  </div>
                  <div className="w-full bg-app-surface-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
