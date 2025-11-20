"use strict";
/**
 * k6 Load Test: User Profiles
 * Simulates different user behaviors (Active Trader, Holder, etc.)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.default = default_1;
const http_1 = __importDefault(require("k6/http"));
const k6_1 = require("k6");
const metrics_1 = require("k6/metrics");
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// Custom metrics
const errorRate = new metrics_1.Rate('errors');
const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 20 / NUM_WORKERS;
exports.options = {
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
function default_1() {
    // 1. Create User
    const userPayload = JSON.stringify({
        initialBalance: 10000,
    });
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const userRes = http_1.default.post(`${BASE_URL}/api/users/create`, userPayload, params);
    const userSuccess = (0, k6_1.check)(userRes, {
        'user created': (r) => r.status === 201,
    });
    if (!userSuccess) {
        errorRate.add(1);
        return;
    }
    const userId = JSON.parse(userRes.body).data.id;
    // 2. Get Profile
    const profileRes = http_1.default.get(`${BASE_URL}/api/users/${userId}`);
    const profileSuccess = (0, k6_1.check)(profileRes, {
        'profile retrieved': (r) => r.status === 200,
        'profile has balance': (r) => {
            const body = JSON.parse(r.body);
            return body.data && body.data.balance !== undefined;
        }
    });
    errorRate.add(!profileSuccess);
}
