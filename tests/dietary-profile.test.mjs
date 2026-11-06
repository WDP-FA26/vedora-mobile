import assert from 'node:assert/strict';
import test from 'node:test';

import { dietaryRestrictionsSchema, dietaryUpdateSchema } from '../src/features/dietary-profile/types/dietary-profile.schema.ts';
import { dietaryRestrictionsSchema as mealPlanDietarySchema } from '../src/features/meal-plan/types/meal-plan.schema.ts';

const id = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const values = { groupIds: [id(1)], ingredientIds: [id(2)], likedIngredientIds: [id(3)] };

test('both dietary readers retain liked ingredients so profile cache refreshes preserve tastes', () => {
  const response = { groups: [{ id: id(1), name: 'Group' }], ingredients: [{ id: id(2), name: 'Avoided' }], liked: [{ id: id(3), name: 'Liked' }] };
  assert.deepEqual(dietaryRestrictionsSchema.parse(response), response);
  assert.deepEqual(mealPlanDietarySchema.parse(response), response);
  assert.deepEqual(dietaryUpdateSchema.parse(values), values);
  assert.equal(dietaryUpdateSchema.safeParse({ groupIds: [], ingredientIds: [], likedIngredientIds: [] }).success, true);
});

test('rejects conflicting preferences, duplicates and malformed ingredient IDs', () => {
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, likedIngredientIds: values.ingredientIds }).success, false);
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, likedIngredientIds: [id(3), id(3)] }).success, false);
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, likedIngredientIds: ['invalid'] }).success, false);
});

test('enforces backend limits while allowing the full 100 liked ingredients', () => {
  const likedIngredientIds = Array.from({ length: 100 }, (_, index) => id(index + 10));
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, likedIngredientIds }).success, true);
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, likedIngredientIds: [...likedIngredientIds, id(500)] }).success, false);
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, groupIds: Array.from({ length: 51 }, (_, index) => id(index + 1000)) }).success, false);
  assert.equal(dietaryUpdateSchema.safeParse({ ...values, ingredientIds: Array.from({ length: 201 }, (_, index) => id(index + 1000)) }).success, false);
});
