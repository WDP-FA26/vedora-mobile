export const recipeRatingKeys = {
  recipe: (id: string) => ['recipe-ratings', id] as const,
  detail: (id: string, authenticated: boolean) => ['recipe-ratings', id, authenticated ? 'mine' : 'public'] as const,
  mutation: (id: string) => ['recipe-rating-change', id] as const,
};
