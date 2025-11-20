/**
 * Order management routes
 */
import { Router } from 'express';
import { orderService } from '../services/orderService.js';
const router = Router();
/**
 * POST /api/orders/market
 * Place a market order
 */
router.post('/market', async (req, res) => {
    try {
        const request = req.body;
        if (!request.userId || !request.symbol || !request.side || !request.quantity) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity',
            });
        }
        if (request.quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be greater than 0',
            });
        }
        const order = await orderService.createMarketOrder(request);
        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user balance and symbol validity.',
            });
        }
        const response = {
            id: order.id,
            userId: order.userId,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            quantity: order.quantity,
            status: order.status,
            filledPrice: order.filledPrice,
            createdAt: order.createdAt.toISOString(),
            filledAt: order.filledAt?.toISOString(),
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
 * POST /api/orders/limit
 * Place a limit order
 */
router.post('/limit', async (req, res) => {
    try {
        const request = req.body;
        if (!request.userId || !request.symbol || !request.side || !request.quantity || !request.price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity, price',
            });
        }
        if (request.quantity <= 0 || request.price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity and price must be greater than 0',
            });
        }
        const order = await orderService.createLimitOrder(request);
        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user balance and symbol validity.',
            });
        }
        const response = {
            id: order.id,
            userId: order.userId,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            quantity: order.quantity,
            price: order.price,
            status: order.status,
            filledPrice: order.filledPrice,
            createdAt: order.createdAt.toISOString(),
            filledAt: order.filledAt?.toISOString(),
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
 * POST /api/orders/stop
 * Place a stop order
 */
router.post('/stop', async (req, res) => {
    try {
        const request = req.body;
        if (!request.userId || !request.symbol || !request.side || !request.quantity || !request.stopPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity, stopPrice',
            });
        }
        if (request.quantity <= 0 || request.stopPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity and stopPrice must be greater than 0',
            });
        }
        const order = await orderService.createStopOrder(request);
        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user and symbol validity.',
            });
        }
        const response = {
            id: order.id,
            userId: order.userId,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            quantity: order.quantity,
            stopPrice: order.stopPrice,
            status: order.status,
            filledPrice: order.filledPrice,
            createdAt: order.createdAt.toISOString(),
            filledAt: order.filledAt?.toISOString(),
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
 * POST /api/orders/take-profit
 * Place a take-profit order
 */
router.post('/take-profit', async (req, res) => {
    try {
        const request = req.body;
        if (!request.userId || !request.symbol || !request.side || !request.quantity || !request.stopPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity, stopPrice',
            });
        }
        if (request.quantity <= 0 || request.stopPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity and stopPrice must be greater than 0',
            });
        }
        const order = await orderService.createTakeProfitOrder(request);
        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user and symbol validity.',
            });
        }
        const response = {
            id: order.id,
            userId: order.userId,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            quantity: order.quantity,
            stopPrice: order.stopPrice,
            status: order.status,
            filledPrice: order.filledPrice,
            createdAt: order.createdAt.toISOString(),
            filledAt: order.filledAt?.toISOString(),
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
 * GET /api/orders/:orderId
 * Get order details
 */
router.get('/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const order = orderService.getOrder(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }
        const response = {
            id: order.id,
            userId: order.userId,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            quantity: order.quantity,
            price: order.price,
            stopPrice: order.stopPrice,
            status: order.status,
            filledPrice: order.filledPrice,
            createdAt: order.createdAt.toISOString(),
            filledAt: order.filledAt?.toISOString(),
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
 * GET /api/orders/user/:userId
 * Get all orders for a user
 */
router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const orders = orderService.getUserOrders(userId);
        const responses = orders.map((order) => ({
            id: order.id,
            userId: order.userId,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            quantity: order.quantity,
            price: order.price,
            stopPrice: order.stopPrice,
            status: order.status,
            filledPrice: order.filledPrice,
            createdAt: order.createdAt.toISOString(),
            filledAt: order.filledAt?.toISOString(),
        }));
        return res.json({
            success: true,
            data: responses,
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
//# sourceMappingURL=orderRoutes.js.map