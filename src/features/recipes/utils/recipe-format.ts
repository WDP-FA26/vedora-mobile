import type { Recipe, RecipeDetail } from '../types/recipe.schema';

/** Prep + cook minutes, or null when both are unknown. */
export function recipeMinutes(recipe: Pick<Recipe, 'prepMinutes' | 'cookMinutes' | 'totalMinutes'>): number | null {
  if (typeof recipe.totalMinutes === 'number') return recipe.totalMinutes;
  if (recipe.prepMinutes === null && recipe.cookMinutes === null) return null;
  return (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
}

export function formatIngredient(item: RecipeDetail['ingredients'][number]): string {
  const amount = [item.quantity, item.unit].filter((part) => part !== null && part !== '').join(' ');
  return [amount, item.name, item.note ? `(${item.note})` : null].filter(Boolean).join(' ');
}
