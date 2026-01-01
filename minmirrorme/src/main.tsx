import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './mobile.css';
import App from './App.tsx';

// Import the top-level Amplify object
import { Amplify } from 'aws-amplify';

// Manually define the configuration object.
const amplifyConfig = {
  Auth: {
    Cognito: {
      // These are the values from your amplify-outputs.json file
      userPoolId: 'us-east-1_FidqlY9xL',
      userPoolClientId: '4ubo70hts9te0ci3sd7nvvrk1e',
      identityPoolId: 'us-east-1:a267619f-eb04-4703-9ba8-348f861b12c3',
      region: 'us-east-1'
    },
  },
  API: {
    REST: {
      // This is the configuration for the REST API we built
      'Blueprint-API': {
        endpoint: 'https://3gq7hb6wml.execute-api.us-east-1.amazonaws.com/prod',
        region: 'us-east-1',
      },
    },
  },
};

// Configure Amplify with our manually defined object.
Amplify.configure(amplifyConfig);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
