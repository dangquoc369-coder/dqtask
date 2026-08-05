/**
 * @license
 * Prominent PWA Installation Banner & Guide
 */

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, Check } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-xs text-app-secondary flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="DQ Task Pro Logo"
          className="w-11 h-11 rounded-xl object-cover border border-indigo-500/30 shadow-md shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
        />
        <div>
          <h4 className="font-bold text-app-primary text-sm flex items-center gap-2">
            <span>Cài đặt ứng dụng DQ task pro trên Điện Thoại & Desktop</span>
            <span className="px-2 py-0.5 text-[9px] bg-emerald-500/15 text-emerald-500 font-bold rounded-full">
              OFFLINE READY
            </span>
          </h4>
          <p className="text-app-muted mt-0.5">
            Dùng như app gốc trên iOS, Android, Tablet và Máy tính. Hoạt động khi tắt mạng & nhận thông báo Telegram 24/7.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          onClick={handleInstallClick}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{deferredPrompt ? 'Cài Đặt Ngay' : 'Hướng Dẫn Cài'}</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-2 rounded-xl hover:bg-app-surface-secondary text-app-muted hover:text-app-primary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-overlay backdrop-blur-sm">
          <div className="w-full max-w-md bg-app-modal border border-app-border rounded-2xl p-6 text-left shadow-2xl">
            <h3 className="text-base font-bold text-app-primary mb-3">Hướng Dẫn Cài Đặt PWA App</h3>
            <div className="space-y-3 text-xs text-app-secondary">
              <div className="p-3 bg-app-surface-secondary rounded-xl border border-app-border">
                <b className="text-indigo-500 block mb-1">📱 Trên iPhone / iPad (Safari):</b>
                1. Nhấn nút <b>Chia sẻ (Share)</b> ở thanh công cụ Safari.<br />
                2. Chọn <b>Thêm vào Màn hình chính (Add to Home Screen)</b>.
              </div>

              <div className="p-3 bg-app-surface-secondary rounded-xl border border-app-border">
                <b className="text-emerald-500 block mb-1">🤖 Trên Android (Chrome / Edge):</b>
                1. Nhấn dấu <b>3 chấm (Menu)</b> ở góc trên phải.<br />
                2. Chọn <b>Cài đặt ứng dụng (Install app)</b> hoặc Thêm vào màn hình chính.
              </div>

              <div className="p-3 bg-app-surface-secondary rounded-xl border border-app-border">
                <b className="text-amber-500 block mb-1">💻 Trên Máy Tính (Desktop):</b>
                1. Nhấn biểu tượng <b>Cài đặt (Install)</b> trên thanh địa chỉ URL trình duyệt Chrome/Edge.
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-md cursor-pointer"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
