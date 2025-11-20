/**
 * k6 Load Test: Trading Scenario
 * Simulates a complete trading flow: Create User -> Place Order -> Check Position
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const usersCreated = new Counter('users_created');

const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 100 / NUM_WORKERS;

export const options = {
    scenarios: {
        ramping_rps: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 100,
            maxVUs: 2000,
            stages: [
                { duration: '2m', target: TARGET_RPS },   // Linear ramp up
                { duration: '5m', target: TARGET_RPS },   // Stable load
                { duration: '1m', target: 0 },            // Ramp down
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.01'], // Allow up to 1% failure
        errors: ['rate<0.01'],          // Allow up to 1% errors
    },
};

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];

export default function () {
    // 1. Create User
    const userPayload = JSON.stringify({
        initialBalance: 50000,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const userRes = http.post(`${BASE_URL}/api/users/create`, userPayload, params);

    const userSuccess = check(userRes, {
        'user created': (r) => r.status === 201,
    });

    if (!userSuccess) {
        errorRate.add(1);
        return;
    }

    const userId = JSON.parse(userRes.body as string).data.id;
    usersCreated.add(1);

    // 2. Place Order
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const orderPayload = JSON.stringify({
        userId: userId,
        symbol: symbol,
        amount: 1,
        side: 'buy',
        type: 'market',
    });

    const orderRes = http.post(`${BASE_URL}/api/orders`, orderPayload, params);

    const orderSuccess = check(orderRes, {
        'order placed': (r) => r.status === 201,
    });

    if (!orderSuccess) {
        errorRate.add(1);
        return;
    }

    // 3. Check Position
    const positionRes = http.get(`${BASE_URL}/api/users/${userId}/positions`);

    const positionSuccess = check(positionRes, {
        'positions retrieved': (r) => r.status === 200,
        'position exists': (r) => {
            const body = JSON.parse(r.body as string);
            return body.data && body.data.some((p: any) => p.symbol === symbol);
        }
    });

    errorRate.add(!positionSuccess);
}
