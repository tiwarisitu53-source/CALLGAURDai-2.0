import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bot,
  User,
  PhoneOff,
  PhoneForwarded,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Send,
  MessageSquare,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ConversationTurn,
  RiskAnalysis,
  VoiceState,
  LanguageOption,
  RiskTimelinePoint,
  ExpectedCall,
  UserVerificationResponse,
} from '../../types';
import { DynamicRiskTimeline } from '../DynamicRiskTimeline';
import { LiveRiskAlertBanner } from '../LiveRiskAlertBanner';
import { CallConnectionTransition } from '../CallConnectionTransition';
import { UserRiskAssessmentCard } from './UserRiskAssessmentCard';

interface UserShieldViewProps {
  messages: ConversationTurn[];
  voiceState: VoiceState;
  activeSpeaker: 'ai' | 'caller' | 'none';
  callDuration: number;
  isMuted: boolean;
  onToggleMute: () => void;
  language: LanguageOption;
  onToggleLanguage: (lang: LanguageOption) => void;
  callerName: string;
  callerNumber: string;
  currentAnalysis: RiskAnalysis | null;
  riskTimeline: RiskTimelinePoint[];
  currentRiskScore: number;
  callStage: 'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING';
  onJoinCall: () => void;
  onDeclineCall: () => void;
  onBlockAndReport: () => void;
  liveThreatAlert: { score: number; threatType: string; threatDetails: string } | null;
  matchedExpectedCall: ExpectedCall | null;
  userVerification: UserVerificationResponse;
  onUserVerificationChange: (res: UserVerificationResponse) => void;
  onReplayIntro: () => void;
  onInterruptSpeech: () => void;
  onWhisperInstruction: (instruction: string) => void;
  gnaniConfigured?: boolean;
}

const WHISPER_PRESETS = [
  {
    en: 'Ask for their official Employee ID and branch code',
    hi: 'उनसे उनकी ऑफिशियल कर्मचारी आईडी और ब्रांच कोड पूछें',
  },
  {
    en: 'Tell them I will visit the nearest branch in person',
    hi: 'उन्हें बताएं कि मैं खुद नजदीकी बैंक शाखा जाकर पता करूँगा',
  },
  {
    en: 'Ask for their official callback landline number',
    hi: 'उनसे उनका रजिस्टर्ड लैंडलाइन कॉलबैक नंबर मांगें',
  },
  {
    en: 'Strictly refuse and ask them to send an official letter',
    hi: 'साफ मना करें और कहें कि जो भी बात है ऑफिशियल लेटर में भेजें',
  },
];

