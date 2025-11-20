# Documentation Index

This directory contains all project documentation organized by topic.

## Quick Links

### Getting Started
- **[SETUP.md](SETUP.md)** - Installation, configuration, and first steps
- **[DOCKER.md](DOCKER.md)** - Running distributed tests with Docker

### API Reference
- **[API.md](API.md)** - Complete API endpoints documentation

### Testing Guides
- **[LOAD_TESTS.md](LOAD_TESTS.md)** - Standard load testing scenarios
- **[STRESS_TESTS.md](STRESS_TESTS.md)** - Stress and extreme testing
- **[PERFORMANCE_TESTS.md](PERFORMANCE_TESTS.md)** - Performance benchmarking
- **[ADVANCED_TESTS.md](ADVANCED_TESTS.md)** - Advanced testing scenarios

### Test Configuration
- **[TEST_VARIANTS_GUIDE.md](TEST_VARIANTS_GUIDE.md)** - VU-based vs RPS-based tests
- **[VU_SCALING_GUIDE.md](VU_SCALING_GUIDE.md)** - Understanding VUs and scaling
- **[TRADING_SCENARIO_CONFIG.md](TRADING_SCENARIO_CONFIG.md)** - Trading scenario details
- **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** - Overall testing strategy

### Reporting
- **[REPORTING.md](REPORTING.md)** - Generating and viewing test reports

## Documentation Structure

```
docs/
├── README.md                      # This file
├── SETUP.md                       # Setup and installation
├── API.md                         # API reference
├── DOCKER.md                      # Docker setup
├── LOAD_TESTS.md                  # Load testing
├── STRESS_TESTS.md                # Stress testing
├── PERFORMANCE_TESTS.md           # Performance testing
├── ADVANCED_TESTS.md              # Advanced scenarios
├── TEST_VARIANTS_GUIDE.md         # Test variants comparison
├── VU_SCALING_GUIDE.md            # VU scaling explained
├── TRADING_SCENARIO_CONFIG.md     # Trading test config
├── TESTING_STRATEGY.md            # Testing strategy
└── REPORTING.md                   # Reporting guide
```

## Common Tasks

### Running Tests

**Distributed (Docker)**:
```bash
./run-distributed-test.sh trading-scenario 10      # VU-based
./run-distributed-test.sh trading-scenario-rps 10  # RPS-based
```

**Local**:
```bash
./run-tests.sh load        # Load tests
./run-tests.sh performance # Performance tests
```

See [SETUP.md](SETUP.md) for details.

### Viewing Results

**Grafana Dashboard**:
```bash
open http://localhost:3001/d/k6-load-testing-enhanced
```

**HTML Reports**:
```bash
./scripts/generate-simple-report.sh trading-scenario
open reports/*/report.html
```

See [REPORTING.md](REPORTING.md) for details.

### Understanding Metrics

- **VUs (Virtual Users)**: Number of concurrent simulated users
- **RPS (Requests Per Second)**: Request throughput
- **Iterations**: Complete test scenario executions
- **Response Time**: API latency (p50, p95, p99)

See [VU_SCALING_GUIDE.md](VU_SCALING_GUIDE.md) for detailed explanations.

## Test Scenarios

### Standard Load Tests
- `user-creation` - User creation endpoint
- `market-data` - Market data retrieval
- `order-placement` - Order placement
- `trading-scenario` - Complete trading flow (VU-based)
- `trading-scenario-rps` - Complete trading flow (RPS-based)
- `user-profiles` - User profile operations

### Performance Tests
- `perf-market-latest` - Market data performance
- `perf-order-market` - Order execution performance
- `perf-user-positions` - Position retrieval performance

### Stress Tests
- `extreme-market-latest` - Extreme market data load
- `extreme-order-market` - Extreme order load
- `extreme-user-positions` - Extreme position queries
- `price-spike-stress` - Price volatility simulation

See [LOAD_TESTS.md](LOAD_TESTS.md), [PERFORMANCE_TESTS.md](PERFORMANCE_TESTS.md), and [STRESS_TESTS.md](STRESS_TESTS.md) for details.

## Need Help?

1. **Setup Issues**: See [SETUP.md](SETUP.md)
2. **Docker Problems**: See [DOCKER.md](DOCKER.md)
3. **Understanding VUs**: See [VU_SCALING_GUIDE.md](VU_SCALING_GUIDE.md)
4. **Choosing Test Type**: See [TEST_VARIANTS_GUIDE.md](TEST_VARIANTS_GUIDE.md)
5. **API Questions**: See [API.md](API.md)

## Contributing

When adding new documentation:
1. Create the `.md` file in this directory
2. Add it to this index
3. Update the main [README.md](../README.md) if it's a major document
4. Use clear headings and code examples
5. Include links to related documents
