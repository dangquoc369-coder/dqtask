/**
 * @license
 * Top Navigation Header Bar with Theme Token Controls & Diagnostics
 */

import React from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  Timer,
  CloudSun,
  Bot,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Navbar: React.FC = () => {
  const {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    setGlobalSearchOpen,
    setNotificationCenterOpen,
    setPomodoroOpen,
    notifications,
    weather,
    telegram,
    setActiveView,
  } = useAppStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 bg-app-surface/90 backdrop-blur-md border-b border-app-border px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 min-h-[46px] sm:min-h-[52px]">
      {/* Left: Greeting & Date */}
      <div className="min-w-0 flex-1">
        <h2 className="text-xs sm:text-sm lg:text-base font-bold text-app-primary flex items-center gap-1.5 truncate">
          <span className="truncate">{getGreeting()}, Trader!</span>
          <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 shrink-0">
            Kỷ luật = Lợi nhuận
          </span>
        </h2>
        <p className="text-[10px] sm:text-xs text-app-muted font-medium capitalize truncate mt-0.5 hidden xs:block sm:block">
          {formattedDate}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Weather Badge - Click to Settings */}
        <button
          onClick={() => setActiveView('settings')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-app-surface-secondary hover:border-sky-500/50 border border-app-border text-[11px] sm:text-xs text-app-secondary transition-all cursor-pointer"
          title="Bấm để đổi thành phố thời tiết"
        >
          <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate max-w-[120px]">{weather.city}: <b>{weather.temp}°C</b></span>
        </button>

        {/* Telegram Status Badge */}
        <button
          onClick={() => setActiveView('telegram')}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border cursor-pointer ${
            telegram.enabled
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-app-surface-secondary text-app-muted border-app-border'
          }`}
          title="Trạng thái Telegram Bot 24/7"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Bot {telegram.enabled ? '24/7' : 'Tắt'}</span>
        </button>

        {/* Global Search Button (Cmd+K) */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-app-surface-secondary hover:border-blue-500 border border-app-border text-xs text-app-muted transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-app-muted shrink-0" />
          <span className="hidden md:inline text-[11px]">Tìm kiếm...</span>
          <kbd className="hidden md:inline text-[9px] bg-app-card px-1 py-0.5 rounded text-app-muted border border-app-border font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Pomodoro Launcher */}
        <button
          onClick={() => setPomodoroOpen(true)}
          className="p-1.5 sm:p-2 rounded-xl bg-app-surface-secondary hover:bg-app-border text-app-secondary border border-app-border transition-all cursor-pointer"
          title="Mở Pomodoro Timer"
        >
          <Timer className="w-3.5 h-3.5 text-blue-500" />
        </button>

        {/* Notification Center Bell */}
        <button
          onClick={() => setNotificationCenterOpen(true)}
          className="relative p-1.5 sm:p-2 rounded-xl bg-app-surface-secondary hover:bg-app-border text-app-secondary border border-app-border transition-all cursor-pointer"
          title="Thông báo"
        >
          <Bell className="w-3.5 h-3.5 text-app-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Switcher */}
        <div className="flex items-center bg-app-surface-secondary p-0.5 rounded-xl border border-app-border text-xs">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer ${
              themeMode === 'light' ? 'bg-app-card text-amber-500 shadow-sm' : 'text-app-muted'
            }`}
            title="Sáng (Light Mode)"
          >
            <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer ${
              themeMode === 'dark' ? 'bg-app-card text-blue-500 shadow-sm' : 'text-app-muted'
            }`}
            title="Tối (Dark Mode)"
          >
            <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer ${
              themeMode === 'system' ? 'bg-app-card text-emerald-500 shadow-sm' : 'text-app-muted'
            }`}
            title="Hệ thống (System Mode)"
          >
            <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
