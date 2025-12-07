# Demo Script - GenAI Credit Card Assistant

**Duration**: 8-10 minutes  
**Format**: Loom screen recording with voiceover

---

## Pre-Demo Setup

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   - Verify: Server running on http://localhost:3001
   - Check: Health endpoint returns OK

2. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Verify: App running on http://localhost:5173
   - Check: UI loads without errors

3. **Open Files for Reference**
   - `infra/architecture.md`
   - `backend/controllers/nluController.js`
   - `backend/data/kb.json`
   - `tests/sample_queries.json`

---

## Demo Script (with Timestamps)

### [0:00 - 0:30] Introduction

**Script**:
"Hi, I'm [Your Name], and today I'm presenting my submission for the Product Manager Intern assignment: the GenAI Credit Card Assistant. This is an AI-powered customer support system that helps credit card users get answers and perform actions through natural language, across multiple channels like web, WhatsApp, and voice.

Let me show you what I've built."

**Screen**: Show README.md or project overview

---

### [0:30 - 1:30] Problem Statement & Value Proposition

**Script**:
"Credit card customers often have questions about their accounts, transactions, and billing. They want instant answers without waiting on hold. They also need to perform actions like activating cards, setting up autopay, or disputing charges.

Our assistant solves this by:
- Providing instant, accurate answers using AI
- Performing real actions through natural language
- Working across channels - web, mobile, WhatsApp, RCS, and phone
- Supporting both text and voice interactions

Let me show you how it works."

**Screen**: Show frontend app or architecture diagram

---

### [1:30 - 3:30] Architecture Walkthrough

**Script**:
"Let me walk you through the architecture. [Open architecture.md or diagram]

The system is channel-agnostic, meaning the same backend serves web, WhatsApp, RCS, and phone. Here's the flow:

1. **User sends a message** through any channel
2. **Channel adapter** normalizes the message format
3. **Message orchestrator** routes to the NLU layer
4. **NLU (Gemini)** extracts intent, slots, and confidence
5. **Decision point**: Is this informational or actionable?
   - If informational: RAG retrieves relevant KB items
   - If actionable: Action executor calls mock APIs
6. **Response generator (Gemini)** creates a natural response
7. **Channel adapter** formats for the target channel
8. **User receives response**

The key design principle is modularity - each component can be swapped independently. For example, we can replace Gemini with another LLM, or upgrade from keyword search to vector search for RAG."

**Screen**: 
- Show architecture.md
- Point to diagram (if available)
- Highlight key components

---

### [3:30 - 5:30] Code Walkthrough

**Script**:
"Let me show you the key code files. [Open backend/controllers/nluController.js]

Here's the NLU controller. It uses Gemini for intent detection and response generation. Notice the prompt templates - these are carefully crafted to extract structured JSON from user messages.

[Scroll to INTENT_DETECTION_PROMPT]

This prompt tells Gemini to return intent, slots, confidence, and whether human handoff is needed.

[Open backend/controllers/ragController.js]

The RAG retriever currently uses simple keyword matching, but I've documented how to upgrade to vector search using Pinecone or Weaviate.

[Open backend/routes/api.js]

These are the mock actionable APIs - activate card, set autopay, dispute transaction, and repay. They update the users.json file to simulate real backend operations.

[Open frontend/src/components/ChatWidget.jsx]

The frontend is built with React and Vite. The chat widget sends messages to the backend and displays responses with metadata like intent and confidence."

**Screen**: 
- Navigate through key files
- Highlight important functions
- Show prompt templates

---

### [5:30 - 7:30] Live Demo - Simulated Scenarios

**Script**:
"Now let me show you the assistant in action. [Open http://localhost:5173]

**Scenario 1: Card Activation**
[Type: "I want to activate my card"]
- Watch: Intent detected as 'activate_card'
- Watch: Action executed (card status updated)
- Watch: Response confirms activation

**Scenario 2: Informational Query**
[Type: "How does EMI work?"]
- Watch: Intent detected as 'informational_query'
- Watch: RAG retrieves relevant KB items
- Watch: Response explains EMI using KB content

