/**
 * @license
 * TradeFlow & Life Sync - Full-Stack Express Server
 * Hosts API endpoints, Gemini 3.6 Flash AI Trading Coach, and 24/7 Telegram Cron Scheduler.
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory server store for Telegram configuration & background scheduler
let serverTelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  enabled: true,
  morningTime: '07:00',
  tradingTime: '14:00',
  eveningTime: '21:00',
  weeklyDay: 1, // Monday
  weeklyTime: '20:00',
};

// Log of sent messages
const scheduledMessageLog: Array<{ time: string; type: string; status: string }> = [];

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    telegramScheduler: serverTelegramConfig.enabled ? 'Active 24/7' : 'Disabled',
  });
});

// API: Weather proxy (100% Free Open-Meteo API, No API Key Required)
const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  'Hà Nội': { lat: 21.0285, lon: 105.8542, name: 'Hà Nội' },
  'TP. Hồ Chí Minh': { lat: 10.8231, lon: 106.6297, name: 'TP. Hồ Chí Minh' },
  'Đà Nẵng': { lat: 16.0544, lon: 108.2022, name: 'Đà Nẵng' },
  'Hải Phòng': { lat: 20.8449, lon: 106.6881, name: 'Hải Phòng' },
  'Cần Thơ': { lat: 10.0452, lon: 105.7469, name: 'Cần Thơ' },
  'Nha Trang': { lat: 12.2388, lon: 109.1967, name: 'Nha Trang' },
  'Huế': { lat: 16.4637, lon: 107.5909, name: 'Huế' },
  'Đà Lạt': { lat: 11.9404, lon: 108.4583, name: 'Đà Lạt' },
  'Vũng Tàu': { lat: 10.3460, lon: 107.0843, name: 'Vũng Tàu' },
  'Quy Nhơn': { lat: 13.7820, lon: 109.2197, name: 'Quy Nhơn' },
  'Tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  'Singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  'London': { lat: 51.5074, lon: -0.1278, name: 'London' },
  'New York': { lat: 40.7128, lon: -74.0060, name: 'New York' },
};

app.get('/api/weather', async (req, res) => {
  const queryCity = (req.query.city as string) || 'Hà Nội';
  let coords = CITY_COORDINATES[queryCity];

  if (!coords) {
    const matchedKey = Object.keys(CITY_COORDINATES).find(
      (k) => k.toLowerCase() === queryCity.toLowerCase()
    );
    coords = matchedKey ? CITY_COORDINATES[matchedKey] : { lat: 21.0285, lon: 105.8542, name: queryCity };
  }

  const { lat, lon, name } = coords;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
    );
    if (response.ok) {
      const data = await response.json();
      const temp = Math.round(data.current?.temperature_2m ?? 30);
      const humidity = Math.round(data.current?.relative_humidity_2m ?? 65);
      const code = data.current?.weather_code ?? 0;
      let condition = 'Nắng ráo';
      if (code >= 1 && code <= 3) condition = 'Có mây nhẹ';
      else if (code >= 45 && code <= 48) condition = 'Sương mù';
      else if (code >= 51 && code <= 67) condition = 'Mưa nhẹ';
      else if (code >= 71) condition = 'Mưa dông / Tuyết';

      return res.json({
        city: name,
        temp,
        condition,
        high: temp + 3,
        low: temp - 4,
        humidity,
        icon: 'Sun',
        isFreeApi: true,
      });
    }
  } catch (err) {
    console.log('Open-Meteo Weather Fetch fallback used.');
  }

  // Fallback if network offline
  res.json({
    city: name,
    temp: 30,
    condition: 'Nắng ráo',
    high: 33,
    low: 26,
    humidity: 65,
    icon: 'Sun',
    isFreeApi: true,
  });
});

// API: Telegram Test Endpoint
app.post('/api/telegram/test', async (req, res) => {
  const { botToken, chatId } = req.body;
  const token = botToken || serverTelegramConfig.botToken;
  const chat = chatId || serverTelegramConfig.chatId;

  if (!token || !chat) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu Telegram Bot Token hoặc Chat ID.',
    });
  }

  const testMessage = `
🤖 <b>TRADING & LIFE SYNC - 24/7 DAEMON ONLINE</b>

✅ Kết nối Telegram Bot thành công!
⏰ Server Time: ${new Date().toLocaleString('vi-VN')}
🔄 Scheduler: Đang chạy ngầm 24/7 trên máy chủ.

Chúc bạn một ngày làm việc hiệu quả và giao dịch kỷ luật!
`;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const data = await telegramRes.json();
    if (data.ok) {
      // Save config if working
      serverTelegramConfig.botToken = token;
      serverTelegramConfig.chatId = chat;
      serverTelegramConfig.enabled = true;
      res.json({ success: true, message: 'Đã gửi tin nhắn Telegram thành công!' });
    } else {
      res.status(400).json({ success: false, error: data.description || 'Lỗi Telegram API' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi kết nối server' });
  }
});

// API: Save Telegram Config
app.post('/api/telegram/config', (req, res) => {
  const { botToken, chatId, enabled, morningTime, tradingTime, eveningTime } = req.body;
  if (botToken) serverTelegramConfig.botToken = botToken;
  if (chatId) serverTelegramConfig.chatId = chatId;
  if (enabled !== undefined) serverTelegramConfig.enabled = enabled;
  if (morningTime) serverTelegramConfig.morningTime = morningTime;
  if (tradingTime) serverTelegramConfig.tradingTime = tradingTime;
  if (eveningTime) serverTelegramConfig.eveningTime = eveningTime;

  res.json({
    success: true,
    message: 'Cấu hình Telegram Bot Scheduler đã lưu thành công.',
    config: serverTelegramConfig,
  });
});

// API: Send Custom Telegram Message
app.post('/api/telegram/send', async (req, res) => {
  const { message } = req.body;
  const token = serverTelegramConfig.botToken;
  const chat = serverTelegramConfig.chatId;

  if (!token || !chat) {
    return res.status(400).json({ success: false, error: 'Telegram Bot chưa được cấu hình.' });
  }

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await telegramRes.json();
    if (data.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: data.description });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Offline Quant Trading Coach status endpoint
app.post('/api/ai/trading-coach', (req, res) => {
  res.json({
    success: true,
    message: 'Toàn bộ phân tích đã được chuyển sang chế độ Toán Học Định Lượng Offline 100% miễn phí trên trình duyệt.',
  });
});

// ==========================================
// MQL5 EXPERT ADVISOR (MT5 / VPS 24/7) WEBHOOKS
// ==========================================
const eaTradesBuffer: Array<any> = [];

// API: MT5 EA Webhook receiver
app.post('/api/ea/webhook', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.ticket || !payload.symbol) {
      return res.status(400).json({ success: false, error: 'Dữ liệu lệnh không hợp lệ từ MT5 EA.' });
    }

    const pnl = Number(payload.profit || 0);
    const comm = Number(payload.commission || 0);
    const swap = Number(payload.swap || 0);
    const netPnl = pnl + comm + swap;

    const formattedTrade = {
      id: `ea_${payload.ticket}_${Date.now()}`,
      ticket: String(payload.ticket),
      symbol: String(payload.symbol).toUpperCase().replace('.', ''),
      direction: String(payload.type).toUpperCase() === 'BUY' || String(payload.type) === '0' ? 'BUY' : 'SELL',
      volume: Number(payload.volume || 0),
      openPrice: Number(payload.openPrice || 0),
      closePrice: Number(payload.closePrice || 0),
      sl: Number(payload.sl || 0),
      tp: Number(payload.tp || 0),
      pnl: pnl,
      commission: comm,
      swap: swap,
      netPnl: netPnl,
      openTime: payload.openTime || new Date().toISOString(),
      closeTime: payload.closeTime || new Date().toISOString(),
      comment: payload.comment || 'Tự động đẩy từ MQL5 EA MT5 VPS',
      pips: Number(payload.pips || 0),
      riskReward: Number(payload.rr || 0),
      importedFrom: 'MQL5 EA VPS 24/7',
      importedAt: new Date().toISOString(),
    };

    // Deduplicate in buffer
    const exists = eaTradesBuffer.some((t) => t.ticket === formattedTrade.ticket);
    if (!exists) {
      eaTradesBuffer.unshift(formattedTrade);
    }

    // Send Instant Telegram Notification if bot configured
    if (serverTelegramConfig.enabled && serverTelegramConfig.botToken && serverTelegramConfig.chatId) {
      const isWin = netPnl >= 0;
      const emoji = isWin ? '🟢 WIN' : '🔴 LOSS';
      const tgMsg = `
⚡ <b>[MT5 EA AUTO-SYNC] LỆNH VỪA ĐÓNG!</b>

🎫 Ticket: <code>#${formattedTrade.ticket}</code>
📈 Cặp tiền: <b>${formattedTrade.symbol}</b> (${formattedTrade.direction})
📊 Khối lượng: <b>${formattedTrade.volume} Lot</b>
💵 Lợi nhuận Net: <b>${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}</b> (${emoji})
⏱️ Thời gian đóng: ${new Date(formattedTrade.closeTime).toLocaleString('vi-VN')}

🌐 <i>Lệnh đã tự động đồng bộ vào Nhật Ký DQ Task Pro!</i>
`;
      try {
        fetch(`https://api.telegram.org/bot${serverTelegramConfig.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: serverTelegramConfig.chatId,
            text: tgMsg,
            parse_mode: 'HTML',
          }),
        }).catch(() => {});
      } catch (err) {
        // silent fail for telegram
      }
    }

    console.log(`[MT5 EA Webhook] Received closed trade #${formattedTrade.ticket} (${formattedTrade.symbol}) PnL: $${netPnl}`);

    return res.json({
      success: true,
      message: `Đã tiếp nhận thành công lệnh #${formattedTrade.ticket} từ MT5 EA.`,
      trade: formattedTrade,
    });
  } catch (err: any) {
    console.error('[MT5 EA Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Fetch pending EA trades for frontend app sync
app.get('/api/ea/trades', (req, res) => {
  res.json({
    success: true,
    count: eaTradesBuffer.length,
    trades: eaTradesBuffer,
  });
});

// API: Clear EA trades buffer after sync
app.delete('/api/ea/trades', (req, res) => {
  eaTradesBuffer.length = 0;
  res.json({ success: true, message: 'Đã xóa bộ nhớ đệm EA trades.' });
});

// 24/7 BACKGROUND TELEGRAM CRON SCHEDULER
// Runs every minute to dispatch automated alerts even when client browser is closed!
cron.schedule('* * * * *', async () => {
  if (!serverTelegramConfig.enabled || !serverTelegramConfig.botToken || !serverTelegramConfig.chatId) {
    return;
  }

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Morning Reminder
  if (currentTimeStr === serverTelegramConfig.morningTime) {
    const morningMsg = `
🌞 <b>CHÀO BUỔI SÁNG SÁNG TẠO!</b>

📅 Ngày: <b>${todayDateStr}</b>

🎯 <b>Nhiệm vụ & Kỷ Luật Buổi Sáng:</b>
1. Kiểm tra Lịch Kinh Tế & Tin Tức Đỏ (USD, EUR, GBP)
2. Xác định Bias & Đánh dấu vùng Supply/Demand
3. Tính toán Lot Size phù hợp Risk 1%
4. Giữ tâm lý bình tĩnh, không vào lệnh nếu chưa đúng Setup!

 chúc bạn một ngày đạt lợi nhuận và kỷ luật!
`;
    try {
      await fetch(`https://api.telegram.org/bot${serverTelegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: serverTelegramConfig.chatId,
          text: morningMsg,
          parse_mode: 'HTML',
        }),
      });
      scheduledMessageLog.push({
        time: new Date().toISOString(),
        type: 'Morning Reminder',
        status: 'Success',
      });
    } catch (err) {
      console.error('Failed sending morning cron reminder:', err);
    }
  }

  // Trading Session Reminder (London/NY)
  if (currentTimeStr === serverTelegramConfig.tradingTime) {
    const tradingMsg = `
📈 <b>CẢNH BÁO PHIÊN GIAO DỊCH CHIỀU (LONDON / NEW YORK)</b>

⏰ Đã đến thời điểm biến động giá tăng cao!

🛑 <b>Nhắc nhở Kỷ luật Giao dịch:</b>
• Luôn đặt Stop Loss trước khi vào lệnh.
• Tuyệt đối không FOMO theo các cây nến rút chân bẫy.
• Nếu vừa dính SL, dừng lại 15 phút, không Revenge Trade!
`;
    try {
      await fetch(`https://api.telegram.org/bot${serverTelegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: serverTelegramConfig.chatId,
          text: tradingMsg,
          parse_mode: 'HTML',
        }),
      });
      scheduledMessageLog.push({
        time: new Date().toISOString(),
        type: 'Trading Reminder',
        status: 'Success',
      });
    } catch (err) {
      console.error('Failed sending trading cron reminder:', err);
    }
  }

  // Evening Review Reminder
  if (currentTimeStr === serverTelegramConfig.eveningTime) {
    const eveningMsg = `
🌙 <b>TỔNG KẾT & GHI NHẬT KÝ BUỔI TỐI</b>

⏰ Đã 21:00! Đã đến lúc xem lại kết quả hôm nay:

📝 <b>Checklist Buổi Tối:</b>
1. Đánh giá lại tất cả lệnh giao dịch hôm nay.
2. Cập nhật chỉ số Tâm trạng, Giấc ngủ, Năng lượng.
3. Hoàn thành 100% thói quen trước khi đi ngủ.

Tắt màn hình sớm trước 23:00 để phục hồi năng lượng tốt nhất!
`;
    try {
      await fetch(`https://api.telegram.org/bot${serverTelegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: serverTelegramConfig.chatId,
          text: eveningMsg,
          parse_mode: 'HTML',
        }),
      });
      scheduledMessageLog.push({
        time: new Date().toISOString(),
        type: 'Evening Review',
        status: 'Success',
      });
    } catch (err) {
      console.error('Failed sending evening cron reminder:', err);
    }
  }
});

// Vite Dev Middleware & Production Dist Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Telegram 24/7 Cron Daemon initialized.`);
  });
}

startServer();
