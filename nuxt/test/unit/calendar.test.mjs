import assert from 'node:assert/strict';
import test from 'node:test';
import {
  monthWeeks,
  parseCalendarMonth,
  shiftCalendarMonth,
  calendarTextColor,
} from '../../src/utils/calendar.ts';

test('calendar uses Monday-first weeks with every date and only inert outside-month padding', () => {
  const weeks = monthWeeks(2026, 5);
  assert.equal(weeks[0][4], '2026-05-01');
  assert.deepEqual(weeks[0].slice(0, 4), [null, null, null, null]);
  assert.equal(weeks.flat().filter(Boolean).length, 31);
  assert.equal(new Set(weeks.flat().filter(Boolean)).size, 31);
  assert.equal(weeks.at(-1)[6], '2026-05-31');
});
test('calendar layout preserves leap days and six-row months', () => {
  assert.equal(monthWeeks(2024, 2).flat().filter(Boolean).length, 29);
  assert.equal(monthWeeks(2026, 2).flat().filter(Boolean).length, 28);
  assert.equal(monthWeeks(2026, 3).length, 6);
});
test('month navigation crosses years and respects four-digit bounds', () => {
  assert.equal(shiftCalendarMonth('2026-01', -1), '2025-12');
  assert.equal(shiftCalendarMonth('2026-12', 1), '2027-01');
  assert.equal(shiftCalendarMonth('1000-01', -1), null);
  assert.equal(shiftCalendarMonth('9999-12', 1), null);
});
test('deep-linked months reject malformed, repeated, and out-of-bound values', () => {
  assert.deepEqual(parseCalendarMonth('2026-05'), {
    year: 2026,
    month: 5,
    key: '2026-05',
  });
  for (const value of [
    undefined,
    ['2026-05', '2026-06'],
    '2026-13',
    '2026-5',
    '0000-01',
    '2026-05-01',
    'not-a-month',
  ])
    assert.equal(parseCalendarMonth(value), null);
});
test('date-cell text selects a readable foreground without changing supplied colors', () => {
  assert.equal(calendarTextColor('#111827'), '#ffffff');
  assert.equal(calendarTextColor('#FBA577'), '#0e2138');
  assert.equal(calendarTextColor('#10B981'), '#0e2138');
});
