/**
 * @license
 * Professional Trading Analytics Engine
 * Calculates hedge-fund grade metrics, risk models, curves, and Monte Carlo simulations.
 */

import { Trade } from '../types';

export interface TradingMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number; // percentage 0-100
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  recoveryFactor: number;
  expectedPayoff: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  avgDrawdownPercent: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  winLossRatio: number;
  avgRR: number;
  medianRR: number;
  expectancy: number;
  holdingTimeMinutesAvg: number;
  kellyPercent: number; // Kelly criterion %
  riskOfRuinPercent: number;
  edgeRatio: number;
}

export interface CurvePoint {
  index: number;
  date: string;
  equity: number;
  balance: number;
  drawdown: number;
  drawdownPercent: number;
  tradePnl: number;
}

export interface GroupedStat {
  key: string; // e.g. "EURUSD" or "London" or "Breakout"
  tradesCount: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  avgRR: number;
}

export interface MonteCarloResult {
  percentile50Equity: number;
  percentile5MaxDrawdown: number;
  percentile95Equity: number;
  simulationPaths: Array<number[]>;
}

export function calculateTradingMetrics(trades: Trade[], initialBalance = 10000): TradingMetrics {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      recoveryFactor: 0,
      expectedPayoff: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdownDollar: 0,
      maxDrawdownPercent: 0,
      avgDrawdownPercent: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      winLossRatio: 0,
      avgRR: 0,
      medianRR: 0,
      expectancy: 0,
      holdingTimeMinutesAvg: 0,
      kellyPercent: 0,
      riskOfRuinPercent: 0,
      edgeRatio: 0,
    };
  }

  // Sort trades chronologically
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakEvenTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalHoldingMinutes = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  const rrList: number[] = [];
  const returns: number[] = [];

  sorted.forEach((t) => {
    const net = t.netPnl;
    totalHoldingMinutes += t.holdingTimeMinutes || 30;
    returns.push(net);

    if (net > 0.01) {
      grossProfit += net;
      winningTrades++;
      if (net > largestWin) largestWin = net;

      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak;
    } else if (net < -0.01) {
      grossLoss += Math.abs(net);
      losingTrades++;
      if (Math.abs(net) > largestLoss) largestLoss = Math.abs(net);

      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
    } else {
      breakEvenTrades++;
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    if (t.riskRewardRatio && t.riskRewardRatio > 0) {
      rrList.push(t.riskRewardRatio);
    } else if (t.stopLoss && t.openPrice && t.stopLoss !== t.openPrice) {
      const risk = Math.abs(t.openPrice - t.stopLoss);
      const reward = Math.abs(t.closePrice - t.openPrice);
      if (risk > 0) rrList.push(reward / risk);
    }
  });

  const totalTrades = sorted.length;
  const netProfit = grossProfit - grossLoss;
  const winRate = (winningTrades / totalTrades) * 100;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;

  // Drawdown Calculation
  let peak = initialBalance;
  let currentBalance = initialBalance;
  let maxDDOllar = 0;
  let maxDDPercent = 0;
  const ddPercents: number[] = [];

  sorted.forEach((t) => {
    currentBalance += t.netPnl;
    if (currentBalance > peak) {
      peak = currentBalance;
    }
    const ddDollar = peak - currentBalance;
    const ddPercent = peak > 0 ? (ddDollar / peak) * 100 : 0;

    if (ddDollar > maxDDOllar) maxDDOllar = ddDollar;
    if (ddPercent > maxDDPercent) maxDDPercent = ddPercent;
    if (ddPercent > 0) ddPercents.push(ddPercent);
  });

  const avgDrawdownPercent =
    ddPercents.length > 0 ? ddPercents.reduce((a, b) => a + b, 0) / ddPercents.length : 0;

  const recoveryFactor = maxDDOllar > 0 ? netProfit / maxDDOllar : netProfit > 0 ? 999 : 0;
  const expectedPayoff = totalTrades > 0 ? netProfit / totalTrades : 0;

  // Sharpe & Sortino (Annualized approximation)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((acc, val) => acc + Math.pow(val - avgReturn, 2), 0) / (returns.length - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  const downsideVariance =
    returns.length > 1
      ? returns
          .filter((r) => r < 0)
          .reduce((acc, val) => acc + Math.pow(val - avgReturn, 2), 0) / (returns.length - 1)
      : 0;
  const downsideStdDev = Math.sqrt(downsideVariance);

  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  const sortinoRatio = downsideStdDev > 0 ? (avgReturn / downsideStdDev) * Math.sqrt(252) : 0;

  const annualReturnPercent = initialBalance > 0 ? (netProfit / initialBalance) * 100 : 0;
  const calmarRatio = maxDDPercent > 0 ? annualReturnPercent / maxDDPercent : 0;

  // Average RR and Median RR
  const avgRR = rrList.length > 0 ? rrList.reduce((a, b) => a + b, 0) / rrList.length : winLossRatio;
  const sortedRR = [...rrList].sort((a, b) => a - b);
  const medianRR =
    sortedRR.length > 0
      ? sortedRR.length % 2 === 0
        ? (sortedRR[sortedRR.length / 2 - 1] + sortedRR[sortedRR.length / 2]) / 2
        : sortedRR[Math.floor(sortedRR.length / 2)]
      : avgRR;

  // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const winRateDec = winRate / 100;
  const lossRateDec = 1 - winRateDec;
  const expectancy = winRateDec * avgWin - lossRateDec * avgLoss;

  // Kelly % = W - (1 - W) / R
  const R = winLossRatio > 0 ? winLossRatio : 1;
  const kelly = winRateDec - (1 - winRateDec) / R;
  const kellyPercent = Math.max(0, Math.min(100, kelly * 100));

  // Risk of Ruin approximation
  // RoR = ((1 - W)/(1 + W))^Units (simplified formula)
  const winProb = winRateDec;
  const lossProb = lossRateDec;
  const edge = winProb * R - lossProb;
  const riskOfRuinPercent =
    edge <= 0 ? 100 : Math.min(100, Math.max(0, Math.pow((1 - edge) / (1 + edge), 10) * 100));

  const holdingTimeMinutesAvg = totalTrades > 0 ? Math.round(totalHoldingMinutes / totalTrades) : 0;
  const edgeRatio = avgLoss > 0 ? (winRateDec * avgWin) / (lossRateDec * avgLoss) : 1;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    recoveryFactor: parseFloat(recoveryFactor.toFixed(2)),
    expectedPayoff: parseFloat(expectedPayoff.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    calmarRatio: parseFloat(calmarRatio.toFixed(2)),
    maxDrawdownDollar: parseFloat(maxDDOllar.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDDPercent.toFixed(1)),
    avgDrawdownPercent: parseFloat(avgDrawdownPercent.toFixed(1)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    largestWin: parseFloat(largestWin.toFixed(2)),
    largestLoss: parseFloat(largestLoss.toFixed(2)),
    maxConsecutiveWins,
    maxConsecutiveLosses,
    winLossRatio: parseFloat(winLossRatio.toFixed(2)),
    avgRR: parseFloat(avgRR.toFixed(2)),
    medianRR: parseFloat(medianRR.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    holdingTimeMinutesAvg,
    kellyPercent: parseFloat(kellyPercent.toFixed(1)),
    riskOfRuinPercent: parseFloat(riskOfRuinPercent.toFixed(1)),
    edgeRatio: parseFloat(edgeRatio.toFixed(2)),
  };
}

export function generateEquityCurves(trades: Trade[], initialBalance = 10000): CurvePoint[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  let currentBalance = initialBalance;
  let peak = initialBalance;
  const points: CurvePoint[] = [
    {
      index: 0,
      date: 'Start',
      equity: initialBalance,
      balance: initialBalance,
      drawdown: 0,
      drawdownPercent: 0,
      tradePnl: 0,
    },
  ];

  sorted.forEach((t, i) => {
    currentBalance += t.netPnl;
    if (currentBalance > peak) {
      peak = currentBalance;
    }
    const ddDollar = peak - currentBalance;
    const ddPercent = peak > 0 ? (ddDollar / peak) * 100 : 0;

    const dateStr = new Date(t.closeTime).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
    });

    points.push({
      index: i + 1,
      date: dateStr,
      equity: parseFloat(currentBalance.toFixed(2)),
      balance: parseFloat(currentBalance.toFixed(2)),
      drawdown: parseFloat(ddDollar.toFixed(2)),
      drawdownPercent: parseFloat(ddPercent.toFixed(1)),
      tradePnl: parseFloat(t.netPnl.toFixed(2)),
    });
  });

  return points;
}

