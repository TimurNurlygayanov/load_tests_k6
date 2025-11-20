#!/bin/bash

# ============================================================================
# Distributed Load Test Runner
# ============================================================================
# Runs k6 tests in a distributed Docker environment
# Usage: ./run-distributed-test.sh [TEST_NAME | SUITE_NAME]
# ============================================================================

# Function to run a single test
run_test() {
    local TEST_NAME=$1
    
    echo "============================================================================"
    echo " Running Test: $TEST_NAME"
    echo "============================================================================"

    # Check if test file exists
    if [ ! -f "k6/dist/$TEST_NAME.test.js" ]; then
        echo "Error: Test file 'k6/dist/$TEST_NAME.test.js' not found!"
        echo "Available tests:"
        ls k6/dist/*.test.js | sed 's|k6/dist/||g' | sed 's|.test.js||g'
        return 1
    fi

    # Determine scaling based on test type
    local NUM_WORKERS
    if [[ "$TEST_NAME" == *"extreme"* ]] || [[ "$TEST_NAME" == *"stress"* ]]; then
        NUM_WORKERS=6
        echo "🔥 Detected STRESS/EXTREME test. Scaling to $NUM_WORKERS workers."
    elif [[ "$TEST_NAME" == *"perf"* ]]; then
        NUM_WORKERS=4
        echo "⚡ Detected PERFORMANCE test. Scaling to $NUM_WORKERS workers."
    else
        NUM_WORKERS=2
        echo "📊 Detected STANDARD load test. Scaling to $NUM_WORKERS workers."
    fi

    # Seed database if needed
    if [[ "$TEST_NAME" == *"order"* ]] || [[ "$TEST_NAME" == *"trading"* ]] || [[ "$TEST_NAME" == *"positions"* ]]; then
        echo "🌱 Seeding database for $TEST_NAME..."
        docker-compose up seeder
    fi

    # Create docker-compose override for the test
    echo "Configuring workers for test: $TEST_NAME"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    REPORT_DIR="reports/$TEST_NAME-$TIMESTAMP"
    mkdir -p "$REPORT_DIR"

    cat > docker-compose.override.yml << EOF
services:
  k6-worker:
    environment:
      - NUM_WORKERS=$NUM_WORKERS
    volumes:
      - ./reports:/scripts/reports
    command: >
      run
      --out influxdb=http://influxdb:8086/k6
      --summary-export=/scripts/$REPORT_DIR/summary.json
      --tag test=$TEST_NAME
      /scripts/${TEST_NAME}.test.js
EOF

    echo "Report will be saved to: $REPORT_DIR/summary.json"

    echo ""
    echo " Starting $NUM_WORKERS k6 workers..."
    echo " Monitor progress at: http://localhost:3001"
    echo ""

    # Run the test with scaled workers
    # Use --abort-on-container-exit so when one finishes, they all stop
    docker-compose up --scale k6-worker=$NUM_WORKERS --abort-on-container-exit k6-worker
    
    echo ""
    echo "✅ Test $TEST_NAME completed."
    echo "----------------------------------------------------------------------------"
}

# Main execution logic
INPUT_ARG=$1

if [ -z "$INPUT_ARG" ]; then
    echo "Usage: $0 [TEST_NAME | SUITE_NAME]"
    echo ""
    echo "Available Suites:"
    echo "  load         - Run standard load tests"
    echo "  performance  - Run performance tests (perf-*)"
    echo "  stress       - Run stress/extreme tests (extreme-*, price-spike-stress)"
    echo "  all          - Run ALL tests"
    echo ""
    echo "Available Tests:"
    ls k6/dist/*.test.js | sed 's|k6/dist/||g' | sed 's|.test.js||g'
    exit 1
fi

# Ensure infrastructure is running
echo "Checking infrastructure..."
if ! docker-compose ps | grep -q "trading-api"; then
    echo "Starting infrastructure..."
    docker-compose up -d api influxdb grafana
    echo "Waiting for services to be ready..."
    sleep 10
fi

# Define test suites
TESTS_TO_RUN=""

case "$INPUT_ARG" in
    "load")
        TESTS_TO_RUN="user-creation market-data order-placement trading-scenario user-profiles"
        ;;
    "performance")
        TESTS_TO_RUN="perf-market-latest perf-order-market perf-user-positions"
        ;;
    "stress")
        TESTS_TO_RUN="price-spike-stress extreme-market-latest extreme-order-market extreme-user-positions"
        ;;
    "all")
        TESTS_TO_RUN="user-creation market-data order-placement trading-scenario user-profiles perf-market-latest perf-order-market perf-user-positions price-spike-stress extreme-market-latest extreme-order-market extreme-user-positions"
        ;;
    *)
        # Assume it's a single test name
        TESTS_TO_RUN="$INPUT_ARG"
        ;;
esac

echo "🚀 Starting Test Execution Suite: $INPUT_ARG"
echo "Tests to run: $TESTS_TO_RUN"
echo ""

# Loop through tests
for TEST in $TESTS_TO_RUN; do
    run_test $TEST
    
    # Small pause between tests to let connections drain
    if [ "$TEST" != "${TESTS_TO_RUN##* }" ]; then
        echo "Cooling down for 10 seconds..."
        sleep 10
    fi
done

echo "🎉 All tests in suite '$INPUT_ARG' completed!"
