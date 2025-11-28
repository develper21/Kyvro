import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Web-only version for GitHub Pages deployment
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Disable Electron-specific features in web version
if (typeof window !== 'undefined') {
  // Set web mode flag
  window.KYVRO_WEB = true;
  
  // Mock Electron APIs for web compatibility
  (window as any).electronAPI = {
    // Database operations (mocked for web)
    db: {
      getCampaigns: () => Promise.resolve([]),
      createCampaign: () => Promise.resolve('mock-id'),
      updateCampaign: () => Promise.resolve(true),
      deleteCampaign: () => Promise.resolve(true),
      getDashboardStats: () => Promise.resolve({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalContacts: 0,
        sentMessages: 0,
        deliveryRate: 0
      })
    },
    // File operations (mocked for web)
    file: {
      selectFile: () => Promise.resolve(null),
      parseCSV: () => Promise.resolve([]),
      exportCSV: () => Promise.resolve(true)
    },
    // WhatsApp API (mocked for web)
    whatsapp: {
      sendMessage: () => Promise.resolve({ success: false, error: 'Web version - API not available' }),
      getTemplates: () => Promise.resolve([]),
      validateCredentials: () => Promise.resolve(false)
    },
    // Secure store (mocked for web)
    secureStore: {
      set: () => Promise.resolve(true),
      get: () => Promise.resolve(null),
      delete: () => Promise.resolve(true)
    },
    // Notifications (mocked for web)
    notifications: {
      show: (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      },
      requestPermission: () => {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    },
    // System info
    platform: 'web',
    version: '1.0.0'
  };
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
