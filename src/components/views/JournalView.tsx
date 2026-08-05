/**
 * @license
 * Daily Life Journal View (Morning & Evening Reviews, Mood, Focus, Sleep Rating)
 */

import React, { useState } from 'react';
import { BookOpen, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const JournalView: React.FC = () => {
  const { journals, saveJournal } = useAppStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const currentJournal = journals.find((j) => j.date === todayStr) || {
    id: `j-${todayStr}`,
    date: todayStr,
    mood: 4,
    stress: 2,
    focus: 5,
    sleepHours: 7.5,
    sleepQuality: 4,
    energy: 4,
    morningReview: {
      top3Goals: ['Thực thi đúng kỷ luật Risk 1%', 'Đọc 10 trang sách', 'Tập thể dục 30p'],
      mindsetNote: 'Tập trung vào xác suất. Không cay cú với thị trường.',
      gratitude: 'Sức khỏe tốt và gia đình bình an.',
    },
    eveningReview: {
      wins: ['Tuân thủ Stoploss tuyệt đối', 'Đạt target 2R lệnh XAUUSD'],
      lessons: ['Không fomo nhảy lệnh phiên Á'],
      improvements: ['Đi ngủ trước 23:00'],
      reflectionNote: 'Một ngày giữ kỷ luật xuất sắc.',
    },
  };

  const [mindset, setMindset] = useState(currentJournal.morningReview?.mindsetNote || '');
  const [wins, setWins] = useState((currentJournal.eveningReview?.wins || []).join('\n'));
  const [lessons, setLessons] = useState((currentJournal.eveningReview?.lessons || []).join('\n'));

  const handleSave = () => {
    saveJournal({
      ...currentJournal,
      morningReview: {
        ...currentJournal.morningReview,
        mindsetNote: mindset,
      },
      eveningReview: {
        ...currentJournal.eveningReview,
        wins: wins.split('\n').filter(Boolean),
        lessons: lessons.split('\n').filter(Boolean),
      },
    });
    alert('Đã lưu Nhật ký sống hôm nay thành công!');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <span>Nhật Ký Sống Daily Journal ({todayStr})</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Ghi chép tư duy buổi sáng & tổng kết bài học kinh nghiệm buổi tối.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-md cursor-pointer"
        >
          Lưu Nhật Ký
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Review */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <div className="flex items-center gap-2 text-amber-500 border-b border-app-border pb-3">
            <Sun className="w-5 h-5" />
            <h3 className="font-bold text-sm text-app-primary">Morning Review (Khởi Đầu Ngày)</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1">
              Ghi chú Tâm lý & Tư duy đầu ngày (Mindset):
            </label>
            <textarea
              rows={4}
              value={mindset}
              onChange={(e) => setMindset(e.target.value)}
              className="w-full p-3 rounded-xl input-themed text-xs"
              placeholder="Viết cảm xúc, kỷ luật trading hôm nay..."
            />
          </div>
        </div>

        {/* Evening Review */}
        <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
          <div className="flex items-center gap-2 text-indigo-500 border-b border-app-border pb-3">
            <Moon className="w-5 h-5" />
            <h3 className="font-bold text-sm text-app-primary">Evening Review (Tổng Kết Tối)</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1">
              Chiến thắng trong ngày (Mỗi dòng 1 điều):
            </label>
            <textarea
              rows={2}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="w-full p-3 rounded-xl input-themed text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1">
              Bài học rút ra (Mỗi dòng 1 bài học):
            </label>
            <textarea
              rows={2}
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              className="w-full p-3 rounded-xl input-themed text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
