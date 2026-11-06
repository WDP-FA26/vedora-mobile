import { router } from 'expo-router';
import { createContext, use, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { askMealPlanner, getMealPlan } from '../services/meal-plan.service';
import { proposalSchema, type MealPlanProposal, type Weekday, type MealSection } from '../types/meal-plan.schema';
import { changedDayInputs, dayLabels, displayDays, sectionLabels } from '../utils/meal-plan';
import { useDietaryRestrictions, useMealPlan, useSaveMealDays } from './use-meal-plan';

export type Proposal = MealPlanProposal & { id: string };
export type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string; refused?: boolean; proposal?: Proposal; streaming?: boolean };
export type ProposalStatus = 'staged' | 'saved' | 'dismissed';
export type Preset = 'week' | 'quick' | 'pantry';

/** Replaces the turn with the same id, or appends it. */
function upsertTurn(turns: ChatTurn[], next: ChatTurn) {
  return turns.some((turn) => turn.id === next.id) ? turns.map((turn) => turn.id === next.id ? next : turn) : [...turns, next];
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
  return `[Đề xuất (${state}): ${meals}]`;
}

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (error.status === 429) return 'Bạn gửi hơi nhanh. Hãy đợi một chút rồi thử lại.';
    if (error.status === 503) return 'Trợ lý đang tạm nghỉ. Hãy thử lại sau.';
    if (error.status === 409) return 'Thực đơn hoặc thông tin ăn uống đã thay đổi. Hãy kiểm tra lại trước khi lưu.';
  }
  if (error instanceof Error && error.message.startsWith('Thực đơn đã thay đổi')) return error.message;
  return fallback;
}

function useMealPlannerState() {
  const token = useSessionStore((s) => s.accessToken);
  const plan = useMealPlan(token);
  const dietary = useDietaryRestrictions(token);
  const save = useSaveMealDays(token);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [composer, setComposer] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [suggestion, setSuggestion] = useState<Proposal | null>(null);
  const [draft, setDraft] = useState<Proposal | null>(null);
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
  const latestProposalId = turns.flatMap((turn) => turn.proposal ? [turn.proposal.id] : []).at(-1) ?? null;

  /** Opens the request form in the assistant tab. */
  function startForm(nextPreset: Preset = 'week') {
    setPreset(nextPreset);
    setFormKey((key) => key + 1);
    setFormOpen(true);
    router.navigate('/ai');
  }

  /** Asks the assistant, from the Thực đơn tab, to swap one meal. */
  function requestReplacement(day: Weekday, section: MealSection, title: string) {
    setComposer(`Đề xuất món khác thay cho "${title}" ở ${dayLabels[day]}, bữa ${sectionLabels[section].toLowerCase()}. Chỉ đổi bữa này, hãy cho tôi xem đề xuất trước khi lưu.`);
    setFormOpen(false);
    router.navigate('/ai');
  }

  async function sendMessage() {
    const text = composer.trim();
    if (sending.current) return;
    if (!text) { setChatError('Nhập câu hỏi hoặc yêu cầu trước khi gửi.'); return; }
    if (text.length > 4000) { setChatError('Tin nhắn tối đa 4.000 ký tự.'); return; }
    sending.current = true;
    streamIds.current = [];
    setBusy(true);
    setChatError('');
    try {
      const context = turns.filter((turn) => !turn.refused && turn.text).map((turn) => ({
        role: turn.role,
        text: [turn.text, turn.proposal ? proposalContext(turn.proposal, statuses[turn.proposal.id]) : ''].filter(Boolean).join('\n').slice(0, 4000),
      }));
      const userId = nextId.current++;
      const assistantId = nextId.current++;
      streamIds.current = [userId, assistantId];
      setTurns((old) => [...old, { id: userId, role: 'user', text }]);
      setComposer('');
      const result = await askMealPlanner([...context, { role: 'user', text }], (partial) => {
        setTurns((old) => upsertTurn(old, { id: assistantId, role: 'assistant', text: partial, streaming: true }));
      });
      const proposed = result.tools.filter((tool) => tool.name.replace(/^tool-/, '') === 'proposeMealPlan')
        .map((tool) => ({ tool, output: proposalSchema.safeParse(tool.output) }))
        .find(({ output }) => output.success && output.data.ok);
      const proposal: Proposal | undefined = proposed?.output.success
        ? { ...proposed.output.data, id: proposed.tool.callId } : undefined;
      setTurns((old) => upsertTurn(old.map((turn) => turn.id === userId ? { ...turn, refused: result.refused } : turn), {
        id: assistantId,
        role: 'assistant',
        text: result.text || (proposal ? 'Mình đã chuẩn bị đề xuất thực đơn để bạn xem trước.' : 'Mình chưa thể đề xuất thực đơn lúc này.'),
        refused: result.refused,
        proposal,
      }));
      if (proposal) setSuggestion(proposal);
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
    if (proposal.id !== latestProposalId || statuses[proposal.id]) return;
    const apply = () => {
      if (draft && draft.id !== proposal.id) setStatuses((old) => ({ ...old, [draft.id]: 'dismissed' }));
      setStatuses((old) => ({ ...old, [proposal.id]: 'staged' }));
      setDraft(proposal); setSuggestion(null); setSaveError(''); setFormOpen(false);
      router.navigate('/meal-plan');
    };
    if (draft && draft.id !== proposal.id) Alert.alert('Thay bản xem trước?', 'Đề xuất mới sẽ thay bản chưa lưu đang xem.', [
      { text: 'Giữ bản hiện tại', style: 'cancel' }, { text: 'Thay đề xuất', onPress: apply },
    ]);
    else apply();
  }

  async function saveDraft() {
    if (!draft || save.isPending || !token) return;
    setSaveError('');
    try {
      const fresh = await getMealPlan();
      const changes = changedDayInputs(draft, fresh);
      if (!changes.length) { setSaveError('Đề xuất này không có thay đổi để lưu.'); return; }
      await save.mutateAsync(changes);
      setStatuses((old) => ({ ...old, [draft.id]: 'saved' }));
      setDraft(null);
    } catch (error) {
      setSaveError(friendlyError(error, 'Không lưu được thực đơn. Đề xuất vẫn còn để bạn thử lại.'));
    }
  }

  function discardDraft() {
    if (!draft) return;
    setStatuses((old) => ({ ...old, [draft.id]: 'dismissed' }));
    setDraft(null);
    setSaveError('');
  }

  return {
    token, plan, dietary, save, turns, composer, setComposer, busy, chatError, setChatError, saveError, suggestion, draft, statuses,
    selectedDay, setSelectedDay, formOpen, setFormOpen, formKey, preset, days, activeDay, latestProposalId,
    startForm, requestReplacement, sendMessage, previewProposal, saveDraft, discardDraft,
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
