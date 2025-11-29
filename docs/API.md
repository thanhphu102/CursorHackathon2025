# API Documentation

## Authentication

### POST /api/auth/login
Demo login endpoint.

**Request:**
```json
{
  "email": "demo@example.com",
  "password": "optional",
  "demo": true
}
```

**Response:**
```json
{
  "user": {
    "id": "demo-user-123",
    "email": "demo@example.com",
    "name": "Demo User"
  },
  "session": {
    "access_token": "demo-token"
  }
}
```

## Transactions

### GET /api/transactions?userId={id}
Get all transactions for a user.

**Response:**
```json
{
  "transactions": [
    {
      "id": "123",
      "userId": "demo-user-123",
      "amount": -45.99,
      "currency": "USD",
      "date": "2024-01-15",
      "merchant": "Starbucks",
      "category": "Food",
      "source": "manual",
      "rawText": "Coffee purchase",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/transactions
Create a new transaction.

**Request:**
```json
{
  "userId": "demo-user-123",
  "amount": -45.99,
  "currency": "USD",
  "date": "2024-01-15",
  "merchant": "Starbucks",
  "category": "Food",
  "source": "manual",
  "rawText": "Coffee purchase"
}
```

### POST /api/transactions/import
Import transactions from CSV.

**Request:**
```json
{
  "userId": "demo-user-123",
  "rows": [
    {
      "date": "2024-01-15",
      "amount": "45.99",
      "merchant": "Starbucks",
      "category": "Food",
      "description": "Coffee"
    }
  ]
}
```

## Receipts

### POST /api/receipts/scan
Scan a receipt image using OCR.

**Request:** FormData with `file` and `userId`

**Response:**
```json
{
  "success": true,
  "scanResult": {
    "merchant": "Starbucks",
    "total": 45.99,
    "date": "2024-01-15",
    "items": [
      {"description": "Coffee", "amount": 45.99}
    ],
    "rawText": "STARBUCKS...",
    "confidence": 0.9
  },
  "categorization": {
    "category": "Food",
    "confidence": 0.85
  },
  "transaction": { ... }
}
```

## Subscriptions

### GET /api/subscriptions?userId={id}
Get all active subscriptions for a user.

### GET /api/subscriptions/detect?userId={id}
Run subscription detection algorithm.

**Response:**
```json
{
  "subscriptions": [...],
  "detected": 3
}
```

### POST /api/subscriptions/{id}/snooze
Snooze or unsnooze a subscription.

**Request:**
```json
{
  "snooze": true
}
```

### DELETE /api/subscriptions/{id}
Dismiss (deactivate) a subscription.

## Goals

### GET /api/goals?userId={id}
Get all goals for a user.

### POST /api/goals
Create a new goal.

**Request:**
```json
{
  "userId": "demo-user-123",
  "title": "Emergency Fund",
  "targetAmount": 10000,
  "currentAmount": 2500,
  "currency": "USD",
  "deadline": "2024-12-31"
}
```

### PATCH /api/goals/{id}
Update a goal.

### DELETE /api/goals/{id}
Delete a goal.

## Insights

### GET /api/insights?userId={id}
Get AI-generated insights for a user.

**Response:**
```json
{
  "insights": [
    {
      "id": "123",
      "userId": "demo-user-123",
      "type": "spending_comparison",
      "message": "You spent 25% more this month...",
      "metadata": {},
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "metrics": {
    "currentMonthSpend": 2000,
    "previousMonthSpend": 1500,
    "categoryBreakdown": {
      "Food": 500,
      "Transport": 300
    },
    "currentBalance": 5000
  }
}
```

