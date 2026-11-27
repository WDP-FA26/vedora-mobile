import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && new URL(url).pathname.endsWith('.ts')) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }) };
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
let slots, cursor, effects, token;
const calls = [], updates = [], days = [], weeks = [], scrolls = [];
const client = { invalidateQueries: async () => {} };
mock.module('react', { exports: {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
  },
  useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
  useCallback: (callback) => callback,
  useEffect(effect, deps) {
    const index = cursor++, previous = slots[index];
    if (!deps || !previous || deps.some((value, i) => value !== previous.deps[i])) effects.push(() => {
      previous?.cleanup?.(); slots[index] = { deps, cleanup: effect() };
    });
  },
} });
mock.module('react-native', { exports: { AppState: { addEventListener: () => ({ remove() {} }) } } });
mock.module('@tanstack/react-query', { exports: { useQueryClient: () => client } });
mock.module(local('shared/stores/session-store.ts'), { exports: { useSessionStore: { getState: () => ({ accessToken: token, displayName: 'An' }) } } });
mock.module(local('features/meal-plan/services/voice-call.ts'), { exports: { PlannerVoiceCall: class {
  constructor(options) { this.options = options; calls.push(this); }
  start() {} end() {} updateScreen(screen) { updates.push(screen); }
} } });
const { useMealPlannerVoice } = await import('../src/features/meal-plan/hooks/use-meal-planner-voice.ts');
const planner = { token: 'owner', threadId: 'thread', weekStart: '2026-11-23', selectedDay: 'MON', plan: { data: { today: '2026-11-27' } },
  changeWeek: (week) => weeks.push(week), setSelectedDay: (day) => days.push(day), openThread: async () => {} };
function render() { cursor = 0; effects = []; const value = useMealPlannerVoice(planner); for (const effect of effects) effect(); return value; }
const command = (focus) => ({ focus, close: null });
beforeEach(() => { slots = []; token = 'owner'; for (const list of [calls, updates, days, weeks, scrolls]) list.length = 0; });
afterEach(() => { for (const slot of slots) slot?.cleanup?.(); });

test('each turn reads the latest day/panel/recipe/step and measured scroll before another render', () => {
  const voice = render(), { options } = calls[0];
  voice.scrollProps.onScroll({ nativeEvent: { contentOffset: { y: 240 }, layoutMeasurement: { height: 300 }, contentSize: { height: 900 } } });
  voice.selectDay('FRI');
  assert.equal(options.getScreen().day, 'FRI');
  assert.equal(options.getScreen().scrollState.percent, 40);
  options.onScreen(command({ kind: 'planDay', weekStart: '2026-11-23', day: 'SAT' }));
  assert.equal(options.getScreen().scrollState.percent, 40);
  voice.closePanel();
  assert.equal(options.getScreen().scrollState.percent, 40);
  voice.selectDay('FRI');
  voice.applyScreen(command({ kind: 'recipe', recipeId: 'tofu', title: 'Đậu hũ', section: 'steps', step: 3 }));
  voice.scrollProps.onScroll({ nativeEvent: { contentOffset: { y: 120 }, layoutMeasurement: { height: 300 }, contentSize: { height: 900 } } });
  assert.deepEqual(options.getScreen(), { weekStart: '2026-11-23', day: 'FRI', panel: 'recipe', recipeId: 'tofu', recipeSection: 'steps', recipeStep: 3,
    scrollState: { percent: 20, atTop: false, atBottom: false } });
  voice.closePanel();
  assert.deepEqual(options.getScreen(), { weekStart: '2026-11-23', day: 'FRI', panel: 'none', scrollState: { percent: 0, atTop: true, atBottom: true } });
  assert.equal(updates.at(-1).panel, 'none');
  assert.equal(calls.length, 1);
});

test('diary date and week changes reach the snapshot without retaining a closed panel', () => {
  const voice = render(), { options } = calls[0];
  voice.applyScreen(command({ kind: 'eatingLog', date: '2026-11-27' }));
  voice.setLogDate('2026-11-28');
  assert.equal(options.getScreen().eatingLogDate, '2026-11-28');
  voice.applyScreen(command({ kind: 'bodyMetrics', tab: 'bmi' }));
  voice.setLogDate('2026-11-29');
  assert.equal(options.getScreen().eatingLogDate, undefined);
  assert.equal(options.getScreen().bodyMetricsTab, 'bmi');
  voice.applyScreen(command({ kind: 'planDay', weekStart: '2026-11-30', day: 'SAT' }));
  assert.deepEqual(options.getScreen(), { weekStart: '2026-11-30', day: 'SAT', panel: 'none', scrollState: { percent: 0, atTop: true, atBottom: true } });
  assert.deepEqual(weeks, ['2026-11-30']);
  assert.deepEqual(days, ['SAT']);
});

test('only accepted AI actions glow, the pulse expires, and errors stop the effect', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  render(); const { options } = calls[0];
  options.onStatus('listening');
  assert.equal(render().glowing, false);
  assert.match(options.onScreen(command({ kind: 'shoppingList' })), /chưa có/);
  assert.equal(render().glowing, false);
  options.onScreen(command({ kind: 'recipe', recipeId: 'tofu', title: 'Đậu hũ', section: 'ingredients' }));
  assert.equal(render().glowing, true);
  t.mock.timers.tick(3200);
  assert.equal(render().glowing, false);
  options.onStatus('thinking');
  assert.equal(render().glowing, true);
  options.onStatus('error');
  assert.equal(render().glowing, false);
});

test('saved edits focus their day, reset on a new turn, and old sessions cannot change the screen', () => {
  render(); const { options } = calls[0];
  const change = { weekStart: '2026-11-23', applied: true, problems: [], days: [{ day: 'FRI', sections: [{ section: 'LUNCH', previous: [], recipes: [{ id: 'tofu', title: 'Đậu hũ' }] }] }] };
  options.onPlanChange(change);
  assert.equal(options.getScreen().day, 'FRI');
  assert.equal(render().glowing, true);
  options.onTurnStart();
  assert.equal(render().highlight, null);
  assert.equal(render().glowing, false);
  token = 'another-account';
  options.onScreen(command({ kind: 'eatingLog', date: '2026-11-29' }));
  options.onPlanChange(change);
  assert.equal(options.getScreen().panel, 'none');
  assert.equal(render().glowing, false);
});
