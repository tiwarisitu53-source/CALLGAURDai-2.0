import React from 'react';
import {
  Languages,
  Mic,
  Cpu,
  Volume2,
  Shield,
  Trash2,
  CheckCircle2,
  Sliders,
  BellRing,
} from 'lucide-react';
import { useCallGuard } from '../../context/CallGuardContext';

export const SettingsTab: React.FC = () => {
  const {
    language,
    setLanguage,
    screeningMode,
    setScreeningMode,
    isMuted,
    toggleMute,
    autoListen,
    setAutoListen,
    gnaniConfigured,
    clearSessions,
  } = useCallGuard();

  const isHi = language === 'hi';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl font-black text-white tracking-tight">
          {isHi ? 'कॉल-गार्ड सुरक्षा सेटिंग्स' : 'CallGuard Defense Preferences'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isHi
            ? 'अपनी कॉल स्क्रीनिंग भाषा, वॉयस इंजन और ऑटो-प्रोटेक्शन वरीयताओं को अनुकूलित करें'
            : 'Customize your autonomous call screening language, voice synthesis, and safety thresholds'}
        </p>
      </div>

      {/* Settings Sections */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Language Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isHi ? 'डिफ़ॉल्ट स्क्रीनिंग भाषा' : 'Default Screening Language'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'AI असिस्टेंट इसी भाषा में कॉलर से बात करेगा और सुनेगा'
                  : 'CallGuard assistant will greet and converse in this language'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिंदी (Hinglish)
            </button>
          </div>
        </div>

        {/* Screening Mode Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isHi ? 'डिफ़ॉल्ट स्क्रीनिंग मोड' : 'Primary Call Interaction Mode'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'लाइव माइक्रोफ़ोन वॉयस या ऑटोमेटेड फ्रॉड सिमुलेशन'
                  : 'Interactive microphone speech recognition vs automated persona simulator'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setScreeningMode('LIVE')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                screeningMode === 'LIVE'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Live Mic Mode</span>
            </button>
            <button
              onClick={() => setScreeningMode('SIMULATION')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                screeningMode === 'SIMULATION'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Simulation</span>
            </button>
          </div>
        </div>

        {/* Voice Synthesis Engine */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isHi ? 'वॉयस सिंथेसिस इंजन' : 'Voice Synthesis Provider'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {gnaniConfigured
                  ? isHi
                    ? 'Gnani.ai भारतीय भाषा वॉयस इंजन सक्रिय है'
                    : 'Gnani.ai Indian Multilingual Voice is configured & active'
                  : isHi
                  ? 'ब्राउज़र वेब स्पीच API (स्टैंडर्ड)'
                  : 'Native Browser Web Speech API fallback active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                gnaniConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
              }`}
            >
              {gnaniConfigured ? 'Gnani.ai Active' : 'Web Speech API'}
            </span>
          </div>
        </div>

        {/* Auto Listen in Live Mode */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isHi ? 'ऑटो-लिसन (लाइव मोड में स्वतः सुनना)' : 'Continuous Auto-Listen'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isHi
                ? 'AI के बोलने के बाद माइक्रोफ़ोन को स्वतः चालू रखें'
                : 'Automatically resume microphone listening after AI finishes speaking'}
            </p>
          </div>

          <button
            onClick={() => setAutoListen(!autoListen)}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
              autoListen ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoListen ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* AI Audio Mute */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isHi ? 'AI वॉयस म्यूट' : 'Mute AI Voice Output'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isHi
                ? 'कॉल स्क्रीनिंग के दौरान ऑडियो म्यूट रखें (केवल टेक्स्ट)'
                : 'Disable audible speech synthesis during screening (silent text mode)'}
            </p>
          </div>

          <button
            onClick={toggleMute}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
              isMuted ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isMuted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Clear Data */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div>
            <h3 className="text-sm font-bold text-rose-400">
              {isHi ? 'स्थानीय कॉल इतिहास साफ़ करें' : 'Erase Screening History'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi
                ? 'ब्राउज़र में सहेजे गए सभी स्क्रीनिंग सत्रों को स्थायी रूप से हटा दें'
                : 'Permanently remove all local session transcripts and logs from this browser'}
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm(isHi ? 'क्या आप सारा कॉल इतिहास हटाना चाहते हैं?' : 'Erase all saved call sessions?')) {
                clearSessions();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isHi ? 'डेटा हटाएं' : 'Erase History'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
