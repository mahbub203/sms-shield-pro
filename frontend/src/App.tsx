import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { LoginModal } from './components/Auth/LoginModal';

import { DashboardView } from './components/Dashboard/DashboardView';
import { SimulationLabView } from './components/SimulationLab/SimulationLabView';
import { DetectionView } from './components/DetectionEngine/DetectionView';
import { ProtectionView } from './components/ProtectionCenter/ProtectionView';
import { ThreatMonitoringView } from './components/ThreatMonitoring/ThreatMonitoringView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { ReportsView } from './components/Reports/ReportsView';
import { SettingsView } from './components/Settings/SettingsView';
import { api } from './services/api';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function checkProtectionStatus() {
      try {
        const st = await api.getProtectionStatus();
        setEmergencyMode(st.emergency_lockdown_mode);
      } catch (err) {
        console.error('Failed to query protection posture:', err);
      }
    }
    checkProtectionStatus();
  }, []);

  const handleToggleEmergencyMode = async (enabled: boolean) => {
    try {
      const res = await api.toggleEmergencyMode(enabled);
      setEmergencyMode(res.emergency_lockdown_mode);
    } catch (err: any) {
      alert(`Failed to toggle emergency mode: ${err.message}`);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'testing-lab':
        return <SimulationLabView />;
      case 'detection':
        return <DetectionView />;
      case 'protection':
        return (
          <ProtectionView
            emergencyMode={emergencyMode}
            onToggleEmergencyMode={handleToggleEmergencyMode}
          />
        );
      case 'threat-monitoring':
        return <ThreatMonitoringView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        emergencyMode={emergencyMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          emergencyMode={emergencyMode}
          onToggleEmergencyMode={handleToggleEmergencyMode}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fadeIn">
          {renderActiveView()}
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
