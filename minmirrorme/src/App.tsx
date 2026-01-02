import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Journal from './Journal';
import Blueprint from './blueprint';
import AiCoach from './AiCoach';
import Inspiration from './Inspiration';
import AiInsight from './AiInsight';
import UserProfile from './UserProfile';
import './App.css';
import './mobile.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function App() {
  const [activeTab, setActiveTab] = useState('aiCoach');
  const [coachMessages, setCoachMessages] = useState<Message[]>([]);
  const [starterPrompt, setStarterPrompt] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- NEW: Function to handle the "Update with AI Coach" button click ---
  const handleStartBlueprintUpdate = () => {
    setStarterPrompt("I want to update my blueprint");
    setActiveTab('aiCoach');
  };

  return (
    <div className="app-container">
      <Authenticator>
        {({ signOut }) => (
          <div className="main-layout">
            <nav className="sidebar-nav">
              <div className="sidebar-header">
                <h1>The Mind Mirror</h1>
                <p>Welcome to your own space</p>
              </div>
              <button className={`sidebar-button ${activeTab === 'aiCoach' ? 'active' : ''}`} onClick={() => setActiveTab('aiCoach')}>
                💬 Chat
              </button>
              <button className={`sidebar-button ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>
                📖 Thoughts
              </button>
              <button className={`sidebar-button ${activeTab === 'inspiration' ? 'active' : ''}`} onClick={() => setActiveTab('inspiration')}>
                ✨ Wisdom
              </button>
              <button className={`sidebar-button ${activeTab === 'aiInsight' ? 'active' : ''}`} onClick={() => setActiveTab('aiInsight')}>
                🧩 Patterns
              </button>
              <button className={`sidebar-button ${activeTab === 'blueprint' ? 'active' : ''}`} onClick={() => setActiveTab('blueprint')}>
                🎯 Core
              </button>
              
              <div className="sidebar-bottom">
                <button className="profile-button" onClick={() => setIsProfileOpen(true)}>
                  👤 Profile
                </button>
              </div>
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
            
            <UserProfile 
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              onSignOut={signOut}
            />
          </div>
        )}
      </Authenticator>
    </div>
  );
}

export default App;
