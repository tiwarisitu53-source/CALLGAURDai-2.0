import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Cpu, Radio, Sparkles } from 'lucide-react';
import { RiskAnalysis } from '../types';

interface RiskEnginePanelProps {
  analysis: RiskAnalysis | null;
  isAnalyzing: boolean;
}

export const RiskEnginePanel: React.FC<RiskEnginePanelProps> = ({ analysis, isAnalyzing }) => {
  const score = analysis ? analysis.riskScore : 5;
  const level = analysis ? analysis.riskLevel : 'LOW';
  const action = analysis ? analysis.recommendedAction : 'SCREEN_FURTHER';

  // Determine color theme based on score
  const getScoreTheme = () => {
    if (score >= 71) {
      return {
        bg: 'bg-rose-950/40',
        border: 'border-rose-500/40',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        gauge: 'text-rose-500',
        gradient: 'from-rose-500 to-red-600',
        icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      };
    }
    if (score >= 31) {
      return {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/40',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        gauge: 'text-amber-500',
        gradient: 'from-amber-500 to-orange-500',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      };
    }
    return {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      gauge: 'text-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    };
  };

  const theme = getScoreTheme();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
              REAL-TIME RISK ENGINE
            </h3>
            <p className="text-xs text-slate-400">Gemini Intent & Threat Analysis</p>
          </div>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs animate-pulse">
            <Radio className="w-3 h-3 animate-spin" />
            <span>Evaluating Turn</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Engine Active</span>
          </div>
        )}
      </div>

      {/* Primary Score Display */}
      <div className={`rounded-xl p-4 border transition-colors ${theme.bg} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessed Risk Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-extrabold tracking-tight font-mono ${theme.gauge}`}>
                {score}
              </span>
              <span className="text-slate-500 font-medium">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme.badge}`}>
              {theme.icon}
              <span>{level} RISK</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1">
              {score <= 30 ? 'Safe / Legitimate' : score <= 70 ? 'Suspicious / Incomplete' : 'Critical Threat Detected'}
            </span>
          </div>
        </div>

        {/* Progress bar meter */}
        <div className="mt-4">
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${theme.gradient}`}
              style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-0.5">
            <span>0 (Safe)</span>
            <span>30 (Low)</span>
            <span>70 (Med)</span>
            <span>100 (Critical)</span>
          </div>
        </div>
      </div>

      {/* Intent & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Detected Intent
          </span>
          <p className="text-sm font-medium text-slate-200">
            {analysis?.intent || 'Awaiting initial caller reason...'}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Call Category
          </span>
          <p className="text-sm font-medium text-indigo-300">
            {analysis?.category || 'Initial Screening'}
          </p>
        </div>
      </div>

      {/* Detected Risk Signals */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Flagged Risk & Context Signals
        </span>
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {analysis && analysis.signals && analysis.signals.length > 0 ? (
            analysis.signals.map((sig, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  score >= 71
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : score >= 31
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${score >= 71 ? 'bg-rose-400' : score >= 31 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {sig}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic py-1">
              No risk signals triggered yet
            </span>
          )}
        </div>
      </div>

      {/* Explanation & Stage Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>CallGuard Rationale</span>
          </div>
          {analysis?.conversationStage && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              Stage: {analysis.conversationStage}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {analysis?.explanation ||
            'CallGuard is listening to caller responses to determine authenticity before connecting the line.'}
        </p>

        {analysis?.unansweredQuestions && analysis.unansweredQuestions.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 block mb-1">
              Information Being Verified:
            </span>
            <div className="flex flex-wrap gap-1">
              {analysis.unansweredQuestions.map((q, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommended Action Pill */}
      <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">System Recommendation:</span>
        <div
          className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
            action === 'BLOCK'
              ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-900/30'
              : action === 'CONNECT'
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-900/30'
              : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
          }`}
        >
          {action === 'BLOCK' && <ShieldAlert className="w-3.5 h-3.5" />}
          {action === 'CONNECT' && <ShieldCheck className="w-3.5 h-3.5" />}
          {action === 'SCREEN_FURTHER' && <Shield className="w-3.5 h-3.5" />}
          <span>{action.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
};
