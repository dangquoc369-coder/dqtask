/**
 * Quant Coach - Professional Algorithmic Trade & Risk Analysis Engine
 * 100% Offline, Free, Deterministic Mathematical & Behavioral Analysis
 */

import { Trade } from '../types';

export interface QuantReport {
  id: string;
  createdAt: string;
  overallRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  overallScore: number; // 0 - 100
  summary: string;
  
  // Mathematical Risk Metrics
  kellyPercent: number; // Full Kelly %
  halfKellyPercent: number; // Half Kelly % (Recommended)
  expectancy: number; // Expected return per $1 risk
  riskOfRuinPercent: number; // % Probability of 50% drawdown
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number; // Avg Win / Avg Loss
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  
  // Psychological & Behavioral Audit
  overtradingRisk: 'Thấp' | 'Trung Bằng' | 'Cao' | 'Nghiêm Trọng';
  revengeTradingCount: number;
  volumeTiltCount: number;
  noStopLossCount: number;
  
  // Strengths & Weaknesses
  strengths: string[];
  weaknesses: string[];
  badHabits: string[];
  psychologyCritique: string;
  stopLossCompliance: string;
  
  // Best/Worst Analysis
  bestSetup?: { name: string; winRate: number; netPnl: number };
  worstSetup?: { name: string; winRate: number; netPnl: number };
  bestSession?: { name: string; winRate: number; netPnl: number };
  
  // Actionable Rules
  actionableRules: string[];
}

