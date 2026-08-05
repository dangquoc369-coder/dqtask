/**
 * @license
 * Notification Center History Modal Drawer
 */

import React from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const NotificationCenterModal: React.FC = () => {
  const {
    isNotificationCenterOpen,
    setNotificationCenterOpen,
    notifications,
    markNotificationRead,
    clearAllNotifications,
  } = useAppStore();

  if (!isNotificationCenterOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-app-overlay backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-app-modal border-l border-app-border shadow-2xl flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-app-primary text-sm">Trung Tâm Thông Báo</h3>
          </div>
          <button
            onClick={() => setNotificationCenterOpen(false)}
            className="p-1 rounded-lg hover:bg-app-surface-secondary text-app-muted hover:text-app-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Actions */}
        {notifications.length > 0 && (
          <div className="py-2 flex items-center justify-between text-xs text-app-muted border-b border-app-border">
            <span>{notifications.length} thông báo</span>
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-app-muted">
              Không có thông báo nào gần đây.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  n.read
                    ? 'bg-app-surface-secondary/60 border-app-border text-app-muted'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-app-primary font-medium shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-500">{n.title}</span>
                  <span className="text-[10px] text-app-muted">
                    {new Date(n.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-app-secondary text-[11px] leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
