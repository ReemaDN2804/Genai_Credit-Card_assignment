
# GenAI Credit Card Assistant

A comprehensive AI-powered credit card assistant that provides intelligent customer support across multiple channels (web, mobile, WhatsApp, RCS) and interfaces (text and voice). Built with Node.js, Express, React, and Google Gemini AI.

## Value Proposition

This assistant helps credit card customers:
- **Get instant answers** to account, transaction, and billing questions via natural language
- **Perform actions** like card activation, autopay setup, dispute transactions, and repayments
- **Access support** through their preferred channel (web, app, WhatsApp, RCS) and medium (text or voice)
- **Receive personalized responses** based on account context and transaction history

## Tech Stack

### Backend
- **Node.js + Express**: Lightweight, fast, and widely supported
- **Google Gemini AI**: Advanced NLU and response generation capabilities
- **JSON-based storage**: Simple file-based persistence for demo (easily replaceable with databases)

### Frontend
- **Vite + React**: Fast development experience, modern tooling
- **Web Speech API**: Browser-based ASR and TTS for voice interactions
- **Modern CSS**: Clean, responsive UI

### Why This Stack?
- **Minimal dependencies**: Easy to set up and run locally
- **LLM-agnostic design**: Easy to swap Gemini for OpenAI, Claude, or others
- **Modular architecture**: Clear separation between NLU, orchestration, RAG, and action execution
- **Channel-agnostic**: Single backend serves web, WhatsApp, RCS, and phone

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd genai-creditcard-assistant
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-pro
   NODE_ENV=development
   ```

   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start the application**
   
   **Option 1: Run separately**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

   **Option 2: One-command setup (after initial npm install)**
   ```bash
   npm run setup && npm run dev
   ```
   *(Note: You'll need to add a root-level package.json with these scripts - see below)*

5. **Access the application**
   - Frontend: http://localhost:5173 (Vite default)
   - Backend API: http://localhost:3001
   - API Docs: See `backend/docs/api_contracts.md`

## Project Structure

```
genai-creditcard-assistant/
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   ├── routes/
│   │   └── api.js
│   ├── controllers/
│   │   ├── actionsController.js
│   │   ├── nluController.js
│   │   └── ragController.js
│   ├── data/
│   │   ├── kb.json
│   │   └── users.json
│   └── docs/
│       └── api_contracts.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── ChatWidget.jsx
│       │   ├── VoiceWidget.jsx
│       │   └── KBViewer.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── nlu.js
│       └── styles.css
├── demo/
│   ├── demo_script.md
│   └── demo_recording_instructions.md
└── tests/
    ├── sample_queries.json
    └── test_plan.md
```

## Running Tests

### Sample Queries
Test the assistant with pre-defined queries:
```bash
cd tests
node -e "const queries = require('./sample_queries.json'); console.log(JSON.stringify(queries, null, 2))"
```

### Manual Testing
1. Open the frontend at http://localhost:5173
2. Try queries from `tests/sample_queries.json`
3. Test voice input using the VoiceWidget
4. Verify mock API calls in backend logs

### Simulating Channels

**WhatsApp Webhook (mock):**
```bash
curl -X POST http://localhost:3001/api/v1/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "I want to activate my card"
  }'
```

**Direct API calls:**
```bash
# Activate card
curl -X POST http://localhost:3001/api/v1/activate-card \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "cardId": "card123"}'

# Dispute transaction
curl -X POST http://localhost:3001/api/v1/dispute \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "txnId": "txn456", "reason": "Unauthorized charge"}'
```

See `backend/docs/api_contracts.md` for complete API documentation.

## Replacing Gemini with Another LLM

The codebase is designed to be LLM-agnostic. To swap Gemini for another provider:

1. **Update NLU service** (`backend/controllers/nluController.js`):
   - Replace `callGemini()` with your LLM's API call
   - Keep the same input/output interface: `(prompt) => Promise<JSON>`

2. **Update response generator** (`backend/controllers/nluController.js`):
   - Modify the `generateResponse()` function to use your LLM
   - Ensure it accepts: `(userMessage, context, kbSnippets, actionResults) => Promise<string>`

3. **Update environment variables**:
   ```env
   LLM_PROVIDER=openai  # or claude, anthropic, etc.
   LLM_API_KEY=your_key
   LLM_MODEL=gpt-4
   ```

4. **Update prompt templates**: Modify prompt strings in `backend/controllers/nluController.js` to match your LLM's preferred format.

The orchestrator (`server.js`) remains unchanged - it only calls the NLU service interface.


## Security & Privacy

See `infra/architecture.md` for detailed security considerations:
- Encryption at rest and in transit (HTTPS/TLS)
- Authentication tokens and role-based access
- PII handling and data masking
- Data retention (7-30 days for logs)
- GDPR/PCI compliance considerations
- Rate limiting recommendations

## Key Features

- **Multi-channel support**: Web, mobile app, WhatsApp, RCS, phone
- **Multi-modal**: Text and voice interactions
- **Intent recognition**: Extracts user intent and slots from natural language
- **RAG-powered**: Retrieves relevant knowledge base items for context
- **Action execution**: Performs real actions (card activation, autopay, disputes, repayments)
- **Personalization**: Uses user context from account data
- **Fallback handling**: Escalates to human agents when needed

## Demo

See `demo/demo_script.md` for a complete 8-10 minute walkthrough script.

##  Scoring Checklist

See `tests/scoring_checklist.md` for reviewer evaluation criteria.

## Roadmap

- Vector database integration (Pinecone/Weaviate) for improved RAG
- Voice processing (noise reduction, speaker identification)
- A/B testing framework for prompt optimization

## License

MIT License - see LICENSE file for details

## Contributing

This is a demo project for a Product Manager Intern assignment. For production use, consider:
- Database integration (PostgreSQL/MongoDB)
- Redis for caching
- Proper authentication/authorization
- Monitoring and observability (Datadog, New Relic)
- CI/CD pipeline

## Contact

For questions or issues, please open a GitHub issue.
=======
# Genai_Credit-Card_assignment
GenAI-powered Credit Card Assistant — product assignment prototype with chat + voice bot, mock APIs, RAG knowledge base, and channel-agnostic architecture.
