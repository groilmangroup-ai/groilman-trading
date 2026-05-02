"use client";

import { useState } from "react";

export default function BotConfigPanel() {
  const [testing, setTesting] = useState(false);

  const testBot = async () => {
    setTesting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/market/test-bot`, { method: 'POST' });
      if (res.ok) alert('Test signal sent! Check Telegram.');
      else alert('Failed to send test signal.');
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <h3 className="panel-title">Telegram Bot Integration</h3>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3">
        <p className="text-sm text-white/70">
          Get real-time push notifications for your price alerts directly to your phone.
        </p>
        
        <div className="bg-black/40 rounded p-3 text-xs text-white/60 font-mono">
          <ol className="list-decimal pl-4 space-y-1">
            <li>Open Telegram and search for <strong className="text-white">@userinfobot</strong> to get your Telegram ID.</li>
            <li>Add your ID to the <strong className="text-white">ADMIN_ID</strong> in the <code className="bg-white/10 px-1 rounded">.env</code> file of the bot service.</li>
            <li>Start <strong className="text-(--accent)">@GroilmanBot</strong> in Telegram.</li>
          </ol>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-(--accent)"></div>
            <span className="text-xs uppercase font-bold text-white/70">Bot Service</span>
          </div>
          <button 
            onClick={testBot}
            disabled={testing}
            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white/80 uppercase font-bold transition-colors"
          >
            {testing ? 'Sending...' : 'Test Bot Signal'}
          </button>
        </div>
      </div>
    </div>
  );
}
