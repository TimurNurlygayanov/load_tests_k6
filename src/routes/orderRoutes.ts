/**
 * Order management routes
 */

import { Router, Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { CreateOrderRequest, ApiResponse, OrderResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/orders/market
 * Place a market order
 */
router.post('/market', async (req: Request, res: Response) => {
    try {
        const request = req.body as CreateOrderRequest;

        if (!request.userId || !request.symbol || !request.side || !request.quantity) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity',
            } as ApiResponse<null>);
        }

        if (request.quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be greater than 0',
            } as ApiResponse<null>);
        }

        const order = await orderService.createMarketOrder(request);

        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user balance and symbol validity.',
            } as ApiResponse<null>);
        }

        const response: OrderResponse = {
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
        } as ApiResponse<OrderResponse>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * POST /api/orders/limit
 * Place a limit order
 */
router.post('/limit', async (req: Request, res: Response) => {
    try {
        const request = req.body as CreateOrderRequest;

        if (!request.userId || !request.symbol || !request.side || !request.quantity || !request.price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity, price',
            } as ApiResponse<null>);
        }

        if (request.quantity <= 0 || request.price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity and price must be greater than 0',
            } as ApiResponse<null>);
        }

        const order = await orderService.createLimitOrder(request);

        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user balance and symbol validity.',
            } as ApiResponse<null>);
        }

        const response: OrderResponse = {
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
        } as ApiResponse<OrderResponse>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * POST /api/orders/stop
 * Place a stop order
 */
router.post('/stop', async (req: Request, res: Response) => {
    try {
        const request = req.body as CreateOrderRequest;

        if (!request.userId || !request.symbol || !request.side || !request.quantity || !request.stopPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity, stopPrice',
            } as ApiResponse<null>);
        }

        if (request.quantity <= 0 || request.stopPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity and stopPrice must be greater than 0',
            } as ApiResponse<null>);
        }

        const order = await orderService.createStopOrder(request);

        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user and symbol validity.',
            } as ApiResponse<null>);
        }

        const response: OrderResponse = {
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
        } as ApiResponse<OrderResponse>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * POST /api/orders/take-profit
 * Place a take-profit order
 */
router.post('/take-profit', async (req: Request, res: Response) => {
    try {
        const request = req.body as CreateOrderRequest;

        if (!request.userId || !request.symbol || !request.side || !request.quantity || !request.stopPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, symbol, side, quantity, stopPrice',
            } as ApiResponse<null>);
        }

        if (request.quantity <= 0 || request.stopPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity and stopPrice must be greater than 0',
            } as ApiResponse<null>);
        }

        const order = await orderService.createTakeProfitOrder(request);

        if (!order) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create order. Check user and symbol validity.',
            } as ApiResponse<null>);
        }

        const response: OrderResponse = {
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
        } as ApiResponse<OrderResponse>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * GET /api/orders/:orderId
 * Get order details
 */
router.get('/:orderId', (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = orderService.getOrder(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            } as ApiResponse<null>);
        }

        const response: OrderResponse = {
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
        } as ApiResponse<OrderResponse>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

/**
 * GET /api/orders/user/:userId
 * Get all orders for a user
 */
router.get('/user/:userId', (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const orders = orderService.getUserOrders(userId);

        const responses: OrderResponse[] = orders.map((order) => ({
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
        } as ApiResponse<OrderResponse[]>);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse<null>);
    }
});

export default router;
