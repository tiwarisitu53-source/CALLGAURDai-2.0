import React from 'react';
import {
  Home,
  CalendarCheck,
  History,
  FileText,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';
import { UserPortalTab } from '../../types';
import { ActiveCallUserBanner } from './ActiveCallUserBanner';
import { HomeOverview } from './HomeOverview';
import { CallHistoryTab } from './CallHistoryTab';
import { CallDetailsTab } from './CallDetailsTab';
import { RiskAlertsTab } from './RiskAlertsTab';
import { SettingsTab } from './SettingsTab';
import { ExpectedCallsSection } from '../ExpectedCallsSection';
import { SIMULATION_SCENARIOS } from '../../services/scenarios';

export const UserPortal: React.FC = () => {
  const {
    userPortalTab,
    setUserPortalTab,
    language,
    startScreening,
    setActiveInterface,
  } = useCallGuard();

  const isHi = language === 'hi';

  const tabs: { id: UserPortalTab; label: string; labelHi: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Home / Overview',
      labelHi: 'होम / अवलोकन',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'expected-calls',
      label: 'Expected Calls',
      labelHi: 'अपेक्षित कॉल्स',
      icon: <CalendarCheck className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Call History',
      labelHi: 'कॉल इतिहास',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'details',
      label: 'Call Details',
      labelHi: 'कॉल विवरण',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'alerts',
      label: 'Risk Alerts',
      labelHi: 'जोखिम अलर्ट',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      labelHi: 'सेटिंग्स',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto py-2 sm:py-4 space-y-6">
      {/* Persistent Active Call Alert Banner (if screening or connected) */}
      <ActiveCallUserBanner />

      {/* User Portal Sub-navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-lg overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((t) => {
            const isActive = userPortalTab === t.id;
            return (
              <button
                key={t.id}
                id={`user-portal-tab-${t.id}`}
                onClick={() => setUserPortalTab(t.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {t.icon}
                <span>{isHi ? t.labelHi : t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-view Content */}
      <div className="flex-1">
        {userPortalTab === 'overview' && <HomeOverview />}

        {userPortalTab === 'expected-calls' && (
          <ExpectedCallsSection
            language={language}
            onStartSimulationForExpectedCall={(expectedCall) => {
              const matchedScenario =
                SIMULATION_SCENARIOS.find(
                  (s) =>
                    s.expectedOrganization?.toLowerCase() === expectedCall.organization.toLowerCase() ||
                    s.title.toLowerCase().includes(expectedCall.organization.toLowerCase())
                ) || {
                  ...SIMULATION_SCENARIOS[0],
                  callerIdentity: `${expectedCall.organization} Representative`,
                  expectedOrganization: expectedCall.organization,
                  expectedReason: expectedCall.reason,
                };
              startScreening('SIMULATION', matchedScenario);
              setActiveInterface('ai_scanner');
            }}
          />
        )}

        {userPortalTab === 'history' && <CallHistoryTab />}

        {userPortalTab === 'details' && <CallDetailsTab />}

        {userPortalTab === 'alerts' && <RiskAlertsTab />}

        {userPortalTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};
