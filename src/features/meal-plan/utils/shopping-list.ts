import type { ShoppingItem, ShoppingList } from '../types/shopping-list.schema';

export const shoppingItemKey = (item: ShoppingItem) => `${item.ingredientId}:${item.unit ?? ''}`;
const formatNumber = (value: number) => (Math.round((value + Number.EPSILON) * 100) / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
export function itemAmount(item: ShoppingItem, people: number) {
  let known = 0, hasKnown = false, unknown = item.hasUnknownQuantity;
  for (const contribution of item.contributions) {
    const quantity = contribution.quantity === null || contribution.quantity.trim() === '' ? NaN : Number(contribution.quantity);
    if (!Number.isFinite(quantity)) { unknown = true; continue; }
    known += quantity / (contribution.servings > 0 ? contribution.servings : 1) * people;
    hasKnown = true;
  }
  const unit = item.unit ? ` ${item.unit}` : '';
  if (!hasKnown) return `Chưa rõ lượng${item.unit ? ` (${item.unit})` : ''}`;
  return `${formatNumber(known)}${unit}${unknown ? ' + phần chưa rõ lượng' : ''}`;
}
export function shoppingText(list: ShoppingList, people: number, checked: readonly string[]) {
  return `Đi chợ · ${people} người\n${list.items.map((item) => `[${checked.includes(shoppingItemKey(item)) ? 'x' : ' '}] ${item.name}: ${itemAmount(item, people)}`).join('\n')}`;
}
const normalize = (value: string) => value.toLocaleLowerCase('vi').replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export function shoppingMatches(name: string, queries?: string[] | null) {
  const text = normalize(name);
  return queries?.some((query) => { const match = normalize(query); return match.length > 0 && (text.includes(match) || match.includes(text)); }) ?? false;
}
