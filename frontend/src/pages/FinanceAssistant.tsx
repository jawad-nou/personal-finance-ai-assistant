import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  Check,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import {
  approveFinanceBudgetDraft,
  askFinanceAssistant,
  AssistantEvidence,
  AssistantFact,
  BudgetDraft,
} from '../services/financeAssistantService';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  evidence?: string[];
  verifiedFacts?: AssistantFact[];
  toolsUsed?: AssistantEvidence[];
  pendingAction?: BudgetDraft;
  actionStatus?: 'approved' | 'dismissed';
  actionMessage?: string;
}

const currentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
};

const monthName = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

const formatAmount = (amount: number | null) =>
  amount === null ? 'Not set' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const suggestions = [
  'Why did I overspend this month?',
  'Compare my spending with last month.',
  'Can I afford a $150 purchase this month?',
  'Draft a savings plan for my Emergency Fund.',
];

const FinanceAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I can help you understand your spending, compare months, check budgets, and plan toward a savings goal. What would you like to look at?',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const submitQuestion = async (rawQuestion: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', content: trimmed };
    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setError('');
    setSending(true);

    try {
      const reply = await askFinanceAssistant(trimmed);
      setMessages((current) => [...current, {
        id: reply.requestId,
        role: 'assistant',
        content: reply.answer,
        evidence: reply.evidence,
        verifiedFacts: reply.verifiedFacts,
        toolsUsed: reply.toolsUsed,
        pendingAction: reply.pendingAction,
      }]);
    } catch (requestError: any) {
      const message = requestError.response?.data?.message || 'The assistant could not reach your finance data. Please try again.';
      setMessages((current) => [...current, {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: message,
      }]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion(question);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(question);
    }
  };

  const approveDraft = async (message: ChatMessage) => {
    if (!message.pendingAction || approvingId) return;
    setApprovingId(message.id);
    setError('');
    try {
      const result = await approveFinanceBudgetDraft(message.pendingAction.approvalToken);
      const status = result.alreadyApplied ? 'This budget change was already applied.' : 'Approved. Your budget has been updated.';
      setMessages((current) => current.map((item) => item.id === message.id
        ? { ...item, pendingAction: undefined, actionStatus: 'approved', actionMessage: status }
        : item));
    } catch (requestError: any) {
      const messageText = requestError.response?.data?.message || 'This change could not be applied. Ask for a fresh proposal.';
      setMessages((current) => current.map((item) => item.id === message.id
        ? { ...item, actionMessage: messageText }
        : item));
    } finally {
      setApprovingId(null);
    }
  };

  const dismissDraft = (messageId: string) => {
    setMessages((current) => current.map((item) => item.id === messageId
      ? { ...item, pendingAction: undefined, actionStatus: 'dismissed', actionMessage: 'Draft dismissed. No budget was changed.' }
      : item));
  };

  return (
    <main className="mx-auto flex h-full max-w-6xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Personal Finance Assistant
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Make sense of your money</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Ask about your expenses, budgets, income, or savings goals. The assistant reads your account through fixed finance tools.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 sm:self-auto">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Budget changes need your approval
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Your money, explained</p>
              <p className="text-xs text-gray-500">Using your records for {monthName(currentMonth())}</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Account tools ready
            </span>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50/70 px-4 py-5 sm:px-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-gray-200">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[88%] space-y-3 ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user'
                    ? 'rounded-tr-md bg-blue-700 text-white'
                    : 'rounded-tl-md border border-gray-200 bg-white text-gray-800'}`}>
                    {message.content}
                  </div>

                  {message.role === 'assistant' && !!message.verifiedFacts?.length && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {message.verifiedFacts.map((fact) => (
                        <div key={`${message.id}-${fact.label}`} className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
                          <p className="text-[11px] font-medium leading-4 text-blue-700">{fact.label}</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900">{fact.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.role === 'assistant' && !!message.evidence?.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.evidence.map((source) => (
                        <span key={`${message.id}-${source}`} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600">
                          <CircleDollarSign className="h-3 w-3 text-emerald-600" />
                          {source}
                        </span>
                      ))}
                    </div>
                  )}

                  {message.pendingAction && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 rounded-lg bg-white p-2 text-amber-700">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">Review budget change</p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">
                            {message.pendingAction.category} · {monthName(message.pendingAction.month)}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-white/80 px-3 py-2">
                              <p className="text-gray-500">Current</p>
                              <p className="mt-0.5 font-semibold text-gray-900">{formatAmount(message.pendingAction.currentAmount)}</p>
                            </div>
                            <div className="rounded-lg bg-white/80 px-3 py-2">
                              <p className="text-gray-500">Proposed</p>
                              <p className="mt-0.5 font-semibold text-gray-900">{formatAmount(message.pendingAction.proposedAmount)}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-gray-500">This draft expires in 15 minutes and will not be saved unless you approve it.</p>
                          {message.actionMessage && <p className="mt-2 text-xs font-medium text-amber-900">{message.actionMessage}</p>}
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void approveDraft(message)}
                              disabled={approvingId === message.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                            >
                              {approvingId === message.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Approve change
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissDraft(message.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {message.actionStatus && (
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${message.actionStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {message.actionStatus === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {message.actionMessage}
                    </div>
                  )}
                  {message.actionMessage && !message.pendingAction && !message.actionStatus && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{message.actionMessage}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-gray-200">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                  Checking your finance records…
                </div>
              </div>
            )}
            <div ref={endOfMessages} />
          </div>

          <div className="border-t border-gray-100 bg-white p-4 sm:px-6">
            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
            <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={onInputKeyDown}
                disabled={sending}
                rows={1}
                maxLength={1200}
                placeholder="Ask about your spending, budget, or savings goal…"
                className="max-h-32 min-h-10 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!question.trim() || sending}
                aria-label="Send question"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-2 text-[10px] leading-4 text-gray-400">Enter to send · Shift + Enter for a new line · Advice is based on recorded data and may not include upcoming bills.</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles className="h-4 w-4 text-blue-700" />
              Try asking
            </div>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  disabled={sending}
                  onClick={() => void submitQuestion(suggestion)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-left text-xs leading-5 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ShieldCheck className="h-4 w-4 text-blue-700" />
              How it handles your data
            </div>
            <ul className="mt-3 space-y-2.5 text-xs leading-5 text-gray-600">
              <li>Account data is read through fixed, signed-in-user tools.</li>
              <li>The model cannot run SQL or edit a budget.</li>
              <li>A separate approval is required before a drafted budget change is saved.</li>
              <li>Questions and needed account summaries are sent to the model provider configured by the app owner.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default FinanceAssistant;
