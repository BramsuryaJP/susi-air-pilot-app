<script setup lang="ts">
import { parseCalendarMonth, shiftCalendarMonth } from '../../utils/calendar';

const props = defineProps<{ month: string; today: string }>();
const emit = defineEmits<{ change: [month: string] }>();
const ready = ref(false);
onMounted(() => {
  ready.value = true;
});
// Keep consecutive selections together while the route guard validates the session.
const draft = ref(props.month);
watch(
  () => props.month,
  (month) => {
    draft.value = month;
  },
);
const selected = computed(() => parseCalendarMonth(draft.value)!);
const monthValue = computed({
  get: () => selected.value.month,
  set: (month: number) =>
    choose(`${selected.value.year}-${String(month).padStart(2, '0')}`),
});
const yearValue = computed({
  get: () => selected.value.year,
  set: (year: number) =>
    choose(`${year}-${String(selected.value.month).padStart(2, '0')}`),
});
const currentMonth = computed(() => props.today.slice(0, 7));
const previous = computed(() => shiftCalendarMonth(draft.value, -1));
const next = computed(() => shiftCalendarMonth(draft.value, 1));
const formatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  timeZone: 'UTC',
});
const months = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: formatter.format(new Date(Date.UTC(2000, index, 1))),
}));
const years = computed(() => {
  const first = Math.max(1000, selected.value.year - 10);
  const last = Math.min(9999, selected.value.year + 10);
  const choices = new Set(
    Array.from({ length: last - first + 1 }, (_, index) => first + index),
  );
  choices.add(Number(props.today.slice(0, 4)));
  return [...choices].sort((left, right) => left - right);
});

function choose(month: string | null) {
  if (!month || month === draft.value) return;
  draft.value = month;
  emit('change', month);
}
</script>

<template>
  <div class="month-controls" role="group" aria-label="Calendar month">
    <div class="month-field">
      <label for="schedule-month">Month</label>
      <select id="schedule-month" v-model="monthValue" :disabled="!ready">
        <option
          v-for="option in months"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
    <div class="month-field">
      <label for="schedule-year">Year</label>
      <select id="schedule-year" v-model="yearValue" :disabled="!ready">
        <option v-for="year in years" :key="year" :value="year">
          {{ year }}
        </option>
      </select>
    </div>
    <div class="month-actions">
      <button
        type="button"
        class="secondary-button month-button"
        aria-label="Previous month"
        :disabled="!ready || !previous"
        @click="choose(previous)"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        class="secondary-button current-month"
        :disabled="!ready || draft === currentMonth"
        @click="choose(currentMonth)"
      >
        This month
      </button>
      <button
        type="button"
        class="secondary-button month-button"
        aria-label="Next month"
        :disabled="!ready || !next"
        @click="choose(next)"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
    <p v-if="!ready" class="picker-note">
      Enable JavaScript to change the calendar month.
    </p>
  </div>
</template>

<style scoped lang="scss">
.month-controls {
  display: grid;
  grid-template-columns: minmax(0, 14rem) minmax(5rem, 8rem) minmax(0, 1fr);
  align-items: end;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.month-field {
  min-width: 0;
  label {
    margin-bottom: 0.4rem;
    color: var(--muted-on-background);
    font-size: 0.75rem;
  }
  select {
    width: 100%;
    min-height: 44px;
    padding: 0.6rem 0.65rem;
    border: 1px solid var(--input-border);
    border-radius: 10px;
    color: var(--navy);
    background: var(--surface);
    font: inherit;
    font-size: 1rem;
    cursor: pointer;
    &:disabled {
      cursor: default;
    }
  }
}
.month-actions {
  display: flex;
  justify-self: end;
  align-items: center;
  gap: 0.5rem;
  button:disabled {
    cursor: default;
  }
}
.month-button {
  flex: 0 0 44px;
  padding: 0;
  font-size: 1.65rem;
  line-height: 1;
}
.current-month {
  white-space: nowrap;
  font-size: 0.8rem;
}
.picker-note {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted-on-background);
}
@media (max-width: 767px) {
  .month-controls {
    grid-template-columns: minmax(0, 1fr) minmax(5rem, 0.65fr);
    gap: 0.75rem;
  }
  .month-actions {
    grid-column: 1 / -1;
    justify-self: stretch;
    justify-content: space-between;
  }
}
</style>
