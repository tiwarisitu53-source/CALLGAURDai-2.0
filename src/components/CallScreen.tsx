import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  PhoneForwarded,
  Shield,
  Bot,
  User,
  Send,
  Sparkles,
  Pause,
  Play,
  SkipForward,
  RotateCcw,
  AlertCircle,
  Radio,
  Languages,
  MessageSquare,
  Skull,
  Columns,
  Activity,
} from 'lucide-react';
import {
  RiskAnalysis,
  ConversationTurn,
  VoiceState,
  ScreeningMode,
  DemoScenario,
  LanguageOption,
  ExpectedCall,
  UserVerificationResponse,
  RiskTimelinePoint,
  CallViewTab,
} from '../types';
import { CallerView } from './call-views/CallerView';
import { UserContextView } from './call-views/UserContextView';
import { UserShieldView } from './call-views/UserShieldView';
import { ScammerConsoleView } from './call-views/ScammerConsoleView';
import { speechService } from '../services/speech';
import { gnaniService } from '../services/gnaniService';
import { playAnswerBeep, playSecurityAlert, playConnectTone, playHangupTone } from '../services/soundEffects';
import { getExpectedCalls, matchExpectedCall } from '../services/expectedCalls';
import { UserVerificationModal } from './UserVerificationModal';
import { CallConnectionTransition } from './CallConnectionTransition';
import { LiveRiskAlertBanner } from './LiveRiskAlertBanner';
import { DynamicRiskTimeline } from './DynamicRiskTimeline';
import { CallSummaryModal } from './CallSummaryModal';

interface CallScreenProps {
  mode: ScreeningMode;
  language?: LanguageOption;
  callerName: string;
  callerNumber: string;
  activeScenario?: DemoScenario | null;
  onCallEnded: (
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED',
    analysis: RiskAnalysis | null,
    metadata?: {
      matchedExpectedCall?: ExpectedCall | null;
      userVerification?: UserVerificationResponse;
      riskTimeline?: RiskTimelinePoint[];
      peakRiskScore?: number;
    }
  ) => void;
  onRiskUpdate: (analysis: RiskAnalysis) => void;
  currentAnalysis: RiskAnalysis | null;
  onRestart?: () => void;
  onSwitchMode?: (newMode: ScreeningMode) => void;
  onLanguageChange?: (newLang: LanguageOption) => void;
  onGoToDashboard?: () => void;
}

interface QuickCue {
  id: string;
  label: string;
  labelHi: string;
  textEn: string;
  textHi: string;
  riskType: 'safe' | 'medium' | 'danger';
}

