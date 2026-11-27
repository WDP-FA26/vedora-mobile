import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { useSessionStore } from '@/shared/stores/session-store';

import { mealPlanKeys } from '../data/meal-plan.keys';
import { getShoppingList } from '../services/shopping-list.service';
import { readShoppingPreferences, shoppingStorageKey, writeShoppingPreferences } from '../services/shopping-preferences';
import type { Weekday } from '../types/meal-plan.schema';
import type { ShoppingPreferences } from '../types/shopping-list.schema';
import type { VoiceFocus } from '../types/voice.schema';
import { shoppingItemKey, shoppingMatches } from '../utils/shopping-list';

export type ShoppingCommand = Extract<VoiceFocus, { kind: 'shoppingList' }>;
export function useShoppingList(weekStart: string, selected: Weekday[], command?: ShoppingCommand) {
  const userId = useSessionStore((state) => state.userId);
  const token = useSessionStore((state) => state.actor ? null : state.accessToken);
  const key = userId ? shoppingStorageKey(userId, weekStart) : null;
  const [saved, setSaved] = useState<{ key: string | null; value: ShoppingPreferences } | null>(null);
  const latest = useRef<typeof saved>(null);
  const [storageFailure, setStorageFailure] = useState<{ key: string | null; message: string } | null>(null);
  const applied = useRef<ShoppingCommand | undefined>(undefined);
  const data = useQuery({ queryKey: mealPlanKeys.shoppingList(weekStart, selected), queryFn: ({ signal }) => getShoppingList(weekStart, selected, signal), enabled: !!token && selected.length > 0, refetchOnMount: 'always', refetchInterval: 60_000 });
  const ready = saved !== null && saved.key === key;
  const preferences = ready ? saved.value : { people: 1, checked: [] };
  useEffect(() => {
    let alive = true;
    void (key ? readShoppingPreferences(key) : Promise.resolve({ people: 1, checked: [] })).then((value) => { if (alive) { latest.current = { key, value }; setSaved({ key, value }); } });
    return () => { alive = false; };
  }, [key]);
  function update(next: ShoppingPreferences | ((previous: ShoppingPreferences) => ShoppingPreferences)) {
    if (!ready || !token || token !== useSessionStore.getState().accessToken) return;
    const value = typeof next === 'function' ? next(latest.current?.key === key ? latest.current.value : preferences) : next;
    latest.current = { key, value };
    setSaved({ key, value });
    if (key) void writeShoppingPreferences(key, value).then(() => { if (token === useSessionStore.getState().accessToken) setStorageFailure(null); }).catch(() => { if (token === useSessionStore.getState().accessToken) setStorageFailure({ key, message: 'Chưa lưu được dấu đã mua trên thiết bị.' }); });
  }
  useEffect(() => {
    if (!ready || !command || applied.current === command || !data.data || data.isFetching) return;
    applied.current = command;
    const checked = new Set(command.clearChecked ? [] : preferences.checked);
    for (const item of data.data.items) {
      const itemKey = shoppingItemKey(item);
      if (shoppingMatches(item.name, command.checkItems)) checked.add(itemKey);
      if (shoppingMatches(item.name, command.uncheckItems)) checked.delete(itemKey);
    }
    update({ people: command.people ?? preferences.people, checked: [...checked] });
  });
  return { data, preferences, ready, storageError: storageFailure?.key === key ? storageFailure.message : '',
    setPeople: (people: number) => update((value) => ({ ...value, people })),
    toggle: (itemKey: string) => update((value) => ({ ...value, checked: value.checked.includes(itemKey) ? value.checked.filter((key) => key !== itemKey) : [...value.checked, itemKey] })),
    clear: () => update((value) => ({ ...value, checked: [] })),
  };
}
