export declare class IndicatorService {
    /**
     * Obtiene el RSI de un símbolo
     * @param symbol Ejemplo: 'EURUSD'
     * @param interval Ejemplo: 'daily', '1min', '5min', '15min', '30min', '60min'
     * @param time_period Ejemplo: 14
     */
    static getRSI(symbol: string, interval?: string, time_period?: number): Promise<any>;
    /**
     * Obtiene el MACD de un símbolo
     */
    static getMACD(symbol: string, interval?: string): Promise<any>;
    /**
     * Obtiene las Bandas de Bollinger
     */
    static getBollingerBands(symbol: string, interval?: string): Promise<any>;
}
//# sourceMappingURL=indicator.service.d.ts.map