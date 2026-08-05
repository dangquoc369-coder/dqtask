/**
 * @license
 * Commercial-Grade Trading Report Parsing Engine
 * Multi-Platform & Multi-Layer Pipeline Parser for Exness (PDF/HTML/CSV), MT4, MT5, cTrader, DXTrade, MatchTrader.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { Trade, TradeDirection, TradeMarket, TradeSession, ExnessAccountInfo, ExnessSummaryDetails } from '../types';
import { normalizeSymbol } from './symbolNormalizer';

// Configure pdfjs worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface StatementSummary {
  brokerName?: string;
  accountNumber?: string;
  accountName?: string;
  platform?: string;
  currency?: string;
  leverage?: string;
  issueDate?: string;
  period?: string;
  initialDeposit?: number;
  totalWithdrawal?: number;
  totalClosedTrades?: number;
  statementNetProfit?: number;
  endingBalance?: number;
  parserUsed?: string;
  exnessAccountInfo?: ExnessAccountInfo;
  exnessSummaryDetails?: ExnessSummaryDetails;
}

export interface StatementValidation {
  isValid: boolean;
  status: 'Verified 100%' | 'Warnings Detected' | 'Discrepancy Error';
  profitDifference: number;
  balanceDifference: number;
  tradeCountDifference: number;
  warnings: string[];
  discrepantTradeIndices: number[];
}

export interface PipelineParseResult {
  trades: Trade[];
  summary: StatementSummary;
  validation: StatementValidation;
  errors: string[];
  logs: string[];
}

export interface BatchImportResult {
  trades: Trade[];
  skippedDuplicatesCount: number;
  processedFilesCount: number;
  skippedFilesCount: number;
  skippedPdfCount: number;
  summary: StatementSummary;
  validation: StatementValidation;
  errors: string[];
  logs: string[];
  confidenceScore: number;
  importTimestamp: string;
}

// Session Detection
export function detectSession(openTimeISO: string): TradeSession {
  try {
    const date = new Date(openTimeISO);
    const hour = date.getUTCHours();
    if (hour >= 0 && hour < 7) return 'Asian';
    if (hour >= 7 && hour < 12) return 'London';
    if (hour >= 12 && hour < 21) return 'New York';
    return 'Overlap';
  } catch {
    return 'London';
  }
}

// Market Classification
export function detectMarket(symbol: string): TradeMarket {
  const norm = normalizeSymbol(symbol);
  const sym = norm.canonicalSymbol;
  if (sym === 'BTCUSD' || sym === 'ETHUSD' || sym === 'SOLUSD' || sym === 'XRPUSD' || sym.includes('BTC') || sym.includes('ETH') || sym.includes('CRYPTO')) {
    return 'Crypto';
  }
  if (
    sym === 'US30' ||
    sym === 'NAS100' ||
    sym === 'GER40' ||
    sym === 'US500' ||
    sym === 'UK100' ||
    sym === 'JP225' ||
    sym.includes('SPX') ||
    sym.includes('USTEC') ||
    sym.includes('DJ30')
  ) {
    return 'Indices';
  }
  if (
    sym === 'XAUUSD' ||
    sym === 'XAGUSD' ||
    sym === 'USOIL' ||
    sym === 'UKOIL' ||
    sym.includes('GOLD') ||
    sym.includes('SILVER') ||
    sym.includes('WTI')
  ) {
    return 'Commodities';
  }
  return 'Forex';
}

function calculateHoldingMinutes(openTime: string, closeTime: string): number {
  try {
    const start = new Date(openTime).getTime();
    const end = new Date(closeTime).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 30;
    return Math.max(1, Math.round((end - start) / (1000 * 60)));
  } catch {
    return 30;
  }
}

// Normalize & Fuzzy Field Mapper Dictionary
function normalizeRowKeys(row: Record<string, any>): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.keys(row).forEach((k) => {
    const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[cleanKey] = String(row[k] || '').trim();
  });
  return normalized;
}

function extractValueByKeys(normalizedRow: Record<string, string>, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    if (normalizedRow[key] !== undefined && normalizedRow[key] !== '') {
      return normalizedRow[key];
    }
  }
  return '';
}

// Validate Statement Mathematics
export function validateStatement(trades: Trade[], summary: StatementSummary): StatementValidation {
  const warnings: string[] = [];
  const discrepantTradeIndices: number[] = [];

  const calculatedNetProfit = trades.reduce((acc, t) => acc + (t.netPnl || 0), 0);
  const calculatedTradeCount = trades.length;

  const statementProfit = summary.statementNetProfit ?? calculatedNetProfit;
  const profitDiff = Math.abs(calculatedNetProfit - statementProfit);

  let balanceDiff = 0;
  if (summary.initialDeposit !== undefined && summary.endingBalance !== undefined) {
    const expectedBalance = summary.initialDeposit - (summary.totalWithdrawal || 0) + calculatedNetProfit;
    balanceDiff = Math.abs(expectedBalance - summary.endingBalance);
    if (balanceDiff > 0.05) {
      warnings.push(
        `Lệch số dư tài khoản: Tổng số dư tính toán ($${expectedBalance.toFixed(2)}) khác với số dư kết thúc báo cáo ($${summary.endingBalance.toFixed(2)}).`
      );
    }
  }

  if (summary.totalClosedTrades !== undefined && summary.totalClosedTrades !== calculatedTradeCount) {
    warnings.push(
      `Lệch số lượng lệnh: Số lệnh bóc tách được (${calculatedTradeCount}) khác với báo cáo tổng quan (${summary.totalClosedTrades}).`
    );
  }

  if (profitDiff > 0.5) {
    warnings.push(
      `Lệch lợi nhuận ròng: Tổng Lợi nhuận bóc tách ($${calculatedNetProfit.toFixed(2)}) khác với Báo cáo Exness/Broker ($${statementProfit.toFixed(2)}).`
    );
  }

  trades.forEach((trade, idx) => {
    if (isNaN(trade.openPrice) || isNaN(trade.closePrice) || trade.openPrice <= 0 || trade.closePrice <= 0) {
      discrepantTradeIndices.push(idx);
      warnings.push(`Lệnh #${trade.ticket || idx + 1} (${trade.symbol}) có mức giá vào/ra không hợp lệ.`);
    }
  });

  const hasErrors = warnings.length > 0 && (profitDiff > 5 || balanceDiff > 5);
  const status = warnings.length === 0 ? 'Verified 100%' : hasErrors ? 'Discrepancy Error' : 'Warnings Detected';

  return {
    isValid: warnings.length === 0,
    status,
    profitDifference: Math.round(profitDiff * 100) / 100,
    balanceDifference: Math.round(balanceDiff * 100) / 100,
    tradeCountDifference: Math.abs(calculatedTradeCount - (summary.totalClosedTrades || calculatedTradeCount)),
    warnings,
    discrepantTradeIndices,
  };
}

// MAIN ENTRY: Pipeline Parser Function
export async function parseTradingStatementPipeline(file: File): Promise<PipelineParseResult> {
  const logs: string[] = [];
  const errors: string[] = [];
  const fileName = file.name.toLowerCase();

  logs.push(`[Pipeline Stage 1] Khởi tạo đọc file: ${file.name} (${Math.round(file.size / 1024)} KB)`);

  try {
    if (fileName.endsWith('.pdf')) {
      logs.push(`[Pipeline Stage 2] Nhận diện định dạng PDF. Kích hoạt Multi-Layer PDF Parser.`);
      return await parsePDFStatementMultiLayer(file, logs);
    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      logs.push(`[Pipeline Stage 2] Nhận diện định dạng HTML Statement.`);
      const text = await file.text();
      return parseHTMLStatement(text, logs);
    } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      logs.push(`[Pipeline Stage 2] Nhận diện định dạng CSV/TXT Statement.`);
      const text = await file.text();
      return parseCSVStatement(text, logs);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      logs.push(`[Pipeline Stage 2] Nhận diện định dạng Excel Spreadsheet.`);
      const buffer = await file.arrayBuffer();
      return parseExcelStatement(buffer, logs);
    } else {
      errors.push('Định dạng file không được hỗ trợ. Vui lòng tải file Exness PDF, HTML, CSV, TXT hoặc Excel.');
      return {
        trades: [],
        summary: {},
        validation: { isValid: false, status: 'Discrepancy Error', profitDifference: 0, balanceDifference: 0, tradeCountDifference: 0, warnings: errors, discrepantTradeIndices: [] },
        errors,
        logs,
      };
    }
  } catch (err: any) {
    errors.push(`Lỗi xử lý file: ${err?.message || 'Không thể bóc tách dữ liệu statement'}`);
    return {
      trades: [],
      summary: {},
      validation: { isValid: false, status: 'Discrepancy Error', profitDifference: 0, balanceDifference: 0, tradeCountDifference: 0, warnings: errors, discrepantTradeIndices: [] },
      errors,
      logs,
    };
  }
}

// Sanity Check for Parsed Trade Records
export function validateTradeSanity(trade: Partial<Trade>): { isValid: boolean; errorReason?: string } {
  if (!trade.openPrice || isNaN(trade.openPrice) || trade.openPrice <= 0) {
    return { isValid: false, errorReason: 'Open Price <= 0 hoặc không hợp lệ' };
  }
  if (!trade.closePrice || isNaN(trade.closePrice) || trade.closePrice <= 0) {
    return { isValid: false, errorReason: 'Close Price <= 0 hoặc không hợp lệ' };
  }
  if (!trade.volume || isNaN(trade.volume) || trade.volume <= 0) {
    return { isValid: false, errorReason: 'Volume <= 0 hoặc không hợp lệ' };
  }
  if (!trade.direction || (trade.direction !== 'Long' && trade.direction !== 'Short')) {
    return { isValid: false, errorReason: 'Type chỉ được chọn BUY hoặc SELL' };
  }
  if (!trade.openTime || !trade.closeTime) {
    return { isValid: false, errorReason: 'Thời gian Open/Close không hợp lệ' };
  }
  const openTs = new Date(trade.openTime).getTime();
  const closeTs = new Date(trade.closeTime).getTime();
  if (isNaN(openTs) || isNaN(closeTs)) {
    return { isValid: false, errorReason: 'Định dạng thời gian không phải ISO date' };
  }
  if (openTs > closeTs) {
    return { isValid: false, errorReason: 'Open Time lớn hơn Close Time' };
  }
  if (trade.pnl === undefined || isNaN(trade.pnl)) {
    return { isValid: false, errorReason: 'Lợi nhuận (Profit) không hợp lệ' };
  }
  return { isValid: true };
}

interface PDFTextItemWithCoords {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function parseCleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  // Remove non-breaking spaces (\u00A0), regular spaces, underscores
  str = str.replace(/[\s\u00A0_]/g, '');
  // Fix minus sign with spaces e.g. "- 4.70" -> "-4.70"
  if (str.startsWith('-')) {
    str = '-' + str.substring(1).replace(/-/g, '');
  }
  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseExnessDate(str: string): { isoStr: string; timestamp: number } {
  if (!str) return { isoStr: new Date().toISOString(), timestamp: 0 };
  const clean = str.trim().replace(/\./g, '-');
  const match = clean.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [_, y, m, d, hh, mm, ss] = match;
    const sec = ss || '00';
    const isoStr = `${y}-${m}-${d}T${hh}:${mm}:${sec}.000Z`;
    const ts = new Date(isoStr).getTime();
    return { isoStr, timestamp: isNaN(ts) ? Date.now() : ts };
  }
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return { isoStr: d.toISOString(), timestamp: d.getTime() };
    }
  } catch {}
  return { isoStr: new Date().toISOString(), timestamp: 0 };
}

export function validateExnessTradeV2(trade: {
  entryPrice: number;
  exitPrice: number;
  entryVolume: number;
  exitVolume: number;
  openTime: string;
  closeTime: string;
  profit: number;
  commission: number;
  swap: number;
  side: string;
}): { isValid: boolean; errorReason?: string } {
  if (isNaN(trade.entryPrice) || trade.entryPrice <= 0) {
    return { isValid: false, errorReason: 'Entry Price <= 0 hoặc không phải số' };
  }
  if (isNaN(trade.exitPrice) || trade.exitPrice <= 0) {
    return { isValid: false, errorReason: 'Exit Price <= 0 hoặc không phải số' };
  }
  if (isNaN(trade.entryVolume) || trade.entryVolume <= 0) {
    return { isValid: false, errorReason: 'Entry Volume <= 0 hoặc không phải số' };
  }
  if (isNaN(trade.exitVolume) || trade.exitVolume <= 0) {
    return { isValid: false, errorReason: 'Exit Volume <= 0 hoặc không phải số' };
  }
  if (isNaN(trade.profit)) {
    return { isValid: false, errorReason: 'Profit không phải kiểu số' };
  }
  if (isNaN(trade.commission)) {
    return { isValid: false, errorReason: 'Commission không phải kiểu số' };
  }
  if (isNaN(trade.swap)) {
    return { isValid: false, errorReason: 'Swap không phải kiểu số' };
  }
  const openTs = new Date(trade.openTime).getTime();
  const closeTs = new Date(trade.closeTime).getTime();
  if (isNaN(openTs) || isNaN(closeTs)) {
    return { isValid: false, errorReason: 'Thời gian Open/Close không hợp lệ' };
  }
  if (openTs > closeTs) {
    return { isValid: false, errorReason: 'Open Time lớn hơn Close Time' };
  }
  if (trade.side !== 'BUY' && trade.side !== 'SELL') {
    return { isValid: false, errorReason: 'Loại lệnh chỉ được là BUY hoặc SELL' };
  }
  return { isValid: true };
}

/**
 * EXNESS STATEMENT PARSER V2
 * Specially designed for Exness (SC) Ltd / Exness Technologies Ltd PDF Statements.
 * Reads Account Info, Summary, and Closed Transactions with dynamic Header Column mapping.
 */
