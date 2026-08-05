/**
 * @license
 * Professional Trading Journal Log View
 */

import React, { useState } from 'react';
import { TrendingUp, Plus, Filter, Trash2, AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Trade } from '../../types';

export const TradingJournalView: React.FC = () => {
  const { trades, deleteTrade, clearAllTrades, setQuickAddOpen, setActiveView } = useAppStore();
  const [filterSymbol, setFilterSymbol] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);

  const handleConfirmClearAll = () => {
    clearAllTrades();
    setShowClearConfirmModal(false);
  };

  const filteredTrades = trades.filter((t) => {
    if (filterSymbol !== 'all' && t.symbol !== filterSymbol) return false;
    if (filterDirection !== 'all' && t.direction !== filterDirection) return false;
    return true;
  });

  const uniqueSymbols = Array.from(new Set(trades.map((t) => t.symbol)));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>Nhật Ký Giao Dịch Professional Trading Log</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Ghi nhận toàn bộ tham số kỹ thuật, Setup, Risk, RR, Commission và PnL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trades.length > 0 && (
            <button
              onClick={() => setShowClearConfirmModal(true)}
              className="py-2.5 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-xs border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Xóa toàn bộ các lệnh giao dịch hiện tại"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Tất Cả Lệnh ({trades.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('trading-import')}
            className="py-2.5 px-4 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover font-semibold text-xs text-app-secondary border border-app-border cursor-pointer transition-colors"
          >
            Import Statement
          </button>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-xs text-white flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lệnh Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-app-surface p-3 rounded-xl border border-app-border text-xs">
        <Filter className="w-4 h-4 text-amber-500" />
        <span className="text-app-muted font-medium">Lọc Symbol:</span>
        <select
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value)}
          className="px-3 py-1.5 rounded-lg input-themed text-app-primary"
        >
          <option value="all">Tất cả cặp tiền</option>
          {uniqueSymbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="text-app-muted font-medium ml-2">Chiều lệnh:</span>
        <select
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
          className="px-3 py-1.5 rounded-lg input-themed text-app-primary"
        >
          <option value="all">Long & Short</option>
          <option value="Long">LONG (Mua)</option>
          <option value="Short">SHORT (Bán)</option>
        </select>
      </div>

      {/* Trade Log Table */}
      <div className="glass-panel rounded-2xl border border-app-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-app-secondary">
            <thead className="bg-app-surface-secondary text-[11px] uppercase tracking-wider text-app-muted border-b border-app-border">
              <tr>
                <th className="p-3.5">Mã / Symbol</th>
                <th className="p-3.5">Loại</th>
                <th className="p-3.5">Khối Lượng</th>
                <th className="p-3.5">Giá Vào Entry</th>
                <th className="p-3.5">Giá Chốt Exit</th>
                <th className="p-3.5">SL / TP</th>
                <th className="p-3.5">Setup & Phiên</th>
                <th className="p-3.5 text-right">Net PnL ($)</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-app-muted font-sans text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <TrendingUp className="w-8 h-8 text-app-muted/40" />
                      <p className="font-semibold text-app-secondary">Chưa có lệnh giao dịch nào trong nhật ký</p>
                      <p className="text-[11px] text-app-muted">Hãy bấm "Import Statement" hoặc "Thêm Lệnh Manual" để ghi nhận lệnh mới.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => (
                <tr key={t.id} className="hover:bg-app-surface-secondary/50 transition-all">
                  <td className="p-3.5 font-bold text-amber-500 font-sans">{t.symbol}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.direction === 'Long'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                      }`}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="p-3.5">{t.volume} lot</td>
                  <td className="p-3.5 text-app-primary">{t.openPrice}</td>
                  <td className="p-3.5 text-app-primary">{t.closePrice}</td>
                  <td className="p-3.5 text-app-muted text-[11px]">
                    SL: {t.stopLoss || '-'} <br /> TP: {t.takeProfit || '-'}
                  </td>
                  <td className="p-3.5 font-sans">
                    <span className="font-semibold text-app-primary block">{t.setup}</span>
                    <span className="text-[10px] text-app-muted">{t.session}</span>
                  </td>
                  <td
                    className={`p-3.5 text-right font-extrabold text-sm ${
                      t.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {t.netPnl >= 0 ? '+' : ''}${t.netPnl}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => deleteTrade(t.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-app-muted hover:text-rose-500 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )))
              }
            </tbody>
          </table>
        </div>
      </div>
      {/* Clear All Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-500/30 shadow-2xl space-y-4 bg-app-surface text-app-primary">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-app-primary">Xác Nhận Xóa TẤT CẢ Lệnh?</h3>
                  <p className="text-xs text-app-muted">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-surface-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-app-secondary leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ <b className="text-rose-500 font-bold">{trades.length} lệnh giao dịch</b> hiện có trong nhật ký?
              <br />
              <span className="text-[11px] text-app-muted block mt-1">
                Tất cả dữ liệu lệnh sẽ được làm sạch khỏi bộ nhớ local của ứng dụng.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-app-secondary bg-app-surface-secondary hover:bg-app-card-hover border border-app-border cursor-pointer transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Xóa Tất Cả ({trades.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
