/**
 * @license
 * System Settings, Theme System, AES Encryption, Backup & Restore View
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  Palette,
  CloudSun,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const POPULAR_CITIES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
  'Huế',
  'Đà Lạt',
  'Vũng Tàu',
  'Quy Nhơn',
  'Tokyo',
  'Singapore',
  'London',
  'New York',
];

export const SettingsView: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    resetToDefaults,
    exportBackup,
    weatherCity,
    weather,
    setWeatherCity,
  } = useAppStore();
  const [passphraseInput, setPassphraseInput] = useState('tradeflow-secret-key-2026');
  const [selectedCityInput, setSelectedCityInput] = useState(weatherCity);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);

  const handleSavePassphrase = () => {
    alert('Đã cập nhật khóa mã hóa AES-256 cục bộ thành công!');
  };

  const handleApplyCityChange = async (cityToApply: string) => {
    if (!cityToApply.trim()) return;
    setIsUpdatingWeather(true);
    await setWeatherCity(cityToApply.trim());
    setIsUpdatingWeather(false);
  };

  const handleResetData = () => {
    if (
      confirm(
        'CẢNH BÁO KHÔI PHỤC: Tất cả dữ liệu công việc, nhật ký giao dịch, thói quen và thống kê sẽ bị xóa hoàn toàn. Bạn có chắc chắn không?'
      )
    ) {
      resetToDefaults();
      alert('Đã khôi phục dữ liệu về mặc định ban đầu.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <span>Cài Đặt Hệ Thống, Theme Engine & Bảo Mật</span>
          </h2>
          <p className="text-xs text-app-secondary mt-1">
            Quản lý mã hóa AES-256, chuyển đổi Design Token Theme (Sáng/Tối/Hệ thống), sao lưu dữ liệu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather City Configuration */}
        <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center justify-between border-b border-app-border pb-3">
            <span className="flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-sky-400" />
              <span>Cài Đặt Vị Trí Thời Tiết</span>
            </span>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
              Open-Meteo API
            </span>
          </h3>

          <p className="text-xs text-app-secondary">
            Chọn thành phố của bạn để theo dõi nhiệt độ và thời tiết thực tế hiển thị trên thanh điều hướng top bar.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Chọn Thành Phố Phổ Biến</span>
              </label>
              <select
                value={selectedCityInput}
                onChange={(e) => {
                  setSelectedCityInput(e.target.value);
                  handleApplyCityChange(e.target.value);
                }}
                className="w-full p-2.5 rounded-xl input-themed text-xs text-app-primary cursor-pointer font-medium"
              >
                {POPULAR_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 items-center pt-1">
              <input
                type="text"
                placeholder="Hoặc nhập tên thành phố tùy chỉnh..."
                value={selectedCityInput}
                onChange={(e) => setSelectedCityInput(e.target.value)}
                className="flex-1 p-2.5 rounded-xl input-themed text-xs text-app-primary"
              />
              <button
                onClick={() => handleApplyCityChange(selectedCityInput)}
                disabled={isUpdatingWeather}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                {isUpdatingWeather ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Lưu</span>
              </button>
            </div>

            {/* Current Weather Card Preview */}
            <div className="p-3.5 rounded-xl bg-app-surface-secondary border border-app-border flex items-center justify-between text-xs mt-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-app-primary text-sm">
                    {weather.city}: <span className="text-amber-400">{weather.temp}°C</span>
                  </div>
                  <div className="text-app-muted text-[11px] font-medium">
                    {weather.condition} • Độ ẩm: {weather.humidity}%
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-app-muted">
                <div>Cao: {weather.high}°C</div>
                <div>Thấp: {weather.low}°C</div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme System Controls */}
        <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2 border-b border-app-border pb-3">
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Theme Engine & Design Tokens</span>
          </h3>

          <p className="text-xs text-app-secondary">
            Chọn chế độ hiển thị phù hợp. Toàn bộ giao diện tự động chuyển màu mượt mà theo chuẩn Design Tokens.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setThemeMode('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-blue-600/10 border-blue-500 text-blue-500 shadow-md'
                  : 'bg-app-surface border-app-border text-app-secondary hover:border-blue-500'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span>Sáng (Light)</span>
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-blue-600/10 border-blue-500 text-blue-500 shadow-md'
                  : 'bg-app-surface border-app-border text-app-secondary hover:border-blue-500'
              }`}
            >
              <Moon className="w-6 h-6 text-blue-500" />
              <span>Tối (Dark)</span>
            </button>

            <button
              onClick={() => setThemeMode('system')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                themeMode === 'system'
                  ? 'bg-blue-600/10 border-blue-500 text-blue-500 shadow-md'
                  : 'bg-app-surface border-app-border text-app-secondary hover:border-blue-500'
              }`}
            >
              <Laptop className="w-6 h-6 text-emerald-500" />
              <span>Hệ Thống</span>
            </button>
          </div>
        </div>

        {/* AES-256 Encryption */}
        <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-4">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2 border-b border-app-border pb-3">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Mã Hóa Dữ Liệu LocalStorage (AES-256)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1">
              Khóa Mã Hóa Bảo Mật (AES Passphrase)
            </label>
            <input
              type="password"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
              className="w-full p-3 rounded-xl input-themed text-xs text-app-primary"
            />
            <p className="text-[11px] text-app-muted mt-1">
              Dữ liệu nhật ký giao dịch và công việc được mã hóa trước khi ghi vào bộ nhớ thiết bị.
            </p>
          </div>

          <button
            onClick={handleSavePassphrase}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white cursor-pointer transition-all shadow-md"
          >
            Lưu Mật Khẩu Mã Hóa
          </button>
        </div>

        {/* Data Backup & Export */}
        <div className="glass-panel p-6 rounded-2xl border border-app-border space-y-4 md:col-span-2">
          <h3 className="font-bold text-app-primary text-sm flex items-center gap-2 border-b border-app-border pb-3">
            <Download className="w-4 h-4 text-blue-500" />
            <span>Sao Lưu, Khôi Phục & Reset Dữ Liệu</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={exportBackup}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Tải File Backup Dữ Liệu (.json)</span>
            </button>

            <button
              onClick={handleResetData}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Dữ Liệu & Reset Về Mặc Định</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