export function generateQuantReport(trades: Trade[], accountBalance: number = 10000): QuantReport {
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return {
      id: `quant-report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      overallRating: 'C',
      overallScore: 60,
      summary: 'Chưa có dữ liệu lệnh giao dịch. Hãy nhập nhật ký lệnh hoặc import statement để hệ thống phân tích định lượng.',
      kellyPercent: 0,
      halfKellyPercent: 0,
      expectancy: 0,
      riskOfRuinPercent: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      maxDrawdownDollar: 0,
      maxDrawdownPercent: 0,
      overtradingRisk: 'Thấp',
      revengeTradingCount: 0,
      volumeTiltCount: 0,
      noStopLossCount: 0,
      strengths: ['Sẵn sàng ghi chép nhật ký giao dịch.'],
      weaknesses: ['Chưa đủ mẫu dữ liệu lệnh để tính toán chỉ số.'],
      badHabits: [],
      psychologyCritique: 'Cần thực hiện ít nhất 5-10 lệnh để thuật toán tính toán chính xác.',
      stopLossCompliance: 'Chưa có dữ liệu.',
      actionableRules: [
        'Ghi chép đầy đủ Stop loss, Take profit và Setup cho từng lệnh.',
        'Tuân thủ tối đa 1-2% rủi ro tài khoản trên mỗi vị thế mở.',
        'Tránh giao dịch ngẫu nhiên khi chưa có tín hiệu từ chiến lược.',
      ],
    };
  }

  // 1. Basic Stats
  const wins = trades.filter((t) => t.netPnl > 0);
  const losses = trades.filter((t) => t.netPnl < 0);
  const winCount = wins.length;
  const lossCount = losses.length;
  const winRate = (winCount / totalTrades) * 100;

  const totalProfit = wins.reduce((acc, t) => acc + t.netPnl, 0);
  const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 99 : 0;

  const avgWin = winCount > 0 ? totalProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 5 : 1;

  // 2. Expectancy: EV = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const winProb = winRate / 100;
  const lossProb = 1 - winProb;
  const expectancy = winProb * avgWin - lossProb * avgLoss;

  // 3. Kelly Criterion %: K = W - [(1 - W) / R]
  let kellyPercent = 0;
  if (winLossRatio > 0) {
    kellyPercent = (winProb - lossProb / winLossRatio) * 100;
  }
  kellyPercent = Math.max(-50, Math.min(25, kellyPercent)); // Cap for sanity
  const halfKellyPercent = Math.max(0, kellyPercent / 2);

  // 4. Max Drawdown
  let peak = accountBalance;
  let maxDD = 0;
  let currentBal = accountBalance;

  // Sort trades by open/close date if available
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(a.closeTime || a.openTime).getTime() - new Date(b.closeTime || b.openTime).getTime();
  });

  for (const t of sortedTrades) {
    currentBal += t.netPnl;
    if (currentBal > peak) peak = currentBal;
    const dd = peak - currentBal;
    if (dd > maxDD) maxDD = dd;
  }
  const maxDDPercent = peak > 0 ? (maxDD / peak) * 100 : 0;

  // 5. Risk of Ruin (Perry Kaufman formula approximation for 50% drawdown)
  // RoR = ((1 - Edge) / (1 + Edge)) ^ Units
  let riskOfRuin = 0;
  if (expectancy <= 0) {
    riskOfRuin = 100;
  } else {
    const edge = winProb - lossProb;
    if (edge <= 0) {
      riskOfRuin = 85;
    } else {
      const units = 20; // 50% drawdown threshold at 2.5% risk
      riskOfRuin = Math.pow((1 - edge) / (1 + edge), units) * 100;
      riskOfRuin = Math.min(100, Math.max(0.1, riskOfRuin));
    }
  }

  // 6. Behavioral & Tilt Auditing
  let revengeTradingCount = 0;
  let volumeTiltCount = 0;
  let noStopLossCount = 0;

  for (let i = 0; i < sortedTrades.length; i++) {
    const t = sortedTrades[i];
    if (!t.stopLoss || t.stopLoss === 0) {
      noStopLossCount++;
    }

    if (i > 0) {
      const prev = sortedTrades[i - 1];
      // Check revenge trading: trade opened within 30 min after a loss
      if (prev.netPnl < 0) {
        const timeDiffMinutes = (new Date(t.openTime).getTime() - new Date(prev.closeTime || prev.openTime).getTime()) / 60000;
        if (timeDiffMinutes >= 0 && timeDiffMinutes <= 30) {
          revengeTradingCount++;
        }
        // Check volume tilt: lot size increased by >50% right after a loss
        if (t.volume > prev.volume * 1.4) {
          volumeTiltCount++;
        }
      }
    }
  }

  // Overtrading Risk Level
  let overtradingRisk: 'Thấp' | 'Trung Bằng' | 'Cao' | 'Nghiêm Trọng' = 'Thấp';
  const tradesPerDayAvg = totalTrades / Math.max(1, Math.ceil(totalTrades / 5));
  if (revengeTradingCount > 3 || tradesPerDayAvg > 10) {
    overtradingRisk = 'Nghiêm Trọng';
  } else if (revengeTradingCount > 1 || tradesPerDayAvg > 5) {
    overtradingRisk = 'Cao';
  } else if (tradesPerDayAvg > 3) {
    overtradingRisk = 'Trung Bằng';
  }

  // 7. Setup & Session Analysis
  const setupMap: Record<string, { wins: number; total: number; pnl: number }> = {};
  const sessionMap: Record<string, { wins: number; total: number; pnl: number }> = {};

  trades.forEach((t) => {
    const sName = t.setup || 'Không ghi nhận';
    if (!setupMap[sName]) setupMap[sName] = { wins: 0, total: 0, pnl: 0 };
    setupMap[sName].total++;
    setupMap[sName].pnl += t.netPnl;
    if (t.netPnl > 0) setupMap[sName].wins++;

    const sess = t.session || 'Khác';
    if (!sessionMap[sess]) sessionMap[sess] = { wins: 0, total: 0, pnl: 0 };
    sessionMap[sess].total++;
    sessionMap[sess].pnl += t.netPnl;
    if (t.netPnl > 0) sessionMap[sess].wins++;
  });

  let bestSetupName = '';
  let bestSetupPnl = -Infinity;
  let worstSetupName = '';
  let worstSetupPnl = Infinity;

  Object.entries(setupMap).forEach(([name, data]) => {
    if (data.total >= 1) {
      if (data.pnl > bestSetupPnl) {
        bestSetupPnl = data.pnl;
        bestSetupName = name;
      }
      if (data.pnl < worstSetupPnl) {
        worstSetupPnl = data.pnl;
        worstSetupName = name;
      }
    }
  });

  let bestSessionName = '';
  let bestSessionPnl = -Infinity;
  Object.entries(sessionMap).forEach(([name, data]) => {
    if (data.pnl > bestSessionPnl) {
      bestSessionPnl = data.pnl;
      bestSessionName = name;
    }
  });

  // 8. Overall Score Calculation (0 - 100)
  let score = 50; // Base score

  // Winrate & Profit Factor bonus (max +30)
  if (profitFactor >= 2.0) score += 20;
  else if (profitFactor >= 1.5) score += 15;
  else if (profitFactor >= 1.1) score += 10;
  else score -= 10;

  if (winRate >= 60) score += 10;
  else if (winRate >= 45) score += 5;

  // Expectancy bonus (max +15)
  if (expectancy > 0) score += 15;
  else score -= 15;

  // Drawdown penalty (max -20)
  if (maxDDPercent < 5) score += 10;
  else if (maxDDPercent < 12) score += 5;
  else if (maxDDPercent > 25) score -= 15;

  // Behavioral penalties
  if (revengeTradingCount === 0) score += 10;
  else score -= revengeTradingCount * 5;

  if (noStopLossCount === 0) score += 10;
  else score -= noStopLossCount * 4;

  if (volumeTiltCount > 0) score -= volumeTiltCount * 5;

  score = Math.max(10, Math.min(100, Math.round(score)));

  let overallRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  if (score >= 92) overallRating = 'A+';
  else if (score >= 82) overallRating = 'A';
  else if (score >= 70) overallRating = 'B';
  else if (score >= 58) overallRating = 'C';
  else if (score >= 45) overallRating = 'D';
  else overallRating = 'F';

  // 9. Strengths, Weaknesses, Bad Habits
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const badHabits: string[] = [];
  const actionableRules: string[] = [];

  if (profitFactor >= 1.5) {
    strengths.push(`Hệ số Lợi Nhuận (Profit Factor) đạt ${profitFactor.toFixed(2)}, thuộc top giao dịch kỳ vọng dương.`);
  }
  if (winRate >= 55) {
    strengths.push(`Tỷ lệ thắng ổn định (${winRate.toFixed(1)}%), cho thấy điểm vào lệnh đúng nhịp thị trường.`);
  }
  if (noStopLossCount === 0) {
    strengths.push('Kỷ luật 100% đặt Stop Loss bảo vệ tài khoản cho mọi lệnh mở.');
  }
  if (expectancy > 0) {
    strengths.push(`Mỗi lệnh đặt rủi ro mang lại kỳ vọng lợi nhuận trung bình +$${expectancy.toFixed(2)}.`);
  }
  if (bestSetupName && setupMap[bestSetupName]) {
    const sData = setupMap[bestSetupName];
    const sWin = ((sData.wins / sData.total) * 100).toFixed(0);
    strengths.push(`Setup tốt nhất: "${bestSetupName}" đạt winrate ${sWin}% mang về +$${sData.pnl.toFixed(2)}.`);
  }

  if (strengths.length === 0) {
    strengths.push('Duy trì việc ghi chép nhật ký lệnh đầy đủ để thuật toán tiếp tục theo dõi.');
  }

  // Weaknesses
  if (profitFactor < 1.0) {
    weaknesses.push(`Hệ số Profit Factor < 1.0 (${profitFactor.toFixed(2)}) làm tài khoản bị sụt giảm theo thời gian.`);
  }
  if (winLossRatio < 1.0) {
    weaknesses.push(`Tỷ lệ Thắng/Thua về số tiền (${winLossRatio.toFixed(2)}) quá thấp. Trung bình thua đậm hơn thắng.`);
  }
  if (maxDDPercent > 15) {
    weaknesses.push(`Mức sụt giảm tối đa (Max Drawdown) cao (${maxDDPercent.toFixed(1)}%), nguy cơ tổn hại tâm lý.`);
  }
  if (noStopLossCount > 0) {
    weaknesses.push(`Phát hiện ${noStopLossCount} lệnh không đặt Stop Loss. Đây là nguyên nhân số 1 gây cháy tài khoản.`);
  }
  if (revengeTradingCount > 0) {
    badHabits.push(`Phát hiện ${revengeTradingCount} lệnh Revenge Trading (mở lệnh vội vàng trong 30 phút sau khi thua).`);
  }
  if (volumeTiltCount > 0) {
    badHabits.push(`Phát hiện ${volumeTiltCount} lần nhồi khối lượng (Tilt Sizing) bất thường sau lệnh thua.`);
  }

  if (weaknesses.length === 0) {
    weaknesses.push('Không phát hiện điểm yếu chí mạng trong mẫu dữ liệu hiện tại.');
  }

  // Actionable Rules Generation
  if (noStopLossCount > 0) {
    actionableRules.push('BẮT BUỘC đặt Stop Loss cố định ngay khi khớp lệnh, tuyệt đối không dịch chuyển SL ra xa.');
  }
  if (revengeTradingCount > 0) {
    actionableRules.push('QUY TẮC CẮT BỎ REVENGE TRADING: Dừng màn hình ít nhất 30 phút ngay sau bất kỳ lệnh thua nào.');
  }
  if (volumeTiltCount > 0) {
    actionableRules.push('KHÓA KHỐI LƯỢNG: Giữ nguyên khối lượng Lot cố định (ví dụ 0.1 lot) trong ít nhất 10 lệnh liên tiếp.');
  }
  if (halfKellyPercent > 0) {
    actionableRules.push(`QUẢN TRỊ VỐN KELLY: Khuyến nghị phân bổ rủi ro tối đa ${halfKellyPercent.toFixed(1)}% vốn cho mỗi vị thế.`);
  } else {
    actionableRules.push('GIẢM RỦI RO: Đưa mức rủi ro về 0.5% - 1% tài khoản cho đến khi Profit Factor vượt 1.3.');
  }
  if (worstSetupName && worstSetupPnl < 0) {
    actionableRules.push(`TẠM DỪNG SETUP "${worstSetupName}": Tạm thời ngừng vào lệnh setup này để rà soát lại điều kiện vào lệnh.`);
  }

  // Summary message
  const summary = `Phân tích định lượng dựa trên ${totalTrades} lệnh: Điểm kỷ luật ${score}/100 (Hạng ${overallRating}). Tỷ lệ thắng ${winRate.toFixed(1)}%, Profit Factor ${profitFactor.toFixed(2)}, Kỳ vọng EV +$${expectancy.toFixed(2)}/lệnh.`;

  const psychologyCritique = revengeTradingCount > 0 || volumeTiltCount > 0
    ? `Hệ thống phát hiện dấu hiệu dao động tâm lý (Tilt) sau lệnh thua. Cần áp dụng quy tắc rời màn hình để tránh giao dịch cảm xúc.`
    : `Tâm lý và kỷ luật duy trì ở mức tốt. Hãy tiếp tục tuân thủ quy tắc quản trị vốn.`;

  const stopLossCompliance = noStopLossCount === 0
    ? 'Hoàn toàn tuân thủ Stop Loss (100% lệnh có cắt lỗ).'
    : `Vi phạm Stop Loss: Cần khắc phục ${noStopLossCount} lệnh mở không cài SL.`;

  return {
    id: `quant-report-${Date.now()}`,
    createdAt: new Date().toISOString(),
    overallRating,
    overallScore: score,
    summary,
    kellyPercent,
    halfKellyPercent,
    expectancy,
    riskOfRuinPercent: riskOfRuin,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    winLossRatio,
    maxDrawdownDollar: maxDD,
    maxDrawdownPercent: maxDDPercent,
    overtradingRisk,
    revengeTradingCount,
    volumeTiltCount,
    noStopLossCount,
    strengths,
    weaknesses,
    badHabits,
    psychologyCritique,
    stopLossCompliance,
    bestSetup: bestSetupName ? { name: bestSetupName, winRate: setupMap[bestSetupName] ? (setupMap[bestSetupName].wins / setupMap[bestSetupName].total) * 100 : 0, netPnl: bestSetupPnl } : undefined,
    worstSetup: worstSetupName ? { name: worstSetupName, winRate: setupMap[worstSetupName] ? (setupMap[worstSetupName].wins / setupMap[worstSetupName].total) * 100 : 0, netPnl: worstSetupPnl } : undefined,
    bestSession: bestSessionName ? { name: bestSessionName, winRate: sessionMap[bestSessionName] ? (sessionMap[bestSessionName].wins / sessionMap[bestSessionName].total) * 100 : 0, netPnl: bestSessionPnl } : undefined,
    actionableRules,
  };
}
