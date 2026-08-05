/**
 * @license
 * Centralized Zustand Store for TradeFlow & Life Sync
 */

import { create } from 'zustand';
import {
  exportBackupJSON,
  exportTradesCSV,
  getInitialSeedData,
  loadStateFromStorage,
  saveStateToStorage,
} from '../lib/storage';
import {
  AICoachReport,
  AppNotification,
  DailyJournal,
  DailyTradingChecklist,
  Goal,
  Habit,
  Task,
  TelegramConfig,
  Trade,
  ViewMode,
  WeatherInfo,
} from '../types';

interface AppStoreState {
  // Views & Navigation
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;

  // Search & Modals
  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  isQuickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  isNotificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;
  isPomodoroOpen: boolean;
  setPomodoroOpen: (open: boolean) => void;
  activePomodoroTask?: Task;
  setActivePomodoroTask: (task?: Task) => void;

  // App Data
  tasks: Task[];
  habits: Habit[];
  journals: DailyJournal[];
  trades: Trade[];
  checklists: DailyTradingChecklist[];
  telegram: TelegramConfig;
  goals: Goal[];
  notifications: AppNotification[];
  weatherCity: string;
  weather: WeatherInfo;
  fetchWeather: (cityName?: string) => Promise<void>;
  setWeatherCity: (cityName: string) => Promise<void>;
  aiCoachReport?: AICoachReport;

  // Actions: Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;

  // Actions: Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak' | 'logs'>) => void;
  toggleHabitLog: (id: string, dateStr: string) => void;
  deleteHabit: (id: string) => void;

  // Actions: Journals
  saveJournal: (journal: DailyJournal) => void;

  // Actions: Trades
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  addTradesBatch: (trades: Trade[]) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  clearAllTrades: () => void;

  // Actions: Checklists
  saveChecklist: (checklist: DailyTradingChecklist) => void;

  // Actions: Telegram
  updateTelegramConfig: (config: Partial<TelegramConfig>) => void;

  // Actions: Goals & Notifications
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoalProgress: (id: string, progress: number) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  setAICoachReport: (report: AICoachReport) => void;

  // Backup & Storage
  exportBackup: () => void;
  exportCSV: () => void;
  importBackup: (data: any) => void;
  resetToDefaults: () => void;
}

const initialLoaded = loadStateFromStorage();

