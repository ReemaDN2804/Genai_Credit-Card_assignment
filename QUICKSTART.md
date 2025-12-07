# Quick Start Guide

Get the GenAI Credit Card Assistant running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm installed
- Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

## One-Command Setup

```bash
# Install all dependencies
npm run setup

# Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > backend/.env
echo "PORT=3001" >> backend/.env
echo "GEMINI_MODEL=gemini-pro" >> backend/.env

# Start both backend and frontend
npm run dev
```

That's it! The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Manual Setup (Step by Step)

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
PORT=3001
GEMINI_API_KEY=AIzaSyCWLMjHyBD07dc7tYYNMhv6axKOQEXq00E
GEMINI_MODEL=gemini-pro
NODE_ENV=development
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Start Backend

```bash
cd ../backend
npm run dev
```

You should see:
```
🚀 Backend server running on http://localhost:3001
```

### 5. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 6. Open the App

Open http://localhost:5173 in your browser.

## Test It Out

1. **Text Chat**: Type "I want to activate my card"
2. **Voice Chat**: Click the microphone button and speak
3. **Knowledge Base**: Browse the KB items

## Troubleshooting

### Backend won't start
- Check if port 3001 is available: `netstat -ano | findstr :3001` (Windows) or `lsof -i :3001` (Mac/Linux)
- Verify `.env` file exists in `backend/` directory

### Frontend won't start
- Check if port 5173 is available
- Try `npm run dev` again

### Gemini API errors
- Verify your API key is correct in `backend/.env`
- Check your API quota at https://makersuite.google.com/app/apikey
- The app will use mock responses if API key is not set

### Voice widget doesn't work
- Use Chrome or Edge browser (Web Speech API support)
- Allow microphone permissions when prompted

## Next Steps

- Read the full README.md for detailed documentation
- Check out `tests/sample_queries.json` for test queries
- Review `backend/docs/api_contracts.md` for API documentation
- See `demo/demo_script.md` for demo walkthrough

## Need Help?

- Check `README.md` for comprehensive documentation
- Review `tests/test_plan.md` for testing instructions
- See `infra/architecture.md` for system architecture

Happy coding! 🚀

