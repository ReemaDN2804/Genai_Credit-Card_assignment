# Architecture Documentation

## System Overview

The GenAI Credit Card Assistant is a channel-agnostic, multi-modal AI assistant that provides intelligent customer support for credit card services. It supports text and voice interactions across web, mobile app, WhatsApp, RCS, and phone channels.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interfaces                          │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│   Web    │  Mobile  │ WhatsApp │   RCS    │      Phone          │
│  (Text)  │ (Text/Voice) │ (Text) │ (Text) │    (Voice)          │
└──────────┴──────────┴──────────┴──────────┴─────────────────────┘
           │          │          │          │
           └──────────┴──────────┴──────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Channel Adapters        │
        │  (Webhook Handlers)       │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Message Orchestrator    │
        │   (server.js)             │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   NLU Layer (Gemini)      │
        │   - Intent Detection      │
        │   - Slot Extraction        │
        │   - Confidence Scoring    │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Decision Point        │
        │  (Informational vs Action) │
        └─────┬─────────────────┬───┘
              │                 │
    ┌─────────▼─────┐  ┌────────▼──────────┐
    │  RAG Retriever │  │  Action Executor   │
    │  (KB Search)   │  │  (Mock APIs)       │
    └─────────┬─────┘  └────────┬──────────┘
              │                 │
              └─────────┬───────┘
                        │
        ┌───────────────▼───────────────┐
        │   Response Generator (Gemini) │
        │   - Context Assembly          │
        │   - Natural Language Gen      │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │   Channel Adapter (Format)    │
        │   - Text Response              │
        │   - SSML (Voice)               │
        │   - Rich Media (WhatsApp/RCS) │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │         User Response          │
        └───────────────────────────────┘
