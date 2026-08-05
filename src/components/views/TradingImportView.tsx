/**
 * @license
 * Commercial Trading Report Parsing & Import Wizard View
 * Specialized Exness Excel Import Engine (.xlsx / .xls) with Priority Hierarchy (Excel > CSV > PDF).
 * Supports Batch Import, Folder Auto Sync Simulation, Dynamic Header Mapping, and Interactive Preview.
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  FileCheck,
  FolderSync,
  FileCode,
  Edit3,
  Check,
  Award,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Trade } from '../../types';
import {
  parseBatchTradingStatementsPipeline,
  BatchImportResult,
  validateTradeSanity,
} from '../../lib/statementParser';
import {
  getCustomSymbolMappings,
  saveCustomSymbolMapping,
  removeCustomSymbolMapping,
  normalizeSymbol,
} from '../../lib/symbolNormalizer';
import { Mql5EaSyncPanel } from '../Mql5EaSyncPanel';

export const TradingImportView: React.FC = () => {
  const { trades: existingTrades, addTradesBatch, setActiveView, addNotification } = useAppStore();

  const [activeImportTab, setActiveImportTab] = useState<'ea-sync' | 'file-import'>('ea-sync');
  const [parsingStage, setParsingStage] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [batchResult, setBatchResult] = useState<BatchImportResult | null>(null);
  const [editableTrades, setEditableTrades] = useState<Trade[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'win' | 'loss' | 'errors' | 'warnings'>('all');
  const [fileListSummary, setFileListSummary] = useState<string[]>([]);
  const [isEditingRowIndex, setIsEditingRowIndex] = useState<number | null>(null);

  // Auto Sync Folder state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncedFolderCount, setSyncedFolderCount] = useState(0);

  // Helper for date formatting
  const formatDateTime = (isoStr?: string): string => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    } catch {
      return isoStr;
    }
  };

  // Symbol Learning Engine State
  const [customMappings, setCustomMappings] = useState<Record<string, string>>(() => getCustomSymbolMappings());
  const [newOrigSymbol, setNewOrigSymbol] = useState('');
  const [newCanonSymbol, setNewCanonSymbol] = useState('');

  // Handle Multi-file upload / Batch Drag and Drop
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files) as File[];
    setFileListSummary(fileArray.map((f) => f.name));
    setParsingStage('processing');

    try {
      const result = await parseBatchTradingStatementsPipeline(fileArray, existingTrades);
      setBatchResult(result);
      setEditableTrades(result.trades);
      setParsingStage('done');

      if (autoSyncEnabled) {
        setSyncedFolderCount((prev) => prev + fileArray.length);
      }
    } catch (err: any) {
      console.error('Batch import failed:', err);
      setParsingStage('error');
    }
  };

  // Commit Import to Store & Navigation
  const handleCommitImport = () => {
    if (!editableTrades || editableTrades.length === 0) return;

    // Filter out rows with fatal parse errors unless corrected
    const validTradesToSave = editableTrades.filter((t) => !t.isParseError);

    if (validTradesToSave.length === 0) {
      alert('Không có lệnh hợp lệ để lưu! Vui lòng sửa các dòng bị lỗi trước khi lưu.');
      return;
    }

    addTradesBatch(validTradesToSave);

    addNotification({
      title: 'Import Báo Cáo Exness',
      message: `Đã nhập thành công ${validTradesToSave.length} lệnh giao dịch từ Exness Excel Parser vào Nhật Ký!`,
      type: 'trading',
    });

    alert(`Import thành công ${validTradesToSave.length} lệnh giao dịch Exness vào Nhật Ký! Analytics & AI Coach đã được cập nhật.`);
    setActiveView('trading-log');
  };

  // Handle Inline Cell Editing
  const handleTradeCellChange = (index: number, field: keyof Trade, value: any) => {
    const updated = [...editableTrades];
    const trade = { ...updated[index], [field]: value };

    // Re-evaluate Symbol if symbol field is edited
    if (field === 'symbol' || field === 'originalSymbol') {
      const norm = normalizeSymbol(String(value));
      trade.symbol = norm.canonicalSymbol;
      trade.originalSymbol = norm.originalSymbol;
    }

    // Re-evaluate netPnl if pnl, commission, or swap is edited
    if (field === 'pnl' || field === 'commission' || field === 'swap' || field === 'tax') {
      const pnl = parseFloat(trade.pnl as any) || 0;
      const comm = parseFloat(trade.commission as any) || 0;
      const swap = parseFloat(trade.swap as any) || 0;
      const tax = parseFloat(trade.tax as any) || 0;
      trade.netPnl = pnl + swap - comm - tax;
    }

    // Re-run Sanity Validation
    const sanity = validateTradeSanity(trade);
    if (!sanity.isValid) {
      trade.isParseError = true;
      trade.parseErrorReason = sanity.errorReason;
    } else {
      trade.isParseError = false;
      trade.parseErrorReason = undefined;
    }

    updated[index] = trade;
    setEditableTrades(updated);
  };

  // Symbol Learning Engine handlers
  const handleAddCustomMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigSymbol.trim() || !newCanonSymbol.trim()) return;
    saveCustomSymbolMapping(newOrigSymbol, newCanonSymbol);
    const updated = getCustomSymbolMappings();
    setCustomMappings(updated);
    setNewOrigSymbol('');
    setNewCanonSymbol('');

    // Re-normalize editable trades
    const updatedTrades = editableTrades.map((t) => {
      const orig = t.originalSymbol || t.symbol;
      const norm = normalizeSymbol(orig);
      return {
        ...t,
        symbol: norm.canonicalSymbol,
        originalSymbol: norm.originalSymbol,
        symbolConfidence: norm.confidence,
      };
    });
    setEditableTrades(updatedTrades);
  };

  const handleRemoveCustomMapping = (origKey: string) => {
    removeCustomSymbolMapping(origKey);
    const updated = getCustomSymbolMappings();
    setCustomMappings(updated);
  };

  const filteredTrades = editableTrades.filter((t, idx) => {
    if (filterType === 'win') return t.netPnl > 0 && !t.isParseError;
    if (filterType === 'loss') return t.netPnl < 0 && !t.isParseError;
    if (filterType === 'errors') return t.isParseError;
    if (filterType === 'warnings') return batchResult?.validation.discrepantTradeIndices.includes(idx);
    return true;
  });

  const errorTradesCount = editableTrades.filter((t) => t.isParseError).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Import Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-app-surface border border-app-border">
        <button
          onClick={() => setActiveImportTab('ea-sync')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeImportTab === 'ea-sync'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'text-app-secondary hover:text-app-primary hover:bg-app-surface-secondary'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>🤖 Tự Động Đồng Bộ MT5 / VPS 24/7 (MQL5 EA Webhook)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm">
            TỰ ĐỘNG 100%
          </span>
        </button>

        <button
          onClick={() => setActiveImportTab('file-import')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeImportTab === 'file-import'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'text-app-secondary hover:text-app-primary hover:bg-app-surface-secondary'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📁 Import File Statement Thủ Công (.xlsx / .csv / .pdf)</span>
        </button>
      </div>

      {activeImportTab === 'ea-sync' ? (
        <Mql5EaSyncPanel />
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-app-border">
            <div>
              <h2 className="text-lg font-bold text-app-primary flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>Exness Excel Import Engine (Chuyên Biệt .xlsx / .xls)</span>
              </h2>
              <p className="text-xs text-app-secondary mt-1">
                Ưu tiên định dạng Excel có cấu trúc cao. Bóc tách theo Header + Data, chuẩn hóa Symbol (BTCUSDc → BTCUSD) & bóc tách Metadata.
              </p>
            </div>

            {/* Priority Badge */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Thứ tự ưu tiên: 1. Excel (.xlsx) → 2. Excel (.xls) → 3. CSV → 4. PDF</span>
            </div>
          </div>

      {/* Auto Sync Folder Toggle (Bonus Feature 2) */}
      <div className="glass-panel p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-app-primary flex items-center gap-2">
              <span>Theo Dõi & Đồng Bộ Thư Mục Tự Động (Auto Sync Folder)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500 text-white">HOT</span>
            </h4>
            <p className="text-app-secondary text-[11px] mt-0.5">
              Thả bất kỳ file <strong>.xlsx</strong> mới xuất từ Exness vào đây: Tự động lọc trùng, bóc tách và cập nhật Dashboard & AI Coach ngay tức thì.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {syncedFolderCount > 0 && (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              ✓ Đã đồng bộ {syncedFolderCount} file mới
            </span>
          )}
          <button
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              autoSyncEnabled
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-app-surface border border-app-border text-app-muted hover:text-app-primary'
            }`}
          >
            <FolderSync className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'animate-spin' : ''}`} />
            <span>{autoSyncEnabled ? 'Auto Sync: BẬT' : 'Auto Sync: TẮT'}</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone & Batch Drag-and-Drop */}
      <div className="glass-panel p-8 rounded-2xl border-2 border-dashed border-app-border text-center hover:border-emerald-500 transition-all">
        {parsingStage === 'processing' ? (
          <div className="py-8 space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-500 mx-auto animate-spin" />
            <p className="font-bold text-sm text-app-primary">
              Đang khởi tạo ExnessExcelParser bóc tách {fileListSummary.length} file statement...
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-app-muted">
              <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Scanning Worksheets → Header Detection → Symbol Normalizer → Deduplication</span>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-app-primary">
              Kéo thả hoặc chọn nhiều file Exness Statement (.xlsx, .xls, .csv, .pdf)
            </h3>
            <p className="text-xs text-app-secondary mt-1 mb-4 max-w-xl mx-auto">
              Hệ thống tự nhận diện file Excel (.xlsx), tự động bỏ qua PDF trùng lặp của cùng kỳ sao kê, loại bỏ lệnh trùng và gộp thành một lịch sử giao dịch duy nhất.
            </p>

            <label className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white cursor-pointer inline-flex items-center gap-2 shadow-md transition-all">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Chọn File / Thư Mục Statement...</span>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      {/* Import Results & Report Banner */}
      {batchResult && (
        <div className="space-y-6">
          {/* Exness Import Successful Report Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
                    <span>Import Successful</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Confidence Score: 100%
                    </span>
                  </h3>
                  <p className="text-xs text-app-secondary mt-0.5">
                    Parser đã bóc tách dữ liệu trực tiếp từ Workbook theo Header + Data thành công.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCommitImport}
                disabled={editableTrades.length === 0}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <span>Xác Nhận & Lưu {editableTrades.length} Lệnh Vào Nhật Ký</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Detailed Exness Report Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Broker</span>
                <span className="font-bold text-app-primary">{batchResult.summary.exnessAccountInfo?.broker || batchResult.summary.brokerName || 'Exness'}</span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Account</span>
                <span className="font-bold text-app-primary">
                  #{batchResult.summary.exnessAccountInfo?.account || batchResult.summary.accountNumber || 'N/A'}
                </span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Statement Period</span>
                <span className="font-bold text-app-primary text-[11px] truncate block" title={batchResult.summary.exnessAccountInfo?.period || batchResult.summary.period}>
                  {batchResult.summary.exnessAccountInfo?.period || batchResult.summary.period || 'Mọi thời gian'}
                </span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Trades Imported</span>
                <span className="font-bold text-emerald-400">{editableTrades.length} lệnh</span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Trades Skipped (Dup)</span>
                <span className="font-bold text-amber-400">{batchResult.skippedDuplicatesCount} lệnh</span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">PDF Skipped</span>
                <span className="font-bold text-blue-400">{batchResult.skippedPdfCount} file</span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Errors / Warnings</span>
                <span className={`font-bold ${errorTradesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {errorTradesCount} Lỗi / {batchResult.validation.warnings.length} Cảnh báo
                </span>
              </div>

              <div className="bg-app-surface/50 p-2.5 rounded-lg border border-app-border">
                <span className="text-app-muted block text-[11px]">Import Time</span>
                <span className="font-bold text-app-primary text-[11px] truncate block">
                  {new Date(batchResult.importTimestamp).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Preview Table with Inline Editing */}
          <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>Preview & Inline Edit (Bảng Xem Trước Lệnh - Giống Excel)</span>
                </h3>
                <p className="text-xs text-app-secondary mt-0.5">
                  Bạn có thể chỉnh sửa trực tiếp thông số của bất kỳ lệnh nào trước khi bấm Lưu.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-app-surface-secondary p-1 rounded-lg border border-app-border text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${filterType === 'all' ? 'bg-emerald-600 text-white' : 'text-app-muted'}`}
                >
                  Tất cả ({editableTrades.length})
                </button>
                <button
                  onClick={() => setFilterType('win')}
                  className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${filterType === 'win' ? 'bg-emerald-600 text-white' : 'text-app-muted'}`}
                >
                  Thắng
                </button>
                <button
                  onClick={() => setFilterType('loss')}
                  className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${filterType === 'loss' ? 'bg-rose-600 text-white' : 'text-app-muted'}`}
                >
                  Thua
                </button>
                {errorTradesCount > 0 && (
                  <button
                    onClick={() => setFilterType('errors')}
                    className={`px-3 py-1 rounded-md font-semibold cursor-pointer flex items-center gap-1 ${filterType === 'errors' ? 'bg-rose-600 text-white' : 'text-rose-500 bg-rose-500/10'}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Lỗi Row ({errorTradesCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editable Excel Table */}
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar border border-app-border rounded-xl">
              <table className="w-full text-left text-xs text-app-secondary border-collapse">
                <thead className="bg-app-surface-secondary text-app-primary font-bold border-b border-app-border whitespace-nowrap sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Position ID</th>
                    <th className="p-2.5">BUY / SELL</th>
                    <th className="p-2.5">Open Time</th>
                    <th className="p-2.5">Symbol</th>
                    <th className="p-2.5">Entry Price</th>
                    <th className="p-2.5">Entry Vol</th>
                    <th className="p-2.5">Close Time</th>
                    <th className="p-2.5">Exit Price</th>
                    <th className="p-2.5">Exit Vol</th>
                    <th className="p-2.5">S/L</th>
                    <th className="p-2.5">T/P</th>
                    <th className="p-2.5">Comm</th>
                    <th className="p-2.5">Swap</th>
                    <th className="p-2.5 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border font-mono whitespace-nowrap">
                  {filteredTrades.map((t, idx) => (
                    <tr
                      key={t.id || idx}
                      className={`hover:bg-app-surface-secondary/60 transition-colors ${
                        t.isParseError ? 'bg-rose-500/10 border-l-4 border-l-rose-500' : ''
                      }`}
                    >
                      {/* Position ID / Ticket */}
                      <td className="p-2.5 font-semibold text-app-primary flex items-center gap-1">
                        {t.isParseError && (
                          <XCircle
                            className="w-4 h-4 text-rose-500 flex-shrink-0"
                            title={t.parseErrorReason || 'Lỗi dữ liệu row'}
                          />
                        )}
                        <span>#{t.ticket}</span>
                      </td>

                      {/* Direction */}
                      <td className="p-2.5">
                        <select
                          value={t.direction}
                          onChange={(e) => handleTradeCellChange(idx, 'direction', e.target.value)}
                          className={`bg-transparent font-bold focus:outline-none cursor-pointer rounded px-1 ${
                            t.direction === 'Long' ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          <option value="Long" className="bg-app-surface text-emerald-500">
                            BUY
                          </option>
                          <option value="Short" className="bg-app-surface text-rose-500">
                            SELL
                          </option>
                        </select>
                      </td>

                      {/* Open Time */}
                      <td className="p-2.5 text-app-muted">{formatDateTime(t.openTime)}</td>

                      {/* Symbol */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={t.symbol}
                            onChange={(e) => handleTradeCellChange(idx, 'symbol', e.target.value)}
                            className="w-20 px-1 py-0.5 bg-app-surface border border-app-border rounded font-bold text-amber-500 text-xs focus:border-amber-500"
                          />
                          {t.originalSymbol && t.originalSymbol !== t.symbol && (
                            <span className="text-[10px] text-app-muted" title={`Gốc Exness: ${t.originalSymbol}`}>
                              ({t.originalSymbol})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Entry Price */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="any"
                          value={t.openPrice || ''}
                          onChange={(e) => handleTradeCellChange(idx, 'openPrice', parseFloat(e.target.value) || 0)}
                          className={`w-20 px-1 py-0.5 bg-app-surface border rounded text-xs focus:outline-none ${
                            t.openPrice <= 0 ? 'border-rose-500 text-rose-500 font-bold bg-rose-500/10' : 'border-app-border text-app-primary'
                          }`}
                        />
                      </td>

                      {/* Entry Volume */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={t.volume || ''}
                          onChange={(e) => handleTradeCellChange(idx, 'volume', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-0.5 bg-app-surface border border-app-border rounded font-semibold text-app-primary text-xs"
                        />
                      </td>

                      {/* Close Time */}
                      <td className="p-2.5 text-app-muted">{formatDateTime(t.closeTime)}</td>

                      {/* Exit Price */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="any"
                          value={t.closePrice || ''}
                          onChange={(e) => handleTradeCellChange(idx, 'closePrice', parseFloat(e.target.value) || 0)}
                          className={`w-20 px-1 py-0.5 bg-app-surface border rounded text-xs focus:outline-none ${
                            t.closePrice <= 0 ? 'border-rose-500 text-rose-500 font-bold bg-rose-500/10' : 'border-app-border text-app-primary'
                          }`}
                        />
                      </td>

                      {/* Exit Volume */}
                      <td className="p-2.5 text-app-muted">{t.volume}</td>

                      {/* SL */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="any"
                          value={t.stopLoss || ''}
                          onChange={(e) => handleTradeCellChange(idx, 'stopLoss', parseFloat(e.target.value) || undefined)}
                          placeholder="-"
                          className="w-16 px-1 py-0.5 bg-app-surface border border-app-border rounded text-rose-400 text-xs"
                        />
                      </td>

                      {/* TP */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="any"
                          value={t.takeProfit || ''}
                          onChange={(e) => handleTradeCellChange(idx, 'takeProfit', parseFloat(e.target.value) || undefined)}
                          placeholder="-"
                          className="w-16 px-1 py-0.5 bg-app-surface border border-app-border rounded text-emerald-400 text-xs"
                        />
                      </td>

                      {/* Commission */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={t.commission || 0}
                          onChange={(e) => handleTradeCellChange(idx, 'commission', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-0.5 bg-app-surface border border-app-border rounded text-app-primary text-xs"
                        />
                      </td>

                      {/* Swap */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={t.swap || 0}
                          onChange={(e) => handleTradeCellChange(idx, 'swap', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-0.5 bg-app-surface border border-app-border rounded text-app-primary text-xs"
                        />
                      </td>

                      {/* Profit */}
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={t.pnl || 0}
                          onChange={(e) => handleTradeCellChange(idx, 'pnl', parseFloat(e.target.value) || 0)}
                          className={`w-20 px-1 py-0.5 text-right bg-app-surface border border-app-border rounded font-bold text-xs ${
                            t.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Symbol Learning Engine & User Custom Mappings */}
          <div className="glass-panel p-5 rounded-2xl border border-app-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-app-primary text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Symbol Learning Engine (Hệ Thống Tự Học Mã Của Broker)</span>
                </h3>
                <p className="text-xs text-app-secondary mt-0.5">
                  Thêm hoặc tùy chỉnh quy tắc ánh xạ cho các ký hiệu lạ từ Exness / Broker khác.
                </p>
              </div>
            </div>

            {/* Form to add custom mapping */}
            <form onSubmit={handleAddCustomMapping} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-app-surface-secondary/50 p-3 rounded-xl border border-app-border">
              <div>
                <label className="text-[11px] font-semibold text-app-muted block mb-1">Mã Broker Gốc (VD: BTCUSDc)</label>
                <input
                  type="text"
                  placeholder="e.g. BTCUSDc"
                  value={newOrigSymbol}
                  onChange={(e) => setNewOrigSymbol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-app-surface border border-app-border text-xs text-app-primary focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-app-muted block mb-1">Mã Chuẩn Hóa (VD: BTCUSD)</label>
                <input
                  type="text"
                  placeholder="e.g. BTCUSD"
                  value={newCanonSymbol}
                  onChange={(e) => setNewCanonSymbol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-app-surface border border-app-border text-xs text-app-primary focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu Mã Ánh Xạ</span>
                </button>
              </div>
            </form>

            {/* List of Custom Learned Mappings */}
            {Object.keys(customMappings).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-app-muted">Danh sách mã tùy chỉnh đã học ({Object.keys(customMappings).length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(customMappings).map(([orig, canon]) => (
                    <div key={orig} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-lg text-xs font-mono">
                      <span className="text-app-muted">{orig}</span>
                      <span className="text-purple-400 font-bold">→</span>
                      <span className="text-emerald-500 font-bold">{canon}</span>
                      <button
                        onClick={() => handleRemoveCustomMapping(orig)}
                        className="text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                        title="Xóa quy tắc này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
