import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  PhoneOff,
  PhoneForwarded,
  Clock,
  Trash2,
  ChevronRight,
  Filter,
  FileText,
  Activity,
  Mic,
  Cpu,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { ScreeningSession, RiskLevel, ScreeningMode } from '../types';

interface DashboardProps {
  sessions: ScreeningSession[];
  onClearSessions: () => void;
  onStartNewCall: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions = [],
  onClearSessions,
  onStartNewCall,
}) => {
  const [selectedSession, setSelectedSession] = useState<ScreeningSession | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | RiskLevel>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | ScreeningMode>('ALL');

  const safeSessions = Array.isArray(sessions) ? sessions : [];

  // Stats calculations
  const total = safeSessions.length;
  const liveCount = safeSessions.filter((s) => s.mode === 'LIVE').length;
  const simCount = safeSessions.filter((s) => s.mode === 'SIMULATION').length;
  const lowRisk = safeSessions.filter((s) => s.finalRiskLevel === 'LOW').length;
  const medRisk = safeSessions.filter((s) => s.finalRiskLevel === 'MEDIUM').length;
  const highRisk = safeSessions.filter((s) => s.finalRiskLevel === 'HIGH').length;
  const blocked = safeSessions.filter((s) => s.finalAction === 'BLOCKED').length;
  const connected = safeSessions.filter((s) => s.finalAction === 'CONNECTED').length;

  const filteredSessions = safeSessions.filter((s) => {
    const levelMatch = filterLevel === 'ALL' || s.finalRiskLevel === filterLevel;
    const modeMatch = filterMode === 'ALL' || s.mode === filterMode;
    return levelMatch && modeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium block">Total Screened</span>
          <span className="text-2xl font-black font-mono text-slate-100 mt-1 block">{total}</span>
          <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-cyan-400">{liveCount} Live</span> • <span className="text-purple-400">{simCount} Sim</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-emerald-400 font-medium block">Low Risk</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{lowRisk}</span>
          <span className="text-[11px] text-slate-500 mt-1">Score ≤ 30</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-amber-400 font-medium block">Medium Risk</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{medRisk}</span>
          <span className="text-[11px] text-slate-500 mt-1">Score 31–70</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-rose-400 font-medium block">High Risk</span>
          <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">{highRisk}</span>
          <span className="text-[11px] text-slate-500 mt-1">Score ≥ 71</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-rose-300 font-medium block flex items-center gap-1">
            <PhoneOff className="w-3 h-3 text-rose-400" /> Blocked
          </span>
          <span className="text-2xl font-black font-mono text-slate-100 mt-1 block">{blocked}</span>
          <span className="text-[11px] text-slate-500 mt-1">
            {total > 0 ? `${Math.round((blocked / total) * 100)}% block rate` : '0%'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-emerald-300 font-medium block flex items-center gap-1">
            <PhoneForwarded className="w-3 h-3 text-emerald-400" /> Connected
          </span>
          <span className="text-2xl font-black font-mono text-slate-100 mt-1 block">{connected}</span>
          <span className="text-[11px] text-slate-500 mt-1">Safe callers</span>
        </div>
      </div>

      {/* Sessions Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Screening History</h3>
            <p className="text-xs text-slate-400">
              Audit log of live voice calls, automated simulations, threat assessments, and actions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Filter */}
            <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
              {(['ALL', 'LIVE', 'SIMULATION'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMode(m)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === m
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'ALL' ? 'All Modes' : m === 'LIVE' ? 'Live Calls' : 'Simulations'}
                </button>
              ))}
            </div>

            {/* Risk Level Filter */}
            <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterLevel === lvl
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {safeSessions.length > 0 && (
              <button
                onClick={onClearSessions}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No screening logs match criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Start a Live Voice Screening or run an automated Simulation scenario to analyze calls in real time.
            </p>
            <button
              onClick={onStartNewCall}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Start New Screening
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSessions.map((session) => {
              const isHigh = session.finalRiskLevel === 'HIGH';
              const isMed = session.finalRiskLevel === 'MEDIUM';

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start md:items-center gap-3">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        session.finalAction === 'BLOCKED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {session.finalAction === 'BLOCKED' ? (
                        <PhoneOff className="w-5 h-5" />
                      ) : (
                        <PhoneForwarded className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-200">{session.callerName}</span>
                        <span className="text-xs text-slate-400 font-mono inline-flex items-center gap-1">
                          <span>🇮🇳</span>
                          <span>{session.callerNumber}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            session.mode === 'LIVE'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {session.mode === 'LIVE' ? 'LIVE' : 'SIMULATION'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            session.finalAction === 'BLOCKED'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {session.finalAction}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
                          {session.language === 'hi' ? 'हिंदी' : 'English'}
                        </span>

                        {session.matchedExpectedCall && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>Expected: {session.matchedExpectedCall.organization}</span>
                          </span>
                        )}

                        {session.userVerification && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              session.userVerification === 'EXPECTED'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : session.userVerification === 'UNEXPECTED'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            User: {session.userVerification}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-medium mt-1">
                        {session.scenarioTitle ? `Scenario: ${session.scenarioTitle} • ` : ''}
                        {session.intent || 'Unspecified caller intent'}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.timestamp}
                        </span>
                        <span>•</span>
                        <span>{session.durationSeconds}s duration</span>
                        {(session.signals || []).length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-xs">
                              Signals: {(session.signals || []).join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/80">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Risk Score</span>
                      <span
                        className={`text-lg font-black font-mono ${
                          isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {session.finalRiskScore} / 100
                      </span>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">Screening Transcript Record</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      selectedSession.mode === 'LIVE'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {selectedSession.mode === 'LIVE' ? 'Live Call' : 'Simulation'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>{selectedSession.timestamp}</span>
                  <span>•</span>
                  <span>{selectedSession.callerName}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-300 inline-flex items-center gap-1">
                    <span>🇮🇳</span>
                    <span>{selectedSession.callerNumber}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block">Assessment</span>
                  <span className="font-bold text-slate-200 text-sm">
                    {selectedSession.finalRiskLevel} RISK ({selectedSession.finalRiskScore}/100)
                  </span>
                  {selectedSession.peakRiskScore !== undefined && selectedSession.peakRiskScore !== selectedSession.finalRiskScore && (
                    <span className="text-[10px] text-rose-400 block font-mono">
                      Peak reached: {selectedSession.peakRiskScore}/100
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block">Language</span>
                  <span className="font-semibold text-slate-300 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 mt-0.5 inline-block">
                    {selectedSession.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Action Taken</span>
                  <span
                    className={`font-bold text-sm ${
                      selectedSession.finalAction === 'BLOCKED' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedSession.finalAction}
                  </span>
                </div>
              </div>

              {/* Context Match & Verification Breakdown */}
              {(selectedSession.matchedExpectedCall || selectedSession.userVerification) && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Context & Verification
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSession.matchedExpectedCall && (
                      <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
                        <span className="text-[10px] text-indigo-300 block font-semibold">Matched Expected Call:</span>
                        <span className="text-slate-100 font-bold">{selectedSession.matchedExpectedCall.organization}</span>
                        <span className="text-[10px] text-slate-400 block">{selectedSession.matchedExpectedCall.reason}</span>
                      </div>
                    )}
                    {selectedSession.userVerification && (
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">User Verification Prompt:</span>
                        <span className="text-slate-100 font-bold">
                          {selectedSession.userVerification === 'EXPECTED'
                            ? '✓ Confirmed Expected by user'
                            : selectedSession.userVerification === 'UNEXPECTED'
                            ? '✗ Reported Unexpected by user'
                            : 'Unavailable / No Response (Treated as Unknown)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Risk Timeline if recorded */}
              {selectedSession.riskTimeline && selectedSession.riskTimeline.length > 0 && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Risk Evolution Across Turns
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {selectedSession.riskTimeline.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center p-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 min-w-[70px] text-center"
                      >
                        <span
                          className={`text-xs font-mono font-black ${
                            pt.score >= 71 ? 'text-rose-400' : pt.score >= 31 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {pt.score}/100
                        </span>
                        <span className="text-[9px] text-slate-400">Turn {pt.turn}</span>
                        <span className="text-[8px] text-slate-500 truncate max-w-[65px]">{pt.triggerEvent || 'Signal'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSession.scenarioTitle && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-400 block font-semibold mb-1">Simulated Scenario:</span>
                  <p className="text-slate-200">{selectedSession.scenarioTitle}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Detected Intent
                </span>
                <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {selectedSession.intent}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Explanation & Threat Rationale
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {selectedSession.explanation}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Conversation Transcript
                </span>
                <div className="space-y-2.5">
                  {(selectedSession.transcript || []).map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs border ${
                        t.sender === 'ai'
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-indigo-950/50 border-indigo-500/20 text-indigo-100'
                      }`}
                    >
                      <div className="flex justify-between font-bold mb-1 text-[11px] text-slate-400">
                        <span>{t.sender === 'ai' ? 'CallGuard Screening Assistant' : 'Caller'}</span>
                        <span>{t.time}</span>
                      </div>
                      <p>{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 mt-4 text-right">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
