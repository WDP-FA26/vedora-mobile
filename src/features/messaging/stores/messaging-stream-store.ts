import { create } from 'zustand';

type MessagingStreamState = {
  /** True while the SSE stream is healthy; queries poll quickly only when it is not. */
  live: boolean;
  setLive: (live: boolean) => void;
};

export const useMessagingStreamStore = create<MessagingStreamState>((set) => ({
  live: false,
  setLive: (live) => set((state) => (state.live === live ? state : { live })),
}));
