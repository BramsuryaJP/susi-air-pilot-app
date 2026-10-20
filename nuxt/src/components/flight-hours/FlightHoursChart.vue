<script setup lang="ts">
import type { FlightSummary } from '../../../shared/types/flight-hours';

const props = defineProps<{ summary: FlightSummary }>();
const left = 90;
const right = 574;
const top = 28;
const bottom = 218;
const x = (index: number) => left + (index / 14) * (right - left);
const y = (hours: number) =>
  bottom -
  (Math.min(hours, props.summary.yMax) / props.summary.yMax) * (bottom - top);
const actual = computed(() =>
  props.summary.series
    .slice(0, 8)
    .map((point, index) => `${x(index)},${y(point.hours)}`)
    .join(' '),
);
const planned = computed(() =>
  props.summary.series
    .slice(7)
    .map((point, index) => `${x(index + 7)},${y(point.hours)}`)
    .join(' '),
);
const ticks = computed(() => [0, props.summary.yMax / 2, props.summary.yMax]);
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const formatDate = (date: string) =>
  dateFormatter.format(new Date(`${date}T00:00:00Z`));
</script>

<template>
  <figure class="trend-figure">
    <svg
      viewBox="0 0 600 300"
      role="img"
      aria-label="Rolling flight hours for seven days before and after today"
      data-testid="flight-chart"
      :data-range="summary.range"
      :data-y-max="summary.yMax"
    >
      <title>{{ summary.windowDays }}-day rolling flight hours</title>
      <desc>
        Cyan shows hours through today. Dashed navy shows planned projections.
        The red line marks the {{ summary.limit }}-hour limit. All values are
        available in the table below.
      </desc>
      <g v-for="tick in ticks" :key="tick" class="chart-grid">
        <line :x1="left" :x2="right" :y1="y(tick)" :y2="y(tick)" />
        <text :x="left - 8" :y="y(tick) + 5" text-anchor="end">{{ tick }}</text>
      </g>
      <line class="today-line" :x1="x(7)" :x2="x(7)" :y1="top" :y2="bottom" />
      <line
        class="limit-line"
        :x1="left"
        :x2="right"
        :y1="y(summary.limit)"
        :y2="y(summary.limit)"
      />
      <text
        class="limit-label"
        :x="right"
        :y="y(summary.limit) - 14"
        text-anchor="end"
      >
        Limit {{ summary.limit }}h
      </text>
      <polyline class="actual-line" :points="actual" />
      <polyline class="planned-line" :points="planned" />
      <g v-for="(point, index) in summary.series" :key="point.date">
        <circle
          :cx="x(index)"
          :cy="y(point.hours)"
          :r="point.isToday ? 5 : 3"
          :class="{ 'planned-point': point.isProjection }"
        >
          <title>
            {{ formatDate(point.date) }}: {{ point.hours }} hours{{
              point.isProjection ? ' (planned)' : ''
            }}
          </title>
        </circle>
        <path
          v-if="point.hours > summary.yMax"
          class="overflow-point"
          :d="`M ${x(index) - 5} ${top + 8} L ${x(index)} ${top} L ${x(index) + 5} ${top + 8} Z`"
        >
          <title>
            {{ point.hours }} hours exceeds the chart scale; see the daily
            values.
          </title>
        </path>
        <text
          v-if="index % 2 === 0"
          class="date-label"
          :x="x(index)"
          :y="bottom + 48"
          text-anchor="middle"
        >
          {{ point.date.slice(8) }}
        </text>
      </g>
    </svg>
    <p class="today-label">Today, {{ formatDate(summary.today) }}</p>
    <figcaption>
      <span><i class="actual-key" aria-hidden="true" />Recorded</span>
      <span><i class="planned-key" aria-hidden="true" />Planned</span>
      <span>Hours</span>
    </figcaption>
    <p class="projection-note">Future values include supplied planned hours.</p>
    <details class="chart-values">
      <summary>View daily values</summary>
      <table aria-label="Rolling flight-hour values">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Hours</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="point in summary.series" :key="point.date">
            <th scope="row">
              {{ formatDate(point.date) }}{{ point.isToday ? ' (today)' : '' }}
            </th>
            <td>{{ point.hours.toFixed(1) }}</td>
            <td>{{ point.isProjection ? 'Planned' : 'Recorded' }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>

<style scoped lang="scss">
.trend-figure {
  margin: 1rem 0 0;
}
svg {
  display: block;
  width: 100%;
  overflow: visible;
  font-family: inherit;
  font-size: 16px;
}
.chart-grid {
  stroke: var(--border);
  text {
    fill: var(--muted);
    stroke: none;
  }
}
.today-line {
  stroke: var(--input-border);
  stroke-dasharray: 4 4;
}
.limit-line {
  stroke: var(--red);
  stroke-width: 1.5;
}
.limit-label {
  fill: var(--danger-text);
  font-size: 14px;
}
.actual-line,
.planned-line {
  fill: none;
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.actual-line {
  stroke: var(--cyan);
}
.planned-line {
  stroke: var(--navy);
  stroke-dasharray: 6 5;
}
circle {
  fill: #0899b8;
  stroke: white;
  stroke-width: 1.5;
}
.planned-point {
  fill: var(--navy);
}
.overflow-point {
  fill: var(--red);
}
.date-label {
  fill: var(--muted);
}
.today-label {
  color: var(--navy);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.75rem;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--muted);
  font-size: 0.8rem;
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  span:last-child {
    margin-left: auto;
  }
}
i {
  width: 1.2rem;
  border-top: 3px solid var(--cyan);
}
.planned-key {
  border-color: var(--navy);
  border-top-style: dashed;
}
.projection-note {
  color: var(--muted);
  font-size: 0.8rem;
  margin: 1rem 0;
}
.chart-values {
  font-size: 0.85rem;
  summary {
    min-height: 44px;
    cursor: pointer;
    padding: 0.4rem 0;
  }
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
  text-align: left;
  font-variant-numeric: tabular-nums;
  th,
  td {
    padding: 0.5rem 0.25rem;
    border-bottom: 1px solid var(--border);
  }
  tbody th {
    font-weight: 400;
  }
}
@media (max-width: 640px) {
  svg { font-size: 30px; }
  .limit-label { font-size: 28px; }
}
</style>
