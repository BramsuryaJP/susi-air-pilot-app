export interface ScheduleEntry {
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
export interface ScheduleLegend {
  code: string;
  label: string;
  color: string;
}
export interface MonthlySchedule {
  year: number;
  month: number;
  today: string;
  legend: ScheduleLegend[];
  schedules: ScheduleEntry[];
}
