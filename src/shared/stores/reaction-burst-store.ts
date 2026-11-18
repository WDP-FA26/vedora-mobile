import { create } from 'zustand';

export type ReactionKind = 'like' | 'repost';

type ReactionBurstState = {
  /** `id` changes on every call so the same reaction twice in a row still replays. */
  burst: { kind: ReactionKind; id: number } | null;
  show: (kind: ReactionKind) => void;
  clear: (id: number) => void;
};

export const useReactionBurstStore = create<ReactionBurstState>()((set) => ({
  burst: null,
  show: (kind) => set((state) => ({ burst: { kind, id: (state.burst?.id ?? 0) + 1 } })),
  clear: (id) => set((state) => (state.burst?.id === id ? { burst: null } : state)),
}));

/** Plays the big centred heart or repost animation over the whole app. */
export const showReactionBurst = (kind: ReactionKind) => useReactionBurstStore.getState().show(kind);
