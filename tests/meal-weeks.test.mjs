import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
import ts from 'typescript';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const pathname = new URL(url).pathname;
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, sourceRoot).href;
const requests = [], routes = [];
let respond, streamResult, holdRead, streamFailure, streamParts = [], currentToken = 'session';
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: {
  request: async (config) => { requests.push(config); if (holdRead && config.method === 'GET') await holdRead; return { data: await respond(config) }; },
  delete: async (url, options) => { requests.push({ method: 'DELETE', url, ...options }); },
  patch: async () => {},
} } });
mock.module(local('shared/api/ai-stream.ts'), { namedExports: { requestAiStream: async (config) => { requests.push(config); config.onParts?.(streamParts); if (streamFailure) throw streamFailure; return streamResult; } } });
const client = new QueryClient();
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => client,
  useQuery: (config) => config,
  useInfiniteQuery: (config) => config,
  useMutation: (config) => ({ ...config, isPending: false, mutateAsync: async (input) => {
    const result = await config.mutationFn(input); config.onSuccess?.(result); return result;
  } }),
} });
const session = (select) => select({ accessToken: currentToken });
session.getState = () => ({ accessToken: currentToken });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module('expo-router', { namedExports: { router: { navigate: (path) => routes.push(path) } } });
mock.module(local('features/messaging/utils/messaging.ts'), { namedExports: { createClientMessageId: () => `id-${++sequence}` } });
let slots = [], slot = 0, sequence = 0;
mock.module('react', { namedExports: {
  useState: (initial) => {
    const index = slot++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
  useRef: (initial) => { const index = slot++; return slots[index] ??= { current: initial }; },
  useEffect: () => {},
  useMemo: (factory) => factory(), createContext: () => 'context', use: () => {},
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx } });

const schema = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { addCalendarDays, planningWeeks, isPlanningWeekend } = await import('../src/features/meal-plan/utils/meal-week.ts');
const { displayDays, avoidedIngredientsForRecipe } = await import('../src/features/meal-plan/utils/meal-plan.ts');
const { savedPlanChanges } = await import('../src/features/meal-plan/utils/planner-changes.ts');
const service = await import('../src/features/meal-plan/services/meal-plan.service.ts');
const { mealPlanKeys } = await import('../src/features/meal-plan/data/meal-plan.keys.ts');
const currentWeek = '2026-11-16', nextWeek = '2026-11-23';
function plan(week = currentWeek) {
  return { weekStart: week, currentWeekStart: currentWeek, today: '2026-11-22', minWeekStart: currentWeek, maxWeekStart: '2026-12-14', editable: true,
    days: schema.weekdays.map((day, index) => ({ day, date: addCalendarDays(week, index), editable: addCalendarDays(week, index) >= '2026-11-22',
      sections: schema.mealSections.map((section) => ({ section, recipes: [] })) })), problems: [] };
}
const change = (week = nextWeek) => ({ weekStart: week, applied: true, problems: [],
  days: [{ day: 'MON', sections: [{ section: 'BREAKFAST', previous: [], recipes: [{ id: 'dish', title: 'Soup' }] }] }] });
const part = (name = 'fillSlots', output = change(), id = 'tool-1') => ({ type: `tool-${name}`, toolCallId: id, state: 'output-available', input: {}, output });
mock.module(local('features/meal-plan/hooks/use-meal-plan.ts'), { namedExports: {
  useMealPlan: (_token, week) => ({ data: plan(week) }),
  useDietaryRestrictions: () => ({}), useLatestPlannerThread: () => ({ data: null }),
} });
const { MealPlannerProvider } = await import('../src/features/meal-plan/hooks/meal-planner-provider.tsx');
const render = () => { slot = 0; return MealPlannerProvider({ children: null }).props.value; };
function reset() {
  slots = []; requests.length = 0; routes.length = 0; client.clear(); currentToken = 'session';
  respond = (config) => plan(config.params?.weekStart); streamFailure = null; streamParts = [];
  streamResult = { text: '', tools: [], parts: [], refused: false };
}
test('calendar dates, allowed weeks and avoided warnings remain server-driven', () => {
  assert.equal(addCalendarDays('2026-12-28', 7), '2027-01-04');
  assert.equal(planningWeeks(plan()).length, 5);
  assert.equal(isPlanningWeekend(plan()), true);
  assert.equal(displayDays(plan())[0].editable, false);
  const warning = { code: 'AVOIDED_INGREDIENT', day: 'SUN', recipeIds: ['dish'], recipes: ['Soup'], ingredients: ['Peanut'], reason: null };
  const parsed = schema.mealPlanSchema.parse({ ...plan(), problems: [warning] });
  assert.deepEqual(avoidedIngredientsForRecipe(parsed.problems, 'SUN', { id: 'dish', title: 'Soup' }), ['Peanut']);
  assert.deepEqual(avoidedIngredientsForRecipe(parsed.problems, 'SUN', { id: 'other', title: 'Soup' }), []);
});
test('only validated, applied outputs of the four new writing tools count as saved', () => {
  const tools = ['fillSlots', 'editPlan', 'autoBalancePlan', 'verifyMealPlanAllergies'].map((name) => ({ name, callId: name, output: change() }));
  assert.equal(savedPlanChanges(tools).length, 4);
  for (const output of [{ ...change(), applied: false }, { ...change(), applied: undefined }, { ...change(), days: [] }, { ok: true }]) {
    assert.deepEqual(savedPlanChanges([{ name: 'fillSlots', callId: 'x', output }]), []);
  }
  assert.deepEqual(savedPlanChanges([{ name: 'editDraft', callId: 'old', output: change() }]), []);
});
test('streamed writes invalidate the calendar immediately and finish refreshes every cached week', async () => {
  reset();
  for (const key of [mealPlanKeys.week(), mealPlanKeys.week(currentWeek), mealPlanKeys.week(nextWeek)]) client.setQueryData(key, plan());
  const invalidations = [];
  const original = client.invalidateQueries.bind(client);
  const spy = mock.method(client, 'invalidateQueries', async (filter) => { invalidations.push(filter.queryKey); return original(filter); });
  streamParts = [part(), part('editPlan', change(currentWeek), 'tool-2')];
  streamResult.parts = streamParts;
  let planner = render();
  await planner.sendMessage('Plan next week'); planner = render();
  assert.ok(invalidations.filter((key) => key[0] === 'meal-plan').length >= 2);
  for (const key of [mealPlanKeys.week(), mealPlanKeys.week(currentWeek), mealPlanKeys.week(nextWeek)]) assert.equal(client.getQueryState(key).isInvalidated, true);
  assert.equal(planner.turns.length, 2);
  assert.equal(planner.turns[1].streaming, false);
  assert.equal(planner.draft, undefined);
  assert.equal(planner.saveDraft, undefined);
  const request = requests.find((item) => item.url === '/meal-plan/chat');
  assert.ok(request.data.requestId); assert.equal(request.data.threadId, planner.threadId);
  assert.equal(requests.some((item) => item.method === 'PUT' || item.url === '/meal-plan/draft'), false);
  spy.mock.restore();
});
test('a lost connection after a write preserves the partial turn and refreshes the saved calendar', async () => {
  reset(); client.setQueryData(mealPlanKeys.week(nextWeek), plan(nextWeek));
  streamParts = [{ type: 'text', text: 'Saved soup' }, part()]; streamFailure = new Error('offline');
  let planner = render(); await planner.sendMessage('Add soup'); planner = render();
  assert.equal(planner.turns[1].text, 'Saved soup'); assert.equal(planner.turns[1].streaming, false);
  assert.ok(planner.chatError); assert.equal(planner.composer, '');
  assert.equal(client.getQueryState(mealPlanKeys.week(nextWeek)).isInvalidated, true);
  assert.equal(requests.filter((item) => item.url === '/meal-plan/chat').length, 1);
});
test('late results from a different session cannot repopulate calendar or chat state', async () => {
  reset();
  const spy = mock.method(client, 'invalidateQueries', async () => {});
  let release; holdRead = new Promise((resolve) => { release = resolve; });
  const opening = render().openThread('another'); currentToken = 'other';
  respond = () => ({ id: 'another', messages: [{ id: 'a', role: 'assistant', text: 'private', parts: [] }] });
  release(); await opening; holdRead = undefined;
  assert.equal(render().turns.length, 0); assert.equal(spy.mock.callCount(), 0);
  spy.mock.restore();
});
test('saved history keeps tool changes but never revives a local draft; it can be reopened after failure', async () => {
  reset();
  respond = () => ({ id: 'history', messages: [{ id: 'old', role: 'assistant', text: '', parts: [part()] }] });
  let planner = render(); await planner.openThread('history'); planner = render();
  assert.equal(planner.turns[0].id, 'old'); assert.equal(savedPlanChanges(planner.turns[0].toolParts.map((p) => ({ name: p.type, callId: p.toolCallId, output: p.output }))).length, 1);
  planner.showSavedWeek(nextWeek); assert.equal(routes.at(-1), '/meal-plan');
  await planner.openThread('history'); assert.equal(requests.length, 2);
});
test('service carries request IDs and bounded context, with no draft endpoint', async () => {
  reset(); const messages = Array.from({ length: 45 }, () => ({ role: 'user', text: 'hello' }));
  await service.askMealPlanner(nextWeek, 'thread', 'request-1', messages);
  assert.equal(requests.at(-1).data.messages.length, 40); assert.equal(requests.at(-1).data.requestId, 'request-1');
});
