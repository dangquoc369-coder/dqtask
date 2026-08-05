/**
 * Quant Coach View - Professional Quantitative & Algorithmic Trade Analysis
 * 100% Free, Offline, Mathematics & Risk Management Based
 */

import React, { useState, useEffect } from 'react';
import { Calculator, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, Flame, Scale, Activity, TrendingUp, Award, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { generateQuantReport, QuantReport } from '../../lib/quantCoach';

export const QuantCoachView: React.FC = () => {
  const { trades } = useAppStore();
  const [report, setReport] = useState<QuantReport | null>(null);

  useEffect(() => {
    // Calculate initial report immediately on load
    const r = generateQuantReport(trades, 10000);
    setReport(r);
  }, [trades]);

  const handleRecalculate = () => {
    const r = generateQuantReport(trades, 10000);
    setReport(r);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            <span>Cố Vấn Định Lượng & Công Thức Giao Dịch Chuyên Nghiệp</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Phân tích 100% miễn phí & tức thì dựa trên toán học xác suất, tỷ lệ Kelly, Kỳ vọng EV và bẫy tâm lý trading.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-xs text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer"
        >
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Tính Toán & Phân Tích Lại</span>
        </button>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Overall Rating Header */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shrink-0">
                {report.overallRating}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-500 font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Điểm Kỷ Luật: {report.overallScore}/100</span>
                </div>
                <h3 className="text-xl font-bold text-app-primary mt-1">Báo Cáo Hiệu Suất Giao Dịch</h3>
                <p className="text-xs text-app-secondary mt-1 max-w-xl">{report.summary}</p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-app-border pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
              <div className="text-xs text-app-muted">Nguy cơ Overtrading:</div>
              <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                report.overtradingRisk === 'Nghiêm Trọng' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                report.overtradingRisk === 'Cao' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
              }`}>
                {report.overtradingRisk}
              </span>
            </div>
          </div>

          {/* Mathematical Risk Formulas Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kelly Criterion */}
            <div className="glass-panel p-4 rounded-2xl border border-app-border space-y-2">
              <div className="flex justify-between items-center text-xs text-app-muted font-medium">
                <span className="flex items-center gap-1.5 font-bold text-app-primary">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  Công Thức Kelly
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded">Tối Ưu Vốn</span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-500 font-mono">
                {report.halfKellyPercent > 0 ? `${report.halfKellyPercent.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-[11px] text-app-muted">
                Half-Kelly đề xuất cho mỗi lệnh để tránh Drawdown sâu. (Full Kelly: {report.kellyPercent.toFixed(1)}%).
              </p>
            </div>

            {/* Expected Value (EV) */}
            <div className="glass-panel p-4 rounded-2xl border border-app-border space-y-2">
              <div className="flex justify-between items-center text-xs text-app-muted font-medium">
                <span className="flex items-center gap-1.5 font-bold text-app-primary">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Kỳ Vọng EV ($)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">Mỗi Lệnh</span>
              </div>
              <div className={`text-2xl font-extrabold font-mono ${report.expectancy >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {report.expectancy >= 0 ? '+' : ''}${report.expectancy.toFixed(2)}
              </div>
              <p className="text-[11px] text-app-muted">
                Lợi nhuận kỳ vọng trung bình thu được trên mỗi $1 rủi ro theo toán học.
              </p>
            </div>

            {/* Risk of Ruin */}
            <div className="glass-panel p-4 rounded-2xl border border-app-border space-y-2">
              <div className="flex justify-between items-center text-xs text-app-muted font-medium">
                <span className="flex items-center gap-1.5 font-bold text-app-primary">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Risk of Ruin (50%)
                </span>
                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded">Nguy Cơ</span>
              </div>
              <div className={`text-2xl font-extrabold font-mono ${report.riskOfRuinPercent > 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {report.riskOfRuinPercent.toFixed(1)}%
              </div>
              <p className="text-[11px] text-app-muted">
                Xác suất tài khoản bị sụt giảm 50% dựa trên tỷ lệ thắng và rủi ro hiện tại.
              </p>
            </div>

            {/* Profit Factor & R:R */}
            <div className="glass-panel p-4 rounded-2xl border border-app-border space-y-2">
              <div className="flex justify-between items-center text-xs text-app-muted font-medium">
                <span className="flex items-center gap-1.5 font-bold text-app-primary">
                  <Activity className="w-4 h-4 text-amber-500" />
                  Profit Factor / R:R
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">Chất Lượng</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-500 font-mono">
                {report.profitFactor.toFixed(2)} <span className="text-xs text-app-muted font-normal">(R:R {report.winLossRatio.toFixed(2)})</span>
              </div>
              <p className="text-[11px] text-app-muted">
                Tỷ lệ Tổng Thắng / Tổng Thua. Yêu cầu &gt; 1.3 để tài khoản tăng trưởng bền vững.
              </p>
            </div>
          </div>

          {/* Behavioral Audit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-app-border flex items-center justify-between">
              <div>
                <div className="text-xs text-app-muted font-medium">Lệnh Revenge Trading (30p)</div>
                <div className="text-lg font-bold text-app-primary mt-1">{report.revengeTradingCount} lệnh</div>
              </div>
              <Flame className={`w-8 h-8 ${report.revengeTradingCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-app-border flex items-center justify-between">
              <div>
                <div className="text-xs text-app-muted font-medium">Lần Tăng Khối Lượng Tilt</div>
                <div className="text-lg font-bold text-app-primary mt-1">{report.volumeTiltCount} lần</div>
              </div>
              <AlertTriangle className={`w-8 h-8 ${report.volumeTiltCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-app-border flex items-center justify-between">
              <div>
                <div className="text-xs text-app-muted font-medium">Kiểm Tra Tuân Thủ Stop Loss</div>
                <div className="text-xs font-bold text-app-primary mt-1">{report.stopLossCompliance}</div>
              </div>
              <ShieldCheck className={`w-8 h-8 ${report.noStopLossCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
            </div>
          </div>

          {/* Setup & Session Performance */}
          {(report.bestSetup || report.worstSetup || report.bestSession) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.bestSetup && (
                <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Setup Tốt Nhất
                  </span>
                  <div className="font-bold text-sm text-app-primary">{report.bestSetup.name}</div>
                  <div className="text-xs text-emerald-500 font-semibold">
                    Winrate: {report.bestSetup.winRate.toFixed(0)}% | PnL: +${report.bestSetup.netPnl.toFixed(2)}
                  </div>
                </div>
              )}

              {report.worstSetup && (
                <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Setup Cần Cải Thiện
                  </span>
                  <div className="font-bold text-sm text-app-primary">{report.worstSetup.name}</div>
                  <div className="text-xs text-rose-500 font-semibold">
                    Winrate: {report.worstSetup.winRate.toFixed(0)}% | PnL: ${report.worstSetup.netPnl.toFixed(2)}
                  </div>
                </div>
              )}

              {report.bestSession && (
                <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-500 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Phiên Hiệu Quả Nhất
                  </span>
                  <div className="font-bold text-sm text-app-primary">{report.bestSession.name}</div>
                  <div className="text-xs text-indigo-500 font-semibold">
                    Winrate: {report.bestSession.winRate.toFixed(0)}% | PnL: +${report.bestSession.netPnl.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <h4 className="font-bold text-emerald-500 text-xs uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Điểm Mạnh Cốt Lõi ({report.strengths.length})</span>
              </h4>
              <ul className="space-y-2 text-xs text-app-secondary">
                {report.strengths.map((item, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-app-card border border-emerald-500/20 leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
              <h4 className="font-bold text-rose-500 text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Lỗi & Điểm Yếu Cần Khắc Phục ({report.weaknesses.length})</span>
              </h4>
              <ul className="space-y-2 text-xs text-app-secondary">
                {report.weaknesses.map((item, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-app-card border border-rose-500/20 leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Rules */}
          <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
            <h4 className="font-bold text-indigo-500 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Quy Tắc Trading Bắt Buộc Áp Dụng Cho Lần Giao Dịch Tới</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.actionableRules.map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-app-card border border-indigo-500/20 text-xs text-app-primary">
                  <b className="text-indigo-500 block mb-1">Quy tắc {idx + 1}:</b>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
