export const billingKeys = {
  all: ['billing'] as const,
  catalog: ['billing', 'catalog'] as const,
  overview: ['billing', 'overview'] as const,
  payment: (id: string) => ['billing', 'payment', id] as const,
};
