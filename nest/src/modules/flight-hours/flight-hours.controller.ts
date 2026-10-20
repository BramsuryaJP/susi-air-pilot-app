import { Controller, Get, Header, Query } from '@nestjs/common';
import { DailyHoursQueryDto } from './dto/daily-hours-query.dto.js';
import { SummaryQueryDto } from './dto/summary-query.dto.js';
import { FlightHoursService } from './flight-hours.service.js';

@Controller('flight-hours')
export class FlightHoursController {
  constructor(private readonly hours: FlightHoursService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  daily(@Query() input: DailyHoursQueryDto) {
    return this.hours.daily(input.from, input.to);
  }

  @Get('summary')
  @Header('Cache-Control', 'private, no-store')
  summary(@Query() input: SummaryQueryDto) {
    return this.hours.summary(input.range);
  }
}
