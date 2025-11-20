/**
 * Order execution service - handles all order types and position management
 */

import { v4 as uuidv4 } from 'uuid';
import { Order, OrderSide, Position, CreateOrderRequest } from '../types/index.js';
import { dataStore } from '../data/store.js';
import { marketService } from './marketService.js';

class OrderService {
    /**
     * Create and execute a market order
     */
    async createMarketOrder(request: CreateOrderRequest): Promise<Order | null> {
        const { userId, symbol, side, quantity } = request;

        // Validate user
        const user = dataStore.getUser(userId);
        if (!user) {
            return null;
        }

        // Get current market price
        const marketPrice = marketService.getLatestPrice(symbol);
        if (!marketPrice) {
            return null;
        }

        const executionPrice = side === 'buy' ? marketPrice.ask : marketPrice.bid;
        const totalCost = executionPrice * quantity;

        // Validate balance for buy orders
        if (side === 'buy' && user.balance < totalCost) {
            return null;
        }

        // Create order
        const order: Order = {
            id: uuidv4(),
            userId,
            symbol,
            type: 'market',
            side,
            quantity,
            status: 'filled',
            filledPrice: executionPrice,
            createdAt: new Date(),
            filledAt: new Date(),
        };

        dataStore.createOrder(order);

        // Update balance and position
        if (side === 'buy') {
            dataStore.updateUserBalance(userId, user.balance - totalCost);
            this.updatePosition(userId, symbol, quantity, executionPrice, side);
        } else {
            dataStore.updateUserBalance(userId, user.balance + totalCost);
            this.updatePosition(userId, symbol, -quantity, executionPrice, side);
        }

        return order;
    }

    /**
     * Create a limit order
     */
    async createLimitOrder(request: CreateOrderRequest): Promise<Order | null> {
        const { userId, symbol, side, quantity, price } = request;

        if (!price) {
            return null;
        }

        // Validate user
        const user = dataStore.getUser(userId);
        if (!user) {
            return null;
        }

        // Validate symbol
        const marketPrice = marketService.getLatestPrice(symbol);
        if (!marketPrice) {
            return null;
        }

        const totalCost = price * quantity;

        // Reserve balance for buy limit orders
        if (side === 'buy' && user.balance < totalCost) {
            return null;
        }

        // Create order
        const order: Order = {
            id: uuidv4(),
            userId,
            symbol,
            type: 'limit',
            side,
            quantity,
            price,
            status: 'pending',
            createdAt: new Date(),
        };

        dataStore.createOrder(order);

        // Check if order can be filled immediately
        this.checkLimitOrder(order);

        return order;
    }

    /**
     * Create a stop order
     */
    async createStopOrder(request: CreateOrderRequest): Promise<Order | null> {
        const { userId, symbol, side, quantity, stopPrice } = request;

        if (!stopPrice) {
            return null;
        }

        // Validate user
        const user = dataStore.getUser(userId);
        if (!user) {
            return null;
        }

        // Validate symbol
        const marketPrice = marketService.getLatestPrice(symbol);
        if (!marketPrice) {
            return null;
        }

        // Create order
        const order: Order = {
            id: uuidv4(),
            userId,
            symbol,
            type: 'stop',
            side,
            quantity,
            stopPrice,
            status: 'pending',
            createdAt: new Date(),
        };

        dataStore.createOrder(order);

        // Check if order should trigger immediately
        this.checkStopOrder(order);

        return order;
    }

    /**
     * Create a take-profit order
     */
    async createTakeProfitOrder(request: CreateOrderRequest): Promise<Order | null> {
        const { userId, symbol, side, quantity, stopPrice } = request;

        if (!stopPrice) {
            return null;
        }

        // Validate user
        const user = dataStore.getUser(userId);
        if (!user) {
            return null;
        }

        // Validate symbol
        const marketPrice = marketService.getLatestPrice(symbol);
        if (!marketPrice) {
            return null;
        }

        // Create order
        const order: Order = {
            id: uuidv4(),
            userId,
            symbol,
            type: 'take_profit',
            side,
            quantity,
            stopPrice,
            status: 'pending',
            createdAt: new Date(),
        };

        dataStore.createOrder(order);

        // Check if order should trigger immediately
        this.checkTakeProfitOrder(order);

        return order;
    }

    /**
     * Check and execute limit orders
     */
    private checkLimitOrder(order: Order): void {
        if (order.status !== 'pending' || !order.price) {
            return;
        }

        const marketPrice = marketService.getLatestPrice(order.symbol);
        if (!marketPrice) {
            return;
        }

        let shouldFill = false;

        if (order.side === 'buy' && marketPrice.ask <= order.price) {
            shouldFill = true;
        } else if (order.side === 'sell' && marketPrice.bid >= order.price) {
            shouldFill = true;
        }

        if (shouldFill) {
            this.fillOrder(order, order.price);
        }
    }

