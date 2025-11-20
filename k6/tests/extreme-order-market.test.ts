/**
 * Extreme Stress Test: Market Order Endpoint
 * 1 Million RPS for 1 minute
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
            preAllocatedVUs: 1000,
            maxVUs: 10000,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.50'],    // Allow up to 50% errors
        http_req_duration: [
            'p(50)<5000',  // Median under 5s
            'p(95)<10000', // 95th percentile under 10s
        ],
        errors: ['rate<0.50'],
    },
};

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL'];

// Setup: Create test users
export function setup() {
    const users = [];
    const params = { headers: { 'Content-Type': 'application/json' } };

    // Create 100 users for extreme testing
    for (let i = 0; i < 100; i++) {
        const response = http.post(
            `${BASE_URL}/api/users/create`,
            JSON.stringify({ initialBalance: 10000000 }), // $10M balance
            params
        );

        if (response.status === 201) {
            const body = JSON.parse(response.body as string);
            users.push(body.data.id);
        }
    }

    return { users };
}

export default function (data: { users: string[] }) {
    const params = { headers: { 'Content-Type': 'application/json' } };

    const userId = data.users[Math.floor(Math.random() * data.users.length)];
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.random() * 0.1 + 0.01;

    const start = Date.now();
    const response = http.post(
        `${BASE_URL}/api/orders/market`,
        JSON.stringify({ userId, symbol, side, quantity }),
        params
    );
    const duration = Date.now() - start;

    responseTime.add(duration);

    const success = check(response, {
        'status is 201': (r) => r.status === 201,
    });

    if (!success) {
        errorRate.add(1);
    }
}
