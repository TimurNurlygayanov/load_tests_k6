/**
 * Market data routes
 */

import { Router, Request, Response } from 'express';
import { marketService } from '../services/marketService.js';
import { ApiResponse, MarketPrice, Candle } from '../types/index.js';

const router = Router();

/**
 * GET /api/market/symbols
 * Get list of available trading symbols
 */
router.get('/symbols', (_req: Request, res: Response) => {
    try {
        const symbols = marketService.getSymbols();
        return res.json({
            success: true,
            data: symbols,
        } as ApiResponse<string[]>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * GET /api/market/latest/:symbol
 * Get latest price for a symbol
 */
router.get('/latest/:symbol', (req: Request, res: Response) => {
    try {
        const { symbol } = req.params;
        const marketPrice = marketService.getLatestPrice(symbol.toUpperCase());

        if (!marketPrice) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found',
            } as ApiResponse<null>);
        }

        return res.json({
            success: true,
            data: marketPrice,
        } as ApiResponse<MarketPrice>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * GET /api/market/candles/:symbol
 * Get historical candle data
 * Query params: interval (1m, 5m, 1h, 1d), limit (default: 100)
 */
router.get('/candles/:symbol', (req: Request, res: Response) => {
    try {
        const { symbol } = req.params;
        const interval = (req.query.interval as string) || '1h';
        const limit = parseInt(req.query.limit as string) || 100;

        if (limit > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Limit cannot exceed 1000',
            } as ApiResponse<null>);
        }

        const candles = marketService.getCandles(symbol.toUpperCase(), interval, limit);

        if (!candles) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found',
            } as ApiResponse<null>);
        }

        return res.json({
            success: true,
            data: candles,
        } as ApiResponse<Candle[]>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

export default router;
