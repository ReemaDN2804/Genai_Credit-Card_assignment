import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import apiRoutes from './routes/api.js';
import { handleMessage, handleWebhook } from './controllers/nluController.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`, req.body || '');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', apiRoutes);

// Main message endpoint (text chat)
app.post('/api/v1/message', async (req, res) => {
  try {
    const { message, userId, channel, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[NLU] Processing message from user ${userId || 'anonymous'}: "${message}"`);
    
    const response = await handleMessage({
      message,
      userId: userId || 'anonymous',
      channel: channel || 'web',
      conversationHistory: conversationHistory || []
    });

    res.json(response);
  } catch (error) {
    console.error('[ERROR] Message handling failed:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: error.message 
    });
  }
});

// Webhook endpoint for external channels (WhatsApp, RCS, etc.)
app.post('/api/v1/webhook/:channel', async (req, res) => {
  try {
    const { channel } = req.params;
    const webhookData = req.body;

    console.log(`[WEBHOOK] Received ${channel} webhook:`, webhookData);

    // Extract message and user info from webhook payload
    // Format varies by channel - this is a generic adapter
    const message = webhookData.message || webhookData.text || webhookData.body;
    const userId = webhookData.from || webhookData.userId || webhookData.phone;
    const conversationHistory = webhookData.conversationHistory || [];

    if (!message) {
      return res.status(400).json({ error: 'Message not found in webhook payload' });
    }

    const response = await handleMessage({
      message,
      userId: userId || 'anonymous',
      channel,
      conversationHistory
    });

    // Return response in channel-specific format
    res.json({
      success: true,
      response: response.message,
      metadata: response.metadata
    });
  } catch (error) {
    console.error(`[ERROR] Webhook handling failed for ${req.params.channel}:`, error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: error.message 
    });
  }
});

// Serve static files (for KB viewer, etc.)
app.use('/static', express.static(join(__dirname, 'data')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR] Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Message endpoint: http://localhost:${PORT}/api/v1/message`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/v1/webhook/:channel`);
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not set. NLU will use mock responses.');
  }
});