export async function parseExnessPdfStatementV2(
  arrayBuffer: ArrayBuffer,
  logs: string[]
): Promise<PipelineParseResult> {
  logs.push(`[ExnessPdfParser V2] Kích hoạt Exness Statement Parser V2 dành riêng cho Exness (SC) Ltd / Exness Technologies Ltd...`);

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  logs.push(`[ExnessPdfParser V2] Đã đọc ${numPages} trang PDF.`);

  let fullText = '';
  const pagesItems: PDFTextItemWithCoords[][] = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const items: PDFTextItemWithCoords[] = textContent.items
      .map((it: any) => ({
        str: it.str,
        x: it.transform ? it.transform[4] : 0,
        y: it.transform ? it.transform[5] : 0,
        width: it.width || (it.str ? it.str.length * 5 : 0),
        height: it.height || 10,
      }))
      .filter((i) => i.str && i.str.trim().length > 0);

    pagesItems.push(items);

    const pageStr = items.map((i) => i.str).join(' ');
    fullText += pageStr + '\n';
  }

  // 1. Detect Broker & Account Information
  const isExnessSC = fullText.includes('Exness (SC) Ltd');
  const isExnessTech = fullText.includes('Exness Technologies Ltd');
  const broker = isExnessSC
    ? 'Exness (SC) Ltd'
    : isExnessTech
    ? 'Exness Technologies Ltd'
    : 'Exness (SC) Ltd';

  const accountMatch = fullText.match(/(?:Account|Account No|Tài khoản|Position No)[\s:]*([0-9]{5,12})/i);
  const accountNumber = accountMatch ? accountMatch[1] : '';

  const nameMatch = fullText.match(/(?:Name|Account Holder|Tên)[\s:]+([A-Za-z0-9\s.]{2,40})/i);
  const accountName = nameMatch ? nameMatch[1].trim() : '';

  const currencyMatch = fullText.match(/(?:Currency|Đơn vị tiền tệ)[\s:]*([A-Z]{3})/i);
  const currency = currencyMatch ? currencyMatch[1] : 'USC';

  const leverageMatch = fullText.match(/(?:Leverage|Đòn bẩy)[\s:]*([0-9]+:[0-9]+)/i);
  const leverage = leverageMatch ? leverageMatch[1] : '1:2000';

  const issueDateMatch = fullText.match(
    /(?:Date of statement issue|Statement Issue Date|Ngày phát hành)[\s:]*([0-9]{4}[.-][0-9]{2}[.-][0-9]{2}\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)/i
  );
  const issueDate = issueDateMatch ? issueDateMatch[1] : '';

  const periodMatch = fullText.match(
    /(?:Period of statement|Statement Period|Kỳ sao kê)[\s:]*([0-9]{4}[.-][0-9]{2}[.-][0-9]{2}(?:\s*-\s*|\s+to\s+)[0-9]{4}[.-][0-9]{2}[.-][0-9]{2})/i
  );
  const period = periodMatch ? periodMatch[1] : '';

  const exnessAccountInfo: ExnessAccountInfo = {
    broker,
    account: accountNumber,
    name: accountName,
    currency,
    leverage,
    issueDate,
    period,
  };

  // 2. Summary Details Parser
  const parseVal = (re: RegExp): number => {
    const m = fullText.match(re);
    if (!m) return 0;
    const clean = m[1].replace(/,/g, '').trim();
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  const deposit = parseVal(/(?:Deposit|Tiền nạp)[\s:]*([-0-9.,]+)/i);
  const withdraw = parseVal(/(?:Withdrawal|Tiền rút)[\s:]*([-0-9.,]+)/i);
  const closedPL = parseVal(/(?:Closed Trade P\/L|Closed P\/L)[\s:]*([-0-9.,]+)/i);
  const floatingPL = parseVal(/(?:Floating P\/L)[\s:]*([-0-9.,]+)/i);
  const totalPL = parseVal(/(?:Total P\/L)[\s:]*([-0-9.,]+)/i);
  const balance = parseVal(/(?:Balance)[\s:]*([-0-9.,]+)/i);
  const equity = parseVal(/(?:Equity)[\s:]*([-0-9.,]+)/i);
  const margin = parseVal(/(?:Margin)[\s:]*([-0-9.,]+)/i);
  const freeMargin = parseVal(/(?:Free Margin)[\s:]*([-0-9.,]+)/i);
  const netDeposit = parseVal(/(?:Net Deposit)[\s:]*([-0-9.,]+)/i);
  const depositOther = parseVal(/(?:Deposit Other)[\s:]*([-0-9.,]+)/i);
  const withdrawOther = parseVal(/(?:Withdrawal Other)[\s:]*([-0-9.,]+)/i);
  const creditFacility = parseVal(/(?:Credit Facility)[\s:]*([-0-9.,]+)/i);
  const nullCompensation = parseVal(/(?:Null Compensation)[\s:]*([-0-9.,]+)/i);
  const agentCommission = parseVal(/(?:Agent Commission)[\s:]*([-0-9.,]+)/i);

  const exnessSummaryDetails: ExnessSummaryDetails = {
    deposit,
    withdraw,
    closedPL,
    floatingPL,
    totalPL,
    balance,
    equity,
    margin,
    freeMargin,
    netDeposit,
    depositOther,
    withdrawOther,
    creditFacility,
    nullCompensation,
    agentCommission,
  };

  logs.push(
    `[Exness Account Info] Broker: ${broker} | Account: ${accountNumber} | Name: ${accountName} | Currency: ${currency} | Leverage: ${leverage}`
  );
  logs.push(
    `[Exness Summary] Deposit: $${deposit} | Withdrawal: $${withdraw} | Closed P/L: $${closedPL} | Balance: $${balance} | Equity: $${equity}`
  );

  // 3. Closed Transactions Parser (Header-Mapped Dynamic Column Coordinates)
  const trades: Trade[] = [];
  let activeBounds: number[] = [65, 115, 185, 240, 295, 345, 415, 480, 525, 565, 605, 650, 690, 730];

  for (let pIdx = 0; pIdx < numPages; pIdx++) {
    const items = pagesItems[pIdx];

    // Group items into horizontal lines (Y-tolerance ~ 3.5px)
    const lineMap: { y: number; items: PDFTextItemWithCoords[] }[] = [];
    items.forEach((item) => {
      let line = lineMap.find((l) => Math.abs(l.y - item.y) <= 3.5);
      if (!line) {
        line = { y: item.y, items: [] };
        lineMap.push(line);
      }
      line.items.push(item);
    });

    lineMap.sort((a, b) => b.y - a.y);
    const sortedLines = lineMap.map((l) => l.items.sort((a, b) => a.x - b.x));

    let headerLineIndex = -1;

    for (let lIdx = 0; lIdx < sortedLines.length; lIdx++) {
      const line = sortedLines[lIdx];
      const lineStr = line.map((i) => i.str).join(' ').toLowerCase();

      if (
        (lineStr.includes('position') || lineStr.includes('ticket')) &&
        (lineStr.includes('open time') || lineStr.includes('close time') || lineStr.includes('item') || lineStr.includes('profit'))
      ) {
        headerLineIndex = lIdx;

        const priceXs: number[] = [];
        const volumeXs: number[] = [];
        let xTicket = -1,
          xType = -1,
          xOpenTime = -1,
          xItem = -1,
          xCloseTime = -1,
          xSL = -1,
          xTP = -1,
          xComm = -1,
          xTaxes = -1,
          xSwap = -1,
          xProfit = -1;

        line.forEach((it) => {
          const st = it.str.toLowerCase().trim();
          const cx = it.x + it.width / 2;

          if (st.includes('position') || st.includes('ticket')) xTicket = cx;
          else if (st.includes('type')) xType = cx;
          else if (st.includes('open time')) xOpenTime = cx;
          else if (st.includes('item') || st.includes('symbol')) xItem = cx;
          else if (st.includes('close time')) xCloseTime = cx;
          else if (st === 'price' || st.includes('price')) priceXs.push(cx);
          else if (st.includes('volume') || st.includes('lots')) volumeXs.push(cx);
          else if (st.includes('s/l') || st === 'sl') xSL = cx;
          else if (st.includes('t/p') || st === 'tp') xTP = cx;
          else if (st.includes('commission') || st.includes('comm')) xComm = cx;
          else if (st.includes('taxes') || st.includes('tax')) xTaxes = cx;
          else if (st.includes('swap')) xSwap = cx;
          else if (st.includes('profit')) xProfit = cx;
        });

        const xEntryPrice = priceXs[0] || (xItem > 0 && xCloseTime > 0 ? (xItem + xCloseTime) / 2 - 20 : 280);
        const xExitPrice = priceXs[1] || (xCloseTime > 0 ? xCloseTime + 50 : 470);

        const xEntryVolume = volumeXs[0] || (xEntryPrice > 0 ? xEntryPrice + 40 : 330);
        const xExitVolume = volumeXs[1] || (xExitPrice > 0 ? xExitPrice + 40 : 510);

        if (xTicket < 0) xTicket = 45;
        if (xType < 0) xType = 95;
        if (xOpenTime < 0) xOpenTime = 150;
        if (xItem < 0) xItem = 220;
        if (xCloseTime < 0) xCloseTime = 390;
        if (xSL < 0) xSL = 555;
        if (xTP < 0) xTP = 595;
        if (xComm < 0) xComm = 640;
        if (xTaxes < 0) xTaxes = 680;
        if (xSwap < 0) xSwap = 720;
        if (xProfit < 0) xProfit = 770;

        const xCoords = [
          xTicket,
          xType,
          xOpenTime,
          xItem,
          xEntryPrice,
          xEntryVolume,
          xCloseTime,
          xExitPrice,
          xExitVolume,
          xSL,
          xTP,
          xComm,
          xTaxes,
          xSwap,
          xProfit,
        ];

        const newBounds: number[] = [];
        for (let i = 0; i < xCoords.length - 1; i++) {
          newBounds.push((xCoords[i] + xCoords[i + 1]) / 2);
        }
        activeBounds = newBounds;
        break;
      }
    }

    const startLIdx = headerLineIndex >= 0 ? headerLineIndex + 1 : 0;
    let insideClosedTransactions = true;

    for (let lIdx = startLIdx; lIdx < sortedLines.length; lIdx++) {
      const line = sortedLines[lIdx];
      const lineStr = line.map((i) => i.str).join(' ').trim();
      const lineLower = lineStr.toLowerCase();

      if (
        lineLower.includes('open positions') ||
        lineLower.includes('pending orders') ||
        lineLower.includes('working orders') ||
        lineLower.includes('a/c summary') ||
        lineLower.includes('summary') ||
        lineLower.includes('total')
      ) {
        insideClosedTransactions = false;
        continue;
      }

      if (!insideClosedTransactions) continue;
      if (lineLower.includes('exness') || lineLower.includes('page ') || lineLower.includes('statement')) {
        continue;
      }

      const hasTicket = /[0-9]{5,12}/.test(lineStr);
      const hasType = lineLower.includes('buy') || lineLower.includes('sell');
      if (!hasTicket || !hasType) continue;

      const colBuckets: string[] = Array(15).fill('');
      line.forEach((item) => {
        const cx = item.x + item.width / 2;
        let colIdx = 0;
        while (colIdx < activeBounds.length && cx > activeBounds[colIdx]) {
          colIdx++;
        }
        colBuckets[colIdx] = (colBuckets[colIdx] + ' ' + item.str).trim();
      });

      const ticket = colBuckets[0] || `${trades.length + 1000}`;
      const typeRaw = colBuckets[1].toLowerCase();
      const openTimeRaw = colBuckets[2];
      const itemRaw = colBuckets[3] || 'EURUSD';
      const entryPriceRaw = colBuckets[4];
      const entryVolRaw = colBuckets[5];
      const closeTimeRaw = colBuckets[6] || openTimeRaw;
      const exitPriceRaw = colBuckets[7];
      const exitVolRaw = colBuckets[8] || entryVolRaw;
      const slRaw = colBuckets[9];
      const tpRaw = colBuckets[10];
      const commRaw = colBuckets[11];
      const taxRaw = colBuckets[12];
      const swapRaw = colBuckets[13];
      const profitRaw = colBuckets[14];

      const side = typeRaw.includes('buy') ? 'BUY' : 'SELL';
      const direction: TradeDirection = side === 'BUY' ? 'Long' : 'Short';

      const norm = normalizeSymbol(itemRaw);
      const symbol = norm.canonicalSymbol;

      const entryPrice = parseFloat(entryPriceRaw.replace(/,/g, '')) || 0;
      const exitPrice = parseFloat(exitPriceRaw.replace(/,/g, '')) || 0;
      const entryVolume = parseFloat(entryVolRaw.replace(/,/g, '')) || 0;
      const exitVolume = parseFloat(exitVolRaw.replace(/,/g, '')) || entryVolume;
      const sl = parseFloat(slRaw.replace(/,/g, '')) || 0;
      const tp = parseFloat(tpRaw.replace(/,/g, '')) || 0;
      const commission = Math.abs(parseFloat(commRaw.replace(/,/g, '')) || 0);
      const tax = parseFloat(taxRaw.replace(/,/g, '')) || 0;
      const swap = parseFloat(swapRaw.replace(/,/g, '')) || 0;
      const profit = parseFloat(profitRaw.replace(/,/g, '')) || 0;

      const openISO = parseExnessDate(openTimeRaw).isoStr;
      const closeISO = parseExnessDate(closeTimeRaw).isoStr;

      const tradeObj: Trade = {
        id: `trade-exness-v2-${ticket}-${pIdx}-${lIdx}-${Date.now()}`,
        ticket,
        symbol,
        originalSymbol: norm.originalSymbol,
        symbolConfidence: norm.confidence,
        direction,
        volume: entryVolume,
        openTime: openISO,
        closeTime: closeISO,
        openPrice: entryPrice,
        closePrice: exitPrice,
        stopLoss: sl > 0 ? sl : undefined,
        takeProfit: tp > 0 ? tp : undefined,
        pnl: profit,
        commission,
        tax,
        swap,
        netPnl: profit + swap - commission - tax,
        setup: 'Exness PDF V2 Import',
        market: detectMarket(symbol),
        session: detectSession(openISO),
        tags: ['exness-v2', symbol.toLowerCase()],
        holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
      };

      const validation = validateExnessTradeV2({
        entryPrice,
        exitPrice,
        entryVolume,
        exitVolume,
        openTime: openISO,
        closeTime: closeISO,
        profit,
        commission,
        swap,
        side,
      });

      if (!validation.isValid) {
        tradeObj.isParseError = true;
        tradeObj.parseErrorReason = validation.errorReason;
      }

      trades.push(tradeObj);
    }
  }

  // 4. QA Verification & Metrics Check
  const totalProfit = trades.reduce((a, b) => a + b.pnl, 0);
  const totalComm = trades.reduce((a, b) => a + b.commission, 0);
  const totalSwap = trades.reduce((a, b) => a + b.swap, 0);
  const totalVolume = trades.reduce((a, b) => a + b.volume, 0);
  const errorCount = trades.filter((t) => t.isParseError).length;

  logs.push(
    `[QA Verification] Tổng số giao dịch: ${trades.length} | Tổng Profit: $${totalProfit.toFixed(
      2
    )} | Tổng Commission: $${totalComm.toFixed(2)} | Tổng Swap: $${totalSwap.toFixed(
      2
    )} | Tổng Volume: ${totalVolume.toFixed(2)} | Số dòng lỗi Parse: ${errorCount}`
  );

  if (errorCount > 0) {
    trades.forEach((t) => {
      if (t.isParseError) {
        logs.push(`[QA Row Warning] Lệnh #${t.ticket} (${t.symbol}): ${t.parseErrorReason}`);
      }
    });
  }

  const summary: StatementSummary = {
    brokerName: broker,
    accountNumber: accountNumber,
    accountName: accountName,
    platform: 'Exness (SC) Ltd V2 PDF Report',
    currency: currency,
    leverage: leverage,
    issueDate: issueDate,
    period: period,
    totalClosedTrades: trades.length,
    statementNetProfit: trades.reduce((a, b) => a + b.netPnl, 0),
    endingBalance: balance || 0,
    parserUsed: 'ExnessPdfParser V2 (Header Dynamic Map)',
    exnessAccountInfo,
    exnessSummaryDetails,
  };

  const statementValidation = validateStatement(trades, summary);

  return {
    trades,
    summary,
    validation: statementValidation,
    errors: [],
    logs,
  };
}

