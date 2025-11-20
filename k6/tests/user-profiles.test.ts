/**
 * k6 Load Test: User Profiles
 * Simulates different user behaviors (Active Trader, Holder, etc.)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');

const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 20 / NUM_WORKERS;

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

export default function () {
    // 1. Create User
    const userPayload = JSON.stringify({
        initialBalance: 10000,
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

    // 2. Get Profile
    const profileRes = http.get(`${BASE_URL}/api/users/${userId}`);

    const profileSuccess = check(profileRes, {
        'profile retrieved': (r) => r.status === 200,
        'profile has balance': (r) => {
            const body = JSON.parse(r.body as string);
            return body.data && body.data.balance !== undefined;
        }
    });

    errorRate.add(!profileSuccess);
}
