import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
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
    const pathname = new URL(url).pathname;
    if (url.startsWith(root.href) && /\.tsx?$/.test(pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
const jsx = (type, props) => ({ type, props });
let state, reduceMotion = false, dimensions = { width: 390, height: 844, fontScale: 1 };
const animations = [], effectCleanups = [];
class AnimatedValue {
  constructor(value) { this.value = value; }
  setValue(value) { this.value = value; }
  interpolate(config) { return config; }
}
const animation = (kind, config) => ({ kind, config, started: false, stopped: false,
  start() { this.started = true; animations.push(this); }, stop() { this.stopped = true; } });
const actions = [], commands = [], scrolls = [], contexts = [];
const props = { status: 'listening', error: '', reply: 'Mình có thể giúp bạn nấu món chay.', heard: 'Gợi ý bữa tối.', elapsed: 61,
  onClose: () => actions.push('close'), onRetry: () => actions.push('retry'), onToggleMute: () => actions.push('mute'), onInterrupt: () => actions.push('interrupt') };
const recipe = { id: 'recipe-1', title: 'Đậu hũ sốt nấm', servings: 2, prepMinutes: 5, cookMinutes: 10,
  ingredients: [{ ingredientId: 'tofu', name: 'Đậu hũ', quantity: 200, unit: 'g', note: null }],
  steps: ['Sơ chế nguyên liệu.', 'Nấu chín và thưởng thức.'], conflicts: [] };
const plan = { data: { today: '2026-11-27', days: [
  { day: 'MON', date: '2026-11-23', sections: [{ section: 'LUNCH', recipes: [recipe] }] },
  { day: 'TUE', date: '2026-11-24', sections: [{ section: 'LUNCH', recipes: [] }] },
] }, refetch: () => actions.push('refetch') };
const voice = { ...props, screen: { panel: 'none', weekStart: '2026-11-23', day: 'MON' }, focus: null,
  scrollRef: { current: { scrollTo: (value) => scrolls.push(value) } }, scrollProps: {},
  sendContext: (text) => contexts.push(text), end: () => actions.push('end'), closePanel: () => actions.push('panel-close'),
  toggleMute: props.onToggleMute, interrupt: props.onInterrupt, retry: props.onRetry, applyScreen: (command) => commands.push(command),
  selectDay: (day) => actions.push(day), setLogDate: () => {} };
mock.module('react', { exports: {
  useState: (initial) => [state ?? (typeof initial === 'function' ? initial() : initial), (value) => { state = value; }], useRef: (value) => ({ current: value }),
  useCallback: (callback) => callback, useEffect: (effect) => { const cleanup = effect(); if (cleanup) effectCleanups.push(cleanup); },
} });
mock.module('react/jsx-runtime', { exports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { exports: { ActivityIndicator: 'Spinner', Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: { create: (value) => value, hairlineWidth: 1 }, useWindowDimensions: () => dimensions,
  Animated: { View: 'AnimatedView', Value: AnimatedValue, timing: (value, config) => animation('timing', config), sequence: (steps) => animation('sequence', steps), loop: (step) => animation('loop', step) },
  Easing: { ease: 'ease', inOut: (value) => value },
} });
mock.module('react-native-safe-area-context', { exports: { SafeAreaView: 'SafeAreaView' } });
mock.module('expo-image', { exports: { Image: 'Image' } });
mock.module('expo-symbols', { exports: { SymbolView: 'Symbol' } });
mock.module(local('hooks/use-theme.ts'), { exports: { useTheme: () => ({}) } });
mock.module(local('hooks/use-reduce-motion.ts'), { exports: { useReduceMotion: () => reduceMotion } });
mock.module(local('features/meal-plan/hooks/use-meal-planner-voice.ts'), { exports: { useMealPlannerVoice: () => voice } });
mock.module(local('features/meal-plan/hooks/use-meal-plan.ts'), { exports: { useMealPlan: () => plan } });
mock.module(local('features/recipes/hooks/use-recipes.ts'), { exports: { useRecipe: () => ({ data: recipe }) } });
mock.module(local('features/nutrition-chat/components/sprout-pet.tsx'), { exports: { SproutPet: 'SproutPet' } });
mock.module(local('features/dietary-profile/components/nutrition-section.tsx'), { exports: { NutritionSection: 'NutritionSection' } });
mock.module(local('features/meal-log/components/meal-log-screen.tsx'), { exports: { MealLogScreen: 'MealLogScreen' } });
globalThis.require = (asset) => asset;
const { VoiceCallControls } = await import('../src/features/meal-plan/components/voice-call-controls.tsx');
const { VoiceCallSheet } = await import('../src/features/meal-plan/components/voice-call-sheet.tsx');
const { VoiceScreenGlow } = await import('../src/features/meal-plan/components/voice-screen-glow.tsx');
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
const find = (tree, predicate) => nodes(tree).find(predicate);
const labelled = (tree, label) => find(tree, (node) => node.props?.accessibilityLabel === label);
function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join('');
  return typeof node === 'object' && node ? textOf(node.props?.children) : String(node ?? '');
}
const sheet = () => VoiceCallSheet({ planner: { token: 'account-a' }, onClose: props.onClose });
const panel = (name) => { const node = find(sheet(), (item) => item.type?.name === name); return node.type(node.props); };

test('all call states preserve mic/interrupt restrictions and expose retry only after a call finishes', () => {
  for (const status of ['connecting', 'listening', 'thinking', 'speaking', 'muted', 'ending', 'ended', 'error']) {
    state = undefined;
    const tree = VoiceCallControls({ ...props, status });
    const finished = status === 'ended' || status === 'error';
    assert.equal(!!labelled(tree, 'Gọi lại'), finished);
    if (finished) assert.ok(labelled(tree, 'Đóng cuộc gọi'));
    else {
      assert.equal(labelled(tree, status === 'muted' ? 'Bật mic' : 'Tắt mic').props.disabled, status === 'connecting');
      assert.equal(labelled(tree, 'Ngắt lời trợ lý để nói tiếp').props.disabled, !['speaking', 'muted', 'ending'].includes(status));
      assert.ok(labelled(tree, 'Kết thúc cuộc gọi'));
    }
    assert.ok(labelled(tree, 'Thời gian cuộc gọi 1 phút 1 giây'));
  }
  labelled(VoiceCallControls(props), 'Tắt mic').props.onPress();
  labelled(VoiceCallControls({ ...props, status: 'speaking' }), 'Ngắt lời trợ lý để nói tiếp').props.onPress();
  labelled(VoiceCallControls({ ...props, status: 'error' }), 'Gọi lại').props.onPress();
  assert.deepEqual(actions.slice(-3), ['mute', 'interrupt', 'retry']);
});

test('compact screens and large text start with collapsed captions; toggling keeps full text and never hides an error', () => {
  for (const size of [{ height: 640, fontScale: 1 }, { height: 844, fontScale: 1.6 }]) {
    state = undefined; dimensions = size;
    const input = { ...props, error: 'Mic bị gián đoạn. Hãy kết nối lại cuộc gọi.' };
    let tree = VoiceCallControls(input);
    assert.equal(textOf(tree).includes(props.reply), false);
    assert.match(textOf(tree), /Mic bị gián đoạn/);
    labelled(tree, 'Xem lời thoại').props.onPress();
    tree = VoiceCallControls(input);
    const reply = find(tree, (node) => node.type === 'Text' && node.props.children === props.reply);
    assert.equal(reply.props.numberOfLines, undefined);
    assert.equal(reply.props.selectable, true);
    labelled(tree, 'Thu gọn lời thoại').props.onPress();
    assert.match(textOf(VoiceCallControls(input)), /Mic bị gián đoạn/);
  }
  state = undefined; dimensions = { height: 844, fontScale: 1 };
  assert.match(textOf(VoiceCallControls(props)), /Mình có thể giúp bạn/);
});

test('closing the modal and the call controls ends the call before dismissing it', () => {
  const tree = sheet();
  tree.props.onRequestClose();
  assert.deepEqual(actions.slice(-2), ['end', 'close']);
  find(tree, (node) => node.type === VoiceCallControls).props.onClose();
  assert.deepEqual(actions.slice(-2), ['end', 'close']);
});

test('the AI gradient leaves controls touchable, stops when inactive, and respects Reduce Motion', () => {
  state = undefined;
  dimensions = { width: 390, height: 844, fontScale: 1 };
  for (const [active, reduced] of [[true, false], [false, false], [true, true]]) {
    reduceMotion = reduced; animations.length = 0; effectCleanups.length = 0;
    const tree = VoiceScreenGlow({ active });
    assert.equal(tree.props.pointerEvents, 'none');
    assert.equal(tree.props.accessibilityElementsHidden, true);
    assert.equal(tree.props.importantForAccessibility, 'no-hide-descendants');
    assert.equal(animations.some((item) => item.kind === 'loop'), active && !reduced);
    assert.equal(animations[0].config.toValue, active ? 1 : 0);
    if (reduced) assert.equal(animations[0].config.duration, 0);
    for (const cleanup of effectCleanups) cleanup();
    assert.equal(animations.every((item) => item.stopped), true);
  }
  reduceMotion = false;
  voice.glowing = true;
  assert.equal(find(sheet(), (node) => node.type === VoiceScreenGlow).props.active, true);
  voice.glowing = false;
});

test('calendar day and recipe buttons keep the voice screen context; empty days retain day selection', () => {
  const calendar = panel('VoiceCalendar');
  const tabs = nodes(calendar).filter((node) => node.props?.accessibilityRole === 'tab');
  assert.deepEqual(tabs.map(textOf), ['T223', 'T324', 'T425', 'T526', 'T627', 'T728', 'CN29']);
  assert.match(labelled(calendar, 'Thứ Sáu').props.accessibilityHint, /hôm nay/);
  labelled(calendar, 'Thứ Ba').props.onPress();
  assert.equal(actions.at(-1), 'TUE');
  labelled(calendar, `Xem công thức ${recipe.title}`).props.onPress();
  assert.deepEqual(commands.at(-1), { close: null, focus: { kind: 'recipe', recipeId: recipe.id, title: recipe.title, section: 'top' } });
  voice.screen = { ...voice.screen, day: 'TUE' };
  assert.match(textOf(panel('VoiceCalendar')), /Chưa có món cho bữa này/);
  assert.equal(labelled(panel('VoiceCalendar'), 'Thứ Ba').props.accessibilityState.selected, true);
});

test('a changed meal highlights only its new dishes and scrolls to the measured day/meal position', () => {
  voice.screen = { panel: 'none', weekStart: '2026-11-23', day: 'MON' };
  voice.highlight = { weekStart: '2026-11-23', targets: [{ day: 'MON', section: 'LUNCH', recipeIds: [recipe.id] }] };
  const kept = { ...recipe, id: 'kept', title: 'Canh rau' };
  const original = plan.data.days[0].sections;
  plan.data.days[0].sections = [{ section: 'LUNCH', recipes: [recipe, kept] }, { section: 'DINNER', recipes: [kept] }];
  const calendar = panel('VoiceCalendar');
  assert.match(labelled(calendar, 'Thứ Hai').props.accessibilityHint, /vừa cập nhật/);
  assert.doesNotMatch(labelled(calendar, 'Thứ Ba').props.accessibilityHint, /vừa cập nhật/);
  assert.equal(labelled(calendar, `Xem công thức ${recipe.title}`).props.accessibilityState.selected, true);
  for (const row of nodes(calendar).filter((node) => node.props?.accessibilityLabel === 'Xem công thức Canh rau')) assert.equal(row.props.accessibilityState.selected, false);
  calendar.props.onLayout({ nativeEvent: { layout: { y: 20 } } });
  find(calendar, (node) => node.type === 'View' && node.props.onLayout && textOf(node).startsWith('T2 ·')).props.onLayout({ nativeEvent: { layout: { y: 150 } } });
  find(calendar, (node) => node.type === 'View' && node.props.onLayout && textOf(node).startsWith('Bữa trưa')).props.onLayout({ nativeEvent: { layout: { y: 60 } } });
  assert.deepEqual(scrolls.at(-1), { y: 230, animated: true });
  voice.highlight.weekStart = '2026-11-30';
  assert.equal(labelled(panel('VoiceCalendar'), `Xem công thức ${recipe.title}`).props.accessibilityState.selected, false);
  assert.doesNotMatch(textOf(panel('VoiceCalendar')), /Vừa cập nhật:/);
  plan.data.days[0].sections = original;
  voice.highlight = null;
});

test('calendar header always shows seven dates across a month boundary, even before dishes exist', () => {
  voice.screen = { panel: 'none', weekStart: '2026-11-30', day: 'MON' };
  const tabs = nodes(panel('VoiceCalendar')).filter((node) => node.props?.accessibilityRole === 'tab');
  assert.deepEqual(tabs.map(textOf), ['T230', 'T31', 'T42', 'T53', 'T64', 'T75', 'CN6']);
});

test('recipe step focus scrolls to the measured position after the new cards and sends the same cooking context', () => {
  voice.screen = { ...voice.screen, panel: 'recipe', recipeId: recipe.id };
  voice.focus = { kind: 'recipe', recipeId: recipe.id, title: recipe.title, section: 'steps', step: 2 };
  const detail = panel('VoiceRecipe');
  assert.match(contexts.at(-1), /200 g Đậu hũ/);
  assert.match(contexts.at(-1), /2\. Nấu chín/);
  detail.props.onLayout({ nativeEvent: { layout: { y: 60 } } });
  const step = labelled(detail, 'Xem bước 2');
  step.props.onLayout({ nativeEvent: { layout: { y: 480 } } });
  assert.deepEqual(scrolls.at(-1), { y: 540, animated: true });
  assert.equal(step.props.accessibilityState.selected, true);
  labelled(detail, 'Xem bước 1').props.onPress();
  assert.equal(commands.at(-1).focus.step, 1);
  assert.equal(commands.at(-1).focus.section, 'steps');
});
