/**
 * Advanced k6 Load Test: Price Spike Stress Test
 * Tests system behavior during sudden large price movements
 * Simulates mass order execution when stop/limit orders trigger simultaneously
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const ordersPlaced = new Counter('orders_placed');
const ordersTriggered = new Counter('orders_triggered');
const simultaneousExecutions = new Counter('simultaneous_executions');
const executionLatency = new Trend('execution_latency');
const priceSpikes = new Counter('price_spikes');

export const options = {
    scenarios: {
        // Setup phase: Create users and place pending orders
        setup_orders: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 },  // Ramp up
                { duration: '1m', target: 100 },  // Create orders
                { duration: '10s', target: 0 },   // Ramp down
            ],
            startTime: '0s',
            gracefulStop: '5s',
            exec: 'setupOrders',
        },

        // Price spike phase: Simulate sudden price movement
        price_spike: {
            executor: 'shared-iterations',
            vus: 1,
            iterations: 1,
            startTime: '1m45s', // Start after setup
            exec: 'triggerPriceSpike',
        },

        // Monitor phase: Check order executions during spike
        monitor_executions: {
            executor: 'constant-vus',
            vus: 20,
            duration: '30s',
            startTime: '1m50s', // Start during spike
            exec: 'monitorExecutions',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<5000'], // Higher latency tolerance during spike
        http_req_failed: ['rate<0.10'],    // EXTREME STRESS: Allow up to 10% errors
        errors: ['rate<0.10'],
        execution_latency: ['p(99)<3000'], // Track execution time
    },
};

const SPIKE_SYMBOL = 'BTCUSD';
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL'];

// Shared data structure (simulated)
let userIds: string[] = [];

/**
 * Setup Phase: Create users and place pending orders
 * Places limit and stop orders that will trigger during price spike
 */
export function setupOrders() {
    const params = { headers: { 'Content-Type': 'application/json' } };

    // Create user
    const userResponse = http.post(
        `${BASE_URL}/api/users/create`,
        JSON.stringify({
            initialBalance: 100000 + Math.random() * 100000,
        }),
        params
    );

    if (!check(userResponse, { 'user created': (r) => r.status === 201 })) {
        errorRate.add(1);
        return;
    }

    const userBody = JSON.parse(userResponse.body as string);
    const userId = userBody.data.id;

    sleep(0.5);

    // Get current price
    const priceResponse = http.get(`${BASE_URL}/api/market/latest/${SPIKE_SYMBOL}`);
    const priceData = JSON.parse(priceResponse.body as string);
    const currentPrice = priceData.data?.price || 45000;

    sleep(0.3);

    // Place multiple pending orders that will trigger during spike
    // These orders are set to trigger at prices that will be hit during the spike

    // Strategy 1: Stop-loss orders (will trigger when price spikes up)
    if (Math.random() > 0.3) {
        const stopPrice = currentPrice * (1.05 + Math.random() * 0.05); // 5-10% above
        const response = http.post(
            `${BASE_URL}/api/orders/stop`,
            JSON.stringify({
                userId,
                symbol: SPIKE_SYMBOL,
                side: 'buy',
                quantity: Math.random() * 0.5 + 0.1,
                stopPrice,
            }),
            params
        );

        if (check(response, { 'stop order placed': (r) => r.status === 201 })) {
            ordersPlaced.add(1);
        } else {
            errorRate.add(1);
        }

        sleep(0.2);
    }

    // Strategy 2: Limit sell orders (will trigger when price spikes up)
    if (Math.random() > 0.4) {
        const limitPrice = currentPrice * (1.03 + Math.random() * 0.07); // 3-10% above
        const response = http.post(
            `${BASE_URL}/api/orders/limit`,
            JSON.stringify({
                userId,
                symbol: SPIKE_SYMBOL,
                side: 'sell',
                quantity: Math.random() * 0.5 + 0.1,
                price: limitPrice,
            }),
            params
        );

        if (check(response, { 'limit order placed': (r) => r.status === 201 })) {
            ordersPlaced.add(1);
        } else {
            errorRate.add(1);
        }

        sleep(0.2);
    }

    // Strategy 3: Take-profit orders
    if (Math.random() > 0.5) {
        const tpPrice = currentPrice * (1.08 + Math.random() * 0.05); // 8-13% above
        const response = http.post(
            `${BASE_URL}/api/orders/take-profit`,
            JSON.stringify({
                userId,
                symbol: SPIKE_SYMBOL,
                side: 'sell',
                quantity: Math.random() * 0.3 + 0.05,
                stopPrice: tpPrice,
            }),
            params
        );

        if (check(response, { 'take-profit order placed': (r) => r.status === 201 })) {
            ordersPlaced.add(1);
        } else {
            errorRate.add(1);
        }

        sleep(0.2);
    }

    // Strategy 4: Multiple limit orders at different price levels
    const numOrders = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numOrders; i++) {
        const limitPrice = currentPrice * (1.04 + (i * 0.02) + Math.random() * 0.02);
        const response = http.post(
            `${BASE_URL}/api/orders/limit`,
            JSON.stringify({
                userId,
                symbol: SPIKE_SYMBOL,
                side: 'sell',
                quantity: Math.random() * 0.2 + 0.05,
                price: limitPrice,
            }),
            params
        );

        if (check(response, { 'ladder order placed': (r) => r.status === 201 })) {
            ordersPlaced.add(1);
        } else {
            errorRate.add(1);
        }

        sleep(0.1);
    }

    sleep(1);
}

