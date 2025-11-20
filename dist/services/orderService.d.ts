/**
 * Order execution service - handles all order types and position management
 */
import { Order, CreateOrderRequest } from '../types/index.js';
declare class OrderService {
    /**
     * Create and execute a market order
     */
    createMarketOrder(request: CreateOrderRequest): Promise<Order | null>;
    /**
     * Create a limit order
     */
    createLimitOrder(request: CreateOrderRequest): Promise<Order | null>;
    /**
     * Create a stop order
     */
    createStopOrder(request: CreateOrderRequest): Promise<Order | null>;
    /**
     * Create a take-profit order
     */
    createTakeProfitOrder(request: CreateOrderRequest): Promise<Order | null>;
    /**
     * Check and execute limit orders
     */
    private checkLimitOrder;
    /**
     * Check and execute stop orders
     */
    private checkStopOrder;
    /**
     * Check and execute take-profit orders
     */
    private checkTakeProfitOrder;
    /**
     * Fill an order at a specific price
     */
    private fillOrder;
    /**
     * Update or create position
     */
    private updatePosition;
    /**
     * Get order by ID
     */
    getOrder(orderId: string): Order | undefined;
    /**
     * Get all orders for a user
     */
    getUserOrders(userId: string): Order[];
    /**
     * Start monitoring pending orders
     */
    startOrderMonitoring(): void;
}
export declare const orderService: OrderService;
export {};
//# sourceMappingURL=orderService.d.ts.map