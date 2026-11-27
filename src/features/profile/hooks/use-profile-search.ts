import { useInfiniteQuery } from '@tanstack/react-query';
import { searchProfiles } from '../services/profile-search.service';

export function useProfileSearch(text: string) {
  const q = text.trim().slice(0, 200);
  return useInfiniteQuery({ queryKey: ['profile-search', q], initialPageParam: null as string | null, queryFn: ({ pageParam, signal }) => searchProfiles(q, pageParam, signal), getNextPageParam: (last) => last.nextCursor ?? undefined, enabled: !!q });
}
