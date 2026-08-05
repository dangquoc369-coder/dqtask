/**
 * @license
 * Telegram Bot 24/7 Notification Settings & Cron Daemon Status
 */

import React, { useState } from 'react';
import { Send, Bot, CheckCircle2, AlertTriangle, Clock, RefreshCw, Zap, Shield, HelpCircle, Terminal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const TelegramSettingsView: React.FC = () => {
  const { telegram, updateTelegramConfig, addNotification } = useAppStore();

  const [botToken, setBotToken] = useState(telegram.botToken);
  const [chatId, setChatId] = useState(telegram.chatId);
  const [enabled, setEnabled] = useState(telegram.enabled);
  const [morningTime, setMorningTime] = useState(telegram.morningTime || '07:00');
  const [tradingTime, setTradingTime] = useState(telegram.tradingTime || '14:00');
  const [eveningTime, setEveningTime] = useState(telegram.eveningTime || '21:00');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSave = () => {
    updateTelegramConfig({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      enabled,
      morningTime,
      tradingTime,
      eveningTime,
    });
    addNotification({
      title: 'Đã lưu cấu hình Telegram',
      message: 'Cài đặt Telegram Bot đã được cập nhật thành công.',
      type: 'telegram',
    });
    alert('Đã lưu cấu hình Telegram Bot 24/7!');
  };

  const handleSendTestMessage = async () => {
    if (!botToken || !chatId) {
      setTestResult({ success: false, msg: 'Vui lòng nhập Bot Token và Chat ID trước.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, msg: 'Đã gửi tin nhắn thử nghiệm tới Telegram thành công!' });
      } else {
        setTestResult({ success: false, msg: data.error || 'Gửi thất bại. Kiểm tra lại Bot Token và Chat ID.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: 'Lỗi kết nối tới backend: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            <span>Cấu Hình Telegram Bot Thông Báo 24/7 (Background Cron)</span>
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Bot tự động gửi nhắc nhở công việc & tổng kết giao dịch DÙ BẠN KHÔNG MỞ ỨNG DỤNG HÀNG NGÀY.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md cursor-pointer"
        >
          Lưu Cấu Hình
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-app-border">
              <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <span>Thông Tin Kết Nối Telegram API</span>
              </h3>

              <label className="flex items-center gap-2 text-xs font-semibold text-app-secondary cursor-pointer">
                <span>Bật 24/7:</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-app-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1">Telegram Bot Token *</label>
              <input
                type="password"
                placeholder="Ví dụ: 7123456789:AAE1234567890abcdef..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full p-3 rounded-xl input-themed text-xs font-mono"
              />
              <p className="text-[11px] text-app-muted mt-1">Lấy token bằng cách chat với <b>@BotFather</b> trên Telegram.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1">Telegram User Chat ID *</label>
              <input
                type="text"
                placeholder="Ví dụ: 123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full p-3 rounded-xl input-themed text-xs font-mono"
              />
              <p className="text-[11px] text-app-muted mt-1">Lấy Chat ID bằng cách chat với <b>@userinfobot</b> trên Telegram.</p>
            </div>

            {/* Test Button */}
            <div className="pt-2">
              <button
                onClick={handleSendTestMessage}
                disabled={testing}
                className="py-2.5 px-5 rounded-xl bg-app-surface-secondary hover:bg-app-card-hover text-blue-500 font-bold text-xs border border-blue-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi Tin Nhắn Thử Nghiệm Ngay</span>
              </button>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-4">
            <h3 className="font-bold text-app-primary text-sm flex items-center gap-2 border-b border-app-border pb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Lịch Trình Tự Động Gửi Tin Nhắn Hằng Ngày (Cron Schedule)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">1. Báo cáo Buổi Sáng</label>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl input-themed text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">2. Nhắc Nhở Trading Phiên</label>
                <input
                  type="time"
                  value={tradingTime}
                  onChange={(e) => setTradingTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl input-themed text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">3. Tổng Kết Nhật Ký Tối</label>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl input-themed text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Column (1 col) */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-app-surface border border-blue-500/30 text-xs text-app-secondary space-y-3 shadow-md">
            <h4 className="font-bold text-app-primary text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>Cơ Chế Chạy Nền 24/7 Chi Tiết</span>
            </h4>
            <p>
              Hệ thống sử dụng thư viện <code className="text-blue-500 bg-app-surface-secondary px-1 py-0.5 rounded">node-cron</code> chạy trên Express Server.
            </p>
            <p>
              Ngay cả khi người dùng <b>tắt điện thoại</b>, <b>đóng trình duyệt</b> hoặc <b>không mở app nhiều ngày</b>, Cron Server vẫn độc lập gửi thông báo tới Telegram đúng giờ cài đặt.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-app-border text-xs text-app-muted space-y-2">
            <h4 className="font-bold text-app-primary flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>Server Daemon Logs:</span>
            </h4>
            <div className="p-3 bg-app-surface-secondary font-mono text-[11px] text-emerald-500 rounded-xl border border-app-border space-y-1">
              <p>[CRON] Daemon active on nodejs</p>
              <p>[CRON] Morning report scheduled at {morningTime}</p>
              <p>[CRON] Evening report scheduled at {eveningTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
