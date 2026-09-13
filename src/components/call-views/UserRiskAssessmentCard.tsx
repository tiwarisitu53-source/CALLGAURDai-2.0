import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lock,
  FileWarning,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { RiskAnalysis, LanguageOption, ExpectedCall, UserVerificationResponse } from '../../types';

interface UserRiskAssessmentCardProps {
  analysis: RiskAnalysis | null;
  currentRiskScore: number;
  callerName: string;
  callerNumber: string;
  language: LanguageOption;
  matchedExpectedCall?: ExpectedCall | null;
  userVerification?: UserVerificationResponse;
}

export const UserRiskAssessmentCard: React.FC<UserRiskAssessmentCardProps> = ({
  analysis,
  currentRiskScore,
  callerName,
  callerNumber,
  language,
  matchedExpectedCall,
  userVerification,
}) => {
  const isHindi = language === 'hi';
  const [isExpanded, setIsExpanded] = useState(true);

  const score = analysis ? analysis.riskScore : currentRiskScore;
  const level = analysis ? analysis.riskLevel : score >= 71 ? 'HIGH' : score >= 31 ? 'MEDIUM' : 'LOW';

  const getRiskTheme = () => {
    if (score >= 71) {
      return {
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        barColor: 'bg-gradient-to-r from-rose-600 to-red-500',
        textColor: 'text-rose-400',
        glow: 'border-rose-500/40 bg-gradient-to-br from-slate-950 to-rose-950/20',
        headline: isHindi ? 'उच्च जोखिम: यह कॉल एक फ्रॉड हो सकती है' : 'HIGH RISK: Severe Fraud Attempt Suspected',
        advice: isHindi
          ? 'कॉल-गार्ड AI आपको सलाह देता है कि तुरंत कॉल काट दें और किसी भी लिंक या OTP को साझा न करें।'
          : 'CallGuard AI strongly advises you NOT to disclose any credentials, OTPs, or agree to any digital arrest.',
        icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      };
    }
    if (score >= 31) {
      return {
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        textColor: 'text-amber-400',
        glow: 'border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/20',
        headline: isHindi ? 'संदेहास्पद: कॉलर की पहचान की पुष्टि नहीं हुई है' : 'SUSPICIOUS: Unverified Caller & Vague Intent',
        advice: isHindi
          ? 'कॉलर द्वारा किया गया दावा असत्यापित है। कॉल-गार्ड AI अतिरिक्त जांच कर रहा है।'
          : 'Caller identity is unconfirmed. Allow CallGuard AI to probe further before speaking directly.',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      };
    }
    return {
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      textColor: 'text-emerald-400',
      glow: 'border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/20',
      headline: isHindi ? 'कम जोखिम: सामान्य संचार प्रतीत होता है' : 'LOW RISK: Guarded Normal Communication',
      advice: isHindi
        ? 'कॉल-गार्ड AI सुरक्षा बनाए रखते हुए सामान्य बातचीत की अनुमति दे रहा है।'
        : 'Communication currently appears legitimate, but CallGuard continuous shield remains active.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    };
  };

  const theme = getRiskTheme();
  const signals = analysis?.signals || [];
  const claimedOrg = analysis?.claimedOrganization || (analysis?.category !== 'GENERAL' ? analysis?.category : undefined);

  return (
    <div className={`rounded-2xl border ${theme.glow} shadow-xl overflow-hidden transition-all duration-200`}>
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isHindi ? 'उपयोगकर्ता सक्रिय जोखिम मूल्यांकन' : 'User Active Risk Assessment'}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${theme.badgeBg}`}>
                {level} {isHindi ? 'जोखिम' : 'RISK'} ({score}/100)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isHindi ? 'व्यक्तिगत सुरक्षा एवं तत्काल चेतावनी' : 'Personal Protection & Live Defense Advisory'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors flex items-center gap-1"
        >
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? (isHindi ? 'छिपाएं' : 'Collapse') : (isHindi ? 'विस्तार' : 'Expand')}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3.5 text-xs">
          {/* Visual Risk Gauge & Primary Advisory */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                {theme.icon}
                <span>{theme.headline}</span>
              </span>
              <span className={`font-mono font-bold text-sm ${theme.textColor}`}>{score} / 100</span>
            </div>

            {/* Risk Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full ${theme.barColor} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
              🛡️ {theme.advice}
            </p>
          </div>

          {/* Caller Identity Verification Diagnostic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Identity Claim Check */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>{isHindi ? 'कॉलर का कथित दावा' : 'Caller Claimed Identity'}</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {claimedOrg || callerName}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="font-mono text-slate-500">{callerNumber}</span>
                <span>•</span>
                <span className={score >= 60 ? 'text-rose-400 font-semibold' : 'text-amber-400'}>
                  {score >= 60 ? (isHindi ? 'असत्यापित / स्पूफ' : 'Unverified / Spoof') : (isHindi ? 'जांच जारी' : 'Evaluating')}
                </span>
              </div>
            </div>

            {/* Whitelist Cross-Check */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-indigo-400" />
                <span>{isHindi ? 'अपेक्षित कॉल से मिलान' : 'Expected Calls Match'}</span>
              </div>
              {matchedExpectedCall ? (
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>✓ {matchedExpectedCall.organization}</span>
                  <span className="text-[10px] text-slate-400">({matchedExpectedCall.category})</span>
                </div>
              ) : (
                <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isHindi ? 'अपेक्षित सूची में कोई मिलान नहीं' : 'No Whitelist Match Found'}</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500">
                {userVerification === 'EXPECTED'
                  ? isHindi
                    ? 'उपयोगकर्ता द्वारा अपेक्षित चिह्नित'
                    : 'User confirmed as expected'
                  : userVerification === 'UNEXPECTED'
                  ? isHindi
                    ? 'उपयोगकर्ता द्वारा अप्रत्याशित चिह्नित (+25 जोखिम)'
                    : 'User marked unexpected (+25 Risk)'
                  : isHindi
                  ? 'संदेह होने पर कॉल डिस्कनेक्ट करें'
                  : 'Verify independently before trusting'}
              </div>
            </div>
          </div>

          {/* Active Detected Threat Signals */}
          {signals.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <FileWarning className="w-3 h-3 text-rose-400" />
                <span>{isHindi ? 'पहचाने गए फ्रॉड संकेत (Active Threats)' : 'Active Threats & Coercion Signals'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {signals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30 flex items-center gap-1"
                  >
                    <span>⚠️</span>
                    <span>{sig}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Golden Rules for User Defense */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="text-rose-400 font-bold">✕</span>
              <span>{isHindi ? 'कोई भी OTP, पासवर्ड या पिन साझा न करें।' : 'Never share SMS OTPs, UPI MPIN, or passwords.'}</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="text-rose-400 font-bold">✕</span>
              <span>{isHindi ? 'AnyDesk या रिमोट एक्सेस ऐप इंस्टॉल न करें।' : 'Do not install screen sharing APKs or tap links.'}</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="text-rose-400 font-bold">✕</span>
              <span>{isHindi ? 'डिजिटल अरेस्ट या सीबीआई की धमकी से न डरें।' : 'Disregard "Digital Arrest" claims; real police never call to interrogate.'}</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{isHindi ? 'कॉल-गार्ड AI को सवाल पूछने दें या सीधे ब्लॉक करें।' : 'Let CallGuard AI interrogate the caller or hit Block & Report.'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
