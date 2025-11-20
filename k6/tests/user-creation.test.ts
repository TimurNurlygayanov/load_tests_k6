/**
 * k6 Load Test: User Creation
 * Tests the /api/users/create endpoint
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
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate==0'],
        errors: ['rate==0'],
    },
};

export default function () {
    const payload = JSON.stringify({
        initialBalance: 10000 + Math.random() * 90000,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = http.post(`${BASE_URL}/api/users/create`, payload, params);

    const success = check(response, {
        'status is 201': (r) => r.status === 201,
        'response has success field': (r) => {
            const body = JSON.parse(r.body as string);
            return body.success === true;
        },
        'response has user id': (r) => {
            const body = JSON.parse(r.body as string);
            return body.data && body.data.id !== undefined;
        },
        'response has balance': (r) => {
            const body = JSON.parse(r.body as string);
            return body.data && body.data.balance > 0;
        },
    });

    errorRate.add(!success);
}
