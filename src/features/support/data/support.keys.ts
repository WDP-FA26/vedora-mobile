export const supportKeys = {
  all: ['support'] as const,
  list: (status?: string) => ['support', 'list', status ?? 'all'] as const,
  detail: (id: string) => ['support', 'detail', id] as const,
};
