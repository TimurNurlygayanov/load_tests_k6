/**
 * Market data routes
 */
import { Router } from 'express';
import { marketService } from '../services/marketService.js';
const router = Router();
/**
 * GET /api/market/symbols
 * Get list of available trading symbols
 */
router.get('/symbols', (_req, res) => {
    try {
        const symbols = marketService.getSymbols();
        return res.json({
            success: true,
            data: symbols,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * GET /api/market/latest/:symbol
 * Get latest price for a symbol
 */
router.get('/latest/:symbol', (req, res) => {
    try {
        const { symbol } = req.params;
        const marketPrice = marketService.getLatestPrice(symbol.toUpperCase());
        if (!marketPrice) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found',
            });
        }
        return res.json({
            success: true,
            data: marketPrice,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * GET /api/market/candles/:symbol
 * Get historical candle data
 * Query params: interval (1m, 5m, 1h, 1d), limit (default: 100)
 */
router.get('/candles/:symbol', (req, res) => {
    try {
        const { symbol } = req.params;
        const interval = req.query.interval || '1h';
        const limit = parseInt(req.query.limit) || 100;
        if (limit > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Limit cannot exceed 1000',
            });
        }
        const candles = marketService.getCandles(symbol.toUpperCase(), interval, limit);
        if (!candles) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found',
            });
        }
        return res.json({
            success: true,
            data: candles,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
export default router;
//# sourceMappingURL=marketRoutes.js.map