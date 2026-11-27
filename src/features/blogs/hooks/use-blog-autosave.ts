import { useEffect, useRef } from 'react';

/** One attempt per edit; a failed request stays dirty until the user edits or explicitly retries. */
export function useBlogAutosave({ title, content, dirty, enabled, busy, status, save }: { title: string; content: string; dirty: boolean; enabled: boolean; busy: boolean; status: string; save: () => Promise<unknown> }) {
  const latest = useRef(save);
  const attempted = useRef('');
  useEffect(() => { latest.current = save; });
  useEffect(() => {
    const signature = JSON.stringify([title, content]);
    if (!enabled || busy || !dirty || !title.trim() || !['DRAFT', 'REJECTED'].includes(status) || attempted.current === signature) return;
    const timer = setTimeout(() => { attempted.current = signature; void latest.current(); }, 2500);
    return () => clearTimeout(timer);
  }, [title, content, dirty, enabled, busy, status]);
}
