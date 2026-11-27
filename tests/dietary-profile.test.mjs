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
    if (url.startsWith(root.href) && /\.tsx?$/.test(new URL(url).pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8').replace(/require\('[^']+\.png'\)/g, '"sticker"');
      return { format: 'module', shortCircuit: true, source: new URL(url).pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = path => new URL(path, root).href;
let slots = [], slot = 0, token = 'owner', requests = [], response, failure, gate, pending = false;
const cached = [], invalidations = [], queries = [], cancellations = [];
const original = { allergies: ['Dị ứng đậu phộng'], preferences: ['Ít cay'] };
let mine = original;
const session = select => select({ accessToken: token, isHydrated: true });
session.getState = () => ({ accessToken: token });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async config => { requests.push(config); await gate; if (failure) throw failure; return { data: response }; } } } });
mock.module('@tanstack/react-query', { namedExports: {
  useQuery: config => { queries.push(config); return { data: mine }; },
  useQueryClient: () => ({ cancelQueries: async config => { cancellations.push(config); }, setQueryData: (key, data) => { cached.push([key, data]); mine = data; }, invalidateQueries: config => { invalidations.push(config); return Promise.resolve(); } }),
  useMutation: config => ({ isPending: pending, mutateAsync: async input => { const value = await config.mutationFn(input); await config.onSuccess?.(value); return value; } }),
} });
mock.module('react', { namedExports: {
  useState: initial => { const i = slot++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef: initial => { const i = slot++; return slots[i] ??= { current: initial }; }, useMemo: fn => fn(),
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: {
  ...Object.fromEntries(['ActivityIndicator', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map(x => [x, x])),
  Platform: { OS: 'ios' }, Alert: { alert() {} }, StyleSheet: { create: value => value },
} });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
let prevention, prevented;
mock.module('expo-router', { namedExports: { router: { back() {}, push() {}, replace() {}, canGoBack: () => true }, usePreventRemove: (active, callback) => { prevented = active; prevention = callback; } } });
mock.module('react-native-safe-area-context', { namedExports: { SafeAreaView: 'SafeAreaView' } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('features/dietary-profile/components/nutrition-section.tsx'), { namedExports: { NutritionSection: 'NutritionSection' } });
const { dietaryRestrictionsSchema, dietaryUpdateSchema, dietaryFormSchema, memoryLines } = await import('../src/features/dietary-profile/types/dietary-profile.schema.ts');
const { dietaryRestrictionsSchema: plannerSchema } = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { getMyDietary, saveMyDietary } = await import('../src/features/dietary-profile/services/dietary-profile.service.ts');
const { DietaryProfileScreen } = await import('../src/features/dietary-profile/components/dietary-profile-screen.tsx');
const { useSaveDietaryProfile } = await import('../src/features/dietary-profile/hooks/use-dietary-profile.ts');
const render = () => { slot = 0; return DietaryProfileScreen(); };
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const texts = tree => find(tree, n => n.type === 'Text').map(n => n.props.children).flat().join(' ');
const input = (tree, label) => find(tree, n => n.type === 'TextInput' && n.props.accessibilityLabel === label)[0];
const button = (tree, label) => find(tree, n => n.type === 'Pressable' && texts(n).includes(label))[0];
const flush = () => new Promise(resolve => setImmediate(resolve));
function reset() { slots = []; requests = []; response = original; mine = original; failure = undefined; gate = undefined; pending = false; token = 'owner'; cached.length = 0; invalidations.length = 0; queries.length = 0; cancellations.length = 0; }

test('both readers use the BE memory response, rejecting the retired shape', () => {
  for (const schema of [dietaryRestrictionsSchema, plannerSchema]) {
    assert.deepEqual(schema.parse(original), original);
    assert.deepEqual(schema.parse({ allergies: [], preferences: [] }), { allergies: [], preferences: [] });
    for (const value of [{ groups: [], ingredients: [] }, { allergies: null, preferences: [] }, { allergies: [], preferences: [42] }]) assert.equal(schema.safeParse(value).success, false);
  }
});

test('form and PUT normalize lines like BE/web, with independent limits and omission versus clear', () => {
  assert.deepEqual(memoryLines('  A\r\n\n A\n B '), ['A', 'B']);
  assert.deepEqual(dietaryFormSchema.parse({ allergies: ' A\n\n A ', preferences: '' }), { allergies: ['A'], preferences: [] });
  assert.deepEqual(dietaryUpdateSchema.parse({ allergies: [' A ', '', 'A'] }), { allergies: ['A'] });
  assert.deepEqual(dietaryUpdateSchema.parse({ preferences: [] }), { preferences: [] });
  for (const field of ['allergies', 'preferences']) {
    assert.ok(dietaryUpdateSchema.safeParse({ [field]: Array.from({ length: 30 }, (_, i) => `${i}`) }).success);
    assert.ok(dietaryUpdateSchema.safeParse({ [field]: ['a'.repeat(200)] }).success);
    for (const lines of [null, ['a'.repeat(201)], Array.from({ length: 31 }, (_, i) => `${i}`), [42]]) assert.equal(dietaryUpdateSchema.safeParse({ [field]: lines }).success, false);
  }
  assert.equal(dietaryUpdateSchema.safeParse({ groupIds: [] }).success, false);
});

test('GET and partial PUT use /dietary/me only; validation happens before request', async () => {
  reset(); assert.deepEqual(await getMyDietary(), original);
  await saveMyDietary({ preferences: ['  Mới ', ''] });
  assert.deepEqual(requests.map(({ method, url }) => [method, url]), [['GET', '/dietary/me'], ['PUT', '/dietary/me']]);
  assert.deepEqual(requests[1].data, { preferences: ['Mới'] });
  assert.throws(() => saveMyDietary({ allergies: ['a'.repeat(201)] }));
  render(); assert.equal(queries.some(({ queryKey }) => queryKey[1] === 'options'), false);
  assert.equal(requests.length, 2);
});

test('UI preloads lists, cancels edits, clears only the changed section and refreshes cache', async () => {
  reset(); let tree = render();
  assert.equal(input(tree, 'Dị ứng & không ăn').props.value, original.allergies.join('\n'));
  assert.equal(input(tree, 'Sở thích & thói quen').props.value, original.preferences.join('\n'));
  assert.equal(button(tree, 'Lưu hồ sơ').props.disabled, true);
  input(tree, 'Dị ứng & không ăn').props.onChangeText('Mới');
  button(render(), 'Hủy thay đổi').props.onPress();
  assert.equal(input(render(), 'Dị ứng & không ăn').props.value, original.allergies[0]);
  input(render(), 'Sở thích & thói quen').props.onChangeText('');
  response = { ...original, preferences: [] };
  button(render(), 'Lưu hồ sơ').props.onPress(); await flush();
  assert.deepEqual(requests[0].data, { preferences: [] });
  assert.equal(input(render(), 'Sở thích & thói quen').props.value, '');
  assert.equal(button(render(), 'Lưu hồ sơ').props.disabled, true);
  assert.match(texts(render()), /Đã lưu ghi nhớ/);
  assert.deepEqual(cancellations[0].queryKey, ['dietary', 'me']);
  assert.deepEqual(cached[0], [['dietary', 'me'], response]);
  assert.ok(invalidations.some(({ queryKey }) => queryKey[0] === 'meal-plan'));
});

test('failed save retains edits, blocks duplicate submission and disables input while saving', async () => {
  reset(); input(render(), 'Dị ứng & không ăn').props.onChangeText('Nội dung giữ lại');
  let release; gate = new Promise(resolve => { release = resolve; }); failure = new Error('offline');
  const saveButton = button(render(), 'Lưu hồ sơ'); saveButton.props.onPress(); saveButton.props.onPress();
  assert.equal(requests.length, 1); pending = true;
  assert.equal(input(render(), 'Dị ứng & không ăn').props.editable, false);
  release(); await flush(); pending = false;
  assert.equal(input(render(), 'Dị ứng & không ăn').props.value, 'Nội dung giữ lại');
  assert.match(texts(render()), /Không lưu được hồ sơ/);
  assert.equal(button(render(), 'Lưu hồ sơ').props.disabled, false);
});

test('cache updates reach a pristine form, preserve unsaved edits and reject overlong lines', () => {
  reset(); render(); mine = { ...original, allergies: ['Ghi nhớ từ trợ lý'] };
  assert.equal(input(render(), 'Dị ứng & không ăn').props.value, mine.allergies[0]);
  input(render(), 'Dị ứng & không ăn').props.onChangeText('Đang sửa');
  mine = { ...original, allergies: ['Dữ liệu tải lại'], preferences: ['Sở thích mới từ trợ lý'] };
  assert.equal(input(render(), 'Dị ứng & không ăn').props.value, 'Đang sửa');
  input(render(), 'Dị ứng & không ăn').props.onChangeText('a'.repeat(201));
  button(render(), 'Lưu hồ sơ').props.onPress();
  assert.equal(requests.length, 0); assert.match(texts(render()), /Mỗi dòng tối đa 200/);
  button(render(), 'Hủy thay đổi').props.onPress();
  assert.equal(input(render(), 'Dị ứng & không ăn').props.value, mine.allergies[0]);
});

test('switching sessions hides the previous draft and ignores in-flight results', async () => {
  reset(); input(render(), 'Dị ứng & không ăn').props.onChangeText('Riêng của chủ cũ');
  token = 'another'; mine = { allergies: [], preferences: [] };
  assert.equal(input(render(), 'Dị ứng & không ăn').props.value, '');
  reset(); let release; gate = new Promise(resolve => { release = resolve; });
  const save = useSaveDietaryProfile(token).mutateAsync({ allergies: [] });
  token = 'another'; release(); await assert.rejects(save);
  assert.equal(cached.length, 0);
});

test('dirty forms prevent swipe/back navigation until cancelled or saved', () => {
  reset(); render(); assert.equal(prevented, false);
  input(render(), 'Dị ứng & không ăn').props.onChangeText('Chưa lưu'); render();
  assert.equal(prevented, true); assert.equal(typeof prevention, 'function');
  button(render(), 'Hủy thay đổi').props.onPress(); render(); assert.equal(prevented, false);
});
