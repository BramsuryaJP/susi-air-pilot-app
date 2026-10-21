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
  <div class="schedule-body">
    <div class="calendar-main">
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
                  :style="
                    entries.has(date)
                      ? {
                          backgroundColor: entries.get(date)!.base_color,
                          color: calendarTextColor(
                            entries.get(date)!.base_color,
                          ),
                        }
                      : undefined
                  "
                >
                  <span class="day-number">{{ Number(date.slice(8)) }}</span>
                  <template v-if="entries.has(date)">
                    <span
                      class="duty-badge"
                      :data-complete="entries.get(date)!.isComplete"
                      aria-hidden="true"
                      >{{
                        entries.get(date)!.isComplete
                          ? '✓'
                          : entries.get(date)!.remainingDuties
                      }}</span
                    >
                    <span class="base-name">{{
                      entries.get(date)!.base_name
                    }}</span>
                  </template>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="calendar-key">
          A tick means all duties are logged. Numbers show remaining duties. The
          red outline marks today.
        </p>
      </div>
      <p v-if="!schedule.schedules.length" class="empty-month" role="status">
        No duties scheduled for this month.
      </p>
    </div>
    <section class="legend-panel" aria-labelledby="legend-title">
      <h2 id="legend-title">Duty legend</h2>
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
.schedule-body {
  display: grid;
  gap: 1.5rem;
  align-items: start;
}
.calendar-main {
  min-width: 0;
}
.calendar-card {
  padding: 0.65rem 0.45rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
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
  min-height: 94px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  padding: 0.6rem;
  border-radius: 10px;
  color: var(--navy);
  background: var(--background);
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
    outline: 3px solid var(--navy);
    outline-offset: 1px;
    z-index: 1;
  }
}
.day-number {
  font-weight: 700;
  font-size: 0.95rem;
}
.base-name {
  font-size: 0.7rem;
  font-weight: 600;
}
.duty-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 0 10px 0 7px;
  background: #ffffffec;
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
  margin: 1rem 0 0;
  color: var(--muted-on-background);
  font-size: 0.85rem;
}
.legend-panel {
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  h2 {
    font-size: 1rem;
    margin: 0 0 1.25rem;
    letter-spacing: -0.025em;
  }
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
  .schedule-body {
    grid-template-columns: minmax(0, 1fr) 260px;
  }
  .legend-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .schedule-body {
    gap: 1.25rem;
  }
  .day-link {
    min-height: 78px;
    padding: 0.45rem 0.3rem;
    border-radius: 8px;
  }
  .day-number {
    font-size: 0.85rem;
  }
  .duty-badge {
    min-width: 17px;
    height: 17px;
    font-size: 0.65rem;
    border-radius: 0 8px 0 6px;
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
    padding: 1rem;
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
    font-size: 0.8rem;
  }
  .duty-badge {
    min-width: 16px;
    height: 16px;
    font-size: 0.6rem;
  }
}
</style>
