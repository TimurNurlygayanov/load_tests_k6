"use strict";
/**
 * Extreme Stress Test: Market Latest Endpoint
 * 1 Million RPS for 1 minute to test absolute system limits
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
const responseTime = new metrics_1.Trend('response_time');
exports.options = {
    scenarios: {
        extreme_load: {
            executor: 'constant-arrival-rate',
            rate: 1000000, // 1 MILLION RPS
            timeUnit: '1s',
            duration: '1m', // 1 minute
            preAllocatedVUs: 1000, // Pre-allocate many VUs
            maxVUs: 10000, // Allow up to 10k VUs
        },
    },
    thresholds: {
        // Relaxed thresholds for extreme stress
        http_req_failed: ['rate<0.50'], // Allow up to 50% errors
        http_req_duration: [
            'p(50)<5000', // Median under 5s
            'p(95)<10000', // 95th percentile under 10s
        ],
        errors: ['rate<0.50'],
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
function default_1() {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const start = Date.now();
    const response = http_1.default.get(`${BASE_URL}/api/market/latest/${symbol}`);
    const duration = Date.now() - start;
    responseTime.add(duration);
    const success = (0, k6_1.check)(response, {
        'status is 200': (r) => r.status === 200,
    });
    if (!success) {
        errorRate.add(1);
    }
}
