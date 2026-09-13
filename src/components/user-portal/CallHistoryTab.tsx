import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  PhoneOff,
  Trash2,
  ArrowUpRight,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';
import { ScreeningSession } from '../../types';

export const CallHistoryTab: React.FC = () => {
  const {
    sessions,
    clearSessions,
    deleteSession,
    navigateToCallDetails,
    language,
    startScreening,
  } = useCallGuard();

  const isHi = language === 'hi';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BLOCKED' | 'CONNECTED' | 'DISMISSED'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      s.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.callerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.intent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.finalAction === statusFilter;

    const matchesRisk =
      riskFilter === 'ALL' || s.finalRiskLevel === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isHi ? 'कॉल इतिहास और स्क्रीनिंग लॉग्स' : 'Call Screening History'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isHi
                ? 'कॉल-गार्ड द्वारा जांची गई सभी कॉल्स का संपूर्ण विवरण'
                : 'Comprehensive record of all incoming calls screened by CallGuard AI'}
            </p>
          </div>

          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(isHi ? 'क्या आप सारा कॉल इतिहास हटाना चाहते हैं?' : 'Clear all call history?')) {
                  clearSessions();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'लॉग्स साफ़ करें' : 'Clear Logs'}</span>
            </button>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isHi ? 'कॉलर नाम, नंबर या विषय खोजें...' : 'Search caller name, number, or fraud intent...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            {(['ALL', 'BLOCKED', 'CONNECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? (isHi ? 'सभी' : 'All') : st === 'BLOCKED' ? (isHi ? 'ब्लॉक' : 'Blocked') : (isHi ? 'कनेक्ट' : 'Safe')}
              </button>
            ))}
          </div>

          {/* Risk Level Filter */}
          <div className="md:col-span-3 flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            {(['ALL', 'HIGH', 'LOW'] as const).map((rk) => (
              <button
                key={rk}
                onClick={() => setRiskFilter(rk)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  riskFilter === rk
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rk === 'ALL' ? (isHi ? 'सभी जोखिम' : 'All Risk') : rk === 'HIGH' ? (isHi ? 'उच्च जोखिम' : 'High') : (isHi ? 'कम जोखिम' : 'Low')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
          <PhoneOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">
            {isHi ? 'कोई मेल खाती कॉल नहीं मिली' : 'No Call Records Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? isHi
                ? 'अपने खोज शब्दों को बदलने का प्रयास करें।'
                : 'Try adjusting your search keywords or active filters.'
              : isHi
              ? 'अभी तक कोई कॉल स्क्रीन नहीं की गई है। एक टेस्ट कॉल शुरू करें!'
              : 'Start a live screening or run a simulation to populate call history.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => startScreening('SIMULATION')}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              {isHi ? 'टेस्ट कॉल चलाएं' : 'Simulate a Call Now'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const isBlocked = s.finalAction === 'BLOCKED' || s.finalRiskLevel === 'HIGH';
            return (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isBlocked
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isBlocked ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-400 transition-colors">
                        {s.callerName}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                        {s.callerNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.timestamp} • {formatDuration(s.durationSeconds)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">
                        {isHi ? 'उद्देश्य:' : 'Intent:'}
                      </span>{' '}
                      {s.intent}
                    </div>

                    {s.signals && s.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.signals.map((sig, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-950/60 border border-rose-500/30 text-rose-300"
                          >
                            ⚠️ {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                        isBlocked
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {s.finalAction} • {s.finalRiskScore}/100
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                      {s.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigateToCallDetails(s)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
                    >
                      <span>{isHi ? 'विवरण' : 'Details'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteSession(s.id)}
                      title={isHi ? 'हटाएं' : 'Delete'}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
