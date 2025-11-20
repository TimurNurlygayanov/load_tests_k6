# Trading Scenario Test - Configuration Summary

## Current Configuration

### Test Parameters
- **Total VUs**: 1000 (distributed across workers)
- **RPS per VU**: ~1 request per second (controlled by `sleep(1)`)
- **Total RPS**: ~1000 requests per second
- **Executor**: `ramping-vus` (gradual ramp-up)

### Ramp-Up Profile

```
VUs
1000 ┤         ┌─────────────────┐
     │        ╱                   ╲
 500 ┤      ╱                       ╲
     │    ╱                           ╲
   0 ┼──┴─────────────────────────────┴──
     0   2m              7m            8m
     
     Stage 1: 0 → 1000 VUs (2 minutes)
     Stage 2: 1000 VUs constant (5 minutes)
     Stage 3: 1000 → 0 VUs (1 minute)
```

### How It Works

1. **Gradual Ramp-Up**: VUs increase linearly from 0 to 1000 over 2 minutes
   - At 30s: ~250 VUs
   - At 1m: ~500 VUs
   - At 1m30s: ~750 VUs
   - At 2m: 1000 VUs

2. **Steady State**: Maintains 1000 VUs for 5 minutes

3. **Ramp-Down**: Decreases from 1000 to 0 VUs over 1 minute

### Request Rate Control

Each VU executes this flow **once per second**:
1. Create User (~1ms)
2. Place Order (~1ms)
3. Check Position (~1ms)
4. **Sleep 1 second** ← Ensures max 1 iteration/second per VU

**Total**: 3 HTTP requests per iteration, 1 iteration per second per VU

### Expected Metrics

With 1000 VUs at steady state:
- **HTTP Requests**: ~3000 req/s (3 requests per iteration × 1000 VUs)
- **Iterations**: ~1000 iter/s
- **Users Created**: ~1000 users/s
- **Orders Placed**: ~1000 orders/s

> **Note**: The dashboard shows "Current RPS" which is HTTP requests, not iterations. With 3 HTTP requests per iteration, 1000 VUs will generate ~3000 RPS.

## Running the Test

### With 10 Workers (Recommended)
```bash
./run-distributed-test.sh trading-scenario 10
```

Each worker handles: 1000 / 10 = **100 VUs**

### With 20 Workers (High Distribution)
```bash
./run-distributed-test.sh trading-scenario 20
```

Each worker handles: 1000 / 20 = **50 VUs**

### With 5 Workers (Medium Distribution)
```bash
./run-distributed-test.sh trading-scenario 5
```

Each worker handles: 1000 / 5 = **200 VUs**

## Monitoring in Grafana

### Enhanced Dashboard
URL: http://localhost:3001/d/k6-load-testing-enhanced

### Key Metrics to Watch

| Panel | Expected Value | What It Means |
|-------|----------------|---------------|
| **Active VUs** | 0 → 1000 → 0 | Gradual ramp-up visible |
| **Current RPS** | ~3000 req/s | 3 HTTP requests per VU iteration |
| **Error Rate** | 0% | All requests successful |
| **Avg Response Time** | 1-2ms | API performance |

### Timeline

```
Time    VUs    RPS      Status
────────────────────────────────
0:00    0      0        Starting
0:30    250    ~750     Ramping up
1:00    500    ~1500    Ramping up
1:30    750    ~2250    Ramping up
2:00    1000   ~3000    Steady state
7:00    1000   ~3000    Steady state
7:30    500    ~1500    Ramping down
8:00    0      0        Complete
```

## Adjusting the Configuration

### Change Ramp-Up Duration

Edit `k6/tests/trading-scenario.test.ts`:

```typescript
stages: [
    { duration: '5m', target: VUS_PER_WORKER },   // Slower ramp: 5 minutes
    { duration: '10m', target: VUS_PER_WORKER },  // Longer hold: 10 minutes
    { duration: '2m', target: 0 },                // Slower ramp-down: 2 minutes
]
```

### Change Request Rate per VU

Modify the `sleep()` duration:

```typescript
sleep(2);  // 0.5 requests per second per VU (1000 VUs = 500 RPS)
sleep(0.5);  // 2 requests per second per VU (1000 VUs = 2000 RPS)
```

### Change Total VUs

```typescript
const VUS_PER_WORKER = 2000 / NUM_WORKERS;  // 2000 total VUs
```

## Summary

✅ **Gradual ramp-up**: 0 → 1000 VUs over 2 minutes  
✅ **Rate limiting**: Each VU does max 1 iteration/second  
✅ **Predictable load**: ~3000 HTTP req/s at steady state  
✅ **Distributed**: Scales across multiple workers  

This configuration provides a realistic, controlled load test that gradually increases to your target of 1000 active users.
