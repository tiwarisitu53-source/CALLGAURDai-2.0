import React from 'react';
import {
  Shield,
  User,
  Activity,
  Mic,
  Cpu,
  Sparkles,
  Languages,
  PhoneCall,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';

export const TopNavBar: React.FC = () => {
  const {
    activeInterface,
    setActiveInterface,
    callStatus,
    screeningMode,
    setScreeningMode,
    language,
    setLanguage,
    currentAnalysis,
    callerNumber,
    isMuted,
    toggleMute,
    setShowDemoModal,
    startScreening,
  } = useCallGuard();

  const isCallActive = callStatus === 'screening' || callStatus === 'connected' || callStatus === 'monitoring';
  const riskScore = currentAnalysis?.riskScore ?? 5;
  const isHighRisk = riskScore >= 71;
  const isMedRisk = riskScore >= 31 && riskScore <= 70;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                CallGuard<span className="text-cyan-400">.AI</span>
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v2.4 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {language === 'hi' ? 'भारतीय फोन फ्रॉड रोकथाम प्रणाली' : 'Intelligent Fraud Defense & Call Screener'}
            </p>
          </div>
        </div>

        {/* Center: Primary Interface Selector (User Portal vs AI Scanner) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-inner">
          <button
            id="nav-user-portal-tab"
            type="button"
            onClick={() => setActiveInterface('user_portal')}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeInterface === 'user_portal'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-indigo-300" />
            <span>👤 User Portal</span>
          </button>

          <button
            id="nav-ai-scanner-tab"
            type="button"
            onClick={() => setActiveInterface('ai_scanner')}
            className={`relative px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeInterface === 'ai_scanner'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>🔍 AI Scanner</span>
            {isCallActive && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>

        {/* Right: Active Call Pill & Controls */}
        <div className="flex items-center gap-2">
          {/* Active Call Live Banner indicator */}
          {isCallActive ? (
            <button
              onClick={() => setActiveInterface('ai_scanner')}
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all animate-pulse ${
                isHighRisk
                  ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                  : isMedRisk
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                  : 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
              }`}
            >
              {isHighRisk ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              ) : (
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              )}
              <span>
                {callStatus === 'connected' ? 'LIVE SHIELD' : 'SCREENING'}: {riskScore}/100
              </span>
            </button>
          ) : (
            <button
              onClick={() => startScreening('SIMULATION')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Call</span>
            </button>
          )}

          {/* Audio Mute toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isMuted
                ? 'bg-amber-950/50 border-amber-800 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिं
            </button>
          </div>

          {/* Persona Scenarios launcher */}
          <button
            onClick={() => setShowDemoModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>5 Scenarios</span>
          </button>
        </div>
      </div>
    </header>
  );
};
