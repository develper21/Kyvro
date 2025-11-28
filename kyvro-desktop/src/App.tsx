import React, { useEffect, useState } from 'react';
import SplashLoader from './components/SplashLoader';
import WindowFrame from './components/layout/WindowFrame';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import CampaignList from './features/campaigns/CampaignList';
import CreateCampaign from './features/campaigns/CreateCampaign';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check if user has API credentials
    const checkCredentials = async () => {
      try {
        const credentials = await window.electronAPI.getApiCredentials();
        setHasCredentials(!!credentials);
      } catch (error) {
        console.error('Failed to check credentials:', error);
      }
    };

    // Simulate app loading
    setTimeout(async () => {
      await checkCredentials();
      setShowSplash(false);
    }, 2000);
  }, []);

  const renderMainContent = () => {
    if (!hasCredentials) {
      // Onboarding screen
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-white">
          <div className="glass-card p-8 rounded-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-6 text-center">Welcome to Kyvro</h2>
            <p className="text-gray-300 text-center mb-6">
              To get started, please configure your WhatsApp Business API credentials.
            </p>
            <button 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => {
                // TODO: Open onboarding modal
                console.log('Open onboarding modal');
              }}
            >
              Configure API Credentials
            </button>
          </div>
        </div>
      );
    }

    // Main application with sidebar
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'campaigns':
      case 'campaigns-list':
        return <CampaignList />;
      case 'campaigns-create':
        return <CreateCampaign />;
      default:
        return <Dashboard />;
    }
  };

  if (showSplash) {
    return <SplashLoader />;
  }

  if (!hasCredentials) {
    return (
      <WindowFrame title="Kyvro - Setup">
        {renderMainContent()}
      </WindowFrame>
    );
  }

  return (
    <WindowFrame 
      title={`Kyvro - ${activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}`}
      showBackButton={activeItem.includes('-')}
      onBack={() => {
        if (activeItem.includes('-')) {
          setActiveItem(activeItem.split('-')[0]);
        }
      }}
    >
      <div className="flex h-full">
        <Sidebar 
          activeItem={activeItem}
          onItemClick={setActiveItem}
          collapsed={sidebarCollapsed}
        />
        
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </WindowFrame>
  );
};

export default App;
