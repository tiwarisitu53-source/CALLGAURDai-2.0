import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  TrendingUp,
  Activity,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { RiskAnalysis, ExpectedCall, RiskTimelinePoint, UserVerificationResponse } from '../types';

interface CallSummaryModalProps {
  isOpen: boolean;
  action: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
  callerName: string;
  callerNumber: string;
  callDuration: number;
  finalAnalysis: RiskAnalysis | null;
  matchedExpectedCall?: ExpectedCall | null;
  userVerification?: UserVerificationResponse;
  riskTimeline?: RiskTimelinePoint[];
  onClose: () => void;
  onGoToDashboard: () => void;
  language?: 'en' | 'hi';
}

export const CallSummaryModal: React.FC<CallSummaryModalProps> = ({
  isOpen,
  action,
  callerName,
  callerNumber,
  callDuration,
  finalAnalysis,
  matchedExpectedCall,
  userVerification,
  riskTimeline = [],
  onClose,
  onGoToDashboard,
  language = 'en',
}) => {
  if (!isOpen) return null;

  const isHindi = language === 'hi';
  const isBlocked = action === 'BLOCKED' || (finalAnalysis?.riskScore ?? 0) >= 71;
  const timelineList = Array.isArray(riskTimeline) ? riskTimeline : [];
  const initialScore = timelineList.length > 0 ? timelineList[0].score : 5;
  const peakScore = timelineList.length > 0
    ? Math.max(...timelineList.map((p) => p.score), finalAnalysis?.riskScore || 0)
    : finalAnalysis?.riskScore || 5;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}m ${remaining}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                isBlocked
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isBlocked ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">
                {isHindi ? 'कॉल सुरक्षा सारांश (Call Summary)' : 'Monitored Call Summary'}
              </h3>
              <p className="text-xs text-slate-400">
                {callerName} ({callerNumber}) • {formatTime(callDuration)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Outcome Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isBlocked
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isBlocked ? (
              <XCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <span className="text-xs uppercase font-bold block">
                {isHindi ? 'अंतिम निर्णय' : 'Final Outcome'}
              </span>
              <span className="text-base font-black">
                {isBlocked
                  ? isHindi ? 'कॉल ब्लॉक की गई (उच्च जोखिम)' : 'Call Blocked & Shielded'
                  : isHindi ? 'कॉल सुरक्षित रूप से कनेक्ट हुई' : 'Call Connected & Verified'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Risk</span>
            <span className={`text-xl font-black ${isBlocked ? 'text-rose-400' : 'text-emerald-400'}`}>
              {peakScore}/100
            </span>
          </div>
        </div>

        {/* Context Match & Verification Summary */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">
              {isHindi ? 'अपेक्षित संदर्भ मिलान' : 'Expected Context Match'}
            </span>
            {matchedExpectedCall ? (
              <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                ✓ {matchedExpectedCall.organization}
              </span>
            ) : (
              <span className="text-slate-500">Unmatched / General</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">
              {isHindi ? 'उपयोगकर्ता सत्यापन प्रतिक्रिया' : 'User Verification Response'}
            </span>
            <span className="font-bold text-slate-200">
              {userVerification === 'EXPECTED'
                ? 'Confirmed Expected'
                : userVerification === 'UNEXPECTED'
                ? 'Reported Unexpected'
                : 'Unavailable (Unknown)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">
              {isHindi ? 'जोखिम प्रक्षेपवक्र' : 'Risk Trajectory'}
            </span>
            <span className="font-mono text-slate-300 font-bold">
              Initial: {initialScore} → Peak: {peakScore}
            </span>
          </div>
        </div>

        {/* Key Signals Detected */}
        {finalAnalysis?.signals && finalAnalysis.signals.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              {isHindi ? 'पहचाने गए मुख्य सुरक्षा संकेत' : 'Detected Security Signals'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {finalAnalysis.signals.map((sig, idx) => (
                <span
                  key={idx}
                  className={`text-[11px] px-2.5 py-1 rounded-xl font-medium border ${
                    sig.toLowerCase().includes('otp') || sig.toLowerCase().includes('theft')
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : sig.toLowerCase().includes('context') || sig.toLowerCase().includes('expected')
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {sig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Security Recommendation */}
        {finalAnalysis?.explanation && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-indigo-400 block text-[11px] uppercase">
              {isHindi ? 'सुरक्षा विश्लेषण' : 'Security Assessment'}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {finalAnalysis.explanation}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
          <button
            onClick={onGoToDashboard}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <span>{isHindi ? 'डैशबोर्ड में इतिहास देखें' : 'View in Security Dashboard'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
