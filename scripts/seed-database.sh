#!/bin/sh

# ============================================================================
# Database Seeding Script for Performance Tests
# ============================================================================
# Creates test data (users, orders, positions) for performance testing
# This script runs inside the k6 Docker container
# ============================================================================

echo ""
echo " Seeding Database for Performance Tests"
echo "=========================================="
echo ""

API_URL="${BASE_URL:-http://api:3000}"
NUM_USERS=100

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Users to create: $NUM_USERS"
echo ""

# Check if API is accessible
echo "Checking API health..."
if ! wget -q -O- "$API_URL/health" > /dev/null 2>&1; then
    echo " Error: API is not accessible at $API_URL"
    exit 1
fi
echo " API is healthy"
echo ""

echo "Creating $NUM_USERS users with orders..."
echo ""

CREATED_USERS=0
CREATED_ORDERS=0

for i in $(seq 1 $NUM_USERS); do
    # Create user with random balance
    BALANCE=$((50000 + RANDOM % 150000))
    
    USER_RESPONSE=$(wget -q -O- --post-data="{\"initialBalance\": $BALANCE}" \
        --header="Content-Type: application/json" \
        "$API_URL/api/users/create" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Extract user ID (simple JSON parsing)
        USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        if [ ! -z "$USER_ID" ]; then
            CREATED_USERS=$((CREATED_USERS + 1))
            
            # Create a market order for this user
            ORDER_RESPONSE=$(wget -q -O- --post-data="{\"userId\": \"$USER_ID\", \"symbol\": \"BTCUSD\", \"side\": \"buy\", \"quantity\": 0.1}" \
                --header="Content-Type: application/json" \
                "$API_URL/api/orders/market" 2>/dev/null)
            
            if [ $? -eq 0 ]; then
                CREATED_ORDERS=$((CREATED_ORDERS + 1))
            fi
            
            # Progress indicator
            if [ $((i % 10)) -eq 0 ]; then
                echo "  Progress: $i/$NUM_USERS users created..."
            fi
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Database Seeding Completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  ✓ Users created: $CREATED_USERS"
echo "  ✓ Orders placed: $CREATED_ORDERS"
echo "  ✓ Positions opened: $CREATED_ORDERS"
echo ""
echo "Ready for performance tests!"
echo ""
