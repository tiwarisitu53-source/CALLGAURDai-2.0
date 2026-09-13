import React from 'react';
import { Activity, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RiskTimelinePoint } from '../types';

interface DynamicRiskTimelineProps {
  points: RiskTimelinePoint[];
  currentScore: number;
  language?: 'en' | 'hi';
}

export const DynamicRiskTimeline: React.FC<DynamicRiskTimelineProps> = ({
  points,
  currentScore,
  language = 'en',
}) => {
  const isHindi = language === 'hi';
  const validPoints = Array.isArray(points) ? points : [];

  if (validPoints.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 71) return 'text-rose-400 border-rose-500 bg-rose-500/10';
    if (score >= 31) return 'text-amber-400 border-amber-500 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500 bg-emerald-500/10';
  };

  const getBadgeColor = (level: string) => {
    if (level === 'HIGH') return 'bg-rose-500 text-white';
    if (level === 'MEDIUM') return 'bg-amber-500 text-slate-900';
    return 'bg-emerald-500 text-white';
  };

  const progressionChain = validPoints.map((p) => p.score).join(' → ');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {isHindi ? 'डायनामिक रिस्क टाइमलाइन' : 'Dynamic Risk Evolution'}
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {validPoints.length > 1 && (
            <span className="text-[11px] font-mono text-cyan-400 bg-slate-950 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              {progressionChain}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-md font-black border ${getScoreColor(currentScore)}`}>
            {currentScore}/100
          </span>
        </div>
      </div>

      {/* Visual Timeline Bar / Points */}
      <div className="relative pt-2 pb-1">
        {/* Connection line */}
        <div className="absolute top-6 left-4 right-4 h-0.5 bg-slate-800 -z-0" />

        <div className="grid grid-flow-col auto-cols-fr gap-2 relative z-10">
          {validPoints.map((pt, idx) => {
            const isLatest = idx === validPoints.length - 1;
            const isHigh = pt.score >= 71;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isLatest
                    ? isHigh
                      ? 'bg-rose-950/40 border border-rose-500/50 scale-105 shadow-md shadow-rose-950'
                      : 'bg-slate-800/80 border border-indigo-500/40 shadow-sm'
                    : 'bg-slate-950/60 border border-slate-800/80'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black border-2 mb-1.5 ${
                    isHigh
                      ? 'border-rose-500 bg-rose-600 text-white animate-pulse'
                      : pt.score >= 31
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-emerald-500 bg-emerald-600 text-white'
                  }`}
                >
                  {pt.score}
                </div>

                <span className="text-[10px] font-bold text-slate-300 truncate w-full">
                  Turn {pt.turn}
                </span>

                <span className="text-[9px] text-slate-400 truncate w-full mt-0.5" title={pt.reason}>
                  {pt.triggerEvent || (pt.score >= 71 ? 'Threat' : pt.score >= 31 ? 'Investigate' : 'Context OK')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-500">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          {isHindi ? 'प्रत्येक बातचीत पर रिस्क का पुनर्मूल्यांकन' : 'Continuous per-turn risk re-assessment'}
        </span>
        <span className="text-[10px] text-slate-400">
          {validPoints.length} {isHindi ? 'चरण रिकॉर्डेड' : 'stages recorded'}
        </span>
      </div>
    </div>
  );
};
