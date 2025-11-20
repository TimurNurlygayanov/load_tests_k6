/**
 * k6 Load Test: Order Placement
 * Tests the /api/orders endpoint
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');

const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 50 / NUM_WORKERS;

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
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate==0'],
        errors: ['rate==0'],
    },
};

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
const SIDES = ['buy', 'sell'];
const TYPES = ['market', 'limit'];

export default function () {
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

    const response = http.post(`${BASE_URL}/api/orders`, payload, params);

    const success = check(response, {
        'status is 201': (r) => r.status === 201,
        'response has order id': (r) => {
            const body = JSON.parse(r.body as string);
            return body.success === true && body.data && body.data.id !== undefined;
        },
    });

    errorRate.add(!success);
}
