import { Matches } from 'class-validator';

export class MonthQueryDto {
  @Matches(/^[1-9]\d{3}$/, {
    message: 'year must be a four-digit year from 1000 through 9999',
  })
  year!: string;

  @Matches(/^(?:0?[1-9]|1[0-2])$/, {
    message: 'month must be an integer from 1 through 12',
  })
  month!: string;
}
