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
  useMemo: (factory) => factory(), useCallback: (callback) => callback, createContext: () => 'context', use: () => {},
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
mock.module('react-native', { namedExports: { PanResponder: { create: (handlers) => ({ panHandlers: handlers }) }, View: 'View', Text: 'Text', Pressable: 'Pressable', Modal: 'Modal', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: (styles) => styles } } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });

const schema = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { addCalendarDays, planningWeeks, isPlanningWeekend } = await import('../src/features/meal-plan/utils/meal-week.ts');
const { displayDays, avoidedIngredientsForRecipe } = await import('../src/features/meal-plan/utils/meal-plan.ts');
const { savedPlanChanges } = await import('../src/features/meal-plan/utils/planner-changes.ts');
const interactions = await import('../src/features/meal-plan/utils/planner-interactions.ts');
const { PlannerQuestionCard, PlannerWebConsentCard, PlannerRewindDialog } = await import('../src/features/meal-plan/components/planner-interaction-cards.tsx');
const { PlannerMessageActions } = await import('../src/features/meal-plan/components/planner-message-actions.tsx');
const service = await import('../src/features/meal-plan/services/meal-plan.service.ts');
const { ApiError } = await import('../src/shared/api/api-error.ts');
const { assistantErrorText } = await import('../src/features/blogs/hooks/use-blog-assistant.ts');
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
  slots = []; requests.length = 0; routes.length = 0; client.clear(); currentToken = 'session'; holdRead = undefined;
  respond = (config) => plan(config.params?.weekStart); streamFailure = null; streamParts = [];
  streamResult = { text: '', tools: [], parts: [], refused: false };
}

test('swiping reveals the rewind icon while holding or accessibility actions open confirmation directly', () => {
  let revealed = 0, rewound = 0;
  const props = { text: 'message', children: 'bubble', open: false, disabled: false,
    onReveal: () => revealed++, onDismiss: () => {}, onRewind: () => rewound++ };
  let row = PlannerMessageActions(props);
  assert.equal(row.props.children[1], null);
  const gesture = (dx, dy) => ({ dx, dy });
  assert.equal(row.props.onMoveShouldSetPanResponderCapture(null, gesture(5, 60)), false);
  assert.equal(row.props.onMoveShouldSetPanResponderCapture(null, gesture(45, 5)), true);
  row.props.onPanResponderRelease(null, gesture(20, 2));
  row.props.onPanResponderRelease(null, gesture(5, 60));
  assert.equal(revealed, 0);
  row.props.onPanResponderRelease(null, gesture(-45, 5));
  assert.equal(revealed, 1);
  assert.equal(rewound, 0);
  row.props.children[0].props.onLongPress();
  assert.equal(rewound, 1);
  row.props.children[0].props.onAccessibilityAction({ nativeEvent: { actionName: 'showRewind' } });
  assert.equal(revealed, 1);
  assert.equal(rewound, 2);
  row = PlannerMessageActions({ ...props, open: true });
  row.props.children[1].props.onPress();
  assert.equal(rewound, 3);
  row = PlannerMessageActions({ ...props, open: true, disabled: true });
  assert.equal(row.props.children[1], null);
  assert.equal(row.props.onMoveShouldSetPanResponderCapture(null, gesture(45, 5)), false);
  row.props.onPanResponderRelease(null, gesture(45, 5));
  assert.equal(revealed, 1);
});
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

test('blog assistant keeps model and overload messages for structured stream errors', () => {
  for (const code of ['MODEL_ERROR', 'RATE_LIMITED']) {
    assert.equal(assistantErrorText(new ApiError(null, code, 'Assistant stream failed')), assistantErrorText(new Error(code)));
  }
});

