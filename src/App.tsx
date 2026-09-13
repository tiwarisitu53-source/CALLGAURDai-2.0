import React from 'react';
import { CallGuardProvider, useCallGuard } from './context/CallGuardContext';
import { TopNavBar } from './components/navigation/TopNavBar';
import { UserPortal } from './components/user-portal/UserPortal';
import { AiScanner } from './components/ai-scanner/AiScanner';
import { FinalDecisionModal } from './components/FinalDecisionModal';
import { DemoScenariosModal } from './components/DemoScenariosModal';
import { Shield, Lock, ExternalLink, PhoneForwarded } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeInterface,
    setActiveInterface,
    setUserPortalTab,
    finalDecision,
    setFinalDecision,
    showDemoModal,
    setShowDemoModal,
    callerName,
    callerNumber,
    callDuration,
    screeningMode,
    language,
    activeScenario,
    startScreening,
  } = useCallGuard();

  const isHi = language === 'hi';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Universal Top Navigation Header */}
      <TopNavBar />

      {/* Main Content Area: User Portal or AI Scanner */}
      <main className="flex-1 flex flex-col px-4 sm:px-6 py-4 max-w-7xl w-full mx-auto">
        {activeInterface === 'user_portal' ? (
          <UserPortal />
        ) : (
          <AiScanner />
        )}
      </main>

      {/* Final Decision Modal (displayed when a call completes) */}
      {finalDecision && (
        <FinalDecisionModal
          isOpen={true}
          action={finalDecision.action}
          finalAction={finalDecision.action}
          analysis={finalDecision.analysis}
          callerName={callerName}
          callerNumber={callerNumber}
          durationSeconds={callDuration}
          mode={screeningMode}
          language={language}
          scenarioTitle={activeScenario?.title}
          onClose={() => setFinalDecision(null)}
          onNewCall={() => {
            setFinalDecision(null);
            startScreening('SIMULATION');
          }}
          onNewScreening={() => {
            setFinalDecision(null);
            startScreening('SIMULATION');
          }}
          onViewDashboard={() => {
            setFinalDecision(null);
            setActiveInterface('user_portal');
            setUserPortalTab('overview');
          }}
        />
      )}

      {/* 5 Fraud Persona Scenarios Selection Modal */}
      <DemoScenariosModal
        isOpen={showDemoModal}
        language={language}
        onClose={() => setShowDemoModal(false)}
        onSelectScenario={(scenario) => {
          startScreening('SIMULATION', scenario);
          setActiveInterface('ai_scanner');
        }}
      />

      {/* Clean Footer with National Cyber Crime Notice */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-500 text-xs py-4 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-300">CallGuard.AI</span>
            <span>—</span>
            <span>
              {isHi
                ? 'भारतीय फोन फ्रॉड रोकथाम एवं ऑटोमेशन प्रणाली'
                : 'Intelligent Autonomous Phone Fraud Interceptor & Screener'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{isHi ? 'स्थानीय डेटा सुरक्षा' : 'Zero-Data Leakage'}</span>
            </span>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <PhoneForwarded className="w-3 h-3" />
              <span>{isHi ? 'साइबर हेल्पलाइन: 1930' : 'Cyber Helpline: 1930'}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <CallGuardProvider>
      <AppContent />
    </CallGuardProvider>
  );
}
