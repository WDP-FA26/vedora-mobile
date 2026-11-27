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
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: new URL(url).pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
const jsx = (type, props) => ({ type, props });
let state, dimensions = { width: 390, fontScale: 1 }, token = null, nextPages = 0;
const routes = [], filters = [];
const recipe = { id: 'recipe-1', title: 'Đậu hũ sốt nấm', imageUrl: 'https://example.test/tofu.jpg', isFavorite: true,
  servings: 2, prepMinutes: 5, cookMinutes: 10, ingredientCount: 2, conflicts: [], post: null,
  description: null, ingredients: [], steps: [] };
const query = { data: { pages: [{ items: [recipe, { ...recipe, id: 'recipe-2', isFavorite: false }] }] },
  hasNextPage: true, fetchNextPage: () => { nextPages++; }, refetch: () => {}, isFetching: false, isFetchNextPageError: false };
mock.module('react', { exports: { useState: (initial) => [state ?? initial, (value) => { state = typeof value === 'function' ? value(state ?? initial) : value; }] } });
mock.module('react/jsx-runtime', { exports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { exports: { ActivityIndicator: 'Spinner', FlatList: 'FlatList', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: { create: (value) => value }, useWindowDimensions: () => dimensions } });
mock.module('react-native-safe-area-context', { exports: { SafeAreaView: 'SafeAreaView' } });
mock.module('expo-image', { exports: { Image: 'Image' } });
mock.module('expo-symbols', { exports: { SymbolView: 'Symbol' } });
mock.module('expo-router', { exports: { router: { push: (route) => routes.push(route) }, useLocalSearchParams: () => ({ id: recipe.id }) } });
mock.module(local('hooks/use-theme.ts'), { exports: { useTheme: () => ({}) } });
mock.module(local('hooks/use-pull-to-refresh.ts'), { exports: { usePullToRefresh: () => ({ refreshing: false, onRefresh: () => {} }) } });
mock.module(local('shared/stores/session-store.ts'), { exports: { useSessionStore: (select) => select({ accessToken: token }) } });
mock.module(local('features/recipes/hooks/use-recipes.ts'), { exports: {
  useRecipes: (filter) => { filters.push(filter); return query; }, useFavoriteRecipes: () => query, useRecipe: () => ({ data: recipe }), useRecipeCategories: () => ({ data: [] }),
} });
mock.module(local('features/recipes/components/recipe-save-button.tsx'), { exports: { RecipeSaveButton: 'SaveButton' } });
mock.module(local('features/recipes/components/recipe-rating.tsx'), { exports: { RecipeRating: 'Rating' } });
mock.module(local('shared/components/image-viewer.tsx'), { exports: { ZoomImage: 'ZoomImage' } });
globalThis.require = (asset) => asset;
const { RecipeCard } = await import('../src/features/recipes/components/recipe-card.tsx');
const { RecipesList } = await import('../src/features/recipes/components/recipes-screen.tsx');
const { SavedRecipes } = await import('../src/features/recipes/components/saved-recipes.tsx');
const { RecipeDetailScreen } = await import('../src/features/recipes/components/recipe-detail-screen.tsx');
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
const find = (tree, predicate) => nodes(tree).find(predicate);

test('recipe photo failures use a sticker, keep the detail link/save action, and recover for a new URL', () => {
  for (const render of [() => RecipeCard({ recipe }), RecipeDetailScreen]) {
    state = undefined;
    let tree = render();
    const photo = find(tree, (node) => node.props?.source?.uri === recipe.imageUrl);
    assert.ok(photo);
    photo.props.onError();
    tree = render();
    assert.equal(find(tree, (node) => node.props?.source?.uri === recipe.imageUrl), undefined);
    assert.ok(find(tree, (node) => node.props?.source?.includes?.('tomato-sticker')));
    assert.ok(find(tree, (node) => node.type === 'SaveButton'));
    recipe.imageUrl += '?updated=1';
    assert.ok(find(render(), (node) => node.props?.source?.uri === recipe.imageUrl));
  }
  const card = RecipeCard({ recipe });
  find(card, (node) => node.props?.accessibilityLabel?.startsWith('Xem công thức')).props.onPress();
  assert.deepEqual(routes.at(-1), { pathname: '/recipes/[id]', params: { id: recipe.id } });
});

test('catalogue and saved recipes reflow for narrow screens and large text without losing favourite filtering', () => {
  state = undefined;
  for (const [width, fontScale, expected] of [[390, 1, 2], [320, 1, 1], [390, 1.5, 1]]) {
    dimensions = { width, fontScale };
    assert.equal(find(RecipesList({}), (node) => node.type === 'FlatList').props.numColumns, expected);
    const saved = SavedRecipes();
    assert.equal(saved.props.numColumns, expected);
    assert.deepEqual(saved.props.data.map((item) => item.id), ['recipe-1']);
  }
});

test('catalogue search opens recipes; suitable filter requires login and pagination remains guarded', () => {
  state = undefined; token = null;
  let list = find(RecipesList({}), (node) => node.type === 'FlatList');
  find(list.props.ListHeaderComponent, (node) => node.props?.accessibilityLabel === 'Tìm món ăn hoặc nguyên liệu').props.onPress();
  assert.deepEqual(routes.at(-1), { pathname: '/search', params: { tab: 'recipes' } });
  find(list.props.ListHeaderComponent, (node) => node.props?.accessibilityRole === 'switch').props.onPress();
  assert.equal(routes.at(-1).pathname, '/login');
  assert.equal(filters.at(-1).suitableForMe, false);
  token = 'account-a';
  list = find(RecipesList({}), (node) => node.type === 'FlatList');
  find(list.props.ListHeaderComponent, (node) => node.props?.accessibilityRole === 'switch').props.onPress();
  list = find(RecipesList({}), (node) => node.type === 'FlatList');
  assert.equal(filters.at(-1).suitableForMe, true);
  list.props.onEndReached();
  assert.equal(nextPages, 1);
  query.isFetching = true; list.props.onEndReached();
  query.isFetching = false; query.isFetchNextPageError = true; list.props.onEndReached();
  assert.equal(nextPages, 1);
});