export const useAppStore = create<AppStoreState>((set, get) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  theme: initialLoaded.theme || 'dark',
  themeMode: (initialLoaded.themeMode as 'light' | 'dark' | 'system') || 'dark',
  setThemeMode: (mode) => {
    let resolvedTheme: 'light' | 'dark' = 'dark';
    if (mode === 'system') {
      resolvedTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedTheme = mode;
    }
    set({ themeMode: mode, theme: resolvedTheme });
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: resolvedTheme,
      themeMode: mode,
    });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: nextTheme, themeMode: nextTheme });
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: nextTheme,
      themeMode: nextTheme,
    });
  },

  isGlobalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
  isQuickAddOpen: false,
  setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
  isNotificationCenterOpen: false,
  setNotificationCenterOpen: (open) => set({ isNotificationCenterOpen: open }),
  isPomodoroOpen: false,
  setPomodoroOpen: (open) => set({ isPomodoroOpen: open }),
  activePomodoroTask: undefined,
  setActivePomodoroTask: (task) => set({ activePomodoroTask: task, isPomodoroOpen: true }),

  tasks: initialLoaded.tasks,
  habits: initialLoaded.habits,
  journals: initialLoaded.journals,
  trades: initialLoaded.trades,
  checklists: initialLoaded.checklists,
  telegram: initialLoaded.telegram,
  goals: initialLoaded.goals,
  notifications: [
    {
      id: 'notif-1',
      title: 'Chào mừng đến DQ task pro!',
      message: 'Ứng dụng quản lý công việc & nhật ký giao dịch chuyên nghiệp đã sẵn sàng.',
      type: 'system',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ],
  weatherCity: initialLoaded.weatherCity || 'Hà Nội',
  weather: {
    city: initialLoaded.weatherCity || 'Hà Nội',
    temp: 30,
    condition: 'Nắng ráo',
    high: 33,
    low: 26,
    humidity: 65,
    icon: 'Sun',
  },
  aiCoachReport: undefined,

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...get().tasks];
    set({ tasks: updated });
    get().addNotification({
      title: 'Nhiệm vụ mới',
      message: `Đã tạo nhiệm vụ "${newTask.title}"`,
      type: 'task',
    });
    saveStateToStorage({
      tasks: updated,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  updateTask: (id, updates) => {
    const updated = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks: updated });
    saveStateToStorage({
      tasks: updated,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  toggleTaskCompleted: (id) => {
    const updated = get().tasks.map((t) => {
      if (t.id === id) {
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    set({ tasks: updated });
    saveStateToStorage({
      tasks: updated,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  deleteTask: (id) => {
    const updated = get().tasks.filter((t) => t.id !== id);
    set({ tasks: updated });
    saveStateToStorage({
      tasks: updated,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  addHabit: (habitData) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      logs: {},
      streak: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().habits, newHabit];
    set({ habits: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: updated,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  toggleHabitLog: (id, dateStr) => {
    const updated = get().habits.map((h) => {
      if (h.id === id) {
        const nextLogs = { ...h.logs, [dateStr]: !h.logs[dateStr] };
        // Recalculate current streak
        let streak = 0;
        let curr = new Date();
        while (true) {
          const key = curr.toISOString().split('T')[0];
          if (nextLogs[key]) {
            streak++;
            curr.setDate(curr.getDate() - 1);
          } else if (key === dateStr && !nextLogs[key]) {
            break;
          } else {
            break;
          }
        }
        const bestStreak = Math.max(h.bestStreak, streak);
        return { ...h, logs: nextLogs, streak, bestStreak };
      }
      return h;
    });
    set({ habits: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: updated,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  deleteHabit: (id) => {
    const updated = get().habits.filter((h) => h.id !== id);
    set({ habits: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: updated,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  saveJournal: (journal) => {
    const existingIndex = get().journals.findIndex((j) => j.date === journal.date);
    let updated: DailyJournal[];
    if (existingIndex >= 0) {
      updated = [...get().journals];
      updated[existingIndex] = journal;
    } else {
      updated = [journal, ...get().journals];
    }
    set({ journals: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: updated,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  addTrade: (tradeData) => {
    const newTrade: Trade = {
      ...tradeData,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const updated = [newTrade, ...get().trades];
    set({ trades: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: updated,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  addTradesBatch: (newTrades) => {
    const updated = [...newTrades, ...get().trades];
    set({ trades: updated });
    get().addNotification({
      title: 'Import Lệnh Giao Dịch',
      message: `Đã tự động bóc tách và nhập ${newTrades.length} lệnh giao dịch!`,
      type: 'trading',
    });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: updated,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  updateTrade: (id, updates) => {
    const updated = get().trades.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ trades: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: updated,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  deleteTrade: (id) => {
    const updated = get().trades.filter((t) => t.id !== id);
    set({ trades: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: updated,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  clearAllTrades: () => {
    set({ trades: [] });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: [],
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  saveChecklist: (checklist) => {
    const existingIndex = get().checklists.findIndex((c) => c.date === checklist.date);
    let updated: DailyTradingChecklist[];
    if (existingIndex >= 0) {
      updated = [...get().checklists];
      updated[existingIndex] = checklist;
    } else {
      updated = [checklist, ...get().checklists];
    }
    set({ checklists: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: updated,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  updateTelegramConfig: (configUpdates) => {
    const updated = { ...get().telegram, ...configUpdates };
    set({ telegram: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: updated,
      goals: get().goals,
      theme: get().theme,
    });
  },

  addGoal: (goalData) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    const updated = [...get().goals, newGoal];
    set({ goals: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: updated,
      theme: get().theme,
    });
  },

  updateGoalProgress: (id, progress) => {
    const updated = get().goals.map((g) =>
      g.id === id ? { ...g, progress, completed: progress >= 100 } : g
    );
    set({ goals: updated });
    saveStateToStorage({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: updated,
      theme: get().theme,
    });
  },

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    set({ notifications: [newNotif, ...get().notifications] });
  },

  markNotificationRead: (id) => {
    set({
      notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  },

  clearAllNotifications: () => set({ notifications: [] }),

  setAICoachReport: (report) => set({ aiCoachReport: report }),

  exportBackup: () => {
    exportBackupJSON({
      tasks: get().tasks,
      habits: get().habits,
      journals: get().journals,
      trades: get().trades,
      checklists: get().checklists,
      telegram: get().telegram,
      goals: get().goals,
      theme: get().theme,
    });
  },

  exportCSV: () => {
    exportTradesCSV(get().trades);
  },

  importBackup: (data) => {
    if (data && data.tasks && data.trades) {
      set({
        tasks: data.tasks || [],
        habits: data.habits || [],
        journals: data.journals || [],
        trades: data.trades || [],
        checklists: data.checklists || [],
        telegram: data.telegram || get().telegram,
        goals: data.goals || [],
      });
      saveStateToStorage({
        tasks: data.tasks || [],
        habits: data.habits || [],
        journals: data.journals || [],
        trades: data.trades || [],
        checklists: data.checklists || [],
        telegram: data.telegram || get().telegram,
        goals: data.goals || [],
        theme: get().theme,
      });
    }
  },

  fetchWeather: async (cityName) => {
    const cityToFetch = cityName || get().weatherCity || 'Hà Nội';
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(cityToFetch)}`);
      if (res.ok) {
        const data = await res.json();
        set({
          weatherCity: data.city || cityToFetch,
          weather: {
            city: data.city || cityToFetch,
            temp: data.temp,
            condition: data.condition,
            high: data.high,
            low: data.low,
            humidity: data.humidity,
            icon: data.icon || 'Sun',
          },
        });
        saveStateToStorage({
          tasks: get().tasks,
          habits: get().habits,
          journals: get().journals,
          trades: get().trades,
          checklists: get().checklists,
          telegram: get().telegram,
          goals: get().goals,
          theme: get().theme,
          themeMode: get().themeMode,
          weatherCity: data.city || cityToFetch,
        });
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu thời tiết:', err);
    }
  },

  setWeatherCity: async (cityName) => {
    set({ weatherCity: cityName });
    await get().fetchWeather(cityName);
  },

  resetToDefaults: () => {
    const defaults = getInitialSeedData();
    set({
      tasks: defaults.tasks,
      habits: defaults.habits,
      journals: defaults.journals,
      trades: defaults.trades,
      checklists: defaults.checklists,
      telegram: defaults.telegram,
      goals: defaults.goals,
    });
    saveStateToStorage(defaults);
  },
}));
