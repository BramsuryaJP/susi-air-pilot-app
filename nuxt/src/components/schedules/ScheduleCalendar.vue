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
              :style="
                entries.has(date)
                  ? {
                      backgroundColor: entries.get(date)!.base_color,
                      color: calendarTextColor(entries.get(date)!.base_color),
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
      A tick means all duties are logged. Numbers show remaining duties.
    </p>
  </div>
  <p v-if="!schedule.schedules.length" class="empty-month" role="status">
    No duties scheduled for this month.
  </p>
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
</template>

<style scoped lang="scss">
.calendar-card {
  padding: 0.75rem 0.4rem;
  background: white;
  border: 1px solid #e8ebef;
  border-radius: 16px;
}
.calendar-grid {
  width: 100%;
  table-layout: fixed;
  border-spacing: 3px;
  th {
    padding: 0.5rem 0 0.8rem;
    color: #606b7a;
    font-size: 0.8rem;
    font-weight: 500;
  }
  td {
    padding: 0;
    vertical-align: top;
  }
}
.day-link {
  min-height: 86px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  padding: 0.5rem;
  border-radius: 8px;
  color: #0e2138;
  background: #f5f6f8;
  text-decoration: none;
  font-variant-numeric: tabular-nums;
  &[aria-current='date'] {
    outline: 2px solid #e63757;
    outline-offset: -2px;
  }
  &:focus-visible {
    outline: 3px solid #0e2138;
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
  min-width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 0 8px 0 6px;
  background: #ffffffec;
  color: #0e2138;
  font-size: 0.7rem;
  font-weight: 700;
}
.calendar-key {
  padding: 0.5rem 0.5rem 0;
  margin: 0.25rem 0 0;
  color: #606b7a;
  font-size: 0.75rem;
}
.empty-month {
  margin: 1rem 0 0;
  color: #606b7a;
  font-size: 0.9rem;
}
.legend-panel {
  margin-top: 1.5rem;
  background: white;
  border: 1px solid #e8ebef;
  border-radius: 16px;
  padding: 1.25rem;
  h2 {
    font-size: 1rem;
    margin: 0 0 1rem;
  }
}
.legend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: 0.8rem;
    color: #606b7a;
  }
  strong {
    display: block;
    font-size: 0.75rem;
    color: #0e2138;
  }
}
.legend-swatch {
  flex: 0 0 12px;
  height: 12px;
  margin-top: 0.2rem;
  border-radius: 3px;
}
@media (max-width: 640px) {
  .day-link {
    min-height: 72px;
    padding: 0.4rem 0.25rem;
  }
  .day-number {
    font-size: 0.8rem;
  }
  .duty-badge {
    min-width: 14px;
    height: 14px;
    font-size: 0.6rem;
  }
  .base-name {
    font-size: 0.6rem;
  }
  .calendar-grid {
    border-spacing: 2px;
    th {
      font-size: 0.65rem;
    }
  }
  .legend-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
