import { Bot } from "grammy";
import dotenv from "dotenv";
import { io } from "socket.io-client";

dotenv.config();

const token = process.env.BOT_TOKEN;
const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

if (!token) {
  throw new Error("BOT_TOKEN is not defined in .env file");
}

import { setupCommands } from "./commands";

const bot = new Bot(token);
const socket = io(backendUrl);

// Estado local para guardar últimos precios
const prices: Record<string, number> = {};

socket.on("connect", () => {
  console.log("Connected to Backend Socket.io ✅");
});

socket.on("price-update", (data: { s: string, p: number }) => {
  prices[data.s] = data.p;
});

socket.on("alert-triggered", (alert: { 
  symbol: string; 
  price: number; 
  direction: string;
  createdAt?: string;
}) => {
  const chatId = process.env.ADMIN_ID || process.env.AUTHORIZED_CHAT_ID;
  if (!chatId) {
    console.error("No ADMIN_ID configured to send alert!");
    return;
  }
  
  const directionLabel = alert.direction === 'above' ? '≥' : '≤';
  const now = new Date().toLocaleString('es-AR', { 
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  const message = `🔔 *ALERTA DE PRECIO*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 *Activo:* ${alert.symbol}\n` +
    `🎯 *Precio Objetivo:* ${directionLabel} $${alert.price}\n` +
    `📅 *Creada:* ${alert.createdAt ? new Date(alert.createdAt).toLocaleString('es-AR') : 'N/A'}\n` +
    `⏰ *Disparada:* ${now}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `El precio ha alcanzado el nivel establecido.`;
  
  bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" })
    .catch(err => console.error("Telegram API Error:", err.message));
});

// Configurar comandos — se pasa getter de precios para /price
setupCommands(bot, () => prices);

bot.start();
console.log("Bot is running...");
