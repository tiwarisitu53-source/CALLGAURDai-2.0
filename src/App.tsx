import React, { useState, useEffect } from 'react';
import {
  Shield,
  PhoneCall,
  PhoneOff,
  Radio,
  Sparkles,
  LayoutDashboard,
  Play,
  RotateCcw,
  Bot,
  CheckCircle2,
  Volume2,
  Mic,
  Cpu,
  Languages,
} from 'lucide-react';
import {
  CallStatus,
  RiskAnalysis,
  ScreeningSession,
  DemoScenario,
  ScreeningMode,
  LanguageOption,
} from './types';
import { CallScreen } from './components/CallScreen';
import { RiskEnginePanel } from './components/RiskEnginePanel';
import { FinalDecisionModal } from './components/FinalDecisionModal';
import { Dashboard } from './components/Dashboard';
import { DemoScenariosModal } from './components/DemoScenariosModal';
import { SIMULATION_SCENARIOS } from './services/scenarios';
import { playRingtone, stopSounds } from './services/soundEffects';
import { speechService } from './services/speech';

export default function App() {
  const [activeTab, setActiveTab] = useState<'screening' | 'dashboard'>('screening');
  const [screeningMode, setScreeningMode] = useState<ScreeningMode>('LIVE');
  const [language, setLanguage] = useState<LanguageOption>('en');
  const [callStatus, setCallStatus] = useState<CallStatus>('incoming');
  const [callerName, setCallerName] = useState<string>('Unknown Caller');
  const [callerNumber, setCallerNumber] = useState<string>('+91 98765 43210');
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<RiskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [finalDecision, setFinalDecision] = useState<{
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
    analysis: RiskAnalysis | null;
  } | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('callguard_sessions');
      if (saved) {
        const parsed: ScreeningSession[] = JSON.parse(saved);
        const migrated = parsed.map((s) => {
          let callerNumber = s.callerNumber;
          if (callerNumber && callerNumber.startsWith('+1')) {
            callerNumber = callerNumber.includes('800')
              ? '+91 98210 99887'
              : callerNumber.includes('415')
              ? '+91 98201 54321'
              : '+91 98765 43210';
          }
          return {
            ...s,
            callerNumber: callerNumber || '+91 98765 43210',
            signals: Array.isArray(s.signals) ? s.signals : [],
            transcript: Array.isArray(s.transcript) ? s.transcript : [],
          };
        });
        setSessions(migrated);
        localStorage.setItem('callguard_sessions', JSON.stringify(migrated));
      } else {
        // Seed initial demo session
        const initialSeed: ScreeningSession[] = [
          {
            id: 'seed-bank-scam',
            mode: 'SIMULATION',
            language: 'en',
            callerName: 'Wells Chase Security Dept',
            callerNumber: '+91 98210 99887',
            timestamp: 'Today, 09:15 AM',
            durationSeconds: 32,
            finalRiskScore: 95,
            finalRiskLevel: 'HIGH',
            intent: 'Attempting to harvest one-time passcode for account takeover',
            category: 'Credential Theft',
            signals: ['OTP / Verification Code Request', 'Bank impersonation', 'Artificial urgency or threat pressure'],
            explanation:
              'Caller claimed to represent bank fraud prevention, fabricated overseas card activity, and demanded immediate OTP disclosure.',
            finalAction: 'BLOCKED',
            scenarioTitle: 'Bank Security & OTP Theft Scam',
            transcript: [
              {
                sender: 'ai',
                text: "Hello. You've reached the CallGuard screening assistant. Could you briefly tell me the reason for your call?",
                time: '09:15:02 AM',
              },
              {
                sender: 'caller',
                text: "I'm calling about an urgent security problem with your bank account.",
                time: '09:15:12 AM',
              },
              {
                sender: 'ai',
                text: 'I understand you are calling about an account. Did this notification ask for any verification codes, passwords, or payments?',
                time: '09:15:18 AM',
              },
              {
                sender: 'caller',
                text: 'To prevent immediate account freeze, I need you to provide the 6-digit OTP verification code sent to your phone right now.',
                time: '09:15:26 AM',
              },
              {
                sender: 'ai',
                text: 'This call has been blocked due to high-risk fraud and credential-theft indicators. Goodbye.',
                time: '09:15:32 AM',
              },
            ],
          },
          {
            id: 'seed-project-safe',
            mode: 'LIVE',
            language: 'hi',
            callerName: 'राहुल शर्मा (प्रोजेक्ट लीड)',
            callerNumber: '+91 98201 54321',
            timestamp: 'Today, 11:30 AM',
            durationSeconds: 24,
            finalRiskScore: 10,
            finalRiskLevel: 'LOW',
            intent: 'Discussing scheduled business project or presentation',
            category: 'Business / Personal Discussion',
            signals: ['Legitimate personal / business context', 'No sensitive data requested'],
            explanation:
              'Caller verified identity as Rahul from project team. Meeting agenda confirmed with zero credential or financial requests.',
            finalAction: 'CONNECTED',
            scenarioTitle: 'वैध प्रोजेक्ट टीम कॉल (सुरक्षित)',
            transcript: [
              {
                sender: 'ai',
                text: 'नमस्ते। आप कॉल-गार्ड स्क्रीनिंग असिस्टेंट से जुड़े हैं। क्या आप संक्षेप में बता सकते हैं कि आपने किस कारण से कॉल किया है?',
                time: '11:30:02 AM',
              },
              {
                sender: 'caller',
                text: 'नमस्ते, मैं प्रोजेक्ट टीम से राहुल बात कर रहा हूँ। कल की प्रेजेंटेशन के बारे में बात करनी थी।',
                time: '11:30:10 AM',
              },
              {
                sender: 'ai',
                text: 'आपकी पहचान और कॉल का उद्देश्य सत्यापित हो गया है। कॉल कनेक्ट की जा रही है, कृपया प्रतीक्षा करें।',
                time: '11:30:16 AM',
              },
            ],
          },
        ];
        setSessions(initialSeed);
        localStorage.setItem('callguard_sessions', JSON.stringify(initialSeed));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSession = (newSession: ScreeningSession) => {
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      try {
        localStorage.setItem('callguard_sessions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearSessions = () => {
    setSessions([]);
    try {
      localStorage.removeItem('callguard_sessions');
    } catch {
      // ignore
    }
  };

  // Ringtone when incoming call is waiting
  useEffect(() => {
    if (callStatus === 'incoming') {
      playRingtone();
    } else {
      stopSounds();
    }

    return () => {
      stopSounds();
    };
  }, [callStatus]);

  // Start Screening button handler
  const handleStartScreening = (modeToUse: ScreeningMode = screeningMode, scenario?: DemoScenario | null) => {
    stopSounds();
    speechService.primeAudio();
    setScreeningMode(modeToUse);

    const isHindi = language === 'hi';

    if (modeToUse === 'SIMULATION') {
      const selected = scenario || activeScenario || SIMULATION_SCENARIOS[1];
      setActiveScenario(selected);
      setCallerName(isHindi && selected.callerIdentityHindi ? selected.callerIdentityHindi : selected.callerIdentity);
      setCallerNumber(selected.callerNumber);
    } else {
      setActiveScenario(null);
      setCallerName(isHindi ? 'अज्ञात कॉलर (Unknown)' : 'Unknown Caller');
      setCallerNumber('+91 98765 43210');
    }

    const greetingText = isHindi
      ? 'नमस्ते। आप कॉल-गार्ड स्क्रीनिंग असिस्टेंट से जुड़े हैं। क्या आप संक्षेप में बता सकते हैं कि आपने किस कारण से कॉल किया है?'
      : "Hello. You've reached the CallGuard screening assistant. Could you briefly tell me the reason for your call?";

    setCallStatus('screening');
    setCurrentAnalysis({
      riskScore: 5,
      riskLevel: 'LOW',
      intent: isHindi ? 'कॉलर के वक्तव्य की प्रतीक्षा...' : 'Awaiting initial caller statement...',
      category: 'Initial Screening',
      signals: [],
      explanation: isHindi
        ? 'कॉल-गार्ड स्क्रीनिंग असिस्टेंट सक्रिय है और कॉलर से पहचान और उद्देश्य पूछ रहा है।'
        : 'CallGuard screening assistant is active and prompting caller for identity and purpose.',
      recommendedAction: 'SCREEN_FURTHER',
      nextQuestion: greetingText,
      responseText: greetingText,
      isFinal: false,
      conversationStage: 'INITIAL',
    });
  };

  // Risk update from CallScreen
  const handleRiskUpdate = (analysis: RiskAnalysis) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(analysis);
  };

  // Call ended handler
  const handleCallEnded = (
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED',
    analysis: RiskAnalysis | null
  ) => {
    stopSounds();
    setCallStatus(action === 'BLOCKED' ? 'blocked' : action === 'CONNECTED' ? 'connected' : 'ended');
    setFinalDecision({ action, analysis });

    const isHindi = language === 'hi';

    // Save to historical records
    const sessionRecord: ScreeningSession = {
      id: `session-${Date.now()}`,
      mode: screeningMode,
      language: language,
      callerName,
      callerNumber,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: Math.max(8, callDuration),
      finalRiskScore: analysis ? analysis.riskScore : action === 'BLOCKED' ? 95 : 15,
      finalRiskLevel: analysis ? analysis.riskLevel : action === 'BLOCKED' ? 'HIGH' : 'LOW',
      intent: analysis?.intent || (action === 'BLOCKED' ? 'Fraud threat intercepted' : 'Legitimate communication'),
      category: analysis?.category || 'Call Screening',
      signals: analysis?.signals || [],
      explanation:
        analysis?.explanation ||
        (action === 'BLOCKED' ? 'Call terminated due to security threshold violation.' : 'Call verified and connected.'),
      finalAction: action,
      scenarioTitle: isHindi && activeScenario?.titleHindi ? activeScenario.titleHindi : activeScenario?.title,
      transcript: [
        {
          sender: 'ai',
          text: isHindi
            ? 'नमस्ते। आप कॉल-गार्ड स्क्रीनिंग असिस्टेंट से जुड़े हैं। क्या आप संक्षेप में बता सकते हैं कि आपने किस कारण से कॉल किया है?'
            : "Hello. You've reached the CallGuard screening assistant. Could you briefly tell me the reason for your call?",
          time: 'Turn 1',
        },
        ...(analysis?.responseText
          ? [
              {
                sender: 'ai' as const,
                text: analysis.responseText,
                time: 'Final Turn',
              },
            ]
          : []),
      ],
    };

    saveSession(sessionRecord);
  };

  // Reset to new incoming call
  const handleNewScreening = (presetScenario?: DemoScenario, forceMode?: ScreeningMode) => {
    stopSounds();
    setFinalDecision(null);
    setCurrentAnalysis(null);
    setCallDuration(0);

    const isHindi = language === 'hi';

    if (presetScenario) {
      setScreeningMode('SIMULATION');
      setActiveScenario(presetScenario);
      setCallerName(isHindi && presetScenario.callerIdentityHindi ? presetScenario.callerIdentityHindi : presetScenario.callerIdentity);
      setCallerNumber(presetScenario.callerNumber);
    } else {
      if (forceMode) {
        setScreeningMode(forceMode);
      }
      setActiveScenario(null);
      setCallerName(isHindi ? 'अज्ञात कॉलर (Unknown)' : 'Unknown Caller');
      setCallerNumber('+91 98765 43210');
    }

    setCallStatus('incoming');
    setActiveTab('screening');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">CallGuard AI</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  Autonomous Screening
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Understand <span className="text-indigo-300 font-semibold">WHY</span> callers are calling before you pick up
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher in Navbar */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setLanguage('en')}
                title="English Language Mode"
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>English</span>
              </button>
              <button
                onClick={() => setLanguage('hi')}
                title="हिंदी और हिंग्लिश मोड (Hindi & Hinglish Mode)"
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  language === 'hi'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>हिंदी</span>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => {
                  setScreeningMode('LIVE');
                  if (callStatus === 'incoming') {
                    setActiveScenario(null);
                    setCallerName(language === 'hi' ? 'अज्ञात कॉलर (Unknown)' : 'Unknown Caller');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  screeningMode === 'LIVE'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Live Mode</span>
              </button>

              <button
                onClick={() => {
                  setScreeningMode('SIMULATION');
                  if (!activeScenario) {
                    const sel = SIMULATION_SCENARIOS[1];
                    setActiveScenario(sel);
                    setCallerName(language === 'hi' && sel.callerIdentityHindi ? sel.callerIdentityHindi : sel.callerIdentity);
                    setCallerNumber(sel.callerNumber);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  screeningMode === 'SIMULATION'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Simulation Mode</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('screening')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'screening'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Screen</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Screening Log</span>
              {sessions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {sessions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">5 Scenarios</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {activeTab === 'dashboard' ? (
          <Dashboard
            sessions={sessions}
            onClearSessions={handleClearSessions}
            onStartNewCall={() => handleNewScreening()}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Before Screening: Incoming Call Waiting Screen */}
            {callStatus === 'incoming' && (
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  {/* Ambient backdrop glow */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
                      screeningMode === 'LIVE' ? 'bg-cyan-500' : 'bg-purple-600'
                    }`}
                  />

                  {/* Mode Selector Toggle Pill */}
                  <div className="flex justify-center mb-5">
                    <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
                      <button
                        onClick={() => {
                          setScreeningMode('LIVE');
                          setActiveScenario(null);
                          setCallerName(language === 'hi' ? 'अज्ञात कॉलर (Unknown)' : 'Unknown Caller');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          screeningMode === 'LIVE'
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        <span>A. LIVE VOICE MODE</span>
                      </button>

                      <button
                        onClick={() => {
                          setScreeningMode('SIMULATION');
                          if (!activeScenario) {
                            const sel = SIMULATION_SCENARIOS[1];
                            setActiveScenario(sel);
                            setCallerName(language === 'hi' && sel.callerIdentityHindi ? sel.callerIdentityHindi : sel.callerIdentity);
                            setCallerNumber(sel.callerNumber);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          screeningMode === 'SIMULATION'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Cpu className="w-4 h-4" />
                        <span>B. SIMULATION MODE</span>
                      </button>
                    </div>
                  </div>

                  {/* Dedicated Language Selector Box (Pre-Screening) */}
                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 mb-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-200">
                          {language === 'hi' ? 'कॉल स्क्रीनिंग भाषा' : 'Screening Language'}
                        </span>
                      </div>
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                            language === 'en'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('hi')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                            language === 'hi'
                              ? 'bg-amber-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          हिंदी (Hindi / Hinglish)
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {language === 'hi'
                        ? 'हिंदी मोड: कॉलर प्राकृतिक हिंदी या Hinglish बोल सकता है। कॉल-गार्ड समझकर स्वाभाविक भारतीय स्वर में बात करेगा।'
                        : 'English mode: Standard conversational English call screening with AI voice.'}
                    </p>
                  </div>

                  {/* Caller Identity Card */}
                  <div className="text-center mb-6">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="w-full h-full rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                        {screeningMode === 'LIVE' ? (
                          <Bot className="w-10 h-10 text-cyan-400" />
                        ) : (
                          <Cpu className="w-10 h-10 text-purple-400" />
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full border-2 border-slate-900">
                        <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-400 mb-2">
                      <Radio className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>{language === 'hi' ? 'इनकमिंग कॉल अलर्ट • रिंग बज रही है' : 'Incoming Call Alert • Ringing'}</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                      {language === 'hi' && activeScenario?.callerIdentityHindi
                        ? activeScenario.callerIdentityHindi
                        : callerName}
                    </h2>
                    <div className="mt-1.5 flex items-center justify-center">
                      <span className="text-sm font-mono text-slate-300 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 shadow-inner">
                        <span className="text-xs">🇮🇳</span>
                        <span>{callerNumber}</span>
                      </span>
                    </div>
                  </div>

                  {/* Mode Details Box */}
                  {screeningMode === 'LIVE' ? (
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-6 text-xs text-slate-300">
                      <div className="flex items-center gap-2 font-semibold text-cyan-300 mb-1">
                        <Mic className="w-4 h-4 text-cyan-400" />
                        <span>{language === 'hi' ? 'लाइव वॉयस स्क्रीनिंग' : 'True Adaptive Voice Interaction'}</span>
                      </div>
                      <p className="leading-relaxed text-slate-400">
                        {language === 'hi'
                          ? 'माइक्रोफ़ोन का उपयोग करके सीधे बोलें। कॉल-गार्ड हिंदी/Hinglish में सुनता है, भारतीय स्वर में उत्तर देता है, और फ्रॉड संकेतों का विश्लेषण करता है।'
                          : "Speak directly using your microphone. CallGuard answers, speaks with natural voice synthesis, listens to your replies, and adaptively asks follow-up questions to expose the caller's motive."}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-6 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-purple-400" />{' '}
                          {language === 'hi' ? 'सक्रिय कॉलर परिदृश्य:' : 'Active Persona:'}
                        </span>
                        <button
                          onClick={() => setShowDemoModal(true)}
                          className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold"
                        >
                          {language === 'hi' ? 'परिदृश्य बदलें (5 उपलब्ध)' : 'Change Persona (5 Available)'}
                        </button>
                      </div>
                      <p className="font-bold text-slate-200 text-sm">
                        {activeScenario
                          ? language === 'hi' && activeScenario.titleHindi
                            ? activeScenario.titleHindi
                            : activeScenario.title
                          : language === 'hi' && SIMULATION_SCENARIOS[1].titleHindi
                          ? SIMULATION_SCENARIOS[1].titleHindi
                          : SIMULATION_SCENARIOS[1].title}
                      </p>
                      <p className="text-slate-400 mt-1">
                        {activeScenario
                          ? language === 'hi' && activeScenario.descriptionHindi
                            ? activeScenario.descriptionHindi
                            : activeScenario.description
                          : language === 'hi' && SIMULATION_SCENARIOS[1].descriptionHindi
                          ? SIMULATION_SCENARIOS[1].descriptionHindi
                          : SIMULATION_SCENARIOS[1].description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStartScreening(screeningMode)}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                        screeningMode === 'LIVE'
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                      <span>
                        {screeningMode === 'LIVE'
                          ? language === 'hi'
                            ? 'लाइव वॉयस स्क्रीनिंग शुरू करें'
                            : 'START LIVE SCREENING'
                          : language === 'hi'
                          ? 'ऑटोमेटेड सिमुलेशन चलाएं'
                          : 'RUN AUTOMATED SIMULATION'}
                      </span>
                    </button>

                    {screeningMode === 'SIMULATION' && (
                      <button
                        onClick={() => setShowDemoModal(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>{language === 'hi' ? '5 यथार्थवादी सिमुलेशन परिदृश्य देखें' : 'Browse 5 Realistic Simulation Personas'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-5 text-center leading-relaxed">
                    Powered by the same unified Gemini threat-analysis and risk engine across both modes and languages.
                  </p>
                </div>
              </div>
            )}

            {/* During Screening: Split View with Call Screen & Live Risk Engine */}
            {callStatus === 'screening' && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
                {/* Left side: Interactive Call Interface */}
                <div className="lg:col-span-7 flex flex-col h-full">
                  <CallScreen
                    mode={screeningMode}
                    language={language}
                    callerName={callerName}
                    callerNumber={callerNumber}
                    activeScenario={activeScenario}
                    onCallEnded={handleCallEnded}
                    onRiskUpdate={handleRiskUpdate}
                    currentAnalysis={currentAnalysis}
                    onRestart={() => handleStartScreening(screeningMode, activeScenario)}
                    onSwitchMode={(newMode) => {
                      handleNewScreening(undefined, newMode);
                    }}
                    onLanguageChange={(newLang) => setLanguage(newLang)}
                  />
                </div>

                {/* Right side: Real-time Risk Engine Panel */}
                <div className="lg:col-span-5 flex flex-col">
                  <RiskEnginePanel analysis={currentAnalysis} isAnalyzing={isAnalyzing} />
                </div>
              </div>
            )}

            {/* Call Terminated / Connected Outcome Card */}
            {(callStatus === 'blocked' || callStatus === 'connected' || callStatus === 'ended') && (
              <div className="flex-1 flex items-center justify-center py-6">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                      callStatus === 'blocked'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {callStatus === 'blocked' ? (
                      <PhoneOff className="w-8 h-8" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8" />
                    )}
                  </div>

                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 bg-slate-950 border border-slate-800 text-slate-400">
                    {screeningMode === 'LIVE' ? 'Live Call Outcome' : 'Simulation Outcome'} •{' '}
                    {language === 'hi' ? 'हिंदी' : 'English'}
                  </div>

                  <h3 className="text-xl font-bold text-slate-100">
                    {callStatus === 'blocked'
                      ? language === 'hi'
                        ? 'कॉल सुरक्षित रूप से ब्लॉक की गई'
                        : 'Call Safely Blocked'
                      : language === 'hi'
                      ? 'कॉल सफलतापूर्वक कनेक्ट की गई'
                      : 'Call Connected to User'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-6">
                    {callStatus === 'blocked'
                      ? language === 'hi'
                        ? 'कॉल-गार्ड ने सुरक्षा जोखिम व धोखाधड़ी के संकेत पकड़कर कॉल समाप्त कर दी।'
                        : 'CallGuard intercepted suspicious fraud patterns and safely hung up.'
                      : language === 'hi'
                      ? 'कॉलर का उद्देश्य वैध व सुरक्षित सत्यापित हुआ। लाइन कनेक्ट कर दी गई है।'
                      : 'Caller verified as benign. The line has been connected.'}
                  </p>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleNewScreening()}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{language === 'hi' ? 'नई कॉल स्क्रीन करें' : 'Screen Another Call'}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>{language === 'hi' ? 'सुरक्षा लॉग और ट्रांसक्रिप्ट देखें' : 'View Screening History'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Scenarios Picker Modal */}
      <DemoScenariosModal
        isOpen={showDemoModal}
        language={language}
        onClose={() => setShowDemoModal(false)}
        onSelectScenario={(scenario) => {
          handleNewScreening(scenario, 'SIMULATION');
        }}
      />

      {/* Final Decision Modal Popup */}
      {finalDecision && (
        <FinalDecisionModal
          isOpen={!!finalDecision}
          finalAction={finalDecision.action}
          action={finalDecision.action}
          analysis={finalDecision.analysis}
          callerName={callerName}
          callerNumber={callerNumber}
          durationSeconds={callDuration || 18}
          mode={screeningMode}
          language={language}
          scenarioTitle={language === 'hi' && activeScenario?.titleHindi ? activeScenario.titleHindi : activeScenario?.title}
          onClose={() => setFinalDecision(null)}
          onNewScreening={() => {
            setFinalDecision(null);
            handleNewScreening();
          }}
          onNewCall={() => {
            setFinalDecision(null);
            handleNewScreening();
          }}
          onViewDashboard={() => {
            setFinalDecision(null);
            setActiveTab('dashboard');
          }}
        />
      )}
    </div>
  );
}
