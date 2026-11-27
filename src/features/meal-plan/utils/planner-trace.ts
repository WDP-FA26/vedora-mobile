import { z } from 'zod';

import type { AiPart } from '@/shared/api/ai-stream';

export type ToolPart = Exclude<AiPart, { type: 'text' }>;
export type TraceStatus = 'running' | 'done' | 'error';
export type TraceIcon = 'book' | 'search' | 'calendar' | 'tool';
export type TraceStep = { key: string; status: TraceStatus; icon: TraceIcon; title: string; description?: string };

// Mirror the inputs and outputs of vedora-api's planner tools (same as the web's agent trace).
const queryInputSchema = z.object({ query: z.string().optional() });
const knowledgeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), hits: z.array(z.unknown()) }),
  z.object({ status: z.literal('unavailable') }),
]);
const recipesSchema = z.array(z.unknown());
const checkSchema = z.object({ ok: z.boolean(), problems: z.array(z.unknown()) });

export function isToolPart(part: AiPart): part is ToolPart {
  return part.type !== 'text';
}

/** Tool parts of a saved thread message (AI SDK UI parts), in the shape the live stream gives. */
export function savedToolParts(parts: Record<string, unknown>[]): ToolPart[] {
  return parts.flatMap((part) => typeof part.type === 'string' && part.type.startsWith('tool-') && typeof part.toolCallId === 'string'
    ? [{
      type: part.type as ToolPart['type'],
      toolCallId: part.toolCallId,
      state: part.state === 'output-available' ? 'output-available' as const : 'input-available' as const,
      input: part.input,
      output: part.output,
    }]
    : []);
}

function quoted(query: string | undefined) {
  return query ? ` “${query}”` : '';
}

/**
 * One line per tool call, in order. A call with no output once the answer has `finished` failed:
 * the stream parser drops `tool-output-error`, so such a call never gets its output.
 */
export function traceSteps(parts: ToolPart[], finished: boolean): TraceStep[] {
  return parts.map((part) => {
    const name = part.type.replace(/^tool-/, '');
    const query = queryInputSchema.safeParse(part.input).data?.query?.trim() || undefined;
    const done = part.state === 'output-available';
    const failed = !done && finished;
    const status: TraceStatus = failed ? 'error' : done ? 'done' : 'running';
    const key = part.toolCallId;
    const pick = (running: string, ok: string, error: string) => status === 'error' ? error : status === 'done' ? ok : running;

    if (name === 'searchKnowledge') {
      const result = done ? knowledgeSchema.safeParse(part.output).data : undefined;
      // A search that could not run is not the same as one that found nothing.
      const unavailable = failed || result?.status === 'unavailable';
      const hits = result?.status === 'ok' ? result.hits.length : 0;
      return {
        key,
        icon: 'book',
        status: unavailable ? 'error' : status,
        title: unavailable ? `Không tra cứu được${quoted(query)}` : done ? `Đã tra cứu tài liệu${quoted(query)}` : `Đang tra cứu tài liệu${quoted(query)}`,
        description: done && !unavailable ? (hits ? `${hits} đoạn` : 'Không có kết quả') : undefined,
      };
    }
    if (name === 'searchRecipes') {
      const target = query ? `tìm món${quoted(query)}` : 'xem danh sách món';
      const count = done ? recipesSchema.safeParse(part.output).data?.length ?? 0 : 0;
      return { key, icon: 'search', status, title: pick(`Đang ${target}`, `Đã ${target}`, `Không ${target} được`), description: done ? `${count} món` : undefined };
    }
    if (['fillSlots', 'editPlan', 'autoBalancePlan', 'verifyMealPlanAllergies'].includes(name)) {
      const result = z.object({ applied: z.boolean(), days: z.array(z.unknown()), problems: z.array(z.unknown()) }).safeParse(part.output);
      return {
        key, icon: 'calendar', status: failed || (done && !result.success) ? 'error' : status,
        title: failed ? 'Không hoàn tất cập nhật thực đơn'
          : !done ? 'Đang cập nhật thực đơn…'
            : !result.success ? 'Chưa xác nhận được kết quả lưu'
              : result.data.applied && result.data.days.length ? 'Đã lưu thay đổi vào thực đơn' : 'Không có thay đổi được lưu',
        description: result.success && result.data.problems.length ? `${result.data.problems.length} vấn đề cần xem lại` : undefined,
      };
    }
    if (name === 'editDraft' || name === 'proposeMealPlan') {
      const check = done ? checkSchema.safeParse(part.output).data : undefined;
      const problems = check && !check.ok ? check.problems.length : 0;
      const edit = name === 'editDraft';
      return {
        key,
        icon: 'calendar',
        status: problems ? 'error' : status,
        title: problems
          ? (edit ? 'Chỉnh sửa chưa đạt, đổi món khác' : 'Đề xuất chưa đạt, chọn lại món')
          : edit
            ? pick('Đang cập nhật bản nháp thực đơn…', 'Đã cập nhật bản nháp thực đơn', 'Không chỉnh được bản nháp thực đơn')
            : pick('Đang chọn món cho thực đơn…', 'Đã chọn món vào bản nháp', 'Không lên được thực đơn tự động'),
        description: problems ? `${problems} vấn đề` : undefined,
      };
    }
    if (name === 'askUser' || name === 'requestWebSearch') {
      return { key, icon: 'tool', status: 'done', title: name === 'askUser' ? 'Trợ lý cần thêm thông tin từ bạn' : 'Trợ lý đang hỏi quyền tìm kiếm trên web' };
    }
    if (name === 'getPlan') {
      return { key, icon: 'calendar', status, title: pick('Đang xem thực đơn hiện tại…', 'Đã xem thực đơn hiện tại', 'Không xem được thực đơn hiện tại') };
    }
    if (name === 'updateMemory') {
      return { key, icon: 'book', status, title: pick('Đang cập nhật ghi nhớ…', 'Đã cập nhật ghi nhớ của trợ lý', 'Không cập nhật được ghi nhớ') };
    }
    if (name === 'getRecipe') {
      return { key, icon: 'book', status, title: pick('Đang xem chi tiết công thức…', 'Đã xem chi tiết công thức', 'Không xem được công thức') };
    }
    return { key, icon: 'tool', status, title: pick(`Đang dùng ${name}`, `Đã dùng ${name}`, `Lỗi khi dùng ${name}`) };
  });
}
