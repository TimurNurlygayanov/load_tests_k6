/**
 * Extreme Stress Test: Market Latest Endpoint
 * 1 Million RPS for 1 minute to test absolute system limits
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
    scenarios: {
        extreme_load: {
            executor: 'constant-arrival-rate',
            rate: 1000000,          // 1 MILLION RPS
            timeUnit: '1s',
            duration: '1m',         // 1 minute
            preAllocatedVUs: 1000,  // Pre-allocate many VUs
            maxVUs: 10000,          // Allow up to 10k VUs
        },
    },
    thresholds: {
        // Relaxed thresholds for extreme stress
        http_req_failed: ['rate<0.50'],    // Allow up to 50% errors
        http_req_duration: [
            'p(50)<5000',  // Median under 5s
            'p(95)<10000', // 95th percentile under 10s
        ],
        errors: ['rate<0.50'],
    },
};

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];

export default function () {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const start = Date.now();
    const response = http.get(`${BASE_URL}/api/market/latest/${symbol}`);
    const duration = Date.now() - start;

    responseTime.add(duration);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
    });

    if (!success) {
        errorRate.add(1);
    }
}
