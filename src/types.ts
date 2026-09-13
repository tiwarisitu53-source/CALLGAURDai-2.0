export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ScreeningAction = 'CONNECT' | 'SCREEN_FURTHER' | 'BLOCK';

export type CallStatus = 'idle' | 'incoming' | 'screening' | 'connecting' | 'monitoring' | 'connected' | 'blocked' | 'ended';

export type VoiceState = 'idle' | 'listening' | 'analyzing' | 'speaking' | 'error';

export type ScreeningMode = 'LIVE' | 'SIMULATION';

export type LanguageOption = 'en' | 'hi';

export type CallViewTab = 'caller' | 'user_context' | 'split';

export type AppInterface = 'user_portal' | 'ai_scanner';

export type UserPortalTab =
  | 'overview'
  | 'expected-calls'
  | 'history'
  | 'details'
  | 'alerts'
  | 'settings';

export type ExpectedCallCategory =
  | 'Banking'
  | 'Job / Internship'
  | 'Delivery'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Service'
  | 'Personal'
  | 'Other';

export interface ExpectedCall {
  id: string;
  organization: string;
  reason: string;
  category: ExpectedCallCategory;
  expectedContact: string; // e.g. 'Phone call'
  referenceUrlOrId?: string;
  dateSubmitted?: string;
  additionalNotes?: string;
  createdAt: string;
}

export type UserVerificationResponse = 'EXPECTED' | 'UNEXPECTED' | 'NOT_SURE' | 'UNAVAILABLE';

export interface ConversationTurn {
  id: string;
  sender: 'ai' | 'caller';
  text: string;
  timestamp: string;
  riskScoreAtTurn?: number;
  detectedSignals?: string[];
}

export interface RiskTimelinePoint {
  turn: number;
  score: number;
  level: RiskLevel;
  time?: string;
  timestampSeconds?: number;
  event?: string;
  reason?: string;
  triggerEvent?: string;
  signalTriggered?: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  intent: string;
  category: string;
  signals: string[];
  explanation: string;
  recommendedAction: ScreeningAction;
  nextQuestion: string;
  responseText: string;
  responseTextHindi?: string;
  responseTextPhonetic?: string;
  isFinal: boolean;
  conversationStage?: 'INITIAL' | 'DISCOVERY' | 'VERIFICATION' | 'FINAL_DECISION';
  unansweredQuestions?: string[];
  claimedOrganization?: string;
  contextMatch?: {
    matched: boolean;
    organization?: string;
    reason?: string;
    notes?: string;
  };
}

export interface ScreeningSession {
  id: string;
  mode: ScreeningMode;
  language?: LanguageOption;
  callerNumber: string;
  callerName: string;
  claimedOrganization?: string;
  expectedContextMatch?: 'YES' | 'NO' | 'NONE';
  matchedExpectedCall?: ExpectedCall;
  userVerification?: UserVerificationResponse;
  timestamp: string;
  durationSeconds: number;
  initialRiskScore?: number;
  initialRiskLevel?: RiskLevel;
  peakRiskScore?: number;
  finalRiskScore: number;
  finalRiskLevel: RiskLevel;
  riskEvolution?: number[];
  riskTimeline?: RiskTimelinePoint[];
  monitoringStatus?: 'COMPLETED_MONITORING' | 'SCREENING_ONLY';
  intent: string;
  category: string;
  signals: string[];
  explanation: string;
  finalAction: 'BLOCKED' | 'CONNECTED' | 'DISMISSED';
  transcript: { sender: 'ai' | 'caller'; text: string; time: string }[];
  scenarioTitle?: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  titleHindi?: string;
  tag: string;
  callerType: string;
  riskExpectation: RiskLevel;
  callerIdentity: string;
  callerIdentityHindi?: string;
  callerNumber: string;
  description: string;
  descriptionHindi?: string;
  simulatedTurns: string[];
  simulatedTurnsHindi?: string[];
  expectedOrganization?: string;
  expectedReason?: string;
}
