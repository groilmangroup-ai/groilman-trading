"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const indicator_service_1 = require("../services/indicator.service");
const alert_service_1 = require("../services/alert.service");
const market_service_1 = require("../services/market.service");
const history_service_1 = require("../services/history.service");
const index_1 = require("../index");
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const router = (0, express_1.Router)();
const ALLOWED_SYMBOLS = [
    // Forex - 10 principales
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY',
    // Crypto - 10 principales
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT',
    // Commodities - Petroleo y Metales
    'XAUUSD', 'XAGUSD', 'WTI', 'BRENT', 'CL', 'BZ',
    // Futuros - 10 principales indices y commodities
    'ES', 'NQ', 'YM', 'GC', 'SI', 'NG', 'ZB', 'QM', 'ZN', 'HG'
];
const ALLOWED_RESOLUTIONS = ['1', '5', '15', '30', '60', 'D', 'W'];
function validateSymbol(symbol) {
    return ALLOWED_SYMBOLS.includes(symbol.toUpperCase());
}
function validateResolution(resolution) {
    return ALLOWED_RESOLUTIONS.includes(resolution);
}
router.get('/history', async (req, res) => {
    try {
        const { symbol, resolution, days } = req.query;
        if (!symbol || !resolution) {
            return res.status(400).json({ error: 'symbol and resolution are required' });
        }
        if (!validateSymbol(symbol)) {
            return res.status(400).json({ error: 'Invalid symbol' });
        }
        if (!validateResolution(resolution)) {
            return res.status(400).json({ error: 'Invalid resolution' });
        }
        const daysParam = days ? Math.min(parseInt(days, 10), 365) : 180;
        const data = await history_service_1.HistoryService.getHistory(symbol, resolution, daysParam);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
// ... existing routes ...
router.get('/rsi/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval } = req.query;
        if (!validateSymbol(symbol)) {
            return res.status(400).json({ error: 'Invalid symbol' });
        }
        const data = await indicator_service_1.IndicatorService.getRSI(symbol, interval);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch RSI' });
    }
});
router.get('/macd/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        if (!validateSymbol(symbol)) {
            return res.status(400).json({ error: 'Invalid symbol' });
        }
        const data = await indicator_service_1.IndicatorService.getMACD(symbol);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch MACD' });
    }
});
router.post('/alerts', async (req, res) => {
    try {
        const alert = await alert_service_1.AlertService.createAlert(req.body);
        res.json(alert);
    }
    catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const isArchived = req.query.archived === 'true';
        const alerts = await alert_service_1.AlertService.getAlerts(!isArchived); // if archived is true, we want active=false
        res.json(alerts);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});
router.put('/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await alert_service_1.AlertService.updateAlert(id, req.body);
        res.json({ success: true, id });
    }
    catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});
router.delete('/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await alert_service_1.AlertService.deleteAlert(id);
        res.json({ success: true, id });
    }
    catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});
router.post('/subscribe', (req, res) => {
    try {
        const { symbol } = req.body;
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }
        if (!validateSymbol(symbol)) {
            return res.status(400).json({ error: 'Invalid symbol' });
        }
        market_service_1.marketService.subscribe(symbol);
        res.json({ success: true, symbol });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});
router.post('/test-bot', (req, res) => {
    try {
        // Emit a fake alert trigger to test the bot connection
        const testAlert = {
            id: 'test-alert-' + Date.now(),
            symbol: 'TEST-SYMBOL',
            price: 1337.00,
            direction: 'above',
            active: true,
            userId: 'test-user',
            createdAt: new Date().toISOString()
        };
        index_1.io.emit('alert-triggered', testAlert);
        res.json({ success: true, message: 'Test signal sent to bot' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send test signal' });
    }
});
router.get('/news', async (req, res) => {
    try {
        const { symbol } = req.query;
        const url = symbol
            ? `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${daysAgo(7)}&to=${today()}&token=${FINNHUB_KEY}`
            : `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
        const response = await axios_1.default.get(url);
        res.json(response.data.slice(0, 10));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});
function today() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}
exports.default = router;
//# sourceMappingURL=market.js.map