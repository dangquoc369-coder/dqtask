/**
 * @license
 * Cmd+K Global Search Modal
 */

import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, TrendingUp, Activity, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const GlobalSearchModal: React.FC = () => {
  const { isGlobalSearchOpen, setGlobalSearchOpen, tasks, trades, habits, journals, setActiveView } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!isGlobalSearchOpen);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)))
    : [];

  const filteredTrades = q
    ? trades.filter((t) => t.symbol.toLowerCase().includes(q) || (t.setup && t.setup.toLowerCase().includes(q)))
    : [];

  const filteredHabits = q
    ? habits.filter((h) => h.title.toLowerCase().includes(q) || h.category.toLowerCase().includes(q))
    : [];

  const filteredJournals = q
    ? journals.filter((j) => (j.morningReview?.mindsetNote || '').toLowerCase().includes(q))
    : [];

  const hasResults =
    filteredTasks.length > 0 ||
    filteredTrades.length > 0 ||
    filteredHabits.length > 0 ||
    filteredJournals.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-app-overlay backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-app-modal border border-app-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="p-4 border-b border-app-border flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm công việc, lệnh giao dịch, thói quen, thẻ tag..."
            className="flex-1 bg-transparent text-sm text-app-primary placeholder-app-muted focus:outline-none"
          />
          <button
            onClick={() => setGlobalSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-app-surface-secondary text-app-muted hover:text-app-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4 custom-scrollbar">
          {!q && (
            <div className="text-center py-8 text-xs text-app-muted">
              Gõ từ khóa bất kỳ để tìm nhanh các mục trong toàn bộ ứng dụng...
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-8 text-xs text-app-muted">
              Không tìm thấy kết quả nào phù hợp với &quot;{query}&quot;.
            </div>
          )}

          {/* Tasks Results */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>Công việc ({filteredTasks.length})</span>
              </div>
              <div className="space-y-1">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveView('tasks');
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover flex items-center justify-between text-xs text-app-primary transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-app-tag text-app-secondary">
                      {t.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trades Results */}
          {filteredTrades.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Lệnh Trading ({filteredTrades.length})</span>
              </div>
              <div className="space-y-1">
                {filteredTrades.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveView('trading-log');
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover flex items-center justify-between text-xs text-app-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-500">{t.symbol}</span>
                      <span className={t.direction === 'Long' ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                        {t.direction} {t.volume} lot
                      </span>
                    </div>
                    <span className={`font-mono font-bold ${t.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.netPnl >= 0 ? '+' : ''}${t.netPnl}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Habits Results */}
          {filteredHabits.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>Thói quen ({filteredHabits.length})</span>
              </div>
              <div className="space-y-1">
                {filteredHabits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setActiveView('habits');
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover flex items-center justify-between text-xs text-app-primary transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{h.title}</span>
                    <span className="text-[10px] text-emerald-500 font-bold">Streak: {h.streak} ngày</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-app-surface-secondary border-t border-app-border text-[11px] text-app-muted flex items-center justify-between">
          <span>Dùng phím Mũi tên để di chuyển, Enter để chọn</span>
          <kbd className="bg-app-card px-1.5 py-0.5 rounded text-[10px] border border-app-border">ESC để đóng</kbd>
        </div>
      </div>
    </div>
  );
};
