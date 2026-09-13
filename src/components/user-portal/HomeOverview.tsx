import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  CalendarCheck,
  Play,
  Mic,
  Cpu,
  ChevronRight,
  ArrowUpRight,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';
import { getExpectedCalls } from '../../services/expectedCalls';

export const HomeOverview: React.FC = () => {
  const {
    sessions,
    startScreening,
    setUserPortalTab,
    navigateToCallDetails,
    language,
    setShowDemoModal,
    callStatus,
  } = useCallGuard();

  const isHi = language === 'hi';
  const expectedCalls = getExpectedCalls();

  const totalCalls = sessions.length;
  const blockedScams = sessions.filter((s) => s.finalAction === 'BLOCKED' || s.finalRiskLevel === 'HIGH').length;
  const safeConnected = sessions.filter((s) => s.finalAction === 'CONNECTED' || s.finalRiskLevel === 'LOW').length;
  const expectedCount = expectedCalls.length;

  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Shield Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isHi ? 'शील्ड सक्रिय • 24/7 सुरक्षा चालू' : 'Shield Active • 24/7 Call Protection On'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isHi ? 'कॉल-गार्ड उपयोगकर्ता पोर्टल' : 'CallGuard User Defense Portal'}
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            {isHi
              ? 'अज्ञात और संदिग्ध नंबरों से आने वाली कॉल्स की AI-संचालित स्क्रीनिंग। ओटीपी चोरी, डिजिटल अरेस्ट और बैंकिंग धोखाधड़ी से सुरक्षित रहें।'
              : 'Every incoming call from unknown numbers is autonomously answered and vetted by AI before reaching you. Protect your credentials, OTPs, and personal identity.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => startScreening('LIVE')}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>{isHi ? 'लाइव वॉयस कॉल टेस्ट' : 'Start Live Voice Screening'}</span>
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/20 flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>{isHi ? '5 फ्रॉड सिमुलेशन परिदृश्य' : 'Test 5 Scam Scenarios'}</span>
            </button>

            <button
              onClick={() => setUserPortalTab('expected-calls')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
              <span>{isHi ? 'अपेक्षित कॉल जोड़ें' : 'Whitelist Expected Call'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isHi ? 'स्क्रीन की गई कॉल्स' : 'Total Screened'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {totalCalls}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {isHi ? 'लाइव और सिमुलेशन सत्र' : 'Live & simulated sessions'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isHi ? 'ब्लॉक किए गए फ्रॉड' : 'Scams Blocked'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            {blockedScams}
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            {isHi ? 'ओटीपी और कूरियर फ्रॉड रोके' : '100% credential theft prevented'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isHi ? 'सुरक्षित कॉल्स कनेक्टेड' : 'Safe Calls Verified'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {safeConnected}
          </div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">
            {isHi ? 'सत्यापित संपर्क सुरक्षित रूप से जुड़े' : 'Connected to user safely'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isHi ? 'अपेक्षित कॉल्स' : 'Expected Calls'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2">
            {expectedCount}
          </div>
          <span className="text-[11px] text-cyan-500/80 mt-1 block">
            {isHi ? 'वाइटलिस्ट किए गए संगठन' : 'Scheduled & whitelisted'}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Recent Calls + Fraud Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Screened Calls */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                {isHi ? 'हालिया स्क्रीन की गई कॉल्स' : 'Recent Screened Calls'}
              </h3>
              <p className="text-xs text-slate-400">
                {isHi ? 'अंतिम जोखिम स्कोर और कार्रवाई' : 'Click any call to inspect full details'}
              </p>
            </div>
            <button
              onClick={() => setUserPortalTab('history')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>{isHi ? 'सभी इतिहास देखें' : 'View Full History'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              {isHi ? 'कोई हालिया कॉल लॉग नहीं है।' : 'No screened calls recorded yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const isBlocked = s.finalAction === 'BLOCKED' || s.finalRiskLevel === 'HIGH';
                return (
                  <div
                    key={s.id}
                    onClick={() => navigateToCallDetails(s)}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isBlocked
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isBlocked ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">
                            {s.callerName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {s.callerNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {s.intent || s.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide ${
                          isBlocked
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isBlocked ? 'BLOCKED' : 'SAFE'} • {s.finalRiskScore}/100
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Security Advisory & Whitelist Quick Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Whitelisted Expected Calls Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {isHi ? 'सक्रिय अपेक्षित कॉल्स' : 'Expected Calls Whitelist'}
                </h3>
              </div>
              <button
                onClick={() => setUserPortalTab('expected-calls')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + {isHi ? 'जोड़ें' : 'Add'}
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {isHi
                ? 'जब कोई कॉलर आपके अपेक्षित डिलीवरी या बैंक से मेल खाता है, तो कॉल-गार्ड सुरक्षित रूप से कॉल कनेक्ट कर देता है।'
                : 'Callers matching your scheduled contacts automatically bypass strict blocking after identity verification.'}
            </p>

            <div className="space-y-2">
              {expectedCalls.slice(0, 2).map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-200">{exp.organization}</div>
                    <div className="text-[11px] text-slate-400">{exp.reason}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-semibold">
                    {exp.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cyber Crime Helpline Callout */}
          <div className="bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-5 text-xs text-slate-300 shadow-xl">
            <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{isHi ? 'राष्ट्रीय साइबर अपराध सुरक्षा निर्देश' : 'India Cyber Crime Advisory'}</span>
            </div>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              {isHi
                ? 'कोई भी बैंक, पुलिस या सीबीआई अधिकारी कभी भी फोन पर ओटीपी, पासवर्ड या मनी ट्रांसफर की मांग नहीं करता। संदिग्ध कॉल आने पर तुरंत 1930 पर संपर्क करें।'
                : 'No official agency (Police, CBI, Customs, RBI, SBI) will ever demand money transfers or OTPs over a phone call. If targeted, dial 1930 or visit cybercrime.gov.in.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
