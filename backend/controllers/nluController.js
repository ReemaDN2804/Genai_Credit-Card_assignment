// backend/controllers/nluController.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { retrieveKBItems } from './ragController.js';
import {
  activateCard,
  setAutopay,
  getCardStatus,
  disputeTransaction,
  repayAmount
} from './actionsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USERS_FILE = join(__dirname, '../data/users.json');

// -----------------------------------------------------------------------------
// Gemini caller: tries multiple candidate model IDs and falls back to mock
// -----------------------------------------------------------------------------
async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const defaultCandidates = [
    'gemini-1.5-flash',
    'gemini-1.5',
    'gemini-1.5-mini',
    'gemini-1.0',
    'gemini-pro'
  ];
  const envList = process.env.GEMINI_MODEL_CANDIDATES || process.env.GEMINI_MODEL || '';
  const candidates = envList
    ? envList.split(',').map(s => s.trim()).filter(Boolean)
    : defaultCandidates;

  if (!apiKey || apiKey === 'AIzaSyCWLMjHyBD07dc7tYYNMhv6axKOQEXq00E') {
    console.warn('[STUB] Gemini API key not configured. Using mock response.');
    return getMockGeminiResponse(prompt, options);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const generationConfig = {
      temperature: options.temperature ?? 0.3,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40,
      maxOutputTokens: options.maxTokens ?? 1024,
    };

    for (const candidate of candidates) {
      const trialIds = [candidate, `models/${candidate}`];
      for (const modelId of trialIds) {
        try {
          console.log(`[GEMINI] Trying model: ${modelId}`);
          const geminiModel = genAI.getGenerativeModel({ model: modelId });

          const resultPromise = await geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
          });

          const response = await resultPromise.response;

          let responseText;
          try {
            responseText = typeof response.text === 'function'
              ? await response.text()
              : (response?.text ?? (Array.isArray(response?.output) && response.output[0]?.content) ?? null);
          } catch (e) {
            responseText = response?.text ?? (Array.isArray(response?.output) && response.output[0]?.content) ?? null;
          }

          if (responseText && responseText.trim().length > 0 && responseText !== 'null') {
            console.log('[GEMINI] Success with model:', modelId);
            return responseText;
          } else {
            console.warn(`[GEMINI] Model ${modelId} returned empty/invalid response`);
          }
        } catch (err) {
          console.warn(`[GEMINI] model ${modelId} failed:`, err?.message ?? err);
        }
      }
    }

    console.error('[ERROR] All Gemini model candidates failed.');
    console.warn('[FALLBACK] Using mock response due to API error');
    return getMockGeminiResponse(prompt, options);

  } catch (error) {
    console.error('[ERROR] Gemini API call failed (setup/import):', error);
    console.warn('[FALLBACK] Using mock response due to API error');
    return getMockGeminiResponse(prompt, options);
  }
}

