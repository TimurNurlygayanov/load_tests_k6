# API Reference

REST API endpoints for the trading platform.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-19T15:24:00.000Z"
}
```

---

## User Management

### Create User

```http
POST /api/users/create
Content-Type: application/json

{
  "initialBalance": 10000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "balance": 10000,
    "createdAt": "2024-11-19T15:24:00.000Z"
  }
}
```

### Get User

```http
GET /api/users/:userId
```

### Get User Balance

```http
GET /api/users/:userId/balance
```

### Get User Positions

```http
GET /api/users/:userId/positions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "position-123",
      "symbol": "BTCUSD",
      "quantity": 0.1,
      "averagePrice": 45236.82,
      "side": "buy",
      "currentValue": 4530.00,
      "profitLoss": 6.32,
      "profitLossPercent": 0.14
    }
  ]
}
```

---

## Market Data

### Get Symbols

```http
GET /api/market/symbols
```

**Response:**
```json
{
  "success": true,
  "data": ["BTCUSD", "ETHUSD", "AAPL", "GOOGL", "TSLA", "EURUSD", "GBPUSD"]
}
```

### Get Latest Price

```http
GET /api/market/latest/:symbol
```

**Example:** `GET /api/market/latest/BTCUSD`

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSD",
    "price": 45234.56,
    "timestamp": "2024-11-19T15:24:00.000Z",
    "bid": 45232.30,
    "ask": 45236.82,
    "volume24h": 1050000000
  }
}
```

### Get Historical Candles

```http
GET /api/market/candles/:symbol?interval=1h&limit=100
```

**Query Parameters:**
- `interval`: `1m`, `5m`, `1h`, `1d` (default: `1h`)
- `limit`: Number of candles (default: 100, max: 1000)

**Example:** `GET /api/market/candles/BTCUSD?interval=1h&limit=24`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-11-19T14:00:00.000Z",
      "open": 45100.00,
      "high": 45300.00,
      "low": 45000.00,
      "close": 45234.56,
      "volume": 43750000
    }
  ]
}
```

---

## Order Management

### Place Market Order

```http
POST /api/orders/market
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "BTCUSD",
  "side": "buy",
  "quantity": 0.1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "symbol": "BTCUSD",
    "type": "market",
    "side": "buy",
    "quantity": 0.1,
    "status": "filled",
    "filledPrice": 45236.82,
    "createdAt": "2024-11-19T15:24:00.000Z",
    "filledAt": "2024-11-19T15:24:00.000Z"
  }
}
```

### Place Limit Order

```http
POST /api/orders/limit
Content-Type: application/json

{
  "userId": "user-id",
  "symbol": "BTCUSD",
  "side": "buy",
  "quantity": 0.1,
  "price": 44000
}
```

### Place Stop Order

```http
POST /api/orders/stop
Content-Type: application/json

{
  "userId": "user-id",
  "symbol": "BTCUSD",
  "side": "sell",
  "quantity": 0.1,
  "stopPrice": 43000
}
```

### Place Take-Profit Order

```http
POST /api/orders/take-profit
Content-Type: application/json

{
  "userId": "user-id",
  "symbol": "BTCUSD",
  "side": "sell",
  "quantity": 0.1,
  "stopPrice": 46000
}
```

### Get Order

```http
GET /api/orders/:orderId
```

### Get User Orders

```http
GET /api/orders/user/:userId
```

---

## Order Types

| Type | Description | Execution |
|------|-------------|-----------|
| **Market** | Immediate execution | Current market price |
| **Limit** | Execute at specific price | When price reaches limit |
| **Stop** | Trigger at stop price | When price crosses stop level |
| **Take-Profit** | Close at profit target | When price reaches target |

## Available Symbols

| Symbol | Description | Base Price |
|--------|-------------|------------|
| BTCUSD | Bitcoin/USD | ~$45,000 |
| ETHUSD | Ethereum/USD | ~$3,000 |
| AAPL | Apple Inc. | ~$180 |
| GOOGL | Alphabet Inc. | ~$140 |
| TSLA | Tesla Inc. | ~$250 |
| EURUSD | Euro/USD | ~1.08 |
| GBPUSD | British Pound/USD | ~1.26 |

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
