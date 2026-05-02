export interface OHLCV {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
export declare class HistoryService {
    /**
     * Obtiene datos históricos para un símbolo dado.
     * Fuentes: Binance (crypto) > Alpha Vantage (forex) > Finnhub (futuros)
     */
    static getHistory(symbol: string, resolution: string, days?: number): Promise<OHLCV[]>;
    private static getBinanceHistory;
    private static getFinnhubHistory;
    private static getAlphaVantageForex;
    private static getAlphaVantageCrypto;
    private static getOilPriceHistory;
    private static getRealMarketHistory;
}
//# sourceMappingURL=history.service.d.ts.map