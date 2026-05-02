export interface Alert {
    id?: string;
    symbol: string;
    price: number;
    direction: 'above' | 'below';
    userId?: string;
    active: boolean;
    createdAt: Date;
}
export declare class AlertService {
    private static collection;
    static createAlert(alert: Omit<Alert, 'id' | 'active' | 'createdAt'>): Promise<{
        id: string;
        symbol: string;
        price: number;
        direction: "above" | "below";
        userId?: string;
        active: boolean;
        createdAt: Date;
    }>;
    static getAlerts(active?: boolean): Promise<Alert[]>;
    static getActiveAlerts(): Promise<Alert[]>;
    static updateAlert(id: string, updates: Partial<Alert>): Promise<void>;
    static deleteAlert(id: string): Promise<void>;
    static checkAlerts(currentPrices: Record<string, number>, onTrigger: (alert: Alert) => void): Promise<void>;
    static deactivateAlert(id: string): Promise<void>;
}
//# sourceMappingURL=alert.service.d.ts.map