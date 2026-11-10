import assert from 'node:assert/strict';
import test from 'node:test';

import { recipeFavoriteStateSchema, recipeSchema } from '../src/features/recipes/types/recipe.schema.ts';
import { updateFavoriteDetail, updateFavoritePages } from '../src/features/recipes/utils/recipe-favorite-cache.ts';
import { authReturnTo } from '../src/features/auth/utils/return-to.ts';

const id = '00000000-0000-4000-8000-000000000001';
const recipe = { id, title: 'Món chay', isFavorite: false, imageUrl: null, servings: 2, prepMinutes: 10, cookMinutes: 15, ingredientCount: 3, conflicts: [], post: null, updatedAt: '2026-11-07' };

test('keeps favorite status from API and rejects malformed favorite responses', () => {
  assert.equal(recipeSchema.parse({ ...recipe, isFavorite: true }).isFavorite, true);
  assert.equal(recipeSchema.parse(recipe).isFavorite, false);
  assert.equal(recipeFavoriteStateSchema.safeParse({ recipeId: id, isFavorite: true }).success, true);
  assert.equal(recipeFavoriteStateSchema.safeParse({ recipeId: id, isFavorite: 'true' }).success, false);
  assert.equal(recipeFavoriteStateSchema.safeParse({ recipeId: 'wrong', isFavorite: true }).success, false);
});

test('updates every loaded page without changing pagination or unrelated recipes', () => {
  const other = { ...recipe, id: 'other' };
  const original = { pages: [{ items: [recipe, other], meta: { hasNextPage: true } }, { items: [{ ...recipe }], meta: { hasNextPage: false } }], pageParams: [1, 2] };
  const saved = updateFavoritePages(original, id, true);
  assert.equal(saved.pages[0].items[0].isFavorite, true);
  assert.equal(saved.pages[1].items[0].isFavorite, true);
  assert.equal(saved.pages[0].items[1], other);
  assert.equal(original.pages[0].items[0].isFavorite, false);
  assert.deepEqual(saved.pageParams, [1, 2]);
  assert.deepEqual(saved.pages[0].meta, original.pages[0].meta);
  assert.equal(updateFavoritePages(saved, id, false).pages[1].items[0].isFavorite, false);
  assert.equal(updateFavoritePages(undefined, id, true), undefined);
});

test('preserves recipe detail and never creates incomplete detail data', () => {
  const detail = { ...recipe, description: 'Ghi chú', steps: ['Nấu'], ingredients: [] };
  assert.deepEqual(updateFavoriteDetail(detail, id, true), { ...detail, isFavorite: true });
  assert.equal(updateFavoriteDetail(detail, 'other', true), detail);
  assert.equal(updateFavoriteDetail(undefined, id, true), undefined);
});

test('login allows recipe and bookmark screens without allowing external redirects', () => {
  assert.equal(authReturnTo('/recipes'), '/recipes');
  assert.equal(authReturnTo('/bookmarks'), '/bookmarks');
  assert.equal(authReturnTo('https://attacker.example'), '/explore');
  assert.equal(authReturnTo('//attacker.example'), '/explore');
});
