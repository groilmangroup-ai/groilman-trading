"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import AlertsPanel from "@/components/AlertsPanel";
import BotConfigPanel from "@/components/BotConfigPanel";
import PriceSidebar from "@/components/PriceSidebar";
import CollapsiblePanel from "@/components/CollapsiblePanel";
import { useAuth } from "@/lib/auth-context";

const MarketChart = dynamic(() => import("@/components/MarketChart"), { ssr: false });

const SYMBOL_GROUPS = {
  crypto: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'],
  forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'],
  metals: ['XAUUSD', 'XAGUSD'],
  oil: ['CL', 'BZ', 'NG'],
  futures: ['ES', 'NQ', 'YM', 'GC', 'SI', 'ZB', 'QM', 'ZN', 'HG']
};

const DEFAULT_FAVORITES = ['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'CL', 'EURUSD'];

type SymbolGroup = keyof typeof SYMBOL_GROUPS;

type PanelId = 'favorites' | 'alerts' | 'bot';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [activeGroup, setActiveGroup] = useState<SymbolGroup>('crypto');
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES);
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_FAVORITES[0]);
  const [expandedPanel, setExpandedPanel] = useState<PanelId>('favorites');

  const togglePanel = (id: string) => {
    setExpandedPanel(prev => prev === id ? prev : id as PanelId);
  };

  const groupLabels: Record<SymbolGroup, string> = {
    crypto: '₿ Crypto',
    forex: '$ Forex',
    metals: '🥇 Metales',
    oil: '🛢️ Petroleo',
    futures: '📈 Futuros'
  };

  const currentGroupSymbols = SYMBOL_GROUPS[activeGroup] || [];

  const toggleFavorite = (symbol: string) => {
    if (favorites.includes(symbol)) {
      setFavorites(favorites.filter(f => f !== symbol));
    } else {
      setFavorites([...favorites, symbol]);
    }
  };

  const isFavorite = (symbol: string) => favorites.includes(symbol);

  return (
    <main className="h-screen w-full flex flex-col bg-(--bg-dark) text-(--text-on-dark) overflow-hidden">
      <header className="h-24 shrink-0 border-b border-white/10 flex flex-col px-3 py-2 bg-black/50 backdrop-blur-md z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-(--accent) flex items-center justify-center text-black font-black text-sm">
              G
            </div>
            <h1 className="text-lg font-black tracking-tighter hidden sm:block">GROILMAN <span className="text-white/50 font-normal text-xs">TRADING</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 hidden sm:inline">⭐ {favorites.length}</span>
            <div className="w-2 h-2 rounded-full bg-(--accent) animate-pulse"></div>
            
            {user && (
              <button 
                onClick={logout}
                className="ml-2 w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden hover:border-white/40 transition-colors"
                title="Cerrar sesión"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/70 text-xs font-bold">
                    {user.displayName?.[0] || '?'}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 -mx-2 px-2">
          {(Object.keys(SYMBOL_GROUPS) as SymbolGroup[]).map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                activeGroup === group 
                  ? "bg-(--accent) text-black" 
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {groupLabels[group]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          {currentGroupSymbols.map((sym) => {
            const isFav = isFavorite(sym);
            const isActive = activeSymbol === sym;
            
            return (
              <button
                key={sym}
                onClick={() => {
                  if (isFav) {
                    toggleFavorite(sym);
                  } else {
                    toggleFavorite(sym);
                    setActiveSymbol(sym);
                  }
                }}
                title={isFav ? "Clic para quitar de favoritos" : "Clic para agregar a favoritos"}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  isActive 
                    ? "bg-(--accent) text-black" 
                    : isFav
                      ? "bg-white/10 text-white/80 border border-(--accent)/30 hover:border-red-400/50"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {isFav && <span className="text-[10px]">⭐</span>}
                {sym}
              </button>
            );
          })}
        </div>
      </header>

      <div className="dashboard-grid flex-1 min-h-0">
        <div className="lg:col-span-9 panel">
          <MarketChart symbol={activeSymbol} containerId={`chart-${activeSymbol}`} />
        </div>

        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <CollapsiblePanel
            id="favorites"
            title="⭐ Favoritos"
            icon="⭐"
            expanded={expandedPanel}
            onToggle={togglePanel}
          >
            <PriceSidebar 
              favorites={favorites} 
              activeSymbol={activeSymbol}
              onSelectSymbol={setActiveSymbol}
              onRemoveFavorite={toggleFavorite}
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            id="alerts"
            title="🔔 Alertas"
            icon="🔔"
            expanded={expandedPanel}
            onToggle={togglePanel}
          >
            <AlertsPanel />
          </CollapsiblePanel>

          <CollapsiblePanel
            id="bot"
            title="🤖 Bot"
            icon="🤖"
            expanded={expandedPanel}
            onToggle={togglePanel}
          >
            <BotConfigPanel />
          </CollapsiblePanel>
        </div>
      </div>
    </main>
  );
}