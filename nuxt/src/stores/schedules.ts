import { defineStore } from 'pinia';

export const useSchedulesStore = defineStore('schedules', () => {
  const selectedMonth = ref<string | null>(null);
  return { selectedMonth };
});
