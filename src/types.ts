/**
 * @license
 * TradeFlow & Life Sync - Core TypeScript Type Definitions
 */

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 'trading' | 'work' | 'personal' | 'fitness' | 'learning' | 'finance';

export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: Priority;
  quadrant: EisenhowerQuadrant;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  tags: string[];
  color: string;
  estimateMinutes: number;
  actualMinutes: number;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number; // e.g. pages read or minutes exercised
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  targetPerWeek: number; // 1 to 7
  logs: Record<string, boolean>; // key YYYY-MM-DD -> completed
  streak: number;
  bestStreak: number;
  createdAt: string;
}

export interface DailyJournal {
  id: string;
  date: string; // YYYY-MM-DD
  morningReview: {
    top3Goals: string[];
    mindsetNote: string;
    gratitude: string;
    completedAt?: string;
  };
  eveningReview: {
    wins: string[];
    lessons: string[];
    improvements: string[];
    reflectionNote: string;
    completedAt?: string;
  };
  mood: number; // 1-5
  stress: number; // 1-5
  focus: number; // 1-5
  sleepHours: number;
  sleepQuality: number; // 1-5
  energy: number; // 1-5
}

export type TradeDirection = 'Long' | 'Short';
export type TradeSession = 'Asian' | 'London' | 'New York' | 'Overlap';
export type TradeMarket = 'Forex' | 'Crypto' | 'Indices' | 'Commodities' | 'Stocks';

export interface Trade {
  id: string;
  ticket?: string;
  symbol: string;
  originalSymbol?: string;
  symbolConfidence?: number; // 0 - 100%
  direction: TradeDirection;
  volume: number; // Lot size or contract quantity
  openTime: string; // ISO String
  closeTime: string; // ISO String
  openPrice: number;
  closePrice: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  commission: number;
  tax?: number;
  swap: number;
  netPnl: number; // pnl + swap - commission - tax
  setup?: string;
  market: TradeMarket;
  session: TradeSession;
  timeframe?: string;
  notes?: string;
  tags: string[];
  chartImageUrl?: string;
  mae?: number; // Maximum Adverse Excursion ($ or pips)
  mfe?: number; // Maximum Favorable Excursion ($ or pips)
  riskRewardRatio?: number;
  holdingTimeMinutes: number;
  isParseError?: boolean;
  parseErrorReason?: string;
}

export interface ExnessAccountInfo {
  broker: string;
  account: string;
  name: string;
  currency: string;
  leverage: string;
  issueDate: string;
  period: string;
}

export interface ExnessSummaryDetails {
  deposit: number;
  withdraw: number;
  closedPL: number;
  floatingPL: number;
  totalPL: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  netDeposit?: number;
  depositOther?: number;
  withdrawOther?: number;
  creditFacility?: number;
  nullCompensation?: number;
  agentCommission?: number;
}

export interface TradingChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface DailyTradingChecklist {
  date: string; // YYYY-MM-DD
  morningItems: TradingChecklistItem[];
  eveningItems: TradingChecklistItem[];
  disciplineScore: number; // 0-100
  notes?: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyMorning: boolean;
  morningTime: string; // HH:mm, default "07:00"
  notifyTradingSession: boolean;
  tradingTime: string; // HH:mm, default "14:00"
  notifyEvening: boolean;
  eveningTime: string; // HH:mm, default "21:00"
  notifyDeadline: boolean;
  notifyWeeklyReport: boolean;
  weeklyDay: number; // 0 = Sunday, 1 = Monday
  weeklyTime: string; // HH:mm, default "20:00"
  lastSent?: Record<string, string>; // key: notification_type -> last sent date/timestamp
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'habit' | 'trading' | 'system' | 'telegram';
  createdAt: string;
  read: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  type: 'weekly' | 'monthly';
  progress: number; // 0 to 100
  category: TaskCategory;
  completed: boolean;
}

export interface WeatherInfo {
  city: string;
  temp: number;
  condition: string;
  high: number;
  low: number;
  humidity: number;
  icon: string;
}

export interface QuantReport {
  id: string;
  createdAt: string;
  overallRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  overallScore: number;
  summary: string;
  kellyPercent: number;
  halfKellyPercent: number;
  expectancy: number;
  riskOfRuinPercent: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  overtradingRisk: string;
  revengeTradingCount: number;
  volumeTiltCount: number;
  noStopLossCount: number;
  strengths: string[];
  weaknesses: string[];
  badHabits: string[];
  psychologyCritique: string;
  stopLossCompliance: string;
  bestSetup?: { name: string; winRate: number; netPnl: number };
  worstSetup?: { name: string; winRate: number; netPnl: number };
  bestSession?: { name: string; winRate: number; netPnl: number };
  actionableRules: string[];
}

export type AICoachReport = QuantReport;

export type ViewMode =
  | 'dashboard'
  | 'tasks'
  | 'kanban'
  | 'matrix'
  | 'timeline'
  | 'calendar'
  | 'habits'
  | 'journal'
  | 'trading-log'
  | 'trading-analytics'
  | 'trading-import'
  | 'quant-coach'
  | 'ai-coach'
  | 'daily-checklists'
  | 'telegram'
  | 'settings';
