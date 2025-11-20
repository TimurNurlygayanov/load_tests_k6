/**
 * Performance Test: Market Latest Price Endpoint
 * Constant 1000 RPS for 10 minutes to measure detailed performance metrics
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
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
                { duration: '1m', target: 0 },    // Ramp down
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate==0'],           // STRICT: 0% error rate
        http_req_duration: [
            'p(50)<100',   // Median under 100ms
            'p(90)<200',   // 90th percentile under 200ms
            'p(95)<300',   // 95th percentile under 300ms
            'p(99)<500',   // 99th percentile under 500ms
            'max<2000',    // Max response time under 2s
        ],
        errors: ['rate==0'],
    },
};

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];

export default function () {
    // Random symbol selection
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const response = http.get(`${BASE_URL}/api/market/latest/${symbol}`);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'has price data': (r) => {
            const body = JSON.parse(r.body as string);
            return body.success === true && body.data && body.data.price > 0;
        },
    });

    if (!success) {
        errorRate.add(1);
    }
}
