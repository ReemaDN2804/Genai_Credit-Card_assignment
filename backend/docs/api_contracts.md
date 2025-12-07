# API Contracts

This document describes the API endpoints for the GenAI Credit Card Assistant backend.

Base URL: `http://localhost:3001`

## Authentication

Currently, the API uses simple user ID-based authentication. In production, implement proper JWT tokens or OAuth.

## Endpoints

### 1. Health Check

**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

### 2. Send Message (Main Chat Endpoint)

**POST** `/api/v1/message`

Processes a user message and returns an AI-generated response.

**Request Body:**
```json
{
  "message": "I want to activate my card",
  "userId": "user1",
  "channel": "web",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "message": "I can help you activate your card. Let me do that for you now...",
  "metadata": {
    "intent": "activate_card",
    "confidence": 0.95,
    "slots": {
      "cardId": "card123"
    },
    "actionResults": {
      "success": true,
      "message": "Card activated successfully"
    },
    "kbItemsUsed": 1,
    "channel": "web",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to activate my card",
    "userId": "user1",
    "channel": "web"
  }'
```

---

### 3. Activate Card

**POST** `/api/v1/activate-card`

Activates a credit card for a user.

**Request Body:**
```json
{
  "userId": "user1",
  "cardId": "card123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card activated successfully",
  "userId": "user1",
  "cardId": "card123",
  "status": "active",
  "activatedDate": "2024-01-20T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/activate-card \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "cardId": "card123"
  }'
```

---

### 4. Set Autopay

**POST** `/api/v1/set-autopay`

Enables or disables automatic payments.

**Request Body:**
```json
{
  "userId": "user1",
  "accountId": "acc1",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Autopay enabled successfully",
  "userId": "user1",
  "accountId": "acc1",
  "autopay": {
    "enabled": true,
    "amount": "minimum",
    "paymentDate": "2024-01-25"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/set-autopay \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "accountId": "acc1",
    "enabled": true
  }'
```

---

### 5. Get Card Status

**GET** `/api/v1/card-status/:cardId`

Gets the delivery and activation status of a card.

**Parameters:**
- `cardId` (path parameter): The card ID

**Query Parameters:**
- `userId` (optional): User ID for authorization

**Response:**
```json
{
  "success": true,
  "cardId": "card123",
  "status": "active",
  "deliveryStatus": "delivered",
  "deliveryDate": "2024-01-15",
  "activatedDate": "2024-01-20T10:30:00.000Z",
  "last4": "1234",
  "type": "Visa"
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/v1/card-status/card123?userId=user1
```

---

### 6. Dispute Transaction

**POST** `/api/v1/dispute`

Creates a dispute for a transaction.

**Request Body:**
```json
{
  "userId": "user1",
  "txnId": "txn456",
  "reason": "Unauthorized charge"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute created successfully",
  "disputeId": "dispute_1705747800000",
  "status": "pending",
  "dispute": {
    "disputeId": "dispute_1705747800000",
    "userId": "user1",
    "txnId": "txn456",
    "transaction": {
      "date": "2024-01-20",
      "merchant": "Amazon",
      "amount": 89.99
    },
    "reason": "Unauthorized charge",
    "status": "pending",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "estimatedResolutionDate": "2024-01-30T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/dispute \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "txnId": "txn456",
    "reason": "Unauthorized charge"
  }'
```

---

### 7. Repay Amount

**POST** `/api/v1/repay`

Processes a repayment.

**Request Body:**
```json
{
  "userId": "user1",
  "amount": 100.00,
  "method": "bank_transfer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "paymentId": "payment_1705747800000",
  "userId": "user1",
  "amount": 100.00,
  "method": "bank_transfer",
  "previousBalance": 1250.50,
  "newBalance": 1150.50,
  "availableCredit": 3849.50
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/repay \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "amount": 100.00,
    "method": "bank_transfer"
  }'
```

---

### 8. Webhook (External Channels)

**POST** `/api/v1/webhook/:channel`

Handles webhooks from external channels (WhatsApp, RCS, etc.).

**Path Parameters:**
- `channel`: Channel name (e.g., "whatsapp", "rcs", "sms")

**Request Body (WhatsApp example):**
```json
{
  "from": "+1234567890",
  "message": "I want to activate my card",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "response": "I can help you activate your card. Let me do that for you now...",
  "metadata": {
    "intent": "activate_card",
    "confidence": 0.95,
    "channel": "whatsapp",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

**cURL Example (WhatsApp simulation):**
```bash
curl -X POST http://localhost:3001/api/v1/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "I want to activate my card"
  }'
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Missing required fields",
  "required": ["userId", "cardId"]
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to process request",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

Recommended rate limits:
- Message endpoint: 60 requests per minute per user
- Action endpoints: 30 requests per minute per user
- Webhook endpoints: 100 requests per minute per channel

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Amounts are in the account's base currency (USD in this demo)
- User IDs and card IDs are strings
- All endpoints return JSON

