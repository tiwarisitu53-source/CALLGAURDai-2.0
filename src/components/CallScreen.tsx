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
} from 'lucide-react';
import {
  RiskAnalysis,
  ConversationTurn,
  VoiceState,
  ScreeningMode,
  DemoScenario,
  LanguageOption,
} from '../types';
import { speechService } from '../services/speech';
import { gnaniService } from '../services/gnaniService';
import { playAnswerBeep, playSecurityAlert, playConnectTone, playHangupTone } from '../services/soundEffects';

interface CallScreenProps {
  mode: ScreeningMode;
  language?: LanguageOption;
  callerName: string;
  callerNumber: string;
  activeScenario?: DemoScenario | null;
  onCallEnded: (action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED', analysis: RiskAnalysis | null) => void;
  onRiskUpdate: (analysis: RiskAnalysis) => void;
  currentAnalysis: RiskAnalysis | null;
  onRestart?: () => void;
  onSwitchMode?: (newMode: ScreeningMode) => void;
  onLanguageChange?: (newLang: LanguageOption) => void;
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
          }),
        });

        if (!response.ok) {
          throw new Error(`Screening server error (${response.status})`);
        }

        const analysis: RiskAnalysis = await response.json();
        currentRiskScoreRef.current = analysis.riskScore;
        onRiskUpdate(analysis);

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

        // Sound cues based on risk
        if (analysis.riskScore >= 71) {
          playSecurityAlert();
        } else if (analysis.recommendedAction === 'CONNECT') {
          playConnectTone();
        }

        // Add AI response turn
        const aiResponseText =
          (activeLang === 'hi' && analysis.responseTextHindi)
            ? analysis.responseTextHindi
            : (analysis.responseText || analysis.nextQuestion);

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
                onCallEnded('BLOCKED', analysis);
              } else if (analysis.recommendedAction === 'CONNECT') {
                onCallEnded('CONNECTED', analysis);
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
  const getSimulatedTurns = useCallback(() => {
    if (!activeScenario) return [];
    if (isHindi && activeScenario.simulatedTurnsHindi && activeScenario.simulatedTurnsHindi.length > 0) {
      return activeScenario.simulatedTurnsHindi;
    }
    return activeScenario.simulatedTurns;
  }, [activeScenario, isHindi]);

  // SIMULATION MODE: Fully audible progressive turn execution
  const executeSimulationTurn = useCallback(
    async (turnIndex: number) => {
      const turns = getSimulatedTurns();
      if (!turns || turns.length === 0) return;
      if (turnIndex >= turns.length) return;

      const statement = turns[turnIndex];
      setSimIsAdvancing(true);

      // Step 1: Add caller turn to transcript
      const callerTurn: ConversationTurn = {
        id: `caller-${Date.now()}-${turnIndex}`,
        sender: 'caller',
        text: statement.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages((prev) => [...prev, callerTurn]);
      setActiveSpeaker('caller');
      updateVoiceState('speaking');

      // Step 2: Caller SPEAKS AUDIBLY in appropriate language
      const onCallerFinishedSpeaking = async () => {
        setActiveSpeaker('none');
        updateVoiceState('analyzing');

        // Step 3: Analyze statement through Gemini risk engine (/api/screen)
        const updatedHistory = [...messagesRef.current, callerTurn];
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
            }),
          });

          if (!response.ok) {
            throw new Error(`Screening server error (${response.status})`);
          }

          const analysis: RiskAnalysis = await response.json();
          currentRiskScoreRef.current = analysis.riskScore;
          onRiskUpdate(analysis);

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

          if (analysis.riskScore >= 71) {
            playSecurityAlert();
          } else if (analysis.recommendedAction === 'CONNECT') {
            playConnectTone();
          }

          // Step 4: Add CallGuard AI response turn
          const aiResponseText =
            (activeLang === 'hi' && analysis.responseTextHindi)
              ? analysis.responseTextHindi
              : (analysis.responseText || analysis.nextQuestion);

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
                  onCallEnded('BLOCKED', analysis);
                } else if (analysis.recommendedAction === 'CONNECT') {
                  onCallEnded('CONNECTED', analysis);
                }
              }, 1500);
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
    if (voiceState === 'analyzing' || voiceState === 'speaking') return;
    if (!greetingFinished) return; // Wait for assistant intro to complete

    const turns = getSimulatedTurns();

    // Trigger turn 0 after initial greeting finishes
    if (simTurnIndex === 0) {
      const timer = window.setTimeout(() => {
        if (!simPausedRef.current && !interactiveModeInSim) {
          executeSimulationTurn(0);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }

    // Auto-advance subsequent turns when AI finishes speaking
    if (voiceState === 'idle' && !currentAnalysis?.isFinal) {
      if (simTurnIndex < turns.length) {
        const timer = window.setTimeout(() => {
          if (!simPausedRef.current && !interactiveModeInSim) {
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

  const turnsTotal = getSimulatedTurns().length;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Call Header */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-100">
                {isHindi && activeScenario?.callerIdentityHindi ? activeScenario.callerIdentityHindi : callerName}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1">
                <span>🇮🇳</span>
                <span>{callerNumber}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  mode === 'LIVE'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {mode === 'LIVE' ? 'Live Voice' : 'Simulation'}
              </span>

              {/* Interactive Language Selector directly in CallScreen */}
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

              {/* Gnani Voice indicator when Hindi is active */}
              {isHindi && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border inline-flex items-center gap-1.5 ${
                    gnaniConfigured
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                  title={
                    gnaniConfigured
                      ? 'Gnani AI Voice Active (Prisma STT + Timbre TTS)'
                      : 'Using Browser Speech Synthesis (Add GNANI_API_KEY for native Gnani AI voice processing)'
                  }
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${gnaniConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{gnaniConfigured ? 'Gnani.ai Voice' : 'Hindi (Native)'}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <Shield className="w-3 h-3" /> {isHindi ? 'सुरक्षा सक्रिय' : 'Shield Active'}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">{formatTime(callDuration)}</span>
              {mode === 'SIMULATION' && activeScenario && (
                <>
                  <span>•</span>
                  <span className="text-slate-300 truncate max-w-[220px]">
                    {isHindi && activeScenario.titleHindi ? activeScenario.titleHindi : activeScenario.title}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* State Badge & Audio Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Replay Greeting button */}
          <button
            onClick={replayGreeting}
            title={isHindi ? 'असिस्टेंट का परिचय दोबारा सुनें' : 'Replay Assistant Greeting'}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isHindi ? 'दोबारा सुनें' : 'Replay Intro'}</span>
          </button>

          {/* Stop / Interrupt button when speaking */}
          {voiceState === 'speaking' && (
            <button
              onClick={interruptSpeech}
              title={isHindi ? 'बोलना रोकें' : 'Interrupt Speech'}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>{isHindi ? 'रोकें' : 'Skip Audio'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!isMuted) speechService.stopSpeaking();
              setIsMuted(!isMuted);
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Dynamic Speaker Indicator */}
          {voiceState === 'speaking' && activeSpeaker === 'caller' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold animate-pulse">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>{isHindi ? 'कॉलर बोल रहा है...' : 'Caller Speaking...'}</span>
            </div>
          )}

          {voiceState === 'speaking' && activeSpeaker === 'ai' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>{isHindi ? 'कॉल-गार्ड बोल रहा है...' : 'CallGuard Speaking...'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-sm">
        {messages.map((turn) => {
          const isAI = turn.sender === 'ai';
          return (
            <div
              key={turn.id}
              className={`flex gap-3 max-w-[88%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isAI
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300'
                    : 'bg-purple-600/30 border border-purple-500/50 text-purple-300'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 shadow-md ${
                  isAI
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                    : 'bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-tr-sm border border-indigo-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-75">
                  <span className="font-semibold">
                    {isAI
                      ? isHindi
                        ? 'कॉल-गार्ड AI असिस्टेंट'
                        : 'CallGuard AI'
                      : isHindi && activeScenario?.callerIdentityHindi
                      ? activeScenario.callerIdentityHindi
                      : callerName}
                  </span>
                  <span className="font-mono">{turn.timestamp}</span>
                </div>

                <p className="leading-relaxed whitespace-pre-wrap font-medium">{turn.text}</p>

                {/* Badges / Signals if present on this turn */}
                {turn.detectedSignals && turn.detectedSignals.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                    {turn.detectedSignals.map((signal, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      >
                        ⚠️ {signal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live speech transcription bubble */}
        {voiceState === 'listening' && interimTranscript && (
          <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 flex items-center justify-center flex-shrink-0">
              <Mic className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-cyan-950/40 border border-cyan-500/40 text-cyan-200">
              <span className="text-[11px] text-cyan-400 font-semibold block mb-1">
                {isHindi ? 'लाइव आवाज सुनी जा रही है...' : 'Transcribing Live Speech...'}
              </span>
              <p className="text-sm italic">{interimTranscript}</p>
            </div>
          </div>
        )}

        {/* Analyzing Spinner */}
        {voiceState === 'analyzing' && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center text-indigo-400 text-xs py-2">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
            <span>
              {isHindi
                ? 'कॉल-गार्ड AI कॉलर के उद्देश्य और संभावित फ्रॉड का विश्लेषण कर रहा है...'
                : 'CallGuard AI is evaluating intent, missing info, and threat signals...'}
            </span>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 px-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Controls & Interaction Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col gap-3">
        {/* Simulation Mode Toggle Pill: Auto-Play vs Interactive Takeover */}
        {mode === 'SIMULATION' && (
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800/80 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                {isHindi ? 'सिमुलेशन नियंत्रण:' : 'Simulation Controls:'}
              </span>
              <button
                type="button"
                onClick={() => setInteractiveModeInSim(!interactiveModeInSim)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  interactiveModeInSim
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
                title={isHindi ? 'खुद कॉलर बनकर हिंदी में बात या टाइप करें' : 'Interact as the caller yourself'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>
                  {interactiveModeInSim
                    ? isHindi
                      ? 'इंटरैक्टिव मोड सक्रिय (आप बोल/टाइप रहे हैं)'
                      : 'Interactive Mode Active (You Speak/Type)'
                    : isHindi
                    ? 'खुद कॉलर बनकर बात करें'
                    : 'Speak/Type as Caller'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimIsPaused(!simIsPaused)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                {simIsPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                <span>{simIsPaused ? (isHindi ? 'जारी रखें' : 'Resume') : (isHindi ? 'रोकें' : 'Pause')}</span>
              </button>

              <button
                onClick={() => {
                  if (voiceState === 'speaking') interruptSpeech();
                  executeSimulationTurn(simTurnIndex);
                }}
                disabled={simIsAdvancing || voiceState === 'analyzing' || simTurnIndex >= turnsTotal}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
              >
                <SkipForward className="w-3 h-3" />
                <span>{isHindi ? `अगला टर्न (${simTurnIndex + 1}/${turnsTotal})` : `Next (${simTurnIndex + 1}/${turnsTotal})`}</span>
              </button>

              <button
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                title={isHindi ? 'शुरू से रीस्टार्ट करें' : 'Restart Call'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Interactive Cues (Enabled in both Live & Simulation modes) */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 scrollbar-thin">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Play className="w-3 h-3 text-indigo-400" /> {isHindi ? 'त्वरित कॉलर कथन:' : 'Quick caller replies:'}
          </span>

          {INTERACTIVE_CUES.map((cue) => {
            const isDanger = cue.riskType === 'danger';
            const isMedium = cue.riskType === 'medium';
            const label = isHindi ? cue.labelHi : cue.label;
            const text = isHindi ? cue.textHi : cue.textEn;

            let badgeClass = 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700';
            if (isDanger) {
              badgeClass = 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border-rose-500/30';
            } else if (isMedium) {
              badgeClass = 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-500/30';
            }

            return (
              <button
                key={cue.id}
                onClick={() => {
                  if (voiceState === 'speaking') interruptSpeech();
                  processCallerSpeech(text);
                }}
                disabled={voiceState === 'analyzing'}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors disabled:opacity-50 text-[11px] font-medium ${badgeClass}`}
                title={text}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Voice Microphone, Termination, and Fallback Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (voiceState === 'listening') {
                stopListeningMode();
              } else {
                if (voiceState === 'speaking') {
                  interruptSpeech();
                }
                startListeningMode(true);
              }
            }}
            disabled={voiceState === 'analyzing'}
            className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              voiceState === 'listening'
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 ring-2 ring-cyan-400 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {voiceState === 'listening' ? (
              <>
                <Mic className="w-5 h-5 animate-bounce text-slate-950" />
                <span>
                  {isHindi
                    ? 'आपकी आवाज़ सुनी जा रही है • बोलने के बाद क्लिक करें'
                    : 'Listening to you • Click when done'}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>
                  {isHindi
                    ? 'माइक्रोफ़ोन से बोलें (हिंदी / Hinglish)'
                    : 'Speak into Microphone'}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => onCallEnded('BLOCKED', currentAnalysis)}
            title={isHindi ? 'कॉल ब्लॉक करें' : 'Force Block Caller'}
            className="p-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 transition-colors flex items-center justify-center"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          <button
            onClick={() => onCallEnded('CONNECTED', currentAnalysis)}
            title={isHindi ? 'कॉल कनेक्ट करें' : 'Force Connect Line'}
            className="p-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center justify-center"
          >
            <PhoneForwarded className="w-5 h-5" />
          </button>
        </div>

        {/* Text fallback input bar */}
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={
              isHindi
                ? 'या कॉलर की बात हिंदी या Hinglish में यहाँ लिखें (जैसे: "नमस्ते, मैं बैंक से हूँ")...'
                : 'Or type what the caller says (in English or Hinglish)...'
            }
            disabled={voiceState === 'analyzing'}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!manualInput.trim() || voiceState === 'analyzing'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 transition-colors flex items-center justify-center"
            title={isHindi ? 'संदेश भेजें' : 'Send'}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Informative Hint when Microphone Permission is Denied or Unavailable */}
        {micPermissionDenied && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
            <span>
              {isHindi
                ? 'माइक्रोफ़ोन अनुपलब्ध है। आप ऊपर दिए गए त्वरित बटनों या टेक्स्ट बॉक्स का उपयोग कर सकते हैं।'
                : 'Microphone unavailable in this environment. Use the quick buttons or type text above.'}
            </span>
            <button
              onClick={handleRetryMicPermission}
              className="underline font-semibold ml-2 hover:text-white"
            >
              {isHindi ? 'पुनः प्रयास करें' : 'Retry Mic'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
