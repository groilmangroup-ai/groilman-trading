import { Router } from 'express';
import axios from 'axios';
import { IndicatorService } from '../services/indicator.service';
import { AlertService } from '../services/alert.service';
import { marketService } from '../services/market.service';
import { HistoryService } from '../services/history.service';
import { io } from '../index';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

const router = Router();

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

function validateSymbol(symbol: string): boolean {
  return ALLOWED_SYMBOLS.includes(symbol.toUpperCase());
}

function validateResolution(resolution: string): boolean {
  return ALLOWED_RESOLUTIONS.includes(resolution);
}

router.get('/history', async (req, res) => {
  try {
    const { symbol, resolution, days } = req.query;
    if (!symbol || !resolution) {
      return res.status(400).json({ error: 'symbol and resolution are required' });
    }
    if (!validateSymbol(symbol as string)) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    if (!validateResolution(resolution as string)) {
      return res.status(400).json({ error: 'Invalid resolution' });
    }
    const daysParam = days ? Math.min(parseInt(days as string, 10), 365) : 180;
    const data = await HistoryService.getHistory(symbol as string, resolution as string, daysParam);
    res.json(data);
  } catch (error) {
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
    const data = await IndicatorService.getRSI(symbol, interval as string);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RSI' });
  }
});

router.get('/macd/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!validateSymbol(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    const data = await IndicatorService.getMACD(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch MACD' });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const alert = await AlertService.createAlert(req.body);
    res.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const isArchived = req.query.archived === 'true';
    const alerts = await AlertService.getAlerts(!isArchived); // if archived is true, we want active=false
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.put('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await AlertService.updateAlert(id, req.body);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

router.delete('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await AlertService.deleteAlert(id);
    res.json({ success: true, id });
  } catch (error) {
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
    marketService.subscribe(symbol);
    res.json({ success: true, symbol });
  } catch (error) {
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
    
    io.emit('alert-triggered', testAlert);
    res.json({ success: true, message: 'Test signal sent to bot' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test signal' });
  }
});

router.get('/news', async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = symbol
      ? `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${daysAgo(7)}&to=${today()}&token=${FINNHUB_KEY}`
      : `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
    const response = await axios.get(url);
    res.json((response.data as any[]).slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

function today() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default router;
