import assert from 'node:assert/strict';
import { test } from 'node:test';

import { savedToolParts, traceSteps } from '../src/features/meal-plan/utils/planner-trace.ts';

const call = (name, id, input, output) => ({ type: `tool-${name}`, toolCallId: id, input,
  ...(output === undefined ? { state: 'input-available' } : { state: 'output-available', output }) });

test('steps follow the tool calls: running while streaming, then their result', () => {
  const parts = [
    call('searchKnowledge', 'k', { query: 'soy iron' }, { status: 'ok', hits: [{}, {}] }),
    call('searchRecipes', 'r', { query: 'đậu hũ' }, [{ id: '1', title: 'Đậu hũ sốt cà' }]),
    call('fillSlots', 'f', {}, { applied: false, days: [], problems: [{}] }),
    call('getPlan', 'p', {}),
  ];
  assert.deepEqual(traceSteps(parts, false).map(({ status, title, description }) => [status, title, description]), [
    ['done', 'Đã tra cứu tài liệu “soy iron”', '2 đoạn'],
    ['done', 'Đã tìm món “đậu hũ”', '1 món'],
    ['done', 'Không có thay đổi được lưu', '1 vấn đề cần xem lại'],
    ['running', 'Đang xem thực đơn hiện tại…', undefined],
  ]);
});

test('a call left without output once the answer ended counts as failed', () => {
  const [knowledge, recipe] = traceSteps([call('searchKnowledge', 'k', { query: 'b12' }), call('getRecipe', 'g', {})], true);
  assert.equal(knowledge.status, 'error');
  assert.equal(knowledge.title, 'Không tra cứu được “b12”');
  assert.equal(recipe.title, 'Không xem được công thức');
  assert.equal(traceSteps([call('searchKnowledge', 'u', {}, { status: 'unavailable' })], true)[0].status, 'error');
});

test('saved thread parts keep only tool calls', () => {
  const parts = savedToolParts([
    { type: 'step-start' },
    { type: 'text', text: 'Xin chào' },
    { type: 'tool-editDraft', toolCallId: 'e', state: 'output-available', input: {}, output: { ok: true, problems: [] } },
    { type: 'tool-searchRecipes', toolCallId: 's', state: 'output-error', input: {} },
  ]);
  assert.deepEqual(traceSteps(parts, true).map(({ status, title }) => [status, title]), [
    ['done', 'Đã cập nhật bản nháp thực đơn'],
    ['error', 'Không xem danh sách món được'],
  ]);
});
