import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import seed from '../../data/mock-schedules.json' with { type: 'json' };
import { SchedulesService } from './schedules.service.js';

const service = new SchedulesService(
  new ConfigService({ businessDate: '2026-05-15' }),
);

describe('monthly schedules', () => {
  it.each([4, 5, 6])(
    'returns only month %s in chronological order with the original legend and colors',
    (month) => {
      const result = service.list(2026, month);
      const expected = seed.schedules.filter((entry) =>
        entry.duty_date.startsWith(`2026-${String(month).padStart(2, '0')}-`),
      );
      expect(result).toMatchObject({
        year: 2026,
        month,
        today: '2026-05-15',
        legend: seed.legend,
      });
      expect(
        result.schedules.map(
          ({ remainingDuties: _remaining, isComplete: _complete, ...entry }) =>
            entry,
        ),
      ).toEqual(expected);
    },
  );

  it('derives completion from counts rather than the supplied status flag', () => {
    expect(
      service
        .list(2026, 5)
        .schedules.find((entry) => entry.duty_date === '2026-05-15'),
    ).toMatchObject({ status: 1, isComplete: true, remainingDuties: 0 });
    expect(
      service
        .list(2026, 4)
        .schedules.find((entry) => entry.duty_date === '2026-04-13'),
    ).toMatchObject({ status: 2, isComplete: false, remainingDuties: 2 });
    expect(
      service
        .list(2026, 5)
        .schedules.find((entry) => entry.duty_date === '2026-05-19'),
    ).toMatchObject({ isComplete: false, remainingDuties: 2 });
  });

  it('preserves a day color even when it differs from the duty legend color', () => {
    const june = service.list(2026, 6);
    expect(
      june.schedules.find((entry) => entry.duty_date === '2026-06-04'),
    ).toMatchObject({ duty_type: 'TRX', base_color: '#FBA577' });
    expect(june.legend.find((entry) => entry.code === 'TRX')?.color).toBe(
      '#F59E0B',
    );
  });

  it.each([
    [2026, 7],
    [2024, 2],
    [2025, 12],
    [2027, 1],
  ])(
    'returns a valid empty response for %s/%s without borrowing another month',
    (year, month) => {
      expect(service.list(year, month)).toMatchObject({
        year,
        month,
        schedules: [],
        legend: seed.legend,
      });
    },
  );

  it('uses the configured business clock rather than the fixture date', () => {
    expect(
      new SchedulesService(
        new ConfigService({ businessDate: '2027-01-01' }),
      ).list(2026, 5).today,
    ).toBe('2027-01-01');
  });
});
