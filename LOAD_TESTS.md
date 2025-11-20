# Load Tests

Tests for normal operations with realistic user behavior.

## Overview

**Purpose:** Validate system behavior under expected load  
**Threshold:** 0% error rate (strict)  
**Duration:** 2-5 minutes per test

## Running Load Tests

```bash
# Build tests
npm run test:k6:build

# Run all load tests
./run-tests.sh load

# Run individual test
k6 run k6/dist/user-creation.test.js
```

## Test Suite

### 1. User Creation Test

**File:** `k6/tests/user-creation.test.ts`

**Load Profile:**
- 0-10s: Ramp to 10 users
- 10-40s: Ramp to 50 users
- 40-60s: Stay at 50 users
- 60-70s: Ramp down

**Thresholds:**
- 95% requests < 500ms
- 99% requests < 1000ms
- 0% error rate

**What it tests:**
- User creation endpoint
- Balance initialization
- Response validation

---

### 2. Market Data Test

**File:** `k6/tests/market-data.test.ts`

**Load Profile:**
- Ramp to 100 concurrent users
- Tests all market endpoints

**Thresholds:**
- 95% requests < 300ms
- 0% error rate

**What it tests:**
- Symbol list retrieval
- Latest price fetching
- Historical candle data
- Multiple symbols concurrently

---

### 3. Order Placement Test

**File:** `k6/tests/order-placement.test.ts`

**Load Profile:**
- Ramp to 100 concurrent users
- All order types

**Thresholds:**
- 95% requests < 500ms
- 0% error rate

**What it tests:**
- Market orders
- Limit orders
- Stop orders
- Take-profit orders
- Order validation
- Balance deduction

---

### 4. Trading Scenario Test

**File:** `k6/tests/trading-scenario.test.ts`

**Load Profile:**
- Ramp to 100 concurrent traders
- Realistic trading patterns

**Thresholds:**
- 95% requests < 800ms
- 0% error rate
- 100+ orders placed

**What it tests:**
- Complete user lifecycle
- Mixed order strategies
- Position management
- Balance tracking
- Concurrent trading

## Expected Results

### Success Criteria

✅ All thresholds met  
✅ 0% HTTP errors  
✅ Response times within limits  
✅ All validations pass

### Metrics to Watch

- **http_req_duration** - Response times
- **http_req_failed** - Error rate (must be 0%)
- **http_reqs** - Total requests
- **vus** - Virtual users

### Example Output

```
✓ http_req_duration..............: avg=125ms min=45ms med=110ms max=480ms p(95)=280ms
✓ http_req_failed................: 0.00%  ✓ 0  ✗ 5000
✓ http_reqs......................: 5000   83.33/s
  vus..............................: 50     min=10 max=50
```

## Interpreting Results

### ✅ PASS
- All thresholds green
- 0% errors
- System handles expected load

**Action:** Proceed to stress tests

### ❌ FAIL
- Any threshold violations
- Any HTTP errors
- Timeouts or crashes

**Action:** 
1. Check server logs
2. Review error messages
3. Fix issues before stress testing

## Common Issues

### High Response Times

**Cause:** Server overloaded or slow database

**Solution:**
- Optimize slow endpoints
- Add caching
- Increase server resources

### Intermittent Errors

**Cause:** Race conditions or validation issues

**Solution:**
- Check concurrent access handling
- Review validation logic
- Add proper error handling

### Memory Leaks

**Cause:** Resources not released

**Solution:**
- Monitor server memory
- Check for unclosed connections
- Review cleanup code

## Best Practices

1. **Run load tests first** - Before stress/performance
2. **Baseline metrics** - Record results for comparison
3. **Consistent environment** - Same hardware/config
4. **Monitor resources** - CPU, memory, network
5. **Fix all failures** - 0% error rate is mandatory

## Next Steps

After passing load tests:
- Run [STRESS_TESTS.md](STRESS_TESTS.md) to find limits
- Run [PERFORMANCE_TESTS.md](PERFORMANCE_TESTS.md) for detailed metrics
