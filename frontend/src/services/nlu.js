/**
 * NLU Service - Gemini Integration
 * 
 * This file contains prompt templates and integration points for Gemini AI.
 * Replace the stub functions with actual Gemini API calls.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Intent Detection Prompt Template
 * 
 * This prompt is sent to Gemini to extract intent, slots, and confidence.
 * 
 * TODO: Replace with direct Gemini API call if needed on frontend
 * For now, this is handled by the backend (see backend/controllers/nluController.js)
 */
export const INTENT_DETECTION_PROMPT_TEMPLATE = `You are an NLU system for a credit card assistant. Analyze the user's message and extract:
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

/**
 * Response Generation Prompt Template
 * 
 * This prompt is sent to Gemini to generate the final user-facing response.
 */
export const RESPONSE_GENERATION_PROMPT_TEMPLATE = `You are a helpful credit card assistant. Generate a natural, conversational response to the user's question.

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

/**
 * Voice-to-Text Correction Prompt
 * 
 * Use this to correct noisy ASR output before intent detection.
 */
export const ASR_CORRECTION_PROMPT_TEMPLATE = `Correct any errors in this speech-to-text transcription. 
The user is asking about credit card services (activation, payments, disputes, delivery, etc.).

Original transcription: "{asrText}"

Return only the corrected text, no explanation:`;

/**
 * SSML Generation Prompt for TTS
 * 
 * Use this to generate SSML for better text-to-speech output.
 */
export const SSML_GENERATION_PROMPT_TEMPLATE = `Convert this response into SSML format for text-to-speech.
Use appropriate pauses, emphasis, and prosody for a natural voice experience.

Response text: "{responseText}"

Return SSML only:`;

/**
 * Example: Direct Gemini API call (for reference)
 * 
 * TODO: Uncomment and configure when ready to use Gemini directly from frontend
 * 
 * async function callGeminiDirect(prompt, options = {}) {
 *   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
 *   const model = options.model || 'gemini-pro';
 *   
 *   const response = await fetch(
 *     `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
 *     {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *       },
 *       body: JSON.stringify({
 *         contents: [{
 *           parts: [{ text: prompt }]
 *         }],
 *         generationConfig: {
 *           temperature: options.temperature || 0.3,
 *           topP: 0.95,
 *           topK: 40,
 *           maxOutputTokens: options.maxTokens || 1024,
 *         }
 *       })
 *     }
 *   );
 *   
 *   if (!response.ok) {
 *     throw new Error(`Gemini API error: ${response.statusText}`);
 *   }
 *   
 *   const data = await response.json();
 *   return data.candidates[0].content.parts[0].text;
 * }
 */

/**
 * Frontend NLU call (delegates to backend)
 * 
 * For this demo, NLU is handled by the backend. This function is kept
 * for potential future frontend-side NLU processing.
 */
export async function detectIntent(message, conversationHistory = []) {
  // For now, delegate to backend
  const response = await fetch(`${API_URL}/api/v1/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      userId: 'user1',
      channel: 'web',
      conversationHistory
    }),
  });

  if (!response.ok) {
    throw new Error(`NLU API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.metadata; // Returns intent, slots, confidence, etc.
}

/**
 * Gemini Configuration Recommendations
 * 
 * Model: gemini-pro (for text generation) or gemini-pro-vision (for multimodal)
 * Embeddings: embedding-001 (for RAG vector search)
 * 
 * Hyperparameters:
 * - Temperature: 0.2-0.3 for intent detection (more deterministic)
 * - Temperature: 0.7-0.9 for response generation (more creative)
 * - Max output tokens: 512-1024 for responses
 * - Top-p: 0.95
 * - Top-k: 40
 * 
 * Few-shot examples for intent parsing:
 * - "I want to activate my card" -> activate_card
 * - "Set up autopay for minimum amount" -> set_autopay
 * - "Dispute this charge" -> dispute_transaction
 * - "When will my card arrive?" -> check_card_delivery
 */

