import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { z } from 'zod';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { getPost } from '@/features/posts/services/posts.service';

import { ApiError } from '@/shared/api/api-error';
import { uploadImageToStorage } from '@/shared/api/upload-image';
import { useSessionStore } from '@/shared/stores/session-store';

import { supportKeys } from '../data/support.keys';
import { createTicket, getTicket, getTickets, replyTicket, requestAttachmentUpload, withdrawTicket } from '../services/support.service';
import { attachmentInputSchema, type CreateTicketInput, type ReplyTicketInput, type TicketStatus } from '../types/support.schema';

export function useAppealPost(postId?: string) {
  return useQuery({
    queryKey: feedKeys.detail(postId ?? ''),
    queryFn: ({ signal }) => getPost(postId!, signal),
    enabled: z.uuidv4().safeParse(postId).success,
  });
}

export function useTickets(status?: TicketStatus) {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: supportKeys.list(status), initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getTickets(pageParam, status, signal),
    getNextPageParam: (page) => page.meta.hasNextPage ? page.meta.page + 1 : undefined,
    enabled: !!token, refetchInterval: 30_000,
  });
}
export function useTicket(id: string) {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({ queryKey: supportKeys.detail(id), queryFn: ({ signal }) => getTicket(id, signal), enabled: !!token && !!id, refetchInterval: 30_000 });
}
type TicketAction = { kind: 'create'; input: CreateTicketInput } | { kind: 'reply'; id: string; input: ReplyTicketInput } | { kind: 'withdraw'; id: string };
export function useTicketAction() {
  const client = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  return useMutation({
    networkMode: 'always', retry: false,
    mutationFn: async (action: TicketAction) => {
      if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
      const result = await (action.kind === 'create' ? createTicket(action.input) : action.kind === 'reply' ? replyTicket(action.id, action.input) : withdrawTicket(action.id));
      if (useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
      return result;
    },
    onSuccess: (ticket) => {
      if (token && useSessionStore.getState().accessToken === token) client.setQueryData(supportKeys.detail(ticket.id), ticket);
    },
    onSettled: () => {
      if (token && useSessionStore.getState().accessToken === token) {
        // Appeals change edit/delete rights in every cached post and Blog surface.
        void client.invalidateQueries({ predicate: (query) => ['support', 'notifications', 'feed', 'post', 'profile', 'following', 'my-blogs', 'blog', 'bookmarks', 'post-search'].includes(String(query.queryKey[0])) });
      }
    },
  });
}
export function useSupportUpload() {
  const token = useSessionStore((state) => state.accessToken);
  return useMutation({
    networkMode: 'always', retry: false,
    mutationFn: async () => {
      const assertSession = () => {
        if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
      };
      assertSession();
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled) return null;
      assertSession();
      const image = picked.assets[0];
      const input = attachmentInputSchema.parse({
        contentType: image.mimeType ?? image.file?.type ?? '',
        sizeBytes: image.fileSize ?? image.file?.size ?? (Platform.OS !== 'web' ? new File(image.uri).size : 0),
      });
      const target = await requestAttachmentUpload(input);
      assertSession();
      await uploadImageToStorage(target.upload, image, input.contentType);
      assertSession();
      return { id: target.id, uri: image.uri };
    },
  });
}
