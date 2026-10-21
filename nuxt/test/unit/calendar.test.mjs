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

test('duty text meets normal-text contrast even on mid-tone reds and gray', () => {
  const light = (hex) => {
    const values = [1, 3, 5].map((offset) => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  for (const background of [
    '#ef4444',
    '#f43f5e',
    '#808080',
    '#ffffff',
    '#000000',
  ]) {
    const foreground = calendarTextColor(background);
    const ratio =
      (Math.max(light(background), light(foreground)) + 0.05) /
      (Math.min(light(background), light(foreground)) + 0.05);
    assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio}`);
  }
});
