import React from 'react';
import ReactDOM from 'react-dom/client';
import SplashLoader from './components/SplashLoader';
import './index.css';

ReactDOM.createRoot(document.getElementById('splash-root')!).render(
  <React.StrictMode>
    <SplashLoader />
  </React.StrictMode>,
);
