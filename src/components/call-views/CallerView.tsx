import React, { useRef, useEffect } from 'react';
import {
  Phone,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Pause,
  Play,
  SkipForward,
  RotateCcw,
  Radio,
  PhoneOff,
  PhoneForwarded,
  Shield,
  Languages,
  Zap,
} from 'lucide-react';
import {
  ConversationTurn,
  VoiceState,
  LanguageOption,
  ScreeningMode,
  DemoScenario,
  RiskAnalysis,
} from '../../types';

interface CallerViewProps {
  messages: ConversationTurn[];
  voiceState: VoiceState;
  activeSpeaker: 'ai' | 'caller' | 'none';
  isTranscribing?: boolean;
  liveTranscription?: string;
  isAnalyzing?: boolean;
  callDuration: number;
  isMuted: boolean;
  onToggleMute: () => void;
  language: LanguageOption;
  onToggleLanguage: (lang: LanguageOption) => void;
  callerName: string;
  callerNumber: string;
  activeScenario?: DemoScenario | null;
  mode: ScreeningMode;
  onSpeakAsCaller: (text?: string) => void;
  isListening: boolean;
  manualInput: string;
  setManualInput: (text: string) => void;
  onSubmitManualInput: () => void;
  onInterruptAudio: () => void;
  onReplayGreeting: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onNextTurn?: () => void;
  onRestartSimulation?: () => void;
  simTurnIndex?: number;
  totalSimTurns?: number;
  currentAnalysis?: RiskAnalysis | null;
  currentRiskScore?: number;
  onEndCall: (action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED') => void;
}

export const CallerView: React.FC<CallerViewProps> = ({
  messages,
  voiceState,
  activeSpeaker,
  isTranscribing = false,
  liveTranscription = '',
  isAnalyzing = false,
  callDuration,
  isMuted,
  onToggleMute,
  language,
  onToggleLanguage,
  callerName,
  callerNumber,
  activeScenario,
  mode,
  onSpeakAsCaller,
  isListening,
  manualInput,
  setManualInput,
  onSubmitManualInput,
  onInterruptAudio,
  onReplayGreeting,
  isPaused = false,
  onTogglePause,
  onNextTurn,
  onRestartSimulation,
  simTurnIndex = 0,
  totalSimTurns = 0,
  currentAnalysis,
  currentRiskScore = 0,
  onEndCall,
}) => {
  const isHindi = language === 'hi';
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript on new messages or transcription
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscription, isAnalyzing]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoiceStateBadge = () => {
    switch (voiceState) {
      case 'speaking':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isHindi ? 'AI उत्तर दे रहा है...' : 'AI Speaking...'}</span>
          </span>
        );
      case 'listening':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{isHindi ? 'कॉलर सुन रहा है...' : 'Listening to Caller...'}</span>
          </span>
        );
      case 'analyzing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>{isHindi ? 'जोखिम विश्लेषण जारी...' : 'AI Analyzing Intent...'}</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <Radio className="w-3 h-3" />
            <span>{isHindi ? 'स्क्रीनिंग सक्रिय' : 'Screening Active'}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800/80">
      {/* Caller Header: Caller identity & AI Voice Telemetry */}
      <div className="p-3.5 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-900/20">
              <Phone className="w-5 h-5" />
            </div>
            {activeSpeaker === 'caller' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-900 animate-pulse" />
            )}
            {activeSpeaker === 'ai' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">{callerName}</h3>
              {activeScenario && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  {activeScenario.tag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono">{callerNumber}</span>
              <span>•</span>
              <span className="font-mono text-cyan-400 font-semibold">{formatDuration(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* Voice Telemetry Badge & Quick Audio Actions */}
        <div className="flex items-center gap-2">
          {getVoiceStateBadge()}

          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onInterruptAudio}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Skip / Interrupt current speech playback"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transcript Area: Real-Time Caller vs AI Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60 min-h-[220px]">
        {messages.length === 0 && !isTranscribing && !isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Bot className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
            <p className="text-sm font-medium text-slate-400">
              {isHindi ? 'कॉल-गार्ड AI स्क्रीनिंग शुरू कर रहा है...' : 'CallGuard AI is screening the call...'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {isHindi
                ? 'कॉलर द्वारा बोला गया हर शब्द यहां वास्तविक समय में ट्रांसक्रिप्ट होगा।'
                : 'All incoming speech is transcribed in real time and evaluated for fraud vectors.'}
            </p>
            <button
              type="button"
              onClick={onReplayGreeting}
              className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs flex items-center gap-1.5 hover:bg-indigo-900/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isHindi ? 'AI ग्रीटिंग पुनः चलाएं' : 'Replay Initial AI Greeting'}</span>
            </button>
          </div>
        ) : (
          <>
            {messages.map((turn, index) => {
              const isAi = turn.sender === 'ai';
              return (
                <div
                  key={turn.id || index}
                  className={`flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%] ${
                    isAi ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs ${
                      isAi
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-sm shadow-emerald-900/30'
                        : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-sm shadow-cyan-900/30'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`rounded-2xl p-3 shadow-md border text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100 rounded-tr-none'
                        : 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1 border-b border-slate-800/80 pb-1">
                      <span className="font-bold uppercase tracking-wider">
                        {isAi
                          ? isHindi
                            ? 'कॉल-गार्ड AI'
                            : 'CallGuard AI'
                          : isHindi
                          ? 'कॉलर'
                          : 'Incoming Caller'}
                      </span>
                      <span className="font-mono text-slate-500">{turn.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-wrap">{turn.text}</p>

                    {/* Detected threat tags for caller speech */}
                    {!isAi && turn.detectedSignals && turn.detectedSignals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-slate-800">
                        {turn.detectedSignals.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-950/70 text-rose-300 border border-rose-500/40"
                          >
                            ⚠️ {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Live Streaming Speech Transcription Bubble */}
            {isTranscribing && liveTranscription && (
              <div className="flex items-start gap-2.5 max-w-[85%] mr-auto animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-cyan-700 flex items-center justify-center flex-shrink-0 text-white text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="rounded-2xl p-3 bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 rounded-tl-none text-xs sm:text-sm">
                  <div className="text-[10px] text-cyan-400 font-bold mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{isHindi ? 'लाइव कॉलर ट्रांसक्रिप्शन...' : 'Transcribing Live Speech...'}</span>
                  </div>
                  <p className="italic">{liveTranscription}</p>
                </div>
              </div>
            )}

            {/* AI Evaluating Spinner Bubble */}
            {isAnalyzing && (
              <div className="flex items-start gap-2.5 max-w-[80%] ml-auto flex-row-reverse">
                <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center flex-shrink-0 text-white text-xs animate-spin">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="rounded-2xl p-3 bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs rounded-tr-none flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>
                    {isHindi
                      ? 'कॉल-गार्ड AI सुरक्षा विश्लेषण कर रहा है...'
                      : 'CallGuard AI analyzing threat signals...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </>
        )}
      </div>

      {/* AI Interaction & Caller Speech Input Bar */}
      <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 space-y-2.5">
        {/* Simulation Controls when in Simulation Mode */}
        {mode === 'SIMULATION' && onTogglePause && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">
                {isHindi ? 'सिमुलेशन टर्न:' : 'Simulation Turn:'}
              </span>
              <span className="font-mono font-bold text-purple-300">
                {simTurnIndex + 1} / {totalSimTurns}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1 transition-colors"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPaused ? (isHindi ? 'पुनः चालू' : 'Resume') : (isHindi ? 'रोकें' : 'Pause')}</span>
              </button>

              {onNextTurn && (
                <button
                  type="button"
                  onClick={onNextTurn}
                  disabled={simTurnIndex >= totalSimTurns}
                  className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-medium text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'अगला टर्न' : 'Next Turn'}</span>
                </button>
              )}

              {onRestartSimulation && (
                <button
                  type="button"
                  onClick={onRestartSimulation}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Restart Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Interactive Speech & Text Transmission Interface */}
        <div className="flex items-center gap-2">
          {/* Main Microphone Button */}
          <button
            type="button"
            onClick={() => onSpeakAsCaller()}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
            }`}
            title="Press to speak as caller or toggle speech recognition"
          >
            {isListening ? <MicOff className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isListening
                ? isHindi
                  ? 'सुन रहा है... (रोकें)'
                  : 'Listening... (Tap to Stop)'
                : isHindi
                ? 'माइक से बोलें'
                : 'Speak as Caller'}
            </span>
          </button>

          {/* Fallback Text Input Field */}
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-cyan-500 transition-colors">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmitManualInput();
                }
              }}
              placeholder={
                isHindi
                  ? 'कॉलर के रूप में संदेश टाइप करें या बोलें...'
                  : 'Type caller message or press Speak to talk...'
              }
              className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={onSubmitManualInput}
              disabled={!manualInput.trim()}
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-30 transition-all ml-1"
              title="Send to CallGuard AI"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Caller Cues & Fast Call Termination */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              {isHindi ? 'त्वरित कॉलर संकेत:' : 'Quick Cues:'}
            </span>
            <button
              type="button"
              onClick={() =>
                onSpeakAsCaller(
                  isHindi
                    ? 'मैं बैंक से बोल रहा हूँ, तुरंत अपना OTP बताओ।'
                    : 'I am calling from Bank Security. Disclose your SMS OTP right now.'
                )
              }
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-colors"
            >
              🚨 {isHindi ? 'OTP मांगें' : 'Demand OTP'}
            </button>
            <button
              type="button"
              onClick={() =>
                onSpeakAsCaller(
                  isHindi
                    ? 'आपका बिजली कनेक्शन आज रात काट दिया जाएगा, तुरंत बिल भरें।'
                    : 'Your power connection will be terminated tonight. Pay bill immediately.'
                )
              }
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 transition-colors"
            >
              ⚡ {isHindi ? 'बिजली कटौती' : 'Utility Cutoff'}
            </button>
            <button
              type="button"
              onClick={() =>
                onSpeakAsCaller(
                  isHindi
                    ? 'नमस्ते, मैं डिलीवरी के लिए पता पूछ रहा हूँ।'
                    : 'Hello, I am calling regarding your Amazon parcel delivery address.'
                )
              }
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              📦 {isHindi ? 'वैध डिलीवरी' : 'Legit Delivery'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEndCall('BLOCKED')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{isHindi ? 'कॉल ब्लॉक करें' : 'Block & Drop'}</span>
            </button>
            <button
              type="button"
              onClick={() => onEndCall('CONNECTED')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
              <span>{isHindi ? 'बात करें' : 'Connect'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
