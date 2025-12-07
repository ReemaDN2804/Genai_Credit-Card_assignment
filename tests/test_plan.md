# Test Plan

## Overview

This test plan covers manual and automated testing for the GenAI Credit Card Assistant.

## Test Environment

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173
- **Test User**: user1 (see `backend/data/users.json`)

## Test Categories

### 1. Intent Detection Tests

**Objective**: Verify that the NLU correctly identifies user intents.

**Test Cases**:

1. **Activate Card Intent**
   - Input: "I want to activate my card"
   - Expected: Intent = `activate_card`, confidence > 0.8
   - Action: Card activation should be triggered

2. **Set Autopay Intent**
   - Input: "Enable autopay for minimum amount"
   - Expected: Intent = `set_autopay`, slots include `enabled: true`
   - Action: Autopay should be enabled

3. **Dispute Transaction Intent**
   - Input: "I want to dispute this charge"
   - Expected: Intent = `dispute_transaction`
   - Action: Dispute should be created

4. **Informational Query Intent**
   - Input: "How does EMI work?"
   - Expected: Intent = `informational_query`
   - Action: RAG should retrieve relevant KB items

**Acceptance Criteria**:
- Intent detection accuracy > 85% for test queries
- Confidence scores are reasonable (0.7-1.0 for clear intents)
- Slots are extracted correctly when present

---

### 2. RAG (Knowledge Base Retrieval) Tests

**Objective**: Verify that relevant KB items are retrieved for user queries.

**Test Cases**:

1. **Card Delivery Query**
   - Input: "When will my card arrive?"
   - Expected: KB items about card delivery are retrieved
   - Verify: At least one item from "Card Delivery" category

2. **EMI Query**
   - Input: "How does EMI work?"
   - Expected: KB item about EMI is retrieved
   - Verify: Content includes "Equated Monthly Installment"

3. **Autopay Query**
   - Input: "How do I set up autopay?"
   - Expected: KB item about autopay setup is retrieved
   - Verify: Content includes setup instructions

**Acceptance Criteria**:
- Top 3 KB items are relevant to the query
- Retrieval works for all KB categories
- Keyword matching works correctly

---

### 3. Action Execution Tests

**Objective**: Verify that mock APIs execute correctly and update user data.

**Test Cases**:

1. **Activate Card**
   - Pre-condition: Card status = "inactive"
   - Action: POST `/api/v1/activate-card` with userId and cardId
   - Expected: Card status changes to "active" in users.json
   - Verify: Response includes success message and activatedDate

2. **Set Autopay**
   - Pre-condition: Autopay disabled
   - Action: POST `/api/v1/set-autopay` with enabled=true
   - Expected: Autopay enabled in users.json
   - Verify: Response includes autopay configuration

3. **Dispute Transaction**
   - Action: POST `/api/v1/dispute` with txnId and reason
   - Expected: Dispute ID generated, status = "pending"
   - Verify: Response includes dispute details

4. **Repay Amount**
   - Pre-condition: Balance = 1250.50
   - Action: POST `/api/v1/repay` with amount = 100
   - Expected: New balance = 1150.50
   - Verify: Available credit updated correctly

**Acceptance Criteria**:
- All actions return success responses
- User data is persisted correctly
- Error handling works for invalid inputs

---

### 4. Response Generation Tests

**Objective**: Verify that responses are natural, accurate, and contextually appropriate.

**Test Cases**:

1. **Action Confirmation Response**
   - Input: "Activate my card"
   - Expected: Response confirms activation, mentions card details
   - Verify: Response is friendly and clear

2. **Informational Response**
   - Input: "How does EMI work?"
   - Expected: Response explains EMI using KB content
   - Verify: Response is accurate and not verbatim KB copy

3. **Multi-step Response**
   - Input: "Activate my card and set autopay"
   - Expected: Response addresses both actions
   - Verify: Both actions are confirmed

**Acceptance Criteria**:
- Responses are grammatically correct
- Responses include relevant context (user name, account details)
- Responses don't expose sensitive information unnecessarily

---

### 5. Frontend Component Tests

**Objective**: Verify that UI components work correctly.

**Test Cases**:

1. **Chat Widget**
   - Send a message and verify it appears in chat
   - Verify assistant response appears
   - Check that metadata (intent, confidence) is displayed
   - Verify loading state during processing

2. **Voice Widget**
   - Click "Start Recording" and verify microphone activates
   - Speak a message and verify transcript appears
   - Verify response is generated and spoken
   - Test file upload button (should show placeholder message)

