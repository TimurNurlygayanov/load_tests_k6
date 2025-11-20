/**
 * User management routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/store.js';
import { marketService } from '../services/marketService.js';
const router = Router();
/**
 * POST /api/users/create
 * Create a new user with initial balance
 */
router.post('/create', (req, res) => {
    try {
        const { initialBalance } = req.body;
        if (!initialBalance || initialBalance <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Initial balance must be greater than 0',
            });
        }
        const user = {
            id: uuidv4(),
            balance: initialBalance,
            createdAt: new Date(),
            positions: [],
        };
        dataStore.createUser(user);
        const response = {
            id: user.id,
            balance: user.balance,
            createdAt: user.createdAt.toISOString(),
        };
        return res.status(201).json({
            success: true,
            data: response,
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
 * GET /api/users/:userId
 * Get user details
 */
router.get('/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = dataStore.getUser(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const response = {
            id: user.id,
            balance: user.balance,
            createdAt: user.createdAt.toISOString(),
        };
        return res.json({
            success: true,
            data: response,
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
 * GET /api/users/:userId/balance
 * Get user balance
 */
router.get('/:userId/balance', (req, res) => {
    try {
        const { userId } = req.params;
        const user = dataStore.getUser(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        return res.json({
            success: true,
            data: { balance: user.balance },
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
 * GET /api/users/:userId/positions
 * Get user's open positions
 */
router.get('/:userId/positions', (req, res) => {
    try {
        const { userId } = req.params;
        const user = dataStore.getUser(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const positions = dataStore.getUserPositions(userId);
        const positionResponses = positions.map((position) => {
            const marketPrice = marketService.getLatestPrice(position.symbol);
            const currentPrice = marketPrice?.price || position.averagePrice;
            const currentValue = currentPrice * position.quantity;
            const costBasis = position.averagePrice * position.quantity;
            const profitLoss = position.side === 'buy'
                ? currentValue - costBasis
                : costBasis - currentValue;
            const profitLossPercent = (profitLoss / costBasis) * 100;
            return {
                id: position.id,
                symbol: position.symbol,
                quantity: position.quantity,
                averagePrice: position.averagePrice,
                side: position.side,
                currentValue,
                profitLoss,
                profitLossPercent,
            };
        });
        return res.json({
            success: true,
            data: positionResponses,
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
//# sourceMappingURL=userRoutes.js.map