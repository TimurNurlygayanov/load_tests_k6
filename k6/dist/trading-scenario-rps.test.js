"use strict";
/**
 * k6 Load Test: Trading Scenario (RPS-based)
 * Simulates a complete trading flow with controlled RPS (requests per second)
 * This version uses ramping-arrival-rate executor for precise RPS control
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.default = default_1;
const http_1 = __importDefault(require("k6/http"));
const k6_1 = require("k6");
const metrics_1 = require("k6/metrics");
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// Custom metrics
const errorRate = new metrics_1.Rate('errors');
const usersCreated = new metrics_1.Counter('users_created');
const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 1000 / NUM_WORKERS; // Total 1000 RPS across all workers
exports.options = {
    scenarios: {
        rps_controlled: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 200,
            maxVUs: 2000,
            stages: [
                { duration: '2m', target: TARGET_RPS }, // Ramp up to target RPS over 2 minutes
                { duration: '15m', target: TARGET_RPS }, // Hold at target RPS for 15 minutes
                { duration: '1m', target: 0 }, // Ramp down over 1 minute
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.01'], // Allow up to 1% failure
        errors: ['rate<0.01'], // Allow up to 1% errors
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
function default_1() {
    // 1. Create User
    const userPayload = JSON.stringify({
        initialBalance: 50000,
    });
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const userRes = http_1.default.post(`${BASE_URL}/api/users/create`, userPayload, params);
    const userSuccess = (0, k6_1.check)(userRes, {
        'user created': (r) => r.status === 201,
    });
    if (!userSuccess) {
        errorRate.add(1);
        return;
    }
    const userId = JSON.parse(userRes.body).data.id;
    usersCreated.add(1);
    // 2. Place Order
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const orderPayload = JSON.stringify({
        userId: userId,
        symbol: symbol,
        amount: 1,
        side: 'buy',
        type: 'market',
    });
    const orderRes = http_1.default.post(`${BASE_URL}/api/orders`, orderPayload, params);
    const orderSuccess = (0, k6_1.check)(orderRes, {
        'order placed': (r) => r.status === 201,
    });
    if (!orderSuccess) {
        errorRate.add(1);
        return;
    }
    // 3. Check Position
    const positionRes = http_1.default.get(`${BASE_URL}/api/users/${userId}/positions`);
    const positionSuccess = (0, k6_1.check)(positionRes, {
        'positions retrieved': (r) => r.status === 200,
        'position exists': (r) => {
            const body = JSON.parse(r.body);
            return body.data && body.data.some((p) => p.symbol === symbol);
        }
    });
    errorRate.add(!positionSuccess);
    // No sleep needed - k6 controls the rate automatically
}
