import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  AppInterface,
  UserPortalTab,
  CallStatus,
  RiskAnalysis,
  ScreeningSession,
  DemoScenario,
  ScreeningMode,
  LanguageOption,
  ExpectedCall,
  UserVerificationResponse,
  ConversationTurn,
  RiskTimelinePoint,
  VoiceState,
} from '../types';
import { SIMULATION_SCENARIOS } from '../services/scenarios';
import {
  playRingtone,
  stopSounds,
  playSecurityAlert,
  playConnectTone,
  playHangupTone,
  playAnswerBeep,
} from '../services/soundEffects';
import { speechService } from '../services/speech';
import { gnaniService } from '../services/gnaniService';
import { getExpectedCalls, matchExpectedCall } from '../services/expectedCalls';

interface CallGuardContextType {
  // Navigation & Views
  activeInterface: AppInterface;
  setActiveInterface: (val: AppInterface) => void;
  userPortalTab: UserPortalTab;
  setUserPortalTab: (val: UserPortalTab) => void;
  selectedSession: ScreeningSession | null;
  setSelectedSession: (session: ScreeningSession | null) => void;
  navigateToCallDetails: (session: ScreeningSession) => void;

  // Call Core State
  callStatus: CallStatus;
  setCallStatus: (status: CallStatus) => void;
  screeningMode: ScreeningMode;
  setScreeningMode: (mode: ScreeningMode) => void;
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  callerName: string;
  setCallerName: (name: string) => void;
  callerNumber: string;
  setCallerNumber: (num: string) => void;
  activeScenario: DemoScenario | null;
  setActiveScenario: (scenario: DemoScenario | null) => void;
  currentAnalysis: RiskAnalysis | null;
  setCurrentAnalysis: (analysis: RiskAnalysis | null) => void;
  isAnalyzing: boolean;
  callDuration: number;
  voiceState: VoiceState;
  activeSpeaker: 'ai' | 'caller' | 'none';
  messages: ConversationTurn[];
  interimTranscript: string;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;

  // Technical Analysis & Verification
  riskTimeline: RiskTimelinePoint[];
  matchedCall: ExpectedCall | null;
  userVerification: UserVerificationResponse | undefined;
  callStage: 'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING' | 'ENDED';
  liveThreatAlert: {
    score: number;
    threatType: string;
    threatDetails?: string;
  } | null;
  dismissThreatAlert: () => void;

  // Simulation State
  simTurnIndex: number;
  totalSimTurns: number;
  simIsPaused: boolean;
  simIsAdvancing: boolean;
  interactiveModeInSim: boolean;
  setInteractiveModeInSim: (val: boolean) => void;

  // Voice & Audio
  isMuted: boolean;
  toggleMute: () => void;
  autoListen: boolean;
  setAutoListen: (val: boolean) => void;
  micPermissionDenied: boolean;
  gnaniConfigured: boolean;

  // History & Sessions
  sessions: ScreeningSession[];
  clearSessions: () => void;
  deleteSession: (id: string) => void;

  // Modals
  showDemoModal: boolean;
  setShowDemoModal: (val: boolean) => void;
  showVerificationModal: boolean;
  setShowVerificationModal: (val: boolean) => void;
  showSummaryModal: boolean;
  setShowSummaryModal: (val: boolean) => void;
  summaryData: {
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
    analysis: RiskAnalysis | null;
  } | null;
  finalDecision: {
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
    analysis: RiskAnalysis | null;
  } | null;
  setFinalDecision: React.Dispatch<
    React.SetStateAction<{
      action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
      analysis: RiskAnalysis | null;
    } | null>
  >;

