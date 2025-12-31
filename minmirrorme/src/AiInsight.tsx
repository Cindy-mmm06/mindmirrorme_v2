import { useState} from 'react';
import { get } from 'aws-amplify/api';

// Define the structure for the new, structured insight data
type InsightData = {
  primaryGoal: string;
  overallSummary: string;
  keyMindsets: string[];
  observedPatterns: string[];
  potentialConflicts: string[];
};

function AiInsight() {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // We only want to fetch the insight when the user clicks the button
  const handleGetInsight = async () => {
    setIsLoading(true);
    setError('');
    setInsightData(null); // Clear previous insight

    try {
      const restOperation = get({
        apiName: 'Blueprint-API',
        path: '/aiinsight',
      });
      const { body } = await restOperation.response;
      
      if (body) {
        const response = (await body.json()) as InsightData;
        if (response.overallSummary) {
          setInsightData(response);
        } else {
          setError('The AI returned an empty insight. Please try again.');
        }
      } else {
        setError('The server returned an empty response.');
      }

    } catch (err) {
      console.error('AI insight call failed:', err);
      setError('An error occurred while getting your insight. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-insight-container">
      <h2>Uncover Your Patterns</h2>
      <p>Connect the dots between your Chat, Thoughts, and Core. See the bigger picture of who you are becoming.</p>
      
      <button onClick={handleGetInsight} disabled={isLoading}>
        {isLoading ? 'Generating Insight...' : 'Reveal Patterns'}
      </button>

      {error && <p className="status-message error">{error}</p>}

      {insightData && (
        <div className="insight-dashboard">
          <div className="dashboard-card full-width">
            <h3>Primary Goal</h3>
            <p className="dashboard-goal">{insightData.primaryGoal}</p>
          </div>
          <div className="dashboard-card full-width">
            <h3>Overall Summary</h3>
            <p>{insightData.overallSummary}</p>
          </div>
          <div className="dashboard-card">
            <h3>Key Mindsets</h3>
            <ul>
              {insightData.keyMindsets.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          <div className="dashboard-card">
            <h3>Observed Patterns</h3>
            <ul>
              {insightData.observedPatterns.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          <div className="dashboard-card full-width">
            <h3>Potential Conflicts</h3>
            <ul>
              {insightData.potentialConflicts.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiInsight;
