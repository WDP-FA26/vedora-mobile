import { ApiError } from '@/shared/api/api-error';

import { MAX_CALORIES, MAX_SERVINGS, MIN_SERVINGS, type MealLogEntry, type MealLogEntryUpdate, type MealLogWeek } from '../types/meal-log.schema';

export const vn = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

/** "450 kcal", or "~450 kcal" for an AI estimate, which is only approximate. */
export function caloriesLabel(entry: Pick<MealLogEntry, 'calories' | 'calorieSource'>) {
  if (entry.calories === null) return 'Chưa có kcal';
  return `${entry.calorieSource === 'WEB_ESTIMATE' ? '~' : ''}${vn(entry.calories)} kcal`;
}

/** "1", "1,5"; empty or not a number gives null. At most two decimals, as the API takes. */
export function parseDecimal(value: string) {
  const trimmed = value.trim().replace(',', '.');
  const parsed = trimmed ? Number(trimmed) : NaN;
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

/** Send only changed fields so editing servings preserves recipe/AI calorie provenance. */
export function mealLogEdit(entry: MealLogEntry, servingsText: string, caloriesText: string): MealLogEntryUpdate {
  const rawServings = servingsText.trim() ? Number(servingsText.trim().replace(',', '.')) : NaN;
  if (!Number.isFinite(rawServings) || rawServings < MIN_SERVINGS || rawServings > MAX_SERVINGS) throw new Error(`Khẩu phần phải từ ${vn(MIN_SERVINGS)} đến ${MAX_SERVINGS}.`);
  const servings = Math.round(rawServings * 100) / 100;
  const text = caloriesText.trim().replace(',', '.');
  const calories = text === '' ? null : Number(text);
  if (calories !== null && (!Number.isInteger(calories) || calories < 0 || calories > MAX_CALORIES)) throw new Error(`Kcal mỗi suất phải là số nguyên từ 0 đến ${vn(MAX_CALORIES)}.`);
  return {
    ...(servings !== entry.servings ? { servings } : {}),
    ...(calories !== entry.caloriesPerServing ? { caloriesPerServing: calories } : {}),
  };
}

export function mealLogReviewPrompt(week: MealLogWeek) {
  if (!week.days.some((day) => day.date === week.today) || week.summary.completeDays === 0 || week.summary.remainingDays === 0) return null;
  const end = week.days.at(-1)?.date;
  return `Xem nhật ký ăn uống tuần ${week.weekStart} đến ${end} và nhận xét ngắn so với kế hoạch và mục tiêu của mình. Nếu nên chỉnh thực đơn thì hỏi mình trước; khi chỉnh, chỉ từ hôm nay (${week.today}) đến ${end}, không đụng tuần khác.`;
}

export function mealLogErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'MEAL_LOG_LOCKED') return 'Ngày này đã khóa. Chỉ thêm, sửa hoặc xóa được hôm nay và 7 ngày trước đó.';
    if (error.code === 'MEAL_LOG_FULL') return 'Bữa này đã đủ số món tối đa. Hãy xóa bớt một món trước.';
    if (error.status === 409) return 'Món này đã được ghi ở bữa này. Hãy tăng khẩu phần thay vì ghi thêm lần nữa.';
    if (error.code === 'AI_QUOTA_EXCEEDED') return 'Bạn đã dùng hết lượt AI trong kỳ này. Hãy tự nhập kcal.';
    if (error.status === 429) return 'Bạn thao tác hơi nhanh. Hãy thử lại sau ít giây.';
    if (error.status === 503) return 'AI đang bận. Hãy thử lại sau hoặc tự nhập kcal.';
  }
  return 'Không thực hiện được. Hãy kiểm tra kết nối rồi thử lại.';
}
