import { defineStore } from 'pinia';
import type { FlightRange } from '../../shared/types/flight-hours';

export const useFlightHoursStore = defineStore('flight-hours', () => {
  const range = ref<FlightRange>('1w');
  return { range };
});
