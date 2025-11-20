/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 127:
/***/ ((module) => {

module.exports = require("k6/metrics");

/***/ }),

/***/ 375:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/**
 * k6 Load Test: Trading Scenario
 * Simulates a complete trading flow: Create User -> Place Order -> Check Position
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.options = void 0;
exports["default"] = default_1;
const http_1 = __importDefault(__webpack_require__(570));
const k6_1 = __webpack_require__(749);
const metrics_1 = __webpack_require__(127);
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// Custom metrics
const errorRate = new metrics_1.Rate('errors');
const usersCreated = new metrics_1.Counter('users_created');
const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 100 / NUM_WORKERS;
exports.options = {
    scenarios: {
        ramping_rps: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 100,
            maxVUs: 2000,
            stages: [
                { duration: '2m', target: TARGET_RPS }, // Linear ramp up
                { duration: '5m', target: TARGET_RPS }, // Stable load
                { duration: '1m', target: 0 }, // Ramp down
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.01'], // Allow up to 1% failure
        errors: ['rate<0.01'], // Allow up to 1% errors
    },
};
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'AAPL', 'GOOGL', 'TSLA'];
function default_1() {
    // 1. Create User
    const userPayload = JSON.stringify({
        initialBalance: 50000,
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
    const orderRes = http_1.default.post(`${BASE_URL}/api/orders`, orderPayload, params);
    const orderSuccess = (0, k6_1.check)(orderRes, {
        'order placed': (r) => r.status === 201,
    });
    if (!orderSuccess) {
        errorRate.add(1);
        return;
    }
    // 3. Check Position
    const positionRes = http_1.default.get(`${BASE_URL}/api/users/${userId}/positions`);
    const positionSuccess = (0, k6_1.check)(positionRes, {
        'positions retrieved': (r) => r.status === 200,
        'position exists': (r) => {
            const body = JSON.parse(r.body);
            return body.data && body.data.some((p) => p.symbol === symbol);
        }
    });
    errorRate.add(!positionSuccess);
}


/***/ }),

/***/ 570:
/***/ ((module) => {

module.exports = require("k6/http");

/***/ }),

/***/ 749:
/***/ ((module) => {

module.exports = require("k6");

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
/******/ 	var __webpack_exports__ = __webpack_require__(375);
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;