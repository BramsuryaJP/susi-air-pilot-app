<script setup lang="ts">
import type { MonthlySchedule } from '../../../shared/types/schedules';
import { monthWeeks, calendarTextColor } from '../../utils/calendar';

const props = defineProps<{ schedule: MonthlySchedule }>();
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weeks = computed(() =>
  monthWeeks(props.schedule.year, props.schedule.month),
);
const entries = computed(
  () =>
    new Map(props.schedule.schedules.map((entry) => [entry.duty_date, entry])),
);
const legend = computed(
  () =>
    new Map(props.schedule.legend.map((entry) => [entry.code, entry.label])),
);
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(Date.UTC(props.schedule.year, props.schedule.month - 1, 1)),
  ),
);
function dayLabel(date: string): string {
  const label = dateFormatter.format(new Date(`${date}T00:00:00Z`));
  const entry = entries.value.get(date);
  if (!entry) return `${label}, no duties scheduled`;
  return `${label}, ${legend.value.get(entry.duty_type) ?? entry.duty_type} at ${entry.base_name}, ${entry.isComplete ? 'all duties logged' : `${entry.remainingDuties} duties remaining`}`;
}
</script>

<template>
  <div class="calendar-card">
    <table
      class="calendar-grid"
      :aria-label="monthLabel"
      :data-calendar-month="`${schedule.year}-${String(schedule.month).padStart(2, '0')}`"
    >
      <thead>
        <tr>
          <th v-for="weekday in weekdays" :key="weekday" scope="col">
            {{ weekday }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(week, index) in weeks" :key="index">
          <td
            v-for="(date, column) in week"
            :key="date ?? `padding-${column}`"
            :aria-hidden="!date || undefined"
          >
            <NuxtLink
              v-if="date"
              class="day-link"
              :to="`/duty/${date}`"
              :prefetch="false"
              :data-date="date"
              :aria-label="dayLabel(date)"
              :aria-current="date === schedule.today ? 'date' : undefined"
            >
              <span class="day-heading">
                <span class="day-number">{{ Number(date.slice(8)) }}</span>
                <span
                  v-if="entries.has(date)"
                  class="duty-badge"
                  :data-complete="entries.get(date)!.isComplete"
                  aria-hidden="true"
                  >{{
                    entries.get(date)!.isComplete
                      ? '✓'
                      : entries.get(date)!.remainingDuties
                  }}</span
                >
              </span>
              <span
                v-if="date === schedule.today"
                class="today-label"
                aria-hidden="true"
                >Today</span
              >
              <span
                v-if="entries.has(date)"
                class="duty-event"
                :style="{
                  backgroundColor: entries.get(date)!.base_color,
                  color: calendarTextColor(entries.get(date)!.base_color),
                }"
              >
                <span class="duty-type">{{
                  entries.get(date)!.duty_type
                }}</span>
                <span class="base-name">{{
                  entries.get(date)!.base_name
                }}</span>
              </span>
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="calendar-key">
      A tick means all duties are logged. Numbers show remaining duties. Today
      is labelled and outlined.
    </p>
    <p v-if="!schedule.schedules.length" class="empty-month" role="status">
      No duties scheduled for this month.
    </p>
    <section class="legend-panel" aria-label="Duty legend">
      <ul class="legend-list" aria-label="Duty legend">
        <li v-for="entry in schedule.legend" :key="entry.code">
          <span
            class="legend-swatch"
            :style="{ backgroundColor: entry.color }"
            aria-hidden="true"
          />
          <span
            ><strong>{{ entry.code }}</strong
            >{{ entry.label }}</span
          >
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.calendar-card {
  padding: 0.65rem 0.45rem;
}
.calendar-grid {
  width: 100%;
  table-layout: fixed;
  border-spacing: 4px;
  th {
    padding: 0.5rem 0 0.75rem;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 600;
  }
  td {
    padding: 0;
    vertical-align: top;
  }
}
.day-link {
  min-height: 108px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  padding: 0.45rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: var(--surface);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
  &[aria-current='date'] {
    outline: 2px solid var(--red);
    outline-offset: -2px;
  }
  &:hover {
    box-shadow: inset 0 0 0 2px #0e213860;
  }
  &:focus-visible {
    outline-color: var(--focus-color);
    z-index: 1;
  }
}
.day-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1rem;
}
.day-number {
  font-weight: 700;
  font-size: 0.95rem;
}
.today-label {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  text-align: center;
  color: var(--danger-text);
  font-size: 0.65rem;
  font-weight: 700;
}
.duty-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  min-height: 30px;
  padding: 0.3rem 0.4rem;
  border-radius: 5px;
  font-size: 0.7rem;
  line-height: 1.2;
}
.duty-type {
  font-weight: 800;
}
.base-name {
  font-size: 0.7rem;
  font-weight: 600;
}
.duty-badge {
  min-width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: var(--background);
  color: var(--navy);
  font-size: 0.7rem;
  font-weight: 700;
}
.calendar-key {
  padding: 0.5rem 0.5rem 0;
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
}
.empty-month {
  margin: 1rem 0.5rem;
  color: var(--muted-on-background);
  font-size: 0.85rem;
}
.legend-panel {
  min-width: 0;
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding: 1.25rem 0.75rem 0.5rem;
}
.legend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem 0.75rem;
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted);
  }
  strong {
    display: block;
    font-size: 0.7rem;
    color: var(--navy);
    margin-bottom: 0.15rem;
  }
}
.legend-swatch {
  flex: 0 0 10px;
  height: 10px;
  margin-top: 0.25rem;
  border-radius: 3px;
}
@media (min-width: 960px) {
  .legend-list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .day-link {
    min-height: 96px;
    padding: 0.35rem 0.2rem;
    border-radius: 8px;
  }
  .day-number {
    font-size: 0.85rem;
  }
  .duty-badge {
    min-width: 14px;
    height: 16px;
    font-size: 0.6rem;
  }
  .duty-event {
    flex-direction: column;
    justify-content: center;
    gap: 0.1rem;
    min-height: 34px;
    padding: 0.25rem 0.1rem;
    font-size: 0.65rem;
  }
  .today-label {
    font-size: 0.6rem;
    top: 1.7rem;
  }
  .base-name {
    font-size: 0.65rem;
  }
  .calendar-grid {
    border-spacing: 3px;
    th {
      font-size: 0.65rem;
    }
  }
  .calendar-card {
    padding: 0.5rem 0.25rem;
  }
  .legend-panel {
    padding: 1rem 0.5rem 0.5rem;
  }
  .legend-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}
@media (max-width: 360px) {
  .day-link {
    padding-left: 0.2rem;
  }
  .day-number {
    font-size: 0.72rem;
  }
  .duty-badge {
    min-width: 12px;
    height: 14px;
    font-size: 0.6rem;
  }
}
</style>
