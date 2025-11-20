/**
 * Order management routes
 */
import { Router } from 'express';
import { orderService } from '../services/orderService.js';
const router = Router();
/**
 * POST /api/orders
 * Generic order endpoint - routes to specific order type based on 'type' field
 */
router.post('/', async (req, res) => {
    try {
        const request = req.body;
        // Handle backward compatibility: map 'amount' to 'quantity'
        if (request.amount !== undefined && request.quantity === undefined) {
            request.quantity = request.amount;
        }
        if (!request.type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: type (market, limit, stop, take_profit)',
            });
        }
        // Route to the appropriate handler based on type
        switch (request.type.toLowerCase()) {
            case 'market':
                return await handleMarketOrder(req, res);
            case 'limit':
                return await handleLimitOrder(req, res);
            case 'stop':
                return await handleStopOrder(req, res);
            case 'take_profit':
                return await handleTakeProfitOrder(req, res);
            default:
                return res.status(400).json({
                    success: false,
                    error: `Invalid order type: ${request.type}. Must be one of: market, limit, stop, take_profit`,
                });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * Handler for market orders
 */
async function handleMarketOrder(req, res) {
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
/**
 * POST /api/orders/market
 * Place a market order
 */
router.post('/market', async (req, res) => {
    return await handleMarketOrder(req, res);
});
/**
 * Handler for limit orders
 */
async function handleLimitOrder(req, res) {
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
/**
 * POST /api/orders/limit
 * Place a limit order
 */
router.post('/limit', async (req, res) => {
    return await handleLimitOrder(req, res);
});
/**
 * Handler for stop orders
 */
async function handleStopOrder(req, res) {
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
/**
 * POST /api/orders/stop
 * Place a stop order
 */
router.post('/stop', async (req, res) => {
    return await handleStopOrder(req, res);
});
/**
 * Handler for take-profit orders
 */
async function handleTakeProfitOrder(req, res) {
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
/**
 * POST /api/orders/take-profit
 * Place a take-profit order
 */
router.post('/take-profit', async (req, res) => {
    return await handleTakeProfitOrder(req, res);
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