/** A notification may point outside the loaded page; never duplicate that comment. */
export function includeComment<T extends { id: string }>(items: T[], target?: T): T[] {
  const unique = items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index);
  if (!target) return unique;
  return [unique.find((item) => item.id === target.id) ?? target, ...unique.filter((item) => item.id !== target.id)];
}
