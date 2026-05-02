"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const firebase_service_1 = require("./firebase.service");
class AlertService {
    static collection = 'alerts';
    static async createAlert(alert) {
        if (!firebase_service_1.db)
            throw new Error('Firestore not initialized');
        const newAlert = {
            ...alert,
            active: true,
            createdAt: new Date(),
        };
        const docRef = await firebase_service_1.db.collection(this.collection).add(newAlert);
        return { id: docRef.id, ...newAlert };
    }
    static async getAlerts(active = true) {
        if (!firebase_service_1.db)
            return [];
        const snapshot = await firebase_service_1.db.collection(this.collection)
            .where('active', '==', active)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    // Keep for backwards compatibility within the service
    static async getActiveAlerts() {
        return this.getAlerts(true);
    }
    static async updateAlert(id, updates) {
        if (!firebase_service_1.db)
            return;
        await firebase_service_1.db.collection(this.collection).doc(id).update(updates);
    }
    static async deleteAlert(id) {
        if (!firebase_service_1.db)
            return;
        await firebase_service_1.db.collection(this.collection).doc(id).delete();
    }
    static async checkAlerts(currentPrices, onTrigger) {
        const alerts = await this.getActiveAlerts();
        for (const alert of alerts) {
            const currentPrice = currentPrices[alert.symbol] || currentPrices[`OANDA:${alert.symbol}`];
            if (currentPrice) {
                let triggered = false;
                if (alert.direction === 'above' && currentPrice >= alert.price)
                    triggered = true;
                if (alert.direction === 'below' && currentPrice <= alert.price)
                    triggered = true;
                if (triggered) {
                    onTrigger(alert);
                    await this.deactivateAlert(alert.id);
                }
            }
        }
    }
    static async deactivateAlert(id) {
        if (!firebase_service_1.db)
            return;
        await firebase_service_1.db.collection(this.collection).doc(id).update({ active: false });
    }
}
exports.AlertService = AlertService;
//# sourceMappingURL=alert.service.js.map