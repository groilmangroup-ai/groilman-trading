"use client";

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

interface PriceItem {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
}

interface PriceSidebarProps {
  favorites: string[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onRemoveFavorite: (symbol: string) => void;
}

export default function PriceSidebar({ favorites, activeSymbol, onSelectSymbol, onRemoveFavorite }: PriceSidebarProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl);

    socketRef.current.on('connect', () => {
      console.log('PriceSidebar connected to socket');
    });

    socketRef.current.on('price-update', (data: { s: string; p: number }) => {
      const symbol = data.s;
      setPreviousPrices(prev => ({ ...prev, [symbol]: prices[symbol] || data.p }));
      setPrices(prev => ({ ...prev, [symbol]: data.p }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const formatPrice = (price: number | undefined): string => {
    if (price === undefined) return '--';
    if (price >= 1000) return price.toFixed(0);
    if (price >= 100) return price.toFixed(1);
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const getChangeClass = (symbol: string): string => {
    const current = prices[symbol];
    const previous = previousPrices[symbol];
    if (!current || !previous) return '';
    if (current > previous) return 'text-green-400';
    if (current < previous) return 'text-red-400';
    return '';
  };

  const getSymbolDisplay = (symbol: string): string => {
    const displayMap: Record<string, string> = {
      'BTCUSDT': 'BTC',
      'ETHUSDT': 'ETH',
      'BNBUSDT': 'BNB',
      'SOLUSDT': 'SOL',
      'XRPUSDT': 'XRP',
      'CL': 'WTI',
      'BZ': 'BRENT',
      'XAUUSD': 'GOLD',
      'XAGUSD': 'SILVER',
      'NG': 'NATGAS'
    };
    return displayMap[symbol] || symbol;
  };

  if (favorites.length === 0) {
    return (
      <div className="panel h-full flex items-center justify-center">
        <div className="text-center text-white/30">
          <div className="text-2xl mb-2">⭐</div>
          <p className="text-xs">Selecciona activos de las pestañas</p>
          <p className="text-xs">para agregar a favoritos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
        <span className="text-sm font-bold text-white/70">⭐ Favoritos</span>
        <span className="text-xs text-white/30">({favorites.length})</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1">
        {favorites.map((symbol) => {
          const isActive = activeSymbol === symbol;
          const changeClass = getChangeClass(symbol);
          
          return (
            <div className={`w-full flex items-center justify-between p-2 rounded-md transition-all ${
              isActive 
                ? 'bg-(--accent)/20 border border-(--accent)/30' 
                : 'hover:bg-white/5 border border-transparent'
            }`}>
              <button
                onClick={() => onSelectSymbol(symbol)}
                className="flex items-center gap-2 flex-1"
              >
                <span className={`text-xs font-bold ${isActive ? 'text-(--accent)' : 'text-white/80'}`}>
                  {getSymbolDisplay(symbol)}
                </span>
                {isActive && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-(--accent)/30 text-(--accent)">
                    ✓
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-bold ${changeClass} ${isActive ? 'text-(--accent)' : 'text-white'}`}>
                  {formatPrice(prices[symbol])}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(symbol);
                  }}
                  className="text-white/30 hover:text-red-400 text-xs px-1"
                  title="Quitar de favoritos"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}