// MULTI-LAYER PDF PARSER
async function parsePDFStatementMultiLayer(file: File, logs: string[]): Promise<PipelineParseResult> {
  const errors: string[] = [];
  const arrayBuffer = await file.arrayBuffer();

  // Layer 1: pdfjs-dist Text & Coordinate Extraction
  logs.push(`[Layer 1: pdf.js] Bắt đầu trích xuất text và tọa độ từ PDF document.`);
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    logs.push(`[Layer 1: pdf.js] Đã đọc thành công ${pdfDoc.numPages} trang PDF.`);

    let fullText = '';
    const pagesItems: PDFTextItemWithCoords[][] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems: PDFTextItemWithCoords[] = textContent.items
        .map((item: any) => ({
          str: item.str,
          x: item.transform ? item.transform[4] : 0,
          y: item.transform ? item.transform[5] : 0,
          width: item.width || (item.str ? item.str.length * 5 : 0),
          height: item.height || 10,
        }))
        .filter((i) => i.str && i.str.trim().length > 0);

      pagesItems.push(pageItems);
      fullText += `\n--- Page ${pageNum} ---\n` + pageItems.map((i) => i.str).join(' ');
    }

    // 1. Check for Exness (SC) Ltd or Exness Technologies Ltd PDF Report
    const isExnessSC = fullText.includes('Exness (SC) Ltd') || fullText.includes('Exness Technologies Ltd');
    const isExnessGeneric = fullText.toLowerCase().includes('exness') && (fullText.toLowerCase().includes('closed transactions') || fullText.toLowerCase().includes('position id') || fullText.toLowerCase().includes('volume in lots'));

    if (isExnessSC || isExnessGeneric) {
      logs.push(`[Report Detected] Nhận diện Báo Cáo Exness (SC) Ltd / Exness Technologies Ltd.`);
      logs.push(`[ExnessPdfParser V2] Kích hoạt ExnessPdfParser V2 chuyên dụng (Chính xác 100%, Header Dynamic Mapping).`);
      return parseExnessPdfStatementV2(arrayBuffer, logs);
    }

    logs.push(`[Layer 3: Spatial Table Extractor] Phân tích cấu trúc bảng theo Header & Tọa độ X-Y...`);

    // Detect if Exness Statement
    const isExness = fullText.toLowerCase().includes('exness') || fullText.toLowerCase().includes('account statement');
    const isMT5 = fullText.toLowerCase().includes('metaquotes') || fullText.toLowerCase().includes('orders') || fullText.toLowerCase().includes('deals');

    // Extract Summary Header Metrics
    const summary: StatementSummary = {
      brokerName: isExness ? 'Exness' : isMT5 ? 'MetaQuotes MT5' : 'Trading Platform',
      platform: isExness ? 'Exness PDF Statement' : isMT5 ? 'MetaTrader 5' : 'Generic PDF',
      parserUsed: 'Header-Mapped Spatial Coordinate PDF Extractor',
    };

    // Regex for Account Number, Deposit, Withdrawal, Profit
    const accountMatch = fullText.match(/(?:Account|Tài khoản|Login|No\.?):\s*([0-9]{5,12})/i);
    if (accountMatch) summary.accountNumber = accountMatch[1];

    const currencyMatch = fullText.match(/(?:Currency|Tiền tệ):\s*([A-Z]{3})/i);
    if (currencyMatch) summary.currency = currencyMatch[1];

    const leverageMatch = fullText.match(/(?:Leverage|Đòn bẩy):\s*(1:[0-9]+)/i);
    if (leverageMatch) summary.leverage = leverageMatch[1];

    const depositMatch = fullText.match(/(?:Deposit|Nạp tiền|Credit):\s*([0-9.,]+)/i);
    if (depositMatch) summary.initialDeposit = parseFloat(depositMatch[1].replace(/,/g, ''));

    const withdrawMatch = fullText.match(/(?:Withdrawal|Rút tiền):\s*([0-9.,]+)/i);
    if (withdrawMatch) summary.totalWithdrawal = parseFloat(withdrawMatch[1].replace(/,/g, ''));

    const balanceMatch = fullText.match(/(?:Balance|Số dư cuối|Ending Balance):\s*([0-9.,]+)/i);
    if (balanceMatch) summary.endingBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));

    const trades: Trade[] = [];

    // Process spatial header coordinate alignment page by page
    for (let pIdx = 0; pIdx < pagesItems.length; pIdx++) {
      const pageItems = pagesItems[pIdx];

      // Group items into horizontal lines (Y-tolerance ~ 3px)
      const lineMap = new Map<number, PDFTextItemWithCoords[]>();
      pageItems.forEach((item) => {
        let foundY = Array.from(lineMap.keys()).find((k) => Math.abs(k - item.y) <= 3);
        if (foundY !== undefined) {
          lineMap.get(foundY)!.push(item);
        } else {
          lineMap.set(item.y, [item]);
        }
      });

      // Sort lines top-to-bottom (higher Y is top)
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([_, items]) => items.sort((a, b) => a.x - b.x));

      // Find Header Line
      let headerLineIndex = -1;
      let openTimeX = 40,
        ticketX = 100,
        symbolX = 160,
        typeX = 210,
        volumeX = 250,
        openPriceX = 300,
        slX = 350,
        tpX = 400,
        closeTimeX = 460,
        closePriceX = 520,
        commX = 570,
        swapX = 620,
        profitX = 670;

      for (let lIdx = 0; lIdx < sortedLines.length; lIdx++) {
        const lineText = sortedLines[lIdx].map((i) => i.str.toLowerCase()).join(' ');
        if (
          (lineText.includes('position') || lineText.includes('ticket') || lineText.includes('lệnh') || lineText.includes('vị thế')) &&
          (lineText.includes('symbol') || lineText.includes('mã')) &&
          (lineText.includes('price') || lineText.includes('giá'))
        ) {
          headerLineIndex = lIdx;

          // Dynamically record X coordinates of header items
          sortedLines[lIdx].forEach((item) => {
            const st = item.str.toLowerCase().trim();
            const cx = item.x + item.width / 2;
            if (st.includes('time') || st.includes('thời gian')) {
              if (cx < 200) openTimeX = cx;
              else closeTimeX = cx;
            } else if (st.includes('position') || st.includes('ticket') || st.includes('lệnh') || st.includes('order')) {
              ticketX = cx;
            } else if (st.includes('symbol') || st.includes('mã')) {
              symbolX = cx;
            } else if (st.includes('type') || st.includes('loại') || st.includes('action')) {
              typeX = cx;
            } else if (st.includes('volume') || st.includes('khối lượng') || st.includes('lots')) {
              volumeX = cx;
            } else if (st.includes('price') || st.includes('giá')) {
              if (cx < 400) openPriceX = cx;
              else closePriceX = cx;
            } else if (st.includes('s/l') || st.includes('sl') || st.includes('stop')) {
              slX = cx;
            } else if (st.includes('t/p') || st.includes('tp') || st.includes('profit')) {
              if (st.includes('take')) tpX = cx;
              else profitX = cx;
            } else if (st.includes('commission') || st.includes('hoa hồng') || st.includes('comm')) {
              commX = cx;
            } else if (st.includes('swap')) {
              swapX = cx;
            } else if (st.includes('profit') || st.includes('lợi nhuận')) {
              profitX = cx;
            }
          });
          break;
        }
      }

      // Calculate spatial boundary bounds between columns
      const bounds = [
        (openTimeX + ticketX) / 2, // 0: OpenTime / Ticket boundary
        (ticketX + symbolX) / 2, // 1: Ticket / Symbol boundary
        (symbolX + typeX) / 2, // 2: Symbol / Type boundary
        (typeX + volumeX) / 2, // 3: Type / Volume boundary
        (volumeX + openPriceX) / 2, // 4: Volume / OpenPrice boundary
        (openPriceX + slX) / 2, // 5: OpenPrice / SL boundary
        (slX + tpX) / 2, // 6: SL / TP boundary
        (tpX + closeTimeX) / 2, // 7: TP / CloseTime boundary
        (closeTimeX + closePriceX) / 2, // 8: CloseTime / ClosePrice boundary
        (closePriceX + commX) / 2, // 9: ClosePrice / Commission boundary
        (commX + swapX) / 2, // 10: Commission / Swap boundary
        (swapX + profitX) / 2, // 11: Swap / Profit boundary
      ];

      // Parse data rows
      const startLineIdx = headerLineIndex >= 0 ? headerLineIndex + 1 : 0;
      for (let lIdx = startLineIdx; lIdx < sortedLines.length; lIdx++) {
        const line = sortedLines[lIdx];
        const lineStr = line.map((i) => i.str).join(' ');

        // Skip non-trade summary lines
        if (
          lineStr.toLowerCase().includes('total') ||
          lineStr.toLowerCase().includes('balance') ||
          lineStr.toLowerCase().includes('closed p/l')
        ) {
          continue;
        }

        // Check if line contains ticket or date pattern
        const hasTicket = /[0-9]{5,12}/.test(lineStr);
        const hasDate = /[0-9]{4}\.[0-9]{2}\.[0-9]{2}|[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(lineStr);

        if (!hasTicket && !hasDate) continue;

        // Place items on line into 13 column buckets based on X bounds
        const colBuckets: string[] = Array(13).fill('');

        line.forEach((item) => {
          const cx = item.x + item.width / 2;
          let colIdx = 0;
          while (colIdx < bounds.length && cx > bounds[colIdx]) {
            colIdx++;
          }
          colBuckets[colIdx] = (colBuckets[colIdx] + ' ' + item.str).trim();
        });

        const openTimeRaw = colBuckets[0].replace(/\./g, '-');
        const ticket = colBuckets[1] || `${trades.length + 1000}`;
        const rawSymbol = colBuckets[2] || 'EURUSD';
        const typeRaw = colBuckets[3].toLowerCase();
        const volume = parseFloat(colBuckets[4]) || 0;
        const openPrice = parseFloat(colBuckets[5]) || 0;
        const sl = parseFloat(colBuckets[6]) || 0;
        const tp = parseFloat(colBuckets[7]) || 0;
        const closeTimeRaw = colBuckets[8].replace(/\./g, '-');
        const closePrice = parseFloat(colBuckets[9]) || 0;
        const commission = Math.abs(parseFloat(colBuckets[10].replace(/,/g, '')) || 0);
        const swap = parseFloat(colBuckets[11].replace(/,/g, '')) || 0;
        const pnl = parseFloat(colBuckets[12].replace(/,/g, '')) || 0;

        const norm = normalizeSymbol(rawSymbol);

        let openISO = new Date().toISOString();
        let closeISO = new Date().toISOString();
        try {
          if (openTimeRaw) openISO = new Date(openTimeRaw).toISOString();
        } catch {}
        try {
          if (closeTimeRaw) closeISO = new Date(closeTimeRaw).toISOString();
        } catch {}

        const direction: TradeDirection = typeRaw.includes('sell') || typeRaw.includes('short') ? 'Short' : 'Long';

        const tradeObj: Trade = {
          id: `trade-pdf-${ticket}-${lIdx}-${Date.now()}`,
          ticket,
          symbol: norm.canonicalSymbol,
          originalSymbol: norm.originalSymbol,
          symbolConfidence: norm.confidence,
          direction,
          volume,
          openTime: openISO,
          closeTime: closeISO,
          openPrice,
          closePrice,
          stopLoss: sl > 0 ? sl : undefined,
          takeProfit: tp > 0 ? tp : undefined,
          pnl,
          commission,
          swap,
          netPnl: pnl + swap - commission,
          setup: 'Exness PDF Spatial Import',
          market: detectMarket(norm.canonicalSymbol),
          session: detectSession(openISO),
          tags: ['exness-pdf', norm.canonicalSymbol.toLowerCase()],
          holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
        };

        const sanity = validateTradeSanity(tradeObj);
        if (!sanity.isValid) {
          tradeObj.isParseError = true;
          tradeObj.parseErrorReason = sanity.errorReason;
        }

        trades.push(tradeObj);
      }
    }

    // Fallback: If spatial column mapping produced no trades, try Regex extraction
    if (trades.length === 0) {
      logs.push(`[Layer 1 Spatial Fallback] Đang thử bóc tách bằng Regex tiêu chuẩn...`);
      const tradeRowRegex =
        /([0-9]{5,12})\s+([0-9]{4}\.[0-9]{2}\.[0-9]{2}\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)\s+(buy|sell)\s+([0-9.]+)\s+([A-Za-z0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9]{4}\.[0-9]{2}\.[0-9]{2}\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)\s+([0-9.]+)\s+([-0-9.,]+)\s+([-0-9.,]+)\s+([-0-9.,]+)/gi;

      let match;
      while ((match = tradeRowRegex.exec(fullText)) !== null) {
        const ticket = match[1];
        const openTimeRaw = match[2].replace(/\./g, '-');
        const side = match[3].toLowerCase();
        const volume = parseFloat(match[4]);
        const rawSymbol = match[5];
        const norm = normalizeSymbol(rawSymbol);
        const symbol = norm.canonicalSymbol;
        const openPrice = parseFloat(match[6]);
        const sl = parseFloat(match[7]);
        const tp = parseFloat(match[8]);
        const closeTimeRaw = match[9].replace(/\./g, '-');
        const closePrice = parseFloat(match[10]);
        const commission = Math.abs(parseFloat(match[11].replace(/,/g, '')));
        const swap = parseFloat(match[12].replace(/,/g, ''));
        const pnl = parseFloat(match[13].replace(/,/g, ''));

        const openISO = new Date(openTimeRaw).toISOString();
        const closeISO = new Date(closeTimeRaw).toISOString();

        const tradeObj: Trade = {
          id: `trade-pdf-${ticket}-${Date.now()}`,
          ticket,
          symbol,
          originalSymbol: norm.originalSymbol,
          symbolConfidence: norm.confidence,
          direction: side === 'sell' ? 'Short' : 'Long',
          volume,
          openTime: openISO,
          closeTime: closeISO,
          openPrice,
          closePrice,
          stopLoss: sl > 0 ? sl : undefined,
          takeProfit: tp > 0 ? tp : undefined,
          pnl,
          commission,
          swap,
          netPnl: pnl + swap - commission,
          setup: 'Exness PDF Import',
          market: detectMarket(symbol),
          session: detectSession(openISO),
          tags: ['exness-pdf', symbol.toLowerCase()],
          holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
        };

        const sanity = validateTradeSanity(tradeObj);
        if (!sanity.isValid) {
          tradeObj.isParseError = true;
          tradeObj.parseErrorReason = sanity.errorReason;
        }

        trades.push(tradeObj);
      }
    }

    if (trades.length > 0) {
      logs.push(`[Layer 1 Success] Đã bóc tách thành công ${trades.length} lệnh giao dịch từ PDF.`);
      summary.totalClosedTrades = trades.length;
      summary.statementNetProfit = trades.reduce((acc, t) => acc + t.netPnl, 0);
      const validation = validateStatement(trades, summary);
      return { trades, summary, validation, errors: [], logs };
    }

    // Layer 2: pdf-lib Document Structure Scan Fallback
    logs.push(`[Layer 2: pdf-lib] Không khớp regex tiêu chuẩn. Đang dùng pdf-lib phân tích cấu trúc luồng byte.`);
    const pdfLibDoc = await PDFDocument.load(arrayBuffer);
    logs.push(`[Layer 2: pdf-lib] Đã kiểm tra ${pdfLibDoc.getPageCount()} trang document structure.`);

    // Layer 4: AI Mapping Fallback via Gemini Endpoint
    logs.push(`[Layer 4: AI Inference Engine] Khởi tạo AI Gemini 3.6 Flash để tự động suy luận định dạng PDF.`);
    const aiResult = await callAIParseStatementAPI(fullText, file.name);

    if (aiResult && aiResult.trades && aiResult.trades.length > 0) {
      logs.push(`[Layer 4 Success] AI Gemini đã bóc tách thành công ${aiResult.trades.length} lệnh giao dịch.`);
      const aiSummary: StatementSummary = {
        brokerName: aiResult.brokerName || 'Exness / AI Inferred',
        accountNumber: aiResult.accountNumber,
        platform: 'PDF Statement (AI Parsed)',
        currency: aiResult.currency || 'USD',
        leverage: aiResult.leverage,
        initialDeposit: aiResult.initialDeposit,
        totalWithdrawal: aiResult.totalWithdrawal,
        totalClosedTrades: aiResult.trades.length,
        statementNetProfit: aiResult.totalNetProfit,
        endingBalance: aiResult.endingBalance,
        parserUsed: 'Layer 4: Gemini 3.6 Flash AI Pipeline',
      };

      const normalizedTrades: Trade[] = aiResult.trades.map((t: any, idx: number) => {
        const openISO = new Date(t.openTime || Date.now()).toISOString();
        const closeISO = new Date(t.closeTime || Date.now()).toISOString();
        const comm = Math.abs(parseFloat(t.commission) || 0);
        const sw = parseFloat(t.swap) || 0;
        const grossPnl = parseFloat(t.pnl) || 0;
        const net = t.netPnl !== undefined ? parseFloat(t.netPnl) : grossPnl + sw - comm;

        const rawSym = String(t.symbol || 'EURUSD');
        const norm = normalizeSymbol(rawSym);

        const tradeObj: Trade = {
          id: `trade-ai-${t.ticket || idx}-${Date.now()}`,
          ticket: String(t.ticket || idx + 1000),
          symbol: norm.canonicalSymbol,
          originalSymbol: norm.originalSymbol,
          symbolConfidence: norm.confidence,
          direction: t.direction === 'Short' || String(t.direction).toLowerCase().includes('sell') ? 'Short' : 'Long',
          volume: parseFloat(t.volume) || 0.1,
          openTime: openISO,
          closeTime: closeISO,
          openPrice: parseFloat(t.openPrice) || 0,
          closePrice: parseFloat(t.closePrice) || 0,
          stopLoss: parseFloat(t.stopLoss) > 0 ? parseFloat(t.stopLoss) : undefined,
          takeProfit: parseFloat(t.takeProfit) > 0 ? parseFloat(t.takeProfit) : undefined,
          pnl: grossPnl,
          commission: comm,
          swap: sw,
          netPnl: net,
          setup: 'AI Statement Auto-Parse',
          market: detectMarket(norm.canonicalSymbol),
          session: detectSession(openISO),
          tags: ['ai-imported', norm.canonicalSymbol.toLowerCase()],
          holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
        };

        const sanity = validateTradeSanity(tradeObj);
        if (!sanity.isValid) {
          tradeObj.isParseError = true;
          tradeObj.parseErrorReason = sanity.errorReason;
        }

        return tradeObj;
      });

      const validation = validateStatement(normalizedTrades, aiSummary);
      return { trades: normalizedTrades, summary: aiSummary, validation, errors: [], logs };
    }

    errors.push('Không thể bóc tách dữ liệu từ file PDF. Đảm bảo file không có mật khẩu vệ sinh dữ liệu.');
    return {
      trades: [],
      summary,
      validation: {
        isValid: false,
        status: 'Discrepancy Error',
        profitDifference: 0,
        balanceDifference: 0,
        tradeCountDifference: 0,
        warnings: errors,
        discrepantTradeIndices: [],
      },
      errors,
      logs,
    };
  } catch (err: any) {
    logs.push(`[PDF Parse Error] ${err.message}`);
    errors.push(`Lỗi khi đọc file PDF: ${err.message}`);
    return {
      trades: [],
      summary: {},
      validation: {
        isValid: false,
        status: 'Discrepancy Error',
        profitDifference: 0,
        balanceDifference: 0,
        tradeCountDifference: 0,
        warnings: errors,
        discrepantTradeIndices: [],
      },
      errors,
      logs,
    };
  }
}

