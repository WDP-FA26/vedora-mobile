import { router } from 'expo-router';
import { createContext, use, useMemo, useRef, useState, type ReactNode } from 'react';

import { createClientMessageId } from '@/features/messaging/utils/messaging';
import { ApiError } from '@/shared/api/api-error';
import { aiQuotaMessage } from '@/shared/api/ai-quota';
import { useSessionStore } from '@/shared/stores/session-store';

import { askMealPlanner, discardPlannerDraft, getMealPlan, getPlannerThread, savePlannerStatuses } from '../services/meal-plan.service';
import { type PlannerThread, type Weekday, type MealSection } from '../types/meal-plan.schema';
import { changedDayInputs, dayLabels, displayDays, sectionLabels } from '../utils/meal-plan';
import { isPlanningWeekend, planningWeeks } from '../utils/meal-week';
import { latestProposalIds, plannerProposals, type PlannerProposal } from '../utils/planner-proposals';
import { useDietaryRestrictions, useLatestPlannerThread, useMealPlan, useSaveMealDays } from './use-meal-plan';

export type Proposal = PlannerProposal;
export type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string; refused?: boolean; proposals?: Proposal[]; streaming?: boolean };
export type ProposalStatus = 'staged' | 'saved' | 'dismissed';
export type Preset = 'week' | 'quick' | 'pantry';

/** Replaces the turn with the same id, or appends it. */
function upsertTurn(turns: ChatTurn[], next: ChatTurn) {
  return turns.some((turn) => turn.id === next.id) ? turns.map((turn) => turn.id === next.id ? next : turn) : [...turns, next];
}

const PROPOSAL_FALLBACK = 'Mình đã chuẩn bị đề xuất thực đơn để bạn xem trước.';
const NO_PROPOSAL_FALLBACK = 'Mình chưa thể đề xuất thực đơn lúc này.';

/** Rebuilds chat turns from a saved thread. Negative ids never clash with the live counter (from 1). */
function restoreTurns(messages: PlannerThread['messages']): ChatTurn[] {
  return messages.map((message, index) => {
    const id = -(index + 1);
    if (message.role === 'user') {
      return { id, role: 'user', text: message.text, refused: messages[index + 1]?.metadata?.refused === true };
    }
    const proposals = plannerProposals(message.parts.flatMap((part) => typeof part.type === 'string' && typeof part.toolCallId === 'string'
      ? [{ name: part.type, callId: part.toolCallId, output: part.output }] : []));
    const refused = message.metadata?.refused === true;
    return { id, role: 'assistant', text: message.text || (proposals.length ? PROPOSAL_FALLBACK : NO_PROPOSAL_FALLBACK), refused, proposals };
  });
}

function proposalContext(proposal: Proposal, status?: ProposalStatus) {
  const state = status === 'saved' ? 'người dùng đã lưu thực đơn'
    : status === 'staged' ? 'người dùng đang xem bản nháp, chưa lưu'
      : status === 'dismissed' ? 'người dùng đã bỏ qua' : 'chưa áp dụng';
  const meals = proposal.days.map(({ day, sections }) => {
    const filled = sections.filter(({ recipes }) => recipes.length).map(({ section, recipes }) =>
      `${sectionLabels[section].toLowerCase()}: ${recipes.map(({ title, id }) => `${title} (id ${id})`).join(', ')}`);
    return `${dayLabels[day]} (${filled.join('; ') || 'trống'})`;
  }).join(' | ');
  return `[Đề xuất tuần ${proposal.weekStart} (${state}): ${meals}]`;
}

function friendlyError(error: unknown, fallback: string) {
  const quotaText = aiQuotaMessage(error);
  if (quotaText) return quotaText;
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (error.status === 429) return 'Bạn gửi hơi nhanh. Hãy đợi một chút rồi thử lại.';
    if (error.status === 503) return 'Trợ lý đang tạm nghỉ. Hãy thử lại sau.';
    if (error.code === 'MEAL_DAY_LOCKED') return 'Một số ngày đã qua và chỉ có thể xem lại. Hãy tạo đề xuất mới cho những ngày còn lại hoặc tuần sau.';
    if (error.code === 'MEAL_WEEK_OUT_OF_RANGE') return 'Tuần này chưa nằm trong khoảng được phép lập thực đơn. Hãy chọn lại tuần.';
    if (error.status === 409) return 'Thực đơn hoặc thông tin ăn uống đã thay đổi. Hãy kiểm tra lại trước khi lưu.';
  }
  if (error instanceof Error && error.message.startsWith('Thực đơn đã thay đổi')) return error.message;
  return fallback;
}

