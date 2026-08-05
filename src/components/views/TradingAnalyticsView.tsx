/**
 * @license
 * Commercial Quantitative Trading Analytics Dashboard
 * Calculates Sharpe, Sortino, Calmar, Recovery Factor, Expectancy, Kelly, Edge Ratio, Streaks & Monte Carlo Simulation.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  DollarSign,
  PieChart,
  Sliders,
  ShieldAlert,
  Flame,
  Target,
  RefreshCw,
  Calendar,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import {
  calculateTradingMetrics,
  generateEquityCurves,
  getSymbolBreakdown,
  getDayOfWeekBreakdown,
  getMonthBreakdown,
  getHourBreakdown,
  groupTradesByProperty,
  runMonteCarloSimulation,
  MonteCarloResult,
} from '../../lib/tradingAnalytics';

export const TradingAnalyticsView: React.FC = () => {
  const { trades } = useAppStore();
  const initialBalance = 10000;
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);

  const metrics = calculateTradingMetrics(trades, initialBalance);
  const equityPoints = generateEquityCurves(trades, initialBalance);

  const symbolBreakdown = getSymbolBreakdown(trades);
  const dayBreakdown = getDayOfWeekBreakdown(trades);
  const monthBreakdown = getMonthBreakdown(trades);
  const hourBreakdown = getHourBreakdown(trades);
  const sessionBreakdown = groupTradesByProperty(trades, (t) => t.session || 'Khác');

  const handleRunMonteCarlo = () => {
    if (trades.length < 3) {
      alert('Cần ít nhất 3 lệnh giao dịch để thực hiện mô phỏng Monte Carlo!');
      return;
    }
    const sim = runMonteCarloSimulation(trades, initialBalance, 100);
    setMcResult(sim);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Phân Tích Thống Kê Giao Dịch Quan Sát (Quantitative Analytics)</span>
          </h2>
          <p className="text-xs text-app-secondary mt-1">
            Hệ thống chỉ số chuẩn Hedge-Fund: Win Rate, Profit Factor, Chuỗi Thắng/Thua Tối Đa, Sharpe/Sortino, Phân tích Symbol & Thời Gian, Monte Carlo.
          </p>
        </div>
      </div>

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Win Rate */}
        <div className="glass-panel p-3.5 rounded-2xl border border-app-border">
          <span className="text-[11px] text-app-muted font-semibold flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-500" /> Tỷ Lệ Thắng
          </span>
          <div className="text-xl font-extrabold text-emerald-500 mt-1">{metrics.winRate}%</div>
          <p className="text-[10px] text-app-muted mt-0.5">
            {metrics.winningTrades} Thắng / {metrics.losingTrades} Thua
          </p>
        </div>

        {/* Profit Factor */}
        <div className="glass-panel p-3.5 rounded-2xl border border-app-border">
          <span className="text-[11px] text-app-muted font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" /> Profit Factor
          </span>
          <div className="text-xl font-extrabold text-amber-500 mt-1">{metrics.profitFactor}</div>
          <p className="text-[10px] text-app-muted mt-0.5">
            Lời ${metrics.grossProfit} / Lỗ ${metrics.grossLoss}
          </p>
        </div>

        {/* Net Profit */}
        <div className="glass-panel p-3.5 rounded-2xl border border-app-border">
          <span className="text-[11px] text-app-muted font-semibold flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Lợi Nhuận Ròng
          </span>
          <div className={`text-xl font-extrabold mt-1 ${metrics.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            ${metrics.netProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-app-muted mt-0.5">Tổng số lệnh: {metrics.totalTrades}</p>
        </div>

        {/* Max Drawdown */}
        <div className="glass-panel p-3.5 rounded-2xl border border-app-border">
          <span className="text-[11px] text-app-muted font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Max Drawdown
          </span>
          <div className="text-xl font-extrabold text-rose-500 mt-1">{metrics.maxDrawdownPercent}%</div>
          <p className="text-[10px] text-app-muted mt-0.5">Sụt giảm: ${metrics.maxDrawdownDollar}</p>
        </div>

        {/* Consecutive Streaks */}
        <div className="glass-panel p-3.5 rounded-2xl border border-app-border">
          <span className="text-[11px] text-app-muted font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Chuỗi Thắng / Thua
          </span>
          <div className="text-xl font-extrabold text-app-primary mt-1 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-500">{metrics.maxConsecutiveWins || 0}W</span>
            <span className="text-app-muted text-xs">/</span>
            <span className="text-rose-500">{metrics.maxConsecutiveLosses || 0}L</span>
          </div>
          <p className="text-[10px] text-app-muted mt-0.5">Max Win / Loss streak</p>
        </div>

        {/* Expectancy */}
        <div className="glass-panel p-3.5 rounded-2xl border border-app-border">
          <span className="text-[11px] text-app-muted font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-500" /> Expectancy ($/lệnh)
          </span>
          <div className="text-xl font-extrabold text-purple-500 mt-1">${metrics.expectancy}</div>
          <p className="text-[10px] text-app-muted mt-0.5">Kỳ vọng trung bình mỗi lệnh</p>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-app-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Biểu Đồ Tăng Trưởng Tài Khoản (Equity Curve)</span>
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-500">
            Khởi tạo: ${initialBalance.toLocaleString()} → Cuối kỳ: ${(initialBalance + metrics.netProfit).toLocaleString()}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityPoints}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                }}
                formatter={(val: any) => [`$${val}`, 'Số Dư']}
              />
              <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Symbol Performance Breakdown */}
      <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-500" />
            <span>1. Phân Tích Hiệu Suất Theo Mã Giao Dịch (Symbol Breakdown)</span>
          </h3>
          <span className="text-xs text-app-secondary">Tổng số mã: {symbolBreakdown.length}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="key" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                  }}
                  formatter={(val: any) => [`$${val}`, 'Lợi Nhuận Ròng']}
                />
                <Bar dataKey="netProfit" radius={[6, 6, 0, 0]}>
                  {symbolBreakdown.map((entry, index) => (
                    <Cell key={`sym-cell-${index}`} fill={entry.netProfit >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Details */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-app-border text-app-muted uppercase font-semibold">
                  <th className="py-2 px-2">Symbol</th>
                  <th className="py-2 px-2 text-center">Số Lệnh</th>
                  <th className="py-2 px-2 text-center">Win Rate</th>
                  <th className="py-2 px-2 text-right">Lợi Nhuận</th>
                  <th className="py-2 px-2 text-right">PF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {symbolBreakdown.map((s) => (
                  <tr key={s.key} className="hover:bg-app-surface transition-colors">
                    <td className="py-2 px-2 font-bold font-mono text-app-primary">{s.key}</td>
                    <td className="py-2 px-2 text-center text-app-secondary">{s.tradesCount}</td>
                    <td className="py-2 px-2 text-center font-semibold text-emerald-500">{s.winRate}%</td>
                    <td className={`py-2 px-2 text-right font-bold font-mono ${s.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${s.netProfit.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-500">{s.profitFactor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Session & Day of Week Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>2. Hiệu Suất Theo Ngày Trong Tuần (Day of Week)</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="key" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                  }}
                  formatter={(val: any) => [`$${val}`, 'Lợi Nhuận Ròng']}
                />
                <Bar dataKey="netProfit" radius={[6, 6, 0, 0]}>
                  {dayBreakdown.map((entry, index) => (
                    <Cell key={`day-cell-${index}`} fill={entry.netProfit >= 0 ? '#3b82f6' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span>3. Hiệu Suất Theo Phiên Giao Dịch (Trading Sessions)</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="key" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                  }}
                  formatter={(val: any) => [`$${val}`, 'Lợi Nhuận Ròng']}
                />
                <Bar dataKey="netProfit" radius={[6, 6, 0, 0]}>
                  {sessionBreakdown.map((entry, index) => (
                    <Cell key={`sess-cell-${index}`} fill={entry.netProfit >= 0 ? '#a855f7' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Hour of Day & Month Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>4. Phân Bố Theo Giờ Trong Ngày (Hourly UTC)</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="key" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                  }}
                  formatter={(val: any) => [`$${val}`, 'Lợi Nhuận Ròng']}
                />
                <Bar dataKey="netProfit" radius={[6, 6, 0, 0]}>
                  {hourBreakdown.map((entry, index) => (
                    <Cell key={`hr-cell-${index}`} fill={entry.netProfit >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>5. Phân Tích Theo Tháng (Monthly Breakdown)</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="key" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                  }}
                  formatter={(val: any) => [`$${val}`, 'Lợi Nhuận Ròng']}
                />
                <Bar dataKey="netProfit" radius={[6, 6, 0, 0]}>
                  {monthBreakdown.map((entry, index) => (
                    <Cell key={`m-cell-${index}`} fill={entry.netProfit >= 0 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Metrics & Monte Carlo Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk & Expectancy Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-3 text-xs">
          <h3 className="font-bold text-app-primary text-sm mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Chỉ Số Quản Trị Rủi Ro & Tỷ Lệ Thống Kê (Risk Metrics)</span>
          </h3>

          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-app-secondary">Sharpe Ratio / Sortino Ratio:</span>
            <b className="text-blue-500 font-mono">{metrics.sharpeRatio} / {metrics.sortinoRatio}</b>
          </div>

          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-app-secondary">Calmar Ratio / Recovery Factor:</span>
            <b className="text-indigo-500 font-mono">{metrics.calmarRatio} / {metrics.recoveryFactor}</b>
          </div>

          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-app-secondary">Kelly Criterion (Tỷ lệ đi tiền tối ưu):</span>
            <b className="text-amber-500 font-mono">{metrics.kellyPercent}%</b>
          </div>

          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-app-secondary">Edge Ratio:</span>
            <b className="text-emerald-500 font-mono">{metrics.edgeRatio}</b>
          </div>

          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-app-secondary">Risk of Ruin (% Cháy Tài Khoản):</span>
            <b className="text-rose-500 font-mono">{metrics.riskOfRuinPercent}%</b>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-app-secondary">Thời Gian Giữ Lệnh Trung Bình:</span>
            <b className="text-app-primary font-mono">{metrics.holdingTimeMinutesAvg} phút</b>
          </div>
        </div>

        {/* Monte Carlo Simulator */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>Mô Phỏng Monte Carlo (100 Kịch Bản Ngẫu Nhiên)</span>
            </h3>

            <button
              onClick={handleRunMonteCarlo}
              className="py-1.5 px-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Chạy Monte Carlo</span>
            </button>
          </div>

          <p className="text-xs text-app-secondary">
            Mô phỏng xáo trộn ngẫu nhiên chuỗi kết quả giao dịch để dự đoán mức sụt giảm tài khoản cao nhất (Max Drawdown 95th Percentile).
          </p>

          {mcResult ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-app-surface border border-app-border">
                  <span className="text-app-muted block text-[10px]">Trung vị (50th)</span>
                  <b className="text-emerald-500 font-mono">${mcResult.percentile50Equity}</b>
                </div>
                <div className="p-2 rounded-lg bg-app-surface border border-app-border">
                  <span className="text-app-muted block text-[10px]">Tối ưu (95th)</span>
                  <b className="text-blue-500 font-mono">${mcResult.percentile95Equity}</b>
                </div>
                <div className="p-2 rounded-lg bg-app-surface border border-app-border">
                  <span className="text-app-muted block text-[10px]">Max DD Tệ Nhất</span>
                  <b className="text-rose-500 font-mono">{mcResult.percentile5MaxDrawdown}%</b>
                </div>
              </div>

              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mcResult.simulationPaths[0]?.map((val, idx) => ({ step: idx, val })) || []}>
                    <XAxis dataKey="step" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} />
                    <Area type="monotone" dataKey="val" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-app-muted bg-app-surface rounded-xl border border-app-border">
              Nhấn &quot;Chạy Monte Carlo&quot; để khởi chạy mô phỏng 100 kịch bản ngẫu nhiên.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
