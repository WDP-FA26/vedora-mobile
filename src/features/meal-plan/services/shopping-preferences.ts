import { File, Paths } from 'expo-file-system';

import { shoppingPreferencesSchema, type ShoppingPreferences } from '../types/shopping-list.schema';

export const shoppingStorageKey = (userId: string, weekStart: string) => `vedora-shopping-${encodeURIComponent(userId)}-${weekStart}`;
const writes = new Map<string, Promise<void>>();
export async function readShoppingPreferences(key: string): Promise<ShoppingPreferences> {
  try {
    await writes.get(key)?.catch(() => {});
    const file = new File(Paths.document, `${key}.json`);
    return shoppingPreferencesSchema.parse(JSON.parse(await file.text()));
  } catch { return { people: 1, checked: [] }; }
}
export async function writeShoppingPreferences(key: string, value: ShoppingPreferences) {
  const text = JSON.stringify(shoppingPreferencesSchema.parse(value));
  const pending = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(() => new File(Paths.document, `${key}.json`).write(text));
  writes.set(key, pending);
  try { await pending; } finally { if (writes.get(key) === pending) writes.delete(key); }
}
