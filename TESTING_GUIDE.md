# Complete Testing Guide - GenAI Credit Card Assistant

## 🧪 How to Test All Functionalities

### Prerequisites
- Backend running on http://localhost:3001
- Frontend running on http://localhost:5173 (or 5174)
- Open http://localhost:5173 in your browser

---

## 1. Text Chat Functionality

### Test Different Intent Categories

#### Account & Onboarding
- ✅ "I want to activate my card"
- ✅ "How do I activate my credit card?"
- ✅ "What's my account balance?"
- ✅ "Show me my credit limit"

#### Card Delivery
- ✅ "When will my card arrive?"
- ✅ "Where is my card?"
- ✅ "How long does card delivery take?"
- ✅ "Track my card delivery"

#### Transaction & EMI
- ✅ "I want to dispute this charge"
- ✅ "This transaction is unauthorized"
- ✅ "How does EMI work?"
- ✅ "Show me my recent transactions"
- ✅ "What's the difference between pending and posted transactions?"

#### Bill & Statement
- ✅ "When is my bill due?"
- ✅ "How do I download my statement?"
- ✅ "Explain my statement"

#### Repayments
- ✅ "I want to set up autopay"
- ✅ "Enable autopay for minimum amount"
- ✅ "How do I make a payment?"
- ✅ "I want to pay $100"
- ✅ "What's my minimum payment?"
- ✅ "How is minimum payment calculated?"
- ✅ "Disable autopay"

#### Collections
- ✅ "What's the late fee?"
- ✅ "I missed my payment, what happens?"

#### Multi-Intent
- ✅ "I want to activate my new card and set autopay for minimum amount"

---

## 2. Voice Chat Functionality

### Steps to Test:
1. Click on **"Voice Chat"** tab in the frontend
2. Click **"Start Recording"** button (microphone icon)
3. Speak one of the test queries above
4. Click **"Stop Recording"** button
5. Verify:
   - Your speech is transcribed correctly
   - Response is generated
   - Response is spoken back (TTS)

### Test Queries for Voice:
- "When is my bill due?"
- "I want to activate my card"
- "How do I set up autopay?"

### Expected Behavior:
- ✅ Microphone activates when you click "Start Recording"
- ✅ Speech is transcribed and displayed
- ✅ Response is generated and spoken back
- ✅ Works in Chrome/Edge browsers

---

## 3. Knowledge Base Viewer

### Steps to Test:
1. Click on **"Knowledge Base"** tab
2. Verify all 20 KB items are displayed
3. Test search functionality:
   - Type "activate" in search box
   - Type "payment" in search box
   - Type "delivery" in search box
4. Test category filter:
   - Select "Account & Onboarding"
   - Select "Card Delivery"
   - Select "Transaction & EMI"
   - Select "All Categories"

### Expected Behavior:
- ✅ All 20 KB items load
- ✅ Search filters items correctly
- ✅ Category filter works
- ✅ Items show title, content, keywords, and category

---

## 4. API Endpoints Testing

### Using cURL (Terminal/PowerShell)

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Send Message (Main Chat Endpoint)
```bash
curl -X POST http://localhost:3001/api/v1/message \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"when is my bill due?\",\"userId\":\"user1\",\"channel\":\"web\"}"
```

#### Activate Card
```bash
curl -X POST http://localhost:3001/api/v1/activate-card \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user1\",\"cardId\":\"card123\"}"
```

#### Set Autopay
```bash
curl -X POST http://localhost:3001/api/v1/set-autopay \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user1\",\"accountId\":\"acc1\",\"enabled\":true}"
```

#### Get Card Status
```bash
curl http://localhost:3001/api/v1/card-status/card123?userId=user1
```

#### Dispute Transaction
```bash
curl -X POST http://localhost:3001/api/v1/dispute \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user1\",\"txnId\":\"txn456\",\"reason\":\"Unauthorized charge\"}"
```

#### Repay Amount
```bash
curl -X POST http://localhost:3001/api/v1/repay \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user1\",\"amount\":100.00,\"method\":\"bank_transfer\"}"
```

#### WhatsApp Webhook (Simulation)
```bash
curl -X POST http://localhost:3001/api/v1/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"+1234567890\",\"message\":\"I want to activate my card\"}"
```

### Using PowerShell (Windows)

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get

