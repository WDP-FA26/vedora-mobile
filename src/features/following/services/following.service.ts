import { z } from "zod";

import { feedPageSchema } from "@/features/feed/types/feed.schema";
import { requestJson } from "@/shared/api/request-json";

const myProfileSchema = z.object({ id: z.string() });

const followedAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
});

const followedAuthorsPageSchema = z.object({
  items: z.array(followedAuthorSchema),
  nextCursor: z.string().nullable(),
});

export type FollowedAuthor = z.output<typeof followedAuthorSchema>;

export function getMyProfile(signal?: AbortSignal) {
  return requestJson(myProfileSchema, {
    method: "GET",
    url: "/profiles/me",
    signal,
  });
}

export function getFollowedAuthorsPage({
  profileId,
  cursor,
  signal,
}: {
  profileId: string;
  cursor: string | null;
  signal?: AbortSignal;
}) {
  return requestJson(followedAuthorsPageSchema, {
    method: "GET",
    url: `/profiles/${profileId}/following`,
    params: cursor ? { cursor } : undefined,
    signal,
  });
}

export function getAuthorRecentPosts(authorId: string, signal?: AbortSignal) {
  return requestJson(feedPageSchema, {
    method: "GET",
    url: "/posts",
    params: { authorId, limit: 20 },
    signal,
  });
}