```

## Component Details

### 1. User Interfaces

**Web (Text)**
- React frontend with chat widget
- Real-time message exchange via REST API
- Displays intent metadata and confidence scores

**Mobile App (Text/Voice)**
- Native app or PWA
- Voice input via device microphone
- Text fallback available

**WhatsApp**
- Webhook integration with Twilio/Meta
- Text messages only (voice via audio files)
- Rich media support (buttons, cards)

**RCS (Rich Communication Services)**
- Similar to WhatsApp but carrier-native
- Supports rich cards and suggestions
- Webhook-based integration

**Phone (Voice)**
- IVR integration or direct voice calls
- ASR (Automatic Speech Recognition) for input
- TTS (Text-to-Speech) for output
- SSML for natural voice responses

### 2. Channel Adapters

**Purpose**: Normalize incoming messages from different channels into a common format.

**Input Format** (varies by channel):
- WhatsApp: `{ from: "+1234567890", message: "text", ... }`
- RCS: `{ phoneNumber: "+1234567890", text: "message", ... }`
- Web: `{ message: "text", userId: "user1", ... }`
- Phone: Audio stream → ASR → text

**Output Format** (normalized):
```json
{
  "message": "user message text",
  "userId": "user1",
  "channel": "whatsapp|rcs|web|phone",
  "conversationHistory": []
}
```

**Implementation**: Webhook handlers in `server.js` route to `/api/v1/webhook/:channel`

### 3. Message Orchestrator

**Location**: `backend/server.js`

**Responsibilities**:
- Receives normalized messages from channel adapters
- Routes to NLU layer for intent detection
- Makes routing decisions (informational vs actionable)
- Coordinates RAG retrieval and action execution
- Assembles context for response generation
- Formats response for target channel

**Flow**:
1. Receive message → Log request
2. Call NLU → Get intent, slots, confidence
3. Check escalation flag → Route to human if needed
4. Load user context → From `users.json` or database
5. Execute actions if needed → Call action controllers
6. Retrieve KB items → RAG search
7. Generate response → Call Gemini with context
8. Format for channel → Text, SSML, or rich media
9. Return response → To channel adapter

### 4. NLU Layer (Gemini)

**Location**: `backend/controllers/nluController.js`

**Model**: Gemini Pro (`gemini-pro`)

**Tasks**:
1. **Intent Detection**
   - Input: User message + conversation history
   - Output: Intent name, slots, confidence, must_handoff flag
   - Prompt template: `INTENT_DETECTION_PROMPT`

2. **Slot Extraction**
   - Extract entities: cardId, txnId, amount, accountId, etc.
   - Validate slot values
   - Handle missing slots (use defaults from user context)

3. **Confidence Scoring**
   - Score 0.0-1.0 for intent match
   - Low confidence (<0.6) → Escalate or ask for clarification

**Hyperparameters**:
- Temperature: 0.2-0.3 (deterministic for intent detection)
- Max tokens: 512
- Top-p: 0.95
- Top-k: 40

### 5. Decision Point (Orchestrator Logic)

**Informational Path**:
- Intent: `informational_query`, `check_balance`, `check_statement`, etc.
- Flow: RAG → Response Generator
- No actions executed

**Actionable Path**:
- Intent: `activate_card`, `set_autopay`, `dispute_transaction`, `make_payment`
- Flow: Validate slots → Execute action → RAG (optional) → Response Generator
- Actions update user data

**Escalation Path**:
- Intent: `escalate_to_human` OR `must_handoff: true`
- Flow: Skip actions → Generate escalation message → Return to channel

### 6. RAG Retriever

**Location**: `backend/controllers/ragController.js`

**Current Implementation**: Keyword-based search
- Simple TF-IDF or substring matching
- Scores KB items by keyword matches
- Returns top 3 items

**Upgrade Path to Vector Search**:
1. Generate embeddings for each KB item (Gemini embeddings API)
2. Store in vector DB (Pinecone, Weaviate, or local FAISS)
3. Generate query embedding
4. Perform cosine similarity search
5. Return top-k results

**KB Structure**:
- Each item has: id, category, title, content, keywords, tags
- Categories: Account & Onboarding, Card Delivery, Transaction & EMI, Bill & Statement, Repayments, Collections

### 7. Action Executor

**Location**: `backend/controllers/actionsController.js`

**Mock APIs**:
- `activateCard(userId, cardId)` → Updates card status in `users.json`
- `setAutopay(userId, accountId, enabled)` → Updates autopay settings
- `getCardStatus(cardId, userId)` → Returns delivery/activation status
- `disputeTransaction(userId, txnId, reason)` → Creates dispute record
- `repayAmount(userId, amount, method)` → Updates account balance

**Production Integration**:
- Replace file I/O with database calls
- Add authentication/authorization
- Implement idempotency
- Add transaction logging

### 8. Response Generator (Gemini)

**Location**: `backend/controllers/nluController.js`

**Input**:
- User message
- User context (account details, cards, transactions)
- KB snippets (from RAG)
- Action results (if any)

**Prompt Template**: `RESPONSE_GENERATION_PROMPT`

**Output**: Natural language response

**Hyperparameters**:
- Temperature: 0.7-0.9 (creative for responses)
- Max tokens: 512-1024
- Top-p: 0.95

**Voice-Specific**:
- Generate SSML for TTS
- Shorter sentences
- Clear pronunciation hints

### 9. Channel Adapter (Response Formatting)

**Text Response** (Web, WhatsApp, RCS):
- Plain text or markdown
- Rich media (buttons, cards) for WhatsApp/RCS

**Voice Response** (Phone):
- SSML format for TTS
- Pauses, emphasis, prosody
- Fallback to plain text if SSML not supported

**Formatting Logic**:
- Web: Return JSON with message + metadata
- WhatsApp: Format as WhatsApp message object
- RCS: Format as RCS card/suggestion
- Phone: Return SSML or plain text for TTS

## Data Flow Example

### Scenario: User wants to activate card via WhatsApp

1. **User sends**: "I want to activate my card" via WhatsApp
2. **WhatsApp webhook** → POST to `/api/v1/webhook/whatsapp`
3. **Channel adapter** normalizes: `{ message: "I want to activate my card", userId: "+1234567890", channel: "whatsapp" }`
4. **Orchestrator** calls NLU
5. **NLU (Gemini)** returns: `{ intent: "activate_card", slots: { cardId: "card123" }, confidence: 0.95 }`
6. **Orchestrator** loads user context from `users.json`
7. **Action executor** calls `activateCard("user1", "card123")` → Updates `users.json`
8. **RAG retriever** searches KB for "card activation" → Returns KB item about activation
9. **Response generator (Gemini)** creates: "I've activated your card ending in 1234. You can start using it immediately!"
10. **Channel adapter** formats for WhatsApp
11. **Response sent** to user via WhatsApp

## Data Storage

### Current (Demo)
- **Knowledge Base**: `backend/data/kb.json` (20 items)
- **User Data**: `backend/data/users.json` (sample accounts)
- **Logs**: Console output

### Production Recommendations
- **KB**: Vector database (Pinecone/Weaviate) + relational DB for metadata
- **User Data**: PostgreSQL/MongoDB with encryption at rest
- **Conversation History**: Redis (7-30 day retention)
- **Logs**: ELK stack or cloud logging (Datadog, CloudWatch)

## Caching Strategy

**Recommendations**:
- **KB Retrieval**: Cache top results for common queries (Redis, 1 hour TTL)
- **User Context**: Cache in memory (5 minute TTL)
- **Intent Detection**: Cache for identical messages (1 hour TTL)
- **Response Generation**: No caching (personalized responses)

## Rate Limiting

**Recommendations**:
- **Per User**: 60 requests/minute
- **Per Channel**: 100 requests/minute
- **Per IP**: 200 requests/minute
- **Implementation**: Redis-based rate limiter (express-rate-limit)

## Authentication & Authorization

**Current (Demo)**: Simple userId-based (no real auth)

**Production Recommendations**:
- **JWT Tokens**: Issue on login, validate on each request
- **OAuth 2.0**: For third-party integrations
- **Role-Based Access**: Admin, agent, customer roles
- **API Keys**: For webhook integrations (WhatsApp, RCS)

## Logging & Monitoring

**Logging**:
- Request/response logs (with PII masking)
- Intent detection results
- Action execution results
- Error logs with stack traces

**Monitoring**:
- Response time (p50, p95, p99)
- Intent detection accuracy
- Action success rate
- Error rate
- User satisfaction (if available)

**Tools**: Winston (Node.js), Datadog, New Relic, or CloudWatch

## Privacy & Security

### Encryption
- **In Transit**: HTTPS/TLS for all API calls
- **At Rest**: Encrypt sensitive fields (card numbers, SSN) in database

### PII Handling
- **Masking**: Show only last 4 digits of card numbers
- **Logging**: Mask PII in logs (replace with `[REDACTED]`)
- **Data Retention**: 7-30 days for conversation logs, per GDPR

### PCI Compliance
- **Card Data**: Never store full card numbers
- **Tokenization**: Use payment tokens for transactions
- **Access Control**: Limit access to card data

### GDPR Compliance
- **Right to Access**: Users can request their data
- **Right to Deletion**: Users can request data deletion
- **Data Minimization**: Collect only necessary data
- **Consent**: Obtain consent for data processing

## Fallback Strategies

### NLU Failure
- **Fallback**: Default to `informational_query` intent
- **Escalation**: If confidence < 0.5, ask for clarification or escalate

### Action Failure
- **Retry**: Retry failed actions once (with exponential backoff)
- **Fallback**: Return error message, suggest contacting support

### Gemini API Failure
- **Fallback Response**: Use template-based responses
- **Escalation**: Route to human agent

### RAG Failure
- **Fallback**: Return generic response or escalate

### Channel Failure
- **Retry**: Retry webhook delivery (3 attempts)
- **Queue**: Queue messages for later delivery
- **Notification**: Alert user of delivery failure

## Escalation to Human

**Triggers**:
- `must_handoff: true` from NLU
- Intent = `escalate_to_human`
- Low confidence (<0.5) on critical actions
- User explicitly requests human agent
- Sensitive topics (debt collection, fraud, account closure)

**Process**:
1. Generate escalation message
2. Create support ticket (if integrated)
3. Transfer to human agent queue
4. Notify user of wait time
5. Maintain conversation context for agent

## Ethical & Safety Considerations

### Harmful Request Refusal
- **Detection**: NLU should flag harmful requests
- **Response**: Politely refuse and explain why
- **Examples**: Requests to commit fraud, bypass security, etc.

### Sensitive Cases
- **Debt Collection**: Always escalate to human
- **Fraud Reports**: Immediate escalation + security alert
- **Account Closure**: Escalate to retention specialist
- **Financial Hardship**: Escalate to hardship program specialist

### Bias Mitigation
- **Training Data**: Use diverse, representative data
- **Testing**: Test with diverse user groups
- **Monitoring**: Track outcomes by demographic (if available)

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Backend is stateless (except file I/O)
- **Load Balancer**: Use nginx or cloud load balancer
- **Multiple Instances**: Run multiple backend instances

### Database Scaling
- **Read Replicas**: For user data queries
- **Sharding**: By userId for large user bases
- **Caching**: Redis for hot data

### LLM Scaling
- **Batching**: Batch multiple requests to Gemini
- **Caching**: Cache common responses
- **Rate Limits**: Respect Gemini API rate limits
- **Fallback Models**: Use cheaper models for simple queries

## Deployment Architecture

### Recommended Setup
```
┌─────────────┐
│   CDN       │ (Static assets)
└─────────────┘
       │
┌─────────────┐
│ Load Balancer│
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│App 1│ │App 2│ (Backend instances)
└──┬──┘ └──┬──┘
   │       │
   └───┬───┘
       │
┌──────▼──────┐
│  Database  │ (PostgreSQL/MongoDB)
└──────┬──────┘
       │
┌──────▼──────┐
│   Redis     │ (Cache + Rate Limiting)
└─────────────┘
       │
┌──────▼──────┐
│  Vector DB  │ (Pinecone/Weaviate)
└─────────────┘
```

## Future Enhancements

1. **Vector Search**: Implement embeddings-based RAG
2. **Multi-language**: Support Spanish, Hindi, etc.
3. **Voice Biometrics**: Speaker identification for security
4. **Sentiment Analysis**: Detect user frustration, escalate if needed
5. **Proactive Messaging**: Alert users about due dates, suspicious activity
6. **A/B Testing**: Test different prompt templates
7. **Analytics Dashboard**: Track usage, satisfaction, common queries

