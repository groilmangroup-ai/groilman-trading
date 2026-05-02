// Bidirectional mapping: Finnhub subscription format ↔ display format
export const FINNHUB_TO_DISPLAY: Record<string, string> = {
  // Crypto (Binance feed)
  'BINANCE:BTCUSDT': 'BTCUSDT',
  'BINANCE:ETHUSDT': 'ETHUSDT',
  'BINANCE:BNBUSDT': 'BNBUSDT',
  'BINANCE:SOLUSDT': 'SOLUSDT',
  'BINANCE:XRPUSDT': 'XRPUSDT',
  'BINANCE:ADAUSDT': 'ADAUSDT',
  'BINANCE:DOGEUSDT': 'DOGEUSDT',
  'BINANCE:DOTUSDT': 'DOTUSDT',
  'BINANCE:MATICUSDT': 'MATICUSDT',
  'BINANCE:LINKUSDT': 'LINKUSDT',
  // Forex (OANDA feed — some use underscores, some don't)
  'OANDA:EUR_USD': 'EURUSD',
  'OANDA:GBP_USD': 'GBPUSD',
  'OANDA:USD_JPY': 'USDJPY',
  'OANDA:USD_CHF': 'USDCHF',
  'OANDA:AUD_USD': 'AUDUSD',
  'OANDA:USDCAD': 'USDCAD',
  'OANDA:NZDUSD': 'NZDUSD',
  'OANDA:EURGBP': 'EURGBP',
  'OANDA:EURJPY': 'EURJPY',
  'OANDA:GBPJPY': 'GBPJPY',
  // Metals
  'OANDA:XAU_USD': 'XAUUSD',
  'OANDA:XAG_USD': 'XAGUSD',
};

export const DISPLAY_TO_FINNHUB: Record<string, string> =
  Object.fromEntries(Object.entries(FINNHUB_TO_DISPLAY).map(([k, v]) => [v, k]));

// Returns display symbol (e.g. EURUSD) from any Finnhub format (e.g. OANDA:EUR_USD).
// Falls back to the original string if unknown.
export function normalizeSymbol(finnhubSymbol: string): string {
  return FINNHUB_TO_DISPLAY[finnhubSymbol] ?? finnhubSymbol;
}