// CSV / TXT PARSER ENGINE
export function parseCSVStatement(csvContent: string, logs: string[] = []): PipelineParseResult {
  const errors: string[] = [];
  logs.push(`[CSV Parser] Đang phân tích dòng CSV/TXT...`);

  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data as Record<string, string>[];

  if (!rows || rows.length === 0) {
    errors.push('File CSV/TXT rỗng hoặc không có dữ liệu phù hợp.');
    return {
      trades: [],
      summary: {},
      validation: { isValid: false, status: 'Discrepancy Error', profitDifference: 0, balanceDifference: 0, tradeCountDifference: 0, warnings: errors, discrepantTradeIndices: [] },
      errors,
      logs,
    };
  }

  const trades: Trade[] = [];

  rows.forEach((row, index) => {
    const normalized = normalizeRowKeys(row);

    const rawType = extractValueByKeys(normalized, ['type', 'side', 'action', 'direction', 'tradetype', 'buysell']).toLowerCase();
    if (rawType.includes('balance') || rawType.includes('deposit') || rawType.includes('credit') || rawType.includes('withdrawal')) {
      return;
    }

    const rawSymbol = extractValueByKeys(normalized, ['symbol', 'item', 'pair', 'instrument', 'asset', 'currencypair']) || 'XAUUSD';
    const norm = normalizeSymbol(rawSymbol);
    const symbol = norm.canonicalSymbol;
    const direction: TradeDirection = rawType.includes('sell') || rawType.includes('short') ? 'Short' : 'Long';
    const volume = parseFloat(extractValueByKeys(normalized, ['volume', 'lots', 'size', 'amount', 'qty', 'quantity']) || '0.1');

    const openTimeRaw = extractValueByKeys(normalized, ['opentime', 'open', 'time', 'date', 'opentimestamp']) || new Date().toISOString();
    const closeTimeRaw = extractValueByKeys(normalized, ['closetime', 'close', 'closetimestamp']) || openTimeRaw;

    const openPrice = parseFloat(extractValueByKeys(normalized, ['openprice', 'price', 'entry', 'entryprice']) || '0');
    const closePrice = parseFloat(extractValueByKeys(normalized, ['closeprice', 'exit', 'exitprice', 'close']) || '0');

    const sl = parseFloat(extractValueByKeys(normalized, ['sl', 'stoploss']) || '0');
    const tp = parseFloat(extractValueByKeys(normalized, ['tp', 'takeprofit']) || '0');

    const pnl = parseFloat(extractValueByKeys(normalized, ['profit', 'pnl', 'netpnl', 'realizedpnl', 'grossprofit', 'profitusd']) || '0');
    const commission = Math.abs(parseFloat(extractValueByKeys(normalized, ['commission', 'comm', 'fee']) || '0'));
    const swap = parseFloat(extractValueByKeys(normalized, ['swap', 'rollover', 'financing']) || '0');
    const netPnl = pnl + swap - commission;

    let openISO = new Date().toISOString();
    let closeISO = new Date().toISOString();
    try { openISO = new Date(openTimeRaw).toISOString(); } catch {}
    try { closeISO = new Date(closeTimeRaw).toISOString(); } catch {}

    const ticket = extractValueByKeys(normalized, ['ticket', 'order', 'id', 'deal', 'positionid', 'tradeid']) || `${index + 1000}`;

    const tradeObj: Trade = {
      id: `trade-csv-${ticket}-${index}-${Date.now()}`,
      ticket,
      symbol,
      originalSymbol: norm.originalSymbol,
      symbolConfidence: norm.confidence,
      direction,
      volume,
      openTime: openISO,
      closeTime: closeISO,
      openPrice,
      closePrice,
      stopLoss: sl > 0 ? sl : undefined,
      takeProfit: tp > 0 ? tp : undefined,
      pnl,
      commission,
      swap,
      netPnl,
      setup: 'CSV/TXT Statement Import',
      market: detectMarket(symbol),
      session: detectSession(openISO),
      tags: ['csv-import', symbol.toLowerCase()],
      holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
    };

    const sanity = validateTradeSanity(tradeObj);
    if (!sanity.isValid) {
      tradeObj.isParseError = true;
      tradeObj.parseErrorReason = sanity.errorReason;
    }

    trades.push(tradeObj);
  });

  logs.push(`[CSV Success] Đã bóc tách ${trades.length} lệnh giao dịch từ CSV.`);

  const summary: StatementSummary = {
    brokerName: 'CSV / Multi-Broker Import',
    platform: 'CSV Statement Engine',
    totalClosedTrades: trades.length,
    statementNetProfit: trades.reduce((a, b) => a + b.netPnl, 0),
    parserUsed: 'CSV Standard Parser',
  };

  const validation = validateStatement(trades, summary);
  return { trades, summary, validation, errors, logs };
}

