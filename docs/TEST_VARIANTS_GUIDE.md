# Trading Scenario Test Variants

## Overview

We now have **two variants** of the trading scenario test, each optimized for different testing goals:

1. **`trading-scenario`** - VU-based (Virtual Users)
2. **`trading-scenario-rps`** - RPS-based (Requests Per Second)

---

## 1. VU-Based Test (`trading-scenario`)

### Purpose
Simulate a **specific number of concurrent users** (e.g., 1000 users) with controlled request rate.

### Executor
`ramping-vus` - Gradually ramps up virtual users

### Configuration
```typescript
const VUS_PER_WORKER = 1000 / NUM_WORKERS;

executor: 'ramping-vus'
stages: [
    { duration: '2m', target: VUS_PER_WORKER },   // Ramp to 1000 VUs
    { duration: '15m', target: VUS_PER_WORKER },  // Hold 1000 VUs
    { duration: '1m', target: 0 },                // Ramp down
]
```

### Rate Control
Each VU executes **exactly 1 iteration per second** using dynamic sleep:
```typescript
const elapsed = (Date.now() - iterationStart) / 1000;
const sleepTime = Math.max(0, 1 - elapsed);
sleep(sleepTime);
```

### Expected Metrics
- **VUs**: 1000 (visible in dashboard)
- **Iterations/sec**: ~1000
- **HTTP Requests/sec**: ~3000 (3 requests per iteration)

### Use Cases
- **Capacity testing**: "Can my system handle 1000 concurrent users?"
- **User experience**: "What's the response time with 1000 active users?"
- **Realistic simulation**: Models actual user behavior with think time

### Run Command
```bash
./run-distributed-test.sh trading-scenario 10
```

---

## 2. RPS-Based Test (`trading-scenario-rps`)

### Purpose
Generate a **specific request rate** (e.g., 1000 RPS) regardless of how many VUs are needed.

### Executor
`ramping-arrival-rate` - Gradually ramps up request rate

### Configuration
```typescript
const TARGET_RPS = 1000 / NUM_WORKERS;

executor: 'ramping-arrival-rate'
stages: [
    { duration: '2m', target: TARGET_RPS },    // Ramp to 1000 RPS
    { duration: '15m', target: TARGET_RPS },   // Hold 1000 RPS
    { duration: '1m', target: 0 },             // Ramp down
]
```

### Rate Control
k6 **automatically allocates VUs** to achieve target RPS. No sleep needed.

### Expected Metrics
- **VUs**: Variable (depends on API response time)
  - With 1ms response: ~3-10 VUs
  - With 100ms response: ~100-300 VUs
- **Iterations/sec**: 1000
- **HTTP Requests/sec**: ~3000 (3 requests per iteration)

### Use Cases
- **Throughput testing**: "Can my API handle 1000 requests per second?"
- **Performance benchmarking**: "What's the max RPS before degradation?"
- **SLA validation**: "Does the API maintain <100ms at 1000 RPS?"

### Run Command
```bash
./run-distributed-test.sh trading-scenario-rps 10
```

---

## Comparison

| Aspect | VU-Based | RPS-Based |
|--------|----------|-----------|
| **Primary Control** | Number of users | Request rate |
| **VU Count** | Fixed (1000) | Variable (auto) |
| **RPS** | Variable (~1000) | Fixed (1000) |
| **Sleep** | Yes (`1 - elapsed`) | No |
| **Dashboard VUs** | Always shows 1000 | May show 0-100 |
| **Best For** | User simulation | Throughput testing |

---

## Detailed Ramp-Up Profiles

### VU-Based Ramp-Up

```
VUs
1000 ┤         ┌──────────────────────────┐
     │        ╱                            ╲
 500 ┤      ╱                                ╲
     │    ╱                                    ╲
   0 ┼──┴──────────────────────────────────────┴──
     0   2m                17m                18m
```

**Timeline**:
- 0:00 → 2:00: Ramp from 0 to 1000 VUs
- 2:00 → 17:00: Hold at 1000 VUs
- 17:00 → 18:00: Ramp down to 0 VUs

### RPS-Based Ramp-Up

```
RPS
1000 ┤         ┌──────────────────────────┐
     │        ╱                            ╲
 500 ┤      ╱                                ╲
     │    ╱                                    ╲
   0 ┼──┴──────────────────────────────────────┴──
     0   2m                17m                18m
```

**Timeline**:
- 0:00 → 2:00: Ramp from 0 to 1000 iterations/sec
- 2:00 → 17:00: Hold at 1000 iterations/sec
- 17:00 → 18:00: Ramp down to 0 iterations/sec

---

## Adjusting Parameters

### Change Target VUs (VU-Based)

Edit `k6/tests/trading-scenario.test.ts`:
```typescript
const VUS_PER_WORKER = 2000 / NUM_WORKERS;  // 2000 total VUs
```

### Change Target RPS (RPS-Based)

Edit `k6/tests/trading-scenario-rps.test.ts`:
```typescript
const TARGET_RPS = 5000 / NUM_WORKERS;  // 5000 total RPS
```

### Change Ramp Duration (Both)

```typescript
stages: [
    { duration: '5m', target: TARGET },    // Slower ramp: 5 minutes
    { duration: '30m', target: TARGET },   // Longer hold: 30 minutes
    { duration: '2m', target: 0 },         // Slower ramp-down: 2 minutes
]
```

---

## When to Use Which Test

### Use VU-Based When:
- ✅ You want to simulate **real user behavior**
- ✅ You need to see **exact VU count** in dashboard
- ✅ You're testing **user experience** under load
- ✅ You want **predictable, steady load**
- ✅ You're doing **capacity planning** (e.g., "how many users can we support?")

### Use RPS-Based When:
- ✅ You want to test **maximum throughput**
- ✅ You need **precise request rate** control
- ✅ You're validating **SLA requirements** (e.g., "handle 10k RPS")
- ✅ You want to **stress test** the API
- ✅ You don't care about VU count, only performance

---

## Running Both Tests

### Sequential Execution
```bash
# Run VU-based test
./run-distributed-test.sh trading-scenario 10

# Wait for cooldown
sleep 30

# Run RPS-based test
./run-distributed-test.sh trading-scenario-rps 10
```

### Compare Results
Both tests generate similar load (~1000 iterations/sec, ~3000 HTTP req/sec) but use different approaches:
- **VU-based**: Shows how the system handles concurrent users
- **RPS-based**: Shows how the system handles request throughput

---

## Monitoring in Grafana

### VU-Based Test Dashboard
- **Active VUs**: Shows 1000 (green indicator)
- **Current RPS**: ~3000 req/s
- **Iterations**: ~1000 iter/s

### RPS-Based Test Dashboard
- **Active VUs**: Shows 10-100 (may appear as "No Test Running")
- **Current RPS**: ~3000 req/s (same as VU-based)
- **Iterations**: ~1000 iter/s (same as VU-based)

> **Tip**: For RPS-based tests, focus on **Current RPS** and **HTTP Requests per Second** panels, not the VU count.

---

## Summary

✅ **VU-Based** (`trading-scenario`): Fixed 1000 VUs, ~1 iteration/sec per VU  
✅ **RPS-Based** (`trading-scenario-rps`): Fixed 1000 iterations/sec, variable VUs  
✅ **Both**: Gradual ramp-up, 18-minute duration, same trading flow  
✅ **Flexibility**: Choose based on testing goals (user simulation vs throughput)  

Use both tests to get a complete picture of your system's performance!
