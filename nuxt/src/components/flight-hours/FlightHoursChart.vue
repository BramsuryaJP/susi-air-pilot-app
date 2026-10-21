<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import { useId } from 'vue';
import type {
  FlightPoint,
  FlightSummary,
} from '../../../shared/types/flight-hours';

const props = defineProps<{ summary: FlightSummary }>();
const ready = ref(false);
const plot = ref<HTMLDivElement | null>(null);
const tooltip = ref<HTMLDivElement | null>(null);
const interactionId = useId();
const helpId = `${interactionId}-help`;
const activeIndex = ref<number | null>(null);
const selectedIndex = ref(7);
const inputMode = ref<'keyboard' | 'pointer' | null>(null);
const activePoint = computed(() =>
  activeIndex.value === null
    ? null
    : (props.summary.series[activeIndex.value] ?? null),
);
const pointDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const pointDate = (date: string) =>
  pointDateFormatter.format(new Date(`${date}T00:00:00Z`));
const pointLabel = (point: FlightPoint) =>
  `${pointDate(point.date)}, ${point.hours.toFixed(1)} hours, ${point.isProjection ? 'Planned' : 'Recorded'}${point.isToday ? ', Today' : ''}`;

function selectPoint(index: number, mode: 'keyboard' | 'pointer') {
  if (!props.summary.series.length) return;
  selectedIndex.value = Math.min(
    props.summary.series.length - 1,
    Math.max(0, index),
  );
  inputMode.value = mode;
  activeIndex.value = selectedIndex.value;
}
function clearInspection() {
  activeIndex.value = null;
}
function isTooltipTarget(event: Event): boolean {
  return (
    event.target instanceof Node && !!tooltip.value?.contains(event.target)
  );
}
function inspectPointer(event: MouseEvent | PointerEvent) {
  if (!plot.value || isTooltipTarget(event)) return;
  const bounds = plot.value.getBoundingClientRect();
  if (!bounds.width) return;
  // Match the plot's 2%-98% date domain, including its edge padding.
  const index = Math.round(
    (((event.clientX - bounds.left) / bounds.width - 0.02) / 0.96) * 14,
  );
  selectPoint(index, 'pointer');
}
function hoverPoint(event: PointerEvent) {
  if (event.pointerType !== 'touch') inspectPointer(event);
}
function leavePlot(event: PointerEvent) {
  if (event.pointerType !== 'touch' && inputMode.value === 'pointer')
    clearInspection();
}
function inspectKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  let index = selectedIndex.value;
  switch (event.key) {
    case 'ArrowLeft':
      index--;
      break;
    case 'ArrowRight':
      index++;
      break;
    case 'Home':
      index = 0;
      break;
    case 'End':
      index = props.summary.series.length - 1;
      break;
    case 'Enter':
    case ' ':
      break;
    case 'Escape':
      clearInspection();
      event.preventDefault();
      return;
    default:
      return;
  }
  event.preventDefault();
  selectPoint(index, 'keyboard');
}
function dismissOutside(event: PointerEvent) {
  if (event.target instanceof Node && !plot.value?.contains(event.target))
    clearInspection();
}
function dismissEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') clearInspection();
}
watch(
  () => props.summary,
  () => {
    clearInspection();
    selectedIndex.value = 7;
    inputMode.value = null;
  },
);
onMounted(() => {
  document.addEventListener('pointerdown', dismissOutside);
  document.addEventListener('keydown', dismissEscape);
  ready.value = true;
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', dismissOutside);
  document.removeEventListener('keydown', dismissEscape);
});
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
        <div
          ref="plot"
          class="chart-interaction"
          role="group"
          aria-label="Explore flight-hour values"
          :aria-describedby="helpId"
          :tabindex="ready ? 0 : -1"
          :aria-disabled="!ready"
          @focus="selectPoint(selectedIndex, 'keyboard')"
          @blur="clearInspection"
          @pointermove="hoverPoint"
          @pointerleave="leavePlot"
          @pointercancel="clearInspection"
          @click="inspectPointer"
          @keydown="inspectKey"
        >
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
              projections. The shaded right half shows future dates. The red
              line marks the
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
            <line
              v-if="activeIndex !== null"
              class="inspection-line"
              :x1="`${x(activeIndex)}%`"
              :x2="`${x(activeIndex)}%`"
              y1="5%"
              y2="95%"
            />
            <g v-for="(point, index) in summary.series" :key="point.date">
              <circle
                :cx="`${x(index)}%`"
                :cy="`${y(point.hours)}%`"
                :r="activeIndex === index ? 6 : point.isToday ? 5 : 3"
                :class="{
                  'planned-point': point.isProjection,
                  'active-point': activeIndex === index,
                }"
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
                    {{ point.hours }} hours exceeds the chart scale; see the
                    daily values.
                  </title>
                </path>
              </svg>
            </g>
          </svg>
          <div
            v-if="activePoint && activeIndex !== null"
            ref="tooltip"
            class="chart-tooltip"
            :class="{ 'tooltip-below': y(activePoint.hours) < 50 }"
            role="tooltip"
            :style="{
              left: `clamp(0.5rem, calc(${x(activeIndex)}% - 4.75rem), calc(100% - 10rem))`,
              top: `${y(activePoint.hours)}%`,
            }"
          >
            <p class="tooltip-date">{{ pointDate(activePoint.date) }}</p>
            <strong class="tooltip-hours"
              >{{ activePoint.hours.toFixed(1) }} h</strong
            >
            <p class="tooltip-status">
              {{ activePoint.isProjection ? 'Planned' : 'Recorded'
              }}<span v-if="activePoint.isToday"> (Today)</span>
            </p>
            <p v-if="activePoint.hours > summary.yMax" class="tooltip-note">
              Above chart scale
            </p>
          </div>
        </div>
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
    <p :id="helpId" class="inspection-help">
      Hover, tap, or use arrow keys to inspect a date.
      <span class="chart-sr-only"
        >Home and End select the first and last dates. Escape closes the
        tooltip.</span
      >
    </p>
    <p
      class="chart-announcement chart-sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{
        inputMode === 'keyboard' && activePoint ? pointLabel(activePoint) : ''
      }}
    </p>
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
      <summary>
        <span>View daily values</span>
        <span class="values-count" aria-hidden="true"
          >{{ summary.series.length }} days</span
        >
        <ChevronDown
          class="values-chevron"
          :size="18"
          :stroke-width="1.7"
          aria-hidden="true"
          focusable="false"
        />
      </summary>
      <table class="values-table" aria-label="Rolling flight-hour values">
        <caption>
          {{
            summary.windowDays
          }}-day rolling totals, in hours
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col" class="value-hours">Hours</th>
            <th scope="col" class="value-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="point in summary.series"
            :key="point.date"
            :class="{ 'today-row': point.isToday }"
          >
            <th scope="row">
              <span class="value-date">
                <time
                  :datetime="point.date"
                  :aria-current="point.isToday ? 'date' : undefined"
                  >{{ formatDate(point.date) }}</time
                >
                <span v-if="point.isToday" class="value-today">Today</span>
              </span>
            </th>
            <td class="value-hours">{{ point.hours.toFixed(1) }}</td>
            <td class="value-status">
              <span
                class="values-status"
                :class="
                  point.isProjection ? 'status-planned' : 'status-recorded'
                "
                >{{ point.isProjection ? 'Planned' : 'Recorded' }}</span
              >
            </td>
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
.chart-interaction {
  position: relative;
  border-radius: 8px;
  cursor: crosshair;
  &[aria-disabled='true'] {
    pointer-events: none;
  }
}
.chart-plot {
  pointer-events: none;
  display: block;
  width: 100%;
  height: 240px;
  overflow: visible;
}
.inspection-line {
  stroke: var(--navy);
  stroke-opacity: 0.6;
  stroke-dasharray: 3 4;
}
.chart-tooltip {
  position: absolute;
  z-index: 2;
  width: min(9.5rem, calc(100% - 1rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--navy);
  box-shadow: 0 6px 20px #0e21381a;
  transform: translateY(calc(-100% - 0.75rem));
  cursor: default;
  line-height: 1.4;
  p {
    margin: 0;
  }
  &.tooltip-below {
    transform: translateY(0.75rem);
  }
}
.tooltip-date {
  font-size: 0.7rem;
  font-weight: 600;
}
.tooltip-hours {
  display: block;
  margin: 0.25rem 0;
  font-size: 1.1rem;
  line-height: 1.3;
}
.tooltip-status,
.tooltip-note {
  font-size: 0.7rem;
  color: var(--muted);
}
.chart-tooltip .tooltip-note {
  margin-top: 0.25rem;
  color: var(--danger-text);
}
.inspection-help {
  margin: 0 0 0.75rem;
  font-size: 0.7rem;
  color: var(--muted);
}
.chart-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
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
.active-point {
  stroke: var(--navy);
  stroke-width: 2;
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
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  summary {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 52px;
    padding: 0.75rem 1rem;
    background: var(--background);
    color: var(--navy);
    border-radius: 11px;
    font-size: 0.8rem;
    font-weight: 600;
    list-style: none;
    cursor: pointer;
    &::-webkit-details-marker {
      display: none;
    }
    &:hover {
      background: #edf0f4;
    }
  }
  &[open] summary {
    border-bottom: 1px solid var(--border);
    border-radius: 11px 11px 0 0;
  }
  &[open] .values-chevron {
    transform: rotate(180deg);
  }
}
.values-count {
  margin-left: auto;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 400;
  white-space: nowrap;
}
.values-chevron {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.values-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  caption {
    padding: 0.75rem 1rem;
    color: var(--muted);
    font-size: 0.7rem;
    text-align: left;
  }
  th,
  td {
    padding: 0.6rem 1rem;
  }
  thead th {
    border-bottom: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 600;
    &:first-child {
      width: 42%;
    }
    &:nth-child(2) {
      width: 24%;
    }
    &:last-child {
      width: 34%;
    }
  }
  tbody tr + tr {
    border-top: 1px solid var(--border);
  }
  tbody th {
    font-weight: 500;
  }
  .value-hours {
    text-align: right;
    white-space: nowrap;
  }
  td.value-hours {
    font-weight: 700;
  }
  .value-status {
    text-align: right;
  }
}
.value-date {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.today-row {
  background: #f0faff;
}
.value-today {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: var(--navy);
  color: var(--surface);
  font-size: 0.7rem;
  font-weight: 700;
}
.values-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  &::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
  }
}
.status-recorded {
  background: #edf9fc;
  color: #13677a;
}
.status-planned {
  background: #edf0f4;
  color: var(--navy);
}
@media (max-width: 480px) {
  .chart-values summary {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  .values-table {
    th,
    td {
      padding: 0.6rem 0.5rem;
    }
    caption {
      padding: 0.75rem 0.5rem;
    }
    thead th:first-child {
      width: 32%;
    }
    thead th:nth-child(2) {
      width: 26%;
    }
    thead th:last-child {
      width: 42%;
    }
  }
  .value-date {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
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
