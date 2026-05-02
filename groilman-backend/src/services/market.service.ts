import WebSocket from 'ws';
import { io } from '../index';
import dotenv from 'dotenv';
import { AlertService } from './alert.service';
import { normalizeSymbol } from '../utils/symbols';

dotenv.config();

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const WS_URL = `wss://ws.finnhub.io?token=${FINNHUB_KEY}`;

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

class MarketService {
  private ws: WebSocket | null = null;
  private currentPrices: Record<string, number> = {};
  private lastAlertCheck = 0;
  private readonly ALERT_CHECK_INTERVAL_MS = 5000;
  private symbols: string[] = [
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

  private binanceWs: WebSocket | null = null;

  constructor() {
    this.connect();
    this.connectBinance();
  }

  private connectBinance() {
    const streams = [
      'clusdt@trade',     // WTI Crude Oil
      'bzusdt@trade',    // Brent Crude
      'natgasusdt@trade', // Natural Gas
      'gcusdt@trade',    // Gold
      'siusdt@trade',    // Silver
    ].join('/');

    console.log('Connecting to Binance WebSocket for commodities...');
    this.binanceWs = new WebSocket(`${BINANCE_WS_URL}/${streams}`);

    this.binanceWs.on('open', () => {
      console.log('Connected to Binance WebSocket ✅');
    });

    this.binanceWs.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data);
        const symbolMap: Record<string, string> = {
          'CLUSDT': 'CL', 'BZUSDT': 'BZ', 'NATGASUSDT': 'NG',
          'GCUSDT': 'GC', 'SIUSDT': 'SI'
        };
        const displaySymbol = symbolMap[msg.s];
        if (!displaySymbol) return;

        const price = parseFloat(msg.p);
        this.currentPrices[displaySymbol] = price;
        io.emit('price-update', {
          s: displaySymbol,
          p: price,
          t: msg.T,
          v: parseFloat(msg.q)
        });
      } catch {}
    });

    this.binanceWs.on('error', (err) => {
      console.error('Binance WebSocket Error:', err);
    });

    this.binanceWs.on('close', () => {
      console.log('Binance WebSocket closed. Reconnecting in 5s...');
      setTimeout(() => this.connectBinance(), 5000);
    });
  }

  private connect() {
    console.log('Connecting to Finnhub WebSocket...');
    this.ws = new WebSocket(WS_URL);

    this.ws.on('open', () => {
      console.log('Connected to Finnhub WebSocket ✅');
      this.subscribeAll();
    });

    this.ws.on('message', (data: string) => {
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

  private subscribeAll() {
    if (!this.ws) return;
    
    this.symbols.forEach(symbol => {
      this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
    });
  }

  private async handleTrade(trades: any[]) {
    for (const trade of trades) {
      const displaySymbol = normalizeSymbol(trade.s);
      const data = {
        s: displaySymbol,
        p: trade.p,
        t: trade.t,
        v: trade.v
      };

      this.currentPrices[displaySymbol] = trade.p;
      io.emit('price-update', data);
    }

    const now = Date.now();
    if (now - this.lastAlertCheck >= this.ALERT_CHECK_INTERVAL_MS) {
      this.lastAlertCheck = now;
      await AlertService.checkAlerts(this.currentPrices, (alert) => {
        console.log(`🔔 ALERT TRIGGERED: ${alert.symbol} at ${alert.price} (direction: ${alert.direction})`);
        io.emit('alert-triggered', alert);
      });
    }
  }

  public subscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      if (!this.symbols.includes(symbol)) {
        this.symbols.push(symbol);
      }
    }
  }
}

export const marketService = new MarketService();