// -----------------------------------------------------------------------------
// Mock Gemini / NLU function
// - returns either a JSON string (intent detection) or a natural-language reply
// - tries to extract the actual user message from the prompt to avoid false matches
// -----------------------------------------------------------------------------
function getMockGeminiResponse(prompt, options) {
  let userMessage = null;

  try {
    const um1 = prompt.match(/User message:\s*"([^"]+)"/i);
    if (um1 && um1[1]) userMessage = um1[1].trim();

    if (!userMessage) {
      const um2 = prompt.match(/User'?s question[:\s]*"([^"]+)"/i);
      if (um2 && um2[1]) userMessage = um2[1].trim();
    }

    if (!userMessage) {
      const um3 = prompt.match(/"([^"]{3,})"/);
      if (um3 && um3[1]) userMessage = um3[1].trim();
    }

    if (!userMessage) {
      const lines = prompt.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        const ln = lines[i];
        if (ln.length > 2 && ln.length < 300 && !ln.toLowerCase().startsWith('conversation history')) {
          userMessage = ln;
          break;
        }
      }
    }
  } catch (e) {
    userMessage = null;
  }

  const lm = (userMessage || prompt || '').toLowerCase();

  try { console.log('[MOCK NLU] analyzing userMessage:', (userMessage || prompt || '').toString().slice(0, 400)); } catch (e) {}

  const moneyRegex = /(?:pay|payment|paying|i want to pay|i paid)\s*\$?([0-9]+(?:\.[0-9]{1,2})?)/i;

  // Response-generation route (natural language)
  if (lm.includes('generate the response') || lm.includes('user context') || lm.includes('knowledge base information') || lm.includes('generate response')) {
    const userMsgForResp = (userMessage || prompt).toLowerCase();

    if (/\b(balance|credit limit|account balance|what'?s my)\b/.test(userMsgForResp) &&
        !/\b(how|how do|how to|how does)\b/.test(userMsgForResp)) {
      return "Your current account balance is $1,250.50. Your credit limit is $5,000.00, and you have $3,749.50 in available credit. Would you like to see your recent transactions?";
    }

    if (/\bbill\b/.test(userMsgForResp) && /\bdue\b/.test(userMsgForResp)) {
      return "Your bill is due on the 20th of each month. You can find the exact due date on your monthly statement or in your online account dashboard. Would you like me to check your current statement details?";
    }

    if (/\bautopay\b|\bauto pay\b/.test(userMsgForResp)) {
      if (/\b(disable|turn off|stop|cancel)\b/.test(userMsgForResp)) {
        return "Autopay has been disabled for your account. You will need to make manual payments until you enable autopay again. Would you like to re-enable it?";
      } else {
        return "I've set up autopay for your account. Your payments will be processed automatically on the due date. You can modify or cancel this anytime in your account settings.";
      }
    }

    if (/\bactivate\b.*\bcard\b/.test(userMsgForResp) && !/\bhow\b/.test(userMsgForResp)) {
      return "I've activated your card ending in 1234. You can start using it immediately! Is there anything else I can help you with?";
    }

    return "I understand your question. Based on your account information, I can help you with that. Let me provide you with the details you need.";
  }

  // Intent-detection route (returns JSON string)
  // 1) Dispute/fraud
  if (/\b(dispute|unauthoriz|unauthorized|fraud|wrong charge|chargeback|refund)\b/.test(lm) &&
      !/\b(show|recent|view|list)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'dispute_transaction',
      slots: { txnId: 'txn456' },
      confidence: 0.92,
      must_handoff: false,
      suggested_actions: ['dispute_transaction']
    });
  }

  // 2) Autopay commands
  if (/\b(set up autopay|enable autopay|disable autopay|turn on autopay|turn off autopay|cancel autopay|stop autopay|autopay)\b/.test(lm)) {
    const isDisable = /\b(disable|turn off|stop|cancel)\b/.test(lm);
    return JSON.stringify({
      intent: 'set_autopay',
      slots: { enabled: !isDisable },
      confidence: 0.9,
      must_handoff: false,
      suggested_actions: ['set_autopay']
    });
  }

  // 3) Make payment / capture amount
  const payMatch = (userMessage || '').match(moneyRegex) || (prompt || '').match(moneyRegex);
  if (payMatch) {
    return JSON.stringify({
      intent: 'make_payment',
      slots: { amount: parseFloat(payMatch[1]), method: 'default' },
      confidence: 0.92,
      must_handoff: false,
      suggested_actions: ['make_payment']
    });
  }

  // 4) Minimum payment / statement
  if (/\b(minimum payment|min payment|min due|minimum due)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'check_statement',
      slots: {},
      confidence: 0.88,
      must_handoff: false,
      suggested_actions: []
    });
  }

  // 5) Card delivery / tracking
  if ((/\b(when will my card|when will card arrive|card arrive|card delivery|where is my card|track my card|track card delivery|tracking)\b/.test(lm)) &&
      !/\b(how do i|how to|how does)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'check_card_delivery',
      slots: {},
      confidence: 0.90,
      must_handoff: false,
      suggested_actions: ['get_card_status']
    });
  }

  // 6) Transactions / viewing history
  if (/\b(recent transactions|show my transactions|transaction history|view transactions|list transactions|pending and posted)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'informational_query',
      slots: {},
      confidence: 0.9,
      must_handoff: false,
      suggested_actions: []
    });
  }

  // 7) EMI / explanation
  if (/\b(emi|equated monthly installment|how does emi work|how emi works)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'informational_query',
      slots: {},
      confidence: 0.9,
      must_handoff: false,
      suggested_actions: []
    });
  }

  // 8) Bill & statement
  if (/\b(bill|statement|payment due|due date|download my statement|explain my statement)\b/.test(lm) &&
      !/\b(card|activate)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'check_statement',
      slots: {},
      confidence: 0.9,
      must_handoff: false,
      suggested_actions: []
    });
  }

  // 9) Collections / late fee
  if (/\b(late fee|late fees|missed my payment|missed payment|what happens if i miss|collections)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'collections_query',
      slots: {},
      confidence: 0.88,
      must_handoff: false,
      suggested_actions: []
    });
  }

  // 10) Activate card explicit
  if (/\b(i want to activate my card|activate my card|activate card|activation)\b/.test(lm) &&
      !/\b(how do i|how to)\b/.test(lm)) {
    return JSON.stringify({
      intent: 'activate_card',
      slots: { cardId: 'card123' },
      confidence: 0.95,
      must_handoff: false,
      suggested_actions: ['activate_card']
    });
  }

  // default
  return JSON.stringify({
    intent: 'informational_query',
    slots: {},
    confidence: 0.75,
    must_handoff: false,
    suggested_actions: []
  });
}

