# Performance Tests

Detailed performance metrics with constant high load.

## Overview

**Purpose:** Measure detailed performance metrics per endpoint  
**Threshold:** 0% error rate (strict)  
**Duration:** 10 minutes per test  
**RPS:** 1000 requests/second (constant)

## Prerequisites

Performance tests require database seeding:

```bash
# 1. Start API server
npm run dev

# 2. Seed database
./seed-database.sh

# 3. Run performance tests
./run-tests.sh performance
```

## Running Performance Tests

```bash
# Run all performance tests
./run-tests.sh performance

# Run individual test
k6 run k6/dist/perf-market-latest.test.js
```

## Test Suite

### 1. Market Latest Price Performance

**File:** `k6/tests/perf-market-latest.test.ts`

**Load:** 1000 RPS for 10 minutes

**Thresholds:**
- p50 (median) < 100ms
- p90 < 200ms
- p95 < 300ms
- p99 < 500ms
- max < 2000ms
- 0% error rate

**What it measures:**
- GET `/api/market/latest/:symbol`
- Response time distribution
- System stability under constant load
- Resource usage over time

---

### 2. Market Order Performance

**File:** `k6/tests/perf-order-market.test.ts`

**Load:** 1000 RPS for 10 minutes

**Thresholds:**
- p50 < 150ms
- p90 < 300ms
- p95 < 400ms
- p99 < 800ms
- max < 3000ms
- 0% error rate

**What it measures:**
- POST `/api/orders/market`
- Order execution time
- Balance update performance
- Position creation speed

---

### 3. User Positions Performance

**File:** `k6/tests/perf-user-positions.test.ts`

**Load:** 1000 RPS for 10 minutes

**Thresholds:**
- p50 < 100ms
- p90 < 200ms
- p95 < 300ms
- p99 < 500ms
- max < 2000ms
- 0% error rate

**What it measures:**
- GET `/api/users/:id/positions`
- Position retrieval speed
- P&L calculation performance
- Data aggregation efficiency

## Understanding Metrics

### Percentiles Explained

| Metric | Meaning | Example |
|--------|---------|---------|
| **p50 (median)** | 50% of requests faster | 85ms |
| **p90** | 90% of requests faster | 150ms |
| **p95** | 95% of requests faster | 200ms |
| **p99** | 99% of requests faster | 350ms |
| **min** | Fastest request | 12ms |
| **max** | Slowest request | 450ms |
| **avg** | Average response time | 95ms |

### Example Output

```
http_req_duration:
  avg=85ms  min=12ms  med=75ms  max=450ms
  p(90)=150ms  p(95)=200ms  p(99)=350ms

http_req_failed: 0.00%  ✓ 0  ✗ 600000
http_reqs......: 600000  1000/s
```

**Interpretation:**
- ✅ Median 75ms (target: <100ms)
- ✅ 95th percentile 200ms (target: <300ms)
- ✅ 99th percentile 350ms (target: <500ms)
- ✅ Zero failures
- ✅ Sustained 1000 RPS

## Database Seeding

The `seed-database.sh` script creates:
- 100 test users
- 1000 orders (mixed types)
- Realistic positions
- User IDs saved to `/tmp/k6_test_user_ids.txt`

**Why seeding is needed:**
- Realistic data volume
- Consistent test conditions
- Avoid cold start effects
- Test with existing data

## Expected Results

### Success Criteria

✅ All percentile thresholds met  
✅ 0% error rate  
✅ Sustained 1000 RPS  
✅ Stable performance over 10 minutes

### Performance Targets

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| Market Latest | <100ms | <300ms | <500ms |
| Market Order | <150ms | <400ms | <800ms |
| User Positions | <100ms | <300ms | <500ms |

### Red Flags

⚠️ **Increasing latency** - Performance degrading over time  
⚠️ **High p99** - Outliers indicate issues  
⚠️ **Any errors** - Should be 0%  
⚠️ **RPS drops** - System can't sustain load

## Interpreting Results

### ✅ EXCELLENT (All targets met)

```
p50: 75ms   (target: <100ms)
p95: 180ms  (target: <300ms)
p99: 320ms  (target: <500ms)
errors: 0%
```

**Meaning:** System performs well under load

---

### ⚠️ ACCEPTABLE (Within thresholds but high)

```
p50: 95ms   (target: <100ms)
p95: 280ms  (target: <300ms)
p99: 480ms  (target: <500ms)
errors: 0%
```

**Meaning:** Performance acceptable but room for optimization

---

### ❌ NEEDS OPTIMIZATION

```
p50: 120ms  (target: <100ms) ❌
p95: 350ms  (target: <300ms) ❌
p99: 650ms  (target: <500ms) ❌
errors: 0%
```

**Action:** Optimize slow endpoints

---

### ❌ CRITICAL ISSUES

```
p99: 2500ms
errors: 2.3%
RPS: 750 (target: 1000)
```

**Action:** Critical fixes needed

## Optimization Tips

### High p50 (Median Slow)

**Cause:** General slowness

**Solutions:**
- Add caching
- Optimize database queries
- Reduce computation
- Use connection pooling

### High p99 (Outliers)

**Cause:** Occasional slow requests

**Solutions:**
- Identify slow queries
- Add timeouts
- Optimize worst-case scenarios
- Check garbage collection

### Increasing Latency Over Time

**Cause:** Memory leak or resource exhaustion

**Solutions:**
- Monitor memory usage
- Check for leaks
- Optimize cleanup
- Add resource limits

### Can't Sustain RPS

**Cause:** System overloaded

**Solutions:**
- Scale horizontally
- Optimize bottlenecks
- Add load balancing
- Increase resources

## Monitoring During Tests

### Server Metrics to Watch

- **CPU usage** - Should stay < 80%
- **Memory** - Should be stable
- **Network** - Check bandwidth
- **Connections** - Monitor active connections

### k6 Metrics to Watch

- **http_req_duration** - Response times
- **http_req_failed** - Error rate
- **http_reqs** - Request rate
- **vus** - Virtual users needed

## Comparing Results

Track metrics over time:

| Date | Endpoint | p50 | p95 | p99 | Errors |
|------|----------|-----|-----|-----|--------|
| 2024-11-19 | market-latest | 75ms | 200ms | 350ms | 0% |
| 2024-11-20 | market-latest | 78ms | 205ms | 360ms | 0% |

**Look for:**
- Performance regression
- Improvements from optimizations
- Trends over time

## Best Practices

1. **Seed database first** - Consistent test data
2. **Run for full duration** - 10 minutes minimum
3. **Monitor resources** - Watch server metrics
4. **Compare results** - Track over time
5. **Optimize iteratively** - Focus on worst performers

## Next Steps

After performance tests:
- Optimize endpoints exceeding thresholds
- Document baseline metrics
- Set up continuous monitoring
- Create performance budgets