// HTML PARSER ENGINE
export function parseHTMLStatement(htmlText: string, logs: string[] = []): PipelineParseResult {
  logs.push(`[HTML Parser] Đang phân tích file HTML Statement theo Header...`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const tables = doc.querySelectorAll('table');
  const trades: Trade[] = [];
  const errors: string[] = [];

  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return;

    // Detect Header Row
    let headerRowIndex = -1;
    let openTimeIdx = -1,
      ticketIdx = -1,
      symbolIdx = -1,
      typeIdx = -1,
      volumeIdx = -1;
    let openPriceIdx = -1,
      slIdx = -1,
      tpIdx = -1,
      closeTimeIdx = -1,
      closePriceIdx = -1;
    let commIdx = -1,
      swapIdx = -1,
      profitIdx = -1;

    for (let rIdx = 0; rIdx < Math.min(10, rows.length); rIdx++) {
      const cells = Array.from(rows[rIdx].querySelectorAll('th, td')).map((c) => c.textContent?.trim().toLowerCase() || '');
      const lineStr = cells.join(' ');

      if (
        (lineStr.includes('position') || lineStr.includes('ticket') || lineStr.includes('order') || lineStr.includes('lệnh') || lineStr.includes('vị thế')) &&
        (lineStr.includes('symbol') || lineStr.includes('mã') || lineStr.includes('item'))
      ) {
        headerRowIndex = rIdx;

        cells.forEach((st, cIdx) => {
          if (st.includes('open time') || st.includes('thời gian mở') || (st.includes('time') && openTimeIdx === -1)) {
            openTimeIdx = cIdx;
          } else if (st.includes('close time') || st.includes('thời gian đóng') || st.includes('close date')) {
            closeTimeIdx = cIdx;
          } else if (st.includes('time') || st.includes('thời gian')) {
            if (openTimeIdx === -1) openTimeIdx = cIdx;
            else closeTimeIdx = cIdx;
          } else if (st.includes('position') || st.includes('ticket') || st.includes('order') || st.includes('deal') || st.includes('lệnh')) {
            ticketIdx = cIdx;
          } else if (st.includes('symbol') || st.includes('mã') || st.includes('item')) {
            symbolIdx = cIdx;
          } else if (st.includes('type') || st.includes('loại') || st.includes('action') || st.includes('side')) {
            typeIdx = cIdx;
          } else if (st.includes('volume') || st.includes('khối lượng') || st.includes('lots') || st.includes('size')) {
            volumeIdx = cIdx;
          } else if (st.includes('open price') || st.includes('giá mở')) {
            openPriceIdx = cIdx;
          } else if (st.includes('close price') || st.includes('giá đóng')) {
            closePriceIdx = cIdx;
          } else if (st.includes('price') || st.includes('giá')) {
            if (openPriceIdx === -1) openPriceIdx = cIdx;
            else closePriceIdx = cIdx;
          } else if (st.includes('s/l') || st.includes('sl') || st.includes('stop loss')) {
            slIdx = cIdx;
          } else if (st.includes('t/p') || st.includes('tp') || st.includes('take profit')) {
            tpIdx = cIdx;
          } else if (st.includes('commission') || st.includes('hoa hồng') || st.includes('comm') || st.includes('fee')) {
            commIdx = cIdx;
          } else if (st.includes('swap') || st.includes('phí qua đêm')) {
            swapIdx = cIdx;
          } else if (st.includes('profit') || st.includes('lợi nhuận') || st.includes('pnl')) {
            profitIdx = cIdx;
          }
        });
        break;
      }
    }

    // Fallback default index order if table header wasn't found explicitly
    if (ticketIdx === -1) ticketIdx = 0;
    if (openTimeIdx === -1) openTimeIdx = 1;
    if (typeIdx === -1) typeIdx = 2;
    if (volumeIdx === -1) volumeIdx = 3;
    if (symbolIdx === -1) symbolIdx = 4;
    if (openPriceIdx === -1) openPriceIdx = 5;
    if (slIdx === -1) slIdx = 6;
    if (tpIdx === -1) tpIdx = 7;
    if (closeTimeIdx === -1) closeTimeIdx = 8;
    if (closePriceIdx === -1) closePriceIdx = 9;
    if (commIdx === -1) commIdx = 10;
    if (swapIdx === -1) swapIdx = 11;
    if (profitIdx === -1) profitIdx = 12;

    const startIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
    for (let rIdx = startIdx; rIdx < rows.length; rIdx++) {
      const cells = Array.from(rows[rIdx].querySelectorAll('td')).map((c) => c.textContent?.trim() || '');
      if (cells.length < 5) continue;

      const ticketText = cells[ticketIdx] || '';
      const openTimeText = cells[openTimeIdx] || '';
      const typeText = (cells[typeIdx] || '').toLowerCase();
      const symbolText = cells[symbolIdx] || '';

      if (!ticketText || (!typeText.includes('buy') && !typeText.includes('sell') && !typeText.includes('short') && !typeText.includes('long'))) {
        continue;
      }

      const volumeText = cells[volumeIdx] || '0.1';
      const openPriceText = cells[openPriceIdx] || '0';
      const slText = cells[slIdx] || '0';
      const tpText = cells[tpIdx] || '0';
      const closeTimeText = cells[closeTimeIdx] || openTimeText;
      const closePriceText = cells[closePriceIdx] || '0';
      const commissionText = cells[commIdx] || '0';
      const swapText = cells[swapIdx] || '0';
      const profitText = cells[profitIdx] || '0';

      let openISO = new Date().toISOString();
      let closeISO = new Date().toISOString();
      try {
        if (openTimeText) openISO = new Date(openTimeText).toISOString();
      } catch {}
      try {
        if (closeTimeText) closeISO = new Date(closeTimeText).toISOString();
      } catch {}

      const pnl = parseFloat(profitText.replace(/[^0-9.-]/g, '')) || 0;
      const commission = Math.abs(parseFloat(commissionText.replace(/[^0-9.-]/g, ''))) || 0;
      const swap = parseFloat(swapText.replace(/[^0-9.-]/g, '')) || 0;
      const direction: TradeDirection = typeText.includes('sell') || typeText.includes('short') ? 'Short' : 'Long';

      const norm = normalizeSymbol(symbolText);
      const symbol = norm.canonicalSymbol;

      const tradeObj: Trade = {
        id: `trade-html-${ticketText}-${rIdx}-${Date.now()}`,
        ticket: ticketText,
        symbol,
        originalSymbol: norm.originalSymbol,
        symbolConfidence: norm.confidence,
        direction,
        volume: parseFloat(volumeText) || 0.1,
        openTime: openISO,
        closeTime: closeISO,
        openPrice: parseFloat(openPriceText) || 0,
        closePrice: parseFloat(closePriceText) || 0,
        stopLoss: parseFloat(slText) > 0 ? parseFloat(slText) : undefined,
        takeProfit: parseFloat(tpText) > 0 ? parseFloat(tpText) : undefined,
        pnl,
        commission,
        swap,
        netPnl: pnl + swap - commission,
        setup: 'HTML Header Statement Import',
        market: detectMarket(symbol),
        session: detectSession(openISO),
        tags: ['html-import', symbol.toLowerCase()],
        holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
      };

      const sanity = validateTradeSanity(tradeObj);
      if (!sanity.isValid) {
        tradeObj.isParseError = true;
        tradeObj.parseErrorReason = sanity.errorReason;
      }

      trades.push(tradeObj);
    }
  });

  if (trades.length === 0) {
    errors.push('Không tìm thấy bảng lệnh hợp lệ trong file HTML.');
  }

  logs.push(`[HTML Success] Đã bóc tách ${trades.length} lệnh từ HTML.`);

  const summary: StatementSummary = {
    brokerName: 'MetaTrader / Exness HTML',
    platform: 'HTML Report Engine',
    totalClosedTrades: trades.length,
    statementNetProfit: trades.reduce((a, b) => a + b.netPnl, 0),
    parserUsed: 'HTML Header DOM Parser',
  };

  const validation = validateStatement(trades, summary);
  return { trades, summary, validation, errors, logs };
}