// -----------------------------------------------------------------------------
// Prompt templates
// -----------------------------------------------------------------------------
const INTENT_DETECTION_PROMPT = `You are an NLU system for a credit card assistant. Analyze the user's message and extract:
1. Intent (one of: activate_card, set_autopay, dispute_transaction, check_card_delivery, check_balance, check_statement, make_payment, informational_query, escalate_to_human)
2. Slots (key-value pairs like cardId, txnId, amount, etc.)
3. Confidence score (0.0-1.0)
4. Whether human handoff is needed (must_handoff: boolean)
5. Suggested actions (array of action names)

Return ONLY valid JSON in this exact format:
{
  "intent": "string",
  "slots": {},
  "confidence": 0.0-1.0,
  "must_handoff": boolean,
  "suggested_actions": []
}

User message: "{userMessage}"

Conversation history (last 3 messages):
{conversationHistory}

Available intents:
- activate_card: User wants to activate their credit card
- set_autopay: User wants to enable/disable automatic payments
- dispute_transaction: User wants to dispute a charge
- check_card_delivery: User asks about card delivery status
- check_balance: User asks about account balance
- check_statement: User asks about statements
- make_payment: User wants to make a payment
- informational_query: General questions (use RAG)
- escalate_to_human: Complex issues requiring human agent

Response (JSON only):`;

const RESPONSE_GENERATION_PROMPT = `You are a helpful credit card assistant. Generate a natural, conversational response to the user's question.

User's question: "{userMessage}"

User context:
{userContext}

Relevant knowledge base information:
{kbSnippets}

Action results (if any):
{actionResults}

Guidelines:
- Be concise and friendly
- Use the user's name if available
- If action was performed, confirm it clearly
- If information is from KB, present it naturally (don't quote verbatim)
- If escalation is needed, explain why and what to expect
- For voice responses, keep sentences short and clear

Generate the response:`;

