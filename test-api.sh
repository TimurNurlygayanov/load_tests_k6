#!/bin/bash

# Trading Platform API Test Script
# This script demonstrates the API functionality

echo " Trading Platform API Test"
echo "=============================="
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
curl -s $BASE_URL/health | python3 -m json.tool
echo ""

# Test 2: Create User
echo "2️⃣  Creating User..."
USER_RESPONSE=$(curl -s -X POST $BASE_URL/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"initialBalance": 10000}')
echo $USER_RESPONSE | python3 -m json.tool
USER_ID=$(echo $USER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])")
echo "User ID: $USER_ID"
echo ""

# Test 3: Get Market Symbols
echo "3️⃣  Getting Available Symbols..."
curl -s $BASE_URL/api/market/symbols | python3 -m json.tool
echo ""

# Test 4: Get Latest Price
echo "4️⃣  Getting Latest BTC Price..."
curl -s $BASE_URL/api/market/latest/BTCUSD | python3 -m json.tool
echo ""

# Test 5: Get Candles
echo "5️⃣  Getting Historical Candles..."
curl -s "$BASE_URL/api/market/candles/BTCUSD?interval=1h&limit=5" | python3 -m json.tool
echo ""

# Test 6: Place Market Order
echo "6️⃣  Placing Market Order..."
curl -s -X POST $BASE_URL/api/orders/market \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"symbol\": \"BTCUSD\",
    \"side\": \"buy\",
    \"quantity\": 0.1
  }" | python3 -m json.tool
echo ""

# Test 7: Check User Balance
echo "7️⃣  Checking User Balance..."
curl -s $BASE_URL/api/users/$USER_ID/balance | python3 -m json.tool
echo ""

# Test 8: Check User Positions
echo "8️⃣  Checking User Positions..."
curl -s $BASE_URL/api/users/$USER_ID/positions | python3 -m json.tool
echo ""

# Test 9: Place Limit Order
echo "9️⃣  Placing Limit Order..."
curl -s -X POST $BASE_URL/api/orders/limit \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"symbol\": \"ETHUSD\",
    \"side\": \"buy\",
    \"quantity\": 1.0,
    \"price\": 2900
  }" | python3 -m json.tool
echo ""

# Test 10: Get User Orders
echo "🔟 Getting User Orders..."
curl -s $BASE_URL/api/orders/user/$USER_ID | python3 -m json.tool
echo ""

echo " All tests completed!"
