# k6 Testing Strategy - Load, Stress, and Performance Tests

## Test Categories

### 1. Load Tests
**Purpose:** Validate system behavior under expected normal and peak load conditions.

**Characteristics:**
- Simulates realistic user behavior
- Gradual ramp-up and ramp-down
- **Strict thresholds: 0% error rate**
- Tests normal business operations
- Duration: 2-5 minutes

**Thresholds:**
```javascript
thresholds: {
  http_req_failed: ['rate==0'],      // 0% failures - STRICT
  http_req_duration: ['p(95)<500'],  // 95% under 500ms
  http_req_duration: ['p(99)<1000'], // 99% under 1s
}
```

**Tests:**
- `user-creation.test.ts` - User creation load
- `market-data.test.ts` - Market data retrieval
- `order-placement.test.ts` - Order placement
- `trading-scenario.test.ts` - Realistic trading

---

### 2. Stress Tests
**Purpose:** Test system limits and behavior under extreme conditions.

**Characteristics:**
- Pushes system beyond normal capacity
- Tests breaking points
- **Relaxed thresholds: 1-10% error rate allowed**
- Sudden load spikes
- Duration: 2-5 minutes

**Thresholds:**
```javascript
thresholds: {
  http_req_failed: ['rate<0.01'],    // < 1% failures for moderate stress
  http_req_failed: ['rate<0.10'],    // < 10% failures for extreme stress
  http_req_duration: ['p(95)<2000'], // Higher latency tolerance
  http_req_duration: ['p(99)<5000'],
}
```

**Tests:**
- `user-profiles.test.ts` - Mixed user behavior (1% threshold)
- `price-spike-stress.test.ts` - Extreme load spike (10% threshold)

---

### 3. Performance Tests
**Purpose:** Measure detailed performance metrics for each endpoint under sustained load.

**Characteristics:**
- **Constant high RPS (1000 RPS per endpoint)**
- Pre-seeded database with realistic data
- Long duration (10 minutes)
- **Strict thresholds: 0% error rate**
- Detailed percentile metrics (p50, p90, p95, p99, min, max)
- Isolated endpoint testing

**Thresholds:**
```javascript
thresholds: {
  http_req_failed: ['rate==0'],           // 0% failures - STRICT
  http_req_duration: ['p(50)<100'],       // Median under 100ms
  http_req_duration: ['p(90)<200'],       // 90th percentile
  http_req_duration: ['p(95)<300'],       // 95th percentile
  http_req_duration: ['p(99)<500'],       // 99th percentile
  http_req_duration: ['max<2000'],        // Max response time
}
```

**Tests:**
- `perf-user-creation.test.ts` - User creation endpoint
- `perf-market-latest.test.ts` - Latest price endpoint
- `perf-market-candles.test.ts` - Historical candles endpoint
- `perf-order-market.test.ts` - Market order endpoint
- `perf-order-limit.test.ts` - Limit order endpoint
- `perf-user-positions.test.ts` - User positions endpoint
- `perf-user-balance.test.ts` - User balance endpoint

---

## Quick Reference

| Test Type | Error Threshold | Duration | RPS | Purpose |
|-----------|----------------|----------|-----|---------|
| **Load** | 0% (strict) | 2-5 min | Variable (ramp) | Normal operations |
| **Stress** | 1-10% (relaxed) | 2-5 min | Variable (spike) | Breaking points |
| **Performance** | 0% (strict) | 10 min | 1000 (constant) | Detailed metrics |

## Running Tests

### Load Tests
```bash
./run-tests.sh load
```

### Stress Tests
```bash
./run-tests.sh stress
```

### Performance Tests
```bash
# Seed database first
./seed-database.sh

# Run all performance tests
./run-tests.sh performance

# Run specific endpoint test
k6 run k6/dist/perf-market-latest.test.js
```

## Metrics Explained

### Response Time Percentiles

- **p50 (Median):** 50% of requests are faster than this
- **p90:** 90% of requests are faster than this
- **p95:** 95% of requests are faster than this (SLA target)
- **p99:** 99% of requests are faster than this (outlier detection)
- **min:** Fastest request
- **max:** Slowest request

### Example Output

```
http_req_duration..............: avg=85ms  min=12ms med=75ms max=450ms p(90)=150ms p(95)=200ms p(99)=350ms
http_req_failed................: 0.00%  ✓ 0  ✗ 600000
http_reqs......................: 600000  1000/s
```

This means:
- Average response: 85ms
- Fastest: 12ms
- Median: 75ms
- Slowest: 450ms
- 90% under 150ms
- 95% under 200ms
- 99% under 350ms
- Zero failures
- 1000 requests per second sustained

## Best Practices

### Load Testing
1. Start with load tests to establish baseline
2. Run during different times of day
3. Test with realistic user patterns
4. Monitor resource usage
5. All requests must succeed (0% error rate)

### Stress Testing
1. Run after load tests pass
2. Identify system limits
3. Test recovery behavior
4. Some failures are expected (1-10%)
5. Monitor for cascading failures

### Performance Testing
1. Seed database with realistic data first
2. Run for extended duration (10+ minutes)
3. Focus on one endpoint at a time
4. Collect detailed metrics
5. Zero failures expected
6. Compare results over time

## Interpreting Results

### Load Test Results
✅ **PASS:** 0% errors, all thresholds met
❌ **FAIL:** Any errors or threshold violations
→ **Action:** Fix issues before moving to stress tests

### Stress Test Results
✅ **PASS:** < 1-10% errors (depending on test), system recovers
⚠️ **WARNING:** Errors within threshold but high
❌ **FAIL:** Errors exceed threshold or system crashes
→ **Action:** Identify bottlenecks, optimize

### Performance Test Results
✅ **PASS:** 0% errors, all percentiles within targets
⚠️ **WARNING:** 0% errors but high latency
❌ **FAIL:** Any errors or percentile violations
→ **Action:** Optimize slow endpoints, investigate outliers

## Continuous Monitoring

Recommended schedule:
- **Load tests:** Every deployment
- **Stress tests:** Weekly
- **Performance tests:** Before major releases

Track metrics over time to detect:
- Performance degradation
- Capacity changes
- Regression issues
