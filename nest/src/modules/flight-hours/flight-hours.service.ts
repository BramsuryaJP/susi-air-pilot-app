import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
import seed from '../../data/mock-flight-hours.json' with { type: 'json' };
import type { FlightRange } from './dto/summary-query.dto.js';

const DAY_MS = 86400000;
const ordinal = (date: string) => Date.parse(`${date}T00:00:00.000Z`) / DAY_MS;
const dateAt = (day: number) =>
  new Date(day * DAY_MS).toISOString().slice(0, 10);
const windows = { daily: 1, weekly: 7, monthly: 30, annual: 365 } as const;

@Injectable()
export class FlightHoursService {
  private readonly today: string;
  private readonly firstDay = ordinal(seed.flightHours[0].date);
  private readonly hours = new Map(
    seed.flightHours.map((entry) => [
      ordinal(entry.date),
      Math.round(entry.hours * 10),
    ]),
  );
  private readonly prefix: number[] = [0];

  constructor(config: ConfigService<AppConfig, true>) {
    this.today = config.get('businessDate', { infer: true });
    const lastDay = ordinal(seed.flightHours[seed.flightHours.length - 1].date);
    // Build once at startup. Integer tenths keep repeated decimal sums exact.
    for (let day = this.firstDay; day <= lastDay; day++) {
      this.prefix.push(
        this.prefix[this.prefix.length - 1] + (this.hours.get(day) ?? 0),
      );
    }
  }

  daily(from: string, to: string) {
    const first = ordinal(from);
    const last = ordinal(to);
    if (
      !Number.isInteger(first) ||
      !Number.isInteger(last) ||
      last < first ||
      last - first >= 366
    ) {
      throw new BadRequestException(
        'The date range must be ordered and contain at most 366 days.',
      );
    }
    return {
      from,
      to,
      days: Array.from({ length: last - first + 1 }, (_, index) => {
        const date = dateAt(first + index);
        return {
          date,
          hours: (this.hours.get(first + index) ?? 0) / 10,
          isProjection: date > this.today,
        };
      }),
    };
  }

  // this is a rolling sum calculation :)
  rollingWindowBluffing(date: string, windowDays: number): number {
    const end = ordinal(date);
    const before = end - windowDays;
    const prefixAt = (day: number) =>
      this.prefix[
        Math.max(0, Math.min(this.prefix.length - 1, day - this.firstDay + 1))
      ];
    return (prefixAt(end) - prefixAt(before)) / 10;
  }

  summary(range: FlightRange) {
    const bounds = seed.chartBounds[range];
    const center = ordinal(this.today);
    return {
      today: this.today,
      range,
      windowDays: bounds.windowDays,
      limit: bounds.limit,
      yMax: bounds.max,
      futurePolicy: 'provided-data-projection' as const,
      cards: (Object.keys(windows) as Array<keyof typeof windows>).map(
        (key) => {
          const hours = this.rollingWindowBluffing(this.today, windows[key]);
          const limit = seed.limits[key];
          return {
            key,
            windowDays: windows[key],
            hours,
            limit,
            remainingHours: Math.max(0, Math.round((limit - hours) * 10) / 10),
            utilizationPercent: Math.round((hours / limit) * 1000) / 10,
            overLimit: hours > limit,
          };
        },
      ),
      series: Array.from({ length: 15 }, (_, index) => {
        const date = dateAt(center + index - 7);
        return {
          date,
          hours: this.rollingWindowBluffing(date, bounds.windowDays),
          isToday: index === 7,
          isProjection: index > 7,
        };
      }),
    };
  }
}
