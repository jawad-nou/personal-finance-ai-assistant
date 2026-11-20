import api from './api';

export interface AssistantEvidence {
  name: string;
  label: string;
  arguments: Record<string, string | number>;
}

export interface AssistantFact {
  label: string;
  value: string;
}

export interface BudgetDraft {
  type: 'budget_change';
  approvalToken: string;
  category: string;
  month: string;
  currentAmount: number | null;
  proposedAmount: number;
}

export interface AssistantReply {
  requestId: string;
  answer: string;
  toolsUsed: AssistantEvidence[];
  evidence: string[];
  verifiedFacts: AssistantFact[];
  pendingAction?: BudgetDraft;
}

export const askFinanceAssistant = (question: string): Promise<AssistantReply> =>
  api.post('/assistant/message', { question }).then((response) => response.data);

export const approveFinanceBudgetDraft = (approvalToken: string) =>
  api.post('/assistant/approve-budget', { approvalToken }).then((response) => response.data);
