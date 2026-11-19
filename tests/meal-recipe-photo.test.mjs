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
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } });
const configs = [], requests = [];
let failedUrl, fetching = false, fail = false;
const recipe = { id: 'recipe-1', title: 'Soup' };
const fullRecipe = { ...recipe, imageUrl: 'https://example.test/soup.jpg', isFavorite: false,
  servings: 2, prepMinutes: null, cookMinutes: null, ingredientCount: 0, conflicts: [], post: null, updatedAt: '',
  description: null, steps: [], ingredients: [] };
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async (config) => {
  requests.push(config); if (fail) throw new Error('not found'); return { data: fullRecipe };
} } } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: () => null } });
mock.module('@tanstack/react-query', { namedExports: {
  useQuery: (config) => { configs.push(config); return { data: client.getQueryData(config.queryKey), isFetching: fetching }; },
  useQueryClient: () => client, useInfiniteQuery: () => ({}), useMutation: () => ({}), useIsMutating: () => 0,
} });
mock.module('react', { namedExports: { useState: () => [failedUrl, (value) => { failedUrl = value; }] } });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx } });
mock.module('react-native', { namedExports: { ActivityIndicator: 'ActivityIndicator', View: 'View', StyleSheet: { create: (styles) => styles } } });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module(local('shared/components/image-viewer.tsx'), { namedExports: { ZoomImage: 'ZoomImage' } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
globalThis.require = (asset) => asset;
const { MealRecipePhoto } = await import('../src/features/meal-plan/components/meal-recipe-photo.tsx');
const { useRecipe } = await import('../src/features/recipes/hooks/use-recipes.ts');
const { recipeKeys } = await import('../src/features/recipes/data/recipe.keys.ts');
function reset() { failedUrl = undefined; fetching = false; fail = false; configs.length = 0; requests.length = 0; client.clear(); }

test('preview fetches a validated recipe using its ID and the existing detail cache; duplicate requests share one read', async () => {
  reset();
  const pending = MealRecipePhoto({ recipe });
  assert.equal(pending.type, 'View');
  const config = configs.at(-1);
  assert.equal(config.enabled, true);
  assert.deepEqual(config.queryKey, recipeKeys.detail(recipe.id));
  await Promise.all([client.fetchQuery(config), client.fetchQuery(config)]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/recipes/recipe-1');
  assert.ok(requests[0].signal instanceof AbortSignal);
  const photo = MealRecipePhoto({ recipe });
  assert.equal(photo.type, 'ZoomImage');
  assert.equal(photo.props.source.uri, fullRecipe.imageUrl);
  assert.equal(photo.props.style.width, 56);
});

test('saved dishes use their own URL or known null without fetching details', () => {
  reset();
  client.setQueryData(recipeKeys.detail(recipe.id), fullRecipe);
  assert.equal(MealRecipePhoto({ recipe: { ...recipe, imageUrl: 'https://example.test/saved.jpg' } }).props.source.uri, 'https://example.test/saved.jpg');
  assert.equal(configs.at(-1).enabled, false);
  assert.equal(MealRecipePhoto({ recipe: { ...recipe, imageUrl: null } }).type, 'View');
  assert.equal(configs.at(-1).enabled, false);
  assert.equal(useRecipe(recipe.id).data.imageUrl, fullRecipe.imageUrl); // Existing callers still load by default.
  assert.equal(configs.at(-1).enabled, true);
});

test('loading and missing/failed recipe details leave a usable placeholder', async () => {
  reset(); fetching = true;
  assert.equal(MealRecipePhoto({ recipe }).props.children.type, 'ActivityIndicator');
  fail = true;
  await assert.rejects(client.fetchQuery(configs.at(-1)), /not found/);
  fetching = false;
  assert.equal(MealRecipePhoto({ recipe }).props.children.type, 'Image');
  client.setQueryData(recipeKeys.detail(recipe.id), { ...fullRecipe, imageUrl: null });
  assert.equal(MealRecipePhoto({ recipe }).props.children.type, 'Image');
});

test('an unavailable image falls back and a new image URL can render again', () => {
  reset();
  const input = { ...recipe, imageUrl: fullRecipe.imageUrl };
  MealRecipePhoto({ recipe: input }).props.onError();
  assert.equal(MealRecipePhoto({ recipe: input }).type, 'View');
  assert.equal(MealRecipePhoto({ recipe: { ...input, imageUrl: 'https://example.test/new.jpg' } }).type, 'ZoomImage');
});
