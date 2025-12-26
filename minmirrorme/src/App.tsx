import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Journal from './Journal';
import Blueprint from './blueprint';
import AiCoach from './AiCoach';
import Inspiration from './Inspiration';
import AiInsight from './AiInsight';
import './App.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function App() {
  const [activeTab, setActiveTab] = useState('aiCoach');
  const [coachMessages, setCoachMessages] = useState<Message[]>([]);
  // --- NEW: State for a starter prompt to send to the AI Coach ---
  const [starterPrompt, setStarterPrompt] = useState<string | null>(null);

  // --- NEW: Function to handle the "Update with AI Coach" button click ---
  const handleStartBlueprintUpdate = () => {
    // Set the starter prompt and switch to the AI Coach tab
    setStarterPrompt("I want to update my blueprint");
    setActiveTab('aiCoach');
  };

  return (
    <div className="app-container">
      <Authenticator>
        {({ signOut, user }) => (
          <div className="main-layout">
            <nav className="sidebar-nav">
              <div className="sidebar-header">
                <h1>Blueprint</h1>
                <p>Welcome, {user?.username}!</p>
              </div>
              <button className={`sidebar-button ${activeTab === 'aiCoach' ? 'active' : ''}`} onClick={() => setActiveTab('aiCoach')}>
                AI Coach
              </button>
              <button className={`sidebar-button ${activeTab === 'aiInsight' ? 'active' : ''}`} onClick={() => setActiveTab('aiInsight')}>
                AI Insight
              </button>
              <button className={`sidebar-button ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>
                Journal
              </button>
              <button className={`sidebar-button ${activeTab === 'blueprint' ? 'active' : ''}`} onClick={() => setActiveTab('blueprint')}>
                Blueprint
              </button>
              <button className={`sidebar-button ${activeTab === 'inspiration' ? 'active' : ''}`} onClick={() => setActiveTab('inspiration')}>
                Inspirations
              </button>
              <button onClick={signOut} className="signout-button-sidebar">
                Sign Out
              </button>
            </nav>

            <main className="content-area">
              <div className="tab-content">
                {activeTab === 'journal' && <Journal />}
                {/* --- NEW: Pass the handler function to the Blueprint component --- */}
                {activeTab === 'blueprint' && <Blueprint activeTab={activeTab} onStartUpdate={handleStartBlueprintUpdate} />}
                {activeTab === 'inspiration' && <Inspiration />}
                {/* --- NEW: Pass the starter prompt state to the AiCoach component --- */}
                {activeTab === 'aiCoach' && (
                  <AiCoach 
                    messages={coachMessages}
                    setMessages={setCoachMessages}
                    starterPrompt={starterPrompt}
                    setStarterPrompt={setStarterPrompt}
                  />
                )}
                {activeTab === 'aiInsight' && <AiInsight />}
              </div>
            </main>
          </div>
        )}
      </Authenticator>
    </div>
  );
}

export default App;
