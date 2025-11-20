# Setup & Configuration Guide

Complete guide to setting up and running the trading platform and tests.

## Prerequisites

- **Node.js** 18+ and npm
- **k6** - [Install k6](https://k6.io/docs/getting-started/installation/)
- **curl** (for testing)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build TypeScript

```bash
# Build API server
npm run build

# Build k6 tests
npm run test:k6:build
```

## Running the API Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### Production Mode

```bash
npm run build
npm start
```

### Verify Server is Running

```bash
curl http://localhost:3000/health
```

Expected response: `{"status":"ok","timestamp":"..."}`

## Running Tests

### Test Categories

| Category | Command | Description |
|----------|---------|-------------|
| **Load** | `./run-tests.sh load` | Normal operations (0% errors) |
| **Stress** | `./run-tests.sh stress` | System limits (1-10% errors) |
| **Performance** | `./run-tests.sh performance` | 1000 RPS metrics (0% errors) |
| **All** | `./run-tests.sh all` | Run everything |

### Load Tests

```bash
# Build tests
npm run test:k6:build

# Run load tests
./run-tests.sh load
```

**Duration:** 2-5 minutes  
**Threshold:** 0% error rate (strict)

### Stress Tests

```bash
./run-tests.sh stress
```

**Duration:** 2-5 minutes  
**Threshold:** 1-10% error rate (relaxed)

### Performance Tests

Performance tests require database seeding:

```bash
# 1. Seed database with test data
./seed-database.sh

# 2. Run performance tests
./run-tests.sh performance
```

**Duration:** 10 minutes per endpoint  
**RPS:** 1000 requests/second  
**Threshold:** 0% error rate (strict)

## Running Individual Tests

```bash
# Build first
npm run test:k6:build

# Run specific test
k6 run k6/dist/user-creation.test.js
k6 run k6/dist/perf-market-latest.test.js
```

## Configuration

### Environment Variables

```bash
# Set custom API URL for tests
export BASE_URL=http://localhost:3000

# Run test
k6 run k6/dist/user-creation.test.js
```

### Server Port

Edit `src/server.ts`:

```typescript
const PORT = process.env.PORT || 3000;
```

Then:

```bash
PORT=8080 npm run dev
```

## Troubleshooting

### Server Won't Start

**Issue:** Port already in use

**Solution:**
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### k6 Tests Fail to Build

**Issue:** TypeScript compilation errors

**Solution:**
```bash
# Clean and rebuild
rm -rf k6/dist
npm run test:k6:build
```

### Performance Tests Fail

**Issue:** Database not seeded

**Solution:**
```bash
# Ensure server is running
npm run dev

# Seed database
./seed-database.sh

# Run tests
./run-tests.sh performance
```

### High Error Rates

**Issue:** Server overloaded

**Solution:**
- Reduce test VUs (virtual users)
- Increase server resources
- Check server logs for errors

## Development Workflow

### 1. Make Code Changes

Edit files in `src/` or `k6/tests/`

### 2. Rebuild

```bash
# API changes
npm run build

# Test changes
npm run test:k6:build
```

### 3. Test Locally

```bash
# Start server
npm run dev

# Run tests
./run-tests.sh load
```

### 4. Verify

Check test results and server logs.

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `run-tests.sh` | Run test suites |
| `seed-database.sh` | Seed test data |
| `test-api.sh` | Manual API testing |

## Next Steps

- Read [API.md](API.md) for endpoint documentation
- See [LOAD_TESTS.md](LOAD_TESTS.md) for load testing details
- Check [PERFORMANCE_TESTS.md](PERFORMANCE_TESTS.md) for performance metrics