# Send Message
$body = @{
    message = "when is my bill due?"
    userId = "user1"
    channel = "web"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/message" -Method Post -Body $body -ContentType "application/json"
```

---

## 5. Test All Sample Queries

Run through all 30 queries from `tests/sample_queries.json`:

### Quick Test Script

Create a file `test_all_queries.js` in the root folder:

```javascript
import { readFileSync } from 'fs';

const queries = JSON.parse(readFileSync('tests/sample_queries.json', 'utf8'));

for (const query of queries) {
  console.log(`\nTesting: "${query.utterance}"`);
  console.log(`Expected Intent: ${query.expected_intent}`);
  
  // Make API call here or test manually in UI
}
```

Or test manually by typing each query in the chat interface.

---

## 6. Verify Data Persistence

### Test User Data Updates

1. **Activate Card:**
   - Send: "I want to activate my card"
   - Check `backend/data/users.json` - card status should change to "active"

2. **Set Autopay:**
   - Send: "Enable autopay for minimum amount"
   - Check `backend/data/users.json` - autopay.enabled should be true

3. **Make Payment:**
   - Send: "I want to pay $100"
   - Check `backend/data/users.json` - balance should decrease by 100

---

## 7. Error Handling Tests

### Test Invalid Inputs

1. **Empty Message:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/message \
     -H "Content-Type: application/json" \
     -d "{\"message\":\"\",\"userId\":\"user1\"}"
   ```
   Expected: 400 error

2. **Missing User ID:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/activate-card \
     -H "Content-Type: application/json" \
     -d "{\"cardId\":\"card123\"}"
   ```
   Expected: 400 error with "Missing required fields"

3. **Invalid User:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/activate-card \
     -H "Content-Type: application/json" \
     -d "{\"userId\":\"invalid_user\",\"cardId\":\"card123\"}"
   ```
   Expected: Error message "User not found"

---

## 8. Backend Logs Verification

### Check Console Output

When you send messages, verify you see:
- ✅ `[NLU] Processing message: "..."`
- ✅ `[NLU] Intent detected: {...}`
- ✅ `[RAG] Retrieved X KB items`
- ✅ `[RESPONSE] Generated: "..."`
- ✅ `[ACTION] ...` (if action was executed)

### Expected Log Format:
```
[2025-12-07T10:00:00.000Z] POST /api/v1/message { message: '...', userId: 'user1' }
[NLU] Processing message: "..."
[NLU] Intent detected: { intent: '...', confidence: 0.9 }
[RAG] Retrieved 3 KB items for query: "..."
[RESPONSE] Generated: "Your bill is due on..."
```

---

## 9. Frontend UI Tests

### Chat Widget
- ✅ Messages appear in chat
- ✅ User messages on right (blue)
- ✅ Assistant messages on left (gray)
- ✅ Metadata shows (intent, confidence)
- ✅ Timestamps display
- ✅ Loading indicator appears while processing

### Voice Widget
- ✅ Microphone button works
- ✅ Recording indicator shows
- ✅ Transcript appears
- ✅ Response is generated
- ✅ TTS speaks response

### KB Viewer
- ✅ All items load
- ✅ Search works
- ✅ Category filter works
- ✅ Items display correctly

---

## 10. Complete Test Scenarios

### Scenario 1: New User Onboarding
1. "I want to activate my card"
2. "When will my card arrive?"
3. "How do I set up autopay?"

### Scenario 2: Billing Inquiry
1. "When is my bill due?"
2. "What's my minimum payment?"
3. "How do I download my statement?"

### Scenario 3: Transaction Issues
1. "I want to dispute this charge"
2. "This transaction is unauthorized"
3. "Show me my recent transactions"

### Scenario 4: Payment Management
1. "I want to pay $100"
2. "Enable autopay for minimum amount"
3. "What's my account balance?"

---

## 11. Performance Tests

### Response Time
- ✅ Messages should respond within 2-3 seconds
- ✅ Check backend logs for timing

### Concurrent Requests
- ✅ Send multiple messages quickly
- ✅ Verify all are processed correctly

---

## 12. Browser Compatibility

### Test in Different Browsers:
- ✅ Chrome (Voice widget works)
- ✅ Edge (Voice widget works)
- ✅ Firefox (Voice widget may not work)
- ✅ Safari (Voice widget may not work)

---

## Quick Test Checklist

- [ ] Text chat works
- [ ] Voice chat works (Chrome/Edge)
- [ ] KB viewer loads and searches
- [ ] All API endpoints respond
- [ ] Intent detection works for all categories
- [ ] Actions execute (activate, autopay, dispute, repay)
- [ ] Responses are natural language (not JSON)
- [ ] User data persists in users.json
- [ ] Error handling works
- [ ] Backend logs show all steps

---

## Troubleshooting

### If something doesn't work:
1. Check backend console for errors
2. Check browser console (F12) for frontend errors
3. Verify `.env` file has correct API key
4. Restart both servers
5. Clear browser cache

---

## Next Steps After Testing

1. **Enable Real Gemini API:**
   - Install: `cd backend && npm install @google/generative-ai`
   - Uncomment Gemini code in `nluController.js`
   - Test with real API responses

2. **Add More Test Cases:**
   - Edge cases
   - Error scenarios
   - Multi-turn conversations

3. **Performance Testing:**
   - Load testing
   - Response time optimization

Happy Testing! 🚀

