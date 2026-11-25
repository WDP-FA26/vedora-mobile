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
const cached = [], invalidations = [];
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const original = { groups: [{ id: id(1), name: 'Sữa' }], ingredients: [{ id: id(2), name: 'Đậu phộng' }], allergyNote: 'Dị ứng đậu phộng', preferenceNote: 'Ít cay' };
let mine = original;
const session = select => select({ accessToken: token, isHydrated: true });
session.getState = () => ({ accessToken: token });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async config => { requests.push(config); await gate; if (failure) throw failure; return { data: response }; } } } });
mock.module('@tanstack/react-query', { namedExports: {
  useQuery: config => ({ data: config.queryKey[1] === 'options' ? { groups: [], ingredients: [] } : mine }),
  useQueryClient: () => ({ setQueryData: (key, data) => { cached.push([key, data]); mine = data; }, invalidateQueries: config => { invalidations.push(config); return Promise.resolve(); } }),
  useMutation: config => ({ isPending: pending, mutateAsync: async input => { const value = await config.mutationFn(input); config.onSuccess?.(value); return value; } }),
} });
mock.module('react', { namedExports: {
  useState: initial => { const i = slot++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef: initial => { const i = slot++; return slots[i] ??= { current: initial }; }, useMemo: fn => fn(),
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: {
  ...Object.fromEntries(['ActivityIndicator', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map(x => [x, x])),
  Alert: { alert() {} }, StyleSheet: { create: value => value },
} });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
mock.module('expo-router', { namedExports: { router: { back() {}, push() {} } } });
mock.module('react-native-safe-area-context', { namedExports: { SafeAreaView: 'SafeAreaView' } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('features/dietary-profile/components/nutrition-section.tsx'), { namedExports: { NutritionSection: 'NutritionSection' } });
const { dietaryRestrictionsSchema, dietaryUpdateSchema } = await import('../src/features/dietary-profile/types/dietary-profile.schema.ts');
const { dietaryRestrictionsSchema: plannerSchema } = await import('../src/features/meal-plan/types/meal-plan.schema.ts');
const { getMyDietary, saveMyDietary } = await import('../src/features/dietary-profile/services/dietary-profile.service.ts');
const { DietaryProfileScreen } = await import('../src/features/dietary-profile/components/dietary-profile-screen.tsx');
const values = { groupIds: [id(1)], ingredientIds: [id(2)] };
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
function reset() { slots = []; requests = []; response = original; mine = original; failure = undefined; gate = undefined; pending = false; token = 'owner'; cached.length = 0; invalidations.length = 0; }

test('both readers preserve notes and accept absent/null notes from BE', () => {
  for (const schema of [dietaryRestrictionsSchema, plannerSchema]) {
    assert.deepEqual(schema.parse(original), original);
    assert.ok(schema.safeParse({ groups: [], ingredients: [] }).success);
    assert.ok(schema.safeParse({ groups: [], ingredients: [], allergyNote: null, preferenceNote: null }).success);
  }
});

test('notes trim, allow clearing/omission and enforce 1000 characters independently', () => {
  assert.deepEqual(dietaryUpdateSchema.parse(values), values);
  assert.deepEqual(dietaryUpdateSchema.parse({ ...values, allergyNote: '  Dị ứng  ', preferenceNote: '  ' }), { ...values, allergyNote: 'Dị ứng', preferenceNote: '' });
  for (const key of ['allergyNote', 'preferenceNote']) {
    for (const value of [null, '', 'a'.repeat(1000)]) assert.ok(dietaryUpdateSchema.safeParse({ ...values, [key]: value }).success);
    for (const value of [3, 'a'.repeat(1001)]) assert.equal(dietaryUpdateSchema.safeParse({ ...values, [key]: value }).success, false);
  }
  for (const patch of [{ groupIds: [id(1), id(1)] }, { ingredientIds: ['bad'] }, { groupIds: Array.from({ length: 51 }, (_, i) => id(i)) }, { ingredientIds: Array.from({ length: 201 }, (_, i) => id(i)) }]) assert.equal(dietaryUpdateSchema.safeParse({ ...values, ...patch }).success, false);
});

test('GET/PUT retain notes; invalid input never reaches API', async () => {
  reset();
  assert.deepEqual(await getMyDietary(), original);
  assert.equal(requests[0].url, '/dietary/me');
  await saveMyDietary({ ...values, allergyNote: '  Mới ', preferenceNote: '' });
  assert.equal(requests[1].method, 'PUT');
  assert.deepEqual(requests[1].data, { ...values, allergyNote: 'Mới', preferenceNote: '' });
  assert.throws(() => saveMyDietary({ ...values, allergyNote: 'a'.repeat(1001) }));
  assert.equal(requests.length, 2);
});

test('UI reads notes, cancels edits, clears a saved note and updates dietary/plan caches', async () => {
  reset();
  let tree = render();
  assert.equal(input(tree, 'Ghi chú dị ứng').props.value, original.allergyNote);
  assert.equal(input(tree, 'Khẩu vị và thói quen').props.value, original.preferenceNote);
  assert.equal(button(tree, 'Lưu hồ sơ').props.disabled, true);
  input(tree, 'Ghi chú dị ứng').props.onChangeText('Mới');
  tree = render();
  button(tree, 'Hủy thay đổi').props.onPress();
  tree = render();
  assert.equal(input(tree, 'Ghi chú dị ứng').props.value, original.allergyNote);
  input(tree, 'Khẩu vị và thói quen').props.onChangeText('');
  response = { ...original, preferenceNote: undefined };
  button(render(), 'Lưu hồ sơ').props.onPress();
  await flush();
  assert.deepEqual(requests[0].data, { ...values, allergyNote: original.allergyNote, preferenceNote: '' });
  tree = render();
  assert.equal(input(tree, 'Khẩu vị và thói quen').props.value, '');
  assert.equal(button(tree, 'Lưu hồ sơ').props.disabled, true);
  assert.ok(texts(tree).includes('Đã lưu hồ sơ ăn uống.'));
  assert.ok(cached.some(([key, data]) => key.join('/') === 'dietary/me' && data.allergyNote === original.allergyNote));
  assert.ok(invalidations.some(({ queryKey }) => queryKey[0] === 'meal-plan'));
});

test('failed save retains edits, blocks duplicate submission and disables inputs while saving', async () => {
  reset();
  input(render(), 'Ghi chú dị ứng').props.onChangeText('Nội dung giữ lại');
  let release;
  gate = new Promise(resolve => { release = resolve; });
  failure = new Error('offline');
  const saveButton = button(render(), 'Lưu hồ sơ');
  saveButton.props.onPress(); saveButton.props.onPress();
  assert.equal(requests.length, 1);
  pending = true;
  assert.equal(input(render(), 'Ghi chú dị ứng').props.editable, false);
  release(); await flush(); pending = false;
  const tree = render();
  assert.equal(input(tree, 'Ghi chú dị ứng').props.value, 'Nội dung giữ lại');
  assert.ok(texts(tree).includes('Không lưu được hồ sơ ăn uống.'));
  assert.equal(button(tree, 'Lưu hồ sơ').props.disabled, false);
});

test('pristine form follows cache updates while unsaved notes survive refetch and invalid input is blocked', () => {
  reset();
  render();
  mine = { ...original, allergyNote: 'Ghi chú từ trợ lý' };
  let tree = render();
  assert.equal(input(tree, 'Ghi chú dị ứng').props.value, mine.allergyNote);
  assert.equal(input(tree, 'Ghi chú dị ứng').props.maxLength, 1000);
  assert.equal(input(tree, 'Ghi chú dị ứng').props.multiline, true);
  input(tree, 'Ghi chú dị ứng').props.onChangeText('Đang sửa');
  mine = { ...original, allergyNote: 'Dữ liệu tải lại' };
  assert.equal(input(render(), 'Ghi chú dị ứng').props.value, 'Đang sửa');
  input(render(), 'Ghi chú dị ứng').props.onChangeText('a'.repeat(1001));
  button(render(), 'Lưu hồ sơ').props.onPress();
  tree = render();
  assert.equal(requests.length, 0);
  assert.ok(texts(tree).includes('Mỗi ghi chú tối đa 1.000 ký tự.'));
  button(tree, 'Hủy thay đổi').props.onPress();
  assert.equal(input(render(), 'Ghi chú dị ứng').props.value, mine.allergyNote);
});
