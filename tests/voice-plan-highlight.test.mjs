import assert from 'node:assert/strict';
import test from 'node:test';

import { voicePlanHighlight } from '../src/features/meal-plan/utils/voice-plan-highlight.ts';

const ref = (id) => ({ id, title: id });
const slot = (day, section, before, after) => ({ day, sections: [{ section, previous: before.map(ref), recipes: after.map(ref) }] });
const change = (days, weekStart = '2026-11-23') => ({ weekStart, applied: true, problems: [], days });

test('failed saves and unchanged meals never create a success highlight', () => {
  const value = change([slot('FRI', 'LUNCH', ['a'], ['b'])]);
  assert.equal(voicePlanHighlight({ ...value, applied: false }), null);
  assert.equal(voicePlanHighlight(change([slot('MON', 'DINNER', ['a', 'b'], ['a', 'b'])])), null);
});

test('replacing one dish highlights only its day, meal and new ID; existing dishes stay neutral', () => {
  assert.deepEqual(voicePlanHighlight(change([slot('FRI', 'LUNCH', ['a', 'kept'], ['b', 'kept'])])), {
    weekStart: '2026-11-23', targets: [{ day: 'FRI', section: 'LUNCH', recipeIds: ['b'] }],
  });
});

test('removals and moves mark the source meal even when it becomes empty', () => {
  assert.deepEqual(voicePlanHighlight(change([
    slot('MON', 'LUNCH', ['a'], []), slot('TUE', 'DINNER', ['b'], ['b', 'a']),
  ])).targets, [
    { day: 'MON', section: 'LUNCH', recipeIds: [] }, { day: 'TUE', section: 'DINNER', recipeIds: ['a'] },
  ]);
  assert.deepEqual(voicePlanHighlight(change([slot('MON', 'LUNCH', ['a', 'kept'], ['kept'])])).targets[0].recipeIds, []);
});

test('several writes in one request keep earlier additions and discard marks for dishes removed later', () => {
  const first = voicePlanHighlight(change([slot('MON', 'LUNCH', ['a'], ['a', 'b'])]));
  const second = voicePlanHighlight(change([slot('TUE', 'DINNER', [], ['c'])]), first);
  const third = voicePlanHighlight(change([slot('MON', 'LUNCH', ['a', 'b'], ['a', 'b', 'd'])]), second);
  assert.deepEqual(third.targets, [
    { day: 'MON', section: 'LUNCH', recipeIds: ['b', 'd'] }, { day: 'TUE', section: 'DINNER', recipeIds: ['c'] },
  ]);
  assert.deepEqual(voicePlanHighlight(change([slot('MON', 'LUNCH', ['a', 'b', 'd'], ['a', 'd'])]), third).targets[0].recipeIds, ['d']);
});

test('reordering highlights the reordered dishes and another week never inherits the old targets', () => {
  const first = voicePlanHighlight(change([slot('MON', 'LUNCH', ['a', 'b'], ['b', 'a'])]));
  assert.deepEqual(first.targets[0].recipeIds, ['b', 'a']);
  const next = voicePlanHighlight(change([slot('SAT', 'DINNER', [], ['new'])], '2026-11-30'), first);
  assert.deepEqual(next, { weekStart: '2026-11-30', targets: [{ day: 'SAT', section: 'DINNER', recipeIds: ['new'] }] });
});
