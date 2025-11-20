/**
 * Extreme Stress Test: User Positions Endpoint
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

// Setup: Create users with positions
export function setup() {
    const users = [];
    const params = { headers: { 'Content-Type': 'application/json' } };

    for (let i = 0; i < 100; i++) {
        const userResponse = http.post(
            `${BASE_URL}/api/users/create`,
            JSON.stringify({ initialBalance: 1000000 }),
            params
        );

        if (userResponse.status === 201) {
            const userBody = JSON.parse(userResponse.body as string);
            const userId = userBody.data.id;

            // Create a position
            http.post(
                `${BASE_URL}/api/orders/market`,
                JSON.stringify({
                    userId,
                    symbol: 'BTCUSD',
                    side: 'buy',
                    quantity: 0.1,
                }),
                params
            );

            users.push(userId);
        }
    }

    return { users };
}

export default function (data: { users: string[] }) {
    const userId = data.users[Math.floor(Math.random() * data.users.length)];

    const start = Date.now();
    const response = http.get(`${BASE_URL}/api/users/${userId}/positions`);
    const duration = Date.now() - start;

    responseTime.add(duration);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
    });

    if (!success) {
        errorRate.add(1);
    }
}
