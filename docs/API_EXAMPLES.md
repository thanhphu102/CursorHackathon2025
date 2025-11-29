# API Examples (cURL)

## Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@example.com", "demo": true}'
```

## Transactions

```bash
# Get transactions
curl http://localhost:3000/api/transactions?userId=demo-user-123

# Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user-123",
    "amount": -45.99,
    "date": "2024-01-15",
    "merchant": "Starbucks",
    "category": "Food"
  }'

# Import CSV
curl -X POST http://localhost:3000/api/transactions/import \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user-123",
    "rows": [
      {"date": "2024-01-15", "amount": "45.99", "merchant": "Starbucks"}
    ]
  }'
```

## Receipts

```bash
# Scan receipt
curl -X POST http://localhost:3000/api/receipts/scan \
  -F "file=@receipt.jpg" \
  -F "userId=demo-user-123"
```

## Subscriptions

```bash
# Get subscriptions
curl http://localhost:3000/api/subscriptions?userId=demo-user-123

# Detect subscriptions
curl http://localhost:3000/api/subscriptions/detect?userId=demo-user-123

# Snooze subscription
curl -X POST http://localhost:3000/api/subscriptions/123/snooze \
  -H "Content-Type: application/json" \
  -d '{"snooze": true}'

# Dismiss subscription
curl -X DELETE http://localhost:3000/api/subscriptions/123
```

## Goals

```bash
# Get goals
curl http://localhost:3000/api/goals?userId=demo-user-123

# Create goal
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user-123",
    "title": "Emergency Fund",
    "targetAmount": 10000,
    "currentAmount": 2500,
    "deadline": "2024-12-31"
  }'

# Update goal
curl -X PATCH http://localhost:3000/api/goals/123 \
  -H "Content-Type: application/json" \
  -d '{"currentAmount": 3000}'

# Delete goal
curl -X DELETE http://localhost:3000/api/goals/123
```

## Insights

```bash
# Get insights
curl http://localhost:3000/api/insights?userId=demo-user-123
```

