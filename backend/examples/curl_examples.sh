#!/bin/bash

# Example cURL commands for testing the GenAI Credit Card Assistant API

BASE_URL="http://localhost:3001"

echo "=== Health Check ==="
curl -X GET "${BASE_URL}/health"
echo -e "\n\n"

echo "=== Activate Card ==="
curl -X POST "${BASE_URL}/api/v1/activate-card" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "cardId": "card123"
  }'
echo -e "\n\n"

echo "=== Set Autopay ==="
curl -X POST "${BASE_URL}/api/v1/set-autopay" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "accountId": "acc1",
    "enabled": true
  }'
echo -e "\n\n"

echo "=== Get Card Status ==="
curl -X GET "${BASE_URL}/api/v1/card-status/card123?userId=user1"
echo -e "\n\n"

echo "=== Dispute Transaction ==="
curl -X POST "${BASE_URL}/api/v1/dispute" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "txnId": "txn456",
    "reason": "Unauthorized charge"
  }'
echo -e "\n\n"

echo "=== Repay Amount ==="
curl -X POST "${BASE_URL}/api/v1/repay" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "amount": 100.00,
    "method": "bank_transfer"
  }'
echo -e "\n\n"

echo "=== Send Message (Main Chat Endpoint) ==="
curl -X POST "${BASE_URL}/api/v1/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to activate my card",
    "userId": "user1",
    "channel": "web"
  }'
echo -e "\n\n"

echo "=== WhatsApp Webhook (Simulation) ==="
curl -X POST "${BASE_URL}/api/v1/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "I want to activate my card"
  }'
echo -e "\n\n"

echo "=== RCS Webhook (Simulation) ==="
curl -X POST "${BASE_URL}/api/v1/webhook/rcs" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "text": "How does EMI work?"
  }'
echo -e "\n"

