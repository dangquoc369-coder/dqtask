/**
 * @license
 * Commercial-Grade Universal Symbol Normalization & Learning Engine
 * Handles Broker-Independent Symbol Canonicalization (Exness, ICMarkets, Pepperstone, XM, Tickmill, FP Markets, etc.)
 */

export interface SymbolNormalizationResult {
  originalSymbol: string;
  canonicalSymbol: string;
  confidence: number; // 0 - 100%
  isUnknown: boolean;
  method: 'exact' | 'custom_learned' | 'alias' | 'embedded_strip' | 'suffix_strip' | 'unknown';
}

const CUSTOM_MAPPING_STORAGE_KEY = 'tradeflow_custom_symbol_mappings';

// Universal Alias to Canonical Symbol Map
export const ALIAS_TO_CANONICAL: Record<string, string> = {
  // Metals
  GOLD: 'XAUUSD',
  XAUUSD: 'XAUUSD',
  XAU: 'XAUUSD',
  XAUUSDc: 'XAUUSD',
  XAUUSDm: 'XAUUSD',
  'XAUUSD.PRO': 'XAUUSD',
  'XAUUSD.RAW': 'XAUUSD',
  SILVER: 'XAGUSD',
  XAGUSD: 'XAGUSD',
  XAG: 'XAGUSD',
  XAGUSDc: 'XAGUSD',
  XAGUSDm: 'XAGUSD',

  // Indices
  USTEC: 'NAS100',
  NAS100: 'NAS100',
  US100: 'NAS100',
  NAS: 'NAS100',
  NASDAQ: 'NAS100',
  NDX: 'NAS100',
  'NAS100.CASH': 'NAS100',
  'NAS100.PRO': 'NAS100',

  US30: 'US30',
  DJ30: 'US30',
  WS30: 'US30',
  DOW: 'US30',
  WALLSTREET: 'US30',
  'US30.CASH': 'US30',
  'US30.PRO': 'US30',

  GER40: 'GER40',
  DE40: 'GER40',
  DAX40: 'GER40',
  GER30: 'GER40',
  DAX: 'GER40',
  DAX30: 'GER40',
  DE30: 'GER40',
  'GER40.CASH': 'GER40',

  SP500: 'US500',
  US500: 'US500',
  SPX500: 'US500',
  SPX: 'US500',
  'S&P500': 'US500',
  'US500.CASH': 'US500',

  UK100: 'UK100',
  FTSE: 'UK100',
  FTSE100: 'UK100',

  JP225: 'JP225',
  NIKKEI: 'JP225',
  NI225: 'JP225',
  JPN225: 'JP225',

  // Crypto
  BTCUSD: 'BTCUSD',
  BTCUSDT: 'BTCUSD',
  XBTUSD: 'BTCUSD',
  BTC: 'BTCUSD',
  BTCUSDm: 'BTCUSD',
  'BTCUSD.PRO': 'BTCUSD',

  ETHUSD: 'ETHUSD',
  ETHUSDT: 'ETHUSD',
  ETH: 'ETHUSD',
  ETHUSDm: 'ETHUSD',

  SOLUSD: 'SOLUSD',
  SOLUSDT: 'SOLUSD',
  SOL: 'SOLUSD',

  XRPUSD: 'XRPUSD',
  XRPUSDT: 'XRPUSD',
  XRP: 'XRPUSD',

  // Commodities
  USOIL: 'USOIL',
  UKOIL: 'UKOIL',
  WTI: 'USOIL',
  BRENT: 'UKOIL',
  XTIUSD: 'USOIL',
  XBRUSD: 'UKOIL',
  OIL: 'USOIL',
  CRUDE: 'USOIL',

  // Major Forex Pairs
  EURUSD: 'EURUSD',
  GBPUSD: 'GBPUSD',
  USDJPY: 'USDJPY',
  AUDUSD: 'AUDUSD',
  USDCAD: 'USDCAD',
  USDCHF: 'USDCHF',
  NZDUSD: 'NZDUSD',

  // Forex Crosses
  EURGBP: 'EURGBP',
  EURJPY: 'EURJPY',
  GBPJPY: 'GBPJPY',
  AUDJPY: 'AUDJPY',
  EURAUD: 'EURAUD',
  GBPAUD: 'GBPAUD',
  EURCHF: 'EURCHF',
  GBPCHF: 'GBPCHF',
  CADJPY: 'CADJPY',
  CHFJPY: 'CHFJPY',
  EURNZD: 'EURNZD',
  GBPNZD: 'GBPNZD',
  AUDCAD: 'AUDCAD',
  AUDNZD: 'AUDNZD',
  AUDCHF: 'AUDCHF',
  CADCHF: 'CADCHF',
  NZDJPY: 'NZDJPY',
  NZDCAD: 'NZDCAD',
  NZDCHF: 'NZDCHF',
  USDSGD: 'USDSGD',
  USDHKD: 'USDHKD',
  USDCNH: 'USDCNH',
  USDMXN: 'USDMXN',
  USDZAR: 'USDZAR',
  USDTRY: 'USDTRY',
  USDNOK: 'USDNOK',
  USDSEK: 'USDSEK',
};

