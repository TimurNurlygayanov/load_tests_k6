/**
 * k6 Load Test: Market Data
 * Tests the /api/market endpoints
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');

const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 100 / NUM_WORKERS;

export const options = {
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

export default function () {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const response = http.get(`${BASE_URL}/api/market/latest/${symbol}`);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'has price data': (r) => {
            const body = JSON.parse(r.body as string);
            return body.success === true && body.data && body.data.price > 0;
        },
    });

    errorRate.add(!success);
}