/**
 * Price Spike Phase: Simulate sudden large price movement
 * This would normally be done by manipulating the market service
 * For testing, we'll simulate by placing many market orders
 */
export function triggerPriceSpike() {
    // Triggering price spike event
    priceSpikes.add(1);

    const params = { headers: { 'Content-Type': 'application/json' } };

    // Create a whale user
    const userResponse = http.post(
        `${BASE_URL}/api/users/create`,
        JSON.stringify({
            initialBalance: 10000000, // $10M whale
        }),
        params
    );

    const userBody = JSON.parse(userResponse.body as string);
    const whaleId = userBody.data.id;

    sleep(0.5);

    // Place massive buy orders to spike the price
    // In a real system, this would trigger the pending orders
    for (let i = 0; i < 20; i++) {
        http.post(
            `${BASE_URL}/api/orders/market`,
            JSON.stringify({
                userId: whaleId,
                symbol: SPIKE_SYMBOL,
                side: 'buy',
                quantity: 10 + Math.random() * 5, // Large orders
            }),
            params
        );

        sleep(0.1);
    }


    // Price spike completed - monitoring order executions
}

/**
 * Monitor Phase: Check order executions during and after spike
 */
export function monitorExecutions() {
    const params = { headers: { 'Content-Type': 'application/json' } };

    // Create monitoring user
    const userResponse = http.post(
        `${BASE_URL}/api/users/create`,
        JSON.stringify({
            initialBalance: 50000,
        }),
        params
    );

    const userBody = JSON.parse(userResponse.body as string);
    const userId = userBody.data.id;

    // Monitor price during spike
    for (let i = 0; i < 10; i++) {
        const start = Date.now();
        const priceResponse = http.get(`${BASE_URL}/api/market/latest/${SPIKE_SYMBOL}`);
        const latency = Date.now() - start;

        executionLatency.add(latency);

        if (check(priceResponse, { 'price retrieved': (r) => r.status === 200 })) {
            const priceData = JSON.parse(priceResponse.body as string);
            // const price = priceData.data?.price;      }
        }

        sleep(0.2);

        // Try to place orders during high load
        if (i % 3 === 0) {
            const orderStart = Date.now();
            const orderResponse = http.post(
                `${BASE_URL}/api/orders/market`,
                JSON.stringify({
                    userId,
                    symbol: SPIKE_SYMBOL,
                    side: Math.random() > 0.5 ? 'buy' : 'sell',
                    quantity: Math.random() * 0.1 + 0.01,
                }),
                params
            );

            const orderLatency = Date.now() - orderStart;
            executionLatency.add(orderLatency);

            if (check(orderResponse, { 'order executed during spike': (r) => r.status === 201 })) {
                simultaneousExecutions.add(1);
                ordersTriggered.add(1);
            } else {
                errorRate.add(1);
            }
        }
    }

    sleep(1);
}

// Default function (not used in this scenario-based test)
export default function () {
    setupOrders();
}
