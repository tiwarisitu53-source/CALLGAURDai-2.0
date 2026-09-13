import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Send,
  Sparkles,
  PhoneForwarded,
  PhoneOff,
  PhoneCall,
  Lock,
  Building2,
  Calendar,
  AlertOctagon,
  Eye,
  Radio,
} from 'lucide-react';
import {
  RiskAnalysis,
  RiskTimelinePoint,
  LanguageOption,
  ExpectedCall,
  UserVerificationResponse,
  ScreeningAction,
} from '../../types';
import { DynamicRiskTimeline } from '../DynamicRiskTimeline';
import { LiveRiskAlertBanner } from '../LiveRiskAlertBanner';
import { CallConnectionTransition } from '../CallConnectionTransition';
import { UserRiskAssessmentCard } from './UserRiskAssessmentCard';

interface UserContextViewProps {
  currentAnalysis: RiskAnalysis | null;
  riskTimeline: RiskTimelinePoint[];
  currentRiskScore: number;
  callerName: string;
  callerNumber: string;
  language: LanguageOption;
  matchedExpectedCall?: ExpectedCall | null;
  userVerification?: UserVerificationResponse;
  onUserVerificationChange: (response: UserVerificationResponse) => void;
  onSendWhisper?: (instruction: string) => void;
  onJoinCall: () => void;
  onDeclineCall: () => void;
  onBlockAndReport: () => void;
  callStage: 'SCREENING' | 'READY_TO_CONNECT' | 'CONNECTED_MONITORING' | 'ENDED';
  liveThreatAlert?: {
    score: number;
    threatType: string;
    threatDetails?: string;
  } | null;
}