test('immediate HTTP and model failures show their actual category instead of a misleading lost connection warning', async () => {
  for (const [error, expected] of [
    [new ApiError(400, 'BAD_REQUEST', 'Debug-only detail'), 'HTTP 400'],
    [new ApiError(503, 'SERVICE_UNAVAILABLE', 'Debug-only detail'), 'HTTP 503'],
    [new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Debug-only detail'), 'HTTP 500'],
    [new ApiError(null, 'MODEL_ERROR', 'Debug-only detail'), 'MODEL_ERROR'],
    [new ApiError(null, 'RATE_LIMITED', 'Debug-only detail'), 'RATE_LIMITED'],
  ]) {
    reset(); streamFailure = error;
    await render().sendMessage('Hello');
    assert.ok(render().chatError.includes(expected));
    assert.equal(render().chatError.includes('Debug-only detail'), false);
    assert.equal(render().chatError.includes('gián đoạn'), false);
    assert.equal(render().chatError.includes('có thể đã'), false);
  }
  reset(); streamParts = [part()]; streamFailure = new ApiError(null, 'MODEL_ERROR', 'Hidden detail');
  await render().sendMessage('Replace dinner');
  assert.ok(render().chatError.includes('MODEL_ERROR'));
  assert.ok(render().chatError.includes('có thể đã'));
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

const questionPart = (multiple = false) => ({ type: 'tool-askUser', toolCallId: 'question', state: 'input-available', input: { question: 'Choose dinner', options: ['Soup', 'Tofu'], multiple } });
const webPart = () => ({ type: 'tool-requestWebSearch', toolCallId: 'web', state: 'input-available', input: { reason: 'Look up a dish outside the catalog' } });
function mockThread(parts) {
  let saved = { id: 'history', messages: [{ id: 'server-assistant', role: 'assistant', text: '', parts }] };
  respond = (config) => {
    if (config.method === 'PATCH') saved = { ...saved, messages: config.data.messages };
    return saved;
  };
  return saved;
}

test('interaction parsing rejects malformed inputs and enables only the last finished request', () => {
  assert.equal(interactions.openPlannerInteraction([]), null);
  assert.equal(interactions.openPlannerInteraction([{ role: 'assistant', text: '' }]), null);
  const turn = { role: 'assistant', text: '', toolParts: [questionPart(), webPart()] };
  assert.equal(interactions.openPlannerInteraction([turn]).kind, 'web');
  assert.equal(interactions.openPlannerInteraction([{ ...turn, streaming: true }]), null);
  assert.equal(interactions.openPlannerInteraction([{ ...turn, refused: true }]), null);
  assert.equal(interactions.openPlannerInteraction([turn, { role: 'user', text: 'Skip' }]), null);
  assert.deepEqual(interactions.turnQuestions({ ...turn, toolParts: [{ ...questionPart(), input: { options: [] } }] }), []);
});

test('a picked answer patches the canonical message once and carries the question and recipe IDs into the next turn', async () => {
  reset();
  const tools = [part('searchRecipes', [{ id: 'recipe-123', title: 'Soup' }], 'search'), questionPart()];
  streamResult.parts = tools;
  await render().sendMessage('Choose dinner');
  mockThread(tools);
  const planner = render();
  assert.notEqual(planner.turns.at(-1).id, 'server-assistant');
  await Promise.all([planner.answerQuestion('question', 'Soup'), planner.answerQuestion('question', 'Soup')]);
  const patch = requests.find((request) => request.method === 'PATCH');
  assert.equal(patch.data.messages.length, 1);
  assert.equal(patch.data.messages[0].id, 'server-assistant');
  assert.equal(patch.data.messages[0].parts.at(-1).output.answer, 'Soup');
  assert.equal(requests.filter((request) => request.method === 'PATCH').length, 1);
  const chat = requests.filter((request) => request.url === '/meal-plan/chat').at(-1);
  assert.ok(chat.data.messages.at(-2).text.includes('Choose dinner'));
  assert.ok(chat.data.messages.at(-2).text.includes('recipe-123'));
  assert.equal(chat.data.messages.at(-1).text, 'Soup');
  assert.equal(chat.data.allowWebSearch, false);
});

test('typing a custom answer resolves the current question; stale cards cannot send', async () => {
  reset(); mockThread([questionPart(true)]);
  await render().openThread('history');
  await render().sendMessage('Something else');
  assert.equal(requests.find((r) => r.method === 'PATCH').data.messages[0].parts[0].output.answer, 'Something else');
  const before = requests.length;
  await render().answerQuestion('old-call', 'Tofu');
  assert.equal(requests.length, before);
});

test('web search requires an explicit approval, persists in its thread and resets in a new conversation', async () => {
  reset(); mockThread([webPart()]);
  await render().openThread('history');
  assert.equal(render().webSearchAllowed, false);
  await render().answerWebSearch('web', true);
  assert.equal(requests.find((r) => r.url === '/meal-plan/chat').data.allowWebSearch, true);
  assert.equal(render().webSearchAllowed, true);
  await render().sendMessage('Continue');
  assert.equal(requests.filter((r) => r.url === '/meal-plan/chat').at(-1).data.allowWebSearch, true);
  render().startNewChat();
  assert.equal(render().webSearchAllowed, false);
  await render().sendMessage('New request');
  assert.equal(requests.filter((r) => r.url === '/meal-plan/chat').at(-1).data.allowWebSearch, false);
});

test('reopening saved history restores the consent decision and rewind before its reply removes the permission', async () => {
  reset();
  const messages = [
    { id: 'server-assistant', role: 'assistant', text: '', parts: [{ ...webPart(), state: 'output-available', output: { approved: true } }] },
    { id: 'approval-user', role: 'user', text: interactions.WEB_APPROVED_TEXT, parts: [] },
  ];
  respond = (config) => config.url.endsWith('/rewind') ? { text: interactions.WEB_APPROVED_TEXT, weeks: [] } : { id: 'history', messages };
  await render().openThread('history');
  assert.equal(render().webSearchAllowed, true);
  client.setQueryData(mealPlanKeys.plannerThread, { id: 'history', messages });
  assert.equal(await render().rewind('approval-user'), true);
  assert.equal(render().webSearchAllowed, false);
  assert.equal(render().interaction.kind, 'web');
  assert.equal(client.getQueryState(mealPlanKeys.plannerThread).isInvalidated, true);
});

test('declining or typing past a web request never grants consent, including a stale decision left after rewind', async () => {
  for (const typed of [false, true]) {
    reset(); mockThread([{ ...webPart(), state: 'output-available', output: { approved: true } }]);
    await render().openThread('history');
    assert.equal(render().webSearchAllowed, false);
    if (typed) await render().sendMessage('Why do you need it?');
    else await render().answerWebSearch('web', false);
    assert.equal(requests.find((r) => r.url === '/meal-plan/chat').data.allowWebSearch, false);
    assert.equal(render().webSearchAllowed, false);
  }
});

test('a failed decision sync keeps the card and composer and sends no chat request', async () => {
  reset(); mockThread([questionPart()]);
  await render().openThread('history'); render().setComposer('Custom answer');
  respond = (config) => { if (config.method === 'PATCH') throw new Error('offline'); return { id: 'history', messages: [{ id: 'server-assistant', role: 'assistant', text: '', parts: [questionPart()] }] }; };
  await render().sendMessage();
  const planner = render();
  assert.equal(planner.composer, 'Custom answer'); assert.equal(planner.interaction.callId, 'question');
  assert.equal(planner.turns.length, 1); assert.ok(planner.chatError);
  assert.equal(requests.some((r) => r.url === '/meal-plan/chat'), false);
});

test('an unrecorded tool cannot create a duplicate assistant message when an answer is synced', async () => {
  reset(); respond = () => ({ id: 'history', messages: [] });
  await assert.rejects(service.answerPlannerTool('history', 'missing', { approved: true }));
  assert.equal(requests.some((r) => r.method === 'PATCH'), false);
  assert.equal(schema.plannerRewindSchema.safeParse({ text: '', weeks: [{ weekStart: nextWeek, restored: ['MON'], skipped: [], droppedDishes: -1 }] }).success, false);
  respond = () => ({ id: 'history', messages: [
    { id: 'a', role: 'assistant', text: '', parts: [webPart()] },
    { id: 'b', role: 'user', text: 'Already answered on another device', parts: [] },
  ] });
  await assert.rejects(service.answerPlannerTool('history', 'web', { approved: true }));
  assert.equal(requests.some((r) => r.method === 'PATCH'), false);
});

test('rewind trims only after server success, restores composer, refreshes all weeks and blocks concurrent sends', async () => {
  reset();
  await render().sendMessage('Add soup');
  await render().sendMessage('Replace soup');
  const planner = render(), target = planner.turns[0].id;
  for (const key of [mealPlanKeys.week(), mealPlanKeys.week(nextWeek)]) client.setQueryData(key, plan());
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  respond = async () => { await pending; return { text: 'Add soup', weeks: [{ weekStart: nextWeek, restored: ['MON'], skipped: ['SUN'], droppedDishes: 1 }] }; };
  const operation = planner.rewind(target);
  assert.equal(render().rewindingId, target);
  assert.equal(render().turns.length, 4);
  await render().sendMessage('Blocked');
  await render().rewind(target);
  assert.equal(requests.filter((r) => r.url.endsWith('/rewind')).length, 1);
  release(); assert.equal(await operation, true);
  const after = render();
  assert.equal(after.turns.length, 0); assert.equal(after.composer, 'Add soup');
  assert.ok(after.rewindNotice.includes('1')); assert.ok(after.rewindNotice.includes('2026-11-23'));
  assert.equal(after.rewindingId, null); assert.equal(after.busy, false);
  for (const key of [mealPlanKeys.week(), mealPlanKeys.week(nextWeek)]) assert.equal(client.getQueryState(key).isInvalidated, true);
});

test('rewind errors preserve chat/composer and refresh the calendar; late results from another session are ignored', async () => {
  reset(); await render().sendMessage('Add soup'); render().setComposer('Keep this');
  respond = () => { throw new Error('offline'); };
  assert.equal(await render().rewind(render().turns[0].id), false);
  assert.equal(render().turns.length, 2); assert.equal(render().composer, 'Keep this'); assert.ok(render().chatError);
  let release; const pending = new Promise((resolve) => { release = resolve; });
  respond = async () => { await pending; return { text: 'Add soup', weeks: [] }; };
  const operation = render().rewind(render().turns[0].id); currentToken = 'other'; release();
  assert.equal(await operation, false);
  assert.equal(render().turns.length, 2); assert.equal(render().composer, 'Keep this');
});

function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const textOf = (node) => find(node, (item) => item.type === 'Text').map((item) => item.props.children).flat(Infinity).join('');
const buttons = (tree) => find(tree, (node) => node.type === 'Pressable');

test('question UI supports single and multiple choice and prevents old cards from answering', () => {
  reset(); const answers = [];
  const draw = (multiple, open = true) => { slot = 0; return PlannerQuestionCard({ question: { ...questionPart(multiple).input, callId: 'q' }, open, onAnswer: (answer) => answers.push(answer) }); };
  buttons(draw(false))[0].props.onPress(); assert.deepEqual(answers, ['Soup']);
  buttons(draw(false, false))[1].props.onPress(); assert.equal(answers.length, 1);
  reset(); answers.length = 0;
  assert.equal(buttons(draw(true)).at(-1).props.disabled, true);
  buttons(draw(true))[0].props.onPress(); buttons(draw(true))[1].props.onPress();
  buttons(draw(true)).at(-1).props.onPress(); assert.deepEqual(answers, ['Soup, Tofu']);
  assert.equal(buttons(draw(true))[0].props.accessibilityState.checked, true);
});

test('consent UI makes scope explicit and confirmation UI cancels without writing or closing during a rewind', () => {
  reset(); const decisions = [];
  const tree = PlannerWebConsentCard({ request: { callId: 'web', reason: 'Look up a dish' }, open: true, onAnswer: (approved) => decisions.push(approved) });
  assert.ok(textOf(tree).includes('Look up a dish'));
  buttons(tree)[0].props.onPress(); buttons(tree)[1].props.onPress(); assert.deepEqual(decisions, [true, false]);
  let canceled = 0, confirmed = 0;
  const draw = (busy) => PlannerRewindDialog({ text: 'Replace dinner', hasComposer: true, busy, error: '', onCancel: () => canceled++, onConfirm: () => confirmed++ });
  buttons(draw(false)).at(-1).props.onPress(); assert.equal(canceled, 1); assert.equal(confirmed, 0);
  draw(true).props.onRequestClose(); assert.equal(canceled, 1);
  assert.equal(buttons(draw(true))[0].props.disabled, true);
  assert.ok(textOf(draw(false)).includes('Replace dinner'));
});