// Standard Canonical Root Instruments sorted by length descending
const CORE_ROOT_TICKERS = [
  'XAUUSD',
  'XAGUSD',
  'NAS100',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'USDCHF',
  'NZDUSD',
  'EURGBP',
  'EURJPY',
  'GBPJPY',
  'AUDJPY',
  'EURAUD',
  'GBPAUD',
  'BTCUSD',
  'ETHUSD',
  'SOLUSD',
  'XRPUSD',
  'USOIL',
  'UKOIL',
  'US500',
  'GER40',
  'UK100',
  'JP225',
  'US30',
  'USTEC',
  'US100',
  'DJ30',
  'WS30',
  'DE40',
  'DAX40',
  'GER30',
  'SP500',
  'SPX500',
  'GOLD',
  'SILVER',
  'WTI',
  'BRENT',
];

// Helper to read learned custom mappings from local storage
export function getCustomSymbolMappings(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_MAPPING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Helper to save a custom symbol mapping to learning engine
export function saveCustomSymbolMapping(originalSymbol: string, canonicalSymbol: string): void {
  if (typeof window === 'undefined' || !originalSymbol || !canonicalSymbol) return;
  try {
    const mappings = getCustomSymbolMappings();
    const cleanOrig = originalSymbol.trim().toUpperCase();
    const cleanCanon = canonicalSymbol.trim().toUpperCase();
    mappings[cleanOrig] = cleanCanon;
    localStorage.setItem(CUSTOM_MAPPING_STORAGE_KEY, JSON.stringify(mappings));
  } catch (err) {
    console.error('Failed to save custom symbol mapping:', err);
  }
}

// Helper to remove a learned symbol mapping
export function removeCustomSymbolMapping(originalSymbol: string): void {
  if (typeof window === 'undefined' || !originalSymbol) return;
  try {
    const mappings = getCustomSymbolMappings();
    const cleanOrig = originalSymbol.trim().toUpperCase();
    delete mappings[cleanOrig];
    localStorage.setItem(CUSTOM_MAPPING_STORAGE_KEY, JSON.stringify(mappings));
  } catch (err) {
    console.error('Failed to remove custom symbol mapping:', err);
  }
}

/**
 * Universal Symbol Normalization Pipeline
 * Read Symbol -> Trim -> Uppercase -> Custom Mapping Check -> Prefix/Suffix Removal -> Alias Mapping -> Canonical Symbol
 */
export function normalizeSymbol(rawSymbol: string): SymbolNormalizationResult {
  const original = (rawSymbol || '').trim();
  if (!original) {
    return {
      originalSymbol: rawSymbol,
      canonicalSymbol: 'UNKNOWN',
      confidence: 0,
      isUnknown: true,
      method: 'unknown',
    };
  }

  const clean = original.toUpperCase();

  // 1. Check Learning Engine (Custom User Learned Mappings)
  const customMappings = getCustomSymbolMappings();
  if (customMappings[clean]) {
    return {
      originalSymbol: original,
      canonicalSymbol: customMappings[clean],
      confidence: 100,
      isUnknown: false,
      method: 'custom_learned',
    };
  }

  // 2. Direct Match in Alias Table
  if (ALIAS_TO_CANONICAL[clean]) {
    return {
      originalSymbol: original,
      canonicalSymbol: ALIAS_TO_CANONICAL[clean],
      confidence: 100,
      isUnknown: false,
      method: 'exact',
    };
  }

  // 3. Substring & Embedded Root Search Engine
  for (const root of CORE_ROOT_TICKERS) {
    if (clean.includes(root)) {
      const canonical = ALIAS_TO_CANONICAL[root] || root;
      return {
        originalSymbol: original,
        canonicalSymbol: canonical,
        confidence: 98,
        isUnknown: false,
        method: 'embedded_strip',
      };
    }
  }

  // 4. Advanced Prefix & Suffix Stripping
  // Strip known prefixes: PRO., REAL., LIVE_, LIVE., DEMO_, DEMO., ECN_, ECN., I_, STP., M., M_, REAL_, LIVE_, m (e.g. mXAUUSD)
  // Strip known suffixes: .RAW, .PRO, .CASH, .A, .C, .M, .ECN, -ECN, _ECN, _I, -I, C, M, PRO, RAW, CASH, .MICRO, .MINI, .STD, .VIP, .ZERO, _REAL, _LIVE, -RAW
  let stripped = clean
    .replace(/^(PRO\.|REAL\.|LIVE_|LIVE\.|DEMO_|DEMO\.|ECN_|ECN\.|I_|STP\.|M\.|M_|REAL_|LIVE_|M)/i, '')
    .replace(/(\.RAW|\.PRO|\.CASH|\.A|\.C|\.M|\.ECN|-ECN|_ECN|_I|-I|C|M|PRO|RAW|CASH|\.MICRO|\.MINI|\.STD|\.VIP|\.ZERO|_REAL|_LIVE|-RAW|\.I|_A|\.B)$/i, '')
    .replace(/[\._\-]/g, '');

  if (ALIAS_TO_CANONICAL[stripped]) {
    return {
      originalSymbol: original,
      canonicalSymbol: ALIAS_TO_CANONICAL[stripped],
      confidence: 95,
      isUnknown: false,
      method: 'suffix_strip',
    };
  }

  // 5. Unknown Instrument Fallback
  return {
    originalSymbol: original,
    canonicalSymbol: clean,
    confidence: 60,
    isUnknown: true,
    method: 'unknown',
  };
}
