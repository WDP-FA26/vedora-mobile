export const blogsKeys = {
  mine: ['my-blogs'] as const,
  detail: (blogId: string) => ['blog', blogId] as const,
};
