#!/bin/bash

# k6 Test Runner - Load, Stress, and Performance Tests
# Organized by test category with proper thresholds

echo " k6 Test Runner"
echo "================="
echo ""

# Build tests first
echo "📦 Building k6 tests..."
npm run test:k6:build
echo ""

# Check if build was successful
if [ $? -ne 0 ]; then
    echo " Build failed. Please fix errors and try again."
    exit 1
fi

echo " Build successful!"
echo ""

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    local description=$3
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " $test_name"
    echo "📝 $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Create reports directory
    REPORT_DIR="reports/$(date +%Y%m%d-%H%M%S)-$(basename $test_file .test.js)"
    mkdir -p "$REPORT_DIR"
    
    # Run k6 test with JSON output
    k6 run --out json="$REPORT_DIR/results.json" "$test_file"
    TEST_EXIT_CODE=$?
    
    # Generate HTML report
    if [ -f "$REPORT_DIR/results.json" ]; then
        echo ""
        echo " Generating HTML report..."
        node generate-html-report.js "$REPORT_DIR/results.json" "$REPORT_DIR/report.html"
        
        if [ -f "$REPORT_DIR/report.html" ]; then
            echo " HTML report: $REPORT_DIR/report.html"
            
            # Open report in browser (macOS)
            if command -v open &> /dev/null; then
                open "$REPORT_DIR/report.html"
            fi
        fi
    fi
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo ""
        echo " $test_name - PASSED"
    else
        echo ""
        echo " $test_name - FAILED"
    fi
    echo ""
    echo ""
}

# Parse command line arguments
TEST_SUITE=${1:-help}

case $TEST_SUITE in
    load)
        echo " LOAD TESTS - Normal Operations (0% Error Threshold)"
        echo "Testing system under expected load conditions"
        echo ""
        
        run_test "User Creation Load Test" \
                 "k6/dist/user-creation.test.js" \
                 "Tests user creation with gradual ramp-up (10→50 users)"
        
        run_test "Market Data Load Test" \
                 "k6/dist/market-data.test.js" \
                 "Tests market data retrieval (up to 100 users)"
        
        run_test "Order Placement Load Test" \
                 "k6/dist/order-placement.test.js" \
                 "Tests all order types with realistic scenarios"
        
        run_test "Trading Scenario Load Test" \
                 "k6/dist/trading-scenario.test.js" \
                 "Comprehensive realistic trading (100+ users)"
        ;;
    
    stress)
        echo " STRESS TESTS - System Limits (1-10% Error Threshold)"
        echo "Testing system under extreme conditions"
        echo ""
        
        run_test "User Profiles Stress Test" \
                 "k6/dist/user-profiles.test.js" \
                 "Mixed user behavior profiles (150 users, 1% error threshold)"
        
        run_test "Price Spike Stress Test" \
                 "k6/dist/price-spike-stress.test.js" \
                 "Extreme load during price spike (10% error threshold)"
        ;;
    
    extreme)
        echo " EXTREME STRESS TESTS - Absolute Limits (50% Error Threshold)"
        echo "1 MILLION RPS for 1 minute per endpoint"
        echo ""
        echo "⚠️  WARNING: These tests will likely overwhelm the system!"
        echo ""
        
        run_test "Extreme Market Latest Stress" \
                 "k6/dist/extreme-market-latest.test.js" \
                 "1M RPS for 60 seconds - GET /api/market/latest/:symbol"
        
        run_test "Extreme Market Order Stress" \
                 "k6/dist/extreme-order-market.test.js" \
                 "1M RPS for 60 seconds - POST /api/orders/market"
        
        run_test "Extreme User Positions Stress" \
                 "k6/dist/extreme-user-positions.test.js" \
                 "1M RPS for 60 seconds - GET /api/users/:id/positions"
        ;;
    
    performance)
        echo " PERFORMANCE TESTS - Detailed Metrics (0% Error Threshold)"
        echo "Constant 1000 RPS for 10 minutes per endpoint"
        echo ""
        
        # Check if database is seeded
        if [ ! -f "/tmp/k6_test_user_ids.txt" ]; then
            echo "⚠️  Database not seeded. Running seed script..."
            ./seed-database.sh
            echo ""
        fi
        
        run_test "Market Latest Price Performance" \
                 "k6/dist/perf-market-latest.test.js" \
                 "1000 RPS for 10 minutes - GET /api/market/latest/:symbol"
        
        run_test "Market Order Performance" \
                 "k6/dist/perf-order-market.test.js" \
                 "1000 RPS for 10 minutes - POST /api/orders/market"
        
        run_test "User Positions Performance" \
                 "k6/dist/perf-user-positions.test.js" \
                 "1000 RPS for 10 minutes - GET /api/users/:id/positions"
        ;;
    
    all)
        echo " Running ALL tests (Load → Stress → Performance)"
        echo ""
        
        echo "═══════════════════════════════════════════════════"
        echo "PHASE 1: LOAD TESTS"
        echo "═══════════════════════════════════════════════════"
        $0 load
        
        echo ""
        echo "═══════════════════════════════════════════════════"
        echo "PHASE 2: STRESS TESTS"
        echo "═══════════════════════════════════════════════════"
        $0 stress
        
        echo ""
        echo "═══════════════════════════════════════════════════"
        echo "PHASE 3: PERFORMANCE TESTS"
        echo "═══════════════════════════════════════════════════"
        $0 performance
        ;;
    
    help|*)
        echo "Usage: $0 [load|stress|extreme|performance|all]"
        echo ""
        echo "Test Categories:"
        echo ""
        echo "   load        - Load Tests (0% error threshold)"
        echo "                   Tests normal operations with realistic load"
        echo "                   Duration: 2-5 minutes"
        echo "                   Tests: user-creation, market-data, order-placement, trading-scenario"
        echo ""
        echo "   stress      - Stress Tests (1-10% error threshold)"
        echo "                   Tests system limits and extreme conditions"
        echo "                   Duration: 2-5 minutes"
        echo "                   Tests: user-profiles (1%), price-spike (10%)"
        echo ""
        echo "   extreme     - Extreme Stress Tests (50% error threshold)"
        echo "                   1 MILLION RPS for 1 minute per endpoint"
        echo "                   ⚠️  WARNING: Will likely overwhelm the system!"
        echo "                   Tests: extreme-market-latest, extreme-order-market, extreme-user-positions"
        echo ""
        echo "   performance - Performance Tests (0% error threshold)"
        echo "                   Constant 1000 RPS for detailed metrics"
        echo "                   Duration: 10 minutes per test"
        echo "                   Tests: perf-market-latest, perf-order-market, perf-user-positions"
        echo "                   Note: Requires database seeding (./seed-database.sh)"
        echo ""
        echo "   all         - Run all tests sequentially (excludes extreme)"
        echo ""
        echo "Examples:"
        echo "  $0 load              # Run load tests only"
        echo "  $0 stress            # Run stress tests only"
        echo "  $0 extreme           # Run extreme stress tests (1M RPS)"
        echo "  $0 performance       # Run performance tests (seeds DB if needed)"
        echo "  $0 all               # Run everything except extreme tests"
        echo ""
        echo "Test Thresholds:"
        echo "  Load Tests:        0% errors (strict)"
        echo "  Stress Tests:      1-10% errors (relaxed)"
        echo "  Extreme Tests:     50% errors (very relaxed)"
        echo "  Performance Tests: 0% errors (strict)"
        echo ""
        exit 0
        ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Test suite completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
