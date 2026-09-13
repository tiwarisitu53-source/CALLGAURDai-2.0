import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  PhoneOff,
  UserCheck,
  Send,
  ExternalLink,
  Volume2,
  Mic,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';

export const ActiveCallUserBanner: React.FC = () => {
  const {
    callStatus,
    callerName,
    callerNumber,
    currentAnalysis,
    callDuration,
    connectCall,
    hangupCall,
    blockCaller,
    handleWhisperInstruction,
    setActiveInterface,
    language,
    activeSpeaker,
  } = useCallGuard();

  const [whisperInput, setWhisperInput] = useState('');
  const [whisperSent, setWhisperSent] = useState(false);

  if (callStatus !== 'screening' && callStatus !== 'connected' && callStatus !== 'monitoring') {
    return null;
  }

  const riskScore = currentAnalysis?.riskScore ?? 5;
  const isHighRisk = riskScore >= 71;
  const isMedRisk = riskScore >= 31 && riskScore <= 70;
  const isHi = language === 'hi';

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const onSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperInput.trim()) return;
    handleWhisperInstruction(whisperInput.trim());
    setWhisperInput('');
    setWhisperSent(true);
    setTimeout(() => setWhisperSent(false), 3000);
  };

  return (
    <div
      id="active-call-user-banner"
      className={`rounded-2xl p-5 mb-6 border shadow-xl transition-all ${
        isHighRisk
          ? 'bg-rose-950/40 border-rose-500/80 shadow-rose-950/30'
          : isMedRisk
          ? 'bg-amber-950/40 border-amber-500/80 shadow-amber-950/30'
          : 'bg-indigo-950/40 border-indigo-500/80 shadow-indigo-950/30'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Caller Info and Simple Warning */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isHighRisk
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : isMedRisk
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
            }`}
          >
            {isHighRisk ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide uppercase border ${
                  isHighRisk
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : isMedRisk
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isHighRisk
                  ? isHi
                    ? '⚠️ उच्च जोखिम - फ्रॉड की संभावना'
                    : '⚠️ High Risk Scam Detected'
                  : isMedRisk
                  ? isHi
                    ? 'संभावित संदिग्ध कॉलर'
                    : 'Suspicious Caller Warning'
                  : isHi
                  ? 'सुरक्षित कॉलर'
                  : 'Screening in Progress'}
              </span>

              <span className="text-xs font-mono text-slate-400">
                ⏱ {formatTime(callDuration)}
              </span>

              {activeSpeaker === 'ai' && (
                <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  {isHi ? 'AI बोल रहा है' : 'AI Speaking'}
                </span>
              )}

              {activeSpeaker === 'caller' && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <Mic className="w-3 h-3 animate-pulse" />
                  {isHi ? 'कॉलर बोल रहा है' : 'Caller Speaking'}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {callerName}{' '}
              <span className="text-sm font-normal text-slate-400 font-mono">
                ({callerNumber})
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {currentAnalysis?.explanation ||
                (isHi
                  ? 'कॉल-गार्ड वर्तमान में इस कॉलर से पूछताछ कर रहा है।'
                  : 'CallGuard is actively screening this caller to determine their real intent.')}
            </p>
          </div>
        </div>

        {/* Right: Simple User Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {callStatus === 'screening' ? (
            <button
              id="user-banner-join-call"
              onClick={connectCall}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isHi ? 'कॉल से जुड़ें' : 'Join Call'}</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>{isHi ? 'कॉल कनेक्टेड (लाइव शील्ड ऑन)' : 'Call Connected (Live Shield Active)'}</span>
            </span>
          )}

          <button
            id="user-banner-decline-call"
            onClick={() => hangupCall('DISMISSED')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all border border-slate-700 flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4 text-slate-400" />
            <span>{isHi ? 'कॉल समाप्त करें' : 'Decline / Hang Up'}</span>
          </button>

          {isHighRisk && (
            <button
              id="user-banner-block-call"
              onClick={blockCaller}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-600/20 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isHi ? 'ब्लॉक और रिपोर्ट करें' : 'Block & Report'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveInterface('ai_scanner')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <span>{isHi ? 'AI स्कैनर देखें' : 'View AI Scanner'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Secret Whisper to AI Bar */}
      <form onSubmit={onSendWhisper} className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
        <input
          type="text"
          value={whisperInput}
          onChange={(e) => setWhisperInput(e.target.value)}
          placeholder={
            isHi
              ? 'AI को चुपके से निर्देश दें (जैसे: "उनसे आधिकारिक कर्मचारी आईडी पूछें")...'
              : 'Whisper instructions to CallGuard AI (e.g., "Ask for their official branch ID")...'
          }
          className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isHi ? 'भेजें' : 'Whisper'}</span>
        </button>
        {whisperSent && (
          <span className="text-xs text-emerald-400 font-semibold">
            {isHi ? 'निर्देश भेजा गया!' : 'Whisper Delivered!'}
          </span>
        )}
      </form>
    </div>
  );
};
