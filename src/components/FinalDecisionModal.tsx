import React, { useEffect } from 'react';
import { ShieldAlert, ShieldCheck, RotateCcw, LayoutDashboard, X } from 'lucide-react';
import { RiskAnalysis, RiskLevel, LanguageOption } from '../types';

export interface FinalDecisionModalProps {
  isOpen?: boolean;
  finalAction?: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
  action?: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
  analysis?: RiskAnalysis | null;
  callerName?: string;
  callerNumber?: string;
  durationSeconds?: number;
  mode?: 'LIVE' | 'SIMULATION';
  language?: LanguageOption;
  scenarioTitle?: string;
  onClose?: () => void;
  onNewScreening?: () => void;
  onNewCall?: () => void;
  onViewDashboard?: () => void;
}

export const FinalDecisionModal: React.FC<FinalDecisionModalProps> = ({
  isOpen = true,
  finalAction,
  action,
  analysis,
  callerName = 'Unknown Caller',
  callerNumber = '+91 98765 43210',
  durationSeconds = 18,
  mode = 'LIVE',
  language = 'en',
  scenarioTitle,
  onClose,
  onNewScreening,
  onNewCall,
  onViewDashboard,
}) => {
  // If explicitly closed, do not render
  if (!isOpen) return null;

  const resolvedAction = finalAction || action || 'CONNECTED';
  const isHindi = language === 'hi';

  const score = analysis ? analysis.riskScore : resolvedAction === 'BLOCKED' ? 95 : 15;
  const level: RiskLevel = analysis ? analysis.riskLevel : resolvedAction === 'BLOCKED' ? 'HIGH' : 'LOW';
  const isBlocked = resolvedAction === 'BLOCKED' || level === 'HIGH';

  const formatDuration = (s: number | undefined) => {
    const validSec = typeof s === 'number' && !isNaN(s) && s >= 0 ? Math.round(s) : 15;
    const m = Math.floor(validSec / 60);
    const sec = validSec % 60;
    return `${m}m ${sec}s`;
  };

  const handleTriggerNewScreening = () => {
    if (onNewScreening) {
      onNewScreening();
    } else if (onNewCall) {
      onNewCall();
    } else if (onClose) {
      onClose();
    }
  };

  const handleTriggerViewDashboard = () => {
    if (onViewDashboard) {
      onViewDashboard();
    } else if (onClose) {
      onClose();
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors z-10"
            title={isHindi ? 'बंद करें (Close)' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top ambient glow */}
        <div
          className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isBlocked ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
        />

        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 pr-8">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isBlocked ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isHindi ? 'कॉल स्क्रीनिंग पूर्ण' : 'Call Screening Complete'}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    mode === 'LIVE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {mode === 'LIVE'
                    ? isHindi ? 'लाइव कॉल' : 'Live Call'
                    : isHindi ? 'सिम्युलेटेड कॉल' : 'Simulated Call'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                {isBlocked
                  ? isHindi ? 'धोखाधड़ी का खतरा रोका और ब्लॉक किया' : 'Threat Intercepted & Blocked'
                  : isHindi ? 'कॉलर सत्यापित और कनेक्ट किया गया' : 'Caller Verified & Connected'}
              </h2>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
            {formatDuration(durationSeconds)}
          </span>
        </div>

        {/* Big Score Card */}
        <div
          className={`rounded-2xl p-5 border mb-5 ${
            isBlocked
              ? 'bg-rose-950/40 border-rose-500/40'
              : 'bg-emerald-950/40 border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isHindi ? 'अंतिम जोखिम मूल्यांकन' : 'Final Threat Assessment'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-4xl font-black font-mono ${
                    isBlocked ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {score}
                </span>
                <span className="text-slate-500 font-medium">/ 100</span>
              </div>
            </div>

            <div
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border ${
                isBlocked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {level} {isHindi ? 'जोखिम' : 'RISK'}
            </div>
          </div>
        </div>

        {/* Caller Info & Intent */}
        <div className="space-y-3 mb-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 font-medium block">
                {isHindi ? 'कॉलर पहचान:' : 'Caller Identity:'}
              </span>
              <span className="text-slate-200 font-semibold">{callerName || (isHindi ? 'अज्ञात कॉलर' : 'Unknown Caller')}</span>
            </div>
            <span className="font-mono text-slate-300 inline-flex items-center gap-1">
              <span>🇮🇳</span>
              <span>{callerNumber || '+91 98765 43210'}</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {isHindi ? 'कॉलर का पहचाना गया उद्देश्य' : 'Detected Caller Intent'}
            </span>
            <p className="text-sm font-medium text-slate-200">
              {analysis?.intent ||
                (isBlocked
                  ? isHindi ? 'धोखाधड़ी क्रेडेंशियल अनुरोध' : 'Fraudulent Credential Request'
                  : isHindi ? 'वैध प्रोजेक्ट / सामान्य बातचीत' : 'Legitimate Project Discussion')}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {isBlocked
                ? isHindi ? 'ब्लॉक करने का कारण:' : 'Why it was Flagged & Blocked:'
                : isHindi ? 'कनेक्ट करने का कारण:' : 'Why it was Allowed:'}
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis?.explanation ||
                (isBlocked
                  ? isHindi
                    ? 'कॉलर ने संवेदनशील क्रेडेंशियल (जैसे OTP, पासवर्ड) मांगे या वित्तीय धोखाधड़ी का संदिग्ध पैटर्न दिखाया।'
                    : 'The caller requested sensitive verification credentials or impersonated a financial provider without verifiable authorization.'
                  : isHindi
                    ? 'कॉलर ने स्पष्ट और वैध कारण दिया, कोई क्रेडेंशियल या धोखाधड़ी संकेत नहीं पाए गए।'
                    : 'The caller provided coherent, consistent reasoning with zero credential or coercive signals.')}
            </p>
          </div>

          {/* Detected Signals */}
          {analysis?.signals && analysis.signals.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                {isHindi ? 'सक्रिय सुरक्षा ट्रिगर:' : 'Key Trigger Signals:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.signals.map((sig, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                      isBlocked
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-rose-400' : 'bg-emerald-400'}`}
                    />
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={handleTriggerNewScreening}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isHindi ? 'नई कॉल स्क्रीन करें' : 'New Screening'}</span>
          </button>

          <button
            onClick={handleTriggerViewDashboard}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{isHindi ? 'स्क्रीनिंग डैशबोर्ड' : 'Screening Dashboard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

