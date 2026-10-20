import { IsIn } from 'class-validator';

export type FlightRange = '1w' | '1m' | '3m' | '6m' | '1y';

export class SummaryQueryDto {
  @IsIn(['1w', '1m', '3m', '6m', '1y'])
  range!: FlightRange;
}
