/**
 * Market data service - generates realistic mock market data
 */
import { Candle, MarketPrice } from '../types/index.js';
declare class MarketService {
    private priceCache;
    constructor();
    /**
     * Get list of available symbols
     */
    getSymbols(): string[];
    /**
     * Get latest price for a symbol
     */
    getLatestPrice(symbol: string): MarketPrice | null;
    /**
     * Get historical candle data
     */
    getCandles(symbol: string, interval?: string, limit?: number): Candle[] | null;
    /**
     * Generate a single candle with realistic OHLCV data
     */
    private generateCandle;
    /**
     * Get current price with random walk
     */
    private getCurrentPrice;
    /**
     * Update prices with random walk algorithm
     */
    private startPriceUpdates;
    /**
     * Get volatility for a symbol (as a percentage)
     */
    private getVolatility;
    /**
     * Generate realistic 24h volume
     */
    private generateVolume;
    /**
     * Parse interval string to milliseconds
     */
    private parseInterval;
}
export declare const marketService: MarketService;
export {};
//# sourceMappingURL=marketService.d.ts.map