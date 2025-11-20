#!/bin/bash

# k6 Advanced Load Tests Runner
# Runs all load tests including user profiles and stress tests

echo " k6 Advanced Load Tests"
echo "========================="
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
    echo " Running: $test_name"
    echo "📝 Description: $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    k6 run "$test_file"
    
    if [ $? -eq 0 ]; then
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
TEST_SUITE=${1:-all}

case $TEST_SUITE in
    basic)
        echo "Running basic load tests..."
        echo ""
        run_test "User Creation Test" \
                 "k6/dist/user-creation.test.js" \
                 "Tests user creation with 10-50 concurrent users"
        
        run_test "Market Data Test" \
                 "k6/dist/market-data.test.js" \
                 "Tests market data retrieval with up to 100 users"
        
        run_test "Order Placement Test" \
                 "k6/dist/order-placement.test.js" \
                 "Tests all order types with realistic scenarios"
        ;;
    
    advanced)
        echo "Running advanced load tests..."
        echo ""
        run_test "User Profiles Test" \
                 "k6/dist/user-profiles.test.js" \
                 "Simulates realistic user behavior profiles (holders, traders, watchers)"
        
        run_test "Price Spike Stress Test" \
                 "k6/dist/price-spike-stress.test.js" \
                 "Tests system under sudden price movements and mass order execution"
        ;;
    
    stress)
        echo "Running stress tests only..."
        echo ""
        run_test "Price Spike Stress Test" \
                 "k6/dist/price-spike-stress.test.js" \
                 "Tests system under sudden price movements and mass order execution"
        
        run_test "Trading Scenario Test" \
                 "k6/dist/trading-scenario.test.js" \
                 "Comprehensive realistic trading with 100+ concurrent users"
        ;;
    
    profiles)
        echo "Running user profile tests only..."
        echo ""
        run_test "User Profiles Test" \
                 "k6/dist/user-profiles.test.js" \
                 "Simulates realistic user behavior profiles"
        ;;
    
    all)
        echo "Running ALL load tests..."
        echo ""
        
        run_test "1. User Creation Test" \
                 "k6/dist/user-creation.test.js" \
                 "Basic user creation load test"
        
        run_test "2. Market Data Test" \
                 "k6/dist/market-data.test.js" \
                 "Market data retrieval performance"
        
        run_test "3. Order Placement Test" \
                 "k6/dist/order-placement.test.js" \
                 "All order types testing"
        
        run_test "4. User Profiles Test" \
                 "k6/dist/user-profiles.test.js" \
                 "Realistic user behavior simulation"
        
        run_test "5. Trading Scenario Test" \
                 "k6/dist/trading-scenario.test.js" \
                 "Comprehensive trading simulation"
        
        run_test "6. Price Spike Stress Test" \
                 "k6/dist/price-spike-stress.test.js" \
                 "Extreme load during price spikes"
        ;;
    
    *)
        echo "Usage: $0 [basic|advanced|stress|profiles|all]"
        echo ""
        echo "Test Suites:"
        echo "  basic    - Run basic load tests (user creation, market data, orders)"
        echo "  advanced - Run advanced tests (user profiles, price spikes)"
        echo "  stress   - Run stress tests only (price spikes, high load scenarios)"
        echo "  profiles - Run user profile simulation only"
        echo "  all      - Run all tests (default)"
        echo ""
        exit 1
        ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Test suite completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
