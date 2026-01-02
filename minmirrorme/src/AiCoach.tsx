import { useState, useEffect } from 'react';
import { post } from 'aws-amplify/api';

// Define the structure for a single chat message
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define the type for the expected API response
type AiResponse = {
  aiResponse: string;
};

// --- THIS IS THE FIX (Part 1) ---
// Add the new starterPrompt props to the type definition.
type AiCoachProps = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  starterPrompt: string | null;
  setStarterPrompt: React.Dispatch<React.SetStateAction<string | null>>;
};

const AiCoach: React.FC<AiCoachProps> = ({ messages, setMessages, starterPrompt, setStarterPrompt }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const processMessage = async (messageToSend: string) => {
    setIsLoading(true);
    setError('');

    const newMessages: Message[] = [...messages, { role: 'user', content: messageToSend }];
    if (messageToSend) {
        setMessages(newMessages);
    }
    
    try {
      const restOperation = post({
        apiName: 'Blueprint-API',
        path: '/chat',
        options: {
          body: {
            messages: messages,
            userMessage: messageToSend,
          },
        },
      });
      const { body } = await restOperation.response;
      
      if (body) {
        const response = (await body.json()) as AiResponse;
        if (response.aiResponse) {
          const aiMsg: Message = { role: 'assistant', content: response.aiResponse };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          setError('The AI returned an empty response.');
        }
      } else {
        setError('The server returned an empty response.');
      }

    } catch (err) {
      console.error('Chat call failed:', err);
      setError('An error occurred during the conversation. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- THIS IS THE FIX (Part 2) ---
  // This new effect watches for the starterPrompt. If it exists,
  // it sends it as a message and then clears it.
  useEffect(() => {
    if (starterPrompt) {
      processMessage(starterPrompt);
      setStarterPrompt(null); // Clear the prompt so it doesn't run again
    }
    // Removed automatic empty message call
  }, [starterPrompt]);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    processMessage(currentMessage);
    setCurrentMessage('');
  };

  return (
    <div className="ai-coach-container">
      <h2>Your Safe Space</h2>
      <p>I am here to listen, organize your thoughts, or help you plan. No judgment, just support.</p>
      
      {error && <p className="status-message error">{error}</p>}

      <div className="chat-input-area">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          placeholder="Type whatever is on your mind..."
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>

      <div id="chat-container" className="chat-window">
        {messages.map((msg, index) => (
          msg.content && (
            <div key={index} className={`chat-bubble ${msg.role}`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content }} />
            </div>
          )
        ))}
        {isLoading && (
          <div className="chat-bubble assistant">
            <div className="typing-indicator"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiCoach;
