export interface ScheduleEntryDto {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
  remainingDuties: number;
  isComplete: boolean;
}

export interface ScheduleLegendDto {
  code: string;
  label: string;
  color: string;
}

export interface SchedulesResponseDto {
  year: number;
  month: number;
  today: string;
  legend: ScheduleLegendDto[];
  schedules: ScheduleEntryDto[];
}
