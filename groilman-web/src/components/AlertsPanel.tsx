"use client";

import { useEffect, useState } from "react";

interface Alert {
  id: string;
  symbol: string;
  price: number;
  direction: 'above' | 'below';
  active: boolean;
  createdAt: string;
}

const ALL_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT',
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP',
  'XAUUSD', 'XAGUSD',
  'CL', 'BZ', 'NG',
  'ES', 'NQ', 'YM', 'GC', 'SI', 'ZB', 'HN'
];

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  
  const [symbolFilter, setSymbolFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDirection, setNewDirection] = useState<'above' | 'below'>('above');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const filteredSymbols = ALL_SYMBOLS.filter(s => 
    s.toLowerCase().includes(symbolFilter.toLowerCase())
  ).slice(0, 8);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/market/alerts?archived=${showArchived}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [showArchived]);

  useEffect(() => {
    if (!newSymbol) {
      setCurrentPrice(null);
      return;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/market/history?symbol=${newSymbol}&resolution=1&days=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCurrentPrice(data[data.length - 1].close);
        }
      })
      .catch(() => setCurrentPrice(null));
  }, [newSymbol]);

  const handleDelete = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/market/alerts/${id}`, { method: 'DELETE' });
      fetchAlerts();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (id: string, updates: Partial<Alert>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/market/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchAlerts();
    } catch (e) { console.error(e); }
  };

  const saveEdit = (id: string) => {
    const price = parseFloat(editPrice);
    if (!isNaN(price)) handleUpdate(id, { price });
    setEditingId(null);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !newPrice) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/market/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.trim().toUpperCase(),
          price: parseFloat(newPrice),
          direction: newDirection
        })
      });
      if (res.ok) {
        setNewSymbol("");
        setNewPrice("");
        setSymbolFilter("");
        fetchAlerts();
      }
    } catch (error) {
      console.error("Failed to create alert:", error);
    }
  };

  const selectSymbol = (sym: string) => {
    setNewSymbol(sym);
    setSymbolFilter("");
    setShowDropdown(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header flex-col items-stretch gap-2 pb-0">
        <div className="flex justify-between w-full">
          <h3 className="panel-title">Alerts</h3>
          <button onClick={fetchAlerts} className="text-xs text-(--accent) hover:opacity-80">↻</button>
        </div>
        <div className="flex w-full mt-2 border-b border-white/10">
          <button 
            onClick={() => setShowArchived(false)}
            className={`flex-1 pb-2 text-xs font-bold transition-all ${!showArchived ? 'text-(--accent) border-b-2 border-(--accent)' : 'text-white/40 border-b-2 border-transparent hover:text-white/70'}`}
          >
            ACTIVE
          </button>
          <button 
            onClick={() => setShowArchived(true)}
            className={`flex-1 pb-2 text-xs font-bold transition-all ${showArchived ? 'text-(--accent) border-b-2 border-(--accent)' : 'text-white/40 border-b-2 border-transparent hover:text-white/70'}`}
          >
            ARCHIVED
          </button>
        </div>
      </div>
      
      <form onSubmit={handleCreateAlert} className="px-2 py-2 border-b border-white/10 space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Símbolo..."
            value={symbolFilter || newSymbol}
            onChange={(e) => {
              setSymbolFilter(e.target.value);
              setNewSymbol(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-(--accent)"
          />
          {showDropdown && filteredSymbols.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-black/90 border border-white/10 rounded mt-1 z-10 max-h-32 overflow-y-auto">
              {filteredSymbols.map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => selectSymbol(sym)}
                  className="w-full px-2 py-1 text-left text-xs hover:bg-white/10 text-white/80"
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 items-center">
          <select
            value={newDirection}
            onChange={(e) => setNewDirection(e.target.value as 'above' | 'below')}
            className="bg-white/5 border border-white/10 rounded px-1 py-1 text-xs outline-none focus:border-(--accent)"
          >
            <option value="above">≥</option>
            <option value="below">≤</option>
          </select>
          <div className="relative flex-1">
            <input
              type="number"
              placeholder={currentPrice ? `$${currentPrice.toFixed(4)}` : "Precio"}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-(--accent)"
            />
            {currentPrice && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-(--accent)">
                ⬤
              </span>
            )}
          </div>
          <button
            type="submit"
            className="bg-(--accent) text-black text-xs font-bold px-2 py-1 rounded hover:opacity-90"
          >
            +
          </button>
        </div>
      </form>
      
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {loading && alerts.length === 0 ? (
          <div className="text-sm text-white/50 text-center mt-4 animate-pulse">Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="text-xs text-white/30 text-center mt-4">
            {showArchived ? "No archived." : "Sin alertas activas."}
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-black/30 border border-white/5 rounded p-2 flex justify-between items-center group">
              <div>
                <div className="font-bold text-xs flex items-center gap-2">
                  {alert.symbol}
                  <div className={`w-1.5 h-1.5 rounded-full ${alert.active ? 'bg-(--accent)' : 'bg-white/20'}`}></div>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  {alert.direction === 'above' ? '≥' : '≤'} ${alert.price.toFixed(4)}
                </div>
                <div className="text-[9px] text-white/20">
                  {new Date(alert.createdAt).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {alert.active && (
                  <button onClick={() => handleUpdate(alert.id!, { active: false })} className="text-[10px] text-yellow-400">✓</button>
                )}
                <button onClick={() => handleDelete(alert.id!)} className="text-[10px] text-red-400">✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}