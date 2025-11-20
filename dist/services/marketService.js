/**
 * Market data service - generates realistic mock market data
 */
import { dataStore } from '../data/store.js';
// Available trading symbols
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA', 'EURUSD', 'GBPUSD'];
// Base prices for each symbol
const BASE_PRICES = {
    BTCUSD: 45000,
    ETHUSD: 3000,
    AAPL: 180,
    GOOGL: 140,
    TSLA: 250,
    EURUSD: 1.08,
    GBPUSD: 1.26,
};
class MarketService {
    constructor() {
        this.priceCache = new Map();
        // Initialize prices
        SYMBOLS.forEach((symbol) => {
            this.priceCache.set(symbol, BASE_PRICES[symbol]);
        });
        // Update prices periodically
        this.startPriceUpdates();
    }
    /**
     * Get list of available symbols
     */
    getSymbols() {
        return SYMBOLS;
    }
    /**
     * Get latest price for a symbol
     */
    getLatestPrice(symbol) {
        if (!SYMBOLS.includes(symbol)) {
            return null;
        }
        const price = this.getCurrentPrice(symbol);
        const spread = price * 0.0001; // 0.01% spread
        const marketPrice = {
            symbol,
            price,
            timestamp: new Date(),
            bid: price - spread / 2,
            ask: price + spread / 2,
            volume24h: this.generateVolume(symbol),
        };
        dataStore.setMarketPrice(symbol, marketPrice);
        return marketPrice;
    }
    /**
     * Get historical candle data
     */
    getCandles(symbol, interval = '1h', limit = 100) {
        if (!SYMBOLS.includes(symbol)) {
            return null;
        }
        const candles = [];
        const intervalMs = this.parseInterval(interval);
        const currentTime = Date.now();
        let currentPrice = this.getCurrentPrice(symbol);
        // Generate historical candles going backwards in time
        for (let i = limit - 1; i >= 0; i--) {
            const timestamp = new Date(currentTime - i * intervalMs);
            const candle = this.generateCandle(symbol, timestamp, currentPrice);
            candles.push(candle);
            currentPrice = candle.close;
        }
        return candles;
    }
    /**
     * Generate a single candle with realistic OHLCV data
     */
    generateCandle(symbol, timestamp, basePrice) {
        const volatility = this.getVolatility(symbol);
        // Random walk for price movement
        const change = (Math.random() - 0.5) * volatility * basePrice;
        const open = basePrice;
        const close = basePrice + change;
        // High and low based on open and close
        const high = Math.max(open, close) * (1 + Math.random() * volatility / 2);
        const low = Math.min(open, close) * (1 - Math.random() * volatility / 2);
        const volume = this.generateVolume(symbol) / 24; // Hourly volume
        return {
            timestamp,
            open,
            high,
            low,
            close,
            volume,
        };
    }
    /**
     * Get current price with random walk
     */
    getCurrentPrice(symbol) {
        const cachedPrice = this.priceCache.get(symbol);
        if (!cachedPrice) {
            return BASE_PRICES[symbol];
        }
        return cachedPrice;
    }
    /**
     * Update prices with random walk algorithm
     */
    startPriceUpdates() {
        setInterval(() => {
            SYMBOLS.forEach((symbol) => {
                const currentPrice = this.getCurrentPrice(symbol);
                const volatility = this.getVolatility(symbol);
                const change = (Math.random() - 0.5) * volatility * currentPrice;
                const newPrice = currentPrice + change;
                this.priceCache.set(symbol, newPrice);
            });
        }, 1000); // Update every second
    }
    /**
     * Get volatility for a symbol (as a percentage)
     */
    getVolatility(symbol) {
        const volatilities = {
            BTCUSD: 0.02,
            ETHUSD: 0.025,
            AAPL: 0.01,
            GOOGL: 0.01,
            TSLA: 0.015,
            EURUSD: 0.005,
            GBPUSD: 0.005,
        };
        return volatilities[symbol] || 0.01;
    }
    /**
     * Generate realistic 24h volume
     */
    generateVolume(symbol) {
        const baseVolumes = {
            BTCUSD: 1000000000,
            ETHUSD: 500000000,
            AAPL: 100000000,
            GOOGL: 50000000,
            TSLA: 80000000,
            EURUSD: 200000000,
            GBPUSD: 150000000,
        };
        const baseVolume = baseVolumes[symbol] || 10000000;
        return baseVolume * (0.8 + Math.random() * 0.4); // ±20% variation
    }
    /**
     * Parse interval string to milliseconds
     */
    parseInterval(interval) {
        const unit = interval.slice(-1);
        const value = parseInt(interval.slice(0, -1)) || 1;
        const intervals = {
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return (intervals[unit] || intervals.h) * value;
    }
}
export const marketService = new MarketService();
//# sourceMappingURL=marketService.js.map