import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Radio,
  AlertOctagon,
  Skull,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Terminal,
  ShieldX,
  Target,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import {
  ConversationTurn,
  RiskAnalysis,
  VoiceState,
  ScreeningMode,
  DemoScenario,
  LanguageOption,
} from '../../types';
import { ScammerRiskAssessmentCard } from './ScammerRiskAssessmentCard';

interface ScammerConsoleViewProps {
  messages: ConversationTurn[];
  voiceState: VoiceState;
  activeSpeaker: 'ai' | 'caller' | 'none';
  interimTranscript: string;
  mode: ScreeningMode;
  language: LanguageOption;
  callerName: string;
  callerNumber: string;
  activeScenario?: DemoScenario | null;
  currentAnalysis: RiskAnalysis | null;
  currentRiskScore: number;
  simTurnIndex: number;
  simIsPaused: boolean;
  onToggleSimPause: () => void;
  simIsAdvancing: boolean;
  onAdvanceSimTurn: () => void;
  turnsTotal: number;
  onRestartScenario: () => void;
  onTransmitScammerSpeech: (text: string) => void;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onInterruptSpeech: () => void;
  micPermissionDenied?: boolean;
}

interface ScamTactic {
  id: string;
  category: 'urgency' | 'arrest' | 'otp' | 'trojan' | 'safe';
  labelEn: string;
  labelHi: string;
  textEn: string;
  textHi: string;
}

const SCAM_TACTICS: ScamTactic[] = [
  {
    id: 'otp-demand',
    category: 'otp',
    labelEn: '🔑 Demand OTP Now',
    labelHi: '🔑 तुरंत OTP मांगें',
    textEn: 'To prevent immediate account freeze, I need the 6-digit OTP verification code sent to your phone right now.',
    textHi: 'अकाउंट तुरंत फ्रीज होने से बचाने के लिए, आपके फोन पर जो 6 अंकों का OTP आया है, वह तुरंत बताइए।',
  },
  {
    id: 'digital-arrest',
    category: 'arrest',
    labelEn: '👮 Digital Arrest Threat',
    labelHi: '👮 डिजिटल अरेस्ट की धमकी',
    textEn: 'This is Crime Branch Police. A non-bailable arrest warrant is issued in your name. Do not disconnect this line or police will arrive in 20 minutes.',
    textHi: 'यह क्राइम ब्रांच पुलिस है। आपके नाम पर गैर-जमानती अरेस्ट वारंट जारी हुआ है। कॉल मत काटिए, नहीं तो 20 मिनट में पुलिस आपके घर पहुँचेगी।',
  },
  {
    id: 'power-cut',
    category: 'urgency',
    labelEn: '⚡ Electricity Cutoff (30m)',
    labelHi: '⚡ 30 मिनट में बिजली कटने की धमकी',
    textEn: 'Dear consumer, your electricity bill is unpaid. Power disconnection order is generated for 9:30 PM. Pay immediately via link.',
    textHi: 'प्रिय उपभोक्ता, आपका बिजली बिल बकाया है। आज रात आपकी बिजली काट दी जाएगी। तुरंत इस लिंक पर पेमेंट करें।',
  },
  {
    id: 'anydesk-apk',
    category: 'trojan',
    labelEn: '💻 Remote APK Install',
    labelHi: '💻 AnyDesk APK इंस्टॉल करवाएं',
    textEn: 'I am technical support officer. Your bank server is locked. Download AnyDesk QuickSupport app now so I can fix your KYC.',
    textHi: 'मैं बैंक टेक्निकल सपोर्ट से हूँ। आपका सर्वर लॉक हो गया है, तुरंत AnyDesk QuickSupport ऐप डाउनलोड करके 9 अंकों का कोड बताइए।',
  },
  {
    id: 'customs-parcel',
    category: 'arrest',
    labelEn: '📦 Customs Illegal Parcel',
    labelHi: '📦 कस्टम्स पार्सल में ड्रग्स का डर',
    textEn: 'Customs Mumbai has seized an international parcel with 16 passports and illicit items addressed with your Aadhaar card.',
    textHi: 'मुंबई कस्टम विभाग ने आपके आधार कार्ड पर भेजा गया एक पार्सल पकड़ा है जिसमें अवैध पासपोर्ट और प्रतिबंधित सामान मिला है।',
  },
  {
    id: 'lottery-lure',
    category: 'trojan',
    labelEn: '🎁 25 Lakh Lottery Prize',
    labelHi: '🎁 25 लाख लॉटरी का लालच',
    textEn: 'Congratulations! You won 25 Lakh rupees cash in KBC lucky draw. Just transfer 1,500 rupees file charges to release check.',
    textHi: 'बधाई हो! आपको केबीसी लकी ड्रा में 25 लाख रुपये का इनाम मिला है। चेक जारी कराने के लिए 1,500 रुपये सरकारी फाइल चार्ज जमा करें।',
  },
  {
    id: 'safe-delivery',
    category: 'safe',
    labelEn: '📦 Amazon Courier (Safe)',
    labelHi: '📦 अमेज़ॅन डिलीवरी (सुरक्षित)',
    textEn: 'Hello, I am Amazon delivery courier at your gate. Please share the 4-digit package delivery pin to hand over the parcel.',
    textHi: 'नमस्ते, मैं अमेज़ॅन डिलीवरी बॉय गेट पर हूँ। कृपया पार्सल देने के लिए 4 अंकों का डिलीवरी पिन बता दीजिए।',
  },
];

