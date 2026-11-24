import { z } from 'zod';

import { plannerAnswerSchema, plannerQuestionSchema, plannerWebDecisionSchema, plannerWebRequestSchema, type PlannerRewind } from '../types/meal-plan.schema';
import { savedPlanChanges } from './planner-changes';
import { dayLabels } from './meal-plan';
import type { ToolPart } from './planner-trace';

type Turn = { role: 'user' | 'assistant'; text: string; toolParts?: ToolPart[]; streaming?: boolean; refused?: boolean };
export type PlannerQuestion = z.output<typeof plannerQuestionSchema> & { callId: string; answer?: string };
export type PlannerWebRequest = { callId: string; reason: string; approved?: boolean };
export const WEB_APPROVED_TEXT = 'Đồng ý, bạn cứ tìm trên web trong cuộc trò chuyện này.';
export const WEB_DECLINED_TEXT = 'Không cần tìm trên web. Hãy tiếp tục với thông tin đang có.';

export function turnQuestions(turn: Turn, followedByUser = false): PlannerQuestion[] {
  return (turn.toolParts ?? []).flatMap((part) => {
    if (part.type !== 'tool-askUser') return [];
    const input = plannerQuestionSchema.safeParse(part.input);
    const output = followedByUser && part.state === 'output-available' ? plannerAnswerSchema.safeParse(part.output) : null;
    return input.success ? [{ ...input.data, callId: part.toolCallId, answer: output?.success ? output.data.answer : undefined }] : [];
  });
}

export function turnWebRequests(turn: Turn, followedByUser = false): PlannerWebRequest[] {
  return (turn.toolParts ?? []).flatMap((part) => {
    if (part.type !== 'tool-requestWebSearch') return [];
    const input = plannerWebRequestSchema.safeParse(part.input);
    const output = followedByUser && part.state === 'output-available' ? plannerWebDecisionSchema.safeParse(part.output) : null;
    return input.success ? [{ ...input.data, callId: part.toolCallId, approved: output?.success ? output.data.approved : undefined }] : [];
  });
}

/** A decision only counts once its following user turn exists, including after a rewind. */
export function plannerWebAllowed(turns: Turn[]) {
  let allowed = false;
  turns.forEach((turn, index) => {
    if (turn.refused) return;
    for (const request of turnWebRequests(turn, turns[index + 1]?.role === 'user')) {
      if (request.approved !== undefined) allowed = request.approved;
    }
  });
  return allowed;
}

export function openPlannerInteraction(turns: Turn[]) {
  const last = turns.at(-1);
  if (!last || last.role !== 'assistant' || last.streaming || last.refused) return null;
  const question = turnQuestions(last).at(-1);
  const web = turnWebRequests(last).at(-1);
  // Only the final request can be answered when a model emits more than one.
  const finalId = last.toolParts?.filter((p) => ['tool-askUser', 'tool-requestWebSearch'].includes(p.type)).at(-1)?.toolCallId;
  return question && question.callId === finalId ? { kind: 'question' as const, ...question }
    : web && web.callId === finalId ? { kind: 'web' as const, ...web } : null;
}

const foundRecipesSchema = z.array(z.object({ id: z.string(), title: z.string() }));
export function plannerContextText(turn: Turn, followedByUser: boolean) {
  const notes: string[] = [];
  const changes = savedPlanChanges((turn.toolParts ?? []).map((p) => ({ name: p.type, callId: p.toolCallId, output: p.output })));
  if (changes.length) notes.push(`[Đã lưu vào thực đơn: ${JSON.stringify(changes)}]`);
  for (const question of turnQuestions(turn, followedByUser)) {
    notes.push(`[Câu hỏi: ${question.question}; lựa chọn: ${question.options.join(' | ')}; trả lời: ${question.answer ?? 'chưa trả lời'}]`);
  }
  for (const request of turnWebRequests(turn, followedByUser)) {
    notes.push(`[Xin tìm web: ${request.reason}; ${request.approved === true ? 'đã cho phép' : request.approved === false ? 'đã từ chối' : 'chưa cho phép'}]`);
  }
  for (const part of turn.toolParts ?? []) {
    if (part.type !== 'tool-searchRecipes' || part.state !== 'output-available') continue;
    const recipes = foundRecipesSchema.safeParse(part.output);
    if (recipes.success) notes.push(`[Món đã tìm: ${recipes.data.slice(0, 12).map((r) => `${r.title} (id ${r.id})`).join('; ')}]`);
  }
  return [turn.text, ...notes].join('\n').slice(0, 8000);
}

export function rewindSummary(result: PlannerRewind) {
  const restored = result.weeks.reduce((sum, week) => sum + week.restored.length, 0);
  const dropped = result.weeks.reduce((sum, week) => sum + week.droppedDishes, 0);
  const skipped = result.weeks.flatMap((week) => week.skipped.map((day) => `${dayLabels[day]} (tuần ${week.weekStart})`));
  return (restored ? `Đã hoàn tác và khôi phục thực đơn của ${restored} ngày.` : 'Đã quay lại. Không có thay đổi thực đơn cần khôi phục.')
    + (skipped.length ? ` Ngày đã qua giữ nguyên: ${skipped.join(', ')}.` : '')
    + (dropped ? ` ${dropped} món đã bị xóa hoặc nay cần kiêng nên không được thêm lại.` : '');
}
