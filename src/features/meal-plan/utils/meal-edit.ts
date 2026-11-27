import type { GeneratedMeals, GenerateMeals, SaveMealDays } from '../types/meal-edit.schema';
import { MAX_DISHES } from '../types/meal-edit.schema';
import { mealSections, type MealPlan, type MealSection, type Weekday } from '../types/meal-plan.schema';

export type Slot = { day: Weekday; section: MealSection };
export type SlotChange = Slot & { recipeIds: string[] };
export type MealEdit = { kind: 'add'; slot: Slot; recipeId: string } | { kind: 'remove'; slot: Slot; recipeId: string } | { kind: 'move'; slot: Slot; to: Slot; recipeId: string };
const field = { BREAKFAST: 'breakfast', LUNCH: 'lunch', DINNER: 'dinner', OTHER: 'others' } as const;
export const slotIds = (plan: MealPlan, slot: Slot) => plan.days.find((day) => day.day === slot.day)?.sections.find((section) => section.section === slot.section)?.recipes.map(({ id }) => id) ?? [];
const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

export function inputsForChanges(plan: MealPlan, changes: SlotChange[]): SaveMealDays['days'] {
  if (!plan.editable) throw new Error('Tuần này chỉ có thể xem lại.');
  const changedDays = new Set(changes.map(({ day }) => day));
  for (const change of changes) {
    if (!plan.days.find(({ day }) => day === change.day)?.editable) throw new Error('Ngày đã qua chỉ có thể xem lại.');
    if (change.recipeIds.length > MAX_DISHES) throw new Error(`Mỗi bữa tối đa ${MAX_DISHES} món.`);
    if (new Set(change.recipeIds).size !== change.recipeIds.length) throw new Error('Món đã có trong bữa này.');
  }
  return plan.days.filter(({ day }) => changedDays.has(day)).map(({ day }) => {
    const result: SaveMealDays['days'][number] = { day, breakfast: [], lunch: [], dinner: [], others: [] };
    for (const section of mealSections) result[field[section]] = changes.find((change) => change.day === day && change.section === section)?.recipeIds ?? slotIds(plan, { day, section });
    return result;
  });
}

export function editChanges(plan: MealPlan, edit: MealEdit): SlotChange[] {
  const source = slotIds(plan, edit.slot);
  if (edit.kind === 'add') {
    if (source.includes(edit.recipeId)) throw new Error('Món đã có trong bữa này.');
    return [{ ...edit.slot, recipeIds: [...source, edit.recipeId] }];
  }
  if (!source.includes(edit.recipeId)) throw new Error('Thực đơn đã thay đổi. Hãy tải lại trước khi chỉnh sửa.');
  const removed = { ...edit.slot, recipeIds: source.filter((id) => id !== edit.recipeId) };
  if (edit.kind === 'remove') return [removed];
  if (edit.slot.day === edit.to.day && edit.slot.section === edit.to.section) throw new Error('Hãy chọn một bữa khác để chuyển món.');
  const destination = slotIds(plan, edit.to);
  if (destination.includes(edit.recipeId)) throw new Error('Món đã có trong bữa được chọn.');
  return [removed, { ...edit.to, recipeIds: [...destination, edit.recipeId] }];
}

export function generatedChanges(plan: MealPlan, preview: GeneratedMeals, request: GenerateMeals): SlotChange[] {
  if (preview.weekStart && preview.weekStart !== plan.weekStart) throw new Error('Đề xuất không thuộc tuần đang chọn.');
  // The BE preview includes all four meals of each generated day, including untouched meals.
  const changes = preview.days.flatMap(({ day, sections }) => sections.flatMap(({ section, recipes, previous }) => {
    if (!request.days.includes(day) || !request.sections.includes(section)) return [];
    const before = previous.map(({ id }) => id);
    const recipeIds = recipes.map(({ id }) => id);
    if (sameIds(before, recipeIds)) return [];
    const current = slotIds(plan, { day, section });
    if (!sameIds(current, before) || (request.onlyEmpty && current.length > 0)) throw new Error('Thực đơn đã thay đổi. Hãy lên nhanh lại để giữ các món vừa chỉnh.');
    return [{ day, section, recipeIds }];
  }));
  if (!changes.length) throw new Error('Không tìm được món phù hợp cho các bữa bạn chọn.');
  return changes;
}

export function undoFor(plan: MealPlan, changes: SlotChange[]) {
  return changes.map((change) => ({ ...change, recipeIds: slotIds(plan, change) }));
}
export function assertUndoCurrent(plan: MealPlan, applied: SlotChange[]) {
  if (applied.some((change) => !sameIds(slotIds(plan, change), change.recipeIds))) throw new Error('Các bữa này đã được chỉnh tiếp. Không thể hoàn tác thay đổi cũ.');
}
