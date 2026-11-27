import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { beforeEach, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && /\.tsx?$/.test(new URL(url).pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: new URL(url).pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
let state, cursor, effects, session, requests, invalidated, params, routes, queryData, onPatch;
const jsx = (type, props) => ({ type, props });
mock.module('react', { exports: {
  useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial; return [state[index], (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; },
  useRef(initial) { const index = cursor++; return state[index] ??= { current: initial }; },
  useEffect(effect) { effects.push(effect); },
} });
mock.module('react/jsx-runtime', { exports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { exports: { Image: 'Image', Pressable: 'Pressable', Text: 'Text', TextInput: 'TextInput', View: 'View', StyleSheet: { create: (styles) => styles } } });
mock.module('expo-symbols', { exports: { SymbolView: 'Symbol' } });
mock.module('expo-router', { exports: { useLocalSearchParams: () => params, router: { setParams: (next) => { params = { ...params, ...next }; routes.push(next); } } } });
mock.module('zustand', { exports: { create: (initialize) => {
  let value;
  const store = (selector) => selector(value);
  value = initialize((next) => { value = { ...value, ...next }; });
  store.getState = () => value;
  return store;
} } });
mock.module('@tanstack/react-query', { exports: {
  useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => { invalidated.push(queryKey); } }),
  useQuery: () => ({ data: queryData, isPending: false }),
  useMutation: (options) => ({ ...options, mutateAsync: async (input) => { const result = await options.mutationFn(input); await options.onSuccess?.(result); return result; } }),
} });
mock.module(local('hooks/use-theme.ts'), { exports: { useTheme: () => ({}) } });
mock.module(local('shared/stores/session-store.ts'), { exports: { useSessionStore: { getState: () => ({ accessToken: session }) } } });
mock.module(local('shared/api/api-client.ts'), { exports: { apiClient: {} } });
mock.module(local('shared/api/request-json.ts'), { exports: { requestJson: async (schema, config) => { requests.push(config); return onPatch ? onPatch(config) : entry; } } });
mock.module(local('features/meal-plan/components/meal-action-sheet.tsx'), { exports: { ActionButton: 'ActionButton', ActionText: 'ActionText' } });
globalThis.require = (asset) => asset;

const { mealPlanSchema, weekdays, mealSections } = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { recipeSchema } = await import('../src/features/recipes/types/recipe.schema.ts');
const { computeDayNutrition, computeWeekNutrition, buildBalancePrompt } = await import('../src/features/meal-plan/utils/meal-nutrition.ts');
const { mealLogEntryUpdateSchema } = await import('../src/features/meal-log/types/meal-log.schema.ts');
const { mealLogEdit, mealLogReviewPrompt } = await import('../src/features/meal-log/utils/meal-log.ts');
const { updateMealLogEntry } = await import('../src/features/meal-log/services/meal-log.service.ts');
const { useUpdateMealLogEntry } = await import('../src/features/meal-log/hooks/use-meal-log.ts');
const { MealLogEntryRow } = await import('../src/features/meal-log/components/meal-log-entry-row.tsx');
const { RecipeNutrition } = await import('../src/features/dietary-profile/components/recipe-nutrition.tsx');
const { MealNutritionSummary } = await import('../src/features/meal-plan/components/meal-nutrition-summary.tsx');
const { WeeklyCalorieChart } = await import('../src/features/dietary-profile/components/weekly-calorie-chart.tsx');
const { usePlannerDraft } = await import('../src/features/meal-plan/hooks/use-planner-draft.ts');
const { usePlannerRequestStore } = await import('../src/features/meal-plan/stores/planner-request.store.ts');

const entry = { id: 'entry-1', name: 'Đậu hũ', servings: 1, caloriesPerServing: 300, calories: 300, calorieSource: 'WEB_ESTIMATE' };
const recipe = { id: 'tofu', title: 'Đậu hũ', servings: 4, prepMinutes: 5, cookMinutes: 10, ingredients: [], steps: [], caloriesPerServing: 300, nutritionPillars: ['PLANT_PROTEIN', 'CALCIUM_RICH'] };
function makePlan() {
  return { weekStart: '2026-11-23', currentWeekStart: '2026-11-23', today: '2026-11-28', minWeekStart: '2026-11-02', maxWeekStart: '2026-12-07', editable: true, problems: [],
    days: weekdays.map((day, index) => ({ day, date: `2026-11-${23 + index}`, editable: index >= 5, sections: mealSections.map((section) => ({ section, recipes: [] })) })) };
}
function fullDay(plan, index, calories = 300) { for (const section of plan.days[index].sections.slice(0, 3)) section.recipes = [{ ...recipe, caloriesPerServing: calories }]; }
function render(component, props) { cursor = 0; effects = []; const tree = component(props); effects.forEach((effect) => effect()); return tree; }
function nodes(node) { if (Array.isArray(node)) return node.flatMap(nodes); if (!node || typeof node !== 'object') return []; return [node, ...nodes(node.props?.children)]; }
const find = (tree, predicate) => nodes(tree).find(predicate);
const text = (tree) => typeof tree === 'string' || typeof tree === 'number' ? String(tree) : Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) : '';
beforeEach(() => { state = []; cursor = 0; effects = []; session = 'A'; requests = []; invalidated = []; params = {}; routes = []; queryData = undefined; onPatch = undefined; usePlannerRequestStore.getState().clear(); });

test('schemas retain server kcal/pillars, accept zero and remain compatible with older recipes', () => {
  const plan = makePlan(); fullDay(plan, 5, 0);
  assert.equal(mealPlanSchema.parse(plan).days[5].sections[0].recipes[0].caloriesPerServing, 0);
  const parsed = recipeSchema.parse({ ...recipe, isFavorite: false, imageUrl: null, ingredientCount: 0, conflicts: [], post: null, updatedAt: '' });
  assert.deepEqual(parsed.nutritionPillars, ['PLANT_PROTEIN', 'CALCIUM_RICH']);
  const { caloriesPerServing, nutritionPillars, ...legacy } = recipe;
  plan.days[5].sections[0].recipes = [legacy];
  assert.equal(mealPlanSchema.parse(plan).days[5].sections[0].recipes[0].caloriesPerServing, undefined);
});

test('planning adds one serving per dish, counts a pillar once per day and includes snacks', () => {
  const plan = makePlan(); fullDay(plan, 5);
  plan.days[5].sections[3].recipes = [{ ...recipe, caloriesPerServing: 100, nutritionPillars: ['HEALTHY_FAT'] }];
  const summary = computeWeekNutrition(plan);
  assert.equal(summary.totalCalories, 1000); // The recipes yield 4 portions, but the calendar plans 1 portion.
  assert.equal(summary.averageFullDayCalories, 1000);
  assert.equal(summary.pillarCounts.PLANT_PROTEIN, 1);
  assert.deepEqual(summary.missingPillars, ['FIBER_VEG', 'IRON_RICH']);
});

test('unknown kcal is tracked instead of becoming a complete zero-kcal day or a low-calorie warning', () => {
  const plan = makePlan(); fullDay(plan, 5);
  plan.days[5].sections[0].recipes[0].caloriesPerServing = null;
  const day = computeDayNutrition(plan.days[5], 2000);
  assert.equal(day.unknownCalories, 1); assert.equal(day.calories, 600); assert.equal(day.hints.length, 0);
  assert.equal(computeWeekNutrition(plan).averageFullDayCalories, null);
  fullDay(plan, 5, 0);
  assert.equal(computeWeekNutrition(plan).averageFullDayCalories, 0);
  assert.equal(computeWeekNutrition(makePlan()).hasKnownCalories, false);
});

test('target hints follow the web thresholds and do not call an unfinished day too low', () => {
  const plan = makePlan(); plan.days[5].sections[0].recipes = [recipe];
  assert.equal(computeDayNutrition(plan.days[5], 2000).hints.length, 0);
  fullDay(plan, 5, 300);
  assert.match(computeDayNutrition(plan.days[5], 2000).hints.join(''), /thấp/);
  fullDay(plan, 5, 1000);
  assert.match(computeDayNutrition(plan.days[5], 2000).hints.join(''), /cao/);
});

test('balance requests identify the displayed week, missing groups and editable dates; history remains read-only', () => {
  const plan = makePlan(); fullDay(plan, 5);
  const prompt = buildBalancePrompt(plan);
  assert.match(prompt, /2026-11-23/); assert.match(prompt, /2026-11-28, 2026-11-29/); assert.match(prompt, /giàu sắt/);
  plan.editable = false;
  assert.match(buildBalancePrompt(plan), /Chỉ nhận xét tuần cũ, không sửa/);
  assert.match(buildBalancePrompt(makePlan()), /gợi ý thực đơn chay/);
});

test('journal edits preserve calorie provenance for servings-only changes and distinguish clearing from zero', async () => {
  assert.deepEqual(mealLogEdit(entry, '1,5', '300'), { servings: 1.5 });
  assert.deepEqual(mealLogEdit(entry, '1', '0'), { caloriesPerServing: 0 });
  assert.deepEqual(mealLogEdit(entry, '1', ''), { caloriesPerServing: null });
  assert.deepEqual(mealLogEdit(entry, '1', '300'), {});
  await updateMealLogEntry({ id: entry.id, change: { servings: 1.5 } });
  assert.equal(requests[0].method, 'PATCH'); assert.equal(requests[0].url, '/meal-plan/log/entry-1');
  assert.deepEqual(requests[0].data, { servings: 1.5 });
  await updateMealLogEntry({ id: entry.id, change: { caloriesPerServing: null } });
  assert.deepEqual(requests[1].data, { caloriesPerServing: null });
});

test('invalid journal inputs never reach PATCH', () => {
  for (const [servings, calories] of [['', '300'], ['0.249', '300'], ['20.001', '300'], ['NaN', '300'], ['1', '1.2'], ['1', '-1'], ['1', '5001']]) assert.throws(() => mealLogEdit(entry, servings, calories));
  for (const change of [{}, { servings: 0 }, { servings: 20.1 }, { servings: 1.234 }, { caloriesPerServing: -1 }, { caloriesPerServing: 5001 }, { caloriesPerServing: 1.5 }, { name: 'Not allowed' }]) assert.equal(mealLogEntryUpdateSchema.safeParse(change).success, false);
  assert.throws(() => updateMealLogEntry({ id: entry.id, change: { servings: 0 } }));
  assert.equal(requests.length, 0);
});

test('PATCH refreshes every journal week but cannot invalidate or write another session', async () => {
  const mutation = useUpdateMealLogEntry('A');
  await mutation.mutateAsync({ id: entry.id, change: { servings: 2 } });
  assert.equal(invalidated.length, 1); assert.equal(mutation.retry, false);
  onPatch = async () => { session = 'B'; return entry; };
  await mutation.mutateAsync({ id: entry.id, change: { servings: 3 } });
  assert.equal(invalidated.length, 1);
  await assert.rejects(mutation.mutateAsync({ id: entry.id, change: { servings: 4 } }), /SESSION_CHANGED/);
  assert.equal(requests.length, 2);
});

test('week review follows web eligibility and explicitly asks before modifying the remaining dates', () => {
  const plan = makePlan();
  const week = { ...plan, summary: { completeDays: 1, remainingDays: 2 } };
  assert.match(mealLogReviewPrompt(week), /2026-11-23 đến 2026-11-29/);
  assert.match(mealLogReviewPrompt(week), /hỏi mình trước/);
  assert.match(mealLogReviewPrompt(week), /2026-11-28/);
  assert.equal(mealLogReviewPrompt({ ...week, today: '2026-12-01' }), null);
  assert.equal(mealLogReviewPrompt({ ...week, summary: { completeDays: 0, remainingDays: 2 } }), null);
  assert.equal(mealLogReviewPrompt({ ...week, summary: { completeDays: 1, remainingDays: 0 } }), null);
});

test('journal row cancels locally, saves only changed values and keeps failed edits open', async () => {
  const saved = [];
  const props = { entry, editable: true, busy: false, onUpdate: async (change) => saved.push(change), onDelete() {} };
  let tree = render(MealLogEntryRow, props);
  find(tree, (node) => node.props.accessibilityLabel === 'Sửa Đậu hũ').props.onPress();
  tree = render(MealLogEntryRow, props);
  find(tree, (node) => node.props.accessibilityLabel === 'Khẩu phần của Đậu hũ').props.onChangeText('2');
  tree = render(MealLogEntryRow, props);
  find(tree, (node) => node.props.label === 'Hủy').props.onPress();
  assert.equal(saved.length, 0);
  tree = render(MealLogEntryRow, props); find(tree, (node) => node.props.accessibilityLabel === 'Sửa Đậu hũ').props.onPress();
  tree = render(MealLogEntryRow, props); find(tree, (node) => node.props.accessibilityLabel === 'Khẩu phần của Đậu hũ').props.onChangeText('1,5');
  tree = render(MealLogEntryRow, props); await find(tree, (node) => node.props.label === 'Lưu thay đổi').props.onPress(); await new Promise(setImmediate);
  assert.deepEqual(saved, [{ servings: 1.5 }]);
  tree = render(MealLogEntryRow, props); find(tree, (node) => node.props.accessibilityLabel === 'Sửa Đậu hũ').props.onPress();
  tree = render(MealLogEntryRow, props); find(tree, (node) => node.props.accessibilityLabel === 'Kcal mỗi suất của Đậu hũ').props.onChangeText('');
  tree = render(MealLogEntryRow, { ...props, onUpdate: async () => { throw new Error('offline'); } });
  find(tree, (node) => node.props.label === 'Lưu thay đổi').props.onPress(); await new Promise(setImmediate);
  tree = render(MealLogEntryRow, props);
  assert.ok(find(tree, (node) => node.props.error)); assert.ok(find(tree, (node) => node.props.label === 'Hủy'));
});

test('locked rows expose no edit/delete controls, and recipe nutrition never labels unknown kcal as zero', () => {
  assert.equal(find(render(MealLogEntryRow, { entry, editable: false, busy: false }), (node) => node.props.accessibilityLabel?.startsWith('Sửa')), undefined);
  assert.match(text(RecipeNutrition({})), /Chưa có kcal/);
  assert.match(text(RecipeNutrition({ caloriesPerServing: 0, nutritionPillars: ['PLANT_PROTEIN'] })), /~0 kcal\/suấtĐạm/);
});

test('nutrition panel expands and sends a draft for its own week without saving anything', () => {
  const plan = makePlan(); fullDay(plan, 5);
  const drafts = [];
  const props = { plan, token: 'A', onAskAssistant: (prompt) => drafts.push(prompt) };
  let tree = render(MealNutritionSummary, props);
  assert.equal(find(tree, (node) => node.props.label === 'Nhờ AI cân đối tuần'), undefined);
  find(tree, (node) => node.props.accessibilityLabel === 'Tổng hợp dinh dưỡng tuần').props.onPress();
  tree = render(MealNutritionSummary, props);
  assert.match(text(tree), /5 nhóm dưỡng chất chay/);
  find(tree, (node) => node.props.label === 'Nhờ AI cân đối tuần').props.onPress();
  assert.match(drafts[0], /2026-11-23/); assert.equal(requests.length, 0);
});

test('weekly chart distinguishes missing values, true zero and partial diary calories', () => {
  const tree = WeeklyCalorieChart({ days: [{ date: '2026-11-23', label: 'T2', planned: null, logged: 0, loggedIncomplete: true }], target: 2000 });
  const row = find(tree, (node) => node.props.accessibilityLabel?.includes('T2'));
  assert.match(row.props.accessibilityLabel, /Dự kiến chưa có kcal/);
  assert.match(row.props.accessibilityLabel, /Đã ăn ít nhất 0 kcal/);
});

test('diary review selects its displayed week before asking and consumes its request once', () => {
  usePlannerRequestStore.getState().queue({ draft: 'Nhận xét tuần này', week: '2026-11-23', token: 'A' });
  const changes = [];
  const sent = [];
  const planner = { busy: false, weekStart: '2026-11-30', currentWeekStart: '2026-11-23', weeks: ['2026-11-23'], changeWeek: (week) => { changes.push(week); planner.weekStart = week; }, setComposer: (prompt) => changes.push(prompt), setFormOpen: (value) => changes.push(value), setChatError: (message) => changes.push(message), sendMessage: (prompt) => sent.push([planner.weekStart, prompt]) };
  render(usePlannerDraft, planner); assert.deepEqual(changes, ['2026-11-23']); assert.deepEqual(sent, []);
  render(usePlannerDraft, planner);
  assert.deepEqual(changes, ['2026-11-23', 'Nhận xét tuần này', false]); assert.deepEqual(sent, [['2026-11-23', 'Nhận xét tuần này']]);
  render(usePlannerDraft, planner); assert.equal(sent.length, 1); assert.equal(usePlannerRequestStore.getState().request, null);
  usePlannerRequestStore.getState().queue({ draft: 'Out of range', week: '2026-10-05', token: 'A' }); render(usePlannerDraft, planner);
  assert.match(changes.at(-1), /Chưa mở được/);
});

test('a review fills the composer without queuing another AI request while the assistant is busy', () => {
  usePlannerRequestStore.getState().queue({ draft: 'Nhận xét tuần này', week: '2026-11-23', token: 'A' });
  const changes = [], sent = [];
  const planner = { busy: true, weekStart: '2026-11-23', currentWeekStart: '2026-11-23', weeks: ['2026-11-23'], setComposer: (text) => changes.push(text), setFormOpen: () => {}, sendMessage: (prompt) => sent.push(prompt) };
  render(usePlannerDraft, planner); assert.deepEqual(changes, ['Nhận xét tuần này']); assert.deepEqual(sent, []);
  planner.busy = false; render(usePlannerDraft, planner); assert.deepEqual(sent, []);
});

test('old-session requests and external URL parameters cannot automatically ask the assistant', () => {
  const sent = [];
  const planner = { currentWeekStart: '2026-11-23', sendMessage: (prompt) => sent.push(prompt) };
  params = { draft: 'External request', week: '2026-11-23' };
  render(usePlannerDraft, planner); assert.deepEqual(sent, []);
  usePlannerRequestStore.getState().queue({ draft: 'Old user request', week: '2026-11-23', token: 'B' });
  render(usePlannerDraft, planner); assert.deepEqual(sent, []); assert.equal(usePlannerRequestStore.getState().request, null);
});