// -----------------------------------------------------------------------------
// Main message handler
// -----------------------------------------------------------------------------
export async function handleMessage({ message, userId, channel, conversationHistory = [] }) {
  console.log(`[NLU] Processing message: "${message}" (user: ${userId}, channel: ${channel})`);

  // 1) Intent detection prompt
  const intentPrompt = INTENT_DETECTION_PROMPT
    .replace('{userMessage}', message)
    .replace('{conversationHistory}', JSON.stringify(conversationHistory.slice(-3), null, 2));

  let nluResult;
  try {
    const nluResponse = await callGemini(intentPrompt, { temperature: 0.2, maxTokens: 512 });
    nluResult = JSON.parse(nluResponse);
    console.log('[NLU] Intent detected:', nluResult);
  } catch (error) {
    console.error('[ERROR] Intent detection failed:', error);
    nluResult = {
      intent: 'informational_query',
      slots: {},
      confidence: 0.5,
      must_handoff: false,
      suggested_actions: []
    };
  }

  // 2) Escalation check
  if (nluResult.must_handoff || nluResult.intent === 'escalate_to_human') {
    return {
      message: "I understand this is a complex issue. Let me connect you with a human agent who can better assist you. Please hold while I transfer your call, or you can call our support line at 1-800-XXX-XXXX.",
      metadata: {
        intent: nluResult.intent,
        escalated: true,
        channel,
        timestamp: new Date().toISOString()
      }
    };
  }

  // 3) Load user context (best-effort)
  let userContext = {};
  try {
    const users = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
    userContext = users[userId] || {};
  } catch (error) {
    console.warn('[WARN] Could not load user context:', error);
  }

  // 4) Execute actions if required
  let actionResults = null;
  const intent = nluResult.intent;
  const slots = nluResult.slots || {};

  try {
    if (intent === 'activate_card') {
      const cardId = slots.cardId || userContext.cards?.[0]?.cardId;
      if (cardId) actionResults = await activateCard(userId, cardId);
    } else if (intent === 'set_autopay') {
      const accountId = slots.accountId || userContext.accounts?.[0]?.accountId || 'acc_demo';
      const enabled = slots.enabled !== undefined ? slots.enabled : true;
      actionResults = await setAutopay(userId, accountId, enabled);
    } else if (intent === 'dispute_transaction') {
      const txnId = slots.txnId;
      const reason = slots.reason || 'Unauthorized charge';
      if (txnId) actionResults = await disputeTransaction(userId, txnId, reason);
    } else if (intent === 'check_card_delivery') {
      const cardId = slots.cardId || userContext.cards?.[0]?.cardId || 'card123';
      actionResults = await getCardStatus(cardId, userId);
    } else if (intent === 'make_payment') {
      const amount = slots.amount;
      const method = slots.method || 'bank_transfer';
      if (amount) actionResults = await repayAmount(userId, amount, method);
    }
  } catch (e) {
    console.warn('[WARN] action execution error:', e);
    actionResults = { success: false, error: String(e) };
  }

  // 5) Retrieve KB snippets for RAG
  const kbSnippets = await retrieveKBItems(message, 3).catch(e => {
    console.warn('[WARN] RAG retrieval failed:', e);
    return [];
  });
  console.log('[RAG] Retrieved KB items:', kbSnippets.length);

  // 6) Generate final response
  const responsePrompt = RESPONSE_GENERATION_PROMPT
    .replace('{userMessage}', message)
    .replace('{userContext}', JSON.stringify(userContext, null, 2))
    .replace('{kbSnippets}', JSON.stringify(kbSnippets, null, 2))
    .replace('{actionResults}', actionResults ? JSON.stringify(actionResults, null, 2) : 'None');

  let finalResponse;
  try {
    finalResponse = await callGemini(responsePrompt, { temperature: 0.7, maxTokens: 512 });
    console.log('[RESPONSE] Generated (raw):', finalResponse);
    if (!finalResponse || finalResponse === 'null') {
      finalResponse = generateFallbackResponse(intent, actionResults, kbSnippets);
    }
  } catch (error) {
    console.error('[ERROR] Response generation failed:', error);
    finalResponse = generateFallbackResponse(intent, actionResults, kbSnippets);
  }

  // ----------------------------
  // Ensure finalResponse is a user-friendly string.
  // If the model (or NLU) returned a JSON string (intent object), convert it
  // into a short, readable message so the frontend shows a clean bubble.
  // ----------------------------
  try {
    if (typeof finalResponse === 'string') {
      const trimmed = finalResponse.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsedNLU = JSON.parse(trimmed);
        if (parsedNLU && parsedNLU.intent) {
          const jIntent = parsedNLU.intent;
          const jSlots = parsedNLU.slots || {};

          switch (jIntent) {
            case 'make_payment': {
              const amt = jSlots.amount ?? null;
              finalResponse = amt ? `Payment of $${amt} initiated.` : 'Payment initiated.';
              break;
            }
            case 'set_autopay': {
              const enabled = jSlots.enabled;
              finalResponse = enabled === false ? "Autopay disabled for your account." : "Autopay enabled for your account.";
              break;
            }
            case 'activate_card': {
              finalResponse = "Your card has been activated and is ready to use.";
              break;
            }
            case 'check_balance': {
              finalResponse = "Your current balance is $1,250.50 and available credit is $3,749.50.";
              break;
            }
            case 'check_statement': {
              finalResponse = "Your bill is due on the 20th of each month. Would you like me to check your latest statement?";
              break;
            }
            case 'check_card_delivery': {
              finalResponse = "New cards are typically delivered within 7-10 business days. Would you like me to check delivery status?";
              break;
            }
            case 'dispute_transaction': {
              finalResponse = "I've started a dispute for that transaction. Our team will follow up within 3 business days.";
              break;
            }
            case 'informational_query': {
              finalResponse = generateFallbackResponse(jIntent, actionResults, kbSnippets);
              break;
            }
            default: {
              finalResponse = generateFallbackResponse(jIntent, actionResults, kbSnippets) || 'I understand. Let me help with that.';
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[WARN] Could not normalize finalResponse:', e);
  }

  return {
    message: finalResponse,
    metadata: {
      intent: nluResult.intent,
      confidence: nluResult.confidence,
      slots: nluResult.slots,
      actionResults,
      kbItemsUsed: kbSnippets.length,
      channel,
      timestamp: new Date().toISOString()
    }
  };
}

// -----------------------------------------------------------------------------
// Fallback response generator
// -----------------------------------------------------------------------------
function generateFallbackResponse(intent, actionResults, kbSnippets) {
  if (actionResults && actionResults.success && actionResults.message) {
    return `I've ${actionResults.message}. Is there anything else I can help with?`;
  }

  if (kbSnippets && kbSnippets.length > 0) {
    const kbContent = kbSnippets[0].content;
    const sentences = kbContent.split(/[.!?]/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      const response = sentences.slice(0, 3).join('. ') + '.';
      return response;
    }
    return kbContent.substring(0, 300);
  }

  if (intent === 'check_statement') {
    return "Your bill due date is typically the same day each month. You can find your exact due date on your monthly statement or in your online account dashboard. Would you like me to check your current statement details?";
  }

  if (intent === 'check_balance') {
    return "Your current account balance is $1,250.50. Your credit limit is $5,000.00, and you have $3,749.50 in available credit. Would you like to see your recent transactions?";
  }

  if (intent === 'collections_query') {
    return "Late fees depend on your plan. Typically a late fee is $25 or 5% of the outstanding amount (whichever is higher). You may also face interest on the unpaid balance — would you like me to check your current late fees?";
  }

  if (intent === 'informational_query' || intent === 'check_card_delivery') {
    if (kbSnippets && kbSnippets.length > 0) {
      const kbContent = kbSnippets[0].content;
      const sentences = kbContent.split(/[.!?]/).filter(s => s.trim().length > 20);
      if (sentences.length > 0) {
        const response = sentences.slice(0, 3).join('. ') + '.';
        return response;
      }
      return kbContent.substring(0, 300);
    }

    if (intent === 'check_card_delivery') {
      return "New cards are typically delivered within 7-10 business days after approval. You'll receive tracking information via email or SMS once your card ships. Would you like me to check the status of your card delivery?";
    }

    return "I understand your question. Let me provide you with the information you need.";
  }

  return "I understand your question. Let me connect you with a specialist who can provide more detailed assistance.";
}

// -----------------------------------------------------------------------------
// Webhook handler for external channels
// -----------------------------------------------------------------------------
export async function handleWebhook(channel, webhookData) {
  const message = webhookData.message || webhookData.text || webhookData.body;
  const userId = webhookData.from || webhookData.userId;
  const conversationHistory = webhookData.conversationHistory || [];

  return await handleMessage({
    message,
    userId,
    channel,
    conversationHistory
  });
}

// -----------------------------------------------------------------------------
// Test harness: runNLUTests()
// -----------------------------------------------------------------------------
export async function runNLUTests() {
  console.log('\n=== Starting NLU test suite ===\n');

  const testSuites = [
    {
      category: 'Account & Onboarding',
      queries: [
        "I want to activate my card",
        "How do I activate my credit card?",
        "What's my account balance?",
        "Show me my credit limit"
      ]
    },
    {
      category: 'Card Delivery',
      queries: [
        "When will my card arrive?",
        "Where is my card?",
        "How long does card delivery take?",
        "Track my card delivery"
      ]
    },
    {
      category: 'Transaction & EMI',
      queries: [
        "I want to dispute this charge",
        "This transaction is unauthorized",
        "How does EMI work?",
        "Show me my recent transactions",
        "What's the difference between pending and posted transactions?"
      ]
    },
    {
      category: 'Bill & Statement',
      queries: [
        "When is my bill due?",
        "How do I download my statement?",
        "Explain my statement"
      ]
    },
    {
      category: 'Repayments',
      queries: [
        "I want to set up autopay",
        "Enable autopay for minimum amount",
        "How do I make a payment?",
        "I want to pay $100",
        "What's my minimum payment?",
        "How is minimum payment calculated?",
        "Disable autopay"
      ]
    },
    {
      category: 'Collections',
      queries: [
        "What's the late fee?",
        "I missed my payment, what happens?"
      ]
    },
    {
      category: 'Multi-Intent',
      queries: [
        "I want to activate my new card and set autopay for minimum amount"
      ]
    }
  ];

  let total = 0;
  for (const suite of testSuites) {
    console.log(`\n--- Category: ${suite.category} ---`);
    for (const q of suite.queries) {
      total++;
      try {
        const res = await handleMessage({ message: q, userId: 'test-user', channel: 'test', conversationHistory: [] });
        console.log(`\n[${total}] Query: "${q}"`);
        console.log('  -> Detected intent:', (res.metadata && res.metadata.intent) || 'N/A');
        console.log('  -> Confidence:', (res.metadata && res.metadata.confidence) ?? 'N/A');
        console.log('  -> ActionResults:', JSON.stringify((res.metadata && res.metadata.actionResults) || null));
        console.log('  -> KB items used:', (res.metadata && res.metadata.kbItemsUsed) ?? '0');
        console.log('  -> Message:\n', res.message);
      } catch (err) {
        console.error(`\n[${total}] Query failed: "${q}"`, err);
      }
    }
  }

  console.log(`\n=== Completed ${total} tests ===\n`);
  return true;
}
