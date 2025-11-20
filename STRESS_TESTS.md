# Stress Tests

Tests for system limits and extreme conditions.

## Overview

**Purpose:** Find breaking points and test recovery  
**Threshold:** 1-10% error rate (relaxed)  
**Duration:** 2-5 minutes per test

## Running Stress Tests

```bash
# Run all stress tests
./run-tests.sh stress

# Run individual test
k6 run k6/dist/user-profiles.test.js
k6 run k6/dist/price-spike-stress.test.js
```

## Test Suite

### 1. User Profiles Stress Test

**File:** `k6/tests/user-profiles.test.ts`

**Load Profile:**
- Ramp to 150 concurrent users
- Mixed behavior patterns

**Thresholds:**
- 95% requests < 1000ms
- 99% requests < 2000ms
- **< 1% error rate**

**User Profiles:**
- 20% Holders - Buy and hold
- 10% Short Traders - Going short
- 30% Multi-Position - Multiple positions
- 30% Price Watchers - Frequent price checks (300ms intervals)
- 7% Active Traders - Order every second
- 3% Casual - Occasional trading

**What it tests:**
- Realistic user behavior
- Mixed load patterns
- Concurrent operations
- System under sustained load

---

### 2. Price Spike Stress Test

**File:** `k6/tests/price-spike-stress.test.ts`

**Load Profile:**
- Phase 1: 100 users place pending orders
- Phase 2: Whale triggers price spike
- Phase 3: 20 users monitor during spike

**Thresholds:**
- 95% requests < 2000ms
- 99% requests < 5000ms
- **< 10% error rate**

**What it tests:**
- Mass simultaneous order execution
- 100+ orders triggering at once
- System under extreme spike
- Recovery after spike
- Order execution accuracy

**Scenario:**
1. Users place stop/limit orders at various prices
2. Whale places massive buy orders
3. Price spikes, triggering all pending orders
4. System processes simultaneous executions
5. Monitors track performance during spike

## Expected Results

### Success Criteria

✅ Error rate within threshold (1-10%)  
✅ System doesn't crash  
✅ Response times acceptable  
✅ System recovers after spike

### Metrics to Watch

- **http_req_failed** - Error rate (< 1-10%)
- **http_req_duration** - Response times (higher tolerance)
- **orders_placed** - Total orders created
- **orders_triggered** - Orders executed during spike
- **simultaneous_executions** - Concurrent executions

### Example Output

```
✓ http_req_duration..............: avg=450ms min=80ms med=320ms max=1850ms p(95)=980ms
✓ http_req_failed................: 0.85%  ✓ 43  ✗ 5000
✓ orders_placed..................: 523
✓ orders_triggered...............: 287
  simultaneous_executions.........: 156
```

## Interpreting Results

### ✅ PASS
- Errors within threshold
- No crashes or hangs
- System recovers
- Acceptable degradation

**Insights:**
- System capacity identified
- Breaking points known
- Recovery behavior validated

### ⚠️ WARNING
- Errors at upper threshold limit
- Slow recovery
- High latency spikes

**Action:**
- Optimize bottlenecks
- Improve error handling
- Add circuit breakers

### ❌ FAIL
- Errors exceed threshold
- System crashes
- No recovery
- Data corruption

**Action:**
- Critical fixes needed
- Review architecture
- Add resilience patterns

## Common Issues

### Cascading Failures

**Symptom:** Errors spread across system

**Solution:**
- Implement circuit breakers
- Add request timeouts
- Isolate failures

### Resource Exhaustion

**Symptom:** Memory/CPU maxed out

**Solution:**
- Optimize resource usage
- Add rate limiting
- Scale horizontally

### Slow Recovery

**Symptom:** System slow after spike

**Solution:**
- Improve cleanup
- Add health checks
- Optimize background tasks

## Stress Testing Strategy

### 1. Gradual Increase
Start with lower load, increase gradually

### 2. Monitor Resources
Watch CPU, memory, connections

### 3. Identify Limits
Note when errors start appearing

### 4. Test Recovery
Verify system returns to normal

### 5. Document Findings
Record capacity limits and bottlenecks

## User Profile Behavior

### Holders (20%)
- Infrequent trading
- Long hold periods
- Low API load

### Short Traders (10%)
- Active short positions
- Stop-loss orders
- Medium API load

