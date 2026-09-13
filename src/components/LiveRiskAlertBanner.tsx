import React from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  PhoneOff,
  Ban,
  Lock,
  Flame,
  Volume2,
} from 'lucide-react';

interface LiveRiskAlertBannerProps {
  score: number;
  threatType: string;
  threatDetails?: string;
  onHangUp: () => void;
  onBlockAndReport: () => void;
  language?: 'en' | 'hi';
}

export const LiveRiskAlertBanner: React.FC<LiveRiskAlertBannerProps> = ({
  score,
  threatType,
  threatDetails,
  onHangUp,
  onBlockAndReport,
  language = 'en',
}) => {
  const isHindi = language === 'hi';

  return (
    <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-5 shadow-2xl text-rose-100 space-y-4 animate-bounce-subtle ring-4 ring-rose-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white flex-shrink-0 animate-pulse shadow-lg shadow-rose-600/50">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-600/40 border border-rose-400 text-rose-200 text-[10px] font-black uppercase tracking-wider">
                {isHindi ? 'गंभीर सुरक्षा चेतावनी' : 'CRITICAL LIVE THREAT ALERT'}
              </span>
              <span className="text-xs font-mono font-black text-rose-300">
                Risk: {score}/100
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              {isHindi
                ? 'संवेदनशील डेटा या OTP की मांग पकड़ी गई!'
                : 'Sensitive Credential / OTP Request Detected!'}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 text-xs text-rose-200 space-y-1.5 leading-relaxed">
        <p className="font-bold text-white flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-rose-400" />
          {threatType || 'High-Risk Credential Solicitation'}
        </p>
        <p className="text-[11px] text-rose-200/90">
          {threatDetails ||
            (isHindi
              ? 'कॉल-गार्ड सुरक्षा नीति: बैंक या वैध संगठन फोन कॉल पर कभी भी आपका OTP, पासवर्ड या पिन नहीं मांगते। किसी भी कोड को साझा न करें!'
              : 'CallGuard Security Policy: Official institutions never ask for OTPs, PINs, or passwords over the phone. Do NOT share your verification code!')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
        <button
          onClick={onHangUp}
          className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{isHindi ? 'तुरंत कॉल काटें (Hang Up)' : 'Hang Up Immediately'}</span>
        </button>

        <button
          onClick={onBlockAndReport}
          className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Ban className="w-4 h-4 text-rose-400" />
          <span>{isHindi ? 'नंबर ब्लॉक व रिपोर्ट करें' : 'Block & Report Number'}</span>
        </button>
      </div>
    </div>
  );
};
