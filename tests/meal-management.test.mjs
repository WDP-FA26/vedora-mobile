import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { beforeEach, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
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
      return { format: 'module', shortCircuit: true, source: new URL(url).pathname.endsWith('.tsx') ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
const client = new QueryClient();
let slots, cursor, effects, session, requests, respond, queryResult, shownPlan, plannerView;
let dimensions = { width: 390, fontScale: 1 };
const copied = [], routes = [];
const stored = new Map();
mock.module('react', { exports: {
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
  useEffect(effect, deps) { const index = cursor++, previous = slots[index]; if (!deps || !previous || deps.some((value, i) => value !== previous.deps[i])) effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; }); },
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { exports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { exports: { ActivityIndicator: 'Spinner', Image: 'Image', KeyboardAvoidingView: 'KeyboardAvoidingView', Modal: 'Modal', Platform: { OS: 'android' }, Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', TextInput: 'TextInput', View: 'View', StyleSheet: { create: (styles) => styles, hairlineWidth: 1 }, useWindowDimensions: () => dimensions } });
mock.module('expo-symbols', { exports: { SymbolView: 'SymbolView' } });
mock.module('expo-router', { exports: { router: { push: (route) => routes.push(route) } } });
mock.module('expo-clipboard', { exports: { setStringAsync: async (text) => { copied.push(text); } } });
mock.module('react-native-safe-area-context', { exports: { SafeAreaView: 'SafeAreaView' } });
mock.module('@tanstack/react-query', { exports: { useQueryClient: () => client, useQuery: (options) => ({ ...(options.queryKey[0] === 'meal-plan' ? { data: shownPlan } : queryResult), ...(options.enabled === false ? { data: undefined } : {}), options }), useInfiniteQuery: () => ({}), useMutation: (options) => ({ isPending: false, mutateAsync: options.mutationFn }) } });
const useSessionStore = (select) => select(session);
useSessionStore.getState = () => session;
mock.module(local('shared/stores/session-store.ts'), { exports: { useSessionStore } });
mock.module(local('hooks/use-theme.ts'), { exports: { useTheme: () => ({}) } });
mock.module(local('shared/api/api-client.ts'), { exports: { apiClient: {} } });
mock.module(local('shared/api/ai-stream.ts'), { exports: { requestAiStream: () => {} } });
mock.module(local('features/meal-plan/hooks/meal-planner-provider.tsx'), { exports: { useMealPlanner: () => plannerView } });
mock.module(local('shared/components/chat/assistant-header.tsx'), { exports: { AssistantHeader: 'AssistantHeader' } });
mock.module(local('features/meal-plan/components/meal-recipe-photo.tsx'), { exports: { MealRecipePhoto: 'MealRecipePhoto' } });
mock.module(local('features/recipes/hooks/use-recipes.ts'), { exports: { useRecipes: () => ({}) } });
mock.module(local('shared/api/request-json.ts'), { exports: { requestJson: async (schema, config) => { requests.push(config); return schema.parse(await respond(config)); } } });
mock.module(local('features/meal-plan/services/shopping-preferences.ts'), { exports: {
  shoppingStorageKey: (userId, week) => `${userId}:${week}`,
  readShoppingPreferences: async (key) => stored.get(key) ?? { people: 1, checked: [] },
  writeShoppingPreferences: async (key, value) => { stored.set(key, value); },
} });
globalThis.require = (asset) => asset;

const edit = await import('../src/features/meal-plan/utils/meal-edit.ts');
const shopping = await import('../src/features/meal-plan/utils/shopping-list.ts');
const services = await import('../src/features/meal-plan/services/meal-edit.service.ts');
const { getShoppingList } = await import('../src/features/meal-plan/services/shopping-list.service.ts');
const { useMealPlanActions } = await import('../src/features/meal-plan/hooks/use-meal-plan-actions.ts');
const { useShoppingList } = await import('../src/features/meal-plan/hooks/use-shopping-list.ts');
const { QuickGenerateSheet } = await import('../src/features/meal-plan/components/quick-generate-sheet.tsx');
const { MealWeekSelector } = await import('../src/features/meal-plan/components/meal-week-selector.tsx');
const { MealSelectField } = await import('../src/features/meal-plan/components/meal-select-field.tsx');
const { MealPlanActions } = await import('../src/features/meal-plan/components/meal-plan-actions.tsx');
const { MealRecipeActions } = await import('../src/features/meal-plan/components/meal-recipe-actions.tsx');
const { MealEditSheet } = await import('../src/features/meal-plan/components/meal-edit-sheet.tsx');
const { MealPlanScreen } = await import('../src/features/meal-plan/components/meal-plan-screen.tsx');
const { ShoppingListPanel } = await import('../src/features/meal-plan/components/shopping-list-panel.tsx');
const { planningWeeks, addCalendarDays } = await import('../src/features/meal-plan/utils/meal-week.ts');
const { weekdays, mealSections } = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { mealPlanKeys } = await import('../src/features/meal-plan/data/meal-plan.keys.ts');
const id = (value) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const recipe = (value) => ({ id: id(value), title: `Món ${value}`, servings: 2, prepMinutes: 5, cookMinutes: 10, ingredients: [], steps: [] });
function plan() {
  return { weekStart: '2026-11-23', currentWeekStart: '2026-11-23', today: '2026-11-27', minWeekStart: '2026-11-09', maxWeekStart: '2026-12-21', editable: true, problems: [],
    days: weekdays.map((day, index) => ({ day, date: addCalendarDays('2026-11-23', index), editable: index >= 4, sections: mealSections.map((section) => ({ section, recipes: day === 'FRI' && section === 'LUNCH' ? [recipe(1)] : [] })) })) };
}
const fri = { day: 'FRI', section: 'LUNCH' }, sat = { day: 'SAT', section: 'DINNER' };
const sectionOf = (value, slot) => value.days.find(({ day }) => day === slot.day).sections.find(({ section }) => section === slot.section);
const request = { weekStart: '2026-11-23', days: ['SAT'], sections: ['DINNER'], onlyEmpty: true };
const preview = () => ({ weekStart: request.weekStart, days: [{ day: 'SAT', sections: [{ section: 'DINNER', recipes: [recipe(2)], previous: [] }] }], problems: [] });
const render = (fn) => { cursor = 0; effects = []; const result = fn(); effects.forEach((effect) => effect()); return result; };
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function nodes(node) { if (Array.isArray(node)) return node.flatMap(nodes); if (!node || typeof node !== 'object') return []; return [node, ...nodes(node.props?.children), ...nodes(node.props?.footer)]; }
function control(tree, label) { const found = nodes(tree).find(({ props }) => props?.label === label); assert.ok(found, `Missing control: ${label}`); return found.props; }
function accessible(tree, label) { const found = nodes(tree).find(({ props }) => props?.accessibilityLabel === label); assert.ok(found, `Missing accessible control: ${label}`); return found.props; }
beforeEach(() => { slots = []; cursor = 0; effects = []; session = { accessToken: 'personal-token', userId: 'user-a', actor: null }; requests = []; respond = () => plan(); queryResult = {}; shownPlan = plan(); copied.length = 0; routes.length = 0; dimensions = { width: 390, fontScale: 1 }; client.clear(); stored.clear(); });

test('a cross-day move is atomic and preserves the other meals on both days', () => {
  const value = plan(); sectionOf(value, { day: 'FRI', section: 'BREAKFAST' }).recipes = [recipe(3)];
  sectionOf(value, { day: 'SAT', section: 'OTHER' }).recipes = [recipe(4)];
  const changes = edit.editChanges(value, { kind: 'move', slot: fri, to: sat, recipeId: id(1) });
  assert.deepEqual(edit.inputsForChanges(value, changes), [
    { day: 'FRI', breakfast: [id(3)], lunch: [], dinner: [], others: [] },
    { day: 'SAT', breakfast: [], lunch: [], dinner: [id(1)], others: [id(4)] },
  ]);
  assert.deepEqual(edit.slotIds(value, fri), [id(1)], 'The source query data stays immutable before save');
  const withinDay = edit.editChanges(value, { kind: 'move', slot: fri, to: { ...fri, section: 'DINNER' }, recipeId: id(1) });
  assert.equal(edit.inputsForChanges(value, withinDay).length, 1);
});

test('locked source/destination, duplicate dishes, full meals and removed dishes are rejected', () => {
  const value = plan();
  assert.throws(() => edit.inputsForChanges(value, [{ day: 'MON', section: 'LUNCH', recipeIds: [] }]), /đã qua/);
  assert.throws(() => edit.inputsForChanges({ ...value, editable: false }, [{ ...fri, recipeIds: [] }]), /xem lại/);
  assert.throws(() => edit.editChanges(value, { kind: 'add', slot: fri, recipeId: id(1) }), /đã có/);
  assert.throws(() => edit.editChanges(value, { kind: 'remove', slot: sat, recipeId: id(1) }), /đã thay đổi/);
  assert.throws(() => edit.editChanges(value, { kind: 'move', slot: fri, to: fri, recipeId: id(1) }), /bữa khác/);
  sectionOf(value, sat).recipes = [recipe(1)];
  assert.throws(() => edit.editChanges(value, { kind: 'move', slot: fri, to: sat, recipeId: id(1) }), /đã có/);
  sectionOf(value, sat).recipes = [2, 3, 4, 5, 6].map(recipe);
  assert.throws(() => edit.inputsForChanges(value, edit.editChanges(value, { kind: 'move', slot: fri, to: sat, recipeId: id(1) })), /tối đa 5/);
});

test('undo only restores affected slots and refuses to overwrite a later edit', () => {
  const value = plan(), changes = [{ ...fri, recipeIds: [id(2)] }];
  const previous = edit.undoFor(value, changes);
  sectionOf(value, fri).recipes = [recipe(2)];
  sectionOf(value, sat).recipes = [recipe(3)];
  edit.assertUndoCurrent(value, changes);
  assert.deepEqual(edit.inputsForChanges(value, previous)[0].lunch, [id(1)]);
  sectionOf(value, fri).recipes.push(recipe(4));
  assert.throws(() => edit.assertUndoCurrent(value, changes), /chỉnh tiếp/);
});

test('quick generation accepts selected slots and catches empty, stale and mismatched proposals', () => {
  assert.deepEqual(edit.generatedChanges(plan(), preview(), request), [{ ...sat, recipeIds: [id(2)] }]);
  assert.throws(() => edit.generatedChanges(plan(), { ...preview(), days: [] }, request), /Không tìm/);
  assert.throws(() => edit.generatedChanges(plan(), preview(), { ...request, sections: ['LUNCH'] }), /Không tìm/);
  assert.throws(() => edit.generatedChanges(plan(), { ...preview(), weekStart: '2026-11-30' }, request), /không thuộc tuần/);
  const changed = plan(); sectionOf(changed, sat).recipes = [recipe(3)];
  assert.throws(() => edit.generatedChanges(changed, preview(), request), /đã thay đổi/);
  const fullDay = preview();
  fullDay.days[0].sections.push({ section: 'LUNCH', recipes: [recipe(4)], previous: [recipe(4)] });
  assert.deepEqual(edit.generatedChanges(plan(), fullDay, request), [{ ...sat, recipeIds: [id(2)] }]);
});

test('API boundaries validate payloads and do not accidentally fetch a whole week with no selected days', async () => {
  const signal = new AbortController().signal;
  await services.saveMealDays({ weekStart: request.weekStart, days: edit.inputsForChanges(plan(), [{ ...fri, recipeIds: [] }]) }, signal);
  assert.equal(requests[0].method, 'PUT'); assert.equal(requests[0].url, '/meal-plan/days'); assert.equal(requests[0].signal, signal);
  assert.throws(() => services.saveMealDays({ weekStart: '2026-11-24', days: [] }));
  assert.throws(() => getShoppingList(request.weekStart, []));
  respond = () => ({ weekStart: request.weekStart, days: ['SAT'], quantityBasis: 'RECIPE_PER_OCCURRENCE', items: [] });
  await getShoppingList(request.weekStart, ['SAT'], signal);
  assert.deepEqual(requests.at(-1).params, { weekStart: request.weekStart, days: 'SAT' });
});

test('generation saves once, refreshes shopping, and undo uses the saved week', async () => {
  let server = plan();
  respond = (config) => {
    if (config.url.endsWith('/generate')) return preview();
    if (config.method === 'PUT') {
      for (const day of config.data.days) for (const [section, field] of Object.entries({ BREAKFAST: 'breakfast', LUNCH: 'lunch', DINNER: 'dinner', OTHER: 'others' })) sectionOf(server, { day: day.day, section }).recipes = day[field].map((value) => recipe(Number(value.slice(-12))));
    }
    return structuredClone(server);
  };
  client.setQueryData(mealPlanKeys.week(request.weekStart), plan());
  client.setQueryData(mealPlanKeys.shoppingList(request.weekStart, ['SAT']), { items: [] });
  const hook = () => useMealPlanActions(session.accessToken, plan(), false);
  let actions = render(hook);
  assert.equal(await actions.generate(request), true);
  assert.deepEqual(requests.map(({ method }) => method), ['GET', 'POST', 'GET', 'PUT']);
  assert.deepEqual(edit.slotIds(client.getQueryData(mealPlanKeys.week(request.weekStart)), sat), [id(2)]);
  assert.equal(client.getQueryState(mealPlanKeys.shoppingList(request.weekStart, ['SAT'])).isInvalidated, true);
  actions = render(hook); assert.equal(actions.canUndo, true);
  assert.equal(await actions.undo(), true);
  assert.deepEqual(edit.slotIds(server, sat), []);
  assert.equal(requests.at(-1).data.weekStart, request.weekStart);
});

test('failed generation never saves, duplicate taps share a lock, and a session switch prevents saving', async () => {
  let release;
  respond = (config) => config.url.endsWith('/generate') ? new Promise((resolve) => { release = resolve; }) : plan();
  const hook = () => useMealPlanActions(session.accessToken, plan(), false);
  const actions = render(hook), work = actions.generate(request);
  await flush();
  assert.equal(await actions.generate(request), false);
  session = { ...session, accessToken: 'other-token', userId: 'user-b' };
  release(preview()); await work;
  assert.equal(requests.filter(({ method }) => method === 'PUT').length, 0);
  session.accessToken = 'personal-token';
  respond = (config) => config.url.endsWith('/generate') ? { ...preview(), days: [] } : plan();
  await render(hook).generate(request);
  assert.equal(requests.filter(({ method }) => method === 'PUT').length, 0);
  assert.match(render(hook).error, /Không tìm/);
});

const ingredient = (contributions, extra = {}) => ({ ingredientId: 'tofu', name: 'Đậu hũ', unit: 'g', knownQuantity: '500', hasUnknownQuantity: false, contributions: contributions.map(([quantity, servings]) => ({ recipeId: id(1), recipeTitle: 'Món đậu', day: 'SAT', section: 'DINNER', quantity, servings, note: null })), ...extra });
test('shopping scales each recipe yield, keeps zero/unknown amounts and separates mixed units', () => {
  const item = ingredient([['200', 2], ['300', 3]]);
  assert.equal(shopping.itemAmount(item, 2), '400 g');
  assert.equal(shopping.itemAmount(ingredient([['0', 2]]), 2), '0 g');
  assert.equal(shopping.itemAmount(ingredient([['200', 2], [null, 3]]), 2), '200 g + phần chưa rõ lượng');
  assert.equal(shopping.itemAmount(ingredient([[null, 2]]), 2), 'Chưa rõ lượng (g)');
  assert.notEqual(shopping.shoppingItemKey(item), shopping.shoppingItemKey({ ...item, unit: 'miếng' }));
  assert.equal(shopping.shoppingMatches('Đậu hũ trắng', ['dau hu']), true);
  assert.equal(shopping.shoppingMatches('Đậu hũ', [' ']), false);
  assert.match(shopping.shoppingText({ items: [item] }, 2, [shopping.shoppingItemKey(item)]), /\[x\] Đậu hũ: 400 g/);
});

test('shopping preferences are scoped by account/week and voice check commands apply once', async () => {
  const item = ingredient([['200', 2]]), key = shopping.shoppingItemKey(item);
  queryResult = { data: { items: [item], days: ['SAT'] }, isFetching: false };
  const command = { kind: 'shoppingList', people: 3, checkItems: ['dau hu'] };
  const hook = () => useShoppingList(request.weekStart, ['SAT'], command);
  render(hook); await flush(); render(hook);
  let value = render(hook); assert.equal(value.preferences.people, 3); assert.deepEqual(value.preferences.checked, [key]);
  value.toggle(key); value = render(hook); assert.deepEqual(value.preferences.checked, [], 'Voice command does not re-check after manual uncheck');
  session = { ...session, userId: 'user-b', accessToken: 'other-token' };
  value = render(() => useShoppingList(request.weekStart, ['SAT'])); assert.equal(value.ready, false);
  await flush(); value = render(() => useShoppingList(request.weekStart, ['SAT']));
  assert.deepEqual(value.preferences, { people: 1, checked: [] });
  assert.equal(stored.get(`user-a:${request.weekStart}`).people, 3);
  assert.equal(render(() => useShoppingList(request.weekStart, [])).data.options.enabled, false);
});

test('week navigation includes history and disables its bounds; generation UI excludes past days', async () => {
  const value = plan(), weeks = planningWeeks(value);
  assert.equal(weeks[0], value.minWeekStart);
  let tree = MealWeekSelector({ weeks, selected: weeks[0], currentWeekStart: value.currentWeekStart, onChange() {} });
  assert.equal(nodes(tree).find(({ props }) => props?.accessibilityLabel === 'Tuần trước').props.disabled, true);
  const generated = [];
  const planner = { plan: { data: value }, busy: false, mealActions: { generate: async (input) => { generated.push(input); return false; } } };
  tree = render(() => QuickGenerateSheet({ planner, onClose() {} }));
  await control(tree, 'Lên món và lưu thực đơn').onPress(); await flush();
  assert.deepEqual(generated[0].days, ['FRI', 'SAT', 'SUN']);
  assert.equal(generated[0].onlyEmpty, true);
  control(tree, 'Phạm vi lên món').onChange(['TODAY']); tree = render(() => QuickGenerateSheet({ planner, onClose() {} }));
  await control(tree, 'Lên món và lưu thực đơn').onPress(); await flush();
  assert.deepEqual(generated[1].days, ['FRI']);
  control(tree, 'Bữa ăn').onChange(['LUNCH', 'DINNER']);
  control(tree, 'Thời gian nấu tối đa').onChange(['30']);
  tree = render(() => QuickGenerateSheet({ planner, onClose() {} }));
  await control(tree, 'Lên món và lưu thực đơn').onPress(); await flush();
  assert.deepEqual(generated[2].sections, ['LUNCH', 'DINNER']); assert.equal(generated[2].maxMinutes, 30);
  control(tree, 'Bữa ăn').onChange([]); tree = render(() => QuickGenerateSheet({ planner, onClose() {} }));
  assert.equal(control(tree, 'Lên món và lưu thực đơn').disabled, true);
  planner.busy = true; tree = render(() => QuickGenerateSheet({ planner, onClose() {} }));
  assert.equal(control(tree, 'Đang lên và lưu món…').disabled, true);
});

test('multi-select stays open while toggling, excludes locked options from select-all and supports clear/done', () => {
  let values = ['FRI'];
  const props = { label: 'Ngày đi chợ', multiple: true, options: [{ value: 'MON', label: 'T2', disabled: true }, { value: 'FRI', label: 'T6' }, { value: 'SAT', label: 'T7' }], onChange: (next) => { values = next; } };
  const draw = () => render(() => MealSelectField({ ...props, values }));
  let tree = draw();
  assert.equal(nodes(tree).some(({ props }) => props?.accessibilityRole === 'checkbox'), false);
  accessible(tree, 'Ngày đi chợ: T6').onPress(); tree = draw();
  assert.equal(accessible(tree, 'T2').disabled, true);
  assert.equal(accessible(tree, 'T6').accessibilityState.checked, true);
  accessible(tree, 'T7').onPress(); tree = draw();
  assert.deepEqual(values, ['FRI', 'SAT']);
  assert.equal(accessible(tree, 'Ngày đi chợ: T6, T7').accessibilityState.expanded, true);
  const textButton = (label) => nodes(tree).find(({ type, props }) => type === 'Pressable' && nodes(props.children).some(({ props }) => props?.children === label)).props;
  textButton('Bỏ chọn').onPress(); tree = draw(); assert.deepEqual(values, []);
  textButton('Chọn tất cả').onPress(); tree = draw(); assert.deepEqual(values, ['FRI', 'SAT']);
  accessible(tree, 'Xong chọn ngày đi chợ').onPress(); tree = draw();
  assert.equal(accessible(tree, 'Ngày đi chợ: T6, T7').accessibilityState.expanded, false);
});

test('single-select closes after selection and a busy field cannot expose its options', () => {
  let values = ['1'];
  const props = { label: 'Số người ăn', options: [{ value: '1', label: '1 người' }, { value: '2', label: '2 người' }], onChange: (next) => { values = next; } };
  const draw = (disabled = false) => render(() => MealSelectField({ ...props, values, disabled }));
  let tree = draw(); accessible(tree, 'Số người ăn: 1 người').onPress(); tree = draw();
  accessible(tree, '2 người').onPress(); tree = draw();
  assert.deepEqual(values, ['2']); assert.equal(accessible(tree, 'Số người ăn: 2 người').accessibilityState.expanded, false);
  accessible(tree, 'Số người ăn: 2 người').onPress(); tree = draw(true);
  assert.equal(accessible(tree, 'Số người ăn: 2 người').disabled, true);
  assert.equal(nodes(tree).some(({ props }) => props?.accessibilityRole === 'radio'), false);
});

test('compact shopping/quick actions share one row and stay outside the calendar scroll', () => {
  const pressed = [];
  let tree = MealPlanActions({ onShopping: () => pressed.push('shopping'), onQuick: () => pressed.push('quick') });
  accessible(tree, 'Đi chợ').onPress(); accessible(tree, 'Lên nhanh').onPress();
  assert.deepEqual(pressed, ['shopping', 'quick']);
  dimensions = { width: 320, fontScale: 1.5 };
  tree = MealPlanActions({ onShopping() {}, onQuick() {}, quickDisabled: true, readOnly: true });
  assert.equal(tree.props.style.flexDirection, 'row');
  for (const label of ['Đi chợ', 'Lên nhanh']) assert.equal(accessible(tree, label).style({ pressed: false })[0].minHeight, 46);
  assert.equal(accessible(tree, 'Lên nhanh').disabled, true);
  plannerView = { plan: { data: shownPlan }, days: shownPlan.days, activeDay: shownPlan.days[4], weekStart: shownPlan.weekStart, currentWeekStart: shownPlan.currentWeekStart, weeks: planningWeeks(shownPlan), busy: false, weekend: true, mealActions: { canUndo: false }, changeWeek: (week) => pressed.push(week), startForm() {} };
  tree = render(MealPlanScreen);
  const children = tree.props.children;
  assert.ok(children.findIndex((node) => node?.type === MealPlanActions) < children.findIndex((node) => node?.type === 'ScrollView'));
  const scroll = children.find((node) => node?.type === 'ScrollView');
  assert.equal(nodes(scroll).some(({ type }) => type === MealPlanActions), false);
  control(tree, 'Lên thực đơn tuần sau').onPress(); assert.equal(pressed.at(-1), '2026-11-30');
});

test('dish actions call their distinct handlers, use icons on narrow screens and keep accessible names', () => {
  const pressed = [], props = { title: 'Đậu hũ sốt nấm', onMove: () => pressed.push('move'), onRemove: () => pressed.push('remove'), onReplace: () => pressed.push('replace') };
  let tree = MealRecipeActions(props);
  assert.equal(nodes(tree).filter(({ type }) => type === 'Text').length, 3);
  for (const label of ['Chuyển', 'Gỡ', 'Đổi']) accessible(tree, `${label} món Đậu hũ sốt nấm`).onPress();
  assert.deepEqual(pressed, ['move', 'remove', 'replace']);
  dimensions = { width: 320, fontScale: 1.5 };
  tree = MealRecipeActions({ ...props, disabled: true });
  assert.equal(nodes(tree).filter(({ type }) => type === 'Text').length, 0);
  for (const label of ['Chuyển', 'Gỡ', 'Đổi']) {
    const button = accessible(tree, `${label} món Đậu hũ sốt nấm`);
    assert.equal(button.disabled, true); assert.equal(button.style({ pressed: false })[0].minHeight, 44);
  }
});

test('the direct remove action opens confirmation and never removes a dish when Keep is chosen', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const edits = [], selection = { ...fri, recipe: recipe(1), action: 'remove' };
  let closed = false;
  const planner = { plan: { data: plan() }, busy: false, mealActions: { edit: async (value) => { edits.push(value); return true; } } };
  const draw = () => render(() => MealEditSheet({ planner, selection, onClose: () => { closed = true; } }));
  let tree = draw(); assert.equal(edits.length, 0); control(tree, 'Giữ món').onPress(); tree = draw();
  assert.equal(nodes(tree).some(({ props }) => props?.label === 'Xác nhận gỡ món'), false);
  assert.equal(edits.length, 0);
  control(tree, 'Gỡ món').onPress(); tree = draw();
  await control(tree, 'Xác nhận gỡ món').onPress(); await flush();
  assert.equal(edits[0].kind, 'remove'); assert.equal(edits[0].recipeId, id(1)); assert.equal(closed, true);
});

test('the direct move action opens destination dropdowns and saves the chosen meal', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const edits = [], selection = { ...fri, recipe: recipe(1), action: 'move' };
  const planner = { plan: { data: plan() }, busy: false, mealActions: { edit: async (value) => { edits.push(value); return true; } } };
  const draw = () => render(() => MealEditSheet({ planner, selection, onClose() {} }));
  let tree = draw(); assert.equal(control(tree, 'Xác nhận chuyển món').disabled, true);
  control(tree, 'Chuyển đến ngày').onChange(['SAT']); tree = draw();
  control(tree, 'Chuyển đến bữa').onChange(['DINNER']); tree = draw();
  assert.equal(control(tree, 'Xác nhận chuyển món').disabled, false);
  await control(tree, 'Xác nhận chuyển món').onPress(); await flush();
  assert.equal(edits[0].kind, 'move'); assert.deepEqual(edits[0].to, sat);
});

test('shopping dropdowns change dates/people without losing checkbox state or Voice context', async () => {
  const item = ingredient([['200', 2]]), snapshots = [], contexts = [], opened = [];
  queryResult = { data: { items: [item], days: ['FRI', 'SAT', 'SUN'] }, isFetching: false };
  const props = { weekStart: shownPlan.weekStart, onSnapshot: (value) => snapshots.push(value), onContext: (value) => contexts.push(value), onRecipe: (...args) => opened.push(args) };
  const draw = () => render(() => ShoppingListPanel(props));
  draw(); await flush(); let tree = draw();
  assert.equal(control(tree, 'Ngày đi chợ').multiple, true);
  assert.equal(control(tree, 'Ngày đi chợ').options.find(({ value }) => value === 'MON').disabled, true);
  control(tree, 'Ngày đi chợ').onChange(['SAT']); control(tree, 'Số người ăn').onChange(['3']); tree = draw();
  assert.deepEqual(snapshots.at(-1).shoppingDays, ['SAT']); assert.equal(snapshots.at(-1).shoppingPeople, 3);
  accessible(tree, 'Đã mua Đậu hũ (g)').onPress(); tree = draw();
  assert.equal(snapshots.at(-1).shoppingCheckedCount, 1); assert.match(contexts.at(-1), /\[x\] Đậu hũ: 300 g/);
  accessible(tree, 'Xem món dùng Đậu hũ').onPress(); tree = draw();
  control(tree, 'Món đậu · Xem công thức ↗').onPress(); assert.equal(opened[0][0], id(1));
  await control(tree, 'Sao chép danh sách').onPress(); await flush(); assert.match(copied.at(-1), /300 g/);
  control(tree, 'Ngày đi chợ').onChange([]); tree = draw();
  assert.deepEqual(snapshots.at(-1).shoppingDays, []);
  assert.equal(nodes(tree).some(({ props }) => props?.accessibilityRole === 'checkbox'), false);
});
