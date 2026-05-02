declare class MarketService {
    private ws;
    private currentPrices;
    private lastAlertCheck;
    private readonly ALERT_CHECK_INTERVAL_MS;
    private symbols;
    private binanceWs;
    constructor();
    private connectBinance;
    private connect;
    private subscribeAll;
    private handleTrade;
    subscribe(symbol: string): void;
}
export declare const marketService: MarketService;
export {};
//# sourceMappingURL=market.service.d.ts.map