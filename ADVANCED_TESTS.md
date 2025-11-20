# Advanced k6 Load Tests - User Profiles & Stress Testing

## Overview

This document describes the advanced k6 load testing scenarios that simulate realistic user behavior profiles and stress test the system under extreme conditions like sudden price spikes.

## User Behavior Profiles Test

**File:** `k6/tests/user-profiles.test.ts`

### User Profiles

The test simulates 6 different user behavior profiles with realistic trading patterns:

#### 1. Holders (20%)
- **Behavior:** Buy and hold strategy
- **Characteristics:**
  - Checks market data occasionally
  - Places buy orders and holds positions for extended periods
  - Minimal trading activity
  - Long sleep intervals (10-30 seconds)
- **Use Case:** Long-term investors

#### 2. Short Traders (10%)
- **Behavior:** Actively going short
- **Characteristics:**
  - Monitors prices frequently
  - Places sell (short) orders
  - Sets stop-loss orders 3% above entry
  - Risk management focused
- **Use Case:** Bearish traders, hedging strategies

#### 3. Multi-Position Traders (30%)
- **Behavior:** Holds multiple positions across different symbols
- **Characteristics:**
  - Opens 2-4 positions simultaneously
  - Diversified across symbols (BTCUSD, ETHUSD, AAPL, etc.)
  - Both buy and sell positions
  - Portfolio management approach
- **Use Case:** Diversified traders, portfolio managers

#### 4. Price Watchers (30%)
- **Behavior:** Requests price data very frequently
- **Characteristics:**
  - Monitors 2-3 symbols intensively
  - Requests prices every 300-500ms
  - Occasionally places orders based on price movements
  - High API load from price requests
- **Use Case:** Day traders, scalpers, algorithmic traders

#### 5. Active Traders (7%)
- **Behavior:** Places orders very frequently
- **Characteristics:**
  - Places new order every 1-2 seconds
  - Uses all order types (market, limit, stop, take-profit)
  - Quick price checks before each order
  - High transaction volume
- **Use Case:** High-frequency traders, market makers

#### 6. Casual Traders (3%)
- **Behavior:** Occasional trading
- **Characteristics:**
  - Infrequent market checks
  - 50% chance to place an order
  - Long intervals between actions
  - Low activity level
- **Use Case:** Retail investors, hobbyists

### Load Profile

```
Stages:
- 0-30s:  Ramp to 50 users
- 30s-1m30s: Ramp to 100 users
- 1m30s-3m30s: Ramp to 150 users
- 3m30s-4m30s: Maintain 150 users
- 4m30s-5m: Ramp down to 0
```

### Custom Metrics

- `orders_placed` - Total orders placed
- `price_requests` - Total price data requests
- `positions_held` - Number of long positions opened
- `short_positions` - Number of short positions opened
- `order_latency` - Order execution latency

### Thresholds

- 95% of requests < 1000ms
- HTTP failure rate < 5%
- Error rate < 5%
- 95% of order executions < 800ms

### Running the Test

```bash
# Build and run
npm run test:k6:build
k6 run k6/dist/user-profiles.test.js

# Or use the test runner
./run-k6-tests.sh profiles
```

## Price Spike Stress Test

**File:** `k6/tests/price-spike-stress.test.ts`

### Scenario Description

This test simulates a sudden large price movement (price spike) and tests how the system handles mass simultaneous order execution when many pending stop/limit orders trigger at once.

### Test Phases

#### Phase 1: Setup Orders (0s - 1m45s)
- **Duration:** 1 minute 45 seconds
- **VUs:** Ramp from 0 → 50 → 100 → 0
- **Activity:**
  - Users create accounts with large balances ($100k-$200k)
  - Place multiple pending orders at various price levels:
    - Stop orders (5-10% above current price)
    - Limit sell orders (3-10% above current price)
    - Take-profit orders (8-13% above current price)
    - Ladder orders at multiple price levels
  - Orders are strategically placed to trigger during the spike

#### Phase 2: Price Spike (1m45s)
- **Duration:** Single iteration
- **VUs:** 1 (whale trader)
- **Activity:**
  - Creates a "whale" account with $10M balance
  - Places 20 massive market buy orders (10+ units each)
  - Simulates sudden price spike
  - Triggers all pending orders simultaneously

#### Phase 3: Monitor Executions (1m50s - 2m20s)
- **Duration:** 30 seconds
- **VUs:** 20 concurrent monitors
- **Activity:**
  - Monitor price during spike
  - Attempt to place orders during high load
  - Track execution latency
  - Measure system performance under stress

### Stress Scenarios Tested

1. **Mass Order Execution**
   - 100+ pending orders triggering simultaneously
   - System must handle concurrent order processing
   - Balance updates for many users at once

2. **High Load During Spike**
   - New orders being placed during spike
   - Price requests during peak load
   - Database/store contention

3. **Latency Under Stress**
   - Order execution times during spike
   - API response times
   - System degradation measurement

