import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ALPHA_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export class IndicatorService {
  /**
   * Obtiene el RSI de un símbolo
   * @param symbol Ejemplo: 'EURUSD'
   * @param interval Ejemplo: 'daily', '1min', '5min', '15min', '30min', '60min'
   * @param time_period Ejemplo: 14
   */
  static async getRSI(symbol: string, interval: string = 'daily', time_period: number = 14) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'RSI',
          symbol,
          interval,
          time_period,
          series_type: 'close',
          apikey: ALPHA_KEY
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching RSI for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el MACD de un símbolo
   */
  static async getMACD(symbol: string, interval: string = 'daily') {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'MACD',
          symbol,
          interval,
          series_type: 'close',
          apikey: ALPHA_KEY
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching MACD for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las Bandas de Bollinger
   */
  static async getBollingerBands(symbol: string, interval: string = 'daily') {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'BBANDS',
          symbol,
          interval,
          time_period: 20,
          series_type: 'close',
          nbdevup: 2,
          nbdevdn: 2,
          apikey: ALPHA_KEY
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching BBANDS for ${symbol}:`, error);
      throw error;
    }
  }
}
