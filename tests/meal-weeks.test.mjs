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
let respond, streamResult, holdRead;
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: {
  request: async (config) => { requests.push(config); if (holdRead && config.method === 'GET') await holdRead; return { data: await respond(config) }; },
  delete: async (url, options) => { requests.push({ method: 'DELETE', url, ...options }); },
  patch: async () => {},
} } });
mock.module(local('shared/api/ai-stream.ts'), { namedExports: { requestAiStream: async (config) => { requests.push(config); return streamResult; } } });
const client = new QueryClient();
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => client,
  useQuery: (config) => config,
  useInfiniteQuery: (config) => config,
  useMutation: (config) => ({ ...config, isPending: false, mutateAsync: async (input) => {
    const result = await config.mutationFn(input); config.onSuccess?.(result); return result;
  } }),
} });
const session = (select) => select({ accessToken: 'session' });
session.getState = () => ({ accessToken: 'session' });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module('expo-router', { namedExports: { router: { navigate: (path) => routes.push(path) } } });
mock.module(local('features/messaging/utils/messaging.ts'), { namedExports: { createClientMessageId: () => 'thread-id' } });
let slots = [], slot = 0;
mock.module('react', { namedExports: {
  useState: (initial) => {
    const index = slot++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
  useRef: (initial) => { const index = slot++; return slots[index] ??= { current: initial }; },
  useMemo: (factory) => factory(), createContext: () => 'context', use: () => {},
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx } });

const schema = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { addCalendarDays, planningWeeks, isPlanningWeekend } = await import('../src/features/meal-plan/utils/meal-week.ts');
const { changedDayInputs, displayDays, avoidedIngredientsForRecipe } = await import('../src/features/meal-plan/utils/meal-plan.ts');
const { plannerProposals, latestProposalIds } = await import('../src/features/meal-plan/utils/planner-proposals.ts');
const service = await import('../src/features/meal-plan/services/meal-plan.service.ts');
const hooks = await import('../src/features/meal-plan/hooks/use-meal-plan.ts');
const currentWeek = '2026-11-16', nextWeek = '2026-11-23';
const meal = { id: 'dish', title: 'Soup', servings: 1, prepMinutes: 5, cookMinutes: 10, ingredients: [], steps: [] };
test('avoided warnings preserve backend IDs and match the right day and dish, not a duplicate title', () => {
  const warning = { code: 'AVOIDED_INGREDIENT', day: 'SUN', recipeIds: ['dish'], recipes: ['Soup'], ingredients: ['Peanut'], reason: null };
  const parsed = schema.mealPlanSchema.parse({ ...plan(), problems: [warning] });
  assert.deepEqual(parsed.problems[0].recipeIds, ['dish']);
  assert.deepEqual(avoidedIngredientsForRecipe(parsed.problems, 'SUN', meal), ['Peanut']);
  assert.deepEqual(avoidedIngredientsForRecipe(parsed.problems, 'MON', meal), []);
  assert.deepEqual(avoidedIngredientsForRecipe(parsed.problems, 'SUN', { ...meal, id: 'another' }), []);
  assert.deepEqual(avoidedIngredientsForRecipe([{ ...warning, code: 'DAY_CONFLICT' }], 'SUN', meal), []);
  assert.deepEqual(avoidedIngredientsForRecipe([], 'SUN', meal), []);
  assert.deepEqual(avoidedIngredientsForRecipe([warning, warning], 'SUN', meal), ['Peanut']);
  const { recipeIds, ...legacy } = warning;
  assert.deepEqual(avoidedIngredientsForRecipe([legacy], 'SUN', meal), ['Peanut']);
  assert.deepEqual(avoidedIngredientsForRecipe([{ ...warning, recipeIds: [] }], 'SUN', meal), []);
});

test('draft warning data survives parsing and older proposals remain compatible', () => {
  const warning = { code: 'AVOIDED_INGREDIENT', day: 'MON', recipeIds: ['dish'], recipes: ['Soup'], ingredients: ['Milk'], reason: null };
  const draft = schema.proposalSchema.parse({ ...proposal(), problems: [warning] });
  assert.deepEqual(draft.problems, [warning]);
  assert.deepEqual(avoidedIngredientsForRecipe(draft.problems, 'MON', meal), ['Milk']);
  assert.equal(schema.proposalSchema.parse(proposal()).problems, undefined);
});
function plan(week = currentWeek) {
  return { weekStart: week, currentWeekStart: currentWeek, today: '2026-11-22', minWeekStart: currentWeek, maxWeekStart: '2026-12-14', editable: true,
    days: schema.weekdays.map((day, index) => ({ day, date: addCalendarDays(week, index), editable: addCalendarDays(week, index) >= '2026-11-22',
      sections: schema.mealSections.map((section) => ({ section, recipes: [] })) })), problems: [] };
}
function proposal(week = nextWeek) {
  return { weekStart: week, ok: true, days: [{ day: 'MON', sections: [{ section: 'BREAKFAST', recipes: [{ id: 'dish', title: 'Soup' }], previous: [] }] }] };
}
const save = hooks.useSaveMealDays('session');
mock.module(local('features/meal-plan/hooks/use-meal-plan.ts'), { namedExports: {
  useMealPlan: (_token, week) => ({ data: plan(week) }), useSaveMealDays: () => save,
  useDietaryRestrictions: () => ({}), useLatestPlannerThread: () => ({ data: null }),
} });
const { MealPlannerProvider } = await import('../src/features/meal-plan/hooks/meal-planner-provider.tsx');
const render = () => { slot = 0; return MealPlannerProvider({ children: null }).props.value; };
function reset() {
  slots = []; requests.length = 0; routes.length = 0; client.clear(); holdRead = undefined;
  respond = (config) => plan(config.params?.weekStart ?? config.data?.weekStart);
  streamResult = { text: 'Next week', refused: false, tools: [{ name: 'fillSlots', callId: 'next', output: proposal() }] };
}

test('weeks and weekend use server dates, including Sunday and year boundaries', () => {
  assert.deepEqual(planningWeeks(plan()), [currentWeek, nextWeek, '2026-11-30', '2026-12-07', '2026-12-14']);
  assert.equal(isPlanningWeekend(plan()), true);
  assert.equal(isPlanningWeekend({ ...plan(), today: '2026-11-21' }), true);
  assert.equal(isPlanningWeekend({ ...plan(), today: '2026-11-20' }), false);
  assert.equal(addCalendarDays('2026-12-28', 7), '2027-01-04');
  assert.deepEqual(planningWeeks({ currentWeekStart: '2026-12-28', maxWeekStart: '2027-01-04' }), ['2026-12-28', '2027-01-04']);
  assert.equal(schema.weekStartSchema.safeParse('2026-11-22').success, false);
  assert.equal(schema.weekStartSchema.safeParse('2026-02-30').success, false);
  assert.equal(schema.mealPlanSchema.parse(plan()).days[0].editable, false);
});

test('GET, chat, save and discard carry the exact target week and preserve abort signals', async () => {
  reset(); const abort = new AbortController();
  await service.getMealPlan(nextWeek, abort.signal);
  assert.deepEqual(requests[0].params, { weekStart: nextWeek }); assert.equal(requests[0].signal, abort.signal);
  await service.askMealPlanner(nextWeek, 'thread', [{ role: 'user', text: 'Plan next week' }]);
  assert.equal(requests[1].data.weekStart, nextWeek);
  const days = changedDayInputs(proposal(), plan(nextWeek));
  await service.saveMealDays(nextWeek, days);
  assert.deepEqual(requests[2].data, { weekStart: nextWeek, days });
  await service.discardPlannerDraft(nextWeek);
  assert.deepEqual(requests[3], { method: 'DELETE', url: '/meal-plan/draft', params: { weekStart: nextWeek } });
});

test('save refuses another week, skips locked days and preserves untouched sections', () => {
  assert.throws(() => changedDayInputs(proposal(), plan()), /tuần/);
  assert.deepEqual(changedDayInputs(proposal(currentWeek), plan()), []);
  const saved = plan(nextWeek); saved.days[0].sections[1].recipes = [meal];
  assert.deepEqual(changedDayInputs(proposal(), saved)[0], { day: 'MON', breakfast: ['dish'], lunch: ['dish'], dinner: [], others: [] });
  const changed = plan(nextWeek); changed.days[0].sections[0].recipes = [meal];
  assert.throws(() => changedDayInputs(proposal(), changed), /Thực đơn đã thay đổi/);
  assert.equal(displayDays(plan(), proposal())[0].sections[0].recipes.length, 0);
  assert.equal(displayDays(plan(), proposal(currentWeek))[0].sections[0].recipes.length, 0);
});

test('fillSlots and editDraft keep the latest successful proposal per week and reject legacy outputs with no week', () => {
  const tools = [
    { name: 'fillSlots', callId: 'current', output: proposal(currentWeek) },
    { name: 'tool-fillSlots', callId: 'next-old', output: proposal() },
    { name: 'editDraft', callId: 'next-new', output: proposal() },
    { name: 'getPlan', callId: 'ignore', output: proposal() },
    { name: 'editDraft', callId: 'failed', output: { ...proposal(), ok: false } },
    { name: 'proposeMealPlan', callId: 'legacy', output: { ok: true, days: [] } },
  ];
  const proposals = plannerProposals(tools);
  assert.deepEqual(proposals.map((item) => item.id), ['current', 'next-new']);
  assert.deepEqual(latestProposalIds([{ proposals }, { proposals: [{ ...proposal(), id: 'newest' }] }]), { [currentWeek]: 'current', [nextWeek]: 'newest' });
});

test('week queries and saved caches never overwrite the current week when saving next week', async () => {
  reset();
  assert.notDeepEqual(hooks.useMealPlan('session').queryKey, hooks.useMealPlan('session', nextWeek).queryKey);
  client.setQueryData(['meal-plan', 'current'], plan());
  await save.mutateAsync({ weekStart: nextWeek, days: changedDayInputs(proposal(), plan(nextWeek)) });
  assert.equal(client.getQueryData(['meal-plan', nextWeek]).weekStart, nextWeek);
  assert.equal(client.getQueryData(['meal-plan', 'current']).weekStart, currentWeek);
});

test('Sunday flow selects next week, stages and saves there once; switching weeks keeps independent previews', async () => {
  reset(); let planner = render();
  assert.equal(planner.weekend, true); assert.equal(planner.weekStart, currentWeek);
  planner.changeWeek(nextWeek); planner = render();
  assert.equal(planner.weekStart, nextWeek);
  await planner.sendMessage('Plan next week'); planner = render();
  assert.equal(requests.find((item) => item.url.endsWith('/chat')).data.weekStart, nextWeek);
  planner.previewProposal(planner.suggestion); planner = render();
  assert.equal(planner.draft.weekStart, nextWeek);
  planner.changeWeek(currentWeek); planner = render(); assert.equal(planner.draft, null);
  planner.changeWeek(nextWeek); planner = render(); assert.equal(planner.draft.id, 'next');
  let release; holdRead = new Promise((resolve) => { release = resolve; });
  const pending = planner.saveDraft(); await planner.saveDraft();
  planner.changeWeek(currentWeek); assert.equal(render().weekStart, nextWeek);
  release(); await pending; planner = render();
  assert.equal(requests.filter((item) => item.method === 'PUT').length, 1);
  assert.equal(requests.find((item) => item.method === 'PUT').data.weekStart, nextWeek);
  assert.equal(planner.draft, null); assert.equal(planner.statuses.next, 'saved');
});

test('newer drafts block stale saves; failed saves retain the proposal; dismiss affects its own week', async () => {
  reset(); let planner = render();
  await planner.sendMessage('Next week'); planner = render(); planner.previewProposal(planner.suggestion); planner = render();
  respond = () => { throw new Error('offline'); };
  await planner.saveDraft(); planner = render();
  assert.equal(planner.draft.id, 'next'); assert.ok(planner.saveError);
  respond = (config) => plan(config.params?.weekStart ?? config.data?.weekStart);
  streamResult.tools = [{ name: 'editDraft', callId: 'newer', output: proposal() }];
  await planner.sendMessage('Change it'); planner = render();
  await planner.saveDraft(); assert.equal(requests.filter((item) => item.method === 'PUT').length, 0);
  planner = render(); assert.ok(planner.saveError);
  planner.previewProposal(planner.suggestion); planner = render();
  await planner.discardDraft(); planner = render();
  assert.equal(requests.at(-1).params.weekStart, nextWeek);
  assert.equal(planner.draft, null); assert.equal(planner.statuses.newer, 'dismissed');
  client.clear();
});