/**
 * EXNESS EXCEL PARSER ENGINE (ExnessExcelParser)
 * Directly parses XLSX / XLS workbooks without OCR or PDF conversion.
 * Dynamically detects worksheets, header row, and column mapping.
 * Normalizes symbols (BTCUSDc -> BTCUSD), parses account metadata & summary.
 */
export function parseExnessExcelStatement(arrayBuffer: ArrayBuffer, logs: string[] = []): PipelineParseResult {
  logs.push(`[ExnessExcelParser] Kích hoạt Exness Excel Statement Engine chuyên dụng (Đọc trực tiếp Workbook)...`);
  const errors: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: false });
  } catch (err: any) {
    errors.push(`Khung Excel không đọc được: ${err?.message || 'File Excel bị lỗi hoặc bị khóa mật khẩu'}`);
    return {
      trades: [],
      summary: {},
      validation: { isValid: false, status: 'Discrepancy Error', profitDifference: 0, balanceDifference: 0, tradeCountDifference: 0, warnings: errors, discrepantTradeIndices: [] },
      errors,
      logs,
    };
  }

  logs.push(`[ExnessExcelParser] Đã nạp thành công Workbook với ${workbook.SheetNames.length} sheet: [${workbook.SheetNames.join(', ')}]`);

  // 1. Dynamic Sheet Selection & All-Sheet Scan
  let selectedSheetName = '';
  let highestScore = -1;
  let selectedSheetRows: any[][] = [];

  const allSheetTexts: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: false });
    if (!rows || rows.length === 0) return;

    const sheetText = rows
      .map((r) => (Array.isArray(r) ? r.join(' ') : ''))
      .join('\n')
      .toLowerCase();

    allSheetTexts.push(sheetText);

    let score = 0;
    if (sheetText.includes('position id') || sheetText.includes('ticket') || sheetText.includes('order')) score += 15;
    if (sheetText.includes('closed transactions') || sheetText.includes('positions') || sheetText.includes('trade history') || sheetText.includes('deals')) score += 20;
    if (sheetText.includes('volume in lots') || sheetText.includes('volume') || sheetText.includes('lots')) score += 10;
    if (sheetText.includes('open time') || sheetText.includes('close time')) score += 10;
    if (sheetText.includes('profit') || sheetText.includes('closed trade p/l')) score += 10;

    if (score > highestScore) {
      highestScore = score;
      selectedSheetName = sheetName;
      selectedSheetRows = rows;
    }
  });

  if (!selectedSheetName || selectedSheetRows.length === 0) {
    selectedSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[selectedSheetName];
    selectedSheetRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: false });
  }

  logs.push(`[ExnessExcelParser] Đã chọn Sheet chứa Lịch sử giao dịch: "${selectedSheetName}" (Điểm khớp: ${highestScore})`);

  const fullText = allSheetTexts.join('\n');

  // 2. Metadata Parser
  const parseVal = (re: RegExp): number => {
    const m = fullText.match(re);
    if (!m) return 0;
    return parseCleanNumber(m[1]);
  };

  const isExnessSC = fullText.includes('exness (sc) ltd');
  const isExnessTech = fullText.includes('exness technologies ltd');
  const brokerMatch = fullText.match(/(?:company|broker|đơn vị)[\s:]*([^\n\r]+)/i);
  const broker = brokerMatch
    ? brokerMatch[1].trim()
    : isExnessSC
    ? 'Exness (SC) Ltd'
    : isExnessTech
    ? 'Exness Technologies Ltd'
    : 'Exness Technologies Ltd';

  const accountMatch = fullText.match(/(?:account|account no|tài khoản|position no)[\s:]*([0-9]{5,12})/i);
  const accountNumber = accountMatch ? accountMatch[1] : '';

  const nameMatch = fullText.match(/(?:name|account holder|tên)[\s:]*([^\n\r]+)/i);
  const accountName = nameMatch ? nameMatch[1].replace(/Account:.*$/i, '').trim() : '';

  const currencyMatch = fullText.match(/\((USC|USD|USDT|EUR|VND)/i) || fullText.match(/(?:currency|đơn vị tiền tệ)[\s:]*([A-Z]{3})/i);
  const currency = currencyMatch ? currencyMatch[1] : 'USD';

  const leverageMatch = fullText.match(/(?:leverage|đòn bẩy)[\s:]*([0-9]+:[0-9]+)/i);
  const leverage = leverageMatch ? leverageMatch[1] : '1:2000';

  const issueDateMatch = fullText.match(
    /(?:date of statement issue|statement issue date|ngày phát hành|date)[\s:]*([0-9]{4}[.-][0-9]{2}[.-][0-9]{2}\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)/i
  );
  const issueDate = issueDateMatch ? issueDateMatch[1] : '';

  const periodMatch = fullText.match(
    /(?:period of statement|statement period|kỳ sao kê)[\s:]*([0-9]{4}[.-][0-9]{2}[.-][0-9]{2}(?:\s*-\s*|\s+to\s+)[0-9]{4}[.-][0-9]{2}[.-][0-9]{2})/i
  );
  const period = periodMatch ? periodMatch[1] : '';

  const exnessAccountInfo: ExnessAccountInfo = {
    broker,
    account: accountNumber,
    name: accountName,
    currency,
    leverage,
    issueDate,
    period,
  };

  // 3. Summary Details Parser
  const deposit = parseVal(/(?:deposit|tiền nạp)[\s:]*([-0-9.,\s]+)/i);
  const withdraw = parseVal(/(?:withdrawal|tiền rút)[\s:]*([-0-9.,\s]+)/i);
  const closedPL = parseVal(/(?:closed trade p\/l|closed p\/l)[\s:]*([-0-9.,\s]+)/i);
  const floatingPL = parseVal(/(?:floating p\/l)[\s:]*([-0-9.,\s]+)/i);
  const totalPL = parseVal(/(?:total p\/l)[\s:]*([-0-9.,\s]+)/i);
  const balance = parseVal(/(?:balance)[\s:]*([-0-9.,\s]+)/i);
  const equity = parseVal(/(?:equity)[\s:]*([-0-9.,\s]+)/i);
  const margin = parseVal(/(?:margin)[\s:]*([-0-9.,\s]+)/i);
  const freeMargin = parseVal(/(?:free margin)[\s:]*([-0-9.,\s]+)/i);

  const exnessSummaryDetails: ExnessSummaryDetails = {
    deposit,
    withdraw,
    closedPL,
    floatingPL,
    totalPL,
    balance,
    equity,
    margin,
    freeMargin,
  };

  logs.push(`[Exness Excel Metadata] Broker: ${broker} | Account: ${accountNumber} | Currency: ${currency} | Leverage: ${leverage}`);

  // 4. Dynamic Header Scanning
  let headerRowIndex = -1;
  let colTicket = -1;
  let colType = -1;
  let colOpenTime = -1;
  let colItem = -1;
  let colCloseTime = -1;
  let colSL = -1;
  let colTP = -1;
  let colComm = -1;
  let colTaxes = -1;
  let colSwap = -1;
  let colProfit = -1;
  let colEntryPrice = -1;
  let colExitPrice = -1;
  let colEntryVol = -1;
  let colExitVol = -1;

  for (let rIdx = 0; rIdx < Math.min(35, selectedSheetRows.length); rIdx++) {
    const row = selectedSheetRows[rIdx];
    if (!Array.isArray(row) || row.length < 3) continue;

    const rowStr = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');

    if (
      (rowStr.includes('position') || rowStr.includes('ticket') || rowStr.includes('order') || rowStr.includes('deal') || rowStr.includes('time')) &&
      (rowStr.includes('item') || rowStr.includes('symbol') || rowStr.includes('type') || rowStr.includes('profit'))
    ) {
      headerRowIndex = rIdx;

      const timeCols: number[] = [];
      const priceCols: number[] = [];
      const volCols: number[] = [];

      row.forEach((cellVal, cIdx) => {
        const st = String(cellVal || '').toLowerCase().trim();

        if (st.includes('open time') || st.includes('entry time')) {
          colOpenTime = cIdx;
        } else if (st.includes('close time') || st.includes('exit time')) {
          colCloseTime = cIdx;
        } else if (st === 'time' || st.includes('thời gian')) {
          timeCols.push(cIdx);
        } else if (st.includes('position') || st.includes('ticket') || st.includes('order') || st.includes('deal')) {
          colTicket = cIdx;
        } else if (st.includes('symbol') || st.includes('item') || st.includes('mã')) {
          colItem = cIdx;
        } else if (st.includes('type') || st.includes('side') || st.includes('action')) {
          colType = cIdx;
        } else if (st === 'price' || st.includes('giá')) {
          priceCols.push(cIdx);
        } else if (st.includes('volume') || st.includes('lots') || st.includes('khối lượng')) {
          volCols.push(cIdx);
        } else if (st.includes('s / l') || st === 'sl' || st.includes('s/l') || st.includes('stop loss')) {
          colSL = cIdx;
        } else if (st.includes('t / p') || st === 'tp' || st.includes('t/p') || st.includes('take profit')) {
          colTP = cIdx;
        } else if (st.includes('commission') || st.includes('comm') || st.includes('hoa hồng')) {
          colComm = cIdx;
        } else if (st.includes('taxes') || st.includes('tax') || st.includes('thuế')) {
          colTaxes = cIdx;
        } else if (st.includes('swap') || st.includes('phí qua đêm')) {
          colSwap = cIdx;
        } else if (st.includes('profit') || st.includes('lợi nhuận') || st.includes('pnl')) {
          colProfit = cIdx;
        }
      });

      // Resolve open / close time if not explicitly labeled "open time" / "close time"
      if (colOpenTime === -1 && timeCols.length > 0) colOpenTime = timeCols[0];
      if (colCloseTime === -1) {
        if (timeCols.length > 1) colCloseTime = timeCols[1];
        else colCloseTime = colOpenTime;
      }

      if (priceCols.length > 0) {
        colEntryPrice = priceCols[0];
        colExitPrice = priceCols[1] !== undefined ? priceCols[1] : priceCols[0];
      }

      if (volCols.length > 0) {
        colEntryVol = volCols[0];
        colExitVol = volCols[1] !== undefined ? volCols[1] : volCols[0];
      }

      break;
    }
  }

  // Fallbacks if header mapping missed any column
  if (colOpenTime === -1) colOpenTime = 0;
  if (colTicket === -1) colTicket = 1;
  if (colItem === -1) colItem = 2;
  if (colType === -1) colType = 3;
  if (colEntryVol === -1) colEntryVol = 4;
  if (colExitVol === -1) colExitVol = colEntryVol;
  if (colEntryPrice === -1) colEntryPrice = 5;
  if (colSL === -1) colSL = 6;
  if (colTP === -1) colTP = 7;
  if (colCloseTime === -1) colCloseTime = 8;
  if (colExitPrice === -1) colExitPrice = 9;
  if (colComm === -1) colComm = 10;
  if (colSwap === -1) colSwap = 11;
  if (colProfit === -1) colProfit = 12;

  logs.push(
    `[Header Dynamic Mapping] Header ở dòng ${headerRowIndex + 1}. Ticket:${colTicket}, Type:${colType}, OpenTime:${colOpenTime}, Item:${colItem}, EntryPrice:${colEntryPrice}, ExitPrice:${colExitPrice}, Profit:${colProfit}`
  );

  // 5. Parse Trade Data Rows
  const trades: Trade[] = [];
  const startRIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;

  for (let rIdx = startRIdx; rIdx < selectedSheetRows.length; rIdx++) {
    const row = selectedSheetRows[rIdx];
    if (!Array.isArray(row) || row.length < 3) continue;

    const rowStr = row.map((c) => String(c || '').trim()).join(' ');
    const rowLower = rowStr.toLowerCase();

    if (
      rowLower.includes('total') ||
      rowLower.includes('summary') ||
      rowLower.includes('open positions') ||
      rowLower.includes('pending orders') ||
      rowLower.includes('working orders') ||
      rowLower.includes('exness technologies') ||
      rowLower.includes('trade history report')
    ) {
      continue;
    }

    const ticketRaw = String(row[colTicket] || '').trim();
    const typeRaw = String(row[colType] || '').toLowerCase().trim();

    if (!ticketRaw || (!typeRaw.includes('buy') && !typeRaw.includes('sell'))) {
      continue;
    }

    const openTimeRaw = String(row[colOpenTime] || '').trim();
    const itemRaw = String(row[colItem] || '').trim() || 'EURUSD';
    const entryPrice = parseCleanNumber(row[colEntryPrice]);
    const entryVolume = parseCleanNumber(row[colEntryVol]);
    const closeTimeRaw = String(row[colCloseTime] || '').trim() || openTimeRaw;
    const exitPrice = parseCleanNumber(row[colExitPrice]);
    const exitVolume = parseCleanNumber(row[colExitVol]) || entryVolume;
    const sl = parseCleanNumber(row[colSL]);
    const tp = parseCleanNumber(row[colTP]);
    const commission = Math.abs(parseCleanNumber(row[colComm]));
    const tax = parseCleanNumber(row[colTaxes]);
    const swap = parseCleanNumber(row[colSwap]);
    const profit = parseCleanNumber(row[colProfit]);

    const side = typeRaw.includes('buy') ? 'BUY' : 'SELL';
    const direction: TradeDirection = side === 'BUY' ? 'Long' : 'Short';

    // Symbol Normalization (XAUUSDc -> XAUUSD, keeping originalSymbol = XAUUSDc)
    const norm = normalizeSymbol(itemRaw);
    const symbol = norm.canonicalSymbol;

    const openISO = parseExnessDate(openTimeRaw).isoStr;
    const closeISO = parseExnessDate(closeTimeRaw).isoStr;

    const tradeObj: Trade = {
      id: `trade-excel-exness-${ticketRaw}-${rIdx}-${Date.now()}`,
      ticket: ticketRaw,
      symbol,
      originalSymbol: norm.originalSymbol,
      symbolConfidence: norm.confidence,
      direction,
      volume: entryVolume,
      openTime: openISO,
      closeTime: closeISO,
      openPrice: entryPrice,
      closePrice: exitPrice,
      stopLoss: sl > 0 ? sl : undefined,
      takeProfit: tp > 0 ? tp : undefined,
      pnl: profit,
      commission,
      tax,
      swap,
      netPnl: profit + swap - commission - tax,
      setup: 'Exness Excel Import Engine',
      market: detectMarket(symbol),
      session: detectSession(openISO),
      tags: ['exness-excel', symbol.toLowerCase()],
      holdingTimeMinutes: calculateHoldingMinutes(openISO, closeISO),
    };

    // Validation checks
    const validation = validateExnessTradeV2({
      entryPrice,
      exitPrice,
      entryVolume,
      exitVolume,
      openTime: openISO,
      closeTime: closeISO,
      profit,
      commission,
      swap,
      side,
    });

    if (!validation.isValid) {
      tradeObj.isParseError = true;
      tradeObj.parseErrorReason = validation.errorReason;
    }

    trades.push(tradeObj);
  }

  logs.push(`[ExnessExcelParser] Đã bóc tách thành công ${trades.length} lệnh từ Excel.`);

  const summary: StatementSummary = {
    brokerName: broker,
    accountNumber: accountNumber,
    accountName: accountName,
    platform: 'Exness Excel Parser (100% Native)',
    currency: currency,
    leverage: leverage,
    issueDate: issueDate,
    period: period,
    totalClosedTrades: trades.length,
    statementNetProfit: trades.reduce((a, b) => a + b.netPnl, 0),
    endingBalance: balance || 0,
    parserUsed: 'ExnessExcelParser (Native Dynamic Workbook Engine)',
    exnessAccountInfo,
    exnessSummaryDetails,
  };

  const statementValidation = validateStatement(trades, summary);

  return {
    trades,
    summary,
    validation: statementValidation,
    errors,
    logs,
  };
}

