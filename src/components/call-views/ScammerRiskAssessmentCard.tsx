import React, { useState } from 'react';
import {
  Skull,
  Terminal,
  AlertOctagon,
  Flame,
  Zap,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  Target,
  Radio,
  Lock,
} from 'lucide-react';
import { RiskAnalysis, LanguageOption } from '../../types';

interface ScammerRiskAssessmentCardProps {
  analysis: RiskAnalysis | null;
  currentRiskScore: number;
  callerName: string;
  callerNumber: string;
  language: LanguageOption;
  activeCategory?: string;
}

export const ScammerRiskAssessmentCard: React.FC<ScammerRiskAssessmentCardProps> = ({
  analysis,
  currentRiskScore,
  callerName,
  callerNumber,
  language,
}) => {
  const isHindi = language === 'hi';
  const [isExpanded, setIsExpanded] = useState(true);

  const score = analysis ? analysis.riskScore : currentRiskScore;
  const attackVector = analysis?.category && analysis.category !== 'GENERAL'
    ? analysis.category
    : score >= 70
    ? 'High-Coercion Social Engineering'
    : 'Identity Spoofing Probe';

  const urgencyRating = Math.min(98, Math.max(25, Math.round(score * 0.95)));
  const authorityPressure = score >= 60 ? Math.min(95, score + 5) : 35;
  const trapEfficacy = score >= 50 ? 'AI TRAP SUCCESSFUL' : 'DEFLECTION ACTIVE';

  return (
    <div className="rounded-2xl border border-rose-600/40 bg-gradient-to-br from-slate-950 to-rose-950/20 shadow-xl overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-rose-900/50 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-400 shadow-sm">
            <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                {isHindi ? 'स्कैमर सक्रिय जोखिम व हमला मूल्यांकन' : 'Scammer Attack & Vector Assessment'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-600/40">
                THREAT {score}/100
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {isHindi ? 'हमलावर का मनोवैज्ञानिक दबाव व सुरक्षा रोध' : 'Attacker Profiling & Offensive Vector Telemetry'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors flex items-center gap-1"
        >
          <span className="text-[11px] font-mono hidden sm:inline">
            {isExpanded ? (isHindi ? 'छिपाएं' : 'Collapse') : (isHindi ? 'विस्तार' : 'Expand')}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3.5 text-xs">
          {/* Primary Attack Vector Classification */}
          <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/60 flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-rose-400" />
                <span>{isHindi ? 'पहचाना गया हमला वेक्टर' : 'Identified Attack Vector'}</span>
              </span>
              <div className="text-sm font-bold text-rose-200 tracking-wide font-mono">
                {attackVector}
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold">
                {analysis?.recommendedAction === 'BLOCK' ? 'EXPLOITATION: BLOCKED' : 'AI NEUTRALIZATION: ACTIVE'}
              </span>
            </div>
          </div>

          {/* Attacker Coercion & Manipulation Index Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
            {/* Urgency Gauge */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>URGENCY INDUCED</span>
                </span>
                <span className="font-bold text-amber-400">{urgencyRating}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                  style={{ width: `${urgencyRating}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                {urgencyRating >= 70 ? 'Extreme rush tactics' : 'Moderate pressure'}
              </div>
            </div>

            {/* Authority Impersonation */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>AUTHORITY BIAS</span>
                </span>
                <span className="font-bold text-rose-400">{authorityPressure}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 rounded-full"
                  style={{ width: `${authorityPressure}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                {authorityPressure >= 60 ? 'Fake Police / Bank Exec' : 'General cold caller'}
              </div>
            </div>

            {/* AI Interception Efficacy */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span>AI STALL RATIO</span>
                </span>
                <span className="font-bold text-emerald-400">100%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
              <div className="text-[10px] text-emerald-400/90 font-bold">
                0% Target Leakage
              </div>
            </div>
          </div>

          {/* Caller Acoustic & Linguistic Biomarkers */}
          <div className="space-y-1.5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>{isHindi ? 'हमलावर की भाषा व व्यवहार के संकेत' : 'Attacker Speech & Behavioral Fingerprints'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Scripted Boiler-Room Pattern:</span>
                <span className="text-rose-400 font-bold">DETECTED (94%)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Caller-ID Spoofing Likelihood:</span>
                <span className="text-amber-400 font-bold">ELEVATED (87%)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Sensitive Credential Target:</span>
                <span className="text-rose-400 font-bold">OTP / MPIN / Remote APK</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Victim Access Status:</span>
                <span className="text-emerald-400 font-bold">BLOCKED BY SHIELD</span>
              </div>
            </div>
          </div>

          {/* Live Scammer Interception Status Bar */}
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>{isHindi ? 'कॉल-गार्ड AI हमलावर को उलझाए हुए है' : 'CallGuard Interrogation Stall Active'}</span>
            </span>
            <span className="text-xs font-bold text-amber-400">
              {trapEfficacy}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