function useMealPlannerState() {
  const token = useSessionStore((s) => s.accessToken);
  const [selectedWeek, setSelectedWeek] = useState<string>();
  const currentPlan = useMealPlan(token);
  const plan = useMealPlan(token, selectedWeek);
  const dietary = useDietaryRestrictions(token);
  const save = useSaveMealDays(token);
  const latestThread = useLatestPlannerThread(token);
  const [threadId, setThreadId] = useState(createClientMessageId);
  const [restored, setRestored] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [composer, setComposer] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [suggestion, setSuggestion] = useState<Proposal | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Proposal>>({});
  const weekStart = selectedWeek ?? currentPlan.data?.weekStart;
  const draft = weekStart ? drafts[weekStart] ?? null : null;
  const weeks = planningWeeks(currentPlan.data);
  const weekend = isPlanningWeekend(currentPlan.data);
  const [draftAction, setDraftAction] = useState<'save' | 'discard' | null>(null);
  const draftLock = useRef(false);
  const [statuses, setStatuses] = useState<Record<string, ProposalStatus>>({});
  const [selectedDay, setSelectedDay] = useState<Weekday>('MON');
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [preset, setPreset] = useState<Preset>('week');
  const sending = useRef(false);
  const nextId = useRef(1);
  const streamIds = useRef<number[]>([]);
  const days = useMemo(() => displayDays(plan.data, draft), [plan.data, draft]);
  const activeDay = days.find(({ day }) => day === selectedDay) ?? days[0];
  const latestByWeek = latestProposalIds(turns);

  function canPreviewProposal(proposal: Proposal) {
    return latestByWeek[proposal.weekStart] === proposal.id && statuses[proposal.id] !== 'saved' && statuses[proposal.id] !== 'dismissed' && draft?.id !== proposal.id;
  }

  function changeWeek(week: string) {
    if (draftLock.current || sending.current || !weeks.includes(week)) return;
    setSelectedWeek(week);
    setSaveError('');
  }

  /** Shows a saved conversation as the current chat. */
  function showThread(thread: PlannerThread) {
    setThreadId(thread.id);
    setTurns(restoreTurns(thread.messages));
    // A staged draft lived only in memory, so its proposal is offered again.
    setStatuses(Object.fromEntries(Object.entries(thread.proposalStatuses).filter(([, status]) => status !== 'staged')));
    setSuggestion(null);
    setDrafts({});
    setSaveError('');
    setChatError('');
  }

  // Reopen the last saved conversation once, unless the user has already started chatting.
  if (!restored && latestThread.data !== undefined) {
    setRestored(true);
    if (latestThread.data && turns.length === 0) showThread(latestThread.data);
  }

  /** Loads a conversation picked from the history sheet; throws so the sheet can say it failed. */
  async function openThread(id: string) {
    if (sending.current || draftLock.current) return;
    if (id === threadId) return;
    const thread = await getPlannerThread(id);
    if (sending.current || draftLock.current) return;
    setRestored(true);
    setFormOpen(false);
    showThread(thread);
  }

  /** Sets proposal statuses here and in the saved thread. */
  function markStatuses(updates: Record<string, ProposalStatus>) {
    setStatuses((old) => ({ ...old, ...updates }));
    // shortcut: a failed sync only means an old proposal may show its button again after a restart; retry if that matters.
    savePlannerStatuses(threadId, updates).catch(() => undefined);
  }

  /** Leaves the current conversation (it stays saved) and starts an empty one. */
  function startNewChat() {
    if (sending.current || draftLock.current) return;
    setRestored(true);
    setThreadId(createClientMessageId());
    setTurns([]);
    setStatuses({});
    setSuggestion(null);
    setDrafts({});
    setChatError('');
  }

  /** Opens the request form in the assistant tab. */
  function startForm(nextPreset: Preset = 'week') {
    if (sending.current || draftLock.current) return;
    setPreset(nextPreset);
    setFormKey((key) => key + 1);
    setFormOpen(true);
    router.navigate('/ai');
  }

  /** Asks the assistant, from the Thực đơn tab, to swap one meal. */
  function requestReplacement(day: Weekday, section: MealSection, title: string) {
    if (!weekStart || !plan.data?.days.find((item) => item.day === day)?.editable) return;
    setComposer(`Đề xuất món khác thay cho "${title}" ở ${dayLabels[day]} của tuần bắt đầu ${weekStart}, bữa ${sectionLabels[section].toLowerCase()}. Chỉ đổi bữa này, hãy cho tôi xem đề xuất trước khi lưu.`);
    setFormOpen(false);
    router.navigate('/ai');
  }

  /** Sends the chat box, or `override` (e.g. the request built by the form) when given. */
  async function sendMessage(override?: string) {
    const text = (override ?? composer).trim();
    if (sending.current || draftLock.current) return;
    if (!text) { setChatError('Nhập câu hỏi hoặc yêu cầu trước khi gửi.'); return; }
    if (text.length > 4000) { setChatError('Tin nhắn tối đa 4.000 ký tự.'); return; }
    sending.current = true;
    streamIds.current = [];
    setBusy(true);
    setChatError('');
    try {
      const context = turns.filter((turn) => !turn.refused && turn.text).map((turn) => ({
        role: turn.role,
        text: [turn.text, ...(turn.proposals ?? []).map((proposal) => proposalContext(proposal, statuses[proposal.id]))].filter(Boolean).join('\n').slice(0, 4000),
      }));
      const userId = nextId.current++;
      const assistantId = nextId.current++;
      streamIds.current = [userId, assistantId];
      setTurns((old) => [...old, { id: userId, role: 'user', text }]);
      setComposer('');
      const targetWeek = weekStart ?? (await getMealPlan()).weekStart;
      const result = await askMealPlanner(targetWeek, threadId, [...context, { role: 'user', text }], (partial) => {
        setTurns((old) => upsertTurn(old, { id: assistantId, role: 'assistant', text: partial, streaming: true }));
      });
      const proposals = plannerProposals(result.tools);
      setTurns((old) => upsertTurn(old.map((turn) => turn.id === userId ? { ...turn, refused: result.refused } : turn), {
        id: assistantId,
        role: 'assistant',
        text: result.text || (proposals.length ? PROPOSAL_FALLBACK : NO_PROPOSAL_FALLBACK),
        refused: result.refused,
        proposals,
      }));
      if (proposals.length) setSuggestion(proposals.at(-1)!);
    } catch (error) {
      // Drop the question and any partial answer, and give the text back so it can be resent.
      const failed = streamIds.current;
      setTurns((old) => old.filter((turn) => !failed.includes(turn.id)));
      setComposer(text);
      setChatError(friendlyError(error, 'Chưa gửi được yêu cầu. Nội dung vẫn còn để bạn thử lại.'));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  /** Stages a proposal as an unsaved draft and shows it in the Thực đơn tab. */
  function previewProposal(proposal: Proposal) {
    if (!canPreviewProposal(proposal) || draftLock.current || sending.current) return;
    markStatuses({ [proposal.id]: 'staged' });
    setDrafts((old) => ({ ...old, [proposal.weekStart]: proposal }));
    setSelectedWeek(proposal.weekStart);
    setSuggestion(null); setSaveError(''); setFormOpen(false);
    router.navigate('/meal-plan');
  }

  async function saveDraft() {
    if (!draft || draftLock.current || sending.current || !token) return;
    if (latestByWeek[draft.weekStart] !== draft.id) { setSaveError('Đã có đề xuất mới hơn cho tuần này. Hãy mở đề xuất mới nhất trong trò chuyện.'); return; }
    draftLock.current = true;
    setDraftAction('save');
    setSaveError('');
    try {
      const fresh = await getMealPlan(draft.weekStart);
      const changes = changedDayInputs(draft, fresh);
      if (!changes.length) { setSaveError('Đề xuất này không có thay đổi để lưu.'); return; }
      await save.mutateAsync({ weekStart: draft.weekStart, days: changes });
      markStatuses({ [draft.id]: 'saved' });
      setDrafts((old) => Object.fromEntries(Object.entries(old).filter(([week]) => week !== draft.weekStart)));
    } catch (error) {
      setSaveError(friendlyError(error, 'Không lưu được thực đơn. Đề xuất vẫn còn để bạn thử lại.'));
    } finally { draftLock.current = false; setDraftAction(null); }
  }

  async function discardDraft() {
    if (!draft || draftLock.current || sending.current) return;
    draftLock.current = true;
    setDraftAction('discard');
    setSaveError('');
    try {
      await discardPlannerDraft(draft.weekStart);
      markStatuses({ [draft.id]: 'dismissed' });
      setDrafts((old) => Object.fromEntries(Object.entries(old).filter(([week]) => week !== draft.weekStart)));
    } catch (error) {
      setSaveError(friendlyError(error, 'Chưa bỏ được đề xuất. Hãy kiểm tra kết nối và thử lại.'));
    } finally { draftLock.current = false; setDraftAction(null); }
  }

  return {
    token, plan, dietary, save, turns, composer, setComposer, busy, chatError, setChatError, saveError, suggestion, draft, statuses,
    selectedDay, setSelectedDay, formOpen, setFormOpen, formKey, preset, days, activeDay, canPreviewProposal,
    weekStart, weeks, weekend, changeWeek, draftAction,
    threadId, startForm, requestReplacement, sendMessage, previewProposal, saveDraft, discardDraft, startNewChat, openThread,
  };
}

type MealPlanner = ReturnType<typeof useMealPlannerState>;
const MealPlannerContext = createContext<MealPlanner | null>(null);

/** One planner session shared by the Trợ lý (chat, form) and Thực đơn (timetable, draft) tabs. */
export function MealPlannerProvider({ children }: { children: ReactNode }) {
  const value = useMealPlannerState();
  return <MealPlannerContext value={value}>{children}</MealPlannerContext>;
}

export function useMealPlanner() {
  const value = use(MealPlannerContext);
  if (!value) throw new Error('useMealPlanner must be used inside <MealPlannerProvider>');
  return value;
}
