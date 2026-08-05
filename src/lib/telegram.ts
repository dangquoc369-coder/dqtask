/**
 * @license
 * Telegram Notification & Bot Integration Engine
 * Sends styled HTML messages directly or via Express Server background scheduler.
 */

import { TelegramConfig } from '../types';

export interface SendTelegramMessageParams {
  botToken: string;
  chatId: string;
  messageHtml: string;
}

export async function sendTelegramMessageDirectly({
  botToken,
  chatId,
  messageHtml,
}: SendTelegramMessageParams): Promise<{ success: boolean; error?: string }> {
  if (!botToken || !chatId) {
    return { success: false, error: 'Thiếu Telegram Bot Token hoặc Chat ID.' };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.description || 'Lỗi từ Telegram Bot API.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến máy chủ Telegram Bot.',
    };
  }
}

export async function testTelegramBot(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message: string }> {
  const testMessage = `
🤖 <b>TRADING & LIFE SYNC BOT - KẾT NỐI THÀNH CÔNG!</b>

✅ Hệ thống nhắc nhở tự động 24/7 đã kích hoạt.
📅 Thời gian: ${new Date().toLocaleString('vi-VN')}

bạn sẽ nhận được thông báo hằng ngày cho:
• Nhiệm vụ & Thói quen
• Phiên giao dịch & Quản trị rủi ro
• Báo cáo tổng kết tuần & tháng

 chúc bạn một ngày kỷ luật và lợi nhuận!
`;

  const res = await sendTelegramMessageDirectly({
    botToken,
    chatId,
    messageHtml: testMessage,
  });

  if (res.success) {
    return { success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công đến Telegram!' };
  } else {
    return { success: false, message: res.error || 'Thất bại khi gửi thử nghiệm.' };
  }
}

export function formatMorningMessage(dateStr: string, tasks: string[], checklist: string[]): string {
  const taskLines = tasks.length > 0 ? tasks.map((t) => `• ${t}`).join('\n') : '• Chưa có nhiệm vụ ưu tiên';
  const checklistLines =
    checklist.length > 0 ? checklist.map((c) => `☑️ ${c}`).join('\n') : '☑️ Đọc lịch kinh tế\n☑️ Kiểm tra ATR & Risk';

  return `
🌞 <b>CHÀO BUỔI SÁNG!</b>

📅 Today: <b>${dateStr}</b>

🎯 <b>Nhiệm vụ hôm nay:</b>
${taskLines}

📋 <b>Checklist Kỷ Luật:</b>
${checklistLines}

🔥 <i>"Kỷ luật là khoảng cách giữa mục tiêu và thành tựu!"</i>
`;
}

export function formatTradingReminderMessage(sessionName: string, advice: string): string {
  return `
📈 <b>CẢNH BÁO PHIÊN GIAO DỊCH (${sessionName.toUpperCase()})</b>

⚠️ <b>Lưu ý quan trọng:</b>
${advice}

🛑 <b>Quy tắc sống còn:</b>
1. Luôn đặt Stop Loss trước khi nhấp lệnh.
2. Rủi ro tối đa 1-2% / tài khoản.
3. Không FOMO & Không Revenge Trade!
`;
}

export function formatWeeklyReportMessage(
  weekStr: string,
  taskCompletionRate: number,
  tradingStats: { winRate: number; pf: number; netProfit: number; drawdown: number },
  habitRate: number
): string {
  return `
📊 <b>BÁO CÁO TỔNG KẾT TUẦN (${weekStr})</b>

✅ <b>Công việc:</b> Hoàn thành <b>${taskCompletionRate}%</b>
⚡ <b>Thói quen:</b> Đạt <b>${habitRate}%</b>

📈 <b>Giao dịch Trading:</b>
• Winrate: <b>${tradingStats.winRate}%</b>
• Profit Factor: <b>${tradingStats.pf}</b>
• Drawdown: <b>${tradingStats.drawdown}%</b>
• Lợi nhuận ròng: <b>$${tradingStats.netProfit}</b>

💪 <i>Tiếp tục duy trì phong độ và tinh thần kỷ luật vào tuần tới!</i>
`;
}
