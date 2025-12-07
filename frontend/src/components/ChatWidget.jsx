import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/api';

function ChatWidget() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your credit card assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
      metadata: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // remove emojis helper (unicode safe)
  const removeEmojis = (text = '') => {
    try {
      return text.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, '').trim();
    } catch (e) {
      // If the environment doesn't support unicode property escapes, fallback to simple regex
      return text.replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2700}-\u{27BF}]/gu, '').trim();
    }
  };

  // handle messages dispatched from other parts of the app (optional)
  useEffect(() => {
    const handler = (ev) => {
      try {
        const detail = ev.detail;
        if (!detail) return;
        setMessages(prev => [
          ...prev,
          {
            role: detail.role || 'assistant',
            content: removeEmojis(detail.content || ''),
            metadata: detail.metadata || null,
            timestamp: detail.timestamp || new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error('assistantMessage handler error:', err);
      }
    };
    window.addEventListener('assistantMessage', handler);
    return () => window.removeEventListener('assistantMessage', handler);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const cleanUserText = removeEmojis(input);
    const userMessage = {
      role: 'user',
      content: cleanUserText,
      timestamp: new Date().toISOString()
    };

    // add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(cleanUserText, 'user1');

      // ensure message string
      const messageText = typeof response.message === 'string'
        ? response.message
        : (response.message?.toString?.() ?? 'Sorry, something went wrong.');

      const assistantMessage = {
        role: 'assistant',
        content: removeEmojis(messageText),
        metadata: response.metadata ?? null, // keep metadata for debugging but not shown in UI
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">
              <p>{msg.content}</p>
              {/* metadata hidden from UI intentionally */}
            </div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <p className="typing-indicator">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="chat-input"
          aria-label="Type your message"
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatWidget;
