/**
 * @license
 * Local AES Storage & Sync Engine
 * Handles encrypted persistent state, initial seeds, backup, restore, JSON & CSV export.
 */

import CryptoJS from 'crypto-js';
import {
  DailyJournal,
  DailyTradingChecklist,
  Goal,
  Habit,
  Task,
  TelegramConfig,
  Trade,
} from '../types';

const STORAGE_KEY = 'tradeflow_lifesync_state_v1';
const DEFAULT_ENCRYPTION_SECRET = 'tradeflow-secure-2026';

export interface AppStateData {
  tasks: Task[];
  habits: Habit[];
  journals: DailyJournal[];
  trades: Trade[];
  checklists: DailyTradingChecklist[];
  telegram: TelegramConfig;
  goals: Goal[];
  theme: 'light' | 'dark';
  themeMode?: 'light' | 'dark' | 'system';
  weatherCity?: string;
}

export function getInitialSeedData(): AppStateData {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const initialTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Xác định Bias & Phân tích Vùng Supply/Demand cặp XAUUSD',
      description: 'Kiểm tra khung H4 và H1, đánh dấu các vùng Order Block chưa test trước phiên London.',
      category: 'trading',
      priority: 'urgent',
      quadrant: 'do_first',
      completed: false,
      dueDate: todayStr,
      dueTime: '08:00',
      repeat: 'daily',
      tags: ['XAUUSD', 'Pre-market', 'Strategy'],
      color: '#ef4444',
      estimateMinutes: 30,
      actualMinutes: 25,
      subtasks: [
        { id: 'sub-1', title: 'Đọc tin tức Lịch kinh tế ForexFactory', completed: true },
        { id: 'sub-2', title: 'Xác định xu hướng Trend khung D1', completed: true },
        { id: 'sub-3', title: 'Tính toán Lot size phù hợp 1% Risk', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Tập Gym 45 phút & Giãn cơ',
      description: 'Lịch tập Chest & Triceps hôm nay',
      category: 'fitness',
      priority: 'high',
      quadrant: 'schedule',
      completed: true,
      dueDate: todayStr,
      dueTime: '17:30',
      repeat: 'none',
      tags: ['Workout', 'Health'],
      color: '#10b981',
      estimateMinutes: 45,
      actualMinutes: 50,
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Đọc 20 trang sách "Trading in the Zone"',
      description: 'Chương 4: Nhận thức về xác suất trong thị trường',
      category: 'learning',
      priority: 'medium',
      quadrant: 'schedule',
      completed: false,
      dueDate: todayStr,
      dueTime: '21:30',
      repeat: 'daily',
      tags: ['Mindset', 'Book'],
      color: '#3b82f6',
      estimateMinutes: 30,
      actualMinutes: 0,
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Hoàn thành Báo cáo Tổng kết Tuần & Backtest 20 Lệnh',
      description: 'Thống kê Winrate và Profit Factor cho hệ thống SMC trên BTCUSD',
      category: 'work',
      priority: 'high',
      quadrant: 'do_first',
      completed: false,
      dueDate: todayStr,
      dueTime: '20:00',
      repeat: 'weekly',
      tags: ['Backtest', 'Analytics'],
      color: '#8b5cf6',
      estimateMinutes: 60,
      actualMinutes: 15,
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const initialHabits: Habit[] = [
    {
      id: 'habit-1',
      title: 'Đọc sách 20 phút',
      category: 'Phát triển bản thân',
      icon: 'BookOpen',
      color: '#3b82f6',
      targetPerWeek: 7,
      logs: { [todayStr]: true, [yesterdayStr]: true },
      streak: 5,
      bestStreak: 14,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit-2',
      title: 'Thiền & Thở Sâu 10m',
      category: 'Tâm trí',
      icon: 'Brain',
      color: '#8b5cf6',
      targetPerWeek: 5,
      logs: { [todayStr]: true, [yesterdayStr]: true },
      streak: 3,
      bestStreak: 9,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit-3',
      title: 'Tập thể dục / Gym',
      category: 'Sức khỏe',
      icon: 'Activity',
      color: '#10b981',
      targetPerWeek: 4,
      logs: { [todayStr]: true },
      streak: 4,
      bestStreak: 12,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit-4',
      title: 'Không FOMO / Ghi Nhật ký Lệnh',
      category: 'Trading',
      icon: 'TrendingUp',
      color: '#ef4444',
      targetPerWeek: 5,
      logs: { [todayStr]: true, [yesterdayStr]: true },
      streak: 8,
      bestStreak: 21,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit-5',
      title: 'Uống 2.5 Lít nước',
      category: 'Sức khỏe',
      icon: 'Droplets',
      color: '#06b6d4',
      targetPerWeek: 7,
      logs: { [todayStr]: true, [yesterdayStr]: true },
      streak: 6,
      bestStreak: 18,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialJournals: DailyJournal[] = [
    {
      id: 'journal-1',
      date: todayStr,
      morningReview: {
        top3Goals: [
          'Kiên nhẫn chờ setup A+ phiên London',
          'Tập trung hoàn thành 100% công việc quan trọng',
          'Ngủ sớm trước 23:00',
        ],
        mindsetNote: 'Hôm nay tâm trạng bình tĩnh, sẵn sàng đối mặt mọi biến động của thị trường.',
        gratitude: 'Biết ơn vì bản thân luôn có kỷ luật và sức khỏe tốt.',
        completedAt: new Date().toISOString(),
      },
      eveningReview: {
        wins: ['Giao dịch XAUUSD tuân thủ đúng Stop loss', 'Tập gym đầy đủ'],
        lessons: ['Cần chốt lời chủ động hơn tại vùng FVG tiếp theo'],
        improvements: ['Hạn chế lướt TikTok sau 22:00'],
        reflectionNote: 'Một ngày làm việc hiệu quả và giữ được sự an yên.',
      },
      mood: 5,
      stress: 2,
      focus: 5,
      sleepHours: 7.5,
      sleepQuality: 4,
      energy: 5,
    },
  ];

  const initialTrades: Trade[] = [
    {
      id: 'trade-101',
      ticket: '891023',
      symbol: 'XAUUSD',
      direction: 'Long',
      volume: 0.5,
      openTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      closeTime: new Date(Date.now() - 3600000 * 3).toISOString(),
      openPrice: 2420.5,
      closePrice: 2435.8,
      stopLoss: 2415.0,
      takeProfit: 2440.0,
      pnl: 765.0,
      commission: 3.5,
      swap: 0,
      netPnl: 761.5,
      setup: 'Supply Demand Rejection',
      market: 'Commodities',
      session: 'London',
      timeframe: 'M15',
      notes: 'Thị trường chạm vùng Demand H1 và rút chân mạnh. Vào lệnh khớp chuẩn SL.',
      tags: ['xauusd', 'london', 'long', 'win'],
      mae: 1.2,
      mfe: 17.5,
      riskRewardRatio: 2.76,
      holdingTimeMinutes: 120,
    },
    {
      id: 'trade-102',
      ticket: '891024',
      symbol: 'EURUSD',
      direction: 'Short',
      volume: 1.0,
      openTime: new Date(Date.now() - 3600000 * 24).toISOString(),
      closeTime: new Date(Date.now() - 3600000 * 20).toISOString(),
      openPrice: 1.0890,
      closePrice: 1.0850,
      stopLoss: 1.0910,
      takeProfit: 1.0840,
      pnl: 400.0,
      commission: 7.0,
      swap: -1.2,
      netPnl: 391.8,
      setup: 'Breakout + Retest',
      market: 'Forex',
      session: 'New York',
      timeframe: 'H1',
      notes: 'Lệnh phá vỡ hỗ trợ đẹp tại phiên NY.',
      tags: ['eurusd', 'short', 'win'],
      riskRewardRatio: 2.0,
      holdingTimeMinutes: 240,
    },
    {
      id: 'trade-103',
      ticket: '891025',
      symbol: 'BTCUSD',
      direction: 'Long',
      volume: 0.1,
      openTime: new Date(Date.now() - 3600000 * 48).toISOString(),
      closeTime: new Date(Date.now() - 3600000 * 46).toISOString(),
      openPrice: 64200,
      closePrice: 63800,
      stopLoss: 63800,
      takeProfit: 66000,
      pnl: -400.0,
      commission: 2.5,
      swap: 0,
      netPnl: -402.5,
      setup: 'Liquidity Sweep',
      market: 'Crypto',
      session: 'Asian',
      timeframe: 'M5',
      notes: 'Bị dính Stop loss do tin tức đẩy quét thanh khoản.',
      tags: ['btcusd', 'loss'],
      riskRewardRatio: 4.5,
      holdingTimeMinutes: 120,
    },
    {
      id: 'trade-104',
      ticket: '891026',
      symbol: 'NAS100',
      direction: 'Long',
      volume: 0.2,
      openTime: new Date(Date.now() - 3600000 * 72).toISOString(),
      closeTime: new Date(Date.now() - 3600000 * 70).toISOString(),
      openPrice: 19800,
      closePrice: 20050,
      stopLoss: 19700,
      takeProfit: 20100,
      pnl: 500.0,
      commission: 4.0,
      swap: 0,
      netPnl: 496.0,
      setup: 'Order Block H1',
      market: 'Indices',
      session: 'New York',
      timeframe: 'M15',
      notes: 'Chỉ số Nasdaq tăng trưởng ấn tượng.',
      tags: ['nas100', 'win'],
      riskRewardRatio: 2.5,
      holdingTimeMinutes: 120,
    },
  ];

  const initialChecklist: DailyTradingChecklist = {
    date: todayStr,
    morningItems: [
      { id: 'c1', text: 'Đọc lịch kinh tế ForexFactory', checked: true },
      { id: 'c2', text: 'Xác định Bias khung H4 & D1', checked: true },
      { id: 'c3', text: 'Đánh dấu vùng Supply Demand quan trọng', checked: true },
      { id: 'c4', text: 'Tỷ lệ Risk tối đa 1% mỗi lệnh', checked: true },
      { id: 'c5', text: 'Kiểm tra trạng thái cảm xúc (Không giao dịch nếu mệt mỏi)', checked: true },
    ],
    eveningItems: [
      { id: 'e1', text: 'Đánh giá lại tất cả lệnh đã đóng', checked: true },
      { id: 'e2', text: 'Ghi chú bài học và lỗi sai vào nhật ký', checked: true },
      { id: 'e3', text: 'Kiểm tra tỷ lệ tuân thủ kỷ luật', checked: true },
    ],
    disciplineScore: 100,
    notes: 'Kỷ luật hoàn hảo hôm nay.',
  };

  const initialTelegram: TelegramConfig = {
    botToken: '',
    chatId: '',
    enabled: false,
    notifyMorning: true,
    morningTime: '07:00',
    notifyTradingSession: true,
    tradingTime: '14:00',
    notifyEvening: true,
    eveningTime: '21:00',
    notifyDeadline: true,
    notifyWeeklyReport: true,
    weeklyDay: 1,
    weeklyTime: '20:00',
  };

  const initialGoals: Goal[] = [
    {
      id: 'g-1',
      title: 'Đạt Winrate > 55% & Profit Factor > 1.8 trong tháng này',
      targetDate: todayStr,
      type: 'monthly',
      progress: 75,
      category: 'trading',
      completed: false,
    },
    {
      id: 'g-2',
      title: 'Hoàn thành 20 buổi tập Gym & 100km chạy bộ',
      targetDate: todayStr,
      type: 'monthly',
      progress: 80,
      category: 'fitness',
      completed: false,
    },
  ];

  return {
    tasks: initialTasks,
    habits: initialHabits,
    journals: initialJournals,
    trades: initialTrades,
    checklists: [initialChecklist],
    telegram: initialTelegram,
    goals: initialGoals,
    theme: 'dark',
  };
}

export function loadStateFromStorage(encryptionKey = DEFAULT_ENCRYPTION_SECRET): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getInitialSeedData();
      saveStateToStorage(seed, encryptionKey);
      return seed;
    }

    try {
      // Try decrypting if AES string
      if (raw.startsWith('U2FsdGVkX1')) {
        const bytes = CryptoJS.AES.decrypt(raw, encryptionKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedStr) {
          return JSON.parse(decryptedStr);
        }
      }
      return JSON.parse(raw);
    } catch {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return getInitialSeedData();
  }
}

export function saveStateToStorage(
  state: AppStateData,
  encryptionKey = DEFAULT_ENCRYPTION_SECRET,
  useEncryption = false
): void {
  try {
    const jsonStr = JSON.stringify(state);
    if (useEncryption) {
      const encrypted = CryptoJS.AES.encrypt(jsonStr, encryptionKey).toString();
      localStorage.setItem(STORAGE_KEY, encrypted);
    } else {
      localStorage.setItem(STORAGE_KEY, jsonStr);
    }
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

export function exportBackupJSON(state: AppStateData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `TradeFlow_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTradesCSV(trades: Trade[]): void {
  const headers = [
    'Ticket',
    'Symbol',
    'Direction',
    'Volume',
    'Open Time',
    'Close Time',
    'Open Price',
    'Close Price',
    'Stop Loss',
    'Take Profit',
    'Net PnL',
    'Setup',
    'Market',
    'Session',
    'Holding Minutes',
    'Notes',
  ];

  const rows = trades.map((t) => [
    t.ticket || '',
    t.symbol,
    t.direction,
    t.volume,
    t.openTime,
    t.closeTime,
    t.openPrice,
    t.closePrice,
    t.stopLoss || '',
    t.takeProfit || '',
    t.netPnl,
    t.setup || '',
    t.market,
    t.session,
    t.holdingTimeMinutes,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `TradeFlow_Trading_Journal_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
