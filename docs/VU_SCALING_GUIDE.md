# Understanding VUs vs RPS in k6 Load Tests

## The Issue

When running `./run-distributed-test.sh trading-scenario 10`, you expected to see 1000 VUs but only saw 1 VU in the dashboard.

## Root Causes

### 1. Script Didn't Accept Worker Count Parameter

**Before**: The script ignored the second parameter (`10`)
**After**: The script now accepts an optional `WORKER_COUNT` parameter

**Fixed Usage**:
```bash
./run-distributed-test.sh trading-scenario 10  # Runs with 10 workers
```

### 2. VUs ≠ Workers (Understanding k6 Executors)

The `trading-scenario` test uses the **`ramping-arrival-rate` executor**, which controls **iterations per second (RPS)**, not VUs directly.

#### How It Works:

```typescript
export const options = {
    scenarios: {
        ramping_rps: {
            executor: 'ramping-arrival-rate',  // ← Controls RPS, not VUs
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 100,              // ← Pre-allocated pool
            maxVUs: 2000,                       // ← Maximum allowed
            stages: [
                { duration: '2m', target: TARGET_RPS },  // ← Target RPS per worker
                { duration: '5m', target: TARGET_RPS },
                { duration: '1m', target: 0 },
            ],
        },
    },
};
```

**Key Points**:
- `TARGET_RPS = 100 / NUM_WORKERS` (50 RPS per worker with 2 workers)
- k6 automatically allocates **only as many VUs as needed** to achieve the target RPS
- If your API is fast (1-5ms response time), k6 only needs **1-2 VUs** to achieve 50 RPS

#### The Math:

```
VUs needed = (Target RPS × Avg Response Time) / 1000

Example with 50 RPS and 2ms response time:
VUs = (50 × 2) / 1000 = 0.1 VUs ≈ 1 VU
```

## How to Get More VUs

### Option 1: Increase Target RPS (Recommended)

Modify the test to target higher RPS:

```typescript
const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 1000 / NUM_WORKERS;  // ← Change from 100 to 1000
```

With 10 workers and 1000 total RPS:
- Each worker targets 100 RPS
- With 2ms response time: ~20 VUs per worker
- **Total: ~200 VUs across all workers**

### Option 2: Use Constant VU Executor

For tests where you want a specific number of VUs regardless of RPS:

```typescript
export const options = {
    scenarios: {
        constant_vus: {
            executor: 'constant-vus',
            vus: 100,              // ← Exactly 100 VUs
            duration: '5m',
        },
    },
};
```

### Option 3: Use Ramping VUs Executor

For gradually increasing VU count:

```typescript
export const options = {
    scenarios: {
        ramping_vus: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 100 },   // Ramp to 100 VUs
                { duration: '5m', target: 100 },   // Hold at 100 VUs
                { duration: '1m', target: 0 },     // Ramp down
            ],
        },
    },
};
```

## Current Test Configuration

### Trading Scenario Test

**File**: `k6/tests/trading-scenario.test.ts`

**Current Settings**:
- Executor: `ramping-arrival-rate`
- Target RPS: `100 / NUM_WORKERS`
- Pre-allocated VUs: 100
- Max VUs: 2000

**With 2 Workers** (default):
- Target: 50 RPS per worker = **100 RPS total**
- Actual VUs: ~1-2 per worker = **2-4 VUs total**

**With 10 Workers**:
- Target: 10 RPS per worker = **100 RPS total**
- Actual VUs: ~1 per worker = **~10 VUs total**

> **Note**: More workers doesn't mean more load! It just distributes the same 100 RPS across more workers.

## How to Scale to 1000 VUs

### Step 1: Modify the Test

Edit `k6/tests/trading-scenario.test.ts`:

```typescript
const NUM_WORKERS = parseInt(__ENV.NUM_WORKERS || '1');
const TARGET_RPS = 5000 / NUM_WORKERS;  // ← 5000 RPS total
```

### Step 2: Rebuild the Test

```bash
cd k6
npm run build
cd ..
```

### Step 3: Run with 10 Workers

```bash
./run-distributed-test.sh trading-scenario 10
```

**Expected Results**:
- 10 workers × 500 RPS each = **5000 RPS total**
- With 2ms response time: ~100 VUs per worker
- **Total: ~1000 VUs**

## Monitoring VUs in Grafana

### Enhanced Dashboard

The enhanced dashboard shows:
- **Active VUs** - Current number of virtual users
- **Current RPS** - Actual requests per second
- **Total Requests** - Cumulative count

**URL**: http://localhost:3001/d/k6-load-testing-enhanced

### Understanding the Metrics

| Metric | What It Means |
|--------|---------------|
| VUs = 1 | k6 only needs 1 VU to achieve target RPS |
| RPS = 50 | Actual load on the API |
| Requests = 30,000 | Total requests sent during test |

**Important**: RPS is the actual load, VUs is just the mechanism to achieve it.

## Quick Reference

### Run with Default Workers
```bash
./run-distributed-test.sh trading-scenario
# Uses 2 workers (auto-detected for standard tests)
```

### Run with Custom Workers
```bash
./run-distributed-test.sh trading-scenario 10
# Uses 10 workers
```

### Run Different Test Types
```bash
./run-distributed-test.sh user-creation 5      # 5 workers
./run-distributed-test.sh load                 # Run all load tests
./run-distributed-test.sh performance 8        # Performance tests with 8 workers
```

## Summary

✅ **Fixed**: Script now accepts worker count parameter  
✅ **Explained**: VUs are auto-calculated based on RPS and response time  
✅ **Solution**: To get 1000 VUs, increase TARGET_RPS to ~5000 (with 2ms response time)  

**Key Takeaway**: In `ramping-arrival-rate` executor, VUs are a means to an end (achieving target RPS), not the goal itself. If you want to control VUs directly, use `constant-vus` or `ramping-vus` executor instead.
