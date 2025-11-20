/**
 * In-memory data store for users, orders, and positions
 */

import { User, Order, Position, MarketPrice } from '../types/index.js';

class DataStore {
    private users: Map<string, User> = new Map();
    private orders: Map<string, Order> = new Map();
    private positions: Map<string, Position> = new Map();
    private marketPrices: Map<string, MarketPrice> = new Map();

    // User operations
    createUser(user: User): void {
        this.users.set(user.id, user);
    }

    getUser(userId: string): User | undefined {
        return this.users.get(userId);
    }

    updateUserBalance(userId: string, newBalance: number): boolean {
        const user = this.users.get(userId);
        if (!user) return false;
        user.balance = newBalance;
        return true;
    }

    getAllUsers(): User[] {
        return Array.from(this.users.values());
    }

    // Order operations
    createOrder(order: Order): void {
        this.orders.set(order.id, order);
    }

    getOrder(orderId: string): Order | undefined {
        return this.orders.get(orderId);
    }

    updateOrder(orderId: string, updates: Partial<Order>): boolean {
        const order = this.orders.get(orderId);
        if (!order) return false;
        Object.assign(order, updates);
        return true;
    }

    getUserOrders(userId: string): Order[] {
        return Array.from(this.orders.values()).filter(
            (order) => order.userId === userId
        );
    }

    getAllOrders(): Order[] {
        return Array.from(this.orders.values());
    }

    // Position operations
    createPosition(position: Position): void {
        this.positions.set(position.id, position);

        // Add position to user
        const user = this.users.get(position.userId);
        if (user) {
            user.positions.push(position);
        }
    }

    getPosition(positionId: string): Position | undefined {
        return this.positions.get(positionId);
    }

    getUserPositions(userId: string): Position[] {
        return Array.from(this.positions.values()).filter(
            (position) => position.userId === userId && !position.closedAt
        );
    }

    updatePosition(positionId: string, updates: Partial<Position>): boolean {
        const position = this.positions.get(positionId);
        if (!position) return false;
        Object.assign(position, updates);
        return true;
    }

    closePosition(positionId: string): boolean {
        const position = this.positions.get(positionId);
        if (!position) return false;
        position.closedAt = new Date();
        return true;
    }

    // Market price operations
    setMarketPrice(symbol: string, price: MarketPrice): void {
        this.marketPrices.set(symbol, price);
    }

    getMarketPrice(symbol: string): MarketPrice | undefined {
        return this.marketPrices.get(symbol);
    }

    getAllMarketPrices(): MarketPrice[] {
        return Array.from(this.marketPrices.values());
    }
}

// Singleton instance
export const dataStore = new DataStore();
