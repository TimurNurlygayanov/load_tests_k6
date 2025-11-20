/**
 * Core type definitions for the trading platform
 */
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'take_profit';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';
/**
 * User account information
 */
export interface User {
    id: string;
    balance: number;
    createdAt: Date;
    positions: Position[];
}
/**
 * Trading position
 */
export interface Position {
    id: string;
    userId: string;
    symbol: string;
    quantity: number;
    averagePrice: number;
    side: OrderSide;
    openedAt: Date;
    closedAt?: Date;
}
/**
 * Order information
 */
export interface Order {
    id: string;
    userId: string;
    symbol: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
    stopPrice?: number;
    status: OrderStatus;
    filledPrice?: number;
    createdAt: Date;
    filledAt?: Date;
}
/**
 * OHLCV candle data
 */
export interface Candle {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
/**
 * Latest market price
 */
export interface MarketPrice {
    symbol: string;
    price: number;
    timestamp: Date;
    bid: number;
    ask: number;
    volume24h: number;
}
/**
 * API Request Types
 */
export interface CreateUserRequest {
    initialBalance: number;
}
export interface CreateOrderRequest {
    userId: string;
    symbol: string;
    side: OrderSide;
    quantity: number;
    price?: number;
    stopPrice?: number;
}
/**
 * API Response Types
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface UserResponse {
    id: string;
    balance: number;
    createdAt: string;
}
export interface OrderResponse {
    id: string;
    userId: string;
    symbol: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
    stopPrice?: number;
    status: OrderStatus;
    filledPrice?: number;
    createdAt: string;
    filledAt?: string;
}
export interface PositionResponse {
    id: string;
    symbol: string;
    quantity: number;
    averagePrice: number;
    side: OrderSide;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
}
//# sourceMappingURL=index.d.ts.map