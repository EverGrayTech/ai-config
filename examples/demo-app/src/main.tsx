import React from 'react';
import ReactDOM from 'react-dom/client';

import '../../../styles/base.css';
import App from './App';
import './app.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root element for demo app bootstrap.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
