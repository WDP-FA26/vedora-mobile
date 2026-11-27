import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { createContext, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { createClientMessageId } from '@/features/messaging/utils/messaging';
import { mealLogKeys } from '@/features/meal-log/data/meal-log.keys';
import { ApiError } from '@/shared/api/api-error';
import { aiQuotaMessage } from '@/shared/api/ai-quota';
import { useSessionStore } from '@/shared/stores/session-store';
import type { AiPart } from '@/shared/api/ai-stream';

import { mealPlanKeys } from '../data/meal-plan.keys';
import { answerPlannerTool, askMealPlanner, getMealPlan, getPlannerThread, rewindPlannerThread } from '../services/meal-plan.service';
import { type PlannerThread, type Weekday, type MealSection } from '../types/meal-plan.schema';
import { dayLabels, displayDays, sectionLabels } from '../utils/meal-plan';
import { isPlanningWeekend, planningWeeks } from '../utils/meal-week';
import { PLAN_CHANGE_TOOLS, savedPlanChanges } from '../utils/planner-changes';
import { openPlannerInteraction, plannerWebAllowed, rewindSummary, WEB_APPROVED_TEXT, WEB_DECLINED_TEXT } from '../utils/planner-interactions';
import { savedMemoryUpdates } from '../utils/planner-memory';
import { VoiceCallSheet } from '../components/voice-call-sheet';
import { isToolPart, savedToolParts, type ToolPart } from '../utils/planner-trace';
import { useDietaryRestrictions, useLatestPlannerThread, useMealPlan } from './use-meal-plan';
import { useMealPlanActions } from './use-meal-plan-actions';

export type ChatTurn = { id: string; role: 'user' | 'assistant'; text: string; refused?: boolean; toolParts?: ToolPart[]; streaming?: boolean };
export type Preset = 'week' | 'quick' | 'pantry';

function restoreTurns(messages: PlannerThread['messages']): ChatTurn[] {
  return messages.map((message, index) => ({
    id: message.id, role: message.role, text: message.text,
    refused: message.role === 'user' ? messages[index + 1]?.metadata?.refused === true : message.metadata?.refused === true,
    toolParts: message.role === 'assistant' ? savedToolParts(message.parts) : undefined,
  }));
}

function friendlyError(error: unknown, planWriteSeen: boolean) {
  const quotaText = aiQuotaMessage(error);
  if (quotaText) return quotaText;
  const savedWarning = ' Một số thay đổi có thể đã được lưu. Hãy kiểm tra Thực đơn hoặc mở lại cuộc trò chuyện trước khi gửi yêu cầu tiếp.';
  if (error instanceof ApiError) {
    if (error.code === 'MODEL_ERROR') return 'Dịch vụ xử lý của trợ lý đang gặp lỗi (MODEL_ERROR). Hãy thử lại sau.' + (planWriteSeen ? savedWarning : '');
    if (error.code === 'RATE_LIMITED') return 'Dịch vụ xử lý của trợ lý đang quá tải (RATE_LIMITED). Hãy đợi một chút rồi thử lại.' + (planWriteSeen ? savedWarning : '');
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (error.status === 429) return 'Bạn gửi hơi nhanh. Hãy đợi một chút rồi thử lại.';
    if (error.code === 'MEAL_DAY_LOCKED') return 'Một số ngày đã qua và chỉ có thể xem lại.';
    if (error.code === 'MEAL_WEEK_OUT_OF_RANGE') return 'Hãy chọn tuần trong khoảng được phép lập thực đơn.';
    if (error.status === 503) return 'Trợ lý đang tạm thời không khả dụng (HTTP 503). Hãy thử lại sau.';
    if (error.status === 400 || error.status === 422) return `Trợ lý chưa chấp nhận được dữ liệu yêu cầu (HTTP ${error.status}). Hãy thử trong cuộc trò chuyện mới.`;
    if (error.status === 403) return 'Tài khoản hiện không có quyền gửi yêu cầu này (HTTP 403).';
    if (error.status !== null && error.status >= 500) return `Máy chủ trợ lý đang gặp lỗi (HTTP ${error.status}). Hãy thử lại sau.`;
    if (error.status !== null) return `Chưa gửi được yêu cầu đến trợ lý (HTTP ${error.status}). Hãy mở lại cuộc trò chuyện để kiểm tra.`;
  }
  return 'Kết nối với trợ lý bị gián đoạn.' + savedWarning;
}

function useMealPlannerState() {
  const token = useSessionStore((s) => s.actor ? null : s.accessToken);
  const client = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<string>();
  const currentPlan = useMealPlan(token);
  const plan = useMealPlan(token, selectedWeek);
  const dietary = useDietaryRestrictions(token);
  const latestThread = useLatestPlannerThread(token);
  const [threadId, setThreadId] = useState(createClientMessageId);
  const [restored, setRestored] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [composer, setComposer] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const mealActions = useMealPlanActions(token, plan.data, busy || voiceOpen);
  const [chatError, setChatError] = useState('');
  const [rewindingId, setRewindingId] = useState<string | null>(null);
  const [rewindNotice, setRewindNotice] = useState('');
  const [selectedDay, setSelectedDay] = useState<Weekday>('MON');
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [preset, setPreset] = useState<Preset>('week');
  const sending = useRef(false);
  const opening = useRef(false);
  const alive = useRef(true);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; abort.current?.abort(); };
  }, []);
  const isCurrent = () => alive.current && !!token && useSessionStore.getState().accessToken === token;
  const weekStart = selectedWeek ?? currentPlan.data?.weekStart;
  const weeks = planningWeeks(currentPlan.data);
  const weekend = isPlanningWeekend(currentPlan.data);
  const days = useMemo(() => displayDays(plan.data), [plan.data]);
  const activeDay = days.find(({ day }) => day === selectedDay) ?? days[0];

  function showThread(thread: PlannerThread) {
    setThreadId(thread.id);
    setTurns(restoreTurns(thread.messages));
    setChatError('');
    setRewindNotice('');
  }

  if (!restored && latestThread.data !== undefined) {
    setRestored(true);
    if (latestThread.data && turns.length === 0) showThread(latestThread.data);
  }

  async function openThread(id: string) {
    if (sending.current || opening.current || !isCurrent()) return;
    opening.current = true;
    setBusy(true);
    try {
      const thread = await getPlannerThread(id);
      if (!isCurrent()) return;
      setRestored(true);
      setFormOpen(false);
      showThread(thread);
    } finally {
      opening.current = false;
      if (isCurrent()) setBusy(false);
    }
  }

  function startNewChat() {
    if (sending.current || opening.current) return;
    setRestored(true);
    setThreadId(createClientMessageId());
    setTurns([]);
    setComposer('');
    setChatError('');
    setRewindNotice('');
  }

  function changeWeek(week: string) {
    if (!weeks.includes(week)) return;
    setSelectedWeek(week);
  }

  function showSavedWeek(week: string) {
    if (!weeks.includes(week)) return;
    setSelectedWeek(week);
    router.navigate('/meal-plan');
  }

  function startForm(nextPreset: Preset = 'week') {
    if (sending.current || opening.current || mealActions.pending) return;
    if (currentPlan.data && weekStart && weekStart < currentPlan.data.currentWeekStart) setSelectedWeek(currentPlan.data.currentWeekStart);
    setPreset(nextPreset);
    setFormKey((key) => key + 1);
    setFormOpen(true);
    router.navigate('/ai');
  }

  function requestReplacement(day: Weekday, section: MealSection, title: string) {
    if (!weekStart || !plan.data?.days.find((item) => item.day === day)?.editable || busy || mealActions.pending) return;
    setComposer(`Đổi món khác thay cho "${title}" ở ${dayLabels[day]} của tuần bắt đầu ${weekStart}, bữa ${sectionLabels[section].toLowerCase()}. Chỉ đổi bữa này.`);
    setFormOpen(false);
    router.navigate('/ai');
  }

  async function refreshPlan() {
    if (!isCurrent()) return;
    // Includes the current-week alias and every cached week the assistant may have changed.
    await client.invalidateQueries({ queryKey: mealPlanKeys.plan });
    await client.invalidateQueries({ queryKey: mealPlanKeys.shopping });
    await client.invalidateQueries({ queryKey: mealLogKeys.all });
  }

  async function sendMessage(override?: string, decision?: { callId: string; output: { answer: string } | { approved: boolean } }) {
    const text = (override ?? composer).trim();
    if (sending.current || opening.current || mealActions.pending || !isCurrent()) return;
    if (!text) { setChatError('Nhập câu hỏi hoặc yêu cầu trước khi gửi.'); return; }
    if (text.length > 4000) { setChatError('Tin nhắn tối đa 4.000 ký tự.'); return; }
    const interaction = openPlannerInteraction(turns);
    if (decision && decision.callId !== interaction?.callId) return;
    if (decision && ((interaction?.kind === 'web') !== ('approved' in decision.output))) return;
    sending.current = true;
    setRestored(true);
    setBusy(true);
    setChatError('');
    setRewindNotice('');
    const userId = createClientMessageId();
    const assistantId = createClientMessageId();
    const request = new AbortController();
    abort.current = request;
    let started = false;
    let planWriteSeen = false;
    const seen = new Set<string>();
    const seenMemory = new Set<string>();
    const update = (parts: AiPart[], streaming: boolean) => {
      if (!isCurrent()) return;
      const toolParts = parts.filter(isToolPart);
      planWriteSeen ||= toolParts.some((part) => PLAN_CHANGE_TOOLS.includes(part.type.replace(/^tool-/, '')));
      const changes = savedPlanChanges(toolParts.map((part) => ({ name: part.type, callId: part.toolCallId, output: part.output })));
      if (changes.some((change) => !seen.has(change.id))) {
        changes.forEach((change) => seen.add(change.id));
        void refreshPlan().catch(() => undefined);
      }
      const memories = savedMemoryUpdates(toolParts).filter((item) => !seenMemory.has(item.id));
      if (memories.length) {
        memories.forEach((item) => seenMemory.add(item.id));
        void client.invalidateQueries({ queryKey: mealPlanKeys.dietary }).catch(() => undefined);
      }
      const answer: ChatTurn = { id: assistantId, role: 'assistant', text: parts.flatMap((part) => part.type === 'text' ? [part.text] : []).join(''), toolParts, streaming };
      setTurns((old) => old.some((turn) => turn.id === assistantId) ? old.map((turn) => turn.id === assistantId ? answer : turn) : [...old, answer]);
    };
    try {
      let nextTurns = turns;
      const answer = decision ?? (interaction?.kind === 'question' ? { callId: interaction.callId, output: { answer: text } }
        : interaction?.kind === 'web' ? { callId: interaction.callId, output: { approved: false } } : undefined);
      if (answer) {
        const saved = await answerPlannerTool(threadId, answer.callId, answer.output, request.signal);
        if (!isCurrent()) return;
        const message = restoreTurns(saved.messages).find((turn) => turn.toolParts?.some((part) => part.toolCallId === answer.callId));
        if (message) {
          nextTurns = turns.map((turn, index) => index === turns.length - 1 ? message : turn);
          setTurns(nextTurns);
        }
      }
      const withUser = [...nextTurns, { id: userId, role: 'user' as const, text }];
      const allowWebSearch = plannerWebAllowed(withUser);
      setTurns(withUser);
      setComposer('');
      started = true;
      const targetWeek = weekStart ?? (await getMealPlan(undefined, request.signal)).weekStart;
      if (!isCurrent()) return;
      const result = await askMealPlanner(targetWeek, threadId, userId, text, (parts) => update(parts, true), request.signal, allowWebSearch);
      if (!isCurrent()) return;
      update(result.parts, false);
      setTurns((old) => old.map((turn) => turn.id === userId || turn.id === assistantId ? { ...turn, refused: result.refused } : turn));
    } catch (error) {
      if (isCurrent()) {
        // A tool may already have committed: preserve the partial answer and never silently resend it.
        setTurns((old) => old.map((turn) => turn.id === assistantId ? { ...turn, streaming: false } : turn));
        setChatError(started ? friendlyError(error, planWriteSeen) : 'Chưa gửi được câu trả lời. Hãy thử lại hoặc mở lại lịch sử trò chuyện.');
      }
    } finally {
      sending.current = false;
      if (isCurrent()) {
        setBusy(false);
        void client.invalidateQueries({ queryKey: mealPlanKeys.plannerHistory });
        await refreshPlan().catch(() => undefined);
      }
    }
  }

  async function rewind(messageId: string) {
    const index = turns.findIndex((turn) => turn.id === messageId && turn.role === 'user');
    if (sending.current || opening.current || !isCurrent() || index < 0) return false;
    sending.current = true;
    setBusy(true);
    setRewindingId(messageId);
    setChatError('');
    setRewindNotice('');
    const request = new AbortController();
    abort.current = request;
    try {
      const result = await rewindPlannerThread(threadId, messageId, request.signal);
      if (!isCurrent()) return false;
      setRestored(true);
      setTurns(turns.slice(0, index));
      setComposer(result.text);
      setFormOpen(false);
      setRewindNotice(rewindSummary(result));
      return true;
    } catch (error) {
      if (isCurrent()) setChatError(error instanceof ApiError && error.status === 404
        ? 'Không tìm thấy mốc hoàn tác. Hãy mở lại lịch sử để cập nhật trước khi thử lại.'
        : 'Chưa xác nhận được kết quả hoàn tác. Hãy kiểm tra thực đơn và mở lại lịch sử trước khi thử lại.');
      return false;
    } finally {
      sending.current = false;
      if (isCurrent()) {
        setBusy(false);
        setRewindingId(null);
        void client.invalidateQueries({ queryKey: mealPlanKeys.plannerHistory });
        await refreshPlan().catch(() => undefined);
      }
    }
  }

  return {
    token, plan, dietary, turns, composer, setComposer, busy: busy || mealActions.pending, mealActions, chatError, setChatError, voiceOpen, setVoiceOpen,
    selectedDay, setSelectedDay, formOpen, setFormOpen, formKey, preset, days, activeDay,
    weekStart, currentWeekStart: currentPlan.data?.currentWeekStart, weeks, weekend, changeWeek, showSavedWeek,
    threadId, startForm, requestReplacement, sendMessage, startNewChat, openThread,
    rewindingId, rewindNotice, rewind,
    interaction: busy ? null : openPlannerInteraction(turns),
    webSearchAllowed: plannerWebAllowed(turns),
    answerQuestion: (callId: string, answer: string) => sendMessage(answer, { callId, output: { answer } }),
    answerWebSearch: (callId: string, approved: boolean) => sendMessage(approved ? WEB_APPROVED_TEXT : WEB_DECLINED_TEXT, { callId, output: { approved } }),
  };
}

export type MealPlanner = ReturnType<typeof useMealPlannerState>;
const MealPlannerContext = createContext<MealPlanner | null>(null);

export function MealPlannerProvider({ children }: { children: ReactNode }) {
  const value = useMealPlannerState();
  return <MealPlannerContext value={value}>{children}{value.voiceOpen && value.token && value.weekStart ? <VoiceCallSheet planner={value} onClose={() => value.setVoiceOpen(false)} /> : null}</MealPlannerContext>;
}

export function useMealPlanner() {
  const value = use(MealPlannerContext);
  if (!value) throw new Error('useMealPlanner must be used inside <MealPlannerProvider>');
  return value;
}
