import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type ScrollViewInstance } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { dietaryProfileKeys } from '@/features/dietary-profile/data/dietary-profile.keys';
import { mealLogKeys } from '@/features/meal-log/data/meal-log.keys';
import { useSessionStore } from '@/shared/stores/session-store';
import { mealPlanKeys } from '../data/meal-plan.keys';
import type { MealPlanner } from './meal-planner-provider';
import { useVoiceScroll } from './use-voice-scroll';
import { PlannerVoiceCall, type VoiceStatus } from '../services/voice-call';
import type { VoiceFocus, VoiceRefresh, VoiceScreen, VoiceScreenCommand } from '../types/voice.schema';
import { voicePlanHighlight, type VoicePlanHighlight } from '../utils/voice-plan-highlight';

export function useMealPlannerVoice(planner: MealPlanner) {
  const client = useQueryClient();
  const [status, setStatus] = useState<VoiceStatus>('connecting');
  const [error, setError] = useState('');
  const [reply, setReply] = useState('Bạn có thể nhờ mình lên thực đơn, ghi món đã ăn hoặc hướng dẫn nấu ăn.');
  const [heard, setHeard] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [focus, setFocus] = useState<VoiceFocus | null>(null);
  const [screen, setScreen] = useState<VoiceScreen>({ weekStart: planner.weekStart!, day: planner.selectedDay, panel: 'none' });
  const [elapsed, setElapsed] = useState(0);
  const [highlight, setHighlight] = useState<VoicePlanHighlight | null>(null);
  const [lastActionAt, setLastActionAt] = useState<number | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scroll = useVoiceScroll(scrollRef);
  const current = useRef({ planner, screen, scroll, status });
  const call = useRef<PlannerVoiceCall | null>(null);
  const sendContext = useCallback((text: string) => call.current?.context(text), []);
  // Read each turn from this synchronous snapshot, even before React commits the next screen.
  const showScreen = useCallback((next: VoiceScreen) => {
    current.current.screen = next;
    setScreen(next);
    call.current?.updateScreen(next);
  }, []);
  const setLogDate = useCallback((date: string) => {
    const value = current.current.screen;
    if (value.panel === 'eatingLog' && value.eatingLogDate !== date) showScreen({ ...value, eatingLogDate: date });
  }, [showScreen]);
  const setShoppingSnapshot = useCallback((snapshot: Pick<VoiceScreen, 'shoppingDays' | 'shoppingPeople' | 'shoppingCheckedCount'>) => {
    const value = current.current.screen;
    if (value.panel === 'shoppingList' && JSON.stringify([value.shoppingDays, value.shoppingPeople, value.shoppingCheckedCount]) !== JSON.stringify([snapshot.shoppingDays, snapshot.shoppingPeople, snapshot.shoppingCheckedCount])) showScreen({ ...value, ...snapshot });
  }, [showScreen]);
  const command = useRef<(command: VoiceScreenCommand) => string | void>(() => undefined);
  useEffect(() => { Object.assign(current.current, { planner, scroll, status }); });
  useEffect(() => {
    command.current = (next) => {
      // shortcut: The dietary editor still lives outside the mobile call panel.
      if (next.focus?.kind === 'bodyMetrics' && next.focus.tab === 'dietary') return 'Tab hồ sơ ăn uống hiện chưa có trong màn gọi trên mobile. Bạn có thể nhờ mình cập nhật ghi nhớ hoặc mở chỉ số BMI.';
      if (next.close === 'all' || next.close === current.current.screen.panel) {
        if (current.current.screen.panel !== 'none') current.current.scroll.reset();
        setFocus(null);
        const { weekStart, day } = current.current.screen;
        showScreen({ weekStart, day, panel: 'none' });
      }
      if (next.focus) {
        const target = next.focus;
        const panel = target.kind === 'planDay' ? 'none' : target.kind;
        if (panel !== current.current.screen.panel || (target.kind === 'recipe' && target.recipeId !== current.current.screen.recipeId)) current.current.scroll.reset();
        setFocus(target);
        if (target.kind === 'planDay') {
          current.current.planner.changeWeek(target.weekStart);
          if (target.day) current.current.planner.setSelectedDay(target.day);
        }
        const { weekStart, day } = current.current.screen;
        const base = { weekStart, day };
        if (target.kind === 'recipe') showScreen({ ...base, panel: 'recipe', recipeId: target.recipeId, recipeSection: target.section ?? 'top', ...(target.step ? { recipeStep: target.step } : {}) });
        else if (target.kind === 'eatingLog') showScreen({ ...base, panel: 'eatingLog', ...(target.date ? { eatingLogDate: target.date } : {}) });
        else if (target.kind === 'bodyMetrics') showScreen({ ...base, weekStart: target.weekStart ?? weekStart, panel: 'bodyMetrics', bodyMetricsTab: target.tab === 'weekly' ? 'weekly' : 'bmi' });
        else if (target.kind === 'shoppingList') {
          const value = current.current.screen;
          const shoppingWeek = target.weekStart ?? weekStart;
          const filters = value.panel === 'shoppingList' && value.weekStart === shoppingWeek ? { shoppingDays: value.shoppingDays, shoppingPeople: value.shoppingPeople, shoppingCheckedCount: value.shoppingCheckedCount } : {};
          showScreen({ ...base, ...filters, weekStart: shoppingWeek, panel: 'shoppingList' });
        }
        else showScreen({ weekStart: target.weekStart, ...(target.day ? { day: target.day } : {}), panel: 'none' });
      }
      if (next.scroll) requestAnimationFrame(() => current.current.scroll.move(next.scroll!));
    };
  });

  const token = planner.token;
  const threadId = planner.threadId;
  useEffect(() => {
    if (!token) return;
    const refresh = (change: VoiceRefresh) => {
      // Never write or invalidate another account's cache after this call loses its session.
      if (useSessionStore.getState().accessToken !== token) return;
      if (change.plan) {
        void client.invalidateQueries({ queryKey: mealPlanKeys.plan });
        void client.invalidateQueries({ queryKey: mealPlanKeys.shopping });
        void client.invalidateQueries({ queryKey: mealLogKeys.all });
      }
      if (change.log) void client.invalidateQueries({ queryKey: mealLogKeys.all });
      if (change.dietary) void client.invalidateQueries({ queryKey: dietaryProfileKeys.mine });
      if (change.nutrition) void client.invalidateQueries({ queryKey: dietaryProfileKeys.nutrition });
    };
    let disposed = false;
    const initial = current.current;
    const voice = new PlannerVoiceCall({
      threadId, fullName: useSessionStore.getState().displayName, today: initial.planner.plan.data?.today ?? '', screen: initial.screen,
      getScreen: () => ({ ...current.current.screen, scrollState: current.current.scroll.read() }),
      onStatus: setStatus, onError: setError, onText: setReply, onHeard: setHeard,
      onScreen: (next) => {
        if (disposed || useSessionStore.getState().accessToken !== token) return;
        const notice = command.current(next);
        if (!notice && (next.focus || next.close || next.scroll)) setLastActionAt(Date.now());
        return notice;
      }, onRefresh: refresh,
      onTurnStart: () => {
        if (!disposed && useSessionStore.getState().accessToken === token) { setHighlight(null); setLastActionAt(null); }
      },
      onPlanChange: (change) => {
        if (disposed || useSessionStore.getState().accessToken !== token) return;
        const next = voicePlanHighlight(change);
        if (!next) return;
        setHighlight((previous) => voicePlanHighlight(change, previous));
        command.current({ close: null, focus: { kind: 'planDay', weekStart: next.weekStart, day: next.targets[0].day } });
        setLastActionAt(Date.now());
      },
      onTurnEnd: () => {
        if (disposed || useSessionStore.getState().accessToken !== token) return;
        void client.invalidateQueries({ queryKey: mealPlanKeys.plannerHistory });
        void current.current.planner.openThread(threadId).catch(() => undefined);
      },
    });
    call.current = voice;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || (state === 'inactive' && current.current.status !== 'connecting')) voice.end();
    });
    void voice.start();
    return () => { disposed = true; subscription.remove(); voice.end(); if (call.current === voice) call.current = null; };
  }, [attempt, client, threadId, token]);

  useEffect(() => {
    if (lastActionAt === null) return;
    const timer = setTimeout(() => setLastActionAt(null), 3200);
    return () => clearTimeout(timer);
  }, [lastActionAt]);
  const running = status !== 'ended' && status !== 'error' && status !== 'connecting';
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  function closePanel() { command.current({ close: 'all', focus: null }); }
  const finished = status === 'ended' || status === 'error';
  return {
    screen, focus, status, error, reply, heard, elapsed, finished, highlight,
    glowing: !finished && (status === 'thinking' || lastActionAt !== null), sendContext, scrollRef, scrollProps: scroll.props, closePanel,
    end: () => call.current?.end(), toggleMute: () => call.current?.toggleMute(), interrupt: () => call.current?.interrupt(),
    applyScreen: (next: VoiceScreenCommand) => command.current(next),
    selectDay: (day: NonNullable<VoiceScreen['day']>) => {
      showScreen({ ...current.current.screen, day }); planner.setSelectedDay(day);
    },
    setLogDate, setShoppingSnapshot,
    retry: () => { setError(''); setHeard(''); setHighlight(null); setLastActionAt(null); setElapsed(0); setStatus('connecting'); setAttempt((value) => value + 1); },
  };
}
