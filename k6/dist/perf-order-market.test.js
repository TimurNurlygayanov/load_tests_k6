/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 127:
/***/ ((module) => {

module.exports = require("k6/metrics");

/***/ }),

/***/ 570:
/***/ ((module) => {

module.exports = require("k6/http");

/***/ }),

/***/ 670:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/**
 * Performance Test: Market Order Endpoint
 * Constant 1000 RPS for 10 minutes with pre-seeded users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.options = void 0;
exports.setup = setup;
exports["default"] = default_1;
const http_1 = __importDefault(__webpack_require__(570));
const k6_1 = __webpack_require__(749);
const metrics_1 = __webpack_require__(127);
const data_1 = __webpack_require__(834);
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// Custom metrics
const errorRate = new metrics_1.Rate('errors');
// Load pre-seeded user IDs
const userIds = new data_1.SharedArray('users', function () {
    // In real scenario, load from file or create users in setup
    // For now, we'll create users on the fly
    return [];
});
exports.options = {
    scenarios: {
        ramping_load: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 200,
            stages: [
                { duration: '2m', target: 500 }, // Ramp to 500 RPS over 2 minutes
                { duration: '8m', target: 500 }, // Hold 500 RPS for 8 minutes
                { duration: '1m', target: 0 }, // Ramp down
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate==0'], // STRICT: 0% error rate
        http_req_duration: [
            'p(50)<150', // Median under 150ms
            'p(90)<300', // 90th percentile under 300ms
            'p(95)<400', // 95th percentile under 400ms
            'p(99)<800', // 99th percentile under 800ms
            'max<3000', // Max response time under 3s
        ],
        errors: ['rate==0'],
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL'];
// Setup: Create test users
function setup() {
    const users = [];
    const params = { headers: { 'Content-Type': 'application/json' } };
    // Create 50 users for testing
    for (let i = 0; i < 50; i++) {
        const response = http_1.default.post(`${BASE_URL}/api/users/create`, JSON.stringify({ initialBalance: 1000000 }), // $1M balance
        params);
        if (response.status === 201) {
            const body = JSON.parse(response.body);
            users.push(body.data.id);
        }
    }
    return { users };
}
function default_1(data) {
    const params = { headers: { 'Content-Type': 'application/json' } };
    // Use pre-created user
    const userId = data.users[Math.floor(Math.random() * data.users.length)];
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.random() * 0.5 + 0.01;
    const response = http_1.default.post(`${BASE_URL}/api/orders/market`, JSON.stringify({
        userId,
        symbol,
        side,
        quantity,
    }), params);
    const success = (0, k6_1.check)(response, {
        'status is 201': (r) => r.status === 201,
        'order filled': (r) => {
            const body = JSON.parse(r.body);
            return body.success === true && body.data && body.data.status === 'filled';
        },
    });
    if (!success) {
        errorRate.add(1);
    }
}


/***/ }),

/***/ 749:
/***/ ((module) => {

module.exports = require("k6");

/***/ }),

/***/ 834:
/***/ ((module) => {

module.exports = require("k6/data");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(670);
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;