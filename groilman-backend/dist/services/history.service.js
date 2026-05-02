"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const OIL_PRICE_API_KEY = process.env.OIL_PRICE_API_KEY;
const REAL_MARKET_API_KEY = process.env.REAL_MARKET_API_KEY;
class HistoryService {
    /**
     * Obtiene datos históricos para un símbolo dado.
     * Fuentes: Binance (crypto) > Alpha Vantage (forex) > Finnhub (futuros)
     */
    static async getHistory(symbol, resolution, days = 180) {
        // Normalizar nombres alternativos
        let sym = symbol.toUpperCase();
        const symbolAliases = {
            'WTI': 'CL', 'BRENT': 'BZ', 'CRUDE': 'CL', 'OIL': 'CL',
            'GOLD': 'XAUUSD', 'SILVER': 'XAGUSD'
        };
        if (symbolAliases[sym]) {
            const alias = symbolAliases[sym];
            if (alias) {
                sym = alias;
                console.log(`Normalizado: ${symbol} -> ${sym}`);
            }
        }
        // === CRYPTO (10 principales) - Binance ===
        const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'];
        if (cryptoSymbols.includes(sym)) {
            const data = await this.getBinanceHistory(sym, resolution, days);
            if (data.length > 0)
                return data;
            // Fallback a Alpha Vantage para crypto
            const avCrypto = sym.replace('USDT', '');
            return this.getAlphaVantageCrypto(avCrypto, days);
        }
        // === FOREX (10 principales) - Alpha Vantage (mejor soporte) ===
        const forexSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
        if (forexSymbols.includes(sym)) {
            // Alpha Vantage es mejor para forex
            let data = await this.getAlphaVantageForex(sym, days);
            if (data.length > 0)
                return data;
            // Fallback a Finnhub
            const forexPairs = {
                'EURUSD': 'EUR/USD', 'GBPUSD': 'GBP/USD', 'USDJPY': 'USD/JPY',
                'USDCHF': 'USD/CHF', 'AUDUSD': 'AUD/USD', 'USDCAD': 'USD/CAD',
                'NZDUSD': 'NZD/USD', 'EURGBP': 'EUR/GBP', 'EURJPY': 'EUR/JPY', 'GBPJPY': 'GBP/JPY'
            };
            const forexPair = forexPairs[sym];
            if (forexPair) {
                data = await this.getFinnhubHistory(forexPair, resolution);
                if (data.length > 0)
                    return data;
            }
            // Último fallback a Binance
            return this.getBinanceHistory(sym.replace('USD', 'USDT'), resolution, days);
        }
        // === METALES (Gold, Silver) - RealMarketAPI > Finnhub > Alpha Vantage > Binance ===
        if (sym === 'XAUUSD' || sym === 'XAGUSD') {
            const realMarketSymbol = sym === 'XAUUSD' ? 'XAUUSD' : 'XAGUSD';
            // 1. Intentar RealMarketAPI
            if (REAL_MARKET_API_KEY) {
                const data = await this.getRealMarketHistory(realMarketSymbol, resolution, days);
                if (data.length > 0) {
                    console.log(`RealMarketAPI: Obtenidos ${data.length} datos para ${realMarketSymbol}`);
                    return data;
                }
            }
            // 2. Fallback a Finnhub
            const metalPairs = { 'XAUUSD': 'XAU/USD', 'XAGUSD': 'XAG/USD' };
            const metalPair = metalPairs[sym];
            let data = metalPair ? await this.getFinnhubHistory(metalPair, resolution) : [];
            if (data.length > 0)
                return data;
            // 3. Fallback a Alpha Vantage
            const avMetal = sym === 'XAUUSD' ? 'XAU/USD' : 'XAG/USD';
            data = await this.getAlphaVantageForex(avMetal, days);
            if (data.length > 0)
                return data;
            // 4. Fallback a Binance
            return this.getBinanceHistory(sym === 'XAUUSD' ? 'XAUUSDT' : 'XAGUSDT', resolution, days);
        }
        // === PETRÓLEO (CL WTI, BZ Brent) - RealMarketAPI > OilPriceAPI > Finnhub > Binance ===
        if (sym === 'CL' || sym === 'BZ') {
            const realMarketSymbol = sym === 'CL' ? 'USOIL' : 'UKOIL'; // WTI y Brent en RealMarketAPI
            // 1. Intentar RealMarketAPI (incluye oro, petroleo, forex)
            if (REAL_MARKET_API_KEY) {
                const data = await this.getRealMarketHistory(realMarketSymbol, resolution, days);
                if (data.length > 0) {
                    console.log(`RealMarketAPI: Obtenidos ${data.length} datos para ${realMarketSymbol}`);
                    return data;
                }
            }
            // 2. Fallback a OilPriceAPI
            const oilType = sym === 'CL' ? 'WTI' : 'BRENT';
            if (OIL_PRICE_API_KEY) {
                const data = await this.getOilPriceHistory(oilType, days);
                if (data.length > 0) {
                    console.log(`OilPriceAPI: Obtenidos ${data.length} datos para ${oilType}`);
                    return data;
                }
            }
            // 3. Finnhub doesn't support oil (403), skip to Binance
            // 4. Fallback a Binance Futures USD-M (perpetual)
            const binanceSymbols = sym === 'CL' ? ['CLUSDT'] : ['BZUSDT'];
            for (const binSym of binanceSymbols) {
                const data = await this.getBinanceHistory(binSym, resolution, days);
                if (data.length > 0)
                    return data;
            }
            return [];
        }
        // === FUTUROS (10 principales) - Intentar Finnhub, fallback a Binance ===
        const futuresSymbols = ['ES', 'NQ', 'YM', 'GC', 'SI', 'NG', 'ZB', 'QM', 'ZN', 'HG'];
        if (futuresSymbols.includes(sym)) {
            // Intentar Finnhub primero
            let data = await this.getFinnhubHistory(sym, resolution);
            if (data.length > 0)
                return data;
            // Fallback a Binance (USDT pairs)
            const binanceFutures = {
                'ES': 'SPUSDT', 'NQ': 'NDXUSDT', 'YM': 'YMUSDT', 'GC': 'GCUSDT',
                'SI': 'SIUSDT', 'NG': 'NATGASUSDT', 'ZB': 'ZBUSDT', 'QM': 'QMUSDT',
                'ZN': 'ZNUSDT', 'HG': 'HGUSDT'
            };
            const binanceFuture = binanceFutures[sym];
            if (binanceFuture) {
                data = await this.getBinanceHistory(binanceFuture, resolution, days);
                if (data.length > 0)
                    return data;
            }
            return [];
        }
        // Default: Finnhub
        return this.getFinnhubHistory(sym, resolution);
    }
    // ==================== BINANCE ====================
    static async getBinanceHistory(symbol, resolution, days) {
        try {
            const intervalMap = {
                '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h', 'D': '1d', 'W': '1w'
            };
            const interval = intervalMap[resolution] || '5m';
            const endTime = Math.floor(Date.now() / 1000);
            const startTime = endTime - (days * 24 * 60 * 60);
            const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime * 1000}&limit=1000`;
            const response = await axios_1.default.get(url);
            return response.data.map((kline) => ({
                time: Math.floor(kline[0] / 1000),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5])
            }));
        }
        catch (error) {
            console.error(`Binance error for ${symbol}:`, error?.message || error);
            return [];
        }
    }
    // ==================== FINNHUB ====================
    static async getFinnhubHistory(symbol, resolution) {
        try {
            const to = Math.floor(Date.now() / 1000);
            let from = to - (30 * 24 * 60 * 60); // 30 días por defecto
            if (resolution === '60')
                from = to - (7 * 24 * 60 * 60);
            if (resolution === 'D' || resolution === 'W')
                from = to - (365 * 24 * 60 * 60);
            // Determinar endpoint según el símbolo
            let endpoint = 'stock/candle';
            if (['XAUUSD', 'XAGUSD'].includes(symbol))
                endpoint = 'forex/candle';
            if (['ES', 'NQ', 'YM', 'GC', 'CL', 'SI', 'NG'].includes(symbol))
                endpoint = 'commodity/candle';
            if (symbol.includes('/'))
                endpoint = 'forex/candle';
            const url = `https://finnhub.io/api/v1/${endpoint}?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
            const response = await axios_1.default.get(url);
            if (response.data.s === 'ok' && response.data.t) {
                const data = response.data;
                const ohlcv = [];
                for (let i = 0; i < data.t.length; i++) {
                    ohlcv.push({
                        time: data.t[i],
                        open: parseFloat(data.o[i]),
                        high: parseFloat(data.h[i]),
                        low: parseFloat(data.l[i]),
                        close: parseFloat(data.c[i]),
                        volume: data.v ? parseFloat(data.v[i]) : 0
                    });
                }
                return ohlcv;
            }
            return [];
        }
        catch (error) {
            console.error(`Finnhub error for ${symbol}:`, error?.message || error);
            return [];
        }
    }
    // ==================== ALPHA VANTAGE ====================
    static async getAlphaVantageForex(symbol, days) {
        try {
            // Alpha Vantage usa formato EUR/USD
            const avSymbol = symbol.replace('USD', '/USD');
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${ALPHA_VANTAGE_KEY}&outputsize=full`;
            const response = await axios_1.default.get(url);
            const timeSeries = response.data['Time Series (Daily)'];
            if (!timeSeries) {
                console.log(`Alpha Vantage no tiene datos para ${symbol}`);
                return [];
            }
            const entries = Object.entries(timeSeries).slice(0, days);
            const ohlcv = [];
            for (const [date, values] of entries) {
                const timestamp = Math.floor(new Date(date).getTime() / 1000);
                ohlcv.push({
                    time: timestamp,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                    volume: parseFloat(values['5. volume'])
                });
            }
            return ohlcv.reverse(); // Más antiguo primero
        }
        catch (error) {
            console.error(`Alpha Vantage Forex error for ${symbol}:`, error?.message || error);
            return [];
        }
    }
    static async getAlphaVantageCrypto(symbol, days) {
        try {
            const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${ALPHA_VANTAGE_KEY}&outputsize=full`;
            const response = await axios_1.default.get(url);
            const timeSeries = response.data['Time Series (Digital Currency Daily)'];
            if (!timeSeries)
                return [];
            const entries = Object.entries(timeSeries).slice(0, days);
            const ohlcv = [];
            for (const [date, values] of entries) {
                const timestamp = Math.floor(new Date(date).getTime() / 1000);
                ohlcv.push({
                    time: timestamp,
                    open: parseFloat(values['1a. open (USD)']),
                    high: parseFloat(values['2a. high (USD)']),
                    low: parseFloat(values['3a. low (USD)']),
                    close: parseFloat(values['4a. close (USD)']),
                    volume: parseFloat(values['5. volume'])
                });
            }
            return ohlcv.reverse();
        }
        catch (error) {
            console.error(`Alpha Vantage Crypto error for ${symbol}:`, error?.message || error);
            return [];
        }
    }
    // ==================== OIL PRICE API ====================
    static async getOilPriceHistory(oilType, days) {
        if (!OIL_PRICE_API_KEY) {
            console.log('OilPriceAPI: No API key configured');
            return [];
        }
        try {
            // Determinar código del commodity
            const commodityCode = oilType === 'WTI' ? 'WTI_USD' : 'BRENT_CRUDE_USD';
            // Elegir endpoint según cantidad de días
            let endpoint = '/v1/prices/past_month';
            if (days > 60)
                endpoint = '/v1/prices/past_year';
            else if (days > 14)
                endpoint = '/v1/prices/past_month';
            else if (days > 7)
                endpoint = '/v1/prices/past_week';
            else
                endpoint = '/v1/prices/past_day';
            const url = `https://api.oilpriceapi.com${endpoint}?by_code=${commodityCode}&interval=1d`;
            const response = await axios_1.default.get(url, {
                headers: { 'Authorization': `Token ${OIL_PRICE_API_KEY}` }
            });
            if (response.data?.data?.prices) {
                const prices = response.data.data.prices;
                const ohlcv = [];
                for (const p of prices) {
                    const timestamp = new Date(p.date).getTime() / 1000;
                    ohlcv.push({
                        time: timestamp,
                        open: parseFloat(p.price),
                        high: parseFloat(p.price),
                        low: parseFloat(p.price),
                        close: parseFloat(p.price),
                        volume: 0
                    });
                }
                return ohlcv.reverse();
            }
            return [];
        }
        catch (error) {
            console.error(`OilPriceAPI error for ${oilType}:`, error?.message || error);
            return [];
        }
    }
    // ==================== REAL MARKET API ====================
    static async getRealMarketHistory(symbol, timeframe = 'H1', days = 180) {
        if (!REAL_MARKET_API_KEY) {
            return [];
        }
        try {
            // Calcular fechas
            const endTime = new Date().toISOString();
            const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            const timeframeMap = {
                '1': 'M1', '5': 'M5', '15': 'M15', '30': 'M30', '60': 'H1', 'D': 'D1', 'W': 'W1'
            };
            const tf = timeframeMap[timeframe] || 'H1';
            const url = `https://api.realmarketapi.com/api/v1/history?apiKey=${REAL_MARKET_API_KEY}&symbolCode=${symbol}&timeFrame=${tf}&startTime=${startTime}&endTime=${endTime}&pageSize=1000`;
            const response = await axios_1.default.get(url);
            if (response.data?.Data && response.data.Data.length > 0) {
                const ohlcv = [];
                for (const candle of response.data.Data) {
                    const timestamp = new Date(candle.OpenTime).getTime() / 1000;
                    ohlcv.push({
                        time: timestamp,
                        open: parseFloat(candle.OpenPrice),
                        high: parseFloat(candle.HighPrice),
                        low: parseFloat(candle.LowPrice),
                        close: parseFloat(candle.ClosePrice),
                        volume: parseFloat(candle.Volume) || 0
                    });
                }
                return ohlcv;
            }
            return [];
        }
        catch (error) {
            // Silently fallback to next provider
            return [];
        }
    }
}
exports.HistoryService = HistoryService;
//# sourceMappingURL=history.service.js.map