export const UserContextView: React.FC<UserContextViewProps> = ({
  currentAnalysis,
  riskTimeline,
  currentRiskScore,
  callerName,
  callerNumber,
  language,
  matchedExpectedCall,
  userVerification = 'NOT_SURE',
  onUserVerificationChange,
  onSendWhisper,
  onJoinCall,
  onDeclineCall,
  onBlockAndReport,
  callStage,
  liveThreatAlert,
}) => {
  const isHindi = language === 'hi';
  const [whisperInput, setWhisperInput] = useState('');
  const [whisperSent, setWhisperSent] = useState(false);

  const handleWhisperSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!whisperInput.trim() || !onSendWhisper) return;
    onSendWhisper(whisperInput.trim());
    setWhisperInput('');
    setWhisperSent(true);
    setTimeout(() => setWhisperSent(false), 3000);
  };

  const getVerificationStatusDetails = () => {
    switch (userVerification) {
      case 'EXPECTED':
        return {
          label: isHindi ? 'उपयोगकर्ता द्वारा अपेक्षित चिह्नित' : 'Verified as Expected Call',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          description: isHindi
            ? 'आपने पुष्टि की है कि आप इस कॉल की उम्मीद कर रहे थे। जोखिम स्तर को सुरक्षित समायोजित किया गया।'
            : 'You confirmed expecting this call. Risk weighting calibrated safely.',
        };
      case 'UNEXPECTED':
        return {
          label: isHindi ? 'अप्रत्याशित / संदेहास्पद (+25 जोखिम)' : 'Flagged as Unexpected (+25 Risk)',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          description: isHindi
            ? 'आपने इसे अनपेक्षित चिह्नित किया है। संभावित प्रतिरूपण के लिए AI ने +25 जोखिम अंक बढ़ाए हैं।'
            : 'Flagged as unexpected. CallGuard elevated risk score by +25 for potential spoofing/impersonation.',
        };
      case 'UNAVAILABLE':
        return {
          label: isHindi ? 'सत्यापन अनुत्तरित (अज्ञात माना गया)' : 'User Verification Timed Out (Unknown)',
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          description: isHindi
            ? 'कोई उपयोगकर्ता प्रतिक्रिया नहीं मिली। कॉल-गार्ड AI बिना पूर्व धारणा के कॉलर की जांच जारी रखेगा।'
            : 'No user response received. System evaluates objectively with zero assumed whitelist trust.',
        };
      default:
        return {
          label: isHindi ? 'सत्यापन लंबित (जांच जारी)' : 'Verification Pending (User Decision)',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
          description: isHindi
            ? 'कृपया नीचे पुष्टि करें कि क्या आप इस संस्था या व्यक्ति से कॉल की उम्मीद कर रहे थे।'
            : 'Please indicate below whether you were expecting a call from this organization.',
        };
    }
  };

  const statusDetails = getVerificationStatusDetails();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl overflow-y-auto p-4 space-y-4 border border-slate-800/80">
      {/* Live Threat Alert Banner if Critical */}
      {liveThreatAlert && (
        <LiveRiskAlertBanner
          score={liveThreatAlert.score}
          threatType={liveThreatAlert.threatType}
          threatDetails={liveThreatAlert.threatDetails}
          onHangUp={onDeclineCall}
          onBlockAndReport={onBlockAndReport}
          language={language}
        />
      )}

      {/* SECTION 1: Current Risk Timeline & Evolution */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isHindi ? 'वर्तमान जोखिम टाइमलाइन एवं विकास' : 'Current Risk Timeline & Evolution'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHindi ? 'प्रत्येक संवाद टर्न पर जोखिम का प्रक्षेपवक्र' : 'Turn-by-turn risk trajectory & threat triggers'}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
              currentRiskScore >= 71
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                : currentRiskScore >= 31
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
            }`}
          >
            SCORE: {currentRiskScore}/100
          </span>
        </div>

        {/* Dynamic Risk Timeline Component */}
        <DynamicRiskTimeline
          points={riskTimeline}
          currentScore={currentRiskScore}
          language={language}
        />
      </div>

      {/* SECTION 2: User Verification Status & Expected Calls Whitelist */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isHindi ? 'उपयोगकर्ता सत्यापन स्थिति (User Verification Status)' : 'User Verification Status'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isHindi ? 'अपेक्षित कॉल सूची मिलान एवं उपयोगकर्ता पुष्टि' : 'Expected call matching & explicit user confirmation'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${statusDetails.badgeClass}`}>
            {statusDetails.icon}
            <span>{statusDetails.label}</span>
          </span>
        </div>

        {/* Expected Call Cross-Reference Details Card */}
        {matchedExpectedCall ? (
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{isHindi ? 'अपेक्षित कॉल डेटाबेस से मिलान' : 'Matched Whitelisted Expected Call'}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-900/80 text-indigo-200 border border-indigo-600/40">
                {matchedExpectedCall.category}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-300">
              <div>
                <span className="text-slate-400 text-[10px] block">{isHindi ? 'संस्था / कंपनी:' : 'Expected Organization:'}</span>
                <span className="font-bold text-slate-100">{matchedExpectedCall.organization}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{isHindi ? 'कॉल का कारण:' : 'Stated Purpose:'}</span>
                <span className="font-medium text-slate-200">{matchedExpectedCall.reason}</span>
              </div>
            </div>

            {matchedExpectedCall.referenceUrlOrId && (
              <div className="text-[10px] text-slate-400 font-mono">
                Ref ID: <span className="text-cyan-400">{matchedExpectedCall.referenceUrlOrId}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{isHindi ? 'अपेक्षित कॉल सूची में कोई पूर्व प्रविष्टि नहीं मिली।' : 'No prior match in your scheduled or expected calls list.'}</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">Unscheduled Caller</span>
          </div>
        )}

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          {statusDetails.description}
        </p>

        {/* User Interactive Verification Selection Buttons */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 block">
            {isHindi ? 'अपनी पुष्टि बदलें या सेट करें:' : 'Update Your Verification Confirmation:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onUserVerificationChange('EXPECTED')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                userVerification === 'EXPECTED'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isHindi ? 'हाँ, मुझे उम्मीद थी' : 'Yes, Expected'}</span>
            </button>

            <button
              type="button"
              onClick={() => onUserVerificationChange('UNEXPECTED')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                userVerification === 'UNEXPECTED'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isHindi ? 'नहीं, संदिग्ध / अप्रत्याशित' : 'No, Unexpected (+25)'}</span>
            </button>

            <button
              type="button"
              onClick={() => onUserVerificationChange('NOT_SURE')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                userVerification === 'NOT_SURE'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? 'पक्का नहीं / जांचें' : 'Not Sure / Probe'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: User Active Risk Assessment Card */}
      <div className="space-y-1">
        <UserRiskAssessmentCard
          analysis={currentAnalysis}
          currentRiskScore={currentRiskScore}
          callerName={callerName}
          callerNumber={callerNumber}
          language={language}
          matchedExpectedCall={matchedExpectedCall}
          userVerification={userVerification}
        />
      </div>

      {/* SECTION 4: User Secret Whisper to CallGuard AI */}
      {onSendWhisper && (
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isHindi ? 'AI को गुप्त निर्देश (Secret Whisper)' : 'Private Whisper to CallGuard AI'}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {isHindi ? 'कॉलर इसे नहीं सुन सकता' : 'Caller cannot hear this instruction'}
            </span>
          </div>

          <form onSubmit={handleWhisperSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={whisperInput}
              onChange={(e) => setWhisperInput(e.target.value)}
              placeholder={
                isHindi
                  ? 'उदा. "उनसे उनका आधिकारिक कर्मचारी नंबर पूछो" या "बोलो मैं बाद में फोन करूँगा"...'
                  : 'e.g., "Ask for their official branch ID" or "Tell them I will call back directly"...'
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!whisperInput.trim()}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isHindi ? 'निर्देश भेजें' : 'Whisper'}</span>
            </button>
          </form>

          {whisperSent && (
            <p className="text-[11px] text-emerald-400 animate-in fade-in">
              ✓ {isHindi ? 'निर्देश कॉल-गार्ड AI को भेजा गया।' : 'Instruction dispatched to CallGuard AI assistant.'}
            </p>
          )}

          {/* Quick Preset Whispers */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onSendWhisper) {
                  onSendWhisper('Ask for their official employee ID and registered branch phone number.');
                  setWhisperSent(true);
                  setTimeout(() => setWhisperSent(false), 3000);
                }
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              💼 {isHindi ? 'कर्मचारी आईडी पूछें' : 'Ask Employee ID'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSendWhisper) {
                  onSendWhisper('Tell them I will visit my local branch in person.');
                  setWhisperSent(true);
                  setTimeout(() => setWhisperSent(false), 3000);
                }
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              🏦 {isHindi ? 'शाखा जाने को कहें' : 'Offer Branch Visit'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSendWhisper) {
                  onSendWhisper('Dispute this charge and refuse all remote app installations.');
                  setWhisperSent(true);
                  setTimeout(() => setWhisperSent(false), 3000);
                }
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              🛡️ {isHindi ? 'ऐप डाउनलोड से मना करें' : 'Refuse Remote App'}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: Call Connection Transition Controls */}
      <div className="pt-2">
        <CallConnectionTransition
          stage={callStage}
          riskScore={currentRiskScore}
          recommendedAction={currentAnalysis?.recommendedAction || 'SCREEN_FURTHER'}
          onJoinCall={onJoinCall}
          onDeclineCall={onDeclineCall}
          onBlockAndReport={onBlockAndReport}
          language={language}
        />
      </div>
    </div>
  );
};
