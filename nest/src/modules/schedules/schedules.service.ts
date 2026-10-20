import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
import seed from '../../data/mock-schedules.json' with { type: 'json' };
import type {
  ScheduleEntryDto,
  SchedulesResponseDto,
} from './dto/schedules-response.dto.js';

@Injectable()
export class SchedulesService {
  private readonly today: string;
  private readonly months = new Map<string, ScheduleEntryDto[]>();

  constructor(config: ConfigService<AppConfig, true>) {
    this.today = config.get('businessDate', { infer: true });
    // Index once at startup; a month request never scans the full schedule.
    for (const entry of [...seed.schedules].sort((a, b) =>
      a.duty_date.localeCompare(b.duty_date),
    )) {
      const month = entry.duty_date.slice(0, 7);
      const entries = this.months.get(month) ?? [];
      entries.push({
        ...entry,
        remainingDuties: entry.count_schedules - entry.count_logbooks,
        isComplete: entry.count_logbooks === entry.count_schedules,
      });
      this.months.set(month, entries);
    }
  }

  list(year: number, month: number): SchedulesResponseDto {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return {
      year,
      month,
      today: this.today,
      legend: seed.legend,
      schedules: this.months.get(key) ?? [],
    };
  }
}
