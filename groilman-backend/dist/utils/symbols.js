"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISPLAY_TO_FINNHUB = exports.FINNHUB_TO_DISPLAY = void 0;
exports.normalizeSymbol = normalizeSymbol;
// Bidirectional mapping: Finnhub subscription format ↔ display format
exports.FINNHUB_TO_DISPLAY = {
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
exports.DISPLAY_TO_FINNHUB = Object.fromEntries(Object.entries(exports.FINNHUB_TO_DISPLAY).map(([k, v]) => [v, k]));
// Returns display symbol (e.g. EURUSD) from any Finnhub format (e.g. OANDA:EUR_USD).
// Falls back to the original string if unknown.
function normalizeSymbol(finnhubSymbol) {
    return exports.FINNHUB_TO_DISPLAY[finnhubSymbol] ?? finnhubSymbol;
}
//# sourceMappingURL=symbols.js.map