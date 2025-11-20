/**
 * Performance Test: Market Order Endpoint
 * Constant 1000 RPS for 10 minutes with pre-seeded users
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');

// Load pre-seeded user IDs
const userIds = new SharedArray('users', function () {
    // In real scenario, load from file or create users in setup
    // For now, we'll create users on the fly
    return [];
});

export const options = {
    scenarios: {
        ramping_load: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 200,
            stages: [
                { duration: '2m', target: 500 },  // Ramp to 500 RPS over 2 minutes
                { duration: '8m', target: 500 },  // Hold 500 RPS for 8 minutes
                { duration: '1m', target: 0 },    // Ramp down
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate==0'],           // STRICT: 0% error rate
        http_req_duration: [
            'p(50)<150',   // Median under 150ms
            'p(90)<300',   // 90th percentile under 300ms
            'p(95)<400',   // 95th percentile under 400ms
            'p(99)<800',   // 99th percentile under 800ms
            'max<3000',    // Max response time under 3s
        ],
        errors: ['rate==0'],
    },
};

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL'];

// Setup: Create test users
export function setup() {
    const users = [];
    const params = { headers: { 'Content-Type': 'application/json' } };

    // Create 50 users for testing
    for (let i = 0; i < 50; i++) {
        const response = http.post(
            `${BASE_URL}/api/users/create`,
            JSON.stringify({ initialBalance: 1000000 }), // $1M balance
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

    // Use pre-created user
    const userId = data.users[Math.floor(Math.random() * data.users.length)];
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.random() * 0.5 + 0.01;

    const response = http.post(
        `${BASE_URL}/api/orders/market`,
        JSON.stringify({
            userId,
            symbol,
            side,
            quantity,
        }),
        params
    );

    const success = check(response, {
        'status is 201': (r) => r.status === 201,
        'order filled': (r) => {
            const body = JSON.parse(r.body as string);
            return body.success === true && body.data && body.data.status === 'filled';
        },
    });

    if (!success) {
        errorRate.add(1);
    }
}
