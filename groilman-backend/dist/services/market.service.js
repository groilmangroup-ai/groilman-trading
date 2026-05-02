"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketService = void 0;
const ws_1 = __importDefault(require("ws"));
const index_1 = require("../index");
const dotenv_1 = __importDefault(require("dotenv"));
const alert_service_1 = require("./alert.service");
const symbols_1 = require("../utils/symbols");
dotenv_1.default.config();
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const WS_URL = `wss://ws.finnhub.io?token=${FINNHUB_KEY}`;
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
class MarketService {
    ws = null;
    currentPrices = {};
    lastAlertCheck = 0;
    ALERT_CHECK_INTERVAL_MS = 5000;
    symbols = [
        // Crypto (Binance)
        'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:BNBUSDT', 'BINANCE:SOLUSDT', 'BINANCE:XRPUSDT',
        // Forex (OANDA)
        'OANDA:EUR_USD', 'OANDA:GBP_USD', 'OANDA:USD_JPY', 'OANDA:USD_CHF', 'OANDA:AUD_USD',
        'OANDA:USDCAD', 'OANDA:NZDUSD', 'OANDA:EURGBP', 'OANDA:EURJPY', 'OANDA:GBPJPY',
        // Metales
        'OANDA:XAU_USD', 'OANDA:XAG_USD',
        // Petroleo - NO disponible en Finnhub (error 403)
        // WTI/Brent se obtienen via RealMarketAPI, OilPriceAPI o Binance
    ];
    binanceWs = null;
    constructor() {
        this.connect();
        this.connectBinance();
    }
    connectBinance() {
        const streams = [
            'clusdt@trade', // WTI Crude Oil
            'bzusdt@trade', // Brent Crude
            'natgasusdt@trade', // Natural Gas
            'gcusdt@trade', // Gold
            'siusdt@trade', // Silver
        ].join('/');
        console.log('Connecting to Binance WebSocket for commodities...');
        this.binanceWs = new ws_1.default(`${BINANCE_WS_URL}/${streams}`);
        this.binanceWs.on('open', () => {
            console.log('Connected to Binance WebSocket ✅');
        });
        this.binanceWs.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                const symbolMap = {
                    'CLUSDT': 'CL', 'BZUSDT': 'BZ', 'NATGASUSDT': 'NG',
                    'GCUSDT': 'GC', 'SIUSDT': 'SI'
                };
                const displaySymbol = symbolMap[msg.s];
                if (!displaySymbol)
                    return;
                const price = parseFloat(msg.p);
                this.currentPrices[displaySymbol] = price;
                index_1.io.emit('price-update', {
                    s: displaySymbol,
                    p: price,
                    t: msg.T,
                    v: parseFloat(msg.q)
                });
            }
            catch { }
        });
        this.binanceWs.on('error', (err) => {
            console.error('Binance WebSocket Error:', err);
        });
        this.binanceWs.on('close', () => {
            console.log('Binance WebSocket closed. Reconnecting in 5s...');
            setTimeout(() => this.connectBinance(), 5000);
        });
    }
    connect() {
        console.log('Connecting to Finnhub WebSocket...');
        this.ws = new ws_1.default(WS_URL);
        this.ws.on('open', () => {
            console.log('Connected to Finnhub WebSocket ✅');
            this.subscribeAll();
        });
        this.ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'trade') {
                this.handleTrade(message.data);
            }
        });
        this.ws.on('error', (err) => {
            console.error('WebSocket Error:', err);
        });
        this.ws.on('close', () => {
            console.log('WebSocket connection closed. Reconnecting in 5s...');
            setTimeout(() => this.connect(), 5000);
        });
    }
    subscribeAll() {
        if (!this.ws)
            return;
        this.symbols.forEach(symbol => {
            this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
        });
    }
    async handleTrade(trades) {
        for (const trade of trades) {
            const displaySymbol = (0, symbols_1.normalizeSymbol)(trade.s);
            const data = {
                s: displaySymbol,
                p: trade.p,
                t: trade.t,
                v: trade.v
            };
            this.currentPrices[displaySymbol] = trade.p;
            index_1.io.emit('price-update', data);
        }
        const now = Date.now();
        if (now - this.lastAlertCheck >= this.ALERT_CHECK_INTERVAL_MS) {
            this.lastAlertCheck = now;
            await alert_service_1.AlertService.checkAlerts(this.currentPrices, (alert) => {
                console.log(`🔔 ALERT TRIGGERED: ${alert.symbol} at ${alert.price} (direction: ${alert.direction})`);
                index_1.io.emit('alert-triggered', alert);
            });
        }
    }
    subscribe(symbol) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
            if (!this.symbols.includes(symbol)) {
                this.symbols.push(symbol);
            }
        }
    }
}
exports.marketService = new MarketService();
//# sourceMappingURL=market.service.js.map