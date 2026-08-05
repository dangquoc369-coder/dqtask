/**
 * @license
 * TradeFlow & Life Sync Main Application Root Component
 */

import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';

// Modals
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QuickAddModal } from './components/QuickAddModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PomodoroModal } from './components/PomodoroModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { TasksView } from './components/views/TasksView';
import { KanbanView } from './components/views/KanbanView';
import { EisenhowerMatrixView } from './components/views/EisenhowerMatrixView';
import { TimelineView } from './components/views/TimelineView';
import { CalendarView } from './components/views/CalendarView';
import { HabitsView } from './components/views/HabitsView';
import { JournalView } from './components/views/JournalView';
import { TradingJournalView } from './components/views/TradingJournalView';
import { TradingAnalyticsView } from './components/views/TradingAnalyticsView';
import { TradingImportView } from './components/views/TradingImportView';
import { AICoachView } from './components/views/AICoachView';
import { DailyChecklistsView } from './components/views/DailyChecklistsView';
import { TelegramSettingsView } from './components/views/TelegramSettingsView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  const { activeView, theme, themeMode, fetchWeather, weatherCity } = useAppStore();

  useEffect(() => {
    fetchWeather(weatherCity);
  }, []);

  useEffect(() => {
    const updateDOMTheme = () => {
      let active: 'light' | 'dark' = theme;
      if (themeMode === 'system') {
        active = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(active);
    };

    updateDOMTheme();

    if (themeMode === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateDOMTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, themeMode]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TasksView />;
      case 'kanban':
        return <KanbanView />;
      case 'matrix':
        return <EisenhowerMatrixView />;
      case 'timeline':
        return <TimelineView />;
      case 'calendar':
        return <CalendarView />;
      case 'habits':
        return <HabitsView />;
      case 'journal':
        return <JournalView />;
      case 'trading-log':
        return <TradingJournalView />;
      case 'trading-analytics':
        return <TradingAnalyticsView />;
      case 'trading-import':
        return <TradingImportView />;
      case 'ai-coach':
        return <AICoachView />;
      case 'daily-checklists':
        return <DailyChecklistsView />;
      case 'telegram':
        return <TelegramSettingsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-primary flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Bar */}
        <Navbar />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Modals & Overlays */}
      <GlobalSearchModal />
      <QuickAddModal />
      <NotificationCenterModal />
      <PomodoroModal />
    </div>
  );
}
