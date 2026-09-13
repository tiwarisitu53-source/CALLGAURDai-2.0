import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Cpu,
  Sparkles,
  Send,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Radio,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';
import { DynamicRiskTimeline } from '../DynamicRiskTimeline';
import { UserVerificationModal } from '../UserVerificationModal';
import { LiveRiskAlertBanner } from '../LiveRiskAlertBanner';
import { SIMULATION_SCENARIOS } from '../../services/scenarios';

export const AiScanner: React.FC = () => {
  const {
    callStatus,
    screeningMode,
    setScreeningMode,
    language,
    callerName,
    callerNumber,
    activeScenario,
    currentAnalysis,
    isAnalyzing,
    callDuration,
    voiceState,
    activeSpeaker,
    messages,
    interimTranscript,
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
    isMuted,
    toggleMute,
    autoListen,
    setAutoListen,
    micPermissionDenied,
    gnaniConfigured,
    showVerificationModal,
    setShowVerificationModal,
    setShowDemoModal,
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
  } = useCallGuard();

  const isHi = language === 'hi';
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [manualUtterance, setManualUtterance] = useState('');
  const [whisperText, setWhisperText] = useState('');

  const riskScore = currentAnalysis?.riskScore ?? 5;
  const riskLevel = currentAnalysis?.riskLevel ?? 'LOW';
  const isHighRisk = riskScore >= 71;
  const isMedRisk = riskScore >= 31 && riskScore <= 70;

  // Auto-scroll transcript on new turns
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const onSendManualUtterance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUtterance.trim() || isAnalyzing) return;
    const text = manualUtterance.trim();
    setManualUtterance('');
    await processCallerSpeech(text);
  };

  const onSendWhisper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperText.trim()) return;
    const text = whisperText.trim();
    setWhisperText('');
    await handleWhisperInstruction(text);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto py-2 sm:py-4 space-y-4">
      {/* Verification Modal if triggered */}
      {showVerificationModal && (
        <UserVerificationModal
          claimedEntity={matchedCall?.organization || currentAnalysis?.claimedOrganization || 'Bank / Service Official'}
          matchedCall={matchedCall}
          onRespond={handleUserVerification}
          language={language}
        />
      )}

      {/* Live Threat Alert Banner */}
      {liveThreatAlert && (
        <LiveRiskAlertBanner
          score={liveThreatAlert.score}
          threatType={liveThreatAlert.threatType}
          threatDetails={liveThreatAlert.threatDetails}
          onDismiss={dismissThreatAlert}
          language={language}
        />
      )}

      {/* 1. Live Call Technical Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status & Caller Info */}
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 border ${
                callStatus === 'screening'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse'
                  : callStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {screeningMode === 'LIVE' ? <Mic className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    callStatus === 'screening'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 animate-pulse'
                      : callStatus === 'connected'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ● {callStatus === 'screening' ? 'ACTIVE SCREENING' : callStatus === 'connected' ? 'CONNECTED - LIVE SHIELD' : 'INCOMING / IDLE'}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800">
                  {screeningMode === 'LIVE' ? 'LIVE VOICE MODE' : 'SIMULATION MODE'}
                </span>

                <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(callDuration)}
                </span>

                {gnaniConfigured && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    Gnani.ai Voice
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-1">
                <h2 className="text-base font-black text-white">{callerName}</h2>
                <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {callerNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Active Speaker Visualizer & Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Speaker Visualizer */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">{isHi ? 'वक्ता:' : 'Speaker:'}</span>
              {activeSpeaker === 'ai' ? (
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  AI ASSISTANT
                </span>
              ) : activeSpeaker === 'caller' ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  CALLER
                </span>
              ) : voiceState === 'analyzing' ? (
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  GEMINI ANALYZING
                </span>
              ) : (
                <span className="text-slate-400">STANDBY</span>
              )}
            </div>

            {/* Quick Action Controls */}
            {callStatus === 'screening' && (
              <>
                <button
                  onClick={connectCall}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{isHi ? 'कनेक्ट करें' : 'Connect User'}</span>
                </button>

                <button
                  onClick={blockCaller}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isHi ? 'ब्लॉक करें' : 'Block'}</span>
                </button>

                <button
                  onClick={() => hangupCall('DISMISSED')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>{isHi ? 'समाप्त' : 'End'}</span>
                </button>
              </>
            )}

            {callStatus !== 'screening' && callStatus !== 'connected' && (
              <button
                onClick={() => startScreening('SIMULATION')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isHi ? 'सिमुलेशन शुरू करें' : 'Start Simulation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Technical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[580px]">
        {/* PANE A (Left: 7 cols): Real-time Conversation Transcript & Speech Injector */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          {/* Transcript Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {isHi ? 'लाइव बातचीत ट्रांसक्रिप्ट (STT)' : 'Live Conversation Stream (STT & TTS)'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Simulation Turn Indicator */}
              {screeningMode === 'SIMULATION' && (
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/30">
                  Turn {simTurnIndex} / {totalSimTurns}
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-500">
                {messages.length} turns
              </span>
            </div>
          </div>

          {/* Context Match Status Strip */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${
                  matchedCall ? 'text-emerald-400' : 'text-slate-500'
                }`}
              />
              <span className="text-slate-400 text-[11px]">
                {isHi ? 'अपेक्षित कॉल मिलान:' : 'Context Whitelist Match:'}
              </span>
              <span
                className={`font-bold text-[11px] ${
                  matchedCall ? 'text-emerald-300' : 'text-slate-400'
                }`}
              >
                {matchedCall ? `MATCH: ${matchedCall.organization}` : 'NO SCHEDULED MATCH'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                {isHi ? 'पुष्टि:' : 'User Status:'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  userVerification === 'EXPECTED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : userVerification === 'UNEXPECTED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                {userVerification || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[380px] min-h-[260px]">
            {messages.map((turn) => {
              const isAi = turn.sender === 'ai';
              return (
                <div
                  key={turn.id}
                  className={`flex gap-3 max-w-xl ${
                    isAi ? 'ml-0 mr-auto' : 'mr-0 ml-auto flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isAi
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isAi ? 'AI' : 'CAL'}
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                      isAi
                        ? 'bg-slate-950 border-slate-800 text-slate-200 shadow-sm'
                        : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-mono text-slate-400">
                      <span className="font-bold">
                        {isAi ? 'CallGuard AI' : callerName}
                      </span>
                      <span>{turn.timestamp}</span>
                    </div>

                    <p>{turn.text}</p>

                    {turn.riskScoreAtTurn !== undefined && !isAi && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-400">
                          Risk after turn:
                        </span>
                        <span
                          className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                            turn.riskScoreAtTurn >= 71
                              ? 'bg-rose-950 text-rose-300'
                              : turn.riskScoreAtTurn >= 31
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {turn.riskScoreAtTurn}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Interim STT Live Stream */}
            {interimTranscript && (
              <div className="flex gap-3 max-w-xl mr-0 ml-auto flex-row-reverse">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  CAL
                </div>
                <div className="p-3 rounded-2xl text-xs leading-relaxed border bg-amber-950/20 border-amber-500/30 text-amber-200 italic animate-pulse">
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">
                    Live Speech-to-Text:
                  </span>
                  {interimTranscript}...
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Simulation & Speech Controls Toolbar */}
          <div className="pt-3 mt-3 border-t border-slate-800 space-y-2.5">
            {/* Mode-specific Controls */}
            {screeningMode === 'SIMULATION' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={advanceSimulationTurn}
                  disabled={simIsAdvancing || isAnalyzing || simTurnIndex >= totalSimTurns}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {simIsAdvancing || isAnalyzing
                      ? isHi
                        ? 'विश्लेषण जारी...'
                        : 'Analyzing Turn...'
                      : isHi
                      ? `अगला मोड़ चलाएं (${simTurnIndex + 1}/${totalSimTurns})`
                      : `Advance Next Turn (${simTurnIndex + 1}/${totalSimTurns})`}
                  </span>
                </button>

                <button
                  onClick={restartSimulation}
                  title="Restart Simulation"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition-colors"
                >
                  {isHi ? 'परिदृश्य बदलें' : 'Change Persona'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (voiceState === 'listening') {
                      stopListeningMode();
                    } else {
                      startListeningMode();
                    }
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    voiceState === 'listening'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {voiceState === 'listening' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>
                    {voiceState === 'listening'
                      ? isHi
                        ? 'माइक्रोफ़ोन बंद करें'
                        : 'Mute Microphone'
                      : isHi
                      ? 'बोलने के लिए माइक्रोफ़ोन दबाएं'
                      : 'Click to Speak (Live STT)'}
                  </span>
                </button>
              </div>
            )}

            {/* Manual Speech Injector Form */}
            <form onSubmit={onSendManualUtterance} className="flex items-center gap-2">
              <input
                type="text"
                value={manualUtterance}
                onChange={(e) => setManualUtterance(e.target.value)}
                placeholder={
                  isHi
                    ? 'कॉलर के रूप में कोई भी वाक्य टाइप करें (जैसे: "मुझे बैंक ओटीपी तुरंत चाहिए")...'
                    : 'Inject test caller statement (e.g., "Give me your 6-digit OTP right now")...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !manualUtterance.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isHi ? 'भेजें' : 'Inject'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* PANE B (Right: 5 cols): Technical Risk Engine, Signals & Trajectory */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* 1. Risk Score Gauge Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {isHi ? 'वर्तमान जोखिम स्तर और स्कोर' : 'Live Risk Assessment'}
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border ${
                  isHighRisk
                    ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
                    : isMedRisk
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {riskLevel} RISK
              </span>
            </div>

            {/* Big Score Arc & Metrics */}
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  {isHi ? 'धोखाधड़ी संभावना' : 'Fraud Probability'}
                </span>
                <div
                  className={`text-4xl font-black mt-0.5 font-mono ${
                    isHighRisk
                      ? 'text-rose-400'
                      : isMedRisk
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {riskScore}
                  <span className="text-base font-normal text-slate-500 font-sans">
                    /100
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  {isHi ? 'अनुशंसित कार्रवाई' : 'Recommendation'}
                </span>
                <span
                  className={`inline-block font-black text-xs px-2.5 py-1 rounded-lg mt-1 border ${
                    currentAnalysis?.recommendedAction === 'BLOCK'
                      ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                      : currentAnalysis?.recommendedAction === 'CONNECT'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {currentAnalysis?.recommendedAction || 'SCREEN_FURTHER'}
                </span>
              </div>
            </div>

            {/* Plain AI Explanation */}
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="font-bold text-slate-400 block mb-0.5 text-[11px]">
                {isHi ? 'AI विश्लेषण निष्कर्ष:' : 'Gemini Threat Evaluation:'}
              </span>
              {currentAnalysis?.explanation ||
                (isHi
                  ? 'कॉल-गार्ड वर्तमान में कॉलर के बयानों की जांच कर रहा है।'
                  : 'Analyzing caller speech patterns against known fraud heuristics.')}
            </div>
          </div>

          {/* 2. Detected Risk Signals Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {isHi ? 'पहचाने गए फ्रॉड सिग्नल्स' : 'Detected Risk Signals'}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {currentAnalysis?.signals?.length || 0} active
              </span>
            </div>

            {currentAnalysis?.signals && currentAnalysis.signals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentAnalysis.signals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>{sig}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-2 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
                {isHi ? 'कोई गंभीर फ्रॉड संकेत नहीं मिला' : 'Zero malicious signals detected so far'}
              </div>
            )}
          </div>

          {/* 3. Dynamic Risk Timeline (showing changes e.g. 18 -> 34 -> 82) */}
          <DynamicRiskTimeline
            points={riskTimeline}
            currentScore={riskScore}
            language={language}
          />

          {/* 4. Continuous Monitoring Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    callStage === 'CONNECTED_MONITORING'
                      ? 'text-emerald-400 animate-spin'
                      : 'text-indigo-400'
                  }`}
                />
                <span className="font-bold text-slate-200">
                  {isHi ? 'कंटीन्यूअस बैकग्राउंड मॉनिटरिंग' : 'Continuous Live Monitoring'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  callStage === 'CONNECTED_MONITORING'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400'
                }`}
              >
                {callStage === 'CONNECTED_MONITORING' ? 'SHIELD ACTIVE' : 'READY ON CONNECT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {isHi
                ? 'कॉल कनेक्ट होने के बाद भी कॉल-गार्ड पृष्ठभूमि में सुनता रहता है और नए वित्तीय खतरों की चेतावनी देता है।'
                : 'CallGuard continuously analyzes audio post-connection to catch mid-call coercive pivots or OTP requests.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
