import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
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
      return { format: 'module', shortCircuit: true, source: url.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
const id = '00000000-0000-4000-8000-000000000001';
const summary = { recipeId: id, ratingCount: 0, averageRating: null };
let response = summary, token = 'account-a', writes = 0;
const requests = [];
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async (config) => { requests.push(config); return { data: response }; } } } });
const session = (select) => select({ accessToken: token });
session.getState = () => ({ accessToken: token });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
const client = new QueryClient();
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => client, useQuery: (config) => config, useIsMutating: () => writes,
  useMutation: (config) => ({ ...config, mutate: () => { writes++; } }),
} });
const schema = await import('../src/features/recipes/types/recipe-rating.schema.ts');
const service = await import('../src/features/recipes/services/recipe-rating.service.ts');
const { useRecipeRating } = await import('../src/features/recipes/hooks/use-recipe-rating.ts');
const { recipeRatingKeys: keys } = await import('../src/features/recipes/data/recipe-rating.keys.ts');
const { ApiError } = await import('../src/shared/api/api-error.ts');

test('rating input strictly accepts only integer 1–5 and summary preserves no-rating null', () => {
  for (const value of [1, 2, 3, 4, 5]) assert.deepEqual(schema.recipeRatingInputSchema.parse({ value }), { value });
  for (const value of [0, 6, 2.5, '4', null]) assert.equal(schema.recipeRatingInputSchema.safeParse({ value }).success, false);
  assert.equal(schema.recipeRatingInputSchema.safeParse({ value: 4, userId: 'other' }).success, false);
  assert.deepEqual(schema.recipeRatingSummarySchema.parse(summary), summary);
  assert.equal(schema.myRecipeRatingSchema.safeParse({ ...summary, myRating: 0 }).success, false);
});

test('guest/private GET and PUT/DELETE use exact endpoints, abort signal and only value payload', async () => {
  const signal = new AbortController().signal;
  response = summary;
  await service.getRecipeRating(id, false, signal);
  assert.equal(requests.at(-1).url, `/recipes/${id}/ratings/summary`);
  assert.equal(requests.at(-1).signal, signal);
  response = { ...summary, myRating: null };
  await service.getRecipeRating(id, true, signal);
  assert.equal(requests.at(-1).url, `/recipes/${id}/rating`);
  response = { recipeId: id, ratingCount: 1, averageRating: 4, myRating: 4 };
  await service.setRecipeRating(id, 4);
  assert.equal(requests.at(-1).method, 'PUT');
  assert.deepEqual(requests.at(-1).data, { value: 4 });
  response = { ...summary, myRating: null };
  await service.setRecipeRating(id, null);
  assert.equal(requests.at(-1).method, 'DELETE');
  assert.equal('data' in requests.at(-1), false);
  const before = requests.length;
  await assert.rejects(service.setRecipeRating(id, 6));
  await assert.rejects(service.getRecipeRating('invalid', false));
  assert.equal(requests.length, before);
  response = { ...summary, recipeId: '00000000-0000-4000-8000-000000000002', myRating: null };
  await assert.rejects(service.setRecipeRating(id, 3), /mismatch/);
});

test('mutation uses authoritative totals, removes private score from public cache and ignores an old session', async () => {
  token = 'account-a';
  const { mutation } = useRecipeRating(id);
  const started = await mutation.onMutate();
  const result = { recipeId: id, ratingCount: 2, averageRating: 4.5, myRating: 5 };
  await mutation.onSuccess(result, 5, started);
  assert.deepEqual(client.getQueryData(keys.detail(id, true)), result);
  assert.deepEqual(client.getQueryData(keys.detail(id, false)), { recipeId: id, ratingCount: 2, averageRating: 4.5 });
  await mutation.onSuccess({ ...summary, myRating: null }, null, started);
  assert.deepEqual(client.getQueryData(keys.detail(id, true)), { ...summary, myRating: null });
  token = 'account-b'; client.clear();
  await mutation.onSuccess(result, 5, started);
  assert.equal(client.getQueryData(keys.detail(id, true)), undefined);
});

test('conflict refreshes the current rating; failed writes retain existing scores', async () => {
  token = 'account-a';
  client.setQueryData(keys.detail(id, true), { ...summary, myRating: null });
  const { mutation } = useRecipeRating(id);
  mutation.onError(new ApiError(503, undefined, 'offline'), 4, token);
  assert.deepEqual(client.getQueryData(keys.detail(id, true)), { ...summary, myRating: null });
  mutation.onError(new ApiError(409, 'RATING_CONFLICT', 'conflict'), 4, token);
  assert.equal(client.getQueryState(keys.detail(id, true)).isInvalidated, true);
  assert.equal(mutation.retry, false);
});

test('a session change before request cannot submit the old selection as the new account', () => {
  token = 'account-a';
  const { mutation } = useRecipeRating(id);
  token = 'account-b';
  const before = requests.length;
  assert.throws(() => mutation.mutationFn(5), (error) => error instanceof ApiError && error.status === 401);
  assert.equal(requests.length, before);
});

const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: { ActivityIndicator: 'Spinner', Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: (value) => value } } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'Symbol' } });
const routes = [], changes = [];
mock.module('expo-router', { namedExports: { router: { push: (route) => routes.push(route) } } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
let ui;
mock.module(local('features/recipes/hooks/use-recipe-rating.ts'), { namedExports: { useRecipeRating: () => ui } });
const { RecipeRating } = await import('../src/features/recipes/components/recipe-rating.tsx');
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join('');
  return typeof node === 'object' && node ? textOf(node.props?.children) : String(node ?? '');
}
function renderRating(data, error = null) {
  ui = { query: { data, error: null, isPending: false, isError: false, isFetching: false }, mutation: { error }, pending: false, change: (value) => changes.push(value) };
  return RecipeRating({ recipeId: id });
}
test('guest sees no-rating state and login; signed-in user can change and remove their current score', () => {
  token = null;
  let tree = renderRating(summary);
  assert.match(textOf(tree), /Chưa có đánh giá/);
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityLabel?.startsWith('Đánh giá ')).length, 0);
  nodes(tree).find((node) => node.type === 'Pressable').props.onPress();
  assert.equal(routes.at(-1).pathname, '/login');
  token = 'account-a';
  tree = renderRating({ recipeId: id, ratingCount: 2, averageRating: 4.5, myRating: 4 });
  assert.match(textOf(tree), /4.5\/5/);
  const stars = nodes(tree).filter((node) => node.props?.accessibilityLabel?.startsWith('Đánh giá '));
  assert.equal(stars.length, 5);
  assert.equal(stars[3].props.accessibilityState.selected, true);
  stars[4].props.onPress();
  nodes(tree).find((node) => node.type === 'Pressable' && textOf(node).includes('Gỡ đánh giá')).props.onPress();
  assert.deepEqual(changes.slice(-2), [5, null]);
});

test('pending disables all writes and backend restrictions show actionable errors', () => {
  const data = { recipeId: id, ratingCount: 1, averageRating: 4, myRating: 4 };
  for (const [code, expected] of [['SELF_RATING_NOT_ALLOWED', /chính mình/], ['EMAIL_NOT_VERIFIED', /xác minh email/]]) {
    assert.match(textOf(renderRating(data, new ApiError(403, code, 'restricted'))), expected);
  }
  ui.pending = true;
  const tree = RecipeRating({ recipeId: id });
  const buttons = nodes(tree).filter((node) => node.type === 'Pressable');
  assert.equal(buttons.length, 6);
  assert.equal(buttons.every((node) => node.props.disabled), true);
});
