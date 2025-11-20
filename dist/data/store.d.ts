/**
 * In-memory data store for users, orders, and positions
 */
import { User, Order, Position, MarketPrice } from '../types/index.js';
declare class DataStore {
    private users;
    private orders;
    private positions;
    private marketPrices;
    createUser(user: User): void;
    getUser(userId: string): User | undefined;
    updateUserBalance(userId: string, newBalance: number): boolean;
    getAllUsers(): User[];
    createOrder(order: Order): void;
    getOrder(orderId: string): Order | undefined;
    updateOrder(orderId: string, updates: Partial<Order>): boolean;
    getUserOrders(userId: string): Order[];
    getAllOrders(): Order[];
    createPosition(position: Position): void;
    getPosition(positionId: string): Position | undefined;
    getUserPositions(userId: string): Position[];
    updatePosition(positionId: string, updates: Partial<Position>): boolean;
    closePosition(positionId: string): boolean;
    setMarketPrice(symbol: string, price: MarketPrice): void;
    getMarketPrice(symbol: string): MarketPrice | undefined;
    getAllMarketPrices(): MarketPrice[];
}
export declare const dataStore: DataStore;
export {};
//# sourceMappingURL=store.d.ts.map