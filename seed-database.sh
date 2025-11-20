#!/bin/bash

# Database Seeding Script for Performance Tests
# Seeds the API with realistic data before running performance tests

echo " Seeding Database for Performance Tests"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Check if server is running
echo "Checking if API server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo " Error: API server is not running at $BASE_URL"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo " API server is running"
echo ""

# Configuration
NUM_USERS=100
NUM_ORDERS_PER_USER=10
SYMBOLS=("BTCUSD" "ETHUSD" "AAPL" "GOOGL" "TSLA")

echo " Seeding Configuration:"
echo "  - Users: $NUM_USERS"
echo "  - Orders per user: $NUM_ORDERS_PER_USER"
echo "  - Total orders: $((NUM_USERS * NUM_ORDERS_PER_USER))"
echo ""

# Arrays to store created user IDs
USER_IDS=()

# Create users
echo "👥 Creating $NUM_USERS users..."
for i in $(seq 1 $NUM_USERS); do
    BALANCE=$((50000 + RANDOM % 150000))  # Random balance between 50k-200k
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/create" \
        -H "Content-Type: application/json" \
        -d "{\"initialBalance\": $BALANCE}")
    
    USER_ID=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    
    if [ -n "$USER_ID" ]; then
        USER_IDS+=("$USER_ID")
        if [ $((i % 10)) -eq 0 ]; then
            echo "  Created $i users..."
        fi
    else
        echo "  ⚠️  Failed to create user $i"
    fi
done

echo " Created ${#USER_IDS[@]} users"
echo ""

# Create orders for each user
echo "📝 Creating orders..."
TOTAL_ORDERS=0

for USER_ID in "${USER_IDS[@]}"; do
    for j in $(seq 1 $NUM_ORDERS_PER_USER); do
        # Random symbol
        SYMBOL=${SYMBOLS[$RANDOM % ${#SYMBOLS[@]}]}
        
        # Random order type (60% market, 20% limit, 10% stop, 10% take-profit)
        RAND=$((RANDOM % 100))
        
        if [ $RAND -lt 60 ]; then
            # Market order
            SIDE=$( [ $((RANDOM % 2)) -eq 0 ] && echo "buy" || echo "sell" )
            QUANTITY=$(echo "scale=2; ($RANDOM % 100 + 1) / 100" | bc)
            
            curl -s -X POST "$BASE_URL/api/orders/market" \
                -H "Content-Type: application/json" \
                -d "{\"userId\": \"$USER_ID\", \"symbol\": \"$SYMBOL\", \"side\": \"$SIDE\", \"quantity\": $QUANTITY}" \
                > /dev/null
                
        elif [ $RAND -lt 80 ]; then
            # Limit order
            SIDE=$( [ $((RANDOM % 2)) -eq 0 ] && echo "buy" || echo "sell" )
            QUANTITY=$(echo "scale=2; ($RANDOM % 100 + 1) / 100" | bc)
            PRICE=$((40000 + RANDOM % 10000))  # Random price
            
            curl -s -X POST "$BASE_URL/api/orders/limit" \
                -H "Content-Type: application/json" \
                -d "{\"userId\": \"$USER_ID\", \"symbol\": \"$SYMBOL\", \"side\": \"$SIDE\", \"quantity\": $QUANTITY, \"price\": $PRICE}" \
                > /dev/null
                
        elif [ $RAND -lt 90 ]; then
            # Stop order
            SIDE=$( [ $((RANDOM % 2)) -eq 0 ] && echo "buy" || echo "sell" )
            QUANTITY=$(echo "scale=2; ($RANDOM % 100 + 1) / 100" | bc)
            STOP_PRICE=$((40000 + RANDOM % 10000))
            
            curl -s -X POST "$BASE_URL/api/orders/stop" \
                -H "Content-Type: application/json" \
                -d "{\"userId\": \"$USER_ID\", \"symbol\": \"$SYMBOL\", \"side\": \"$SIDE\", \"quantity\": $QUANTITY, \"stopPrice\": $STOP_PRICE}" \
                > /dev/null
        else
            # Take-profit order
            SIDE=$( [ $((RANDOM % 2)) -eq 0 ] && echo "sell" || echo "buy" )
            QUANTITY=$(echo "scale=2; ($RANDOM % 100 + 1) / 100" | bc)
            TP_PRICE=$((40000 + RANDOM % 10000))
            
            curl -s -X POST "$BASE_URL/api/orders/take-profit" \
                -H "Content-Type: application/json" \
                -d "{\"userId\": \"$USER_ID\", \"symbol\": \"$SYMBOL\", \"side\": \"$SIDE\", \"quantity\": $QUANTITY, \"stopPrice\": $TP_PRICE}" \
                > /dev/null
        fi
        
        TOTAL_ORDERS=$((TOTAL_ORDERS + 1))
    done
    
    if [ $((TOTAL_ORDERS % 100)) -eq 0 ]; then
        echo "  Created $TOTAL_ORDERS orders..."
    fi
done

echo " Created $TOTAL_ORDERS orders"
echo ""

# Save user IDs to file for performance tests
echo "💾 Saving user IDs for performance tests..."
printf '%s\n' "${USER_IDS[@]}" > /tmp/k6_test_user_ids.txt
echo " Saved ${#USER_IDS[@]} user IDs to /tmp/k6_test_user_ids.txt"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Database seeding completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " Summary:"
echo "  - Users created: ${#USER_IDS[@]}"
echo "  - Orders created: $TOTAL_ORDERS"
echo "  - User IDs saved to: /tmp/k6_test_user_ids.txt"
echo ""
echo " Ready to run performance tests!"
echo "   Run: ./run-tests.sh performance"