export const ScammerConsoleView: React.FC<ScammerConsoleViewProps> = ({
  messages,
  voiceState,
  activeSpeaker,
  interimTranscript,
  mode,
  language,
  callerName,
  callerNumber,
  activeScenario,
  currentAnalysis,
  currentRiskScore,
  simTurnIndex,
  simIsPaused,
  onToggleSimPause,
  simIsAdvancing,
  onAdvanceSimTurn,
  turnsTotal,
  onRestartScenario,
  onTransmitScammerSpeech,
  isListening,
  onStartListening,
  onStopListening,
  onInterruptSpeech,
  micPermissionDenied,
}) => {
  const isHindi = language === 'hi';
  const [scammerInput, setScammerInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'urgency' | 'arrest' | 'otp' | 'trojan' | 'safe'>('all');

  // Find what CallGuard AI said in the most recent turn
  const lastAITurn = [...messages].reverse().find((t) => t.sender === 'ai');

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scammerInput.trim()) return;
    onTransmitScammerSpeech(scammerInput.trim());
    setScammerInput('');
  };

  const handleTacticClick = (tactic: ScamTactic) => {
    if (voiceState === 'speaking') onInterruptSpeech();
    const text = isHindi ? tactic.textHi : tactic.textEn;
    onTransmitScammerSpeech(text);
  };

  const filteredTactics = activeCategory === 'all'
    ? SCAM_TACTICS
    : SCAM_TACTICS.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-rose-900/60 rounded-2xl shadow-2xl overflow-hidden font-sans">
      {/* Hacker / Scammer Terminal Header */}
      <div className="bg-slate-950 border-b border-rose-900/50 px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-600/60 flex items-center justify-center text-rose-400 font-bold shadow-lg shadow-rose-950/50">
              <Skull className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-rose-500" />
                {isHindi ? 'स्कैमर / कॉलर सिमुलेटर कंसोल' : 'Scammer Outbound Terminal'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/70 text-rose-300 border border-rose-600/40">
                CLI SPOOF: ACTIVE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-amber-400 border border-slate-800">
                AI Threat: {currentRiskScore}/100
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
              <span className="text-rose-300 font-semibold">{callerName}</span>
              <span>•</span>
              <span className="text-slate-400">{callerNumber}</span>
              <span>•</span>
              <span className="text-cyan-400">Target: Protected Mobile Line</span>
            </div>
          </div>
        </div>

        {/* Telemetry Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activeSpeaker === 'caller' ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
            <span>{activeSpeaker === 'caller' ? 'TRANSMITTING VOICE' : 'LINE OPEN'}</span>
          </span>
        </div>
      </div>

      {/* Acoustic Feedback: What the Scammer Hears from CallGuard AI */}
      <div className="bg-slate-900/90 border-b border-rose-900/30 p-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>{isHindi ? 'कॉलर के इयरपीस में सुनाई दे रहा है (CallGuard AI):' : 'Acoustic Return (What Scammer Hears):'}</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            {voiceState === 'speaking' && activeSpeaker === 'ai' ? 'AI SPEAKING NOW' : 'AI STANDBY'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs sm:text-sm text-slate-200 font-medium min-h-[44px] flex items-center">
          {lastAITurn ? (
            <p className="italic text-indigo-200 leading-relaxed">
              "{lastAITurn.text}"
            </p>
          ) : (
            <p className="text-slate-500 italic">
              {isHindi
                ? 'कॉल-गार्ड AI कॉल का उत्तर देने के लिए तैयार है...'
                : 'CallGuard AI greeting in progress...'}
            </p>
          )}
        </div>
      </div>

      {/* Simulation Persona & Auto-Progress Sequencer Bar */}
      {mode === 'SIMULATION' && (
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-slate-400">Persona Script:</span>
            <span className="text-purple-300 font-semibold truncate max-w-[200px]">
              {isHindi && activeScenario?.titleHindi ? activeScenario.titleHindi : activeScenario?.title || 'Active Script'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSimPause}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1"
            >
              {simIsPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
              <span>{simIsPaused ? (isHindi ? 'जारी रखें' : 'Resume') : (isHindi ? 'रोकें' : 'Pause')}</span>
            </button>

            <button
              onClick={onAdvanceSimTurn}
              disabled={simIsAdvancing || voiceState === 'analyzing' || simTurnIndex >= turnsTotal}
              className="px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 shadow-sm"
            >
              <SkipForward className="w-3 h-3" />
              <span>{isHindi ? `अगला टर्न (${simTurnIndex + 1}/${turnsTotal})` : `Next Turn (${simTurnIndex + 1}/${turnsTotal})`}</span>
            </button>

            <button
              onClick={onRestartScenario}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs"
              title={isHindi ? 'परिदृश्य पुनः आरंभ करें' : 'Restart Persona Script'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Scammer Attack Transmission Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs sm:text-sm">
        {/* Scammer Tactical Threat & Vector Assessment Card */}
        <ScammerRiskAssessmentCard
          analysis={currentAnalysis}
          currentRiskScore={currentRiskScore}
          callerName={callerName}
          callerNumber={callerNumber}
          language={language}
          activeCategory={activeCategory}
        />

        {/* Scammer Speech Transmission Controls */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-rose-500" />
              <span>{isHindi ? 'लाइव वॉयस ट्रांसमिशन (स्कैमर के रूप में बोलें)' : 'Voice Transmission as Scammer'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {isListening ? 'MICROPHONE OPEN' : 'MIC READY'}
            </span>
          </div>

          <button
            onClick={() => {
              if (isListening) {
                onStopListening();
              } else {
                if (voiceState === 'speaking') onInterruptSpeech();
                onStartListening();
              }
            }}
            disabled={voiceState === 'analyzing'}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2.5 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse'
                : 'bg-rose-950 hover:bg-rose-900/90 text-rose-200 border border-rose-600/50'
            } disabled:opacity-50`}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce text-white' : 'text-rose-400'}`} />
            <span>
              {isListening
                ? isHindi
                  ? 'स्कैमर की आवाज़ ट्रांसमिट हो रही है • रोकने के लिए टैप करें'
                  : 'Transmitting Scammer Voice • Click to End'
                : isHindi
                ? 'माइक दबाकर स्कैमर के रूप में बोलें'
                : 'Hold / Click to Speak as Scammer'}
            </span>
          </button>

          {interimTranscript && isListening && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs italic font-mono">
              "{interimTranscript}"
            </div>
          )}

          {/* Manual Scammer Text Utterance */}
          <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={scammerInput}
              onChange={(e) => setScammerInput(e.target.value)}
              placeholder={
                isHindi
                  ? 'या यहाँ स्कैमर की बात टाइप करें (जैसे: "मैडम तुरंत 6 डिजिट का OTP दीजिए")...'
                  : 'Or type scammer attack speech (e.g. "Give me the OTP code now")...'
              }
              disabled={voiceState === 'analyzing'}
              className="flex-1 bg-slate-950 border border-rose-900/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-rose-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!scammerInput.trim() || voiceState === 'analyzing'}
              className="p-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white disabled:opacity-40 transition-colors flex items-center justify-center shadow-md"
              title="Transmit speech"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Tactical Social Engineering Arsenal */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? 'सोशल इंजीनियरिंग हमले के हथियार (1-Click Attack):' : 'Social Engineering Attack Arsenal:'}</span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded-md ${activeCategory === 'all' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                ALL
              </button>
              <button
                onClick={() => setActiveCategory('otp')}
                className={`px-2 py-0.5 rounded-md ${activeCategory === 'otp' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                OTP
              </button>
              <button
                onClick={() => setActiveCategory('arrest')}
                className={`px-2 py-0.5 rounded-md ${activeCategory === 'arrest' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                POLICE
              </button>
              <button
                onClick={() => setActiveCategory('urgency')}
                className={`px-2 py-0.5 rounded-md ${activeCategory === 'urgency' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                URGENT
              </button>
              <button
                onClick={() => setActiveCategory('trojan')}
                className={`px-2 py-0.5 rounded-md ${activeCategory === 'trojan' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                APK
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredTactics.map((tactic) => {
              const label = isHindi ? tactic.labelHi : tactic.labelEn;
              const text = isHindi ? tactic.textHi : tactic.textEn;

              let borderClass = 'border-rose-900/40 hover:border-rose-500 bg-slate-900/80';
              if (tactic.category === 'safe') {
                borderClass = 'border-emerald-900/40 hover:border-emerald-500 bg-slate-900/80';
              }

              return (
                <button
                  key={tactic.id}
                  onClick={() => handleTacticClick(tactic)}
                  disabled={voiceState === 'analyzing'}
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 group ${borderClass}`}
                >
                  <div className="flex items-center justify-between font-bold text-xs text-rose-300 group-hover:text-white">
                    <span>{label}</span>
                    <Play className="w-3 h-3 text-slate-500 group-hover:text-rose-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    "{text}"
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Attack Interception Dialogue (Scammer Perspective) */}
        {messages.length > 0 && (
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>{isHindi ? 'लाइव हमला वार्तालाप लॉग (कॉलर परिप्रेक्ष्य)' : 'Tactical Interception Dialogue Log'}</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {messages.length} {isHindi ? 'टर्न रिकॉर्डेड' : 'TURNS RECORDED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/40 max-h-56 overflow-y-auto space-y-2.5 text-xs">
              {messages.map((turn, i) => {
                const isCaller = turn.sender === 'caller';
                return (
                  <div
                    key={turn.id || i}
                    className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                      isCaller
                        ? 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                        : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] pb-1 mb-1 border-b border-slate-800">
                      <span className="font-bold flex items-center gap-1">
                        {isCaller ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-rose-400">OUTBOUND ATTACK [CALLER]</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="text-indigo-400">CALLGUARD AI DEFENSE [SHIELD]</span>
                          </>
                        )}
                      </span>
                      <span className="text-slate-500">{turn.timestamp}</span>
                    </div>
                    <p className="font-sans text-xs">{turn.text}</p>
                    {turn.detectedSignals && turn.detectedSignals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-slate-800/60">
                        {turn.detectedSignals.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950/80 text-rose-300 border border-rose-600/40"
                          >
                            TACTIC: {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Telemetry Footer */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            <span>CallGuard AI Defense Interception Active</span>
          </span>
          <span className="text-rose-400">
            {currentAnalysis?.recommendedAction === 'BLOCK' ? 'TARGET COMPLIANCE: 0% (BLOCKED)' : 'INTERROGATION ACTIVE'}
          </span>
        </div>
      </div>
    </div>
  );
};
