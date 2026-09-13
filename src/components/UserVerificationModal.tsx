import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileQuestion,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { ExpectedCall, UserVerificationResponse } from '../types';

interface UserVerificationModalProps {
  isOpen: boolean;
  callerClaimedOrg: string;
  callerReason: string;
  matchedExpectedCall?: ExpectedCall | null;
  onRespond: (response: UserVerificationResponse) => void;
  language?: 'en' | 'hi';
  timeoutSeconds?: number;
}

export const UserVerificationModal: React.FC<UserVerificationModalProps> = ({
  isOpen,
  callerClaimedOrg,
  callerReason,
  matchedExpectedCall,
  onRespond,
  language = 'en',
  timeoutSeconds = 12,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  const isHindi = language === 'hi';

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(timeoutSeconds);

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Feature 3: User did not respond in time -> Treat as UNAVAILABLE (UNKNOWN), NOT YES
          onRespond('UNAVAILABLE');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeoutSeconds, onRespond]);

  if (!isOpen) return null;

  const progressPercent = (secondsLeft / timeoutSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header & Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isHindi ? 'क्या आप इस कॉल की प्रतीक्षा कर रहे हैं?' : 'Is this a call you are expecting?'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHindi ? 'त्वरित पुष्टि से स्क्रीनिंग सटीकता बढ़ती है' : 'Voluntary context verification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{secondsLeft}s</span>
          </div>
        </div>

        {/* Progress Countdown Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Caller Claim Details */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {isHindi ? 'कॉलर द्वारा दावा किया गया संगठन' : 'Claimed Organization'}
              </span>
              <span className="text-sm font-bold text-slate-100">{callerClaimedOrg || 'Unspecified'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileQuestion className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {isHindi ? 'कॉल का बताया गया कारण' : 'Stated Purpose'}
              </span>
              <span className="text-slate-300 font-medium">{callerReason || 'General Inquiry'}</span>
            </div>
          </div>

          {matchedExpectedCall && (
            <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
              <span className="text-[11px] text-emerald-300 font-medium">
                {isHindi
                  ? `आपके दर्ज किए गए रिकॉर्ड "${matchedExpectedCall.organization}" से मेल खाता है`
                  : `Correlates with your expected entry: "${matchedExpectedCall.organization}"`}
              </span>
            </div>
          )}
        </div>

        {/* Security Principle Note */}
        <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>
            {isHindi
              ? 'नोट: उत्तर न देने पर "अज्ञात" माना जाएगा, स्वीकृत नहीं। कॉल-गार्ड किसी भी परिस्थिति में OTP या पासवर्ड मांगने पर कॉल ब्लॉक करेगा।'
              : 'Principle: No response means UNKNOWN, not YES. Even if expected, CallGuard will actively shield credentials.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onRespond('EXPECTED')}
            className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isHindi ? 'हाँ, अपेक्षित है' : 'Yes, Expected'}</span>
          </button>

          <button
            onClick={() => onRespond('UNEXPECTED')}
            className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>{isHindi ? 'नहीं, अनपेक्षित' : 'No, Unexpected'}</span>
          </button>

          <button
            onClick={() => onRespond('NOT_SURE')}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>{isHindi ? 'पक्का नहीं' : 'Not Sure'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
