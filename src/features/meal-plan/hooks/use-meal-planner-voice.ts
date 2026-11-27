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
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scroll = useVoiceScroll(scrollRef);
  const current = useRef({ planner, screen, scroll, status });
  const call = useRef<PlannerVoiceCall | null>(null);
  const sendContext = useCallback((text: string) => call.current?.context(text), []);
  const setLogDate = useCallback((date: string) => setScreen((value) => value.eatingLogDate === date ? value : { ...value, eatingLogDate: date }), []);
  const command = useRef<(command: VoiceScreenCommand) => void>(() => undefined);
  useEffect(() => { current.current = { planner, screen, scroll, status }; });
  useEffect(() => {
    command.current = (next) => {
      if (next.close === 'all' || next.close === current.current.screen.panel) {
        current.current.scroll.reset();
        setFocus(null);
        setScreen(({ weekStart, day }) => ({ weekStart, day, panel: 'none' }));
      }
      if (next.focus) {
        const target = next.focus;
        if (target.kind !== current.current.screen.panel || (target.kind === 'recipe' && target.recipeId !== current.current.screen.recipeId)) current.current.scroll.reset();
        setFocus(target);
        if (target.kind === 'planDay') {
          current.current.planner.changeWeek(target.weekStart);
          if (target.day) current.current.planner.setSelectedDay(target.day);
        }
        setScreen((value) => {
          const base = { weekStart: value.weekStart, day: value.day };
          if (target.kind === 'recipe') return { ...base, panel: 'recipe', recipeId: target.recipeId, recipeSection: target.section ?? 'top', ...(target.step ? { recipeStep: target.step } : {}) };
          if (target.kind === 'eatingLog') return { ...base, panel: 'eatingLog', ...(target.date ? { eatingLogDate: target.date } : {}) };
          if (target.kind === 'bodyMetrics') return { ...base, panel: 'bodyMetrics' };
          return { weekStart: target.weekStart, ...(target.day ? { day: target.day } : {}), panel: 'none' };
        });
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
      if (change.plan) void client.invalidateQueries({ queryKey: mealPlanKeys.plan });
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
      onScreen: (next) => command.current(next), onRefresh: refresh,
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

  useEffect(() => { call.current?.updateScreen(screen); }, [screen]);
  const running = status !== 'ended' && status !== 'error' && status !== 'connecting';
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  function closePanel() { command.current({ close: 'all', focus: null }); }
  const finished = status === 'ended' || status === 'error';
  return {
    screen, focus, status, error, reply, heard, elapsed, finished, sendContext, scrollRef, scrollProps: scroll.props, closePanel,
    end: () => call.current?.end(), toggleMute: () => call.current?.toggleMute(),
    applyScreen: (next: VoiceScreenCommand) => command.current(next),
    selectDay: (day: NonNullable<VoiceScreen['day']>) => { setScreen((value) => ({ ...value, day })); planner.setSelectedDay(day); },
    setLogDate,
    retry: () => { setError(''); setHeard(''); setElapsed(0); setStatus('connecting'); setAttempt((value) => value + 1); },
  };
}
