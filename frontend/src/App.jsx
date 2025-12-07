import { useState } from 'react';
import ChatWidget from './components/ChatWidget';
import VoiceWidget from './components/VoiceWidget';
import KBViewer from './components/KBViewer';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app">
      <header className="app-header">
        <h1> GenAI Credit Card Assistant</h1>
        <p>Your intelligent assistant for all credit card needs</p>
      </header>

      <nav className="tab-nav">
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
           Text Chat
        </button>
        <button
          className={activeTab === 'voice' ? 'active' : ''}
          onClick={() => setActiveTab('voice')}
        >
           Voice Chat
        </button>
        <button
          className={activeTab === 'kb' ? 'active' : ''}
          onClick={() => setActiveTab('kb')}
        >
           Knowledge Base
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'chat' && <ChatWidget />}
        {activeTab === 'voice' && <VoiceWidget />}
        {activeTab === 'kb' && <KBViewer />}
      </main>

      <footer className="app-footer">
        <p>Demo for Product Manager Intern Assignment</p>
      </footer>
    </div>
  );
}

export default App;

