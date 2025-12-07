# Scoring Checklist

Use this checklist to evaluate the GenAI Credit Card Assistant submission.

## Demo & Presentation

- [ ] **Demo video link provided** (Loom/YouTube link)
- [ ] **Demo runs successfully** (no crashes, errors visible)
- [ ] **Demo script followed** (8-10 minutes, covers all key features)
- [ ] **Architecture walkthrough included** (diagram shown and explained)
- [ ] **Code walkthrough included** (key files explained)

## Functionality

### Text Chat
- [ ] **Text chat widget works** (messages send and receive)
- [ ] **Intent detection works** (correctly identifies user intents)
- [ ] **Responses are generated** (AI responses appear)
- [ ] **Metadata displayed** (intent, confidence shown in UI)

### Voice Chat
- [ ] **Voice widget works** (microphone button functional)
- [ ] **Speech recognition works** (transcript appears)
- [ ] **Voice responses generated** (TTS speaks response)
- [ ] **Fallback to text works** (if voice fails, can type)

### Knowledge Base
- [ ] **KB viewer works** (items load and display)
- [ ] **Search works** (can search KB items)
- [ ] **Category filter works** (can filter by category)
- [ ] **KB items are relevant** (content matches categories)

## Backend & APIs

- [ ] **Backend starts successfully** (no errors on startup)
- [ ] **Health check works** (GET /health returns OK)
- [ ] **Message endpoint works** (POST /api/v1/message processes messages)
- [ ] **Mock APIs execute** (activate-card, set-autopay, dispute, repay work)
- [ ] **Webhook endpoint works** (POST /api/v1/webhook/:channel accepts requests)
- [ ] **Error handling works** (returns appropriate errors for invalid inputs)

## RAG & NLU

- [ ] **RAG returns relevant KB** (top 3 items match query)
- [ ] **Intent extraction works** (intents match expected values)
- [ ] **Slot extraction works** (cardId, txnId, amount extracted correctly)
- [ ] **Confidence scores reasonable** (0.7-1.0 for clear intents)
- [ ] **Multi-intent handling** (can handle "activate card and set autopay")

## Architecture & Documentation

- [ ] **Architecture diagram included** (drawio file or diagrams.net link)
- [ ] **Architecture.md explains components** (clear description of system)
- [ ] **Data flow documented** (user → NLU → orchestrator → actions → response)
- [ ] **Channel-agnostic design explained** (how web/WhatsApp/RCS/phone work)
- [ ] **RAG design explained** (keyword matching + vector DB upgrade path)

## Code Quality

- [ ] **README is clear** (setup instructions, tech stack, how to run)
- [ ] **Code is well-commented** (key functions explained)
- [ ] **Modular architecture** (clear separation of concerns)
- [ ] **Environment variables used** (no hardcoded secrets)
- [ ] **Error handling present** (try-catch blocks, graceful failures)

## Documentation

- [ ] **API contracts documented** (api_contracts.md with examples)
- [ ] **Sample queries provided** (30+ queries in sample_queries.json)
- [ ] **Test plan included** (test_plan.md with test cases)
- [ ] **Demo script provided** (demo_script.md with timestamps)
- [ ] **AI Co-Pilot report included** (explains Gemini/Cursor usage)

## Security & Privacy

- [ ] **Security considerations documented** (encryption, auth, PII handling)
- [ ] **Privacy constraints explained** (data retention, GDPR/PCI)
- [ ] **Ethical considerations included** (harmful request refusal, escalation)
- [ ] **Rate limiting mentioned** (recommendations provided)

## Gemini Integration

- [ ] **Prompt templates provided** (intent detection, response generation)
- [ ] **Gemini configuration documented** (model, hyperparameters)
- [ ] **Stub functions marked** (TODO comments for real API calls)
- [ ] **Example outputs included** (sample Gemini JSON responses)
- [ ] **LLM-agnostic design** (easy to swap Gemini for another LLM)

## Bonus Points

- [ ] **Vector search mentioned** (upgrade path to Pinecone/Weaviate)
- [ ] **Conversation history maintained** (context across messages)
- [ ] **Multi-language support** (mentioned or implemented)
- [ ] **Analytics/logging** (request logging, metrics)
- [ ] **Deployment instructions** (Docker, cloud setup)

## Overall Assessment

**Score**: ___ / 100

**Strengths**:
- 
- 
- 

**Areas for Improvement**:
- 
- 
- 

**Recommendation**: ✅ Approve / ❌ Needs Revision / ⚠️ Conditional Approval

---

## Notes

- Each checked item = 1 point (total ~50 base points)
- Bonus items = 2 points each
- Code quality and architecture = 20 points
- Demo quality = 15 points
- Documentation completeness = 15 points

**Scoring Guide**:
- 90-100: Excellent (production-ready with minor tweaks)
- 80-89: Very Good (solid implementation, some improvements needed)
- 70-79: Good (functional, but needs refinement)
- 60-69: Acceptable (meets minimum requirements)
- <60: Needs significant work

