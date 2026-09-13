import React from 'react';
import {
  PhoneForwarded,
  ShieldCheck,
  Building2,
  FileCheck,
  Activity,
  PhoneOff,
  AlertCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { RiskAnalysis, ExpectedCall } from '../types';

interface CallConnectionTransitionProps {
  callerName: string;
  callerNumber: string;
  analysis: RiskAnalysis | null;
  matchedExpectedCall?: ExpectedCall | null;
  onJoinCall: () => void;
  onDeclineCall: () => void;
  language?: 'en' | 'hi';
}

export const CallConnectionTransition: React.FC<CallConnectionTransitionProps> = ({
  callerName,
  callerNumber,
  analysis,
  matchedExpectedCall,
  onJoinCall,
  onDeclineCall,
  language = 'en',
}) => {
  const isHindi = language === 'hi';
  const riskScore = analysis?.riskScore ?? 15;

  return (
    <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-2xl max-w-xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-200">
      {/* Icon and Title */}
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pulse">
          <PhoneForwarded className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          {isHindi ? 'कॉल कनेक्ट करने के लिए तैयार' : 'Ready to Connect Call'}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {isHindi ? 'उपलब्ध संकेतों के आधार पर कम जोखिम' : 'Low-risk based on available signals'}
          </span>
        </div>
      </div>

      {/* Verified Caller Summary */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-3.5 shadow-inner">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {isHindi ? 'कॉलर विवरण' : 'Incoming Caller'}
            </span>
            <span className="text-base font-bold text-slate-100">{callerName}</span>
            <span className="text-xs font-mono text-slate-400 ml-2">({callerNumber})</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {isHindi ? 'स्क्रीनिंग स्कोर' : 'Screening Score'}
            </span>
            <span className="text-lg font-black text-emerald-400">{riskScore}/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isHindi ? 'दावा किया गया संगठन' : 'Claimed Organization'}</span>
            </div>
            <p className="font-bold text-slate-200">
              {analysis?.claimedOrganization || matchedExpectedCall?.organization || 'Identified Organization'}
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isHindi ? 'सत्यापित उद्देश्य' : 'Stated Reason'}</span>
            </div>
            <p className="font-bold text-slate-200 truncate">
              {analysis?.intent || matchedExpectedCall?.reason || 'Routine inquiry'}
            </p>
          </div>
        </div>

        {matchedExpectedCall && (
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></span>
            <span className="text-indigo-200 text-[11px]">
              {isHindi
                ? `अपेक्षित कॉल मेल खाता है: "${matchedExpectedCall.organization}" - ${matchedExpectedCall.reason}`
                : `Matched expected call: "${matchedExpectedCall.organization}" (${matchedExpectedCall.reason})`}
            </span>
          </div>
        )}
      </div>

      {/* Continuous Live Monitoring Guarantee Notice */}
      <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 text-left flex items-start gap-3 text-xs text-blue-200 shadow-md">
        <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 flex-shrink-0 mt-0.5">
          <Eye className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-[11px] leading-relaxed">
          <span className="font-bold text-blue-300 block text-xs uppercase tracking-wide">
            {isHindi ? 'सतत लाइव निगरानी सक्रिय रहेगी' : 'Continuous Live Monitoring Active'}
          </span>
          <p>
            {isHindi
              ? 'कॉल कनेक्ट होने के बाद भी कॉल-गार्ड बातचीत की निगरानी जारी रखेगा। यदि कॉलर बाद में कोई OTP, पासवर्ड या वित्तीय जानकारी मांगता है, तो आपको तुरंत लाइव अलर्ट मिलेगा।'
              : 'CallGuard remains active during the connected call. If the caller subsequently requests an OTP, password, PIN, or payment, CallGuard will display an instant high-risk warning.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onJoinCall}
          className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition-all"
        >
          <PhoneForwarded className="w-4 h-4" />
          <span>{isHindi ? 'लाइव सुरक्षा के साथ कॉल शुरू करें' : 'Join Call with Live Shield'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onDeclineCall}
          className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
        >
          <PhoneOff className="w-4 h-4 text-slate-400" />
          <span>{isHindi ? 'कॉल अस्वीकार करें' : 'Decline / Hang Up'}</span>
        </button>
      </div>
    </div>
  );
};
