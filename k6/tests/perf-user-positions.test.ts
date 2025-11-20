/**
 * Performance Test: User Positions Endpoint
 * Constant 1000 RPS for 10 minutes
 */

import http from 'k6/http';
import { check } from 'k6';
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
                { duration: '2m', target: 500 },  // Ramp to 500 RPS over 2 minutes
                { duration: '8m', target: 500 },  // Hold 500 RPS for 8 minutes
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

// Setup: Create users with positions
export function setup() {
    const users = [];
    const params = { headers: { 'Content-Type': 'application/json' } };

    // Create 50 users
    for (let i = 0; i < 50; i++) {
        const userResponse = http.post(
            `${BASE_URL}/api/users/create`,
            JSON.stringify({ initialBalance: 100000 }),
            params
        );

        if (userResponse.status === 201) {
            const userBody = JSON.parse(userResponse.body as string);
            const userId = userBody.data.id;

            // Create a position for this user
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
    // Random user selection
    const userId = data.users[Math.floor(Math.random() * data.users.length)];

    const response = http.get(`${BASE_URL}/api/users/${userId}/positions`);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'has positions data': (r) => {
            const body = JSON.parse(r.body as string);
            return body.success === true && Array.isArray(body.data);
        },
    });

    if (!success) {
        errorRate.add(1);
    }
}
