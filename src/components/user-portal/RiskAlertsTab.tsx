import React from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldOff,
  ExternalLink,
  PhoneForwarded,
  HelpCircle,
  AlertTriangle,
  Lock,
  Radio,
  FileWarning,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';

export const RiskAlertsTab: React.FC = () => {
  const {
    sessions,
    language,
    navigateToCallDetails,
  } = useCallGuard();

  const isHi = language === 'hi';

  const highRiskSessions = sessions.filter(
    (s) => s.finalRiskLevel === 'HIGH' || s.finalAction === 'BLOCKED' || (s.signals && s.signals.length > 0)
  );

  const blockedNumbers = Array.from(
    new Set(highRiskSessions.map((s) => s.callerNumber))
  ).map((num) => {
    const matching = highRiskSessions.filter((s) => s.callerNumber === num);
    return {
      number: num,
      callerName: matching[0]?.callerName || 'Unknown Caller',
      count: matching.length,
      lastSeen: matching[0]?.timestamp || 'Recently',
      signals: matching[0]?.signals || [],
      category: matching[0]?.category || 'Scam Suspect',
    };
  });

  const knownThreatPatterns = [
    {
      title: isHi ? '1. डिजिटल अरेस्ट एवं सीबीआई/पुलिस धमकी' : '1. "Digital Arrest" & Fake Law Enforcement',
      desc: isHi
        ? 'कॉलर खुद को मुंबई पुलिस, सीबीआई या नारकोटिक्स विभाग का बताकर कहता है कि आपके आधार/पार्सल में ड्रग्स पाए गए हैं और वीडियो/ऑडियो कॉल पर रहने का दबाव बनाता है।'
        : 'Scammer poses as Mumbai Police, CBI, or Narcotics Bureau claiming your Aadhaar or courier contains contraband, coercing you to stay on call.',
      severity: 'CRITICAL',
    },
    {
      title: isHi ? '2. बैंक केवाईसी एवं क्रेडिट कार्ड ओटीपी चोरी' : '2. Bank KYC & Card Limit OTP Harvesting',
      desc: isHi
        ? 'बैंक सुरक्षा या रिवॉर्ड पॉइंट्स का झांसा देकर खाते को फ्रीज होने से बचाने के लिए 6-अंकों का ओटीपी या एनीडेस्क/टीमव्यूअर ऐप इंस्टॉल करने को कहता है।'
        : 'Caller claims your card points are expiring or account is flagged, urging you to disclose the 6-digit OTP or install remote screen-sharing APKs.',
      severity: 'HIGH',
    },
    {
      title: isHi ? '3. बिजली बिल विच्छेदन फ्रॉड' : '3. Urgent Electricity Disconnection Scam',
      desc: isHi
        ? 'एसएमएस या कॉल करके दावा करता है कि आपका पिछला बिल अपडेट नहीं हुआ है और आज रात 9:30 बजे बिजली काट दी जाएगी।'
        : 'Urgent threats stating your electricity meter will be disconnected tonight unless you pay immediately through an unverified UPI link.',
      severity: 'HIGH',
    },
    {
      title: isHi ? '4. कूरियर डिलीवरी एवं सीमा शुल्क उगाही' : '4. Customs & FedEx Parcel Extortion',
      desc: isHi
        ? 'दावा किया जाता है कि आपके नाम से विदेश भेजा गया पार्सल सीमा शुल्क पर रोक लिया गया है और जुर्माना न भरने पर कानूनी कार्रवाई होगी।'
        : 'Claims an international parcel under your name was seized by customs, demanding clearance fees to avert arrest.',
      severity: 'MEDIUM',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Alerts Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
              {isHi ? 'सुरक्षा चेतावनी केंद्र' : 'Threat Intelligence & Alerts'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
              {isHi ? 'पहचाने गए फ्रॉड सिग्नल्स और ब्लॉक की गई कॉल्स' : 'Active Fraud Signals & Blocked Threats'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isHi
                ? 'कॉल-गार्ड द्वारा पकड़े गए सभी उच्च जोखिम वाले कॉलर, जबरन वसूली के प्रयास और ओटीपी चोरी के संकेत।'
                : 'Real-time catalog of verified high-risk fraud triggers, scam callers intercepted by CallGuard AI, and phone safety guidelines.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Intercepted High-Risk Calls + Blocked Numbers Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Intercepted High-Risk Calls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  {isHi ? 'रोकी गई उच्च जोखिम कॉल्स' : 'Intercepted High-Risk Incidents'}
                </h3>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                {highRiskSessions.length} {isHi ? 'पहचाने गए' : 'Detected'}
              </span>
            </div>

            {highRiskSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                {isHi ? 'कोई उच्च जोखिम वाली कॉल नहीं पकड़ी गई।' : 'No high-risk threats detected yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {highRiskSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigateToCallDetails(s)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-white group-hover:text-rose-400 transition-colors">
                          {s.callerName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {s.callerNumber}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                        {s.finalRiskScore}/100 HIGH
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {s.explanation}
                    </p>

                    {s.signals && s.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {s.signals.map((sig, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-950/60 border border-rose-500/30 text-rose-300"
                          >
                            ⚠️ {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocklist Directory */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-3">
              {isHi ? 'ब्लॉक की गई फोन नंबर सूची' : 'Automated Blocklist Directory'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isHi
                ? 'कॉल-गार्ड इन नंबरों से आने वाली सभी कॉल्स को तुरंत ब्लॉक कर देता है।'
                : 'Numbers flagged as dangerous scammers are permanently filtered.'}
            </p>

            <div className="space-y-2">
              {blockedNumbers.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-rose-400">{b.number}</span>
                    <span className="text-slate-400 ml-2">({b.callerName})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                    BLOCKED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Known Threat Patterns in India */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">
              {isHi ? 'भारत में सक्रिय शीर्ष 4 फोन फ्रॉड' : 'Top 4 Active Phone Fraud Tactics'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isHi
                ? 'कॉल-गार्ड का AI मॉडल इन सभी फ्रॉड पैटर्न को स्वतः पहचानता है।'
                : 'CallGuard AI specifically screens against these trending fraud patterns.'}
            </p>

            <div className="space-y-3">
              {knownThreatPatterns.map((pat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100">{pat.title}</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        pat.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {pat.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                    {pat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency 1930 Helpline */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-xl text-xs">
            <div className="flex items-center gap-2 font-bold text-cyan-400 mb-2">
              <PhoneForwarded className="w-5 h-5" />
              <span>{isHi ? 'राष्ट्रीय साइबर अपराध हेल्पलाइन: 1930' : 'National Cyber Crime Helpline: 1930'}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] mb-3">
              {isHi
                ? 'यदि आपने किसी धोखेबाज को अनजाने में पैसे भेज दिए हैं, तो तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट दर्ज करें। 2-3 घंटे के भीतर ट्रांजैक्शन फ्रीज हो सकता है।'
                : 'If you have been defrauded, call 1930 immediately or file a report at cybercrime.gov.in. Immediate reporting within the golden hour enables authorities to freeze fraudulent account transfers.'}
            </p>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
