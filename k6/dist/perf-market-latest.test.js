"use strict";
/**
 * Performance Test: Market Latest Price Endpoint
 * Constant 1000 RPS for 10 minutes to measure detailed performance metrics
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
exports.options = {
    scenarios: {
        ramping_load: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 200,
            stages: [
                { duration: '2m', target: 1000 }, // Ramp to 1000 RPS over 2 minutes
                { duration: '8m', target: 1000 }, // Hold 1000 RPS for 8 minutes
                { duration: '1m', target: 0 }, // Ramp down
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate==0'], // STRICT: 0% error rate
        http_req_duration: [
            'p(50)<100', // Median under 100ms
            'p(90)<200', // 90th percentile under 200ms
            'p(95)<300', // 95th percentile under 300ms
            'p(99)<500', // 99th percentile under 500ms
            'max<2000', // Max response time under 2s
        ],
        errors: ['rate==0'],
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
function default_1() {
    // Random symbol selection
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const response = http_1.default.get(`${BASE_URL}/api/market/latest/${symbol}`);
    const success = (0, k6_1.check)(response, {
        'status is 200': (r) => r.status === 200,
        'has price data': (r) => {
            const body = JSON.parse(r.body);
            return body.success === true && body.data && body.data.price > 0;
        },
    });
    if (!success) {
        errorRate.add(1);
    }
}