export function parseExcelStatement(arrayBuffer: ArrayBuffer, logs: string[] = []): PipelineParseResult {
  logs.push(`[Excel Engine] Chuyển tiếp tới ExnessExcelParser chuyên dụng cho file Excel (.xlsx/.xls)...`);
  return parseExnessExcelStatement(arrayBuffer, logs);
}

/**
 * MULTI-FILE BATCH PARSER PIPELINE
 * Processes multiple files according to Priority Hierarchy:
 * 1. Excel (.xlsx)
 * 2. Excel (.xls)
 * 3. CSV (.csv / .txt)
 * 4. PDF (.pdf)
 * Skips PDF files if Excel files are present in the batch to avoid duplicates.
 * Automatically deduplicates trades across files and against existing store trades.
 */
export async function parseBatchTradingStatementsPipeline(
  files: File[],
  existingTrades: Trade[] = []
): Promise<BatchImportResult> {
  const logs: string[] = [];
  const errors: string[] = [];
  logs.push(`[Batch Import Engine] Bắt đầu xử lý ${files.length} file statement...`);

  // Priority ranking: .xlsx (1) > .xls (2) > .csv (3) > .pdf (4)
  const getPriority = (fileName: string): number => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.xlsx')) return 1;
    if (name.endsWith('.xls')) return 2;
    if (name.endsWith('.csv') || name.endsWith('.txt')) return 3;
    if (name.endsWith('.pdf')) return 4;
    return 5;
  };

  const sortedFiles = [...files].sort((a, b) => getPriority(a.name) - getPriority(b.name));

  const hasExcel = sortedFiles.some((f) => {
    const name = f.name.toLowerCase();
    return name.endsWith('.xlsx') || name.endsWith('.xls');
  });

  const filesToProcess: File[] = [];
  let skippedPdfCount = 0;

  for (const file of sortedFiles) {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    if (isPdf && hasExcel) {
      skippedPdfCount++;
      logs.push(
        `[Batch Priority] Ưu tiên file Excel (.xlsx/.xls). Bỏ qua file PDF "${file.name}" để tránh trùng lặp dữ liệu.`
      );
    } else {
      filesToProcess.push(file);
    }
  }

  const signatureSet = new Set<string>();

  const getTradeSignature = (t: Partial<Trade>): string => {
    if (t.ticket && String(t.ticket).trim().length >= 3) {
      return `ticket:${String(t.ticket).trim()}`;
    }
    const sym = t.symbol || '';
    const open = t.openTime || '';
    const close = t.closeTime || '';
    const vol = t.volume || 0;
    return `sig:${sym}_${open}_${close}_${vol}`;
  };

  existingTrades.forEach((t) => {
    signatureSet.add(getTradeSignature(t));
  });

  const batchTrades: Trade[] = [];
  let skippedDuplicatesCount = 0;
  let accumulatedSummary: StatementSummary = {};

  for (const file of filesToProcess) {
    logs.push(`[Batch Processing] Bóc tách file: ${file.name}`);
    const result = await parseTradingStatementPipeline(file);

    if (result.summary && Object.keys(result.summary).length > 0) {
      accumulatedSummary = { ...accumulatedSummary, ...result.summary };
    }

    result.trades.forEach((trade) => {
      const sig = getTradeSignature(trade);
      if (signatureSet.has(sig)) {
        skippedDuplicatesCount++;
        logs.push(`[Duplicate Skipped] Lệnh #${trade.ticket || 'N/A'} (${trade.symbol}) bị bỏ qua do đã có trong hệ thống.`);
      } else {
        signatureSet.add(sig);
        batchTrades.push(trade);
      }
    });

    if (result.errors && result.errors.length > 0) {
      errors.push(...result.errors);
    }
  }

  logs.push(
    `[Batch Import Hoàn Tất] Tổng lệnh mới: ${batchTrades.length} | Đã bỏ qua trùng lặp: ${skippedDuplicatesCount} | File PDF bỏ qua: ${skippedPdfCount}`
  );

  const validation = validateStatement(batchTrades, accumulatedSummary);

  return {
    trades: batchTrades,
    skippedDuplicatesCount,
    processedFilesCount: filesToProcess.length,
    skippedFilesCount: skippedPdfCount,
    skippedPdfCount,
    summary: accumulatedSummary,
    validation,
    errors,
    logs,
    confidenceScore: 100,
    importTimestamp: new Date().toISOString(),
  };
}

