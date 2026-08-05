import React, { useState, useEffect } from 'react';
import { Bot, Copy, Check, Zap, Server, ShieldCheck, RefreshCw, AlertCircle, Terminal, Radio } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Mql5EaSyncPanel: React.FC = () => {
  const { addTradesBatch, addNotification } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [autoSyncEa, setAutoSyncEa] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Chưa đồng bộ');
  const [syncedCount, setSyncedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [secretKey, setSecretKey] = useState('dqtaskpro_secret_key');
  const [isPolling, setIsPolling] = useState(false);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/ea/webhook`
    : 'http://localhost:3000/api/ea/webhook';

  const mql5Code = `//+------------------------------------------------------------------+
//|                                       DQTaskPro_AutoSync.mq5      |
//|                    DQ Task Pro - Automatic Trade Sync EA for MT5 |
//|                           https://github.com/dq-task-pro         |
//+------------------------------------------------------------------+
#property copyright "DQ Task Pro"
#property link      "https://github.com/dq-task-pro"
#property version   "1.00"
#property description "EA Tự động đẩy mọi lệnh vừa đóng trên MT5/VPS về Web App DQ Task Pro & Telegram ngay lập tức!"

//--- Inputs
input string   InpWebhookUrl = "${webhookUrl}"; // Webhook URL từ Web App DQ Task Pro
input string   InpSecretKey  = "${secretKey}";        // Secret Key bảo mật (Khớp với Web)
input bool     InpEnableLogs = true;                       // Hiển thị Log trong MT5 Experts tab

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("🚀 [DQ Task Pro EA] Khởi chạy thành công trên MT5/VPS!");
   Print("🌐 Webhook Endpoint: ", InpWebhookUrl);
   
   // Kiểm tra thiết lập WebRequest
   ResetLastError();
   uchar data[], result[];
   string result_headers;
   char post[];
   string headers = "Content-Type: application/json\\r\\n";
   
   int res = WebRequest("GET", InpWebhookUrl, headers, 3000, post, result, result_headers);
   if(res == -1)
   {
      int err = GetLastError();
      Print("⚠️ [CẢNH BÁO WEB-REQUEST]: Chưa bật WebRequest cho URL này!");
      Print(" 👉 Hãy vào MT5 -> Tools -> Options -> Expert Advisors -> Tích 'Allow WebRequest' và thêm URL: ", InpWebhookUrl);
   }
   else
   {
      Print("✅ [DQ Task Pro EA] Kết nối WebRequest hợp lệ (HTTP Status: ", res, ")");
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("👋 [DQ Task Pro EA] Ngừng hoạt động.");
}

//+------------------------------------------------------------------+
//| TradeTransaction function - Tự kích hoạt NGAY khi có lệnh ĐÓNG  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   // Chỉ lắng nghe khi giao dịch thuộc loại DEAL_ADD (thêm deal vào lịch sử)
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong dealTicket = trans.deal;
      if(dealTicket > 0 && HistoryDealSelect(dealTicket))
      {
         long entryType = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         
         // Chỉ xử lý deal ĐÓNG lệnh (DEAL_ENTRY_OUT)
         if(entryType == DEAL_ENTRY_OUT || entryType == DEAL_ENTRY_INOUT || entryType == DEAL_ENTRY_OUT_BY)
         {
            ulong orderTicket = HistoryDealGetInteger(dealTicket, DEAL_ORDER);
            ulong positionId  = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
            string symbol     = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
            long dealType     = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
            double volume     = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
            double price      = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
            double profit     = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
            double swap       = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
            double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
            datetime closeTime= (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
            string comment    = HistoryDealGetString(dealTicket, DEAL_COMMENT);
            
            // Xác định Hướng lệnh đóng (BUY / SELL)
            string dirStr = (dealType == DEAL_TYPE_BUY) ? "SELL" : "BUY"; // Deal out ngược với vị thế
            
            // Lấy thông tin Open Price & Open Time từ vị thế
            double openPrice = price;
            datetime openTime = closeTime - 60; // Fallback
            
            // Xây dựng JSON gửi về Webhook
            string jsonBody = StringFormat(
               "{\\"ticket\\":\\"%d\\",\\"symbol\\":\\"%s\\",\\"type\\":\\"%s\\",\\"volume\\":%.2f,\\"openPrice\\":%.5f,\\"closePrice\\":%.5f,\\"profit\\":%.2f,\\"swap\\":%.2f,\\"commission\\":%.2f,\\"openTime\\":\\"%s\\",\\"closeTime\\":\\"%s\\",\\"comment\\":\\"%s\\",\\"secretKey\\":\\"%s\\"}",
               positionId > 0 ? positionId : dealTicket,
               symbol,
               dirStr,
               volume,
               openPrice,
               price,
               profit,
               swap,
               commission,
               TimeToString(openTime, TIME_DATE|TIME_SECONDS),
               TimeToString(closeTime, TIME_DATE|TIME_SECONDS),
               comment,
               InpSecretKey
            );
            
            if(InpEnableLogs)
               Print("📤 [DQ Task Pro EA] Phát hiện lệnh đóng #", positionId, " (", symbol, ") -> Đang gửi Webhook...");
               
            SendTradeToWebhook(jsonBody);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Hàm gửi HTTP POST Request tới Webhook App                        |
//+------------------------------------------------------------------+
void SendTradeToWebhook(string jsonPayload)
{
   char postData[];
   uchar resultData[];
   string resultHeaders;
   string headers = "Content-Type: application/json\\r\\n";
   
   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   
   // Loại bỏ ký tự null byte ở cuối mảng char
   if(ArraySize(postData) > 0 && postData[ArraySize(postData)-1] == 0)
      ArrayResize(postData, ArraySize(postData)-1);
      
   ResetLastError();
   int res = WebRequest("POST", InpWebhookUrl, headers, 5000, postData, resultData, resultHeaders);
   
   if(res == 200)
   {
      string respStr = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
      Print("✅ [DQ Task Pro EA] Đẩy lệnh thành công! Response: ", respStr);
   }
   else
   {
      Print("❌ [DQ Task Pro EA] Lỗi gửi Webhook HTTP Status: ", res, " | Error code: ", GetLastError());
   }
}
`;

  // Fetch pending trades from backend buffer
  const checkEaServerBuffer = async () => {
    try {
      setIsPolling(true);
      const res = await fetch('/api/ea/trades');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.trades && data.trades.length > 0) {
          setPendingCount(data.trades.length);
          // Auto add to store
          addTradesBatch(data.trades);
          setSyncedCount((prev) => prev + data.trades.length);
          setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));

          addNotification({
            title: '🤖 MT5 EA Auto-Sync',
            message: `Đã tự động tiếp nhận ${data.trades.length} lệnh giao dịch mới từ MT5/VPS!`,
            type: 'trading',
          });

          // Clear buffer
          await fetch('/api/ea/trades', { method: 'DELETE' });
          setPendingCount(0);
        } else {
          setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
        }
      }
    } catch (err) {
      console.log('EA poll offline or client-only');
    } finally {
      setIsPolling(false);
    }
  };

  // Poll interval when AutoSync is enabled
  useEffect(() => {
    if (!autoSyncEa) return;
    checkEaServerBuffer();
    const interval = setInterval(checkEaServerBuffer, 4000); // Check every 4s
    return () => clearInterval(interval);
  }, [autoSyncEa]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mql5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-6 bg-indigo-500/5">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-md">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2">
              <span>Tự Động Đồng Bộ 100% Qua MQL5 EA (MT5 / VPS 24/7)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm">
                AUTOMATED PRO
              </span>
            </h3>
            <p className="text-xs text-app-secondary mt-0.5">
              Mỗi khi bạn đóng 1 lệnh trên MetaTrader 5 (VPS), EA sẽ gửi Webhook và tự cập nhật ngay vào Nhật Ký & Telegram mà không cần thao tác bằng tay!
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-app-surface border border-app-border text-xs text-app-secondary">
            <Radio className={`w-3.5 h-3.5 ${autoSyncEa ? 'text-emerald-400 animate-ping' : 'text-app-muted'}`} />
            <span>Lần kiểm tra cuối: <strong className="text-app-primary">{lastSyncTime}</strong></span>
          </div>

          <button
            onClick={checkEaServerBuffer}
            disabled={isPolling}
            className="p-2 rounded-xl bg-app-surface hover:bg-app-surface-secondary border border-app-border text-app-secondary hover:text-app-primary cursor-pointer transition-all active:scale-95"
            title="Đồng bộ thủ công ngay"
          >
            <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setAutoSyncEa(!autoSyncEa)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              autoSyncEa
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-app-surface border border-app-border text-app-muted'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{autoSyncEa ? 'Auto Listener: BẬT' : 'Auto Listener: TẮT'}</span>
          </button>
        </div>
      </div>

      {/* Realtime Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-app-surface border border-app-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-app-muted font-medium block">Webhook Endpoint</span>
            <span className="text-xs font-mono font-bold text-indigo-400 truncate max-w-[200px] block" title={webhookUrl}>
              /api/ea/webhook
            </span>
          </div>
          <Server className="w-4 h-4 text-indigo-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl bg-app-surface border border-app-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-app-muted font-medium block">Đã tự động đồng bộ</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {syncedCount} lệnh MT5
            </span>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl bg-app-surface border border-app-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-app-muted font-medium block">Trạng Thái Kết Nối</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Sẵn sàng đón Webhook</span>
            </span>
          </div>
          <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
        </div>
      </div>

      {/* Guide & Code Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left: Instructions Step by Step */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="font-bold text-sm text-app-primary flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">1</span>
            <span>Hướng Dẫn Cài Đặt EA Lên MT5 / VPS (3 Phút)</span>
          </h4>

          <div className="space-y-3 text-xs text-app-secondary">
            <div className="p-3 rounded-xl bg-app-surface border border-app-border space-y-1">
              <strong className="text-app-primary block">Bước 1: Copy Code MQL5</strong>
              <p className="text-app-muted text-[11px]">
                Bấm nút <b>"Copy Toàn Bộ Code MQL5"</b> ở khung bên phải.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-app-surface border border-app-border space-y-1">
              <strong className="text-app-primary block">Bước 2: Mở MetaEditor trong MT5</strong>
              <p className="text-app-muted text-[11px]">
                Trên phần mềm MT5 (hoặc VPS), bấm phím <b>F4</b> (Mở MetaEditor) → Bấm <b>File</b> → <b>New</b> → <b>Expert Advisor (template)</b> → Đặt tên <code>DQTaskPro_AutoSync</code> → Dán toàn bộ code vào và bấm <b>F7 (Compile)</b>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-app-surface border border-app-border space-y-1">
              <strong className="text-app-primary block">Bước 3: Bật WebRequest Cấu Hình URL</strong>
              <p className="text-app-muted text-[11px]">
                Vào MT5 → Bấm <b>Tools</b> → <b>Options</b> → Thẻ <b>Expert Advisors</b> → Tích chọn <code>Allow WebRequest for listed URL</code> → Thêm URL Webhook bên dưới vào danh sách:
              </p>
              <div className="p-2 rounded bg-app-surface-secondary text-[11px] font-mono text-indigo-300 break-all border border-indigo-500/20 mt-1 select-all">
                {webhookUrl}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-app-surface border border-app-border space-y-1">
              <strong className="text-app-primary block">Bước 4: Keo EA Vào Biểu Đồ</strong>
              <p className="text-app-muted text-[11px]">
                Kéo file EA <code>DQTaskPro_AutoSync</code> vào bất kỳ biểu đồ nào trên MT5 (ví dụ XAUUSD M5). Giờ đây, cứ mỗi khi đóng 1 lệnh, MT5 sẽ tự động bắn dữ liệu về Web App!
              </p>
            </div>
          </div>
        </div>

        {/* Right: Code Block with Copy Button */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-app-primary flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Source Code File: DQTaskPro_AutoSync.mq5</span>
            </label>
            <button
              onClick={handleCopyCode}
              className={`py-1.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã Copy Code MQL5!' : 'Copy Toàn Bộ Code MQL5'}</span>
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-app-border bg-[#0d1117] text-gray-300 text-xs font-mono flex-1 min-h-[350px]">
            <textarea
              readOnly
              value={mql5Code}
              className="w-full h-full min-h-[350px] p-4 bg-transparent resize-none outline-none font-mono text-[11px] leading-relaxed text-emerald-300/90"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
