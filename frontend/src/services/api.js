const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Sends a message to the backend and gets a response
 */
export async function sendMessage(message, userId = 'user1') {
  const response = await fetch(`${API_URL}/api/v1/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      userId,
      channel: 'web',
      conversationHistory: [] // TODO: Maintain conversation history
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetches the knowledge base
 */
export async function fetchKB() {
  const response = await fetch(`${API_URL}/static/kb.json`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch KB: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Calls a mock API endpoint
 */
export async function callAction(endpoint, data) {
  const response = await fetch(`${API_URL}/api/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