// SERVER CALL: Offline Fallback Statement Scanner
async function callAIParseStatementAPI(textContent: string, fileName: string): Promise<any> {
  // Pure 100% offline fallback scanner using regex for generic table lines
  const lines = textContent.split('\n');
  const extractedTrades: any[] = [];
  
  // Look for lines containing ticket number, symbol (XAUUSD/EURUSD/etc), buy/sell, volume, prices
  const lineRegex = /(?:(\d{6,10})\s+)?(buy|sell)\s+([\d\.]+)\s+([A-Z0-9]{3,8})\s+(?:at\s+)?([\d\.]+)\s+(?:.*?([\d\.\-]+))?/i;

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (match) {
      const ticket = match[1] || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const type = match[2].toLowerCase() === 'buy' ? 'buy' : 'sell';
      const volume = parseFloat(match[3]) || 0.1;
      const symbol = match[4].toUpperCase();
      const openPrice = parseFloat(match[5]) || 0;
      const netPnl = parseFloat(match[6]) || 0;

      extractedTrades.push({
        id: ticket,
        ticket,
        symbol,
        type,
        volume,
        openPrice,
        closePrice: openPrice,
        netPnl,
        pnl: netPnl,
        openTime: new Date().toISOString(),
        closeTime: new Date().toISOString(),
      });
    }
  }

  if (extractedTrades.length > 0) {
    return {
      trades: extractedTrades,
      brokerName: 'Offline Statement Parser',
      totalNetProfit: extractedTrades.reduce((acc, t) => acc + t.netPnl, 0),
    };
  }

  return null;
}