    /**
     * Check and execute stop orders
     */
    private checkStopOrder(order: Order): void {
        if (order.status !== 'pending' || !order.stopPrice) {
            return;
        }

        const marketPrice = marketService.getLatestPrice(order.symbol);
        if (!marketPrice) {
            return;
        }

        let shouldTrigger = false;

        if (order.side === 'buy' && marketPrice.price >= order.stopPrice) {
            shouldTrigger = true;
        } else if (order.side === 'sell' && marketPrice.price <= order.stopPrice) {
            shouldTrigger = true;
        }

        if (shouldTrigger) {
            this.fillOrder(order, marketPrice.price);
        }
    }

    /**
     * Check and execute take-profit orders
     */
    private checkTakeProfitOrder(order: Order): void {
        if (order.status !== 'pending' || !order.stopPrice) {
            return;
        }

        const marketPrice = marketService.getLatestPrice(order.symbol);
        if (!marketPrice) {
            return;
        }

        let shouldTrigger = false;

        if (order.side === 'sell' && marketPrice.price >= order.stopPrice) {
            shouldTrigger = true;
        } else if (order.side === 'buy' && marketPrice.price <= order.stopPrice) {
            shouldTrigger = true;
        }

        if (shouldTrigger) {
            this.fillOrder(order, marketPrice.price);
        }
    }

    /**
     * Fill an order at a specific price
     */
    private fillOrder(order: Order, price: number): void {
        const user = dataStore.getUser(order.userId);
        if (!user) {
            return;
        }

        const totalCost = price * order.quantity;

        // Update balance
        if (order.side === 'buy') {
            if (user.balance < totalCost) {
                dataStore.updateOrder(order.id, { status: 'rejected' });
                return;
            }
            dataStore.updateUserBalance(order.userId, user.balance - totalCost);
            this.updatePosition(order.userId, order.symbol, order.quantity, price, order.side);
        } else {
            dataStore.updateUserBalance(order.userId, user.balance + totalCost);
            this.updatePosition(order.userId, order.symbol, -order.quantity, price, order.side);
        }

        // Update order status
        dataStore.updateOrder(order.id, {
            status: 'filled',
            filledPrice: price,
            filledAt: new Date(),
        });
    }

    /**
     * Update or create position
     */
    private updatePosition(
        userId: string,
        symbol: string,
        quantity: number,
        price: number,
        side: OrderSide
    ): void {
        const positions = dataStore.getUserPositions(userId);
        const existingPosition = positions.find((p) => p.symbol === symbol && p.side === side);

        if (existingPosition && quantity > 0) {
            // Add to existing position
            const totalQuantity = existingPosition.quantity + quantity;
            const totalCost =
                existingPosition.averagePrice * existingPosition.quantity + price * quantity;
            const newAveragePrice = totalCost / totalQuantity;

            dataStore.updatePosition(existingPosition.id, {
                quantity: totalQuantity,
                averagePrice: newAveragePrice,
            });
        } else if (existingPosition && quantity < 0) {
            // Reduce or close position
            const newQuantity = existingPosition.quantity + quantity;
            if (newQuantity <= 0) {
                dataStore.closePosition(existingPosition.id);
            } else {
                dataStore.updatePosition(existingPosition.id, {
                    quantity: newQuantity,
                });
            }
        } else if (quantity > 0) {
            // Create new position
            const position: Position = {
                id: uuidv4(),
                userId,
                symbol,
                quantity,
                averagePrice: price,
                side,
                openedAt: new Date(),
            };
            dataStore.createPosition(position);
        }
    }

    /**
     * Get order by ID
     */
    getOrder(orderId: string): Order | undefined {
        return dataStore.getOrder(orderId);
    }

    /**
     * Get all orders for a user
     */
    getUserOrders(userId: string): Order[] {
        return dataStore.getUserOrders(userId);
    }

    /**
     * Start monitoring pending orders
     */
    startOrderMonitoring(): void {
        setInterval(() => {
            const orders = dataStore.getAllOrders();
            orders.forEach((order) => {
                if (order.status === 'pending') {
                    switch (order.type) {
                        case 'limit':
                            this.checkLimitOrder(order);
                            break;
                        case 'stop':
                            this.checkStopOrder(order);
                            break;
                        case 'take_profit':
                            this.checkTakeProfitOrder(order);
                            break;
                    }
                }
            });
        }, 500); // Check every 500ms
    }
}

export const orderService = new OrderService();
