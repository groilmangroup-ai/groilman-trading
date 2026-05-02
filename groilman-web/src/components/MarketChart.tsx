"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, Time, CandlestickSeries, LineSeries, BarSeries } from 'lightweight-charts';
import { io } from 'socket.io-client';

interface MarketChartProps {
  symbol: string;
  containerId: string;
}

export default function MarketChart({ symbol, containerId }: MarketChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [hasData, setHasData] = useState(false);
  
  const [resolution, setResolution] = useState<string>('60');
  const [chartType, setChartType] = useState<'candle' | 'bar' | 'line'>('candle');
  const [historyDays, setHistoryDays] = useState<number>(180);

  // We need a ref to track the latest candle data so we can update it via websocket
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number; volume?: number } | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    setHasData(false);
    lastCandleRef.current = null;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      autoSize: true,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    chartRef.current = chart;

    let series: any;
    const chartAny = chart as any;
    if (chartType === 'candle') {
      series = chartAny.addSeries(CandlestickSeries, {
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });
    } else if (chartType === 'bar') {
      try {
        series = chartAny.addSeries(BarSeries, {
          upColor: '#26a69a', downColor: '#ef5350',
        });
      } catch (e) {
        series = chartAny.addSeries(CandlestickSeries, {
          upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        });
      }
    } else {
      series = chartAny.addSeries(LineSeries, {
        color: '#2962FF', lineWidth: 2,
      });
    }

    series.applyOptions({
      priceFormat: { type: 'price', precision: symbol.includes('BTC') ? 2 : 5, minMove: 0.00001 },
    });

    seriesRef.current = series;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log(`Fetching: ${apiUrl}/api/market/history?symbol=${symbol}&resolution=${resolution}`);
    
    // Fetch History
    fetch(`${apiUrl}/api/market/history?symbol=${symbol}&resolution=${resolution}&days=${historyDays}`)
      .then(res => res.json())
      .then(data => {
        console.log(`Received ${data?.length || 0} candles for ${symbol}`);
        if (data && data.length > 0) {
          // Clean up data for Line charts (which only need time and value)
          if (chartType === 'line') {
            const lineData = data.map((d: any) => ({ time: d.time, value: d.close }));
            series.setData(lineData);
          } else {
            series.setData(data);
          }
          // Fit chart to show all data
          chart.timeScale().fitContent();
          lastCandleRef.current = data[data.length - 1];
          setHasData(true);
        }
      })
      .catch(err => console.error("History fetch error:", err));

    const socket = io(apiUrl);
    
    socket.on('price-update', (data) => {
      if (data.s === symbol) {
        setHasData(true);
        const price = data.p;
        const tickTime = Math.floor(data.t / 1000); // ms to s
        
        // Determine resolution in seconds
        let resSeconds = 60; // default 1m
        if (resolution === '5') resSeconds = 300;
        else if (resolution === '15') resSeconds = 900;
        else if (resolution === '30') resSeconds = 1800;
        else if (resolution === '60') resSeconds = 3600;
        else if (resolution === 'D') resSeconds = 86400;

        // Aggregate tick into the current timeframe block
        const candleTime = Math.floor(tickTime / resSeconds) * resSeconds;

        let lastCandle = lastCandleRef.current;

        if (!lastCandle || lastCandle.time < candleTime) {
          // New candle
          lastCandle = {
            time: candleTime,
            open: price,
            high: price,
            low: price,
            close: price
          };
        } else {
          // Update existing candle
          lastCandle.close = price;
          if (price > lastCandle.high) lastCandle.high = price;
          if (price < lastCandle.low) lastCandle.low = price;
        }

        lastCandleRef.current = lastCandle;

        if (chartType === 'line') {
          series.update({ time: lastCandle.time as Time, value: lastCandle.close });
        } else {
          series.update({
            time: lastCandle.time as Time,
            open: lastCandle.open,
            high: lastCandle.high,
            low: lastCandle.low,
            close: lastCandle.close,
          });
        }
      }
    });

    return () => {
      socket.disconnect();
      chart.remove();
    };
  }, [symbol, resolution, chartType, historyDays]);

  const setAlert = async (price: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/market/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, price, direction: 'above', userId: 'admin' })
      });
      if (response.ok) alert('Alerta configurada ✅');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold tracking-tighter uppercase">{symbol}</h3>
          
          <div className="flex bg-white/5 rounded p-1 border border-white/10">
            {['1', '5', '15', '60', 'D'].map(res => (
              <button 
                key={res}
                onClick={() => setResolution(res)}
                className={`px-2 py-0.5 rounded text-xs font-bold ${resolution === res ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {res === '60' ? '1H' : res}
              </button>
            ))}
          </div>
          
          <select 
            value={historyDays}
            onChange={(e) => setHistoryDays(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-(--accent)"
          >
            <option value={30}>30D</option>
            <option value={60}>60D</option>
            <option value={90}>90D</option>
            <option value={180}>180D</option>
            <option value={365}>365D</option>
          </select>
          
          <div className="flex bg-white/5 rounded p-1 border border-white/10">
            {[
              { id: 'candle', label: '🕯️' },
              { id: 'line', label: '📈' }
            ].map(type => (
              <button 
                key={type.id}
                onClick={() => setChartType(type.id as any)}
                className={`px-2 py-0.5 rounded text-xs ${chartType === type.id ? 'bg-white/20' : 'opacity-50 hover:opacity-100'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <span className="px-2 py-1 bg-(--accent)/10 text-(--accent) text-xs rounded font-mono uppercase whitespace-nowrap">Live</span>
        </div>
      </div>
      <div className="relative w-full flex-1 rounded-xl overflow-hidden border border-white/5 bg-black/20 backdrop-blur-sm min-h-0">
        {!hasData && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full border-2 border-(--accent) border-t-transparent animate-spin mb-4"></div>
            <p className="text-white/70 font-mono text-sm">Loading historical data and waiting for ticks for {symbol}...</p>
          </div>
        )}
        <div ref={chartContainerRef} id={containerId} className="absolute inset-0" />
      </div>
    </div>
  );
}