export const UserShieldView: React.FC<UserShieldViewProps> = ({
  messages,
  voiceState,
  activeSpeaker,
  callDuration,
  isMuted,
  onToggleMute,
  language,
  onToggleLanguage,
  callerName,
  callerNumber,
  currentAnalysis,
  riskTimeline,
  currentRiskScore,
  callStage,
  onJoinCall,
  onDeclineCall,
  onBlockAndReport,
  liveThreatAlert,
  matchedExpectedCall,
  userVerification,
  onUserVerificationChange,
  onReplayIntro,
  onInterruptSpeech,
  onWhisperInstruction,
  gnaniConfigured,
}) => {
  const isHindi = language === 'hi';
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [whisperInput, setWhisperInput] = useState('');
  const [showWhisperBox, setShowWhisperBox] = useState(false);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const getRiskStatusBadge = (score: number) => {
    if (score >= 71) {
      return {
        label: isHindi ? 'उच्च जोखिम (संभावित फ्रॉड)' : 'High Risk Threat',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      };
    }
    if (score >= 31) {
      return {
        label: isHindi ? 'मध्यम जोखिम (संदेहास्पद)' : 'Suspicious / Caution',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      };
    }
    return {
      label: isHindi ? 'कम जोखिम (सामान्य)' : 'Low Risk (Guarded)',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    };
  };

  const riskStatus = getRiskStatusBadge(currentRiskScore);

  const handleSendWhisper = (text: string) => {
    if (!text.trim()) return;
    onWhisperInstruction(text.trim());
    setWhisperInput('');
    setShowWhisperBox(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Top Receiver Status Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {isHindi ? 'सुरक्षित उपयोगकर्ता दृश्य' : 'User Shield Terminal'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${riskStatus.color}`}>
                {riskStatus.icon}
                <span>{riskStatus.label}</span>
              </span>
              <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {currentRiskScore}/100
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-medium text-slate-200">{callerName}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">{callerNumber}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{formatTime(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          {voiceState === 'speaking' && (
            <button
              onClick={onInterruptSpeech}
              title={isHindi ? 'बोलना रोकें' : 'Interrupt Speech'}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>{isHindi ? 'रोकें' : 'Skip'}</span>
            </button>
          )}

          <button
            onClick={onReplayIntro}
            title={isHindi ? 'दोबारा परिचय सुनें' : 'Replay Greeting'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Live Threat Alert Banner */}
      {liveThreatAlert && (
        <LiveRiskAlertBanner
          score={liveThreatAlert.score}
          threatType={liveThreatAlert.threatType}
          threatDetails={liveThreatAlert.threatDetails}
          onHangUp={onDeclineCall}
          onBlockAndReport={onBlockAndReport}
          language={language}
        />
      )}

      {/* Feature 4: Ready to Connect Transition */}
      {callStage === 'READY_TO_CONNECT' && (
        <div className="p-4 bg-slate-900/95 border-b border-indigo-500/30">
          <CallConnectionTransition
            callerName={callerName}
            callerNumber={callerNumber}
            analysis={currentAnalysis}
            matchedExpectedCall={matchedExpectedCall}
            onJoinCall={onJoinCall}
            onDeclineCall={onDeclineCall}
            language={language}
          />
        </div>
      )}

      {/* Connected Monitoring Active Banner */}
      {callStage === 'CONNECTED_MONITORING' && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isHindi
                ? 'कॉल कनेक्टेड • कॉल-गार्ड बैकग्राउंड शील्ड सक्रिय है'
                : 'Call Connected • Live Shield Continuous Monitoring Active'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/90">
            {isHindi ? 'सुरक्षित निगरानी' : 'Protected Mode'}
          </span>
        </div>
      )}

      {/* Active User Risk Assessment Panel */}
      <div className="px-4 pt-3 pb-1">
        <UserRiskAssessmentCard
          analysis={currentAnalysis}
          currentRiskScore={currentRiskScore}
          callerName={callerName}
          callerNumber={callerNumber}
          language={language}
          matchedExpectedCall={matchedExpectedCall}
          userVerification={userVerification}
        />
      </div>

      {/* Expected Call Verification Inline Card */}
      {matchedExpectedCall && userVerification === 'NOT_SURE' && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-slate-200">
              {isHindi
                ? `क्या आप ${matchedExpectedCall.organization} से इस कॉल की उम्मीद कर रहे थे?`
                : `Did you expect this call from ${matchedExpectedCall.organization}?`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUserVerificationChange('EXPECTED')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{isHindi ? 'हाँ, अपेक्षित है' : 'Yes, Expected'}</span>
            </button>
            <button
              onClick={() => onUserVerificationChange('UNEXPECTED')}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              <span>{isHindi ? 'नहीं, अप्रत्याशित (फ्रॉड)' : 'Unexpected'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Protected Transcript Scroll Area */}
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
                    ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-rose-600/20 border border-rose-500/40 text-rose-300'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 shadow-md ${
                  isAI
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                    : 'bg-gradient-to-br from-slate-900 to-rose-950/40 text-slate-200 rounded-tr-sm border border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-75">
                  <span className="font-semibold flex items-center gap-1">
                    {isAI ? (
                      <>
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>{isHindi ? 'कॉल-गार्ड AI असिस्टेंट' : 'CallGuard AI Shield'}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{callerName}</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono">{turn.timestamp}</span>
                </div>

                <p className="leading-relaxed whitespace-pre-wrap font-medium">{turn.text}</p>

                {/* Threat Signals on Caller utterance */}
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

        {/* AI Analyzing indicator */}
        {voiceState === 'analyzing' && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center text-emerald-400 text-xs py-2">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>
              {isHindi
                ? 'कॉल-गार्ड AI कॉलर की बात का विश्लेषण और सुरक्षा जांच कर रहा है...'
                : 'CallGuard AI is evaluating intent, missing info, and threat signals...'}
            </span>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Dynamic Risk Trajectory */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70">
        <DynamicRiskTimeline
          points={riskTimeline}
          currentScore={currentRiskScore}
          language={language}
        />
      </div>

      {/* User Decision and Shield Action Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
        {/* Whisper Instruction Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowWhisperBox(!showWhisperBox)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>
                {isHindi
                  ? 'कॉल-गार्ड AI को गुप्त निर्देश दें (Whisper to AI)'
                  : 'Whisper Instruction to CallGuard AI'}
              </span>
            </button>
            <span className="text-[10px] text-slate-500">
              {isHindi ? 'कॉलर को आपका निर्देश नहीं सुनाई देगा' : 'Caller will not hear your whisper'}
            </span>
          </div>

          {showWhisperBox && (
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2.5 animate-in fade-in duration-150">
              <div className="text-[11px] text-slate-400 font-medium">
                {isHindi ? 'त्वरित निर्देश चुनें:' : 'Quick safety instructions:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {WHISPER_PRESETS.map((preset, idx) => {
                  const text = isHindi ? preset.hi : preset.en;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendWhisper(text)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-indigo-950/40 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 text-left text-xs transition-colors"
                    >
                      {text}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={whisperInput}
                  onChange={(e) => setWhisperInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendWhisper(whisperInput);
                  }}
                  placeholder={
                    isHindi
                      ? 'या अपना गुप्त निर्देश लिखें (जैसे: "उनसे उनका नाम और आधिकारिक ईमेल आईडी पूछें")...'
                      : 'Or type custom whisper (e.g. "Ask for their manager contact")...'
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleSendWhisper(whisperInput)}
                  disabled={!whisperInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>{isHindi ? 'भेजें' : 'Send'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons for the User */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDeclineCall}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <PhoneOff className="w-4 h-4 text-rose-400" />
            <span>{isHindi ? 'कॉल ब्लॉक करें और काटें' : 'Block & Terminate Call'}</span>
          </button>

          <button
            onClick={onJoinCall}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <PhoneForwarded className="w-4 h-4" />
            <span>{isHindi ? 'खुद बात करें (कॉल कनेक्ट)' : 'Connect & Speak Directly'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