const INTERACTIVE_CUES: QuickCue[] = [
  {
    id: 'project',
    label: '💼 Project Meeting',
    labelHi: '💼 प्रोजेक्ट मीटिंग (सुरक्षित)',
    textEn: "Hi, I'm Rahul from the project team. I wanted to confirm tomorrow's presentation at 2 PM.",
    textHi: 'नमस्ते, मैं प्रोजेक्ट टीम से राहुल बात कर रहा हूँ। मुझे कल की 2 बजे वाली प्रेजेंटेशन के बारे में बात करनी थी।',
    riskType: 'safe',
  },
  {
    id: 'bank-inquiry',
    label: '🏦 Bank Problem',
    labelHi: '🏦 बैंक समस्या (जांच)',
    textEn: "I'm calling from your bank security department regarding a suspicious transaction.",
    textHi: 'नमस्ते, मैं आपके बैंक के सिक्योरिटी डिपार्टमेंट से बोल रहा हूँ। आपके कार्ड पर संदिग्ध ट्रांजेक्शन हुआ है।',
    riskType: 'medium',
  },
  {
    id: 'otp-scam',
    label: '🚨 Demand OTP',
    labelHi: '🚨 OTP की मांग (स्कैम)',
    textEn: 'To prevent immediate account freeze, I need the 6-digit OTP verification code sent to your phone right now.',
    textHi: 'अकाउंट तुरंत फ्रीज होने से बचाने के लिए, आपके फोन पर जो 6 अंकों का OTP आया है, वह तुरंत बताइए।',
    riskType: 'danger',
  },
  {
    id: 'lottery-prize',
    label: '🎁 Prize Sweepstakes',
    labelHi: '🎁 25 लाख लॉटरी (फ्रॉड)',
    textEn: 'Congratulations! You won $25,000 cash in our lucky draw. Just send a $150 processing fee to claim.',
    textHi: 'बधाई हो! आपको 25 लाख रुपये के नकद इनाम का विजेता चुना गया है। प्राइज रिलीज के लिए 1,500 रुपये फीस भेजें।',
    riskType: 'danger',
  },
  {
    id: 'tech-support',
    label: '💻 Remote Support',
    labelHi: '💻 AnyDesk रिमोट एक्सेस (फ्रॉड)',
    textEn: 'This is technical support. Your computer is infected with viruses. Install AnyDesk now so I can fix it.',
    textHi: 'मैं टेक्निकल सपोर्ट से हूँ। आपके कंप्यूटर में वायरस आ गया है, AnyDesk ऐप डाउनलोड करके स्क्रीन कंट्रोल दीजिए।',
    riskType: 'danger',
  },
  {
    id: 'utility-bill',
    label: '⚡ Utility Disconnect',
    labelHi: '⚡ बिजली कनेक्शन बिल (अर्जेंट)',
    textEn: 'Your electricity bill is overdue. Pay immediately over the phone or your power will be disconnected tonight.',
    textHi: 'आपका बिजली का बिल बकाया है। यदि तुरंत भुगतान नहीं किया तो आज रात कनेक्शन काट दिया जाएगा।',
    riskType: 'danger',
  },
  {
    id: 'courier-delivery',
    label: '📦 Courier Address',
    labelHi: '📦 पार्सल डिलीवरी (पता अपडेट)',
    textEn: 'I have a delivery parcel for you, but the street address is incomplete. Please confirm your address.',
    textHi: 'आपके नाम का एक कूरियर पार्सल आया है, लेकिन डिलीवरी का पता अधूरा है। कृपया अपना सही पता बताएं।',
    riskType: 'safe',
  },
  {
    id: 'inquiry-who',
    label: '❓ Who is Calling?',
    labelHi: '❓ आप कौन बोल रहे हैं?',
    textEn: 'May I know who is speaking, and from which official department are you calling?',
    textHi: 'नमस्ते, क्या मैं जान सकता हूँ कि आप कौन बोल रहे हैं और किस विभाग या कंपनी से कॉल किया है?',
    riskType: 'safe',
  },
  {
    id: 'refusal-otp',
    label: '❌ Refuse Passwords',
    labelHi: '❌ पासवर्ड / OTP देने से इनकार',
    textEn: 'I will not share any passwords, OTP codes, or personal banking credentials over an unverified phone call.',
    textHi: 'मैं फोन कॉल पर किसी के साथ भी अपना पासवर्ड, बैंक डिटेल्स या OTP शेयर नहीं करूँगा।',
    riskType: 'safe',
  },
  {
    id: 'amazon-delivery',
    label: '🛒 Amazon Delivery',
    labelHi: '🛒 अमेज़न डिलीवरी (सुरक्षित)',
    textEn: "Namaste, I'm calling from Amazon delivery to confirm if you are home to receive your package.",
    textHi: 'नमस्ते, मैं अमेज़न डिलीवरी से बात कर रहा हूँ। क्या आप घर पर हैं अपना पार्सल रिसीव करने के लिए?',
    riskType: 'safe',
  },
  {
    id: 'amazon-otp-fraud',
    label: '🚨 Amazon OTP Fraud',
    labelHi: '🚨 अमेज़न फर्जी OTP (स्कैम)',
    textEn: 'Main Amazon customer care se bol raha hoon. Aapka account block hone wala hai, turant verification OTP share kar dijiye.',
    textHi: 'मैं अमेज़न कस्टमर केयर से बोल रहा हूँ। आपके अकाउंट में अनधिकृत ऑर्डर हुआ है, वेरिफिकेशन OTP तुरंत शेयर कर दीजिए।',
    riskType: 'danger',
  },
];

