import './wdyr'; // Must be first import
import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/msalConfig';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  // <React.StrictMode> is commented out because it causes components to render twice (in dev but not production)
  // This double rendering can cause issues with some components and makes debugging more difficult
  // StrictMode is a development tool that helps detect problems but is enabled by default in create-react-app
  <MsalProvider instance={msalInstance}>
    <App />
  </MsalProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