export function groupTradesByProperty(
  trades: Trade[],
  propertyGetter: (t: Trade) => string
): GroupedStat[] {
  const map: Record<string, Trade[]> = {};

  trades.forEach((t) => {
    const key = propertyGetter(t) || 'Unspecified';
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });

  return Object.entries(map).map(([key, groupTrades]) => {
    const metrics = calculateTradingMetrics(groupTrades, 10000);
    return {
      key,
      tradesCount: groupTrades.length,
      winRate: metrics.winRate,
      netProfit: metrics.netProfit,
      profitFactor: metrics.profitFactor,
      avgRR: metrics.avgRR,
    };
  });
}

export function runMonteCarloSimulation(
  trades: Trade[],
  initialBalance = 10000,
  numSimulations = 100
): MonteCarloResult {
  if (!trades || trades.length < 3) {
    return {
      percentile50Equity: initialBalance,
      percentile5MaxDrawdown: 0,
      percentile95Equity: initialBalance,
      simulationPaths: [],
    };
  }

  const pnls = trades.map((t) => t.netPnl);
  const tradeCount = pnls.length;
  const paths: Array<number[]> = [];
  const finalEquities: number[] = [];
  const maxDDs: number[] = [];

  for (let s = 0; s < numSimulations; s++) {
    let bal = initialBalance;
    let peak = initialBalance;
    let maxDD = 0;
    const path: number[] = [initialBalance];

    for (let step = 0; step < tradeCount; step++) {
      const randomIndex = Math.floor(Math.random() * tradeCount);
      const randomPnl = pnls[randomIndex];
      bal += randomPnl;
      if (bal > peak) peak = bal;
      const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
      path.push(parseFloat(bal.toFixed(2)));
    }

    paths.push(path);
    finalEquities.push(bal);
    maxDDs.push(maxDD);
  }

  finalEquities.sort((a, b) => a - b);
  maxDDs.sort((a, b) => a - b);

  const p50Equity = finalEquities[Math.floor(numSimulations * 0.5)];
  const p95Equity = finalEquities[Math.floor(numSimulations * 0.95)];
  const p5MaxDD = maxDDs[Math.floor(numSimulations * 0.95)]; // 95th percentile worst drawdown

  return {
    percentile50Equity: parseFloat(p50Equity.toFixed(2)),
    percentile5MaxDrawdown: parseFloat(p5MaxDD.toFixed(1)),
    percentile95Equity: parseFloat(p95Equity.toFixed(2)),
    simulationPaths: paths.slice(0, 10), // keep 10 representative visual paths
  };
}

