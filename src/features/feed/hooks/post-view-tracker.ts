import { MAX_VIEW_BATCH, viewedPostIdSchema } from '../types/post-view.schema';

const DWELL_MS = 1000;
const BATCH_DELAY_MS = 3000;
const MAX_SEEN = 500;

/** Client-side visibility timers; the server owns totals and deduplication between screens. */
export function createPostViewTracker(send: (ids: string[], signal: AbortSignal) => Promise<void>) {
  let active = false;
  let generation = 0;
  let visible = new Set<string>();
  const dwell = new Map<string, ReturnType<typeof setTimeout>>();
  const seen = new Set<string>();
  const pending = new Set<string>();
  const flights = new Set<AbortController>();
  let batchTimer: ReturnType<typeof setTimeout> | undefined;

  function schedule() {
    if (!batchTimer && pending.size) batchTimer = setTimeout(flush, BATCH_DELAY_MS);
  }
  function flush() {
    clearTimeout(batchTimer); batchTimer = undefined;
    const ids = [...pending]; pending.clear();
    const startedGeneration = generation;
    for (let start = 0; start < ids.length; start += MAX_VIEW_BATCH) {
      const batch = ids.slice(start, start + MAX_VIEW_BATCH);
      const controller = new AbortController(); flights.add(controller);
      // One bounded retry; view telemetry must never block browsing or retry forever.
      void send(batch, controller.signal).catch(async () => {
        if (!controller.signal.aborted && startedGeneration === generation) {
          await send(batch, controller.signal).catch(() => undefined);
        }
      }).finally(() => flights.delete(controller));
    }
  }
  function reconcile() {
    for (const [id, timer] of dwell) if (!active || !visible.has(id)) { clearTimeout(timer); dwell.delete(id); }
    if (!active) return;
    for (const id of visible) {
      if (seen.has(id) || dwell.has(id)) continue;
      dwell.set(id, setTimeout(() => {
        dwell.delete(id);
        if (!active || !visible.has(id)) return;
        seen.add(id);
        if (seen.size > MAX_SEEN) seen.delete(seen.values().next().value!);
        pending.add(id); schedule();
      }, DWELL_MS));
    }
  }
  return {
    update(ids: string[]) { visible = new Set(ids.filter((id) => viewedPostIdSchema.safeParse(id).success)); reconcile(); },
    setActive(value: boolean) { active = value; reconcile(); if (!value) flush(); },
    reset() {
      generation++;
      for (const controller of flights) controller.abort();
      flights.clear(); clearTimeout(batchTimer); batchTimer = undefined;
      for (const timer of dwell.values()) clearTimeout(timer);
      dwell.clear(); pending.clear(); seen.clear(); reconcile();
    },
    dispose() {
      active = false; visible.clear(); reconcile(); flush();
    },
  };
}

/** At least half the item, capped at half the viewport for a long article. */
export function isPostVisible(top: number, height: number, offset: number, viewportHeight: number) {
  const overlap = Math.min(top + height, offset + viewportHeight) - Math.max(top, offset);
  return height > 0 && viewportHeight > 0 && overlap >= Math.min(height, viewportHeight) / 2;
}