### Multi-Position (30%)
- 2-4 concurrent positions
- Diversified symbols
- High order volume

### Price Watchers (30%)
- Price requests every 300ms
- **Highest API load**
- Occasional orders

### Active Traders (7%)
- New order every 1-2 seconds
- All order types
- Very high transaction rate

### Casual (3%)
- Sporadic activity
- Minimal load

## Price Spike Mechanics

### Setup Phase
- 100 users create pending orders
- Orders at 5-10% above current price
- Multiple order types (stop, limit, take-profit)

### Spike Phase
- Whale places 20 massive buy orders
- Price increases rapidly
- Pending orders trigger

### Monitor Phase
- Track execution during spike
- Measure latency under load
- Verify order accuracy

---

## Extreme Stress Tests (1M RPS)

### Overview

**Purpose:** Test absolute system limits with extreme load  
**Load:** 1,000,000 requests per second  
**Duration:** 1 minute  
**Threshold:** < 50% error rate

⚠️ **Warning:** These tests will likely overwhelm most systems. They are designed to find the absolute breaking point.

### 3. Extreme Market Latest Stress

**File:** `k6/tests/extreme-market-latest.test.ts`

**Load:** 1M RPS for 60 seconds

**Thresholds:**
- p50 < 5000ms
- p95 < 10000ms
- < 50% error rate

**What it tests:**
- Absolute maximum throughput
- System behavior under extreme load
- Error handling at scale
- Resource exhaustion scenarios

---

### 4. Extreme Market Order Stress

**File:** `k6/tests/extreme-order-market.test.ts`

**Load:** 1M RPS for 60 seconds

**Thresholds:**
- p50 < 5000ms
- p95 < 10000ms
- < 50% error rate

**What it tests:**
- Order processing at extreme scale
- Database write performance limits
- Balance update concurrency
- Transaction handling under pressure

---

### 5. Extreme User Positions Stress

**File:** `k6/tests/extreme-user-positions.test.ts`

**Load:** 1M RPS for 60 seconds

**Thresholds:**
- p50 < 5000ms
- p95 < 10000ms
- < 50% error rate

**What it tests:**
- Read performance at extreme scale
- Data aggregation limits
- Cache effectiveness
- Query optimization

### Running Extreme Tests

```bash
# Build tests
npm run test:k6:build

# Run individual extreme test
k6 run k6/dist/extreme-market-latest.test.js
k6 run k6/dist/extreme-order-market.test.js
k6 run k6/dist/extreme-user-positions.test.js

# Or use test runner
./run-tests.sh extreme
```

### Expected Extreme Test Results

**Realistic Expectations:**

Most systems will NOT handle 1M RPS. Expected outcomes:

✅ **Good Performance:**
- Error rate: 10-30%
- Median response: 500-2000ms
- System recovers after test

⚠️ **Acceptable:**
- Error rate: 30-50%
- Median response: 2000-5000ms
- Slow recovery

❌ **System Overwhelmed:**
- Error rate: > 50%
- Median response: > 5000ms
- System crashes or hangs

### Metrics to Track

**Error Rate:**
- < 10%: Excellent
- 10-30%: Good
- 30-50%: Acceptable
- \> 50%: System overwhelmed

**Response Times:**
- Median (p50): Typical response time
- p95: 95th percentile
- Max: Worst-case response

**Example Output:**

```
http_req_duration:
  avg=2.3s  min=45ms  med=1.8s  max=9.5s
  p(50)=1800ms  p(95)=7200ms

http_req_failed: 23.5%  ✓ 14100000  ✗ 45900000
http_reqs......: 60000000  1000000/s
errors.........: 23.5%

response_time:
  avg=2300ms  min=45ms  med=1800ms  max=9500ms
```

**Interpretation:**
- ✅ Sustained 1M RPS for 60 seconds
- ✅ 23.5% error rate (under 50% threshold)
- ✅ Median 1.8s (under 5s threshold)
- ⚠️ p95 at 7.2s (high but acceptable)
- 📊 60 million total requests processed

## Best Practices

1. **Run after load tests pass**
2. **Monitor server closely**
3. **Some failures expected**
4. **Document capacity limits**
5. **Test recovery behavior**

## Next Steps

After stress tests:
- Optimize identified bottlenecks
- Run [PERFORMANCE_TESTS.md](PERFORMANCE_TESTS.md) for detailed metrics
- Document system capacity limits
