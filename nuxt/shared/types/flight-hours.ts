export type FlightRange = '1w' | '1m' | '3m' | '6m' | '1y';
export type LimitKey = 'daily' | 'weekly' | 'monthly' | 'annual';

export interface LimitCard {
  key: LimitKey;
  windowDays: number;
  hours: number;
  limit: number;
  remainingHours: number;
  utilizationPercent: number;
  overLimit: boolean;
}

export interface FlightPoint {
  date: string;
  hours: number;
  isToday: boolean;
  isProjection: boolean;
}

export interface FlightSummary {
  today: string;
  range: FlightRange;
  windowDays: number;
  limit: number;
  yMax: number;
  futurePolicy: 'provided-data-projection';
  cards: LimitCard[];
  series: FlightPoint[];
}

export interface DailyFlightHours {
  from: string;
  to: string;
  days: Array<{ date: string; hours: number; isProjection: boolean }>;
}