export function getSymbolBreakdown(trades: Trade[]): GroupedStat[] {
  return groupTradesByProperty(trades, (t) => t.symbol || 'Khác');
}

export function getDayOfWeekBreakdown(trades: Trade[]): GroupedStat[] {
  const daysOrder = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const dayNameMap: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    0: 'Chủ Nhật',
  };

  const grouped = groupTradesByProperty(trades, (t) => {
    const d = new Date(t.openTime);
    return isNaN(d.getTime()) ? 'Thứ 2' : dayNameMap[d.getUTCDay()] || 'Thứ 2';
  });

  return grouped.sort((a, b) => daysOrder.indexOf(a.key) - daysOrder.indexOf(b.key));
}

export function getMonthBreakdown(trades: Trade[]): GroupedStat[] {
  return groupTradesByProperty(trades, (t) => {
    const d = new Date(t.openTime);
    if (isNaN(d.getTime())) return 'Tháng N/A';
    return `Tháng ${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  });
}

export function getHourBreakdown(trades: Trade[]): GroupedStat[] {
  const grouped = groupTradesByProperty(trades, (t) => {
    const d = new Date(t.openTime);
    if (isNaN(d.getTime())) return '00:00';
    const h = d.getUTCHours();
    return `${h < 10 ? '0' + h : h}:00 UTC`;
  });

  return grouped.sort((a, b) => parseInt(a.key) - parseInt(b.key));
}