### Custom Metrics

- `orders_placed` - Pending orders created
- `orders_triggered` - Orders executed during spike
- `simultaneous_executions` - Orders executed during monitoring phase
- `execution_latency` - Execution time during high load
- `price_spikes` - Number of spike events triggered

### Thresholds

- 95% of requests < 2000ms (higher tolerance during spike)
- HTTP failure rate < 10% (allows for some failures under extreme load)
- Error rate < 10%
- 99% of executions < 3000ms

### Running the Test

```bash
# Build and run
npm run test:k6:build
k6 run k6/dist/price-spike-stress.test.js

# Or use the test runner
./run-k6-tests.sh stress
```

## Test Runner Script

**File:** `run-k6-tests.sh`

### Usage

```bash
./run-k6-tests.sh [suite]
```

### Available Test Suites

#### `basic`
Runs basic load tests:
- User creation
- Market data
- Order placement

#### `advanced`
Runs advanced tests:
- User profiles
- Price spike stress

#### `stress`
Runs stress tests only:
- Price spike stress
- Trading scenario (high load)

#### `profiles`
Runs user profile simulation only

#### `all` (default)
Runs all 6 tests in sequence

### Example Output

```
🧪 k6 Advanced Load Tests
=========================

📦 Building k6 tests...
✅ Build successful!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Running: User Profiles Test
📝 Description: Simulates realistic user behavior profiles
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[k6 output...]

✅ User Profiles Test - PASSED
```

## Performance Expectations

### User Profiles Test

**Expected Metrics:**
- Total orders: 500-1000+
- Price requests: 5000-10000+
- Positions held: 200-400
- Short positions: 50-100
- Average order latency: 50-200ms
- P95 latency: < 800ms

**Profile Distribution (150 users):**
- Holders: ~30 users
- Short Traders: ~15 users
- Multi-Position: ~45 users
- Price Watchers: ~45 users
- Active Traders: ~10 users
- Casual: ~5 users

### Price Spike Stress Test

**Expected Metrics:**
- Pending orders created: 300-500
- Orders triggered during spike: 200-400
- Simultaneous executions: 50-100
- Peak latency: 500-2000ms
- System should handle 100+ concurrent order executions

**Stress Indicators:**
- Response time degradation during spike
- Error rate increase (should stay < 10%)
- Recovery time after spike
- Order execution accuracy

## Best Practices

### Running Tests

1. **Warm-up:** Run a basic test first to warm up the system
2. **Sequential:** Run stress tests one at a time
3. **Monitoring:** Watch server logs during execution
4. **Resources:** Ensure adequate system resources
5. **Isolation:** Run on dedicated test environment

### Interpreting Results

1. **Check Thresholds:** All thresholds should pass
2. **Review Metrics:** Look at custom metrics for insights
3. **Latency Patterns:** Watch for latency spikes
4. **Error Patterns:** Investigate any error clusters
5. **Resource Usage:** Monitor CPU, memory, database

### Tuning

Adjust test parameters in the test files:

```typescript
// User Profiles - Adjust load
stages: [
  { duration: '30s', target: 100 },  // Increase target
  ...
]

// Price Spike - Adjust spike intensity
for (let i = 0; i < 50; i++) {  // More orders = bigger spike
  ...
}
```

## Troubleshooting

### High Error Rates

- Check server capacity
- Review order validation logic
- Check balance calculation accuracy
- Verify concurrent access handling

### Slow Response Times

- Check order monitoring interval (500ms default)
- Review database/store performance
- Check for lock contention
- Monitor CPU usage

### Orders Not Triggering

- Verify price movement simulation
- Check order trigger conditions
- Review order monitoring logic
- Ensure price updates are working

## Future Enhancements

Potential additions to the test suite:

1. **Market Crash Scenario:** Sudden price drop triggering stop-losses
2. **Flash Crash Recovery:** System behavior during rapid price recovery
3. **Whale Manipulation:** Large orders moving the market
4. **Network Latency Simulation:** Delayed order execution
5. **Partial Fill Scenarios:** Orders filling in multiple chunks
6. **Order Cancellation Storm:** Mass order cancellations
7. **API Rate Limiting:** Testing rate limit behavior
8. **Database Failure Simulation:** Resilience testing

## Metrics Dashboard

For production use, consider integrating with:

- **Grafana:** Real-time metrics visualization
- **InfluxDB:** Time-series metrics storage
- **k6 Cloud:** Cloud-based test execution and reporting
- **Prometheus:** Metrics collection and alerting

## Conclusion

These advanced tests provide comprehensive coverage of:
- ✅ Realistic user behavior patterns
- ✅ Extreme load conditions
- ✅ Mass simultaneous order execution
- ✅ System performance under stress
- ✅ Edge cases and failure scenarios

Use these tests to validate system performance, identify bottlenecks, and ensure the trading platform can handle real-world trading conditions.
