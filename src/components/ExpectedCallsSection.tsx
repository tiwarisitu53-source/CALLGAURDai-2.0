import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  PhoneCall,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  Play,
  ExternalLink,
  Tag,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ExpectedCall, ExpectedCallCategory } from '../types';
import { getExpectedCalls, saveExpectedCall, deleteExpectedCall } from '../services/expectedCalls';

interface ExpectedCallsSectionProps {
  expectedCalls?: ExpectedCall[];
  onAddExpectedCall?: (item: Omit<ExpectedCall, 'id' | 'createdAt'>) => void;
  onDeleteExpectedCall?: (id: string) => void;
  onSimulateCall?: (expectedCall: ExpectedCall) => void;
  onStartSimulationForExpectedCall?: (expectedCall: ExpectedCall) => void;
  language?: 'en' | 'hi';
}

const CATEGORIES: ExpectedCallCategory[] = [
  'Banking',
  'Job / Internship',
  'Delivery',
  'Healthcare',
  'Travel',
  'Education',
  'Service',
  'Personal',
  'Other',
];

export const ExpectedCallsSection: React.FC<ExpectedCallsSectionProps> = ({
  expectedCalls: propCalls,
  onAddExpectedCall,
  onDeleteExpectedCall,
  onSimulateCall,
  onStartSimulationForExpectedCall,
  language = 'en',
}) => {
  const [internalCalls, setInternalCalls] = useState<ExpectedCall[]>(() => {
    try {
      return getExpectedCalls() || [];
    } catch {
      return [];
    }
  });

  const expectedCalls = Array.isArray(propCalls) ? propCalls : internalCalls;
  const safeCallsList = Array.isArray(expectedCalls) ? expectedCalls : [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [organization, setOrganization] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<ExpectedCallCategory>('Banking');
  const [expectedContact, setExpectedContact] = useState('Phone call');
  const [referenceUrlOrId, setReferenceUrlOrId] = useState('');
  const [dateSubmitted, setDateSubmitted] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const isHindi = language === 'hi';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.trim() || !reason.trim()) return;

    const newCallData = {
      organization: organization.trim(),
      reason: reason.trim(),
      category,
      expectedContact: expectedContact.trim() || 'Phone call',
      referenceUrlOrId: referenceUrlOrId.trim() || undefined,
      dateSubmitted: dateSubmitted.trim() || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
    };

    if (onAddExpectedCall) {
      onAddExpectedCall(newCallData);
    }
    const updated = saveExpectedCall(newCallData);
    setInternalCalls(updated);

    setOrganization('');
    setReason('');
    setReferenceUrlOrId('');
    setDateSubmitted('');
    setAdditionalNotes('');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (onDeleteExpectedCall) {
      onDeleteExpectedCall(id);
    }
    const updated = deleteExpectedCall(id);
    setInternalCalls(updated);
  };

  const handleSimulate = (call: ExpectedCall) => {
    if (onStartSimulationForExpectedCall) {
      onStartSimulationForExpectedCall(call);
    } else if (onSimulateCall) {
      onSimulateCall(call);
    }
  };

  const getCategoryColor = (cat: ExpectedCallCategory) => {
    switch (cat) {
      case 'Banking':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Job / Internship':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'Delivery':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'Healthcare':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'Travel':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight">
                {isHindi ? 'अपेक्षित कॉल (Expected Calls)' : 'Expected Calls Registry'}
              </h2>
              <p className="text-xs text-slate-400">
                {isHindi
                  ? 'कॉल-गार्ड को बताएं कि आप किन संस्थानों या व्यक्तियों से कॉल की अपेक्षा कर रहे हैं'
                  : 'Voluntarily provide context to help CallGuard correlate incoming calls with expected interactions'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isHindi ? '+ नया अपेक्षित कॉल जोड़ें' : '+ Register Expected Call'}</span>
        </button>
      </div>

      {/* Critical Security Disclaimer Banner */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 flex items-start gap-3 shadow-md">
        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-[11px] leading-relaxed">
          <span className="font-bold text-amber-300 block text-xs uppercase tracking-wide">
            {isHindi ? 'सुरक्षा सिद्धांत और सीमाएं (Security Principle)' : 'Supporting Signal Notice'}
          </span>
          <p>
            {isHindi
              ? 'अपेक्षित-कॉल जानकारी केवल एक सहायक संकेत (Supporting Signal) है। यह किसी कॉलर के वैध होने का पक्का प्रमाण नहीं है। यदि कोई कॉलर अपेक्षित बैंक का दावा करने के बाद भी OTP, पासवर्ड या रिमोट एक्सेस मांगता है, तो कॉल-गार्ड तुरंत चेतावनी देगा।'
              : 'Expected-call information is a supporting signal. It does NOT prove that a caller is legitimate. Caller identity claims are never proof of identity. If a caller matches your expected interaction but subsequently requests an OTP, password, PIN, or remote screen access, CallGuard will immediately escalate to HIGH RISK.'}
          </p>
          <p className="text-amber-400/80 font-medium pt-0.5">
            🔒 {isHindi ? 'गोपनीयता सूचना: कॉल-गार्ड कभी भी पासवर्ड, OTP, पिन या बैंक अकाउंट नंबर नहीं मांगता या स्टोर नहीं करता।' : 'Privacy Guardrail: CallGuard never stores or asks for passwords, OTPs, PINs, bank accounts, or government IDs.'}
          </p>
        </div>
      </div>

      {/* List of Registered Expected Calls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            {isHindi ? `सक्रिय अपेक्षित कॉल (${safeCallsList.length})` : `Active Expected Interactions (${safeCallsList.length})`}
          </span>
          <span className="text-[11px] text-slate-500">
            {isHindi ? 'कॉल आने पर AI द्वारा स्वतः मैच किया जाता है' : 'Automatically matched during screening'}
          </span>
        </div>

        {safeCallsList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {isHindi ? 'कोई अपेक्षित कॉल दर्ज नहीं है' : 'No expected calls registered'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isHindi
                ? 'जब आप किसी बैंक, नौकरी या डिलीवरी की प्रतीक्षा कर रहे हों, तो उसे यहाँ जोड़ें ताकि AI स्क्रीनिंग के दौरान संदर्भ समझ सके।'
                : 'When you submit a loan application, job interview, or package delivery, register it here to give CallGuard supporting context.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHindi ? 'पहला अपेक्षित कॉल जोड़ें' : 'Add First Expected Call'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeCallsList.map((call) => (
              <div
                key={call.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-100">{call.organization}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(call.category)}`}>
                          {call.category}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-indigo-300 mt-1 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        {call.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(call.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title={isHindi ? 'हटाएं' : 'Delete expected call'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                      <span>{call.expectedContact}</span>
                    </div>
                    {call.referenceUrlOrId && (
                      <div className="flex items-center gap-1.5 font-mono truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{call.referenceUrlOrId}</span>
                      </div>
                    )}
                    {call.dateSubmitted && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Submitted: {call.dateSubmitted}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Registered</span>
                    </div>
                  </div>

                  {call.additionalNotes && (
                    <p className="text-xs text-slate-400 bg-slate-950/30 p-2 rounded-lg border border-slate-800/50 italic">
                      "{call.additionalNotes}"
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {isHindi ? 'सक्रिय संदर्भ सिग्नल' : 'Active context signal'}
                  </span>

                  <button
                    onClick={() => handleSimulate(call)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Play className="w-3 h-3 text-purple-400" />
                    <span>{isHindi ? 'यह कॉल सिम्युलेट करें' : 'Simulate This Call'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expected Call Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {isHindi ? 'नया अपेक्षित कॉल जोड़ें' : 'Register Expected Call'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isHindi ? 'कॉलर सत्यापन के लिए संदर्भ दर्ज करें' : 'Provide supporting context for screening'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {isHindi ? 'संगठन / कंपनी का नाम *' : 'Organization / Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Punjab National Bank, Amazon, Google, Apollo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {isHindi ? 'कॉल का कारण / उद्देश्य *' : 'Expected Purpose / Reason *'}
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Credit card application, Job interview follow-up, Delivery confirmation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {isHindi ? 'श्रेणी (Category)' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpectedCallCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {isHindi ? 'संपर्क माध्यम' : 'Expected Contact'}
                  </label>
                  <input
                    type="text"
                    value={expectedContact}
                    onChange={(e) => setExpectedContact(e.target.value)}
                    placeholder="Phone call"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {isHindi ? 'रेफरेंस ID या URL (वैकल्पिक)' : 'Reference / App ID (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={referenceUrlOrId}
                    onChange={(e) => setReferenceUrlOrId(e.target.value)}
                    placeholder="e.g. PNB-CC-9842"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {isHindi ? 'आवेदन की तारीख (वैकल्पिक)' : 'Date Submitted (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={dateSubmitted}
                    onChange={(e) => setDateSubmitted(e.target.value)}
                    placeholder="e.g. 2 days ago, March 12"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {isHindi ? 'अतिरिक्त नोट्स (वैकल्पिक)' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Verification team might call to confirm current residential address."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Safety notice inside modal */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                🔒 Do not enter bank PINs, OTPs, or passwords. CallGuard will never request credentials.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  {isHindi ? 'सहेजें (Save)' : 'Save Expected Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
