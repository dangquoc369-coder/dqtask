/**
 * @license
 * Desktop Navigation Sidebar (Apple + Linear + Notion Design Tokens)
 */

import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Grid2X2,
  Clock,
  Calendar as CalendarIcon,
  Activity,
  BookOpen,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Bot,
  Send,
  Settings,
  Plus,
  Zap,
  Calculator,
  ListTodo,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ViewMode } from '../types';

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, setQuickAddOpen, tasks, telegram, trades, habits } = useAppStore();

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const mainNavs: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công Việc & Tasks', icon: CheckSquare, badge: pendingTasksCount || undefined },
    { id: 'kanban', label: 'Bảng Kanban', icon: Kanban },
    { id: 'matrix', label: 'Ma Trận Eisenhower', icon: Grid2X2 },
    { id: 'timeline', label: 'Timeline Dòng Thời Gian', icon: Clock },
    { id: 'calendar', label: 'Lịch Calendar', icon: CalendarIcon },
    { id: 'habits', label: 'Thói Quen Habit Tracker', icon: Activity, badge: habits.length || undefined },
    { id: 'journal', label: 'Nhật Ký Sống Daily Journal', icon: BookOpen },
  ];

  const tradingNavs: NavItem[] = [
    { id: 'trading-log', label: 'Nhật Ký Lệnh Trading', icon: TrendingUp, badge: trades.length },
    { id: 'trading-analytics', label: 'Phân Tích Thống Kê', icon: BarChart3, highlight: true },
    { id: 'trading-import', label: 'Nhập File Statement', icon: FileSpreadsheet },
    { id: 'ai-coach', label: 'Cố Vấn Định Lượng', icon: Calculator, highlight: true },
    { id: 'daily-checklists', label: 'Checklist Kỷ Luật', icon: ListTodo },
  ];

  const systemNavs: NavItem[] = [
    {
      id: 'telegram',
      label: 'Telegram Bot 24/7',
      icon: Send,
      badge: telegram.enabled ? 'ONLINE' : 'OFF',
    },
    { id: 'settings', label: 'Cài Đặt & Sao Lưu', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-app-border bg-app-surface backdrop-blur-xl h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-app-border">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="DQ Task Pro Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-lg border border-indigo-500/30 ring-2 ring-indigo-500/20"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <div>
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight leading-none text-base">
              DQ task pro
            </h1>
            <p className="text-[11px] text-app-muted font-medium mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Work & Trade Master
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="px-4 py-3">
        <button
          onClick={() => setQuickAddOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mới Nhanh</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        {/* Productivity Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-app-muted uppercase">
            Quản Lý Công Việc
          </div>
          <nav className="space-y-1">
            {mainNavs.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 font-semibold shadow-sm'
                      : 'text-app-secondary hover:bg-app-surface-secondary hover:text-app-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-app-muted'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-blue-500/20 text-blue-500' : 'bg-app-surface-secondary text-app-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Trading Journal Section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-app-muted uppercase">
            <span>Trading Journal</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
              PRO
            </span>
          </div>
          <nav className="space-y-1">
            {tradingNavs.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 font-semibold shadow-sm'
                      : 'text-app-secondary hover:bg-app-surface-secondary hover:text-app-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-app-muted'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-app-surface-secondary text-app-muted">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System & Telegram */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-app-muted uppercase">
            Hệ Thống & Khác
          </div>
          <nav className="space-y-1">
            {systemNavs.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 font-semibold shadow-sm'
                      : 'text-app-secondary hover:bg-app-surface-secondary hover:text-app-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-app-muted'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        telegram.enabled
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : 'bg-app-surface-secondary text-app-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 m-3 rounded-2xl bg-app-surface-secondary border border-app-border text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-app-secondary font-medium">Cron Daemon Active</span>
        </div>
        <span className="text-[10px] font-mono text-app-muted">v2.4 PWA</span>
      </div>
    </aside>
  );
};
