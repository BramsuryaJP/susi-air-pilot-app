<script setup lang="ts">
import type { FlightSummary } from '../../../shared/types/flight-hours';

const props = defineProps<{ summary: FlightSummary }>();
const x = (index: number) => 2 + (index / 14) * 96;
const y = (hours: number) =>
  95 - (Math.min(hours, props.summary.yMax) / props.summary.yMax) * 90;
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
const ticks = computed(() => {
  // Round display ticks without changing the API's fixed chart bounds.
  const target = props.summary.yMax / 3;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step =
    [1, 1.5, 2, 2.5, 5, 10].find((unit) => unit * magnitude >= target)! *
    magnitude;
  const values = [0];
  for (let tick = step; tick < props.summary.yMax; tick += step) {
    if (props.summary.yMax - tick >= props.summary.yMax * 0.15)
      values.push(tick);
  }
  return [...values, props.summary.yMax];
});
const dateIndices = [0, 3, 7, 11, 14];
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
    <figcaption class="chart-meta">
      <span
        >{{ summary.windowDays }}-day rolling total
        <span class="chart-unit">/ hours</span></span
      >
      <span class="limit-label"
        ><i aria-hidden="true" />Limit {{ summary.limit }}h</span
      >
    </figcaption>
    <div class="chart-layout">
      <div class="y-axis" aria-hidden="true">
        <span
          v-for="tick in ticks"
          :key="tick"
          :style="{ top: `${y(tick)}%` }"
          >{{ tick }}</span
        >
      </div>
      <div class="plot-column">
        <svg
          class="chart-plot"
          role="img"
          aria-label="Rolling flight hours for seven days before and after today"
          data-testid="flight-chart"
          :data-range="summary.range"
          :data-y-max="summary.yMax"
        >
          <title>{{ summary.windowDays }}-day rolling flight hours</title>
          <desc>
            Cyan shows hours through today. Dashed navy shows planned
            projections. The shaded right half shows future dates. The red line
            marks the
            {{ summary.limit }}-hour limit. All values are available in the
            table below.
          </desc>
          <rect
            class="projection-area"
            x="50%"
            y="5%"
            width="48%"
            height="90%"
          />
          <line
            v-for="tick in ticks"
            :key="tick"
            class="chart-grid"
            x1="2%"
            x2="98%"
            :y1="`${y(tick)}%`"
            :y2="`${y(tick)}%`"
          />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <polygon
              class="actual-area"
              :points="`${x(0)},95 ${actual} ${x(7)},95`"
            />
            <polyline class="actual-line" :points="actual" />
            <polyline class="planned-line" :points="planned" />
          </svg>
          <line
            class="limit-line"
            x1="2%"
            x2="98%"
            :y1="`${y(summary.limit)}%`"
            :y2="`${y(summary.limit)}%`"
          />
          <line class="today-line" x1="50%" x2="50%" y1="5%" y2="95%" />
          <g v-for="(point, index) in summary.series" :key="point.date">
            <circle
              :cx="`${x(index)}%`"
              :cy="`${y(point.hours)}%`"
              :r="point.isToday ? 5 : 3"
              :class="{ 'planned-point': point.isProjection }"
            >
              <title>
                {{ formatDate(point.date) }}: {{ point.hours }} hours{{
                  point.isProjection ? ' (planned)' : ''
                }}
              </title>
            </circle>
            <svg
              v-if="point.hours > summary.yMax"
              :x="`${x(index)}%`"
              y="5%"
              width="1"
              height="1"
              overflow="visible"
            >
              <path class="overflow-point" d="M -5 8 L 0 0 L 5 8 Z">
                <title>
                  {{ point.hours }} hours exceeds the chart scale; see the daily
                  values.
                </title>
              </path>
            </svg>
          </g>
        </svg>
        <div class="date-axis" aria-hidden="true">
          <span
            v-for="index in dateIndices"
            :key="index"
            class="date-label"
            :class="{
              'edge-date': index === 0 || index === 14,
              'current-date': index === 7,
            }"
            :style="{ left: `${x(index)}%` }"
          >
            <span v-if="index === 7" class="today-label">Today</span>
            {{ formatDate(summary.series[index]!.date) }}
          </span>
        </div>
      </div>
    </div>
    <div class="chart-legend" aria-hidden="true">
      <span><i class="actual-key" />Recorded</span>
      <span><i class="planned-key" />Planned</span>
      <span class="today-value"
        >Today
        <strong>{{ summary.series[7]!.hours.toFixed(1) }} h</strong></span
      >
    </div>
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
  margin: 1.25rem 0 0;
  font-variant-numeric: tabular-nums;
}
.chart-meta,
.chart-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: var(--muted);
  font-size: 0.75rem;
}
.chart-meta {
  justify-content: space-between;
  margin-bottom: 1rem;
}
.chart-unit {
  color: var(--muted);
}
.limit-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--danger-text);
  font-weight: 600;
  i {
    border-color: var(--red);
    border-top-width: 1.5px;
  }
}
.chart-layout {
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
}
.y-axis {
  position: relative;
  height: 240px;
  color: var(--muted);
  font-size: 0.75rem;
  span {
    position: absolute;
    right: 0.5rem;
    transform: translateY(-50%);
  }
}
.chart-plot {
  display: block;
  width: 100%;
  height: 240px;
  overflow: visible;
}
.projection-area {
  fill: #f5f6f8;
}
.chart-grid {
  stroke: var(--border);
}
.actual-area {
  fill: var(--cyan);
  fill-opacity: 0.07;
}
.today-line {
  stroke: #94a3b8;
  stroke-dasharray: 3 5;
}
.limit-line {
  stroke: var(--red);
  stroke-width: 1.5;
}
.actual-line,
.planned-line {
  fill: none;
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.actual-line {
  stroke: #0899b8;
}
.planned-line {
  stroke: var(--navy);
  stroke-dasharray: 5 5;
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
.date-axis {
  position: relative;
  height: 3.5rem;
  margin-top: 0.5rem;
}
.date-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  color: var(--muted);
  font-size: 0.75rem;
  white-space: nowrap;
  text-align: center;
  &:first-child {
    transform: none;
  }
  &:last-child {
    transform: translateX(-100%);
  }
}
.current-date {
  color: var(--navy);
  font-weight: 600;
}
.today-label {
  display: block;
  margin: -0.2rem auto 0.15rem;
  padding: 0.15rem 0.5rem;
  width: max-content;
  border-radius: 0.35rem;
  background: var(--navy);
  color: white;
  font-size: 0.6875rem;
}
.chart-legend {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
}
i {
  width: 1.1rem;
  border-top: 2.5px solid #0899b8;
}
.planned-key {
  border-color: var(--navy);
  border-top-style: dashed;
}
.today-value {
  margin-left: auto;
  strong {
    color: var(--navy);
    font-weight: 600;
  }
}
.projection-note {
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.6;
  margin: 0.9rem 0;
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
@media (max-width: 480px) {
  .chart-layout {
    grid-template-columns: 2.25rem minmax(0, 1fr);
  }
  .chart-plot,
  .y-axis {
    height: 220px;
  }
  .date-label:not(.edge-date, .current-date) {
    display: none;
  }
}
</style>
