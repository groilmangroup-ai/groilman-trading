import { Bot } from "grammy";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
const API = `${backendUrl}/api/market`;

const HELP = `
🏦 *Groilman Trading Intelligence*

📊 *Mercado*
/price [SYM] - Precio en tiempo real
/symbols - Lista de símbolos disponibles

🔔 *Alertas*
/alert [SYM] [PRECIO] [above|below] - Crear alerta
/alerts - Ver alertas activas

📰 *Noticias*
/news - Últimas noticias del mercado

ℹ️ *Ayuda*
/help - Mostrar todos los comandos
`;

export function setupCommands(bot: Bot, getPrices: () => Record<string, number>) {
  bot.command("start", (ctx) =>
    ctx.reply("🏦 *Groilman Trading Intelligence*\n\nUsa /help para ver todos los comandos.", { parse_mode: "Markdown" })
  );

  bot.command("help", (ctx) => ctx.reply(HELP, { parse_mode: "Markdown" }));

  bot.command("symbols", (ctx) =>
    ctx.reply(
      "*📊 Símbolos Disponibles*\n\n" +
      "*Crypto:* BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, ADAUSDT, DOGEUSDT, DOTUSDT, MATICUSDT, LINKUSDT\n\n" +
      "*Forex:* EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD, EURGBP, EURJPY, GBPJPY\n\n" +
      "*Metales:* XAUUSD, XAGUSD\n\n" +
      "*Petroleo:* WTI, BRENT\n\n" +
      "*Futuros:* ES, NQ, YM, GC, CL, SI, NG",
      { parse_mode: "Markdown" }
    )
  );

  bot.command("price", (ctx) => {
    const symbol = ctx.match?.trim().toUpperCase();
    if (!symbol) return ctx.reply("❌ Uso: /price EURUSD");
    const prices = getPrices();
    const price = prices[symbol];
    if (price != null) {
      const decimals = symbol.includes("JPY") ? 3 : symbol.includes("BTC") ? 2 : 5;
      return ctx.reply(`💰 *${symbol}*: ${price.toFixed(decimals)}`, { parse_mode: "Markdown" });
    }
    return ctx.reply(`⚠️ Sin precio en tiempo real para *${symbol}*. Solo disponible para Forex, Crypto y Metales activos.`, { parse_mode: "Markdown" });
  });

  bot.command("alert", async (ctx) => {
    const args = ctx.match?.trim().split(/\s+/) ?? [];
    if (args.length < 2) {
      return ctx.reply("❌ Uso: /alert [SÍMBOLO] [PRECIO] [above|below]\n\nEjemplo: /alert BTCUSDT 65000 above");
    }
    const [sym, priceStr, dirArg] = args;
    const symbol = sym?.toUpperCase() ?? '';
    const price = parseFloat(priceStr ?? '');
    const direction: 'above' | 'below' = dirArg === 'below' ? 'below' : 'above';

    if (!symbol || isNaN(price)) return ctx.reply("❌ Precio inválido.");

    try {
      const res = await fetch(`${API}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, price, direction, userId: "admin" }),
      });
      if (res.ok) {
        return ctx.reply(
          `✅ Alerta creada\n*${symbol}* ${direction === "above" ? "≥" : "≤"} $${price}`,
          { parse_mode: "Markdown" }
        );
      }
      return ctx.reply("❌ Error al crear alerta en el servidor.");
    } catch {
      return ctx.reply("❌ No se pudo conectar al backend.");
    }
  });

  bot.command("alerts", async (ctx) => {
    try {
      const res = await fetch(`${API}/alerts`);
      const alerts = (await res.json()) as any[];
      if (!alerts || alerts.length === 0) {
        return ctx.reply("🔕 No hay alertas activas.\n\nUsa /alert [SYM] [PRECIO] para crear una.");
      }
      const list = alerts
        .map((a) => `• *${a.symbol}* ${a.direction === "above" ? "≥" : "≤"} $${Number(a.price).toFixed(4)}`)
        .join("\n");
      return ctx.reply(`🔔 *Alertas Activas (${alerts.length})*\n\n${list}`, { parse_mode: "Markdown" });
    } catch {
      return ctx.reply("❌ Error al obtener alertas.");
    }
  });

  bot.command("news", async (ctx) => {
    try {
      const res = await fetch(`${API}/news`);
      const articles = (await res.json()) as any[];
      if (!articles || articles.length === 0) return ctx.reply("📰 No hay noticias disponibles.");
      const list = articles
        .slice(0, 5)
        .map((a) => `• [${a.headline}](${a.url})`)
        .join("\n\n");
      return ctx.reply(`📰 *Noticias del Mercado*\n\n${list}`, {
        parse_mode: "Markdown",
        // @ts-ignore — grammy accepts this
        link_preview_options: { is_disabled: true },
      });
    } catch {
      return ctx.reply("❌ Error al obtener noticias.");
    }
  });
}
