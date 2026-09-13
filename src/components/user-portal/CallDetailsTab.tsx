import React from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Clock,
  PhoneCall,
  FileText,
  AlertTriangle,
  CheckCircle,
  Copy,
  Bot,
  User,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';

export const CallDetailsTab: React.FC = () => {
  const {
    selectedSession,
    sessions,
    setUserPortalTab,
    language,
    startScreening,
  } = useCallGuard();

  const isHi = language === 'hi';

  // Fallback to first session if none explicitly selected
  const session = selectedSession || (sessions.length > 0 ? sessions[0] : null);

  if (!session) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">
          {isHi ? 'कोई कॉल चयनित नहीं है' : 'No Call Selected'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {isHi
            ? 'विस्तृत विवरण देखने के लिए कॉल इतिहास से एक कॉल चुनें।'
            : 'Select a call from your call history to view the full screening transcript and risk breakdown.'}
        </p>
        <button
          onClick={() => setUserPortalTab('history')}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
        >
          {isHi ? 'कॉल इतिहास पर जाएं' : 'Go to Call History'}
        </button>
      </div>
    );
  }

  const isBlocked = session.finalAction === 'BLOCKED' || session.finalRiskLevel === 'HIGH';

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  const copyTranscript = () => {
    const text = session.transcript
      .map((t) => `[${t.time}] ${t.sender.toUpperCase()}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert(isHi ? 'ट्रांसक्रिप्ट कॉपी किया गया!' : 'Transcript copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setUserPortalTab('history')}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? 'कॉल इतिहास पर वापस' : 'Back to History'}</span>
        </button>

        <button
          onClick={copyTranscript}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{isHi ? 'रिपोर्ट कॉपी करें' : 'Copy Report'}</span>
        </button>
      </div>

      {/* Main Call Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isBlocked
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isBlocked ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase ${
                    isBlocked
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {session.finalAction} • {session.finalRiskLevel} RISK
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {session.timestamp} ({formatDuration(session.durationSeconds)})
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                {session.callerName}
              </h2>

              <span className="text-sm font-mono text-cyan-400 inline-block mt-0.5">
                {session.callerNumber}
              </span>
            </div>
          </div>

          <div className="sm:text-right bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {isHi ? 'अंतिम जोखिम स्कोर' : 'Final Threat Score'}
            </span>
            <div
              className={`text-3xl font-black mt-1 ${
                isBlocked ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {session.finalRiskScore}
              <span className="text-sm font-normal text-slate-500">/100</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {session.category}
            </span>
          </div>
        </div>

        {/* AI Intent & Explanation */}
        <div className="py-6 border-b border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              {isHi ? 'कॉल का वास्तविक उद्देश्य' : 'Detected Caller Intent'}
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-200">
              {session.intent}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isHi ? 'AI मूल्यांकन और व्याख्या' : 'CallGuard Rationale & Explanation'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {session.explanation}
            </p>
          </div>

          {session.signals && session.signals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                {isHi ? 'पहचाने गए खतरे के संकेत' : 'Detected Threat Red Flags'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {session.signals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{sig}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Safety Recommendation Banner */}
        <div
          className={`mt-6 p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
            isBlocked
              ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          }`}
        >
          {isBlocked ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block mb-0.5">
              {isBlocked
                ? isHi
                  ? 'सुरक्षा निर्देश: यह नंबर ब्लॉक कर दिया गया है'
                  : 'Safety Advisory: Scammer Blocked'
                : isHi
                ? 'सत्यापित सुरक्षित कॉल'
                : 'Verified Legitimate Caller'}
            </span>
            <p className="text-xs opacity-90 leading-relaxed">
              {isBlocked
                ? isHi
                  ? 'इस नंबर पर वापस कॉल न करें। कोई भी ओटीपी, पिन या पासवर्ड किसी से भी साझा न करें। वित्तीय धोखाधड़ी की स्थिति में 1930 पर तुरंत रिपोर्ट करें।'
                  : 'Never call back or send payments. CallGuard successfully prevented this caller from reaching you. If credentials were shared elsewhere, report to 1930 immediately.'
                : isHi
                ? 'यह कॉलर सत्यापित है और किसी भी संवेदनशील जानकारी की मांग नहीं की गई।'
                : 'This call met all security verification checks with zero sensitive credential requests.'}
            </p>
          </div>
        </div>
      </div>

      {/* Full Conversation Transcript */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {isHi ? 'पूर्ण बातचीत ट्रांसक्रिप्ट' : 'Complete Call Transcript'}
            </h3>
            <p className="text-xs text-slate-400">
              {isHi
                ? 'कॉल-गार्ड AI और कॉलर के बीच शब्द-दर-शब्द संवाद'
                : 'Verbatim dialogue recorded between CallGuard AI and the caller'}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {session.transcript?.length || 0} {isHi ? 'संवाद मोड़' : 'turns'}
          </span>
        </div>

        <div className="space-y-4">
          {session.transcript && session.transcript.length > 0 ? (
            session.transcript.map((turn, idx) => {
              const isAI = turn.sender === 'ai';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-2xl ${
                    isAI ? 'ml-0 mr-auto' : 'mr-0 ml-auto flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAI
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                      isAI
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-mono text-slate-400">
                      <span className="font-bold">
                        {isAI ? 'CallGuard AI' : session.callerName}
                      </span>
                      <span>{turn.time}</span>
                    </div>
                    <p>{turn.text}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              {isHi ? 'कोई ट्रांसक्रिप्ट उपलब्ध नहीं है।' : 'No transcript recorded for this session.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
