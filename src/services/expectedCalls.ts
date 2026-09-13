import { ExpectedCall } from '../types';

const STORAGE_KEY = 'callguard_expected_calls';

export const DEFAULT_EXPECTED_CALLS: ExpectedCall[] = [
  {
    id: 'exp-pnb-credit-card',
    organization: 'Punjab National Bank',
    reason: 'Credit card application',
    category: 'Banking',
    expectedContact: 'Phone call',
    referenceUrlOrId: 'PNB-CC-2026-9842',
    dateSubmitted: '2 days ago',
    additionalNotes: 'Applied online via official PNB portal. Follow-up phone verification requested.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getExpectedCalls(): ExpectedCall[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPECTED_CALLS));
      return DEFAULT_EXPECTED_CALLS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPECTED_CALLS));
    return DEFAULT_EXPECTED_CALLS;
  } catch (e) {
    console.warn('Could not read expected calls from localStorage:', e);
    return DEFAULT_EXPECTED_CALLS;
  }
}

export function saveExpectedCall(item: Omit<ExpectedCall, 'id' | 'createdAt'>, existingId?: string): ExpectedCall[] {
  const current = getExpectedCalls();
  let updated: ExpectedCall[];
  if (existingId) {
    updated = current.map((c) =>
      c.id === existingId
        ? {
            ...c,
            ...item,
          }
        : c
    );
  } else {
    const newEntry: ExpectedCall = {
      ...item,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updated = [newEntry, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save expected calls:', e);
  }
  return updated;
}

export function deleteExpectedCall(id: string): ExpectedCall[] {
  const current = getExpectedCalls();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete expected call:', e);
  }
  return updated;
}

export function matchExpectedCall(
  text: string,
  callerName: string = '',
  expectedCalls: ExpectedCall[] = []
): { matched: boolean; expectedCall?: ExpectedCall; matchConfidence: 'HIGH' | 'MEDIUM' | 'NONE' } {
  if (!text && !callerName) return { matched: false, matchConfidence: 'NONE' };

  const combined = `${callerName} ${text}`.toLowerCase();

  for (const exp of expectedCalls) {
    const orgTerms = exp.organization.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const reasonTerms = exp.reason.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    // Check organization match
    const orgMatched =
      combined.includes(exp.organization.toLowerCase()) ||
      (exp.organization.toLowerCase().includes('punjab national') && (combined.includes('punjab') || combined.includes('pnb'))) ||
      orgTerms.some((term) => combined.includes(term));

    // Check reason match
    const reasonMatched =
      combined.includes(exp.reason.toLowerCase()) ||
      reasonTerms.some((term) => combined.includes(term)) ||
      (exp.reason.toLowerCase().includes('credit card') && combined.includes('card')) ||
      (exp.reason.toLowerCase().includes('application') && (combined.includes('apply') || combined.includes('application')));

    if (orgMatched && reasonMatched) {
      return { matched: true, expectedCall: exp, matchConfidence: 'HIGH' };
    }
    if (orgMatched) {
      return { matched: true, expectedCall: exp, matchConfidence: 'MEDIUM' };
    }
  }

  return { matched: false, matchConfidence: 'NONE' };
}
