"use strict";
/**
 * k6 Load Test: Market Data
 * Tests the /api/market endpoints
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
const TARGET_RPS = 100 / NUM_WORKERS;
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
        http_req_duration: ['p(95)<300'],
        http_req_failed: ['rate==0'],
        errors: ['rate==0'],
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
function default_1() {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const response = http_1.default.get(`${BASE_URL}/api/market/latest/${symbol}`);
    const success = (0, k6_1.check)(response, {
        'status is 200': (r) => r.status === 200,
        'has price data': (r) => {
            const body = JSON.parse(r.body);
            return body.success === true && body.data && body.data.price > 0;
        },
    });
    errorRate.add(!success);
}
