import { db } from './firebase.service';
import { Socket } from 'socket.io';

export interface Alert {
  id?: string;
  symbol: string;
  price: number;
  direction: 'above' | 'below';
  userId?: string;
  active: boolean;
  createdAt: Date;
}

export class AlertService {
  private static collection = 'alerts';

  static async createAlert(alert: Omit<Alert, 'id' | 'active' | 'createdAt'>) {
    if (!db) throw new Error('Firestore not initialized');
    
    const newAlert: Alert = {
      ...alert,
      active: true,
      createdAt: new Date(),
    };

    const docRef = await db.collection(this.collection).add(newAlert);
    return { id: docRef.id, ...newAlert };
  }

  static async getAlerts(active: boolean = true) {
    if (!db) return [];
    const snapshot = await db.collection(this.collection)
      .where('active', '==', active)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
  }

  // Keep for backwards compatibility within the service
  static async getActiveAlerts() {
    return this.getAlerts(true);
  }

  static async updateAlert(id: string, updates: Partial<Alert>) {
    if (!db) return;
    await db.collection(this.collection).doc(id).update(updates);
  }

  static async deleteAlert(id: string) {
    if (!db) return;
    await db.collection(this.collection).doc(id).delete();
  }

  static async checkAlerts(currentPrices: Record<string, number>, onTrigger: (alert: Alert) => void) {
    const alerts = await this.getActiveAlerts();
    
    for (const alert of alerts) {
      const currentPrice = currentPrices[alert.symbol] || currentPrices[`OANDA:${alert.symbol}`];
      
      if (currentPrice) {
        let triggered = false;
        if (alert.direction === 'above' && currentPrice >= alert.price) triggered = true;
        if (alert.direction === 'below' && currentPrice <= alert.price) triggered = true;

        if (triggered) {
          onTrigger(alert);
          await this.deactivateAlert(alert.id!);
        }
      }
    }
  }

  static async deactivateAlert(id: string) {
    if (!db) return;
    await db.collection(this.collection).doc(id).update({ active: false });
  }
}
