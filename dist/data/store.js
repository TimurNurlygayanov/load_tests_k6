/**
 * In-memory data store for users, orders, and positions
 */
class DataStore {
    constructor() {
        this.users = new Map();
        this.orders = new Map();
        this.positions = new Map();
        this.marketPrices = new Map();
    }
    // User operations
    createUser(user) {
        this.users.set(user.id, user);
    }
    getUser(userId) {
        return this.users.get(userId);
    }
    updateUserBalance(userId, newBalance) {
        const user = this.users.get(userId);
        if (!user)
            return false;
        user.balance = newBalance;
        return true;
    }
    getAllUsers() {
        return Array.from(this.users.values());
    }
    // Order operations
    createOrder(order) {
        this.orders.set(order.id, order);
    }
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
    updateOrder(orderId, updates) {
        const order = this.orders.get(orderId);
        if (!order)
            return false;
        Object.assign(order, updates);
        return true;
    }
    getUserOrders(userId) {
        return Array.from(this.orders.values()).filter((order) => order.userId === userId);
    }
    getAllOrders() {
        return Array.from(this.orders.values());
    }
    // Position operations
    createPosition(position) {
        this.positions.set(position.id, position);
        // Add position to user
        const user = this.users.get(position.userId);
        if (user) {
            user.positions.push(position);
        }
    }
    getPosition(positionId) {
        return this.positions.get(positionId);
    }
    getUserPositions(userId) {
        return Array.from(this.positions.values()).filter((position) => position.userId === userId && !position.closedAt);
    }
    updatePosition(positionId, updates) {
        const position = this.positions.get(positionId);
        if (!position)
            return false;
        Object.assign(position, updates);
        return true;
    }
    closePosition(positionId) {
        const position = this.positions.get(positionId);
        if (!position)
            return false;
        position.closedAt = new Date();
        return true;
    }
    // Market price operations
    setMarketPrice(symbol, price) {
        this.marketPrices.set(symbol, price);
    }
    getMarketPrice(symbol) {
        return this.marketPrices.get(symbol);
    }
    getAllMarketPrices() {
        return Array.from(this.marketPrices.values());
    }
}
// Singleton instance
export const dataStore = new DataStore();
//# sourceMappingURL=store.js.map