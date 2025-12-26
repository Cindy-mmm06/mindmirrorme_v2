import { useState, useEffect } from 'react';
import { get } from 'aws-amplify/api';
import './MindMap.css'; // Import the new CSS for the mind map layout

// Define the structure of our blueprint data
type BlueprintData = {
  endGoal: string;
  skills: string;
  knowledge: string;
  problems: string;
  focusAction: string;
};

// Define the props this component now receives
type BlueprintProps = {
  activeTab: string;
  onStartUpdate: () => void; // A function to trigger the tab switch
};

function Blueprint({ activeTab, onStartUpdate }: BlueprintProps) {
  const [formData, setFormData] = useState<BlueprintData>({
    endGoal: '',
    skills: '',
    knowledge: '',
    problems: '',
    focusAction: '',
  });
  const [isFetching, setIsFetching] = useState(true);

  const fetchBlueprint = async () => {
    setIsFetching(true);
    try {
      const restOperation = get({
        apiName: 'Blueprint-API',
        path: `/blueprint?t=${new Date().getTime()}`, // Cache-busting
      });
      const { body } = await restOperation.response;
      const data = (await body.json()) as BlueprintData;
      
      setFormData({
        endGoal: data.endGoal || '',
        skills: data.skills || '',
        knowledge: data.knowledge || '',
        problems: data.problems || '',
        focusAction: data.focusAction || '',
      });

    } catch (error) {
      console.error('GET call failed:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'blueprint') {
      fetchBlueprint();
    }
  }, [activeTab]);


  if (isFetching) {
    return <p>Loading your blueprint...</p>;
  }

  return (
    <div className="blueprint-container">
      <div className="component-header">
        <div>
          <h2>Your Blueprint</h2>
          <p>This is a mind map of your current blueprint. To make changes, please use the AI Coach.</p>
        </div>
        <button onClick={onStartUpdate} className="action-button">
          Update with AI Coach
        </button>
      </div>
      
      {/* --- NEW: Mind Map Layout Structure --- */}
      <div className="mind-map-container">
        <div className="map-item map-skills">
            <label>Your Skills & Strengths</label>
            <p>{formData.skills}</p>
        </div>
        <div className="map-item map-problem">
            <label>Problems You're Drawn To</label>
            <p>{formData.problems}</p>
        </div>
        <div className="map-item map-knowledge">
            <label>Your Unique Knowledge</label>
            <p>{formData.knowledge}</p>
        </div>
        <div className="map-item map-focus">
            <label>Your Passion / "One Thing"</label>
            <p>{formData.focusAction}</p>
        </div>
        <div className="map-item map-goal">
            <label>Your Primary Goal</label>
            <p>{formData.endGoal}</p>
        </div>
      </div>
    </div>
  );
}

export default Blueprint;
