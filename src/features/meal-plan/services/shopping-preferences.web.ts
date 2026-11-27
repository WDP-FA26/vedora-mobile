import { shoppingPreferencesSchema, type ShoppingPreferences } from '../types/shopping-list.schema';

export const shoppingStorageKey = (userId: string, weekStart: string) => `vedora-shopping-${encodeURIComponent(userId)}-${weekStart}`;
export async function readShoppingPreferences(key: string): Promise<ShoppingPreferences> {
  try { return shoppingPreferencesSchema.parse(JSON.parse(localStorage.getItem(key) ?? '{}')); }
  catch { return { people: 1, checked: [] }; }
}
export async function writeShoppingPreferences(key: string, value: ShoppingPreferences) {
  localStorage.setItem(key, JSON.stringify(shoppingPreferencesSchema.parse(value)));
}
