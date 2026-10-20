import { IsISO8601, IsString, Matches } from 'class-validator';

export class DailyHoursQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  from!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  to!: string;
}
