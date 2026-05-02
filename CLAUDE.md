# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Groilman is a trading intelligence platform for Forex, Futures, and Commodities — three loosely coupled sub-projects communicating via HTTP and Socket.io.

```
D:/Groilman/
├── groilman-backend/   ← Express + Socket.io API (port 3001)
├── groilman-web/       ← Next.js 14 dashboard
├── groilman-bot/       ← Grammy.js Telegram bot
└── docs/               ← Trading strategies and watchlists
```

## Dev Commands

```bash
# Each sub-project runs independently
cd groilman-backend && npm run dev   # port 3001
cd groilman-web    && npm run dev    # port 3000
cd groilman-bot    && npm run dev
```

All dependencies must be installed locally inside each sub-project. Never install globally without explaining why first.

## Architecture

### Data Flow

```
Finnhub WebSocket
      ↓
groilman-backend (market.service)
      ↓ Socket.io events: price-update, alert-triggered
      ├── groilman-web  (reads via NEXT_PUBLIC_API_URL + socket.io-client)
      └── groilman-bot  (reads via BACKEND_URL + socket.io-client)
```

The backend is the single source of truth. Web and bot both connect to it; they do not communicate with each other.

### Backend Services (`groilman-backend/src/services/`)

| Service | Role |
|---|---|
| `market.service` | Finnhub WebSocket → emits `price-update` via Socket.io; checks alerts on every tick |
| `alert.service` | CRUD for price alerts in Firestore; `checkAlerts()` triggers `alert-triggered` event |
| `firebase.service` | Firebase Admin SDK init; exports `db` (Firestore) and `auth` — both are `null` if `FIREBASE_SERVICE_ACCOUNT` is missing |
| `history.service` | Historical OHLCV with tiered fallbacks (see below) |
| `indicator.service` | RSI and MACD via Alpha Vantage |

**Persistence is Firebase Firestore, not SQLite/Prisma.** The stack description mentioning Prisma is outdated.

### Historical Data Source Priority (`history.service`)

- **Crypto**: Binance → Alpha Vantage
- **Forex**: Alpha Vantage → Finnhub → Binance
- **Metals (XAU/XAG)**: RealMarketAPI → Finnhub → Alpha Vantage → Binance
- **Oil (CL/BZ)**: RealMarketAPI → OilPriceAPI → Finnhub/OANDA → Binance
- **Futures**: Finnhub → Binance

### Symbol Handling

A whitelist (`ALLOWED_SYMBOLS`) is enforced in `market.ts` — all routes reject unknown symbols with 400. Symbol aliases are normalized in `history.service`: `WTI→CL`, `BRENT→BZ`, `GOLD→XAUUSD`, `SILVER→XAGUSD`.

### `io` Export Pattern

`groilman-backend/src/index.ts` exports the Socket.io `io` instance. `market.ts` imports it directly to emit events. Avoid circular import issues by keeping `io` only in `index.ts`.

### Frontend Note

`MarketChart` is loaded with `dynamic(..., { ssr: false })` because `lightweight-charts` requires the browser `window` object. Keep this pattern for any chart components.

## Environment Variables

**groilman-backend/.env**
```
PORT=3001
FINNHUB_API_KEY=
ALPHA_VANTAGE_API_KEY=
OIL_PRICE_API_KEY=
REAL_MARKET_API_KEY=
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}   # full JSON, stringified
```
Note: `firebase.service` fixes `\n` → actual newlines in `private_key` when parsing from env.

**groilman-web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**groilman-bot/.env**
```
BOT_TOKEN=
BACKEND_URL=http://localhost:3001
ADMIN_ID=                    # Telegram chat ID for alert notifications
```

## Monitored Assets

**Forex:** EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD, EUR/GBP, EUR/JPY, GBP/JPY

**Futures:** ES, NQ, YM, GC, CL, SI, NG, ZB, QM, ZN, HG

**Crypto:** BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, MATIC, LINK (all vs USDT)

**Commodities:** XAU/USD, XAG/USD, WTI (CL), Brent (BZ)

## Rules

- API keys go only in `.env` files — never in code or commits
- MCPs are configured in `D:/Groilman/.mcp.json` (project level, not global)
- Never execute trading orders without explicit manual confirmation
- TypeScript throughout — avoid `any`, prefer `unknown`