  // Core Actions
  startScreening: (modeToUse?: ScreeningMode, scenario?: DemoScenario | null) => void;
  processCallerSpeech: (callerUtterance: string) => Promise<void>;
  advanceSimulationTurn: () => Promise<void>;
  toggleSimPause: () => void;
  restartSimulation: () => void;
  startListeningMode: (isAutomatic?: boolean) => void;
  stopListeningMode: () => void;
  interruptSpeech: () => void;
  handleWhisperInstruction: (instruction: string) => Promise<void>;
  handleUserVerification: (response: UserVerificationResponse) => void;
  connectCall: () => void;
  hangupCall: (action?: 'BLOCKED' | 'CONNECTED' | 'DISMISSED') => void;
  blockCaller: () => void;
  resetCallToIncoming: () => void;
}

const CallGuardContext = createContext<CallGuardContextType | null>(null);

const STORAGE_KEY = 'callguard_sessions';

export const CallGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activeInterface, setActiveInterface] = useState<AppInterface>('user_portal');
  const [userPortalTab, setUserPortalTab] = useState<UserPortalTab>('overview');
  const [selectedSession, setSelectedSession] = useState<ScreeningSession | null>(null);

  // Core Call State
  const [callStatus, setCallStatus] = useState<CallStatus>('incoming');
  const [screeningMode, setScreeningMode] = useState<ScreeningMode>('LIVE');
  const [language, setLanguage] = useState<LanguageOption>('en');
  const [callerName, setCallerName] = useState<string>('Unknown Caller');
  const [callerNumber, setCallerNumber] = useState<string>('+91 98765 43210');
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<RiskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [activeSpeaker, setActiveSpeaker] = useState<'ai' | 'caller' | 'none'>('ai');
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Risk & Verification
  const [riskTimeline, setRiskTimeline] = useState<RiskTimelinePoint[]>([
    {
      turn: 0,
      score: 5,
      level: 'LOW',
      reason: 'CallGuard screening assistant initialized',
      triggerEvent: 'Assistant Greeting',
    },
  ]);
  const [matchedCall, setMatchedCall] = useState<ExpectedCall | null>(null);
  const [userVerification, setUserVerification] = useState<UserVerificationResponse | undefined>(undefined);
  const [callStage, setCallStage] = useState<'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING' | 'ENDED'>('SCREENING');
  const [liveThreatAlert, setLiveThreatAlert] = useState<{
    score: number;
    threatType: string;
    threatDetails?: string;
  } | null>(null);

  // Simulation
  const [simTurnIndex, setSimTurnIndex] = useState<number>(0);
  const [simIsPaused, setSimIsPaused] = useState<boolean>(false);
  const [simIsAdvancing, setSimIsAdvancing] = useState<boolean>(false);
  const [interactiveModeInSim, setInteractiveModeInSim] = useState<boolean>(false);

  // Audio / Voice
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoListen, setAutoListen] = useState<boolean>(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [gnaniConfigured, setGnaniConfigured] = useState<boolean>(false);

  // Modals & History
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
    analysis: RiskAnalysis | null;
  } | null>(null);
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);

  // Refs for asynchronous closures
  const voiceStateRef = useRef<VoiceState>('idle');
  const messagesRef = useRef<ConversationTurn[]>([]);
  const isListeningRef = useRef<boolean>(false);
  const durationTimerRef = useRef<number | null>(null);
  const currentRiskScoreRef = useRef<number>(5);
  const matchedCallRef = useRef<ExpectedCall | null>(null);
  const userVerificationRef = useRef<UserVerificationResponse | undefined>(undefined);
  const verificationPromptedRef = useRef<boolean>(false);
  const callStageRef = useRef<'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING' | 'ENDED'>('SCREENING');
  const activeLangRef = useRef<LanguageOption>(language);
  const screeningModeRef = useRef<ScreeningMode>(screeningMode);
  const activeScenarioRef = useRef<DemoScenario | null>(activeScenario);
  const isMutedRef = useRef<boolean>(isMuted);

  // Synchronize refs with state
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    callStageRef.current = callStage;
  }, [callStage]);

  useEffect(() => {
    activeLangRef.current = language;
  }, [language]);

  useEffect(() => {
    screeningModeRef.current = screeningMode;
  }, [screeningMode]);

  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Check Gnani Voice configuration
  useEffect(() => {
    gnaniService.getStatus().then((status) => {
      setGnaniConfigured(status.configured);
    });
  }, []);

  // Load persisted sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ScreeningSession[] = JSON.parse(saved);
        const migrated = parsed.map((s) => {
          let num = s.callerNumber;
          if (num && num.startsWith('+1')) {
            num = num.includes('800')
              ? '+91 98210 99887'
              : num.includes('415')
              ? '+91 98201 54321'
              : '+91 98765 43210';
          }
          return {
            ...s,
            callerNumber: num || '+91 98765 43210',
            signals: Array.isArray(s.signals) ? s.signals : [],
            transcript: Array.isArray(s.transcript) ? s.transcript : [],
          };
        });
        setSessions(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        if (migrated.length > 0 && !selectedSession) {
          setSelectedSession(migrated[0]);
        }
      } else {
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
                text: 'नमस्ते, मैं राहुल बोल रहा हूँ। कल की क्लाइंट प्रेजेंटेशन और प्रोजेक्ट टाइमलाइन के बारे में चर्चा करनी थी।',
                time: '11:30:10 AM',
              },
              {
                sender: 'ai',
                text: 'धन्यवाद राहुल जी। मैं आपको अभी उपयोगकर्ता से कनेक्ट कर रहा हूँ। कृपया लाइन पर बने रहें।',
                time: '11:30:18 AM',
              },
            ],
          },
        ];
        setSessions(initialSeed);
        setSelectedSession(initialSeed[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
      }
    } catch (e) {
      console.error('Failed to parse saved sessions from localStorage:', e);
    }
  }, []);

  // Save sessions to localStorage helper
  const persistSessions = (newSessions: ScreeningSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  };

  const clearSessions = () => {
    persistSessions([]);
    setSelectedSession(null);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    persistSessions(updated);
    if (selectedSession?.id === id) {
      setSelectedSession(updated.length > 0 ? updated[0] : null);
    }
  };

  const navigateToCallDetails = (session: ScreeningSession) => {
    setSelectedSession(session);
    setActiveInterface('user_portal');
    setUserPortalTab('details');
  };

  // Ringtone handling for incoming call status
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

  // Duration timer when screening or connected
  useEffect(() => {
    if (callStatus === 'screening' || callStatus === 'connected' || callStatus === 'monitoring') {
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callStatus]);

  // Voice state update helper
  const updateVoiceState = useCallback((newState: VoiceState) => {
    setVoiceState(newState);
    voiceStateRef.current = newState;
  }, []);

  // Immediate speech interruption
  const interruptSpeech = useCallback(() => {
    speechService.stopSpeaking();
    setActiveSpeaker('none');
    updateVoiceState('idle');
  }, [updateVoiceState]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const dismissThreatAlert = () => {
    setLiveThreatAlert(null);
  };

  // Speech-to-Text listening mode
  const startListeningMode = useCallback(
    (isAutomatic = false) => {
      if (voiceStateRef.current === 'analyzing') return;

      speechService.stopSpeaking();
      setActiveSpeaker('none');
      setInterimTranscript('');
      updateVoiceState('listening');
      isListeningRef.current = true;
      setMicPermissionDenied(false);
      if (!isAutomatic) {
        setErrorMessage(null);
      }

      const started = speechService.startListening(
        (text: string, isFinal: boolean) => {
          if (isFinal) {
            setInterimTranscript('');
            speechService.stopListening();
            isListeningRef.current = false;
            processCallerSpeech(text);
          } else {
            setInterimTranscript(text);
          }
        },
        (error: string) => {
          console.warn('Speech recognition notice:', error);
          isListeningRef.current = false;
          updateVoiceState('idle');
          if (error.includes('denied') || error.includes('not-allowed')) {
            setMicPermissionDenied(true);
            setErrorMessage('Microphone access was denied. Please allow microphone permissions in browser.');
          }
        },
        () => {
          // On speech end
          isListeningRef.current = false;
          if (voiceStateRef.current === 'listening') {
            updateVoiceState('idle');
          }
        },
        activeLangRef.current
      );

      if (!started) {
        updateVoiceState('idle');
        isListeningRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateVoiceState]
  );

  const stopListeningMode = useCallback(() => {
    speechService.stopListening();
    isListeningRef.current = false;
    updateVoiceState('idle');
  }, [updateVoiceState]);

  // Main Call Processing Pipeline: Caller utterance -> /api/screen -> Risk Analysis & Voice Response
  const processCallerSpeech = useCallback(
    async (callerUtterance: string) => {
      if (!callerUtterance.trim()) return;

      stopListeningMode();
      speechService.stopSpeaking();
      setErrorMessage(null);
      setActiveSpeaker('none');
      updateVoiceState('analyzing');
      setIsAnalyzing(true);

      const expectedList = getExpectedCalls();
      const matchResult = matchExpectedCall(callerUtterance, callerName, expectedList);
      const matched = matchResult.matched ? matchResult.expectedCall : undefined;
      if (matched && !matchedCallRef.current) {
        matchedCallRef.current = matched;
        setMatchedCall(matched);
      }

      // Check for user verification trigger
      const lower = callerUtterance.toLowerCase();
      if (
        !verificationPromptedRef.current &&
        (matched ||
          lower.includes('bank') ||
          lower.includes('card') ||
          lower.includes('credit') ||
          lower.includes('punjab') ||
          lower.includes('amazon') ||
          lower.includes('courier') ||
          lower.includes('interview') ||
          lower.includes('cbi') ||
          lower.includes('police'))
      ) {
        verificationPromptedRef.current = true;
        setShowVerificationModal(true);
      }

      const callerTurn: ConversationTurn = {
        id: `caller-${Date.now()}`,
        sender: 'caller',
        text: callerUtterance.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      const updatedHistory = [...messagesRef.current, callerTurn];
      setMessages(updatedHistory);
      messagesRef.current = updatedHistory;

      try {
        const response = await fetch('/api/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callerName,
            callerNumber,
            history: updatedHistory.map((m) => ({ sender: m.sender, text: m.text })),
            userMessage: callerUtterance.trim(),
            currentRiskScore: currentRiskScoreRef.current,
            language: activeLangRef.current,
            expectedCalls: expectedList,
            userVerification: userVerificationRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error(`Screening server error (${response.status})`);
        }

        const analysis: RiskAnalysis = await response.json();
        currentRiskScoreRef.current = analysis.riskScore;
        setCurrentAnalysis(analysis);
        setIsAnalyzing(false);

        // Turn counter for timeline
        const callerTurnsCount = updatedHistory.filter((m) => m.sender === 'caller').length;
        const timelinePoint: RiskTimelinePoint = {
          turn: callerTurnsCount,
          score: analysis.riskScore,
          level: analysis.riskLevel,
          reason: analysis.explanation,
          triggerEvent:
            analysis.signals?.[0] ||
            (analysis.riskScore >= 71
              ? 'Security Threat Alert'
              : analysis.riskScore <= 30
              ? 'Low-risk Signal'
              : 'Screening Evaluation'),
        };
        setRiskTimeline((prev) => [...prev, timelinePoint]);

        // Stamp caller turn with risk score
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === callerTurn.id
              ? {
                  ...msg,
                  riskScoreAtTurn: analysis.riskScore,
                  detectedSignals: analysis.signals,
                }
              : msg
          )
        );

        // Threat Alert Banner
        if (analysis.riskScore >= 71) {
          playSecurityAlert();
          setLiveThreatAlert({
            score: analysis.riskScore,
            threatType: analysis.signals?.[0] || 'Credential / OTP Theft Alert',
            threatDetails: analysis.explanation,
          });
        } else if (analysis.recommendedAction === 'CONNECT') {
          playConnectTone();
        }

        if (analysis.recommendedAction === 'CONNECT' && callStageRef.current === 'SCREENING') {
          setCallStage('READY_TO_CONNECT');
        }

        // Assistant voice response
        const aiResponseText =
          activeLangRef.current === 'hi' && analysis.responseTextHindi
            ? analysis.responseTextHindi
            : analysis.responseText || analysis.nextQuestion;

        const aiTurn: ConversationTurn = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          riskScoreAtTurn: analysis.riskScore,
        };

        const withAiHistory = [...updatedHistory, aiTurn];
        setMessages(withAiHistory);
        messagesRef.current = withAiHistory;

        setActiveSpeaker('ai');
        updateVoiceState('speaking');

        const onFinishSpeaking = () => {
          setActiveSpeaker('none');
          updateVoiceState('idle');

          if (analysis.isFinal) {
            setTimeout(() => {
              if (analysis.recommendedAction === 'BLOCK') {
                playHangupTone();
                hangupCall('BLOCKED', analysis);
              } else if (analysis.recommendedAction === 'CONNECT') {
                if (callStageRef.current === 'SCREENING') {
                  setCallStage('READY_TO_CONNECT');
                } else {
                  hangupCall('CONNECTED', analysis);
                }
              }
            }, 1500);
            return;
          }

          // Live mode auto-resume listening
          if (screeningModeRef.current === 'LIVE' && autoListen && !isListeningRef.current) {
            startListeningMode(true);
          }
        };

        if (isMutedRef.current) {
          setTimeout(onFinishSpeaking, Math.min(Math.max(aiResponseText.length * 50, 1500), 4000));
        } else {
          speechService.speakAI(
            aiResponseText,
            () => {
              setActiveSpeaker('ai');
              updateVoiceState('speaking');
            },
            onFinishSpeaking,
            () => onFinishSpeaking(),
            activeLangRef.current
          );
        }
      } catch (err: any) {
        console.error('Call screening turn failed:', err);
        setIsAnalyzing(false);
        setErrorMessage(err?.message || 'Failed to process caller utterance. Please try again.');
        setActiveSpeaker('none');
        updateVoiceState('idle');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callerName, callerNumber, autoListen, updateVoiceState, startListeningMode, stopListeningMode]
  );

  // Whisper instruction from user to CallGuard AI
  const handleWhisperInstruction = useCallback(
    async (instruction: string) => {
      if (!instruction.trim()) return;
      const isHi = activeLangRef.current === 'hi';
      const whisperTurn: ConversationTurn = {
        id: `user-whisper-${Date.now()}`,
        sender: 'ai',
        text: isHi ? `🛡️ [उपयोगकर्ता का निर्देश]: "${instruction}"` : `🛡️ [User Secret Whisper]: "${instruction}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMessages((prev) => [...prev, whisperTurn]);

      const whisperPrompt = `The protected user whispered an instruction: "${instruction}". As CallGuard AI, deliver a professional, firm counter-statement or inquiry to the caller now without stating that the user whispered.`;
      await processCallerSpeech(whisperPrompt);
    },
    [processCallerSpeech]
  );

  // User verification response handler
  const handleUserVerification = useCallback(
    (response: UserVerificationResponse) => {
      setUserVerification(response);
      userVerificationRef.current = response;
      setShowVerificationModal(false);

      if (response === 'EXPECTED') {
        const adjustedScore = Math.max(0, currentRiskScoreRef.current - 20);
        currentRiskScoreRef.current = adjustedScore;
        const newLevel = adjustedScore <= 30 ? 'LOW' : adjustedScore <= 70 ? 'MEDIUM' : 'HIGH';
        if (currentAnalysis) {
          setCurrentAnalysis({
            ...currentAnalysis,
            riskScore: adjustedScore,
            riskLevel: newLevel,
          });
        }
        setRiskTimeline((prev) => [
          ...prev,
          {
            turn: prev.length,
            score: adjustedScore,
            level: newLevel,
            reason: 'User explicitly confirmed expecting this call.',
            triggerEvent: 'User Verification: Expected',
          },
        ]);
      } else if (response === 'UNEXPECTED') {
        const adjustedScore = Math.min(100, currentRiskScoreRef.current + 25);
        currentRiskScoreRef.current = adjustedScore;
        const newLevel = adjustedScore <= 30 ? 'LOW' : adjustedScore <= 70 ? 'MEDIUM' : 'HIGH';
        if (currentAnalysis) {
          setCurrentAnalysis({
            ...currentAnalysis,
            riskScore: adjustedScore,
            riskLevel: newLevel,
          });
        }
        playSecurityAlert();
        setLiveThreatAlert({
          score: adjustedScore,
          threatType: 'Unexpected Caller Warning',
          threatDetails: 'User confirmed they were NOT expecting this call.',
        });
        setRiskTimeline((prev) => [
          ...prev,
          {
            turn: prev.length,
            score: adjustedScore,
            level: newLevel,
            reason: 'User confirmed they were NOT expecting any call from this organization.',
            triggerEvent: 'User Verification: Unexpected',
          },
        ]);
      }
    },
    [currentAnalysis]
  );

  // Advance simulation turn
  const advanceSimulationTurn = useCallback(async () => {
    const sc = activeScenarioRef.current || SIMULATION_SCENARIOS[1];
    const turns =
      activeLangRef.current === 'hi' && sc.simulatedTurnsHindi?.length
        ? sc.simulatedTurnsHindi
        : sc.simulatedTurns;

    if (simTurnIndex >= turns.length) return;

    const callerText = turns[simTurnIndex];
    setSimIsAdvancing(true);
    setSimTurnIndex((prev) => prev + 1);

    await processCallerSpeech(callerText);
    setSimIsAdvancing(false);
  }, [simTurnIndex, processCallerSpeech]);

  const toggleSimPause = () => {
    setSimIsPaused((prev) => !prev);
  };

  const restartSimulation = () => {
    startScreening('SIMULATION', activeScenario);
  };

  // Start Screening (Live or Simulation)
  const startScreening = useCallback(
    (modeToUse?: ScreeningMode, scenario?: DemoScenario | null) => {
      stopSounds();
      speechService.primeAudio();
      playAnswerBeep();

      const chosenMode = modeToUse || screeningModeRef.current;
      setScreeningMode(chosenMode);
      screeningModeRef.current = chosenMode;

      const isHi = activeLangRef.current === 'hi';

      let selScenario: DemoScenario | null = null;
      if (chosenMode === 'SIMULATION') {
        selScenario = scenario || activeScenarioRef.current || SIMULATION_SCENARIOS[1];
        setActiveScenario(selScenario);
        activeScenarioRef.current = selScenario;
        setCallerName(isHi && selScenario.callerIdentityHindi ? selScenario.callerIdentityHindi : selScenario.callerIdentity);
        setCallerNumber(selScenario.callerNumber);
      } else {
        setActiveScenario(null);
        activeScenarioRef.current = null;
        setCallerName(isHi ? 'अज्ञात कॉलर (Unknown)' : 'Unknown Caller');
        setCallerNumber('+91 98765 43210');
      }

      setCallStatus('screening');
      setCallStage('SCREENING');
      callStageRef.current = 'SCREENING';
      setCallDuration(0);
      setSimTurnIndex(0);
      setSimIsPaused(false);
      setSimIsAdvancing(false);
      setLiveThreatAlert(null);
      currentRiskScoreRef.current = 5;
      matchedCallRef.current = null;
      userVerificationRef.current = undefined;
      verificationPromptedRef.current = false;
      setMatchedCall(null);
      setUserVerification(undefined);
      setSummaryData(null);
      setShowSummaryModal(false);

      const initialTimeline: RiskTimelinePoint[] = [
        {
          turn: 0,
          score: 5,
          level: 'LOW',
          reason: 'CallGuard screening assistant initialized',
          triggerEvent: 'Assistant Greeting',
        },
      ];
      setRiskTimeline(initialTimeline);

      const greetingText = isHi
        ? 'नमस्ते। आप कॉल-गार्ड स्क्रीनिंग असिस्टेंट से जुड़े हैं। क्या आप संक्षेप में बता सकते हैं कि आपने किस कारण से कॉल किया है?'
        : "Hello. You've reached the CallGuard screening assistant. Could you briefly tell me the reason for your call?";

      const initAnalysis: RiskAnalysis = {
        riskScore: 5,
        riskLevel: 'LOW',
        intent: isHi ? 'कॉलर के वक्तव्य की प्रतीक्षा...' : 'Awaiting initial caller statement...',
        category: 'Initial Screening',
        signals: [],
        explanation: isHi
          ? 'कॉल-गार्ड स्क्रीनिंग असिस्टेंट सक्रिय है और कॉलर से पहचान और उद्देश्य पूछ रहा है।'
          : 'CallGuard screening assistant is active and prompting caller for identity and purpose.',
        recommendedAction: 'SCREEN_FURTHER',
        nextQuestion: greetingText,
        responseText: greetingText,
        isFinal: false,
        conversationStage: 'INITIAL',
      };
      setCurrentAnalysis(initAnalysis);

      const firstTurn: ConversationTurn = {
        id: `ai-init-${Date.now()}`,
        sender: 'ai',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        riskScoreAtTurn: 5,
      };

      setMessages([firstTurn]);
      messagesRef.current = [firstTurn];

      setActiveSpeaker('ai');
      updateVoiceState('speaking');

      const onFinishGreeting = () => {
        setActiveSpeaker('none');
        updateVoiceState('idle');

        if (chosenMode === 'LIVE' && autoListen) {
          startListeningMode(true);
        }
      };

      if (isMutedRef.current) {
        setTimeout(onFinishGreeting, 2000);
      } else {
        speechService.speakAI(
          greetingText,
          () => {
            setActiveSpeaker('ai');
            updateVoiceState('speaking');
          },
          onFinishGreeting,
          () => onFinishGreeting(),
          activeLangRef.current
        );
      }
    },
    [autoListen, updateVoiceState, startListeningMode]
  );

  // Transition call to connected with continuous monitoring
  const connectCall = useCallback(() => {
    playConnectTone();
    interruptSpeech();
    setCallStage('CONNECTED_MONITORING');
    callStageRef.current = 'CONNECTED_MONITORING';
    setCallStatus('connected');
    setLiveThreatAlert(null);
  }, [interruptSpeech]);

  // Hangup call
  const hangupCall = useCallback(
    (action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED' = 'DISMISSED', finalAnalysis?: RiskAnalysis | null) => {
      interruptSpeech();
      stopSounds();
      playHangupTone();

      const ana = finalAnalysis || currentAnalysis;
      const outcomeStatus: CallStatus = action === 'BLOCKED' ? 'blocked' : action === 'CONNECTED' ? 'connected' : 'ended';
      setCallStatus(outcomeStatus);
      setCallStage('ENDED');
      callStageRef.current = 'ENDED';

      // Create session record
      const sessionRecord: ScreeningSession = {
        id: `sess-${Date.now()}`,
        mode: screeningModeRef.current,
        language: activeLangRef.current,
        callerName,
        callerNumber,
        claimedOrganization: ana?.claimedOrganization,
        expectedContextMatch: matchedCallRef.current ? 'YES' : 'NO',
        matchedExpectedCall: matchedCallRef.current || undefined,
        userVerification: userVerificationRef.current,
        timestamp: 'Just now',
        durationSeconds: callDuration || 1,
        finalRiskScore: ana?.riskScore ?? currentRiskScoreRef.current,
        finalRiskLevel: ana?.riskLevel || (currentRiskScoreRef.current >= 71 ? 'HIGH' : currentRiskScoreRef.current >= 31 ? 'MEDIUM' : 'LOW'),
        intent: ana?.intent || 'Call completed',
        category: ana?.category || 'General Call',
        signals: ana?.signals || [],
        explanation: ana?.explanation || 'Screening concluded.',
        finalAction: action,
        scenarioTitle: activeScenarioRef.current?.title,
        transcript: messagesRef.current.map((m) => ({
          sender: m.sender,
          text: m.text,
          time: m.timestamp,
        })),
        riskTimeline: [...riskTimeline],
      };

      persistSessions([sessionRecord, ...sessions]);
      setSelectedSession(sessionRecord);

      setSummaryData({
        action,
        analysis: ana,
      });
      setShowSummaryModal(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentAnalysis, callerName, callerNumber, callDuration, riskTimeline, sessions, interruptSpeech]
  );

  const blockCaller = useCallback(() => {
    playSecurityAlert();
    hangupCall('BLOCKED');
  }, [hangupCall]);

  const resetCallToIncoming = useCallback(() => {
    interruptSpeech();
    setCallStatus('incoming');
    setCallStage('SCREENING');
    callStageRef.current = 'SCREENING';
    setLiveThreatAlert(null);
    setShowSummaryModal(false);
    setSummaryData(null);
  }, [interruptSpeech]);

  const totalSimTurns = activeScenario
    ? language === 'hi' && activeScenario.simulatedTurnsHindi?.length
      ? activeScenario.simulatedTurnsHindi.length
      : activeScenario.simulatedTurns.length
    : 0;

  return (
    <CallGuardContext.Provider
      value={{
        activeInterface,
        setActiveInterface,
        userPortalTab,
        setUserPortalTab,
        selectedSession,
        setSelectedSession,
        navigateToCallDetails,

        callStatus,
        setCallStatus,
        screeningMode,
        setScreeningMode,
        language,
        setLanguage,
        callerName,
        setCallerName,
        callerNumber,
        setCallerNumber,
        activeScenario,
        setActiveScenario,
        currentAnalysis,
        setCurrentAnalysis,
        isAnalyzing,
        callDuration,
        voiceState,
        activeSpeaker,
        messages,
        interimTranscript,
        errorMessage,
        setErrorMessage,

        riskTimeline,
        matchedCall,
        userVerification,
        callStage,
        liveThreatAlert,
        dismissThreatAlert,

        simTurnIndex,
        totalSimTurns,
        simIsPaused,
        simIsAdvancing,
        interactiveModeInSim,
        setInteractiveModeInSim,

        isMuted,
        toggleMute,
        autoListen,
        setAutoListen,
        micPermissionDenied,
        gnaniConfigured,

        sessions,
        clearSessions,
        deleteSession,

        showDemoModal,
        setShowDemoModal,
        showVerificationModal,
        setShowVerificationModal,
        showSummaryModal,
        setShowSummaryModal,
        summaryData,
        finalDecision: summaryData,
        setFinalDecision: setSummaryData,

        startScreening,
        processCallerSpeech,
        advanceSimulationTurn,
        toggleSimPause,
        restartSimulation,
        startListeningMode,
        stopListeningMode,
        interruptSpeech,
        handleWhisperInstruction,
        handleUserVerification,
        connectCall,
        hangupCall,
        blockCaller,
        resetCallToIncoming,
      }}
    >
      {children}
    </CallGuardContext.Provider>
  );
};

export function useCallGuard(): CallGuardContextType {
  const context = useContext(CallGuardContext);
  if (!context) {
    throw new Error('useCallGuard must be used within a CallGuardProvider');
  }
  return context;
}
