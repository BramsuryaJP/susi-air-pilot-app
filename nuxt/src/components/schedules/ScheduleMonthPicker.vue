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
    <div class="month-selects">
      <div class="month-field">
        <label class="field-label" for="schedule-month">Month</label>
        <select id="schedule-month" v-model="monthValue" :disabled="!ready">
          <option
            v-for="option in months"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </div>
      <div class="month-field year-field">
        <label class="field-label" for="schedule-year">Year</label>
        <select id="schedule-year" v-model="yearValue" :disabled="!ready">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </div>
    </div>
    <div class="month-navigation">
      <button
        type="button"
        class="month-button"
        aria-label="Previous month"
        :disabled="!ready || !previous"
        @click="choose(previous)"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m12 5-5 5 5 5" />
        </svg>
      </button>
      <button
        type="button"
        class="month-button"
        aria-label="Next month"
        :disabled="!ready || !next"
        @click="choose(next)"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m8 5 5 5-5 5" />
        </svg>
      </button>
    </div>
    <button
      type="button"
      class="secondary-button current-month"
      :disabled="!ready || draft === currentMonth"
      @click="choose(currentMonth)"
    >
      This month
    </button>
    <p v-if="!ready" class="picker-note">
      Enable JavaScript to change the calendar month.
    </p>
  </div>
</template>

<style scoped lang="scss">
.month-controls {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }
}
.month-selects {
  display: grid;
  grid-template-columns: minmax(0, 10rem) 7rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.month-field {
  position: relative;
  min-width: 0;
  select {
    appearance: none;
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 2.25rem 0.5rem 0.85rem;
    border: 0;
    border-radius: 10px;
    color: var(--navy);
    background: transparent;
    font: inherit;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    &:disabled {
      cursor: default;
    }
  }
  svg {
    position: absolute;
    right: 0.65rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted-on-background);
  }
}
.year-field {
  border-left: 1px solid var(--border);
}
.field-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.month-navigation {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 12px;
}
.month-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  color: var(--navy);
  background: transparent;
  cursor: pointer;
  &:hover:enabled {
    background: var(--background);
  }
  &:disabled {
    color: var(--muted-on-background);
    cursor: default;
  }
  + .month-button {
    border-left: 1px solid var(--border);
  }
}
.current-month {
  justify-self: end;
  white-space: nowrap;
  font-size: 0.8rem;
  &:disabled {
    cursor: default;
  }
}
.picker-note {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted-on-background);
}
@media (max-width: 767px) {
  .month-controls {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 0.75rem;
  }
  .month-selects {
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.65fr);
  }
}
</style>
