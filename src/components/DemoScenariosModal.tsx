import React from 'react';
import { Sparkles, Play, X, User } from 'lucide-react';
import { DemoScenario, LanguageOption } from '../types';
import { SIMULATION_SCENARIOS } from '../services/scenarios';

interface DemoScenariosModalProps {
  isOpen: boolean;
  language?: LanguageOption;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({
  isOpen,
  language = 'en',
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const isHindi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2 flex-shrink-0">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {isHindi ? 'सिमुलेशन परिदृश्य चुनें (Simulation Persona)' : 'Select Simulation Scenario'}
            </h3>
            <p className="text-xs text-slate-400">
              {isHindi
                ? 'समान जेमिनी रिस्क इंजन के तहत बहु-चरणीय हिंदी/अंग्रेजी कॉल सिमुलेशन चलाएं।'
                : 'Run automated, multi-turn call simulations through the exact same Gemini threat engine used by Live Mode.'}
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-4 overflow-y-auto flex-1 pr-1">
          {SIMULATION_SCENARIOS.map((scen) => {
            const isHigh = scen.riskExpectation === 'HIGH';
            const turns =
              isHindi && scen.simulatedTurnsHindi ? scen.simulatedTurnsHindi : scen.simulatedTurns;
            const title = isHindi && scen.titleHindi ? scen.titleHindi : scen.title;
            const callerIdentity =
              isHindi && scen.callerIdentityHindi ? scen.callerIdentityHindi : scen.callerIdentity;
            const description =
              isHindi && scen.descriptionHindi ? scen.descriptionHindi : scen.description;

            return (
              <div
                key={scen.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">{title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isHigh
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {scen.tag} ({scen.riskExpectation} Risk)
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-300 inline-flex items-center gap-1">
                    <span>🇮🇳</span>
                    <span>{scen.callerNumber}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium mb-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isHindi ? 'कॉलर:' : 'Persona:'} {callerIdentity}</span>
                  <span>•</span>
                  <span className="text-slate-400">{scen.callerType}</span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{description}</p>

                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 mb-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                    {isHindi
                      ? `कॉलर के प्रगतिशील कथन (${turns.length} टर्न):`
                      : `Progressive Simulated Turns (${turns.length} turns):`}
                  </span>
                  <div className="space-y-1 text-xs text-slate-300 italic">
                    {turns.map((r, idx) => (
                      <p key={idx} className="truncate">
                        <span className="not-italic text-[11px] font-mono text-slate-500 font-semibold mr-1.5">
                          T{idx + 1}:
                        </span>
                        "{r}"
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      onSelectScenario(scen);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md shadow-purple-600/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'इस परिदृश्य का चयन करें' : 'Select This Scenario'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