3. **KB Viewer**
   - Verify KB items load and display
   - Test search functionality
   - Test category filter
   - Verify item details are shown

**Acceptance Criteria**:
- All components render without errors
- User interactions work smoothly
- UI is responsive on mobile and desktop

---

### 6. Channel Integration Tests

**Objective**: Verify that webhook endpoints work for external channels.

**Test Cases**:

1. **WhatsApp Webhook**
   - Send POST to `/api/v1/webhook/whatsapp` with message
   - Expected: Response in WhatsApp format
   - Verify: Intent detection and response generation work

2. **RCS Webhook**
   - Send POST to `/api/v1/webhook/rcs` with message
   - Expected: Response in RCS format
   - Verify: Channel is logged correctly

**Acceptance Criteria**:
- Webhook endpoints accept channel-specific payloads
- Responses are formatted appropriately
- Error handling works for malformed requests

---

### 7. Error Handling Tests

**Objective**: Verify that errors are handled gracefully.

**Test Cases**:

1. **Missing Required Fields**
   - Send request without userId
   - Expected: 400 error with clear message

2. **Invalid User ID**
   - Send request with non-existent userId
   - Expected: Appropriate error message

3. **Gemini API Failure**
   - Simulate Gemini API failure (disable API key)
   - Expected: Fallback response is generated
   - Verify: System doesn't crash

4. **Empty Message**
   - Send empty message
   - Expected: 400 error

**Acceptance Criteria**:
- All errors return appropriate HTTP status codes
- Error messages are user-friendly
- System remains stable after errors

---

### 8. Security Tests

**Objective**: Verify basic security measures.

**Test Cases**:

1. **Input Sanitization**
   - Send message with script tags
   - Expected: Scripts are not executed
   - Verify: XSS protection

2. **Rate Limiting** (if implemented)
   - Send 100 requests rapidly
   - Expected: Rate limit enforced
   - Verify: Appropriate error message

3. **Data Masking**
   - Check that sensitive data (card numbers) are masked in responses
   - Expected: Only last 4 digits shown

**Acceptance Criteria**:
- No XSS vulnerabilities
- Sensitive data is masked
- Rate limiting works (if implemented)

---

## Manual Test Steps

### Quick Start Test

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Test Basic Flow**
   - Open http://localhost:5173
   - Type "I want to activate my card"
   - Verify response appears
   - Check backend logs for intent detection and action execution

### Sample Conversation Test

Run through these queries in sequence:

1. "I want to activate my card" → Should activate card
2. "When will my card arrive?" → Should show delivery status
3. "How do I set up autopay?" → Should show KB information
4. "Enable autopay for minimum amount" → Should enable autopay
5. "What's my balance?" → Should show account balance

**Expected**: All queries should return appropriate responses.

---

## Automated Test Scripts

### Test Sample Queries

Run all queries from `tests/sample_queries.json`:

```bash
# Create a test script (test_queries.js)
node tests/test_queries.js
```

**Expected**: At least 85% of queries return correct intents.

---

## Performance Tests

### Response Time

- **Target**: < 2 seconds for message processing
- **Test**: Send 10 messages and measure average response time
- **Acceptance**: Average < 2s, 95th percentile < 3s

### Concurrent Users

- **Target**: Support 10 concurrent users
- **Test**: Send 10 simultaneous requests
- **Acceptance**: All requests complete successfully

---

## Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| Intent Detection - Activate Card | ✅/❌ | |
| Intent Detection - Set Autopay | ✅/❌ | |
| RAG - Card Delivery | ✅/❌ | |
| Action - Activate Card | ✅/❌ | |
| Frontend - Chat Widget | ✅/❌ | |
| Frontend - Voice Widget | ✅/❌ | |
| Webhook - WhatsApp | ✅/❌ | |
| Error Handling - Missing Fields | ✅/❌ | |

---

## Known Limitations

1. **Gemini API Stub**: Currently uses mock responses. Replace with real API calls for full testing.
2. **Vector Search**: RAG uses simple keyword matching. Vector search not yet implemented.
3. **Conversation History**: Not fully maintained across sessions.
4. **Audio File Upload**: Not yet implemented in voice widget.

---

## Next Steps

1. Implement automated test suite using Jest or Mocha
2. Add integration tests for full conversation flows
3. Implement vector search for improved RAG
4. Add performance monitoring
5. Set up CI/CD pipeline for automated testing