export const CallScreen: React.FC<CallScreenProps> = ({
  mode,
  language = 'en',
  callerName,
  callerNumber,
  activeScenario,
  onCallEnded,
  onRiskUpdate,
  currentAnalysis,
  onRestart,
  onSwitchMode,
  onLanguageChange,
  onGoToDashboard,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('speaking');
  const [activeSpeaker, setActiveSpeaker] = useState<'ai' | 'caller' | 'none'>('ai');
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [greetingFinished, setGreetingFinished] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [interactiveModeInSim, setInteractiveModeInSim] = useState(false);
  const [activeLang, setActiveLang] = useState<LanguageOption>(language);
  const [gnaniConfigured, setGnaniConfigured] = useState<boolean>(false);

  // Context match & User verification states
  const [matchedCall, setMatchedCall] = useState<ExpectedCall | null>(null);
  const [userVerification, setUserVerification] = useState<UserVerificationResponse | undefined>(undefined);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const matchedCallRef = useRef<ExpectedCall | null>(null);
  const userVerificationRef = useRef<UserVerificationResponse | undefined>(undefined);
  const verificationPromptedRef = useRef(false);

  // Call stage transition: Screening -> Ready to Connect -> Connected with Live Shield
  const [callStage, setCallStage] = useState<'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING' | 'ENDED'>('SCREENING');
  const callStageRef = useRef<'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING' | 'ENDED'>('SCREENING');
  callStageRef.current = callStage;

  // Dynamic risk trajectory points (Feature 7)
  const [riskTimeline, setRiskTimeline] = useState<RiskTimelinePoint[]>([
    {
      turn: 0,
      score: 5,
      level: 'LOW',
      reason: 'CallGuard screening assistant initialized',
      triggerEvent: 'Assistant Greeting',
    },
  ]);

  // Live Threat Alert Banner (Feature 6)
  const [liveThreatAlert, setLiveThreatAlert] = useState<{
    score: number;
    threatType: string;
    threatDetails?: string;
  } | null>(null);

  // Call Summary Modal (Feature 8)
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
    analysis: RiskAnalysis | null;
  } | null>(null);

  // Check Gnani AI credentials status
  useEffect(() => {
    gnaniService.getStatus().then((st) => {
      setGnaniConfigured(st.configured);
    }).catch(() => {
      setGnaniConfigured(false);
    });
  }, []);

  // Simulation specific state
  const [simTurnIndex, setSimTurnIndex] = useState(0);
  const [simIsPaused, setSimIsPaused] = useState(false);
  const [simIsAdvancing, setSimIsAdvancing] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<CallViewTab>('caller');

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(false);
  const durationTimerRef = useRef<number | null>(null);
  const currentRiskScoreRef = useRef(5);
  const simPausedRef = useRef(false);
  const messagesRef = useRef<ConversationTurn[]>([]);
  const voiceStateRef = useRef<VoiceState>('speaking');
  const greetingFinishedRef = useRef(false);

  messagesRef.current = messages;
  simPausedRef.current = simIsPaused;

  const isHindi = activeLang === 'hi';

  const updateVoiceState = useCallback((nextState: VoiceState) => {
    voiceStateRef.current = nextState;
    setVoiceState(nextState);
  }, []);

  const initialGreeting = isHindi
    ? 'नमस्ते। आप कॉल-गार्ड स्क्रीनिंग असिस्टेंट से जुड़े हैं। क्या आप संक्षेप में बता सकते हैं कि आपने किस कारण से कॉल किया है?'
    : "Hello. You've reached the CallGuard screening assistant. Could you briefly tell me the reason for your call?";

  // Keep activeLang in sync with prop if changed from outside
  useEffect(() => {
    setActiveLang(language);
  }, [language]);

  // Handle on-the-fly language toggle directly in CallScreen
  const handleToggleLanguage = (newLang: LanguageOption) => {
    setActiveLang(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Duration timer
  useEffect(() => {
    durationTimerRef.current = window.setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Immediate speech interruption helper
  const interruptSpeech = useCallback(() => {
    speechService.stopSpeaking();
    setActiveSpeaker('none');
    updateVoiceState('idle');
    greetingFinishedRef.current = true;
    setGreetingFinished(true);
  }, [updateVoiceState]);

  // STT Listening mode for LIVE mode or Interactive simulation
  const startListeningMode = useCallback(
    (isAutomatic = false) => {
      if (voiceStateRef.current === 'analyzing') return;

      speechService.stopSpeaking();
      greetingFinishedRef.current = true;
      setGreetingFinished(true);
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
        (errorMsg: string) => {
          isListeningRef.current = false;
          setActiveSpeaker('none');
          updateVoiceState('idle');
          setInterimTranscript('');
          if (errorMsg.includes('permission') || errorMsg.includes('not-allowed')) {
            setMicPermissionDenied(true);
          } else if (
            !isAutomatic &&
            !errorMsg.includes('no-speech') &&
            !errorMsg.includes('aborted')
          ) {
            setErrorMessage(errorMsg);
          }
        },
        () => {
          isListeningRef.current = false;
          if (voiceStateRef.current === 'listening') {
            updateVoiceState('idle');
          }
        },
        activeLang
      );

      if (!started) {
        isListeningRef.current = false;
        updateVoiceState('idle');
      }
    },
    [activeLang, updateVoiceState]
  );

  const stopListeningMode = useCallback(() => {
    speechService.stopListening();
    isListeningRef.current = false;
    updateVoiceState('idle');
    setInterimTranscript('');
  }, [updateVoiceState]);

  // Process a caller statement through the unified risk-analysis engine (/api/screen)
  const processCallerSpeech = useCallback(
    async (callerUtterance: string) => {
      if (!callerUtterance.trim()) return;

      // Immediately cancel any speech or greeting
      speechService.stopSpeaking();
      greetingFinishedRef.current = true;
      setGreetingFinished(true);
      setErrorMessage(null);
      setActiveSpeaker('none');
      updateVoiceState('analyzing');

      // Feature 1: Context Matching check
      const expectedList = getExpectedCalls();
      const matchResult = matchExpectedCall(callerUtterance, callerName, expectedList);
      const matched = matchResult.matched ? matchResult.expectedCall : undefined;
      if (matched && !matchedCallRef.current) {
        matchedCallRef.current = matched;
        setMatchedCall(matched);
      }

      // Feature 2: Trigger User Verification popup on caller claim
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
          lower.includes('interview'))
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
            language: activeLang,
            expectedCalls: expectedList,
            userVerification: userVerificationRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error(`Screening server error (${response.status})`);
        }

        const analysis: RiskAnalysis = await response.json();
        currentRiskScoreRef.current = analysis.riskScore;
        onRiskUpdate(analysis);

        // Feature 7: Add to dynamic risk timeline
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

        // Stamp caller turn with resulting risk score and signals
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

        // Feature 6: Live Threat Alert Banner on high risk escalation
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

        // Feature 4: Transition to Ready to Connect if AI recommends CONNECT during screening
        if (analysis.recommendedAction === 'CONNECT' && callStageRef.current === 'SCREENING') {
          setCallStage('READY_TO_CONNECT');
        }

        // Add AI response turn
        const aiResponseText =
          activeLang === 'hi' && analysis.responseTextHindi
            ? analysis.responseTextHindi
            : analysis.responseText || analysis.nextQuestion;

        const aiTurn: ConversationTurn = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          riskScoreAtTurn: analysis.riskScore,
        };

        setMessages((prev) => [...prev, aiTurn]);
        setActiveSpeaker('ai');
        updateVoiceState('speaking');

        const onFinishSpeaking = () => {
          setActiveSpeaker('none');
          updateVoiceState('idle');

          if (analysis.isFinal) {
            setTimeout(() => {
              if (analysis.recommendedAction === 'BLOCK') {
                playHangupTone();
                setSummaryData({ action: 'BLOCKED', analysis });
                setShowSummaryModal(true);
              } else if (analysis.recommendedAction === 'CONNECT') {
                if (callStageRef.current === 'SCREENING') {
                  setCallStage('READY_TO_CONNECT');
                } else {
                  setSummaryData({ action: 'CONNECTED', analysis });
                  setShowSummaryModal(true);
                }
              }
            }, 1500);
            return;
          }

          // In LIVE mode: auto-resume listening when AI finishes speaking
          if (mode === 'LIVE' && autoListen && !isListeningRef.current) {
            startListeningMode(true);
          }
        };

        if (isMuted) {
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
            activeLang
          );
        }
      } catch (err: any) {
        console.error('Call screening turn failed:', err);
        setErrorMessage(err?.message || 'Failed to process caller utterance. Please try again.');
        setActiveSpeaker('none');
        updateVoiceState('idle');
      }
    },
    [callerName, callerNumber, isMuted, mode, autoListen, activeLang, onRiskUpdate, onCallEnded, updateVoiceState, startListeningMode]
  );

  // Whisper instruction from protected user to CallGuard AI
  const handleWhisperInstruction = useCallback(
    async (instruction: string) => {
      if (!instruction.trim()) return;
      const whisperTurn: ConversationTurn = {
        id: `user-whisper-${Date.now()}`,
        sender: 'ai',
        text: isHindi
          ? `🛡️ [उपयोगकर्ता का निर्देश]: "${instruction}"`
          : `🛡️ [User Secret Whisper]: "${instruction}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMessages((prev) => [...prev, whisperTurn]);

      const whisperPrompt = `The protected user whispered an instruction: "${instruction}". As CallGuard AI, deliver a professional, firm counter-statement or inquiry to the caller now without stating that the user whispered.`;
      await processCallerSpeech(whisperPrompt);
    },
    [isHindi, processCallerSpeech]
  );

  // Request/Retry microphone permission
  const handleRetryMicPermission = async () => {
    setErrorMessage(null);
    const granted = await speechService.requestMicrophonePermission();
    if (granted) {
      setMicPermissionDenied(false);
      startListeningMode(true);
    } else {
      setMicPermissionDenied(true);
      setErrorMessage(
        isHindi
          ? 'माइक्रोफ़ोन एक्सेस ब्लॉक है। कृपया नीचे दिए गए त्वरित बटनों का उपयोग करें या टेक्स्ट टाइप करें।'
          : 'Microphone access is blocked. Please use the quick response buttons or type text below.'
      );
    }
  };

  // Initial call start & greeting: Resilient and complete playback
  useEffect(() => {
    let active = true;

    playAnswerBeep();

    const firstTurn: ConversationTurn = {
      id: 'turn-init',
      sender: 'ai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      riskScoreAtTurn: 5,
    };

    setMessages([firstTurn]);
    setActiveSpeaker('ai');
    updateVoiceState('speaking');

    const handleGreetingEnd = () => {
      if (!active) return;
      greetingFinishedRef.current = true;
      setActiveSpeaker('none');
      updateVoiceState('idle');
      setGreetingFinished(true);

      if (mode === 'LIVE') {
        if (autoListen) {
          startListeningMode(true);
        }
      }
    };

    // Small delay (80ms) so audio context & voices are primed
    const startTimer = setTimeout(() => {
      if (!active) return;

      if (isMuted) {
        setTimeout(handleGreetingEnd, 1500);
      } else {
        speechService.speakAI(
          initialGreeting,
          () => {
            if (!active) return;
            setActiveSpeaker('ai');
            updateVoiceState('speaking');
          },
          handleGreetingEnd,
          () => handleGreetingEnd(),
          activeLang
        );
      }
    }, 80);

    // Generous fail-safe watchdog (30 seconds) that never cuts off speech mid-sentence
    const greetingFallbackTimer = setTimeout(() => {
      if (active && !greetingFinishedRef.current) {
        handleGreetingEnd();
      }
    }, Math.max(25000, initialGreeting.length * 200 + 8000));

    return () => {
      active = false;
      clearTimeout(startTimer);
      clearTimeout(greetingFallbackTimer);
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // Determine active simulated turns (Hindi or English)
  const getSimulatedTurns = useCallback((): string[] => {
    if (!activeScenario) return [];
    if (isHindi && activeScenario.simulatedTurnsHindi && activeScenario.simulatedTurnsHindi.length > 0) {
      return activeScenario.simulatedTurnsHindi;
    }
    return activeScenario.simulatedTurns || [];
  }, [activeScenario, isHindi]);

  // SIMULATION MODE: Fully audible progressive turn execution
  const executeSimulationTurn = useCallback(
    async (turnIndex: number) => {
      const turns = getSimulatedTurns();
      if (!turns || turns.length === 0) return;
      if (turnIndex >= turns.length) return;

      const statement = turns[turnIndex];
      setSimIsAdvancing(true);

      // Feature 1: Context matching check for simulation turn
      const expectedList = getExpectedCalls();
      const matchResult = matchExpectedCall(statement, callerName, expectedList);
      const matched = matchResult.matched ? matchResult.expectedCall : undefined;
      if (matched && !matchedCallRef.current) {
        matchedCallRef.current = matched;
        setMatchedCall(matched);
      }

      // Feature 2: Trigger User Verification popup on caller claim in simulation
      const lower = statement.toLowerCase();
      if (
        !verificationPromptedRef.current &&
        (matched ||
          lower.includes('bank') ||
          lower.includes('punjab') ||
          lower.includes('credit') ||
          lower.includes('card') ||
          lower.includes('application'))
      ) {
        verificationPromptedRef.current = true;
        setShowVerificationModal(true);
      }

      // Step 1: Add caller turn to transcript
      const callerTurn: ConversationTurn = {
        id: `caller-${Date.now()}-${turnIndex}`,
        sender: 'caller',
        text: statement.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      const updatedHistory = [...messagesRef.current, callerTurn];
      setMessages(updatedHistory);
      setActiveSpeaker('caller');
      updateVoiceState('speaking');

      // Step 2: Caller SPEAKS AUDIBLY in appropriate language
      const onCallerFinishedSpeaking = async () => {
        setActiveSpeaker('none');
        updateVoiceState('analyzing');

        // Step 3: Analyze statement through Gemini risk engine (/api/screen)
        try {
          const response = await fetch('/api/screen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callerName,
              callerNumber,
              history: updatedHistory.map((m) => ({ sender: m.sender, text: m.text })),
              userMessage: statement.trim(),
              currentRiskScore: currentRiskScoreRef.current,
              language: activeLang,
              expectedCalls: expectedList,
              userVerification: userVerificationRef.current,
            }),
          });

          if (!response.ok) {
            throw new Error(`Screening server error (${response.status})`);
          }

          const analysis: RiskAnalysis = await response.json();
          currentRiskScoreRef.current = analysis.riskScore;
          onRiskUpdate(analysis);

          // Feature 7: Add point to dynamic risk timeline
          const callerTurnsCount = updatedHistory.filter((m) => m.sender === 'caller').length;
          const timelinePoint: RiskTimelinePoint = {
            turn: callerTurnsCount,
            score: analysis.riskScore,
            level: analysis.riskLevel,
            reason: analysis.explanation,
            triggerEvent:
              analysis.signals?.[0] ||
              (analysis.riskScore >= 71
                ? 'Critical Threat Escalation'
                : analysis.riskScore <= 30
                ? 'Context Match Low-Risk'
                : 'Routine Dialogue'),
          };
          setRiskTimeline((prev) => [...prev, timelinePoint]);

          // Update caller message with risk score & detected signals
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

          // Feature 6: Live Threat Alert Banner on high risk escalation
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

          // Feature 4: Transition to Ready to Connect if AI recommends CONNECT during screening
          if (analysis.recommendedAction === 'CONNECT' && callStageRef.current === 'SCREENING') {
            setCallStage('READY_TO_CONNECT');
          }

          // Step 4: Add CallGuard AI response turn
          const aiResponseText =
            activeLang === 'hi' && analysis.responseTextHindi
              ? analysis.responseTextHindi
              : analysis.responseText || analysis.nextQuestion;

          const aiTurn: ConversationTurn = {
            id: `ai-${Date.now()}-${turnIndex}`,
            sender: 'ai',
            text: aiResponseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            riskScoreAtTurn: analysis.riskScore,
          };

          setMessages((prev) => [...prev, aiTurn]);
          setActiveSpeaker('ai');
          updateVoiceState('speaking');

          // Step 5: CallGuard AI SPEAKS AUDIBLY in appropriate language
          const onAIFinishedSpeaking = () => {
            setActiveSpeaker('none');
            updateVoiceState('idle');
            setSimTurnIndex(turnIndex + 1);
            setSimIsAdvancing(false);

            if (analysis.isFinal) {
              setTimeout(() => {
                if (analysis.recommendedAction === 'BLOCK') {
                  playHangupTone();
                  setSummaryData({ action: 'BLOCKED', analysis });
                  setShowSummaryModal(true);
                } else if (analysis.recommendedAction === 'CONNECT') {
                  if (callStageRef.current === 'SCREENING') {
                    setCallStage('READY_TO_CONNECT');
                  } else {
                    setSummaryData({ action: 'CONNECTED', analysis });
                    setShowSummaryModal(true);
                  }
                }
              }, 1500);
              return;
            }

            if (analysis.recommendedAction === 'CONNECT' && callStageRef.current === 'SCREENING') {
              setCallStage('READY_TO_CONNECT');
            }
          };

          if (isMuted) {
            setTimeout(onAIFinishedSpeaking, Math.min(Math.max(aiResponseText.length * 50, 1500), 3500));
          } else {
            speechService.speakAI(
              aiResponseText,
              () => {
                setActiveSpeaker('ai');
                updateVoiceState('speaking');
              },
              onAIFinishedSpeaking,
              () => onAIFinishedSpeaking(),
              activeLang
            );
          }
        } catch (err: any) {
          console.error('Simulation turn error:', err);
          setErrorMessage(err?.message || 'Simulation turn failed.');
          setActiveSpeaker('none');
          updateVoiceState('idle');
          setSimIsAdvancing(false);
        }
      };

      if (isMuted) {
        setTimeout(onCallerFinishedSpeaking, Math.min(Math.max(statement.length * 50, 1500), 3000));
      } else {
        speechService.speakCaller(
          statement,
          () => {
            setActiveSpeaker('caller');
            updateVoiceState('speaking');
          },
          onCallerFinishedSpeaking,
          () => onCallerFinishedSpeaking(),
          activeLang
        );
      }
    },
    [getSimulatedTurns, callerName, callerNumber, isMuted, activeLang, onRiskUpdate, onCallEnded, updateVoiceState]
  );

  // In Simulation Mode, auto-trigger next turn when idle, not paused, and greeting is finished
  useEffect(() => {
    if (mode !== 'SIMULATION' || !activeScenario) return;
    if (simIsPaused || simIsAdvancing || interactiveModeInSim) return;
    if (callStage === 'READY_TO_CONNECT') return; // Pause for connection transition
    if (voiceState === 'analyzing' || voiceState === 'speaking') return;
    if (!greetingFinished) return; // Wait for assistant intro to complete

    const turns = getSimulatedTurns();

    // Trigger turn 0 after initial greeting finishes
    if (simTurnIndex === 0) {
      const timer = window.setTimeout(() => {
        if (!simPausedRef.current && !interactiveModeInSim && callStageRef.current !== 'READY_TO_CONNECT') {
          executeSimulationTurn(0);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }

    // Auto-advance subsequent turns when AI finishes speaking
    if (voiceState === 'idle' && !currentAnalysis?.isFinal && callStage !== 'READY_TO_CONNECT') {
      if (simTurnIndex < turns.length) {
        const timer = window.setTimeout(() => {
          if (!simPausedRef.current && !interactiveModeInSim && callStageRef.current !== 'READY_TO_CONNECT') {
            executeSimulationTurn(simTurnIndex);
          }
        }, 1600);
        return () => clearTimeout(timer);
      }
    }
  }, [
    mode,
    activeScenario,
    greetingFinished,
    simTurnIndex,
    simIsPaused,
    simIsAdvancing,
    interactiveModeInSim,
    voiceState,
    currentAnalysis,
    callStage,
    getSimulatedTurns,
    executeSimulationTurn,
  ]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput.trim();
    setManualInput('');
    setErrorMessage(null);
    processCallerSpeech(text);
  };

  const handleRestart = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setActiveSpeaker('none');
    setSimTurnIndex(0);
    setSimIsPaused(false);
    setGreetingFinished(false);
    currentRiskScoreRef.current = 5;
    if (onRestart) {
      onRestart();
    }
  };

  const replayGreeting = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setActiveSpeaker('ai');
    updateVoiceState('speaking');
    speechService.speakAI(
      initialGreeting,
      () => {
        setActiveSpeaker('ai');
        updateVoiceState('speaking');
      },
      () => {
        setActiveSpeaker('none');
        updateVoiceState('idle');
        setGreetingFinished(true);
        if (mode === 'LIVE' && autoListen) {
          startListeningMode(true);
        }
      },
      () => {
        setActiveSpeaker('none');
        updateVoiceState('idle');
      },
      activeLang
    );
  };

  const turnsTotal = (getSimulatedTurns() || []).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Master View Navigation Tab Bar: Caller View vs User Context View vs Split View */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
          {/* Caller View Tab */}
          <button
            type="button"
            id="tab-caller-view"
            onClick={() => setActiveViewTab('caller')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-bold transition-all ${
              activeViewTab === 'caller'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-200" />
            <span>{isHindi ? 'कॉलर दृश्य (Caller View)' : 'Caller View'}</span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-normal bg-cyan-950/80 text-cyan-200 border border-cyan-500/30">
              {isHindi ? 'वार्तालाप व AI' : 'Transcript & AI'}
            </span>
          </button>

          {/* User Context View Tab */}
          <button
            type="button"
            id="tab-user-context-view"
            onClick={() => setActiveViewTab('user_context')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-bold transition-all ${
              activeViewTab === 'user_context'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-200" />
            <span>{isHindi ? 'उपयोगकर्ता संदर्भ (User Context View)' : 'User Context View'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-900/80 text-emerald-300 border border-emerald-500/30">
              {currentRiskScoreRef.current}/100
            </span>
            <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-normal bg-emerald-950/80 text-emerald-200 border border-emerald-500/30">
              {isHindi ? 'जोखिम व सत्यापन' : 'Timeline & Verification'}
            </span>
          </button>

          {/* Split View Tab */}
          <button
            type="button"
            id="tab-split-view"
            onClick={() => setActiveViewTab('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeViewTab === 'split'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-indigo-300" />
            <span>{isHindi ? 'विभाजित दृश्य (Split)' : 'Split View'}</span>
          </button>
        </div>

        {/* Global Controls: Language Switcher, Caller ID summary */}
        <div className="flex items-center gap-2">
          {/* Interactive Language Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleToggleLanguage('en')}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                activeLang === 'en'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to English screening"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLanguage('hi')}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                activeLang === 'hi'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Hindi / Hinglish screening"
            >
              हिंदी
            </button>
          </div>

          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            {mode === 'LIVE' ? 'Live Voice' : 'Simulation'}
          </span>
        </div>
      </div>

      {/* Main Tabbed Views Area */}
      <div className="flex-1 overflow-hidden p-2 sm:p-3">
        {activeViewTab === 'caller' && (
          <CallerView
            messages={messages}
            voiceState={voiceState}
            activeSpeaker={activeSpeaker}
            isTranscribing={voiceState === 'listening' && !!interimTranscript}
            liveTranscription={interimTranscript}
            isAnalyzing={voiceState === 'analyzing'}
            callDuration={callDuration}
            isMuted={isMuted}
            onToggleMute={() => {
              if (!isMuted) speechService.stopSpeaking();
              setIsMuted(!isMuted);
            }}
            language={activeLang}
            onToggleLanguage={handleToggleLanguage}
            callerName={callerName}
            callerNumber={callerNumber}
            activeScenario={activeScenario}
            mode={mode}
            onSpeakAsCaller={(text?: string) => {
              if (text) {
                if (voiceState === 'speaking') interruptSpeech();
                processCallerSpeech(text);
              } else {
                if (voiceState === 'speaking') interruptSpeech();
                if (voiceState === 'listening') stopListeningMode();
                else startListeningMode(true);
              }
            }}
            isListening={voiceState === 'listening'}
            manualInput={manualInput}
            setManualInput={setManualInput}
            onSubmitManualInput={() => {
              if (manualInput.trim()) {
                if (voiceState === 'speaking') interruptSpeech();
                processCallerSpeech(manualInput.trim());
                setManualInput('');
              }
            }}
            onInterruptAudio={interruptSpeech}
            onReplayGreeting={replayGreeting}
            isPaused={simIsPaused}
            onTogglePause={() => setSimIsPaused(!simIsPaused)}
            onNextTurn={() => {
              if (voiceState === 'speaking') interruptSpeech();
              executeSimulationTurn(simTurnIndex);
            }}
            onRestartSimulation={handleRestart}
            simTurnIndex={simTurnIndex}
            totalSimTurns={turnsTotal}
            currentAnalysis={currentAnalysis}
            currentRiskScore={currentRiskScoreRef.current}
            onEndCall={(action) => {
              playHangupTone();
              setSummaryData({ action, analysis: currentAnalysis });
              setShowSummaryModal(true);
            }}
          />
        )}

        {activeViewTab === 'user_context' && (
          <UserContextView
            currentAnalysis={currentAnalysis}
            riskTimeline={riskTimeline}
            currentRiskScore={currentRiskScoreRef.current}
            callerName={callerName}
            callerNumber={callerNumber}
            language={activeLang}
            matchedExpectedCall={matchedCall}
            userVerification={userVerificationRef.current}
            onUserVerificationChange={(res) => {
              setUserVerification(res);
              userVerificationRef.current = res;
              if (res === 'UNEXPECTED') {
                currentRiskScoreRef.current = Math.min(100, currentRiskScoreRef.current + 25);
              }
            }}
            onSendWhisper={handleWhisperInstruction}
            onJoinCall={() => {
              setCallStage('CONNECTED_MONITORING');
              playConnectTone();
              if (mode === 'SIMULATION') {
                setTimeout(() => {
                  const turns = getSimulatedTurns();
                  if (simTurnIndex < turns.length) {
                    executeSimulationTurn(simTurnIndex);
                  }
                }, 800);
              }
            }}
            onDeclineCall={() => {
              playHangupTone();
              setSummaryData({ action: 'DISMISSED', analysis: currentAnalysis });
              setShowSummaryModal(true);
            }}
            onBlockAndReport={() => {
              playHangupTone();
              setSummaryData({ action: 'BLOCKED', analysis: currentAnalysis });
              setShowSummaryModal(true);
            }}
            callStage={callStage}
            liveThreatAlert={liveThreatAlert}
          />
        )}

        {activeViewTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-y-auto">
            {/* Left: Caller View (Transcript & AI Interaction) */}
            <div className="h-full min-h-[500px]">
              <CallerView
                messages={messages}
                voiceState={voiceState}
                activeSpeaker={activeSpeaker}
                isTranscribing={voiceState === 'listening' && !!interimTranscript}
                liveTranscription={interimTranscript}
                isAnalyzing={voiceState === 'analyzing'}
                callDuration={callDuration}
                isMuted={isMuted}
                onToggleMute={() => {
                  if (!isMuted) speechService.stopSpeaking();
                  setIsMuted(!isMuted);
                }}
                language={activeLang}
                onToggleLanguage={handleToggleLanguage}
                callerName={callerName}
                callerNumber={callerNumber}
                activeScenario={activeScenario}
                mode={mode}
                onSpeakAsCaller={(text?: string) => {
                  if (text) {
                    if (voiceState === 'speaking') interruptSpeech();
                    processCallerSpeech(text);
                  } else {
                    if (voiceState === 'speaking') interruptSpeech();
                    if (voiceState === 'listening') stopListeningMode();
                    else startListeningMode(true);
                  }
                }}
                isListening={voiceState === 'listening'}
                manualInput={manualInput}
                setManualInput={setManualInput}
                onSubmitManualInput={() => {
                  if (manualInput.trim()) {
                    if (voiceState === 'speaking') interruptSpeech();
                    processCallerSpeech(manualInput.trim());
                    setManualInput('');
                  }
                }}
                onInterruptAudio={interruptSpeech}
                onReplayGreeting={replayGreeting}
                isPaused={simIsPaused}
                onTogglePause={() => setSimIsPaused(!simIsPaused)}
                onNextTurn={() => {
                  if (voiceState === 'speaking') interruptSpeech();
                  executeSimulationTurn(simTurnIndex);
                }}
                onRestartSimulation={handleRestart}
                simTurnIndex={simTurnIndex}
                totalSimTurns={turnsTotal}
                currentAnalysis={currentAnalysis}
                currentRiskScore={currentRiskScoreRef.current}
                onEndCall={(action) => {
                  playHangupTone();
                  setSummaryData({ action, analysis: currentAnalysis });
                  setShowSummaryModal(true);
                }}
              />
            </div>

            {/* Right: User Context View (Risk Timeline & Verification) */}
            <div className="h-full min-h-[500px]">
              <UserContextView
                currentAnalysis={currentAnalysis}
                riskTimeline={riskTimeline}
                currentRiskScore={currentRiskScoreRef.current}
                callerName={callerName}
                callerNumber={callerNumber}
                language={activeLang}
                matchedExpectedCall={matchedCall}
                userVerification={userVerificationRef.current}
                onUserVerificationChange={(res) => {
                  setUserVerification(res);
                  userVerificationRef.current = res;
                  if (res === 'UNEXPECTED') {
                    currentRiskScoreRef.current = Math.min(100, currentRiskScoreRef.current + 25);
                  }
                }}
                onSendWhisper={handleWhisperInstruction}
                onJoinCall={() => {
                  setCallStage('CONNECTED_MONITORING');
                  playConnectTone();
                  if (mode === 'SIMULATION') {
                    setTimeout(() => {
                      const turns = getSimulatedTurns();
                      if (simTurnIndex < turns.length) {
                        executeSimulationTurn(simTurnIndex);
                      }
                    }, 800);
                  }
                }}
                onDeclineCall={() => {
                  playHangupTone();
                  setSummaryData({ action: 'DISMISSED', analysis: currentAnalysis });
                  setShowSummaryModal(true);
                }}
                onBlockAndReport={() => {
                  playHangupTone();
                  setSummaryData({ action: 'BLOCKED', analysis: currentAnalysis });
                  setShowSummaryModal(true);
                }}
                callStage={callStage}
                liveThreatAlert={liveThreatAlert}
              />
            </div>
          </div>
        )}
      </div>

      {/* Feature 2: User Verification Popup */}
      <UserVerificationModal
        isOpen={showVerificationModal}
        callerClaimedOrg={matchedCall?.organization || currentAnalysis?.claimedOrganization || callerName}
        callerReason={matchedCall?.reason || currentAnalysis?.intent || 'Account / Inquiry Verification'}
        matchedExpectedCall={matchedCall}
        onRespond={(res) => {
          setUserVerification(res);
          userVerificationRef.current = res;
          setShowVerificationModal(false);
          if (res === 'UNEXPECTED') {
            currentRiskScoreRef.current = Math.min(100, currentRiskScoreRef.current + 25);
          }
        }}
        language={activeLang}
      />

      {/* Feature 8: Continuous Monitoring & Call Summary Modal */}
      {showSummaryModal && summaryData && (
        <CallSummaryModal
          isOpen={showSummaryModal}
          action={summaryData.action}
          callerName={callerName}
          callerNumber={callerNumber}
          callDuration={callDuration}
          finalAnalysis={summaryData.analysis}
          matchedExpectedCall={matchedCall}
          userVerification={userVerificationRef.current}
          riskTimeline={riskTimeline}
          onClose={() => {
            setShowSummaryModal(false);
            onCallEnded(summaryData.action, summaryData.analysis, {
              matchedExpectedCall: matchedCall,
              userVerification: userVerificationRef.current,
              riskTimeline: riskTimeline,
              peakRiskScore: Math.max(...riskTimeline.map((p) => p.score), summaryData.analysis?.riskScore || 0),
            });
          }}
          onGoToDashboard={() => {
            setShowSummaryModal(false);
            onCallEnded(summaryData.action, summaryData.analysis, {
              matchedExpectedCall: matchedCall,
              userVerification: userVerificationRef.current,
              riskTimeline: riskTimeline,
              peakRiskScore: Math.max(...riskTimeline.map((p) => p.score), summaryData.analysis?.riskScore || 0),
            });
            if (onGoToDashboard) onGoToDashboard();
          }}
          language={activeLang}
        />
      )}
    </div>
  );
};
