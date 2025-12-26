import { useState, useEffect } from 'react';
import { get } from 'aws-amplify/api';

// Define the structure for the dashboard data
type DashboardData = {
  primaryGoal: string;
  latestAiSummary: string;
};

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  // The typo has been corrected on the line below
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsFetching(true);
      try {
        const restOperation = get({
          apiName: 'Blueprint-API',
          path: '/dashboard',
        });
        const { body } = await restOperation.response;
        const response = (await body.json()) as DashboardData;
        setData(response);
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
        setError('Could not load dashboard data.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchDashboardData();
  }, []); // The empty array ensures this runs only once when the component mounts

  if (isFetching) {
    return <p>Loading your dashboard...</p>;
  }

  if (error) {
    return <p className="status-message error">{error}</p>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h3>Primary Goal</h3>
        <p className="dashboard-goal">{data?.primaryGoal}</p>
      </div>
      <div className="dashboard-card">
        <h3>Latest AI Coach Summary</h3>
        {/* Use dangerouslySetInnerHTML to render the HTML from the AI summary */}
        <div className="dashboard-summary" dangerouslySetInnerHTML={{ __html: data?.latestAiSummary || '' }} />
      </div>
    </div>
  );
}

export default Dashboard;
