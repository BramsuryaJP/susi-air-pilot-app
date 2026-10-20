import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import seed from '../../data/mock-flight-hours.json' with { type: 'json' };
import { FlightHoursService } from './flight-hours.service.js';

const service = new FlightHoursService(
  new ConfigService({ businessDate: '2026-05-15' }),
);
const day = 86400000;
const dateAt = (date: string, offset: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + offset * day)
    .toISOString()
    .slice(0, 10);
const reference = (date: string, days: number) =>
  seed.flightHours
    .filter(
      (entry) => entry.date >= dateAt(date, 1 - days) && entry.date <= date,
    )
    .reduce((total, entry) => total + Math.round(entry.hours * 10), 0) / 10;

describe('flight-hour calculations', () => {
  it('includes both endpoints, zero-hour days, and future projections in daily data', () => {
    expect(service.daily('2026-05-14', '2026-05-17')).toEqual({
      from: '2026-05-14',
      to: '2026-05-17',
      days: [
        { date: '2026-05-14', hours: 6.7, isProjection: false },
        { date: '2026-05-15', hours: 6.4, isProjection: false },
        { date: '2026-05-16', hours: 6.2, isProjection: true },
        { date: '2026-05-17', hours: 6.6, isProjection: true },
      ],
    });
    expect(service.daily('2026-05-09', '2026-05-09').days[0].hours).toBe(0);
  });

  it('zero-fills dates outside the supplied dataset and handles leap days in UTC', () => {
    expect(
      service
        .daily('2024-02-28', '2024-03-01')
        .days.map((entry) => [entry.date, entry.hours]),
    ).toEqual([
      ['2024-02-28', 0],
      ['2024-02-29', 0],
      ['2024-03-01', 0],
    ]);
    expect(
      service
        .daily('2026-06-01', '2026-06-02')
        .days.every((entry) => entry.hours === 0),
    ).toBe(true);
  });

  it('bounds range queries and rejects reversed intervals', () => {
    expect(() => service.daily('2026-05-16', '2026-05-15')).toThrow();
    expect(() => service.daily('2024-01-01', '2026-01-01')).toThrow();
    expect(service.daily('2024-01-01', '2024-12-31').days).toHaveLength(366);
  });

  it.each(['1w', '1m', '3m', '6m', '1y'] as const)(
    'matches an independent sum for every %s chart point',
    (range) => {
      const summary = service.summary(range);
      const bounds = seed.chartBounds[range];
      expect(summary).toMatchObject({
        today: '2026-05-15',
        range,
        windowDays: bounds.windowDays,
        limit: bounds.limit,
        yMax: bounds.max,
        futurePolicy: 'provided-data-projection',
      });
      expect(summary.series).toHaveLength(15);
      expect(summary.series[7]).toMatchObject({
        date: '2026-05-15',
        isToday: true,
        isProjection: false,
      });
      for (const [index, point] of summary.series.entries()) {
        expect(point.date).toBe(dateAt('2026-05-15', index - 7));
        expect(point.hours).toBe(reference(point.date, bounds.windowDays));
        expect(point.isProjection).toBe(index > 7);
      }
      expect(
        summary.cards.map((card) => [card.key, card.hours, card.limit]),
      ).toEqual([
        ['daily', reference('2026-05-15', 1), 8],
        ['weekly', reference('2026-05-15', 7), 40],
        ['monthly', reference('2026-05-15', 30), 100],
        ['annual', reference('2026-05-15', 365), 1050],
      ]);
    },
  );

  it('keeps exact decimal sums at the dataset edges and for sparse dates', () => {
    expect(service.rollingWindowBluffing('2024-12-26', 7)).toBe(0);
    expect(service.rollingWindowBluffing('2024-12-27', 365)).toBe(5.7);
    for (const end of [
      '2024-12-30',
      '2025-01-01',
      '2026-05-31',
      '2026-06-07',
    ]) {
      expect(service.rollingWindowBluffing(end, 7)).toBe(reference(end, 7));
    }
  });

  it('preserves above-limit values and caps only remaining hours at zero', () => {
    const peak = new FlightHoursService(
      new ConfigService({ businessDate: '2026-05-20' }),
    ).summary('1w');
    expect(peak.series.some((point) => point.hours > peak.limit)).toBe(true);
    const weekly = peak.cards.find((card) => card.key === 'weekly')!;
    expect(weekly.overLimit).toBe(true);
    expect(weekly.remainingHours).toBe(0);
    expect(weekly.utilizationPercent).toBeGreaterThan(100);
  });
});
