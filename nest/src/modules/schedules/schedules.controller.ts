import { Controller, Get, Header, Query } from '@nestjs/common';
import { MonthQueryDto } from './dto/month-query.dto.js';
import type { SchedulesResponseDto } from './dto/schedules-response.dto.js';
import { SchedulesService } from './schedules.service.js';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  list(@Query() query: MonthQueryDto): SchedulesResponseDto {
    return this.schedules.list(Number(query.year), Number(query.month));
  }
}
