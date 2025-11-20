"use strict";
/**
 * k6 Load Test: Order Placement
 * Tests the /api/orders endpoint
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
const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 50 / NUM_WORKERS;
exports.options = {
    scenarios: {
        ramping_rps: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 200,
            stages: [
                { duration: '2m', target: TARGET_RPS },
                { duration: '5m', target: TARGET_RPS },
                { duration: '1m', target: 0 },
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate==0'],
        errors: ['rate==0'],
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
const SIDES = ['buy', 'sell'];
const TYPES = ['market', 'limit'];
function default_1() {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const side = SIDES[Math.floor(Math.random() * SIDES.length)];
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const payload = JSON.stringify({
        userId: 'user-' + Math.floor(Math.random() * 1000),
        symbol: symbol,
        amount: 1 + Math.random() * 10,
        side: side,
        type: type,
        price: type === 'limit' ? 100 + Math.random() * 1000 : undefined,
    });
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const response = http_1.default.post(`${BASE_URL}/api/orders`, payload, params);
    const success = (0, k6_1.check)(response, {
        'status is 201': (r) => r.status === 201,
        'response has order id': (r) => {
            const body = JSON.parse(r.body);
            return body.success === true && body.data && body.data.id !== undefined;
        },
    });
    errorRate.add(!success);
}
