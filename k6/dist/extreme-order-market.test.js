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

/***/ 749:
/***/ ((module) => {

module.exports = require("k6");

/***/ }),

/***/ 993:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/**
 * Extreme Stress Test: Market Order Endpoint
 * 1 Million RPS for 1 minute
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
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// Custom metrics
const errorRate = new metrics_1.Rate('errors');
const responseTime = new metrics_1.Trend('response_time');
exports.options = {
    scenarios: {
        extreme_load: {
            executor: 'constant-arrival-rate',
            rate: 1000000, // 1 MILLION RPS
            timeUnit: '1s',
            duration: '1m', // 1 minute
            preAllocatedVUs: 1000,
            maxVUs: 10000,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.50'], // Allow up to 50% errors
        http_req_duration: [
            'p(50)<5000', // Median under 5s
            'p(95)<10000', // 95th percentile under 10s
        ],
        errors: ['rate<0.50'],
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL'];
// Setup: Create test users
function setup() {
    const users = [];
    const params = { headers: { 'Content-Type': 'application/json' } };
    // Create 100 users for extreme testing
    for (let i = 0; i < 100; i++) {
        const response = http_1.default.post(`${BASE_URL}/api/users/create`, JSON.stringify({ initialBalance: 10000000 }), // $10M balance
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
    const userId = data.users[Math.floor(Math.random() * data.users.length)];
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.random() * 0.1 + 0.01;
    const start = Date.now();
    const response = http_1.default.post(`${BASE_URL}/api/orders/market`, JSON.stringify({ userId, symbol, side, quantity }), params);
    const duration = Date.now() - start;
    responseTime.add(duration);
    const success = (0, k6_1.check)(response, {
        'status is 201': (r) => r.status === 201,
    });
    if (!success) {
        errorRate.add(1);
    }
}


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
/******/ 	var __webpack_exports__ = __webpack_require__(993);
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;