**Scenario 3: Multi-step Action**
[Type: "Activate my card and set autopay for minimum amount"]
- Watch: Multiple intents detected
- Watch: Both actions executed
- Watch: Response confirms both actions

**Scenario 4: Voice Interaction**
[Switch to Voice tab, click Start Recording]
- Speak: "When will my card arrive?"
- Watch: Speech recognition transcribes
- Watch: Response generated and spoken back

**Scenario 5: Knowledge Base Viewer**
[Switch to KB tab]
- Show: 20 knowledge items across 6 categories
- Demonstrate: Search and category filter
- Show: Relevant content for each category"

**Screen**: 
- Interact with the app
- Show real-time responses
- Highlight metadata (intent, confidence)
- Demonstrate voice widget
- Show KB viewer

---

### [7:30 - 8:00] API Testing (Optional)

**Script**:
"Let me also show you the API endpoints work. [Open terminal]

[Run curl command to activate card]
```bash
curl -X POST http://localhost:3001/api/v1/activate-card \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "cardId": "card123"}'
```

[Show response]

[Run curl command for WhatsApp webhook simulation]
```bash
curl -X POST http://localhost:3001/api/v1/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"from": "+1234567890", "message": "I want to activate my card"}'
```

[Show response]"

**Screen**: 
- Terminal with curl commands
- Show API responses

---

### [8:00 - 8:30] Testing & Quality Assurance

**Script**:
"I've included comprehensive test materials:
- 30 sample queries covering all intent categories
- Test plan with manual and automated test cases
- Scoring checklist for reviewers

The system handles:
- Intent detection with >85% accuracy on test queries
- RAG retrieval of relevant KB items
- Action execution with proper error handling
- Multi-intent handling
- Escalation to human agents when needed"

**Screen**: 
- Show tests/sample_queries.json
- Show tests/test_plan.md
- Show tests/scoring_checklist.md

---

### [8:30 - 9:00] Next Steps & Q&A

**Script**:
"To run this locally:
1. Clone the repository
2. Install dependencies (`npm install` in backend and frontend)
3. Set your Gemini API key in `backend/.env`
4. Start backend and frontend
5. Open http://localhost:5173

For production, I'd recommend:
- Replacing file-based storage with a database
- Implementing vector search for improved RAG
- Adding proper authentication and authorization
- Setting up monitoring and analytics
- Integrating with real payment systems

I'm happy to answer any questions about the architecture, implementation, or design decisions. Thank you!"

**Screen**: 
- Show README.md setup instructions
- Show roadmap or future enhancements

---

## Key Points to Emphasize

1. **Channel-Agnostic Design**: Same backend serves all channels
2. **Modular Architecture**: Easy to swap components (LLM, RAG, actions)
3. **Production-Ready Structure**: Clear separation of concerns, error handling
4. **Comprehensive Documentation**: Architecture, API contracts, test plans
5. **Gemini Integration**: Proper prompt engineering and configuration

## Files to Have Open During Demo

1. **Terminal 1**: Backend logs (`npm run dev` in backend/)
2. **Terminal 2**: Frontend (optional, for API testing)
3. **Browser**: http://localhost:5173
4. **Code Editor**: 
   - `backend/controllers/nluController.js`
   - `backend/controllers/ragController.js`
   - `infra/architecture.md`
   - `tests/sample_queries.json`

## Troubleshooting Tips

- If backend fails to start: Check if port 3001 is available
- If frontend fails: Check if port 5173 is available
- If Gemini API errors: Verify API key is set in `.env`
- If voice doesn't work: Use Chrome or Edge (Web Speech API support)

---

## Recording Instructions

1. **Screen Recording**: Record entire screen or browser window
2. **Audio**: Use clear microphone, minimize background noise
3. **Pacing**: Speak clearly, pause between sections
4. **Highlights**: Use cursor to point to important elements
5. **Transitions**: Smooth transitions between sections
6. **Testing**: Test recording setup before starting

## Post-Recording

1. **Review**: Watch recording to ensure clarity
2. **Edit**: Trim any long pauses or errors
3. **Upload**: Upload to Loom/YouTube
4. **Share**: Include link in submission

---

**Good luck with your demo! 🚀**

