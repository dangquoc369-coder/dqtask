/**
 * @license
 * Daily Trading Discipline Checklists View
 */

import React, { useState } from 'react';
import { ListTodo, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const DailyChecklistsView: React.FC = () => {
  const [items, setItems] = useState([
    { id: 'c1', label: 'Đã xem tin tức kinh tế quan trọng trên ForexFactory', checked: true },
    { id: 'c2', label: 'Xác định Bias xu hướng chính khung H4/D1', checked: true },
    { id: 'c3', label: 'Vẽ vung Order Block / Cung Cầu chính xác', checked: true },
    { id: 'c4', label: 'Tính toán Khối lượng Lot đúng rủi ro <= 1% TK', checked: true },
    { id: 'c5', label: 'Đã cài đặt Stop Loss ngay khi vừa đặt lệnh', checked: true },
    { id: 'c6', label: 'Tâm lý thoải mái, không cay cú lệnh thua trước', checked: true },
    { id: 'c7', label: 'Không nhồi lệnh khi giá đang chạy mạnh (Anti-FOMO)', checked: false },
    { id: 'c8', label: 'Chấp nhận lỗ nếu chạm SL mà không dời SL rộng hơn', checked: true },
  ]);

  const checkedCount = items.filter((i) => i.checked).length;
  const scorePercent = Math.round((checkedCount / items.length) * 100);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-500" />
            <span>Checklist Kỷ Luật Trading Trước Phiên</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Chỉ bấm đặt lệnh khi đã tích đủ 100% các tiêu chí an toàn dưới đây.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-app-muted">Điểm Kỷ Luật:</span>
          <span className="text-xl font-extrabold text-emerald-500">{scorePercent}%</span>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
              item.checked
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-semibold shadow-sm'
                : 'bg-app-card border-app-border text-app-secondary hover:bg-app-card-hover'
            }`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => {}}
              className="w-4 h-4 rounded border-app-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
