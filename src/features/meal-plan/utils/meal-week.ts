import type { MealPlan } from '../types/meal-plan.schema';

/** Calendar arithmetic on dates supplied by the server, independent of the device time zone. */
export function addCalendarDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function weekRange(weekStart: string) {
  const label = (date: string) => date.split('-').reverse().join('/');
  return `${label(weekStart)} – ${label(addCalendarDays(weekStart, 6))}`;
}

export function planningWeeks(plan?: Pick<MealPlan, 'minWeekStart' | 'currentWeekStart' | 'maxWeekStart'>) {
  if (!plan) return [];
  const weeks: string[] = [];
  for (let week = plan.minWeekStart; week <= plan.maxWeekStart; week = addCalendarDays(week, 7)) weeks.push(week);
  return weeks;
}

export function isPlanningWeekend(plan?: Pick<MealPlan, 'today' | 'days'>) {
  return plan?.days.some((day) => (day.day === 'SAT' || day.day === 'SUN') && day.date === plan.today) ?? false;
}
