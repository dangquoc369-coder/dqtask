/**
 * @license
 * High-usability Mobile Bottom Navigation Bar (Design Tokens)
 */

import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  TrendingUp,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ViewMode } from '../types';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, setQuickAddOpen } = useAppStore();

  const navs: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công Việc', icon: CheckSquare },
    { id: 'trading-log', label: 'Trading', icon: TrendingUp },
    { id: 'trading-analytics', label: 'Thống Kê', icon: Sparkles },
    { id: 'telegram', label: 'Telegram', icon: Send },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-surface/95 backdrop-blur-xl border-t border-app-border px-2 py-1.5 flex items-center justify-around shadow-lg">
      {navs.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-blue-500 font-bold' : 'text-app-muted'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">{item.label}</span>
          </button>
        );
      })}

      {/* Floating Center Quick Add Button */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="w-12 h-12 -mt-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all border-2 border-app-surface cursor-pointer"
        aria-label="Tạo mới"
      >
        <Plus className="w-6 h-6" />
      </button>

      {navs.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-amber-500 font-bold' : 'text-app-muted'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
