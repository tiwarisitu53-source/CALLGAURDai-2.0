export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ScreeningAction = 'CONNECT' | 'SCREEN_FURTHER' | 'BLOCK';

export type CallStatus = 'idle' | 'incoming' | 'screening' | 'connected' | 'blocked' | 'ended';

export type VoiceState = 'idle' | 'listening' | 'analyzing' | 'speaking' | 'error';

export type ScreeningMode = 'LIVE' | 'SIMULATION';

export type LanguageOption = 'en' | 'hi';

export interface ConversationTurn {
  id: string;
  sender: 'ai' | 'caller';
  text: string;
  timestamp: string;
  riskScoreAtTurn?: number;
  detectedSignals?: string[];
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
}

export interface ScreeningSession {
  id: string;
  mode: ScreeningMode;
  language?: LanguageOption;
  callerNumber: string;
  callerName: string;
  timestamp: string;
  durationSeconds: number;
  finalRiskScore: number;
  finalRiskLevel: RiskLevel;
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
}
